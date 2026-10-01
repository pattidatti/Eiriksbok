import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { RADIO, UNITS } from './tuning';
import { MAP_D, MAP_W, FLYPLASS } from './levels';
import { canPlace, isAir, reachable, slagDef, unitAt, usedChannels, type G, type Unit, type Enemy } from './game';
import { C, LOOK, modelsFor, wreck, propeller, figureMaterial, figureMaterialHi, figureMaterialHit, PROPS, type Look, type Model } from './models';
import type { FxPool } from './fxPool';
import { rankMaterial } from './rank';
import { cineDepth, type Cine } from './cine';
import { hlOn, unitYaw, enemyYaw, type Hl } from './hl';
import { MARKS, setTiles, lift, tilt } from './ground';

// Visningen av enhetene: detaljerte figurer i ekte lys på et ortografisk kart.
// Alt leser spilltilstanden fra gRef i useFrame; React tegner bare på nytt når
// listen over enheter eller fiender endrer seg. Kartet og pynten: terrain.tsx,
// ringene og skyggene på bakken: markers.tsx.

export type Proj = (x: number, y: number, z: number) => { x: number; y: number };

/** Hvor fort visningen går (0 i pause, sakte film under lærings-øyeblikk). */
export type Speed = React.MutableRefObject<number>;

const V = new THREE.Vector3();
const lookOf = (g: G): Look => LOOK[slagDef(g).id] ?? 'kyst';
/** Skala på figurene. Fly tegnes større, så rundellene og korsene leses ovenfra. */
const FIG = 1.4;
const AIR_FIG = 1.75;
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

const UP = new THREE.Vector3(0, 1, 0);
const YAW = new THREE.Quaternion();
const PIV = new THREE.Vector3();

export function Camera({ gRef, projRef, cineRef, speedRef, vigRef }: { gRef: React.MutableRefObject<G>; projRef: React.MutableRefObject<Proj | null>; cineRef: React.MutableRefObject<Cine>; speedRef: Speed; vigRef: React.RefObject<HTMLDivElement | null> }) {
    const cam = useRef<THREE.OrthographicCamera>(null);
    const { size } = useThree();
    const fitted = useRef('');
    const base = useRef(new THREE.Vector3());
    const quat = useRef(new THREE.Quaternion());
    const zoom0 = useRef(1);
    /** Kinokameraet: zoom, punktet det følger og svaiet, alle glidende. */
    const cv = useRef({ zoom: 1, x: CENTER.x, z: CENTER.z, sway: 0, t: 0 });
    useFrame((_, raw) => {
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
            zoom0.current = Math.min((size.width - 24) / (x1 - x0), availH / (y1 - y0));
            c.zoom = zoom0.current;
            // Midten av kartet skal ligge midt i den ledige plassen, ikke midt i vinduet.
            const right = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 0);
            const up = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 1);
            const shiftY = (y0 + y1) / 2 + (TOP - BOTTOM) / 2 / c.zoom;
            base.current.copy(c.position).addScaledVector(right, (x0 + x1) / 2).addScaledVector(up, shiftY);
            quat.current.copy(c.quaternion);
        }
        const g = gRef.current;
        const ci = cineRef.current;
        const k = cv.current;
        const real = Math.min(0.05, raw);
        const running = speedRef.current > 0;
        if (running && ci.slow > 0) ci.slow = Math.max(0, ci.slow - real);
        // Et kort i hånda eller sperreild: eleven trenger hele kartet med en gang.
        if (g.holding >= 0 || g.sperreArmed) ci.slow = 0;
        const deep = cineDepth(ci);
        // Planleggingen, et kort i hånda eller sperreild: hele kartet. Ellers følger kameraet kampen.
        const tactical = g.phase !== 'wave' || g.holding >= 0 || g.sperreArmed;
        let fx = CENTER.x, fz = CENTER.z, want = 1;
        if (!tactical) {
            let n = 0, sx = 0, sz = 0;
            for (const e of g.enemies)
                if (!e.dead && e.x > 0 && e.x < MAP_W && e.z > 0 && e.z < MAP_D) {
                    sx += e.x;
                    sz += e.z;
                    n++;
                }
            if (n) {
                fx = CENTER.x + (sx / n - CENTER.x) * 0.75;
                fz = CENTER.z + (sz / n - CENTER.z) * 0.75;
            }
            want = 1.2;
        }
        if (deep > 0) {
            fx += (ci.x - fx) * deep;
            fz += (ci.z - fz) * deep;
            want += 0.5 * deep;
        }
        const ease = (r: number) => 1 - Math.exp(-real * r);
        const fast = deep > 0 ? 7 : 1;
        k.zoom += (want - k.zoom) * ease(fast * 1.1);
        k.x += (fx - k.x) * ease(fast * 0.9);
        k.z += (fz - k.z) * ease(fast * 0.9);
        k.t += real;
        k.sway += ((tactical ? 0 : Math.sin(k.t * 0.17) * 0.06) - k.sway) * ease(0.8);
        // Panoreringen holdes innenfor kartet: jo nærmere, jo lenger kan den gå.
        const pan = 1 - 1 / k.zoom;
        const ox = (k.x - CENTER.x) * pan;
        const oz = (k.z - CENTER.z) * pan;
        const sh = g.shake > 0 ? g.shake * 0.12 : 0;
        // MicroCanvas sikter kameraet mot sitt eget mål én gang; vi holder vår egen retning.
        YAW.setFromAxisAngle(UP, k.sway);
        c.quaternion.copy(YAW).multiply(quat.current);
        PIV.set(CENTER.x + ox, 0, CENTER.z + oz);
        c.position.copy(base.current);
        c.position.x += ox;
        c.position.z += oz;
        c.position.sub(PIV).applyQuaternion(YAW).add(PIV);
        c.position.x += (Math.random() - 0.5) * sh;
        c.position.y += (Math.random() - 0.5) * sh;
        c.zoom = zoom0.current * k.zoom;
        c.updateProjectionMatrix();
        c.updateMatrixWorld();
        if (vigRef.current) vigRef.current.style.opacity = String(Math.min(1, deep * 0.9 + (k.zoom - 1) * 0.35));
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
const DIR = new THREE.Vector3();
const COL = new THREE.Color();

/** Gyldige ruter mens eleven holder et kort, tegnet i bakken (ground.ts). Skrives én gang per
 *  kort, ikke per musebevegelse. Gult der radioen når; grått der bare fallskjermsoldater kan hoppe. */
export function PlaceHints({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const key = useRef('');
    useFrame(() => {
        const g = gRef.current;
        // Nøkkelen endres når kortet, hæren eller nettet endres (stafetten flytter grensen).
        const k = g.holding >= 0 && g.phase === 'plan' ? `${g.holding}:${g.shop[g.holding]}:${g.units.length}:${g.slag}:${usedChannels(g)}:${g.units.filter((u) => u.linked).length}` : '';
        if (k === key.current) return;
        key.current = k;
        MARKS.uTileOn.value = k ? 1 : 0;
        if (k)
            setTiles((x, z) => {
                if (!canPlace(g, x + 0.5, z + 0.5)) return 0;
                if (unitAt(g, x + 0.5, z + 0.5)) return 3;
                return reachable(g, x + 0.5, z + 0.5) ? 1 : 2;
            });
    });
    return null;
}

// ---- Figurer -------------------------------------------------------------------
/** Fly kaster ikke skygge fra lufta: skyggen rett under (markers.tsx) viser hvor de er. */
function Figure({ m, shadow = true }: { m: Model; shadow?: boolean }) {
    return <mesh geometry={m} material={figureMaterial()} castShadow={shadow} receiveShadow />;
}

/** Propellene: egne mesher som snurrer. */
function Props({ kind, pRef }: { kind: keyof typeof PROPS; pRef: React.RefObject<THREE.Group | null> }) {
    const at = PROPS[kind];
    if (!at) return null;
    return (
        <group ref={pRef}>
            {at.map(([z, x], i) => (
                <mesh key={i} geometry={propeller()} material={figureMaterial()} position={[x, 0, z]} />
            ))}
        </group>
    );
}

function spin(g: THREE.Group | null, dt: number, fast: boolean) {
    if (g) for (const c of g.children) c.rotation.x += dt * (fast ? 46 : 4);
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

/** Bytter materialet på figurens deler: 0 vanlig, 1 markert (lysere), 2 truffet (blinker). */
function paint(g: THREE.Object3D, mode: number) {
    const all = [figureMaterial(), figureMaterialHi(), figureMaterialHit()];
    const m = all[mode];
    g.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && mesh.material !== m && all.includes(mesh.material as THREE.MeshStandardMaterial)) mesh.material = m;
    });
}

/** Treffet: blink, et lite rykk og en klem. Returnerer hvor sterkt (0-1) det er nå. */
function hitPulse(s: { hitT: number; lastHp: number }, hp: number, dt: number) {
    if (hp < s.lastHp - 1e-3) s.hitT = HIT_T;
    s.lastHp = hp;
    s.hitT = Math.max(0, s.hitT - dt);
    return s.hitT / HIT_T;
}
const HIT_T = 0.14;

function UnitView({ u, look, gRef, onClick, fxRef, speedRef, hlRef }: { u: Unit; look: Look; gRef: React.MutableRefObject<G>; onClick: (id: number) => void; fxRef: React.MutableRefObject<FxPool>; speedRef: Speed; hlRef: React.MutableRefObject<Hl> }) {
    const grp = useRef<THREE.Group>(null);
    const body = useRef<THREE.Group>(null);
    const top = useRef<THREE.Group>(null);
    const wreckRef = useRef<THREE.Group>(null);
    const bar = useRef<THREE.Mesh>(null);
    const props = useRef<THREE.Group>(null);
    const rank = useRef<THREE.Sprite>(null);
    const st = useRef({ yaw: 0, aim: 0, lastKick: 0, deadT: -1, roll: 0, pitch: 0, lastH: 0, lastAlt: 0, fx: 0, fz: 0, fy: 0, vy: 0, mode: 0, hitT: 0, lastHp: u.hp });
    const air = isAir(u.kind);
    const set = modelsFor(look);
    const topModel = set.unitTop[u.kind];
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
                grp.current.position.set(s.fx, lift(slagDef(g), s.fx, s.fz), s.fz);
                body.current.position.y = Math.max(0, s.fy);
                body.current.rotation.set(s.roll, u.heading - Math.PI / 2, -0.6, 'YZX');
                body.current.visible = s.fy > 0;
            } else {
                body.current.visible = false;
                const w = wreckRef.current;
                if (w && !w.visible && (u.kind === 'vogn' || u.kind === 'art' || u.kind === 'pv')) {
                    w.visible = true;
                    fx.scorch(s.fx, s.fz, 0.7);
                }
                if (w?.visible && s.deadT < 9 && Math.random() < dt * 9) fx.burn(s.fx, s.fz, 1 - s.deadT / 9);
            }
            if (bar.current) bar.current.visible = false;
            if (rank.current) rank.current.visible = false;
            return;
        }
        if (wreckRef.current) wreckRef.current.visible = false;
        body.current.visible = true;
        // Står på åsen der den er; vogner og kanoner heller med bakken.
        const def = slagDef(g);
        const px = air ? u.ax : u.x;
        const pz = air ? u.az : u.z;
        grp.current.position.set(px, lift(def, px, pz), pz);
        if (flying) grp.current.quaternion.identity();
        else tilt(def, px, pz, grp.current.quaternion);
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
            spin(props.current, dt, flying);
        } else {
            unitYaw.set(u.id, s.yaw);
            // Tårnet og løpet dreier mot fienden; skuddet rister hele figuren.
            const tgt = aimAt(g, u.x, u.z, UNITS[u.kind].range + 0.5, u.kind === 'lv');
            if (tgt) s.aim = Math.atan2(-(tgt.z - u.z), tgt.x - u.x);
            s.yaw = turn(s.yaw, s.aim, dt * 5);
            const whole = u.kind !== 'vogn';
            body.current.rotation.set(0, whole ? s.yaw : 0, u.kick * 0.08);
            if (top.current) {
                top.current.rotation.y = whole ? 0 : s.yaw;
                // Rekylen: tårnet smeller bakover og glir fram igjen.
                const rk = u.kick * u.kick * 0.2;
                top.current.position.x = -rk * Math.cos(top.current.rotation.y);
                top.current.position.z = rk * Math.sin(top.current.rotation.y);
            }
            if (u.kind === 'art' && u.kick > 0.9 && s.lastKick < 0.9) {
                // Artilleriet har ikke sporlys: flammen og røykringen er skuddet.
                const tip = FIG * 0.62;
                fx.flash(u.x + Math.cos(s.yaw) * tip, 0.7, u.z - Math.sin(s.yaw) * tip, 0.34);
                for (let i = 0; i < 3; i++) fx.puff('røyk', u.x, 0.2, u.z, { r: 0.18, grow: 2.2, life: 1.2, up: 0.2, spread: 1.2 });
            }
        }
        s.lastKick = u.kick;
        // Markert: lysere figur, og et lite hopp når den nettopp ble klikket.
        const hl = hlRef.current;
        const hit = hitPulse(s, u.hp, Math.min(0.05, raw));
        const mode = hit > 0.45 ? 2 : hlOn(hl, u.id) ? 1 : 0;
        if (mode !== s.mode) {
            s.mode = mode;
            paint(body.current, mode);
        }
        if (hit > 0 && !air) {
            // Rykket: figuren skjelver litt sidelengs mens blinket varer.
            body.current.position.x = (Math.random() - 0.5) * 0.08 * hit;
            body.current.position.z = (Math.random() - 0.5) * 0.08 * hit;
        } else if (!air) body.current.position.x = body.current.position.z = 0;
        const since = performance.now() / 1000 - hl.pickT;
        const hop = hl.pick === u.id && since < 0.35 ? Math.sin((since / 0.35) * Math.PI) : 0;
        const f = (air ? AIR_FIG : FIG) * (1 + hop * 0.14);
        const sc = f * (1 + u.kick * 0.06 + hit * 0.08);
        body.current.scale.set(sc, f * (1 - u.kick * 0.05 - hit * 0.1), sc);
        if (rank.current) {
            // Merket smekker inn stort når enheten nettopp ble slått sammen, og følger flyet.
            const pop = hl.pick === u.id && since < 0.6 ? 1 + Math.sin((since / 0.6) * Math.PI) * 0.9 : 1;
            rank.current.scale.setScalar((air ? 0.45 : 0.5) * pop);
            if (air) rank.current.position.y = (flying ? u.alt : 0) + 0.9;
        }
        if (bar.current) {
            bar.current.visible = u.hp < u.maxHp;
            bar.current.scale.x = Math.max(0.01, u.hp / u.maxHp);
        }
    });
    return (
        <group
            ref={grp}
            onClick={(e) => { e.stopPropagation(); onClick(u.id); }}
            onPointerOver={(e) => { e.stopPropagation(); hlRef.current.hover = u.id; document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { if (hlRef.current.hover === u.id) hlRef.current.hover = -1; document.body.style.cursor = ''; }}
        >
            {/* Usynlig klikkflate: hele ruta, ikke bare de små figurene. */}
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.95, 0.8, 0.95]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <group ref={body}>
                <Figure m={set.unit[u.kind]} shadow={!air} />
                {air && <Props kind={u.kind} pRef={props} />}
                {topModel && (
                    <group ref={top}>
                        <Figure m={topModel} />
                    </group>
                )}
            </group>
            {/* Gradsmerket: to vinkler = to like på ruta, stjerne = veteran. Står over figuren og
                skjules aldri bak den (depthTest av). */}
            {u.copies > 1 && <sprite ref={rank} material={rankMaterial(u.copies)} position={[0, 1.55, 0]} scale={0.5} renderOrder={5} />}
            <group ref={wreckRef} visible={false} scale={FIG}>
                <Figure m={wreck()} />
            </group>
            <mesh ref={bar} position={[0, 0.03, 0.6]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[0.8, 0.1]} />
                <meshBasicMaterial color={C.ringEgen} toneMapped={false} />
            </mesh>
        </group>
    );
}

export function Units({ gRef, onClick, fxRef, speedRef, hlRef }: { gRef: React.MutableRefObject<G>; onClick: (id: number) => void; fxRef: React.MutableRefObject<FxPool>; speedRef: Speed; hlRef: React.MutableRefObject<Hl> }) {
    const [list, setList] = useState<{ units: Unit[]; look: Look }>({ units: [], look: 'kyst' });
    const sig = useRef('');
    useFrame(() => {
        const g = gRef.current;
        const look = lookOf(g);
        const s = look + g.units.map((u) => `${u.id}.${u.copies}`).join(',');
        if (s !== sig.current) {
            sig.current = s;
            setList({ units: [...g.units], look });
        }
    });
    return (
        <>
            {list.units.map((u) => (
                <UnitView key={`${u.id}.${u.copies}`} u={u} look={list.look} gRef={gRef} onClick={onClick} fxRef={fxRef} speedRef={speedRef} hlRef={hlRef} />
            ))}
        </>
    );
}

function EnemyView({ e, look, gRef, fxRef, speedRef, onDive }: { e: Enemy; look: Look; gRef: React.MutableRefObject<G>; fxRef: React.MutableRefObject<FxPool>; speedRef: Speed; onDive: () => void }) {
    const grp = useRef<THREE.Group>(null);
    const body = useRef<THREE.Group>(null);
    const top = useRef<THREE.Group>(null);
    const wreckRef = useRef<THREE.Group>(null);
    const bar = useRef<THREE.Mesh>(null);
    const props = useRef<THREE.Group>(null);
    const fly = e.kind === 'estuka' || e.kind === 'ejag';
    const heavy = e.kind === 'evogn' || e.kind === 'epak' || e.kind === 'ebatt';
    const st = useRef({ yaw: Math.PI, px: e.x, pz: e.z, deadT: -1, fx: 0, fy: 0, fz: 0, vy: 0, roll: 0, lastH: e.heading, bank: 0, phase: e.phase, dust: 0, t: e.id * 1.7, mode: 0, hitT: 0, lastHp: e.hp });
    const set = modelsFor(look);
    const topModel = set.enemyTop[e.kind];
    const model = set.enemy[e.kind];
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
                grp.current.position.set(s.fx, lift(slagDef(g), s.fx, s.fz), s.fz);
                body.current.position.y = Math.max(0, s.fy);
                body.current.rotation.set(s.roll, e.heading - Math.PI / 2, -0.7, 'YZX');
                body.current.visible = s.fy > 0;
                return;
            }
            body.current.visible = false;
            const w = wreckRef.current;
            if (w && heavy && !w.visible) {
                w.visible = true;
                fx.scorch(s.fx, s.fz, 0.7);
            }
            if (heavy && s.deadT < 10 && Math.random() < dt * 9) fx.burn(s.fx, s.fz, 1 - s.deadT / 10);
            return;
        }
        body.current.visible = true;
        if (wreckRef.current) wreckRef.current.visible = false;
        const def = slagDef(g);
        grp.current.position.set(e.x, lift(def, e.x, e.z), e.z);
        if (e.alt > 0) grp.current.quaternion.identity();
        else tilt(def, e.x, e.z, grp.current.quaternion);
        body.current.position.y = e.alt;
        if (fly) {
            const tr = turn(0, e.heading - s.lastH, 1) / Math.max(1e-3, dt);
            s.bank += (THREE.MathUtils.clamp(-tr * 0.25, -0.8, 0.8) - s.bank) * Math.min(1, dt * 4);
            s.lastH = e.heading;
            // Stupbomberen stuper med nesa rett ned.
            const dive = e.kind === 'estuka' && e.phase === 'stup' ? -1.0 : e.phase === 'ut' ? 0.35 : 0;
            body.current.rotation.set(s.bank, e.heading - Math.PI / 2, dive, 'YZX');
            spin(props.current, dt, true);
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
            enemyYaw.set(e.id, s.yaw);
            let aim = s.yaw;
            if (topModel && top.current) {
                const tgt = g.units.find((u) => !u.dead && !isAir(u.kind) && (u.x - e.x) ** 2 + (u.z - e.z) ** 2 < 12);
                if (tgt) aim = Math.atan2(-(tgt.z - e.z), tgt.x - e.x);
                top.current.rotation.y = turn(top.current.rotation.y, aim - s.yaw, dt * 4);
                const rk = e.kick * e.kick * 0.18;
                top.current.position.x = -rk * Math.cos(top.current.rotation.y);
                top.current.position.z = rk * Math.sin(top.current.rotation.y);
            }
            const bob = e.kind === 'einf' ? Math.abs(Math.sin(s.t * 8)) * 0.04 : moving ? Math.sin(s.t * 14) * 0.012 : 0;
            body.current.position.y = bob;
            body.current.rotation.set(0, s.yaw, moving && e.kind === 'evogn' ? Math.sin(s.t * 3) * 0.03 + e.kick * 0.07 : e.kick * 0.07);
            if (moving && e.kind === 'evogn' && (s.dust += dt) > 0.25) {
                s.dust = 0;
                fx.puff('støv', e.x - Math.cos(s.yaw) * 0.6, 0.1, e.z + Math.sin(s.yaw) * 0.6, { r: 0.12, grow: 2.4, life: 0.9, up: 0.25, spread: 0.3 });
            }
        }
        const hit = hitPulse(s, e.hp, Math.min(0.05, raw));
        const mode = hit > 0.45 ? 2 : 0;
        if (mode !== s.mode) {
            s.mode = mode;
            paint(body.current, mode);
        }
        if (hit > 0 && !fly) {
            body.current.position.x = (Math.random() - 0.5) * 0.08 * hit;
            body.current.position.z = (Math.random() - 0.5) * 0.08 * hit;
        } else if (!fly) body.current.position.x = body.current.position.z = 0;
        const f = fly ? AIR_FIG : FIG;
        const sc = f * (1 + e.kick * 0.05 + hit * 0.08);
        body.current.scale.set(sc, f * (1 - hit * 0.1), sc);
        const netSees = g.netSeen.has(e.id);
        // Nedgravd panservern som ingen i nettet ser: bare et blaff. Batteriet synes bare når det skyter.
        if (e.dug && !netSees) body.current.visible = e.kind === 'ebatt' ? e.kick > 0.25 : Math.sin(clock.clock.elapsedTime * 3) > 0.6;
        if (bar.current) {
            bar.current.visible = e.hp < e.maxHp;
            bar.current.scale.x = Math.max(0.01, e.hp / e.maxHp);
        }
    });
    return (
        <group ref={grp}>
            <group ref={body}>
                {model && <Figure m={model} shadow={!fly} />}
                {fly && <Props kind={e.kind} pRef={props} />}
                {topModel && (
                    <group ref={top}>
                        <Figure m={topModel} />
                    </group>
                )}
            </group>
            {heavy && (
                <group ref={wreckRef} visible={false} scale={FIG}>
                    <Figure m={wreck()} />
                </group>
            )}
            <mesh ref={bar} position={[0, 0.03, 0.58]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[0.7, 0.09]} />
                <meshBasicMaterial color={C.ringFiende} toneMapped={false} />
            </mesh>
        </group>
    );
}

export function Enemies({ gRef, fxRef, speedRef, onDive }: { gRef: React.MutableRefObject<G>; fxRef: React.MutableRefObject<FxPool>; speedRef: Speed; onDive: () => void }) {
    const [list, setList] = useState<{ enemies: Enemy[]; look: Look }>({ enemies: [], look: 'kyst' });
    const last = useRef(0);
    useFrame(() => {
        const g = gRef.current;
        const top = g.enemies.length ? g.enemies[g.enemies.length - 1].id : 0;
        if (top !== last.current || (g.enemies.length === 0 && list.enemies.length)) {
            last.current = top;
            setList({ enemies: [...g.enemies], look: lookOf(g) });
        }
    });
    return (
        <>
            {list.enemies.map((e) => (
                <EnemyView key={e.id} e={e} look={list.look} gRef={gRef} fxRef={fxRef} speedRef={speedRef} onDive={onDive} />
            ))}
        </>
    );
}

// ---- Radiolinjer og sporlys -------------------------------------------------------
const MAX_SEG = 200;
const MAX_DASH = 260;

/** Radiolinjene er lysende stiplede bånd som «sender» ut fra antennen; de blusser når enheten skyter. */
export function Lines({ gRef }: { gRef: React.MutableRefObject<G> }) {
    const dashRef = useRef<THREE.InstancedMesh>(null);
    const lineRef = useRef<THREE.LineSegments>(null);
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 6), 3));
        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 6), 3));
        return g;
    }, []);
    // Over 1: gløder med bloom på middels og høy.
    const radio = useMemo(() => new THREE.Color(C.radio).multiplyScalar(1.5), []);
    const hot = useMemo(() => new THREE.Color('#fff6d0').multiplyScalar(2.2), []);
    const egen = useMemo(() => new THREE.Color('#ffe7a0').multiplyScalar(2.4), []);
    const fiende = useMemo(() => new THREE.Color('#ff7440').multiplyScalar(2.4), []);
    useLayoutEffect(() => {
        dashRef.current?.setColorAt(0, radio);
    }, [radio]);
    useFrame((st) => {
        const g = gRef.current;
        const dm = dashRef.current;
        if (!dm) return;
        const def = slagDef(g);
        const [hx, hz] = def.hq;
        const ay = 2.9 + lift(def, hx, hz);
        const ax = hx - 0.42;
        const az = hz + 0.14;
        const time = st.clock.elapsedTime;
        let n = 0;
        for (const u of g.units) {
            if (u.dead || !(u.linked || u.linking > 0)) continue;
            const air = isAir(u.kind);
            const tx = air ? u.ax : u.x;
            const tz = air ? u.az : u.z;
            const ty = (air && u.mode !== 'bakke' ? u.alt + 0.3 : 0.9) + lift(def, tx, tz);
            // Stafett: linja går fra enheten som sender radioen videre, ikke fra kommandovogna.
            const via = u.via ? g.units.find((v) => v.id === u.via && !v.dead) : undefined;
            const sx = via ? via.x : ax;
            const sy = via ? 0.9 + lift(def, via.x, via.z) : ay;
            const sz = via ? via.z : az;
            DIR.set(tx - sx, ty - sy, tz - sz);
            const len = DIR.length();
            DIR.divideScalar(len);
            Q.setFromUnitVectors(UP, DIR);
            // Linja som kobles opp, vokser ut fra antennen.
            const reach = u.linking > 0 ? len * (1 - u.linking / RADIO.koble) : len;
            const dash = 0.34;
            const off = (time * 1.4) % dash;
            const w = 0.05 * (1 + u.kick * 1.3);
            COL.copy(u.kick > 0.3 ? hot : radio);
            for (let d = off - dash; d < reach && n < MAX_DASH; d += dash) {
                const a = Math.max(0, d);
                const b = Math.min(reach, d + dash * 0.62);
                if (b <= a) continue;
                const mid = (a + b) / 2;
                M.compose(P.set(sx + DIR.x * mid, sy + DIR.y * mid, sz + DIR.z * mid), Q, S.set(w, b - a, w));
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
            const y0 = 0.4 + lift(def, f.x, f.z);
            const y1 = Math.max(0.35, f.alt) + lift(def, f.x2, f.z2);
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

/** Ruta under musepekeren mens eleven holder et kort (grønn = lov, rød = ikke lov), tegnet i bakken. */
export function Ghost({ gRef, pointer }: { gRef: React.MutableRefObject<G>; pointer: React.MutableRefObject<[number, number]> }) {
    useFrame(() => {
        const g = gRef.current;
        const k = g.holding >= 0 ? g.shop[g.holding] : null;
        const [x, z] = pointer.current;
        const on = !!k && !isAir(k) && g.phase === 'plan' && x >= 0 && z >= 0 && x < MAP_W && z < MAP_D;
        MARKS.uGhost.value.set(x, z, canPlace(g, x, z) ? 1 : 0, on ? 1 : 0);
    });
    return null;
}
