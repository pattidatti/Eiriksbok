import { useMemo, useRef, type CSSProperties, type MutableRefObject, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Tegnsettingens verden i 3D. Fire moduser:
 * - bord: bestemor ved kjøkkenbordet. «Spis bestemor!» blir til «Spis, bestemor!».
 * - vei: setningen som en biltur, med tegnene som trafikkskilt.
 * - rytme: les høyt. En vei uten skilt, en vei med altfor mange, og en med rytme.
 * - slutt: tilbake ved bordet. Bestemor får kommaet sitt og spiser.
 */

type Modus = 'bord' | 'vei' | 'rytme' | 'slutt';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const GULL = '#fbbf24';
const ROD = '#dc2626';
const GRONN = '#16a34a';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const klamp = (x: number) => Math.min(1, Math.max(0, x));
const myk = (x: number) => {
    const k = klamp(x);
    return k * k * (3 - 2 * k);
};
const utover = (x: number) => 1 - Math.pow(1 - klamp(x), 3);

// ---------- Veien ----------

/** Høyden på veien: flat, så en rampe opp mot slutten (bare i vei-modus). */
function veiHoyde(modus: Modus, x: number) {
    if (modus !== 'vei') return 0;
    if (x < 6) return 0;
    if (x > 14) return 2;
    return ((x - 6) / 8) * 2;
}

type SkiltType = 'stopp' | 'komma' | 'sporsmal' | 'utrop';
interface Skilt {
    type: SkiltType;
    x: number;
}

const VEI_SKILT: Skilt[] = [
    { type: 'stopp', x: -12 },
    { type: 'komma', x: -1.5 },
    { type: 'sporsmal', x: 10 },
    { type: 'utrop', x: 20 },
];

function rytmeSkilt(beat: number): Skilt[] {
    if (beat === 1)
        return [
            { type: 'komma', x: -16 },
            { type: 'komma', x: -6 },
            { type: 'stopp', x: 4 },
        ];
    if (beat === 3) {
        const s: Skilt[] = [];
        for (let x = -24; x <= 28; x += 4) s.push({ type: 'stopp', x });
        return s;
    }
    if (beat === 4)
        return [
            { type: 'komma', x: -14 },
            { type: 'komma', x: 0 },
            { type: 'stopp', x: 14 },
        ];
    return [];
}

/** Bilens plass langs veien. Kameraet bruker samme funksjon, så bilen er alltid i bildet. */
function bilX(modus: Modus, beat: number, t: number) {
    if (modus === 'vei') {
        switch (beat) {
            case 0:
                return -27 + 3 * utover(t / 4);
            case 1:
                return -22 + 7.6 * utover(t / 3);
            case 2:
                return -11 + 7 * utover(t / 4);
            case 3:
                return -1 + 16 * myk(t / 5);
            default:
                return 15 + 3.5 * utover(t / 3);
        }
    }
    switch (beat) {
        case 0:
            return -24 + 2.2 * t;
        case 1: {
            // Bremser ved hvert skilt, kjører videre etter en liten pust.
            const stopp = [-17.4, -7.4, 2.6];
            let x = -26;
            let tid = t;
            for (const s of stopp) {
                const etappe = (s - x) / 5;
                if (tid < etappe) return x + (s - x) * utover(tid / etappe);
                tid -= etappe;
                if (tid < 0.8) return s;
                tid -= 0.8;
                x = s;
            }
            return x;
        }
        case 2:
            return -28 + ((t * 10) % 58);
        case 3: {
            // Stopp og start ved hvert eneste skilt: hakkete.
            const syklus = 1.1;
            const k = Math.floor(t / syklus);
            const f = (t % syklus) / syklus;
            return -26.6 + Math.min(k, 13) * 4 + (k >= 13 ? 0 : 4 * myk(f * 1.8));
        }
        default: {
            const stopp = [-15.4, -1.4, 12.6];
            let x = -24;
            let tid = t;
            for (const s of stopp) {
                const etappe = (s - x) / 5;
                if (tid < etappe) return x + (s - x) * utover(tid / etappe);
                tid -= etappe;
                if (tid < (s === 12.6 ? 99 : 0.6)) return s;
                tid -= 0.6;
                x = s;
            }
            return x;
        }
    }
}

// ---------- Kamera ----------

function kameraFor(modus: Modus, beat: number, t: number, bx: number) {
    if (modus === 'bord' || modus === 'slutt') {
        if (modus === 'bord') {
            switch (beat) {
                case 0:
                    return { pos: v(0.4, 3.4 - t * 0.05, 7 - t * 0.2), se: v(0, 1.4, -1) };
                case 1:
                    return { pos: v(1.3, 2.3, 3.4), se: v(0, 1.8, -1.3) };
                case 2:
                    return { pos: v(-1.9, 2.9, 3.2), se: v(0, 1.45, -0.9) };
                case 3:
                    return { pos: v(0.9, 2.1, 3), se: v(0, 1.7, -1.2) };
                default:
                    return { pos: v(0, 4.4, 8.4), se: v(0, 1.3, -1) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(-2.6, 3.6, 6.6), se: v(0, 1.4, -1) };
            case 1:
                return { pos: v(2.8, 3.2, 6), se: v(0, 1.4, -1) };
            case 2:
                return { pos: v(0.6, 2.2, 3.1), se: v(0, 1.7, -1.2) };
            default:
                return { pos: v(-0.9, 2.3, 3.2), se: v(0, 1.5, -1) };
        }
    }
    const by = veiHoyde(modus, bx);
    if (modus === 'vei') {
        switch (beat) {
            case 0:
                return { pos: v(-3, 15, 36), se: v(-3, 0.5, 0) };
            case 1:
                return { pos: v(-18.5, 3.4, 9.5), se: v(-13, 1.4, -1) };
            case 2:
                return { pos: v(-7.5, 3.4, 9.5), se: v(-2.5, 1.5, -1) };
            case 3:
                return { pos: v(bx - 3, by + 4, 13), se: v(bx + 2, by + 0.8, -0.5) };
            default:
                return { pos: v(15, 6.5, 12), se: v(19, 3, -1) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(bx - 2, 3.2, 10), se: v(bx + 3, 0.8, -0.5) };
        case 1:
            return { pos: v(-8, 5.5, 15), se: v(-6, 0.8, -1) };
        case 2:
            return { pos: v(bx - 5, 4.5, 13), se: v(bx + 4, 0.6, 0) };
        case 3:
            return { pos: v(bx - 3, 4, 12), se: v(bx + 3, 0.8, -0.8) };
        default:
            return { pos: v(bx - 4, 5, 14), se: v(bx + 5, 0.8, -1) };
    }
}

// ---------- Kjøkkenet ----------

function Kjokken() {
    return (
        <group>
            {/* Gulv og vegg */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[24, 24]} />
                <meshStandardMaterial color="#b07a4f" emissive="#3b2412" emissiveIntensity={0.35} />
            </mesh>
            <mesh position={[0, 3, -4]}>
                <planeGeometry args={[24, 6]} />
                <meshStandardMaterial color="#fde7c6" emissive="#7c5a33" emissiveIntensity={0.25} />
            </mesh>
            {/* Vindu */}
            <mesh position={[2.6, 2.9, -3.98]}>
                <planeGeometry args={[2, 1.5]} />
                <meshStandardMaterial color="#bfdbfe" emissive="#93c5fd" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[2.6, 2.9, -3.97]}>
                <boxGeometry args={[0.08, 1.5, 0.02]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* Bordet */}
            <mesh position={[0, 1, -0.6]}>
                <boxGeometry args={[3.4, 0.12, 2]} />
                <meshStandardMaterial color="#e5e7eb" emissive="#475569" emissiveIntensity={0.15} />
            </mesh>
            {[
                [-1.5, -1.5],
                [1.5, -1.5],
                [-1.5, 0.3],
                [1.5, 0.3],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.47, z]}>
                    <boxGeometry args={[0.1, 0.94, 0.1]} />
                    <meshStandardMaterial color="#7c4a2d" />
                </mesh>
            ))}
            {/* Stolen */}
            <mesh position={[0, 0.62, -1.9]}>
                <boxGeometry args={[0.9, 0.08, 0.8]} />
                <meshStandardMaterial color="#7c4a2d" />
            </mesh>
            <mesh position={[0, 1.3, -2.28]}>
                <boxGeometry args={[0.9, 1.3, 0.08]} />
                <meshStandardMaterial color="#7c4a2d" />
            </mesh>
            {/* Lampen */}
            <mesh position={[0, 4.2, -0.6]}>
                <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 3.35, -0.6]}>
                <coneGeometry args={[0.45, 0.4, 20, 1, true]} />
                <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 3.2, -0.6]}>
                <sphereGeometry args={[0.15, 12, 10]} />
                <meshBasicMaterial color="#fff7d6" />
            </mesh>
        </group>
    );
}

/** Tallerken med mat. Lyser rødt når setningen gjør bestemor til maten. */
function Tallerken({ fare, tid }: { fare: boolean; tid: MutableRefObject<number> }) {
    const ring = useRef<THREE.MeshBasicMaterial>(null);
    useFrame(() => {
        if (ring.current) ring.current.opacity = fare ? 0.45 + 0.3 * Math.sin(tid.current * 5) : 0;
    });
    return (
        <group position={[0, 1.07, -0.4]}>
            <mesh>
                <cylinderGeometry args={[0.42, 0.34, 0.04, 28]} />
                <meshStandardMaterial color="#ffffff" emissive="#cbd5e1" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[-0.12, 0.08, 0.05]}>
                <sphereGeometry args={[0.12, 12, 10]} />
                <meshStandardMaterial color="#ea580c" />
            </mesh>
            <mesh position={[0.13, 0.07, -0.04]}>
                <sphereGeometry args={[0.1, 12, 10]} />
                <meshStandardMaterial color="#65a30d" />
            </mesh>
            <mesh position={[0.02, 0.06, 0.16]}>
                <sphereGeometry args={[0.09, 12, 10]} />
                <meshStandardMaterial color="#facc15" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <ringGeometry args={[0.46, 0.6, 32]} />
                <meshBasicMaterial ref={ring} color={ROD} transparent opacity={0} depthWrite={false} />
            </mesh>
        </group>
    );
}

/** Bestemor på stolen. Lener seg bakover når hun blir skremt, og spiser når hun får kommaet. */
function Bestemor({ modus, beat, tid }: { modus: Modus; beat: number; tid: MutableRefObject<number> }) {
    const kropp = useRef<THREE.Group>(null);
    const arm = useRef<THREE.Group>(null);
    const lene = useRef(0);
    const skremt = modus === 'bord' && (beat === 1 || beat === 2);
    const spiser = modus === 'slutt' && beat === 3;
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        const mal = skremt ? -0.22 : (modus === 'bord' && beat >= 3) || spiser ? 0.12 : 0;
        lene.current = THREE.MathUtils.lerp(lene.current, mal, 1 - Math.exp(-4 * dt));
        if (kropp.current) kropp.current.rotation.x = lene.current;
        if (arm.current) {
            const t = tid.current;
            arm.current.rotation.x = spiser ? -0.9 - 0.5 * Math.max(0, Math.sin(t * 3)) : -1.25;
        }
    });
    return (
        <group position={[0, 0.66, -1.85]}>
            <group ref={kropp}>
                {/* Skjørt og fang */}
                <mesh position={[0, 0.12, 0.25]}>
                    <boxGeometry args={[0.78, 0.24, 0.7]} />
                    <meshStandardMaterial color="#6d28d9" emissive="#4c1d95" emissiveIntensity={0.25} />
                </mesh>
                {/* Kroppen, i lilla strikkejakke */}
                <mesh position={[0, 0.62, 0]}>
                    <cylinderGeometry args={[0.3, 0.4, 0.9, 16]} />
                    <meshStandardMaterial color="#7c3aed" emissive="#5b21b6" emissiveIntensity={0.25} />
                </mesh>
                <mesh position={[0, 1.33, 0.02]}>
                    <sphereGeometry args={[0.29, 18, 14]} />
                    <meshStandardMaterial color="#f5cba7" emissive="#7c4a2d" emissiveIntensity={0.18} />
                </mesh>
                {/* Grått hår med knute */}
                <mesh position={[0, 1.42, -0.06]}>
                    <sphereGeometry args={[0.3, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                    <meshStandardMaterial color="#d1d5db" emissive="#6b7280" emissiveIntensity={0.25} />
                </mesh>
                <mesh position={[0, 1.62, -0.2]}>
                    <sphereGeometry args={[0.13, 12, 10]} />
                    <meshStandardMaterial color="#d1d5db" emissive="#6b7280" emissiveIntensity={0.25} />
                </mesh>
                {/* Briller */}
                {[-0.11, 0.11].map((x) => (
                    <mesh key={x} position={[x, 1.36, 0.28]}>
                        <torusGeometry args={[0.07, 0.015, 6, 16]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                ))}
                {[-0.11, 0.11].map((x) => (
                    <mesh key={`oye${x}`} position={[x, 1.36, 0.27]}>
                        <sphereGeometry args={[0.035, 8, 6]} />
                        <meshBasicMaterial color="#1f2937" />
                    </mesh>
                ))}
                {/* Venstre arm hviler, høyre arm holder gaffelen */}
                <mesh position={[-0.38, 0.75, 0.3]} rotation={[-1.2, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
                    <meshStandardMaterial color="#7c3aed" />
                </mesh>
                <group ref={arm} position={[0.38, 0.95, 0.05]}>
                    <mesh position={[0, -0.3, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
                        <meshStandardMaterial color="#7c3aed" />
                    </mesh>
                    <mesh position={[0, -0.7, 0]}>
                        <boxGeometry args={[0.04, 0.3, 0.04]} />
                        <meshStandardMaterial color="#9ca3af" emissive="#e5e7eb" emissiveIntensity={0.3} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

// ---------- Veien i 3D ----------

function Vei({ modus }: { modus: Modus }) {
    const striper = useRef<THREE.InstancedMesh>(null);
    const lengde = modus === 'vei' ? 36 : 64;
    const start = -30;
    const antall = Math.floor(lengde / 2.4);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame(() => {
        const s = striper.current;
        if (!s) return;
        for (let i = 0; i < antall; i++) {
            o.position.set(start + 1 + i * 2.4, 0.07, 0);
            o.updateMatrix();
            s.setMatrixAt(i, o.matrix);
        }
        s.instanceMatrix.needsUpdate = true;
    });
    const rampeLengde = Math.hypot(8, 2);
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <planeGeometry args={[140, 80]} />
                <meshStandardMaterial color="#65a30d" emissive="#365314" emissiveIntensity={0.35} />
            </mesh>
            <mesh position={[start + lengde / 2, 0.03, 0]}>
                <boxGeometry args={[lengde, 0.06, 4]} />
                <meshStandardMaterial color="#4b5563" emissive="#1f2937" emissiveIntensity={0.4} />
            </mesh>
            <instancedMesh ref={striper} args={[undefined, undefined, antall]} frustumCulled={false}>
                <boxGeometry args={[1.2, 0.02, 0.18]} />
                <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.4} />
            </instancedMesh>
            {modus === 'vei' && (
                <>
                    <mesh position={[10, 1, 0]} rotation={[0, 0, Math.atan2(2, 8)]}>
                        <boxGeometry args={[rampeLengde, 0.12, 4]} />
                        <meshStandardMaterial color="#4b5563" emissive="#1f2937" emissiveIntensity={0.4} />
                    </mesh>
                    <mesh position={[19, 1, 0]}>
                        <boxGeometry args={[10, 2, 4]} />
                        <meshStandardMaterial color="#9ca3af" emissive="#374151" emissiveIntensity={0.3} />
                    </mesh>
                    <mesh position={[19, 2.03, 0]}>
                        <boxGeometry args={[10, 0.06, 4]} />
                        <meshStandardMaterial color="#4b5563" emissive="#1f2937" emissiveIntensity={0.4} />
                    </mesh>
                </>
            )}
        </group>
    );
}

function Bil({ modus, beat, tid, lyd }: { modus: Modus; beat: number; tid: MutableRefObject<number>; lyd: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const lykt = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(() => {
        const g = ref.current;
        if (!g) return;
        const x = bilX(modus, beat, tid.current);
        g.position.set(x, veiHoyde(modus, x) + 0.06, 0.9);
        const iRampe = modus === 'vei' && x > 6 && x < 14;
        g.rotation.z = iRampe ? Math.atan2(2, 8) : 0;
        if (lykt.current) lykt.current.emissiveIntensity = lyd ? 1 + Math.max(0, Math.sin(tid.current * 8)) * 2 : 0.6;
    });
    return (
        <group ref={ref}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[2.2, 0.55, 1.15]} />
                <meshStandardMaterial color={ROD} emissive="#7f1d1d" emissiveIntensity={0.35} />
            </mesh>
            <mesh position={[-0.15, 0.98, 0]}>
                <boxGeometry args={[1.15, 0.45, 1.05]} />
                <meshStandardMaterial color="#bae6fd" emissive="#0369a1" emissiveIntensity={0.25} />
            </mesh>
            {[
                [-0.7, 0.58],
                [0.7, 0.58],
                [-0.7, -0.58],
                [0.7, -0.58],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.24, z]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.24, 0.24, 0.16, 14]} />
                    <meshStandardMaterial color="#111827" />
                </mesh>
            ))}
            <mesh position={[1.11, 0.55, 0.32]}>
                <boxGeometry args={[0.04, 0.16, 0.22]} />
                <meshStandardMaterial ref={lykt} color="#fef9c3" emissive="#fde047" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[1.11, 0.55, -0.32]}>
                <boxGeometry args={[0.04, 0.16, 0.22]} />
                <meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={0.6} />
            </mesh>
        </group>
    );
}

/** Lydringer ut fra bilen: utropstegnet skrur opp volumet. */
function Lydringer({ modus, beat, tid }: { modus: Modus; beat: number; tid: MutableRefObject<number> }) {
    const ringer = useRef<(THREE.Mesh | null)[]>([]);
    const aktiv = (modus === 'vei' && beat === 4) || (modus === 'rytme' && beat === 0);
    const styrke = modus === 'vei' ? 1 : 0.6;
    useFrame(() => {
        const x = bilX(modus, beat, tid.current);
        ringer.current.forEach((r, i) => {
            if (!r) return;
            if (!aktiv) {
                r.visible = false;
                return;
            }
            const alder = (tid.current + i * 0.6) % 1.8;
            r.visible = true;
            r.position.set(x + 0.4, veiHoyde(modus, x) + 1.2, 0.9);
            r.scale.setScalar(0.5 + alder * (modus === 'vei' ? 2.4 : 1.4));
            (r.material as THREE.MeshBasicMaterial).opacity = styrke * (1 - alder / 1.8) * 0.85;
        });
    });
    return (
        <>
            {[0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        ringer.current[i] = m;
                    }}
                    visible={false}
                >
                    <torusGeometry args={[1, 0.06, 6, 48]} />
                    <meshBasicMaterial color={GULL} transparent opacity={0} depthWrite={false} />
                </mesh>
            ))}
        </>
    );
}

const SKILT_Z = -2.9;

function SkiltModell({ skilt, modus, tid }: { skilt: Skilt; modus: Modus; tid: MutableRefObject<number> }) {
    const lampe = useRef<THREE.MeshStandardMaterial>(null);
    const y0 = veiHoyde(modus, skilt.x);
    useFrame(() => {
        if (lampe.current) lampe.current.emissiveIntensity = Math.sin(tid.current * 6 + skilt.x) > 0 ? 2.2 : 0.15;
    });
    const stolpe = (
        <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 2.4, 8]} />
            <meshStandardMaterial color="#9ca3af" emissive="#4b5563" emissiveIntensity={0.3} />
        </mesh>
    );
    return (
        <group position={[skilt.x, y0, SKILT_Z]}>
            {stolpe}
            {skilt.type === 'stopp' && (
                <>
                    <mesh position={[0, 2.6, 0]} rotation={[Math.PI / 2, Math.PI / 8, 0]}>
                        <cylinderGeometry args={[0.72, 0.72, 0.08, 8]} />
                        <meshStandardMaterial color="#ffffff" />
                    </mesh>
                    <mesh position={[0, 2.6, 0.05]} rotation={[Math.PI / 2, Math.PI / 8, 0]}>
                        <cylinderGeometry args={[0.62, 0.62, 0.04, 8]} />
                        <meshStandardMaterial color={ROD} emissive="#991b1b" emissiveIntensity={0.5} />
                    </mesh>
                </>
            )}
            {skilt.type === 'komma' && (
                <>
                    <mesh position={[0, 2.75, 0]}>
                        <boxGeometry args={[0.55, 0.8, 0.4]} />
                        <meshStandardMaterial color="#111827" />
                    </mesh>
                    <mesh position={[0, 2.75, 0.21]}>
                        <sphereGeometry args={[0.2, 14, 10]} />
                        <meshStandardMaterial ref={lampe} color="#facc15" emissive="#facc15" emissiveIntensity={1} />
                    </mesh>
                </>
            )}
            {skilt.type === 'sporsmal' && (
                <mesh position={[0, 2.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.65, 0.65, 0.08, 28]} />
                    <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={0.5} />
                </mesh>
            )}
            {skilt.type === 'utrop' && (
                <mesh position={[0, 2.75, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.85, 0.85, 0.08, 3]} />
                    <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.5} />
                </mesh>
            )}
        </group>
    );
}

// ---------- Ankre for merkelapper ----------

const ANKER_HODE = v(0, 2.75, -1.85);
const ANKER_TALLERKEN = v(0, 1.35, -0.4);

function ankerFor(modus: Modus): THREE.Vector3[] {
    if (modus === 'vei') return VEI_SKILT.map((s) => v(s.x, veiHoyde(modus, s.x) + 3.7, SKILT_Z));
    if (modus === 'bord' || modus === 'slutt') return [ANKER_HODE, ANKER_TALLERKEN];
    return [];
}

// ---------- Scenen ----------

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
    const proj = useMemo(() => new THREE.Vector3(), []);
    const ute = modus === 'vei' || modus === 'rytme';
    const skilt = modus === 'vei' ? VEI_SKILT : modus === 'rytme' ? rytmeSkilt(beat) : [];

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const bx = bilX(modus, beat, tid.current);
        const mal = kameraFor(modus, beat, tid.current, bx);
        // Kameraet som følger bilen, står fast på den. De andre glir dit.
        const folger = (modus === 'vei' && beat === 3) || (modus === 'rytme' && beat !== 1);
        const k = forste.current || folger ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
        camera.updateMatrixWorld();

        ankerFor(modus).forEach((a, i) => {
            const el = merker.current[i];
            if (!el) return;
            proj.copy(a).project(camera);
            el.style.left = `${((proj.x + 1) / 2) * 1000}px`;
            el.style.top = `${((1 - proj.y) / 2) * 562}px`;
        });
    });

    const himmel = ute ? '#bfdbfe' : '#2a1d14';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, ute ? 45 : 14, ute ? 110 : 30]} />
            <ambientLight intensity={ute ? 0.75 : 0.6} color={ute ? '#ffffff' : '#ffe8cc'} />
            <directionalLight position={[6, 12, 8]} intensity={ute ? 1.4 : 1.1} color="#fff4e0" />
            <hemisphereLight args={[ute ? '#e0f2fe' : '#fde68a', '#1e1b2e', 0.5]} />
            {!ute && (
                <>
                    <pointLight position={[0, 3, -0.6]} intensity={modus === 'slutt' ? 9 : 6} distance={9} color="#ffd9a0" />
                    <Kjokken />
                    <Tallerken fare={modus === 'bord' && beat === 2} tid={tid} />
                    <Bestemor modus={modus} beat={beat} tid={tid} />
                </>
            )}
            {ute && (
                <>
                    <Vei modus={modus} />
                    {skilt.map((s, i) => (
                        <SkiltModell key={`${beat}-${i}-${s.type}`} skilt={s} modus={modus} tid={tid} />
                    ))}
                    <Bil modus={modus} beat={beat} tid={tid} lyd={modus === 'vei' && beat === 4} />
                    <Lydringer modus={modus} beat={beat} tid={tid} />
                </>
            )}
        </>
    );
}

// ---------- DOM over lerretet ----------

function Boks({ children, style }: { children: ReactNode; style: CSSProperties }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute rounded-2xl shadow-2xl"
            style={{ background: 'rgba(15, 23, 42, 0.88)', padding: '12px 22px', ...FONT, ...style }}
        >
            {children}
        </motion.div>
    );
}

/** Ord som brikker. Kommaet kan dukke opp mellom dem. */
function Ytring({ komma, farge }: { komma: boolean; farge: string }) {
    return (
        <div className="flex items-end" style={{ fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
            <span>«Spis</span>
            <AnimatePresence>
                {komma && (
                    <motion.span
                        initial={{ opacity: 0, scale: 3, y: -30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                        style={{ color: farge, display: 'inline-block' }}
                    >
                        ,
                    </motion.span>
                )}
            </AnimatePresence>
            <span style={{ marginLeft: 14 }}>bestemor!»</span>
        </div>
    );
}

const VEI_MERKER: { tegn: string; navn: string }[] = [
    { tegn: '.', navn: 'punktum' },
    { tegn: ',', navn: 'komma' },
    { tegn: '?', navn: 'spørsmålstegn' },
    { tegn: '!', navn: 'utropstegn' },
];

const VEI_REGEL: Record<number, { tittel: string; under: string; farge?: string }> = {
    0: { tittel: 'Setningen er en biltur', under: 'tegnene er trafikkskiltene' },
    1: { tittel: 'Punktum = stoppskilt', under: 'stopp helt, en ny tanke kommer' },
    2: { tittel: 'Komma = gult blinkende lys', under: 'ta en kort pust og se deg om' },
    3: { tittel: 'Spørsmålstegn = stemmen går opp', under: 'som om du venter på svar' },
    4: { tittel: 'Utropstegn = volumet opp', under: 'glede, sinne, overraskelse, kommando' },
};

const RYTME_REGEL: Record<number, { tittel: string; under: string; farge?: string }> = {
    0: { tittel: 'Les teksten høyt', under: 'lytt etter hvor du stopper' },
    1: { tittel: 'Der du puster, står det ofte et tegn', under: 'kort pust: komma · stopp helt: punktum' },
    2: { tittel: 'Ingen tegn: leseren mister pusten', under: 'som en vei uten et eneste skilt', farge: '#fca5a5' },
    3: { tittel: 'For mange punktum: hakkete', under: 'stopp, start, stopp, start', farge: '#fca5a5' },
    4: { tittel: 'Tegnsetting er rytme', under: 'pust der det trengs, stopp når tanken er ferdig', farge: '#86efac' },
};

const BORD_MERKER = [
    { id: 'skremt', tekst: '!' },
    { id: 'mat', tekst: 'maten venter' },
];

function Overlegg({ modus, beat, merker }: { modus: Modus; beat: number; merker: MutableRefObject<(HTMLDivElement | null)[]> }) {
    const regel = modus === 'vei' ? VEI_REGEL[beat] : modus === 'rytme' ? RYTME_REGEL[beat] : undefined;
    return (
        <Flate>
            <AnimatePresence mode="wait">
                {regel && (
                    <Boks key={`${modus}-${beat}`} style={{ left: 30, bottom: 26 }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color: regel.farge ?? '#fff' }}>
                            {regel.tittel}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: GULL }}>{regel.under}</div>
                    </Boks>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {modus === 'rytme' && beat === 2 && (
                    <Boks key="lang" style={{ left: 30, right: 30, top: 24 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>
                            jeg løp ut og hunden fulgte etter og vi gikk til butikken og kjøpte pizza og brus og
                            sjokolade og så gikk vi hjem og så
                        </div>
                    </Boks>
                )}
                {modus === 'rytme' && beat === 3 && (
                    <Boks key="hakk" style={{ left: 30, top: 24 }}>
                        <div style={{ fontSize: 30, fontWeight: 800, color: '#e2e8f0' }}>Jeg løp. Ut. Hunden. Fulgte. Etter.</div>
                    </Boks>
                )}
                {modus === 'rytme' && beat === 4 && (
                    <Boks key="god" style={{ left: 30, top: 24 }}>
                        <div style={{ fontSize: 30, fontWeight: 800, color: '#e2e8f0' }}>
                            Jeg løp ut<span style={{ color: GULL }}>,</span> og hunden fulgte etter
                            <span style={{ color: GULL }}>.</span>
                        </div>
                    </Boks>
                )}
                {modus === 'bord' && beat >= 1 && (
                    <Boks key="ytring" style={{ left: 40, top: 28 }}>
                        <Ytring komma={beat >= 3} farge={beat >= 3 ? '#86efac' : '#fff'} />
                    </Boks>
                )}
                {modus === 'bord' && beat === 2 && (
                    <Boks key="mat" style={{ right: 40, bottom: 28, background: 'rgba(127, 29, 29, 0.92)' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Uten komma: Hva skal spises?</div>
                        <div style={{ fontSize: 30, fontWeight: 900, color: '#fecaca' }}>Bestemor!</div>
                    </Boks>
                )}
                {modus === 'bord' && beat === 3 && (
                    <Boks key="tiltale" style={{ left: 40, bottom: 28, background: 'rgba(20, 83, 45, 0.92)' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Med komma: Hvem snakker du til?</div>
                        <div style={{ fontSize: 30, fontWeight: 900, color: '#bbf7d0' }}>Bestemor. Hun skal smake på maten.</div>
                    </Boks>
                )}
                {modus === 'bord' && beat === 4 && (
                    <Boks key="sma" style={{ right: 40, bottom: 28 }}>
                        <div style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>Små tegn styrer</div>
                        <div style={{ fontSize: 30, fontWeight: 900, color: GULL }}>hva leseren forstår</div>
                    </Boks>
                )}
                {modus === 'slutt' && beat === 0 && (
                    <Boks key="kart" style={{ left: 40, top: 28 }}>
                        <Ytring komma farge={GULL} />
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 8 }}>
                            Kommaet viser veien:
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: GULL }}>
                            du snakker til bestemor, du spiser henne ikke
                        </div>
                    </Boks>
                )}
                {modus === 'slutt' && beat === 1 && (
                    <Boks key="ryddig" style={{ right: 40, top: 28 }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Ryddig tekst:</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#86efac' }}>lettere å lese</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#86efac' }}>mer overbevisende</div>
                    </Boks>
                )}
                {modus === 'slutt' && beat === 3 && (
                    <Boks key="spis" style={{ left: 40, top: 28 }}>
                        <Ytring komma farge={GULL} />
                    </Boks>
                )}
            </AnimatePresence>

            {/* Merkelapper som følger 3D-punkter (plassert av useFrame). */}
            {modus === 'vei' &&
                VEI_MERKER.map((m, i) => {
                    const synlig = beat === 0 || beat === i + 1;
                    return (
                        <div
                            key={m.navn}
                            ref={(el) => {
                                merker.current[i] = el;
                            }}
                            className="absolute"
                            style={{ transform: 'translate(-50%, -100%)' }}
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: synlig ? 1 : 0 }}
                                transition={{ duration: 0.5 }}
                                className="rounded-xl shadow-xl text-center"
                                style={{
                                    ...FONT,
                                    background: 'rgba(255,255,255,0.96)',
                                    color: '#0f172a',
                                    padding: beat === 0 ? '2px 12px' : '4px 18px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <div style={{ fontSize: beat === 0 ? 40 : 60, fontWeight: 900, lineHeight: 1 }}>{m.tegn}</div>
                                <div style={{ fontSize: beat === 0 ? 18 : 24, fontWeight: 800, color: '#475569' }}>{m.navn}</div>
                            </motion.div>
                        </div>
                    );
                })}
            {(modus === 'bord' || modus === 'slutt') &&
                BORD_MERKER.map((m, i) => {
                    const synlig =
                        m.id === 'skremt' ? modus === 'bord' && beat === 1 : modus === 'slutt' && beat === 2;
                    return (
                        <div
                            key={m.id}
                            ref={(el) => {
                                merker.current[i] = el;
                            }}
                            className="absolute"
                            style={{ transform: 'translate(-50%, -100%)' }}
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: synlig ? 1 : 0 }}
                                className={m.id === 'skremt' ? '' : 'rounded-xl shadow-xl'}
                                style={
                                    m.id === 'skremt'
                                        ? { ...FONT, fontSize: 64, fontWeight: 900, color: ROD, lineHeight: 1 }
                                        : {
                                              ...FONT,
                                              background: 'rgba(255,255,255,0.95)',
                                              color: GRONN,
                                              fontSize: 24,
                                              fontWeight: 800,
                                              padding: '4px 14px',
                                              whiteSpace: 'nowrap',
                                          }
                                }
                            >
                                {m.tekst}
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

export function TegnsettingVerden({ beat, playing, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'bord';
    const merker = useRef<(HTMLDivElement | null)[]>([]);
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [0, 3.4, 7] }}
                gl={{ antialias: true }}
            >
                <Innhold modus={modus} beat={beat} playing={playing} merker={merker} />
            </Canvas>
            <Overlegg modus={modus} beat={beat} merker={merker} />
        </div>
    );
}
