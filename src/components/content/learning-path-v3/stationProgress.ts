import type { LearningPathV3Data, StationActivityV3, StationV3 } from '../../../types';
import type { StepResponse } from '../../../stores/useLearningPathProfile';

// Fremdriften i én stasjon, lest ut av det generiske svar-objektet i profil-storen.
// Stasjonen regnes som fullført når sjekk-spørsmålene er besvart.
export interface StationState {
    activityDone: boolean;
    checkDone: boolean;
    perfect: boolean; // alle sjekk-spørsmål riktig på første forsøk
}

interface StationArtifact {
    activityDone?: boolean;
    perfect?: boolean;
}

export function readStation(resp: StepResponse | undefined): StationState {
    const art = (resp?.artifact ?? {}) as StationArtifact;
    return {
        activityDone: !!art.activityDone,
        checkDone: !!resp?.completed,
        perfect: !!art.perfect,
    };
}

export function artifactOf(state: StationState): StationArtifact {
    return { activityDone: state.activityDone, perfect: state.perfect };
}

// Tre stjerner per stasjon, én for hver ting eleven gjør:
// spillet/aktiviteten, spørsmålene, og alt riktig på første forsøk.
export const STAR_LABELS = ['Spilt', 'Svart', 'Alt riktig'] as const;

export function starsFor(station: StationV3, state: StationState): [boolean, boolean, boolean] {
    const activityStar = station.activity ? state.activityDone : state.checkDone;
    return [activityStar, state.checkDone, state.checkDone && state.perfect];
}

export function countStars(station: StationV3, state: StationState): number {
    return starsFor(station, state).filter(Boolean).length;
}

export function allStations(data: LearningPathV3Data): StationV3[] {
    return data.phases.flatMap((p) => p.stations);
}

export function activityLabel(activity: StationActivityV3 | undefined): {
    emoji: string;
    label: string;
} | null {
    if (!activity) return null;
    switch (activity.type) {
        case 'microgame':
            return { emoji: '🎮', label: 'Spill' };
        case 'fullgame':
            return { emoji: '🏛️', label: 'Stort 3D-spill' };
        case 'sort':
            return { emoji: '🧩', label: 'Sorter' };
        case 'order':
            return { emoji: '⏳', label: 'Rekkefølge' };
        case 'component':
            return { emoji: '✋', label: activity.label ?? 'Aktivitet' };
    }
}
