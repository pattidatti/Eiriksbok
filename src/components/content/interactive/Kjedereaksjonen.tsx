import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, X, RotateCcw, Flag } from 'lucide-react';

interface Option {
    label: string;
    correct?: boolean;
}

interface Step {
    date: string;
    situation: string;
    question: string;
    options: Option[];
    joins: string[];
    why: string;
}

interface KjedereaksjonenProps {
    title?: string;
    steps?: Step[];
}

type Phase = 'playing' | 'complete';

// Startpunktet: de tre som allerede er i krigen 28. februar 2026.
const START_COUNTRIES = ['USA', 'Israel', 'Iran'];

const DEFAULT_STEPS: Step[] = [
    {
        date: '2. mars 2026',
        situation:
            'USA og Israel har angrepet Iran. Iran vil svare, men kan ikke nå USA direkte. Hvem rammer de i stedet?',
        question: 'Hvilket naboland treffer Iran først?',
        options: [{ label: 'Egypt' }, { label: 'Saudi-Arabia', correct: true }, { label: 'Tyrkia' }],
        joins: ['Saudi-Arabia'],
        why: 'Iranske droner traff oljeraffineriet Ras Tanura. Saudi-Arabia er USAs nærmeste allierte i Gulfen - og i tiår hadde de to landene kjempet gjennom andre, aldri mot hverandre.',
    },
    {
        date: '2. mars 2026',
        situation:
            'Samme dag åpnes en ny front mot Israel, fra nord. Angrepet kommer fra en gruppe Iran har støttet med våpen og penger siden 1982.',
        question: 'Hvem angriper Israel fra nord?',
        options: [{ label: 'Hizbollah i Libanon', correct: true }, { label: 'Hamas i Gaza' }, { label: 'Syria' }],
        joins: ['Libanon'],
        why: 'Hizbollah sendte raketter og droner mot Israel. Israel svarte med bombing over hele Libanon, og 17. mars gikk soldater inn i sør. Over 1,1 million libanesere måtte flykte.',
    },
    {
        date: '4. mars 2026',
        situation:
            'Iran mangler fly og raketter nok til å slå tilbake mot USA. Men landet ligger langs et sund der en femtedel av verdens olje fraktes ut.',
        question: 'Hva gjør Iran for å ramme hele verden på én dag?',
        options: [
            { label: 'Stenger Hormuzstredet', correct: true },
            { label: 'Trekker seg ut av FN' },
            { label: 'Stanser all egen oljeeksport' },
        ],
        joins: [],
        why: 'Iran erklærte stredet stengt og angrep skip som passerte. Skipstrafikken falt over 90 prosent. Legg merke til at telleren ikke beveget seg: ingen nye land ble trukket inn i kampene, men hele verden merket det på oljeprisen - også Norge.',
    },
    {
        date: 'Mars 2026',
        situation:
            'Iran fortsetter å svare på amerikanske angrep. Men målene ligger ikke i USA. De ligger hos land som har sagt ja til å huse amerikanske militærbaser.',
        question: 'Hvem blir rammet nå?',
        options: [
            { label: 'Gulfstatene: Emiratene, Qatar, Bahrain og Kuwait', correct: true },
            { label: 'Hellas og Kypros' },
            { label: 'Pakistan og India' },
        ],
        joins: ['Emiratene', 'Qatar', 'Bahrain', 'Kuwait'],
        why: 'Mål i Abu Dhabi, Dubai, Doha, Manama og Kuwait ble truffet. Ingen av landene hadde erklært krig mot Iran. De ble rammet fordi amerikanske styrker sto på jorda deres.',
    },
    {
        date: 'Juli 2026',
        situation:
            'Våpenhvilen fra juni har brutt sammen. Iran leter etter amerikanske styrker innen rekkevidde, og finner dem i et land som ikke har vært nevnt før.',
        question: 'Hvor treffer Iran amerikanske soldater i juli?',
        options: [{ label: 'Jordan', correct: true }, { label: 'Marokko' }, { label: 'Aserbajdsjan' }],
        joins: ['Jordan'],
        why: 'Amerikanske baser i Jordan ble truffet. To soldater ble drept 17. juli, og nesten 100 amerikanere ble såret på to uker.',
    },
];

export function Kjedereaksjonen({
    title = 'Kjedereaksjonen: hvem blir trukket inn?',
    steps = DEFAULT_STEPS,
}: KjedereaksjonenProps) {
    const [phase, setPhase] = useState<Phase>('playing');
    const [idx, setIdx] = useState(0);
    const [picked, setPicked] = useState<number | null>(null);
    const [drawn, setDrawn] = useState<string[]>(START_COUNTRIES);
    const [misses, setMisses] = useState(0);

    const step = steps[idx];
    const isRight = picked !== null && !!step?.options[picked]?.correct;

    const handlePick = (i: number) => {
        if (isRight) return;
        setPicked(i);
        if (!steps[idx].options[i].correct) {
            setMisses((m) => m + 1);
            return;
        }
        setDrawn((prev) => [...prev, ...steps[idx].joins]);
    };

    const handleNext = () => {
        if (idx + 1 >= steps.length) {
            setPhase('complete');
        } else {
            setIdx(idx + 1);
            setPicked(null);
        }
    };

    const handleReset = () => {
        setPhase('playing');
        setIdx(0);
        setPicked(null);
        setDrawn(START_COUNTRIES);
        setMisses(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose my-6">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Zap className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Gjett hvem krigen sprer seg til. Følg alliansene, ikke geografien.
                    </p>
                </div>
            </div>

            {/* Land-teller: alltid synlig, vokser underveis */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Land trukket inn i krigen
                    </span>
                    <motion.span
                        key={drawn.length}
                        initial={{ scale: 1.5, color: '#4f46e5' }}
                        animate={{ scale: 1, color: '#1e293b' }}
                        className="font-mono text-lg font-bold"
                    >
                        {drawn.length}
                    </motion.span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <AnimatePresence>
                        {drawn.map((c) => (
                            <motion.span
                                key={c}
                                initial={{ opacity: 0, scale: 0.6, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                    START_COUNTRIES.includes(c)
                                        ? 'bg-slate-200 border-slate-300 text-slate-600'
                                        : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}
                            >
                                {c}
                            </motion.span>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Interaksjonsflate */}
            <div className="p-5">
                <AnimatePresence mode="wait">
                    {phase === 'playing' && step ? (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                        >
                            <div className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-wider mb-1">
                                {step.date}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-3">{step.situation}</p>
                            <p className="text-sm font-semibold text-slate-800 mb-3">{step.question}</p>

                            <div className="space-y-2">
                                {step.options.map((opt, i) => {
                                    const chosen = picked === i;
                                    const reveal = chosen && picked !== null;
                                    const good = reveal && !!opt.correct;
                                    const bad = reveal && !opt.correct;
                                    return (
                                        <button
                                            key={opt.label}
                                            onClick={() => handlePick(i)}
                                            disabled={isRight}
                                            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all flex items-center justify-between gap-3 ${
                                                good
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                    : bad
                                                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md disabled:opacity-50'
                                            }`}
                                        >
                                            <span>{opt.label}</span>
                                            {good && <Check className="w-4 h-4 flex-shrink-0" />}
                                            {bad && <X className="w-4 h-4 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="text-center py-2"
                        >
                            <motion.div
                                initial={{ rotate: -12, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 mb-3"
                            >
                                <Flag className="w-6 h-6 text-indigo-500" />
                            </motion.div>
                            <p className="text-sm text-slate-700 leading-relaxed max-w-lg mx-auto">
                                {drawn.length} land på under fem måneder. Krigen begynte mellom tre. Nesten ingen av
                                de andre erklærte krig mot Iran - de ble trukket inn fordi de var alliert med noen,
                                eller fordi de huset noens militærbaser. Slik sprer en krig mellom to land seg til en
                                hel region.
                            </p>
                            {misses > 0 && (
                                <p className="text-xs text-slate-400 mt-3">
                                    Du bommet {misses} {misses === 1 ? 'gang' : 'ganger'} underveis.
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone: alltid i DOM-et */}
            <div className="mx-5 mb-4 min-h-[3.25rem]">
                <AnimatePresence mode="wait">
                    {phase === 'playing' && picked !== null ? (
                        <motion.div
                            key={`${idx}-${isRight ? 'ok' : 'no'}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-xs leading-relaxed ${
                                isRight
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            {isRight ? step.why : 'Ikke helt. Tenk på hvem som er alliert med USA - eller med Iran.'}
                        </motion.div>
                    ) : (
                        <div className="px-4 py-3 rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-400">
                            {phase === 'complete'
                                ? 'Kjeden er komplett.'
                                : 'Velg et svar for å se hva som faktisk skjedde.'}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                {phase === 'playing' ? (
                    <button
                        onClick={handleNext}
                        disabled={!isRight}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        {idx + 1 >= steps.length ? 'Se hele kjeden' : 'Neste steg'}
                    </button>
                ) : (
                    <span className="text-xs text-slate-400">
                        Steg {steps.length} av {steps.length}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
