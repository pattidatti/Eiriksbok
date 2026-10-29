import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    Factory,
    RotateCcw,
    Scissors,
    Ship,
    Shirt,
    Sparkles,
    Store,
    Tag,
    Wheat,
} from 'lucide-react';

// TskjortePrisen: eleven gjetter først hvor mye syerskene får av en T-skjorte til 100 kroner.
// Så følger eleven skjorta fra stoffet til butikkhylla, og prisstolpen bygges opp ledd for ledd.
//
// Lyspære-øyeblikket: Syerskene som lager skjorta, får under 1 krone av 100. Mesteparten av
// prisen legges på etter at skjorta har forlatt fabrikken i Bangladesh.
//
// Tallene er anslag fra Clean Clothes Campaign for en T-skjorte sydd i Bangladesh og solgt
// i Europa, gjengitt av Statista (Richter, 2025). Se kildelista i artikkelen.

interface TskjortePrisenProps {
    title?: string;
}

interface Ledd {
    id: string;
    navn: string;
    sted: string;
    kroner: number;
    visning: string;
    ikon: typeof Shirt;
    farge: string;
    tekst: string;
    forklaring: string;
}

const LEDD: Ledd[] = [
    {
        id: 'stoff',
        navn: 'Bomull og stoff',
        sted: 'Råvarene',
        kroner: 12,
        visning: '12 kr',
        ikon: Wheat,
        farge: 'bg-amber-400',
        tekst: 'text-amber-700',
        forklaring: 'Bomullen, stoffet og trådene koster rundt 12 kroner av de 100.',
    },
    {
        id: 'syersker',
        navn: 'Syerskene',
        sted: 'Fabrikken i Bangladesh',
        kroner: 0.8,
        visning: 'under 1 kr',
        ikon: Scissors,
        farge: 'bg-rose-500',
        tekst: 'text-rose-700',
        forklaring:
            'Arbeiderne som klipper og syr skjorta, får til sammen under 1 krone. Det er så lite at stripen nesten ikke synes.',
    },
    {
        id: 'fabrikk',
        navn: 'Fabrikkeieren',
        sted: 'Fabrikken i Bangladesh',
        kroner: 4,
        visning: '4 kr',
        ikon: Factory,
        farge: 'bg-orange-500',
        tekst: 'text-orange-700',
        forklaring: 'Eieren av fabrikken sitter igjen med rundt 4 kroner i overskudd.',
    },
    {
        id: 'skip',
        navn: 'Transporten',
        sted: 'Skip og lastebil',
        kroner: 8,
        visning: '8 kr',
        ikon: Ship,
        farge: 'bg-sky-500',
        tekst: 'text-sky-700',
        forklaring: 'Frakten fra fabrikken til butikken koster rundt 8 kroner.',
    },
    {
        id: 'merke',
        navn: 'Merkevaren',
        sted: 'Selskapet bak merket',
        kroner: 12,
        visning: '12 kr',
        ikon: Tag,
        farge: 'bg-violet-500',
        tekst: 'text-violet-700',
        forklaring:
            'Selskapet som eier merket og bestilte skjorta, tjener rundt 12 kroner.',
    },
    {
        id: 'butikk',
        navn: 'Butikken',
        sted: 'Butikken der du handler',
        kroner: 60,
        visning: 'nesten 60 kr',
        ikon: Store,
        farge: 'bg-indigo-500',
        tekst: 'text-indigo-700',
        forklaring:
            'Den største biten havner i butikken: husleie, lønn til de ansatte, moms og overskudd. Nesten 60 kroner.',
    },
];

const SUM = LEDD.reduce((s, l) => s + l.kroner, 0);
const SYERSKER = LEDD.find((l) => l.id === 'syersker')!;

type Phase = 'gjett' | 'reise' | 'ferdig';

export function TskjortePrisen({ title = 'Hvem får pengene for T-skjorta?' }: TskjortePrisenProps) {
    const [phase, setPhase] = useState<Phase>('gjett');
    const [gjett, setGjett] = useState(10);
    const [steg, setSteg] = useState(0);

    const viste = phase === 'gjett' ? [] : LEDD.slice(0, steg);
    const aktiv = viste[viste.length - 1];

    const handleStart = () => {
        setPhase('reise');
        setSteg(1);
    };

    const handleNeste = () => {
        if (steg < LEDD.length) {
            setSteg(steg + 1);
        } else {
            setPhase('ferdig');
        }
    };

    const handleReset = () => {
        setPhase('gjett');
        setGjett(10);
        setSteg(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Shirt className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        En T-skjorte sydd i Bangladesh koster 100 kroner i butikken. Gjett først,
                        og følg så pengene.
                    </p>
                </div>
            </div>

            {/* Interaksjonsflate */}
            <div className="p-6 space-y-5">
                {phase === 'gjett' ? (
                    <div className="space-y-3">
                        <p className="text-slate-700 font-medium">
                            Hvor mange av de 100 kronene tror du syerskene som lagde skjorta, får?
                        </p>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={0}
                                max={40}
                                value={gjett}
                                onChange={(e) => setGjett(Number(e.target.value))}
                                className="flex-1 accent-indigo-600"
                                aria-label="Ditt gjett i kroner"
                            />
                            <motion.span
                                key={gjett}
                                initial={{ scale: 1.25 }}
                                animate={{ scale: 1 }}
                                className="w-20 text-right text-2xl font-bold text-indigo-600"
                            >
                                {gjett} kr
                            </motion.span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="px-3 py-1 rounded-full bg-slate-100">
                            Ditt gjett: <strong className="text-slate-800">{gjett} kr</strong>
                        </span>
                        <span className="text-slate-400">til syerskene</span>
                    </div>
                )}

                {/* Reisen: stasjonene */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {LEDD.map((l, i) => {
                        const Ikon = l.ikon;
                        const synlig = i < viste.length;
                        const naa = synlig && i === viste.length - 1 && phase === 'reise';
                        return (
                            <motion.div
                                key={l.id}
                                animate={{
                                    scale: naa ? 1.06 : 1,
                                    opacity: synlig ? 1 : 0.35,
                                }}
                                className={`rounded-xl border p-2 text-center ${
                                    naa
                                        ? 'border-indigo-300 bg-indigo-50 shadow-md'
                                        : 'border-slate-200 bg-slate-50'
                                }`}
                            >
                                <Ikon
                                    className={`w-5 h-5 mx-auto ${synlig ? l.tekst : 'text-slate-400'}`}
                                />
                                <div className="mt-1 text-xs font-semibold text-slate-700 leading-tight">
                                    {l.navn}
                                </div>
                                <div className={`text-xs ${synlig ? l.tekst : 'text-slate-400'}`}>
                                    {synlig ? l.visning : '?'}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Prisstolpen */}
                <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>0 kr</span>
                        <span>Prisen i butikken: 100 kr</span>
                    </div>
                    <div className="h-8 w-full rounded-full bg-slate-100 overflow-hidden flex">
                        {viste.map((l) => (
                            <motion.div
                                key={l.id}
                                initial={{ width: 0 }}
                                animate={{ width: `${(l.kroner / SUM) * 100}%` }}
                                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                                className={`${l.farge} h-full ${
                                    l.id === 'syersker' ? 'min-w-[3px]' : ''
                                }`}
                                title={`${l.navn}: ${l.visning}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Feedback-sone (alltid til stede) */}
            <div className="mx-6 mb-4 min-h-[72px]">
                <AnimatePresence mode="wait">
                    {phase === 'gjett' && (
                        <motion.div
                            key="gjett"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Dra i glideren og trykk «Følg skjorta» når du har bestemt deg.
                        </motion.div>
                    )}
                    {phase === 'reise' && aktiv && (
                        <motion.div
                            key={aktiv.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm"
                        >
                            <span className={`font-semibold ${aktiv.tekst}`}>
                                {aktiv.sted}:
                            </span>{' '}
                            {aktiv.forklaring}
                        </motion.div>
                    )}
                    {phase === 'ferdig' && (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm space-y-1"
                        >
                            <div className="flex items-center gap-2 font-semibold">
                                <motion.span
                                    animate={{ rotate: [0, 20, -20, 0] }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.span>
                                Du gjettet {gjett} kr. Syerskene får {SYERSKER.visning}.
                            </div>
                            <p>
                                Mesteparten av prisen legges på etter at skjorta har forlatt
                                fabrikken: hos merkevaren, i transporten og i butikken. Om
                                syerskene fikk dobbelt så mye lønn, ville skjorta likevel ikke
                                blitt 1 krone dyrere.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'gjett' && (
                    <button
                        onClick={handleStart}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        Følg skjorta <ArrowRight className="w-4 h-4" />
                    </button>
                )}
                {phase === 'reise' && (
                    <button
                        onClick={handleNeste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        {steg < LEDD.length ? 'Neste stopp' : 'Se svaret'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
                {phase === 'ferdig' && <span className="text-sm text-slate-400">Ferdig!</span>}
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
