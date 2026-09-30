import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit/quality';
import { toonGradientMap } from '../kit/toonGradient';
import { mergeParts, type Part } from '../kit/mergeParts';
import { geos, tesseraTexture, PAL } from './models';
import { groundY, MAX_FIG, type Army, type ArmyMeshes } from './army';
import { COLS, COL_X, ROW_Z, UNITS, colClosed, synergies, terrain, type G, type Terrain } from './game';

// HAMMER OG AMBOLT - verdenen: lys, tessera-sletta, terrenget i hvert slag, rutene og
// hærens instans-mesher. Lav støvete ettermiddagssol fra venstre bak spilleren, lange
// skygger mot fienden, varm dis mot horisonten.

// ---------------------------------------------------------------------------
// Lys
// ---------------------------------------------------------------------------

export function Lights() {
    const q = useQuality();
    const shadows = q.tier !== 'lav';
    const sun = useRef<THREE.DirectionalLight>(null);
    useEffect(() => {
        const l = sun.current;
        if (!l) return;
        l.shadow.camera.left = -19;
        l.shadow.camera.right = 19;
        l.shadow.camera.top = 19;
        l.shadow.camera.bottom = -19;
        l.shadow.camera.near = 2;
        l.shadow.camera.far = 70;
        l.shadow.bias = -0.0006;
        l.shadow.normalBias = 0.03;
        l.shadow.camera.updateProjectionMatrix();
    }, []);
    return (
        <>
            <hemisphereLight args={['#f8e6c0', '#5a3e26', 1.05]} />
            <ambientLight intensity={0.22} color="#f2d9ae" />
            <directionalLight
                ref={sun}
                position={[-10, 13, -24]}
                intensity={2.7}
                color="#ffd7a0"
                castShadow={shadows}
            />
        </>
    );
}

// ---------------------------------------------------------------------------
// Bakken
// ---------------------------------------------------------------------------

const TONES: Record<Terrain, { tones: string[]; grout: string }> = {
    slette: { tones: ['#d9b882', '#d4b27b', '#dcbd88', '#d0ae78', '#d7b67f'], grout: '#b08d5c' },
    elv: { tones: ['#d0ae7a', '#cba874', '#d4b381', '#c6a36f', '#cead79'], grout: '#a58456' },
    smalt: { tones: ['#cda872', '#c8a36c', '#d1ad78', '#c39e67', '#caa570'], grout: '#a2804f' },
    jevnet: { tones: ['#e2c592', '#dec08c', '#e5c997', '#dabd88', '#e0c38f'], grout: '#bb9a68' },
    hoyde: { tones: ['#cda974', '#c7a36d', '#d0ad79', '#c29e68', '#caa672'], grout: '#9f7e50' },
    steppe: { tones: ['#dab87a', '#d5b274', '#ddbd80', '#d0ae70', '#d8b678'], grout: '#b09059' },
};

const texCache = new Map<Terrain, THREE.CanvasTexture>();
function groundTex(ter: Terrain) {
    let t = texCache.get(ter);
    if (!t) {
        t = tesseraTexture(TONES[ter].tones, TONES[ter].grout, 11 + ter.length);
        t.repeat.set(26, 26);
        texCache.set(ter, t);
    }
    return t;
}

function groundGeometry(ter: Terrain) {
    const g = new THREE.PlaneGeometry(110, 110, 110, 110);
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = groundY(ter, x, z);
        pos.setY(i, y);
        // Store, myke flekker: sletta er ikke ensfarget.
        let k = 0.93 + Math.sin(x * 0.21 + Math.cos(z * 0.13) * 2) * 0.04 + Math.sin(z * 0.37 + x * 0.05) * 0.03;
        if (ter === 'elv' && Math.abs(z) < 2.4) k *= 0.8 + 0.2 * (Math.abs(z) / 2.4);
        if (ter === 'smalt' && x < -5) k *= 0.85;
        if (ter === 'hoyde' && z > 2) k *= 0.96 - Math.min(0.1, (z - 2) * 0.012);
        c.setRGB(k, k * 0.985, k * 0.96);
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
}

export function Ground({ ter }: { ter: Terrain }) {
    const geo = useMemo(() => groundGeometry(ter), [ter]);
    const tex = groundTex(ter);
    useEffect(() => () => geo.dispose(), [geo]);
    return (
        <mesh geometry={geo} receiveShadow>
            <meshStandardMaterial map={tex} vertexColors roughness={0.95} metalness={0} />
        </mesh>
    );
}

// ---------------------------------------------------------------------------
// Kulisser: elv, hav og fjell, høyden, steppegress, rakede spor, fjerne åser
// ---------------------------------------------------------------------------

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

function rocks(
    ter: Terrain,
    seed: number,
    n: number,
    place: (r: () => number) => [number, number] | null,
    size: [number, number],
    tones = ['#a8865a', '#9a7a50', '#b8966a', '#8e6e48', '#c2a276']
): THREE.BufferGeometry | null {
    const r = rng(seed);
    const parts: Part[] = [];
    for (let i = 0; i < n * 3 && parts.length < n; i++) {
        const p = place(r);
        if (!p) continue;
        const [x, z] = p;
        const s = size[0] + r() * (size[1] - size[0]);
        parts.push({
            geometry: new THREE.DodecahedronGeometry(1, 0),
            position: [x, groundY(ter, x, z) + s * 0.25, z],
            rotation: [r() * 3, r() * 3, r() * 3],
            scale: [s * (0.8 + r() * 0.6), s * (0.5 + r() * 0.7), s * (0.8 + r() * 0.6)],
            color: tones[Math.floor(r() * tones.length)],
        });
    }
    return parts.length ? mergeParts(parts) : null;
}

function waterTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    const r = rng(5);
    ctx.fillStyle = '#d8c9a4';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 160; i++) {
        ctx.fillStyle = `rgba(255,250,232,${0.35 + r() * 0.6})`;
        const x = r() * 256;
        const y = r() * 256;
        ctx.fillRect(x, y, 6 + r() * 26, 1.5 + r() * 1.5);
    }
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(90,70,45,${0.15 + r() * 0.25})`;
        ctx.fillRect(r() * 256, r() * 256, 20 + r() * 50, 3);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(10, 0.6);
    return t;
}

function mountains(): THREE.BufferGeometry {
    const r = rng(3);
    const parts: Part[] = [];
    for (let i = 0; i < 26; i++) {
        const a = -1.1 + (i / 25) * 2.2; // bue bak fienden og langs sidene
        const R = 46 + r() * 12;
        const x = Math.cos(a) * R + 8;
        const z = Math.sin(a) * R * 1.1;
        const h = 6 + r() * 10;
        parts.push({
            geometry: new THREE.ConeGeometry(1, 1, 5 + Math.floor(r() * 3)),
            position: [x, h / 2 - 1, z],
            rotation: [0, r() * 3, 0],
            scale: [7 + r() * 8, h, 7 + r() * 8],
            color: r() < 0.5 ? '#b58f62' : '#a5825a',
        });
    }
    return mergeParts(parts);
}

/** Vannet renner og skummet pulserer (modulfunksjon: muterer ikke hook-verdier i komponenten). */
function flowWater(tex: THREE.Texture, foam: THREE.Mesh | null, dt: number) {
    tex.offset.x += dt * 0.05;
    tex.offset.y += dt * 0.012;
    if (foam) (foam.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(performance.now() / 700) * 0.2;
}

export function Scenery({ ter }: { ter: Terrain }) {
    const q = useQuality();
    const gm = toonGradientMap();
    const data = useMemo(() => {
        const out: { rock?: THREE.BufferGeometry | null; grass?: THREE.BufferGeometry; rake?: THREE.BufferGeometry } = {};
        const outside = (x: number, z: number) => Math.abs(x) > 8.5 || Math.abs(z) > 13.5;
        if (ter === 'smalt')
            out.rock = rocks(
                ter,
                21,
                80,
                (r) => {
                    const x = 7.4 + r() * 10;
                    const z = -24 + r() * 48;
                    return [x, z];
                },
                [1.1, 3.2],
                ['#7a5a3c', '#6b4a2c', '#8a6a48', '#5e4430', '#9a7a56']
            );
        else if (ter === 'hoyde')
            out.rock = rocks(ter, 22, 26, (r) => {
                const x = -14 + r() * 30;
                const z = 14 + r() * 10;
                return [x, z];
            }, [0.4, 1.1]);
        else
            out.rock = rocks(ter, 23 + ter.length, 14, (r) => {
                const x = -14 + r() * 30;
                const z = -22 + r() * 44;
                return outside(x, z) ? [x, z] : null;
            }, [0.2, 0.55]);
        if (ter === 'steppe' || ter === 'slette' || ter === 'hoyde') {
            const r = rng(31);
            const parts: Part[] = [];
            const n = Math.round((ter === 'steppe' ? 260 : 90) * q.detail);
            for (let i = 0; i < n * 2 && parts.length < n * 3; i++) {
                const x = -14 + r() * 32;
                const z = -24 + r() * 48;
                if (ter !== 'steppe' && !outside(x, z)) continue;
                // En dusk tørt gress: tre tynne strå som lener seg ut.
                const s = 0.3 + r() * 0.3;
                const y = groundY(ter, x, z);
                const col = r() < 0.6 ? '#d8b868' : '#bf9c56';
                for (let k = 0; k < 3; k++) {
                    const a = (k / 3) * Math.PI * 2 + r();
                    parts.push({
                        geometry: new THREE.ConeGeometry(0.035, 1, 3),
                        position: [x + Math.cos(a) * 0.05, y + s * 0.45, z + Math.sin(a) * 0.05],
                        rotation: [Math.sin(a) * 0.45, 0, Math.cos(a) * 0.45],
                        scale: [1, s, 1],
                        color: col,
                    });
                }
            }
            if (parts.length) out.grass = mergeParts(parts);
        }
        if (ter === 'jevnet') {
            // Sletta ved Gaugamela ble jevnet for ljåvognene: rakede spor mellom hærene.
            const parts: Part[] = [];
            for (let i = -6; i <= 6; i++)
                parts.push({ geometry: new THREE.BoxGeometry(0.06, 0.015, 34), position: [i * 1.25, 0.02, 0], color: '#c9a872' });
            out.rake = mergeParts(parts);
        }
        return out;
    }, [ter, q.detail]);
    const mount = useMemo(() => mountains(), []);
    const water = useMemo(() => waterTexture(), []);
    const riverRef = useRef<THREE.Mesh>(null);
    const foamRef = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => flowWater(water, foamRef.current, dt));
    useEffect(
        () => () => {
            data.rock?.dispose();
            data.grass?.dispose();
            data.rake?.dispose();
        },
        [data]
    );
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            <mesh geometry={mount}>
                <meshToonMaterial vertexColors gradientMap={gm} />
            </mesh>
            {data.rock && (
                <mesh geometry={data.rock} castShadow={ter === 'smalt' ? false : q.tier !== 'lav'} receiveShadow>
                    <meshToonMaterial vertexColors gradientMap={gm} />
                </mesh>
            )}
            {data.grass && (
                <mesh geometry={data.grass}>
                    <meshToonMaterial vertexColors gradientMap={gm} />
                </mesh>
            )}
            {data.rake && (
                <mesh geometry={data.rake} receiveShadow>
                    <meshStandardMaterial vertexColors roughness={1} />
                </mesh>
            )}
            {ter === 'elv' && (
                <>
                    <mesh ref={riverRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                        <planeGeometry args={[110, 3]} />
                        <meshStandardMaterial map={water} color="#a8987a" roughness={0.3} metalness={0} emissive="#4a3e2a" emissiveIntensity={0.35} transparent opacity={0.9} />
                    </mesh>
                    {/* Skumkanter langs breddene: da leses båndet som vann, ikke vei. */}
                    <mesh ref={foamRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, -1.42]}>
                        <planeGeometry args={[110, 0.16]} />
                        <meshBasicMaterial color="#f4ead2" transparent opacity={0.6} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 1.42]}>
                        <planeGeometry args={[110, 0.16]} />
                        <meshBasicMaterial color="#f4ead2" transparent opacity={0.55} />
                    </mesh>
                </>
            )}
            {ter === 'smalt' && (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-32, -0.42, 0]}>
                        <planeGeometry args={[50, 110]} />
                        <meshStandardMaterial map={water} color="#8a7a5a" roughness={0.35} metalness={0} emissive="#3a3020" emissiveIntensity={0.4} />
                    </mesh>
                    <mesh ref={foamRef} rotation={[-Math.PI / 2, 0, 0]} position={[-7.3, -0.38, 0]}>
                        <planeGeometry args={[0.7, 110]} />
                        <meshBasicMaterial color="#efe3c8" transparent opacity={0.5} />
                    </mesh>
                </>
            )}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Rutene i planleggingen: mosaikk-rammer, og glød der en formasjon går i lås
// ---------------------------------------------------------------------------

function frameGeometry(): THREE.BufferGeometry {
    const W = 2.35;
    const D = 2.95;
    const t = 0.09;
    const parts: Part[] = [];
    const bar = (w: number, d: number, x: number, z: number, color: string, y = 0) =>
        parts.push({ geometry: new THREE.BoxGeometry(w, 0.03, d), position: [x, y, z], color });
    bar(W, t, 0, D / 2, PAL.sot);
    bar(W, t, 0, -D / 2, PAL.sot);
    bar(t, D, W / 2, 0, PAL.sot);
    bar(t, D, -W / 2, 0, PAL.sot);
    const i = 0.16;
    bar(W - i * 2, 0.05, 0, D / 2 - i, '#ffffff', 0.005);
    bar(W - i * 2, 0.05, 0, -D / 2 + i, '#ffffff', 0.005);
    bar(0.05, D - i * 2, W / 2 - i, 0, '#ffffff', 0.005);
    bar(0.05, D - i * 2, -W / 2 + i, 0, '#ffffff', 0.005);
    // Små hjørnesteiner
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push({ geometry: new THREE.BoxGeometry(0.2, 0.05, 0.2), position: [(sx * W) / 2, 0.01, (sz * D) / 2], color: PAL.gul });
    return mergeParts(parts);
}

/** Hvilke ruter på spillerens side står i en formasjon som har gått i lås. */
function locked(g: G): boolean[] {
    const out = new Array(2 * COLS).fill(false);
    const syn = synergies(g);
    const lv = (id: string) => syn.find((s) => s.id === id)?.level ?? 0;
    for (let c = 0; c < COLS; c++) {
        const u = g.board[0][c];
        if (u && UNITS[u.kind].pike && lv('sarissaskog')) {
            const l = g.board[0][c - 1];
            const r = g.board[0][c + 1];
            if ((l && UNITS[l.kind].pike) || (r && UNITS[r.kind].pike)) out[c] = true;
        }
    }
    if (lv('kile'))
        for (const c of [0, 4]) {
            const n = [0, 1].filter((r) => {
                const u = g.board[r][c];
                return u && UNITS[u.kind].klasse === 'kav';
            });
            if (n.length >= 2) for (const r of n) out[r * COLS + c] = true;
        }
    if (lv('pilsverm'))
        for (let c = 0; c < COLS; c++) {
            const u = g.board[1][c];
            if (u && UNITS[u.kind].klasse === 'skytter') out[COLS + c] = true;
        }
    return out;
}

const FM = new THREE.Matrix4();
const FC = new THREE.Color();

/** Skriver rammene og gløden (modulfunksjon, så komponenten ikke muterer hook-verdier). */
function drawTiles(mesh: THREE.InstancedMesh, glow: THREE.InstancedMesh, g: G, on: boolean, last: { v: string }) {
    mesh.visible = on;
    glow.visible = on;
    if (!on) return;
    const v = `${g.boardV}:${g.round}`;
    if (v !== last.v) {
        last.v = v;
        let n = 0;
        for (let side = 0; side < 2; side++)
            for (let r = 0; r < 2; r++)
                for (let c = 0; c < COLS; c++) {
                    if (colClosed(g, c)) continue;
                    const x = COL_X[c];
                    const z = side === 0 ? ROW_Z[r] : -ROW_Z[r];
                    const y = groundY(terrain(g), x, z) + 0.02;
                    FM.makeTranslation(x, y, z);
                    mesh.setMatrixAt(n, FM);
                    mesh.setColorAt(n, FC.set(side === 0 ? (c === 0 || c === 4 ? PAL.gul : PAL.kalk) : '#8a6a44'));
                    n++;
                }
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.boundingBox = null;
        const lk = locked(g);
        let k = 0;
        for (let i = 0; i < lk.length; i++) {
            if (!lk[i]) continue;
            const r = Math.floor(i / COLS);
            const c = i % COLS;
            const x = COL_X[c];
            const z = ROW_Z[r];
            FM.makeTranslation(x, groundY(terrain(g), x, z) + 0.05, z);
            glow.setMatrixAt(k++, FM);
        }
        glow.count = k;
        glow.instanceMatrix.needsUpdate = true;
        glow.boundingBox = null;
    }
    (glow.material as THREE.MeshBasicMaterial).opacity = 0.32 + Math.sin(performance.now() / 260) * 0.16;
}

export function Tiles({ gRef, show }: { gRef: React.MutableRefObject<G>; show: () => boolean }) {
    const gm = toonGradientMap();
    const [mesh] = useState(() => {
        const m = new THREE.InstancedMesh(frameGeometry(), new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gm }), 20);
        m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(60), 3);
        m.frustumCulled = false;
        m.receiveShadow = true;
        return m;
    });
    const [glow] = useState(() => {
        const g = new THREE.PlaneGeometry(2.2, 2.8);
        g.rotateX(-Math.PI / 2);
        const m = new THREE.InstancedMesh(
            g,
            new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
            10
        );
        m.frustumCulled = false;
        return m;
    });
    const lastV = useRef({ v: '' });
    useFrame(() => drawTiles(mesh, glow, gRef.current, show(), lastV.current));
    useEffect(
        () => () => {
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
            glow.geometry.dispose();
            (glow.material as THREE.Material).dispose();
        },
        [mesh, glow]
    );
    return (
        <>
            <primitive object={mesh} />
            <primitive object={glow} />
        </>
    );
}


// ---------------------------------------------------------------------------
// Hæren: alle instans-meshene, registrert i Army
// ---------------------------------------------------------------------------

function particleMaterial(kind: 'soft' | 'hard' | 'glow') {
    const alpha =
        kind === 'soft' ? 'smoothstep(1.0, 0.15, r)' : kind === 'hard' ? '1.0 - smoothstep(0.78, 1.0, r)' : 'pow(max(0.0, 1.0 - r), 1.7)';
    return new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]),
        vertexShader: /* glsl */ `
            attribute vec3 aColor;
            attribute float aAlpha;
            varying vec2 vUv;
            varying vec3 vCol;
            varying float vA;
            #include <fog_pars_vertex>
            void main() {
                vUv = uv;
                vCol = aColor;
                vA = aAlpha;
                vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                float s = length(instanceMatrix[0].xyz);
                mvPosition.xy += position.xy * s;
                gl_Position = projectionMatrix * mvPosition;
                #include <fog_vertex>
            }`,
        fragmentShader: /* glsl */ `
            varying vec2 vUv;
            varying vec3 vCol;
            varying float vA;
            #include <fog_pars_fragment>
            void main() {
                float r = length(vUv - 0.5) * 2.0;
                float a = ${alpha} * vA;
                if (a < 0.01) discard;
                gl_FragColor = vec4(vCol${kind === 'glow' ? ' * 2.2' : ''}, a);
                ${kind === 'glow' ? '' : '#include <tonemapping_fragment>'}
                #include <colorspace_fragment>
                ${kind === 'glow' ? '' : '#include <fog_fragment>'}
            }`,
        transparent: true,
        depthWrite: false,
        fog: kind !== 'glow',
        toneMapped: kind !== 'glow',
        blending: kind === 'glow' ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
}

/** Kobler meshene til hæren; skygger på middels og høy, falske skyggeflekker på lav. */
function bindArmy(army: Army, m: ArmyMeshes, shadows: boolean, particleScale: number) {
    for (const k of ['cloth', 'gear', 'helm', 'crest', 'shield', 'spear', 'horse', 'chariot', 'elephant', 'tower', 'standard', 'bow'] as const)
        m[k]!.castShadow = shadows;
    m.blob!.visible = !shadows;
    army.meshes = { ...m, blob: shadows ? null : m.blob };
    army.particleScale = particleScale;
    return () => {
        army.meshes = null;
    };
}

export function ArmyView({ army }: { army: Army }) {
    const q = useQuality();
    const shadows = q.tier !== 'lav';
    const [set] = useState(() => {
        const G = geos();
        const gm = toonGradientMap();
        const toon = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gm });
        const inst = (geo: THREE.BufferGeometry, n: number, mat: THREE.Material = toon, colored = true) => {
            const m = new THREE.InstancedMesh(geo, mat, n);
            if (colored) m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3);
            m.frustumCulled = false;
            m.count = 0;
            return m;
        };
        const humans = MAX_FIG + 60;
        const pts = (n: number, kind: 'soft' | 'hard' | 'glow') => {
            const geo = G.quad.clone();
            geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3));
            geo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(new Float32Array(n), 1));
            const m = new THREE.InstancedMesh(geo, particleMaterial(kind), n);
            m.frustumCulled = false;
            m.count = 0;
            m.renderOrder = kind === 'glow' ? 3 : 2;
            return m;
        };
        const meshes: ArmyMeshes = {
            cloth: inst(G.cloth, humans),
            gear: inst(G.gear, humans),
            helm: inst(G.helm, humans),
            crest: inst(G.crest, 160),
            shield: inst(G.shield, MAX_FIG),
            spear: inst(G.spear, humans),
            bow: inst(G.bow, 200),
            horse: inst(G.horse, 220),
            chariot: inst(G.chariot, 40),
            elephant: inst(G.elephant, 24),
            tower: inst(G.tower, 24),
            standard: inst(G.standard, 40),
            arrow: inst(G.arrow, 260, toon, false),
            splat: inst(
                G.splat,
                150,
                new THREE.MeshBasicMaterial({
                    color: '#6a150e',
                    transparent: true,
                    opacity: 0.8,
                    depthWrite: false,
                    polygonOffset: true,
                    polygonOffsetFactor: -2,
                }),
                false
            ),
            blob: inst(G.blob, MAX_FIG, new THREE.MeshBasicMaterial({ color: '#2a1c12', transparent: true, opacity: 0.3, depthWrite: false }), false),
            soft: pts(240, 'soft'),
            hard: pts(280, 'hard'),
            glow: pts(110, 'glow'),
        };
        const group = new THREE.Group();
        for (const m of Object.values(meshes)) if (m) group.add(m);
        return { meshes, group, toon };
    });
    useEffect(() => bindArmy(army, set.meshes, shadows, q.particleScale), [army, set, shadows, q.particleScale]);
    return <primitive object={set.group} />;
}
