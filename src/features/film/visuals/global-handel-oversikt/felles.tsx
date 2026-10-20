import { motion } from 'framer-motion';

/** Overskrift øverst i midten av bildet, over 3D-lerretet. */
export function Merkelapp({ tekst, tone = 'lys' }: { tekst: string; tone?: 'lys' | 'rod' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                tone === 'rod' ? 'bg-red-600 text-white' : 'bg-white/90 text-slate-900'
            }`}
        >
            {tekst}
        </motion.div>
    );
}
