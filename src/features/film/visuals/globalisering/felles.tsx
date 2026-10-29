import { motion } from 'framer-motion';

/** Merkelapper for Globalisering-filmen. */

/** Overskrift øverst i midten av bildet, over lerretet. */
export function Overskrift({ tekst, tone = 'lys' }: { tekst: string; tone?: 'lys' | 'rod' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                tone === 'rod' ? 'bg-red-600 text-white' : 'bg-white/90 text-slate-900'
            }`}
        >
            {tekst}
        </motion.div>
    );
}

/** Liten merkelapp som henger ved et punkt i 3D (brukes inne i drei-`<Html>`). */
export function Skilt({ tekst, farge = '#0f172a' }: { tekst: string; farge?: string }) {
    return (
        <div
            className="px-3 py-1 rounded-xl bg-white/95 shadow-lg font-bold text-xl whitespace-nowrap"
            style={{ color: farge, borderLeft: `6px solid ${farge}` }}
        >
            {tekst}
        </div>
    );
}
