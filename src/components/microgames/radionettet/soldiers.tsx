import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isAir, slagDef, type G } from './game';
import { HIP, LOOK, SQUAD, figureMaterial, soldierParts, type Look, type Post } from './models';
import { enemyYaw, hlOn, unitYaw, type Hl } from './hl';
import type { Speed } from './world';
import { lift } from './ground';
import { SLAG, type SlagDef } from './levels';

/** Slaget som tegnes nå (soldatene står på åsene). */
const CUR: { def: SlagDef } = { def: SLAG[0] };

// Soldatene: infanteriet og mannskapet ved kanonene, tegnet som instanser (tre draw calls
// per side). Hver soldat har egen gange, kneler og sikter, rykker i rekylen litt etter de
// andre, og faller når troppen tar skade: en tropp på fire med halv styrke har to liggende.

const MAX = 160;
const FIG = 1.05;
const M = new THREE.Matrix4();
const H = new THREE.Matrix4();
const L = new THREE.Matrix4();
const T = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const P = new THREE.Vector3();
const S = new THREE.Vector3(1, 1, 1);
const WHITE = new THREE.Color(1, 1, 1);
const BRIGHT = new THREE.Color(1.55, 1.5, 1.3);

interface Man {
    down: boolean;
    /** Tid siden han falt (negativ = faller straks). */
    fallT: number;
    /** Faller bakover (1) eller forover (-1). */
    fallDir: number;
    /** Nedtelling til hans eget skudd, og rekylen etter det. */
    shotT: number;
    recoil: number;
    ph: number;
    jit: number;
    /** Troppens klokke da han kom (fallskjermsoldater hopper ned fra da). */
    born: number;
}

/** Fallskjermhoppet: sekunder i lufta, og hvor høyt de starter (figurmål). */
const DROP = 1.7;
const DROP_H = 2.6;

interface Squad {
    men: Man[];
    lastKick: number;
    /** Sekunder siden troppen sist skjøt. */
    fired: number;
    px: number;
    pz: number;
    moving: boolean;
    t: number;
}

function newMan(i: number, id: number, born: number): Man {
    const r = Math.sin(id * 12.9898 + i * 78.233) * 43758.5453;
    const f = r - Math.floor(r);
    // Hopperne lander litt etter hverandre.
    return { down: false, fallT: 0, fallDir: f < 0.6 ? 1 : -1, shotT: 99, recoil: 0, ph: f * 6.28, jit: (f - 0.5) * 0.5, born: born + f * 0.5 };
}

interface Out {
    rifle: THREE.InstancedMesh;
    crew: THREE.InstancedMesh;
    leg: THREE.InstancedMesh;
    chute: THREE.InstancedMesh | null;
    nr: number;
    nc: number;
    nl: number;
    nch: number;
}
const C = new THREE.Matrix4();

/** Legger én soldat inn i instansene. `base` er figurens plass og retning. */
function pose(o: Out, base: THREE.Matrix4, post: Post, m: Man, sq: Squad, crew: boolean, gunner: boolean, engaged: boolean, hi: boolean, para: boolean) {
    const [ox, oz, kneeler] = post;
    T.makeRotationY(m.jit * (engaged ? 0.3 : 1));
    T.setPosition(ox, 0, oz);
    M.multiplyMatrices(base, T);
    let hip = HIP;
    let lean = 0;
    let legA = 0;
    let legB = 0;
    let sink = 0;
    if (m.down && m.fallT >= 0) {
        // Faller om og blir liggende; synker i bakken etter en stund.
        const k = Math.min(1, m.fallT / 0.45);
        const f = 1 - (1 - k) * (1 - k);
        hip = HIP * (1 - f) + 0.035 * f;
        lean = m.fallDir * f * 1.5;
        legA = legB = m.fallDir * f * 0.2;
        sink = Math.max(0, m.fallT - 9) * 0.06;
        if (sink > 0.2) return;
    } else if (sq.moving && !crew) {
        // Gange: beina svinger, hofta hopper, overkroppen lener fram.
        const w = sq.t * 9 + m.ph;
        legA = Math.sin(w) * 0.55;
        legB = -legA;
        hip += Math.abs(Math.cos(w)) * 0.016;
        lean = -0.14;
    } else if (engaged && kneeler) {
        hip = 0.1;
        legA = 1.35;
        legB = -0.55;
        lean = -0.05;
    } else {
        // Står og puster; ser seg rundt når det er stille.
        hip += Math.sin(sq.t * 2 + m.ph) * 0.003;
        lean = engaged ? -0.06 : Math.sin(sq.t * 0.7 + m.ph) * 0.04;
    }
    // Ladeskytteren ved kanonen bøyer seg etter nye granater.
    if (crew && gunner && engaged && !m.down) lean -= Math.max(0, Math.sin(sq.t * 3.2 + m.ph)) * 0.45;
    lean += m.recoil * (crew ? 0.35 : 0.28);
    // Fallskjermhopp: sveiver ned under kuppelen, beina samlet; kuppelen synker sammen etter landing.
    const air = para ? (sq.t - m.born) / DROP : 2;
    let drop = 0;
    if (air < 1) {
        drop = DROP_H * (1 - air) ** 1.4;
        legA = legB = Math.sin(sq.t * 3 + m.ph) * 0.12;
        lean = Math.sin(sq.t * 1.7 + m.ph) * 0.12;
    }
    H.compose(P.set(0, hip - sink + drop, 0), Q.setFromEuler(E.set(0, 0, lean)), S);
    M.multiply(H);
    if (para && o.chute && air < 1.9 && o.nch < MAX) {
        // Kuppelen folder seg ut (første femtedel), bærer ham ned, og legger seg på bakken.
        const open = Math.min(1, Math.max(0.15, air * 5));
        const land = Math.max(0, (air - 1) / 0.9);
        C.compose(P.set(-land * 0.35, 0.72 * (1 - land) + 0.03, 0), Q.setFromEuler(E.set(land * 1.2, 0, -lean - land * 0.3)), S.set(open, open * (1 - land * 0.85), open));
        S.set(1, 1, 1);
        C.premultiply(M);
        o.chute.setMatrixAt(o.nch++, C);
    }
    const up = crew ? o.crew : o.rifle;
    const ui = crew ? o.nc++ : o.nr++;
    if (ui >= MAX) return;
    up.setMatrixAt(ui, M);
    up.setColorAt(ui, hi ? BRIGHT : WHITE);
    for (const [dz, a] of [[0.035, legA], [-0.035, legB]] as const) {
        if (o.nl >= MAX * 2) return;
        L.compose(P.set(0, 0, dz), Q.setFromEuler(E.set(0, 0, a)), S);
        L.premultiply(M);
        o.leg.setMatrixAt(o.nl, L);
        o.leg.setColorAt(o.nl++, hi ? BRIGHT : WHITE);
    }
}

interface Ctx {
    squads: Map<number, Squad>;
    seen: Set<number>;
    o: Out;
    base: THREE.Matrix4;
    dt: number;
}

/** Én tropp eller ett mannskap: skudd, fall og posene til hver soldat. */
function squad(c: Ctx, id: number, kind: string, x: number, z: number, yaw: number, hp: number, maxHp: number, dead: boolean, kick: number, copies: number, hidden: boolean, hi: boolean) {
    const posts = SQUAD[kind];
    if (!posts) return;
    c.seen.add(id);
    const n = kind === 'inf' || kind === 'fsk' ? Math.min(posts.length, 4 + (copies - 1) * 2) : posts.length;
    let sq = c.squads.get(id);
    if (!sq) {
        sq = { men: [], lastKick: 0, fired: 99, px: x, pz: z, moving: false, t: 0 };
        c.squads.set(id, sq);
    }
    while (sq.men.length < n) sq.men.push(newMan(sq.men.length, id, sq.t));
    sq.t += c.dt;
    sq.fired += c.dt;
    if (c.dt > 0) {
        const d2 = (x - sq.px) ** 2 + (z - sq.pz) ** 2;
        sq.moving = d2 > 1e-7;
        sq.px = x;
        sq.pz = z;
    }
    // Et skudd fra troppen: hver soldat trykker av litt etter de andre.
    if (kick > 0.9 && sq.lastKick <= 0.9) {
        sq.fired = 0;
        for (const m of sq.men) m.shotT = Math.random() * 0.35;
    }
    sq.lastKick = kick;
    // Infanteriet: så mange står som troppen har styrke til. Mannskapet faller når kanonen ryker.
    const standing = dead ? 0 : kind === 'inf' || kind === 'einf' || kind === 'fsk' ? Math.max(1, Math.ceil((hp / maxHp) * n - 0.01)) : n;
    sq.men.forEach((m, i) => {
        if (i >= standing && !m.down) {
            m.down = true;
            m.fallT = -Math.random() * 0.3;
        } else if (i < standing && m.down) m.down = false;
        if (m.down) m.fallT += c.dt;
        if (m.shotT < 99) {
            m.shotT -= c.dt;
            if (m.shotT <= 0) {
                m.shotT = 99;
                m.recoil = 1;
            }
        }
        m.recoil = Math.max(0, m.recoil - c.dt * 6);
    });
    if (hidden) return;
    c.base.compose(P.set(x, lift(CUR.def, x, z), z), Q.setFromEuler(E.set(0, yaw, 0)), S.setScalar(FIG));
    S.set(1, 1, 1);
    const isCrew = kind !== 'inf' && kind !== 'einf' && kind !== 'fsk';
    const engaged = sq.fired < 3;
    for (let i = 0; i < n; i++) pose(c.o, c.base, posts[i], sq.men[i], sq, isCrew, i === 1, engaged, hi, kind === 'fsk');
}

function Side({ gRef, speedRef, hlRef, fiende, look }: { gRef: React.MutableRefObject<G>; speedRef: Speed; hlRef: React.MutableRefObject<Hl>; fiende: boolean; look: Look }) {
    const parts = useMemo(() => soldierParts(look, fiende), [look, fiende]);
    const rifleRef = useRef<THREE.InstancedMesh>(null);
    const crewRef = useRef<THREE.InstancedMesh>(null);
    const legRef = useRef<THREE.InstancedMesh>(null);
    const chuteRef = useRef<THREE.InstancedMesh>(null);
    const chuteGeo = useMemo(() => {
        const g = new THREE.SphereGeometry(0.34, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.2);
        g.scale(1, 0.62, 1);
        return g;
    }, []);
    const squads = useRef(new Map<number, Squad>());
    const lastSlag = useRef(-1);
    useFrame((st, raw) => {
        const rifle = rifleRef.current;
        const crew = crewRef.current;
        const leg = legRef.current;
        if (!rifle || !crew || !leg) return;
        const g = gRef.current;
        CUR.def = slagDef(g);
        const dt = Math.min(0.05, raw) * speedRef.current;
        if (g.slag !== lastSlag.current) {
            lastSlag.current = g.slag;
            squads.current.clear();
        }
        const o: Out = { rifle, crew, leg, chute: chuteRef.current, nr: 0, nc: 0, nl: 0, nch: 0 };
        const c: Ctx = { squads: squads.current, seen: new Set<number>(), o, base: new THREE.Matrix4(), dt };
        const blink = Math.sin(st.clock.elapsedTime * 3) > 0.6;
        if (fiende) {
            for (const e of g.enemies) {
                if (e.passed || !SQUAD[e.kind]) continue;
                const hidden = e.dug && !g.netSeen.has(e.id) && (e.kind === 'ebatt' ? e.kick <= 0.25 : !blink);
                squad(c, -1 - e.id, e.kind, e.x, e.z, enemyYaw.get(e.id) ?? Math.PI, e.hp, e.maxHp, e.dead, e.kick, 1, hidden, false);
            }
        } else {
            const hl = hlRef.current;
            for (const u of g.units) if (!isAir(u.kind)) squad(c, u.id, u.kind, u.x, u.z, unitYaw.get(u.id) ?? 0, u.hp, u.maxHp, u.dead, u.kick, u.copies, false, hlOn(hl, u.id));
        }
        for (const id of squads.current.keys()) if (!c.seen.has(id)) squads.current.delete(id);
        for (const [m, n] of [[rifle, o.nr], [crew, o.nc], [leg, o.nl]] as const) {
            m.count = n;
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
        if (o.chute) {
            o.chute.count = o.nch;
            o.chute.instanceMatrix.needsUpdate = true;
        }
    });
    const mat = figureMaterial();
    return (
        <>
            <instancedMesh ref={rifleRef} args={[parts.rifle, mat, MAX]} frustumCulled={false} castShadow receiveShadow />
            <instancedMesh ref={crewRef} args={[parts.crew, mat, MAX]} frustumCulled={false} castShadow receiveShadow />
            <instancedMesh ref={legRef} args={[parts.leg, mat, MAX * 2]} frustumCulled={false} castShadow receiveShadow />
            {!fiende && (
                <instancedMesh ref={chuteRef} args={[chuteGeo, undefined, MAX]} frustumCulled={false} castShadow>
                    <meshStandardMaterial color="#d6d0b6" roughness={0.85} side={THREE.DoubleSide} />
                </instancedMesh>
            )}
        </>
    );
}

export function Soldiers({ gRef, speedRef, hlRef }: { gRef: React.MutableRefObject<G>; speedRef: Speed; hlRef: React.MutableRefObject<Hl> }) {
    const [look, setLook] = useState<Look>('kyst');
    useFrame(() => {
        const l = LOOK[slagDef(gRef.current).id] ?? 'kyst';
        if (l !== look) setLook(l);
    });
    return (
        <>
            <Side key={`e${look}`} gRef={gRef} speedRef={speedRef} hlRef={hlRef} fiende look={look} />
            <Side key={`u${look}`} gRef={gRef} speedRef={speedRef} hlRef={hlRef} fiende={false} look={look} />
        </>
    );
}
