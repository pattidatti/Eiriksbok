// Kjerneløkka i Rederens kart: dra båter ut på flokker, fatene ruller hjem, flokkene føder
// sakte, og hver båt koster olje ved hvert årsskifte. Ren TypeScript: komponenten,
// robotene og simuleringen kjører den samme koden.

import { BRETT, KART, brettFor, type KartId } from './levels';
import {
    dist,
    fangerFra,
    flåteFor,
    fødselsrate,
    hvalIHavet,
    iRo,
    sløyfe,
    vinkelfart,
    årLengde,
    årsKost,
} from './rules';
import { TUNING } from './tuning';

const T = TUNING;

export type Årsak = 'tomt' | 'konkurs';

export interface Flokk {
    id: number;
    navn: string;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    fart: number;
    fase: number;
    n: number;
    maks: number;
    x: number;
    y: number;
    død: boolean;
    /** Født og tatt hittil i år (ringen og loggboka). */
    født: number;
    tatt: number;
    /** Netto per sekund akkurat nå: fødsler minus fangst. Ringen er grønn når den er >= 0. */
    netto: number;
}

export interface Båt {
    id: number;
    kokeri: boolean;
    x: number;
    y: number;
    tx: number;
    ty: number;
    /** Sekunder til neste hval mens båten fanger. */
    klokke: number;
}

export interface Fat {
    x: number;
    y: number;
    tx: number;
    ty: number;
}

export type Hendelse =
    | { type: 'brett'; brett: number }
    | { type: 'båt'; id: number }
    | { type: 'fangst'; x: number; y: number; flokk: number }
    | { type: 'unge'; flokk: number }
    | { type: 'død'; flokk: number }
    | { type: 'fat' }
    | { type: 'årsskifte'; kost: number; grønt: boolean }
    | { type: 'slipp'; id: number }
    | { type: 'tap'; årsak: Årsak }
    | { type: 'seier' };

export interface Game {
    /** Spilte sekunder. */
    t: number;
    år: number;
    /** Sekunder inn i året. */
    iÅr: number;
    mode: 'play' | 'won' | 'lost';
    årsak: Årsak | null;
    brett: number;
    kart: KartId;
    havn: { x: number; y: number; navn: string };
    flokker: Flokk[];
    båter: Båt[];
    fat: Fat[];
    tønne: number;
    /** Spillfølelse: slipp på et nytt sted. */
    valg: number;
    /** Forvalter-poengsummen: år drevet, mer for grønne år på rad. */
    poeng: number;
    grønnRekke: number;
    grønneÅr: number;
    /** Hval i havet ved starten av året, og fangst hittil i år. */
    hvalVedÅrStart: number;
    tattIÅr: number;
    totaltTatt: number;
    nesteId: number;
    hendelser: Hendelse[];
    rng: () => number;
}

function mulberry(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function leggTilFlokker(g: Game, brett: number) {
    for (const d of BRETT[brett].flokker) {
        const f: Flokk = {
            id: g.nesteId++,
            ...d,
            x: 0,
            y: 0,
            død: false,
            født: 0,
            tatt: 0,
            netto: 0,
        };
        const p = sløyfe(f, f.fase, g.t);
        f.x = p.x;
        f.y = p.y;
        g.flokker.push(f);
    }
}

function nyBåt(g: Game, kokeri: boolean) {
    const k = g.båter.length;
    // Nye båter glir inn i havna, litt forskjøvet så de ikke ligger oppå hverandre.
    const x = g.havn.x + (kokeri ? 0 : ((k % 4) - 1.5) * 10);
    const y = g.havn.y + (kokeri ? 26 : 0);
    const b: Båt = { id: g.nesteId++, kokeri, x, y, tx: x, ty: y, klokke: T.fangst.intervall };
    g.båter.push(b);
    g.hendelser.push({ type: 'båt', id: b.id });
}

/** Flåten vokser av seg selv: nye båter og kokeriet kommer i havna. */
function fyllFlåten(g: Game) {
    const vil = flåteFor(g.år);
    while (g.båter.filter((b) => !b.kokeri).length < vil) nyBåt(g, false);
    if (g.år >= T.kokeriFra && !g.båter.some((b) => b.kokeri)) nyBåt(g, true);
}

function startBrett(g: Game, brett: number) {
    g.brett = brett;
    const def = BRETT[brett];
    if (def.kart) {
        // Nytt kartark: det gamle havet er stengt. Fat underveis kommer hjem, båtene seiler hjem.
        g.tønne += g.fat.length * T.fangst.fatVerdi;
        g.fat = [];
        g.kart = def.kart;
        g.havn = { ...KART[def.kart].havn };
        g.flokker = [];
        g.båter.forEach((b, i) => {
            b.x = b.tx = g.havn.x + (b.kokeri ? 0 : ((i % 4) - 1.5) * 10);
            b.y = b.ty = g.havn.y + (b.kokeri ? 26 : 0);
        });
    }
    leggTilFlokker(g, brett);
    g.hvalVedÅrStart = hvalIHavet(g);
    g.hendelser.push({ type: 'brett', brett });
}

export function newGame(seed: number): Game {
    const g: Game = {
        t: 0,
        år: T.tid.start,
        iÅr: 0,
        mode: 'play',
        årsak: null,
        brett: 0,
        kart: 'finnmark',
        havn: { ...KART.finnmark.havn },
        flokker: [],
        båter: [],
        fat: [],
        tønne: T.økonomi.startTønne,
        valg: 0,
        poeng: 0,
        grønnRekke: 0,
        grønneÅr: 0,
        hvalVedÅrStart: 0,
        tattIÅr: 0,
        totaltTatt: 0,
        nesteId: 1,
        hendelser: [],
        rng: mulberry(seed),
    };
    startBrett(g, 0);
    fyllFlåten(g);
    return g;
}

/** Grepet: send en båt (eller kokeriet) til et sted på kartet. Det eneste eleven gjør. */
export function send(g: Game, id: number, x: number, y: number) {
    if (g.mode !== 'play') return;
    const b = g.båter.find((k) => k.id === id);
    if (!b) return;
    const { w, h } = T.flate;
    x = Math.max(10, Math.min(w - 10, x));
    y = Math.max(10, Math.min(h - 10, y));
    if (dist(x, y, g.havn.x, g.havn.y) < T.båt.havnSnap) {
        x = g.havn.x;
        y = g.havn.y + (b.kokeri ? 26 : 0);
    }
    if (dist(x, y, b.tx, b.ty) > T.båt.nyttStedPx) g.valg++;
    b.tx = x;
    b.ty = y;
    g.hendelser.push({ type: 'slipp', id });
}

/** Nærmeste sted fatene kan rulle til: havna eller kokeriet. */
function mottak(g: Game, x: number, y: number) {
    let best = { x: g.havn.x, y: g.havn.y };
    let bd = dist(x, y, best.x, best.y);
    for (const b of g.båter) {
        if (!b.kokeri) continue;
        const d = dist(x, y, b.x, b.y);
        if (d < bd) {
            bd = d;
            best = { x: b.x, y: b.y };
        }
    }
    return best;
}

function årsskifte(g: Game) {
    const kost = årsKost(g);
    const hval = hvalIHavet(g);
    const grønt = g.tattIÅr > 0 && hval >= g.hvalVedÅrStart;
    g.grønnRekke = grønt ? g.grønnRekke + 1 : 0;
    if (grønt) g.grønneÅr++;
    const bonus = T.poeng.grønnBonus;
    g.poeng += T.poeng.perÅr + (grønt ? bonus[Math.min(g.grønnRekke, bonus.length) - 1] : 0);
    g.tønne -= kost;
    g.hendelser.push({ type: 'årsskifte', kost, grønt });
    g.år++;
    g.tattIÅr = 0;
    for (const f of g.flokker) f.født = f.tatt = 0;
    if (g.tønne < 0) {
        if (g.år <= T.økonomi.gulvTil) g.tønne = 0;
        else return tap(g, 'konkurs');
    }
    if (g.år >= T.tid.seier) {
        g.mode = 'won';
        g.hendelser.push({ type: 'seier' });
        return;
    }
    const b = brettFor(g.år);
    if (b !== g.brett) startBrett(g, b);
    fyllFlåten(g);
    g.hvalVedÅrStart = hvalIHavet(g);
}

function tap(g: Game, årsak: Årsak) {
    g.mode = 'lost';
    g.årsak = årsak;
    g.hendelser.push({ type: 'tap', årsak });
}

export function update(g: Game, dt: number) {
    if (g.mode !== 'play') return;
    g.t += dt;

    // Flokkene vandrer og føder (regel 2).
    for (const f of g.flokker) {
        f.fase += vinkelfart(f) * dt;
        const p = sløyfe(f, f.fase, g.t);
        f.x = p.x;
        f.y = p.y;
        f.netto = fødselsrate(f);
        if (g.rng() < fødselsrate(f) * dt) {
            f.n++;
            f.født++;
            g.hendelser.push({ type: 'unge', flokk: f.id });
        }
    }

    // Båtene tøffer mot målet og fanger når de ligger i ro ved en flokk (regel 1).
    for (const b of g.båter) {
        const d = dist(b.x, b.y, b.tx, b.ty);
        const v = (b.kokeri ? T.båt.kokeriFart : T.båt.fart) * dt;
        if (d <= v) {
            b.x = b.tx;
            b.y = b.ty;
        } else {
            b.x += ((b.tx - b.x) / d) * v;
            b.y += ((b.ty - b.y) / d) * v;
        }
        const f = fangerFra(g, b);
        if (!f) {
            b.klokke = T.fangst.intervall;
            continue;
        }
        f.netto -= 1 / T.fangst.intervall;
        b.klokke -= dt;
        if (b.klokke > 0 || !iRo(b)) continue;
        b.klokke += T.fangst.intervall;
        f.n--;
        f.tatt++;
        g.tattIÅr++;
        g.totaltTatt++;
        const m = mottak(g, b.x, b.y);
        g.fat.push({ x: b.x, y: b.y, tx: m.x, ty: m.y });
        g.hendelser.push({ type: 'fangst', x: b.x, y: b.y, flokk: f.id });
        if (f.n <= 0) {
            f.n = 0;
            f.død = true;
            g.hendelser.push({ type: 'død', flokk: f.id });
        }
    }

    // Fatene ruller hjem. Først i tønna teller de.
    const fv = T.fangst.fatFart * dt;
    g.fat = g.fat.filter((k) => {
        const d = dist(k.x, k.y, k.tx, k.ty);
        if (d <= fv) {
            g.tønne += T.fangst.fatVerdi;
            g.hendelser.push({ type: 'fat' });
            return false;
        }
        k.x += ((k.tx - k.x) / d) * fv;
        k.y += ((k.ty - k.y) / d) * fv;
        return true;
    });

    // Tomt hav: alle flokkene borte, eller for få hval igjen.
    const levende = g.flokker.filter((f) => !f.død);
    if (!levende.length || hvalIHavet(g) < T.tomtHav) return tap(g, 'tomt');

    g.iÅr += dt;
    const len = årLengde(g.år);
    if (g.iÅr >= len) {
        g.iÅr -= len;
        årsskifte(g);
    }
}
