import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Music, BookOpen, Trophy, RotateCcw, Hand, ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Burst } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Folket samles — et fritt 3D-mikrospill om selve IDEEN nasjonalisme.
// En folkemengde står spredt og vender hver sin vei. Eleven reiser tre felles
// symboler i rekkefølge (flagg, sang, felles historie). For hvert symbol snur
// folket seg mot midten, går tettere sammen, og fargene glir mot én felles
// farge. Lyspæra: en nasjon er ikke naturlig — den blir til når folk deler
// språk, symboler og fortellinger og begynner å kjenne seg som ett "vi".
//
// Mekanikk: tre valgkort i rekkefølge (Chromebook-vennlig). Scenen leser bare
// `stage` (0-3) og demper alt mykt mot mål utledet av stage.

function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

interface Symbol {
    id: string;
    stage: number;
    title: string;
    blurb: string;
    Icon: React.ComponentType<{ className?: string }>;
    banner: string;
    fact: string;
}

const SYMBOLS: Symbol[] = [
    {
        id: 'flagg',
        stage: 1,
        title: 'Reis flagget',
        blurb: 'Ett bilde som alle kan samle seg om.',
        Icon: Flag,
        banner: 'Flagget går til topps! Folk snur seg mot det felles merket.',
        fact: 'Et flagg er et symbol. Det sier "dette er oss". Da nasjonene vokste fram på 1800-tallet, fikk nesten hvert folk sitt eget flagg å samle seg under.',
    },
    {
        id: 'sang',
        stage: 2,
        title: 'Syng nasjonalsangen',
        blurb: 'Å synge det samme gir en sterk vi-følelse.',
        Icon: Music,
        banner: 'Sangen lyder over plassen. Folket rykker tettere sammen.',
        fact: 'En nasjonalsang gjør at fremmede synger de samme ordene samtidig. Felles språk og felles sang binder folk sammen til ett fellesskap.',
    },
    {
        id: 'historie',
        stage: 3,
        title: 'Fortell den felles historien',
        blurb: 'Felles helter og fortid gjør folk til ett folk.',
        Icon: BookOpen,
        banner: 'Den felles historien deles. Nå kjenner alle seg som ett folk.',
        fact: 'En nasjon deler fortellinger om fortiden — helter, seiere og vanskelige tider. Denne felles historien får folk til å føle at de hører sammen, selv om de aldri har møtt hverandre.',
    },
];

const FolketSamles3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const nextSymbol = SYMBOLS[stage];

    const choose = (sym: Symbol) => {
        if (sym.stage !== stage + 1 || done) return;
        setStage(sym.stage);
        setBanner(sym.banner);
        setFact(sym.fact);
        if (sym.stage === 3) {
            sounds.play('sceneChange');
            setTimeout(() => {
                sounds.play('complete');
                setDone(true);
                setBurst((b) => b + 1);
                onComplete({ score: 1, completed: true, artifact: { stage: 3 } });
            }, 3600);
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
            title="Folket samles"
            subtitle="Reis de felles symbolene og se en nasjon bli til"
            estimatedSeconds={130}
            onRetry={stage > 0 ? reset : undefined}
            bleed
        >
            <div className="flex flex-col">
                {/* 3D-scenen i full bredde */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#cfe3f5] via-[#e2ecf2] to-[#e9e2d0] overflow-hidden"
                    style={{ aspectRatio: '16/9', minHeight: 300 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [0, 9, 15], fov: 40 }}
                        background="#cfe3f5"
                        fog={{ color: '#d8e6f0', near: 24, far: 46 }}
                        target={[0, 1, 0]}
                    >
                        <Plaza stage={stage} />
                        <Burst position={[0, 4.2, 0]} trigger={burst} color="#c0392b" count={34} spread={3.6} />
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
                            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-sky-800 shadow"
                        >
                            <Hand className="w-3.5 h-3.5" />
                            Folket står spredt. Reis et felles symbol under.
                        </motion.div>
                    )}

                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        {stage === 0
                            ? 'Mange enkeltmennesker'
                            : stage === 1
                              ? 'Ett merke å samles om'
                              : stage === 2
                                ? 'Én stemme'
                                : 'Én nasjon'}
                    </div>

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

                {/* Kontrollpanel under vinduet */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-sky-200">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-sky-700">
                        {done ? 'Nasjonen er født' : `Symbol ${stage + 1} av 3`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {SYMBOLS.map((sym) => {
                            const isDone = stage >= sym.stage;
                            const isNext = nextSymbol?.id === sym.id && !done;
                            const Icon = sym.Icon;
                            return (
                                <button
                                    key={sym.id}
                                    onClick={() => choose(sym)}
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
                                                {sym.title}
                                            </p>
                                        </div>
                                        {isNext && (
                                            <ArrowRight className="w-4 h-4 text-sky-600 flex-shrink-0 animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                                        {sym.blurb}
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
                                            Fra mange enkeltmennesker til ett folk.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        Ingen ble født som "nasjonen". Følelsen av å høre sammen ble
                                        bygd av felles språk, symboler og fortellinger. Det er dette vi
                                        kaller nasjonalisme.
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
                                Reis symbolene i rekkefølge og se folket samle seg.
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

function Plaza({ stage }: { stage: number }) {
    return (
        <group>
            <Ground />
            <FlagPole stage={stage} />
            <Bandstand stage={stage} />
            <Statue stage={stage} />
            <Crowd stage={stage} />
        </group>
    );
}

function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <circleGeometry args={[13, 48]} />
            <meshStandardMaterial color="#c9bfa6" roughness={1} />
        </mesh>
    );
}

// --- Flaggstang: flagget heises til topps ved stage 1 ---
function FlagPole({ stage }: { stage: number }) {
    const flag = useRef<THREE.Group>(null);
    const wave = useRef<THREE.Mesh>(null);
    const y = useRef(0.3);
    useFrame(({ clock }, dt) => {
        const targetY = stage >= 1 ? 3.1 : 0.3;
        y.current = damp(y.current, targetY, dt, 2.2);
        if (flag.current) {
            flag.current.position.y = y.current;
            flag.current.visible = stage >= 1 || y.current > 0.35;
        }
        if (wave.current) {
            wave.current.rotation.y = Math.sin(clock.getElapsedTime() * 2.4) * 0.18;
        }
    });
    return (
        <group position={[0, 0, 0]}>
            {/* stang */}
            <mesh position={[0, 2, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.09, 4, 8]} />
                <meshStandardMaterial color="#c9ccce" metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[0, 4.05, 0]}>
                <sphereGeometry args={[0.12, 10, 10]} />
                <meshStandardMaterial color="#d8b24a" metalness={0.5} roughness={0.4} />
            </mesh>
            {/* flagg (heises) */}
            <group ref={flag} position={[0.05, 0.3, 0]} visible={false}>
                <mesh ref={wave} position={[0.72, 0.9, 0]}>
                    <planeGeometry args={[1.4, 0.9]} />
                    <meshStandardMaterial color="#c0392b" side={THREE.DoubleSide} roughness={0.85} />
                </mesh>
                {/* kryss-stripe for at det ligner et flagg */}
                <mesh position={[0.55, 0.9, 0.01]}>
                    <planeGeometry args={[0.16, 0.9]} />
                    <meshStandardMaterial color="#f3f0ea" side={THREE.DoubleSide} roughness={0.85} />
                </mesh>
                <mesh position={[0.72, 0.9, 0.01]}>
                    <planeGeometry args={[1.4, 0.16]} />
                    <meshStandardMaterial color="#f3f0ea" side={THREE.DoubleSide} roughness={0.85} />
                </mesh>
            </group>
        </group>
    );
}

// --- Bandstand/talerstol: reiser seg ved stage 2 (nasjonalsangen) ---
function Bandstand({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, stage >= 2 ? 1 : 0, dt, 2.6);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
    });
    return (
        <group ref={group} position={[-3.4, 0, -2.6]} scale={[1, 0, 1]} visible={false}>
            <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[1.1, 1.2, 0.5, 12]} />
                <meshStandardMaterial color="#b8a074" roughness={0.9} />
            </mesh>
            {[0, 1, 2, 3].map((i) => {
                const a = (i / 4) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(a) * 0.85, 1, Math.sin(a) * 0.85]} castShadow>
                        <cylinderGeometry args={[0.07, 0.07, 1.3, 7]} />
                        <meshStandardMaterial color="#e8e2d4" roughness={0.85} />
                    </mesh>
                );
            })}
            <mesh position={[0, 1.85, 0]} castShadow>
                <coneGeometry args={[1.3, 0.7, 12]} />
                <meshStandardMaterial color="#8a5a3a" roughness={0.9} />
            </mesh>
        </group>
    );
}

// --- Heltestatue: reiser seg ved stage 3 (felles historie) ---
function Statue({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, stage >= 3 ? 1 : 0, dt, 2.2);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
    });
    return (
        <group ref={group} position={[3.6, 0, -2.6]} scale={[1, 0, 1]} visible={false}>
            {/* sokkel */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.1, 1, 1.1]} />
                <meshStandardMaterial color="#9aa0a6" roughness={0.9} />
            </mesh>
            {/* figur på hest-lignende blokk */}
            <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.22, 0.28, 0.9, 8]} />
                <meshStandardMaterial color="#7c828a" roughness={0.85} />
            </mesh>
            <mesh position={[0, 2.1, 0]} castShadow>
                <sphereGeometry args={[0.22, 12, 12]} />
                <meshStandardMaterial color="#7c828a" roughness={0.85} />
            </mesh>
            {/* løftet arm */}
            <mesh position={[0.28, 1.85, 0]} rotation={[0, 0, -0.9]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.6, 6]} />
                <meshStandardMaterial color="#7c828a" roughness={0.85} />
            </mesh>
        </group>
    );
}

// --- Folkemengden: spredt og vendt hver sin vei, samles mot midten ---
const PEOPLE: { home: [number, number]; angle: number; color: string }[] = [
    { home: [-5.2, 3.6], angle: 2.2, color: '#8a5a4a' },
    { home: [-3.0, -3.4], angle: -1.1, color: '#4a6a8a' },
    { home: [4.4, 3.2], angle: 0.6, color: '#6a8a5a' },
    { home: [5.2, -2.2], angle: 3.0, color: '#8a7a4a' },
    { home: [-6.0, -0.8], angle: -2.4, color: '#7a5a7a' },
    { home: [2.2, 5.0], angle: 1.4, color: '#5a7a7a' },
    { home: [0.2, -5.2], angle: -0.5, color: '#9a6a4a' },
    { home: [6.0, 0.8], angle: 2.7, color: '#5a5a8a' },
    { home: [-2.2, 2.2], angle: -1.8, color: '#8a5a5a' },
];

// Felles nasjonalfarge folket glir mot ved stage 3.
const NATIONAL = new THREE.Color('#c0392b');

function Crowd({ stage }: { stage: number }) {
    return (
        <group>
            {PEOPLE.map((p, i) => (
                <Person
                    key={i}
                    index={i}
                    total={PEOPLE.length}
                    home={p.home}
                    angle={p.angle}
                    baseColor={p.color}
                    stage={stage}
                />
            ))}
        </group>
    );
}

function Person({
    index,
    total,
    home,
    angle,
    baseColor,
    stage,
}: {
    index: number;
    total: number;
    home: [number, number];
    angle: number;
    baseColor: string;
    stage: number;
}) {
    const group = useRef<THREE.Group>(null);
    const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
    const t = useRef(0); // 0 = spredt, 1 = tett rundt flagget
    const base = useRef(new THREE.Color(baseColor));

    // Ringplass rundt flaggstanga når folket samler seg.
    const ringA = (index / total) * Math.PI * 2;
    const ring: [number, number] = [Math.cos(ringA) * 2.6, Math.sin(ringA) * 2.6];

    useFrame(({ clock }, dt) => {
        if (!group.current) return;
        const time = clock.getElapsedTime();

        // Hvor tett samlet: stage 1 litt, stage 2 mer, stage 3 helt.
        const gather = stage >= 3 ? 1 : stage >= 2 ? 0.62 : stage >= 1 ? 0.3 : 0;
        t.current = damp(t.current, gather, dt, 1.6);
        const w = t.current;
        group.current.position.x = home[0] + (ring[0] - home[0]) * w;
        group.current.position.z = home[1] + (ring[1] - home[1]) * w;
        // liten gå-vugging mens de flytter seg
        const moving = w > 0.02 && w < 0.98;
        group.current.position.y = moving ? Math.abs(Math.sin(time * 6 + index)) * 0.06 : 0;

        // Vend mot midten (flagget) fra stage 1, ellers behold egen retning.
        const faceCenter = Math.atan2(-group.current.position.x, -group.current.position.z);
        const targetRot = stage >= 1 ? faceCenter : angle;
        group.current.rotation.y = damp(group.current.rotation.y, targetRot, dt, 2);

        // Fargene glir mot den felles nasjonalfargen ved stage 3.
        if (bodyMat.current) {
            const target = stage >= 3 ? NATIONAL : base.current;
            bodyMat.current.color.lerp(target, Math.min(1, dt * 1.4));
        }
    });

    return (
        <group ref={group} position={[home[0], 0, home[1]]}>
            <mesh position={[0, 0.42, 0]} castShadow>
                <cylinderGeometry args={[0.17, 0.22, 0.66, 8]} />
                <meshStandardMaterial ref={bodyMat} color={baseColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.9, 0]} castShadow>
                <sphereGeometry args={[0.16, 12, 12]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.8} />
            </mesh>
        </group>
    );
}

export default FolketSamles3D;
