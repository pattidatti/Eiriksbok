// Dagens mål: 2-3 auto-genererte mål fra elevens egne data.
// Genereres én gang per dag (lagres i progresjonsstoren) og hukes av
// automatisk når dagens hendelser matcher målet.

import type { ActivityEvent, DailyGoal, GoalKind } from './types';

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
    const goals: DailyGoal[] = [];

    if (inputs.dueCount > 0 && !inputs.hasSessionToday) {
        goals.push({
            id: 'review',
            kind: 'review',
            label: `Fullfør dagens økt (${inputs.dueCount} kort venter)`,
            link: '/oving/dagens-okt',
            target: 1,
        });
    }

    if (inputs.continuePath) {
        goals.push({
            id: 'path-step',
            kind: 'path-step',
            label: `Ta et steg videre i «${inputs.continuePath.title}»`,
            link: inputs.continuePath.link,
            target: 1,
        });
    } else if (inputs.nextArticle) {
        goals.push({
            id: 'article',
            kind: 'article',
            label: `Les «${inputs.nextArticle.title}»`,
            link: inputs.nextArticle.link,
            target: 1,
        });
    }

    if (inputs.weakTopic) {
        goals.push({
            id: 'quiz',
            kind: 'quiz',
            label: `Øv på ${inputs.weakTopic.title} - ta en quiz`,
            link: inputs.weakTopic.link,
            target: 1,
        });
    }

    // Fyll opp til minst to mål med en generell øvings-oppfordring
    if (goals.length < 2) {
        goals.push({
            id: 'practice',
            kind: 'practice',
            label: 'Fullfør en øving eller et spill',
            link: '/oving',
            target: 1,
        });
    }
    if (goals.length < 2) {
        goals.push({
            id: 'article-any',
            kind: 'article',
            label: 'Les en artikkel',
            link: '/sok',
            target: 1,
        });
    }

    return goals.slice(0, 3);
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
};

// Fremdrift mot et mål regnet fra dagens hendelser
export const goalProgress = (goal: DailyGoal, todaysEvents: ActivityEvent[]): number => {
    const kinds = GOAL_EVENT_KINDS[goal.kind];
    return Math.min(
        goal.target,
        todaysEvents.filter((e) => kinds.includes(e.kind)).length
    );
};
