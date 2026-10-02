// Våte flater: regn gjør treverk mørkere og blankere, og det blir stående vann i søkk.
//
// Ingen nye tegnekall og ingen teksturer: materialene i `Materials` får noen linjer ekstra i
// shaderen (`patch`). Flater som vender opp blir våtest, vegger får litt, og fargen og ruheten
// varierer i flekker så det ikke ser ut som lakk. I gjørma og på steinen samles vannet i
// pytter som speiler himmelen (miljølyset).
//
// Inne i rommene (bua, schøtstua) er det tørt: de nærmeste rommene sendes inn som bokser.
import * as THREE from 'three';

/** Hvor mange rom shaderen sjekker. De nærmeste kameraet. */
const MAKS_ROM = 6;

/** Hvor lett det blir pytter på hvert materiale (0 = aldri). */
const PYTT: Record<string, number> = { gjorme: 0.45, stein: 0.35, gardsrom: 0.25, dekke: 0.15, lod: 0.2 };
/** Hvor mye mørkere et materiale blir vått. Tre suger, stein mindre. */
const MORK: Record<string, number> = { stein: 0.72, torv: 0.8, mork: 1, lod: 0.7 };

export class Vaat {
    readonly uniforms = {
        uVaat: { value: 0 },
        uRomMin: { value: Array.from({ length: MAKS_ROM }, () => new THREE.Vector3(0, -999, 0)) },
        uRomMax: { value: Array.from({ length: MAKS_ROM }, () => new THREE.Vector3(0, -999, 0)) },
    };

    /** 0 tørt, 1 gjennomvått. */
    set mengde(v: number) {
        this.uniforms.uVaat.value = v;
    }

    /** De nærmeste rommene (tørre). Resten av plassene tømmes. */
    settRom(rom: THREE.Box3[]): void {
        const { uRomMin, uRomMax } = this.uniforms;
        for (let i = 0; i < MAKS_ROM; i++) {
            const b = rom[i];
            if (b) {
                uRomMin.value[i].copy(b.min).subScalar(0.15);
                uRomMax.value[i].copy(b.max).addScalar(0.15);
            } else {
                uRomMin.value[i].set(0, -999, 0);
                uRomMax.value[i].set(0, -999, 0);
            }
        }
    }

    /** Legger vætan inn i en MeshStandardMaterial-shader. `key` velger pytter og mørkning. */
    patch(sh: Parameters<THREE.Material['onBeforeCompile']>[0], key: string): void {
        Object.assign(sh.uniforms, this.uniforms);
        const pytt = (PYTT[key] ?? 0).toFixed(2);
        const mork = (MORK[key] ?? 0.62).toFixed(2);
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vVaatPos;')
            .replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>
                #ifdef USE_INSTANCING
                    vVaatPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
                #else
                    vVaatPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
                #endif`
            );
        sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', `#include <common>\n${VAAT_GLSL}`)
            .replace(
                '#include <normal_fragment_maps>',
                `#include <normal_fragment_maps>
                vaatFlate(diffuseColor.rgb, roughnessFactor, normal, ${pytt}, ${mork});`
            );
    }
}

const VAAT_GLSL = /* glsl */ `
varying vec3 vVaatPos;
uniform float uVaat;
uniform vec3 uRomMin[${MAKS_ROM}];
uniform vec3 uRomMax[${MAKS_ROM}];

float vaHash(vec2 p) {
    return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
}

float vaStoy(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(vaHash(i), vaHash(i + vec2(1.0, 0.0)), f.x), mix(vaHash(i + vec2(0.0, 1.0)), vaHash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void vaatFlate(inout vec3 farge, inout float ruhet, inout vec3 n, float pyttVekt, float mork) {
    if (uVaat < 0.01) return;
    for (int i = 0; i < ${MAKS_ROM}; i++) {
        if (all(greaterThan(vVaatPos, uRomMin[i])) && all(lessThan(vVaatPos, uRomMax[i]))) return;
    }
    // Normalen i verdensrom (normal er i kamerarommet).
    vec3 wn = normalize((vec4(n, 0.0) * viewMatrix).xyz);
    float opp = smoothstep(0.2, 0.85, wn.y);
    // Flekker: noen steder har vannet rent av, andre er gjennomvåte.
    float f = vaStoy(vVaatPos.xz * 0.45 + vVaatPos.y * 0.3) * 0.6 + vaStoy(vVaatPos.xz * 1.7) * 0.4;
    float w = uVaat * mix(0.25, 1.0, opp) * mix(0.55, 1.0, smoothstep(0.25, 0.7, f));
    farge *= mix(1.0, mork, w);
    ruhet = mix(ruhet, min(ruhet, 0.3), w * 0.85);
    // Pytter: i søkkene (lav støy) på flater som vender opp.
    if (pyttVekt > 0.0) {
        float s = vaStoy(vVaatPos.xz * 0.35 + 7.0) * 0.7 + vaStoy(vVaatPos.xz * 1.3) * 0.3;
        float p = smoothstep(0.7 - pyttVekt * 0.1, 0.73 - pyttVekt * 0.1, 1.0 - s) * opp * smoothstep(0.3, 0.9, uVaat);
        farge *= mix(1.0, 0.35, p);
        ruhet = mix(ruhet, 0.06, p);
        // Vannflata er flat: ingen ujevnheter fra normalkartet.
        n = normalize(mix(n, (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz, p));
    }
}
`;
