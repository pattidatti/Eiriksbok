// Kongens vaktbu på veien til Holmen: det oppdraget «Budet til Bergenhus» sniker seg rundt
// (graboks/holmenvakt.ts). Vaktbua med benk, vaktsonen merket med staur og tau, og ting å gjemme
// seg bak: vedstabler, kassestabler, en kjerre med sekker og tønner. Ved vaktbua ligger kongens
// skattefisk (tyveri gir etterlyst, graboks/ettersokt.ts).
//
// Alt her er laget for spillet [S]. Hvordan veien mellom Bryggen og Holmen så ut i 1420-årene, er
// ikke funnet [K] (se bergenhus.ts). At kongen fikk skatt i fisk, er en antakelse [K].
//
// Koordinatene står i veiens rom: u = x - kaienden (`HOLMEN.xe`), z som i verden. Systemene
// regner om med `holmenVerden`.
import * as THREE from 'three';
import type { ColliderKit, MeshKit } from '../motor/meshkit';
import { DARK, WARM, tonne } from './gard';

/**
 * Kaienden i verden (x), satt av `holmenCeller` (bergenhus.ts). `brann`: det brenner i lagerhuset
 * (graboks/brann.ts), og vaktene står i bøttekjeden i stedet for å gå runde.
 */
export const HOLMEN = { xe: 0, brann: false };

/** Et punkt i veiens rom til verdensrom. */
export function holmenVerden(u: number, y: number, z: number, ut = new THREE.Vector3()): THREE.Vector3 {
    return ut.set(HOLMEN.xe + u, y, z);
}

/** Vaktbua: midten, og der Kolbein står (foran bua, ikke bak en staur). Han ser utover veien, mot sør og vest. */
export const VAKTBU = { u: 18.4, z: 25.4, w: 2.8, d: 2.2 };
export const KOLBEIN = { u: 16.6, z: 23.4 };
/** Der Ulf stopper ved vaktbua (vaktskiftet). */
export const VAKTSKIFTE = { u: 15.2, z: 24.6 };
/** Kongens skattefisk. */
export const SKATTEFISK = { u: 20.8, z: 28.2 };
/** Vaktsonen: inne her er det forbudt å være for andre enn vaktene. */
export const VAKTSONE = { u0: 2.6, u1: 25.6, z0: 18, z1: 31.3 };

/** Ting å gjemme seg bak: [u, z, bredde (x), dybde (z), høyde, slag]. Alle er høyere enn 1,5 m. */
const DEKNING: [number, number, number, number, number, 'ved' | 'kasser' | 'kjerre' | 'tonner'][] = [
    [6.0, 12.0, 3.2, 1.0, 1.7, 'ved'],
    [10.6, 19.4, 1.5, 1.4, 1.65, 'kasser'],
    [12.8, 14.8, 2.7, 1.5, 1.6, 'kjerre'],
    [14.8, 21.6, 1.6, 1.6, 1.55, 'tonner'],
    [22.0, 21.4, 1.0, 3.2, 1.75, 'ved'],
    [4.4, 22.4, 1.5, 1.5, 1.6, 'kasser'],
    [11.8, 28.8, 2.2, 1.3, 1.7, 'kasser'],
];

function vedstabel(k: MeshKit, c: ColliderKit, x: number, z: number, w: number, d: number, h: number): void {
    const langsX = w > d;
    const len = langsX ? w : d;
    const bredde = langsX ? d : w;
    const r = 0.085;
    const rader = Math.round(h / (r * 1.85));
    const per = Math.max(2, Math.floor(bredde / (r * 2.1)));
    k.withTint({ top: 0.8, bottom: 0.8, hue: WARM }, () => {
        for (let i = 0; i < rader; i++) {
            const y = r + i * r * 1.8;
            for (let j = 0; j < per; j++) {
                const s = -bredde / 2 + r + j * ((bredde - 2 * r) / Math.max(1, per - 1)) + (i % 2 ? r * 0.5 : 0);
                const jitter = Math.sin(i * 7.1 + j * 3.3) * 0.06;
                const a = langsX ? new THREE.Vector3(x - len / 2 + jitter, y, z + s) : new THREE.Vector3(x + s, y, z - len / 2 + jitter);
                const b = langsX ? new THREE.Vector3(x + len / 2 + jitter, y, z + s) : new THREE.Vector3(x + s, y, z + len / 2 + jitter);
                k.log('raatre', a, b, r * (0.85 + ((i * 3 + j) % 4) * 0.06), 6, true);
            }
        }
    });
    // Stokker som holder stabelen i endene.
    k.withTint({ top: 0.55, bottom: 0.55 }, () => {
        for (const e of [-1, 1]) {
            const p = langsX ? new THREE.Vector3(x + (e * len) / 2 + e * 0.1, 0, z) : new THREE.Vector3(x, 0, z + (e * len) / 2 + e * 0.1);
            k.log('raatre', p, p.clone().setY(h + 0.15), 0.06, 6, true);
        }
    });
    c.box(x, h / 2, z, w, h, d);
}

function kassestabel(k: MeshKit, c: ColliderKit, x: number, z: number, w: number, d: number, h: number): void {
    // To kasser i bunnen og én oppå, litt skjevt.
    const kh = h / 2;
    k.withTint({ top: 0.9, bottom: 0.9, hue: [1.04, 0.98, 0.9] }, () => {
        k.box('raatre', x - w / 4, kh / 2, z, w / 2 - 0.04, kh, d, { skip: ['bottom'] });
        k.box('raatre', x + w / 4, kh / 2, z + 0.05, w / 2 - 0.04, kh, d - 0.1, { skip: ['bottom'] });
    });
    k.withTint({ top: 0.75, bottom: 0.75, hue: WARM }, () => k.box('raatre', x + 0.08, kh * 1.5, z - 0.04, w * 0.7, kh, d * 0.8, { skip: ['bottom'] }));
    // Lister rundt kantene.
    k.withTint({ top: 0.5, bottom: 0.5 }, () => {
        for (const sx of [-1, 1]) k.box('raatre', x + (sx * w) / 2, kh / 2, z - d / 2 - 0.01, 0.06, kh, 0.02);
    });
    c.box(x, kh / 2, z, w, kh, d);
    c.box(x + 0.08, kh * 1.5, z - 0.04, w * 0.7, kh, d * 0.8);
}

function kjerre(k: MeshKit, c: ColliderKit, x: number, z: number, w: number, d: number, h: number): void {
    const by = 0.62;
    k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => {
        k.box('raatre', x, by, z, w, 0.08, d);
        for (const s of [-1, 1]) k.box('raatre', x, by + 0.2, z + (s * d) / 2, w, 0.32, 0.05);
        // Draget mot vest.
        for (const s of [-1, 1]) k.log('raatre', new THREE.Vector3(x - w / 2, by - 0.05, z + s * 0.35), new THREE.Vector3(x - w / 2 - 1.5, 0.35, z + s * 0.25), 0.04, 6, true);
    });
    // Hjulene.
    k.withTint({ top: 0.45, bottom: 0.45, hue: DARK }, () => {
        for (const s of [-1, 1]) {
            const p = new THREE.Vector3(x + 0.2, 0.42, z + s * (d / 2 + 0.06));
            k.log('raatre', p, p.clone().setZ(p.z + s * 0.08), 0.42, 12, true);
        }
    });
    // Sekker med korn, stablet høyt.
    k.withUv(0.05, () => k.withTint({ top: 1.25, bottom: 1.1, hue: [1.05, 1.0, 0.86] }, () => {
        for (let i = 0; i < 5; i++) {
            const sx = x - w / 2 + 0.35 + (i % 3) * ((w - 0.7) / 2);
            const sy = by + 0.25 + Math.floor(i / 3) * 0.42;
            k.box('raatre', sx, sy, z + Math.sin(i * 2.3) * 0.12, 0.7, 0.42, d * 0.75);
        }
        k.box('raatre', x, h - 0.2, z, 0.8, 0.4, d * 0.7);
    }));
    c.box(x, h / 2 + 0.1, z, w, h - 0.2, d);
}

/** Vaktbua: fire staur, skråtak, vegg mot øst og nord, en benk og en skjold på veggen. */
function vaktbu(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    const { w, d } = VAKTBU;
    k.withTint({ top: 0.7, bottom: 0.7, hue: DARK }, () => {
        for (const [dx, dz, h] of [[-w / 2, -d / 2, 2.3], [-w / 2, d / 2, 2.3], [w / 2, -d / 2, 2.6], [w / 2, d / 2, 2.6]] as const) {
            k.log('raatre', new THREE.Vector3(x + dx, 0, z + dz), new THREE.Vector3(x + dx, h, z + dz), 0.08, 6, true);
            c.box(x + dx, h / 2, z + dz, 0.16, h, 0.16, true);
        }
    });
    // Veggene mot øst (bak) og nord: bord på høykant.
    k.withTint({ top: 0.78, bottom: 0.65, hue: WARM }, () => {
        k.box('bordvegg', x + w / 2 - 0.04, 1.2, z, 0.06, 2.3, d, { shadeFoot: true });
        k.box('bordvegg', x, 1.15, z + d / 2 - 0.04, w, 2.2, 0.06, { shadeFoot: true });
    });
    c.box(x + w / 2 - 0.04, 1.2, z, 0.12, 2.4, d);
    c.box(x, 1.15, z + d / 2 - 0.04, w, 2.3, 0.12);
    const m = new THREE.Matrix4().makeRotationZ(0.11).setPosition(x, 2.5, z);
    k.withTint({ top: 0.85, bottom: 0.85, hue: DARK }, () => k.slab('bordtak', m, w + 0.6, 0.06, d + 0.6, { grain: 'x' }));
    // Benken langs nordveggen, og et skjold på østveggen.
    k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => {
        k.box('raatre', x, 0.45, z + d / 2 - 0.35, w - 0.4, 0.06, 0.4);
        for (const s of [-1, 1]) k.box('raatre', x + s * (w / 2 - 0.4), 0.22, z + d / 2 - 0.35, 0.08, 0.44, 0.34);
    });
    k.withTint({ top: 0.9, bottom: 0.9, hue: [1.25, 0.62, 0.5] }, () => k.box('raatre', x + w / 2 - 0.1, 1.45, z - 0.3, 0.05, 0.7, 0.55));
}

/** Kongens skattefisk: bunter tørrfisk på et lavt stillas, og tønner ved siden av [S]. */
function skattefisk(k: MeshKit, c: ColliderKit, x: number, z: number): void {
    k.withTint({ top: 0.6, bottom: 0.6, hue: WARM }, () => k.box('raatre', x, 0.18, z, 1.8, 0.1, 1.1, { skip: ['bottom'] }));
    k.withUv(0.04, () => k.withTint({ top: 1.35, bottom: 1.05, hue: [1.06, 1.0, 0.84] }, () => {
        for (let i = 0; i < 6; i++) {
            const bx = x - 0.6 + (i % 3) * 0.6;
            const by = 0.38 + Math.floor(i / 3) * 0.34;
            k.box('raatre', bx, by, z + Math.sin(i * 1.7) * 0.06, 0.55, 0.32, 0.95);
        }
    }));
    c.box(x, 0.5, z, 1.8, 1.0, 1.1);
}

/** Staur med tau rundt vaktsonen, åpent der vaktene går inn og ut. */
function vaktsoneTau(k: MeshKit, x0: number): void {
    const { u0, z0 } = VAKTSONE;
    const staur: [number, number][] = [];
    for (let u = u0; u <= 9.2; u += 2.2) staur.push([u, z0]);
    for (let u = 13.4; u <= 20.6; u += 2.4) staur.push([u, z0]);
    for (let z = z0 + 2.6; z < 31; z += 2.6) staur.push([u0, z]);
    k.withTint({ top: 0.6, bottom: 0.6, hue: DARK }, () => {
        for (const [u, z] of staur) k.log('raatre', new THREE.Vector3(x0 + u, 0, z), new THREE.Vector3(x0 + u, 1.0, z), 0.05, 6, true);
    });
    // Tauet henger mellom staurene: to biter per spenn, litt lavere på midten.
    k.withTint({ top: 0.95, bottom: 0.95, hue: [1.1, 0.95, 0.7] }, () => {
        for (let i = 0; i + 1 < staur.length; i++) {
            const [ua, za] = staur[i];
            const [ub, zb] = staur[i + 1];
            if (Math.hypot(ub - ua, zb - za) > 3) continue;
            const a = new THREE.Vector3(x0 + ua, 0.92, za);
            const b = new THREE.Vector3(x0 + ub, 0.92, zb);
            const mid = a.clone().lerp(b, 0.5).setY(0.78);
            k.log('raatre', a, mid, 0.015, 4, false);
            k.log('raatre', mid, b, 0.015, 4, false);
        }
    });
}

/** Alt ved vaktbua, i veicella. `x0` er kaienden (verdens x). */
export function byggVaktomraade(k: MeshKit, c: ColliderKit, x0: number): void {
    for (const [u, z, w, d, h, slag] of DEKNING) {
        const x = x0 + u;
        if (slag === 'ved') vedstabel(k, c, x, z, w, d, h);
        else if (slag === 'kasser') kassestabel(k, c, x, z, w, d, h);
        else if (slag === 'kjerre') kjerre(k, c, x, z, w, d, h);
        else {
            for (const [dx, dz] of [[-0.42, -0.4], [0.42, -0.38], [0, 0.4], [-0.5, 0.42], [0.5, 0.45]] as const) tonne(k, c, x + dx, z + dz, 0.85);
            // Tre tønner oppå hverandre gjør stabelen høy nok til å gjemme seg bak.
            k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => k.box('raatre', x, 1.15, z, w * 0.7, 0.75, d * 0.7));
            c.box(x, h / 2, z, w, h, d);
        }
    }
    vaktbu(k, c, x0 + VAKTBU.u, VAKTBU.z);
    skattefisk(k, c, x0 + SKATTEFISK.u, SKATTEFISK.z);
    vaktsoneTau(k, x0);
}
