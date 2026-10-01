// Fagkjernen i Tinghuset - de tre reglene eleven skal huske:
//  1. Rettssak er rettferdig, men treg (én sak av gangen, kø).
//  2. Forelegg er raskt, men for mildt for alvorlige saker (sinnet hopper).
//  3. Kalenderen gjør straffene mildere måned for måned - like saker avgjort med mange
//     måneder imellom, får ulik straff.
// Her står grepene eleven gjør (send, velg kort) og hva som skjer når en sak avgjøres.

import { TUNING } from './tuning';
import { LEVELS } from './levels';
import {
    folderById,
    type CardId,
    type Desk,
    type Folder,
    type Game,
    type Route,
    type Verdict,
} from './state';

const K = TUNING;

/** Straffenivået i landet (1 = mai 1945, synker mot 1 - straffFall). */
export function straffNivaa(mnd: number): number {
    return 1 - K.kalender.straffFall * Math.min(1, Math.max(0, mnd / K.kalender.straffMnd));
}

/** Hvor lenge en sak tar ved en skranke (s). */
export function caseTime(g: Game, d: Desk, f: Folder): number {
    if (d.kind === 'forelegg') return K.skranke.forelegg;
    const base = f.kind === 'tykk' ? K.skranke.tykkRettssak : K.skranke.rettssak;
    return base * Math.pow(1 - K.skranke.dommereFart, g.dommere);
}

/** Køen ved en skranke i sekunder arbeid som ligger foran en ny sak. */
export function deskLoad(g: Game, di: number): number {
    const d = g.desks[di];
    let s = d.current !== null ? d.left : 0;
    for (const id of d.queue) {
        const f = folderById(g, id);
        if (f) s += caseTime(g, d, f);
    }
    for (const f of g.folders) if (f.state === 'reiser' && f.desk === di) s += caseTime(g, d, f);
    return s;
}

/**
 * Elevens grep: dra en strek fra en mappe i en leir til en skranke. Mappa glir langs
 * streken og stiller seg i køen. Gir false om grepet ikke er lovlig.
 */
export function send(g: Game, folderId: number, deskIdx: number): boolean {
    if (g.mode !== 'play' || g.inter > 0) return false;
    const f = folderById(g, folderId);
    const d = g.desks[deskIdx];
    if (!f || !d || f.state !== 'leir') return false;
    f.state = 'reiser';
    f.desk = deskIdx;
    f.travel = K.skranke.reise;
    return true;
}

/** Elevens grep: velg ett av kortene som ligger oppe. */
export function pickCard(g: Game, idx: number): boolean {
    const o = g.offer;
    if (!o || idx < 0 || idx >= o.cards.length) return false;
    applyCard(g, o.cards[idx]);
    g.offer = null;
    return true;
}

export function applyCard(g: Game, c: CardId) {
    switch (c) {
        case 'rettssal':
            g.desks.push({
                kind: 'rett',
                queue: [],
                current: null,
                joint: null,
                left: 0,
                total: 0,
            });
            break;
        case 'forelegg':
            g.desks.push({
                kind: 'forelegg',
                queue: [],
                current: null,
                joint: null,
                left: 0,
                total: 0,
            });
            break;
        case 'dommere':
            g.dommere++;
            break;
        case 'rute': {
            const free = g.camps.findIndex((_, i) => !g.ruter.includes(i));
            if (free >= 0) g.ruter.push(free);
            break;
        }
        case 'felles':
            g.felles = true;
            break;
    }
}

/** Tre kort å velge mellom. Det første kortvalget er fast: svaret på køen eleven nettopp så. */
export function makeOffer(g: Game): CardId[] {
    if (g.offers === 0) return ['rettssal', 'rute', 'felles'];
    const pool: CardId[] = [];
    if (g.dommere < K.skranke.maksDommere) pool.push('dommere');
    const count = (k: Route) => g.desks.filter((d) => d.kind === k).length;
    // Kortene gir bare litt mer enn det brettet selv åpner (se maksSaler i tuning.ts).
    if (count('rett') < LEVELS[g.level].saler + K.skranke.maksSaler) pool.push('rettssal');
    if (count('forelegg') < 1 + K.skranke.maksForelegg) pool.push('forelegg');
    if (g.ruter.length < g.camps.length) pool.push('rute');
    if (!g.felles) pool.push('felles');
    const out: CardId[] = [];
    while (out.length < 3 && pool.length) {
        const i = Math.floor(g.rng() * pool.length);
        out.push(pool.splice(i, 1)[0]);
    }
    return out;
}

/** Straffen i år for en sak avgjort i retten nå. */
function years(kind: Folder['kind'], mnd: number): number {
    const base = kind === 'alvorlig' ? 8 : kind === 'tykk' ? 4 : 1;
    return Math.max(0.5, Math.round(base * straffNivaa(mnd) * 2) / 2);
}

/** En sak er avgjort ved skranken. Poeng, sinne og par regnes her. */
export function decide(g: Game, f: Folder, route: Route) {
    const mild = route === 'forelegg' && f.kind !== 'lett';
    const v: Verdict = {
        id: f.id,
        sak: f.sak,
        kind: f.kind,
        route,
        mnd: g.mnd,
        mild,
        aar: route === 'rett' ? years(f.kind, g.mnd) : 0,
    };
    g.folders = g.folders.filter((x) => x.id !== f.id);
    g.avgjort++;
    if (mild) {
        g.sinne += K.sinne.forMildt;
        g.fraMild += K.sinne.forMildt;
        g.mult = 1;
        g.formildt++;
        g.events.push({ kind: 'formildt', v });
    } else {
        if (route === 'forelegg') g.score += K.poeng.lettForelegg;
        else if (f.kind !== 'lett') {
            g.score += K.poeng.alvorligRett;
            g.alvorligRett++;
            g.sinne = Math.max(0, g.sinne - K.sinne.rettLetter);
        }
        g.events.push({ kind: 'avgjort', v });
    }
    if (f.twin === null) return;
    const other = g.waitingTwin.get(f.sak);
    if (!other) {
        g.waitingTwin.set(f.sak, v);
        return;
    }
    g.waitingTwin.delete(f.sak);
    judgePair(g, other, v);
}

/** To like saker er avgjort: jevnt eller ulikt? */
function judgePair(g: Game, a: Verdict, b: Verdict) {
    const gap = Math.abs(a.mnd - b.mnd);
    const even = a.route === b.route && !a.mild && !b.mild && gap <= K.kalender.jevnMnd;
    if (even) {
        const poeng = K.poeng.jevntPar * g.mult;
        g.score += poeng;
        g.jevne++;
        g.mult = Math.min(K.poeng.maksMult, g.mult + 1);
        g.events.push({ kind: 'jevnt', a, b, poeng });
        return;
    }
    g.ulike++;
    g.mult = 1;
    const skjevhet = gap + (a.route !== b.route || a.mild || b.mild ? 12 : 0);
    if (!g.skjevest || skjevhet > g.skjevest.skjevhet) g.skjevest = { a, b, skjevhet };
    g.events.push({ kind: 'ulikt', a, b });
}

/** Skrankene jobber: start neste sak i køen, avgjør den som er ferdig. */
export function runDesks(g: Game, dt: number) {
    for (const d of g.desks) {
        if (d.current === null && d.queue.length) {
            const id = d.queue.shift()!;
            const f = folderById(g, id);
            if (!f) continue;
            f.state = 'behandles';
            d.current = id;
            d.left = d.total = caseTime(g, d, f);
            d.joint = null;
            // Felles behandling: tvillingen i samme kø avgjøres samtidig.
            if (g.felles && d.kind === 'rett' && f.twin !== null) {
                const qi = d.queue.indexOf(f.twin);
                if (qi >= 0) {
                    d.queue.splice(qi, 1);
                    d.joint = f.twin;
                    const t = folderById(g, f.twin);
                    if (t) t.state = 'behandles';
                }
            }
        }
        if (d.current === null) continue;
        d.left -= dt;
        if (d.left > 0) continue;
        const f = folderById(g, d.current);
        const t = d.joint !== null ? folderById(g, d.joint) : undefined;
        d.current = null;
        d.joint = null;
        if (f) decide(g, f, d.kind);
        if (t) decide(g, t, d.kind);
    }
}

/** Mapper som har glidd ferdig langs streken, stiller seg i køen. */
export function runTravel(g: Game, dt: number) {
    for (const f of g.folders) {
        if (f.state !== 'reiser') continue;
        f.travel -= dt;
        if (f.travel <= 0) {
            f.state = 'ko';
            g.desks[f.desk].queue.push(f.id);
        }
    }
}

/** Fast rute: en strek som sender lette saker fra én leir til forelegg av seg selv. */
export function runRoutes(g: Game, dt: number) {
    if (!g.ruter.length) return;
    g.ruteT -= dt;
    if (g.ruteT > 0) return;
    g.ruteT = K.skranke.ruteHvert;
    for (const ci of g.ruter) {
        const f = g.folders.find((x) => x.state === 'leir' && x.camp === ci && x.kind === 'lett');
        if (!f) continue;
        let best = -1;
        let load = Infinity;
        g.desks.forEach((d, i) => {
            if (d.kind !== 'forelegg') return;
            const l = deskLoad(g, i);
            if (l < load) {
                load = l;
                best = i;
            }
        });
        if (best >= 0) send(g, f.id, best);
    }
}
