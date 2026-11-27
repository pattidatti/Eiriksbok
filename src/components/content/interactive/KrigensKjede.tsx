import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, RotateCcw, ArrowRight, Flag, Globe2, MapPin, PartyPopper } from 'lucide-react';

interface Cause {
    id: string;
    year: string;
    title: string;
    // Hvordan denne hendelsen førte videre mot krigen
    why: string;
}

type Level = 'ukraina' | 'europa' | 'verden';

interface Consequence {
    id: string;
    text: string;
    level: Level;
    explanation: string;
}

interface KrigensKjedeProps {
    title?: string;
    causes: Cause[];
    centerEvent: { year: string; title: string; text: string };
    consequences: Consequence[];
}

type Phase = 'causes' | 'consequences' | 'done';

const LEVELS: { id: Level; label: string; icon: typeof Flag }[] = [
    { id: 'ukraina', label: 'I Ukraina', icon: MapPin },
    { id: 'europa', label: 'I Europa og Norge', icon: Flag },
    { id: 'verden', label: 'I resten av verden', icon: Globe2 },
];

// Stokker en kopi av lista med en fast nøkkel, så rekkefølgen er lik ved hver render
function shuffle<T>(items: T[], seed: number): T[] {
    const copy = [...items];
    let s = seed;
    for (let i = copy.length - 1; i > 0; i--) {
        s = (s * 9301 + 49297) % 233280;
        const j = Math.floor((s / 233280) * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function KrigensKjede({
    title = 'Krigens kjede: årsaker og følger',
    causes,
    centerEvent,
    consequences,
}: KrigensKjedeProps) {
    const [phase, setPhase] = useState<Phase>('causes');
    const [placed, setPlaced] = useState<string[]>([]);
    const [wrongId, setWrongId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ tone: 'ok' | 'bad' | 'info'; text: string }>({
        tone: 'info',
        text: 'Klikk på den hendelsen som skjedde først.',
    });
    const [round, setRound] = useState(1);
    const [cIndex, setCIndex] = useState(0);
    const [sorted, setSorted] = useState<Record<Level, string[]>>({
        ukraina: [],
        europa: [],
        verden: [],
    });
    const [firstTry, setFirstTry] = useState(0);
    const [missedCurrent, setMissedCurrent] = useState(false);

    const shuffledCauses = useMemo(() => shuffle(causes, 7 * round), [causes, round]);
    const shuffledConsequences = useMemo(
        () => shuffle(consequences, 11 * round),
        [consequences, round]
    );

    const placedCauses = placed
        .map((id) => causes.find((c) => c.id === id))
        .filter((c): c is Cause => Boolean(c));

    const handleCause = (cause: Cause) => {
        if (placed.includes(cause.id)) return;
        const expected = causes[placed.length];
        if (cause.id === expected.id) {
            const next = [...placed, cause.id];
            setPlaced(next);
            setWrongId(null);
            setFeedback({ tone: 'ok', text: `${cause.year}: ${cause.why}` });
        } else {
            setWrongId(cause.id);
            setFeedback({
                tone: 'bad',
                text: `Ikke ennå. «${cause.title}» skjedde senere. Finn noe som kom før.`,
            });
            window.setTimeout(() => setWrongId(null), 450);
        }
    };

    const allCausesPlaced = placed.length === causes.length;
    const current = shuffledConsequences[cIndex];

    const handleLevel = (level: Level) => {
        if (!current) return;
        if (level === current.level) {
            const nextSorted = { ...sorted, [level]: [...sorted[level], current.id] };
            setSorted(nextSorted);
            if (!missedCurrent) setFirstTry((n) => n + 1);
            setMissedCurrent(false);
            setFeedback({ tone: 'ok', text: current.explanation });
            if (cIndex + 1 >= shuffledConsequences.length) {
                setPhase('done');
            } else {
                setCIndex(cIndex + 1);
            }
        } else {
            setMissedCurrent(true);
            const label = LEVELS.find((l) => l.id === level)?.label.toLowerCase();
            setFeedback({
                tone: 'bad',
                text: `Merkes dette først og fremst ${label}? Les følgen en gang til og prøv igjen.`,
            });
        }
    };

    const handleReset = () => {
        setPhase('causes');
        setPlaced([]);
        setWrongId(null);
        setCIndex(0);
        setSorted({ ukraina: [], europa: [], verden: [] });
        setFirstTry(0);
        setMissedCurrent(false);
        setRound((r) => r + 1);
        setFeedback({ tone: 'info', text: 'Klikk på den hendelsen som skjedde først.' });
    };

    const feedbackClass =
        feedback.tone === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : feedback.tone === 'bad'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Link2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {phase === 'causes'
                            ? `Steg 1 av 2: Bygg kjeden. Klikk hendelsene i riktig rekkefølge (${placed.length}/${causes.length}).`
                            : phase === 'consequences'
                              ? `Steg 2 av 2: Hvor merkes følgen mest? (${cIndex + 1}/${shuffledConsequences.length})`
                              : 'Ferdig! Du har fulgt krigen fra årsak til følge.'}
                    </p>
                </div>
            </div>

            <div className="p-5">
                {/* Kjeden: plasserte årsaker + midtpunktet */}
                <div className="flex flex-wrap items-stretch gap-1.5 mb-4">
                    {causes.map((c, i) => {
                        const p = placedCauses[i];
                        return (
                            <div key={c.id} className="flex items-center gap-1.5">
                                <motion.div
                                    layout
                                    className={`min-w-[5.5rem] max-w-[9rem] rounded-xl border px-2.5 py-1.5 text-xs ${
                                        p
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                                            : 'bg-slate-50 border-dashed border-slate-300 text-slate-400'
                                    }`}
                                >
                                    {p ? (
                                        <motion.div
                                            initial={{ scale: 0.6, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                        >
                                            <div className="font-bold">{p.year}</div>
                                            <div className="leading-tight">{p.title}</div>
                                        </motion.div>
                                    ) : (
                                        <div className="py-2 text-center">?</div>
                                    )}
                                </motion.div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            </div>
                        );
                    })}
                    <motion.div
                        animate={
                            allCausesPlaced
                                ? { scale: [1, 1.08, 1], borderColor: '#f43f5e' }
                                : { scale: 1 }
                        }
                        transition={{ duration: 0.5 }}
                        className={`rounded-xl border-2 px-3 py-1.5 text-xs ${
                            allCausesPlaced
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                    >
                        <div className="font-bold">{centerEvent.year}</div>
                        <div className="leading-tight font-medium">{centerEvent.title}</div>
                    </motion.div>
                </div>

                <AnimatePresence mode="wait">
                    {phase === 'causes' && !allCausesPlaced && (
                        <motion.div
                            key="causes"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-3 gap-2"
                        >
                            {shuffledCauses.map((c) => {
                                const isPlaced = placed.includes(c.id);
                                return (
                                    <motion.button
                                        key={c.id}
                                        type="button"
                                        disabled={isPlaced}
                                        onClick={() => handleCause(c)}
                                        whileHover={isPlaced ? undefined : { y: -2 }}
                                        whileTap={isPlaced ? undefined : { scale: 0.96 }}
                                        animate={
                                            wrongId === c.id
                                                ? { x: [0, -8, 8, -6, 6, 0] }
                                                : { opacity: isPlaced ? 0.35 : 1, x: 0 }
                                        }
                                        transition={{ duration: 0.4 }}
                                        className={`text-left rounded-xl border px-3 py-2 text-sm shadow-sm ${
                                            isPlaced
                                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-default'
                                                : 'bg-white border-slate-200 text-slate-700 hover:shadow-md hover:border-indigo-300'
                                        }`}
                                    >
                                        {c.title}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}

                    {phase === 'causes' && allCausesPlaced && (
                        <motion.div
                            key="center"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800"
                        >
                            <div className="font-semibold mb-1">
                                {centerEvent.year}: {centerEvent.title}
                            </div>
                            {centerEvent.text}
                        </motion.div>
                    )}

                    {phase === 'consequences' && current && (
                        <motion.div
                            key={current.id}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                        >
                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-800 font-medium mb-3">
                                {current.text}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {LEVELS.map((l) => {
                                    const Icon = l.icon;
                                    return (
                                        <motion.button
                                            key={l.id}
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ y: -2 }}
                                            onClick={() => handleLevel(l.id)}
                                            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-indigo-500" />
                                                {l.label}
                                            </span>
                                            <span className="text-xs rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5">
                                                {sorted[l.id].length}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {phase === 'done' && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                            className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800"
                        >
                            <div className="flex items-center gap-2 font-semibold mb-2">
                                <motion.span
                                    animate={{ rotate: [0, -15, 15, 0] }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <PartyPopper className="w-5 h-5" />
                                </motion.span>
                                Kjeden er komplett
                            </div>
                            <p className="text-sm mb-3">
                                Krigen startet ikke ut av ingenting 24. februar 2022. Den kom etter
                                over 20 år med spenning, og følgene nådde langt utenfor Ukraina.
                                Du traff riktig på første forsøk {firstTry} av{' '}
                                {shuffledConsequences.length} ganger.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                {LEVELS.map((l) => (
                                    <div
                                        key={l.id}
                                        className="rounded-lg bg-white border border-emerald-100 px-2 py-1.5"
                                    >
                                        <div className="font-semibold">{l.label}</div>
                                        {sorted[l.id].map((id) => (
                                            <div key={id} className="leading-tight mt-0.5">
                                                {consequences.find((c) => c.id === id)?.text}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={feedback.text}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mx-5 mb-4 px-4 py-2.5 rounded-lg border text-sm ${feedbackClass}`}
                >
                    {feedback.text}
                </motion.div>
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                {phase === 'causes' && allCausesPlaced ? (
                    <button
                        type="button"
                        onClick={() => {
                            setPhase('consequences');
                            setFeedback({
                                tone: 'info',
                                text: 'Hvor merkes denne følgen først og fremst?',
                            });
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Videre til følgene
                    </button>
                ) : (
                    <span />
                )}
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
