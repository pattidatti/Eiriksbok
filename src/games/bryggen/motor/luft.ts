// Luft som lever: røyk fra ljorene og støv som svever i rommene.
//
// Røyken: myke flak som stiger fra takene der det brenner (schøtstuene), vokser, driver med
// vinden og blir borte. Alle flakene i byen er én geometri, og hele bevegelsen regnes ut i
// vertex-shaderen (som regnet), så røyken koster ett tegnekall og ingenting på CPU-en. Mot sola
// lyser den opp (lyset sprer seg forover gjennom røyk).
//
// Støvet: flak i rommet kameraet står i. De er en InstancedMesh med Lambert-materiale, så de
// får sol og skygge som alt annet: i skyggen synes de nesten ikke, men der sola faller inn
// gjennom døra eller en glugg, lyser de opp. De fleste er små glimt; resten er store, svake
// disflak, og de tegner selve lysstrålen gjennom rommet (uten et eget pass for volumlys).
// Bevegelsen er i vertex-shaderen.
import * as THREE from 'three';

/** Hvor mange piper som kan ryke samtidig (de nærmeste kameraet). */
const MAKS_KILDER = 4;
const FLAK = 28;
const LIV = 14;

export class Royk {
    readonly mesh: THREE.Mesh;
    /** Av/på (for måling). */
    paa = true;
    private readonly u: Record<string, THREE.IUniform>;
    private readonly solFarge: THREE.Color;
    private readonly skygge: THREE.Color;
    /** Hvor mye av sollyset som når fram (0 når sola er nede og månen ikke oppe). */
    lysFade = 1;

    /** Sola og fargene deles med lyssettingen (`Lyssetting.solRetning`, `c.solFarge`, `c.himmel`). */
    constructor(solRetning: THREE.Vector3, solFarge: THREE.Color, skygge: THREE.Color) {
        this.solFarge = solFarge;
        this.skygge = skygge;
        const n = MAKS_KILDER * FLAK;
        const hjorne = new Float32Array(n * 4 * 2);
        const fro = new Float32Array(n * 4 * 4);
        const idx: number[] = [];
        let s = 7;
        const r = () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
        const H = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        for (let i = 0; i < n; i++) {
            const kilde = Math.floor(i / FLAK);
            const f = [(i % FLAK) / FLAK + r() * 0.02, r(), r(), kilde];
            for (let k = 0; k < 4; k++) {
                hjorne.set(H[k], (i * 4 + k) * 2);
                fro.set(f, (i * 4 + k) * 4);
            }
            idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
        }
        const geo = new THREE.BufferGeometry();
        // Posisjonen brukes ikke (alt regnes ut i shaderen), men Three trenger den.
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 4 * 3), 3));
        geo.setAttribute('aHjorne', new THREE.BufferAttribute(hjorne, 2));
        geo.setAttribute('aFro', new THREE.BufferAttribute(fro, 4));
        geo.setIndex(idx);
        this.u = {
            uTid: { value: 0 },
            uKilder: { value: Array.from({ length: MAKS_KILDER }, () => new THREE.Vector4(0, -999, 0, 0)) },
            uVind: { value: new THREE.Vector3(-0.35, 0, 0.22) },
            uSol: { value: solRetning },
            uSolFarge: { value: new THREE.Color() },
            uSkygge: { value: new THREE.Color() },
        };
        const mat = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, this.u]),
            vertexShader: /* glsl */ `
                attribute vec2 aHjorne;
                attribute vec4 aFro;
                uniform float uTid;
                uniform vec4 uKilder[${MAKS_KILDER}];
                uniform vec3 uVind;
                varying vec2 vUv;
                varying float vAlfa;
                varying vec3 vVerden;
                varying float vFro;
                #include <fog_pars_vertex>
                void main() {
                    vec4 k = uKilder[int(aFro.w + 0.5)];
                    float alder = fract(uTid / ${LIV.toFixed(1)} + aFro.x);
                    float t = alder * ${LIV.toFixed(1)};
                    // Stiger fort først, flater ut og driver med vinden. Litt slingring.
                    vec3 p = k.xyz;
                    p.y += 4.5 * (1.0 - exp(-t * 0.35)) + t * 0.12;
                    p += uVind * t * (0.6 + aFro.y * 0.6);
                    p.x += sin(t * 0.7 + aFro.z * 6.28) * 0.35 * alder;
                    p.z += cos(t * 0.5 + aFro.y * 6.28) * 0.35 * alder;
                    float str = mix(0.35, 2.6, sqrt(alder)) * (0.8 + aFro.z * 0.4);
                    vec4 mvPosition = viewMatrix * vec4(p, 1.0);
                    // Flaket snur seg mot kameraet, og roterer sakte.
                    float a = aFro.y * 6.28 + t * 0.15;
                    vec2 h = mat2(cos(a), -sin(a), sin(a), cos(a)) * aHjorne;
                    mvPosition.xy += h * str;
                    gl_Position = projectionMatrix * mvPosition;
                    vUv = aHjorne;
                    vAlfa = smoothstep(0.0, 0.08, alder) * pow(1.0 - alder, 1.4) * k.w;
                    vVerden = p;
                    vFro = aFro.z;
                    #include <fog_vertex>
                }`,
            fragmentShader: /* glsl */ `
                uniform vec3 uSol;
                uniform vec3 uSolFarge;
                uniform vec3 uSkygge;
                varying vec2 vUv;
                varying float vAlfa;
                varying vec3 vVerden;
                varying float vFro;
                #include <fog_pars_fragment>
                void main() {
                    float r = length(vUv);
                    // Ujevn kant: to bølger rundt flaket.
                    float ang = atan(vUv.y, vUv.x);
                    float kant = 0.75 + 0.12 * sin(ang * 3.0 + vFro * 20.0) + 0.08 * sin(ang * 7.0 + vFro * 9.0);
                    float a = smoothstep(kant, kant * 0.25, r) * vAlfa * 0.6;
                    if (a < 0.004) discard;
                    // Mot sola: lyset sprer seg forover gjennom røyken.
                    vec3 v = normalize(vVerden - cameraPosition);
                    float mot = max(dot(v, uSol), 0.0);
                    vec3 c = uSkygge + uSolFarge * (0.35 + 1.6 * pow(mot, 6.0));
                    gl_FragColor = vec4(c, a);
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                    #include <fog_fragment>
                }`,
            transparent: true,
            depthWrite: false,
            fog: true,
        });
        // `merge` kloner verdiene: legg de samme objektene inn igjen, så `update` når shaderen.
        Object.assign(mat.uniforms, this.u);
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 5;
        this.mesh.name = 'royk';
    }

    /** `kilder`: hullene i taket der røyken kommer ut. De nærmeste `fokus` ryker. */
    update(t: number, kilder: THREE.Vector3[], fokus: THREE.Vector3): void {
        this.u.uTid.value = t % 3600;
        // Lyset på røyken: sola (borte om natta) og himmellyset i skyggesida.
        (this.u.uSolFarge.value as THREE.Color).copy(this.solFarge).multiplyScalar(this.lysFade);
        (this.u.uSkygge.value as THREE.Color).copy(this.skygge);
        const naer = [...kilder].sort((a, b) => a.distanceToSquared(fokus) - b.distanceToSquared(fokus));
        const arr = this.u.uKilder.value as THREE.Vector4[];
        for (let i = 0; i < MAKS_KILDER; i++) {
            const k = naer[i];
            if (k) arr[i].set(k.x, k.y, k.z, 1);
            else arr[i].set(0, -999, 0, 0);
        }
        this.mesh.visible = this.paa && kilder.length > 0;
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}

const STOV = 420;
/** Andelen som er store disflak (resten er små glimt). Hvert disflak er stort og tegnes oppå
 * alt bak det: 630 av dem kostet 14 ms i bua. 160, og ingen tett på kameraet, koster lite. */
const DIS = 0.38;

export class Stov {
    readonly mesh: THREE.InstancedMesh;
    /** Av/på (for måling). */
    paa = true;
    private readonly tex: THREE.CanvasTexture;
    private readonly u = {
        uGlimt: { value: 1 },
        uTid: { value: 0 },
        uMin: { value: new THREE.Vector3() },
        uStr: { value: new THREE.Vector3(1, 1, 1) },
    };

    constructor(solRetning: THREE.Vector3) {
        // Et lite flak som står vinkelrett på sola: får fullt sollys der sola når inn.
        const geo = new THREE.PlaneGeometry(0.03, 0.03);
        geo.lookAt(solRetning);
        const cv = document.createElement('canvas');
        cv.width = cv.height = 32;
        const g = cv.getContext('2d');
        if (g) {
            const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
            grad.addColorStop(0, 'rgba(255,255,255,0.8)');
            grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = grad;
            g.fillRect(0, 0, 32, 32);
        }
        this.tex = new THREE.CanvasTexture(cv);
        const mat = new THREE.MeshLambertMaterial({
            color: 0xfff2dc,
            map: this.tex,
            transparent: true,
            opacity: 1,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
        });
        const sol = { value: solRetning };
        mat.onBeforeCompile = (sh) => {
            Object.assign(sh.uniforms, this.u, { uSolDir: sol });
            // Begge sider av flaket vender mot sola: sett fra skyggesiden snur Three ellers
            // normalen bort fra sola, og flaket blir mørkt nettopp der man ser strålen.
            // Disflakene får bare direkte sol: med himmellyset også ble hele rommet melkete.
            sh.fragmentShader = sh.fragmentShader
                .replace('#include <common>', '#include <common>\nuniform vec3 uSolDir;\nvarying float vDis;')
                .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize((viewMatrix * vec4(uSolDir, 0.0)).xyz);')
                .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.indirectDiffuse *= mix(0.4, 0.0, vDis);');
            sh.vertexShader = sh.vertexShader
                .replace(
                    '#include <common>',
                    `#include <common>
                    uniform float uTid;
                    uniform float uGlimt;
                    uniform vec3 uMin;
                    uniform vec3 uStr;
                    varying float vDis;
                    float sHash(float n) { return fract(sin(n) * 43758.5453); }`
                )
                .replace(
                    '#include <begin_vertex>',
                    `#include <begin_vertex>
                    // Hvert flak svever på sin egen sakte bane i rommet og kommer inn igjen
                    // på motsatt side når det driver ut.
                    float id = float(gl_InstanceID);
                    // De siste er disflak: mye større.
                    vDis = step(${(STOV * (1 - DIS)).toFixed(1)}, id);
                    vec3 f = vec3(sHash(id * 1.7), sHash(id * 3.1 + 1.0), sHash(id * 5.3 + 2.0));
                    vec3 drift = vec3(sin(uTid * 0.11 + id), sin(uTid * 0.07 + id * 2.0) * 0.6 - 0.15, cos(uTid * 0.09 + id * 3.0)) * 0.03 * uTid;
                    vec3 q = mod(f * uStr + drift + vec3(sin(uTid * 0.6 + id) * 0.04), uStr);
                    vec3 sted = uMin + q;
                    // Disflak tett på kameraet dekker halve skjermen (og koster deretter): bort.
                    float naer = distance(sted, cameraPosition);
                    if (vDis > 0.5) transformed *= 30.0 * smoothstep(1.4, 2.2, naer);
                    else if (id > uGlimt * ${(STOV * (1 - DIS)).toFixed(1)}) transformed *= 0.0;
                    transformed += sted;`
                );
        };
        mat.customProgramCacheKey = () => 'bryggen-stov';
        this.mesh = new THREE.InstancedMesh(geo, mat, STOV);
        // Alle flakene står i origo; flyttingen skjer i shaderen. Fargen er styrken: glimtene
        // sterke, disflakene svake (de legges oppå hverandre).
        const glimt = new THREE.Color(1.6, 1.5, 1.35);
        const dis = new THREE.Color(0.2, 0.19, 0.17);
        for (let i = 0; i < STOV; i++) {
            this.mesh.setMatrixAt(i, new THREE.Matrix4());
            this.mesh.setColorAt(i, i > STOV * (1 - DIS) ? dis : glimt);
        }
        this.mesh.frustumCulled = false;
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = false;
        this.mesh.renderOrder = 6;
        this.mesh.name = 'stov';
        this.mesh.visible = false;
    }

    /** Støvet står i det nærmeste rommet når kameraet er inne (`inne` > 0), ellers ingenting. */
    update(t: number, rom: THREE.Box3 | null, inne: number): void {
        this.mesh.visible = this.paa && !!rom && inne > 0.05;
        if (!rom) return;
        this.u.uTid.value = t % 3600;
        this.u.uMin.value.copy(rom.min);
        rom.getSize(this.u.uStr.value);
        // Ikke helt opp under taket, der er det mørkt uansett.
        this.u.uStr.value.y = Math.min(this.u.uStr.value.y, 3.2);
        // Små rom får færre glimt; disflakene (de siste) er alltid med.
        const andel = Math.min(1, (this.u.uStr.value.x * this.u.uStr.value.z) / 40);
        this.mesh.count = STOV;
        this.u.uGlimt.value = Math.max(0.35, andel);
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
        this.tex.dispose();
    }
}
