// All tekst i spillet: startreglene, lappene, lærings-øyeblikkene, tap med tips og
// sluttskjermen. Tonen er alvorlig og saklig: ingen vitser, ingen tall over døde.

export const REGLER = [
    {
        ikon: 'båt',
        tekst: 'Køen går om bord der landgangen peker (← →). Hold A eller D for å fire. Tomme plasser er borte.',
    },
    { ikon: 'vann', tekst: 'Lunta over båten brenner ned. Når den er borte, tar vannet båten.' },
    {
        ikon: 'trapp',
        tekst: 'Tredje klasse står bak en stengt port. Trykk S, så løper stuerten ned og åpner den en stund.',
    },
] as const;

/** Målet, på startskjermen. */
export const MÅL = 'I 1912 ble rundt 705 reddet i livbåtene. Redd flere før skipet er borte.';

/** Lappene (maks 7 ord). */
export const LAPP = {
    fir: 'Hold D eller hold på båten',
    bytt: 'Klikk eller ← → for å bytte side',
    alvor: 'Flere skjønner at skipet synker',
    port: 'Porten er åpen - en stund',
    portStengt: 'Porten gled igjen',
    rakett: 'Nødrakett - flere skjønner at det er alvor',
    portSelv: 'Porten åpnet seg - sent',
    /** Når det femte av de 16 vanntette rommene er fullt (profilstripa). */
    rom: 'Skipet tålte bare 4 fulle rom',
    lås: 'Krengningen låser styrbord-båtene 01.50',
    sist: 'Skyv dem av før vannet kommer',
};

/** Lærings-øyeblikkene (fagkjernen, maks tre per runde). */
export const BEAT = {
    tomme: {
        tittel: 'Tomme plasser er borte',
        tekst: (n: number) =>
            `Båten gikk med ${n} tomme plasser. De kan aldri fylles igjen - men nå forstår flere at skipet synker.`,
    },
    tredje: {
        tittel: 'Tredje klasse kommer sist',
        tekst: 'De bodde lengst nede, bak en stengt port. Stuerten kan åpne den (S) en stund - mens han løper, står landgangen stille et øyeblikk.',
    },
    frist: {
        tittel: 'Lunta brenner ned',
        tekst: 'Når lunta er borte, tar vannet båten. Fir før det, også om den ikke er full.',
    },
};

/** Tap: hvorfor du ikke slo 1912, og et tips. */
export const TAP = {
    tomme: {
        tittel: 'For mange tomme plasser',
        tips: 'Båtene gikk før folk rakk å komme. Fir de første tidlig, så flere skjønner at det er alvor. Send stuerten til porten når køen er kort.',
    },
    tapt: {
        tittel: 'Vannet tok båtene',
        tips: 'Fir båten før lunta er brent ned, også om den ikke er full. Når skipet krenger mot en side, kommer vannet fortere der - lunta blir kortere. På den høye siden går firingen tregere.',
    },
};

/** Ett konkret tips med tall fra runden (tapsskjermen). */
export const TIPS_TALL = {
    tomme: (navn: string, folk: number, plasser: number, igjen: number) =>
        `${navn} gikk med ${folk} av ${plasser}, og lunta hadde ${igjen} sekunder igjen. Vent til køen har fylt båten - fir først når lunta blir kort.`,
    tapt: (navn: string, folk: number, plasser: number, lås: boolean) =>
        `${navn} hang med ${folk} av ${plasser} da ${lås ? 'krengningen låste den' : 'vannet tok den'}. Fir før lunta er brent ned, også om båten ikke er full.`,
};

/** Hvorfor en båt gikk tapt (vises i lista på sluttskjermen). */
export const TAPT_ÅRSAK = {
    vann: 'vannet tok den',
    lås: 'krengningen låste den mot skroget',
};

export const SOLAS =
    'Selv med hver plass brukt var det ikke plass til over 1000 av dem om bord. Etter Titanic ble det en regel at livbåtene skal ha plass til alle (SOLAS, 1914).';

export const I1912 = { reddet: 705, tomme: 472 };

/** Granskningen 1912 (British Wreck Commissioner): reddet av passasjerene i hver klasse. */
export const KLASSER_1912 = [
    { navn: '1. klasse', reddet: 202, av: 322 },
    { navn: '2. klasse', reddet: 115, av: 277 },
    { navn: '3. klasse', reddet: 176, av: 709 },
];

/** «Dette skjedde»: knyttet til det eleven gjorde i runden. */
export const LÆRDOM = {
    alvor: 'Da de første båtene gikk, kom flere opp på dekket. I 1912 ville mange ikke gå i de første båtene - skipet virket tryggere.',
    tomme: (n: number) => `${n} plasser sto tomme i båtene dine. I 1912 var det 472.`,
    tredje: (n: number, port: string, turer: number) =>
        `Porten til tredje klasse åpnet ${turer ? `seg første gang da stuerten kom ned (${turer} ${turer === 1 ? 'tur' : 'turer'})` : 'seg av seg selv'} klokka ${port}. ${n} av 709 fra tredje klasse fikk plass i båtene dine. I 1912 var det 176.`,
    tapt: (n: number, p: number) =>
        `Vannet og krengningen tok ${n} ${n === 1 ? 'båt' : 'båter'} med ${p} plasser. Den siste båten fra Titanic gikk klokka 02.05.`,
    carpathia:
        'Redningsskipet Carpathia kom klokka 04.10, halvannen time etter at Titanic sank. Bare de som satt i båtene, ble reddet.',
    rom: 'Titanic hadde 16 vanntette rom. Isfjellet åpnet de 5 første, og skipet tålte bare 4 fulle. Veggene mellom rommene gikk ikke helt opp, så vannet rant over fra rom til rom.',
    /** Neste rangtrinn - for «én natt til». */
    neste: (grense: number, navn: string, mangler: number) =>
        `Neste trinn: over ${grense} reddet («${navn}»). Du manglet ${mangler}.`,
};

/** Pausemeldinger (saklige fakta). */
export const PAUSE = [
    'Titanic hadde 20 livbåter med plass til 1178. Om bord var rundt 2200.',
    'Den første livbåten hadde plass til 65. Bare 28 satt i den.',
    'En båt med plass til 40 fikk med seg bare 12.',
    'Det gikk 2 timer og 40 minutter fra isfjellet til skipet sank.',
];
