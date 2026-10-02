// Fagkjernen som rene funksjoner: køen som går forfra, firingen, fristene
// (vannet og krengningen) og planleggeren robotene bruker.

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
    const maks = Math.max(...TUNING.krengning.map((p) => Math.abs(p.grader)));
    return base * (1 + (f.høyTreghet * Math.abs(krengning(t))) / maks);
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
 * Vinke: gruppa forrest i køen går om bord i båten på denne siden. Er gruppa større
 * enn plassene som er igjen, går de forreste om bord og resten blir stående først i køen.
 * Eleven velger aldri hvem - bare side.
 */
export function vink(g: Game, side: Side): number {
    if (g.mode !== 'play') return 0;
    g.hold = null;
    g.holdT = 0;
    const b = klarBåt(g, side);
    const forrest = g.kø[0];
    if (!b || !forrest || ledig(b) <= 0) return 0;
    const n = Math.min(forrest.antall, ledig(b));
    b.folk += n;
    b.fra[forrest.klasse - 1] += n;
    forrest.antall -= n;
    if (forrest.antall <= 0) g.kø.shift();
    g.hendelser.push({ t: g.t, slag: 'ombord', side });
    return n;
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
        const venterPort = gr.klasse === 3 && g.t < g.portÅpner ? g.portÅpner - g.t : 0;
        if (igjen + venterPort <= innen) n += gr.antall;
    }
    return n;
}

/**
 * Planleggeren: siste tidspunkt du kan begynne å fire hver båt som ikke er nede,
 * om alle båtene etter den skal rekke fristen sin. Regner bakfra med firingen i
 * serie (én hånd) og tiden neste båt trenger for å svinge ut.
 */
export function sisteStart(g: Game): Map<number, number> {
    const rest = g.båter.filter((b) => b.tilstand !== 'nede' && b.tilstand !== 'tapt');
    // Rekkefølge: brett for brett, innen brettet etter frist.
    rest.sort((a, b) => a.brett - b.brett || frist(a).t - frist(b).t);
    const ut = new Map<number, number>();
    let neste = Infinity;
    for (let i = rest.length - 1; i >= 0; i--) {
        const b = rest[i];
        // Firingen pluss tiden det tar å vinke køen om bord (ett grep per gruppe).
        const ft =
            firetid(b, Math.max(g.t, frist(b).t - 10)) * (1 - b.ned) +
            (b.ned > 0 ? 0 : (ledig(b) / TUNING.plan.gruppe) * TUNING.plan.vinkSek);
        const ferdig = Math.min(frist(b).t - 0.3, neste);
        const start = ferdig - ft;
        ut.set(b.nr, start);
        const nyttBrett = i > 0 && rest[i - 1].brett !== b.brett;
        neste = start - (nyttBrett ? TUNING.firing.kort + TUNING.firing.svingUt : 0.4);
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
    const maks = Math.max(...TUNING.krengning.map((x) => Math.abs(x.grader)));
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
export const nedeAntall = (g: Game) => g.båter.filter((b) => b.tilstand === 'nede').length;

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
