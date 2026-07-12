import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreePine, Waves, Sparkles, RotateCcw, ArrowRight, Coins } from 'lucide-react';

interface Station {
    label: string;
    icon: 'tre' | 'elv' | 'sag' | 'skip';
    value: number;
    worker: string;
    explanation: string;
}

interface TrelastVerdikjedeProps {
    title?: string;
    stations?: Station[];
}

// Signaturkomponent for artikkelen "Trelasthandelen".
// Lyspære-øyeblikk: en rå tømmerstokk er nesten verdiløs, men for hvert steg i
// trelastruta blir den mer verdt - og på nesten hvert steg er det NATUREN (elva
// og fossen) som gjør det tunge arbeidet gratis. Derfor tjente Norge så mye på
// skogen. Eleven sender stokken steg for steg og ser verdien vokse fra 3 til 30.

const DEFAULT_STATIONS: Station[] = [
    {
        label: 'Rå stokk i skogen',
        icon: 'tre',
        value: 3,
        worker: 'Ingen ennå',
        explanation:
            'En stokk langt inne i skogen er verdt nesten ingenting. Ingen kan bruke den før den kommer seg ut til folk.',
    },
    {
        label: 'Fløtet ned elva',
        icon: 'elv',
        value: 6,
        worker: 'Elva - gratis',
        explanation:
            'Om våren bar flommen stokken helt ned til kysten. Elva gjorde jobben gratis: ingen hest, ingen kjerre, ingen lønn.',
    },
    {
        label: 'Skåret til planker',
        icon: 'sag',
        value: 15,
        worker: 'Fossen - gratis',
        explanation:
            'Ved fossen dreiv vannet oppgangssaga opp og ned. Den skar stokken til jevne, tynne planker mens bonden sov. Planker er verdt mye mer enn en rund stokk.',
    },
    {
        label: 'Solgt til hollenderne',
        icon: 'skip',
        value: 30,
        worker: 'Etterspørselen',
        explanation:
            'I Nederland fantes det nesten ikke skog. Hollenderne betalte gull for norske planker til skip, hus og demninger. Nå var stokken verdt ti ganger mer enn i skogen.',
    },
];

const ICONS = {
    tre: TreePine,
    elv: Waves,
    sag: Sparkles,
    skip: Coins,
};

export function TrelastVerdikjede({
    title = 'Trelastruta: fra verdiløs stokk til gull',
    stations = DEFAULT_STATIONS,
}: TrelastVerdikjedeProps) {
    const [reached, setReached] = useState(0);
    const last = stations.length - 1;
    const done = reached === last;
    const current = stations[reached];
    const start = stations[0].value;
    const end = stations[last].value;

    const advance = () => {
        if (reached < last) setReached((r) => r + 1);
    };
    const reset = () => setReached(0);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <TreePine className="w-5 h-5 text-emerald-600" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Send stokken videre og se hvor mye verdien vokser for hvert steg.
                    </p>
                </div>
            </div>

            <div className="p-6">
                {/* Stasjonssporet */}
                <div className="flex items-stretch justify-between gap-2 sm:gap-3">
                    {stations.map((s, i) => {
                        const Icon = ICONS[s.icon];
                        const isDone = i < reached;
                        const isHere = i === reached;
                        return (
                            <div key={s.label} className="flex-1 flex flex-col items-center">
                                <motion.div
                                    animate={{
                                        scale: isHere ? 1.08 : 1,
                                        backgroundColor: isHere
                                            ? '#ecfdf5'
                                            : isDone
                                              ? '#f8fafc'
                                              : '#ffffff',
                                    }}
                                    className={`w-full rounded-xl border-2 px-2 py-3 flex flex-col items-center text-center gap-1.5 ${
                                        isHere
                                            ? 'border-emerald-400 shadow-md'
                                            : isDone
                                              ? 'border-slate-200'
                                              : 'border-slate-100'
                                    }`}
                                >
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                            isHere || isDone
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span
                                        className={`text-[11px] leading-tight font-medium ${
                                            isHere || isDone ? 'text-slate-700' : 'text-slate-400'
                                        }`}
                                    >
                                        {s.label}
                                    </span>
                                    <span
                                        className={`text-xs font-bold tabular-nums ${
                                            isHere ? 'text-emerald-700' : 'text-slate-400'
                                        }`}
                                    >
                                        {s.value} skilling
                                    </span>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>

                {/* Verdimaler */}
                <div className="mt-5 flex items-end justify-center gap-2">
                    <span className="text-sm text-slate-500 mb-1">Verdi nå:</span>
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={current.value}
                            initial={{ opacity: 0, y: 12, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="text-3xl font-bold text-emerald-600 tabular-nums"
                        >
                            {current.value}
                        </motion.span>
                    </AnimatePresence>
                    <span className="text-sm text-slate-500 mb-1">skilling</span>
                </div>

                {/* Forklaringskort - alltid synlig */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={reached}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`mt-4 rounded-lg border px-4 py-3 ${
                            done
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-blue-50 border-blue-200'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className={`text-xs font-bold uppercase tracking-wide ${
                                    done ? 'text-emerald-700' : 'text-blue-700'
                                }`}
                            >
                                Hvem gjorde jobben? {current.worker}
                            </span>
                        </div>
                        <p
                            className={`text-sm leading-relaxed ${
                                done ? 'text-emerald-800' : 'text-blue-900'
                            }`}
                        >
                            {current.explanation}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Suksess-oppsummering */}
                <AnimatePresence>
                    {done && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3"
                        >
                            <p className="text-sm text-amber-900 leading-relaxed">
                                <span className="font-bold">
                                    Fra {start} til {end} skilling!
                                </span>{' '}
                                Verdien ble ti ganger større, men se hvem som gjorde det tunge
                                arbeidet: elva baret stokken, og fossen skar den. Naturen jobbet
                                gratis. Det var derfor trelasten gjorde Norge rikt.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {done ? (
                    <span className="inline-flex items-center gap-2 text-emerald-700 font-medium text-sm">
                        <Sparkles className="w-4 h-4" /> Stokken er framme i Amsterdam!
                    </span>
                ) : (
                    <button
                        onClick={advance}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Send stokken videre <ArrowRight className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
