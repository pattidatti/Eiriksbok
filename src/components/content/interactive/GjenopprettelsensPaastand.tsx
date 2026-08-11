import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Link2, RotateCcw, Sparkles, X } from 'lucide-react';

interface GjenopprettelsensPaastandProps {
    title?: string;
}

interface Option {
    text: string;
    correct: boolean;
    feedback: string;
}

interface Step {
    question: string;
    options: Option[];
    chainLabel: string;
    chainDetail: string;
}

const CLAIM = 'Kirken Jesus grunnla, gikk tapt etter apostlenes tid.';

const STEPS: Step[] = [
    {
        question: 'Hvis kirken gikk tapt, hvor finnes Guds ord i dag?',
        options: [
            {
                text: 'Bare i Bibelen, akkurat slik den er overlevert',
                correct: false,
                feedback:
                    'Ikke dette svaret. Trosartikkel 8 sier at Bibelen er Guds ord «så langt som den er riktig oversatt». Forbeholdet åpner for at noe kan mangle.',
            },
            {
                text: 'I Bibelen og i skrifter som er åpenbart på nytt',
                correct: true,
                feedback:
                    'Riktig. Kirken har fire hellige bøker: Bibelen, Mormons bok, Lære og pakter og Den kostelige perle.',
            },
            {
                text: 'Ingen steder. Gud sluttet å tale for lenge siden',
                correct: false,
                feedback:
                    'Nei. Da ville hele gjenopprettelsen falle sammen. Poenget til kirken er nettopp at Gud talte igjen.',
            },
        ],
        chainLabel: 'Nye hellige skrifter',
        chainDetail: 'Mormons bok, Lære og pakter, Den kostelige perle',
    },
    {
        question: 'Hvem kan ta imot beskjed fra Gud for hele kirken nå?',
        options: [
            {
                text: 'En levende profet, sammen med tolv apostler',
                correct: true,
                feedback:
                    'Riktig. Kirken ledes av Det første presidentskap og De tolv apostlers quorum. Ifølge kirken mottar mennene i begge organene åpenbaringer direkte fra Gud.',
            },
            {
                text: 'Ingen. Åpenbaringen ble avsluttet med de første apostlene',
                correct: false,
                feedback:
                    'Ikke ifølge denne kirken. Trosartikkel 9 sier at Gud åpenbarer nå, og fortsatt vil åpenbare store og viktige ting.',
            },
            {
                text: 'Hvem som helst som selv føler at de har fått et budskap',
                correct: false,
                feedback:
                    'Nei. Åpenbaring som gjelder hele kirken, er knyttet til bestemte embeter, ikke til hvem som helst.',
            },
        ],
        chainLabel: 'Levende profeter',
        chainDetail: 'Det første presidentskap og De tolv apostlers quorum',
    },
    {
        question: 'Hvem har fullmakt til å utføre en gyldig dåp?',
        options: [
            {
                text: 'Enhver som tror og har lyst',
                correct: false,
                feedback:
                    'Nei. Kirken mener fullmakten må gis videre fra Gud til et menneske, og derfra videre. Den kan ikke tas.',
            },
            {
                text: 'Bare menn som har fylt 30 år',
                correct: false,
                feedback:
                    'Nei. Aldersgrensen stemmer ikke. Det aronske prestedømmet innehas av gutter fra tolv år og oppover, og det melkisedekske fra 18 år.',
            },
            {
                text: 'Den som har prestedømmet, som kirken mener ble gitt tilbake gjennom Joseph Smith',
                correct: true,
                feedback:
                    'Riktig. Det aronske prestedømmet gjelder fra tolv år, det melkisedekske fra 18 år og gir blant annet rett til å reise ut som misjonær.',
            },
        ],
        chainLabel: 'Gjenopprettet prestedømme',
        chainDetail: 'Det aronske fra 12 år, det melkisedekske fra 18 år',
    },
    {
        question: 'Hva med alle som døde lenge før 1830?',
        options: [
            {
                text: 'De står utenfor. Problemet har ingen løsning',
                correct: false,
                feedback: 'Nei. Nettopp dette problemet er en viktig grunn til at templene finnes.',
            },
            {
                text: 'Levende kan la seg døpe på vegne av slektninger som er døde',
                correct: true,
                feedback:
                    'Riktig. Derfor har kirken bygd opp et omfattende slektsarkiv. Uten navn, ingen dåp på vegne av de døde.',
            },
            {
                text: 'De blir født på nytt her på jorda og får en ny sjanse',
                correct: false,
                feedback:
                    'Nei. Kirken lærer at mennesket lever videre som ånd og siden gjenoppstår med sin egen kropp.',
            },
        ],
        chainLabel: 'Templer og dåp for de døde',
        chainDetail: 'Dåp på vegne av slektninger, og besegling av familier',
    },
];

export function GjenopprettelsensPaastand({
    title = 'Hva følger av påstanden?',
}: GjenopprettelsensPaastandProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [picked, setPicked] = useState<number | null>(null);
    const [unlocked, setUnlocked] = useState<number[]>([]);
    const [bomTurer, setBomTurer] = useState(0);

    const step = STEPS[stepIndex];
    const pickedOption = picked === null ? null : step.options[picked];
    const stepSolved = unlocked.includes(stepIndex);
    const allDone = unlocked.length === STEPS.length;
    const isLast = stepIndex === STEPS.length - 1;

    const handlePick = (index: number) => {
        if (stepSolved) return;
        setPicked(index);
        if (step.options[index].correct) {
            setUnlocked((prev) => [...prev, stepIndex]);
        } else {
            setBomTurer((prev) => prev + 1);
        }
    };

    const handleNext = () => {
        setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
        setPicked(null);
    };

    const handleReset = () => {
        setStepIndex(0);
        setPicked(null);
        setUnlocked([]);
        setBomTurer(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Link2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg svaret Jesu Kristi Kirke av Siste Dagers Hellige selv gir. Hvert riktig
                        valg låser opp ett ledd i kjeden.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-5">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                        Påstanden
                    </p>
                    <p className="text-slate-800 font-medium">{CLAIM}</p>
                </div>
                <div className="mx-auto h-4 w-px bg-indigo-200" aria-hidden="true" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {STEPS.map((s, i) => {
                        const open = unlocked.includes(i);
                        return (
                            <motion.div
                                key={s.chainLabel}
                                animate={
                                    open ? { scale: 1, opacity: 1 } : { scale: 0.97, opacity: 0.6 }
                                }
                                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                                className={`rounded-xl border px-3 py-2 ${
                                    open
                                        ? 'border-emerald-200 bg-emerald-50'
                                        : 'border-dashed border-slate-300 bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-1.5">
                                    {open ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400">
                                            {i + 1}
                                        </span>
                                    )}
                                    <p
                                        className={`text-sm font-semibold ${
                                            open ? 'text-emerald-800' : 'text-slate-400'
                                        }`}
                                    >
                                        {open ? s.chainLabel : 'Låst ledd'}
                                    </p>
                                </div>
                                <p
                                    className={`text-xs mt-0.5 ${
                                        open ? 'text-emerald-700' : 'text-slate-400'
                                    }`}
                                >
                                    {open ? s.chainDetail : 'Svar riktig for å se dette leddet'}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="px-6 pt-5">
                <AnimatePresence mode="wait">
                    {allDone ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4"
                        >
                            <div className="flex items-center gap-2">
                                <motion.span
                                    initial={{ rotate: -20, scale: 0.6 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                                >
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                </motion.span>
                                <p className="font-semibold text-emerald-800">
                                    Kjeden henger sammen
                                </p>
                            </div>
                            <p className="text-sm text-emerald-800 mt-2">
                                Nye skrifter, levende profeter, prestedømme og templer ser ut som
                                fire helt ulike ting. De henger alle på det samme leddet øverst.
                                Fjerner du påstanden, faller resten.
                            </p>
                            <p className="text-sm text-emerald-700 mt-2">
                                {bomTurer === 0
                                    ? 'Du traff alle fire på første forsøk.'
                                    : `Du brukte ${bomTurer} bomtur${bomTurer === 1 ? '' : 'er'} underveis. Bommene er ofte de mest lærerike.`}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`sporsmal-${stepIndex}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Spørsmål {stepIndex + 1} av {STEPS.length}
                            </p>
                            <p className="text-slate-800 font-medium mb-3">{step.question}</p>
                            <div className="grid gap-2">
                                {step.options.map((option, i) => {
                                    const isPicked = picked === i;
                                    const reveal = isPicked || (stepSolved && option.correct);
                                    let look = 'border-slate-200 bg-white hover:bg-slate-50';
                                    if (reveal && option.correct) {
                                        look = 'border-emerald-300 bg-emerald-50';
                                    } else if (reveal) {
                                        look = 'border-rose-300 bg-rose-50';
                                    }
                                    return (
                                        <motion.button
                                            key={option.text}
                                            type="button"
                                            onClick={() => handlePick(i)}
                                            whileTap={{ scale: 0.985 }}
                                            className={`text-left rounded-xl border px-4 py-2.5 text-sm text-slate-700 transition-colors ${look}`}
                                        >
                                            <span className="flex items-start gap-2">
                                                {reveal && option.correct && (
                                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                )}
                                                {reveal && !option.correct && (
                                                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                )}
                                                <span>{option.text}</span>
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pickedOption ? `${stepIndex}-${picked}` : `tom-${stepIndex}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            pickedOption === null
                                ? 'border-slate-200 bg-slate-50 text-slate-500'
                                : pickedOption.correct
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : 'border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                    >
                        {pickedOption === null
                            ? allDone
                                ? 'Alle fire leddene er låst opp. Trykk Tilbakestill for å prøve på nytt.'
                                : 'Velg ett av svarene over.'
                            : pickedOption.feedback}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-6 py-5 flex items-center justify-between gap-3">
                {stepSolved && !isLast ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Neste ledd
                    </button>
                ) : (
                    <span className="text-sm text-slate-400">
                        {unlocked.length} av {STEPS.length} ledd låst opp
                    </span>
                )}
                <button
                    type="button"
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
