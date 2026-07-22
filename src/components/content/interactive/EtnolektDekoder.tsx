import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Sparkles, RotateCcw, Check } from 'lucide-react';

interface EtnolektWord {
    word: string;
    meaning: string;
    origin: string;
}

interface EtnolektDekoderProps {
    title?: string;
    intro?: string;
    words?: EtnolektWord[];
}

const DEFAULT_WORDS: EtnolektWord[] = [
    { word: 'wallah', meaning: 'jeg sverger', origin: 'Arabisk' },
    { word: 'jalla', meaning: 'kom igjen, skynd deg', origin: 'Arabisk' },
    { word: 'flus', meaning: 'penger', origin: 'Arabisk' },
    { word: 'baja', meaning: 'kompis, venn', origin: 'Urdu og punjabi' },
    { word: 'tært', meaning: 'kul, fin', origin: 'Urdu og punjabi' },
    { word: 'digge', meaning: 'å like noe', origin: 'Engelsk' },
];

// Rolige, lyse fargepar per opphavsspråk. Faller tilbake til skifer.
const ORIGIN_STYLES: Record<string, { chip: string; dot: string }> = {
    Arabisk: { chip: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-400' },
    'Urdu og punjabi': { chip: 'bg-violet-50 border-violet-200 text-violet-700', dot: 'bg-violet-400' },
    Engelsk: { chip: 'bg-sky-50 border-sky-200 text-sky-700', dot: 'bg-sky-400' },
};

function originStyle(origin: string) {
    return ORIGIN_STYLES[origin] ?? { chip: 'bg-slate-50 border-slate-200 text-slate-600', dot: 'bg-slate-400' };
}

export function EtnolektDekoder({
    title = 'Avkod multietnolekten',
    intro = 'Trykk på hvert ord for å se hva det betyr og hvilket språk det kommer fra.',
    words = DEFAULT_WORDS,
}: EtnolektDekoderProps) {
    const [revealed, setRevealed] = useState<Set<number>>(new Set());

    const toggle = (i: number) => {
        setRevealed((prev) => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i);
            else next.add(i);
            return next;
        });
    };

    const handleReset = () => setRevealed(new Set());

    const foundLanguages = useMemo(() => {
        const langs = new Set<string>();
        revealed.forEach((i) => {
            if (words[i]) langs.add(words[i].origin);
        });
        return Array.from(langs);
    }, [revealed, words]);

    const allLanguages = useMemo(() => Array.from(new Set(words.map((w) => w.origin))), [words]);
    const complete = revealed.size === words.length && words.length > 0;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Languages className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Ordkort-rutenett */}
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {words.map((w, i) => {
                    const isOpen = revealed.has(i);
                    const style = originStyle(w.origin);
                    return (
                        <motion.button
                            key={w.word}
                            onClick={() => toggle(i)}
                            whileTap={{ scale: 0.95 }}
                            animate={isOpen ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                            transition={{ duration: 0.25 }}
                            className={`text-left rounded-xl border p-3 min-h-[92px] transition-colors ${
                                isOpen
                                    ? 'bg-slate-50 border-slate-200 shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                            }`}
                        >
                            <div className="font-semibold text-slate-800">«{w.word}»</div>
                            <AnimatePresence mode="wait">
                                {isOpen ? (
                                    <motion.div
                                        key="open"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="text-sm text-slate-600 mt-1">{w.meaning}</div>
                                        <span
                                            className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full border text-xs font-medium ${style.chip}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                            {w.origin}
                                        </span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="closed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-xs text-indigo-500 mt-2"
                                    >
                                        Trykk for å avkode
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* Feedback-sone: hvilke språk er funnet */}
            <div className="mx-6 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-xs font-medium text-blue-700 mb-2">
                    Språk funnet: {foundLanguages.length} av {allLanguages.length}
                </div>
                <div className="flex flex-wrap gap-2">
                    {allLanguages.map((lang) => {
                        const found = foundLanguages.includes(lang);
                        const style = originStyle(lang);
                        return (
                            <span
                                key={lang}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-colors ${
                                    found ? style.chip : 'bg-white border-slate-200 text-slate-300'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${found ? style.dot : 'bg-slate-200'}`} />
                                {lang}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Suksess-banner */}
            <AnimatePresence>
                {complete && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        className="mx-6 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800"
                    >
                        <div className="flex items-center gap-2 font-semibold">
                            <Sparkles className="w-4 h-4" />
                            Du avkodet {allLanguages.length} ulike språk i én liten ordflokk!
                        </div>
                        <p className="text-sm text-emerald-700 mt-1">
                            Nettopp derfor heter det <span className="font-semibold">multi</span>etnolekt: ett felles
                            ungdomsspråk bygd av lånord fra mange språk. Det viser hvem du henger med, ikke hvor du
                            kommer fra.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <div className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {revealed.size} av {words.length} ord avkodet
                </div>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
