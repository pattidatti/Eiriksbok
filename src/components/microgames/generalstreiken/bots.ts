// Robotene. De bruker de samme grepene som eleven (styr og trykk i rules.ts).
// Én kilde: sim.ts og usePlaytest i komponenten leser begge herfra.
//
// Styringen: roboten får ett grep per BOT_EVERY (0,2 s). Den prøver alle svingene den
// rekker å legge i kø før neste grep, simulerer dem med de ekte reglene (ettSteg) og
// velger den som kommer nærmest en god fabrikk uten å stenge seg inne.

import { BOT_EVERY, type PlaytestBot } from '../playtest';
import type { Rng } from '../sim';
import { ettSteg } from './game';
import {
    bølgeAvstand,
    fart,
    kanAvslutte,
    kanGrenelle,
    millioner,
    styr,
    trykk,
    verdiFor,
} from './rules';
import { MOTSATT, type Game, type Retning } from './state';

type Grep = (g: Game) => void;
const RETNINGER: Retning[] = ['opp', 'ned', 'venstre', 'høyre'];

function klon(g: Game): Game {
    return {
        ...g,
        hode: { ...g.hode },
        body: g.body.slice(),
        verdi: g.verdi.slice(),
        kø: g.kø.slice(),
        fabrikker: g.fabrikker.slice(),
        brukteNavn: new Set(g.brukteNavn),
        hendelser: [],
    };
}

/** Når blir rute (x, y) ledig? 0 = ledig nå. Kjeden flytter seg ett ledd per steg. */
function ledigOm(g: Game): Int16Array {
    const { b, h } = g.brett;
    const a = new Int16Array(b * h);
    const L = g.body.length;
    g.body.forEach((c, j) => (a[c.y * b + c.x] = L - j));
    return a;
}

/** Avstand (steg) fra hver rute til fabrikken, rundt kjeden. -1 = umulig. */
function avstandTil(g: Game, fx: number, fy: number, ledig: Int16Array, hx: number, hy: number) {
    const { b, h } = g.brett;
    const d = new Int16Array(b * h).fill(-1);
    const q = new Int32Array(b * h);
    let qh = 0;
    let qt = 0;
    d[fy * b + fx] = 0;
    q[qt++] = fy * b + fx;
    while (qh < qt) {
        const i = q[qh++];
        const x = i % b;
        const y = (i - x) / b;
        for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= b || ny >= h) continue;
            const j = ny * b + nx;
            if (d[j] >= 0) continue;
            // Ruta er sperret om kjeden fortsatt ligger der når hodet kommer fram.
            if (ledig[j] > Math.abs(nx - hx) + Math.abs(ny - hy)) continue;
            d[j] = d[i] + 1;
            q[qt++] = j;
        }
    }
    return d;
}

/** Hvor mange ruter hodet kan nå (begrenset til `maks`). */
function plass(g: Game, maks: number) {
    const { b, h } = g.brett;
    const ledig = ledigOm(g);
    const sett = new Uint8Array(b * h);
    const q: [number, number, number][] = [[g.hode.x, g.hode.y, 0]];
    sett[g.hode.y * b + g.hode.x] = 1;
    let n = 0;
    while (q.length && n < maks) {
        const [x, y, s] = q.shift()!;
        n++;
        for (const r of RETNINGER) {
            const nx = x + (r === 'høyre' ? 1 : r === 'venstre' ? -1 : 0);
            const ny = y + (r === 'ned' ? 1 : r === 'opp' ? -1 : 0);
            if (nx < 0 || ny < 0 || nx >= b || ny >= h) continue;
            const j = ny * b + nx;
            if (sett[j] || ledig[j] > s + 1) continue;
            sett[j] = 1;
            q.push([nx, ny, s + 1]);
        }
    }
    return n;
}

/** Sekvensene roboten kan uttrykke nå: noen svinger først, så rett fram. */
function sekvenser(g: Game, maksSving: number): Retning[][] {
    const ut: Retning[][] = [[]];
    const bygg = (pre: Retning[], sist: Retning) => {
        if (pre.length >= maksSving) return;
        for (const r of RETNINGER) {
            if (r === sist || r === MOTSATT[sist]) continue;
            const s = [...pre, r];
            ut.push(s);
            bygg(s, r);
        }
    };
    bygg([], g.retning);
    return ut;
}

export interface Styring {
    /** Vekt på verdien til fabrikken (0 = alltid nærmeste). */
    verdiVekt: number;
    /** Sjekker roboten at den ikke stenger seg inne? */
    trygg: boolean;
    /** Sjanse per grep for å ikke følge med (en treg elev). */
    sover: number;
}

function styrMot(g: Game, s: Styring, rng: Rng) {
    if (g.mode !== 'play' || g.kø.length) return;
    if (s.sover > 0 && rng() < s.sover) return;
    const n = Math.max(1, Math.min(4, Math.floor(g.steg + fart(g) * BOT_EVERY) + 2));
    const ledig = ledigOm(g);
    const felt = g.fabrikker.map((f) => ({
        d: avstandTil(g, f.x, f.y, ledig, g.hode.x, g.hode.y),
        v: verdiFor(g, f),
    }));
    const b = g.brett.b;
    const kandidater = sekvenser(g, Math.min(n, 2)).map((seq) => {
        const k = klon(g);
        for (const r of seq) styr(k, r);
        const m0 = millioner(k);
        let spist = 0;
        for (let i = 0; i < n && k.mode === 'play'; i++) {
            const før = k.fabrikker.length;
            ettSteg(k);
            if (k.fabrikker.length < før) spist++;
        }
        const krasj = k.hendelser.some((h) => h.k === 'krasj');
        let score = 0;
        if (k.mode !== 'play') score += 1e6;
        if (krasj) score += 1e4 + (m0 - millioner(k)) * 1e3;
        score -= spist * 50;
        let best = 400;
        for (const f of felt) {
            const d = f.d[k.hode.y * b + k.hode.x];
            if (d < 0) continue;
            best = Math.min(best, d - s.verdiVekt * f.v * 10);
        }
        score += best;
        return { seq, k, score };
    });
    kandidater.sort((a, c) => a.score - c.score);
    let valgt = kandidater[0];
    if (s.trygg) {
        for (const c of kandidater.slice(0, 6)) {
            const trengs = Math.min(c.k.body.length + 6, 120);
            if (plass(c.k, trengs) >= trengs) {
                valgt = c;
                break;
            }
        }
    }
    for (const r of valgt.seq) styr(g, r);
}

export interface Knappeplan {
    /** Trykk GRENELLE fra så mange millioner (per brett, indeks 1 og 2). */
    grenelle: [number, number, number] | null;
    /** Hvor mange sekunder før fristen roboten trykker uansett. */
    fristMargin: number;
    /** Trykk AVSLUTT når bølgen er så nær (ledd), eller når millionene faller fra toppen. */
    avslutt: { nær: number; fall: number; over: number; nøyerSeg?: number } | null;
}

function knapper(g: Game, p: Knappeplan, topp: { m: number }) {
    if (g.mode !== 'play') return;
    const m = millioner(g);
    if (kanGrenelle(g) && p.grenelle) {
        const fristNær = g.brett.frist - g.bt < p.fristMargin;
        if (m >= p.grenelle[g.bi] || fristNær) {
            trykk(g);
            topp.m = m;
        }
        return;
    }
    if (kanAvslutte(g) && p.avslutt) {
        topp.m = Math.max(topp.m, m);
        // Den halvgode nøyer seg med mindre enn målet på brett 3 (lavere rang, ingen seier).
        const mål = g.bi === 2 && p.avslutt.nøyerSeg ? p.avslutt.nøyerSeg : g.brett.mål;
        const nær = bølgeAvstand(g) <= p.avslutt.nær;
        const faller = m <= topp.m - p.avslutt.fall;
        // Sikrer målet før millionene faller under det igjen.
        const sikre = topp.m >= mål + p.avslutt.over && m < mål + p.avslutt.over;
        if ((m >= mål && (nær || faller || sikre)) || bølgeAvstand(g) <= 2) trykk(g);
    }
}

function spiller(st: Styring, kp: Knappeplan) {
    return (rng: Rng): Grep => {
        const topp = { m: 0 };
        let bi = -1;
        return (g) => {
            if (g.bi !== bi) {
                bi = g.bi;
                topp.m = 0;
            }
            knapper(g, kp, topp);
            styrMot(g, st, rng);
        };
    };
}

function tilfeldig(rng: Rng): Grep {
    return (g) => {
        if (g.mode !== 'play') return;
        const r = rng();
        if (r < 0.06) trykk(g);
        else if (r < 0.6) styr(g, RETNINGER[Math.floor(rng() * 4)]);
    };
}

const GOD: Styring = { verdiVekt: 1, trygg: true, sover: 0 };

export interface BotDef {
    forventer: PlaytestBot['forventer'];
    tilfeldig?: boolean;
    beskrivelse: string;
    make: (rng: Rng) => Grep;
}

export const BOTS: Record<string, BotDef> = {
    streikeleder: {
        forventer: 'vinner',
        beskrivelse:
            'Styrer mot de beste fabrikkene uten å stenge seg inne, trykker GRENELLE når streiken er stor og AVSLUTT når bølgen nærmer seg eller millionene begynner å falle.',
        make: spiller(GOD, {
            grenelle: [99, 2.8, 7.6],
            fristMargin: 2,
            avslutt: { nær: 5, fall: 0.3, over: 0.4 },
        }),
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Tar nærmeste fabrikk, følger ikke alltid med, trykker GRENELLE tidlig og AVSLUTT med god margin til bølgen.',
        make: spiller(
            { verdiVekt: 0, trygg: true, sover: 0.25 },
            { grenelle: [99, 2.4, 4.5], fristMargin: 4, avslutt: { nær: 10, fall: 0.2, over: 0, nøyerSeg: 5 } }
        ),
    },
    'aldri-avslutt': {
        forventer: 'taper',
        beskrivelse:
            'Styrer like godt og trykker GRENELLE, men trykker aldri AVSLUTT - vil bare ha mer, til bølgen tar hodet.',
        make: spiller(GOD, { grenelle: [99, 2.8, 7.6], fristMargin: 2, avslutt: null }),
    },
    'aldri-grenelle': {
        forventer: 'taper',
        beskrivelse: 'Styrer like godt, men forhandler aldri - trykker aldri GRENELLE.',
        make: spiller(GOD, { grenelle: null, fristMargin: 0, avslutt: null }),
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Trykker tilfeldige piler og knappen uten plan.',
        make: (rng) => tilfeldig(rng),
    },
};
