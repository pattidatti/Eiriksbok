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
import {
    byggLindisfarne,
    LINDISFARNE_PORTAL,
    LINDISFARNE_SPAWN,
} from '../engine/lindisfarnegen';
import { LINDISFARNE_LANDMARKS } from './lindisfarne';
import { byggNordvik } from '../engine/worldgen';
import type { LandmarkDef, NpcDef, Sted } from '../types';
import {
    HUB_LANDEMERKER,
    HUB_PORTALER,
    HUB_SPAWN,
    HUB_TEMA,
    SITTEPLASSER,
    VARDE_RUTE,
} from './hub';
import {
    NORDVIK_872_LANDMARKS,
    NORDVIK_872_NPCS,
    NORDVIK_872_PORTAL,
    NORDVIK_872_SPAWN,
    TORSTEINS_HAUG,
} from './nordvik872';
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
    // Ingen kommer av seg selv i hallen. Den er utenfor tiden, og et sted der
    // eleven møter klassekameratene sine er det siste stedet som tåler en
    // berserk ut av tåka.
    spawner: [],
    musikkRot: 220,
    authored: [],
    // Det ene stedet som deles. «Hubben er sammen, epokene er alene» - se
    // `Sted.flerspiller` for hvorfor flagget står her og ikke i nettlaget.
    flerspiller: true,
    sitteplasser: SITTEPLASSER,
};

const NORDVIK: Sted = {
    id: 'nordvik',
    tittel: 'Nordvik',
    undertittel: 'Vikingtiden · 793-1066',
    epokeId: 'vikingtiden',
    kapittel: 1,
    tema: EPOKE_BY_ID.vikingtiden.tema,
    byggKart: () => byggNordvik(),
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
    // Den gamle Minnevokteren-rammen står til den pensjoneres i §15. Hver
    // etappe skal etterlate spillet spillbart, og bygda har ingen andre
    // fiender før kapittel 1 er ferdig.
    spawner: ['glemseltaake', 'kildelos-paastand', 'anakronisme', 'ryktespokelse', 'vrangbilde'],
    musikkRot: 196,
    authored: NORDVIK_AUTHORED_QUESTER,
};

/**
 * Lindisfarne, 8. juni 793.
 *
 * Andre halvdel av kapittel 1, og det andre kartet epoken har. Stedet har ingen
 * NPC-er og ingen oppdrag: de som bor her, møter eleven som motstand først og
 * som flyktende folk etterpå, og begge deler eies av `Raidet`.
 *
 * `spawner` er tom. Ingen driver inn hit av seg selv - raidet setter ut sine
 * egne i to bølger, og en glemseltåke mellom dem ville vært et annet spill.
 */
const LINDISFARNE: Sted = {
    id: 'lindisfarne',
    tittel: 'Lindisfarne',
    undertittel: '8. juni 793',
    epokeId: 'vikingtiden',
    kapittel: 1,
    tema: {
        ...EPOKE_BY_ID.vikingtiden.tema,
        // Lavere, kaldere og mer utvasket enn hjemme. Nordsjøen om morgenen,
        // ikke en fjord i solskinn - og et gress som er beitet ned av sau.
        gress: '#5f7a4e',
        himmel: '#c2cbd0',
        vann: '#33607e',
        sand: '#ddd3b4',
        tak: '#6a6250',
        tommer: '#7a6a52',
    },
    byggKart: byggLindisfarne,
    spawn: LINDISFARNE_SPAWN,
    npcer: [],
    landemerker: LINDISFARNE_LANDMARKS,
    portaler: [
        {
            tile: LINDISFARNE_PORTAL,
            maal: {
                art: 'sted',
                stedId: 'nordvik',
                navn: 'NORDVIK',
                undertekst: 'HJEM',
            },
        },
    ],
    // Klarere luft enn hjemme. Glemselen har ikke fått tak her - ennå.
    taake: 0.5,
    spawner: [],
    musikkRot: 174,
    authored: [],
};

/**
 * Nordvik i 872. Samme gård, samme sti, samme naust - og nesten ingen hjemme.
 *
 * Et eget sted og ikke en variabel inne i det gamle: folkene er andre, det som
 * står på kartet er annerledes, og et kart som skifter innhold etter hvilket
 * kapittel eleven står i, er et kart ingen kan lese i koden. Terrenget kommer
 * fra samme generator, for det *er* den samme gården.
 */
const NORDVIK_872: Sted = {
    id: 'nordvik-872',
    tittel: 'Nordvik',
    undertittel: '872 · mennene er ved Hafrsfjord',
    epokeId: 'vikingtiden',
    kapittel: 2,
    tema: EPOKE_BY_ID.vikingtiden.tema,
    // Langskipet er borte, og det ligger en haug sør for tunet som ikke lå der
    // i 793. To endringer, og begge sier hva som har skjedd uten et ord.
    byggKart: () => byggNordvik({ langskip: false, haug: TORSTEINS_HAUG }),
    spawn: NORDVIK_872_SPAWN,
    npcer: NORDVIK_872_NPCS,
    landemerker: NORDVIK_872_LANDMARKS,
    // Ingen båt. Færingen ble tatt med sørover den også, og en gård uten
    // fartøy er halve grunnen til at Åsa ikke bare kan dra fra det.
    portaler: [
        {
            tile: NORDVIK_872_PORTAL,
            maal: {
                art: 'sted',
                stedId: 'hub',
                navn: 'HALLEN',
                undertekst: 'VEIEN HJEM',
            },
        },
    ],
    // Tomt. Glemselen hører til den gamle rammen, og 872 er et kapittel der
    // motstanden kommer på en bestemt dag med et bestemt ærend.
    spawner: [],
    musikkRot: 185,
    authored: [],
};

export const STEDER: Sted[] = [HUB, NORDVIK, LINDISFARNE, NORDVIK_872];

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
 * Stedet en epoke slipper eleven inn på, i det kapittelet hun står i - eller
 * `null` hvis epoken ikke har noe sted ennå.
 *
 * Null, ikke et fall til hallen. Faller den tilbake, blir en epoke som er
 * merket `spillbar` uten at kartet er bygget til en portal som fører hjem til
 * stedet eleven allerede står på - og `bestillReise` avviser den i stillhet.
 * Eleven trykker E, ingenting skjer, og ingenting sier hvorfor. Portalen skal
 * i stedet stå mørk til stedet finnes.
 *
 * Kapittelet må være med. Uten det ville porten i hallen alltid ført til det
 * *første* Nordvik - og en elev som står midt i 872 ville kommet hjem til
 * 793, til folk som har vært døde i to menneskealdre.
 */
export function stedIEpoke(epokeId: string, kapittel = 1): string | null {
    const iKapittelet = STEDER.find((s) => s.epokeId === epokeId && s.kapittel === kapittel);
    return (iKapittelet ?? STEDER.find((s) => s.epokeId === epokeId))?.id ?? null;
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
