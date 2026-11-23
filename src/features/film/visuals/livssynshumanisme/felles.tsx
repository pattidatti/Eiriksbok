import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Overskrift øverst i midten som bytter med beaten. */
export function LivssynOverskrift({ tekst, mork = false }: { tekst: string; mork?: boolean }) {
    return (
        <div className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`px-6 py-3 rounded-2xl shadow-xl text-3xl font-black text-center max-w-[80%] ${
                        mork ? 'bg-slate-900/85 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

const TONE = {
    vanlig: 'bg-white/95 text-slate-900',
    gull: 'bg-amber-100 text-amber-900 border-2 border-amber-500',
    rod: 'bg-red-50 text-red-800 border-2 border-red-500',
    gronn: 'bg-teal-50 text-teal-900 border-2 border-teal-500',
    mork: 'bg-slate-900/85 text-white',
} as const;

export type SkiltTone = keyof typeof TONE;

/** Skilt over en ting i 3D (brukes i drei-Html). */
export function LivssynSkilt({ tekst, tone = 'vanlig' }: { tekst: string; tone?: SkiltTone }) {
    return (
        <div
            className={`px-4 py-2 rounded-xl shadow-lg text-2xl font-extrabold whitespace-nowrap ${TONE[tone]}`}
        >
            {tekst}
        </div>
    );
}

/** Viser en SVG-gruppe fra en beat, med en myk inntoning. Skjult innhold rendres ikke. */
export function Vis({ nar, children }: { nar: boolean; children: ReactNode }) {
    if (!nar) return null;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {children}
        </motion.g>
    );
}

/** Rødt kryss (ved siden av tekst, aldri over). */
export function Kryss({ x, y, s = 22 }: { x: number; y: number; s?: number }) {
    return (
        <g stroke="#dc2626" strokeWidth={s / 2.2} strokeLinecap="round">
            <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} />
            <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} />
        </g>
    );
}

/** Grønn hake. */
export function Hake({ x, y, s = 22 }: { x: number; y: number; s?: number }) {
    return (
        <path
            d={`M ${x - s} ${y} L ${x - s / 3} ${y + s * 0.7} L ${x + s} ${y - s * 0.8}`}
            fill="none"
            stroke="#0d9488"
            strokeWidth={s / 2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
}

/** Enkel menneskefigur i SVG: hode og kropp. (x, y) er føttene. */
export function Person({
    x,
    y,
    h = 160,
    farge = '#334155',
}: {
    x: number;
    y: number;
    h?: number;
    farge?: string;
}) {
    const r = h * 0.13;
    const kropp = h * 0.62;
    return (
        <g>
            <circle cx={x} cy={y - kropp - r * 1.15} r={r} fill={farge} />
            <path
                d={`M ${x - h * 0.2} ${y} L ${x - h * 0.16} ${y - kropp + h * 0.08} Q ${x} ${
                    y - kropp - h * 0.04
                } ${x + h * 0.16} ${y - kropp + h * 0.08} L ${x + h * 0.2} ${y} Z`}
                fill={farge}
            />
        </g>
    );
}
