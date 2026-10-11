// Geometrier, teksturer og materialer i Brevnettet. Lages én gang per side (første gang
// spillet tegnes) og deles av alle komponentene. Materialer som endres i useFrame, bor her
// og ikke i en useMemo (react-hooks/immutability).

import * as THREE from 'three';
import { toonGradientMap } from '../kit';
import {
    brevTekstur,
    garnTekstur,
    glødTekstur,
    haugeGeo,
    husMørkGeo,
    husTentGeo,
    pikselGeo,
    roseGeo,
    rytterGeo,
    tømmerTekstur,
    vevTeksturer,
} from './art';
import { FARGE } from './view';

function lag() {
    const gradientMap = toonGradientMap();
    const toon = (extra: THREE.MeshToonMaterialParameters = {}) =>
        new THREE.MeshToonMaterial({ vertexColors: true, gradientMap, ...extra });
    const vev = vevTeksturer();
    const glød = glødTekstur();
    const folk = pikselGeo(['.f.', 'iii', 'iii', 'i.i'], { f: '#e8c9a4', i: FARGE.brun }, 0.07, {
        f: 0.08,
        i: 0.08,
    });
    return {
        vev,
        geo: {
            husTent: husTentGeo(),
            husMørk: husMørkGeo(),
            rose: roseGeo(),
            hauge: haugeGeo(),
            rytter: rytterGeo(),
            folk,
            /** Rhombe-ring (torus med fire ledd, dreid 45 grader): ventering og fare-ring. */
            rhombe: new THREE.TorusGeometry(1, 0.075, 4, 4),
            segment: new THREE.CylinderGeometry(1, 1, 1, 6, 1, true),
            plan: new THREE.PlaneGeometry(1, 1),
            boks: new THREE.BoxGeometry(1, 1, 1),
        },
        mat: {
            husTent: new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.9,
                emissive: new THREE.Color(FARGE.gul),
                emissiveIntensity: 0.3,
            }),
            husMørk: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
            rose: new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.9,
                emissive: new THREE.Color(FARGE.gul),
                emissiveIntensity: 0.5,
            }),
            figur: toon({
                side: THREE.DoubleSide,
                emissive: new THREE.Color('#3a2a20'),
                emissiveIntensity: 0.6,
            }),
            /** Lensmannen gløder svakt krapprødt, så faren synes også i skyggen. */
            rytter: toon({
                side: THREE.DoubleSide,
                emissive: new THREE.Color(FARGE.rød),
                emissiveIntensity: 0.45,
            }),
            folk: toon(),
            ring: new THREE.MeshToonMaterial({ gradientMap }),
            fare: new THREE.MeshBasicMaterial({ color: '#ff4a3a', toneMapped: false }),
            glød: new THREE.MeshBasicMaterial({
                map: glød,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                toneMapped: false,
            }),
            // Garnet tegnes uten lys, så fargen (indigo, gul, rød) alltid leses tydelig.
            garn: new THREE.MeshBasicMaterial({ map: garnTekstur() }),
            brev: new THREE.MeshBasicMaterial({ map: brevTekstur(), transparent: true }),
            fnugg: new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide }),
            sti: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
            tre: new THREE.MeshToonMaterial({ color: '#5a3d26', gradientMap }),
            vegg: new THREE.MeshStandardMaterial({ map: tømmerTekstur(), roughness: 1 }),
            vev: new THREE.MeshStandardMaterial({
                map: vev.map,
                normalMap: vev.normalMap,
                normalScale: new THREE.Vector2(0.9, 0.9),
                roughness: 0.95,
            }),
            rekord: new THREE.MeshBasicMaterial({ color: FARGE.gul, toneMapped: false }),
            lys: new THREE.MeshToonMaterial({ color: FARGE.ull, gradientMap }),
            flamme: new THREE.MeshBasicMaterial({
                map: glød,
                color: new THREE.Color(2.2, 1.5, 0.6),
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                toneMapped: false,
            }),
        },
    };
}

export type Ressurser = ReturnType<typeof lag>;

let R: Ressurser | null = null;

/** Ressursene (lages første gang de trengs). */
export function ressurser(): Ressurser {
    R ??= lag();
    return R;
}

/** Tente stuer gløder mer jo flere som lyser: veven blir lysere når nettet vokser. */
export function settLysmåler(n: number) {
    ressurser().mat.husTent.emissiveIntensity = 0.3 + Math.min(0.15, n * 0.01);
}
