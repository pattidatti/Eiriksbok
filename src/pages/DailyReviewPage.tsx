import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useConcepts } from '../hooks/useConcepts';
import { useGlobalTimeline } from '../hooks/useGlobalTimeline';
import { useUserHistory } from '../hooks/useUserHistory';
import { useManifest } from '../hooks/useManifest';
import { useTimelineImageMap } from '../hooks/useTimelineImage';
import { useMicroGameMap } from '../hooks/useMicroGameMap';
import { useReviewStore } from '../stores/useReviewStore';
import { buildSession, type SessionAssets } from '../utils/reviewSession';
import { pickDailyGame } from '../utils/reviewFinale';
import { addDays, todayLocal } from '../utils/reviewScheduler';
import { useStepSounds } from '../hooks/useStepSounds';
import { MICRO_GAMES } from '../components/microgames/registry';
import type { MicroGameResult } from '../components/microgames/types';
import type { SessionExercise } from '../types/review';
import { ReviewIntro } from '../components/review/ReviewIntro';
import { ReviewProgressBar } from '../components/review/ReviewProgressBar';
import { ReviewSummary } from '../components/review/ReviewSummary';
import { ReviewFinale } from '../components/review/ReviewFinale';
import { ComboBadge } from '../components/review/ComboBadge';
import { ExerciseFlashcard } from '../components/review/ExerciseFlashcard';
import { ExerciseMcq } from '../components/review/ExerciseMcq';
import { ExerciseYearPick } from '../components/review/ExerciseYearPick';
import { ExerciseImageMcq } from '../components/review/ExerciseImageMcq';
import { ExerciseTimelineOrder } from '../components/review/ExerciseTimelineOrder';
import { ExerciseMatchPairs } from '../components/review/ExerciseMatchPairs';
import { subjectAccent } from '../components/review/reviewTheme';
import { motionPresets, transitions } from '../styles/motion-presets';

type Phase = 'intro' | 'exercise' | 'finale' | 'summary';

const MILESTONES = [3, 7, 14, 30, 50, 100];

// «Dagens økt» - adaptiv repetisjon med dramaturgi: oppvarming, kjerneøvelser,
// 3D-spillfinale og feiring. Øvelsene bygges deterministisk fra repetisjonskøen
// (useReviewStore) + seeding, og graderes med Leitner-bokser.
export const DailyReviewPage: React.FC = () => {
    const concepts = useConcepts();
    const { events } = useGlobalTimeline();
    const { history } = useUserHistory();
    const { data: manifest } = useManifest();
    const timelineImages = useTimelineImageMap();
    const gameMap = useMicroGameMap();
    const streak = useReviewStore((s) => s.streak);
    const items = useReviewStore((s) => s.items);
    const today = useMemo(() => todayLocal(), []);
    const dueCount = useReviewStore((s) => s.dueCount(today));
    const tomorrowDue = useReviewStore((s) => s.dueCount(addDays(today, 1)));
    const doneToday = useReviewStore((s) => s.hasSessionToday(today));
    const { play, setMuted, isMuted } = useStepSounds();
    const reducedMotion = useReducedMotion();

    const [phase, setPhase] = useState<Phase>('intro');
    const [exercises, setExercises] = useState<SessionExercise[]>([]);
    const [index, setIndex] = useState(0);
    const [combo, setCombo] = useState(0);
    const [isBonus, setIsBonus] = useState(false);
    const [milestone, setMilestone] = useState<number | null>(null);
    const [gameResult, setGameResult] = useState<MicroGameResult | null>(null);
    const [muted, setMutedState] = useState(() => isMuted());
    const resultsRef = useRef<(boolean | undefined)[]>([]);
    const [results, setResults] = useState<(boolean | undefined)[]>([]);

    const ready = concepts.length > 0;

    // Bildekilder til bildeoppgavene: leksjons- og temabilder fra manifestet
    // + tidslinjebilder. Bygges én gang og sendes inn i øktbyggeren.
    const assets = useMemo<SessionAssets | undefined>(() => {
        if (!manifest) return undefined;
        const lessonImageByLessonId = new Map<string, string>();
        const topicImageByTopicId = new Map<string, string>();
        for (const subject of manifest.subjects) {
            for (const topic of subject.topics) {
                if (topic.image) topicImageByTopicId.set(topic.id, topic.image);
                for (const lesson of topic.lessons ?? []) {
                    if (lesson.image) lessonImageByLessonId.set(lesson.id, lesson.image);
                }
                for (const subTopic of topic.subTopics ?? []) {
                    for (const lesson of subTopic.lessons) {
                        if (lesson.image) lessonImageByLessonId.set(lesson.id, lesson.image);
                    }
                }
            }
        }
        return {
            lessonImageByLessonId,
            topicImageByTopicId,
            timelineImageByEventId: timelineImages ?? {},
        };
    }, [manifest, timelineImages]);

    // Deterministisk forhåndsvisning: «dagens meny» i introen er identisk med
    // økta som faktisk bygges når eleven trykker start.
    const preview = useMemo(
        () => (ready ? buildSession(items, concepts, events, history, today, assets) : []),
        [ready, items, concepts, events, history, today, assets]
    );
    const game = useMemo(
        () => (preview.length > 0 ? pickDailyGame(MICRO_GAMES, gameMap, preview, today) : null),
        [preview, gameMap, today]
    );

    const startSession = () => {
        const built = buildSession(
            useReviewStore.getState().items,
            concepts,
            events,
            history,
            today,
            assets
        );
        if (built.length === 0) return;
        resultsRef.current = [];
        setResults([]);
        setExercises(built);
        setIndex(0);
        setCombo(0);
        setMilestone(null);
        setGameResult(null);
        setIsBonus(doneToday);
        setPhase('exercise');
    };

    const handleAnswer = (correct: boolean) => {
        const exercise = exercises[index];
        if (resultsRef.current[index] !== undefined) return;
        resultsRef.current[index] = correct;
        setResults([...resultsRef.current]);
        const nextCombo = correct ? combo + 1 : 0;
        setCombo(nextCombo);
        if (correct && (nextCombo === 3 || nextCombo === 5) && !reducedMotion) {
            confetti({
                particleCount: 30,
                spread: 55,
                origin: { y: 0.75 },
                colors: ['#6366f1', '#f59e0b', '#10b981'],
            });
        }
        // Seedede items er ikke i store ennå - addItem er no-op for de som er det
        const store = useReviewStore.getState();
        store.addItem(
            {
                id: exercise.item.id,
                type: exercise.item.type,
                term: exercise.item.term,
                quiz: exercise.item.quiz,
                eventId: exercise.item.eventId,
            },
            today
        );
        store.gradeItem(exercise.item.id, correct, today);
    };

    const handleNext = () => {
        if (index < exercises.length - 1) {
            play('advance');
            setIndex(index + 1);
            return;
        }
        // Økta fullføres FØR finalen - streaken er sikret selv om eleven
        // lukker fanen midt i spillet
        const store = useReviewStore.getState();
        const prevStreak = store.streak.current;
        const correct = resultsRef.current.filter(Boolean).length;
        store.completeSession({ completedAt: Date.now(), correct, total: exercises.length }, today);
        const newStreak = useReviewStore.getState().streak.current;
        setMilestone(
            MILESTONES.includes(newStreak) && newStreak !== prevStreak ? newStreak : null
        );
        play('complete');
        setPhase(game && !isBonus ? 'finale' : 'summary');
    };

    const handleFinaleFinish = (result: MicroGameResult | null) => {
        if (result && game) {
            useReviewStore.getState().recordGameResult(today, game.gameId, result.score);
            setGameResult(result);
        }
        setPhase('summary');
    };

    const toggleMute = () => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
    };

    const exercise = exercises[index];
    const correctCount = resultsRef.current.filter(Boolean).length;
    const accent = subjectAccent(exercise?.subjectId);

    return (
        <div className="min-h-screen pt-20 pb-12 bg-slate-50">
            <div
                className={`mx-auto px-4 sm:px-6 transition-all ${phase === 'finale' ? 'max-w-4xl' : 'max-w-2xl'}`}
            >
                <AnimatePresence mode="wait">
                    {phase === 'intro' && (
                        <motion.div key="intro" {...motionPresets.fadeIn}>
                            <ReviewIntro
                                streak={streak.current}
                                dueCount={dueCount}
                                doneToday={doneToday}
                                ready={ready}
                                onStart={startSession}
                                preview={preview}
                                game={game}
                            />
                        </motion.div>
                    )}

                    {phase === 'exercise' && exercise && (
                        <motion.div key="exercise" {...motionPresets.fadeIn}>
                            <div className="mb-8 flex items-center gap-3">
                                {exercise.subjectId ? (
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${accent.chip}`}
                                    >
                                        {accent.label || exercise.subjectId}
                                    </span>
                                ) : (
                                    <span className="w-16" aria-hidden />
                                )}
                                <div className="flex-1">
                                    <ReviewProgressBar
                                        total={exercises.length}
                                        current={index}
                                        results={results}
                                        hasFinale={!!game && !isBonus}
                                    />
                                </div>
                                <div className="flex items-center gap-2 min-w-16 justify-end">
                                    <ComboBadge combo={combo} />
                                    <button
                                        onClick={toggleMute}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                        aria-label={muted ? 'Slå på lyd' : 'Slå av lyd'}
                                    >
                                        {muted ? (
                                            <VolumeX className="w-4 h-4" />
                                        ) : (
                                            <Volume2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={exercise.item.id}
                                    variants={motionPresets.slideUp}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={transitions.springSoft}
                                >
                                    {exercise.kind === 'flashcard' && (
                                        <ExerciseFlashcard
                                            exercise={exercise}
                                            onAnswer={handleAnswer}
                                            onNext={handleNext}
                                        />
                                    )}
                                    {exercise.kind === 'mcq' && (
                                        <ExerciseMcq
                                            exercise={exercise}
                                            onAnswer={handleAnswer}
                                            onNext={handleNext}
                                            kicker={
                                                exercise.item.type === 'quiz'
                                                    ? 'Husker du dette fra en quiz?'
                                                    : 'Hvilket begrep passer?'
                                            }
                                        />
                                    )}
                                    {exercise.kind === 'year-pick' && (
                                        <ExerciseYearPick
                                            exercise={exercise}
                                            onAnswer={handleAnswer}
                                            onNext={handleNext}
                                        />
                                    )}
                                    {exercise.kind === 'image-mcq' && (
                                        <ExerciseImageMcq
                                            exercise={exercise}
                                            onAnswer={handleAnswer}
                                            onNext={handleNext}
                                        />
                                    )}
                                    {exercise.kind === 'timeline-order' && (
                                        <ExerciseTimelineOrder
                                            exercise={exercise}
                                            onAnswer={handleAnswer}
                                            onNext={handleNext}
                                        />
                                    )}
                                    {exercise.kind === 'match-pairs' && (
                                        <ExerciseMatchPairs
                                            exercise={exercise}
                                            onAnswer={handleAnswer}
                                            onNext={handleNext}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {phase === 'finale' && game && (
                        <motion.div key="finale" {...motionPresets.fadeIn}>
                            <ReviewFinale game={game} onFinish={handleFinaleFinish} />
                        </motion.div>
                    )}

                    {phase === 'summary' && (
                        <motion.div key="summary" {...motionPresets.fadeIn}>
                            <ReviewSummary
                                correct={correctCount}
                                total={exercises.length}
                                streak={useReviewStore.getState().streak.current}
                                onBonusRound={startSession}
                                milestone={milestone}
                                gameTitle={gameResult && game ? game.title : undefined}
                                gameScore={gameResult?.score ?? null}
                                exercises={exercises}
                                results={results}
                                tomorrowDue={tomorrowDue}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
