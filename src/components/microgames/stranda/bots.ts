// Robotene for Inn mot stranda. De bruker de samme grepene som eleven (steer,
// throttle, fire) - bare uten å sikte med musa. Brukes både i nettleseren
// (usePlaytest) og i simuleringen med npx tsx.

import {
    BOAT_L,
    BOAT_W,
    OBST_Y1,
    SHELL_R,
    W,
    fire,
    obstacleVisible,
    waterline,
    steer,
    throttle,
    type Game,
} from './game';

type Rng = () => number;

interface BotOpts {
    /** Handler bare hvert n-te kall (reaksjonstid: ett kall = 0,2 s spilltid). */
    every: number;
    /** Styrer unna granater og hindre. */
    dodge: boolean;
    /** Husker hvor hindrene sto ved lavvann (som en elev som så dem). */
    memory: boolean;
    /** Sjanse per mulighet for å be flåten skyte. 0 = aldri. */
    fireCare: number;
    /** Velger den farligste bunkeren (ellers en tilfeldig). */
    smartFire: boolean;
}

export const BOTS: Record<string, BotOpts> = {
    seende: { every: 1, dodge: true, memory: true, fireCare: 1, smartFire: true },
    halvgod: { every: 3, dodge: true, memory: false, fireCare: 0.4, smartFire: true },
    'ignorerer-flaaten': { every: 1, dodge: true, memory: true, fireCare: 0, smartFire: false },
    'kjorer-rett': { every: 1, dodge: false, memory: false, fireCare: 1, smartFire: true },
};

export function makeBot(opts: BotOpts, rng: Rng) {
    let n = 0;
    const seen = new Map<number, { x: number; y: number }>();
    return (g: Game) => {
        if (g.mode !== 'play') return;
        // Hindre eleven har sett ved lavvann, huskes selv når vannet dekker dem.
        for (const o of g.obstacles) if (obstacleVisible(g, o)) seen.set(o.id, { x: o.x, y: o.y });
        n++;
        if (n % opts.every !== 0) return;

        // Flåten: skyt på bunkeren som skyter neste gang.
        if (g.reload <= 0 && opts.fireCare > 0 && rng() < opts.fireCare) {
            const live = g.bunkers.filter((b) => b.active && b.dead === 0);
            if (live.length) {
                const b = opts.smartFire
                    ? live.reduce((a, c) => (c.cd < a.cd ? c : a))
                    : live[Math.floor(rng() * live.length)];
                fire(g, b.x, b.y);
            }
        }

        const me = g.me;
        if (!me) return;
        if (!opts.dodge) {
            steer(g, 0);
            throttle(g, 1);
            return;
        }
        // Nær hinderbeltet: velg spor (eller en kjent åpning) FØR beltet, og hold kursen
        // gjennom det. Inne i beltet unngås granatene bare med gassen - å svinge sidelengs
        // blant hindrene er det farligste man kan gjøre.
        const wl = waterline(g);
        const inWaterAhead = g.obstacles.some(
            (o) => !o.gone && o.y > wl && o.y < me.y - BOAT_L / 2 + 16
        );
        const inBand = inWaterAhead && me.y - BOAT_L / 2 < OBST_Y1 + 70;
        const shellCost = (x: number, th: number, dx: number) => {
            let c = 0;
            const v = 42 * th;
            for (const s of g.shells) {
                const tt = Math.max(0, s.t);
                const bx = me.x + Math.sign(dx) * Math.min(Math.abs(dx), 250 * tt);
                if (Math.hypot(bx - s.x, me.y - v * tt - s.y) < SHELL_R + 26) c += 300;
            }
            void x;
            return c;
        };
        // Kolonner som er trygge helt inn: spor, eller (med hukommelse) en rett linje uten kjente hindre.
        const blocked = (x: number) =>
            g.obstacles.some(
                (o) =>
                    !o.gone &&
                    o.y > wl - 4 &&
                    o.y < me.y - BOAT_L / 2 + 16 &&
                    (obstacleVisible(g, o) || (opts.memory && seen.has(o.id))) &&
                    Math.abs(o.x - x) < BOAT_W / 2 + 12
            );
        const hiddenAhead = g.obstacles.some(
            (o) => !o.gone && !obstacleVisible(g, o) && o.y < me.y
        );
        let best = { x: me.x, th: 1, cost: Infinity };
        for (let dx = -840; dx <= 840; dx += 15) {
            const x = me.x + dx;
            if (x < 40 || x > W - 40) continue;
            if (inBand && Math.abs(dx) > 18) continue;
            for (const th of [0.6, 1, 1.5]) {
                let cost = Math.abs(dx) * 0.004 + Math.abs(th - 1) * 0.4 + shellCost(x, th, dx);
                if (blocked(x)) cost += 120;
                if (hiddenAhead) {
                    const near = g.lanes.reduce((m, l) => Math.min(m, Math.abs(l - x)), Infinity);
                    if (near !== Infinity)
                        cost += Math.min(90, Math.max(0, near - 8) * (opts.memory ? 0.6 : 0.3));
                }
                if (cost < best.cost) best = { x, th, cost };
            }
        }
        const d = best.x - me.x;
        steer(g, Math.abs(d) < 6 ? 0 : Math.sign(d) * Math.min(1, Math.abs(d) / 40));
        throttle(g, best.th);
    };
}

/** Knappemoseren: tilfeldige lovlige grep uten plan. */
export function makeRandomBot(rng: Rng) {
    return (g: Game) => {
        if (g.mode !== 'play') return;
        steer(g, rng() * 2 - 1);
        throttle(g, 0.6 + rng() * 0.9);
        if (rng() < 0.25) fire(g, rng() * W, 120 + rng() * 140);
    };
}
