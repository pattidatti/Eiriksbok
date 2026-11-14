import { useMemo, useRef, type CSSProperties, type MutableRefObject, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Talerens sal i 3D. Fire moduser:
 * - apning: en taler på scenen, publikum i salen og lydringer som treffer (eller ikke).
 * - churchill: Underhuset med grønne benker på hver side, én ring per «we shall fight».
 * - trapp: klimaks som en trapp der lyset klatrer ett trinn per ledd.
 * - verktoy: de seks grepene svever rundt taleren. To er nok, seks blir for mye.
 */

type Modus = 'apning' | 'churchill' | 'trapp' | 'verktoy';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const GULL = '#fbbf24';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------- Plasseringer ----------

/** Taleren står bak talerstolen på scenen og ser mot salen (+z). */
const TALER_SAL = v(0, 0.6, -6.2);
/** I Underhuset står taleren ved bordet midt i salen. */
const TALER_UNDERHUS = v(-1.3, 0, 0);

function publikumSal(): THREE.Vector3[] {
    const p: THREE.Vector3[] = [];
    for (let rad = 0; rad < 6; rad++) {
        for (let i = 0; i < 11; i++) {
            p.push(v(-7 + i * 1.4 + (rad % 2) * 0.35, 0, -1.5 + rad * 1.6));
        }
    }
    return p;
}

function publikumUnderhus(): THREE.Vector3[] {
    const p: THREE.Vector3[] = [];
    for (const side of [-1, 1]) {
        for (let trinn = 0; trinn < 3; trinn++) {
            for (let i = 0; i < 8; i++) {
                const z = -5.2 + i * 1.5;
                // Taleren står på regjeringssiden, så la det være litt luft rundt ham.
                if (side === -1 && trinn === 0 && Math.abs(z) < 1.2) continue;
                p.push(v(side * (3.2 + trinn * 1.1), trinn * 0.45 + 0.45, z));
            }
        }
    }
    return p;
}

// ---------- Kamera ----------

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'apning') {
        switch (beat) {
            case 0:
                return { pos: v(0, 7 - t * 0.12, 17 - t * 0.35), se: v(0, 1.4, -3) };
            case 1:
                return { pos: v(5, 3.6, 4), se: v(0, 1.9, -5.5) };
            case 2:
                return { pos: v(6.5 - t * 0.15, 4, 9), se: v(0, 1.3, -2) };
            case 3:
                return { pos: v(-8, 6, 7), se: v(0, 1.2, -1.5) };
            default:
                return { pos: v(1.6, 4.2, -8.6), se: v(0, 0.8, 4) };
        }
    }
    if (modus === 'churchill') {
        switch (beat) {
            case 0:
                return { pos: v(0, 10 - t * 0.15, 15), se: v(0, 0.4, 0) };
            case 1:
                return { pos: v(-0.5, 5.2, 10.5), se: v(-1, 1.1, 0) };
            case 2:
                return { pos: v(4.5, 6.5, -10), se: v(-1, 0.9, 0) };
            case 3:
                return { pos: v(0.5, 6.5, -13), se: v(-0.5, 0.6, 0) };
            default:
                return { pos: v(0, 14, 7), se: v(0, 0, 0.5) };
        }
    }
    if (modus === 'trapp') {
        switch (beat) {
            case 0:
                return { pos: v(-3, 4.5, 17), se: v(0, 2.3, 0) };
            case 5:
                return { pos: v(0.5, 7.5, 19), se: v(0.5, 3.2, 0) };
            default:
                return { pos: v(1.5, 5, 17), se: v(0.5, 2.6, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 3.4, 5.5), se: v(0, 2.6, -4.5) };
        case 1:
            return { pos: v(2.6, 3, 1.6), se: v(0, 2.3, -5.4) };
        case 2:
            return { pos: v(-2.4, 3.2, 1.4), se: v(0, 2.5, -5.4) };
        default:
            return { pos: v(0, 2.9, 2.4), se: v(0, 2.3, -5.4) };
    }
}

// ---------- Lydringer ----------

interface Pulser {
    starter: number[];
    styrke: number;
    periode?: number;
}

function pulserFor(modus: Modus, beat: number): Pulser {
    if (modus === 'apning') {
        if (beat === 1) return { starter: [0.5], styrke: 0.3 };
        if (beat === 3) return { starter: [0.6, 2.6, 4.6], styrke: 1 };
        if (beat === 4) return { starter: [], styrke: 0.7, periode: 1.5 };
    }
    if (modus === 'churchill') {
        if (beat >= 1 && beat <= 3) return { starter: [0.4, 2.4], styrke: 1 };
        if (beat === 4) return { starter: [], styrke: 0.8, periode: 1.1 };
    }
    return { starter: [], styrke: 0 };
}

const RING_LIV = 2.4;

function Ringer({
    modus,
    beat,
    tid,
    senter,
}: {
    modus: Modus;
    beat: number;
    tid: MutableRefObject<number>;
    senter: THREE.Vector3;
}) {
    const ringer = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(() => {
        const t = tid.current;
        const p = pulserFor(modus, beat);
        ringer.current.forEach((r, i) => {
            if (!r) return;
            let alder = -1;
            if (p.periode) alder = (t + i * p.periode) % (4 * p.periode);
            else if (i < p.starter.length) alder = t - p.starter[i];
            const mat = r.material as THREE.MeshBasicMaterial;
            if (alder < 0 || alder > RING_LIV) {
                mat.opacity = 0;
                r.visible = false;
                return;
            }
            r.visible = true;
            const f = alder / RING_LIV;
            r.scale.setScalar(0.4 + f * 9);
            mat.opacity = p.styrke * (1 - f) * 0.9;
        });
    });
    return (
        <group position={[senter.x, senter.y + 1.5, senter.z]}>
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        ringer.current[i] = m;
                    }}
                    rotation={[Math.PI / 2, 0, 0]}
                    visible={false}
                >
                    <torusGeometry args={[1, 0.05, 6, 64]} />
                    <meshBasicMaterial color={GULL} transparent opacity={0} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
}

// ---------- Figurer ----------

function Taler({ pos, retning = 0 }: { pos: THREE.Vector3; retning?: number }) {
    return (
        <group position={[pos.x, pos.y, pos.z]} rotation={[0, retning, 0]}>
            <mesh position={[0, 0.65, 0]}>
                <cylinderGeometry args={[0.28, 0.36, 1.3, 12]} />
                <meshStandardMaterial color="#1e3a8a" emissive="#1e3a8a" emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, 1.55, 0]}>
                <sphereGeometry args={[0.27, 16, 12]} />
                <meshStandardMaterial color="#f1c7a5" emissive="#7c4a2d" emissiveIntensity={0.2} />
            </mesh>
        </group>
    );
}

/** Publikum som instanser: kropp og hode. Fargen lyser opp når ordene treffer. */
function Publikum({
    plasser,
    lys,
    tid,
    sitter,
}: {
    plasser: THREE.Vector3[];
    lys: number;
    tid: MutableRefObject<number>;
    sitter: boolean;
}) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const kMat = useRef<THREE.MeshStandardMaterial>(null);
    const hMat = useRef<THREE.MeshStandardMaterial>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const lysNa = useRef(lys);
    const morkFarge = useMemo(() => new THREE.Color('#475569'), []);
    const lysFarge = useMemo(() => new THREE.Color('#f59e0b'), []);
    const h = sitter ? 0.75 : 1;

    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        lysNa.current = damp(lysNa.current, lys, 2.5, dt);
        const l = lysNa.current;
        if (kMat.current) {
            kMat.current.color.copy(morkFarge).lerp(lysFarge, l * 0.75);
            kMat.current.emissiveIntensity = 0.1 + l * 0.45;
        }
        if (hMat.current) hMat.current.emissiveIntensity = 0.1 + l * 0.4;
        const k = kropp.current;
        const hd = hode.current;
        if (!k || !hd) return;
        plasser.forEach((p, i) => {
            const hopp = l > 0.6 ? Math.max(0, Math.sin(tid.current * 3 + i * 0.7)) * 0.08 * l : 0;
            o.position.set(p.x, p.y + (0.55 * h) + hopp, p.z);
            o.scale.set(1, h, 1);
            o.updateMatrix();
            k.setMatrixAt(i, o.matrix);
            o.position.set(p.x, p.y + 1.25 * h + 0.1 + hopp, p.z);
            o.scale.set(1, 1, 1);
            o.updateMatrix();
            hd.setMatrixAt(i, o.matrix);
        });
        k.instanceMatrix.needsUpdate = true;
        hd.instanceMatrix.needsUpdate = true;
    });

    return (
        <>
            <instancedMesh
                ref={kropp}
                args={[undefined, undefined, plasser.length]}
                frustumCulled={false}
            >
                <cylinderGeometry args={[0.24, 0.32, 1.1, 8]} />
                <meshStandardMaterial ref={kMat} color="#475569" emissive="#7c2d12" />
            </instancedMesh>
            <instancedMesh
                ref={hode}
                args={[undefined, undefined, plasser.length]}
                frustumCulled={false}
            >
                <sphereGeometry args={[0.22, 10, 8]} />
                <meshStandardMaterial ref={hMat} color="#e5b999" emissive="#7c4a2d" />
            </instancedMesh>
        </>
    );
}

function Scene() {
    return (
        <group>
            {/* Scenen */}
            <mesh position={[0, 0.3, -6.5]}>
                <boxGeometry args={[11, 0.6, 5]} />
                <meshStandardMaterial color="#5b3a29" />
            </mesh>
            {/* Talerstolen */}
            <mesh position={[0, 1.15, -5.5]}>
                <boxGeometry args={[1.3, 1.1, 0.7]} />
                <meshStandardMaterial color="#7c4a2d" emissive="#3b2416" emissiveIntensity={0.4} />
            </mesh>
            {/* Teppet bak scenen */}
            <mesh position={[0, 4, -9]}>
                <planeGeometry args={[18, 8]} />
                <meshStandardMaterial color="#7f1d1d" emissive="#450a0a" emissiveIntensity={0.5} />
            </mesh>
            {/* Lyskjegle over taleren */}
            <mesh position={[0, 4.1, -6.2]}>
                <coneGeometry args={[1.5, 7, 24, 1, true]} />
                <meshBasicMaterial
                    color="#fef3c7"
                    transparent
                    opacity={0.12}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <Taler pos={TALER_SAL} />
        </group>
    );
}

function Underhuset() {
    return (
        <group>
            {[-1, 1].map((side) =>
                [0, 1, 2].map((trinn) => (
                    <group key={`${side}-${trinn}`}>
                        {/* Trinnet */}
                        <mesh position={[side * (3.2 + trinn * 1.1), trinn * 0.45 * 0.5, 0]}>
                            <boxGeometry args={[1.1, trinn * 0.45 + 0.02, 13]} />
                            <meshStandardMaterial color="#3f2e22" />
                        </mesh>
                        {/* Den grønne benken */}
                        <mesh position={[side * (3.2 + trinn * 1.1), trinn * 0.45 + 0.25, 0]}>
                            <boxGeometry args={[0.9, 0.5, 12.6]} />
                            <meshStandardMaterial
                                color="#2f6b45"
                                emissive="#14532d"
                                emissiveIntensity={0.35}
                            />
                        </mesh>
                    </group>
                ))
            )}
            {/* Bordet midt i salen */}
            <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[1.4, 0.9, 5]} />
                <meshStandardMaterial color="#8b5a2b" emissive="#3b2416" emissiveIntensity={0.4} />
            </mesh>
            {/* Treveggene */}
            {[-1, 1].map((side) => (
                <mesh key={side} position={[side * 7.4, 3, 0]} rotation={[0, -side * Math.PI / 2, 0]}>
                    <planeGeometry args={[16, 6]} />
                    <meshStandardMaterial color="#6b4423" emissive="#2a1a0e" emissiveIntensity={0.5} />
                </mesh>
            ))}
            <Taler pos={TALER_UNDERHUS} retning={Math.PI / 2} />
        </group>
    );
}

// ---------- Trappa ----------

const TRINN = [0, 1, 2].map((i) => ({ x: -5 + i * 5, h: 1.2 + i * 1.4 }));
const TRINN_FARGER = ['#38bdf8', '#f59e0b', '#ef4444'];

function Trapp({ beat, tid }: { beat: number; tid: MutableRefObject<number> }) {
    const klosser = useRef<(THREE.Mesh | null)[]>([]);
    const kule = useRef<THREE.Mesh>(null);
    const kuleLys = useRef<THREE.PointLight>(null);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05) || 0.016;
        const t = tid.current;
        // Hvilket trinn lyser nå?
        let mal = 0;
        if (beat === 1) mal = Math.min(2, Math.floor(t / 1.1));
        else if (beat >= 2 && beat <= 4) mal = beat - 2;
        else if (beat === 5) mal = 2;
        klosser.current.forEach((k, i) => {
            if (!k) return;
            // Trinnene reiser seg ett for ett i beat 0.
            const vokst = beat === 0 ? Math.min(1, Math.max(0.02, (t - i * 0.6) / 0.8)) : 1;
            k.scale.y = damp(k.scale.y, vokst, 6, dt);
            k.position.y = (TRINN[i].h * k.scale.y) / 2;
            const mat = k.material as THREE.MeshStandardMaterial;
            const tent = beat >= 1 && i <= mal;
            mat.emissiveIntensity = damp(mat.emissiveIntensity, tent ? (i === mal ? 0.9 : 0.45) : 0.08, 4, dt);
        });
        const m = kule.current;
        if (m) {
            const mx = beat === 0 ? TRINN[0].x - 3.5 : TRINN[mal].x;
            const my = beat === 0 ? 0.5 : TRINN[mal].h + 0.6;
            m.position.x = damp(m.position.x, mx, 5, dt);
            m.position.y = damp(m.position.y, my, 5, dt);
            const puls = beat === 5 ? 1.6 + Math.sin(t * 4) * 0.25 : 1;
            m.scale.setScalar(damp(m.scale.x, puls, 4, dt));
            if (kuleLys.current) {
                kuleLys.current.position.copy(m.position);
                kuleLys.current.intensity = beat === 5 ? 30 : 12;
            }
        }
    });
    return (
        <group>
            {TRINN.map((tr, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        klosser.current[i] = m;
                    }}
                    position={[tr.x, tr.h / 2, 0]}
                >
                    <boxGeometry args={[4.6, tr.h, 3.4]} />
                    <meshStandardMaterial
                        color={TRINN_FARGER[i]}
                        emissive={TRINN_FARGER[i]}
                        emissiveIntensity={0.08}
                        flatShading
                    />
                </mesh>
            ))}
            <mesh ref={kule} position={[TRINN[0].x - 3.5, 0.5, 0]}>
                <sphereGeometry args={[0.45, 20, 16]} />
                <meshBasicMaterial color="#fef9c3" />
            </mesh>
            <pointLight ref={kuleLys} color="#fde68a" intensity={12} distance={12} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[60, 40]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
        </group>
    );
}

// ---------- Verktøyene ----------

const VERKTOY = ['Anafora', 'Treklang', 'Kontrast', 'Spørsmål', 'Metafor', 'Klimaks'];
const VERKTOY_FARGER = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#0ea5e9', '#a855f7'];
/** De to grepene taleren velger. */
const VALGT = [1, 2];

function verktoyMal(i: number, beat: number, t: number): { p: THREE.Vector3; s: number } {
    if (beat === 0) return { p: v(-4.5 + i * 1.8, 2.9 + Math.sin(t * 1.5 + i) * 0.12, -3.4), s: 1 };
    if (beat === 2) {
        const a = t * 1.8 + (i / 6) * Math.PI * 2;
        return { p: v(Math.cos(a) * 1.25, 2.25 + Math.sin(a * 2) * 0.35, -6.2 + Math.sin(a) * 1.25), s: 0.85 };
    }
    const valgt = VALGT.indexOf(i);
    if (valgt >= 0) return { p: v(valgt === 0 ? -1.15 : 1.15, 2.95 + Math.sin(t * 1.4 + i) * 0.08, -5.2), s: 1.15 };
    return { p: v(-6 + i * 2.4, 4.2, -8.4), s: 0.4 };
}

function VerktoyForm({ i }: { i: number }) {
    switch (i) {
        case 0:
            return <torusGeometry args={[0.38, 0.13, 10, 28]} />;
        case 1:
            return <coneGeometry args={[0.5, 0.75, 3]} />;
        case 2:
            return <boxGeometry args={[0.7, 0.7, 0.7]} />;
        case 3:
            return <octahedronGeometry args={[0.5, 0]} />;
        case 4:
            return <icosahedronGeometry args={[0.48, 0]} />;
        default:
            return <cylinderGeometry args={[0.18, 0.5, 0.75, 6]} />;
    }
}

function Verktoy({
    beat,
    tid,
    pos,
}: {
    beat: number;
    tid: MutableRefObject<number>;
    pos: MutableRefObject<THREE.Vector3[]>;
}) {
    const ting = useRef<(THREE.Mesh | null)[]>([]);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05) || 0.016;
        const t = tid.current;
        ting.current.forEach((m, i) => {
            if (!m) return;
            const mal = verktoyMal(i, beat, t);
            const k = forste.current ? 1 : 1 - Math.exp(-4 * dt);
            m.position.lerp(mal.p, beat === 2 ? 1 - Math.exp(-9 * dt) : k);
            m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, mal.s, k));
            m.rotation.y += dt * (beat === 2 ? 4 : 0.8);
            m.rotation.x += dt * (beat === 2 ? 3 : 0.3);
            const mat = m.material as THREE.MeshStandardMaterial;
            const valgt = VALGT.includes(i);
            const glod = beat === 2 ? 0.9 : beat === 0 || valgt ? 0.6 : 0.05;
            mat.emissiveIntensity = damp(mat.emissiveIntensity, glod, 4, dt);
            pos.current[i] = m.position.clone();
        });
        forste.current = false;
    });
    return (
        <group>
            {VERKTOY.map((navn, i) => (
                <mesh
                    key={navn}
                    ref={(m) => {
                        ting.current[i] = m;
                    }}
                    position={[-4.5 + i * 1.8, 2.9, -3.4]}
                >
                    <VerktoyForm i={i} />
                    <meshStandardMaterial
                        color={VERKTOY_FARGER[i]}
                        emissive={VERKTOY_FARGER[i]}
                        emissiveIntensity={0.6}
                        flatShading
                    />
                </mesh>
            ))}
        </group>
    );
}

// ---------- Selve scenen ----------

/** Punktene merkelappene henger på, i 3D. */
function ankerFor(modus: Modus, verktoyPos: THREE.Vector3[]): THREE.Vector3[] {
    if (modus === 'trapp') return TRINN.map((tr) => v(tr.x, tr.h + 1.9, 1.7));
    if (modus === 'verktoy')
        return VERKTOY.map((_, i) => {
            const p = verktoyPos[i] ?? v(0, 0, 0);
            return v(p.x, p.y - 0.75 - (i % 2) * 0.5, p.z);
        });
    return [];
}

function Innhold({
    modus,
    beat,
    playing,
    merker,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    merker: MutableRefObject<(HTMLDivElement | null)[]>;
}) {
    const { camera } = useThree();
    const tid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const verktoyPos = useRef<THREE.Vector3[]>([]);
    const proj = useMemo(() => new THREE.Vector3(), []);
    const plasser = useMemo(
        () => (modus === 'churchill' ? publikumUnderhus() : publikumSal()),
        [modus]
    );

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const mal = kameraFor(modus, beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
        camera.updateMatrixWorld();

        // Merkelapper som DOM: projiser ankerpunktene til flaten på 1000x562.
        const ankre = ankerFor(modus, verktoyPos.current);
        ankre.forEach((a, i) => {
            const el = merker.current[i];
            if (!el) return;
            proj.copy(a).project(camera);
            el.style.left = `${((proj.x + 1) / 2) * 1000}px`;
            el.style.top = `${((1 - proj.y) / 2) * 562}px`;
        });
    });

    const lys =
        modus === 'apning'
            ? beat >= 3
                ? 1
                : beat === 1
                  ? 0.15
                  : 0
            : modus === 'churchill'
              ? beat >= 1
                  ? Math.min(1, 0.3 + beat * 0.2)
                  : 0
              : 0;

    return (
        <>
            <color
                attach="background"
                args={[modus === 'trapp' ? '#0b1224' : modus === 'churchill' ? '#1c140e' : '#140f1c']}
            />
            <fog attach="fog" args={[modus === 'trapp' ? '#0b1224' : '#140f1c', 30, 70]} />
            <ambientLight intensity={0.55} color="#ffe8cc" />
            <directionalLight position={[6, 12, 8]} intensity={1.3} color="#fff4e0" />
            <hemisphereLight args={['#fde68a', '#1e1b2e', 0.45]} />
            {modus !== 'trapp' && modus !== 'churchill' && (
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[40, 40]} />
                    <meshStandardMaterial color="#3a2a3f" />
                </mesh>
            )}
            {modus === 'churchill' && (
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[40, 40]} />
                    <meshStandardMaterial color="#2b3a2f" />
                </mesh>
            )}
            {(modus === 'apning' || modus === 'verktoy') && <Scene />}
            {modus === 'apning' && <Publikum plasser={plasser} lys={lys} tid={tid} sitter />}
            {modus === 'apning' && <Ringer modus={modus} beat={beat} tid={tid} senter={TALER_SAL} />}
            {modus === 'churchill' && (
                <>
                    <Underhuset />
                    <Publikum plasser={plasser} lys={lys} tid={tid} sitter />
                    <Ringer modus={modus} beat={beat} tid={tid} senter={TALER_UNDERHUS} />
                </>
            )}
            {modus === 'trapp' && <Trapp beat={beat} tid={tid} />}
            {modus === 'verktoy' && <Verktoy beat={beat} tid={tid} pos={verktoyPos} />}
        </>
    );
}

// ---------- DOM over lerretet ----------

function Linje({ start, rest, synlig, dempet = false }: { start: string; rest: string; synlig: boolean; dempet?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: synlig ? (dempet ? 0.55 : 1) : 0, x: synlig ? 0 : -20 }}
            transition={{ duration: 0.6 }}
            style={{ fontSize: 26, lineHeight: 1.25, fontWeight: 800 }}
            className="text-white"
        >
            <span style={{ color: GULL }}>{start}</span> {rest}
        </motion.div>
    );
}

function Boks({ children, style }: { children: ReactNode; style: CSSProperties }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute rounded-2xl shadow-2xl"
            style={{ background: 'rgba(15, 23, 42, 0.86)', padding: '14px 22px', ...FONT, ...style }}
        >
            {children}
        </motion.div>
    );
}

const CHURCHILL = [
    { en: 'on the beaches', no: 'på strendene' },
    { en: 'on the landing grounds', no: 'på landingsplassene' },
    { en: 'in the fields and in the streets', no: 'på markene og i gatene' },
];

const TRAPP_TEKST: Record<number, string[]> = {
    1: ['Jeg kom,', 'jeg så,', 'jeg seiret.'],
};
const KLIMAKS = ['Først tok de bøkene våre.', 'Så stengte de skolene.', 'Til slutt forbød de språket vårt.'];

function Overlegg({ modus, beat, merker }: { modus: Modus; beat: number; merker: MutableRefObject<(HTMLDivElement | null)[]> }) {
    const trappTekst = TRAPP_TEKST[beat] ?? KLIMAKS;
    return (
        <Flate>
            <AnimatePresence>
                {modus === 'apning' && (beat === 1 || beat === 2) && (
                    <Boks key="flat" style={{ left: 60, right: 60, bottom: 28, textAlign: 'center' }}>
                        <motion.div
                            animate={{ opacity: beat === 2 ? 0.65 : 1, x: beat === 2 ? 30 : 0 }}
                            transition={{ duration: 2.5 }}
                            style={{ fontSize: 26, fontWeight: 700, color: '#cbd5e1' }}
                        >
                            «Vi vil ha endring, rettferdighet og fremtiden tilbake.»
                        </motion.div>
                    </Boks>
                )}
                {modus === 'apning' && beat >= 3 && (
                    <Boks key="tre" style={{ left: 40, top: 30 }}>
                        <Linje start="Vi vil ha" rest="endring." synlig />
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: beat === 3 ? 2 : 0 }}>
                            <Linje start="Vi vil ha" rest="rettferdighet." synlig />
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: beat === 3 ? 4 : 0 }}>
                            <Linje start="Vi vil ha" rest="fremtiden tilbake." synlig />
                        </motion.div>
                    </Boks>
                )}
                {modus === 'apning' && beat === 4 && (
                    <Boks key="hvorfor" style={{ right: 40, bottom: 30 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>Samme ord. Hvorfor treffer det nå?</div>
                    </Boks>
                )}
                {modus === 'churchill' && beat === 0 && (
                    <Boks key="sted" style={{ left: 40, top: 30 }}>
                        <div style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>Underhuset, London</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: GULL }}>4. juni 1940 · Winston Churchill</div>
                    </Boks>
                )}
                {modus === 'churchill' && beat >= 1 && (
                    <Boks key="linjer" style={beat >= 3 ? { right: 30, top: 24 } : { left: 30, top: 24 }}>
                        {CHURCHILL.filter((_, i) => beat >= i + 1).map((l, i) => (
                            <div key={l.en} style={{ marginBottom: 6 }}>
                                <Linje start="We shall fight" rest={l.en} synlig={beat >= i + 1} dempet={beat <= 3 && beat !== i + 1} />
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: beat >= i + 1 ? 0.85 : 0 }}
                                    style={{ fontSize: 22, color: '#e2e8f0', fontWeight: 700 }}
                                >
                                    Vi skal kjempe {l.no}
                                </motion.div>
                            </div>
                        ))}
                    </Boks>
                )}
                {modus === 'churchill' && beat === 4 && (
                    <Boks key="banker" style={{ left: 40, bottom: 30 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>
                            Hver gjentakelse <span style={{ color: GULL }}>banker</span> budskapet inn
                        </div>
                    </Boks>
                )}
                {modus === 'trapp' && (beat === 0 || beat === 5) && (
                    <Boks key={`klimaks-${beat}`} style={{ left: 40, top: 28 }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>
                            {beat === 0 ? 'Klimaks = høydepunkt' : 'Spenningen øker til toppen'}
                        </div>
                        <div style={{ fontSize: 21, fontWeight: 700, color: GULL }}>
                            {beat === 0 ? 'hvert ledd litt sterkere enn det forrige' : 'rolig start, fullt orkester til slutt'}
                        </div>
                    </Boks>
                )}
                {modus === 'verktoy' && beat >= 1 && (
                    <Boks key={`verktoy-${beat === 2 ? 'mye' : 'to'}`} style={{ left: 40, top: 28 }}>
                        <div style={{ fontSize: 30, fontWeight: 900, color: beat === 2 ? '#fca5a5' : '#fff' }}>
                            {beat === 2 ? 'Alle på en gang: overlesset' : beat === 1 ? 'Velg ett eller to grep' : 'Presist og sparsomt'}
                        </div>
                    </Boks>
                )}
            </AnimatePresence>

            {/* Merkelapper som følger 3D-punkter (plassert av useFrame). */}
            {modus === 'trapp' &&
                trappTekst.map((tekst, i) => {
                    const synlig = beat === 5 || (beat === 1 ? true : beat >= 2 && beat <= 4 ? i <= beat - 2 : false);
                    const fokus = beat === 1 || beat === 5 || i === beat - 2;
                    return (
                        <div
                            key={i}
                            ref={(el) => {
                                merker.current[i] = el;
                            }}
                            className="absolute"
                            style={{ transform: 'translate(-50%, -100%)' }}
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: synlig ? (fokus ? 1 : 0.55) : 0 }}
                                transition={{ duration: 0.5 }}
                                className="rounded-xl shadow-xl text-center"
                                style={{
                                    ...FONT,
                                    background: 'rgba(255,255,255,0.95)',
                                    color: '#0f172a',
                                    fontSize: 24,
                                    fontWeight: 800,
                                    padding: '6px 14px',
                                    maxWidth: 210,
                                    lineHeight: 1.15,
                                }}
                            >
                                {tekst}
                            </motion.div>
                        </div>
                    );
                })}
            {modus === 'verktoy' &&
                VERKTOY.map((navn, i) => {
                    const synlig = beat === 0 || ((beat === 1 || beat === 3) && VALGT.includes(i));
                    return (
                        <div
                            key={navn}
                            ref={(el) => {
                                merker.current[i] = el;
                            }}
                            className="absolute"
                            style={{ transform: 'translate(-50%, 0)' }}
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: synlig ? 1 : 0 }}
                                transition={{ duration: 0.4 }}
                                className="rounded-lg shadow-lg"
                                style={{
                                    ...FONT,
                                    background: VERKTOY_FARGER[i],
                                    color: '#fff',
                                    fontSize: 22,
                                    fontWeight: 800,
                                    padding: '3px 12px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {navn}
                            </motion.div>
                        </div>
                    );
                })}
        </Flate>
    );
}

interface Props {
    modus: Modus;
}

export function RetoriskeGrepSal({ beat, playing, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'apning';
    const merker = useRef<(HTMLDivElement | null)[]>([]);
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [0, 7, 17] }}
                gl={{ antialias: true }}
            >
                <Innhold modus={modus} beat={beat} playing={playing} merker={merker} />
            </Canvas>
            <Overlegg modus={modus} beat={beat} merker={merker} />
        </div>
    );
}
