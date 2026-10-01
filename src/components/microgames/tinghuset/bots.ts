// Robotene i Tinghuset. Én kilde for både simuleringen (sim.ts) og selvspillet i
// nettleseren (usePlaytest i Tinghuset.tsx). De bruker de samme grepene som eleven:
// send(mappe, skranke) og pickCard(indeks).

import type { Rng } from '../sim';
import { deskLoad, pickCard, send } from './rules';
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

/** Så lenge (s) seende lar en mappe vente i leiren på tvillingen sin før den sender den. */
const HOLD_MAKS = 5;
/** Halvgod venter også på tvillingen, men gir opp tidligere. */
const HOLD_KORT = 2.5;

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

/** Skranken der tvillingen står i kø eller er på vei, om den er av riktig slag. */
function partnerDesk(g: Game, f: Folder, kind: Route): number {
    if (f.twin === null || f.twin < 0) return -1;
    const t = g.folders.find((x) => x.id === f.twin);
    if (!t || (t.state !== 'ko' && t.state !== 'reiser')) return -1;
    return g.desks[t.desk]?.kind === kind ? t.desk : -1;
}

/** Har tvillingen alt fått sin vei (sendt, i kø, behandlet eller avgjort)? */
function twinMoving(g: Game, f: Folder): boolean {
    if (g.waitingTwin.has(f.sak)) return true;
    if (f.twin === null || f.twin < 0) return false;
    const t = g.folders.find((x) => x.id === f.twin);
    return !!t && t.state !== 'leir';
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
        let f: Folder;
        if (opts.style === 'seende') {
            // Tvillingen til en sak som alt er på vei, går først - så holdes paret samlet i tid.
            // En mappe som venter på tvillingen sin, får vente litt (lik dom), men ikke for lenge
            // (sinnet stiger mer for den).
            const go = ready.filter((x) => x.twin !== -1 || g.t - x.born > HOLD_MAKS);
            const twin = ready.find((x) => twinMoving(g, x));
            if (twin) f = twin;
            else if (go.length) f = go.reduce((a, b) => (b.born < a.born ? b : a));
            else return;
        } else if (opts.style === 'halvgod') {
            // Husker regelen om like saker bare av og til, og venter for kort på tvillingen.
            const twin = rng() < 0.5 ? ready.find((x) => twinMoving(g, x)) : undefined;
            const go = ready.filter((x) => x.twin !== -1 || g.t - x.born > HOLD_KORT);
            if (!twin && !go.length) return;
            f = twin ?? go[Math.floor(rng() * go.length)];
        } else f = ready[0];

        const route: Route =
            opts.style === 'alt-rett'
                ? 'rett'
                : opts.style === 'alt-forelegg'
                  ? 'forelegg'
                  : f.kind === 'lett'
                    ? 'forelegg'
                    : 'rett';
        let desk: number;
        if (opts.style === 'halvgod') desk = roughDesk(g, route, rng);
        else if (opts.style === 'seende') {
            // Med Felles behandling går tvillingen til samme sal, så paret dømmes sammen.
            const p = g.felles && route === 'rett' ? partnerDesk(g, f, route) : -1;
            desk = p >= 0 ? p : bestDesk(g, route);
        } else desk = bestDesk(g, route);
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
