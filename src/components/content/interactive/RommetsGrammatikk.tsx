import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Compass, DoorOpen, Eye, LandPlot, Users } from 'lucide-react';

// Rommets grammatikk: en enkel plantegning som skifter mellom fem hellige rom.
//
// Poenget eleven skal oppdage: byggene har de samme leddene - en inngang, en plass
// til folket, et sted ordet føres fram, og et punkt blikket trekkes mot - men de
// er ordnet helt ulikt. Der noen setter et bilde, setter andre en bok.
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

interface RomRolle {
    id: string;
    label: string;
    hint?: string;
    icon?: string;
}

interface RomElement {
    name: string;
    text: string;
    x: number;
    y: number;
}

interface RomInnerRom {
    points: number[][];
    label?: string;
    labelAt?: number[];
}

interface RomBygning {
    id: string;
    name: string;
    tradition?: string;
    color: string;
    orientation?: string;
    outline: number[][];
    inner?: RomInnerRom[];
    gaze?: { from: number[]; to: number[] };
    elements: Record<string, RomElement>;
}

interface RommetsGrammatikkProps {
    title?: string;
    intro?: string;
    note?: string;
    roles?: RomRolle[];
    buildings?: RomBygning[];
    defaultBuilding?: string;
}

// Plantegningen er bevisst lav: hele figuren skal få plass i én skjermhøyde ved
// siden av brødteksten på en Chromebook (1366x768), der artikkelspalten er ca.
// 712 px bred. Høyere viewBox = høyere figur, siden svg-en skalerer med bredden.
const VB_W = 640;
const VB_H = 200;
const PAD_X = 30;
const PAD_Y = 18;

const IKONER: Record<string, typeof Eye> = {
    dor: DoorOpen,
    folk: Users,
    bok: BookOpen,
    oye: Eye,
    plass: LandPlot,
};

const px = (x: number) => PAD_X + (x / 100) * (VB_W - 2 * PAD_X);
const py = (y: number) => PAD_Y + (y / 100) * (VB_H - 2 * PAD_Y);
const polygon = (points: number[][]) => points.map((p) => `${px(p[0])},${py(p[1])}`).join(' ');

export function RommetsGrammatikk({
    title = 'Rommets grammatikk',
    intro = 'Velg en bygning og se hvor de samme leddene ligger.',
    note,
    roles = [],
    buildings = [],
    defaultBuilding,
}: RommetsGrammatikkProps) {
    const [aktivId, setAktivId] = useState<string>(defaultBuilding ?? buildings[0]?.id ?? '');

    const aktiv = useMemo(
        () => buildings.find((b) => b.id === aktivId) ?? buildings[0],
        [buildings, aktivId]
    );

    if (!roles.length || !buildings.length || !aktiv) return null;

    const gaze = aktiv.gaze;
    let pil: { x1: number; y1: number; x2: number; y2: number; spiss: string } | null = null;
    if (gaze) {
        const x1 = px(gaze.from[0]);
        const y1 = py(gaze.from[1]);
        const x2 = px(gaze.to[0]);
        const y2 = py(gaze.to[1]);
        const v = Math.atan2(y2 - y1, x2 - x1);
        const a = [x2 - 13 * Math.cos(v - 0.42), y2 - 13 * Math.sin(v - 0.42)];
        const b = [x2 - 13 * Math.cos(v + 0.42), y2 - 13 * Math.sin(v + 0.42)];
        pil = {
            x1,
            y1,
            x2,
            y2,
            spiss: `${x2},${y2} ${a[0]},${a[1]} ${b[0]},${b[1]}`,
        };
    }

    return (
        <figure className="my-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <figcaption className="mb-3">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
                    <LandPlot className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{intro}</p>
            </figcaption>

            <div className="mb-2 flex flex-wrap gap-2">
                {buildings.map((b) => {
                    const valgt = b.id === aktiv.id;
                    return (
                        <button
                            key={b.id}
                            type="button"
                            onClick={() => setAktivId(b.id)}
                            aria-pressed={valgt}
                            className="rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors"
                            style={
                                valgt
                                    ? {
                                          backgroundColor: b.color,
                                          borderColor: b.color,
                                          color: '#fff',
                                      }
                                    : { borderColor: '#cbd5e1', color: '#334155' }
                            }
                        >
                            {b.name}
                        </button>
                    );
                })}
            </div>

            {aktiv.orientation && (
                <p className="mb-2 flex items-center gap-1.5 text-sm text-slate-600">
                    <Compass className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <span className="font-semibold text-slate-800">Retning:</span>
                    {aktiv.orientation}
                </p>
            )}

            <div className="rounded-lg bg-slate-50 p-2">
                <svg
                    viewBox={`0 0 ${VB_W} ${VB_H}`}
                    className="h-auto w-full"
                    role="img"
                    aria-label={`Plantegning av ${aktiv.name}`}
                >
                    <AnimatePresence mode="wait">
                        <motion.g
                            key={aktiv.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            <polygon
                                points={polygon(aktiv.outline)}
                                fill="#ffffff"
                                stroke={aktiv.color}
                                strokeWidth={3}
                                strokeLinejoin="round"
                            />

                            {(aktiv.inner ?? []).map((rom, i) => (
                                <g key={`inner-${i}`}>
                                    <polygon
                                        points={polygon(rom.points)}
                                        fill={aktiv.color}
                                        fillOpacity={0.1}
                                        stroke={aktiv.color}
                                        strokeOpacity={0.5}
                                        strokeWidth={1.5}
                                        strokeDasharray="5 4"
                                    />
                                    {rom.label && rom.labelAt && (
                                        <text
                                            x={px(rom.labelAt[0])}
                                            y={py(rom.labelAt[1])}
                                            textAnchor="middle"
                                            fontSize="12"
                                            fill="#64748b"
                                        >
                                            {rom.label}
                                        </text>
                                    )}
                                </g>
                            ))}

                            {pil && (
                                <g>
                                    {/* opacity settes direkte som startverdi på begge, ellers
                                        tegnes blikk-pila i full styrke i ett bilde før framer
                                        motion rekker å overta attributtet. */}
                                    <motion.line
                                        x1={pil.x1}
                                        y1={pil.y1}
                                        x2={pil.x2}
                                        y2={pil.y2}
                                        stroke={aktiv.color}
                                        strokeWidth={2}
                                        strokeDasharray="6 5"
                                        opacity={0}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.6 }}
                                        transition={{ duration: 0.5, delay: 0.15 }}
                                    />
                                    <motion.polygon
                                        points={pil.spiss}
                                        fill={aktiv.color}
                                        opacity={0}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.6 }}
                                        transition={{ duration: 0.3, delay: 0.45 }}
                                    />
                                </g>
                            )}

                            {roles.map((rolle, i) => {
                                const el = aktiv.elements[rolle.id];
                                if (!el) return null;
                                const cx = px(el.x);
                                const cy = py(el.y);
                                return (
                                    <motion.g
                                        key={rolle.id}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.1 + i * 0.09 }}
                                        style={{ originX: `${cx}px`, originY: `${cy}px` }}
                                    >
                                        <circle cx={cx} cy={cy} r={14} fill={aktiv.color} />
                                        <text
                                            x={cx}
                                            y={cy + 5}
                                            textAnchor="middle"
                                            fontSize="14"
                                            fontWeight="700"
                                            fill="#ffffff"
                                        >
                                            {i + 1}
                                        </text>
                                        <text
                                            x={cx}
                                            y={cy + 30}
                                            textAnchor="middle"
                                            fontSize="13"
                                            fontWeight="600"
                                            fill="#0f172a"
                                        >
                                            {el.name}
                                        </text>
                                    </motion.g>
                                );
                            })}
                        </motion.g>
                    </AnimatePresence>
                </svg>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={aktiv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="mt-3 grid gap-2 sm:grid-cols-2"
                >
                    {roles.map((rolle, i) => {
                        const el = aktiv.elements[rolle.id];
                        if (!el) return null;
                        const Ikon = IKONER[rolle.icon ?? ''] ?? Eye;
                        return (
                            <div
                                key={rolle.id}
                                className="rounded-xl border border-slate-200 bg-white p-3"
                                style={{ borderLeftColor: aktiv.color, borderLeftWidth: 4 }}
                            >
                                <div className="mb-1 flex items-center gap-2">
                                    <span
                                        className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                        style={{ backgroundColor: aktiv.color }}
                                    >
                                        {i + 1}
                                    </span>
                                    <Ikon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                    <span className="text-sm font-bold text-slate-900">
                                        {rolle.label}
                                    </span>
                                    {rolle.hint && (
                                        <span className="text-xs text-slate-500">{rolle.hint}</span>
                                    )}
                                </div>
                                <p className="text-sm leading-snug text-slate-700">{el.text}</p>
                            </div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {note && <p className="mt-3 text-xs italic text-slate-500">{note}</p>}
        </figure>
    );
}
