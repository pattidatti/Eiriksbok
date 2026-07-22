import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Mover,
    Person,
    Tower,
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

// Pedagogisk kjerne: eleven kjenner på kroppen hvorfor dødsstripa var nesten
// umulig å krysse - åpen sand, lyskastere, signalgjerde og patruljer var
// KONSTRUERT for at ingen skulle komme seg over usett. Løp når det er mørkt,
// frys når lyset sveiper mot deg.

const START_Z = 16;
const WALL_Z = -14;
const FENCE_Z = 8;
const STRIP_X = 6.8;
const RUN_SPEED = 3.0;
const TIME_LIMIT = 65;
const POOL_RADIUS = 2.6;

type GameState = 'idle' | 'playing' | 'caught' | 'dawn' | 'won';

const UP = new THREE.Vector3(0, 1, 0);

// Sveipende lyskaster: kjegle fra tårnet + lysflekk på bakken. Sveiper lat i
// fredstid - men JAKTER på siste sette bevegelse (huntRef) innenfor sitt
// z-bånd. Rapporterer flekkens posisjon hver frame (ref-trygt) så spillet kan
// sjekke om eleven står i lyset.
function SearchLight({
    towerX,
    towerZ,
    poolZ,
    amp,
    speed,
    phase,
    radius,
    bandZ,
    huntRef,
    chaseSpeed = 5.0,
    onSweep,
}: {
    towerX: number;
    towerZ: number;
    poolZ: number;
    amp: number;
    speed: number;
    phase: number;
    radius: number;
    // Jakter kun mål med z innenfor [min, max] - så ett lys ikke eier hele stripa.
    bandZ: [number, number];
    // Siste sette bevegelse: { x, z, at } (at = clock-tid). null = ingenting sett.
    huntRef: React.MutableRefObject<{ x: number; z: number; at: number } | null>;
    // Må være raskere enn løpsfarten - ellers løper eleven fra lyset.
    chaseSpeed?: number;
    onSweep: (x: number, z: number) => void;
}) {
    const coneRef = useRef<THREE.Mesh>(null);
    const circleRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);
    const apex = useRef(new THREE.Vector3(towerX, 4.4, towerZ));
    const pool = useRef(new THREE.Vector3(0, 0.04, poolZ));
    const seg = useRef(new THREE.Vector3());

    useFrame((state, dt) => {
        const t = state.clock.getElapsedTime();
        const hunt = huntRef.current;
        const hunting =
            hunt !== null && t - hunt.at < 1.8 && hunt.z >= bandZ[0] && hunt.z <= bandZ[1];

        if (hunting && hunt) {
            // Jag siste sette bevegelse - sikt litt FORAN flyktningen (mot
            // muren), med litt søke-vobbel rundt målet
            const wx = hunt.x + Math.sin(t * 2.3 + phase) * 0.5;
            const wz = hunt.z - 1.0 + Math.cos(t * 1.9 + phase) * 0.5;
            const dx = wx - pool.current.x;
            const dz = wz - pool.current.z;
            const len = Math.hypot(dx, dz);
            const step = Math.min(len, chaseSpeed * dt);
            if (len > 0.001) {
                pool.current.x += (dx / len) * step;
                pool.current.z += (dz / len) * step;
            }
        } else {
            // Lat patrulje-sveip: gli tilbake mot sveipebanen
            const px = Math.sin(t * speed + phase) * amp;
            const pz = poolZ + Math.sin(t * speed * 0.53 + phase * 1.7) * 2.2;
            pool.current.x += (px - pool.current.x) * Math.min(1, dt * 2.5);
            pool.current.z += (pz - pool.current.z) * Math.min(1, dt * 2.5);
        }
        circleRef.current?.position.copy(pool.current);
        lightRef.current?.position.set(pool.current.x, 1.6, pool.current.z);
        if (coneRef.current) {
            seg.current.subVectors(apex.current, pool.current);
            const len = seg.current.length();
            coneRef.current.position
                .copy(pool.current)
                .addScaledVector(seg.current, 0.5);
            seg.current.normalize();
            coneRef.current.quaternion.setFromUnitVectors(UP, seg.current);
            coneRef.current.scale.set(radius * 0.92, len, radius * 0.92);
        }
        onSweep(pool.current.x, pool.current.z);
    });

    return (
        <>
            <mesh ref={coneRef}>
                <coneGeometry args={[1, 1, 20, 1, true]} />
                <meshBasicMaterial
                    color="#fff8d8"
                    transparent
                    opacity={0.1}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh ref={circleRef} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[radius, 24]} />
                <meshBasicMaterial color="#fff4c4" transparent opacity={0.32} depthWrite={false} />
            </mesh>
            <pointLight ref={lightRef} intensity={1.2} distance={9} color="#fff2c0" />
        </>
    );
}

// Statisk kulisse: dødsstripa sett fra øst. Vest-Berlin LYSER bak muren -
// det er dit eleven vil.
function DeathStrip() {
    return (
        <>
            {/* Sandstripa - raket åpen grunn uten skjul */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[34, 50]} />
                <meshStandardMaterial color="#5d5b50" roughness={1} />
            </mesh>
            {/* Lysere raket sand mellom gjerdet og muren */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, (FENCE_Z + WALL_Z) / 2]}>
                <planeGeometry args={[20, FENCE_Z - WALL_Z]} />
                <meshStandardMaterial color="#6b675a" roughness={1} />
            </mesh>

            {/* Muren med rund topp (umulig å få tak) */}
            <mesh position={[0, 1.8, WALL_Z]} castShadow>
                <boxGeometry args={[26, 3.6, 0.5]} />
                <meshStandardMaterial color="#9aa0a6" roughness={0.9} />
            </mesh>
            <mesh position={[0, 3.65, WALL_Z]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.32, 0.32, 26, 12]} />
                <meshStandardMaterial color="#8a9096" roughness={0.85} />
            </mesh>

            {/* Signalgjerdet - rører du det, går alarmen */}
            {Array.from({ length: 11 }, (_, i) => (
                <mesh key={`fp-${i}`} position={[-10 + i * 2, 0.6, FENCE_Z]}>
                    <cylinderGeometry args={[0.05, 0.05, 1.2, 5]} />
                    <meshStandardMaterial color="#3c3c44" />
                </mesh>
            ))}
            {[0.35, 0.7, 1.05].map((y) => (
                <mesh key={`fw-${y}`} position={[0, y, FENCE_Z]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.012, 0.012, 21, 3]} />
                    <meshStandardMaterial color="#55555e" />
                </mesh>
            ))}

            {/* Panservern-kryss */}
            {[-5.5, -1.5, 2.8, 6.2].map((x, i) => (
                <group key={`hh-${i}`} position={[x, 0.28, -7.5 + (i % 2) * 1.4]}>
                    <mesh rotation={[0, 0, Math.PI / 4]}>
                        <boxGeometry args={[0.12, 1.1, 0.12]} />
                        <meshStandardMaterial color="#4a4640" />
                    </mesh>
                    <mesh rotation={[0, 0, -Math.PI / 4]}>
                        <boxGeometry args={[0.12, 1.1, 0.12]} />
                        <meshStandardMaterial color="#4a4640" />
                    </mesh>
                    <mesh rotation={[Math.PI / 4, 0, 0]}>
                        <boxGeometry args={[0.12, 0.12, 1.1]} />
                        <meshStandardMaterial color="#4a4640" />
                    </mesh>
                </group>
            ))}

            {/* Lysmaster langs stripa */}
            {[-9, -3, 3, 9].map((x) => (
                <group key={`lp-${x}`} position={[x, 0, 1]}>
                    <mesh position={[0, 1.9, 0]}>
                        <cylinderGeometry args={[0.06, 0.08, 3.8, 6]} />
                        <meshStandardMaterial color="#2e2e36" />
                    </mesh>
                    <mesh position={[0, 3.85, 0]}>
                        <sphereGeometry args={[0.16, 8, 6]} />
                        <meshStandardMaterial
                            color="#ffe9a0"
                            emissive="#ffd060"
                            emissiveIntensity={1.6}
                        />
                    </mesh>
                </group>
            ))}

            {/* Vakttårn */}
            <Tower position={[-7, 0, -9]} radius={0.8} height={4.2} color="#565c62" roof="#3a3f44" />
            <Tower position={[7, 0, -3]} radius={0.8} height={4.2} color="#565c62" roof="#3a3f44" />

            {/* Øst-Berlin bak eleven: mørke, slukkede bygårder */}
            {[-8, -2, 5].map((x, i) => (
                <mesh key={`eb-${i}`} position={[x, 2.2, 21 + (i % 2) * 2]}>
                    <boxGeometry args={[5, 4.4 + i * 0.8, 4]} />
                    <meshStandardMaterial color="#23262e" roughness={1} />
                </mesh>
            ))}

            {/* Vest-Berlin foran: silhuetter med VARME, tente vinduer */}
            {[-9, -4.5, 0.5, 5, 9.5].map((x, i) => {
                const h = 5 + ((i * 7) % 4);
                return (
                    <group key={`wb-${i}`} position={[x, 0, -21 - (i % 3) * 2.5]}>
                        <mesh position={[0, h / 2, 0]}>
                            <boxGeometry args={[3.6, h, 3.2]} />
                            <meshStandardMaterial color="#2c3040" roughness={1} />
                        </mesh>
                        {Array.from({ length: 6 }, (_, w) => (
                            <mesh
                                key={w}
                                position={[
                                    -1 + (w % 3) * 1,
                                    h - 1 - Math.floor(w / 3) * 1.4,
                                    1.62,
                                ]}
                            >
                                <planeGeometry args={[0.45, 0.6]} />
                                <meshStandardMaterial
                                    color="#ffdf9e"
                                    emissive="#ffc860"
                                    emissiveIntensity={1.8}
                                />
                            </mesh>
                        ))}
                    </group>
                );
            })}

            {/* Måne */}
            <mesh position={[9, 14, -34]}>
                <circleGeometry args={[1.4, 24]} />
                <meshStandardMaterial
                    color="#eef2ff"
                    emissive="#cdd8ff"
                    emissiveIntensity={1.1}
                    fog={false}
                />
            </mesh>
        </>
    );
}

// Scene-rot: all sanntidslogikk bor her (refs, ingen re-render per frame).
interface SceneProps {
    gameState: GameState;
    attempt: number;
    isRunning: boolean;
    camPosRef: React.MutableRefObject<[number, number, number]>;
    movingRef: React.MutableRefObject<boolean>;
    steerRef: React.MutableRefObject<number>;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
    alarmAdd: (amount: number) => void;
    onFence: () => void;
    onReachWall: () => void;
}

function StripScene({
    gameState,
    attempt,
    isRunning,
    camPosRef,
    movingRef,
    steerRef,
    onAim,
    onHoldChange,
    alarmAdd,
    onFence,
    onReachWall,
}: SceneProps) {
    // Hele scenen remountes per forsøk (key={attempt} hos forelderen), så
    // refs og vakt-tilstand nullstilles av seg selv.
    void attempt;
    const poolsRef = useRef<{ x: number; z: number }[]>([
        { x: 0, z: -5 },
        { x: 0, z: 2 },
    ]);
    const guardPosRef = useRef<{ x: number; z: number }>({ x: -8, z: 3.5 });
    const huntRef = useRef<{ x: number; z: number; at: number } | null>(null);
    const fenceDoneRef = useRef(false);
    const wallDoneRef = useRef(false);
    const onFenceRef = useRef(onFence);
    const onReachWallRef = useRef(onReachWall);
    const alarmAddRef = useRef(alarmAdd);
    useEffect(() => {
        onFenceRef.current = onFence;
    }, [onFence]);
    useEffect(() => {
        onReachWallRef.current = onReachWall;
    }, [onReachWall]);
    useEffect(() => {
        alarmAddRef.current = alarmAdd;
    }, [alarmAdd]);

    // Patruljevakt: frem og tilbake over stripa
    const [leg, setLeg] = useState(0);
    const guardFrom: [number, number, number] = leg % 2 === 0 ? [-8, 0, 3.5] : [8, 0, 3.5];
    const guardTo: [number, number, number] = leg % 2 === 0 ? [8, 0, 3.5] : [-8, 0, 3.5];

    useFrame((state, dt) => {
        const pos = camPosRef.current;

        if (gameState === 'playing') {
            if (movingRef.current) {
                // Fremover mot muren + sidestyring mot pekermålet
                const nz = pos[2] - dt * RUN_SPEED;
                const dx = steerRef.current - pos[0];
                const nx = Math.max(
                    -STRIP_X,
                    Math.min(STRIP_X, pos[0] + dx * Math.min(1, dt * 2.4))
                );
                camPosRef.current = [nx, 1.55, nz];

                // Signalgjerdet: alarm + lysene får vite hvor du er
                if (!fenceDoneRef.current && nz <= FENCE_Z) {
                    fenceDoneRef.current = true;
                    huntRef.current = { x: nx, z: nz, at: state.clock.getElapsedTime() };
                    onFenceRef.current();
                }
                // Fremme ved muren
                if (!wallDoneRef.current && nz <= WALL_Z + 1.8) {
                    wallDoneRef.current = true;
                    onReachWallRef.current();
                }
            }

            // Oppdagelses-trykk: den STERKESTE kilden teller (ikke summen) -
            // ellers stables lys + vakt til en urettferdig øyeblikks-død.
            let rate = 0;
            let spotted = false;
            for (const p of poolsRef.current) {
                const ddx = pos[0] - p.x;
                const ddz = pos[2] - p.z;
                if (ddx * ddx + ddz * ddz < POOL_RADIUS * POOL_RADIUS) {
                    rate = Math.max(rate, movingRef.current ? 0.9 : 0.12);
                    if (movingRef.current) spotted = true;
                }
            }
            // Vakta hører deg hvis du løper tett forbi
            const gdx = pos[0] - guardPosRef.current.x;
            const gdz = pos[2] - guardPosRef.current.z;
            if (movingRef.current && gdx * gdx + gdz * gdz < 4.6 * 4.6) {
                rate = Math.max(rate, 0.5);
                spotted = true;
            }
            if (rate > 0) alarmAddRef.current(dt * rate);

            // Lysene er IKKE allvitende: de jakter bare bevegelse de faktisk
            // har SETT - i en lysflekk, av vakta, eller ved signalgjerdet.
            // Løper du usett i mørket, fortsetter de den late patruljen.
            if (spotted) {
                huntRef.current = {
                    x: pos[0],
                    z: pos[2],
                    at: state.clock.getElapsedTime(),
                };
            }

            // DEV: eksponer tilstand for selvspill-testing (samme info som
            // eleven ser visuelt: egen posisjon, vakta og lysflekkene).
            if (import.meta.env.DEV) {
                (window as unknown as Record<string, unknown>).__fluktDebug = {
                    player: [pos[0], pos[2]],
                    guard: [guardPosRef.current.x, guardPosRef.current.z],
                    pools: poolsRef.current.map((p) => [p.x, p.z]),
                };
            }
        } else if (gameState === 'won') {
            // Klatre over muren og gli inn mot lysene i Vest-Berlin
            const k = Math.min(1, dt * 1.1);
            camPosRef.current = [
                pos[0] + (0 - pos[0]) * k,
                pos[1] + (5.2 - pos[1]) * k,
                pos[2] + (WALL_Z - 0.5 - pos[2]) * k,
            ];
        }
    });

    return (
        <>
            <PovCamera
                positionRef={camPosRef}
                lookAhead={[0, -0.28, -7]}
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

            <DeathStrip />

            <SearchLight
                towerX={-7}
                towerZ={-9}
                poolZ={-5.5}
                amp={7}
                speed={0.75}
                phase={0.6}
                radius={POOL_RADIUS}
                bandZ={[-14, -3]}
                huntRef={huntRef}
                onSweep={(x, z) => {
                    poolsRef.current[0] = { x, z };
                }}
            />
            <SearchLight
                towerX={7}
                towerZ={-3}
                poolZ={2}
                amp={7}
                speed={0.6}
                phase={2.4}
                radius={POOL_RADIUS}
                bandZ={[-3, 10]}
                huntRef={huntRef}
                onSweep={(x, z) => {
                    poolsRef.current[1] = { x, z };
                }}
            />

            {/* Grensevakt på patrulje - kommer alltid tilbake */}
            {gameState !== 'won' && (
                <Mover
                    from={guardFrom}
                    to={guardTo}
                    speed={1.5}
                    bob={0.05}
                    phase={leg}
                    onArrive={() => setLeg((l) => l + 1)}
                    onMove={(x, _y, z) => {
                        guardPosRef.current = { x, z };
                    }}
                >
                    <Person pose="walk" body="#3f4a3a" legs="#2c332a" hat="cap" hatColor="#3f4a3a" />
                </Mover>
            )}
        </>
    );
}

// ---- Hovedelement ----

const FluktenOverMuren3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const wind = useAmbience('wind', -30);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [fenceFlash, setFenceFlash] = useState(0);
    const [distLeft, setDistLeft] = useState(START_Z - WALL_Z);

    const camPosRef = useRef<[number, number, number]>([0, 1.55, START_Z]);
    const movingRef = useRef(false);
    const steerRef = useRef(0);
    const gameStateRef = useRef<GameState>('idle');
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Felles fail-flyt: kalles fra målerens onOverload og klokkas onExpire.
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

    // Avstandsmåler (~4 Hz, ikke per frame)
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            setDistLeft(Math.max(0, Math.round(camPosRef.current[2] - WALL_Z)));
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
        setDistLeft(START_Z - WALL_Z);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        wind.start();
        setBanner('Hold inne for å løpe. Slipp for å fryse når lyset kommer!');
        setTimeout(() => setBanner(null), 3200);
    }, [alarm, clock, sounds, wind]);

    const handleFence = useCallback(() => {
        sounds.play('incorrect');
        alarm.add(0.25);
        setFenceFlash((f) => f + 1);
        setBanner('Signalgjerdet! Vaktene er varslet - lyskasterne leter etter deg.');
        setTimeout(() => setBanner(null), 2600);
    }, [alarm, sounds]);

    const score = Math.max(0.4, 1 - fails * 0.15);

    const handleReachWall = useCallback(() => {
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
        wind.stop();
    }, [alarm, wind]);

    return (
        <MicroGameScaffold
            title="Flukten over Muren"
            subtitle="Kom deg over dødsstripa i ly av mørket - frys når lyskasterne sveiper mot deg"
            estimatedSeconds={150}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 1.55, START_Z] as [number, number, number], fov: 62 },
                background: '#141b2e',
                fog: { color: '#141b2e', near: 12, far: 44 },
                sunPosition: [6, 10, 6] as [number, number, number],
                sunIntensity: 0.18,
                ambientIntensity: 0.5,
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#141b2e] to-[#0c1120]"
            overlays={
                <>
                    <Crosshair
                        show={gameState === 'playing'}
                        crosshairRef={aim.ref}
                        variant="dot"
                    />
                    <ScreenFlash trigger={fenceFlash} preset="flare" durationMs={140} />
                    <DangerVignette level={gameState === 'playing' ? alarm.value : 0} />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Til daggry"
                            warnBelow={15}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout corner="bl" items={[{ label: 'Til muren', value: distLeft, unit: 'm' }]} />
                    )}
                    <SceneBanner message={banner} wide />
                    {gameState === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-black/50 text-white/75 rounded-xl text-xs text-center max-w-sm leading-relaxed">
                                Øst-Berlin, en natt i 1962. Bak dødsstripa lyser Vest-Berlin.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <StripScene
                    key={attempt}
                    gameState={gameState}
                    attempt={attempt}
                    isRunning={isRunning}
                    camPosRef={camPosRef}
                    movingRef={movingRef}
                    steerRef={steerRef}
                    onAim={handleAim}
                    onHoldChange={handleHold}
                    alarmAdd={alarm.add}
                    onFence={handleFence}
                    onReachWall={handleReachWall}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Du står i skyggen på østsiden. Hold inne museknappen for å løpe mot muren,
                        og styr med pekeren. Slipp for å fryse - vaktene ser bare det som beveger
                        seg i lyset.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow"
                    >
                        Vent på mørket - løp!
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={alarm.value}
                    label="Alarmnivå"
                    hint="Lyskasterne ser bevegelse. Frys når lyset nærmer seg - og hold avstand til vakta."
                    labels={{ normal: 'Ubemerket', warn: 'Mistenksom', danger: 'ALARM!' }}
                />
            )}

            {gameState === 'caught' && (
                <LoseScreen title="Lyskasteren fanget deg" onRetry={begin}>
                    Vaktene hadde ordre om å stoppe alle som prøvde å rømme. Prøv igjen: løp i
                    mørket mellom lysflekkene, og frys helt når lyset sveiper mot deg.
                </LoseScreen>
            )}

            {gameState === 'dawn' && (
                <LoseScreen title="Det ble lyst før du kom over" onRetry={begin}>
                    I dagslys var dødsstripa umulig å krysse. De fleste fluktforsøkene skjedde om
                    natten - og de som lyktes, brukte hvert sekund av mørket.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={
                        fails === 0
                            ? 'Du kom deg over - på første forsøk!'
                            : 'Du kom deg over til Vest-Berlin!'
                    }
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Rundt 5000 mennesker klarte å rømme over Berlinmuren mellom 1961 og 1989. Minst
                    140 mistet livet i forsøket. Dødsstripa du nettopp krysset var bygget for at
                    ingen skulle klare det du gjorde nå.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default FluktenOverMuren3D;
