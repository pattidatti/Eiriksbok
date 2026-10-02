// Regn: tynne streker som faller i en boks rundt kameraet.
//
// Strekene ligger fast i én geometri og flyttes bare i vertex-shaderen (tid, vind, kamera),
// så regnet koster ett tegnekall og ingenting på CPU-en. Boksen går rundt med kameraet:
// en dråpe som faller ut av den, dukker opp igjen på motsatt side.
//
// Inne i et rom skrus regnet av (`inne`), og det tones ut nær kameraet så ingen strek
// fyller halve skjermen.
import * as THREE from 'three';

const N = 2600;
const BOKS = new THREE.Vector3(36, 18, 36);

export class Regn {
    readonly mesh: THREE.LineSegments;
    private readonly mat: THREE.ShaderMaterial;

    constructor() {
        const seed = new Float32Array(N * 2 * 3);
        const ende = new Float32Array(N * 2);
        let s = 11;
        const r = () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
        for (let i = 0; i < N; i++) {
            const x = r() * BOKS.x;
            const y = r() * BOKS.y;
            const z = r() * BOKS.z;
            for (let k = 0; k < 2; k++) {
                seed.set([x, y, z], (i * 2 + k) * 3);
                ende[i * 2 + k] = k;
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(seed, 3));
        geo.setAttribute('aEnde', new THREE.BufferAttribute(ende, 1));
        this.mat = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.fog,
                {
                    uTid: { value: 0 },
                    uKamera: { value: new THREE.Vector3() },
                    uBoks: { value: BOKS.clone() },
                    uVind: { value: new THREE.Vector2(1.6, 0.6) },
                    uStyrke: { value: 0 },
                    uFarge: { value: new THREE.Color(0xc8d0d6) },
                },
            ]),
            vertexShader: /* glsl */ `
                attribute float aEnde;
                uniform float uTid;
                uniform vec3 uKamera;
                uniform vec3 uBoks;
                uniform vec2 uVind;
                varying float vAlfa;
                #include <fog_pars_vertex>
                void main() {
                    // Fart: 9 m/s ned og litt vind. Litt forskjellig per dråpe.
                    float h = fract(sin(dot(position.xz, vec2(12.9898, 78.233))) * 43758.5453);
                    vec3 fart = vec3(uVind.x, -9.0 - h * 2.0, uVind.y);
                    vec3 p = position + fart * uTid;
                    // Boksen følger kameraet: legg dråpen der den hører til rundt kameraet.
                    vec3 lav = uKamera - uBoks * 0.5;
                    p = lav + mod(p - lav, uBoks);
                    // Streken trekkes bakover langs farten (bevegelsesuskarphet).
                    p -= fart * aEnde * 0.035;
                    vec4 mvPosition = viewMatrix * vec4(p, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    float d = length(p - uKamera);
                    vAlfa = smoothstep(0.8, 3.0, d) * (1.0 - smoothstep(12.0, 18.0, d)) * (0.55 + h * 0.45);
                    #include <fog_vertex>
                }`,
            fragmentShader: /* glsl */ `
                uniform float uStyrke;
                uniform vec3 uFarge;
                varying float vAlfa;
                #include <fog_pars_fragment>
                void main() {
                    gl_FragColor = vec4(uFarge, vAlfa * uStyrke * 0.42);
                    #include <colorspace_fragment>
                    #include <fog_fragment>
                }`,
            transparent: true,
            depthWrite: false,
            fog: true,
        });
        this.mesh = new THREE.LineSegments(geo, this.mat);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 10;
        this.mesh.name = 'regn';
    }

    /** `styrke` 0..1 (tørt til øsregn), `inne` 0..1 (kameraet under tak). */
    update(t: number, kamera: THREE.Vector3, styrke: number, inne: number): void {
        const u = this.mat.uniforms;
        u.uTid.value = t;
        u.uKamera.value.copy(kamera);
        u.uStyrke.value = styrke * (1 - inne);
        // Hvor mange streker som tegnes følger styrken (resten er ikke med i tegnekallet).
        this.mesh.geometry.setDrawRange(0, Math.round(N * Math.min(1, styrke * 1.3)) * 2);
        this.mesh.visible = styrke * (1 - inne) > 0.01;
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        this.mat.dispose();
    }
}
