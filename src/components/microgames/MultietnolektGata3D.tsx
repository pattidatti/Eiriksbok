import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Trophy, RotateCcw, Hand } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Burst, Interactive, damp } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Multietnolekt-gata: én gate, mange språk.
//
// Lyspæra: en multietnolekt er ETT felles ungdomsspråk som er bygd av lånord fra
// mange ulike språk. Eleven klikker seg inn på tre «språkhus» (arabisk, urdu og
// punjabi, engelsk). Fra hvert hus flyr et ord inn til det felles torget midt i
// gata. Når alle tre ordene har møttes på torget, samles ungdommene og
// multietnolekten er født. Ordene kommer fra mange steder, men blir til ett
// felles språk som viser hvem du henger med.
//
// Mekanikk: tre klikkbare hus (eller knapper under vinduet) driver scenen. Hvert
// klikk sender et lysende ord fra huset til torget. Scenen leser bare `collected`
// og `done`, og demper alt mykt mot mål.

type LangId = 'arabisk' | 'urdu' | 'engelsk';

interface LangInfo {
    id: LangId;
    title: string;
    word: string;
    gloss: string;
    color: string;
    housePos: [number, number, number];
    slot: [number, number, number];
    banner: string;
    fact: string;
}

const LANGS: LangInfo[] = [
    {
        id: 'arabisk',
        title: 'Arabisk',
        word: '«wallah»',
        gloss: 'jeg sverger',
        color: '#f59e0b',
        housePos: [-5.2, 0, -1.8],
        slot: [-1.3, 2.2, -0.3],
        banner: '«wallah» betyr «jeg sverger» og kommer fra arabisk.',
        fact: 'Mange av ordene i multietnolekten kommer fra arabisk, som «wallah» (jeg sverger) og «jalla» (kom igjen). Arabisk er morsmålet til mange familier i de flerkulturelle bydelene.',
    },
    {
        id: 'urdu',
        title: 'Urdu og punjabi',
        word: '«baja»',
        gloss: 'kompis',
        color: '#8b5cf6',
        housePos: [5.2, 0, -1.8],
        slot: [1.3, 2.2, -0.3],
        banner: '«baja» betyr «kompis» og kommer fra urdu og punjabi.',
        fact: 'Andre ord kommer fra urdu og punjabi, språk mange med pakistansk bakgrunn snakker. «Baja» betyr kompis, og «tært» betyr kul eller fin.',
    },
    {
        id: 'engelsk',
        title: 'Engelsk',
        word: '«digge»',
        gloss: 'å like',
        color: '#38bdf8',
        housePos: [0, 0, 5],
        slot: [0, 2.6, 0.9],
        banner: '«digge» betyr «å like» og kommer fra engelsk.',
        fact: 'Multietnolekten låner også fra engelsk, som ungdom møter overalt i musikk, spill og på nett. «Digge» betyr å like noe.',
    },
];

const MultietnolektGata3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [collected, setCollected] = useState<Set<LangId>>(new Set());
    const [active, setActive] = useState<LangId | null>(null);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);
    const finaleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const collect = (lang: LangInfo) => {
        if (done || collected.has(lang.id)) return;
        sounds.play('correct');
        setActive(lang.id);
        setBanner(lang.banner);
        setFact(lang.fact);
        setCollected((prev) => {
            const next = new Set(prev);
            next.add(lang.id);
            if (next.size === LANGS.length && !finaleTimer.current) {
                sounds.play('advance');
                finaleTimer.current = setTimeout(() => {
                    sounds.play('complete');
                    setDone(true);
                    setBanner('Multietnolekten er født — ett felles ungdomsspråk.');
                    setBurst((b) => b + 1);
                    onComplete({ score: 1, completed: true, artifact: { languages: LANGS.length } });
                }, 2400);
            }
            return next;
        });
    };

    const reset = () => {
        if (finaleTimer.current) {
            clearTimeout(finaleTimer.current);
            finaleTimer.current = null;
        }
        setCollected(new Set());
        setActive(null);
        setBanner(null);
        setFact(null);
        setDone(false);
    };

    const idle = collected.size === 0;

    return (
        <MicroGameFrame
            title="Multietnolekt-gata: én gate, mange språk"
            subtitle="Hent ordene fra hvert språkhus inn til det felles torget"
            estimatedSeconds={140}
            onRetry={collected.size > 0 ? reset : undefined}
            bleed
        >
            <div className="flex flex-col">
                {/* --- 3D-scenen (full bredde) --- */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#dbe6f2] via-[#e4ebe6] to-[#e8e2d2] overflow-hidden"
                    style={{ aspectRatio: '16 / 10.8', minHeight: 360 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [0, 9, 13], fov: 42 }}
                        background="#dbe6f2"
                        fog={{ color: '#dfe8ee', near: 24, far: 50 }}
                        target={[0, 0.8, 0]}
                    >
                        <Gata collected={collected} done={done} onCollect={collect} />
                        <Burst position={[0, 2.4, 0]} trigger={burst} color="#6366f1" count={30} spread={3.4} />
                    </MicroCanvas>

                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{ boxShadow: 'inset 0 0 90px 10px rgba(15,23,42,0.15)' }}
                    />

                    {idle && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-indigo-800 shadow"
                        >
                            <Hand className="w-3.5 h-3.5" />
                            Trykk på et språkhus — eller en knapp under
                        </motion.div>
                    )}

                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        Ord på torget: {collected.size} av {LANGS.length}
                    </div>

                    <AnimatePresence>
                        {banner && (
                            <motion.div
                                key={banner}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-3 left-3 right-3 mx-auto max-w-lg rounded-xl bg-indigo-900/85 text-indigo-50 px-4 py-2.5 text-sm font-semibold shadow-lg text-center"
                            >
                                {banner}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- Kontrollpanel UNDER vinduet --- */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-indigo-100">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-indigo-700">
                        {done
                            ? 'Ett felles språk, bygd av mange'
                            : `Hent ordene fra hvert språk (${collected.size} av ${LANGS.length})`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {LANGS.map((lang) => {
                            const isCollected = collected.has(lang.id);
                            const isActive = active === lang.id;
                            return (
                                <button
                                    key={lang.id}
                                    onClick={() => collect(lang)}
                                    disabled={done || isCollected}
                                    className={`relative text-left rounded-xl border-2 p-3 transition ${
                                        isActive && !isCollected
                                            ? 'bg-indigo-100 border-indigo-400 shadow-sm'
                                            : isCollected
                                              ? 'bg-emerald-50 border-emerald-300'
                                              : 'bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer'
                                    } ${done ? 'opacity-70' : ''}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white"
                                            style={{ backgroundColor: lang.color }}
                                        >
                                            <Languages className="w-5 h-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                                {lang.title}
                                            </p>
                                            <p className="text-xs text-slate-500 leading-tight">
                                                {lang.word} = {lang.gloss}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Fakta / avslutning */}
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
                                            Ordene kom fra mange språk — og ble til ett.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        Det er derfor det heter multietnolekt. Ungdommene på torget
                                        deler ett felles språk. Det viser hvem de henger med, ikke hvor
                                        de kommer fra.
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
                                Hvert hus snakker sitt språk. Hent ordene inn til det felles torget.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MicroGameFrame>
    );
};

// ============================================================
//  3D-SCENEN — alt utledes av `collected` + `done`, dempet mykt.
// ============================================================

function Gata({
    collected,
    done,
    onCollect,
}: {
    collected: Set<LangId>;
    done: boolean;
    onCollect: (lang: LangInfo) => void;
}) {
    return (
        <group>
            <Ground />
            <Plaza done={done} />
            {LANGS.map((lang) => (
                <LanguageHouse
                    key={lang.id}
                    lang={lang}
                    collected={collected.has(lang.id)}
                    disabled={done}
                    onSelect={() => onCollect(lang)}
                />
            ))}
            {LANGS.map((lang) => (
                <WordTile key={lang.id} lang={lang} collected={collected.has(lang.id)} />
            ))}
            <YouthGroup done={done} />
        </group>
    );
}

function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[42, 32]} />
            <meshStandardMaterial color="#c3c9b4" roughness={1} />
        </mesh>
    );
}

// Det felles torget midt i gata. Lyser opp når multietnolekten er født.
function Plaza({ done }: { done: boolean }) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const glow = useRef(0);
    useFrame(({ clock }, dt) => {
        glow.current = damp(glow.current, done ? 1 : 0, dt, 2.5);
        if (matRef.current) {
            const pulse = done ? 0.15 + Math.sin(clock.getElapsedTime() * 2) * 0.06 : 0;
            matRef.current.emissiveIntensity = glow.current * (0.3 + pulse);
        }
    });
    return (
        <group>
            <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[3.2, 40]} />
                <meshStandardMaterial
                    ref={matRef}
                    color="#d7cbb0"
                    roughness={0.8}
                    emissive="#6366f1"
                    emissiveIntensity={0}
                />
            </mesh>
            {/* Lys ring rundt torget */}
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.0, 3.2, 40]} />
                <meshStandardMaterial color="#a78b4f" roughness={0.7} />
            </mesh>
        </group>
    );
}

// Et språkhus. Klikkbart via Interactive. Løftes og lyser litt når ordet er hentet.
function LanguageHouse({
    lang,
    collected,
    disabled,
    onSelect,
}: {
    lang: LangInfo;
    collected: boolean;
    disabled: boolean;
    onSelect: () => void;
}) {
    const group = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.MeshStandardMaterial>(null);
    const lift = useRef(0);
    useFrame((_, dt) => {
        lift.current = damp(lift.current, collected ? 1 : 0, dt, 3);
        if (group.current) group.current.position.y = lift.current * 0.12;
        if (bodyRef.current) bodyRef.current.emissiveIntensity = lift.current * 0.4;
    });
    return (
        <Interactive
            position={lang.housePos}
            onSelect={onSelect}
            disabled={disabled || collected}
            state={collected ? 'correct' : undefined}
            hitArea={[2.6, 2.6, 2.6]}
            sound="select"
        >
            {(s) => (
                <group ref={group}>
                    {/* Husvegg */}
                    <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.9, 1.5, 1.7]} />
                        <meshStandardMaterial
                            ref={bodyRef}
                            color={s === 'hover' ? '#fdf6e3' : '#ece3d0'}
                            roughness={0.85}
                            emissive={lang.color}
                            emissiveIntensity={0}
                        />
                    </mesh>
                    {/* Tak i språkets farge */}
                    <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                        <coneGeometry args={[1.55, 0.85, 4]} />
                        <meshStandardMaterial color={lang.color} roughness={0.7} />
                    </mesh>
                    {/* Dør */}
                    <mesh position={[0, 0.45, 0.86]}>
                        <planeGeometry args={[0.5, 0.9]} />
                        <meshStandardMaterial color="#7a5a3a" roughness={0.9} />
                    </mesh>
                </group>
            )}
        </Interactive>
    );
}

// Et lysende ord som svever over huset sitt, og flyr inn til torget når det hentes.
function WordTile({ lang, collected }: { lang: LangInfo; collected: boolean }) {
    const group = useRef<THREE.Group>(null);
    const homePos = new THREE.Vector3(lang.housePos[0], 2.4, lang.housePos[2]);
    const target = new THREE.Vector3(lang.slot[0], lang.slot[1], lang.slot[2]);
    useFrame(({ clock }, dt) => {
        if (!group.current) return;
        const dest = collected ? target : homePos;
        group.current.position.x = damp(group.current.position.x, dest.x, dt, 3);
        group.current.position.y = damp(group.current.position.y, dest.y, dt, 3);
        group.current.position.z = damp(group.current.position.z, dest.z, dt, 3);
        // Rolig svev + rotasjon så ordet føles levende.
        group.current.rotation.y += dt * 0.6;
        group.current.position.y += Math.sin(clock.getElapsedTime() * 2 + lang.housePos[0]) * 0.004;
    });
    return (
        <group ref={group} position={homePos.toArray()}>
            <mesh castShadow>
                <boxGeometry args={[0.9, 0.6, 0.18]} />
                <meshStandardMaterial
                    color={lang.color}
                    emissive={lang.color}
                    emissiveIntensity={0.6}
                    roughness={0.4}
                    metalness={0.1}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}

// En liten figur.
function Youth({ color }: { color: string }) {
    return (
        <group>
            <mesh position={[0, 0.34, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.19, 0.55, 8]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.72, 0]} castShadow>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Ungdomsgjengen på torget. Reiser seg og samles når multietnolekten er født.
function YouthGroup({ done }: { done: boolean }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, done ? 1 : 0, dt, 2.2);
        group.current.scale.y = Math.max(0.001, rise.current);
        group.current.visible = rise.current > 0.02;
    });
    const coats = ['#3b6ea5', '#a5533b', '#4a8a5a', '#8b5cf6', '#c98f3b'];
    const ring = coats.map((c, i) => {
        const a = (i / coats.length) * Math.PI * 2;
        return { pos: [Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5] as [number, number, number], color: c };
    });
    return (
        <group ref={group} position={[0, 0, 0]} scale={[1, 0, 1]} visible={false}>
            {ring.map((r, i) => (
                <group key={i} position={r.pos}>
                    <Youth color={r.color} />
                </group>
            ))}
        </group>
    );
}

export default MultietnolektGata3D;
