// Ren reducer for hele run-tilstanden i Kunnskapsløypa. Siden bygger
// øvelsene (de trenger innholdspoolene) og sender dem inn via ENTER_NODE -
// alt annet (hjerter, skjold, relikvier, XP, faseflyt) bor her.

import type { SessionExercise } from '../../../types/review';
import { djb2Hash, mulberry32, shuffleWith } from '../../../utils/reviewScheduler';
import { ALL_RELIC_IDS } from './relics';
import type { MapNode, MissedPrompt, RelicId, RunConfig, RunState } from './types';
import { DIFFICULTY_CONFIG, START_HEARTS } from './types';

export type LoypeAction =
    | { type: 'START_RUN'; config: RunConfig; map: MapNode[] }
    | { type: 'ENTER_NODE'; nodeId: string; exercises?: SessionExercise[] }
    | { type: 'ANSWER'; correct: boolean }
    | { type: 'NEXT' }
    | { type: 'USE_FIFTY' }
    | { type: 'PICK_RELIC'; relic: RelicId }
    | { type: 'CONTINUE' }
    | { type: 'BOSS_ANSWER'; correct: boolean }
    | { type: 'BOSS_NEXT' }
    | { type: 'ABANDON' };

const XP_CHALLENGE = 10;
const XP_ELITE = 15;
const XP_BOSS_HIT = 25;
const XP_WIN_BONUS = 50;

const nodeById = (state: RunState, id: string | null): MapNode | undefined =>
    state.map.find((n) => n.id === id);

const xpGain = (state: RunState, base: number): number =>
    state.relics.includes('kunnskapsstein') ? base * 2 : base;

// Feil svar: skjoldet tar støyten én gang, deretter koster det et hjerte
const applyWrong = (state: RunState): Partial<RunState> => {
    if (state.relics.includes('skjold') && !state.shieldUsed) {
        return { shieldUsed: true, shieldFlash: true };
    }
    return { hearts: state.hearts - 1 };
};

// Hva som vises i «verdt å repetere» på sluttskjermen
const missTitle = (exercise: SessionExercise): string => {
    if (exercise.kind === 'timeline-order' && exercise.orderOptions) {
        return `Rekkefølgen på: ${exercise.orderOptions.map((o) => o.title).join(' / ')}`;
    }
    if (exercise.kind === 'match-pairs' && exercise.pairs) {
        return `Begrepene: ${exercise.pairs.map((p) => p.term).join(', ')}`;
    }
    return exercise.prompt;
};

const pushMiss = (state: RunState, exercise: SessionExercise): MissedPrompt[] => {
    const entry = { prompt: missTitle(exercise), link: exercise.sourceLink };
    if (state.misses.some((m) => m.prompt === entry.prompt)) return state.misses;
    return [...state.misses, entry];
};

// Tilby 2 relikvier eleven ikke har - deterministisk per node
const offerRelics = (state: RunState, nodeId: string): RelicId[] => {
    const pool = ALL_RELIC_IDS.filter((id) => !state.relics.includes(id));
    const rng = mulberry32(djb2Hash(`${state.config.seed}:${nodeId}:relic`));
    return shuffleWith(pool, rng).slice(0, 2);
};

export const runReducer = (state: RunState | null, action: LoypeAction): RunState | null => {
    if (action.type === 'START_RUN') {
        return {
            phase: 'map',
            config: action.config,
            map: action.map,
            currentNodeId: null,
            visited: [],
            hearts: START_HEARTS,
            maxHearts: START_HEARTS,
            relics: [],
            shieldUsed: false,
            shieldFlash: false,
            fiftyCharges: 0,
            combo: 0,
            bestCombo: 0,
            correct: 0,
            answered: 0,
            xp: 0,
            exercises: [],
            exerciseIndex: 0,
            offeredRelics: [],
            bossMaxHp: DIFFICULTY_CONFIG[action.config.difficulty].bossHp,
            bossHp: DIFFICULTY_CONFIG[action.config.difficulty].bossHp,
            bossIndex: 0,
            won: false,
            misses: [],
        };
    }
    if (state === null) return null;

    switch (action.type) {
        case 'ABANDON':
            return null;

        case 'ENTER_NODE': {
            const node = nodeById(state, action.nodeId);
            if (!node) return state;
            const base = {
                ...state,
                currentNodeId: node.id,
                visited: [...state.visited, node.id],
            };
            if (node.type === 'rest') {
                return {
                    ...base,
                    hearts: Math.min(state.maxHearts, state.hearts + 1),
                    phase: 'rest',
                };
            }
            if (node.type === 'reward') {
                const offered = offerRelics(state, node.id);
                if (offered.length === 0) {
                    // Alle relikvier samlet - trøstepremien er et hjerte
                    return {
                        ...base,
                        hearts: Math.min(state.maxHearts, state.hearts + 1),
                        phase: 'rest',
                    };
                }
                return { ...base, offeredRelics: offered, phase: 'reward' };
            }
            if (node.type === 'boss') {
                return {
                    ...base,
                    exercises: action.exercises ?? [],
                    bossIndex: 0,
                    bossHp: state.bossMaxHp,
                    phase: 'boss',
                };
            }
            // challenge / elite
            const exercises = action.exercises ?? [];
            if (exercises.length === 0) return { ...base, phase: 'map' };
            return { ...base, exercises, exerciseIndex: 0, phase: 'encounter' };
        }

        case 'ANSWER': {
            const node = nodeById(state, state.currentNodeId);
            const exercise = state.exercises[state.exerciseIndex];
            if (!exercise || state.phase !== 'encounter') return state;
            const answered = state.answered + 1;
            if (action.correct) {
                const combo = state.combo + 1;
                return {
                    ...state,
                    answered,
                    correct: state.correct + 1,
                    combo,
                    bestCombo: Math.max(state.bestCombo, combo),
                    xp: state.xp + xpGain(state, node?.type === 'elite' ? XP_ELITE : XP_CHALLENGE),
                };
            }
            return {
                ...state,
                answered,
                combo: 0,
                misses: pushMiss(state, exercise),
                ...applyWrong(state),
            };
        }

        case 'NEXT': {
            const node = nodeById(state, state.currentNodeId);
            const cleared = { ...state, shieldFlash: false };
            if (state.hearts <= 0) return { ...cleared, phase: 'dead' };
            if (state.exerciseIndex + 1 < state.exercises.length) {
                return { ...cleared, exerciseIndex: state.exerciseIndex + 1 };
            }
            if (node?.type === 'elite') {
                const offered = offerRelics(state, `${node.id}:elite`);
                if (offered.length > 0) {
                    return { ...cleared, offeredRelics: offered, phase: 'reward' };
                }
                return {
                    ...cleared,
                    hearts: Math.min(state.maxHearts, state.hearts + 1),
                    phase: 'rest',
                };
            }
            return { ...cleared, phase: 'map' };
        }

        case 'USE_FIFTY': {
            if (state.fiftyCharges <= 0) return state;
            return { ...state, fiftyCharges: state.fiftyCharges - 1 };
        }

        case 'PICK_RELIC': {
            const next: RunState = {
                ...state,
                relics: [...state.relics, action.relic],
                offeredRelics: [],
                phase: 'map',
            };
            if (action.relic === 'femti-femti') next.fiftyCharges = state.fiftyCharges + 2;
            if (action.relic === 'hjerteamulett') {
                next.maxHearts = state.maxHearts + 1;
                next.hearts = Math.min(next.maxHearts, state.hearts + 1);
            }
            return next;
        }

        case 'CONTINUE':
            return { ...state, offeredRelics: [], phase: 'map' };

        case 'BOSS_ANSWER': {
            const exercise = state.exercises[state.bossIndex];
            if (!exercise || state.phase !== 'boss') return state;
            const answered = state.answered + 1;
            if (action.correct) {
                const combo = state.combo + 1;
                return {
                    ...state,
                    answered,
                    correct: state.correct + 1,
                    combo,
                    bestCombo: Math.max(state.bestCombo, combo),
                    xp: state.xp + xpGain(state, XP_BOSS_HIT),
                    bossHp: state.bossHp - 1,
                };
            }
            return {
                ...state,
                answered,
                combo: 0,
                misses: pushMiss(state, exercise),
                ...applyWrong(state),
            };
        }

        case 'BOSS_NEXT': {
            const cleared = { ...state, shieldFlash: false };
            if (state.bossHp <= 0) {
                return { ...cleared, phase: 'summary', won: true, xp: state.xp + XP_WIN_BONUS };
            }
            if (state.hearts <= 0) return { ...cleared, phase: 'dead' };
            if (state.bossIndex + 1 >= state.exercises.length) {
                // Tomt for spørsmål - bossen flykter, eleven vinner
                return { ...cleared, phase: 'summary', won: true, xp: state.xp + XP_WIN_BONUS };
            }
            return { ...cleared, bossIndex: state.bossIndex + 1 };
        }

        default:
            return state;
    }
};
