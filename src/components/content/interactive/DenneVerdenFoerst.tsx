import { useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { Check, Moon, RotateCcw, Scale, Sunrise } from 'lucide-react';

interface DenneVerdenFoerstProps {
    title?: string;
}

type Side = 'her' | 'etter';
type Phase = 'active' | 'complete';

interface Sporsmal {
    id: string;
    question: string;
    short: string;
    side: Side;
    answer: string;
}

const SPORSMAL: Sporsmal[] = [
    {
        id: 'bud',
        question: 'Hvor mange bud har rabbinerne utledet av Mosebøkene?',
        short: 'Antall bud',
        side: 'her',
        answer: 'Rabbinsk jødedom har utledet 613 bud av Mosebøkene: 248 ting man skal gjøre og 365 ting man ikke skal gjøre.',
    },
    {
        id: 'sted',
        question: 'Hva heter stedet de rettferdige kommer til?',
        short: 'Olam ha-ba',
        side: 'etter',
        answer: 'Olam ha-ba, den kommende verden, også kalt Gan Eden. Men ingen bestemt beskrivelse av stedet er bindende. En utbredt folkelig forestilling er at man studerer Toraen der.',
    },
    {
        id: 'redde',
        question: 'Kan man bryte et bud for å redde et menneskeliv?',
        short: 'Å redde liv',
        side: 'her',
        answer: 'Ja. Prinsippet pikuah nefesh sier at nesten alle bud kan brytes for å redde liv. Begrunnelsen er at budene ble gitt for at mennesket skal kunne leve etter dem.',
    },
    {
        id: 'straff',
        question: 'Hvor lenge varer straffen for dem som har gjort galt?',
        short: 'Gehinnom',
        side: 'etter',
        answer: 'Talmud sier verken hvor Gehinnom ligger, hvem som havner der eller hvor lenge. Rabbinerne avviser evig fortapelse, og tolv måneder regnes som det aller lengste.',
    },
    {
        id: 'galt',
        question: 'Hva gjør du når du har gjort noe galt?',
        short: 'Anger og tilgivelse',
        side: 'her',
        answer: 'Du angrer oppriktig og ber om tilgivelse. Gud tilgir den som gjør det. Forsoningsdagen jom kippur er i sin helhet viet dette.',
    },
    {
        id: 'oppstandelse',
        question: 'Står kroppen opp igjen, eller er det bare sjelen?',
        short: 'Oppstandelse',
        side: 'etter',
        answer: 'Her er jøder uenige. Ortodoks jødedom venter at kropp og sjel gjenforenes i en messiansk tid. Ikke-ortodokse retninger tolker det som sjelens udødelighet. Andre jøder tror ikke på evig liv i det hele tatt.',
    },
    {
        id: 'andre',
        question: 'Hvordan skal du behandle andre mennesker?',
        short: 'Andre mennesker',
        side: 'her',
        answer: 'Etikken oppsummeres gjerne med rabbi Hillels gylne regel: Du skal ikke gjøre mot andre det du ikke vil at andre skal gjøre mot deg.',
    },
    {
        id: 'fodt',
        question: 'Er mennesket født syndig?',
        short: 'Født syndig?',
        side: 'her',
        answer: 'Nei. Rabbinerne har ikke utledet noen arvesynd av fortellingen om Adam og Eva. Mennesket fødes med både gode og dårlige tilbøyeligheter, og har fri vilje.',
    },
];

const ANTALL_HER = SPORSMAL.filter((s) => s.side === 'her').length;
const ANTALL_ETTER = SPORSMAL.filter((s) => s.side === 'etter').length;

type Feedback = { kind: 'idle' | 'riktig' | 'feil'; text: string };

const START_FEEDBACK: Feedback = {
    kind: 'idle',
    text: 'Les spørsmålet, og velg hvilken av de to kolonnene det hører hjemme i.',
};

export function DenneVerdenFoerst({
    title = 'Hvor har jødedommen sine tydeligste svar?',
}: DenneVerdenFoerstProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('active');
    const [feedback, setFeedback] = useState<Feedback>(START_FEEDBACK);
    const kortKontroll = useAnimationControls();

    const plassert = SPORSMAL.slice(0, index);
    const aktivt = SPORSMAL[index];

    const velg = (side: Side) => {
        if (phase === 'complete' || !aktivt) return;

        if (side !== aktivt.side) {
            setFeedback({
                kind: 'feil',
                text: 'Ikke helt. Spør deg selv: handler dette om noe et menneske gjør mens det lever, eller om noe som skjer etter døden?',
            });
            void kortKontroll.start({
                x: [0, -10, 10, -7, 7, 0],
                transition: { duration: 0.4 },
            });
            return;
        }

        setFeedback({ kind: 'riktig', text: aktivt.answer });
        const neste = index + 1;
        setIndex(neste);
        if (neste >= SPORSMAL.length) setPhase('complete');
    };

    const tilbakestill = () => {
        setIndex(0);
        setPhase('active');
        setFeedback(START_FEEDBACK);
    };

    const kolonne = (side: Side) => {
        const erHer = side === 'her';
        const kort = plassert.filter((s) => s.side === side);
        const totalt = erHer ? ANTALL_HER : ANTALL_ETTER;

        return (
            <div
                className={`rounded-xl border p-3 ${
                    erHer
                        ? 'border-amber-200 bg-amber-50/70'
                        : 'border-dashed border-indigo-200 bg-indigo-50/50'
                }`}
            >
                <div className="mb-2 flex items-center gap-2">
                    {erHer ? (
                        <Sunrise className="h-4 w-4 text-amber-600" />
                    ) : (
                        <Moon className="h-4 w-4 text-indigo-500" />
                    )}
                    <h4
                        className={`text-sm font-semibold ${
                            erHer ? 'text-amber-800' : 'text-indigo-800'
                        }`}
                    >
                        {erHer ? 'Livet her og nå' : 'Livet etter døden'}
                    </h4>
                    <span className="ml-auto text-xs font-medium text-slate-500">
                        {kort.length}/{totalt}
                    </span>
                </div>

                <ul className="space-y-1.5">
                    {kort.map((s) => (
                        <motion.li
                            key={s.id}
                            initial={{ opacity: 0, scale: 0.9, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                            className={`flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-xs ${
                                erHer
                                    ? 'border-amber-200 text-amber-900'
                                    : 'border-indigo-200 text-indigo-900'
                            }`}
                        >
                            <Check
                                className={`h-3.5 w-3.5 shrink-0 ${
                                    erHer ? 'text-amber-600' : 'text-indigo-500'
                                }`}
                            />
                            <span className="truncate">{s.short}</span>
                        </motion.li>
                    ))}
                    {Array.from({ length: totalt - kort.length }).map((_, i) => (
                        <li
                            key={`tom-${i}`}
                            className={`h-7 rounded-lg border border-dashed ${
                                erHer ? 'border-amber-200/70' : 'border-indigo-200/70'
                            }`}
                        />
                    ))}
                </ul>

                <AnimatePresence>
                    {phase === 'complete' && (
                        <motion.p
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-2 text-xs font-medium ${
                                erHer ? 'text-amber-800' : 'text-indigo-800'
                            }`}
                        >
                            {erHer
                                ? 'Fem spørsmål, fem tydelige svar.'
                                : 'Tre spørsmål, ingen fast lære.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <Scale className="h-5 w-5 shrink-0 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Sorter åtte spørsmål i to kolonner, og se hvor svarene er tydelige.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-[1fr_1.3fr_1fr]">
                {kolonne('her')}

                <div className="flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {phase === 'active' && aktivt ? (
                            <motion.div
                                key={aktivt.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.22 }}
                            >
                                <motion.div
                                    animate={kortKontroll}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center"
                                >
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Spørsmål {index + 1} av {SPORSMAL.length}
                                    </p>
                                    <p className="mt-2 text-base font-semibold text-slate-800">
                                        {aktivt.question}
                                    </p>
                                </motion.div>

                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => velg('her')}
                                        className="rounded-full bg-amber-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                                    >
                                        Livet her og nå
                                    </button>
                                    <button
                                        onClick={() => velg('etter')}
                                        className="rounded-full bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                                    >
                                        Livet etter døden
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 14,
                                        delay: 0.1,
                                    }}
                                    className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500"
                                >
                                    <Check className="h-6 w-6 text-white" />
                                </motion.div>
                                <p className="text-sm font-semibold text-emerald-800">
                                    Alle åtte er plassert
                                </p>
                                <p className="mt-1 text-sm text-emerald-700">
                                    Jødedommen har brukt to tusen år på å finpusse svarene om livet
                                    her og nå. Om det som kommer etterpå, står flere svar side om
                                    side, og ingen av dem er bindende for alle jøder.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {kolonne('etter')}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${feedback.kind}-${index}-${feedback.text.slice(0, 12)}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`mx-5 mb-4 rounded-lg border px-4 py-3 text-sm ${
                        feedback.kind === 'riktig'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : feedback.kind === 'feil'
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-blue-200 bg-blue-50 text-blue-700'
                    }`}
                >
                    {feedback.text}
                </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <p className="text-xs text-slate-500">
                    {plassert.length} av {SPORSMAL.length} plassert
                </p>
                <button
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    <RotateCcw className="h-4 w-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
