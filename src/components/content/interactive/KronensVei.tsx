import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Landmark, Swords, Check, X, RotateCcw, Sparkles, History } from 'lucide-react';

// Signaturkomponent for artikkelen «Den engelske borgerkrigen».
// Lyspære-øyeblikket: eleven skal se at makta i England svingte fram og
// tilbake mellom kongen, parlamentet og hæren i 60 år. Å fjerne en konge som
// styrte alene, ga ikke folkestyre: Cromwell endte med å styre alene han også.
// Det som til slutt varte, var ikke en ny hersker, men skrevne regler (1689).

type Holder = 'konge' | 'parlament' | 'haer';

interface Hendelse {
    year: string;
    title: string;
    text: string;
    answer: Holder;
    explanation: string;
}

interface KronensVeiProps {
    title?: string;
    events?: Hendelse[];
}

const SETER: { id: Holder; label: string; Icon: typeof Crown; tone: string; dot: string }[] = [
    {
        id: 'konge',
        label: 'Kongen',
        Icon: Crown,
        tone: 'text-amber-600 bg-amber-50 border-amber-200',
        dot: 'bg-amber-400',
    },
    {
        id: 'parlament',
        label: 'Parlamentet',
        Icon: Landmark,
        tone: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        dot: 'bg-indigo-400',
    },
    {
        id: 'haer',
        label: 'Hæren og Cromwell',
        Icon: Swords,
        tone: 'text-rose-600 bg-rose-50 border-rose-200',
        dot: 'bg-rose-400',
    },
];

const STANDARD_HENDELSER: Hendelse[] = [
    {
        year: '1629',
        title: 'Kongen sender parlamentet hjem',
        text: 'Karl 1. er lei av at parlamentet krangler om skatt. Han oppløser det og kaller det ikke inn igjen på elleve år.',
        answer: 'konge',
        explanation:
            'Kongen. Fra 1629 til 1640 styrte Karl helt alene og skaffet penger uten å spørre noen.',
    },
    {
        year: '1640',
        title: 'Skottene gjør opprør',
        text: 'Karl trenger penger til krig mot Skottland. Han må kalle inn parlamentet igjen, og det nye parlamentet begynner å ta fra ham makt.',
        answer: 'parlament',
        explanation:
            'Parlamentet. Det lange parlamentet visste at kongen trengte dem, og brukte det til å begrense makta hans.',
    },
    {
        year: '1645',
        title: 'Slaget ved Naseby',
        text: 'Parlamentets nye hær, der offiserer blir valgt ut etter hva de kan og ikke hvem de er, knuser kongens hær.',
        answer: 'parlament',
        explanation:
            'Parlamentet. Kongen tapte krigen, og parlamentet vant. Men hæren som vant den, begynte å få sin egen vilje.',
    },
    {
        year: '1648',
        title: 'Soldater stenger døra',
        text: 'Soldater stiller seg utenfor parlamentet og nekter de moderate medlemmene å komme inn. Bare de mest radikale slipper inn.',
        answer: 'haer',
        explanation:
            'Hæren. Parlamentet bestemte ikke lenger selv hvem som satt der. Det var soldatene som valgte ut medlemmene.',
    },
    {
        year: '1649',
        title: 'Kongen blir henrettet',
        text: 'Det som er igjen av parlamentet, setter opp en domstol som dømmer kongen til døden. England blir en republikk uten konge.',
        answer: 'parlament',
        explanation:
            'Parlamentet, i alle fall på papiret. Det var restparlamentet som avskaffet kongedømmet, men det fantes bare fordi hæren hadde ryddet salen.',
    },
    {
        year: '1653',
        title: 'Cromwell rydder salen',
        text: 'Oliver Cromwell, lederen for hæren, oppløser parlamentet. Samme år blir han Lord Protector, riksforstander, for resten av livet.',
        answer: 'haer',
        explanation:
            'Hæren og Cromwell. Mannen som hadde kjempet mot en konge som styrte alene, endte med å styre alene selv.',
    },
    {
        year: '1660',
        title: 'Kongen kommer tilbake',
        text: 'Cromwell døde i 1658. To år senere blir sønnen til den henrettede kongen blir hentet hjem som Karl 2.',
        answer: 'konge',
        explanation:
            'Kongen. Etter elleve år uten konge fikk England en konge igjen. Pendelen hadde svingt helt tilbake.',
    },
    {
        year: '1689',
        title: 'Kronen med vilkår',
        text: 'En ny konge og dronning får kronen, men bare hvis de godtar en lov om at de ikke kan kreve skatt, lage lover eller holde hær uten parlamentet.',
        answer: 'parlament',
        explanation:
            'Parlamentet. Og denne gangen ble det varig, fordi makta ble skrevet ned i en lov og ikke hang på én person.',
    },
];

type Fase = 'gjett' | 'svart' | 'ferdig';

export function KronensVei({
    title = 'Hvem har makta?',
    events = STANDARD_HENDELSER,
}: KronensVeiProps) {
    const [steg, setSteg] = useState(0);
    const [fase, setFase] = useState<Fase>('gjett');
    const [valgt, setValgt] = useState<Holder | null>(null);
    const [riktige, setRiktige] = useState(0);

    const hendelse = events[steg];
    const traff = valgt !== null && valgt === hendelse?.answer;
    // Makt-merket står hos den som faktisk har makta etter siste avslørte hendelse
    const merkeHos: Holder | null =
        fase === 'gjett' ? (steg > 0 ? events[steg - 1].answer : null) : hendelse?.answer ?? null;
    const ferdigeSteg = fase === 'gjett' ? steg : steg + 1;

    const gjett = (holder: Holder) => {
        if (fase !== 'gjett') return;
        setValgt(holder);
        if (holder === hendelse.answer) setRiktige((r) => r + 1);
        setFase('svart');
    };

    const neste = () => {
        if (steg + 1 >= events.length) {
            setFase('ferdig');
            return;
        }
        setSteg((s) => s + 1);
        setValgt(null);
        setFase('gjett');
    };

    const handleReset = () => {
        setSteg(0);
        setFase('gjett');
        setValgt(null);
        setRiktige(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <History className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les hva som skjer, og trykk på den som sitter med makta etterpå.
                    </p>
                </div>
            </div>

            {/* Sporet: én prikk per hendelse, farget etter hvem som fikk makta */}
            <div className="px-6 pt-4 flex items-center gap-1.5">
                {events.map((e, i) => {
                    const sete = SETER.find((s) => s.id === e.answer);
                    const vist = i < ferdigeSteg || fase === 'ferdig';
                    return (
                        <div key={e.year + e.title} className="flex-1 flex flex-col items-center gap-1">
                            <motion.div
                                animate={{ scale: vist ? 1 : 0.7 }}
                                className={`h-2 w-full rounded-full ${
                                    vist ? sete?.dot : i === steg ? 'bg-slate-300' : 'bg-slate-100'
                                }`}
                            />
                            <span className="text-[10px] text-slate-400 tabular-nums">{e.year}</span>
                        </div>
                    );
                })}
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 pt-3">
                <AnimatePresence mode="wait">
                    {fase === 'ferdig' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-center"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                                className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-emerald-100 mb-2"
                            >
                                <Sparkles className="w-6 h-6 text-emerald-600" />
                            </motion.div>
                            <p className="font-semibold text-emerald-800">
                                Du gjettet riktig {riktige} av {events.length} ganger.
                            </p>
                            <p className="text-sm text-emerald-700 mt-2 max-w-lg mx-auto">
                                Se på fargene i sporet over. Makta svingte fram og tilbake i 60 år.
                                Å fjerne kongen ga ikke folkestyre, for da tok hæren over. Først i
                                1689 ble makta skrevet ned i en lov. Det var regelen, ikke en ny
                                hersker, som gjorde at den ble liggende hos parlamentet.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={hendelse.year + hendelse.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.18 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"
                        >
                            <p className="text-xs font-semibold text-indigo-500 tabular-nums">
                                {hendelse.year}
                            </p>
                            <p className="font-semibold text-slate-800 mt-0.5">{hendelse.title}</p>
                            <p className="text-slate-700 leading-relaxed mt-1 text-sm">
                                {hendelse.text}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* De tre setene */}
                {fase !== 'ferdig' && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        {SETER.map(({ id, label, Icon, tone }) => {
                            const erValgt = valgt === id;
                            const erFasit = fase === 'svart' && hendelse.answer === id;
                            return (
                                <motion.button
                                    key={id}
                                    onClick={() => gjett(id)}
                                    disabled={fase !== 'gjett'}
                                    whileHover={fase === 'gjett' ? { y: -2 } : undefined}
                                    whileTap={fase === 'gjett' ? { scale: 0.96 } : undefined}
                                    animate={
                                        erValgt && !erFasit
                                            ? { x: [0, -5, 5, -3, 0] }
                                            : { x: 0 }
                                    }
                                    className={`relative rounded-xl border px-2 pt-6 pb-3 flex flex-col items-center gap-1.5 transition-shadow ${
                                        erFasit
                                            ? 'border-emerald-300 bg-emerald-50 shadow-md'
                                            : erValgt
                                              ? 'border-rose-200 bg-rose-50'
                                              : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
                                    } ${fase === 'gjett' ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    {merkeHos === id && (
                                        <motion.div
                                            layoutId="makt-merke"
                                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white rounded-full p-1.5 shadow-md"
                                        >
                                            <Crown className="w-3.5 h-3.5" />
                                        </motion.div>
                                    )}
                                    <span
                                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full border ${tone}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </span>
                                    <span className="text-xs sm:text-sm font-medium text-slate-700 text-center leading-tight">
                                        {label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-6 mb-4 min-h-[64px]">
                <AnimatePresence mode="wait">
                    {fase === 'svart' ? (
                        <motion.div
                            key={`fb-${steg}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex items-start gap-2 ${
                                traff
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                        >
                            {traff ? (
                                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                            ) : (
                                <X className="w-4 h-4 mt-0.5 shrink-0" />
                            )}
                            <span>
                                {traff ? 'Riktig. ' : 'Ikke helt. '}
                                {hendelse.explanation}
                            </span>
                        </motion.div>
                    ) : (
                        <div className="px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm">
                            {fase === 'ferdig'
                                ? 'Trykk Start på nytt for å gå gjennom de 60 årene en gang til.'
                                : 'Kronen viser hvem som hadde makta sist. Hvor havner den nå?'}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <div>
                    {fase === 'svart' && (
                        <button
                            onClick={neste}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            {steg + 1 >= events.length ? 'Se hele sporet' : 'Neste år'}
                        </button>
                    )}
                </div>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
