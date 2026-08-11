import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Church, RotateCcw, Sparkles, X } from 'lucide-react';

type Side = 'felles' | 'uenig';

interface Statement {
    id: string;
    text: string;
    side: Side;
    explanation: string;
}

interface DetAlleErEnigeOmProps {
    title?: string;
}

const STATEMENTS: Statement[] = [
    {
        id: 'inkarnasjon',
        text: 'Gud ble menneske i Jesus fra Nasaret.',
        side: 'felles',
        explanation:
            'Felles for alle kristne trosretninger er troen på at Gud viste seg i Kristus. Dette kalles inkarnasjonen, og det er selve kjernen.',
    },
    {
        id: 'pave',
        text: 'Paven er den øverste lederen for hele kirken.',
        side: 'uenig',
        explanation:
            'Katolske kristne sier ja. Uenighet om pavens myndighet var en av grunnene til at kirken i øst og vest delte seg i 1054.',
    },
    {
        id: 'oppstandelse',
        text: 'Jesus sto opp fra de døde.',
        side: 'felles',
        explanation:
            'Hele religionen tar utgangspunkt i troen på at Jesus sto opp igjen etter at han døde. Oppstandelsen står i trosbekjennelsene.',
    },
    {
        id: 'sakramenter',
        text: 'Kirken har sju sakramenter.',
        side: 'uenig',
        explanation:
            'Den katolske og de ortodokse kirkene regner sju sakramenter. Protestantiske kirker regner bare to: dåp og nattverd.',
    },
    {
        id: 'treenighet',
        text: 'Gud er én, og er samtidig Faderen, Sønnen og Den hellige ånd.',
        side: 'felles',
        explanation:
            'Treenighetslæren ble formulert på kirkemøtene i Nikea i 325 og Konstantinopel i 381, og står i den nikenske trosbekjennelsen.',
    },
    {
        id: 'barnedaap',
        text: 'Barn skal døpes som spedbarn.',
        side: 'uenig',
        explanation:
            'Barnedåp er den vanligste formen i de fleste kirker. Baptister og pinsevenner døper bare den som selv har sagt ja til troen.',
    },
    {
        id: 'tolkning',
        text: 'Bibelen skal tolkes slik paven og kirkens tradisjon sier.',
        side: 'uenig',
        explanation:
            'Reformatorene på 1500-tallet mente Bibelen skulle tolkes ved hjelp av fornuften, ikke ut fra føringer gitt av paven eller kirkelig tradisjon.',
    },
    {
        id: 'gjendaap',
        text: 'Den som bytter kirkesamfunn, må døpes på nytt.',
        side: 'uenig',
        explanation:
            'Noen menigheter som bare praktiserer voksendåp, krever dåp på nytt. De fleste andre kirker godtar dåpen fra det forrige kirkesamfunnet.',
    },
];

const FELLES_TOTAL = STATEMENTS.filter((s) => s.side === 'felles').length;
const UENIG_TOTAL = STATEMENTS.length - FELLES_TOTAL;

export function DetAlleErEnigeOm({
    title = 'Felles kjerne eller stridsspørsmål?',
}: DetAlleErEnigeOmProps) {
    const [index, setIndex] = useState(0);
    const [picked, setPicked] = useState<Side | null>(null);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);

    const current = STATEMENTS[index];
    const isCorrect = picked !== null && picked === current.side;
    const processed = done ? STATEMENTS.length : picked !== null ? index + 1 : index;
    const fellesCount = STATEMENTS.slice(0, processed).filter((s) => s.side === 'felles').length;
    const uenigCount = processed - fellesCount;

    const handlePick = (side: Side) => {
        if (picked !== null) return;
        setPicked(side);
        if (side === current.side) setScore((s) => s + 1);
    };

    const handleNext = () => {
        if (index + 1 >= STATEMENTS.length) {
            setDone(true);
            return;
        }
        setIndex((i) => i + 1);
        setPicked(null);
    };

    const handleReset = () => {
        setIndex(0);
        setPicked(null);
        setScore(0);
        setDone(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Church className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les påstanden. Er dette noe alle kristne tror på, eller er kirkene uenige?
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4 flex items-center gap-2">
                {STATEMENTS.map((s, i) => (
                    <motion.span
                        key={s.id}
                        animate={{
                            backgroundColor:
                                done || i < index || (i === index && picked !== null)
                                    ? '#6366f1'
                                    : i === index
                                      ? '#c7d2fe'
                                      : '#e2e8f0',
                        }}
                        className="h-1.5 flex-1 rounded-full"
                    />
                ))}
            </div>

            {!done && (
                <div className="px-5 pt-3">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Påstand {index + 1} av {STATEMENTS.length}
                    </p>
                </div>
            )}

            <div className="px-5 py-4">
                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-center"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0.5 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 12,
                                    delay: 0.1,
                                }}
                                className="inline-flex"
                            >
                                <Sparkles className="w-8 h-8 text-emerald-600" />
                            </motion.div>
                            <p className="mt-2 text-lg font-semibold text-emerald-800">
                                {score} av {STATEMENTS.length} riktig plassert
                            </p>
                            <p className="mt-2 text-sm text-emerald-700 max-w-xl mx-auto">
                                Se på de to bunkene. Bare {FELLES_TOTAL} av påstandene deler alle
                                kristne, og alle {FELLES_TOTAL} handler om hvem Jesus og Gud er. De
                                andre {UENIG_TOTAL} handler om ledelse, ritualer og tolkning. Det er
                                der kirkesamfunnene skiller lag.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={current.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 min-h-[104px] flex items-center justify-center"
                        >
                            <p className="text-lg sm:text-xl font-medium text-slate-800 text-center text-balance">
                                {current.text}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {!done && (
                <div className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <motion.button
                        whileTap={{ scale: picked === null ? 0.97 : 1 }}
                        onClick={() => handlePick('felles')}
                        disabled={picked !== null}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                            picked === 'felles'
                                ? 'border-indigo-400 bg-indigo-100 text-indigo-800'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60'
                        }`}
                    >
                        Alle kristne er enige
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: picked === null ? 0.97 : 1 }}
                        onClick={() => handlePick('uenig')}
                        disabled={picked !== null}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                            picked === 'uenig'
                                ? 'border-amber-400 bg-amber-100 text-amber-800'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60'
                        }`}
                    >
                        Her er kirkene uenige
                    </motion.button>
                </div>
            )}

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={
                            done ? 'feedback-done' : picked === null ? 'feedback-idle' : current.id
                        }
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`rounded-lg border px-4 py-3 text-sm min-h-[64px] flex items-start gap-2 ${
                            done
                                ? 'border-slate-200 bg-slate-50 text-slate-600'
                                : picked === null
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : isCorrect
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                    >
                        {picked !== null && !done && (
                            <span className="mt-0.5 shrink-0">
                                {isCorrect ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <X className="w-4 h-4" />
                                )}
                            </span>
                        )}
                        <span>
                            {done
                                ? 'Trykk «Start på nytt» hvis du vil prøve igjen.'
                                : picked === null
                                  ? 'Velg en av de to knappene. Du får forklaringen med en gang.'
                                  : `${isCorrect ? 'Riktig.' : 'Ikke helt.'} ${current.explanation}`}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-5 pt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                        Felles kjerne
                    </p>
                    <motion.p
                        key={`f-${fellesCount}`}
                        initial={{ scale: 0.8, opacity: 0.4 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                        className="text-2xl font-bold text-indigo-800"
                    >
                        {fellesCount}
                    </motion.p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                        Kirkene er uenige
                    </p>
                    <motion.p
                        key={`u-${uenigCount}`}
                        initial={{ scale: 0.8, opacity: 0.4 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                        className="text-2xl font-bold text-amber-800"
                    >
                        {uenigCount}
                    </motion.p>
                </div>
            </div>

            <div className="px-5 py-4 flex items-center justify-between gap-3">
                {done ? (
                    <span className="text-sm text-slate-500">
                        Du er ferdig med alle påstandene.
                    </span>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={picked === null}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        {index + 1 === STATEMENTS.length ? 'Se resultatet' : 'Neste påstand'}
                    </button>
                )}
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    {done ? 'Start på nytt' : 'Tilbakestill'}
                </button>
            </div>
        </div>
    );
}
