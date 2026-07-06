// «Min læring» - elevens personlige dashboard: streak og dagens mål,
// nivå/XP, fag-mestring, anbefalinger, utmerkelser, aktivitetshistorikk
// og synk-kode. All data kommer fra progresjonsstoren + manifestet.

import { useEffect, useMemo, useState } from 'react';
import { useManifest } from '../hooks/useManifest';
import { usePageTitle } from '../hooks/usePageTitle';
import { useProgressStore, buildMetrics, isStreakAlive } from '../features/progress/useProgressStore';
import { streakMultiplier } from '../features/progress/streak';
import { useReviewStore } from '../stores/useReviewStore';
import { useLearningPathProfile } from '../stores/useLearningPathProfile';
import { computeMastery } from '../features/progress/mastery';
import { generateDailyGoals, goalProgress } from '../features/progress/goals';
import { buildRecommendations, findPathTool, findNextArticle } from '../features/progress/recommendations/engine';
import { loadDetectiveCatalog } from '../features/progress/recommendations/catalog';
import type { DetectiveCatalogEntry } from '../features/progress/recommendations/catalog';
import { getAvatar } from '../features/progress/avatars';
import { todayLocal } from '../utils/reviewScheduler';
import { HeroCard } from '../features/progress/components/HeroCard';
import type { PrimaryAction } from '../features/progress/components/HeroCard';
import { LevelCard } from '../features/progress/components/LevelCard';
import { SubjectRings } from '../features/progress/components/SubjectRings';
import { RecommendationsSection } from '../features/progress/components/RecommendationsSection';
import { BadgeGallery } from '../features/progress/components/BadgeGallery';
import { ActivitySection } from '../features/progress/components/ActivitySection';
import { SyncCard } from '../features/progress/components/SyncCard';
import { ProfileDialog } from '../features/progress/components/ProfileDialog';

export const MyLearningPage = () => {
    usePageTitle('Min læring', true);
    const today = todayLocal();

    const { data: manifest } = useManifest();
    const profile = useProgressStore((s) => s.profile);
    const totalXp = useProgressStore((s) => s.totalXp);
    const streak = useProgressStore((s) => s.streak);
    const counters = useProgressStore((s) => s.counters);
    const badges = useProgressStore((s) => s.badges);
    const dayLog = useProgressStore((s) => s.dayLog);
    const events = useProgressStore((s) => s.events);
    const firstCompletions = useProgressStore((s) => s.firstCompletions);
    const bestScores = useProgressStore((s) => s.bestScores);
    const goals = useProgressStore((s) => s.goals);
    const setDailyGoals = useProgressStore((s) => s.setDailyGoals);
    const lastGoalBonusDay = useProgressStore((s) => s.lastGoalBonusDay);
    const awardDailyGoalBonus = useProgressStore((s) => s.awardDailyGoalBonus);

    const dueCount = useReviewStore((s) => s.dueCount(today));
    const hasSessionToday = useReviewStore((s) => s.hasSessionToday(today));
    const paths = useLearningPathProfile((s) => s.paths);

    const [profileOpen, setProfileOpen] = useState(false);

    // Detektivsaker enumereres fra sitt eget manifest (async, lettvekts).
    const [detectiveCases, setDetectiveCases] = useState<DetectiveCatalogEntry[]>([]);
    useEffect(() => {
        let alive = true;
        loadDetectiveCatalog().then((cases) => {
            if (alive) setDetectiveCases(cases);
        });
        return () => {
            alive = false;
        };
    }, []);

    const mastery = useMemo(
        () => (manifest ? computeMastery(manifest, firstCompletions, bestScores, events) : []),
        [manifest, firstCompletions, bestScores, events]
    );

    const metrics = useMemo(
        () => buildMetrics({ counters, totalXp, streak, dayLog }),
        [counters, totalXp, streak, dayLog]
    );

    // Anbefalinger på tvers av alle innholdstyper - rangert og variert.
    const recommendations = useMemo(() => {
        if (!manifest) return [];
        return buildRecommendations({
            manifest,
            mastery,
            firstCompletions,
            events,
            paths,
            dueCount,
            detectiveCases,
        });
    }, [manifest, mastery, firstCompletions, events, paths, dueCount, detectiveCases]);

    // Det viktigste steget blir stor knapp øverst; resten fyller «Anbefalt for deg».
    const primaryAction: PrimaryAction | null = recommendations[0]
        ? {
              title: recommendations[0].title,
              subtitle: recommendations[0].reason,
              link: recommendations[0].link,
          }
        : null;
    const restRecommendations = recommendations.slice(1);

    // Inndata til dagens mål (påbegynt sti, neste artikkel, svakt emne).
    const goalInputs = useMemo(() => {
        const isRead = (path: string) => Boolean(firstCompletions[`article-read:${path}`]);

        const activePath = Object.values(paths)
            .filter((p) => p.finishedAt === null)
            .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt)[0];
        const pathTool = activePath && manifest ? findPathTool(manifest, activePath.pathId) : null;
        const continuePath = pathTool ? { title: pathTool.title, link: pathTool.link } : null;

        let nextArticle: { title: string; link: string } | null = null;
        if (manifest) {
            const started = mastery
                .flatMap((subject) =>
                    subject.topics.map((topic) => ({ subject: subject.subjectId, topic }))
                )
                .filter(
                    ({ topic }) =>
                        topic.completedLessons > 0 && topic.completedLessons < topic.totalLessons
                )
                .sort(
                    (a, b) =>
                        b.topic.completedLessons / b.topic.totalLessons -
                        a.topic.completedLessons / a.topic.totalLessons
                )[0];
            if (started) {
                nextArticle = findNextArticle(manifest, started.subject, started.topic.topicId, isRead);
            }
        }

        const weak = mastery
            .flatMap((subject) =>
                subject.topics.map((topic) => ({ subject: subject.subjectId, topic }))
            )
            .filter(({ topic }) => topic.qualityLevel === 'red' || topic.qualityLevel === 'yellow')
            .sort((a, b) => (a.topic.quality ?? 0) - (b.topic.quality ?? 0))[0];
        const weakTopic = weak
            ? { title: weak.topic.title, link: `/${weak.subject}/${weak.topic.topicId}` }
            : null;

        return { dueCount, hasSessionToday, continuePath, nextArticle, weakTopic };
    }, [manifest, mastery, paths, firstCompletions, dueCount, hasSessionToday]);

    // Generer dagens mål én gang per dag
    useEffect(() => {
        if (!manifest) return;
        if (goals?.day === today) return;
        setDailyGoals(today, generateDailyGoals(goalInputs));
    }, [manifest, goals?.day, today, goalInputs, setDailyGoals]);

    const todaysEvents = useMemo(() => events.filter((e) => e.day === today), [events, today]);
    const goalsWithProgress = useMemo(
        () =>
            (goals?.day === today ? goals.items : []).map((goal) => ({
                goal,
                progress: goalProgress(goal, todaysEvents),
            })),
        [goals, today, todaysEvents]
    );

    // Streak-tall til hero: multiplikatoren gjelder bare en levende streak.
    const streakAlive = isStreakAlive(streak, today);
    const multiplier = streakMultiplier(streakAlive ? streak.current : 0);

    // Dagsbonus: når alle dagens mål er fullført, gi engangsbonus (idempotent).
    useEffect(() => {
        if (goalsWithProgress.length === 0) return;
        if (lastGoalBonusDay === today) return;
        const allDone = goalsWithProgress.every(({ goal, progress }) => progress >= goal.target);
        if (allDone) awardDailyGoalBonus(today);
    }, [goalsWithProgress, lastGoalBonusDay, today, awardDailyGoalBonus]);

    return (
        <div className="pb-16">
            <div className="mb-6">
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-2 text-slate-900">
                    Min læring
                </h1>
                <p className="text-slate-600">
                    Fremgangen din, målene dine og det som venter på deg.
                </p>
            </div>

            <div className="space-y-4">
                <HeroCard
                    nickname={profile.nickname}
                    avatarEmoji={getAvatar(profile.avatarId).emoji}
                    streak={streak.current}
                    streakAlive={streakAlive}
                    bestStreak={streak.best}
                    freezes={streak.freezes ?? 0}
                    multiplier={multiplier}
                    primaryAction={primaryAction}
                    goals={goalsWithProgress}
                    onEditProfile={() => setProfileOpen(true)}
                />

                <div className="grid lg:grid-cols-3 gap-4 items-start">
                    <div className="space-y-4 lg:col-span-1">
                        <LevelCard totalXp={totalXp} badgeCount={Object.keys(badges).length} />
                        <SyncCard />
                    </div>
                    <div className="space-y-4 lg:col-span-2">
                        <RecommendationsSection items={restRecommendations} />
                        <SubjectRings mastery={mastery} />
                    </div>
                </div>

                <ActivitySection dayLog={dayLog} />
                <BadgeGallery unlocked={badges} metrics={metrics} />
            </div>

            <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
        </div>
    );
};
