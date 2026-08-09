import type { QuizQuestion } from '../types';

/**
 * Datamodellen for Quiz Battle slik den ligger i Firebase Realtime Database.
 *
 * To grener per rom:
 *   rooms/{pin}            - offentlig. Alle spillere leser dette, så spørsmål
 *                            her er vasket for fasit (se PublicQuestion).
 *   quiz-data/{pin}/...    - privat. Full fasit, kun verten leser den under
 *                            spillet; spillerne får den først når spillet er
 *                            ferdig (til «anbefalt lesing»).
 */

/** Et quiz-spørsmål med peker tilbake til artikkelen det ble hentet fra. */
export interface BattleQuestion extends QuizQuestion {
    sourceTitle?: string;
    sourceSubjectId?: string;
    sourceTopicId?: string;
    sourceLessonId?: string;
    /** null når leksjonen ikke ligger under et undertema (Firebase tåler ikke undefined). */
    sourceSubTopicId?: string | null;
}

/** Samme spørsmål, men uten fasit - det er denne varianten spillerne kan lese. */
export type PublicQuestion = Omit<BattleQuestion, 'correctAnswer' | 'answer'>;

/** Et svar fra en elev: én valgt streng, eller en rekkefølge ved sorteringsspørsmål. */
export type PlayerAnswer = string | string[];

/** En spiller slik den ligger under rooms/{pin}/players/{playerId}. */
export interface QuizPlayerState {
    name: string;
    /** Settes til 0 når eleven blir med (QuizLobby), så den finnes alltid. */
    score: number;
    status?: string;
    /** Skrives først når eleven svarer riktig flere ganger på rad. */
    streak?: number;
    /** Nøkkelen er spørsmålsindeksen. */
    answers?: Record<string, PlayerAnswer>;
    answerTimes?: Record<string, number>;
    lastAnswer?: PlayerAnswer;
}

/** Samme spiller, men med ID-en løftet inn i objektet (slik lista brukes i UI). */
export type QuizPlayerWithId = QuizPlayerState & { id: string };

export type QuizRoomStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

/** Fasiten verten kringkaster etter at tiden på et spørsmål er ute. */
export interface QuizRoundResult {
    correctAnswer?: number;
    answer?: string;
}

/** Et rom under rooms/{pin}. */
export interface QuizRoom {
    name?: string;
    status?: QuizRoomStatus;
    questions?: PublicQuestion[];
    currentQuestion: number;
    showResult: boolean;
    currentResult?: QuizRoundResult;
    players?: Record<string, QuizPlayerState>;
    reactions?: Record<string, { emoji: string }>;
    lobby?: { balloonSize?: number };
}

/** Et rom i admin-lista, der rom-ID-en (PIN) er løftet inn. */
export type QuizRoomWithId = QuizRoom & { id: string };

/** Leksjonen en spørsmålsrunde skal hentes fra. */
export interface LessonRef {
    subjectId: string;
    topicId: string;
    lessonId: string;
    subTopicId?: string;
}

/** En emoji som flyter oppover vertsskjermen i lobbyen. */
export interface FloatingEmoji {
    /** Firebase-nøkkelen når den finnes, ellers et tidsstempel som reserve. */
    id: string | number;
    emoji: string;
    x: number;
}
