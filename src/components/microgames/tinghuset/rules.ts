// Fagkjernen i Tinghuset - de tre reglene eleven skal huske:
//  1. Alvorlig sak hører hjemme i retten: rettssak er rettferdig, men treg (én sak av gangen,
//     kø); forelegg er raskt, men for mildt for angivere, statspoliti og profittører.
//  2. Uten lov, ingen sak: kvinner med tyske kjærester («tyskerjenter») hadde ikke brutt noen
//     lov. Riktig grep er å avvise saken - selv om sinnet i gatene stiger av det.
// Folkemengden er motspilleren: det riktige (avvise, rettssak for profittøren, vente på
// tvillingen) koster sinne. Det lettvinte er en ekte fristelse: INTERNER-stempelet (straff uten
// dom) roer gata kraftig, og et raskt forelegg tømmer køen for profittøren - men begge koster
// multiplikatoren, havner i protokollen og trekkes fra poengene på slutten.
//  3. Kalenderen gjør straffene mildere i synlige trinn - like saker avgjort på hver sin
//     side av et trinn, får ulik trykt dom.
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

const T = K.kalender.trinn;
const MAKS_TRINN = Math.round((1 - T.min) / T.pp);

/** Straffenivå-trinnet i en måned (0 = 100 %, 1 = 95 % ...). */
export function straffTrinn(mnd: number): number {
    return Math.min(MAKS_TRINN, Math.floor(Math.max(0, mnd - T.startMnd) / T.hverMnd));
}

/** Straffenivået i landet (1 = mai 1945, synker i trinn på 5 prosentpoeng). */
export function straffNivaa(mnd: number): number {
    return 1 - T.pp * straffTrinn(mnd);
}

/** Måneden neste trinn faller, eller null når nivået har nådd bunnen. */
export function nesteTrinnMnd(mnd: number): number | null {
    const t = straffTrinn(mnd);
    return t >= MAKS_TRINN ? null : T.startMnd + (t + 1) * T.hverMnd;
}

const kr = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Den trykte dommen for en sak avgjort på en vei i et trinn. Forelegg har fast takst. */
export function domTekst(kind: Folder['kind'], route: Route, trinn: number, grov = false): string {
    const D = K.dom;
    if (route === 'avvis') return 'Saken avvist';
    if (route === 'interner' || kind === 'utenlov') return 'Internert uten dom';
    if (route === 'forelegg') return D.forelegg;
    const niv = 1 - T.pp * trinn;
    if (grov) return niv >= D.grovNivaa - 1e-9 ? 'Dødsdom' : 'Livsvarig fengsel';
    if (kind === 'lett') return `Bot ${kr(Math.round((D.lettKr * niv) / 1000) * 1000)} kr`;
    const base = kind === 'alvorlig' ? D.alvorligAar : D.tykkAar;
    const aar = Math.round(base * niv * 2) / 2;
    return `${String(aar).replace('.', ',')} år fengsel`;
}

/** Hvor lenge en sak tar ved en skranke (s). */
export function caseTime(g: Game, d: Desk, f: Folder): number {
    if (d.kind === 'forelegg') return K.skranke.forelegg;
    if (d.kind === 'avvis') return K.skranke.avvis;
    if (d.kind === 'interner') return K.skranke.interner;
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

/** Interner-stempelet tar bare tyskerjente-saker, og de kan ikke få forelegg eller rettssak:
 *  for dem finnes bare to veier - avvis (lov) eller interner (uten dom). */
export function accepts(kind: Folder['kind'], route: Route): boolean {
    if (kind === 'utenlov') return route === 'avvis' || route === 'interner';
    return route !== 'interner';
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
    if (!accepts(f.kind, d.kind)) return false;
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

/** En sak er avgjort ved skranken. Poeng, sinne og par regnes her. */
export function decide(g: Game, f: Folder, route: Route) {
    const utenlov = f.kind === 'utenlov';
    // En ekte landssviksak som får forelegg (alvorlig) eller blir avvist, slipper for lett.
    const mild = !utenlov && ((route === 'forelegg' && f.kind !== 'lett') || route === 'avvis');
    const trinn = straffTrinn(g.mnd);
    const v: Verdict = {
        id: f.id,
        sak: f.sak,
        kind: f.kind,
        route,
        desk: f.desk,
        camp: f.camp,
        mnd: g.mnd,
        mild,
        ulovlig: utenlov && route !== 'avvis',
        grov: !!f.grov,
        trinn,
        dom: domTekst(f.kind, route, trinn, !!f.grov),
    };
    g.folders = g.folders.filter((x) => x.id !== f.id);
    g.avgjort++;
    if (utenlov) {
        if (route === 'avvis') {
            // Riktig: ingen lov, ingen sak. Folk i gatene ville se straff - sinnet stiger litt.
            g.score += K.poeng.avvist;
            g.sinne += K.sinne.avvist;
            g.fraAvvist += K.sinne.avvist;
            g.avvist++;
            g.events.push({ kind: 'avvist', v });
        } else {
            // Straff uten dom: gata roer seg kraftig, men ingen poeng, multiplikatoren faller
            // til x1, og saken trekkes fra poengene på slutten.
            g.sinne = Math.max(0, g.sinne - K.sinne.ulovligLetter);
            g.mult = 1;
            g.ulovlig++;
            g.events.push({ kind: 'ulovlig', v });
        }
        return;
    }
    if (mild && f.kind === 'tykk' && route === 'forelegg') {
        // Profittøren slapp med bot: raskt, og gata merker lite - men dommen er for mild.
        g.sinne = Math.max(0, g.sinne - K.sinne.botLetter);
        g.mult = 1;
        g.profBot++;
        g.events.push({ kind: 'formildt', v });
    } else if (mild) {
        const jump = K.sinne.forMildt * (f.kind === 'lett' ? K.sinne.avvistLett : 1);
        g.sinne += jump;
        g.fraMild += jump;
        g.mult = 1;
        g.formildt++;
        g.events.push({ kind: 'formildt', v });
    } else {
        if (route === 'forelegg') g.score += K.poeng.lettForelegg;
        else if (f.kind !== 'lett') {
            g.score += K.poeng.alvorligRett;
            g.alvorligRett++;
            // Gata ser en dom og roer seg - men mildere dommer roer mindre (1946-48).
            const roer = K.sinne.rettLetter * Math.pow(straffNivaa(g.mnd), K.sinne.rettNivaaEksp);
            g.sinne = Math.max(0, g.sinne - roer);
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

/** To like saker er avgjort: jevnt når den trykte dommen er lik, ellers ulikt. */
function judgePair(g: Game, a: Verdict, b: Verdict) {
    const even = a.dom === b.dom && !a.mild && !b.mild;
    if (even) {
        // Forelegg holder multiplikatoren; bare et jevnt par i rettssalen øker den.
        const rett = a.route === 'rett';
        const poeng = (rett ? K.poeng.jevntPar : K.poeng.jevntForelegg) * g.mult;
        g.score += poeng;
        g.jevne++;
        if (rett) g.mult = Math.min(K.poeng.maksMult, g.mult + 1);
        g.events.push({ kind: 'jevnt', a, b, poeng });
        return;
    }
    g.ulike++;
    // Et ulikt par halverer multiplikatoren (x8 -> x4). Bare forelegg i en alvorlig sak gir x1.
    g.mult = Math.max(1, Math.floor(g.mult / 2));
    const skjevhet =
        Math.abs(a.trinn - b.trinn) + (a.route !== b.route || a.mild || b.mild ? 12 : 0);
    if (!g.skjevest || skjevhet > g.skjevest.skjevhet) g.skjevest = { a, b, skjevhet };
    g.events.push({ kind: 'ulikt', a, b });
}

/** Regningen på slutten: straff uten dom og profittører som slapp unna trekkes fra poengene. */
export function sluttRegning(g: Game) {
    g.trekk = g.ulovlig * K.poeng.trekkUlovlig + g.profBot * K.poeng.trekkSlapp;
    g.score = Math.max(0, g.score - g.trekk);
}

/** Interner-stempelet glir inn (sommeren 1945): straff uten dom blir mulig - og fristende. */
export function openInterner(g: Game) {
    if (g.desks.some((d) => d.kind === 'interner')) return;
    g.desks.push({ kind: 'interner', queue: [], current: null, joint: null, left: 0, total: 0 });
    g.events.push({ kind: 'interner' });
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
