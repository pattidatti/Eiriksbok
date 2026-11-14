import { AnimatePresence, motion } from 'framer-motion';

/** Omtrentlig bredde på en tekstlinje i SVG-enheter. */
function bredde(tekst: string, storrelse: number) {
    return tekst.length * storrelse * 0.6;
}

/** Overskrift øverst i en SVG på 1600x900. */
export function Overskrift({ tekst }: { tekst: string }) {
    const b = bredde(tekst, 46) + 80;
    return (
        <AnimatePresence mode="wait">
            <motion.g key={tekst} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <rect x={800 - b / 2} y={28} width={b} height={80} rx={22} fill="#ffffff" opacity={0.97} />
                <text x={800} y={83} textAnchor="middle" fontSize={46} fontWeight={800} fill="#0f172a">
                    {tekst}
                </text>
            </motion.g>
        </AnimatePresence>
    );
}

/** Kort med en eller to linjer, midtstilt på x. Bredden følger teksten. */
export function Kort({
    x,
    y,
    tittel,
    tekst,
    farge = '#334155',
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    tittel: string;
    tekst?: string;
    farge?: string;
    forsinkelse?: number;
}) {
    const b = Math.max(bredde(tittel, 34), tekst ? bredde(tekst, 27) : 0) + 56;
    const h = tekst ? 104 : 66;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: forsinkelse }}>
            <rect x={x - b / 2} y={y} width={b} height={h} rx={18} fill="#ffffff" stroke={farge} strokeWidth={4} />
            <text x={x} y={y + 45} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                {tittel}
            </text>
            {tekst && (
                <text x={x} y={y + 85} textAnchor="middle" fontSize={27} fontWeight={600} fill="#475569">
                    {tekst}
                </text>
            )}
        </motion.g>
    );
}

/** En enkel person: hode og kropp. (x, y) er føttene. */
export function Figur({ x, y, farge, skala = 1, hud = '#e8b48c' }: { x: number; y: number; farge: string; skala?: number; hud?: string }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-112} r={26} fill={hud} />
            <path d="M -36 0 L -36 -52 Q -36 -82 0 -82 Q 36 -82 36 -52 L 36 0 Z" fill={farge} />
        </g>
    );
}

/** En domstol-bygning med søyler. (x, y) er midten av bunnen. */
export function Domhus({ x, y, b, farge, tak = '#475569' }: { x: number; y: number; b: number; farge: string; tak?: string }) {
    const h = b * 0.62;
    const soyler = 4;
    return (
        <g>
            <rect x={x - b / 2} y={y - h * 0.12} width={b} height={h * 0.12} fill={tak} />
            {Array.from({ length: soyler }, (_, i) => {
                const sx = x - b / 2 + b * 0.14 + (i * (b * 0.72)) / (soyler - 1);
                return <rect key={i} x={sx - b * 0.05} y={y - h * 0.72} width={b * 0.1} height={h * 0.6} fill={farge} />;
            })}
            <rect x={x - b / 2} y={y - h * 0.82} width={b} height={h * 0.1} fill={tak} />
            <path d={`M ${x - b / 2 - b * 0.04} ${y - h * 0.82} L ${x} ${y - h} L ${x + b / 2 + b * 0.04} ${y - h * 0.82} Z`} fill={tak} />
        </g>
    );
}

/** Rødt kryss i en hvit sirkel. */
export function Kryss({ x, y, r = 26 }: { x: number; y: number; r?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <circle cx={x} cy={y} r={r + 8} fill="#ffffff" stroke="#dc2626" strokeWidth={5} />
            <line x1={x - r * 0.6} y1={y - r * 0.6} x2={x + r * 0.6} y2={y + r * 0.6} stroke="#dc2626" strokeWidth={9} strokeLinecap="round" />
            <line x1={x + r * 0.6} y1={y - r * 0.6} x2={x - r * 0.6} y2={y + r * 0.6} stroke="#dc2626" strokeWidth={9} strokeLinecap="round" />
        </motion.g>
    );
}

/** Grønn hake i en hvit sirkel. */
export function Hake({ x, y, r = 26 }: { x: number; y: number; r?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <circle cx={x} cy={y} r={r + 8} fill="#ffffff" stroke="#16a34a" strokeWidth={5} />
            <path
                d={`M ${x - r * 0.6} ${y} L ${x - r * 0.15} ${y + r * 0.5} L ${x + r * 0.65} ${y - r * 0.5}`}
                fill="none"
                stroke="#16a34a"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </motion.g>
    );
}
