import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Roma i 3D, bygd av enkle former. Fire moduser:
 * - myte: Tiberen en kveld, kurven med tvillingene, hunnulven, plogfuren rundt én høyde
 * - hoydene: landsbyer på sju høyder ved elva, palisader, en båt med salt, ett fellesskap
 * - streik: plebeierne går ut av byen og opp på en høyde i nærheten
 * - cannae: hærene som klosser, midten som gir etter og fløyene som lukker seg
 */

type Modus = 'myte' | 'hoydene' | 'streik' | 'cannae';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const klemme = (x: number) => Math.min(1, Math.max(0, x));
const glatt = (x: number) => {
    const k = klemme(x);
    return k * k * (3 - 2 * k);
};

/** Enkel seedet tilfeldighet, så landsbyene står likt hver gang. */
function lagTilfeldig(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

// ---------- Landskapet ----------

interface Hoyde {
    x: number;
    z: number;
    r: number;
    h: number;
}

/** De sju høydene øst for elva. Nummereres 1-7 i bildet. */
const HOYDER: Hoyde[] = [
    { x: -2.6, z: 0, r: 2.0, h: 1.6 },
    { x: 0.8, z: 2.8, r: 2.2, h: 1.8 },
    { x: -1.4, z: 7.6, r: 2.3, h: 1.6 },
    { x: 4.6, z: 6.2, r: 2.2, h: 1.5 },
    { x: 6.6, z: -0.4, r: 2.6, h: 1.7 },
    { x: 4.2, z: -4.8, r: 2.0, h: 1.5 },
    { x: 0.6, z: -7.4, r: 2.4, h: 1.6 },
];
/** Høyden plebeierne går ut til under streiken. */
const STREIKHOYDE: Hoyde = { x: 17, z: -15, r: 3.4, h: 2.2 };

function hoydeVed(x: number, z: number, medStreik: boolean) {
    let y = 0;
    const alle = medStreik ? [...HOYDER, STREIKHOYDE] : HOYDER;
    for (const h of alle) {
        const d = Math.hypot(x - h.x, z - h.z) / h.r;
        if (d < 1) y = Math.max(y, h.h * Math.sqrt(1 - d * d));
    }
    return y;
}

const ELV_PUNKTER = [
    v(-6, 0, -24),
    v(-6.4, 0, -10),
    v(-7.4, 0, -2),
    v(-6.4, 0, 3.5),
    v(-5.6, 0, 8.5),
    v(-7.4, 0, 14),
    v(-10, 0, 24),
];
const ELV = new THREE.CatmullRomCurve3(ELV_PUNKTER);

function lagElvGeometri() {
    const n = 120;
    const bredde = 1.5;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
        const u = i / n;
        const p = ELV.getPointAt(u);
        const t = ELV.getTangentAt(u);
        const nx = -t.z;
        const nz = t.x;
        pos.push(
            p.x + nx * bredde,
            0.03,
            p.z + nz * bredde,
            p.x - nx * bredde,
            0.03,
            p.z - nz * bredde
        );
        if (i < n) {
            const a = i * 2;
            idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
}

/** Et punkt på elvebredden (side = 1 er østsiden). */
function bredd(u: number, side: number, avstand = 1.9) {
    const p = ELV.getPointAt(u);
    const t = ELV.getTangentAt(u);
    return v(p.x - t.z * side * avstand, 0, p.z + t.x * side * avstand);
}

interface Hytte {
    x: number;
    y: number;
    z: number;
    hoyde: number;
    rot: number;
}

function lagHytter(): Hytte[] {
    const rnd = lagTilfeldig(7);
    const ut: Hytte[] = [];
    HOYDER.forEach((h, hi) => {
        const antall = 6;
        for (let i = 0; i < antall; i++) {
            const a = (i / antall) * Math.PI * 2 + rnd() * 0.6;
            const r = h.r * (0.18 + rnd() * 0.42);
            const x = h.x + Math.cos(a) * r;
            const z = h.z + Math.sin(a) * r;
            ut.push({ x, y: hoydeVed(x, z, false), z, hoyde: hi, rot: rnd() * Math.PI });
        }
    });
    return ut;
}

/** Hvilke høyder som har hytter i hver modus og beat. */
function hytteSynlig(modus: Modus, beat: number, hoyde: number) {
    if (modus === 'myte') return beat >= 3 && hoyde === 1;
    if (modus === 'hoydene') return beat === 0 ? hoyde === 1 : true;
    if (modus === 'streik') return true;
    return false;
}

function Hytter({ modus, beat }: { modus: Modus; beat: number }) {
    const hytter = useMemo(() => lagHytter(), []);
    const vegg = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const skala = useRef<number[]>(hytter.map(() => 0));
    const forste = useRef(true);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        hytter.forEach((h, i) => {
            const mal = hytteSynlig(modus, beat, h.hoyde) ? 1 : 0;
            skala.current[i] = forste.current ? mal : damp(skala.current[i], mal, 3 + (i % 5), dt);
            const s = Math.max(0.0001, skala.current[i]);
            o.position.set(h.x, h.y + 0.22 * s, h.z);
            o.rotation.set(0, h.rot, 0);
            o.scale.set(s, s, s);
            o.updateMatrix();
            vegg.current?.setMatrixAt(i, o.matrix);
            o.position.set(h.x, h.y + 0.6 * s, h.z);
            o.updateMatrix();
            tak.current?.setMatrixAt(i, o.matrix);
        });
        forste.current = false;
        if (vegg.current) vegg.current.instanceMatrix.needsUpdate = true;
        if (tak.current) tak.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh
                ref={vegg}
                args={[undefined, undefined, hytter.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[0.55, 0.44, 0.45]} />
                <meshStandardMaterial color="#d6b98a" flatShading />
            </instancedMesh>
            <instancedMesh
                ref={tak}
                args={[undefined, undefined, hytter.length]}
                frustumCulled={false}
            >
                <coneGeometry args={[0.46, 0.4, 4]} />
                <meshStandardMaterial color="#8a5a2b" flatShading />
            </instancedMesh>
        </>
    );
}

/** Palisader rundt hver høyde: en ring av påler. */
function Palisader({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const s = useRef(0);
    const PALER = 18;
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        s.current = damp(s.current, synlig ? 1 : 0, 2.5, dt);
        const m = ref.current;
        if (!m) return;
        HOYDER.forEach((h, hi) => {
            for (let i = 0; i < PALER; i++) {
                const a = (i / PALER) * Math.PI * 2;
                const x = h.x + Math.cos(a) * h.r * 0.78;
                const z = h.z + Math.sin(a) * h.r * 0.78;
                const y = hoydeVed(x, z, false);
                o.position.set(x, y + 0.3 * s.current, z);
                o.scale.set(1, Math.max(0.0001, s.current), 1);
                o.updateMatrix();
                m.setMatrixAt(hi * PALER + i, o.matrix);
            }
        });
        m.instanceMatrix.needsUpdate = true;
        m.visible = s.current > 0.01;
    });
    return (
        <instancedMesh
            ref={ref}
            args={[undefined, undefined, HOYDER.length * PALER]}
            frustumCulled={false}
        >
            <cylinderGeometry args={[0.07, 0.07, 0.6, 5]} />
            <meshStandardMaterial color="#5b3a1e" flatShading />
        </instancedMesh>
    );
}

function Hoydene({ streik }: { streik: boolean }) {
    return (
        <>
            {(streik ? [...HOYDER, STREIKHOYDE] : HOYDER).map((h, i) => (
                <mesh key={i} position={[h.x, 0, h.z]} scale={[h.r, h.h, h.r]}>
                    <sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={i === 7 ? '#a9b86a' : '#8fae5b'} flatShading />
                </mesh>
            ))}
        </>
    );
}

function Elva({ kveld }: { kveld: boolean }) {
    const g = useMemo(() => lagElvGeometri(), []);
    return (
        <mesh geometry={g}>
            <meshStandardMaterial
                color={kveld ? '#3d6ea8' : '#3b82c4'}
                emissive={kveld ? '#3a3f6b' : '#123a63'}
                emissiveIntensity={0.5}
                roughness={0.35}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ---------- Myten ----------

function Kurv({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const u = useRef(0.22);
    const tid = useRef(0);
    const forrige = useRef(beat);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const g = ref.current;
        if (!g) return;
        const mal = beat === 0 ? 0.22 : beat === 1 ? 0.22 + Math.min(tid.current, 9) * 0.03 : 0.52;
        u.current = beat === 1 ? mal : damp(u.current, mal, 1.5, dt || 0.016);
        const p = ELV.getPointAt(u.current);
        const tilBredd = beat >= 2 ? 1.75 : 0;
        const t = ELV.getTangentAt(u.current);
        g.position.set(
            p.x - t.z * tilBredd,
            0.12 + Math.sin(tid.current * 2) * 0.03,
            p.z + t.x * tilBredd
        );
        g.rotation.y = tid.current * 0.2;
        g.visible = beat <= 2;
    });
    return (
        <group ref={ref}>
            <mesh>
                <cylinderGeometry args={[0.42, 0.34, 0.26, 12]} />
                <meshStandardMaterial color="#a0702f" flatShading />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
                <cylinderGeometry args={[0.36, 0.36, 0.04, 12]} />
                <meshStandardMaterial color="#f5ecd8" />
            </mesh>
        </group>
    );
}

/** Hunnulven, bygd av klosser. */
function Ulv({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const s = useRef(0);
    const pos = useMemo(() => bredd(0.52, 1, 2.9), []);
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        s.current = damp(s.current, synlig ? 1 : 0, 2.2, dt);
        const g = ref.current;
        if (!g) return;
        g.scale.setScalar(Math.max(0.0001, s.current));
        g.visible = s.current > 0.02;
    });
    const farge = '#9ca3af';
    return (
        <group ref={ref} position={[pos.x, 0, pos.z]} rotation={[0, Math.PI * 0.85, 0]}>
            <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[1.1, 0.42, 0.42]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0.68, 0.72, 0]}>
                <boxGeometry args={[0.38, 0.34, 0.34]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0.92, 0.66, 0]}>
                <boxGeometry args={[0.22, 0.16, 0.2]} />
                <meshStandardMaterial color="#4b5563" flatShading />
            </mesh>
            {[-0.1, 0.1].map((z) => (
                <mesh key={z} position={[0.64, 0.94, z]}>
                    <coneGeometry args={[0.07, 0.18, 4]} />
                    <meshStandardMaterial color="#4b5563" flatShading />
                </mesh>
            ))}
            {[
                [-0.4, -0.13],
                [-0.4, 0.13],
                [0.4, -0.13],
                [0.4, 0.13],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 0.2, z]}>
                    <boxGeometry args={[0.12, 0.4, 0.12]} />
                    <meshStandardMaterial color={farge} flatShading />
                </mesh>
            ))}
            <mesh position={[-0.68, 0.6, 0]} rotation={[0, 0, 0.6]}>
                <boxGeometry args={[0.42, 0.12, 0.12]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
        </group>
    );
}

/** Plogfuren rundt én høyde: grensen Romulus trakk ifølge sagnet. */
function Plogfure({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const s = useRef(0);
    const h = HOYDER[1];
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        s.current = damp(s.current, synlig ? 1 : 0, 1.2, dt);
        const m = ref.current;
        if (!m) return;
        const k = Math.max(0.0001, s.current);
        m.scale.set(k, k, 1);
        m.visible = s.current > 0.02;
    });
    return (
        <mesh ref={ref} position={[h.x, 0.05, h.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[h.r + 0.25, h.r + 0.6, 48]} />
            <meshStandardMaterial color="#6b4423" side={THREE.DoubleSide} />
        </mesh>
    );
}

// ---------- Handel og fellesskap ----------

function Bat({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const u = useRef(0.8);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        g.visible = synlig;
        if (!synlig) {
            u.current = 0.8;
            return;
        }
        u.current = Math.max(0.58, u.current - dt * 0.02);
        const p = ELV.getPointAt(u.current);
        const t = ELV.getTangentAt(u.current);
        g.position.set(p.x, 0.12, p.z);
        g.rotation.y = Math.atan2(-t.x, -t.z);
    });
    return (
        <group ref={ref}>
            <mesh>
                <boxGeometry args={[0.7, 0.24, 1.8]} />
                <meshStandardMaterial color="#7c4a1e" flatShading />
            </mesh>
            {[-0.45, 0, 0.45].map((z) => (
                <mesh key={z} position={[0, 0.25, z]}>
                    <sphereGeometry args={[0.2, 8, 6]} />
                    <meshStandardMaterial color="#f8fafc" flatShading />
                </mesh>
            ))}
        </group>
    );
}

function Fellesskap({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const s = useRef(0);
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        s.current = damp(s.current, synlig ? 1 : 0, 1.4, dt);
        const m = ref.current;
        if (!m) return;
        const k = Math.max(0.0001, s.current);
        m.scale.set(k, k, 1);
        m.visible = s.current > 0.02;
    });
    return (
        <mesh ref={ref} position={[2, 0.06, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[10.4, 10.9, 64]} />
            <meshStandardMaterial
                color="#eab308"
                emissive="#a16207"
                emissiveIntensity={0.4}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ---------- Streiken ----------

const PLEBEIERE = 150;
const PATRISIERE = 10;

interface Person {
    hjem: THREE.Vector3;
    ut: THREE.Vector3;
    forsinkelse: number;
}

function lagFolk(): Person[] {
    const rnd = lagTilfeldig(31);
    const ut: Person[] = [];
    for (let i = 0; i < PLEBEIERE + PATRISIERE; i++) {
        const patrisier = i >= PLEBEIERE;
        const h = patrisier ? HOYDER[1] : HOYDER[i % HOYDER.length];
        const a = rnd() * Math.PI * 2;
        const r = (patrisier ? 0.5 : h.r * 0.85) * Math.sqrt(rnd());
        const hx = h.x + Math.cos(a) * r;
        const hz = h.z + Math.sin(a) * r;
        const a2 = rnd() * Math.PI * 2;
        const r2 = STREIKHOYDE.r * 0.8 * Math.sqrt(rnd());
        const ux = STREIKHOYDE.x + Math.cos(a2) * r2;
        const uz = STREIKHOYDE.z + Math.sin(a2) * r2;
        ut.push({
            hjem: v(hx, 0, hz),
            ut: v(ux, 0, uz),
            forsinkelse: rnd() * 4,
        });
    }
    return ut;
}

function Folk({ beat, playing }: { beat: number; playing: boolean }) {
    const folk = useMemo(() => lagFolk(), []);
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(beat);
    const o = useMemo(() => new THREE.Object3D(), []);
    const farger = useMemo(() => {
        const plebeier = new THREE.Color('#9a3412');
        const patrisier = new THREE.Color('#f8fafc');
        return folk.map((_, i) => (i >= PLEBEIERE ? patrisier : plebeier));
    }, [folk]);
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        farger.forEach((c, i) => m.setColorAt(i, c));
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [farger]);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const m = ref.current;
        if (!m) return;
        folk.forEach((p, i) => {
            const patrisier = i >= PLEBEIERE;
            const fram = patrisier
                ? 0
                : beat <= 1
                  ? 0
                  : beat === 2
                    ? glatt((tid.current - p.forsinkelse * 0.6) / 6)
                    : 1;
            const x = THREE.MathUtils.lerp(p.hjem.x, p.ut.x, fram);
            const z = THREE.MathUtils.lerp(p.hjem.z, p.ut.z, fram);
            const gaar = fram > 0 && fram < 1;
            const hopp = gaar ? Math.abs(Math.sin(tid.current * 9 + i)) * 0.08 : 0;
            o.position.set(x, hoydeVed(x, z, true) + 0.24 + hopp, z);
            o.rotation.set(0, i, 0);
            o.scale.setScalar(1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, folk.length]} frustumCulled={false}>
            <boxGeometry args={[0.2, 0.48, 0.2]} />
            <meshStandardMaterial flatShading />
        </instancedMesh>
    );
}

// ---------- Cannae ----------

const ROM_KOL = 15;
const ROM_RAD = 10;
const MIDT_N = 45;
const FLOY_N = 24;

interface Mal {
    x: number;
    z: number;
}

function romerMal(i: number, beat: number): Mal {
    const kol = i % ROM_KOL;
    const rad = Math.floor(i / ROM_KOL);
    const avstand = beat >= 4 ? 0.58 : 0.75;
    const midtZ = beat <= 2 ? -9 : beat === 3 ? -4.6 : -3.4;
    return {
        x: (kol - (ROM_KOL - 1) / 2) * avstand,
        z: midtZ - (rad - (ROM_RAD - 1) / 2) * avstand,
    };
}

function midtMal(i: number, beat: number): Mal {
    const kol = i % 15;
    const rad = Math.floor(i / 15);
    const x = (kol - 7) * 0.85;
    const bue = 1 - (x / 6.5) ** 2;
    const z0 = beat <= 2 ? 2.4 - 1.6 * bue : 3.2 + 2.6 * bue;
    return { x, z: z0 + rad * 0.7 };
}

function floyMal(i: number, side: number, beat: number): Mal {
    const kol = i % 8;
    const rad = Math.floor(i / 8);
    if (beat < 4) {
        return { x: side * (7.6 + kol * 0.7), z: 2.2 + rad * 0.7 };
    }
    // Omringet: 16 langs siden, 8 bak romerne.
    if (i < 16) {
        const langs = i % 8;
        const lag = Math.floor(i / 8);
        return { x: side * (5.4 + lag * 0.7), z: 1.2 - langs * 0.95 };
    }
    const j = i - 16;
    return { x: side * (0.9 + j * 0.6), z: -7.0 };
}

function Haer({ beat }: { beat: number }) {
    const rom = useRef<THREE.InstancedMesh>(null);
    const midt = useRef<THREE.InstancedMesh>(null);
    const floy = useRef<THREE.InstancedMesh>(null);
    const posR = useRef<Mal[]>([]);
    const posM = useRef<Mal[]>([]);
    const posF = useRef<Mal[]>([]);
    const forste = useRef(true);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        const lambda = 0.9;
        const flytt = (liste: Mal[], i: number, mal: Mal) => {
            const n = liste[i];
            if (!n || forste.current) {
                liste[i] = { ...mal };
                return liste[i];
            }
            n.x = damp(n.x, mal.x, lambda, dt);
            n.z = damp(n.z, mal.z, lambda, dt);
            return n;
        };
        const sett = (m: THREE.InstancedMesh | null, i: number, p: Mal, hoyde: number) => {
            if (!m) return;
            o.position.set(p.x, hoyde / 2, p.z);
            o.scale.set(1, hoyde / 0.6, 1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        };
        for (let i = 0; i < ROM_KOL * ROM_RAD; i++)
            sett(rom.current, i, flytt(posR.current, i, romerMal(i, beat)), 0.6);
        for (let i = 0; i < MIDT_N; i++)
            sett(midt.current, i, flytt(posM.current, i, midtMal(i, beat)), 0.6);
        const floyHoyde = beat === 2 ? 0.95 : 0.75;
        for (let i = 0; i < FLOY_N * 2; i++) {
            const side = i < FLOY_N ? -1 : 1;
            sett(
                floy.current,
                i,
                flytt(posF.current, i, floyMal(i % FLOY_N, side, beat)),
                floyHoyde
            );
        }
        forste.current = false;
        [rom.current, midt.current, floy.current].forEach((m) => {
            if (m) m.instanceMatrix.needsUpdate = true;
        });
    });
    return (
        <>
            <instancedMesh
                ref={rom}
                args={[undefined, undefined, ROM_KOL * ROM_RAD]}
                frustumCulled={false}
            >
                <boxGeometry args={[0.5, 0.6, 0.5]} />
                <meshStandardMaterial color={beat >= 4 ? '#b45454' : '#dc2626'} flatShading />
            </instancedMesh>
            <instancedMesh ref={midt} args={[undefined, undefined, MIDT_N]} frustumCulled={false}>
                <boxGeometry args={[0.5, 0.6, 0.5]} />
                <meshStandardMaterial color="#60a5fa" flatShading />
            </instancedMesh>
            <instancedMesh
                ref={floy}
                args={[undefined, undefined, FLOY_N * 2]}
                frustumCulled={false}
            >
                <boxGeometry args={[0.5, 0.6, 0.5]} />
                <meshStandardMaterial
                    color="#1e3a8a"
                    emissive="#1e3a8a"
                    emissiveIntensity={beat === 2 ? 0.5 : 0}
                    flatShading
                />
            </instancedMesh>
        </>
    );
}

// ---------- Kamera ----------

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'myte') {
        const k = bredd(0.4, -1, 5);
        switch (beat) {
            case 0:
                return { pos: v(k.x - 2 + t * 0.15, 3.2, k.z - 6), se: v(-6.6, 0, -3) };
            case 1: {
                const p = ELV.getPointAt(0.22 + Math.min(t, 9) * 0.03);
                return { pos: v(p.x - 6, 3.6, p.z - 3), se: v(p.x, 0, p.z) };
            }
            case 2: {
                const p = bredd(0.52, 1, 1.2);
                return { pos: v(p.x - 5.5, 2.8, p.z + 3.5), se: v(p.x, 0.4, p.z) };
            }
            default:
                return { pos: v(-12, 9 + t * 0.15, 14), se: v(0.8, 0.8, 2.8) };
        }
    }
    if (modus === 'hoydene') {
        switch (beat) {
            case 0:
                return { pos: v(-6, 5.5, 11), se: v(0.8, 1.2, 2.8) };
            case 1:
                return { pos: v(-15, 17, 19), se: v(1.5, 0, 0.5) };
            case 2:
                return { pos: v(9, 6, 13), se: v(1.5, 1, 2.5) };
            case 3: {
                const p = ELV.getPointAt(0.72 - Math.min(t, 8) * 0.012);
                return { pos: v(p.x + 6, 4.5, p.z + 6), se: v(p.x, 0, p.z) };
            }
            default:
                return { pos: v(-4, 26, 22), se: v(2, 0, 0) };
        }
    }
    if (modus === 'streik') {
        switch (beat) {
            case 0:
                return { pos: v(-10, 11, 16), se: v(2, 0.5, 0) };
            case 1:
                return { pos: v(-4, 6, 10), se: v(1.5, 1, 1.5) };
            case 2:
                return { pos: v(-6 + t * 0.3, 20, 18), se: v(8, 0, -6) };
            default:
                return { pos: v(-4, 18, 16), se: v(6, 0, -5) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 18, -26), se: v(0, 0, -1) };
        case 1:
            return { pos: v(12, 15, -22), se: v(0, 0, -2) };
        case 2:
            return { pos: v(0, 17, 18), se: v(0, 0, -1) };
        case 3:
            return { pos: v(-16, 16, -12), se: v(0, 0, 0) };
        default:
            return { pos: v(0, 24, -14), se: v(0, 0, -1.5) };
    }
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const tid = useRef(0);
    const forrige = useRef(beat);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const mal = kameraFor(modus, beat, tid.current);
        if (forste.current) {
            camera.position.copy(mal.pos);
            kamSe.current.copy(mal.se);
            forste.current = false;
        } else {
            const k = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(mal.pos, k);
            kamSe.current.lerp(mal.se, k);
        }
        camera.lookAt(kamSe.current);
    });

    const kveld = modus === 'myte';
    const cannae = modus === 'cannae';
    return (
        <>
            <color
                attach="background"
                args={[kveld ? '#f0b48a' : cannae ? '#dbe7ef' : '#cfe6f7']}
            />
            <fog attach="fog" args={[kveld ? '#e9b497' : '#d6e8f3', 40, 110]} />
            <ambientLight intensity={kveld ? 0.8 : 0.65} color={kveld ? '#ffeede' : '#ffffff'} />
            <directionalLight
                position={kveld ? [-30, 14, 10] : [20, 40, 18]}
                intensity={kveld ? 1.1 : 1.5}
                color={kveld ? '#ffcf9e' : '#fff6e5'}
            />
            <hemisphereLight args={[kveld ? '#ffcfa8' : '#e0f2fe', '#4d5a2a', 0.45]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <planeGeometry args={[220, 220]} />
                <meshStandardMaterial color={cannae ? '#cdb97c' : kveld ? '#7f9a58' : '#a3b86c'} />
            </mesh>
            {!cannae && (
                <>
                    <Elva kveld={kveld} />
                    <Hoydene streik={modus === 'streik'} />
                    <Hytter modus={modus} beat={beat} />
                </>
            )}
            {modus === 'myte' && (
                <>
                    <Kurv beat={beat} playing={playing} />
                    <Ulv synlig={beat === 2} />
                    <Plogfure synlig={beat >= 3} />
                </>
            )}
            {modus === 'hoydene' && (
                <>
                    <Palisader synlig={beat === 2} />
                    <Bat synlig={beat === 3} playing={playing} />
                    <Fellesskap synlig={beat >= 4} />
                    {beat >= 1 &&
                        beat <= 2 &&
                        HOYDER.map((h, i) => (
                            <Html
                                key={i}
                                center
                                position={[h.x, h.h + 1.1, h.z]}
                                zIndexRange={[10, 0]}
                            >
                                <div
                                    className="rounded-full bg-white/95 text-slate-900 font-black shadow-lg flex items-center justify-center"
                                    style={{ width: 44, height: 44, fontSize: 26 }}
                                >
                                    {i + 1}
                                </div>
                            </Html>
                        ))}
                </>
            )}
            {modus === 'streik' && <Folk beat={beat} playing={playing} />}
            {modus === 'streik' && beat === 1 && (
                <>
                    <Html
                        center
                        position={[HOYDER[1].x + 1.5, HOYDER[1].h + 0.6, HOYDER[1].z - 1.5]}
                        zIndexRange={[10, 0]}
                    >
                        <Etikett tekst="nekter å arbeide" farge="#9a3412" />
                    </Html>
                    <Html
                        center
                        position={[HOYDER[1].x - 2, HOYDER[1].h + 1.2, HOYDER[1].z + 1]}
                        zIndexRange={[10, 0]}
                    >
                        <Etikett tekst="nekter å kjempe" farge="#9a3412" />
                    </Html>
                </>
            )}
            {modus === 'streik' && beat >= 2 && (
                <Html
                    center
                    position={[STREIKHOYDE.x, STREIKHOYDE.h + 1.8, STREIKHOYDE.z]}
                    zIndexRange={[10, 0]}
                >
                    <Etikett tekst="plebeierne" farge="#9a3412" />
                </Html>
            )}
            {modus === 'streik' && beat >= 3 && (
                <Html
                    center
                    position={[HOYDER[1].x, HOYDER[1].h + 1.6, HOYDER[1].z]}
                    zIndexRange={[10, 0]}
                >
                    <Etikett tekst="patrisierne" farge="#6d28d9" />
                </Html>
            )}
            {cannae && <Haer beat={beat} />}
            {cannae && beat <= 1 && (
                <>
                    <Html center position={[0, 1.5, 4.8]} zIndexRange={[10, 0]}>
                        <Etikett
                            tekst={beat === 1 ? 'Hannibal: ca. 30 000' : 'Hannibal'}
                            farge="#1e3a8a"
                        />
                    </Html>
                    <Html center position={[0, 1.5, -14]} zIndexRange={[10, 0]}>
                        <Etikett
                            tekst={beat === 1 ? 'Romerne: trolig høyst 50 000' : 'Romerne'}
                            farge="#b91c1c"
                        />
                    </Html>
                </>
            )}
            {cannae && beat >= 4 && (
                <Html center position={[-9.5, 1.6, -3]} zIndexRange={[10, 0]}>
                    <Etikett tekst="Hannibals tap: små" farge="#1e3a8a" />
                </Html>
            )}
            {cannae && beat === 2 && (
                <>
                    <Html center position={[-9.5, 1.6, 4.6]} zIndexRange={[10, 0]}>
                        <Etikett tekst="Fløy" farge="#1e3a8a" />
                    </Html>
                    <Html center position={[9.5, 1.6, 4.6]} zIndexRange={[10, 0]}>
                        <Etikett tekst="Fløy" farge="#1e3a8a" />
                    </Html>
                    <Html center position={[0, 1.6, 5.6]} zIndexRange={[10, 0]}>
                        <Etikett tekst="Midten" farge="#2563eb" />
                    </Html>
                </>
            )}
        </>
    );
}

function Etikett({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <div
            className="rounded-xl bg-white/95 px-4 py-1.5 text-2xl font-black shadow-lg whitespace-nowrap"
            style={{ color: farge }}
        >
            {tekst}
        </div>
    );
}

/** Store merkelapper øverst til venstre, én per beat. */
const TEKSTER: Record<Modus, (string | null)[]> = {
    myte: ['Tiberen', 'Romulus og Remus', 'Hunnulven', 'Sagnet: ca. 753 fvt.'],
    hoydene: [
        'Fra ca. 1000 fvt.',
        'Sju høyder ved Tiberen',
        'Trygt på høydene',
        'Nær elva: handel med salt og varer',
        'Ett fellesskap',
    ],
    streik: [
        '494 fvt.: plebeierne streiker',
        'Ingen arbeid, ingen soldater',
        'Ut av byen',
        'Roma uten forsvar',
    ],
    cannae: [
        'Cannae, 216 fvt.',
        'Tradisjonen sier 80 000 romere',
        'De beste soldatene på fløyene',
        'Midten trekker seg bakover',
        'Romerne er omringet',
    ],
};

export function RomaHoydene({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'hoydene';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = TEKSTER[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 300, position: [-12, 10, 16] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={`${modus}-${tekst}`}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45 }}
                        className="absolute left-[3%] top-[5%] rounded-2xl bg-white/90 px-5 py-2.5 text-2xl md:text-4xl font-black text-slate-900 shadow-xl"
                        style={{ maxWidth: '60%' }}
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
