import { motion } from 'framer-motion';

/**
 * Felles biter for Russland-filmen: merkelappen øverst i bildet og gassen som renner i et rør.
 * Gassen er en CSS-animasjon, så den fryser når filmen står på pause.
 */

export const RUSSLAND_ROD = '#b91c1c';
export const GASS = '#f59e0b';

export function Brikke({
    tekst,
    farge,
    forsinkelse = 0.4,
}: {
    tekst: string;
    farge?: 'rod' | 'mork';
    forsinkelse?: number;
}) {
    const stil =
        farge === 'rod'
            ? 'bg-red-700 text-white'
            : farge === 'mork'
              ? 'bg-slate-900/90 text-white'
              : 'bg-white/95 text-slate-900';
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: forsinkelse }}
            className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl whitespace-nowrap ${stil}`}
        >
            {tekst}
        </motion.div>
    );
}

/** Keyframes for gass som renner. Legges én gang inne i SVG-en. */
export function GassStil() {
    return (
        <style>{`@keyframes russland-gass { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -60; } }`}</style>
    );
}

/** Et rør (tykk mørk linje) med gass som renner i (stiplet, lys linje). */
export function GassRor({
    d,
    playing,
    farge = GASS,
    stoppet,
    bredde = 14,
    forsinkelse = 0,
}: {
    d: string;
    playing: boolean;
    farge?: string;
    stoppet?: boolean;
    bredde?: number;
    forsinkelse?: number;
}) {
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke="#1e293b"
                strokeWidth={bredde}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d={d}
                fill="none"
                stroke={stoppet ? '#64748b' : farge}
                strokeWidth={bredde * 0.5}
                strokeLinecap="round"
                strokeDasharray="22 38"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.3 }}
                style={{
                    animation: 'russland-gass 1.1s linear infinite',
                    animationPlayState: playing && !stoppet ? 'running' : 'paused',
                }}
            />
        </g>
    );
}
