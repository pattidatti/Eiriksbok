import { motion } from 'framer-motion';

/**
 * En merkelapp i SVG: et avrundet kort med tekst. Bredden regnes ut fra teksten
 * (ca. 0,58 x skriftstørrelse per tegn), så teksten aldri renner ut av kortet.
 */
export function Lapp({
    x,
    y,
    tekst,
    fs = 40,
    fyll = '#ffffff',
    farge = '#0f172a',
    vis = true,
    forsinkelse = 0,
    vekt = 800,
}: {
    x: number;
    y: number;
    tekst: string;
    fs?: number;
    fyll?: string;
    farge?: string;
    vis?: boolean;
    forsinkelse?: number;
    vekt?: number;
}) {
    if (!vis) return null;
    const b = tekst.length * fs * 0.58 + fs * 1.3;
    const h = fs * 1.7;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            <rect x={x - b / 2} y={y - h / 2} width={b} height={h} rx={h / 3} fill={fyll} />
            <text
                x={x}
                y={y + fs * 0.35}
                textAnchor="middle"
                fontSize={fs}
                fontWeight={vekt}
                fill={farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}
