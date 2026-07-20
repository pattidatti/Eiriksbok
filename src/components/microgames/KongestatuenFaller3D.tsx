import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Hand, Trophy, RotateCcw, Users } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Interactive, Hotspot, Burst, damp } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Kongestatuen faller - et 3D-mikrospill for Uavhengighetserklæringen.
//
// New York, 9. juli 1776. Erklæringen leses høyt på Bowling Green. Folket
// river ned den forgylte rytterstatuen av kong George III. Blyet ble smeltet om
// til over 42 000 kuler til revolusjonshæren.
//
// Lyspære: erklæringens ord ble til handling. Folket rev ned symbolet på
// kongemakten og støpte det om til kuler for sin egen frihet - makten skiftet
// fra kronen til folket.
//
// Mekanikk: 1) klikk skriftrullen og les erklæringen (låser opp handling).
// 2) trekk i tauet (klikk statuen eller knappen) tre ganger; for hvert trekk
// heller statuen mer, til den velter. Scenen leser bare `read` og `pulls` og
// demper alt mykt mot mål.

const PULLS_TO_FALL = 3;

const KongestatuenFaller3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [read, setRead] = useState(false);
    const [pulls, setPulls] = useState(0);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);

    const readDeclaration = () => {
        if (read) return;
        setRead(true);
        setBanner('«Alle mennesker er skapt like, og har rettigheter ingen kan ta fra dem.»');
        sounds.play('advance');
    };

    const pull = () => {
        if (!read || done) return;
        const next = pulls + 1;
        setPulls(next);
        if (next >= PULLS_TO_FALL) {
            setBanner('Statuen faller! Blyet støpes om til kuler for revolusjonshæren.');
            sounds.play('complete');
            setBurst((b) => b + 1);
            setDone(true);
            onComplete({ score: 1, completed: true, artifact: { toppled: true } });
        } else {
            setBanner('Trekk i tauet! Kongen heller mer for hvert napp.');
            sounds.play('correct');
        }
    };

    const reset = () => {
        setRead(false);
        setPulls(0);
        setDone(false);
        setBanner(null);
    };

    const idle = !read;

    return (
        <MicroGameFrame
            title="Kongestatuen faller"
            subtitle="New York, 9. juli 1776. Erklæringen leses, og folket river ned kongen."
            estimatedSeconds={130}
            onRetry={read || pulls > 0 ? reset : undefined}
            bleed
        >
            <div className="flex flex-col">
                {/* 3D-scenen i full bredde */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#ece3cf] via-[#e6ddc8] to-[#cdbf9c] overflow-hidden"
                    style={{ aspectRatio: '16/9', minHeight: 300 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [8, 6, 11], fov: 40 }}
                        background="#ece3cf"
                        fog={{ color: '#e6ddc8', near: 24, far: 46 }}
                        target={[0, 1.6, 0]}
                        light="golden"
                    >
                        <Square
                            read={read}
                            pulls={pulls}
                            done={done}
                            onReadScroll={readDeclaration}
                            onPullStatue={pull}
                        />
                        <Burst position={[0, 3, 0]} trigger={burst} color="#d8b24a" count={34} spread={3.6} />
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
                            Klikk skriftrullen for å lese erklæringen
                        </motion.div>
                    )}

                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        Bowling Green, 1776
                    </div>

                    <AnimatePresence>
                        {banner && (
                            <motion.div
                                key={banner}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-3 left-3 right-3 mx-auto max-w-md rounded-xl bg-[#2e5e86]/90 text-white px-4 py-2.5 text-sm font-semibold shadow-lg text-center"
                            >
                                {banner}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Kontrollpanel UNDER vinduet */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-amber-200">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                        {done
                            ? 'Kongen er nede'
                            : !read
                              ? 'Steg 1 av 2: les erklæringen'
                              : `Steg 2 av 2: trekk i tauet (${pulls}/${PULLS_TO_FALL})`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                            onClick={readDeclaration}
                            disabled={read}
                            className={`text-left rounded-xl border-2 p-3 transition ${
                                read
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : 'bg-amber-100 border-amber-400 hover:bg-amber-200 hover:border-amber-500 shadow-sm cursor-pointer'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span
                                    className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                        read ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                    }`}
                                >
                                    <ScrollText className="w-5 h-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                        Les erklæringen høyt
                                    </p>
                                    <p className="text-xs text-slate-500 leading-snug">
                                        Alle mennesker er skapt like.
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={pull}
                            disabled={!read || done}
                            className={`text-left rounded-xl border-2 p-3 transition ${
                                done
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : read
                                      ? 'bg-amber-100 border-amber-400 hover:bg-amber-200 hover:border-amber-500 shadow-sm cursor-pointer'
                                      : 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span
                                    className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                        done
                                            ? 'bg-emerald-500 text-white'
                                            : read
                                              ? 'bg-amber-500 text-white'
                                              : 'bg-slate-200 text-slate-400'
                                    }`}
                                >
                                    <Users className="w-5 h-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                        Trekk i tauet
                                    </p>
                                    <p className="text-xs text-slate-500 leading-snug">
                                        Eller klikk statuen i scenen.
                                    </p>
                                </div>
                            </div>
                        </button>
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
                                            Ordene ble til handling.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        Statuen av kong George III ble smeltet om til over 42 000
                                        kuler til revolusjonshæren. Makten skiftet fra kronen til
                                        folket, akkurat slik erklæringen sa.
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
                        ) : (
                            <motion.div
                                key="hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 text-center text-xs text-slate-500 italic px-2"
                            >
                                {read
                                    ? 'Trekk til kongen velter. Se hva folket gjør med metallet.'
                                    : 'Les først erklæringen, så låses handlingen opp.'}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MicroGameFrame>
    );
};

// ============================================================
//  3D-SCENEN - alt utledes av `read`, `pulls` og `done`.
// ============================================================

function Square({
    read,
    pulls,
    done,
    onReadScroll,
    onPullStatue,
}: {
    read: boolean;
    pulls: number;
    done: boolean;
    onReadScroll: () => void;
    onPullStatue: () => void;
}) {
    return (
        <group>
            <Ground />
            <Pedestal />
            {/* Statuen: klikkbar når erklæringen er lest og den ikke er veltet */}
            <Interactive
                position={[0, 2.1, 0]}
                onSelect={onPullStatue}
                disabled={!read || done}
                hitArea={[2.4, 3.2, 2.4]}
                hoverScale={1.03}
            >
                <Statue pulls={pulls} />
            </Interactive>
            <Crowd read={read} />
            <Buildings />
            {/* Skriftrull-hotspot før lesing */}
            {!read && <Hotspot position={[3.4, 1.2, 2.6]} onSelect={onReadScroll} label="Les erklæringen" />}
        </group>
    );
}

function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[40, 34]} />
            <meshStandardMaterial color="#b7ab88" roughness={1} />
        </mesh>
    );
}

// Stein-sokkel som statuen står på.
function Pedestal() {
    return (
        <group>
            <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 1.8, 2]} />
                <meshStandardMaterial color="#c3b291" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.9, 0]} castShadow>
                <boxGeometry args={[2.4, 0.24, 2.4]} />
                <meshStandardMaterial color="#a89877" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Forgylt rytterstatue av kong George III. Heller mer for hvert trekk, og
// velter helt når pulls når terskelen. Pivot ligger i statuens fot (Interactive
// er allerede løftet til [0,2.1,0], så vi roterer denne gruppa om sin egen fot).
function Statue({ pulls }: { pulls: number }) {
    const tilt = useRef<THREE.Group>(null);

    useFrame((_, dt) => {
        if (!tilt.current) return;
        // Mål-vinkel: 0, 0.18, 0.45, deretter velt (~1.5 rad = ligger nede).
        const target =
            pulls >= 3 ? 1.5 : pulls === 2 ? 0.45 : pulls === 1 ? 0.18 : 0;
        tilt.current.rotation.z = damp(tilt.current.rotation.z, -target, dt, pulls >= 3 ? 3.4 : 5);
        // Når den velter, la den også gli litt utover sokkelen.
        const slideTarget = pulls >= 3 ? -1.4 : 0;
        tilt.current.position.x = damp(tilt.current.position.x, slideTarget, dt, 2.4);
    });

    return (
        <group ref={tilt}>
            {/* Hesten (kropp + hals + hode + bein) - forgylt */}
            <group position={[0, 0.9, 0]}>
                <mesh position={[0, 0, 0]} castShadow>
                    <boxGeometry args={[0.7, 0.7, 1.7]} />
                    <meshStandardMaterial color="#d8b24a" metalness={0.7} roughness={0.35} />
                </mesh>
                <mesh position={[0, 0.5, 0.8]} rotation={[0.5, 0, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.7, 0.4]} />
                    <meshStandardMaterial color="#d8b24a" metalness={0.7} roughness={0.35} />
                </mesh>
                <mesh position={[0, 0.85, 1.05]} castShadow>
                    <boxGeometry args={[0.34, 0.4, 0.6]} />
                    <meshStandardMaterial color="#d8b24a" metalness={0.7} roughness={0.35} />
                </mesh>
                {[
                    [-0.24, -0.7, 0.6],
                    [0.24, -0.7, 0.6],
                    [-0.24, -0.7, -0.6],
                    [0.24, -0.7, -0.6],
                ].map((p, i) => (
                    <mesh key={i} position={[p[0], p[1], p[2]]} castShadow>
                        <boxGeometry args={[0.16, 0.7, 0.16]} />
                        <meshStandardMaterial color="#c39d3e" metalness={0.7} roughness={0.4} />
                    </mesh>
                ))}
            </group>
            {/* Rytteren: kong George III med krone - forgylt */}
            <group position={[0, 1.9, -0.1]}>
                <mesh position={[0, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.2, 0.26, 0.7, 8]} />
                    <meshStandardMaterial color="#d8b24a" metalness={0.75} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.5, 0]} castShadow>
                    <sphereGeometry args={[0.2, 12, 12]} />
                    <meshStandardMaterial color="#d8b24a" metalness={0.75} roughness={0.3} />
                </mesh>
                {/* Krone */}
                <mesh position={[0, 0.72, 0]} castShadow>
                    <cylinderGeometry args={[0.22, 0.18, 0.16, 8]} />
                    <meshStandardMaterial color="#e8c95a" metalness={0.85} roughness={0.2} />
                </mesh>
            </group>
        </group>
    );
}

// Folkemengden rundt sokkelen. Løftes/lyser opp når erklæringen er lest.
const CROWD = [
    { pos: [-2.6, 0, 2.4] as [number, number, number], color: '#3b5a78' },
    { pos: [2.7, 0, 2.2] as [number, number, number], color: '#6b4a2a' },
    { pos: [-3.1, 0, -1.2] as [number, number, number], color: '#7a3b2a' },
    { pos: [3.0, 0, -1.6] as [number, number, number], color: '#4a6f4a' },
    { pos: [0.2, 0, 3.4] as [number, number, number], color: '#5a4632' },
];

function Crowd({ read }: { read: boolean }) {
    return (
        <group>
            {CROWD.map((c, i) => (
                <Citizen key={i} pos={c.pos} color={c.color} read={read} phase={i * 0.8} />
            ))}
        </group>
    );
}

function Citizen({
    pos,
    color,
    read,
    phase,
}: {
    pos: [number, number, number];
    color: string;
    read: boolean;
    phase: number;
}) {
    const arm = useRef<THREE.Group>(null);
    useFrame(({ clock }, dt) => {
        if (!arm.current) return;
        const t = clock.getElapsedTime();
        // Når erklæringen er lest: løfter armene og jubler. Ellers stille.
        const raise = read ? -2.2 + Math.sin(t * 4 + phase) * 0.4 : -0.2;
        arm.current.rotation.x = damp(arm.current.rotation.x, raise, dt, 5);
    });
    return (
        <group position={pos}>
            <mesh position={[0, 0.34, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.19, 0.55, 8]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.72, 0]} castShadow>
                <sphereGeometry args={[0.14, 10, 10]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.85} />
            </mesh>
            {/* Armer som løftes ved jubel */}
            <group ref={arm} position={[0, 0.55, 0]}>
                <mesh position={[0.18, 0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
                    <meshStandardMaterial color={color} roughness={0.9} />
                </mesh>
                <mesh position={[-0.18, 0.1, 0]} rotation={[0, 0, 0.3]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
                    <meshStandardMaterial color={color} roughness={0.9} />
                </mesh>
            </group>
        </group>
    );
}

// Litt by-kulisse i bakgrunnen (georgianske murhus).
function Buildings() {
    const spots: { pos: [number, number, number]; w: number; h: number; body: string }[] = [
        { pos: [-7, 0, -6], w: 3, h: 3.2, body: '#b98d5e' },
        { pos: [-3.5, 0, -7.5], w: 2.6, h: 2.6, body: '#c9a678' },
        { pos: [1, 0, -8], w: 3.2, h: 3.6, body: '#a9713f' },
        { pos: [5.5, 0, -6.5], w: 2.8, h: 3, body: '#bb9564' },
    ];
    return (
        <group>
            {spots.map((s, i) => (
                <group key={i} position={s.pos}>
                    <mesh position={[0, s.h / 2, 0]} castShadow receiveShadow>
                        <boxGeometry args={[s.w, s.h, s.w]} />
                        <meshStandardMaterial color={s.body} roughness={0.9} />
                    </mesh>
                    <mesh position={[0, s.h + 0.35, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                        <coneGeometry args={[s.w * 0.78, 0.8, 4]} />
                        <meshStandardMaterial color="#5c463a" roughness={0.9} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

export default KongestatuenFaller3D;
