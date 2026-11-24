import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** SVG-flate i 16:9 som 2D-visualene i filmen tegner på. */
export function Flate({
    children,
    bakgrunn = '#f4efe6',
}: {
    children: ReactNode;
    bakgrunn?: string;
}) {
    return (
        <div className="absolute inset-0" style={{ background: bakgrunn }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    <marker
                        id="ledelse-pil"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                    </marker>
                </defs>
                {children}
            </svg>
        </div>
    );
}

/** Viser innholdet fra en beat, og fjerner det helt når det er skjult. */
export function Vis({
    nar,
    children,
    forsinkelse = 0,
}: {
    nar: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    if (!nar) return null;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

/** Dempet eller fullt synlig, uten å fjerne innholdet. */
export function Demp({ lys, children }: { lys: boolean; children: ReactNode }) {
    return (
        <motion.g
            initial={false}
            animate={{ opacity: lys ? 1 : 0.28 }}
            transition={{ duration: 0.5 }}
        >
            {children}
        </motion.g>
    );
}

/** En enkel menneskefigur. Føttene står på (x, y). */
export function Figur({
    x,
    y,
    farge = '#334155',
    skala = 1,
    hode = '#e0b98a',
}: {
    x: number;
    y: number;
    farge?: string;
    skala?: number;
    hode?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-118} r={26} fill={hode} />
            <path d="M -36 -88 Q 0 -100 36 -88 L 44 0 L -44 0 Z" fill={farge} />
        </g>
    );
}

/** Tekst på et kort. Bredden regnes ut fra teksten, så den aldri flyter ut. */
export function Kort({
    x,
    y,
    tekst,
    str = 34,
    farge = '#0f172a',
    bakgrunn = '#ffffff',
    kant,
    vekt = 800,
}: {
    x: number;
    y: number;
    tekst: string;
    str?: number;
    farge?: string;
    bakgrunn?: string;
    kant?: string;
    vekt?: number;
}) {
    const b = Math.round(tekst.length * str * 0.62 + str * 1.4);
    const h = Math.round(str * 1.9);
    return (
        <g>
            <rect
                x={x - b / 2}
                y={y - h / 2}
                width={b}
                height={h}
                rx={h / 2.6}
                fill={bakgrunn}
                stroke={kant}
                strokeWidth={kant ? 4 : 0}
            />
            <text
                x={x}
                y={y + str * 0.36}
                textAnchor="middle"
                fontSize={str}
                fontWeight={vekt}
                fill={farge}
            >
                {tekst}
            </text>
        </g>
    );
}

/** Overskrift øverst i bildet. */
export function Overskrift({ children }: { children: ReactNode }) {
    return (
        <text x={800} y={78} textAnchor="middle" fontSize={50} fontWeight={900} fill="#0f172a">
            {children}
        </text>
    );
}
