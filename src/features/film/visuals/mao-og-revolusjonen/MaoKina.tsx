import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Mao-filmens 3D-scener.
 * - «port»: Den himmelske freds port i Beijing 1. oktober 1949, med folkemengden og flagget.
 * - «jord»: en landsby der godseierens store jord blir delt opp i små åkre med hus på.
 */

type Modus = 'port' | 'jord';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'port') {
        switch (beat) {
            case 0:
                return { pos: v(-8 + t * 0.5, 9 + t * 0.15, 62 - t * 0.9), se: v(0, 7, 0) };
            case 1:
                return { pos: v(4 - t * 0.1, 10.5, 15), se: v(0, 8.8, 3) };
            case 2:
                return { pos: v(-16, 5, 44), se: v(0, 9, 24) };
            default:
                return { pos: v(t * 0.15, 19, 10), se: v(0, 1, 42) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-16 + t * 0.5, 5, 18), se: v(0, 0, 0) };
        case 1:
            return { pos: v(10, 13, 20), se: v(0, 0, -6) };
        case 2:
            return { pos: v(0, 26, 12), se: v(0, 0, -1) };
        default:
            return { pos: v(14 - t * 0.3, 8, 15), se: v(0, 0, -1) };
    }
}

/* ---------- Porten ---------- */

const PORT_ROD = '#b3261e';
const TAK = '#d9a21b';

/** Et valmet tak: en firkantet pyramidestump, strukket i bredden. */
function Tak({
    y,
    bredde,
    dybde,
    hoyde,
}: {
    y: number;
    bredde: number;
    dybde: number;
    hoyde: number;
}) {
    return (
        <mesh position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]} scale={[bredde, 1, dybde]}>
            <cylinderGeometry args={[0.32, 0.78, hoyde, 4, 1]} />
            <meshStandardMaterial color={TAK} flatShading roughness={0.6} />
        </mesh>
    );
}

function Porten() {
    const soyler = useMemo(() => Array.from({ length: 9 }, (_, i) => -12 + i * 3), []);
    return (
        <group>
            {/* Muren med fem buer */}
            <mesh position={[0, 3.5, 0]}>
                <boxGeometry args={[40, 7, 9]} />
                <meshStandardMaterial color={PORT_ROD} roughness={0.8} />
            </mesh>
            {[-12, -6, 0, 6, 12].map((x) => (
                <mesh key={x} position={[x, 2, 4.55]}>
                    <boxGeometry args={[x === 0 ? 3.2 : 2.4, x === 0 ? 4 : 3.2, 0.1]} />
                    <meshStandardMaterial color="#3b1410" />
                </mesh>
            ))}
            {/* Rekkverket på toppen av muren */}
            <mesh position={[0, 7.4, 4.3]}>
                <boxGeometry args={[40, 0.8, 0.3]} />
                <meshStandardMaterial color="#f1ece2" />
            </mesh>
            {/* Tårnet: søyler og to tak */}
            <mesh position={[0, 7.15, 0]}>
                <boxGeometry args={[30, 0.3, 7]} />
                <meshStandardMaterial color="#e5ddd0" />
            </mesh>
            {soyler.map((x) => (
                <mesh key={x} position={[x, 9.3, 2.6]}>
                    <cylinderGeometry args={[0.3, 0.3, 4, 8]} />
                    <meshStandardMaterial color={PORT_ROD} />
                </mesh>
            ))}
            <mesh position={[0, 9.3, 0]}>
                <boxGeometry args={[25, 4, 4.4]} />
                <meshStandardMaterial color="#8f1d17" />
            </mesh>
            <Tak y={12.2} bredde={34} dybde={12} hoyde={1.8} />
            <mesh position={[0, 13.6, 0]}>
                <boxGeometry args={[20, 1.6, 3.6]} />
                <meshStandardMaterial color="#8f1d17" />
            </mesh>
            <Tak y={15.3} bredde={27} dybde={9} hoyde={2.2} />
        </group>
    );
}

/** Mao, en liten skikkelse på terrassen. */
function Mao({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.x, synlig ? 1 : 0.001, 3, dt || 0.016);
        g.scale.setScalar(s);
    });
    return (
        <group ref={ref} position={[0, 7.3, 4.6]}>
            <mesh position={[0, 0.85, 0]}>
                <capsuleGeometry args={[0.32, 0.9, 4, 8]} />
                <meshStandardMaterial color="#4b5563" />
            </mesh>
            <mesh position={[0, 1.85, 0]}>
                <sphereGeometry args={[0.27, 12, 10]} />
                <meshStandardMaterial color="#e8c9a4" />
            </mesh>
            {/* En mikrofon foran ham */}
            <mesh position={[0, 1.2, 0.6]}>
                <cylinderGeometry args={[0.04, 0.04, 1.4, 6]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
        </group>
    );
}

const MENGDE = 1400;

/** Folkemengden på plassen. Ved beat 3 jubler den (hopper opp og ned). */
function Folkemengde({ jubel }: { jubel: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const folk = useMemo(
        () =>
            Array.from({ length: MENGDE }, (_, i) => {
                const rad = Math.floor(i / 56);
                const kol = i % 56;
                return {
                    x: -33 + kol * 1.2 + Math.sin(i * 12.9) * 0.35,
                    z: 12 + rad * 1.5 + Math.cos(i * 7.7) * 0.35,
                    fase: (i * 0.618) % 1,
                };
            }),
        []
    );
    const farger = useMemo(() => {
        const pal = ['#1e3a8a', '#374151', '#1f2937', '#475569', '#7f1d1d', '#334155'];
        return folk.map((_, i) => new THREE.Color(pal[i % pal.length]));
    }, [folk]);
    const hopp = useRef(0);
    const tid = useRef(0);
    const ferdig = useRef(false);
    useFrame((_, dt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += dt;
        hopp.current = damp(hopp.current, jubel ? 1 : 0, 3, dt || 0.016);
        folk.forEach((p, i) => {
            const y =
                0.7 +
                Math.max(0, Math.sin((tid.current * 3 + p.fase * 6.28) * 1.4)) *
                    0.45 *
                    hopp.current;
            o.position.set(p.x, y, p.z);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            if (!ferdig.current) m.setColorAt(i, farger[i]);
        });
        ferdig.current = true;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, MENGDE]}>
            <capsuleGeometry args={[0.3, 0.8, 2, 6]} />
            <meshStandardMaterial roughness={0.9} />
        </instancedMesh>
    );
}

/** Flaggstanga på plassen. Flagget går til topps fra beat 2. */
function Flagg({ heist }: { heist: boolean }) {
    const flagg = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, dt) => {
        const f = flagg.current;
        if (!f) return;
        tid.current += dt;
        f.position.y = damp(f.position.y, heist ? 15.5 : 2.2, 0.7, dt || 0.016);
        f.rotation.y = Math.sin(tid.current * 2) * 0.12;
    });
    return (
        <group position={[0, 0, 24]}>
            <mesh position={[0, 8.5, 0]}>
                <cylinderGeometry args={[0.12, 0.15, 17, 8]} />
                <meshStandardMaterial color="#e5e7eb" metalness={0.4} roughness={0.4} />
            </mesh>
            <group ref={flagg} position={[0, 2.2, 0]}>
                <mesh position={[2.1, 0, 0]}>
                    <boxGeometry args={[4, 2.6, 0.06]} />
                    <meshStandardMaterial color="#dc2626" side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.9, 0.6, 0.05]}>
                    <circleGeometry args={[0.38, 5]} />
                    <meshBasicMaterial color="#facc15" />
                </mesh>
            </group>
        </group>
    );
}

function PortScene({ beat }: { beat: number }) {
    return (
        <>
            <color attach="background" args={['#cfe2f3']} />
            <fog attach="fog" args={['#dce9f5', 70, 200]} />
            <ambientLight intensity={0.65} />
            <directionalLight position={[25, 40, 40]} intensity={1.5} color="#fff4e0" />
            <hemisphereLight args={['#e0f2fe', '#57534e', 0.5]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 30]}>
                <planeGeometry args={[400, 300]} />
                <meshStandardMaterial color="#c9c2b4" roughness={0.95} />
            </mesh>
            <Porten />
            <Mao synlig={beat >= 1} />
            <Folkemengde jubel={beat >= 3} />
            <Flagg heist={beat >= 2} />
        </>
    );
}

/* ---------- Landsbyen ---------- */

const RUTER = 6;
const ANTALL = RUTER * RUTER;
const STR = 3.2;
const BONDER = 14;

function JordScene({ beat, playing }: { beat: number; playing: boolean }) {
    const akre = useRef<THREE.InstancedMesh>(null);
    const hus = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const bonder = useRef<THREE.InstancedMesh>(null);
    const mynter = useRef<THREE.InstancedMesh>(null);
    const gjerde = useRef<THREE.Group>(null);
    const herregard = useRef<THREE.Group>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0);
    const delt = useRef(0);
    const husVekst = useRef(0);
    const leie = useRef(0);
    const c = useMemo(() => new THREE.Color(), []);
    const ensFarge = useMemo(() => new THREE.Color('#8aa83f'), []);
    const egneFarger = useMemo(() => {
        const pal = ['#a3c254', '#c9b458', '#7fa34a', '#b8c968', '#98b84d', '#d2bf6a'];
        return Array.from({ length: ANTALL }, (_, i) => new THREE.Color(pal[(i * 7) % pal.length]));
    }, []);
    const plassering = (i: number, gap: number) => {
        const r = Math.floor(i / RUTER);
        const k = i % RUTER;
        const steg = STR + gap;
        return [(k - (RUTER - 1) / 2) * steg, (r - (RUTER - 1) / 2) * steg + 2] as const;
    };

    useFrame((_, rawDt) => {
        // På pause fryser bildet, men første bilde tegnes alltid.
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        delt.current = damp(delt.current, beat >= 2 ? 1 : 0, 1.6, dt);
        husVekst.current = damp(husVekst.current, beat >= 3 ? 1 : 0, 2.2, dt);
        leie.current = damp(leie.current, beat === 1 ? 1 : 0, 2.5, dt);
        const gap = delt.current * 0.9;

        if (akre.current) {
            for (let i = 0; i < ANTALL; i++) {
                const [x, z] = plassering(i, gap);
                o.position.set(x, 0.06, z);
                o.rotation.set(-Math.PI / 2, 0, 0);
                // Uten mellomrom ser jorda ut som ett stort jorde.
                o.scale.set(STR + 0.02, STR + 0.02, 1);
                o.updateMatrix();
                akre.current.setMatrixAt(i, o.matrix);
                c.copy(ensFarge).lerp(egneFarger[i], delt.current);
                akre.current.setColorAt(i, c);
            }
            akre.current.instanceMatrix.needsUpdate = true;
            if (akre.current.instanceColor) akre.current.instanceColor.needsUpdate = true;
        }
        if (hus.current && tak.current) {
            for (let i = 0; i < ANTALL; i++) {
                const [x, z] = plassering(i, gap);
                const s = Math.max(0.001, Math.min(1, husVekst.current * 1.6 - (i % 7) * 0.08));
                o.rotation.set(0, (i % 3) * 0.3, 0);
                o.position.set(x + 0.8, 0.45 * s, z - 0.8);
                o.scale.set(s, s, s);
                o.updateMatrix();
                hus.current.setMatrixAt(i, o.matrix);
                o.position.set(x + 0.8, (0.9 + 0.35) * s, z - 0.8);
                o.rotation.set(0, (i % 3) * 0.3 + Math.PI / 4, 0);
                o.updateMatrix();
                tak.current.setMatrixAt(i, o.matrix);
            }
            hus.current.instanceMatrix.needsUpdate = true;
            tak.current.instanceMatrix.needsUpdate = true;
        }
        if (bonder.current) {
            for (let i = 0; i < BONDER; i++) {
                const [x, z] = plassering((i * 5 + 2) % ANTALL, gap);
                const bukk = Math.max(0, Math.sin(tid.current * 2.2 + i)) * 0.35;
                o.position.set(x - 0.4, 0.55, z + 0.5);
                o.rotation.set(bukk, i, 0);
                o.scale.setScalar(1);
                o.updateMatrix();
                bonder.current.setMatrixAt(i, o.matrix);
            }
            bonder.current.instanceMatrix.needsUpdate = true;
        }
        if (mynter.current) {
            // Leia: små gullbiter vandrer fra bøndene opp til herregården.
            const herre = new THREE.Vector3(0, 2.4, -14);
            for (let i = 0; i < BONDER; i++) {
                const [x, z] = plassering((i * 5 + 2) % ANTALL, gap);
                const f = (tid.current * 0.35 + i * 0.13) % 1;
                o.position.set(
                    THREE.MathUtils.lerp(x, herre.x, f),
                    0.8 + Math.sin(f * Math.PI) * 3,
                    THREE.MathUtils.lerp(z, herre.z, f)
                );
                o.rotation.set(0, tid.current * 3, 0);
                o.scale.setScalar(Math.max(0.001, leie.current));
                o.updateMatrix();
                mynter.current.setMatrixAt(i, o.matrix);
            }
            mynter.current.instanceMatrix.needsUpdate = true;
        }
        if (gjerde.current) {
            const s = 1 - delt.current;
            gjerde.current.scale.set(1, Math.max(0.001, s), 1);
            gjerde.current.visible = s > 0.02;
        }
        if (herregard.current) {
            const s = THREE.MathUtils.lerp(1, 0.75, delt.current);
            herregard.current.scale.setScalar(s);
        }
    });

    const kant = (RUTER * STR) / 2 + 0.3;
    return (
        <>
            <color attach="background" args={['#d6ecf7']} />
            <fog attach="fog" args={['#e2f0f7', 40, 120]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[20, 30, 15]} intensity={1.5} color="#fff3d6" />
            <hemisphereLight args={['#e0f2fe', '#4d5b2b', 0.5]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color="#6b8f3a" roughness={1} />
            </mesh>
            {/* Åsene bak */}
            {[-30, -8, 18, 40].map((x, i) => (
                <mesh key={x} position={[x, 0, -45 - (i % 2) * 8]} scale={[1.6, 0.5, 1]}>
                    <sphereGeometry args={[14, 12, 8]} />
                    <meshStandardMaterial color="#7d9a55" flatShading />
                </mesh>
            ))}
            <instancedMesh ref={akre} args={[undefined, undefined, ANTALL]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial roughness={1} />
            </instancedMesh>
            <instancedMesh ref={hus} args={[undefined, undefined, ANTALL]}>
                <boxGeometry args={[1, 0.9, 0.9]} />
                <meshStandardMaterial color="#efe3c8" />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, ANTALL]}>
                <coneGeometry args={[0.9, 0.7, 4]} />
                <meshStandardMaterial color="#9a3412" flatShading />
            </instancedMesh>
            <instancedMesh ref={bonder} args={[undefined, undefined, BONDER]}>
                <capsuleGeometry args={[0.18, 0.55, 2, 6]} />
                <meshStandardMaterial color="#1e3a8a" />
            </instancedMesh>
            <instancedMesh ref={mynter} args={[undefined, undefined, BONDER]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 10]} />
                <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.5} />
            </instancedMesh>
            {/* Gjerdet rundt godseierens jord */}
            <group ref={gjerde}>
                {[
                    { p: [0, 0.5, 2 - kant], s: [kant * 2, 1, 0.15] },
                    { p: [0, 0.5, 2 + kant], s: [kant * 2, 1, 0.15] },
                    { p: [-kant, 0.5, 2], s: [0.15, 1, kant * 2] },
                    { p: [kant, 0.5, 2], s: [0.15, 1, kant * 2] },
                ].map((g, i) => (
                    <mesh
                        key={i}
                        position={g.p as unknown as [number, number, number]}
                        scale={g.s as unknown as [number, number, number]}
                    >
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial color="#5b3a1e" />
                    </mesh>
                ))}
            </group>
            {/* Herregården */}
            <group ref={herregard} position={[0, 0, -14]}>
                <mesh position={[0, 1.6, 0]}>
                    <boxGeometry args={[8, 3.2, 4]} />
                    <meshStandardMaterial color="#f5f0e6" />
                </mesh>
                <mesh position={[0, 4, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.45, 1, 0.75]}>
                    <cylinderGeometry args={[1.5, 4.2, 1.8, 4, 1]} />
                    <meshStandardMaterial color="#334155" flatShading />
                </mesh>
                <mesh position={[0, 1, 2.05]}>
                    <boxGeometry args={[1.2, 2, 0.1]} />
                    <meshStandardMaterial color="#7f1d1d" />
                </mesh>
            </group>
        </>
    );
}

/* ---------- Kamera og ramme ---------- */

function Kameraet({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
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

const ETIKETTER: Record<Modus, (string | null)[]> = {
    port: [
        'Den himmelske freds port, Beijing',
        'Mao Zedong',
        '1. oktober 1949: Folkerepublikken Kina',
        null,
    ],
    jord: ['En landsby i Kina', 'Godseierens jord', '1950: jorda deles ut', 'Jord til bøndene'],
};

export function MaoKina({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'port';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const etikett = ETIKETTER[modus][Math.min(beat, ETIKETTER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 500, position: [0, 10, 60] }}
                gl={{ antialias: true }}
            >
                <Kameraet modus={modus} beat={beat} playing={playing} />
                {modus === 'port' ? (
                    <PortScene beat={beat} />
                ) : (
                    <JordScene beat={beat} playing={playing} />
                )}
            </Canvas>
            <AnimatePresence mode="wait">
                {etikett && (
                    <motion.div
                        key={etikett}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {etikett}
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'port' && beat >= 3 && (
                    <motion.div
                        key="sitat"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                        className="absolute top-[10%] left-1/2 -translate-x-1/2 px-8 py-4 rounded-3xl bg-red-700/95 text-white text-center shadow-2xl whitespace-nowrap"
                    >
                        <div className="font-display font-black text-3xl md:text-5xl">
                            «Det kinesiske folket har reist seg!»
                        </div>
                        <div className="text-lg md:text-2xl font-semibold text-red-100 mt-1">
                            Ti dager før: Mao på et møte, 21. september 1949
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
