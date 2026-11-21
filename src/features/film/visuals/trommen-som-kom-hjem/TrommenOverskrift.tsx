import { AnimatePresence, motion } from 'framer-motion';

/** Overskriften øverst i midten. Bytter med en myk overgang når teksten endres. */
export function TrommenOverskrift({ tekst, mork = false }: { tekst: string; mork?: boolean }) {
    return (
        <div
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: '3.5%' }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`px-6 py-2.5 rounded-2xl font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap ${
                        mork ? 'bg-slate-900/85 text-amber-50' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
