// Badge-definisjoner med tre trinn (bronse/sølv/gull) per badge.
// «counter» peker på en nøkkel i metrics-recorden som progresjonstoren
// bygger fra tellere + avledede verdier (xp, streak, aktive fag/dager).

import type { BadgeDef, BadgeTier } from './types';

export const BADGE_TIERS: BadgeTier[] = ['bronse', 'solv', 'gull'];

export const TIER_LABELS: Record<BadgeTier, string> = {
    bronse: 'Bronse',
    solv: 'Sølv',
    gull: 'Gull',
};

export const BADGES: BadgeDef[] = [
    {
        id: 'leseren',
        title: 'Leseren',
        description: 'Les {n} artikler',
        emoji: '📖',
        counter: 'articlesRead',
        tiers: [10, 30, 100],
        actionLink: '/',
        actionLabel: 'Finn en artikkel',
    },
    {
        id: 'quizmester',
        title: 'Quizmester',
        description: 'Fullfør {n} quizer',
        emoji: '❓',
        counter: 'quizzesCompleted',
        tiers: [5, 20, 50],
        actionLink: '/oving/quiz',
        actionLabel: 'Ta en quiz',
    },
    {
        id: 'perfeksjonist',
        title: 'Perfeksjonist',
        description: 'Få full pott på {n} quizer',
        emoji: '💯',
        counter: 'quizzesPerfect',
        tiers: [3, 10, 25],
        actionLink: '/oving/quiz',
        actionLabel: 'Ta en quiz',
    },
    {
        id: 'stivandrer',
        title: 'Stivandrer',
        description: 'Fullfør {n} læringsstier',
        emoji: '🗺️',
        counter: 'pathsCompleted',
        tiers: [1, 3, 8],
        actionLink: '/laeringsstier',
        actionLabel: 'Velg en læringssti',
    },
    {
        id: 'stegviser',
        title: 'Stegviser',
        description: 'Fullfør {n} steg i læringsstier',
        emoji: '👣',
        counter: 'pathStepsCompleted',
        tiers: [10, 40, 120],
        actionLink: '/laeringsstier',
        actionLabel: 'Fortsett en sti',
    },
    {
        id: 'repetisjonshelt',
        title: 'Repetisjonshelt',
        description: 'Fullfør {n} daglige økter',
        emoji: '🔁',
        counter: 'reviewSessions',
        tiers: [5, 20, 60],
        actionLink: '/oving/dagens-okt',
        actionLabel: 'Ta dagens økt',
    },
    {
        id: 'flammen',
        title: 'Flammen',
        description: 'Hold en streak på {n} dager',
        emoji: '🔥',
        counter: 'streak',
        tiers: [3, 7, 30],
        actionLink: '/oving',
        actionLabel: 'Øv litt i dag',
    },
    {
        id: 'spillmester',
        title: 'Spillmester',
        description: 'Fullfør {n} 3D-spill',
        emoji: '🎮',
        counter: 'minigamesPlayed',
        tiers: [3, 10, 25],
        actionLink: '/oving/spill',
        actionLabel: 'Spill et 3D-spill',
    },
    {
        id: 'detektiven',
        title: 'Detektiven',
        description: 'Løs {n} detektivsaker',
        emoji: '🕵️',
        counter: 'detectivesSolved',
        tiers: [1, 3, 6],
        actionLink: '/oving/detektiv',
        actionLabel: 'Løs en sak',
    },
    {
        id: 'tidsreisende',
        title: 'Tidsreisende',
        description: 'Fullfør {n} tidsreise-scenarier',
        emoji: '⏳',
        counter: 'scenariosCompleted',
        tiers: [1, 3, 8],
        actionLink: '/oving/tidsreise',
        actionLabel: 'Dra på tidsreise',
    },
    {
        id: 'ordkunstner',
        title: 'Ordkunstner',
        description: 'Fullfør {n} virkemiddel-øvinger',
        emoji: '✒️',
        counter: 'virkemiddelExercises',
        tiers: [10, 30, 80],
        actionLink: '/oving/virkemidler',
        actionLabel: 'Øv på virkemidler',
    },
    {
        id: 'xp-jeger',
        title: 'XP-jeger',
        description: 'Tjen {n} XP totalt',
        emoji: '⭐',
        counter: 'xp',
        tiers: [500, 2500, 10000],
        actionLink: '/oving',
        actionLabel: 'Tjen XP i øvingsrommet',
    },
    {
        id: 'allsidig',
        title: 'Allsidig',
        description: 'Vær aktiv i {n} fag',
        emoji: '🧭',
        counter: 'activeSubjects',
        tiers: [2, 3, 5],
        actionLink: '/',
        actionLabel: 'Utforsk et nytt fag',
    },
    {
        id: 'trofast',
        title: 'Trofast',
        description: 'Vær aktiv {n} ulike dager',
        emoji: '📅',
        counter: 'activeDays',
        tiers: [5, 20, 60],
        actionLink: '/oving',
        actionLabel: 'Vær aktiv i dag',
    },
    {
        id: 'historikeren',
        title: 'Historikeren',
        description: 'Les {n} historie-artikler',
        emoji: '🏺',
        counter: 'articles:historie',
        tiers: [5, 20, 60],
        actionLink: '/historie',
        actionLabel: 'Les historie',
    },
    {
        id: 'spraakviteren',
        title: 'Språkviteren',
        description: 'Les {n} norsk-artikler',
        emoji: '📝',
        counter: 'articles:norsk',
        tiers: [5, 20, 50],
        actionLink: '/norsk',
        actionLabel: 'Les norsk',
    },
    {
        id: 'tenkeren',
        title: 'Tenkeren',
        description: 'Les {n} KRLE-artikler',
        emoji: '🤔',
        counter: 'articles:krle',
        tiers: [5, 15, 40],
        actionLink: '/krle',
        actionLabel: 'Les KRLE',
    },
    {
        id: 'samfunnsviteren',
        title: 'Samfunnsviteren',
        description: 'Les {n} samfunnskunnskap-artikler',
        emoji: '🏛️',
        counter: 'articles:samfunnskunnskap',
        tiers: [5, 20, 50],
        actionLink: '/samfunnskunnskap',
        actionLabel: 'Les samfunnskunnskap',
    },
    {
        id: 'musikeren',
        title: 'Musikeren',
        description: 'Les {n} musikk-artikler',
        emoji: '🎵',
        counter: 'articles:musikk',
        tiers: [3, 8, 20],
        actionLink: '/musikk',
        actionLabel: 'Les musikk',
    },
];

// Nøkkel for en opplåst badge-grad, f.eks. 'leseren:gull'
export const badgeTierKey = (badgeId: string, tier: BadgeTier): string => `${badgeId}:${tier}`;

// Finn hvilke nye grader som låses opp når metrics endres
export const newlyUnlockedTiers = (
    unlocked: Record<string, number>,
    metrics: Record<string, number>
): { badge: BadgeDef; tier: BadgeTier }[] => {
    const result: { badge: BadgeDef; tier: BadgeTier }[] = [];
    for (const badge of BADGES) {
        const value = metrics[badge.counter] ?? 0;
        badge.tiers.forEach((threshold, i) => {
            const tier = BADGE_TIERS[i];
            if (value >= threshold && !unlocked[badgeTierKey(badge.id, tier)]) {
                result.push({ badge, tier });
            }
        });
    }
    return result;
};
