// Mariakirken innvendig: hule murer med ekte hull, og rommet man går inn i gjennom sørportalen.
//
// Det vi vet [V SNL (Ekroll & Thune 2025), Wikipedia]: en treskipet basilika av kleberstein, med et
// høyt midtskip og lavere sideskip, skilt av arkader (buer på pilarer). Romanske vinduer høyt
// oppe bare på sørsida, sørportalen som hovedinngang, og et gotisk kor forlenget etter 1248. Kirken
// ble overdratt Kontoret i 1408, og tyskerne på Bryggen hørte messe og ble begravet der [V
// blueprint §5.2].
//
// Det vi ikke vet [K]: hvordan rommet var innredet i 1420-årene. Alteret, lysene, korbuen med
// krusifikset, gravhellene i golvet og det åpne taket med bjelker er slik middelalderkirker i
// Norge ofte var [S]. Altertavla som står der i dag, er ikke med: når den kom, er ikke sjekket [K].
// Ingen benker: menigheten sto [S etter eierens bestilling; allment kjent, men ikke i kildelista K].
//
// Kirkens eget rom som i mariakirken.ts: x på tvers (−x er sørsida), z fra vestfronten (z = 0)
// mot koret i øst, y opp fra kirkegården.
import * as THREE from 'three';
import type { ColliderKit, MeshKit } from '../motor/meshkit';
import { murMedHull, triMot, type Hull } from './buer';
import { LIST, STEIN } from './stein';
import type { Plass } from './folk';
import type { Sted } from '../motor/streaming';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Målene på kirken (meter) [V hovedmål, S resten]: skipet ca. 23 m langt og 18 m bredt, koret 10 m bredt.
export const TARN = { x0: 2.6, x1: 9, z1: 7.5, h: 27, tak: 7 };
export const FORHALL_H = 13.5;
export const SKIP = { z0: 7.5, z1: 30.5, hw: 5, h: 15.5, pitch: 0.95 };
export const SIDESKIP = { hw: 9, h: 8.6, top: 11.4 };
export const KOR = { z1: 44, hw: 5, h: 12.5, pitch: 0.95 };
export const KIRKE_LEN = KOR.z1;

/** Murtykkelsene: ytterveggene i sideskipene, og arkaden og koret [S]. */
const YT = 0.9;
const AR = 0.8;
/** Midtlinja av arkaden, innsida av sideskipene, innsida av vestveggen og østveggen. */
const XA = SKIP.hw - AR / 2;
const XS = SIDESKIP.hw - YT;
const VEST = SKIP.z0 + YT;
const OST = KOR.z1 - AR;
/** Korbuen mellom skipet og koret: muren står fra z 30,1 til 30,9. */
const KORBUE = { t: 0.8, w: 6, h: 5 };
const KB0 = SKIP.z1 - KORBUE.t / 2;
const KB1 = SKIP.z1 + KORBUE.t / 2;
/** Golvet i skipet og i koret (koret ligger to trinn høyere). */
export const GOLV = 0.05;
const KORGOLV = 0.3;

/** Vinduene langs sideskipene og lysgluggene i midtskipet (z). Sørportalen står i det tredje. */
export const SIDE_Z = [10.9, 16.3, 21.7, 27.1];
export const PORTAL = { z: 21.7, w: 1.7, h: 2.7 };
/** Arkaden: fire buer på tre pilarer og en halvpilar i hver ende. */
const ARK = { w: 4.4, h: 4.0, u: [11.15, 16.55, 21.95, 27.35] };
const KOR_VINDU = [32.95, 37.25, 41.55];
const OST_VINDU: Hull[] = [
    { u: -2.1, y0: 4.4, w: 0.9, h: 4.6, bue: 'spiss' },
    { u: 0, y0: 4.0, w: 1.1, h: 5.6, bue: 'spiss' },
    { u: 2.1, y0: 4.4, w: 0.9, h: 4.6, bue: 'spiss' },
];
export const KOR_HULL = { y0: 4.0, w: 1.05, h: 5.0 };

/** Gavltrekant med normalen mot `nz` (inn i rommet), i høyden `y` med halv bredde `hw`. */
function gavlInne(k: MeshKit, hw: number, y: number, rise: number, z: number, nz: 1 | -1): void {
    const uv = (p: THREE.Vector3): [number, number] => [p.x, p.y];
    triMot(k, 'stein', V(-hw, y, z), V(hw, y, z), V(0, y + rise, z), V(0, 0, nz), uv);
}

/**
 * Skipet og koret som hule murer: sideskipenes yttervegger med vinduer og sørportalen, vestveggen
 * bak tårnene, arkaden med lysgluggene over, korbuen og korets vegger med spisse vinduer. Erstatter
 * de massive boksene kulissen hadde. Gesimsene, takene og strebepilarene står i mariakirken.ts.
 */
export function skipOgKor(k: MeshKit, c: ColliderKit): void {
    const langs = (x: number, fn: () => void) => k.at(x, 0, 0, -Math.PI / 2, fn, c);
    const tvers = (z: number, fn: () => void) => k.at(0, 0, z, 0, fn, c);
    k.withTint(STEIN, () => {
        for (const side of [-1, 1] as const) {
            // Sideskipenes yttervegg: vinduer høyt oppe, og sørportalen [V] i stedet for det tredje vinduet.
            const hull: Hull[] = SIDE_Z.filter((z) => side > 0 || z !== PORTAL.z).map((z) => ({ u: z, y0: 4.2, w: 0.8, h: 1.7 }));
            if (side < 0) hull.push({ u: PORTAL.z, y0: 0, w: PORTAL.w, h: PORTAL.h });
            langs(side * (SIDESKIP.hw - YT / 2), () => murMedHull(k, c, 'stein', SKIP.z0, SKIP.z1, 0, SIDESKIP.h, YT, hull, { fot: true, ender: false }));

            // Arkaden: buene ned til sideskipet, og over sideskipstaket lysgluggene på sørsida [V].
            langs(side * XA, () => {
                murMedHull(k, c, 'stein', VEST, KB0, 0, SIDESKIP.h, AR, ARK.u.map((u) => ({ u, y0: 0, w: ARK.w, h: ARK.h })), { ender: false });
                const lys = side < 0 ? SIDE_Z.map((u) => ({ u, y0: SIDESKIP.top + 0.9, w: 0.85, h: 1.6 })) : [];
                murMedHull(k, c, 'stein', VEST, SKIP.z1, SIDESKIP.h, SKIP.h, AR, lys, { ender: false });
                // Kapitel og fot på pilarene: en list der buene starter og en sokkel nederst.
                k.withTint(LIST, () => {
                    const piler = [VEST + 0.27, ...ARK.u.slice(0, -1).map((u) => u + 2.7), KB0 - 0.27];
                    for (const u of piler) {
                        const b = u === piler[0] || u === piler[piler.length - 1] ? 0.7 : 1.2;
                        k.box('stein', u, ARK.h - 0.12, 0, b, 0.24, AR + 0.2);
                        k.box('stein', u, 0.2, 0, b, 0.4, AR + 0.16, { skip: ['bottom'] });
                    }
                });
            });
            // Sideskipenes østvegg mot koret.
            tvers(SKIP.z1 - YT / 2, () =>
                murMedHull(k, c, 'stein', side > 0 ? SKIP.hw : -SIDESKIP.hw, side > 0 ? SIDESKIP.hw : -SKIP.hw, 0, SIDESKIP.h, YT, [], { fot: true, ender: false })
            );
            // Koret: høye, spisse vinduer [V gotisk].
            langs(side * XA, () =>
                murMedHull(k, c, 'stein', SKIP.z1, KOR.z1, 0, KOR.h, AR, KOR_VINDU.map((u) => ({ u, ...KOR_HULL, bue: 'spiss' as const })), { fot: true, ender: false })
            );
        }
        // Vestveggen bak tårnene: lav under sideskipstakene, høy midt i skipet. Tårnene står foran.
        tvers(SKIP.z0 + YT / 2, () => {
            murMedHull(k, c, 'stein', -SIDESKIP.hw, SIDESKIP.hw, 0, SIDESKIP.h, YT, [], { ender: false, skip: ['nz'] });
            murMedHull(k, c, 'stein', -SKIP.hw, SKIP.hw, SIDESKIP.h, SKIP.h, YT, [], { skip: ['nz'] });
        });
        // Korbuen og østveggen i koret.
        tvers(SKIP.z1, () => murMedHull(k, c, 'stein', -SKIP.hw, SKIP.hw, 0, SKIP.h, KORBUE.t, [{ u: 0, y0: 0, w: KORBUE.w, h: KORBUE.h }], { ender: false }));
        tvers(KOR.z1 - AR / 2, () => murMedHull(k, c, 'stein', -KOR.hw, KOR.hw, 0, KOR.h, AR, OST_VINDU, { fot: true, ender: false }));

        // Gavlene sett innenfra: takrommet over murkronene er åpent.
        const hw = SKIP.hw + 0.2;
        gavlInne(k, hw, SKIP.h, hw * SKIP.pitch, VEST, 1);
        gavlInne(k, hw, SKIP.h, hw * SKIP.pitch, KB0, -1);
        gavlInne(k, KOR.hw + 0.2, KOR.h, (KOR.hw + 0.2) * KOR.pitch, OST, -1);
        // Endene av sideskipene opp mot pulttaket.
        const uv = (p: THREE.Vector3): [number, number] => [p.x, p.y];
        for (const s of [-1, 1]) {
            triMot(k, 'stein', V(s * SKIP.hw, SIDESKIP.h, SKIP.z1 - YT), V(s * SIDESKIP.hw, SIDESKIP.h, SKIP.z1 - YT), V(s * SKIP.hw, SIDESKIP.top, SKIP.z1 - YT), V(0, 0, -1), uv);
            triMot(k, 'stein', V(s * SKIP.hw, SIDESKIP.h, VEST), V(s * SIDESKIP.hw, SIDESKIP.h, VEST), V(s * SKIP.hw, SIDESKIP.top, VEST), V(0, 0, 1), uv);
        }
    });
}

/** Et lys: stake, voks og flamme. `kl` er flate farger (voks, duk), `kf` flammene uten lys. */
function lys(ki: MeshKit, kl: MeshKit, kf: MeshKit, x: number, y: number, z: number, stake: number): void {
    ki.withTint({ top: 0.42, bottom: 0.42, hue: [1.1, 0.95, 0.75] }, () => {
        ki.log('raatre', V(x, y, z), V(x, y + 0.03, z), 0.09, 8, true);
        ki.log('raatre', V(x, y, z), V(x, y + stake, z), 0.025, 6, true, 0.035);
    });
    kl.withTint({ top: 1, bottom: 1, hue: [0.93, 0.88, 0.72] }, () => kl.log('mork', V(x, y + stake, z), V(x, y + stake + 0.26, z), 0.025, 6, true));
    flamme(kf, V(x, y + stake + 0.33, z));
}

/** En liten flamme: to kryssede ruter med spiss topp, i ett materiale uten lys (alltid like klar). */
export function flamme(kf: MeshKit, p: THREE.Vector3): void {
    const h = 0.07;
    const w = 0.022;
    kf.withTint({ top: 1, bottom: 1, hue: [1.0, 0.78, 0.38] }, () => {
        for (const [dx, dz] of [[w, 0], [0, w]]) {
            for (const n of [1, -1]) {
                const A = V(p.x - dx, p.y - h * 0.4, p.z - dz);
                const B = V(p.x + dx, p.y - h * 0.4, p.z + dz);
                const T = V(p.x, p.y + h, p.z);
                const Bn = V(p.x, p.y - h * 0.7, p.z);
                const nv = dx ? V(0, 0, n) : V(n, 0, 0);
                const uv = (): [number, number] => [0, 0];
                triMot(kf, 'mork', A, B, T, nv, uv);
                triMot(kf, 'mork', B, A, Bn, nv, uv);
            }
        }
    });
}

/** Et alter av stein med linduk over: duken går i `kl` (flat farge). */
function alter(ki: MeshKit, kl: MeshKit, c: ColliderKit, x: number, y: number, z: number, w: number, d: number): void {
    const h = 1.0;
    ki.withTint({ top: 1.05, bottom: 0.8, hue: [0.95, 0.98, 0.96] }, () => ki.box('stein', x, y + h / 2, z, w, h, d, { skip: ['bottom'], shadeFoot: true }));
    kl.withTint({ top: 1, bottom: 1, hue: [0.86, 0.84, 0.78] }, () => {
        kl.box('mork', x, y + h + 0.015, z, w + 0.08, 0.03, d + 0.08);
        kl.box('mork', x, y + h - 0.2, z - d / 2 - 0.05, w + 0.08, 0.42, 0.02);
    });
    c.box(x, y + h / 2, z, w, h, d);
}

export interface KirkeInne {
    /** Ildlyset står ved alterlysene (lokalt rom). */
    ild: THREE.Vector3[];
    folk: Plass[];
    /** Rommet innenfor murene (lokalt rom). */
    rom: THREE.Box3;
    /**
     * Stedene «Messe i Mariakirken» bruker (lokalt rom): foran sidealteret og høyalteret, og oppå
     * høyalteret der lyset settes (`hoyalter-topp`, aldri et mål i seg selv).
     */
    steder: Sted[];
}

/**
 * Golvet, trinnene opp i koret, alteret med lys, et sidealter, krusifikset i korbuen og bjelkene
 * under taket. `ki` har vanlige materialer, `kl` flate farger (duker og voks), `kf` flammene.
 */
export function inventar(ki: MeshKit, kl: MeshKit, kf: MeshKit, c: ColliderKit): KirkeInne {
    // Golvet: steinheller i skipet, to trinn opp til koret.
    ki.withTint({ top: 0.95, bottom: 0.95, hue: [0.98, 0.98, 0.96] }, () => {
        ki.box('stein', 0, GOLV / 2, (VEST + KB0) / 2, XS * 2, GOLV, KB0 - VEST, { skip: ['bottom'] });
        ki.box('stein', 0, 0.085, KB0 - 0.25, KORBUE.w + 0.4, 0.17, 1.3, { skip: ['bottom'] });
        ki.box('stein', 0, KORGOLV / 2, (KB1 - 0.2 + OST) / 2, (SKIP.hw - AR) * 2, KORGOLV, OST - KB1 + 0.2, { skip: ['bottom'] });
    });
    // Gravheller i golvet: Kontorets folk ble begravet i kirken [V at de ble begravet der; hellene S].
    ki.withTint({ top: 0.62, bottom: 0.62, hue: [0.95, 0.97, 0.96] }, () => {
        for (const [x, z] of [[-6.6, 12.5], [-6.6, 18.8], [6.4, 14.4], [-2.2, 11.6], [2.4, 24.0]] as const) ki.box('stein', x, GOLV + 0.006, z, 0.95, 0.012, 2.0);
    });
    c.box(0, GOLV - 0.5, (VEST + KB0) / 2, XS * 2, 1, KB0 - VEST);
    c.box(0, KORGOLV - 0.5, (KB1 + OST) / 2, (SKIP.hw - AR) * 2, 1, OST - KB1);
    const rampe: THREE.Vector3[] = [];
    for (const x of [-KORBUE.w / 2 - 0.2, KORBUE.w / 2 + 0.2]) rampe.push(V(x, 0, KB0 - 0.95), V(x, GOLV, KB0 - 0.95), V(x, KORGOLV, KB1), V(x, 0, KB1));
    c.hull(rampe);

    // Høyalteret innerst i koret, med to lys og et lite kors [S].
    const az = OST - 1.75;
    alter(ki, kl, c, 0, KORGOLV, az, 2.0, 0.9);
    for (const x of [-0.75, 0.75]) lys(ki, kl, kf, x, KORGOLV + 1.03, az + 0.15, 0.32);
    ki.withTint({ top: 0.55, bottom: 0.55, hue: [1.1, 0.95, 0.75] }, () => {
        ki.box('raatre', 0, KORGOLV + 1.33, az + 0.3, 0.05, 0.6, 0.05);
        ki.box('raatre', 0, KORGOLV + 1.47, az + 0.3, 0.32, 0.05, 0.05);
    });
    // To høye lysestaker ved trinnene.
    for (const x of [-2.4, 2.4]) {
        lys(ki, kl, kf, x, GOLV, KB0 - 1.4, 1.3);
        c.box(x, 0.7, KB0 - 1.4, 0.2, 1.4, 0.2, true);
    }
    // Sidealteret i nordre sideskip, ved østveggen.
    const sx = (SKIP.hw + XS) / 2;
    const sz = SKIP.z1 - YT - 0.5;
    alter(ki, kl, c, sx, GOLV, sz, 1.4, 0.7);
    lys(ki, kl, kf, sx + 0.35, GOLV + 1.03, sz, 0.22);

    // Krusifikset på en bjelke i korbuen, der koret begynner [S].
    ki.withTint({ top: 0.5, bottom: 0.5, hue: [1.05, 0.95, 0.85] }, () => {
        ki.log('raatre', V(-KORBUE.w / 2 - 0.3, KORBUE.h, SKIP.z1), V(KORBUE.w / 2 + 0.3, KORBUE.h, SKIP.z1), 0.13, 7, false);
        ki.box('raatre', 0, KORBUE.h + 1.25, SKIP.z1, 0.17, 2.4, 0.14);
        ki.box('raatre', 0, KORBUE.h + 1.75, SKIP.z1, 1.5, 0.15, 0.14);
    });
    // Bjelkene under det åpne taket i midtskipet og koret.
    ki.withTint({ top: 0.45, bottom: 0.45 }, () => {
        for (let z = VEST + 1.6; z < KB0 - 0.5; z += 2.9) ki.log('raatre', V(-XA, SKIP.h - 0.15, z), V(XA, SKIP.h - 0.15, z), 0.14, 6, false);
        for (let z = KB1 + 1.8; z < OST - 0.5; z += 3.2) ki.log('raatre', V(-XA, KOR.h - 0.15, z), V(XA, KOR.h - 0.15, z), 0.13, 6, false);
    });

    const mot = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);
    const prest = V(-1.3, GOLV, KB0 - 2.9);
    const klokker = V(sx, GOLV, sz - 1.05);
    return {
        ild: [V(0, KORGOLV + 1.6, az - 0.4), V(0, 1.6, KB0 - 1.4)],
        folk: [
            // Presten står foran trinnene og ser mot portalen der folk kommer inn.
            { figur: 'prest', rolle: 'staa', pos: prest, yaw: mot(prest.x, prest.z, -XS, PORTAL.z), id: 'presten' },
            // Klokkeren steller lysene på sidealteret.
            { figur: 'klokker', rolle: 'skrive', pos: klokker, yaw: 0, id: 'klokkeren' },
        ],
        rom: new THREE.Box3(V(-XS, -0.5, VEST), V(XS, SKIP.h + 4, OST)),
        steder: [
            { id: 'sidealter', pos: V(sx - 0.5, GOLV, sz - 0.9), r: 2.0 },
            { id: 'hoyalter', pos: V(0, KORGOLV, az - 0.85), r: 1.6 },
            { id: 'hoyalter-topp', pos: V(0.25, KORGOLV + 1.03, az - 0.1), r: 0 },
        ],
    };
}
