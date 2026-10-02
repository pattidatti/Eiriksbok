// Himmelen: en kuppel med fargeovergang, skyer som driver og sola bak dem.
//
// Ett tegnekall. Kuppelen følger kameraet og tegnes etter alt det andre som er helt (ikke
// gjennomsiktig), med dybden lagt helt bakerst: da hopper GPU-en over pikslene der husene
// allerede står, og skyene regnes bare ut der himmelen faktisk synes. (Tegnet først kostet den
// 1,7 ms i gårdsrommet, der bare en stripe himmel synes.) Den skriver ikke dybde, så
// dybdebufferen er tom (1,0) der himmelen er: etterbehandlingen kjenner himmelen på det.
//
// Horisonten har nøyaktig tåkefargen. Da glir husene langt ute over i himmelen uten kant.
// Gløden rundt sola legges på i etterbehandlingen, likt over himmel og tåke, så de ikke
// skiller lag. Uten etterbehandling (lav kvalitet) gløder himmelen litt selv (`glodHer`).
import * as THREE from 'three';
import type { Stemning } from './stemning';

const R = 140; // innenfor kameraets fjerne plan (160)

export class Himmel {
    readonly mesh: THREE.Mesh;
    private readonly u: Record<string, THREE.IUniform>;

    constructor(s: Stemning, solRetning: THREE.Vector3) {
        this.u = {
            uZenit: { value: new THREE.Color(s.zenit) },
            uHorisont: { value: new THREE.Color(s.takeFarge) },
            uSky: { value: new THREE.Color(s.sky) },
            uSolFarge: { value: new THREE.Color(s.solFarge) },
            uSol: { value: solRetning.clone() },
            uDekke: { value: s.skydekke },
            uGlodHer: { value: 0 },
            uTid: { value: 0 },
        };
        const mat = new THREE.ShaderMaterial({
            uniforms: this.u,
            vertexShader: /* glsl */ `
                varying vec3 vDir;
                void main() {
                    vDir = position;
                    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    gl_Position = p.xyww; // helt bakerst i dybden

                }`,
            fragmentShader: HIMMEL_GLSL,
            side: THREE.BackSide,
            depthWrite: false,
            depthFunc: THREE.LessEqualDepth,
            fog: false,
        });
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16), mat);
        this.mesh.name = 'himmel';
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 1000;
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = false;
    }

    /** `post`: etterbehandlingen legger på gløden rundt sola. Ellers gjør himmelen det selv. */
    update(t: number, kamera: THREE.Vector3, post: boolean, glod: number): void {
        this.mesh.position.copy(kamera);
        this.u.uTid.value = t % 3600;
        this.u.uGlodHer.value = post ? 0 : glod * 0.6;
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}

const HIMMEL_GLSL = /* glsl */ `
uniform vec3 uZenit;
uniform vec3 uHorisont;
uniform vec3 uSky;
uniform vec3 uSolFarge;
uniform vec3 uSol;
uniform float uDekke;
uniform float uGlodHer;
uniform float uTid;
varying vec3 vDir;

float hHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hStoy(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hHash(i), hHash(i + vec2(1.0, 0.0)), f.x), mix(hHash(i + vec2(0.0, 1.0)), hHash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float hFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * hStoy(p);
        p = p * 2.03 + vec2(1.7, 9.2);
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3 d = normalize(vDir);
    float y = max(d.y, 0.0);
    // Fargeovergangen: tåkefargen i horisonten, himmelfargen oppover.
    vec3 c = mix(uHorisont, uZenit, pow(smoothstep(0.0, 0.75, y), 0.7));
    float mot = max(dot(d, uSol), 0.0);

    // Skyer på et tenkt tak: lengre unna (og mindre) nede mot horisonten. Driver med vinden.
    vec2 p = d.xz / (y + 0.12) * 1.3 + vec2(uTid * 0.006, uTid * 0.0025);
    float n = hFbm(p);
    float tett = smoothstep(1.0 - uDekke - 0.08, 1.0 - uDekke + 0.32, n);
    // Undersiden er mørkere der skya er tykk, kanten mot sola lyser.
    float tykk = smoothstep(0.4, 0.9, n);
    vec3 sky = uSky * mix(1.15, 0.55, tykk);
    // Kanten mot sola lyser, og hele skydekket får et varmt skjær nær sola.
    sky += uSolFarge * (pow(mot, 6.0) * (1.0 - tykk) * 1.1 + pow(mot, 2.0) * 0.12);
    float horisont = smoothstep(0.0, 0.18, y);
    c = mix(c, sky, tett * horisont);

    // Sola: en skive bak skyene, så sterk at gløden i etterbehandlingen tar den.
    float skive = smoothstep(0.99955, 0.99975, mot);
    c += uSolFarge * skive * (1.0 - tett * 0.85) * 6.0;
    c += uSolFarge * (pow(mot, 12.0) * 0.35 + pow(mot, 120.0) * 0.6) * uGlodHer;

    // Under horisonten: bare tåke.
    c = mix(uHorisont, c, smoothstep(-0.02, 0.01, d.y));
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;
