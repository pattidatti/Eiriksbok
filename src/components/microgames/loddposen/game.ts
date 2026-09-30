import { seeded, type Rng } from '../sim';

// LODDPOSEN - spillreglene (rene, uten React og uten tegning).
//
// Firenze 1434-1492. Byen trekker lodd om vervene. Du holder hånda i loddposen mens
// rådsherrene ser bort, og Medici-lappene faller ned én etter én. Jo lenger du tør, jo mer.
//
// De tre reglene eleven skal sitte igjen med:
//   1. Hånda inn når alle ser bort, ut når noen kremter (sett med hånda i posen = tatt).
//   2. 3 av 5 vinner: trekker Signoria minst tre venner av fem lapper, styrer Medici.
//      En vunnet trekning betaler renter for hver venn i posen utover to, så det lønner
//      seg å tørre én lapp til. En tapt trekning koster mer for hvert år. Tom kiste = tapt.
//   3. Kjenn gjestene: hver har et forvarsel før han ser. Albizzi løfter lua før et ekte kremt
//      (et kremt uten lueløft er falskt), Pazzi rykker med hodet (fra 1478 tre rykk og ikke
//      noe kremt), og pavens mann ser aldri mot posen. Albizzi og Pazzi kremter så kort at
//      den som bare venter på kremtet, ofte er for sen.
//
// En runde er åtte trekninger. Hver trekning: SMUGLE_S sekunder smugling, så TREKK_S sekunder
// trekning. Mellom trekningene (fra 1444) kommer valget: banken sender florin fra filialene,
// og to store kort ligger på bordet - «Bestikk» (+2 røde lodd i posen) eller «Bestill maleri»
// (en navngitt fiende blir beundrer og ser på maleriet i studioloen i to trekninger). Klokka
// i runden står stille til du har valgt. Kortene blir dyrere når banken faller. Noen
// trekninger er hendelser: pavens mann sitter ved bordet i 1454 og 1485 (han ser aldri på
// posen, og paven betaler litt for hver lapp), og i 1478 ser Pazzi og Salviati samtidig.

// ---------- Tall ----------
export const W = 1000;
export const H = 700;
export const BAG = { x: 500, y: 330, r: 58 };
/** Studioloen: skapet med kunstverkene nede til venstre. Beundrerne ser dit, ikke på posen. */
export const STUDIOLO = { x: 206, y: 588, w: 196, h: 106 };
const STUDIOLO_MIDT = { x: STUDIOLO.x + STUDIOLO.w / 2, y: STUDIOLO.y + STUDIOLO.h / 2 };

export const TREKNINGER = 8;
export const SMUGLE_S = 10;
export const TREKK_S = 2.6;
/**
 * Valget mellom trekningene: to kort på bordet, pengene fra banken kommer inn. Klokka i
 * runden står stille til du har valgt. GAVE_S er hvor lenge en elev vanligvis bruker.
 */
export const GAVE_S = 4;
/** Kortene legges på bordet: så lenge før de kan velges. */
export const KORT_INN_S = 0.9;
/** Det valgte kortet blir liggende så lenge (lappene flyr, maleriet henges opp). */
export const VALGT_S = 0.8;
/** Velger du ikke i det hele tatt, spares gullet etter så lang tid. */
export const GAVE_MAKS = 20;
export const RUN_SECONDS = TREKNINGER * (SMUGLE_S + TREKK_S) + (TREKNINGER - 1) * GAVE_S;

export const ÅR = [1434, 1444, 1454, 1464, 1469, 1478, 1485, 1492];
/** Antall rådsherrer rundt bordet i hver trekning (gonfalonieren kommer i tillegg). */
const RÅD = [3, 3, 3, 4, 4, 4, 4, 4];
/** Fiendelapper rivalene legger i posen ved starten av hver trekning (1434 er øvingsrunden). */
const FIENDER = [3, 5, 5, 5, 5, 5, 5, 6];
/** Så mange lapper trekkes, og så mange venner må til for å vinne. */
export const TREKKES = 5;
export const MÅ_HA = 3;
/** Aldri færre lapper i posen enn dem som trekkes. */
export const MIN_LAPPER = TREKKES;
/** Pazzi sitter ved bordet fra trekning 4 (indeks 3). */
const PAZZI_FRA = 3;
/** 1469: Lorenzo tar over, banken tjener halvparten. */
const LORENZO_FRA = 4;
/** 1478: Pazzi-rystelsen, alle er mistenksomme. Pazzi kremter ikke lenger. */
export const RYSTELSE = 5;
/** Fra 1478 ser Pazzi tilbake uten varsel så mange sekunder etter at han så bort. */
export const PAZZI_STILLE_S = 3;
/** Pavens utsending sitter ved bordet i disse trekningene (1454 og 1485). */
export const UTSENDING_I = [2, 6];
/** Florin fra pavens konto for hver lapp du slipper mens utsendingen følger med. */
export const PAVE_BONUS = 5;
/** Kortene: grunnpris når banken tjener fullt (40 florin), dyrere når den faller. */
export const BESTIKK_PRIS = 45;
export const BESTIKK_LAPPER = 2;
export const MALERI_PRIS = 120;
export const MALERI_TREKNINGER = 2;

/** Grådig hånd: første lapp faller etter FØRSTE_S, så én hvert NESTE_S så lenge hånda er inne. */
export const FØRSTE_S = 0.5;
export const NESTE_S = 0.3;
/** Fiske: hold hånda over en fiendelapp så lenge, så er den ute. */
export const FISK_S = 0.6;
/** Kremtet: så lang tid har du på å dra hånda ut før blikket treffer. */
export const VARSEL_S = 0.4;
/** Sakte film når et blikk begynner å snu seg mens hånda er i posen. */
const FRYS_S = 0.25;
/** Korteste bortblikk (sekunder, delt på farten); det lengste er dobbelt så langt. */
const BORT_MIN = 5;
/** Hvor ofte Albizzi kremter falskt. */
const ALBIZZI_FALSK = 0.4;
/** Albizzi kremter falskt fra 1444 (1434 er øvingsrunden). */
export const ALBIZZI_FRA = 1;
/** Nesten tatt: dro du hånda ut under et ekte kremt, stiger multiplikatoren. */
const MULT_NESTEN = 0.25;
/** Albizzi og Pazzi kremter kortere enn de andre: den som kjenner forvarselet, er ute før. */
export const VARSEL_KORT = 0.15;
/** Forvarsel: Albizzi løfter lua så lenge før et ekte kremt (aldri før et falskt). */
export const LUA_S = 0.7;
/** Forvarsel: Pazzi (før 1478) rykker med hodet så lenge før han snur seg mot posen. */
export const RYKK_S = 0.6;

export const KISTE_START = 150;
/** Kista rommer ikke mer: gull over dette er bortkastet, så det lønner seg å bruke det. */
export const KISTE_MAKS = 500;
/**
 * Medici-banken: filialene sender florin til kista i hver gavefase. Roma (pavens konto) tjente
 * mest. Fra 1469 taper London penger, fra 1478 også Brugge - banken svikter.
 */
export interface Filial {
    navn: string;
    florin: number;
    /** Fra denne trekningen gir filialen ingenting (tap). */
    taperFra: number;
}
export const FILIALER: Filial[] = [
    { navn: 'Roma', florin: 16, taperFra: 99 },
    { navn: 'Venezia', florin: 8, taperFra: 99 },
    { navn: 'Brugge', florin: 8, taperFra: 5 },
    { navn: 'London', florin: 8, taperFra: 4 },
];
export const LAPP_PRIS = 15;
/** Tapt trekning koster mer for hvert år som går. */
const TAP_GRUNN = 50;
const TAP_ØKER = 10;
/** Vunnet trekning: renter per venn i posen utover to (halvparten fra 1469). Multiplikatoren gjelder bare poeng. */
export const RENTE_PER_VENN = 40;
/** Renter betales for høyst så mange venner utover to (seks venner i posen gir mest). */
export const RENTE_TAK = 4;
/** Multiplikatoren: +0,25 per lapp etter den andre i samme dukk. */
const MULT_PER_LAPP = 0.25;
/** Poeng for hver vunnet trekning, uansett multiplikator: det lønner seg å holde ut. */
const VUNNET_POENG = 60;
const MULT_MAKS = 5;

export interface Kunst {
    navn: string;
}

/** Kunstverkene i studiolo-skapet, i den rekkefølgen maleri-kortet bestiller dem. */
export const KUNST: Kunst[] = [
    { navn: 'Bøker til biblioteket' },
    { navn: 'Brunelleschis kirke' },
    { navn: 'Donatellos statue' },
    { navn: 'Ficinos Platon-skole' },
    { navn: 'Botticellis maleri' },
    { navn: 'Unge Michelangelo i huset' },
];

export const RANGER: [number, string][] = [
    [0, 'Skriver'],
    [250, 'Notar'],
    [600, 'Prior'],
    [1000, 'Gonfaloniere'],
    [1700, 'Il Magnifico'],
    [2200, 'Pater Patriae'],
];

// ---------- Tilstand ----------
export type Blikk = 'bort' | 'varsel' | 'ser';
export type Slag = 'råd' | 'pazzi' | 'gonf' | 'albizzi' | 'utsending' | 'salviati';

export interface Rådsherre {
    id: number;
    slag: Slag;
    /** Plassen ved bordet. */
    x: number;
    y: number;
    blikk: Blikk;
    /** Sekunder igjen i nåværende blikk. */
    t: number;
    /** Sekunder siden han så bort (Pazzi snur seg tilbake - vent litt). */
    siden: number;
    /** Pazzi: er dette bortblikket bare et lureblikk? */
    lur: boolean;
    /** Albizzi: er dette kremtet falskt (hodet snur seg ikke, blikket tennes ikke)? */
    falsk: boolean;
    /** Vinkelen blikket peker nå (tegning). */
    vinkel: number;
    bortVinkel: number;
    /** Trekninger igjen som beundrer (ser på kunsten, ikke på posen). */
    beundrer: number;
    /** Hvor mange sekunder han har sett på posen denne trekningen. */
    sett: number;
    /** Pazzi fra 1478: hvor mange rykk hodet har tatt mot posen (0-2). */
    rykk: number;
}

export type Handling = 'slipp' | 'fisk';
export type Cause = 'tatt' | 'tom';
export type Fase = 'gave' | 'smugle' | 'trekning';

export interface Hendelse {
    k:
        | 'slapp'
        | 'fisket'
        | 'nesten'
        | 'tatt'
        | 'varsel'
        | 'trekning'
        | 'lapp'
        | 'vant'
        | 'tapte'
        | 'ren'
        | 'kunst'
        | 'kort'
        | 'pater'
        | 'tom'
        | 'banken'
        | 'bank'
        | 'rykk'
        | 'bestikk'
        | 'pave';
    tekst?: string;
    x?: number;
    y?: number;
}

export interface Hånd {
    act: Handling | null;
    /** Sekunder hånda har vært i posen. */
    t: number;
    /** Sekunder til neste lapp faller (eller neste fiendelapp er fisket opp). */
    neste: number;
    /** Lapper sluppet i denne dukken. */
    dukk: number;
    varslet: boolean;
}
const tomHånd = (): Hånd => ({ act: null, t: 0, neste: 0, dukk: 0, varslet: false });

export type KortValg = 'bestikk' | 'maleri';

/** Valget mellom trekningene: to store kort med pris og virkning skrevet på. */
export interface Kort {
    /** Pris for «Bestikk: +2 røde lodd». */
    bestikk: number;
    /** Pris for «Bestill maleri». */
    maleri: number;
    /** Kunstverket maleri-kortet bestiller. */
    kunst: Kunst;
    /** Rådsherren som blir beundrer (null: ingen kan tas med kunst nå). */
    mål: number | null;
}

export interface G {
    rng: Rng;
    t: number;
    trekning: number; // 0-7
    fase: Fase;
    faseT: number;
    rådsherrer: Rådsherre[];
    venner: number;
    fiender: number;
    kiste: number;
    hånd: Hånd;
    frys: number;
    kort: Kort | null;
    /** Kortet du valgte: det blir liggende et øyeblikk mens det virker (null: ikke valgt ennå). */
    valgt: KortValg | 'spar' | null;
    valgtT: number;
    /** Resultatet av trekningen som vises nå: venn (true) eller fiende per lapp. */
    trukket: boolean[];
    gonfNeste: boolean;
    mult: number;
    /** Hva forrige trekning ga (renter) eller kostet (tap) i florin. */
    sisteRente: number;
    poeng: number;
    vunnet: number;
    rene: number;
    nesten: number;
    kunstKjøpt: string[];
    pater: boolean;
    valg: number;
    fri: boolean;
    ended: null | 'vunnet' | 'tapt';
    cause: Cause | null;
    /** Hvem som så hånda i posen (til tipset på tapsskjermen). */
    tattAv: Slag | null;
    /** Florin fra pavens konto denne runden. */
    pave: number;
    bestikkelser: number;
    events: Hendelse[];
    nextId: number;
}

// ---------- Hjelpere ----------
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const år = (g: G) => ÅR[g.trekning];
export const aktiv = (r: Rådsherre) => r.beundrer <= 0;
export const bankenSvikter = (g: G) => g.trekning >= LORENZO_FRA;
/** Filialer som tjener penger i denne trekningen. */
export const filialOk = (g: G, f: Filial) => g.trekning < f.taperFra;
/** Florin banken sender til kista i gavefasen. */
export const bank = (g: G) => FILIALER.reduce((s, f) => s + (filialOk(g, f) ? f.florin : 0), 0);
/** Tapet i denne trekningen: 50 florin i 1434, 10 mer for hver trekning. */
export const tapPris = (g: G) => tapPrisI(g.trekning);
export const tapPrisI = (trekning: number) => TAP_GRUNN + TAP_ØKER * trekning;
/** Rentene en seier gir med `venner` Medici-lapper i posen. */
export function renter(g: G, venner = g.venner) {
    const per = bankenSvikter(g) ? RENTE_PER_VENN / 2 : RENTE_PER_VENN;
    return Math.round(per * clamp(venner - (MÅ_HA - 1), 0, RENTE_TAK));
}
/** Fra 1478 kremter ikke Pazzi (eller Salviati ved siden av ham), og kunst virker ikke på dem. */
export const stillePazzi = (g: G, r: Rådsherre) =>
    r.slag === 'salviati' || (r.slag === 'pazzi' && g.trekning >= RYSTELSE);
/** Sitter pavens utsending ved bordet i denne trekningen? */
export const utsendingHer = (g: G) => UTSENDING_I.includes(g.trekning);
/** Kortene blir dyrere når banken tjener mindre: grunnpris x 40 / bankinntekt, rundet til 5. */
export const kortPris = (g: G, grunn: number) => Math.round((grunn * 40) / Math.max(1, bank(g)) / 5) * 5;
export const lapper = (g: G) => g.venner + g.fiender;
/** Den stille Pazzi snur hodet i tre rykk: 0, 1, 2 (og så ser han). */
export const PAZZI_RYKK = 3;
export const pazziRykk = (r: Rådsherre) => Math.min(PAZZI_RYKK - 1, Math.floor((r.siden / PAZZI_STILLE_S) * PAZZI_RYKK));
/**
 * Forvarselet før et blikk - det eleven lærer å se etter hos hver gjest:
 * Albizzi løfter lua før et ekte kremt (et falskt kremt kommer uten lueløft), og Pazzi
 * (før 1478) rykker med hodet før han snur seg. Pavens mann ser aldri mot posen.
 */
export function luaOppe(r: Rådsherre) {
    if (r.slag !== 'albizzi' || !aktiv(r) || r.falsk) return false;
    return r.blikk === 'varsel' || r.blikk === 'ser' || (r.blikk === 'bort' && r.t < LUA_S);
}
export function hodeRykk(g: G, r: Rådsherre) {
    return r.slag === 'pazzi' && aktiv(r) && !stillePazzi(g, r) && r.blikk === 'bort' && r.t < RYKK_S;
}
export const forvarsel = (g: G, r: Rådsherre) => (luaOppe(r) && r.blikk === 'bort') || hodeRykk(g, r);

/** Et ekte varsel: kremt som ikke er falskt, eller Pazzi på siste rykk. */
export function ekteFare(g: G, r: Rådsherre) {
    if (!aktiv(r)) return false;
    if (r.blikk === 'varsel') return !r.falsk;
    if (r.blikk === 'ser') return true;
    return stillePazzi(g, r) && pazziRykk(r) >= PAZZI_RYKK - 1;
}

/** Hvor fort blikkene går i denne trekningen (1 = rolig). */
export function fart(g: G) {
    // Rundt 10 % kortere bortblikk for hver trekning, og ekstra mistenksomt i 1478.
    let f = 1 + 0.045 * g.trekning;
    if (g.trekning === RYSTELSE) f *= 1.15;
    return f;
}
function velg(n: number, k: number) {
    if (k < 0 || k > n) return 0;
    let r = 1;
    for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
    return r;
}

/** Sjansen for at minst tre av fem trukne lapper er venner (hypergeometrisk). */
export function odds(venner: number, fiender: number) {
    const n = venner + fiender;
    if (n < TREKKES) return venner >= MÅ_HA ? 1 : 0;
    let p = 0;
    for (let k = MÅ_HA; k <= TREKKES; k++) p += velg(venner, k) * velg(fiender, TREKKES - k);
    return p / velg(n, TREKKES);
}

function seat(i: number, n: number) {
    // Rådsherrene sitter rundt bordets øvre del og sidene; eleven sitter nederst.
    const a0 = Math.PI * 1.08;
    const a1 = Math.PI * 1.92;
    const a = n === 1 ? Math.PI * 1.5 : lerp(a0, a1, i / (n - 1));
    return { x: BAG.x + Math.cos(a) * 400, y: BAG.y + Math.sin(a) * 250 + 20 };
}

function nyBort(g: G, r: Rådsherre) {
    const f = fart(g);
    r.blikk = 'bort';
    r.siden = 0;
    r.falsk = false;
    if (r.slag === 'gonf') r.t = (2.4 + g.rng() * 2.4) / f;
    else if (stillePazzi(g, r)) {
        // Etter Pazzi-sammensvergelsen: ser tilbake uten å kremte, alltid etter like lang tid.
        r.lur = false;
        r.t = PAZZI_STILLE_S;
    } else if (r.slag === 'pazzi' && g.rng() < 0.5) {
        // Lureblikket: ser bort et øyeblikk og snur seg tilbake.
        r.lur = true;
        r.t = 0.55 + g.rng() * 0.35;
    } else {
        r.lur = false;
        r.t = (BORT_MIN + g.rng() * BORT_MIN) / f;
        // Pavens utsending er rolig: han ser sjelden på posen.
        if (r.slag === 'utsending') r.t = 1.6 + g.rng() * 2;
        // Albizzi kremter av og til falskt for å skremme deg - hodet hans snur seg ikke.
        if (r.slag === 'albizzi' && g.trekning >= ALBIZZI_FRA && g.rng() < ALBIZZI_FALSK) {
            r.falsk = true;
            r.t *= 0.5;
        }
    }
    r.bortVinkel = Math.atan2(BAG.y - r.y, BAG.x - r.x) + (g.rng() < 0.5 ? -1 : 1) * (0.9 + g.rng() * 0.8);
}

function lagRådsherrer(g: G) {
    // Gjestene: faste plasser først, så hendelsesgjestene (utsending, Salviati) og til sist
    // Albizzis gonfaloniere etter et tap.
    const ekstra: Slag[] = [];
    if (utsendingHer(g)) ekstra.push('utsending');
    if (g.trekning === RYSTELSE) ekstra.push('salviati');
    if (g.gonfNeste) ekstra.push('gonf');
    const fast = RÅD[g.trekning];
    const n = fast + ekstra.length;
    const gamle = g.rådsherrer;
    const liste: Rådsherre[] = [];
    for (let i = 0; i < n; i++) {
        const p = seat(i, n);
        const slag: Slag =
            i >= fast ? ekstra[i - fast] : g.trekning >= PAZZI_FRA && i === 0 ? 'pazzi' : i === 1 ? 'albizzi' : 'råd';
        // Beundrere beholder sin plass i rekka (samme id) fra forrige trekning.
        const gammel = gamle[i] && gamle[i].slag === slag && slag !== 'gonf' ? gamle[i] : null;
        const r: Rådsherre = {
            id: gammel ? gammel.id : g.nextId++,
            slag,
            x: p.x,
            y: p.y,
            blikk: 'bort',
            t: 0,
            siden: 0,
            lur: false,
            falsk: false,
            vinkel: 0,
            bortVinkel: 0,
            beundrer: gammel ? Math.max(0, gammel.beundrer) : 0,
            sett: 0,
            rykk: 0,
        };
        if (stillePazzi(g, r)) r.beundrer = 0;
        nyBort(g, r);
        r.t *= 0.5 + g.rng() * 0.8;
        // Pazzis stille blikk skal alltid komme etter like lang tid, også det første.
        if (stillePazzi(g, r)) r.siden = PAZZI_STILLE_S - r.t;
        r.vinkel = r.bortVinkel;
        liste.push(r);
    }
    g.rådsherrer = liste;
    g.gonfNeste = false;
}

/**
 * Hvem maleriet gjør til beundrer: den farligste fienden som kunst virker på. Pazzi (før 1478)
 * ser i rykk, Albizzi kremter falskt, og så de andre rådsherrene. Albizzis gonfaloniere og den
 * stille Pazzi fra 1478 lar seg ikke kjøpe.
 */
export function maleriMål(g: G): Rådsherre | null {
    const rang = (r: Rådsherre) => (r.slag === 'pazzi' ? 3 : r.slag === 'albizzi' ? 2 : r.slag === 'utsending' ? 0 : 1);
    const kand = g.rådsherrer.filter((r) => aktiv(r) && r.slag !== 'gonf' && r.slag !== 'utsending' && !stillePazzi(g, r));
    if (!kand.length) return null;
    return kand.reduce((a, b) => (rang(b) > rang(a) ? b : a));
}

function lagKort(g: G): Kort {
    const mål = maleriMål(g);
    return {
        bestikk: kortPris(g, BESTIKK_PRIS),
        maleri: kortPris(g, MALERI_PRIS),
        kunst: KUNST[(g.trekning - 1) % KUNST.length],
        mål: mål ? mål.id : null,
    };
}

function startTrekning(g: G) {
    g.venner = 0;
    g.fiender = FIENDER[g.trekning];
    g.trukket = [];
    if (g.trekning === LORENZO_FRA) g.events.push({ k: 'banken', tekst: 'Banken svikter: rentene halveres' });
    lagRådsherrer(g);
    if (g.trekning === 0) {
        // Første trekning: rett inn i smuglingen, ingen gave.
        g.fase = 'smugle';
        g.faseT = SMUGLE_S;
        g.kort = null;
    } else {
        // Gavefasen: banken sender penger fra filialene, og gavekortet ligger på bordet.
        g.fase = 'gave';
        g.faseT = 0;
        const b = bank(g);
        g.kiste = Math.min(KISTE_MAKS, g.kiste + b);
        g.events.push({ k: 'bank', tekst: `+${b}` });
        g.kort = lagKort(g);
        g.valg += 1;
    }
    g.events.push({ k: 'kort' });
}

export function newGame(seed: number): G {
    const g: G = {
        rng: seeded(seed),
        t: 0,
        trekning: 0,
        fase: 'smugle',
        faseT: SMUGLE_S,
        rådsherrer: [],
        venner: 0,
        fiender: 0,
        kiste: KISTE_START,
        hånd: tomHånd(),
        frys: 0,
        kort: null,
        valgt: null,
        valgtT: 0,
        trukket: [],
        gonfNeste: false,
        mult: 1,
        sisteRente: 0,
        poeng: 0,
        vunnet: 0,
        rene: 0,
        nesten: 0,
        kunstKjøpt: [],
        pater: false,
        valg: 0,
        fri: false,
        ended: null,
        cause: null,
        tattAv: null,
        pave: 0,
        bestikkelser: 0,
        events: [],
        nextId: 1,
    };
    startTrekning(g);
    return g;
}

// ---------- Grepene (samme for eleven og robotene) ----------

/**
 * Stikk hånda i posen og hold den der. Slipp: første Medici-lapp faller etter 0,5 s, så én
 * hvert 0,3 s (hver koster florin). Fisk: én fiendelapp opp hvert 0,6 s. Hånda er inne til
 * `trekkUt`.
 */
export function begynn(g: G, act: Handling) {
    if (g.ended || g.fase !== 'smugle' || g.hånd.act) return false;
    if (act === 'slipp' && g.kiste < LAPP_PRIS) return false;
    if (act === 'fisk' && (g.fiender <= 0 || lapper(g) <= MIN_LAPPER)) return false;
    g.hånd = { act, t: 0, neste: act === 'slipp' ? FØRSTE_S : FISK_S, dukk: 0, varslet: false };
    // Stakk du hånda i posen mens noen ser rett på den? Da er du tatt med én gang.
    sjekkTatt(g);
    return true;
}

/** Dra hånda ut av posen før blikket treffer. */
export function trekkUt(g: G) {
    if (!g.hånd.act) return false;
    const truet = g.rådsherrer.some((r) => ekteFare(g, r));
    if (truet) {
        // Nesten tatt: ute i siste liten. Poengene ganges mer.
        g.nesten += 1;
        g.mult = Math.min(MULT_MAKS, g.mult + MULT_NESTEN);
        g.events.push({ k: 'nesten', x: BAG.x, y: BAG.y - 80 });
    }
    g.hånd = tomHånd();
    return true;
}

/** Ligger kortene ferdig på bordet, så de kan velges? */
export const kortKlar = (g: G) => !!g.kort && !g.valgt && g.fase === 'gave' && g.faseT >= KORT_INN_S;

/** Har kista råd til kortet (og virker det nå)? */
export function kanVelge(g: G, v: KortValg) {
    const k = g.kort;
    if (!k || g.ended) return false;
    if (v === 'maleri' && k.mål === null) return false;
    return g.kiste >= k[v];
}

/**
 * Legg et kort på bordet. Bestikk: to Medici-lapper rett i posen. Bestill maleri: fienden på
 * kortet blir beundrer og ser på kunsten i stedet for posen i to trekninger.
 */
export function velgKort(g: G, v: KortValg) {
    const k = g.kort;
    if (!k || !kortKlar(g) || !kanVelge(g, v)) return false;
    g.kiste -= k[v];
    if (v === 'bestikk') {
        g.venner += BESTIKK_LAPPER;
        g.bestikkelser += 1;
        g.events.push({ k: 'bestikk', tekst: `-${k.bestikk}`, x: BAG.x, y: BAG.y });
    } else {
        const r = g.rådsherrer.find((q) => q.id === k.mål);
        if (r) {
            r.beundrer = Math.max(r.beundrer, MALERI_TREKNINGER);
            r.blikk = 'bort';
            r.falsk = false;
            if (!g.kunstKjøpt.includes(k.kunst.navn)) g.kunstKjøpt.push(k.kunst.navn);
            g.events.push({ k: 'kunst', tekst: k.kunst.navn, x: r.x, y: r.y });
        }
    }
    g.valgt = v;
    g.valgtT = VALGT_S;
    return true;
}

/** Spar gullet: ingen av kortene. */
export function spar(g: G) {
    if (!kortKlar(g)) return false;
    g.valgt = 'spar';
    g.valgtT = VALGT_S;
    return true;
}

// ---------- Oppdatering ----------

function sjekkTatt(g: G) {
    if (!g.hånd.act || g.ended) return;
    const seer = g.rådsherrer.find((r) => aktiv(r) && r.blikk === 'ser');
    if (seer) {
        g.tattAv = seer.slag;
        g.events.push({ k: 'tatt', x: seer.x, y: seer.y });
        slutt(g, 'tatt');
    }
}

function slutt(g: G, cause: Cause | null) {
    g.ended = cause ? 'tapt' : 'vunnet';
    g.cause = cause;
    g.hånd = tomHånd();
}

function oppdaterBlikk(g: G, dt: number) {
    const f = fart(g);
    const pazzi = g.rådsherrer.find((q) => q.slag === 'pazzi');
    for (const r of g.rådsherrer) {
        const mot = Math.atan2(BAG.y - r.y, BAG.x - r.x);
        if (r.slag === 'salviati' && pazzi) {
            // 1478: Salviati er Pazzis mann. De ser bort og tilbake i nøyaktig samme øyeblikk.
            r.blikk = pazzi.blikk;
            r.t = pazzi.t;
            r.siden = pazzi.siden;
            r.rykk = pazzi.rykk;
            if (r.blikk === 'ser') r.sett += dt;
            const m = r.blikk === 'ser' ? mot : lerp(r.bortVinkel, mot, r.blikk === 'bort' ? r.rykk / PAZZI_RYKK : 0.6);
            r.vinkel += (m - r.vinkel) * Math.min(1, dt * (r.blikk === 'ser' ? 14 : 22));
            continue;
        }
        if (!aktiv(r)) {
            // Beundreren ser på maleriet i studioloen, aldri på posen.
            r.blikk = 'bort';
            const kunst = Math.atan2(STUDIOLO_MIDT.y - r.y, STUDIOLO_MIDT.x - r.x);
            const d = Math.atan2(Math.sin(kunst - r.vinkel), Math.cos(kunst - r.vinkel));
            r.vinkel += d * Math.min(1, dt * 4);
            continue;
        }
        r.t -= dt;
        if (r.blikk === 'bort') r.siden += dt;
        if (r.blikk === 'ser') r.sett += dt;
        if (r.t <= 0) {
            if (r.slag === 'utsending') {
                // Pavens mann ser seg rundt i rommet, men aldri mot posen.
                nyBort(g, r);
            } else if (r.blikk === 'bort' && stillePazzi(g, r)) {
                // Ingen kremt: rett på posen.
                r.blikk = 'ser';
                r.t = (0.5 + g.rng() * 0.5) / f;
            } else if (r.blikk === 'bort') {
                r.blikk = 'varsel';
                // Albizzi og Pazzi kremter kort - men de viser forvarselet sitt først (lua, rykket).
                const kort = r.slag === 'albizzi' || r.slag === 'pazzi';
                r.t = r.falsk ? VARSEL_S * 2.5 : kort ? VARSEL_KORT : VARSEL_S;
                if (g.hånd.act && !g.hånd.varslet && !r.falsk) {
                    // Nesten tatt: alt fryser i sakte film et lite øyeblikk.
                    g.hånd.varslet = true;
                    g.frys = FRYS_S;
                    g.valg += 1;
                }
                g.events.push({ k: 'varsel', x: r.x, y: r.y });
            } else if (r.blikk === 'varsel' && r.falsk) {
                // Falskt kremt: han ser aldri på posen, bare bort igjen.
                nyBort(g, r);
            } else if (r.blikk === 'varsel') {
                r.blikk = 'ser';
                r.t = r.slag === 'gonf' ? (0.8 + g.rng() * 0.4) / f : (0.5 + g.rng() * 0.5) / f;
            } else nyBort(g, r);
        }
        // Den stille Pazzi snur hodet mot posen i tre rykk. På det tredje ser han.
        const stille = stillePazzi(g, r) && r.blikk === 'bort';
        if (stille) {
            const før = r.rykk;
            r.rykk = pazziRykk(r);
            if (r.rykk > før) g.events.push({ k: 'rykk', x: r.x, y: r.y });
        } else r.rykk = 0;
        const sveip = stille ? r.rykk / PAZZI_RYKK : 0;
        const mål =
            r.blikk === 'ser'
                ? mot
                : r.blikk === 'varsel' && !r.falsk
                  ? lerp(r.bortVinkel, mot, 0.6)
                  : lerp(r.bortVinkel, mot, sveip);
        r.vinkel += (mål - r.vinkel) * Math.min(1, dt * (r.blikk === 'ser' ? 14 : stille ? 22 : r.blikk === 'varsel' ? 12 : 6));
    }
}

function trekk(g: G) {
    // Fem lapper trekkes uten tilbakelegging. Rivalene fyller opp så posen aldri har færre.
    if (lapper(g) < MIN_LAPPER) g.fiender = MIN_LAPPER - g.venner;
    let v = g.venner;
    let f = g.fiender;
    const res: boolean[] = [];
    for (let i = 0; i < TREKKES; i++) {
        const n = v + f;
        if (n <= 0) {
            res.push(false);
            continue;
        }
        const venn = g.rng() * n < v;
        res.push(venn);
        if (venn) v -= 1;
        else f -= 1;
    }
    g.trukket = res;
}

function avgjør(g: G) {
    const k = g.trukket.filter(Boolean).length;
    const vant = k >= MÅ_HA;
    if (vant) {
        g.vunnet += 1;
        const ren = k === TREKKES;
        if (ren) g.rene += 1;
        // Hver vunnet trekning er ett år til med Medici-venner i vervene: fast bonus for å
        // holde ut, pluss venner ganget med multiplikatoren for den som tør.
        g.poeng += VUNNET_POENG + k * 10 * g.mult * (ren ? 2 : 1);
        const r = renter(g);
        g.kiste = Math.min(KISTE_MAKS, g.kiste + r);
        g.sisteRente = r;
        g.events.push({ k: ren ? 'ren' : 'vant', tekst: `+${r} florin i renter` });
    } else {
        // Tapt trekning: Albizzi styrer, ingen renter, og det koster.
        g.mult = 1;
        g.poeng += k * 5;
        g.gonfNeste = true;
        const pris = tapPris(g);
        g.kiste -= pris;
        g.sisteRente = -pris;
        g.events.push({ k: 'tapte', tekst: `-${pris} florin` });
    }
    if (g.kiste < 0) {
        g.kiste = 0;
        g.events.push({ k: 'tom' });
        return slutt(g, 'tom');
    }
    if (g.trekning === 3 && !g.pater) {
        g.pater = true;
        g.events.push({ k: 'pater' });
    }
    // Beundrerne teller ned én trekning.
    for (const r of g.rådsherrer) if (r.beundrer > 0) r.beundrer -= 1;
    if (g.trekning >= TREKNINGER - 1) return slutt(g, null);
    g.trekning += 1;
    startTrekning(g);
}

export function update(g: G, dt: number) {
    if (g.ended) return;
    g.t += dt;

    if (g.fase === 'trekning') {
        g.faseT -= dt;
        if (g.faseT <= 0) avgjør(g);
        return;
    }

    if (g.fase === 'gave') {
        // Alle ser på kortene midt på bordet. Klokka i runden står stille til du har valgt.
        g.faseT += dt;
        for (const r of g.rådsherrer) {
            const mot = Math.atan2(BAG.y - r.y, BAG.x - r.x);
            r.vinkel += (mot - r.vinkel) * Math.min(1, dt * 5);
        }
        if (g.valgt) g.valgtT -= dt;
        if (!g.kort || (g.valgt && g.valgtT <= 0) || g.faseT >= GAVE_MAKS) {
            g.kort = null;
            g.valgt = null;
            g.fase = 'smugle';
            g.faseT = SMUGLE_S;
            for (const r of g.rådsherrer) if (aktiv(r)) r.vinkel = r.bortVinkel;
        }
        return;
    }

    // Klokka i trekningen går også mens blikket fryser.
    g.faseT -= dt;

    // Frys: blikket står stille i sakte film, hånda også. Eleven rekker å trekke den ut.
    if (g.frys > 0) {
        g.frys -= dt;
        return;
    }

    oppdaterBlikk(g, dt);

    // Et nytt vindu åpner seg: alle aktive ser bort. Det er et valg (slippe, fiske, vente).
    const fri = g.rådsherrer.every((r) => !aktiv(r) || r.blikk === 'bort');
    if (fri && !g.fri) g.valg += 1;
    g.fri = fri;

    // Hånda i posen.
    const h = g.hånd;
    if (h.act) {
        h.t += dt;
        sjekkTatt(g);
        if (g.ended) return;
        h.neste -= dt;
        if (h.neste <= 0) {
            if (h.act === 'slipp') {
                h.neste += NESTE_S;
                if (g.kiste >= LAPP_PRIS) {
                    g.kiste -= LAPP_PRIS;
                    g.venner += 1;
                    h.dukk += 1;
                    // Pavens utsending følger med: tør du smugle mens han sitter der, betaler paven.
                    if (g.rådsherrer.some((r) => r.slag === 'utsending' && aktiv(r))) {
                        g.kiste = Math.min(KISTE_MAKS, g.kiste + PAVE_BONUS);
                        g.pave += PAVE_BONUS;
                        g.events.push({ k: 'pave', tekst: `+${PAVE_BONUS}`, x: BAG.x, y: BAG.y });
                    }
                    // Grådighet lønner seg: fra tredje lapp i samme dukk stiger multiplikatoren.
                    if (h.dukk > 2) g.mult = Math.min(MULT_MAKS, g.mult + MULT_PER_LAPP);
                    g.events.push({ k: 'slapp', x: BAG.x, y: BAG.y });
                }
            } else {
                h.neste += FISK_S;
                if (g.fiender > 0 && lapper(g) > MIN_LAPPER) {
                    g.fiender -= 1;
                    g.events.push({ k: 'fisket', x: BAG.x, y: BAG.y });
                }
            }
        }
    }

    if (g.faseT <= 0) {
        g.hånd = tomHånd();
        g.kort = null;
        g.fase = 'trekning';
        g.faseT = TREKK_S;
        trekk(g);
        g.events.push({ k: 'trekning' });
    }
}

// ---------- Mål til selvspill og HUD ----------

export function progress(g: G) {
    if (g.ended === 'vunnet') return 1;
    const hel = SMUGLE_S + TREKK_S;
    const del = g.fase === 'gave' ? 0 : g.fase === 'smugle' ? (SMUGLE_S - g.faseT) / hel : (hel - g.faseT) / hel;
    return clamp((g.trekning + del) / TREKNINGER, 0, 1);
}

/** 0-1: flere rådsherrer, raskere blikk og en Pazzi som ikke kremter. */
export function pressure(g: G) {
    // Salviati følger Pazzi og teller ikke som et eget blikk.
    const n = g.rådsherrer.filter((r) => aktiv(r) && r.slag !== 'salviati').length;
    const vakter = clamp((n - 3) / 2, 0, 1);
    const blikk = clamp((fart(g) - 1) / 0.6, 0, 1);
    return clamp(0.12 + 0.3 * vakter + 0.45 * blikk + (g.trekning >= RYSTELSE ? 0.1 : 0), 0, 1);
}

export const finalScore = (g: G) => Math.floor(g.poeng);

export const ÅRSAK: Record<Cause, string> = {
    tatt: 'tatt med hånda i posen - Cosimo arrestert',
    tom: 'kista gikk tom - ingen florin til vennene',
};

/** Tapsskjermen: tittel, hva som skjedde historisk, og et konkret tips knyttet til året og årsaken. */
export function tipsFor(g: G): { tittel: string; tekst: string; tips: string } {
    const år = ÅR[g.trekning];
    if (g.cause === 'tatt') {
        const hvem = g.tattAv;
        const tips =
            hvem === 'pazzi' || hvem === 'salviati'
                ? år >= ÅR[RYSTELSE]
                    ? `Pazzi så deg i ${år}. Han kremter ikke: dra hånda ut på det andre rykket over hatten hans.`
                    : `Pazzi så deg i ${år}. Når hodet hans rykker, snur han seg: dra hånda ut med en gang.`
                : hvem === 'gonf'
                  ? `Albizzis mann så deg i ${år}. Han kommer etter et tap og ser mest på posen - kjøp et maleri eller vent.`
                  : hvem === 'albizzi'
                    ? `Albizzi så deg i ${år}. Se på lua hans: løfter han den, kommer et ekte kremt - dra hånda ut.`
                      : `Du ble sett i ${år}. Dra hånda ut med en gang noen kremter og hodet snur seg.`;
        return {
            tittel: 'Tatt med hånda i posen!',
            tekst: 'Rådsherrene arresterer Cosimo, som i 1433. Han slapp unna med eksil fordi han betalte bestikkelser.',
            tips,
        };
    }
    const tips =
        g.trekning >= RYSTELSE
            ? `Kista gikk tom i ${år}: banken i Brugge og London taper nå. Kjøp færre lodd og kort før banken faller, og spar til et tap.`
            : g.trekning >= LORENZO_FRA
              ? `Kista gikk tom i ${år}: London-banken tapte penger, og kortene ble dyrere. Spar mer før banken i Brugge faller.`
              : `Kista gikk tom i ${år}: et tap koster ${tapPris(g)} florin. Ha alltid så mye igjen i kista før trekningen.`;
    return {
        tittel: 'Kista er tom',
        tekst: 'Uten penger forsvant vennene. Slik gikk det med Lorenzo: han brukte mer enn banken tjente, og i 1494 ble familien kastet ut.',
        tips,
    };
}
