// Schøtstua innvendig: ildstedet midt i rommet, langbenker langs veggene, bord på bukker,
// gryta over ilden og ved i hjørnet.
//
// Det vi vet [V]: åpen ild var forbudt i gårdene. Matlaging og varme skjedde i ildhus og
// schøtstuer bakerst, og om vinteren flyttet hele gården inn i schøtstua for varme måltider
// (Hanseatiske museum, Byleksikon). Schøtstuene som står i dag er fra tiden etter brannen i 1702.
// Hvordan en schøtstue var innredet i 1420-årene er ikke beskrevet i kildene vi har [K]. Ildstedet
// midt på golvet med ljore over, langbenkene og bordene er slik eldre norske røykstuer var [S].
import * as THREE from 'three';
import type { ColliderKit, MeshKit } from '../motor/meshkit';
import { eaveY, rng, type HouseSpec } from './moduler';
import { GOLV_Y, WALL_T } from './inne';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const BENK_H = 0.45;
const BENK_D = 0.42;
const BORD_H = 0.76;
const BORD_D = 0.8;

export interface SchotstueInfo {
    /** Midt i bålet, i husets rom. */
    ild: THREE.Vector3;
    /** Rommet innenfor veggene, i husets rom. */
    rom: THREE.Box3;
}

/** Bygger innredningen i husets eget rom. Huset må ha `inne`. */
export function schotstue(k: MeshKit, c: ColliderKit, s: HouseSpec): SchotstueInfo {
    const r = rng(1429);
    const cz = s.inne?.ljore?.z ?? s.l / 2;
    const xIn = s.w / 2 - WALL_T;
    // Der det er dører, kan det ikke stå benk eller bord.
    const doorZ = (side: -1 | 1) => (s.doors ?? []).filter((d) => d.side === side).map((d) => d.z);
    const free = (side: -1 | 1, z0: number, z1: number): [number, number][] => {
        let out: [number, number][] = [[z0, z1]];
        for (const dz of doorZ(side)) {
            out = out.flatMap(([a, b]): [number, number][] => {
                if (dz + 0.8 <= a || dz - 0.8 >= b) return [[a, b]];
                return [[a, dz - 0.8], [dz + 0.8, b]];
            });
        }
        return out.filter(([a, b]) => b - a > 1.2);
    };

    ildsted(k, c, cz, r);
    gryte(k, c, cz, s);

    for (const side of [-1, 1] as const) {
        for (const [a, b] of free(side, WALL_T + 0.1, s.l - WALL_T - 0.1)) benk(k, c, side * (xIn - BENK_D / 2), a, b);
    }
    // Bordene: på hver side av ildstedet, foran benkene og unna dørene.
    const bx = xIn - BENK_D - 0.12 - BORD_D / 2;
    for (const side of [-1, 1] as const) {
        for (const [a, b] of [[WALL_T + 1.0, cz - 2.2], [cz + 2.2, s.l - WALL_T - 1.0]] as const) {
            for (const [fa, fb] of free(side, a, b)) {
                if (fb - fa < 2) continue;
                bord(k, c, side * bx, fa + 0.2, fb - 0.2, r);
            }
        }
    }
    vedstabel(k, c, -xIn + 0.35, s.l - WALL_T - 1.4, r);
    return {
        ild: V(0, GOLV_Y + 0.12, cz),
        rom: new THREE.Box3(V(-xIn, 0, WALL_T), V(xIn, eaveY(s) + 2, s.l - WALL_T)),
    };
}

/**
 * Ildstedet: en lav ramme av stein med aske og ved i, midt på golvet. Kollideren er høyere enn
 * steinene, så gutten ikke går rett i varmen.
 */
function ildsted(k: MeshKit, c: ColliderKit, cz: number, r: () => number): void {
    const w = 1.5;
    const l = 1.9;
    const y = GOLV_Y;
    // Steinene i ramma: ujevne blokker, tettest i hjørnene.
    const stein = (x: number, z: number, sx: number, sz: number) => {
        const h = 0.22 + r() * 0.1;
        const tone = 0.8 + r() * 0.4;
        // Sotet på innsiden mot ilden: mørkere på toppen.
        k.withTint({ top: tone * 0.7, bottom: tone, hue: [1, 0.97, 0.94] }, () =>
            k.box('stein', x, y + h / 2 - 0.02, z, sx, h, sz, { skip: ['bottom'], shadeFoot: true })
        );
    };
    for (let x = -w / 2 + 0.18; x < w / 2 - 0.1; x += 0.38) {
        for (const sz of [-1, 1]) stein(x + (r() - 0.5) * 0.05, cz + sz * (l / 2 - 0.15), 0.34 + r() * 0.06, 0.28 + r() * 0.06);
    }
    for (let z = -l / 2 + 0.5; z < l / 2 - 0.4; z += 0.4) {
        for (const sx of [-1, 1]) stein(sx * (w / 2 - 0.15), cz + z + (r() - 0.5) * 0.05, 0.28 + r() * 0.06, 0.34 + r() * 0.06);
    }
    // Aska og bunnheller.
    k.withTint({ top: 0.42, bottom: 0.42, hue: [0.95, 0.93, 0.9] }, () => k.box('stein', 0, y + 0.02, cz, w - 0.5, 0.04, l - 0.5, { skip: ['bottom'] }));
    // Veden: kubber lagt i kryss, forkullet.
    k.withTint({ top: 0.22, bottom: 0.22 }, () => {
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI + r() * 0.3;
            const len = 0.35 + r() * 0.12;
            const dx = Math.cos(a) * len;
            const dz = Math.sin(a) * len;
            const yy = y + 0.1 + (i % 2) * 0.07;
            k.log('raatre', V(-dx, yy, cz - dz), V(dx, yy, cz + dz), 0.05, 6);
        }
    });
    c.box(0, y + 0.35, cz, w, 0.7, l, true);
}

/**
 * Gryta henger i en kjetting fra en stang over ilden. Stanga ligger på to bjelker på tvers av
 * rommet, festet i langveggene.
 */
function gryte(k: MeshKit, c: ColliderKit, cz: number, s: HouseSpec): void {
    const yb = eaveY(s) - 0.15;
    const xIn = s.w / 2 - WALL_T;
    k.withTint({ top: 0.32, bottom: 0.32, hue: [0.95, 0.9, 0.85] }, () => {
        for (const dz of [-1.8, 1.8]) k.log('raatre', V(-xIn - 0.1, yb, cz + dz), V(xIn + 0.1, yb, cz + dz), 0.12, 7, false);
        k.log('raatre', V(0, yb - 0.17, cz - 1.95), V(0, yb - 0.17, cz + 1.95), 0.06, 6);
    });
    const yPot = GOLV_Y + 0.85;
    // Kjettingen: korte, mørke ledd.
    k.withTint({ top: 0.18, bottom: 0.18 }, () => {
        for (let y = yb - 0.25; y > yPot + 0.42; y -= 0.09) k.box('mork', 0, y, cz, 0.025, 0.07, (Math.round(y / 0.09) % 2 ? 0.05 : 0.02));
        // Hanken over gryta.
        k.log('mork', V(-0.24, yPot + 0.3, cz), V(0, yPot + 0.44, cz), 0.012, 4, false);
        k.log('mork', V(0.24, yPot + 0.3, cz), V(0, yPot + 0.44, cz), 0.012, 4, false);
    });
    // Gryta: bred buk og smalere bunn, av jern (nesten svart).
    k.withTint({ top: 0.9, bottom: 0.9 }, () => {
        k.log('mork', V(0, yPot - 0.12, cz), V(0, yPot + 0.12, cz), 0.17, 12, true, 0.25);
        k.log('mork', V(0, yPot + 0.12, cz), V(0, yPot + 0.3, cz), 0.25, 12, false, 0.24);
    });
    c.box(0, yPot + 0.05, cz, 0.5, 0.5, 0.5, true);
}

/** Langbenk: tykke planker på korte bein, langs veggen fra `z0` til `z1`. */
function benk(k: MeshKit, c: ColliderKit, x: number, z0: number, z1: number): void {
    const len = z1 - z0;
    const zm = (z0 + z1) / 2;
    const y = GOLV_Y + BENK_H;
    k.withTint({ top: 0.62, bottom: 0.62, hue: [1.04, 0.98, 0.9] }, () => k.box('raatre', x, y - 0.04, zm, BENK_D, 0.08, len));
    k.withTint({ top: 0.42, bottom: 0.42 }, () => {
        const n = Math.max(2, Math.round(len / 1.4) + 1);
        for (let i = 0; i < n; i++) {
            const z = z0 + 0.15 + ((len - 0.3) * i) / (n - 1);
            k.box('raatre', x, GOLV_Y + (BENK_H - 0.08) / 2, z, BENK_D - 0.08, BENK_H - 0.08, 0.1);
        }
    });
    c.box(x, GOLV_Y + BENK_H / 2, zm, BENK_D, BENK_H, len, true);
}

/** Bord på bukker, med skåler, kjenger og et brød eller to. */
function bord(k: MeshKit, c: ColliderKit, x: number, z0: number, z1: number, r: () => number): void {
    const len = z1 - z0;
    const zm = (z0 + z1) / 2;
    const y = GOLV_Y + BORD_H;
    k.withTint({ top: 0.7, bottom: 0.7, hue: [1.05, 0.98, 0.9] }, () => k.box('raatre', x, y - 0.03, zm, BORD_D, 0.06, len, { grain: 'z' }));
    k.withTint({ top: 0.45, bottom: 0.45 }, () => {
        for (const z of [z0 + 0.35, z1 - 0.35]) {
            // Bukken: to skrå bein som sprer seg ut mot golvet, og en tverrligger under plata.
            for (const sx of [-1, 1]) {
                const m = new THREE.Matrix4().makeRotationZ(sx * 0.22).setPosition(x + sx * 0.2, GOLV_Y + (BORD_H - 0.06) / 2, z);
                k.slab('raatre', m, 0.08, BORD_H - 0.02, 0.08);
            }
            k.box('raatre', x, y - 0.1, z, BORD_D - 0.05, 0.08, 0.12);
        }
    });
    c.box(x, GOLV_Y + BORD_H / 2, zm, BORD_D, BORD_H, len, true);
    // Småting på bordet.
    for (let z = z0 + 0.4; z < z1 - 0.3; z += 0.45 + r() * 0.4) {
        const xx = x + (r() - 0.5) * (BORD_D - 0.3);
        const kind = r();
        if (kind < 0.45) {
            // Treskål.
            k.withTint({ top: 0.85, bottom: 0.85, hue: [1.08, 0.98, 0.86] }, () => k.log('raatre', V(xx, y, z), V(xx, y + 0.06, z), 0.07, 9, true, 0.1));
        } else if (kind < 0.8) {
            // Kjenge (drikkebeger av tre).
            k.withTint({ top: 0.75, bottom: 0.75, hue: [1.05, 0.97, 0.86] }, () => k.log('raatre', V(xx, y, z), V(xx, y + 0.13, z), 0.045, 8, true, 0.05));
        } else {
            // Brød: flatt og rundt.
            k.withTint({ top: 1.1, bottom: 1.1, hue: [1.25, 0.95, 0.6] }, () => k.log('raatre', V(xx, y, z), V(xx, y + 0.05, z), 0.1, 9, true, 0.085));
        }
    }
}

/** Ved stablet i hjørnet: kløyvde kubber med endeveden ut. */
function vedstabel(k: MeshKit, c: ColliderKit, x: number, z: number, r: () => number): void {
    const len = 0.5;
    for (let row = 0; row < 4; row++) {
        for (let i = 0; i < 6 - row; i++) {
            const zz = z - 0.55 + i * 0.2 + row * 0.1;
            const yy = GOLV_Y + 0.09 + row * 0.16;
            const tone = 0.55 + r() * 0.3;
            k.withTint({ top: tone, bottom: tone, hue: [1.05, 0.98, 0.9] }, () => k.log('raatre', V(x - len / 2, yy, zz), V(x + len / 2, yy, zz), 0.085, 6));
        }
    }
    c.box(x, GOLV_Y + 0.35, z - 0.05, len, 0.7, 1.3, true);
}
