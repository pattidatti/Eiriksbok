import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, RotateCcw, Sparkles } from 'lucide-react';

interface MennesketSomVaaknetProps {
    title?: string;
}

type LensId = 'eldst' | 'mahayana';

interface Lens {
    id: LensId;
    label: string;
    note: string;
}

interface RoleQuestion {
    id: string;
    q: string;
    answers: Record<LensId, string>;
}

const LENSES: Lens[] = [
    {
        id: 'eldst',
        label: 'Den eldste tradisjonen',
        note: 'Slik de første tilhengerne forsto ham. Theravada holder i store trekk fast på dette.',
    },
    {
        id: 'mahayana',
        label: 'Mahayana-buddhismen',
        note: 'Retningen som vokste fram senere, og som er størst i Øst-Asia og Himalaya.',
    },
];

const QUESTIONS: RoleQuestion[] = [
    {
        id: 'gud',
        q: 'Er Buddha en gud?',
        answers: {
            eldst: 'Nei. Tilhengerne hans så ham ikke som en gud, men som læremester for både guder og mennesker. Et menneske som nådde fram til innsikten ved egen kraft.',
            mahayana:
                'Her fikk Buddha-skikkelsen en ny dimensjon: kosmisk, evig og guddommelig. I den japanske retningen Shingon blir Buddha, under navnet Vairocana, regnet som opphavet til hele universet.',
        },
    },
    {
        id: 'hjelp',
        q: 'Kan han gripe inn og hjelpe deg i dag?',
        answers: {
            eldst: 'Han ble ikke tenkt å være virksom etter sin død. Han er forbilde og veiviser, ikke en som redder deg. Veien må du gå selv.',
            mahayana:
                'Et stort antall buddhaer tenkes å trone hver i sitt paradis. Å bli gjenfødt hos buddhaen Amitabha i vest ble et hovedmål i store deler av Øst-Asia.',
        },
    },
    {
        id: 'liv',
        q: 'Var fødselen og døden hans ekte?',
        answers: {
            eldst: 'Ja. Han ble født, levde til han var 80 år og døde i Kushinagari. Ifølge tradisjonen ble restene etter kremasjonen tatt vare på i stupaer.',
            mahayana:
                'Fødselen og døden blir betraktet som en illusjon. Et skuespill han satte opp for å undervise menneskene og på den måten frelse dem.',
        },
    },
    {
        id: 'eneste',
        q: 'Er han den eneste buddhaen?',
        answers: {
            eldst: 'Nei. Gautama regnes som én i en uendelig rekke buddhaer som trer fram i verden fra tid til annen.',
            mahayana:
                'Rekken ble utvidet til også å gjelde rommet. Utallige buddhaer tenkes å ha hvert sitt paradis eller verdenssystem.',
        },
    },
];

const TOTAL = QUESTIONS.length * LENSES.length;

export function MennesketSomVaaknet({ title = 'Hvem er Buddha?' }: MennesketSomVaaknetProps) {
    const [lens, setLens] = useState<LensId>('eldst');
    const [openId, setOpenId] = useState<string>(QUESTIONS[0].id);
    const [seen, setSeen] = useState<string[]>([`${QUESTIONS[0].id}:eldst`]);

    const activeLens = LENSES.find((l) => l.id === lens) ?? LENSES[0];
    const activeQuestion = QUESTIONS.find((q) => q.id === openId) ?? QUESTIONS[0];
    const done = seen.length >= TOTAL;

    const register = (questionId: string, lensId: LensId) => {
        const key = `${questionId}:${lensId}`;
        setSeen((prev) => (prev.includes(key) ? prev : [...prev, key]));
    };

    const pickQuestion = (questionId: string) => {
        setOpenId(questionId);
        register(questionId, lens);
    };

    const pickLens = (lensId: LensId) => {
        setLens(lensId);
        register(openId, lensId);
    };

    const handleReset = () => {
        setLens('eldst');
        setOpenId(QUESTIONS[0].id);
        setSeen([`${QUESTIONS[0].id}:eldst`]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
                <Eye className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg et spørsmål, og bytt blikk. Samme mann, to svar.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4">
                <div className="inline-flex rounded-full bg-slate-100 p-1 gap-1">
                    {LENSES.map((l) => (
                        <button
                            key={l.id}
                            onClick={() => pickLens(l.id)}
                            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                lens === l.id ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {lens === l.id && (
                                <motion.span
                                    layoutId="mvs-lens-pill"
                                    className="absolute inset-0 rounded-full bg-amber-600"
                                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                />
                            )}
                            <span className="relative">{l.label}</span>
                        </button>
                    ))}
                </div>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={activeLens.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 text-xs text-slate-500"
                    >
                        {activeLens.note}
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="p-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="flex flex-col gap-2">
                    {QUESTIONS.map((q) => {
                        const isOpen = q.id === openId;
                        return (
                            <button
                                key={q.id}
                                onClick={() => pickQuestion(q.id)}
                                className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                                    isOpen
                                        ? 'border-amber-300 bg-amber-50 shadow-md'
                                        : 'border-slate-200 bg-white shadow-sm hover:bg-slate-50'
                                }`}
                            >
                                <span className="block text-sm font-medium text-slate-800">
                                    {q.q}
                                </span>
                                <span className="mt-2 flex items-center gap-1.5">
                                    {LENSES.map((l) => {
                                        const read = seen.includes(`${q.id}:${l.id}`);
                                        return (
                                            <motion.span
                                                key={l.id}
                                                animate={{ scale: read ? 1 : 0.75 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 500,
                                                    damping: 22,
                                                }}
                                                className={`h-2 w-6 rounded-full ${
                                                    read ? 'bg-amber-500' : 'bg-slate-200'
                                                }`}
                                            />
                                        );
                                    })}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 min-h-[11rem] flex">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${activeQuestion.id}:${lens}`}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.22 }}
                            className="self-start"
                        >
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                {activeLens.label}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                {activeQuestion.q}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-700">
                                {activeQuestion.answers[lens]}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="mx-5 mb-4">
                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                        >
                            <span className="flex items-center gap-2 font-semibold">
                                <motion.span
                                    initial={{ rotate: -20, scale: 0.6 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 14 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.span>
                                Du har sett begge blikkene på alle fire spørsmålene.
                            </span>
                            <span className="mt-1 block">
                                Ingen av kolonnene er «feil». Begge finnes i buddhismen i dag. Det
                                som binder dem sammen, er De tre juvelene: Buddha, læren (dharma) og
                                fellesskapet (sangha).
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="progress"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-center gap-2"
                        >
                            <Check className="w-4 h-4 shrink-0" />
                            <span>
                                Lest {seen.length} av {TOTAL} svar. Bytt blikk for å se hva den
                                andre retningen sier om det samme.
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={() => pickLens(lens === 'eldst' ? 'mahayana' : 'eldst')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Bytt blikk
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
