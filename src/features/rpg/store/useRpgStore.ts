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
import { persist } from 'zustand/middleware';
import { useProgressStore } from '../../progress/useProgressStore';
import { BEGREP_BY_ID } from '../data/begreper';
import { CLASS_BY_ID, CLASSES, levelFromXp, statsAt, xpForLevel } from '../data/classes';
import { ITEM_BY_ID, equipmentBonus } from '../data/items';
import { START_EPOKE } from '../data/epoker';
import { stedIEpoke, START_STED } from '../data/steder';
import { sfx } from '../engine/audio';
import type {
    AettTilstand,
    CharacterDraft,
    EpokeKampanje,
    EpokeKapittel,
    EpokeSave,
    Forstaaelse,
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
    sekk: string[];
    utstyr: Record<ItemSlot, string | null>;
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
    leggISekk: (itemId: string) => void;
    utrust: (itemId: string) => void;
    taAv: (slot: ItemSlot) => void;
    startQuest: (questId: string) => void;
    fullforQuest: (quest: QuestDef, riktig: boolean) => void;
    kjop: (itemId: string) => boolean;
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

const TOM_UTSTYR: Record<ItemSlot, string | null> = { vapen: null, rustning: null, amulett: null };

/** Våpenet en elev uten utrustet våpen slår med - hendene hennes, i praksis. */
const START_VAAPEN = 'ovingssverd';

const LAGRING_VERSJON = 4;

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
 * Slår aldri opp klassen uten fall. Et lagret spill fra en klasse som er
 * omdøpt eller fjernet - og det kommer til å skje, `character.classId` er på
 * vei ut med kampanjen - skal gi eleven en litt annen startgave, ikke et
 * unntak midt i innlastingen som lar henne stå igjen uten spill i det hele
 * tatt.
 */
const tomtKapittel = (character: CharacterDraft | null): EpokeKapittel => {
    const klasse = character ? (CLASS_BY_ID[character.classId] ?? CLASSES[0]) : null;
    const start = character ? statsAt(character.classId, 1) : { hp: 100 };
    return {
        hp: start.hp,
        xp: 0,
        solv: 0,
        sekk: klasse ? [klasse.startWeapon] : [],
        utstyr: klasse ? { ...TOM_UTSTYR, vapen: klasse.startWeapon } : { ...TOM_UTSTYR },
        // Femti er «en av oss»: hun er verken utstøtt eller kjent. Den som
        // arver noe, får det gjennom `startAere` ved kapittelskiftet.
        aere: 50,
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
    kapittelState: { ...tomtKapittel(character), ...lagret?.kapittelState },
});

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
        aere: s.aere,
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
    character: CharacterDraft | null;
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

/** Maks liv/kraft ut fra nivå, klasse og utstyr. */
export function maksVerdier(state: Pick<RpgState, 'character' | 'xp' | 'utstyr'>) {
    if (!state.character) return { hp: 100, styrke: 5, vern: 3, niva: 1 };
    const niva = levelFromXp(state.xp);
    const base = statsAt(state.character.classId, niva);
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
    const vapen = ITEM_BY_ID[state.utstyr.vapen ?? START_VAAPEN]?.weapon;
    return vapen ?? (ITEM_BY_ID[START_VAAPEN].weapon as VaapenDef);
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

            leggISekk: (itemId) => {
                if (!ITEM_BY_ID[itemId]) return;
                const state = get();
                set({ sekk: [...state.sekk, itemId] });
                get().varsle(`Du fant ${ITEM_BY_ID[itemId].name}.`, 'bra');
            },

            utrust: (itemId) => {
                const item = ITEM_BY_ID[itemId];
                if (!item) return;
                const state = get();
                if (!state.sekk.includes(itemId)) return;
                const forrige = state.utstyr[item.slot];
                const sekk = state.sekk.filter((id) => id !== itemId);
                if (forrige) sekk.push(forrige);
                set({ sekk, utstyr: { ...state.utstyr, [item.slot]: itemId } });
                // Utstyr kan øke maks-liv; fyll ikke opp, men klipp aldri under 1.
                const maks = maksVerdier(get());
                set({ hp: Math.max(1, Math.min(get().hp, maks.hp)) });
            },

            taAv: (slot) => {
                const state = get();
                const id = state.utstyr[slot];
                if (!id) return;
                set({ sekk: [...state.sekk, id], utstyr: { ...state.utstyr, [slot]: null } });
                const maks = maksVerdier(get());
                set({ hp: Math.max(1, Math.min(get().hp, maks.hp)) });
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
            kjop: (itemId) => {
                const item = ITEM_BY_ID[itemId];
                const state = get();
                if (!item?.pris) return false;
                const pris = prisFor(item.pris, state.aere);
                if (state.solv < pris) return false;
                set({ solv: state.solv - pris, sekk: [...state.sekk, itemId] });
                get().varsle(`Kjøpt: ${item.name}.`, 'bra');
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
                const s = (lagret ?? {}) as Partial<SaveState>;
                const character = s.spiller?.character ?? null;
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
                const character = s.character ?? null;
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
                                sekk: s.sekk ?? [],
                                utstyr: { ...TOM_UTSTYR, ...s.utstyr },
                                // Ingen elev har spilt et kapittel med ære
                                // ennå. Alle kommer inn som «en av oss».
                                aere: tomt.aere,
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
