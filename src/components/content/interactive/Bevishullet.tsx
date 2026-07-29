import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, ArrowRight, Sparkles } from 'lucide-react';

interface BevishulletSpor {
    year: string;
    title: string;
    evidence: string;
    // Hvor stor plass ryktet hadde IGJEN etter dette sporet (0-100).
    gap: number;
    verdict: string;
}

interface BevishulletProps {
    title?: string;
    question?: string;
    spor?: BevishulletSpor[];
    conclusion?: string;
    note?: string;
}

const STANDARD_SPOR: BevishulletSpor[] = [
    {
        year: '1918',
        title: 'Natten i Jekaterinburg',
        evidence:
            'Tsarfamilien blir henrettet i et hus i Jekaterinburg. De nye makthaverne forteller nesten ingenting, og likene blir gjemt et sted ute i skogen.',
        gap: 85,
        verdict:
            'Ingen grav, ingen liste over de døde. Nesten alt måtte gjettes, og da hadde ryktet nesten all plassen det trengte.',
    },
    {
        year: '1920',
        title: 'Kvinnen i kanalen',
        evidence:
            'En ung kvinne blir dratt opp av en kanal i Berlin. Hun vil ikke si hvem hun er. Kort etter sier hun at hun er Anastasia.',
        gap: 80,
        verdict:
            'Nå fantes det en levende person som passet rett inn i hullet. Men at noen ligner og husker ting, er ikke det samme som bevis.',
    },
    {
        year: '1970',
        title: 'Dommen i Vest-Tyskland',
        evidence:
            'Etter mer enn 30 år i retten avviser en vesttysk domstol kravet hennes om å bli anerkjent som Anastasia.',
        gap: 65,
        verdict:
            'Retten sa ikke at hun ikke var Anastasia. Den sa at hun ikke hadde klart å bevise at hun var det. Det er to helt ulike ting.',
    },
    {
        year: '1991',
        title: 'Grava blir åpnet',
        evidence:
            'Massegrava i skogen blir gravd ut. Der ligger ni personer: fem av familien og fire tjenere. To av barna mangler.',
        gap: 40,
        verdict:
            'Endelig fantes det en grav. Men de to som manglet holdt hullet åpent, og ryktet flyttet inn i akkurat det hullet.',
    },
    {
        year: '1994',
        title: 'DNA-et til Anna Anderson',
        evidence:
            'Forskere sammenligner DNA fra vev etter Anna Anderson med DNA fra tsarfamilien. Det passer ikke. Det passer derimot med en helt annen familie.',
        gap: 20,
        verdict:
            'Den mest kjente Anastasia-en var ikke Anastasia. Men så lenge to barn manglet i grava, kunne noen fortsatt håpe.',
    },
    {
        year: '2009',
        title: 'De to som manglet',
        evidence:
            'Levningene fra en andre, mindre grav 70 meter unna blir undersøkt med tre ulike DNA-metoder ved to laboratorier. Det er de to barna som manglet.',
        gap: 2,
        verdict:
            'Hele familien er gjort rede for. Ingen kom seg unna. Hullet er lukket, og gåten er lukket sammen med det.',
    },
];

type Phase = 'gjett' | 'vist';

export function Bevishullet({
    title = 'Bevishullet',
    question = 'Hvor stor plass var det igjen til historien om at Anastasia overlevde?',
    spor = STANDARD_SPOR,
    conclusion = 'Gåten om Anastasia levde ikke fordi noen hadde bevis for at hun overlevde. Den levde fordi det manglet bevis for at hun døde. Da hullet i kildene ble fylt, forsvant gåten av seg selv.',
    note = 'Prosentene er et anslag laget for å vise retningen, ikke et tall hentet fra forskningen.',
}: BevishulletProps) {
    const [index, setIndex] = useState(0);
    const [guess, setGuess] = useState(50);
    const [phase, setPhase] = useState<Phase>('gjett');
    const [done, setDone] = useState(false);

    const current = spor[index];
    const forrigeGap = index === 0 ? 100 : spor[index - 1].gap;
    const vistGap = phase === 'vist' ? current.gap : forrigeGap;
    const bom = Math.abs(guess - current.gap);
    const sisteSpor = index === spor.length - 1;

    const handleReset = () => {
        setIndex(0);
        setGuess(50);
        setPhase('gjett');
        setDone(false);
    };

    const handleVis = () => setPhase('vist');

    const handleNeste = () => {
        if (sisteSpor) {
            setDone(true);
            return;
        }
        setIndex((i) => i + 1);
        setGuess(50);
        setPhase('gjett');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
                <Search className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Gjett først, se så hva kildene faktisk tillot.
                    </p>
                </div>
            </div>

            {/* Sporrekke */}
            <div className="px-6 pt-4 flex flex-wrap gap-1.5">
                {spor.map((s, i) => (
                    <span
                        key={s.year}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            done || i < index
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : i === index
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-400'
                        }`}
                    >
                        {s.year}
                    </span>
                ))}
            </div>

            {!done ? (
                <>
                    {/* Primær interaksjonsflate */}
                    <div className="px-6 py-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.year}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.25 }}
                            >
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                                    {current.year}
                                </p>
                                <h4 className="font-semibold text-slate-800 mt-0.5">
                                    {current.title}
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed mt-1.5">
                                    {current.evidence}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Elevens anslag */}
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <label
                                htmlFor="bevishullet-slider"
                                className="block text-sm font-medium text-slate-700"
                            >
                                {question}
                            </label>
                            <div className="mt-2 flex items-center gap-3">
                                <input
                                    id="bevishullet-slider"
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={guess}
                                    disabled={phase === 'vist'}
                                    onChange={(e) => setGuess(Number(e.target.value))}
                                    className="flex-1 accent-indigo-600 disabled:opacity-50"
                                />
                                <span className="w-14 text-right text-lg font-bold text-slate-800 tabular-nums">
                                    {guess} %
                                </span>
                            </div>
                        </div>

                        {/* Hull-linja */}
                        <div className="mt-4">
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Plass til ryktet
                                </span>
                                <span className="text-xs font-bold text-slate-700 tabular-nums">
                                    {vistGap} %
                                </span>
                            </div>
                            <div className="mt-1.5 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400"
                                    animate={{ width: `${vistGap}%` }}
                                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Feedback-sone */}
                    <div className="px-6">
                        <AnimatePresence mode="wait">
                            {phase === 'vist' ? (
                                <motion.div
                                    key={`vist-${current.year}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed"
                                >
                                    <span className="font-semibold">
                                        {bom <= 10
                                            ? 'Godt anslag. '
                                            : bom <= 25
                                              ? 'Ikke langt unna. '
                                              : 'Litt på siden. '}
                                    </span>
                                    {current.verdict}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={`vent-${current.year}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                                >
                                    Dra skyveknappen dit du tror, og se hva historikerne kunne si.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Kontrollrad */}
                    <div className="px-6 py-5 flex items-center justify-between gap-3">
                        {phase === 'gjett' ? (
                            <button
                                onClick={handleVis}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                            >
                                Vis hva kildene tillot
                            </button>
                        ) : (
                            <button
                                onClick={handleNeste}
                                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                            >
                                {sisteSpor ? 'Se konklusjonen' : 'Neste spor'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={handleReset}
                            className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                        >
                            Tilbakestill
                        </button>
                    </div>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 16 }}
                    className="px-6 py-6"
                >
                    <div className="flex items-center gap-2 text-emerald-600">
                        <motion.span
                            initial={{ rotate: -20, scale: 0.6 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.1 }}
                            className="inline-flex"
                        >
                            <Check className="w-6 h-6" />
                        </motion.span>
                        <h4 className="font-semibold text-slate-800">Hullet er lukket</h4>
                    </div>
                    <div className="mt-3 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-emerald-400"
                            initial={{ width: '65%' }}
                            animate={{ width: '2%' }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                        />
                    </div>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{conclusion}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                            <Sparkles className="w-4 h-4" />
                            Seks spor gjennomgått
                        </span>
                        <button
                            onClick={handleReset}
                            className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                        >
                            Tilbakestill
                        </button>
                    </div>
                </motion.div>
            )}

            <p className="px-6 pb-5 text-xs text-slate-400 leading-relaxed">{note}</p>
        </div>
    );
}
