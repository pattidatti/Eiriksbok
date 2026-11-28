import { motion } from 'framer-motion';

/** Overskrift øverst i midten av bildet. */
export function Overskrift({ tekst, tone = 'lys' }: { tekst: string; tone?: 'lys' | 'rod' | 'mork' }) {
    const farge =
        tone === 'rod'
            ? 'bg-red-700 text-white'
            : tone === 'mork'
              ? 'bg-slate-900/90 text-white'
              : 'bg-white/95 text-slate-900';
    return (
        <div className="absolute inset-x-0 top-[4.5%] flex justify-center pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2 }}
                className={`px-6 py-2.5 rounded-2xl shadow-xl font-display font-black text-3xl whitespace-nowrap ${farge}`}
            >
                {tekst}
            </motion.div>
        </div>
    );
}
