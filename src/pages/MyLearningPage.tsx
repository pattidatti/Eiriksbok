// «Min læring» - elevens personlige dashboard: streak og dagens mål,
// nivå/XP, fag-mestring, anbefalinger, utmerkelser, aktivitetshistorikk
// og synk-kode. All data kommer fra progresjonsstoren + manifestet.

import { useEffect, useMemo, useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useProgressStore, buildMetrics, isStreakAlive } from '../features/progress/useProgressStore';
import { streakMultiplier } from '../features/progress/streak';
import { useReviewStore } from '../stores/useReviewStore';
import { useLearningPathProfile } from '../stores/useLearningPathProfile';
import { generateDailyGoals, goalProgress, pickBonusGoalId } from '../features/progress/goals';
import {
    buildWelcomeRecommendations,
    findPathTool,
    findNextArticle,
} from '../features/progress/recommendations/engine';
import { useRecommendations } from '../features/progress/useRecommendations';
import { buildRecentlyRead, buildStartedArticles } from '../features/progress/recommendations/history';
import { useUserHistory } from '../hooks/useUserHistory';
import { getAvatar } from '../features/progress/avatars';
import { todayLocal } from '../utils/reviewScheduler';
import { HeroCard } from '../features/progress/components/HeroCard';
import type { PrimaryAction } from '../features/progress/components/HeroCard';
import { SubjectRings } from '../features/progress/components/SubjectRings';
import { RecommendationsSection } from '../features/progress/components/RecommendationsSection';
import { ArticleListSection } from '../features/progress/components/ArticleListSection';
import { BadgeGallery } from '../features/progress/components/BadgeGallery';
import { ActivitySection } from '../features/progress/components/ActivitySection';
import { SyncCard } from '../features/progress/components/SyncCard';
import { ProfileDialog } from '../features/progress/components/ProfileDialog';

export const MyLearningPage = () => {
    usePageTitle('Min læring', true);
    const today = todayLocal();

    const { manifest, mastery, recommendations } = useRecommendations();
    const profile = useProgressStore((s) => s.profile);
    const totalXp = useProgressStore((s) => s.totalXp);
    const streak = useProgressStore((s) => s.streak);
    const counters = useProgressStore((s) => s.counters);
    const badges = useProgressStore((s) => s.badges);
    const dayLog = useProgressStore((s) => s.dayLog);
    const events = useProgressStore((s) => s.events);
    const firstCompletions = useProgressStore((s) => s.firstCompletions);
    const goals = useProgressStore((s) => s.goals);
    const setDailyGoals = useProgressStore((s) => s.setDailyGoals);
    const setBonusGoalId = useProgressStore((s) => s.setBonusGoalId);
    const lastGoalBonusDay = useProgressStore((s) => s.lastGoalBonusDay);
    const awardDailyGoalBonus = useProgressStore((s) => s.awardDailyGoalBonus);
    const lastSurpriseBonusDay = useProgressStore((s) => s.lastSurpriseBonusDay);
    const awardSurpriseGoalBonus = useProgressStore((s) => s.awardSurpriseGoalBonus);
    const syncCode = useProgressStore((s) => s.sync.code);
    const avatarId = useProgressStore((s) => s.profile.avatarId);

    const dueCount = useReviewStore((s) => s.dueCount(today));
    const hasSessionToday = useReviewStore((s) => s.hasSessionToday(today));
    const paths = useLearningPathProfile((s) => s.paths);
    const { history } = useUserHistory();

    const [profileOpen, setProfileOpen] = useState(false);

    const metrics = useMemo(
        () => buildMetrics({ counters, totalXp, streak, dayLog }),
        [counters, totalXp, streak, dayLog]
    );

    // Helt ny elev: heroen bytter til velkomstvariant med fagvalg.
    const isNewStudent = totalXp === 0 && Object.keys(firstCompletions).length === 0;
    const welcomeSubjects = useMemo(() => {
        if (!isNewStudent || !manifest) return null;
        return buildWelcomeRecommendations(manifest).map((rec) => ({
            subjectId: rec.subjectId ?? '',
            title:
                manifest.subjects.find((s) => s.id === rec.subjectId)?.title ??
                rec.subjectId ??
                '',
            image: rec.image,
            link: rec.link,
        }));
    }, [isNewStudent, manifest]);

    // Det viktigste steget blir stor knapp øverst; resten fyller «Anbefalt for deg».
    const primaryAction: PrimaryAction | null = recommendations[0]
        ? {
              title: recommendations[0].title,
              subtitle: recommendations[0].reason,
              link: recommendations[0].link,
              image: recommendations[0].image,
          }
        : null;
    const restRecommendations = recommendations.slice(1);

    // Artikler åpnet men ikke fullført, og artikler nylig fullført - egne
    // seksjoner adskilt fra den kuraterte «Anbefalt for deg».
    const startedArticles = useMemo(
        () => (manifest ? buildStartedArticles(manifest, history, firstCompletions) : []),
        [manifest, history, firstCompletions]
    );
    const recentlyRead = useMemo(
        () => (manifest ? buildRecentlyRead(manifest, events) : []),
        [manifest, events]
    );

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

    // Generer dagens mål én gang per dag - med et hemmelig gnistmål blant dem.
    // Seed: synk-kode hvis den finnes, ellers avatar (stabilt per profil).
    const bonusSeed = syncCode ?? avatarId;
    useEffect(() => {
        if (!manifest) return;
        if (goals?.day === today) return;
        const items = generateDailyGoals(goalInputs);
        setDailyGoals(today, items, pickBonusGoalId(today, items, bonusSeed));
    }, [manifest, goals?.day, today, goalInputs, setDailyGoals, bonusSeed]);

    // Backfill: mål generert av en eldre versjon mangler gnistmål - velg det
    // uten å regenerere målene.
    useEffect(() => {
        if (goals?.day !== today || goals.bonusGoalId !== undefined) return;
        setBonusGoalId(pickBonusGoalId(today, goals.items, bonusSeed));
    }, [goals, today, bonusSeed, setBonusGoalId]);

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

    // Streaken er i fare: den lever, men dagens innsats har ikke krysset
    // terskelen ennå. Da fortjener eleven en vennlig dytt i heroen.
    const streakAtRisk = streakAlive && streak.current > 0 && streak.lastActiveDay !== today;

    // Dagsbonus: når alle dagens mål er fullført, gi engangsbonus (idempotent).
    useEffect(() => {
        if (goalsWithProgress.length === 0) return;
        if (lastGoalBonusDay === today) return;
        const allDone = goalsWithProgress.every(({ goal, progress }) => progress >= goal.target);
        if (allDone) awardDailyGoalBonus(today);
    }, [goalsWithProgress, lastGoalBonusDay, today, awardDailyGoalBonus]);

    // Overraskelsesbonus: når gnistmålet fullføres (idempotent per dag).
    useEffect(() => {
        const bonusGoalId = goals?.day === today ? goals.bonusGoalId : null;
        if (!bonusGoalId || lastSurpriseBonusDay === today) return;
        const bonus = goalsWithProgress.find(({ goal }) => goal.id === bonusGoalId);
        if (bonus && bonus.progress >= bonus.goal.target) awardSurpriseGoalBonus(today);
    }, [goals, goalsWithProgress, lastSurpriseBonusDay, today, awardSurpriseGoalBonus]);

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
                    totalXp={totalXp}
                    badgeCount={Object.keys(badges).length}
                    primaryAction={primaryAction}
                    goals={goalsWithProgress}
                    bonusGoalId={goals?.day === today ? (goals.bonusGoalId ?? null) : null}
                    streakAtRisk={streakAtRisk}
                    onEditProfile={() => setProfileOpen(true)}
                    welcome={welcomeSubjects}
                />

                {/* Ny elev får fagvalget i heroen - da er lista bare duplikat. */}
                {!isNewStudent && <RecommendationsSection items={restRecommendations} />}
                <ArticleListSection title="Påbegynte artikler" items={startedArticles} />
                <ArticleListSection title="Nylig lest" items={recentlyRead} />
                <SubjectRings mastery={mastery} />
                <ActivitySection dayLog={dayLog} />

                <div className="grid lg:grid-cols-3 gap-4 items-start">
                    <div className="lg:col-span-2">
                        <BadgeGallery unlocked={badges} metrics={metrics} />
                    </div>
                    <div className="lg:col-span-1">
                        <SyncCard />
                    </div>
                </div>
            </div>

            <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
        </div>
    );
};
