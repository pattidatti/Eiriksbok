import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Footprints, RotateCcw, Sparkles, Plus, Minus, Gavel } from 'lucide-react';

// Pedagogisk kjerne: eleven skal skille mellom en regel som står igjen og en
// begrunnelse som er byttet ut. Det er selve grepet i en drøfting - og svaret
// på om pietismen fortsatt styrer Norge er derfor "ja og nei", ikke ett tall.

type Verdict = 'sterkt' | 'delvis' | 'nei';

interface SporCase {
    id: string;
    label: string;
    today: string;
    answer: Verdict;
    forArgument: string;
    motArgument: string;
    dom: string;
}

interface PietismensSporProps {
    title?: string;
    cases?: SporCase[];
}

type Phase = 'idle' | 'revealed' | 'complete';

const VERDICTS: { id: Verdict; label: string; short: string }[] = [
    { id: 'sterkt', label: 'Tydelig spor', short: 'Kommer rett fra pietismen' },
    { id: 'delvis', label: 'Delvis - men endret', short: 'Regelen står, grunnen er ny' },
    { id: 'nei', label: 'Sporet er borte', short: 'Her er arven slettet' },
];

const DEFAULT_CASES: SporCase[] = [
    {
        id: 'sondag',
        label: 'Butikkene er stengt på søndag',
        today: 'Helligdagsloven fra 1995 sier at faste utsalgssteder skal holde stengt på helligdager.',
        answer: 'delvis',
        forArgument:
            'Kravet om at søndagen skal være annerledes, kom med forordningen av 1735. Da var kirkegang plikt, og dans, kortspill og handel var forbudt hele dagen.',
        motArgument:
            'Dagens lov nevner ikke Gud. Da regjeringen ville åpne butikkene i 2015, handlet motstanden om fritid, familieliv og frivillig arbeid - og forslaget ble lagt bort.',
        dom: 'Regelen står igjen, men begrunnelsen er byttet ut.',
    },
    {
        id: 'skole',
        label: 'Alle barn må gå på skole',
        today: 'I Norge har hvert eneste barn både rett og plikt til grunnskole.',
        answer: 'sterkt',
        forArgument:
            'Skolen for alle kom i 1739, og den kom fordi konfirmasjonen fra 1736 krevde at ungdommene kunne lese selv. Før det gikk stort sett bare barn av rike folk på skole.',
        motArgument:
            'Det barna skulle lære, var Pontoppidans forklaring til katekismen. Nesten ingenting av innholdet i dagens skole kommer derfra.',
        dom: 'Selve ideen om skole for alle er pietismens arv. Innholdet er det ikke.',
    },
    {
        id: 'konfirmasjon',
        label: 'Halvparten av 15-åringene konfirmerer seg',
        today: 'I 2025 ble 48,8 prosent av alle 15-åringer konfirmert i Den norske kirke.',
        answer: 'sterkt',
        forArgument:
            'Konfirmasjonen ble innført som plikt for alle i 1736, og den var obligatorisk helt til 1912. Pietistene gjorde den til den store overgangen fra barn til voksen.',
        motArgument:
            'I dag er den frivillig. Mange velger humanistisk konfirmasjon i stedet, og den første ble holdt i Oslo i 1951.',
        dom: 'Ritualet overlevde. Tvangen forsvant.',
    },
    {
        id: 'alkohol',
        label: 'Vin og sprit selges bare på polet',
        today: 'Staten eier alt salg av vin, sprit og sterkøl, og butikkene stenger tidlig.',
        answer: 'delvis',
        forArgument:
            'Avholdsbevegelsen vokste ut av bedehusene. I 1913 var omtrent ti prosent av hele befolkningen medlem i en avholdsorganisasjon.',
        motArgument:
            'Avholdssaken var like mye en arbeidersak. Og begrunnelsen i dag er folkehelse: drikkes det mindre i alt, blir færre skadet.',
        dom: 'Pietismen var én motor av flere, ikke den eneste.',
    },
    {
        id: 'blasfemi',
        label: 'Du har lov til å håne en religion',
        today: 'Blasfemiparagrafen ble strøket fra straffeloven i 2015.',
        answer: 'nei',
        forArgument:
            'Paragrafen var en rest fra en tid da staten mente den måtte verne troen mot spott.',
        motArgument:
            'Den ble sist prøvd i retten i 1933, mot forfatteren Arnulf Øverland, og han ble frikjent. I 2015 ble den fjernet helt.',
        dom: 'Her er sporet borte. Loven er endret, ikke bare begrunnelsen.',
    },
];

export function PietismensSpor({
    title = 'Hvor sterkt er sporet?',
    cases = DEFAULT_CASES,
}: PietismensSporProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('idle');
    const [picked, setPicked] = useState<Verdict | null>(null);
    const [hits, setHits] = useState(0);

    const current = cases[index];
    const isLast = index === cases.length - 1;

    const choose = (v: Verdict) => {
        if (phase !== 'idle') return;
        setPicked(v);
        setPhase('revealed');
        if (v === current.answer) setHits((h) => h + 1);
    };

    const next = () => {
        if (isLast) {
            setPhase('complete');
            return;
        }
        setIndex((i) => i + 1);
        setPicked(null);
        setPhase('idle');
    };

    const reset = () => {
        setIndex(0);
        setPhase('idle');
        setPicked(null);
        setHits(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Footprints className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Fem trekk ved Norge i dag. Avgjør hvor mye av hvert av dem som stammer fra
                        pietismen.
                    </p>
                </div>
            </div>

            {phase !== 'complete' && (
                <>
                    {/* Framdrift */}
                    <div className="px-6 pt-4 flex items-center gap-2">
                        {cases.map((c, i) => (
                            <div
                                key={c.id}
                                className={`h-1.5 flex-1 rounded-full ${
                                    i < index
                                        ? 'bg-indigo-400'
                                        : i === index
                                          ? 'bg-indigo-600'
                                          : 'bg-slate-200'
                                }`}
                            />
                        ))}
                        <span className="text-xs text-slate-400 ml-2 tabular-nums shrink-0">
                            {index + 1}/{cases.length}
                        </span>
                    </div>

                    {/* Saken */}
                    <div className="px-6 pt-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                                className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4"
                            >
                                <p className="text-lg font-semibold text-slate-800 leading-snug">
                                    {current.label}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">{current.today}</p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Valgene */}
                    <div className="px-6 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {VERDICTS.map((v) => {
                            const isPicked = picked === v.id;
                            const isAnswer = current.answer === v.id;
                            const done = phase === 'revealed';
                            const tone = !done
                                ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md text-slate-700'
                                : isAnswer
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : isPicked
                                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-400';
                            return (
                                <motion.button
                                    key={v.id}
                                    onClick={() => choose(v.id)}
                                    whileTap={done ? undefined : { scale: 0.97 }}
                                    className={`text-left border rounded-xl px-4 py-3 transition-colors ${tone}`}
                                >
                                    <span className="block text-sm font-semibold">{v.label}</span>
                                    <span className="block text-xs opacity-80 mt-0.5">
                                        {v.short}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Feedback-sone - alltid i DOM-et */}
                    <div className="px-6 pt-4 pb-2 min-h-[132px]">
                        <AnimatePresence mode="wait">
                            {phase === 'idle' ? (
                                <motion.p
                                    key="hint"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-sm text-slate-400 italic"
                                >
                                    Velg en av de tre. Du får se argumentene for og mot etterpå.
                                </motion.p>
                            ) : (
                                <motion.div
                                    key={`svar-${current.id}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-2"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                                            <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                                <Plus className="w-3.5 h-3.5" /> Taler for arven
                                            </p>
                                            <p className="text-sm text-blue-900 mt-1 leading-relaxed">
                                                {current.forArgument}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                                            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wide">
                                                <Minus className="w-3.5 h-3.5" /> Taler imot
                                            </p>
                                            <p className="text-sm text-amber-900 mt-1 leading-relaxed">
                                                {current.motArgument}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="flex items-start gap-2 text-sm text-slate-700 px-1">
                                        <Gavel className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                        <span>{current.dom}</span>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Kontrollrad */}
                    <div className="px-6 pb-5 flex items-center justify-between">
                        <button
                            onClick={next}
                            disabled={phase !== 'revealed'}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            {isLast ? 'Se resultatet' : 'Neste sak'}
                        </button>
                        <button
                            onClick={reset}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Tilbakestill
                        </button>
                    </div>
                </>
            )}

            {phase === 'complete' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                    className="px-6 py-6"
                >
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
                        <p className="flex items-center gap-2 text-emerald-800 font-semibold">
                            <Sparkles className="w-5 h-5" />
                            Du landet på samme svar som fagfolkene i {hits} av {cases.length} saker.
                        </p>
                        <p className="text-sm text-emerald-900 mt-2 leading-relaxed">
                            I en drøfting er det ikke tallet som teller mest. Det som teller, er at
                            du ser forskjellen på en regel som står igjen og en begrunnelse som er
                            byttet ut. Butikkene er fortsatt stengt på søndag, men ingen stenger dem
                            lenger for Guds skyld.
                        </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <button
                            onClick={reset}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            Gå gjennom på nytt
                        </button>
                        <span className="text-xs text-slate-400">
                            Fem saker, tre mulige dommer
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
