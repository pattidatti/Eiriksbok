import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Particles,
    Tent,
    useMeter,
    useGameClock,
    useCrosshair,
    Crosshair,
    DangerVignette,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    Burst,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: eleven kjenner på kroppen hvorfor depotene og hviledagene
// avgjorde kappløpet mot Sydpolen. Hundene trekker bare så lenge de er uthvilte,
// og maten på sleden holder ikke hele veien. Kjører du forbi depotene for å
// spare tid, går du tom for mat på isen - akkurat slik det gikk for Scotts menn.

const START_Z = 26;
const POLE_Z = -30;
// Ferden er i mål litt foran teltet, så Polheim rammes inn i seiersbildet.
const FINISH_Z = -22;
const TRACK_X = 7.2;
const DRIVE_SPEED = 5.0;
const TIME_LIMIT = 78;

// Sult stiger hele tiden. Uten depoter tømmes matsekken før polen.
const HUNGER_PER_SECOND = 0.075;
const DEPOT_REFILL = 0.8;
// Utmattelse stiger når hundene trekker, og synker når laget hviler.
const STRAIN_PER_SECOND = 0.26;
const STRAIN_DRAIN = 0.16;
const DEPOT_RADIUS = 3.2;

type GameState = 'idle' | 'playing' | 'sult' | 'utmattet' | 'vinter' | 'won';

interface Depot {
    id: number;
    x: number;
    z: number;
}

const DEPOTS: Depot[] = [
    { id: 0, x: -4.2, z: 17 },
    { id: 1, x: 4.6, z: 8 },
    { id: 2, x: -5.0, z: 0 },
    { id: 3, x: 4.2, z: -8 },
    { id: 4, x: -3.6, z: -17 },
];

// Vindslipte snøryggar (sastrugi). Faste posisjoner - ingen Math.random.
const SASTRUGI: [number, number, number][] = [
    [-8.4, 20, 0.9],
    [6.2, 17, 1.3],
    [-2.6, 12, 0.7],
    [8.1, 9, 1.1],
    [-7.2, 6, 1.4],
    [1.8, 1, 0.8],
    [-8.8, -3, 1.0],
    [7.4, -7, 1.2],
    [-3.1, -11, 0.9],
    [5.6, -14, 1.35],
    [-8.0, -19, 1.1],
    [2.2, -21, 0.8],
];

// Ett depot: snøvarde med et flagg som vaier. Blir grått og senkes når det er
// hentet, så eleven ser at forsyningen faktisk er tatt inn.
function DepotFlag({ taken }: { taken: boolean }) {
    const cloth = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!cloth.current || taken) return;
        cloth.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 3.2) * 0.16;
    });
    const flagColor = taken ? '#9aa7b0' : '#c8362a';
    return (
        <group>
            {/* Snøvarde - står på bakken */}
            <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 0.7, 1.5]} />
                <meshStandardMaterial color={taken ? '#cdd6dc' : '#f2f7fa'} roughness={1} />
            </mesh>
            {/* Kasse med mat og brensel */}
            <mesh position={[0, 0.88, 0]} castShadow>
                <boxGeometry args={[0.9, 0.36, 0.7]} />
                <meshStandardMaterial color={taken ? '#8d8577' : '#8a6a3f'} roughness={0.9} />
            </mesh>
            {/* Flaggstang: loddrett sylinder, bunnen nede i varden */}
            <mesh position={[0, 1.9, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 2.6, 8]} />
                <meshStandardMaterial color="#6a5038" />
            </mesh>
            <mesh ref={cloth} position={[0.45, 2.9, 0]}>
                <planeGeometry args={[0.9, 0.55]} />
                <meshStandardMaterial color={flagColor} side={THREE.DoubleSide} roughness={0.8} />
            </mesh>
        </group>
    );
}

// Sledehund sett bakfra. Alle deler er bokser langs Z, så ingenting står feil
// vei. Bunnen av beina ligger på bakken (y=0), kroppen hviler oppå dem.
function SledDog({ phase, running }: { phase: number; running: boolean }) {
    const body = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!body.current) return;
        const t = state.clock.getElapsedTime();
        body.current.position.y = running ? Math.abs(Math.sin(t * 10 + phase)) * 0.05 : 0;
    });
    return (
        <group>
            <group ref={body}>
                {/* Kropp */}
                <mesh position={[0, 0.4, 0]} castShadow>
                    <boxGeometry args={[0.26, 0.24, 0.72]} />
                    <meshStandardMaterial color="#e6e1d8" roughness={0.95} />
                </mesh>
                {/* Hode, foran (mot -Z) */}
                <mesh position={[0, 0.46, -0.46]} castShadow>
                    <boxGeometry args={[0.2, 0.2, 0.24]} />
                    <meshStandardMaterial color="#d8d0c2" roughness={0.95} />
                </mesh>
                {/* Hale, bakover (mot +Z) - boks, ikke stående sylinder */}
                <mesh position={[0, 0.5, 0.44]}>
                    <boxGeometry args={[0.07, 0.07, 0.3]} />
                    <meshStandardMaterial color="#d8d0c2" />
                </mesh>
            </group>
            {/* Bein: bunnen på y=0, toppen møter kroppen */}
            {[
                [-0.1, 0.26],
                [0.1, 0.26],
                [-0.1, -0.26],
                [0.1, -0.26],
            ].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, 0.14, lz]}>
                    <boxGeometry args={[0.07, 0.28, 0.07]} />
                    <meshStandardMaterial color="#cfc7ba" />
                </mesh>
            ))}
        </group>
    );
}

// Hundespannet og sleden. Gruppa følger kameraposisjonen i useFrame, så eleven
// ser sitt eget spann uten at scenen re-rendres. Sleden ligger like under
// kameraet (eleven står på meiene), spannet strekker seg framover.
function DogTeam({
    camPosRef,
    running,
}: {
    camPosRef: React.MutableRefObject<[number, number, number]>;
    running: boolean;
}) {
    const grp = useRef<THREE.Group>(null);
    useFrame(() => {
        if (!grp.current) return;
        const p = camPosRef.current;
        grp.current.position.set(p[0], 0, p[2]);
    });
    return (
        <group ref={grp}>
            {/* Sleden: kassa hviler oppå meiene, meiene ligger på snøen */}
            <mesh position={[0, 0.3, 0.2]} castShadow>
                <boxGeometry args={[0.8, 0.26, 1.7]} />
                <meshStandardMaterial color="#8a6a3f" roughness={0.9} />
            </mesh>
            {[-0.32, 0.32].map((x) => (
                <mesh key={x} position={[x, 0.08, 0.2]}>
                    <boxGeometry args={[0.09, 0.16, 2.0]} />
                    <meshStandardMaterial color="#6a5038" />
                </mesh>
            ))}
            {/* Trekklina: flat boks langs kjøreretningen, aldri en stående stang */}
            <mesh position={[0, 0.44, -3.9]}>
                <boxGeometry args={[0.035, 0.035, 7.6]} />
                <meshStandardMaterial color="#c2b49a" roughness={1} />
            </mesh>
            {[
                [-0.42, -1.5, 0],
                [0.42, -1.7, 1.6],
                [-0.42, -3.0, 3.1],
                [0.42, -3.2, 4.4],
                [-0.42, -4.5, 5.7],
                [0.42, -4.7, 2.2],
                [-0.42, -6.0, 3.8],
                [0.42, -6.2, 0.9],
            ].map(([x, z, ph], i) => (
                <group key={i} position={[x, 0, z]}>
                    <SledDog phase={ph} running={running} />
                </group>
            ))}
        </group>
    );
}

// Målet: Polheim. Teltet Amundsen satte igjen, med det norske flagget.
function Polheim() {
    const cloth = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!cloth.current) return;
        cloth.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 2.4) * 0.12;
    });
    return (
        <group position={[0, 0, POLE_Z]}>
            <Tent position={[0, 0, 0]} color="#3f5f8a" scale={1.15} />
            <mesh position={[0, 2.2, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.06, 4.4, 8]} />
                <meshStandardMaterial color="#6a5038" />
            </mesh>
            <mesh ref={cloth} position={[0.6, 3.9, 0]}>
                <planeGeometry args={[1.2, 0.8]} />
                <meshStandardMaterial color="#ba0c2f" side={THREE.DoubleSide} roughness={0.8} />
            </mesh>
        </group>
    );
}

interface SceneProps {
    gameState: GameState;
    attempt: number;
    isDriving: boolean;
    camPosRef: React.MutableRefObject<[number, number, number]>;
    drivingRef: React.MutableRefObject<boolean>;
    steerRef: React.MutableRefObject<number>;
    takenIds: number[];
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
    hungerAdd: (amount: number) => void;
    strainAdd: (amount: number) => void;
    onDepot: (id: number, x: number, z: number) => void;
    onReachPole: () => void;
}

function IceScene({
    gameState,
    attempt,
    isDriving,
    camPosRef,
    drivingRef,
    steerRef,
    takenIds,
    onAim,
    onHoldChange,
    hungerAdd,
    strainAdd,
    onDepot,
    onReachPole,
}: SceneProps) {
    // Scenen remountes per forsøk (key={attempt}), så refene nullstilles selv.
    void attempt;
    const takenRef = useRef<Set<number>>(new Set());
    const poleDoneRef = useRef(false);
    const onDepotRef = useRef(onDepot);
    const onReachPoleRef = useRef(onReachPole);
    const hungerAddRef = useRef(hungerAdd);
    const strainAddRef = useRef(strainAdd);
    useEffect(() => {
        onDepotRef.current = onDepot;
    }, [onDepot]);
    useEffect(() => {
        onReachPoleRef.current = onReachPole;
    }, [onReachPole]);
    useEffect(() => {
        hungerAddRef.current = hungerAdd;
    }, [hungerAdd]);
    useEffect(() => {
        strainAddRef.current = strainAdd;
    }, [strainAdd]);

    useFrame((_state, dt) => {
        if (gameState !== 'playing') return;
        const pos = camPosRef.current;

        if (drivingRef.current) {
            const nz = pos[2] - dt * DRIVE_SPEED;
            const dx = steerRef.current - pos[0];
            const nx = Math.max(-TRACK_X, Math.min(TRACK_X, pos[0] + dx * Math.min(1, dt * 2.2)));
            camPosRef.current = [nx, 1.6, nz];
            strainAddRef.current(dt * STRAIN_PER_SECOND);

            if (!poleDoneRef.current && nz <= FINISH_Z) {
                poleDoneRef.current = true;
                onReachPoleRef.current();
            }
        }

        // Sulten stiger uansett om laget kjører eller hviler.
        hungerAddRef.current(dt * HUNGER_PER_SECOND);

        // DEV: eksponer tilstand for selvspill-testing (samme info eleven ser:
        // egen posisjon og hvilke depotflagg som fortsatt står ute).
        if (import.meta.env.DEV) {
            const w = window as unknown as Record<string, unknown>;
            const d = (w.__sydpolDebug ?? {}) as Record<string, unknown>;
            d.pos = [camPosRef.current[0], camPosRef.current[2]];
            d.depots = DEPOTS.filter((x) => !takenRef.current.has(x.id)).map((x) => [x.x, x.z]);
            d.trackX = TRACK_X;
            d.poleZ = FINISH_Z;
            w.__sydpolDebug = d;
        }

        // Depot: kjør nær varden, så lastes mat og brensel over på sleden.
        for (const d of DEPOTS) {
            if (takenRef.current.has(d.id)) continue;
            const ddx = camPosRef.current[0] - d.x;
            const ddz = camPosRef.current[2] - d.z;
            if (ddx * ddx + ddz * ddz < DEPOT_RADIUS * DEPOT_RADIUS) {
                takenRef.current.add(d.id);
                onDepotRef.current(d.id, d.x, d.z);
            }
        }
    });

    return (
        <>
            <PovCamera
                positionRef={camPosRef}
                lookAhead={[0, -0.3, -7]}
                moving={gameState === 'playing' && isDriving}
                bob={0.045}
            />
            <AimPlane
                enabled={gameState === 'playing'}
                followCamera
                onAim={onAim}
                onHoldChange={onHoldChange}
                hideCursor
            />

            {/* Isbreen - bredere enn 26 enheter, holdes utenfor modellmålingen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[46, 78]} />
                <meshStandardMaterial color="#eef4f8" roughness={1} />
            </mesh>

            {/* Sastrugi: vindslipte snøryggar. Bunnen ligger på bakken. */}
            {SASTRUGI.map(([x, z, s], i) => (
                <mesh
                    key={i}
                    position={[x, 0.13 * s, z]}
                    rotation={[0, (i % 4) * 0.4, 0]}
                    castShadow
                    receiveShadow
                >
                    <boxGeometry args={[2.6 * s, 0.26 * s, 0.9 * s]} />
                    <meshStandardMaterial color="#e2ebf1" roughness={1} />
                </mesh>
            ))}

            {DEPOTS.map((d) => (
                <group key={d.id} position={[d.x, 0, d.z]}>
                    <DepotFlag taken={takenIds.includes(d.id)} />
                </group>
            ))}

            <Polheim />

            <DogTeam camPosRef={camPosRef} running={gameState === 'playing' && isDriving} />

            {/* Fokksnø: bakgrunnsdekor, ikke del av modellen scene-auditen måler */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="snow" area={[26, 26]} height={10} />
            </group>
        </>
    );
}

const Sydpolsferden3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const wind = useAmbience('wind', -28);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [isDriving, setIsDriving] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [takenIds, setTakenIds] = useState<number[]>([]);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([0, 1, 0]);
    const [kmLeft, setKmLeft] = useState(0);

    const camPosRef = useRef<[number, number, number]>([0, 1.6, START_Z]);
    const drivingRef = useRef(false);
    const steerRef = useRef(0);
    const gameStateRef = useRef<GameState>('idle');
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const fail = useCallback(
        (kind: 'sult' | 'utmattet' | 'vinter') => {
            if (gameStateRef.current !== 'playing') return;
            sounds.play('incorrect');
            drivingRef.current = false;
            setIsDriving(false);
            setFails((f) => f + 1);
            setGameState(kind);
        },
        [sounds]
    );

    // Matsekken: stiger av seg selv, senkes bare av depotene.
    const hunger = useMeter({
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.2,
        onOverload: () => fail('sult'),
    });
    // Hundene: stiger når laget trekker, synker når det hviler.
    const strain = useMeter({
        drainPerSecond: STRAIN_DRAIN,
        overloadAt: 1,
        recoverTo: 0.3,
        onOverload: () => fail('utmattet'),
    });
    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => fail('vinter'),
    });

    const aim = useCrosshair();
    const handleAim = useCallback(
        (xPct: number, yPct: number) => {
            aim.move(xPct, yPct);
            steerRef.current = ((xPct - 50) / 50) * TRACK_X;
        },
        [aim]
    );

    const handleHold = useCallback((holding: boolean) => {
        drivingRef.current = holding;
        setIsDriving(holding);
    }, []);

    // DEV: legg målerverdiene på debug-objektet, så selvspill-boten leser samme
    // tall som eleven ser i MeterBar-ene.
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const w = window as unknown as Record<string, unknown>;
        const d = (w.__sydpolDebug ?? {}) as Record<string, unknown>;
        d.strain = strain.value;
        d.hunger = hunger.value;
        w.__sydpolDebug = d;
    }, [strain.value, hunger.value]);

    // Avstandsmåler, ~4 Hz (ikke per frame).
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            const igjen = Math.max(0, camPosRef.current[2] - FINISH_Z);
            setKmLeft(Math.round((igjen / (START_Z - FINISH_Z)) * 1300));
        }, 250);
        return () => clearInterval(t);
    }, [gameState]);

    const begin = useCallback(() => {
        camPosRef.current = [0, 1.6, START_Z];
        drivingRef.current = false;
        steerRef.current = 0;
        hunger.reset();
        strain.reset();
        clock.restart();
        setIsDriving(false);
        setTakenIds([]);
        setKmLeft(1300);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        wind.start();
        setBanner('Hold inne for å la hundene trekke. Slipp for å hvile. Kjør innom de røde depotflaggene.');
        setTimeout(() => setBanner(null), 4200);
    }, [hunger, strain, clock, sounds, wind]);

    const handleDepot = useCallback(
        (id: number, x: number, z: number) => {
            sounds.play('correct');
            hunger.add(-DEPOT_REFILL);
            setTakenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
            setBurstPos([x, 1.2, z]);
            setBurst((b) => b + 1);
            setBanner('Depot funnet. Mat og brensel er lastet over på sleden.');
            setTimeout(() => setBanner(null), 2200);
        },
        [hunger, sounds]
    );

    const score = Math.max(0.4, 1 - fails * 0.15);

    const handleReachPole = useCallback(() => {
        sounds.play('complete');
        drivingRef.current = false;
        setIsDriving(false);
        setBanner(null);
        setGameState('won');
        onComplete({ score: Math.max(0.4, 1 - fails * 0.15), completed: true });
    }, [sounds, onComplete, fails]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        hunger.reset();
        strain.reset();
        drivingRef.current = false;
        setIsDriving(false);
        wind.stop();
    }, [hunger, strain, wind]);

    return (
        <MicroGameScaffold
            title="Ferden mot Sydpolen"
            subtitle="Kjør hundespannet til polen. Hvil før hundene er utkjørte, og kjør innom depotene før maten tar slutt."
            estimatedSeconds={170}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 1.6, START_Z] as [number, number, number], fov: 62 },
                background: '#dceaf2',
                fog: { color: '#e4eef4', near: 16, far: 62 },
                sunPosition: [8, 9, 10] as [number, number, number],
                sunIntensity: 0.75,
                ambientIntensity: 0.85,
            }}
            overlays={
                <>
                    <Crosshair
                        show={gameState === 'playing'}
                        crosshairRef={aim.ref}
                        variant="dot"
                    />
                    <DangerVignette level={gameState === 'playing' ? hunger.value : 0} />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Polarsommer"
                            warnBelow={18}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Til polen', value: kmLeft, unit: 'km' },
                                { label: 'Depot', value: `${takenIds.length}/${DEPOTS.length}` },
                            ]}
                        />
                    )}
                    <SceneBanner message={banner} wide />
                </>
            }
            scene={
                <>
                    <IceScene
                        key={attempt}
                        gameState={gameState}
                        attempt={attempt}
                        isDriving={isDriving}
                        camPosRef={camPosRef}
                        drivingRef={drivingRef}
                        steerRef={steerRef}
                        takenIds={takenIds}
                        onAim={handleAim}
                        onHoldChange={handleHold}
                        hungerAdd={hunger.add}
                        strainAdd={strain.add}
                        onDepot={handleDepot}
                        onReachPole={handleReachPole}
                    />
                    <Burst position={burstPos} trigger={burst} color="#c8362a" />
                </>
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Framheim, 20. oktober 1911. Foran deg ligger 1300 kilometer is. Hold inne
                        museknappen for å la hundene trekke, og styr med pekeren. Slipp for å
                        hvile. De fem røde flaggene er depotene du la ut om høsten.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-sky-700 text-white rounded-xl text-sm font-bold hover:bg-sky-800 transition shadow"
                    >
                        Slipp hundene - sørover!
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="grid gap-2 sm:grid-cols-2">
                    <MeterBar
                        value={strain.value}
                        label="Hundene"
                        hint="Slipp museknappen og la spannet hvile før måleren er full."
                        labels={{ normal: 'Uthvilte', warn: 'Slitne', danger: 'Utkjørte!' }}
                    />
                    <MeterBar
                        value={hunger.value}
                        label="Matsekken"
                        hint="Synker bare når du kjører innom et depot."
                        labels={{ normal: 'Full', warn: 'Knapt', danger: 'Tom!' }}
                    />
                </div>
            )}

            {gameState === 'sult' && (
                <LoseScreen title="Maten tok slutt på isen" onRetry={begin}>
                    Sleden kan ikke bære mat for hele turen. Scott og mennene hans døde av sult og
                    kulde bare 18 kilometer fra neste depot. Prøv igjen, og styr innom de røde
                    flaggene underveis.
                </LoseScreen>
            )}

            {gameState === 'utmattet' && (
                <LoseScreen title="Hundene stanset" onRetry={begin}>
                    Et spann som aldri hviler, bryter sammen. Amundsen kjørte korte dagsetapper og
                    hvilte, og derfor holdt både folk og hunder helt til polen og hjem igjen.
                </LoseScreen>
            )}

            {gameState === 'vinter' && (
                <LoseScreen title="Polarsommeren tok slutt" onRetry={begin}>
                    På Sydpolen faller vintertemperaturen mot 65 kuldegrader. Kommer mørket før du
                    er framme, kommer du ikke fram i det hele tatt. Bruk hver time du har.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={
                        fails === 0
                            ? 'Du står på Sydpolen - på første forsøk!'
                            : 'Du står på Sydpolen!'
                    }
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Roald Amundsen og fire menn kom hit 14. desember 1911. De var tilbake i
                    Framheim etter 99 dager og 2600 kilometer. Depotene og hviledagene var ikke
                    forsiktighet - de var grunnen til at alle kom hjem.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default Sydpolsferden3D;
