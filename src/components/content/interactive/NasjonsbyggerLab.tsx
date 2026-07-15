import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Hammer, Check, RotateCcw, Sparkles } from 'lucide-react';

// Lyspære-øyeblikk: Etter denne interaksjonen skal eleven forstå at BÅDE Italia og
// Tyskland ble til nasjoner på 1800-tallet, men langs to helt ulike veier - Italia
// gjennom folkelig begeistring og Garibaldi, Tyskland gjennom Bismarcks kalde
// maktpolitikk ("jern og blod"). To veier, ett resultat: en samlet nasjonalstat.

type Nation = 'italia' | 'tyskland';

interface Milestone {
    id: string;
    label: string;
    nation: Nation;
    tag: string;
}

interface NasjonsbyggerLabProps {
    title?: string;
    milestones?: Milestone[];
}

const DEFAULT_MILESTONES: Milestone[] = [
    {
        id: 'garibaldi',
        label: 'Garibaldi og de tusen rødskjortene seiler mot Sicilia',
        nation: 'italia',
        tag: 'Folkelig begeistring',
    },
    {
        id: 'cavour',
        label: 'Cavour bygger opp det sterke kongeriket Sardinia',
        nation: 'italia',
        tag: 'Smart diplomati',
    },
    {
        id: 'roma',
        label: 'Roma blir hovedstad i det samlede Italia',
        nation: 'italia',
        tag: 'Én italiensk nasjon',
    },
    {
        id: 'bismarck',
        label: 'Bismarck vil samle Tyskland med «jern og blod»',
        nation: 'tyskland',
        tag: 'Makt ovenfra',
    },
    {
        id: 'frankrike',
        label: 'Preussen vinner krigen mot Frankrike i 1870-71',
        nation: 'tyskland',
        tag: 'Krig som verktøy',
    },
    {
        id: 'versailles',
        label: 'Det tyske keiserriket ropes ut i Versailles i 1871',
        nation: 'tyskland',
        tag: 'Ett keiserrike',
    },
];

const NATION_META: Record<
    Nation,
    { name: string; blurb: string; ring: string; chip: string; fill: string }
> = {
    italia: {
        name: 'Italia',
        blurb: 'Folkelig begeistring og Garibaldi',
        ring: 'border-emerald-300',
        chip: 'bg-emerald-100 text-emerald-700',
        fill: 'bg-emerald-500',
    },
    tyskland: {
        name: 'Tyskland',
        blurb: 'Bismarcks jern og blod',
        ring: 'border-slate-400',
        chip: 'bg-slate-200 text-slate-700',
        fill: 'bg-slate-600',
    },
};

export function NasjonsbyggerLab({
    title = 'Bygg to nasjoner',
    milestones = DEFAULT_MILESTONES,
}: NasjonsbyggerLabProps) {
    const [armed, setArmed] = useState<string | null>(null);
    const [placed, setPlaced] = useState<Record<string, Nation>>({});
    const [wrong, setWrong] = useState<Nation | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const total = milestones.length;
    const done = Object.keys(placed).length;
    const complete = done === total;

    const handleReset = () => {
        setArmed(null);
        setPlaced({});
        setWrong(null);
        setFeedback(null);
    };

    const placeInto = (nation: Nation) => {
        if (complete || !armed) return;
        const m = milestones.find((x) => x.id === armed);
        if (!m) return;
        if (m.nation === nation) {
            setPlaced((p) => ({ ...p, [m.id]: nation }));
            setArmed(null);
            setFeedback(`«${m.tag}» - riktig, dette hører til ${NATION_META[nation].name}.`);
        } else {
            setWrong(nation);
            setFeedback('Ikke helt. Prøv den andre nasjonen.');
            window.setTimeout(() => setWrong(null), 450);
        }
    };

    const nationBricks = (nation: Nation) =>
        milestones.filter((m) => placed[m.id] === nation);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Hammer className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg en hendelse, og trykk på nasjonen den bygde.
                    </p>
                </div>
                <div className="ml-auto text-sm font-medium text-slate-400 tabular-nums">
                    {done}/{total}
                </div>
            </div>

            {/* Byggeplasser */}
            <div className="p-6 grid grid-cols-2 gap-4">
                {(['italia', 'tyskland'] as Nation[]).map((nation) => {
                    const meta = NATION_META[nation];
                    const bricks = nationBricks(nation);
                    const clickable = !!armed && !complete;
                    return (
                        <motion.button
                            key={nation}
                            type="button"
                            onClick={() => placeInto(nation)}
                            disabled={!clickable}
                            animate={wrong === nation ? { x: [0, -8, 8, -6, 0] } : { x: 0 }}
                            transition={{ duration: 0.4 }}
                            className={`text-left rounded-xl border-2 ${meta.ring} bg-slate-50 p-4 min-h-[190px] flex flex-col transition-shadow ${
                                clickable
                                    ? 'cursor-pointer hover:shadow-md ring-2 ring-indigo-200'
                                    : 'cursor-default'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Flag className="w-4 h-4 text-slate-500" />
                                <span className="font-bold text-slate-800">{meta.name}</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-3">{meta.blurb}</p>

                            <div className="flex-1 space-y-2">
                                <AnimatePresence>
                                    {bricks.map((m) => (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, scale: 0.8, y: 6 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-white text-xs font-medium ${meta.fill}`}
                                        >
                                            <Check className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span>{m.tag}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {bricks.length === 0 && (
                                    <p className="text-xs text-slate-400 italic">
                                        Ingen byggesteiner ennå.
                                    </p>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Hendelses-brikker */}
            <div className="px-6 pb-2 flex flex-wrap gap-2">
                {milestones.map((m) => {
                    const isPlaced = !!placed[m.id];
                    const isArmed = armed === m.id;
                    if (isPlaced) return null;
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => setArmed(isArmed ? null : m.id)}
                            className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                                isArmed
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {m.label}
                        </button>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pt-3 min-h-[52px]">
                <AnimatePresence mode="wait">
                    {complete ? (
                        <motion.div
                            key="win"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                            <span>
                                To veier, ett resultat: Italia ble samlet gjennom folkelig
                                begeistring og Garibaldi, Tyskland gjennom Bismarcks kalde makt.
                                Begge endte som en samlet nasjonalstat.
                            </span>
                        </motion.div>
                    ) : feedback ? (
                        <motion.div
                            key={feedback}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {feedback}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-1 text-sm text-slate-400"
                        >
                            Trykk på en hendelse under, så på nasjonen som bygde den.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-4 flex items-center justify-end">
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
