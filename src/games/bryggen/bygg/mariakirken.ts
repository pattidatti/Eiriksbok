// Mariakirken: bak gårdene i nordenden av Bryggen, på nordsida av Øvregaten.
//
// Blueprint §5.2 og §5.3: Bergens eldste sognekirke, overdratt Kontoret 1408 [V]. Man går inn fra
// gata gjennom porten i kirkegårdsmuren, langs gangstien og inn sørportalen; rommet innenfor står
// i mariakirken-inne.ts. Bygget av kleberstein mellom
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
// fra kirkegården. Hele kirken utenpå er én MeshKit (ett tegnekall per materiale), med egne kopier
// av materialene der tåka er halvparten så tett (`Materials.tynnTake`): et landemerke skal synes.
// Innredningen er en egen MeshKit som skjules på avstand. At kirkegården har mur og port mot gata,
// og hvor gangstien går, er [S].
import * as THREE from 'three';
import { ColliderKit, MeshKit, type Tint } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellContent } from '../motor/streaming';
import { STEIN, LIST, TAK, apning, paFlate, gesims, type Flate } from './stein';
import { murMedHull } from './buer';
import { FORHALL_H, KIRKE_LEN, KOR, PORTAL, SIDESKIP, SKIP, TARN, inventar, skipOgKor } from './mariakirken-inne';
import { lagFolk } from './folk';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Kirkegården ligger i samme høyde som Øvregaten: bakken stiger fra Bryggen [S]. */
export const KIRKE_Y = 2.0;
/** Vinkelen kirken står i: koret peker innover og litt mot Vågsbunnen (−x). */
const ROT = -Math.PI / 6;

/**
 * Saltak langs z fra `z0` til `z1`, med møne midt over x = 0. `hw` er halve bredden ved
 * takfoten (raft). Gavltrekantene tegnes i stein der `gavl` sier det.
 */
export function saltak(k: MeshKit, hw: number, eave: number, pitch: number, z0: number, z1: number, gavl: { z0?: boolean; z1?: boolean }): void {
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

/** List langs toppen av en yttervegg, bare utenpå (rommet innenfor er hult). */
function takList(k: MeshKit, x: number, z0: number, z1: number, y: number, ut: number): void {
    k.withTint(LIST, () => k.box('stein', x, y, (z0 + z1) / 2, ut * 2, 0.32, z1 - z0 + ut * 2));
}

/**
 * Selve kirken i sitt eget rom. Tårnene og forhallet er massive; skipet og koret er hule murer med
 * ekte vinduer og portal (mariakirken-inne.ts). `c` får kolliderne.
 */
function kirke(k: MeshKit, c: ColliderKit): void {
    tarn(k, -1);
    tarn(k, 1);
    const w = TARN.x1 - TARN.x0;
    for (const side of [-1, 1]) c.box(side * (TARN.x0 + TARN.x1) / 2, TARN.h / 2, TARN.z1 / 2, w, TARN.h, TARN.z1);

    // Forhallet mellom tårnene, med vestportalen og et vindu over. Portalen er lukket.
    const fw = TARN.x0 * 2;
    k.withTint(STEIN, () => k.box('stein', 0, FORHALL_H / 2, TARN.z1 / 2, fw, FORHALL_H, TARN.z1, { skip: ['bottom'], shadeFoot: true }));
    c.box(0, FORHALL_H / 2, TARN.z1 / 2, fw, FORHALL_H, TARN.z1);
    gesims(k, 0, TARN.z1 / 2, fw, TARN.z1, FORHALL_H, 0.12);
    paFlate(k, 'nz', 0, TARN.z1 / 2, fw / 2, TARN.z1 / 2, () => {
        // Portalen trappes inn i flere ledd; her som en fremspringende ramme rundt åpningen.
        k.withTint(LIST, () => k.box('stein', 0, 2.4, 0.2, 3.6, 4.8, 0.4, { skip: ['bottom'] }));
        k.at(0, 0, 0.4, 0, () => apning(k, 0, 0, 1.9, 2.9));
        apning(k, 0, 8.6, 1.1, 1.2);
    });

    skipOgKor(k, c);

    // Midtskipet: høyt, med vinduer øverst bare på sørsida (−x) [V]. Hullene er ekte; her bare kransen.
    const sz = SKIP.z1 - SKIP.z0;
    const szc = (SKIP.z0 + SKIP.z1) / 2;
    for (const s of [-1, 1]) takList(k, s * SKIP.hw, SKIP.z0, SKIP.z1, SKIP.h - 0.1, 0.18);
    // Vestgavlen synes over forhallet, mellom tårnene.
    saltak(k, SKIP.hw + 0.2, SKIP.h, SKIP.pitch, SKIP.z0, SKIP.z1, { z0: true, z1: true });
    paFlate(k, 'nx', 0, szc, SKIP.hw, sz / 2, () => {
        for (let i = 0; i < 4; i++) apning(k, -sz / 2 + 3.4 + i * 5.4, SIDESKIP.top + 0.9, 0.85, 1.6, 'rund', false);
    });

    // Sideskipene: lave, under hvert sitt pulttak [V].
    const aw = SIDESKIP.hw - SKIP.hw;
    for (const side of [-1, 1] as const) {
        const ax = side * (SKIP.hw + aw / 2);
        takList(k, side * SIDESKIP.hw, SKIP.z0, SKIP.z1, SIDESKIP.h - 0.1, 0.14);
        pulttak(k, side * (SIDESKIP.hw + 0.15), side * SKIP.hw, SIDESKIP.h, SIDESKIP.top, SKIP.z0, SKIP.z1);
        paFlate(k, side < 0 ? 'nx' : 'px', ax, szc, aw / 2, sz / 2, () => {
            for (let i = 0; i < 4; i++) {
                const u = -sz / 2 + 3.4 + i * 5.4;
                // Sørportalen [V]: nest østligst på sørsida, i stedet for et vindu.
                if (side < 0 && i === 2) continue;
                apning(k, u * -side, 4.2, 0.8, 1.7, 'rund', false);
            }
        });
    }
    // Sørportalen: en lav ramme rundt, med det samme hullet tvers gjennom.
    paFlate(k, 'nx', -(SKIP.hw + aw / 2), szc, aw / 2, sz / 2, () => {
        const u = PORTAL.z - szc;
        k.withTint(LIST, () => k.at(0, 0, 0.25, 0, () => murMedHull(k, c, 'stein', u - 1.7, u + 1.7, 0, 4.4, 0.5, [{ u, y0: 0, w: PORTAL.w, h: PORTAL.h }]), c));
        k.at(0, 0, 0.5, 0, () => apning(k, u, 0, PORTAL.w, PORTAL.h, 'rund', false));
    }, c);

    // Koret: like bredt som midtskipet, lavere, forlenget i gotisk stil etter 1248 [V].
    const kz = KOR.z1 - SKIP.z1;
    const kzc = (SKIP.z1 + KOR.z1) / 2;
    for (const s of [-1, 1]) takList(k, s * KOR.hw, SKIP.z1, KOR.z1, KOR.h - 0.1, 0.18);
    k.withTint(LIST, () => k.box('stein', 0, KOR.h - 0.1, KOR.z1, KOR.hw * 2 + 0.36, 0.32, 0.36));
    saltak(k, KOR.hw + 0.2, KOR.h, KOR.pitch, SKIP.z1, KOR.z1, { z1: true });
    for (const side of [-1, 1] as const) {
        paFlate(k, side < 0 ? 'nx' : 'px', 0, kzc, KOR.hw, kz / 2, () => {
            for (const u of [-4.3, 0, 4.3]) apning(k, u, 4.0, 1.05, 5.0, 'spiss', false);
        });
        // Strebepilarer mellom vinduene: gotikkens måte å holde veggen.
        for (const z of [kzc - 2.15, kzc + 2.15, KOR.z1 - 0.45]) {
            k.withTint(STEIN, () => {
                k.box('stein', side * (KOR.hw + 0.45), 4.5, z, 0.9, 9, 0.9, { skip: ['bottom'], shadeFoot: true });
                k.box('stein', side * (KOR.hw + 0.3), 9.9, z, 0.6, 1.8, 0.8, { skip: ['bottom'] });
            });
            c.box(side * (KOR.hw + 0.45), 4.5, z, 0.9, 9, 0.9);
        }
    }
    paFlate(k, 'pz', 0, kzc, KOR.hw, kz / 2, () => {
        apning(k, -2.1, 4.4, 0.9, 4.6, 'spiss', false);
        apning(k, 0, 4.0, 1.1, 5.6, 'spiss', false);
        apning(k, 2.1, 4.4, 0.9, 4.6, 'spiss', false);
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

/** Kirkegården: muren rundt (x0..x1, fra muren mot gata i z0 og innover til z1). */
export interface Kirkegard {
    x0: number;
    x1: number;
    z0: number;
    z1: number;
}

/** Avstand fra punktet (x, z) til linjestykket a-b. */
function avstand(x: number, z: number, a: THREE.Vector2, b: THREE.Vector2): number {
    const ab = b.clone().sub(a);
    const t = THREE.MathUtils.clamp(((x - a.x) * ab.x + (z - a.y) * ab.y) / ab.lengthSq(), 0, 1);
    return Math.hypot(x - (a.x + ab.x * t), z - (a.y + ab.y * t));
}

/**
 * Cella med Mariakirken: kirkegården i høyde med Øvregaten, med mur rundt og port mot gata, en
 * gangsti av heller fram til sørportalen, og kirkerommet innenfor (mariakirken-inne.ts). `cx`, `cz`
 * er midten av kirken i verdensrom. Presten og klokkeren står inne.
 */
export async function buildMariakirkeCell(mats: Materials, cx: number, cz: number, g: Kirkegard): Promise<CellContent> {
    const k = new MeshKit();
    const c = new ColliderKit();
    const lod = new MeshKit();
    // Kirkens origo er midt på vestfronten; flytt så midten av kirken havner i (cx, cz).
    const half = KIRKE_LEN / 2;
    const ox = cx - Math.sin(ROT) * half;
    const oz = cz - Math.cos(ROT) * half;
    const M = new THREE.Matrix4().makeRotationY(ROT).setPosition(ox, KIRKE_Y, oz);
    k.at(ox, KIRKE_Y, oz, ROT, () => kirke(k, c), c);
    lod.at(ox, KIRKE_Y, oz, ROT, () => kirkeLod(lod, (key) => mats.lodColor(key)));

    // Inne: vanlige materialer, flate farger (duker og voks) og flammene, hver sin bøtte.
    const ki = new MeshKit();
    const kl = new MeshKit();
    const kf = new MeshKit();
    for (const x of [ki, kl, kf]) x.matrix = M.clone();
    c.matrix = M.clone();
    const inne = inventar(ki, kl, kf, c);
    c.matrix = new THREE.Matrix4();
    const iVerden = (p: THREE.Vector3) => p.clone().applyMatrix4(M);

    // Gangstien: fra porten i muren rett innover, og på skrå bort til sørportalen.
    const portal = iVerden(new THREE.Vector3(-SIDESKIP.hw, 0, PORTAL.z));
    const ut = iVerden(new THREE.Vector3(-SIDESKIP.hw - 6, 0, PORTAL.z));
    const sti = [new THREE.Vector2(ut.x, g.z0), new THREE.Vector2(ut.x, ut.z), new THREE.Vector2(portal.x, portal.z)];
    const port = { x: ut.x, w: 2.2 };

    // Kirkegården: gress på en hylle, i samme høyde som gata, og kollider under det hele.
    const gx = (g.x0 + g.x1) / 2;
    const gzm = (g.z0 + g.z1) / 2;
    k.withTint({ top: 0.85, bottom: 0.85, hue: [0.95, 1, 0.9] }, () =>
        k.box('torv', gx, KIRKE_Y / 2 - 0.5, gzm, g.x1 - g.x0, KIRKE_Y + 1, g.z1 - g.z0, { skip: ['bottom', 'nz'] })
    );
    c.box(gx, KIRKE_Y - 0.75, gzm, g.x1 - g.x0, 1.5, g.z1 - g.z0);
    k.withTint({ top: 0.9, bottom: 0.9, hue: [0.97, 0.98, 0.96] }, () => {
        for (let i = 0; i + 1 < sti.length; i++) {
            const a = sti[i];
            const b = sti[i + 1];
            const len = a.distanceTo(b) + 1.2;
            k.at((a.x + b.x) / 2, KIRKE_Y, (a.y + b.y) / 2, Math.atan2(b.x - a.x, b.y - a.y), () => {
                // Heller i to rader, litt ujevne.
                for (let z = -len / 2 + 0.35; z < len / 2; z += 0.72) {
                    for (const x of [-0.42, 0.42]) k.box('stein', x + Math.sin(z * 7.3) * 0.04, 0.015, z, 0.78, 0.04, 0.66, { skip: ['bottom'] });
                }
            });
        }
    });
    // Muren rundt, med porten mot gata [S]. Muren står på gata foran og på bakken ellers.
    const murTop = KIRKE_Y + 0.95;
    const mur = (x0: number, z0: number, x1: number, z1: number) => {
        const cxm = (x0 + x1) / 2;
        const czm = (z0 + z1) / 2;
        const sx = Math.max(0.7, Math.abs(x1 - x0));
        const sz = Math.max(0.7, Math.abs(z1 - z0));
        k.withTint(STEIN, () => k.box('stein', cxm, (KIRKE_Y - 0.4 + murTop) / 2, czm, sx, murTop - KIRKE_Y + 0.4, sz, { skip: ['bottom'], shadeFoot: true }));
        k.withTint(LIST, () => k.box('stein', cxm, murTop + 0.05, czm, sx + 0.1, 0.1, sz + 0.1));
        c.box(cxm, (KIRKE_Y - 0.4 + murTop) / 2 + 0.3, czm, sx, murTop - KIRKE_Y + 1.0, sz);
    };
    mur(g.x0, g.z0, port.x - port.w / 2, g.z0);
    mur(port.x + port.w / 2, g.z0, g.x1, g.z0);
    mur(g.x0, g.z0, g.x0, g.z1);
    mur(g.x1, g.z0, g.x1, g.z1);
    mur(g.x0, g.z1, g.x1, g.z1);
    // Portstolpene og grinda, som står åpen inn mot kirkegården.
    for (const s of [-1, 1]) {
        const x = port.x + s * (port.w / 2 + 0.1);
        k.withTint(LIST, () => k.box('stein', x, KIRKE_Y + 0.7, g.z0, 0.5, 1.8, 0.8, { skip: ['bottom'] }));
        k.at(port.x + s * (port.w / 2 - 0.05), KIRKE_Y, g.z0 + 0.1, s * 1.9, () => {
            k.withTint({ top: 0.8, bottom: 0.8, hue: [1.04, 0.98, 0.9] }, () => {
                for (let x2 = 0.1; x2 < port.w / 2; x2 += 0.2) k.box('raatre', -s * x2, 0.75, 0, 0.1, 1.3, 0.05);
                for (const y of [0.35, 1.15]) k.box('raatre', (-s * port.w) / 4, y, 0, port.w / 2, 0.1, 0.06);
            });
            c.box((-s * port.w) / 4, 0.75, 0, port.w / 2, 1.3, 0.1, true);
        }, c);
    }

    // Trekors på gravene: lave, skeive, i rader på sørsida av kirken, unna stien [S].
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    k.withTint({ top: 0.6, bottom: 0.6 }, () => {
        for (let i = 0; i < 40; i++) {
            const along = -16 + (i % 10) * 3.6 + r() * 1.2;
            const out = 12.5 + Math.floor(i / 10) * 2.8 + r();
            // Sørsida er kirkens −x: i verden (−cos, sin) ganger avstanden ut.
            const x = cx - Math.cos(ROT) * out + Math.sin(ROT) * along;
            const z = cz + Math.sin(ROT) * out + Math.cos(ROT) * along;
            if (z < g.z0 + 1.5 || x < g.x0 + 1 || x > g.x1 - 1 || z > g.z1 - 1) continue;
            if (Math.min(avstand(x, z, sti[0], sti[1]), avstand(x, z, sti[1], sti[2])) < 1.8) continue;
            const tilt = (r() - 0.5) * 0.2;
            const yaw = ROT + (r() - 0.5) * 0.4;
            k.at(x, KIRKE_Y, z, yaw, () => {
                k.slab('raatre', new THREE.Matrix4().makeRotationZ(tilt).setPosition(0, 0.55, 0), 0.1, 1.1, 0.08);
                k.slab('raatre', new THREE.Matrix4().makeRotationZ(tilt).setPosition(0, 0.75, 0), 0.6, 0.09, 0.07);
            });
            c.matrix = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, KIRKE_Y, z);
            c.box(0, 0.55, 0, 0.5, 1.1, 0.15, true);
            c.matrix = new THREE.Matrix4();
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
    // Innredningen: skjules på avstand og kaster ikke skygge (streaming.ts, `inne`).
    const rom = new THREE.Group();
    rom.name = 'mariakirken:inne';
    for (const [key, b] of ki.buckets) {
        const mesh = new THREE.Mesh(b.toGeometry(), mats.get(key));
        mesh.name = `mariakirken:inne:${key}`;
        mesh.receiveShadow = true;
        rom.add(mesh);
    }
    const flat = new THREE.Mesh(kl.bucket('mork').toGeometry(), mats.lodMaterial());
    flat.name = 'mariakirken:duker';
    // Flammene lyser selv: et eget materiale uten lys, som cella eier og kaster.
    const flammeMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    const flammer = new THREE.Mesh(kf.bucket('mork').toGeometry(), flammeMat);
    flammer.name = 'mariakirken:flammer';
    rom.add(flat, flammer);
    near.add(rom);

    const mid = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.tynnTake('lod'));
    mid.name = 'mariakirken:lod';

    // Rommet står skjevt som kirken: boksen gjelder rundt midten, dreid med kirken (streaming.ts, `iRom`).
    const midt = iVerden(inne.rom.getCenter(new THREE.Vector3()));
    const halv = inne.rom.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const folk = await lagFolk(inne.folk.map((p) => ({ ...p, pos: iVerden(p.pos), yaw: p.yaw + ROT })), mats, 1408);
    near.add(folk.group);
    return {
        near, mid, inne: [rom], colliders: [...c.specs, ...folk.colliders],
        rom: [{ box: new THREE.Box3(midt.clone().sub(halv), midt.clone().add(halv)), demp: 0.7, yaw: ROT }],
        ild: inne.ild.map(iVerden),
        snakkbare: folk.snakkbare,
        tick: folk.tick,
        dispose: () => {
            folk.dispose();
            flammeMat.dispose();
        },
    };
}
