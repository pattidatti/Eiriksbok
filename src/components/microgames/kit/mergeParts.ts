import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Slå sammen småbiter til én geometri med farger i hjørnene (vertex colors).
//
// Et fly av fem bokser er fem draw calls. Tolv slike fly i lufta er seksti - og en
// Chromebook-GPU tåler bare noen hundre per bilde (se «Chromebook først» i
// build_microgame.md). Samme fly som én sammenslått geometri er ett draw call,
// og kan fortsatt flyttes, skjules og vippes som før.
//
// Bruk:
//   const BOMBER = mergeParts([
//       { geometry: new THREE.BoxGeometry(0.055, 0.055, 0.32), color: '#2f3236' },
//       { geometry: new THREE.BoxGeometry(0.42, 0.014, 0.08), position: [0, 0, 0.02], color: '#3a3e43' },
//   ]);
//   <mesh geometry={BOMBER} castShadow><meshStandardMaterial vertexColors roughness={0.6} /></mesh>
//
// Lag geometrien én gang på modulnivå, ikke i render.

export interface Part {
    geometry: THREE.BufferGeometry;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    color: THREE.ColorRepresentation;
}

export function mergeParts(parts: Part[]): THREE.BufferGeometry {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Color();
    const geos = parts.map((p) => {
        // Uten indeks, så alle biter har samme attributter og kan slås sammen.
        const g = p.geometry.index ? p.geometry.toNonIndexed() : p.geometry.clone();
        g.deleteAttribute('uv');
        e.set(...(p.rotation ?? [0, 0, 0]));
        q.setFromEuler(e);
        m.compose(
            new THREE.Vector3(...(p.position ?? [0, 0, 0])),
            q,
            new THREE.Vector3(...(p.scale ?? [1, 1, 1]))
        );
        g.applyMatrix4(m);
        c.set(p.color).convertSRGBToLinear();
        const n = g.getAttribute('position').count;
        const col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            col[i * 3] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        return g;
    });
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) throw new Error('mergeParts: bitene kunne ikke slås sammen');
    merged.computeBoundingSphere();
    return merged;
}
