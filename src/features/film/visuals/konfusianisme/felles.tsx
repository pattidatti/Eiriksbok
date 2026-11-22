import { AnimatePresence, motion } from 'framer-motion';

/** Overskrift øverst i midten som bytter med beaten. */
export function Overskrift({ tekst, mork = false }: { tekst: string; mork?: boolean }) {
    return (
        <div className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`px-6 py-3 rounded-2xl shadow-xl text-3xl font-black text-center max-w-[80%] ${
                        mork ? 'bg-stone-900/85 text-amber-50' : 'bg-[#fbf6ea]/95 text-stone-900'
                    }`}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
