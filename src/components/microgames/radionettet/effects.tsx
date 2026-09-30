import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit';
import type { G, Fx } from './game';
import { SLAG } from './levels';
import { consume, MAX_PUFF, MAX_SCORCH, type FxPool } from './fxPool';

// Tegner partiklene fra fxPool.ts med tre instanserte mesher: myk røyk og støv (vanlig
// blanding), ild og glimt (additiv, gløder), og brannflekkene flatt på bakken.
// Hver partikkel har egen farge og tetthet (egne instans-attributter i en liten shader).

/** Klumpete sky: flere myke kuler, lysere oppe til venstre der sola står. */
function smokeTexture() {
    const S = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d')!;
    let s = 17;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 14; i++) {
        const a = r() * Math.PI * 2;
        const d = r() * 22;
        const x = S / 2 + Math.cos(a) * d;
        const y = S / 2 + Math.sin(a) * d;
        const rr = 20 + r() * 20;
        const g = c.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 0, x, y, rr);
        g.addColorStop(0, 'rgba(255,255,255,.55)');
        g.addColorStop(0.6, 'rgba(205,205,205,.35)');
        g.addColorStop(1, 'rgba(170,170,170,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, S, S);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function glowTexture() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d')!;
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
}

/** Svidd flekk: mørk midte, ujevn kant, litt aske. */
function scorchTexture() {
    const S = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d')!;
    let s = 29;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 18; i++) {
        const a = r() * Math.PI * 2;
        const d = r() * 26;
        const x = S / 2 + Math.cos(a) * d;
        const y = S / 2 + Math.sin(a) * d;
        const rr = 14 + r() * 26;
        const g = c.createRadialGradient(x, y, 0, x, y, rr);
        g.addColorStop(0, 'rgba(20,16,12,.16)');
        g.addColorStop(1, 'rgba(20,16,12,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, S, S);
    }
    return new THREE.CanvasTexture(cv);
}

const VERT = /* glsl */ `
attribute vec3 aCol;
attribute float aAlpha;
varying vec2 vUv;
varying vec3 vCol;
varying float vA;
void main() {
    vUv = uv;
    vCol = aCol;
    vA = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */ `
uniform sampler2D map;
varying vec2 vUv;
varying vec3 vCol;
varying float vA;
void main() {
    vec4 t = texture2D(map, vUv);
    float a = t.a * vA;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vCol * t.rgb, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;

function particleMesh(map: THREE.Texture, max: number, additive: boolean, toneMapped: boolean) {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3));
    geo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(new Float32Array(max), 1));
    const mat = new THREE.ShaderMaterial({
        uniforms: { map: { value: map } },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        toneMapped,
    });
    const m = new THREE.InstancedMesh(geo, mat, max);
    m.frustumCulled = false;
    m.count = 0;
    return m;
}

const DUST: Record<string, string> = { dunkerque: '#8f8672', alamein: '#c6ad80', kursk: '#8a7658' };

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const Z = new THREE.Vector3(0, 0, 1);
const QZ = new THREE.Quaternion();
const FLAT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

export function Effects({ gRef, fxRef, speedRef }: { gRef: React.MutableRefObject<G>; fxRef: React.MutableRefObject<FxPool>; speedRef: React.MutableRefObject<number> }) {
    const seen = useMemo(() => new WeakSet<Fx>(), []);
    const meshes = useMemo(
        () => ({
            smoke: particleMesh(smokeTexture(), MAX_PUFF, false, true),
            glow: particleMesh(glowTexture(), 160, true, false),
        }),
        []
    );
    const scorchTex = useMemo(() => scorchTexture(), []);
    const scorchRef = useRef<THREE.InstancedMesh>(null);
    const slag = useRef(-1);
    const q = useQuality();
    useLayoutEffect(() => {
        fxRef.current.setScale(q.particleScale);
    }, [fxRef, q.particleScale]);
    useFrame((st, raw) => {
        const dt = Math.min(0.05, raw) * speedRef.current;
        const fx = fxRef.current;
        const g = gRef.current;
        if (g.slag !== slag.current) {
            slag.current = g.slag;
            fx.clearScorch();
            fx.setDust(DUST[SLAG[g.slag]?.id] ?? '#b5a17c');
        }
        consume(g, fx, seen);
        fx.step(dt);
        const lists = [meshes.smoke, meshes.glow];
        const n = [0, 0];
        for (const p of fx.puffs) {
            if (!p.on) continue;
            const li = p.glow ? 1 : 0;
            const m = lists[li];
            const i = n[li];
            if (i >= (li ? 160 : MAX_PUFF)) continue;
            const k = p.t / p.life;
            // Vokser raskt først, så sakte; tettheten kommer fort og blekner mot slutten.
            const grow = 1 - (1 - Math.min(1, k)) ** 2.5;
            const r = (p.r0 + (p.r1 - p.r0) * grow) * 2.3;
            const a = p.fall ? (k < 0.8 ? 1 : (1 - k) / 0.2) : p.glow ? (1 - k) ** 1.4 : Math.min(1, k * 8) * (1 - k) ** 1.3;
            QZ.setFromAxisAngle(Z, p.spin + p.t * 0.3);
            Q.copy(st.camera.quaternion).multiply(QZ);
            M.compose(P.set(p.x, p.y, p.z), Q, S.set(r, r, r));
            m.setMatrixAt(i, M);
            const col = m.geometry.getAttribute('aCol') as THREE.InstancedBufferAttribute;
            const al = m.geometry.getAttribute('aAlpha') as THREE.InstancedBufferAttribute;
            col.setXYZ(i, p.col.r, p.col.g, p.col.b);
            al.setX(i, a * p.a);
            n[li]++;
        }
        lists.forEach((m, li) => {
            m.count = n[li];
            m.instanceMatrix.needsUpdate = true;
            m.geometry.getAttribute('aCol').needsUpdate = true;
            m.geometry.getAttribute('aAlpha').needsUpdate = true;
        });
        const sm = scorchRef.current;
        if (sm) {
            let c = 0;
            for (const s of fx.scorches) {
                if (!s.on) continue;
                QZ.setFromAxisAngle(Z, s.rot);
                Q.copy(FLAT).multiply(QZ);
                M.compose(P.set(s.x, 0.008 + c * 0.00005, s.z), Q, S.set(s.r * 2, s.r * 2, 1));
                sm.setMatrixAt(c++, M);
            }
            sm.count = c;
            sm.instanceMatrix.needsUpdate = true;
        }
    });
    return (
        <>
            <instancedMesh ref={scorchRef} args={[undefined, undefined, MAX_SCORCH]} frustumCulled={false}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={scorchTex} transparent depthWrite={false} toneMapped={false} />
            </instancedMesh>
            <primitive object={meshes.smoke} renderOrder={4} />
            <primitive object={meshes.glow} renderOrder={5} />
        </>
    );
}
