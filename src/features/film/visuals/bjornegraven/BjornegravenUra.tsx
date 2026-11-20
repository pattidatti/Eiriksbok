import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Steinura der bjørnen ble lagt. «ura»: lia på Senja og hulrommet under en stor stein, og
 * skallen som havnet i et magasin i Tromsø. «lag»: grava bygges lag for lag, fra bjørkeris
 * nederst til torv øverst. «sjel»: beina i riktig orden, og bjørnen som skal bli født på
 * nytt. «spildra»: øya med skilt og tre urørte graver, og en kraftlinje som kommer nærmere.
 */

type Modus = 'ura' | 'lag' | 'sjel' | 'spildra';

/** Hvor langt grava er bygd: 0 tomt hulrom, 1 ris, 2 bein, 3 gaver, 4 never, 5 dekket. */
function lagFor(modus: Modus, beat: number) {
    if (modus === 'lag') return beat;
    if (modus === 'sjel') return 5;
    if (modus === 'ura') return beat >= 2 ? 2 : 0;
    return 5;
}

function kameraFor(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'ura') {
            switch (beat) {
                case 0:
                    return { pos: v(16 - t * 0.3, 8, 22), se: v(0, 1.5, -3) };
                case 1:
                    return { pos: v(6.5 - t * 0.12, 3.6, 9), se: v(0, 1, 0) };
                default:
                    return { pos: v(0.4, 1.15, 3.6 - t * 0.04), se: v(0, 0.35, 0) };
            }
        }
        if (modus === 'lag') {
            // Grava står til høyre i bildet, så lagstabelen til venstre ikke dekker den.
            if (beat === 0) return { pos: v(1.2, 1.6, 5), se: v(-0.9, 0.6, 0) };
            if (beat === 3) return { pos: v(0.5, 1.0, 2.6), se: v(-0.25, 0.25, 0.3) };
            return { pos: v(-0.3, 1.45, 3.7), se: v(-0.75, 0.35, 0) };
        }
        if (modus === 'sjel') {
            switch (beat) {
                case 0:
                    return { pos: v(3, 2.2, 5.5), se: v(0, 0.8, 0) };
                case 1:
                    return { pos: v(0.3, 1.5, 3.6), se: v(0, 0.35, 0) };
                default:
                    return { pos: v(5 - t * 0.1, 3.6, 10), se: v(0, 2.6, -1) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(24 - t * 0.3, 14, 30), se: v(0, 0, 0) };
            case 1:
                return { pos: v(-20 + t * 0.2, 12, 24), se: v(0, 0, 0) };
            case 2:
                return { pos: v(6, 3.4, 10), se: v(0, 0.8, 0) };
            default:
                return { pos: v(16, 8, 20), se: v(4, 1, -2) };
        }
    };
}

/** Fri sikt: ingen stein eller lyng mellom kameraet og grava (eller gravene på øya). */
function iVeien(x: number, z: number, oy: boolean) {
    if (z > 0 && z < 9 && Math.abs(x) < 3.5) return true;
    return oy && x > -2 && z > -1;
}

/** Ura: mange steiner i én tegning. */
function Steiner({
    farge,
    n,
    omrade,
    unntak,
    oy,
}: {
    farge: string;
    n: number;
    omrade: number;
    unntak: number;
    oy: boolean;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        const c = new THREE.Color();
        let k = 0;
        for (let i = 0; k < n && i < n * 4; i++) {
            const x = (frø(i) - 0.5) * omrade * 2;
            const z = (frø(i + 900) - 0.5) * omrade * 1.6 - omrade * 0.25;
            if (Math.hypot(x, z) < unntak) continue;
            if (iVeien(x, z, oy)) continue;
            const s = 0.35 + frø(i + 77) * 1.1 + (Math.hypot(x, z) < 8 ? 0.3 : 0);
            o.position.set(x, s * 0.45, z);
            o.rotation.set(frø(i + 3) * 3, frø(i + 5) * 3, frø(i + 7) * 3);
            o.scale.set(s * (0.9 + frø(i + 9) * 0.5), s * 0.75, s);
            o.updateMatrix();
            m.setMatrixAt(k, o.matrix);
            c.set(farge).offsetHSL(0, 0, (frø(i + 11) - 0.5) * 0.18);
            m.setColorAt(k, c);
            k++;
        }
        m.count = k;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [farge, n, omrade, unntak, oy]);
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial flatShading roughness={1} />
        </instancedMesh>
    );
}

/** Lyngtuer i høstfarger. */
function Lyng({ omrade, oy }: { omrade: number; oy: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const N = 70;
    useLayoutEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        const c = new THREE.Color();
        for (let i = 0; i < N; i++) {
            const x = (frø(i + 300) - 0.5) * omrade * 2;
            const z = (frø(i + 600) - 0.5) * omrade * 1.6;
            const s = 0.4 + frø(i + 13) * 0.6;
            const borte = Math.hypot(x, z) < 3 || iVeien(x, z, oy);
            o.position.set(x, s * 0.3, z);
            o.scale.set(borte ? 0 : s * 1.2, borte ? 0 : s * 0.35, borte ? 0 : s * 1.2);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            c.set(i % 3 === 0 ? '#8a4b2a' : i % 3 === 1 ? '#9a6a2e' : '#5d6b32');
            m.setColorAt(i, c);
        }
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [omrade, oy]);
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial flatShading roughness={1} />
        </instancedMesh>
    );
}

/** Hulrommet: to steiner på siden, én bak og en stor blokk over. */
function Hulrom() {
    return (
        <group>
            <mesh position={[-1.55, 0.7, 0]} rotation={[0.1, 0.3, 0.05]} scale={[0.8, 0.95, 1.2]}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#8a8f8c" flatShading />
            </mesh>
            <mesh position={[1.6, 0.7, 0.05]} rotation={[0.2, 1.1, 0.1]} scale={[0.8, 0.95, 1.2]}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#7f8682" flatShading />
            </mesh>
            <mesh position={[0, 0.7, -1.45]} rotation={[0.3, 0.2, 0]} scale={[1.6, 0.9, 0.6]}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#737a76" flatShading />
            </mesh>
            {/* Den store blokka */}
            <mesh position={[0, 1.75, -0.1]} rotation={[0.05, 0.15, -0.04]} scale={[2.6, 0.6, 1.6]}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#9aa09a" flatShading />
            </mesh>
            {/* Lav på blokka */}
            <mesh position={[0.6, 2.3, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.6, 7]} />
                <meshStandardMaterial color="#c2a83e" />
            </mesh>
            {/* Mørk bunn i hulrommet */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.4, 2]} />
                <meshStandardMaterial color="#3f3a33" />
            </mesh>
        </group>
    );
}

const BEIN = '#f2ece0';

/** Bjørkeris: tynne kvister i en seng. */
function Ris() {
    const kvister = useMemo(
        () =>
            Array.from({ length: 34 }, (_, i) => ({
                x: (frø(i + 50) - 0.5) * 1.9,
                z: (frø(i + 80) - 0.5) * 1.5,
                rot: frø(i + 20) * Math.PI,
                l: 0.6 + frø(i + 30) * 0.7,
            })),
        []
    );
    return (
        <group position={[0, 0.06, 0]}>
            {kvister.map((k, i) => (
                <mesh
                    key={i}
                    position={[k.x, (i % 3) * 0.02, k.z]}
                    rotation={[0, k.rot, Math.PI / 2]}
                >
                    <cylinderGeometry args={[0.018, 0.018, k.l, 4]} />
                    <meshStandardMaterial color={i % 2 ? '#7c2d12' : '#57341f'} />
                </mesh>
            ))}
        </group>
    );
}

/** Beina i omtrent samme orden som i den levende bjørnen. Hodet mot venstre. */
function Skjelett({ glod = 0 }: { glod?: number }) {
    const mat = <meshStandardMaterial color={BEIN} emissive="#fbbf24" emissiveIntensity={glod} />;
    return (
        <group position={[0, 0.16, 0.05]}>
            {/* Skallen */}
            <mesh position={[-0.85, 0.06, 0]} scale={[0.34, 0.2, 0.24]}>
                <sphereGeometry args={[1, 10, 8]} />
                {mat}
            </mesh>
            <mesh position={[-1.08, 0.02, 0]} scale={[0.16, 0.08, 0.1]}>
                <sphereGeometry args={[1, 8, 6]} />
                {mat}
            </mesh>
            {/* Ryggen */}
            {Array.from({ length: 9 }, (_, i) => (
                <mesh key={`r${i}`} position={[-0.48 + i * 0.13, 0.02, 0]}>
                    <boxGeometry args={[0.09, 0.07, 0.1]} />
                    {mat}
                </mesh>
            ))}
            {/* Ribbeina */}
            {Array.from({ length: 5 }, (_, i) =>
                [-1, 1].map((sid) => (
                    <mesh
                        key={`b${i}${sid}`}
                        position={[-0.32 + i * 0.12, 0.0, sid * 0.2]}
                        rotation={[0, 0, Math.PI / 2]}
                        scale={[1, 1, 1]}
                    >
                        <boxGeometry args={[0.03, 0.03, 0.34]} />
                        {mat}
                    </mesh>
                ))
            )}
            {/* Bekkenet */}
            <mesh position={[0.68, 0.0, 0]} scale={[0.14, 0.05, 0.16]}>
                <sphereGeometry args={[1, 8, 6]} />
                {mat}
            </mesh>
            {/* Beina, to framme og to bak */}
            {[
                [-0.3, 0.42, 1.3],
                [-0.3, -0.42, -1.3],
                [0.72, 0.42, 1.2],
                [0.72, -0.42, -1.2],
            ].map(([x, z, r], i) => (
                <mesh key={`l${i}`} position={[x, -0.02, z]} rotation={[0, r, Math.PI / 2]}>
                    <cylinderGeometry args={[0.035, 0.035, 0.5, 6]} />
                    {mat}
                </mesh>
            ))}
        </group>
    );
}

/** Gaver: en ring og et kjede av messing. */
function Gaver() {
    return (
        <group position={[0.15, 0.2, 0.42]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.07, 0.016, 8, 18]} />
                <meshStandardMaterial
                    color="#d4a017"
                    emissive="#a16207"
                    emissiveIntensity={0.5}
                    metalness={0.6}
                    roughness={0.3}
                />
            </mesh>
            {Array.from({ length: 7 }, (_, i) => (
                <mesh
                    key={i}
                    position={[0.2 + i * 0.05, 0, Math.sin(i * 0.9) * 0.04]}
                    rotation={[i % 2 ? Math.PI / 2 : 0, 0, 0]}
                >
                    <torusGeometry args={[0.025, 0.008, 6, 12]} />
                    <meshStandardMaterial
                        color="#d4a017"
                        emissive="#a16207"
                        emissiveIntensity={0.5}
                        metalness={0.6}
                        roughness={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Never, planker, stein og torv. Kan gjøres gjennomsiktig for å se beina. */
function Dekke({ lag, gjennom }: { lag: number; gjennom: boolean }) {
    const op = gjennom ? 0.18 : 1;
    const tr = gjennom;
    return (
        <group>
            {lag >= 4 && (
                <group position={[0, 0.4, 0]}>
                    <mesh>
                        <boxGeometry args={[2.1, 0.03, 1.55]} />
                        <meshStandardMaterial
                            color="#efe6d2"
                            transparent={tr}
                            opacity={op}
                            depthWrite={!tr}
                        />
                    </mesh>
                    {!gjennom &&
                        [-0.7, -0.2, 0.35, 0.8].map((x) => (
                            <mesh key={x} position={[x, 0.02, 0]}>
                                <boxGeometry args={[0.05, 0.01, 1.4]} />
                                <meshStandardMaterial color="#3f3a33" />
                            </mesh>
                        ))}
                </group>
            )}
            {lag >= 5 && (
                <>
                    {[-0.55, -0.18, 0.19, 0.56].map((z) => (
                        <mesh key={z} position={[0, 0.5, z]}>
                            <boxGeometry args={[2.15, 0.09, 0.33]} />
                            <meshStandardMaterial
                                color="#a16207"
                                transparent={tr}
                                opacity={op}
                                depthWrite={!tr}
                            />
                        </mesh>
                    ))}
                    {Array.from({ length: 9 }, (_, i) => (
                        <mesh
                            key={`s${i}`}
                            position={[-0.8 + (i % 5) * 0.4, 0.68, -0.4 + Math.floor(i / 5) * 0.7]}
                            rotation={[i, i * 2, 0]}
                            scale={0.18 + frø(i) * 0.07}
                        >
                            <dodecahedronGeometry args={[1, 0]} />
                            <meshStandardMaterial
                                color="#8a8f8c"
                                flatShading
                                transparent={tr}
                                opacity={op}
                                depthWrite={!tr}
                            />
                        </mesh>
                    ))}
                    <mesh position={[0, 0.92, -0.05]}>
                        <boxGeometry args={[2.2, 0.22, 1.6]} />
                        <meshStandardMaterial
                            color="#4d7c0f"
                            flatShading
                            transparent={tr}
                            opacity={op}
                            depthWrite={!tr}
                        />
                    </mesh>
                </>
            )}
        </group>
    );
}

/** Bjørnen som skal bli født på nytt: en lysende skikkelse over ura. */
function Gjenferd({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        const synlig = beat >= 3;
        const malY = beat >= 3 ? 3.7 : 3.2;
        const malOp = synlig ? (beat >= 3 ? 0.75 : 0.5) : 0;
        // Settes rett på plass når eleven hopper, glir bare under avspilling.
        const k = playing ? 1 : 0;
        g.position.y = k ? damp(g.position.y, malY, 1.2, dt) : malY;
        for (const m of mats.current) {
            if (m) m.opacity = k ? damp(m.opacity, malOp, 1.5, dt) : malOp;
        }
        g.visible = synlig;
    });
    const deler: {
        p: [number, number, number];
        s: [number, number, number];
        geo: 'kule' | 'sylinder';
    }[] = [
        { p: [0, 0, 0], s: [1.5, 0.85, 0.85], geo: 'kule' },
        { p: [-0.75, 0.25, 0], s: [0.75, 0.7, 0.7], geo: 'kule' },
        { p: [-1.55, 0.35, 0], s: [0.5, 0.45, 0.45], geo: 'kule' },
        { p: [-2.0, 0.25, 0], s: [0.3, 0.22, 0.25], geo: 'kule' },
        { p: [-1.45, 0.8, 0.2], s: [0.14, 0.14, 0.1], geo: 'kule' },
        { p: [-1.45, 0.8, -0.2], s: [0.14, 0.14, 0.1], geo: 'kule' },
        { p: [-0.7, -0.75, 0.38], s: [0.22, 0.6, 0.22], geo: 'sylinder' },
        { p: [-0.7, -0.75, -0.38], s: [0.22, 0.6, 0.22], geo: 'sylinder' },
        { p: [0.85, -0.75, 0.38], s: [0.24, 0.6, 0.24], geo: 'sylinder' },
        { p: [0.85, -0.75, -0.38], s: [0.24, 0.6, 0.24], geo: 'sylinder' },
    ];
    return (
        <group ref={ref} position={[0, 2.6, -0.2]} visible={false}>
            {deler.map((d, i) => (
                <mesh key={i} position={d.p} scale={d.s}>
                    {d.geo === 'kule' ? (
                        <sphereGeometry args={[1, 14, 10]} />
                    ) : (
                        <cylinderGeometry args={[1, 1, 2, 8]} />
                    )}
                    <meshStandardMaterial
                        ref={(m) => {
                            mats.current[i] = m;
                        }}
                        color="#fde68a"
                        emissive="#f59e0b"
                        emissiveIntensity={0.9}
                        transparent
                        opacity={0}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Spildra: tre urørte graver, et skilt, og en kraftlinje som kommer nærmere. */
function Oya({ beat }: { beat: number }) {
    return (
        <group>
            {[
                [-2.4, -0.5],
                [0, -1.6],
                [2.3, -0.4],
            ].map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    {/* Lys ring rundt hver grav, så de skiller seg fra resten av ura */}
                    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.95, 1.15, 24]} />
                        <meshStandardMaterial
                            color="#fde68a"
                            emissive="#f59e0b"
                            emissiveIntensity={beat >= 2 ? 0.8 : 0}
                            transparent
                            opacity={beat >= 2 ? 0.95 : 0}
                        />
                    </mesh>
                    {Array.from({ length: 6 }, (_, j) => (
                        <mesh
                            key={j}
                            position={[
                                Math.cos(j) * 0.45,
                                0.25 + (j === 5 ? 0.3 : 0),
                                Math.sin(j) * 0.45,
                            ]}
                            rotation={[j, j * 2, 0]}
                            scale={0.38}
                        >
                            <dodecahedronGeometry args={[1, 0]} />
                            <meshStandardMaterial color="#b9b3a6" flatShading />
                        </mesh>
                    ))}
                </group>
            ))}
            {/* Skiltet */}
            <group position={[3.6, 0, 1.6]} rotation={[0, -0.5, 0]}>
                <mesh position={[-0.45, 0.6, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 1.2, 6]} />
                    <meshStandardMaterial color="#57341f" />
                </mesh>
                <mesh position={[0.45, 0.6, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 1.2, 6]} />
                    <meshStandardMaterial color="#57341f" />
                </mesh>
                <mesh position={[0, 1.25, 0]}>
                    <boxGeometry args={[1.3, 0.75, 0.06]} />
                    <meshStandardMaterial color="#7c4a1e" />
                </mesh>
                <mesh position={[0, 1.25, 0.035]}>
                    <planeGeometry args={[1.1, 0.55]} />
                    <meshStandardMaterial color="#f5efe3" />
                </mesh>
            </group>
            {/* Kraftlinja kommer fra øst */}
            {beat >= 3 &&
                [0, 1, 2, 3].map((i) => (
                    <group key={i} position={[22 - i * 5, 0, -6 + i * 1.2]}>
                        <mesh position={[0, 2.5, 0]}>
                            <boxGeometry args={[0.2, 5, 0.2]} />
                            <meshStandardMaterial color="#334155" />
                        </mesh>
                        <mesh position={[0, 4.8, 0]}>
                            <boxGeometry args={[2, 0.15, 0.15]} />
                            <meshStandardMaterial color="#334155" />
                        </mesh>
                    </group>
                ))}
            {beat >= 3 && (
                <mesh position={[16, 0.03, 0]} rotation={[-Math.PI / 2, 0, -0.2]}>
                    <planeGeometry args={[18, 1.4]} />
                    <meshStandardMaterial color="#6b6257" />
                </mesh>
            )}
        </group>
    );
}

function Hav({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        if (ref.current) ref.current.position.y = -0.25 + Math.sin(tid.current * 0.8) * 0.04;
    });
    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
            <planeGeometry args={[400, 400]} />
            <meshStandardMaterial color="#3b82a6" emissive="#1e5a7a" emissiveIntensity={0.35} />
        </mesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera(
        useMemo(() => kameraFor(modus), [modus]),
        beat,
        playing
    );
    const lag = lagFor(modus, beat);
    const oy = modus === 'spildra';
    const gjennom = modus === 'sjel' && beat >= 1;
    return (
        <>
            <color attach="background" args={[oy ? '#c7d7e2' : '#c9d1d6']} />
            <fog attach="fog" args={[oy ? '#d5e2ea' : '#d2d8dc', 30, 110]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#eef4f8', '#6b5a3a', 0.7]} />
            <directionalLight position={[20, 30, 25]} intensity={1.1} color="#fff4e0" />
            {/* Lys inn i hulrommet, så lagene synes */}
            {!oy && (
                <pointLight position={[0, 0.9, 1.6]} intensity={3} distance={5} color="#fff1d6" />
            )}
            {oy && <Hav playing={playing} />}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                {oy ? <circleGeometry args={[14, 18]} /> : <planeGeometry args={[220, 220]} />}
                <meshStandardMaterial color={oy ? '#7d8a52' : '#7a7448'} />
            </mesh>
            {/* Fjell i bakgrunnen */}
            {[-40, -12, 18, 46].map((x, i) => (
                <mesh key={x} position={[x, 0, -60 - (i % 2) * 14]}>
                    <coneGeometry args={[22 + (i % 2) * 6, 26 + (i % 3) * 6, 6]} />
                    <meshStandardMaterial color="#5f6670" flatShading />
                </mesh>
            ))}
            <Steiner
                farge="#8b918d"
                n={oy ? 40 : 150}
                omrade={oy ? 11 : 26}
                unntak={oy ? 5 : 2.6}
                oy={oy}
            />
            <Lyng omrade={oy ? 10 : 24} oy={oy} />
            {oy ? (
                <Oya beat={beat} />
            ) : (
                <>
                    <Hulrom />
                    {lag >= 1 && <Ris />}
                    {lag >= 2 && <Skjelett glod={gjennom ? 0.9 : 0} />}
                    {lag >= 3 && modus !== 'ura' && <Gaver />}
                    <Dekke lag={lag} gjennom={gjennom} />
                    {modus === 'sjel' && <Gjenferd beat={beat} playing={playing} />}
                </>
            )}
        </>
    );
}

const LAPPER: Record<Modus, string[]> = {
    ura: [
        'En steinur på Senja',
        'Tidlig på 1800-tallet',
        'Beina havner i ura',
        'Magasinet i Tromsø',
    ],
    lag: [
        'Et hulrom under en stor stein',
        'Nederst: bjørkeris',
        'Beina i omtrent samme orden',
        'Gaver: ring og kjede',
        'Never: bjørkebark',
        'Planker, stein og torv',
    ],
    sjel: [
        'Ikke skjult, men gitt tilbake',
        'Beina trengs for å bli født på nytt',
        'Å forsone seg: gjøre opp',
        'Larsen: sjelen gitt tilbake',
    ],
    spildra: [
        'Sju steder med bein urørt',
        'Fredet ved lov',
        'Spildra, Nord-Troms',
        'Holdt hemmelig',
    ],
};

const LAGLISTE = [
    { tekst: 'planker, stein og torv', farge: '#4d7c0f', fra: 5 },
    { tekst: 'never', farge: '#e7dcc4', fra: 4 },
    { tekst: 'gaver', farge: '#d4a017', fra: 3 },
    { tekst: 'beina', farge: '#f2ece0', fra: 2 },
    { tekst: 'bjørkeris', farge: '#7c2d12', fra: 1 },
];

function Lagstabel({ lag }: { lag: number }) {
    return (
        <div
            className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/90 shadow-xl"
            style={{ width: 330 }}
        >
            {LAGLISTE.map((l) => {
                const vist = lag >= l.fra;
                return (
                    <div
                        key={l.tekst}
                        className="flex items-center gap-3 rounded-lg px-2 py-1"
                        style={{
                            opacity: vist ? 1 : 0.5,
                            background: lag === l.fra ? '#fef3c7' : 'transparent',
                        }}
                    >
                        <span
                            className="rounded"
                            style={{
                                width: 26,
                                height: 20,
                                background: l.farge,
                                border: '2px solid #57534e',
                            }}
                        />
                        <span className="text-xl font-black text-slate-900 whitespace-nowrap">
                            {l.tekst}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/** Skallen og lappen i magasinet. */
function Magasin() {
    return (
        <div className="flex items-end gap-6 p-6 rounded-3xl bg-[#e7e2d8] shadow-2xl border-4 border-[#a8a29e]">
            <svg width={240} height={150} viewBox="0 0 240 150">
                <path
                    d="M 20 80 Q 20 20 110 22 Q 200 26 220 70 Q 228 100 190 110 L 120 112 L 60 120 Q 24 118 20 80 Z"
                    fill="#f2ece0"
                    stroke="#78716c"
                    strokeWidth={4}
                />
                <ellipse cx={92} cy={66} rx={16} ry={12} fill="#57534e" />
                <path
                    d="M 190 110 L 196 132 M 170 112 L 172 134"
                    stroke="#78716c"
                    strokeWidth={5}
                />
                <rect x={0} y={136} width={240} height={12} fill="#78716c" />
            </svg>
            <div
                className="px-4 py-3 bg-[#fdf6e3] shadow-lg rotate-[-3deg] text-slate-800"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', width: 300 }}
            >
                <div className="text-2xl">Fundet i en ur. 1911</div>
                <div className="text-2xl">Rasmus Enoksen</div>
            </div>
        </div>
    );
}

export function BjornegravenUra({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'ura';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = LAPPER[modus];
    const lapp = liste[Math.min(beat, liste.length - 1)];
    const magasin = modus === 'ura' && beat >= 3;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.1, far: 300, position: [16, 8, 22] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {magasin && (
                    <motion.div
                        key="magasin"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: playing ? 0.8 : 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-slate-900/60"
                    >
                        <Magasin />
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={lapp}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-4xl shadow-xl whitespace-nowrap"
                    >
                        {lapp}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'lag' && (
                <div className="absolute left-[3%] bottom-[6%]">
                    <Lagstabel lag={beat} />
                </div>
            )}
            {modus === 'spildra' && beat === 0 && (
                <div className="absolute bottom-[7%] right-[4%]">
                    <Teller
                        verdi={7}
                        etikett="gravsteder med bein urørt"
                        forsinkelse={playing ? 0.6 : 0}
                    />
                </div>
            )}
            {modus === 'spildra' && beat === 1 && (
                <div className="absolute bottom-[7%] inset-x-0 flex justify-center gap-4">
                    {['Fredet etter kulturminneloven', 'Skjult på kart'].map((t) => (
                        <div
                            key={t}
                            className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl font-black text-2xl text-slate-900"
                        >
                            {t}
                        </div>
                    ))}
                </div>
            )}
            {modus === 'spildra' && beat === 2 && (
                <div className="absolute bottom-[7%] inset-x-0 flex justify-center gap-4">
                    <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl font-black text-2xl text-slate-900">
                        Skilt for besøkende
                    </div>
                    <div className="px-5 py-3 rounded-2xl bg-amber-100 shadow-xl font-black text-2xl text-slate-900">
                        3 bjørner, tidlig middelalder
                    </div>
                </div>
            )}
            {modus === 'spildra' && beat >= 3 && (
                <div className="absolute bottom-[7%] inset-x-0 flex justify-center gap-4">
                    {['en vei', 'et hus', 'en kraftlinje'].map((t) => (
                        <div
                            key={t}
                            className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl font-black text-2xl text-slate-900"
                        >
                            {t}
                        </div>
                    ))}
                </div>
            )}
            {modus === 'sjel' && beat === 2 && (
                <div className="absolute bottom-[7%] left-[4%]">
                    <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl font-black text-2xl text-slate-900">
                        Ingvild Larsen: forsone seg = gjøre opp
                    </div>
                </div>
            )}
        </div>
    );
}
