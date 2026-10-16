import { AnimatePresence, motion } from 'framer-motion';
import { TelleTall } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Lofotfisket i tall. «fiskere»: hvor mange som var med, fra 1880 til i dag.
 * «fangst»: hvor mange tonn skrei fiskerne tok i noen utvalgte år.
 * Alle tall står i artikkelen.
 */

type Modus = 'fiskere' | 'fangst';

interface Stolpe {
    etikett: string;
    lav: number;
    hoy: number;
    fraBeat: number;
    farge: string;
}

const DATA: Record<Modus, { maks: number; enhet: string; stolper: Stolpe[] }> = {
    fiskere: {
        maks: 32000,
        enhet: 'fiskere',
        stolper: [
            {
                etikett: '1880-1900, hvert år',
                lav: 30000,
                hoy: 30000,
                fraBeat: 0,
                farge: '#b45309',
            },
            { etikett: '1896', lav: 32000, hoy: 32000, fraBeat: 0, farge: '#92400e' },
            {
                etikett: 'Etter andre verdenskrig',
                lav: 15000,
                hoy: 20000,
                fraBeat: 1,
                farge: '#2563eb',
            },
            { etikett: 'Siden 1990-tallet', lav: 2000, hoy: 4000, fraBeat: 2, farge: '#0d9488' },
        ],
    },
    fangst: {
        maks: 146000,
        enhet: 'tonn skrei',
        stolper: [
            { etikett: '1974', lav: 146000, hoy: 146000, fraBeat: 0, farge: '#0f766e' },
            { etikett: '1988', lav: 18450, hoy: 18450, fraBeat: 1, farge: '#dc2626' },
            { etikett: '2014', lav: 69200, hoy: 69200, fraBeat: 2, farge: '#0f766e' },
        ],
    },
};

const TITTEL: Record<Modus, string> = {
    fiskere: 'Fiskere på Lofotfisket',
    fangst: 'Fangst i Lofoten, tonn',
};

const HOYDE = 230;

export function LofotfisketFangst({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'fiskere';
    const { maks, stolper } = DATA[modus];
    const siste = stolper.reduce((m, s) => (s.fraBeat <= beat ? Math.max(m, s.fraBeat) : m), 0);
    return (
        <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(#dbe6ef, #b9cddd)' }}
        >
            <div className="w-[88%] h-[84%] rounded-3xl bg-white/95 shadow-2xl px-10 pt-6 pb-4 flex flex-col">
                <div className="font-display font-black text-4xl text-slate-900">
                    {TITTEL[modus]}
                </div>
                <div className="relative flex-1 flex items-end justify-around gap-6 mt-2">
                    {stolper.map((s) => {
                        const vis = beat >= s.fraBeat;
                        const fokus = s.fraBeat === siste;
                        const hLav = (s.lav / maks) * HOYDE;
                        const hHoy = (s.hoy / maks) * HOYDE;
                        return (
                            <div key={s.etikett} className="flex flex-col items-center w-48">
                                <div
                                    className="font-black text-3xl tabular-nums mb-2 h-10 whitespace-nowrap"
                                    style={{ color: s.farge, opacity: vis ? 1 : 0 }}
                                >
                                    {vis && (
                                        <>
                                            <TelleTall verdi={s.lav} />
                                            {s.hoy !== s.lav && (
                                                <>
                                                    -<TelleTall verdi={s.hoy} />
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="relative w-28" style={{ height: hHoy || 2 }}>
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 rounded-t-xl opacity-35"
                                        style={{ background: s.farge }}
                                        initial={{ height: 0 }}
                                        animate={{ height: vis ? hHoy : 0 }}
                                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 rounded-t-xl"
                                        style={{
                                            background: s.farge,
                                            boxShadow:
                                                fokus && vis ? `0 0 0 5px ${s.farge}55` : 'none',
                                        }}
                                        initial={{ height: 0 }}
                                        animate={{ height: vis ? hLav : 0 }}
                                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                </div>
                                <div className="h-1 w-40 bg-slate-300" />
                                <div
                                    className="mt-2 text-lg font-bold text-center leading-tight min-h-[2.8rem]"
                                    style={{ color: vis ? '#0f172a' : '#94a3b8' }}
                                >
                                    {s.etikett}
                                </div>
                            </div>
                        );
                    })}
                    {modus === 'fangst' && (
                        <div className="flex flex-col items-center w-48">
                            <AnimatePresence>
                                {beat >= 3 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col items-center mb-8"
                                    >
                                        <svg viewBox="0 0 100 160" className="w-14 h-24">
                                            <path
                                                d="M 50 8 L 50 130 M 18 100 L 50 140 L 82 100"
                                                stroke="#dc2626"
                                                strokeWidth={14}
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <div className="text-2xl font-black text-red-600 text-center leading-tight">
                                            Mindre skrei på innsiden av Lofoten
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="h-1 w-40 bg-slate-300" />
                            <div
                                className="mt-2 text-lg font-bold text-center min-h-[2.8rem]"
                                style={{ color: beat >= 3 ? '#0f172a' : '#94a3b8' }}
                            >
                                De siste årene
                            </div>
                        </div>
                    )}
                    {modus === 'fiskere' && beat >= 3 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-0 top-0 flex flex-row gap-2"
                        >
                            {['Båter med motor', 'Mange bor om bord', 'Rorbuer for turister'].map(
                                (t, i) => (
                                    <motion.div
                                        key={t}
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.5 }}
                                        className="px-3 py-1.5 rounded-xl bg-teal-700 text-white text-lg font-bold shadow-lg"
                                    >
                                        {t}
                                    </motion.div>
                                )
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
