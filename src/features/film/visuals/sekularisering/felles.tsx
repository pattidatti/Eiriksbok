import { AnimatePresence, motion } from 'framer-motion';

/** Overskrift øverst i midten som bytter med beaten. */
export function SekOverskrift({ tekst, mork = false }: { tekst: string; mork?: boolean }) {
    return (
        <div className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none">
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

const TONE = {
    vanlig: 'bg-white/95 text-slate-900',
    gull: 'bg-amber-100 text-amber-900 border-2 border-amber-500',
    rod: 'bg-red-50 text-red-800 border-2 border-red-500',
    gronn: 'bg-teal-50 text-teal-900 border-2 border-teal-500',
    mork: 'bg-slate-900/85 text-white',
} as const;

/** Skilt som henger over en bygning eller en figur (brukes i drei-Html). */
export function SekSkilt({ tekst, tone = 'vanlig' }: { tekst: string; tone?: keyof typeof TONE }) {
    return (
        <div
            className={`px-4 py-2 rounded-xl shadow-lg text-2xl font-extrabold whitespace-nowrap ${TONE[tone]}`}
        >
            {tekst}
        </div>
    );
}
