import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Felles biter for Nav-filmens visualer: overskriften øverst og små merker.
 * Alt er tegnet for flaten på 1000x562 (se `Flate` i ../shared).
 */

/** Overskriften øverst i midten. Bytter med en myk overgang når teksten endres. */
export function NavOverskrift({ tekst }: { tekst: string }) {
    return (
        <div
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: 16 }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-5 py-2 rounded-2xl bg-white text-slate-900 font-display font-bold shadow-xl whitespace-nowrap"
                    style={{ fontSize: 28 }}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Et lite kort som tones inn. Returnerer null når det er skjult. */
export function NavMerke({
    synlig,
    children,
    style,
    farge = '#0f172a',
    forsinkelse = 0.3,
}: {
    synlig: boolean;
    children: ReactNode;
    style: CSSProperties;
    farge?: string;
    forsinkelse?: number;
}) {
    if (!synlig) return null;
    return (
        <div className="absolute pointer-events-none" style={style}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: forsinkelse }}
                className="px-4 py-2 rounded-xl text-white font-bold shadow-xl"
                style={{ background: farge, fontSize: 20, lineHeight: 1.2 }}
            >
                {children}
            </motion.div>
        </div>
    );
}
