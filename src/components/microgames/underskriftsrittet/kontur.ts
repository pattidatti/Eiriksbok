// Sotbrun kontur rundt figurene (omvendt skall): baksida av figuren, blåst litt opp langs
// normalene. Virker både på vanlige mesher og på instanser (trærne).

import * as THREE from 'three';
import { toonGradientMap } from '../kit';

const VERT = /* glsl */ `
uniform float uW;
void main() {
    vec4 p = vec4(position + normal * uW, 1.0);
    #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * p;
}`;
const FRAG = /* glsl */ `
uniform vec3 uFarge;
uniform float uAlfa;
void main() { gl_FragColor = vec4(uFarge, uAlfa); }`;

export function konturMat(farge: string, bredde = 0.05) {
    return new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.BackSide,
        transparent: true,
        uniforms: {
            uW: { value: bredde },
            uFarge: { value: new THREE.Color(farge) },
            uAlfa: { value: 1 },
        },
    });
}

/** Flate, malte farger med fire lystrinn (toon), farger fra hjørnene. */
export function maltMat(opts: THREE.MeshToonMaterialParameters = {}) {
    return new THREE.MeshToonMaterial({
        vertexColors: true,
        gradientMap: toonGradientMap(),
        ...opts,
    });
}
