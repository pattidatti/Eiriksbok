import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GeoPath } from 'd3-geo';
import { id } from './data';

/** Felles biter for kartene i filmen om den kalde krigen. */

export const B = 1600;
export const H = 900;
export type LngLat = [number, number];

export const BLA = '#2563eb';
export const ROD = '#dc2626';
export const LAND = '#f1ece0';
export const HAV = '#cfe2ef';

/** Landene. `farge` gir fargen per land-id; fargen glir over når den endres. */
export const Land = memo(function Land({
    geographies,
    sti,
    farge,
    kant = '#b9ad92',
    kantBredde = 1,
}: {
    geographies: unknown[];
    sti: GeoPath;
    farge: (id: string) => string;
    kant?: string;
    kantBredde?: number;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <motion.path
                    key={i}
                    d={sti(g as never) ?? ''}
                    initial={false}
                    animate={{ fill: farge(id(g)) }}
                    transition={{ duration: 0.9 }}
                    stroke={kant}
                    strokeWidth={kantBredde}
                />
            ))}
        </>
    );
});

/** Navn på kartet, med hvit kant så det kan leses oppå alle farger. */
export function Etikett({
    x,
    y,
    tekst,
    synlig = true,
    farge = '#0f172a',
    storrelse = 30,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    synlig?: boolean;
    farge?: string;
    storrelse?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={storrelse / 5}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

/** Overskrift øverst i bildet. Bytter tekst med en myk overgang. */
export function Overskrift({ tekst }: { tekst: string | null }) {
    return (
        <AnimatePresence mode="wait">
            {tekst && (
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45 }}
                    className="absolute left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/95 shadow-xl font-black text-slate-900 whitespace-nowrap"
                    style={{ top: 18, fontSize: 30 }}
                >
                    {tekst}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Pulserende ring som markerer et sted. */
export function Ring({
    x,
    y,
    farge,
    synlig,
}: {
    x: number;
    y: number;
    farge: string;
    synlig: boolean;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.5 }}
        >
            <circle cx={x} cy={y} r={30} fill="none" stroke={farge} strokeWidth={6} />
            <circle cx={x} cy={y} r={11} fill={farge} stroke="#ffffff" strokeWidth={3} />
        </motion.g>
    );
}
