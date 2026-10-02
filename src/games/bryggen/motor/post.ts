// Etterbehandling: ett pass over hele bildet, bare på full kvalitet.
//
// Scenen tegnes først til en bildebuffer med nøyaktig de samme pikslene den ville fått på
// skjermen (tonekurve, sRGB og tåke på samme sted i kjeden), og så tegner ett skjermdekkende
// triangel det ferdige bildet:
//   1. kantutjevning (FXAA, lett variant): rendereren har ingen MSAA, så kantene på
//      laftestokkene og takene hakker ellers,
//   2. fargetone for et regnvått Bergen: kjølige skygger, litt varmere lys, litt mindre metning,
//      og varmere inne ved ilden,
//   3. vignett og svakt filmkorn som rører seg (ellers ser flate grå flater døde ut).
//
// Alt i én shader: ett ekstra tegnekall og én lesning av bufferen per piksel (fem på kanter).
//
// Hvorfor bufferen later som den er en XR-buffer: Three tonemapper og sRGB-koder bare når det
// tegnes rett til skjermen (eller til en XR-buffer). Til en vanlig buffer blir tåka blandet inn
// i lineært lys før tonekurven, og da blir alt i tåka lysere og blåere enn det eieren godkjente.
// Med `isXRRenderTarget` gjør Three nøyaktig det samme som mot skjermen.
import * as THREE from 'three';

export class Etterbehandling {
    private readonly rt: THREE.WebGLRenderTarget;
    private readonly mat: THREE.ShaderMaterial;
    private readonly quad: THREE.Mesh;
    private readonly cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    private readonly size = new THREE.Vector2();

    constructor() {
        this.rt = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
        this.rt.texture.colorSpace = THREE.SRGBColorSpace;
        (this.rt as THREE.WebGLRenderTarget & { isXRRenderTarget: boolean }).isXRRenderTarget = true;
        this.mat = new THREE.ShaderMaterial({
            uniforms: {
                tBilde: { value: this.rt.texture },
                uPx: { value: new THREE.Vector2(1, 1) },
                uTid: { value: 0 },
                uInne: { value: 0 },
            },
            vertexShader: /* glsl */ `
                varying vec2 vUv;
                void main() {
                    vUv = position.xy * 0.5 + 0.5;
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }`,
            fragmentShader: POST_GLSL,
            depthTest: false,
            depthWrite: false,
            toneMapped: false,
        });
        // Ett triangel som dekker hele skjermen (ingen diagonal søm som med to).
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
        this.quad = new THREE.Mesh(geo, this.mat);
        this.quad.frustumCulled = false;
    }

    /** `inne` 0..1: inne i et rom blir bildet varmere og vignetten tyngre. */
    render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, t: number, inne: number): void {
        renderer.getDrawingBufferSize(this.size);
        if (this.rt.width !== this.size.x || this.rt.height !== this.size.y) {
            this.rt.setSize(this.size.x, this.size.y);
            this.mat.uniforms.uPx.value.set(1 / this.size.x, 1 / this.size.y);
        }
        const u = this.mat.uniforms;
        u.uTid.value = t % 100;
        u.uInne.value = inne;
        const prev = renderer.getRenderTarget();
        renderer.setRenderTarget(this.rt);
        renderer.render(scene, camera);
        renderer.setRenderTarget(prev);
        renderer.render(this.quad, this.cam);
    }

    dispose(): void {
        this.rt.dispose();
        this.mat.dispose();
        this.quad.geometry.dispose();
    }
}

const POST_GLSL = /* glsl */ `
uniform sampler2D tBilde; // ferdige skjermpiksler (sRGB)
uniform vec2 uPx;
uniform float uTid;
uniform float uInne;
varying vec2 vUv;

vec3 px(vec2 uv) {
    return texture2D(tBilde, uv).rgb;
}

float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
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

void main() {
    vec3 c = fxaa(vUv);
    float l = luma(c);
    // Fargetone: skyggene mot kaldt blågrått, lyset litt varmt. Inne: varmere overalt (ildlys).
    vec3 skygge = mix(vec3(0.97, 1.0, 1.03), vec3(1.04, 0.99, 0.93), uInne);
    vec3 lys = mix(vec3(1.02, 1.005, 0.98), vec3(1.05, 1.0, 0.94), uInne);
    c *= mix(skygge, lys, smoothstep(0.15, 0.75, l));
    // Litt mindre metning, og en mild S-kurve for kontrast.
    c = mix(vec3(l), c, 0.92);
    c = clamp(c, 0.0, 1.0);
    c = mix(c, c * c * (3.0 - 2.0 * c), 0.15);
    // Vignett: mørkere hjørner, tyngre inne.
    vec2 d = vUv - 0.5;
    c *= 1.0 - dot(d, d) * mix(0.4, 0.8, uInne);
    // Filmkorn, likt i mørke og lyse partier.
    c += (korn(gl_FragCoord.xy) - 0.5) * 0.02;
    gl_FragColor = vec4(c, 1.0);
}
`;
