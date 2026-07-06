// Dagens mål: 2-3 auto-genererte mål fra elevens egne data.
// Genereres én gang per dag (lagres i progresjonsstoren) og hukes av
// automatisk når dagens hendelser matcher målet. Noen mål er progressive
// (target > 1), f.eks. «Tjen 80 XP i dag».

import type { ActivityEvent, DailyGoal, GoalKind } from './types';
import { getProgressionConfig } from './progressionConfig';

export interface GoalInputs {
    dueCount: number;
    hasSessionToday: boolean;
    // Påbegynt læringssti (ikke fullført), hvis noen
    continuePath: { title: string; link: string } | null;
    // Neste uleste artikkel i et påbegynt emne, hvis noen
    nextArticle: { title: string; link: string } | null;
    // Emne med svak kvalitet, hvis noen
    weakTopic: { title: string; link: string } | null;
}

export const generateDailyGoals = (inputs: GoalInputs): DailyGoal[] => {
    const core: DailyGoal[] = [];

    if (inputs.dueCount > 0 && !inputs.hasSessionToday) {
        core.push({
            id: 'review',
            kind: 'review',
            label: `Fullfør dagens økt (${inputs.dueCount} kort venter)`,
            link: '/oving/dagens-okt',
            target: 1,
        });
    }

    if (inputs.continuePath) {
        core.push({
            id: 'path-step',
            kind: 'path-step',
            label: `Ta et steg videre i «${inputs.continuePath.title}»`,
            link: inputs.continuePath.link,
            target: 1,
        });
    } else if (inputs.nextArticle) {
        core.push({
            id: 'article',
            kind: 'article',
            label: `Les «${inputs.nextArticle.title}»`,
            link: inputs.nextArticle.link,
            target: 1,
        });
    }

    if (inputs.weakTopic) {
        core.push({
            id: 'quiz',
            kind: 'quiz',
            label: `Øv på ${inputs.weakTopic.title} - ta en quiz`,
            link: inputs.weakTopic.link,
            target: 1,
        });
    }

    // Fyll opp med en generell øvings-oppfordring hvis vi mangler et konkret mål
    if (core.length === 0) {
        core.push({
            id: 'practice',
            kind: 'practice',
            label: 'Fullfør en øving eller et spill',
            link: '/oving',
            target: 1,
        });
    }

    // La alltid plass til XP-strekkmålet, som binder dagen sammen og utløser
    // dagsbonusen når alt er huket av.
    const xpTarget = getProgressionConfig().dailyXpTarget;
    const goals = core.slice(0, 2);
    goals.push({
        id: 'xp-stretch',
        kind: 'xp',
        label: `Tjen ${xpTarget} XP i dag`,
        link: '/oving',
        target: xpTarget,
    });

    return goals;
};

const GOAL_EVENT_KINDS: Record<GoalKind, string[]> = {
    review: ['review-session'],
    article: ['article-read'],
    quiz: ['quiz-completed'],
    'path-step': ['path-step-completed', 'path-completed'],
    practice: [
        'practice-game',
        'minigame-played',
        'microgame-played',
        'virkemiddel-exercise',
        'detective-solved',
        'scenario-completed',
    ],
    // 'xp' måles ikke på antall hendelser, men på dagens samlede XP (se under).
    xp: [],
};

// Fremdrift mot et mål regnet fra dagens hendelser
export const goalProgress = (goal: DailyGoal, todaysEvents: ActivityEvent[]): number => {
    if (goal.kind === 'xp') {
        const xp = todaysEvents.reduce((sum, e) => sum + e.xp, 0);
        return Math.min(goal.target, xp);
    }
    const kinds = GOAL_EVENT_KINDS[goal.kind];
    return Math.min(goal.target, todaysEvents.filter((e) => kinds.includes(e.kind)).length);
};
