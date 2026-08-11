import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, Crown, Moon, RotateCcw, Sparkles, X } from 'lucide-react';

interface BokaSomLeggerSegProps {
    title?: string;
    intro?: string;
}

type Phase = 'placing' | 'complete' | 'resting';

interface SceneItem {
    id: string;
    label: string;
    belongs: boolean;
    feedback: string;
}

const ITEMS: SceneItem[] = [
    {
        id: 'seng',
        label: 'En opphøyd seng med rene laken',
        belongs: true,
        feedback:
            'Ja. Regelverket sier at Guru Granth Sahib skal legges på en seng med helt ren madrass og helt rene laken.',
    },
    {
        id: 'baldakin',
        label: 'En baldakin som henger over',
        belongs: true,
        feedback:
            'Ja. Regelverket sier at det skal henge en himling over plassen. Utstyret ligner det man brukte over en trone.',
    },
    {
        id: 'puter',
        label: 'Puter og rene tøystykker',
        belongs: true,
        feedback:
            'Ja. Boka hviler på puter og pakkes inn i rene tøystykker. Tøystykkene kalles romala.',
    },
    {
        id: 'chaur',
        label: 'En chaur, vifte av hår',
        belongs: true,
        feedback:
            'Ja. Regelverket sier at det skal ligge en vifte ved plassen. Den kalles chaur, og slik viftet man også over konger.',
    },
    {
        id: 'ledsager',
        label: 'En sikh som sitter hos boka',
        belongs: true,
        feedback:
            'Ja. Regelverket sier at bare en sikh, mann eller kvinne, kan sitte hos boka under samlingen. Det trengs ingen prest.',
    },
    {
        id: 'bilde',
        label: 'Et bilde av Guru Nanak å bøye seg for',
        belongs: false,
        feedback:
            'Nei. Sikh Rehat Maryada sier at det å bøye seg for bilder av guruene ikke er i tråd med guruenes lære.',
    },
    {
        id: 'annenbok',
        label: 'En annen hellig bok, like høyt plassert',
        belongs: false,
        feedback:
            'Nei. Regelen er tydelig: ingen annen bok skal settes opp på linje med Guru Granth Sahib.',
    },
    {
        id: 'prest',
        label: 'En prest som har enerett på å lese fra boka',
        belongs: false,
        feedback:
            'Nei. Sikhismen har ikke et presteskap som eier tolkningen. Regelverket sier at hver sikh, gutt eller jente, bør lære gurmukhi for å kunne lese Guru Granth Sahib selv.',
    },
];

const REQUIRED = ITEMS.filter((item) => item.belongs);

export function BokaSomLeggerSeg({
    title = 'Sett i stand plassen til Guru Granth Sahib',
    intro = 'Trykk på det du mener hører hjemme rundt Guru Granth Sahib i en gurdwara.',
}: BokaSomLeggerSegProps) {
    const [placed, setPlaced] = useState<string[]>([]);
    const [rejected, setRejected] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<{ tone: 'ok' | 'no'; text: string } | null>(null);
    const [resting, setResting] = useState(false);

    const isDone = placed.length === REQUIRED.length;
    const phase: Phase = resting ? 'resting' : isDone ? 'complete' : 'placing';

    const handlePick = (item: SceneItem) => {
        if (placed.includes(item.id) || rejected.includes(item.id)) return;
        if (item.belongs) {
            setPlaced((prev) => [...prev, item.id]);
            setFeedback({ tone: 'ok', text: item.feedback });
        } else {
            setRejected((prev) => [...prev, item.id]);
            setFeedback({ tone: 'no', text: item.feedback });
        }
    };

    const handleReset = () => {
        setPlaced([]);
        setRejected([]);
        setFeedback(null);
        setResting(false);
    };

    const has = (id: string) => placed.includes(id);

    const bok = (
        <motion.div
            layoutId="granth"
            className="flex items-center gap-2 rounded-lg border border-amber-300 bg-gradient-to-b from-amber-100 to-amber-200 px-4 py-3 shadow-sm"
        >
            <BookOpen className="h-5 w-5 text-amber-700" />
            <span className="text-sm font-semibold text-amber-900">Guru Granth Sahib</span>
        </motion.div>
    );

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <Crown className="h-5 w-5 shrink-0 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
                {/* Scenen */}
                <div className="flex flex-col gap-3">
                    <motion.div
                        animate={{
                            borderColor: isDone ? 'rgb(167 243 208)' : 'rgb(226 232 240)',
                        }}
                        className="relative flex h-[260px] flex-col items-center justify-end rounded-xl border-2 bg-gradient-to-b from-amber-50 to-white p-4"
                    >
                        {/* Baldakin */}
                        <AnimatePresence>
                            {has('baldakin') && (
                                <motion.div
                                    key="baldakin"
                                    initial={{ opacity: 0, y: -24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -24 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                    className="absolute left-6 right-6 top-3 h-7 rounded-b-2xl bg-gradient-to-b from-rose-300 to-rose-200 shadow-sm"
                                >
                                    <span className="absolute inset-x-0 -bottom-2 mx-auto block h-4 w-4/5 rounded-b-full bg-rose-200/70" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Ledsager med chaur */}
                        <div className="absolute bottom-6 right-5 flex flex-col items-center gap-1">
                            <AnimatePresence>
                                {has('chaur') && (
                                    <motion.div
                                        key="chaur"
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{ opacity: 1, scale: 1, rotate: [-16, 16, -16] }}
                                        exit={{ opacity: 0, scale: 0.6 }}
                                        transition={{
                                            rotate: { duration: 2.4, repeat: Infinity },
                                            default: {
                                                type: 'spring',
                                                stiffness: 220,
                                                damping: 18,
                                            },
                                        }}
                                        className="h-10 w-2 origin-bottom rounded-full bg-gradient-to-t from-slate-400 to-slate-200"
                                    />
                                )}
                            </AnimatePresence>
                            <AnimatePresence>
                                {has('ledsager') && (
                                    <motion.div
                                        key="ledsager"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 12 }}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700"
                                    >
                                        sikh
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Boka på plassen sin */}
                        <div className="flex flex-col items-center">
                            {!resting && bok}
                            <AnimatePresence>
                                {has('puter') && (
                                    <motion.div
                                        key="puter"
                                        initial={{ opacity: 0, scaleX: 0.4 }}
                                        animate={{ opacity: 1, scaleX: 1 }}
                                        exit={{ opacity: 0, scaleX: 0.4 }}
                                        className="mt-1 h-3 w-44 rounded-full bg-rose-200"
                                    />
                                )}
                            </AnimatePresence>
                            <motion.div
                                initial={false}
                                animate={{ height: has('seng') ? 64 : 6 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                                className="mt-1 w-52 rounded-lg bg-gradient-to-b from-amber-200 to-amber-300"
                            />
                        </div>

                        <AnimatePresence>
                            {isDone && !resting && (
                                <motion.div
                                    key="krone"
                                    initial={{ opacity: 0, scale: 0.5, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                                    className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                                >
                                    <Sparkles className="h-3.5 w-3.5" /> Et hoff, ikke en bokhylle
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Hvilerommet */}
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <Moon className="h-4 w-4 shrink-0 text-indigo-400" />
                        <div className="min-h-[52px] flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Hvilerommet
                            </p>
                            {resting ? (
                                <div className="mt-1 flex items-center gap-3">
                                    {bok}
                                    <motion.span
                                        initial={{ opacity: 0, scaleX: 0.3 }}
                                        animate={{ opacity: 1, scaleX: 1 }}
                                        className="h-3 w-16 rounded-full bg-indigo-200"
                                    />
                                </div>
                            ) : (
                                <p className="mt-1 text-sm text-slate-400">
                                    Tomt om dagen. Her legges boka til hvile om kvelden.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Valgene */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {placed.length} av {REQUIRED.length} på plass
                    </p>
                    {ITEMS.map((item) => {
                        const ok = placed.includes(item.id);
                        const no = rejected.includes(item.id);
                        return (
                            <motion.button
                                key={item.id}
                                type="button"
                                onClick={() => handlePick(item)}
                                disabled={ok || no}
                                whileTap={ok || no ? undefined : { scale: 0.97 }}
                                animate={no ? { x: [0, -6, 6, -4, 0] } : { x: 0 }}
                                transition={{ duration: 0.35 }}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                    ok
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : no
                                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                                          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                                }`}
                            >
                                {ok && <Check className="h-4 w-4 shrink-0" />}
                                {no && <X className="h-4 w-4 shrink-0" />}
                                <span>{item.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feedback ? feedback.text : 'tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            feedback?.tone === 'ok'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : feedback?.tone === 'no'
                                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                                  : 'border-blue-200 bg-blue-50 text-blue-700'
                        }`}
                    >
                        {feedback
                            ? feedback.text
                            : 'Tre av valgene hører ikke hjemme. Finn de fem som gjør det.'}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-4">
                {phase === 'complete' ? (
                    <button
                        type="button"
                        onClick={() => {
                            setResting(true);
                            setFeedback({
                                tone: 'ok',
                                text: 'Om kvelden lukkes boka, bæres på hodet i en pyntet bærestol og legges til hvile i sitt eget rom. Seremonien kalles sukhasan. Neste morgen bæres den tilbake til plassen sin i en seremoni som kalles prakash.',
                            });
                        }}
                        className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                        <Moon className="h-4 w-4" /> La kvelden komme
                    </button>
                ) : (
                    <p className="text-sm text-slate-500">
                        {phase === 'resting'
                            ? 'Boka hviler. I morgen tidlig bæres den tilbake til plassen sin.'
                            : 'Plassen står ikke ferdig ennå.'}
                    </p>
                )}
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex shrink-0 items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    <RotateCcw className="h-3.5 w-3.5" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
