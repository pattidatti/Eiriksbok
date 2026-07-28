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
    AASAS_HAUG,
    HOVET,
    KONGENS_KNARR,
    NORDVIK_995_LANDMARKS,
    NORDVIK_995_NPCS,
    NORDVIK_995_PORTAL,
    NORDVIK_995_SPAWN,
} from './nordvik995';
import {
    KIRKEN,
    NORDVIK_1030_LANDMARKS,
    NORDVIK_1030_NPCS,
    NORDVIK_1030_PORTAL,
    NORDVIK_1030_SPAWN,
} from './nordvik1030';
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
    byggKart: () => byggNordvik({ langskip: null, hauger: [TORSTEINS_HAUG] }),
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

/**
 * Nordvik i 995. Tredje gang, og første gang noe *står* på gården som ikke
 * hører til den.
 *
 * To hauger sør for tunet i stedet for én, hovet oppe i lia, og kongens knarr
 * rett utenfor fjæra. Alle tre endringene er samme grep som i 872: terrenget
 * kommer fra den samme generatoren, for det er den samme gården, og det som
 * flyttes på er nettopp det som skal si at tiden har gått.
 */
const NORDVIK_995: Sted = {
    id: 'nordvik-995',
    tittel: 'Nordvik',
    undertittel: '995 · kongens skip ligger i vika',
    epokeId: 'vikingtiden',
    kapittel: 3,
    tema: {
        ...EPOKE_BY_ID.vikingtiden.tema,
        // Senhøst. Løvet er i ferd med å gå, og gresset har mistet det grønne
        // det hadde i juni - det er vinternettene som er fristen i kapittelet,
        // og de skal kunne ses på bakken.
        gress: '#6c7a4a',
        lov: '#9a7a3a',
        himmel: '#b9c3c8',
    },
    byggKart: () =>
        byggNordvik({
            langskip: KONGENS_KNARR,
            hauger: [TORSTEINS_HAUG, AASAS_HAUG],
            hov: HOVET,
        }),
    spawn: NORDVIK_995_SPAWN,
    npcer: NORDVIK_995_NPCS,
    landemerker: NORDVIK_995_LANDMARKS,
    portaler: [
        {
            tile: NORDVIK_995_PORTAL,
            maal: {
                art: 'sted',
                stedId: 'hub',
                navn: 'HALLEN',
                undertekst: 'VEIEN HJEM',
            },
        },
    ],
    // Tomt, som i 872. Det som kommer mot Torgils i dette kapittelet, kommer
    // fra skipet i vika, og det kommer på en bestemt dag.
    spawner: [],
    musikkRot: 165,
    authored: [],
};

/**
 * Nordvik i 1030. Fjerde gang, og første gang gården er kristen fra før.
 *
 * Kirken står der hovet sto, på samme rute og med den samme stien opp. Det er
 * den ene endringen som bærer hele kapittelet: mannen som skal gå mot kongen om
 * noen dager, er døpt i det huset.
 *
 * Skipet ligger på svai lengst sør igjen, der gårdens eget lå i 793. Det er
 * ikke det samme skroget - det er at gården har fartøy igjen, og at det er det
 * som skal bære dem inn fjorden til utbudet.
 */
const NORDVIK_1030: Sted = {
    id: 'nordvik-1030',
    tittel: 'Nordvik',
    undertittel: '1030 · budstikka har vært på fire gårder før din',
    epokeId: 'vikingtiden',
    kapittel: 4,
    tema: {
        ...EPOKE_BY_ID.vikingtiden.tema,
        // Slåtten, i tørt vær. Enga er lysere og mer utbrent enn i juni, og
        // himmelen er den ene tingen som gjør høyet verdt å haste med.
        gress: '#8a9450',
        lov: '#6f8a45',
        himmel: '#cfd8d4',
    },
    byggKart: () =>
        byggNordvik({
            hauger: [TORSTEINS_HAUG, AASAS_HAUG],
            kirke: KIRKEN,
        }),
    spawn: NORDVIK_1030_SPAWN,
    npcer: NORDVIK_1030_NPCS,
    landemerker: NORDVIK_1030_LANDMARKS,
    portaler: [
        {
            tile: NORDVIK_1030_PORTAL,
            maal: {
                art: 'sted',
                stedId: 'hub',
                navn: 'HALLEN',
                undertekst: 'VEIEN HJEM',
            },
        },
    ],
    // Tomt, som i 872 og 995. Det som kommer mot Halvard i dette kapittelet,
    // står oppstilt i en dal to dagsreiser unna, og det kommer på én dag.
    spawner: [],
    musikkRot: 156,
    authored: [],
};

export const STEDER: Sted[] = [
    HUB,
    NORDVIK,
    LINDISFARNE,
    NORDVIK_872,
    NORDVIK_995,
    NORDVIK_1030,
];

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
