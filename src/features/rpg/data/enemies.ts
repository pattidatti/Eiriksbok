import type { EnemyDef } from '../types';

// Fiendene er ting som spiser kunnskap: glemsel, påstander uten kilde, rykter.
// De er skumle, men de er også en vits på egen bekostning - «Kildeløs Påstand»
// dør av å bli bedt om en kilde.

export const ENEMIES: EnemyDef[] = [
    {
        id: 'glemseltaake',
        kind: 'glemsel',
        name: 'Glemseltåke',
        hp: 26,
        skade: 6,
        fart: 42,
        aggro: 190,
        rekkevidde: 22,
        varsel: 380,
        farge: 0x6b7a8f,
        xp: 8,
        loot: [{ itemId: 'kvernstein', sjanse: 0.08 }],
        storrelse: 0.9,
    },
    {
        id: 'kildelos-paastand',
        kind: 'paastand',
        name: 'Kildeløs Påstand',
        hp: 40,
        skade: 9,
        fart: 56,
        aggro: 230,
        rekkevidde: 24,
        varsel: 320,
        farge: 0xc2603f,
        xp: 14,
        loot: [
            { itemId: 'vadmelskjortel', sjanse: 0.12 },
            { itemId: 'sagasverd', sjanse: 0.05 },
        ],
    },
    {
        id: 'anakronisme',
        kind: 'anakronisme',
        name: 'Anakronisme',
        hp: 34,
        skade: 11,
        fart: 70,
        aggro: 260,
        rekkevidde: 20,
        varsel: 260,
        farge: 0x9b59d0,
        xp: 18,
        loot: [{ itemId: 'skaldering', sjanse: 0.1 }],
        storrelse: 0.85,
    },
    {
        id: 'ryktespokelse',
        kind: 'rykte',
        name: 'Ryktespøkelse',
        hp: 30,
        skade: 8,
        fart: 48,
        aggro: 300,
        rekkevidde: 190,
        varsel: 520,
        farge: 0x4fb3a6,
        xp: 20,
        skytende: true,
        loot: [{ itemId: 'lerbrynje', sjanse: 0.1 }],
        storrelse: 0.9,
    },
    {
        id: 'vrangbilde',
        kind: 'vrangbilde',
        name: 'Vrangbilde',
        hp: 70,
        skade: 15,
        fart: 50,
        aggro: 240,
        rekkevidde: 30,
        varsel: 450,
        farge: 0xb0384f,
        xp: 32,
        loot: [
            { itemId: 'tingspyd', sjanse: 0.15 },
            { itemId: 'bjornetann', sjanse: 0.07 },
        ],
        storrelse: 1.2,
        // Vrangbildet river skjoldet ned, som et øksehak. Blokkerer eleven
        // det fjerde slaget, ryker hele skjoldet - men paraden er trygg.
        // Det er skjoldsystemets ene skarpe lærepenge: å lese varselet er
        // ikke det samme som å gjemme seg bak treet.
        sarslag: { hvert: 4, hak: true },
    },

    // ── Boss ────────────────────────────────────────────────────────────────
    {
        id: 'den-store-glemselen',
        kind: 'boss',
        name: 'Den store Glemselen',
        hp: 320,
        skade: 20,
        fart: 44,
        // Bossen våkner først når eleven kommer inn på gravhaugen. Den er
        // dessuten bundet til arenaen sin (se WorldScene), så den kan aldri
        // vandre ned i bygda og ta en fersk nivå-1-spiller.
        aggro: 200,
        rekkevidde: 42,
        varsel: 620,
        farge: 0x2f3a4d,
        xp: 160,
        loot: [{ itemId: 'minnehammer', sjanse: 1 }],
        storrelse: 2.1,
        // Hvert tredje slag er overhåndsslaget: det går gjennom garden, og
        // svaret er å rulle. Med 620 ms varsel og eget varselfarge er det
        // lesbart - og det er det som gjør bossen til en dans i stedet for
        // en utholdenhetsprøve med skjoldet oppe.
        sarslag: { hvert: 3, ublokkerbart: true },
    },
];

export const ENEMY_BY_ID: Record<string, EnemyDef> = Object.fromEntries(
    ENEMIES.map((e) => [e.id, e])
);
