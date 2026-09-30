import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { RADIO } from './tuning';
import { MAP_D, MAP_W, FLYPLASS, SLAG, type SlagDef } from './levels';
import { canPlace, isAir, slagDef, type G, type Unit, type Enemy } from './game';
import { C, UNIT_SHAPE, ENEMY_SHAPE, type Part } from './models';

// Gråboks-visningen: flate klosser på et kartutsnitt, sett ortografisk skrått ovenfra.
// Alt leser spilltilstanden fra gRef i useFrame; React tegner bare på nytt når
// listen over enheter eller fiender endrer seg.

export type Proj = (x: number, y: number, z: number) => { x: number; y: number };

const V = new THREE.Vector3();
/** Skala på figurene. */
const FIG = 1.5;
/** Kameraretningen: 30 grader fra siden, 48 grader ned. */
const CAM_DIR = new THREE.Vector3(Math.sin(0.52) * Math.cos(0.84), Math.sin(0.84), Math.cos(0.52) * Math.cos(0.84));
const CENTER = new THREE.Vector3(MAP_W / 2 - 0.8, 0, MAP_D / 2 + 0.2);

/** Punktene som alltid skal synes: kartets hjørner, flyplassen og innkjørselen. */
const FIT = [
    [0, 0], [MAP_W + 0.8, 0], [0, MAP_D], [MAP_W + 0.8, MAP_D], [FLYPLASS[0] - 0.8, FLYPLASS[1] + 0.6], [FLYPLASS[0] - 0.8, FLYPLASS[1] - 2.4],
].map(([x, z]) => new THREE.Vector3(x, 0, z));
/** Plass HUD-en tar øverst og nederst (px). */
const TOP = 78;
const BOTTOM = 112;

export function Camera({ gRef, projRef }: { gRef: React.MutableRefObject<G>; projRef: React.MutableRefObject<Proj | null> }) {
    const cam = useRef<THREE.OrthographicCamera>(null);
    const { size } = useThree();
    const fitted = useRef('');
    const base = useRef(new THREE.Vector3());
    const quat = useRef(new THREE.Quaternion());
    useFrame(() => {
        const c = cam.current;
        if (!c) return;
        const key = `${size.width}x${size.height}`;
        if (fitted.current !== key) {
            // Tilpass zoom og sentrum så hele kartet fyller plassen mellom båndet og butikken.
            fitted.current = key;
            c.position.copy(CENTER).addScaledVector(CAM_DIR, 30);
            c.lookAt(CENTER);
            c.updateMatrixWorld();
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            for (const p of FIT) {
                V.copy(p).applyMatrix4(c.matrixWorldInverse);
                x0 = Math.min(x0, V.x); x1 = Math.max(x1, V.x); y0 = Math.min(y0, V.y); y1 = Math.max(y1, V.y);
            }
            const availH = size.height - TOP - BOTTOM;
            c.zoom = Math.min((size.width - 24) / (x1 - x0), availH / (y1 - y0));
            // Midten av kartet skal ligge midt i den ledige plassen, ikke midt i vinduet.
            const right = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 0);
            const up = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 1);
            const shiftY = (y0 + y1) / 2 + (TOP - BOTTOM) / 2 / c.zoom;
            base.current.copy(c.position).addScaledVector(right, (x0 + x1) / 2).addScaledVector(up, shiftY);
            quat.current.copy(c.quaternion);
        }
        const g = gRef.current;
        const sh = g.shake > 0 ? g.shake * 0.12 : 0;
        // MicroCanvas sikter kameraet mot sitt eget mål én gang; vi holder vår egen retning.
        c.quaternion.copy(quat.current);
        c.position.copy(base.current);
        c.position.x += (Math.random() - 0.5) * sh;
        c.position.y += (Math.random() - 0.5) * sh;
        c.updateProjectionMatrix();
        c.updateMatrixWorld();
        projRef.current = (x, y, z) => {
            V.set(x, y, z).project(c);
            return { x: (V.x * 0.5 + 0.5) * size.width, y: (-V.y * 0.5 + 0.5) * size.height };
        };
    });
    return <OrthographicCamera ref={cam} makeDefault near={0.1} far={100} />;
}

// ---- Kartet --------------------------------------------------------------------
export function Board({
    gRef,
    onPoint,
    onMove,
}: {
    gRef: React.MutableRefObject<G>;
    onPoint: (x: number, z: number) => void;
    onMove: (x: number, z: number) => void;
}) {
    const [slag, setSlag] = useState(0);
    useFrame(() => {
        if (gRef.current.slag !== slag) setSlag(gRef.current.slag);
    });
    const def = SLAG[slag];
    const road = def.vei;
    const tiles = useMemo(() => {
        const out: [number, number, boolean][] = [];
        for (let x = 0; x < MAP_W; x++) for (let z = 0; z < MAP_D; z++) out.push([x + 0.5, z + 0.5, (x + z) % 2 === 0]);
        return out;
    }, []);
    return (
        <group>
            <mesh rotation-x={-Math.PI / 2} position={[MAP_W / 2, -0.02, MAP_D / 2]} onPointerMove={(e: ThreeEvent<PointerEvent>) => onMove(e.point.x, e.point.z)} onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onPoint(e.point.x, e.point.z); }}>
                <planeGeometry args={[MAP_W + 8, MAP_D + 6]} />
                <meshBasicMaterial color={C.papir} />
            </mesh>
            {tiles.map(([x, z, dark]) => (
                <mesh key={`${x},${z}`} rotation-x={-Math.PI / 2} position={[x, -0.01, z]}>
                    <planeGeometry args={[0.96, 0.96]} />
                    <meshBasicMaterial color={dark ? C.mark : C.mark2} />
                </mesh>
            ))}
            {road.slice(1).map((b, i) => {
                const a = road[i];
                const len = Math.hypot(b[0] - a[0], b[1] - a[1]) + 1;
                return (
                    <mesh key={i} rotation-x={-Math.PI / 2} rotation-z={Math.atan2(b[1] - a[1], b[0] - a[0])} position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]}>
                        <planeGeometry args={[len, 1]} />
                        <meshBasicMaterial color={C.vei} />
                    </mesh>
                );
            })}
            {/* Flyplassen */}
            <mesh rotation-x={-Math.PI / 2} position={[FLYPLASS[0] + 0.55, 0, FLYPLASS[1] - 0.7]}>
                <planeGeometry args={[2.4, 3]} />
                <meshBasicMaterial color={C.vei} />
            </mesh>
            <Hq def={def} />
        </group>
    );
}

function Hq({ def }: { def: SlagDef }) {
    const [x, z] = def.hq;
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[0.8, 0.6, 0.6]} />
                <meshBasicMaterial color={C.egen} />
            </mesh>
            <mesh position={[0.25, 1.1, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.2]} />
                <meshBasicMaterial color={C.sot} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
                <ringGeometry args={[RADIO.rekkevidde - 0.06, RADIO.rekkevidde, 64]} />
                <meshBasicMaterial color={C.radio} transparent opacity={0.55} />
            </mesh>
        </group>
    );
}

/** Gyldige ruter mens eleven holder et kort. Tegnes én gang per kort, ikke per musebevegelse. */
export function PlaceHints({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const [cells, setCells] = useState<[number, number][]>([]);
    const key = useRef('');
    useFrame(() => {
        const g = gRef.current;
        const k = g.holding >= 0 && g.phase === 'plan' ? `${g.holding}:${g.shop[g.holding]}:${g.units.length}:${g.slag}` : '';
        if (k === key.current) return;
        key.current = k;
        const out: [number, number][] = [];
        if (k) for (let x = 0; x < MAP_W; x++) for (let z = 0; z < MAP_D; z++) if (canPlace(g, x + 0.5, z + 0.5)) out.push([x + 0.5, z + 0.5]);
        setCells(out);
    });
    return (
        <group>
            {cells.map(([x, z]) => (
                <mesh key={`${x},${z}`} rotation-x={-Math.PI / 2} position={[x, 0.005, z]}>
                    <planeGeometry args={[0.8, 0.8]} />
                    <meshBasicMaterial color={C.radio} transparent opacity={0.28} />
                </mesh>
            ))}
        </group>
    );
}

// ---- Figurer -------------------------------------------------------------------
function Shape({ parts, color }: { parts: Part[]; color: string }) {
    return (
        <>
            {parts.map((p, i) => (
                <mesh key={i} position={p.pos} rotation={p.rot ?? [0, 0, 0]}>
                    <boxGeometry args={p.size} />
                    <meshBasicMaterial color={p.color ?? color} />
                </mesh>
            ))}
        </>
    );
}

function UnitView({ u, gRef, onClick }: { u: Unit; gRef: React.MutableRefObject<G>; onClick: (id: number) => void }) {
    const grp = useRef<THREE.Group>(null);
    const body = useRef<THREE.Group>(null);
    const bar = useRef<THREE.Mesh>(null);
    const shadow = useRef<THREE.Mesh>(null);
    const ring = useRef<THREE.Mesh>(null);
    const air = isAir(u.kind);
    useFrame(() => {
        if (!grp.current || !body.current) return;
        const flying = air && u.mode !== 'bakke';
        grp.current.position.set(air ? u.ax : u.x, 0, air ? u.az : u.z);
        body.current.position.y = flying ? u.alt : 0;
        body.current.rotation.y = air ? u.heading : 0;
        // Figurene tegnes større enn ruta de står på, så de leses på en Chromebook.
        const s = FIG * (1 + u.kick * 0.12);
        body.current.scale.set(s, FIG * (1 - u.kick * 0.08), s);
        if (bar.current) bar.current.scale.x = Math.max(0.01, u.hp / u.maxHp);
        if (shadow.current) shadow.current.visible = flying;
        if (ring.current) {
            ring.current.visible = u.linked || u.linking > 0;
            ring.current.scale.setScalar(u.linking > 0 ? 1.3 : 1);
        }
        grp.current.visible = !u.dead && gRef.current.units.includes(u);
    });
    return (
        <group ref={grp} onClick={(e) => { e.stopPropagation(); onClick(u.id); }}>
            <group ref={body}>
                <Shape parts={UNIT_SHAPE[u.kind]} color={C.egen} />
                {u.copies > 1 &&
                    Array.from({ length: u.copies }, (_, i) => (
                        <mesh key={i} position={[(i - (u.copies - 1) / 2) * 0.2, 0.85, 0]}>
                            <octahedronGeometry args={[u.vet ? 0.12 : 0.07]} />
                            <meshBasicMaterial color={C.radio} />
                        </mesh>
                    ))}
            </group>
            <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
                <ringGeometry args={[0.44, 0.52, 24]} />
                <meshBasicMaterial color={C.radio} />
            </mesh>
            <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
                <circleGeometry args={[0.35, 12]} />
                <meshBasicMaterial color={C.sot} transparent opacity={0.3} />
            </mesh>
            <mesh ref={bar} position={[0, 0.02, 0.5]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[0.8, 0.1]} />
                <meshBasicMaterial color={C.egen} />
            </mesh>
        </group>
    );
}

export function Units({ gRef, onClick }: { gRef: React.MutableRefObject<G>; onClick: (id: number) => void }) {
    const [list, setList] = useState<Unit[]>([]);
    const sig = useRef('');
    useFrame(() => {
        const g = gRef.current;
        const s = g.units.map((u) => `${u.id}.${u.copies}`).join(',');
        if (s !== sig.current) {
            sig.current = s;
            setList([...g.units]);
        }
    });
    return (
        <>
            {list.map((u) => (
                <UnitView key={`${u.id}.${u.copies}`} u={u} gRef={gRef} onClick={onClick} />
            ))}
        </>
    );
}

function EnemyView({ e, gRef }: { e: Enemy; gRef: React.MutableRefObject<G> }) {
    const grp = useRef<THREE.Group>(null);
    const body = useRef<THREE.Group>(null);
    const seen = useRef<THREE.Mesh>(null);
    const bar = useRef<THREE.Mesh>(null);
    const shadow = useRef<THREE.Mesh>(null);
    const fly = e.kind === 'estuka' || e.kind === 'ejag';
    useFrame((st) => {
        if (!grp.current || !body.current) return;
        const g = gRef.current;
        grp.current.visible = !e.dead && !e.passed;
        grp.current.position.set(e.x, 0, e.z);
        body.current.position.y = e.alt;
        body.current.rotation.y = fly ? e.heading : 0;
        const s = FIG * (1 + e.kick * 0.12);
        body.current.scale.set(s, FIG, s);
        const netSees = g.netSeen.has(e.id);
        // Nedgravd panservern som ingen i nettet ser: bare et blaff.
        body.current.visible = !e.dug || netSees || Math.sin(st.clock.elapsedTime * 3) > 0.6;
        if (seen.current) seen.current.visible = netSees;
        if (bar.current) bar.current.scale.x = Math.max(0.01, e.hp / e.maxHp);
        if (shadow.current) shadow.current.visible = fly;
    });
    return (
        <group ref={grp}>
            <group ref={body}>
                <Shape parts={ENEMY_SHAPE[e.kind]} color={C.fiende} />
            </group>
            <mesh ref={seen} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
                <ringGeometry args={[0.36, 0.46, 20]} />
                <meshBasicMaterial color={C.fare} />
            </mesh>
            <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
                <circleGeometry args={[0.3, 12]} />
                <meshBasicMaterial color={C.sot} transparent opacity={0.3} />
            </mesh>
            <mesh ref={bar} position={[0, 0.03, 0.45]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[0.7, 0.09]} />
                <meshBasicMaterial color={C.fare} />
            </mesh>
        </group>
    );
}

export function Enemies({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const [list, setList] = useState<Enemy[]>([]);
    const last = useRef(0);
    useFrame(() => {
        const g = gRef.current;
        const top = g.enemies.length ? g.enemies[g.enemies.length - 1].id : 0;
        if (top !== last.current || (g.enemies.length === 0 && list.length)) {
            last.current = top;
            setList([...g.enemies]);
        }
    });
    return (
        <>
            {list.map((e) => (
                <EnemyView key={e.id} e={e} gRef={gRef} />
            ))}
        </>
    );
}

// ---- Radiolinjer, skudd og smell -------------------------------------------------------
const MAX_SEG = 400;

export function Lines({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 6), 3));
        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 6), 3));
        return g;
    }, []);
    const radio = useMemo(() => new THREE.Color(C.radio), []);
    const egen = useMemo(() => new THREE.Color('#fff3c4'), []);
    const fiende = useMemo(() => new THREE.Color(C.fare), []);
    useFrame((st) => {
        const g = gRef.current;
        const pos = geo.attributes.position.array as Float32Array;
        const col = geo.attributes.color.array as Float32Array;
        let n = 0;
        const seg = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, c: THREE.Color) => {
            if (n >= MAX_SEG) return;
            pos.set([ax, ay, az, bx, by, bz], n * 6);
            col.set([c.r, c.g, c.b, c.r, c.g, c.b], n * 6);
            n++;
        };
        const [hx, hz] = slagDef(g).hq;
        for (const u of g.units) {
            if (u.dead || !(u.linked || u.linking > 0)) continue;
            const air = isAir(u.kind);
            const tx = air ? u.ax : u.x;
            const tz = air ? u.az : u.z;
            const ty = air && u.mode !== 'bakke' ? u.alt : 0.4;
            // Linja som kobles opp, tegnes stiplet.
            const parts = u.linking > 0 ? 8 : 1;
            for (let i = 0; i < parts; i++) {
                if (u.linking > 0 && (i + Math.floor(st.clock.elapsedTime * 8)) % 2) continue;
                const a = i / parts;
                const b = (i + 1) / parts;
                seg(hx + (tx - hx) * a, 1.3 + (ty - 1.3) * a, hz + (tz - hz) * a, hx + (tx - hx) * b, 1.3 + (ty - 1.3) * b, hz + (tz - hz) * b, radio);
            }
        }
        for (const f of g.fx) if (f.kind === 'skudd') seg(f.x, 0.35, f.z, f.x2, Math.max(0.35, f.alt), f.z2, f.fiende ? fiende : egen);
        geo.setDrawRange(0, n * 2);
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
    });
    return (
        <lineSegments geometry={geo} frustumCulled={false}>
            <lineBasicMaterial vertexColors />
        </lineSegments>
    );
}

const MAX_BOOM = 40;

export function Booms({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(() => {
        const g = gRef.current;
        let i = 0;
        for (const f of g.fx) {
            if (f.kind === 'skudd' || i >= MAX_BOOM) continue;
            const m = refs.current[i++];
            if (!m) continue;
            const k = f.t / f.life;
            m.visible = true;
            m.position.set(f.x, f.alt + 0.2, f.z);
            const r = f.kind === 'kutt' ? 0.6 : f.kind === 'granat' ? 0.9 : 0.6;
            m.scale.setScalar(r * (0.4 + k));
            const mat = m.material as THREE.MeshBasicMaterial;
            mat.color.set(f.kind === 'kutt' ? C.fare : k < 0.3 ? C.radio : C.røyk);
            mat.opacity = 1 - k;
        }
        for (; i < MAX_BOOM; i++) if (refs.current[i]) refs.current[i]!.visible = false;
    });
    return (
        <>
            {Array.from({ length: MAX_BOOM }, (_, i) => (
                <mesh key={i} ref={(m) => (refs.current[i] = m)} visible={false}>
                    <sphereGeometry args={[0.5, 10, 8]} />
                    <meshBasicMaterial transparent depthWrite={false} />
                </mesh>
            ))}
        </>
    );
}

/** Kortet eleven holder, under musepekeren. Flyttes i useFrame, aldri med state. */
export function Ghost({ gRef, pointer }: { gRef: React.MutableRefObject<G>; pointer: React.MutableRefObject<[number, number]> }) {
    const m = useRef<THREE.Mesh>(null);
    useFrame(() => {
        const g = gRef.current;
        const k = g.holding >= 0 ? g.shop[g.holding] : null;
        if (!m.current) return;
        const [x, z] = pointer.current;
        m.current.visible = !!k && !isAir(k) && g.phase === 'plan' && x >= 0 && z >= 0 && x < MAP_W && z < MAP_D;
        m.current.position.set(Math.floor(x) + 0.5, 0.02, Math.floor(z) + 0.5);
        (m.current.material as THREE.MeshBasicMaterial).color.set(canPlace(g, x, z) ? C.egen : C.fare);
    });
    return (
        <mesh ref={m} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial transparent opacity={0.6} />
        </mesh>
    );
}
