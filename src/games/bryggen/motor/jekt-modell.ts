// Jekta: lasteskipet som førte tørrfisken fra nord til Bergen [V blueprint §4.3, SNL «jekt»].
//
// Det vi vet [V SNL «jekt»]: klinkbygd og flatbunnet, enkel rigg med ett råseil, brukt fra
// middelalderen til langt inn på 1900-tallet. Lasten var tørrfisk sørover og korn nordover, og
// fisken kunne ligge så høyt at den nådde opp mot masta. Akter hadde jekta en plattform med tak
// over, vengen. Det SNL forteller om mål og innredning, gjelder senere århundrer: de eldste jektene
// var rundt 30 fot, de største på 1800-tallet over 70 fot [V]. Hvordan en jekt i 1420-årene så ut,
// er usikkert [U]; vengen er tatt med fra de senere jektene [U]. Denne er ca. 15 m [S].
//
// Lasten: tørrfisk presset i bunter og surret med tau, stablet i en haug midtskips over ripa [S].
// Buntene er enklere enn i bua (en kloss med haler i endene): de sees fra Vågen, ikke på nært hold.
import * as THREE from 'three';
import type { MeshKit, Tint } from './meshkit';
import { V3, dekk, hoyder, mast, raa, ror, skrog, stavner, vant, vedHoyde, type SkrogSpec } from './skrog';
import type { SkipInfo } from './kogge-modell';

export function jektSpec(skala: number): SkrogSpec {
    return {
        L: 7.6 * skala,
        B: 2.7 * skala,
        bunn: 1.9 * skala,
        dyp: 1.05,
        ripe: 1.25,
        spring: 0.95 * skala,
        rakeF: 1.7 * skala,
        rakeA: 1.3 * skala,
        rund: true,
        fyldig: 2.0,
        bord: 8,
        stavnOver: 0.75,
    };
}

const BORD: Tint = { top: 0.62, bottom: 0.42, hue: [1.02, 0.94, 0.84] };
const INNE: Tint = { top: 0.8, bottom: 0.6, hue: [1.05, 0.97, 0.88] };
const DEKK: Tint = { top: 1.05, bottom: 1.05, hue: [1.02, 0.98, 0.92] };
const LYST: Tint = { top: 1.0, bottom: 1.0, hue: [1.04, 0.98, 0.9] };
/** Tørrfisk: samme lyse gråbrune som i bua. */
const FISK: Tint = { top: 1.45, bottom: 1.15, hue: [1.02, 0.98, 0.86] };
const HAMP: Tint = { top: 1.1, bottom: 0.9, hue: [1.12, 1.02, 0.8] };

/** Enkel tilfeldighet med frø, så hver jekt får sin egen haug. */
function trekker(s: number): () => number {
    let a = s >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Én bunt tørrfisk (0,62 x 0,36 x 0,42 m), langs x: kjernen, to tau rundt, og halene som stikker
 * ut i begge ender.
 */
function bunt(k: MeshKit, x: number, y: number, z: number, rot: number, r: () => number, ender: number[]): void {
    k.at(x, y, z, rot, () => {
        const tone = 0.85 + r() * 0.3;
        k.withUv(0.04, () => {
            // Kjernen er kortere enn bunten: resten er halene. Toppen bukter seg litt.
            k.withTint({ top: FISK.top * tone, bottom: FISK.bottom * tone * 0.75, hue: FISK.hue }, () => {
                k.box('raatre', 0, 0.17, 0, 0.4, 0.34, 0.42, { skip: ['bottom'], shadeFoot: true });
                k.box('raatre', (r() - 0.5) * 0.1, 0.355, 0, 0.3, 0.04, 0.36, { skip: ['bottom'] });
            });
            // Halene: vifter i begge ender, tre rader i tre høyder, litt bøyd opp og hver sin vei.
            k.withTint(FISK, () => {
                for (const e of ender) {
                    for (let i = 0; i < 3; i++) {
                        for (let j = 0; j < 3; j++) {
                            const yy = 0.06 + i * 0.11 + (r() - 0.5) * 0.03;
                            const zz = (j - 1) * 0.13 + (r() - 0.5) * 0.05;
                            const s = (0.75 + r() * 0.25) * tone;
                            const len = 0.13 + r() * 0.07;
                            const tz = (r() - 0.5) * 0.06;
                            const a = V3(e * 0.18, yy, zz - 0.03);
                            const a2 = V3(e * 0.18, yy, zz + 0.03);
                            const b = V3(e * (0.2 + len), yy + 0.03 + r() * 0.03, zz + tz - 0.07);
                            const c = V3(e * (0.2 + len), yy + 0.03 + r() * 0.03, zz + tz + 0.07);
                            for (const [p, q, w] of [[a, b, c], [a, c, a2]] as const) {
                                k.tri('raatre', p, q, w, [0, 0], [0.1, 0], [0, 0.1], [s * 0.85, s, s]);
                                k.tri('raatre', p, w, q, [0, 0], [0, 0.1], [0.1, 0], [s * 0.85, s, s]);
                            }
                        }
                    }
                }
            });
        });
        k.withTint(HAMP, () => {
            for (const dx of [-0.11, 0.11]) k.box('raatre', dx, 0.18, 0, 0.035, 0.37, 0.43, { skip: ['bottom'] });
        });
    });
}

/**
 * Haugen med tørrfisk midtskips: lag på lag med bunter, hvert lag litt smalere, og bare så bredt
 * som skroget er i den høyden. `lag` er hvor mange lag over tiljene.
 */
function last(k: MeshKit, sp: SkrogSpec, z0: number, z1: number, gulv: number, lag: number, mastZ: number, r: () => number): void {
    const BH = 0.36;
    for (let l = 0; l < lag; l++) {
        const y = gulv + l * BH;
        const inn = l * 0.28;
        const za = z0 + inn * 1.2;
        const zb = z1 - inn * 1.2;
        const nz = Math.max(0, Math.ceil((zb - 0.2 - (za + 0.25)) / 0.46));
        for (let zi = 0; zi < nz; zi++) {
            const z = za + 0.25 + zi * 0.46;
            const u = z / sp.L;
            // Under ripa: så bredt som skroget i den høyden. Over: som ved ripa, minus innrykket.
            const yy = Math.min(y + BH, hoyder(sp, u).ripe - 0.05);
            const v = vedHoyde(sp, u, yy);
            if (!v) continue;
            const halv = Math.min(v.x - 0.08, sp.B - 0.3) - Math.max(0, inn - 0.2);
            if (halv < 0.4) continue;
            const n = Math.floor((halv * 2) / 0.66);
            if (n < 1) continue;
            const x0 = -(n * 0.66) / 2 + 0.33;
            for (let i = 0; i < n; i++) {
                const x = x0 + i * 0.66;
                // Rundt masta er det fritt.
                if (Math.abs(z - mastZ) < 0.45 && Math.abs(x) < 0.5) continue;
                // Øverst er haugen ujevn: noen bunter mangler.
                if (l === lag - 1 && r() < 0.35) continue;
                // Dypt i haugen (to lag eller mer under toppen) synes bare ringen ytterst.
                if (l < lag - 2 && i > 0 && i < n - 1 && zi > 0 && zi < nz - 1) continue;
                // Halene synes bare på buntene ytterst i raden (inne i haugen er de skjult).
                const ender = n === 1 ? [-1, 1] : i === 0 ? [-1] : i === n - 1 ? [1] : [];
                bunt(k, x + (r() - 0.5) * 0.08, y + r() * 0.03, z + (r() - 0.5) * 0.06, (r() - 0.5) * 0.3, r, ender);
            }
        }
    }
}

/** Vengen: plattformen akter med et lite hus med saltak over [U, se toppen av fila]. */
function veng(k: MeshKit, sp: SkrogSpec, zFra: number): void {
    const uA = zFra / sp.L;
    const y = hoyder(sp, uA).ripe - 0.2;
    dekk(k, sp, y, -0.97, uA, DEKK);
    const v = vedHoyde(sp, uA, y);
    if (!v) return;
    const hw = Math.min(1.05, v.x - 0.3);
    const z0 = zFra - 2.0;
    const z1 = zFra - 0.25;
    const zm = (z0 + z1) / 2;
    const h = 1.25;
    k.withTint(BORD, () => {
        k.box('raatre', 0, y + h / 2, z1, hw * 2, h, 0.08); // framveggen
        k.box('raatre', -hw, y + h / 2, zm, 0.08, h, z1 - z0);
        k.box('raatre', hw, y + h / 2, zm, 0.08, h, z1 - z0);
        k.box('raatre', 0, y + h / 2, z0, hw * 2, h, 0.08);
    });
    k.withTint({ top: 1, bottom: 1 }, () => k.box('mork', 0.2, y + 0.55, z1 + 0.045, 0.6, 1.0, 0.02));
    // Saltaket: to bordplater fra mønet ned over veggene.
    k.withTint({ top: 0.75, bottom: 0.75, hue: [1.0, 0.95, 0.88] }, () => {
        for (const s of [-1, 1]) {
            const ang = s * 0.55;
            const m = new THREE.Matrix4().makeRotationZ(-ang).setPosition(s * (hw * 0.5 + 0.05), y + h + 0.32, zm);
            k.slab('raatre', m, hw * 1.25, 0.06, z1 - z0 + 0.35, { grain: 'z' });
        }
    });
}

/** Bygger en jekt i `k`. `last` 0-1 er hvor mye fisk som ligger igjen; `seed` gir haugen. */
export function lagJekt(k: MeshKit, sp: SkrogSpec, lastMengde: number, seed: number): SkipInfo {
    const r = trekker(seed);
    skrog(k, sp, BORD, INNE, 2);
    stavner(k, sp, 0.13, BORD);
    // Tiljene: litt over vannflata, ellers synes Vågen inne i skipet.
    const gulv = 0.12;
    dekk(k, sp, gulv, -0.9, 0.9, INNE);
    // Lite dekk forut og vengen akter.
    const zF = sp.L * 0.72;
    dekk(k, sp, hoyder(sp, zF / sp.L).ripe - 0.25, zF / sp.L, 0.97, DEKK);
    veng(k, sp, -sp.L * 0.6);
    // Tofter (bjelker på tvers) som holder sidene.
    k.withTint(LYST, () => {
        for (const z of [-sp.L * 0.45, sp.L * 0.5]) {
            const y = hoyder(sp, z / sp.L).ripe - 0.3;
            const v = vedHoyde(sp, z / sp.L, y);
            if (v) k.box('raatre', 0, y, z, v.x * 2, 0.16, 0.24);
        }
    });

    const mastZ = sp.L * 0.06;
    const lag = Math.max(1, Math.round(lastMengde * 8));
    last(k, sp, -sp.L * 0.42, sp.L * 0.5, gulv, lag, mastZ, r);

    const mh = 12.5 * (sp.L / 7.6);
    mast(k, V3(0, gulv, mastZ), mh, 0.24, 0.12, LYST);
    raa(k, mastZ + 0.28, mh - 2.1, sp.B * 2.1, LYST, 0.34);
    vant(k, sp, mastZ, mh - 1.4, 2, 0.9);
    ror(k, sp, 0.95, BORD);

    const fortoy: THREE.Vector3[] = [];
    for (const z of [-sp.L * 0.55, sp.L * 0.62]) {
        const v = vedHoyde(sp, z / sp.L, hoyder(sp, z / sp.L).ripe - 0.05);
        if (v) fortoy.push(V3(v.x - 0.08, hoyder(sp, z / sp.L).ripe + 0.08, z));
    }
    const baug = V3(0, hoyder(sp, 1).ripe - 0.1, sp.L - 0.2);
    return { fortoy, baug };
}
