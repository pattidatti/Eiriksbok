import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Factory, Users, Trophy, RotateCcw, Hand, ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Burst } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Oslo: én by, to talemål.
//
// Lyspæra: en sosiolekt er talemålet til en sosial gruppe. I samme by kan folk
// snakke ulikt, ikke fordi et fjell skiller dem, men fordi det sosiale livet
// gjør det. I Oslo fulgte skillet elva: arbeiderstrøk i øst, embetsmenn og
// kjøpmenn i vest. Eleven utforsker begge kantene og ser til slutt at
// talemålene hos ungdom i dag nærmer seg hverandre.
//
// Mekanikk: to kort (vestkant/østkant) kan utforskes i valgfri rekkefølge. Når
// begge er utforsket, låser det tredje kortet (ungdom i dag) seg opp og
// fullfører spillet med en synlig sammensmelting. Scenen leser bare `active` +
// `converge` og demper alt mykt mot mål.

function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

type Side = 'vest' | 'ost';
type Active = Side | 'ungdom' | null;

interface SideInfo {
    id: Side;
    title: string;
    Icon: React.ComponentType<{ className?: string }>;
    blurb: string;
    banner: string;
    fact: string;
}

const SIDES: SideInfo[] = [
    {
        id: 'vest',
        title: 'Vestkanten',
        Icon: Building2,
        blurb: 'Embetsmenn og velstående kjøpmenn.',
        banner: 'Vestkantmål — talemålet la seg tett opp mot skriftspråket.',
        fact: 'På vestkanten vokste et finere talemål fram blant embetsmenn og velstående kjøpmenn. Det la seg tett opp mot skriftspråket: felleskjønn i stedet for hunkjønn, ingen tjukk l, og trykket ligger ikke på første stavelse. Denne varianten regnes ofte som «standardtalemål».',
    },
    {
        id: 'ost',
        title: 'Østkanten',
        Icon: Factory,
        blurb: 'Arbeiderstrøk ved fabrikkene.',
        banner: 'Østkantmål — folkemålet fra arbeiderstrøket, opprinnelig «Vika-mål».',
        fact: 'På østkanten, i arbeiderstrøket ved fabrikkene langs Akerselva, holdt folkemålet stand. Det ble kalt «Vika-mål» etter arbeiderstrøket Vika. Kjennetegn er hunkjønn (jenta, boka), a-endelsen, tjukk l, trykk på første stavelse — og pronomenet «jæi» for «jeg».',
    },
];

const UNGDOM_BANNER = 'Ungdom i dag: talemålene nærmer seg hverandre.';
const UNGDOM_FACT =
    'Utdanning, flytting og felles medier har gjort forskjellene mindre. De to Oslo-sosiolektene har begynt å nærme seg hverandre, og talemålet ungdom tar i bruk blander trekk fra begge kanter. Sosiolekten forsvinner ikke, men den forandrer seg — akkurat som språket alltid gjør.';

const OsloSosiolekt3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [active, setActive] = useState<Active>(null);
    const [explored, setExplored] = useState<Set<Side>>(new Set());
    const [converge, setConverge] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const bothExplored = explored.has('vest') && explored.has('ost');

    const chooseSide = (side: SideInfo) => {
        if (done) return;
        sounds.play('advance');
        setActive(side.id);
        setBanner(side.banner);
        setFact(side.fact);
        setExplored((prev) => {
            const next = new Set(prev);
            next.add(side.id);
            return next;
        });
        sounds.play('correct');
    };

    const chooseUngdom = () => {
        if (!bothExplored || done) return;
        sounds.play('sceneChange');
        setActive('ungdom');
        setConverge(true);
        setBanner(UNGDOM_BANNER);
        setFact(UNGDOM_FACT);
        setTimeout(() => {
            sounds.play('complete');
            setDone(true);
            setBurst((b) => b + 1);
            onComplete({ score: 1, completed: true, artifact: { converged: true } });
        }, 3600);
    };

    const reset = () => {
        setActive(null);
        setExplored(new Set());
        setConverge(false);
        setBanner(null);
        setFact(null);
        setDone(false);
    };

    const idle = active === null;

    return (
        <MicroGameFrame
            title="Oslo: én by, to talemål"
            subtitle="Utforsk hvordan sosial gruppe formet talemålet på hver side av elva"
            estimatedSeconds={150}
            onRetry={active !== null ? reset : undefined}
            bleed
        >
            <div className="flex flex-col">
                {/* --- 3D-scenen (full bredde) --- */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#cfe0ee] via-[#dfe8ec] to-[#dfe2d0] overflow-hidden"
                    style={{ aspectRatio: '16 / 10.8', minHeight: 360 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [12, 9, 13], fov: 40 }}
                        background="#cfe0ee"
                        fog={{ color: '#d6e2ea', near: 26, far: 52 }}
                        target={[0, 0.6, 0]}
                    >
                        <City active={active} converge={converge} />
                        <Burst position={[0, 3.2, 0]} trigger={burst} color="#6366f1" count={28} spread={3.2} />
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
                            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-indigo-800 shadow"
                        >
                            <Hand className="w-3.5 h-3.5" />
                            Elva deler byen — velg en kant under
                        </motion.div>
                    )}

                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        {active === 'ungdom'
                            ? 'Talemålene nærmer seg'
                            : active === 'vest'
                              ? 'Vestkantmål'
                              : active === 'ost'
                                ? 'Østkantmål'
                                : 'Oslo · én by, to talemål'}
                    </div>

                    <AnimatePresence>
                        {banner && !done && (
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
                            ? 'Sosiolekten forandrer seg'
                            : bothExplored
                              ? 'Begge kanter utforsket — se hva som skjer i dag'
                              : `Utforsk begge kantene (${explored.size} av 2)`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {SIDES.map((side) => {
                            const isExplored = explored.has(side.id);
                            const isActive = active === side.id;
                            const Icon = side.Icon;
                            return (
                                <button
                                    key={side.id}
                                    onClick={() => chooseSide(side)}
                                    disabled={done}
                                    className={`relative text-left rounded-xl border-2 p-3 transition ${
                                        isActive
                                            ? 'bg-indigo-100 border-indigo-400 shadow-sm'
                                            : isExplored
                                              ? 'bg-emerald-50 border-emerald-300'
                                              : 'bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer'
                                    } ${done ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                                isExplored
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-indigo-500 text-white'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                                {side.title}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                                        {side.blurb}
                                    </p>
                                </button>
                            );
                        })}

                        {/* Tredje kort: ungdom i dag — låser opp når begge kanter er utforsket */}
                        <button
                            onClick={chooseUngdom}
                            disabled={!bothExplored || done}
                            className={`relative text-left rounded-xl border-2 p-3 transition ${
                                converge
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : bothExplored
                                      ? 'bg-indigo-100 border-indigo-400 hover:bg-indigo-200 hover:border-indigo-500 shadow-sm cursor-pointer'
                                      : 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span
                                    className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                        converge
                                            ? 'bg-emerald-500 text-white'
                                            : bothExplored
                                              ? 'bg-indigo-500 text-white'
                                              : 'bg-slate-200 text-slate-400'
                                    }`}
                                >
                                    <Users className="w-5 h-5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                        Ungdom i dag
                                    </p>
                                </div>
                                {bothExplored && !converge && (
                                    <ArrowRight className="w-4 h-4 text-indigo-600 flex-shrink-0 animate-pulse" />
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                                Se talemålene nærme seg hverandre.
                            </p>
                        </button>
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
                                            Samme by, ulikt talemål.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        Det var ikke fjellet som skilte talemålene i Oslo, men det
                                        sosiale livet. Det er nettopp det en sosiolekt er.
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
                                Trykk på en kant og se hvem som bodde der og hvordan de snakket.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MicroGameFrame>
    );
};

// ============================================================
//  3D-SCENEN — alt utledes av `active` + `converge`, dempet mykt.
// ============================================================

function City({ active, converge }: { active: Active; converge: boolean }) {
    return (
        <group>
            <Ground />
            <River />
            {/* Vestkant til venstre (-X), østkant til høyre (+X) */}
            <SideCluster
                side="vest"
                active={active}
                converge={converge}
                baseX={-5.4}
                bodyColor="#e6ddc9"
                roofColor="#6b7280"
            />
            <SideCluster
                side="ost"
                active={active}
                converge={converge}
                baseX={5.4}
                bodyColor="#a8412f"
                roofColor="#4a3226"
            />
            <FactoryChimney active={active} />
            <BlendHouse converge={converge} />
        </group>
    );
}

function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[40, 30]} />
            <meshStandardMaterial color="#9aa77d" roughness={1} />
        </mesh>
    );
}

// Akerselva: en smal elv langs Z-aksen som deler byen i øst og vest.
function River() {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        if (matRef.current) {
            matRef.current.emissiveIntensity =
                0.12 + Math.sin(clock.getElapsedTime() * 1.2) * 0.05;
        }
    });
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <planeGeometry args={[1.8, 26]} />
            <meshStandardMaterial
                ref={matRef}
                color="#5a7d94"
                roughness={0.3}
                metalness={0.15}
                emissive="#2e5266"
                emissiveIntensity={0.14}
            />
        </mesh>
    );
}

// Et lite hus med saltak.
function House({
    position,
    body,
    roof,
    w = 1.5,
    h = 1.1,
    d = 1.3,
}: {
    position: [number, number, number];
    body: string;
    roof: string;
    w?: number;
    h?: number;
    d?: number;
}) {
    return (
        <group position={position}>
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color={body} roughness={0.85} />
            </mesh>
            <mesh position={[0, h + 0.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[w * 0.82, 0.6, 4]} />
                <meshStandardMaterial color={roof} roughness={0.9} />
            </mesh>
        </group>
    );
}

// En enkel figur som løfter armen når dens kant er aktiv.
function Speaker({ active, side }: { active: Active; side: Side }) {
    const arm = useRef<THREE.Group>(null);
    const isTalking = active === side || active === 'ungdom';
    useFrame(({ clock }, dt) => {
        if (!arm.current) return;
        const target = isTalking ? -1.3 : -0.15;
        arm.current.rotation.z = damp(arm.current.rotation.z, target, dt, 4);
        if (isTalking) {
            arm.current.rotation.z += Math.sin(clock.getElapsedTime() * 5) * 0.08;
        }
    });
    const coat = side === 'vest' ? '#3b4a6b' : '#7a4a2a';
    return (
        <group>
            <mesh position={[0, 0.34, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.19, 0.55, 8]} />
                <meshStandardMaterial color={coat} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.72, 0]} castShadow>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.8} />
            </mesh>
            <group ref={arm} position={[0.16, 0.5, 0]}>
                <mesh position={[0, -0.16, 0]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 0.34, 6]} />
                    <meshStandardMaterial color={coat} roughness={0.9} />
                </mesh>
            </group>
        </group>
    );
}

// En klynge hus + en taler for hver bykant. Når `converge` skrur seg på,
// glir husene litt mot midten og fargene blander seg — talemålene nærmer seg.
function SideCluster({
    side,
    active,
    converge,
    baseX,
    bodyColor,
    roofColor,
}: {
    side: Side;
    active: Active;
    converge: boolean;
    baseX: number;
    bodyColor: string;
    roofColor: string;
}) {
    const group = useRef<THREE.Group>(null);
    const lift = useRef(0);
    const isActive = active === side;

    // Målfarger: hver kant glir mot en felles «ungdomsfarge» ved converge.
    const bodyRef = useRef(new THREE.Color(bodyColor));
    const roofRef = useRef(new THREE.Color(roofColor));
    const bodyTargets = useRef<THREE.MeshStandardMaterial[]>([]);
    const roofTargets = useRef<THREE.MeshStandardMaterial[]>([]);

    const BLEND_BODY = new THREE.Color('#c98f6a');
    const BLEND_ROOF = new THREE.Color('#5a4a52');

    useFrame((_, dt) => {
        if (group.current) {
            // Løft og fremhev den aktive kanten litt.
            lift.current = damp(lift.current, isActive || active === 'ungdom' ? 1 : 0, dt, 3);
            const pull = converge ? 1 : 0;
            // Gli mot midten ved converge (baseX -> baseX*0.62).
            group.current.position.x = baseX + (baseX * 0.62 - baseX) * pull;
            group.current.position.y = lift.current * 0.14;
        }
        // Fargeblanding
        bodyRef.current.lerp(converge ? BLEND_BODY : new THREE.Color(bodyColor), Math.min(1, dt * 2));
        roofRef.current.lerp(converge ? BLEND_ROOF : new THREE.Color(roofColor), Math.min(1, dt * 2));
        bodyTargets.current.forEach((m) => m && m.color.copy(bodyRef.current));
        roofTargets.current.forEach((m) => m && m.color.copy(roofRef.current));
    });

    const dir = side === 'vest' ? -1 : 1;
    // Tre hus per kant, litt ulik størrelse.
    const houses: { pos: [number, number, number]; w: number; h: number }[] = [
        { pos: [0, 0, -2.4], w: 1.5, h: 1.2 },
        { pos: [dir * 1.6, 0, -0.2], w: 1.7, h: 1.0 },
        { pos: [dir * 0.4, 0, 2.4], w: 1.4, h: 1.4 },
    ];

    return (
        <group ref={group} position={[baseX, 0, 0]}>
            {houses.map((h, i) => (
                <group key={i} position={h.pos}>
                    <mesh position={[0, h.h / 2, 0]} castShadow receiveShadow>
                        <boxGeometry args={[h.w, h.h, 1.3]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                if (m) bodyTargets.current[i] = m;
                            }}
                            color={bodyColor}
                            roughness={0.85}
                        />
                    </mesh>
                    <mesh position={[0, h.h + 0.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                        <coneGeometry args={[h.w * 0.82, 0.6, 4]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                if (m) roofTargets.current[i] = m;
                            }}
                            color={roofColor}
                            roughness={0.9}
                        />
                    </mesh>
                </group>
            ))}
            {/* Taleren står fremst mot elva */}
            <group position={[dir * -1.1, 0, 3.7]}>
                <Speaker active={active} side={side} />
            </group>
        </group>
    );
}

// Fabrikkpipe på østkanten, med røyk. Markerer arbeiderstrøket.
function FactoryChimney({ active }: { active: Active }) {
    const highlight = active === 'ost';
    return (
        <group position={[7.6, 0, -3.6]}>
            <mesh position={[0, 0.8, 0]} castShadow>
                <boxGeometry args={[1.4, 1.6, 1.2]} />
                <meshStandardMaterial color="#7a3b2a" roughness={0.85} />
            </mesh>
            <mesh position={[0.4, 2.1, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.2, 1.6, 10]} />
                <meshStandardMaterial color="#4a2a20" roughness={0.9} />
            </mesh>
            <Smoke origin={[0.4, 3.0, 0]} show={highlight} />
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
            const y = origin[1] + cycle * 2.0;
            const spread = cycle * 0.55;
            m.position.set(
                origin[0] + Math.sin(t + i) * spread,
                y,
                origin[2] + Math.cos(t * 0.7 + i) * spread * 0.5
            );
            const s = 0.16 + cycle * 0.4;
            m.scale.setScalar(s);
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
                    <meshStandardMaterial color="#7a7a7a" transparent opacity={0} roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// Et «blandingshus» som reiser seg midt i byen når talemålene smelter sammen.
function BlendHouse({ converge }: { converge: boolean }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, converge ? 1 : 0, dt, 2.2);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
    });
    return (
        <group ref={group} position={[0, 0, 5.2]} scale={[1, 0, 1]} visible={false}>
            <House position={[0, 0, 0]} body="#c98f6a" roof="#5a4a52" w={1.6} h={1.3} d={1.4} />
        </group>
    );
}

export default OsloSosiolekt3D;
