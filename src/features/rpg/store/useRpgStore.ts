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
import { CLASS_BY_ID, CLASSES, levelFromXp, statsAt, xpForLevel } from '../data/classes';
import { ITEM_BY_ID, equipmentBonus } from '../data/items';
import { SPELL_BY_ID, newlyUnlockedSpells } from '../data/spells';
import { START_EPOKE } from '../data/epoker';
import { forsteStedI, START_STED } from '../data/steder';
import { sfx } from '../engine/audio';
import type {
    CharacterDraft,
    EpokeKampanje,
    EpokeKapittel,
    EpokeSave,
    HubSpor,
    ItemSlot,
    QuestDef,
    SaveState,
    VaapenDef,
} from '../types';

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
    mana: number;
    solv: number;
    sekk: string[];
    utstyr: Record<ItemSlot, string | null>;
    spells: string[];
    quester: Record<string, 'aktiv' | 'ferdig'>;
    /** Hvor mange ganger eleven har bommet på hvert oppdrag. */
    questForsok: Record<string, number>;
    riktigeSvar: number;
    galeSvar: number;
    lest: string[];
    bosser: string[];
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
    endreMana: (delta: number) => void;
    settHp: (value: number) => void;
    giXp: (amount: number) => void;
    giSolv: (amount: number) => void;
    leggISekk: (itemId: string) => void;
    utrust: (itemId: string) => void;
    taAv: (slot: ItemSlot) => void;
    startQuest: (questId: string) => void;
    fullforQuest: (quest: QuestDef, riktig: boolean) => void;
    kjop: (itemId: string) => boolean;
    lerSpell: (spellId: string) => void;
    markerLest: (landmarkId: string) => void;
    felleBoss: (bossId: string) => void;
    varsle: (tekst: string, art?: 'info' | 'bra' | 'darlig' | 'niva') => void;
    fjernVarsel: (id: number) => void;
    hvil: () => void;
}

const TOM_UTSTYR: Record<ItemSlot, string | null> = { vapen: null, rustning: null, amulett: null };

/** Våpenet en elev uten utrustet våpen slår med - hendene hennes, i praksis. */
const START_VAAPEN = 'ovingssverd';

const LAGRING_VERSJON = 4;

let varselId = 0;

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
    const start = character ? statsAt(character.classId, 1) : { hp: 100, mana: 40 };
    return {
        hp: start.hp,
        mana: start.mana,
        xp: 0,
        solv: 0,
        sekk: klasse ? [klasse.startWeapon] : [],
        utstyr: klasse ? { ...TOM_UTSTYR, vapen: klasse.startWeapon } : { ...TOM_UTSTYR },
        spells: klasse ? [klasse.startSpell] : [],
    };
};

const nyEpoke = (epokeId: string, character: CharacterDraft | null): EpokeSave => ({
    kapittel: 1,
    // Har epoken ikke noe sted ennå, står hun i hallen. Det er sant: da finnes
    // det ingen verden å stå i der inne.
    sisteSted: forsteStedI(epokeId) ?? START_STED,
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
    sisteSted: lagret?.sisteSted ?? forsteStedI(epokeId) ?? START_STED,
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
    },
    kapittelState: {
        hp: s.hp,
        mana: s.mana,
        xp: s.xp,
        solv: s.solv,
        sekk: s.sekk,
        utstyr: s.utstyr,
        spells: s.spells,
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
    mana: number;
    solv: number;
    sekk: string[];
    utstyr: Record<ItemSlot, string | null>;
    spells: string[];
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
    if (!state.character) return { hp: 100, mana: 40, styrke: 5, visdom: 5, vern: 3, niva: 1 };
    const niva = levelFromXp(state.xp);
    const base = statsAt(state.character.classId, niva);
    const bonus = equipmentBonus(state.utstyr);
    return {
        niva,
        hp: base.hp + bonus.hp,
        mana: base.mana + bonus.mana,
        styrke: base.styrke + bonus.styrke,
        visdom: base.visdom + bonus.visdom,
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

            endreMana: (delta) => {
                const state = get();
                const maks = maksVerdier(state).mana;
                set({ mana: Math.max(0, Math.min(maks, state.mana + delta)) });
            },

            giXp: (amount) => {
                const state = get();
                const forNiva = levelFromXp(state.xp);
                const nyXp = state.xp + amount;
                const nyttNiva = levelFromXp(nyXp);
                set({ xp: nyXp });
                if (nyttNiva > forNiva) {
                    // Nytt nivå fyller opp liv og kraft - en liten pause i kampen.
                    const maks = maksVerdier({ ...state, xp: nyXp });
                    set({ hp: maks.hp, mana: maks.mana });
                    sfx.nivaOpp();
                    get().varsle(`Nivå ${nyttNiva}! Liv og kraft fylt opp.`, 'niva');
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
                set({
                    hp: Math.max(1, Math.min(get().hp, maks.hp)),
                    mana: Math.min(get().mana, maks.mana),
                });
            },

            taAv: (slot) => {
                const state = get();
                const id = state.utstyr[slot];
                if (!id) return;
                set({ sekk: [...state.sekk, id], utstyr: { ...state.utstyr, [slot]: null } });
                const maks = maksVerdier(get());
                set({
                    hp: Math.max(1, Math.min(get().hp, maks.hp)),
                    mana: Math.min(get().mana, maks.mana),
                });
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
                    if (quest.belonning.spellId) get().lerSpell(quest.belonning.spellId);

                    // Nye besvergelser kan ha blitt låst opp av at telleren steg.
                    for (const spell of newlyUnlockedSpells(get().riktigeSvar, get().spells)) {
                        get().lerSpell(spell.id);
                    }

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

            kjop: (itemId) => {
                const item = ITEM_BY_ID[itemId];
                const state = get();
                if (!item?.pris || state.solv < item.pris) return false;
                set({ solv: state.solv - item.pris, sekk: [...state.sekk, itemId] });
                get().varsle(`Kjøpt: ${item.name}.`, 'bra');
                return true;
            },

            lerSpell: (spellId) => {
                const state = get();
                if (state.spells.includes(spellId) || !SPELL_BY_ID[spellId]) return;
                set({ spells: [...state.spells, spellId] });
                get().varsle(`Ny besvergelse: ${SPELL_BY_ID[spellId].name}`, 'niva');
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

            varsle: (tekst, art = 'info') => {
                varselId += 1;
                const id = varselId;
                set({ varsler: [...get().varsler.slice(-3), { id, tekst, art }] });
                window.setTimeout(() => get().fjernVarsel(id), 3600);
            },

            fjernVarsel: (id) => set({ varsler: get().varsler.filter((v) => v.id !== id) }),

            hvil: () => {
                const maks = maksVerdier(get());
                set({ hp: maks.hp, mana: maks.mana });
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
                                quester,
                                questForsok,
                                riktigeSvar: s.riktigeSvar ?? 0,
                                galeSvar: s.galeSvar ?? 0,
                                lest: s.lest ?? [],
                                bosser: s.bosser ?? [],
                            },
                            kapittelState: {
                                hp: s.hp ?? tomt.hp,
                                mana: s.mana ?? tomt.mana,
                                xp: s.xp ?? 0,
                                solv: s.solv ?? 0,
                                sekk: s.sekk ?? [],
                                utstyr: { ...TOM_UTSTYR, ...s.utstyr },
                                spells: s.spells ?? [],
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
                    const maks = maksVerdier(state);
                    state.hp = maks.hp;
                    state.mana = maks.mana;
                }
            },
        }
    )
);

/** XP som mangler til neste nivå, og hvor langt inn i nivået eleven er. */
export function nivaFremgang(xp: number) {
    const niva = levelFromXp(xp);
    const start = xpForLevel(niva);
    const neste = xpForLevel(niva + 1);
    const spenn = Math.max(1, neste - start);
    return { niva, inn: xp - start, spenn, andel: Math.min(1, (xp - start) / spenn) };
}
