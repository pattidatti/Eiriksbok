import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Mover,
    Person,
    Tent,
    Tree,
    Rock,
    Fire,
    GlowHalo,
    Particles,
    useMeter,
    useGameClock,
    useCrosshair,
    Crosshair,
    ScreenFlash,
    DangerVignette,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: eleven kjenner på kroppen hvorfor det finnes så få samiske
// trommer igjen. Under misjonen på 1600- og 1700-tallet ble trommene systematisk
// lett opp og samlet inn. Å berge en tromme var ikke å gjemme den i en kiste -
// det var å bære den forbi folk som lette, ut i landskapet, til et sted bare du
// visste om. De fleste ble ikke berget.

const START_Z = 15;
const SIEIDI_Z = -13;
const SKARE_Z = 6;
const STRIP_X = 6.5;
const RUN_SPEED = 3.0;
const TIME_LIMIT = 62;
const LANTERN_R = 3.2;

type GameState = 'idle' | 'playing' | 'caught' | 'dawn' | 'won';

interface SearcherPos {
    x: number;
    z: number;
}

// Lyktelys som følger en leter: myk lysflekk på snøen + varmt punktlys.
// Den ligger ALLTID der leteren står, så eleven kan lese faren direkte.
function Lantern({
    posRef,
    index,
}: {
    posRef: React.MutableRefObject<SearcherPos[]>;
    index: number;
}) {
    const circleRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame(() => {
        const p = posRef.current[index];
        if (!p) return;
        circleRef.current?.position.set(p.x, 0.03, p.z);
        lightRef.current?.position.set(p.x, 1.3, p.z);
    });

    return (
        <>
            <mesh ref={circleRef} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[LANTERN_R, 24]} />
                <meshBasicMaterial
                    color="#ffdf9e"
                    transparent
                    opacity={0.24}
                    depthWrite={false}
                />
            </mesh>
            <pointLight ref={lightRef} intensity={1.1} distance={8} color="#ffd489" />
        </>
    );
}

// Vinterboplassen og fjellet omkring. Alt her er kulisse - det eleven skal
// forholde seg til er leterne og sieidien.
function WinterFell() {
    return (
        <>
            {/* Snøvidda */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[38, 54]} />
                <meshStandardMaterial color="#7d8aa2" roughness={1} />
            </mesh>
            {/* Skaren: hardere snø som knaser under foten */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, SKARE_Z]}>
                <planeGeometry args={[22, 2.6]} />
                <meshStandardMaterial color="#9fabc2" roughness={0.7} />
            </mesh>

            {/* Vinterboplassen bak og ved siden av eleven */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Tent position={[-8.5, 0, 11]} color="#6b5f4e" scale={1.5} />
                <Tent position={[8.2, 0, 12.5]} color="#655a4a" scale={1.4} />
                <Tent position={[-7.4, 0, 17]} color="#6b5f4e" scale={1.4} />
                <Fire position={[-8.5, 0, 13.6]} scale={0.8} />
            </group>

            {/* Bjørkeskog i sidene - ly, men ikke en vei rundt */}
            <group userData={{ sceneAuditIgnore: true }}>
                {[-11, -9.4, 10, 11.8, -10.2, 9.6].map((x, i) => (
                    <Tree
                        key={`bj-${i}`}
                        position={[x, 0, 2 - i * 3.4]}
                        leaf="#4a5568"
                        seed={i + 3}
                    />
                ))}
            </group>

            {/* Steinur eleven kan bruke som holdepunkt */}
            {[
                [-4.2, 3.5],
                [3.6, 0.5],
                [-2.4, -4.5],
                [4.8, -7.5],
                [-5.4, -9.5],
            ].map(([x, z], i) => (
                <Rock key={`st-${i}`} position={[x, 0.24, z]} color="#6d778c" scale={1.1} />
            ))}

            {/* Sieidien: den hellige steinen ute på vidda. Målet. */}
            <group position={[0, 0, SIEIDI_Z]}>
                <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <circleGeometry args={[3.2, 24]} />
                    <meshStandardMaterial color="#96a2b8" roughness={1} />
                </mesh>
                <mesh position={[0, 1.15, 0]} castShadow>
                    <dodecahedronGeometry args={[1.5, 0]} />
                    <meshStandardMaterial color="#b9a884" roughness={1} flatShading />
                </mesh>
                <group position={[0, 1.25, 0]}>
                    <GlowHalo color="#ffdca8" size={2.3} opacity={0.15} />
                </group>
                <pointLight position={[0, 1.8, 0]} intensity={0.9} distance={7} color="#ffe4b5" />
            </group>

            {/* Fjell i horisonten + måne: ren dekor */}
            <group userData={{ sceneAuditIgnore: true }}>
                {[-16, -6, 7, 17].map((x, i) => (
                    <mesh key={`fj-${i}`} position={[x, 0, -30 - (i % 2) * 4]}>
                        <coneGeometry args={[9 + (i % 3) * 2, 8 + (i % 3) * 2.5, 5]} />
                        <meshStandardMaterial color="#3d465c" roughness={1} flatShading />
                    </mesh>
                ))}
                <mesh position={[-9, 13, -34]}>
                    <circleGeometry args={[1.5, 24]} />
                    <meshStandardMaterial
                        color="#eef3ff"
                        emissive="#d3ddff"
                        emissiveIntensity={1.2}
                        fog={false}
                    />
                </mesh>
            </group>
        </>
    );
}

interface SceneProps {
    gameState: GameState;
    attempt: number;
    isRunning: boolean;
    alerted: boolean;
    camPosRef: React.MutableRefObject<[number, number, number]>;
    movingRef: React.MutableRefObject<boolean>;
    steerRef: React.MutableRefObject<number>;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
    alarmAdd: (amount: number) => void;
    onSkare: () => void;
    onReachSieidi: () => void;
}

// Tre letere som krysser vidda på hver sin høyde. Alle bærer lykt.
const LANES: { z: number; span: number; speed: number }[] = [
    { z: 9.5, span: 8.5, speed: 1.35 },
    { z: 1.5, span: 9.5, speed: 1.6 },
    { z: -6.5, span: 8, speed: 1.45 },
];

function FellScene({
    gameState,
    attempt,
    isRunning,
    alerted,
    camPosRef,
    movingRef,
    steerRef,
    onAim,
    onHoldChange,
    alarmAdd,
    onSkare,
    onReachSieidi,
}: SceneProps) {
    // Scenen remountes per forsøk (key={attempt}), så refs nullstilles selv.
    void attempt;
    const searchersRef = useRef<SearcherPos[]>(LANES.map((l) => ({ x: -l.span, z: l.z })));
    const skareDoneRef = useRef(false);
    const wonDoneRef = useRef(false);
    const onSkareRef = useRef(onSkare);
    const onReachSieidiRef = useRef(onReachSieidi);
    const alarmAddRef = useRef(alarmAdd);
    useEffect(() => {
        onSkareRef.current = onSkare;
    }, [onSkare]);
    useEffect(() => {
        onReachSieidiRef.current = onReachSieidi;
    }, [onReachSieidi]);
    useEffect(() => {
        alarmAddRef.current = alarmAdd;
    }, [alarmAdd]);

    // Hver leter går frem og tilbake. Blir de varslet, snevrer de søket inn
    // rundt stedet lyden kom fra - og går fortere.
    const [legs, setLegs] = useState<number[]>([0, 0, 0]);

    useFrame((_state, dt) => {
        const pos = camPosRef.current;

        if (gameState === 'playing') {
            if (movingRef.current) {
                const nz = pos[2] - dt * RUN_SPEED;
                const dx = steerRef.current - pos[0];
                const nx = Math.max(
                    -STRIP_X,
                    Math.min(STRIP_X, pos[0] + dx * Math.min(1, dt * 2.4))
                );
                camPosRef.current = [nx, 1.55, nz];

                if (!skareDoneRef.current && nz <= SKARE_Z) {
                    skareDoneRef.current = true;
                    onSkareRef.current();
                }
                if (!wonDoneRef.current && nz <= SIEIDI_Z + 2.2) {
                    wonDoneRef.current = true;
                    onReachSieidiRef.current();
                }
            }

            // Bare den nærmeste lykta teller - ellers stables tre kilder til en
            // urettferdig øyeblikks-død.
            let rate = 0;
            for (const s of searchersRef.current) {
                const ddx = pos[0] - s.x;
                const ddz = pos[2] - s.z;
                if (ddx * ddx + ddz * ddz < LANTERN_R * LANTERN_R) {
                    rate = Math.max(rate, movingRef.current ? 1.0 : 0.1);
                }
            }
            if (rate > 0) alarmAddRef.current(dt * rate);

            if (import.meta.env.DEV) {
                (window as unknown as Record<string, unknown>).__bergTrommenDebug = {
                    player: [pos[0], pos[2]],
                    searchers: searchersRef.current.map((s) => [s.x, s.z]),
                };
            }
        } else if (gameState === 'won') {
            // Kort finale: senk blikket mot sieidien der trommen legges ned.
            const k = Math.min(1, dt * 1.2);
            camPosRef.current = [
                pos[0] + (0 - pos[0]) * k,
                pos[1] + (3.0 - pos[1]) * k,
                pos[2] + (SIEIDI_Z + 8 - pos[2]) * k,
            ];
        }
    });

    return (
        <>
            <PovCamera
                positionRef={camPosRef}
                lookAhead={[0, -0.3, -7]}
                moving={gameState === 'playing' && isRunning}
                bob={0.055}
            />
            <AimPlane
                enabled={gameState === 'playing'}
                followCamera
                onAim={onAim}
                onHoldChange={onHoldChange}
                hideCursor
            />

            <WinterFell />
            <Particles preset="snow" />

            {LANES.map((lane, i) => {
                // Patruljebanen ligger fast. Blir de varslet, går de bare
                // FORTERE - endres from/to underveis, hopper Mover tilbake til
                // startpunktet, og det ser ut som en feil.
                const even = legs[i] % 2 === 0;
                const from: [number, number, number] = [
                    even ? -lane.span : lane.span,
                    0,
                    lane.z,
                ];
                const to: [number, number, number] = [even ? lane.span : -lane.span, 0, lane.z];
                return (
                    <group key={`leter-${i}`}>
                        <Mover
                            from={from}
                            to={to}
                            speed={alerted ? lane.speed * 1.45 : lane.speed}
                            bob={0.05}
                            phase={i + legs[i]}
                            onArrive={() =>
                                setLegs((prev) => prev.map((v, j) => (j === i ? v + 1 : v)))
                            }
                            onMove={(x, _y, z) => {
                                searchersRef.current[i] = { x, z };
                            }}
                        >
                            <Person
                                pose="walk"
                                body="#2f3340"
                                skin="#8d7a63"
                                legs="#23262f"
                                hat="hood"
                                hatColor="#262a35"
                            />
                        </Mover>
                        <Lantern posRef={searchersRef} index={i} />
                    </group>
                );
            })}
        </>
    );
}

// ---- Hovedelement ----

const BergTrommen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const wind = useAmbience('wind', -30);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [skareFlash, setSkareFlash] = useState(0);
    const [alerted, setAlerted] = useState(false);
    const [distLeft, setDistLeft] = useState(START_Z - SIEIDI_Z);

    const camPosRef = useRef<[number, number, number]>([0, 1.55, START_Z]);
    const movingRef = useRef(false);
    const steerRef = useRef(0);
    const gameStateRef = useRef<GameState>('idle');
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const fail = useCallback(
        (kind: 'caught' | 'dawn') => {
            if (gameStateRef.current !== 'playing') return;
            sounds.play('incorrect');
            movingRef.current = false;
            setIsRunning(false);
            setFails((f) => f + 1);
            setGameState(kind);
        },
        [sounds]
    );

    const alarm = useMeter({
        drainPerSecond: 0.2,
        overloadAt: 1,
        recoverTo: 0.5,
        onOverload: () => fail('caught'),
    });
    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => fail('dawn'),
    });

    const aim = useCrosshair();
    const handleAim = useCallback(
        (xPct: number, yPct: number) => {
            aim.move(xPct, yPct);
            steerRef.current = ((xPct - 50) / 50) * STRIP_X;
        },
        [aim]
    );

    const handleHold = useCallback((holding: boolean) => {
        movingRef.current = holding;
        setIsRunning(holding);
    }, []);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            setDistLeft(Math.max(0, Math.round(camPosRef.current[2] - SIEIDI_Z)));
        }, 250);
        return () => clearInterval(t);
    }, [gameState]);

    const begin = useCallback(() => {
        camPosRef.current = [0, 1.55, START_Z];
        movingRef.current = false;
        steerRef.current = 0;
        alarm.reset();
        clock.restart();
        setIsRunning(false);
        setAlerted(false);
        setDistLeft(START_Z - SIEIDI_Z);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        wind.start();
        setBanner('Hold inne for å gå. Slipp for å stå helt stille når en lykt kommer nær.');
        setTimeout(() => setBanner(null), 3400);
    }, [alarm, clock, sounds, wind]);

    const handleSkare = useCallback(
        () => {
            sounds.play('incorrect');
            alarm.add(0.25);
            setAlerted(true);
            setSkareFlash((f) => f + 1);
            setBanner('Skaren knaste under foten. Nå vet de omtrent hvor du er.');
            setTimeout(() => setBanner(null), 2800);
        },
        [alarm, sounds]
    );

    const score = Math.max(0.4, 1 - fails * 0.15);

    const handleReachSieidi = useCallback(() => {
        sounds.play('complete');
        setGameState('won');
        setBanner(null);
        onComplete({ score: Math.max(0.4, 1 - fails * 0.15), completed: true });
    }, [sounds, onComplete, fails]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        alarm.reset();
        movingRef.current = false;
        setIsRunning(false);
        setAlerted(false);
        wind.stop();
    }, [alarm, wind]);

    return (
        <MicroGameScaffold
            title="Berg trommen"
            subtitle="Vinteren 1723. Misjonen gjennomsøker boplassen. Få trommen ut til sieidien uten å bli sett."
            estimatedSeconds={150}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 1.55, START_Z] as [number, number, number], fov: 62 },
                background: '#1b2438',
                fog: { color: '#1b2438', near: 14, far: 46 },
                sunPosition: [-6, 10, -8] as [number, number, number],
                sunIntensity: 0.2,
                ambientIntensity: 0.55,
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#1b2438] to-[#0e1524]"
            overlays={
                <>
                    <Crosshair
                        show={gameState === 'playing'}
                        crosshairRef={aim.ref}
                        variant="dot"
                    />
                    <ScreenFlash trigger={skareFlash} preset="flare" durationMs={140} />
                    <DangerVignette level={gameState === 'playing' ? alarm.value : 0} />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Til de er ferdige"
                            warnBelow={15}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[{ label: 'Til sieidien', value: distLeft, unit: 'm' }]}
                        />
                    )}
                    <SceneBanner message={banner} wide />
                    {gameState === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-black/50 text-white/75 rounded-xl text-xs text-center max-w-sm leading-relaxed">
                                Namdalen, en vinterkveld i 1723. Du holder trommen under kofta.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <FellScene
                    key={attempt}
                    gameState={gameState}
                    attempt={attempt}
                    isRunning={isRunning}
                    alerted={alerted}
                    camPosRef={camPosRef}
                    movingRef={movingRef}
                    steerRef={steerRef}
                    onAim={handleAim}
                    onHoldChange={handleHold}
                    alarmAdd={alarm.add}
                    onSkare={handleSkare}
                    onReachSieidi={handleReachSieidi}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Ute på vidda står sieidien, den hellige steinen. Der kan trommen ligge
                        trygt. Hold inne museknappen for å gå mot den, og styr med pekeren. Slipp
                        for å stå stille - leterne ser det som beveger seg i lyktelyset.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow"
                    >
                        Gå ut i mørket
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={alarm.value}
                    label="Hvor nær de er å se deg"
                    hint="Stå helt stille når en lykt kommer nær. Gå videre når den snur."
                    labels={{ normal: 'Usett', warn: 'De stanser opp', danger: 'Oppdaget!' }}
                />
            )}

            {gameState === 'caught' && (
                <LoseScreen title="De fant trommen" onRetry={begin}>
                    Trommen ble tatt med og skrevet inn i en liste. Slik forsvant flere hundre
                    trommer fra de samiske områdene. Prøv igjen: gå bare når ingen lykt er nær, og
                    stå bom stille når en kommer mot deg.
                </LoseScreen>
            )}

            {gameState === 'dawn' && (
                <LoseScreen title="De ble ferdige med boplassen" onRetry={begin}>
                    Da søket var over, gikk de gjennom teltene igjen. Du rakk ikke ut. Neste gang:
                    bruk pausene mellom lyktene, og ikke stå stille lenger enn du må.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={
                        fails === 0
                            ? 'Trommen ligger trygt - på første forsøk!'
                            : 'Du fikk trommen ut til sieidien'
                    }
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Denne gangen gikk det bra. Som oftest gjorde det ikke det. Flere hundre trommer
                    ble samlet inn eller brent under misjonen på 1600- og 1700-tallet, og i dag
                    finnes det bare rundt hundre igjen i hele verden.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default BergTrommen3D;
