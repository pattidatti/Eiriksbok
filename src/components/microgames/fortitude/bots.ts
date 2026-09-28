// Selvspill-robotene for Spøkelseshæren. De bruker de samme grepene som eleven
// (pumpe, kaste nett, sende på radioen) - bare uten å sikte med musa.

import { netUnit, pumpStart, pumpStop, radioTap, sendTelegram, TAUT, willSee, type Game } from './game';

/** Første gang et fly vil se punktet (sekunder), eller null. */
function soonest(g: Game, x: number, y: number): number | null {
    let best: number | null = null;
    for (const pl of g.planes) {
        const s = willSee(pl, x, y);
        if (s !== null && (best === null || s < best)) best = s;
    }
    return best;
}

function pumping(g: Game) {
    return g.pump === null ? null : (g.dummies.find((d) => d.id === g.pump) ?? null);
}

/** En elev som har skjønt bløffen: skjul det ekte, vis det falske, snakk når de lytter. */
export function seende(g: Game) {
    const cur = pumping(g);
    if (cur && cur.air >= 0.97) pumpStop(g);

    // 1. Ekte tropper i en kommende kamerastripe: nett over, med én gang.
    const exposed = g.units
        .filter((u) => u.active && !u.covered && u.leaving === 0)
        .map((u) => ({ u, t: soonest(g, u.x, u.y) }))
        .filter((e) => e.t !== null)
        .sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
    const slack = g.dummies
        .filter((d) => d.active && d.popped === 0 && d.air < 0.92)
        .map((d) => ({ d, t: soonest(g, d.x, d.y) }))
        .filter((e) => e.t !== null)
        .sort((a, b) => (a.t ?? 0) - (b.t ?? 0));

    // Holder vi på en tank som snart blir fotografert og trenger mer luft: fortsett.
    if (cur && cur.air < 0.97 && slack.some((e) => e.d.id === cur.id)) {
        if (!exposed.length || (exposed[0].t ?? 9) > 1.2 || cur.air < TAUT) return;
    }
    if (exposed.length) {
        netUnit(g, exposed[0].u.id);
        return;
    }
    if (slack.length) {
        pumpStart(g, slack[0].d.id);
        return;
    }
    if (cur && cur.air < 0.97) return;
    // 2. Garbo: send rapporten bare når hele gummihæren står stram.
    if (g.garbo.offer > 0 && g.dummies.every((d) => !d.active || (d.popped === 0 && d.air >= 0.75))) {
        pumpStop(g);
        sendTelegram(g);
        return;
    }
    // 3. Tyskerne lytter: send.
    if (g.radio.on && g.radio.taps < 5) {
        pumpStop(g);
        radioTap(g);
        return;
    }
    // 4. Rydd: nett over nyankomne, pump den slappeste tanken.
    const bare = g.units.find((u) => u.active && !u.covered && u.leaving === 0);
    if (bare) {
        netUnit(g, bare.id);
        return;
    }
    const low = g.dummies
        .filter((d) => d.active && d.popped === 0 && d.air < 0.8)
        .sort((a, b) => a.air - b.air)[0];
    if (low) pumpStart(g, low.id);
    else pumpStop(g);
}

/**
 * Halvgod elev: følger regelen, men er treg. Handler høyst hvert 0,7. sekund
 * spilltid (uavhengig av hvor ofte den blir spurt), og slipper pumpa først når
 * den ser at tanken er stram.
 */
export function makeHalvgod() {
    let last = -9;
    let n = 0;
    return (g: Game) => {
        const cur = pumping(g);
        if (cur && cur.air >= 0.9) pumpStop(g);
        if (g.t < last) last = -9; // ny runde
        if (g.t - last < 0.7) return;
        if (cur && cur.air < 0.9) return;
        last = g.t;
        n++;
        const exposed = g.units.find(
            (u) => u.active && !u.covered && u.leaving === 0 && soonest(g, u.x, u.y) !== null
        );
        if (exposed) {
            netUnit(g, exposed.id);
            return;
        }
        if (g.radio.on && g.radio.taps < 3) {
            radioTap(g);
            return;
        }
        if (g.garbo.offer > 0) {
            sendTelegram(g);
            return;
        }
        const bare = g.units.find((u) => u.active && !u.covered && u.leaving === 0);
        if (bare && n % 3 === 0) {
            netUnit(g, bare.id);
            return;
        }
        const low = g.dummies
            .filter((d) => d.active && d.popped === 0 && d.air < 0.7)
            .sort((a, b) => a.air - b.air)[0];
        if (low) pumpStart(g, low.id);
    };
}

/** Ignorerer de ekte troppene: tror bløffen bare handler om gummitankene. */
export function barePumpe(g: Game) {
    const cur = pumping(g);
    if (cur && cur.air >= 0.97) pumpStop(g);
    if (cur && cur.air < 0.97) return;
    if (g.radio.on && g.radio.taps < 5) {
        radioTap(g);
        return;
    }
    if (sendTelegram(g)) return;
    const slack = g.dummies
        .filter((d) => d.active && d.popped === 0 && d.air < 0.92)
        .map((d) => ({ d, t: soonest(g, d.x, d.y) ?? 99 }))
        .sort((a, b) => a.t - b.t || a.d.air - b.d.air)[0];
    if (slack) pumpStart(g, slack.d.id);
}

/** Ignorerer gummihæren: gjemmer bare de ekte troppene. */
export function bareNett(g: Game) {
    const bare = g.units.find((u) => u.active && !u.covered && u.leaving === 0);
    if (bare) netUnit(g, bare.id);
    else if (g.radio.on && g.radio.taps < 5) radioTap(g);
}

/** Knappemoseren: tilfeldige lovlige grep uten plan. */
export function makeTilfeldig(rng: () => number = Math.random) {
    return (g: Game) => {
        const r = rng();
        const ds = g.dummies.filter((d) => d.active);
        const us = g.units.filter((u) => u.active);
        if (r < 0.35 && ds.length) pumpStart(g, ds[Math.floor(rng() * ds.length)].id);
        else if (r < 0.55) pumpStop(g);
        else if (r < 0.8 && us.length) {
            pumpStop(g);
            netUnit(g, us[Math.floor(rng() * us.length)].id);
        } else {
            pumpStop(g);
            if (rng() < 0.5) radioTap(g);
            else sendTelegram(g);
        }
    };
}
