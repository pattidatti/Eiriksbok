import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Felles byggeklosser for Sparing-filmens 2D-visualer (SVG på 1600x900). Ikke en visual i
 * seg selv: ingen eksport har samme navn som fila.
 */

export const SARA = '#0d9488';
export const JONAS = '#2563eb';
export const INNSKUDD = '#94a3b8';
export const MORK = '#0f172a';
export const DEMPET = '#475569';

/** SVG-tekst som bare animerer opacity (guiden §3c punkt 10). */
export function Tekst({
    x,
    y,
    vis = true,
    children,
    farge = MORK,
    str = 40,
    vekt = 800,
    anker = 'middle',
}: {
    x: number;
    y: number;
    vis?: boolean;
    children: string;
    farge?: string;
    str?: number;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
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
            transition={{ duration: 0.6 }}
        >
            {children}
        </motion.text>
    );
}

/** En gruppe som tones inn og ut. */
export function Vis({
    vis,
    children,
    forsinkelse = 0,
}: {
    vis: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.6, delay: vis ? forsinkelse : 0 }}
            style={{ pointerEvents: 'none' }}
        >
            {children}
        </motion.g>
    );
}

/** Overskrift øverst i midten, ny tekst per beat. */
export function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.text
                key={tekst}
                x={800}
                y={88}
                textAnchor="middle"
                fontSize={56}
                fontWeight={900}
                fill={MORK}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
                {tekst}
            </motion.text>
        </AnimatePresence>
    );
}

/**
 * Et kort med tekst sentrert på (x, y). Bredden måles ut fra den lengste linja
 * (ca. 0,56 x skriftstørrelse per tegn), så teksten aldri flyter ut av kortet.
 */
export function Kort({
    x,
    y,
    linjer,
    vis = true,
    farge = MORK,
    str = 36,
    ramme,
    fyll = '#ffffff',
}: {
    x: number;
    y: number;
    linjer: string[];
    vis?: boolean;
    farge?: string;
    str?: number;
    ramme?: string;
    fyll?: string;
}) {
    const lengst = Math.max(...linjer.map((l) => l.length));
    const b = lengst * str * 0.56 + 60;
    const linjeH = str * 1.25;
    const h = linjer.length * linjeH + 34;
    return (
        <Vis vis={vis}>
            <rect
                x={x - b / 2}
                y={y - h / 2}
                width={b}
                height={h}
                rx={22}
                fill={fyll}
                stroke={ramme ?? farge}
                strokeWidth={4}
            />
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={x}
                    y={y - h / 2 + 17 + linjeH * (i + 0.78)}
                    textAnchor="middle"
                    fontSize={str}
                    fontWeight={i === 0 ? 900 : 700}
                    fill={i === 0 ? farge : DEMPET}
                >
                    {l}
                </text>
            ))}
        </Vis>
    );
}

/** SVG-flaten alle 2D-visualene tegner på. */
export function Flate2D({
    children,
    bakgrunn = '#f8fafc',
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
