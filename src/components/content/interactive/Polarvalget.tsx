import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake, Flag, RotateCcw, Check } from 'lucide-react';

// Lyspære-øyeblikket: eleven skal forstå at Amundsen vant fordi hvert valg var
// tilpasset isen slik den faktisk er - ikke fordi han var modigere enn Scott.
// Eleven velger selv utstyr og plan, ser sleden krype mot polen for hvert valg,
// og oppdager at ett valg som passer et annet klima er nok til å stanse turen.

interface PolarvalgetOption {
    id: string;
    label: string;
    km: number;
    feedback: string;
    team?: 'amundsen' | 'scott';
}

interface PolarvalgetCategory {
    id: string;
    question: string;
    options: PolarvalgetOption[];
}

interface PolarvalgetProps {
    title?: string;
    subtitle?: string;
    /** Avstanden eleven må dekke for å nå polen. */
    goalKm?: number;
    categories?: PolarvalgetCategory[];
}

type Phase = 'velger' | 'ferdig';

// Tallene er pedagogiske, ikke historiske målinger: de viser hvilken retning
// hvert valg trakk turen, slik kildene beskriver den.
const DEFAULT_CATEGORIES: PolarvalgetCategory[] = [
    {
        id: 'klaer',
        question: 'Hva har mannskapet på seg?',
        options: [
            {
                id: 'ull',
                label: 'Tett ullstoff, som hjemme i Europa',
                km: 200,
                feedback:
                    'Tett stoff holder svetten inne. Svetten fryser til is mot huden, og da blir du kaldere jo hardere du jobber.',
                team: 'scott',
            },
            {
                id: 'skinn',
                label: 'Løse pelsklær av reinskinn, slik inuittene bruker',
                km: 700,
                feedback:
                    'Riktig. Amundsen gikk i inuittenes reinskinnsklær i tjue måneder på Gjøa-ferden, og mente de var det beste man kunne bruke om vinteren.',
                team: 'amundsen',
            },
        ],
    },
    {
        id: 'trekkraft',
        question: 'Hva skal dra sleden?',
        options: [
            {
                id: 'motor',
                label: 'Motorsleder',
                km: 150,
                feedback:
                    'Motorene var splitter nye, men de brøt sammen etter få dager i kulda. Da måtte mennene dra sledene selv.',
                team: 'scott',
            },
            {
                id: 'ponni',
                label: 'Ponnier',
                km: 300,
                feedback:
                    'Ponniene tålte ikke kulda, sank ned i snøen og måtte til slutt avlives.',
                team: 'scott',
            },
            {
                id: 'hunder',
                label: 'Grønlandshunder',
                km: 800,
                feedback:
                    'Riktig. Hundene løp oppå snøen i stedet for å synke ned i den, og de trakk mens mennene stod på ski ved siden av.',
                team: 'amundsen',
            },
        ],
    },
    {
        id: 'mat',
        question: 'Hvordan tar dere med maten?',
        options: [
            {
                id: 'alt',
                label: 'Alt på sleden fra første dag',
                km: 250,
                feedback:
                    'En slede full av mat blir så tung at farten forsvinner. Og går maten tom, finnes det ingenting foran deg.',
                team: 'scott',
            },
            {
                id: 'depot',
                label: 'Depoter lagt ut på forhånd langs ruta',
                km: 750,
                feedback:
                    'Riktig. Amundsen kjørte ut mat og brensel om høsten, så sleden var lett og maten ventet på dem hele veien.',
                team: 'amundsen',
            },
        ],
    },
    {
        id: 'tempo',
        question: 'Hvor langt går dere hver dag?',
        options: [
            {
                id: 'maks',
                label: 'Så langt dere orker, hver eneste dag',
                km: 200,
                feedback:
                    'Da tapper dere både folk og dyr. På isen er det den som orker å fortsette i måneder som kommer fram.',
                team: 'scott',
            },
            {
                id: 'fast',
                label: 'En fast dagsetappe, og så hvile',
                km: 700,
                feedback:
                    'Riktig. Korte, faste etapper med hvile gjorde at mannskapet var i form hele veien til polen og hjem igjen.',
                team: 'amundsen',
            },
        ],
    },
];

export function Polarvalget({
    title = 'Polarvalget',
    subtitle = 'Velg utstyret og planen. Se hvor langt sleden kommer.',
    goalKm = 2600,
    categories = DEFAULT_CATEGORIES,
}: PolarvalgetProps) {
    const [valg, setValg] = useState<Record<string, string>>({});
    const [sisteFeedback, setSisteFeedback] = useState<string | null>(null);

    const antallValgt = Object.keys(valg).length;
    const phase: Phase = antallValgt === categories.length ? 'ferdig' : 'velger';

    const sumKm = useMemo(
        () =>
            categories.reduce((sum, kat) => {
                const valgtId = valg[kat.id];
                const opt = kat.options.find((o) => o.id === valgtId);
                return sum + (opt ? opt.km : 0);
            }, 0),
        [categories, valg]
    );

    const naaddePolen = phase === 'ferdig' && sumKm >= goalKm;
    const andel = Math.min(1, sumKm / goalKm);

    const handleVelg = (kat: PolarvalgetCategory, opt: PolarvalgetOption) => {
        setValg((v) => ({ ...v, [kat.id]: opt.id }));
        setSisteFeedback(opt.feedback);
    };

    const handleReset = () => {
        setValg({});
        setSisteFeedback(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Snowflake className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>

            {/* Rutemåler */}
            <div className="px-5 pt-5">
                <div className="relative h-9">
                    <div className="absolute left-0 right-0 top-4 h-2 rounded-full bg-slate-100" />
                    <motion.div
                        className="absolute left-0 top-4 h-2 rounded-full bg-indigo-400"
                        animate={{ width: `${andel * 100}%` }}
                        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                    />
                    <motion.div
                        className="absolute top-0 -ml-4 flex flex-col items-center"
                        animate={{ left: `${andel * 100}%` }}
                        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                    >
                        <span className="text-lg leading-none" aria-hidden="true">
                            🛷
                        </span>
                    </motion.div>
                    <Flag className="absolute right-0 top-2 w-5 h-5 text-rose-500" />
                </div>
                <div className="flex items-baseline justify-between text-xs text-slate-500 mt-1">
                    <span>Framheim</span>
                    <span className="font-semibold text-slate-700">
                        {sumKm} km av {goalKm} km
                    </span>
                    <span>Sydpolen</span>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-5 grid gap-4 sm:grid-cols-2">
                {categories.map((kat) => {
                    const valgtId = valg[kat.id];
                    return (
                        <div
                            key={kat.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                            <p className="text-sm font-semibold text-slate-700 mb-2">
                                {kat.question}
                            </p>
                            <div className="flex flex-col gap-2">
                                {kat.options.map((opt) => {
                                    const erValgt = valgtId === opt.id;
                                    const erAmundsen = opt.team === 'amundsen';
                                    const visFasit = phase === 'ferdig';
                                    return (
                                        <motion.button
                                            key={opt.id}
                                            onClick={() => handleVelg(kat, opt)}
                                            whileTap={{ scale: 0.97 }}
                                            className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                                                erValgt
                                                    ? erAmundsen
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                        : 'bg-rose-50 border-rose-200 text-rose-800'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className="flex items-start gap-2">
                                                {erValgt && (
                                                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                                                )}
                                                <span>
                                                    {opt.label}
                                                    {visFasit && erAmundsen && (
                                                        <span className="ml-1 text-xs font-semibold text-emerald-600">
                                                            (Amundsen valgte dette)
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-5 mb-4 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {naaddePolen ? (
                        <motion.div
                            key="seier"
                            initial={{ opacity: 0, scale: 0.94, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <span className="font-semibold">Dere nådde Sydpolen.</span> Alle fire
                            valgene var tilpasset isen slik den faktisk er. Det var ikke flaks:
                            Amundsen tok nøyaktig de samme valgene.
                        </motion.div>
                    ) : phase === 'ferdig' ? (
                        <motion.div
                            key="stanset"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm"
                        >
                            <span className="font-semibold">Sleden stanset på isen.</span> Ett valg
                            som passer et annet klima er nok. Bytt de røde valgene og se hva som
                            skjer.
                        </motion.div>
                    ) : (
                        <motion.div
                            key={sisteFeedback ?? 'tom'}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm"
                        >
                            {sisteFeedback ??
                                'Velg ett svar i hver av de fire rutene. Sleden flytter seg for hvert valg.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {antallValgt} av {categories.length} valg gjort
                </span>
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
