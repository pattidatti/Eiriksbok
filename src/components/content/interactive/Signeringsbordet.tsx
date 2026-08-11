import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handshake, RotateCcw, Check, X, Stamp } from 'lucide-react';

interface SigneringsbordetProps {
    title?: string;
}

type Column = 'luthersk' | 'felles' | 'katolsk';
type Phase = 'active' | 'complete';

interface Paastand {
    id: number;
    text: string;
    short: string;
    column: Column;
    hint: string;
}

const PAASTANDER: Paastand[] = [
    {
        id: 1,
        text: 'Mennesket blir rettferdig for Gud ved tro alene. Latin: sola fide.',
        short: 'Tro alene (sola fide)',
        column: 'luthersk',
        hint: 'Uttrykket tro alene er Luthers, og det er nettopp her katolsk lære vil legge til noe mer.',
    },
    {
        id: 2,
        text: 'Mennesket kan ikke frelse seg selv. Frelsen er en gave ingen kan gjøre seg fortjent til.',
        short: 'Frelsen er en gave',
        column: 'felles',
        hint: 'Både katolsk og luthersk lære sier at nåden er ufortjent og kommer først.',
    },
    {
        id: 3,
        text: 'Mennesket er ikke bare passivt. Det samarbeider med nåden Gud gir.',
        short: 'Mennesket samarbeider',
        column: 'katolsk',
        hint: 'Tanken om samarbeid mellom nåde og menneskelig innsats er det katolske tyngdepunktet.',
    },
    {
        id: 4,
        text: 'Frelsen hviler på at Jesus døde og sto opp igjen.',
        short: 'Korset og oppstandelsen',
        column: 'felles',
        hint: 'Både katolsk og luthersk lære bygger på korset og oppstandelsen. Her har striden aldri stått.',
    },
    {
        id: 5,
        text: 'Gode gjerninger er frukten av troen, ikke veien til frelsen.',
        short: 'Gjerninger er frukt',
        column: 'luthersk',
        hint: 'Rekkefølgen er poenget: først tro, så gjerninger. Det er luthersk vektlegging.',
    },
    {
        id: 6,
        text: 'Gode gjerninger kan gi fortjeneste, men fortjenesten er selv en gave fra Gud.',
        short: 'Fortjeneste som gave',
        column: 'katolsk',
        hint: 'Katolsk lære holder fast på ordet fortjeneste, men sier at den også kommer av nåden.',
    },
    {
        id: 7,
        text: 'Fordømmelsene partene rettet mot hverandre på 1500-tallet, rammer ikke lenger den andres lære.',
        short: 'Fordømmelsene gjelder ikke',
        column: 'felles',
        hint: 'Dette er akkurat det begge parter skrev under på i Augsburg i 1999.',
    },
];

const COLUMNS: { id: Column; label: string; sub: string; ring: string; chip: string }[] = [
    {
        id: 'luthersk',
        label: 'Luthersk vekt',
        sub: 'Det protestantene understreker',
        ring: 'border-indigo-200 bg-indigo-50 hover:border-indigo-400',
        chip: 'bg-white text-indigo-700 border-indigo-200',
    },
    {
        id: 'felles',
        label: 'Felles grunn',
        sub: 'Begge er enige',
        ring: 'border-emerald-200 bg-emerald-50 hover:border-emerald-400',
        chip: 'bg-white text-emerald-700 border-emerald-200',
    },
    {
        id: 'katolsk',
        label: 'Katolsk vekt',
        sub: 'Det katolikkene understreker',
        ring: 'border-amber-200 bg-amber-50 hover:border-amber-400',
        chip: 'bg-white text-amber-700 border-amber-200',
    },
];

export function Signeringsbordet({ title = 'Signeringsbordet i Augsburg' }: SigneringsbordetProps) {
    const [index, setIndex] = useState(0);
    const [placed, setPlaced] = useState<Record<number, Column>>({});
    const [feil, setFeil] = useState<string | null>(null);
    const [riktig, setRiktig] = useState<string | null>(null);
    const [rist, setRist] = useState(0);

    const phase: Phase = index >= PAASTANDER.length ? 'complete' : 'active';
    const kort = phase === 'active' ? PAASTANDER[index] : null;

    const velg = (column: Column) => {
        if (!kort) return;
        if (column === kort.column) {
            setPlaced((forrige) => ({ ...forrige, [kort.id]: column }));
            setRiktig(kort.hint);
            setFeil(null);
            setIndex((forrige) => forrige + 1);
        } else {
            setFeil(kort.hint);
            setRiktig(null);
            setRist((forrige) => forrige + 1);
        }
    };

    const handleReset = () => {
        setIndex(0);
        setPlaced({});
        setFeil(null);
        setRiktig(null);
        setRist(0);
    };

    const plassert = (column: Column) => PAASTANDER.filter((p) => placed[p.id] === column);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Handshake className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk søylen du mener påstanden hører hjemme i.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-5">
                <AnimatePresence mode="wait">
                    {kort ? (
                        <motion.div
                            key={`kort-${kort.id}-${rist}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, x: feil ? [0, -8, 8, -5, 5, 0] : 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.28 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"
                        >
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Påstand {index + 1} av {PAASTANDER.length}
                            </p>
                            <p className="mt-1 text-base sm:text-lg text-slate-800 leading-snug">
                                {kort.text}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative flex items-center">
                                    <motion.div
                                        initial={{ x: -26, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                                        className="w-10 h-10 rounded-full bg-indigo-600 text-white grid place-items-center shadow-sm"
                                    >
                                        <Stamp className="w-5 h-5" />
                                    </motion.div>
                                    <motion.div
                                        initial={{ x: 26, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                                        className="-ml-3 w-10 h-10 rounded-full bg-amber-500 text-white grid place-items-center shadow-sm"
                                    >
                                        <Stamp className="w-5 h-5" />
                                    </motion.div>
                                </div>
                                <div>
                                    <p className="font-semibold text-emerald-800">
                                        31. oktober 1999: begge skrev under.
                                    </p>
                                    <p className="text-sm text-emerald-700">
                                        Vatikanet og Det lutherske verdensforbund erklærte seg enige
                                        om grunnprinsippene for hvordan mennesket blir rettferdig
                                        for Gud. Midtsøylen er felles grunn, men søylene til høyre
                                        og venstre står fortsatt, og kirkene er fortsatt atskilte.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pt-4 grid grid-cols-3 gap-3">
                {COLUMNS.map((kolonne) => {
                    const innhold = plassert(kolonne.id);
                    const lyser = phase === 'complete' && kolonne.id === 'felles';
                    return (
                        <motion.button
                            key={kolonne.id}
                            type="button"
                            onClick={() => velg(kolonne.id)}
                            disabled={phase === 'complete'}
                            whileHover={phase === 'active' ? { y: -2 } : undefined}
                            whileTap={phase === 'active' ? { scale: 0.98 } : undefined}
                            animate={lyser ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                            transition={{ duration: 0.5, delay: lyser ? 0.3 : 0 }}
                            className={`text-left rounded-xl border-2 p-3 min-h-[9.5rem] transition-colors disabled:cursor-default ${kolonne.ring}`}
                        >
                            <p className="text-sm font-semibold text-slate-800 leading-tight">
                                {kolonne.label}
                            </p>
                            <p className="text-[11px] text-slate-500 leading-tight">
                                {kolonne.sub}
                            </p>
                            <div className="mt-2 space-y-1">
                                <AnimatePresence>
                                    {innhold.map((p) => (
                                        <motion.p
                                            key={p.id}
                                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 260,
                                                damping: 20,
                                            }}
                                            className={`rounded-lg border px-2 py-1 text-[11px] leading-tight ${kolonne.chip}`}
                                        >
                                            {p.short}
                                        </motion.p>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feil ? `feil-${rist}` : riktig ? `riktig-${index}` : 'tom'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                            feil
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : riktig
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {feil ? (
                            <X className="w-4 h-4 mt-0.5 shrink-0" />
                        ) : riktig ? (
                            <Check className="w-4 h-4 mt-0.5 shrink-0" />
                        ) : (
                            <Handshake className="w-4 h-4 mt-0.5 shrink-0" />
                        )}
                        <span>
                            {feil ??
                                riktig ??
                                'Tre søyler, sju påstander. Én av søylene blir fullere enn du tror.'}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    {Object.keys(placed).length} av {PAASTANDER.length} plassert
                </p>
                <button
                    type="button"
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
