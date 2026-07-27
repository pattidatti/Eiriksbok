import type { EnemyDef } from '../types';

// Fra 793 er fiendene folk. De har en grunn til å stå der, de slåss for alvor,
// og de kan leses: hvert varsel er langt nok til at eleven rekker å velge
// mellom å blokkere, parere eller vike - hvis hun har lært å se forskjell.
//
// Telegraferingstallene er blueprintens §5.8, og de er startverdier å justere
// *ned* fra. Én huskarl skal ta 20-30 sekunder og kreve fire til seks
// vekslinger. Går det fortere, er kampen en knappetrykker.
//
// De abstrakte formene nederst er den gamle Minnevokteren-rammen. De står
// urørt til den pensjoneres (blueprint §15) - hver etappe skal etterlate
// spillet spillbart, og bygda har ingen andre fiender før kapittel 1 er ferdig.

/**
 * Menneskene i kampanjen (§5.6).
 *
 * Hver arketype er en lærepenge, ikke en statblokk:
 *
 * | Arketype    | Telegrafering        | Hvordan den løses          | Faglig            |
 * |-------------|----------------------|----------------------------|-------------------|
 * | Spydmann    | langt stikk, langt varsel | Vik til siden, ikke bakover | Rekkevidde slår hurtighet |
 * | Øksekar     | to trinn: hak, så slag    | Ikke blokker haken. Vik.    | Skjeggøksas funksjon |
 * | Bueskytter  | sikte-linje               | Tvinger bevegelse           | Lav status, høy nytte |
 * | Huskarl     | speilbilde av deg         | Ekte duell: skjold og pust  | Yrkeskrigeren     |
 * | Berserk     | ublokkerbart, rødt varsel | Må vikes                    | Og i mellomspillet: et sagagrep |
 */
export const MENNESKER: EnemyDef[] = [
    {
        id: 'spydmann',
        kind: 'menneske',
        name: 'Spydmann',
        hp: 34,
        skade: 9,
        fart: 50,
        aggro: 220,
        // Lang rekkevidde er hele arketypen. Han når deg før du når ham, og
        // svaret er å gå til siden - ikke bakover, som er den vanlige refleksen.
        rekkevidde: 40,
        varsel: 620,
        farge: 0x6b7f5a,
        xp: 14,
        loot: [{ itemId: 'tingspyd', sjanse: 0.1 }],
        vaapenArt: 'spyd',
        haar: 1,
    },
    {
        id: 'oksekar',
        kind: 'menneske',
        name: 'Øksekar',
        hp: 42,
        skade: 12,
        fart: 56,
        aggro: 230,
        rekkevidde: 24,
        varsel: 540,
        farge: 0x8a5a3a,
        xp: 18,
        loot: [{ itemId: 'lerbrynje', sjanse: 0.12 }],
        vaapenArt: 'oks',
        harSkjold: true,
        haar: 3,
        // Skjeggøksa kroker skjoldet og river det ned. Blokkerer eleven haken,
        // mister hun skjoldet i stedet for helsa - og paraden er trygg. Det er
        // hele lærepengen: å lese varselet er ikke det samme som å gjemme seg.
        sarslag: { hvert: 3, hak: true },
    },
    {
        id: 'bueskytter',
        kind: 'menneske',
        name: 'Bueskytter',
        hp: 26,
        skade: 8,
        fart: 46,
        aggro: 300,
        rekkevidde: 180,
        varsel: 700,
        farge: 0x5a6b7f,
        xp: 16,
        skytende: true,
        loot: [{ itemId: 'jaktbue', sjanse: 0.1 }],
        vaapenArt: 'bue',
        haar: 0,
    },
    {
        id: 'huskarl',
        kind: 'menneske',
        name: 'Huskarl',
        hp: 58,
        skade: 13,
        fart: 62,
        aggro: 250,
        rekkevidde: 26,
        // Yrkeskrigeren. 380 ms er stramt nok til at hun må ha lært paraden,
        // og gavmildt nok til at den lar seg lære.
        varsel: 380,
        farge: 0x4a5568,
        xp: 30,
        loot: [
            { itemId: 'ringbrynje', sjanse: 0.08 },
            { itemId: 'sagasverd', sjanse: 0.06 },
        ],
        vaapenArt: 'sverd',
        harSkjold: true,
        haar: 2,
    },
    {
        id: 'berserk',
        kind: 'menneske',
        name: 'Berserk',
        hp: 48,
        skade: 16,
        fart: 78,
        aggro: 280,
        rekkevidde: 22,
        varsel: 300,
        farge: 0x9a3f3f,
        xp: 34,
        loot: [{ itemId: 'bjornetann', sjanse: 0.12 }],
        haar: 5,
        // Ingen gard tar imot dette. Svaret er å rulle, og det er den eneste
        // fienden i kapittelet der skjoldet ikke er svaret.
        sarslag: { hvert: 2, ublokkerbart: true },
    },
];

export const ENEMIES: EnemyDef[] = [
    ...MENNESKER,
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
