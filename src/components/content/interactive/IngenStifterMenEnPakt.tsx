import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Handshake,
    Tent,
    Scroll,
    Flame,
    Users,
    BookOpen,
    Sparkles,
    RotateCcw,
    Ban,
    Check,
} from 'lucide-react';

interface IngenStifterMenEnPaktProps {
    title?: string;
}

type ChipId = 'abraham' | 'moses' | 'gud' | 'folket' | 'rabbinerne';

interface Chip {
    id: ChipId;
    label: string;
    Icon: typeof Tent;
}

interface Slot {
    id: string;
    role: string;
    answer: ChipId | null;
    note: string;
}

const CHIPS: Chip[] = [
    { id: 'abraham', label: 'Abraham', Icon: Tent },
    { id: 'moses', label: 'Moses', Icon: Scroll },
    { id: 'gud', label: 'Gud', Icon: Flame },
    { id: 'folket', label: 'Det jødiske folket', Icon: Users },
    { id: 'rabbinerne', label: 'Rabbinerne', Icon: BookOpen },
];

const SLOTS: Slot[] = [
    {
        id: 'stamfar',
        role: 'Stamfaren som pakten begynner med',
        answer: 'abraham',
        note: 'Ifølge 1. Mosebok inngår Gud en formell pakt med Abraham. Tegnet på pakten er at alle mannlige etterkommere skal omskjæres.',
    },
    {
        id: 'laerer',
        role: 'Læreren som ifølge fortellingen tok imot loven på Sinai',
        answer: 'moses',
        note: 'Jøder kaller ham Moshe rabbenu, Moses vår lærer. Ikke Moses vår gud, og ikke Moses vår frelser.',
    },
    {
        id: 'giver',
        role: 'Den ene parten, som gir løftet',
        answer: 'gud',
        note: 'Troen på én Gud, og forholdet mellom denne guden og folket, er det sentrale prinsippet i jødedommen.',
    },
    {
        id: 'mottaker',
        role: 'Den andre parten, som tar imot pliktene',
        answer: 'folket',
        note: 'I jødisk tradisjon gjelder pakten hele folket, ikke bare én person. Derfor kan den føres videre fra slekt til slekt.',
    },
    {
        id: 'tolker',
        role: 'De som tolker loven videre etterpå',
        answer: 'rabbinerne',
        note: 'Da tempelet i Jerusalem ble brent i år 70, overtok de lærde, rabbinerne, som jødedommens ledere og lærere.',
    },
    {
        id: 'tilbedt',
        role: 'Stifteren som selv blir tilbedt',
        answer: null,
        note: 'Denne plassen står tom. Verken Abraham eller Moses blir tilbedt. Ifølge bibelteksten vet ingen hvor graven til Moses er, og i påskefortellingen som leses hvert år, nevnes han bare én gang.',
    },
];

type FeedbackKind = 'idle' | 'success' | 'error' | 'insight' | 'complete';

interface Feedback {
    kind: FeedbackKind;
    text: string;
}

const IDLE_FEEDBACK: Feedback = {
    kind: 'idle',
    text: 'Velg et navn øverst, og klikk deretter på rollen som passer.',
};

const FEEDBACK_STYLE: Record<FeedbackKind, string> = {
    idle: 'bg-slate-50 border-slate-200 text-slate-500',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    insight: 'bg-blue-50 border-blue-200 text-blue-800',
    complete: 'bg-amber-50 border-amber-200 text-amber-800',
};

export function IngenStifterMenEnPakt({
    title = 'Hvem har hvilken rolle?',
}: IngenStifterMenEnPaktProps) {
    const [placed, setPlaced] = useState<Record<string, ChipId>>({});
    const [selected, setSelected] = useState<ChipId | null>(null);
    const [feedback, setFeedback] = useState<Feedback>(IDLE_FEEDBACK);
    const [shakeSlot, setShakeSlot] = useState<string | null>(null);
    const [emptyTried, setEmptyTried] = useState(false);

    const usedChips = Object.values(placed);
    const antallPlassert = usedChips.length;
    const ferdig = antallPlassert === CHIPS.length;

    const handleReset = () => {
        setPlaced({});
        setSelected(null);
        setFeedback(IDLE_FEEDBACK);
        setShakeSlot(null);
        setEmptyTried(false);
    };

    const handleChipClick = (id: ChipId) => {
        if (usedChips.includes(id)) return;
        if (selected === id) {
            setSelected(null);
            setFeedback(IDLE_FEEDBACK);
            return;
        }
        setSelected(id);
        const navn = CHIPS.find((c) => c.id === id)?.label ?? '';
        setFeedback({ kind: 'idle', text: `${navn} er valgt. Klikk på rollen som passer.` });
    };

    const handleSlotClick = (slot: Slot) => {
        if (placed[slot.id]) return;

        if (!selected) {
            setFeedback({ kind: 'idle', text: 'Velg et navn øverst først.' });
            return;
        }

        const navn = CHIPS.find((c) => c.id === selected)?.label ?? '';

        if (slot.answer === null) {
            setEmptyTried(true);
            setSelected(null);
            setFeedback({
                kind: 'insight',
                text: `${navn} passer ikke her. Ingen av navnene gjør det. Prøv de andre rollene.`,
            });
            return;
        }

        if (slot.answer !== selected) {
            setShakeSlot(slot.id);
            setSelected(null);
            window.setTimeout(() => setShakeSlot(null), 500);
            setFeedback({
                kind: 'error',
                text: `${navn} hører ikke til her. Les rollen en gang til, og prøv på nytt.`,
            });
            return;
        }

        const nyePlasseringer = { ...placed, [slot.id]: selected };
        setPlaced(nyePlasseringer);
        setSelected(null);

        if (Object.keys(nyePlasseringer).length === CHIPS.length) {
            setFeedback({
                kind: 'complete',
                text: 'Alle navnene er plassert. Men én rolle står fortsatt tom.',
            });
        } else {
            setFeedback({ kind: 'success', text: slot.note });
        }
    };

    return (
        <div className="my-8 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <Handshake className="h-5 w-5 shrink-0 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Slik fordeler jødisk tradisjon rollene. Én rolle blir aldri fylt.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4">
                <div className="flex min-h-[44px] flex-wrap gap-2">
                    {CHIPS.filter((chip) => !usedChips.includes(chip.id)).map((chip) => {
                        const aktiv = selected === chip.id;
                        return (
                            <motion.button
                                key={chip.id}
                                layout
                                layoutId={`brikke-${chip.id}`}
                                onClick={() => handleChipClick(chip.id)}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.96 }}
                                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                                    aktiv
                                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-md'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 shadow-sm hover:bg-slate-100'
                                }`}
                            >
                                <chip.Icon className="h-4 w-4" />
                                {chip.label}
                            </motion.button>
                        );
                    })}
                    {ferdig && (
                        <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                            <Check className="h-4 w-4" />
                            Alle plassert
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {SLOTS.map((slot) => {
                    const chipId = placed[slot.id];
                    const chip = CHIPS.find((c) => c.id === chipId);
                    const tomRolle = slot.answer === null;
                    const fremhevTom = tomRolle && (ferdig || emptyTried);
                    return (
                        <motion.button
                            key={slot.id}
                            onClick={() => handleSlotClick(slot)}
                            animate={shakeSlot === slot.id ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
                            transition={{ duration: 0.45 }}
                            className={`flex min-h-[104px] flex-col justify-between rounded-xl border p-3 text-left ${
                                chip
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : fremhevTom
                                      ? 'border-blue-300 bg-blue-50'
                                      : tomRolle
                                        ? 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100'
                                        : 'border-dashed border-slate-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                            }`}
                        >
                            <span
                                className={`text-sm leading-snug ${
                                    chip
                                        ? 'text-emerald-900'
                                        : fremhevTom
                                          ? 'text-blue-900'
                                          : 'text-slate-600'
                                }`}
                            >
                                {slot.role}
                            </span>

                            <span className="mt-3 block">
                                {chip ? (
                                    <motion.span
                                        layoutId={`brikke-${chip.id}`}
                                        className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-3 py-1 text-sm font-semibold text-emerald-800"
                                    >
                                        <chip.Icon className="h-4 w-4" />
                                        {chip.label}
                                    </motion.span>
                                ) : fremhevTom ? (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                        className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-white px-3 py-1 text-sm font-semibold text-blue-700"
                                    >
                                        <Ban className="h-4 w-4" />
                                        Står tom
                                    </motion.span>
                                ) : (
                                    <span className="inline-block rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-400">
                                        Ledig plass
                                    </span>
                                )}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feedback.kind + feedback.text}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${FEEDBACK_STYLE[feedback.kind]}`}
                    >
                        {feedback.text}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                        className="mx-5 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
                    >
                        <div className="flex items-start gap-3">
                            <motion.span
                                initial={{ rotate: -20, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                            </motion.span>
                            <p className="text-sm leading-relaxed text-amber-900">
                                {SLOTS[SLOTS.length - 1].note}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between px-5 pb-5 pt-4">
                <span className="text-sm text-slate-500">
                    {antallPlassert} av {CHIPS.length} navn plassert
                </span>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
                >
                    <RotateCcw className="h-4 w-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
