import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Felles biter for 2D-visualene i kommentar-filmen. */

export const SKRIFT = 'Outfit, Inter, sans-serif';

/** Avstand mellom linjene i et kort, som andel av skriftstørrelsen. */
const LINJE = 1.25;

/**
 * Et kort i SVG (flate 1600x900) med én eller flere linjer. Bredden regnes ut fra den lengste
 * linja, så teksten aldri renner ut av kortet. `x` er midten. Null når det er skjult.
 */
export function Kort({
    x,
    y,
    linjer,
    fs = 40,
    fyll = '#ffffff',
    farge = '#0f172a',
    kant,
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
    kant?: string;
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
            <rect
                x={x - b / 2}
                y={y}
                width={b}
                height={h}
                rx={fs * 0.45}
                fill={fyll}
                stroke={kant}
                strokeWidth={kant ? 4 : 0}
            />
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={x}
                    y={y + fs * (0.35 + LINJE * (i + 0.5)) + fs * 0.35}
                    textAnchor="middle"
                    fontSize={fs}
                    fontWeight={vekt}
                    fill={farge}
                    fontFamily={SKRIFT}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

/** Fast SVG-flate på 1600x900 for 2D-visualene. */
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

/** Et rødt kryss, satt ved siden av tekst i stedet for å stryke den over. */
export function Kryss({ x, y, r = 22 }: { x: number; y: number; r?: number }) {
    return (
        <g stroke="#dc2626" strokeWidth={r * 0.35} strokeLinecap="round">
            <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} />
            <line x1={x - r} y1={y + r} x2={x + r} y2={y - r} />
        </g>
    );
}
