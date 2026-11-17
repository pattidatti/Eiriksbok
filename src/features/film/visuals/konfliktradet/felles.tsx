import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FARGE, bredde } from './farger';

/** Overskrift øverst i en SVG på 1600x900. */
export function Overskrift({ tekst }: { tekst: string }) {
    const b = bredde(tekst, 46) + 80;
    return (
        <AnimatePresence mode="wait">
            <motion.g key={tekst} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <rect x={800 - b / 2} y={28} width={b} height={80} rx={22} fill="#ffffff" opacity={0.97} />
                <text x={800} y={83} textAnchor="middle" fontSize={46} fontWeight={800} fill={FARGE.tekst}>
                    {tekst}
                </text>
            </motion.g>
        </AnimatePresence>
    );
}

/** En enkel person i SVG: hode og kropp. (x, y) er føttene. */
export function Figur({ x, y, farge, skala = 1, hud = '#e8b48c' }: { x: number; y: number; farge: string; skala?: number; hud?: string }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-112} r={26} fill={hud} />
            <path d="M -36 0 L -36 -52 Q -36 -82 0 -82 Q 36 -82 36 -52 L 36 0 Z" fill={farge} />
        </g>
    );
}

/** Rødt kryss i en hvit sirkel. */
export function Kryss({ x, y, r = 22 }: { x: number; y: number; r?: number }) {
    return (
        <g>
            <circle cx={x} cy={y} r={r + 8} fill="#ffffff" stroke={FARGE.rod} strokeWidth={5} />
            <line x1={x - r * 0.6} y1={y - r * 0.6} x2={x + r * 0.6} y2={y + r * 0.6} stroke={FARGE.rod} strokeWidth={8} strokeLinecap="round" />
            <line x1={x + r * 0.6} y1={y - r * 0.6} x2={x - r * 0.6} y2={y + r * 0.6} stroke={FARGE.rod} strokeWidth={8} strokeLinecap="round" />
        </g>
    );
}

/** Grønn hake i en hvit sirkel. */
export function Hake({ x, y, r = 22 }: { x: number; y: number; r?: number }) {
    return (
        <g>
            <circle cx={x} cy={y} r={r + 8} fill="#ffffff" stroke={FARGE.gronn} strokeWidth={5} />
            <path
                d={`M ${x - r * 0.6} ${y} L ${x - r * 0.15} ${y + r * 0.5} L ${x + r * 0.65} ${y - r * 0.5}`}
                fill="none"
                stroke={FARGE.gronn}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
    );
}

/** Vis innholdet fra en beat, med en myk inntoning. Skjult innhold rendres ikke. */
export function Vis({ nar, children, forsinkelse = 0 }: { nar: boolean; children: ReactNode; forsinkelse?: number }) {
    if (!nar) return null;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: forsinkelse }}>
            {children}
        </motion.g>
    );
}
