import { useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Inflasjon i 3D. Fire moduser:
 * - kasse: den samme handlekurven koster 100 kroner i fjor og 105 i år. Ti tiere og én femmer.
 * - million: en liten by der alle får en pengestabel. Husene og bilene er like mange,
 *   men prisskiltene går opp.
 * - kurv: SSBs faste handlekurv fylles med varer og tjenester.
 * - pengemengde: tre stabler (sedler og mynt, brukskonto, kort sparing) mot en haug med varer.
 */

type Modus = 'kasse' | 'million' | 'kurv' | 'pengemengde';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    kasse: ['I fjor: 100 kroner', 'I år: 105 kroner', 'Samme varer, flere kroner', 'Inflasjon'],
    million: [
        'Hvorfor stiger prisene?',
        'Alle får en million kroner',
        'Like mange hus, biler og varer',
        'Alle byr over hverandre',
        'Kvantitetsteorien',
    ],
    kurv: [
        'SSBs faste handlekurv',
        'Rundt 650 varer og tjenester',
        'Mat, strøm, bensin, klær, fly, kino',
        'Konsumprisindeksen (KPI)',
        'Kurven 3 % dyrere = 3 % inflasjon',
    ],
    pengemengde: [
        'Pengemengden (M2)',
        'Tre slags penger legges sammen',
        'Pengene vokser fortere enn varene',
        'Et tidlig varsel om inflasjon',
    ],
};

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'kasse') {
        switch (beat) {
            case 0:
                return { pos: v(-3 + t * 0.12, 4.2, 7.5), se: v(-0.6, 1.8, 0) };
            case 1:
                return { pos: v(3.2, 3.6, 6.4), se: v(1.2, 2.2, 0) };
            case 2:
                return { pos: v(0.5, 6.5, 8.6), se: v(0, 1.6, 0.4) };
            default:
                return {
                    pos: v(Math.sin(t * 0.15) * 7, 5, Math.cos(t * 0.15) * 9),
                    se: v(0, 1.8, 0),
                };
        }
    }
    if (modus === 'million') {
        switch (beat) {
            case 0:
                return { pos: v(16 - t * 0.3, 9, 20), se: v(0, 1.5, 0) };
            case 1:
                return { pos: v(0, 8.5, 19), se: v(0, 1.5, 2) };
            case 2:
                return { pos: v(-9, 8, 12), se: v(0, 1.5, -2) };
            case 3:
                return { pos: v(4, 6.5, 13), se: v(0, 2.2, -2) };
            default:
                return { pos: v(0, 11, 21), se: v(0, 3, -1) };
        }
    }
    if (modus === 'kurv') {
        switch (beat) {
            case 0:
                return { pos: v(0, 6, 9), se: v(0, 1, 0) };
            case 1:
                return { pos: v(-2, 5.5, 7.5), se: v(0, 1.4, 0) };
            case 2:
                return { pos: v(0, 7.5, 10.5), se: v(0, 1.4, 0) };
            case 3:
                return { pos: v(5, 5, 8), se: v(1.5, 1.8, 0) };
            default:
                return { pos: v(Math.sin(t * 0.12) * 4, 6.5, 10), se: v(0.8, 1.6, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 6, 15), se: v(0, 2.5, 0) };
        case 1:
            return { pos: v(-3, 5, 12), se: v(-1.5, 2.5, 0) };
        case 2:
            return { pos: v(3, 7, 15), se: v(1, 3, 0) };
        default:
            return { pos: v(Math.sin(t * 0.15) * 6, 6.5, 14), se: v(0, 3, 0) };
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

/** En gruppe som glir mot en skala (0 = borte). Første bilde hopper rett dit. */
function Vokser({
    skala,
    children,
    position,
    rotation,
}: {
    skala: number | [number, number, number];
    children: ReactNode;
    position?: [number, number, number];
    rotation?: [number, number, number];
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const mål = useMemo(
        () =>
            typeof skala === 'number' ? v(skala, skala, skala) : v(skala[0], skala[1], skala[2]),
        [skala]
    );
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = Math.min(rawDt, 0.05);
        if (forste.current) {
            g.scale.copy(mål);
            forste.current = false;
        } else {
            g.scale.set(
                damp(g.scale.x, mål.x, 4, dt),
                damp(g.scale.y, mål.y, 4, dt),
                damp(g.scale.z, mål.z, 4, dt)
            );
        }
        g.visible = g.scale.y > 0.01;
    });
    return (
        <group ref={ref} position={position} rotation={rotation}>
            {children}
        </group>
    );
}

function Skilt({
    tekst,
    tone = 'vanlig',
}: {
    tekst: string;
    tone?: 'rod' | 'gronn' | 'gull' | 'vanlig';
}) {
    const farge = {
        rod: 'border-red-500 text-red-700',
        gronn: 'border-teal-500 text-teal-700',
        gull: 'border-amber-500 text-amber-700',
        vanlig: 'border-slate-300 text-slate-800',
    }[tone];
    return (
        <div
            className={`px-3 py-1 rounded-xl bg-white/95 shadow-lg border-2 font-bold whitespace-nowrap text-2xl ${farge}`}
        >
            {tekst}
        </div>
    );
}

// ---------- Felles småting ----------

function Mynt({ farge = '#d4a017' }: { farge?: string }) {
    return (
        <mesh>
            <cylinderGeometry args={[0.32, 0.32, 0.09, 24]} />
            <meshStandardMaterial color={farge} metalness={0.5} roughness={0.35} />
        </mesh>
    );
}

/** Handlekurv av tynne plater: bunn og fire sider. */
function Kurv({
    b = 2.4,
    d = 1.6,
    h = 1.1,
    farge = '#dc2626',
}: {
    b?: number;
    d?: number;
    h?: number;
    farge?: string;
}) {
    const t = 0.08;
    return (
        <group>
            <mesh position={[0, t / 2, 0]}>
                <boxGeometry args={[b, t, d]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={`x${s}`} position={[(s * b) / 2, h / 2, 0]}>
                    <boxGeometry args={[t, h, d]} />
                    <meshStandardMaterial color={farge} transparent opacity={0.85} />
                </mesh>
            ))}
            {[-1, 1].map((s) => (
                <mesh key={`z${s}`} position={[0, h / 2, (s * d) / 2]}>
                    <boxGeometry args={[b, h, t]} />
                    <meshStandardMaterial color={farge} transparent opacity={0.85} />
                </mesh>
            ))}
            {/* Hanken */}
            <mesh position={[0, h + 0.35, 0]} rotation={[0, 0, 0]}>
                <torusGeometry args={[b * 0.35, 0.05, 6, 24, Math.PI]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
        </group>
    );
}

/** Noen få varer oppi kurven i kassa. */
function Varer() {
    return (
        <group>
            <mesh position={[-0.6, 0.55, 0]}>
                <boxGeometry args={[0.6, 0.9, 0.5]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[-0.6, 1.05, 0]}>
                <boxGeometry args={[0.6, 0.12, 0.5]} />
                <meshStandardMaterial color="#2563eb" />
            </mesh>
            <mesh position={[0.25, 0.45, 0.1]} rotation={[0, 0.3, 0]}>
                <capsuleGeometry args={[0.28, 0.7, 4, 10]} />
                <meshStandardMaterial color="#c2873d" />
            </mesh>
            <mesh position={[0.85, 0.4, -0.25]}>
                <sphereGeometry args={[0.3, 14, 12]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0.75, 0.4, 0.35]}>
                <sphereGeometry args={[0.27, 14, 12]} />
                <meshStandardMaterial color="#84cc16" />
            </mesh>
        </group>
    );
}

// ---------- Modus: kasse ----------

function Kassa({ beat }: { beat: number }) {
    const dyr = beat >= 1;
    return (
        <group>
            {/* Disken og båndet */}
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[7, 1.2, 2.6]} />
                <meshStandardMaterial color="#94a3b8" flatShading />
            </mesh>
            <mesh position={[-0.8, 1.22, 0]}>
                <boxGeometry args={[4.8, 0.06, 1.8]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            {/* Kurven på båndet */}
            <group position={[-1.1, 1.25, 0]}>
                <Kurv />
                <Varer />
            </group>
            {/* Prisvinduet på kassa */}
            <group position={[2.6, 1.2, 0]}>
                <mesh position={[0, 0.4, 0]}>
                    <boxGeometry args={[1.4, 0.8, 1.2]} />
                    <meshStandardMaterial color="#334155" flatShading />
                </mesh>
                <mesh position={[0, 1.35, -0.2]} rotation={[-0.25, 0, 0]}>
                    <boxGeometry args={[1.5, 0.9, 0.12]} />
                    <meshStandardMaterial
                        color={dyr ? '#7f1d1d' : '#064e3b'}
                        emissive={dyr ? '#dc2626' : '#0f766e'}
                        emissiveIntensity={0.5}
                    />
                </mesh>
            </group>
            {/* Hylla bak */}
            {[-2.6, 0, 2.6].map((x) => (
                <group key={x} position={[x, 0, -3.4]}>
                    <mesh position={[0, 1.4, 0]}>
                        <boxGeometry args={[2.4, 2.8, 0.8]} />
                        <meshStandardMaterial color="#e2e8f0" flatShading />
                    </mesh>
                    {[0.7, 1.5, 2.3].map((y, i) => (
                        <mesh key={y} position={[0, y, 0.45]}>
                            <boxGeometry args={[2.1, 0.4, 0.1]} />
                            <meshStandardMaterial color={['#fbbf24', '#60a5fa', '#f87171'][i]} />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

/** Ti tiere i en stabel, og fra beat 1 en femmer ved siden av. */
function Pengestabel({ beat }: { beat: number }) {
    return (
        <group position={[0.9, 1.25, 1.75]}>
            {Array.from({ length: 10 }, (_, i) => (
                <group key={i} position={[(i % 5) * 0.72 - 1.4, 0.06, i < 5 ? 0 : 0.7]}>
                    <Mynt />
                </group>
            ))}
            <Vokser skala={beat >= 1 ? 1 : 0} position={[2.3, 0.06, 0.35]}>
                <group scale={[0.75, 1, 0.75]}>
                    <Mynt farge="#dc2626" />
                </group>
            </Vokser>
        </group>
    );
}

// ---------- Modus: million ----------

const HUS_X = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5];
const BILER_X = [-5, 0, 5];
const FOLK = Array.from({ length: 12 }, (_, i) => v(-8.25 + i * 1.5, 0, 5.5));

function Hus({ x, glod }: { x: number; glod: boolean }) {
    return (
        <group position={[x, 0, -3]}>
            <mesh position={[0, 1.1, 0]}>
                <boxGeometry args={[2.2, 2.2, 2.2]} />
                <meshStandardMaterial
                    color="#fef3c7"
                    emissive="#f59e0b"
                    emissiveIntensity={glod ? 0.35 : 0}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 2.85, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[1.75, 1.3, 4]} />
                <meshStandardMaterial color="#9a3412" flatShading />
            </mesh>
        </group>
    );
}

function Bil({ x, glod }: { x: number; glod: boolean }) {
    return (
        <group position={[x, 0, 1.2]}>
            <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[2, 0.55, 1]} />
                <meshStandardMaterial
                    color="#2563eb"
                    emissive="#60a5fa"
                    emissiveIntensity={glod ? 0.4 : 0}
                />
            </mesh>
            <mesh position={[-0.1, 0.9, 0]}>
                <boxGeometry args={[1.1, 0.4, 0.9]} />
                <meshStandardMaterial color="#bfdbfe" />
            </mesh>
            {[-0.65, 0.65].map((dx) => (
                <mesh key={dx} position={[dx, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.22, 0.22, 1.05, 12]} />
                    <meshStandardMaterial color="#111827" />
                </mesh>
            ))}
        </group>
    );
}

function Person({ pos, farge }: { pos: THREE.Vector3; farge: string }) {
    return (
        <group position={pos}>
            <mesh position={[0, 0.55, 0]}>
                <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 1.3, 0]}>
                <sphereGeometry args={[0.22, 12, 10]} />
                <meshStandardMaterial color="#f1c7a3" />
            </mesh>
        </group>
    );
}

/** Folk som går mot husene når de byr over hverandre. */
function Folk({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        g.position.z = damp(g.position.z, beat >= 3 ? -1.6 : 0, 1.5, dt || 0.0001);
    });
    const farger = ['#0d9488', '#7c3aed', '#ea580c', '#0891b2'];
    return (
        <group ref={ref}>
            {FOLK.map((p, i) => (
                <group key={i}>
                    <Person pos={p} farge={farger[i % 4]} />
                    {/* Pengestabelen hver person får */}
                    <Vokser
                        skala={beat >= 1 ? [1, 1, 1] : [1, 0.001, 1]}
                        position={[p.x + 0.5, 0, p.z - 0.2]}
                    >
                        <mesh position={[0, 0.5, 0]}>
                            <boxGeometry args={[0.4, 1, 0.3]} />
                            <meshStandardMaterial color="#16a34a" />
                        </mesh>
                    </Vokser>
                </group>
            ))}
        </group>
    );
}

/** Prisskilt over husene: «Pris ↑» som vokser. */
function Prisskilt({ beat }: { beat: number }) {
    if (beat < 3) return null;
    return (
        <>
            {[-6, 0, 6].map((x) => (
                <Html key={x} position={[x, 4.6, -3]} center zIndexRange={[10, 0]}>
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: [0.6, 1.15, 1], opacity: 1 }}
                        transition={{ duration: 0.9, delay: (x + 6) / 20 }}
                    >
                        <Skilt tekst="Pris ↑" tone="rod" />
                    </motion.div>
                </Html>
            ))}
        </>
    );
}

// ---------- Modus: kurv ----------

const VARE_FARGER = [
    '#f59e0b',
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#a855f7',
    '#f97316',
    '#14b8a6',
    '#eab308',
];

/** En tett, utellbar mengde småvarer i kurven. */
function Masse({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const antall = 90;
    const plass = useMemo(
        () =>
            Array.from({ length: antall }, (_, i) => {
                const r = (k: number) =>
                    Math.abs(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;
                return {
                    p: v(-1.7 + r(1) * 3.4, 0.25 + r(2) * 1.3, -1.05 + r(3) * 2.1),
                    s: 0.25 + r(4) * 0.25,
                    rot: r(5) * 3,
                    farge: VARE_FARGER[i % VARE_FARGER.length],
                };
            }),
        []
    );
    const o = useMemo(() => new THREE.Object3D(), []);
    const fyll = useRef(0);
    const farget = useRef(false);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = Math.min(rawDt, 0.05);
        fyll.current = damp(fyll.current, synlig ? 1 : 0, 3, dt);
        if (!farget.current) {
            const c = new THREE.Color();
            plass.forEach((p, i) => m.setColorAt(i, c.set(p.farge)));
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
            farget.current = true;
        }
        plass.forEach((p, i) => {
            o.position.copy(p.p);
            o.rotation.set(p.rot, p.rot * 0.7, 0);
            o.scale.setScalar(p.s * fyll.current);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
        m.visible = fyll.current > 0.02;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
}

interface Ting {
    navn: string;
    pos: [number, number, number];
    lappe: [number, number, number];
}

const TING: Ting[] = [
    { navn: 'Mat', pos: [-4.4, 0, 1.4], lappe: [-4.4, 1.9, 1.4] },
    { navn: 'Strøm', pos: [-4.6, 0, -1.6], lappe: [-4.6, 2.6, -1.6] },
    { navn: 'Bensin', pos: [-2.2, 0, -3.4], lappe: [-2.2, 2.2, -3.4] },
    { navn: 'Klær', pos: [2.2, 0, -3.4], lappe: [2.2, 2.4, -3.4] },
    { navn: 'Fly', pos: [4.6, 0, -1.6], lappe: [4.6, 2.4, -1.6] },
    { navn: 'Kino', pos: [4.4, 0, 1.4], lappe: [4.4, 1.9, 1.4] },
];

function TingForm({ navn }: { navn: string }) {
    switch (navn) {
        case 'Mat':
            return (
                <mesh position={[0, 0.5, 0]}>
                    <capsuleGeometry args={[0.4, 0.9, 4, 10]} />
                    <meshStandardMaterial color="#c2873d" />
                </mesh>
            );
        case 'Strøm':
            return (
                <group>
                    <mesh position={[0, 1.2, 0]}>
                        <sphereGeometry args={[0.6, 16, 14]} />
                        <meshStandardMaterial
                            color="#fde047"
                            emissive="#facc15"
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                    <mesh position={[0, 0.4, 0]}>
                        <cylinderGeometry args={[0.3, 0.3, 0.6, 14]} />
                        <meshStandardMaterial color="#64748b" />
                    </mesh>
                </group>
            );
        case 'Bensin':
            return (
                <group>
                    <mesh position={[0, 0.7, 0]}>
                        <boxGeometry args={[1, 1.4, 0.6]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                    <mesh position={[0.25, 1.55, 0]}>
                        <cylinderGeometry args={[0.12, 0.12, 0.35, 10]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                </group>
            );
        case 'Klær':
            return (
                <group position={[0, 1, 0]}>
                    <mesh>
                        <boxGeometry args={[1, 1.3, 0.2]} />
                        <meshStandardMaterial color="#7c3aed" />
                    </mesh>
                    {[-1, 1].map((s) => (
                        <mesh key={s} position={[s * 0.65, 0.4, 0]} rotation={[0, 0, s * -0.6]}>
                            <boxGeometry args={[0.6, 0.35, 0.2]} />
                            <meshStandardMaterial color="#7c3aed" />
                        </mesh>
                    ))}
                </group>
            );
        case 'Fly':
            return (
                <group position={[0, 1, 0]} rotation={[0, 0.6, 0]}>
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                        <capsuleGeometry args={[0.22, 1.5, 4, 10]} />
                        <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                    <mesh>
                        <boxGeometry args={[0.45, 0.06, 1.9]} />
                        <meshStandardMaterial color="#0ea5e9" />
                    </mesh>
                    <mesh position={[-0.8, 0.3, 0]}>
                        <boxGeometry args={[0.3, 0.5, 0.06]} />
                        <meshStandardMaterial color="#0ea5e9" />
                    </mesh>
                </group>
            );
        default:
            return (
                <mesh position={[0, 0.8, 0]} rotation={[0, 0.2, 0.15]}>
                    <boxGeometry args={[1.3, 0.65, 0.06]} />
                    <meshStandardMaterial color="#f43f5e" />
                </mesh>
            );
    }
}

/** Kalender ved siden av kurven: en rad måneder der den tiende lyser. */
function Kalender({ synlig }: { synlig: boolean }) {
    return (
        <Vokser skala={synlig ? 1 : 0} position={[4.4, 0, 2.6]}>
            <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[1.8, 2.2, 0.15]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 2.15, 0.09]}>
                <boxGeometry args={[1.8, 0.35, 0.05]} />
                <meshStandardMaterial color="#dc2626" />
            </mesh>
        </Vokser>
    );
}

// ---------- Modus: pengemengde ----------

const STABLER = [
    { navn: 'Sedler og mynt', x: -4.2, farge: '#16a34a' },
    { navn: 'Brukskonto', x: -2.2, farge: '#2563eb' },
    { navn: 'Kort sparing', x: -0.2, farge: '#7c3aed' },
];

function Stabel({ x, farge, hoyde }: { x: number; farge: string; hoyde: number }) {
    return (
        <Vokser skala={[1, hoyde, 1]} position={[x, 0, 0]}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.5, 1, 1.5]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
        </Vokser>
    );
}

function Varehaug({ hoyde }: { hoyde: number }) {
    return (
        <Vokser skala={[1, hoyde, 1]} position={[4, 0, 0]}>
            {[
                [-0.6, 0.5, -0.4, '#f59e0b'],
                [0.6, 0.5, -0.4, '#ef4444'],
                [0, 0.5, 0.5, '#10b981'],
                [0, 1.4, 0, '#3b82f6'],
            ].map(([px, py, pz, f], i) => (
                <mesh key={i} position={[px as number, py as number, pz as number]}>
                    <boxGeometry args={[1.1, 0.9, 1.1]} />
                    <meshStandardMaterial color={f as string} flatShading />
                </mesh>
            ))}
        </Vokser>
    );
}

/** Gult varsellys som blinker. */
function Varsellys({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.MeshStandardMaterial>(null);
    const tid = useRef(0);
    useFrame((_, dt) => {
        if (playing) tid.current += Math.min(dt, 0.05);
        if (ref.current)
            ref.current.emissiveIntensity = 0.4 + Math.max(0, Math.sin(tid.current * 4)) * 1.2;
    });
    return (
        <Vokser skala={synlig ? 1 : 0} position={[1.9, 0, 2.6]}>
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.45, 0.55, 0.8, 16]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
                <sphereGeometry args={[0.5, 16, 14]} />
                <meshStandardMaterial ref={ref} color="#fbbf24" emissive="#f59e0b" />
            </mesh>
        </Vokser>
    );
}

// ---------- Scenen ----------

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ute = modus === 'million';
    return (
        <>
            <color attach="background" args={[ute ? '#cfe8fb' : '#f1f5f9']} />
            <fog attach="fog" args={[ute ? '#cfe8fb' : '#f1f5f9', 35, 80]} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 20, 12]} intensity={1.4} color="#fff7e6" />
            <hemisphereLight args={['#e0f2fe', '#64748b', 0.5]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial color={ute ? '#9cc98a' : '#d6d3d1'} />
            </mesh>

            {modus === 'kasse' && (
                <>
                    <Kassa beat={beat} />
                    <Pengestabel beat={beat} />
                    <Html position={[2.6, 3.4, -0.2]} center zIndexRange={[10, 0]}>
                        <Skilt
                            tekst={beat >= 1 ? '105 kr' : '100 kr'}
                            tone={beat >= 1 ? 'rod' : 'gronn'}
                        />
                    </Html>
                    {beat === 2 && (
                        <Html position={[-1.1, 3.2, 0]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Samme kurv" tone="vanlig" />
                        </Html>
                    )}
                </>
            )}

            {modus === 'million' && (
                <>
                    {HUS_X.map((x) => (
                        <Hus key={x} x={x} glod={beat === 2} />
                    ))}
                    {BILER_X.map((x) => (
                        <Bil key={x} x={x} glod={beat === 2} />
                    ))}
                    <Folk beat={beat} playing={playing} />
                    <Prisskilt beat={beat} />
                    {beat === 1 && (
                        <Html position={[0, 2.6, 7]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="+ 1 million hver" tone="gronn" />
                        </Html>
                    )}
                    {beat === 2 && (
                        <Html position={[0, 5, -3]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Like mange som før" tone="gull" />
                        </Html>
                    )}
                </>
            )}

            {modus === 'kurv' && (
                <>
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[5, 0.8, 3.4]} />
                        <meshStandardMaterial color="#cbd5e1" flatShading />
                    </mesh>
                    <group position={[0, 0.8, 0]} scale={[1.5, 1.4, 1.5]}>
                        <Kurv />
                    </group>
                    <group position={[0, 0.8, 0]} scale={[0.95, 1, 0.95]}>
                        <Masse synlig={beat >= 1} />
                    </group>
                    {TING.map((t) => (
                        <Vokser key={t.navn} skala={beat === 2 ? 1 : 0} position={t.pos}>
                            <TingForm navn={t.navn} />
                        </Vokser>
                    ))}
                    {beat === 2 &&
                        TING.map((t) => (
                            <Html key={t.navn} position={t.lappe} center zIndexRange={[10, 0]}>
                                <Skilt tekst={t.navn} />
                            </Html>
                        ))}
                    <Kalender synlig={beat === 3} />
                    {beat === 3 && (
                        <Html position={[4.4, 1.3, 2.75]} center zIndexRange={[10, 0]}>
                            <div className="text-center font-black text-slate-900 leading-none">
                                <div className="text-5xl">10.</div>
                                <div className="text-xl font-bold text-slate-500 mt-1">
                                    hver måned
                                </div>
                            </div>
                        </Html>
                    )}
                    {beat >= 4 && (
                        <Html position={[0, 3.6, 0]} center zIndexRange={[10, 0]}>
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                            >
                                <Skilt tekst="Hele kurven: + 3 %" tone="rod" />
                            </motion.div>
                        </Html>
                    )}
                </>
            )}

            {modus === 'pengemengde' && (
                <>
                    {STABLER.map((s, i) => (
                        <Stabel
                            key={s.navn}
                            x={s.x}
                            farge={s.farge}
                            hoyde={
                                beat === 0
                                    ? 2.2 + i * 0.4
                                    : beat === 1
                                      ? 2.4 + i * 0.4
                                      : 4 + i * 0.6
                            }
                        />
                    ))}
                    <Varehaug hoyde={beat >= 2 ? 1.25 : 1} />
                    <Varsellys synlig={beat >= 3} playing={playing} />
                    {beat === 0 && (
                        <>
                            <Html position={[-2.2, 5, 0]} center zIndexRange={[10, 0]}>
                                <Skilt tekst="Penger" tone="gronn" />
                            </Html>
                            <Html position={[4, 2.6, 0]} center zIndexRange={[10, 0]}>
                                <Skilt tekst="Varer" tone="gull" />
                            </Html>
                        </>
                    )}
                    {beat === 1 &&
                        STABLER.map((s, i) => (
                            <Html
                                key={s.navn}
                                position={[s.x, -0.2, 0.8 + (i % 2) * 1.4]}
                                center
                                zIndexRange={[10, 0]}
                            >
                                <Skilt tekst={s.navn} tone="vanlig" />
                            </Html>
                        ))}
                    {beat >= 2 && (
                        <>
                            <Html position={[-2.2, 6.6, 0]} center zIndexRange={[10, 0]}>
                                <Skilt tekst="Penger ↑↑" tone="gronn" />
                            </Html>
                            <Html position={[4, 3.4, 0]} center zIndexRange={[10, 0]}>
                                <Skilt
                                    tekst={beat >= 3 ? 'Priser ↑ ?' : 'Varer ↑'}
                                    tone={beat >= 3 ? 'rod' : 'gull'}
                                />
                            </Html>
                        </>
                    )}
                </>
            )}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

export function InflasjonButikken({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kasse';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    const under =
        modus === 'million' && beat >= 4
            ? 'Mer penger, høyere priser. Men det forklarer ikke alt.'
            : modus === 'kasse' && beat >= 3
              ? 'Pengene blir mindre verdt'
              : null;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 6, 12] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-5 py-2 rounded-2xl shadow-xl font-display font-bold whitespace-nowrap ${
                            modus === 'kasse' && beat === 3
                                ? 'bg-red-600 text-white text-5xl'
                                : 'bg-white/95 text-slate-900 text-3xl'
                        }`}
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="absolute inset-x-0 bottom-[5%] flex justify-center pointer-events-none">
                <AnimatePresence>
                    {under && (
                        <motion.div
                            key={under}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-1.5 rounded-xl bg-slate-900/85 text-white font-semibold text-2xl whitespace-nowrap"
                        >
                            {under}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
