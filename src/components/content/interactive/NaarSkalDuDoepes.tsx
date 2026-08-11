import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Droplets, RotateCcw, Sparkles, X } from 'lucide-react';

interface NaarSkalDuDoepesProps {
    title?: string;
}

type Answer = 'ja' | 'nei';
type ChurchId = 'folkekirken' | 'baptist';

interface DoepeCase {
    id: string;
    name: string;
    situation: string;
    fasit: Record<ChurchId, Answer>;
    reason: string;
}

const CHURCHES: { id: ChurchId; label: string; sub: string }[] = [
    { id: 'folkekirken', label: 'Den norske kirke', sub: 'døper også spedbarn' },
    { id: 'baptist', label: 'Baptistkirken', sub: 'døper bare den som tror selv' },
];

const CASES: DoepeCase[] = [
    {
        id: 'mia',
        name: 'Mia, 3 uker',
        situation: 'Foreldrene er medlemmer i Den norske kirke og vil døpe henne nå.',
        fasit: { folkekirken: 'ja', baptist: 'nei' },
        reason: 'Her ligger hele uenigheten. Den norske kirke ser dåpen som en gave som blir gitt før barnet kan svare. Baptistene mener at den som døpes, selv må kunne tro og si det høyt.',
    },
    {
        id: 'jonas',
        name: 'Jonas, 24 år',
        situation: 'Har aldri vært døpt. Han er blitt kristen og vil døpes.',
        fasit: { folkekirken: 'ja', baptist: 'ja' },
        reason: 'Ingen uenighet. En voksen som ikke er døpt, kan døpes begge steder. Men måten er ulik: øsing av vann det ene stedet, full neddykking det andre.',
    },
    {
        id: 'sara',
        name: 'Sara, 16 år',
        situation: 'Ble døpt som spedbarn. Nå vil hun bli medlem i en baptistmenighet.',
        fasit: { folkekirken: 'nei', baptist: 'ja' },
        reason: 'Den norske kirke gjentar ikke dåpen. Baptistene regner ikke barnedåpen som en dåp, så Sara må døpes på nytt for å bli medlem.',
    },
    {
        id: 'lea',
        name: 'Lea, 15 år',
        situation: 'Er ikke døpt. Hun har bestemt seg selv og snakket med presten.',
        fasit: { folkekirken: 'ja', baptist: 'ja' },
        reason: 'Lea kan svare for seg selv. Da er kirkene enige igjen.',
    },
];

const TOTAL = CASES.length * CHURCHES.length;

const cellKey = (caseId: string, church: ChurchId) => `${caseId}:${church}`;

export function NaarSkalDuDoepes({ title = 'Når skal du døpes?' }: NaarSkalDuDoepesProps) {
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [checked, setChecked] = useState(false);

    const filled = Object.keys(answers).length;
    const correctCount = CASES.reduce((sum, c) => {
        return (
            sum + CHURCHES.filter((ch) => answers[cellKey(c.id, ch.id)] === c.fasit[ch.id]).length
        );
    }, 0);
    const allCorrect = checked && correctCount === TOTAL;

    const setAnswer = (caseId: string, church: ChurchId, value: Answer) => {
        setChecked(false);
        setAnswers((prev) => ({ ...prev, [cellKey(caseId, church)]: value }));
    };

    const handleReset = () => {
        setAnswers({});
        setChecked(false);
    };

    const rowCorrect = (c: DoepeCase) =>
        CHURCHES.every((ch) => answers[cellKey(c.id, ch.id)] === c.fasit[ch.id]);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Fire personer. Gjett om hver kirke sier ja eller nei til å døpe dem nå.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2 items-end pb-2">
                    <div />
                    {CHURCHES.map((ch) => (
                        <div key={ch.id} className="w-[104px] sm:w-[132px] text-center">
                            <p className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight">
                                {ch.label}
                            </p>
                            <p className="text-[10px] text-slate-400 leading-tight">{ch.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    {CASES.map((c) => {
                        const done = checked && rowCorrect(c);
                        return (
                            <motion.div
                                key={c.id}
                                animate={{
                                    backgroundColor: done ? 'rgb(236 253 245)' : 'rgb(248 250 252)',
                                }}
                                transition={{ duration: 0.3 }}
                                className="rounded-xl border border-slate-200 px-3 py-2.5"
                            >
                                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {c.name}
                                        </p>
                                        <p className="text-xs text-slate-500 leading-snug">
                                            {c.situation}
                                        </p>
                                    </div>
                                    {CHURCHES.map((ch) => {
                                        const key = cellKey(c.id, ch.id);
                                        const picked = answers[key];
                                        const isRight = checked && picked === c.fasit[ch.id];
                                        const isWrong = checked && picked !== c.fasit[ch.id];
                                        return (
                                            <div
                                                key={ch.id}
                                                className="w-[104px] sm:w-[132px] flex gap-1.5 justify-center"
                                            >
                                                {(['ja', 'nei'] as Answer[]).map((value) => {
                                                    const active = picked === value;
                                                    let tone =
                                                        'bg-white border-slate-200 text-slate-500 hover:border-slate-300';
                                                    if (active && !checked) {
                                                        tone =
                                                            'bg-sky-600 border-sky-600 text-white';
                                                    } else if (active && isRight) {
                                                        tone =
                                                            'bg-emerald-600 border-emerald-600 text-white';
                                                    } else if (active && isWrong) {
                                                        tone =
                                                            'bg-rose-50 border-rose-300 text-rose-700';
                                                    }
                                                    return (
                                                        <motion.button
                                                            key={value}
                                                            type="button"
                                                            onClick={() =>
                                                                setAnswer(c.id, ch.id, value)
                                                            }
                                                            whileTap={{ scale: 0.92 }}
                                                            animate={{
                                                                scale: active && isRight ? 1.06 : 1,
                                                            }}
                                                            transition={{
                                                                type: 'spring',
                                                                stiffness: 420,
                                                                damping: 18,
                                                            }}
                                                            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold ${tone}`}
                                                        >
                                                            {value === 'ja' ? 'Ja' : 'Nei'}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                                <AnimatePresence initial={false}>
                                    {done && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-xs text-emerald-800 leading-snug pt-2"
                                        >
                                            {c.reason}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="px-5 pt-3">
                <AnimatePresence mode="wait">
                    {allCorrect ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 flex gap-2"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                Alle åtte riktige. Se mønsteret: kirkene er bare uenige når det
                                gjelder spedbarn, og når spørsmålet er om en barnedåp teller.
                                Uenigheten handler ikke om vannet, men om troen kommer før eller
                                etter.
                            </span>
                        </motion.div>
                    ) : checked ? (
                        <motion.div
                            key="delvis"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 flex items-center gap-2"
                        >
                            <Check className="w-4 h-4 shrink-0" />
                            <span>
                                {correctCount} av {TOTAL} riktige. Bytt svar i radene som ikke er
                                grønne, og sjekk på nytt.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tomt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm px-4 py-3 flex items-center gap-2"
                        >
                            <X className="w-4 h-4 shrink-0 text-slate-300" />
                            <span>
                                Du har svart på {filled} av {TOTAL} felt. Fyll alle, så kan du
                                sjekke.
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setChecked(true)}
                    disabled={filled < TOTAL}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Sjekk svarene
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
