// Kamera og skygge for «Frisk puss!»: rene regnestykker mot kolliderboksene, uten React.

import { ROOM, type Box, type Level, type V3 } from './level';
import { plankSolid, tileSolid, type G } from './game';

/**
 * Stråle mot bokser (slab-test). Gir minste t i [0, 1] der strålen fra a til b treffer, ellers 1.
 * `inside` = bare det som står inne i rommet (stillaset), ikke veggene: kameraet holdes inne i
 * rommet med en egen grense, så det aldri trekkes inn mot figuren av en yttervegg.
 */
export function rayHit(L: Level, a: V3, b: V3, pad = 0.15, inside = false): number {
    let best = 1;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    for (const box of L.static) {
        if (inside && (box.kind === 'vegg' || box.kind === 'gulv')) continue;
        let t0 = 0;
        let t1 = best;
        let ok = true;
        for (let ax = 0; ax < 3 && ok; ax++) {
            const o = a[ax];
            const d = ax === 0 ? dx : ax === 1 ? dy : dz;
            const lo = box.min[ax] - pad;
            const hi = box.max[ax] + pad;
            if (Math.abs(d) < 1e-9) {
                if (o < lo || o > hi) ok = false;
                continue;
            }
            let ta = (lo - o) / d;
            let tb = (hi - o) / d;
            if (ta > tb) [ta, tb] = [tb, ta];
            if (ta > t0) t0 = ta;
            if (tb < t1) t1 = tb;
            if (t0 > t1) ok = false;
        }
        // Starter strålen inne i boksen (figuren står inntil den), teller ikke treffet.
        if (ok && t0 > 1e-4 && t0 < best) best = t0;
    }
    return best;
}

function topUnder(b: Box, x: number, z: number, y: number, dy = 0): number {
    if (x < b.min[0] || x > b.max[0] || z < b.min[2] || z > b.max[2]) return -Infinity;
    const top = b.max[1] + dy;
    return top <= y + 0.05 ? top : -Infinity;
}

/** Høyden på det som ligger rett under et punkt (for skygge-bloben). */
export function groundBelow(g: G, x: number, z: number, y: number): number {
    let best = 0;
    const L = g.L;
    for (const b of L.static) {
        if (b.kind === 'vegg') continue;
        const t = topUnder(b, x, z, y);
        if (t > best) best = t;
    }
    L.planks.forEach((pg, i) => {
        if (!plankSolid(g, i)) return;
        for (const b of pg.boxes) {
            const t = topUnder(b, x, z, y);
            if (t > best) best = t;
        }
    });
    L.crumbles.forEach((c, i) =>
        c.tiles.forEach((b, k) => {
            if (!tileSolid(g, i, k)) return;
            const t = topUnder(b, x, z, y);
            if (t > best) best = t;
        })
    );
    for (const b of g.stageBoxes) {
        const t = topUnder(b, x, z, y);
        if (t > best) best = t;
    }
    return best;
}

// ---------------------------------------------------------------------------
// Følgekameraet. Kameraet skal aldri være fienden:
// - det følger av seg selv (kritisk dempet fjær, ingen brå flytt),
// - det står i det åpne kirkerommet og ser mot veggen banen går langs,
// - det ser litt fram i løperetningen og hever/senker seg jevnt med figuren,
// - det roterer bare når eleven vil (Q/E, musdrag, C = rett opp igjen),
// - blir det trangt, løftes det og vipper ned i stedet for å gå inn i figuren,
// - ved en kant eller i kantgrep tipper det ned så landingsstedet syns.
// ---------------------------------------------------------------------------


export const CAM_DIST = 8; // ønsket avstand (vannrett) bak figuren
export const CAM_MIN = 5.5; // aldri nærmere enn dette (i rommet, ikke bare vannrett)
const CAM_H = 3.0; // høyde over blikkpunktet
const FOCUS_Y = 1.2; // blikkpunktet: brysthøyde på figuren
const THIN = 0.3; // radius på den tynne «kulestrålen»
const MARGIN = 0.5; // avstand til veggene i rommet

export interface FollowCam {
    /**
     * Standardvinkelen for der figuren er på banen (camZones), og hvor fort den glir. Den
     * byttes bare når eleven går rundt et hjørne til en ny vegg, og da mykt over et par sekunder.
     */
    base: number;
    baseV: number[];
    /** Det eleven selv har rotert med Q/E og mus (legges oppå standardvinkelen). */
    user: number;
    /** Vinkelen kameraet sikter mot (radianer). 0 = fra det åpne rommet i sør, mot nordveggen. */
    yawT: number;
    yaw: number;
    yawV: number[];
    /** Blikkpunktet, glattet. */
    at: V3;
    atV: number[];
    /** Hvor langt fram kameraet ser (vannrett), glattet. */
    lead: V3;
    leadV: number[];
    /** Høyde over blikkpunktet og hvor mye kameraet tipper ned, glattet. */
    h: number;
    tilt: number;
    hv: number[];
    /** Hvor mye av avstanden som er fri for stillas (0-1): raskt inn, sakte ut. */
    pull: number;
    /** Hvor mye blikket senkes mot paven når han er like under deg (glattet). */
    popeDip: number;
    popeDipV: number[];
    /** Hvor mye siktet løftes over figuren (radianer), glattet: figuren i nedre-midtre tredjedel. */
    frame: number;
    frameV: number[];
    ready: boolean;
    /** Resultatet: kameraets posisjon og punktet det ser på. */
    pos: V3;
    look: V3;
}

export function newFollowCam(): FollowCam {
    return {
        base: 0,
        baseV: [0],
        user: 0,
        yawT: 0,
        yaw: 0,
        yawV: [0],
        at: [0, 0, 0],
        atV: [0, 0, 0],
        lead: [0, 0, 0],
        leadV: [0, 0, 0],
        h: CAM_H,
        tilt: 0,
        hv: [0, 0],
        pull: 1,
        popeDip: 0,
        popeDipV: [0],
        frame: 0,
        frameV: [0],
        ready: false,
        pos: [0, 0, 0],
        look: [0, 0, 0],
    };
}

/** Kritisk dempet fjær (som SmoothDamp): følger målet mykt uten å skyte over. */
function damp(cur: number, tgt: number, vel: number[], i: number, time: number, dt: number) {
    const o = 2 / time;
    const x = o * dt;
    const e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const ch = cur - tgt;
    const tmp = (vel[i] + o * ch) * dt;
    vel[i] = (vel[i] - o * tmp) * e;
    return tgt + (ch + tmp) * e;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const RA: V3 = [0, 0, 0];
const RB: V3 = [0, 0, 0];

/** Tynn kulestråle: fem stråler (midt, høyre, venstre, opp, ned). Gir minste frie andel 0-1. */
function thinRay(L: Level, a: V3, b: V3, rx: number, rz: number): number {
    let t = 1;
    const offs = [
        [0, 0, 0],
        [rx * THIN, 0, rz * THIN],
        [-rx * THIN, 0, -rz * THIN],
        [0, THIN, 0],
        [0, -THIN, 0],
    ];
    for (const o of offs) {
        RA[0] = a[0] + o[0];
        RA[1] = a[1] + o[1];
        RA[2] = a[2] + o[2];
        RB[0] = b[0] + o[0];
        RB[1] = b[1] + o[1];
        RB[2] = b[2] + o[2];
        t = Math.min(t, rayHit(L, RA, RB, 0.1, true));
    }
    return t;
}

/** Står figuren ved en kant (det er langt ned rett foran den)? */
export function atEdge(g: G): boolean {
    if (g.mode !== 'ground') return false;
    const fx = g.p[0] + Math.sin(g.facing) * 0.9;
    const fz = g.p[2] + Math.cos(g.facing) * 0.9;
    return groundBelow(g, fx, fz, g.p[1] + 0.1) < g.p[1] - 1.2;
}

const WANT: V3 = [0, 0, 0];

/** Ett bilde for kameraet. `rot` = Q/E-rotasjon denne rammen (radianer), `recenter` = C. */
/** Standardvinkelen der figuren står nå (samme som før hvis den er mellom to soner). */
export function zoneYaw(L: Level, p: V3, cur: number): number {
    for (const z of L.camZones)
        if (p[0] >= z.x0 && p[0] < z.x1 && p[2] >= z.z0 && p[2] < z.z1) return z.yaw;
    return cur;
}

/** Hvor fort standardvinkelen får gli ved et hjørne (radianer/s): 90 grader på ca. to sekunder. */
const BASE_RATE = 1.0;

/** Kameraet ser aldri brattere ned enn dette (heisen og østbroen så nesten rett ned). */
export const MAX_PITCH = (55 * Math.PI) / 180;
const TAN_PITCH = Math.tan(MAX_PITCH);

/** Halve synsvinkelen i høyden (kameraet har fov 62). */
export const HALF_FOV = (31 * Math.PI) / 180;
/** Siktet løftes så brystet står så langt under midten (andel av halve bildet). */
const FRAME_LIFT = 0.24;
/** Hodet (med luft over) skal aldri over denne andelen av halve bildet over midten. */
const HEAD_MAX = 0.5;
/** Føttene skal aldri under denne andelen av halve bildet under midten. */
const FEET_MIN = 0.82;

function pitchTo(c: FollowCam, x: number, y: number, z: number) {
    return Math.atan2(y - c.pos[1], Math.hypot(x - c.pos[0], z - c.pos[2]));
}

/**
 * Rammen (bare siktet, ikke følgereglene): figuren står i nedre-midtre tredjedel med god luft
 * over. Siktet løftes litt over brystet, men aldri så mye at føttene forsvinner, og aldri så
 * lite (kant-tipp, paven under deg) at hodet kuttes i toppkanten.
 */
function frameFigure(c: FollowCam, g: G, dt: number) {
    const hx = c.look[0] - c.pos[0];
    const hz = c.look[2] - c.pos[2];
    const hl = Math.hypot(hx, hz);
    if (hl < 0.2) return;
    const cur = Math.atan2(c.look[1] - c.pos[1], hl);
    const head = pitchTo(c, g.p[0], g.p[1] + 2.35, g.p[2]);
    const feet = pitchTo(c, g.p[0], g.p[1] - 0.1, g.p[2]);
    let want = cur + FRAME_LIFT * HALF_FOV;
    want = Math.max(want, head - HEAD_MAX * HALF_FOV);
    want = Math.min(want, feet + FEET_MIN * HALF_FOV);
    // Aldri brattere ned enn grensa over.
    want = Math.max(want, -MAX_PITCH - 0.05);
    const d = want - cur;
    c.frame = c.ready ? damp(c.frame, d, c.frameV, 0, 0.12, dt) : d;
    // Hodet skal aldri ut av bildet, heller ikke mens glattingen henger etter.
    const f = Math.max(c.frame, head - HEAD_MAX * HALF_FOV * 1.3 - cur);
    c.look[1] = c.pos[1] + Math.tan(cur + f) * hl;
}

export function followCamera(c: FollowCam, g: G, dt: number, rot: number, recenter: boolean) {
    // --- Standardvinkelen: byttes mykt når figuren går rundt et hjørne ---
    const zy = zoneYaw(g.L, g.p, c.ready ? c.base : zoneYaw(g.L, g.p, 0));
    if (!c.ready) c.base = zy;
    else {
        const nb = damp(c.base, zy, c.baseV, 0, 0.7, dt);
        const lim = BASE_RATE * dt;
        c.base += Math.max(-lim, Math.min(lim, nb - c.base));
    }
    // --- Rotasjon: bare når eleven vil ---
    c.user += rot;
    if (recenter) c.user = Math.round(c.user / (2 * Math.PI)) * 2 * Math.PI;
    c.yawT = c.base + c.user;
    c.yaw = c.ready ? damp(c.yaw, c.yawT, c.yawV, 0, 0.12, dt) : c.yawT;

    const climbing = g.mode === 'ladder' || g.mode === 'wall' || g.mode === 'rope';
    const hanging = g.mode === 'hang' || g.mode === 'climbup';
    const edge = atEdge(g);

    // --- Se fram i løperetningen ---
    const vx = g.v[0];
    const vz = g.v[2];
    const sp = Math.hypot(vx, vz);
    let lx = 0;
    let lz = 0;
    if (!climbing && !hanging) {
        if (sp > 0.6) {
            const k = Math.min(2.2, sp * 0.42) / sp;
            lx = vx * k;
            lz = vz * k;
        } else if (g.mode === 'ground') {
            // Står du stille, ser kameraet litt dit du sist så.
            lx = Math.sin(g.facing) * 1.0;
            lz = Math.cos(g.facing) * 1.0;
        }
    }
    // Fram mot veggen eller ut i rommet teller mindre enn sidelengs: banen går langs veggen.
    const sx = Math.cos(c.yaw);
    const sz = -Math.sin(c.yaw);
    const side = lx * sx + lz * sz;
    const fwdX = lx - side * sx;
    const fwdZ = lz - side * sz;
    lx = side * sx + fwdX * 0.35;
    lz = side * sz + fwdZ * 0.35;

    // --- Blikkpunktet: glir etter figuren ---
    const ax = g.p[0];
    const ay = g.p[1] + FOCUS_Y + (climbing ? 1.5 : 0); // i stigen: se opp mot der du skal
    const az = g.p[2];
    if (!c.ready) {
        c.at = [ax, ay, az];
        c.lead = [lx, 0, lz];
        c.h = CAM_H;
        c.tilt = 0;
        c.pull = 1;
    }
    c.lead[0] = damp(c.lead[0], lx, c.leadV, 0, 0.7, dt);
    c.lead[2] = damp(c.lead[2], lz, c.leadV, 2, 0.7, dt);
    c.at[0] = damp(c.at[0], ax, c.atV, 0, 0.16, dt);
    c.at[1] = damp(c.at[1], ay, c.atV, 1, 0.32, dt);
    c.at[2] = damp(c.at[2], az, c.atV, 2, 0.16, dt);

    // Ved en kant eller i kantgrep: kameraet løftes og tipper ned, så landingsstedet syns.
    const down = edge || hanging;
    c.h = damp(c.h, CAM_H + (down ? 1.4 : 0) - (climbing ? 1.2 : 0), c.hv, 0, 0.5, dt);
    c.tilt = damp(c.tilt, down ? 1.1 : 0, c.hv, 1, 0.5, dt);

    const fx = c.at[0] + c.lead[0];
    const fy = c.at[1];
    const fz = c.at[2] + c.lead[2];

    // --- Ønsket plass: bak blikkpunktet, i det åpne rommet ---
    const bx = Math.sin(c.yaw);
    const bz = Math.cos(c.yaw);
    WANT[0] = clamp(fx + bx * CAM_DIST, ROOM.x0 + MARGIN, ROOM.x1 - MARGIN);
    WANT[1] = fy + c.h;
    WANT[2] = clamp(fz + bz * CAM_DIST, ROOM.z0 + MARGIN, ROOM.z1 - MARGIN);

    // --- Kollisjon med stillaset: tynn kulestråle, raskt inn og sakte ut ---
    const free = thinRay(g.L, [fx, fy, fz], WANT, sx, sz);
    const pullT = free < 1 ? Math.max(0, free - 0.06) : 1;
    const rate = pullT < c.pull ? 14 : 1.6;
    c.pull = c.ready ? c.pull + (pullT - c.pull) * (1 - Math.exp(-dt * rate)) : pullT;

    // Vannrett avstand etter kollisjon. Blir den kort, løftes kameraet så det aldri går inn i figuren.
    const ox = (WANT[0] - fx) * c.pull;
    const oz = (WANT[2] - fz) * c.pull;
    const hd = Math.hypot(ox, oz);
    const need = hd < CAM_MIN ? Math.sqrt(CAM_MIN * CAM_MIN - hd * hd) : 0;
    const up = Math.max(c.h, need);

    c.pos[0] = clamp(fx + ox, ROOM.x0 + MARGIN, ROOM.x1 - MARGIN);
    c.pos[1] = clamp(fy + up, 0.6, ROOM.h - MARGIN);
    c.pos[2] = clamp(fz + oz, ROOM.z0 + MARGIN, ROOM.z1 - MARGIN);
    // Paven like under deg: blikket senkes litt mot ham (bare siktet, ikke plasseringen).
    let dip = 0;
    if (g.popeActive && !g.ended) {
        const dy = g.p[1] - g.pope[1];
        const d = Math.hypot(g.pope[0] - g.p[0], g.pope[2] - g.p[2], dy);
        if (dy > 1 && d < 8) dip = Math.min(1.2, dy * 0.35) * (1 - d / 8) * 1.6;
    }
    c.popeDip = damp(c.popeDip, Math.min(1.2, dip), c.popeDipV, 0, 0.8, dt);
    c.look[0] = fx;
    c.look[1] = fy - c.tilt - c.popeDip;
    c.look[2] = fz;

    // Aldri brattere enn 55 grader ned: står kameraet nesten rett over figuren (trangt mellom
    // stillas, eller i heisen), glir det bakover langs sin egen vinkel i stedet. Det som da står
    // i veien, tones ut i materialene (se occlusion i materials.ts). Veggene er fortsatt grensa.
    const vy = c.pos[1] - c.look[1];
    const hx = c.pos[0] - c.look[0];
    const hz = c.pos[2] - c.look[2];
    const hdl = Math.hypot(hx, hz);
    if (vy > hdl * TAN_PITCH) {
        const need = vy / TAN_PITCH;
        // Retningen bakover: kameraets egen vinkel, blandet med der det står når det står langt ut.
        const w = clamp(hdl / need, 0, 1);
        let dx = bx * (1 - w) + (hdl > 1e-3 ? hx / hdl : 0) * w;
        let dz = bz * (1 - w) + (hdl > 1e-3 ? hz / hdl : 0) * w;
        const dl = Math.hypot(dx, dz) || 1;
        dx /= dl;
        dz /= dl;
        c.pos[0] = clamp(c.look[0] + dx * need, ROOM.x0 + MARGIN, ROOM.x1 - MARGIN);
        c.pos[2] = clamp(c.look[2] + dz * need, ROOM.z0 + MARGIN, ROOM.z1 - MARGIN);
        // Stopper veggen det, senkes kameraet i stedet.
        const hd2 = Math.hypot(c.pos[0] - c.look[0], c.pos[2] - c.look[2]);
        if (hd2 < need - 1e-3) c.pos[1] = c.look[1] + hd2 * TAN_PITCH;
    }
    frameFigure(c, g, dt);
    c.ready = true;
}

/**
 * Der mesteren står og maler i mål: på plattformen, rett under takfeltet, ved enden lengst fra
 * endeveggen (så veggen ikke fyller nærbildet), et stykke fra lærlingen og med ryggen mot
 * lærlingen. Han bøyer seg bakover, så penselen går mot taket over ham. Står lærlingen for
 * nær, tar han den andre enden. Kameraet bruker samme punkt.
 */
export function masterPaintSpot(L: Level, px: number): { x: number; z: number; rotY: number } {
    const [mx, , mz] = L.master.p;
    const b = L.static.find((x) => x.kind === 'mester');
    if (!b) return { x: mx, z: mz, rotY: L.master.rotY };
    const lo = b.min[0] + 0.45;
    const hi = b.max[0] - 0.45;
    const openEnd = mx < 0 ? hi : lo;
    const wallEnd = mx < 0 ? lo : hi;
    const x = Math.abs(openEnd - px) >= 1.1 ? openEnd : wallEnd;
    const z = Math.max(b.min[2] + 0.6, Math.min(b.max[2] - 0.6, mz));
    return { x, z, rotY: px >= x ? -Math.PI / 2 : Math.PI / 2 };
}
