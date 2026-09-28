// Selvspill-robotene i Petisjonen. De styrer rullen med setTarget() - samme grep
// som når eleven peker med musa - bare uten piksel-sikting.

import { PLACES, SLOTTET, HALF_W, HALF_D, dist, type XZ } from './geo';
import { setTarget, reach, type G } from './game';

export type BotStyle = 'seende' | 'halvgod' | 'alene' | 'tilfeldig';

interface Memo {
    n: number;
    last: XZ | null;
}
const memo = new WeakMap<G, Memo>();

/** Vekk fra jegerne og veggene, eller null hvis ingen er nær. */
function flee(g: G, reactAt: number): XZ | null {
    const R = g.roll;
    let fx = 0;
    let fz = 0;
    let hit = false;
    for (const h of g.hunters) {
        if (!h.active || h.stun > 0.4) continue;
        // Den dyktige ser hvor jegeren er om et halvt sekund.
        const look = reactAt >= 6 ? 0.5 : 0;
        const hp: XZ = [h.p[0] + h.v[0] * look, h.p[1] + h.v[1] * look];
        const d = dist(hp, R.p);
        const lim = (h.kind === 'bonde' ? reactAt - 1.2 : reactAt) + R.r;
        if (d < lim) {
            const w = (lim - d) / lim + 0.3;
            fx += ((R.p[0] - hp[0]) / (d || 1)) * w;
            fz += ((R.p[1] - hp[1]) / (d || 1)) * w;
            hit = true;
        }
    }
    if (!hit) return null;
    // Veggene: ikke flykt inn i et hjørne.
    const m = 6;
    if (R.p[0] < -HALF_W + m) fx += 0.8;
    if (R.p[0] > HALF_W - m) fx -= 0.8;
    if (R.p[1] < -HALF_D + m) fz += 0.8;
    if (R.p[1] > HALF_D - m) fz -= 0.8;
    const l = Math.hypot(fx, fz) || 1;
    return [R.p[0] + (fx / l) * 7, R.p[1] + (fz / l) * 7];
}

/** Er punktet farlig nær en jeger? */
function guarded(g: G, p: XZ, margin: number) {
    for (const h of g.hunters) {
        if (!h.active || h.stun > 1) continue;
        if (dist(h.p, p) < margin + g.roll.r) return true;
    }
    return false;
}

/** Styr mot målet, men bøy av rundt jegere som er i nærheten (potensialfelt). */
function steerAround(g: G, goal: XZ): XZ {
    const R = g.roll;
    let dx = goal[0] - R.p[0];
    let dz = goal[1] - R.p[1];
    const dl = Math.hypot(dx, dz);
    if (dl < 0.01) return goal;
    dx /= dl;
    dz /= dl;
    let rx = 0;
    let rz = 0;
    for (const h of g.hunters) {
        if (!h.active || h.stun > 0.6) continue;
        if (h.kind === 'bonde' && !h.chasing && dist(h.p, R.p) > 3 + R.r) continue;
        const hp: XZ = [h.p[0] + h.v[0] * 0.45, h.p[1] + h.v[1] * 0.45];
        const ox = R.p[0] - hp[0];
        const oz = R.p[1] - hp[1];
        const od = Math.hypot(ox, oz) || 1;
        const lim = 7 + R.r * 1.3;
        if (od > lim) continue;
        const w = ((lim - od) / lim) * 3.2;
        rx += (ox / od) * w;
        rz += (oz / od) * w;
        // Skyv også sidelengs, så rullen går rundt i stedet for rett bakover.
        const side = Math.sign(dx * -oz + dz * ox) || 1;
        rx += (-oz / od) * w * 0.6 * side;
        rz += (ox / od) * w * 0.6 * side;
    }
    const m = 5;
    if (R.p[0] < -HALF_W + m) rx += 0.6;
    if (R.p[0] > HALF_W - m) rx -= 0.6;
    if (R.p[1] < -HALF_D + m) rz += 0.6;
    if (R.p[1] > HALF_D - m) rz -= 0.6;
    const sx = dx + rx;
    const sz = dz + rz;
    const sl = Math.hypot(sx, sz) || 1;
    // Nær målet og ingen fare: pek på selve målet (så rullen kan stoppe på tunet).
    if (rx === 0 && rz === 0) return goal;
    const k = Math.max(3, Math.min(8, dl));
    return [R.p[0] + (sx / sl) * k, R.p[1] + (sz / sl) * k];
}

function nearestStanding(g: G, place: number | null, avoidTun: boolean, careful = 0): XZ | null {
    const R = g.roll;
    let best: XZ | null = null;
    let bd = Infinity;
    for (const p of g.people) {
        if (p.state !== 'står') continue;
        if (place !== null && p.place !== place) continue;
        if (careful && guarded(g, p.p, careful)) continue;
        if (avoidTun) {
            const ps = g.places[p.place];
            if (ps.klar && dist(p.p, PLACES[p.place].tun) < 4) continue;
        }
        const d = dist(p.p, R.p);
        if (d < bd) {
            bd = d;
            best = p.p;
        }
    }
    return best;
}

function plan(g: G, style: 'seende' | 'halvgod'): XZ | null {
    const R = g.roll;
    const careful = style === 'seende' ? 4 : 0;
    if (g.open) return SLOTTET;
    // Et møte er i gang: bli stående.
    if (g.meetingPlace >= 0) return PLACES[g.meetingPlace].tun;
    // Møteklar bygd i nærheten.
    let best: XZ | null = null;
    let bv = 0;
    g.places.forEach((ps, i) => {
        if (!ps.klar || ps.forening) return;
        const v = 60 / (dist(R.p, PLACES[i].tun) + 6);
        if (v > bv) {
            bv = v;
            best = PLACES[i].tun;
        }
    });
    if (best) return best;
    // Stabler med navn.
    let harvest: XZ | null = null;
    let hv = 0;
    g.places.forEach((ps, i) => {
        const f = ps.forening;
        if (!f) return;
        const tun = PLACES[i].tun;
        const d = dist(R.p, tun);
        const v = f.pile / (d + 10);
        if (v > hv) {
            hv = v;
            // Den dyktige stopper i kanten av elva, den halvgode kjører helt inn.
            const edge = style === 'seende' ? Math.max(0, reach(f, R.r) - 1.5) : 0;
            harvest =
                d > edge && edge > 0
                    ? [tun[0] + ((R.p[0] - tun[0]) / d) * edge, tun[1] + ((R.p[1] - tun[1]) / d) * edge]
                    : tun;
        }
    });
    // Den dyktige bygger foreninger først (de vokser av seg selv) og høster senere.
    const harvestNow = style === 'seende' ? (g.t < 100 ? 45 : 18) : 22;
    if (harvest && hv > harvestNow) return harvest;
    // Tenn en ny bygd: nærmeste uten forening som har folk igjen.
    let spark = -1;
    let sd = Infinity;
    g.places.forEach((ps, i) => {
        if (ps.forening) return;
        if (g.places.some((o) => o.forening && o.forening.recruit === i)) return;
        const left = g.people.filter(
            (p) => p.place === i && p.state === 'står' && !(careful && guarded(g, p.p, careful))
        ).length;
        if (left + ps.spark < PLACES[i].need) return;
        const d = dist(R.p, PLACES[i].tun) - ps.spark * 4;
        if (d < sd) {
            sd = d;
            spark = i;
        }
    });
    if (spark >= 0 && (style === 'seende' || sd < 30)) {
        const t = nearestStanding(g, spark, false, style === 'seende' ? careful : 0);
        if (t) return t;
    }
    return harvest;
}

export function botTick(g: G, style: BotStyle) {
    let m = memo.get(g);
    if (!m) {
        m = { n: 0, last: null };
        memo.set(g, m);
    }
    m.n++;
    const R = g.roll;

    if (style === 'tilfeldig') {
        if (!m.last || g.rand() < 0.3)
            m.last = [(g.rand() - 0.5) * HALF_W * 2, (g.rand() - 0.5) * HALF_D * 2];
        setTarget(g, m.last);
        return;
    }

    if (style === 'seende') {
        // Den dyktige svinger rundt jegerne på vei mot målet, i stedet for å snu.
        const goal = plan(g, style) ?? [0, 0];
        m.last = goal;
        setTarget(g, steerAround(g, goal));
        return;
    }

    const away = flee(g, 2.4 + (style === 'alene' ? 2.6 : 0));
    if (away) {
        setTarget(g, away);
        return;
    }

    if (style === 'alene') {
        // Ignorerer fagkjernen: plukker husmenn én og én, holder aldri møte.
        const t = nearestStanding(g, null, true, 4) ?? nearestStanding(g, null, true);
        let goal: XZ = t ?? [0, 0];
        for (let i = 0; i < PLACES.length; i++) {
            const ps = g.places[i];
            if (ps.klar && dist(R.p, PLACES[i].tun) < 3.4 + R.r) {
                const tun = PLACES[i].tun;
                goal = [R.p[0] + (R.p[0] - tun[0]) * 3, R.p[1] + (R.p[1] - tun[1]) * 3];
            }
        }
        setTarget(g, goal);
        return;
    }

    // Halvgod: tenker bare hvert femte grep, og holder fast på gammel plan imens.
    if (m.n % 5 !== 0 && m.last) {
        setTarget(g, m.last);
        return;
    }
    const t = plan(g, 'halvgod') ?? [0, 0];
    m.last = t;
    setTarget(g, t);
}
