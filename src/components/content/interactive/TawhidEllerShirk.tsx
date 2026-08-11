import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Check, X, RotateCcw, Sparkles, ArrowRight } from 'lucide-react';

// Tawhid eller shirk: gudsbildet i islam.
//
// Lyspære-øyeblikket: eleven trekker selv grensa som tawhid handler om.
// Hver påstand må plasseres på en av to sider: enten holder den fast på at
// Gud er én, eller så setter den noe ved siden av Gud. Når alle seks er
// sortert, ser eleven at grensa går mellom Gud og alt Gud har skapt, og at
// ingenting kan flyttes over.

interface Paastand {
    id: string;
    /** Kort merkelapp som legges i skuffen etterpå. */
    merke: string;
    tekst: string;
    fasit: 'tawhid' | 'shirk';
    forklaring: string;
}

interface TawhidEllerShirkProps {
    title?: string;
    paastander?: Paastand[];
}

type Side = 'tawhid' | 'shirk';
type Phase = 'active' | 'complete';

interface Plassert {
    id: string;
    merke: string;
    side: Side;
    riktig: boolean;
}

const STANDARD_PAASTANDER: Paastand[] = [
    {
        id: 'muhammad',
        merke: 'Muhammad',
        tekst: 'Muhammad er Guds sendebud, et menneske som alle andre mennesker.',
        fasit: 'tawhid',
        forklaring:
            'Trosbekjennelsen sier at Muhammad er Guds profet. Han er budbringeren, ikke en del av Gud.',
    },
    {
        id: 'jesus',
        merke: 'Jesus som Guds sønn',
        tekst: 'Jesus er Guds sønn, født av Gud.',
        fasit: 'shirk',
        forklaring:
            'Sett fra islam havner dette på shirk-siden, fordi sure 112 sier at Gud ikke har avlet noen. Muslimer regner Jesus som profet. Kristne mener på sin side at de fortsatt tror på bare én Gud.',
    },
    {
        id: 'navnene',
        merke: 'De nittini navnene',
        tekst: 'Gud har nittini vakre navn, og hvert av dem beskriver den samme ene Gud.',
        fasit: 'tawhid',
        forklaring:
            'Navnene sier hvordan Gud er. De deler ikke Gud opp, og nittini navn betyr ikke nittini guder.',
    },
    {
        id: 'bilde',
        merke: 'Et bilde av Gud',
        tekst: 'Man kan male et bilde som viser hvordan Gud ser ut.',
        fasit: 'shirk',
        forklaring:
            'Ingen avbilder Gud i islam. Kunstneren blir sett på som en som prøver å etterligne Guds skaperkraft.',
    },
    {
        id: 'mekka',
        merke: 'Gudene i Mekka',
        tekst: 'Ved siden av Gud finnes mindre guder man kan be til, slik mange gjorde i Arabia før islam.',
        fasit: 'shirk',
        forklaring:
            'Før islam var Allah én gud blant flere i Arabia. Tawhid betyr at de andre ikke finnes.',
    },
    {
        id: 'skaperen',
        merke: 'Skaperen alene',
        tekst: 'Gud har skapt alt som finnes, og deler ikke makten med noen.',
        fasit: 'tawhid',
        forklaring: 'En streng monoteisme preger islam. Gud er én, og ingen står ved siden av.',
    },
];

export function TawhidEllerShirk({
    title = 'Hvor går grensa?',
    paastander = STANDARD_PAASTANDER,
}: TawhidEllerShirkProps) {
    const [index, setIndex] = useState(0);
    const [valgt, setValgt] = useState<Side | null>(null);
    const [plassert, setPlassert] = useState<Plassert[]>([]);
    const [phase, setPhase] = useState<Phase>('active');

    const naavaerende = paastander[index];
    const feil = valgt !== null && valgt !== naavaerende.fasit;
    const antallRiktig = plassert.filter((p) => p.riktig).length;

    const velg = (side: Side) => {
        if (valgt !== null) return;
        setValgt(side);
        setPlassert((forrige) => [
            ...forrige,
            {
                id: naavaerende.id,
                merke: naavaerende.merke,
                side: naavaerende.fasit,
                riktig: side === naavaerende.fasit,
            },
        ]);
    };

    const neste = () => {
        if (index + 1 >= paastander.length) {
            setPhase('complete');
            return;
        }
        setIndex((i) => i + 1);
        setValgt(null);
    };

    const handleReset = () => {
        setIndex(0);
        setValgt(null);
        setPlassert([]);
        setPhase('active');
    };

    const skuff = (side: Side) => plassert.filter((p) => p.side === side);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les påstanden og velg hvordan islam ser på den: holder den fast på at Gud er
                        én, eller setter den noe ved siden av Gud?
                    </p>
                </div>
            </div>

            {/* Medaljongen: Gud alene, over skillelinja */}
            <div className="px-5 pt-5">
                <div className="relative rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-white border-2 border-amber-300 flex items-center justify-center">
                            <span
                                lang="ar"
                                dir="rtl"
                                className="text-xl text-amber-700 leading-none"
                            >
                                الله
                            </span>
                        </div>
                        {phase === 'complete' && (
                            <motion.span
                                className="absolute inset-0 rounded-full border-2 border-amber-400"
                                initial={{ opacity: 0.8, scale: 1 }}
                                animate={{ opacity: 0, scale: 1.8 }}
                                transition={{ duration: 1.4, repeat: Infinity }}
                            />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-900">Tawhid: Gud er én</p>
                        <p className="text-xs text-amber-700">
                            Alt annet er skapt av Gud. Å sette noe her oppe kalles shirk.
                        </p>
                    </div>
                    <div className="ml-auto flex gap-1.5">
                        {paastander.map((p, i) => (
                            <span
                                key={p.id}
                                className={`w-2 h-2 rounded-full ${
                                    i < plassert.length
                                        ? 'bg-amber-500'
                                        : i === index && phase === 'active'
                                          ? 'bg-amber-300'
                                          : 'bg-amber-200/60'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    {phase === 'active' ? (
                        <motion.div key={naavaerende.id} exit={{ opacity: 0 }}>
                            <motion.div
                                initial={{ opacity: 0, x: 28 }}
                                animate={
                                    feil
                                        ? { opacity: 1, x: [0, -10, 10, -6, 6, 0] }
                                        : { opacity: 1, x: 0 }
                                }
                                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 min-h-[76px] flex items-center"
                            >
                                <p className="text-base sm:text-lg text-slate-800 font-medium">
                                    {naavaerende.tekst}
                                </p>
                            </motion.div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => velg('tawhid')}
                                    disabled={valgt !== null}
                                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                                        valgt === null
                                            ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                                            : naavaerende.fasit === 'tawhid'
                                              ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                                              : 'border-slate-200 bg-white text-slate-400'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 font-semibold text-sm">
                                        <Check className="w-4 h-4" /> Tawhid
                                    </span>
                                    <span className="block text-xs mt-0.5">
                                        Holder fast på at Gud er én
                                    </span>
                                </button>
                                <button
                                    onClick={() => velg('shirk')}
                                    disabled={valgt !== null}
                                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                                        valgt === null
                                            ? 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800'
                                            : naavaerende.fasit === 'shirk'
                                              ? 'border-rose-300 bg-rose-100 text-rose-900'
                                              : 'border-slate-200 bg-white text-slate-400'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 font-semibold text-sm">
                                        <X className="w-4 h-4" /> Shirk
                                    </span>
                                    <span className="block text-xs mt-0.5">
                                        Setter noe ved siden av Gud
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center"
                        >
                            <motion.span
                                className="inline-flex"
                                initial={{ rotate: -20, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Sparkles className="w-6 h-6 text-amber-600" />
                            </motion.span>
                            <p className="mt-1 font-semibold text-amber-900">
                                Du fikk {antallRiktig} av {paastander.length} riktig.
                            </p>
                            <p className="text-sm text-amber-800 mt-1">
                                Legg merke til hva som skiller de to skuffene. Alt som gir noe skapt
                                Guds plass, havner til høyre. Det er hele poenget med tawhid: Gud er
                                én, og alt annet er skapt.
                            </p>
                            <p className="text-sm text-amber-900 font-medium mt-2">
                                Det finnes ingen gud utenom Gud.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="px-5 pt-3 min-h-[76px]">
                <AnimatePresence mode="wait">
                    {valgt !== null && phase === 'active' ? (
                        <motion.div
                            key={`${naavaerende.id}-svar`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                feil
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                        >
                            <span className="font-semibold">
                                {feil ? 'Ikke helt. ' : 'Riktig. '}
                            </span>
                            {naavaerende.forklaring}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-500"
                        >
                            {phase === 'complete'
                                ? 'Alle påstandene er sortert. Trykk på Start på nytt for å prøve igjen.'
                                : 'Velg en av de to knappene, så får du forklaringen her.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Skuffene */}
            <div className="px-5 pt-3 grid grid-cols-2 gap-3">
                {(['tawhid', 'shirk'] as Side[]).map((side) => (
                    <div
                        key={side}
                        className={`rounded-xl border px-3 py-2 min-h-[86px] ${
                            side === 'tawhid'
                                ? 'border-emerald-200 bg-emerald-50/50'
                                : 'border-rose-200 bg-rose-50/50'
                        }`}
                    >
                        <p
                            className={`text-xs font-semibold uppercase tracking-wide ${
                                side === 'tawhid' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                        >
                            {side === 'tawhid' ? 'Gud er én' : 'Noe ved siden av Gud'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {skuff(side).map((p) => (
                                <motion.span
                                    key={p.id}
                                    initial={{ opacity: 0, scale: 0.6, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                                    className={`px-2 py-1 rounded-full text-xs bg-white border ${
                                        p.riktig
                                            ? 'border-emerald-300 text-emerald-800'
                                            : 'border-amber-300 text-amber-800'
                                    }`}
                                >
                                    {p.merke}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Kontrollrad */}
            <div className="px-5 py-4 flex items-center justify-between">
                <button
                    onClick={neste}
                    disabled={valgt === null || phase === 'complete'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors flex items-center gap-2"
                >
                    {index + 1 >= paastander.length ? 'Se fasiten' : 'Neste påstand'}
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" /> Start på nytt
                </button>
            </div>
        </div>
    );
}
