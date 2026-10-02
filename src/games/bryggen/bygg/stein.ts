// Det steinbyggene deler: kleberstein-tonene, flatene man bygger på, vinduer og portaler, lister.
// Brukt av Mariakirken, Nikolaikirken, rådhusets grunnmur og steinbyggene på Holmen.
import * as THREE from 'three';
import type { ColliderKit, MeshKit, Tint } from '../motor/meshkit';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Kleberstein: grå med et grønnskjær, mørkere nederst der regnet spruter opp.
export const STEIN: Tint = { top: 0.98, bottom: 0.72, hue: [0.9, 0.97, 0.95] };
export const LIST: Tint = { top: 1.1, bottom: 1.1, hue: [0.95, 1.0, 0.97] };
export const TAK: Tint = { top: 0.72, bottom: 0.72, hue: [0.92, 0.9, 0.9] };
const HULL: Tint = { top: 1, bottom: 1 };

/** Kjør `fn` på veggflaten: z = 0 er flaten, +z peker ut, x går langs veggen. */
export type Flate = 'px' | 'nx' | 'pz' | 'nz';
export function paFlate(k: MeshKit, f: Flate, cx: number, cz: number, hx: number, hz: number, fn: () => void, c?: ColliderKit): void {
    if (f === 'pz') k.at(cx, 0, cz + hz, 0, fn, c);
    else if (f === 'nz') k.at(cx, 0, cz - hz, Math.PI, fn, c);
    else if (f === 'px') k.at(cx + hx, 0, cz, Math.PI / 2, fn, c);
    else k.at(cx - hx, 0, cz, -Math.PI / 2, fn, c);
}

/**
 * Vindu eller portal i veggflaten: en mørk åpning med rund (romansk) eller spiss (gotisk) bue,
 * og en lysere steinkrans rundt buen. `u` er midten langs veggen, `y0` bunnen, `h` opp til
 * der buen starter. `fyll: false` gir bare kransen: hullet er ekte (buer.ts).
 */
export function apning(k: MeshKit, u: number, y0: number, w: number, h: number, bue: 'rund' | 'spiss' = 'rund', fyll = true): void {
    const z = 0.05;
    const r = w / 2;
    if (fyll) {
        k.withTint(HULL, () => {
            k.quad('mork', V(u - r, y0, z), V(w, 0, 0), V(0, h, 0));
            if (bue === 'spiss') {
                k.tri('mork', V(u - r, y0 + h, z), V(u + r, y0 + h, z), V(u, y0 + h + w * 0.9, z), [0, 0], [0, 0], [0, 0]);
                return;
            }
            const seg = 8;
            for (let i = 0; i < seg; i++) {
                const a0 = (i / seg) * Math.PI;
                const a1 = ((i + 1) / seg) * Math.PI;
                k.tri('mork', V(u, y0 + h, z), V(u + Math.cos(a0) * r, y0 + h + Math.sin(a0) * r, z), V(u + Math.cos(a1) * r, y0 + h + Math.sin(a1) * r, z), [0, 0], [0, 0], [0, 0]);
            }
        });
    }
    if (bue === 'spiss') {
        // Gotiske vinduer får en list under i stedet: smale lansetter har ikke plass til krans.
        k.withTint(LIST, () => k.box('stein', u, y0 - 0.1, z + 0.1, w + 0.5, 0.2, 0.3));
        return;
    }
    // Buesteinene: en krans av små firkanter rundt buen, litt ute fra veggen.
    const t = Math.min(0.32, w * 0.22);
    k.withTint(LIST, () => {
        const seg = 8;
        const ro = r + t;
        for (let i = 0; i < seg; i++) {
            const a0 = (i / seg) * Math.PI;
            const a1 = ((i + 1) / seg) * Math.PI;
            const p0 = V(u + Math.cos(a0) * r, y0 + h + Math.sin(a0) * r, z + 0.04);
            const p1 = V(u + Math.cos(a1) * r, y0 + h + Math.sin(a1) * r, z + 0.04);
            const q0 = V(u + Math.cos(a0) * ro, y0 + h + Math.sin(a0) * ro, z + 0.04);
            const q1 = V(u + Math.cos(a1) * ro, y0 + h + Math.sin(a1) * ro, z + 0.04);
            k.tri('stein', p0, q0, q1, [p0.x, p0.y], [q0.x, q0.y], [q1.x, q1.y]);
            k.tri('stein', p0, q1, p1, [p0.x, p0.y], [q1.x, q1.y], [p1.x, p1.y]);
        }
    });
}

/** Gesims: en list som stikker litt ut rundt toppen av en boks. */
export function gesims(k: MeshKit, cx: number, cz: number, sx: number, sz: number, y: number, ut = 0.22): void {
    k.withTint(LIST, () => k.box('stein', cx, y, cz, sx + ut * 2, 0.32, sz + ut * 2));
}

/**
 * Gesims rundt et hult bygg: fire lister langs ytterkanten, så rommet innenfor er åpent opp mot
 * taket (`gesims` er en massiv plate og ville blitt et steinhimling inne).
 */
export function gesimsRing(k: MeshKit, cx: number, cz: number, sx: number, sz: number, y: number, ut = 0.22, sider: Flate[] = ['px', 'nx', 'pz', 'nz']): void {
    const b = ut * 2;
    k.withTint(LIST, () => {
        if (sider.includes('px')) k.box('stein', cx + sx / 2, y, cz, b, 0.32, sz + b);
        if (sider.includes('nx')) k.box('stein', cx - sx / 2, y, cz, b, 0.32, sz + b);
        if (sider.includes('pz')) k.box('stein', cx, y, cz + sz / 2, sx + b, 0.32, b);
        if (sider.includes('nz')) k.box('stein', cx, y, cz - sz / 2, sx + b, 0.32, b);
    });
}
