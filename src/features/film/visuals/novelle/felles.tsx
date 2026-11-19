import { motion } from 'framer-motion';

/**
 * Merkelapp i SVG for novelle-filmen: et avrundet kort med tekst. Bredden regnes ut fra
 * teksten (ca. 0,6 x skriftstørrelse per tegn), så teksten ikke renner ut av kortet.
 */
export function Merke({
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
    const b = tekst.length * fs * 0.6 + fs * 1.3;
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

/** Tekst som toner inn. Bare opacity animeres på SVG-tekst (lærdom 10). */
export function Tekst({
    x,
    y,
    children,
    fs = 40,
    farge = '#0f172a',
    vekt = 800,
    anker = 'middle',
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    children: string;
    fs?: number;
    farge?: string;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
    forsinkelse?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={fs}
            fontWeight={vekt}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            {children}
        </motion.text>
    );
}
