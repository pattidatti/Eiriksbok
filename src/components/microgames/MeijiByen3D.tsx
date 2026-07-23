import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { TrainFront, Factory as FactoryIcon, GraduationCap, Trophy, RotateCcw, Hand, ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Burst } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Meiji-byen — et fritt 3D-mikrospill. Ikke et objekt å inspisere, men en
// levende japansk by som eleven forvandler. Tre reformer driver Japan fra et
// lukket føydalsamfunn (torii, rispaddier, tradisjonelle hus) til en moderne
// industrinasjon (jernbane, fabrikk, telegraf, skole i mursten). Lyspæra kommer
// til slutt: på bare noen tiår skiftet Japan ham raskere enn noe land hadde
// gjort før - et bevisst, villet sprang inn i moderniteten.
//
// Mekanikken: eleven trykker tre reformkort i rekkefølge (Chromebook-vennlig).
// Scenen leser bare `stage` (0-3) og demper alt mykt mot mål utledet av stage.

function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

interface Reform {
    id: string;
    stage: number;
    title: string;
    blurb: string;
    Icon: React.ComponentType<{ className?: string }>;
    banner: string;
    fact: string;
}

const REFORMS: Reform[] = [
    {
        id: 'jernbane',
        stage: 1,
        title: 'Åpne landet — bygg jernbanen (1872)',
        blurb: 'Det lukkede landet åpnes. Britiske ingeniører legger Japans første jernbane.',
        Icon: TrainFront,
        banner: 'Toget kommer! Den første jernbanen knytter Tokyo til havna i Yokohama.',
        fact: 'I 1872 åpnet Japans første jernbane, bygd av britiske ingeniører. Et land som hadde vært stengt for omverdenen i over 200 år, valgte nå å hente teknologi utenfra.',
    },
    {
        id: 'fabrikk',
        stage: 2,
        title: 'Reis fabrikkene',
        blurb: 'Staten bygger fabrikker og kjøper maskiner. Japan skal lage sine egne varer.',
        Icon: FactoryIcon,
        banner: 'Fabrikkpipene reiser seg. Japan begynner å produsere stål, tekstil og skip selv.',
        fact: 'Meiji-staten bygde fabrikker og verft og leide inn utenlandske eksperter. På få tiår gikk Japan fra håndverk til industri - mens resten av Asia ble kolonisert.',
    },
    {
        id: 'skole',
        stage: 3,
        title: 'Skole og telegraf — fullfør spranget',
        blurb: 'Skole for alle barn og telegraf over hele landet. Følg Japan inn i moderniteten.',
        Icon: GraduationCap,
        banner: 'Skoler i mursten og telegraf-tråder over hele landet. Japan er blitt en stormakt.',
        fact: 'Japan innførte skole for alle barn og bygde telegraf over hele landet. På rundt 40 år forvandlet landet seg fra samuraier til moderne stormakt - raskere enn noe land før det.',
    },
];

const MeijiByen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const nextReform = REFORMS[stage];

    const choose = (reform: Reform) => {
        if (reform.stage !== stage + 1 || done) return;
        sounds.play(reform.stage === 3 ? 'sceneChange' : 'advance');
        setStage(reform.stage);
        setBanner(reform.banner);
        setFact(reform.fact);
        if (reform.stage === 3) {
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
            title="Meiji-byen forvandles"
            subtitle="Forvandle den japanske byen fra føydalt samfunn til moderne stormakt"
            estimatedSeconds={150}
            onRetry={stage > 0 ? reset : undefined}
            bleed
        >
            <div className="flex flex-col">
                {/* --- 3D-scenen (full bredde) --- */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#cfe6f2] via-[#e6eef0] to-[#dfe6c8] overflow-hidden"
                    style={{ aspectRatio: '16 / 10.8', minHeight: 360 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [13, 9, 14], fov: 38 }}
                        background="#cfe6f2"
                        fog={{ color: '#d8e7ee', near: 28, far: 54 }}
                        target={[0, 0.5, 0]}
                        light="day"
                    >
                        <MeijiScene stage={stage} />
                        <Burst position={[2, 3.4, -1]} trigger={burst} color="#d8b24a" count={32} spread={3.6} />
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
                            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-amber-800 shadow"
                        >
                            <Hand className="w-3.5 h-3.5" />
                            Dra for å se byen — velg en reform under
                        </motion.div>
                    )}

                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        {stage === 0
                            ? '1868 · Det lukkede Japan'
                            : stage === 1
                              ? 'Jernbanen åpner landet'
                              : stage === 2
                                ? 'Industrien vokser'
                                : '~1905 · Stormakten Japan'}
                    </div>

                    <AnimatePresence>
                        {banner && !done && (
                            <motion.div
                                key={banner}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-3 left-3 right-3 mx-auto max-w-md rounded-xl bg-rose-900/85 text-rose-50 px-4 py-2.5 text-sm font-semibold shadow-lg text-center"
                            >
                                {banner}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- Kontrollpanel UNDER vinduet --- */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-amber-200">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-rose-700">
                        {done ? 'Moderniseringen er fullført' : `Reform ${stage + 1} av 3`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {REFORMS.map((reform) => {
                            const isDone = stage >= reform.stage;
                            const isNext = nextReform?.id === reform.id && !done;
                            const Icon = reform.Icon;
                            return (
                                <button
                                    key={reform.id}
                                    onClick={() => choose(reform)}
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
                                                {reform.title}
                                            </p>
                                        </div>
                                        {isNext && (
                                            <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-snug">{reform.blurb}</p>
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
                                            Japan skiftet ham.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        På rundt 40 år gikk Japan fra et lukket føydalsamfunn til en moderne
                                        stormakt. Mens nabolandene ble kolonisert, moderniserte Japan seg selv.
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
                                Velg reformene i rekkefølge og se byen forvandle seg.
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

function MeijiScene({ stage }: { stage: number }) {
    return (
        <group>
            <Ground />
            <Fuji />
            <RicePaddies stage={stage} />
            <Torii />
            <OldHouses />
            <Railway stage={stage} />
            <Factory stage={stage} />
            <BrickSchool stage={stage} />
            <Telegraph stage={stage} />
            <Trees />
        </group>
    );
}

// --- Bakke ---
function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[46, 36]} />
            <meshStandardMaterial color="#83a85a" roughness={1} />
        </mesh>
    );
}

// --- Fuji-fjellet i bakgrunnen: et snødekt kjegle-ikon som gir Japan-identitet ---
function Fuji() {
    return (
        <group position={[-13, 0, -14]}>
            <mesh position={[0, 3.4, 0]} castShadow>
                <coneGeometry args={[6.2, 7, 24]} />
                <meshStandardMaterial color="#6a7390" roughness={1} />
            </mesh>
            {/* snøtopp */}
            <mesh position={[0, 5.7, 0]}>
                <coneGeometry args={[2.1, 2.4, 24]} />
                <meshStandardMaterial color="#f3f6fb" roughness={0.9} />
            </mesh>
        </group>
    );
}

// --- Rispaddier: rutenett av vannfylte teiger med skimrende flate ---
function RicePaddies({ stage }: { stage: number }) {
    const tiles = useMemo(() => {
        const out: [number, number][] = [];
        for (let cx = 0; cx < 4; cx++) {
            for (let cz = 0; cz < 4; cz++) {
                out.push([cx * 1.5 - 2.25, cz * 1.5 - 2.25]);
            }
        }
        return out;
    }, []);
    return (
        <group position={[-7, 0, 6]}>
            {tiles.map((t, i) => (
                <PaddyTile key={i} pos={t} stage={stage} phase={i * 0.3} />
            ))}
        </group>
    );
}

function PaddyTile({ pos, stage, phase }: { pos: [number, number]; stage: number; phase: number }) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        if (matRef.current) {
            matRef.current.emissiveIntensity = 0.1 + Math.sin(clock.getElapsedTime() * 1.1 + phase) * 0.05;
        }
    });
    // Ved siste steg tørker noen paddier ut og blir tomtegrunn for byen (svakt brunere)
    const base = stage >= 3 ? '#5f8a86' : '#4f8f87';
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos[0], 0.03, pos[1]]} receiveShadow>
            <planeGeometry args={[1.36, 1.36]} />
            <meshStandardMaterial
                ref={matRef}
                color={base}
                roughness={0.35}
                metalness={0.1}
                emissive="#244f4a"
                emissiveIntensity={0.12}
            />
        </mesh>
    );
}

// --- Torii-porten: rødt ikon, alltid til stede ---
function Torii() {
    const red = '#b5352b';
    return (
        <group position={[6.5, 0, 6.5]}>
            {/* to stolper */}
            <mesh position={[-1, 1, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.18, 2, 10]} />
                <meshStandardMaterial color={red} roughness={0.8} />
            </mesh>
            <mesh position={[1, 1, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.18, 2, 10]} />
                <meshStandardMaterial color={red} roughness={0.8} />
            </mesh>
            {/* øvre bjelke (buet) */}
            <mesh position={[0, 2.15, 0]} castShadow>
                <boxGeometry args={[2.9, 0.26, 0.34]} />
                <meshStandardMaterial color={red} roughness={0.8} />
            </mesh>
            {/* nedre tverrbjelke */}
            <mesh position={[0, 1.7, 0]} castShadow>
                <boxGeometry args={[2.5, 0.18, 0.26]} />
                <meshStandardMaterial color="#3a2420" roughness={0.85} />
            </mesh>
        </group>
    );
}

// --- Tradisjonelle hus med svungne tak (alltid til stede) ---
function OldHouse({ position, body }: { position: [number, number, number]; body: string }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.7, 1.1, 1.4]} />
                <meshStandardMaterial color={body} roughness={0.85} />
            </mesh>
            {/* bredt, lavt tak (pyramide), mørk tegl */}
            <mesh position={[0, 1.35, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[1.5, 0.6, 4]} />
                <meshStandardMaterial color="#3a3330" roughness={0.9} />
            </mesh>
        </group>
    );
}

function OldHouses() {
    return (
        <group position={[2.5, 0, 3.5]}>
            <OldHouse position={[0, 0, 0]} body="#cbb189" />
            <OldHouse position={[2.4, 0, 0.4]} body="#bda377" />
            <OldHouse position={[1.1, 0, -2]} body="#c7ad84" />
        </group>
    );
}

// --- Jernbanen: skinner + damptog som kommer kjørende ved stage 1 ---
function Railway({ stage }: { stage: number }) {
    const train = useRef<THREE.Group>(null);
    const progress = useRef(0);
    const railZ = -8.5;
    useFrame((_, dt) => {
        if (!train.current) return;
        progress.current = damp(progress.current, stage >= 1 ? 1 : 0, dt, stage >= 1 ? 0.45 : 2.5);
        const p = progress.current;
        train.current.position.x = 16 - 14 * p;
        train.current.visible = stage >= 1;
    });
    return (
        <group position={[0, 0, railZ]}>
            {stage >= 1 && (
                <>
                    <mesh position={[0, 0.06, -0.35]} receiveShadow>
                        <boxGeometry args={[36, 0.08, 0.1]} />
                        <meshStandardMaterial color="#52606b" metalness={0.5} roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 0.06, 0.35]} receiveShadow>
                        <boxGeometry args={[36, 0.08, 0.1]} />
                        <meshStandardMaterial color="#52606b" metalness={0.5} roughness={0.5} />
                    </mesh>
                </>
            )}
            <group ref={train} visible={false}>
                <mesh position={[0, 0.55, 0]} castShadow>
                    <boxGeometry args={[1.6, 0.7, 0.8]} />
                    <meshStandardMaterial color="#2c2f3a" roughness={0.6} metalness={0.2} />
                </mesh>
                <mesh position={[0.55, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.32, 0.32, 0.9, 14]} />
                    <meshStandardMaterial color="#3a2a22" roughness={0.6} metalness={0.2} />
                </mesh>
                <mesh position={[0.75, 1.05, 0]} castShadow>
                    <cylinderGeometry args={[0.1, 0.14, 0.4, 10]} />
                    <meshStandardMaterial color="#1c1c1c" roughness={0.8} />
                </mesh>
                <mesh position={[-1.5, 0.5, 0]} castShadow>
                    <boxGeometry args={[1.2, 0.55, 0.8]} />
                    <meshStandardMaterial color="#7a3b3b" roughness={0.8} />
                </mesh>
            </group>
        </group>
    );
}

// --- Fabrikk med pipe + røyk som reiser seg ved stage 2 ---
function Factory({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, stage >= 2 ? 1 : 0, dt, 2.4);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
    });
    return (
        <group ref={group} position={[10, 0, -3]} scale={[1, 0, 1]} visible={false}>
            <mesh position={[0, 0.8, 0]} castShadow>
                <boxGeometry args={[1.9, 1.6, 1.4]} />
                <meshStandardMaterial color="#8a4232" roughness={0.85} />
            </mesh>
            <mesh position={[0.6, 2.2, 0]} castShadow>
                <cylinderGeometry args={[0.17, 0.22, 1.6, 10]} />
                <meshStandardMaterial color="#4a2a20" roughness={0.9} />
            </mesh>
            <Smoke origin={[0.6, 3.1, 0]} show={stage >= 2} />
        </group>
    );
}

function Smoke({ origin, show }: { origin: [number, number, number]; show: boolean }) {
    const puffs = useRef<THREE.Mesh[]>([]);
    const COUNT = 5;
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        for (let i = 0; i < COUNT; i++) {
            const m = puffs.current[i];
            if (!m) continue;
            const cycle = (t * 0.5 + i / COUNT) % 1;
            const y = origin[1] + cycle * 2.2;
            const spread = cycle * 0.6;
            m.position.set(origin[0] + Math.sin(t + i) * spread, y, origin[2] + Math.cos(t * 0.7 + i) * spread * 0.5);
            m.scale.setScalar(0.18 + cycle * 0.45);
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.opacity = show ? (1 - cycle) * 0.55 : 0;
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
                    <meshStandardMaterial color="#70706e" transparent opacity={0} roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// --- Vestlig murbygning (skole/storting) som reiser seg ved stage 3 ---
function BrickSchool({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, stage >= 3 ? 1 : 0, dt, 2.2);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
    });
    return (
        <group ref={group} position={[5.5, 0, -2.5]} scale={[1, 0, 1]} visible={false}>
            {/* murkropp i to etasjer */}
            <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
                <boxGeometry args={[3, 2.1, 1.8]} />
                <meshStandardMaterial color="#b15a44" roughness={0.85} />
            </mesh>
            {/* flatt tak med list */}
            <mesh position={[0, 2.2, 0]} castShadow>
                <boxGeometry args={[3.2, 0.2, 2]} />
                <meshStandardMaterial color="#6a3a2c" roughness={0.85} />
            </mesh>
            {/* vinduer (lyse felter) */}
            {[-0.9, 0, 0.9].map((x) => (
                <mesh key={x} position={[x, 1.1, 0.92]}>
                    <boxGeometry args={[0.5, 0.8, 0.06]} />
                    <meshStandardMaterial color="#dfe9f0" emissive="#9fb6c4" emissiveIntensity={0.2} roughness={0.5} />
                </mesh>
            ))}
            {/* lite flagg på taket */}
            <mesh position={[0, 2.7, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
                <meshStandardMaterial color="#3a2a1a" />
            </mesh>
            <mesh position={[0.28, 2.95, 0]}>
                <planeGeometry args={[0.5, 0.34]} />
                <meshStandardMaterial color="#f4f4f4" side={THREE.DoubleSide} roughness={0.9} />
            </mesh>
        </group>
    );
}

// --- Telegrafstolper som reiser seg langs veien ved stage 3 ---
function Telegraph({ stage }: { stage: number }) {
    const spots: [number, number][] = [
        [-2, -5],
        [1, -5],
        [4, -5],
        [7, -5],
    ];
    return (
        <group>
            {spots.map((s, i) => (
                <TelegraphPole key={i} pos={s} show={stage >= 3} delay={i * 0.25} />
            ))}
        </group>
    );
}

function TelegraphPole({ pos, show, delay }: { pos: [number, number]; show: boolean; delay: number }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    const wait = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        if (show) wait.current += dt;
        const active = show && wait.current > delay;
        rise.current = damp(rise.current, active ? 1 : 0, dt, 3);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
    });
    return (
        <group ref={group} position={[pos[0], 0, pos[1]]} scale={[1, 0, 1]} visible={false}>
            <mesh position={[0, 0.9, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.06, 1.8, 6]} />
                <meshStandardMaterial color="#5c4326" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.6, 0]} castShadow>
                <boxGeometry args={[0.7, 0.07, 0.07]} />
                <meshStandardMaterial color="#4a3320" roughness={0.9} />
            </mesh>
        </group>
    );
}

// --- Litt natur ---
function Tree({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.14, 0.8, 6]} />
                <meshStandardMaterial color="#5c3f26" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.1, 0]} castShadow>
                <coneGeometry args={[0.6, 1.4, 8]} />
                <meshStandardMaterial color="#3f6b39" roughness={0.9} />
            </mesh>
        </group>
    );
}

function Trees() {
    const spots: [number, number, number][] = [
        [9, 0, 7.5],
        [-3, 0, 9],
        [11, 0, 5],
        [-10, 0, 10],
    ];
    return (
        <>
            {spots.map((p, i) => (
                <Tree key={i} position={p} />
            ))}
        </>
    );
}

export default MeijiByen3D;
