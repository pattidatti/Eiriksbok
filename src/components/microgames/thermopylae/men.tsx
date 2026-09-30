import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit/quality';
import { hw, type G, type Enemy } from './game';
import {
    PAL,
    kindGeo,
    glowTexture,
    puffTexture,
    SHOULDER_X,
    SHOULDER_Y,
    ARM_LEN,
    HIP_X,
    HIP_Y,
    TIP_Z,
    type Kind,
} from './look';
import { viewOf, manOf, addDecal, stuckOf, type ViewState } from './view';

// Perserne, blodet og pilene. Alt er instanser: én InstancedMesh per kroppsdel og type,
// uansett hvor mange som stormer. Posene regnes ut fra tilstanden i spillreglene - løftet
// spyd med glødende spiss er varselet, en finte pumper spydet og senker skjoldet, og de
// døde slenger med lemmene i lufta og blir liggende på sanden (eller flyter i havet).

type GRef = React.MutableRefObject<G>;

const CAP: Record<Kind, number> = { lev: 64, imm: 26, boss: 2 };
const WINDUP: Record<Kind, number> = { lev: 0.75, imm: 0.6, boss: 0.95 };
const KINDS: Kind[] = ['lev', 'imm', 'boss'];
const GLOW_N = 12;

const M = new THREE.Matrix4();
const ROOT = new THREE.Matrix4();
const PART = new THREE.Matrix4();
const ARM = new THREE.Matrix4();
const TMPM = new THREE.Matrix4();
const V = new THREE.Vector3();
const Q = new THREE.Quaternion();
const S = new THREE.Vector3();
const E = new THREE.Euler();
const COL = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
// Faste farger: Color.set med tekst tolker strengen hver gang og lager søppel i løkkene.
const C_BLOOD = new THREE.Color(PAL.blood);
const C_BLOOD2 = new THREE.Color('#d11a26');
const C_DUST = new THREE.Color('#e8c89a');
const C_WICKER = new THREE.Color(PAL.wicker);
const C_WOOD = new THREE.Color('#6b4527');

function rotXYZ(x: number, y: number, z: number, order: THREE.EulerOrder = 'XYZ') {
    E.set(x, y, z, order);
    return TMPM.makeRotationFromEuler(E);
}
function tr(x: number, y: number, z: number) {
    return new THREE.Matrix4().makeTranslation(x, y, z);
}
const T_HIP_L = tr(-HIP_X, HIP_Y, 0);
const T_HIP_R = tr(HIP_X, HIP_Y, 0);
const T_SH_L = tr(-SHOULDER_X, SHOULDER_Y, 0);
const T_SH_R = tr(SHOULDER_X, SHOULDER_Y, 0);
const T_HAND = tr(0, -ARM_LEN, 0);
const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

interface Pose {
    lean: number;
    roll: number;
    yawOff: number;
    legA: number;
    legSpread: number;
    armL: number;
    armLZ: number;
    armR: number;
    armRZ: number;
    spearP: number;
    push: number;
    glow: number;
    feint: boolean;
}
const P: Pose = { lean: 0, roll: 0, yawOff: 0, legA: 0, legSpread: 0, armL: 0, armLZ: 0, armR: 0, armRZ: 0, spearP: 0, push: 0, glow: 0, feint: false };

function pose(e: Enemy, g: G, v: ViewState, t: number): void {
    const m = v.men.get(e.id)!;
    const ph = e.id * 1.37;
    P.lean = -0.06;
    P.roll = 0;
    P.yawOff = 0;
    P.legA = Math.sin(m.walk) * 0.55;
    P.legSpread = 0.04;
    P.armL = 0.95;
    P.armLZ = 0.1;
    P.armR = 0.35 + Math.sin(m.walk) * 0.18;
    P.armRZ = 0.08;
    P.spearP = 0.5;
    P.push = 0;
    P.glow = 0;
    P.feint = false;
    switch (e.state) {
        case 'rush':
        case 'pursue':
            P.legA = Math.sin(m.walk) * 0.85;
            P.lean = -0.22;
            P.armR = 0.9 + Math.sin(m.walk) * 0.3;
            P.spearP = 0.95;
            break;
        case 'plunder':
            // Plyndrer i leiren: armene i været av ren glede.
            P.armR = 2.6 + Math.sin(t * 11 + ph) * 0.35;
            P.armL = 2.5 + Math.cos(t * 10 + ph) * 0.35;
            P.armLZ = 0.4;
            P.armRZ = 0.4;
            P.spearP = 1.3;
            P.lean = 0.1;
            break;
        case 'ready':
        case 'wait': {
            const moving = Math.hypot(e.x - m.lx, e.z - m.lz) > 0.004;
            if (!moving) P.legA = 0.2;
            P.armL = 1.15;
            P.armR = 0.95 + Math.sin(t * 2.2 + ph) * 0.06;
            P.spearP = 0.05 + Math.sin(t * 2.2 + ph) * 0.04;
            P.lean = -0.1;
            break;
        }
        case 'windup': {
            const k = ease((g.t - e.timerStart) / WINDUP[e.kind]);
            if (e.feint && !e.feinted) {
                // Finten: skjoldet senkes, spydet pumper - han later som.
                P.feint = true;
                P.armL = 0.3;
                P.armLZ = 0.35;
                P.armR = 2.4 + Math.sin(t * 17 + ph) * 0.3;
                P.spearP = -0.25 + Math.sin(t * 17 + ph) * 0.4;
                P.lean = 0.05;
                P.glow = 0.55 + Math.sin(t * 30) * 0.35;
            } else {
                P.armL = 1.25;
                P.armR = 0.95 + (2.75 - 0.95) * k;
                P.spearP = 0.05 - 0.35 * k;
                P.lean = 0.2 * k;
                P.legA = 0.25;
                P.glow = 0.15 + 0.85 * k;
            }
            break;
        }
        case 'recover':
            P.armR = 1.55;
            P.spearP = -0.15;
            P.push = 0.45;
            P.lean = -0.28;
            P.legA = 0.45;
            break;
        case 'stagger':
            if (m.brokenSpear) {
                // Han glor på spydstumpen sin.
                P.armR = 1.25;
                P.armRZ = -0.25;
                P.spearP = 0.8;
                P.lean = -0.35;
                P.yawOff = 0.45;
                P.armL = 0.4;
            } else {
                P.lean = 0.35 + Math.sin(t * 9 + ph) * 0.08;
                P.armR = 2.2 + Math.sin(t * 11 + ph) * 0.4;
                P.armL = 1.9 + Math.cos(t * 9 + ph) * 0.4;
                P.armLZ = 0.5;
                P.spearP = 1.1;
                P.legA = 0.3;
            }
            break;
        case 'knocked':
            // Glir baklengs med armene som vindmøller.
            P.lean = 0.62;
            P.armR = 2.4 + Math.sin(t * 22 + ph) * 0.9;
            P.armL = 2.4 + Math.cos(t * 22 + ph) * 0.9;
            P.armLZ = 0.6;
            P.armRZ = 0.6;
            P.legA = Math.sin(t * 20 + ph) * 0.7;
            P.spearP = 1.4;
            break;
        case 'climb':
            P.armR = 2.9;
            P.armL = 2.9;
            P.legA = Math.sin(t * 10 + ph) * 0.6;
            P.lean = -0.3;
            P.spearP = 1.5;
            break;
        case 'dead':
            if (m.landT < 0) {
                P.armR = 1.5 + Math.sin(t * 19 + ph) * 1.4;
                P.armL = 1.5 + Math.cos(t * 17 + ph) * 1.4;
                P.armLZ = 0.8;
                P.armRZ = 0.8;
                P.legA = Math.sin(t * 21 + ph) * 1.0;
                P.legSpread = 0.3;
                P.spearP = Math.sin(t * 13 + ph) * 1.5;
            } else {
                P.armR = 2.8;
                P.armL = 2.7;
                P.armLZ = 0.55;
                P.armRZ = 0.6;
                P.legA = 0.1;
                P.legSpread = 0.3;
                P.spearP = 0.3;
            }
            break;
    }
}

function rootMatrix(e: Enemy, g: G, v: ViewState, out: THREE.Matrix4) {
    const m = v.men.get(e.id)!;
    const s = e.kind === 'boss' ? 1.35 : 1;
    let y = e.y;
    const face = e.face + P.yawOff;
    if (e.state === 'dead') {
        if (m.landT < 0) {
            // I lufta: hele kroppen snurrer rundt tyngdepunktet.
            V.set(e.x, y + 1.0 * s, e.z);
            Q.setFromEuler(E.set(e.spin, face, e.spin * 0.45, 'YXZ'));
            out.compose(V, Q, S.set(s, s, s));
            return out.multiply(TMPM.makeTranslation(0, -1.0, 0));
        }
        // På bakken (eller i vannet): legger seg flatt, på ryggen - i havet med ansiktet ned.
        const k = Math.min(1, m.landT / 0.25);
        if (e.sea) y = -0.34 - Math.min(1.6, Math.max(0, m.landT - 2) * 0.35) + Math.sin(g.t * 2 + e.id) * 0.04;
        else y = 0.17 * s * k;
        const lie = (e.sea ? -1 : 1) * (Math.PI / 2) * ease(k);
        V.set(e.x, y, e.z);
        Q.setFromEuler(E.set(lie, face + e.spin * 0.15, 0, 'YXZ'));
        return out.compose(V, Q, S.set(s, s, s));
    }
    V.set(e.x, y, e.z);
    Q.setFromEuler(E.set(P.lean, face, P.roll, 'YXZ'));
    return out.compose(V, Q, S.set(s, s, s));
}

interface KindRefs {
    body: THREE.InstancedMesh | null;
    legs: THREE.InstancedMesh | null;
    arms: THREE.InstancedMesh | null;
    shield: THREE.InstancedMesh | null;
    spear: THREE.InstancedMesh | null;
}

/** Oppdaterer visningens hukommelse og legger ut alle perserne. Kalles fra useFrame. */
function layoutMen(
    g: G,
    t: number,
    refs: Record<Kind, KindRefs>,
    glow: THREE.InstancedMesh | null,
    camQ: THREE.Quaternion,
    dt: number,
) {
    const v = viewOf(g);
    v.frame++;
    const n: Record<Kind, number> = { lev: 0, imm: 0, boss: 0 };
    let ng = 0;
    for (const e of g.enemies) {
        if (e.y < -10) continue;
        const k = e.kind;
        if (n[k] >= CAP[k]) continue;
        const m = manOf(v, e.id, e.x, e.z);
        m.seen = v.frame;
        // Tilstandsskifter som visningen reagerer på.
        if (m.prevState !== e.state) {
            if (e.state === 'knocked' && k === 'lev' && !m.noShield) {
                // Vidjeskjoldet tåler ikke et bronseskjold i fleisen.
                m.noShield = true;
                for (let i = 0; i < 7; i++)
                    v.splinters.push({
                        x: e.x,
                        y: 1.1,
                        z: e.z,
                        vx: (Math.random() - 0.5) * 4,
                        vy: 2 + Math.random() * 3,
                        vz: (Math.random() - 0.5) * 4,
                        t: 0,
                        kind: 'vidje',
                    });
            }
            if (e.state === 'stagger' && m.prevState === 'windup' && !m.brokenSpear) {
                // Parert: spydet knekker, og tuppen virvler av gårde.
                m.brokenSpear = true;
                v.splinters.push({ x: e.x, y: 1.9, z: e.z, vx: (Math.random() - 0.5) * 3, vy: 5, vz: (Math.random() - 0.5) * 3, t: 0, kind: 'spyd' });
            }
            if (e.state === 'dead') m.landT = -1;
            m.prevState = e.state;
        }
        const moved = Math.hypot(e.x - m.lx, e.z - m.lz);
        m.walk += moved * 4.4;
        if (e.state === 'dead') {
            const onFloor = e.sea ? e.y <= -0.3 : e.y <= 0.02;
            if (m.landT < 0 && onFloor) {
                m.landT = 0;
                if (e.sea) g.fx.push({ kind: 'plask', x: e.x, y: -0.25, z: e.z, t: 0, n: 10 });
                else if (!m.decal && e.x < hw(e.z)) {
                    m.decal = true;
                    addDecal(v, e.x, e.z, 0.5 + Math.random() * 0.35);
                }
            } else if (m.landT >= 0) m.landT += dt;
        }

        pose(e, g, v, t);
        m.lx = e.x;
        m.lz = e.z;
        const r = refs[k];
        const i = n[k]++;
        rootMatrix(e, g, v, ROOT);
        r.body?.setMatrixAt(i, ROOT);
        // Ben
        PART.copy(ROOT).multiply(T_HIP_L).multiply(rotXYZ(P.legA, 0, -P.legSpread));
        r.legs?.setMatrixAt(i * 2, PART);
        PART.copy(ROOT).multiply(T_HIP_R).multiply(rotXYZ(-P.legA, 0, P.legSpread));
        r.legs?.setMatrixAt(i * 2 + 1, PART);
        // Skjoldarm og skjold
        ARM.copy(ROOT).multiply(T_SH_L).multiply(rotXYZ(P.armL, 0, -P.armLZ, 'ZXY'));
        r.arms?.setMatrixAt(i * 2, ARM);
        if (m.noShield) r.shield?.setMatrixAt(i, ZERO);
        else {
            PART.copy(ARM).multiply(T_HAND).multiply(rotXYZ(-P.armL, 0, 0)).multiply(TMPM.makeTranslation(0.02, 0.05, -0.16));
            r.shield?.setMatrixAt(i, PART);
        }
        // Spydarm og spyd
        ARM.copy(ROOT).multiply(T_SH_R).multiply(rotXYZ(P.armR, 0, P.armRZ, 'ZXY'));
        r.arms?.setMatrixAt(i * 2 + 1, ARM);
        PART.copy(ARM).multiply(T_HAND).multiply(rotXYZ(-P.armR + P.spearP, 0, 0)).multiply(TMPM.makeTranslation(0, 0, -P.push));
        if (m.brokenSpear) PART.multiply(TMPM.makeScale(1, 1, 0.34));
        r.spear?.setMatrixAt(i, PART);
        // Gløden på spydspissen: varselet.
        if (glow && P.glow > 0.02 && ng < GLOW_N) {
            V.set(0, 0, TIP_Z).applyMatrix4(PART);
            const sc = (e.kind === 'boss' ? 1.1 : 0.7) * (0.45 + P.glow * 0.8);
            M.compose(V, camQ, S.set(sc, sc, sc));
            glow.setMatrixAt(ng, M);
            if (P.feint) COL.setRGB(0.4 * P.glow, 2.4 * P.glow, 2.6 * P.glow);
            else COL.setRGB(3.2 * P.glow, 1.3 * P.glow, 0.25 * P.glow);
            glow.setColorAt(ng, COL);
            ng++;
        }
    }
    for (const k of KINDS) {
        const r = refs[k];
        for (const im of [r.body, r.shield, r.spear]) if (im) im.count = n[k];
        for (const im of [r.legs, r.arms]) if (im) im.count = n[k] * 2;
        for (const im of [r.body, r.shield, r.spear, r.legs, r.arms]) if (im) im.instanceMatrix.needsUpdate = true;
    }
    if (glow) {
        glow.userData.n = ng;
        glow.instanceMatrix.needsUpdate = true;
        if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
    }
    // Glem de som er borte.
    if (v.frame % 30 === 0) for (const [id, m] of v.men) if (m.seen !== v.frame) v.men.delete(id);
    return ng;
}

function KindMeshes({ kind, set }: { kind: Kind; set: (k: Kind, part: keyof KindRefs, el: THREE.InstancedMesh | null) => void }) {
    const geo = kindGeo(kind);
    const mat = useMemo(
        () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: kind === 'lev' ? 0.6 : 0.32, metalness: 0.02, envMapIntensity: 0.9 }),
        [kind],
    );
    const shieldMat = useMemo(
        () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: kind === 'boss' ? 0.25 : 0.85, metalness: kind === 'boss' ? 0.75 : 0 }),
        [kind],
    );
    const cap = CAP[kind];
    // Skyggepasset tegner alle skyggekastere én gang til. På lav kaster bare kroppen skygge.
    const full = useQuality().tier !== 'lav';
    return (
        <>
            <instancedMesh ref={(el) => set(kind, 'body', el)} args={[geo.body, mat, cap]} castShadow frustumCulled={false} />
            <instancedMesh ref={(el) => set(kind, 'legs', el)} castShadow={full} args={[geo.leg, mat, cap * 2]} frustumCulled={false} />
            <instancedMesh ref={(el) => set(kind, 'arms', el)} castShadow={full} args={[geo.arm, mat, cap * 2]} frustumCulled={false} />
            <instancedMesh ref={(el) => set(kind, 'shield', el)} castShadow={full} args={[geo.shield, shieldMat, cap]} frustumCulled={false} />
            <instancedMesh ref={(el) => set(kind, 'spear', el)} castShadow={full} args={[geo.spear, mat, cap]} frustumCulled={false} />
        </>
    );
}

export function Enemies({ gRef }: { gRef: GRef }) {
    const refs = useRef<Record<Kind, KindRefs>>({
        lev: { body: null, legs: null, arms: null, shield: null, spear: null },
        imm: { body: null, legs: null, arms: null, shield: null, spear: null },
        boss: { body: null, legs: null, arms: null, shield: null, spear: null },
    });
    const glow = useRef<THREE.InstancedMesh>(null);
    const set = useMemo(
        () => (k: Kind, part: keyof KindRefs, el: THREE.InstancedMesh | null) => {
            refs.current[k][part] = el;
        },
        [],
    );
    useFrame((state, rawDt) => {
        const n = layoutMen(gRef.current, state.clock.elapsedTime, refs.current, glow.current, state.camera.quaternion, Math.min(0.05, rawDt));
        if (glow.current) glow.current.count = n;
    });
    return (
        <>
            {KINDS.map((k) => (
                <KindMeshes key={k} kind={k} set={set} />
            ))}
            <instancedMesh ref={glow} args={[undefined, undefined, GLOW_N]} frustumCulled={false} renderOrder={5}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
            </instancedMesh>
        </>
    );
}

// ---------------------------------------------------------------------------
// Blod på sanden
// ---------------------------------------------------------------------------

function splatTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = PAL.blood;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const r = 36 + Math.sin(i * 2.7) * 10 + (i % 3) * 5;
        const x = 64 + Math.cos(a) * r;
        const y = 64 + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.fill();
    for (let i = 0; i < 12; i++) {
        const a = i * 2.4;
        const r = 48 + (i % 4) * 4;
        ctx.beginPath();
        ctx.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 3 + (i % 3) * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

export function Decals({ gRef }: { gRef: GRef }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tex = useMemo(() => splatTexture(), []);
    useFrame(() => {
        const im = ref.current;
        if (!im) return;
        const v = viewOf(gRef.current);
        // Bare når noe er nytt eller fortsatt vokser.
        const last = v.decals[v.decals.length - 1];
        const key = v.decals.length * 1000 + (last ? Math.round(last.t * 20) : 0) + (last ? last.x : 0);
        if (key === im.userData.key && (!last || last.t >= 1)) return;
        im.userData.key = key;
        let k = 0;
        for (const d of v.decals) {
            d.t = Math.min(1, d.t + 1 / 20);
            const s = d.r * (0.4 + 0.6 * d.t);
            Q.setFromEuler(E.set(-Math.PI / 2, 0, d.rot, 'XYZ'));
            M.compose(V.set(d.x, 0.015 + k * 0.0004, d.z), Q, S.set(s * 2, s * 2, 1));
            im.setMatrixAt(k++, M);
        }
        im.count = k;
        im.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, 60]} frustumCulled={false} receiveShadow>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial map={tex} transparent roughness={0.3} depthWrite={false} polygonOffset polygonOffsetFactor={-4} />
        </instancedMesh>
    );
}

// ---------------------------------------------------------------------------
// Sprut, gnister, støv og plask (fra spillreglenes fx-liste) + fliser av vidje og spyd
// ---------------------------------------------------------------------------

const FX_N = 220;
const RING_N = 12;
const PUFF_N = 40;
const SPL_N = 60;
export function FxView({ gRef }: { gRef: GRef }) {
    const q = useQuality();
    const drops = useRef<THREE.InstancedMesh>(null);
    const rings = useRef<THREE.InstancedMesh>(null);
    const puffs = useRef<THREE.InstancedMesh>(null);
    const bits = useRef<THREE.InstancedMesh>(null);
    const ringGeo = useMemo(() => {
        const g = new THREE.RingGeometry(0.7, 1, 24);
        g.rotateX(-Math.PI / 2);
        return g;
    }, []);
    const mul = q.particleScale;
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        const v = viewOf(g);
        const d = drops.current;
        const r = rings.current;
        const p = puffs.current;
        const b = bits.current;
        if (!d || !r || !p || !b) return;
        const camQ = state.camera.quaternion;
        let nd = 0;
        let nr = 0;
        let np = 0;
        for (const f of g.fx) {
            // Ny blodsprut på sanden: en liten flekk der den landet.
            if (f.kind === 'blod' && !v.seenFx.has(f)) {
                v.seenFx.add(f);
                if (f.x < hw(f.z)) addDecal(v, f.x + (Math.random() - 0.5) * 0.6, f.z + (Math.random() - 0.5) * 0.6, 0.22 + Math.random() * 0.15);
            }
            const t = f.t;
            const cnt = Math.max(2, Math.round(f.n * (f.kind === 'blod' ? 2.2 : 1.6) * mul));
            for (let j = 0; j < cnt && nd < FX_N; j++) {
                const a = j * 2.39 + f.x * 3.1 + f.z;
                const up = 0.4 + ((j * 7) % 5) * 0.35;
                if (f.kind === 'blod') {
                    const sp = 1.6 + (j % 4) * 0.8;
                    const x = f.x + Math.cos(a) * sp * t;
                    const z = f.z + Math.sin(a) * sp * t;
                    const y = Math.max(0.02, f.y + up * 3 * t - 9.5 * t * t);
                    const s = y <= 0.021 ? 0.03 : 0.018 + (j % 3) * 0.012;
                    M.compose(V.set(x, y, z), Q.identity(), S.set(s, y <= 0.021 ? s * 0.25 : s * 1.3, s));
                    d.setMatrixAt(nd, M);
                    d.setColorAt(nd, j % 3 ? C_BLOOD : C_BLOOD2);
                    nd++;
                } else if (f.kind === 'klang' || f.kind === 'parer') {
                    if (t > 0.45) break;
                    const sp = (f.kind === 'parer' ? 5 : 3.5) * (0.6 + (j % 3) * 0.3);
                    const x = f.x + Math.cos(a) * sp * t;
                    const z = f.z + Math.sin(a) * sp * t * 0.6;
                    const y = f.y + Math.sin(a * 1.7) * sp * t * 0.7 - 4 * t * t;
                    const s = 0.035 * (1 - t / 0.45) + 0.01;
                    M.compose(V.set(x, y, z), Q.identity(), S.set(s, s, s));
                    d.setMatrixAt(nd, M);
                    d.setColorAt(nd, j % 2 ? COL.setRGB(4, 3.2, 1.4) : COL.setRGB(3.5, 1.8, 0.5));
                    nd++;
                } else if (f.kind === 'plask') {
                    const h = Math.max(-0.3, f.y + up * 3.4 * t - 9 * t * t);
                    const x = f.x + Math.cos(a) * t * 1.4;
                    const z = f.z + Math.sin(a) * t * 1.4;
                    const s = 0.08 * (1 - Math.min(1, t));
                    M.compose(V.set(x, h, z), Q.identity(), S.set(s, s * 1.5, s));
                    d.setMatrixAt(nd, M);
                    d.setColorAt(nd, COL.setRGB(1.3, 1.5, 1.5));
                    nd++;
                }
            }
            if (f.kind === 'plask' && nr < RING_N) {
                const s = 0.4 + f.t * 2.4;
                M.compose(V.set(f.x, -0.18, f.z), Q.identity(), S.set(s, 1, s));
                r.setMatrixAt(nr++, M);
            }
            if ((f.kind === 'stov' || f.kind === 'parer' || (f.kind === 'blod' && f.n >= 10)) && np < PUFF_N) {
                const lifeK = Math.min(1, f.t / 1.0);
                const s = f.kind === 'parer' ? (f.t < 0.2 ? 1.6 * (1 - f.t / 0.2) : 0) : (0.5 + lifeK * 1.6) * (1 - lifeK * 0.7);
                if (s > 0.01) {
                    M.compose(V.set(f.x, f.y + lifeK * (f.kind === 'stov' ? 0.6 : 0.2), f.z), camQ, S.set(s, s, s));
                    p.setMatrixAt(np, M);
                    if (f.kind === 'parer') p.setColorAt(np, COL.setRGB(3.5, 2.8, 1.4));
                    else if (f.kind === 'blod') p.setColorAt(np, COL.setRGB(0.6, 0.03, 0.05));
                    else p.setColorAt(np, C_DUST);
                    np++;
                }
            }
        }
        // Fliser: vidje og spydtupper som virvler av gårde.
        let nb = 0;
        for (const s of v.splinters) {
            s.t += dt;
            s.vy -= 12 * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.z += s.vz * dt;
            if (s.y < 0.03) {
                s.y = 0.03;
                s.vx *= 0.6;
                s.vz *= 0.6;
                s.vy = Math.abs(s.vy) * 0.25;
            }
            if (nb >= SPL_N) continue;
            Q.setFromEuler(E.set(s.t * 9, s.t * 7, s.t * 5));
            if (s.kind === 'vidje') M.compose(V.set(s.x, s.y, s.z), Q, S.set(0.3, 0.05, 0.04));
            else M.compose(V.set(s.x, s.y, s.z), Q, S.set(0.04, 0.04, 0.7));
            b.setMatrixAt(nb, M);
            b.setColorAt(nb, s.kind === 'vidje' ? C_WICKER : C_WOOD);
            nb++;
        }
        if (v.splinters.length && v.splinters[0].t >= 5) v.splinters = v.splinters.filter((s) => s.t < 5);
        d.count = nd;
        r.count = nr;
        p.count = np;
        b.count = nb;
        for (const im of [d, r, p, b]) {
            im.instanceMatrix.needsUpdate = true;
            if (im.instanceColor) im.instanceColor.needsUpdate = true;
        }
    });
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            <instancedMesh ref={drops} args={[undefined, undefined, FX_N]} frustumCulled={false}>
                <icosahedronGeometry args={[1, 0]} />
                <meshBasicMaterial toneMapped={false} />
            </instancedMesh>
            <instancedMesh ref={rings} args={[ringGeo, undefined, RING_N]} frustumCulled={false}>
                <meshBasicMaterial color="#f4fbf8" transparent opacity={0.7} depthWrite={false} />
            </instancedMesh>
            <instancedMesh ref={puffs} args={[undefined, undefined, PUFF_N]} frustumCulled={false}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={puffTexture()} transparent depthWrite={false} toneMapped={false} />
            </instancedMesh>
            <instancedMesh ref={bits} args={[undefined, undefined, SPL_N]} frustumCulled={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial roughness={0.9} />
            </instancedMesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Pilregnet: en sverm som mørklegger sola, og piler som blir stående i sanden
// ---------------------------------------------------------------------------

export function Arrows({ gRef }: { gRef: GRef }) {
    const q = useQuality();
    const N = q.tier === 'lav' ? 45 : 110;
    const ref = useRef<THREE.InstancedMesh>(null);
    const geo = useMemo(() => {
        const shaft = new THREE.BoxGeometry(0.025, 0.025, 0.85);
        const pos = shaft.attributes.position;
        pos.needsUpdate = true;
        return shaft;
    }, []);
    const seeds = useMemo(() => {
        const out: [number, number, number, number][] = [];
        let a = 7;
        const r = () => ((a = (a * 16807) % 2147483647) / 2147483647);
        for (let i = 0; i < 110; i++) out.push([r() * 2 - 1, r() * 2 - 1, r(), r()]);
        return out;
    }, []);
    useFrame((_, rawDt) => {
        const im = ref.current;
        if (!im) return;
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        let st = stuckOf.get(g);
        if (!st) {
            st = { list: [], prevWarn: 0, shield: 0 };
            stuckOf.set(g, st);
        }
        let k = 0;
        const W = 2.1;
        if (g.volleyWarn > 0) {
            const u = 1 - g.volleyWarn / W;
            for (let i = 0; i < N; i++) {
                const [ox, oz, a, b] = seeds[i];
                const uu = Math.min(1, Math.max(0, (u - a * 0.15) / 0.85));
                const sx = g.px + ox * 14;
                const sz = g.pz - 60 - b * 12;
                const ex = g.px + ox * 5.5;
                const ez = g.pz + oz * 5.5;
                const x = sx + (ex - sx) * uu;
                const z = sz + (ez - sz) * uu;
                const y = 4 + (1 - uu) * 20 + Math.sin(uu * Math.PI) * 16;
                // Retningen langs banen.
                const dy = -20 + Math.cos(uu * Math.PI) * 16 * Math.PI;
                const dh = Math.hypot(ex - sx, ez - sz);
                const pitch = Math.atan2(dy, dh);
                const yaw = Math.atan2(-(ex - sx), -(ez - sz));
                Q.setFromEuler(E.set(pitch, yaw, 0, 'YXZ'));
                M.compose(V.set(x, y, z), Q, S.set(1, 1, 1));
                im.setMatrixAt(k++, M);
            }
        } else if (st.prevWarn > 0) {
            // De landet: noen blir stående i sanden, noen i skjoldet ditt.
            st.list = [];
            let onShield = 0;
            for (let i = 0; i < N; i++) {
                const [ox, oz] = seeds[i];
                const ex = g.px + ox * 5.5;
                const ez = g.pz + oz * 5.5;
                if (Math.hypot(ex - g.px, ez - g.pz) < 0.7) {
                    onShield++;
                    continue;
                }
                if (ex > hw(ez) + 0.3 || (Math.abs(ez) < 0.4 && Math.abs(ex) > 1.2)) continue;
                st.list.push({ x: ex, z: ez, rx: -0.9 + (i % 5) * 0.08, rz: (i % 7) * 0.05 - 0.15, t: 0 });
            }
            st.shield = g.shield ? Math.max(3, Math.min(6, onShield + 3)) : 0;
        }
        st.prevWarn = g.volleyWarn;
        for (const s of st.list) {
            s.t += dt;
            if (s.t > 9 || k >= N) continue;
            Q.setFromEuler(E.set(s.rx, 0.3, s.rz, 'YXZ'));
            M.compose(V.set(s.x, 0.3, s.z), Q, S.set(1, 1, 1));
            im.setMatrixAt(k++, M);
        }
        if (st.list.length && st.list[0].t > 9) st.list = [];
        if (st.shield > 0 && st.list.length === 0) st.shield = 0;
        im.count = k;
        im.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[geo, undefined, N]} frustumCulled={false} userData={{ sceneAuditIgnore: true }}>
            <meshStandardMaterial color="#3b2618" roughness={0.8} />
        </instancedMesh>
    );
}
