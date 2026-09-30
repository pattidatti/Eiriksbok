import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { RADIO, UNITS } from './tuning';
import { MAP_D, MAP_W, FLYPLASS } from './levels';
import { canPlace, isAir, slagDef, type G, type Unit, type Enemy } from './game';
import { C, UNIT_MODEL, UNIT_TOP_MODEL, ENEMY_MODEL, ENEMY_TOP_MODEL, WRECK, type Model } from './models';
import type { FxPool } from './fxPool';

// Visningen av enhetene: trykte figurer med sotkontur på et ortografisk kart.
// Alt leser spilltilstanden fra gRef i useFrame; React tegner bare på nytt når
// listen over enheter eller fiender endrer seg. Kartet og pynten: terrain.tsx.

export type Proj = (x: number, y: number, z: number) => { x: number; y: number };
/** Hvor fort visningen går (0 i pause, sakte film under lærings-øyeblikk). */
export type Speed = React.MutableRefObject<number>;

const V = new THREE.Vector3();
/** Skala på figurene. Fly tegnes større, så rundellene og korsene leses ovenfra. */
const FIG = 1.5;
const AIR_FIG = 1.9;
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

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const DIR = new THREE.Vector3();
const COL = new THREE.Color();
const FLAT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

/** Gyldige ruter mens eleven holder et kort. Tegnes én gang per kort, ikke per musebevegelse. */
export function PlaceHints({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const key = useRef('');
    const inRange = useMemo(() => new THREE.Color(C.radio), []);
    const out = useMemo(() => new THREE.Color('#b9b3a0'), []);
    useLayoutEffect(() => {
        ref.current?.setColorAt(0, inRange);
    }, [inRange]);
    useFrame(() => {
        const g = gRef.current;
        const m = ref.current;
        if (!m) return;
        const k = g.holding >= 0 && g.phase === 'plan' ? `${g.holding}:${g.shop[g.holding]}:${g.units.length}:${g.slag}` : '';
        if (k === key.current) return;
        key.current = k;
        // Gult innenfor radioens rekkevidde, grått utenfor (lov, men kan ikke kobles).
        const [hx, hz] = slagDef(g).hq;
        let n = 0;
        if (k)
            for (let x = 0; x < MAP_W; x++)
                for (let z = 0; z < MAP_D; z++)
                    if (canPlace(g, x + 0.5, z + 0.5)) {
                        M.compose(P.set(x + 0.5, 0.01, z + 0.5), FLAT, S.set(0.78, 0.78, 1));
                        m.setMatrixAt(n, M);
                        m.setColorAt(n, Math.hypot(x + 0.5 - hx, z + 0.5 - hz) <= RADIO.rekkevidde ? inRange : out);
                        n++;
                    }
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, MAP_W * MAP_D]} frustumCulled={false}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial transparent opacity={0.5} depthWrite={false} toneMapped={false} />
        </instancedMesh>
    );
}

// ---- Figurer -------------------------------------------------------------------
const INK = <meshBasicMaterial vertexColors toneMapped={false} />;
const OUTLINE = <meshBasicMaterial color={C.sot} side={THREE.BackSide} toneMapped={false} />;

function Figure({ m }: { m: Model }) {
    return (
        <group>
            <mesh geometry={m.body}>{INK}</mesh>
            <mesh geometry={m.hull}>{OUTLINE}</mesh>
        </group>
    );
}

/** Nærmeste levende fiende innen rekkevidde (bare for å dreie tårnet). */
function aimAt(g: G, x: number, z: number, range: number, air: boolean) {
    let best: Enemy | null = null;
    let bd = range * range;
    for (const e of g.enemies) {
        if (e.dead || e.passed) continue;
        const fly = e.kind === 'estuka' || e.kind === 'ejag';
        if (fly !== air) continue;
        const d = (e.x - x) ** 2 + (e.z - z) ** 2;
        if (d < bd) {
            bd = d;
            best = e;
        }
    }
    return best;
}

function turn(cur: number, target: number, k: number) {
    let d = target - cur;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return cur + d * Math.min(1, k);
}

function UnitView({ u, gRef, onClick, fxRef, speedRef }: { u: Unit; gRef: React.MutableRefObject<G>; onClick: (id: number) => void; fxRef: React.MutableRefObject<FxPool>; speedRef: Speed }) {
    const grp = useRef<THREE.Group>(null);
    const body = useRef<THREE.Group>(null);
    const top = useRef<THREE.Group>(null);
    const wreck = useRef<THREE.Group>(null);
    const bar = useRef<THREE.Mesh>(null);
    const ring = useRef<THREE.Mesh>(null);
    const st = useRef({ yaw: 0, aim: 0, lastKick: 0, deadT: -1, roll: 0, pitch: 0, lastH: 0, lastAlt: 0, fx: 0, fz: 0, fy: 0, vy: 0 });
    const air = isAir(u.kind);
    const topModel = UNIT_TOP_MODEL[u.kind];
    useFrame((_, raw) => {
        if (!grp.current || !body.current) return;
        const dt = Math.min(0.05, raw) * speedRef.current;
        const fx = fxRef.current;
        const g = gRef.current;
        const s = st.current;
        const flying = air && u.mode !== 'bakke';
        const inList = g.units.includes(u);
        grp.current.visible = inList;
        if (!inList) return;
        // Døde enheter: vogner blir vrak som brenner, fly styrter, resten forsvinner.
        if (u.dead) {
            if (s.deadT < 0) {
                s.deadT = 0;
                s.fx = air ? u.ax : u.x;
                s.fz = air ? u.az : u.z;
                s.fy = flying ? u.alt : 0;
            }
            s.deadT += dt;
            if (air && s.fy > 0) {
                s.vy += dt * 5;
                s.fy -= s.vy * dt;
                s.fx += Math.sin(u.heading) * dt * 1.6;
                s.fz += Math.cos(u.heading) * dt * 1.6;
                s.roll += dt * 7;
                if (Math.random() < 0.6) fx.puff('sot', s.fx, s.fy, s.fz, { r: 0.14, grow: 2.4, life: 1.4, up: 0.2, spread: 0.2 });
                if (s.fy <= 0) fx.boom(s.fx, 0, s.fz, 1);
                grp.current.position.set(s.fx, 0, s.fz);
                body.current.position.y = Math.max(0, s.fy);
                body.current.rotation.set(s.roll, u.heading - Math.PI / 2, -0.6, 'YZX');
                body.current.visible = s.fy > 0;
            } else {
                body.current.visible = false;
                if (wreck.current) wreck.current.visible = u.kind === 'vogn' || u.kind === 'art' || u.kind === 'pv';
                if (wreck.current?.visible && s.deadT < 7 && Math.random() < dt * 9) fx.burn(s.fx, s.fz, 1 - s.deadT / 7);
            }
            if (ring.current) ring.current.visible = false;
            if (bar.current) bar.current.visible = false;
            return;
        }
        if (wreck.current) wreck.current.visible = false;
        body.current.visible = true;
        grp.current.position.set(air ? u.ax : u.x, 0, air ? u.az : u.z);
        body.current.position.y = flying ? u.alt : 0;
        if (air) {
            // Flyene krenger i svingene og stiger med nesa opp.
            const turnRate = turn(0, u.heading - s.lastH, 1) / Math.max(1e-3, dt);
            s.roll += (THREE.MathUtils.clamp(-turnRate * 0.25, -0.8, 0.8) - s.roll) * Math.min(1, dt * 4);
            const climb = (u.alt - s.lastAlt) / Math.max(1e-3, dt);
            s.pitch += (THREE.MathUtils.clamp(climb * 0.2, -0.6, 0.5) - s.pitch) * Math.min(1, dt * 4);
            s.lastH = u.heading;
            s.lastAlt = u.alt;
            body.current.rotation.set(flying ? s.roll : 0, u.heading - Math.PI / 2, flying ? s.pitch : 0, 'YZX');
        } else {
            // Tårnet og løpet dreier mot fienden; skuddet rister hele figuren.
            const tgt = aimAt(g, u.x, u.z, UNITS[u.kind].range + 0.5, u.kind === 'lv');
            if (tgt) s.aim = Math.atan2(-(tgt.z - u.z), tgt.x - u.x);
            s.yaw = turn(s.yaw, s.aim, dt * 5);
            const whole = u.kind !== 'vogn';
            body.current.rotation.set(0, whole ? s.yaw : 0, u.kick * 0.08);
            if (top.current) {
                top.current.rotation.y = whole ? 0 : s.yaw;
                top.current.position.x = -u.kick * 0.1 * Math.cos(top.current.rotation.y);
                top.current.position.z = u.kick * 0.1 * Math.sin(top.current.rotation.y);
            }
            if (u.kind === 'art' && u.kick > 0.9 && s.lastKick < 0.9) {
                // Artilleriet har ikke sporlys: flammen og røykringen er skuddet.
                const tip = FIG * 0.62;
                fx.flash(u.x + Math.cos(s.yaw) * tip, 0.7, u.z - Math.sin(s.yaw) * tip, 0.34);
                for (let i = 0; i < 3; i++) fx.puff('røyk', u.x, 0.2, u.z, { r: 0.18, grow: 2.2, life: 1.2, up: 0.2, spread: 1.2 });
            }
        }
        s.lastKick = u.kick;
        const f = air ? AIR_FIG : FIG;
        const sc = f * (1 + u.kick * 0.06);
        body.current.scale.set(sc, f * (1 - u.kick * 0.05), sc);
        if (bar.current) {
            bar.current.visible = u.hp < u.maxHp;
            bar.current.scale.x = Math.max(0.01, u.hp / u.maxHp);
        }
        if (ring.current) {
            ring.current.visible = !air && (u.linked || u.linking > 0);
            ring.current.scale.setScalar(u.linking > 0 ? 1.25 : 1);
        }
    });
    return (
        <group ref={grp} onClick={(e) => { e.stopPropagation(); onClick(u.id); }}>
            {/* Usynlig klikkflate: hele ruta, ikke bare de små figurene. */}
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.95, 0.8, 0.95]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
                <ringGeometry args={[0.44, 0.54, 24]} />
                <meshBasicMaterial color={C.radio} toneMapped={false} />
            </mesh>
            <group ref={body}>
                <Figure m={UNIT_MODEL[u.kind]} />
                {topModel && (
                    <group ref={top}>
                        <Figure m={topModel} />
                    </group>
                )}
                {u.copies > 1 &&
                    Array.from({ length: u.copies }, (_, i) => (
                        <mesh key={i} position={[0, 0.72, (i - (u.copies - 1) / 2) * 0.2]}>
                            <octahedronGeometry args={[u.vet ? 0.1 : 0.06]} />
                            <meshBasicMaterial color={C.radio} toneMapped={false} />
                        </mesh>
                    ))}
            </group>
            <group ref={wreck} visible={false} scale={FIG}>
                <Figure m={WRECK} />
            </group>
            <mesh ref={bar} position={[0, 0.03, 0.55]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[0.8, 0.1]} />
                <meshBasicMaterial color={C.egen} toneMapped={false} />
            </mesh>
        </group>
    );
}

export function Units({ gRef, onClick, fxRef, speedRef }: { gRef: React.MutableRefObject<G>; onClick: (id: number) => void; fxRef: React.MutableRefObject<FxPool>; speedRef: Speed }) {
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
                <UnitView key={`${u.id}.${u.copies}`} u={u} gRef={gRef} onClick={onClick} fxRef={fxRef} speedRef={speedRef} />
            ))}
        </>
    );
}

function EnemyView({ e, gRef, fxRef, speedRef, onDive }: { e: Enemy; gRef: React.MutableRefObject<G>; fxRef: React.MutableRefObject<FxPool>; speedRef: Speed; onDive: () => void }) {
    const grp = useRef<THREE.Group>(null);
    const body = useRef<THREE.Group>(null);
    const top = useRef<THREE.Group>(null);
    const wreck = useRef<THREE.Group>(null);
    const seen = useRef<THREE.Mesh>(null);
    const bar = useRef<THREE.Mesh>(null);
    const fly = e.kind === 'estuka' || e.kind === 'ejag';
    const heavy = e.kind === 'evogn' || e.kind === 'epak';
    const st = useRef({ yaw: Math.PI, px: e.x, pz: e.z, deadT: -1, fx: 0, fy: 0, fz: 0, vy: 0, roll: 0, lastH: e.heading, bank: 0, phase: e.phase, dust: 0, t: e.id * 1.7 });
    const topModel = ENEMY_TOP_MODEL[e.kind];
    useFrame((clock, raw) => {
        if (!grp.current || !body.current) return;
        const dt = Math.min(0.05, raw) * speedRef.current;
        const fx = fxRef.current;
        const g = gRef.current;
        const s = st.current;
        s.t += dt;
        if (e.passed) {
            grp.current.visible = false;
            return;
        }
        grp.current.visible = true;
        if (e.dead) {
            if (s.deadT < 0) {
                s.deadT = 0;
                s.fx = e.x;
                s.fz = e.z;
                s.fy = e.alt;
            }
            s.deadT += dt;
            if (seen.current) seen.current.visible = false;
            if (bar.current) bar.current.visible = false;
            if (fly && s.fy > 0) {
                // Flyet går i spinn og styrter med en røykstripe etter seg.
                s.vy += dt * 5;
                s.fy -= s.vy * dt;
                s.fx += Math.sin(e.heading) * dt * 2.2;
                s.fz += Math.cos(e.heading) * dt * 2.2;
                s.roll += dt * 8;
                if (Math.random() < 0.7) fx.puff('sot', s.fx, s.fy, s.fz, { r: 0.14, grow: 2.6, life: 1.5, up: 0.2, spread: 0.2 });
                if (s.fy <= 0) fx.boom(s.fx, 0, s.fz, 1.1);
                grp.current.position.set(s.fx, 0, s.fz);
                body.current.position.y = Math.max(0, s.fy);
                body.current.rotation.set(s.roll, e.heading - Math.PI / 2, -0.7, 'YZX');
                body.current.visible = s.fy > 0;
                return;
            }
            body.current.visible = false;
            if (wreck.current) wreck.current.visible = heavy;
            if (heavy && s.deadT < 8 && Math.random() < dt * 9) fx.burn(s.fx, s.fz, 1 - s.deadT / 8);
            return;
        }
        body.current.visible = true;
        if (wreck.current) wreck.current.visible = false;
        grp.current.position.set(e.x, 0, e.z);
        body.current.position.y = e.alt;
        if (fly) {
            const tr = turn(0, e.heading - s.lastH, 1) / Math.max(1e-3, dt);
            s.bank += (THREE.MathUtils.clamp(-tr * 0.25, -0.8, 0.8) - s.bank) * Math.min(1, dt * 4);
            s.lastH = e.heading;
            // Stupbomberen stuper med nesa rett ned.
            const dive = e.kind === 'estuka' && e.phase === 'stup' ? -1.0 : e.phase === 'ut' ? 0.35 : 0;
            body.current.rotation.set(s.bank, e.heading - Math.PI / 2, dive, 'YZX');
            if (e.phase === 'stup' && s.phase !== 'stup') onDive();
            s.phase = e.phase;
        } else {
            // Bakkefiender ser dit de kjører; vogner gynger og virvler opp støv.
            const dx = e.x - s.px;
            const dz = e.z - s.pz;
            if (dx * dx + dz * dz > 1e-6) s.yaw = turn(s.yaw, Math.atan2(-dz, dx), dt * 6);
            const moving = dx * dx + dz * dz > 1e-7;
            s.px = e.x;
            s.pz = e.z;
            let aim = s.yaw;
            if (topModel && top.current) {
                const tgt = g.units.find((u) => !u.dead && !isAir(u.kind) && (u.x - e.x) ** 2 + (u.z - e.z) ** 2 < 12);
                if (tgt) aim = Math.atan2(-(tgt.z - e.z), tgt.x - e.x);
                top.current.rotation.y = turn(top.current.rotation.y, aim - s.yaw, dt * 4);
                top.current.position.x = -e.kick * 0.08;
            }
            const bob = e.kind === 'einf' ? Math.abs(Math.sin(s.t * 8)) * 0.04 : moving ? Math.sin(s.t * 14) * 0.012 : 0;
            body.current.position.y = bob;
            body.current.rotation.set(0, s.yaw, moving && e.kind === 'evogn' ? Math.sin(s.t * 3) * 0.03 + e.kick * 0.07 : e.kick * 0.07);
            if (moving && e.kind === 'evogn' && (s.dust += dt) > 0.25) {
                s.dust = 0;
                fx.puff('støv', e.x - Math.cos(s.yaw) * 0.6, 0.1, e.z + Math.sin(s.yaw) * 0.6, { r: 0.12, grow: 2.4, life: 0.9, up: 0.25, spread: 0.3 });
            }
        }
        const f = fly ? AIR_FIG : FIG;
        const sc = f * (1 + e.kick * 0.05);
        body.current.scale.set(sc, f, sc);
        const netSees = g.netSeen.has(e.id);
        // Nedgravd panservern som ingen i nettet ser: bare et blaff.
        if (e.dug && !netSees) body.current.visible = Math.sin(clock.clock.elapsedTime * 3) > 0.6;
        if (seen.current) seen.current.visible = netSees;
        if (bar.current) {
            bar.current.visible = e.hp < e.maxHp;
            bar.current.scale.x = Math.max(0.01, e.hp / e.maxHp);
        }
    });
    return (
        <group ref={grp}>
            <group ref={body}>
                <Figure m={ENEMY_MODEL[e.kind]} />
                {topModel && (
                    <group ref={top}>
                        <Figure m={topModel} />
                    </group>
                )}
            </group>
            {heavy && (
                <group ref={wreck} visible={false} scale={FIG}>
                    <Figure m={WRECK} />
                </group>
            )}
            <mesh ref={seen} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
                <ringGeometry args={[0.4, 0.5, 20]} />
                <meshBasicMaterial color={C.fare} toneMapped={false} />
            </mesh>
            <mesh ref={bar} position={[0, 0.03, 0.5]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[0.7, 0.09]} />
                <meshBasicMaterial color={C.fare} toneMapped={false} />
            </mesh>
        </group>
    );
}

export function Enemies({ gRef, fxRef, speedRef, onDive }: { gRef: React.MutableRefObject<G>; fxRef: React.MutableRefObject<FxPool>; speedRef: Speed; onDive: () => void }) {
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
                <EnemyView key={e.id} e={e} gRef={gRef} fxRef={fxRef} speedRef={speedRef} onDive={onDive} />
            ))}
        </>
    );
}

/** Flyskygger: trykte ovaler rett under flyene (ett draw call). */
export function AirShadows({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        const g = gRef.current;
        let n = 0;
        const put = (x: number, z: number, alt: number, r: number) => {
            if (n >= 40 || alt <= 0.05) return;
            const k = r * (1 - Math.min(0.4, alt * 0.08));
            M.compose(P.set(x, 0.015, z), FLAT, S.set(k, k * 0.7, 1));
            m.setMatrixAt(n++, M);
        };
        for (const u of g.units) if (isAir(u.kind) && !u.dead && u.mode !== 'bakke') put(u.ax, u.az, u.alt, u.kind === 'bomb' ? 1.6 : 1.1);
        for (const e of g.enemies) if (!e.dead && !e.passed && e.alt > 0) put(e.x, e.z, e.alt, 1.1);
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, 40]} frustumCulled={false}>
            <circleGeometry args={[0.5, 10]} />
            <meshBasicMaterial color={C.sot} transparent opacity={0.28} depthWrite={false} toneMapped={false} />
        </instancedMesh>
    );
}

// ---- Radiolinjer og sporlys -------------------------------------------------------
const MAX_SEG = 200;
const MAX_DASH = 260;

/** Radiolinjene er stiplede bånd som «sender» ut fra antennen; de lyser opp når enheten skyter. */
export function Lines({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const dashRef = useRef<THREE.InstancedMesh>(null);
    const lineRef = useRef<THREE.LineSegments>(null);
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 6), 3));
        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 6), 3));
        return g;
    }, []);
    const radio = useMemo(() => new THREE.Color(C.radio), []);
    const hot = useMemo(() => new THREE.Color('#fff3c4'), []);
    const egen = useMemo(() => new THREE.Color('#fff3c4'), []);
    const fiende = useMemo(() => new THREE.Color(C.fare), []);
    useLayoutEffect(() => {
        dashRef.current?.setColorAt(0, radio);
    }, [radio]);
    useFrame((st) => {
        const g = gRef.current;
        const dm = dashRef.current;
        if (!dm) return;
        const [hx, hz] = slagDef(g).hq;
        const ay = 2.9;
        const ax = hx - 0.42;
        const az = hz + 0.14;
        const time = st.clock.elapsedTime;
        let n = 0;
        for (const u of g.units) {
            if (u.dead || !(u.linked || u.linking > 0)) continue;
            const air = isAir(u.kind);
            const tx = air ? u.ax : u.x;
            const tz = air ? u.az : u.z;
            const ty = air && u.mode !== 'bakke' ? u.alt + 0.3 : 0.9;
            DIR.set(tx - ax, ty - ay, tz - az);
            const len = DIR.length();
            DIR.divideScalar(len);
            Q.setFromUnitVectors(UP, DIR);
            // Linja som kobles opp, vokser ut fra antennen.
            const reach = u.linking > 0 ? len * (1 - u.linking / RADIO.koble) : len;
            const dash = 0.34;
            const off = (time * 1.4) % dash;
            const w = 0.07 * (1 + u.kick * 1.3);
            COL.copy(u.kick > 0.3 ? hot : radio);
            for (let d = off - dash; d < reach && n < MAX_DASH; d += dash) {
                const a = Math.max(0, d);
                const b = Math.min(reach, d + dash * 0.62);
                if (b <= a) continue;
                const mid = (a + b) / 2;
                M.compose(P.set(ax + DIR.x * mid, ay + DIR.y * mid, az + DIR.z * mid), Q, S.set(w, b - a, w));
                dm.setMatrixAt(n, M);
                dm.setColorAt(n, COL);
                n++;
            }
        }
        dm.count = n;
        dm.instanceMatrix.needsUpdate = true;
        if (dm.instanceColor) dm.instanceColor.needsUpdate = true;

        const lg = lineRef.current?.geometry;
        if (!lg) return;
        const pos = lg.attributes.position.array as Float32Array;
        const col = lg.attributes.color.array as Float32Array;
        let k = 0;
        for (const f of g.fx) {
            if (f.kind !== 'skudd' || k >= MAX_SEG) continue;
            // Sporlyset er en kort strek som farer fra løpet til målet.
            const t = Math.min(1, f.t / f.life);
            const t0 = Math.max(0, t - 0.45);
            const y0 = 0.4;
            const y1 = Math.max(0.35, f.alt);
            pos.set([f.x + (f.x2 - f.x) * t0, y0 + (y1 - y0) * t0, f.z + (f.z2 - f.z) * t0, f.x + (f.x2 - f.x) * t, y0 + (y1 - y0) * t, f.z + (f.z2 - f.z) * t], k * 6);
            const c = f.fiende ? fiende : egen;
            col.set([c.r, c.g, c.b, c.r, c.g, c.b], k * 6);
            k++;
        }
        lg.setDrawRange(0, k * 2);
        lg.attributes.position.needsUpdate = true;
        lg.attributes.color.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={dashRef} args={[undefined, undefined, MAX_DASH]} frustumCulled={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial toneMapped={false} />
            </instancedMesh>
            <lineSegments ref={lineRef} geometry={geo} frustumCulled={false}>
                <lineBasicMaterial vertexColors toneMapped={false} />
            </lineSegments>
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
            <meshBasicMaterial transparent opacity={0.6} toneMapped={false} />
        </mesh>
    );
}
