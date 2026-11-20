import type { ReactNode } from 'react';
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
                        mork ? 'bg-slate-900/85 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Kort nederst i bildet, sentrert. Bytter innhold med nøkkelen. */
export function BunnKort({ id, children }: { id: string; children: ReactNode }) {
    return (
        <div className="absolute inset-x-0 bottom-[7%] flex justify-center pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
