// Robotene for Spøkelseshæren. De bruker de samme grepene som eleven (press,
// move, release) - bare uten piksel-sikting. Slipp-tidspunktet gis som
// `autoRelease`: roboten slipper når tanken er så full, akkurat som en elev som
// ser ringen bli grønn. Robotene brukes både i nettleseren (usePlaytest) og i
// den raske simuleringen.

import {
    DOVER,
    FRAME_H,
    FRAME_W,
    LEAK,
    NET_R,
    OK_MIN,
    PUMP_RATE,
    TANK_R,
    inDover,
    move,
    press,
    release,
    shipCovered,
    upcomingFrames,
    type Game,
    type Ship,
} from './game';

type Rng = () => number;

interface BotOpts {
    /** Minst så mange spill-sekunder mellom hver gang roboten handler (en treg elev). */
    gap: number;
    /** Hvor nøyaktig slippet er: [min, maks] fylling. */
    releaseAt: [number, number];
    nets: boolean;
    tanks: boolean;
    garbo: boolean;
    /** Sjanse for at roboten ser etter nett-trusler i et gitt kall. */
    netCare: number;
}

function inRect(x: number, y: number, fx: number, fy: number, pad = 0) {
    return Math.abs(x - fx) < FRAME_W / 2 - pad && Math.abs(y - fy) < FRAME_H / 2 - pad;
}

/** Fri plass til en ny tank inne i en kamerarute ved Dover. */
function freeSpot(g: Game, fx: number, fy: number, rng: Rng): [number, number] | null {
    for (let k = 0; k < 24; k++) {
        const x = fx + (rng() - 0.5) * (FRAME_W - 50);
        const y = fy + (rng() - 0.5) * (FRAME_H - 40);
        if (!inDover(x, y)) continue;
        if (g.tanks.some((t) => (t.x - x) ** 2 + (t.y - y) ** 2 < (TANK_R * 2.1) ** 2)) continue;
        return [x, y];
    }
    return null;
}

function nearestNetFor(g: Game, s: Ship, threatened: Ship[]) {
    // Ta et nett som ikke dekker et truet skip, helst det nærmeste.
    let best = -1;
    let bd = Infinity;
    g.nets.forEach((n, i) => {
        const guarding = threatened.some(
            (o) => o !== s && (n.x - o.x) ** 2 + (n.y - o.y) ** 2 < NET_R * NET_R
        );
        const d = (n.x - s.x) ** 2 + (n.y - s.y) ** 2 + (guarding ? 1e7 : 0);
        if (d < bd) {
            bd = d;
            best = i;
        }
    });
    return best;
}

function clusterCenter(g: Game, s: Ship) {
    const near = g.ships.filter(
        (o) => o.leaving === 0 && (o.x - s.x) ** 2 + (o.y - s.y) ** 2 < (NET_R * 1.25) ** 2
    );
    const x = near.reduce((a, o) => a + o.x, 0) / near.length;
    const y = near.reduce((a, o) => a + o.y, 0) / near.length;
    // Sikre at selve skipet er dekket.
    const d = Math.hypot(x - s.x, y - s.y);
    if (d > NET_R * 0.8) return [s.x, s.y];
    return [x, y];
}

function dragNet(g: Game, i: number, x: number, y: number) {
    const n = g.nets[i];
    press(g, n.x, n.y);
    move(g, x, y);
    release(g);
}

export function makeBot(opts: BotOpts, rng: Rng) {
    let last = -Infinity;
    // Nett og telegram er raske grep; en elev rekker flere av dem på et sekund.
    // Roboten gjør derfor inntil tre grep per kall, men stopper når den begynner å pumpe.
    const tick = (g: Game) => {
        if (g.mode !== 'play') return;
        if (g.hold.kind === 'tank') return; // pumper - vent til slippet
        // Tempoet måles i spillets egen tid, så en treg elev er like treg uansett
        // hvor fort nettleseren tegner.
        if (g.t - last < opts.gap) return;
        last = g.t;
        for (let k = 0; k < 3 && g.hold.kind === 'none'; k++) if (!act(g)) break;
    };
    const act = (g: Game): boolean => {
        const up = upcomingFrames(g);
        const relAt = () => opts.releaseAt[0] + rng() * (opts.releaseAt[1] - opts.releaseAt[0]);

        // 1. Skip i en kamerarute som snart tas: flytt et nett dit.
        if (opts.nets && !g.fleetSailed && rng() < opts.netCare) {
            const threatened: Ship[] = [];
            for (const u of up) {
                if (u.eta > 7) continue;
                for (const s of g.ships)
                    if (s.leaving === 0 && inRect(s.x, s.y, u.f.x, u.f.y, -6) && !shipCovered(g, s))
                        threatened.push(s);
            }
            if (threatened.length) {
                const s = threatened[0];
                const i = nearestNetFor(g, s, threatened);
                if (i >= 0) {
                    const [x, y] = clusterCenter(g, s);
                    dragNet(g, i, x, y);
                    return true;
                }
            }
            // Ingen trussel: dekk et udekket skip som ligger alene.
            const open = g.ships.filter((s) => s.leaving === 0 && !shipCovered(g, s));
            if (open.length && rng() < 0.5) {
                const s = open[0];
                const inUse = g.nets.map((nn) =>
                    g.ships.filter((o) => (nn.x - o.x) ** 2 + (nn.y - o.y) ** 2 < NET_R * NET_R).length
                );
                const idle = inUse.indexOf(0);
                if (idle >= 0) {
                    const [x, y] = clusterCenter(g, s);
                    dragNet(g, idle, x, y);
                    return true;
                }
            }
        }

        // 2. Garbo: send telegrammet når neste bilde ved Dover vil vise en hær.
        if (opts.garbo && g.telegram) {
            const nextDover = up.find((u) => u.f.x > DOVER.x0 - 60 && u.f.y < DOVER.y1 + 40);
            if (nextDover) {
                const ok = g.tanks.filter(
                    (t) => t.burst === 0 && t.fill >= OK_MIN + 0.03 && inRect(t.x, t.y, nextDover.f.x, nextDover.f.y)
                ).length;
                const bad = g.tanks.filter(
                    (t) =>
                        (t.burst !== 0 || (t.fill < OK_MIN && t.fill > 0.12)) &&
                        inRect(t.x, t.y, nextDover.f.x, nextDover.f.y)
                ).length;
                if (ok >= 2 && bad === 0) {
                    press(g, g.telegram.x, g.telegram.y);
                    return true;
                }
            }
        }

        if (!opts.tanks) return false;

        // 3. Kameraruter ved Dover som snart tas: fyll på slappe tanker, eller blås opp nye.
        for (const u of up) {
            if (u.eta > 9) break;
            const { f } = u;
            if (!(f.x > DOVER.x0 - 60 && f.y < DOVER.y1 + 40)) continue;
            const inside = g.tanks.filter((t) => t.burst === 0 && inRect(t.x, t.y, f.x, f.y));
            const lk = LEAK * (g.stormOn ? 2.4 : 1) * u.eta;
            const weak = inside
                .filter((t) => t.fill - lk < OK_MIN + 0.03)
                .sort((a, b) => b.fill - a.fill);
            for (const t of weak) {
                const need = (0.95 - t.fill) / PUMP_RATE;
                if (need < u.eta - 0.2 && g.air > need * PUMP_RATE * 0.75 + 0.02) {
                    press(g, t.x, t.y, relAt());
                    return false;
                }
            }
            const okCount = inside.filter((t) => t.fill - lk >= OK_MIN + 0.03).length;
            if (okCount < 2 && u.eta > 1.7 && g.air > 0.55 && weak.length === 0) {
                const spot = freeSpot(g, f.x, f.y, rng);
                if (spot) {
                    press(g, spot[0], spot[1], relAt());
                    return false;
                }
            }
        }

        // 4. Vedlikehold: fyll på tanker som snart blir slappe.
        if (g.air > 0.45) {
            const low = g.tanks
                .filter((t) => t.burst === 0 && t.fill < OK_MIN + 0.06)
                .sort((a, b) => a.fill - b.fill)[0];
            if (low) {
                press(g, low.x, low.y, relAt());
                return false;
            }
        }

        // 5. Bygg ut hæren når lufta er full: der hæren er tynnest.
        if (g.air > 0.9 && g.tanks.length < 18) {
            let best: [number, number] | null = null;
            let bestN = Infinity;
            for (let i = 0; i < 4; i++)
                for (let j = 0; j < 3; j++) {
                    const fx = DOVER.x0 + ((i + 0.5) * (DOVER.x1 - DOVER.x0)) / 4;
                    const fy = DOVER.y0 + ((j + 0.5) * (DOVER.y1 - DOVER.y0 - 60)) / 3;
                    const nn = g.tanks.filter((t) => t.burst === 0 && inRect(t.x, t.y, fx, fy)).length + rng() * 0.5;
                    if (nn < bestN && inDover(fx, fy)) {
                        bestN = nn;
                        best = [fx, fy];
                    }
                }
            const spot = best && freeSpot(g, best[0], best[1], rng);
            if (spot) press(g, spot[0], spot[1], relAt());
        }
        return false;
    };
    return tick;
}

/** Knappemoseren: tilfeldige lovlige grep uten plan. */
export function makeRandomBot(rng: Rng) {
    return (g: Game) => {
        if (g.mode !== 'play') return;
        if (g.hold.kind === 'tank') {
            if (rng() < 0.4) release(g);
            return;
        }
        const r = rng();
        if (r < 0.2 && !g.fleetSailed) {
            const i = Math.floor(rng() * g.nets.length);
            dragNet(g, i, 60 + rng() * 680, 420 + rng() * 360);
        } else if (r < 0.3 && g.telegram) {
            press(g, g.telegram.x, g.telegram.y);
        } else {
            const x = rng() * 1600;
            const y = rng() * 900;
            press(g, x, y, 0.3 + rng() * 1.1);
        }
    };
}

export const BOTS = {
    seende: {
        gap: 0,
        releaseAt: [0.92, 1.0] as [number, number],
        nets: true,
        tanks: true,
        garbo: true,
        netCare: 1,
    },
    halvgod: {
        gap: 1.3,
        releaseAt: [0.8, 1.06] as [number, number],
        nets: true,
        tanks: true,
        garbo: false,
        netCare: 0.8,
    },
    'glemmer-skipene': {
        gap: 0,
        releaseAt: [0.92, 1.0] as [number, number],
        nets: false,
        tanks: true,
        garbo: true,
        netCare: 0,
    },
    'glemmer-dover': {
        gap: 0,
        releaseAt: [0.92, 1.0] as [number, number],
        nets: true,
        tanks: false,
        garbo: false,
        netCare: 1,
    },
};
