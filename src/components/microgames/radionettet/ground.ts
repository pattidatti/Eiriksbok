import * as THREE from 'three';
import { MAP_D, MAP_W, FLYPLASS, type SlagDef } from './levels';
import type { Look } from './models';

// Høyden i landskapet og skyskyggene (bakken selv: terrain.tsx, pynten på brettet: relief.tsx).
// Brettet er flatt, så enhetene står stødig; utenfor bølger det i åser og sanddyner.

const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/** Havet ved Dunkerque: venstre øverst, samme strandlinje som malingen i terrain.tsx. */
/** Havet ved kysten (ikke når slaget har en elv i stedet). */
export const isSea = (look: Look, x: number, z: number, elv?: [number, number]) => look === 'kyst' && !elv && x < -1.2 && z < 6;
export const WATER_Y = -0.012;

/** Bakken dekker kartet pluss en kant rundt (utenfor den: et flatt skjørt i terrain.tsx). */
export const X0 = -7;
/** Skjørtet utenfor bakken ligger under elveleiet og havbunnen. */
export const SKIRT_Y = -0.45;
export const Z0 = -5;
export const GW = MAP_W + 14;
export const GD = MAP_D + 10;

export function heightAt(look: Look, x: number, z: number, elv?: [number, number]) {
    const dx = Math.max(-x - 0.5, x - MAP_W - 0.5, 0);
    const dz = Math.max(-z - 0.5, z - MAP_D - 0.5, 0);
    let ramp = smooth(0, 2.8, Math.hypot(dx, dz));
    // Flyplassen er flat, og kanten nærmest kameraet holdes lav så den ikke skjuler brettet.
    const [fx, fz] = FLYPLASS;
    const ax = Math.max(fx - 1.4 - x, x - fx - 2.2, 0);
    const az = Math.max(fz - 2.8 - z, z - fz - 1.2, 0);
    ramp *= smooth(0, 1.4, Math.hypot(ax, az));
    if (z > MAP_D) ramp *= 0.55;
    // Ytterst skrår bakken ned til skjørtet (SKIRT_Y), så det ikke blir noen kant.
    const edge = smooth(0, 1.6, Math.min(x - X0, X0 + GW - x, z - Z0, Z0 + GD - z));
    let h: number;
    if (look === 'ørken') {
        // Sanddyner: skarpe rygger med slak side mot vinden.
        const r = Math.abs(Math.sin(x * 0.42 + z * 0.23 + 0.7));
        h = (1 - r) ** 2 * 0.9 + Math.sin(x * 1.1 - z * 0.6) * 0.12 + 0.2;
    } else {
        h = 0.5 + 0.35 * Math.sin(x * 0.52 + 1.3) * Math.cos(z * 0.66 - 0.4) + 0.18 * Math.sin(x * 1.25 + z * 0.9);
        if (look !== 'kyst') h += 0.25 * Math.sin(z * 0.35 + x * 0.1);
    }
    h *= ramp * (look === 'steppe' ? 1.25 : look === 'vinter' ? 1.4 : look === 'kyst' ? 0.95 : 1.05);
    if (elv) {
        // Elveleiet: bredden heller ned mot vannet, også inne på brettet.
        const mid = (elv[0] + elv[1]) / 2;
        const half = (elv[1] - elv[0]) / 2;
        const k = 1 - smooth(half - 0.1, half + 0.5, Math.abs(x - mid));
        h = h * (1 - k) - 0.28 * k;
    }
    if (look === 'kyst' && !elv) {
        // Stranda heller ned i havet.
        const sea = smooth(-0.9, -2.4, x) * (1 - smooth(5.2, 6.8, z));
        h = h * (1 - sea) - 0.3 * sea;
    }
    return h * edge + SKIRT_Y * (1 - edge);
}

/** Bakken som geometri med høyder, i verdensretning (ikke rotert). */
export function groundGeometry(look: Look, x0: number, z0: number, w: number, d: number, per: number, elv?: [number, number]) {
    const g = new THREE.PlaneGeometry(w, d, Math.round(w * per), Math.round(d * per));
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) + x0 + w / 2;
        const z = pos.getZ(i) + z0 + d / 2;
        pos.setY(i, heightAt(look, x, z, elv));
    }
    g.computeVertexNormals();
    return g;
}

/** Skyskygger som driver over bakken. Styrken per slag: overskyet kyst, klar ørken. */
const CLOUDS: Record<Look, number> = { kyst: 0.3, ørken: 0.1, steppe: 0.22, vinter: 0.2 };

export function withClouds(mat: THREE.MeshStandardMaterial, look: Look) {
    mat.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = CLOCK;
        sh.uniforms.uCloud = { value: CLOUDS[look] };
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec2 vWxz;')
            .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWxz = (modelMatrix * vec4(transformed, 1.0)).xz;');
        sh.fragmentShader = sh.fragmentShader
            .replace(
                '#include <common>',
                `#include <common>
varying vec2 vWxz;
uniform float uTime;
uniform float uCloud;
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y);
}`
            )
            .replace(
                '#include <map_fragment>',
                `#include <map_fragment>
vec2 cp = vWxz * 0.16 + vec2(uTime * 0.035, uTime * 0.018);
float cl = vn(cp) * 0.6 + vn(cp * 2.3) * 0.3 + vn(cp * 5.1) * 0.1;
diffuseColor.rgb *= 1.0 - uCloud * smoothstep(0.45, 0.72, cl);`
            );
    };
    mat.customProgramCacheKey = () => `rn-clouds-${look}`;
    return mat;
}

/** Fast tilfeldighet per slag. */
export function seeded(seed: number) {
    let s = seed;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** Kratrene på brettet: malt i bakken (terrain.tsx) og med voll i 3D (her). */
export function craterSpots(def: SlagDef, look: Look): [number, number, number][] {
    const rnd = seeded(def.id.length * 313 + 29);
    const n = look === 'kyst' ? 10 : 22;
    const out: [number, number, number][] = Array.from({ length: n }, () => [rnd() * MAP_W, rnd() * MAP_D, 0.14 + rnd() * 0.2]);
    // Ingen kratre i elva.
    return def.elv ? out.filter(([x]) => x < def.elv![0] - 0.4 || x > def.elv![1] + 0.4) : out;
}

/** Klokka til skyene og bølgene (driver i useFrame). */
export const CLOCK = { value: 0 };
