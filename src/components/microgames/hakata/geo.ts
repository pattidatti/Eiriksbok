import * as THREE from 'three';
import { slotX, SEC_X, type Ladder } from './game';

// Geometrien i scenen: muren, stigene og kameraplassene. Delt av 3D-scenen og
// komponenten (som projiserer punktene til skjermen for sveip og lapper).

/** Toppen av brystvernet (der stigen hekter seg) og gangveien bak. */
export const PARAPET_Y = 2.55;
export const WALK_Y = 2.3;
export const WATER_Y = -2.4;
/** Stigefoten ute i fjæra, og toppen mot muren. */
const BASE_Y = -2.2;
const BASE_Z = -6.2;
const TOP_Y = 2.75;
const TOP_Z = -0.45;
export const LADDER_LEN = Math.hypot(TOP_Y - BASE_Y, TOP_Z - BASE_Z);
const LEAN = Math.atan2(TOP_Z - BASE_Z, TOP_Y - BASE_Y);

export const EYE_Y = 4.3;
export const EYE_Z = -0.1;
export const camPos = (x: number, out: THREE.Vector3) => out.set(x, EYE_Y, EYE_Z);
export const camLook = (x: number, out: THREE.Vector3) => out.set(x, EYE_Y - 4.4, EYE_Z - 6.05);
/** Tvekampen: nede på stranda foran muren. */
export const DUEL_EYE: [number, number, number] = [0, 0.15, -0.9];
export const duelLook = (x: number, out: THREE.Vector3) => out.set(x, -0.2, -6);
export const CHAMP_Z = -3.6;
export const BEACH_Y = -1.35;

const easeOutBack = (k: number) => {
    const c = 1.7;
    return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
};

/** Stigens vinkel mot loddlinja (positiv = lent inn mot muren). */
export function ladderAngle(l: Ladder, t: number): number {
    if (l.state === 'reises') return THREE.MathUtils.lerp(-0.95, LEAN, easeOutBack(Math.min(1, l.raise)));
    if (l.state === 'faller') {
        const k = Math.min(1, l.fallT / 0.45);
        return LEAN - k * k * (LEAN + 1.5);
    }
    // Stigen dirrer når noen klatrer.
    return LEAN + (l.men.length ? Math.sin(t * 17 + l.id) * 0.006 : 0);
}

/** Hvor dypt en fallen stige har sunket. */
export const ladderSink = (l: Ladder) => (l.state === 'faller' ? Math.max(0, l.fallT - 0.45) * 1.6 : 0);

export const ladderBase = (l: Ladder, out: THREE.Vector3) =>
    out.set(slotX(l.sec, l.slot), BASE_Y - ladderSink(l), BASE_Z);

/** Et punkt langs stigen (`along` meter fra foten, `off` meter ut mot sjøen). */
export function ladderPoint(l: Ladder, along: number, off: number, t: number, out: THREE.Vector3) {
    const a = ladderAngle(l, t);
    ladderBase(l, out);
    out.y += along * Math.cos(a) + off * Math.sin(a);
    out.z += along * Math.sin(a) - off * Math.cos(a);
    return out;
}

/** Mannen som står på brystvernet og holder stigen. */
export const wallManPos = (l: Ladder, out: THREE.Vector3) => out.set(slotX(l.sec, l.slot), 2.05, -0.95);

export const secX = (s: number) => SEC_X[s];

/** Mongolinvasjonsrullens farger (se kunstbriefen). */
export const PAL = {
    paper: '#eadfc4',
    ink: '#221c17',
    red: '#c0392b',
    green: '#3e7a5a',
    gold: '#c9a24a',
    blue: '#2d4c78',
    stone: '#9d9384',
    wood: '#7a5634',
};
