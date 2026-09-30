// Felles materialer og geometri-hjelpere for «Frisk puss!»: høydedisen i shaderen, solas
// retning, hvor hvelvet er ferdig malt, bokser med UV i meter og stillasets materialer.

import * as THREE from 'three';
import { toonGradientMap } from '../kit/toonGradient';
import { ROOM, type Box, type Level } from './level';
import {
    ART,
    SUN,
    paintDryPlaster,
    paintTravertine,
    paintWetPlaster,
    paintWood,
} from './paint';

// ---------------------------------------------------------------------------
// Høydedis: varm kalkdis nede mot gulvet, sterkere jo lenger unna du ser. Legges inn i
// materialene med onBeforeCompile (ingen ekstra tegning).
// ---------------------------------------------------------------------------

export const HAZE = {
    uHaze: { value: new THREE.Color('#ecdcb8') },
    uHazeTop: { value: 7.5 },
    uHazeK: { value: 0.5 },
};

/**
 * Det som står mellom kameraet og figuren (bjelker, planker, stillas, søyler), tones ut med
 * skjermdør-dither mens det er i veien. Fragmentene inne i en kjegle fra kameraet mot figuren
 * (og mot paven når han er nær) kastes i et skjermdør-mønster, så figuren alltid syns. Kjeglen
 * slutter litt før figuren, så bjelken du står på og landingen foran deg aldri tones ut.
 */
export const OCCL = {
    uOccCam: { value: new THREE.Vector3() },
    uOccA: { value: new THREE.Vector3(0, -99, 0) },
    uOccB: { value: new THREE.Vector3(0, -99, 0) },
    /** 1 = kjeglen mot paven er på. */
    uOccBOn: { value: 0 },
};

const OCCL_GLSL = `
uniform vec3 uOccCam;
uniform vec3 uOccA;
uniform vec3 uOccB;
uniform float uOccBOn;
varying vec3 vOccW;
// Skjermdør-mønster (interleaved gradient noise): billig, jevnt og uten striper.
float fpBayer(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}
float fpCone(vec3 w, vec3 cam, vec3 f) {
    vec3 d = f - cam;
    float L2 = dot(d, d);
    float L = sqrt(L2);
    float t = dot(w - cam, d) / L2;
    float tMax = 1.0 - 1.4 / max(L, 2.0);
    if (t <= 0.0 || t >= tMax) return 0.0;
    float r = length(w - (cam + d * t));
    float R = 0.15 + t * 1.15;
    return smoothstep(R, R * 0.55, r) * smoothstep(tMax, tMax - 0.08, t);
}
`;

export function hazeify<T extends THREE.Material>(m: T, occlude = true): T {
    m.onBeforeCompile = (sh) => {
        sh.uniforms.uHaze = HAZE.uHaze;
        sh.uniforms.uHazeTop = HAZE.uHazeTop;
        sh.uniforms.uHazeK = HAZE.uHazeK;
        if (occlude) Object.assign(sh.uniforms, OCCL);
        sh.vertexShader = sh.vertexShader
            .replace(
                '#include <common>',
                '#include <common>\nvarying float vHazeY;\nvarying float vHazeD;' + (occlude ? '\nvarying vec3 vOccW;' : '')
            )
            .replace(
                '#include <project_vertex>',
                '#include <project_vertex>\nvec4 fpW = modelMatrix * vec4(transformed, 1.0);\nvHazeY = fpW.y;\nvHazeD = -mvPosition.z;' +
                    (occlude ? '\nvOccW = fpW.xyz;' : '')
            );
        let frag = sh.fragmentShader.replace(
            '#include <common>',
            '#include <common>\nvarying float vHazeY;\nvarying float vHazeD;\nuniform vec3 uHaze;\nuniform float uHazeTop;\nuniform float uHazeK;' +
                (occlude ? OCCL_GLSL : '')
        );
        if (occlude)
            frag = frag.replace(
                'void main() {',
                'void main() {\n' +
                    'float fpO = max(fpCone(vOccW, uOccCam, uOccA), uOccBOn * fpCone(vOccW, uOccCam, uOccB));\n' +
                    'if (fpO > 0.0 && fpBayer(gl_FragCoord.xy) < fpO * 0.9) discard;'
            );
        sh.fragmentShader = frag.replace(
            '#include <fog_fragment>',
            'float hz = clamp((uHazeTop - vHazeY) / uHazeTop, 0.0, 1.0);\n' +
                'gl_FragColor.rgb = mix(gl_FragColor.rgb, uHaze, hz * hz * uHazeK * smoothstep(3.0, 20.0, vHazeD));\n' +
                '#include <fog_fragment>'
        );
    };
    m.customProgramCacheKey = () => (occlude ? 'fp-haze-occl' : 'fp-haze');
    return m;
}

export const toon = (o: THREE.MeshToonMaterialParameters) =>
    hazeify(new THREE.MeshToonMaterial({ gradientMap: toonGradientMap(), ...o }));

/** Solas retning (inn gjennom sørvinduene, ned og mot nord). Speilvendt: fra motsatt side. */
export function sunDir(mirror: boolean): THREE.Vector3 {
    return new THREE.Vector3(mirror ? -SUN[0] : SUN[0], SUN[1], SUN[2]).normalize();
}

/** Hvor Michelangelo har malt hvelvet. Første dag: ingenting. Skapelsen: fra inngangen fram til mesteren. */
/**
 * Skyer som driver forbi sola: 0 = full sol, 1 = sky foran. Én runde på 20 s, så lyset lever
 * (lysflekkene og lyssøylene blekner og kommer tilbake). Leses fra spilltida.
 */
export function cloudAt(t: number): number {
    return 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 20);
}

export function finishedSpan(L: Level): [number, number] | null {
    if (L.id === 'forste') return null;
    const mx = L.master.p[0];
    return mx < 0 ? [mx + 3.8, 20] : [-20, mx - 3.8];
}

/** En boks med UV i meter (så teksturen har samme tetthet på alle bjelker). */
export function boxGeo(min: [number, number, number], max: [number, number, number], tone = 0, uvScale = 1): THREE.BufferGeometry {
    const sx = max[0] - min[0];
    const sy = max[1] - min[1];
    const sz = max[2] - min[2];
    const g = new THREE.BoxGeometry(sx, sy, sz);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const alongZ = sz > sx;
    const dims: [number, number][] = [
        [sz, sy],
        [sz, sy],
        [sx, sz],
        [sx, sz],
        [sx, sy],
        [sx, sy],
    ];
    for (let f = 0; f < 6; f++)
        for (let k = 0; k < 4; k++) {
            const i = f * 4 + k;
            let u = uv.getX(i) * dims[f][0];
            let v = uv.getY(i) * dims[f][1];
            if (alongZ && (f === 2 || f === 3)) [u, v] = [v, u];
            uv.setXY(i, u * uvScale, v * uvScale);
        }
    g.translate((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(1, 1, 1).multiplyScalar(1 + tone);
    for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g.index ? g.toNonIndexed() : g;
}

export const wallZ = (b: Box): number | null =>
    Math.abs(b.min[2] - ROOM.z0) < 0.05 ? ROOM.z0 : Math.abs(b.max[2] - ROOM.z1) < 0.05 ? ROOM.z1 : null;

export interface ScaffoldTextures {
    wood: THREE.CanvasTexture;
    deck: THREE.CanvasTexture;
    plank: THREE.CanvasTexture;
    trav: THREE.CanvasTexture;
    fluted: THREE.CanvasTexture;
    dry: THREE.CanvasTexture;
    wet: THREE.CanvasTexture;
}

let SCAFFOLD_TEX: ScaffoldTextures | null = null;
export function scaffoldTextures(): ScaffoldTextures {
    return (SCAFFOLD_TEX ??= {
        wood: paintWood('#8a5a31', 3),
        deck: paintWood('#b98452', 8),
        plank: paintWood('#c9b48e', 21),
        trav: paintTravertine(2),
        fluted: paintTravertine(5, true),
        dry: paintDryPlaster(),
        wet: paintWetPlaster(),
    });
}

let MATS: Record<string, THREE.Material> | null = null;
export function scaffoldMaterials() {
    if (MATS) return MATS;
    const t = scaffoldTextures();
    MATS = {
        wood: toon({ map: t.wood, vertexColors: true }),
        deck: toon({ map: t.deck, vertexColors: true }),
        plank: toon({ map: t.plank, vertexColors: true }),
        trav: toon({ map: t.trav, vertexColors: true }),
        fluted: toon({ map: t.fluted, vertexColors: true }),
        dry: toon({ map: t.dry }),
        iron: toon({ color: '#3b3632', vertexColors: true }),
        marble: toon({ color: '#f1eadb', vertexColors: true }),
        rope: toon({ color: '#a88352', vertexColors: true }),
        red: toon({ color: ART.red, emissive: new THREE.Color('#5a1a10') }),
        lime: toon({ color: '#f6f0e2', emissive: new THREE.Color('#3a342a') }),
        wet: hazeify(
            new THREE.MeshLambertMaterial({ map: t.wet, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
        ),
    };
    return MATS;
}

