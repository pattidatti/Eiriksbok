// Typer for «Dagens økt» - den adaptive repetisjonsøkta.
// Items samles inn fra quiz, flashcards og læringsstier (se utils/reviewCapture.ts)
// og planlegges med Leitner-bokser (se utils/reviewScheduler.ts).

export type ReviewItemType = 'concept' | 'quiz' | 'timeline';
export type ExerciseKind =
    | 'flashcard'
    | 'mcq'
    | 'year-pick'
    | 'image-mcq'
    | 'timeline-order'
    | 'match-pairs';
export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface ReviewQuizPayload {
    question: string;
    options: string[];
    answer: string;
    sourceUrl?: string;
    sourceTitle?: string;
}

export interface ReviewItem {
    // 'concept:<slug(term)>' | 'quiz:<djb2-hash>' | 'timeline:<eventId>'
    id: string;
    type: ReviewItemType;
    box: LeitnerBox;
    // 'YYYY-MM-DD' i lokal tid - sammenlignes leksikografisk
    dueDate: string;
    lapses: number;
    reps: number;
    addedAt: number;
    lastReviewedAt: number | null;
    // Payload - nøyaktig én av disse avhengig av type:
    term?: string;
    quiz?: ReviewQuizPayload;
    eventId?: string;
}

export interface ReviewSessionRecord {
    day: string;
    completedAt: number;
    correct: number;
    total: number;
    // Dagens spill (finalen) - satt i etterkant via recordGameResult
    gameId?: string;
    gameScore?: number;
}

// Dagens spill - velges deterministisk av utils/reviewFinale.ts
export interface DailyGamePick {
    gameId: string;
    title: string;
    estimatedSeconds?: number;
}

export interface ReviewStreak {
    current: number;
    best: number;
    lastSessionDay: string | null;
}

// En hendelse i tidslinje-sortering
export interface OrderOption {
    id: string;
    title: string;
    year: number;
    displayDate: string;
}

// Et begrep-forklaring-par i koble par-øvelsen
export interface MatchPair {
    term: string;
    definition: string;
}

export interface SessionExercise {
    item: ReviewItem;
    kind: ExerciseKind;
    prompt: string;
    // mcq / year-pick / image-mcq: deterministisk forhåndsstokket
    options?: string[];
    answer?: string;
    // flashcard-bakside
    definition?: string;
    sourceLink?: string;
    // image-mcq (og year-pick når tidslinjebilde finnes)
    imageSrc?: string;
    // timeline-order: forhåndsstokket rekkefølge eleven skal rette opp
    orderOptions?: OrderOption[];
    // match-pairs: begreper i fast stokket rekkefølge + definisjonskolonnen separat stokket
    pairs?: MatchPair[];
    shuffledDefinitions?: string[];
    // Fagfarge på øvelseskortet + matching av dagens spill
    subjectId?: string;
    topicId?: string;
}
