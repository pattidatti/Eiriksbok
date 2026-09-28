import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mergeParts } from '../kit/mergeParts';
import { useQuality } from '../kit/quality';
import { PLACES, TREES, SLOTTET, BLADET, BLADET_R, BLADET_HUS } from './geo';
import { MAX_STUCK, reach, MEET_TIME, type G } from './game';
import { hatchMat, OUTLINE, INK, RED, LAMP } from './hatch';
import {
    mapTexture,
    rollTexture,
    spiralTexture,
    slipTexture,
    placeLabel,
    slottLabel,
    bladetLabel,
    inWater,
    GROUND_W,
    GROUND_D,
} from './textures';

// 3D-scenen i Petisjonen: kartarket, bygdene, folkene, jegerne og rullen.
// Alt som finnes i mange eksemplarer er instanser (ett tegnekall per slag), og
// alt leser spilltilstanden fra gRef i useFrame - React tegner aldri scenen på
// nytt midt i spillet.

type GRef = React.MutableRefObject<G>;

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const ZERO = new THREE.Vector3(0, 0, 0);

function put(
    mesh: THREE.InstancedMesh,
    i: number,
    x: number,
    y: number,
    z: number,
    ry = 0,
    s = 1,
    rx = 0,
    rz = 0,
    sy = s
) {
    E.set(rx, ry, rz);
    Q.setFromEuler(E);
    P.set(x, y, z);
    S.set(s, sy, s);
    M.compose(P, Q, S);
    mesh.setMatrixAt(i, M);
}
function hide(mesh: THREE.InstancedMesh, i: number) {
    M.compose(ZERO, Q.identity(), S.set(0, 0, 0));
    mesh.setMatrixAt(i, M);
}

// ---------------------------------------------------------------------------
// Geometri (lages én gang)
// ---------------------------------------------------------------------------

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (t: number, b: number, h: number, n = 8) => new THREE.CylinderGeometry(t, b, h, n);
const ball = (r: number) => new THREE.IcosahedronGeometry(r, 1);
/** Saltak: et prisme med mønet langs x. */
const roof = (len: number, rad: number) => {
    const g = new THREE.CylinderGeometry(rad, rad, len, 3, 1, false, Math.PI / 2);
    return g;
};

const GEO = {
    lave: mergeParts([
        { geometry: box(3.4, 1.9, 2.3), position: [0, 0.95, 0], color: '#9c8b6c' },
        {
            geometry: roof(3.6, 1.45),
            position: [0, 2.35, 0],
            rotation: [0, 0, Math.PI / 2],
            scale: [1, 1, 0.95],
            color: '#7a6d58',
        },
        { geometry: box(1.1, 1.3, 0.1), position: [0, 0.65, 1.17], color: '#6b5a44' },
        { geometry: box(0.08, 1.3, 0.12), position: [0, 0.65, 1.2], color: INK },
    ]),
    stue: mergeParts([
        { geometry: box(2.3, 1.35, 1.6), position: [0, 0.68, 0], color: '#cbb892' },
        {
            geometry: roof(2.5, 1.08),
            position: [0, 1.72, 0],
            rotation: [0, 0, Math.PI / 2],
            scale: [1, 1, 0.8],
            color: '#8f8470',
        },
        { geometry: box(0.3, 0.7, 0.3), position: [0.6, 2.2, 0], color: '#8a7e6a' },
        { geometry: box(0.35, 0.35, 0.05), position: [-0.55, 0.8, 0.81], color: LAMP },
        { geometry: box(0.35, 0.35, 0.05), position: [0.45, 0.8, 0.81], color: LAMP },
    ]),
    husmann: mergeParts([
        { geometry: box(1.45, 0.95, 1.1), position: [0, 0.48, 0], color: '#a8977a' },
        {
            geometry: roof(1.6, 0.78),
            position: [0, 1.2, 0],
            rotation: [0, 0, Math.PI / 2],
            scale: [1, 1, 0.75],
            color: '#7b7560',
        },
        { geometry: box(0.28, 0.28, 0.05), position: [0.3, 0.55, 0.56], color: LAMP },
    ]),
    tree: mergeParts([
        { geometry: cyl(0.08, 0.12, 0.6, 5), position: [0, 0.3, 0], color: '#5a4a38' },
        { geometry: new THREE.ConeGeometry(0.75, 1.3, 7), position: [0, 1.0, 0], color: '#7d7a5c' },
        { geometry: new THREE.ConeGeometry(0.55, 1.0, 7), position: [0, 1.6, 0], color: '#7d7a5c' },
        { geometry: new THREE.ConeGeometry(0.34, 0.7, 7), position: [0, 2.1, 0], color: '#7d7a5c' },
    ]),
    person: mergeParts([
        { geometry: box(0.3, 0.42, 0.2), position: [0, 0.21, 0], color: '#3f382f' },
        { geometry: cyl(0.19, 0.26, 0.52, 7), position: [0, 0.66, 0], color: '#74685a' },
        { geometry: box(0.62, 0.12, 0.14), position: [0, 0.82, 0], color: '#74685a' },
        { geometry: ball(0.15), position: [0, 1.04, 0], color: '#e6d3b2' },
        {
            geometry: new THREE.ConeGeometry(0.155, 0.28, 6),
            position: [0.02, 1.2, -0.02],
            rotation: [-0.25, 0, 0.2],
            color: '#8e8574',
        },
    ]),
    embetsmann: mergeParts([
        { geometry: box(0.3, 0.4, 0.2), position: [0, 0.2, 0], color: INK },
        { geometry: cyl(0.19, 0.32, 0.74, 8), position: [0, 0.6, 0], color: '#26221e' },
        { geometry: cyl(0.14, 0.17, 0.07, 8), position: [0, 0.99, 0], color: '#f6f0e2' },
        { geometry: ball(0.15), position: [0, 1.12, 0], color: '#e6d3b2' },
        { geometry: cyl(0.25, 0.25, 0.035, 10), position: [0, 1.25, 0], color: '#141210' },
        { geometry: cyl(0.15, 0.16, 0.4, 10), position: [0, 1.46, 0], color: '#141210' },
        { geometry: cyl(0.165, 0.165, 0.08, 10), position: [0, 1.32, 0], color: RED },
    ]),
    bonde: mergeParts([
        { geometry: box(0.3, 0.4, 0.2), position: [0, 0.2, 0], color: '#2c261f' },
        { geometry: cyl(0.2, 0.3, 0.64, 8), position: [0, 0.6, 0], color: '#51402f' },
        { geometry: box(0.4, 0.3, 0.05), position: [0, 0.7, 0.2], color: '#7b2e24' },
        { geometry: ball(0.15), position: [0, 1.04, 0], color: '#e6d3b2' },
        { geometry: cyl(0.26, 0.26, 0.035, 10), position: [0, 1.17, 0], color: '#141210' },
        { geometry: cyl(0.15, 0.16, 0.32, 10), position: [0, 1.34, 0], color: '#141210' },
        { geometry: cyl(0.165, 0.165, 0.08, 10), position: [0, 1.23, 0], color: RED },
    ]),
    slottet: mergeParts([
        { geometry: box(8, 2.6, 3.2), position: [0, 1.3, 0], color: '#dccfb2' },
        { geometry: box(8.2, 0.3, 3.4), position: [0, 2.72, 0], color: '#6e6452' },
        { geometry: box(2.8, 3.3, 3.6), position: [0, 1.65, 0.15], color: '#e3d7bb' },
        {
            geometry: roof(3.0, 1.0),
            position: [0, 3.5, 0.15],
            rotation: [0, Math.PI / 2, Math.PI / 2],
            scale: [1, 1, 1.8],
            color: '#7a6d58',
        },
        ...[-1.1, -0.37, 0.37, 1.1].map((x) => ({
            geometry: cyl(0.14, 0.16, 2.4, 8),
            position: [x, 1.2, 2.05] as [number, number, number],
            color: '#f4ecd8',
        })),
        { geometry: box(1.1, 1.5, 0.1), position: [0, 0.75, 1.96], color: '#3a2e22' },
        ...[-3.1, -2.1, 2.1, 3.1].map((x) => ({
            geometry: box(0.45, 0.8, 0.06),
            position: [x, 1.4, 1.62] as [number, number, number],
            color: '#4a4032',
        })),
    ]),
    shadow: new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2),
    ring: new THREE.RingGeometry(0.965, 1, 48).rotateX(-Math.PI / 2),
    dangerRing: new THREE.RingGeometry(0.72, 1, 32).rotateX(-Math.PI / 2),
    torus: new THREE.TorusGeometry(1, 0.08, 6, 36).rotateX(Math.PI / 2),
    pole: cyl(0.05, 0.06, 3, 5),
    flag: box(1.0, 0.62, 0.04),
    pile: box(0.9, 1, 0.7),
    pip: ball(0.16),
    slip: new THREE.PlaneGeometry(0.78, 0.53),
    dot: ball(0.12),
    lantern: ball(0.22),
};

// Konturen er en litt større kopi med baksiden ut: geometrien blåses opp langs normalene.
function inflate(src: THREE.BufferGeometry, by: number) {
    // Myke normaler (hjørnene slått sammen), ellers sprekker konturen i hjørnene.
    const raw = src.clone();
    raw.deleteAttribute('normal');
    raw.deleteAttribute('color');
    const g = mergeVertices(raw, 1e-3);
    g.computeVertexNormals();
    const pos = g.getAttribute('position');
    const nor = g.getAttribute('normal');
    for (let i = 0; i < pos.count; i++)
        pos.setXYZ(
            i,
            pos.getX(i) + nor.getX(i) * by,
            pos.getY(i) + nor.getY(i) * by,
            pos.getZ(i) + nor.getZ(i) * by
        );
    return g;
}
const LINE = {
    lave: inflate(GEO.lave, 0.07),
    stue: inflate(GEO.stue, 0.06),
    husmann: inflate(GEO.husmann, 0.05),
    tree: inflate(GEO.tree, 0.05),
    person: inflate(GEO.person, 0.035),
    embetsmann: inflate(GEO.embetsmann, 0.035),
    bonde: inflate(GEO.bonde, 0.035),
    slottet: inflate(GEO.slottet, 0.07),
};

// Flate normaler: hver flate får sin egen skravur, som i et tresnitt.
for (const g of [
    GEO.lave,
    GEO.stue,
    GEO.husmann,
    GEO.tree,
    GEO.person,
    GEO.embetsmann,
    GEO.bonde,
    GEO.slottet,
])
    g.computeVertexNormals();

const VC = () => hatchMat('#ffffff', { vertexColors: true });

// ---------------------------------------------------------------------------
// Kartarket og stedsnavn
// ---------------------------------------------------------------------------

export function Ground() {
    const [tex] = useState(mapTexture);
    useEffect(() => () => tex.dispose(), [tex]);
    return (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
            <planeGeometry args={[GROUND_W, GROUND_D]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
    );
}

export function Labels() {
    const [items] = useState(() => PLACES.map((p) => ({ p, tex: placeLabel(p.name, p.by) })));
    const [slott] = useState(slottLabel);
    useEffect(
        () => () => {
            items.forEach((i) => i.tex.dispose());
            slott.dispose();
        },
        [items, slott]
    );
    return (
        <group>
            {items.map(({ p, tex }) => (
                <mesh
                    key={p.id}
                    rotation-x={-Math.PI / 2}
                    position={[p.tun[0], 0.03, p.tun[1] + (p.by ? 7.4 : 3.6)]}
                    renderOrder={1}
                >
                    <planeGeometry args={[p.by ? 6.4 : 5.6, p.by ? 1.44 : 1.26]} />
                    <meshBasicMaterial
                        map={tex}
                        transparent
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
            ))}
            <mesh rotation-x={-Math.PI / 2} position={[SLOTTET[0], 0.03, SLOTTET[1] + 3.7]}>
                <planeGeometry args={[6.3, 1.2]} />
                <meshBasicMaterial map={slott} transparent depthWrite={false} />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Hus, trær og Slottet
// ---------------------------------------------------------------------------

export function Houses() {
    const kinds = useMemo(() => {
        const all = PLACES.flatMap((p) => p.houses);
        return ([1, 0, 2] as const).map((k) => all.filter((h) => h.kind === k));
    }, []);
    const geos = [GEO.lave, GEO.stue, GEO.husmann];
    const lines = [LINE.lave, LINE.stue, LINE.husmann];
    const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
    useEffect(() => {
        refs.current.forEach((m, i) => {
            if (!m) return;
            const list = kinds[i % 3];
            list.forEach((h, j) => put(m, j, h.p[0], 0, h.p[1], h.rot));
            m.instanceMatrix.needsUpdate = true;
            m.computeBoundingSphere();
        });
    }, [kinds]);
    return (
        <group>
            {kinds.map((list, i) => (
                <group key={i}>
                    <instancedMesh
                        ref={(el) => {
                            refs.current[i] = el;
                        }}
                        args={[geos[i], VC(), list.length]}
                        frustumCulled={false}
                    />
                    <instancedMesh
                        ref={(el) => {
                            refs.current[i + 3] = el;
                        }}
                        args={[lines[i], OUTLINE, list.length]}
                        frustumCulled={false}
                    />
                </group>
            ))}
        </group>
    );
}

// Materialer som endres hvert bilde bor på modulnivå (én scene om gangen).
const GLOW_MAT = new THREE.MeshBasicMaterial({
    color: LAMP,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
});

export function Slottet({ gRef }: { gRef: GRef }) {
    const glow = useRef<THREE.Mesh>(null);
    const mat = GLOW_MAT;
    useFrame((st) => {
        const g = gRef.current;
        if (!glow.current) return;
        glow.current.visible = g.open;
        const k = 1 + Math.sin(st.clock.elapsedTime * 4) * 0.08;
        glow.current.scale.setScalar(5.2 * k);
        mat.opacity = 0.35 + Math.sin(st.clock.elapsedTime * 4) * 0.15;
    });
    return (
        <group position={[SLOTTET[0], 0, SLOTTET[1]]}>
            <mesh geometry={GEO.slottet} material={VC()} />
            <mesh geometry={LINE.slottet} material={OUTLINE} />
            <mesh position={[0, 5.1, 0.15]} material={hatchMat(RED)}>
                <boxGeometry args={[1.1, 0.7, 0.04]} />
            </mesh>
            <mesh position={[-0.5, 4.4, 0.15]} geometry={GEO.pole} material={hatchMat(INK)} />
            <mesh ref={glow} geometry={GEO.shadow} position={[0, 0.05, 0]} material={mat} />
        </group>
    );
}

/** Arbeider-Foreningernes Blad: trykkeriet der navnene blir trygge. */
export function Bladet({ gRef }: { gRef: GRef }) {
    const ring = useRef<THREE.Mesh>(null);
    const [label] = useState(bladetLabel);
    useEffect(() => () => label.dispose(), [label]);
    useFrame((st) => {
        const g = gRef.current;
        if (!ring.current) return;
        const unsafe = g.roll.names - g.safe;
        const k = unsafe >= 60 ? 1 + Math.sin(st.clock.elapsedTime * 5) * 0.07 : 1;
        ring.current.scale.setScalar(BLADET_R * k);
        BLADET_MAT.opacity = unsafe >= 60 ? 0.85 : 0.35;
    });
    return (
        <group>
            <group position={[BLADET_HUS[0], 0, BLADET_HUS[1]]}>
                <mesh geometry={GEO.stue} material={VC()} scale={[1.25, 1.35, 1.25]} />
                <mesh geometry={LINE.stue} material={OUTLINE} scale={[1.25, 1.35, 1.25]} />
                {/* Skiltet over døra: avisa. */}
                <mesh position={[0, 1.55, 1.08]} material={hatchMat(RED)}>
                    <boxGeometry args={[2.3, 0.42, 0.06]} />
                </mesh>
            </group>
            <mesh
                ref={ring}
                geometry={GEO.dangerRing}
                material={BLADET_MAT}
                position={[BLADET[0], 0.06, BLADET[1]]}
            />
            <mesh rotation-x={-Math.PI / 2} position={[BLADET[0], 0.04, BLADET[1] + 3.1]}>
                <planeGeometry args={[6.4, 1.3]} />
                <meshBasicMaterial map={label} transparent depthWrite={false} toneMapped={false} />
            </mesh>
        </group>
    );
}

const BLADET_MAT = new THREE.MeshBasicMaterial({
    color: INK,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
});

export function Trees({ gRef }: { gRef: GRef }) {
    const q = useQuality();
    const list = useMemo(() => {
        const keep = TREES.filter((p) => !inWater(p));
        const n = Math.round(keep.length * Math.min(1, 0.55 + q.detail * 0.5));
        return keep.slice(0, n).map((p, i) => ({ p, s: 0.8 + ((i * 37) % 10) / 22, ry: i * 1.7 }));
    }, [q.detail]);
    const tree = useRef<THREE.InstancedMesh>(null);
    const line = useRef<THREE.InstancedMesh>(null);
    const bent = useRef(new Map<number, number>());
    const place = (i: number, lean: number, ax: number, az: number) => {
        const t = list[i];
        for (const m of [tree.current, line.current]) {
            if (!m) continue;
            put(m, i, t.p[0], 0, t.p[1], t.ry, t.s, az * lean, ax * lean);
        }
    };
    useEffect(() => {
        list.forEach((_, i) => place(i, 0, 0, 0));
        for (const m of [tree.current, line.current]) {
            if (!m) continue;
            m.instanceMatrix.needsUpdate = true;
            m.computeBoundingSphere();
        }
        // place leser bare list
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [list]);
    // Rullen bøyer trærne den ruller gjennom, og de retter seg opp igjen.
    useFrame((_, dt) => {
        const R = gRef.current.roll;
        const b = bent.current;
        let dirty = false;
        for (let i = 0; i < list.length; i++) {
            const t = list[i];
            const dx = t.p[0] - R.p[0];
            const dz = t.p[1] - R.p[1];
            const d = Math.hypot(dx, dz);
            const lim = R.r + 1.2;
            if (d < lim) {
                b.set(i, Math.max(b.get(i) ?? 0, (1 - d / lim) * 1.1));
            }
            const cur = b.get(i);
            if (cur === undefined) continue;
            const next = cur - dt * 1.4;
            dirty = true;
            if (next <= 0) {
                b.delete(i);
                place(i, 0, 0, 0);
            } else place(i, next, dx / (d || 1), -dz / (d || 1));
            if (next > 0) b.set(i, next);
        }
        if (dirty)
            for (const m of [tree.current, line.current])
                if (m) m.instanceMatrix.needsUpdate = true;
    });
    return (
        <group>
            <instancedMesh ref={tree} args={[GEO.tree, VC(), list.length]} frustumCulled={false} />
            <instancedMesh
                ref={line}
                args={[LINE.tree, OUTLINE, list.length]}
                frustumCulled={false}
            />
        </group>
    );
}

// ---------------------------------------------------------------------------
// Bygdene: flagg, møter, stabler med navn, verving
// ---------------------------------------------------------------------------

const N = PLACES.length;
const PIPS = 4;
const DOTS = 11;

const MARK_MATS = {
    ring: new THREE.MeshBasicMaterial({ color: LAMP, toneMapped: false }),
    disk: new THREE.MeshBasicMaterial({
        color: LAMP,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
    }),
    reach: new THREE.MeshBasicMaterial({
        color: RED,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
    }),
    lantern: new THREE.MeshBasicMaterial({ color: '#ffd873', toneMapped: false }),
    hole: new THREE.MeshBasicMaterial({ color: INK }),
};

export function PlaceMarks({ gRef }: { gRef: GRef }) {
    const poles = useRef<THREE.InstancedMesh>(null);
    const flags = useRef<THREE.InstancedMesh>(null);
    const piles = useRef<THREE.InstancedMesh>(null);
    const pips = useRef<THREE.InstancedMesh>(null);
    const holes = useRef<THREE.InstancedMesh>(null);
    const rings = useRef<THREE.InstancedMesh>(null);
    const disks = useRef<THREE.InstancedMesh>(null);
    const reachs = useRef<THREE.InstancedMesh>(null);
    const dots = useRef<THREE.InstancedMesh>(null);
    const lanterns = useRef<THREE.InstancedMesh>(null);
    const mats = MARK_MATS;
    useEffect(() => {
        const m = poles.current;
        if (!m) return;
        PLACES.forEach((p, i) => put(m, i, p.tun[0] + 1.3, 1.5, p.tun[1] - 0.9));
        m.instanceMatrix.needsUpdate = true;
    }, []);
    useFrame((st) => {
        const g = gRef.current;
        const t = st.clock.elapsedTime;
        const R = g.roll;
        const all = [flags, piles, pips, holes, rings, disks, reachs, dots, lanterns];
        if (all.some((r) => !r.current)) return;
        const [fl, pi, pp, ho, ri, di, re, dt, la] = all.map((r) => r.current!);
        PLACES.forEach((pl, i) => {
            const ps = g.places[i];
            const f = ps.forening;
            const [x, z] = pl.tun;
            const px = x + 1.3;
            const pz = z - 0.9;
            // Flagget: heises under møtet, vaier rødt når bygda har forening.
            if (f) {
                const wave = Math.sin(t * 5 + i) * 0.18;
                put(fl, i, px + 0.52, 2.62, pz, wave, 1 + ps.flash * 0.5, 0, 0, 1);
            } else if (ps.klar && ps.meeting > 0) {
                const k = ps.meeting / MEET_TIME;
                put(fl, i, px + 0.52, 0.4 + k * 2.2, pz, Math.sin(t * 8) * 0.1, 1);
            } else hide(fl, i);
            // Stabelen med navn som venter i låven.
            if (f && f.pile >= 1) {
                const h = 0.08 + Math.min(3.4, f.pile / 200);
                put(pi, i, x - 1.7, h / 2, z + 0.4, 0.3, 1, 0, 0, h);
            } else hide(pi, i);
            // Prikker: hvor mange fra bygda som er med på rullen.
            for (let k = 0; k < PIPS; k++) {
                const idx = i * PIPS + k;
                const show = !f && k < pl.need && ps.spark > 0;
                const on = show && k < ps.spark;
                const ox = x + (k - (pl.need - 1) / 2) * 0.46;
                const y = 3.35 + Math.sin(t * 3 + k) * 0.05;
                if (on) put(pp, idx, ox, y, z - 2.4, 0, 1 + (ps.klar ? Math.sin(t * 6) * 0.15 : 0));
                else hide(pp, idx);
                if (show && !on) put(ho, idx, ox, y, z - 2.4, 0, 0.55);
                else hide(ho, idx);
            }
            // Klar for møte (eller i 1851: lederen venter): lysende ring og lykt.
            const waiting =
                g.phase === 'knusing' &&
                g.leaders.some((l) => l.place === i && l.state === 'venter');
            if ((ps.klar && !f) || waiting) {
                const pulse = 2.5 + Math.sin(t * 5) * 0.12;
                put(ri, i, x, 0.08, z, 0, pulse, 0, 0, 1);
                put(la, i, px, 3.2, pz, 0, 1 + Math.sin(t * 7) * 0.12);
                const k = Math.min(1, ps.meeting / MEET_TIME);
                if (k > 0) put(di, i, x, 0.06, z, 0, 2.4 * k, 0, 0, 1);
                else hide(di, i);
            } else {
                hide(ri, i);
                hide(la, i);
                hide(di, i);
            }
            // Hvor langt navnene når: vises når rullen er i nærheten.
            if (f) {
                const rr = reach(f, R.r);
                const d = Math.hypot(R.p[0] - x, R.p[1] - z);
                // Bare når rullen er på vei inn i den - ellers blir kartet en suppe av ringer.
                if (d < rr + 2.5 && d > rr * 0.35) put(re, i, x, 0.05, z, t * 0.2, rr, 0, 0, 1);
                else hide(re, i);
            } else hide(re, i);
            // Vervingen: røde prikker kryper mot nabobygda.
            for (let k = 0; k < DOTS; k++) {
                const idx = i * DOTS + k;
                if (f && f.recruit >= 0) {
                    const to = PLACES[f.recruit].tun;
                    const u = (k + 1) / (DOTS + 1);
                    const lit = u <= f.recruitProg;
                    put(
                        dt,
                        idx,
                        x + (to[0] - x) * u,
                        0.15 + Math.sin(u * Math.PI) * 0.8,
                        z + (to[1] - z) * u,
                        0,
                        lit ? 1.1 : 0.45
                    );
                } else hide(dt, idx);
            }
        });
        mats.reach.opacity = 0.35 + Math.sin(t * 3) * 0.1;
        for (const m of [fl, pi, pp, ho, ri, di, re, dt, la]) m.instanceMatrix.needsUpdate = true;
    });
    return (
        <group>
            <instancedMesh
                ref={poles}
                args={[GEO.pole, hatchMat('#6b5a44'), N]}
                frustumCulled={false}
            />
            <instancedMesh ref={flags} args={[GEO.flag, hatchMat(RED), N]} frustumCulled={false} />
            <instancedMesh
                ref={piles}
                args={[GEO.pile, hatchMat('#f5ecd6'), N]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={pips}
                args={[GEO.pip, hatchMat(RED), N * PIPS]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={holes}
                args={[GEO.pip, mats.hole, N * PIPS]}
                frustumCulled={false}
            />
            <instancedMesh ref={rings} args={[GEO.torus, mats.ring, N]} frustumCulled={false} />
            <instancedMesh ref={disks} args={[GEO.shadow, mats.disk, N]} frustumCulled={false} />
            <instancedMesh ref={reachs} args={[GEO.ring, mats.reach, N]} frustumCulled={false} />
            <instancedMesh
                ref={dots}
                args={[GEO.dot, hatchMat(RED), N * DOTS]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={lanterns}
                args={[GEO.lantern, mats.lantern, N]}
                frustumCulled={false}
            />
        </group>
    );
}

// ---------------------------------------------------------------------------
// Folk: husmenn, medlemmer, bønder og embetsmenn
// ---------------------------------------------------------------------------

const SHADOW_MAT = new THREE.MeshBasicMaterial({
    color: INK,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
});

const DANGER_MAT = new THREE.MeshBasicMaterial({
    color: RED,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
});

export function People({ gRef }: { gRef: GRef }) {
    const g0 = gRef.current;
    const nP = g0.people.length;
    const nB = g0.hunters.filter((h) => h.kind === 'bonde').length;
    const nE = g0.hunters.length - nB;
    const people = useRef<THREE.InstancedMesh>(null);
    const peopleL = useRef<THREE.InstancedMesh>(null);
    const sash = useRef<THREE.InstancedMesh>(null);
    const bonde = useRef<THREE.InstancedMesh>(null);
    const bondeL = useRef<THREE.InstancedMesh>(null);
    const emb = useRef<THREE.InstancedMesh>(null);
    const embL = useRef<THREE.InstancedMesh>(null);
    const papers = useRef<THREE.InstancedMesh>(null);
    const shadows = useRef<THREE.InstancedMesh>(null);
    const alarm = useRef<THREE.InstancedMesh>(null);
    const danger = useRef<THREE.InstancedMesh>(null);
    useFrame((st) => {
        const g = gRef.current;
        const t = st.clock.elapsedTime;
        const R = g.roll;
        const refs = [
            people,
            peopleL,
            sash,
            bonde,
            bondeL,
            emb,
            embL,
            papers,
            shadows,
            alarm,
            danger,
        ];
        if (refs.some((r) => !r.current)) return;
        const [pe, pl, sa, bo, bl, em, el, pa, sh, al, dg] = refs.map((r) => r.current!);
        let si = 0;
        g.people.forEach((p, i) => {
            if (p.state === 'borte') {
                hide(pe, i);
                hide(pl, i);
                hide(sa, i);
                return;
            }
            const near = Math.hypot(R.p[0] - p.p[0], R.p[1] - p.p[1]);
            // Husmenn ser på rullen når den kommer; medlemmene jubler.
            const face =
                near < 9
                    ? Math.atan2(R.p[0] - p.p[0], R.p[1] - p.p[1])
                    : p.face + Math.sin(t * 0.3 + i) * 0.4;
            const member = p.state === 'medlem';
            const hop = member
                ? Math.abs(Math.sin(t * 5 + i * 1.3)) * (near < 12 ? 0.35 : 0.08)
                : 0;
            const s = 0.2 + 0.8 * easeBack(p.pop);
            put(pe, i, p.p[0], hop, p.p[1], face, s);
            put(pl, i, p.p[0], hop, p.p[1], face, s);
            if (member) put(sa, i, p.p[0], 0.82 + hop, p.p[1], face, s);
            else hide(sa, i);
            put(sh, si++, p.p[0], 0.02, p.p[1], 0, 0.38 * s);
        });
        let bi = 0;
        let ei = 0;
        g.hunters.forEach((h, hi) => {
            const isB = h.kind === 'bonde';
            const m = isB ? bo : em;
            const ml = isB ? bl : el;
            const idx = isB ? bi++ : ei++;
            if (!h.active) {
                hide(m, idx);
                hide(ml, idx);
                hide(al, hi);
                hide(pa, hi);
                hide(dg, hi);
                return;
            }
            const sp = Math.hypot(h.v[0], h.v[1]);
            const face =
                sp > 0.2
                    ? Math.atan2(h.v[0], h.v[1])
                    : Math.atan2(R.p[0] - h.p[0], R.p[1] - h.p[1]);
            const bob =
                Math.abs(Math.sin(t * (h.chasing ? 14 : 7) + hi)) * Math.min(0.15, sp * 0.03);
            const lean = h.chasing ? 0.22 : 0;
            const s = 0.3 + 0.7 * easeBack(h.born) + (isB ? 0 : 0.08);
            put(m, idx, h.p[0], bob, h.p[1], face, s, lean);
            put(ml, idx, h.p[0], bob, h.p[1], face, s, lean);
            put(sh, si++, h.p[0], 0.02, h.p[1], 0, 0.42 * s);
            // Et rødt utropstegn over den som jager deg.
            if (h.chasing && h.stun <= 0) {
                put(al, hi, h.p[0], 2.05 * s + Math.sin(t * 10) * 0.06, h.p[1], 0, 1);
                // Rød faresirkel på bakken rundt den som jager deg.
                put(dg, hi, h.p[0], 0.04, h.p[1], 0, 1.1 + Math.sin(t * 8) * 0.12, 0, 0, 1);
            } else {
                hide(al, hi);
                hide(dg, hi);
            }
            // Står og river i papiret etter et treff.
            if (h.stun > 0)
                put(
                    pa,
                    hi,
                    h.p[0] + Math.sin(face) * 0.35,
                    0.9,
                    h.p[1] + Math.cos(face) * 0.35,
                    face + Math.sin(t * 20) * 0.3,
                    1.1,
                    0.5
                );
            else hide(pa, hi);
        });
        // Skyggen under rullen.
        put(sh, si++, R.p[0], 0.02, R.p[1], 0, R.r * 1.15);
        for (; si < sh.count; si++) hide(sh, si);
        for (const m of refs) m.current!.instanceMatrix.needsUpdate = true;
    });
    const slipMat = useSlipMat();
    return (
        <group>
            <instancedMesh ref={people} args={[GEO.person, VC(), nP]} frustumCulled={false} />
            <instancedMesh ref={peopleL} args={[LINE.person, OUTLINE, nP]} frustumCulled={false} />
            <instancedMesh
                ref={sash}
                args={[box(0.66, 0.13, 0.3), hatchMat(RED), nP]}
                frustumCulled={false}
            />
            <instancedMesh ref={bonde} args={[GEO.bonde, VC(), nB]} frustumCulled={false} />
            <instancedMesh ref={bondeL} args={[LINE.bonde, OUTLINE, nB]} frustumCulled={false} />
            <instancedMesh ref={emb} args={[GEO.embetsmann, VC(), nE]} frustumCulled={false} />
            <instancedMesh ref={embL} args={[LINE.embetsmann, OUTLINE, nE]} frustumCulled={false} />
            <instancedMesh ref={papers} args={[GEO.slip, slipMat, nB + nE]} frustumCulled={false} />
            <instancedMesh
                ref={shadows}
                args={[GEO.shadow, SHADOW_MAT, nP + nB + nE + 1]}
                frustumCulled={false}
                renderOrder={1}
            />
            <instancedMesh
                ref={danger}
                args={[GEO.dangerRing, DANGER_MAT, nB + nE]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={alarm}
                args={[
                    new THREE.ConeGeometry(0.13, 0.42, 5).rotateX(Math.PI),
                    hatchMat(RED),
                    nB + nE,
                ]}
                frustumCulled={false}
            />
        </group>
    );
}

function easeBack(k: number) {
    const c = 1.7;
    const x = Math.min(1, Math.max(0, k)) - 1;
    return 1 + (c + 1) * x * x * x + c * x * x;
}

// ---------------------------------------------------------------------------
// Rullen, figurene som henger fast, navnelappene og papirbitene
// ---------------------------------------------------------------------------

function useSlipMat() {
    const [m] = useState(
        () =>
            new THREE.MeshBasicMaterial({
                map: slipTexture(),
                side: THREE.DoubleSide,
            })
    );
    useEffect(
        () => () => {
            m.map?.dispose();
            m.dispose();
        },
        [m]
    );
    return m;
}

// Rød kontur rundt rullen: spilleren skal aldri drukne i skravuren.
const ROLL_LINE = new THREE.MeshBasicMaterial({ color: RED, side: THREE.BackSide });

const ROLL_MARK = new THREE.MeshBasicMaterial({
    color: RED,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
});

const rollLen = (r: number) => 0.7 + r * 1.25;

export function Roll({ gRef }: { gRef: GRef }) {
    const yaw = useRef<THREE.Group>(null);
    const spin = useRef<THREE.Group>(null);
    const body = useRef<THREE.Mesh>(null);
    const line = useRef<THREE.Mesh>(null);
    const stuck = useRef<THREE.InstancedMesh>(null);
    const marker = useRef<THREE.Mesh>(null);
    const [mats] = useState(() => {
        const side = new THREE.MeshLambertMaterial({ map: rollTexture() });
        const cap = new THREE.MeshLambertMaterial({ map: spiralTexture() });
        for (const m of [side, cap]) {
            m.onBeforeCompile = hatchMat('#ffffff').onBeforeCompile;
            m.customProgramCacheKey = () => 'hatch-map';
            m.toneMapped = false;
        }
        side.map!.repeat.set(2, 1);
        return [side, cap, cap];
    });
    useEffect(
        () => () => {
            mats.forEach((m) => {
                m.map?.dispose();
                m.dispose();
            });
        },
        [mats]
    );
    const geo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 28, 1), []);
    const lineGeo = useMemo(() => new THREE.CylinderGeometry(1.1, 1.1, 1.04, 20, 1), []);
    useFrame((st) => {
        const g = gRef.current;
        const R = g.roll;
        const t = st.clock.elapsedTime;
        if (!yaw.current || !spin.current || !body.current || !line.current || !stuck.current)
            return;
        const bump = 1 + R.bump * 0.06;
        const r = R.r * bump;
        const L = rollLen(R.r);
        // Blinker litt etter et treff.
        const blink = R.invuln > 0 && Math.floor(t * 14) % 2 === 0;
        yaw.current.visible = !blink;
        // Rød ring på bakken rundt rullen, så den er lett å finne fra første sekund.
        if (marker.current) {
            marker.current.position.set(R.p[0], 0.05, R.p[1]);
            marker.current.scale.setScalar(r * 1.35 + 0.35 + Math.sin(t * 4) * 0.05);
        }
        yaw.current.position.set(R.p[0], r, R.p[1]);
        yaw.current.rotation.y = R.heading;
        spin.current.rotation.x = R.spin;
        body.current.scale.set(r, L, r);
        line.current.scale.set(r, L, r);
        mats[0].map!.repeat.set(Math.max(1, Math.round(r * 2)), 1);
        // Figurene som henger fast: på overflaten, spreller.
        const m = stuck.current;
        const list = g.stuck;
        for (let i = 0; i < MAX_STUCK; i++) {
            const s = list[i];
            if (!s) {
                hide(m, i);
                continue;
            }
            const a = s.ang;
            const wob = Math.sin(t * 9 + s.wob) * 0.35;
            // Lokal ramme i den snurrende gruppa: aksen er x.
            const y = Math.cos(a) * (r + 0.05);
            const z = Math.sin(a) * (r + 0.05);
            E.set(a + wob * 0.4, 0, wob);
            Q.setFromEuler(E);
            P.set(s.along * L * 0.45, y, z);
            S.setScalar(0.62 + Math.min(0.5, R.r * 0.08));
            M.compose(P, Q, S);
            m.setMatrixAt(i, M);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <mesh ref={marker} geometry={GEO.dangerRing} material={ROLL_MARK} />
            <group ref={yaw}>
                <group ref={spin}>
                    <mesh ref={body} geometry={geo} material={mats} rotation-z={Math.PI / 2} />
                    <mesh
                        ref={line}
                        geometry={lineGeo}
                        material={ROLL_LINE}
                        rotation-z={Math.PI / 2}
                    />
                    <instancedMesh
                        ref={stuck}
                        args={[GEO.person, VC(), MAX_STUCK]}
                        frustumCulled={false}
                    />
                </group>
            </group>
        </>
    );
}

const MAX_FLY = 150;

export function Flying({ gRef }: { gRef: GRef }) {
    const slips = useRef<THREE.InstancedMesh>(null);
    const mat = useSlipMat();
    useFrame((st) => {
        const g = gRef.current;
        const m = slips.current;
        if (!m) return;
        const R = g.roll;
        const t = st.clock.elapsedTime;
        let i = 0;
        for (const s of g.slips) {
            if (i >= MAX_FLY) break;
            const u = s.t;
            const x = s.from[0] + (R.p[0] - s.from[0]) * u;
            const z = s.from[1] + (R.p[1] - s.from[1]) * u;
            const y = 0.6 + (R.r - 0.6) * u + Math.sin(u * Math.PI) * s.arc;
            put(m, i++, x, y, z, t * 6 + s.arc * 3, 1 - u * 0.4, t * 4 + s.dur * 9);
        }
        for (const s of g.scraps) {
            if (i >= MAX_FLY) break;
            put(m, i++, s.p[0], s.p[1], s.p[2], s.spin * t, 0.8, s.spin * t * 0.7);
        }
        for (; i < MAX_FLY; i++) hide(m, i);
        m.instanceMatrix.needsUpdate = true;
    });
    return <instancedMesh ref={slips} args={[GEO.slip, mat, MAX_FLY]} frustumCulled={false} />;
}

/** Lys: lav vintersol fra sørvest, som gir lange skygger - og mye skravur. */
export function Lights() {
    return (
        <>
            {/* Lambert deler på pi: 1,0 + 1,6 + 3,2 gir full sol på toppflatene. */}
            <hemisphereLight args={['#fffaf0', '#8b8170', 1.6]} />
            <ambientLight intensity={1.0} />
            <directionalLight position={[-14, 14, 11]} intensity={3.2} />
        </>
    );
}
