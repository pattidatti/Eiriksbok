import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * Felles byggeklosser for Budsjett-filmens 2D-visualer. Ikke en visual i seg selv: manuset
 * bruker den aldri (ingen eksport med samme navn som fila).
 */

/** SVG-tekst som bare animerer opacity (guiden §3c punkt 10). */
export function Tekst({
    x,
    y,
    vis = true,
    children,
    farge = '#0f172a',
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
        <motion.text
            key={tekst}
            x={800}
            y={92}
            textAnchor="middle"
            fontSize={58}
            fontWeight={900}
            fill="#0f172a"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {tekst}
        </motion.text>
    );
}
