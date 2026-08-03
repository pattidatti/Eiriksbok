import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, ArrowRight, ShieldCheck, RotateCcw } from 'lucide-react';

interface RidderMotLangbueProps {
    title?: string;
}

// Lyspaere-oeyeblikket:
// "Det var ikke ett supervaapen, men MENGDEN. Tusenvis av billige piler fra
//  langbuen stoppet den dyre, pansrede ridderen langt unna - og det avsluttet
//  riddernes tid."
//
// Eleven drar en enkel spak: antall bueskyttere. Jo flere, desto tettere pilregn
// og desto lenger unna stanser ridderangrepet. Ved en terskel bryter angrepet
// sammen og vi feirer innsikten.

const THRESHOLD = 1000; // bueskyttere som trengs for aa stanse angrepet
const MAX_ARCHERS = 5000;

export function RidderMotLangbue({ title = 'Langbuen mot ridderen' }: RidderMotLangbueProps) {
    const [archers, setArchers] = useState(80);

    const stopped = archers >= THRESHOLD;

    // Hvor langt fra den engelske linja stanser ridderen.
    // Faa skyttere: rytteren naar helt fram (lav prosent fra venstre).
    // Mange skyttere: rytteren stanses langt ute (hoey prosent fra venstre).
    const frac = Math.min(1, archers / THRESHOLD);
    const knightLeft = 16 + frac * 56; // 16% (bryter gjennom) -> 72% (stanset langt ute)
    const stopMeters = Math.round(20 + frac * 230); // pedagogisk "meter unna"

    // Antall synlige piler = piltetthet (maks 22, holdes lett for Chromebook).
    const arrowCount = Math.max(2, Math.min(22, Math.round(archers / 230)));
    const arrows = useMemo(
        () =>
            Array.from({ length: arrowCount }, (_, i) => ({
                id: i,
                top: 12 + (i * 67) % 60,
                delay: (i % 6) * 0.12,
            })),
        [arrowCount]
    );

    const handleReset = () => {
        setArchers(80);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Swords className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Dra spaken: hvor mange bueskyttere trengs for aa stoppe ridderangrepet?
                    </p>
                </div>
            </div>

            {/* Slagmarken */}
            <div className="px-6 pt-5">
                <div className="relative h-44 rounded-xl bg-gradient-to-b from-sky-50 to-emerald-50 border border-slate-200 overflow-hidden">
                    {/* Bakken */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-emerald-100/70" />

                    {/* Engelsk bueskytterlinje til venstre */}
                    <div className="absolute left-2 bottom-9 flex items-end gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-1 h-5 rounded-full bg-amber-700" />
                                <div className="w-3 h-3 rounded-full bg-amber-600" />
                            </div>
                        ))}
                    </div>
                    <div className="absolute left-1 top-2 text-[11px] font-semibold text-amber-800">
                        Engelske langbuer
                    </div>

                    {/* Pilregn */}
                    <AnimatePresence>
                        {arrows.map((a) => (
                            <motion.div
                                key={`${arrowCount}-${a.id}`}
                                className="absolute text-amber-600"
                                style={{ top: `${a.top}%`, left: '10%' }}
                                initial={{ x: 0, opacity: 0 }}
                                animate={{ x: `${Math.max(40, knightLeft * 3)}px`, opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 0.9,
                                    delay: a.delay,
                                    repeat: Infinity,
                                    repeatDelay: 0.15,
                                    ease: 'easeIn',
                                }}
                            >
                                <ArrowRight className="w-4 h-4 -rotate-12" />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Den franske ridderen som angriper fra hoeyre */}
                    <motion.div
                        className="absolute bottom-8 flex flex-col items-center"
                        animate={{ left: `${knightLeft}%`, rotate: stopped ? -14 : 0 }}
                        transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                    >
                        <div className="text-2xl leading-none select-none">🐎</div>
                        <div
                            className={`mt-0.5 h-2 w-10 rounded-full ${
                                stopped ? 'bg-rose-400' : 'bg-slate-400'
                            }`}
                        />
                    </motion.div>

                    {/* Suksessmerke naar angrepet stanser */}
                    <AnimatePresence>
                        {stopped && (
                            <motion.div
                                key="stopmark"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                                className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-700"
                            >
                                <ShieldCheck className="w-4 h-4" /> Angrepet stanset
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Feedback-sone (alltid til stede) */}
            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={stopped ? 'stopped' : 'through'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg text-sm border ${
                            stopped
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                    >
                        {stopped ? (
                            <>
                                <span className="font-bold">{archers} bueskyttere:</span> en storm av
                                piler stanser angrepet rundt {stopMeters} meter unna. Det var ikke ett
                                supervaapen, men mengden. Tusenvis av billige piler felte den dyre,
                                pansrede ridderen. Riddernes tid var forbi.
                            </>
                        ) : (
                            <>
                                <span className="font-bold">{archers} bueskyttere:</span> for faa piler.
                                Rytterne presser gjennom pilregnet og bryter den engelske linja. Dra
                                spaken hoeyere.
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad: spak + tilbakestill */}
            <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold text-slate-500 w-24">Bueskyttere</span>
                    <input
                        type="range"
                        min={20}
                        max={MAX_ARCHERS}
                        step={20}
                        value={archers}
                        onChange={(e) => setArchers(Number(e.target.value))}
                        className="flex-1 accent-indigo-600 cursor-pointer"
                        aria-label="Antall bueskyttere"
                    />
                    <span className="text-sm font-bold text-slate-700 w-16 text-right tabular-nums">
                        {archers}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                        Terskel for aa stanse angrepet: ca. {THRESHOLD} skyttere
                    </span>
                    <button
                        onClick={handleReset}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Tilbakestill
                    </button>
                </div>
            </div>
        </div>
    );
}
