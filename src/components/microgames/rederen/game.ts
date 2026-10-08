// Kjerneløkka i Rederens kart: dra båter ut på flokker, fatene ruller hjem, flokkene føder
// sakte, og hver båt koster olje ved hvert årsskifte - mye på havet, lite i havna. Ren TypeScript: komponenten,
// robotene og simuleringen kjører den samme koden.

import { BRETT, KART, brettFor, iSone, type KartId } from './levels';
import {
    dist,
    fangerFra,
    fastKost,
    fødselsrate,
    havnKost,
    hvalIHavet,
    iRo,
    markedÅpent,
    prisFor,
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
    /** Født og tatt hittil i år. */
    født: number;
    tatt: number;
    /** Netto per sekund akkurat nå: fødsler minus fangst. Ringen er grønn når den er >= 0. */
    netto: number;
    /** Året flokken døde (for tap-bildet). */
    dødÅr: number | null;
    /** Har vært nesten tom (under en firedel): blir den stor igjen, er den reddet. */
    kritisk: boolean;
    /** Blåhval (fredes i 1966). */
    blåhval?: boolean;
    /** Låst: fangst forbudt her (Finnmark 1903, blåhvalen 1966). Flokken lever og føder videre. */
    fredet: boolean;
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
    /** Ligger (eller seiler) i havna: koster lite. */
    hjemme: boolean;
    /** Står til salgs i havna. Dra den ut for å kjøpe (koster `pris` fra tønna). */
    tilbud: boolean;
    pris: number;
    /** Flokken båten følger etter, og hvor ved flokken den ligger. */
    følger: number | null;
    ox: number;
    oy: number;
}

export interface Fat {
    x: number;
    y: number;
    tx: number;
    ty: number;
}

export type Hendelse =
    | { type: 'brett'; brett: number }
    | { type: 'tilbud'; id: number }
    | { type: 'kjøp'; id: number; pris: number }
    | { type: 'forDyr'; id: number }
    | { type: 'reddet'; flokk: number }
    | { type: 'fangst'; x: number; y: number; flokk: number }
    | { type: 'unge'; flokk: number }
    | { type: 'død'; flokk: number }
    | { type: 'fat' }
    | {
          type: 'årsskifte';
          kost: number;
          inn: number;
          grønt: boolean;
          betalt: { id: number; kost: number }[];
      }
    | { type: 'slipp'; id: number }
    | { type: 'tap'; årsak: Årsak }
    /** Prisen falt ved nyttår: for mange fat på ett år. `tap` = olje tønna mistet i verdi. */
    | { type: 'krakk'; fra: number; til: number; tap: number; fat: number }
    | { type: 'marked' }
    | { type: 'fredning'; hva: 'finnmark' | 'blåhval'; flokker: number[] }
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
    /** Båtene som var ute (full pris) ved siste årsskifte. */
    tappere: number[];
    /** Regnskapet: olje inn hittil i år, og fjorårets inn og ut (vises ved tønna og i tap-bildet). */
    innIÅr: number;
    /** Oljemarkedet: fat på lageret i verden (tømmes jevnt), prisen nå (1 = full), fat inn i år. */
    lager: number;
    pris: number;
    fatIÅr: number;
    sist: { år: number; inn: number; ut: number; fast: number; fat: number } | null;
    /** Sekunder til det nye arket kommer (etter forbudet i Finnmark), ellers null. */
    byttOm: number | null;
    /** Neste båt til salgs (indeks i TUNING.tilbud). */
    tilbudNeste: number;
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
            dødÅr: null,
            kritisk: false,
            fredet: false,
        };
        const p = sløyfe(f, f.fase, g.t);
        f.x = p.x;
        f.y = p.y;
        g.flokker.push(f);
    }
}

/** Båtens faste plass i havna (plassene står i kartarket), kokeriet på sin egen plass. */
export function havnPlass(g: Game, b: Båt) {
    const k = KART[g.kart];
    if (b.kokeri) return { x: k.kokeriPlass[0], y: k.kokeriPlass[1] };
    const i = g.båter.filter((v) => !v.kokeri).indexOf(b);
    const p = k.plasser[Math.max(0, i) % k.plasser.length];
    return { x: p[0], y: p[1] };
}

function tilHavn(g: Game, b: Båt) {
    const p = havnPlass(g, b);
    b.tx = p.x;
    b.ty = p.y;
    b.hjemme = true;
    b.følger = null;
}

function nyBåt(g: Game, kokeri: boolean, pris = 0): Båt {
    // Nye båter legger seg i havna. Til salgs koster de ingenting før eleven kjøper dem.
    const b: Båt = {
        id: g.nesteId++,
        kokeri,
        x: 0,
        y: 0,
        tx: 0,
        ty: 0,
        klokke: T.fangst.intervall,
        hjemme: true,
        tilbud: pris > 0,
        pris,
        følger: null,
        ox: 0,
        oy: 0,
    };
    g.båter.push(b);
    tilHavn(g, b);
    b.x = b.tx;
    b.y = b.ty;
    return b;
}

/** Ny teknikk: en båt (eller kokeriet) legger seg til salgs i havna. Eleven velger selv om den kjøpes. */
function fyllTilbud(g: Game) {
    const liste = T.tilbud;
    while (g.tilbudNeste < liste.length && liste[g.tilbudNeste].fra <= g.år) {
        if (g.båter.filter((b) => b.tilbud).length >= T.maksTilbud) return;
        const t = liste[g.tilbudNeste++];
        const b = nyBåt(g, t.kokeri, t.pris);
        g.hendelser.push({ type: 'tilbud', id: b.id });
    }
}

function startBrett(g: Game, brett: number) {
    g.brett = brett;
    const def = BRETT[brett];
    if (def.kart) {
        // Nytt kartark: det gamle havet er stengt. Fat underveis kommer hjem, båtene seiler hjem.
        g.tønne += g.fat.length * T.fangst.fatVerdi * g.pris;
        g.innIÅr += g.fat.length * T.fangst.fatVerdi * g.pris;
        g.fatIÅr += g.fat.length;
        g.fat = [];
        g.kart = def.kart;
        g.havn = { ...KART[def.kart].havn };
        g.flokker = [];
        for (const b of g.båter) {
            tilHavn(g, b);
            b.x = b.tx;
            b.y = b.ty;
        }
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
        tappere: [],
        innIÅr: 0,
        lager: 0,
        pris: 1,
        fatIÅr: 0,
        sist: null,
        tilbudNeste: 0,
        byttOm: null,
        nesteId: 1,
        hendelser: [],
        rng: mulberry(seed),
    };
    startBrett(g, 0);
    for (let i = 0; i < T.startBåter; i++) nyBåt(g, false);
    // Den siste båten er alt ute ved den nærmeste flokken: ringen er rød fra første sekund.
    const ute = g.båter[g.båter.length - 1];
    const nær = g.flokker[0];
    ute.hjemme = false;
    ute.følger = nær.id;
    ute.ox = T.båt.følgAvstand;
    ute.oy = 0;
    ute.x = ute.tx = nær.x + ute.ox;
    ute.y = ute.ty = nær.y;
    fyllTilbud(g);
    return g;
}

/**
 * Grepet: send en båt (eller kokeriet) til et sted på kartet. Det eneste eleven gjør.
 * Slipper du båten på en flokk, følger den flokken til du flytter den. Slipper du den ved
 * havna, legger den seg på plassen sin der.
 */
export function send(g: Game, id: number, x: number, y: number) {
    if (g.mode !== 'play') return;
    const b = g.båter.find((k) => k.id === id);
    if (!b) return;
    const { w, h } = T.flate;
    x = Math.max(10, Math.min(w - 10, x));
    y = Math.max(10, Math.min(h - 10, y));
    const iHavna = iSone(KART[g.kart], x, y);
    if (b.tilbud) {
        // Kjøpet: dra båten ut av havna. Har tønna ikke nok olje, blir den stående.
        if (iHavna) return;
        if (g.tønne < b.pris) {
            g.hendelser.push({ type: 'forDyr', id });
            return;
        }
        g.tønne -= b.pris;
        b.tilbud = false;
        g.hendelser.push({ type: 'kjøp', id, pris: b.pris });
    }
    const fraX = b.tx;
    const fraY = b.ty;
    const varHjemme = b.hjemme;
    if (iHavna) {
        tilHavn(g, b);
    } else {
        b.hjemme = false;
        b.følger = null;
        b.tx = x;
        b.ty = y;
        if (!b.kokeri) {
            let bd = T.fangst.radius;
            for (const f of g.flokker) {
                const d = dist(x, y, f.x, f.y);
                if (f.død || f.fredet || d > bd) continue;
                bd = d;
                b.følger = f.id;
                // Behold litt av avstanden, så to båter ved samme flokk ikke ligger oppå hverandre.
                const m = T.båt.følgAvstand;
                const k = d > m ? m / d : 1;
                b.ox = (x - f.x) * k;
                b.oy = (y - f.y) * k;
            }
        }
    }
    if (b.hjemme !== varHjemme || dist(b.tx, b.ty, fraX, fraY) > T.båt.nyttStedPx) g.valg++;
    g.hendelser.push({ type: 'slipp', id });
}

/** Nærmeste sted fatene kan rulle til: havna eller kokeriet. */
function mottak(g: Game, x: number, y: number) {
    let best = { x: g.havn.x, y: g.havn.y };
    let bd = dist(x, y, best.x, best.y);
    for (const b of g.båter) {
        if (!b.kokeri || b.tilbud) continue;
        const d = dist(x, y, b.x, b.y);
        if (d < bd) {
            bd = d;
            best = { x: b.x, y: b.y };
        }
    }
    return best;
}

/** Oljemarkedet ved nyttår: er lageret i verden for fullt, mister oljen i tønna verdi. */
function marked(g: Game) {
    if (g.år < T.marked.fra || g.pris >= 1) return;
    const før = Math.max(0, g.tønne);
    g.tønne = før * g.pris;
    g.hendelser.push({ type: 'krakk', fra: 1, til: g.pris, tap: før - g.tønne, fat: g.fatIÅr });
}

/** Fredning: flokkene låses, og båtene som lå der, seiler hjem. */
function fred(g: Game, hva: 'finnmark' | 'blåhval') {
    const låst = g.flokker.filter((f) => !f.død && (hva === 'finnmark' || f.blåhval));
    for (const f of låst) f.fredet = true;
    for (const b of g.båter)
        if (b.følger !== null && låst.some((f) => f.id === b.følger)) tilHavn(g, b);
    g.hendelser.push({ type: 'fredning', hva, flokker: låst.map((f) => f.id) });
}

function årsskifte(g: Game) {
    marked(g);
    const kost = årsKost(g);
    const betalt = g.båter.map((b) => ({ id: b.id, kost: havnKost(g, b) }));
    g.tappere = g.båter.filter((b) => !b.hjemme).map((b) => b.id);
    // Grønt år: du fanget, og havet har minst like mange hval som da året begynte.
    const grønt = g.tattIÅr > 0 && hvalIHavet(g) >= g.hvalVedÅrStart;
    g.grønnRekke = grønt ? g.grønnRekke + 1 : 0;
    if (grønt) g.grønneÅr++;
    const bonus = T.poeng.grønnBonus;
    g.poeng += T.poeng.perÅr + (grønt ? bonus[Math.min(g.grønnRekke, bonus.length) - 1] : 0);
    g.tønne -= kost;
    g.sist = { år: g.år, inn: g.innIÅr, ut: kost, fast: fastKost(g.år), fat: g.fatIÅr };
    g.hendelser.push({ type: 'årsskifte', kost, inn: g.innIÅr, grønt, betalt });
    g.år++;
    g.tattIÅr = 0;
    g.innIÅr = 0;
    g.fatIÅr = 0;
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
    if (g.år === T.fredning.finnmark && g.kart === 'finnmark') {
        // Forbudet kommer først: flokkene låses og båtene seiler hjem. Så kommer det nye arket.
        fred(g, 'finnmark');
        g.byttOm = T.fredning.finnmarkVent;
    } else if (b !== g.brett) startBrett(g, b);
    if (g.år === T.marked.fra) g.hendelser.push({ type: 'marked' });
    if (g.år === T.fredning.blåhval) fred(g, 'blåhval');
    fyllTilbud(g);
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
        if (!f.død && f.n < f.maks * 0.25) f.kritisk = true;
        if (f.kritisk && f.n >= f.maks * 0.5) {
            f.kritisk = false;
            g.hendelser.push({ type: 'reddet', flokk: f.id });
        }
    }

    // Båtene tøffer mot målet og fanger når de ligger i ro ved en flokk (regel 1).
    for (const b of g.båter) {
        if (b.følger !== null) {
            const f = g.flokker.find((k) => k.id === b.følger);
            if (!f || f.død) b.følger = null;
            else {
                b.tx = Math.max(10, Math.min(T.flate.w - 10, f.x + b.ox));
                b.ty = Math.max(10, Math.min(T.flate.h - 10, f.y + b.oy));
            }
        }
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
            f.dødÅr = g.år;
            b.følger = null;
            g.hendelser.push({ type: 'død', flokk: f.id });
        }
    }

    // Fatene ruller hjem. Først i tønna teller de.
    const fv = T.fangst.fatFart * dt;
    g.fat = g.fat.filter((k) => {
        const d = dist(k.x, k.y, k.tx, k.ty);
        if (d <= fv) {
            g.tønne += T.fangst.fatVerdi * g.pris;
            g.innIÅr += T.fangst.fatVerdi * g.pris;
            g.fatIÅr++;
            if (markedÅpent(g)) {
                g.lager++;
                g.pris = prisFor(g.lager);
            }
            g.hendelser.push({ type: 'fat' });
            return false;
        }
        k.x += ((k.tx - k.x) / d) * fv;
        k.y += ((k.ty - k.y) / d) * fv;
        return true;
    });

    if (g.byttOm !== null) {
        g.byttOm -= dt;
        if (g.byttOm <= 0) {
            g.byttOm = null;
            startBrett(g, brettFor(g.år));
        }
    }

    // Verden kjøper olje jevnt: lageret tømmes, og prisen kommer seg.
    if (markedÅpent(g)) {
        g.lager = Math.max(0, g.lager - (T.marked.kjøpPerÅr / årLengde(g.år)) * dt);
        g.pris = prisFor(g.lager);
    }

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
