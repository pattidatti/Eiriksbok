import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Anchor, MapPin, Lock, Check, RotateCcw, Sparkles } from 'lucide-react';

// Lyspære-øyeblikk: Etter denne interaksjonen skal eleven forstå at bevis kan
// hope seg opp bak en teori uten å gi et sikkert svar. Sporene peker i hver sin
// retning, to teorier blir sterke - men ingen når helt fram, fordi det
// avgjørende beviset, selve flyvraket, aldri er funnet.

interface EarhartSporProps {
    title?: string;
}

type TheoryId = 'sank' | 'nikumaroro' | 'fange';

interface Theory {
    id: TheoryId;
    name: string;
    blurb: string;
    icon: typeof Anchor;
    total: number;
}

interface Clue {
    id: string;
    text: string;
    home: TheoryId;
}

const THEORIES: Theory[] = [
    {
        id: 'sank',
        name: 'Krasjet og sank',
        blurb: 'Flyet gikk tom for drivstoff og havnet i havet nær Howland.',
        icon: Anchor,
        total: 3,
    },
    {
        id: 'nikumaroro',
        name: 'Strandet på Nikumaroro',
        blurb: 'De landet på en øde øy og overlevde en stund som skipbrudne.',
        icon: MapPin,
        total: 3,
    },
    {
        id: 'fange',
        name: 'Tatt til fange',
        blurb: 'En løsere teori: at hun var spion og ble tatt av Japan.',
        icon: Lock,
        total: 1,
    },
];

const CLUES: Clue[] = [
    { id: 'radio', text: 'Siste melding: «en halv time drivstoff igjen, ingen land i sikte».', home: 'sank' },
    { id: 'sok', text: 'Det store søket til kystvakten og marinen fant ingenting i havet.', home: 'sank' },
    { id: 'marinen', text: 'Den amerikanske marinen konkluderte: flyet gikk tomt og sank.', home: 'sank' },
    { id: 'knokler', text: 'I 1940 ble menneskeknokler funnet på øya Nikumaroro, ved en bålplass.', home: 'nikumaroro' },
    { id: 'maaling', text: 'En re-analyse i 2018 fant at målene passet Earhart bedre enn 99 % av folk.', home: 'nikumaroro' },
    { id: 'signal', text: 'Radiosignaler etterpå kan tyde på at flyet sto på et rev og sendte nødrop.', home: 'nikumaroro' },
    { id: 'spion', text: 'Noen har hevdet at hun var hemmelig agent og ble fanget av Japan.', home: 'fange' },
];

const THEORY_COLOR: Record<TheoryId, { chip: string; bar: string; soft: string }> = {
    sank: { chip: 'bg-sky-100 text-sky-700 border-sky-200', bar: 'bg-sky-500', soft: 'bg-sky-50' },
    nikumaroro: {
        chip: 'bg-amber-100 text-amber-700 border-amber-200',
        bar: 'bg-amber-500',
        soft: 'bg-amber-50',
    },
    fange: {
        chip: 'bg-violet-100 text-violet-700 border-violet-200',
        bar: 'bg-violet-500',
        soft: 'bg-violet-50',
    },
};

// Selv en fullt underbygd teori stopper her - aldri på 100 %. Det siste stykket
// krever det avgjørende beviset (vraket), som aldri er funnet.
const MAX_FILL = 68;

export function EarhartSpor({ title = 'Vei sporene etter Earhart' }: EarhartSporProps) {
    const [placement, setPlacement] = useState<Record<string, TheoryId | null>>({});
    const [selected, setSelected] = useState<string | null>(null);

    const strength = useMemo(() => {
        const s: Record<TheoryId, number> = { sank: 0, nikumaroro: 0, fange: 0 };
        for (const clue of CLUES) {
            if (placement[clue.id] === clue.home) s[clue.home] += 1;
        }
        return s;
    }, [placement]);

    const solved = CLUES.every((c) => placement[c.id] === c.home);
    const unplaced = CLUES.filter((c) => !placement[c.id]);

    const place = (theory: TheoryId) => {
        if (!selected) return;
        setPlacement((p) => ({ ...p, [selected]: theory }));
        setSelected(null);
    };

    const takeBack = (clueId: string) => {
        setPlacement((p) => ({ ...p, [clueId]: null }));
        setSelected(null);
    };

    const handleReset = () => {
        setPlacement({});
        setSelected(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Search className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg et spor, og plasser det på teorien det peker mot.
                    </p>
                </div>
            </div>

            {/* Teori-kolonner */}
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {THEORIES.map((th) => {
                    const c = THEORY_COLOR[th.id];
                    const fill = (strength[th.id] / th.total) * MAX_FILL;
                    const Icon = th.icon;
                    const placedHere = CLUES.filter((cl) => placement[cl.id] === th.id);
                    const isTarget = selected !== null;
                    return (
                        <button
                            key={th.id}
                            onClick={() => isTarget && place(th.id)}
                            disabled={!isTarget}
                            className={`text-left rounded-xl border p-3 transition-all ${c.soft} ${
                                isTarget
                                    ? 'border-indigo-400 ring-2 ring-indigo-200 cursor-pointer shadow-md'
                                    : 'border-slate-200 cursor-default'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className="w-4 h-4 text-slate-500" />
                                <span className="font-semibold text-sm text-slate-800">{th.name}</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-snug mb-2">{th.blurb}</p>

                            {/* Styrke-måler - når aldri helt fram til sikkert bevis */}
                            <div className="relative h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                <motion.div
                                    className={`h-full ${c.bar} rounded-full`}
                                    animate={{ width: `${fill}%` }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                                />
                                {/* Sikkerhets-linjen: 100 % = vraket funnet */}
                                <div className="absolute top-0 right-0 h-full w-0.5 bg-slate-400" />
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400">
                                Styrke: {strength[th.id]} av {th.total} spor
                            </div>

                            <div className="mt-2 space-y-1">
                                <AnimatePresence>
                                    {placedHere.map((cl) => {
                                        const fits = cl.home === th.id;
                                        return (
                                            <motion.span
                                                key={cl.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    takeBack(cl.id);
                                                }}
                                                className={`block text-[11px] leading-snug px-2 py-1 rounded-lg border cursor-pointer ${
                                                    fits
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                        : 'bg-rose-50 border-rose-200 text-rose-600'
                                                }`}
                                            >
                                                {fits ? '✓ ' : 'passer dårlig: '}
                                                {cl.text}
                                            </motion.span>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Spor-bunke */}
            <div className="px-4 sm:px-6 pb-2">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                    {selected ? 'Klikk teorien sporet peker mot' : 'Spor som venter'}
                </p>
                <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                    <AnimatePresence>
                        {unplaced.map((cl) => (
                            <motion.button
                                key={cl.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => setSelected(selected === cl.id ? null : cl.id)}
                                className={`max-w-full text-left text-[11px] leading-snug px-2.5 py-1.5 rounded-lg border transition-colors ${
                                    selected === cl.id
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {cl.text}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                    {unplaced.length === 0 && !solved && (
                        <span className="text-xs text-slate-400">Alle sporene er plassert.</span>
                    )}
                </div>
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                {solved && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mx-4 sm:mx-6 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-2"
                    >
                        <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                        <span>
                            Se på målerne: to teorier ble sterke, men ingen når helt fram til den
                            grå linjen. Den står for et sikkert bevis - flyvraket. Så lenge det aldri
                            blir funnet, er saken uløst. Bevis kan peke tydelig i én retning uten å gi
                            et sikkert svar.
                        </span>
                    </motion.div>
                )}
                {!solved && selected === null && unplaced.length < CLUES.length && (
                    <motion.div
                        key="progress"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mx-4 sm:mx-6 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                    >
                        Klikk et plassert spor for å sende det tilbake. Et spor som «passer dårlig»
                        teller ikke for teorien.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    {solved ? (
                        <>
                            <Check className="w-4 h-4 text-emerald-500" /> Alle spor er sortert
                        </>
                    ) : (
                        `${CLUES.length - unplaced.length} av ${CLUES.length} spor plassert`
                    )}
                </span>
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
