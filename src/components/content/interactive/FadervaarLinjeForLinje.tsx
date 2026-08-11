import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Hand, RotateCcw, Check, CornerDownRight } from 'lucide-react';

interface FadervaarLinjeForLinjeProps {
    title?: string;
}

type Side = 'gud' | 'oss';

interface Ledd {
    text: string;
    side: Side;
    why: string;
}

const LEDD: Ledd[] = [
    {
        text: 'La navnet ditt helliges.',
        side: 'gud',
        why: 'Her ber du om at Guds navn skal holdes hellig. Ingenting i dette leddet handler om deg.',
    },
    {
        text: 'La riket ditt komme.',
        side: 'gud',
        why: 'Riket er Guds herredømme. Bønnen ber om at det skal bli virkelig i verden.',
    },
    {
        text: 'La viljen din skje på jorden slik som i himmelen.',
        side: 'gud',
        why: 'Det er Guds vilje som skal skje, ikke din egen. Dette er det siste leddet før bønnen snur.',
    },
    {
        text: 'Gi oss i dag vårt daglige brød.',
        side: 'oss',
        why: 'Nå snur bønnen. Brød er det helt vanlige du trenger for å komme deg gjennom dagen.',
    },
    {
        text: 'Tilgi oss vår skyld, slik også vi tilgir våre skyldnere.',
        side: 'oss',
        why: 'Her ber du om tilgivelse for deg selv, og lover samtidig å gi den videre til andre.',
    },
    {
        text: 'La oss ikke komme i fristelse,',
        side: 'oss',
        why: 'En bønn om hjelp når livet setter mennesker på prøve.',
    },
    {
        text: 'men frels oss fra det onde.',
        side: 'oss',
        why: 'Det siste leddet ber om beskyttelse for mennesker.',
    },
];

type Feedback = { tone: 'riktig' | 'rettet'; text: string } | null;

export function FadervaarLinjeForLinje({
    title = 'Fadervår, ledd for ledd',
}: FadervaarLinjeForLinjeProps) {
    const [placed, setPlaced] = useState<Side[]>([]);
    const [feedback, setFeedback] = useState<Feedback>(null);
    const [shakeIndex, setShakeIndex] = useState<number | null>(null);
    const [treff, setTreff] = useState(0);

    const current = placed.length;
    const ferdig = current >= LEDD.length;

    const velg = (valgt: Side) => {
        if (ferdig) return;
        const ledd = LEDD[current];
        const riktig = valgt === ledd.side;
        if (riktig) {
            setTreff((t) => t + 1);
            setFeedback({ tone: 'riktig', text: ledd.why });
        } else {
            setShakeIndex(current);
            window.setTimeout(() => setShakeIndex(null), 450);
            setFeedback({
                tone: 'rettet',
                text: `Dette leddet hører til på den andre siden. ${ledd.why}`,
            });
        }
        setPlaced((p) => [...p, ledd.side]);
    };

    const nullstill = () => {
        setPlaced([]);
        setFeedback(null);
        setShakeIndex(null);
        setTreff(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <CornerDownRight className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Ta ett ledd om gangen. Handler det om Gud, eller om oss?
                    </p>
                </div>
            </div>

            <div className="px-6 pt-5">
                <p className="text-sm italic text-slate-400 mb-3 pl-3">Vår Far i himmelen!</p>

                <div className="space-y-2">
                    {LEDD.map((ledd, i) => {
                        const side = placed[i];
                        const erAktiv = i === current && !ferdig;
                        const visDeler = i === 3;
                        return (
                            <div key={ledd.text}>
                                {visDeler && (
                                    <AnimatePresence>
                                        {ferdig && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 220,
                                                    damping: 24,
                                                }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex items-center gap-3 py-2">
                                                    <div className="h-px flex-1 bg-emerald-300" />
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                                        Her snur bønnen
                                                    </span>
                                                    <div className="h-px flex-1 bg-emerald-300" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}

                                <motion.div
                                    animate={
                                        shakeIndex === i
                                            ? { x: [0, -8, 8, -5, 0] }
                                            : { x: 0, scale: erAktiv ? 1.01 : 1 }
                                    }
                                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                                    className={[
                                        'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm',
                                        side === 'gud'
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                            : side === 'oss'
                                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                                              : erAktiv
                                                ? 'bg-white border-slate-300 text-slate-800 shadow-md'
                                                : 'bg-slate-50 border-slate-100 text-slate-300',
                                    ].join(' ')}
                                >
                                    <span className="w-5 shrink-0">
                                        {side === 'gud' && (
                                            <motion.span
                                                initial={{ scale: 0, rotate: -30 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 400,
                                                    damping: 16,
                                                }}
                                                className="block"
                                            >
                                                <Sun className="w-4 h-4 text-indigo-500" />
                                            </motion.span>
                                        )}
                                        {side === 'oss' && (
                                            <motion.span
                                                initial={{ scale: 0, rotate: 30 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 400,
                                                    damping: 16,
                                                }}
                                                className="block"
                                            >
                                                <Hand className="w-4 h-4 text-amber-500" />
                                            </motion.span>
                                        )}
                                        {!side && erAktiv && (
                                            <span className="block w-2 h-2 rounded-full bg-indigo-500" />
                                        )}
                                    </span>
                                    <span className={erAktiv ? 'font-medium' : ''}>
                                        {ledd.text}
                                    </span>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2"
                        >
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
                            >
                                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                            </motion.span>
                            <span>
                                Hele bønnen er plassert, og du traff på {treff} av {LEDD.length}{' '}
                                første gang. Tre ledd om Gud, så fire om oss. Fadervår begynner ikke
                                med det du trenger.
                            </span>
                        </motion.div>
                    ) : feedback ? (
                        <motion.div
                            key={`fb-${current}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={[
                                'rounded-lg border px-4 py-3 text-sm',
                                feedback.tone === 'riktig'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-700',
                            ].join(' ')}
                        >
                            {feedback.text}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700"
                        >
                            Fadervår har sju ledd. Plasser dem, så ser du hvor bønnen snur.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => velg('gud')}
                        disabled={ferdig}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                    >
                        <Sun className="w-4 h-4" />
                        Om Gud
                    </button>
                    <button
                        onClick={() => velg('oss')}
                        disabled={ferdig}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                    >
                        <Hand className="w-4 h-4" />
                        Om oss
                    </button>
                </div>
                <button
                    onClick={nullstill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
