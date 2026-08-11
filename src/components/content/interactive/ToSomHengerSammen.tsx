import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, MousePointerClick, RotateCcw, Sparkles } from 'lucide-react';

interface ToSomHengerSammenProps {
    title?: string;
}

type Owner = 'bab' | 'bahaullah' | 'abdulbaha';

interface RoleCard {
    id: string;
    text: string;
    hint: string;
    owner: Owner;
}

interface RoleColumn {
    id: Owner;
    name: string;
    meaning: string;
    badge: string;
    isMessenger: boolean;
}

const COLUMNS: RoleColumn[] = [
    {
        id: 'bab',
        name: 'Báb',
        meaning: 'Porten, 1819-1850',
        badge: 'Regnes som Guds sendebud',
        isMessenger: true,
    },
    {
        id: 'bahaullah',
        name: "Bahá'u'lláh",
        meaning: 'Guds herlighet, 1817-1892',
        badge: 'Regnes som Guds sendebud',
        isMessenger: true,
    },
    {
        id: 'abdulbaha',
        name: "'Abdu'l-Bahá",
        meaning: 'Sønnen, 1844-1921',
        badge: 'Regnes som forklarer og forbilde',
        isMessenger: false,
    },
];

const CARDS: RoleCard[] = [
    {
        id: 'k1',
        text: 'Kalte seg Porten, altså døra inn til sannheten',
        hint: 'Hvem sin tittel betyr port?',
        owner: 'bab',
    },
    {
        id: 'k2',
        text: 'Regnes ikke som et av Guds sendebud',
        hint: 'To av de tre regnes som sendebud. Hvem er den tredje?',
        owner: 'abdulbaha',
    },
    {
        id: 'k3',
        text: 'Sto fram i 1863 som den det var varslet om',
        hint: 'Hvem var det løftet handlet om?',
        owner: 'bahaullah',
    },
    {
        id: 'k4',
        text: 'Faren pekte ham ut som den som fikk forklare skriftene',
        hint: 'Bare én av de tre har en far i denne gruppen.',
        owner: 'abdulbaha',
    },
    {
        id: 'k5',
        text: 'Varslet om et større sendebud som skulle komme',
        hint: 'Hvem av de to sendebudene kom først?',
        owner: 'bab',
    },
    {
        id: 'k6',
        text: 'Skriftene hans er grunnlaget for troen',
        hint: 'Tittelen hans betyr Guds herlighet.',
        owner: 'bahaullah',
    },
    {
        id: 'k7',
        text: 'Er forbildet som levde ut læren i praksis',
        hint: 'Han kalles det fullkomne forbildet, ikke et sendebud.',
        owner: 'abdulbaha',
    },
    {
        id: 'k8',
        text: 'Erklærte seg i Shiraz om kvelden 22. mai 1844',
        hint: 'Dette skjedde nesten 20 år før den andre sto fram.',
        owner: 'bab',
    },
    {
        id: 'k9',
        text: "Bahá'ier regner ham som Guds sendebud for vår tid",
        hint: 'Han var selv en tilhenger av den som kom først.',
        owner: 'bahaullah',
    },
];

type Feedback = { tone: 'neutral' | 'ok' | 'bad'; text: string };

const IDLE_FEEDBACK: Feedback = {
    tone: 'neutral',
    text: 'Trykk på et kort, og trykk så på personen kortet hører til.',
};

const FEEDBACK_STYLES: Record<Feedback['tone'], string> = {
    neutral: 'bg-slate-50 border-slate-200 text-slate-600',
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    bad: 'bg-rose-50 border-rose-200 text-rose-700',
};

export function ToSomHengerSammen({ title = 'Hvem har hvilken rolle?' }: ToSomHengerSammenProps) {
    const [placedIds, setPlacedIds] = useState<string[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [shakeColumn, setShakeColumn] = useState<Owner | null>(null);
    const [feedback, setFeedback] = useState<Feedback>(IDLE_FEEDBACK);

    const pool = CARDS.filter((card) => !placedIds.includes(card.id));
    const isComplete = placedIds.length === CARDS.length;

    const handleReset = () => {
        setPlacedIds([]);
        setSelectedId(null);
        setShakeColumn(null);
        setFeedback(IDLE_FEEDBACK);
    };

    const handleSelect = (card: RoleCard) => {
        if (selectedId === card.id) {
            setSelectedId(null);
            setFeedback(IDLE_FEEDBACK);
            return;
        }
        setSelectedId(card.id);
        setFeedback({ tone: 'neutral', text: 'Kortet er valgt. Trykk på personen det hører til.' });
    };

    const handleColumn = (column: RoleColumn) => {
        if (isComplete) return;
        const card = CARDS.find((item) => item.id === selectedId);
        if (!card) {
            setFeedback({ tone: 'neutral', text: 'Velg et kort først, så velger du personen.' });
            return;
        }
        if (card.owner === column.id) {
            const next = [...placedIds, card.id];
            setPlacedIds(next);
            setSelectedId(null);
            setFeedback(
                next.length === CARDS.length
                    ? { tone: 'ok', text: 'Alle ni kortene er på plass.' }
                    : { tone: 'ok', text: `Riktig. Det hører til ${column.name}.` }
            );
        } else {
            setShakeColumn(column.id);
            window.setTimeout(() => setShakeColumn(null), 420);
            setFeedback({ tone: 'bad', text: `Ikke helt. ${card.hint}` });
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <MousePointerClick className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Ni kort, tre personer. Plasser hvert kort der det hører hjemme.
                    </p>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {COLUMNS.map((column) => {
                        const cards = CARDS.filter(
                            (card) => card.owner === column.id && placedIds.includes(card.id)
                        );
                        return (
                            <motion.button
                                key={column.id}
                                type="button"
                                onClick={() => handleColumn(column)}
                                animate={
                                    shakeColumn === column.id
                                        ? { x: [0, -7, 7, -5, 5, 0] }
                                        : { x: 0 }
                                }
                                transition={{ duration: 0.4 }}
                                className={`text-left rounded-xl border p-3 min-h-[188px] transition-colors ${
                                    isComplete
                                        ? 'border-emerald-200 bg-emerald-50/50'
                                        : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
                                }`}
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="font-semibold text-slate-800">
                                        {column.name}
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        {cards.length}/3
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">{column.meaning}</p>

                                <AnimatePresence>
                                    {isComplete && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.7 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 320,
                                                damping: 18,
                                                delay: COLUMNS.indexOf(column) * 0.15,
                                            }}
                                            className={`inline-block mb-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                column.isMessenger
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-sky-100 text-sky-800'
                                            }`}
                                        >
                                            {column.badge}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-1.5">
                                    {cards.map((card) => (
                                        <motion.div
                                            key={card.id}
                                            layoutId={card.id}
                                            className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 flex items-start gap-1.5"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{card.text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <AnimatePresence>
                        {pool.map((card) => (
                            <motion.button
                                key={card.id}
                                layoutId={card.id}
                                type="button"
                                onClick={() => handleSelect(card)}
                                whileTap={{ scale: 0.96 }}
                                animate={{ scale: selectedId === card.id ? 1.03 : 1 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                                className={`rounded-lg border px-3 py-2 text-xs text-left max-w-[15rem] ${
                                    selectedId === card.id
                                        ? 'border-indigo-400 bg-indigo-50 text-indigo-800 shadow-md'
                                        : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300'
                                }`}
                            >
                                {card.text}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                    {pool.length === 0 && (
                        <p className="text-xs text-slate-400">Kortstokken er tom.</p>
                    )}
                </div>
            </div>

            <div className="px-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feedback.text}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg border px-4 py-2.5 text-sm ${FEEDBACK_STYLES[feedback.tone]}`}
                    >
                        {feedback.text}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                        className="mx-5 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                    >
                        <div className="flex items-start gap-2.5">
                            <motion.span
                                initial={{ rotate: -25, scale: 0.5 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                            </motion.span>
                            <p className="text-sm text-amber-900">
                                {
                                    "To av de tre fikk samme merkelapp. Báb og Bahá'u'lláh regnes begge som Guds sendebud, og den første varslet om den andre. 'Abdu'l-Bahá har en annen rolle: han forklarer skriftene og viser hvordan læren kan leves, men han er ikke et sendebud."
                                }
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {placedIds.length} av {CARDS.length} kort plassert
                </span>
                <button
                    type="button"
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
