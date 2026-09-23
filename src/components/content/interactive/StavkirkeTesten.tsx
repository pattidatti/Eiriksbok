import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Droplets, CheckCircle2, RotateCcw } from 'lucide-react';

// Lyspære-øyeblikket:
// "Etter denne interaksjonen skal eleven forstå at stavkirkene står ennå fordi
//  byggmesterne holdt vannet unna treverket på tre steder samtidig: under det,
//  inni det og utenpå det."
//
// Eleven gjør tre valg. Hvert valg flytter en synlig "hvor lenge står kirken"-
// måler. Bare alle tre riktige gir en kirke som fortsatt står i dag.

interface Option {
    id: string;
    label: string;
    detail: string;
    years: number;
    good: boolean;
    why: string;
}

interface Choice {
    id: string;
    question: string;
    hint: string;
    options: [Option, Option];
}

const CHOICES: Choice[] = [
    {
        id: 'fundament',
        question: 'Hva skal kirken stå på?',
        hint: 'Under treverket',
        options: [
            {
                id: 'stolper',
                label: 'Stolper gravd ned i jorda',
                detail: 'Slik de eldste trekirkene ble bygd',
                years: 100,
                good: false,
                why: 'Jorda er våt. En stolpe som står nede i den, råtner der den er fuktig, og kirken synker.',
            },
            {
                id: 'sviller',
                label: 'En ramme av sviller på stein',
                detail: 'Grunnstokker som hviler på et steinfundament',
                years: 400,
                good: true,
                why: 'Nå står ikke treverket i jorda i det hele tatt. Steinene løfter hele kirken opp fra fukten.',
            },
        ],
    },
    {
        id: 'treverk',
        question: 'Hvilket treverk skal du bruke?',
        hint: 'Inni treverket',
        options: [
            {
                id: 'malmfuru',
                label: 'Malmfuru tørket på rot',
                detail: 'Barken ringes av, og treet står og tørker i flere år før det felles',
                years: 300,
                good: true,
                why: 'Furua fyller seg med harpiks mens den tørker. Harpiksen virker som et innebygd tetningsmiddel.',
            },
            {
                id: 'vanlig',
                label: 'Fersk furu felt med en gang',
                detail: 'Raskest å skaffe',
                years: 60,
                good: false,
                why: 'Ferskt trevirke er fullt av vann. Det svinner, sprekker og tar lett opp ny fukt.',
            },
        ],
    },
    {
        id: 'kledning',
        question: 'Hva skal kirken kles med utenpå?',
        hint: 'Utenpå treverket',
        options: [
            {
                id: 'bar',
                label: 'Ingenting, veggen står bar',
                detail: 'Planken får møte været som den er',
                years: 80,
                good: false,
                why: 'Regnet treffer selve veggen. På Vestlandet regner det over 200 dager i året.',
            },
            {
                id: 'spon',
                label: 'Spon og tjære over alt',
                detail: 'Tusenvis av små trefliser, lag på lag, bredd med tjære',
                years: 250,
                good: true,
                why: 'Sponen er en regnfrakk. Vannet renner av utenpå i stedet for å trekke inn i veggen.',
            },
        ],
    },
];

const BASE_YEARS = 40;
const MAX_YEARS = BASE_YEARS + 400 + 300 + 250; // 990

type Phase = 'idle' | 'active' | 'complete';

interface StavkirkeTestenProps {
    title?: string;
}

export function StavkirkeTesten({ title = 'Byggmesterens tre valg' }: StavkirkeTestenProps) {
    const [picked, setPicked] = useState<Record<string, string>>({});

    const answered = CHOICES.filter((c) => picked[c.id]).length;
    const phase: Phase =
        answered === 0 ? 'idle' : answered < CHOICES.length ? 'active' : 'complete';

    const chosenOptions = CHOICES.map((c) =>
        c.options.find((o) => o.id === picked[c.id])
    ).filter((o): o is Option => Boolean(o));

    const years = chosenOptions.reduce((sum, o) => sum + o.years, BASE_YEARS);
    const allGood = chosenOptions.length === CHOICES.length && chosenOptions.every((o) => o.good);
    const fill = Math.min(100, (years / MAX_YEARS) * 100);

    const lastPicked = chosenOptions[chosenOptions.length - 1];

    const handleReset = () => setPicked({});

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Hammer className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg ett alternativ i hver rad, og se hvor lenge kirken din blir stående.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 space-y-5">
                {CHOICES.map((choice) => (
                    <div key={choice.id}>
                        <div className="flex items-baseline gap-2 mb-2">
                            <p className="text-sm font-semibold text-slate-700">
                                {choice.question}
                            </p>
                            <span className="text-xs text-slate-400">{choice.hint}</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {choice.options.map((option) => {
                                const isPicked = picked[choice.id] === option.id;
                                const decided = Boolean(picked[choice.id]);
                                return (
                                    <motion.button
                                        key={option.id}
                                        onClick={() =>
                                            setPicked((p) => ({ ...p, [choice.id]: option.id }))
                                        }
                                        whileHover={{ scale: 1.015 }}
                                        whileTap={{ scale: 0.985 }}
                                        animate={{
                                            opacity: decided && !isPicked ? 0.5 : 1,
                                        }}
                                        className={`text-left p-3 rounded-xl border transition-colors ${
                                            isPicked
                                                ? option.good
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : 'bg-rose-50 border-rose-200'
                                                : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-md'
                                        }`}
                                    >
                                        <span
                                            className={`block text-sm font-semibold ${
                                                isPicked
                                                    ? option.good
                                                        ? 'text-emerald-800'
                                                        : 'text-rose-800'
                                                    : 'text-slate-700'
                                            }`}
                                        >
                                            {option.label}
                                        </span>
                                        <span className="block text-xs text-slate-500 mt-1 leading-relaxed">
                                            {option.detail}
                                        </span>
                                        <AnimatePresence>
                                            {isPicked && (
                                                <motion.span
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className={`block text-xs mt-2 leading-relaxed overflow-hidden ${
                                                        option.good
                                                            ? 'text-emerald-700'
                                                            : 'text-rose-700'
                                                    }`}
                                                >
                                                    {option.why}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Måleren */}
                <div className="pt-1">
                    <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-600">
                            Kirken din blir stående i omtrent
                        </span>
                        <motion.span
                            key={years}
                            initial={{ scale: 1.25 }}
                            animate={{ scale: 1 }}
                            className="text-sm font-bold text-indigo-700 tabular-nums"
                        >
                            {years} år
                        </motion.span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            animate={{ width: `${fill}%` }}
                            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                            className={`h-full rounded-full ${
                                allGood
                                    ? 'bg-emerald-500'
                                    : phase === 'complete'
                                      ? 'bg-amber-500'
                                      : 'bg-indigo-400'
                            }`}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                        Borgund stavkirke ble bygd på 1180-tallet og står fortsatt. Det er over 840
                        år.
                    </p>
                </div>
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                {phase !== 'idle' && (
                    <motion.div
                        key={phase === 'complete' ? (allGood ? 'win' : 'partial') : 'progress'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mx-6 mb-4 px-4 py-3 rounded-lg border text-sm leading-relaxed ${
                            phase === 'complete'
                                ? allGood
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        {phase === 'active' && (
                            <span className="flex items-start gap-2">
                                <Droplets className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>
                                    {lastPicked?.good
                                        ? 'Bra valg. Du har stengt vannet ute ett sted til. '
                                        : 'Det valget slipper vannet inn. '}
                                    {CHOICES.length - answered} valg igjen.
                                </span>
                            </span>
                        )}
                        {phase === 'complete' && allGood && (
                            <motion.span
                                initial={{ scale: 0.96 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                                className="flex items-start gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>
                                    Dette er oppskriften byggmesterne fant. Vannet stenges ute tre
                                    steder samtidig: steinene holder treverket opp av jorda,
                                    harpiksen tetter treet innenfra, og sponen tar regnet utenpå. Ta
                                    bort én av de tre, og kirken rekker aldri fram til oss.
                                </span>
                            </motion.span>
                        )}
                        {phase === 'complete' && !allGood && (
                            <span className="flex items-start gap-2">
                                <Droplets className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>
                                    Kirken din står en stund, men ikke i 850 år. Det holder ikke å
                                    stenge vannet ute to steder når det slipper inn det tredje.
                                    Prøv å finne kombinasjonen som holder alle tre veiene stengt.
                                </span>
                            </span>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    {answered} av {CHOICES.length} valg gjort
                </span>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
