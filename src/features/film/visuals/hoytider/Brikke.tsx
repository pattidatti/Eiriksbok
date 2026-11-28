import { AnimatePresence, motion } from 'framer-motion';

/**
 * Overskriftsbrikken øverst i bildet. Den ytre boksen sentrerer, så framer-motion ikke
 * skriver over forskyvningen (guiden §3c punkt 30).
 */
export function Brikke({
    tekst,
    nokkel,
    mork = false,
}: {
    tekst: string | null;
    nokkel: string;
    mork?: boolean;
}) {
    return (
        <div className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none">
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={nokkel}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`px-6 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl text-center ${
                            mork ? 'bg-slate-900/85 text-white' : 'bg-white/95 text-slate-900'
                        }`}
                        style={{ maxWidth: '86%' }}
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
