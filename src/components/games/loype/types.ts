// Typer for Kunnskapsløypa - roguelike-øving der eleven velger sti gjennom
// et nodekart, møter mikro-utfordringer fra eksisterende innholdsbanker og
// slår en boss til slutt. All run-tilstand eies av runReducer.ts.

import type { SessionExercise } from '../../../types/review';

export type NodeType = 'challenge' | 'elite' | 'rest' | 'reward' | 'boss';
export type ChallengeKind = 'quiz' | 'chrono' | 'concept-match' | 'concept-mcq';
export type SubjectChoice = 'historie' | 'norsk' | 'krle' | 'samfunnskunnskap' | 'blandet';
export type Difficulty = 'lett' | 'middels' | 'vanskelig';
export type RelicId = 'skjold' | 'femti-femti' | 'kunnskapsstein' | 'hjerteamulett';

export interface MapNode {
    id: string;
    row: number; // 0 = start-raden, siste rad = boss
    col: number; // 0-2
    type: NodeType;
    edges: string[]; // node-id-er i neste rad
}

export interface RunConfig {
    subjectId: SubjectChoice;
    difficulty: Difficulty;
    seed: number;
}

export type RunPhase = 'map' | 'encounter' | 'rest' | 'reward' | 'boss' | 'summary' | 'dead';

// En feil verdt å repetere - vises med lenke på sluttskjermen
export interface MissedPrompt {
    prompt: string;
    link?: string;
}

export interface RunState {
    phase: RunPhase;
    config: RunConfig;
    map: MapNode[];
    currentNodeId: string | null;
    visited: string[];
    hearts: number;
    maxHearts: number;
    relics: RelicId[];
    shieldUsed: boolean;
    // Settes når skjoldet nettopp tok et feilsvar - nullstilles ved NEXT
    shieldFlash: boolean;
    fiftyCharges: number;
    combo: number;
    bestCombo: number;
    correct: number;
    answered: number;
    // Intern løype-XP (belønningen på sluttskjermen) - ekte XP går via recordActivity
    xp: number;
    // Aktiv utfordringskø (challenge: 1 øvelse, elite: 2)
    exercises: SessionExercise[];
    exerciseIndex: number;
    // Reward-fase: relikvier eleven kan velge mellom
    offeredRelics: RelicId[];
    // Boss
    bossMaxHp: number;
    bossHp: number;
    bossIndex: number;
    won: boolean;
    misses: MissedPrompt[];
}

export const DIFFICULTY_CONFIG: Record<
    Difficulty,
    { rows: number; bossHp: number; chronoCount: number; label: string }
> = {
    lett: { rows: 8, bossHp: 3, chronoCount: 3, label: '8 etapper' },
    middels: { rows: 10, bossHp: 4, chronoCount: 4, label: '10 etapper' },
    vanskelig: { rows: 12, bossHp: 5, chronoCount: 4, label: '12 etapper' },
};

export const SUBJECT_CHOICES: { id: SubjectChoice; label: string }[] = [
    { id: 'historie', label: 'Historie' },
    { id: 'norsk', label: 'Norsk' },
    { id: 'krle', label: 'KRLE' },
    { id: 'samfunnskunnskap', label: 'Samfunnskunnskap' },
    { id: 'blandet', label: 'Blandet' },
];

export const START_HEARTS = 3;
