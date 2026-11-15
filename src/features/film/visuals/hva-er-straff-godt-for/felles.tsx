import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FARGE } from './farger';

/** Felles biter for 2D-visualene i filmen om straff. */

/** Overskriften øverst i midten, skifter med beaten. */
export function Overskrift({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** SVG-flate på 1600x900 med lys bakgrunn. */
export function Svg({ children }: { children: ReactNode }) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-slate-200">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {children}
            </svg>
        </div>
    );
}

/** Kort i SVG: bredden måles ut fra den lengste linja, så teksten aldri flyter ut. */
export function Kort({
    x,
    y,
    tittel,
    tekst,
    farge = FARGE.mork,
    str = 40,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    tittel: string;
    tekst?: string;
    farge?: string;
    str?: number;
    forsinkelse?: number;
}) {
    const liten = Math.round(str * 0.8);
    const b = Math.max(tittel.length * str * 0.58, (tekst?.length ?? 0) * liten * 0.56) + 60;
    const h = tekst ? str + liten + 52 : str + 40;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: forsinkelse }}
        >
            <rect
                x={x - b / 2}
                y={y}
                width={b}
                height={h}
                rx={22}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={5}
            />
            <text
                x={x}
                y={y + str + 14}
                textAnchor="middle"
                fontSize={str}
                fontWeight={800}
                fill={farge}
            >
                {tittel}
            </text>
            {tekst && (
                <text
                    x={x}
                    y={y + str + liten + 30}
                    textAnchor="middle"
                    fontSize={liten}
                    fontWeight={600}
                    fill="#475569"
                >
                    {tekst}
                </text>
            )}
        </motion.g>
    );
}

/** En enkel person: hode og kropp. */
export function Figur({ x, y, farge, s = 1 }: { x: number; y: number; farge: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-120} r={26} fill="#e8b48c" />
            <path
                d="M -40 0 L -40 -60 Q -40 -88 -12 -90 L 12 -90 Q 40 -88 40 -60 L 40 0 Z"
                fill={farge}
            />
        </g>
    );
}

/** Rødt kryss, satt ved siden av noe som ikke gjelder lenger. */
export function Kryss({ x, y, r = 28 }: { x: number; y: number; r?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <circle cx={x} cy={y} r={r + 10} fill="#ffffff" stroke={FARGE.rod} strokeWidth={6} />
            <line
                x1={x - r * 0.6}
                y1={y - r * 0.6}
                x2={x + r * 0.6}
                y2={y + r * 0.6}
                stroke={FARGE.rod}
                strokeWidth={10}
                strokeLinecap="round"
            />
            <line
                x1={x + r * 0.6}
                y1={y - r * 0.6}
                x2={x - r * 0.6}
                y2={y + r * 0.6}
                stroke={FARGE.rod}
                strokeWidth={10}
                strokeLinecap="round"
            />
        </motion.g>
    );
}

/** Pil fra (x1,y1) til (x2,y2). */
export function Pil({
    x1,
    y1,
    x2,
    y2,
    farge = '#475569',
    bredde = 12,
}: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    farge?: string;
    bredde?: number;
}) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const s = bredde * 2.2;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <line
                x1={x1}
                y1={y1}
                x2={x2 - Math.cos(a) * s}
                y2={y2 - Math.sin(a) * s}
                stroke={farge}
                strokeWidth={bredde}
                strokeLinecap="round"
            />
            <path
                d={`M ${x2} ${y2} L ${x2 - Math.cos(a - 0.5) * s * 1.6} ${y2 - Math.sin(a - 0.5) * s * 1.6} L ${x2 - Math.cos(a + 0.5) * s * 1.6} ${y2 - Math.sin(a + 0.5) * s * 1.6} Z`}
                fill={farge}
            />
        </motion.g>
    );
}
