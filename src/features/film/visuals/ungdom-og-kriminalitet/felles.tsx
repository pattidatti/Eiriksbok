import { AnimatePresence, motion } from 'framer-motion';
import { FARGE, bredde } from './maal';

/** Overskrift øverst i en SVG på 1600x900. */
export function Overskrift({ tekst }: { tekst: string }) {
    const b = bredde(tekst, 46) + 70;
    return (
        <AnimatePresence mode="wait">
            <motion.g
                key={tekst}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
                <rect
                    x={800 - b / 2}
                    y={26}
                    width={b}
                    height={78}
                    rx={20}
                    fill="#ffffff"
                    opacity={0.97}
                />
                <text
                    x={800}
                    y={80}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={800}
                    fill={FARGE.blekk}
                >
                    {tekst}
                </text>
            </motion.g>
        </AnimatePresence>
    );
}

/** Et kort med tittel og valgfri undertekst. Bredden følger teksten. */
export function Kort({
    x,
    y,
    tittel,
    tekst,
    farge,
    fs = 34,
    fokus = false,
    stiplet = false,
    hoyre = false,
}: {
    x: number;
    y: number;
    tittel: string;
    tekst?: string;
    farge: string;
    fs?: number;
    fokus?: boolean;
    stiplet?: boolean;
    /** x er høyre kant i stedet for venstre. */
    hoyre?: boolean;
}) {
    const ts = Math.max(26, Math.round(fs * 0.8));
    const b = Math.max(bredde(tittel, fs), tekst ? bredde(tekst, ts) : 0) + 56;
    const h = tekst ? fs + ts + 44 : fs + 34;
    const x0 = hoyre ? x - b : x;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <rect
                x={x0}
                y={y}
                width={b}
                height={h}
                rx={18}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={fokus ? 7 : 4}
                strokeDasharray={stiplet ? '14 10' : undefined}
            />
            <text x={x0 + 28} y={y + fs + 10} fontSize={fs} fontWeight={800} fill={FARGE.blekk}>
                {tittel}
            </text>
            {tekst && (
                <text
                    x={x0 + 28}
                    y={y + fs + ts + 22}
                    fontSize={ts}
                    fontWeight={700}
                    fill="#334155"
                >
                    {tekst}
                </text>
            )}
        </motion.g>
    );
}

/** Et rødt kryss. */
export function Kryss({ x, y, r = 24 }: { x: number; y: number; r?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <circle cx={x} cy={y} r={r + 8} fill="#ffffff" stroke={FARGE.rod} strokeWidth={5} />
            <line
                x1={x - r * 0.6}
                y1={y - r * 0.6}
                x2={x + r * 0.6}
                y2={y + r * 0.6}
                stroke={FARGE.rod}
                strokeWidth={8}
                strokeLinecap="round"
            />
            <line
                x1={x + r * 0.6}
                y1={y - r * 0.6}
                x2={x - r * 0.6}
                y2={y + r * 0.6}
                stroke={FARGE.rod}
                strokeWidth={8}
                strokeLinecap="round"
            />
        </motion.g>
    );
}

/** Et grønt hakk. */
export function Hakk({ x, y, r = 22 }: { x: number; y: number; r?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <circle cx={x} cy={y} r={r} fill={FARGE.gronn} />
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

/** En enkel person sett forfra, med føttene i (x, y). */
export function Person({
    x,
    y,
    farge,
    s = 1,
}: {
    x: number;
    y: number;
    farge: string;
    s?: number;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-128} r={26} fill="#f1c9a5" />
            <rect x={-30} y={-98} width={60} height={70} rx={22} fill={farge} />
            <rect x={-24} y={-36} width={20} height={36} rx={8} fill="#334155" />
            <rect x={4} y={-36} width={20} height={36} rx={8} fill="#334155" />
        </g>
    );
}

/** En mappe: «saken» som flytter seg gjennom systemet. */
export function Mappe({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M -60 -40 L -20 -40 L -8 -52 L 60 -52 L 60 40 L -60 40 Z"
                fill="#fbbf24"
                stroke="#b45309"
                strokeWidth={4}
            />
            <rect
                x={-60}
                y={-34}
                width={120}
                height={74}
                rx={4}
                fill="#fcd34d"
                stroke="#b45309"
                strokeWidth={4}
            />
            <text x={0} y={14} textAnchor="middle" fontSize={28} fontWeight={800} fill="#78350f">
                Saken
            </text>
        </g>
    );
}
