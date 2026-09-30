import { UNITS, ECONOMY, RADIO, ENEMIES, type Kind, type EKind } from './tuning';
import { MAP_D, MAP_W } from './levels';
import {
    pick, place, reroll, toggleLink, startWave, sperre, nextSlag, canPlace, channels, inRange, isAir,
    slagDef, waveDef, roadAt, roadDist, type G, type IO, type Rng, type Unit,
} from './game';

// Robotene. Samme grep som eleven: pick/place/toggleLink/startWave/sperre.
// Brukes av både simuleringen (sim.ts) og selvspillet i nettleseren.

export type BotStyle = 'samvirke' | 'halvgod' | 'uten-radio' | 'bare-vogner' | 'tilfeldig';

interface BotDef {
    forventer: 'vinner' | 'taper' | 'middels';
    tilfeldig?: boolean;
    beskrivelse: string;
}

export const BOTS: Record<BotStyle, BotDef> = {
    samvirke: {
        forventer: 'vinner',
        beskrivelse: 'Blandet hær, kobler det viktigste i nettet (artilleri, infanteri foran, vogner, bombefly med jagere) og kobler opp igjen med en gang en linje ryker.',
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse: 'Samme plan og kjøp, men kobler ikke opp igjen når en linje ryker i bølgen og bruker ikke sperreilden.',
    },
    'uten-radio': {
        forventer: 'taper',
        beskrivelse: 'Kjøper samme blandede hær, men bruker aldri radioen (fagkjernen ignorert).',
    },
    'bare-vogner': {
        forventer: 'taper',
        beskrivelse: 'Kjøper bare stridsvogner og kobler dem i nettet: mange vogner uten infanteri.',
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Tilfeldige lovlige grep: kjøper, plasserer og kobler uten plan.',
    },
};

const WANT: Record<Kind, number> = { inf: 4, vogn: 2, pv: 2, art: 2, lv: 2, jag: 2, bomb: 1 };
const COUNTER: Record<EKind, Kind[]> = { einf: ['inf', 'art'], evogn: ['pv', 'vogn'], epak: ['inf', 'art'], estuka: ['lv', 'jag'], ejag: ['jag'] };

function count(g: G, k: Kind) {
    return g.units.filter((u) => !u.dead && u.kind === k).reduce((n, u) => n + u.copies, 0);
}

function need(g: G, k: Kind, style: BotStyle) {
    if (style === 'bare-vogner') return k === 'vogn' ? 10 : -10;
    const have = count(g, k);
    const w = waveDef(g);
    if (!w.pool.includes(k)) return -10;
    // Robotene leser neste bølge (eleven ser den i planleggingen) og kjøper svaret.
    let threat = 0;
    for (const gr of w.groups) if (COUNTER[gr.kind].includes(k)) threat += gr.n * (gr.kind === 'evogn' ? 1 : 0.5);
    return WANT[k] - have + (k === 'inf' ? 0.5 : 0) + Math.min(3, threat / 2);
}

/** Hvor god en rute er for en enhetstype: hvor mye vei den dekker. */
function tileScore(g: G, k: Kind, x: number, z: number) {
    const st = UNITS[k];
    const [hx, hz] = slagDef(g).hq;
    const rd = roadDist(g.road, x, z);
    if (k === 'art') return -Math.hypot(x - hx, z - hz) + (rd > 1.8 ? 3 : 0);
    let cover = 0;
    const reach = Math.min(st.range, k === 'inf' ? st.sight : st.range);
    for (let s = 0; s < g.road.len; s += 0.5) {
        const [px, pz] = roadAt(g.road, s);
        // Infanteriet vil se fienden tidlig (fremst); resten dekker veien fram mot utgangen.
        if (Math.hypot(px - x, pz - z) <= reach) cover += k === 'inf' ? 2 - s / g.road.len : 1 + s / g.road.len;
    }
    const inR = Math.hypot(x - hx, z - hz) <= RADIO.rekkevidde - 0.3 ? 4 : -6;
    // Vogner og panservern vil stå ved infanteriet; luftvern ved nettet.
    let near = 0;
    for (const u of g.units) {
        if (u.dead || isAir(u.kind)) continue;
        const d = Math.hypot(u.x - x, u.z - z);
        if ((k === 'vogn' || k === 'pv') && u.kind === 'inf' && d < 2.2) near += 3;
        if (k === 'lv' && d < 2.5) near += 1;
    }
    return cover + inR + near - (rd < 1.2 && k !== 'inf' ? 2 : 0);
}

function bestTile(g: G, k: Kind, rng: Rng, random: boolean): [number, number] | null {
    const opts: [number, number, number][] = [];
    for (let x = 0; x < MAP_W; x++)
        for (let z = 0; z < MAP_D; z++) {
            const cx = x + 0.5;
            const cz = z + 0.5;
            if (!canPlace(g, cx, cz)) continue;
            opts.push([cx, cz, random ? rng() : tileScore(g, k, cx, cz)]);
        }
    if (!opts.length) return null;
    // Slå sammen med en like enhet når det går.
    const same = g.units.find((u) => !u.dead && !isAir(u.kind) && u.kind === k && !u.vet);
    if (same && !random) return [same.x, same.z];
    opts.sort((a, b) => b[2] - a[2]);
    return [opts[0][0], opts[0][1]];
}

function linkValue(g: G, u: Unit) {
    const hasBomb = g.units.some((v) => !v.dead && v.kind === 'bomb');
    const hasJag = g.units.some((v) => !v.dead && v.kind === 'jag');
    const air = g.enemies.some((e) => !e.dead && !e.passed && ENEMIES[e.kind].fly);
    switch (u.kind) {
        case 'art': return 6;
        case 'bomb': return hasJag ? 5.5 : 2;
        case 'jag': return hasBomb ? 5.4 : air ? 3.5 : 1.5;
        case 'inf': return 4 + (roadDist(g.road, u.x, u.z) < 1.6 ? 0.5 : 0) + u.copies * 0.1;
        case 'vogn': return 3.8 + u.copies * 0.1;
        case 'lv': return air ? 3 : 1;
        case 'pv': return 2;
    }
}

/** Ett radiogrep: flytt én kanal mot det beste settet. */
function tuneRadio(g: G, io: IO) {
    const C = channels(g);
    if (!C) return false;
    const cands = g.units.filter((u) => !u.dead && inRange(g, u)).sort((a, b) => linkValue(g, b) - linkValue(g, a));
    const want = new Set(cands.slice(0, C).map((u) => u.id));
    const wrong = g.units.find((u) => !u.dead && (u.linked || u.linking > 0) && !want.has(u.id));
    if (wrong) return toggleLink(g, wrong.id, io);
    const missing = cands.find((u) => want.has(u.id) && !u.linked && u.linking <= 0);
    if (missing) return toggleLink(g, missing.id, io);
    return false;
}

const rerolls = new WeakMap<G, { serial: number; n: number }>();

function planTick(g: G, style: BotStyle, io: IO, rng: Rng) {
    const random = style === 'tilfeldig';
    if (g.holding >= 0) {
        const k = g.shop[g.holding]!;
        if (isAir(k)) return place(g, 0, 0, io);
        const t = bestTile(g, k, rng, random);
        if (t && place(g, t[0], t[1], io)) return;
        g.holding = -1;
        return;
    }
    if (random) {
        const r = rng();
        if (r < 0.15 && channels(g)) {
            const u = g.units[Math.floor(rng() * g.units.length)];
            if (u) toggleLink(g, u.id, io);
            return;
        }
        const i = Math.floor(rng() * g.shop.length);
        if (r < 0.75 && pick(g, i)) return;
        if (r < 0.8 && reroll(g)) return;
        startWave(g, io);
        return;
    }
    if (style !== 'uten-radio' && tuneRadio(g, io)) return;
    let bi = -1;
    let bn = 0;
    g.shop.forEach((k, i) => {
        if (!k || UNITS[k].pris > g.forsyninger) return;
        const n = need(g, k, style) + (k === 'inf' ? 0.2 : 0);
        if (n > bn) {
            bn = n;
            bi = i;
        }
    });
    if (bi >= 0 && pick(g, bi)) return;
    // Mer penger enn butikken er verdt: bytt kort (maks fire ganger per planlegging).
    const r = rerolls.get(g);
    const n = r && r.serial === g.planSerial ? r.n : 0;
    if (g.forsyninger >= ECONOMY.bytt + 3 && n < 4 && reroll(g)) {
        rerolls.set(g, { serial: g.planSerial, n: n + 1 });
        return;
    }
    // Rester: kjøp infanteri eller panservern hvis de finnes.
    const spare = g.shop.findIndex((k) => k && UNITS[k].pris <= g.forsyninger && (style === 'bare-vogner' ? k === 'vogn' : k !== 'bomb'));
    if (spare >= 0 && g.forsyninger >= 5 && pick(g, spare)) return;
    startWave(g, io);
}

function waveTick(g: G, style: BotStyle, io: IO, rng: Rng) {
    if (style === 'tilfeldig') {
        if (rng() < 0.1 && g.units.length) toggleLink(g, g.units[Math.floor(rng() * g.units.length)].id, io);
        if (rng() < 0.02) {
            const [x, z] = roadAt(g.road, rng() * g.road.len);
            sperre(g, x, z, io);
        }
        return;
    }
    if (style !== 'uten-radio' && tuneRadio(g, io)) return;
    if (g.sperreild > 0) {
        // Sperreild der fienden står tettest og har kommet langt.
        let best: [number, number] | null = null;
        let bs = 3;
        for (const e of g.enemies) {
            if (e.dead || e.passed || ENEMIES[e.kind].fly) continue;
            let s = 0;
            for (const f of g.enemies) if (!f.dead && !f.passed && !ENEMIES[f.kind].fly && Math.hypot(e.x - f.x, e.z - f.z) < 1.8) s += f.hp / 50;
            s += e.s / g.road.len;
            if (s > bs) {
                bs = s;
                best = [e.x, e.z];
            }
        }
        if (best) sperre(g, best[0], best[1], io);
    }
}

/** Ett robotgrep. */
export function botTick(g: G, style: BotStyle, io: IO, rng: Rng) {
    if (g.phase === 'slagVunnet') {
        nextSlag(g);
        return;
    }
    if (g.phase === 'plan') planTick(g, style === 'halvgod' ? 'samvirke' : style, io, rng);
    // Den halvgode kobler ikke opp igjen i bølgen og bruker ikke sperreilden.
    else if (g.phase === 'wave' && style !== 'halvgod') waveTick(g, style, io, rng);
}
