import { AnimatePresence, motion } from 'framer-motion';

/** Overskriften øverst i midten, som bytter med beaten. Felles for filmens 2D-visualer. */
export function Overskrift({
    tekst,
    farge = 'bg-white/90 text-slate-900',
}: {
    tekst: string;
    farge?: string;
}) {
    return (
        <div className="absolute top-[6%] inset-x-0 flex justify-center pointer-events-none z-10">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`px-6 py-2 rounded-2xl font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap ${farge}`}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
