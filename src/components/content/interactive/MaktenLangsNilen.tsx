import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Check, Crown } from 'lucide-react';

// Lyspære-øyeblikket: etter denne interaksjonen skal eleven forstå at makten
// langs Nilen snudde retning flere ganger - Kusj var ikke bare et land under
// Egypt, men i nesten hundre år satt kusjittiske konger på Egypts trone.

type Ruler = 'egypt' | 'kusj' | 'ingen';

interface NileEra {
    id: string;
    label: string;
    years: string;
    ruler: Ruler;
    headline: string;
    detail: string;
}

interface MaktenLangsNilenProps {
    title?: string;
    subtitle?: string;
    eras?: NileEra[];
    payoff?: string;
}

const RULER_TEXT: Record<Ruler, string> = {
    egypt: 'Egypt styrer Kusj',
    kusj: 'Kusj styrer Egypt',
    ingen: 'Ingen styrer den andre',
};

export function MaktenLangsNilen({
    title = 'Makten langs Nilen',
    subtitle = 'Klikk deg gjennom tidslinja og se hvem som styrte hvem.',
    eras = [],
    payoff = 'Makten langs Nilen gikk begge veier.',
}: MaktenLangsNilenProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [seen, setSeen] = useState<string[]>(eras.length ? [eras[0].id] : []);

    if (eras.length === 0) return null;

    const era = eras[activeIndex];
    const allSeen = seen.length >= eras.length;

    const pick = (index: number) => {
        setActiveIndex(index);
        setSeen((prev) => (prev.includes(eras[index].id) ? prev : [...prev, eras[index].id]));
    };

    const handleReset = () => {
        setActiveIndex(0);
        setSeen([eras[0].id]);
    };

    // Pilen peker nedover (nordfra og sørover) når Egypt styrer, og oppover når
    // Kusj styrer. Ved 'ingen' blir den liggende flat og blek.
    const arrowRotation = era.ruler === 'egypt' ? 90 : era.ruler === 'kusj' ? -90 : 0;
    const arrowColor =
        era.ruler === 'egypt'
            ? 'text-amber-600'
            : era.ruler === 'kusj'
              ? 'text-emerald-600'
              : 'text-slate-300';

    const zoneClass = (side: Ruler) =>
        era.ruler === side
            ? side === 'egypt'
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-emerald-100 border-emerald-300 text-emerald-900'
            : 'bg-slate-50 border-slate-200 text-slate-500';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <ArrowLeftRight className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate: de to landene med pila mellom seg */}
            <div className="px-5 pt-5">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
                    <motion.div
                        animate={{ scale: era.ruler === 'egypt' ? 1.03 : 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className={`rounded-xl border p-3 sm:p-4 text-center transition-colors ${zoneClass('egypt')}`}
                    >
                        <p className="text-[11px] uppercase tracking-wide opacity-70">Nord</p>
                        <p className="font-bold text-base sm:text-lg">Egypt</p>
                        <AnimatePresence>
                            {era.ruler === 'egypt' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-1 flex items-center justify-center gap-1 text-xs font-semibold"
                                >
                                    <Crown className="w-3.5 h-3.5" />
                                    har makten
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <motion.div
                        animate={{ rotate: arrowRotation }}
                        transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                        className={`flex-shrink-0 ${arrowColor}`}
                    >
                        <ArrowLeftRight className="w-8 h-8 sm:w-10 sm:h-10" />
                    </motion.div>

                    <motion.div
                        animate={{ scale: era.ruler === 'kusj' ? 1.03 : 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className={`rounded-xl border p-3 sm:p-4 text-center transition-colors ${zoneClass('kusj')}`}
                    >
                        <p className="text-[11px] uppercase tracking-wide opacity-70">Sør</p>
                        <p className="font-bold text-base sm:text-lg">Kusj</p>
                        <AnimatePresence>
                            {era.ruler === 'kusj' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-1 flex items-center justify-center gap-1 text-xs font-semibold"
                                >
                                    <Crown className="w-3.5 h-3.5" />
                                    har makten
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Tidslinja eleven klikker på */}
                <div className="mt-5 flex flex-wrap gap-2">
                    {eras.map((e, i) => {
                        const isActive = i === activeIndex;
                        const isSeen = seen.includes(e.id);
                        return (
                            <button
                                key={e.id}
                                onClick={() => pick(i)}
                                className={`flex-1 min-w-[92px] rounded-lg border px-2 py-2 text-left transition-colors ${
                                    isActive
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                        : isSeen
                                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm'
                                }`}
                            >
                                <span className="block text-[11px] font-semibold opacity-80">
                                    {e.years}
                                </span>
                                <span className="block text-xs font-bold leading-tight">
                                    {e.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={era.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                        className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3"
                    >
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                            {RULER_TEXT[era.ruler]}
                        </p>
                        <p className="text-sm font-semibold text-blue-900 mt-0.5">{era.headline}</p>
                        <p className="text-sm text-blue-800 mt-1 leading-relaxed">{era.detail}</p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Suksess-tilstand */}
            <AnimatePresence>
                {allSeen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                        className="mx-5 mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2"
                    >
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-emerald-800 leading-relaxed">{payoff}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    {seen.length} av {eras.length} tidsrom utforsket
                </span>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
