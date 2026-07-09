// Relikviene i Kunnskapsløypa. Effektene håndheves i runReducer.ts -
// dette er kun presentasjonsdata.

import type { RelicId } from './types';

export interface RelicDef {
    id: RelicId;
    title: string;
    description: string;
    emoji: string;
}

export const RELICS: Record<RelicId, RelicDef> = {
    skjold: {
        id: 'skjold',
        title: 'Skjoldet',
        description: 'Tåler ett feilsvar uten at du mister et hjerte.',
        emoji: '🛡️',
    },
    'femti-femti': {
        id: 'femti-femti',
        title: 'Femti-femti',
        description: 'Fjern to gale svar på en flervalgsoppgave. To ladninger.',
        emoji: '✂️',
    },
    kunnskapsstein: {
        id: 'kunnskapsstein',
        title: 'Kunnskapssteinen',
        description: 'Dobbel poengsum resten av løypa.',
        emoji: '💎',
    },
    hjerteamulett: {
        id: 'hjerteamulett',
        title: 'Hjerteamuletten',
        description: 'Ett ekstra hjerte i maks, og du blir helbredet med ett.',
        emoji: '❤️',
    },
};

export const ALL_RELIC_IDS = Object.keys(RELICS) as RelicId[];
