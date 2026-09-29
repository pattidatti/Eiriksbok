import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mergeParts, type Part } from '../kit/mergeParts';
import { PAL } from './geo';

// Looken fra mongolinvasjonsrullen (Mōko Shūrai Ekotoba, 1293): tusjkontur rundt
// alt som betyr noe, flate mineralfarger, bølgelinjer tegnet med pensel og gyldne
// skybånd. Alt her lages én gang (lat) og deles - billig på en Chromebook.

// ---------------------------------------------------------------------------
// Tusjkonturen: et omvendt skall som skyves ut langs glatte normaler
// ---------------------------------------------------------------------------

const outlineCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

/** Geometri med sammensveisede hjørner og glatte normaler, så skallet ikke sprekker. */
export function outlineGeo(geo: THREE.BufferGeometry): THREE.BufferGeometry {
    const hit = outlineCache.get(geo);
    if (hit) return hit;
    let g = geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
    g = mergeVertices(g, 1e-3);
    g.computeVertexNormals();
    outlineCache.set(geo, g);
    return g;
}

const inkCache = new Map<string, THREE.MeshBasicMaterial>();

/** Tusjstrek rundt en figur. `width` i meter (skallet skyves så langt ut). */
export function inkMaterial(width = 0.035, color: string = PAL.ink): THREE.MeshBasicMaterial {
    const key = `${width}-${color}`;
    const hit = inkCache.get(key);
    if (hit) return hit;
    const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
    m.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>\ntransformed += normalize(normal) * ${width.toFixed(4)};`
        );
    };
    m.customProgramCacheKey = () => `ink-${width}`;
    inkCache.set(key, m);
    return m;
}

let _ramp: THREE.DataTexture | null = null;
/** Tre lyse trinn: rullen har nesten ingen skygge, bare litt form. */
function scrollRamp(): THREE.DataTexture {
    if (_ramp) return _ramp;
    const steps = new Uint8Array([165, 215, 255]);
    const t = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    _ramp = t;
    return t;
}

let _toon: THREE.MeshToonMaterial | null = null;
/** Flat farge i få trinn: rullens mineralfarger med litt form. */
export function toonVC(): THREE.MeshToonMaterial {
    if (!_toon) _toon = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: scrollRamp() });
    return _toon;
}

// ---------------------------------------------------------------------------
// Teksturer tegnet på canvas ved oppstart
// ---------------------------------------------------------------------------

function canvas(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return [c, c.getContext('2d')!] as const;
}

function rng(seed: number) {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function repeatTex(c: HTMLCanvasElement) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}

let _wave: THREE.CanvasTexture | null = null;
/** Havet som i rullen: blek seladon med krøllete bølgelinjer i tusj og hvite skumtopper. */
export function waveTexture(): THREE.CanvasTexture {
    if (_wave) return _wave;
    const [c, ctx] = canvas(512, 512);
    ctx.fillStyle = '#a3c0b1';
    ctx.fillRect(0, 0, 512, 512);
    const r = rng(11);
    for (let y = 0; y < 512; y += 64) {
        ctx.fillStyle = 'rgba(47,90,110,0.07)';
        ctx.fillRect(0, y, 512, 30);
    }
    ctx.lineCap = 'round';
    for (let row = 0; row < 16; row++) {
        const y = row * 32 + 14;
        for (let col = 0; col < 8; col++) {
            const x = col * 64 + (row % 2) * 32 + (r() - 0.5) * 10;
            // Bølgekammen: en bue som krøller seg inn i en snirkel.
            ctx.strokeStyle = 'rgba(38,70,98,0.72)';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(x - 26, y + 6);
            ctx.quadraticCurveTo(x - 6, y - 12, x + 12, y - 2);
            ctx.arc(x + 8, y + 2, 5, -0.6, Math.PI * 1.2, false);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(250,247,236,0.9)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(x - 20, y + 2);
            ctx.quadraticCurveTo(x - 6, y - 9, x + 6, y - 5);
            ctx.stroke();
        }
    }
    _wave = repeatTex(c);
    return _wave;
}

let _sand: THREE.CanvasTexture | null = null;
/** Stranda: papirgul sand med tusjprikker. */
export function sandTexture(): THREE.CanvasTexture {
    if (_sand) return _sand;
    const [c, ctx] = canvas(256, 256);
    ctx.fillStyle = '#dcc79a';
    ctx.fillRect(0, 0, 256, 256);
    const r = rng(5);
    for (let i = 0; i < 260; i++) {
        ctx.fillStyle = `rgba(34,28,23,${0.1 + r() * 0.3})`;
        ctx.beginPath();
        ctx.arc(r() * 256, r() * 256, 0.6 + r() * 1.6, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.strokeStyle = 'rgba(34,28,23,0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
        const x = r() * 256;
        const y = r() * 256;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 8, y - 4, x + 18, y);
        ctx.stroke();
    }
    _sand = repeatTex(c);
    return _sand;
}

let _stone: THREE.CanvasTexture | null = null;
/** Muren: kløyvd stein i tusjstrek på varm grå. */
export function stoneTexture(): THREE.CanvasTexture {
    if (_stone) return _stone;
    const [c, ctx] = canvas(256, 256);
    ctx.fillStyle = '#a89c86';
    ctx.fillRect(0, 0, 256, 256);
    const r = rng(9);
    ctx.strokeStyle = 'rgba(34,28,23,0.7)';
    ctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 42) {
        let x = (y / 42) % 2 ? -30 : 0;
        while (x < 256) {
            const w = 50 + r() * 40;
            ctx.fillStyle = `rgb(${150 + r() * 30},${138 + r() * 26},${112 + r() * 20})`;
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, w - 4, 38, 8);
            ctx.fill();
            ctx.stroke();
            x += w;
        }
    }
    _stone = repeatTex(c);
    return _stone;
}

let _cloud: THREE.CanvasTexture | null = null;
/** Gullskya (kasumi) som deler rullen i scener: runde lober, gull med mørk kant. */
export function goldCloudTexture(): THREE.CanvasTexture {
    if (_cloud) return _cloud;
    const [c, ctx] = canvas(512, 128);
    const r = rng(3);
    const lobes: [number, number, number][] = [];
    for (let x = 40; x < 480; x += 34 + r() * 22) lobes.push([x, 64 + (r() - 0.5) * 22, 26 + r() * 16]);
    const path = () => {
        ctx.beginPath();
        for (const [x, y, rr] of lobes) {
            ctx.moveTo(x + rr, y);
            ctx.arc(x, y, rr, 0, Math.PI * 2);
        }
        ctx.rect(40, 50, 440, 28);
    };
    ctx.fillStyle = '#6b4d16';
    ctx.save();
    ctx.translate(0, 3);
    path();
    ctx.fill();
    ctx.restore();
    const gr = ctx.createLinearGradient(0, 20, 0, 110);
    gr.addColorStop(0, '#f0d27a');
    gr.addColorStop(1, '#c9a24a');
    ctx.fillStyle = gr;
    path();
    ctx.fill();
    for (let i = 0; i < 90; i++) {
        ctx.fillStyle = `rgba(255,244,200,${0.3 + r() * 0.5})`;
        ctx.fillRect(40 + r() * 440, 36 + r() * 56, 2, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    _cloud = t;
    return t;
}

let _grain: string | null = null;
/** Papirkorn som CSS-lag over hele spillvinduet (data-URL, lages én gang). */
export function paperGrainUrl(): string {
    if (_grain) return _grain;
    if (typeof document === 'undefined') return '';
    const [c, ctx] = canvas(160, 160);
    const img = ctx.createImageData(160, 160);
    const r = rng(21);
    for (let i = 0; i < img.data.length; i += 4) {
        const v = 180 + r() * 75;
        img.data[i] = v;
        img.data[i + 1] = v * 0.96;
        img.data[i + 2] = v * 0.86;
        img.data[i + 3] = 34;
    }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = 'rgba(120,96,60,0.08)';
    for (let i = 0; i < 40; i++) {
        const x = r() * 160;
        const y = r() * 160;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 12);
        ctx.stroke();
    }
    _grain = c.toDataURL();
    return _grain;
}

/**
 * mergeParts med fargene slik de står i kunstbriefen. Hjørnefarger går gjennom
 * sRGB->lineær i mergeParts og ble for mørke i denne scenen (rullens flate, lyse
 * mineralfarger ble brune). Her løftes de først, så de kommer ut som hex-verdien.
 */
export function mergeLit(parts: Part[]): THREE.BufferGeometry {
    return mergeParts(parts.map((p) => ({ ...p, color: new THREE.Color(p.color).convertLinearToSRGB() })));
}
