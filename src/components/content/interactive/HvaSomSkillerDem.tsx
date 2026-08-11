import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Check, X, RotateCcw, Sparkles } from 'lucide-react';

interface HvaSomSkillerDemProps {
    title?: string;
}

type BinId = 'riket' | 'verden' | 'bibelen';

interface Bin {
    id: BinId;
    label: string;
    blurb: string;
    box: string;
    head: string;
    chip: string;
}

interface Item {
    id: string;
    practice: string;
    short: string;
    bin: BinId;
    why: string;
}

interface Placement {
    itemId: string;
    chosen: BinId;
    correct: boolean;
}

const BINS: Bin[] = [
    {
        id: 'riket',
        label: 'Riket kommer snart',
        blurb: 'De mener Guds rike er en virkelig regjering som snart skal overta. Da haster det.',
        box: 'border-amber-200 bg-amber-50 hover:bg-amber-100',
        head: 'text-amber-800',
        chip: 'bg-white border-amber-200 text-amber-900',
    },
    {
        id: 'verden',
        label: 'Ingen del av verden',
        blurb: 'De mener stater og politikk hører til en ordning som snart skal bort.',
        box: 'border-sky-200 bg-sky-50 hover:bg-sky-100',
        head: 'text-sky-800',
        chip: 'bg-white border-sky-200 text-sky-900',
    },
    {
        id: 'bibelen',
        label: 'Bibelen bokstavelig',
        blurb: 'De mener en regel i Bibelen gjelder, også når den er upraktisk.',
        box: 'border-violet-200 bg-violet-50 hover:bg-violet-100',
        head: 'text-violet-800',
        chip: 'bg-white border-violet-200 text-violet-900',
    },
];

const ITEMS: Item[] = [
    {
        id: 'dor',
        practice: 'De går fra dør til dør, to og to, med et budskap.',
        short: 'Dør til dør',
        bin: 'riket',
        why: 'Budskapet de bringer, er nettopp at Guds rike snart vil overta makten og gjøre jorda til et paradis.',
    },
    {
        id: 'valg',
        practice: 'De stemmer ikke ved valg og stiller ikke til valg.',
        short: 'Stemmer ikke',
        bin: 'verden',
        why: 'De mener at alle stater hører til den nåværende verdensordningen, og tar derfor ikke parti i kampen om makten. Samtidig sier de selv at de følger loven og betaler skatt.',
    },
    {
        id: 'blod',
        practice: 'De sier nei til blodoverføring.',
        short: 'Nei til blod',
        bin: 'bibelen',
        why: 'De leser flere steder i Bibelen som et påbud om å holde seg borte fra blod. Begrunnelsen er religiøs, ikke medisinsk, og de tar imot annen legehjelp.',
    },
    {
        id: '1914',
        practice: 'De regner 1914 som året endetiden begynte.',
        short: '1914',
        bin: 'riket',
        why: 'Jehovas vitner lærer at Guds rike ble opprettet i himmelen i 1914, med Jesus som konge. Året er startskuddet for ventetiden.',
    },
    {
        id: 'jul',
        practice: 'De feirer verken jul eller fødselsdager.',
        short: 'Ingen jul',
        bin: 'bibelen',
        why: 'Jul og andre tradisjonelle høytider markerer de ikke, fordi høytidene ikke er nevnt i Bibelen. Den ene markeringen de holder, er minnehøytiden for Jesu død.',
    },
    {
        id: 'militaer',
        practice: 'De nekter militærtjeneste.',
        short: 'Nekter militærtjeneste',
        bin: 'verden',
        why: 'De vil ikke ta parti i strid mellom nasjoner, fordi de mener nasjonene hører til den ordningen som snart skal bort.',
    },
];

export function HvaSomSkillerDem({ title = 'Tre grunner, én tro' }: HvaSomSkillerDemProps) {
    const [index, setIndex] = useState(0);
    const [placed, setPlaced] = useState<Placement[]>([]);
    const [pending, setPending] = useState<Placement | null>(null);

    const done = index >= ITEMS.length;
    const current = done ? null : ITEMS[index];
    const shown = pending ? [...placed, pending] : placed;
    const score = shown.filter((p) => p.correct).length;

    const binOf = (itemId: string) => ITEMS.find((i) => i.id === itemId)?.bin;
    const labelOf = (binId: BinId) => BINS.find((b) => b.id === binId)?.label ?? '';

    const handleChoose = (binId: BinId) => {
        if (!current || pending) return;
        setPending({ itemId: current.id, chosen: binId, correct: binId === current.bin });
    };

    const handleNext = () => {
        if (!pending) return;
        setPlaced((prev) => [...prev, pending]);
        setPending(null);
        setIndex((prev) => prev + 1);
    };

    const handleReset = () => {
        setIndex(0);
        setPlaced([]);
        setPending(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Compass className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på grunnen du tror Jehovas vitner selv gir for hvert særtrekk.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-5">
                <AnimatePresence mode="wait">
                    {current ? (
                        <motion.div
                            key={current.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"
                        >
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                Særtrekk {index + 1} av {ITEMS.length}
                            </p>
                            <p className="text-base font-medium text-slate-800 mt-1">
                                {current.practice}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 16 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4"
                        >
                            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                                <motion.span
                                    initial={{ rotate: -20, scale: 0.6 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                                >
                                    <Sparkles className="w-5 h-5" />
                                </motion.span>
                                Ferdig - {score} av {ITEMS.length} riktig plassert
                            </div>
                            <p className="text-sm text-emerald-900 mt-2">
                                Legg merke til at de tre grunnene henger sammen. Jehovas vitner
                                leser Bibelen som et budskap fra Gud, og de mener den sier at Guds
                                rike snart skal styre jorda. Derfor haster forkynnelsen, derfor
                                holder de seg utenfor politikken, og derfor sier de nei til skikker
                                de mener Bibelen ikke gir rom for.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BINS.map((bin) => {
                    const chips = shown.filter((p) => binOf(p.itemId) === bin.id);
                    const active = !done && !pending;
                    return (
                        <button
                            key={bin.id}
                            type="button"
                            onClick={() => handleChoose(bin.id)}
                            disabled={!active}
                            className={`text-left rounded-xl border p-3 transition-colors ${bin.box} ${
                                active
                                    ? 'cursor-pointer shadow-sm hover:shadow-md'
                                    : 'cursor-default'
                            }`}
                        >
                            <p className={`font-semibold text-sm ${bin.head}`}>{bin.label}</p>
                            <p className="text-xs text-slate-600 mt-1 leading-snug">{bin.blurb}</p>
                            <div className="mt-3 flex flex-wrap gap-1.5 min-h-[2rem]">
                                {chips.map((p) => {
                                    const item = ITEMS.find((i) => i.id === p.itemId);
                                    return (
                                        <motion.span
                                            key={p.itemId}
                                            initial={{ opacity: 0, scale: 0.7 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 20,
                                            }}
                                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${bin.chip}`}
                                        >
                                            {p.correct ? (
                                                <Check className="w-3 h-3 text-emerald-600" />
                                            ) : (
                                                <X className="w-3 h-3 text-rose-500" />
                                            )}
                                            {item?.short}
                                        </motion.span>
                                    );
                                })}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    {pending ? (
                        <motion.div
                            key={pending.itemId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`rounded-lg border px-4 py-3 text-sm ${
                                pending.correct
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            <span className="font-semibold">
                                {pending.correct
                                    ? 'Riktig. '
                                    : `Nesten. Dette hører til «${labelOf(ITEMS[index].bin)}». `}
                            </span>
                            {ITEMS[index].why}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                        >
                            {done
                                ? 'Alle seks særtrekkene er plassert. Trykk «Start på nytt» for å prøve igjen.'
                                : 'Velg en av de tre grunnene over.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 py-5 flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!pending}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        pending
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    {pending && index === ITEMS.length - 1 ? 'Se resultatet' : 'Neste særtrekk'}
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
