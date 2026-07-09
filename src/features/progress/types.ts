// Delte typer for progresjonssystemet bak «Min læring».
// Ingen React, ingen store-imports - kun datatyper.

export type ActivityKind =
    | 'article-read'
    | 'quiz-completed'
    | 'path-step-completed'
    | 'path-completed'
    | 'review-session'
    | 'minigame-played'
    | 'detective-solved'
    | 'scenario-completed'
    | 'practice-game'
    | 'virkemiddel-exercise'
    | 'microgame-played'
    | 'philosophy-quest'
    | 'comparison-task';

// Input til recordActivity() - det en modul vet i fullføringsøyeblikket
export interface ActivityInput {
    kind: ActivityKind;
    // Stabil id for aktiviteten. For artikler/quizer: URL-sti uten ledende
    // skråstrek ('historie/vikingtiden/rikssamlingen') slik at fag/emne kan
    // leses rett ut av id-en ved mestringsberegning.
    activityId: string;
    subjectId?: string;
    topicId?: string;
    // Normalisert resultat 0-1 der det finnes (quiz-score, sti-mastery)
    score?: number;
    // Menneskelig lesbar tittel til toasts og aktivitetslogg
    title?: string;
}

export interface ActivityEvent {
    id: string;
    kind: ActivityKind;
    activityId: string;
    subjectId?: string;
    topicId?: string;
    score?: number;
    title?: string;
    xp: number;
    day: string; // 'YYYY-MM-DD' lokal tid
    at: number; // epoch ms
}

export interface ProgressStreak {
    current: number;
    best: number;
    lastActiveDay: string | null;
    // «Fryser» som dekker korte fravær så en streak ikke ryker på én glipp.
    // Kan mangle i gammel persistert data - les alltid med `?? 0`.
    freezes?: number;
}

// Aggregert per dag - grunnlag for aktivitetskalender og grafer
export interface DayStats {
    xp: number;
    activities: number;
}

export type GoalKind = 'review' | 'article' | 'quiz' | 'path-step' | 'practice' | 'xp';

export interface DailyGoal {
    id: string;
    kind: GoalKind;
    label: string;
    link: string;
    target: number;
}

export type BadgeTier = 'bronse' | 'solv' | 'gull';

export interface BadgeDef {
    id: string;
    title: string;
    description: string; // '{n}' byttes ut med terskelen for hvert trinn
    emoji: string;
    counter: string; // nøkkel i counters-recorden
    tiers: [number, number, number]; // terskler for bronse/sølv/gull
    // Rute som gir fremgang mot badgen - CTA-en i «Nærmest deg».
    actionLink: string;
    actionLabel: string;
}

export interface AvatarDef {
    id: string;
    emoji: string;
    label: string;
    // Nivået som låser opp avataren (1 = alltid tilgjengelig)
    unlockLevel: number;
}

export interface ProgressProfile {
    nickname: string | null;
    avatarId: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error';

export interface SyncState {
    code: string | null;
    lastSyncedAt: number | null;
}

// Resultatet av recordActivity - brukes til toasts
export interface RecordResult {
    xpAwarded: number;
    firstTime: boolean;
    leveledUpTo: number | null;
    unlockedBadges: { badge: BadgeDef; tier: BadgeTier }[];
}
