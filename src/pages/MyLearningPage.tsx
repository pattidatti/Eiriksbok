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
import { getAvatar } from '../features/progress/avatars';
import { todayLocal } from '../utils/reviewScheduler';
import { HeroCard } from '../features/progress/components/HeroCard';
import type { PrimaryAction } from '../features/progress/components/HeroCard';
import { LevelCard } from '../features/progress/components/LevelCard';
import { SubjectRings } from '../features/progress/components/SubjectRings';
import { ContinueSection } from '../features/progress/components/ContinueSection';
import type { Recommendation } from '../features/progress/components/ContinueSection';
import { BadgeGallery } from '../features/progress/components/BadgeGallery';
import { ActivitySection } from '../features/progress/components/ActivitySection';
import { SyncCard } from '../features/progress/components/SyncCard';
import { ProfileDialog } from '../features/progress/components/ProfileDialog';
import type { Manifest, TopicTool } from '../types';

// Finn læringssti-verktøyet (tittel + lenke) for en pathId i manifestet
const findPathTool = (manifest: Manifest, pathId: string): TopicTool | null => {
    for (const subject of manifest.subjects) {
        for (const tool of subject.tools ?? []) {
            if (tool.id === pathId) return tool;
        }
        for (const topic of subject.topics) {
            for (const tool of topic.tools ?? []) {
                if (tool.id === pathId) return tool;
            }
            for (const sub of topic.subTopics ?? []) {
                for (const tool of sub.tools ?? []) {
                    if (tool.id === pathId) return tool;
                }
            }
        }
    }
    return null;
};

// Første uleste artikkel i et gitt emne
const findNextArticle = (
    manifest: Manifest,
    subjectId: string,
    topicId: string,
    isRead: (path: string) => boolean
): { title: string; link: string } | null => {
    const subject = manifest.subjects.find((s) => s.id === subjectId);
    const topic = subject?.topics.find((t) => t.id === topicId);
    if (!topic) return null;
    for (const lesson of topic.lessons ?? []) {
        const path = `${subjectId}/${topicId}/${lesson.id}`;
        if (!isRead(path)) return { title: lesson.title, link: `/${path}` };
    }
    for (const sub of topic.subTopics ?? []) {
        for (const lesson of sub.lessons) {
            const path = `${subjectId}/${topicId}/${sub.id}/${lesson.id}`;
            if (!isRead(path)) return { title: lesson.title, link: `/${path}` };
        }
    }
    return null;
};

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

    const mastery = useMemo(
        () => (manifest ? computeMastery(manifest, firstCompletions, bestScores, events) : []),
        [manifest, firstCompletions, bestScores, events]
    );

    const metrics = useMemo(
        () => buildMetrics({ counters, totalXp, streak, dayLog }),
        [counters, totalXp, streak, dayLog]
    );

    // Anbefalinger: påbegynt sti, neste artikkel, svakt emne, repetisjon
    const { recommendations, goalInputs } = useMemo(() => {
        const isRead = (path: string) => Boolean(firstCompletions[`article-read:${path}`]);

        const activePath = Object.values(paths)
            .filter((p) => p.finishedAt === null)
            .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt)[0];
        const pathTool =
            activePath && manifest ? findPathTool(manifest, activePath.pathId) : null;
        const continuePath = pathTool
            ? { title: pathTool.title, link: pathTool.link }
            : null;

        // Emne i gang: flest fullførte, men ikke alt - «fullfør det du er i gang med»
        let nextArticle: { title: string; link: string } | null = null;
        let ongoingTopicTitle: string | null = null;
        if (manifest) {
            const started = mastery
                .flatMap((subject) =>
                    subject.topics.map((topic) => ({ subject: subject.subjectId, topic }))
                )
                .filter(
                    ({ topic }) =>
                        topic.completedLessons > 0 &&
                        topic.completedLessons < topic.totalLessons
                )
                .sort(
                    (a, b) =>
                        b.topic.completedLessons / b.topic.totalLessons -
                        a.topic.completedLessons / a.topic.totalLessons
                )[0];
            if (started) {
                nextArticle = findNextArticle(
                    manifest,
                    started.subject,
                    started.topic.topicId,
                    isRead
                );
                ongoingTopicTitle = started.topic.title;
            }
        }

        const weak = mastery
            .flatMap((subject) =>
                subject.topics.map((topic) => ({ subject: subject.subjectId, topic }))
            )
            .filter(({ topic }) => topic.qualityLevel === 'red' || topic.qualityLevel === 'yellow')
            .sort((a, b) => (a.topic.quality ?? 0) - (b.topic.quality ?? 0))[0];
        const weakTopic = weak
            ? {
                  title: weak.topic.title,
                  link: `/${weak.subject}/${weak.topic.topicId}`,
              }
            : null;

        const items: Recommendation[] = [];
        if (continuePath) {
            items.push({
                id: 'path',
                icon: 'path',
                title: continuePath.title,
                subtitle: 'Læringsstien din venter',
                link: continuePath.link,
            });
        }
        if (nextArticle) {
            items.push({
                id: 'article',
                icon: 'article',
                title: nextArticle.title,
                subtitle: ongoingTopicTitle
                    ? `Neste artikkel i ${ongoingTopicTitle}`
                    : 'Neste artikkel',
                link: nextArticle.link,
            });
        }
        if (weakTopic) {
            items.push({
                id: 'weak',
                icon: 'weak',
                title: weakTopic.title,
                subtitle: 'Her kan du bli sterkere - øv litt til',
                link: weakTopic.link,
            });
        }
        if (dueCount > 0) {
            items.push({
                id: 'review',
                icon: 'review',
                title: 'Dagens økt',
                subtitle: `${dueCount} kort venter på repetisjon`,
                link: '/oving/dagens-okt',
            });
        }

        return {
            recommendations: items,
            goalInputs: { dueCount, hasSessionToday, continuePath, nextArticle, weakTopic },
        };
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

    // Det viktigste neste steget løftes ut som stor knapp øverst; resten blir
    // liggende i «Fortsett der du slapp». Prioritet: sti > artikkel > repetisjon > svakt emne.
    const { primaryAction, restRecommendations } = useMemo(() => {
        const priority = ['path', 'article', 'review', 'weak'];
        const primary =
            [...recommendations].sort(
                (a, b) => priority.indexOf(a.icon) - priority.indexOf(b.icon)
            )[0] ?? null;
        const action: PrimaryAction | null = primary
            ? { title: primary.title, subtitle: primary.subtitle, link: primary.link }
            : null;
        return {
            primaryAction: action,
            restRecommendations: primary
                ? recommendations.filter((r) => r.id !== primary.id)
                : recommendations,
        };
    }, [recommendations]);

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
                        <ContinueSection items={restRecommendations} />
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
