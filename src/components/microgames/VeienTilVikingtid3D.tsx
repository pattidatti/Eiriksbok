import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Landmark, Ship, Trophy, RotateCcw, Hand, ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Burst } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Veien til vikingtiden - et fritt 3D-mikrospill. Dette er IKKE et objekt å
// inspisere, men en levende norsk kyst som eleven forvandler fra sammenbrudd til
// vikingtid. Tre grep driver de stille århundrene (550-793) framover: folk vender
// tilbake, høvdingmakten reiser seg, og til slutt får robåten seil. Lyspæra kommer
// i siste steg: vikingtiden braket ikke ut fra ingenting. Den ble bygd stein for stein
// gjennom de stille århundrene - og seilet var det som til slutt åpnet havet.
//
// Mekanikken: eleven trykker tre kort i rekkefølge (Chromebook-vennlig, ingen
// fikkel-klikk). Scenen leser bare `stage` (0-3) og demper alt mykt mot mål
// utledet av stage, slik at hele kysten animeres når stage øker.

function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

// Enkel, ren pseudo-random på modulnivå (ikke muter let inni useMemo).
function rng(seed: number) {
    const x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
}

interface Step {
    id: string;
    stage: number;
    title: string;
    blurb: string;
    Icon: React.ComponentType<{ className?: string }>;
    banner: string;
    fact: string;
}

const STEPS: Step[] = [
    {
        id: 'folk',
        stage: 1,
        title: 'Rydd gårdene på nytt',
        blurb: 'Folk overlevde krisen. La bygda fylles med liv igjen.',
        Icon: Users,
        banner: 'Bygda reiser seg. Åkrene grønnes og folk vender tilbake.',
        fact: 'Etter nedgangstiden vokste befolkningen sakte igjen. Gårder som lå øde ble ryddet på nytt, og bygdene fyltes med folk.',
    },
    {
        id: 'makt',
        stage: 2,
        title: 'Reis høvdinghallen',
        blurb: 'Færre, men sterkere ledere samler makt. Reis den store hallen.',
        Icon: Landmark,
        banner: 'Høvdinghallen reiser seg, og en handelsplass åpner ved stranda.',
        fact: 'Makten ble samlet hos færre og mektigere høvdinger. Den store hallen og en handelsplass ved stranda ble sentrum for makt og varer.',
    },
    {
        id: 'seil',
        stage: 3,
        title: 'Reis seilet',
        blurb: 'Robåten får mast og seil. Nå kan de krysse åpent hav.',
        Icon: Ship,
        banner: 'Seilet heises! Robåten blir et havgående skip - vikingtiden begynner.',
        fact: 'Det siste steget var seilet. Da robåten fikk mast og seil, kunne nordboerne krysse åpent hav - og i år 793 seilte de mot Lindisfarne.',
    },
];

const VeienTilVikingtid3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const nextStep = STEPS[stage];

    const choose = (step: Step) => {
        if (step.stage !== stage + 1 || done) return;
        sounds.play(step.stage === 3 ? 'sceneChange' : 'advance');
        setStage(step.stage);
        setBanner(step.banner);
        setFact(step.fact);
        if (step.stage === 3) {
            setTimeout(() => {
                sounds.play('complete');
                setDone(true);
                setBurst((b) => b + 1);
                onComplete({ score: 1, completed: true, artifact: { stage: 3 } });
            }, 4200);
        } else {
            sounds.play('correct');
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
            title="Veien til vikingtiden"
            subtitle="Forvandle den norske kysten fra sammenbrudd til vikingtid, steg for steg"
            estimatedSeconds={150}
            onRetry={stage > 0 ? reset : undefined}
            bleed
        >
            <div className="flex flex-col">
                {/* --- 3D-scenen (full bredde) --- */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#a9c9dd] via-[#cfe0e6] to-[#dcd2b6] overflow-hidden"
                    style={{ aspectRatio: '16 / 10.8', minHeight: 360 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [13, 9.5, 13], fov: 38 }}
                        background="#a9c9dd"
                        fog={{ color: '#c4d8e2', near: 26, far: 52 }}
                        target={[0, 0.6, 0]}
                    >
                        <Coast stage={stage} />
                        <Burst position={[-8, 3, 3]} trigger={burst} color="#e2c65a" count={30} spread={3.4} />
                    </MicroCanvas>
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{ boxShadow: 'inset 0 0 90px 10px rgba(15,23,42,0.18)' }}
                    />

                    {idle && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-sky-800 shadow"
                        >
                            <Hand className="w-3.5 h-3.5" />
                            Dra for å se kysten - velg et grep under
                        </motion.div>
                    )}

                    {/* Era-merke nede til hoyre */}
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        {stage === 0
                            ? '~550 · Etter sammenbruddet'
                            : stage === 1
                              ? '~650 · Bygda vender tilbake'
                              : stage === 2
                                ? '~725 · Høvdinger og handel'
                                : '793 · Vikingtiden begynner'}
                    </div>

                    {/* Banner over scenen */}
                    <AnimatePresence>
                        {banner && !done && (
                            <motion.div
                                key={banner}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-3 left-3 right-3 mx-auto max-w-md rounded-xl bg-sky-900/85 text-sky-50 px-4 py-2.5 text-sm font-semibold shadow-lg text-center"
                            >
                                {banner}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- Kontrollpanel UNDER vinduet --- */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-sky-200">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-sky-700">
                        {done ? 'Veien til vikingtiden er ferdig' : `Grep ${stage + 1} av 3`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {STEPS.map((step) => {
                            const isDone = stage >= step.stage;
                            const isNext = nextStep?.id === step.id && !done;
                            const Icon = step.Icon;
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => choose(step)}
                                    disabled={!isNext}
                                    className={`relative text-left rounded-xl border-2 p-3 transition ${
                                        isDone
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : isNext
                                              ? 'bg-sky-100 border-sky-400 hover:bg-sky-200 hover:border-sky-500 shadow-sm cursor-pointer'
                                              : 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                                isDone
                                                    ? 'bg-emerald-500 text-white'
                                                    : isNext
                                                      ? 'bg-sky-500 text-white'
                                                      : 'bg-slate-200 text-slate-400'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                                {step.title}
                                            </p>
                                        </div>
                                        {isNext && (
                                            <ArrowRight className="w-4 h-4 text-sky-600 flex-shrink-0 animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                                        {step.blurb}
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
                                            Vikingtiden braket ikke ut fra ingenting.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        De stille århundrene bygde grunnlaget stein for stein: folk,
                                        makt og handel kom tilbake, og til slutt gjorde seilet det
                                        mulig å krysse havet. Da var vikingtiden klar.
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
                                className="mt-3 bg-white border border-sky-200 rounded-xl p-3"
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
                                Velg grepene i rekkefølge og se kysten forvandle seg mot vikingtiden.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MicroGameFrame>
    );
};

// ============================================================
//  3D-SCENEN - alt utledes av `stage` og dempes mykt mot mål.
// ============================================================

function Coast({ stage }: { stage: number }) {
    return (
        <group>
            <Ground stage={stage} />
            <Sea />
            <BorgRuin />
            <Field stage={stage} />
            <Farm stage={stage} />
            <Hall stage={stage} />
            <MarketStall stage={stage} />
            <Settlers stage={stage} />
            <VikingBoat stage={stage} />
            <Trees />
        </group>
    );
}

// --- Bakke: brun og karrig ved sammenbrudd, grønnere når folk vender tilbake ---
const DEAD = new THREE.Color('#9c8f5f');
const LIVE = new THREE.Color('#6f9a45');
function Ground({ stage }: { stage: number }) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (matRef.current) {
            matRef.current.color.lerp(stage >= 1 ? LIVE : DEAD, Math.min(1, dt * 1.6));
        }
    });
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[46, 34]} />
            <meshStandardMaterial ref={matRef} color={DEAD} roughness={1} />
        </mesh>
    );
}

// --- Havet langs -X, med skimrende flate ---
function Sea() {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        if (matRef.current) {
            matRef.current.emissiveIntensity = 0.12 + Math.sin(clock.getElapsedTime() * 1.2) * 0.05;
        }
    });
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16, 0.02, 2]}>
            <planeGeometry args={[18, 32]} />
            <meshStandardMaterial
                ref={matRef}
                color="#3d7fa6"
                roughness={0.3}
                metalness={0.15}
                emissive="#1e4d6b"
                emissiveIntensity={0.14}
            />
        </mesh>
    );
}

// --- Bygdeborg-ruin på haugen: forfalt steinmur som alltid står der ---
function BorgRuin() {
    const blocks = useMemo(() => {
        const out: { pos: [number, number, number]; s: [number, number, number]; rot: number }[] = [];
        for (let i = 0; i < 9; i++) {
            const a = (i / 9) * Math.PI * 1.15 - 0.4;
            const r = 2.4;
            const fell = rng(i + 3);
            out.push({
                pos: [Math.cos(a) * r, 0.35 + fell * 0.25, Math.sin(a) * r],
                s: [0.9, 0.5 + fell * 0.4, 0.7],
                rot: (rng(i + 8) - 0.5) * 0.6,
            });
        }
        return out;
    }, []);
    return (
        <group position={[9, 1.6, -8]}>
            {/* haug */}
            <mesh position={[0, -0.6, 0]} receiveShadow>
                <cylinderGeometry args={[3.4, 4.2, 1.4, 20]} />
                <meshStandardMaterial color="#78794c" roughness={1} />
            </mesh>
            {blocks.map((b, i) => (
                <mesh key={i} position={b.pos} rotation={[0, b.rot, 0]} castShadow>
                    <boxGeometry args={b.s} />
                    <meshStandardMaterial color="#8b8b7a" roughness={0.95} />
                </mesh>
            ))}
        </group>
    );
}

// --- Åkeren: rutenett som glir fra brun/overgrodd til grønt salgsjordbruk ---
const FIELD_DEAD = new THREE.Color('#8a7d4e');
const FIELD_LIVE = new THREE.Color('#8fae4a');
function Field({ stage }: { stage: number }) {
    const tiles = useMemo(() => {
        const out: [number, number][] = [];
        for (let cx = 0; cx < 5; cx++) {
            for (let cz = 0; cz < 4; cz++) {
                out.push([cx * 1.5 - 3.0, cz * 1.5 - 2.2]);
            }
        }
        return out;
    }, []);
    return (
        <group position={[3, 0, 4]}>
            {tiles.map((t, i) => (
                <FieldTile key={i} x={t[0]} z={t[1]} stage={stage} seed={i} />
            ))}
        </group>
    );
}

function FieldTile({ x, z, stage, seed }: { x: number; z: number; stage: number; seed: number }) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const wobble = rng(seed) * 0.1;
    useFrame((_, dt) => {
        if (matRef.current) {
            matRef.current.color.lerp(stage >= 1 ? FIELD_LIVE : FIELD_DEAD, Math.min(1, dt * 2));
        }
        if (meshRef.current) {
            const target = stage >= 1 ? 0.24 + wobble : 0.1;
            const sc = damp(meshRef.current.scale.y, target / 0.2, dt, 3);
            meshRef.current.scale.y = sc;
            meshRef.current.position.y = (0.2 * sc) / 2;
        }
    });
    return (
        <mesh ref={meshRef} position={[x, 0.06, z]} castShadow receiveShadow>
            <boxGeometry args={[1.3, 0.2, 1.3]} />
            <meshStandardMaterial ref={matRef} color={FIELD_DEAD} roughness={1} />
        </mesh>
    );
}

// --- Gården: grå og forfallen ved sammenbrudd, reparert med røykpipe når folk vender tilbake ---
const ROOF_DEAD = new THREE.Color('#6b6656');
const ROOF_LIVE = new THREE.Color('#5c3326');
const WALL_DEAD = new THREE.Color('#8d8676');
const WALL_LIVE = new THREE.Color('#9c5a3c');
function Farm({ stage }: { stage: number }) {
    const wallRef = useRef<THREE.MeshStandardMaterial>(null);
    const roofRef = useRef<THREE.MeshStandardMaterial>(null);
    const tiltRef = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (wallRef.current) wallRef.current.color.lerp(stage >= 1 ? WALL_LIVE : WALL_DEAD, Math.min(1, dt * 1.8));
        if (roofRef.current) roofRef.current.color.lerp(stage >= 1 ? ROOF_LIVE : ROOF_DEAD, Math.min(1, dt * 1.8));
        if (tiltRef.current) {
            // Litt skjevt/forfallent ved stage 0, retter seg opp når bygda vender tilbake
            tiltRef.current.rotation.z = damp(tiltRef.current.rotation.z, stage >= 1 ? 0 : 0.09, dt, 2.5);
        }
    });
    return (
        <group position={[5, 0, -2]}>
            <group ref={tiltRef}>
                <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
                    <boxGeometry args={[2.2, 1.4, 1.6]} />
                    <meshStandardMaterial ref={wallRef} color={WALL_DEAD} roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[1.7, 0.8, 4]} />
                    <meshStandardMaterial ref={roofRef} color={ROOF_DEAD} roughness={0.95} />
                </mesh>
            </group>
            {/* røykpipe + røyk når gården er bebodd */}
            <ChimneySmoke show={stage >= 1} />
        </group>
    );
}

function ChimneySmoke({ show }: { show: boolean }) {
    const puffs = useRef<THREE.Mesh[]>([]);
    const COUNT = 4;
    const origin: [number, number, number] = [0.6, 2.1, 0];
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        for (let i = 0; i < COUNT; i++) {
            const m = puffs.current[i];
            if (!m) continue;
            const cycle = (t * 0.45 + i / COUNT) % 1;
            m.position.set(origin[0] + Math.sin(t + i) * cycle * 0.5, origin[1] + cycle * 1.7, origin[2] + Math.cos(t * 0.7 + i) * cycle * 0.3);
            const s = 0.12 + cycle * 0.32;
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
                    <meshStandardMaterial color="#c9cbcd" transparent opacity={0} roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// --- Høvdinghallen: reiser seg ved stage 2 ---
function Hall({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, stage >= 2 ? 1 : 0, dt, 2.4);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
    });
    return (
        <group ref={group} position={[1, 0, -3]} scale={[1, 0, 1]} visible={false}>
            {/* langt buet skrog-tak (hallen) */}
            <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                <boxGeometry args={[5.2, 2.0, 2.6]} />
                <meshStandardMaterial color="#7a4a2c" roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.35, 0]} rotation={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[1.5, 1.5, 5.2, 12, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color="#4a3322" roughness={0.95} side={THREE.DoubleSide} />
            </mesh>
            {/* gavl-stolper */}
            {[-2.6, 2.6].map((x, i) => (
                <mesh key={i} position={[x, 1.4, 0]} castShadow>
                    <cylinderGeometry args={[0.16, 0.2, 2.8, 7]} />
                    <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

// --- Handelsplassen: en bod ved stranda som reiser seg ved stage 2 ---
function MarketStall({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, stage >= 2 ? 1 : 0, dt, 2.6);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
    });
    return (
        <group ref={group} position={[-7, 0, 7]} scale={[1, 0, 1]} visible={false}>
            {/* bord */}
            <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[1.8, 0.15, 0.9]} />
                <meshStandardMaterial color="#8a6a3a" roughness={0.9} />
            </mesh>
            {[[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].map((p, i) => (
                <mesh key={i} position={[p[0], 0.25, p[1]]} castShadow>
                    <boxGeometry args={[0.1, 0.5, 0.1]} />
                    <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
                </mesh>
            ))}
            {/* fargede handelsvarer på bordet */}
            {[['#c94f3d', -0.5], ['#d8b24a', 0], ['#3f6b7a', 0.5]].map((v, i) => (
                <mesh key={i} position={[v[1] as number, 0.68, 0]} castShadow>
                    <boxGeometry args={[0.28, 0.22, 0.5]} />
                    <meshStandardMaterial color={v[0] as string} roughness={0.8} />
                </mesh>
            ))}
            {/* markise-stang */}
            <mesh position={[0, 1.15, 0]} castShadow>
                <boxGeometry args={[1.9, 0.08, 0.95]} />
                <meshStandardMaterial color="#b03a2e" roughness={0.85} />
            </mesh>
        </group>
    );
}

// --- Nybyggere: dukker opp når folk vender tilbake, flere ved handel,
//     og samler seg ved båten ved stage 3 ---
const PEOPLE = [
    { home: [4, 5] as [number, number], from: 1 },
    { home: [6, 3] as [number, number], from: 1 },
    { home: [2, 6] as [number, number], from: 2 },
    { home: [-2, 6] as [number, number], from: 2 },
    { home: [0, 3] as [number, number], from: 2 },
];
const BOAT_XZ: [number, number] = [-9, 8];

function Settlers({ stage }: { stage: number }) {
    return (
        <group>
            {PEOPLE.map((p, i) => (
                <Settler key={i} home={p.home} from={p.from} stage={stage} phase={i * 0.8} />
            ))}
        </group>
    );
}

function Settler({
    home,
    from,
    stage,
    phase,
}: {
    home: [number, number];
    from: number;
    stage: number;
    phase: number;
}) {
    const group = useRef<THREE.Group>(null);
    const appear = useRef(0);
    const walk = useRef(0);
    useFrame(({ clock }, dt) => {
        if (!group.current) return;
        const t = clock.getElapsedTime();
        // dukk opp når stage når `from`
        appear.current = damp(appear.current, stage >= from ? 1 : 0, dt, 2.2);
        group.current.scale.setScalar(appear.current);
        group.current.visible = appear.current > 0.03;
        // vandre mot båten ved stage 3
        walk.current = damp(walk.current, stage >= 3 ? 1 : 0, dt, 0.5);
        const w = walk.current;
        const x = home[0] + (BOAT_XZ[0] - home[0]) * w;
        const z = home[1] + (BOAT_XZ[1] - home[1]) * w;
        group.current.position.x = x;
        group.current.position.z = z;
        const moving = stage >= 3 && w < 0.98;
        group.current.position.y = moving ? Math.abs(Math.sin(t * 6 + phase)) * 0.1 : 0;
        if (w > 0.001) group.current.rotation.y = Math.atan2(BOAT_XZ[0] - home[0], BOAT_XZ[1] - home[1]);
        // forsvinn om bord
        if (stage >= 3 && w > 0.96) group.current.visible = false;
    });
    return (
        <group ref={group} position={[home[0], 0, home[1]]} visible={false}>
            <mesh position={[0, 0.32, 0]} castShadow>
                <cylinderGeometry args={[0.13, 0.18, 0.5, 7]} />
                <meshStandardMaterial color="#4a5b6a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.66, 0]} castShadow>
                <sphereGeometry args={[0.13, 10, 10]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.8} />
            </mesh>
        </group>
    );
}

// --- Båten: robåt på stranda, får mast og seil ved stage 3 og seiler ut ---
function VikingBoat({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const sailRise = useRef(0);
    const departure = useRef(0);
    const wait = useRef(0);
    const start: [number, number] = [-9, 8];
    const out: [number, number] = [-24, 2];
    useFrame(({ clock }, dt) => {
        if (!group.current) return;
        // seilet reiser seg ved stage 3
        sailRise.current = damp(sailRise.current, stage >= 3 ? 1 : 0, dt, 1.6);
        // vent til nybyggerne er om bord for båten legger ut
        if (stage >= 3) wait.current += dt;
        const leaving = stage >= 3 && wait.current > 2.2;
        departure.current = damp(departure.current, leaving ? 1 : 0, dt, 0.4);
        const p = departure.current;
        group.current.position.x = start[0] + (out[0] - start[0]) * p;
        group.current.position.z = start[1] + (out[1] - start[1]) * p;
        group.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.5) * 0.04;
    });
    return (
        <group ref={group} position={[start[0], 0.12, start[1]]}>
            {/* skrog */}
            <mesh position={[0, 0.28, 0]} castShadow>
                <boxGeometry args={[2.6, 0.5, 0.8]} />
                <meshStandardMaterial color="#5a3a22" roughness={0.85} />
            </mesh>
            {/* baug + akterstavn */}
            {[1.4, -1.4].map((x, i) => (
                <mesh key={i} position={[x, 0.42, 0]} rotation={[0, i === 0 ? Math.PI / 4 : -Math.PI / 4, i === 0 ? -0.5 : 0.5]} castShadow>
                    <coneGeometry args={[0.32, 0.9, 4]} />
                    <meshStandardMaterial color="#4a2f1c" roughness={0.85} />
                </mesh>
            ))}
            {/* årer langs siden (alltid der - det er en robåt) */}
            {[-0.7, 0, 0.7].map((x, i) => (
                <mesh key={i} position={[x, 0.35, 0.55]} rotation={[Math.PI / 2.4, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.9, 5]} />
                    <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
                </mesh>
            ))}
            {/* mast + seil - vokser fram ved stage 3 */}
            <Sail rise={sailRise} />
        </group>
    );
}

function Sail({ rise }: { rise: React.MutableRefObject<number> }) {
    const group = useRef<THREE.Group>(null);
    useFrame(() => {
        if (group.current) {
            const r = rise.current;
            group.current.scale.y = r;
            group.current.visible = r > 0.02;
        }
    });
    return (
        <group ref={group} scale={[1, 0, 1]} visible={false}>
            <mesh position={[0, 1.1, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 1.8, 6]} />
                <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
            </mesh>
            {/* rå (tverrstang) */}
            <mesh position={[0, 1.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 1.5, 6]} />
                <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
            </mesh>
            {/* seilet, med røde striper */}
            <mesh position={[0, 1.25, 0]}>
                <planeGeometry args={[1.5, 1.2]} />
                <meshStandardMaterial color="#efe7d6" side={THREE.DoubleSide} roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.25, 0.01]}>
                <planeGeometry args={[1.5, 0.28]} />
                <meshStandardMaterial color="#b03a2e" side={THREE.DoubleSide} roughness={0.9} />
            </mesh>
        </group>
    );
}

// --- Litt natur ---
function Tree({ position, alive }: { position: [number, number, number]; alive: boolean }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.14, 0.8, 6]} />
                <meshStandardMaterial color="#5c3f26" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.1, 0]} castShadow>
                <coneGeometry args={[0.6, 1.4, 8]} />
                <meshStandardMaterial color={alive ? '#3f6b39' : '#6f6a44'} roughness={0.9} />
            </mesh>
        </group>
    );
}

function Trees() {
    const spots: [number, number, number][] = [
        [11, 0, 8],
        [8, 0, 9.5],
        [13, 0, 2],
        [12, 0, -3],
    ];
    return (
        <>
            {spots.map((p, i) => (
                <Tree key={i} position={p} alive />
            ))}
        </>
    );
}

export default VeienTilVikingtid3D;
