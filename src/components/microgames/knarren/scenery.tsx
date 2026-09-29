import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROUTE, inBirdZone, type Game } from './game';
import { waveHeight, type Env } from './env';
import { useQuality } from '../kit';
import type { Pose } from './pose';

// Kulissene: landemerkene i leidsagnet, fugl og hval ved Island, drivis og isfjell
// ved Grønland, regn og lyn.
//
// Avstander: Spillet regner i km, men et 3D-hav på 2600 km lar seg ikke tegne.
// Landemerkene plasseres derfor med egne skalaer - sideveis 9 m per km, forover
// komprimert - og synker bak horisonten etter en jordkrumning som er strukket så
// den passer: ved riktig kurs står havet «midt i fjellsidene» på Færøyene, og
// Island er helt skjult - bare fugl og hval forteller at det er der.

const LATERAL = 2.5; // m per km sideveis
export const CURVE_R = 410; // «jordradius» i scenen (m)

/** Skipets x i scenen - krumningen måles sideveis fra kursen, se curved(). */
const CURVE_U = { uShipX: { value: 0 } };

/**
 * Jordkrumning på et materiale: hjørner synker med avstanden sideveis fra kursen.
 * Bare sideveis, med vilje: ruta er komprimert forover, og da ville et fjell langt
 * foran sunket for fort. Slik står et landemerke like dypt i havet hele veien -
 * og hvor dypt det står, forteller hvor langt fra kursen du er.
 */
function setCurveShip(x: number) {
    CURVE_U.uShipX.value = x;
}

function curved<T extends THREE.Material>(m: T): T {
    m.onBeforeCompile = (s) => {
        s.uniforms.uShipX = CURVE_U.uShipX;
        s.vertexShader = s.vertexShader
            .replace('void main() {', 'uniform float uShipX;\nvoid main() {')
            .replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
            {
                vec4 cw = modelMatrix * vec4(transformed, 1.0);
                float cd = cw.x - uShipX;
                transformed.y -= cd * cd / ${(2 * CURVE_R).toFixed(1)};
            }`
            );
    };
    return m;
}

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

interface PeakSpec {
    x: number; // sideveis (m)
    z: number; // forover (m)
    r: number; // radius ved foten
    h: number; // høyde
    steep: number; // 0 = rund kolle, 1 = bratt stup
    snow: number; // hvor høyt snøgrensa starter (0-1), 2 = ingen snø
}

/** Et fjell som en ujevn kjegle med farge etter høyde: grønt, fjell, snø og is. */
function peaksGeometry(
    peaks: PeakSpec[],
    palette: { low: string; rock: string; snow: string },
    seed: number
) {
    const R = rng(seed);
    const pos: number[] = [];
    const col: number[] = [];
    const low = new THREE.Color(palette.low);
    const rock = new THREE.Color(palette.rock);
    const snow = new THREE.Color(palette.snow);
    const c = new THREE.Color();
    for (const p of peaks) {
        const segs = 14;
        const rings = 6;
        const jit: number[] = [];
        for (let s = 0; s < segs; s++) jit.push(0.75 + R() * 0.5);
        const ring = (k: number) => {
            const pts: THREE.Vector3[] = [];
            const f = k / rings;
            // Profil: bratt = sylinderaktig med flat topp (Færøyene), rund = kolle.
            const rad =
                p.steep > 0.5 ? p.r * (1 - Math.pow(f, 3.2) * 0.9) : p.r * (1 - Math.pow(f, 0.8));
            const y = p.h * (p.steep > 0.5 ? Math.pow(f, 0.55) : Math.sin((f * Math.PI) / 2));
            for (let s = 0; s < segs; s++) {
                const t = (s / segs) * Math.PI * 2;
                const j = jit[s] * (1 - f * 0.3) + (R() - 0.5) * 0.12;
                pts.push(
                    new THREE.Vector3(
                        p.x + Math.cos(t) * rad * j,
                        y * (0.92 + R() * 0.16),
                        p.z + Math.sin(t) * rad * j
                    )
                );
            }
            return pts;
        };
        const rs = Array.from({ length: rings }, (_, k) => ring(k));
        const top = new THREE.Vector3(p.x, p.h, p.z);
        const colorAt = (v: THREE.Vector3, nUp: number) => {
            const f = v.y / p.h;
            c.copy(low).lerp(
                rock,
                THREE.MathUtils.smoothstep(f, 0.08, 0.35) * (0.6 + (1 - nUp) * 0.4)
            );
            if (f > p.snow)
                c.lerp(
                    snow,
                    THREE.MathUtils.smoothstep(f, p.snow, p.snow + 0.12) * (0.4 + nUp * 0.6)
                );
            return c;
        };
        const tri = (a: THREE.Vector3, b: THREE.Vector3, d: THREE.Vector3) => {
            const n = new THREE.Vector3()
                .subVectors(b, a)
                .cross(new THREE.Vector3().subVectors(d, a))
                .normalize();
            for (const v of [a, b, d]) {
                pos.push(v.x, v.y, v.z);
                const cc = colorAt(v, Math.abs(n.y));
                col.push(cc.r, cc.g, cc.b);
            }
        };
        for (let k = 0; k < rings - 1; k++)
            for (let s = 0; s < segs; s++) {
                const s1 = (s + 1) % segs;
                tri(rs[k][s], rs[k + 1][s], rs[k][s1]);
                tri(rs[k][s1], rs[k + 1][s], rs[k + 1][s1]);
            }
        for (let s = 0; s < segs; s++) tri(rs[rings - 1][s], top, rs[rings - 1][(s + 1) % segs]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
}

interface MarkSpec {
    id: string;
    x: number; // km langs ruta
    y: number; // km nord
    along0: number; // m foran når x er nådd
    alongK: number; // m per km langs ruta
    geo: () => THREE.BufferGeometry;
}

const MARKS: MarkSpec[] = [
    {
        id: 'hjaltland',
        x: 250,
        y: -62,
        along0: 0,
        alongK: 6,
        geo: () =>
            peaksGeometry(
                [
                    { x: 0, z: 0, r: 190, h: 48, steep: 0, snow: 2 },
                    { x: -150, z: 90, r: 150, h: 36, steep: 0, snow: 2 },
                    { x: 120, z: -110, r: 170, h: 42, steep: 0, snow: 2 },
                    { x: -40, z: -240, r: 120, h: 30, steep: 0, snow: 2 },
                ],
                { low: '#5f7148', rock: '#6b6352', snow: '#e8ecef' },
                11
            ),
    },
    {
        id: 'faeroyene',
        x: 720,
        y: 96,
        along0: 0,
        alongK: 6,
        geo: () =>
            peaksGeometry(
                [
                    { x: 0, z: 0, r: 90, h: 150, steep: 1, snow: 2 },
                    { x: 150, z: -80, r: 70, h: 125, steep: 1, snow: 2 },
                    { x: -130, z: 70, r: 80, h: 135, steep: 1, snow: 2 },
                    { x: 60, z: 170, r: 60, h: 110, steep: 1, snow: 2 },
                    { x: -40, z: -190, r: 70, h: 140, steep: 1, snow: 2 },
                    { x: 250, z: 60, r: 55, h: 100, steep: 1, snow: 2 },
                ],
                { low: '#4f6b3c', rock: '#39352f', snow: '#dfe5e8' },
                23
            ),
    },
    {
        id: 'island',
        x: 1380,
        y: 300,
        along0: 0,
        alongK: 6,
        geo: () =>
            peaksGeometry(
                [
                    { x: 0, z: 0, r: 420, h: 360, steep: 0, snow: 0.45 },
                    { x: -380, z: 260, r: 380, h: 300, steep: 0, snow: 0.5 },
                    { x: 360, z: -300, r: 460, h: 390, steep: 0, snow: 0.42 },
                    { x: 150, z: 450, r: 300, h: 250, steep: 0, snow: 0.55 },
                ],
                { low: '#5a5f45', rock: '#3b3834', snow: '#f1f5f8' },
                37
            ),
    },
];

// Grønland: en lang fjellrekke med isbre på toppen. Hvarf er sørspissen (y = 0);
// nordover ligger kysten tett i is, sørover er det bare åpent hav.
function greenlandGeometry() {
    const R = rng(71);
    const peaks: PeakSpec[] = [];
    for (let i = 0; i < 26; i++) {
        const lat = -40 + i * 26 + R() * 12; // km nord
        peaks.push({
            x: lat * LATERAL,
            z: -R() * 260 - (i === 0 ? 0 : 60),
            r: 260 + R() * 220,
            h: (i === 0 ? 300 : 340) + R() * 300,
            steep: 0.2,
            snow: 0.16 + R() * 0.16,
        });
    }
    return peaksGeometry(peaks, { low: '#4a4c4e', rock: '#3d4247', snow: '#eef4f8' }, 71);
}

const GREENLAND_ALONG0 = 900;
const GREENLAND_K = 14;

export function Landmarks({
    gRef,
    poseRef,
    menuRef,
    anchors,
}: {
    gRef: React.MutableRefObject<Game>;
    poseRef: React.MutableRefObject<Pose>;
    menuRef: React.MutableRefObject<boolean>;
    anchors: Record<string, THREE.Vector3>;
}) {
    const mats = useMemo(
        () =>
            curved(
                new THREE.MeshStandardMaterial({
                    vertexColors: true,
                    roughness: 0.95,
                    flatShading: true,
                })
            ),
        []
    );
    const geos = useMemo(() => MARKS.map((m) => m.geo()), []);
    const gl = useMemo(() => greenlandGeometry(), []);
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const glRef = useRef<THREE.Mesh>(null);
    useEffect(
        () => () => {
            geos.forEach((g) => g.dispose());
            gl.dispose();
            mats.dispose();
        },
        [geos, gl, mats]
    );
    useFrame(() => {
        const g = gRef.current;
        const p = poseRef.current;
        const menu = menuRef.current;
        setCurveShip(p.x);
        MARKS.forEach((m, i) => {
            const mesh = refs.current[i];
            if (!mesh) return;
            const dx = m.x - g.x;
            const on = !menu && dx < 700 && dx > -500;
            mesh.visible = on;
            if (!on) return;
            // Aldri tettere enn 170 m: for nær land er skjær og brenninger (spillet
            // straffer det), men kameraet skal ikke havne inne i fjellet.
            const lat = (m.y - g.y) * LATERAL;
            const side = (lat >= 0 ? 1 : -1) * Math.max(Math.abs(lat), 170);
            mesh.position.set(p.x + side, 0, p.z - (m.along0 + dx * m.alongK));
            anchors[m.id].set(mesh.position.x, 60, mesh.position.z);
        });
        const gm = glRef.current;
        if (gm) {
            const dx = ROUTE - g.x;
            const on = !menu && dx < 900;
            gm.visible = on;
            if (on) {
                gm.position.set(
                    p.x - g.y * LATERAL,
                    0,
                    p.z - (GREENLAND_ALONG0 + dx * GREENLAND_K)
                );
                anchors.hvarf.set(gm.position.x - 40 * LATERAL, 200, gm.position.z);
            }
        }
    });
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {MARKS.map((m, i) => (
                <mesh
                    key={m.id}
                    geometry={geos[i]}
                    material={mats}
                    visible={false}
                    scale={[0.55, 1, 0.55]}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                />
            ))}
            <mesh ref={glRef} geometry={gl} material={mats} visible={false} />
        </group>
    );
}

// ---------------------------------------------------------------------------
// Fugl og hval - tegnene på Island. Fugler (havsule og lunde) rundt skipet i
// Islandsbeltet, og hvaler som kommer opp og blåser.
// ---------------------------------------------------------------------------

const BIRD = (() => {
    const g = new THREE.BufferGeometry();
    const v = new Float32Array([
        0, 0, -0.35, -1.1, 0.12, 0.1, 0, 0, 0.25, 0, 0, -0.35, 0, 0, 0.25, 1.1, 0.12, 0.1,
    ]);
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
})();

export function Birds({
    gRef,
    poseRef,
    menuRef,
}: {
    gRef: React.MutableRefObject<Game>;
    poseRef: React.MutableRefObject<Pose>;
    menuRef: React.MutableRefObject<boolean>;
}) {
    const q = useQuality();
    const count = Math.round(34 * q.particleScale) + 4;
    const ref = useRef<THREE.InstancedMesh>(null);
    const [seeds] = useMemo(() => {
        const R = rng(5);
        return [Array.from({ length: count }, () => [R(), R(), R(), R()])];
    }, [count]);
    const vis = useRef(0);
    const m4 = useMemo(() => new THREE.Matrix4(), []);
    const qt = useMemo(() => new THREE.Quaternion(), []);
    const e = useMemo(() => new THREE.Euler(), []);
    const v = useMemo(() => new THREE.Vector3(), []);
    const s = useMemo(() => new THREE.Vector3(), []);
    useFrame((state, dt) => {
        const mesh = ref.current;
        if (!mesh) return;
        const g = gRef.current;
        const p = poseRef.current;
        const zone = !menuRef.current && inBirdZone(g) ? 1 : 0;
        // To måker følger alltid skipet; i Islandsbeltet kommer hele flokken.
        vis.current += (zone - vis.current) * Math.min(1, dt * 0.5);
        const n = Math.max(2, Math.round(count * vis.current));
        const t = state.clock.elapsedTime;
        for (let i = 0; i < count; i++) {
            const [a, b, c, d] = seeds[i];
            if (i >= n) {
                m4.makeScale(0, 0, 0);
                mesh.setMatrixAt(i, m4);
                continue;
            }
            const r = 14 + a * 45;
            const sp = (0.18 + b * 0.25) * (c > 0.5 ? 1 : -1);
            const ang = t * sp + d * 6.28;
            v.set(
                p.x + Math.cos(ang) * r,
                7 + b * 16 + Math.sin(t * 0.7 + a * 9) * 2,
                p.z - 20 + Math.sin(ang) * r * 0.7
            );
            e.set(0, -ang - (sp > 0 ? 0 : Math.PI), Math.sin(t * 1.3 + d * 5) * 0.3);
            qt.setFromEuler(e);
            const flap = 0.55 + 0.45 * Math.abs(Math.sin(t * (7 + c * 4) + a * 20));
            const size = 0.7 + c * 0.5;
            s.set(size, size * flap * 1.6, size);
            m4.compose(v, qt, s);
            mesh.setMatrixAt(i, m4);
        }
        mesh.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh
            ref={ref}
            args={[BIRD, undefined, count]}
            frustumCulled={false}
            userData={{ sceneAuditIgnore: true }}
        >
            <meshStandardMaterial color="#f2f0ea" side={THREE.DoubleSide} roughness={0.8} />
        </instancedMesh>
    );
}

const WHALE = (() => {
    const body = new THREE.SphereGeometry(1, 16, 10);
    body.scale(1.6, 1.1, 7);
    const fin = new THREE.ConeGeometry(0.35, 1.1, 5);
    fin.translate(0, 1.2, 1.8);
    const merged = new THREE.BufferGeometry();
    const a = body.toNonIndexed();
    const b = fin.toNonIndexed();
    const pos = new Float32Array(a.attributes.position.count * 3 + b.attributes.position.count * 3);
    pos.set(a.attributes.position.array as Float32Array, 0);
    pos.set(b.attributes.position.array as Float32Array, a.attributes.position.count * 3);
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.computeVertexNormals();
    return merged;
})();

export function Whales({
    gRef,
    poseRef,
    envRef,
    menuRef,
    onBlow,
}: {
    gRef: React.MutableRefObject<Game>;
    poseRef: React.MutableRefObject<Pose>;
    envRef: React.MutableRefObject<Env>;
    menuRef: React.MutableRefObject<boolean>;
    onBlow: () => void;
}) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const spouts = useRef<(THREE.Mesh | null)[]>([]);
    const st = useRef(
        [0, 1, 2].map((i) => ({ x: 0, z: 0, t: -1 - i * 3.5, placed: false, blown: false }))
    );
    useFrame((_, dt) => {
        const g = gRef.current;
        const p = poseRef.current;
        const env = envRef.current;
        const zone = !menuRef.current && inBirdZone(g);
        st.current.forEach((w, i) => {
            const grp = refs.current[i];
            const sp = spouts.current[i];
            if (!grp || !sp) return;
            w.t += dt;
            if (!zone && !w.placed) {
                grp.visible = false;
                sp.visible = false;
                return;
            }
            // En hval er oppe i ca. 7 s, så under i 5 s.
            if (w.t > 12 || !w.placed) {
                if (!zone) {
                    w.placed = false;
                    grp.visible = false;
                    sp.visible = false;
                    return;
                }
                w.t = 0;
                w.placed = true;
                w.blown = false;
                const side = i % 2 === 0 ? 1 : -1;
                w.x = p.x + side * (22 + Math.random() * 40);
                w.z = p.z - 40 - Math.random() * 90;
            }
            const k = w.t / 7;
            const up = k < 1 ? Math.sin(k * Math.PI) : 0;
            grp.visible = up > 0.01;
            const hy = waveHeight(w.x, w.z, env.time, env.waveScale);
            grp.position.set(w.x, hy - 1.9 + up * 1.7, w.z - w.t * 1.4);
            grp.rotation.set(Math.sin(k * Math.PI) * -0.12 + 0.05, 0.1, 0);
            const blow = k > 0.18 && k < 0.42;
            sp.visible = blow;
            if (blow) {
                if (!w.blown) {
                    w.blown = true;
                    onBlow();
                }
                const bk = (k - 0.18) / 0.24;
                sp.position.set(w.x, hy + 1 + bk * 3, w.z - w.t * 1.4 - 3);
                sp.scale.set(0.6 + bk * 1.6, 1 + bk * 3, 0.6 + bk * 1.6);
                (sp.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - bk);
            }
        });
    });
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {[0, 1, 2].map((i) => (
                <group
                    key={i}
                    visible={false}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                >
                    <mesh geometry={WHALE}>
                        <meshStandardMaterial color="#2a3036" roughness={0.45} metalness={0.1} />
                    </mesh>
                </group>
            ))}
            {[0, 1, 2].map((i) => (
                <mesh
                    key={`s${i}`}
                    visible={false}
                    ref={(el) => {
                        spouts.current[i] = el;
                    }}
                >
                    <sphereGeometry args={[1, 10, 8]} />
                    <meshBasicMaterial
                        color="#eef3f6"
                        transparent
                        opacity={0.5}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Isen ved Grønland: flak i spillet (kollisjon) og isfjell som pynt.
// ---------------------------------------------------------------------------

/** Nære ting (isflak) plasseres i samme skala som skipet flytter seg: 0,5 m per km. */
export const NEAR = 0.5;

const FLOE = (() => {
    const g = new THREE.CylinderGeometry(1, 1.1, 1, 7, 1);
    g.translate(0, 0.1, 0);
    return g;
})();

export function Ice({
    gRef,
    poseRef,
    envRef,
    menuRef,
}: {
    gRef: React.MutableRefObject<Game>;
    poseRef: React.MutableRefObject<Pose>;
    envRef: React.MutableRefObject<Env>;
    menuRef: React.MutableRefObject<boolean>;
}) {
    const floes = useRef<(THREE.Mesh | null)[]>([]);
    const bergs = useRef<(THREE.Mesh | null)[]>([]);
    const bergPos = useRef(
        Array.from({ length: 7 }, () => ({ x: 0, z: 0, placed: false, s: 1, r: 0 }))
    );
    const bergGeo = useMemo(() => {
        const g = new THREE.IcosahedronGeometry(1, 1);
        const p = g.attributes.position;
        const R = rng(3);
        for (let i = 0; i < p.count; i++) {
            const y = p.getY(i);
            p.setXYZ(
                i,
                p.getX(i) * (0.8 + R() * 0.5),
                y > 0 ? y * (1.2 + R() * 0.9) : y * 0.4,
                p.getZ(i) * (0.8 + R() * 0.5)
            );
        }
        g.computeVertexNormals();
        return g;
    }, []);
    useEffect(() => () => bergGeo.dispose(), [bergGeo]);
    useFrame(() => {
        const g = gRef.current;
        const p = poseRef.current;
        const env = envRef.current;
        const list = g.floes;
        floes.current.forEach((m, i) => {
            if (!m) return;
            const f = list[i];
            m.visible = !!f && !menuRef.current;
            if (!f) return;
            const x = p.x + (f.y - g.y) * NEAR;
            const z = p.z - (f.x - g.x) * NEAR;
            const r = f.r * NEAR;
            m.position.set(x, waveHeight(x, z, env.time, env.waveScale) - 0.25, z);
            m.scale.set(r, 1, r * 0.85);
            m.rotation.y = f.id * 1.7;
        });
        const near = !menuRef.current && g.x > ROUTE - 480;
        bergPos.current.forEach((b, i) => {
            const m = bergs.current[i];
            if (!m) return;
            if (!near) {
                b.placed = false;
                m.visible = false;
                return;
            }
            if (!b.placed || b.z > p.z + 200) {
                b.placed = true;
                b.x = p.x + (Math.random() - 0.5) * 700;
                b.z = p.z - 300 - Math.random() * 700;
                b.s = 8 + Math.random() * 18;
                b.r = Math.random() * 6;
                if (Math.abs(b.x - p.x) < 40) b.x += 60 * Math.sign(b.x - p.x || 1);
            }
            m.visible = true;
            m.position.set(b.x, -b.s * 0.15, b.z);
            m.scale.set(b.s, b.s * 0.8, b.s * 0.9);
            m.rotation.y = b.r;
        });
    });
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {Array.from({ length: 14 }, (_, i) => (
                <mesh
                    key={i}
                    geometry={FLOE}
                    visible={false}
                    ref={(el) => {
                        floes.current[i] = el;
                    }}
                >
                    <meshStandardMaterial
                        color="#e6f1f5"
                        roughness={0.6}
                        emissive="#9fc7d8"
                        emissiveIntensity={0.08}
                    />
                </mesh>
            ))}
            {Array.from({ length: 7 }, (_, i) => (
                <mesh
                    key={`b${i}`}
                    geometry={bergGeo}
                    visible={false}
                    ref={(el) => {
                        bergs.current[i] = el;
                    }}
                >
                    <meshStandardMaterial
                        color="#e9f3f7"
                        roughness={0.5}
                        flatShading
                        emissive="#7fb6cc"
                        emissiveIntensity={0.12}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Regn i storm: streker rundt kameraet.
// ---------------------------------------------------------------------------

function rainFrame(
    env: Env,
    mat: THREE.LineBasicMaterial,
    line: THREE.LineSegments | null,
    geo: THREE.BufferGeometry,
    drops: number[][],
    n: number,
    cam: THREE.Vector3,
    dt: number
) {
    const k = THREE.MathUtils.smoothstep(env.storm, 0.55, 0.9);
    mat.opacity = k * 0.42;

    if (!line) return;
    line.visible = k > 0.02;
    if (!line.visible) return;
    const a = geo.attributes.position.array as Float32Array;
    const fall = 24 * dt;
    for (let i = 0; i < n; i++) {
        const d = drops[i];
        d[1] -= fall;
        d[2] -= fall * 0.35;
        if (d[1] < -4) {
            d[1] += 40;
            d[0] = Math.random() * 70 - 35;
            d[2] = Math.random() * 70 - 35;
        }
        const x = cam.x + d[0];
        const y = cam.y - 12 + d[1];
        const z = cam.z + d[2];
        a[i * 6] = x;
        a[i * 6 + 1] = y;
        a[i * 6 + 2] = z;
        a[i * 6 + 3] = x;
        a[i * 6 + 4] = y + 0.9;
        a[i * 6 + 5] = z + 0.32;
    }
    geo.attributes.position.needsUpdate = true;
}

export function Rain({ envRef }: { envRef: React.MutableRefObject<Env> }) {
    const q = useQuality();
    const n = Math.round(1100 * q.particleScale);
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
        return g;
    }, [n]);
    const drops = useMemo(() => {
        const R = rng(9);
        return Array.from({ length: n }, () => [R() * 70 - 35, R() * 40, R() * 70 - 35]);
    }, [n]);
    const mat = useMemo(
        () =>
            new THREE.LineBasicMaterial({
                color: '#c8d4dc',
                transparent: true,
                opacity: 0,
                depthWrite: false,
            }),
        []
    );
    const ref = useRef<THREE.LineSegments>(null);
    useEffect(
        () => () => {
            geo.dispose();
            mat.dispose();
        },
        [geo, mat]
    );
    useFrame((state, dt) =>
        rainFrame(envRef.current, mat, ref.current, geo, drops, n, state.camera.position, dt)
    );
    return (
        <lineSegments
            ref={ref}
            geometry={geo}
            material={mat}
            frustumCulled={false}
            userData={{ sceneAuditIgnore: true }}
        />
    );
}
