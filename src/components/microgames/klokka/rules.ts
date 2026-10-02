// Fagkjernen som rene funksjoner: landgangen og køen som går forfra, firingen,
// fristene (vannet og krengningen) og planleggeren robotene bruker.

import type { Side } from './levels';
import type { Båt, Game, Klasse } from './state';
import { SEK_PER_MIN, TUNING } from './tuning';

const lerpPunkter = (pts: readonly { t: number }[], key: string, t: number): number => {
    const v = (p: { t: number }) => (p as unknown as Record<string, number>)[key];
    if (t <= pts[0].t) return v(pts[0]);
    for (let i = 1; i < pts.length; i++)
        if (t <= pts[i].t) {
            const a = pts[i - 1];
            const b = pts[i];
            return v(a) + ((v(b) - v(a)) * (t - a.t)) / (b.t - a.t);
        }
    return v(pts[pts.length - 1]);
};

export const maksKrengning = Math.max(...TUNING.krengning.map((p) => Math.abs(p.grader)));

/** Krengning i grader: pluss mot styrbord, minus mot babord. */
export const krengning = (t: number) => lerpPunkter(TUNING.krengning, 'grader', t);
/** Vannhøyde i dekk (0 = G-dekk, 7 = båtdekket). */
export const vannDekk = (t: number) => lerpPunkter(TUNING.vann, 'dekk', t);

/** Tidspunktet krengningen låser styrbord-båtene (første gang den passerer grensen). */
export const låsTid = (() => {
    for (let t = 0; t <= TUNING.slutt; t += 0.1) if (-krengning(t) >= TUNING.låsGrader) return t;
    return Infinity;
})();

/** Kan krengningen låse denne båten? Bare livbåter og kuttere på styrbord. */
export const kanLåses = (b: Båt) => b.side === 'S' && b.slag !== 'sammenleggbar';

/** Fristen for en båt og hva som tar den: vannet eller krengningen. */
export function frist(b: Båt): { t: number; årsak: 'vann' | 'lås' } {
    if (kanLåses(b) && låsTid < b.frist) return { t: låsTid, årsak: 'lås' };
    return { t: b.frist, årsak: 'vann' };
}

/** Høy side = siden skipet IKKE krenger mot. */
export const høySide = (t: number): Side | null => {
    const k = krengning(t);
    return Math.abs(k) < 0.5 ? null : k > 0 ? 'B' : 'S';
};

/** Sekunder det tar å fire båten helt ned fra dekket, nå. */
export function firetid(b: Båt, t: number): number {
    const f = TUNING.firing;
    const base = f[b.slag];
    if (b.slag === 'sammenleggbar' || høySide(t) !== b.side) return base;
    return base * (1 + (f.høyTreghet * Math.abs(krengning(t))) / maksKrengning);
}

/** Alvoret 0-1: hvor fort første og andre klasse kommer opp (båter nede og raketter). */
export function alvor(g: Game): number {
    const a = TUNING.alvor;
    return Math.min(1, a.base + a.perBåt * nedeAntall(g) + a.perRakett * g.raketter.length);
}

export const ledig = (b: Båt) => b.plasser - b.folk;

/** Båten som henger klar på en side og kan ta folk (ikke begynt å fire). */
export function klarBåt(g: Game, side: Side): Båt | null {
    const i = g.davit[side];
    if (i === null) return null;
    const b = g.båter[i];
    return b.tilstand === 'henger' && b.ned === 0 ? b : null;
}

/**
 * Landgangen: bytt side med ett grep. Mens den svinger over (TUNING.landgang.bytt),
 * går ingen om bord. Eleven velger aldri hvem - bare side og når.
 */
export function bytt(g: Game, side?: Side) {
    if (g.mode !== 'play') return;
    const ny = side ?? (g.landgang === 'B' ? 'S' : 'B');
    if (ny === g.landgang) return;
    g.landgang = ny;
    g.landgangKlar = g.t + TUNING.landgang.bytt;
    g.valg++; // bytte side er et valg
    g.hendelser.push({ t: g.t, slag: 'bytt', side: ny });
}

/** Folk per sekund over landgangen mot en side nå (tregere mot den høye siden). */
export function landgangFart(g: Game, side: Side): number {
    const l = TUNING.landgang;
    if (høySide(g.t) !== side) return l.perSek;
    return l.perSek * (1 - (l.høySide * Math.abs(krengning(g.t))) / maksKrengning);
}

/**
 * Køen går over landgangen, forfra, inn i båten den peker mot (bare før firingen har
 * startet). Er gruppa større enn plassene som er igjen, blir resten stående først i køen.
 */
export function gåOmBord(g: Game, dt: number) {
    const b = klarBåt(g, g.landgang);
    if (!b || g.t < g.landgangKlar || !g.kø.length || ledig(b) <= 0) {
        g.landgangRest = 0;
        return;
    }
    g.landgangRest += dt * landgangFart(g, b.side);
    while (g.landgangRest >= 1 && g.kø.length && ledig(b) > 0) {
        const forrest = g.kø[0];
        b.folk++;
        b.fra[forrest.klasse - 1]++;
        forrest.antall--;
        g.landgangRest--;
        if (forrest.antall <= 0) g.kø.shift();
        g.hendelser.push({ t: g.t, slag: 'ombord', side: b.side, båt: b.nr, plass: b.folk - 1 });
    }
}

/** Holde (fire) på en side, eller slippe (null). */
export function hold(g: Game, side: Side | null) {
    if (g.hold !== side) g.holdT = 0;
    g.hold = side;
}

export const køAntall = (g: Game) => g.kø.reduce((s, x) => s + x.antall, 0);

/** Folk som når dekket innen så mange sekunder (gruppene som ses i trappene). */
export function påVei(g: Game, innen: number): number {
    let n = 0;
    for (const gr of g.grupper) {
        const igjen = (1 - gr.pos) * gr.gang;
        const venterPort = gr.klasse === 3 && !g.portÅpen ? Math.max(0, g.portÅpner - g.t) : 0;
        if (igjen + venterPort <= innen) n += gr.antall;
    }
    return n;
}

/**
 * Planleggeren: siste tidspunkt du kan begynne å fire hver båt som ikke er nede,
 * om alle båtene etter den skal rekke fristen sin. Regner bakfra med firingen i
 * serie (én hånd) og tiden neste båt på samme side trenger for å svinge ut.
 */
export function sisteStart(g: Game): Map<number, number> {
    const rest = g.båter.filter((b) => b.tilstand !== 'nede' && b.tilstand !== 'tapt');
    rest.sort((a, b) => frist(a).t - frist(b).t);
    const ut = new Map<number, number>();
    const f = TUNING.firing;
    let nesteHånd = Infinity;
    const nesteSide: Record<Side, number> = { B: Infinity, S: Infinity };
    for (let i = rest.length - 1; i >= 0; i--) {
        const b = rest[i];
        const ft = firetid(b, Math.max(g.t, frist(b).t - 10)) * (1 - b.ned);
        const ferdig = Math.min(
            frist(b).t - 0.3,
            nesteHånd - TUNING.plan.pause,
            nesteSide[b.side] - f.svingUt
        );
        const start = ferdig - ft;
        ut.set(b.nr, start);
        nesteHånd = start;
        nesteSide[b.side] = Math.min(nesteSide[b.side], start);
    }
    return ut;
}

/** Trekk et tall i [a, b]. */
export const mellom = (g: Game, [a, b]: readonly number[]) => a + g.rng() * (b - a);

/** Fasen for en klasse akkurat nå. */
export function fase(k: Klasse, t: number) {
    const fs = TUNING.klasser[k].faser;
    let f = fs[0];
    for (const x of fs) if (t >= x.fra) f = x;
    return f;
}

/** Presset 0-1: vannet stiger, skipet krenger, køen vokser. */
export function press(g: Game): number {
    const p = TUNING.press;
    const maks = maksKrengning;
    return Math.min(
        1,
        (p.vann * vannDekk(g.t)) / 7 +
            (p.krengning * Math.abs(krengning(g.t))) / maks +
            p.kø * Math.min(1, køAntall(g) / p.køFull)
    );
}

export const brukt = (g: Game) =>
    g.båter.filter((b) => b.tilstand === 'nede').reduce((s, b) => s + b.folk, 0);
export const tomme = (g: Game) =>
    g.båter.filter((b) => b.tilstand === 'nede').reduce((s, b) => s + ledig(b), 0);
/** Plasser i båter som vannet eller krengningen tok. */
export const taptePlasser = (g: Game) =>
    g.båter.filter((b) => b.tilstand === 'tapt').reduce((s, b) => s + b.plasser, 0);
export const ferdigBåter = (g: Game) =>
    g.båter.filter((b) => b.tilstand === 'nede' || b.tilstand === 'tapt').length;
export const nedeAntall = (g: Game) => g.båter.filter((b) => b.tilstand === 'nede').length;

/** Reddet fra hver klasse (folk i båter som er nede). */
export function reddetKlasse(g: Game): [number, number, number] {
    const r: [number, number, number] = [0, 0, 0];
    for (const b of g.båter)
        if (b.tilstand === 'nede') for (let k = 0; k < 3; k++) r[k] += b.fra[k];
    return r;
}

/** Folk fra tredje klasse bak porten eller på vei opp. */
export const tredjePåVei = (g: Game) =>
    g.grupper.reduce((s, gr) => s + (gr.klasse === 3 ? gr.antall : 0), 0);

/** Klokkeslett som tekst: «01.37». */
export function klokke(t: number): string {
    const m = Math.floor(45 + t / SEK_PER_MIN);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;
}

/** Rangen etter tomme plasser (siste rad i TUNING.ranger der tomme < grensen). */
export function rang(tommePlasser: number): string {
    let r = TUNING.ranger[0][1];
    for (const [grense, navn] of TUNING.ranger) if (tommePlasser < grense) r = navn;
    return r;
}
