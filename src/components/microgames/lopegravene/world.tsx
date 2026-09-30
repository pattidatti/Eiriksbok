import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit/quality';
import { crispCanvas } from '../kit/crispText';
import { PAL, toWorld, fromWorld } from './geo';
import { WAVES, ROWS, rangeOf, type G, type EnemyKind, type TowerKind } from './game';
import {
    figures,
    figureMaterial,
    outlineMaterial,
    hatGeos,
    towerModels,
    scaffoldGeo,
    fortGeo,
    merlonGeo,
    tentGeo,
    pineGeo,
    gabionGeo,
    postGeo,
    debrisGeo,
    litToon,
    snowTexture,
    splatTexture,
    puffTexture,
    skyTexture,
    type FigureDef,
} from './models';
import { makeTerrainGeometry, fillTerrain, gabionSpots, WALL_TOP } from './terrain';
import { DECAL_MAX, TRACER_MAX, karlSpot, karlWatching, type Vis, type PointPool } from './vis';

// Scenen i Løpegravene: en nattbeleiring i snø, malt som et karolinsk slagmaleri.
// Alt som gjentas er InstancedMesh med fast budsjett; partiklene er to THREE.Points.
// Ingen setState per bilde: komponentene leser spillet (gRef) og pynten (vis) i useFrame.

type GRef = React.MutableRefObject<G>;

const M4 = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const COLR = new THREE.Color();
const WHITE = new THREE.Color(1, 1, 1);
const HIT = new THREE.Color(2.6, 2.2, 2);

function place(m: THREE.InstancedMesh, i: number, x: number, y: number, z: number, rx: number, ry: number, rz: number, s: number, sy = s) {
    E.set(rx, ry, rz, 'YXZ');
    Q.setFromEuler(E);
    P.set(x, y, z);
    S.set(s, sy, s);
    M4.compose(P, Q, S);
    m.setMatrixAt(i, M4);
}

/** Mutasjoner av three-objekter fra useFrame bor i modulfunksjoner (react-hooks/immutability). */
function touch(a: { needsUpdate: boolean }) {
    a.needsUpdate = true;
}
function setU(m: THREE.ShaderMaterial, name: string, v: number) {
    m.uniforms[name].value = v;
}
function pointScale(h: number, dpr: number, fov: number) {
    return (h * dpr) / (2 * Math.tan((fov * Math.PI) / 360));
}

function toonMat(extra: THREE.MeshToonMaterialParameters = {}, lit = 0.27) {
    return litToon(lit, extra);
}

// ---------------------------------------------------------------------------
// Lyset: kaldt måneskinn, lyskulene som hovedlys, fakler og smell
// ---------------------------------------------------------------------------

export function Lights({ vis }: { vis: Vis }) {
    const sun = useRef<THREE.DirectionalLight>(null);
    const a = useRef<THREE.PointLight>(null);
    const b = useRef<THREE.PointLight>(null);
    const fort = useRef<THREE.PointLight>(null);
    const flash = useRef<THREE.PointLight>(null);
    const target = useMemo(() => {
        const o = new THREE.Object3D();
        o.position.set(0, 0, 6.5);
        return o;
    }, []);
    const scene = useThree((s) => s.scene);
    useEffect(() => {
        scene.add(target);
        if (sun.current) sun.current.target = target;
        return () => {
            scene.remove(target);
        };
    }, [scene, target]);
    useFrame((st) => {
        const t = st.clock.elapsedTime;
        const [fa, fb] = vis.flares;
        const main = fa.light >= fb.light ? fa : fb;
        if (sun.current) {
            // Skyggene kommer fra lyskula som lyser sterkest: lange, og de vandrer når den synker.
            const dx = main.x - 0;
            const dz = main.z - 6.5;
            const L = Math.hypot(dx, dz) || 1;
            const up = 1 + Math.max(0, main.y - 1.5) * 0.25;
            sun.current.position.set((dx / L) * 10, 10 * up, 6.5 + (dz / L) * 10);
            sun.current.intensity = 0.32 + 0.3 * Math.max(fa.light, fb.light);
        }
        if (a.current) {
            a.current.position.set(fa.x, fa.y, fa.z);
            a.current.intensity = 36 * fa.light;
        }
        if (b.current) {
            b.current.position.set(fb.x, fb.y, fb.z);
            b.current.intensity = 36 * fb.light;
        }
        if (fort.current) fort.current.intensity = 5 + Math.sin(t * 11) * 0.5 + Math.sin(t * 7.3) * 0.4;
        if (flash.current) {
            flash.current.position.set(vis.flash.x, vis.flash.y, vis.flash.z);
            flash.current.intensity = vis.flash.i * 20;
        }
    });
    return (
        <>
            {/* Kald natt: blått himmellys ovenfra, nesten svart bakke. Det varme lyset kommer
                bare fra lyskulene, faklene og munningsflammene - varmt mot kaldt. */}
            <hemisphereLight args={['#5b78d0', '#0a1024', 0.78]} />
            <directionalLight position={[-6, 12, -2]} intensity={0.34} color="#7f9dff" />
            <directionalLight
                ref={sun}
                position={[0, 10, 6]}
                intensity={0.5}
                color="#b8c8ff"
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0015}
                shadow-normalBias={0.02}
            >
                <orthographicCamera attach="shadow-camera" args={[-13, 13, 13, -13, 1, 40]} />
            </directionalLight>
            <pointLight ref={a} color="#ffae45" distance={9} decay={1.3} />
            <pointLight ref={b} color="#ffb85a" distance={9} decay={1.3} />
            <pointLight ref={fort} position={[0, 2.2, -0.4]} color="#ff8a3a" distance={9} decay={1.6} />
            <pointLight ref={flash} color="#ffb45a" distance={9} decay={1.6} />
        </>
    );
}

// ---------------------------------------------------------------------------
// Terrenget (og der eleven klikker)
// ---------------------------------------------------------------------------

export function Terrain({
    vis,
    onPick,
    onHover,
}: {
    vis: Vis;
    onPick: (cx: number, cz: number) => void;
    onHover: (cx: number, cz: number, on: boolean) => void;
}) {
    const geo = useMemo(() => makeTerrainGeometry(), []);
    const mat = useMemo(
        () => toonMat({ map: snowTexture() }, 0.05),
        []
    );
    const v = useRef(-1);
    useFrame(() => {
        if (v.current !== vis.terrainV) {
            v.current = vis.terrainV;
            fillTerrain(geo, vis.hm.td, vis.dirty);
            vis.terrainTaken();
        }
    });
    return (
        <mesh
            geometry={geo}
            material={mat}
            receiveShadow
            onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                const [cx, cz] = fromWorld(e.point.x, e.point.z);
                onHover(cx, cz, true);
            }}
            onPointerOut={() => onHover(0, 0, false)}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                const [cx, cz] = fromWorld(e.point.x, e.point.z);
                onPick(cx, cz);
            }}
        />
    );
}

/** Skanskurvene langs grøftekantene, og fjellknausene der ingen kan bygge. */
export function Gabions({ gRef, vis }: { gRef: GRef; vis: Vis }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const rocks = useRef<THREE.InstancedMesh>(null);
    const posts = useRef<THREE.InstancedMesh>(null);
    const MAX = 720;
    const PMAX = 240;
    const v = useRef(-1);
    const mat = useMemo(() => toonMat(), []);
    const rockGeo = useMemo(() => rockGeometry(), []);
    useFrame(() => {
        const m = ref.current;
        if (!m || v.current === vis.terrainV) return;
        v.current = vis.terrainV;
        const rk = rocks.current;
        if (rk) {
            const g = gRef.current;
            let n = 0;
            for (let z = 0; z < g.cells.length; z++)
                for (let x = 0; x < g.cells[z].length; x++) {
                    if (g.cells[z][x] !== 'fjell' || n > 76) continue;
                    const [wx, wz] = toWorld(x, z);
                    for (let k = 0; k < 3; k++) {
                        const ox = (seeded(x * 31 + z * 7 + k) - 0.5) * 0.5;
                        const oz = (seeded(x * 13 + z * 17 + k * 5) - 0.5) * 0.5;
                        const s = k === 0 ? 0.42 : 0.2 + seeded(x + z + k) * 0.15;
                        place(rk, n++, wx + ox * (k ? 1 : 0.2), vis.hm.at(wx, wz) - 0.05, wz + oz * (k ? 1 : 0.2), 0, seeded(x * 3 + k) * 6, 0, s, s * 0.8);
                    }
                }
            rk.count = n;
            rk.instanceMatrix.needsUpdate = true;
        }
        // Stikker langs veien over den åpne sletta og glacis, så eleven ser hvor den går.
        const pm = posts.current;
        if (pm) {
            const g = gRef.current;
            let n = 0;
            for (const rt of g.routes)
                for (let i = 1; i < rt.cells.length && n < PMAX - 2; i++) {
                    const [x, z] = rt.cells[i];
                    const c = g.cells[z][x];
                    if (c !== 'vei' && c !== 'glacis') continue;
                    const [px, pz] = rt.cells[i - 1];
                    const [ax, az] = toWorld(px, pz);
                    const [bx, bz] = toWorld(x, z);
                    const L = Math.hypot(bx - ax, bz - az) || 1;
                    const nx = -(bz - az) / L;
                    const nz = (bx - ax) / L;
                    for (const side of [-1, 1]) {
                        const wx = (ax + bx) / 2 + nx * 0.56 * side;
                        const wz = (az + bz) / 2 + nz * 0.56 * side;
                        const tilt = (seeded(x * 7 + z * 13 + side) - 0.5) * 0.3;
                        place(pm, n++, wx, vis.hm.at(wx, wz) - 0.02, wz, tilt, seeded(x + z * 3 + side) * 6, 0, 1.3);
                    }
                }
            pm.count = n;
            pm.instanceMatrix.needsUpdate = true;
        }
        const spots = gabionSpots(gRef.current, vis.hm, MAX);
        for (let i = 0; i < spots.length; i++) {
            const [x, y, z, r] = spots[i];
            place(m, i, x, y, z, 0, r + i, 0, 0.85 + ((i * 37) % 10) / 40);
        }
        m.count = spots.length;
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={ref} args={[gabionGeo(), mat, MAX]} castShadow frustumCulled={false} />
            <instancedMesh ref={rocks} args={[rockGeo, mat, 80]} castShadow receiveShadow frustumCulled={false} />
            <instancedMesh ref={posts} args={[postGeo(), mat, PMAX]} castShadow frustumCulled={false} />
        </>
    );
}

function rockGeometry() {
    const g = new THREE.DodecahedronGeometry(1, 0);
    const pos = g.getAttribute('position');
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
        // Snø på toppen, mørk stein på sidene.
        c.set(pos.getY(i) > 0.55 ? '#a9bde6' : pos.getY(i) > 0 ? '#3c4260' : '#262a3e');
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
}

// ---------------------------------------------------------------------------
// Festningen: murfronten, brystvernet som raser, faklene og natt-skiltet
// ---------------------------------------------------------------------------

const TORCHES: [number, number][] = [
    [-9.6, 0.5],
    [-5.2, 0.2],
    [-1.2, 0.2],
    [2.6, 0.2],
    [6.3, 0.2],
    [9.6, 0.5],
];

/** Natt-skiltet står til venstre for midten, så knappene nederst ikke dekker det. */
const SIGN_X = 1.9;

export function Fort({ gRef, vis }: { gRef: GRef; vis: Vis }) {
    const mer = useRef<THREE.InstancedMesh>(null);
    const mat = useMemo(() => toonMat(), []);
    const post = useMemo(() => {
        const g = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 5);
        g.translate(0, 0.25, 0);
        return g;
    }, []);
    const postMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#2a1d14' }), []);
    const sign = useMemo(() => crispCanvas(256, 96), []);
    const signMat = useMemo(() => new THREE.MeshBasicMaterial({ map: sign.tex, toneMapped: false }), [sign]);
    const wave = useRef(-1);
    useFrame((st) => {
        const g = gRef.current;
        const m = mer.current;
        if (m) {
            for (let i = 0; i < vis.merlons.length; i++) {
                const md = vis.merlons[i];
                if (!md.down) place(m, i, md.x, WALL_TOP - 0.02, 0.18, 0, 0, 0, 1, 0.92 + seeded(i * 5) * 0.16);
                else {
                    // Steinen tipper utover og raser ned muren.
                    const k = Math.min(1, md.down * 1.8);
                    place(m, i, md.x, WALL_TOP - 0.02 - k * 0.55, 0.18 + k * 0.55, k * 1.2, 0, (i % 2 ? 1 : -1) * k * 0.4, 1, 1 - k * 0.45);
                }
            }
            m.instanceMatrix.needsUpdate = true;
            if (!m.instanceColor) {
                // Hver stein litt ulik: gammel mur, ikke tangenter.
                for (let i = 0; i < vis.merlons.length; i++) {
                    const v = 0.8 + seeded(i * 3 + 1) * 0.35;
                    m.setColorAt(i, COLR.setRGB(v, v * (0.97 + seeded(i) * 0.05), v * 0.95));
                }
                if (m.instanceColor) touch(m.instanceColor);
            }
        }
        // Faklene på muren.
        const t = st.clock.elapsedTime;
        for (let i = 0; i < TORCHES.length; i++) {
            const [x, z] = TORCHES[i];
            const fl = 0.85 + Math.sin(t * 13 + i * 2) * 0.1 + Math.sin(t * 29 + i) * 0.05;
            vis.glow.set(i, x, WALL_TOP + 0.58, z, 0.55 * fl, '#ff9a3c', 0.9);
            vis.glow.set(6 + i, x, WALL_TOP + 0.62, z, 1.8 * fl, '#ff7a1a', 0.22);
        }
        // Samme tall som fanen og brevet: natta som kommer i byggepausen.
        const w = g.endless ? g.wave : Math.min(WAVES, Math.max(1, g.phase === 'bygg' ? g.wave + 1 : g.wave));
        if (w !== wave.current) {
            wave.current = w;
            sign.draw((ctx, W, H) => {
                ctx.fillStyle = '#2a1a12';
                ctx.fillRect(0, 0, W, H);
                ctx.strokeStyle = PAL.gold;
                ctx.lineWidth = 4;
                ctx.strokeRect(5, 5, W - 10, H - 10);
                ctx.fillStyle = '#f3e3c0';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `700 26px Georgia, 'Palatino Linotype', 'Book Antiqua', serif`;
                ctx.fillText('FREDRIKSTEN', W / 2, 30);
                ctx.fillStyle = PAL.gold;
                ctx.font = `700 30px Georgia, 'Palatino Linotype', 'Book Antiqua', serif`;
                ctx.fillText(g.endless ? `NATT ${w}` : `NATT ${w} AV ${WAVES}`, W / 2, 66);
            });
        }
    });
    return (
        <group>
            <mesh geometry={fortGeo()} material={mat} castShadow receiveShadow />
            <instancedMesh ref={mer} args={[merlonGeo(), mat, vis.merlons.length]} castShadow frustumCulled={false} />
            {TORCHES.map(([x, z], i) => (
                <mesh key={i} geometry={post} material={postMat} position={[x, WALL_TOP + 0.06, z]} />
            ))}
            <mesh position={[SIGN_X, WALL_TOP + 0.36, -0.75]} rotation={[0.75, Math.PI, 0]} material={signMat}>
                <planeGeometry args={[1.6, 0.6]} />
            </mesh>
            <mesh position={[SIGN_X, WALL_TOP + 0.33, -0.71]} rotation={[0.75, Math.PI, 0]}>
                <boxGeometry args={[1.7, 0.66, 0.05]} />
                <meshLambertMaterial color="#2a1a12" />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Bakteppet: himmelen, åsene med furu og den svenske leiren
// ---------------------------------------------------------------------------

function seeded(i: number) {
    const s = Math.sin(i * 91.3 + 7.1) * 43758.5453;
    return s - Math.floor(s);
}

export function Backdrop({ vis }: { vis: Vis }) {
    const q = useQuality();
    const tents = useRef<THREE.InstancedMesh>(null);
    const pines = useRef<THREE.InstancedMesh>(null);
    const mat = useMemo(() => toonMat(), []);
    const skyMat = useMemo(
        () => new THREE.MeshBasicMaterial({ map: skyTexture(), fog: false, toneMapped: false, depthWrite: false }),
        []
    );
    const nPine = Math.round(46 * Math.max(0.6, q.detail));
    const fires = useMemo(() => {
        const out: [number, number][] = [];
        for (let i = 0; i < 9; i++) out.push([(seeded(i) - 0.5) * 16, 16.5 + seeded(i + 40) * 5]);
        return out;
    }, []);
    useLayoutEffect(() => {
        const t = tents.current;
        if (t) {
            for (let i = 0; i < 16; i++) {
                const x = (seeded(i + 3) - 0.5) * 18;
                const z = 16 + seeded(i + 11) * 6;
                place(t, i, x, vis.hm.at(x, z) - 0.02, z, 0, seeded(i) * 3, 0, 0.9 + seeded(i + 5) * 0.4);
            }
            t.instanceMatrix.needsUpdate = true;
        }
        const p = pines.current;
        if (p) {
            let n = 0;
            for (let i = 0; n < nPine && i < 400; i++) {
                const side = i % 2 ? 1 : -1;
                const x = side * (10.4 + seeded(i + 100) * 9);
                const z = -1 + seeded(i + 200) * 26;
                place(p, n++, x, vis.hm.at(x, z) - 0.05, z, 0, seeded(i) * 6, 0, 0.8 + seeded(i + 300) * 0.9);
            }
            p.count = n;
            p.instanceMatrix.needsUpdate = true;
        }
    }, [vis, nPine]);
    useFrame((st) => {
        const t = st.clock.elapsedTime;
        for (let i = 0; i < fires.length; i++) {
            const [x, z] = fires[i];
            const fl = 0.8 + Math.sin(t * 9 + i * 3) * 0.12 + Math.sin(t * 23 + i) * 0.08;
            vis.glow.set(12 + i, x, vis.hm.at(x, z) + 0.25, z, 1.2 * fl, '#ff8a2a', 0.8);
        }
    });
    return (
        <group>
            <mesh position={[0, 3.5, 27]} material={skyMat} userData={{ sceneAuditIgnore: true }}>
                <planeGeometry args={[80, 24]} />
            </mesh>
            <instancedMesh ref={tents} args={[tentGeo(), mat, 16]} userData={{ sceneAuditIgnore: true }} />
            <instancedMesh ref={pines} args={[pineGeo(), mat, 46]} castShadow userData={{ sceneAuditIgnore: true }} />
        </group>
    );
}

// ---------------------------------------------------------------------------
// Tårnene: tre nivåer, stillas, rekyl, lunter
// ---------------------------------------------------------------------------

const KINDS: TowerKind[] = ['musketer', 'kanon', 'morter', 'mine'];
const TMAX = 40;

function easeOutBack(t: number) {
    const c = 1.9;
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

export function Towers({ gRef, vis }: { gRef: GRef; vis: Vis }) {
    const TW = towerModels();
    const refs = useRef<Record<string, THREE.InstancedMesh | null>>({});
    const scaf = useRef<THREE.InstancedMesh>(null);
    const mat = useMemo(() => toonMat(), []);
    const oMat = useMemo(() => outlineMaterial(0.018), []);
    const keys = useMemo(() => {
        const out: { key: string; kind: TowerKind; level: number; part: 'base' | 'top'; geo: THREE.BufferGeometry }[] = [];
        for (const k of KINDS)
            for (let l = 0; l < TW[k].length; l++) {
                out.push({ key: `${k}-${l}-base`, kind: k, level: l, part: 'base', geo: TW[k][l].base });
                const top = TW[k][l].top;
                if (top) out.push({ key: `${k}-${l}-top`, kind: k, level: l, part: 'top', geo: top });
            }
        return out;
    }, [TW]);
    const counts = useRef<Record<string, number>>({});
    useLayoutEffect(() => {
        for (const k of keys) {
            const m = refs.current[k.key];
            const o = refs.current[`${k.key}-o`];
            if (m && o) o.instanceMatrix = m.instanceMatrix;
        }
    }, [keys]);
    useFrame((st, dt) => {
        const g = gRef.current;
        const c = counts.current;
        for (const k of keys) c[k.key] = 0;
        let ns = 0;
        let fuse = 0;
        const t = st.clock.elapsedTime;
        const sm = scaf.current;
        for (const tw of g.towers) {
            const tv = vis.towers.get(tw.id);
            const [wx, wz] = toWorld(tw.cx, tw.cz);
            const y0 = vis.hm.at(wx, wz);
            const md = TW[tw.kind][tw.level];
            // Byggingen: tårnet vokser opp gjennom stillaset og spretter på plass.
            const b = tw.built;
            const grow = b >= 1 ? 1 + (tv ? tv.pop * 0.08 : 0) : 0.08 + 0.92 * easeOutBack(Math.min(1, b));
            const fallen = tw.fallen ? Math.min(1, tw.fallen / 1.2) : 0;
            const sink = fallen * 0.5;
            const tilt = fallen * 0.5;
            // Treff: tårnet lyser et øyeblikk.
            const hit = tw.hitT > 0;
            // Sikter mot målet (+z er fremover i modellen; spillets aim er i rutenettet).
            if (tv) {
                const want = tw.shots > 0 ? -tw.aim : 0;
                let d = want - tv.yaw;
                d = Math.atan2(Math.sin(d), Math.cos(d));
                tv.yaw += d * Math.min(1, dt * 10);
            }
            const yaw = tv ? tv.yaw : 0;
            const rec = tv ? tv.recoil : 0;
            const baseKey = `${tw.kind}-${tw.level}-base`;
            const bm = refs.current[baseKey];
            if (bm && c[baseKey] < TMAX) {
                const i = c[baseKey]++;
                const armed = tw.kind === 'mine' && tw.armT > 0 ? 0.45 : 1;
                place(bm, i, wx, y0 - sink, wz, tilt, 0, tilt * 0.6, 1, grow * armed);
                bm.setColorAt(i, hit ? HIT : WHITE);
            }
            if (md.top) {
                const topKey = `${tw.kind}-${tw.level}-top`;
                const tm = refs.current[topKey];
                if (tm && c[topKey] < TMAX) {
                    const i = c[topKey]++;
                    const back = rec * 0.07;
                    const tx = wx - Math.sin(yaw) * back;
                    const tz = wz - Math.cos(yaw) * back;
                    place(tm, i, tx, y0 + md.topY * grow - sink, tz, tilt - rec * 0.08, yaw, tilt * 0.6, 1, grow);
                    tm.setColorAt(i, hit ? HIT : WHITE);
                }
            }
            if (sm && b < 1 && !tw.fallen && ns < TMAX) {
                place(sm, ns++, wx, y0, wz, 0, 0, 0, md.size, 0.4 + md.size * 0.5);
            }
            // Ladd mine: lunta gløder i grøfta.
            if (tw.kind === 'mine' && b >= 1 && tw.armT <= 0 && !tw.fallen && fuse < 30) {
                const fl = 0.7 + Math.sin(t * 17 + tw.id) * 0.3;
                vis.glow.set(25 + fuse++, wx + md.muzzle[0], y0 + md.muzzle[1], wz + md.muzzle[2], 0.22 * fl, '#ffb347', 1);
            }
        }
        for (let i = fuse; i < 30; i++) vis.glow.set(25 + i, 0, -99, 0, 0, '#000', 0);
        for (const k of keys) {
            const m = refs.current[k.key];
            const o = refs.current[`${k.key}-o`];
            if (!m) continue;
            m.count = c[k.key];
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
            if (o) o.count = c[k.key];
        }
        if (sm) {
            sm.count = ns;
            sm.instanceMatrix.needsUpdate = true;
        }
    });
    return (
        <>
            {keys.map((k) => (
                <group key={k.key}>
                    <instancedMesh
                        ref={(el) => {
                            refs.current[k.key] = el;
                            if (el && !el.instanceColor) el.setColorAt(0, WHITE);
                        }}
                        args={[k.geo, mat, TMAX]}
                        castShadow
                        receiveShadow
                        frustumCulled={false}
                    />
                    {k.kind !== 'mine' && (
                        <instancedMesh
                            ref={(el) => {
                                refs.current[`${k.key}-o`] = el;
                            }}
                            args={[k.geo, oMat, TMAX]}
                            frustumCulled={false}
                        />
                    )}
                </group>
            ))}
            <instancedMesh ref={scaf} args={[scaffoldGeo(), mat, TMAX]} castShadow frustumCulled={false} />
        </>
    );
}

// ---------------------------------------------------------------------------
// Fiendene: gange i shaderen, formasjoner, dramatiske fall, hatter som flyr
// ---------------------------------------------------------------------------

const EKINDS: EnemyKind[] = ['karoliner', 'graver', 'rytter', 'grenader', 'beleiring', 'livgarde', 'karl'];
const anims = new Map<EnemyKind, THREE.InstancedBufferAttribute>();
function animAttr(k: EnemyKind, d: FigureDef) {
    let a = anims.get(k);
    if (!a) {
        a = new THREE.InstancedBufferAttribute(new Float32Array(d.max * 2), 2);
        a.setUsage(THREE.DynamicDrawUsage);
        d.geo.setAttribute('aAnim', a);
        anims.set(k, a);
    }
    return a;
}

const HAT_MAX = 520;

export function Enemies({ gRef, vis }: { gRef: GRef; vis: Vis }) {
    const F = figures();
    const H = hatGeos();
    const refs = useRef<Partial<Record<EnemyKind, THREE.InstancedMesh | null>>>({});
    const orefs = useRef<Partial<Record<EnemyKind, THREE.InstancedMesh | null>>>({});
    const tri = useRef<THREE.InstancedMesh>(null);
    const mit = useRef<THREE.InstancedMesh>(null);
    const wheels = useRef<THREE.InstancedMesh>(null);
    const halo = useRef<THREE.Mesh>(null);
    const mats = useMemo(() => {
        const out = {} as Record<EnemyKind, { m: THREE.Material; o: THREE.Material; a: THREE.InstancedBufferAttribute }>;
        for (const k of EKINDS)
            out[k] = { m: figureMaterial(F[k], 0), o: figureMaterial(F[k], 0.011), a: animAttr(k, F[k]) };
        return out;
    }, [F]);
    const hatMat = useMemo(() => toonMat(), []);
    useLayoutEffect(() => {
        for (const k of EKINDS) {
            const m = refs.current[k];
            const o = orefs.current[k];
            if (m && o) o.instanceMatrix = m.instanceMatrix;
        }
    }, []);
    const n = useRef<Record<EnemyKind, number>>({ karoliner: 0, graver: 0, rytter: 0, grenader: 0, beleiring: 0, livgarde: 0, karl: 0 });
    useFrame((st, rawDt) => {
        const g = gRef.current;
        const dt = Math.min(0.05, rawDt);
        const c = n.current;
        for (const k of EKINDS) c[k] = 0;
        let nt = 0;
        let nm = 0;
        let nw = 0;
        const tm = tri.current;
        const mm = mit.current;
        const wm = wheels.current;
        let karlAt: [number, number, number] | null = null;
        const put = (k: EnemyKind, x: number, y: number, z: number, rx: number, yaw: number, rz: number, ph: number, amp: number, hit: boolean) => {
            const d = F[k];
            const m = refs.current[k];
            if (!m || c[k] >= d.max) return -1;
            const i = c[k]++;
            place(m, i, x, y, z, rx, yaw, rz, d.scale);
            m.setColorAt(i, hit ? HIT : WHITE);
            const a = mats[k].a;
            a.setXY(i, ph, amp);
            return i;
        };
        // Levende og marsjerende.
        for (const e of g.enemies) {
            if (e.dead) continue;
            const ev = vis.enemies.get(e.id);
            // Bare visning: de store figurene står litt lenger fra hverandre i bredden.
            const r = g.routes[e.route];
            const [wx, wz0] = toWorld(e.x, e.z);
            let wz = wz0;
            let yaw = ev ? ev.yaw : Math.PI;
            if (r && !e.leaked) {
                const ahead = Math.min(r.len, e.d + 0.3);
                const cum = r.cum;
                let j = 1;
                while (j < cum.length - 1 && cum[j] < ahead) j++;
                const a0 = r.cells[j - 1];
                const b0 = r.cells[j];
                const want = Math.atan2(-(b0[0] - a0[0]), b0[1] - a0[1]);
                let dd = want - yaw;
                dd = Math.atan2(Math.sin(dd), Math.cos(dd));
                yaw += dd * Math.min(1, dt * 8);
            }
            let amp = e.halt > 0 ? 0 : e.kind === 'rytter' ? 0.9 : e.kind === 'karl' ? 0.45 : 0.6;
            let ph = e.d * (e.kind === 'rytter' ? 6 : 9) + e.id * 1.7;
            // Seier: de snur og løper hjem. Tap: de står og jubler.
            if (e.leaked) {
                if (vis.ending !== 'flukt') continue;
                if (ev) {
                    ev.flee += dt;
                    yaw = 0;
                    wz += ev.flee * ev.flee * 1.2 + ev.flee * 1.6;
                    ph = ev.flee * 14 + e.id;
                    amp = 0.9;
                }
            }
            if (ev) ev.yaw = yaw;
            const open = e.kind === 'rytter' || e.kind === 'beleiring';
            const y = Math.max(vis.hm.at(wx, wz), open ? 0.04 : -1);
            const cheer = vis.ending === 'jubel' ? Math.abs(Math.sin(st.clock.elapsedTime * 8 + e.id)) * 0.12 : 0;
            put(e.kind, wx, y + cheer, wz, 0, yaw, 0, ph, amp, e.hitT > 0);
            const d = F[e.kind];
            if (e.kind === 'karl') karlAt = [wx, y, wz];
            if (d.hat && !(ev && ev.hatless)) {
                const hy = y + cheer + d.hatY * d.scale;
                const bob = Math.abs(Math.cos(ph)) * 0.018 * amp;
                if (d.hat === 'tricorn' && tm && nt < HAT_MAX) place(tm, nt++, wx, hy + bob, wz, 0, yaw, 0, d.scale);
                if (d.hat === 'mitre' && mm && nm < 160) place(mm, nm++, wx, hy + bob, wz, 0, yaw, 0, d.scale);
            }
            if (e.kind === 'beleiring' && wm && nw < 40) {
                // Hjulene ruller med distansen.
                const roll = -e.d * 5;
                for (const s of [-1, 1]) {
                    const ox = Math.cos(yaw) * 0.19 * s * d.scale;
                    const oz = -Math.sin(yaw) * 0.19 * s * d.scale;
                    place(wm, nw++, wx + ox, y + 0.15 * d.scale, wz + oz, roll, yaw, 0, d.scale);
                }
            }
        }
        // De falne: velter, kastes, blir liggende.
        for (const cp of vis.corpses) {
            const fall = cp.fall;
            let rx = 0;
            let rz = 0;
            let y = cp.y;
            if (cp.style === 0) {
                // Velter bakover: rask start, et lite sprett når kroppen treffer snøen.
                const k = fall < 1 ? fall * fall : 1;
                rx = -k * (Math.PI / 2 - 0.08) + (fall >= 1 ? 0 : Math.sin(fall * Math.PI) * 0.1);
            } else {
                rx = -(Math.PI / 2 - 0.08) * Math.min(1, fall * 1.4) + cp.tumble;
                if (cp.ground) rx = -(Math.PI / 2 - 0.08);
            }
            if (cp.roll) {
                rz = cp.roll * (Math.PI / 2 - 0.1) * Math.min(1, fall * 1.5);
                rx = cp.kind === 'beleiring' ? rx * 0.15 : 0;
            }
            if (cp.kind === 'beleiring') y -= 0.05;
            put(cp.kind, cp.x, y + 0.02, cp.z, rx, cp.yaw, rz, 0, 0, false);
        }
        // Løse hatter: flyr, snurrer, blir liggende i snøen.
        for (const h of vis.hats) {
            if (h.mitre) {
                if (mm && nm < 160) place(mm, nm++, h.x, h.y, h.z, h.rx, h.ry, h.rz, h.s);
            } else if (tm && nt < HAT_MAX) place(tm, nt++, h.x, h.y, h.z, h.rx, h.ry, h.rz, h.s);
        }
        for (const k of EKINDS) {
            const m = refs.current[k];
            if (!m) continue;
            m.count = c[k];
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
            touch(mats[k].a);
            const o = orefs.current[k];
            if (o) o.count = c[k];
        }
        if (tm) {
            tm.count = nt;
            tm.instanceMatrix.needsUpdate = true;
        }
        if (mm) {
            mm.count = nm;
            mm.instanceMatrix.needsUpdate = true;
        }
        if (wm) {
            wm.count = nw;
            wm.instanceMatrix.needsUpdate = true;
        }
        // Kongen går i sitt eget lys.
        const hl = halo.current;
        if (hl) {
            hl.visible = !!karlAt;
            if (karlAt) {
                hl.position.set(karlAt[0], karlAt[1] + 0.02, karlAt[2]);
                hl.scale.setScalar(1 + Math.sin(st.clock.elapsedTime * 3) * 0.08);
            }
        }
    });
    return (
        <>
            {EKINDS.map((k) => (
                <group key={k}>
                    <instancedMesh
                        ref={(el) => {
                            refs.current[k] = el;
                            if (el && !el.instanceColor) el.setColorAt(0, WHITE);
                        }}
                        args={[F[k].geo, mats[k].m, F[k].max]}
                        castShadow
                        frustumCulled={false}
                    />
                    <instancedMesh
                        ref={(el) => {
                            orefs.current[k] = el;
                        }}
                        args={[F[k].geo, mats[k].o, F[k].max]}
                        frustumCulled={false}
                    />
                </group>
            ))}
            <instancedMesh ref={tri} args={[H.tricorn, hatMat, HAT_MAX]} castShadow frustumCulled={false} />
            <instancedMesh ref={mit} args={[H.mitre, hatMat, 160]} frustumCulled={false} />
            <instancedMesh ref={wheels} args={[H.wheel, hatMat, 40]} castShadow frustumCulled={false} />
            <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                <ringGeometry args={[0.26, 0.44, 32]} />
                <meshBasicMaterial color={PAL.gold} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
            </mesh>
        </>
    );
}

// ---------------------------------------------------------------------------
// Prosjektilene: ekte buer, lunter som gnistrer, glødende beleiringskuler
// ---------------------------------------------------------------------------

export function Shots({ gRef, vis }: { gRef: GRef; vis: Vis }) {
    const ref = useRef<THREE.InstancedMesh | null>(null);
    const MAX = 140;
    const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#ffffff' }), []);
    const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        const g = gRef.current;
        let i = 0;
        for (const s of g.shots) {
            if (i >= MAX) break;
            if (s.t < 0) continue;
            shotPos(vis, s.x0, s.z0, s.x1, s.z1, s.arc, Math.min(1, s.t / s.dur), s.kind === 'bombe');
            // Lysspor bak kula: rødglødende flatt over grøfta, gul bue for bombene.
            const lp = lastPos.get(s);
            if (lp) {
                if (s.kind === 'bombe' || s.kind === 'granat')
                    vis.tracer(lp.x, lp.y, lp.z, SP.x, SP.y, SP.z, s.kind === 'bombe' ? 0.55 : 0.35, s.kind === 'bombe' ? 0.06 : 0.04, '#ff9a1e');
                else vis.tracer(lp.x, lp.y, lp.z, SP.x, SP.y, SP.z, 0.45, 0.075, s.kind === 'beleiring' ? '#ff5a24' : '#ff7a3a');
                lp.copy(SP);
            } else lastPos.set(s, SP.clone());
            const r = s.kind === 'bombe' ? 0.11 : s.kind === 'granat' ? 0.06 : 0.075;
            place(m, i, SP.x, SP.y, SP.z, 0, 0, 0, r);
            const hot = s.kind === 'beleiring';
            m.setColorAt(i, COLR.set(hot ? '#ff6a2a' : '#1a1a1e'));
            i++;
            shotTrail(vis, s.kind);
        }
        m.count = i;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh
            ref={(el) => {
                ref.current = el;
                if (el && !el.instanceColor) el.setColorAt(0, WHITE);
            }}
            args={[geo, mat, MAX]}
            castShadow
            frustumCulled={false}
        />
    );
}

// ---------------------------------------------------------------------------
// Kulesporene: tynne, glødende streker (én InstancedMesh, additiv)
// ---------------------------------------------------------------------------

const TA = new THREE.Vector3();
const TB = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
export function Tracers({ vis }: { vis: Vis }) {
    const ref = useRef<THREE.InstancedMesh | null>(null);
    const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
    const mat = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: '#ffffff',
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                toneMapped: false,
            }),
        []
    );
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        let i = 0;
        for (const t of vis.tracers) {
            if (t.life <= 0) continue;
            const k = t.life / t.max;
            TA.set(t.x0, t.y0, t.z0);
            TB.set(t.x1, t.y1, t.z1);
            const len = TA.distanceTo(TB);
            if (len < 1e-3) continue;
            M4.lookAt(TA, TB, UP);
            Q.setFromRotationMatrix(M4);
            P.copy(TA).add(TB).multiplyScalar(0.5);
            const w = t.w * (0.5 + 0.5 * k);
            S.set(w, w, len);
            M4.compose(P, Q, S);
            m.setMatrixAt(i, M4);
            m.setColorAt(i, COLR.copy(t.color).multiplyScalar(1.1 * k));
            i++;
        }
        m.count = i;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh
            ref={(el) => {
                ref.current = el;
                if (el && !el.instanceColor) el.setColorAt(0, WHITE);
            }}
            args={[geo, mat, TRACER_MAX]}
            frustumCulled={false}
            renderOrder={3}
            userData={{ sceneAuditIgnore: true }}
        />
    );
}

/** Hvor hver kule var forrige bilde (til lysporet). */
const lastPos = new WeakMap<object, THREE.Vector3>();
const SP = new THREE.Vector3();
function shotPos(vis: Vis, x0: number, z0: number, x1: number, z1: number, arc: number, k: number, high: boolean) {
    const [ax, az] = toWorld(x0, z0);
    const [bx, bz] = toWorld(x1, z1);
    const ya = vis.hm.at(ax, az) + 0.5;
    const yb = vis.hm.at(bx, bz) + 0.12;
    SP.set(ax + (bx - ax) * k, ya + (yb - ya) * k + (high ? arc * 1.3 : arc) * 4 * k * (1 - k), az + (bz - az) * k);
}
function shotTrail(vis: Vis, kind: string) {
    if (kind === 'bombe' || kind === 'granat') {
        // Lunta gnistrer hele veien.
        vis.glow.spawn(SP.x, SP.y + 0.08, SP.z, (Math.random() - 0.5) * 0.6, 0.3, (Math.random() - 0.5) * 0.6, 0.35, 0.12, '#ffc060', 1, -0.2, 0.5, 1);
        if (Math.random() < 0.4) vis.smoke.spawn(SP.x, SP.y, SP.z, 0, 0.1, 0, 1.2, 0.14, '#9a9288', 0.35, 0.2, 0.5, 0);
    } else if (kind === 'beleiring') {
        vis.glow.spawn(SP.x, SP.y, SP.z, 0, 0, 0, 0.18, 0.28, '#ff6a2a', 0.8, -0.5, 0, 0);
    } else if (Math.random() < 0.6) {
        vis.smoke.spawn(SP.x, SP.y, SP.z, 0, 0.05, 0, 0.7, 0.1, '#cfc8bd', 0.4, 0.25, 0.5, 0);
    }
}

// ---------------------------------------------------------------------------
// Deler som flyr, flekker i snøen
// ---------------------------------------------------------------------------

export function Chunks({ vis }: { vis: Vis }) {
    const ref = useRef<THREE.InstancedMesh | null>(null);
    const MAX = 150;
    const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#ffffff' }), []);
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        let i = 0;
        for (const c of vis.chunks) {
            if (i >= MAX) break;
            E.set(c.rx, c.ry, c.rz);
            Q.setFromEuler(E);
            P.set(c.x, c.y, c.z);
            S.set(c.s, c.sy, c.s * 0.8);
            M4.compose(P, Q, S);
            m.setMatrixAt(i, M4);
            m.setColorAt(i, COLR.set(c.color));
            i++;
        }
        m.count = i;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh
            ref={(el) => {
                ref.current = el;
                if (el && !el.instanceColor) el.setColorAt(0, WHITE);
            }}
            args={[debrisGeo(), mat, MAX]}
            castShadow
            frustumCulled={false}
        />
    );
}

const DECAL_COLORS = new Map<string, THREE.Color>();
function decalColor(c: string) {
    let col = DECAL_COLORS.get(c);
    if (!col) {
        col = new THREE.Color(c);
        DECAL_COLORS.set(c, col);
    }
    return col;
}

export function Decals({ vis }: { vis: Vis }) {
    const ref = useRef<THREE.InstancedMesh | null>(null);
    const MAX = DECAL_MAX;
    const geo = useMemo(() => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
    const mat = useMemo(
        () =>
            // Ulyst: blodet skal være rødt i snøen også om natta, ikke svart.
            new THREE.MeshBasicMaterial({
                map: splatTexture(),
                transparent: true,
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -2,
                polygonOffsetUnits: -2,
            }),
        []
    );
    const v = useRef(-1);
    const done = useRef(0);
    useFrame(() => {
        const m = ref.current;
        if (!m || v.current === vis.decalV) return;
        v.current = vis.decalV;
        // Bare flekkene som er nye siden sist skrives (i kamp kommer det flere i sekundet).
        const n = vis.decals.length;
        let from = done.current;
        if (vis.decalNext < from || vis.decalNext - from > n) from = Math.max(0, vis.decalNext - n);
        if (vis.decalNext === 0) from = 0;
        for (let k = from; k < vis.decalNext; k++) {
            const i = k % MAX;
            const d = vis.decals[i];
            if (!d) continue;
            place(m, i, d.x, d.y, d.z, 0, d.rot, 0, d.s, 1);
            m.setColorAt(i, decalColor(d.color));
        }
        done.current = vis.decalNext;
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh
            ref={(el) => {
                ref.current = el;
                if (el && !el.instanceColor) el.setColorAt(0, WHITE);
            }}
            args={[geo, mat, MAX]}
            receiveShadow
            frustumCulled={false}
        />
    );
}

// ---------------------------------------------------------------------------
// Partiklene: krutrøyk, blod og jord (vanlig) + ild, gnister og gull (additiv)
// ---------------------------------------------------------------------------

const PVERT = `
attribute vec3 aCol;
attribute float aSize;
attribute float aAlpha;
uniform float uScale;
uniform float uFogNear;
uniform float uFogFar;
varying vec3 vCol;
varying float vA;
varying float vFog;
void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(150.0, aSize * uScale / max(0.1, -mv.z));
    vCol = aCol;
    vA = aAlpha;
    vFog = smoothstep(uFogNear, uFogFar, -mv.z);
}`;
const PFRAG = `
uniform sampler2D map;
uniform vec3 uFogColor;
uniform float uAdd;
varying vec3 vCol;
varying float vA;
varying float vFog;
void main() {
    float a = texture2D(map, gl_PointCoord).a * vA;
    // Nattgradering: grå krutrøyk og snøsprut blir kald blå i månelyset (blod og ild beholder fargen).
    float sat = max(vCol.r, max(vCol.g, vCol.b)) - min(vCol.r, min(vCol.g, vCol.b));
    float k = (1.0 - uAdd) * (1.0 - smoothstep(0.12, 0.32, sat));
    vec3 c0 = mix(vCol, vCol * vec3(0.46, 0.55, 0.84), k * 0.85);
    a *= 1.0 - k * 0.28;
    if (a < 0.01) discard;
    vec3 c = mix(c0, uFogColor, vFog * (1.0 - uAdd));
    gl_FragColor = vec4(c, a * (1.0 - vFog * uAdd));
    #include <colorspace_fragment>
}`;

let _glowTex: THREE.CanvasTexture | null = null;
function glowTexture() {
    if (_glowTex) return _glowTex;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.25, 'rgba(255,255,255,0.6)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 64, 64);
    _glowTex = new THREE.CanvasTexture(c);
    return _glowTex;
}

function PointsLayer({ pool, additive }: { pool: PointPool; additive: boolean }) {
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const mk = (arr: Float32Array, n: number) => {
            const a = new THREE.BufferAttribute(arr, n);
            a.setUsage(THREE.DynamicDrawUsage);
            return a;
        };
        g.setAttribute('position', mk(pool.pos, 3));
        g.setAttribute('aCol', mk(pool.col, 3));
        g.setAttribute('aSize', mk(pool.size, 1));
        g.setAttribute('aAlpha', mk(pool.alpha, 1));
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 8), 60);
        return g;
    }, [pool]);
    const mat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: {
                    map: { value: additive ? glowTexture() : puffTexture() },
                    uScale: { value: 400 },
                    uFogNear: { value: 18 },
                    uFogFar: { value: 38 },
                    uFogColor: { value: new THREE.Color(PAL.fog) },
                    uAdd: { value: additive ? 1 : 0 },
                },
                vertexShader: PVERT,
                fragmentShader: PFRAG,
                transparent: true,
                depthWrite: false,
                blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
            }),
        [additive]
    );
    useFrame((st) => {
        const cam = st.camera as THREE.PerspectiveCamera;
        setU(mat, 'uScale', pointScale(st.size.height, st.gl.getPixelRatio(), cam.fov));
        for (const k of ['position', 'aCol', 'aSize', 'aAlpha']) touch(geo.getAttribute(k) as THREE.BufferAttribute);
    });
    return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={additive ? 3 : 2} />;
}

export function Particles({ vis }: { vis: Vis }) {
    return (
        <>
            <PointsLayer pool={vis.smoke} additive={false} />
            <PointsLayer pool={vis.glow} additive />
        </>
    );
}

// ---------------------------------------------------------------------------
// Lyskulene (kjernen - lyset og gløden ligger i Lights og glow-bassenget)
// ---------------------------------------------------------------------------

export function Flares({ vis }: { vis: Vis }) {
    const a = useRef<THREE.Mesh>(null);
    const b = useRef<THREE.Mesh>(null);
    const pa = useRef<THREE.Mesh>(null);
    const pb = useRef<THREE.Mesh>(null);
    const ca = useRef<THREE.Mesh>(null);
    const cb = useRef<THREE.Mesh>(null);
    const ka = useRef<THREE.Mesh>(null);
    const kb = useRef<THREE.Mesh>(null);
    useFrame((st) => {
        const t = st.clock.elapsedTime;
        [a.current, b.current].forEach((m, i) => {
            const f = vis.flares[i];
            const pool = i ? pb.current : pa.current;
            const cone = i ? cb.current : ca.current;
            const chute = i ? kb.current : ka.current;
            if (!m) return;
            m.visible = f.phase !== 'dead';
            m.position.set(f.x, f.y, f.z);
            m.scale.setScalar(1 + Math.sin(t * 23 + i) * 0.12);
            const on = f.phase === 'dead' ? 0 : f.light;
            vis.glow.set(21 + i, f.x, f.y, f.z, 2.3 * on, '#fff0c0', on);
            vis.glow.set(23 + i, f.x, f.y, f.z, 6 * on, '#ff9a3c', on * 0.24);
            const gy = Math.max(vis.hm.at(f.x, f.z), 0.05);
            // Fallskjermen: lyskula henger i tøy og synker sakte.
            if (chute) {
                chute.visible = f.phase === 'hang';
                chute.position.set(f.x, f.y + 0.34, f.z);
                chute.rotation.z = Math.sin(t * 1.3 + i) * 0.12;
            }
            // Lyskjeglen: lyset faller ned over grøfta som i et slagmaleri.
            if (cone) {
                const h = Math.max(0.5, f.y - gy);
                cone.visible = on > 0.05 && f.phase === 'hang';
                cone.position.set(f.x, f.y, f.z);
                cone.scale.set(h * 0.5, h, h * 0.5);
                setOpacity(cone, on * 0.1);
            }
            // Lyset når bakken: en varm flekk som vandrer med kula og lyser opp grøftene.
            if (pool) {
                pool.visible = on > 0.02;
                // Over grøftekanten, så lyset faller ned i grøfta i stedet for å gjemme seg under den.
                pool.position.set(f.x, gy + 0.2, f.z);
                const k = Math.max(0, Math.min(1, 1.2 - (f.y - gy) * 0.1));
                pool.scale.setScalar(2.4 + (f.y - gy) * 0.35);
                setOpacity(pool, on * (0.3 + 0.25 * k) * (0.92 + Math.random() * 0.08));
            }
        });
    });
    const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff6d8', toneMapped: false }), []);
    const geo = useMemo(() => new THREE.IcosahedronGeometry(0.2, 1), []);
    const poolGeo = useMemo(() => new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), []);
    const matA = useMemo(() => poolMaterial(), []);
    const matB = useMemo(() => poolMaterial(), []);
    const coneGeo = useMemo(() => new THREE.ConeGeometry(1, 1, 18, 1, true).translate(0, -0.5, 0), []);
    const coneA = useMemo(() => beamMaterial(), []);
    const coneB = useMemo(() => beamMaterial(), []);
    const chuteGeo = useMemo(() => new THREE.SphereGeometry(0.3, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2.2), []);
    const chuteMat = useMemo(
        () => new THREE.MeshBasicMaterial({ color: '#c98a4a', side: THREE.DoubleSide, toneMapped: false }),
        []
    );
    return (
        <>
            <mesh ref={a} geometry={geo} material={mat} />
            <mesh ref={b} geometry={geo} material={mat} />
            <mesh ref={ka} geometry={chuteGeo} material={chuteMat} visible={false} />
            <mesh ref={kb} geometry={chuteGeo} material={chuteMat} visible={false} />
            <mesh ref={ca} geometry={coneGeo} material={coneA} renderOrder={2} visible={false} userData={{ sceneAuditIgnore: true }} />
            <mesh ref={cb} geometry={coneGeo} material={coneB} renderOrder={2} visible={false} userData={{ sceneAuditIgnore: true }} />
            <mesh ref={pa} geometry={poolGeo} material={matA} renderOrder={1} visible={false} />
            <mesh ref={pb} geometry={poolGeo} material={matB} renderOrder={1} visible={false} />
        </>
    );
}

let _beamTex: THREE.CanvasTexture | null = null;
/** Lyskjeglen: sterk øverst ved kula, svak nede ved bakken. */
function beamMaterial() {
    if (!_beamTex) {
        const c = document.createElement('canvas');
        c.width = 4;
        c.height = 64;
        const ctx = c.getContext('2d')!;
        const gr = ctx.createLinearGradient(0, 0, 0, 64);
        gr.addColorStop(0, 'rgba(255,255,255,1)');
        gr.addColorStop(0.35, 'rgba(255,255,255,0.45)');
        gr.addColorStop(1, 'rgba(255,255,255,0.08)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, 4, 64);
        _beamTex = new THREE.CanvasTexture(c);
    }
    return new THREE.MeshBasicMaterial({
        map: _beamTex,
        color: '#ffb050',
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        fog: false,
    });
}

function poolMaterial() {
    // Vanlig blanding (ikke additiv): den varme flekken erstatter den blå snøen i stedet for
    // å bleke den til rosa.
    return new THREE.MeshBasicMaterial({
        map: glowTexture(),
        color: '#ff9f3a',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        fog: false,
    });
}

function setOpacity(m: THREE.Mesh, o: number) {
    (m.material as THREE.MeshBasicMaterial).opacity = o;
}

// ---------------------------------------------------------------------------
// Snøfall: flakene faller i vertex-shaderen (ingen JS per bilde)
// ---------------------------------------------------------------------------

export function Snowfall() {
    const q = useQuality();
    const N = Math.round(700 * Math.max(0.5, q.particleScale));
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const p = new Float32Array(N * 3);
        const s = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            p[i * 3] = (seeded(i * 3) - 0.5) * 30;
            p[i * 3 + 1] = seeded(i * 3 + 1) * 10;
            p[i * 3 + 2] = -2 + seeded(i * 3 + 2) * 24;
            s[i] = 0.6 + seeded(i * 7) * 0.8;
        }
        g.setAttribute('position', new THREE.BufferAttribute(p, 3));
        g.setAttribute('aSpeed', new THREE.BufferAttribute(s, 1));
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 4, 10), 40);
        return g;
    }, [N]);
    const mat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: { uTime: { value: 0 }, uScale: { value: 400 } },
                vertexShader: `
attribute float aSpeed;
uniform float uTime;
uniform float uScale;
varying float vA;
void main() {
    vec3 p = position;
    p.y = mod(p.y - uTime * aSpeed * 0.9, 10.0) - 0.3;
    p.x += sin(uTime * 0.7 + position.z) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 0.055 * aSpeed * uScale / max(0.1, -mv.z);
    vA = clamp(p.y, 0.0, 1.0);
}`,
                fragmentShader: `
varying float vA;
void main() {
    vec2 d = gl_PointCoord - 0.5;
    if (dot(d, d) > 0.25) discard;
    gl_FragColor = vec4(0.92, 0.95, 1.0, 0.8 * vA);
}`,
                transparent: true,
                depthWrite: false,
            }),
        []
    );
    useFrame((st) => {
        setU(mat, 'uTime', st.clock.elapsedTime);
        const cam = st.camera as THREE.PerspectiveCamera;
        setU(mat, 'uScale', pointScale(st.size.height, st.gl.getPixelRatio(), cam.fov));
    });
    return <points geometry={geo} material={mat} frustumCulled={false} userData={{ sceneAuditIgnore: true }} />;
}

// ---------------------------------------------------------------------------
// Pekeren: ruta lyser grønt (kan bygge) eller rødt, og valgt rute/tårn med rekkevidde
// ---------------------------------------------------------------------------

export function Hover({ hoverRef, vis }: { hoverRef: React.MutableRefObject<{ x: number; z: number; on: boolean; ok: boolean }>; vis: Vis }) {
    const ref = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((st) => {
        const m = ref.current;
        const h = hoverRef.current;
        if (!m || !mat.current) return;
        m.visible = h.on;
        if (!h.on) return;
        const [wx, wz] = toWorld(h.x, h.z);
        m.position.set(wx, vis.hm.at(wx, wz) + 0.05, wz);
        mat.current.color.set(h.ok ? '#8be07a' : '#e0503c');
        mat.current.opacity = 0.45 + Math.sin(st.clock.elapsedTime * 6) * 0.12;
    });
    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={5}>
            <planeGeometry args={[0.94, 0.94]} />
            <meshBasicMaterial ref={mat} transparent depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
    );
}

export function Selection({ at, r, vis }: { at: [number, number] | null; r: number; vis: Vis }) {
    const ring = useRef<THREE.Group>(null);
    useFrame((st) => {
        if (ring.current) ring.current.rotation.y = st.clock.elapsedTime * 0.6;
    });
    if (!at) return null;
    const [wx, wz] = toWorld(at[0], at[1]);
    const y = vis.hm.at(wx, wz) + 0.06;
    return (
        <group position={[wx, y, wz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
                <ringGeometry args={[0.44, 0.52, 4, 1, Math.PI / 4]} />
                <meshBasicMaterial color={PAL.gold} depthTest={false} transparent toneMapped={false} />
            </mesh>
            {r > 0 && (
                <group ref={ring}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
                        <ringGeometry args={[r - 0.05, r, 72]} />
                        <meshBasicMaterial color={PAL.gold} transparent opacity={0.75} depthTest={false} toneMapped={false} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
                        <circleGeometry args={[r, 72]} />
                        <meshBasicMaterial color={PAL.gold} transparent opacity={0.08} depthTest={false} toneMapped={false} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Første fem sekunder: en glødende byggeplass ved enden av grøfta
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Karl XII i den fremste løpegraven (siste natt): han står og ser mot muren før han
// selv går til angrep. Egen figur i eget lys, så han synes i mørket.
// ---------------------------------------------------------------------------

const KW = new THREE.Vector3();
export function KarlWatch({ gRef, vis }: { gRef: GRef; vis: Vis }) {
    const F = figures();
    const H = hatGeos();
    const ref = useRef<THREE.Group>(null);
    const mat = useMemo(() => toonMat({}, 0.34), []);
    const ring = useMemo(
        () => new THREE.MeshBasicMaterial({ color: PAL.gold, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false }),
        []
    );
    useFrame((st) => {
        const m = ref.current;
        if (!m) return;
        const g = gRef.current;
        const on = karlWatching(g, vis) && !!karlSpot(g, vis, KW);
        m.visible = on;
        if (!on) {
            vis.glow.set(58, 0, -99, 0, 0, '#000', 0);
            return;
        }
        const t = st.clock.elapsedTime;
        m.position.copy(KW);
        // Han ser mot muren og lener seg litt over brystvernet, som i beretningene.
        m.rotation.set(0, Math.PI + Math.sin(t * 0.4) * 0.25, 0);
        vis.glow.set(58, KW.x, KW.y + 1.5, KW.z, 1.7 + Math.sin(t * 5) * 0.2, '#ffcf6a', 0.6);
    });
    const s = F.karl.scale;
    return (
        <group ref={ref} visible={false}>
            <mesh geometry={F.karl.geo} material={mat} scale={s} castShadow />
            <mesh geometry={H.tricorn} material={mat} position={[0, F.karl.hatY * s, 0]} scale={s} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={ring}>
                <ringGeometry args={[0.45, 0.7, 32]} />
            </mesh>
        </group>
    );
}

export function Beacon({ gRef, vis, at }: { gRef: GRef; vis: Vis; at: [number, number] | null }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((st) => {
        const m = ref.current;
        if (!m) return;
        const show = !!at && gRef.current.towers.length === 0 && !gRef.current.ended;
        m.visible = show;
        if (!show || !at) {
            vis.glow.set(55, 0, -99, 0, 0, '#000', 0);
            return;
        }
        const [wx, wz] = toWorld(at[0], at[1]);
        const t = st.clock.elapsedTime;
        m.position.set(wx, vis.hm.at(wx, wz) + 0.04, wz);
        m.rotation.y = t * 0.8;
        m.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
        vis.glow.set(55, wx, vis.hm.at(wx, wz) + 0.35, wz, 1.6 + Math.sin(t * 4) * 0.3, '#f2a93b', 0.55);
    });
    return (
        <group ref={ref} visible={false}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
                <ringGeometry args={[0.36, 0.5, 4, 1, Math.PI / 4]} />
                <meshBasicMaterial color={PAL.gold} depthTest={false} transparent toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.9, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.14, 0.34, 4]} />
                <meshBasicMaterial color={PAL.gold} toneMapped={false} />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Skuddbanen: vises når eleven velger en byggeplass/et tårn, og en liten stund etter at
// et tårn er plassert. Flat ild går rett over grøfta; morterbomba faller rett ned i den.
// ---------------------------------------------------------------------------

export type Aim = { kind: TowerKind; x: number; z: number };
const DOTS = 22;
function setColor(m: THREE.MeshBasicMaterial, c: THREE.Color) {
    m.color.copy(c);
}

/** Hvor tårnet skyter først: nærmeste rute på veien innenfor rekkevidden (eller rett fram). */
function aimTarget(g: G, a: Aim): { tx: number; tz: number; trench: boolean } {
    if (a.kind === 'mine') return { tx: a.x, tz: a.z, trench: g.cells[a.z]?.[a.x] === 'grav' };
    const r = rangeOf(g, { kind: a.kind, level: 0, cx: a.x, cz: a.z } as Parameters<typeof rangeOf>[1]);
    let best: [number, number] | null = null;
    let bd = 1e9;
    for (const rt of g.routes)
        for (const [x, z] of rt.cells) {
            const d = Math.hypot(x - a.x, z - a.z);
            if (d > r || d < (a.kind === 'morter' ? 1.2 : 0.5)) continue;
            if (d < bd) {
                bd = d;
                best = [x, z];
            }
        }
    if (best) return { tx: best[0], tz: best[1], trench: g.cells[best[1]][best[0]] === 'grav' };
    return { tx: a.x, tz: Math.min(ROWS - 1, a.z + Math.floor(r)), trench: false };
}

export function Trajectory({
    gRef,
    vis,
    sel,
    onShow,
}: {
    gRef: GRef;
    vis: Vis;
    sel: Aim | null;
    onShow: (a: Aim, at: [number, number, number], trench: boolean) => void;
}) {
    const dots = useRef<THREE.InstancedMesh | null>(null);
    const ring = useRef<THREE.Mesh>(null);
    const ringMat = useRef<THREE.MeshBasicMaterial>(null);
    const seen = useRef(new Set<number>());
    const auto = useRef<{ a: Aim; t: number } | null>(null);
    const lastKey = useRef('');
    const pts = useRef<THREE.Vector3[]>(Array.from({ length: DOTS }, () => new THREE.Vector3()));
    const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, depthTest: false, transparent: true, opacity: 0.95 }), []);
    useFrame((st, dt) => {
        const g = gRef.current;
        const m = dots.current;
        const rg = ring.current;
        if (!m || !rg) return;
        // Et nytt tårn: vis banen dets en liten stund.
        for (const t of g.towers) {
            if (seen.current.has(t.id)) continue;
            seen.current.add(t.id);
            if (t.built < 0.5 && (!auto.current || auto.current.t > 1.2)) auto.current = { a: { kind: t.kind, x: t.cx, z: t.cz }, t: 0 };
        }
        if (g.towers.length === 0 && seen.current.size) seen.current.clear();
        if (auto.current) {
            auto.current.t += dt;
            if (auto.current.t > 3.2) auto.current = null;
        }
        const a = sel ?? auto.current?.a ?? null;
        if (!a) {
            m.count = 0;
            rg.visible = false;
            lastKey.current = '';
            return;
        }
        const { tx, tz, trench } = aimTarget(g, a);
        const [ax, az] = toWorld(a.x, a.z);
        const [bx, bz] = toWorld(tx, tz);
        const y0 = vis.hm.at(ax, az) + 0.55;
        const floor = vis.hm.at(bx, bz);
        const key = `${a.kind}-${a.x}-${a.z}-${tx}-${tz}`;
        const high = a.kind === 'morter';
        const mine = a.kind === 'mine';
        for (let i = 0; i < DOTS; i++) {
            const k = i / (DOTS - 1);
            const p = pts.current[i];
            if (mine) {
                // Minen: jorda løfter seg rett opp fra grøftebunnen.
                p.set(bx + Math.sin(i * 2.4) * 0.12 * k, floor + 0.05 + k * 1.6, bz + Math.cos(i * 2.4) * 0.12 * k);
            } else if (high) {
                const top = 3.2;
                p.set(ax + (bx - ax) * k, y0 + (floor + 0.05 - y0) * k + top * 4 * k * (1 - k), az + (bz - az) * k);
            } else {
                // Flat ild: rett linje i brysthøyde, som fortsetter over grøfta.
                const over = 1.25;
                const crest = Math.max(vis.hm.at(bx, bz - 0.5), vis.hm.at(bx, bz + 0.5), 0.1) + 0.42;
                p.set(ax + (bx - ax) * k * over, y0 + (crest - y0) * Math.min(1, k * over), az + (bz - az) * k * over);
            }
        }
        const t = st.clock.elapsedTime;
        for (let i = 0; i < DOTS; i++) {
            const p = pts.current[i];
            const pulse = 0.5 + 0.5 * Math.sin(t * 8 - i * 0.7);
            place(m, i, p.x, p.y, p.z, 0, 0, 0, 0.065 + pulse * 0.03);
        }
        m.count = DOTS;
        m.instanceMatrix.needsUpdate = true;
        COLR.set(high || mine ? '#ffc34a' : '#ff6a55');
        setColor(mat, COLR);
        rg.visible = true;
        rg.position.set(bx, floor + 0.06, bz);
        rg.scale.setScalar(1 + Math.sin(t * 5) * 0.08);
        if (ringMat.current) setColor(ringMat.current, COLR);
        if (key !== lastKey.current) {
            lastKey.current = key;
            onShow(a, [tx, high || mine ? 0.2 : 1.0, tz], trench);
        }
    });
    return (
        <>
            <instancedMesh ref={dots} args={[geo, mat, DOTS]} frustumCulled={false} renderOrder={6} />
            <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={6}>
                <ringGeometry args={[0.3, 0.46, 24]} />
                <meshBasicMaterial ref={ringMat} transparent opacity={0.9} depthTest={false} toneMapped={false} />
            </mesh>
        </>
    );
}
