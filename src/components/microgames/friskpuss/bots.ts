// Selvspill-robotene for «Frisk puss!». De styrer med SAMME input som eleven (retning, hopp
// holdt, hopp-trykk), én gang per 0,2 s spilltid, og ser bare det eleven ser: hvor
// stillaset er i svingen, hvor talja og sekken i heisen er, om det blåser fra vinduet, og hvor
// mye figuren svaier.
//
// Robotene bruker alltid kameravinkel 0 (de styrer i verdensretninger, ikke skjermretninger).

import type { Rng } from '../sim';
import {
    inputFor,
    stagePhase,
    stageU,
    heisPhase,
    windState,
    type G,
} from './game';
import type { HeisDef, StageDef, WindDef } from './level';

export type BotStyle = 'seende' | 'middels' | 'rett-fram' | 'tilfeldig';

export const BOTS: Record<
    string,
    { forventer: 'vinner' | 'middels' | 'taper'; tilfeldig?: boolean; beskrivelse: string; style: BotStyle }
> = {
    seende: {
        forventer: 'vinner',
        beskrivelse:
            'tar alle tre snarveiene: talje-heisen i riktig takt, tau-stillaset i ytterpunktet og veggsprett opp vindussjakta',
        style: 'seende',
    },
    middels: {
        forventer: 'middels',
        beskrivelse:
            'trygg vei hele veien: stigene og veggbjelkene, venter på trekken og talja, nøler før hopp',
        style: 'middels',
    },
    'rett-fram': {
        forventer: 'taper',
        beskrivelse:
            'ignorerer fagregelen: går på de løse plankene, hopper på tau-stillaset uten å se på takten, går under talja',
        style: 'rett-fram',
    },
    knappemoser: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'tilfeldige taster hvert 0,2 s',
        style: 'tilfeldig',
    },
};

// ---------------------------------------------------------------------------
// Små grep: samme input som tastaturet gir
// ---------------------------------------------------------------------------

function steer(g: G, dx: number, dz: number, mag = 1) {
    const m = Math.hypot(dx, dz);
    if (m < 1e-6 || mag <= 0) {
        g.input.x = 0;
        g.input.z = 0;
        return;
    }
    const [ix, iz] = inputFor((dx / m) * mag, (dz / m) * mag, g.input.yaw);
    g.input.x = ix;
    g.input.z = iz;
}

function press(g: G) {
    g.input.presses++;
    g.input.jump = true;
}

function release(g: G) {
    g.input.jump = false;
}

// ---------------------------------------------------------------------------
// Stegene i en plan
// ---------------------------------------------------------------------------

interface St {
    n: number; // tick i dette steget
    e: number; // robotens egen timingfeil
    air: boolean;
}

type Step = (g: G, st: St, rng: Rng) => boolean | 'fail';

/** Gå til et punkt. `stop` = bremse og stå stille der. */
const go =
    (x: number, z: number, tol = 0.3, stop = true): Step =>
    (g) => {
        if (g.mode !== 'ground') return false;
        release(g);
        const dx = x - g.p[0];
        const dz = z - g.p[2];
        const d = Math.hypot(dx, dz);
        if (d < tol) {
            if (stop) steer(g, 0, 0);
            return true;
        }
        steer(g, dx, dz, stop ? Math.max(0.15, Math.min(1, d / 1.4)) : 1);
        return false;
    };

/** Hopp mot et punkt og styr i lufta til du står. Kantgrep tar deg opp hvis hoppet blir kort. */
const jump =
    (x: number, y: number, z: number): Step =>
    (g, st) => {
        const dx = x - g.p[0];
        const dz = z - g.p[2];
        const d = Math.hypot(dx, dz);
        if (st.n === 0) {
            if (g.mode !== 'ground') return false;
            press(g);
            steer(g, dx, dz, 1);
            st.air = false;
            return false;
        }
        if (g.mode !== 'ground') st.air = true;
        steer(g, dx, dz, Math.max(0.25, Math.min(1, d / 1.2)));
        if (g.mode === 'ground' && (st.air || st.n > 3)) {
            release(g);
            // Landet: stå der, men ikke løp videre ut over kanten.
            if (Math.abs(g.p[1] - y) < 0.5 && d < 1.6) steer(g, 0, 0);
            return true;
        }
        return false;
    };

/** Klatre på stigen foran deg: press mot veggen for å gripe, så «fram» til du er oppe. */
const climb =
    (topY: number): Step =>
    (g) => {
        release(g);
        if (g.mode === 'ladder' || g.mode === 'climbup') {
            g.input.x = 0;
            g.input.z = 1;
        } else {
            if (g.mode === 'ground' && g.p[1] >= topY - 0.1) {
                g.input.x = 0;
                g.input.z = 0;
                return true;
            }
            // Nærmeste stige: press inn mot veggen den står på.
            let best = g.L.ladders[0];
            let bd = Infinity;
            for (const L of g.L.ladders) {
                const d = Math.hypot(L.x - g.p[0], L.z - g.p[2]) + Math.abs(L.y0 - g.p[1]) * 3;
                if (d < bd) {
                    bd = d;
                    best = L;
                }
            }
            steer(g, -best.n[0], -best.n[1]);
        }
        return false;
    };

/** Vent til noe er sant. */
const wait =
    (pred: (g: G, st: St) => boolean): Step =>
    (g, st) => {
        release(g);
        steer(g, 0, 0);
        return pred(g, st);
    };

/** Gå langs den smale bjelken og hold balansen med sidelengs styring. */
const balanceTo =
    (x: number, gain: number, sloppy: boolean): Step =>
    (g, _st, rng) => {
        release(g);
        const dx = x - g.p[0];
        if (Math.abs(dx) < 0.3 && g.mode === 'ground') {
            steer(g, 0, 0);
            return true;
        }
        if (g.mode !== 'ground') return false;
        let lat = Math.max(-1, Math.min(1, -gain * g.sway));
        if (sloppy && rng() < 0.35) lat = 0;
        const along = Math.sign(dx);
        // Sidelengs retning i verden: z (bjelken går langs x).
        const [ix, iz] = inputFor(along, lat, g.input.yaw);
        g.input.x = ix;
        g.input.z = iz;
        return false;
    };

/**
 * Veggsprett opp sjakta: inn mot søylen, sprett mot veggen, sprett tilbake og grip toppen.
 * `sx` = hvilken side søylen står på (+1 = øst), `topY` = toppen av søylen.
 */
const shaft =
    (sx: number, topY: number): Step =>
    (g, st) => {
        if (st.n === 0) {
            if (g.mode !== 'ground') return false;
            press(g);
            steer(g, sx, 0);
            return false;
        }
        if (st.n === 1 || st.n === 2) {
            if (g.mode === 'air') {
                press(g);
                steer(g, st.n === 1 ? -sx : sx, 0);
            }
            return false;
        }
        steer(g, sx, 0);
        if (g.mode === 'hang' || g.mode === 'climbup') return false;
        if (g.mode === 'ground') {
            release(g);
            return g.p[1] > topY - 0.5 ? true : 'fail';
        }
        return st.n > 14 ? 'fail' : false;
    };

/** Hopp på tau-stillaset. `err` = hvor mye roboten bommer på takten (s), null = ser ikke på takten. */
const board =
    (S: StageDef, err: number | null): Step =>
    (g, st, rng) => {
        if (st.n === 0) st.e = err === null ? 0 : (rng() * 2 - 1) * err;
        if (g.mode !== 'ground' && st.n > 0 && !st.air) return false;
        if (!st.air) {
            if (err !== null) {
                // Tid til stillaset er ved A igjen.
                const toA = (1 - stagePhase(S, g.t)) * S.period;
                const want = 0.62 + st.e;
                if (toA < want - 0.15 || toA > want + 0.15) {
                    steer(g, 0, 0);
                    release(g);
                    return false;
                }
            }
            press(g);
            steer(g, S.a[0] - g.p[0], S.a[2] - g.p[2], 1);
            st.air = true;
            return false;
        }
        // I lufta: styr mot der stillaset står.
        const dx = g.stage[0][0] - g.p[0];
        const dz = g.stage[0][2] - g.p[2];
        steer(g, dx, dz, Math.max(0.2, Math.min(1, Math.hypot(dx, dz) / 1.2)));
        if (g.mode === 'ground') {
            release(g);
            steer(g, 0, 0);
            return true;
        }
        return false;
    };

/** Stå stille på stillaset til det er framme ved B. */
const ride =
    (S: StageDef): Step =>
    (g) => {
        release(g);
        steer(g, 0, 0);
        if (g.mode !== 'ground') return true;
        return stageU(S, g.t) > 0.95 && stagePhase(S, g.t) < 0.5;
    };

/** Talje-heisen: gå til kroken og hopp opp i den. Ferdig når du står på toppen. */
const heisGrab =
    (h: HeisDef): Step =>
    (g, st) => {
        if (g.mode === 'heis' || g.mode === 'climbup') {
            release(g);
            steer(g, 0, 0);
            st.air = true;
            return false;
        }
        if (st.air && g.mode === 'ground') return g.p[1] > h.y0 + h.lift - 0.5 ? true : 'fail';
        if (g.mode !== 'ground') return st.n > 20 ? 'fail' : false;
        const dx = h.x - g.p[0];
        const dz = h.z - g.p[2];
        if (Math.hypot(dx, dz) > 0.15) {
            steer(g, dx, dz, Math.max(0.15, Math.min(1, Math.hypot(dx, dz) / 1.4)));
            return st.n > 30 ? 'fail' : false;
        }
        steer(g, 0, 0);
        press(g);
        return false;
    };

/** Vinduet er rolig lenge nok til å komme over (sekunder). */
const calm = (w: WindDef, need: number) => (g: G) => {
    if (windState(w, g.t) !== 'rolig') return false;
    const ph = (((g.t - w.offset) % w.period) + w.period) % w.period;
    return w.period - ph >= need;
};

/** Sekken over den andre broen er på vei ut og blir ute en stund. */
const sackOut = (g: G) => {
    const T = g.L.taljer[1];
    const th = (((2 * Math.PI) / T.period) * g.t) % (2 * Math.PI);
    return th > 0.2 && th < 1.3;
};

// ---------------------------------------------------------------------------
// Planene, ett segment per sjekkpunkt
// ---------------------------------------------------------------------------

const taljeGap = (g: G) => {
    const T = g.L.taljer[0];
    const th = (((2 * Math.PI) / T.period) * g.t) % Math.PI;
    return th > 1.9 && th < 3.0;
};

/** Bane 1 «Første dag»: uendret fra gråboksen. */
function plan1(style: BotStyle, cp: number, rng: Rng, tries: number, g: G): Step[] {
    const X = (x: number) => (g.L.mirror ? -x : x);
    const S = g.L.stages[0];
    const hes = style === 'middels';
    const pause: Step[] = hes ? [wait((_g, st) => st.n >= 2 + Math.floor(rng() * 3))] : [];
    const withPause = (s: Step): Step[] => [...pause, s];

    const beams: Step[] = [
        go(X(-6.35), -5.7, 0.15),
        ...withPause(jump(X(-4.1), 6, -5.85)),
        ...withPause(jump(X(-0.7), 6, -5.85)),
        ...withPause(jump(X(1.7), 5, -5.3)),
    ];
    const planks: Step[] = [go(X(-6.2), -4.7, 0.3, false), go(X(1.6), -4.7, 0.4, false)];
    const toL2: Step[] = [go(X(4), -5.3, 0.6, false), go(X(8), -5.6, 0.25), climb(13)];

    // Buebroen går på langs mot vest, ett trinn (1 m opp) om gangen.
    const bridgeFromV3: Step[] = [
        go(X(-8.2), -4.5, 0.25),
        ...withPause(jump(X(-9.6), 14, -4.5)),
        ...withPause(jump(X(-11.6), 15, -4.5)),
        ...withPause(jump(X(-13.6), 16, -4.5)),
    ];
    const top: Step[] = [
        go(X(-14.2), -4.5, 0.3),
        ...withPause(jump(X(-15.6), 17, -4.5)),
        ...withPause(jump(X(-18.3), 18, -4.5)),
    ];
    const safeUpper = (waitTalje: boolean, gain: number, sloppy: boolean): Step[] => [
        go(X(3.8), -4.25, 0.2),
        ...(waitTalje ? [wait(taljeGap)] : []),
        balanceTo(X(-1.7), gain, sloppy),
        ...withPause(jump(X(-3.6), 13, -5.0)),
        ...withPause(jump(X(-5.8), 13, -5.0)),
        ...withPause(jump(X(-8.0), 13, -5.0)),
        ...bridgeFromV3,
        ...top,
    ];
    const stageRoute = (err: number | null): Step[] => [
        go(S.a[0], -4.05, 0.15),
        board(S, err),
        ride(S),
        go(S.b[0], -4.4, 0.4, false),
        ...top,
    ];

    if (style === 'seende') {
        if (cp === 0)
            return tries === 0
                ? [go(X(-18.75), -5.7, 0.08), shaft(g.L.mirror ? -1 : 1, 5), go(X(-6.35), -5.7, 0.15)]
                : [go(X(-14.6), -3.8, 0.6, false), go(X(-11), -4.3, 0.3), climb(5)];
        if (cp === 1) return [...beams, ...toL2];
        return stageRoute(0);
    }
    if (style === 'middels') {
        if (cp === 0) return [go(X(-14.6), -3.8, 0.6, false), go(X(-11), -4.3, 0.3), climb(5)];
        if (cp === 1) return [...beams, ...toL2];
        // Prøver tau-stillaset av og til, men bommer på takten med opptil 0,15 s.
        return tries === 0 && rng() < 0.5 ? stageRoute(0.15) : safeUpper(true, 2.5, false);
    }
    // rett-fram: korteste linje, uten å se på det som ikke bærer
    if (cp === 0) return [go(X(-14.6), -3.8, 0.6, false), go(X(-11), -4.3, 0.3), climb(5)];
    // Den lærer aldri: plankene hver gang, stillaset uten å se på takten, rett under talja.
    if (cp === 1) return [...planks, ...toL2];
    return rng() < 0.6 ? stageRoute(null) : safeUpper(false, 1.0, true);
}

/** Bane 2 «Skapelsen»: rundt kapellet mot klokka. */
function plan2(style: BotStyle, cp: number, rng: Rng, tries: number, g: G): Step[] {
    const X = (x: number) => (g.L.mirror ? -x : x);
    const S = g.L.stages[0];
    const Hs = g.L.heiser[0];
    const [w2, w1, w3] = g.L.winds;
    const hes = style === 'middels';
    const pause: Step[] = hes ? [wait((_g, st) => st.n >= 2 + Math.floor(rng() * 3))] : [];
    const withPause = (s: Step): Step[] => [...pause, s];
    const T2 = 8.5;
    const N2 = 12.4;

    // --- Sør: gulvet -> stigen -> gesimsen mot vest -> stigen -> vindusbeltet mot øst ---
    const toL1: Step[] = [go(X(10), 5.6, 0.5, false), go(X(13.6), 5.75, 0.2), climb(4.5)];
    const gesims: Step[] = [go(X(-15.1), 5.9, 0.2), climb(T2)];
    const windowBeams = (need: number): Step[] => [
        go(X(-10.85), 5.9, 0.15),
        wait(calm(w2, need)),
        jump(X(-8.85), T2, 5.9),
        ...withPause(jump(X(-6.65), T2, 5.9)),
        ...withPause(jump(X(-4.5), T2, 5.9)),
        go(X(1.6), 5.3, 0.15),
        wait(calm(w1, need)),
        jump(X(3.65), T2, 5.9),
        ...withPause(jump(X(5.85), T2, 5.9)),
        ...withPause(jump(X(8.0), T2, 5.9)),
        go(X(9.1), 5.9, 0.15),
        wait(calm(w3, need)),
        jump(X(11.15), T2, 5.9),
        ...withPause(jump(X(13.2), T2, 5.9)),
        ...withPause(jump(X(15.4), T2, 5.9)),
    ];
    const windowPlanks: Step[] = [go(X(-11), 4.85, 0.3), go(X(-4.6), 4.85, 0.4, false)];
    const eastBridge: Step[] = [
        go(X(18.4), 5.6, 0.5, false),
        go(X(18.4), -3.2, 0.5, false),
        go(X(16), -5.0, 0.3),
    ];
    const heis: Step[] = [
        go(X(12.2), 4.4, 0.2),
        wait((gg) => {
            const u = heisPhase(Hs, gg.t);
            return u > 5.5 || u < 0.3;
        }),
        heisGrab(Hs),
        ...eastBridge,
    ];

    // --- Nord: bjelkene mot vest -> stigen -> den andre broen mot øst -> stigen -> buebroen ---
    const north = (waitTalje: boolean, gain: number, sloppy: boolean): Step[] => [
        go(X(10.8), -4.25, 0.2),
        ...(waitTalje ? [wait(taljeGap)] : []),
        balanceTo(X(4.8), gain, sloppy),
        ...withPause(jump(X(2.9), T2, -5.0)),
        ...withPause(jump(X(0.7), T2, -5.0)),
        ...withPause(jump(X(-1.5), T2, -5.0)),
        ...withPause(jump(X(-3.7), T2, -5.6)),
        go(X(-13), -5.9, 0.2),
        climb(N2),
        // Våt puss før gapet: ikke stopp, hopp i fart.
        go(X(-3.4), -5.7, 0.4, false),
        jump(X(-1.2), N2, -5.7),
        go(X(7.2), -5.7, 0.2),
        wait(sackOut),
        go(X(12.6), -5.9, 0.2),
        climb(16.2),
    ];
    const buebro: Step[] = [
        go(X(4.3), -5.7, 0.2),
        ...withPause(jump(X(2.2), 16.6, -5.7)),
        go(X(-3.6), -5.7, 0.2),
        ...withPause(jump(X(-5.8), 17, -5.7)),
        go(X(-13.1), -5.4, 0.2),
        ...withPause(jump(X(-15.2), 18, -5.0)),
    ];
    const stageAndShaft: Step[] = [
        go(S.a[0], -4.05, 0.15),
        board(S, 0),
        ride(S),
        go(S.b[0], -4.2, 0.4, false),
        go(X(-18.9), -4.2, 0.35),
        go(X(-18.75), -5.7, 0.08),
        shaft(g.L.mirror ? -1 : 1, 17),
        jump(X(-15.4), 18, -5.0),
    ];
    const stageBlind: Step[] = [
        go(S.a[0], -4.05, 0.15),
        board(S, null),
        ride(S),
        go(S.b[0], -4.2, 0.4, false),
        go(X(-12.9), -4.2, 0.3),
        go(X(-11.9), -5.7, 0.3),
        go(X(-3.4), -5.7, 0.4, false),
        jump(X(-1.2), N2, -5.7),
        go(X(12.6), -5.9, 0.2),
        climb(16.2),
    ];

    if (style === 'seende') {
        if (cp === 0) return tries < 2 ? heis : toL1;
        if (cp === 1) return [...gesims, ...windowBeams(2.8), ...eastBridge];
        if (cp === 2) return tries < 3 ? stageAndShaft : north(true, 2.5, false);
        return buebro;
    }
    if (style === 'middels') {
        if (cp === 0) return toL1;
        if (cp === 1) return [...gesims, ...windowBeams(3.3), ...eastBridge];
        if (cp === 2) return north(true, 2.5, false);
        return buebro;
    }
    // rett-fram: korteste linje. Den lærer aldri: plankene over vinduet hver gang.
    if (cp === 0) return toL1;
    if (cp === 1) return [...gesims, ...windowPlanks, ...eastBridge];
    if (cp === 2) return rng() < 0.6 ? stageBlind : north(false, 1.0, true);
    return buebro;
}

// ---------------------------------------------------------------------------
// Roboten
// ---------------------------------------------------------------------------

export function makeBot(style: BotStyle, rng: Rng): (g: G) => void {
    let steps: Step[] = [];
    let i = 0;
    let st: St = { n: 0, e: 0, air: false };
    let seenRespawn = -1;
    let cp = -1;
    const tries = [0, 0, 0, 0];

    let lastT = -1;

    const plan = (g: G) =>
        (g.L.id === 'forste' ? plan1 : plan2)(style, cp, rng, tries[cp], g);

    return (g: G) => {
        if (g.ended) return;
        // I nettleseren kan flere grep komme i samme bilde. Ett grep per spilltid-øyeblikk.
        if (g.t === lastT) return;
        lastT = g.t;
        g.input.yaw = 0;
        if (style === 'tilfeldig') {
            g.input.x = Math.floor(rng() * 3) - 1;
            g.input.z = Math.floor(rng() * 3) - 1;
            if (rng() < 0.3) press(g);
            else if (rng() < 0.5) release(g);
            return;
        }
        if (g.mode === 'spill') {
            release(g);
            steer(g, 0, 0);
            return;
        }
        // Ny plan etter respawn eller nytt sjekkpunkt.
        if (g.respawns !== seenRespawn || g.cp !== cp) {
            if (g.respawns !== seenRespawn && seenRespawn >= 0) tries[g.cp]++;
            seenRespawn = g.respawns;
            cp = g.cp;
            steps = plan(g);
            i = 0;
            st = { n: 0, e: 0, air: false };
        }
        // Utfør steg; et steg som blir ferdig, gir plass til neste i samme tick.
        for (let k = 0; k < 3 && i < steps.length; k++) {
            const done = steps[i](g, st, rng);
            st.n++;
            if (done === 'fail') {
                tries[cp]++;
                steps = plan(g);
                i = 0;
                st = { n: 0, e: 0, air: false };
                break;
            }
            if (!done) break;
            i++;
            st = { n: 0, e: 0, air: false };
        }
    };
}
