import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Flag, Lock, Sparkles, RotateCcw } from 'lucide-react';

// Lyspære-øyeblikket:
// Etter denne interaksjonen skal eleven forstå at ett eneste ord i en
// oversettelse kunne avgjøre om et land var fritt eller en koloni - og hvorfor
// Etiopia gikk til krig for nettopp det ordet.
//
// Eleven må prøve BEGGE ordene før avsløringen låses opp. Poenget lander bare
// hvis eleven selv kjenner forskjellen mellom de to versjonene.

interface TraktatFellenOption {
    // Ordet som settes inn i hullet i traktatteksten.
    word: string;
    // Hvem sin versjon dette er (vises på kortet).
    source: string;
    // Hva ordet betyr for landet.
    outcomeTitle: string;
    outcomeText: string;
    // 'fri' gir grønt utfall, 'ufri' gir rødt.
    tone: 'fri' | 'ufri';
}

interface TraktatFellenProps {
    title?: string;
    intro?: string;
    // Teksten rundt hullet. Hullet ligger mellom before og after.
    sentenceBefore?: string;
    sentenceAfter?: string;
    options?: TraktatFellenOption[];
    revealTitle?: string;
    revealText?: string;
}

const DEFAULT_OPTIONS: TraktatFellenOption[] = [
    {
        word: 'kan',
        source: 'Den amhariske versjonen (Etiopias tekst)',
        outcomeTitle: 'Etiopia er et fritt land',
        outcomeText:
            'Keiseren velger selv om han vil bruke Italia som mellommann. Han kan like gjerne snakke direkte med Frankrike, Russland eller Storbritannia. Etiopia bestemmer over seg selv.',
        tone: 'fri',
    },
    {
        word: 'skal',
        source: 'Den italienske versjonen (Italias tekst)',
        outcomeTitle: 'Etiopia er et italiensk protektorat',
        outcomeText:
            'Alt Etiopia sier til andre land, må gå gjennom Roma. Da er det Italia som styrer utenrikspolitikken, og Etiopia er ikke lenger en fri stat i andre lands øyne.',
        tone: 'ufri',
    },
];

type Phase = 'idle' | 'valgt' | 'avslort';

export function TraktatFellen({
    title = 'Artikkel 17: ett ord, to land',
    intro = 'Klikk et ord og se hva Etiopia blir. Prøv begge.',
    sentenceBefore = 'Hans Majestet kongen av kongene av Etiopia',
    sentenceAfter =
        'bruke Italias regjering i alle saker han har med andre land.',
    options = DEFAULT_OPTIONS,
    revealTitle = 'Menelik oppdaget forskjellen',
    revealText =
        'De to versjonene av traktaten fra Wichale i 1889 sa ikke det samme. Italia meldte til hele Europa at Etiopia nå var italiensk område. Menelik 2. sa opp artikkelen i 1890 og hele traktaten i 1893. Da sendte Italia en hær. Den 1. mars 1896 møttes de to hærene ved Adwa, og Etiopia vant.',
}: TraktatFellenProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [valgt, setValgt] = useState<number | null>(null);
    const [prevd, setPrevd] = useState<number[]>([]);

    const allePrevd = prevd.length >= options.length;
    const aktiv = valgt === null ? null : options[valgt];

    const velg = (i: number) => {
        setValgt(i);
        setPhase(phase === 'avslort' ? 'avslort' : 'valgt');
        setPrevd((p) => (p.includes(i) ? p : [...p, i]));
    };

    const handleReset = () => {
        setPhase('idle');
        setValgt(null);
        setPrevd([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate: traktatteksten med hull */}
            <div className="p-6">
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">
                        Traktaten fra Wichale, 1889
                    </p>
                    <p className="text-base sm:text-lg leading-relaxed text-slate-800">
                        {sentenceBefore}{' '}
                        <span className="inline-flex align-baseline">
                            <AnimatePresence mode="wait" initial={false}>
                                {aktiv ? (
                                    <motion.span
                                        key={aktiv.word}
                                        initial={{ opacity: 0, y: -10, scale: 0.85 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                                        className={`px-3 py-0.5 rounded-lg font-bold ${
                                            aktiv.tone === 'fri'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-rose-100 text-rose-800'
                                        }`}
                                    >
                                        {aktiv.word}
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="tomt"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="px-8 py-0.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-300"
                                    >
                                        ?
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </span>{' '}
                        {sentenceAfter}
                    </p>
                </div>

                {/* Ordkortene */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {options.map((o, i) => {
                        const erValgt = valgt === i;
                        return (
                            <motion.button
                                key={o.word}
                                onClick={() => velg(i)}
                                whileTap={{ scale: 0.97 }}
                                className={`text-left rounded-xl border px-4 py-3 transition-shadow ${
                                    erValgt
                                        ? o.tone === 'fri'
                                            ? 'border-emerald-300 bg-emerald-50 shadow-md'
                                            : 'border-rose-300 bg-rose-50 shadow-md'
                                        : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
                                }`}
                            >
                                <span className="block text-2xl font-bold text-slate-800">
                                    «{o.word}»
                                </span>
                                <span className="block text-xs text-slate-500 mt-1">{o.source}</span>
                                {prevd.includes(i) && !erValgt && (
                                    <span className="block text-[11px] text-slate-400 mt-1">
                                        Prøvd
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone: alltid i DOM-et */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {aktiv ? (
                        <motion.div
                            key={aktiv.word + phase}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                aktiv.tone === 'fri'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            <span className="flex items-center gap-2 font-semibold">
                                {aktiv.tone === 'fri' ? (
                                    <Flag className="w-4 h-4" />
                                ) : (
                                    <Lock className="w-4 h-4" />
                                )}
                                {aktiv.outcomeTitle}
                            </span>
                            <span className="block mt-1 leading-relaxed">{aktiv.outcomeText}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Setningen mangler ett ord. Velg et av ordene over, så ser du hva Etiopia
                            blir.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Avsløringen: låst til eleven har prøvd begge ordene */}
            <AnimatePresence>
                {phase === 'avslort' && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        className="mx-6 mb-4 px-4 py-4 rounded-xl bg-indigo-50 border border-indigo-200"
                    >
                        <p className="flex items-center gap-2 font-semibold text-indigo-900">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            {revealTitle}
                        </p>
                        <p className="text-sm text-indigo-900/90 mt-1.5 leading-relaxed">
                            {revealText}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={() => setPhase('avslort')}
                    disabled={!allePrevd || phase === 'avslort'}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        !allePrevd || phase === 'avslort'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    {phase === 'avslort'
                        ? 'Avslørt'
                        : allePrevd
                          ? 'Hva skjedde egentlig?'
                          : 'Prøv begge ordene først'}
                </button>
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
