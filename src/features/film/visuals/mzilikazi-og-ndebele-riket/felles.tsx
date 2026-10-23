import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Felles for visualene i Mzilikazi-filmen: overskrift øverst og et kort nede i hjørnet. */

/** Overskrift øverst i midten, byttes per beat. */
export function Overskrift({ tekst }: { tekst: string | null }) {
    return (
        <AnimatePresence mode="wait">
            {tekst && (
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Stort tall eller ord med en linje under, nede til høyre. */
export function Kort({
    nokkel,
    linjer,
    children,
}: {
    nokkel: string;
    linjer: [string, string] | null;
    children?: ReactNode;
}) {
    return (
        <AnimatePresence>
            {linjer && (
                <motion.div
                    key={nokkel}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute right-[4%] bottom-[7%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                    style={{ maxWidth: 440 }}
                >
                    <div className="text-4xl font-black text-slate-900">{linjer[0]}</div>
                    <div className="text-xl font-semibold text-slate-600">{linjer[1]}</div>
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
