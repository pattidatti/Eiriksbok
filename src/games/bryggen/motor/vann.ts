// Vågen: vannet foran Bryggen.
//
// Ett plan og én shader, ingen teksturer og ingen ekstra tegning av scenen. Bølgene er en sum
// av sinusbølger med deriverte, så normalen regnes ut direkte i pikselen. Speilingen er falsk,
// men billig: strålen som speiles i vannet, sjekkes mot bryggefronten (en vegg med varierende
// høyde). Treffer den under taklinja, får vannet husfarge, ellers himmel. Da gynger husene i
// vannet når det krusner, uten at scenen tegnes to ganger.
//
// Regnet lager ringer: vannet deles i ruter på 0,45 m, og hver rute får en dråpe som treffer på
// sitt eget tidspunkt. Ringene skrus opp og ned med `regn` (0 tørt, 1 øsregn).
import * as THREE from 'three';

export interface VannOpts {
    /** Høyden på vannflata. */
    y: number;
    /** Hvor bryggefronten står (z) og hvor langt den går langs sjøen (x). */
    frontZ: number;
    frontX0: number;
    frontX1: number;
    /** Himmelfargen i horisonten og rett opp (det vannet speiler). */
    horisont: number;
    zenit: number;
    /** Sola: gir en glitrende stripe i vannet mot sola. `styrke` 0 = ingen (gråvær). */
    sol?: { retning: THREE.Vector3; farge: number; styrke: number };
}

export interface Vann {
    mesh: THREE.Mesh;
    /** Kalles hvert bilde. `regn` 0..1. */
    update: (t: number, regn: number) => void;
    dispose: () => void;
}

export function lagVann(o: VannOpts): Vann {
    const uniforms = {
        uTid: { value: 0 },
        uRegn: { value: 0 },
        uHorisont: { value: new THREE.Color(o.horisont) },
        uZenit: { value: new THREE.Color(o.zenit) },
        uFront: { value: new THREE.Vector3(o.frontZ, o.frontX0, o.frontX1) },
        uSol: { value: o.sol?.retning.clone() ?? new THREE.Vector3(0, 1, 0) },
        uSolFarge: { value: new THREE.Color(o.sol?.farge ?? 0).multiplyScalar(o.sol?.styrke ?? 0) },
        // Hvor mye sola lyser på bryggefronten (som vender mot -z): da speiles husene lysere.
        uFrontLys: { value: new THREE.Color(o.sol?.farge ?? 0).multiplyScalar(Math.max(0, -(o.sol?.retning.z ?? 0)) * 0.35) },
    };
    const mat = new THREE.MeshStandardMaterial({
        color: 0x16201f,
        roughness: 0.85,
        metalness: 0,
        envMapIntensity: 0,
    });
    mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, uniforms);
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vVann;')
            .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvVann = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', `#include <common>\n${VANN_GLSL}`)
            .replace(
                '#include <normal_fragment_maps>',
                `#include <normal_fragment_maps>
                vec3 vNW = vannNormal(vVann.xz, length(cameraPosition - vVann));
                normal = normalize((viewMatrix * vec4(vNW, 0.0)).xyz);`
            )
            .replace(
                '#include <emissivemap_fragment>',
                `#include <emissivemap_fragment>
                totalEmissiveRadiance += vannSpeil(vVann, vNW);`
            );
    };
    mat.customProgramCacheKey = () => 'bryggen-vann';

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, o.y, -98);
    mesh.receiveShadow = true;
    mesh.name = 'vaagen';

    return {
        mesh,
        update: (t, regn) => {
            uniforms.uTid.value = t;
            uniforms.uRegn.value = regn;
        },
        dispose: () => {
            mesh.geometry.dispose();
            mat.dispose();
        },
    };
}

/** De lange bølgene i `vannNormal` (retning, bølgelengde, høyde, fart). Må følge GLSL-en under. */
const DONNINGER: [number, number, number, number, number][] = [
    [0.25, 1.0, 9.0, 0.05, 1.6],
    [-0.6, 0.8, 5.3, 0.03, 1.2],
    [0.9, 0.45, 2.1, 0.012, 0.9],
];

/**
 * Høyden på vannflata over `y` i punktet (x, z) ved tid `t`: de samme sinusbølgene som shaderen
 * regner normalen av. Flata selv er flat, men skip som gynger etter denne, gynger i takt med
 * krusningen man ser.
 */
export function vannHoyde(x: number, z: number, t: number): number {
    let h = 0;
    for (const [dx, dz, lambda, amp, fart] of DONNINGER) {
        const l = Math.hypot(dx, dz);
        h += amp * Math.sin((6.2831 / lambda) * ((dx * x + dz * z) / l - fart * t));
    }
    return h;
}

const VANN_GLSL = /* glsl */ `
varying vec3 vVann;
uniform float uTid;
uniform float uRegn;
uniform vec3 uHorisont;
uniform vec3 uZenit;
uniform vec3 uFront; // z, x0, x1
uniform vec3 uSol;
uniform vec3 uSolFarge;
uniform vec3 uFrontLys;

float vHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Gradienten (d/dx, d/dz) til én sinusbølge: retning, bølgelengde, høyde, fart.
vec2 bolge(vec2 p, vec2 dir, float lambda, float amp, float fart) {
    float k = 6.2831 / lambda;
    float f = k * (dot(dir, p) - fart * uTid);
    return dir * (amp * k * cos(f));
}

// Krusningen: lange dønninger fra Vågen, kortere krapp vind, og regnringer.
// Detaljene tones ut med avstanden, ellers flimrer de som støy langt ute.
vec3 vannNormal(vec2 p, float dist) {
    vec2 g = vec2(0.0);
    g += bolge(p, normalize(vec2(0.25, 1.0)), 9.0, 0.05, 1.6);
    g += bolge(p, normalize(vec2(-0.6, 0.8)), 5.3, 0.03, 1.2);
    float naer = 1.0 - smoothstep(25.0, 70.0, dist);
    g += naer * bolge(p, normalize(vec2(0.9, 0.45)), 2.1, 0.012, 0.9);
    g += naer * bolge(p, normalize(vec2(-0.3, -0.95)), 1.3, 0.006, 0.7);
    float fin = 1.0 - smoothstep(8.0, 30.0, dist);
    g += fin * bolge(p, normalize(vec2(0.7, -0.7)), 0.55, 0.0025, 0.5);
    g += fin * bolge(p, normalize(vec2(-0.85, 0.5)), 0.37, 0.0018, 0.45);

    // Regnringer: én dråpe per rute, i ni naboruter så ringene kan krysse rutekantene.
    if (uRegn > 0.01 && dist < 35.0) {
        float celle = 0.45;
        vec2 c0 = floor(p / celle);
        vec2 rg = vec2(0.0);
        for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
                vec2 c = c0 + vec2(float(i), float(j));
                float h = vHash(c);
                // Ikke alle ruter får en dråpe i småregn.
                if (h > uRegn) continue;
                vec2 sentrum = (c + vec2(vHash(c + 3.1), vHash(c + 7.7))) * celle;
                float periode = 0.7 + h * 0.5;
                float alder = fract(uTid / periode + h * 13.0) * periode;
                vec2 d = p - sentrum;
                float r = length(d);
                float liv = alder / periode;
                float rad = sqrt(liv) * 0.22;
                float x = r - rad;
                // En smal bølgetopp som løper utover og dør ut.
                float ring = exp(-x * x * 2500.0) * (1.0 - liv) * (1.0 - liv) * sin(x * 110.0);
                rg += (d / max(r, 0.001)) * ring;
            }
        }
        g += rg * 0.22 * (1.0 - smoothstep(12.0, 35.0, dist));
    }
    return normalize(vec3(-g.x, 1.0, -g.y));
}

// Falsk speiling: himmel, eller bryggefronten der den speilede strålen treffer under taklinja.
vec3 vannSpeil(vec3 wp, vec3 n) {
    vec3 v = normalize(wp - cameraPosition);
    vec3 r = reflect(v, n);
    r.y = max(r.y, 0.0);
    float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, -v), 0.0), 5.0);
    vec3 farge = mix(uHorisont, uZenit, pow(r.y, 0.6));
    // Sola i vannet: et bredt skjær og glitter der bølgene vender rett mot den.
    float mot = max(dot(r, uSol), 0.0);
    farge += uSolFarge * (pow(mot, 18.0) * 0.5 + pow(mot, 400.0) * 30.0);
    if (r.z > 0.001) {
        float s = (uFront.x - wp.z) / r.z; // hvor langt strålen går før den når fronten
        vec3 treff = wp + r * s;
        float gard = floor(treff.x / 9.0);
        float tak = 7.5 + vHash(vec2(gard, 2.0)) * 5.5;
        // Gavlen: høyest midt på gården.
        float midt = abs(fract(treff.x / 9.0) - 0.5) * 2.0;
        tak += (1.0 - midt) * 2.5;
        float innenfor = step(uFront.y, treff.x) * step(treff.x, uFront.z);
        if (innenfor > 0.5 && treff.y < tak + 1.35) {
            // Husene: mørkt tre, litt lysere og kaldere oppover mot taket, nesten svart i vannkanten.
            float tone = vHash(vec2(gard, 5.0));
            vec3 tre = mix(vec3(0.075, 0.055, 0.04), vec3(0.12, 0.09, 0.065), tone);
            tre = mix(tre * 0.45, tre, smoothstep(0.0, 3.0, treff.y));
            tre += vec3(0.16, 0.1, 0.06) * uFrontLys * smoothstep(0.5, 2.5, treff.y);
            // Tåka ligger også mellom vannet og husene.
            float tf = 1.0 - exp(-0.0004 * s * s);
            farge = mix(tre, uHorisont, tf);
        }
    }
    return farge * fres;
}
`;
