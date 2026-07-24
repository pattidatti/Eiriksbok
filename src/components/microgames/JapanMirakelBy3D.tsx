import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, Ship, Building2, Trophy, RotateCcw, Hand, ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Burst } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Japans økonomiske mirakel — et stage-drevet scenespill. Eleven ser en by i
// ruiner i 1945 og tar tre valg som driver Japan fra aske til en av verdens
// rikeste byer. Hvert valg spiller av en synlig 3D-forvandling: fabrikker
// reiser seg, eksportskipet kommer, og til slutt lyser skyskrapere og lyntoget
// opp en moderne storby.
//
// Lyspæra: Japan ble ikke rikt av flaks eller våpen, men av kloke valg —
// skoler, kvalitet og eksport — gjentatt tiår etter tiår.
//
// Mekanikk (Chromebook-vennlig): tre valgkort i rekkefølge. Scenen leser bare
// `stage` (0-3) og demper alt mykt mot mål utledet av stage.

function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

interface Choice {
    id: string;
    stage: number;
    title: string;
    blurb: string;
    Icon: React.ComponentType<{ className?: string }>;
    banner: string;
    fact: string;
}

const CHOICES: Choice[] = [
    {
        id: 'gjenreis',
        stage: 1,
        title: 'Bygg skoler og fabrikker (1950)',
        blurb: 'Bruk pengene på industri og utdanning, ikke på en ny hær.',
        Icon: Factory,
        banner: 'Fabrikkene reiser seg fra ruinene. Japan satser alt på arbeid og skole.',
        fact: 'Etter krigen fikk Japan en grunnlov som forbød en stor hær. Mens andre land brukte penger på våpen, kunne Japan bruke alt på fabrikker, skoler og ny teknologi.',
    },
    {
        id: 'eksport',
        stage: 2,
        title: 'Lag kvalitetsvarer for eksport (1960)',
        blurb: 'Gjør "Made in Japan" til et tegn på topp kvalitet.',
        Icon: Ship,
        banner: 'Skipene fylles med biler og radioer. Verden vil ha japanske varer.',
        fact: 'Bedrifter som Toyota og Sony lagde varer av høy kvalitet. De forbedret seg litt hver dag (kaizen) og solgte biler og elektronikk til hele verden.',
    },
    {
        id: 'moderne',
        stage: 3,
        title: 'Bygg det moderne Japan (1980)',
        blurb: 'Skyskrapere, lyntog og en av verdens største økonomier.',
        Icon: Building2,
        banner: 'Storbyen lyser. Japan er nå verdens nest rikeste land.',
        fact: 'På rundt 40 år gikk Japan fra ruiner til verdens nest største økonomi. Lyntoget Shinkansen og høye skyskrapere ble symboler på miraklet.',
    },
];

const JapanMirakelBy3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const nextChoice = CHOICES[stage];

    const choose = (choice: Choice) => {
        if (choice.stage !== stage + 1 || done) return;
        setStage(choice.stage);
        setBanner(choice.banner);
        setFact(choice.fact);
        if (choice.stage === 3) {
            sounds.play('sceneChange');
            setTimeout(() => {
                sounds.play('complete');
                setDone(true);
                setBurst((b) => b + 1);
                onComplete({ score: 1, completed: true, artifact: { stage: 3 } });
            }, 3800);
        } else {
            sounds.play('advance');
        }
    };

    const reset = () => {
        setStage(0);
        setBanner(null);
        setFact(null);
        setDone(false);
    };

    const idle = stage === 0;

    return (
        <MicroGameFrame
            title="Reis Japan fra ruinene"
            subtitle="Tre valg forvandler byen fra aske i 1945 til moderne storby"
            estimatedSeconds={150}
            onRetry={stage > 0 ? reset : undefined}
            bleed
        >
            <div className="flex flex-col">
                {/* --- 3D-scenen (full bredde) --- */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#cdd8e0] via-[#dde6ec] to-[#e7ebe6] overflow-hidden"
                    style={{ aspectRatio: '16 / 10.8', minHeight: 360 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [14, 10, 15], fov: 38 }}
                        background="#cdd8e0"
                        fog={{ color: '#d6e0e6', near: 30, far: 56 }}
                        target={[0, 1.2, 0]}
                    >
                        <City stage={stage} />
                        <Burst position={[0, 6, 0]} trigger={burst} color="#f0b429" count={34} spread={4} />
                    </MicroCanvas>

                    {/* Vignette */}
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{ boxShadow: 'inset 0 0 90px 10px rgba(15,23,42,0.18)' }}
                    />

                    {idle && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-indigo-800 shadow"
                        >
                            <Hand className="w-3.5 h-3.5" />
                            Dra for å se byen - velg et tiltak under
                        </motion.div>
                    )}

                    {/* Era-merke nede til høyre */}
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        {stage === 0
                            ? '1945 · Byen i ruiner'
                            : stage === 1
                              ? '1950-tallet · Gjenreising'
                              : stage === 2
                                ? '1960-tallet · Eksportlandet'
                                : '1980-tallet · Det moderne Japan'}
                    </div>

                    {/* Banner over scenen */}
                    <AnimatePresence>
                        {banner && !done && (
                            <motion.div
                                key={banner}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-3 left-3 right-3 mx-auto max-w-md rounded-xl bg-indigo-900/85 text-indigo-50 px-4 py-2.5 text-sm font-semibold shadow-lg text-center"
                            >
                                {banner}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- Kontrollpanel UNDER vinduet --- */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-indigo-100">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-indigo-700">
                        {done ? 'Miraklet er fullført' : `Tiltak ${stage + 1} av 3`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {CHOICES.map((choice) => {
                            const isDone = stage >= choice.stage;
                            const isNext = nextChoice?.id === choice.id && !done;
                            const Icon = choice.Icon;
                            return (
                                <button
                                    key={choice.id}
                                    onClick={() => choose(choice)}
                                    disabled={!isNext}
                                    className={`relative text-left rounded-xl border-2 p-3 transition ${
                                        isDone
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : isNext
                                              ? 'bg-indigo-100 border-indigo-400 hover:bg-indigo-200 hover:border-indigo-500 shadow-sm cursor-pointer'
                                              : 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                                isDone
                                                    ? 'bg-emerald-500 text-white'
                                                    : isNext
                                                      ? 'bg-indigo-500 text-white'
                                                      : 'bg-slate-200 text-slate-400'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                                {choice.title}
                                            </p>
                                        </div>
                                        {isNext && (
                                            <ArrowRight className="w-4 h-4 text-indigo-600 flex-shrink-0 animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                                        {choice.blurb}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        {done ? (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                                className="mt-3 bg-emerald-50 border border-emerald-300 rounded-xl p-3 sm:flex sm:items-center sm:gap-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-2">
                                        <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm font-bold text-emerald-900 leading-snug">
                                            Fra ruiner til rikdom på 40 år.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        Japan satset på skoler, kvalitet og eksport i stedet for våpen.
                                        De kloke valgene, gjentatt tiår etter tiår, ble det japanske
                                        miraklet.
                                    </p>
                                </div>
                                <button
                                    onClick={reset}
                                    className="mt-2.5 sm:mt-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition flex-shrink-0"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Spill igjen
                                </button>
                            </motion.div>
                        ) : fact ? (
                            <motion.div
                                key={fact}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-3 bg-white border border-indigo-100 rounded-xl p-3"
                            >
                                <p className="text-xs text-slate-600 leading-relaxed">{fact}</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 text-center text-xs text-slate-500 italic px-2"
                            >
                                Velg tiltakene i rekkefølge og se byen forvandle seg.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MicroGameFrame>
    );
};

// ============================================================
//  3D-SCENEN — alt utledes av `stage` og dempes mykt mot mål.
// ============================================================

function City({ stage }: { stage: number }) {
    return (
        <group>
            <Ground stage={stage} />
            <Bay />
            <Skyline stage={stage} />
            <Rubble stage={stage} />
            <FactoryRow stage={stage} />
            <CargoShip stage={stage} />
            <BulletTrain stage={stage} />
        </group>
    );
}

// --- Bakken: grå ruinmark som blir renere og grønnere etter hvert ---
function Ground({ stage }: { stage: number }) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const ruin = new THREE.Color('#9a958c');
    const clean = new THREE.Color('#8fae6b');
    useFrame((_, dt) => {
        if (matRef.current) {
            const target = stage >= 2 ? clean : ruin;
            matRef.current.color.lerp(target, Math.min(1, dt * 1.5));
        }
    });
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[46, 36]} />
            <meshStandardMaterial ref={matRef} color={ruin} roughness={1} />
        </mesh>
    );
}

// --- Havna langs -X, der eksportskipet ligger ---
function Bay() {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        if (matRef.current) {
            matRef.current.emissiveIntensity =
                0.1 + Math.sin(clock.getElapsedTime() * 1.2) * 0.05;
        }
    });
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16, 0.02, 1]}>
            <planeGeometry args={[16, 32]} />
            <meshStandardMaterial
                ref={matRef}
                color="#3d7fa6"
                roughness={0.3}
                metalness={0.15}
                emissive="#1e4d6b"
                emissiveIntensity={0.12}
            />
        </mesh>
    );
}

// --- Skyline: en rad bygg som vokser i høyde og lyser opp med stage ---
const TOWERS: { x: number; z: number; base: number; per: number[]; lit: boolean }[] = [
    { x: -3, z: -2, base: 0.6, per: [0.6, 2.2, 3.6, 6.2], lit: true },
    { x: 0, z: -4, base: 0.5, per: [0.5, 1.8, 3.0, 7.6], lit: true },
    { x: 3, z: -2, base: 0.7, per: [0.7, 2.0, 4.2, 5.4], lit: true },
    { x: 5.5, z: -5, base: 0.5, per: [0.5, 1.5, 2.6, 6.8], lit: false },
    { x: -5.5, z: -5, base: 0.6, per: [0.6, 1.6, 3.2, 4.8], lit: false },
    { x: -1.5, z: 2, base: 0.5, per: [0.5, 1.4, 2.4, 3.8], lit: false },
    { x: 2, z: 3, base: 0.6, per: [0.6, 1.3, 2.2, 4.4], lit: true },
];

function Skyline({ stage }: { stage: number }) {
    return (
        <group>
            {TOWERS.map((t, i) => (
                <Tower key={i} {...t} stage={stage} index={i} />
            ))}
        </group>
    );
}

function Tower({
    x,
    z,
    per,
    lit,
    stage,
    index,
}: {
    x: number;
    z: number;
    base: number;
    per: number[];
    lit: boolean;
    stage: number;
    index: number;
}) {
    const mesh = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const h = useRef(per[0]);
    const WIDTH = 1.5;
    const gray = new THREE.Color('#b4ada0');
    const modern = new THREE.Color('#cdd7e2');

    useFrame((_, dt) => {
        const targetH = per[Math.min(stage, 3)];
        h.current = damp(h.current, targetH, dt, 2.4);
        if (mesh.current) {
            mesh.current.scale.y = h.current;
            mesh.current.position.y = h.current / 2;
        }
        if (matRef.current) {
            matRef.current.color.lerp(stage >= 2 ? modern : gray, Math.min(1, dt * 1.6));
            // Neon-glød i vinduene når byen blir moderne
            const glow = lit && stage >= 3 ? 0.5 : 0;
            matRef.current.emissiveIntensity = damp(
                matRef.current.emissiveIntensity,
                glow,
                dt,
                2
            );
        }
    });
    void index;
    return (
        <mesh ref={mesh} position={[x, per[0] / 2, z]} scale={[1, per[0], 1]} castShadow receiveShadow>
            <boxGeometry args={[WIDTH, 1, WIDTH]} />
            <meshStandardMaterial
                ref={matRef}
                color={gray}
                roughness={0.7}
                metalness={0.1}
                emissive="#ffd27a"
                emissiveIntensity={0}
            />
        </mesh>
    );
}

// --- Ruinhauger: synlige i 1945, synker ned i bakken når byen reises ---
const RUBBLE: [number, number][] = [
    [-2, 4],
    [4, 1],
    [-4, 1],
    [1, -1],
    [6, 2],
    [-6, 3],
];

function Rubble({ stage }: { stage: number }) {
    return (
        <group>
            {RUBBLE.map((p, i) => (
                <RubblePile key={i} x={p[0]} z={p[1]} stage={stage} seed={i} />
            ))}
        </group>
    );
}

function RubblePile({ x, z, stage, seed }: { x: number; z: number; stage: number; seed: number }) {
    const group = useRef<THREE.Group>(null);
    const sink = useRef(0);
    useFrame((_, dt) => {
        // Ruinene forsvinner gradvis fra og med første tiltak
        sink.current = damp(sink.current, stage >= 1 ? 1 : 0, dt, 1.8);
        if (group.current) {
            group.current.position.y = -sink.current * 1.2;
            group.current.visible = sink.current < 0.97;
        }
    });
    const blocks = useMemo(() => {
        const out: { p: [number, number, number]; s: number; r: number }[] = [];
        let s = seed * 12.9898;
        const rnd = () => {
            s = (Math.sin(s) * 43758.5453) % 1;
            return Math.abs(s);
        };
        for (let i = 0; i < 4; i++) {
            out.push({
                p: [rnd() * 1.4 - 0.7, 0.12 + rnd() * 0.2, rnd() * 1.4 - 0.7],
                s: 0.3 + rnd() * 0.4,
                r: rnd() * Math.PI,
            });
        }
        return out;
    }, [seed]);
    return (
        <group ref={group} position={[x, 0, z]}>
            {blocks.map((b, i) => (
                <mesh key={i} position={b.p} rotation={[0, b.r, 0.2]} castShadow>
                    <boxGeometry args={[b.s, b.s * 0.7, b.s]} />
                    <meshStandardMaterial color="#867f72" roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// --- Fabrikkrekke med pipe + røyk: reiser seg ved stage 1 ---
function FactoryRow({ stage }: { stage: number }) {
    // På land (kaia ligger ved x=-8) og klar av togskinnen ved z=7.
    const positions: [number, number][] = [
        [-7.2, 4.8],
        [-5.4, 3.6],
        [-7.2, 2.2],
    ];
    return (
        <group>
            {positions.map((p, i) => (
                <FactoryUnit key={i} x={p[0]} z={p[1]} stage={stage} delay={i * 0.3} />
            ))}
        </group>
    );
}

function FactoryUnit({
    x,
    z,
    stage,
    delay,
}: {
    x: number;
    z: number;
    stage: number;
    delay: number;
}) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    const wait = useRef(0);
    useFrame((_, dt) => {
        const show = stage >= 1;
        if (show) wait.current += dt;
        const active = show && wait.current > delay;
        rise.current = damp(rise.current, active ? 1 : 0, dt, 2.6);
        if (group.current) {
            group.current.scale.y = rise.current;
            group.current.visible = rise.current > 0.02;
        }
    });
    return (
        <group ref={group} position={[x, 0, z]} scale={[1, 0, 1]} visible={false}>
            <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[1.5, 1.1, 1.3]} />
                <meshStandardMaterial color="#9a5a3a" roughness={0.85} />
            </mesh>
            <mesh position={[0.5, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.13, 0.17, 1.1, 10]} />
                <meshStandardMaterial color="#5a3a2a" roughness={0.9} />
            </mesh>
            <Smoke origin={[0.5, 2.1, 0]} show={stage >= 1} />
        </group>
    );
}

function Smoke({ origin, show }: { origin: [number, number, number]; show: boolean }) {
    const puffs = useRef<THREE.Mesh[]>([]);
    const COUNT = 4;
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        for (let i = 0; i < COUNT; i++) {
            const m = puffs.current[i];
            if (!m) continue;
            const cycle = (t * 0.5 + i / COUNT) % 1;
            const y = origin[1] + cycle * 1.8;
            const spread = cycle * 0.5;
            m.position.set(
                origin[0] + Math.sin(t + i) * spread,
                y,
                origin[2] + Math.cos(t * 0.7 + i) * spread * 0.5
            );
            const s = 0.16 + cycle * 0.38;
            m.scale.setScalar(s);
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.opacity = show ? (1 - cycle) * 0.5 : 0;
            m.visible = show;
        }
    });
    return (
        <group>
            {Array.from({ length: COUNT }).map((_, i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        if (el) puffs.current[i] = el;
                    }}
                >
                    <sphereGeometry args={[1, 8, 8]} />
                    <meshStandardMaterial color="#8a8a8a" transparent opacity={0} roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// --- Eksportskipet: kommer inn til havna ved stage 2 ---
function CargoShip({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const sail = useRef(0);
    useFrame(({ clock }, dt) => {
        sail.current = damp(sail.current, stage >= 2 ? 1 : 0, dt, 0.5);
        const p = sail.current;
        if (group.current) {
            // Glir inn langs kaia (fra det fjerne mot kamera) og legger til
            // synlig i bildeutsnittet, med litt dypgang i vannet.
            group.current.position.x = -9.3;
            group.current.position.z = -13 + 14 * p;
            group.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.2) * 0.03;
            group.current.visible = p > 0.01;
        }
    });
    return (
        <group
            ref={group}
            position={[-9.3, -0.05, -13]}
            rotation={[0, -Math.PI / 2, 0]}
            visible={false}
        >
            {/* skrog */}
            <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[4.5, 0.7, 1.3]} />
                <meshStandardMaterial color="#37506b" roughness={0.8} />
            </mesh>
            {/* containere */}
            {[-1.3, -0.3, 0.7].map((cx, i) => (
                <mesh key={i} position={[cx, 0.95, 0]} castShadow>
                    <boxGeometry args={[0.8, 0.6, 1.0]} />
                    <meshStandardMaterial
                        color={['#c0492f', '#2f7a5a', '#c9a72f'][i]}
                        roughness={0.8}
                    />
                </mesh>
            ))}
            {/* styrehus */}
            <mesh position={[1.7, 0.95, 0]} castShadow>
                <boxGeometry args={[0.7, 0.8, 1.0]} />
                <meshStandardMaterial color="#e8e2d4" roughness={0.85} />
            </mesh>
        </group>
    );
}

// --- Lyntoget Shinkansen: suser over scenen ved stage 3 ---
function BulletTrain({ stage }: { stage: number }) {
    const train = useRef<THREE.Group>(null);
    const t = useRef(0);
    const railZ = 7;
    useFrame((_, dt) => {
        if (stage >= 3) {
            t.current += dt * 0.18;
            const p = (t.current % 1.4) / 1.4; // gjentar
            if (train.current) {
                train.current.position.x = -5 + 21.5 * p;
                train.current.visible = true;
            }
        } else if (train.current) {
            train.current.visible = false;
        }
    });
    return (
        <group position={[0, 0, railZ]}>
            {/* Skinnen ligger på bakken og stopper ved kaia (x=-8), ikke ute i vannet */}
            {stage >= 3 && (
                <mesh position={[6, 0.15, 0]} receiveShadow>
                    <boxGeometry args={[28, 0.3, 0.6]} />
                    <meshStandardMaterial color="#8a9098" metalness={0.4} roughness={0.6} />
                </mesh>
            )}
            <group ref={train} visible={false} position={[-5, 0.75, 0]}>
                {/* nese */}
                <mesh position={[2.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                    <coneGeometry args={[0.45, 1.4, 12]} />
                    <meshStandardMaterial color="#eef2f6" metalness={0.5} roughness={0.3} />
                </mesh>
                {/* kropp */}
                <mesh position={[0, 0, 0]} castShadow>
                    <boxGeometry args={[3.6, 0.9, 0.9]} />
                    <meshStandardMaterial color="#f3f6f9" metalness={0.4} roughness={0.35} />
                </mesh>
                {/* blå stripe */}
                <mesh position={[0, -0.15, 0.46]}>
                    <boxGeometry args={[3.6, 0.25, 0.02]} />
                    <meshStandardMaterial color="#1d6fb8" roughness={0.5} />
                </mesh>
            </group>
        </group>
    );
}

export default JapanMirakelBy3D;
