import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Brain,
    Clock,
    Map as MapIcon,
    Monitor,
    RotateCcw,
    Star,
    Trophy,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { LearningPathV3Data, StationV3 } from '../../../types';
import { useLearningPathProfile } from '../../../stores/useLearningPathProfile';
import { useStepSounds } from '../../../hooks/useStepSounds';
import { captureConceptEncounters } from '../../../utils/reviewCapture';
import { renderInlineMarkdown } from '../../markdownUtils';
import { useGlossary } from '../../../context/GlossaryContext';
import { StationCard, StarRow } from './StationCard';
import { DeepDiveCard, ProjectCard } from './PathExtras';
import { allStations, artifactOf, countStars, readStation } from './stationProgress';

interface LearningPathV3Props {
    data: LearningPathV3Data;
}

const HOW_IT_WORKS = [
    { emoji: '📖', title: 'Les', text: 'En kort fortelling. Alt du trenger står der.' },
    { emoji: '🎮', title: 'Spill', text: 'Spill eller løs en utfordring.' },
    { emoji: '🎯', title: 'Svar', text: 'Svar på spørsmål og samle stjerner.' },
    { emoji: '✍️', title: 'Skriv', text: 'Oppgaver til skriveboka.' },
];

function formatMinutes(min: number): string {
    if (min < 90) return `ca. ${min} min`;
    const h = Math.round(min / 30) / 2;
    return `ca. ${String(h).replace('.', ',')} timer`;
}

// Læringssti v3: én vertikal sti med faser og stasjoner (se docs/LEARNING_PATH_V3.md).
// Myk lås: neste stasjon lyser opp og anbefales, men alle kan åpnes.
export function LearningPathV3({ data }: LearningPathV3Props) {
    const { entries } = useGlossary();
    const profile = useLearningPathProfile();
    const pathState = useLearningPathProfile((s) => s.paths[data.id]);
    const sounds = useStepSounds();
    const navigate = useNavigate();
    const params = useParams<{
        subjectId: string;
        topicId: string;
        subTopicId?: string;
        lessonId: string;
    }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const stations = useMemo(() => allStations(data), [data]);
    const stateOf = useCallback(
        (s: StationV3) => readStation(pathState?.responses[s.id]),
        [pathState]
    );

    const nextStation = stations.find((s) => !stateOf(s).checkDone) ?? null;
    const doneCount = stations.filter((s) => stateOf(s).checkDone).length;
    const totalStars = stations.reduce((n, s) => n + countStars(s, stateOf(s)), 0);
    const maxStars = stations.length * 3;
    const started = !!pathState;
    const allDone = doneCount === stations.length && stations.length > 0;

    const [openId, setOpenId] = useState<string | null>(null);

    const ensureStarted = () => {
        if (!useLearningPathProfile.getState().paths[data.id] && stations[0]) {
            profile.startPath(data.id, stations[0].id);
        }
    };

    const openStation = useCallback((id: string, scroll = true) => {
        setOpenId(id);
        if (scroll) {
            window.setTimeout(() => {
                document
                    .getElementById(`stasjon-${id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 60);
        }
    }, []);

    // Tilbake fra et stort 3D-spill: åpne stasjonen eleven kom fra.
    useEffect(() => {
        const fra = searchParams.get('stasjon');
        if (fra && stations.some((s) => s.id === fra)) {
            openStation(fra);
            // Siden scroller selv til toppen etter navigering. Scroll på nytt når den er ferdig.
            window.setTimeout(
                () =>
                    document
                        .getElementById(`stasjon-${fra}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                700
            );
            searchParams.delete('stasjon');
            setSearchParams(searchParams, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Alle stasjoner klarert: registrer fullført sti én gang.
    useEffect(() => {
        if (allDone && pathState && pathState.finishedAt === null) {
            profile.finishPath(data.id);
            sounds.play('complete');
        }
    }, [allDone, pathState, profile, data.id, sounds]);

    const toggle = (id: string) => {
        if (openId === id) {
            setOpenId(null);
            return;
        }
        // Åpne først: lagring av fremdrift skal aldri kunne stoppe selve klikket.
        openStation(id);
        sounds.play('select');
        ensureStarted();
        profile.setCurrentStep(data.id, id);
    };

    const handleActivityDone = (station: StationV3) => () => {
        ensureStarted();
        const prev = stateOf(station);
        if (prev.activityDone) return;
        sounds.play('correct');
        profile.saveResponse(data.id, station.id, {
            artifact: artifactOf({ ...prev, activityDone: true }),
        });
    };

    const handleCheckDone = (station: StationV3) => (firstTry: number) => {
        ensureStarted();
        const prev = stateOf(station);
        const total = station.check.length;
        const perfect = firstTry === total;
        const score = total ? firstTry / total : 1;
        profile.completeStep(
            data.id,
            station.id,
            {
                completed: true,
                // Beste forsøk teller: en ny runde skal aldri ta fra eleven en stjerne.
                score: Math.max(score, pathState?.responses[station.id]?.score ?? 0),
                artifact: artifactOf({
                    ...prev,
                    checkDone: true,
                    perfect: prev.perfect || perfect,
                }),
            },
            station.conceptsIntroduced ?? []
        );
        captureConceptEncounters(station.conceptsIntroduced ?? []);
        sounds.play('complete');
    };

    const nextAfter = (station: StationV3): (() => void) | null => {
        const i = stations.indexOf(station);
        const after = stations.slice(i + 1).find((s) => !stateOf(s).checkDone) ?? stations[i + 1];
        if (!after) return null;
        return () => {
            profile.setCurrentStep(data.id, after.id);
            sounds.play('advance');
            openStation(after.id);
        };
    };

    // Dypdykk og fordypning lagres som egne svar i profilen (ikke stasjoner, gir ikke stjerner).
    const extraOf = (id: string) => {
        const r = pathState?.responses[id];
        const art = (r?.artifact ?? {}) as { read?: string[]; choice?: string };
        return { done: !!r?.completed, read: art.read ?? [], choice: art.choice ?? null };
    };
    const saveExtra = (id: string, patch: { done?: boolean; read?: string[]; choice?: string }) => {
        ensureStarted();
        const prev = extraOf(id);
        const next = { ...prev, ...patch };
        profile.saveResponse(data.id, id, {
            completed: next.done,
            artifact: { read: next.read, choice: next.choice },
        });
    };
    const deepDives = data.phases.filter((p) => p.deepDive);
    const deepDivesDone = deepDives.filter((p) => extraOf(`dypdykk-${p.id}`).done).length;

    const handleReset = () => {
        if (!confirm('Vil du starte stien på nytt? Stjernene dine blir nullstilt.')) return;
        profile.resetPath(data.id);
        setOpenId(null);
    };

    const presentationTarget = useMemo(() => {
        const { subjectId, topicId, subTopicId, lessonId } = params;
        if (!data.presentation?.slides?.length || !subjectId || !topicId || !lessonId) return null;
        return subTopicId
            ? `/${subjectId}/${topicId}/${subTopicId}/present/${data.id}`
            : `/${subjectId}/${topicId}/present/${data.id}`;
    }, [params, data.id, data.presentation]);

    const cta = nextStation
        ? {
              label: started ? `Fortsett: ${nextStation.title}` : 'Start reisen',
              go: () => {
                  ensureStarted();
                  openStation(nextStation.id);
              },
          }
        : null;

    let stationNumber = 0;

    return (
        <div className="max-w-6xl mx-auto px-1 sm:px-4 lg:px-8 py-6 sm:py-8">
            {/* Toppkortet */}
            <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 mb-8 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                {data.heroImage && (
                    <div className="relative hidden lg:block lg:order-2 min-h-[18rem]">
                        <img
                            src={data.heroImage}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />
                    </div>
                )}
                {data.heroImage && (
                    <div className="relative h-36 sm:h-44 lg:hidden">
                        <img src={data.heroImage} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
                    </div>
                )}
                <div
                    className={`px-5 sm:px-8 pb-6 lg:order-1 lg:py-8 lg:pl-10 ${data.heroImage ? '-mt-10 relative lg:mt-0' : 'pt-6'}`}
                >
                    <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">
                        <MapIcon className="w-4 h-4" /> Læringssti
                    </p>
                    <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                        {data.title}
                    </h1>
                    <p className="mt-2 text-slate-600 leading-relaxed">
                        {renderInlineMarkdown(data.description, entries)}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 font-semibold">
                        <span>{stations.length} steg</span>
                        <span>{data.phases.length} deler</span>
                        {deepDives.length > 0 && (
                            <span>
                                📚 {deepDivesDone} av {deepDives.length} dypdykk
                            </span>
                        )}
                        {data.estimatedMinutes && (
                            <span className="inline-flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {formatMinutes(data.estimatedMinutes)}
                            </span>
                        )}
                    </div>

                    {/* Fremdrift */}
                    <div className="mt-5">
                        <div className="flex items-center justify-between text-sm font-bold mb-1.5">
                            <span className="text-slate-700">
                                {doneCount} av {stations.length} steg klarert
                            </span>
                            <span className="inline-flex items-center gap-1 text-amber-600">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                {totalStars} / {maxStars}
                            </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                initial={false}
                                animate={{
                                    width: `${(doneCount / Math.max(1, stations.length)) * 100}%`,
                                }}
                                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        {cta && (
                            <motion.button
                                type="button"
                                onClick={cta.go}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white text-base font-black shadow-lg shadow-indigo-300 hover:bg-indigo-700 max-w-full"
                            >
                                <span className="truncate">{cta.label}</span>
                                <ArrowRight className="w-5 h-5 flex-shrink-0" />
                            </motion.button>
                        )}
                        {presentationTarget && (
                            <button
                                type="button"
                                onClick={() => navigate(presentationTarget)}
                                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:border-indigo-300 hover:text-indigo-700"
                                title="Lysbilder læreren kan vise på storskjerm"
                            >
                                <Monitor className="w-4 h-4" /> Lysbilder
                            </button>
                        )}
                        {started && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 px-3 py-3 text-xs font-semibold text-slate-400 hover:text-slate-600"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Start på nytt
                            </button>
                        )}
                    </div>
                </div>

                {!started && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-100 bg-slate-50/70 lg:order-3 lg:col-span-2">
                        {HOW_IT_WORKS.map((h, i) => (
                            <div
                                key={h.title}
                                className={`p-3 sm:p-4 ${i > 0 ? 'border-l border-slate-100' : ''}`}
                            >
                                <p className="text-2xl mb-1">{h.emoji}</p>
                                <p className="font-black text-slate-800 text-sm">
                                    {i + 1}. {h.title}
                                </p>
                                <p className="text-xs text-slate-500 leading-snug mt-0.5">
                                    {h.text}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </header>
            {/* Selve stien */}
            <div className="relative">
                <div className="absolute left-[16px] sm:left-[22px] top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-indigo-200 via-slate-200 to-amber-200" />
                <div className="space-y-10">
                    {data.phases.map((phase, pi) => {
                        const phaseStars = phase.stations.reduce(
                            (n, s) => n + countStars(s, stateOf(s)),
                            0
                        );
                        return (
                            <section key={phase.id} className="space-y-4">
                                <div className="relative pl-11 sm:pl-16">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-9 sm:w-12 flex justify-center">
                                        <span className="w-4 h-4 rounded-full bg-white border-4 border-slate-300" />
                                    </div>
                                    <div className="flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
                                                Del {pi + 1}
                                            </p>
                                            <h2 className="font-display text-2xl font-black text-slate-900 leading-tight">
                                                {phase.title}
                                            </h2>
                                            {phase.subtitle && (
                                                <p className="text-sm text-slate-500">
                                                    {phase.subtitle}
                                                </p>
                                            )}
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 flex-shrink-0">
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            {phaseStars}/{phase.stations.length * 3}
                                        </span>
                                    </div>
                                </div>
                                {phase.stations.map((station) => {
                                    const state = stateOf(station);
                                    stationNumber += 1;
                                    return (
                                        <StationCard
                                            key={station.id}
                                            station={station}
                                            number={stationNumber}
                                            state={state}
                                            isNext={nextStation?.id === station.id}
                                            isOpen={openId === station.id}
                                            onToggle={() => toggle(station.id)}
                                            onActivityDone={handleActivityDone(station)}
                                            onCheckDone={handleCheckDone(station)}
                                            onNextStation={nextAfter(station)}
                                        />
                                    );
                                })}
                                {phase.deepDive &&
                                    (() => {
                                        const id = `dypdykk-${phase.id}`;
                                        const ex = extraOf(id);
                                        return (
                                            <DeepDiveCard
                                                phaseNumber={pi + 1}
                                                deepDive={phase.deepDive}
                                                ready={phase.stations.every(
                                                    (st) => stateOf(st).checkDone
                                                )}
                                                done={ex.done}
                                                readUrls={ex.read}
                                                onRead={(url) =>
                                                    ex.read.includes(url) ||
                                                    saveExtra(id, { read: [...ex.read, url] })
                                                }
                                                onToggleDone={() => {
                                                    if (!ex.done) sounds.play('complete');
                                                    saveExtra(id, { done: !ex.done });
                                                }}
                                            />
                                        );
                                    })()}
                            </section>
                        );
                    })}

                    {data.project && (
                        <ProjectCard
                            intro={data.project.intro}
                            choices={data.project.choices}
                            chosen={extraOf('fordypning').choice}
                            onChoose={(choice) => {
                                sounds.play('select');
                                saveExtra('fordypning', { choice, done: true });
                            }}
                        />
                    )}

                    {/* Målet */}
                    <section className="relative pl-11 sm:pl-16">
                        <div className="absolute left-0 top-4">
                            <div
                                className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 ${
                                    allDone
                                        ? 'bg-amber-400 border-amber-400 text-white shadow-lg shadow-amber-200'
                                        : 'bg-white border-slate-200 text-slate-300'
                                }`}
                            >
                                <Trophy className="w-6 h-6" />
                            </div>
                        </div>
                        <motion.div
                            initial={false}
                            animate={allDone ? { scale: [0.96, 1.02, 1] } : {}}
                            className={`rounded-2xl border p-5 sm:p-6 ${
                                allDone
                                    ? 'bg-gradient-to-br from-amber-50 via-white to-indigo-50 border-amber-200 shadow-xl shadow-amber-100'
                                    : 'bg-white/60 border-dashed border-slate-200'
                            }`}
                        >
                            <h3 className="font-display text-xl font-black text-slate-900">
                                {allDone
                                    ? (data.finale?.title ?? 'Du klarte hele stien!')
                                    : 'Målet'}
                            </h3>
                            {allDone ? (
                                <>
                                    <div className="my-3 flex items-center gap-3">
                                        <StarRow stars={[true, true, true]} size="lg" />
                                        <span className="font-black text-amber-600 text-lg">
                                            {totalStars} av {maxStars} stjerner
                                        </span>
                                    </div>
                                    {data.finale?.text && (
                                        <p className="text-slate-600 leading-relaxed">
                                            {data.finale.text}
                                        </p>
                                    )}
                                    {totalStars < maxStars && (
                                        <p className="mt-2 text-sm text-slate-500">
                                            Mangler du stjerner? Åpne et steg igjen og hent dem.
                                        </p>
                                    )}
                                    {data.targetTopicId && (
                                        <Link
                                            to={`/oving/quiz?topic=${data.targetTopicId}${data.targetSubjectId ? `&subject=${data.targetSubjectId}` : ''}`}
                                            className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                                        >
                                            <Brain className="w-5 h-5" />
                                            Ta den store quizen
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <p className="text-slate-500 text-sm mt-1">
                                    Klarer du alle {stations.length} stegene, er stien din. Du
                                    har {doneCount} så langt.
                                </p>
                            )}
                        </motion.div>
                    </section>
                </div>
            </div>
        </div>
    );
}
