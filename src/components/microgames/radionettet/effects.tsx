import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fogFlash } from './fogState';
import { useQuality } from '../kit';
import type { G, Fx } from './game';
import { SLAG } from './levels';
import { consume, MAX_PUFF, MAX_SCORCH, type FxPool } from './fxPool';
import { lift, tilt } from './ground';

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
const TQ = new THREE.Quaternion();
const QY = new THREE.Quaternion();
const Y = new THREE.Vector3(0, 1, 0);
const V = new THREE.Vector3();
const CQ = new THREE.Quaternion();

/** Kratervollen: en lav, ujevn jordvoll rundt nedslaget (slagmarken blir arrete utover i slaget). */
function craterRim() {
    const prof = [
        new THREE.Vector2(0.0, -0.05),
        new THREE.Vector2(0.45, -0.04),
        new THREE.Vector2(0.7, 0.07),
        new THREE.Vector2(0.85, 0.09),
        new THREE.Vector2(1.05, 0.02),
        new THREE.Vector2(1.25, -0.03),
    ];
    const g = new THREE.LatheGeometry(prof, 14);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
        const a = Math.atan2(pos.getZ(i), pos.getX(i));
        const k = 1 + Math.sin(a * 3 + 1) * 0.1 + Math.sin(a * 5) * 0.06;
        pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * (0.7 + 0.6 * Math.max(0, Math.sin(a * 2 + 0.5))), pos.getZ(i) * k);
    }
    g.computeVertexNormals();
    return g;
}

export function Effects({ gRef, fxRef, speedRef, sfx }: { gRef: React.MutableRefObject<G>; fxRef: React.MutableRefObject<FxPool>; speedRef: React.MutableRefObject<number>; sfx?: (name: string) => void }) {
    const seen = useMemo(() => new WeakSet<Fx>(), []);
    const meshes = useMemo(
        () => ({
            smoke: particleMesh(smokeTexture(), MAX_PUFF, false, true),
            glow: particleMesh(glowTexture(), 260, true, false),
        }),
        []
    );
    const scorchTex = useMemo(() => scorchTexture(), []);
    const scorchRef = useRef<THREE.InstancedMesh>(null);
    const rimRef = useRef<THREE.InstancedMesh>(null);
    const rimGeo = useMemo(() => craterRim(), []);
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
            const def = SLAG[g.slag];
            if (def) fx.setGround((x, z) => lift(def, x, z));
        }
        consume(g, fx, seen, sfx);
        fx.step(dt);
        const lists = [meshes.smoke, meshes.glow];
        const n = [0, 0];
        CQ.copy(st.camera.quaternion).invert();
        for (const p of fx.puffs) {
            if (!p.on) continue;
            const li = p.glow ? 1 : 0;
            const m = lists[li];
            const i = n[li];
            if (i >= (li ? 260 : MAX_PUFF)) continue;
            const k = p.t / p.life;
            // Vokser raskt først, så sakte; tettheten kommer fort og blekner mot slutten.
            const grow = 1 - (1 - Math.min(1, k)) ** 2.5;
            const r = (p.r0 + (p.r1 - p.r0) * grow) * 2.3;
            const a = p.streak > 0 ? 1 : p.fall ? (k < 0.8 ? 1 : (1 - k) / 0.2) : p.glow ? (1 - k) ** 1.4 : Math.min(1, k * 8) * (1 - k) ** 1.3;
            if (p.streak > 0) {
                // Sporlys og granater: strekkes ut langs farten slik kameraet ser den.
                V.set(p.vx, p.vy, p.vz).applyQuaternion(CQ);
                const len = Math.hypot(V.x, V.y) * p.streak;
                QZ.setFromAxisAngle(Z, Math.atan2(V.y, V.x));
                Q.copy(st.camera.quaternion).multiply(QZ);
                M.compose(P.set(p.x - p.vx * p.streak * 0.5, p.y - p.vy * p.streak * 0.5, p.z - p.vz * p.streak * 0.5), Q, S.set(r + len, r, r));
            } else {
                QZ.setFromAxisAngle(Z, p.spin + p.t * 0.3);
                Q.copy(st.camera.quaternion).multiply(QZ);
                M.compose(P.set(p.x, p.y, p.z), Q, S.set(r, r, r));
            }
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
        const rm = rimRef.current;
        if (sm) {
            let c = 0;
            for (const s of fx.scorches) {
                if (!s.on) continue;
                // Svidd flekk som ligger på åsen, og et krater med voll der det smalt hardt.
                const def = SLAG[g.slag];
                QZ.setFromAxisAngle(Z, s.rot);
                tilt(def, s.x, s.z, TQ);
                Q.copy(TQ).multiply(FLAT).multiply(QZ);
                const y = lift(def, s.x, s.z);
                M.compose(P.set(s.x, y + 0.03 + c * 0.00005, s.z), Q, S.set(s.r * 2, s.r * 2, 1));
                sm.setMatrixAt(c, M);
                if (rm) {
                    Q.copy(TQ).multiply(QY.setFromAxisAngle(Y, s.rot));
                    M.compose(P.set(s.x, y - 0.02, s.z), Q, S.set(s.r * 0.95, s.r * 0.75, s.r * 0.95));
                    rm.setMatrixAt(c, M);
                }
                c++;
            }
            sm.count = c;
            sm.instanceMatrix.needsUpdate = true;
            if (rm) {
                rm.count = c;
                rm.instanceMatrix.needsUpdate = true;
            }
        }
    });
    return (
        <>
            <instancedMesh ref={rimRef} args={[rimGeo, undefined, MAX_SCORCH]} frustumCulled={false} receiveShadow>
                <meshStandardMaterial color="#4a3f30" roughness={1} flatShading />
            </instancedMesh>
            <instancedMesh ref={scorchRef} args={[undefined, undefined, MAX_SCORCH]} frustumCulled={false}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={scorchTex} transparent depthWrite={false} toneMapped={false} />
            </instancedMesh>
            <primitive object={meshes.smoke} renderOrder={4} />
            <primitive object={meshes.glow} renderOrder={5} />
        </>
    );
}

/** Røyksøyler ved kanten av kartet per slag (brennende skip, gårder og landsbyer). */
const COLUMNS: Record<string, [number, number][]> = {
    dunkerque: [[-2.4, 1.4], [15.6, 9.7], [8.5, 10.6]],
    alamein: [[16.4, 0.3], [0.6, 10.4]],
    kursk: [[-0.7, 9.4], [16.6, 5.2], [10.5, -0.7]],
    normandie: [[16.5, 9.2], [-0.8, 0.4]],
    bastogne: [[0.4, -0.7], [16.4, 8.6]],
    rhinen: [[16.6, 1.2], [3, 10.6]],
};
const SEA = new Set(['dunkerque', 'normandie']);

/** Stemningen: røyksøyler, fjerne kanonglimt på fiendens side (tordenen kommer litt etter),
 *  krutt-dis som driver over slagmarken, og vind og måker mens eleven planlegger. */
export function Ambience({ gRef, fxRef, speedRef, sfx }: { gRef: React.MutableRefObject<G>; fxRef: React.MutableRefObject<FxPool>; speedRef: React.MutableRefObject<number>; sfx?: (name: string) => void }) {
    const t = useRef({ col: 0, flash: 2, mg: 6, haze: 1, vind: 3, måke: 5, glør: 0, snø: 0 });
    const q = useQuality();
    useFrame((_, raw) => {
        const dt = Math.min(0.05, raw) * speedRef.current;
        if (dt <= 0) return;
        const g = gRef.current;
        const fx = fxRef.current;
        const id = SLAG[g.slag]?.id ?? '';
        const s = t.current;
        const wave = g.phase === 'wave';
        // Røyksøylene: tett nede, bred og lys oppe.
        s.col -= dt;
        if (s.col <= 0) {
            s.col = 0.28 / Math.max(0.3, q.particleScale);
            for (const [x, z] of COLUMNS[id] ?? []) {
                // Mørk ved bålet, grå og bred høyere oppe: partikkelen stiger lenge (lite luftmotstand).
                const p = fx.puff(Math.random() < 0.35 ? 'sot' : 'røyk', x + (Math.random() - 0.5) * 0.25, 0.25, z, { r: 0.13, grow: 5.5, life: 6, up: 0.9, spread: 0.12 });
                p.drag = 0.15;
                p.a *= 0.8;
                if (Math.random() < 0.35) fx.puff('ild', x, 0.25, z, { r: 0.14, grow: 1.5, life: 0.6, up: 0.6, spread: 0.2 });
            }
        }
        // Fjerne kanoner bak fiendens linjer: glimtet først, tordenen etterpå.
        s.flash -= dt;
        if (s.flash <= 0) {
            s.flash = wave ? 1.8 + Math.random() * 3 : 5 + Math.random() * 6;
            const z = Math.random() * 10;
            const x = 17.2 + Math.random() * 1.5;
            fx.puff('blits', x, 0.4, z, { r: 0.9, grow: 1.6, life: 0.18, up: 0, spread: 0 });
            fogFlash(x, z, 1.4, 3);
            fx.puff('ild', x, 0.4, z, { r: 0.5, grow: 1.4, life: 0.4, up: 0.3, spread: 0 });
            fx.after(0.5 + Math.random() * 0.6, () => sfx?.('fjern'));
        }
        s.mg -= dt;
        if (s.mg <= 0) {
            s.mg = 5 + Math.random() * 7;
            if (wave) sfx?.('fjernMg');
        }
        // Krutt-dis i bølgen: store, tynne skyer som driver med vinden.
        s.haze -= dt;
        if (s.haze <= 0) {
            s.haze = (wave ? 1.6 : 4) / Math.max(0.3, q.particleScale);
            const p = fx.puff('røyk', Math.random() * 14, 0.35, Math.random() * 10, { r: 0.7, grow: 2.2, life: 9, up: 0.03, spread: 0.1 });
            p.a = wave ? 0.16 : 0.09;
        }
        // Glør og aske som stiger fra slagmarken mens kampen pågår.
        s.glør -= dt;
        if (wave && s.glør <= 0) {
            s.glør = 0.12 / Math.max(0.3, q.particleScale);
            const p = fx.puff('glo', Math.random() * 16, 0.2, Math.random() * 11, { r: 0.022, grow: 1, life: 3.5, up: 0.45, spread: 0.5 });
            p.a = 0.75;
        }
        // Bastogne: snøen faller hele tida, sakte og skrått med vinden.
        if (id === 'bastogne') {
            s.snø -= dt;
            if (s.snø <= 0) {
                s.snø = 0.05 / Math.max(0.3, q.particleScale);
                const p = fx.puff('vann', Math.random() * 18 - 1, 3.2, Math.random() * 13 - 1, { r: 0.028, grow: 1, life: 6, up: 0, spread: 0.2 });
                p.vy = -0.55 - Math.random() * 0.2;
                p.drag = 0;
                p.a = 0.9;
            }
        }
        if (!wave) {
            s.vind -= dt;
            if (s.vind <= 0) {
                s.vind = 4 + Math.random() * 4;
                sfx?.('vind');
            }
            s.måke -= dt;
            if (s.måke <= 0) {
                s.måke = 6 + Math.random() * 8;
                if (SEA.has(id)) sfx?.('måke');
            }
        }
    });
    return null;
}
