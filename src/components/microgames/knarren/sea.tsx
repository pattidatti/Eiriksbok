import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WAVES, type Env } from './env';
import { useQuality } from '../kit';

// Havet og himmelen. Begge er egne shadere, fordi det er de som gjør spillet:
// eleven ser på vann og himmel hele tiden.
//
// Havet er et polart rutenett som følger kameraet: tett nær skipet, glissent ut
// mot horisonten (ringene vokser eksponentielt), så én mesh dekker 6 km uten å
// koste mer enn et par titusen hjørner. Bølgene dempes med avstanden, ellers
// flimrer de små bølgene i det fjerne.

const N = WAVES.length;

const waveDecl = `
uniform vec2 uDir[${N}];
uniform float uLen[${N}];
uniform float uAmp[${N}];
uniform float uSteep[${N}];
`;

const oceanVert = /* glsl */ `
${waveDecl}
uniform float uTime;
uniform float uScale;
uniform vec2 uCenter;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;
varying float vFade;

void main() {
    vec3 p = position;
    p.xz += uCenter;
    float dist = length(position.xz);
    float fade = 1.0 - smoothstep(260.0, 1600.0, dist);
    vFade = fade;
    vec3 disp = vec3(0.0);
    vec3 n = vec3(0.0, 1.0, 0.0);
    for (int i = 0; i < ${N}; i++) {
        float k = 6.28318 / uLen[i];
        float c = sqrt(9.81 / k);
        float a = uAmp[i] * uScale * fade;
        float q = min(uSteep[i] / (k * max(a, 1e-4) * ${N}.0 + 1e-6), 1.0);
        float f = k * (dot(uDir[i], p.xz) - c * uTime);
        float cf = cos(f);
        float sf = sin(f);
        disp.x += uDir[i].x * q * a * cf;
        disp.z += uDir[i].y * q * a * cf;
        disp.y += a * sf;
        n.x -= uDir[i].x * k * a * cf;
        n.z -= uDir[i].y * k * a * cf;
        n.y -= q * k * a * sf;
    }
    vec3 w = p + disp;
    vWorld = w;
    vNormal = normalize(n);
    vHeight = disp.y;
    gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
`;

const noise = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;

const oceanFrag = /* glsl */ `
uniform vec3 uSun;
uniform vec3 uSunColor;
uniform float uSunStrength;
uniform vec3 uTop;
uniform vec3 uHor;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uTime;
uniform float uScale;
uniform float uDay;
uniform float uFlash;
uniform vec3 uWake[24];
varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;
varying float vFade;
${noise}

void main() {
    vec3 V = normalize(cameraPosition - vWorld);
    float d = length(cameraPosition - vWorld);
    // Langt borte blir normalen flatere - ellers glitrer horisonten urolig.
    vec3 N = normalize(mix(vec3(0.0, 1.0, 0.0), vNormal, clamp(1.2 - d / 900.0, 0.15, 1.0)));
    // Småkrusning fra vinden oppå dønningene.
    vec2 rp = vWorld.xz * 0.9 + vec2(uTime * 0.6, uTime * 1.1);
    vec2 ripple = vec2(vnoise(rp) - 0.5, vnoise(rp + 7.3) - 0.5) * (0.12 + uScale * 0.25) * vFade;
    N = normalize(N + vec3(ripple.x, 0.0, ripple.y));

    float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 R = reflect(-V, N);
    R.y = abs(R.y);
    vec3 sky = mix(uHor, uTop, pow(clamp(R.y, 0.0, 1.0), 0.45));
    float s = max(dot(R, uSun), 0.0);
    vec3 spec = uSunColor * (pow(s, 1200.0) * 60.0 + pow(s, 120.0) * 1.6 + pow(s, 12.0) * 0.12) * uSunStrength;

    float amp = max(uScale * 2.3, 0.3);
    float h = vHeight / amp;
    vec3 body = mix(uDeep, uShallow, clamp(h * 0.55 + 0.35, 0.0, 1.0) * 0.75);
    // Lys gjennom bølgetoppene når sola står bak dem.
    float sss = pow(max(dot(V, -uSun), 0.0), 3.0) * clamp(h + 0.2, 0.0, 1.0);
    body += uShallow * sss * 0.9 * uSunStrength;

    vec3 col = mix(body, sky, fres) + spec;

    // Skum på toppene - mer i storm - brutt opp av støy.
    float fn = vnoise(vWorld.xz * 0.28 + uTime * 0.15) * 0.6 + vnoise(vWorld.xz * 1.3 - uTime * 0.3) * 0.4;
    float streak = vnoise(vWorld.xz * vec2(0.9, 2.4) + vec2(uTime * 0.2, -uTime * 0.5));
    float foam = smoothstep(0.85, 1.3, h + fn * 0.35) * smoothstep(0.45, 1.0, uScale) * vFade;
    foam *= smoothstep(0.25, 0.7, streak) * 0.85;
    // Kjølvannet: en smal stripe skum bak skipet som løser seg opp.
    float wake = 0.0;
    if (length(vWorld.xz - uWake[0].xy) < 90.0) {
        for (int i = 2; i < 24; i++) {
            vec3 w = uWake[i];
            vec2 dir = uWake[i - 1].xy - w.xy;
            float dl = length(dir);
            if (dl < 0.01 || w.z < 0.02) continue;
            dir /= dl;
            vec2 perp = vec2(-dir.y, dir.x);
            float fi = float(i);
            // Kjølvannet sprer seg i en V bak skipet, med litt urolig vann i midten.
            float spread = 1.4 + fi * 0.55;
            float r = 0.7 + fi * 0.09;
            float fade = w.z * (1.0 - fi / 24.0);
            float d1 = length(vWorld.xz - (w.xy + perp * spread));
            float d2 = length(vWorld.xz - (w.xy - perp * spread));
            float d0 = length(vWorld.xz - w.xy);
            float v = max(1.0 - smoothstep(r * 0.2, r, d1), 1.0 - smoothstep(r * 0.2, r, d2));
            float mid = (1.0 - smoothstep(0.4, 1.6 + fi * 0.08, d0)) * 0.45;
            wake = max(wake, fade * max(v, mid));
        }
        float bub = vnoise(vWorld.xz * 2.6 + uTime * 0.5);
        wake *= smoothstep(0.3, 0.75, bub * 0.7 + fn * 0.3);
    }
    foam = max(foam, wake * 0.7);
    vec3 foamCol = mix(uHor, vec3(0.93, 0.96, 0.98), 0.7) * (0.3 + 0.7 * uDay);
    col = mix(col, foamCol, clamp(foam, 0.0, 1.0));
    col += vec3(0.5, 0.6, 0.8) * uFlash * 0.35;

    float fogF = 1.0 - exp(-pow(d * uFogDensity, 2.0));
    col = mix(col, uFogColor, clamp(fogF, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

function polarGrid(rings: number, segs: number, rMax: number) {
    const pos: number[] = [0, 0, 0];
    const idx: number[] = [];
    const b = 4.2;
    const a = rMax / (Math.exp(b) - 1);
    for (let r = 1; r <= rings; r++) {
        const rad = a * (Math.exp((b * r) / rings) - 1);
        for (let s = 0; s < segs; s++) {
            const t = (s / segs) * Math.PI * 2;
            pos.push(Math.cos(t) * rad, 0, Math.sin(t) * rad);
        }
    }
    for (let s = 0; s < segs; s++) idx.push(0, 1 + ((s + 1) % segs), 1 + s);
    for (let r = 0; r < rings - 1; r++) {
        const o0 = 1 + r * segs;
        const o1 = 1 + (r + 1) * segs;
        for (let s = 0; s < segs; s++) {
            const s1 = (s + 1) % segs;
            idx.push(o0 + s, o0 + s1, o1 + s, o0 + s1, o1 + s1, o1 + s);
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    return g;
}

function waveUniforms() {
    return {
        uDir: { value: WAVES.map((w) => new THREE.Vector2(w.dir[0], w.dir[1])) },
        uLen: { value: WAVES.map((w) => w.len) },
        uAmp: { value: WAVES.map((w) => w.amp) },
        uSteep: { value: WAVES.map((w) => w.steep) },
    };
}

function oceanFrame(mat: THREE.ShaderMaterial, e: Env, cam: THREE.Camera) {
    const u = mat.uniforms;
    u.uTime.value = e.time;
    u.uScale.value = e.waveScale;
    // Rutenettet følger kameraet i hele «celler», så hjørnene ikke svømmer.
    u.uCenter.value.set(Math.round(cam.position.x / 2) * 2, Math.round(cam.position.z / 2) * 2);
    u.uSun.value.copy(e.sunDir);
    u.uSunColor.value.copy(e.sunColor);
    u.uSunStrength.value = e.sunStrength;
    u.uTop.value.copy(e.skyTop);
    u.uHor.value.copy(e.skyHorizon);
    u.uDeep.value.copy(e.waterDeep);
    u.uShallow.value.copy(e.waterShallow);
    u.uFogColor.value.copy(e.fogColor);
    u.uFogDensity.value = e.fogDensity;
    u.uDay.value = 1 - e.night;
    u.uFlash.value = e.flash;
}

function skyFrame(mat: THREE.ShaderMaterial, e: Env, mesh: THREE.Mesh | null, cam: THREE.Camera) {
    const u = mat.uniforms;
    u.uSun.value.copy(e.sunDir);
    u.uSunColor.value.copy(e.sunColor);
    u.uSunStrength.value = e.sunStrength;
    u.uTop.value.copy(e.skyTop);
    u.uHor.value.copy(e.skyHorizon);
    u.uFogColor.value.copy(e.fogColor);
    u.uFog.value = e.fog * 0.92;
    u.uCloud.value = e.cloud;
    u.uNight.value = e.night;
    u.uTime.value = e.time;
    u.uFlash.value = e.flash;
    mesh?.position.copy(cam.position);
}

export interface WakeTrail {
    /** x, z og styrke for 24 punkter bak skipet (nyeste først). */
    pts: THREE.Vector3[];
}

export function Ocean({ envRef, wake }: { envRef: React.MutableRefObject<Env>; wake: WakeTrail }) {
    const q = useQuality();
    const geo = useMemo(
        () =>
            q.tier === 'lav'
                ? polarGrid(70, 110, 6000)
                : q.tier === 'middels'
                  ? polarGrid(96, 150, 6000)
                  : polarGrid(128, 200, 6000),
        [q.tier]
    );
    const mat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader: oceanVert,
                fragmentShader: oceanFrag,
                uniforms: {
                    ...waveUniforms(),
                    uTime: { value: 0 },
                    uScale: { value: 0.4 },
                    uCenter: { value: new THREE.Vector2() },
                    uSun: { value: new THREE.Vector3(0, 1, 0) },
                    uSunColor: { value: new THREE.Color() },
                    uSunStrength: { value: 1 },
                    uTop: { value: new THREE.Color() },
                    uHor: { value: new THREE.Color() },
                    uDeep: { value: new THREE.Color() },
                    uShallow: { value: new THREE.Color() },
                    uFogColor: { value: new THREE.Color() },
                    uFogDensity: { value: 0.0004 },
                    uDay: { value: 1 },
                    uFlash: { value: 0 },
                    uWake: { value: wake.pts },
                },
            }),
        [wake]
    );
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => oceanFrame(mat, envRef.current, state.camera));
    return <mesh ref={ref} geometry={geo} material={mat} frustumCulled={false} renderOrder={-1} />;
}

// ---------------------------------------------------------------------------
// Himmelen: gradient, sol, skyer som driver, stjerner om natta.
// ---------------------------------------------------------------------------

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
    vDir = position;
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
}
`;

const skyFrag = /* glsl */ `
uniform vec3 uSun;
uniform vec3 uSunColor;
uniform float uSunStrength;
uniform vec3 uTop;
uniform vec3 uHor;
uniform vec3 uFogColor;
uniform float uFog;
uniform float uCloud;
uniform float uNight;
uniform float uTime;
uniform float uFlash;
varying vec3 vDir;
${noise}
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < OCTAVES; i++) {
        v += a * vnoise(p);
        p = p * 2.03 + 11.7;
        a *= 0.5;
    }
    return v;
}
void main() {
    vec3 d = normalize(vDir);
    float up = clamp(d.y, 0.0, 1.0);
    vec3 col = mix(uHor, uTop, pow(up, 0.55));
    float sd = max(dot(d, uSun), 0.0);
    // Sola: skive og glød. Lav sol gir bred, varm glød langs horisonten.
    float disk = smoothstep(0.9993, 0.9997, sd);
    float glow = pow(sd, 8.0) * 0.45 + pow(sd, 64.0) * 0.6;
    col += uSunColor * (glow * (0.4 + 0.6 * uSunStrength) + disk * 6.0 * uSunStrength) * step(-0.02, uSun.y);

    // Stjerner.
    if (uNight > 0.01) {
        vec3 c = floor(d * 260.0);
        float h = fract(sin(dot(c, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float star = step(0.9965, h) * (0.6 + 0.4 * sin(uTime * 3.0 + h * 90.0));
        col += vec3(0.9, 0.93, 1.0) * star * uNight * up * (1.0 - uCloud);
    }

    // Skyer: en flate over havet, sett fra under.
    if (d.y > 0.0) {
        vec2 uv = d.xz / (d.y + 0.12) * 0.9 + vec2(uTime * 0.01, uTime * 0.025);
        float n = fbm(uv);
        float cover = smoothstep(1.0 - uCloud * 0.85 - 0.15, 1.05 - uCloud * 0.5, n);
        float lit = clamp(dot(normalize(vec3(uSun.x, 0.4, uSun.z)), vec3(d.x, 0.0, d.z)) * 0.5 + 0.5, 0.0, 1.0);
        vec3 cloudCol = mix(uHor * 0.55, mix(vec3(1.0), uSunColor, 0.5), lit * (1.0 - uCloud * 0.6));
        cloudCol = mix(cloudCol, uTop * 0.8, uCloud * 0.45) * (0.25 + 0.75 * (1.0 - uNight));
        col = mix(col, cloudCol, cover * smoothstep(0.0, 0.12, d.y));
    }

    col = mix(col, uFogColor, clamp(uFog + (1.0 - smoothstep(-0.05, 0.18, d.y)) * 0.65, 0.0, 1.0));
    col += vec3(0.7, 0.78, 1.0) * uFlash * 0.8;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export function Sky({ envRef }: { envRef: React.MutableRefObject<Env> }) {
    const q = useQuality();
    const mat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader: skyVert,
                fragmentShader: skyFrag,
                defines: { OCTAVES: q.tier === 'lav' ? 3 : 5 },
                side: THREE.BackSide,
                depthWrite: false,
                depthTest: false,
                uniforms: {
                    uSun: { value: new THREE.Vector3(0, 1, 0) },
                    uSunColor: { value: new THREE.Color() },
                    uSunStrength: { value: 1 },
                    uTop: { value: new THREE.Color() },
                    uHor: { value: new THREE.Color() },
                    uFogColor: { value: new THREE.Color() },
                    uFog: { value: 0 },
                    uCloud: { value: 0.3 },
                    uNight: { value: 0 },
                    uTime: { value: 0 },
                    uFlash: { value: 0 },
                },
            }),
        [q.tier]
    );
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => skyFrame(mat, envRef.current, ref.current, state.camera));
    return (
        <mesh
            ref={ref}
            material={mat}
            frustumCulled={false}
            renderOrder={-2}
            userData={{ sceneAuditIgnore: true }}
        >
            <sphereGeometry args={[100, 32, 16]} />
        </mesh>
    );
}
