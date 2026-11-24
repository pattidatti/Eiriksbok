import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * DOM-brikker over 3D-lerretet: overskrift øverst i midten og et kort nederst til venstre.
 * Sentreringen ligger i en ytre boks, så framer-motion ikke skriver over den.
 */
export function Overskrift({ tekst, tone = 'lys' }: { tekst: string; tone?: 'lys' | 'rod' }) {
    return (
        <div
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: '5%' }}
        >
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2 }}
                className={`px-6 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl text-center ${
                    tone === 'rod' ? 'bg-red-600 text-white' : 'bg-white/90 text-slate-900'
                }`}
                style={{ maxWidth: '80%' }}
            >
                {tekst}
            </motion.div>
        </div>
    );
}

export function Hjornekort({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute rounded-2xl bg-white/92 shadow-xl px-5 py-3 text-slate-900"
            style={{
                left: '4%',
                bottom: '6%',
                maxWidth: '44%',
                background: 'rgba(255,255,255,0.93)',
            }}
        >
            {children}
        </motion.div>
    );
}
