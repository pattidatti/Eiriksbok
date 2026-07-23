import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns3, Spline, Sun, Trophy, RotateCcw, Hand, ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Burst } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Hagia Sofia — reis den store kuppelen. Et bygge-mikrospill der eleven setter
// sammen bysantinernes ingeniørmesterverk i tre grep. Lyspæra kommer i siste
// steg: kuppelen hviler ikke på tunge vegger, men på en RING AV 40 VINDUER. Når
// lyset strømmer inn, ser kuppelen ut til å sveve - akkurat slik bysantinerne
// ville at folk skulle føle Guds nærvær. Mekanikken ER poenget: du må først
// gjøre firkanten om til en sirkel (pendentivene), så reise vindusringen, før
// kuppelen kan legges på.
//
// Scenen leser bare `stage` (0-3) og demper alt mykt mot mål utledet av stage.

function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

interface BuildStep {
    id: string;
    stage: number;
    title: string;
    blurb: string;
    Icon: React.ComponentType<{ className?: string }>;
    banner: string;
    fact: string;
}

const STEPS: BuildStep[] = [
    {
        id: 'pendentiv',
        stage: 1,
        title: 'Spenn pendentivene',
        blurb: 'Fyll de fire hjørnene med buede trekanter. Nå blir firkanten til en sirkel.',
        Icon: Spline,
        banner: 'Pendentivene fyller hjørnene. Den firkantede bunnen blir til en rund ring.',
        fact: 'Pendentivene var et nytt triks. Disse buede trekantene i hjørnene gjorde at en rund kuppel kunne hvile på et firkantet rom. Før dette måtte kupler stå på runde vegger.',
    },
    {
        id: 'vindusring',
        stage: 2,
        title: 'Reis vindusringen',
        blurb: 'Sett en ring med 40 vinduer der kuppelen skal hvile.',
        Icon: Columns3,
        banner: 'Førti vinduer settes i en ring rundt kanten der kuppelen skal hvile.',
        fact: 'Rundt foten av kuppelen laget byggmesterne en ring med 40 vinduer. Det svekket muren litt, men ga noe mye viktigere: en krans av lys akkurat der kuppelen møter rommet.',
    },
    {
        id: 'kuppel',
        stage: 3,
        title: 'Hev den store kuppelen',
        blurb: 'Legg kuppelen på vindusringen og slipp lyset inn.',
        Icon: Sun,
        banner: 'Kuppelen senkes på plass. Lyset fra de 40 vinduene får den til å se ut som den svever.',
        fact: 'Lyset gjennom vindusringen gjorde at den enorme kuppelen så ut til å sveve fritt over rommet. En gjest skrev at den så ut til å henge fra himmelen i en gullkjede. Slik knyttet bysantinerne arkitektur og tro sammen.',
    },
];

const HagiaSofia3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const nextStep = STEPS[stage];

    const choose = (step: BuildStep) => {
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
            }, 4000);
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
            title="Reis Hagia Sofias kuppel"
            subtitle="Bygg bysantinernes mesterverk - kuppelen som svever på lys"
            estimatedSeconds={140}
            onRetry={stage > 0 ? reset : undefined}
            bleed
        >
            <div className="flex flex-col">
                {/* --- 3D-scenen (full bredde) --- */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#cdd9ec] via-[#e4e0d6] to-[#d8c9a8] overflow-hidden"
                    style={{ aspectRatio: '16 / 10.8', minHeight: 360 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [10, 7.5, 11], fov: 40 }}
                        background="#cdd9ec"
                        fog={{ color: '#dbe2ee', near: 28, far: 52 }}
                        target={[0, 3.4, 0]}
                    >
                        <Church stage={stage} />
                        <Burst position={[0, 8.5, 0]} trigger={burst} color="#f1d27a" count={34} spread={3.6} />
                    </MicroCanvas>
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{ boxShadow: 'inset 0 0 90px 10px rgba(15,23,42,0.16)' }}
                    />

                    {idle && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-amber-800 shadow"
                        >
                            <Hand className="w-3.5 h-3.5" />
                            Dra for å se rommet - velg et byggesteg under
                        </motion.div>
                    )}

                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        {stage === 0
                            ? 'Konstantinopel · år 537'
                            : stage === 1
                              ? 'Firkant blir sirkel'
                              : stage === 2
                                ? 'Ringen av lys'
                                : 'Kuppelen svever'}
                    </div>

                    <AnimatePresence>
                        {banner && !done && (
                            <motion.div
                                key={banner}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-3 left-3 right-3 mx-auto max-w-md rounded-xl bg-amber-900/85 text-amber-50 px-4 py-2.5 text-sm font-semibold shadow-lg text-center"
                            >
                                {banner}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- Kontrollpanel UNDER vinduet --- */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-amber-200">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                        {done ? 'Kuppelen er reist' : `Byggesteg ${stage + 1} av 3`}
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
                                              ? 'bg-amber-100 border-amber-400 hover:bg-amber-200 hover:border-amber-500 shadow-sm cursor-pointer'
                                              : 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                                isDone
                                                    ? 'bg-emerald-500 text-white'
                                                    : isNext
                                                      ? 'bg-amber-500 text-white'
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
                                            <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
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
                                            Kuppelen svever på lys.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        Ringen av 40 vinduer gjorde at den tunge kuppelen så lett ut.
                                        Bysantinerne brukte ingeniørkunst til å skape en følelse av at
                                        himmelen åpnet seg over deg.
                                    </p>
                                </div>
                                <button
                                    onClick={reset}
                                    className="mt-2.5 sm:mt-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition flex-shrink-0"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Bygg igjen
                                </button>
                            </motion.div>
                        ) : fact ? (
                            <motion.div
                                key={fact}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-3 bg-white border border-amber-200 rounded-xl p-3"
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
                                Bygg stegene i rekkefølge og se kuppelen reise seg.
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

const PIER_X = 2.6;
const PIER_TOP = 4.2;
const DRUM_Y = 5.6; // der vindusringen og kuppelfoten sitter
const DRUM_R = 2.55;

function Church({ stage }: { stage: number }) {
    return (
        <group>
            <Floor />
            <Piers />
            <Walls />
            <Pendentives stage={stage} />
            <Cornice stage={stage} />
            <WindowDrum stage={stage} />
            <Dome stage={stage} />
            <InteriorLight stage={stage} />
        </group>
    );
}

// --- Marmorgulv (rund plate) ---
function Floor() {
    return (
        <mesh position={[0, -0.05, 0]} receiveShadow>
            <cylinderGeometry args={[5, 5, 0.3, 40]} />
            <meshStandardMaterial color="#d8cdb6" roughness={0.85} />
        </mesh>
    );
}

// --- Fire bærepilarer i et kvadrat ---
function Piers() {
    const corners: [number, number][] = [
        [PIER_X, PIER_X],
        [-PIER_X, PIER_X],
        [PIER_X, -PIER_X],
        [-PIER_X, -PIER_X],
    ];
    return (
        <group>
            {corners.map((c, i) => (
                <mesh key={i} position={[c[0], PIER_TOP / 2, c[1]]} castShadow receiveShadow>
                    <boxGeometry args={[1, PIER_TOP, 1]} />
                    <meshStandardMaterial color="#cabf9f" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

// --- Lave yttervegger som antyder rommet ---
function Walls() {
    const walls: { pos: [number, number, number]; size: [number, number, number] }[] = [
        { pos: [0, 1.4, PIER_X], size: [2 * PIER_X - 1, 2.8, 0.4] },
        { pos: [0, 1.4, -PIER_X], size: [2 * PIER_X - 1, 2.8, 0.4] },
        { pos: [PIER_X, 1.4, 0], size: [0.4, 2.8, 2 * PIER_X - 1] },
        { pos: [-PIER_X, 1.4, 0], size: [0.4, 2.8, 2 * PIER_X - 1] },
    ];
    return (
        <group>
            {walls.map((w, i) => (
                <mesh key={i} position={w.pos} castShadow receiveShadow>
                    <boxGeometry args={w.size} />
                    <meshStandardMaterial color="#bcae8c" roughness={0.95} />
                </mesh>
            ))}
        </group>
    );
}

// --- Pendentivene: fire buede trekanter (sfæriske oktanter) i hjørnene som
//     gjør firkanten om til en sirkel. De vokser fram ved stage 1. ---
function Pendentives({ stage }: { stage: number }) {
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    return (
        <group>
            {angles.map((a, i) => (
                <Pendentive key={i} yaw={a} show={stage >= 1} delay={i * 0.12} />
            ))}
        </group>
    );
}

function Pendentive({ yaw, show, delay }: { yaw: number; show: boolean; delay: number }) {
    const group = useRef<THREE.Group>(null);
    const grow = useRef(0);
    const wait = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        if (show) wait.current += dt;
        const active = show && wait.current > delay;
        grow.current = damp(grow.current, active ? 1 : 0, dt, 3);
        group.current.scale.setScalar(0.6 + grow.current * 0.4);
        group.current.visible = grow.current > 0.02;
        const mat = (group.current.children[0] as THREE.Mesh)?.material as THREE.MeshStandardMaterial;
        if (mat) mat.opacity = grow.current;
    });
    // En sfærisk oktant: en buet trekant som tucker inn i hjørnet og hvis
    // øvre kant følger sirkelen der kuppelen skal hvile.
    return (
        <group ref={group} position={[0, PIER_TOP, 0]} rotation={[0, yaw, 0]} visible={false}>
            <mesh position={[0, 0, 0]} castShadow>
                <sphereGeometry args={[DRUM_R, 18, 18, 0, Math.PI / 2, Math.PI / 2, Math.PI / 2]} />
                <meshStandardMaterial
                    color="#b59a6a"
                    roughness={0.9}
                    transparent
                    opacity={0}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// --- Gesims/ring som markerer sirkelen pendentivene danner ---
function Cornice({ stage }: { stage: number }) {
    const ref = useRef<THREE.Mesh>(null);
    const grow = useRef(0);
    useFrame((_, dt) => {
        if (!ref.current) return;
        grow.current = damp(grow.current, stage >= 1 ? 1 : 0, dt, 2.6);
        ref.current.scale.setScalar(grow.current);
        ref.current.visible = grow.current > 0.02;
    });
    return (
        <mesh ref={ref} position={[0, DRUM_Y - 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
            <torusGeometry args={[DRUM_R, 0.16, 10, 44]} />
            <meshStandardMaterial color="#9c8050" roughness={0.8} metalness={0.1} />
        </mesh>
    );
}

// --- Vindusringen: en lav trommel med 40 vinduer der kuppelen hviler.
//     Reises ved stage 2; vinduene lyser opp ved stage 3 (kuppelen på plass). ---
const WINDOW_COUNT = 40;

function WindowDrum({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    // Hvert vindu har sitt eget materiale, samlet i en ref-array så vi kan
    // lyse opp alle 40 i én useFrame (mutasjon av ref-verdier er tillatt).
    const matRefs = useRef<THREE.MeshStandardMaterial[]>([]);
    const windows = useMemo(() => {
        const out: { pos: [number, number, number]; rot: number }[] = [];
        for (let i = 0; i < WINDOW_COUNT; i++) {
            const a = (i / WINDOW_COUNT) * Math.PI * 2;
            out.push({ pos: [Math.cos(a) * DRUM_R, 0, Math.sin(a) * DRUM_R], rot: -a });
        }
        return out;
    }, []);

    useFrame((_, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, stage >= 2 ? 1 : 0, dt, 2.4);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
        // Lyset i vinduene kommer når kuppelen er på plass (stage 3)
        const targetGlow = stage >= 3 ? 1.6 : 0.05;
        for (const mat of matRefs.current) {
            if (mat) mat.emissiveIntensity = damp(mat.emissiveIntensity, targetGlow, dt, 2);
        }
    });

    return (
        <group ref={group} position={[0, DRUM_Y, 0]} visible={false}>
            {/* trommelvegg */}
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[DRUM_R + 0.18, DRUM_R + 0.18, 1.0, 44, 1, true]} />
                <meshStandardMaterial color="#c3b288" roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
            {/* de 40 vinduene */}
            {windows.map((w, i) => (
                <mesh key={i} position={w.pos} rotation={[0, w.rot, 0]}>
                    <boxGeometry args={[0.12, 0.66, 0.16]} />
                    <meshStandardMaterial
                        ref={(el) => {
                            if (el) matRefs.current[i] = el;
                        }}
                        color="#fff4d2"
                        emissive="#f4d27a"
                        emissiveIntensity={0}
                        roughness={0.5}
                    />
                </mesh>
            ))}
        </group>
    );
}

// --- Den store kuppelen: senkes på plass ved stage 3 ---
function Dome({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const set = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        set.current = damp(set.current, stage >= 3 ? 1 : 0, dt, 1.8);
        const s = set.current;
        // Senkes ned ovenfra og setter seg på trommelen
        group.current.position.y = DRUM_Y + 0.5 + (1 - s) * 4.5;
        group.current.scale.setScalar(0.7 + s * 0.3);
        group.current.visible = s > 0.02;
    });
    return (
        <group ref={group} visible={false}>
            <mesh castShadow>
                <sphereGeometry args={[DRUM_R + 0.25, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#c9a24a" roughness={0.55} metalness={0.25} />
            </mesh>
            {/* kors på toppen (bysantinsk kirke) */}
            <mesh position={[0, DRUM_R + 0.9, 0]}>
                <boxGeometry args={[0.08, 0.6, 0.08]} />
                <meshStandardMaterial color="#6b5320" metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[0, DRUM_R + 1.0, 0]}>
                <boxGeometry args={[0.34, 0.08, 0.08]} />
                <meshStandardMaterial color="#6b5320" metalness={0.4} roughness={0.5} />
            </mesh>
        </group>
    );
}

// --- Innvendig gyllent lys som strømmer inn når kuppelen er ferdig ---
function InteriorLight({ stage }: { stage: number }) {
    const light = useRef<THREE.PointLight>(null);
    useFrame((_, dt) => {
        if (!light.current) return;
        light.current.intensity = damp(light.current.intensity, stage >= 3 ? 9 : 0, dt, 2);
    });
    return <pointLight ref={light} position={[0, DRUM_Y, 0]} color="#ffe6a3" intensity={0} distance={16} decay={2} />;
}

export default HagiaSofia3D;
