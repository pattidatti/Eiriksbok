// Modulsettet for Bryggens gårder: laft, gavl, bordkledd fasade, torvtak, bordtak, svalgang,
// trapp, vinsj og dører.
//
// Hvert hus bygges i sitt eget rom: x på tvers (0 = midt i huset), z innover fra gavlen mot
// sjøen (z = 0) og y opp fra bakken. Gården flytter rommet på plass med MeshKit.at().
//
// Det vi bygger etter (blueprint §5.2): laftehus med torvtak etter brannen i 1248, 2-3 etasjer
// med uisolerte lagerloft, gavlen mot sjøen, svalganger over gårdsrommet i andre etasje.
// Detaljene (bordkledd gavl, heisebjelke, loftsdører over hverandre) er slik Bryggen ser ut i
// dag og på eldre bilder; hvordan hver gård så ut i 1420-årene vet vi ikke i detalj [U].
import * as THREE from 'three';
import { type ColliderKit, type MatKey, type MeshKit, type Tint } from '../motor/meshkit';
import { LOG_H } from '../motor/materials';

export interface HouseSpec {
    w: number;
    l: number;
    /** Etasjehøyder fra bakken og opp. Taket starter på summen. */
    floors: number[];
    roof: 'torv' | 'bordtak';
    /** Takhøyde per halve bredde (0,85 ≈ 40°). */
    pitch: number;
    tint: Tint;
    /** Laftehoder i hjørnene foran/bak. Av der huset står vegg i vegg med naboen. */
    cornersFront: boolean;
    cornersBack: boolean;
    /** Bordkledd framgavl med loftsdører over hverandre og heisebjelke. */
    facade?: boolean;
    vinsj?: boolean;
    /** Dører i første etasje: side (-1 = mot -x, 1 = mot +x) og z. */
    doors?: { side: -1 | 1; z: number; open?: boolean }[];
    /** Dører i andre etasje ut mot svalgangen. */
    upperDoors?: { side: -1 | 1; z: number }[];
}

export const eaveY = (s: HouseSpec) => s.floors.reduce((a, b) => a + b, 0);
export const riseOf = (s: HouseSpec) => s.pitch * (s.w / 2);

const GABLE_OVER = 0.4; // taket stikker ut over gavlen
const EAVE_OVER = 0.45; // og over langveggen
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ── Laftekroppen ──

/** Veggene som én laftet kropp, med mørk fot (fukt og skitt nederst) og svill av råtre. */
function laftKropp(k: MeshKit, c: ColliderKit, s: HouseSpec): void {
    const h = eaveY(s);
    const t = s.tint;
    // Svillen: en grov stokk som huset hviler på.
    k.withTint({ ...t, top: t.top * 0.7 }, () => k.box('raatre', 0, 0.12, s.l / 2, s.w + 0.06, 0.24, s.l + 0.06, { skip: ['bottom'] }));
    const foot = 0.9;
    k.withTint({ ...t, bottom: t.top * 0.55 }, () =>
        k.box('laft', 0, 0.24 + (foot - 0.24) / 2, s.l / 2, s.w, foot - 0.24, s.l, { skip: ['top', 'bottom'], shadeFoot: true })
    );
    k.box('laft', 0, foot + (h - foot) / 2, s.l / 2, s.w, h - foot, s.l, { skip: ['top', 'bottom'] });
    // Fasaden dekker framveggen; den får sin egen kollider.
    c.box(0, h / 2, s.l / 2, s.w, h, s.l);
}

/**
 * Laftehoder: endene av stokkene stikker ut forbi hjørnet, annenhver omfar på tvers og på langs.
 * Det er dette som gjør et laftehus gjenkjennelig på avstand.
 */
function laftehoder(k: MeshKit, s: HouseSpec): void {
    const h = eaveY(s);
    const r = LOG_H * 0.5;
    const out = 0.24;
    const inset = r * 0.7;
    const ends: number[] = [];
    if (s.cornersFront) ends.push(0);
    if (s.cornersBack) ends.push(s.l);
    const courses = Math.floor((h - 0.3) / LOG_H);
    for (const z of ends) {
        const dz = z === 0 ? -1 : 1;
        for (let i = 0; i < courses; i++) {
            const y = 0.3 + LOG_H * (i + 0.5);
            // Litt variasjon i lengde og tone: stokkene er håndhogde.
            const jitter = ((i * 7919 + z * 31) % 7) / 7;
            const len = out + jitter * 0.05;
            k.withTint({ ...s.tint, top: s.tint.top * (0.9 + jitter * 0.15) }, () => {
                for (const sx of [-1, 1]) {
                    if (i % 2 === 0) {
                        // Stokk langs x (gavlveggen) stikker ut til siden.
                        const zc = z - dz * inset;
                        k.log('laft', V(sx * (s.w / 2 - 0.05), y, zc), V(sx * (s.w / 2 + len), y, zc), r, 8);
                    } else {
                        // Stokk langs z (langveggen) stikker ut forbi gavlen.
                        const xc = sx * (s.w / 2 - inset);
                        k.log('laft', V(xc, y, z - dz * 0.05), V(xc, y, z + dz * len), r, 8);
                    }
                }
            });
        }
    }
}

/** Gavltrekanten over takfoten, i stående bord. `z` er planet, `out` er -1 (mot sjøen) eller 1. */
function gavl(k: MeshKit, s: HouseSpec, z: number, out: -1 | 1, inset = 0): void {
    const y0 = eaveY(s);
    const rise = riseOf(s);
    const hw = s.w / 2 + inset;
    const zz = z + out * 0.035;
    const a = V(-hw, y0, zz), b = V(hw, y0, zz), top = V(0, y0 + rise + inset * s.pitch, zz);
    const sh: [number, number, number] = [s.tint.top, s.tint.top, s.tint.top * 0.92];
    // Vinding: normalen skal peke ut av gavlen.
    if (out < 0) k.tri('bordvegg', b, a, top, [hw, y0], [-hw, y0], [0, y0 + rise], sh);
    else k.tri('bordvegg', a, b, top, [-hw, y0], [hw, y0], [0, y0 + rise], sh);
    // Kant mot laften under: et liggende bord som tetter overgangen.
    k.box('raatre', 0, y0 + 0.06, z + out * 0.06, s.w + 0.08, 0.12, 0.08);
}

// ── Dører og luker ──

/**
 * Dør i et plan der fasaden er z = 0 og utsiden er -z. Kalles inne i k.at() for å snu den.
 * Karm av råtre, dørblad av stående bord (mørkere), eller mørk åpning når døra står åpen.
 */
export function dor(k: MeshKit, w: number, h: number, y0: number, open = false): void {
    const t = k.tint;
    const fw = 0.14;
    k.withTint({ ...t, top: t.top * 0.6 }, () => {
        k.box('raatre', -w / 2 - fw / 2, y0 + h / 2, -0.05, fw, h + fw, 0.1);
        k.box('raatre', w / 2 + fw / 2, y0 + h / 2, -0.05, fw, h + fw, 0.1);
        k.box('raatre', 0, y0 + h + fw / 2, -0.06, w + fw * 2 + 0.1, fw, 0.12);
    });
    if (open) {
        k.box('mork', 0, y0 + h / 2, -0.01, w, h, 0.02, { skip: ['pz'] });
    } else {
        // Dørbladet er lysere enn veggen rundt (nyere bord, mindre tjære), så døra leses på avstand.
        // Dørbladet er lysere enn veggen rundt (nyere bord, mindre tjære), så døra leses på avstand.
        // Det står litt inn i karmen, så karmen kaster en smal skygge.
        k.withTint({ ...t, top: t.top * 1.3, hue: [1.08, 1.0, 0.9] }, () => k.box('bordvegg', 0, y0 + h / 2, -0.015, w, h, 0.03, { skip: ['pz'] }));
        // Hengsler: korte jernbånd fra hengslesida, ikke tvers over (da ligner døra en stige).
        k.withTint({ top: 0.28, bottom: 0.28 }, () => {
            k.box('raatre', -w * 0.3, y0 + h * 0.2, -0.035, w * 0.4, 0.045, 0.012);
            k.box('raatre', -w * 0.3, y0 + h * 0.8, -0.035, w * 0.4, 0.045, 0.012);
        });
    }
}

/** Snur dør-rommet så døra sitter på en langvegg (side ±1) eller på framgavlen. */
function onLongWall(k: MeshKit, s: HouseSpec, side: -1 | 1, z: number, fn: () => void): void {
    k.at(side * (s.w / 2), 0, z, side > 0 ? -Math.PI / 2 : Math.PI / 2, fn);
}

// ── Fasaden mot sjøen ──

/**
 * Bordkledd framgavl: stående bord fra bakken til mønet, en stor bu-dør nederst og
 * loftsdører over hverandre midt på, slik at varene kan heises rett inn på hvert loft.
 */
function fasade(k: MeshKit, s: HouseSpec): void {
    const h = eaveY(s);
    const t = s.tint;
    k.withTint({ ...t, bottom: t.top * 0.6 }, () =>
        k.box('bordvegg', 0, h / 2, -0.035, s.w + 0.06, h, 0.07, { skip: ['pz'], shadeFoot: true })
    );
    // Hjørnebord: dekker overgangen til laften på langveggene.
    k.withTint({ ...t, top: t.top * 0.8 }, () => {
        for (const sx of [-1, 1]) k.box('raatre', sx * (s.w / 2 + 0.02), h / 2, 0.02, 0.12, h, 0.16);
    });
    k.at(0, 0, -0.07, 0, () => {
        dor(k, 1.5, 2.05, 0.18, false);
        let y = s.floors[0];
        for (let i = 1; i < s.floors.length; i++) {
            dor(k, 1.0, 1.45, y + 0.35, false);
            y += s.floors[i];
        }
        // Øverste luke (inn i gavlloftet) står åpen: der går tauet fra vinsjen.
        if (s.vinsj) dor(k, 0.95, 1.25, h + 0.25, true);
    });
}

// ── Taket ──

/** Den ene takflaten som en plate: `side` -1 eller 1. Returnerer matrisen (til kollideren). */
function takflate(s: HouseSpec, side: -1 | 1, thick: number, lift: number, extraEave = 0): { m: THREE.Matrix4; len: number } {
    const y0 = eaveY(s);
    const a = Math.atan(s.pitch);
    const ridgeY = y0 + riseOf(s);
    const run = s.w / 2 / Math.cos(a) + (EAVE_OVER + extraEave) / Math.cos(a);
    const t0 = -0.12; // litt forbi mønet, så flatene møtes
    const tc = (t0 + run) / 2;
    const d = new THREE.Vector2(side * Math.cos(a), -Math.sin(a));
    const n = new THREE.Vector2(side * Math.sin(a), Math.cos(a));
    const cx = d.x * tc + n.x * (lift + thick / 2);
    const cy = ridgeY + d.y * tc + n.y * (lift + thick / 2);
    const m = new THREE.Matrix4().makeRotationZ(-side * a).setPosition(cx, cy, s.l / 2);
    return { m, len: run - t0 };
}

function tak(k: MeshKit, c: ColliderKit, s: HouseSpec): void {
    const L = s.l + GABLE_OVER * 2;
    const a = Math.atan(s.pitch);
    const y0 = eaveY(s);
    const ridgeY = y0 + riseOf(s);
    for (const side of [-1, 1] as const) {
        // Underlaget: bord fra mønet og ned (synes under takskjegget).
        const under = takflate(s, side, 0.06, 0, 0);
        k.slab('bordtak', under.m, under.len, 0.06, L, { grain: 'x' });
        if (s.roof === 'torv') {
            // Torva: tykk, litt kortere enn underlaget, avrundet i tonen mot kanten.
            const torv = takflate(s, side, 0.2, 0.06, -0.12);
            k.withTint({ ...s.tint, top: 1, hue: [0.95, 1, 0.9] }, () => k.slab('torv', torv.m, torv.len, 0.2, L - 0.24));
            // Torvvol: stokken langs takfoten som holder torva på plass.
            const run = s.w / 2 + EAVE_OVER - 0.1;
            const yv = ridgeY - run * Math.tan(a) + 0.14;
            k.log('raatre', V(side * run, yv, -GABLE_OVER + 0.02), V(side * run, yv, s.l + GABLE_OVER - 0.02), 0.09, 6);
        } else {
            // Mønebord: to bord som dekker skjøten øverst. Platas lokale x peker ned
            // takflaten på høyre side og opp på venstre, derav `side`.
            const top = takflate(s, side, 0.04, 0.06, 0);
            const rb = new THREE.Matrix4().multiplyMatrices(top.m, new THREE.Matrix4().makeTranslation(side * (-top.len / 2 + 0.16), 0, 0));
            k.slab('raatre', rb, 0.3, 0.04, L);
        }
        const col = takflate(s, side, 0.26, 0, 0);
        const q = new THREE.Quaternion().setFromRotationMatrix(col.m);
        const p = new THREE.Vector3().setFromMatrixPosition(col.m);
        c.box(p.x, p.y, p.z, col.len, 0.26, L, false, new THREE.Euler().setFromQuaternion(q));
    }
    // Vindskier: brede bord langs gavlkanten, krysset over mønet.
    const len = (s.w / 2 + EAVE_OVER) / Math.cos(a) + 0.35;
    const thickTop = s.roof === 'torv' ? 0.3 : 0.12;
    for (const z of [-GABLE_OVER + 0.02, s.l + GABLE_OVER - 0.02]) {
        for (const side of [-1, 1] as const) {
            const d = new THREE.Vector2(side * Math.cos(a), -Math.sin(a));
            const tc = len / 2 - 0.3;
            const m = new THREE.Matrix4()
                .makeRotationZ(-side * a)
                .setPosition(d.x * tc, ridgeY + d.y * tc + thickTop * 0.5, z);
            k.withTint({ ...s.tint, top: s.tint.top * 0.8 }, () => k.slab('raatre', m, len, 0.26, 0.05));
        }
    }
}

// ── Vinsjen ──

/**
 * Heisebjelken stikker ut over sjøsiden fra gavlspissen, med trinse og tau ned foran
 * loftsdørene. Inne i den åpne luka synes trommelen med handtakene.
 */
function vinsj(k: MeshKit, s: HouseSpec): void {
    const h = eaveY(s);
    const beamY = h + riseOf(s) - 0.75;
    const t = s.tint;
    k.withTint({ ...t, top: t.top * 0.85 }, () => {
        k.box('raatre', 0, beamY, -0.6, 0.22, 0.24, 1.5);
        // Skråstøtte under bjelken.
        const m = new THREE.Matrix4().makeRotationX(-0.75).setPosition(0, beamY - 0.45, -0.32);
        k.slab('raatre', m, 0.14, 0.14, 0.95);
    });
    // Trinse: en kort, tykk skive under bjelkeenden.
    k.log('raatre', V(-0.07, beamY - 0.22, -1.15), V(0.07, beamY - 0.22, -1.15), 0.14, 10);
    // Tauet og kroken. Tauet er en tynn, lys stokk.
    const ropeLow = s.floors[0] + 0.9;
    k.withTint({ top: 0.95, bottom: 0.95, hue: [1.05, 0.95, 0.75] }, () => {
        k.log('raatre', V(0, beamY - 0.3, -1.29), V(0, ropeLow, -1.29), 0.022, 5, false);
        k.log('raatre', V(0, beamY - 0.3, -1.01), V(0, h + 0.5, -0.2), 0.022, 5, false);
    });
    k.withTint({ top: 0.3, bottom: 0.3 }, () => {
        k.box('raatre', 0, ropeLow - 0.08, -1.29, 0.05, 0.16, 0.05);
        k.box('raatre', 0, ropeLow - 0.16, -1.24, 0.05, 0.05, 0.12);
    });
    // Trommelen inne i luka, med fire handtak.
    const dy = h + 0.85;
    k.log('raatre', V(-0.55, dy, 0.45), V(0.55, dy, 0.45), 0.17, 9);
    for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + 0.3;
        const ex = Math.cos(ang) * 0.42;
        const ey = Math.sin(ang) * 0.42;
        k.log('raatre', V(0.5, dy, 0.45), V(0.5, dy + ey, 0.45 + ex), 0.025, 4, false);
    }
}

// ── Hele huset ──

export function hus(k: MeshKit, c: ColliderKit, s: HouseSpec): void {
    k.withTint(s.tint, () => {
        laftKropp(k, c, s);
        laftehoder(k, s);
        if (s.facade) fasade(k, s);
        gavl(k, s, 0, -1, s.facade ? 0.07 : 0);
        gavl(k, s, s.l, 1);
        tak(k, c, s);
        if (s.vinsj) vinsj(k, s);
        for (const d of s.doors ?? []) onLongWall(k, s, d.side, d.z, () => dor(k, 1.05, 1.9, 0.24, d.open));
        for (const d of s.upperDoors ?? []) onLongWall(k, s, d.side, d.z, () => dor(k, 0.95, 1.85, s.floors[0] + 0.1));
    });
}

/**
 * Middels nivå: kroppen som en boks og taket som et prisme, i flat farge.
 * Alt havner i én bøtte, så en hel celle blir ett tegnekall på avstand.
 */
export function husLod(k: MeshKit, s: HouseSpec, lod: (key: MatKey) => THREE.Color): void {
    const h = eaveY(s);
    const rise = riseOf(s);
    const wall = lod(s.facade ? 'bordvegg' : 'laft').multiplyScalar(s.tint.top);
    const roof = lod(s.roof);
    k.withTint({ top: 1, bottom: 1, hue: [wall.r, wall.g, wall.b] }, () => k.box('mork', 0, h / 2, s.l / 2, s.w, h, s.l, { skip: ['bottom'] }));
    const hw = s.w / 2 + EAVE_OVER;
    const drop = EAVE_OVER * s.pitch;
    const z0 = -GABLE_OVER, z1 = s.l + GABLE_OVER;
    k.withTint({ top: 1, bottom: 1, hue: [roof.r, roof.g, roof.b] }, () => {
        k.quad('mork', V(hw, h - drop, z0), V(-hw, rise + drop, 0), V(0, 0, z1 - z0));
        k.quad('mork', V(-hw, h - drop, z1), V(hw, rise + drop, 0), V(0, 0, z0 - z1));
    });
    k.withTint({ top: 1, bottom: 1, hue: [wall.r * 0.9, wall.g * 0.9, wall.b * 0.9] }, () => {
        k.tri('mork', V(s.w / 2, h, 0), V(-s.w / 2, h, 0), V(0, h + rise, 0), [0, 0], [0, 0], [0, 0]);
        k.tri('mork', V(-s.w / 2, h, s.l), V(s.w / 2, h, s.l), V(0, h + rise, s.l), [0, 0], [0, 0], [0, 0]);
    });
}
