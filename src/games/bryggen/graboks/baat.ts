// Færingen: hvor gutten kan gå i land fra båten. Flyttet ut av game.ts.
import * as THREE from 'three';
import { WATER_Y, type Faering } from '../motor/boat';
import type { Physics } from '../motor/physics';
import { BOY_TUNING } from '../motor/character';

/** Et sted på land ved siden av, foran eller bak færingen der gutten får plass, eller null. */
export function finnLanding(b: Faering, phys: Physics): THREE.Vector3 | null {
    const fx = Math.sin(b.yaw);
    const fz = Math.cos(b.yaw);
    const cands: [number, number][] = [];
    for (const along of [0, 1.4, -1.4]) {
        for (const side of [1.9, -1.9]) cands.push([b.pos.x + fx * along + fz * side, b.pos.z + fz * along - fx * side]);
    }
    cands.push([b.pos.x + fx * 3.8, b.pos.z + fz * 3.8], [b.pos.x - fx * 3.8, b.pos.z - fz * 3.8]);
    for (const [x, z] of cands) {
        const hit = phys.rayWorld(new THREE.Vector3(x, 3, z), new THREE.Vector3(0, -1, 0), 4);
        if (!hit || hit.normal.y < 0.7 || hit.point.y < WATER_Y + 0.6) continue;
        const t = BOY_TUNING;
        if (phys.capsuleFits(new THREE.Vector3(x, hit.point.y + t.height / 2 + 0.05, z), t.height / 2 - t.radius, t.radius)) {
            return new THREE.Vector3(x, hit.point.y, z);
        }
    }
    return null;
}
