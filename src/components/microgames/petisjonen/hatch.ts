import * as THREE from 'three';

// Tresnitt-skravur: looken fra xylografiene i Skilling-Magazin og avisene i 1849.
//
// Alle figurer i spillet bruker ett Lambert-materiale med et lite tillegg i
// fragment-shaderen. I stedet for myk skygge tegnes skyggen som svarte streker:
// lys flate = rent papir, halvskygge = én retning streker, dyp skygge =
// kryss-skravur. Strekene ligger i skjermrom (gl_FragCoord), så de er like tette
// uansett hvor stor figuren er - slik et tresnitt ser ut.
//
// Billig: ingen skyggekart, ingen etterbehandling, én shader for alt. Derfor er
// looken ferdig også på «lav» (Chromebook).

export const INK = '#1c1915';
export const PAPER = '#efe4cc';
export const RED = '#b3261e';
export const GREY = '#8b8170';
export const LAMP = '#f2c14e';

/** Felles uniformer: endres ett sted (pikseltetthet), gjelder for alle materialer. */
export const HATCH = {
    uInk: { value: new THREE.Color(INK) },
    uPaper: { value: new THREE.Color(PAPER) },
    /** Pikseltetthet, så strekene er like tette i CSS-piksler på alle skjermer. */
    uScale: { value: 1 },
    /** 0-1: hvor mye papirfarge som blandes inn i lyse flater. */
    uTint: { value: 0.38 },
};

const FN = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uScale;
uniform float uTint;
float hLine(vec2 p, float ang, float spacing, float width) {
    float v = (p.x * cos(ang) + p.y * sin(ang)) / spacing;
    float f = abs(fract(v) - 0.5) * 2.0;
    return 1.0 - smoothstep(width, width + 0.28, f);
}
vec3 hatchIt(vec3 lit, vec3 albedo) {
    const vec3 W = vec3(0.299, 0.587, 0.114);
    float lraw = dot(albedo, W);
    // Tonen = lys ganger farge, målt mot papiret i full sol. Mørke materialer
    // (tak, frakker) og skygge blir begge til tettere streker - som i et tresnitt,
    // der alt er papir og blekk.
    float tone = clamp(dot(lit, W) / 0.5, 0.0, 1.4);
    // Blekk-svart (hatter) er svart uansett lys. Fargene er lineære her.
    float dark = 1.0 - smoothstep(0.012, 0.03, lraw);
    // Bare mettede farger (rødt, lampegult) beholder fargen; resten blir papir.
    // Metning måles i sRGB (sqrt er nær nok), ellers ser alt mettet ut.
    vec3 s = sqrt(albedo);
    float mx = max(s.r, max(s.g, s.b));
    float sat = (mx - min(s.r, min(s.g, s.b))) / max(mx, 0.001);
    float keep = smoothstep(0.45, 0.7, sat);
    vec3 base = mix(uPaper, albedo * (0.85 / max(mx * mx, 0.1)), keep);
    vec2 p = gl_FragCoord.xy / uScale;
    float ink = 0.0;
    ink = max(ink, hLine(p, 0.785, 5.0, 0.16) * smoothstep(0.9, 0.78, tone));
    ink = max(ink, hLine(p, -0.785, 5.0, 0.16) * smoothstep(0.55, 0.45, tone));
    ink = max(ink, hLine(p, 0.0, 3.5, 0.22) * smoothstep(0.3, 0.22, tone));
    ink = max(ink, smoothstep(0.1, 0.04, tone) * 0.6);
    ink *= mix(1.0, 0.55, keep);
    vec3 col = mix(base, uInk, ink * 0.9);
    return mix(col, uInk, dark);
}
`;

function patch(shader: THREE.WebGLProgramParametersWithUniforms) {
    Object.assign(shader.uniforms, HATCH);
    shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FN}`)
        .replace(
            '#include <opaque_fragment>',
            '#include <opaque_fragment>\ngl_FragColor.rgb = hatchIt(gl_FragColor.rgb, diffuseColor.rgb);'
        );
}

const cache = new Map<string, THREE.MeshLambertMaterial>();

/**
 * Skravert materiale i én farge (eller med vertex-farger). Samme farge gir samme
 * materiale, så alt deler én shader-kompilering.
 */
export function hatchMat(color: string, opts: { vertexColors?: boolean; emissive?: string } = {}) {
    const key = `${color}|${opts.vertexColors ? 1 : 0}|${opts.emissive ?? ''}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const m = new THREE.MeshLambertMaterial({
        color: opts.vertexColors ? '#ffffff' : color,
        vertexColors: !!opts.vertexColors,
        emissive: opts.emissive ?? '#000000',
    });
    m.onBeforeCompile = patch;
    // Ingen tonemapping: papiret skal være papirfarget, ikke grått.
    m.toneMapped = false;
    // Alle skraverte materialer deler programmet (ellers kompileres det per farge).
    m.customProgramCacheKey = () => 'hatch';
    cache.set(key, m);
    return m;
}

/** Konturen: en litt større kopi med baksiden ut, i blekk (omvendt skall). */
export const OUTLINE = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
