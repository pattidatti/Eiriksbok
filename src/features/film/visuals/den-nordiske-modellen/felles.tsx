import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Felles biter for visualene i filmen om den nordiske modellen. */

export const FARGE = {
    bakgrunn: '#f4f1ea',
    blekk: '#1e293b',
    gra: '#64748b',
    blek: '#e2e8f0',
    norge: '#0d9488',
    usa: '#b91c1c',
    gull: '#ca8a04',
    bla: '#2563eb',
    rod: '#dc2626',
} as const;

/** Overskrift øverst i bildet (på Flate, 1000x562). Bytter tekst med en myk overgang. */
export function Overskrift({ tekst }: { tekst: string | null }) {
    return (
        <div
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: 12, zIndex: 20 }}
        >
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="px-5 py-1.5 rounded-2xl bg-white/95 shadow-lg font-black text-slate-900"
                        style={{ fontSize: 26 }}
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Viser barna fra en gitt beat. Skjult innhold tas helt bort. */
export function Vis({
    nar,
    children,
    forsinkelse = 0,
    className,
    style,
}: {
    nar: boolean;
    children: ReactNode;
    forsinkelse?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    if (!nar) return null;
    return (
        <motion.div
            className={className}
            style={style}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: forsinkelse }}
        >
            {children}
        </motion.div>
    );
}
