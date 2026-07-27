// Registeret over steder. Ett sted er ett kart med alt som hører til det:
// tema, terreng, folk, landemerker, spawnpunkt og bossen som vokter det.
//
// Scenen slår opp her og bygger det den får. Den vet ikke at Nordvik finnes,
// og det er hele poenget: kapittel 1 seiler til Lindisfarne, og da skal det
// koste et oppslag - ikke en omskriving av verdenslaget.
//
// NPC- og landemerke-id-er er unike på tvers av steder. Det lar grensesnittet
// slå opp «hvem er dette» uten å vite hvor eleven står.

import { byggHub } from '../engine/hubgen';
import { byggNordvik } from '../engine/worldgen';
import type { LandmarkDef, NpcDef, Sted } from '../types';
import { HUB_LANDEMERKER, HUB_PORTALER, HUB_SPAWN, HUB_TEMA, VARDE_RUTE } from './hub';
import {
    NORDVIK_AUTHORED_QUESTER,
    NORDVIK_BOSS_QUESTIONS,
    NORDVIK_FARKOSTER,
    NORDVIK_LANDMARKS,
    NORDVIK_NPCS,
    NORDVIK_PORTAL,
    NORDVIK_SPAWN,
} from './nordvik';
import { EPOKE_BY_ID } from './epoker';

/**
 * Minnevokterens hall.
 *
 * Det eneste stedet uten epoke. Den ligger utenfor tiden, og det er ikke en
 * mangel: det er grunnen til at eleven kan gå hit og tilbake uten at nivået,
 * sølvet og oppdragene hennes byttes ut med en annen epokes.
 *
 * Regelsettet blir vikingtidens, gjennom fallbacken i `regelsettFor`. Det er
 * med vilje. Blueprintens §5 sier at det ikke skal finnes to regelsett før en
 * epoke nummer to krever det, og et eget «fredelig» sett for et sted uten
 * fiender ville vært nettopp den andre implementasjonen - skrevet for å slippe
 * å vise en pust-stolpe.
 */
const HUB: Sted = {
    id: 'hub',
    tittel: 'Minnevokterens hall',
    undertittel: 'Utenfor tiden',
    epokeId: null,
    tema: HUB_TEMA,
    byggKart: byggHub,
    spawn: HUB_SPAWN,
    npcer: [],
    landemerker: [
        ...HUB_LANDEMERKER,
        {
            id: 'hall-varde',
            kind: 'varde',
            tile: VARDE_RUTE,
            title: 'Varden',
            text: 'En stein for hver gang du kom tilbake.',
        },
    ],
    portaler: HUB_PORTALER,
    // Tåka er tynnere her. Borte ville den ikke vært riktig - Glemselen finnes
    // også i hallen, den har bare mindre å ta av utenfor tiden.
    taake: 0.45,
    musikkRot: 220,
    authored: [],
};

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
    portaler: [
        {
            tile: NORDVIK_PORTAL,
            maal: {
                art: 'sted',
                stedId: 'hub',
                navn: 'HALLEN',
                undertekst: 'VEIEN HJEM',
            },
        },
    ],
    boss: {
        enemyId: 'den-store-glemselen',
        sporsmal: NORDVIK_BOSS_QUESTIONS,
    },
    musikkRot: 196,
    authored: NORDVIK_AUTHORED_QUESTER,
};

export const STEDER: Sted[] = [HUB, NORDVIK];

export const STED_BY_ID: Record<string, Sted> = Object.fromEntries(STEDER.map((s) => [s.id, s]));

/**
 * Der en ny elev begynner: i hallen, foran tidslinjeveien.
 *
 * Ikke det samme som `START_EPOKE` (`epoker.ts`). Det er to forskjellige ting:
 * hvor hun står, og hvilken epokes regnskap som er åpent.
 */
export const START_STED = 'hub';

/** Stedet med denne id-en, eller startstedet hvis id-en er ukjent. */
export function stedEllerStart(id: string | undefined): Sted {
    return STED_BY_ID[id ?? ''] ?? STED_BY_ID[START_STED];
}

/**
 * Der en elev kommer inn i en epoke hun ikke har vært i før, eller `null` hvis
 * epoken ikke har noe sted ennå.
 *
 * Null, ikke et fall til hallen. Faller den tilbake, blir en epoke som er
 * merket `spillbar` uten at kartet er bygget til en portal som fører hjem til
 * stedet eleven allerede står på - og `bestillReise` avviser den i stillhet.
 * Eleven trykker E, ingenting skjer, og ingenting sier hvorfor. Portalen skal
 * i stedet stå mørk til stedet finnes.
 */
export function forsteStedI(epokeId: string): string | null {
    return STEDER.find((s) => s.epokeId === epokeId)?.id ?? null;
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
