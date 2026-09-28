import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Anchor,
    CalendarDays,
    Check,
    Cloud,
    CloudLightning,
    CloudSun,
    EyeOff,
    MapPin,
    Moon,
    RotateCcw,
    Trophy,
    Waves,
    X,
} from 'lucide-react';

interface EisenhowersValgProps {
    title?: string;
}

interface Condition {
    icon: typeof Moon;
    label: string;
    ok: boolean;
}

interface Option {
    label: string;
    sub: string;
    conditions?: Condition[];
    correct: boolean;
    feedback: string;
}

interface Step {
    key: string;
    icon: typeof Moon;
    short: string;
    question: string;
    options: Option[];
}

const STEPS: Step[] = [
    {
        key: 'nar',
        icon: CalendarDays,
        short: 'Når?',
        question:
            'Soldatene trenger måneskinn om natta, lavvann like etter soloppgang og rolig vær. Hvilken dag velger du?',
        options: [
            {
                label: '5. juni',
                sub: 'Den opprinnelige planen',
                conditions: [
                    { icon: Moon, label: 'Fullmåne', ok: true },
                    { icon: Waves, label: 'Lavvann', ok: true },
                    { icon: CloudLightning, label: 'Storm og lave skyer', ok: false },
                ],
                correct: false,
                feedback:
                    'Måne og tidevann passer, men værmeldingen varsler sterk vind og lave skyer. Landgangsbåtene kan kantre, og flyene ser ikke målene. Eisenhower utsatte derfor invasjonen ett døgn.',
            },
            {
                label: '6. juni',
                sub: 'Ett døgn senere',
                conditions: [
                    { icon: Moon, label: 'Fullmåne', ok: true },
                    { icon: Waves, label: 'Lavvann', ok: true },
                    { icon: CloudSun, label: 'Kort opphold i været', ok: true },
                ],
                correct: true,
                feedback:
                    'Riktig! Meteorologene spådde en kort pause i uværet. Alle tre kravene klaffet - akkurat denne ene dagen.',
            },
            {
                label: 'To uker senere',
                sub: 'Neste gang måne og tidevann passer',
                conditions: [
                    { icon: Moon, label: 'Fullmåne', ok: true },
                    { icon: Waves, label: 'Lavvann', ok: true },
                    { icon: Cloud, label: 'Kraftig storm 19. juni', ok: false },
                ],
                correct: false,
                feedback:
                    'Da hadde det gått galt. Den 19. juni kom en kraftig storm over Kanalen. Dessuten kunne tyskerne ha oppdaget planen mens flere tusen skip ventet.',
            },
        ],
    },
    {
        key: 'hvor',
        icon: MapPin,
        short: 'Hvor?',
        question: 'Hvor skal soldatene gå i land?',
        options: [
            {
                label: 'Pas-de-Calais',
                sub: 'Kortest vei over Kanalen',
                correct: false,
                feedback:
                    'Det er nettopp det tyskerne tror du vil gjøre. Kortest vei betyr at de venter deg der, med mange soldater klare.',
            },
            {
                label: 'Normandie',
                sub: 'Lengre seiltur, lange strender',
                correct: true,
                feedback:
                    'Riktig! Seilturen er lengre, men tyskerne venter ikke hovedangrepet her. Fem strender får kodenavn: Utah, Omaha, Gold, Juno og Sword.',
            },
        ],
    },
    {
        key: 'lure',
        icon: EyeOff,
        short: 'Lure?',
        question: 'Tyskerne har spioner og fly som tar bilder. Hvordan skjuler du planen?',
        options: [
            {
                label: 'Hold alt hemmelig',
                sub: 'Si ingenting og håp det beste',
                correct: false,
                feedback:
                    'Umulig. Over 150 000 soldater og rundt 7000 skip kan ikke gjemmes. Tyskerne ville sett at noe var på gang, og kunne sendt alle reservene sine til Normandie.',
            },
            {
                label: 'Lag en falsk hær',
                sub: 'Oppblåsbare stridsvogner og falske radiomeldinger',
                correct: true,
                feedback:
                    'Riktig! Med en hær som ikke fantes, dobbeltagenter og falske meldinger fikk de allierte tyskerne til å tro at angrepet ville komme ved Calais - og i Norge. Mange tyske soldater ble stående og vente på feil sted.',
            },
        ],
    },
];

export function EisenhowersValg({ title = 'Eisenhowers valg: Planlegg D-dagen' }: EisenhowersValgProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [picked, setPicked] = useState<number | null>(null);
    const [tries, setTries] = useState(0);
    const done = stepIndex >= STEPS.length;
    const step = STEPS[stepIndex];
    const chosen = step && picked !== null ? step.options[picked] : null;

    const handlePick = (i: number) => {
        if (chosen?.correct) return;
        setPicked(i);
        setTries((t) => t + 1);
    };

    const handleNext = () => {
        setStepIndex((s) => s + 1);
        setPicked(null);
    };

    const handleReset = () => {
        setStepIndex(0);
        setPicked(null);
        setTries(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Anchor className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du er Eisenhower. Ta tre valg - alle må være riktige for at invasjonen skal lykkes.
                    </p>
                </div>
            </div>

            {/* Fremdrift */}
            <div className="px-5 pt-4 flex gap-2">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const finished = i < stepIndex;
                    const active = i === stepIndex;
                    return (
                        <motion.div
                            key={s.key}
                            animate={{ scale: active ? 1.05 : 1 }}
                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border ${
                                finished
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : active
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                      : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                        >
                            {finished ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            {s.short}
                        </motion.div>
                    );
                })}
            </div>

            {/* Interaksjonsflate */}
            <div className="p-5">
                <AnimatePresence mode="wait">
                    {!done && step ? (
                        <motion.div
                            key={step.key}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                        >
                            <p className="text-slate-700 font-medium mb-4">{step.question}</p>
                            <div
                                className={`grid gap-3 ${step.options.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
                            >
                                {step.options.map((o, i) => {
                                    const isPicked = picked === i;
                                    const tone = isPicked
                                        ? o.correct
                                            ? 'border-emerald-400 bg-emerald-50 shadow-md'
                                            : 'border-rose-300 bg-rose-50 shadow-md'
                                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md';
                                    return (
                                        <motion.button
                                            key={o.label}
                                            onClick={() => handlePick(i)}
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.97 }}
                                            animate={
                                                isPicked && !o.correct
                                                    ? { x: [0, -6, 6, -4, 4, 0] }
                                                    : { x: 0 }
                                            }
                                            transition={{ duration: 0.35 }}
                                            className={`text-left rounded-xl border p-4 ${tone}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-slate-800">
                                                    {o.label}
                                                </span>
                                                {isPicked &&
                                                    (o.correct ? (
                                                        <Check className="w-5 h-5 text-emerald-600" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-rose-500" />
                                                    ))}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">{o.sub}</p>
                                            {o.conditions && (
                                                <ul className="mt-3 space-y-1">
                                                    {o.conditions.map((c) => {
                                                        const CIcon = c.icon;
                                                        return (
                                                            <li
                                                                key={c.label}
                                                                className={`flex items-center gap-1.5 text-xs ${
                                                                    c.ok ? 'text-slate-600' : 'text-rose-600'
                                                                }`}
                                                            >
                                                                <CIcon className="w-3.5 h-3.5" />
                                                                {c.label}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="text-center py-4"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', delay: 0.15 }}
                                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-3"
                            >
                                <Trophy className="w-7 h-7" />
                            </motion.div>
                            <p className="text-lg font-semibold text-slate-800">
                                Ordren er gitt. Invasjonen starter 6. juni 1944.
                            </p>
                            <div className="flex justify-center gap-2 mt-4 flex-wrap">
                                {['Riktig dag', 'Riktig sted', 'Tyskerne lurt'].map((t, i) => (
                                    <motion.span
                                        key={t}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.2 }}
                                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-sm"
                                    >
                                        <Check className="w-4 h-4" /> {t}
                                    </motion.span>
                                ))}
                            </div>
                            <p className="text-sm text-slate-500 mt-4 max-w-md mx-auto">
                                Du brukte {tries} forsøk på tre valg. Men selv med alt dette på plass
                                ble det en blodig dag. Bare på Omaha ble rundt 3000 soldater drept eller
                                såret.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="px-5 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={done ? 'done' : `${stepIndex}-${picked}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            done
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : chosen
                                  ? chosen.correct
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-rose-50 border-rose-200 text-rose-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {done
                            ? 'Invasjonen lyktes fordi tid, sted og overraskelse klaffet samtidig. Hadde ett av valgene slått feil, kunne alt gått galt.'
                            : chosen
                              ? chosen.feedback
                              : 'Velg ett av alternativene over.'}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                {!done && chosen?.correct ? (
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={handleNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {stepIndex === STEPS.length - 1 ? 'Gi ordre om invasjon' : 'Neste valg'}
                    </motion.button>
                ) : (
                    <span />
                )}
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
