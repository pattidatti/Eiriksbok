// Spillerens tilstand i «Minnevokteren». Alt som skal overleve at eleven
// lukker fanen ligger her, og lagres i localStorage som de andre storene i
// appen.
//
// To former, med vilje ikke den samme: den aktive epoken ligger flatt i
// kjøretiden, mens disken har et navnerom per epoke (`SaveState` i types.ts).
// `partialize` og `merge` nederst er de eneste to stedene som kjenner begge.
//
// Storen er også broen til «Min læring»: når eleven fullfører en quest eller
// feller en boss, kalles recordActivity() slik at det teller i det vanlige
// progresjonssystemet.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '../../../utils/safeStorage';
import { useProgressStore } from '../../progress/useProgressStore';
import { BEGREP_BY_ID } from '../data/begreper';
import {
    DEFAULT_APPEARANCE,
    KJORTEL_FOR_KLASSE,
    STARTVAAPEN,
    levelFromXp,
    statsAt,
    xpForLevel,
} from '../data/eleven';
import {
    ITEM_BY_ID,
    STABEL_MAKS,
    TOM_UTSTYR,
    equipmentBonus,
    erOdelagt,
    holdbarhetIgjen,
    kanTasPa,
    maksHoldbarhet,
    normaliserHurtigbar,
    normaliserSekk,
    normaliserUtstyr,
    reparasjonspris,
    salgspris,
} from '../data/items';
import { START_EPOKE } from '../data/epoker';
import { stedIEpoke, START_STED } from '../data/steder';
import { sfx } from '../engine/audio';
import { START_FORRAD } from '../data/aaret';
import type {
    AettTilstand,
    CharacterDraft,
    Forrad,
    EpokeKampanje,
    EpokeKapittel,
    EpokeSave,
    Forstaaelse,
    Gjenstand,
    HubSpor,
    ItemSlot,
    Klokke,
    QuestDef,
    Sak,
    SaveState,
    VaapenDef,
} from '../types';
import {
    AERE_GRUNNER,
    arvetAere,
    klampAere,
    prisFor,
    startAere,
    type AereGrunn,
} from '../engine/aere';
// Døpt om ved importen: handlingen i storen heter det samme, og to like navn i
// samme fil er en feil som ser riktig ut helt til noen leser den.
import { AARSTID, gaaDager as tikkKlokke } from '../engine/klokke';
import { KAPITLER, KAPITTEL_BY_NR } from '../data/kapitler';

/**
 * Kjøretidstilstanden.
 *
 * Den aktive epoken ligger **flatt** her - `hp`, `xp`, `sekk` og resten - så
 * ingen komponent trenger å vite hvilken epoke den leser fra. Det som ligger
 * lagret om epoker eleven ikke står i nå, ligger urørt i `andreEpoker`.
 *
 * Formen på disken er en annen, og den står i `SaveState` (`types.ts`).
 * `partialize` og `merge` er de eneste to stedene som kjenner begge.
 */
export interface RpgState {
    character: CharacterDraft | null;
    /** Epoken eleven står i. Alt det flate under gjelder den. */
    epokeId: string;
    /** Kapittelet i epoken. Kapittelskifte kommer med kampanjen. */
    kapittel: number;
    /** Stedet hun sto på sist - der neste økt begynner. */
    sisteSted: string;
    /** Lagret tilstand for epoker hun ikke står i akkurat nå. */
    andreEpoker: Record<string, EpokeSave>;
    /** Merkene hun har satt i hubben. Hører ikke til noen epoke. */
    hub: HubSpor;
    xp: number;
    hp: number;
    solv: number;
    /** Sekken, rute for rute. `null` er en tom rute. */
    sekk: (Gjenstand | null)[];
    utstyr: Record<ItemSlot, Gjenstand | null>;
    /** Hurtigbaren, tast 1-4: id-en til en forbruksvare, eller tom. */
    hurtigbar: (string | null)[];
    quester: Record<string, 'aktiv' | 'ferdig'>;
    /** Hvor mange ganger eleven har bommet på hvert oppdrag. */
    questForsok: Record<string, number>;
    riktigeSvar: number;
    galeSvar: number;
    lest: string[];
    bosser: string[];
    /** Kapittelstegene hun har gjort. */
    steg: string[];
    /** Minnetreet: begrep-id → ukjent/hørt/forstått. */
    begreper: Record<string, Forstaaelse>;
    /** Cutscenene hun har sett. */
    sette: string[];
    /** Kildene hun har lagt ut på bordet i et mellomspill. */
    kilder: string[];
    /** Valg som huskes: brente skriptoriet, tok bøkene, og resten. */
    flagg: Record<string, boolean>;
    /** Personens egen ære, 0-100. Dør med personen. */
    aere: number;
    /** Korn, kjøtt og dyr på gården. */
    forrad: Forrad;
    /** Ættens rykte. Arves til neste kapittel som et forsprang. */
    aettAere: number;
    /** Hva hver ætt mener om eleven. */
    aetter: Record<string, AettTilstand>;
    /** Sakene, reist og dømt. */
    saker: Sak[];
    fredlos: boolean;
    /** Tiden på gården. */
    klokke: Klokke;
    /** Beskjeder som HUD-en viser som «toast». */
    varsler: { id: number; tekst: string; art: 'info' | 'bra' | 'darlig' | 'niva' }[];

    lagKarakter: (draft: CharacterDraft) => void;
    ankomSted: (stedId: string, epokeId: string | null) => void;
    /** Eleven gikk inn i en epoke. Telleren ved portalen vokser med én. */
    teltPortal: (epokeId: string) => void;
    /** En stein lagt på varden. */
    leggStein: () => void;
    slettAlt: () => void;
    endreHp: (delta: number) => void;
    settHp: (value: number) => void;
    giXp: (amount: number) => void;
    giSolv: (amount: number) => void;
    /**
     * Legger noe i sekken. Forbruksvarer fyller opp stabler først. Er sekken
     * full, blir det liggende - og da svarer den `false`, så den som kalte
     * kan la det ligge på bakken.
     */
    leggISekk: (itemId: string, antall?: number, stille?: boolean) => boolean;
    /** Tar på det som ligger i en rute. Det som satt på plassen, havner i ruta. */
    utrust: (rute: number) => void;
    /**
     * Gir henne en gjenstand rett på kroppen. Det som satt der, går i sekken -
     * eller på bakken, er sekken full. Brukes når noen i verden rekker henne noe.
     */
    giOgTaPa: (itemId: string) => void;
    /** Tar av en del. Til en bestemt rute, eller til første ledige. */
    taAv: (slot: ItemSlot, tilRute?: number) => void;
    /** Flytter mellom to ruter. Bytter plass, eller slår sammen like stabler. */
    flyttISekk: (fra: number, til: number) => void;
    /** Høyreklikk i WoW: bruk en forbruksvare, eller ta på en del. */
    brukRute: (rute: number) => void;
    /** Bruker én av en forbruksvare, uansett hvilken rute den ligger i. */
    brukVare: (itemId: string) => boolean;
    /** Kaster det som ligger i en rute. Borte for godt. */
    kast: (rute: number) => void;
    /** Selger alt i en rute til kremmeren. */
    selg: (rute: number) => void;
    /** Kjøper tilbake? Nei - reparerer alt hun har på seg og i sekken. */
    reparerAlt: () => boolean;
    /** Sliter på en del hun har på seg. Et poeng om gangen. */
    slit: (slot: ItemSlot, poeng?: number) => void;
    /** Døden koster: alt hun har på seg mister en tidel. */
    dodsslitasje: () => void;
    settHurtig: (plass: number, itemId: string | null) => void;
    startQuest: (questId: string) => void;
    fullforQuest: (quest: QuestDef, riktig: boolean) => void;
    kjop: (itemId: string, antall?: number) => boolean;
    markerLest: (landmarkId: string) => void;
    felleBoss: (bossId: string) => void;
    /** Et kapittelsteg er gjort. Trygg å kalle to ganger. */
    fullforSteg: (stegId: string) => void;
    /**
     * Æren flytter seg, med en grunn som står i loggen.
     *
     * Grunnen er ikke pynt: en ærestolpe som beveger seg uten at eleven vet
     * hvorfor, er en terning. Hun skal kunne peke på handlingen.
     */
    endreAere: (grunn: AereGrunn) => void;
    /** Ære uten en fast grunn - kapittelets egne øyeblikk. */
    giAere: (delta: number, tekst: string) => void;
    /** Hvordan en ætt ser på eleven. Positivt er velvilje, negativt er strid. */
    endreAett: (aettId: string, endring: Partial<AettTilstand>) => void;
    /** La det gå dager på årshjulet. Melder fra når årstiden skifter. */
    gaaDager: (dager: number, grunn?: string) => void;
    /** Sett klokken. Brukes av kapittelskiftet, ikke av spillet. */
    settKlokke: (klokke: Klokke) => void;
    /**
     * Legg til eller trekk fra i forrådet. Ingenting går under null.
     *
     * En binge kan ikke inneholde minus fire sekker korn, og en gård kan ikke
     * ha minus to kyr. Klampingen ligger her og ikke hos den som kaller, så
     * ingen kan komme til å glemme den midt i en høst.
     */
    endreForrad: (endring: Partial<Forrad>) => void;
    /** Reis en sak. Den ligger til den er ført på tinget. */
    reisSak: (sak: Sak) => void;
    /** Endre en sak: lyst, vitner, anført lov, dom. */
    endreSak: (sakId: string, endring: Partial<Sak>) => void;
    /**
     * Løft et begrep i minnetreet. `hort` er gratis; `forstatt` teller i «Min
     * læring», og bare første gang.
     */
    larBegrep: (begrepId: string, niva: Forstaaelse) => void;
    /** Et puzzle er løst. Egen kontering fordi puzzlet er arbeidet, ikke begrepet. */
    fullforPuzzle: (puzzleId: string, tittel: string) => void;
    /** En kilde er lagt ut på bordet. Kumulativ - Mellomspill V leser hele lista. */
    lesKilde: (kildeId: string) => void;
    /** Mellomspillet er gjennomgått. Kildekritikken er den tyngste XP-en i spillet. */
    fullforMellomspill: (id: string, tittel: string) => void;
    /** Kapittelet er i havn. */
    fullforKapittel: (nr: number, tittel: string) => void;
    /**
     * Neste kapittel begynner: ny person, samme ætt.
     *
     * Kapitteltilstanden nullstilles - nivå, sølv, sekk og utstyr følger
     * personen, ikke ætten. Det som blir igjen, er det ætten er kjent for.
     */
    byttKapittel: (nr: number) => void;
    markerSett: (klippId: string) => void;
    settFlagg: (navn: string, verdi?: boolean) => void;
    varsle: (tekst: string, art?: 'info' | 'bra' | 'darlig' | 'niva') => void;
    fjernVarsel: (id: number) => void;
    hvil: () => void;
}

/** Våpenet en elev uten utrustet våpen slår med - hendene hennes, i praksis. */
const START_VAAPEN = 'ovingssverd';

const LAGRING_VERSJON = 5;

/**
 * En karakter slik den kan ligge på disken, i en hvilken som helst utgave.
 *
 * Før §16.3 hadde hun `classId`; nå har hun `kjortel`. Begge feltene står her,
 * begge er valgfrie, og `tolkKarakter` gjør en av delene om til en figur vi tør
 * å tegne. Feltet `classId` skal stå til den dagen ingen har et så gammelt
 * lagret spill, og ikke en dag lenger.
 */
type LagretKarakter = {
    name?: string;
    classId?: string;
    kjortel?: number;
    appearance?: CharacterDraft['appearance'];
};

/**
 * Karakteren, oversatt til den formen spillet bruker nå.
 *
 * Den som hadde valgt runemester, får den blå kjortelen - ikke fordi blå er
 * riktig for en runemester, men fordi det er den fargen hun så på figuren sin i
 * går. Et lagret spill skal aldri skifte ansikt over natten.
 */
function tolkKarakter(raa: LagretKarakter | null | undefined): CharacterDraft | null {
    if (!raa || typeof raa.name !== 'string') return null;
    const kjortel =
        typeof raa.kjortel === 'number'
            ? raa.kjortel
            : (KJORTEL_FOR_KLASSE[raa.classId ?? ''] ?? 0);
    return {
        name: raa.name,
        kjortel,
        appearance: raa.appearance ?? DEFAULT_APPEARANCE,
    };
}

/**
 * Hva en pensjonert besvergelse er verdt.
 *
 * Nordvik har ingen trolldom, og stavene eleven brukte år på å låse opp
 * forsvinner med rammen. Hun skal ikke bare oppdage at de er borte - hun skal
 * få noe for dem, og få vite hvorfor (blueprint §12.2).
 */
const SOLV_PER_STAV = 25;

let varselId = 0;

/**
 * Sølvet en migrering nettopp ga for pensjonerte staver.
 *
 * Ligger som en modulvariabel fordi `migrate` og `onRehydrateStorage` ikke har
 * noen annen vei mellom seg: migreringen returnerer bare data, og den kan ikke
 * varsle - storen finnes ikke ennå når den kjører.
 */
let lestStavsolv = 0;

// ─── Epoketilstand ──────────────────────────────────────────────────────────

/** En hall ingen har satt sine spor i ennå. */
const tomtHub = (): HubSpor => ({ besokt: {}, steiner: 0 });

/** Ingenting lært, ingenting gjort. */
const tomKampanje = (): EpokeKampanje => ({
    quester: {},
    questForsok: {},
    riktigeSvar: 0,
    galeSvar: 0,
    lest: [],
    bosser: [],
    steg: [],
    begreper: {},
    sette: [],
    kilder: [],
    flagg: {},
    aettAere: 0,
    aetter: {},
    saker: [],
    fredlos: false,
    // Klokken begynner der kampanjen begynner. Et år på null ville stått og
    // lyst i HUD-en første gang en epoke skrur på årshjulet.
    klokke: { aar: KAPITLER[0].aar, dag: 1 },
});

/**
 * En person som akkurat har begynt.
 *
 * Klassen sto her til §16.3: startverdiene og startvåpenet ble slått opp fra
 * `character.classId`, med fall til den første klassen hvis id-en var ukjent.
 * Nå er det ett sett tall og ett startvåpen for alle, og det som er hennes -
 * navnet og utseendet - ligger i `character` og røres ikke av et kapittelskifte.
 */
const tomtKapittel = (character: CharacterDraft | null): EpokeKapittel => {
    return {
        hp: statsAt(1).hp,
        xp: 0,
        solv: 0,
        sekk: normaliserSekk([]),
        utstyr: character
            ? { ...TOM_UTSTYR, vapen: { id: STARTVAAPEN }, skjold: { id: 'treningsskjold' } }
            : { ...TOM_UTSTYR },
        hurtigbar: normaliserHurtigbar([]),
        // Femti er «en av oss»: hun er verken utstøtt eller kjent. Den som
        // arver noe, får det gjennom `startAere` ved kapittelskiftet.
        aere: 50,
        forrad: { ...START_FORRAD },
    };
};

const nyEpoke = (epokeId: string, character: CharacterDraft | null): EpokeSave => ({
    kapittel: 1,
    // Har epoken ikke noe sted ennå, står hun i hallen. Det er sant: da finnes
    // det ingen verden å stå i der inne.
    sisteSted: stedIEpoke(epokeId, 1) ?? START_STED,
    kampanje: tomKampanje(),
    kapittelState: tomtKapittel(character),
});

/**
 * Fyller hullene i en lagret epoke.
 *
 * Dette er stedet fallgruven i blueprintens §12.2 lå: zustand-persist flettet
 * flatt, så et felt som bare fikk verdi i `create()` ble `undefined` for en
 * elev med et gammelt lagret spill, og første `.length` krasjet spillet
 * hennes. Nå går alt gjennom denne funksjonen, og et nytt felt får default
 * uten at noen må huske å skrive en migrering.
 */
const heleEpoken = (
    epokeId: string,
    lagret: Partial<EpokeSave> | undefined,
    character: CharacterDraft | null
): EpokeSave => ({
    kapittel: lagret?.kapittel ?? 1,
    sisteSted: lagret?.sisteSted ?? stedIEpoke(epokeId, lagret?.kapittel ?? 1) ?? START_STED,
    kampanje: { ...tomKampanje(), ...lagret?.kampanje },
    kapittelState: kapittelMedSekk(character, lagret?.kapittelState),
});

/**
 * Kapitteltilstanden med sekken og utstyret i dagens form.
 *
 * Sekken var en liste med id-er før utstyrssystemet, og slik står den på
 * disken hos alle som har spilt. Den gjøres om her, i samme funksjon som fyller
 * alle andre hull, så ingen annen kode trenger å vite at den gamle formen fantes.
 */
const kapittelMedSekk = (
    character: CharacterDraft | null,
    lagret: Partial<EpokeKapittel> | undefined
): EpokeKapittel => {
    const tomt = tomtKapittel(character);
    if (!lagret) return tomt;
    return {
        ...tomt,
        ...lagret,
        sekk: normaliserSekk(lagret.sekk),
        utstyr: lagret.utstyr ? normaliserUtstyr(lagret.utstyr) : tomt.utstyr,
        hurtigbar: normaliserHurtigbar(lagret.hurtigbar),
    };
};

/** Den aktive epoken, plukket ut av den flate kjøretidstilstanden. */
const aktivEpoke = (s: RpgState): EpokeSave => ({
    kapittel: s.kapittel,
    sisteSted: s.sisteSted,
    kampanje: {
        quester: s.quester,
        questForsok: s.questForsok,
        riktigeSvar: s.riktigeSvar,
        galeSvar: s.galeSvar,
        lest: s.lest,
        bosser: s.bosser,
        steg: s.steg,
        begreper: s.begreper,
        sette: s.sette,
        kilder: s.kilder,
        flagg: s.flagg,
        aettAere: s.aettAere,
        aetter: s.aetter,
        saker: s.saker,
        fredlos: s.fredlos,
        klokke: s.klokke,
    },
    kapittelState: {
        hp: s.hp,
        xp: s.xp,
        solv: s.solv,
        sekk: s.sekk,
        utstyr: s.utstyr,
        hurtigbar: s.hurtigbar,
        aere: s.aere,
        forrad: s.forrad,
    },
});

/** Motsatt vei: en epoke brettes ut flatt oppå tilstanden. */
const leggUtEpoke = (s: RpgState, epokeId: string, epoke: EpokeSave): RpgState => ({
    ...s,
    epokeId,
    kapittel: epoke.kapittel,
    sisteSted: epoke.sisteSted,
    ...epoke.kampanje,
    ...epoke.kapittelState,
});

/**
 * Formen lagringen hadde til og med versjon 3: alt flatt, én epoke
 * underforstått. Står her, ikke i `types.ts`, fordi den bare finnes for
 * migreringens skyld og skal dø den dagen ingen elev har et så gammelt spill.
 */
interface LagringV3 {
    character: LagretKarakter | null;
    xp: number;
    hp: number;
    solv: number;
    /**
     * Kraft og besvergelser.
     *
     * De finnes ikke lenger i spillet (§15), men de finnes på disken hos hver
     * elev som har spilt før i dag - og migreringen må kunne lese dem for å
     * betale for stavene. Feltene skal stå her til den dagen ingen har et så
     * gammelt lagret spill, og ikke en dag lenger.
     */
    mana: number;
    spells: string[];
    sekk: string[];
    utstyr: Record<ItemSlot, string | null>;
    quester: Record<string, 'aktiv' | 'ferdig'>;
    questForsok: Record<string, number>;
    riktigeSvar: number;
    galeSvar: number;
    lest: string[];
    bosser: string[];
    sisteSone: string;
}

/** Maks liv og slagkraft ut fra nivå og utstyr. */
export function maksVerdier(state: Pick<RpgState, 'character' | 'xp' | 'utstyr'>) {
    if (!state.character) return { hp: statsAt(1).hp, styrke: 5, vern: 3, niva: 1 };
    const niva = levelFromXp(state.xp);
    const base = statsAt(niva);
    const bonus = equipmentBonus(state.utstyr);
    return {
        niva,
        hp: base.hp + bonus.hp,
        styrke: base.styrke + bonus.styrke,
        vern: base.vern + bonus.vern,
    };
}

/**
 * Våpenet eleven har i hånda.
 *
 * Fire steder gjorde `ITEM_BY_ID[utstyr.vapen ?? 'ovingssverd']?.weapon?.art ??
 * 'sverd'` hver for seg, og de var ikke enige: tre av dem falt tilbake på
 * øvingssverdets tall, den fjerde på strengen «sverd». Ett oppslag, ett fall.
 */
export function utrustetVaapen(
    state: Pick<RpgState, 'utstyr'> = useRpgStore.getState()
): VaapenDef {
    const g = state.utstyr.vapen;
    const vapen = ITEM_BY_ID[g?.id ?? START_VAAPEN]?.weapon;
    const ut = vapen ?? (ITEM_BY_ID[START_VAAPEN].weapon as VaapenDef);
    // Et ødelagt våpen slår fortsatt, men halvparten så hardt. Å miste våpenet
    // helt midt i feltet ville vært en straff eleven ikke kan komme seg ut av.
    return erOdelagt(g) ? { ...ut, skade: Math.max(1, Math.round(ut.skade / 2)) } : ut;
}

/** Forbruksvarer kan ikke brukes tettere enn dette. Ellers er maten en rustning. */
const BRUK_PAUSE_MS = 1200;
let brukIgjen = 0;

/** Hva det koster å reparere alt hun har på seg og i sekken. */
export function reparasjonsprisAlt(state: Pick<RpgState, 'utstyr' | 'sekk'>): number {
    let sum = 0;
    for (const g of Object.values(state.utstyr)) if (g) sum += reparasjonspris(g);
    for (const g of state.sekk) if (g) sum += reparasjonspris(g);
    return sum;
}

export const useRpgStore = create<RpgState>()(
    persist(
        (set, get) => ({
            character: null,
            epokeId: START_EPOKE,
            kapittel: 1,
            sisteSted: START_STED,
            andreEpoker: {},
            hub: tomtHub(),
            ...tomtKapittel(null),
            ...tomKampanje(),
            varsler: [],

            lagKarakter: (draft) =>
                set((s) => ({
                    ...leggUtEpoke(s, START_EPOKE, nyEpoke(START_EPOKE, draft)),
                    character: draft,
                    // En ny elev begynner i hallen, ikke i en epoke. Epoken er
                    // likevel satt: den er boka regnskapet føres i, og den
                    // åpnes i det hun går gjennom den første portalen.
                    sisteSted: START_STED,
                    andreEpoker: {},
                    hub: tomtHub(),
                    varsler: [],
                })),

            slettAlt: () =>
                set((s) => ({
                    ...leggUtEpoke(s, START_EPOKE, nyEpoke(START_EPOKE, null)),
                    character: null,
                    sisteSted: START_STED,
                    andreEpoker: {},
                    hub: tomtHub(),
                    varsler: [],
                })),

            teltPortal: (epokeId) =>
                set((s) => ({
                    hub: {
                        ...s.hub,
                        besokt: { ...s.hub.besokt, [epokeId]: (s.hub.besokt[epokeId] ?? 0) + 1 },
                    },
                })),

            leggStein: () => set((s) => ({ hub: { ...s.hub, steiner: s.hub.steiner + 1 } })),

            /**
             * Eleven har kommet fram et sted. Stedet huskes, så neste økt
             * begynner der hun slapp.
             *
             * Er stedet i en annen epoke, legges den hun forlot til side hel -
             * nivå, sølv, sekk og alt hun har lært - og den nye hentes fram
             * eller begynnes på. To epoker skal aldri smelte sammen til én
             * bunke tall, og det er hele grunnen til at lagringen har et
             * `epoker`-navnerom.
             *
             * `epokeId: null` er hubben. Den ligger utenfor alle epoker, og da
             * skal ingenting byttes: eleven skal kunne gå hjem til hallen og
             * tilbake uten at nivået hennes står og skifter i HUD-en.
             */
            ankomSted: (stedId, epokeId) => {
                const s = get();
                if (epokeId === null || epokeId === s.epokeId) {
                    if (s.sisteSted !== stedId) set({ sisteSted: stedId });
                    return;
                }
                const lagret = s.andreEpoker[epokeId];
                const andre = { ...s.andreEpoker, [s.epokeId]: aktivEpoke(s) };
                delete andre[epokeId];
                set({
                    ...leggUtEpoke(s, epokeId, heleEpoken(epokeId, lagret, s.character)),
                    sisteSted: stedId,
                    andreEpoker: andre,
                });
            },

            endreHp: (delta) => {
                const state = get();
                const maks = maksVerdier(state).hp;
                set({ hp: Math.max(0, Math.min(maks, state.hp + delta)) });
            },

            settHp: (value) => {
                const maks = maksVerdier(get()).hp;
                set({ hp: Math.max(0, Math.min(maks, value)) });
            },

            giXp: (amount) => {
                const state = get();
                const forNiva = levelFromXp(state.xp);
                const nyXp = state.xp + amount;
                const nyttNiva = levelFromXp(nyXp);
                set({ xp: nyXp });
                if (nyttNiva > forNiva) {
                    // Nytt nivå fyller opp livet - en liten pause i kampen.
                    const maks = maksVerdier({ ...state, xp: nyXp });
                    set({ hp: maks.hp });
                    sfx.nivaOpp();
                    get().varsle(`Nivå ${nyttNiva}! Livet er fylt opp.`, 'niva');
                }
            },

            giSolv: (amount) => set({ solv: get().solv + amount }),

            leggISekk: (itemId, antall = 1, stille = false) => {
                const item = ITEM_BY_ID[itemId];
                if (!item) return false;
                const sekk = get().sekk.slice();
                let igjen = antall;
                // Forbruksvarer fyller stablene som finnes før de tar en ny rute.
                if (item.forbruk) {
                    for (let i = 0; i < sekk.length && igjen > 0; i++) {
                        const g = sekk[i];
                        if (g?.id !== itemId) continue;
                        const plass = STABEL_MAKS - (g.antall ?? 1);
                        const n = Math.min(plass, igjen);
                        if (n <= 0) continue;
                        sekk[i] = { ...g, antall: (g.antall ?? 1) + n };
                        igjen -= n;
                    }
                }
                while (igjen > 0) {
                    const ledig = sekk.indexOf(null);
                    if (ledig < 0) break;
                    const n = item.forbruk ? Math.min(STABEL_MAKS, igjen) : 1;
                    sekk[ledig] = n > 1 ? { id: itemId, antall: n } : { id: itemId };
                    igjen -= n;
                }
                if (igjen === antall) {
                    get().varsle('Sekken er full.', 'darlig');
                    return false;
                }
                const hurtigbar = get().hurtigbar.slice();
                // En ny slags mat legger seg selv på hurtigbaren, som i WoW når
                // man plukker opp noe for første gang. Ellers finner eleven
                // aldri ut at tastene 1-4 finnes.
                if (item.forbruk && !hurtigbar.includes(itemId)) {
                    const tom = hurtigbar.indexOf(null);
                    if (tom >= 0) hurtigbar[tom] = itemId;
                }
                set({ sekk, hurtigbar });
                if (stille) return true;
                get().varsle(
                    antall > 1 ? `Du fikk ${antall} ${item.name}.` : `Du fant ${item.name}.`,
                    'bra'
                );
                return true;
            },

            utrust: (rute) => {
                const state = get();
                const g = state.sekk[rute];
                const item = g ? ITEM_BY_ID[g.id] : undefined;
                if (!g || !kanTasPa(item)) return;
                const sekk = state.sekk.slice();
                // Det som satt på, havner der det nye lå. Da står sammenligningen
                // igjen i samme rute, og et angret bytte er ett klikk til.
                sekk[rute] = state.utstyr[item.slot];
                set({ sekk, utstyr: { ...state.utstyr, [item.slot]: g } });
                sfx.plukk();
                // Utstyr kan øke maks-liv; fyll ikke opp, men klipp aldri under 1.
                const maks = maksVerdier(get());
                set({ hp: Math.max(1, Math.min(get().hp, maks.hp)) });
            },

            giOgTaPa: (itemId) => {
                const item = ITEM_BY_ID[itemId];
                if (!kanTasPa(item)) return;
                const state = get();
                const forrige = state.utstyr[item.slot];
                set({ utstyr: { ...state.utstyr, [item.slot]: { id: itemId } } });
                if (forrige) {
                    const sekk = get().sekk.slice();
                    const ledig = sekk.indexOf(null);
                    if (ledig >= 0) {
                        sekk[ledig] = forrige;
                        set({ sekk });
                    }
                }
                const maks = maksVerdier(get());
                set({ hp: Math.max(1, Math.min(get().hp, maks.hp)) });
            },

            taAv: (slot, tilRute) => {
                const state = get();
                const g = state.utstyr[slot];
                if (!g) return;
                const sekk = state.sekk.slice();
                const rute =
                    tilRute !== undefined && sekk[tilRute] === null ? tilRute : sekk.indexOf(null);
                if (rute < 0) {
                    get().varsle('Sekken er full.', 'darlig');
                    return;
                }
                sekk[rute] = g;
                set({ sekk, utstyr: { ...state.utstyr, [slot]: null } });
                const maks = maksVerdier(get());
                set({ hp: Math.max(1, Math.min(get().hp, maks.hp)) });
            },

            flyttISekk: (fra, til) => {
                if (fra === til) return;
                const sekk = get().sekk.slice();
                const a = sekk[fra];
                const b = sekk[til];
                if (!a || til < 0 || til >= sekk.length) return;
                // Like forbruksvarer slås sammen så langt stabelen rekker.
                if (b && b.id === a.id && ITEM_BY_ID[a.id]?.forbruk) {
                    const sum = (a.antall ?? 1) + (b.antall ?? 1);
                    const inn = Math.min(STABEL_MAKS, sum);
                    sekk[til] = { ...b, antall: inn };
                    const rest = sum - inn;
                    sekk[fra] = rest > 0 ? { ...a, antall: rest } : null;
                } else {
                    sekk[til] = a;
                    sekk[fra] = b;
                }
                set({ sekk });
            },

            brukRute: (rute) => {
                const g = get().sekk[rute];
                const item = g ? ITEM_BY_ID[g.id] : undefined;
                if (!g || !item) return;
                if (item.forbruk) get().brukVare(item.id);
                else if (kanTasPa(item)) get().utrust(rute);
            },

            brukVare: (itemId) => {
                const item = ITEM_BY_ID[itemId];
                const state = get();
                if (!item?.forbruk) return false;
                const rute = state.sekk.findIndex((g) => g?.id === itemId);
                if (rute < 0) {
                    get().varsle(`Du har ikke mer ${item.name}.`, 'darlig');
                    return false;
                }
                const na = Date.now();
                if (na < brukIgjen) return false;
                const maks = maksVerdier(state).hp;
                if (item.forbruk.hp && state.hp >= maks) {
                    get().varsle('Du er allerede frisk.', 'info');
                    return false;
                }
                brukIgjen = na + BRUK_PAUSE_MS;
                const sekk = state.sekk.slice();
                const g = sekk[rute]!;
                sekk[rute] = (g.antall ?? 1) > 1 ? { ...g, antall: (g.antall ?? 1) - 1 } : null;
                set({ sekk, hp: Math.min(maks, state.hp + (item.forbruk.hp ?? 0)) });
                sfx.plukk();
                return true;
            },

            kast: (rute) => {
                const sekk = get().sekk.slice();
                if (!sekk[rute]) return;
                sekk[rute] = null;
                set({ sekk });
            },

            selg: (rute) => {
                const state = get();
                const g = state.sekk[rute];
                const item = g ? ITEM_BY_ID[g.id] : undefined;
                if (!g || !item) return;
                const sum = salgspris(item) * (g.antall ?? 1);
                const sekk = state.sekk.slice();
                sekk[rute] = null;
                set({ sekk, solv: state.solv + sum });
                sfx.solv();
            },

            reparerAlt: () => {
                const state = get();
                const pris = reparasjonsprisAlt(state);
                if (pris === 0 || state.solv < pris) return false;
                const hel = (g: Gjenstand | null): Gjenstand | null => {
                    if (!g || g.holdbarhet === undefined) return g;
                    const kopi = { ...g };
                    delete kopi.holdbarhet;
                    return kopi;
                };
                const utstyr = { ...state.utstyr };
                for (const slot of Object.keys(utstyr) as ItemSlot[])
                    utstyr[slot] = hel(utstyr[slot]);
                set({ solv: state.solv - pris, utstyr, sekk: state.sekk.map(hel) });
                sfx.solv();
                get().varsle(`Alt er reparert. Det kostet ${pris} sølv.`, 'bra');
                return true;
            },

            slit: (slot, poeng = 1) => {
                const state = get();
                const g = state.utstyr[slot];
                if (!g) return;
                const igjen = holdbarhetIgjen(g);
                if (igjen === null || igjen === 0) return;
                const ny = Math.max(0, igjen - poeng);
                set({ utstyr: { ...state.utstyr, [slot]: { ...g, holdbarhet: ny } } });
                const item = ITEM_BY_ID[g.id];
                const maks = maksHoldbarhet(item) ?? 1;
                // To varsler og ikke flere: når delen er nesten borte, og når
                // den er det. Et varsel per poeng er støy.
                if (ny === 0) {
                    get().varsle(
                        `${item.name} er ødelagt. Få den reparert hos en kremmer.`,
                        'darlig'
                    );
                    const maksHp = maksVerdier(get()).hp;
                    if (get().hp > maksHp) set({ hp: maksHp });
                } else if (igjen > maks * 0.2 && ny <= maks * 0.2) {
                    get().varsle(`${item.name} er nesten utslitt.`, 'info');
                }
            },

            dodsslitasje: () => {
                const state = get();
                const utstyr = { ...state.utstyr };
                for (const slot of Object.keys(utstyr) as ItemSlot[]) {
                    const g = utstyr[slot];
                    if (!g) continue;
                    const maks = maksHoldbarhet(ITEM_BY_ID[g.id]);
                    const igjen = holdbarhetIgjen(g);
                    if (maks === null || igjen === null) continue;
                    utstyr[slot] = { ...g, holdbarhet: Math.max(0, igjen - Math.ceil(maks / 10)) };
                }
                set({ utstyr });
            },

            settHurtig: (plass, itemId) => {
                const hurtigbar = get().hurtigbar.slice();
                if (plass < 0 || plass >= hurtigbar.length) return;
                if (itemId && !ITEM_BY_ID[itemId]?.forbruk) return;
                // Samme vare på to taster er én tast for mye.
                for (let i = 0; i < hurtigbar.length; i++)
                    if (hurtigbar[i] === itemId) hurtigbar[i] = null;
                hurtigbar[plass] = itemId;
                set({ hurtigbar });
            },

            startQuest: (questId) => {
                const state = get();
                if (state.quester[questId]) return;
                set({ quester: { ...state.quester, [questId]: 'aktiv' } });
            },

            /**
             * Et galt svar skal koste noe.
             *
             * Før kunne eleven gjette i blinde: oppdraget ble stående aktivt,
             * fasiten og forklaringen ble vist uansett, og alternativene lå i
             * samme rekkefølge. Optimal strategi var å trykke tilfeldig, lese
             * fasiten og svare riktig - hele læringsmekanikken kunne omgås på
             * under et minutt.
             *
             * Nå: første bom gir ikke fasiten, bare hintet om hvor svaret står.
             * Andre bom lukker oppdraget uten belønning, men gir forklaringen -
             * for eleven skal alltid gå derfra med å ha lært noe.
             */
            fullforQuest: (quest, riktig) => {
                const state = get();
                if (riktig) {
                    set({
                        quester: { ...state.quester, [quest.id]: 'ferdig' },
                        riktigeSvar: state.riktigeSvar + 1,
                    });
                    // Full belønning bare når hun traff på første forsøk.
                    const forsok = state.questForsok[quest.id] ?? 0;
                    const andel = forsok === 0 ? 1 : 0.5;
                    get().giXp(Math.round(quest.belonning.xp * andel));
                    get().giSolv(Math.round(quest.belonning.solv * andel));
                    if (forsok === 0 && quest.belonning.itemId)
                        get().leggISekk(quest.belonning.itemId);

                    // Teller i «Min læring» på lik linje med en quiz i boka.
                    useProgressStore.getState().recordActivity({
                        kind: 'minigame-played',
                        activityId: `oving/rpg/${quest.question.subjectId}/${quest.question.topicId}`,
                        subjectId: quest.question.subjectId,
                        topicId: quest.question.topicId,
                        score: 1,
                        title: `Minnevokteren: ${quest.title}`,
                    });
                    return;
                }

                const forsok = (state.questForsok[quest.id] ?? 0) + 1;
                set({
                    galeSvar: state.galeSvar + 1,
                    questForsok: { ...state.questForsok, [quest.id]: forsok },
                });
                if (forsok >= 2) {
                    set({ quester: { ...get().quester, [quest.id]: 'ferdig' } });
                    get().varsle(
                        'Oppdraget lukkes. Les forklaringen - den sitter neste gang.',
                        'darlig'
                    );
                } else {
                    get().varsle('Ikke helt. Gå og finn svaret, så prøver vi igjen.', 'darlig');
                }
            },

            /**
             * Prisen står ikke på varen, den står på deg.
             *
             * Bera tar mer av en hun ikke vet om hun får se igjen. Det er den
             * billigste måten å gjøre æren merkbar på lenge før noen slår seg:
             * eleven ser tallet endre seg i boden uten at spillet forklarer det.
             */
            kjop: (itemId, antall = 1) => {
                const item = ITEM_BY_ID[itemId];
                const state = get();
                if (!item?.pris) return false;
                const pris = prisFor(item.pris, state.aere) * antall;
                if (state.solv < pris) return false;
                // Sekken først: sølvet trekkes bare hvis varen fikk plass.
                if (!get().leggISekk(itemId, antall, true)) return false;
                set({ solv: get().solv - pris });
                sfx.solv();
                return true;
            },

            markerLest: (landmarkId) => {
                const state = get();
                if (state.lest.includes(landmarkId)) return;
                set({ lest: [...state.lest, landmarkId] });
                get().giXp(5);
            },

            felleBoss: (bossId) => {
                const state = get();
                if (state.bosser.includes(bossId)) return;
                set({ bosser: [...state.bosser, bossId] });
                useProgressStore.getState().recordActivity({
                    kind: 'minigame-played',
                    activityId: `oving/rpg/boss/${bossId}`,
                    subjectId: 'historie',
                    topicId: 'vikingtiden',
                    score: 1,
                    title: 'Minnevokteren: Den store Glemselen felt',
                });
            },

            fullforSteg: (stegId) => {
                const s = get();
                if (s.steg.includes(stegId)) return;
                set({ steg: [...s.steg, stegId] });
            },

            // ── Ære, ætt og tid ─────────────────────────────────────────────

            endreAere: (grunn) => {
                const { delta, tekst } = AERE_GRUNNER[grunn];
                get().giAere(delta, tekst);
            },

            /**
             * Æren flytter seg, og eleven får vite hvorfor i samme øyeblikk.
             *
             * Varselet er ikke pynt. En stolpe som beveger seg uten en setning
             * ved siden av, leser som en terning - og da slutter eleven å tro
             * at hun styrer den.
             */
            giAere: (delta, tekst) => {
                const s = get();
                const ny = klampAere(s.aere + delta);
                if (ny === s.aere) return;
                set({ aere: ny });
                const fortegn = delta > 0 ? '+' : '';
                get().varsle(`${tekst} (${fortegn}${delta} ære)`, delta > 0 ? 'bra' : 'darlig');
            },

            endreAett: (aettId, endring) => {
                const s = get();
                const na = s.aetter[aettId] ?? { velvilje: 0, uoppgjort: 0 };
                set({
                    aetter: {
                        ...s.aetter,
                        [aettId]: {
                            velvilje: Math.max(
                                -100,
                                Math.min(100, na.velvilje + (endring.velvilje ?? 0))
                            ),
                            uoppgjort: Math.max(0, na.uoppgjort + (endring.uoppgjort ?? 0)),
                        },
                    },
                });
            },

            /**
             * Dager går.
             *
             * Ingenting annet skjer her. Hva et årstidsskifte *betyr* - at
             * åkeren skulle vært sådd, at ingen seiler om vinteren - eies av
             * kapittelet. Ellers ville en gård kunne sulte som bivirkning av at
             * noen spurte om datoen.
             */
            gaaDager: (dager, grunn) => {
                const s = get();
                const { klokke, skifte } = tikkKlokke(s.klokke, dager);
                set({ klokke });
                if (grunn) get().varsle(`${grunn} (${dager} dager)`, 'info');
                if (skifte) {
                    const a = AARSTID[skifte];
                    get().varsle(`${a.navn}. ${a.laerer}`, 'niva');
                }
            },

            settKlokke: (klokke) => set({ klokke }),

            endreForrad: (endring) =>
                set((s) => ({
                    forrad: {
                        korn: Math.max(0, s.forrad.korn + (endring.korn ?? 0)),
                        kjott: Math.max(0, s.forrad.kjott + (endring.kjott ?? 0)),
                        dyr: Math.max(0, s.forrad.dyr + (endring.dyr ?? 0)),
                        aaker: Math.max(0, s.forrad.aaker + (endring.aaker ?? 0)),
                    },
                })),

            reisSak: (sak) => {
                const s = get();
                if (s.saker.some((x) => x.id === sak.id)) return;
                set({ saker: [...s.saker, sak] });
            },

            endreSak: (sakId, endring) =>
                set((s) => ({
                    saker: s.saker.map((x) => (x.id === sakId ? { ...x, ...endring } : x)),
                })),

            /**
             * Minnetreet. `hort` koster ingenting og teller ingenting - det er
             * bare at hun har møtt ordet. `forstatt` er det ekte, og det gis
             * aldri for et quizsvar: den som kaller denne, har sett eleven
             * gjøre noe.
             *
             * XP-en her hører til «Min læring», ikke til spillets eget nivå.
             * De to tallene skal aldri møtes (blueprint §7.5): spillets XP sier
             * hvor mye hun har slåss, dette sier hva hun har forstått, og det
             * er det siste en lærer skal få se.
             */
            larBegrep: (begrepId, niva) => {
                const s = get();
                const begrep = BEGREP_BY_ID[begrepId];
                if (!begrep) return;
                const fra = s.begreper[begrepId] ?? 'ukjent';
                const rang = { ukjent: 0, hort: 1, forstatt: 2 } as const;
                if (rang[niva] <= rang[fra]) return;
                set({ begreper: { ...s.begreper, [begrepId]: niva } });
                if (niva !== 'forstatt') return;

                get().varsle(`Du forstår ${begrep.navn}.`, 'niva');
                useProgressStore.getState().recordActivity({
                    kind: 'microgame-played',
                    activityId: `oving/rpg/begrep/${begrepId}`,
                    subjectId: 'historie',
                    topicId: 'vikingtiden',
                    score: 1,
                    title: `Minnevokteren: ${begrep.navn}`,
                });
            },

            /**
             * Vakten er `steg`, ikke `recordActivity`. Storen deduplisererer
             * riktignok selv, men et gjentak gir repetisjonsbonus - og et
             * puzzle som gir XP hver gang eleven åpner det igjen, er et puzzle
             * hun kommer til å åpne igjen.
             */
            fullforPuzzle: (puzzleId, tittel) => {
                const s = get();
                const merke = `puzzle:${puzzleId}`;
                if (s.steg.includes(merke)) return;
                set({ steg: [...s.steg, merke] });
                useProgressStore.getState().recordActivity({
                    kind: 'microgame-played',
                    activityId: `oving/rpg/puzzle/${puzzleId}`,
                    subjectId: 'historie',
                    topicId: 'vikingtiden',
                    score: 1,
                    title: `Minnevokteren: ${tittel}`,
                });
            },

            lesKilde: (kildeId) => {
                const s = get();
                if (s.kilder.includes(kildeId)) return;
                set({ kilder: [...s.kilder, kildeId] });
            },

            /**
             * Et mellomspill er gjennomgått.
             *
             * Dette er den største enkeltbelønningen spillet gir i «Min læring»
             * (blueprint §7.5), og det er med vilje: kildekritikk er det
             * tyngste kompetansemålet i emnet, og bordet er det eneste stedet i
             * spillet hun møter det som noe hun selv må avgjøre.
             *
             * Vakten er `steg`, ikke `recordActivity`. Storen dedupliserer
             * riktignok selv, men et gjentak gir repetisjonsbonus - og eleven
             * skal kunne gå tilbake til bordet og lese kildene om igjen så ofte
             * hun vil uten at det blir en XP-maskin.
             */
            fullforMellomspill: (id, tittel) => {
                const s = get();
                const merke = `mellomspill:${id}`;
                if (s.steg.includes(merke)) return;
                set({ steg: [...s.steg, merke] });
                useProgressStore.getState().recordActivity({
                    kind: 'minigame-played',
                    activityId: `oving/rpg/mellomspill/${id}`,
                    subjectId: 'historie',
                    topicId: 'vikingtiden',
                    score: 1,
                    title: `Minnevokteren: ${tittel}`,
                });
            },

            fullforKapittel: (nr, tittel) => {
                const s = get();
                const merke = `kapittel:${nr}`;
                if (s.steg.includes(merke)) return;
                set({ steg: [...s.steg, merke] });
                useProgressStore.getState().recordActivity({
                    kind: 'minigame-played',
                    activityId: `oving/rpg/kapittel/${nr}`,
                    subjectId: 'historie',
                    topicId: 'vikingtiden',
                    score: 1,
                    title: `Minnevokteren: ${tittel}`,
                });
            },

            /**
             * Kapittelskiftet (blueprint §12.1).
             *
             * Orm den yngre i 1066 arver ikke Torsteins sverd fra 793. Han
             * arver at Torstein hadde et - og at ætten er kjent for det. Derfor
             * bygges kapitteltilstanden på nytt fra bunnen, mens kampanjen står
             * urørt: begreper, kilder, saker, flagg og ætt-ære følger med.
             */
            byttKapittel: (nr) => {
                const s = get();
                const kap = KAPITTEL_BY_NR[nr];
                if (!kap || s.kapittel === nr) return;
                const aettAere = arvetAere(s.aettAere, s.aere);
                set({
                    kapittel: nr,
                    ...tomtKapittel(s.character),
                    aettAere,
                    // Forspranget hun ikke har gjort seg fortjent til. Det er
                    // ættesamfunnet, og det er hele grunnen til at kapittel 1
                    // skal spille inn i kapittel 2.
                    aere: startAere(aettAere),
                    // Året settes av kapittelet, og klokken går aldri bakover.
                    klokke: { aar: Math.max(s.klokke.aar, kap.aar), dag: 1 },
                });
            },

            markerSett: (klippId) => {
                const s = get();
                if (s.sette.includes(klippId)) return;
                set({ sette: [...s.sette, klippId] });
            },

            settFlagg: (navn, verdi = true) =>
                set((s) => ({ flagg: { ...s.flagg, [navn]: verdi } })),

            varsle: (tekst, art = 'info') => {
                varselId += 1;
                const id = varselId;
                set({ varsler: [...get().varsler.slice(-3), { id, tekst, art }] });
                window.setTimeout(() => get().fjernVarsel(id), 3600);
            },

            fjernVarsel: (id) => set({ varsler: get().varsler.filter((v) => v.id !== id) }),

            hvil: () => {
                set({ hp: maksVerdier(get()).hp });
            },
        }),
        {
            name: 'rpg-minnevokteren-v1',
            storage: createJSONStorage(() => safeLocalStorage),
            version: LAGRING_VERSJON,
            // Bare data lagres, og i den formen `SaveState` beskriver. Før ble
            // hele staten - inkludert alle handlingene - sendt gjennom
            // serialiseringen, og formen på disken var bare påstått i en type
            // ingen sjekket mot.
            partialize: (state): SaveState => ({
                version: LAGRING_VERSJON,
                spiller: { character: state.character },
                hub: state.hub,
                sisteEpoke: state.epokeId,
                epoker: { ...state.andreEpoker, [state.epokeId]: aktivEpoke(state) },
            }),
            merge: (lagret, gjeldende): RpgState => {
                const s = (lagret ?? {}) as Partial<SaveState> & {
                    spiller?: { character?: LagretKarakter | null };
                };
                // Gjennom `tolkKarakter` også her, ikke bare i `migrate`. Et
                // lagret spill som har mistet versjonsfeltet, hopper over
                // migreringen - og da er dette det eneste stedet som kan gjøre
                // en gammel klasse om til en farge.
                const character = tolkKarakter(s.spiller?.character);
                const epokeId = s.sisteEpoke ?? START_EPOKE;
                const alle = { ...s.epoker };
                const aktiv = alle[epokeId];
                delete alle[epokeId];
                return leggUtEpoke(
                    {
                        ...gjeldende,
                        character,
                        andreEpoker: alle,
                        // `hub` kom til etter v4 og trengte likevel ingen ny
                        // versjon: hullet fylles her, som alle andre hull.
                        hub: { ...tomtHub(), ...s.hub },
                    },
                    epokeId,
                    heleEpoken(epokeId, aktiv, character)
                );
            },
            migrate: (lagret, versjon): SaveState => {
                if (versjon >= LAGRING_VERSJON) return lagret as SaveState;

                // v4 → v5: klassen ble en kjortelfarge (§16.3). Alt annet i et
                // v4-spill står som det står - hun har spilt kapitler, lagt ut
                // kilder og lært begreper, og ingenting av det skal røres for å
                // bytte et felt på figuren hennes.
                if (versjon === 4) {
                    const v4 = (lagret ?? {}) as SaveState & {
                        spiller?: { character?: LagretKarakter | null };
                    };
                    return {
                        ...v4,
                        version: LAGRING_VERSJON,
                        spiller: { character: tolkKarakter(v4.spiller?.character) },
                    };
                }

                const s = (lagret ?? {}) as Partial<LagringV3>;
                let quester = s.quester ?? {};
                let questForsok = s.questForsok ?? {};

                // Bankoppdragene het før `nordvik-b<nummer>`, der nummeret var
                // plassen i en liste som ble stokket på nytt hver gang
                // quest-bank.json ble regenerert. Markeringene overlevde altså
                // ikke en build: de pekte på andre spørsmål enn dem eleven
                // faktisk hadde svart på. De kastes én gang her. Håndskrevne
                // oppdrag (`nordvik-h*`), nivå, sølv, utstyr og boss beholdes.
                if (versjon < 3) {
                    const gammel = (n: string) => /^nordvik-b\d+$/.test(n);
                    const vask = <T>(kart: Record<string, T>) =>
                        Object.fromEntries(
                            Object.entries(kart).filter(([n]) => !gammel(n))
                        ) as Record<string, T>;
                    quester = vask(quester);
                    questForsok = vask(questForsok);
                }

                // Alt som lå flatt hørte til vikingtiden - det fantes ingen
                // annen epoke å høre til. Nøkkelen beholdes: å bytte den er å
                // slette hvert eneste lagrede spill i et klasserom som spiller.
                const character = tolkKarakter(s.character);
                const tomt = tomtKapittel(character);
                const stavsolv = (s.spells?.length ?? 0) * SOLV_PER_STAV;
                lestStavsolv = stavsolv;
                return {
                    version: LAGRING_VERSJON,
                    spiller: { character },
                    hub: tomtHub(),
                    sisteEpoke: START_EPOKE,
                    epoker: {
                        [START_EPOKE]: {
                            kapittel: 1,
                            sisteSted: s.sisteSone ?? START_STED,
                            kampanje: {
                                // Kapittelfeltene (`steg`, `begreper`, `sette`,
                                // `flagg`) får default her som alle andre. De
                                // kom til etter v4 og trengte likevel ingen ny
                                // versjon: `merge` bygger hele tilstanden
                                // gjennom `heleEpoken`, så en lagring uten dem
                                // får tomme. Det er R6-arbeidet som betaler seg.
                                ...tomKampanje(),
                                quester,
                                questForsok,
                                riktigeSvar: s.riktigeSvar ?? 0,
                                galeSvar: s.galeSvar ?? 0,
                                lest: s.lest ?? [],
                                bosser: s.bosser ?? [],
                            },
                            kapittelState: {
                                hp: s.hp ?? tomt.hp,
                                xp: s.xp ?? 0,
                                // Besvergelsene er borte (§15). Eleven skal ikke
                                // bare miste dem: hun får 25 sølv per stav, og
                                // en linje som sier hvorfor. Et tap som leser
                                // som en utbetaling.
                                solv: (s.solv ?? 0) + stavsolv,
                                sekk: normaliserSekk(s.sekk),
                                utstyr: normaliserUtstyr(s.utstyr),
                                hurtigbar: normaliserHurtigbar([]),
                                // Ingen elev har spilt et kapittel med ære
                                // ennå. Alle kommer inn som «en av oss».
                                aere: tomt.aere,
                                forrad: tomt.forrad,
                            },
                        },
                    },
                };
            },
            onRehydrateStorage: () => (state, feil) => {
                // Uten denne linja er en feil i migreringen usynlig: zustand
                // svelger unntaket, eleven møter karakterskaperen som om hun
                // aldri hadde spilt, og det lagrede spillet ligger urørt på
                // disken til hun lager en ny figur oppå det.
                if (feil) console.error('[rpg] klarte ikke å laste lagret spill', feil);
                if (!state) return;
                // Lukket eleven fanen mellom at hun døde og at hun trykket
                // «Reis deg», ble hp lagret som 0. Da våknet hun neste gang med
                // null liv og ingen dødsskjerm å komme seg ut av.
                if (state.hp <= 0) {
                    state.hp = maksVerdier(state).hp;
                }
                // Migreringen kan ikke varsle: `varsle` bruker en timer og et
                // store som ikke finnes ennå når `migrate` kjører. Beskjeden
                // legges derfor her, ett bilde senere, og bare til den som
                // faktisk hadde staver.
                const stavsolv = lestStavsolv;
                lestStavsolv = 0;
                if (stavsolv > 0) {
                    window.setTimeout(
                        () =>
                            state.varsle(
                                `Nordvik har ingen trolldom. Du fikk ${stavsolv} sølv for stavene.`,
                                'info'
                            ),
                        900
                    );
                }
            },
        }
    )
);

/**
 * Kapittelet eleven står i, i en gitt epoke.
 *
 * Den aktive epoken ligger flatt, de andre ligger i `andreEpoker`. Uten dette
 * ene oppslaget måtte hver som lurte på «hvilket Nordvik?» kjenne begge former,
 * og det er nøyaktig den kunnskapen `partialize` og `merge` finnes for å samle.
 */
export function kapittelIEpoke(epokeId: string): number {
    const s = useRpgStore.getState();
    return epokeId === s.epokeId ? s.kapittel : (s.andreEpoker[epokeId]?.kapittel ?? 1);
}

/** XP som mangler til neste nivå, og hvor langt inn i nivået eleven er. */
export function nivaFremgang(xp: number) {
    const niva = levelFromXp(xp);
    const start = xpForLevel(niva);
    const neste = xpForLevel(niva + 1);
    const spenn = Math.max(1, neste - start);
    return { niva, inn: xp - start, spenn, andel: Math.min(1, (xp - start) / spenn) };
}
