import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Sparkles, RotateCcw } from 'lucide-react';

interface Dilemma {
    id: string;
    question: string;
    // Ett svar per sone, i rekkefølge fra "bare nytte" til "ren egenverdi".
    answers: string[];
}

interface NaturensVerdiProps {
    title?: string;
    intro?: string;
    dilemmas?: Dilemma[];
    leftLabel?: string;
    rightLabel?: string;
    costLow?: string;
    costHigh?: string;
}

type Phase = 'idle' | 'active' | 'complete';

interface Zone {
    name: string;
    line: string;
    chip: string;
    dot: string;
    bar: string;
}

// Fire soner langs spaken. Navnene følger begrepene i miljøetikken:
// antroposentrisk (bare mennesker har egenverdi), biosentrisk (alt levende har
// egenverdi) og økosentrisk (helheter som skoger og elver har egenverdi).
const ZONES: Zone[] = [
    {
        name: 'Naturen som ressurs',
        line: 'Bare mennesker teller for sin egen del. Naturen er verdifull fordi vi trenger den. Dette kalles et antroposentrisk syn.',
        chip: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        bar: 'from-amber-300 to-amber-500',
    },
    {
        name: 'Mennesket først, men med grenser',
        line: 'Mennesker teller mest, men vi skal ikke ødelegge mer enn vi må. Fortsatt antroposentrisk, men med omtanke for de som kommer etter oss.',
        chip: 'bg-lime-100 text-lime-800 border-lime-200',
        dot: 'bg-lime-500',
        bar: 'from-lime-300 to-lime-500',
    },
    {
        name: 'Alt levende teller',
        line: 'Hvert levende vesen har verdi i seg selv, ikke bare mennesker. Dette kalles et biosentrisk syn.',
        chip: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        bar: 'from-emerald-300 to-emerald-500',
    },
    {
        name: 'Helheten teller',
        line: 'Skogen, elva og arten har verdi som helhet, ikke bare de enkelte dyrene i den. Dette kalles et økosentrisk syn.',
        chip: 'bg-teal-100 text-teal-800 border-teal-200',
        dot: 'bg-teal-500',
        bar: 'from-teal-300 to-teal-500',
    },
];

const DEFAULT_DILEMMAS: Dilemma[] = [
    {
        id: 'elva',
        question: 'Ei elv kan bygges ut til vannkraft.',
        answers: [
            'Bygg ut. Strøm til folk veier tyngst.',
            'Bygg ut, men la nok vann stå igjen til at elva lever.',
            'Bare hvis fisken og dyrelivet i elva klarer seg.',
            'Nei. Elva er et helt system, ikke en maskin som venter på å bli slått på.',
        ],
    },
    {
        id: 'vindpark',
        question: 'En vindpark kutter klimagasser, men tar urørt fjell.',
        answers: [
            'Bygg. Klimaendringer rammer mennesker, fjellet kjenner ingenting.',
            'Bygg, men legg parken der færrest folk og dyr blir berørt.',
            'Vanskelig. Både dyra i fjellet og folk i framtida taper noe her.',
            'Nei. Du kan ikke redde naturen ved å bygge ned naturen.',
        ],
    },
    {
        id: 'furuskogen',
        question: 'En 300 år gammel furuskog som ingen mennesker besøker, kan hogges.',
        answers: [
            'Hogg. Er skogen ikke til nytte for noen, taper ingen noe.',
            'Hogg, men plant ny skog etterpå.',
            'Nei. Trærne og dyra der lever, enten vi ser dem eller ikke.',
            'Nei. Det tok 300 år å bygge dette samspillet. Vi kan ikke lage det på nytt.',
        ],
    },
];

function zoneIndex(value: number): number {
    if (value < 25) return 0;
    if (value < 50) return 1;
    if (value < 75) return 2;
    return 3;
}

export function NaturensVerdi({
    title = 'Hva er naturen verdt?',
    intro = 'Dra i spaken. Se hvordan svarene under endrer seg.',
    dilemmas = DEFAULT_DILEMMAS,
    leftLabel = 'Verdifull fordi vi trenger den',
    rightLabel = 'Verdifull i seg selv',
    costLow = 'Prisen: Hvis naturen bare er verdt det vi får ut av den, er en skog ingen bruker verdt null. Da gjør heller ikke det siste mennesket på jorda noe galt om det hogger ned alt før det dør.',
    costHigh = 'Prisen: Hvis alt i naturen er like verdifullt, blir det også galt å felle et tre for å bygge hus, eller å pløye en åker for å dyrke mat.',
}: NaturensVerdiProps) {
    const [value, setValue] = useState(38);
    const [seenLow, setSeenLow] = useState(false);
    const [seenHigh, setSeenHigh] = useState(false);
    const [phase, setPhase] = useState<Phase>('idle');

    const zi = zoneIndex(value);
    const zone = ZONES[zi];
    const bothSeen = seenLow && seenHigh;

    const handleChange = (next: number) => {
        setValue(next);
        if (phase === 'idle') setPhase('active');
        let low = seenLow;
        let high = seenHigh;
        if (next <= 4 && !seenLow) {
            low = true;
            setSeenLow(true);
        }
        if (next >= 96 && !seenHigh) {
            high = true;
            setSeenHigh(true);
        }
        if (low && high) setPhase('complete');
    };

    const handleReset = () => {
        setValue(38);
        setSeenLow(false);
        setSeenHigh(false);
        setPhase('idle');
    };

    // Hvilken melding feedback-sonen skal vise akkurat nå.
    const feedback = useMemo(() => {
        if (bothSeen) {
            return {
                key: 'done',
                tone: 'bg-indigo-50 border-indigo-200 text-indigo-800',
                icon: true,
                text: 'Du har kjent på begge prisene. Det er derfor de fleste havner et sted mellom ytterpunktene, og det er derfor folk kan være uenige om naturen uten at noen av dem lyver om fakta.',
            };
        }
        if (value <= 4) {
            return { key: 'low', tone: 'bg-amber-50 border-amber-200 text-amber-800', icon: false, text: costLow };
        }
        if (value >= 96) {
            return { key: 'high', tone: 'bg-teal-50 border-teal-200 text-teal-800', icon: false, text: costHigh };
        }
        return {
            key: 'zone',
            tone: 'bg-slate-50 border-slate-200 text-slate-600',
            icon: false,
            text: zone.line,
        };
    }, [bothSeen, value, zone.line, costLow, costHigh]);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate: spaken */}
            <div className="px-5 pt-5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2 gap-3">
                    <span className="max-w-[42%] leading-tight">{leftLabel}</span>
                    <span className="max-w-[42%] leading-tight text-right">{rightLabel}</span>
                </div>

                <div className="relative">
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${zone.bar}`}
                            animate={{ width: `${value}%` }}
                            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                        />
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={value}
                        onChange={(e) => handleChange(Number(e.target.value))}
                        aria-label="Hvor mye vekt gir du naturens egen verdi?"
                        className="absolute inset-0 w-full h-2.5 opacity-0 cursor-pointer"
                    />
                    <motion.div
                        className="pointer-events-none absolute top-1/2 w-6 h-6 rounded-full bg-white border-2 border-slate-300 shadow-md"
                        style={{ left: `calc(${value}% - 12px)`, translateY: '-50%' }}
                        animate={{ scale: value <= 4 || value >= 96 ? 1.18 : 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                    />
                </div>

                {/* Posisjonen eleven står i akkurat nå */}
                <div className="mt-5 flex items-center gap-2 flex-wrap">
                    <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                        Ditt syn nå
                    </span>
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={zone.name}
                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.18 }}
                            className={`px-3 py-1 rounded-full text-sm font-semibold border ${zone.chip}`}
                        >
                            {zone.name}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            {/* Dilemmaene som svarer i sanntid */}
            <div className="px-5 pt-4 pb-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                {dilemmas.map((d) => {
                    const answer = d.answers[Math.min(zi, d.answers.length - 1)];
                    return (
                        <div
                            key={d.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col gap-2"
                        >
                            <p className="text-sm font-semibold text-slate-700 leading-snug">
                                {d.question}
                            </p>
                            <div className="flex items-start gap-2">
                                <motion.span
                                    layout
                                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${zone.dot}`}
                                />
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={`${d.id}-${zi}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-sm text-slate-600 leading-snug"
                                    >
                                        {answer}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Feedback-sonen: alltid til stede */}
            <div className="px-5 pt-3">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feedback.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: feedback.key === 'done' ? [0.97, 1.02, 1] : 1,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className={`px-4 py-3 rounded-lg border text-sm leading-snug flex gap-2 ${feedback.tone}`}
                    >
                        {feedback.icon && <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />}
                        <span>{feedback.text}</span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-medium">Prøv begge ytterpunktene:</span>
                    <span className="flex items-center gap-1.5">
                        <motion.span
                            animate={{ scale: seenLow ? [1, 1.4, 1] : 1 }}
                            transition={{ duration: 0.35 }}
                            className={`w-2.5 h-2.5 rounded-full ${
                                seenLow ? 'bg-amber-500' : 'bg-slate-200'
                            }`}
                        />
                        helt til venstre
                    </span>
                    <span className="flex items-center gap-1.5">
                        <motion.span
                            animate={{ scale: seenHigh ? [1, 1.4, 1] : 1 }}
                            transition={{ duration: 0.35 }}
                            className={`w-2.5 h-2.5 rounded-full ${
                                seenHigh ? 'bg-teal-500' : 'bg-slate-200'
                            }`}
                        />
                        helt til høyre
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors shrink-0"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
