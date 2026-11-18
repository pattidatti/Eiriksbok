import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Avstand mellom linjene i et kort, som andel av skriftstørrelsen. */
const LINJE = 1.25;

/**
 * Et kort i SVG (flate 1600x900) med én eller flere linjer tekst. Bredden regnes ut fra den
 * lengste linja (ca. 0,58 x skriftstørrelse per tegn), så teksten aldri renner ut av kortet.
 * `x` er midten av kortet. Returnerer null når det er skjult (guiden §3c punkt 53).
 */
export function Kort({
    x,
    y,
    linjer,
    fs = 40,
    fyll = '#ffffff',
    farge = '#0f172a',
    vis = true,
    forsinkelse = 0,
    vekt = 800,
}: {
    x: number;
    y: number;
    linjer: string[];
    fs?: number;
    fyll?: string;
    farge?: string;
    vis?: boolean;
    forsinkelse?: number;
    vekt?: number;
}) {
    if (!vis) return null;
    const lengst = Math.max(...linjer.map((l) => l.length));
    const b = lengst * fs * 0.58 + fs * 1.4;
    const h = fs * (0.75 + linjer.length * LINJE);
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            <rect x={x - b / 2} y={y} width={b} height={h} rx={fs * 0.45} fill={fyll} />
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={x}
                    y={y + fs * (0.35 + LINJE * (i + 0.5)) + fs * 0.35}
                    textAnchor="middle"
                    fontSize={fs}
                    fontWeight={vekt}
                    fill={farge}
                    fontFamily="Outfit, Inter, sans-serif"
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

/** Fast SVG-flate for 2D-visualene i filmen. */
export function Flate16x9({ children, bakgrunn }: { children: ReactNode; bakgrunn: string }) {
    return (
        <div className="absolute inset-0" style={{ background: bakgrunn }}>
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
