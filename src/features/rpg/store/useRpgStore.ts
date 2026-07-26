// Spillerens tilstand i «Minnevokteren». Alt som skal overleve at eleven
// lukker fanen ligger her, og lagres i localStorage som de andre storene i
// appen.
//
// Storen er også broen til «Min læring»: når eleven fullfører en quest eller
// feller en boss, kalles recordActivity() slik at det teller i det vanlige
// progresjonssystemet.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProgressStore } from '../../progress/useProgressStore';
import { CLASS_BY_ID, levelFromXp, statsAt, xpForLevel } from '../data/classes';
import { ITEM_BY_ID, equipmentBonus } from '../data/items';
import { SPELL_BY_ID, newlyUnlockedSpells } from '../data/spells';
import { sfx } from '../engine/audio';
import type { CharacterDraft, ItemSlot, QuestDef } from '../types';

export interface RpgState {
    character: CharacterDraft | null;
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
    sisteSone: string;
    /** Beskjeder som HUD-en viser som «toast». */
    varsler: { id: number; tekst: string; art: 'info' | 'bra' | 'darlig' | 'niva' }[];

    lagKarakter: (draft: CharacterDraft) => void;
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

let varselId = 0;

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

export const useRpgStore = create<RpgState>()(
    persist(
        (set, get) => ({
            character: null,
            xp: 0,
            hp: 100,
            mana: 40,
            solv: 0,
            sekk: [],
            utstyr: { ...TOM_UTSTYR },
            spells: [],
            quester: {},
            questForsok: {},
            riktigeSvar: 0,
            galeSvar: 0,
            lest: [],
            bosser: [],
            sisteSone: 'nordvik',
            varsler: [],

            lagKarakter: (draft) => {
                const klasse = CLASS_BY_ID[draft.classId];
                const start = statsAt(draft.classId, 1);
                set({
                    character: draft,
                    xp: 0,
                    hp: start.hp,
                    mana: start.mana,
                    solv: 0,
                    sekk: [klasse.startWeapon],
                    utstyr: { ...TOM_UTSTYR, vapen: klasse.startWeapon },
                    spells: [klasse.startSpell],
                    quester: {},
                    questForsok: {},
                    riktigeSvar: 0,
                    galeSvar: 0,
                    lest: [],
                    bosser: [],
                    varsler: [],
                });
            },

            slettAlt: () =>
                set({
                    character: null,
                    xp: 0,
                    hp: 100,
                    mana: 40,
                    solv: 0,
                    sekk: [],
                    utstyr: { ...TOM_UTSTYR },
                    spells: [],
                    quester: {},
                    questForsok: {},
                    riktigeSvar: 0,
                    galeSvar: 0,
                    lest: [],
                    bosser: [],
                    varsler: [],
                }),

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
                set({ hp: Math.max(1, Math.min(get().hp, maks.hp)), mana: Math.min(get().mana, maks.mana) });
            },

            taAv: (slot) => {
                const state = get();
                const id = state.utstyr[slot];
                if (!id) return;
                set({ sekk: [...state.sekk, id], utstyr: { ...state.utstyr, [slot]: null } });
                const maks = maksVerdier(get());
                set({ hp: Math.max(1, Math.min(get().hp, maks.hp)), mana: Math.min(get().mana, maks.mana) });
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
                    if (forsok === 0 && quest.belonning.itemId) get().leggISekk(quest.belonning.itemId);
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
                    get().varsle('Oppdraget lukkes. Les forklaringen - den sitter neste gang.', 'darlig');
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
            version: 3,
            // Bare data lagres. Før ble hele staten - inkludert alle
            // handlingene - sendt gjennom serialiseringen.
            partialize: (state) =>
                ({
                    character: state.character,
                    xp: state.xp,
                    hp: state.hp,
                    mana: state.mana,
                    solv: state.solv,
                    sekk: state.sekk,
                    utstyr: state.utstyr,
                    spells: state.spells,
                    quester: state.quester,
                    questForsok: state.questForsok,
                    riktigeSvar: state.riktigeSvar,
                    galeSvar: state.galeSvar,
                    lest: state.lest,
                    bosser: state.bosser,
                    sisteSone: state.sisteSone,
                }) as unknown as RpgState,
            migrate: (lagret, versjon) => {
                const s = (lagret ?? {}) as Partial<RpgState>;
                const ut: Partial<RpgState> = { ...s, questForsok: s.questForsok ?? {} };

                // Bankoppdragene het før `nordvik-b<nummer>`, der nummeret var
                // plassen i en liste som ble stokket på nytt hver gang
                // quest-bank.json ble regenerert. Markeringene overlevde altså
                // ikke en build: de pekte på andre spørsmål enn dem eleven
                // faktisk hadde svart på. De kastes én gang her. Håndskrevne
                // oppdrag (`nordvik-h*`), nivå, sølv, utstyr og boss beholdes.
                if (versjon < 3) {
                    const gammel = (n: string) => /^nordvik-b\d+$/.test(n);
                    const vask = <T,>(kart: Record<string, T> | undefined) =>
                        Object.fromEntries(
                            Object.entries(kart ?? {}).filter(([n]) => !gammel(n))
                        ) as Record<string, T>;
                    ut.quester = vask(s.quester);
                    ut.questForsok = vask(ut.questForsok);
                }

                return ut as RpgState;
            },
            onRehydrateStorage: () => (state) => {
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
