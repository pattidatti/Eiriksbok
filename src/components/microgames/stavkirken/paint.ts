import * as THREE from 'three';
import { PANELS, type PanelDef } from './model';

// Male-systemet: hver flate er et rutenett av celler med tjære (0-1), råte (0-1)
// og brann (0-1). Været tærer tjæra flekkvis (hver celle har sin egen
// «sårbarhet» fra et støyfelt), bar ved begynner å råtne, og råte sprer seg til
// naboene. Eleven maler med penselen og ser tjæra legge seg i sanntid.
//
// Cellene tegnes som små DataTexture-er med lineær filtrering: da blir flekkene
// myke, og penselstrøkene ser malte ut - ikke pikslete.

export const CELL = 0.2; // cellestørrelse i verdensenheter

export interface Grid {
    def: PanelDef;
    w: number;
    h: number;
    tar: Float32Array;
    rot: Float32Array;
    fire: Float32Array;
    char: Float32Array; // svidd - varig mørkere spor etter brann
    vuln: Float32Array; // cellas sårbarhet (fast støyfelt)
    color: THREE.DataTexture;
    rough: THREE.DataTexture;
    glow: THREE.DataTexture;
    // Oppsummert per tick:
    tarCover: number;
    rotCover: number;
    burning: number;
    dirty: boolean;
}

function valueNoise(seed: number) {
    // Liten deterministisk gradientfri støy: sum av sinuser med tilfeldige faser.
    let s = seed >>> 0;
    const r = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
    const f = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28];
    return (x: number, y: number) =>
        0.5 +
        0.25 * Math.sin(x * 1.3 + f[0]) * Math.cos(y * 1.1 + f[1]) +
        0.18 * Math.sin(x * 2.9 + y * 2.3 + f[2]) +
        0.07 * Math.sin(x * 6.1 - y * 5.3 + f[3]);
}

function dataTex(w: number, h: number, srgb: boolean) {
    const t = new THREE.DataTexture(new Uint8Array(w * h * 4), w, h, THREE.RGBAFormat);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
}

export function makeGrids(): Grid[] {
    return PANELS.map((def, pi) => {
        const w = Math.max(4, Math.round(def.size[0] / CELL));
        const h = Math.max(4, Math.round(def.size[1] / CELL));
        const n = w * h;
        const noise = valueNoise(pi * 97 + 13);
        const vuln = new Float32Array(n);
        for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) vuln[y * w + x] = Math.max(0.05, noise(x * CELL, y * CELL));
        const g: Grid = {
            def,
            w,
            h,
            tar: new Float32Array(n).fill(1),
            rot: new Float32Array(n),
            fire: new Float32Array(n),
            char: new Float32Array(n),
            vuln,
            color: dataTex(w, h, true),
            rough: dataTex(w, h, false),
            glow: dataTex(w, h, true),
            tarCover: 1,
            rotCover: 0,
            burning: 0,
            dirty: true,
        };
        return g;
    });
}

/** Nullstill til nybygd kirke (litt ujevn tjære fra start). */
export function resetGrids(grids: Grid[]) {
    for (const g of grids) {
        for (let i = 0; i < g.tar.length; i++) {
            // Sårbare flekker starter nesten slitt, så det er noe å male med en gang.
            g.tar[i] = Math.min(1, 0.45 + 0.75 * (1 - g.vuln[i]));
            g.rot[i] = 0;
            g.fire[i] = 0;
            g.char[i] = 0;
        }
        g.dirty = true;
    }
}

/** Ett simuleringssteg for én flate. Returnerer antall celler som tok fyr fra naboen. */
export function stepGrid(g: Grid, dt: number, rate: number) {
    const { w, h, tar, rot, fire, char, vuln } = g;
    let tarSum = 0;
    let rotSum = 0;
    let burning = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = y * w + x;
            // Været: sårbare celler går først, så slitasjen blir flekkvis.
            tar[i] = Math.max(0, tar[i] - dt * rate * (0.25 + 1.5 * vuln[i] * vuln[i]));
            // Bar ved råtner. Råte sprer seg til naboer som også er bare.
            if (tar[i] < 0.15) {
                let nb = 0;
                if (x > 0) nb = Math.max(nb, rot[i - 1]);
                if (x < w - 1) nb = Math.max(nb, rot[i + 1]);
                if (y > 0) nb = Math.max(nb, rot[i - w]);
                if (y < h - 1) nb = Math.max(nb, rot[i + w]);
                rot[i] = Math.min(1, rot[i] + dt * (0.035 * vuln[i] + 0.12 * nb));
            }
            // Brann: vokser, brenner bort tjære og råte, og smitter naboene.
            if (fire[i] > 0) {
                burning++;
                fire[i] = Math.min(1, fire[i] + dt * 0.35);
                tar[i] = Math.max(0, tar[i] - dt * 1.2);
                char[i] = Math.min(1, char[i] + dt * 0.5);
                // Når veden er brent gjennom, dør flammen - og etterlater bar, svidd ved.
                if (char[i] >= 1) fire[i] = 0;
                if (fire[i] > 0.6 && Math.random() < dt * 1.4) {
                    const nx = x + Math.round(Math.random() * 2 - 1);
                    const ny = y + Math.round(Math.random() * 2 - 1);
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h && fire[ny * w + nx] === 0) fire[ny * w + nx] = 0.1;
                }
            }
            tarSum += tar[i] > 0.35 ? 1 : 0;
            rotSum += rot[i] > 0.5 ? 1 : 0;
        }
    }
    const n = w * h;
    g.tarCover = tarSum / n;
    g.rotCover = rotSum / n;
    g.burning = burning / n;
    g.dirty = true;
}

/** Tenn en flekk på flaten (lynnedslag). */
export function ignite(g: Grid, u: number, v: number) {
    const cx = Math.floor(u * g.w);
    const cy = Math.floor(v * g.h);
    for (let y = cy - 1; y <= cy + 1; y++)
        for (let x = cx - 1; x <= cx + 1; x++)
            if (x >= 0 && x < g.w && y >= 0 && y < g.h) g.fire[y * g.w + x] = 0.3;
}

export interface PaintResult {
    /** Hvor mye tjære som faktisk ble lagt på (summert over celler). */
    added: number;
    /** Hvor mye slitt ved som ble dekket (belønnes). */
    restored: number;
    scraped: number;
    doused: number;
}

/**
 * Mal med penselen på (u, v). `budget` er hvor mye tjære penselen har igjen i
 * denne dukkerten; returnerer hva som ble brukt. Over brann slokker penselen i
 * stedet (vannbøtta), uten å bruke tjære.
 */
export function paint(g: Grid, u: number, v: number, radius: number, strength: number, budget: number): PaintResult {
    const res: PaintResult = { added: 0, restored: 0, scraped: 0, doused: 0 };
    const cx = u * g.w;
    const cy = v * g.h;
    const r = radius / CELL;
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(g.w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(g.h - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
            if (d > 1) continue;
            const i = y * g.w + x;
            const k = strength * (1 - d * d);
            if (g.fire[i] > 0) {
                g.fire[i] = Math.max(0, g.fire[i] - k * 2.5);
                res.doused += k;
                continue;
            }
            // Råte må skrapes bort før tjæra fester seg.
            if (g.rot[i] > 0.05) {
                const s = Math.min(g.rot[i], k * 0.6);
                g.rot[i] -= s;
                res.scraped += s;
                if (g.rot[i] > 0.25) continue;
            }
            if (budget - res.added <= 0) continue;
            const add = Math.min(1 - g.tar[i], k, budget - res.added);
            if (add <= 0) continue;
            res.restored += add * (1 - g.tar[i]);
            g.tar[i] += add;
            // Ny tjære dekker også sviemerkene.
            g.char[i] = Math.max(0, g.char[i] - add * 0.8);
            res.added += add;
        }
    }
    if (res.added > 0 || res.scraped > 0 || res.doused > 0) g.dirty = true;
    return res;
}

// Fargene: slitt, sølvgrått tre -> tjæresvart. Råte er mosegrønt. Svidd er kull.
const WORN: [number, number, number] = [196, 182, 154];
const TAR: [number, number, number] = [38, 26, 17];
const ROT: [number, number, number] = [86, 101, 47];
const CHAR: [number, number, number] = [30, 26, 24];

const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/** Skriv cellene til teksturene. `wet` gjør bar ved mørkere og tjæra blankere. */
export function writeTextures(g: Grid, wet: number, t: number) {
    if (!g.dirty) return;
    const c = g.color.image.data as Uint8Array;
    const r = g.rough.image.data as Uint8Array;
    const e = g.glow.image.data as Uint8Array;
    for (let i = 0; i < g.tar.length; i++) {
        const tt = smooth(0.12, 0.7, g.tar[i]);
        const ro = smooth(0.2, 0.8, g.rot[i]);
        const ch = g.char[i];
        const wd = 1 - wet * 0.25 * (1 - tt);
        let R = (WORN[0] * wd * (1 - tt) + TAR[0] * tt) * (1 - ro) + ROT[0] * ro;
        let G = (WORN[1] * wd * (1 - tt) + TAR[1] * tt) * (1 - ro) + ROT[1] * ro;
        let B = (WORN[2] * wd * (1 - tt) + TAR[2] * tt) * (1 - ro) + ROT[2] * ro;
        R = R * (1 - ch) + CHAR[0] * ch;
        G = G * (1 - ch) + CHAR[1] * ch;
        B = B * (1 - ch) + CHAR[2] * ch;
        const o = i * 4;
        c[o] = R;
        c[o + 1] = G;
        c[o + 2] = B;
        c[o + 3] = 255;
        // Ruhet i grønn kanal (three leser G): fersk tjære er blank.
        const rough = 0.95 - tt * 0.72 * (0.7 + 0.3 * wet) + ro * 0.2;
        r[o] = 0;
        r[o + 1] = Math.max(0, Math.min(255, rough * 255));
        r[o + 2] = 0;
        r[o + 3] = 255;
        // Glød fra brann (bloom tar resten).
        const f = g.fire[i];
        const flick = f > 0 ? 0.75 + 0.25 * Math.sin(t * 19 + i * 1.7) : 0;
        e[o] = Math.min(255, f * 255 * flick);
        e[o + 1] = Math.min(255, f * 120 * flick);
        e[o + 2] = Math.min(255, f * 20 * flick);
        e[o + 3] = 255;
    }
    g.color.needsUpdate = true;
    g.rough.needsUpdate = true;
    g.glow.needsUpdate = true;
    g.dirty = false;
}
