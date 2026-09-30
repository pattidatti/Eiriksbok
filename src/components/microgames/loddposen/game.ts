import { seeded, type Rng } from '../sim';

// LODDPOSEN - spillreglene (rene, uten React og uten tegning).
//
// Firenze 1434-1492. Byen trekker lodd om vervene. Du holder hånda i loddposen mens
// rådsherrene ser bort, og Medici-lappene faller ned én etter én. Jo lenger du tør, jo mer.
//
// De tre reglene eleven skal sitte igjen med:
//   1. Hånda inn når alle ser bort, ut når noen kremter (sett med hånda i posen = tatt).
//   2. Florin betaler alt: hver lapp koster, en tapt trekning koster, og bare en vunnet
//      trekning gir renter (halvparten fra 1469). Tom kiste = tapt.
//   3. 3 av 5 vinner: trekker Signoria minst tre venner av fem lapper, styrer Medici.
//
// En runde er åtte trekninger. Hver trekning: SMUGLE_S sekunder smugling (gavekortet står
// de første KORT_S sekundene), så TREKK_S sekunder trekning.

// ---------- Tall ----------
export const W = 1000;
export const H = 700;
export const BAG = { x: 500, y: 330, r: 58 };

export const TREKNINGER = 8;
export const SMUGLE_S = 15;
export const TREKK_S = 3.5;
export const KORT_S = 4;
export const RUN_SECONDS = TREKNINGER * (SMUGLE_S + TREKK_S);

export const ÅR = [1434, 1444, 1454, 1464, 1469, 1478, 1485, 1492];
/** Antall rådsherrer rundt bordet i hver trekning (gonfalonieren kommer i tillegg). */
const RÅD = [3, 3, 3, 4, 4, 4, 4, 4];
/** Fiendelapper rivalene legger i posen ved starten av hver trekning. */
const FIENDER = [5, 5, 5, 5, 5, 5, 5, 6];
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
export const PAZZI_STILLE_S = 2.5;

/** Grådig hånd: første lapp faller etter FØRSTE_S, så én hvert NESTE_S så lenge hånda er inne. */
export const FØRSTE_S = 0.5;
export const NESTE_S = 0.3;
/** Fiske: hold hånda over en fiendelapp så lenge, så er den ute. */
export const FISK_S = 0.6;
/** Kremtet: så lang tid har du på å dra hånda ut før blikket treffer. */
export const VARSEL_S = 0.7;
/** Sakte film når et blikk begynner å snu seg mens hånda er i posen. */
const FRYS_S = 0.25;

export const KISTE_START = 150;
/** Kista rommer ikke mer: gull over dette er bortkastet, så det lønner seg å bruke det. */
export const KISTE_MAKS = 300;
/** Florin per sekund fra handelen, uansett hvem som styrer. */
const INNTEKT = 6;
export const LAPP_PRIS = 15;
/** Tapt trekning koster, vunnet trekning gir renter (halvparten fra 1469). */
export const TAP_PRIS = 110;
const RENTER = 150;
/** Multiplikatoren: +0,25 per lapp etter den andre i samme dukk. */
const MULT_PER_LAPP = 0.25;
const MULT_MAKS = 5;

export interface Kunst {
    navn: string;
    pris: number;
    /** Hvor mange trekninger rådsherren er beundrer. */
    trekninger: number;
}

/** Kunstverkene i studiolo-skapet, i den rekkefølgen de kan tilbys. */
export const KUNST: Kunst[] = [
    { navn: 'Bøker til biblioteket', pris: 70, trekninger: 1 },
    { navn: 'Brunelleschis kirke', pris: 200, trekninger: 4 },
    { navn: 'Donatellos statue', pris: 130, trekninger: 2 },
    { navn: 'Ficinos Platon-skole', pris: 110, trekninger: 2 },
    { navn: 'Botticellis maleri', pris: 150, trekninger: 2 },
    { navn: 'Unge Michelangelo i huset', pris: 190, trekninger: 4 },
];

export const RANGER: [number, string][] = [
    [0, 'Skriver'],
    [120, 'Notar'],
    [280, 'Prior'],
    [480, 'Gonfaloniere'],
    [720, 'Il Magnifico'],
    [1000, 'Pater Patriae'],
];

// ---------- Tilstand ----------
export type Blikk = 'bort' | 'varsel' | 'ser';
export type Slag = 'råd' | 'pazzi' | 'gonf';

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
    /** Vinkelen blikket peker nå (tegning). */
    vinkel: number;
    bortVinkel: number;
    /** Trekninger igjen som beundrer (ser på kunsten, ikke på posen). */
    beundrer: number;
    /** Hvor mange sekunder han har sett på posen denne trekningen. */
    sett: number;
}

export type Handling = 'slipp' | 'fisk';
export type Cause = 'tatt' | 'tom';
export type Fase = 'smugle' | 'trekning';

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
        | 'banken';
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

export interface Kort {
    valg: [Kunst, Kunst];
    /** Sekunder igjen før kortet forsvinner (da er det «spar gullet»). */
    t: number;
    /** Valgt kunstverk som venter på at eleven peker på en rådsherre. */
    valgt: Kunst | null;
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
    /** Resultatet av trekningen som vises nå: venn (true) eller fiende per lapp. */
    trukket: boolean[];
    gonfNeste: boolean;
    mult: number;
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
    events: Hendelse[];
    nextId: number;
}

// ---------- Hjelpere ----------
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const år = (g: G) => ÅR[g.trekning];
export const aktiv = (r: Rådsherre) => r.beundrer <= 0;
export const bankenSvikter = (g: G) => g.trekning >= LORENZO_FRA;
export const inntekt = () => INNTEKT;
export const renter = (g: G) => (bankenSvikter(g) ? RENTER / 2 : RENTER);
/** Fra 1478 kremter ikke Pazzi, og kunst virker ikke på ham. */
export const stillePazzi = (g: G, r: Rådsherre) => r.slag === 'pazzi' && g.trekning >= RYSTELSE;
export const lapper = (g: G) => g.venner + g.fiender;

/** Hvor fort blikkene går i denne trekningen (1 = rolig). */
export function fart(g: G) {
    let f = 1 + 0.04 * g.trekning;
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
    if (r.slag === 'gonf') r.t = (3.0 + g.rng() * 3.0) / f;
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
        r.t = (5.0 + g.rng() * 5.0) / f;
    }
    r.bortVinkel = Math.atan2(BAG.y - r.y, BAG.x - r.x) + (g.rng() < 0.5 ? -1 : 1) * (0.9 + g.rng() * 0.8);
}

function lagRådsherrer(g: G) {
    const n = RÅD[g.trekning] + (g.gonfNeste ? 1 : 0);
    const gamle = g.rådsherrer;
    const liste: Rådsherre[] = [];
    for (let i = 0; i < n; i++) {
        const p = seat(i, n);
        const slag: Slag =
            g.gonfNeste && i === n - 1 ? 'gonf' : g.trekning >= PAZZI_FRA && i === 0 ? 'pazzi' : 'råd';
        // Beundrere beholder sin plass i rekka (samme id) fra forrige trekning.
        const gammel = gamle[i] && gamle[i].slag !== 'gonf' && slag !== 'gonf' ? gamle[i] : null;
        const r: Rådsherre = {
            id: gammel ? gammel.id : g.nextId++,
            slag,
            x: p.x,
            y: p.y,
            blikk: 'bort',
            t: 0,
            siden: 0,
            lur: false,
            vinkel: 0,
            bortVinkel: 0,
            beundrer: gammel ? Math.max(0, gammel.beundrer) : 0,
            sett: 0,
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

function lagKort(g: G): Kort {
    const i = (g.trekning * 2) % KUNST.length;
    const a = KUNST[i];
    const b = KUNST[(i + 1 + (g.trekning % 3)) % KUNST.length];
    const [billig, dyr] = a.pris <= b.pris ? [a, b] : [b, a];
    return { valg: [billig, dyr === billig ? KUNST[(i + 2) % KUNST.length] : dyr], t: KORT_S, valgt: null };
}

function startTrekning(g: G) {
    g.fase = 'smugle';
    g.faseT = SMUGLE_S;
    g.venner = 0;
    g.fiender = FIENDER[g.trekning];
    g.trukket = [];
    if (g.trekning === LORENZO_FRA) g.events.push({ k: 'banken', tekst: 'Banken svikter: rentene halveres' });
    lagRådsherrer(g);
    g.kort = lagKort(g);
    g.valg += 1;
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
        trukket: [],
        gonfNeste: false,
        mult: 1,
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
    const truet = g.rådsherrer.some((r) => aktiv(r) && r.blikk === 'varsel');
    if (truet || g.hånd.varslet) {
        g.nesten += 1;
        g.events.push({ k: 'nesten', x: BAG.x, y: BAG.y - 80 });
    }
    g.hånd = tomHånd();
    return true;
}

/** Velg et kunstverk på gavekortet (0 eller 1). Rådsherren velges med `gi`. */
export function velgKunst(g: G, i: 0 | 1) {
    const k = g.kort;
    if (!k || g.ended) return false;
    const kunst = k.valg[i];
    if (g.kiste < kunst.pris) return false;
    k.valgt = kunst;
    return true;
}

/** Spar gullet: lukk gavekortet uten å kjøpe. */
export function spar(g: G) {
    if (!g.kort) return false;
    g.kort = null;
    return true;
}

/** Gi det valgte kunstverket til en rådsherre: han blir beundrer og ser på kunsten. */
export function gi(g: G, id: number) {
    const k = g.kort;
    if (!k || !k.valgt) return false;
    const r = g.rådsherrer.find((q) => q.id === id);
    if (!r || r.slag === 'gonf' || stillePazzi(g, r)) return false;
    if (g.kiste < k.valgt.pris) return false;
    g.kiste -= k.valgt.pris;
    r.beundrer = Math.max(r.beundrer, k.valgt.trekninger);
    r.blikk = 'bort';
    if (!g.kunstKjøpt.includes(k.valgt.navn)) g.kunstKjøpt.push(k.valgt.navn);
    g.events.push({ k: 'kunst', tekst: k.valgt.navn, x: r.x, y: r.y });
    g.kort = null;
    return true;
}

/** Den farligste rådsherren å gjøre til beundrer: den som har sett mest på posen. */
export function farligst(g: G): Rådsherre | null {
    const kand = g.rådsherrer.filter((r) => aktiv(r) && r.slag !== 'gonf' && !stillePazzi(g, r));
    if (!kand.length) return null;
    return kand.reduce((a, b) => {
        const va = a.sett + (a.slag === 'pazzi' ? 3 : 0);
        const vb = b.sett + (b.slag === 'pazzi' ? 3 : 0);
        return vb > va ? b : a;
    });
}

// ---------- Oppdatering ----------

function sjekkTatt(g: G) {
    if (!g.hånd.act || g.ended) return;
    const seer = g.rådsherrer.find((r) => aktiv(r) && r.blikk === 'ser');
    if (seer) {
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
    for (const r of g.rådsherrer) {
        const mot = Math.atan2(BAG.y - r.y, BAG.x - r.x);
        if (!aktiv(r)) {
            // Beundreren ser på kunsten (mot eleven sin side av bordet), aldri på posen.
            r.blikk = 'bort';
            r.vinkel += (mot + 1.6 - r.vinkel) * Math.min(1, dt * 4);
            continue;
        }
        r.t -= dt;
        if (r.blikk === 'bort') r.siden += dt;
        if (r.blikk === 'ser') r.sett += dt;
        if (r.t <= 0) {
            if (r.blikk === 'bort' && stillePazzi(g, r)) {
                // Ingen kremt: rett på posen.
                r.blikk = 'ser';
                r.t = (0.5 + g.rng() * 0.5) / f;
            } else if (r.blikk === 'bort') {
                r.blikk = 'varsel';
                r.t = VARSEL_S * (r.lur ? 0.6 : 1);
                if (g.hånd.act && !g.hånd.varslet) {
                    // Nesten tatt: alt fryser i sakte film et lite øyeblikk.
                    g.hånd.varslet = true;
                    g.frys = FRYS_S;
                    g.valg += 1;
                }
                g.events.push({ k: 'varsel', x: r.x, y: r.y });
            } else if (r.blikk === 'varsel') {
                r.blikk = 'ser';
                r.t = r.slag === 'gonf' ? (0.8 + g.rng() * 0.4) / f : (0.5 + g.rng() * 0.5) / f;
            } else nyBort(g, r);
        }
        const mål = r.blikk === 'ser' ? mot : r.blikk === 'varsel' ? lerp(r.bortVinkel, mot, 0.35) : r.bortVinkel;
        r.vinkel += (mål - r.vinkel) * Math.min(1, dt * (r.blikk === 'ser' ? 14 : 6));
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
        g.poeng += k * 10 * g.mult * (ren ? 2 : 1);
        const r = renter(g);
        g.kiste = Math.min(KISTE_MAKS, g.kiste + r);
        g.events.push({ k: ren ? 'ren' : 'vant', tekst: `+${r} florin i renter` });
    } else {
        // Tapt trekning: Albizzi styrer, ingen renter, og det koster.
        g.mult = 1;
        g.poeng += k * 5;
        g.gonfNeste = true;
        g.kiste -= TAP_PRIS;
        g.events.push({ k: 'tapte', tekst: `-${TAP_PRIS} florin` });
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

    // Frys: blikket står stille i sakte film, hånda også. Eleven rekker å trekke den ut.
    if (g.frys > 0) {
        g.frys -= dt;
        return;
    }

    g.faseT -= dt;
    g.kiste = Math.min(KISTE_MAKS, g.kiste + inntekt() * dt);

    if (g.kort) {
        g.kort.t -= dt;
        if (g.kort.t <= 0) g.kort = null;
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
    const del = g.fase === 'smugle' ? (SMUGLE_S - g.faseT) / (SMUGLE_S + TREKK_S) : (SMUGLE_S + TREKK_S - g.faseT) / (SMUGLE_S + TREKK_S);
    return clamp((g.trekning + del) / TREKNINGER, 0, 1);
}

/** 0-1: flere rådsherrer, raskere blikk og kortere varsel. */
export function pressure(g: G) {
    const n = g.rådsherrer.length;
    const vakter = clamp((n - 3) / 4, 0, 1);
    const blikk = clamp((fart(g) - 1) / 0.9, 0, 1);
    return clamp(0.15 + 0.45 * vakter + 0.3 * blikk + (g.trekning >= RYSTELSE ? 0.1 : 0), 0, 1);
}

export const finalScore = (g: G) => Math.floor(g.poeng);

export const ÅRSAK: Record<Cause, string> = {
    tatt: 'tatt med hånda i posen - Cosimo arrestert',
    tom: 'kista gikk tom - ingen florin til vennene',
};

export const TIPS: Record<Cause, { tittel: string; tekst: string }> = {
    tatt: {
        tittel: 'Tatt med hånda i posen!',
        tekst:
            'Rådsherrene arresterer Cosimo, som i 1433. Han slapp unna med eksil fordi han betalte bestikkelser. Tips: dra hånda ut med en gang noen kremter. Og fra 1478 kremter ikke Pazzi - han snur seg etter halvannet sekund.',
    },
    tom: {
        tittel: 'Kista er tom',
        tekst:
            'Uten penger forsvant vennene. Slik gikk det med Lorenzo: han brukte formuen på kunst, fester og gaver mens banken gikk dårligere, og i 1494 ble familien kastet ut. Tips: en tapt trekning koster 110 florin og gir ingen renter. Kjøp nok venner til å vinne, men hold alltid nok i kista til ett tap.',
    },
};
