import * as THREE from 'three';
import { waveHeight, type Env } from './env';
import { HALF_L } from './model';
import type { Game } from './game';

// Hvor knarren ligger i 3D-scenen, og hvordan den vugger på bølgene. Regnes ut én
// gang per bilde (før skipet, kameraet og kulissene tegnes) og deles av alle.

export interface Pose {
    x: number;
    z: number;
    heave: number;
    yaw: number;
    pitch: number;
    roll: number;
    /** Hvor fort skipet går i scenen (m/s). */
    vis: number;
    quat: THREE.Quaternion;
    matrix: THREE.Matrix4;
    /** Hvor mye baugen stuper akkurat nå (til sprut). */
    dive: number;
}

export function makePose(): Pose {
    return {
        x: 0,
        z: 0,
        heave: 0,
        yaw: 0,
        pitch: 0,
        roll: 0,
        vis: 0,
        quat: new THREE.Quaternion(),
        matrix: new THREE.Matrix4(),
        dive: 0,
    };
}

const E = new THREE.Euler(0, 0, 0, 'YXZ');
const P = new THREE.Vector3();
const S = new THREE.Vector3(1, 1, 1);
const F = new THREE.Vector3();
const R = new THREE.Vector3();

/** Skipets fart i scenen: 0,5 m per km spillfart (se NEAR i scenery.tsx). */
export const VIS_PER_KM = 0.5;

export function stepPose(
    pose: Pose,
    g: Game,
    env: Env,
    dt: number,
    menu: boolean,
    heelKick: number
) {
    const speed = menu ? 10 : g.speed;
    pose.vis = speed * VIS_PER_KM;
    const heading = menu ? 0 : g.heading;
    pose.yaw = -heading;
    pose.x += Math.sin(heading) * pose.vis * dt;
    pose.z += -Math.cos(heading) * pose.vis * dt;
    env.shipX = pose.x;
    env.shipZ = pose.z;

    // Fire punkter på skroget: baug, hekk, babord, styrbord.
    const fx = -Math.sin(pose.yaw);
    const fz = -Math.cos(pose.yaw);
    F.set(fx, 0, fz);
    R.set(-fz, 0, fx);
    const L = HALF_L * 0.8;
    const B = 2.0;
    const t = env.time;
    const s = env.waveScale;
    const hb = waveHeight(pose.x + F.x * L, pose.z + F.z * L, t, s);
    const hs = waveHeight(pose.x - F.x * L, pose.z - F.z * L, t, s);
    const hr = waveHeight(pose.x + R.x * B, pose.z + R.z * B, t, s);
    const hl = waveHeight(pose.x - R.x * B, pose.z - R.z * B, t, s);
    const heave = (hb + hs + hr + hl) / 4;
    const pitch = Math.atan2(hb - hs, L * 2) * 0.85;
    const roll = Math.atan2(hr - hl, B * 2) * 0.55 + heelKick;
    // Skroget er tungt: det følger bølgene med litt treghet.
    const k = Math.min(1, dt * 5);
    const prevPitch = pose.pitch;
    pose.heave += (heave + 0.05 - pose.heave) * k;
    pose.pitch += (pitch - pose.pitch) * k;
    pose.roll += (roll - pose.roll) * Math.min(1, dt * 3);
    pose.dive = Math.max(0, (prevPitch - pose.pitch) / Math.max(dt, 1e-3));

    E.set(pose.pitch, pose.yaw, pose.roll, 'YXZ');
    pose.quat.setFromEuler(E);
    P.set(pose.x, pose.heave, pose.z);
    pose.matrix.compose(P, pose.quat, S);
}
