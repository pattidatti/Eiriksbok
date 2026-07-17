import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Hand } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Hotspot, Burst } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Barrikaden1848 — 3D-mikrospill for artikkelen om revolusjonene i 1848.
//
// Lyspære-øyeblikket: I 1848 rev vanlige byfolk — arbeidere og studenter — opp
// selve gata, brostein for brostein, og bygde barrikader tvers over de trange
// gatene for å slåss for frihet og en egen nasjon. Revolusjonen var ikke noe som
// skjedde langt borte; den ble bygd med hendene, midt i byen der folk bodde.
//
// Mekanikk: eleven klikker tre lysende punkter i 3D-gata i rekkefølge:
//   1) Riv opp brosteinen  -> steinene løfter seg og stables til en lav mur
//   2) Velt vogna og møblene -> vogna tipper over muren, barrikaden vokser
//   3) Reis flagget         -> trikoloren går til topps og folket samler seg bak
// Scenen leser bare `stage` (0-3) og demper alt mykt mot mål utledet av stage.

function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

interface Step {
    stage: number;
    hotspot: [number, number, number];
    label: string;
    banner: string;
    fact: string;
}

const STEPS: Step[] = [
    {
        stage: 1,
        hotspot: [0, 0.5, 2.4],
        label: 'Riv opp brosteinen',
        banner: 'Folket river opp gata! Brosteinene stables til en mur.',
        fact: 'Gatene i byene var lagt med tunge brostein. Da opprøret kom, rev folk dem opp med bare hendene og bygde en mur tvers over gata. Byen ga dem våpenet den selv var bygd av.',
    },
    {
        stage: 2,
        hotspot: [2.6, 0.9, 0],
        label: 'Velt vogna og møblene',
        banner: 'Vogna tipper over! Bord og tønner stables oppå. Barrikaden vokser.',
        fact: 'Alt som var tungt nok ble brukt: hestevogner, møbler, dører og tønner. En barrikade var en haug av byens egne ting, stablet så høyt at soldatene ikke kom forbi.',
    },
    {
        stage: 3,
        hotspot: [0, 2.7, 0],
        label: 'Reis flagget',
        banner: 'Trikoloren går til topps! Folket samler seg bak barrikaden.',
        fact: 'Øverst på barrikaden reiste opprørerne flagget sitt. I Frankrike var det trikoloren, symbolet på frihet og en samlet nasjon. Nå var gata deres, i hvert fall for en stund.',
    },
];

const Barrikaden1848: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const advance = (step: Step) => {
        if (step.stage !== stage + 1 || done) return;
        setStage(step.stage);
        setBanner(step.banner);
        setFact(step.fact);
        if (step.stage === 3) {
            sounds.play('sceneChange');
            setTimeout(() => {
                sounds.play('complete');
                setDone(true);
                setBurst((b) => b + 1);
                onComplete({ score: 1, completed: true, artifact: { stage: 3 } });
            }, 2600);
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
    const nextStep = STEPS[stage]; // steget som er aktivt nå (undefined når ferdig)

    return (
        <MicroGameFrame
            title="Barrikaden i Paris"
            subtitle="Bygg en barrikade av byens egne ting, og ta gata"
            estimatedSeconds={120}
            onRetry={stage > 0 ? reset : undefined}
            bleed
        >
            <div className="flex flex-col">
                {/* 3D-scenen i full bredde */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#d9c9a8] via-[#e6dcc4] to-[#cbb890] overflow-hidden"
                    style={{ aspectRatio: '16/9', minHeight: 300 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [0.5, 5, 12], fov: 42 }}
                        background="#e7dcc2"
                        fog={{ color: '#e7dcc2', near: 20, far: 40 }}
                        target={[0, 1.4, 0]}
                    >
                        <Street stage={stage} />
                        {nextStep && !done && (
                            <Hotspot
                                position={nextStep.hotspot}
                                label={nextStep.label}
                                onSelect={() => advance(nextStep)}
                            />
                        )}
                        <Burst position={[0, 2.8, 0]} trigger={burst} color="#2b4b9b" count={30} spread={3.2} />
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
                            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-amber-900 shadow"
                        >
                            <Hand className="w-3.5 h-3.5" />
                            Klikk det lysende punktet i gata for å begynne.
                        </motion.div>
                    )}

                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        Paris, februar 1848
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

                {/* Panel under vinduet */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-amber-200">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-amber-800">
                        {done ? 'Barrikaden står' : `Steg ${Math.min(stage + 1, 3)} av 3`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {STEPS.map((step) => {
                            const isDone = stage >= step.stage;
                            const isNext = nextStep?.stage === step.stage && !done;
                            return (
                                <div
                                    key={step.stage}
                                    className={`rounded-xl border-2 p-3 transition ${
                                        isDone
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : isNext
                                              ? 'bg-amber-100 border-amber-400 shadow-sm'
                                              : 'bg-slate-50 border-slate-200 opacity-55'
                                    }`}
                                >
                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                        {step.stage}. {step.label}
                                    </p>
                                    {isNext && (
                                        <p className="text-xs text-amber-700 mt-1 font-semibold">
                                            Klikk punktet i gata
                                        </p>
                                    )}
                                    {isDone && (
                                        <p className="text-xs text-emerald-700 mt-1 font-semibold">
                                            Ferdig
                                        </p>
                                    )}
                                </div>
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
                                            Gata er deres, i hvert fall for en stund.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        Revolusjonen i 1848 ble ikke ledet fra et slott. Den ble bygd
                                        med hendene, av vanlige byfolk som rev opp gata si og reiste
                                        flagget over en haug med brostein og møbler.
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
                                Klikk de lysende punktene i gata i rekkefølge og bygg barrikaden.
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

function Street({ stage }: { stage: number }) {
    return (
        <group>
            <Ground />
            <Houses side={-1} />
            <Houses side={1} />
            <Barricade stage={stage} />
            <Cart stage={stage} />
            <FlagPole stage={stage} />
            <Crowd stage={stage} />
        </group>
    );
}

function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[16, 30]} />
            <meshStandardMaterial color="#a9a29a" roughness={1} />
        </mesh>
    );
}

// Husrekker langs begge sider av den trange gata.
function Houses({ side }: { side: number }) {
    const x = side * 4.6;
    return (
        <group position={[x, 0, 0]}>
            {[-8, -4, 0, 4, 8].map((z, i) => {
                const h = 4 + ((i * 37) % 3) * 0.7;
                return (
                    <group key={z} position={[0, 0, z]}>
                        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
                            <boxGeometry args={[3, h, 3.4]} />
                            <meshStandardMaterial
                                color={i % 2 === 0 ? '#c9b79a' : '#bdaa8c'}
                                roughness={0.95}
                            />
                        </mesh>
                        {/* tak */}
                        <mesh position={[0, h + 0.35, 0]} castShadow>
                            <boxGeometry args={[3.2, 0.6, 3.6]} />
                            <meshStandardMaterial color="#6e5a48" roughness={0.9} />
                        </mesh>
                        {/* et vindu ut mot gata */}
                        <mesh position={[-side * 1.55, h * 0.55, 0]}>
                            <boxGeometry args={[0.08, 0.9, 0.9]} />
                            <meshStandardMaterial
                                color="#3a4a5a"
                                emissive="#26506e"
                                emissiveIntensity={0.25}
                            />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

// Barrikaden: brostein som løftes fra gata og stables til en mur tvers over.
// Nederste lag kommer ved stage 1, øverste lag ved stage 2.
interface Stone {
    scatter: [number, number, number];
    wall: [number, number, number];
    layer: number; // hvilket stage steinen føyer seg til (1 eller 2)
    rot: number;
}

const STONES: Stone[] = (() => {
    const out: Stone[] = [];
    // to lag stein, 7 i bredden
    const cols = 7;
    for (let layer = 0; layer < 2; layer++) {
        for (let c = 0; c < cols; c++) {
            const wx = -3 + (c / (cols - 1)) * 6;
            const wy = 0.28 + layer * 0.52;
            const wz = layer === 0 ? 0.12 : -0.12;
            // spredt utgangspunkt på gata
            const sx = wx + ((c * 53 + layer * 17) % 40) / 40 - 0.5;
            const sz = 2 + ((c * 29 + layer * 11) % 30) / 10;
            out.push({
                scatter: [sx * 1.4, 0.16, sz],
                wall: [wx, wy, wz],
                layer: layer + 1,
                rot: ((c * 41 + layer * 23) % 20) / 20 - 0.5,
            });
        }
    }
    return out;
})();

function Barricade({ stage }: { stage: number }) {
    return (
        <group>
            {STONES.map((s, i) => (
                <StoneMesh key={i} stone={s} stage={stage} index={i} />
            ))}
        </group>
    );
}

function StoneMesh({ stone, stage, index }: { stone: Stone; stage: number; index: number }) {
    const ref = useRef<THREE.Group>(null);
    const t = useRef(0); // 0 = spredt på gata, 1 = i mur
    useFrame((_, dt) => {
        if (!ref.current) return;
        const target = stage >= stone.layer ? 1 : 0;
        t.current = damp(t.current, target, dt, 2.4 + (index % 3) * 0.3);
        const w = t.current;
        ref.current.position.x = stone.scatter[0] + (stone.wall[0] - stone.scatter[0]) * w;
        ref.current.position.y = stone.scatter[1] + (stone.wall[1] - stone.scatter[1]) * w;
        ref.current.position.z = stone.scatter[2] + (stone.wall[2] - stone.scatter[2]) * w;
        ref.current.rotation.y = stone.rot * (1 - w);
    });
    return (
        <group ref={ref} position={stone.scatter}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.82, 0.44, 0.7]} />
                <meshStandardMaterial color={index % 2 ? '#8a8078' : '#79706a'} roughness={1} />
            </mesh>
        </group>
    );
}

// Vogna: står oppreist ved siden av gata, tipper over barrikaden ved stage 2.
function Cart({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const tip = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        tip.current = damp(tip.current, stage >= 2 ? 1 : 0, dt, 2.2);
        const w = tip.current;
        // fra oppreist ved [3, 0, 0] til veltet oppå barrikaden nær midten
        group.current.position.x = 3 - 2.1 * w;
        group.current.position.y = 0.5 + 0.5 * w;
        group.current.position.z = 0.9 * w;
        group.current.rotation.z = -1.35 * w;
    });
    return (
        <group ref={group} position={[3, 0.5, 0]}>
            {/* lasteplan */}
            <mesh castShadow>
                <boxGeometry args={[1.4, 0.5, 2.2]} />
                <meshStandardMaterial color="#7a5230" roughness={0.9} />
            </mesh>
            {/* to hjul */}
            <mesh position={[0.2, -0.45, 1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.5, 0.5, 0.16, 14]} />
                <meshStandardMaterial color="#5a3d22" roughness={0.9} />
            </mesh>
            <mesh position={[0.2, -0.45, -1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.5, 0.5, 0.16, 14]} />
                <meshStandardMaterial color="#5a3d22" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Flagget: reises på toppen av barrikaden ved stage 3.
function FlagPole({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const cloth = useRef<THREE.Mesh>(null);
    const rise = useRef(0);
    useFrame(({ clock }, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, stage >= 3 ? 1 : 0, dt, 2.4);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
        if (cloth.current) {
            cloth.current.rotation.y = Math.sin(clock.getElapsedTime() * 2.6) * 0.16;
        }
    });
    return (
        <group ref={group} position={[0, 1.1, -0.1]} scale={[1, 0, 1]} visible={false}>
            <mesh position={[0, 0.9, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 1.8, 8]} />
                <meshStandardMaterial color="#4a3a2a" roughness={0.8} />
            </mesh>
            {/* trikolore: tre farger */}
            <group ref={cloth} position={[0, 1.45, 0]}>
                <mesh position={[0.28, 0, 0]}>
                    <planeGeometry args={[0.42, 0.7]} />
                    <meshStandardMaterial color="#2b4b9b" side={THREE.DoubleSide} roughness={0.85} />
                </mesh>
                <mesh position={[0.7, 0, 0]}>
                    <planeGeometry args={[0.42, 0.7]} />
                    <meshStandardMaterial color="#f3f0ea" side={THREE.DoubleSide} roughness={0.85} />
                </mesh>
                <mesh position={[1.12, 0, 0]}>
                    <planeGeometry args={[0.42, 0.7]} />
                    <meshStandardMaterial color="#c0392b" side={THREE.DoubleSide} roughness={0.85} />
                </mesh>
            </group>
        </group>
    );
}

// Folket: står bakerst i gata, rykker fram bak barrikaden når den vokser.
const PEOPLE: { home: [number, number]; color: string }[] = [
    { home: [-2, 7], color: '#7a5a4a' },
    { home: [1.6, 8], color: '#4a6a8a' },
    { home: [-0.6, 9], color: '#6a8a5a' },
    { home: [2.4, 6.4], color: '#8a7a4a' },
    { home: [-2.6, 8.4], color: '#7a5a7a' },
];

function Crowd({ stage }: { stage: number }) {
    return (
        <group>
            {PEOPLE.map((p, i) => (
                <Rebel key={i} home={p.home} color={p.color} stage={stage} index={i} />
            ))}
        </group>
    );
}

function Rebel({
    home,
    color,
    stage,
    index,
}: {
    home: [number, number];
    color: string;
    stage: number;
    index: number;
}) {
    const group = useRef<THREE.Group>(null);
    const arm = useRef<THREE.Group>(null);
    const t = useRef(0);
    // mål bak barrikaden (z rundt 1.4)
    const target: [number, number] = [home[0] * 0.7, 1.6 + (index % 2) * 0.5];
    useFrame(({ clock }, dt) => {
        if (!group.current) return;
        const gather = stage >= 3 ? 1 : stage >= 2 ? 0.7 : stage >= 1 ? 0.4 : 0;
        t.current = damp(t.current, gather, dt, 1.6);
        const w = t.current;
        group.current.position.x = home[0] + (target[0] - home[0]) * w;
        group.current.position.z = home[1] + (target[1] - home[1]) * w;
        const moving = w > 0.02 && w < 0.98;
        group.current.position.y = moving ? Math.abs(Math.sin(clock.getElapsedTime() * 6 + index)) * 0.06 : 0;
        // løfter armen når flagget reises (stage 3)
        if (arm.current) {
            const raise = stage >= 3 ? -2.2 : 0;
            arm.current.rotation.z = damp(arm.current.rotation.z, raise, dt, 2);
        }
    });
    return (
        <group ref={group} position={[home[0], 0, home[1]]}>
            <mesh position={[0, 0.42, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.2, 0.64, 8]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.88, 0]} castShadow>
                <sphereGeometry args={[0.15, 12, 12]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.8} />
            </mesh>
            {/* løftet arm */}
            <group ref={arm} position={[0.16, 0.62, 0]}>
                <mesh position={[0.12, 0, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
                    <meshStandardMaterial color={color} roughness={0.9} />
                </mesh>
            </group>
        </group>
    );
}

export default Barrikaden1848;
