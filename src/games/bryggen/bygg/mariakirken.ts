// Mariakirken: fasaden bak gårdene i nordenden av Bryggen, oppe i bakken mot Øvregaten.
//
// Blueprint §5.2 og §5.3: Bergens eldste sognekirke, overdratt Kontoret 1408 [V]. Den står bare
// som kulisse: man kommer ikke dit, og den har ingen kollidere. Bygget av kleberstein mellom
// 1140 og 1180 som en treskipet basilika: et høyt midtskip og to lavere sideskip under egne tak
// [V SNL]. Tvillingtårnene i vest fikk formen sin etter brannen i 1248 og er 27 m til gesimsen,
// med et forhall imellom [V SNL, Wikipedia]. Koret ble forlenget mot øst etter 1248, i gotisk stil
// [V]. Skipet er ca. 23 m langt og 18 m bredt, koret 10 m bredt [V Wikipedia]. Romanske vinduer
// høyt oppe finnes bare på sørveggen, og sørportalen er den romanske hovedportalen [V Wikipedia].
//
// Tårntoppene vi ser i dag er fra 1500-tallet [V]. Hvordan de så ut i 1420-årene, vet vi ikke
// [K]; her har de lave pyramidetak av bord [S]. Kirken avviker ca. 20° fra øst-vest [V]; vinkelen
// mot gårdsrekkene er valgt for spillet [S]. Taktekkingen er heller ikke kjent [K].
//
// Kirkens eget rom: x på tvers (−x er sørsida), z fra vestfronten (z = 0) mot koret i øst, y opp
// fra kirkegården. Hele kirken er én MeshKit (ett tegnekall per materiale), med egne kopier av
// materialene der tåka er halvparten så tett (`Materials.tynnTake`): et landemerke skal synes.
import * as THREE from 'three';
import { MeshKit, type Tint } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellContent } from '../motor/streaming';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Kirkegården ligger så høyt over kaidekket: bakken stiger mot Øvregaten [S]. */
export const KIRKE_Y = 2.2;
/** Vinkelen kirken står i: koret peker innover og litt mot Vågsbunnen (−x). */
const ROT = -Math.PI / 6;

// Mål i kirkens rom (meter).
const TARN = { x0: 2.6, x1: 9, z1: 7.5, h: 27, tak: 7 };
const FORHALL_H = 13.5;
const SKIP = { z0: 7.5, z1: 30.5, hw: 5, h: 15.5, pitch: 0.95 };
const SIDESKIP = { hw: 9, h: 8.6, top: 11.4 };
const KOR = { z1: 44, hw: 5, h: 12.5, pitch: 0.95 };
export const KIRKE_LEN = KOR.z1;

// Kleberstein: grå med et grønnskjær, mørkere nederst der regnet spruter opp.
const STEIN: Tint = { top: 0.98, bottom: 0.72, hue: [0.9, 0.97, 0.95] };
const LIST: Tint = { top: 1.1, bottom: 1.1, hue: [0.95, 1.0, 0.97] };
const TAK: Tint = { top: 0.72, bottom: 0.72, hue: [0.92, 0.9, 0.9] };
const HULL: Tint = { top: 1, bottom: 1 };

/** Kjør `fn` på veggflaten: z = 0 er flaten, +z peker ut, x går langs veggen. */
type Flate = 'px' | 'nx' | 'pz' | 'nz';
function paFlate(k: MeshKit, f: Flate, cx: number, cz: number, hx: number, hz: number, fn: () => void): void {
    if (f === 'pz') k.at(cx, 0, cz + hz, 0, fn);
    else if (f === 'nz') k.at(cx, 0, cz - hz, Math.PI, fn);
    else if (f === 'px') k.at(cx + hx, 0, cz, Math.PI / 2, fn);
    else k.at(cx - hx, 0, cz, -Math.PI / 2, fn);
}

/**
 * Vindu eller portal i veggflaten: en mørk åpning med rund (romansk) eller spiss (gotisk) bue,
 * og en lysere steinkrans rundt buen. `u` er midten langs veggen, `y0` bunnen, `h` opp til
 * der buen starter.
 */
function apning(k: MeshKit, u: number, y0: number, w: number, h: number, bue: 'rund' | 'spiss' = 'rund'): void {
    const z = 0.05;
    const r = w / 2;
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
    // Buesteinene: en krans av små firkanter rundt buen, litt ute fra veggen.
    const t = Math.min(0.32, w * 0.22);
    k.withTint(LIST, () => {
        // Gotiske vinduer får en list under i stedet: smale lansetter har ikke plass til krans.
        if (bue === 'spiss') {
            k.box('stein', u, y0 - 0.1, z + 0.1, w + 0.5, 0.2, 0.3);
            return;
        }
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
function gesims(k: MeshKit, cx: number, cz: number, sx: number, sz: number, y: number, ut = 0.22): void {
    k.withTint(LIST, () => k.box('stein', cx, y, cz, sx + ut * 2, 0.32, sz + ut * 2));
}

/**
 * Saltak langs z fra `z0` til `z1`, med møne midt over x = 0. `hw` er halve bredden ved
 * takfoten (raft). Gavltrekantene tegnes i stein der `gavl` sier det.
 */
function saltak(k: MeshKit, hw: number, eave: number, pitch: number, z0: number, z1: number, gavl: { z0?: boolean; z1?: boolean }): void {
    const over = 0.5;
    const rise = hw * pitch;
    const a = Math.atan(pitch);
    const len = (hw + over) / Math.cos(a);
    const th = 0.18;
    for (const side of [-1, 1] as const) {
        // Plata: lokal x ned takflaten mot takfoten på denne siden.
        const mx = (side * (hw + over)) / 2;
        const my = (eave + rise + eave - over * pitch) / 2 + th / 2;
        const m = new THREE.Matrix4().makeRotationZ(-side * a).setPosition(mx, my, (z0 + z1) / 2);
        k.withTint(TAK, () => k.slab('bordtak', m, len, th, z1 - z0 + over * 2, { grain: 'x' }));
    }
    k.withTint(STEIN, () => {
        if (gavl.z0) k.tri('stein', V(-hw, eave, z0), V(hw, eave, z0), V(0, eave + rise, z0), [-hw, eave], [hw, eave], [0, eave + rise]);
        if (gavl.z1) k.tri('stein', V(hw, eave, z1), V(-hw, eave, z1), V(0, eave + rise, z1), [hw, eave], [-hw, eave], [0, eave + rise]);
    });
}

/** Pulttak over et sideskip: fra ytterveggen (`xo`) opp til midtskipets vegg (`xi`). */
function pulttak(k: MeshKit, xo: number, xi: number, yo: number, yi: number, z0: number, z1: number): void {
    const over = 0.45;
    const dir = Math.sign(xo - xi);
    const dx = Math.abs(xo - xi);
    const a = Math.atan((yi - yo) / dx);
    const len = dx / Math.cos(a) + over;
    const xm = (xo + xi) / 2 + (dir * over) / 2;
    const ym = (yo + yi) / 2 + 0.09;
    const m = new THREE.Matrix4().makeRotationZ(-dir * a).setPosition(xm, ym, (z0 + z1) / 2);
    k.withTint(TAK, () => k.slab('bordtak', m, len, 0.18, z1 - z0, { grain: 'x' }));
    // Endene: trekanter i stein under pulttaket.
    const s = dir > 0 ? 1 : -1;
    k.withTint(STEIN, () => {
        const pz = (z: number, flip: boolean) => {
            const A = V(xi, yo, z), B = V(xo, yo, z), C = V(xi, yi, z);
            if (flip) k.tri('stein', A, C, B, [xi, yo], [xi, yi], [xo, yo]);
            else k.tri('stein', A, B, C, [xi, yo], [xo, yo], [xi, yi]);
        };
        pz(z0, s > 0);
        pz(z1, s < 0);
    });
}

/** Pyramidetak på et tårn: fire trekanter fra takfoten opp til en spiss. */
function pyramide(k: MeshKit, cx: number, cz: number, half: number, y: number, h: number): void {
    const top = V(cx, y + h, cz);
    const c = [V(cx - half, y, cz - half), V(cx + half, y, cz - half), V(cx + half, y, cz + half), V(cx - half, y, cz + half)];
    const slant = Math.hypot(half, h);
    k.withTint(TAK, () => {
        for (let i = 0; i < 4; i++) {
            const a = c[i];
            const b = c[(i + 1) % 4];
            // Rekkefølgen gir normalen utover (sett ovenfra går hjørnene med klokka i Three).
            k.tri('bordtak', b, a, top, [half * 2, 0], [0, 0], [half, slant]);
        }
    });
    // En liten stang med kule på toppen.
    k.withTint(TAK, () => k.log('raatre', top.clone().setY(y + h - 0.3), top.clone().setY(y + h + 1.4), 0.06, 5));
}

/** Ett av tårnene i vest. `side` −1 er sørtårnet, +1 nordtårnet. */
function tarn(k: MeshKit, side: -1 | 1): void {
    const w = TARN.x1 - TARN.x0;
    const cx = side * (TARN.x0 + TARN.x1) / 2;
    const cz = TARN.z1 / 2;
    k.withTint(STEIN, () => k.box('stein', cx, TARN.h / 2, cz, w, TARN.h, TARN.z1, { skip: ['bottom'], shadeFoot: true }));
    // Etasjelister: tårnet deles i høyder, slik romanske tårn gjør.
    for (const y of [FORHALL_H, 20]) gesims(k, cx, cz, w, TARN.z1, y, 0.12);
    gesims(k, cx, cz, w, TARN.z1, TARN.h, 0.28);
    // Lydglugger: to og to under gesimsen på hver side, en smal glugg lenger ned.
    const flater: Flate[] = ['nz', 'pz', side < 0 ? 'nx' : 'px'];
    for (const f of flater) {
        const bredde = f === 'nz' || f === 'pz' ? w : TARN.z1;
        paFlate(k, f, cx, cz, w / 2, TARN.z1 / 2, () => {
            for (const u of [-bredde * 0.18, bredde * 0.18]) apning(k, u, 21.6, 1.0, 2.6);
            if (f !== 'pz') apning(k, 0, 15.2, 0.5, 1.6);
            if (f === 'nz') apning(k, 0, 8.0, 0.45, 1.4);
        });
    }
    // Over forhallets tak: lydgluggene inn mot midten.
    paFlate(k, side < 0 ? 'px' : 'nx', cx, cz, w / 2, TARN.z1 / 2, () => {
        for (const u of [-TARN.z1 * 0.18, TARN.z1 * 0.18]) apning(k, u, 21.6, 1.0, 2.6);
    });
    pyramide(k, cx, cz, w / 2 + 0.35, TARN.h + 0.15, TARN.tak);
}

/** Selve kirken i sitt eget rom. */
function kirke(k: MeshKit): void {
    tarn(k, -1);
    tarn(k, 1);

    // Forhallet mellom tårnene, med vestportalen og et vindu over.
    const fw = TARN.x0 * 2;
    k.withTint(STEIN, () => k.box('stein', 0, FORHALL_H / 2, TARN.z1 / 2, fw, FORHALL_H, TARN.z1, { skip: ['bottom'], shadeFoot: true }));
    gesims(k, 0, TARN.z1 / 2, fw, TARN.z1, FORHALL_H, 0.12);
    paFlate(k, 'nz', 0, TARN.z1 / 2, fw / 2, TARN.z1 / 2, () => {
        // Portalen trappes inn i flere ledd; her som en fremspringende ramme rundt åpningen.
        k.withTint(LIST, () => k.box('stein', 0, 2.4, 0.2, 3.6, 4.8, 0.4, { skip: ['bottom'] }));
        k.at(0, 0, 0.4, 0, () => apning(k, 0, 0, 1.9, 2.9));
        apning(k, 0, 8.6, 1.1, 1.2);
    });

    // Midtskipet: høyt, med vinduer øverst bare på sørsida (−x) [V].
    const sz = SKIP.z1 - SKIP.z0;
    const szc = (SKIP.z0 + SKIP.z1) / 2;
    k.withTint(STEIN, () => k.box('stein', 0, SKIP.h / 2, szc, SKIP.hw * 2, SKIP.h, sz, { skip: ['bottom'], shadeFoot: true }));
    gesims(k, 0, szc, SKIP.hw * 2, sz, SKIP.h - 0.1, 0.18);
    // Vestgavlen synes over forhallet, mellom tårnene.
    saltak(k, SKIP.hw + 0.2, SKIP.h, SKIP.pitch, SKIP.z0, SKIP.z1, { z0: true, z1: true });
    paFlate(k, 'nx', 0, szc, SKIP.hw, sz / 2, () => {
        for (let i = 0; i < 4; i++) apning(k, -sz / 2 + 3.4 + i * 5.4, SIDESKIP.top + 0.9, 0.85, 1.6);
    });

    // Sideskipene: lave, under hvert sitt pulttak [V].
    const aw = SIDESKIP.hw - SKIP.hw;
    for (const side of [-1, 1] as const) {
        const ax = side * (SKIP.hw + aw / 2);
        k.withTint(STEIN, () => k.box('stein', ax, SIDESKIP.h / 2, szc, aw, SIDESKIP.h, sz, { skip: ['bottom', 'nz'], shadeFoot: true }));
        gesims(k, ax + side * 0.1, szc, aw - 0.2, sz, SIDESKIP.h - 0.1, 0.14);
        pulttak(k, side * (SIDESKIP.hw + 0.15), side * SKIP.hw, SIDESKIP.h, SIDESKIP.top, SKIP.z0, SKIP.z1);
        paFlate(k, side < 0 ? 'nx' : 'px', ax, szc, aw / 2, sz / 2, () => {
            for (let i = 0; i < 4; i++) {
                const u = -sz / 2 + 3.4 + i * 5.4;
                // Sørportalen [V]: nest østligst på sørsida, i stedet for et vindu.
                if (side < 0 && i === 2) continue;
                apning(k, u * -side, 4.2, 0.8, 1.7);
            }
        });
    }
    // Sørportalen med lav ramme rundt.
    paFlate(k, 'nx', -(SKIP.hw + aw / 2), szc, aw / 2, sz / 2, () => {
        const u = -sz / 2 + 3.4 + 2 * 5.4;
        k.withTint(LIST, () => k.box('stein', u, 2.2, 0.25, 3.4, 4.4, 0.5, { skip: ['bottom'] }));
        k.at(0, 0, 0.5, 0, () => apning(k, u, 0, 1.7, 2.7));
    });

    // Koret: like bredt som midtskipet, lavere, forlenget i gotisk stil etter 1248 [V].
    const kz = KOR.z1 - SKIP.z1;
    const kzc = (SKIP.z1 + KOR.z1) / 2;
    k.withTint(STEIN, () => k.box('stein', 0, KOR.h / 2, kzc, KOR.hw * 2, KOR.h, kz, { skip: ['bottom', 'nz'], shadeFoot: true }));
    gesims(k, 0, kzc, KOR.hw * 2, kz, KOR.h - 0.1, 0.18);
    saltak(k, KOR.hw + 0.2, KOR.h, KOR.pitch, SKIP.z1, KOR.z1, { z1: true });
    for (const side of [-1, 1] as const) {
        paFlate(k, side < 0 ? 'nx' : 'px', 0, kzc, KOR.hw, kz / 2, () => {
            for (const u of [-4.3, 0, 4.3]) apning(k, u, 4.0, 1.05, 5.0, 'spiss');
        });
        // Strebepilarer mellom vinduene: gotikkens måte å holde veggen.
        for (const z of [kzc - 2.15, kzc + 2.15, KOR.z1 - 0.45]) {
            k.withTint(STEIN, () => {
                k.box('stein', side * (KOR.hw + 0.45), 4.5, z, 0.9, 9, 0.9, { skip: ['bottom'], shadeFoot: true });
                k.box('stein', side * (KOR.hw + 0.3), 9.9, z, 0.6, 1.8, 0.8, { skip: ['bottom'] });
            });
        }
    }
    paFlate(k, 'pz', 0, kzc, KOR.hw, kz / 2, () => {
        apning(k, -2.1, 4.4, 0.9, 4.6, 'spiss');
        apning(k, 0, 4.0, 1.1, 5.6, 'spiss');
        apning(k, 2.1, 4.4, 0.9, 4.6, 'spiss');
    });
}

/** Middels nivå: tårn, skip og kor som bokser og prismer i flat farge. */
function kirkeLod(k: MeshKit, lod: (key: 'stein' | 'bordtak') => THREE.Color): void {
    const st = lod('stein');
    const tk = lod('bordtak').multiplyScalar(TAK.top);
    const farge = (c: THREE.Color): Tint => ({ top: 1, bottom: 1, hue: [c.r, c.g, c.b] });
    k.withTint(farge(st), () => {
        for (const side of [-1, 1]) k.box('mork', side * (TARN.x0 + TARN.x1) / 2, TARN.h / 2, TARN.z1 / 2, TARN.x1 - TARN.x0, TARN.h, TARN.z1, { skip: ['bottom'] });
        k.box('mork', 0, FORHALL_H / 2, TARN.z1 / 2, TARN.x0 * 2, FORHALL_H, TARN.z1, { skip: ['bottom'] });
        k.box('mork', 0, SKIP.h / 2, (SKIP.z0 + SKIP.z1) / 2, SKIP.hw * 2, SKIP.h, SKIP.z1 - SKIP.z0, { skip: ['bottom'] });
        k.box('mork', 0, SIDESKIP.h / 2, (SKIP.z0 + SKIP.z1) / 2, SIDESKIP.hw * 2, SIDESKIP.h, SKIP.z1 - SKIP.z0, { skip: ['bottom'] });
        k.box('mork', 0, KOR.h / 2, (SKIP.z1 + KOR.z1) / 2, KOR.hw * 2, KOR.h, KOR.z1 - SKIP.z1, { skip: ['bottom'] });
    });
    k.withTint(farge(tk), () => {
        for (const [hw, y, z0, z1, p] of [[SKIP.hw, SKIP.h, SKIP.z0, SKIP.z1, SKIP.pitch], [KOR.hw, KOR.h, SKIP.z1, KOR.z1, KOR.pitch]] as const) {
            const r = hw * p;
            k.quad('mork', V(hw, y, z0), V(-hw, r, 0), V(0, 0, z1 - z0));
            k.quad('mork', V(-hw, y, z1), V(hw, r, 0), V(0, 0, z0 - z1));
            k.tri('mork', V(hw, y, z1), V(-hw, y, z1), V(0, y + r, z1), [0, 0], [0, 0], [0, 0]);
        }
        for (const side of [-1, 1]) {
            const cx = side * (TARN.x0 + TARN.x1) / 2;
            const h = (TARN.x1 - TARN.x0) / 2;
            const top = V(cx, TARN.h + TARN.tak, TARN.z1 / 2);
            const c = [V(cx - h, TARN.h, 0), V(cx + h, TARN.h, 0), V(cx + h, TARN.h, TARN.z1), V(cx - h, TARN.h, TARN.z1)];
            for (let i = 0; i < 4; i++) k.tri('mork', c[(i + 1) % 4], c[i], top, [0, 0], [0, 0], [0, 0]);
        }
    });
}

/**
 * Cella med Mariakirken: kirkegården på en hylle i bakken, med mur mot gårdene nedenfor.
 * `cx`, `cz` er midten av kirken i verdensrom. Ingen kollidere: kirken er kulisse til man
 * kan gå opp Maria allmenning (senere fase).
 */
export function buildMariakirkeCell(mats: Materials, cx: number, cz: number, murZ: number): CellContent {
    const k = new MeshKit();
    const lod = new MeshKit();
    // Kirkens origo er midt på vestfronten; flytt så midten av kirken havner i (cx, cz).
    const half = KIRKE_LEN / 2;
    const ox = cx - Math.sin(ROT) * half;
    const oz = cz - Math.cos(ROT) * half;
    k.at(ox, KIRKE_Y, oz, ROT, () => kirke(k));
    lod.at(ox, KIRKE_Y, oz, ROT, () => kirkeLod(lod, (key) => mats.lodColor(key)));

    // Kirkegården: gress på en hylle, muren mot gårdene, og gjørme i glippen nedenfor.
    const gx0 = cx - 34, gx1 = cx + 34;
    const gz1 = cz + 40;
    k.withTint({ top: 0.85, bottom: 0.85, hue: [0.95, 1, 0.9] }, () =>
        k.box('torv', cx, KIRKE_Y / 2 - 0.5, (murZ + gz1) / 2, gx1 - gx0, KIRKE_Y + 1, gz1 - murZ, { skip: ['bottom', 'nz'] })
    );
    k.withTint(STEIN, () => k.box('stein', cx, (KIRKE_Y + 1.1) / 2 - 0.2, murZ, gx1 - gx0, KIRKE_Y + 1.5, 0.7, { skip: ['bottom'], shadeFoot: true }));
    k.withTint({ top: 0.7, bottom: 0.7 }, () => k.box('gjorme', cx, -0.06, murZ - 1.8, gx1 - gx0, 0.1, 3.6, { skip: ['bottom'] }));
    // Trekors på gravene: lave, skeive, i rader på sørsida av kirken [S].
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    k.withTint({ top: 0.6, bottom: 0.6 }, () => {
        for (let i = 0; i < 26; i++) {
            const along = -16 + (i % 9) * 4 + r() * 1.2;
            const out = 12.5 + Math.floor(i / 9) * 3 + r();
            // Sørsida er kirkens −x: i verden (−cos, sin) ganger avstanden ut.
            const x = cx - Math.cos(ROT) * out + Math.sin(ROT) * along;
            const z = cz + Math.sin(ROT) * out + Math.cos(ROT) * along;
            if (z < murZ + 1.5) continue;
            const tilt = (r() - 0.5) * 0.2;
            k.at(x, KIRKE_Y, z, ROT + (r() - 0.5) * 0.4, () => {
                k.slab('raatre', new THREE.Matrix4().makeRotationZ(tilt).setPosition(0, 0.55, 0), 0.1, 1.1, 0.08);
                k.slab('raatre', new THREE.Matrix4().makeRotationZ(tilt).setPosition(0, 0.75, 0), 0.6, 0.09, 0.07);
            });
        }
    });

    // Tynnere tåke enn resten av byen: ellers er kirken borte fra kaia og Vågen.
    const near = new THREE.Group();
    near.name = 'mariakirken';
    for (const [key, b] of k.buckets) {
        const mesh = new THREE.Mesh(b.toGeometry(), mats.tynnTake(key));
        mesh.name = `mariakirken:${key}`;
        mesh.castShadow = key !== 'torv';
        mesh.receiveShadow = true;
        near.add(mesh);
    }
    const mid = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.tynnTake('lod'));
    mid.name = 'mariakirken:lod';
    return { near, mid, colliders: [] };
}
