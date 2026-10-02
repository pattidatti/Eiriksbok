// Torglivet på Nikolaikirkeallmenningen: salgsboder, en brønn, en slede og sporene i gjørma.
//
// At allmenningen var byens torg til 1470, er [V Byleksikon]; den første torgplassen lå trolig
// øverst, der allmenningen møtte Øvregaten [V Wikipedia, «trolig»]. Hvordan bodene, brønnen og
// sledene så ut i 1420-årene, er ikke beskrevet i kildene vi har [K], så alt her er valgt etter
// eldre norske bilder og museumsgjenstander [S].
import * as THREE from 'three';
import type { ColliderKit, MeshKit, Tint } from '../motor/meshkit';
import { fisk, sekker } from './bu';
import { tonne, WARM } from './gard';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const BORD_Y = 0.85;
const VIDJE: Tint = { top: 1.05, bottom: 0.85, hue: [1.12, 1.0, 0.78] };
export type Vare = 'fisk' | 'korn' | 'kurver' | 'tonner';

/**
 * Salgsbod: disk på bukker med et skrått bordtak over, varene på disken og ved siden av. Bodens
 * rom: disken langs x, kjøperne foran (-z), selgeren bak (+z). `rot` snur boden på plass.
 */
export function bod(k: MeshKit, c: ColliderKit, x: number, z: number, rot: number, vare: Vare, r: () => number): void {
    k.at(x, 0, z, rot, () => {
        const L = 2.4;
        // Disken: plate på to bukker og et forkle av bord ned mot gjørma.
        k.withTint({ top: 0.75, bottom: 0.75, hue: [1.05, 0.98, 0.9] }, () => k.box('raatre', 0, BORD_Y - 0.03, 0, L, 0.06, 0.8, { grain: 'x' }));
        k.withTint({ top: 0.62, bottom: 0.45 }, () => k.box('bordvegg', 0, (BORD_Y - 0.08) / 2 + 0.05, -0.37, L - 0.1, BORD_Y - 0.15, 0.03, { shadeFoot: true }));
        k.withTint({ top: 0.45, bottom: 0.45 }, () => {
            for (const bx of [-L / 2 + 0.3, L / 2 - 0.3]) {
                for (const sz of [-1, 1]) {
                    const m = new THREE.Matrix4().makeRotationX(sz * 0.2).setPosition(bx, (BORD_Y - 0.06) / 2, sz * 0.2);
                    k.slab('raatre', m, 0.08, BORD_Y - 0.02, 0.08);
                }
            }
        });
        c.box(0, BORD_Y / 2, 0, L, BORD_Y, 0.8, true);
        // Stolper og tak: høyest bak, så regnet renner av foran kjøperne.
        const fy = 2.15;
        const by = 2.55;
        const zf = -0.5;
        const zb = 1.3;
        k.withTint({ top: 0.7, bottom: 0.7 }, () => {
            for (const sx of [-1, 1]) {
                k.log('raatre', V(sx * 1.25, 0, zf), V(sx * 1.25, fy, zf), 0.06, 6);
                k.log('raatre', V(sx * 1.25, 0, zb), V(sx * 1.25, by, zb), 0.06, 6);
                k.box('raatre', sx * 1.25, (fy + by) / 2 - 0.08, (zf + zb) / 2, 0.08, 0.1, zb - zf + 0.1);
                c.box(sx * 1.25, fy / 2, zf, 0.14, fy, 0.14, true);
                c.box(sx * 1.25, by / 2, zb, 0.14, by, 0.14, true);
            }
        });
        const a = Math.atan2(by - fy, zb - zf);
        const run = (zb - zf + 0.6) / Math.cos(a);
        const m = new THREE.Matrix4().makeRotationX(-a).setPosition(0, (fy + by) / 2 + 0.06, (zf + zb) / 2);
        k.withTint({ top: 0.85, bottom: 0.85, hue: [1.02, 0.98, 0.94] }, () => k.slab('bordtak', m, L + 0.5, 0.05, run));
        varer(k, c, vare, r);
    }, c);
}

/** Varene på disken og ved siden av boden. */
function varer(k: MeshKit, c: ColliderKit, vare: Vare, r: () => number): void {
    const y = BORD_Y;
    if (vare === 'fisk') {
        // Tørrfisk på tvers av disken, hodene annenhver vei, i to lag. Tørrfisken var
        // hovedvaren på Bryggen [V].
        for (let lag = 0; lag < 2; lag++) {
            for (let i = 0; i < 11; i++) {
                const x = -1.05 + i * 0.21 + lag * 0.1;
                if (lag === 1 && (i < 2 || i > 8)) continue;
                const dir = i % 2 === 0 ? 1 : -1;
                fisk(k, V(x, y + 0.01 + lag * 0.05, -dir * 0.36), V(0, 0, dir), 0.74, r, (r() - 0.5) * 0.2);
            }
        }
        // En bunt surret med tau på bakken ved siden av.
        k.withTint({ top: 1.2, bottom: 1.0, hue: [1.02, 0.98, 0.86] }, () => k.withUv(0.04, () => k.box('raatre', 1.75, 0.2, 0.3, 0.62, 0.4, 0.42)));
        c.box(1.75, 0.2, 0.3, 0.62, 0.4, 0.42, true);
    } else if (vare === 'korn') {
        // Sekker ved disken og åpne kar med korn på disken.
        sekker(k, c, { x0: 1.45, x1: 2.0, z0: -0.3, z1: 0.9 }, 0, r);
        for (const x of [-0.8, -0.1, 0.6]) {
            k.withTint({ top: 0.7, bottom: 0.7, hue: [1.05, 0.96, 0.86] }, () => k.log('raatre', V(x, y, 0), V(x, y + 0.16, 0), 0.2, 10, false, 0.22));
            k.withTint({ top: 1.35, bottom: 1.35, hue: [1.18, 1.0, 0.62] }, () => k.withUv(0.05, () => k.log('raatre', V(x, y + 0.02, 0), V(x, y + 0.14, 0), 0.21, 10, true, 0.18)));
        }
    } else if (vare === 'kurver') {
        // Kurver av vidjer med erter, nøtter og egg [S].
        const fyll: [number, number, number][] = [[0.95, 1.05, 0.6], [1.0, 0.75, 0.5], [1.4, 1.35, 1.2]];
        for (let i = 0; i < 4; i++) {
            const x = -0.9 + i * 0.6;
            const rr = 0.2 + r() * 0.05;
            k.withTint(VIDJE, () => k.log('raatre', V(x, y, -0.05), V(x, y + 0.2, -0.05), rr * 0.85, 10, false, rr));
            k.withTint({ top: 1.0, bottom: 1.0, hue: fyll[i % 3] }, () => k.withUv(0.05, () => k.log('raatre', V(x, y + 0.02, -0.05), V(x, y + 0.17, -0.05), rr * 0.9, 10, true, rr * 0.95)));
        }
        // Stablede kurver på bakken.
        for (let i = 0; i < 3; i++) k.withTint(VIDJE, () => k.log('raatre', V(1.8, i * 0.22, 0.4), V(1.8, i * 0.22 + 0.22, 0.4), 0.24, 10, true, 0.27));
        c.box(1.8, 0.33, 0.4, 0.55, 0.66, 0.55, true);
    } else {
        // Tønner med øl og tran ved siden av, og et lite fat på disken.
        tonne(k, c, 1.85, 0.0, 0.9);
        tonne(k, c, 1.95, 0.75, 0.8);
        k.withTint({ top: 0.85, bottom: 0.85, hue: WARM }, () => k.log('raatre', V(-0.5, y + 0.2, -0.05), V(0.1, y + 0.2, -0.05), 0.2, 10, true, 0.2));
        k.withTint({ top: 0.85, bottom: 0.85, hue: [1.05, 0.97, 0.86] }, () => k.log('raatre', V(0.6, y, 0.1), V(0.6, y + 0.14, 0.1), 0.045, 8, true, 0.05));
    }
}

/**
 * Brønn: en laftet kasse rundt vannet, to stolper med vinde, tau og en bøtte på kanten [S].
 */
export function bronn(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    const h = 0.6;
    k.at(x, 0, z, 0.1, () => {
        const s = 0.62;
        k.withTint({ top: 0.68, bottom: 0.68, hue: [1.02, 0.98, 0.92] }, () => {
            for (let i = 0; i < 3; i++) {
                const y = 0.11 + i * 0.2;
                const along = i % 2 === 0;
                for (const d of [-s, s]) {
                    if (along) k.log('raatre', V(-s - 0.15, y, d), V(s + 0.15, y, d), 0.11, 6);
                    else k.log('raatre', V(d, y + 0.1, -s - 0.15), V(d, y + 0.1, s + 0.15), 0.11, 6);
                }
            }
        });
        // Vannet: mørkt og blankt et stykke ned.
        k.withTint({ top: 0.16, bottom: 0.16, hue: [0.8, 0.9, 1] }, () => k.box('mork', 0, 0.3, 0, s * 2 - 0.2, 0.02, s * 2 - 0.2));
        k.withTint({ top: 0.6, bottom: 0.6 }, () => {
            for (const sx of [-1, 1]) k.log('raatre', V(sx * (s + 0.12), 0, 0), V(sx * (s + 0.12), 1.55, 0), 0.07, 6);
            k.log('raatre', V(-s - 0.25, 1.4, 0), V(s + 0.25, 1.4, 0), 0.09, 8);
            // Sveiva.
            k.box('raatre', s + 0.3, 1.25, 0, 0.05, 0.35, 0.05);
            k.box('raatre', s + 0.36, 1.1, 0, 0.12, 0.05, 0.05);
        });
        k.withTint({ top: 0.55, bottom: 0.55, hue: [1.1, 1.0, 0.8] }, () => k.log('raatre', V(0.05, 1.32, 0), V(0.05, 0.75, 0), 0.015, 4, false));
        k.withTint({ top: 0.8, bottom: 0.8, hue: WARM }, () => k.log('raatre', V(0.05, 0.5, 0), V(0.05, 0.75, 0), 0.13, 8, true, 0.15));
        c.box(0, h / 2 + 0.05, 0, s * 2 + 0.3, h + 0.1, s * 2 + 0.3, true);
        for (const sx of [-1, 1]) c.box(sx * (s + 0.12), 0.78, 0, 0.16, 1.55, 0.16, true);
    }, c);
}

/**
 * Slede med en tønne: slik ble varene dratt fra kaia og opp gjennom byen [S]. Medene ligger langs
 * z, med den oppbøyde enden mot -z.
 */
export function slede(k: MeshKit, c: ColliderKit, x: number, z: number, rot: number): void {
    k.at(x, 0, z, rot, () => {
        k.withTint({ top: 0.62, bottom: 0.62 }, () => {
            for (const sx of [-0.4, 0.4]) {
                k.box('raatre', sx, 0.07, 0.1, 0.08, 0.12, 1.8);
                const m = new THREE.Matrix4().makeRotationX(0.6).setPosition(sx, 0.2, -0.9);
                k.slab('raatre', m, 0.08, 0.12, 0.5);
            }
            for (const zz of [-0.6, 0.1, 0.8]) {
                for (const sx of [-0.4, 0.4]) k.box('raatre', sx, 0.2, zz, 0.07, 0.16, 0.07);
                k.box('raatre', 0, 0.3, zz, 0.95, 0.07, 0.1);
            }
        });
        k.withTint({ top: 0.8, bottom: 0.8, hue: [1.04, 0.98, 0.9] }, () => k.box('raatre', 0, 0.355, 0.1, 0.9, 0.04, 1.5, { grain: 'z' }));
        k.at(0, 0.375, 0.2, 0, () => tonne(k, c, 0, 0, 0.85), c);
        c.box(0, 0.19, 0, 0.95, 0.38, 2.0, true);
    }, c);
}

/**
 * Hjulspor og medespor i gjørma: to mørke, våte striper som slingrer litt, fra `z0` til `z1`.
 * `w` er avstanden mellom dem.
 */
export function spor(k: MeshKit, x: number, z0: number, z1: number, w: number, seed: number): void {
    const seg = 0.9;
    k.withTint({ top: 0.6, bottom: 0.6, hue: [0.95, 0.95, 1.0] }, () => {
        for (let z = z0; z < z1 - 0.1; z += seg) {
            const l = Math.min(seg, z1 - z);
            const j = Math.sin(z * 0.37 + seed) * 0.12 + Math.sin(z * 0.9 + seed * 2) * 0.03;
            for (const sx of [-w / 2, w / 2]) k.box('gjorme', x + sx + j, 0.004, z + l / 2, 0.17, 0.02, l + 0.12, { skip: ['bottom'] });
        }
    });
}

/**
 * Vannpytt: flat og blank, litt over gjørma. Grå og kald som himmelen den speiler, med flat farge
 * (UV-ene krympet) så steinteksturen ikke synes.
 */
export function pytt(k: MeshKit, x: number, z: number, r: number): void {
    k.withTint({ top: 1.75, bottom: 1.75, hue: [0.88, 0.96, 1.1] }, () => k.withUv(0.04, () => k.log('stein', V(x, -0.01, z), V(x, 0.012, z), r, 10, true, r * 0.9)));
}
