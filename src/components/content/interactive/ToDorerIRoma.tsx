import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoorOpen, Landmark, KeyRound, Check, RotateCcw, Sparkles } from 'lucide-react';

// Lyspære-øyeblikket: Etter denne interaksjonen skal eleven forstå at den
// offentlige romerske religionen svarte på det store og felles, men lot det
// personlige ligge - og at mysteriekultene vokste i akkurat det tomrommet.

type DoorId = 'stat' | 'mysterie';

interface Wish {
    id: string;
    text: string;
    door: DoorId;
    why: string;
}

interface ToDorerIRomaProps {
    title?: string;
    intro?: string;
    wishes?: Wish[];
    insight?: string;
}

type Phase = 'idle' | 'active' | 'complete';

const DEFAULT_WISHES: Wish[] = [
    {
        id: 'avling',
        text: 'Avlingen må gro i år',
        door: 'stat',
        why: 'Riktig. Dette var hele jobben til statens religion: gi gudene gaver, og be om noe tilbake.',
    },
    {
        id: 'krig',
        text: 'Hæren må vinne, ellers går riket under',
        door: 'stat',
        why: 'Riktig. Seier og trygghet for riket var det de offentlige prestene ofret for.',
    },
    {
        id: 'plikt',
        text: 'Naboene skal se at jeg gjør plikten min',
        door: 'stat',
        why: 'Riktig. Statens religion var offentlig. Å delta var å vise at du var en god romer.',
    },
    {
        id: 'flokk',
        text: 'Jeg vil høre til i en liten flokk der alle kjenner navnet mitt',
        door: 'mysterie',
        why: 'Riktig. Mysteriekultene samlet små grupper. Statens ofringer samlet hele byen, men gjorde deg ikke til del av noe nært.',
    },
    {
        id: 'doden',
        text: 'Jeg vil vite at det finnes noe etter at jeg dør',
        door: 'mysterie',
        why: 'Riktig. Håpet om noe bedre etter døden var nettopp det de innvidde fikk løfte om.',
    },
    {
        id: 'oppleve',
        text: 'Jeg vil oppleve noe selv, ikke bare stå og se på',
        door: 'mysterie',
        why: 'Riktig. I mysteriekulten ble du innviet. Du var med i det, ikke en tilskuer i mengden.',
    },
];

const DOORS: { id: DoorId; label: string; sub: string }[] = [
    { id: 'stat', label: 'Statens religion', sub: 'Åpen for alle, offentlig, for rikets beste' },
    { id: 'mysterie', label: 'Mysteriekulten', sub: 'Liten, hemmelig, for deg' },
];

export function ToDorerIRoma({
    title = 'To dører i Roma',
    intro = 'Du er romer rundt år 150. Velg et ønske, og send det til den døra som faktisk svarer på det.',
    wishes = DEFAULT_WISHES,
    insight = 'Statens religion tok seg av det store og felles, men lovte deg ingenting etter døden. Mysteriekultene svarte på nettopp det den lot ligge. Derfor vokste de.',
}: ToDorerIRomaProps) {
    const [placed, setPlaced] = useState<Record<string, DoorId>>({});
    const [selected, setSelected] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
    const [wrongDoor, setWrongDoor] = useState<DoorId | null>(null);

    const done = Object.keys(placed).length;
    const phase: Phase = done === wishes.length ? 'complete' : done > 0 ? 'active' : 'idle';
    const open = wishes.filter((w) => !placed[w.id]);

    const handleDoor = (door: DoorId) => {
        if (!selected) {
            setFeedback({ ok: false, text: 'Velg et ønske først, så sender du det til en dør.' });
            return;
        }
        const wish = wishes.find((w) => w.id === selected);
        if (!wish) return;
        if (wish.door === door) {
            setPlaced((p) => ({ ...p, [wish.id]: door }));
            setSelected(null);
            setFeedback({ ok: true, text: wish.why });
        } else {
            setWrongDoor(door);
            setTimeout(() => setWrongDoor(null), 420);
            setFeedback({
                ok: false,
                text: 'Ikke der. Tenk etter: handler ønsket om hele byen og riket, eller om deg selv?',
            });
        }
    };

    const handleReset = () => {
        setPlaced({});
        setSelected(null);
        setFeedback(null);
        setWrongDoor(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
                <DoorOpen className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Ønskekort */}
            <div className="px-5 pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Ønsker ({open.length} igjen)
                </p>
                <div className="flex flex-wrap gap-2 min-h-[52px]">
                    <AnimatePresence mode="popLayout">
                        {open.map((w) => (
                            <motion.button
                                key={w.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                onClick={() => {
                                    setSelected(w.id === selected ? null : w.id);
                                    setFeedback(null);
                                }}
                                className={`text-left text-sm px-3 py-2 rounded-xl border transition-colors ${
                                    selected === w.id
                                        ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-md'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:shadow-md'
                                }`}
                            >
                                {w.text}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                    {open.length === 0 && (
                        <p className="text-sm text-slate-400 py-3">Alle ønskene er plassert.</p>
                    )}
                </div>
            </div>

            {/* De to dørene */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOORS.map((d) => {
                    const mine = wishes.filter((w) => placed[w.id] === d.id);
                    const isStat = d.id === 'stat';
                    return (
                        <motion.div
                            key={d.id}
                            animate={wrongDoor === d.id ? { x: [0, -7, 7, -4, 0] } : { x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <button
                                onClick={() => handleDoor(d.id)}
                                className={`w-full text-left rounded-xl border p-4 transition-shadow shadow-sm hover:shadow-md ${
                                    isStat
                                        ? 'bg-amber-50/70 border-amber-200'
                                        : 'bg-blue-50/70 border-blue-200'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {isStat ? (
                                        <Landmark className="w-4 h-4 text-amber-600" />
                                    ) : (
                                        <KeyRound className="w-4 h-4 text-blue-600" />
                                    )}
                                    <span className="font-semibold text-slate-800 text-sm">
                                        {d.label}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mb-3">{d.sub}</p>
                                <div className="space-y-1.5 min-h-[70px]">
                                    <AnimatePresence>
                                        {mine.map((w) => (
                                            <motion.div
                                                key={w.id}
                                                layout
                                                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 300,
                                                    damping: 20,
                                                }}
                                                className="flex items-start gap-1.5 text-xs bg-white/80 border border-white rounded-lg px-2 py-1.5 text-slate-700"
                                            >
                                                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <span>{w.text}</span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {mine.length === 0 && (
                                        <p className="text-xs text-slate-400 italic">
                                            Ingen ønsker her ennå
                                        </p>
                                    )}
                                </div>
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            {/* Feedback-sone - alltid i DOM-et */}
            <div className="mx-5 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                        >
                            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                            <span>{insight}</span>
                        </motion.div>
                    ) : feedback ? (
                        <motion.div
                            key={feedback.text}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm border ${
                                feedback.ok
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                        >
                            {feedback.text}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Trykk på et ønske, og trykk så på døra du tror svarer på det.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                    {done} av {wishes.length} plassert
                </span>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
