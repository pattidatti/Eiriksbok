import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, MapPin, RotateCcw, Sun } from 'lucide-react';

interface SolaSomKlokkeProps {
    title?: string;
}

type PrayerId = 'fajr' | 'duhr' | 'asr' | 'maghrib' | 'isha';

interface Prayer {
    id: PrayerId;
    name: string;
    cue: string;
    blurb: string;
}

const PRAYERS: Prayer[] = [
    {
        id: 'fajr',
        name: 'Fajr',
        cue: 'Daggry, før sola står opp',
        blurb: 'Morgenbønnen. Himmelen lysner i øst, men sola er fortsatt under horisonten.',
    },
    {
        id: 'duhr',
        name: 'Duhr',
        cue: 'Sola står på sitt høyeste',
        blurb: 'Middagsbønnen. På fredager blir den erstattet av fredagsbønnen i moskeen.',
    },
    {
        id: 'asr',
        name: 'Asr',
        cue: 'Ettermiddag, sola er på vei ned',
        blurb: 'Ettermiddagsbønnen. Sola har passert toppen, og skyggene blir lengre.',
    },
    {
        id: 'maghrib',
        name: 'Maghrib',
        cue: 'Sola går ned',
        blurb: 'Kveldsbønnen. Den kommer med det samme sola forsvinner under horisonten.',
    },
    {
        id: 'isha',
        name: 'Isha',
        cue: 'Det er blitt mørkt',
        blurb: 'Nattbønnen. Den siste av de fem, når lyset er borte fra himmelen.',
    },
];

interface Scene {
    id: string;
    place: string;
    when: string;
    /** Hvor høyt sirkelsenteret ligger over horisonten. Styrer hvor lang dagen blir. */
    offset: number;
    /** Hvor høyt sola står midt på dagen, i piksler over horisonten. */
    peak: number;
    note?: string;
}

const SCENES: Scene[] = [
    { id: 'mekka', place: 'Mekka', when: 'i juni', offset: 0.14, peak: 100 },
    { id: 'oslo-juni', place: 'Oslo', when: 'i juni', offset: 0.72, peak: 62 },
    { id: 'oslo-des', place: 'Oslo', when: 'i desember', offset: -0.72, peak: 18 },
    {
        id: 'tromso',
        place: 'Tromsø',
        when: 'i juni',
        offset: 1.15,
        peak: 52,
        note: 'Her går sola aldri ned. Da finnes det verken soloppgang eller mørke å måle etter, og moskeene i Norge må regne seg fram til tidene på andre måter.',
    },
];

const VW = 720;
const VH = 288;
const CX = 360;
const RX = 250;
const HORIZON = 150;
const TAU = Math.PI * 2;
const HIT = 0.02;

const wrap = (t: number) => ((t % 1) + 1) % 1;

const gap = (a: number, b: number) => {
    const d = Math.abs(wrap(a) - wrap(b));
    return Math.min(d, 1 - d);
};

interface Marker {
    id: PrayerId;
    t: number;
    estimated: boolean;
}

export function SolaSomKlokke({ title = 'Sola som klokke' }: SolaSomKlokkeProps) {
    const [sceneId, setSceneId] = useState<string>('mekka');
    const [theta, setTheta] = useState(0.25);
    const [found, setFound] = useState<Record<string, PrayerId[]>>({});
    const [burst, setBurst] = useState(0);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const dragging = useRef(false);

    const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
    const ry = scene.peak / (1 + scene.offset);
    const centerY = HORIZON - scene.offset * ry;
    const midnightSun = Math.abs(scene.offset) > 1;

    const markers = useMemo<Marker[]>(() => {
        if (midnightSun) {
            return [
                { id: 'fajr', t: 0.1, estimated: true },
                { id: 'duhr', t: 0.5, estimated: false },
                { id: 'asr', t: 0.72, estimated: false },
                { id: 'maghrib', t: 0.9, estimated: true },
                { id: 'isha', t: 0.95, estimated: true },
            ];
        }
        const rise = Math.acos(scene.offset) / TAU;
        const set = 1 - rise;
        return [
            { id: 'fajr', t: wrap(rise - 0.05), estimated: false },
            { id: 'duhr', t: 0.5, estimated: false },
            { id: 'asr', t: 0.5 + (set - 0.5) * 0.6, estimated: false },
            { id: 'maghrib', t: set, estimated: false },
            { id: 'isha', t: wrap(set + 0.05), estimated: false },
        ];
    }, [scene.offset, midnightSun]);

    const posOf = useCallback(
        (t: number) => {
            const a = t * TAU;
            return { x: CX - RX * Math.sin(a), y: centerY + ry * Math.cos(a) };
        },
        [centerY, ry]
    );

    const sun = posOf(theta);
    const dayness = Math.max(0, Math.min(1, (HORIZON - sun.y) / Math.max(6, scene.peak * 0.35)));

    const dayPath = useMemo(() => {
        if (midnightSun) {
            return `M ${CX} ${centerY - ry} A ${RX} ${ry} 0 1 1 ${CX - 0.01} ${centerY - ry} Z`;
        }
        const a1 = Math.acos(scene.offset);
        const x1 = CX - RX * Math.sin(a1);
        const x2 = CX + RX * Math.sin(a1);
        const large = scene.offset > 0 ? 1 : 0;
        return `M ${x1} ${HORIZON} A ${RX} ${ry} 0 ${large} 1 ${x2} ${HORIZON}`;
    }, [scene.offset, centerY, ry, midnightSun]);

    const foundHere = found[sceneId] ?? [];
    const active = markers.find((m) => gap(m.t, theta) < HIT) ?? null;
    const activePrayer = active ? PRAYERS.find((p) => p.id === active.id)! : null;
    const done = foundHere.length === PRAYERS.length;

    const applyTheta = useCallback(
        (t: number) => {
            const next = wrap(t);
            setTheta(next);
            const hit = markers.find((m) => gap(m.t, next) < HIT);
            if (!hit) return;
            setFound((prev) => {
                const list = prev[sceneId] ?? [];
                if (list.includes(hit.id)) return prev;
                const updated = [...list, hit.id];
                if (updated.length === PRAYERS.length) setBurst((b) => b + 1);
                return { ...prev, [sceneId]: updated };
            });
        },
        [markers, sceneId]
    );

    const fromPointer = useCallback(
        (clientX: number, clientY: number) => {
            const svg = svgRef.current;
            if (!svg) return;
            const box = svg.getBoundingClientRect();
            const px = ((clientX - box.left) / box.width) * VW;
            const py = ((clientY - box.top) / box.height) * VH;
            const angle = Math.atan2(-(px - CX) / RX, (py - centerY) / ry);
            applyTheta(angle / TAU);
        },
        [applyTheta, centerY, ry]
    );

    const handleReset = () => {
        setFound((prev) => ({ ...prev, [sceneId]: [] }));
        setTheta(0.25);
    };

    const selectScene = (id: string) => {
        setSceneId(id);
        setTheta(0.25);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Dra sola langs banen. Stopp der den treffer en av de fem ringene.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4 flex flex-wrap gap-2">
                {SCENES.map((s) => {
                    const selected = s.id === sceneId;
                    return (
                        <motion.button
                            key={s.id}
                            onClick={() => selectScene(s.id)}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border ${
                                selected
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            {s.place} {s.when}
                            {(found[s.id] ?? []).length === PRAYERS.length && (
                                <Check className="w-3.5 h-3.5" />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-5 pt-3">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${VW} ${VH}`}
                    className="w-full rounded-xl border border-slate-200 touch-none select-none cursor-grab active:cursor-grabbing"
                    tabIndex={0}
                    role="slider"
                    aria-label="Solas plass på himmelen"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(theta * 100)}
                    onPointerDown={(e) => {
                        dragging.current = true;
                        e.currentTarget.setPointerCapture(e.pointerId);
                        fromPointer(e.clientX, e.clientY);
                    }}
                    onPointerMove={(e) => {
                        if (dragging.current) fromPointer(e.clientX, e.clientY);
                    }}
                    onPointerUp={() => {
                        dragging.current = false;
                    }}
                    onPointerCancel={() => {
                        dragging.current = false;
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                            e.preventDefault();
                            applyTheta(theta + 0.004);
                        }
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            applyTheta(theta - 0.004);
                        }
                    }}
                >
                    <rect x="0" y="0" width={VW} height={VH} fill="#e0f2fe" />
                    <motion.rect
                        x="0"
                        y="0"
                        width={VW}
                        height={VH}
                        fill="#e9e5fb"
                        animate={{ opacity: 1 - dayness }}
                        transition={{ duration: 0.25 }}
                    />
                    <rect x="0" y={HORIZON} width={VW} height={VH - HORIZON} fill="#f1f5f9" />
                    <line
                        x1="0"
                        y1={HORIZON}
                        x2={VW}
                        y2={HORIZON}
                        stroke="#94a3b8"
                        strokeWidth="2"
                    />
                    <text x="14" y={HORIZON + 22} fill="#64748b" fontSize="13">
                        horisonten
                    </text>
                    <text x={CX - RX - 34} y={HORIZON - 10} fill="#64748b" fontSize="13">
                        øst
                    </text>
                    <text x={CX + RX + 8} y={HORIZON - 10} fill="#64748b" fontSize="13">
                        vest
                    </text>

                    <ellipse
                        cx={CX}
                        cy={centerY}
                        rx={RX}
                        ry={ry}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="2"
                        strokeDasharray="5 7"
                    />
                    <path d={dayPath} fill="none" stroke="#fbbf24" strokeWidth="3" />

                    {markers.map((m) => {
                        const p = posOf(m.t);
                        const isFound = foundHere.includes(m.id);
                        const isActive = active?.id === m.id;
                        return (
                            <g key={m.id}>
                                <motion.circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isActive ? 12 : 9}
                                    fill={isFound ? '#4f46e5' : '#ffffff'}
                                    stroke={isFound ? '#4f46e5' : '#94a3b8'}
                                    strokeWidth="2.5"
                                    strokeDasharray={m.estimated ? '4 4' : undefined}
                                    animate={{ scale: isActive ? 1.15 : 1 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                                />
                                {isFound && (
                                    <motion.path
                                        d={`M ${p.x - 4.5} ${p.y} l 3.2 3.4 l 6 -6.6`}
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth="2.4"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </g>
                        );
                    })}

                    <motion.g
                        animate={{ x: sun.x, y: sun.y }}
                        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                    >
                        <motion.circle
                            r="24"
                            fill="#fbbf24"
                            animate={{ opacity: 0.18 + dayness * 0.22 }}
                        />
                        <circle r="13" fill="#f59e0b" stroke="#ffffff" strokeWidth="3" />
                    </motion.g>

                    <AnimatePresence>
                        {burst > 0 && done && (
                            <motion.g key={burst}>
                                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <motion.line
                                        key={i}
                                        x1={CX}
                                        y1={centerY}
                                        x2={CX + Math.cos((i / 8) * TAU) * (RX * 0.5)}
                                        y2={centerY + Math.sin((i / 8) * TAU) * (ry + 70)}
                                        stroke="#fbbf24"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0, opacity: 0.9 }}
                                        animate={{ pathLength: 1, opacity: 0 }}
                                        transition={{ duration: 0.9, delay: i * 0.03 }}
                                    />
                                ))}
                            </motion.g>
                        )}
                    </AnimatePresence>
                </svg>
            </div>

            <div className="px-5 pt-3">
                <div className="min-h-[74px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <AnimatePresence mode="wait">
                        {activePrayer ? (
                            <motion.div
                                key={activePrayer.id + sceneId}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <p className="font-semibold text-slate-800">
                                    {activePrayer.name}
                                    <span className="ml-2 font-normal text-amber-600 text-sm">
                                        {activePrayer.cue}
                                    </span>
                                </p>
                                <p className="text-sm text-slate-600 mt-0.5">
                                    {activePrayer.blurb}
                                    {active?.estimated && ' Her er tida regnet ut, ikke sett.'}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.p
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm text-slate-500"
                            >
                                Ingen bønnetid akkurat her. Flytt sola videre langs banen, og se
                                hvor ringene ligger.
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {scene.note && (
                <div className="px-5 pt-3">
                    <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        {scene.note}
                    </p>
                </div>
            )}

            <div className="px-5 pt-3 flex flex-wrap items-center gap-2">
                {PRAYERS.map((p) => {
                    const isFound = foundHere.includes(p.id);
                    return (
                        <motion.span
                            key={p.id}
                            animate={{ scale: isFound ? 1 : 0.97 }}
                            className={`rounded-full border px-3 py-1 text-sm font-medium ${
                                isFound
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-white border-slate-200 text-slate-400'
                            }`}
                        >
                            {p.name}
                        </motion.span>
                    );
                })}
                <button
                    onClick={handleReset}
                    className="ml-auto flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>

            <AnimatePresence>
                {done && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        className="mx-5 mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    >
                        <Check className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>
                            Alle fem funnet i {scene.place} {scene.when}. Legg merke til at ringene
                            ikke ligger på faste klokkeslett. De sitter fast i solas bane, og
                            flytter seg når banen gjør det. Prøv et annet sted og en annen årstid.
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="px-5 py-3 text-sm text-slate-500">
                Funnet {foundHere.length} av {PRAYERS.length} bønnetider i {scene.place}{' '}
                {scene.when}
            </p>
        </div>
    );
}
