// Drypp fra takskjegget: når det er vått, renner vannet ned taket og drypper fra kanten.
//
// Takskjeggene kommer fra cellene (`CellContent.drypp`, lagt inn av `tak` i moduler.ts). Langs
// skjeggene nærmest kameraet står det et dryppested omtrent hver halve meter. Hvor dråpen lander,
// finnes én gang per sted med en stråle rett ned (svalgangstaket, kaia, gjørma).
//
// Dråpene faller i vertex-shaderen som regnet (regn.ts): ett tegnekall, og CPU-en gjør bare noe
// når kameraet har flyttet seg et stykke. Hver dråpe har sin egen takt, så det ikke drypper i kor.
import * as THREE from 'three';
import type { Physics } from './physics';

const MAKS = 220;
/** Hvor langt fra kameraet det drypper. Lenger unna synes ikke en dråpe uansett. */
const R = 14;
/** Avstand mellom dryppestedene langs skjegget (m). */
const STEG = 0.55;

const _p = new THREE.Vector3();
const _ned = new THREE.Vector3(0, -1, 0);

interface Sted {
    p: THREE.Vector3;
    fall: number;
    d: number;
}

export class Drypp {
    /** Fargen på dråpene. Settes etter lyset ute (natt: mørkere). */
    readonly farge = new THREE.Color(0xdde4ea);
    readonly mesh: THREE.LineSegments;
    private readonly mat: THREE.ShaderMaterial;
    private readonly topp: Float32Array;
    private readonly fall: Float32Array;
    /** Hvor langt dråpen faller fra hvert sted. Nøkkel: stedet rundet av til centimeter. */
    private readonly fallCache = new Map<string, number>();
    private readonly sist = new THREE.Vector3(1e9, 0, 0);
    private antallSkjegg = -1;
    private readonly phys: Physics;

    constructor(phys: Physics) {
        this.phys = phys;
        this.topp = new Float32Array(MAKS * 2 * 3);
        this.fall = new Float32Array(MAKS * 2);
        const ende = new Float32Array(MAKS * 2);
        for (let i = 0; i < MAKS; i++) ende[i * 2 + 1] = 1;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(this.topp, 3).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('aFall', new THREE.BufferAttribute(this.fall, 1).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('aEnde', new THREE.BufferAttribute(ende, 1));
        geo.setDrawRange(0, 0);
        this.mat = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.fog,
                {
                    uTid: { value: 0 },
                    uKamera: { value: new THREE.Vector3() },
                    uStyrke: { value: 0 },
                    uTakt: { value: 1 },
                    uFarge: { value: null },
                },
            ]),
            vertexShader: /* glsl */ `
                attribute float aFall;
                attribute float aEnde;
                uniform float uTid;
                uniform float uTakt;
                uniform vec3 uKamera;
                varying float vAlfa;
                #include <fog_pars_vertex>
                void main() {
                    // Takten per sted: noen drypper ofte, andre sjelden. Regn gjør alle raskere.
                    float h = fract(sin(dot(position.xz, vec2(12.9898, 78.233))) * 43758.5453);
                    float periode = (0.7 + h * 2.6) / uTakt;
                    float t = mod(uTid + h * 31.0, periode);
                    // Dråpen henger litt før den slipper, så faller den med tyngden.
                    float tf = max(t - 0.12, 0.0);
                    float fart = 9.81 * tf;
                    float ned = min(0.5 * 9.81 * tf * tf, aFall);
                    vec3 p = position - vec3(0.0, ned, 0.0);
                    // Streken trekkes bakover langs farten (bevegelsesuskarphet), minst en dråpe lang.
                    p.y += aEnde * clamp(fart * 0.03, 0.03, 0.4);
                    vec4 mvPosition = viewMatrix * vec4(p, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    float d = length(p - uKamera);
                    // Borte når den har landet, og tonet ut tett på og langt unna kameraet.
                    float landet = step(aFall - 0.001, ned);
                    vAlfa = (1.0 - landet) * smoothstep(0.4, 1.6, d) * (1.0 - smoothstep(9.0, ${R.toFixed(1)}, d));
                    #include <fog_vertex>
                }`,
            fragmentShader: /* glsl */ `
                uniform float uStyrke;
                uniform vec3 uFarge;
                varying float vAlfa;
                #include <fog_pars_fragment>
                void main() {
                    gl_FragColor = vec4(uFarge, vAlfa * uStyrke * 0.75);
                    #include <colorspace_fragment>
                    #include <fog_fragment>
                }`,
            transparent: true,
            depthWrite: false,
            fog: true,
        });
        // `merge` kloner verdiene: fargen skal være det samme objektet som `farge`.
        this.mat.uniforms.uFarge.value = this.farge;
        this.mesh = new THREE.LineSegments(geo, this.mat);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 10;
        this.mesh.name = 'drypp';
    }

    /**
     * `skjegg` er takskjeggene i de lastede cellene, `takvann` hvor mye vann som ennå renner av
     * takene (0-1, `Vaer.takvann`), `regn` om det regner nå, og `inne` 0..1 (kameraet under tak).
     * Mens takene tørker, drypper det sjeldnere og til slutt ikke i det hele tatt.
     */
    update(t: number, kamera: THREE.Vector3, skjegg: Iterable<THREE.Vector3[]>, takvann: number, regn: number, inne: number): void {
        const u = this.mat.uniforms;
        u.uTid.value = t;
        u.uKamera.value.copy(kamera);
        u.uTakt.value = 0.45 + takvann * 0.75 + regn * 2.5;
        const styrke = THREE.MathUtils.smoothstep(takvann, 0.06, 0.4) * (1 - inne);
        u.uStyrke.value = styrke;
        this.mesh.visible = styrke > 0.01;
        if (!this.mesh.visible) return;
        // Stedene byttes bare når kameraet har gått et stykke, eller cellene har endret seg.
        const lister = [...skjegg];
        const n = lister.reduce((a, l) => a + l.length, 0);
        if (n === this.antallSkjegg && this.sist.distanceToSquared(kamera) < 1) return;
        this.antallSkjegg = n;
        this.sist.copy(kamera);
        this.velg(lister, kamera);
    }

    private velg(lister: THREE.Vector3[][], kamera: THREE.Vector3): void {
        const steder: Sted[] = [];
        for (const l of lister) {
            for (let i = 0; i + 1 < l.length; i += 2) {
                const a = l[i];
                const b = l[i + 1];
                // Hele skjegget er for langt unna: hopp over.
                const len = a.distanceTo(b);
                _p.lerpVectors(a, b, 0.5);
                if (_p.distanceTo(kamera) > R + len / 2) continue;
                const n = Math.max(1, Math.floor(len / STEG));
                for (let k = 0; k < n; k++) {
                    const p = new THREE.Vector3().lerpVectors(a, b, (k + 0.5) / n);
                    // Litt ujevnt langs skjegget, så det ikke står på rad som perler.
                    const h = Math.sin(p.x * 91.7 + p.z * 47.3) * 43758.5453;
                    p.lerp(b, ((h - Math.floor(h)) - 0.5) * (STEG * 0.6) / len);
                    const d = p.distanceTo(kamera);
                    if (d < R) steder.push({ p, fall: 0, d });
                }
            }
        }
        steder.sort((x, y) => x.d - y.d);
        steder.length = Math.min(steder.length, MAKS);
        let m = 0;
        for (const s of steder) {
            s.fall = this.fallFra(s.p);
            if (s.fall < 0.3) continue;
            for (let e = 0; e < 2; e++) {
                this.topp.set([s.p.x, s.p.y, s.p.z], (m * 2 + e) * 3);
                this.fall[m * 2 + e] = s.fall;
            }
            m++;
        }
        const geo = this.mesh.geometry;
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aFall.needsUpdate = true;
        geo.setDrawRange(0, m * 2);
    }

    /** Hvor langt dråpen faller før den treffer noe. Stråla starter litt under skjegget, utenfor taket. */
    private fallFra(p: THREE.Vector3): number {
        const key = `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;
        let f = this.fallCache.get(key);
        if (f === undefined) {
            _p.copy(p).y -= 0.08;
            const hit = this.phys.rayWorld(_p, _ned, 30, true);
            f = hit ? hit.distance + 0.08 : 0;
            if (this.fallCache.size > 5000) this.fallCache.clear();
            this.fallCache.set(key, f);
        }
        return f;
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        this.mat.dispose();
    }
}
