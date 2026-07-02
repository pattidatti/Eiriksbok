import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Vote, Megaphone, Lock, Scroll, RotateCcw } from 'lucide-react';

interface Law {
    year: string;
    title: string;
    text: string;
    anger: number;
}

interface RoadToRevolutionProps {
    title?: string;
    laws?: Law[];
}

type Phase = 'idle' | 'playing' | 'complete';

const DEFAULT_LAWS: Law[] = [
    {
        year: '1765',
        title: 'Stempelloven',
        text: 'Britene la skatt på alt av papir: aviser, brev, spillkort og dokumenter. Koloniene fikk ikke stemme om loven.',
        anger: 20,
    },
    {
        year: '1767',
        title: 'Townshend-lovene',
        text: 'Ny toll på glass, maling, papir og te. Britiske soldater ble sendt over for å passe på at folk betalte.',
        anger: 20,
    },
    {
        year: '1770',
        title: 'Massakren i Boston',
        text: 'Soldater skjøt inn i en folkemengde og drepte fem menn. Sinnet mot britisk styre vokste seg enda større.',
        anger: 25,
    },
    {
        year: '1773',
        title: 'Te-loven',
        text: 'Britene ga ett selskap enerett på å selge te, med skatt på. Om natten kastet kolonistene teen i havet.',
        anger: 15,
    },
    {
        year: '1774',
        title: 'Tvangslovene',
        text: 'Som straff stengte britene havna i Boston og tok fra byen selvstyret. Nå hadde koloniene fått nok.',
        anger: 20,
    },
];

export function RoadToRevolution({
    title = 'Veien til opprør',
    laws = DEFAULT_LAWS,
}: RoadToRevolutionProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [step, setStep] = useState(0);
    const [anger, setAnger] = useState(0);
    const [denied, setDenied] = useState(false);

    const start = () => {
        setPhase('playing');
        setStep(0);
        setAnger(0);
    };

    const handleReset = () => {
        setPhase('idle');
        setStep(0);
        setAnger(0);
        setDenied(false);
    };

    const protest = () => {
        const law = laws[step];
        const nextAnger = Math.min(100, anger + law.anger);
        setAnger(nextAnger);
        if (step + 1 >= laws.length) {
            setTimeout(() => setPhase('complete'), 650);
        } else {
            setStep(step + 1);
        }
    };

    const tryToVote = () => {
        setDenied(true);
        setTimeout(() => setDenied(false), 1600);
    };

    // Fargen på sinne-måleren skifter grønn -> gul -> oransje -> rød
    const meterColor =
        anger < 35 ? '#10b981' : anger < 65 ? '#f59e0b' : anger < 90 ? '#f97316' : '#e11d48';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Flame className="w-5 h-5 text-rose-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du er kolonist. Reager på hver britiske lov og se sinnet vokse.
                    </p>
                </div>
            </div>

            <div className="p-6">
                {/* Sinne-måler — alltid synlig */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                        <span className="font-medium text-slate-600">Sinne i koloniene</span>
                        <span className="font-semibold" style={{ color: meterColor }}>
                            {anger}%
                        </span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: meterColor }}
                            animate={{ width: `${anger}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                        />
                    </div>
                </div>

                {/* Fast beskjed: koloniene har ingen stemme */}
                <motion.div
                    animate={denied ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`mb-5 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        denied
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                >
                    <Lock className="w-4 h-4 shrink-0" />
                    {denied
                        ? 'Du kan ikke stemme! Koloniene har null representanter i parlamentet i London.'
                        : 'Representanter i det britiske parlamentet: 0'}
                </motion.div>

                {/* Interaksjonsflate */}
                {phase === 'idle' && (
                    <div className="text-center py-4">
                        <p className="text-slate-600 mb-4">
                            Mellom 1765 og 1774 kom lov etter lov fra London. Klikk under for å
                            oppleve dem, én etter én.
                        </p>
                        <button
                            onClick={start}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            Start
                        </button>
                    </div>
                )}

                {phase === 'playing' && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xs font-bold text-white bg-slate-700 rounded px-2 py-0.5">
                                        {laws[step].year}
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                        {laws[step].title}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600">{laws[step].text}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={protest}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
                                >
                                    <Megaphone className="w-4 h-4" />
                                    Protester!
                                </button>
                                <button
                                    onClick={tryToVote}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
                                >
                                    <Vote className="w-4 h-4" />
                                    Stem imot i parlamentet
                                </button>
                            </div>
                            <p className="text-center text-xs text-slate-400 mt-3">
                                Lov {step + 1} av {laws.length}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                )}

                {phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 140, damping: 14 }}
                        className="text-center rounded-lg border border-emerald-200 bg-emerald-50 p-6"
                    >
                        <motion.div
                            initial={{ rotate: -12, scale: 0.6 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.1 }}
                            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3"
                        >
                            <Scroll className="w-7 h-7 text-emerald-600" />
                        </motion.div>
                        <h4 className="text-lg font-bold text-emerald-800 mb-1">
                            4. juli 1776: Uavhengighetserklæringen
                        </h4>
                        <p className="text-sm text-emerald-700 mb-3">
                            Sinnet nådde toppen. Siden koloniene aldri fikk en stemme, fantes bare
                            én vei igjen: å bryte helt med kongen og styre seg selv.
                        </p>
                        <p className="text-base font-semibold text-emerald-800 italic">
                            «Alle mennesker er skapt like.»
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-end">
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
