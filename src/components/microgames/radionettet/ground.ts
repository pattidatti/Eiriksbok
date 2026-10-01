import * as THREE from 'three';
import { MAP_D, MAP_W, FLYPLASS, type SlagDef } from './levels';
import { C, LOOK, type Look } from './models';

// Høyden i landskapet og skyskyggene (bakken selv: terrain.tsx, pynten på brettet: relief.tsx).
// Brettet har lave åser og søkk som enhetene kjører over (`lift`, `tilt`); utenfor bølger det
// høyere i åser og sanddyner. Ringer og ruter tegnes i bakkeshaderen (`MARKS`), så de følger bakken.

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

/** Hvor høye åsene inne på brettet er per slag. */
const INNER: Record<Look, number> = { kyst: 0.55, ørken: 0.5, steppe: 0.6, vinter: 0.55 };

/** Lave åser og søkk inne på brettet: slake nok til at vognene står, tydelige i sola. */
function inner(look: Look, x: number, z: number) {
    // Bare opp fra null: et søkk under null ville vist skjørtet under bakken.
    const f = 0.55 * Math.sin(x * 0.62 + z * 0.21 + 0.4) * Math.cos(z * 0.74 - 0.9) + 0.3 * Math.sin(x * 1.1 - z * 0.5 + 2.1) + 0.15 * Math.cos(x * 0.3 + z * 1.3);
    return INNER[look] * (0.5 + 0.5 * f);
}

export function heightAt(look: Look, x: number, z: number, elv?: [number, number]) {
    const dx = Math.max(-x - 0.5, x - MAP_W - 0.5, 0);
    const dz = Math.max(-z - 0.5, z - MAP_D - 0.5, 0);
    const out = smooth(0, 2.8, Math.hypot(dx, dz));
    // Flyplassen er flat, og kanten nærmest kameraet holdes lav så den ikke skjuler brettet.
    const [fx, fz] = FLYPLASS;
    const ax = Math.max(fx - 1.4 - x, x - fx - 2.2, 0);
    const az = Math.max(fz - 2.8 - z, z - fz - 1.2, 0);
    const flat = smooth(0, 1.4, Math.hypot(ax, az));
    let ramp = out * flat;
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
    // Åsene flater ut mot elva, så brua ligger plant mellom breddene.
    const calm = elv ? smooth((elv[1] - elv[0]) / 2 + 0.2, (elv[1] - elv[0]) / 2 + 1.6, Math.abs(x - (elv[0] + elv[1]) / 2)) : 1;
    h += inner(look, x, z) * (1 - out) * flat * calm;
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

/** Bakkehøyden under et punkt i slaget (enheter, fiender, effekter står her). */
export function lift(def: SlagDef, x: number, z: number) {
    const h = heightAt(LOOK[def.id] ?? 'kyst', x, z, def.elv);
    // Over elva går alt på brua (bakkeenheter kan ikke stå i vannet).
    return def.elv && x > def.elv[0] - 0.2 && x < def.elv[1] + 0.2 ? Math.max(h, 0) : h;
}

const UP = new THREE.Vector3(0, 1, 0);
const N = new THREE.Vector3();
/** Helningen under et punkt: kjøretøy og ringer legger seg etter bakken. */
export function tilt(def: SlagDef, x: number, z: number, q: THREE.Quaternion, k = 1) {
    const e = 0.25;
    const sx = (lift(def, x + e, z) - lift(def, x - e, z)) / (2 * e);
    const sz = (lift(def, x, z + e) - lift(def, x, z - e)) / (2 * e);
    return q.setFromUnitVectors(UP, N.set(-sx * k, 1, -sz * k).normalize());
}

/** Bakkemarkeringene, tegnet i bakkeshaderen så de ligger på åsene: radioringen rundt
 *  kommandovogna, stafett-ringene, gyldige ruter mens eleven holder et kort, og ruta under musa. */
const tiles = new THREE.DataTexture(new Uint8Array(MAP_W * MAP_D * 4), MAP_W, MAP_D);
tiles.magFilter = THREE.NearestFilter;
tiles.minFilter = THREE.NearestFilter;
export const MAX_RELAY = 16;
export const MARKS = {
    /** x, z, radius, synlig */
    uHq: { value: new THREE.Vector4() },
    uRelay: { value: Array.from({ length: MAX_RELAY }, () => new THREE.Vector4()) },
    uRelayN: { value: 0 },
    /** Per rute: r = radioen når hit, g = bare fallskjermsoldater, b = en lik enhet å slå sammen med. */
    uTiles: { value: tiles },
    uTileOn: { value: 0 },
    /** x, z, gyldig, synlig */
    uGhost: { value: new THREE.Vector4() },
    /** Radiofargen (samme som linjene). */
    uRadio: { value: new THREE.Color(C.radio) },
    /** Ordrene (orders.ts). Siktet under musa: x, z, radius, type (1 sirkel, 2 linje, 3 trådkors; negativ = ikke lov her). */
    uAim: { value: new THREE.Vector4() },
    /** Sperreilden på vei: x, z, radius, fremdrift 0-1 (over 1 = granatene faller). 0 i w = av. */
    uZone: { value: new THREE.Vector4() },
    /** Rakettflyets linje: x, z, lengde, fremdrift (0 = av). */
    uStrike: { value: new THREE.Vector4() },
    /** Kompaniet valgt: x, z, på. Målet det går mot: x, z, tid siden ordren, på. */
    uSel: { value: new THREE.Vector4() },
    uGoal: { value: new THREE.Vector4() },
};
/** Skriv rutene (r/g per rute) og last dem opp. */
export function setTiles(fill: (x: number, z: number) => 0 | 1 | 2 | 3) {
    const d = tiles.image.data as Uint8Array;
    for (let z = 0; z < MAP_D; z++)
        for (let x = 0; x < MAP_W; x++) {
            const v = fill(x, z);
            const i = (z * MAP_W + x) * 4;
            d[i] = v === 1 ? 255 : 0;
            d[i + 1] = v === 2 ? 255 : 0;
            d[i + 2] = v === 3 ? 255 : 0;
            d[i + 3] = 255;
        }
    tiles.needsUpdate = true;
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
        Object.assign(sh.uniforms, MARKS);
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
uniform vec4 uHq;
uniform vec4 uRelay[16];
uniform int uRelayN;
uniform sampler2D uTiles;
uniform float uTileOn;
uniform vec4 uGhost;
uniform vec3 uRadio;
uniform vec4 uAim;
uniform vec4 uZone;
uniform vec4 uStrike;
uniform vec4 uSel;
uniform vec4 uGoal;
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
diffuseColor.rgb *= 1.0 - uCloud * smoothstep(0.45, 0.72, cl);
// Markeringene: gule som radiolinjene, lyser litt av seg selv.
vec3 mCol = vec3(0.0);
float mA = 0.0;
if (uHq.w > 0.5) {
    vec2 dh = vWxz - uHq.xy;
    float a = atan(dh.y, dh.x) / 6.2832 * 56.0 + uTime * 0.4;
    float band = 1.0 - smoothstep(0.035, 0.075, abs(length(dh) - uHq.z));
    float dash = smoothstep(0.1, 0.2, fract(a)) * (1.0 - smoothstep(0.62, 0.72, fract(a)));
    mA = max(mA, band * dash * 0.85);
    mCol = uRadio;
}
for (int i = 0; i < 16; i++) {
    if (i >= uRelayN) break;
    vec4 r = uRelay[i];
    float d = abs(length(vWxz - r.xy) - r.z);
    float k = (1.0 - smoothstep(0.015, 0.045, d)) * 0.55;
    if (k > mA) { mA = k; mCol = uRadio; }
}
vec2 cell = floor(vWxz);
vec2 loc = fract(vWxz);
float edge = min(min(loc.x, 1.0 - loc.x), min(loc.y, 1.0 - loc.y));
if (uTileOn > 0.5 && cell.x >= 0.0 && cell.y >= 0.0 && cell.x < 16.0 && cell.y < 10.0) {
    vec4 tv = texture2D(uTiles, (cell + 0.5) / vec2(16.0, 10.0));
    float inT = smoothstep(0.1, 0.13, edge);
    // En lik enhet står her: ruta pulserer hvit med tykk kant, så den skiller seg fra de gule.
    if (tv.b > 0.5) {
        float pulse = 0.6 + 0.3 * sin(uTime * 6.0);
        float rim = (1.0 - smoothstep(0.05, 0.12, edge)) + inT * 0.3;
        mA = max(mA, min(0.9, rim * pulse));
        mCol = vec3(1.0, 0.98, 0.92);
    }
    else if (tv.r > 0.5 && inT * 0.42 > mA) { mA = inT * 0.42; mCol = uRadio; }
    else if (tv.g > 0.5 && inT * 0.35 > mA) { mA = inT * 0.35; mCol = vec3(0.73, 0.7, 0.63); }
}
if (uGhost.w > 0.5 && cell == floor(uGhost.xy)) {
    float inG = smoothstep(0.04, 0.07, edge) * 0.62;
    if (inG > mA) { mA = inG; mCol = uGhost.z > 0.5 ? vec3(0.42, 0.85, 0.36) : vec3(0.9, 0.3, 0.22); }
}
// Ordrene. Siktet følger musa: gult der ordren kan gå, rødt der ingen i nettet ser.
if (abs(uAim.w) > 0.5) {
    vec3 ac = uAim.w > 0.0 ? vec3(1.0, 0.82, 0.25) : vec3(0.95, 0.25, 0.18);
    vec2 da = vWxz - uAim.xy;
    float kind = abs(uAim.w);
    float dd = kind < 1.5 ? length(da) : kind < 2.5 ? length(vec2(max(abs(da.x) - uAim.z * 0.5, 0.0), da.y)) : length(da);
    float rr = kind < 1.5 ? uAim.z : kind < 2.5 ? 0.55 : 0.55;
    float a = atan(da.y, da.x) / 6.2832 * 40.0 - uTime * 0.6;
    float dash = smoothstep(0.15, 0.25, fract(a)) * (1.0 - smoothstep(0.65, 0.75, fract(a)));
    float rim = (1.0 - smoothstep(0.03, 0.07, abs(dd - rr))) * (kind < 2.5 ? dash : 1.0);
    float fill = (1.0 - smoothstep(rr - 0.05, rr, dd)) * 0.16;
    float cross = (1.0 - smoothstep(0.015, 0.04, min(abs(da.x), abs(da.y)))) * (1.0 - smoothstep(rr * 0.6, rr * 0.75, length(da))) * step(rr * 0.2, length(da));
    float k = max(rim * 0.9, max(fill, cross * 0.8));
    if (k > mA) { mA = k; mCol = ac; }
}
// Sperreilden er bestilt: rød sone som pulserer, og en ring som krymper mot midten til granatene faller.
if (uZone.w > 0.0) {
    vec2 dz = vWxz - uZone.xy;
    float d = length(dz);
    float p = uZone.w;
    float on = p < 1.0 ? 1.0 : max(0.0, 1.0 - (p - 1.0) * 1.5);
    float pulse = 0.5 + 0.5 * sin(uTime * (8.0 + p * 10.0));
    float rim = (1.0 - smoothstep(0.03, 0.08, abs(d - uZone.z))) * (0.6 + 0.4 * pulse);
    float shrink = (1.0 - smoothstep(0.02, 0.06, abs(d - uZone.z * max(0.0, 1.0 - p)))) * step(p, 1.0) * 0.9;
    float fill = (1.0 - smoothstep(uZone.z - 0.08, uZone.z, d)) * (0.12 + 0.12 * pulse);
    float hatch = (1.0 - smoothstep(uZone.z - 0.08, uZone.z, d)) * step(0.5, fract((dz.x + dz.y) * 2.2 + uTime * 0.8)) * 0.1;
    float k = max(max(rim, shrink), fill + hatch) * on;
    if (k > mA) { mA = k; mCol = vec3(1.0, 0.22, 0.12); }
}
// Rakettflyets linje: en rød stripe som fylles fra vest mot øst.
if (uStrike.w > 0.0) {
    vec2 ds = vWxz - uStrike.xy;
    float d = length(vec2(max(abs(ds.x) - uStrike.z * 0.5, 0.0), ds.y));
    float fillTo = -uStrike.z * 0.5 + uStrike.z * clamp(uStrike.w, 0.0, 1.0);
    float rim = 1.0 - smoothstep(0.03, 0.07, abs(d - 0.5));
    float inside = (1.0 - smoothstep(0.45, 0.5, d)) * step(ds.x, fillTo) * 0.3;
    float chev = (1.0 - smoothstep(0.45, 0.5, d)) * step(0.55, fract(ds.x * 1.6 - abs(ds.y) * 1.6 - uTime * 3.0)) * 0.22;
    float k = max(rim * 0.85, inside + chev) * (uStrike.w > 1.2 ? max(0.0, 1.0 - (uStrike.w - 1.2) * 2.0) : 1.0);
    if (k > mA) { mA = k; mCol = vec3(1.0, 0.3, 0.15); }
}
// Kompaniet valgt: en hvit ring rundt troppen og bølger som går ut fra den.
if (uSel.z > 0.5) {
    float d = length(vWxz - uSel.xy);
    float rim = 1.0 - smoothstep(0.03, 0.07, abs(d - 0.62));
    float wave = fract(uTime * 1.2);
    float out1 = (1.0 - smoothstep(0.02, 0.06, abs(d - 0.62 - wave * 0.6))) * (1.0 - wave) * 0.7;
    float k = max(rim, out1);
    if (k > mA) { mA = k; mCol = vec3(1.0, 0.97, 0.85); }
}
// Målet kompaniet går mot: et kryss og en ring som slår ut fra punktet når ordren gis.
if (uGoal.w > 0.5) {
    vec2 dg = vWxz - uGoal.xy;
    float d = length(dg);
    float age = uGoal.z;
    float burst = (1.0 - smoothstep(0.02, 0.07, abs(d - 0.15 - age * 1.4))) * max(0.0, 1.0 - age * 1.8);
    float ring = (1.0 - smoothstep(0.02, 0.05, abs(d - 0.32))) * 0.75;
    float x = (1.0 - smoothstep(0.02, 0.045, min(abs(dg.x - dg.y), abs(dg.x + dg.y)) * 0.7071)) * (1.0 - smoothstep(0.2, 0.24, d));
    float k = max(burst, max(ring, x * 0.85));
    if (k > mA) { mA = k; mCol = vec3(1.0, 0.97, 0.85); }
}
`
            )
            .replace(
                '#include <opaque_fragment>',
                `outgoingLight = mix(outgoingLight, mCol, mA);
#include <opaque_fragment>`
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
