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

/**
 * De to på Lindisfarne.
 *
 * Motstanden er dempet til det kildene tillater (§16.4). Alkuin og krøniken
 * beskriver drepte munker - ikke en kongens ombudsmann med brynjekledde menn.
 * De som slåss er øyas egne folk, med det de har: spyd, økser, én gammel hjelm.
 * Kampen blir ikke dårligere av å være ujevn. Den blir mer ubehagelig, og det
 * er riktigere.
 *
 * Han som fører dem, heter «Mannen med hjelmen». Ikke fordi vi ikke fant på et
 * navn, men fordi ingen kilde ga ham et - og Mellomspill I skal kunne peke på
 * nettopp det.
 */
export const LINDISFARNE_FIENDER: EnemyDef[] = [
    {
        id: 'oyboer',
        kind: 'menneske',
        name: 'Mannen med hjelmen',
        hp: 96,
        skade: 12,
        fart: 58,
        aggro: 300,
        rekkevidde: 26,
        varsel: 480,
        farge: 0x7a6a4a,
        xp: 60,
        loot: [],
        vaapenArt: 'oks',
        harSkjold: true,
        haar: 4,
        navngitt: true,
        sarslag: { hvert: 4, hak: true },
    },
    {
        id: 'oyas-mann',
        kind: 'menneske',
        name: 'Mann fra øya',
        hp: 30,
        skade: 8,
        fart: 52,
        aggro: 260,
        rekkevidde: 34,
        varsel: 600,
        farge: 0x6f7a5f,
        xp: 12,
        loot: [],
        vaapenArt: 'spyd',
        haar: 2,
    },
    {
        id: 'oyas-okse',
        kind: 'menneske',
        name: 'Mann fra øya',
        hp: 34,
        skade: 10,
        fart: 56,
        aggro: 260,
        rekkevidde: 24,
        varsel: 560,
        farge: 0x7f6a4f,
        xp: 14,
        loot: [],
        vaapenArt: 'oks',
        haar: 1,
    },
    {
        /**
         * De som er igjen når motstanden er nede.
         *
         * De slår ikke, de løper. Alt om dem settes i `Raidet`: `stille`,
         * `flykter`, `fredelig`. Tallene her er bare det en kropp må ha for å
         * finnes - og `xp: 0` og tom loot er ikke en innstilling, det er det
         * hele avsnittet handler om.
         */
        id: 'klosterfolk',
        kind: 'menneske',
        name: 'Klosterfolk',
        hp: 18,
        skade: 0,
        fart: 64,
        aggro: 0,
        rekkevidde: 0,
        varsel: 900,
        farge: 0x8a8478,
        xp: 0,
        loot: [],
        haar: 4,
    },
];

/**
 * De som kommer over fjorden i 872.
 *
 * Gaute Gråkappe er ingen hær. Han er en mann som har lagt merke til at det
 * ikke er våpenføre menn igjen på Nordvik, og som har regnet ut at det er verdt
 * risikoen. Det er sånn det så ut: ikke plyndringstog, men naboer som utnyttet
 * et hull.
 *
 * De er navngitte og har ætt. Det er ikke pynt - §5.7 sier at eleven skal se
 * forskjellen *før* hun slår, og en mann med ætt har hevnere. Faller Gaute,
 * står Hovda-ætta igjen med en sak, og den saken må føres på tinget.
 */
export const HOVDA_MENN: EnemyDef[] = [
    {
        id: 'gaute',
        kind: 'menneske',
        name: 'Gaute Gråkappe',
        hp: 78,
        skade: 11,
        fart: 58,
        aggro: 300,
        rekkevidde: 26,
        varsel: 460,
        farge: 0x6a6a78,
        xp: 44,
        loot: [{ itemId: 'sagasverd', sjanse: 0.2 }],
        vaapenArt: 'sverd',
        harSkjold: true,
        haar: 2,
        navngitt: true,
        sarslag: { hvert: 4, hak: true },
    },
    {
        id: 'hovdamann',
        kind: 'menneske',
        name: 'Mann fra Hovda',
        hp: 36,
        skade: 9,
        fart: 52,
        aggro: 260,
        rekkevidde: 38,
        varsel: 600,
        farge: 0x7a7060,
        xp: 16,
        loot: [{ itemId: 'tingspyd', sjanse: 0.12 }],
        vaapenArt: 'spyd',
        navngitt: true,
        haar: 1,
    },
];

/**
 * Han som krever folk ut på huden, 995.
 *
 * Skjalg er en yrkeskriger i kongens følge, og han er den ene fienden i
 * kampanjen som ikke vil noe med gården. Han vil vinne en holmgang, for det er
 * det han kan - og det holdt til å ta både jord og ære fra folk som ikke kunne
 * si nei. Nettopp det misbruket er grunnen til at holmgangen ble forbudt like
 * etter år 1000.
 *
 * Tallene er huskarlens, med mer helse og et hardere varsel: han er den beste
 * eleven har møtt, og det skal merkes i hendene. `hak` hvert tredje slag er
 * ikke pynt her - det er hele grunnen til at tre skjold er en regel.
 */
export const HOLMGANGSMANN: EnemyDef = {
    id: 'skjalg',
    kind: 'menneske',
    name: 'Skjalg',
    hp: 110,
    skade: 14,
    fart: 66,
    aggro: 320,
    rekkevidde: 26,
    varsel: 360,
    farge: 0x53607a,
    xp: 0,
    loot: [],
    vaapenArt: 'sverd',
    harSkjold: true,
    haar: 3,
    navngitt: true,
    sarslag: { hvert: 3, hak: true },
};

export const ENEMIES: EnemyDef[] = [
    ...MENNESKER,
    ...LINDISFARNE_FIENDER,
    ...HOVDA_MENN,
    HOLMGANGSMANN,
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
