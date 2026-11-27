import { motion } from 'framer-motion';

/** Felles biter for Ukraina-filmen: merkelappen øverst i bildet. */

export function Brikke({
    tekst,
    farge,
    forsinkelse = 0.4,
}: {
    tekst: string;
    farge?: 'rod' | 'mork' | 'gul';
    forsinkelse?: number;
}) {
    const stil =
        farge === 'rod'
            ? 'bg-red-700 text-white'
            : farge === 'mork'
              ? 'bg-slate-900/90 text-white'
              : farge === 'gul'
                ? 'bg-yellow-300 text-slate-900'
                : 'bg-white/95 text-slate-900';
    return (
        <div
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: '5%' }}
        >
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: forsinkelse }}
                className={`px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl text-center ${stil}`}
                style={{ maxWidth: '88%' }}
            >
                {tekst}
            </motion.div>
        </div>
    );
}
