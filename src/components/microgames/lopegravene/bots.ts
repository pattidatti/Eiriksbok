import type { Rng } from '../sim';
import {
    COLS,
    ROWS,
    FORT_ROW,
    TOWERS,
    build,
    buildCost,
    canBuild,
    cellAt,
    has,
    pickCard,
    upgrade,
    upgradeCost,
    sell,
    allowed,
    rally,
    digRoutePreview,
    type CardId,
    type G,
    type IO,
    type TowerKind,
    type Route,
} from './game';

// Selvspill-robotene for Løpegravene. De bruker de samme grepene som eleven (build,
// upgrade, sell, pickCard) og ser bare det eleven ser: grøftene som er gravd, grøfta
// graverne holder på med, og tårnene.
//
// Tre vinnere med helt ulik strategi - eierens krav er at flere byggestiler kan vinne:
//   tunge   - få, sterke tårn: mortere over grøftene, én kanon ved glacis, oppgradert helt.
//   mange   - mange billige musketerlag langs glacis, der fienden står uten dekning.
//   feller  - kontraminer i grøftene, spredt utover, og noen musketerer som reserve.

export type BotStyle = 'tunge' | 'mange' | 'feller' | 'halvgod' | 'flat-ild' | 'tilfeldig';

export const BOTS: Record<
    BotStyle,
    { forventer: 'vinner' | 'middels' | 'taper'; tilfeldig?: boolean; beskrivelse: string; style: BotStyle }
> = {
    tunge: {
        forventer: 'vinner',
        style: 'tunge',
        beskrivelse:
            'Få sterke tårn: en morter over hver grøft (høy bue treffer ned i grøfta), en kanon ved glacis mot ryttere og beleiringskanoner, og oppgraderer alt til topps.',
    },
    mange: {
        forventer: 'vinner',
        style: 'mange',
        beskrivelse:
            'Mange billige musketerlag der grøftene slutter - fienden må over den åpne glacisen uten dekning.',
    },
    feller: {
        forventer: 'vinner',
        style: 'feller',
        beskrivelse: 'Kontraminer spredt i grøftene (sprenger nedenfra, bryr seg ikke om dekning), og noen musketerer ved glacis.',
    },
    halvgod: {
        forventer: 'middels',
        style: 'halvgod',
        beskrivelse: 'Bygger som den tunge, men seint, på nest beste plass, og velger kort tilfeldig.',
    },
    'flat-ild': {
        forventer: 'taper',
        style: 'flat-ild',
        beskrivelse:
            'Ignorerer dekningen: stiller musketerer og kanoner langs midten av grøftene og skyter flatt ned i dem. Aldri morter eller mine.',
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        style: 'tilfeldig',
        beskrivelse: 'Bygger, oppgraderer, selger og velger kort tilfeldig uten plan.',
    },
};

const PREF: Record<BotStyle, CardId[]> = {
    tunge: ['bombarder', 'rask-lading', 'lang-lunte', 'jordvoller', 'brannbomber', 'tordenskjold', 'glodende', 'krigskassen', 'skanser'],
    mange: ['pelotong', 'jordvoller', 'bonder', 'krigskassen', 'tordenskjold', 'skarpskytter', 'skanser'],
    feller: ['kruttmester', 'dobbel-ladning', 'stormpeler', 'krigskassen', 'tordenskjold', 'bonder', 'pelotong', 'jordvoller'],
    halvgod: [],
    'flat-ild': ['kartesk', 'krigskassen', 'skarpskytter'],
    tilfeldig: [],
};

/** Rutene eleven kan se: de åpne og den graverne holder på med. */
function visibleRoutes(g: G): Route[] {
    const rs = g.routes.filter((r) => r.open);
    const d = digRoutePreview(g);
    if (d) rs.push(d);
    return rs;
}

function rangeAt(g: G, k: TowerKind, z: number) {
    let r = TOWERS[k].range[0];
    if (z === FORT_ROW) r += 0.8;
    else if (has(g, 'skanser')) r += 0.9;
    if (k === 'musketer' && has(g, 'skarpskytter')) r += 0.8;
    return r;
}

/** Hvor mange rutemeter tårnet ville dekket her, vektet for grøft og åpen mark. */
function tileScore(g: G, k: TowerKind, x: number, z: number, wTrench: number, wOpen: number, routes: Route[]) {
    const r = rangeAt(g, k, z);
    const minR = k === 'morter' ? 1.2 : 0;
    let s = 0;
    for (const rt of routes)
        for (const [cx, cz] of rt.cells) {
            const d = Math.hypot(cx - x, cz - z);
            if (d > r || d < minR) continue;
            const c = cellAt(g, cx, cz);
            s += c === 'grav' || c === 'mark' ? wTrench : wOpen;
        }
    return s;
}

function bestTile(
    g: G,
    k: TowerKind,
    wTrench: number,
    wOpen: number,
    routes: Route[],
    rank = 0,
    spread = 0
): [number, number] | null {
    const list: { x: number; z: number; s: number }[] = [];
    for (let z = 0; z < ROWS; z++)
        for (let x = 0; x < COLS; x++) {
            if (!canBuild(g, k, x, z)) continue;
            let s = tileScore(g, k, x, z, wTrench, wOpen, routes);
            // Spredning: ikke stable alt på ett punkt.
            if (spread > 0)
                for (const t of g.towers)
                    if (t.kind === k && !t.fallen && Math.hypot(t.cx - x, t.cz - z) < spread) s *= 0.6;
            // Klynge (pelotong): bonus for naboer av samme slag.
            if (spread < 0) {
                let nb = 0;
                for (const t of g.towers)
                    if (t.kind === k && !t.fallen && Math.abs(t.cx - x) <= 1 && Math.abs(t.cz - z) <= 1) nb++;
                s *= 1 + 0.35 * Math.min(2, nb);
            }
            if (s > 0) list.push({ x, z, s });
        }
    list.sort((a, b) => b.s - a.s);
    const p = list[Math.min(rank, list.length - 1)];
    return p ? [p.x, p.z] : null;
}

function covers(g: G, k: TowerKind, rt: Route, trenchOnly: boolean) {
    return g.towers.some((t) => {
        if (t.kind !== k || t.fallen) return false;
        const r = rangeAt(g, k, t.cz) + t.level * 0.3;
        return rt.cells.some(([x, z]) => {
            const c = cellAt(g, x, z);
            if (trenchOnly && c !== 'grav' && c !== 'mark') return false;
            if (!trenchOnly && c !== 'glacis') return false;
            const d = Math.hypot(t.cx - x, t.cz - z);
            return d <= r && d >= (k === 'morter' ? 1.2 : 0);
        });
    });
}

function pickPref(g: G, style: BotStyle, io: IO, rng: Rng) {
    if (!g.offer) return;
    let pref = PREF[style];
    // Den tunge leser felttogsplanen: raske fiender -> kartesk og brannbomber først.
    if (style === 'tunge' && (g.doctrines.includes('dragonraid') || g.doctrines.includes('nattangrep')))
        pref = ['glodende', 'rask-lading', ...pref];
    if (!pref.length) return pickCard(g, Math.floor(rng() * g.offer.length), io);
    for (const c of pref) {
        const i = g.offer.indexOf(c);
        if (i >= 0) return pickCard(g, i, io);
    }
    return pickCard(g, 0, io);
}

function tungeTick(g: G, io: IO, rank: number) {
    const routes = visibleRoutes(g);
    const k2: TowerKind = allowed(g, 'kanon') ? 'kanon' : 'musketer';
    // Raske fiender i felttogsplanen (dragoner, nattangrep): morterbomba rekker dem ikke.
    // Da kommer kanonen ved glacis først, og den oppgraderes først.
    const fast = rank === 0 && (g.doctrines.includes('dragonraid') || g.doctrines.includes('nattangrep'));
    const needMorter = () => {
        for (const rt of routes)
            if (!covers(g, 'morter', rt, true)) {
                if (g.gold < buildCost(g, 'morter')) return true;
                const p = bestTile(g, 'morter', 1, 0.4, [rt], rank);
                if (p) build(g, 'morter', p[0], p[1], io);
                return true;
            }
        return false;
    };
    const needKanon = () => {
        for (const rt of routes)
            if (!covers(g, k2, rt, false)) {
                if (g.gold < buildCost(g, k2)) return true;
                const p = bestTile(g, k2, 0.3, 1, [rt], rank, 1.5);
                if (p) build(g, k2, p[0], p[1], io);
                return true;
            }
        return false;
    };
    if (fast ? needKanon() || needMorter() : needMorter() || needKanon()) return;
    // Oppgrader det svakeste tårnet (den halvgode stopper på nivå 2).
    const kFirst = fast ? (t: { kind: TowerKind }) => (t.kind === k2 ? 0 : 1) : () => 0;
    const up = g.towers
        .filter((t) => !t.fallen && t.kind !== 'mine' && t.level < (rank > 0 ? 1 : 2))
        .sort((a, b) => kFirst(a) - kFirst(b) || a.level - b.level || upgradeCost(a) - upgradeCost(b))[0];
    if (up) {
        if (g.gold >= upgradeCost(up)) upgrade(g, up.id, io);
        return;
    }
    // Alt er på topp: ett tungt tårn til (kanon mot raske fiender, ellers morter).
    const extra: TowerKind = fast ? k2 : 'morter';
    if (g.gold >= buildCost(g, extra)) {
        const p = bestTile(g, extra, extra === 'morter' ? 1 : 0.3, extra === 'morter' ? 0.4 : 1, routes, rank, 2);
        if (p) build(g, extra, p[0], p[1], io);
    }
}

function mangeTick(g: G, io: IO) {
    const routes = visibleRoutes(g);
    const n = g.towers.filter((t) => !t.fallen).length;
    // Beleiringskanonene er pansret mot musketkuler: én kanon ved hver grøfteende.
    if (g.seen.has('beleiring') && allowed(g, 'kanon'))
        for (const rt of routes)
            if (!covers(g, 'kanon', rt, false)) {
                if (g.gold < buildCost(g, 'kanon')) return;
                const p = bestTile(g, 'kanon', 0.3, 1, [rt]);
                if (p) build(g, 'kanon', p[0], p[1], io);
                return;
            }
    if (g.gold >= buildCost(g, 'musketer')) {
        // Ruta med færrest musketerer ved glacis får neste lag.
        const need = (rt: Route) =>
            g.towers.filter(
                (t) =>
                    t.kind === 'musketer' &&
                    !t.fallen &&
                    rt.cells.some(([x, z]) => cellAt(g, x, z) === 'glacis' && Math.hypot(t.cx - x, t.cz - z) <= rangeAt(g, 'musketer', t.cz))
            ).length;
        const rt = [...routes].sort((a, b) => need(a) - need(b))[0];
        const p = rt ? bestTile(g, 'musketer', 0.25, 1, [rt], 0, -1) : null;
        if (p) {
            build(g, 'musketer', p[0], p[1], io);
            return;
        }
    }
    // Mange nok lag: da løfter vi dem litt.
    if (n >= 16) {
        const up = g.towers.filter((t) => !t.fallen && t.level < 1)[0];
        if (up && g.gold >= upgradeCost(up)) upgrade(g, up.id, io);
    }
}

function fellerTick(g: G, io: IO) {
    const routes = visibleRoutes(g);
    const mines = g.towers.filter((t) => t.kind === 'mine' && !t.fallen);
    // Musketerer ved enden av hver grøft - fellene sliter rytterne ned, musketene tar resten.
    const musk = g.towers.filter((t) => t.kind === 'musketer' && !t.fallen).length;
    if (musk < routes.length && g.gold >= buildCost(g, 'musketer')) {
        const rt = routes[musk];
        const p = bestTile(g, 'musketer', 0.1, 1, [rt], 0, 1.1);
        if (p) build(g, 'musketer', p[0], p[1], io);
        return;
    }
    // Miner spredt ut i grøftene, minst 1,5 ruter fra hverandre.
    if (g.gold >= buildCost(g, 'mine')) {
        let best: [number, number] | null = null;
        let bs = -1;
        for (const rt of routes)
            for (let i = 1; i < rt.cells.length; i++) {
                const [x, z] = rt.cells[i];
                if (!canBuild(g, 'mine', x, z)) continue;
                const md = Math.min(99, ...mines.map((m) => Math.hypot(m.cx - x, m.cz - z)));
                if (md < 1.5) continue;
                // Tidlig i grøfta: fienden går forbi flere miner etter hverandre.
                const s = md + (rt.open ? 3 : 0) - i * 0.02 + (mines.length < 4 ? 0 : 0);
                if (s > bs) {
                    bs = s;
                    best = [x, z];
                }
            }
        if (best) {
            build(g, 'mine', best[0], best[1], io);
            return;
        }
    }
    // Ingen plass til flere: oppgrader minene.
    const up = mines.filter((t) => t.level < 2).sort((a, b) => a.level - b.level)[0];
    if (up && g.gold >= upgradeCost(up)) upgrade(g, up.id, io);
}

function flatTick(g: G, io: IO, rng: Rng) {
    const routes = visibleRoutes(g);
    const k: TowerKind = rng() < 0.5 && allowed(g, 'kanon') ? 'kanon' : 'musketer';
    if (g.gold < buildCost(g, k)) return;
    // Midt langs grøftene, der det ser ut som mest fiende - men de står i dekning.
    const p = bestTile(g, k, 1, -0.5, routes, 0, 1.1);
    if (p && p[1] > 5) build(g, k, p[0], p[1], io);
}

function randomTick(g: G, io: IO, rng: Rng) {
    if (g.offer && rng() < 0.3) pickCard(g, Math.floor(rng() * g.offer.length), io);
    if (g.rally >= 1 && rng() < 0.2) rally(g, io);
    const r = rng();
    if (r < 0.25) {
        const kinds: TowerKind[] = ['musketer', 'kanon', 'morter', 'mine'];
        const k = kinds[Math.floor(rng() * kinds.length)];
        const x = Math.floor(rng() * COLS);
        const z = Math.floor(rng() * ROWS);
        build(g, k, x, z, io);
    } else if (r < 0.3 && g.towers.length) {
        upgrade(g, g.towers[Math.floor(rng() * g.towers.length)].id, io);
    } else if (r < 0.32 && g.towers.length) {
        sell(g, g.towers[Math.floor(rng() * g.towers.length)].id, io);
    }
}

export function botTick(g: G, style: BotStyle, io: IO, rng: Rng, tick: number) {
    if (g.ended) return;
    if (style === 'tilfeldig') return randomTick(g, io, rng);
    if (style === 'halvgod' && tick % 3 !== 0) return;
    pickPref(g, style, io, rng);
    // «Til murene!» når mange er nær muren (den halvgode og flat-ild bruker den straks).
    if (g.rally >= 1) {
        const near = g.enemies.filter((e) => !e.dead && !e.leaked && e.d / g.routes[e.route].len > 0.6).length;
        if (near >= 6 || style === 'halvgod' || style === 'flat-ild') rally(g, io);
    }
    if (style === 'tunge') tungeTick(g, io, 0);
    else if (style === 'halvgod') tungeTick(g, io, 2);
    else if (style === 'mange') mangeTick(g, io);
    else if (style === 'feller') fellerTick(g, io);
    else if (style === 'flat-ild') flatTick(g, io, rng);
}
