import * as THREE from 'three';
import { PANELS, MILE_POS } from './model';

const BASE_POS = new THREE.Vector3(0, 0.8, 2.2);
const MILE_TOP = MILE_POS.clone().setY(2.4);
import { makeGrids, resetGrids, stepGrid, ignite, paint, type Grid } from './paint';

// Spillogikken for Regnet i Lærdal - ren TypeScript, ingen React. 3D-scenen
// leser tilstanden hver frame, og UI-et får beskjed gjennom IO-grensesnittet.

export type Foundation = 'sviller' | 'stolper';
export type Timber = 'malmfuru' | 'fersk';
export type Cause = 'forfall' | 'stolper' | 'riving';
export type Mode = 'menu' | 'intro' | 'play' | 'paused' | 'dying' | 'over';

export const Y_START = 1180;
export const Y_END = 2026;
export const RUN_SECONDS = 200;
export const YPS = (Y_END - Y_START) / RUN_SECONDS;
export const TAR_MAX = 100; // liter
export const BARREL = 35; // liter per fat fra mila
export const MILE_SECONDS = 9;
/** Liter tjære per «hel celle» (0 -> 1). */
export const LITER_PER_CELL = 0.045;
const SIM_STEP = 0.1; // cellesimulering kjøres i faste steg

export interface Particle {
    kind: 'drip' | 'steam' | 'shingle' | 'spark';
    p: THREE.Vector3;
    v: THREE.Vector3;
    life: number;
    max: number;
}

export interface G {
    t: number;
    year: number;
    cond: number;
    tar: number;
    mileT: number;
    mileReady: boolean;
    mileMul: number;
    mileMulUntil: number;
    grids: Grid[];
    foundation: Foundation;
    timber: Timber;
    bunn: number;
    bunnWarned: number;
    score: number;
    stroke: number; // tjære lagt på i dette strøket (så lenge penselen er nede)
    strokeMult: number;
    maxStroke: number;
    restoredTotal: number;
    doused: number;
    riving: number;
    rivingOn: boolean;
    event: { id: string; left: number } | null;
    eventT: number;
    done: Set<string>;
    winterUntil: number;
    flashT: number;
    collapse: number;
    cause: Cause;
    unlocked: Set<string>;
    particles: Particle[];
    simAcc: number;
    leakWarnT: number;
    wet: number;
    brushOver: boolean;
}

export function newGame(grids: Grid[], foundation: Foundation, timber: Timber): G {
    resetGrids(grids);
    return {
        t: 0,
        year: Y_START,
        cond: 100,
        tar: 45 + (foundation === 'stolper' ? 25 : 0) + (timber === 'fersk' ? 25 : 0),
        mileT: 0,
        mileReady: false,
        mileMul: 1,
        mileMulUntil: 0,
        grids,
        foundation,
        timber,
        bunn: 0,
        bunnWarned: 0,
        score: 0,
        stroke: 0,
        strokeMult: 1,
        maxStroke: 0,
        restoredTotal: 0,
        doused: 0,
        riving: 0,
        rivingOn: false,
        event: null,
        eventT: 16,
        done: new Set(),
        winterUntil: 0,
        flashT: 0,
        collapse: 0,
        cause: 'forfall',
        unlocked: new Set(),
        particles: [],
        simAcc: 0,
        leakWarnT: 0,
        wet: 0.6,
        brushOver: false,
    };
}

export const sharedGrids = (() => {
    let g: Grid[] | null = null;
    return () => (g ??= makeGrids());
})();

export interface Sfx {
    brush: (mult: number) => void;
    scrape: () => void;
    douse: () => void;
    barrel: () => void;
    bell: () => void;
    thunder: () => void;
    crackle: () => void;
    leak: () => void;
    rain: () => void;
    gust: () => void;
    collapse: () => void;
    win: () => void;
    empty: () => void;
    stroke: (mult: number) => void;
}

/** Et punkt på kirka eller i dalen som en lapp peker på. null = ikke synlig. */
export type At = () => THREE.Vector3 | null;
export interface PinOpts {
    tone?: 'info' | 'fare' | 'bra';
    seconds?: number;
    once?: boolean;
    until?: () => boolean;
}

// Tekst går aldri i en linje under spillet (den leses ikke). Se arcade/useArcade.tsx:
// banner = to-fire ord, pin = lapp festet til noe i scenen, beat = lærings-øyeblikk
// i sakte film, lesson = det som står på slutt-skjermen under «Dette skjedde».
export interface IO {
    sfx: Sfx;
    banner: (t: string, color?: string) => void;
    pin: (key: string, text: string, at: At, o?: PinOpts) => void;
    beat: (key: string, title: string, text: string, at?: At, until?: () => boolean) => void;
    lesson: (key: string, text: string, weight?: number) => void;
    /** 1 normalt, lavere under et lærings-øyeblikk (sakte film). */
    timeScale: () => number;
    lose: (cause: Cause) => void;
    win: () => void;
}

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function wearRate(g: G, grid: Grid) {
    const def = grid.def;
    let f = (def.exposure / 48) * (g.timber === 'fersk' ? 1.75 : 1);
    const e = g.event?.id;
    if (e === 'storm') f *= def.side === 'V' ? 3.2 : 1.4;
    if (e === 'tort') f *= 0.3;
    if (g.year < g.winterUntil) f *= def.kind === 'roof' ? 1.6 : 1.2;
    if (g.year > 2001) f *= 0.45;
    return f;
}

function burst(
    g: G,
    kind: Particle['kind'],
    at: THREE.Vector3,
    n: number,
    speed: number,
    up: number
) {
    for (let k = 0; k < n; k++) {
        const max = kind === 'steam' ? 1.2 : 0.9;
        g.particles.push({
            kind,
            p: at.clone(),
            v: new THREE.Vector3(
                (Math.random() - 0.5) * speed,
                Math.random() * up,
                (Math.random() - 0.5) * speed
            ),
            life: max * (0.6 + Math.random() * 0.4),
            max,
        });
    }
}

/** Et punkt et stykke inn på en flate - til lyn. */
function randomSpot() {
    return { u: 0.2 + Math.random() * 0.6, v: 0.2 + Math.random() * 0.6 };
}

function lightning(g: G, io: IO) {
    const high = g.grids.filter((gr) => gr.def.kind === 'roof' && gr.def.center.y > 4);
    const gr = pick(high);
    const { u, v } = randomSpot();
    ignite(gr, u, v);
    g.flashT = 0.6;
    io.sfx.thunder();
    io.banner('LYNNEDSLAG!', '#a33b1f');
    const at = () => gr.def.center;
    const out = () => gr.burning === 0;
    io.beat(
        'brann',
        'DET BRENNER',
        'Lynet har tent på kirka. Mal over flammene - tjære og pensel slokker dem.',
        at,
        out
    );
    io.pin('brann', 'Det brenner - mal over!', at, { tone: 'fare', seconds: 8, until: out });
    io.lesson('lyn', 'Stavkirkene sto høyt og ble ofte truffet av lyn. Mange brant ned.', 0.7);
}

function gust(g: G, io: IO) {
    // Vindkastet river løs spon: tre flekker blir bare på et blunk.
    for (let k = 0; k < 3; k++) {
        const gr = pick(g.grids.filter((x) => x.def.side === 'V' || Math.random() < 0.4));
        const cx = Math.floor(Math.random() * gr.w);
        const cy = Math.floor(Math.random() * gr.h);
        for (let y = cy - 2; y <= cy + 2; y++)
            for (let x = cx - 2; x <= cx + 2; x++)
                if (x >= 0 && x < gr.w && y >= 0 && y < gr.h && Math.hypot(x - cx, y - cy) < 2.6)
                    gr.tar[y * gr.w + x] = 0;
        gr.dirty = true;
        burst(g, 'shingle', gr.def.center.clone().addScaledVector(gr.def.normal, 0.3), 10, 6, 5);
    }
    io.sfx.gust();
    io.banner('VINDKAST', '#3d4a5c');
}

export function unlock(g: G, id: string) {
    g.unlocked.add(id);
}

export function update(g: G, dt: number, io: IO) {
    g.t += dt;
    g.year = Math.min(Y_END, g.year + YPS * dt);
    const y = g.year;

    const at = (id: string, year: number, fn: () => void) => {
        if (y >= year && !g.done.has(id)) {
            g.done.add(id);
            fn();
        }
    };
    at('lag', 1300, () => {
        if (g.foundation === 'sviller') unlock(g, 'svill');
        if (g.timber === 'malmfuru') unlock(g, 'malmfuru');
    });
    at('svartedauden', 1349, () => {
        g.event = null;
        g.mileMul = 1.8;
        g.mileMulUntil = 1420;
        io.banner('SVARTEDAUDEN', '#3a3a3a');
        io.pin('svartedauden', 'Færre hender - mindre tjære', () => MILE_TOP, { seconds: 6 });
        io.lesson(
            'svartedauden',
            'Svartedauden (1349) drepte rundt halve befolkningen. Færre folk betydde mindre tjære til kirkene.',
            0.6
        );
        io.sfx.bell();
        unlock(g, 'svartedauden');
    });
    at('reformasjonen', 1537, () => {
        io.banner('REFORMASJONEN', '#5a3a6a');
        io.lesson(
            'reformasjonen',
            'Etter reformasjonen (1537) var kirka fortsatt bygdas ansvar å holde ved like.',
            0.3
        );
        io.sfx.bell();
        unlock(g, 'reformasjonen');
    });
    at('vintre', 1640, () => {
        g.winterUntil = 1720;
        io.banner('HARDE VINTRE', '#46627a');
        io.pin('vintre', 'Snøen sliter på taket', () => PANELS[10].center, { seconds: 5 });
    });
    at('kirkeloven', 1851, () => {
        g.event = null;
        g.rivingOn = true;
        io.banner('KIRKELOVEN 1851', '#7a2e1f');
        io.beat(
            'kirkeloven',
            'KIRKELOVEN 1851',
            'Nye kirker skal være store. Er kirka i dårlig stand, river bygda den. Hold den tett!'
        );
        io.lesson(
            'kirkeloven',
            'Kirkeloven av 1851 krevde større kirker. Mange stavkirker ble revet - bare 28 står igjen.',
            1.5
        );
        io.sfx.bell();
        unlock(g, 'kirkeloven');
    });
    at('foreningen', 1881, () => {
        g.rivingOn = false;
        g.riving = 0;
        io.banner('KIRKA ER REDDET', '#2f6b3a');
        io.lesson(
            'foreningen',
            'Fortidsminneforeningen kjøpte Borgund stavkirke i 1877 for å redde den fra riving.',
            1
        );
        io.sfx.bell();
        unlock(g, 'foreningen');
    });
    at('programmet', 2001, () => {
        g.mileMul = 0.5;
        g.mileMulUntil = Y_END + 1;
        io.banner('STAVKIRKEPROGRAMMET', '#2f6b3a');
        io.lesson(
            'programmet',
            'Fra 2001 satte Riksantikvaren alle de 28 stavkirkene i stand.',
            0.5
        );
        unlock(g, 'programmet');
    });
    if (y >= Y_END) {
        io.win();
        return;
    }
    if (g.mileMulUntil && y > g.mileMulUntil) {
        g.mileMul = 1;
        g.mileMulUntil = 0;
    }

    // --- tilfeldige hendelser ---
    if (g.event) {
        g.event.left -= dt;
        if (g.event.left <= 0) {
            g.event = null;
            g.eventT = 10 + Math.random() * 6;
        }
    } else {
        g.eventT -= dt;
        if (g.eventT <= 0) {
            const r = Math.random();
            if (r < 0.28) {
                g.event = { id: 'storm', left: 10 };
                io.banner('STORM FRA VEST', '#3d4a5c');
                io.lesson(
                    'vest',
                    'Regnet på Vestlandet kommer mest fra vest. Den siden måtte tjærebres oftest.',
                    0.8
                );
            } else if (r < 0.46) {
                g.event = { id: 'lyn', left: 8 };
                lightning(g, io);
            } else if (r < 0.62) {
                g.event = { id: 'tort', left: 9 };
                io.banner('TØRT TIÅR', '#a27a2a');
            } else if (r < 0.78) {
                g.event = { id: 'host', left: 6 };
                g.mileReady = true;
                io.banner('GOD TJÆREHØST', '#6b4a1f');
                io.pin('host', 'Hent fatet!', () => MILE_TOP, {
                    tone: 'bra',
                    seconds: 5,
                    until: () => !g.mileReady,
                });
                io.sfx.barrel();
            } else {
                g.event = { id: 'kast', left: 6 };
                gust(g, io);
            }
        }
    }
    g.wet = g.event?.id === 'tort' ? 0.1 : g.event?.id === 'storm' ? 1 : 0.6;

    // --- cellesimulering i faste steg ---
    g.simAcc += dt;
    let leakSum = 0;
    let burning = 0;
    while (g.simAcc >= SIM_STEP) {
        g.simAcc -= SIM_STEP;
        leakSum = 0;
        burning = 0;
        for (const gr of g.grids) {
            stepGrid(gr, SIM_STEP, wearRate(g, gr));
            leakSum += Math.max(0, gr.rotCover - 0.08);
            burning += gr.burning;
            // En sjelden gnist fra en stor brann kan hoppe til en nabo-flate.
            if (gr.burning > 0.25 && Math.random() < SIM_STEP * 0.15) {
                let best: Grid | null = null;
                let bd = 99;
                for (const o of g.grids) {
                    if (o === gr || o.burning > 0) continue;
                    const d = o.def.center.distanceTo(gr.def.center);
                    if (d < bd) {
                        bd = d;
                        best = o;
                    }
                }
                if (best) ignite(best, 0.5, 0.2);
            }
        }
        // Lekkasjer og brann tærer på tilstanden. Tett kirke kommer seg sakte.
        g.cond -= SIM_STEP * (leakSum * 6 + burning * 12);
        if (leakSum === 0 && burning === 0) g.cond = Math.min(100, g.cond + SIM_STEP * 1.1);
    }
    if (burning > 0 && Math.random() < dt * 5) io.sfx.crackle();

    g.leakWarnT -= dt;
    const leaking = g.grids.filter((gr) => gr.rotCover > 0.2);
    if (leaking.length && g.leakWarnT <= 0) {
        g.leakWarnT = 9;
        io.sfx.leak();
        const gr = leaking[0];
        const at = () => gr.def.center;
        io.beat(
            'lekk',
            'DET LEKKER',
            'Der tjæra er borte, trekker vannet inn og veden råtner. Mal over den grønne flekken.',
            at,
            () => gr.rotCover < 0.15
        );
        io.pin(`lekk-${gr.def.label}`, 'Lekker! Mal over råten', at, {
            tone: 'fare',
            seconds: 6,
            until: () => gr.rotCover < 0.15,
        });
        io.lesson('lekk', 'Tjære holdt vannet ute. Der den slet bort, kom råten.', 1);
    }

    // Stolpekirka råtner nedenfra - det kan ingen tjære stoppe.
    if (g.foundation === 'stolper') {
        g.bunn += dt / 32;
        if (g.bunn > 0.35 && g.bunnWarned < 1) {
            g.bunnWarned = 1;
            io.pin('bunn', 'Stolpene råtner i jorda', () => BASE_POS, { tone: 'fare', seconds: 7 });
        }
        if (g.bunn > 0.7 && g.bunnWarned < 2) {
            g.bunnWarned = 2;
            io.pin('bunn2', 'Kirka heller!', () => BASE_POS, { tone: 'fare', seconds: 7 });
        }
        if (g.bunn >= 1) {
            io.lesson(
                'stolpe',
                'Stolper satt rett i jorda råtnet, uansett hvor mye tjære de fikk. Sviller på stein reddet stavkirkene.',
                3
            );
            unlock(g, 'stolpe');
            io.lose('stolper');
            return;
        }
    }

    if (g.rivingOn) {
        if (g.cond < 60) g.riving += dt / 9;
        else g.riving = Math.max(0, g.riving - dt / 18);
        if (g.riving >= 1) {
            io.lose('riving');
            return;
        }
    }
    if (g.cond <= 0) {
        g.cond = 0;
        io.lose('forfall');
        return;
    }

    // --- tjæremila ---
    if (!g.mileReady) {
        g.mileT += dt;
        if (g.mileT >= MILE_SECONDS * g.mileMul) {
            g.mileT = 0;
            g.mileReady = true;
            io.sfx.barrel();
            io.pin('mila', 'Tjæra er klar - klikk fatet', () => MILE_TOP, {
                once: true,
                seconds: 8,
                until: () => !g.mileReady,
            });
        }
    }

    g.score += YPS * dt;
    g.flashT = Math.max(0, g.flashT - dt);
}

/** Partikler (drypp, damp, spon) - steg utenfor React. */
export function stepParticles(g: G, dt: number) {
    for (const p of g.particles) {
        p.life -= dt;
        if (p.kind === 'steam') {
            p.v.y += 1.5 * dt;
            p.v.multiplyScalar(0.97);
        } else p.v.y -= (p.kind === 'shingle' ? 6 : 14) * dt;
        p.p.addScaledVector(p.v, dt);
        if (p.p.y < 0.02 && p.kind !== 'steam') {
            p.p.y = 0.02;
            p.v.set(0, 0, 0);
        }
    }
    g.particles = g.particles.filter((p) => p.life > 0).slice(-160);
}

export interface BrushHit {
    panel: number;
    u: number;
    v: number;
    point: THREE.Vector3;
}

/**
 * Ett penselstrøk-stempel. Returnerer hva som skjedde, så UI-et kan gi lyd og
 * tekst. Poeng: slitt ved som dekkes, ganger strøk-multiplikatoren.
 */
export function brush(g: G, hit: BrushHit, io: IO) {
    const gr = g.grids[hit.panel];
    const budget = g.tar / LITER_PER_CELL;
    const res = paint(gr, hit.u, hit.v, 0.5, 0.42, budget);
    if (res.added > 0) {
        g.tar = Math.max(0, g.tar - res.added * LITER_PER_CELL);
        g.stroke += res.restored;
        g.restoredTotal += res.restored;
        const m = g.stroke > 60 ? 4 : g.stroke > 30 ? 3 : g.stroke > 12 ? 2 : 1;
        if (m > g.strokeMult) io.sfx.stroke(m);
        g.strokeMult = m;
        g.score += res.restored * m;
        if (Math.random() < 0.35) {
            const d = PANELS[hit.panel].normal;
            g.particles.push({
                kind: 'drip',
                p: hit.point.clone().addScaledVector(d, 0.06),
                v: new THREE.Vector3(0, -0.5, 0),
                life: 0.9,
                max: 0.9,
            });
        }
        io.sfx.brush(m);
    }
    if (res.scraped > 0.05) {
        io.sfx.scrape();
        if (Math.random() < 0.5) burst(g, 'shingle', hit.point, 2, 2, 2);
    }
    if (res.doused > 0) {
        g.doused += res.doused;
        g.score += res.doused * 5;
        io.sfx.douse();
        burst(g, 'steam', hit.point, 3, 1, 1.5);
    }
    if (res.added === 0 && res.scraped === 0 && res.doused === 0 && g.tar <= 0.01) io.sfx.empty();
    if (g.restoredTotal > 250) unlock(g, 'spon');
    return res;
}

export function endStroke(g: G) {
    const s = g.stroke;
    g.maxStroke = Math.max(g.maxStroke, s);
    g.stroke = 0;
    g.strokeMult = 1;
    return s;
}

// Ett år på skjermen tar noen sekunder. Årstidene er bare stemning, ikke regler.
export const SEASON_SECONDS = 9;
/** 0 = sommer, 0.25 = høst, 0.5 = vinter, 0.75 = vår */
export function seasonOf(g: G) {
    const s = (g.t / SEASON_SECONDS) % 1;
    const hard = g.year < g.winterUntil;
    return { s, winter: s > 0.38 && s < (hard ? 0.82 : 0.68), autumn: s > 0.18 && s <= 0.38 };
}
