import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Check, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { StationV3 } from '../../../types';
import { renderInlineMarkdown } from '../../markdownUtils';
import { useGlossary } from '../../../context/GlossaryContext';
import { CheckQuiz } from './CheckQuiz';
import { TaskList } from './TaskList';
import { StationActivity } from './StationActivity';
import { STAR_LABELS, activityLabel, starsFor, type StationState } from './stationProgress';

interface StationCardProps {
    station: StationV3;
    number: number;
    state: StationState;
    isNext: boolean;
    isOpen: boolean;
    onToggle: () => void;
    onActivityDone: (score?: number) => void;
    onCheckDone: (firstTryCorrect: number) => void;
    onNextStation: (() => void) | null;
}

export function StarRow({ stars, size = 'sm' }: { stars: boolean[]; size?: 'sm' | 'lg' }) {
    const cls = size === 'lg' ? 'w-8 h-8' : 'w-4 h-4';
    return (
        <span className="inline-flex items-center gap-0.5">
            {stars.map((on, i) => (
                <motion.span
                    key={`${i}-${on}`}
                    initial={on ? { scale: 0, rotate: -90 } : false}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 14, delay: i * 0.12 }}
                    title={STAR_LABELS[i]}
                >
                    <Star
                        className={`${cls} ${on ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'fill-slate-100 text-slate-200'}`}
                    />
                </motion.span>
            ))}
        </span>
    );
}

type Step = 'les' | 'spill' | 'svar' | 'skriv';

// Én stasjon, ett trinn om gangen: Les → Spill → Svar → Skriv.
// Trinnlinja øverst viser alltid hvor eleven er, og hva som kommer.
export function StationCard({
    station,
    number,
    state,
    isNext,
    isOpen,
    onToggle,
    onActivityDone,
    onCheckDone,
    onNextStation,
}: StationCardProps) {
    const { entries } = useGlossary();
    const stars = starsFor(station, state);
    const starCount = stars.filter(Boolean).length;
    const done = state.checkDone;
    const act = activityLabel(station.activity);

    const steps: { id: Step; label: string; done: boolean }[] = [
        { id: 'les', label: 'Les', done: state.activityDone || done },
        ...(station.activity
            ? [{ id: 'spill' as Step, label: act?.label ?? 'Spill', done: state.activityDone }]
            : []),
        { id: 'svar', label: 'Svar', done },
        { id: 'skriv', label: 'Skriv', done: false },
    ];

    const startStep: Step = done ? 'skriv' : state.activityDone ? 'svar' : 'les';
    const [step, setStep] = useState<Step>(startStep);
    const [storyOpen, setStoryOpen] = useState(false);
    const [prevOpen, setPrevOpen] = useState(isOpen);
    if (prevOpen !== isOpen) {
        setPrevOpen(isOpen);
        if (isOpen) setStep(startStep);
    }

    const go = (s: Step) => {
        setStep(s);
        window.setTimeout(
            () =>
                document
                    .getElementById(`trinn-${station.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
            60
        );
    };
    const stepIndex = steps.findIndex((s) => s.id === step);
    const nextStep = steps[stepIndex + 1]?.id;

    const story = (size: 'lg' | 'sm') => (
        <div
            className={
                size === 'lg'
                    ? 'space-y-5 text-lg leading-8 text-slate-700'
                    : 'space-y-3 text-[15px] leading-7 text-slate-700'
            }
        >
            {station.story.map((p, i) => (
                <p key={i}>{renderInlineMarkdown(p, entries)}</p>
            ))}
        </div>
    );

    const bigButton = (label: string, onClick: () => void) => (
        <motion.button
            type="button"
            onClick={onClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-indigo-600 text-white text-lg font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700"
        >
            {label}
            <ArrowRight className="w-5 h-5" />
        </motion.button>
    );

    return (
        <div className="relative pl-11 sm:pl-16 scroll-mt-20" id={`stasjon-${station.id}`}>
            {/* Nodepunktet på stien */}
            <div className="absolute left-0 top-6 z-10">
                {isNext && !done && !isOpen && (
                    <span className="absolute inset-0 rounded-2xl bg-indigo-400 animate-ping opacity-40" />
                )}
                <div
                    className={`relative w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-lg border-2 ${
                        done
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : isNext
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-300'
                              : 'bg-white border-slate-200 text-slate-400'
                    }`}
                >
                    {done ? <Check className="w-6 h-6" /> : number}
                </div>
            </div>

            <div
                className={`rounded-3xl bg-white border transition-shadow ${
                    isOpen
                        ? 'shadow-2xl shadow-slate-300/50 border-slate-200'
                        : isNext
                          ? 'shadow-xl shadow-indigo-100 border-indigo-200 ring-2 ring-indigo-100'
                          : 'shadow-sm border-slate-200 hover:shadow-lg'
                }`}
            >
                {!isOpen ? (
                    /* Lukket: stort bilde + tittel + én knapp */
                    <button
                        type="button"
                        onClick={onToggle}
                        className="group w-full text-left flex flex-col sm:flex-row overflow-hidden rounded-3xl"
                    >
                        <div className="relative sm:w-72 lg:w-80 flex-shrink-0 aspect-[16/9] bg-slate-100 overflow-hidden">
                            {station.image ? (
                                <img
                                    src={station.image}
                                    alt=""
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-5xl">
                                    {station.emoji ?? '📍'}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2 p-4 sm:p-5 lg:px-7">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Steg {number}
                                {act && (
                                    <span className="font-bold normal-case tracking-normal">
                                        {' '}
                                        · {act.emoji} {act.label}
                                    </span>
                                )}
                            </p>
                            <h3 className="font-display text-xl sm:text-2xl font-black text-slate-900 leading-tight group-hover:text-indigo-700">
                                {station.title}
                            </h3>
                            <p className="text-slate-500 leading-snug">{station.teaser}</p>
                            <div className="mt-1 flex items-center justify-between gap-3">
                                <StarRow stars={stars} />
                                {isNext && !done ? (
                                    <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-black shadow-md shadow-indigo-200 group-hover:bg-indigo-700">
                                        {state.activityDone ? 'Fortsett' : 'Start'}
                                        <ArrowRight className="w-4 h-4" />
                                    </span>
                                ) : (
                                    <span className="text-sm font-bold text-slate-400 group-hover:text-indigo-700">
                                        {done ? 'Åpne igjen' : 'Åpne'} →
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                ) : (
                    /* Åpen: banner + trinnlinje + ett trinn om gangen */
                    <div>
                        <div className="relative h-44 sm:h-52 lg:h-56 bg-slate-800 overflow-hidden rounded-t-3xl">
                            {station.image && (
                                <img
                                    src={station.image}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                            <button
                                type="button"
                                onClick={onToggle}
                                aria-label="Lukk steget"
                                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow hover:bg-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-white">
                                <p className="text-xs font-black uppercase tracking-widest text-white/75">
                                    Steg {number}
                                </p>
                                <h3 className="font-display text-2xl sm:text-4xl font-black leading-tight drop-shadow">
                                    {station.title}
                                </h3>
                            </div>
                        </div>

                        {/* Trinnlinja */}
                        <div id={`trinn-${station.id}`} className="scroll-mt-16" />
                        <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-3 sm:px-7 py-3">
                            <ol className="flex items-center justify-between gap-1 sm:gap-2">
                                {steps.map((s, i) => {
                                    const active = s.id === step;
                                    return (
                                        <li
                                            key={s.id}
                                            className="flex items-center gap-1 sm:gap-2 sm:flex-1 sm:last:flex-none min-w-0"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => go(s.id)}
                                                className={`flex items-center gap-2 flex-shrink-0 rounded-full pl-1 pr-3 py-1 transition ${
                                                    active ? 'bg-indigo-50' : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <span
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                                                        active
                                                            ? 'bg-indigo-600 text-white'
                                                            : s.done
                                                              ? 'bg-emerald-500 text-white'
                                                              : 'bg-slate-100 text-slate-400'
                                                    }`}
                                                >
                                                    {s.done && !active ? (
                                                        <Check className="w-4 h-4" />
                                                    ) : (
                                                        i + 1
                                                    )}
                                                </span>
                                                <span
                                                    className={`text-sm font-bold whitespace-nowrap ${
                                                        active
                                                            ? 'text-indigo-700'
                                                            : 'text-slate-500 hidden sm:inline'
                                                    }`}
                                                >
                                                    {s.label}
                                                </span>
                                            </button>
                                            {i < steps.length - 1 && (
                                                <span className="hidden sm:block h-0.5 flex-1 min-w-2 rounded bg-slate-200" />
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="px-4 sm:px-8 py-7 sm:py-9"
                            >
                                {step === 'les' && (
                                    <div className="max-w-2xl mx-auto">
                                        {story('lg')}
                                        <div className="mt-8 flex justify-center">
                                            {bigButton(
                                                station.activity
                                                    ? `Videre: ${act?.label}`
                                                    : 'Videre: svar',
                                                () => go(nextStep ?? 'svar')
                                            )}
                                        </div>
                                    </div>
                                )}

                                {step === 'spill' && station.activity && (
                                    <div className="max-w-3xl mx-auto">
                                        <StationActivity
                                            stationId={station.id}
                                            activity={station.activity}
                                            done={state.activityDone}
                                            onDone={(score) => onActivityDone(score)}
                                        />
                                        <div className="mt-8 flex flex-col items-center gap-3">
                                            {state.activityDone ? (
                                                bigButton('Videre: svar', () => go('svar'))
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => go('svar')}
                                                    className="text-sm font-semibold text-slate-400 hover:text-slate-600 underline underline-offset-4"
                                                >
                                                    Hopp over og gå til spørsmålene
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {step === 'svar' && (
                                    <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
                                        {/* Fortellingen ved siden av, så svarene er innen synsvidde */}
                                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 lg:sticky lg:top-36 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                                                Svarene står her
                                            </p>
                                            <div
                                                className={`${storyOpen ? '' : 'max-h-40 overflow-hidden relative'} lg:max-h-none lg:overflow-visible`}
                                            >
                                                {story('sm')}
                                                {!storyOpen && (
                                                    <div className="lg:hidden absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50" />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setStoryOpen((o) => !o)}
                                                className="lg:hidden mt-2 text-sm font-bold text-indigo-700"
                                            >
                                                {storyOpen ? 'Vis mindre' : 'Vis hele fortellingen'}
                                            </button>
                                        </div>
                                        <div>
                                            <CheckQuiz
                                                questions={station.check}
                                                alreadyDone={done}
                                                alreadyPerfect={state.perfect}
                                                onDone={(n) => {
                                                    onCheckDone(n);
                                                    go('skriv');
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {step === 'skriv' && (
                                    <div className="max-w-3xl mx-auto space-y-8">
                                        {done && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.94 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 300,
                                                    damping: 20,
                                                }}
                                                className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-indigo-50 border border-amber-200 p-5"
                                            >
                                                <StarRow stars={stars} size="lg" />
                                                <div className="flex-1 text-center sm:text-left">
                                                    <p className="font-display text-xl font-black text-slate-900">
                                                        Steget er klarert!
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {starCount === 3
                                                            ? 'Tre av tre stjerner.'
                                                            : `${starCount} av 3 stjerner. Du kan hente resten senere.`}
                                                    </p>
                                                </div>
                                                {onNextStation && (
                                                    <motion.button
                                                        type="button"
                                                        onClick={onNextStation}
                                                        whileHover={{ scale: 1.04 }}
                                                        whileTap={{ scale: 0.96 }}
                                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                                                    >
                                                        Neste steg
                                                        <ArrowRight className="w-5 h-5" />
                                                    </motion.button>
                                                )}
                                            </motion.div>
                                        )}

                                        {station.tasks && station.tasks.length > 0 && (
                                            <section>
                                                <h4 className="font-display text-2xl font-black text-slate-900">
                                                    Skriv i skriveboka
                                                </h4>
                                                <p className="text-slate-500 mb-4">
                                                    Start med de grønne. Der står svaret rett i
                                                    teksten.
                                                </p>
                                                <TaskList
                                                    tasks={station.tasks}
                                                    numberPrefix={String(number)}
                                                    copyHeading={`Steg ${number}: ${station.title}`}
                                                />
                                            </section>
                                        )}

                                        {station.readMore && station.readMore.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 text-slate-500 font-semibold">
                                                    <BookOpen className="w-4 h-4" /> Vil du vite
                                                    mer?
                                                </span>
                                                {station.readMore.map((l) => (
                                                    <Link
                                                        key={l.url}
                                                        to={l.url}
                                                        className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-indigo-700 font-semibold hover:border-indigo-300 hover:bg-indigo-50"
                                                    >
                                                        {l.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
