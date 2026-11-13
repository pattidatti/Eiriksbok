import { AnimatePresence, motion } from 'framer-motion';
import { tekstBredde } from './maal';

/** Overskrift øverst i en SVG på 1600x900. Byttes med en myk overgang. */
export function SvgOverskrift({ tekst, y = 78 }: { tekst: string; y?: number }) {
    const b = tekstBredde(tekst, 46) + 70;
    return (
        <AnimatePresence mode="wait">
            <motion.g
                key={tekst}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
                <rect x={800 - b / 2} y={y - 50} width={b} height={78} rx={20} fill="#ffffff" opacity={0.96} />
                <text x={800} y={y + 4} textAnchor="middle" fontSize={46} fontWeight={800} fill="#0f172a">
                    {tekst}
                </text>
            </motion.g>
        </AnimatePresence>
    );
}

/** Et kort med tittel og valgfri undertekst. Bredden følger teksten. */
export function SvgKort({
    x,
    y,
    tittel,
    tekst,
    farge,
    bredde,
    fokus = false,
}: {
    x: number;
    y: number;
    tittel: string;
    tekst?: string;
    farge: string;
    bredde?: number;
    fokus?: boolean;
}) {
    const b =
        bredde ??
        Math.max(tekstBredde(tittel, 36), tekst ? tekstBredde(tekst, 28) : 0) + 60;
    const h = tekst ? 112 : 72;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <rect
                x={x}
                y={y}
                width={b}
                height={h}
                rx={18}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={fokus ? 7 : 4}
            />
            <text x={x + 30} y={y + 48} fontSize={36} fontWeight={800} fill="#0f172a">
                {tittel}
            </text>
            {tekst && (
                <text x={x + 30} y={y + 90} fontSize={28} fontWeight={600} fill="#475569">
                    {tekst}
                </text>
            )}
        </motion.g>
    );
}

/** Et rødt kryss ved siden av noe som ikke skal skje. */
export function Kryss({ x, y, r = 26 }: { x: number; y: number; r?: number }) {
    return (
        <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
            <circle cx={x} cy={y} r={r + 8} fill="#ffffff" stroke="#dc2626" strokeWidth={5} />
            <line x1={x - r * 0.6} y1={y - r * 0.6} x2={x + r * 0.6} y2={y + r * 0.6} stroke="#dc2626" strokeWidth={9} strokeLinecap="round" />
            <line x1={x + r * 0.6} y1={y - r * 0.6} x2={x - r * 0.6} y2={y + r * 0.6} stroke="#dc2626" strokeWidth={9} strokeLinecap="round" />
        </motion.g>
    );
}

/** Et grønt hakk. */
export function Hakk({ x, y, r = 22 }: { x: number; y: number; r?: number }) {
    return (
        <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
            <circle cx={x} cy={y} r={r} fill="#0d9488" />
            <path
                d={`M ${x - r * 0.5} ${y} L ${x - r * 0.1} ${y + r * 0.42} L ${x + r * 0.55} ${y - r * 0.4}`}
                fill="none"
                stroke="#ffffff"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </motion.g>
    );
}

/** Et politiskjold, tegnet rundt (x, y). */
export function Skjold({ x, y, s = 1, farge = '#1e3a8a' }: { x: number; y: number; s?: number; farge?: string }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M 0 -40 L 34 -28 L 30 12 Q 22 34 0 44 Q -22 34 -30 12 L -34 -28 Z" fill={farge} />
            <path d="M 0 -26 L 20 -18 L 17 8 Q 12 22 0 29 Q -12 22 -17 8 L -20 -18 Z" fill="#fbbf24" />
        </g>
    );
}
