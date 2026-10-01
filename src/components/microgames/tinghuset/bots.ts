// Robotene i Tinghuset. Én kilde for både simuleringen (sim.ts) og selvspillet i
// nettleseren (usePlaytest i Tinghuset.tsx). De bruker de samme grepene som eleven:
// send(mappe, skranke) og pickCard(indeks).

import type { Rng } from '../sim';
import { caseTime, deskLoad, pickCard, send } from './rules';
import { secsToStep } from './game';
import { TUNING } from './tuning';
import type { CardId, Folder, Game, Route } from './state';

type Style = 'seende' | 'halvgod' | 'alt-rett' | 'alt-forelegg';

interface BotOpts {
    /** Handler bare hvert n-te tick (0,2 s per tick). */
    every: number;
    style: Style;
}

export const BOTS: Record<Style, BotOpts> = {
    seende: { every: 1, style: 'seende' },
    halvgod: { every: 4, style: 'halvgod' },
    'alt-rett': { every: 1, style: 'alt-rett' },
    'alt-forelegg': { every: 1, style: 'alt-forelegg' },
};

const CARD_PREF: CardId[] = ['rettssal', 'felles', 'rute', 'dommere', 'forelegg'];

/** Så lenge (s) seende lar en alvorlig mappe vente i leiren på tvillingen sin. */
const HOLD_MAKS = 5;
/** Halvgod venter også på tvillingen, men gir opp tidligere. */
const HOLD_KORT = 2.5;
/** Seende holder et alvorlig par tilbake når et trinn faller om så få sekunder. */
const STEP_HOLD = 5;

/** Skranken av riktig slag med minst arbeid foran seg. */
function bestDesk(g: Game, kind: Route): number {
    let best = -1;
    let load = Infinity;
    g.desks.forEach((d, i) => {
        if (d.kind !== kind) return;
        const l = deskLoad(g, i);
        if (l < load) {
            load = l;
            best = i;
        }
    });
    return best;
}

/** Den skranken av riktig slag med kortest synlig kø - av og til en tilfeldig (unøyaktig). */
function roughDesk(g: Game, kind: Route, rng: Rng): number {
    const ids = g.desks.map((_, i) => i).filter((i) => g.desks[i].kind === kind);
    if (!ids.length) return -1;
    if (rng() < 0.25) return ids[Math.floor(rng() * ids.length)];
    const seen = (i: number) => g.desks[i].queue.length + (g.desks[i].current !== null ? 1 : 0);
    return ids.reduce((a, b) => (seen(b) < seen(a) ? b : a));
}

/** Tvillingen (i leir, på vei, i kø eller ved skranken), om den finnes. */
function twinOf(g: Game, f: Folder): Folder | undefined {
    if (f.twin === null || f.twin < 0) return undefined;
    return g.folders.find((x) => x.id === f.twin);
}

/** Har tvillingen alt fått sin vei (sendt, i kø, behandlet eller avgjort)? */
function twinMoving(g: Game, f: Folder): boolean {
    if (g.waitingTwin.has(f.sak)) return true;
    const t = twinOf(g, f);
    return !!t && t.state !== 'leir';
}

/** Omtrent når (s) en mappe som er sendt, får dommen sin. */
function finishOf(g: Game, f: Folder): number {
    const d = g.desks[f.desk];
    if (!d) return 0;
    if (f.state === 'behandles') return d.left;
    if (f.state === 'reiser') return f.travel + deskLoad(g, f.desk);
    let s = d.current !== null ? d.left : 0;
    for (const id of d.queue) {
        const q = g.folders.find((x) => x.id === id);
        if (q) s += caseTime(g, d, q);
        if (id === f.id) break;
    }
    return s;
}

/** Når (s) en ny mappe sendt til skranke `di` nå, får dommen sin. */
const finishAt = (g: Game, di: number, f: Folder) =>
    TUNING.skranke.reise + deskLoad(g, di) + caseTime(g, g.desks[di], f);

/** Skranken der mappa får dommen nærmest tvillingen sin i tid (lik trykt dom). */
function pairDesk(g: Game, f: Folder, kind: Route): number {
    const t = twinOf(g, f);
    const target = t && t.state !== 'leir' ? finishOf(g, t) : 0;
    // Felles behandling: står tvillingen i kø i en rettssal, går denne til samme sal.
    if (g.felles && kind === 'rett' && t?.state === 'ko' && g.desks[t.desk]?.kind === 'rett')
        return t.desk;
    let best = -1;
    let gap = Infinity;
    g.desks.forEach((d, i) => {
        if (d.kind !== kind) return;
        const x = Math.abs(finishAt(g, i, f) - target);
        if (x < gap) {
            gap = x;
            best = i;
        }
    });
    return best;
}

export function makeBot(opts: BotOpts, rng: Rng) {
    let n = 0;
    return (g: Game) => {
        if (g.mode !== 'play' || g.inter > 0) return;
        if (n++ % opts.every) return;
        if (g.offer) {
            const cards = g.offer.cards;
            if (opts.style === 'seende') {
                const i = CARD_PREF.map((c) => cards.indexOf(c)).find((x) => x >= 0) ?? 0;
                pickCard(g, i);
            } else if (opts.style === 'halvgod') pickCard(g, Math.floor(rng() * cards.length));
            else pickCard(g, 0);
            return;
        }
        const ready = g.folders.filter((f) => f.state === 'leir');
        if (!ready.length) return;
        const routeOf = (f: Folder): Route =>
            opts.style === 'alt-rett'
                ? 'rett'
                : opts.style === 'alt-forelegg'
                  ? 'forelegg'
                  : f.kind === 'lett'
                    ? 'forelegg'
                    : 'rett';
        let f: Folder | undefined;
        if (opts.style === 'seende') {
            // Lette saker får forelegg straks: fast takst, så paret blir alltid jevnt.
            // Tvillingen til en sak som alt er på vei, går så - da holdes paret samlet i tid.
            // En alvorlig mappe venter litt på tvillingen sin, men ikke for lenge (sinnet).
            // Faller et trinn snart, holdes et alvorlig par tilbake til det har falt.
            const soon = secsToStep(g) < STEP_HOLD;
            const holdPair = (x: Folder) =>
                soon && x.kind !== 'lett' && twinOf(g, x)?.state === 'leir';
            f =
                ready.find((x) => x.kind === 'lett') ??
                ready.find((x) => twinMoving(g, x)) ??
                ready
                    .filter(
                        (x) =>
                            !holdPair(x) &&
                            (x.twin !== -1 || g.t - x.born > HOLD_MAKS || x.kind === 'lett')
                    )
                    .reduce<
                        Folder | undefined
                    >((a, b) => (!a || b.born < a.born ? b : a), undefined);
        } else if (opts.style === 'halvgod') {
            // Husker regelen om like saker bare av og til, og venter for kort på tvillingen.
            const twin = rng() < 0.5 ? ready.find((x) => twinMoving(g, x)) : undefined;
            const go = ready.filter((x) => x.twin !== -1 || g.t - x.born > HOLD_KORT);
            f = twin ?? (go.length ? go[Math.floor(rng() * go.length)] : undefined);
        } else f = ready[0];
        if (!f) return;

        const route = routeOf(f);
        let desk: number;
        if (opts.style === 'halvgod') desk = roughDesk(g, route, rng);
        else if (opts.style === 'seende') desk = pairDesk(g, f, route);
        else desk = bestDesk(g, route);
        // Uten rettssal (brett 1) går alt til forelegg.
        send(g, f.id, desk >= 0 ? desk : bestDesk(g, 'forelegg'));
    };
}

/** Knappemoseren: tilfeldig mappe til tilfeldig skranke, tilfeldige kort. */
export function makeRandomBot(rng: Rng) {
    return (g: Game) => {
        if (g.mode !== 'play' || g.inter > 0) return;
        if (g.offer) {
            if (rng() < 0.3) pickCard(g, Math.floor(rng() * g.offer.cards.length));
            return;
        }
        if (rng() < 0.5) return;
        const ready = g.folders.filter((f) => f.state === 'leir');
        if (!ready.length) return;
        const f = ready[Math.floor(rng() * ready.length)];
        send(g, f.id, Math.floor(rng() * g.desks.length));
    };
}
