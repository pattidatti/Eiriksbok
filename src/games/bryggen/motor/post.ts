// Etterbehandling: bare på full kvalitet.
//
// Scenen tegnes først til en bildebuffer med nøyaktig de samme pikslene den ville fått på
// skjermen (tonekurve, sRGB og tåke på samme sted i kjeden), og med dybden i en egen tekstur.
// Så kommer noen små pass i lav oppløsning, og til slutt ett pass i full oppløsning som setter
// alt sammen:
//   1. SSAO (halv oppløsning): mørke i hjørner, under takskjegg og der ting står på bakken.
//      Lav polycount ser «2004» ut mest fordi ingenting ser ut til å stå PÅ noe. Dybden gir
//      oss kontaktskyggene uten å røre geometrien. Tones ut i tåka, så det ikke blir glorier.
//   2. Glød (kvart og åttendels oppløsning): det som er nesten hvitt (sola, himmelen bak
//      takene, glitter i vannet, døra inn til bua sett innenfra) blør litt ut.
//   3. Lysstråler (kvart oppløsning): når sola står i bildet, trekkes himmelen bak husene i
//      striper ut fra sola. Passet hoppes over når sola ikke synes.
//   4. Sluttbildet: kantutjevning (FXAA), SSAO, solglød i tåka (lyset sprer seg mest mot
//      sola), dis lavt over Vågen, glød og stråler, fargetone, vignett og filmkorn.
//
// Hvorfor bufferen later som den er en XR-buffer: Three tonemapper og sRGB-koder bare når det
// tegnes rett til skjermen (eller til en XR-buffer). Til en vanlig buffer blir tåka blandet inn
// i lineært lys før tonekurven, og da blir alt i tåka lysere og blåere enn det eieren godkjente.
// Med `isXRRenderTarget` gjør Three nøyaktig det samme som mot skjermen.
import * as THREE from 'three';
import type { Stemning } from './stemning';
import { WATER_Y } from './boat';

/** Fargen slik den står i stemningen (sRGB-tallene), til shadere som jobber i skjermfarger. */
const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);

export class Etterbehandling {
    private readonly rt: THREE.WebGLRenderTarget;
    private readonly ao: THREE.WebGLRenderTarget;
    private readonly aoBlur: THREE.WebGLRenderTarget;
    private readonly b4: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
    private readonly b8: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
    private readonly straaler: THREE.WebGLRenderTarget;
    private readonly quad: THREE.Mesh;
    private readonly cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    private readonly size = new THREE.Vector2();
    private readonly mAo: THREE.ShaderMaterial;
    private readonly mAoBlur: THREE.ShaderMaterial;
    private readonly mLys: THREE.ShaderMaterial;
    private readonly mBlur: THREE.ShaderMaterial;
    private readonly mStraaler: THREE.ShaderMaterial;
    private readonly mFinal: THREE.ShaderMaterial;
    private readonly solRetning = new THREE.Vector3(0, 1, 0);
    private readonly _v = new THREE.Vector3();
    private readonly _f = new THREE.Vector3();
    /** Hvilke pass som kjører (for å måle hva hvert av dem koster). */
    readonly paa = { ao: true, glod: true, straaler: true, visAo: false };

    constructor(s: Stemning, solRetning: THREE.Vector3) {
        this.solRetning.copy(solRetning);
        const opts = { depthBuffer: false, type: THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
        this.rt = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
        this.rt.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
        this.rt.texture.colorSpace = THREE.SRGBColorSpace;
        (this.rt as THREE.WebGLRenderTarget & { isXRRenderTarget: boolean }).isXRRenderTarget = true;
        this.ao = new THREE.WebGLRenderTarget(1, 1, opts);
        this.aoBlur = new THREE.WebGLRenderTarget(1, 1, opts);
        this.b4 = [new THREE.WebGLRenderTarget(1, 1, opts), new THREE.WebGLRenderTarget(1, 1, opts)];
        this.b8 = [new THREE.WebGLRenderTarget(1, 1, opts), new THREE.WebGLRenderTarget(1, 1, opts)];
        this.straaler = new THREE.WebGLRenderTarget(1, 1, opts);

        const dybde = this.rt.depthTexture;
        const lag = (frag: string, uniforms: Record<string, THREE.IUniform>) =>
            new THREE.ShaderMaterial({
                uniforms: {
                    tDybde: { value: dybde },
                    uNear: { value: 0.1 },
                    uFar: { value: 160 },
                    uProjInv: { value: new THREE.Matrix4() },
                    ...uniforms,
                },
                vertexShader: VERT,
                fragmentShader: FELLES_GLSL + frag,
                depthTest: false,
                depthWrite: false,
                toneMapped: false,
            });
        this.mAo = lag(AO_GLSL, { uPx: { value: new THREE.Vector2() }, uProjSkala: { value: 1 } });
        this.mAoBlur = lag(AO_BLUR_GLSL, { tAo: { value: this.ao.texture }, uPx: { value: new THREE.Vector2() } });
        this.mLys = lag(LYS_GLSL, { tBilde: { value: this.rt.texture }, uPx: { value: new THREE.Vector2() }, uTerskel: { value: 0.72 } });
        this.mBlur = lag(BLUR_GLSL, { tKilde: { value: null }, uRetning: { value: new THREE.Vector2() } });
        this.mStraaler = lag(STRAALER_GLSL, { tBilde: { value: this.rt.texture }, uSolUv: { value: new THREE.Vector2() } });
        this.mFinal = lag(FINAL_GLSL, {
            tBilde: { value: this.rt.texture },
            tAo: { value: this.aoBlur.texture },
            tB4: { value: this.b4[1].texture },
            tB8: { value: this.b8[1].texture },
            tStraaler: { value: this.straaler.texture },
            uPx: { value: new THREE.Vector2(1, 1) },
            uTid: { value: 0 },
            uInne: { value: 0 },
            uKamMatrise: { value: new THREE.Matrix4() },
            uKamPos: { value: new THREE.Vector3() },
            uSol: { value: this.solRetning },
            uSolFarge: { value: srgb(s.solFarge) },
            uGlod: { value: s.solGlod },
            uTakeTetthet: { value: s.takeTetthet },
            uDis: { value: s.dis },
            uDisFarge: { value: srgb(s.takeFarge).lerp(srgb(s.solFarge), 0.15 * s.solGlod) },
            uVannY: { value: WATER_Y },
            uStraalerStyrke: { value: 0 },
            uBloom: { value: 1 },
            uBrukAo: { value: true },
            uVisAo: { value: false },
        });
        // Ett triangel som dekker hele skjermen (ingen diagonal søm som med to).
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
        this.quad = new THREE.Mesh(geo, this.mFinal);
        this.quad.frustumCulled = false;
        if (import.meta.env.DEV) Object.assign(window, { __bryggenPost: this });
    }

    private setSize(w: number, h: number): void {
        this.rt.setSize(w, h);
        const h2 = [Math.max(1, w >> 1), Math.max(1, h >> 1)] as const;
        const h4 = [Math.max(1, w >> 2), Math.max(1, h >> 2)] as const;
        const h8 = [Math.max(1, w >> 3), Math.max(1, h >> 3)] as const;
        this.ao.setSize(...h2);
        this.aoBlur.setSize(...h2);
        this.b4.forEach((r) => r.setSize(...h4));
        this.b8.forEach((r) => r.setSize(...h8));
        this.straaler.setSize(...h4);
        this.mFinal.uniforms.uPx.value.set(1 / w, 1 / h);
        this.mAo.uniforms.uPx.value.set(1 / w, 1 / h);
        this.mAoBlur.uniforms.uPx.value.set(1 / h2[0], 1 / h2[1]);
        this.mLys.uniforms.uPx.value.set(1 / w, 1 / h);
    }

    private pass(renderer: THREE.WebGLRenderer, mat: THREE.ShaderMaterial, mål: THREE.WebGLRenderTarget | null): void {
        this.quad.material = mat;
        renderer.setRenderTarget(mål);
        renderer.render(this.quad, this.cam);
    }

    private blur(renderer: THREE.WebGLRenderer, par: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget], kilde: THREE.Texture): void {
        const u = this.mBlur.uniforms;
        u.tKilde.value = kilde;
        u.uRetning.value.set(1 / par[0].width, 0);
        this.pass(renderer, this.mBlur, par[0]);
        u.tKilde.value = par[0].texture;
        u.uRetning.value.set(0, 1 / par[0].height);
        this.pass(renderer, this.mBlur, par[1]);
    }

    /** `inne` 0..1: inne i et rom blir bildet varmere og vignetten tyngre. */
    render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, t: number, inne: number): void {
        renderer.getDrawingBufferSize(this.size);
        if (this.rt.width !== this.size.x || this.rt.height !== this.size.y) this.setSize(this.size.x, this.size.y);
        const prev = renderer.getRenderTarget();
        renderer.setRenderTarget(this.rt);
        renderer.render(scene, camera);

        // Felles kameradata: alle passene leser dybden.
        for (const m of [this.mAo, this.mAoBlur, this.mLys, this.mStraaler, this.mFinal]) {
            m.uniforms.uNear.value = camera.near;
            m.uniforms.uFar.value = camera.far;
            m.uniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
        }
        this.mAo.uniforms.uProjSkala.value = camera.projectionMatrix.elements[5] * this.size.y * 0.5;
        const u = this.mFinal.uniforms;
        u.uBrukAo.value = this.paa.ao;
        u.uVisAo.value = this.paa.visAo;
        if (this.paa.ao) {
            this.pass(renderer, this.mAo, this.ao);
            this.pass(renderer, this.mAoBlur, this.aoBlur);
        }
        u.uBloom.value = this.paa.glod ? 1 : 0;
        if (this.paa.glod) {
            this.pass(renderer, this.mLys, this.b4[1]);
            this.blur(renderer, this.b4, this.b4[1].texture);
            this.blur(renderer, this.b8, this.b4[1].texture);
        }

        // Lysstråler bare når sola står foran kameraet og nær bildet.
        camera.getWorldDirection(this._f);
        const foran = this._f.dot(this.solRetning);
        let straaler = 0;
        if (this.paa.straaler && foran > 0.2 && u.uGlod.value > 0 && inne < 0.5) {
            this._v.copy(camera.position).addScaledVector(this.solRetning, 100).project(camera);
            const ut = Math.max(Math.abs(this._v.x), Math.abs(this._v.y));
            straaler = THREE.MathUtils.smoothstep(foran, 0.2, 0.6) * (1 - THREE.MathUtils.smoothstep(ut, 0.9, 1.8)) * (1 - inne * 2);
            if (straaler > 0.01) {
                this.mStraaler.uniforms.uSolUv.value.set(this._v.x * 0.5 + 0.5, this._v.y * 0.5 + 0.5);
                this.pass(renderer, this.mStraaler, this.straaler);
            } else straaler = 0;
        }

        u.uStraalerStyrke.value = straaler * u.uGlod.value;
        u.uTid.value = t % 100;
        u.uInne.value = inne;
        u.uKamMatrise.value.copy(camera.matrixWorld);
        u.uKamPos.value.copy(camera.position);
        if (scene.fog instanceof THREE.FogExp2) u.uTakeTetthet.value = scene.fog.density;
        this.pass(renderer, this.mFinal, prev);
    }

    dispose(): void {
        for (const r of [this.rt, this.ao, this.aoBlur, ...this.b4, ...this.b8, this.straaler]) r.dispose();
        this.rt.depthTexture?.dispose();
        for (const m of [this.mAo, this.mAoBlur, this.mLys, this.mBlur, this.mStraaler, this.mFinal]) m.dispose();
        this.quad.geometry.dispose();
    }
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// Dybden: kamerarom-posisjonen til en piksel, og om den er himmel.
const FELLES_GLSL = /* glsl */ `
#include <packing>
uniform sampler2D tDybde;
uniform float uNear;
uniform float uFar;
uniform mat4 uProjInv;
varying vec2 vUv;

float dybde(vec2 uv) {
    return texture2D(tDybde, uv).x;
}

float viewZ(float d) {
    return perspectiveDepthToViewZ(d, uNear, uFar);
}

vec3 viewPos(vec2 uv, float d) {
    vec4 p = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
    return p.xyz / p.w;
}

float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

// Interleaved gradient noise: ulik vinkel per piksel, som uskarpheten etterpå jevner ut.
float ign(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}
`;

// SSAO etter «Alchemy»/SAO: åtte prøver i en spiral rundt pikselen, innenfor en halvkule på
// ca. 0,9 m. Normalen regnes ut av dybden selv.
const AO_GLSL = /* glsl */ `
uniform vec2 uPx;
uniform float uProjSkala;
const float R = 0.9;
const int N = 8;
void main() {
    float d = dybde(vUv);
    if (d >= 1.0) { gl_FragColor = vec4(1.0); return; }
    vec3 P = viewPos(vUv, d);
    vec3 n = normalize(cross(dFdx(P), dFdy(P)));
    if (dot(n, P) > 0.0) n = -n;
    float rPx = clamp(R * uProjSkala / -P.z, 3.0, 90.0);
    float a0 = ign(gl_FragCoord.xy) * 6.2831;
    float sum = 0.0;
    for (int i = 0; i < N; i++) {
        float t = (float(i) + 0.5) / float(N);
        float a = a0 + float(i) * 2.39996;
        vec2 uv = vUv + vec2(cos(a), sin(a)) * rPx * t * uPx;
        float dq = dybde(uv);
        vec3 v = viewPos(uv, dq) - P;
        float vv = dot(v, v);
        float fall = max(0.0, 1.0 - vv / (R * R));
        sum += max(0.0, dot(v, n) - 0.012 * -P.z) / (vv + 0.01) * fall;
    }
    float ao = max(0.0, 1.0 - sum * (0.45 * 2.0 / float(N)));
    gl_FragColor = vec4(vec3(ao * ao), 1.0);
}
`;

// 4×4 uskarphet som ikke blør over kanter i dybden.
const AO_BLUR_GLSL = /* glsl */ `
uniform sampler2D tAo;
uniform vec2 uPx;
void main() {
    float z0 = viewZ(dybde(vUv));
    float sum = 0.0;
    float w = 0.0;
    for (int x = -2; x < 2; x++) {
        for (int y = -2; y < 2; y++) {
            vec2 uv = vUv + (vec2(float(x), float(y)) + 0.5) * uPx;
            float z = viewZ(dybde(uv));
            float k = max(0.0, 1.0 - abs(z - z0) / (0.04 * -z0 + 0.05));
            sum += texture2D(tAo, uv).r * k;
            w += k;
        }
    }
    gl_FragColor = vec4(vec3(w > 0.0 ? sum / w : 1.0), 1.0);
}
`;

// Det lyseste i bildet, i kvart oppløsning (fire prøver per piksel).
const LYS_GLSL = /* glsl */ `
uniform sampler2D tBilde;
uniform vec2 uPx;
uniform float uTerskel;
void main() {
    vec3 c = vec3(0.0);
    c += texture2D(tBilde, vUv + vec2(-1.0, -1.0) * uPx).rgb;
    c += texture2D(tBilde, vUv + vec2(1.0, -1.0) * uPx).rgb;
    c += texture2D(tBilde, vUv + vec2(-1.0, 1.0) * uPx).rgb;
    c += texture2D(tBilde, vUv + vec2(1.0, 1.0) * uPx).rgb;
    c *= 0.25;
    float l = luma(c);
    float k = smoothstep(uTerskel, 1.0, l);
    gl_FragColor = vec4(c * k, 1.0);
}
`;

// Gauss i én retning, ni prøver hentet med fem oppslag (lineær filtrering tar to om gangen).
const BLUR_GLSL = /* glsl */ `
uniform sampler2D tKilde;
uniform vec2 uRetning;
void main() {
    vec3 c = texture2D(tKilde, vUv).rgb * 0.2270270;
    c += texture2D(tKilde, vUv + uRetning * 1.3846153).rgb * 0.3162162;
    c += texture2D(tKilde, vUv - uRetning * 1.3846153).rgb * 0.3162162;
    c += texture2D(tKilde, vUv + uRetning * 3.2307692).rgb * 0.0702702;
    c += texture2D(tKilde, vUv - uRetning * 3.2307692).rgb * 0.0702702;
    gl_FragColor = vec4(c, 1.0);
}
`;

// Lysstråler: gå fra pikselen mot sola og samle opp lys himmel. Der husene står i veien,
// blir det mørke striper.
const STRAALER_GLSL = /* glsl */ `
uniform sampler2D tBilde;
uniform vec2 uSolUv;
const int N = 28;
void main() {
    vec2 steg = (uSolUv - vUv) / float(N) * 0.85;
    vec2 uv = vUv + steg * ign(gl_FragCoord.xy);
    float sum = 0.0;
    float vekt = 1.0;
    for (int i = 0; i < N; i++) {
        uv += steg;
        vec2 k = clamp(uv, 0.0, 1.0);
        float himmel = step(0.99999, dybde(k));
        sum += max(0.0, luma(texture2D(tBilde, k).rgb) - 0.5) * himmel * vekt;
        vekt *= 0.95;
    }
    float naer = 1.0 - smoothstep(0.0, 0.75, distance(vUv * vec2(1.6, 1.0), uSolUv * vec2(1.6, 1.0)));
    gl_FragColor = vec4(vec3(sum / float(N) * 2.2 * naer), 1.0);
}
`;

const FINAL_GLSL = /* glsl */ `
uniform sampler2D tBilde; // ferdige skjermpiksler (sRGB)
uniform sampler2D tAo;
uniform sampler2D tB4;
uniform sampler2D tB8;
uniform sampler2D tStraaler;
uniform vec2 uPx;
uniform float uTid;
uniform float uInne;
uniform mat4 uKamMatrise;
uniform vec3 uKamPos;
uniform vec3 uSol;
uniform vec3 uSolFarge;
uniform float uGlod;
uniform float uTakeTetthet;
uniform float uDis;
uniform vec3 uDisFarge;
uniform float uVannY;
uniform float uStraalerStyrke;
uniform float uBloom;
uniform bool uBrukAo;
uniform bool uVisAo;

vec3 px(vec2 uv) {
    return texture2D(tBilde, uv).rgb;
}

// Lett FXAA: finn kanten fra fire naboer, og les to ganger langs den.
vec3 fxaa(vec2 uv) {
    vec3 cM = px(uv);
    vec3 cNW = px(uv + vec2(-1.0, -1.0) * uPx);
    vec3 cNE = px(uv + vec2(1.0, -1.0) * uPx);
    vec3 cSW = px(uv + vec2(-1.0, 1.0) * uPx);
    vec3 cSE = px(uv + vec2(1.0, 1.0) * uPx);
    float lM = luma(cM), lNW = luma(cNW), lNE = luma(cNE), lSW = luma(cSW), lSE = luma(cSE);
    float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
    float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
    if (lMax - lMin < max(0.04, lMax * 0.12)) return cM;
    vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
    float red = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
    float inv = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
    dir = clamp(dir * inv, vec2(-8.0), vec2(8.0)) * uPx;
    vec3 a = 0.5 * (px(uv + dir * (1.0 / 3.0 - 0.5)) + px(uv + dir * (2.0 / 3.0 - 0.5)));
    vec3 b = a * 0.5 + 0.25 * (px(uv - dir * 0.5) + px(uv + dir * 0.5));
    float lB = luma(b);
    return (lB < lMin || lB > lMax) ? a : b;
}

float korn(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTid * 7.13) * 43758.5453);
}

float fHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float fStoy(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(fHash(i), fHash(i + vec2(1.0, 0.0)), f.x), mix(fHash(i + vec2(0.0, 1.0)), fHash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    vec3 c = fxaa(vUv);
    float d = dybde(vUv);
    bool himmel = d >= 1.0;
    vec3 P = viewPos(vUv, himmel ? 0.9999 : d);
    float avstand = -P.z;
    // Retningen fra kameraet i verdensrom.
    vec3 dir = normalize((uKamMatrise * vec4(P, 0.0)).xyz);
    // Hvor mye tåke det er i pikselen: samme formel som FogExp2.
    float tf = himmel ? 1.0 : 1.0 - exp(-uTakeTetthet * uTakeTetthet * avstand * avstand);

    // Kontaktskyggene, borte i tåka.
    float ao = uBrukAo ? texture2D(tAo, vUv).r : 1.0;
    if (uVisAo) { gl_FragColor = vec4(vec3(ao), 1.0); return; }
    c *= mix(1.0, ao, (1.0 - tf) * (1.0 - uInne * 0.3));

    // Dis lavt over Vågen: tykkest nede ved vannet og langt unna, driver sakte.
    vec3 W = himmel ? uKamPos + dir * 140.0 : uKamPos + dir * length(P);
    float lav = exp(-max(W.y - uVannY, 0.0) * 0.55);
    float drift = 0.55 + 0.45 * fStoy(W.xz * 0.045 + vec2(uTid * 0.04, uTid * 0.015));
    float dis = uDis * lav * drift * (1.0 - exp(-length(W - uKamPos) * 0.012)) * (1.0 - uInne);
    if (himmel) dis = uDis * 0.5 * exp(-abs(dir.y) * 14.0) * drift * (1.0 - uInne);
    c = mix(c, uDisFarge, clamp(dis * 0.5, 0.0, 0.8));

    // Sola lyser opp tåka: mest rett mot sola, og bare så mye som det er tåke i pikselen.
    float mot = max(dot(dir, uSol), 0.0);
    vec3 glod = uSolFarge * uGlod * (pow(mot, 5.0) * 0.2 + pow(mot, 40.0) * 0.45) * tf * (1.0 - uInne);
    c = 1.0 - (1.0 - c) * (1.0 - clamp(glod, 0.0, 1.0));

    // Glød og stråler.
    vec3 bloom = texture2D(tB4, vUv).rgb * 0.55 + texture2D(tB8, vUv).rgb * 0.8;
    c += bloom * uBloom * 0.6;
    c += uSolFarge * texture2D(tStraaler, vUv).r * uStraalerStyrke;

    float l = luma(c);
    // Fargetone: skyggene mot kaldt blågrått, lyset litt varmt. Inne: varmere overalt (ildlys).
    vec3 skygge = mix(vec3(0.95, 0.99, 1.05), vec3(1.04, 0.99, 0.93), uInne);
    vec3 lys = mix(vec3(1.03, 1.0, 0.96), vec3(1.05, 1.0, 0.94), uInne);
    c *= mix(skygge, lys, smoothstep(0.15, 0.75, l));
    // Litt mindre metning, og en mild S-kurve for kontrast.
    c = mix(vec3(l), c, 0.95);
    c = clamp(c, 0.0, 1.0);
    c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);
    // Vignett: mørkere hjørner, tyngre inne.
    vec2 v = vUv - 0.5;
    c *= 1.0 - dot(v, v) * mix(0.45, 0.8, uInne);
    // Filmkorn, likt i mørke og lyse partier.
    c += (korn(gl_FragCoord.xy) - 0.5) * 0.02;
    gl_FragColor = vec4(c, 1.0);
}
`;
