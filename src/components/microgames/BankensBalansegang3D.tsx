import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import {
    MicroGameScaffold,
    GroundPlane,
    Building,
    Person,
    Mover,
    Interactive,
    Burst,
    useMeter,
    useGameClock,
    useRandomPulse,
    useShake,
    SceneBanner,
    DataReadout,
    WinScreen,
    LoseScreen,
    MeterBar,
    TimerPill,
    DangerVignette,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: hvert lån banken innvilger LAGER nye penger, men i det
// kunden bruker dem, flytter innskuddet til en annen bank - og da må banken
// sende ekte sentralbankreserver dit. Reserver kan ingen bank lage selv. Det er
// derfor bankene ikke kan lage uendelig mye penger.
//
// Eleven er banken: klikk kundene for å innvilge lån (penger skapes, banken
// tjener), men se reservene renne ut. Går de tomme, er det likviditetskrise.
// Norges Bank kan låne deg reserver, men det koster av overskuddet.

const TIME_LIMIT = 140;
const PROFIT_TARGET = 40; // millioner kroner i overskudd
const SPAWN_Z = 13;
const COUNTER_Z = 2.4; // der kunden stopper foran banken
const OUTFLOW_DELAY = 1500; // ms fra innvilget lån til innskuddet flytter seg

// Trygt lån: lite utlånt, lite reservepress, lite tjent.
// Risikabelt lån: stort beløp, mer press, mer tjent - men kan misligholdes.
const SAFE = { loan: 2, profit: 1.6, drain: 0.095, misligholdRisk: 0 };
const RISKY = { loan: 5, profit: 4.2, drain: 0.2, misligholdRisk: 0.3 };

const NB_COST = 2; // overskudd du gir fra deg for å låne reserver
const NB_RELIEF = 0.6; // hvor mye reservepresset synker
const NB_COOLDOWN = 3500;

type GameState = 'idle' | 'playing' | 'krise' | 'foraSent' | 'won';

interface Kunde {
    id: number;
    x: number;
    risky: boolean;
    status: 'moving' | 'gone';
}

interface Overforing {
    id: number;
    toX: number;
}

const BankensBalansegang3D: React.FC<MicroGameProps> = ({ onComplete, onRetry }) => {
    const sounds = useStepSounds();

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);

    const [kunder, setKunder] = useState<Kunde[]>([]);
    const [overforinger, setOverforinger] = useState<Overforing[]>([]);
    const [skapt, setSkapt] = useState(0); // millioner kroner nye penger
    const [overskudd, setOverskudd] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [nbKlar, setNbKlar] = useState(true);

    // Speil av staten som timere og callbacks kan lese uten å bli gjenskapt.
    const gameStateRef = useRef<GameState>('idle');
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Overskuddet oppdateres synkront via ref, så seiersjekken kan skje i samme
    // hendelse som pengene kommer inn (ingen setState-i-effect-kaskade).
    const overskuddRef = useRef(0);
    const endreOverskudd = useCallback((delta: number) => {
        const neste = overskuddRef.current + delta;
        overskuddRef.current = neste;
        setOverskudd(neste);
        return neste;
    }, []);

    const idRef = useRef(0);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Rydd alle utestående utbetalings-timere ved omstart og unmount, ellers
    // tikker et gammelt forsøk inn i et nytt.
    const clearTimers = useCallback(() => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    }, []);
    useEffect(() => clearTimers, [clearTimers]);

    const later = useCallback((fn: () => void, ms: number) => {
        const t = setTimeout(fn, ms);
        timersRef.current.push(t);
    }, []);

    // useShake bruker useFrame og må derfor bo inne i Canvas (i BankScene).
    // DOM-siden ber om rist ved å legge trauma i denne refen; scenen tømmer den.
    const shakeReqRef = useRef(0);
    const shake = useCallback((amount: number) => {
        shakeReqRef.current += amount;
    }, []);

    // Seier: nådde overskuddsmålet mens du fortsatt hadde reserver igjen.
    const vinn = useCallback(() => {
        if (gameStateRef.current !== 'playing') return;
        gameStateRef.current = 'won';
        setGameState('won');
        setBanner(null);
        clearTimers();
        setBurst((b) => b + 1);
        sounds.play('complete');
    }, [clearTimers, sounds]);

    const slutt = useCallback(
        (kind: 'krise' | 'foraSent') => {
            if (gameStateRef.current !== 'playing') return;
            gameStateRef.current = kind;
            setGameState(kind);
            setFails((f) => f + 1);
            setBanner(null);
            clearTimers();
            shake(0.9);
            sounds.play('incorrect');
        },
        [clearTimers, shake, sounds]
    );

    // Reservepress: 0 = full dekning, 1 = reservene er tomme.
    // Måleren synker sakte av seg selv, fordi innskudd fra andre banker også
    // renner inn igjen.
    const reserve = useMeter({
        drainPerSecond: 0.042,
        overloadAt: 1,
        recoverTo: 0.55,
        onOverload: () => slutt('krise'),
    });

    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => {
            if (overskuddRef.current >= PROFIT_TARGET) return;
            slutt('foraSent');
        },
    });

    // Nye lånekunder kommer uansett hva eleven gjør - verdenen har egen puls.
    useRandomPulse({
        running: gameState === 'playing',
        minDelayMs: 1600,
        maxDelayMs: 3200,
        onPulse: () => {
            if (gameStateRef.current !== 'playing') return;
            const id = ++idRef.current;
            setKunder((k) => [
                ...k.slice(-7),
                {
                    id,
                    x: -4.6 + Math.random() * 9.2,
                    risky: Math.random() < 0.42,
                    status: 'moving',
                },
            ]);
        },
    });

    const fjernKunde = useCallback((id: number) => {
        setKunder((k) => k.filter((c) => c.id !== id));
    }, []);

    const innvilg = useCallback(
        (kunde: Kunde) => {
            if (gameStateRef.current !== 'playing') return;
            const spec = kunde.risky ? RISKY : SAFE;

            setKunder((k) => k.filter((c) => c.id !== kunde.id));
            setSkapt((s) => s + spec.loan);
            const nyttOverskudd = endreOverskudd(spec.profit);
            setBanner(
                kunde.risky
                    ? `Risikabelt lån: ${spec.loan} millioner nye kroner skapt`
                    : `Lån innvilget: ${spec.loan} millioner nye kroner skapt`
            );
            sounds.play('correct');
            setBurst((b) => b + 1);

            // Kunden bruker lånet: innskuddet flytter til en annen bank, og vi
            // må sende sentralbankreserver etter.
            later(() => {
                if (gameStateRef.current !== 'playing') return;
                const mislighold = Math.random() < spec.misligholdRisk;
                reserve.add(mislighold ? spec.drain + 0.23 : spec.drain);
                setOverforinger((o) => [
                    ...o.slice(-5),
                    { id: ++idRef.current, toX: Math.random() < 0.5 ? -8.5 : 8.5 },
                ]);
                if (mislighold) {
                    shake(0.7);
                    sounds.play('incorrect');
                    setBanner('Låntakeren klarte ikke å betale. Banken tok tapet.');
                } else {
                    setBanner('Innskuddet flyttet til en annen bank. Reserver sendt etter.');
                }
            }, OUTFLOW_DELAY);

            if (nyttOverskudd >= PROFIT_TARGET) vinn();
        },
        [endreOverskudd, later, reserve, shake, sounds, vinn]
    );

    const lanFraNorgesBank = useCallback(() => {
        if (gameStateRef.current !== 'playing' || !nbKlar) return;
        setNbKlar(false);
        reserve.add(-NB_RELIEF);
        endreOverskudd(-NB_COST);
        setBanner('Du lånte reserver av Norges Bank. Det koster renter.');
        sounds.play('advance');
        later(() => setNbKlar(true), NB_COOLDOWN);
    }, [endreOverskudd, later, nbKlar, reserve, sounds]);

    const start = useCallback(() => {
        clearTimers();
        setAttempt((a) => a + 1);
        setKunder([]);
        setOverforinger([]);
        setSkapt(0);
        setOverskudd(0);
        overskuddRef.current = 0;
        setNbKlar(true);
        setBanner('Klikk kundene som kommer gående. Rød jakke betyr risikabelt lån.');
        reserve.reset();
        clock.restart();
        gameStateRef.current = 'playing';
        setGameState('playing');
    }, [clearTimers, reserve, clock]);

    const spiller = gameState === 'playing';
    const score = Math.max(0.5, 1 - fails * 0.15);
    const reserverIgjen = Math.round((1 - reserve.value) * 100);

    return (
        <MicroGameScaffold
            title="Bankens balansegang"
            subtitle="Du er banken. Lån ut nok til å tjene penger, men ikke mer enn reservene tåler."
            estimatedSeconds={120}
            onRetry={gameState === 'idle' ? onRetry : start}
            scene={
                <BankScene
                    key={attempt}
                    shakeReqRef={shakeReqRef}
                    kunder={kunder}
                    overforinger={overforinger}
                    onInnvilg={innvilg}
                    onKundeGikk={fjernKunde}
                    onOverforingFerdig={(id) =>
                        setOverforinger((o) => o.filter((t) => t.id !== id))
                    }
                    onNorgesBank={lanFraNorgesBank}
                    nbKlar={nbKlar && spiller}
                    spiller={spiller}
                    burst={burst}
                />
            }
            canvas={{
                camera: { position: [0, 11, 22], fov: 46 },
                target: [0, 1.2, 3.5],
                background: '#dfe6ea',
                fog: { color: '#dfe6ea', near: 34, far: 66 },
                idle: gameState === 'idle',
                enablePan: false,
                enableZoom: false,
                light: 'overcast',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Penger skapt', value: skapt, unit: 'mill' },
                            {
                                label: 'Overskudd',
                                value: `${Math.round(overskudd * 10) / 10} / ${PROFIT_TARGET}`,
                                unit: 'mill',
                            },
                            {
                                label: 'Reserver igjen',
                                value: Math.max(0, reserverIgjen),
                                unit: '%',
                            },
                        ]}
                    />
                    {spiller && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Igjen"
                            warnBelow={15}
                            corner="br"
                        />
                    )}
                    <DangerVignette level={Math.max(0, (reserve.value - 0.6) / 0.4)} />
                </>
            }
        >
            {/* Kontrollområdet under vinduet: status og støtteknapp. */}
            <div className="space-y-3">
                <MeterBar
                    value={reserve.value}
                    label="Reservepress"
                    hint="Hvert lån som blir brukt, sender sentralbankreserver til en annen bank. Reserver kan du ikke lage selv."
                    labels={{ normal: 'God dekning', warn: 'Tynn dekning', danger: 'TOMT!' }}
                />

                {gameState === 'idle' && (
                    <button
                        onClick={start}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Åpne banken
                    </button>
                )}

                {spiller && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={lanFraNorgesBank}
                            disabled={!nbKlar}
                            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                                nbKlar
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            {nbKlar
                                ? `Lån reserver av Norges Bank (koster ${NB_COST} mill)`
                                : 'Norges Bank behandler søknaden...'}
                        </button>
                        <span className="text-xs text-slate-500">
                            Du kan også klikke Norges Bank-bygget bakerst i scenen.
                        </span>
                    </div>
                )}

                {gameState === 'won' && (
                    <WinScreen
                        title={`Du nådde ${PROFIT_TARGET} millioner uten å gå tom for reserver`}
                        onReplay={start}
                        onNext={() => onComplete({ score, completed: true })}
                    >
                        Du laget {skapt} millioner kroner som ikke fantes før. Ingen andres konto
                        ble tømt. Men hver krone du lånte ut, tappet reservene i det kunden brukte
                        den. Det er den bremsen som hindrer bankene i å lage uendelig mye penger.
                    </WinScreen>
                )}

                {gameState === 'krise' && (
                    <LoseScreen title="Likviditetskrise" onRetry={start}>
                        Reservene er tomme. Banken din kan lage innskudd, men ikke
                        sentralbankreserver, og uten dem klarer den ikke å gjøre opp med de andre
                        bankene. Lån ut litt saktere, og hent reserver hos Norges Bank før det blir
                        kritisk.
                    </LoseScreen>
                )}

                {gameState === 'foraSent' && (
                    <LoseScreen title="Banken tjente ikke nok" onRetry={start}>
                        Du holdt reservene trygge, men tjente for lite. En bank som ikke låner ut,
                        tjener ingenting. Det er nettopp denne avveiningen mellom lønnsomhet og
                        likviditet ekte banker står i hver eneste dag.
                    </LoseScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

export default BankensBalansegang3D;

// Skilt over et bygg. Uten dem vet ikke eleven hvilket hus som er hva.
function Skilt({
    position,
    tekst,
    farge = '#1e293b',
}: {
    position: [number, number, number];
    tekst: string;
    farge?: string;
}) {
    return (
        <Billboard position={position}>
            <Html center distanceFactor={17} style={{ pointerEvents: 'none' }} zIndexRange={[5, 0]}>
                <div
                    style={{
                        background: farge,
                        color: '#fff',
                        padding: '3px 10px',
                        borderRadius: 7,
                        fontSize: 14,
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        fontFamily: 'Inter, sans-serif',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
                    }}
                >
                    {tekst}
                </div>
            </Html>
        </Billboard>
    );
}

// 3D-scenen. Sendes inn via scaffoldens `scene`-prop; kontrollene under vinduet
// ligger i `children`.
function BankScene({
    shakeReqRef,
    kunder,
    overforinger,
    onInnvilg,
    onKundeGikk,
    onOverforingFerdig,
    onNorgesBank,
    nbKlar,
    spiller,
    burst,
}: {
    shakeReqRef: React.MutableRefObject<number>;
    kunder: Kunde[];
    overforinger: Overforing[];
    onInnvilg: (k: Kunde) => void;
    onKundeGikk: (id: number) => void;
    onOverforingFerdig: (id: number) => void;
    onNorgesBank: () => void;
    nbKlar: boolean;
    spiller: boolean;
    burst: number;
}) {
    const { ref: shakeRef, shake } = useShake(0.28, 0.05, 2.2);
    useFrame(() => {
        if (shakeReqRef.current > 0) {
            shake(shakeReqRef.current);
            shakeReqRef.current = 0;
        }
    });

    return (
        <group ref={shakeRef}>
            <GroundPlane size={80} depth={80} color="#a9b08f" />
            {/* Torget foran banken: der kundene kommer gående */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 7]} receiveShadow>
                <planeGeometry args={[15, 16]} />
                <meshStandardMaterial color="#d6d1c4" roughness={1} />
            </mesh>

            {/* Din bank i midten */}
            <group position={[0, 0, 0]}>
                <Building
                    position={[0, 0, 0]}
                    body="#e8e2d4"
                    roof="#2f4858"
                    w={5}
                    h={2.6}
                    d={3.4}
                />
                <Building
                    position={[0, 0, 1.9]}
                    body="#d9d2c2"
                    roof="#2f4858"
                    w={2.2}
                    h={1.1}
                    d={0.9}
                />
                <Skilt position={[0, 3.9, 0]} tekst="DIN BANK" farge="#1d4ed8" />
            </group>

            {/* Nabobanker */}
            <Building
                position={[-8.5, 0, -1.5]}
                body="#cfd6d8"
                roof="#4a5a63"
                w={3.4}
                h={1.9}
                d={2.6}
            />
            <Skilt position={[-8.5, 3.1, -1.5]} tekst="Annen bank" farge="#475569" />
            <Building
                position={[8.5, 0, -1.5]}
                body="#cfd6d8"
                roof="#4a5a63"
                w={3.4}
                h={1.9}
                d={2.6}
            />
            <Skilt position={[8.5, 3.1, -1.5]} tekst="Annen bank" farge="#475569" />

            {/* Norges Bank bakerst - klikkbar redningsluke */}
            <Interactive
                onSelect={onNorgesBank}
                disabled={!nbKlar}
                position={[0, 0, -10]}
                hitArea={[7, 5, 4]}
                hoverScale={1.05}
                sound="advance"
            >
                <group>
                    <Building
                        position={[0, 0, 0]}
                        body={nbKlar ? '#f2ead6' : '#d8d4cb'}
                        roof="#7a3b2e"
                        w={6.4}
                        h={3.4}
                        d={3}
                    />
                    {/* Søylerad foran fasaden */}
                    {[-2.1, -0.7, 0.7, 2.1].map((x) => (
                        <mesh key={x} position={[x, 1.35, 1.7]} castShadow>
                            <cylinderGeometry args={[0.22, 0.22, 2.7, 10]} />
                            <meshStandardMaterial color="#fbf6e8" roughness={0.85} />
                        </mesh>
                    ))}
                    <Skilt
                        position={[0, 4.6, 0]}
                        tekst={
                            nbKlar ? 'NORGES BANK - klikk for reserver' : 'NORGES BANK - opptatt'
                        }
                        farge={nbKlar ? '#b45309' : '#78716c'}
                    />
                </group>
            </Interactive>

            {/* Lånekunder på vei mot banken din */}
            {kunder.map((k) => (
                <Mover
                    key={k.id}
                    from={[k.x, 0, SPAWN_Z]}
                    to={[k.x * 0.35, 0, COUNTER_Z]}
                    speed={1.5}
                    state={k.status}
                    phase={k.id}
                    hitArea={[1.8, 2.6, 1.6]}
                    onArrive={() => onKundeGikk(k.id)}
                >
                    <Interactive
                        onSelect={() => spiller && onInnvilg(k)}
                        disabled={!spiller}
                        hitArea={[1.8, 2.6, 1.6]}
                        hoverScale={1.12}
                        sound="select"
                    >
                        <Person
                            pose="walk"
                            scale={1.75}
                            body={k.risky ? '#c0392b' : '#3f7d5c'}
                            legs="#3a4048"
                            hat={k.risky ? 'cap' : 'none'}
                            hatColor="#8e2a1f"
                        />
                    </Interactive>
                </Mover>
            ))}

            {/* Reserver som flyr ut til nabobankene */}
            {overforinger.map((o) => (
                <Mover
                    key={o.id}
                    from={[0, 1.4, 0.6]}
                    to={[o.toX, 1.4, -1.5]}
                    speed={7}
                    bob={0}
                    face={false}
                    onArrive={() => onOverforingFerdig(o.id)}
                >
                    <mesh castShadow>
                        <sphereGeometry args={[0.32, 14, 12]} />
                        <meshStandardMaterial
                            color="#f0b429"
                            emissive="#8a5a00"
                            emissiveIntensity={0.45}
                            roughness={0.35}
                        />
                    </mesh>
                </Mover>
            ))}

            <Burst
                position={[0, 2.4, 1.4]}
                trigger={burst}
                color="#34d399"
                count={22}
                spread={3.4}
            />
        </group>
    );
}
