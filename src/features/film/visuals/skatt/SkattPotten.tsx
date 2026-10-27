import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Skattepotten i 3D. Tre moduser:
 * - butikk: hodetelefoner til 500 kroner. Fem mynter (100 kroner hver) går i kassa, og én
 *   av dem går videre til staten.
 * - pott: pizza mot skatt. Du får en pizza for pengene i pizzabua, men ingenting for
 *   skatten. Så strømmer mynter fra alle husene inn i en felles pott.
 * - ut: potten betaler for skole, sykehus, vei, politi, domstol, forsvar og Nav.
 */

type Modus = 'butikk' | 'pott' | 'ut';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    butikk: ['Hodetelefoner: 500 kroner', 'Pengene går i kassa', '100 kroner går til staten', 'Moms: skatten i prisen'],
    pott: ['Pizza for pengene', 'Skatt: ingen pizza tilbake', 'Alle betaler i én pott', 'En felles pott'],
    ut: ['Potten betaler for det vi har sammen', 'Skole og sykehus', 'Vei, politi, domstol og forsvar', 'Nav: hjelp når du er syk eller ledig'],
};

// ---------- Byen rundt potten ----------

interface Bygg {
    id: string;
    navn: string;
    pos: THREE.Vector3;
    str: [number, number, number];
    farge: string;
    tak: string;
    fraBeat: number;
}

const OFFENTLIG: Bygg[] = [
    { id: 'skole', navn: 'Skole', pos: v(-12, 0, -6), str: [6, 3.4, 4], farge: '#fde68a', tak: '#b45309', fraBeat: 1 },
    { id: 'sykehus', navn: 'Sykehus', pos: v(-5, 0, -12), str: [5, 6, 4], farge: '#f8fafc', tak: '#dc2626', fraBeat: 1 },
    { id: 'vei', navn: 'Vei', pos: v(12.5, 0, 1.5), str: [2.4, 0.15, 9], farge: '#475569', tak: '#475569', fraBeat: 2 },
    { id: 'politi', navn: 'Politi', pos: v(4, 0, -12.5), str: [4.4, 3.4, 3.6], farge: '#bfdbfe', tak: '#1d4ed8', fraBeat: 2 },
    { id: 'domstol', navn: 'Domstol', pos: v(10.5, 0, -8), str: [4.4, 3.8, 3.6], farge: '#e7e5e4', tak: '#57534e', fraBeat: 2 },
    { id: 'forsvar', navn: 'Forsvar', pos: v(9.5, 0, -14), str: [4, 2.6, 4], farge: '#bbc7a4', tak: '#4d5b34', fraBeat: 2 },
    { id: 'nav', navn: 'Nav', pos: v(5.5, 0, 9.5), str: [4.6, 3, 3.6], farge: '#fecaca', tak: '#b91c1c', fraBeat: 3 },
];

const HUS = [60, 100, 140, 180, 220, 260, 290].map((g) => v(12 * Math.sin((g * Math.PI) / 180), 0, 12 * Math.cos((g * Math.PI) / 180)));
const DEG = v(0, 0, 8.5);
const PIZZABU = v(-6.5, 0, 5.5);
const POTT_R = 2.4;
const POTT_H = 2.6;

// ---------- Butikken ----------

const KASSE = v(2.4, 1.6, 0);
const STATEN = v(-1, 0, -16);
const HAND = v(0, 2.2, 2.4);

/** Myntenes mål i butikken: i hånda, i kassa, eller (den siste) hos staten. */
function butikkMynt(i: number, beat: number) {
    if (beat === 0) return v(HAND.x - 1 + i * 0.5, HAND.y, HAND.z);
    if (i === 4 && beat >= 2) return v(STATEN.x, 4.6, STATEN.z + 3.2);
    return v(KASSE.x - 0.6 + (i % 2) * 0.6, KASSE.y + 0.75 + Math.floor(i / 2) * 0.16, KASSE.z);
}

function Butikken() {
    return (
        <group>
            {/* Disken */}
            <mesh position={[0, 0.7, 0]}>
                <boxGeometry args={[7, 1.4, 2.4]} />
                <meshStandardMaterial color="#c08457" flatShading />
            </mesh>
            <mesh position={[0, 1.45, 0]}>
                <boxGeometry args={[7.2, 0.12, 2.6]} />
                <meshStandardMaterial color="#f5f5f4" />
            </mesh>
            {/* Kassa */}
            <mesh position={[KASSE.x, KASSE.y + 0.25, KASSE.z]}>
                <boxGeometry args={[1.8, 0.7, 1.4]} />
                <meshStandardMaterial color="#334155" flatShading />
            </mesh>
            <mesh position={[KASSE.x, KASSE.y + 0.95, KASSE.z - 0.5]} rotation={[-0.4, 0, 0]}>
                <boxGeometry args={[1.2, 0.7, 0.1]} />
                <meshStandardMaterial color="#0f766e" emissive="#0f766e" emissiveIntensity={0.4} />
            </mesh>
            {/* Hodetelefonene */}
            <group position={[-1.6, 2.15, 0.2]}>
                <mesh rotation={[0, 0, 0]}>
                    <torusGeometry args={[0.55, 0.08, 8, 24, Math.PI]} />
                    <meshStandardMaterial color="#111827" />
                </mesh>
                {[-0.55, 0.55].map((x) => (
                    <mesh key={x} position={[x, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.28, 0.28, 0.22, 20]} />
                        <meshStandardMaterial color="#2563eb" />
                    </mesh>
                ))}
            </group>
            {/* Hyller bak */}
            {[-2.5, 0, 2.5].map((x) => (
                <mesh key={x} position={[x, 1.3, -3.2]}>
                    <boxGeometry args={[2.2, 2.6, 0.8]} />
                    <meshStandardMaterial color="#e2e8f0" flatShading />
                </mesh>
            ))}
            {/* Staten langt bak: et hus med søyler */}
            <group position={STATEN}>
                <mesh position={[0, 0.4, 0]}>
                    <boxGeometry args={[8, 0.8, 5]} />
                    <meshStandardMaterial color="#e7e5e4" />
                </mesh>
                {[-3, -1.5, 0, 1.5, 3].map((x) => (
                    <mesh key={x} position={[x, 2.4, 2]}>
                        <cylinderGeometry args={[0.3, 0.3, 3.2, 12]} />
                        <meshStandardMaterial color="#f5f5f4" />
                    </mesh>
                ))}
                <mesh position={[0, 2.4, -0.6]}>
                    <boxGeometry args={[7, 3.2, 3]} />
                    <meshStandardMaterial color="#d6d3d1" />
                </mesh>
                <mesh position={[0, 4.4, 0.4]} rotation={[0, Math.PI / 4, 0]} scale={[1, 0.35, 1]}>
                    <coneGeometry args={[5.6, 2.4, 4]} />
                    <meshStandardMaterial color="#a8a29e" flatShading />
                </mesh>
            </group>
        </group>
    );
}

// ---------- Byen ----------

function Hus({ pos }: { pos: THREE.Vector3 }) {
    return (
        <group position={pos} rotation={[0, Math.atan2(-pos.x, -pos.z), 0]}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[2.2, 2, 2.2]} />
                <meshStandardMaterial color="#fef3c7" flatShading />
            </mesh>
            <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[1.8, 1.3, 4]} />
                <meshStandardMaterial color="#9a3412" flatShading />
            </mesh>
        </group>
    );
}

function Offentlig({ b, lys }: { b: Bygg; lys: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (mat.current) mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, lys ? 0.35 : 0, 3, dt);
    });
    if (b.id === 'vei') {
        return (
            <group position={b.pos}>
                <mesh position={[0, 0.08, 0]}>
                    <boxGeometry args={b.str} />
                    <meshStandardMaterial ref={mat} color={b.farge} emissive="#facc15" emissiveIntensity={0} />
                </mesh>
                {[-3, -1, 1, 3].map((z) => (
                    <mesh key={z} position={[0, 0.17, z]}>
                        <boxGeometry args={[0.2, 0.02, 1]} />
                        <meshBasicMaterial color="#f8fafc" />
                    </mesh>
                ))}
                <mesh position={[0.5, 0.55, 1.5]}>
                    <boxGeometry args={[0.9, 0.7, 1.6]} />
                    <meshStandardMaterial color="#ef4444" />
                </mesh>
            </group>
        );
    }
    return (
        <group position={b.pos} rotation={[0, Math.atan2(-b.pos.x, -b.pos.z), 0]}>
            <mesh position={[0, b.str[1] / 2, 0]}>
                <boxGeometry args={b.str} />
                <meshStandardMaterial ref={mat} color={b.farge} emissive="#facc15" emissiveIntensity={0} flatShading />
            </mesh>
            <mesh position={[0, b.str[1] + 0.15, 0]}>
                <boxGeometry args={[b.str[0] + 0.3, 0.3, b.str[2] + 0.3]} />
                <meshStandardMaterial color={b.tak} />
            </mesh>
            {b.id === 'sykehus' && (
                <group position={[0, b.str[1] * 0.7, b.str[2] / 2 + 0.03]}>
                    <mesh>
                        <boxGeometry args={[1.4, 0.4, 0.05]} />
                        <meshBasicMaterial color="#dc2626" />
                    </mesh>
                    <mesh>
                        <boxGeometry args={[0.4, 1.4, 0.05]} />
                        <meshBasicMaterial color="#dc2626" />
                    </mesh>
                </group>
            )}
            {/* Vinduer */}
            {[-1, 0, 1].map((k) => (
                <mesh key={k} position={[k * (b.str[0] / 3.2), b.str[1] * 0.4, b.str[2] / 2 + 0.03]}>
                    <boxGeometry args={[0.7, 0.8, 0.05]} />
                    <meshBasicMaterial color="#1e3a5f" />
                </mesh>
            ))}
        </group>
    );
}

function Potten({ fyll }: { fyll: number }) {
    const gull = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        const g = gull.current;
        if (!g) return;
        const s = damp(g.scale.y, Math.max(0.02, fyll), 1.2, dt || 1);
        g.scale.y = s;
        g.position.y = 0.3 + (POTT_H - 0.4) * s * 0.5;
    });
    return (
        <group>
            <mesh position={[0, POTT_H / 2, 0]}>
                <cylinderGeometry args={[POTT_R, POTT_R * 0.8, POTT_H, 28, 1, true]} />
                <meshStandardMaterial color="#334155" side={THREE.DoubleSide} flatShading />
            </mesh>
            <mesh position={[0, POTT_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[POTT_R, 0.16, 8, 32]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh ref={gull} position={[0, 0.3, 0]} scale={[1, 0.02, 1]}>
                <cylinderGeometry args={[POTT_R * 0.95, POTT_R * 0.78, POTT_H - 0.4, 28]} />
                <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.35} />
            </mesh>
        </group>
    );
}

/** En person (deg) foran potten. */
function Person({ pos }: { pos: THREE.Vector3 }) {
    return (
        <group position={pos}>
            <mesh position={[0, 0.9, 0]}>
                <capsuleGeometry args={[0.4, 0.9, 4, 10]} />
                <meshStandardMaterial color="#0d9488" />
            </mesh>
            <mesh position={[0, 2, 0]}>
                <sphereGeometry args={[0.38, 16, 12]} />
                <meshStandardMaterial color="#e8b48c" />
            </mesh>
        </group>
    );
}

function Pizzabu() {
    return (
        <group position={PIZZABU} rotation={[0, 0.9, 0]}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[3, 2, 2]} />
                <meshStandardMaterial color="#fb923c" flatShading />
            </mesh>
            <mesh position={[0, 2.3, 0.3]} rotation={[0.3, 0, 0]}>
                <boxGeometry args={[3.4, 0.15, 2.4]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
        </group>
    );
}

// ---------- Mynter ----------

const MYNTER = 64;

interface Strom {
    fra: THREE.Vector3;
    til: THREE.Vector3;
    antall: number;
}

function stromFor(modus: Modus, beat: number): Strom[] {
    const potTopp = v(0, POTT_H + 0.3, 0);
    if (modus === 'pott' && beat >= 2)
        return HUS.map((h) => ({ fra: v(h.x * 0.85, 2.2, h.z * 0.85), til: potTopp, antall: 6 }));
    if (modus === 'ut')
        return OFFENTLIG.filter((b) => beat >= b.fraBeat).map((b) => ({
            fra: potTopp,
            til: v(b.pos.x * 0.9, b.id === 'vei' ? 1 : b.str[1] + 0.8, b.pos.z * 0.9),
            antall: 6,
        }));
    return [];
}

function Myntstrom({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const strom = useMemo(() => stromFor(modus, beat), [modus, beat]);
    const obj = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        let k = 0;
        for (const s of strom) {
            for (let j = 0; j < s.antall && k < MYNTER; j++, k++) {
                const f = (tid.current * 0.35 + j / s.antall) % 1;
                obj.position.lerpVectors(s.fra, s.til, f);
                obj.position.y += Math.sin(f * Math.PI) * 3;
                obj.rotation.set(Math.PI / 2, f * 6, 0);
                obj.scale.setScalar(1);
                obj.updateMatrix();
                m.setMatrixAt(k, obj.matrix);
            }
        }
        for (; k < MYNTER; k++) {
            obj.scale.setScalar(0);
            obj.updateMatrix();
            m.setMatrixAt(k, obj.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, MYNTER]} frustumCulled={false}>
            <cylinderGeometry args={[0.32, 0.32, 0.08, 16]} />
            <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.4} metalness={0.3} />
        </instancedMesh>
    );
}

/** En enkelt mynt eller pizza som glir mot et mål og bøyer seg i en bue. */
function Glider({
    mål,
    forste,
    children,
    playing,
}: {
    mål: THREE.Vector3;
    forste?: THREE.Vector3;
    children: React.ReactNode;
    playing: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const start = useRef(true);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        if (start.current) {
            g.position.copy(forste ?? mål);
            start.current = false;
        }
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const avstand = Math.hypot(g.position.x - mål.x, g.position.z - mål.z);
        g.position.x = damp(g.position.x, mål.x, 2.2, dt);
        g.position.z = damp(g.position.z, mål.z, 2.2, dt);
        g.position.y = damp(g.position.y, mål.y + Math.min(3, avstand * 0.35), 3, dt);
    });
    return <group ref={ref}>{children}</group>;
}

function Mynt() {
    return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.08, 16]} />
            <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.4} metalness={0.3} />
        </mesh>
    );
}

function Pizza() {
    return (
        <group>
            <mesh>
                <cylinderGeometry args={[0.7, 0.7, 0.1, 24]} />
                <meshStandardMaterial color="#f59e0b" />
            </mesh>
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} position={[Math.cos(i * 1.3) * 0.4, 0.07, Math.sin(i * 1.3) * 0.4]}>
                    <cylinderGeometry args={[0.12, 0.12, 0.04, 10]} />
                    <meshStandardMaterial color="#b91c1c" />
                </mesh>
            ))}
        </group>
    );
}

// ---------- Kamera ----------

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'butikk') {
        switch (beat) {
            case 0:
                return { pos: v(-1.5 + t * 0.08, 5, 10), se: v(-0.4, 1.8, 0) };
            case 1:
                return { pos: v(4.5, 4.6, 7.5), se: v(1.8, 1.8, 0) };
            case 2:
                return { pos: v(7, 11, 12 + t * 0.15), se: v(0, 2, -7) };
            default:
                return { pos: v(-7, 10, 12), se: v(0, 2, -6) };
        }
    }
    if (modus === 'pott') {
        switch (beat) {
            case 0:
                return { pos: v(2, 8, 16), se: v(-3, 1.5, 4) };
            case 1:
                return { pos: v(4, 8, 16), se: v(-1, 1.8, 3) };
            case 2:
                return { pos: v(0, 17, 23), se: v(0, 1, 2) };
            default:
                return { pos: v(Math.sin(t * 0.08) * 22, 15, Math.cos(t * 0.08) * 22), se: v(0, 1.5, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 9, 13), se: v(0, 2, 0) };
        case 1:
            return { pos: v(2, 20, 15), se: v(-5, 0, -5) };
        case 2:
            return { pos: v(-2, 13, 14), se: v(7, 1, -5) };
        default:
            return { pos: v(-4, 8, 21), se: v(4, 1.5, 6) };
    }
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mål = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        se.current.lerp(mål.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Skilt({ tekst, tone }: { tekst: string; tone: 'rod' | 'gronn' | 'gull' | 'vanlig' }) {
    const farge = {
        rod: 'border-red-500 text-red-700',
        gronn: 'border-teal-500 text-teal-700',
        gull: 'border-amber-500 text-amber-700',
        vanlig: 'border-slate-300 text-slate-800',
    }[tone];
    return (
        <div className={`px-3 py-1 rounded-xl bg-white/95 shadow-lg border-2 font-bold whitespace-nowrap text-lg ${farge}`}>
            {tekst}
        </div>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const fyll = modus === 'ut' ? 0.9 : modus === 'pott' ? (beat <= 1 ? 0.08 : beat === 2 ? 0.55 : 0.9) : 0;
    // Mynten din i pizza-scenen: til pizzabua, så til potten.
    const dinMynt = beat === 0 ? v(PIZZABU.x + 1.2, 2.6, PIZZABU.z + 1.2) : v(0, POTT_H + 0.4, 0);
    const pizzaMål = beat === 0 ? v(DEG.x - 0.9, 2.2, DEG.z) : v(DEG.x - 0.9, 1.6, DEG.z);
    return (
        <>
            <color attach="background" args={['#dbeafe']} />
            <fog attach="fog" args={['#dbeafe', 40, 90]} />
            <ambientLight intensity={0.65} />
            <directionalLight position={[20, 30, 15]} intensity={1.4} color="#fff7e6" />
            <hemisphereLight args={['#e0f2fe', '#4b5563', 0.5]} />

            {modus === 'butikk' ? (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[120, 120]} />
                        <meshStandardMaterial color="#e7e5e4" />
                    </mesh>
                    <Butikken />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <Glider key={i} mål={butikkMynt(i, beat)} playing={playing}>
                            <Mynt />
                        </Glider>
                    ))}
                    {beat === 0 && (
                        <Html position={[-1.6, 3.4, 0.2]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="500 kr" tone="vanlig" />
                        </Html>
                    )}
                    {beat >= 3 && (
                        <Html position={[KASSE.x + 0.5, 3.6, KASSE.z]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Butikken: 400 kr" tone="gronn" />
                        </Html>
                    )}
                    {beat >= 2 && (
                        <>
                            <Html position={[STATEN.x, 2.2, STATEN.z + 4]} center zIndexRange={[10, 0]}>
                                <Skilt tekst="Staten: 100 kr i moms" tone="gull" />
                            </Html>
                        </>
                    )}
                </>
            ) : (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[60, 48]} />
                        <meshStandardMaterial color="#a3c78a" />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                        <circleGeometry args={[5, 40]} />
                        <meshStandardMaterial color="#d6d3d1" />
                    </mesh>
                    <Potten fyll={fyll} />
                    {modus === 'pott' && HUS.map((h, i) => <Hus key={i} pos={h} />)}
                    {modus === 'ut' &&
                        OFFENTLIG.map((b) => <Offentlig key={b.id} b={b} lys={beat >= b.fraBeat} />)}
                    {modus === 'pott' && (
                        <>
                            <Pizzabu />
                            <Person pos={DEG} />
                            <Glider mål={dinMynt} forste={v(DEG.x + 0.6, 1.6, DEG.z)} playing={playing}>
                                <Mynt />
                            </Glider>
                            {beat === 0 && (
                                <Glider mål={pizzaMål} forste={v(PIZZABU.x + 1, 2.6, PIZZABU.z + 1)} playing={playing}>
                                    <Pizza />
                                </Glider>
                            )}
                        </>
                    )}
                    <Myntstrom modus={modus} beat={beat} playing={playing} />

                    {modus === 'pott' && beat === 0 && (
                        <Html position={[PIZZABU.x, 4, PIZZABU.z]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Pizzabua" tone="vanlig" />
                        </Html>
                    )}
                    {modus === 'pott' && beat === 1 && (
                        <Html position={[-3.2, 4.6, 5]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Ingen pizza tilbake" tone="rod" />
                        </Html>
                    )}
                    {modus === 'pott' && beat >= 2 && (
                        <Html position={[0, POTT_H + 3.8, 0]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Felles pott" tone="gull" />
                        </Html>
                    )}
                    {modus === 'ut' &&
                        OFFENTLIG.filter((b) => b.fraBeat === beat).map((b) => (
                            <Html
                                key={b.id}
                                position={[b.pos.x, (b.id === 'vei' ? 0.5 : b.str[1]) + 1.6, b.pos.z]}
                                center
                                zIndexRange={[10, 0]}
                            >
                                <Skilt tekst={b.navn} tone="gronn" />
                            </Html>
                        ))}
                </>
            )}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

export function SkattPotten({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'butikk';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [0, 8, 14] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
