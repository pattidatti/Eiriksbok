// Bolighuset i Vågsbunnen man kan gå inn i: stua til en skomakersvenn og familien hans, bak
// verkstedene i Skostredet.
//
// Ildsted midt på golvet med ljore over og gryta i kjetting, benk langs veggen, bord på bukker med
// skåler, seng i hjørnet bakerst, kiste, vannkar ved døra, og skinn og sko som henger til tørk under
// bjelkene. Mora rører i gryta, bestemora sitter på benken, og gutten spiser ved bordet. Hvordan en
// slik stue i Vågsbunnen var innredet i 1420-årene, og hvem som bodde der, er laget for spillet [S].
// Formen på ildstedet, benkene og bordet er de samme som i schøtstua og stua på Stranden.
import * as THREE from 'three';
import type { ColliderKit, MeshKit } from '../motor/meshkit';
import type { Rom } from '../motor/streaming';
import { WARM, tonne } from './gard';
import { GOLV_Y, WALL_T, romIHus } from './inne';
import { eaveY, type HouseSpec } from './moduler';
import { benk, bord, gryte, ildsted } from './schotstue';
import { krakk } from './heim';
import type { Plass } from './folk';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface BoligInfo {
    ild: THREE.Vector3;
    rom: Rom;
    folk: Plass[];
}

/**
 * Innredningen i huset `s` (husets rom). Døra står på langveggen `s.doors[0]`; det som står inne,
 * holdes unna veien fra døra til ilden.
 */
export function bolig(k: MeshKit, c: ColliderKit, s: HouseSpec, r: () => number): BoligInfo {
    const xIn = s.w / 2 - WALL_T;
    const zIn = s.l - WALL_T;
    const cz = s.inne?.ljore?.z ?? s.l / 2;
    const y = GOLV_Y;
    /** Siden døra står på (+1 = +x). Det meste står på den andre. */
    const ds = s.doors?.[0]?.side ?? 1;
    const mot = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);

    ildsted(k, c, cz, r);
    gryte(k, c, cz, s);

    // Benken langs veggen uten dør, og bordet foran den bakerst i stua.
    const bx = -ds * (xIn - 0.21);
    benk(k, c, bx, cz - 1.5, zIn - 0.35);
    const tx = -ds * (xIn - 0.95);
    bord(k, c, tx, cz + 1.25, Math.min(zIn - 0.45, cz + 2.7), r);

    // Senga i hjørnet bakerst på dørsida: halm, skinnfell og et ullteppe.
    const sx0 = ds * 0.85;
    const sx1 = ds * xIn;
    const smx = (sx0 + sx1) / 2;
    const sw = Math.abs(sx1 - sx0);
    k.withTint({ top: 0.7, bottom: 0.55, hue: WARM }, () => {
        k.box('raatre', smx, y + 0.25, zIn - 0.88, sw, 0.5, 1.75, { grain: 'x' });
        for (const z of [zIn - 1.7, zIn - 0.05]) k.box('raatre', sx0 + ds * 0.05, y + 0.45, z, 0.1, 0.9, 0.1);
    });
    k.withTint({ top: 0.85, bottom: 0.7, hue: [1.05, 0.92, 0.75] }, () => k.box('raatre', smx, y + 0.55, zIn - 0.88, sw - 0.1, 0.1, 1.6));
    k.withTint({ top: 0.7, bottom: 0.6, hue: [0.95, 0.62, 0.5] }, () => k.box('raatre', smx - ds * 0.1, y + 0.63, zIn - 1.05, sw - 0.3, 0.06, 1.2));
    c.box(smx, y + 0.35, zIn - 0.88, sw, 0.7, 1.75, true);

    // Krakken ved senga og kista ved framgavlen på benksida.
    krakk(k, c, ds * 1.2, zIn - 2.35);
    const kx = -ds * (xIn - 0.3);
    k.withTint({ top: 0.75, bottom: 0.6, hue: [0.95, 0.8, 0.65] }, () => k.box('raatre', kx, y + 0.25, WALL_T + 0.9, 0.55, 0.5, 1.0, { grain: 'z' }));
    k.withTint({ top: 0.3, bottom: 0.3 }, () => {
        for (const dz of [-0.3, 0.3]) k.box('raatre', kx, y + 0.25, WALL_T + 0.9 + dz, 0.57, 0.52, 0.05);
    });
    c.box(kx, y + 0.25, WALL_T + 0.9, 0.55, 0.5, 1.0, true);

    // Vannkaret innenfor døra, en drøy meter inn så døråpningen er fri.
    tonne(k, c, ds * (xIn - 0.4), (s.doors?.[0]?.z ?? 1.3) + 1.45, 0.75);

    // Hylla over kista med sko som venter på å bli levert, og læret som henger til tørk under bjelkene.
    k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => k.box('raatre', kx + ds * 0.1, y + 1.5, WALL_T + 0.9, 0.3, 0.04, 1.3, { grain: 'z' }));
    k.withTint({ top: 0.5, bottom: 0.45, hue: [1.0, 0.72, 0.5] }, () => {
        for (let i = 0; i < 4; i++) {
            const z = WALL_T + 0.45 + i * 0.3;
            k.box('raatre', kx + ds * 0.1, y + 1.56, z, 0.1, 0.08, 0.24);
            k.box('raatre', kx + ds * 0.1, y + 1.63, z - 0.08, 0.09, 0.1, 0.08);
        }
    });
    const yb = eaveY(s) - 0.3;
    k.withUv(0.04, () => {
        k.withTint({ top: 0.6, bottom: 0.5, hue: [1.0, 0.75, 0.55] }, () => {
            for (let i = 0; i < 3; i++) {
                const m = new THREE.Matrix4().makeRotationZ(0.04 * (i - 1)).setPosition(-ds * (0.4 + i * 0.45), yb - 0.4, cz - 1.75);
                k.slab('raatre', m, 0.38, 0.75, 0.02);
            }
        });
    });

    return {
        ild: V(0, y + 0.12, cz),
        rom: romIHus(s, 1)[0],
        folk: [
            // Mora rører i gryta, bestemora sitter på benken ved varmen, og gutten spiser ved bordet.
            { figur: 'husfrue', rolle: 'rore', pos: V(ds * 1.12, y, cz + 0.15), yaw: ds > 0 ? -Math.PI / 2 : Math.PI / 2 },
            { figur: 'gammelkone', rolle: 'sitte', pos: V(bx, y + 0.45, cz - 0.6), yaw: mot(bx, cz - 0.6, 0, cz) },
            { figur: 'gutt', rolle: 'spise', pos: V(bx, y + 0.45, cz + 1.95), yaw: ds > 0 ? Math.PI / 2 : -Math.PI / 2 },
        ],
    };
}
