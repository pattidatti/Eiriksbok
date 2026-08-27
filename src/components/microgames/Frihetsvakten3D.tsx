import { useCallback, useEffect, useRef, useState } from 'react';
import {
    MicroGameScaffold,
    Interactive,
    GroundPlane,
    Column,
    Arch,
    Torch,
    Person,
    Particles,
    Burst,
    Impact,
    GlowMaterial,
    SceneBanner,
    SceneBadge,
    WinScreen,
    LoseScreen,
    MeterBar,
    TimerPill,
    useMeter,
    useGameClock,
    useRandomPulse,
    useShake,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Lyspære: da riksdagen overtok makten fra kongen, ble hver enkelt stemme verdt
// å kjøpe. Fremmede makter la penger på benkene i Stockholm. Eleven må rekke å
// slå fra seg pengepungene før de virker. Klarer hen det ikke, blir salen kjøpt
// og lammet - og det var nettopp i det tomrommet Gustav 3 tok makten i 1772.

const SPILLETID = 70; // sekunder én riksdagssamling varer i spillet
const FRIST_MS = 3600; // hvor lenge eleven har på seg før pengene virker
const PRESS_PER_KJOPT = 0.135; // 8 kjøpte stemmer fyller måleren

const BENK_TOPP = 0.44;

interface Stand {
    id: string;
    navn: string;
    x: number;
    z: number;
    drakt: string;
    bein: string;
    hatt: 'cap' | 'hood' | 'none';
    hattFarge: string;
}

// De fire stendene som satt i riksdagen under frihetstiden.
const STENDER: Stand[] = [
    { id: 'adel', navn: 'Adelen', x: -4.6, z: -0.9, drakt: '#3f4d7a', bein: '#2b3454', hatt: 'cap', hattFarge: '#1f2947' },
    { id: 'prest', navn: 'Prestene', x: -1.55, z: -1.9, drakt: '#2f3238', bein: '#22242a', hatt: 'hood', hattFarge: '#1b1d22' },
    { id: 'borger', navn: 'Borgerne', x: 1.55, z: -1.9, drakt: '#7a4a2c', bein: '#4e3020', hatt: 'cap', hattFarge: '#5c3520' },
    { id: 'bonde', navn: 'Bøndene', x: 4.6, z: -0.9, drakt: '#6b6a45', bein: '#464530', hatt: 'hood', hattFarge: '#57562f' },
];

type Status = 'fri' | 'truet' | 'kjopt';

interface Delegat {
    id: string;
    standId: string;
    standNavn: string;
    x: number;
    z: number;
    status: Status;
    frist: number; // tidspunkt (ms) da pengene virker
}

function byggDelegater(): Delegat[] {
    const liste: Delegat[] = [];
    for (const s of STENDER) {
        for (let i = 0; i < 3; i++) {
            liste.push({
                id: `${s.id}-${i}`,
                standId: s.id,
                standNavn: s.navn,
                x: s.x + (i - 1) * 0.84,
                z: s.z,
                status: 'fri',
                frist: 0,
            });
        }
    }
    return liste;
}

const FARGE = {
    gulv: '#c9a877',
    benk: '#8a5f38',
    stein: '#e2d6bd',
    trone: '#8f2f2f',
    gull: '#e3b23c',
    kjopt: '#8e99a8',
};

// --- Deler ---------------------------------------------------------------

function Benk({ x, z, bredde }: { x: number; z: number; bredde: number }) {
    return (
        <group position={[x, 0, z]}>
            {/* Setet - bunnen står på gulvet, toppen ligger på BENK_TOPP */}
            <mesh position={[0, BENK_TOPP - 0.07, 0]} castShadow receiveShadow>
                <boxGeometry args={[bredde, 0.14, 0.7]} />
                <meshStandardMaterial color={FARGE.benk} roughness={0.9} />
            </mesh>
            <mesh position={[-bredde / 2 + 0.12, (BENK_TOPP - 0.14) / 2, 0]} castShadow>
                <boxGeometry args={[0.16, BENK_TOPP - 0.14, 0.6]} />
                <meshStandardMaterial color={FARGE.benk} roughness={0.95} />
            </mesh>
            <mesh position={[bredde / 2 - 0.12, (BENK_TOPP - 0.14) / 2, 0]} castShadow>
                <boxGeometry args={[0.16, BENK_TOPP - 0.14, 0.6]} />
                <meshStandardMaterial color={FARGE.benk} roughness={0.95} />
            </mesh>
            {/* Ryggen */}
            <mesh position={[0, BENK_TOPP + 0.34, -0.36]} castShadow>
                <boxGeometry args={[bredde, 0.68, 0.1]} />
                <meshStandardMaterial color="#6f4c2c" roughness={0.95} />
            </mesh>
        </group>
    );
}

// Pengepungen som ligger igjen ved en delegat.
function Pengepung({ virker }: { virker: boolean }) {
    return (
        <group position={[0.34, BENK_TOPP + 0.16, 0.28]}>
            <mesh castShadow>
                <sphereGeometry args={[0.15, 12, 10]} />
                <meshStandardMaterial color={virker ? '#7c6a2e' : '#b8912f'} roughness={0.6} />
            </mesh>
            {!virker && (
                <mesh position={[0, 0.02, 0]}>
                    <sphereGeometry args={[0.27, 12, 10]} />
                    <GlowMaterial color="#ffd24a" />
                </mesh>
            )}
        </group>
    );
}

// Den tomme tronen bak salen: kongen sitter der ikke lenger.
function TomTrone() {
    return (
        <group position={[0, 0, -6.6]}>
            <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
                <boxGeometry args={[4.4, 0.32, 2.4]} />
                <meshStandardMaterial color={FARGE.stein} roughness={0.95} />
            </mesh>
            <mesh position={[0, 0.32 + 0.26, 0]} castShadow>
                <boxGeometry args={[1.1, 0.14, 0.9]} />
                <meshStandardMaterial color={FARGE.trone} roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.32 + 0.1, 0]} castShadow>
                <boxGeometry args={[0.9, 0.34, 0.7]} />
                <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.32 + 0.82, -0.42]} castShadow>
                <boxGeometry args={[1.1, 1.2, 0.12]} />
                <meshStandardMaterial color={FARGE.trone} roughness={0.85} />
            </mesh>
            {/* Kronen ligger igjen på setet */}
            <mesh position={[0, 0.32 + 0.4, 0.02]} castShadow>
                <cylinderGeometry args={[0.17, 0.17, 0.12, 10]} />
                <meshStandardMaterial color={FARGE.gull} metalness={0.6} roughness={0.35} />
            </mesh>
        </group>
    );
}

// --- Scenen --------------------------------------------------------------

interface SceneProps {
    delegater: Delegat[];
    spiller: boolean;
    kjoptTeller: number;
    reddetTeller: number;
    sisteHendelse: [number, number, number] | null;
    onVelg: (d: Delegat) => void;
}

function Scene({
    delegater,
    spiller,
    kjoptTeller,
    reddetTeller,
    sisteHendelse,
    onVelg,
}: SceneProps) {
    const { ref: shakeRef, shake } = useShake(0.2, 0.05);
    const forrigeKjopt = useRef(0);

    useEffect(() => {
        if (kjoptTeller !== forrigeKjopt.current) {
            forrigeKjopt.current = kjoptTeller;
            shake(0.7);
        }
    }, [kjoptTeller, shake]);

    return (
        <group ref={shakeRef}>
            <GroundPlane size={34} depth={30} color={FARGE.gulv} />

            {/* Salen: søyler og buer langs veggene */}
            <group userData={{ sceneAuditIgnore: true }}>
                {[-8.2, 8.2].map((x) =>
                    [-5.4, -2.2, 0.9].map((z) => (
                        <Column key={`s-${x}-${z}`} position={[x, 0, z]} height={5} radius={0.34} color={FARGE.stein} />
                    ))
                )}
                <Arch position={[0, 0, -9.2]} width={6} height={4.4} color={FARGE.stein} />
                <Torch position={[-8.2, 0, -5.4]} height={2.6} lit />
                <Torch position={[8.2, 0, -5.4]} height={2.6} lit />
            </group>

            <TomTrone />

            {/* Benkene - én per stand */}
            {STENDER.map((s) => (
                <Benk key={s.id} x={s.x} z={s.z} bredde={2.9} />
            ))}

            {/* Delegatene */}
            {delegater.map((d) => {
                const stand = STENDER.find((s) => s.id === d.standId)!;
                const kjopt = d.status === 'kjopt';
                const truet = d.status === 'truet';
                return (
                    <Interactive
                        key={d.id}
                        position={[d.x, 0, d.z]}
                        onSelect={() => onVelg(d)}
                        disabled={!spiller || d.status !== 'truet'}
                        state={kjopt ? 'wrong' : truet ? 'selected' : 'idle'}
                        hitArea={truet ? [1.5, 2.2, 1.5] : [0.6, 1.4, 0.6]}
                        hoverScale={1.1}
                        sound={null}
                    >
                        <group>
                            {/* 'sit' senker figuren 0,16 - kompenser så beina hviler på setet */}
                            <Person
                                position={[0, BENK_TOPP + (truet ? 0 : 0.16), 0]}
                                body={kjopt ? FARGE.kjopt : stand.drakt}
                                legs={kjopt ? '#6d7681' : stand.bein}
                                hat={stand.hatt}
                                hatColor={kjopt ? '#6d7681' : stand.hattFarge}
                                pose={truet ? 'raise' : 'sit'}
                                scale={0.95}
                            />
                            {(truet || kjopt) && <Pengepung virker={kjopt} />}
                        </group>
                    </Interactive>
                );
            })}

            {sisteHendelse && (
                <>
                    <Burst position={sisteHendelse} trigger={reddetTeller} color="#ffd24a" spread={1.8} />
                    <Impact preset="dustPuff" trigger={kjoptTeller} position={sisteHendelse} />
                </>
            )}

            {/* Støv i lyset - ren atmosfære */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="motes" count={50} area={[15, 12]} height={4.2} />
            </group>
        </group>
    );
}

// --- Spillet -------------------------------------------------------------

type Fase = 'spiller' | 'vunnet' | 'tapt';

export default function Frihetsvakten3D({ onComplete, onRetry }: MicroGameProps) {
    const [fase, setFase] = useState<Fase>('spiller');
    const [delegater, setDelegater] = useState<Delegat[]>(byggDelegater);
    const [reddet, setReddet] = useState(0);
    const [kjopt, setKjopt] = useState(0);
    const [sisteHendelse, setSisteHendelse] = useState<[number, number, number] | null>(null);
    const [melding, setMelding] = useState<string | null>(null);
    const ferdigRef = useRef(false);
    const { play } = useStepSounds();

    const taptNa = useCallback(() => {
        if (ferdigRef.current) return;
        ferdigRef.current = true;
        setFase('tapt');
        play('incorrect');
    }, [play]);

    const press = useMeter({ drainPerSecond: 0, overloadAt: 1, onOverload: taptNa });

    const vunnetNa = useCallback(() => {
        if (ferdigRef.current) return;
        ferdigRef.current = true;
        setFase('vunnet');
        play('complete');
        onComplete({ score: 1, completed: true });
    }, [onComplete, play]);

    const klokke = useGameClock({
        seconds: SPILLETID,
        running: fase === 'spiller',
        onExpire: vunnetNa,
    });

    // Fremmede sendemenn legger penger på benkene. Velg en ledig delegat.
    const leggUtPenger = useCallback(() => {
        setDelegater((liste) => {
            const ledige = liste.filter((d) => d.status === 'fri');
            if (ledige.length === 0) return liste;
            const valgt = ledige[Math.floor(Math.random() * ledige.length)];
            return liste.map((d) =>
                d.id === valgt.id
                    ? { ...d, status: 'truet', frist: performance.now() + FRIST_MS }
                    : d
            );
        });
    }, []);

    useRandomPulse({
        running: fase === 'spiller',
        minDelayMs: 1900,
        maxDelayMs: 3800,
        onPulse: leggUtPenger,
    });

    // Andre halvdel av samlingen: pengene kommer tettere.
    useRandomPulse({
        running: fase === 'spiller' && klokke.remaining < SPILLETID / 2,
        minDelayMs: 2400,
        maxDelayMs: 4600,
        onPulse: leggUtPenger,
    });

    // Speil av delegatene så intervallet kan lese dem uten å gjøre bivirkninger
    // inne i en state-oppdaterer.
    const delegaterRef = useRef(delegater);
    useEffect(() => {
        delegaterRef.current = delegater;
    }, [delegater]);

    const pressAdd = press.add;

    // Én lett puls som sjekker frister. Ikke per frame - hvert 200. millisekund.
    useEffect(() => {
        if (fase !== 'spiller') return;
        const id = window.setInterval(() => {
            const naa = performance.now();
            const forfalt = delegaterRef.current.filter(
                (d) => d.status === 'truet' && d.frist <= naa
            );
            if (forfalt.length === 0) return;
            const forste = forfalt[0];
            const forfaltIder = new Set(forfalt.map((d) => d.id));
            setDelegater((liste) =>
                liste.map((d) => (forfaltIder.has(d.id) ? { ...d, status: 'kjopt' } : d))
            );
            setSisteHendelse([forste.x, BENK_TOPP + 0.6, forste.z]);
            setKjopt((k) => k + forfalt.length);
            pressAdd(PRESS_PER_KJOPT * forfalt.length);
            play('incorrect');
            setMelding(
                `${forste.standNavn} mistet en stemme. Pengene fra utlandet virket, og den stemmen er kjøpt ut samlingen.`
            );
        }, 200);
        return () => window.clearInterval(id);
    }, [fase, pressAdd, play]);

    const velg = (d: Delegat) => {
        if (fase !== 'spiller' || d.status !== 'truet') return;
        setDelegater((liste) =>
            liste.map((x) => (x.id === d.id ? { ...x, status: 'fri', frist: 0 } : x))
        );
        setSisteHendelse([d.x, BENK_TOPP + 0.6, d.z]);
        setReddet((r) => r + 1);
        play('correct');
        setMelding(
            `Pengene ble skjøvet tilbake. ${d.standNavn} stemmer fortsatt for det de selv mener.`
        );
    };

    const nullstill = () => {
        setFase('spiller');
        setDelegater(byggDelegater());
        setReddet(0);
        setKjopt(0);
        setSisteHendelse(null);
        setMelding(null);
        press.reset();
        klokke.restart();
        ferdigRef.current = false;
        onRetry?.();
    };

    const truet = delegater.filter((d) => d.status === 'truet').length;

    const banner =
        fase === 'vunnet'
            ? 'Samlingen er over, og riksdagen bestemmer fortsatt selv.'
            : fase === 'tapt'
              ? 'For mange stemmer var kjøpt. Riksdagen klarte ikke å bestemme noe.'
              : truet > 0
                ? `Penger på ${truet} ${truet === 1 ? 'benk' : 'benker'}. Klikk delegaten som lyser!`
                : 'Hold øye med benkene. Klikk straks noen får en pengepung.';

    return (
        <MicroGameScaffold
            title="Frihetsvakten"
            subtitle="Du er taleman i riksdagen. Fremmede makter legger penger på benkene. Klikk delegaten før pengene virker."
            estimatedSeconds={110}
            onRetry={nullstill}
            scene={
                <Scene
                    delegater={delegater}
                    spiller={fase === 'spiller'}
                    kjoptTeller={kjopt}
                    reddetTeller={reddet}
                    sisteHendelse={sisteHendelse}
                    onVelg={velg}
                />
            }
            canvas={{
                camera: { position: [0, 6.2, 10.5], fov: 46 },
                target: [0, 1.6, -3.0],
                background: '#efe0c4',
                light: 'golden',
                fog: { color: '#efe0c4', near: 24, far: 46 },
                controls: false,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <TimerPill
                        seconds={klokke.remaining}
                        label="Samlingen"
                        warnBelow={15}
                        corner="bl"
                    />
                    <SceneBadge corner="br">Gul pung = penger på benken</SceneBadge>
                </>
            }
        >
            <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="text-emerald-600">Reddet: {reddet}</span>
                    <span className="text-rose-600">Kjøpt: {kjopt}</span>
                    <span>{delegater.length} delegater i salen</span>
                </div>
                <MeterBar
                    value={press.value}
                    label="Utenlandsk press"
                    hint="Hver kjøpte stemme gjør det vanskeligere for riksdagen å bestemme noe selv."
                    warnAt={0.45}
                    dangerAt={0.75}
                />
                {fase === 'vunnet' ? (
                    <WinScreen title="Riksdagen bestemte selv" onReplay={nullstill}>
                        Du holdt salen fri denne gangen. I virkeligheten gikk det ikke slik. Da
                        riksdagen overtok makten fra kongen, ble hver enkelt stemme verdt å kjøpe,
                        og Russland, Frankrike og Storbritannia betalte for stemmer i Stockholm. I
                        1772 brukte Gustav 3 nettopp dette som grunn da han tok makten tilbake.
                    </WinScreen>
                ) : fase === 'tapt' ? (
                    <LoseScreen title="Salen var kjøpt" onRetry={nullstill}>
                        Med for mange kjøpte stemmer klarte ikke riksdagen å bli enig om noe. Det
                        var i et slikt tomrom Gustav 3 red inn 19. august 1772 og tok makten
                        tilbake til kongen. Prøv igjen, og ta de gule pungene med en gang de dukker
                        opp.
                    </LoseScreen>
                ) : (
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {melding ??
                            'Tronen bak deg er tom. Etter 1720 var det de fire stendene i riksdagen som bestemte, ikke kongen. Men da makten lå hos mange, begynte fremmede makter å kjøpe stemmer. Klikk en delegat så snart det ligger en gul pengepung ved siden av. Du har fire sekunder på deg.'}
                    </p>
                )}
            </div>
        </MicroGameScaffold>
    );
}
