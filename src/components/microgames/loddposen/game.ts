import { seeded, type Rng } from '../sim';

// LODDPOSEN - spillreglene (rene, uten React og uten tegning).
//
// Firenze 1434-1492. Byen trekker lodd om vervene. Du smugler Medici-lapper ned i
// loddposen når rådsherrene ser bort, og fisker opp fiendelapper når du tør.
//
// De tre reglene eleven skal sitte igjen med:
//   1. Flere venner i posen gir bedre sjanse i trekningen.
//   2. Hånda i posen når et blikk treffer = tatt (Cosimo arrestert, som i 1433).
//   3. Banken betaler vennene: hver lapp og hver lønn koster florin. For mye gull gjør
//      rådsherrene misunnelige (de ser oftere), kunst gjør en rådsherre til beundrer.
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
const RÅD = [3, 3, 4, 4, 5, 6, 6, 6];
/** Fiendelapper rivalene legger i posen ved starten av hver trekning. */
const FIENDER = [2, 3, 3, 4, 4, 4, 5, 5];
/** Pazzi sitter ved bordet fra trekning 4 (indeks 3). */
const PAZZI_FRA = 3;
/** 1469: Lorenzo tar over, banken tjener halvparten. */
const LORENZO_FRA = 4;
/** 1478: Pazzi-rystelsen, alle er mistenksomme. */
const RYSTELSE = 5;

export const SLIPP_S = 0.3;
export const FISK_S = 0.7;
/** Sakte film når et blikk begynner å snu seg mens hånda er i posen. */
const FRYS_S = 0.25;

export const KISTE_START = 160;
export const MISUNNELSE = 420;
export const KISTE_MAKS = 700;
const INNTEKT = 15; // florin per sekund før 1469
export const LAPP_PRIS = 10;
/** Lønn til vennene etter hver trekning: fast gave + per venn som fikk verv. */
const LØNN_FAST = 30;
const LØNN_PER_VENN = 20;

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
export type Cause = 'tatt' | 'tom' | 'stemt';
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
        | 'lønn'
        | 'kunst'
        | 'kort'
        | 'pater'
        | 'tom'
        | 'misunnelig';
    tekst?: string;
    x?: number;
    y?: number;
}

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
    hånd: { act: Handling | null; t: number; varslet: boolean };
    frys: number;
    kort: Kort | null;
    /** Resultatet av trekningen som vises nå: venn (true) eller fiende per lapp. */
    trukket: boolean[];
    tapPåRad: number;
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
export const misunnelig = (g: G) => g.kiste > MISUNNELSE;
export const aktiv = (r: Rådsherre) => r.beundrer <= 0;
export const inntekt = (g: G) => (g.trekning >= LORENZO_FRA ? INNTEKT / 2 : INNTEKT);
export const lønn = (venner: number) => LØNN_FAST + LØNN_PER_VENN * venner;

/** Hvor fort blikkene går i denne trekningen (1 = rolig). */
export function fart(g: G) {
    let f = 1 + 0.07 * g.trekning;
    if (g.trekning === RYSTELSE) f *= 1.3;
    return f;
}
/** Varselet før et hode snur seg: kremt og rykk i hatten. 0,8 s i 1434, 0,4 s mot slutten. */
export function varselTid(g: G) {
    let v = lerp(0.8, 0.4, g.trekning / (TREKNINGER - 1));
    if (misunnelig(g)) v *= 0.8;
    return v;
}

/** Sjansen for at minst to av tre trukne lapper er venner (hypergeometrisk). */
export function odds(venner: number, fiender: number) {
    const n = venner + fiender;
    if (n < 3) return venner >= 2 ? 1 : 0;
    const c3 = (n * (n - 1) * (n - 2)) / 6;
    const tre = (venner * (venner - 1) * (venner - 2)) / 6;
    const to = ((venner * (venner - 1)) / 2) * fiender;
    return (tre + to) / c3;
}

function seat(i: number, n: number) {
    // Rådsherrene sitter rundt bordets øvre del og sidene; eleven sitter nederst.
    const a0 = Math.PI * 1.08;
    const a1 = Math.PI * 1.92;
    const a = n === 1 ? Math.PI * 1.5 : lerp(a0, a1, i / (n - 1));
    return { x: BAG.x + Math.cos(a) * 400, y: BAG.y + Math.sin(a) * 250 + 20 };
}

function nyBort(g: G, r: Rådsherre) {
    const f = fart(g) * (misunnelig(g) ? 1.5 : 1);
    r.blikk = 'bort';
    r.siden = 0;
    if (r.slag === 'gonf') r.t = (2.2 + g.rng() * 1.8) / f;
    else if (r.slag === 'pazzi' && g.rng() < 0.5) {
        // Lureblikket: ser bort et øyeblikk og snur seg tilbake.
        r.lur = true;
        r.t = 0.55 + g.rng() * 0.35;
    } else {
        r.lur = false;
        r.t = (3.0 + g.rng() * 4.0) / f;
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
        nyBort(g, r);
        r.t *= 0.5 + g.rng() * 0.8;
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
        hånd: { act: null, t: 0, varslet: false },
        frys: 0,
        kort: null,
        trukket: [],
        tapPåRad: 0,
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

/** Stikk hånda i posen: slipp en Medici-lapp (0,3 s) eller fisk opp en fiendelapp (0,7 s). */
export function begynn(g: G, act: Handling) {
    if (g.ended || g.fase !== 'smugle' || g.hånd.act) return false;
    if (act === 'slipp' && g.kiste < LAPP_PRIS) return false;
    if (act === 'fisk' && g.fiender <= 0) return false;
    g.hånd = { act, t: 0, varslet: false };
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
        g.mult = Math.min(4, g.mult + 0.25);
        g.events.push({ k: 'nesten', x: BAG.x, y: BAG.y - 80 });
    }
    g.hånd = { act: null, t: 0, varslet: false };
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
    if (!r || r.slag === 'gonf') return false;
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
    const kand = g.rådsherrer.filter((r) => aktiv(r) && r.slag !== 'gonf');
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
    g.hånd = { act: null, t: 0, varslet: false };
}

function oppdaterBlikk(g: G, dt: number) {
    const f = fart(g) * (misunnelig(g) ? 1.5 : 1);
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
            if (r.blikk === 'bort') {
                r.blikk = 'varsel';
                r.t = varselTid(g) * (r.lur ? 0.6 : 1);
                if (g.hånd.act && !g.hånd.varslet) {
                    // Nesten tatt: alt fryser i sakte film et lite øyeblikk.
                    g.hånd.varslet = true;
                    g.frys = FRYS_S;
                    g.valg += 1;
                }
                g.events.push({ k: 'varsel', x: r.x, y: r.y });
            } else if (r.blikk === 'varsel') {
                r.blikk = 'ser';
                r.t = r.slag === 'gonf' ? (1.0 + g.rng() * 0.6) / f : (0.5 + g.rng() * 0.5) / f;
            } else nyBort(g, r);
        }
        const mål = r.blikk === 'ser' ? mot : r.blikk === 'varsel' ? lerp(r.bortVinkel, mot, 0.35) : r.bortVinkel;
        r.vinkel += (mål - r.vinkel) * Math.min(1, dt * (r.blikk === 'ser' ? 14 : 6));
    }
}

function trekk(g: G) {
    // Tre lapper trekkes uten tilbakelegging.
    let v = g.venner;
    let f = g.fiender;
    const res: boolean[] = [];
    for (let i = 0; i < 3; i++) {
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
    const vant = k >= 2;
    if (vant) {
        g.vunnet += 1;
        g.tapPåRad = 0;
        const ren = k === 3;
        if (ren) {
            g.rene += 1;
            g.mult = Math.min(4, g.mult + 0.5);
        }
        g.poeng += k * 10 * g.mult * (ren ? 2 : 1);
        g.events.push({ k: ren ? 'ren' : 'vant' });
    } else {
        g.tapPåRad += 1;
        g.poeng += k * 5 * g.mult;
        g.gonfNeste = true;
        g.events.push({ k: 'tapte' });
    }
    // Banken betaler vennene.
    const l = lønn(k);
    g.kiste -= l;
    g.events.push({ k: 'lønn', tekst: `-${l} florin i lønn og gaver` });
    if (g.kiste < 0) {
        g.kiste = 0;
        g.events.push({ k: 'tom' });
        return slutt(g, 'tom');
    }
    if (g.tapPåRad >= 3) return slutt(g, 'stemt');
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
    const varMis = misunnelig(g);
    g.kiste = Math.min(KISTE_MAKS, g.kiste + inntekt(g) * dt);
    if (!varMis && misunnelig(g)) g.events.push({ k: 'misunnelig' });

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
        const dur = h.act === 'slipp' ? SLIPP_S : FISK_S;
        if (h.t >= dur) {
            if (h.act === 'slipp') {
                g.kiste -= LAPP_PRIS;
                g.venner += 1;
                g.events.push({ k: 'slapp', x: BAG.x, y: BAG.y });
            } else {
                g.fiender = Math.max(0, g.fiender - 1);
                g.events.push({ k: 'fisket', x: BAG.x, y: BAG.y });
            }
            if (h.varslet) {
                g.nesten += 1;
                g.mult = Math.min(4, g.mult + 0.25);
                g.events.push({ k: 'nesten', x: BAG.x, y: BAG.y - 80 });
            }
            g.hånd = { act: null, t: 0, varslet: false };
        }
    }

    if (g.faseT <= 0) {
        g.hånd = { act: null, t: 0, varslet: false };
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
    return clamp(0.15 + 0.45 * vakter + 0.3 * blikk + (misunnelig(g) ? 0.1 : 0), 0, 1);
}

export const finalScore = (g: G) => Math.floor(g.poeng);

export const ÅRSAK: Record<Cause, string> = {
    tatt: 'tatt med hånda i posen - Cosimo arrestert',
    tom: 'kista gikk tom - vennene fikk ikke lønn',
    stemt: 'tre tapte trekninger på rad - Albizzi stemte deg ut',
};

export const TIPS: Record<Cause, { tittel: string; tekst: string }> = {
    tatt: {
        tittel: 'Tatt med hånda i posen!',
        tekst:
            'Rådsherrene arresterer Cosimo, som i 1433. Han slapp unna med eksil fordi han betalte bestikkelser. Tips: vent på kremtet, og slipp heller én lapp for lite enn én for mye.',
    },
    tom: {
        tittel: 'Kista er tom',
        tekst:
            'Uten penger forsvant vennene. Slik gikk det med Lorenzo: han brukte formuen på kunst, fester og gaver mens banken gikk dårligere, og i 1494 ble familien kastet ut. Tips: banken må bære gavene.',
    },
    stemt: {
        tittel: 'Stemt ut av byen',
        tekst:
            'Albizzi-familien styrer Signoria og stemmer deg ut av byen. Tips: makten satt i posen. Uten venner i posen hjelper ikke alt gullet i verden.',
    },
};
