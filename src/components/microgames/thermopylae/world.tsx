import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { useQuality } from '../kit/quality';
import { hw, clockHour, WALL_Z, WALL_H, GATE_HALF, WALL_HALF, BACK_SPAWN, type G } from './game';
import {
    PAL,
    glowTexture,
    puffTexture,
    meanderTexture,
    campShieldGeo,
    farManGeo,
    tentGeo,
    fireGeo,
} from './look';

// Verdenen: passet ved Thermopylae. Klippa til venstre (-x), havet til høyre (+x), perserne
// forfra (-z), leiren bak muren (+z). Sola går over himmelen gjennom hver dag - kjølig
// morgen bak deg til venstre, glødende solnedgang over havet foran deg til høyre.

type GRef = React.MutableRefObject<G>;

function rng(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------------------
// Himmel, sol og lys
// ---------------------------------------------------------------------------

const C = (h: string) => new THREE.Color(h);
const SKY = {
    morningTop: C('#6fa6d8'),
    morningHor: C('#cfe4ee'),
    noonTop: C('#2f86d6'),
    noonHor: C('#bfe6f2'),
    eveTop: C('#3b4f9a'),
    eveHor: C('#ffb070'),
    sunMorning: C('#fff1d8'),
    sunNoon: C('#fff8ec'),
    sunEve: C('#ff9a4a'),
};

/** Solas retning og farge for et klokkeslett (6-19,5). Deles av himmel og lys. */
const SUN = {
    dir: new THREE.Vector3(0, 1, 0),
    color: new THREE.Color('#fff'),
    top: new THREE.Color(),
    hor: new THREE.Color(),
    eve: 0,
};
function sunAt(h: number, dark: number) {
    const a = ((h - 6) / 12) * Math.PI;
    const up = Math.max(0.06, Math.sin(Math.min(Math.PI - 0.12, a)));
    SUN.dir.set(-Math.cos(a) * 0.8, up * 0.9 + 0.05, 0.4 - (Math.min(a, Math.PI) / Math.PI) * 1.0).normalize();
    const morning = 1 - smooth(6, 10, h);
    const eve = smooth(13.5, 18, h);
    SUN.eve = eve;
    SUN.top.copy(SKY.noonTop).lerp(SKY.morningTop, morning).lerp(SKY.eveTop, eve);
    SUN.hor.copy(SKY.noonHor).lerp(SKY.morningHor, morning).lerp(SKY.eveHor, eve);
    SUN.color.copy(SKY.sunNoon).lerp(SKY.sunMorning, morning).lerp(SKY.sunEve, eve);
    if (dark > 0) {
        SUN.top.multiplyScalar(1 - dark * 0.55);
        SUN.hor.multiplyScalar(1 - dark * 0.45);
    }
}

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SKY_FRAG = /* glsl */ `
uniform vec3 top;
uniform vec3 hor;
uniform vec3 sunCol;
uniform vec3 sunDir;
uniform float dark;
varying vec3 vDir;
void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, 0.0, 1.0);
    vec3 c = mix(hor, top, pow(h, 0.5));
    float s = max(dot(d, sunDir), 0.0);
    c += sunCol * (pow(s, 900.0) * 6.0 * (1.0 - dark) + pow(s, 14.0) * 0.45 + pow(s, 3.0) * 0.12);
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;

/** Menyen (før første steg) står i gyllent ettermiddagslys; ellers følger sola klokka. */
function skyHour(g: G) {
    return g.t === 0 && !g.won ? 14 : clockHour(g);
}

function paintSky(mat: THREE.ShaderMaterial, dark: number) {
    const u = mat.uniforms;
    (u.top.value as THREE.Color).copy(SUN.top);
    (u.hor.value as THREE.Color).copy(SUN.hor);
    (u.sunCol.value as THREE.Color).copy(SUN.color);
    (u.sunDir.value as THREE.Vector3).copy(SUN.dir);
    u.dark.value = dark;
}

export function Sky({ gRef }: { gRef: GRef }) {
    const mat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader: SKY_VERT,
                fragmentShader: SKY_FRAG,
                side: THREE.BackSide,
                depthWrite: false,
                uniforms: {
                    top: { value: new THREE.Color() },
                    hor: { value: new THREE.Color() },
                    sunCol: { value: new THREE.Color() },
                    sunDir: { value: new THREE.Vector3(0, 1, 0) },
                    dark: { value: 0 },
                },
            }),
        [],
    );
    const ref = useRef<THREE.Mesh>(null);
    const scene = useThree((s) => s.scene);
    useFrame((state) => {
        const g = gRef.current;
        sunAt(skyHour(g), g.volleyDark);
        paintSky(mat, g.volleyDark);
        if (ref.current) ref.current.position.copy(state.camera.position);
        if (scene.fog) (scene.fog as THREE.Fog).color.copy(SUN.hor);
        if (scene.background instanceof THREE.Color) scene.background.copy(SUN.hor);
    });
    return (
        <mesh ref={ref} material={mat} renderOrder={-10} frustumCulled={false} userData={{ sceneAuditIgnore: true }}>
            <sphereGeometry args={[240, 24, 12]} />
        </mesh>
    );
}

const TARGET = new THREE.Vector3();
export function Lights({ gRef }: { gRef: GRef }) {
    const sun = useRef<THREE.DirectionalLight>(null);
    const rim = useRef<THREE.DirectionalLight>(null);
    const hemi = useRef<THREE.HemisphereLight>(null);
    const target = useMemo(() => new THREE.Object3D(), []);
    const scene = useThree((s) => s.scene);
    useFrame(() => {
        const g = gRef.current;
        const dark = g.volleyDark;
        const s = sun.current;
        if (s) {
            if (s.target !== target) {
                s.target = target;
                scene.add(target);
            }
            TARGET.set(g.px, 0, g.pz - 3);
            target.position.copy(TARGET);
            s.position.copy(TARGET).addScaledVector(SUN.dir, 40);
            s.color.copy(SUN.color);
            s.intensity = (2.5 + SUN.eve * 0.6) * (1 - dark * 0.75) * (0.55 + 0.45 * Math.min(1, SUN.dir.y * 3 + 0.3));
        }
        const r = rim.current;
        if (r) {
            // Motlys: fra motsatt side av sola, lavt. Gir kantlys på figurene.
            r.position.set(g.px - SUN.dir.x * 20, 6, g.pz - SUN.dir.z * 20 - 6);
            r.intensity = (1.1 + SUN.eve * 0.7) * (1 - dark * 0.6);
            r.color.copy(SUN.color).lerp(SKY.eveHor, 0.4);
        }
        const h = hemi.current;
        if (h) {
            h.color.copy(SUN.top).lerp(SUN.hor, 0.4);
            h.intensity = 1.15 * (1 - dark * 0.45);
        }
    });
    return (
        <>
            <directionalLight
                ref={sun}
                intensity={2.6}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0004}
                shadow-normalBias={0.03}
            >
                <orthographicCamera attach="shadow-camera" args={[-16, 16, 16, -16, 1, 90]} />
            </directionalLight>
            <directionalLight ref={rim} intensity={0.8} />
            <hemisphereLight ref={hemi} args={['#bfe0f2', '#c98a4a', 0.95]} />
            {/* Refleksjoner til bronse og havet - lokalt, ingen nedlasting. */}
            <Environment resolution={64} frames={1}>
                <Lightformer form="rect" intensity={1.6} color="#fff1d6" position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
                <Lightformer form="rect" intensity={1.2} color="#ffb070" position={[8, 2, -6]} rotation-y={-Math.PI / 2} scale={[12, 3, 1]} />
                <Lightformer form="rect" intensity={0.7} color="#63dcd6" position={[-8, 1, 4]} rotation-y={Math.PI / 2} scale={[12, 3, 1]} />
            </Environment>
        </>
    );
}

// ---------------------------------------------------------------------------
// Sanden: et rutenett som følger passet og skråner ned i havet
// ---------------------------------------------------------------------------

const Z0 = -80;
const Z1 = 34;
function landGeometry() {
    const cols = 26;
    const r = rng(11);
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const c = new THREE.Color();
    const sand = new THREE.Color(PAL.sand);
    const dark = new THREE.Color(PAL.sandDark);
    const wet = new THREE.Color('#a8784a');
    const trod = new THREE.Color('#d08f55');
    const rows = Z1 - Z0;
    for (let i = 0; i <= rows; i++) {
        const z = Z0 + i;
        const h = hw(z);
        for (let j = 0; j <= cols; j++) {
            const u = j / cols;
            // Fra under klippa (-h - 3) til ut i vannet (h + 2).
            const x = -h - 3 + u * (2 * h + 5);
            let y = 0;
            if (x > h) y = -((x - h) / 2) * 0.9;
            const n = r();
            if (Math.abs(x) < h - 1 && z < -14) y += (n - 0.5) * 0.06;
            pos.push(x, y, z);
            c.copy(sand).lerp(dark, n * 0.45);
            if (x > h - 0.8) c.lerp(wet, smooth(h - 0.8, h + 0.2, x));
            if (Math.abs(x) < 2.2 && z > -14 && z < 12) c.lerp(trod, 0.35 * (1 - Math.abs(x) / 2.2));
            c.convertSRGBToLinear();
            col.push(c.r, c.g, c.b);
        }
    }
    for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++) {
            const a = i * (cols + 1) + j;
            const b = a + cols + 1;
            idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
}

export function Land() {
    const geo = useMemo(() => landGeometry(), []);
    return (
        <mesh geometry={geo} receiveShadow>
            <meshStandardMaterial vertexColors roughness={0.95} />
        </mesh>
    );
}

// ---------------------------------------------------------------------------
// Havet: turkist, lysere mot stranda, fasettert glitter i sola
// ---------------------------------------------------------------------------

function waveSea(geo: THREE.BufferGeometry, base: Float32Array, t: number) {
    const p = geo.attributes.position as THREE.BufferAttribute;
    const a = p.array as Float32Array;
    for (let i = 0; i < p.count; i++) {
        const x = base[i * 3];
        const z = base[i * 3 + 2];
        a[i * 3 + 1] = -0.25 + Math.sin(x * 0.45 + t * 1.3) * 0.07 + Math.sin(z * 0.6 - t * 1.1 + x * 0.2) * 0.06;
    }
    p.needsUpdate = true;
}

export function Sea() {
    const q = useQuality();
    const seg = q.tier === 'lav' ? 30 : 48;
    const geo = useMemo(() => {
        const g = new THREE.PlaneGeometry(150, 190, seg, seg);
        g.rotateX(-Math.PI / 2);
        g.translate(78, -0.25, -30);
        const p = g.attributes.position as THREE.BufferAttribute;
        const col = new Float32Array(p.count * 3);
        const c = new THREE.Color();
        const shallow = new THREE.Color(PAL.seaShallow);
        const mid = new THREE.Color(PAL.sea);
        const deep = new THREE.Color(PAL.seaDeep);
        for (let i = 0; i < p.count; i++) {
            const d = p.getX(i) - hw(p.getZ(i));
            c.copy(shallow).lerp(mid, smooth(0, 6, d)).lerp(deep, smooth(10, 50, d));
            c.convertSRGBToLinear();
            col[i * 3] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        return g;
    }, [seg]);
    const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
    useFrame((state) => {
        if (q.tier !== 'lav') waveSea(geo, base, state.clock.elapsedTime);
    });
    return (
        <mesh geometry={geo} receiveShadow userData={{ sceneAuditIgnore: true }}>
            <meshStandardMaterial vertexColors roughness={0.32} metalness={0.05} flatShading envMapIntensity={0.55} />
        </mesh>
    );
}

/** Skumkanten langs stranda. */
export function Foam() {
    const geo = useMemo(() => {
        const pos: number[] = [];
        const idx: number[] = [];
        let n = 0;
        for (let z = Z0; z <= Z1; z += 0.5) {
            const h = hw(z);
            pos.push(h + 0.25, -0.2, z, h + 0.95, -0.2, z);
            if (n > 0) {
                const a = (n - 1) * 2;
                idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
            }
            n++;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setIndex(idx);
        return g;
    }, []);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((state) => {
        if (mat.current) mat.current.opacity = 0.45 + Math.sin(state.clock.elapsedTime * 1.4) * 0.2;
    });
    return (
        <mesh geometry={geo} userData={{ sceneAuditIgnore: true }}>
            <meshBasicMaterial ref={mat} color="#f4fbf8" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
    );
}

// ---------------------------------------------------------------------------
// Klippene: fasetterte okerklipper med striper, og kratt på hyllene
// ---------------------------------------------------------------------------

function cliffGeometry() {
    const r = rng(5);
    const prof: [number, number][] = [
        [-0.15, -0.3],
        [0.25, 1.6],
        [0.9, 4.2],
        [2.2, 7.4],
        [4.2, 11],
        [7.5, 14.5],
        [13, 17],
        [22, 18],
    ];
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const c = new THREE.Color();
    const cols = [PAL.cliff, PAL.cliffLight, PAL.cliffDark, PAL.cliffLight, PAL.cliff, '#d98d52', PAL.cliffLight, '#b98a60'];
    const W = prof.length;
    let rows = 0;
    for (let z = Z0; z <= Z1 + 0.01; z += 1.5) {
        const h = hw(z);
        const wob = Math.sin(z * 0.37) * 0.5 + Math.sin(z * 1.3) * 0.25;
        for (let j = 0; j < W; j++) {
            const [dx, y] = prof[j];
            const n = (r() - 0.5) * (j === 0 ? 0.2 : 1.2);
            pos.push(-h - dx - (j > 0 ? wob + n : 0), y + (j > 1 ? (r() - 0.5) * 1.6 : 0), z + (j > 0 ? (r() - 0.5) * 0.6 : 0));
            c.set(cols[j]).lerp(new THREE.Color(PAL.cliffDark), r() * 0.25);
            c.convertSRGBToLinear();
            col.push(c.r, c.g, c.b);
        }
        rows++;
    }
    for (let i = 0; i < rows - 1; i++)
        for (let j = 0; j < W - 1; j++) {
            const a = i * W + j;
            const b = a + W;
            idx.push(a, a + 1, b, a + 1, b + 1, b);
        }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    const flat = g.toNonIndexed();
    flat.computeVertexNormals();
    return flat;
}

export function Cliffs() {
    const geo = useMemo(() => cliffGeometry(), []);
    const q = useQuality();
    const scrub = useMemo(() => {
        const r = rng(9);
        const out: { x: number; y: number; z: number; s: number }[] = [];
        for (let i = 0; i < 46; i++) {
            const z = Z0 + 20 + r() * (Z1 - Z0 - 20);
            const k = r();
            const dx = 0.6 + k * 6;
            const y = 2 + k * 11;
            out.push({ x: -hw(z) - dx - 0.4, y, z, s: 0.4 + r() * 0.7 });
        }
        return out;
    }, []);
    const n = Math.round(scrub.length * (q.tier === 'lav' ? 0.5 : 1));
    const inst = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        const im = inst.current;
        if (!im || im.userData.done === n) return;
        const m = new THREE.Matrix4();
        for (let i = 0; i < n; i++) {
            const s = scrub[i];
            m.makeScale(s.s * 1.3, s.s, s.s * 1.3).setPosition(s.x, s.y, s.z);
            im.setMatrixAt(i, m);
        }
        im.count = n;
        im.instanceMatrix.needsUpdate = true;
        im.userData.done = n;
    });
    return (
        <>
            {/* Klippa kaster skygge over passet - men ikke på lav, der skyggepasset er dyrest. */}
            <mesh geometry={geo} castShadow={q.tier !== 'lav'} receiveShadow>
                <meshStandardMaterial vertexColors roughness={0.9} flatShading />
            </mesh>
            <instancedMesh ref={inst} args={[undefined, undefined, scrub.length]} frustumCulled={false}>
                <dodecahedronGeometry args={[0.6, 0]} />
                <meshStandardMaterial color={PAL.olive} roughness={1} flatShading />
            </instancedMesh>
            {/* Fjellstien Efialtes viste perserne: en lys stripe som klatrer opp bak leiren. */}
            <PathRibbon />
        </>
    );
}

const PATH_PTS: [number, number, number][] = [
    [BACK_SPAWN[0] + 0.5, 0.03, BACK_SPAWN[1] - 3],
    [BACK_SPAWN[0], 0.05, BACK_SPAWN[1]],
    [-4.6, 0.9, 25],
    [-5.6, 2.6, 27.5],
    [-7.2, 4.8, 29.5],
    [-9.5, 7.4, 31],
    [-12.5, 10.5, 32],
];
const PATH_CURVE = new THREE.CatmullRomCurve3(PATH_PTS.map((p) => new THREE.Vector3(...p)));

function PathRibbon() {
    const geo = useMemo(() => {
        const pos: number[] = [];
        const idx: number[] = [];
        const N = 40;
        for (let i = 0; i <= N; i++) {
            const p = PATH_CURVE.getPoint(i / N);
            const t = PATH_CURVE.getTangent(i / N);
            const sx = -t.z;
            const sz = t.x;
            const L = Math.hypot(sx, sz) || 1;
            pos.push(p.x - (sx / L) * 0.6, p.y + 0.06, p.z - (sz / L) * 0.6, p.x + (sx / L) * 0.6, p.y + 0.06, p.z + (sz / L) * 0.6);
            if (i > 0) {
                const a = (i - 1) * 2;
                idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
            }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        return g;
    }, []);
    return (
        <mesh geometry={geo} receiveShadow userData={{ sceneAuditIgnore: true }}>
            <meshStandardMaterial color="#e8c48e" roughness={1} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
    );
}

// ---------------------------------------------------------------------------
// Den fokiske muren: steinblokker med malt meanderfrise og malte portstolper
// ---------------------------------------------------------------------------

function wallGeometry() {
    const r = rng(3);
    const geos: THREE.BufferGeometry[] = [];
    const c = new THREE.Color();
    const tones = ['#eadcc2', '#dccbb0', '#e6d2b0', '#d2bd9a', '#efe3cc'];
    const rowH = (WALL_H - 0.3) / 4;
    const segs: [number, number][] = [
        [-hw(WALL_Z) - 2.5, -GATE_HALF],
        [GATE_HALF, hw(WALL_Z) + 0.9],
    ];
    for (const [x0, x1] of segs) {
        for (let row = 0; row < 4; row++) {
            let x = x0 - (row % 2) * 0.35;
            while (x < x1) {
                const w = Math.min(0.55 + r() * 0.6, x1 - x);
                if (w < 0.05) break;
                const cx = Math.max(x, x0) + (Math.min(x + w, x1) - Math.max(x, x0)) / 2;
                const ww = Math.min(x + w, x1) - Math.max(x, x0);
                const g = new THREE.BoxGeometry(ww - 0.03, rowH - 0.03, WALL_HALF * 2 + (r() - 0.5) * 0.06).toNonIndexed();
                g.translate(cx, rowH * row + rowH / 2, WALL_Z);
                c.set(tones[Math.floor(r() * tones.length)]).convertSRGBToLinear();
                const n = g.getAttribute('position').count;
                const col = new Float32Array(n * 3);
                for (let i = 0; i < n; i++) {
                    col[i * 3] = c.r;
                    col[i * 3 + 1] = c.g;
                    col[i * 3 + 2] = c.b;
                }
                g.setAttribute('color', new THREE.BufferAttribute(col, 3));
                g.deleteAttribute('uv');
                geos.push(g);
                x += w;
            }
        }
    }
    const merged = new THREE.BufferGeometry();
    let total = 0;
    for (const g of geos) total += g.getAttribute('position').count;
    const P = new Float32Array(total * 3);
    const N = new Float32Array(total * 3);
    const CC = new Float32Array(total * 3);
    let o = 0;
    for (const g of geos) {
        const n = g.getAttribute('position').count;
        P.set(g.getAttribute('position').array as Float32Array, o * 3);
        N.set(g.getAttribute('normal').array as Float32Array, o * 3);
        CC.set(g.getAttribute('color').array as Float32Array, o * 3);
        o += n;
        g.dispose();
    }
    merged.setAttribute('position', new THREE.BufferAttribute(P, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    merged.setAttribute('color', new THREE.BufferAttribute(CC, 3));
    merged.computeBoundingSphere();
    return merged;
}

export function Wall() {
    const geo = useMemo(() => wallGeometry(), []);
    const frieze = useMemo(() => {
        const t = meanderTexture(PAL.red, PAL.marble, PAL.glazeBlue);
        t.repeat.set(3, 1);
        return t;
    }, []);
    const top = WALL_H - 0.3;
    const segs: [number, number][] = [
        [-hw(WALL_Z) - 2.5, -GATE_HALF],
        [GATE_HALF, hw(WALL_Z) + 0.9],
    ];
    return (
        <group>
            <mesh geometry={geo} castShadow receiveShadow>
                <meshStandardMaterial vertexColors roughness={0.8} />
            </mesh>
            {/* Malt frise øverst: meander i rødt og blått på hvit marmor. */}
            {segs.map(([a, b]) => (
                <mesh key={a} position={[(a + b) / 2, top + 0.15, WALL_Z]} receiveShadow>
                    <boxGeometry args={[b - a, 0.3, WALL_HALF * 2 + 0.08]} />
                    <meshStandardMaterial map={frieze} roughness={0.55} />
                </mesh>
            ))}
            {/* Portstolpene: malt marmor med røde og blå kapiteler og bronsebeslag. */}
            {[-1, 1].map((s) => (
                <group key={s} position={[s * (GATE_HALF + 0.12), 0, WALL_Z]}>
                    <mesh position={[0, 1.2, 0]} castShadow>
                        <boxGeometry args={[0.36, 2.4, WALL_HALF * 2 + 0.2]} />
                        <meshStandardMaterial color={PAL.marble} roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 2.45, 0]}>
                        <boxGeometry args={[0.5, 0.16, WALL_HALF * 2 + 0.34]} />
                        <meshStandardMaterial color={PAL.glazeBlue} roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 2.3, 0]}>
                        <boxGeometry args={[0.42, 0.1, WALL_HALF * 2 + 0.26]} />
                        <meshStandardMaterial color={PAL.red} roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[0.4, 0.08, WALL_HALF * 2 + 0.24]} />
                        <meshStandardMaterial color={PAL.bronze} metalness={0.8} roughness={0.3} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Leiren bak muren: telt, skjoldstabler, leirbål med røyk
// ---------------------------------------------------------------------------

const TENTS: [number, number, number][] = [
    [-3.1, 6.6, 0.3],
    [0.2, 8.2, -0.2],
    [3.2, 6.9, 0.5],
    [-1.6, 11.5, 0.1],
    [2.4, 12.2, -0.4],
];
const FIRES: [number, number][] = [
    [-2.9, 9.6],
    [3.0, 12.4],
];

export function Camp() {
    const full = useQuality().tier !== 'lav';
    const tent = useMemo(() => tentGeo(), []);
    const fire = useMemo(() => fireGeo(), []);
    const shields = useMemo(() => [0, 1, 2].map((s) => campShieldGeo(s)), []);
    return (
        <group>
            {TENTS.map(([x, z, r], i) => (
                <mesh key={i} geometry={tent} position={[x, 0, z]} rotation={[0, Math.PI + r, 0]} castShadow={full} receiveShadow>
                    <meshStandardMaterial vertexColors roughness={0.85} />
                </mesh>
            ))}
            {/* Skjold lent mot baksida av muren, med malte tegn (lambda, hjul, port). */}
            {[-3.4, -2.4, 2.1, 3.1, 3.9].map((x, i) => (
                <mesh
                    key={x}
                    geometry={shields[i % 3]}
                    position={[x, 0.46, WALL_Z + WALL_HALF + 0.12]}
                    rotation={[-0.18, Math.PI, (i - 2) * 0.05]}
                    castShadow={full}
                >
                    <meshStandardMaterial vertexColors metalness={0.35} roughness={0.4} />
                </mesh>
            ))}
            {/* Spyd lent mot muren. */}
            {[-2.9, -2.75, 2.6, 2.75].map((x, i) => (
                <mesh key={'s' + i} position={[x, 1.25, WALL_Z + WALL_HALF + 0.3]} rotation={[-0.2, 0, (i % 2 ? -1 : 1) * 0.06]}>
                    <cylinderGeometry args={[0.02, 0.02, 2.6, 5]} />
                    <meshStandardMaterial color="#8a5a32" />
                </mesh>
            ))}
            {FIRES.map(([x, z]) => (
                <group key={x} position={[x, 0, z]}>
                    <mesh geometry={fire}>
                        <meshStandardMaterial vertexColors roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 0.35, 0]}>
                        <coneGeometry args={[0.22, 0.6, 7]} />
                        <meshBasicMaterial color={[3.2, 1.4, 0.35]} toneMapped={false} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Røyk fra leirbålene (og støvkorn i lyset): billboard-dotter, skalert etter kvalitet. */
export function Smoke() {
    const q = useQuality();
    const per = q.tier === 'lav' ? 5 : q.tier === 'middels' ? 9 : 14;
    const N = per * FIRES.length;
    const ref = useRef<THREE.InstancedMesh>(null);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const qt = useMemo(() => new THREE.Quaternion(), []);
    const v = useMemo(() => new THREE.Vector3(), []);
    const s = useMemo(() => new THREE.Vector3(), []);
    useFrame((state) => {
        const im = ref.current;
        if (!im) return;
        const t = state.clock.elapsedTime;
        qt.copy(state.camera.quaternion);
        let k = 0;
        for (const [fx, fz] of FIRES)
            for (let i = 0; i < per; i++) {
                const life = (t * 0.22 + i / per) % 1;
                v.set(fx + Math.sin(i * 3.1 + t * 0.4) * 0.25 * life + life * 1.4, 0.7 + life * 6, fz + Math.cos(i * 1.7) * 0.2 * life - life * 0.8);
                const sc = 0.4 + life * 1.7;
                s.set(sc, sc, sc);
                m.compose(v, qt, s);
                im.setMatrixAt(k, m);
                k++;
            }
        im.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false} userData={{ sceneAuditIgnore: true }}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={puffTexture()} color="#e4dccf" transparent opacity={0.45} depthWrite={false} fog />
        </instancedMesh>
    );
}

/** Støv som svever i sollyset rundt deg (bare middels/høy). */
export function Motes({ gRef }: { gRef: GRef }) {
    const q = useQuality();
    const N = q.tier === 'lav' ? 0 : q.tier === 'middels' ? 40 : 90;
    const ref = useRef<THREE.InstancedMesh>(null);
    const seeds = useMemo(() => {
        const r = rng(21);
        return Array.from({ length: 90 }, () => [r() * 14 - 7, r() * 3.2 + 0.3, r() * 14 - 9, r() * 6.28]);
    }, []);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const qt = useMemo(() => new THREE.Quaternion(), []);
    const v = useMemo(() => new THREE.Vector3(), []);
    const s = useMemo(() => new THREE.Vector3(), []);
    useFrame((state) => {
        const im = ref.current;
        if (!im || N === 0) return;
        const g = gRef.current;
        const t = state.clock.elapsedTime;
        qt.copy(state.camera.quaternion);
        for (let i = 0; i < N; i++) {
            const [x, y, z, p] = seeds[i];
            const wx = ((x + t * 0.15 + Math.sin(t * 0.3 + p)) % 14) - 7;
            v.set(g.px + wx, y + Math.sin(t * 0.5 + p) * 0.3, g.pz + z);
            const sc = 0.035 + (i % 3) * 0.015;
            s.set(sc, sc, sc);
            m.compose(v, qt, s);
            im.setMatrixAt(i, m);
        }
        im.instanceMatrix.needsUpdate = true;
    });
    if (N === 0) return null;
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false} userData={{ sceneAuditIgnore: true }}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={glowTexture()} color={[2.2, 1.9, 1.3]} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </instancedMesh>
    );
}

// ---------------------------------------------------------------------------
// Hele Persia i det fjerne: tusener på stranda, fanestenger og kongens telt
// ---------------------------------------------------------------------------

function placeArmy(im: THREE.InstancedMesh | null, N: number) {
    if (!im || im.userData.n === N) return;
    const r = rng(4);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    const cols = [PAL.glazeBlue, PAL.glazeYellow, PAL.glazeTurq, '#e8dcc0', '#7a2a6a'];
    for (let i = 0; i < N; i++) {
        const z = -46 - r() * 34;
        const h = hw(z) - 1.2;
        const x = (r() * 2 - 1) * h;
        m.makeScale(1, 1 + r() * 0.15, 1).setPosition(x, 0, z);
        im.setMatrixAt(i, m);
        im.setColorAt(i, c.set(cols[Math.floor(r() * cols.length)]));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.userData.n = N;
}

export function FarArmy() {
    const q = useQuality();
    const N = Math.round(q.tier === 'lav' ? 160 : q.tier === 'middels' ? 300 : 460);
    const ref = useRef<THREE.InstancedMesh>(null);
    const geo = useMemo(() => farManGeo(), []);
    // Hæren står stille i det fjerne: matrisene legges én gang (og på nytt hvis nivået endres).
    useFrame(() => placeArmy(ref.current, N));
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            <instancedMesh ref={ref} args={[geo, undefined, N]} frustumCulled={false}>
                <meshStandardMaterial vertexColors roughness={0.8} />
            </instancedMesh>
            {/* Fanestenger med gullskiver. */}
            {[-9, -4, 1, 6, 10].map((x, i) => (
                <group key={x} position={[x, 0, -50 - (i % 2) * 6]}>
                    <mesh position={[0, 2.5, 0]}>
                        <cylinderGeometry args={[0.06, 0.06, 5, 5]} />
                        <meshStandardMaterial color="#5a3a22" />
                    </mesh>
                    <mesh position={[0, 5.1, 0]}>
                        <cylinderGeometry args={[0.45, 0.45, 0.08, 16]} />
                        <meshStandardMaterial color={PAL.glazeYellow} metalness={0.8} roughness={0.25} emissive={PAL.glazeYellow} emissiveIntensity={0.25} />
                    </mesh>
                </group>
            ))}
            {/* Kongens telt på en haug langt bak: Xerxes ser på. */}
            <group position={[-4, 0, -78]}>
                <mesh position={[0, 1.2, 0]}>
                    <cylinderGeometry args={[7, 9, 2.4, 10]} />
                    <meshStandardMaterial color={PAL.sandDark} roughness={1} />
                </mesh>
                <mesh position={[0, 4.2, 0]}>
                    <cylinderGeometry args={[3.2, 3.2, 3.6, 10]} />
                    <meshStandardMaterial color="#7a2a6a" roughness={0.7} />
                </mesh>
                <mesh position={[0, 7.1, 0]}>
                    <coneGeometry args={[3.8, 2.4, 10]} />
                    <meshStandardMaterial color={PAL.glazeYellow} metalness={0.6} roughness={0.3} />
                </mesh>
            </group>
            {/* Øya Euboia på andre sida av sundet. */}
            {[
                [70, -60, 26, 7],
                [88, -10, 34, 9],
                [74, 40, 24, 6],
            ].map(([x, z, r, h], i) => (
                <mesh key={i} position={[x, -0.5, z]} scale={[r, h, r * 1.6]}>
                    <sphereGeometry args={[1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#9b8fb0" roughness={1} flatShading />
                </mesh>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Dag 3: fakler ned fjellstien
// ---------------------------------------------------------------------------

export function Torches({ gRef }: { gRef: GRef }) {
    const ref = useRef<THREE.Group>(null);
    const glow = useMemo(() => glowTexture(), []);
    useFrame((state) => {
        const o = ref.current;
        if (!o) return;
        const g = gRef.current;
        o.visible = g.torches > 0;
        if (!o.visible) return;
        const t = state.clock.elapsedTime;
        o.children.forEach((c, i) => {
            // Faklene siger nedover stien.
            const u = Math.max(0, 1 - ((t * 0.04 + i * 0.16) % 1));
            const p = PATH_CURVE.getPoint(0.15 + u * 0.85);
            c.position.set(p.x, p.y + 1.6 + Math.sin(t * 9 + i) * 0.05, p.z);
            const fl = 0.9 + Math.sin(t * 17 + i * 2.1) * 0.12;
            c.scale.setScalar(fl);
        });
    });
    return (
        <group ref={ref} visible={false}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <group key={i}>
                    <mesh>
                        <sphereGeometry args={[0.13, 8, 6]} />
                        <meshBasicMaterial color={[4, 1.8, 0.4]} toneMapped={false} />
                    </mesh>
                    <sprite scale={[1.6, 1.6, 1]}>
                        <spriteMaterial map={glow} color="#ff9a3c" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
                    </sprite>
                    <mesh position={[0, -0.6, 0]}>
                        <cylinderGeometry args={[0.03, 0.03, 1.1, 5]} />
                        <meshStandardMaterial color="#3b2618" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Gjenstander på stranda: Xerxes' gull og spartansk svart suppe
// ---------------------------------------------------------------------------

export function Pickups({ gRef }: { gRef: GRef }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const glow = useMemo(() => glowTexture(), []);
    useFrame((state) => {
        const g = gRef.current;
        const t = state.clock.elapsedTime;
        for (let i = 0; i < 4; i++) {
            const o = refs.current[i];
            const p = g.pickups[i];
            if (!o) continue;
            o.visible = !!p;
            if (!p) continue;
            o.position.set(p.x, 0, p.z);
            const item = o.children[0];
            item.position.y = Math.sin(t * 3 + i) * 0.1;
            item.rotation.y = t * 1.6;
            item.children[0].visible = p.kind === 'gull';
            item.children[1].visible = p.kind === 'suppe';
            const blink = p.life < 4 ? (Math.sin(t * 16) > 0 ? 1 : 0.3) : 1;
            o.children[1].scale.set(2.2 * blink, 2.2 * blink, 1);
        }
    });
    return (
        <>
            {[0, 1, 2, 3].map((i) => (
                <group
                    key={i}
                    visible={false}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                >
                    <group>
                    {/* Gullet: en haug dareikoer (gullmynter) og en gyllen amfora. */}
                    <group position={[0, 0.55, 0]}>
                        <mesh>
                            <cylinderGeometry args={[0.18, 0.12, 0.42, 10]} />
                            <meshStandardMaterial color={PAL.glazeYellow} metalness={0.9} roughness={0.2} emissive="#6a4a00" />
                        </mesh>
                        <mesh position={[0, 0.3, 0]}>
                            <sphereGeometry args={[0.13, 10, 6]} />
                            <meshStandardMaterial color={PAL.glazeYellow} metalness={0.9} roughness={0.2} emissive="#6a4a00" />
                        </mesh>
                    </group>
                    {/* Suppa: en svart gryte med rødt figurbånd. */}
                    <group position={[0, 0.45, 0]}>
                        <mesh>
                            <sphereGeometry args={[0.28, 12, 8]} />
                            <meshStandardMaterial color="#1d1712" roughness={0.35} />
                        </mesh>
                        <mesh>
                            <cylinderGeometry args={[0.285, 0.285, 0.1, 14]} />
                            <meshStandardMaterial color={PAL.terracotta} />
                        </mesh>
                    </group>
                    </group>
                    <sprite position={[0, 0.7, 0]} scale={[2.2, 2.2, 1]}>
                        <spriteMaterial map={glow} color="#ffd27a" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
                    </sprite>
                    {/* Lysstråle opp fra funnet, så det ses fra porten. */}
                    <mesh position={[0, 3, 0]}>
                        <cylinderGeometry args={[0.12, 0.35, 6, 8, 1, true]} />
                        <meshBasicMaterial color="#ffe3a0" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            ))}
        </>
    );
}
