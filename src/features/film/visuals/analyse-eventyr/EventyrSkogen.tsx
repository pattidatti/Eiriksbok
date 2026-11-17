import { useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Eventyrskogen i 3D: gården, stien inn i skogen, de tre brødrene og trollet. Alle figurene
 * står der beaten sier, regnet ut fra (modus, beat, tid i beaten), så eleven kan hoppe rett
 * til en beat. Merkelappene er DOM over lerretet, plassert ved å projisere figurene.
 */

type Modus = 'apning' | 'brodre' | 'kontrast' | 'lista';
type Figur = 'per' | 'pal' | 'ask' | 'troll';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const klamp = (x: number) => Math.min(1, Math.max(0, x));
/** 0-1 mellom tid a og b, myk i begge ender. */
function seg(t: number, a: number, b: number) {
    const x = klamp((t - a) / (b - a));
    return x * x * (3 - 2 * x);
}

const HJEM: Record<Exclude<Figur, 'troll'>, THREE.Vector3> = {
    per: v(-3.2, 0, 11.5),
    pal: v(0, 0, 12),
    ask: v(3.2, 0, 12.5),
};
const MOTE = v(0, 0, -1.5);
const TROLL_INNE = v(0, 0, -9);
const TROLL_UTE = v(11, 0, -9);
/** Lysningen der Askeladden og trollet møtes i de to siste modusene. */
const ASK_LYSNING = v(-2.9, 0, 0);
const TROLL_LYSNING = v(3.3, 0, 0);

interface Stilling {
    pos: Record<Figur, THREE.Vector3>;
    /** Retning figuren ser (punkt i verden). */
    ser: Record<Figur, THREE.Vector3>;
    synlig: Record<Figur, boolean>;
    /** Trollet: positiv = lener seg truende fram, negativ = rygger redd. */
    len: number;
    brol: number;
    /** Askeladden ser ut som han går eller løper. */
    gar: Record<Figur, boolean>;
}

/** En bror som går fram til trollet og løper hjem igjen innenfor én beat. */
function turRetur(hjem: THREE.Vector3, t: number) {
    const ut = seg(t, 0.1, 1.7);
    const inn = seg(t, 2.5, 3.9);
    const p = hjem.clone().lerp(MOTE, ut).lerp(hjem, inn);
    const gar = (t > 0.1 && t < 1.7) || (t > 2.5 && t < 3.9);
    return { p, snudd: t > 2.4, gar };
}

function stillingFor(modus: Modus, beat: number, t: number): Stilling {
    const pos: Record<Figur, THREE.Vector3> = {
        per: HJEM.per.clone(),
        pal: HJEM.pal.clone(),
        ask: HJEM.ask.clone(),
        troll: TROLL_UTE.clone(),
    };
    const motTroll = v(0, 0, -20);
    const motHjem = v(0, 0, 30);
    const ser: Record<Figur, THREE.Vector3> = {
        per: motTroll.clone(),
        pal: motTroll.clone(),
        ask: motTroll.clone(),
        troll: v(0, 0, 10),
    };
    const synlig = { per: true, pal: true, ask: true, troll: true };
    const gar = { per: false, pal: false, ask: false, troll: false };
    let len = 0;
    let brol = 0;

    if (modus === 'apning') {
        if (beat === 1) {
            pos.per.lerp(MOTE, seg(t, 0.2, 3));
            gar.per = t > 0.2 && t < 3;
        }
        if (beat === 2) {
            pos.per.copy(MOTE);
            pos.troll.lerp(TROLL_INNE, seg(t, 0, 1.4));
            brol = seg(t, 1.2, 1.8);
        }
        if (beat >= 3) {
            pos.troll.copy(TROLL_INNE);
            pos.per.copy(MOTE).lerp(HJEM.per, seg(t, 0, 2.2));
            ser.per.copy(motHjem);
            gar.per = t < 2.2;
            brol = 0.5;
        }
    }

    if (modus === 'brodre') {
        if (beat >= 1) pos.troll.copy(TROLL_UTE).lerp(TROLL_INNE, beat === 1 ? seg(t, 1.2, 2) : 1);
        if (beat === 1) {
            const r = turRetur(HJEM.per, t);
            pos.per.copy(r.p);
            if (r.snudd) ser.per.copy(motHjem);
            gar.per = r.gar;
            brol = seg(t, 1.8, 2.3) * (1 - seg(t, 3.4, 4));
        }
        if (beat === 2) {
            const r = turRetur(HJEM.pal, t);
            pos.pal.copy(r.p);
            if (r.snudd) ser.pal.copy(motHjem);
            gar.pal = r.gar;
            brol = seg(t, 1.8, 2.3) * (1 - seg(t, 3.4, 4));
        }
        if (beat >= 3) {
            pos.ask.lerp(MOTE, seg(t, 0.2, 2.6));
            gar.ask = t > 0.2 && t < 2.6;
        }
        // Brødrene som har vært ute, står hjemme med ryggen til skogen.
        if (beat >= 2) ser.per.copy(motHjem);
        if (beat >= 3) ser.pal.copy(motHjem);
    }

    if (modus === 'kontrast' || modus === 'lista') {
        synlig.per = false;
        synlig.pal = false;
        pos.ask.copy(ASK_LYSNING);
        pos.troll.copy(TROLL_LYSNING);
        ser.ask.set(TROLL_LYSNING.x, 0, 7);
        ser.troll.set(ASK_LYSNING.x, 0, 6);
        if (modus === 'kontrast' && beat === 0) synlig.ask = false;
        if (modus === 'lista') {
            if (beat === 0) {
                len = 0.22 * seg(t, 0, 1.2);
                brol = seg(t, 0.6, 1.2);
            }
            if (beat === 2) len = -0.2 * seg(t, 0.3, 1.4);
            if (beat >= 3) len = -0.1;
        }
    }
    return { pos, ser, synlig, len, brol, gar };
}

function kameraFor(modus: Modus, beat: number, t: number, s: Stilling) {
    if (modus === 'apning') {
        if (beat === 0) return { pos: v(9 - t * 0.3, 5, 24), se: v(0, 1.8, 11) };
        if (beat === 1) {
            const z = s.pos.per.z;
            return { pos: v(3.2, 3.4, z + 8), se: v(0, 1.8, z - 7) };
        }
        if (beat === 2) return { pos: v(4.5, 3.4, 6), se: v(0, 3.6, -7) };
        return { pos: v(7, 6.5, 25), se: v(0, 2.2, 3) };
    }
    if (modus === 'brodre') return { pos: v(-5, 14, 30), se: v(0, 2, 1) };
    if (modus === 'kontrast') {
        if (beat === 0) return { pos: v(-3, 4.5, 12), se: v(3.3, 4.2, 0) };
        if (beat === 2) return { pos: v(-1, 2.2, 11), se: v(3.3, 4.6, 0) };
        if (beat === 3) return { pos: v(-4.6, 1.9, 6.5), se: v(-2.6, 1.4, 0) };
        return { pos: v(0, 5.4, 22), se: v(0.2, 3.8, 0) };
    }
    // lista
    if (beat === 0) return { pos: v(-8.5, 1.8, 7.5), se: v(2, 4, 0) };
    if (beat === 1) return { pos: v(-3.4, 1.9, 3.2), se: v(-2.1, 1.45, 0.3) };
    if (beat === 2) return { pos: v(-4.5, 3.6, 13), se: v(0.6, 3.4, 0) };
    if (beat === 3) return { pos: v(0.5, 3.6, 13), se: v(1.4, 2.3, 0) };
    return { pos: v(0, 5.4, 22), se: v(0.2, 3.8, 0) };
}

/* ---------- Ting i skogen ---------- */

function Traer() {
    const stammer = useRef<THREE.InstancedMesh>(null);
    const kroner = useRef<THREE.InstancedMesh>(null);
    const plasser = useMemo(() => {
        const ut: { x: number; z: number; h: number }[] = [];
        let n = 0;
        const tilf = () => {
            const x = Math.sin(++n * 12.9898) * 43758.5453;
            return x - Math.floor(x);
        };
        for (let i = 0; i < 70; i++) {
            const z = -40 + tilf() * 58;
            const side = tilf() < 0.5 ? -1 : 1;
            // Tett bak trollets sti, glissent langs stien, og lysningen i midten holdes fri.
            const bak = z < -13;
            const x = bak ? (tilf() - 0.5) * 50 : side * (7 + tilf() * 18);
            if (!bak && Math.abs(x) < 7) continue;
            ut.push({ x, z, h: 7 + tilf() * 6 });
        }
        return ut;
    }, []);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame(() => {
        const s = stammer.current;
        const k = kroner.current;
        if (!s || !k || s.userData.klar) return;
        plasser.forEach((p, i) => {
            o.position.set(p.x, p.h * 0.25, p.z);
            o.scale.set(1, p.h * 0.5, 1);
            o.rotation.set(0, 0, 0);
            o.updateMatrix();
            s.setMatrixAt(i, o.matrix);
            o.position.set(p.x, p.h * 0.62, p.z);
            o.scale.set(p.h * 0.3, p.h * 0.75, p.h * 0.3);
            o.updateMatrix();
            k.setMatrixAt(i, o.matrix);
        });
        s.instanceMatrix.needsUpdate = true;
        k.instanceMatrix.needsUpdate = true;
        s.userData.klar = true;
    });
    return (
        <>
            <instancedMesh
                ref={stammer}
                args={[undefined, undefined, plasser.length]}
                frustumCulled={false}
            >
                <cylinderGeometry args={[0.35, 0.5, 1, 7]} />
                <meshStandardMaterial
                    color="#5b4030"
                    emissive="#2a1a10"
                    emissiveIntensity={0.4}
                    flatShading
                />
            </instancedMesh>
            <instancedMesh
                ref={kroner}
                args={[undefined, undefined, plasser.length]}
                frustumCulled={false}
            >
                <coneGeometry args={[1, 1, 7]} />
                <meshStandardMaterial
                    color="#2f5d34"
                    emissive="#173a1d"
                    emissiveIntensity={0.45}
                    flatShading
                />
            </instancedMesh>
        </>
    );
}

function Gard() {
    return (
        <group position={[5.2, 0, 15]} rotation={[0, -0.4, 0]}>
            <mesh position={[0, 1.4, 0]}>
                <boxGeometry args={[4, 2.8, 3]} />
                <meshStandardMaterial
                    color="#a23b2a"
                    emissive="#5a1d12"
                    emissiveIntensity={0.35}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 3.5, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.6, 1, 1.25]}>
                <coneGeometry args={[2.1, 1.6, 4]} />
                <meshStandardMaterial
                    color="#3f3a33"
                    emissive="#1c1916"
                    emissiveIntensity={0.4}
                    flatShading
                />
            </mesh>
            <mesh position={[-0.6, 1, 1.52]}>
                <boxGeometry args={[0.8, 1.6, 0.05]} />
                <meshStandardMaterial color="#3b2416" />
            </mesh>
            <mesh position={[1.1, 1.7, 1.52]}>
                <boxGeometry args={[0.7, 0.6, 0.05]} />
                <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.8} />
            </mesh>
        </group>
    );
}

function Bakke() {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]}>
                <planeGeometry args={[160, 120]} />
                <meshStandardMaterial color="#557a3c" emissive="#2a4a1c" emissiveIntensity={0.35} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 2]}>
                <planeGeometry args={[2.6, 30]} />
                <meshStandardMaterial color="#9a7448" emissive="#4a3520" emissiveIntensity={0.35} />
            </mesh>
        </group>
    );
}

const BROR_FARGE: Record<Exclude<Figur, 'troll'>, string> = {
    per: '#dc2626',
    pal: '#2563eb',
    ask: '#15803d',
};

function Bror({ hvem }: { hvem: Exclude<Figur, 'troll'> }) {
    const farge = BROR_FARGE[hvem];
    const liten = hvem === 'ask';
    return (
        <group scale={liten ? 0.86 : 1}>
            {[-0.17, 0.17].map((x) => (
                <mesh key={x} position={[x, 0.42, 0]} name="bein">
                    <boxGeometry args={[0.22, 0.84, 0.24]} />
                    <meshStandardMaterial
                        color="#3b2a1c"
                        emissive="#1c140c"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            ))}
            <mesh position={[0, 1.2, 0]}>
                <capsuleGeometry args={[0.32, 0.55, 4, 10]} />
                <meshStandardMaterial
                    color={farge}
                    emissive={farge}
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 1.88, 0]}>
                <sphereGeometry args={[0.27, 12, 10]} />
                <meshStandardMaterial color="#f5c99a" emissive="#8a5a32" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0, 2.12, 0]}>
                <coneGeometry args={[0.28, liten ? 0.5 : 0.3, 8]} />
                <meshStandardMaterial
                    color={liten ? '#7c4a1e' : '#44403c'}
                    emissive="#1c1410"
                    emissiveIntensity={0.4}
                />
            </mesh>
        </group>
    );
}

function Troll({ munn }: { munn: RefObject<THREE.Mesh | null> }) {
    const hud = {
        color: '#6f7d58',
        emissive: '#2f3a22',
        emissiveIntensity: 0.45,
        flatShading: true,
    };
    return (
        <group scale={1.05}>
            {[-0.95, 0.95].map((x) => (
                <mesh key={x} position={[x, 1.1, 0]}>
                    <cylinderGeometry args={[0.6, 0.75, 2.2, 8]} />
                    <meshStandardMaterial {...hud} />
                </mesh>
            ))}
            <mesh position={[0, 3.6, 0]} scale={[2.2, 2.3, 1.8]}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshStandardMaterial {...hud} />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 2.35, 3.4, 0.2]} rotation={[0.2, 0, s * 0.25]}>
                    <cylinderGeometry args={[0.45, 0.55, 3.2, 8]} />
                    <meshStandardMaterial {...hud} />
                </mesh>
            ))}
            <mesh position={[0, 6.1, 0.1]}>
                <sphereGeometry args={[1.35, 12, 10]} />
                <meshStandardMaterial {...hud} />
            </mesh>
            <mesh position={[0, 5.95, 1.35]} scale={[0.6, 0.6, 1]}>
                <sphereGeometry args={[0.75, 10, 8]} />
                <meshStandardMaterial
                    color="#7f8c63"
                    emissive="#3a4428"
                    emissiveIntensity={0.45}
                    flatShading
                />
            </mesh>
            {[-0.5, 0.5].map((x) => (
                <mesh key={x} position={[x, 6.55, 1.12]}>
                    <sphereGeometry args={[0.2, 8, 6]} />
                    <meshStandardMaterial
                        color="#fde047"
                        emissive="#facc15"
                        emissiveIntensity={0.9}
                    />
                </mesh>
            ))}
            <mesh ref={munn} position={[0, 5.35, 1.18]}>
                <boxGeometry args={[0.9, 0.3, 0.2]} />
                <meshStandardMaterial color="#1f1410" />
            </mesh>
            <mesh position={[0, 7.45, -0.1]} rotation={[-0.2, 0, 0]}>
                <coneGeometry args={[0.7, 1.1, 7]} />
                <meshStandardMaterial
                    color="#365314"
                    emissive="#1a2e05"
                    emissiveIntensity={0.4}
                    flatShading
                />
            </mesh>
        </group>
    );
}

const DRAPER = 8;
function Ost({
    beat,
    modus,
    ask,
}: {
    beat: number;
    modus: Modus;
    ask: RefObject<THREE.Group | null>;
}) {
    const ost = useRef<THREE.Mesh>(null);
    const draper = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0);
    const vis = modus === 'lista' && (beat === 1 || beat === 2);
    useFrame((_, delta) => {
        tid.current += Math.min(delta, 0.05);
        const a = ask.current;
        const m = ost.current;
        const d = draper.current;
        if (!a || !m || !d) return;
        // Osten holdes fram i hånda, mot trollet.
        const hand = v(0.55, 1.55, 0).applyMatrix4(a.matrixWorld);
        m.position.copy(hand);
        m.visible = vis;
        d.visible = vis;
        for (let i = 0; i < DRAPER; i++) {
            const fase = (tid.current * 0.9 + i / DRAPER) % 1;
            o.position.set(
                hand.x + Math.sin(i * 2.3) * 0.08,
                hand.y - 0.15 - fase * 1.3,
                hand.z + Math.cos(i * 1.7) * 0.08
            );
            o.scale.setScalar(0.09 * (1 - fase * 0.4));
            o.updateMatrix();
            d.setMatrixAt(i, o.matrix);
        }
        d.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <mesh ref={ost} scale={[1, 0.8 + 0.1 * Math.sin(beat), 1]}>
                <cylinderGeometry args={[0.34, 0.34, 0.34, 14]} />
                <meshStandardMaterial color="#fffbeb" emissive="#e7e0c4" emissiveIntensity={0.6} />
            </mesh>
            <instancedMesh ref={draper} args={[undefined, undefined, DRAPER]} frustumCulled={false}>
                <sphereGeometry args={[1, 8, 6]} />
                <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.9} />
            </instancedMesh>
        </>
    );
}

function Grot({ vis }: { vis: boolean }) {
    // Grøten som renner ut av trollet, ned i en dam på bakken. Ingen kniv, ingen sår.
    return (
        <group visible={vis}>
            <mesh position={[-0.9, 0.25, 1.4]}>
                <cylinderGeometry args={[0.55, 0.35, 0.45, 14]} />
                <meshStandardMaterial color="#8b5a2b" emissive="#3f2410" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-0.9, 0.49, 1.4]}>
                <cylinderGeometry args={[0.5, 0.5, 0.04, 14]} />
                <meshStandardMaterial color="#f3e2b3" emissive="#b8a06a" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[1.95, 1.7, 1.35]}>
                <cylinderGeometry args={[0.16, 0.26, 3.2, 8]} />
                <meshStandardMaterial color="#f3e2b3" emissive="#b8a06a" emissiveIntensity={0.55} />
            </mesh>
            <mesh position={[1.7, 0.04, 1.8]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.5, 1.1, 1]}>
                <circleGeometry args={[1, 20]} />
                <meshStandardMaterial color="#f3e2b3" emissive="#b8a06a" emissiveIntensity={0.55} />
            </mesh>
        </group>
    );
}

/** Lyset under figurene når verden deles i godt og ondt, og lyset over hodet til Askeladden. */
function Kontrastlys({ modus, beat }: { modus: Modus; beat: number }) {
    const delt = (modus === 'kontrast' && beat >= 1) || (modus === 'lista' && beat === 4);
    const fantasi = (modus === 'kontrast' && beat === 4) || (modus === 'lista' && beat === 4);
    return (
        <group visible={delt}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ASK_LYSNING.x, 0.04, 0]}>
                <circleGeometry args={[2.2, 32]} />
                <meshBasicMaterial color="#fde68a" transparent opacity={0.8} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TROLL_LYSNING.x, 0.04, 0]}>
                <circleGeometry args={[3.2, 32]} />
                <meshBasicMaterial color="#3b0d2e" transparent opacity={0.75} />
            </mesh>
            <mesh position={[ASK_LYSNING.x, 2.75, 0]} visible={fantasi}>
                <sphereGeometry args={[0.32, 16, 12]} />
                <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.6} />
            </mesh>
        </group>
    );
}

/* ---------- Regi ---------- */

interface Delt {
    pos: Partial<Record<string, THREE.Vector3>>;
}

function Regi({
    modus,
    beat,
    playing,
    delt,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    delt: RefObject<Delt>;
}) {
    const { camera } = useThree();
    const askRef = useRef<THREE.Group>(null);
    const perRef = useRef<THREE.Group>(null);
    const palRef = useRef<THREE.Group>(null);
    const trollRef = useRef<THREE.Group>(null);
    const refs = { per: perRef, pal: palRef, ask: askRef, troll: trollRef };
    const lean = useRef<THREE.Group>(null);
    const munn = useRef<THREE.Mesh>(null);
    const se = useRef(new THREE.Vector3());
    const forrige = useRef(-1);
    const beatTid = useRef(0);
    const klokke = useRef(0);
    const forste = useRef(true);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        klokke.current += dt;
        const t = beatTid.current;
        const s = stillingFor(modus, beat, t);

        (Object.keys(refs) as Figur[]).forEach((f) => {
            const g = refs[f].current;
            if (!g) return;
            g.position.copy(s.pos[f]);
            g.visible = s.synlig[f] && !(f === 'troll' && s.pos.troll.x > 10.5);
            const retn = s.ser[f].clone().sub(s.pos[f]);
            g.rotation.y = Math.atan2(retn.x, retn.z);
            // Små hopp i gangen, så figurene ser ut til å gå.
            if (s.gar[f]) g.position.y = Math.abs(Math.sin(klokke.current * 9)) * 0.12;
            delt.current.pos[f] = g.position.clone();
        });
        if (lean.current) lean.current.rotation.x = s.len;
        if (munn.current) munn.current.scale.y = 1 + s.brol * 2.6;

        const k = kameraFor(modus, beat, t, s);
        if (forste.current) {
            camera.position.copy(k.pos);
            se.current.copy(k.se);
            forste.current = false;
        } else {
            const f = 1 - Math.exp(-1.6 * dt);
            camera.position.lerp(k.pos, f);
            se.current.lerp(k.se, f);
        }
        camera.lookAt(se.current);
    });

    return (
        <>
            {(['per', 'pal', 'ask'] as const).map((h) => (
                <group key={h} ref={refs[h]} position={HJEM[h]}>
                    <Bror hvem={h} />
                </group>
            ))}
            <group ref={trollRef} position={TROLL_UTE}>
                {/* Trollet ser langs sin egen z-akse; lening er rotasjon om x i trollets eget rom. */}
                <group ref={lean}>
                    <Troll munn={munn} />
                </group>
            </group>
            <Ost beat={beat} modus={modus} ask={askRef} />
            <Grot vis={modus === 'lista' && beat === 3} />
            <Kontrastlys modus={modus} beat={beat} />
        </>
    );
}

/** Flytter DOM-merkelappene til der figurene står i bildet. */
function Projektor({
    delt,
    merker,
    el,
}: {
    delt: RefObject<Delt>;
    merker: Merke[];
    el: RefObject<Map<string, HTMLDivElement>>;
}) {
    const { camera } = useThree();
    useFrame(() => {
        for (const m of merker) {
            if (!m.anker) continue;
            const d = el.current.get(m.id);
            const p = delt.current.pos[m.anker];
            if (!d || !p) continue;
            const q = p
                .clone()
                .add(v(0, m.hoyde ?? 2.6, 0))
                .project(camera);
            d.style.left = `${((q.x + 1) / 2) * 100}%`;
            d.style.top = `${((1 - q.y) / 2) * 100}%`;
        }
    });
    return null;
}

/* ---------- Merkelapper ---------- */

interface Merke {
    id: string;
    tekst: string;
    under?: string;
    tone: 'lys' | 'mork' | 'gull' | 'rod';
    /** Figuren merket står over, eller fast plass i prosent. */
    anker?: Figur;
    hoyde?: number;
    x?: number;
    y?: number;
}

const NAVN: Record<Exclude<Figur, 'troll'>, string> = { per: 'Per', pal: 'Pål', ask: 'Askeladden' };

function merkerFor(modus: Modus, beat: number): Merke[] {
    const navn = (f: Exclude<Figur, 'troll'>, tone: Merke['tone'] = 'lys'): Merke => ({
        id: f,
        tekst: NAVN[f],
        tone,
        anker: f,
        hoyde: 2.6,
    });
    if (modus === 'apning') {
        if (beat === 0) return [navn('per'), { ...navn('pal'), hoyde: 3.4 }, navn('ask')];
        if (beat === 1) return [navn('per')];
        if (beat === 2)
            return [
                { id: 'troll', tekst: 'Trollet', tone: 'rod', anker: 'troll', hoyde: 8.6 },
                navn('per'),
            ];
        return [{ id: 'hjem', tekst: 'Per løper hjem', tone: 'lys', anker: 'per', hoyde: 2.6 }];
    }
    if (modus === 'brodre') {
        const ut: Merke[] = [navn('per'), { ...navn('pal'), hoyde: 3.4 }, navn('ask', 'gull')];
        if (beat >= 1)
            ut.push({ id: 'troll', tekst: 'Trollet', tone: 'rod', anker: 'troll', hoyde: 8.6 });
        return ut;
    }
    if (modus === 'kontrast') {
        if (beat === 0)
            return [
                {
                    id: 'sp',
                    tekst: 'Snill innerst inne?',
                    under: 'slik er skurker ofte i film',
                    tone: 'lys',
                    x: 4,
                    y: 8,
                },
            ];
        if (beat === 1)
            return [
                { id: 'godt', tekst: 'Godt', tone: 'gull', anker: 'ask', hoyde: 2.4 },
                { id: 'ondt', tekst: 'Ondt', tone: 'mork', anker: 'troll', hoyde: 8.9 },
            ];
        if (beat === 2)
            return [
                {
                    id: 'stor',
                    tekst: 'Enormt',
                    under: 'en naturkraft som truer mennesket',
                    tone: 'mork',
                    x: 4,
                    y: 8,
                },
            ];
        if (beat === 3)
            return [
                {
                    id: 'liten',
                    tekst: 'Liten',
                    under: 'mennesket på sitt svakeste',
                    tone: 'gull',
                    x: 4,
                    y: 8,
                },
            ];
        return [
            { id: 'fantasi', tekst: 'Fantasien', tone: 'gull', anker: 'ask', hoyde: 3.4 },
            { id: 'muskler', tekst: 'Musklene', tone: 'rod', anker: 'troll', hoyde: 8.9 },
        ];
    }
    // lista
    if (beat === 0) return [{ id: 'trussel', tekst: 'Trollet truer', tone: 'rod', x: 58, y: 8 }];
    if (beat === 1)
        return [
            {
                id: 'ost',
                tekst: 'En hvitost',
                under: 'han klemmer ut vannet',
                tone: 'lys',
                x: 4,
                y: 8,
            },
        ];
    if (beat === 2)
        return [
            {
                id: 'tror',
                tekst: 'Trollet tror:',
                under: 'han klemmer vann ut av en stein',
                tone: 'lys',
                x: 4,
                y: 8,
            },
            { id: 'redd', tekst: 'Trollet blir redd', tone: 'rod', x: 60, y: 8 },
        ];
    if (beat === 3)
        return [
            {
                id: 'grot',
                tekst: 'Grøten renner ut',
                under: 'trollet ble lurt',
                tone: 'lys',
                x: 4,
                y: 8,
            },
        ];
    return [
        { id: 'hode', tekst: 'Hode', under: 'forstand', tone: 'gull', anker: 'ask', hoyde: 3.2 },
        { id: 'mage', tekst: 'Mage', under: 'rå makt', tone: 'rod', anker: 'troll', hoyde: 2.2 },
    ];
}

const TONE: Record<Merke['tone'], string> = {
    lys: 'bg-white/95 text-slate-900',
    mork: 'bg-slate-900/90 text-white',
    gull: 'bg-amber-300/95 text-slate-900',
    rod: 'bg-red-700/95 text-white',
};

/** Forsøkene i tretallsloven, som brikker øverst. */
function Forsok({ beat }: { beat: number }) {
    const rader = [
        { n: 1, navn: 'Per', utfall: 'løper hjem', fraBeat: 1, tone: 'bg-red-700/95 text-white' },
        { n: 2, navn: 'Pål', utfall: 'løper hjem', fraBeat: 2, tone: 'bg-red-700/95 text-white' },
        {
            n: 3,
            navn: 'Askeladden',
            utfall: 'vil prøve',
            fraBeat: 3,
            tone: 'bg-amber-300/95 text-slate-900',
        },
    ];
    return (
        <div className="absolute flex gap-3" style={{ left: '3%', bottom: '4%' }}>
            {rader.map((r) => (
                <div
                    key={r.n}
                    className={`rounded-2xl shadow-xl px-4 py-2 transition-all duration-700 ${beat >= r.fraBeat ? r.tone : 'bg-white/70 text-slate-500'}`}
                >
                    <div className="text-sm font-bold uppercase tracking-wider">Forsøk {r.n}</div>
                    <div
                        className="text-xl font-black leading-tight"
                        style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                    >
                        {r.navn}
                        {beat >= r.fraBeat ? `: ${r.utfall}` : ''}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function EventyrSkogen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'apning';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const delt = useRef<Delt>({ pos: {} });
    const el = useRef(new Map<string, HTMLDivElement>());
    const merker = merkerFor(modus, beat);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [9, 5, 24] }}
            >
                <color attach="background" args={['#c9c6a8']} />
                <fog attach="fog" args={['#c9c6a8', 28, 75]} />
                <hemisphereLight args={['#fff7e0', '#2f3a22', 1.0]} />
                <directionalLight position={[-15, 25, 20]} intensity={1.3} color="#ffe2b0" />
                <Regi modus={modus} beat={beat} playing={playing} delt={delt} />
                <Projektor delt={delt} merker={merker} el={el} />
                <Bakke />
                <Traer />
                {(modus === 'apning' || modus === 'brodre') && <Gard />}
            </Canvas>
            {modus === 'brodre' && <Forsok beat={beat} />}
            {merker.map((m) => (
                <div
                    key={`${modus}-${m.id}`}
                    ref={(d) => {
                        if (d) el.current.set(m.id, d);
                        else el.current.delete(m.id);
                    }}
                    className="absolute"
                    style={
                        m.anker
                            ? { left: '-50%', top: '-50%' }
                            : { left: `${m.x}%`, top: `${m.y}%` }
                    }
                >
                    <div style={m.anker ? { transform: 'translate(-50%, -100%)' } : undefined}>
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: m.anker ? 0.4 : 0.2 }}
                            className={`rounded-2xl shadow-xl px-4 py-2 whitespace-nowrap ${TONE[m.tone]}`}
                        >
                            <div
                                className="text-2xl font-black leading-tight"
                                style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                            >
                                {m.tekst}
                            </div>
                            {m.under && (
                                <div className="text-lg font-semibold opacity-90">{m.under}</div>
                            )}
                        </motion.div>
                    </div>
                </div>
            ))}
        </div>
    );
}
