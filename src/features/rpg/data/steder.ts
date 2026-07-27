// Registeret over steder. Ett sted er ett kart med alt som hører til det:
// tema, terreng, folk, landemerker, spawnpunkt og bossen som vokter det.
//
// Scenen slår opp her og bygger det den får. Den vet ikke at Nordvik finnes,
// og det er hele poenget: kapittel 1 seiler til Lindisfarne, og da skal det
// koste et oppslag - ikke en omskriving av verdenslaget.
//
// NPC- og landemerke-id-er er unike på tvers av steder. Det lar grensesnittet
// slå opp «hvem er dette» uten å vite hvor eleven står.

import { byggNordvik } from '../engine/worldgen';
import type { LandmarkDef, NpcDef, Sted } from '../types';
import {
    NORDVIK_AUTHORED_QUESTER,
    NORDVIK_BOSS_QUESTIONS,
    NORDVIK_FARKOSTER,
    NORDVIK_LANDMARKS,
    NORDVIK_NPCS,
    NORDVIK_SPAWN,
} from './nordvik';
import { EPOKE_BY_ID } from './epoker';

const NORDVIK: Sted = {
    id: 'nordvik',
    tittel: 'Nordvik',
    undertittel: 'Vikingtiden · 793-1066',
    epokeId: 'vikingtiden',
    tema: EPOKE_BY_ID.vikingtiden.tema,
    byggKart: byggNordvik,
    spawn: NORDVIK_SPAWN,
    npcer: NORDVIK_NPCS,
    landemerker: NORDVIK_LANDMARKS,
    farkoster: NORDVIK_FARKOSTER,
    boss: {
        enemyId: 'den-store-glemselen',
        sporsmal: NORDVIK_BOSS_QUESTIONS,
    },
    musikkRot: 196,
    authored: NORDVIK_AUTHORED_QUESTER,
};

export const STEDER: Sted[] = [NORDVIK];

export const STED_BY_ID: Record<string, Sted> = Object.fromEntries(STEDER.map((s) => [s.id, s]));

/** Der en ny elev begynner. */
export const START_STED = 'nordvik';

/** Epoken startstedet ligger i. Utledes, så de to aldri kan si hver sin ting. */
export const START_EPOKE = STED_BY_ID[START_STED].epokeId;

/** Stedet med denne id-en, eller startstedet hvis id-en er ukjent. */
export function stedEllerStart(id: string | undefined): Sted {
    return STED_BY_ID[id ?? ''] ?? STED_BY_ID[START_STED];
}

/** Der en elev kommer inn i en epoke hun ikke har vært i før. */
export function forsteStedI(epokeId: string): string {
    return (STEDER.find((s) => s.epokeId === epokeId) ?? STED_BY_ID[START_STED]).id;
}

/** Slår opp en NPC uten å vite hvor hun står. */
export function finnNpc(id: string): NpcDef | undefined {
    for (const sted of STEDER) {
        const npc = sted.npcer.find((n) => n.id === id);
        if (npc) return npc;
    }
    return undefined;
}

/** Slår opp et landemerke uten å vite hvor det står. */
export function finnLandemerke(id: string): LandmarkDef | undefined {
    for (const sted of STEDER) {
        const lm = sted.landemerker.find((l) => l.id === id);
        if (lm) return lm;
    }
    return undefined;
}
