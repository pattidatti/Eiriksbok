import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { MicroGameScaffold, useShake, SceneBanner, WinScreen, DataReadout, Burst } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: eleven opplever maskingeværets kraft OG begrensning.
// Hold inne for å skyte kontinuerlig - uansett er det alltid for mange.

const WAVES = [5, 7, 9];
const TOTAL = WAVES.reduce((a, b) => a + b, 0);
const SPEED = 2.7;
const SPAWN_Z = -22;
const TRENCH_Z = -0.5;
const XSLOTS = [-7, -5.5, -3.5, -2, 0, 2, 3.5, 5.5, 7];
const FIRE_RATE = 0.115; // sekunder mellom skudd

type SoldierStatus = 'running' | 'dying' | 'gone';

interface Soldier {
    id: number;
    x: number;
    startZ: number;
    status: SoldierStatus;
}

interface Explosion {
    id: number;
    x: number;
    z: number;
}

function CameraSetup() {
    const { camera } = useThree();
    useEffect(() => {
        camera.lookAt(0, 0.5, -12);
    }, [camera]);
    return null;
}

// Artilleri-eksplosjon
function ExplosionEffect({ x, z }: { x: number; z: number }) {
    const ringRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const smokeARef = useRef<THREE.Mesh>(null);
    const smokeBRef = useRef<THREE.Mesh>(null);
    const startRef = useRef(-1);
    const [burst, setBurst] = useState(0);

    useEffect(() => {
        // Asynkront, ikke synkront i effekt-kroppen - avfyrer bursten ved mount.
        const t = setTimeout(() => setBurst(1), 0);
        return () => clearTimeout(t);
    }, []);

    useFrame((state) => {
        if (startRef.current < 0) startRef.current = state.clock.getElapsedTime();
        const t = state.clock.getElapsedTime() - startRef.current;

        if (glowRef.current) {
            const mat = glowRef.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = Math.max(0, 4 - t * 16);
            glowRef.current.scale.setScalar(Math.min(1 + t * 6, 3));
            mat.opacity = Math.max(0, 1 - t * 4);
        }
        if (ringRef.current) {
            const p = Math.min(t / 1.8, 1);
            ringRef.current.scale.set(1 + p * 5, 1, 1 + p * 5);
            (ringRef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(
                0,
                0.9 - p * 1.1
            );
        }
        if (smokeARef.current) {
            smokeARef.current.position.y = 0.3 + t * 2.8;
            smokeARef.current.scale.setScalar(0.6 + t * 0.8);
            (smokeARef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(
                0,
                0.8 - t * 0.4
            );
        }
        if (smokeBRef.current) {
            smokeBRef.current.position.y = 0.1 + t * 2.0;
            smokeBRef.current.position.x = 0.3;
            smokeBRef.current.scale.setScalar(0.4 + t * 0.55);
            (smokeBRef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(
                0,
                0.65 - t * 0.38
            );
        }
    });

    return (
        <group position={[x, 0, z]}>
            <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
                <circleGeometry args={[0.7, 16]} />
                <meshStandardMaterial
                    color="#ff6020"
                    emissive="#ff3000"
                    emissiveIntensity={4}
                    transparent
                    opacity={1}
                />
            </mesh>
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[0.3, 0.65, 24]} />
                <meshStandardMaterial
                    color="#cc4400"
                    emissive="#882200"
                    emissiveIntensity={1.5}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            <mesh ref={smokeARef} position={[0, 0.3, 0]}>
                <sphereGeometry args={[0.55, 8, 6]} />
                <meshStandardMaterial color="#3e3e3e" transparent opacity={0.8} />
            </mesh>
            <mesh ref={smokeBRef} position={[0.3, 0.1, 0]}>
                <sphereGeometry args={[0.38, 7, 5]} />
                <meshStandardMaterial color="#4a4a4a" transparent opacity={0.65} />
            </mesh>
            <Burst
                position={[0, 0.4, 0]}
                trigger={burst}
                color="#cc4400"
                count={22}
                spread={2.5}
                gravity={5}
                life={1.2}
                size={0.16}
            />
        </group>
    );
}

// Stastiske slagmarkselementer
function Battlefield() {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -11]} receiveShadow>
                <planeGeometry args={[36, 44]} />
                <meshStandardMaterial color="#3d2e1e" roughness={1} />
            </mesh>
            {Array.from({ length: 9 }, (_, i) => (
                <mesh key={i} position={[-4 + i * 1.0, 0.22, 0.9]} castShadow>
                    <boxGeometry args={[0.88, 0.46, 0.62]} />
                    <meshStandardMaterial color="#7a6b4a" roughness={0.95} />
                </mesh>
            ))}
            {/* Granatkratere - må ligge SÅ VIDT over bakkeplanet (y=0), ellers
                blir de begravd og usynlige */}
            {(
                [
                    [-3.5, 0.01, -6],
                    [4.5, 0.01, -11],
                    [-1, 0.01, -16],
                    [5.5, 0.01, -9],
                    [-5.5, 0.01, -13],
                    [1.5, 0.01, -19],
                ] as [number, number, number][]
            ).map(([x, y, z], i) => (
                <mesh key={i} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[1.4, 12]} />
                    <meshStandardMaterial color="#261809" roughness={1} />
                </mesh>
            ))}
            {([-6.5, -4.5, -2.5, 0, 2.5, 4.5, 6.5] as number[]).map((x, i) => (
                <group key={i} position={[x, 0, -4.5]}>
                    <mesh position={[0, 0.55, 0]}>
                        <cylinderGeometry args={[0.045, 0.045, 1.1, 4]} />
                        <meshStandardMaterial color="#4a4a4a" />
                    </mesh>
                    <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.025, 0.025, 1.05, 3]} />
                        <meshStandardMaterial color="#555" />
                    </mesh>
                </group>
            ))}
            {/* Døde trestammer - sylinderen er sentrert, så y = halve høyden
                for at stammen skal stå PÅ bakken, ikke halvveis begravd */}
            {(
                [
                    [-8, -9],
                    [7.5, -14],
                    [-6, -17],
                ] as [number, number][]
            ).map(([x, z], i) => (
                <mesh key={i} position={[x, (1.2 + i * 0.4) / 2, z]} castShadow>
                    <cylinderGeometry args={[0.2, 0.28, 1.2 + i * 0.4, 6]} />
                    <meshStandardMaterial color="#2e1f0f" roughness={1} />
                </mesh>
            ))}
        </>
    );
}

// Animert soldat
interface SoldierMeshProps {
    id: number;
    x: number;
    startZ: number;
    status: SoldierStatus;
    onHover: (id: number | null) => void;
    onReach: (id: number) => void;
    onDeathDone: (id: number) => void;
}

function SoldierMesh({ id, x, startZ, status, onHover, onReach, onDeathDone }: SoldierMeshProps) {
    const groupRef = useRef<THREE.Group>(null);
    const zRef = useRef(startZ);
    const dyingTRef = useRef(-1);
    const reportedRef = useRef(false);

    useEffect(() => {
        groupRef.current?.position.set(x, 0, startZ);
    }, [x, startZ]);

    useEffect(() => {
        return () => {
            onHover(null);
        };
    }, [onHover]);

    useFrame((state, dt) => {
        const g = groupRef.current;
        if (!g || status === 'gone') return;
        const t = state.clock.getElapsedTime();

        if (status === 'running') {
            zRef.current += dt * SPEED;
            g.position.set(x, Math.abs(Math.sin(t * 8 + id * 1.7)) * 0.07, zRef.current);
            g.rotation.x = 0.14;
            if (zRef.current >= TRENCH_Z && !reportedRef.current) {
                reportedRef.current = true;
                onReach(id);
            }
        } else if (status === 'dying') {
            if (dyingTRef.current < 0) dyingTRef.current = t;
            const el = t - dyingTRef.current;
            g.rotation.x = Math.min(0.14 + el * 4.0, Math.PI / 2 + 0.3);
            g.position.y -= dt * 2.2;
            g.scale.setScalar(Math.max(0.05, 1 - el));
            if (el > 0.65 && !reportedRef.current) {
                reportedRef.current = true;
                onDeathDone(id);
            }
        }
    });

    if (status === 'gone') return null;

    return (
        <group
            ref={groupRef}
            onPointerOver={(e) => {
                e.stopPropagation();
                if (status === 'running') onHover(id);
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                onHover(null);
            }}
        >
            {/* Stor usynlig treffflate */}
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[1.4, 2.4, 1.1]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0.68, 0]} castShadow>
                <boxGeometry args={[0.54, 1.28, 0.38]} />
                <meshStandardMaterial color="#1a1a2a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.48, 0]} castShadow>
                <sphereGeometry args={[0.25, 8, 6]} />
                <meshStandardMaterial color="#252535" roughness={0.85} />
            </mesh>
            <mesh position={[0.38, 0.82, 0.08]} rotation={[0.18, 0, 0.08]}>
                <boxGeometry args={[0.07, 0.98, 0.07]} />
                <meshStandardMaterial color="#3a2210" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Scene-rot (inni Canvas) - all spill-logikk bor her
interface SceneProps {
    soldiers: Soldier[];
    gameState: 'idle' | 'playing' | 'done';
    onShoot: (id: number) => void;
    onReach: (id: number) => void;
    onDeathDone: (id: number) => void;
    onCrosshairMove: (x: number, y: number) => void;
    onMuzzleFlash: () => void;
    onHeatBump: () => void;
}

function BattlefieldScene({
    soldiers,
    gameState,
    onShoot,
    onReach,
    onDeathDone,
    onCrosshairMove,
    onMuzzleFlash,
    onHeatBump,
}: SceneProps) {
    const { gl } = useThree();
    const { ref: shakeRef, shake } = useShake(0.38, 0.08, 2.4);

    // Mutable refs - unngår stale-closure og re-render
    const hoveredIdRef = useRef<number | null>(null);
    const shotIdsRef = useRef<Set<number>>(new Set());
    const isFiringRef = useRef(false);
    const fireAccRef = useRef(0);
    const onShootRef = useRef(onShoot);
    const onMuzzleFlashRef = useRef(onMuzzleFlash);
    const onHeatBumpRef = useRef(onHeatBump);
    const onCrosshairMoveRef = useRef(onCrosshairMove);

    // Hold prop-refs oppdatert uten å re-kjøre effects
    useEffect(() => {
        onShootRef.current = onShoot;
    }, [onShoot]);
    useEffect(() => {
        onMuzzleFlashRef.current = onMuzzleFlash;
    }, [onMuzzleFlash]);
    useEffect(() => {
        onHeatBumpRef.current = onHeatBump;
    }, [onHeatBump]);
    useEffect(() => {
        onCrosshairMoveRef.current = onCrosshairMove;
    }, [onCrosshairMove]);

    // Stopp skyting ved slipp av knapp (globalt, fanger opp utenfor canvas)
    useEffect(() => {
        const stop = () => {
            isFiringRef.current = false;
            fireAccRef.current = 0;
        };
        window.addEventListener('pointerup', stop);
        window.addEventListener('blur', stop);
        return () => {
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('blur', stop);
        };
    }, []);

    // Skjul systemmarkøren over canvas når man spiller
    useEffect(() => {
        if (gameState !== 'playing') return;
        const canvas = gl.domElement;
        // Canvas-elementet er et eksternt DOM-system; cursor-styring i en effekt
        // er riktig bruk selv om verdien kommer fra en hook.
        // eslint-disable-next-line react-hooks/immutability
        canvas.style.cursor = 'none';
        return () => {
            canvas.style.cursor = '';
        };
    }, [gameState, gl]);

    // Artilleri-timer
    const [explosions, setExplosions] = useState<Explosion[]>([]);
    const expIdRef = useRef(0);

    useEffect(() => {
        if (gameState !== 'playing') return;
        let tid: ReturnType<typeof setTimeout>;
        const boom = () => {
            const x = (Math.random() - 0.5) * 15;
            const z = -5 - Math.random() * 16;
            const id = expIdRef.current++;
            shake(0.75);
            setExplosions((prev) => [...prev, { id, x, z }]);
            setTimeout(() => setExplosions((prev) => prev.filter((e) => e.id !== id)), 2600);
            tid = setTimeout(boom, 2500 + Math.random() * 4500);
        };
        tid = setTimeout(boom, 1500 + Math.random() * 2000);
        return () => clearTimeout(tid);
    }, [gameState, shake]);

    // Nullstill ved ny bølge
    const firstId = soldiers.length > 0 ? soldiers[0].id : -1;
    useEffect(() => {
        shotIdsRef.current.clear();
        hoveredIdRef.current = null;
        isFiringRef.current = false;
        fireAccRef.current = 0;
    }, [firstId]);

    // Hovedeløkke: kontinuerlig skyting når museknapp holdes inne
    useFrame((_, dt) => {
        if (!isFiringRef.current || gameState !== 'playing') return;
        fireAccRef.current += dt;
        if (fireAccRef.current >= FIRE_RATE) {
            fireAccRef.current %= FIRE_RATE;
            shake(0.44);
            onMuzzleFlashRef.current();
            onHeatBumpRef.current();
            const hovId = hoveredIdRef.current;
            if (hovId !== null && !shotIdsRef.current.has(hovId)) {
                shotIdsRef.current.add(hovId);
                hoveredIdRef.current = null;
                onShootRef.current(hovId);
            }
        }
    });

    const handleHover = useCallback((id: number | null) => {
        if (id !== null && shotIdsRef.current.has(id)) return;
        hoveredIdRef.current = id;
    }, []);

    return (
        <group ref={shakeRef}>
            <CameraSetup />

            {/* Stor usynlig bakgrunnsflate - fanger pointerDown + move for skyting og sikte */}
            <mesh
                position={[0, 2, -20]}
                onPointerDown={() => {
                    if (gameState !== 'playing') return;
                    isFiringRef.current = true;
                    fireAccRef.current = 0;
                }}
                onPointerMove={(e) => {
                    if (gameState !== 'playing') return;
                    const rect = gl.domElement.getBoundingClientRect();
                    onCrosshairMoveRef.current(
                        ((e.nativeEvent.clientX - rect.left) / rect.width) * 100,
                        ((e.nativeEvent.clientY - rect.top) / rect.height) * 100
                    );
                }}
            >
                <planeGeometry args={[80, 40]} />
                <meshBasicMaterial
                    transparent
                    opacity={0}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <Battlefield />

            {soldiers
                .filter((s) => s.status !== 'gone')
                .map((s) => (
                    <SoldierMesh
                        key={s.id}
                        id={s.id}
                        x={s.x}
                        startZ={s.startZ}
                        status={s.status}
                        onHover={handleHover}
                        onReach={onReach}
                        onDeathDone={onDeathDone}
                    />
                ))}

            {explosions.map((e) => (
                <ExplosionEffect key={e.id} x={e.x} z={e.z} />
            ))}
        </group>
    );
}

// ---- Hovedelement ----

const IngenmanslandMG: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [soldiers, setSoldiers] = useState<Soldier[]>([]);
    const [wave, setWave] = useState(0);
    const [kills, setKills] = useState(0);
    const [reached, setReached] = useState(0);
    const [heat, setHeat] = useState(0);
    const [flashing, setFlashing] = useState(false);
    // Teller som remonterer glimt-elementet per skudd (ren erstatning for Date.now-key)
    const [flashTick, setFlashTick] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'done'>('idle');

    const idRef = useRef(0);
    const heatRef = useRef(0);
    const transRef = useRef(false);

    // Crosshair - direkte DOM-manipulasjon (unngår re-render per frame)
    const crosshairRef = useRef<HTMLDivElement>(null);
    const handleCrosshairMove = useCallback((x: number, y: number) => {
        if (crosshairRef.current) {
            crosshairRef.current.style.left = `${x}%`;
            crosshairRef.current.style.top = `${y}%`;
        }
    }, []);

    // Muzzle flash
    const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleMuzzleFlash = useCallback(() => {
        setFlashing(true);
        setFlashTick((t) => t + 1);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => setFlashing(false), 75);
    }, []);

    // Varme
    const handleHeatBump = useCallback(() => {
        heatRef.current = Math.min(1, heatRef.current + 0.13);
        setHeat(heatRef.current);
    }, []);

    // Varmekjøling
    useEffect(() => {
        const t = setInterval(() => {
            heatRef.current = Math.max(0, heatRef.current - 0.028);
            setHeat(heatRef.current);
        }, 80);
        return () => clearInterval(t);
    }, []);

    const spawnWave = useCallback((waveIndex: number) => {
        const count = WAVES[waveIndex];
        const slots = [...XSLOTS].sort(() => Math.random() - 0.5).slice(0, count);
        setSoldiers(
            slots.map((x) => ({
                id: idRef.current++,
                x,
                startZ: SPAWN_Z - Math.random() * 5,
                status: 'running' as SoldierStatus,
            }))
        );
        transRef.current = false;
    }, []);

    const startGame = () => {
        setGameState('playing');
        setWave(1);
        setKills(0);
        setReached(0);
        setBanner('Bølge 1 av 3 - hold inne for å skyte!');
        setTimeout(() => setBanner(null), 2500);
        spawnWave(0);
    };

    const handleShoot = useCallback(
        (id: number) => {
            sounds.play('correct');
            setKills((k) => k + 1);
            setSoldiers((prev) =>
                prev.map((s) => (s.id === id ? { ...s, status: 'dying' as SoldierStatus } : s))
            );
        },
        [sounds]
    );

    const handleReach = useCallback((id: number) => {
        setReached((r) => r + 1);
        setSoldiers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: 'gone' as SoldierStatus } : s))
        );
    }, []);

    const handleDeathDone = useCallback((id: number) => {
        setSoldiers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: 'gone' as SoldierStatus } : s))
        );
    }, []);

    const allGone = soldiers.length > 0 && soldiers.every((s) => s.status === 'gone');

    useEffect(() => {
        if (!allGone || gameState !== 'playing' || transRef.current) return;
        transRef.current = true;
        const nextWave = wave + 1;
        if (nextWave > WAVES.length) {
            setTimeout(() => {
                setGameState('done');
                setBanner(null);
                sounds.play('complete');
                onComplete({ score: kills / TOTAL, completed: true });
            }, 0);
        } else {
            // Asynkront (ikke synkront i effekt-kroppen) for å unngå kaskade-render
            setTimeout(() => setBanner('Neste bølge...'), 0);
            setTimeout(() => {
                setWave(nextWave);
                setBanner(`Bølge ${nextWave} av ${WAVES.length}`);
                spawnWave(nextWave - 1);
                setTimeout(() => setBanner(null), 2000);
            }, 1700);
        }
    }, [allGone, gameState, wave, kills, spawnWave, sounds, onComplete]);

    const reset = () => {
        setGameState('idle');
        setSoldiers([]);
        setWave(0);
        setKills(0);
        setReached(0);
        setBanner(null);
        heatRef.current = 0;
        setHeat(0);
        transRef.current = false;
    };

    const scoreMsg =
        kills >= TOTAL * 0.85
            ? `Fremragende - ${kills} av ${TOTAL} stoppet!`
            : kills >= TOTAL * 0.55
            ? `Godt forsvar - ${kills} av ${TOTAL} stoppet.`
            : `${kills} av ${TOTAL} stoppet - mange nådde frem.`;

    return (
        <MicroGameScaffold
            title="Maskingevær ved Somme"
            subtitle="Hold inne museknappen og sikt mot soldatene - du skyter kontinuerlig"
            estimatedSeconds={130}
            onRetry={gameState !== 'idle' ? reset : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 2, 3] as [number, number, number], fov: 68 },
                background: '#3a3d4a',
                fog: { color: '#3a3d4a', near: 8, far: 24 },
                sunPosition: [4, 5, 4] as [number, number, number],
                sunIntensity: 0.38,
                ambientIntensity: 0.9,
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#3a3d4a] to-[#22242e]"
            overlays={
                <>
                    {/* Militært sikte - oppdateres via DOM-ref (ingen re-render) */}
                    {gameState === 'playing' && (
                        <div
                            ref={crosshairRef}
                            className="absolute pointer-events-none"
                            style={{ left: '50%', top: '45%', transform: 'translate(-50%, -50%)' }}
                        >
                            <div className="relative w-12 h-12">
                                {/* Ytre ring */}
                                <div className="absolute inset-0 rounded-full border-2 border-white/50" />
                                {/* Venstre arm */}
                                <div className="absolute top-1/2 left-0 w-3.5 h-px bg-white/65 -translate-y-1/2" />
                                {/* Høyre arm */}
                                <div className="absolute top-1/2 right-0 w-3.5 h-px bg-white/65 -translate-y-1/2" />
                                {/* Øvre arm */}
                                <div className="absolute left-1/2 top-0 h-3.5 w-px bg-white/65 -translate-x-1/2" />
                                {/* Nedre arm */}
                                <div className="absolute left-1/2 bottom-0 h-3.5 w-px bg-white/65 -translate-x-1/2" />
                                {/* Sentrum */}
                                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-white/55 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                    )}

                    {/* Munningsglimt */}
                    <AnimatePresence>
                        {flashing && (
                            <motion.div
                                key={`f-${flashTick}`}
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: 0.08 }}
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background:
                                        'radial-gradient(ellipse at 50% 108%, rgba(255,210,80,0.7) 0%, rgba(255,120,30,0.25) 35%, transparent 65%)',
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Gevær-silhuett (CSS) */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
                        <div className="w-3.5 h-9 bg-slate-800/95 rounded-t-sm" />
                        <div className="w-16 h-5 bg-slate-800/95 rounded-t" />
                    </div>

                    {/* Score */}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Stoppet', value: kills },
                                { label: 'Gjennom', value: reached },
                            ]}
                        />
                    )}

                    <SceneBanner message={banner} wide />

                    {gameState === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-black/50 text-white/75 rounded-xl text-xs text-center max-w-xs leading-relaxed">
                                Vestfronten, 1916. Du sitter bak maskingeværet.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <BattlefieldScene
                    soldiers={soldiers}
                    gameState={gameState}
                    onShoot={handleShoot}
                    onReach={handleReach}
                    onDeathDone={handleDeathDone}
                    onCrosshairMove={handleCrosshairMove}
                    onMuzzleFlash={handleMuzzleFlash}
                    onHeatBump={handleHeatBump}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Du forsvarer en britisk skyttergrav på Vestfronten. Hold inn museknappen og
                        dra siktet over soldatene.
                    </p>
                    <button
                        onClick={startGame}
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow"
                    >
                        Start forsvaret
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600">
                            Løpsvarme - Bølge {wave} av {WAVES.length}
                        </span>
                        <span
                            className={`text-xs font-bold ${
                                heat >= 0.88
                                    ? 'text-red-600'
                                    : heat >= 0.62
                                    ? 'text-orange-500'
                                    : 'text-slate-400'
                            }`}
                        >
                            {heat >= 0.88 ? 'OVERHETET!' : heat >= 0.62 ? 'Varm' : 'Normal'}
                        </span>
                    </div>
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ width: `${heat * 100}%` }}
                            transition={{ duration: 0.07 }}
                            className={`h-full rounded-full ${
                                heat >= 0.88
                                    ? 'bg-red-500'
                                    : heat >= 0.62
                                    ? 'bg-orange-400'
                                    : 'bg-amber-300'
                            }`}
                        />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Hold inne og sikt - skyt saktere for å kjøle ned
                    </p>
                </div>
            )}

            {gameState === 'done' && (
                <WinScreen
                    title={scoreMsg}
                    onReplay={reset}
                    onNext={() => onComplete({ score: kills / TOTAL, completed: true })}
                >
                    Den 1. juli 1916 led de britiske styrkene 57 470 tap - drept og såret - på én
                    dag ved Somme. Maskingeværet var dødelig, men angrepsbølgene sluttet aldri. Slik
                    stivnet Vestfronten i fire år.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default IngenmanslandMG;
