// Innenfor dørene på Stranden: stua der en familie bor, og naustet der færingen står om vinteren.
// Pluss dørbladene og gluggelukene som går opp og igjen (uro.ts).
//
// Stua: ildsted midt på golvet med ljore over, benk langs veggen, seng med skinnfell, vugge, kiste,
// håndkvern og en oppstadvev mot veggen der kona vever. Det vi vet: oppstadveven er en vev som står
// oppreist, med to kraftige sidestolper og én tøybom øverst. Renningen (de loddrette trådene) festes
// til bommen og holdes stram av kljåsteiner, lodd av stein, under vevingen. På den ble det vevd klær,
// veggtepper og åklær. I Norden tok flatvevstolen gradvis over inn mot middelalderen, men oppstadveven
// er brukt helt til i dag i Fitjar og Manndalen [V SNL «oppstadvev»]. Om en familie på Stranden vevde på
// oppstadvev i 1420-årene, er ikke sjekket [U]. Hvordan denne stua var innredet, er laget for spillet [S].
//
// Naustet: båthuset ved sjøen, med færingen på stokker, årer og mast med rullet seil over bjelkene,
// garn i en haug, tjærebrenna og trebøyer [V naust; S innholdet].
import * as THREE from 'three';
import type { ColliderKit, MeshKit } from '../motor/meshkit';
import type { Rom } from '../motor/streaming';
import { DARK, WARM, tonne } from './gard';
import { GOLV_Y, WALL_T, romIHus } from './inne';
import { eaveY, gluggRamme, langveggRamme, type HouseSpec } from './moduler';
import type { Uro } from './uro';
import type { Fase } from './dagsplan';
import { benk, gryte, ildsted } from './schotstue';
import type { Plass } from './folk';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ── Delene som går opp og igjen ──

/** Dørbladet: stående bord med to jernbånd, hengselet i origo og bladet langs +x. */
export function dorblad(k: MeshKit, w = 1.05, h = 1.9): void {
    k.withTint({ top: 1.2, bottom: 1.0, hue: [1.08, 1.0, 0.9] }, () => k.box('bordvegg', w / 2, h / 2, -0.03, w - 0.02, h, 0.04));
    k.withTint({ top: 0.3, bottom: 0.3 }, () => {
        for (const y of [h * 0.2, h * 0.8]) k.box('bordvegg', w * 0.22, y, -0.055, w * 0.4, 0.045, 0.012);
    });
}

/** Gluggeluka: små stående bord med en tverrslå, hengselet i origo og luka langs +x. */
export function gluggLuke(k: MeshKit, w = 0.6, h = 0.55): void {
    k.withTint({ top: 1.15, bottom: 1.0, hue: [1.06, 1.0, 0.92] }, () => k.box('bordvegg', w / 2, h / 2, -0.035, w, h, 0.03));
    k.withTint({ top: 0.45, bottom: 0.45 }, () => k.box('bordvegg', w / 2, h / 2, -0.055, w * 0.85, 0.05, 0.015));
}

/** Hvor nær noen må stå døra (utenfor) før den går opp. */
const DOR_NAER = 1.7;

/**
 * Bladene til dørene og gluggelukene med `uro` i et hus (`m`: husets rom til verden, `yaw`: husets
 * dreining). Dørene går opp når noen i `fotter` står ved dem; lukene står åpne i delene av dagen i
 * `luker`. Alle dører og luker med samme mål i en `Uro` er ett tegnekall (`lukeMal`), med husets farge.
 */
export function husLuker(uro: Uro, spec: HouseSpec, m: THREE.Matrix4, yaw: number, fotter: THREE.Vector3[], luker: Fase[] = ['morgen', 'dag', 'kveld']): void {
    const h = spec.tint.hue ?? [1, 1, 1];
    const lys = THREE.MathUtils.clamp(spec.tint.top / 0.95, 0.8, 1.15);
    const farge = new THREE.Color(h[0] * lys, h[1] * lys, h[2] * lys);
    for (const d of spec.doors ?? []) {
        if (!d.uro) continue;
        const f = m.clone().multiply(langveggRamme(spec, d.side, d.z));
        const ute = V(0, 0, -0.9).applyMatrix4(f);
        const fy = yaw + (d.side > 0 ? -Math.PI / 2 : Math.PI / 2);
        uro.lukeMal('dor', (k) => dorblad(k), V(-1.05 / 2, 0.24, 0).applyMatrix4(f), fy, farge, 1.5,
            () => fotter.some((p) => Math.abs(p.y - ute.y) < 1.5 && Math.hypot(p.x - ute.x, p.z - ute.z) < DOR_NAER));
    }
    for (const g of spec.glugger ?? []) {
        if (!g.uro) continue;
        const gr = gluggRamme(spec, g);
        const f = m.clone().multiply(gr.m);
        const fy = yaw + (g.side === 0 ? 0 : g.side > 0 ? -Math.PI / 2 : Math.PI / 2);
        uro.lukeMal(`glugg:${gr.w}x${gr.h}`, (k) => gluggLuke(k, gr.w, gr.h), V(-gr.w / 2, gr.y0, 0).applyMatrix4(f), fy, farge, 2.75, luker);
    }
}

// ── Stua ──

export interface StueInfo {
    ild: THREE.Vector3;
    rom: Rom;
    folk: Plass[];
    /** Vugga (midten av meiene) i husets rom. Gynger i uro.ts. */
    vugge: THREE.Vector3;
}

/** Innredningen i en norsk stue, i husets rom. Huset må ha `inne.ljore` og døra på -x nær framgavlen. */
export function stue(k: MeshKit, c: ColliderKit, s: HouseSpec, r: () => number): StueInfo {
    const xIn = s.w / 2 - WALL_T;
    const zIn = s.l - WALL_T;
    const cz = s.inne?.ljore?.z ?? s.l / 2;
    const y = GOLV_Y;
    ildsted(k, c, cz, r);
    gryte(k, c, cz, s);
    // Benken langs veggen med døra, innenfor døra.
    benk(k, c, -(xIn - 0.21), cz - 1.0, zIn - 1.4);
    tonne(k, c, -(xIn - 0.36), cz - 1.55, 0.7);

    // Senga i hjørnet bakerst: en kasse med halm, skinnfell og et ullteppe.
    const sx0 = 0.85;
    const sz0 = zIn - 1.75;
    k.withTint({ top: 0.7, bottom: 0.55, hue: WARM }, () => {
        k.box('raatre', (sx0 + xIn) / 2, y + 0.25, zIn - 0.88, xIn - sx0, 0.5, 1.75, { grain: 'x' });
        for (const [x, z] of [[sx0 + 0.05, sz0 + 0.05], [sx0 + 0.05, zIn - 0.05]] as const) k.box('raatre', x, y + 0.45, z, 0.1, 0.9, 0.1);
    });
    k.withTint({ top: 0.85, bottom: 0.7, hue: [1.05, 0.92, 0.75] }, () => k.box('raatre', (sx0 + xIn) / 2, y + 0.55, zIn - 0.88, xIn - sx0 - 0.1, 0.1, 1.6));
    k.withTint({ top: 0.75, bottom: 0.6, hue: [0.62, 0.7, 0.92] }, () => k.box('raatre', (sx0 + xIn) / 2 - 0.1, y + 0.63, zIn - 1.05, xIn - sx0 - 0.3, 0.06, 1.2));
    k.withTint({ top: 1.05, bottom: 0.95, hue: [1.0, 0.98, 0.92] }, () => k.log('raatre', V(sx0 + 0.25, y + 0.66, zIn - 0.3), V(xIn - 0.2, y + 0.66, zIn - 0.3), 0.12, 8, true));
    c.box((sx0 + xIn) / 2, y + 0.35, zIn - 0.88, xIn - sx0, 0.7, 1.75, true);

    // Vugga ved siden av senga, og jenta på krakken som gynger den.
    const vugge = V(-0.7, y, zIn - 0.75);
    c.box(vugge.x, y + 0.25, vugge.z, 0.55, 0.5, 1.0, true);
    krakk(k, c, vugge.x - 0.8, vugge.z);

    // Håndkverna: to runde steiner på golvet, med en pinne til å dra rundt [V; S plassen].
    const kx = -(xIn - 1.0);
    const kz = zIn - 2.1;
    k.withTint({ top: 0.85, bottom: 0.7 }, () => {
        k.log('stein', V(kx, y, kz), V(kx, y + 0.12, kz), 0.3, 12, true);
        k.log('stein', V(kx, y + 0.13, kz), V(kx, y + 0.24, kz), 0.28, 12, true);
    });
    k.withTint({ top: 0.6, bottom: 0.6, hue: WARM }, () => k.log('raatre', V(kx + 0.2, y + 0.24, kz), V(kx + 0.22, y + 0.55, kz), 0.025, 4));
    c.box(kx, y + 0.15, kz, 0.62, 0.3, 0.62, true);

    // Oppstadveven mot veggen på +x, med renningen, vevloddene og det ferdige vadmelet øverst.
    const vz0 = 1.15;
    const vz1 = 2.75;
    vev(k, c, xIn, vz0, vz1);

    // Kista ved framgavlen, og hylla med treboller over den.
    k.withTint({ top: 0.75, bottom: 0.6, hue: [0.95, 0.8, 0.65] }, () => k.box('raatre', xIn - 0.3, y + 0.25, WALL_T + 0.9, 0.55, 0.5, 1.0, { grain: 'z' }));
    k.withTint({ top: 0.3, bottom: 0.3 }, () => {
        for (const dz of [-0.3, 0.3]) k.box('raatre', xIn - 0.3, y + 0.25, WALL_T + 0.9 + dz, 0.57, 0.52, 0.05);
    });
    c.box(xIn - 0.3, y + 0.25, WALL_T + 0.9, 0.55, 0.5, 1.0, true);
    k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => k.box('raatre', 0.6, y + 1.55, zIn - 0.16, 1.4, 0.04, 0.26, { grain: 'x' }));
    k.withTint({ top: 0.9, bottom: 0.75, hue: [1.1, 0.95, 0.8] }, () => {
        for (const x of [0.1, 0.45, 0.85, 1.15]) k.log('raatre', V(x, y + 1.57, zIn - 0.16), V(x, y + 1.66, zIn - 0.16), 0.09, 8, true, 0.12);
    });

    // Fisk og urter henger fra bjelkene over varmen og tørker [S].
    const yb = eaveY(s) - 0.3;
    k.withUv(0.04, () => {
        k.withTint({ top: 1.2, bottom: 0.9, hue: [1.04, 0.96, 0.82] }, () => {
            for (let i = 0; i < 5; i++) {
                const m = new THREE.Matrix4().makeRotationZ(0.05 * (i - 2)).setPosition(-0.6 + i * 0.3, yb - 0.3, cz + 1.8);
                k.slab('raatre', m, 0.1, 0.5, 0.03);
            }
        });
        k.withTint({ top: 0.7, bottom: 0.6, hue: [0.8, 0.95, 0.6] }, () => {
            for (let i = 0; i < 4; i++) k.box('raatre', -0.5 + i * 0.35, yb - 0.15, cz - 1.8, 0.12, 0.28, 0.12);
        });
    });

    const mot = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);
    return {
        ild: V(0, y + 0.12, cz),
        rom: romIHus(s, 1)[0],
        vugge,
        folk: [
            // Kona vever, og jenta gynger vugga.
            { figur: 'husfrue', rolle: 'rore', pos: V(xIn - 1.15, y, (vz0 + vz1) / 2), yaw: Math.PI / 2, id: 'aasa', samtale: 'aasa' },
            { figur: 'jente', rolle: 'sitte', pos: V(vugge.x - 0.8, y + 0.45, vugge.z), yaw: mot(vugge.x - 0.8, vugge.z, vugge.x, vugge.z) },
        ],
    };
}

/** Vugga: en kasse på to meier, med et lite teppe. Hengselet (der meiene står) i origo; gynger rundt z. */
export function vugge(k: MeshKit): void {
    k.withTint({ top: 0.8, bottom: 0.65, hue: WARM }, () => {
        k.box('raatre', 0, 0.3, 0, 0.45, 0.25, 0.85, { grain: 'z' });
        for (const s of [-0.24, 0.24]) k.box('raatre', s, 0.37, 0, 0.03, 0.2, 0.9, { grain: 'z' });
        for (const z of [-0.3, 0.3]) {
            // Meiene: buede stokker på tvers.
            k.log('raatre', V(-0.3, 0.08, z), V(0, 0.02, z), 0.03, 5);
            k.log('raatre', V(0, 0.02, z), V(0.3, 0.08, z), 0.03, 5);
            k.box('raatre', 0, 0.12, z, 0.08, 0.16, 0.04);
        }
    });
    k.withTint({ top: 0.85, bottom: 0.75, hue: [0.92, 0.72, 0.62] }, () => k.box('raatre', 0, 0.44, 0.08, 0.4, 0.05, 0.6));
    k.withTint({ top: 1.05, bottom: 1.0, hue: [1.0, 0.97, 0.92] }, () => k.log('raatre', V(-0.12, 0.45, -0.28), V(0.12, 0.45, -0.28), 0.08, 7, true));
}

/** En krakk på tre bein (setet 0,45 m over golvet). */
export function krakk(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    const y = GOLV_Y;
    k.withTint({ top: 0.75, bottom: 0.7, hue: WARM }, () => {
        k.log('raatre', V(x, y + 0.4, z), V(x, y + 0.45, z), 0.2, 9, true);
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            k.log('raatre', V(x + Math.cos(a) * 0.17, y, z + Math.sin(a) * 0.17), V(x + Math.cos(a) * 0.1, y + 0.41, z + Math.sin(a) * 0.1), 0.025, 4);
        }
    });
    c.box(x, y + 0.22, z, 0.4, 0.45, 0.4, true);
}

/**
 * Oppstadveven: to stolper som lener mot veggen, bommen øverst med vadmelet rullet opp, renningen
 * som henger ned, skillestokken, og vevloddene i en rad nederst.
 */
function vev(k: MeshKit, c: ColliderKit, xVegg: number, z0: number, z1: number): void {
    const y = GOLV_Y;
    const topX = xVegg - 0.12;
    const botX = xVegg - 0.6;
    const topY = y + 2.15;
    k.withTint({ top: 0.7, bottom: 0.6, hue: WARM }, () => {
        for (const z of [z0, z1]) k.log('raatre', V(botX, y, z), V(topX, topY, z), 0.05, 6);
        k.log('raatre', V(topX - 0.08, topY - 0.15, z0 - 0.1), V(topX - 0.08, topY - 0.15, z1 + 0.1), 0.07, 8);
        // Skillestokken midt på.
        const sy = y + 1.1;
        const sx = botX + (topX - botX) * ((sy - y) / (topY - y)) - 0.06;
        k.log('raatre', V(sx, sy, z0 + 0.05), V(sx, sy, z1 - 0.05), 0.03, 5);
    });
    // Vadmelet som er vevd, rullet opp på bommen: blått [S].
    k.withTint({ top: 0.85, bottom: 0.7, hue: [0.62, 0.68, 0.88] }, () => k.log('raatre', V(topX - 0.1, topY - 0.27, z0 + 0.1), V(topX - 0.1, topY - 0.27, z1 - 0.1), 0.1, 10, true));
    // Den vevde biten som henger ned fra bommen, og renningen under.
    const tx0 = topX - 0.12;
    const tyTop = topY - 0.35;
    const tyCloth = y + 1.45;
    k.withTint({ top: 0.85, bottom: 0.75, hue: [0.62, 0.68, 0.88] }, () => {
        const xc = (tx0 + (botX + (topX - botX) * ((tyCloth - y) / (topY - y)) - 0.1)) / 2;
        const m = new THREE.Matrix4().makeRotationZ(-0.22).setPosition(xc, (tyTop + tyCloth) / 2, (z0 + z1) / 2);
        k.slab('raatre', m, 0.02, tyTop - tyCloth, z1 - z0 - 0.25);
    });
    k.withTint({ top: 1.0, bottom: 0.9, hue: [1.0, 0.96, 0.88] }, () => {
        for (let z = z0 + 0.15; z < z1 - 0.1; z += 0.06) {
            const xa = botX + (topX - botX) * ((tyCloth - y) / (topY - y)) - 0.1;
            k.log('raatre', V(xa, tyCloth, z), V(botX + 0.05, y + 0.48, z), 0.004, 3, false);
        }
    });
    // Kljåsteinene: små, grå steiner i en rad som holder renningen stram [V SNL «oppstadvev»].
    k.withTint({ top: 0.75, bottom: 0.6 }, () => {
        for (let z = z0 + 0.18; z < z1 - 0.1; z += 0.12) k.log('stein', V(botX + 0.05, y + 0.36, z), V(botX + 0.05, y + 0.47, z), 0.04, 6, true, 0.03);
    });
    c.box((topX + botX) / 2, y + 1.1, (z0 + z1) / 2, topX - botX + 0.2, 2.2, z1 - z0 + 0.15, true);
}

// ── Naustet ──

export interface NaustInfo {
    rom: Rom;
    /** Færingen: midten, langs z. */
    baat: THREE.Vector3;
}

/** Innredningen i naustet, i husets rom. Porten står i framgavlen (`facade`). */
export function naust(k: MeshKit, c: ColliderKit, s: HouseSpec, r: () => number): NaustInfo {
    const xIn = s.w / 2 - WALL_T;
    const zIn = s.l - WALL_T;
    const y = GOLV_Y;
    const baat = V(1.05, y, (WALL_T + zIn) / 2 + 0.2);
    // Stokkene færingen står på.
    k.withTint({ top: 0.6, bottom: 0.55, hue: DARK }, () => {
        for (const dz of [-1.6, 0, 1.6]) k.log('raatre', V(baat.x - 0.6, y + 0.08, baat.z + dz), V(baat.x + 0.6, y + 0.08, baat.z + dz), 0.08, 6);
    });
    c.box(baat.x, y + 0.5, baat.z, 1.6, 1.0, 5.8, true);
    // Årene på knagger på veggen bak båten.
    k.withTint({ top: 0.85, bottom: 0.75, hue: WARM }, () => {
        for (const [yy, dz] of [[1.35, 0], [1.55, 0.15]] as const) {
            k.log('raatre', V(xIn - 0.1, y + yy, 1.0 + dz), V(xIn - 0.1, y + yy, 4.1 + dz), 0.025, 5);
            k.box('raatre', xIn - 0.1, y + yy, 4.25 + dz, 0.03, 0.12, 0.35);
        }
        for (const z of [1.5, 3.5]) k.box('raatre', xIn - 0.06, y + 1.45, z, 0.12, 0.3, 0.05);
    });
    // Masta med det rullede seilet, lagt over bjelkene under taket.
    const yb = eaveY(s) - 0.05;
    k.withTint({ top: 0.55, bottom: 0.5, hue: DARK }, () => {
        for (const z of [1.6, 4.0, 6.2]) k.log('raatre', V(-xIn - 0.1, yb, z), V(xIn + 0.1, yb, z), 0.09, 6, false);
    });
    k.withTint({ top: 0.85, bottom: 0.75, hue: WARM }, () => k.log('raatre', V(-0.9, yb + 0.15, 0.8), V(-0.9, yb + 0.15, zIn - 0.3), 0.06, 6));
    k.withTint({ top: 1.3, bottom: 1.1, hue: [1.05, 1.0, 0.9] }, () => k.log('raatre', V(-0.6, yb + 0.2, 1.3), V(-0.6, yb + 0.2, zIn - 0.8), 0.13, 8, true));
    // Garna i en haug i hjørnet, med flottører, og tjærebrenna.
    k.withTint({ top: 0.7, bottom: 0.5, hue: [0.88, 0.92, 0.86] }, () => {
        for (let i = 0; i < 6; i++) k.box('raatre', -xIn + 0.55 + (r() - 0.5) * 0.3, y + 0.12 + i * 0.07, zIn - 0.7 + (r() - 0.5) * 0.3, 0.9 - i * 0.1, 0.1, 0.8 - i * 0.08);
    });
    k.withTint({ top: 1.2, bottom: 1.0, hue: [1.15, 0.95, 0.7] }, () => {
        for (let i = 0; i < 7; i++) k.box('raatre', -xIn + 0.3 + r() * 0.6, y + 0.3 + r() * 0.2, zIn - 0.9 + r() * 0.5, 0.08, 0.05, 0.05);
    });
    c.box(-xIn + 0.55, y + 0.25, zIn - 0.7, 1.0, 0.5, 0.9, true);
    k.withTint({ top: 0.25, bottom: 0.2, hue: [1, 0.9, 0.8] }, () => k.log('raatre', V(xIn - 0.4, y, zIn - 0.4), V(xIn - 0.4, y + 0.75, zIn - 0.4), 0.3, 10, true, 0.28));
    c.box(xIn - 0.4, y + 0.38, zIn - 0.4, 0.62, 0.76, 0.62, true);
    // Trebøyer og et tauknippe på veggen ved porten.
    k.withTint({ top: 0.9, bottom: 0.8, hue: [1.1, 0.9, 0.7] }, () => {
        for (const z of [0.6, 0.95]) k.log('raatre', V(-xIn + 0.15, y + 1.1, z), V(-xIn + 0.15, y + 1.45, z), 0.11, 8, true, 0.06);
    });
    k.withTint({ top: 0.9, bottom: 0.8, hue: [1.05, 0.95, 0.8] }, () => {
        const n = 10;
        for (let i = 0; i < n; i++) {
            const a0 = (i / n) * Math.PI * 2;
            const a1 = ((i + 1) / n) * Math.PI * 2;
            k.log('raatre', V(-xIn + 0.12, y + 1.3 + Math.sin(a0) * 0.22, 2.0 + Math.cos(a0) * 0.22), V(-xIn + 0.12, y + 1.3 + Math.sin(a1) * 0.22, 2.0 + Math.cos(a1) * 0.22), 0.03, 4);
        }
    });
    return { rom: romIHus(s, 0.6)[0], baat };
}
