// Kapellet i «Frisk puss!»: rommet, vinduslyset og det faste stillaset.
//
// Rommet er én boks med malte flater (paint.ts): draperier, veggfresker, vinduer med paver i
// nisjer og det blå stjernehvelvet. Sola står i sør og skinner skrått inn gjennom vinduene:
// lyssøyler (additive flater med gradient), lysflekker på gulvet, kalkstøv som svever i lyset og
// en varm dis nede mot gulvet (høydetåke i shaderen), så 18 meter kjennes høyt. Duer sitter i
// vinduene, og forhengene blafrer i trekken.
//
// Stillaset er slått sammen per materiale (ett tegnekall per type): Michelangelos veggbjelker i
// mørk gran med jernbeslag og skråstøtter ned i muren (de bærer - og ser sånn ut), broene i lysere
// gran, travertin-gesimsene med profil under, den malte søylen med rifler og grep.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mergeParts } from '../kit/mergeParts';
import { crispCanvas } from '../kit/crispText';
import { useQuality } from '../kit/quality';
import { ROOM, type Level } from './level';
import { boxGeo, cloudAt, finishedSpan, hazeify, scaffoldMaterials, sunDir, toon, wallZ } from './materials';
import { windState, type G } from './game';
import {
    ART,
    WIN_Y0,
    WIN_Y1,
    paintCeiling,
    paintEndWall,
    paintFloor,
    paintLongWall,
    paintShaft,
    paintSoft,
    paintWindowGlass,
    rng,
    windowsFor,
    type WindowDef,
} from './paint';

type GRef = React.MutableRefObject<G>;

// ---------------------------------------------------------------------------
// Lyset
// ---------------------------------------------------------------------------

export function Lights({ gRef, mirror }: { gRef: GRef; mirror: boolean }) {
    const q = useQuality();
    const d = sunDir(mirror);
    const shadows = q.tier !== 'lav';
    const sun = useRef<THREE.DirectionalLight>(null);
    useFrame(() => {
        // Skyer driver forbi sola
        if (sun.current) sun.current.intensity = 1.8 * (1 - 0.6 * cloudAt(gRef.current.t));
    });
    return (
        <>
            <hemisphereLight args={['#fff3dc', '#b99a70', 0.8]} />
            <ambientLight intensity={0.18} color="#fff1dc" />
            <directionalLight
                ref={sun}
                position={[-d.x * 30, -d.y * 30, -d.z * 30]}
                intensity={1.75}
                color="#fff0cf"
                castShadow={shadows}
                shadow-bias={-0.0006}
                shadow-normalBias={0.03}
            >
                <orthographicCamera attach="shadow-camera" args={[-25, 25, 25, -25, 1, 75]} />
            </directionalLight>
            {/* Refleks fra det solbelyste gulvet og nordveggen */}
            <directionalLight position={[mirror ? -4 : 4, 5, -20]} intensity={0.55} color="#ffdcae" />
        </>
    );
}

// ---------------------------------------------------------------------------
// Rommet: vegger, hvelv og gulv
// ---------------------------------------------------------------------------

const WALL_N = '#fff8ec';
const WALL_S = '#d9cdb8';

function Room({ gRef, L }: { gRef: GRef; L: Level }) {
    const q = useQuality();
    const W = q.tier === 'lav' ? 1024 : 2048;
    const tex = useMemo(() => {
        const fin = finishedSpan(L);
        return {
            north: paintLongWall(L, false, W, fin),
            south: paintLongWall(L, true, W, fin),
            west: paintEndWall(true, Math.max(1024, W / 2)),
            east: paintEndWall(false, Math.max(1024, W / 2)),
            ceil: paintCeiling(W, fin, null),
            floor: paintFloor(W),
        };
    }, [L, W]);
    useEffect(
        () => () => {
            Object.values(tex).forEach((t) => t.dispose());
        },
        [tex]
    );
    const mats = useMemo(() => {
        // Veggene og hvelvet har lyset malt inn (samme på alle kvalitetsnivå): nordveggen i sol,
        // sørveggen i skygge, hvelvet lyst av refleks. Gulvet tar imot skygger fra stillaset.
        // Rommets skall står aldri mellom kameraet og figuren, så det slipper utoningen.
        const m = (map: THREE.Texture, tint: string) => hazeify(new THREE.MeshBasicMaterial({ map, color: tint }), false);
        return {
            north: m(tex.north, WALL_N),
            south: m(tex.south, WALL_S),
            west: m(tex.west, '#ebe0cc'),
            east: m(tex.east, '#e6dac5'),
            ceil: m(tex.ceil, '#efe5d2'),
            floor: hazeify(new THREE.MeshLambertMaterial({ map: tex.floor }), false),
        };
    }, [tex]);
    const lx = ROOM.x1 - ROOM.x0;
    const lz = ROOM.z1 - ROOM.z0;
    const northRef = useRef<THREE.Mesh>(null);
    const southRef = useRef<THREE.Mesh>(null);
    useFrame(() => {
        // Skyene demper også sollyset som er malt inn på veggene
        const c = cloudAt(gRef.current.t);
        (northRef.current?.material as THREE.MeshBasicMaterial | undefined)?.color.set(WALL_N).multiplyScalar(1 - 0.25 * c);
        (southRef.current?.material as THREE.MeshBasicMaterial | undefined)?.color.set(WALL_S).multiplyScalar(1 - 0.2 * c);
    });
    return (
        <group>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.floor} receiveShadow>
                <planeGeometry args={[lx, lz]} />
            </mesh>
            <mesh position={[0, ROOM.h, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.ceil}>
                <planeGeometry args={[lx, lz]} />
            </mesh>
            <mesh ref={northRef} position={[0, ROOM.h / 2, ROOM.z0]} material={mats.north}>
                <planeGeometry args={[lx, ROOM.h]} />
            </mesh>
            <mesh ref={southRef} position={[0, ROOM.h / 2, ROOM.z1]} rotation={[0, Math.PI, 0]} material={mats.south}>
                <planeGeometry args={[lx, ROOM.h]} />
            </mesh>
            <mesh position={[ROOM.x0, ROOM.h / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.west}>
                <planeGeometry args={[lz, ROOM.h]} />
            </mesh>
            <mesh position={[ROOM.x1, ROOM.h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.east}>
                <planeGeometry args={[lz, ROOM.h]} />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Vinduene: glass som lyser, lyssøyler, lysflekker
// ---------------------------------------------------------------------------

const SHAFT_TEX = { t: null as THREE.CanvasTexture | null };
const SOFT_TEX = { t: null as THREE.CanvasTexture | null };
const shaftTex = () => (SHAFT_TEX.t ??= paintShaft());
const softTex = () => (SOFT_TEX.t ??= paintSoft());

function windowCenter(w: WindowDef): THREE.Vector3 {
    return new THREE.Vector3(w.x, (WIN_Y0 + WIN_Y1) / 2, w.south ? ROOM.z1 - 0.03 : ROOM.z0 + 0.03);
}

/** Legger et plan (bredde w, lengde len) langs retningen d fra punktet o. v=1 ligger ved o. */
function sheet(o: THREE.Vector3, d: THREE.Vector3, across: THREE.Vector3, w: number, len: number) {
    const g = new THREE.PlaneGeometry(w, len);
    const y = d.clone().negate();
    const x = across.clone().sub(y.clone().multiplyScalar(across.dot(y))).normalize();
    const z = new THREE.Vector3().crossVectors(x, y);
    const m = new THREE.Matrix4().makeBasis(x, y, z);
    m.setPosition(o.clone().addScaledVector(d, len / 2));
    g.applyMatrix4(m);
    return g;
}

function Windows({ gRef, L }: { gRef: GRef; L: Level }) {
    const q = useQuality();
    const wins = useMemo(() => windowsFor(L), [L]);
    const glass = useMemo(() => {
        const parts = wins.map((w) => {
            const g = new THREE.PlaneGeometry(w.w, WIN_Y1 - WIN_Y0);
            if (w.south) g.rotateY(Math.PI);
            const c = windowCenter(w);
            g.translate(c.x, c.y, c.z + (w.south ? -0.01 : 0.01));
            return g;
        });
        return mergeGeometries(parts);
    }, [wins]);
    const glassTex = useMemo(() => paintWindowGlass(), []);
    const shafts = useMemo(() => {
        const d = sunDir(L.mirror);
        const parts: THREE.BufferGeometry[] = [];
        const pools: THREE.BufferGeometry[] = [];
        for (const w of wins) {
            if (!w.south) continue;
            const o = windowCenter(w);
            const len = Math.min(o.y / -d.y, (ROOM.z1 - ROOM.z0 - 0.1) / -d.z);
            parts.push(sheet(o, d, new THREE.Vector3(1, 0, 0), w.w * 0.95, len));
            parts.push(sheet(o, d, new THREE.Vector3(0, 1, 0), (WIN_Y1 - WIN_Y0) * 0.8, len));
            // Lysflekken på gulvet (hvis strålen når ned dit før nordveggen)
            if (o.y / -d.y < (ROOM.z1 - ROOM.z0) / -d.z) {
                const hit = o.clone().addScaledVector(d, o.y / -d.y);
                const p = new THREE.PlaneGeometry(w.w * 1.3, 4.2);
                p.rotateX(-Math.PI / 2);
                p.translate(hit.x, 0.03, Math.max(ROOM.z0 + 1.6, hit.z));
                pools.push(p);
            }
        }
        return {
            shafts: parts.length ? mergeGeometries(parts) : null,
            pools: pools.length ? mergeGeometries(pools) : null,
        };
    }, [wins, L.mirror]);
    const shaftRef = useRef<THREE.Mesh>(null);
    const poolRef = useRef<THREE.Mesh>(null);
    const shaftBase = q.tier === 'lav' ? 0.26 : 0.3;
    useFrame(() => {
        const k = 1 - 0.75 * cloudAt(gRef.current.t);
        const sm = shaftRef.current?.material as THREE.MeshBasicMaterial | undefined;
        if (sm) sm.opacity = shaftBase * k;
        const pm = poolRef.current?.material as THREE.MeshBasicMaterial | undefined;
        if (pm) pm.opacity = 0.4 * k;
    });
    // Vinduskarmene (duene sitter der)
    const sills = useMemo(
        () =>
            mergeParts(
                wins.map((w) => ({
                    geometry: new THREE.BoxGeometry(w.w + 0.5, 0.18, 0.5),
                    position: [w.x, WIN_Y0 - 0.12, w.south ? ROOM.z1 - 0.22 : ROOM.z0 + 0.22] as [number, number, number],
                    color: ART.travLight,
                }))
            ),
        [wins]
    );
    const sillMat = useMemo(() => toon({ vertexColors: true }), []);
    return (
        <group>
            <mesh geometry={glass}>
                <meshBasicMaterial map={glassTex} color={[1.5, 1.42, 1.22]} toneMapped={false} alphaTest={0.5} fog={false} />
            </mesh>
            <mesh geometry={sills} material={sillMat} receiveShadow />
            {shafts.shafts && (
                <mesh ref={shaftRef} geometry={shafts.shafts} renderOrder={5}>
                    <meshBasicMaterial
                        map={shaftTex()}
                        color="#ffe7b8"
                        transparent
                        opacity={q.tier === 'lav' ? 0.26 : 0.3}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                        fog={false}
                    />
                </mesh>
            )}
            {shafts.pools && (
                <mesh ref={poolRef} geometry={shafts.pools} renderOrder={3}>
                    <meshBasicMaterial
                        map={softTex()}
                        color="#fff0cc"
                        transparent
                        opacity={0.4}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            )}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Kalkstøv i lyset
// ---------------------------------------------------------------------------

function Dust({ L }: { L: Level }) {
    const q = useQuality();
    const n = Math.round(420 * q.particleScale);
    const data = useMemo(() => {
        const r = rng(9);
        const d = sunDir(L.mirror);
        const wins = windowsFor(L).filter((w) => w.south);
        const base = new Float32Array(n * 3);
        const pos = new Float32Array(n * 3);
        const ph = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            let x: number, y: number, z: number;
            if (i % 10 < 7 && wins.length) {
                // I lyssøylene
                const w = wins[Math.floor(r() * wins.length)];
                const t = r() * 14;
                x = w.x + (r() - 0.5) * w.w + d.x * t;
                y = WIN_Y0 + r() * (WIN_Y1 - WIN_Y0) + d.y * t;
                z = ROOM.z1 - 0.2 + d.z * t;
            } else {
                x = (r() - 0.5) * 38;
                y = r() * 19;
                z = (r() - 0.5) * 12;
            }
            base[i * 3] = x;
            base[i * 3 + 1] = Math.max(0.3, y);
            base[i * 3 + 2] = Math.max(ROOM.z0 + 0.2, Math.min(ROOM.z1 - 0.2, z));
            ph[i] = r() * 100;
        }
        pos.set(base);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return { geo, base, pos, ph };
    }, [L, n]);
    const ptsRef = useRef<THREE.Points>(null);
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        const { base, ph } = data;
        const pts = ptsRef.current;
        if (!pts) return;
        const attr = pts.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < ph.length; i++) {
            const p = ph[i];
            attr.setXYZ(
                i,
                base[i * 3] + Math.sin(t * 0.13 + p) * 0.6,
                base[i * 3 + 1] + Math.sin(t * 0.09 + p * 1.3) * 0.5,
                base[i * 3 + 2] + Math.cos(t * 0.11 + p * 0.7) * 0.4
            );
        }
        attr.needsUpdate = true;
    });
    return (
        <points ref={ptsRef} geometry={data.geo} renderOrder={6}>
            <pointsMaterial
                map={softTex()}
                color="#fff4d8"
                size={0.09}
                sizeAttenuation
                transparent
                opacity={0.85}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

// ---------------------------------------------------------------------------
// Duer i vinduene (og én som flyr en runde under hvelvet)
// ---------------------------------------------------------------------------

const DOVE_BODY = mergeParts([
    { geometry: new THREE.SphereGeometry(0.13, 8, 6), scale: [1, 0.9, 1.5], color: '#b9b8bd' },
    { geometry: new THREE.SphereGeometry(0.08, 8, 6), position: [0, 0.12, 0.17], color: '#9ea4b0' },
    { geometry: new THREE.ConeGeometry(0.025, 0.07, 5), position: [0, 0.11, 0.27], rotation: [Math.PI / 2, 0, 0], color: '#d9a07e' },
    { geometry: new THREE.BoxGeometry(0.16, 0.03, 0.16), position: [0, 0.02, -0.22], color: '#8e8d94' },
    { geometry: new THREE.SphereGeometry(0.09, 8, 6), scale: [1.3, 0.6, 1.4], position: [0, 0.05, -0.02], color: '#d4d3d8' },
]);
const WING = (() => {
    const g = new THREE.BoxGeometry(0.34, 0.02, 0.16);
    g.translate(0.17, 0, 0);
    return g;
})();

function Doves({ L }: { L: Level }) {
    const q = useQuality();
    const spots = useMemo(() => {
        const r = rng(4);
        const wins = windowsFor(L);
        const out: { x: number; y: number; z: number; rot: number; ph: number }[] = [];
        const want = q.tier === 'lav' ? 4 : 7;
        for (let i = 0; i < wins.length && out.length < want; i += 2) {
            const w = wins[(i * 5) % wins.length];
            const zz = w.south ? ROOM.z1 - 0.3 : ROOM.z0 + 0.3;
            out.push({ x: w.x + (r() - 0.5) * w.w * 0.8, y: WIN_Y0 - 0.03, z: zz, rot: (w.south ? Math.PI : 0) + (r() - 0.5) * 2, ph: r() * 10 });
        }
        return out;
    }, [L, q.tier]);
    const mat = useMemo(() => toon({ vertexColors: true }), []);
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const flyer = useRef<THREE.Group>(null);
    const wl = useRef<THREE.Mesh>(null);
    const wr = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        spots.forEach((s, i) => {
            const m = refs.current[i];
            if (!m) return;
            // Nikker med hodet, snur seg av og til, et lite hopp innimellom
            const peck = Math.max(0, Math.sin(t * 3.1 + s.ph)) ** 8;
            const hop = Math.max(0, Math.sin(t * 0.7 + s.ph * 2)) ** 30 * 0.12;
            m.position.set(s.x, s.y + hop, s.z);
            m.rotation.set(peck * 0.5, s.rot + Math.sin(t * 0.4 + s.ph) * 0.8, 0);
        });
        const f = flyer.current;
        if (f) {
            const a = t * 0.22;
            const x = Math.sin(a) * 15;
            const z = Math.sin(a * 2) * 3.2;
            f.position.set(x, 16.2 + Math.sin(a * 3) * 0.8, z);
            f.rotation.set(0, Math.atan2(Math.cos(a) * 15, Math.cos(a * 2) * 6.4), Math.sin(a * 2) * -0.35);
            const flap = Math.sin(t * 16) * 0.8;
            if (wl.current) wl.current.rotation.z = flap;
            if (wr.current) wr.current.rotation.z = Math.PI - flap;
        }
    });
    return (
        <group>
            {spots.map((_s, i) => (
                <mesh key={i} ref={(el) => void (refs.current[i] = el)} geometry={DOVE_BODY} material={mat} />
            ))}
            <group ref={flyer}>
                <mesh geometry={DOVE_BODY} material={mat} />
                <mesh ref={wl} geometry={WING} material={mat} position={[0.06, 0.06, 0]} />
                <mesh ref={wr} geometry={WING} material={mat} position={[-0.06, 0.06, 0]} />
            </group>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Forheng som blafrer i trekken
// ---------------------------------------------------------------------------

interface ClothDef {
    x: number;
    z: number;
    south: boolean;
    w: number;
    h: number;
    top: number;
    color: string;
    wind: number; // hvilket vindu med trekk (-1 = bare stille lufting)
}

function Cloths({ gRef, L }: { gRef: GRef; L: Level }) {
    const q = useQuality();
    const defs = useMemo<ClothDef[]>(() => {
        const wins = windowsFor(L);
        const cols = ['#e7c9a0', '#c95a44', '#e8dcc0', '#b9c98a'];
        return wins
            .filter((w, i) => w.south || i % 2 === 0)
            .slice(0, q.tier === 'lav' ? 6 : 12)
            .map((w, i) => {
                const wi = L.winds.findIndex((d) => w.south === d.max[2] > 0 && Math.abs((d.min[0] + d.max[0]) / 2 - w.x) < 1);
                const side = i % 2 ? 1 : -1;
                return {
                    x: w.x + side * (w.w / 2 + 0.1),
                    z: w.south ? ROOM.z1 - 0.12 : ROOM.z0 + 0.12,
                    south: w.south,
                    w: 1.1,
                    h: 3.4,
                    top: WIN_Y1 + 0.2,
                    color: cols[i % cols.length],
                    wind: wi,
                };
            });
    }, [L, q.tier]);
    const geos = useMemo(
        () =>
            defs.map((d) => {
                const g = new THREE.PlaneGeometry(d.w, d.h, 4, 8);
                g.translate(0, -d.h / 2, 0);
                return { g, base: Float32Array.from(g.attributes.position.array as Float32Array) };
            }),
        [defs]
    );
    const mats = useMemo(
        () => defs.map((d) => toon({ color: d.color, side: THREE.DoubleSide, emissive: new THREE.Color(d.color).multiplyScalar(0.12) })),
        [defs]
    );
    const gust = useRef<number[]>([]);
    useFrame((state, dt) => {
        const t = state.clock.elapsedTime;
        const g = gRef.current;
        defs.forEach((d, i) => {
            const w = d.wind >= 0 ? L.winds[d.wind] : null;
            const s = w ? windState(w, g.t) : 'rolig';
            const target = s === 'kast' ? 1 : s === 'varsel' ? 0.45 : 0.08;
            const cur = (gust.current[i] ??= 0.08);
            gust.current[i] = cur + (target - cur) * Math.min(1, dt * 4);
            const k = gust.current[i];
            const { g: geo, base } = geos[i];
            const pos = geo.attributes.position as THREE.BufferAttribute;
            for (let v = 0; v < pos.count; v++) {
                const x = base[v * 3];
                const y = base[v * 3 + 1];
                const down = -y / d.h; // 0 øverst, 1 nederst
                const wave = Math.sin(t * (3 + k * 6) + x * 2.5 + down * 4 + i) * 0.12;
                pos.setZ(v, down * down * (k * 1.6 + wave * (0.4 + k * 2)));
                pos.setX(v, x + Math.sin(t * 2 + down * 3 + i) * 0.04 * down);
            }
            pos.needsUpdate = true;
            geo.computeVertexNormals();
        });
    });
    return (
        <group>
            {defs.map((d, i) => (
                <mesh
                    key={i}
                    geometry={geos[i].g}
                    material={mats[i]}
                    position={[d.x, d.top, d.z]}
                    rotation={[0, d.south ? Math.PI : 0, 0]}
                />
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Stillaset som står stille: slått sammen per materiale
// ---------------------------------------------------------------------------

type Pieces = Record<string, THREE.BufferGeometry[]>;
const add = (p: Pieces, k: string, g: THREE.BufferGeometry) => (p[k] ??= []).push(g);

/** Bygger alle faste deler av stillaset. */
function buildScaffold(L: Level): Record<string, THREE.BufferGeometry> {
    const r = rng(L.id === 'forste' ? 11 : 12);
    const P: Pieces = {};
    const jit = () => (r() - 0.5) * 0.16;
    for (const b of L.static) {
        const sx = b.max[0] - b.min[0];
        const sz = b.max[2] - b.min[2];
        switch (b.kind) {
            case 'bjelke': {
                add(P, 'wood', boxGeo(b.min, b.max, jit()));
                const wz = wallZ(b);
                if (wz !== null) {
                    const s = wz < 0 ? 1 : -1;
                    // Jernbeslag der bjelken går inn i muren
                    add(P, 'iron', boxGeo([b.min[0] - 0.04, b.min[1] - 0.05, wz + s * 0.12], [b.max[0] + 0.04, b.max[1] + 0.05, wz + s * 0.2]));
                    // Skråstøtter fra bjelkens ytterkant ned i muren: den bærer, og det syns
                    const depth = sz;
                    if (depth > 0.9 && sx < 6) {
                        for (const xx of sx > 2.2 ? [b.min[0] + 0.25, b.max[0] - 0.25] : [(b.min[0] + b.max[0]) / 2]) {
                            const len = Math.hypot(depth * 0.8, 1.0);
                            const g = new THREE.BoxGeometry(0.12, len, 0.12);
                            g.rotateX(s * Math.atan2(depth * 0.8, 1.0));
                            g.translate(xx, b.min[1] - 0.5, wz + s * depth * 0.4);
                            const gg = g.toNonIndexed();
                            gg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count * 3).fill(0.85), 3));
                            add(P, 'wood', gg);
                        }
                    }
                }
                break;
            }
            case 'bro':
            case 'mester': {
                // Dekket av planker, med to bærebjelker under kantene
                add(P, 'deck', boxGeo(b.min, b.max, jit() * 0.5));
                const long = sx >= sz ? 0 : 2;
                const lo = long === 0 ? [b.min[2] + 0.05, b.max[2] - 0.2] : [b.min[0] + 0.05, b.max[0] - 0.2];
                for (const e of lo) {
                    const mn: [number, number, number] =
                        long === 0 ? [b.min[0], b.min[1] - 0.22, e] : [e, b.min[1] - 0.22, b.min[2]];
                    const mx: [number, number, number] =
                        long === 0 ? [b.max[0], b.min[1] + 0.02, e + 0.15] : [e + 0.15, b.min[1] + 0.02, b.max[2]];
                    add(P, 'wood', boxGeo(mn, mx, -0.1));
                }
                if (b.wet) {
                    const g = new THREE.PlaneGeometry(sx, sz);
                    g.rotateX(-Math.PI / 2);
                    const uv = g.attributes.uv as THREE.BufferAttribute;
                    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx * 0.35, uv.getY(i) * sz * 0.35);
                    g.translate((b.min[0] + b.max[0]) / 2, b.max[1] + 0.012, (b.min[2] + b.max[2]) / 2);
                    add(P, 'wet', g);
                }
                break;
            }
            case 'stein': {
                add(P, b.grip ? 'fluted' : 'trav', boxGeo(b.min, b.max, jit() * 0.5));
                // Profil under gesimsen (en list som stikker litt ut)
                if (b.max[1] - b.min[1] < 0.8) {
                    const wz = wallZ(b);
                    const s = wz === null ? 0 : wz < 0 ? 1 : -1;
                    add(
                        P,
                        'trav',
                        boxGeo(
                            [b.min[0], b.min[1] - 0.16, s > 0 ? b.min[2] : b.min[2] + 0.12],
                            [b.max[0], b.min[1], s < 0 ? b.max[2] : b.max[2] - 0.12],
                            -0.18
                        )
                    );
                }
                break;
            }
            case 'skranke': {
                const tall = b.max[1] - b.min[1] > 2;
                if (tall) {
                    // Kalkkaret: tre med jernbånd, hvit kalk på toppen
                    add(P, 'wood', boxGeo(b.min, [b.max[0], b.max[1] - 0.12, b.max[2]], 0.05));
                    add(P, 'lime', boxGeo([b.min[0] + 0.1, b.max[1] - 0.14, b.min[2] + 0.1], [b.max[0] - 0.1, b.max[1] - 0.06, b.max[2] - 0.1]));
                    for (const yy of [0.5, 1.4, 2.1])
                        add(P, 'iron', boxGeo([b.min[0] - 0.03, b.min[1] + yy, b.min[2] - 0.03], [b.max[0] + 0.03, b.min[1] + yy + 0.08, b.max[2] + 0.03]));
                } else {
                    // Marmorskranken med forgylt list
                    add(P, 'marble', boxGeo(b.min, [b.max[0], b.max[1] - 0.1, b.max[2]]));
                    add(P, 'trav', boxGeo([b.min[0] - 0.05, b.max[1] - 0.1, b.min[2]], [b.max[0] + 0.05, b.max[1], b.max[2]], 0.25));
                }
                break;
            }
            default:
                break;
        }
    }
    // Stigene: to vanger og trinn
    for (const d of L.ladders) {
        const ox = d.x - d.n[0] * 0.12;
        const oz = d.z - d.n[1] * 0.12;
        const ax = Math.abs(d.n[0]) > 0.5;
        for (const s of [-0.35, 0.35]) {
            const cx = ax ? ox : ox + s;
            const cz = ax ? oz + s : oz;
            add(P, 'wood', boxGeo([cx - 0.04, d.y0, cz - 0.04], [cx + 0.04, d.y1 + 0.4, cz + 0.04], 0.1));
        }
        for (let y = d.y0 + 0.3; y < d.y1; y += 0.35)
            add(
                P,
                'wood',
                boxGeo(
                    ax ? [ox - 0.03, y - 0.025, oz - 0.35] : [ox - 0.35, y - 0.025, oz - 0.03],
                    ax ? [ox + 0.03, y + 0.025, oz + 0.35] : [ox + 0.35, y + 0.025, oz + 0.03],
                    0.2
                )
            );
    }
    // Tauene: hamp med knuter
    for (const rp of L.ropes) {
        const g = new THREE.CylinderGeometry(0.045, 0.045, rp.yTop - rp.yBot, 6);
        g.translate(rp.x, (rp.yTop + rp.yBot) / 2, rp.z);
        const gg = g.toNonIndexed();
        gg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count * 3).fill(1), 3));
        add(P, 'rope', gg);
        for (let y = rp.yBot + 0.4; y < rp.yTop - 1; y += 1.1) {
            const k = new THREE.SphereGeometry(0.08, 6, 4).toNonIndexed();
            k.translate(rp.x, y, rp.z);
            k.setAttribute('color', new THREE.BufferAttribute(new Float32Array(k.attributes.position.count * 3).fill(0.85), 3));
            add(P, 'rope', k);
        }
    }
    // Mesterens plattform: malingskrukker, en kartongrull og en kalkbalje
    const m = L.static.find((b) => b.kind === 'mester');
    if (m) {
        const cz = (m.min[2] + m.max[2]) / 2;
        const pots: [number, number, string][] = [
            [0.3, 0.2, '#3f64b0'],
            [0.55, -0.35, '#c2543c'],
            [0.8, 0.35, '#e0b64a'],
            [0.35, -0.7, '#8fae4c'],
        ];
        const edge = L.master.p[0] < 0 ? m.max[0] - 1.1 : m.min[0] + 1.1;
        const potGeo = mergeParts(
            pots.flatMap(([dx, dz, c]) => [
                { geometry: new THREE.CylinderGeometry(0.13, 0.11, 0.24, 8), position: [edge + dx * (L.master.p[0] < 0 ? -1 : 1), m.max[1] + 0.12, cz + dz] as [number, number, number], color: '#8a6a4a' },
                { geometry: new THREE.CylinderGeometry(0.11, 0.11, 0.02, 8), position: [edge + dx * (L.master.p[0] < 0 ? -1 : 1), m.max[1] + 0.24, cz + dz] as [number, number, number], color: c },
            ])
        );
        const pg = potGeo.clone();
        add(P, 'props', pg);
    }
    const out: Record<string, THREE.BufferGeometry> = {};
    for (const [k, list] of Object.entries(P)) {
        const norm = list.map((g) => {
            const n = g.index ? g.toNonIndexed() : g;
            if (!n.attributes.uv) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
            if (!n.attributes.color)
                n.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 3).fill(1), 3));
            return n;
        });
        out[k] = mergeGeometries(norm);
    }
    return out;
}

function Scaffold({ L }: { L: Level }) {
    const q = useQuality();
    const geos = useMemo(() => buildScaffold(L), [L]);
    useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);
    const mats = scaffoldMaterials();
    const propsMat = useMemo(() => toon({ vertexColors: true }), []);
    const cast = q.tier !== 'lav';
    return (
        <group>
            {Object.entries(geos).map(([k, g]) => (
                <mesh
                    key={k}
                    geometry={g}
                    material={k === 'props' ? propsMat : mats[k]}
                    castShadow={cast && k !== 'wet'}
                    receiveShadow={k !== 'wet'}
                    renderOrder={k === 'wet' ? 2 : 0}
                />
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Skilt: navnetavla ved mesteren (som tavlene under profetene)
// ---------------------------------------------------------------------------

function MasterTablet({ L }: { L: Level }) {
    const board = useMemo(() => {
        const b = crispCanvas(320, 90);
        b.draw((ctx, w, h) => {
            const g = ctx.createLinearGradient(0, 0, 0, h);
            g.addColorStop(0, '#ecd9b2');
            g.addColorStop(1, '#c9ad83');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = '#8a6e4a';
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, w - 6, h - 6);
            ctx.fillStyle = '#3a2f22';
            ctx.font = '900 38px Outfit, Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('MICHELANGELO', w / 2, h / 2 + 2);
        });
        return b;
    }, []);
    useEffect(() => () => board.tex.dispose(), [board]);
    const m = L.static.find((b) => b.kind === 'mester');
    if (!m) return null;
    // På forkanten av plattformen, vendt mot rommet
    const x = (m.min[0] + m.max[0]) / 2;
    return (
        <mesh position={[x, m.min[1] - 0.45, m.max[2] + 0.02]}>
            <planeGeometry args={[2.2, 0.62]} />
            <meshBasicMaterial map={board.tex} toneMapped={false} />
        </mesh>
    );
}

// ---------------------------------------------------------------------------

export function Chapel({ gRef, L }: { gRef: GRef; L: Level }) {
    return (
        <group>
            <Room gRef={gRef} L={L} />
            <Windows gRef={gRef} L={L} />
            <Scaffold L={L} />
            <MasterTablet L={L} />
            <Dust L={L} />
            <Doves L={L} />
            <Cloths gRef={gRef} L={L} />
        </group>
    );
}
