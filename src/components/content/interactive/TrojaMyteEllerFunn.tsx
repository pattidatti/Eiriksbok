import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ScrollText,
    Shovel,
    HelpCircle,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Trophy,
} from 'lucide-react';

// Signaturkomponent for "Den trojanske krig".
// Lyspære: Et sagn kan peke arkeologene mot et ekte sted, men et funn i
// bakken beviser ikke at selve historien i diktet skjedde slik den fortelles.
// Eleven sorterer påstander i tre bokser: står det bare i diktet, er det
// gravd opp av jorda, eller er det fortsatt usikkert?

type Category = 'dikt' | 'funn' | 'usikkert';

interface Claim {
    text: string;
    answer: Category;
    why: string;
}

interface TrojaMyteEllerFunnProps {
    title?: string;
    claims?: Claim[];
}

const CATEGORIES: {
    id: Category;
    label: string;
    short: string;
    icon: typeof ScrollText;
    tint: string;
    ring: string;
}[] = [
    {
        id: 'dikt',
        label: 'Bare i diktet',
        short: 'Sagn',
        icon: ScrollText,
        tint: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
        ring: 'ring-amber-400',
    },
    {
        id: 'funn',
        label: 'Funnet i bakken',
        short: 'Funn',
        icon: Shovel,
        tint: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
        ring: 'ring-emerald-400',
    },
    {
        id: 'usikkert',
        label: 'Fortsatt usikkert',
        short: 'Usikkert',
        icon: HelpCircle,
        tint: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
        ring: 'ring-blue-400',
    },
];

const DEFAULT_CLAIMS: Claim[] = [
    {
        text: 'Byen Troja lå på haugen Hisarlik, like ved innløpet til Dardanellene.',
        answer: 'funn',
        why: 'Arkeologene har gravd fram byen der. Selve stedet er et ekte funn.',
    },
    {
        text: 'Grekerne gjemte soldater inne i en stor trehest for å komme innenfor bymurene.',
        answer: 'dikt',
        why: 'Trehesten fortelles av Homer og den romerske dikteren Vergil. Ingen hest er funnet i jorda.',
    },
    {
        text: 'Bylaget Troja VIIa ble ødelagt av brann og kamp rundt 1180 fvt.',
        answer: 'funn',
        why: 'Arkeologene fant brannspor, pilspisser og ubegravde skjeletter i nettopp dette laget.',
    },
    {
        text: 'Prins Paris bortførte den vakre Helena fra kong Menelaos i Sparta.',
        answer: 'dikt',
        why: 'Historien om Paris og Helena er kjernen i Homers sagn, ikke et arkeologisk funn.',
    },
    {
        text: 'Hettittiske leirtavler nevner en by som het Wilusa i det samme området.',
        answer: 'funn',
        why: 'Tavlene er ekte skriftfunn. Mange forskere mener Wilusa er det samme stedet som Troja.',
    },
    {
        text: 'Krigen varte i nøyaktig ti år, slik diktet forteller.',
        answer: 'usikkert',
        why: 'Mange forskere tror flere små kriger over lang tid ble slått sammen til én fortelling.',
    },
    {
        text: 'Kong Agamemnon samlet over tusen skip til krigstoget mot Troja.',
        answer: 'dikt',
        why: 'De tusen skipene er et bilde fra diktet. Ingen slik flåte er dokumentert.',
    },
];

type Phase = 'answering' | 'complete';

export function TrojaMyteEllerFunn({
    title = 'Myte eller funn?',
    claims = DEFAULT_CLAIMS,
}: TrojaMyteEllerFunnProps) {
    const deck = useMemo(() => claims, [claims]);
    const [phase, setPhase] = useState<Phase>('answering');
    const [index, setIndex] = useState(0);
    const [picked, setPicked] = useState<Category | null>(null);
    const [correctCount, setCorrectCount] = useState(0);

    const current = deck[index];
    const isRight = picked !== null && picked === current.answer;

    const handlePick = (cat: Category) => {
        if (picked !== null) return;
        setPicked(cat);
        if (cat === current.answer) setCorrectCount((c) => c + 1);
    };

    const handleNext = () => {
        if (index + 1 >= deck.length) {
            setPhase('complete');
            return;
        }
        setIndex((i) => i + 1);
        setPicked(null);
    };

    const handleReset = () => {
        setPhase('answering');
        setIndex(0);
        setPicked(null);
        setCorrectCount(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                    <Search className="w-5 h-5 text-indigo-500" />
                </span>
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Sorter påstanden: står den bare i diktet, er den gravd opp av jorda, eller er
                        den fortsatt usikker?
                    </p>
                </div>
            </div>

            {phase === 'answering' ? (
                <div className="p-6">
                    {/* Framdrift */}
                    <div className="flex items-center gap-2 mb-4">
                        {deck.map((_, i) => (
                            <span
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                    i < index
                                        ? 'bg-indigo-400'
                                        : i === index
                                          ? 'bg-indigo-300'
                                          : 'bg-slate-100'
                                }`}
                            />
                        ))}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Påstand {index + 1} av {deck.length}
                    </p>

                    {/* Pastandskort */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-5 mb-5"
                        >
                            <p className="text-slate-800 leading-relaxed">{current.text}</p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Kategori-knapper */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isAnswer = cat.id === current.answer;
                            const isPicked = picked === cat.id;
                            const answered = picked !== null;
                            const showRight = answered && isAnswer;
                            const showWrong = answered && isPicked && !isAnswer;
                            return (
                                <motion.button
                                    key={cat.id}
                                    onClick={() => handlePick(cat.id)}
                                    disabled={answered}
                                    whileTap={answered ? undefined : { scale: 0.96 }}
                                    className={`relative flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                                        showRight
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-400'
                                            : showWrong
                                              ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-300'
                                              : answered
                                                ? 'bg-white border-slate-200 text-slate-400'
                                                : cat.tint
                                    }`}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-left leading-tight">{cat.label}</span>
                                    {showRight && (
                                        <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-500" />
                                    )}
                                    {showWrong && (
                                        <XCircle className="w-4 h-4 ml-auto text-rose-400" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Feedback-sone */}
                    <div className="mt-5 min-h-[3.5rem]">
                        <AnimatePresence mode="wait">
                            {picked === null ? (
                                <motion.p
                                    key="hint"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-sm text-slate-400"
                                >
                                    Velg en boks for påstanden over.
                                </motion.p>
                            ) : (
                                <motion.div
                                    key="feedback"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`rounded-lg px-4 py-3 text-sm border ${
                                        isRight
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                            : 'bg-blue-50 border-blue-200 text-blue-800'
                                    }`}
                                >
                                    <span className="font-semibold">
                                        {isRight ? 'Riktig! ' : 'Se her: '}
                                    </span>
                                    {current.why}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Kontrollrad */}
                    <div className="mt-2 flex items-center justify-between">
                        <button
                            onClick={handleNext}
                            disabled={picked === null}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            {index + 1 >= deck.length ? 'Se resultatet' : 'Neste påstand'}
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Start på nytt
                        </button>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                    className="p-6"
                >
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-5">
                        <div className="flex items-center gap-3 mb-3">
                            <Trophy className="w-6 h-6 text-amber-500" />
                            <p className="font-bold text-emerald-900">
                                Du sorterte {correctCount} av {deck.length} riktig!
                            </p>
                        </div>
                        <p className="text-sm text-emerald-900 leading-relaxed">
                            Legg merke til mønsteret: sagnet om Troja pekte arkeologene mot et ekte
                            sted, og i bakken fant de en by som brant i krig. Men trehesten, Helena
                            og de tusen skipene lever fortsatt bare i diktet. Et funn i jorda kan
                            vise at noe skjedde, uten å bevise at det skjedde slik Homer forteller.
                        </p>
                    </div>
                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-5 py-2 text-sm font-medium transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Prøv igjen
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
