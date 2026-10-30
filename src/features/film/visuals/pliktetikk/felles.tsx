import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Felles byggeklosser for 2D-visualene i Pliktetikk-filmen. */

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

/** SVG-flate i 16:9 som alle 2D-visualene tegner på. */
export function Flate({
    children,
    bakgrunn = '#f5efe4',
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
                {children}
            </svg>
        </div>
    );
}

/** En enkel menneskefigur med føttene i (x, y). */
export function Figur({
    x,
    y,
    farge = '#334155',
    skala = 1,
    hud = '#e0b98a',
}: {
    x: number;
    y: number;
    farge?: string;
    skala?: number;
    hud?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-118} r={26} fill={hud} />
            <path d="M -36 -88 Q 0 -100 36 -88 L 44 0 L -44 0 Z" fill={farge} />
        </g>
    );
}

/** Tekst som tones inn og ut. Animerer bare opacity (se guiden §3c punkt 10). */
export function Tekst({
    x,
    y,
    children,
    str = 40,
    farge = '#0f172a',
    vis = true,
    vekt = 800,
    anker = 'middle',
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    children: ReactNode;
    str?: number;
    farge?: string;
    vis?: boolean;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
    forsinkelse?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={vekt}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.5, delay: vis ? forsinkelse : 0 }}
            style={FONT}
        >
            {children}
        </motion.text>
    );
}

/** Bredden et kort trenger for en tekst (ca. 0,55 x skriftstørrelse per tegn). */
function bredde(tekst: string, str: number, luft = 56) {
    return Math.round(tekst.length * str * 0.56 + luft);
}

/** Avrundet kort med én linje tekst, sentrert i (x, y). Bredden følger teksten. */
export function Kort({
    x,
    y,
    tekst,
    vis = true,
    str = 36,
    farge = '#ffffff',
    tekstFarge = '#0f172a',
    kant = '#cbd5e1',
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    tekst: string;
    vis?: boolean;
    str?: number;
    farge?: string;
    tekstFarge?: string;
    kant?: string;
    forsinkelse?: number;
}) {
    const b = bredde(tekst, str);
    const h = str * 2;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.5, delay: vis ? forsinkelse : 0 }}
        >
            <rect
                x={x - b / 2}
                y={y - h / 2}
                width={b}
                height={h}
                rx={h / 3}
                fill={farge}
                stroke={kant}
                strokeWidth={3}
            />
            <text
                x={x}
                y={y + str * 0.35}
                textAnchor="middle"
                fontSize={str}
                fontWeight={800}
                fill={tekstFarge}
                style={FONT}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** Rett pil fra (x1, y1) til (x2, y2). */
export function Pil({
    x1,
    y1,
    x2,
    y2,
    farge = '#334155',
    tykk = 8,
    vis = true,
}: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    farge?: string;
    tykk?: number;
    vis?: boolean;
}) {
    const v = Math.atan2(y2 - y1, x2 - x1);
    const s = tykk * 3;
    const a = `${x2 - Math.cos(v - 0.45) * s},${y2 - Math.sin(v - 0.45) * s}`;
    const b = `${x2 - Math.cos(v + 0.45) * s},${y2 - Math.sin(v + 0.45) * s}`;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.5 }}
        >
            <line
                x1={x1}
                y1={y1}
                x2={x2 - Math.cos(v) * s * 0.6}
                y2={y2 - Math.sin(v) * s * 0.6}
                stroke={farge}
                strokeWidth={tykk}
                strokeLinecap="round"
            />
            <polygon points={`${x2},${y2} ${a} ${b}`} fill={farge} />
        </motion.g>
    );
}

/** Synlig fra en beat: en gruppe som tones inn og ut. */
export function Vis({ vis, children, varighet = 0.5 }: { vis: boolean; children: ReactNode; varighet?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: varighet }}
        >
            {children}
        </motion.g>
    );
}
