import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    MicroGameScaffold,
    Interactive,
    Mover,
    Person,
    Building,
    Wall,
    Tree,
    Rock,
    Cart,
    Animal,
    GroundPlane,
    GlowHalo,
    Particles,
    useMeter,
    useGameClock,
    TimerPill,
    MeterBar,
    DataReadout,
    SceneBanner,
    LoseScreen,
    WinScreen,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: assimilering virket ikke bare gjennom forbud. Den virket
// ved at det ble FARLIG å bruke sin egen kultur. På Svanviken var romani,
// musikken og kontakten med slekta forbudt, hjemmene ble inspisert, og
// familier som brøt reglene kunne miste barna. Eleven kjenner doseringen på
// kroppen: hold kulturen i live mens bestyreren er langt unna, og stopp i tide
// når han nærmer seg.

type GameState = 'idle' | 'playing' | 'meldt' | 'tapt' | 'won';
type HandlingId = 'fela' | 'ordene' | 'brevet';

const KONTRAKT_TID = 80;
// Hvor fort hver aktive handling fyller kulturmåleren (per sekund).
const KULTUR_RATE = 0.024;
// Grunnrisiko per aktive handling, og hvor mye nærheten til bestyreren øker den.
const MISTANKE_BASIS = 0.025;
const MISTANKE_NAER = 0.44;
// Innenfor denne avstanden begynner bestyreren å legge merke til noe.
const SYNSVIDDE = 5.5;

const HUS_Z = -2.4;
const VEI_Z = 1.8;
const FAMILIE_X = -2.4;
// Dørstokken: handlingene ligger her, og det er HERFRA faren måles. Avstanden
// eleven leser av må gjelde samme punkt som risikoen regnes fra.
const DOR_Z = -0.6;

interface Handling {
    id: HandlingId;
    navn: string;
    posisjon: [number, number, number];
    farge: string;
    hint: string;
}

const HANDLINGER: Handling[] = [
    {
        id: 'fela',
        navn: 'Spille fela',
        posisjon: [-4.6, 0, -0.4],
        farge: '#d97706',
        hint: 'Musikken er forbudt her. Men den er deres.',
    },
    {
        id: 'ordene',
        navn: 'Snakke romani',
        posisjon: [-2.4, 0, -0.6],
        farge: '#0891b2',
        hint: 'Mor lærer barnet ordene sine i det stille.',
    },
    {
        id: 'brevet',
        navn: 'Skrive til slekta',
        posisjon: [-0.2, 0, -0.2],
        farge: '#7c3aed',
        hint: 'Posten blir lest. Brevet må skrives når ingen ser.',
    },
];

// ---- Scene-deler ----

// Bestyrerens hus, arbeiderboligene og gjerdet. Boligene er helt like med vilje:
// alle familier fikk hver sin identiske lille bolig.
function Kolonien() {
    return (
        <>
            <GroundPlane size={40} depth={30} color="#7f8f63" />

            {/* Grusveien bestyreren går på */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, VEI_Z]} receiveShadow>
                <planeGeometry args={[24, 1.8]} />
                <meshStandardMaterial color="#b9ad93" roughness={1} />
            </mesh>

            {/* Fire like arbeiderboliger */}
            {[-5.4, FAMILIE_X, 0.6, 3.6].map((x) => (
                <Building
                    key={x}
                    position={[x, 0, HUS_Z]}
                    w={2.3}
                    h={1.5}
                    d={2.0}
                    body="#d8d2c4"
                    roof="#6b4b3a"
                />
            ))}

            {/* Bestyrerboligen: større, og den ser ut over hele tunet */}
            <Building position={[6.8, 0, -4.4]} w={3.4} h={2.2} d={2.8} body="#b8482f" roof="#4a3226" />

            {/* Gjerdet som lukker kolonien inne, bak boligrekka */}
            <Wall position={[0, 0, -7.4]} length={16} height={1.1} thickness={0.16} color="#8d8375" />

            {/* Litt liv i landskapet */}
            <Tree position={[-7.6, 0, -5.0]} leaf="#4b6b41" seed={2} />
            <Tree position={[-6.2, 0, -6.2]} leaf="#43613a" seed={7} />
            <Tree position={[2.6, 0, -6.3]} leaf="#4b6b41" seed={4} />
            <Tree position={[4.1, 0, -6.3]} leaf="#415c39" seed={9} />
            {/* Vogna og hesten som en gang bar familien rundt, nå parkert */}
            <Cart position={[-5.0, 0, 3.2]} rotation={[0, 0.35, 0]} color="#6b5540" wheel="#4a3a2a" />
            <Animal position={[-3.2, 0, 3.4]} kind="horse" color="#6f5442" rotation={[0, Math.PI / 2, 0]} />
            <Rock position={[-7.0, 0, 2.4]} scale={0.8} color="#8f9298" />
            <Rock position={[5.4, 0, 3.8]} scale={0.65} color="#8f9298" />
        </>
    );
}

// De tre kulturhandlingene. Hver er et klikkbart objekt utenfor familiens bolig.
function HandlingObjekt({
    handling,
    aktiv,
    laast,
    onToggle,
}: {
    handling: Handling;
    aktiv: boolean;
    laast: boolean;
    onToggle: () => void;
}) {
    const { id, posisjon, farge } = handling;
    return (
        <Interactive
            position={posisjon}
            onSelect={laast ? undefined : onToggle}
            disabled={laast}
            state={aktiv ? 'selected' : 'idle'}
            hitArea={[1.9, 2.3, 1.9]}
            hoverScale={1.06}
        >
            <group>
                {id === 'fela' && (
                    <>
                        {/* Krakk med fela på */}
                        <mesh position={[0, 0.22, 0]} castShadow>
                            <cylinderGeometry args={[0.3, 0.34, 0.44, 10]} />
                            <meshStandardMaterial color="#7a5b3c" roughness={0.95} />
                        </mesh>
                        <mesh position={[0, 0.52, 0]} rotation={[0, 0, 0.35]} castShadow>
                            <boxGeometry args={[0.5, 0.12, 0.2]} />
                            <meshStandardMaterial color="#a8552a" roughness={0.6} />
                        </mesh>
                        <mesh position={[0.36, 0.62, 0]} rotation={[0, 0, 0.35]} castShadow>
                            <boxGeometry args={[0.42, 0.05, 0.05]} />
                            <meshStandardMaterial color="#6b4326" roughness={0.7} />
                        </mesh>
                    </>
                )}

                {id === 'ordene' && (
                    <>
                        <Person
                            position={[-0.22, 0, 0]}
                            body="#6b5a7a"
                            legs="#3a3240"
                            pose="idle"
                            hat="hood"
                            hatColor="#5c4b6b"
                        />
                        <Person position={[0.26, 0, 0.12]} scale={0.66} body="#8a6d52" legs="#4a3b2e" pose="idle" />
                    </>
                )}

                {id === 'brevet' && (
                    <>
                        {/* Postkassestolpe */}
                        <mesh position={[0, 0.4, 0]} castShadow>
                            <cylinderGeometry args={[0.07, 0.08, 0.8, 8]} />
                            <meshStandardMaterial color="#6b5540" roughness={0.95} />
                        </mesh>
                        <mesh position={[0, 0.92, 0]} castShadow>
                            <boxGeometry args={[0.44, 0.28, 0.32]} />
                            <meshStandardMaterial color="#4f6b58" roughness={0.8} />
                        </mesh>
                    </>
                )}

                {aktiv && <GlowHalo color={farge} size={1.5} opacity={0.42} />}
            </group>
        </Interactive>
    );
}

// Per-frame-motoren: fyller kultur og mistanke ut fra hvilke handlinger som er
// på, og hvor nær bestyreren er akkurat den handlingen. Leser kun refs.
function Pulsen({
    aktiveRef,
    bestyrerRef,
    kulturAdd,
    mistankeAdd,
    onNaerhet,
    kjorer,
}: {
    aktiveRef: React.MutableRefObject<Record<HandlingId, boolean>>;
    bestyrerRef: React.MutableRefObject<{ x: number; z: number }>;
    kulturAdd: (n: number) => void;
    mistankeAdd: (n: number) => void;
    onNaerhet: (n: number) => void;
    kjorer: boolean;
}) {
    const rapportRef = useRef(0);

    useFrame((_state, dt) => {
        if (!kjorer) return;
        const b = bestyrerRef.current;
        let naermest = 1;

        for (const h of HANDLINGER) {
            if (!aktiveRef.current[h.id]) continue;
            const dx = b.x - h.posisjon[0];
            const dz = b.z - h.posisjon[2];
            const avstand = Math.hypot(dx, dz);
            // 0 = langt unna og trygt, 1 = bestyreren står rett ved siden av.
            const naerhet = Math.max(0, 1 - avstand / SYNSVIDDE);
            naermest = Math.min(naermest, avstand / SYNSVIDDE);

            kulturAdd(dt * KULTUR_RATE);
            mistankeAdd(dt * (MISTANKE_BASIS + MISTANKE_NAER * naerhet * naerhet));
        }

        // Rapporter avstanden til DOM-siden med ~4 Hz, aldri per frame.
        rapportRef.current += dt;
        if (rapportRef.current > 0.25) {
            rapportRef.current = 0;
            const dx = b.x - FAMILIE_X;
            const dz = b.z - DOR_Z;
            onNaerhet(Math.round(Math.hypot(dx, dz)));
        }
        void naermest;
    });

    return null;
}

function KoloniScene({
    gameState,
    aktive,
    aktiveRef,
    bestyrerRef,
    kulturAdd,
    mistankeAdd,
    onNaerhet,
    onToggle,
}: {
    gameState: GameState;
    aktive: Record<HandlingId, boolean>;
    aktiveRef: React.MutableRefObject<Record<HandlingId, boolean>>;
    bestyrerRef: React.MutableRefObject<{ x: number; z: number }>;
    kulturAdd: (n: number) => void;
    mistankeAdd: (n: number) => void;
    onNaerhet: (n: number) => void;
    onToggle: (id: HandlingId) => void;
}) {
    const [etappe, setEtappe] = useState(0);
    const kjorer = gameState === 'playing';

    const fra: [number, number, number] = etappe % 2 === 0 ? [-7.0, 0, VEI_Z] : [7.0, 0, VEI_Z];
    const til: [number, number, number] = etappe % 2 === 0 ? [7.0, 0, VEI_Z] : [-7.0, 0, VEI_Z];

    return (
        <>
            <Kolonien />

            {HANDLINGER.map((h) => (
                <HandlingObjekt
                    key={h.id}
                    handling={h}
                    aktiv={aktive[h.id]}
                    laast={!kjorer}
                    onToggle={() => onToggle(h.id)}
                />
            ))}

            {/* Bestyreren går runden sin, uansett hva eleven gjør */}
            <Mover
                from={fra}
                to={til}
                speed={1.45}
                bob={0.06}
                phase={etappe}
                onArrive={() => setEtappe((e) => e + 1)}
                onMove={(x, _y, z) => {
                    bestyrerRef.current = { x, z };
                }}
            >
                <Person pose="walk" body="#2f3a4a" legs="#232934" hat="cap" hatColor="#2f3a4a" />
            </Mover>

            {/* Ren atmosfære - holdes utenfor scene-revisjonens modellboks */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="motes" />
            </group>

            <Pulsen
                aktiveRef={aktiveRef}
                bestyrerRef={bestyrerRef}
                kulturAdd={kulturAdd}
                mistankeAdd={mistankeAdd}
                onNaerhet={onNaerhet}
                kjorer={kjorer}
            />
        </>
    );
}

// ---- Hovedelement ----

const SvanvikenKontrakten3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [gameState, setGameState] = useState<GameState>('idle');
    const [forsok, setForsok] = useState(0);
    const [tap, setTap] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [avstand, setAvstand] = useState(0);
    const [aktive, setAktive] = useState<Record<HandlingId, boolean>>({
        fela: false,
        ordene: false,
        brevet: false,
    });

    const aktiveRef = useRef<Record<HandlingId, boolean>>({
        fela: false,
        ordene: false,
        brevet: false,
    });
    const bestyrerRef = useRef<{ x: number; z: number }>({ x: -7.0, z: VEI_Z });
    const gameStateRef = useRef<GameState>('idle');
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);
    const tapRef = useRef(0);

    const stoppAlt = useCallback(() => {
        aktiveRef.current = { fela: false, ordene: false, brevet: false };
        setAktive({ fela: false, ordene: false, brevet: false });
    }, []);

    const tapte = useCallback(
        (slag: 'meldt' | 'tapt') => {
            if (gameStateRef.current !== 'playing') return;
            sounds.play('incorrect');
            stoppAlt();
            tapRef.current += 1;
            setTap(tapRef.current);
            setGameState(slag);
        },
        [sounds, stoppAlt]
    );

    // Seier: kulturmåleren er full før kontrakttiden er ute. Vi henger på
    // målerens onOverload i stedet for en effekt, så seieren fyrer nøyaktig én
    // gang uten kaskade-renders.
    const vant = useCallback(() => {
        if (gameStateRef.current !== 'playing') return;
        sounds.play('complete');
        stoppAlt();
        setGameState('won');
        setBanner(null);
        onComplete({ score: Math.max(0.4, 1 - tapRef.current * 0.15), completed: true });
    }, [sounds, stoppAlt, onComplete]);

    const kultur = useMeter({
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.99,
        onOverload: vant,
    });
    const mistanke = useMeter({
        drainPerSecond: 0.13,
        overloadAt: 1,
        recoverTo: 0.4,
        onOverload: () => tapte('meldt'),
    });
    const klokke = useGameClock({
        seconds: KONTRAKT_TID,
        running: gameState === 'playing',
        onExpire: () => {
            if (gameStateRef.current !== 'playing') return;
            if (kultur.peek() >= 0.999) return;
            tapte('tapt');
        },
    });

    const toggle = useCallback(
        (id: HandlingId) => {
            if (gameStateRef.current !== 'playing') return;
            const na = !aktiveRef.current[id];
            aktiveRef.current = { ...aktiveRef.current, [id]: na };
            setAktive((a) => ({ ...a, [id]: na }));
            sounds.play(na ? 'pick' : 'drop');
            if (na) {
                const h = HANDLINGER.find((x) => x.id === id);
                if (h) {
                    setBanner(h.hint);
                    setTimeout(() => setBanner(null), 2400);
                }
            }
        },
        [sounds]
    );

    const start = useCallback(() => {
        stoppAlt();
        gameStateRef.current = 'playing';
        kultur.reset();
        mistanke.reset();
        klokke.restart();
        setAvstand(0);
        setForsok((f) => f + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        setBanner('Trykk på fela, mor og barnet, eller postkassa. Stopp før bestyreren kommer nær!');
        setTimeout(() => setBanner(null), 4200);
    }, [kultur, mistanke, klokke, sounds, stoppAlt]);

    const nullstill = useCallback(() => {
        stoppAlt();
        kultur.reset();
        mistanke.reset();
        setBanner(null);
        setGameState('idle');
    }, [kultur, mistanke, stoppAlt]);

    const antallAktive = Object.values(aktive).filter(Boolean).length;

    return (
        <MicroGameScaffold
            title="Kontrakttiden på Svanviken"
            subtitle="Hold språket, musikken og slekta i live mens bestyreren går runden sin"
            estimatedSeconds={170}
            onRetry={gameState !== 'idle' ? nullstill : undefined}
            canvas={{
                idle: gameState === 'idle',
                camera: { position: [-0.4, 5.0, 11.6] as [number, number, number], fov: 48 },
                target: [-0.8, 1.1, -1.8] as [number, number, number],
                background: '#c3ccd2',
                fog: { color: '#c3ccd2', near: 26, far: 58 },
                light: 'overcast' as const,
            }}
            containerClassName="bg-gradient-to-b from-[#c3ccd2] via-[#d3d6cf] to-[#c9c8b2]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Bestyreren', value: avstand, unit: 'm unna' },
                                { label: 'I gang', value: antallAktive, unit: 'av 3' },
                            ]}
                        />
                    )}
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={klokke.remaining}
                            label="Kontrakttid"
                            warnBelow={18}
                            corner="br"
                        />
                    )}
                </>
            }
            scene={
                <KoloniScene
                    key={forsok}
                    gameState={gameState}
                    aktive={aktive}
                    aktiveRef={aktiveRef}
                    bestyrerRef={bestyrerRef}
                    kulturAdd={kultur.add}
                    mistankeAdd={mistanke.add}
                    onNaerhet={setAvstand}
                    onToggle={toggle}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed max-w-xl mx-auto">
                        Svanviken arbeidskoloni, 1950-tallet. Familien din har skrevet under på en
                        kontrakt. Her er romani, musikken og kontakten med slekta forbudt, og
                        bestyreren inspiserer hjemmene. Trykk på tingene ved boligen for å holde
                        kulturen i live, og trykk igjen for å stoppe. Jo nærmere bestyreren er, jo
                        raskere stiger mistanken.
                    </p>
                    <button
                        onClick={start}
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow"
                    >
                        Begynn kontrakttiden
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                    {HANDLINGER.map((h) => (
                        <button
                            key={h.id}
                            data-handling={h.id}
                            onClick={() => toggle(h.id)}
                            aria-pressed={aktive[h.id]}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                                aktive[h.id]
                                    ? 'bg-amber-500 border-amber-500 text-white shadow'
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {aktive[h.id] ? 'Stopp: ' : ''}
                            {h.navn}
                        </button>
                    ))}
                </div>
            )}

            {gameState === 'playing' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MeterBar
                        value={kultur.value}
                        label="Kultur holdt i live"
                        hint="Fylles så lenge noe er i gang. Full måler før tida er ute."
                        labels={{ normal: 'Så vidt', warn: 'Godt i gang', danger: 'Nesten i mål' }}
                    />
                    <MeterBar
                        value={mistanke.value}
                        label="Bestyrerens mistanke"
                        hint="Stopp i tide når han nærmer seg. Mistanken synker når alt er stille."
                        labels={{ normal: 'Rolig', warn: 'Han merker noe', danger: 'MELDT!' }}
                    />
                </div>
            )}

            {gameState === 'meldt' && (
                <LoseScreen title="Bestyreren meldte fra" onRetry={start}>
                    Familier som brøt reglene kunne miste hjelpen de var lovet, og barna kunne bli
                    tatt fra dem. Prøv igjen: stopp musikken og ordene mens bestyreren går forbi, og
                    sett dem i gang igjen når han er langt unna.
                </LoseScreen>
            )}

            {gameState === 'tapt' && (
                <LoseScreen title="Kontrakttiden gikk, og stillheten vant" onRetry={start}>
                    Dere kom gjennom oppholdet uten en eneste anmerkning. Men språket, musikken og
                    kontakten med slekta forsvant underveis. Det var akkurat dette kolonien var
                    bygget for. Prøv igjen, og våg litt mer når bestyreren er langt unna.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title="Dere holdt kulturen i live"
                    onReplay={start}
                    onNext={() => onComplete({ score: Math.max(0.4, 1 - tap * 0.15), completed: true })}
                >
                    Svanviken var i drift fra 1908 til 1989. Mange mistet språket og musikken der.
                    Men noen klarte å føre romani og musikken videre i det skjulte, og i dag er norsk
                    romani et av Norges nasjonale minoritetsspråk.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default SvanvikenKontrakten3D;
