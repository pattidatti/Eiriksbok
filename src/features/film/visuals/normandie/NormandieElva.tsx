import { useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Normandie i 3D.
 *
 *  - seinen:  vikingskip ror oppover Seinen mot Paris, kongen står på muren
 *  - rollo:   Gange-Rolv er for stor for hesten, så han går
 *  - foten:   tronsalen: Rollo nekter, mannen hans løfter foten, kongen velter
 *  - kanalen: Vilhelms flåte over havet, krona, lederne som byttes ut
 *
 * Alt animeres mot et mål per beat (dempet glidning), så et hopp rett til en beat ser riktig ut.
 */

type Modus = 'seinen' | 'rollo' | 'foten' | 'kanalen';
type V3 = [number, number, number];

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/* ---------- Kamera ---------- */

function kameraFor(modus: Modus, beat: number, t: number, rolloX: number) {
    if (modus === 'seinen') {
        switch (beat) {
            case 0:
                return { pos: v(48 - t * 0.5, 16, 26), se: v(10, 0, 0) };
            case 1:
                return { pos: v(26, 5.5, 14), se: v(8, 1, 0) };
            case 2:
                return { pos: v(-30, 14, 30), se: v(-62, 2, 0) };
            default:
                return { pos: v(-50, 5.6, 9.5), se: v(-59.4, 4.4, 2.6) };
        }
    }
    if (modus === 'rollo') {
        switch (beat) {
            case 0:
                return { pos: v(0, 3.4, 9 - t * 0.12), se: v(0, 2.6, 0) };
            case 1:
                return { pos: v(-7, 4.5, 9), se: v(0, 2, 0) };
            case 2:
                return { pos: v(1.5, 2.6, 9.5), se: v(1.5, 1.6, 0) };
            default:
                return { pos: v(rolloX + 3, 3.4, 10), se: v(rolloX - 1, 1.8, 0) };
        }
    }
    if (modus === 'foten') {
        switch (beat) {
            case 0:
                return { pos: v(0, 5, 13), se: v(0, 2, -2) };
            case 1:
                return { pos: v(3.5, 3, 6), se: v(1, 2.4, -1) };
            case 2:
                return { pos: v(-4, 3, 7), se: v(0, 1.5, -2) };
            case 3:
                return { pos: v(6, 2.6, 2), se: v(0, 1.8, -3) };
            default:
                return { pos: v(0, 6.5, 15), se: v(0, 2, -2) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(14, 4.5, 22 - t * 0.3), se: v(0, 1.5, 6) };
        case 1:
            return { pos: v(-30, 20, 40), se: v(0, 0, -10) };
        case 2:
            return { pos: v(0, 9, -12), se: v(0, 9, -44) };
        case 3:
            return { pos: v(10, 8, -18), se: v(0, 9.5, -44) };
        default:
            return { pos: v(0, 20, 34), se: v(0, 5, -30) };
    }
}

/* ---------- Byggeklosser ---------- */

function lagSkrog() {
    const s = new THREE.Shape();
    s.moveTo(-3.1, 1.5);
    s.quadraticCurveTo(-2.9, 0.1, -1.8, -0.25);
    s.lineTo(1.8, -0.25);
    s.quadraticCurveTo(2.9, 0.1, 3.1, 1.5);
    s.quadraticCurveTo(2.7, 0.55, 2.0, 0.45);
    s.lineTo(-2.0, 0.45);
    s.quadraticCurveTo(-2.7, 0.55, -3.1, 1.5);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.1, bevelEnabled: false });
    g.translate(0, 0, -0.55);
    return g;
}

/** Et vikingskip, baugen mot -x. */
function Langskip({ seil = true, arer = true }: { seil?: boolean; arer?: boolean }) {
    const skrog = useMemo(() => lagSkrog(), []);
    return (
        <group>
            <mesh geometry={skrog}>
                <meshStandardMaterial color="#6b4423" flatShading roughness={0.8} />
            </mesh>
            <mesh position={[0, 2.1, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 3.4, 6]} />
                <meshStandardMaterial color="#3f2a16" />
            </mesh>
            {seil && (
                <mesh position={[0, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[2.6, 2]} />
                    <meshStandardMaterial
                        color="#b91c1c"
                        emissive="#5f0d0d"
                        emissiveIntensity={0.3}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}
            {seil &&
                [-0.65, 0.65].map((z) => (
                    <mesh key={z} position={[0, 2.5, z * 0.01]} rotation={[0, Math.PI / 2, 0]}>
                        <planeGeometry args={[0.45, 2.02]} />
                        <meshStandardMaterial color="#f8fafc" side={THREE.DoubleSide} />
                    </mesh>
                ))}
            {/* Skjold langs relingen */}
            {[-1, 1].map((side) => (
                <mesh key={`sk${side}`} position={[0, 0.55, side * 0.57]}>
                    <boxGeometry args={[3.6, 0.32, 0.06]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#5b4a06"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
            {arer &&
                [-1, 1].map((side) =>
                    [-1.4, -0.5, 0.4, 1.3].map((x) => (
                        <mesh
                            key={`${side}${x}`}
                            position={[x, 0.3, side * 1.3]}
                            rotation={[side * 0.5, 0, 0]}
                        >
                            <boxGeometry args={[0.08, 0.06, 1.7]} />
                            <meshStandardMaterial color="#d6b98a" />
                        </mesh>
                    ))
                )}
        </group>
    );
}

interface PersonProps {
    farge: string;
    hud?: string;
    krone?: boolean;
    hjelm?: boolean;
    skjegg?: string;
    armerKryss?: boolean;
}

/** En enkel figur av klosser, 1,8 enheter høy. Foten står i origo. */
function Person({ farge, hud = '#e7b98f', krone, hjelm, skjegg, armerKryss }: PersonProps) {
    return (
        <group>
            {[-0.17, 0.17].map((x) => (
                <mesh key={x} position={[x, 0.42, 0]}>
                    <boxGeometry args={[0.26, 0.84, 0.3]} />
                    <meshStandardMaterial color="#3b3b46" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 1.12, 0]}>
                <boxGeometry args={[0.7, 0.62, 0.4]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            {armerKryss ? (
                <mesh position={[0, 1.15, 0.25]}>
                    <boxGeometry args={[0.8, 0.2, 0.18]} />
                    <meshStandardMaterial color={farge} flatShading />
                </mesh>
            ) : (
                [-0.45, 0.45].map((x) => (
                    <mesh key={x} position={[x, 1.08, 0]}>
                        <boxGeometry args={[0.18, 0.62, 0.2]} />
                        <meshStandardMaterial color={farge} flatShading />
                    </mesh>
                ))
            )}
            <mesh position={[0, 1.62, 0]}>
                <sphereGeometry args={[0.22, 12, 10]} />
                <meshStandardMaterial color={hud} flatShading />
            </mesh>
            {skjegg && (
                <mesh position={[0, 1.5, 0.14]}>
                    <boxGeometry args={[0.3, 0.22, 0.14]} />
                    <meshStandardMaterial color={skjegg} flatShading />
                </mesh>
            )}
            {hjelm && (
                <mesh position={[0, 1.8, 0]}>
                    <coneGeometry args={[0.24, 0.3, 8]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.4} />
                </mesh>
            )}
            {krone && (
                <mesh position={[0, 1.86, 0]}>
                    <cylinderGeometry args={[0.2, 0.18, 0.16, 8, 1, true]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#a16207"
                        emissiveIntensity={0.6}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}
        </group>
    );
}

function Hest() {
    return (
        <group>
            <mesh position={[0, 1.05, 0]}>
                <boxGeometry args={[1.5, 0.55, 0.5]} />
                <meshStandardMaterial color="#8b5a2b" flatShading />
            </mesh>
            {[
                [-0.55, 0.18],
                [-0.55, -0.18],
                [0.55, 0.18],
                [0.55, -0.18],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 0.4, z]}>
                    <boxGeometry args={[0.14, 0.8, 0.14]} />
                    <meshStandardMaterial color="#6b4423" flatShading />
                </mesh>
            ))}
            <mesh position={[-0.85, 1.45, 0]} rotation={[0, 0, -0.7]}>
                <boxGeometry args={[0.3, 0.7, 0.3]} />
                <meshStandardMaterial color="#8b5a2b" flatShading />
            </mesh>
            <mesh position={[-1.15, 1.7, 0]} rotation={[0, 0, 0.3]}>
                <boxGeometry args={[0.5, 0.24, 0.26]} />
                <meshStandardMaterial color="#8b5a2b" flatShading />
            </mesh>
            <mesh position={[0.82, 1.0, 0]} rotation={[0, 0, 0.5]}>
                <boxGeometry args={[0.1, 0.5, 0.1]} />
                <meshStandardMaterial color="#3f2a16" />
            </mesh>
        </group>
    );
}

/* ---------- Seinen ---------- */

const SKIP_START: V3[] = [
    [40, 0, -1.6],
    [46, 0, 1.8],
    [53, 0, -0.4],
    [60, 0, 2.2],
    [66, 0, -2.0],
];
const SKIP_MAL = [40, 8, 8, -42];

function Seinen({ beat, beatTid }: { beat: number; beatTid: React.RefObject<number> }) {
    const skip = useRef<(THREE.Group | null)[]>([]);
    const forsk = useRef(0);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        const mal = SKIP_MAL[Math.min(beat, 3)] - 40;
        forsk.current = forste.current ? mal : damp(forsk.current, mal, 0.6, dt);
        forste.current = false;
        const tid = beatTid.current ?? 0;
        skip.current.forEach((g, i) => {
            if (!g) return;
            const s = SKIP_START[i];
            g.position.set(s[0] + forsk.current, Math.sin(tid * 1.4 + i) * 0.06, s[2]);
            g.rotation.x = Math.sin(tid * 1.1 + i * 2) * 0.03;
        });
    });
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                <planeGeometry args={[400, 300]} />
                <meshStandardMaterial color="#7fae5a" roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
                <planeGeometry args={[400, 12]} />
                <meshStandardMaterial color="#3d7fb8" emissive="#123a5c" emissiveIntensity={0.5} />
            </mesh>
            {/* Åser langs elva */}
            {[
                [20, -30, 9],
                [-10, 34, 12],
                [55, 30, 10],
                [-95, -36, 14],
                [80, -40, 12],
            ].map(([x, z, r]) => (
                <mesh key={`${x}${z}`} position={[x, -r * 0.7, z]} scale={[1.6, 1, 1]}>
                    <sphereGeometry args={[r, 14, 10]} />
                    <meshStandardMaterial color="#6d9b4c" flatShading />
                </mesh>
            ))}
            {SKIP_START.map((_, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        skip.current[i] = g;
                    }}
                    scale={0.9}
                >
                    <Langskip seil={i % 2 === 0} />
                </group>
            ))}
            <Paris konge={beat >= 3} />
        </>
    );
}

function Paris({ konge }: { konge: boolean }) {
    return (
        <group position={[-66, 0, 0]}>
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[9, 9.5, 0.6, 24]} />
                <meshStandardMaterial color="#a3b18a" flatShading />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[7, 7, 3, 24, 1, true]} />
                <meshStandardMaterial color="#cbbf9f" flatShading side={THREE.DoubleSide} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((i) => {
                const a = (i / 6) * Math.PI * 2 + 0.3;
                return (
                    <group key={i} position={[Math.cos(a) * 7, 0, Math.sin(a) * 7]}>
                        <mesh position={[0, 2.4, 0]}>
                            <cylinderGeometry args={[0.9, 1, 4.2, 10]} />
                            <meshStandardMaterial color="#d8ccad" flatShading />
                        </mesh>
                        <mesh position={[0, 5, 0]}>
                            <coneGeometry args={[1.1, 1.4, 10]} />
                            <meshStandardMaterial color="#7c3f2c" flatShading />
                        </mesh>
                    </group>
                );
            })}
            <mesh position={[-1, 3, -1]}>
                <boxGeometry args={[4, 4.5, 2.4]} />
                <meshStandardMaterial color="#e5dcc5" flatShading />
            </mesh>
            <mesh position={[-2.6, 6.5, -1]}>
                <coneGeometry args={[0.9, 3, 8]} />
                <meshStandardMaterial color="#56423a" flatShading />
            </mesh>
            {[
                [3, 1.4, 2],
                [2, 1.2, -3],
                [-3.5, 1.1, 3],
                [4, 1.3, -1],
            ].map(([x, h, z]) => (
                <mesh key={`${x}${z}`} position={[x, 0.5 + h / 2, z]}>
                    <boxGeometry args={[1.6, h, 1.4]} />
                    <meshStandardMaterial color="#e9e2cf" flatShading />
                </mesh>
            ))}
            {/* Kongen på muren mot elva nedstrøms */}
            <group
                position={[6.6, 3.3, 2.6]}
                rotation={[0, Math.PI / 2, 0]}
                scale={konge ? 1.3 : 0.001}
            >
                <Person farge="#1d4ed8" krone />
            </group>
        </group>
    );
}

/* ---------- Rollo ---------- */

function Rollo({ beat, beatTid }: { beat: number; beatTid: React.RefObject<number> }) {
    const rollo = useRef<THREE.Group>(null);
    const hest = useRef<THREE.Group>(null);
    const ben = useRef<(THREE.Group | null)[]>([]);
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        const t = beatTid.current ?? 0;
        const r = rollo.current;
        const h = hest.current;
        if (!r || !h) return;
        const gaar = beat >= 3;
        r.position.x = gaar ? -t * 0.9 : 0;
        const hestMal = beat >= 2 ? 2.4 : 14;
        h.position.x = gaar ? r.position.x + 2.6 : damp(h.position.x, hestMal, 1.4, dt || 0.016);
        const sving = gaar ? Math.sin(t * 5) * 0.35 : 0;
        ben.current.forEach((b, i) => {
            if (b) b.rotation.x = i === 0 ? sving : -sving;
        });
        r.position.y = gaar ? Math.abs(Math.sin(t * 5)) * 0.06 : 0;
    });
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[400, 300]} />
                <meshStandardMaterial color="#86b45f" roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -14]}>
                <planeGeometry args={[400, 8]} />
                <meshStandardMaterial color="#3d7fb8" emissive="#123a5c" emissiveIntensity={0.5} />
            </mesh>
            {[
                [-12, -8],
                [9, -9],
                [-20, -6],
                [18, -7],
                [-30, -9],
            ].map(([x, z]) => (
                <group key={`${x}${z}`} position={[x, 0, z]}>
                    <mesh position={[0, 0.6, 0]}>
                        <cylinderGeometry args={[0.15, 0.2, 1.2, 6]} />
                        <meshStandardMaterial color="#5b3a1e" />
                    </mesh>
                    <mesh position={[0, 2, 0]}>
                        <coneGeometry args={[1.1, 2.6, 8]} />
                        <meshStandardMaterial color="#3f7a3a" flatShading />
                    </mesh>
                </group>
            ))}
            {/* Rollo: 1,8 x 1,75 = over tre meter i saga-målestokk */}
            <group ref={rollo}>
                <group scale={1.75} rotation={[0, beat >= 3 ? -Math.PI / 2 + 0.5 : 0.25, 0]}>
                    {[-0.17, 0.17].map((x, i) => (
                        <group
                            key={x}
                            position={[x, 0.84, 0]}
                            ref={(g) => {
                                ben.current[i] = g;
                            }}
                        >
                            <mesh position={[0, -0.42, 0]}>
                                <boxGeometry args={[0.26, 0.84, 0.3]} />
                                <meshStandardMaterial color="#3b3b46" flatShading />
                            </mesh>
                        </group>
                    ))}
                    <group position={[0, 0, 0]}>
                        <OverKropp />
                    </group>
                </group>
            </group>
            <group ref={hest} position={[14, 0, 0.6]} rotation={[0, beat >= 3 ? 0 : Math.PI, 0]}>
                <Hest />
            </group>
        </>
    );
}

/** Rollos overkropp (beina animeres for seg). */
function OverKropp() {
    return (
        <>
            <mesh position={[0, 1.12, 0]}>
                <boxGeometry args={[0.76, 0.62, 0.44]} />
                <meshStandardMaterial color="#7f1d1d" flatShading />
            </mesh>
            {[-0.48, 0.48].map((x) => (
                <mesh key={x} position={[x, 1.08, 0]}>
                    <boxGeometry args={[0.2, 0.62, 0.22]} />
                    <meshStandardMaterial color="#7f1d1d" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 1.62, 0]}>
                <sphereGeometry args={[0.22, 12, 10]} />
                <meshStandardMaterial color="#e7b98f" flatShading />
            </mesh>
            <mesh position={[0, 1.48, 0.14]}>
                <boxGeometry args={[0.32, 0.28, 0.14]} />
                <meshStandardMaterial color="#c2410c" flatShading />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
                <coneGeometry args={[0.25, 0.3, 8]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[-0.62, 1.05, 0.05]} rotation={[0, Math.PI / 2, 0]}>
                <cylinderGeometry args={[0.36, 0.36, 0.06, 16]} />
                <meshStandardMaterial color="#facc15" emissive="#5b4a06" emissiveIntensity={0.3} />
            </mesh>
        </>
    );
}

/* ---------- Tronsalen ---------- */

function Foten({ beat, beatTid }: { beat: number; beatTid: React.RefObject<number> }) {
    const trone = useRef<THREE.Group>(null);
    const mann = useRef<THREE.Group>(null);
    const kongeFot = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = forste.current ? 100 : Math.min(delta, 0.05);
        forste.current = false;
        const t = beatTid.current ?? 0;
        if (trone.current) {
            const vipp =
                beat === 3 ? Math.min(1, Math.max(0, t - 1.2) / 0.9) * 1.25 : beat > 3 ? 1.25 : 0;
            trone.current.rotation.x =
                beat === 3 ? -vipp : damp(trone.current.rotation.x, -vipp, 3, dt);
        }
        if (mann.current) {
            const maal = beat >= 3 ? 0.45 : beat >= 2 ? 1.2 : 4.5;
            mann.current.position.x = damp(mann.current.position.x, maal, 2, dt);
            mann.current.position.z = damp(
                mann.current.position.z,
                beat >= 3 ? -1.25 : beat >= 2 ? -0.6 : 1.5,
                2,
                dt
            );
        }
        if (kongeFot.current) {
            const loft = beat === 3 ? Math.min(1, t / 1.2) * 1.3 : beat > 3 ? 1.3 : 0;
            kongeFot.current.rotation.x =
                beat === 3 ? -loft : damp(kongeFot.current.rotation.x, -loft, 3, dt);
        }
    });
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color="#8a6a4a" roughness={1} />
            </mesh>
            <mesh position={[0, 5, -6]}>
                <boxGeometry args={[30, 10, 0.4]} />
                <meshStandardMaterial color="#6b4f3a" flatShading />
            </mesh>
            {[-6, 6].map((x) => (
                <mesh key={x} position={[x, 3.5, -5.2]}>
                    <boxGeometry args={[1.6, 5, 0.1]} />
                    <meshStandardMaterial
                        color="#1d4ed8"
                        emissive="#0b2266"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            ))}
            {/* Podiet */}
            <mesh position={[0, 0.25, -3]}>
                <boxGeometry args={[5, 0.5, 3]} />
                <meshStandardMaterial color="#7c2d12" flatShading />
            </mesh>
            {/* Tronen og kongen vipper bakover rundt bakkanten */}
            <group position={[0, 0.5, -3.8]}>
                <group ref={trone}>
                    <group position={[0, 0, 0.8]}>
                        <mesh position={[0, 0.5, 0]}>
                            <boxGeometry args={[1.4, 1, 1.2]} />
                            <meshStandardMaterial color="#a16207" flatShading />
                        </mesh>
                        <mesh position={[0, 1.6, -0.5]}>
                            <boxGeometry args={[1.4, 2.4, 0.2]} />
                            <meshStandardMaterial color="#a16207" flatShading />
                        </mesh>
                        {/* Kongen sitter */}
                        <mesh position={[0, 1.35, -0.1]}>
                            <boxGeometry args={[0.7, 0.62, 0.4]} />
                            <meshStandardMaterial color="#1d4ed8" flatShading />
                        </mesh>
                        <mesh position={[0, 1.88, -0.1]}>
                            <sphereGeometry args={[0.22, 12, 10]} />
                            <meshStandardMaterial color="#e7b98f" flatShading />
                        </mesh>
                        <mesh position={[0, 2.12, -0.1]}>
                            <cylinderGeometry args={[0.2, 0.18, 0.16, 8, 1, true]} />
                            <meshStandardMaterial
                                color="#facc15"
                                emissive="#a16207"
                                emissiveIntensity={0.6}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                        <mesh position={[-0.17, 1.05, 0.35]}>
                            <boxGeometry args={[0.26, 0.26, 0.8]} />
                            <meshStandardMaterial color="#1e3a8a" flatShading />
                        </mesh>
                        {/* Foten som blir løftet */}
                        <group position={[0.17, 1.05, 0.7]} ref={kongeFot}>
                            <mesh position={[0, -0.45, 0]}>
                                <boxGeometry args={[0.24, 0.9, 0.26]} />
                                <meshStandardMaterial color="#1e3a8a" flatShading />
                            </mesh>
                            <mesh position={[0, -0.92, 0.12]}>
                                <boxGeometry args={[0.26, 0.16, 0.42]} />
                                <meshStandardMaterial color="#3f2a16" />
                            </mesh>
                        </group>
                    </group>
                </group>
            </group>
            {/* Rollo, armene i kors */}
            <group position={[-2.2, 0, 0.6]} rotation={[0, 0.5, 0]} scale={1.35}>
                <Person farge="#7f1d1d" hjelm skjegg="#c2410c" armerKryss={beat >= 1} />
            </group>
            {/* Mannen hans går fram */}
            <group
                ref={mann}
                position={[4.5, 0, 1.5]}
                rotation={[0, beat >= 3 ? Math.PI : -0.4, 0]}
            >
                <Person farge="#57534e" hjelm skjegg="#78350f" />
            </group>
            {/* Frankiske hoffolk */}
            {[
                [5.5, -3.5],
                [-5.5, -3.2],
            ].map(([x, z]) => (
                <group key={x} position={[x, 0, z]} rotation={[0, x > 0 ? -0.6 : 0.6, 0]}>
                    <Person farge="#0f766e" />
                </group>
            ))}
        </>
    );
}

/* ---------- Kanalen ---------- */

const FLATE: V3[] = [
    [0, 0, 6],
    [-6, 0, 12],
    [6, 0, 13],
    [-11, 0, 20],
    [11, 0, 21],
    [-3, 0, 26],
    [4, 0, 30],
];

function Kanalen({ beat, beatTid }: { beat: number; beatTid: React.RefObject<number> }) {
    const skip = useRef<(THREE.Group | null)[]>([]);
    const krone = useRef<THREE.Group>(null);
    const flagg = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const forsk = useRef(0);
    const forste = useRef(true);
    const bla = useMemo(() => new THREE.Color('#2563eb'), []);
    const rod = useMemo(() => new THREE.Color('#b91c1c'), []);
    useFrame((_, delta) => {
        const dt = forste.current ? 100 : Math.min(delta, 0.05);
        forste.current = false;
        const t = beatTid.current ?? 0;
        const mal = beat === 0 ? 0 : beat === 1 ? -6 : -14;
        forsk.current = damp(forsk.current, mal, 0.5, dt);
        skip.current.forEach((g, i) => {
            if (!g) return;
            const s = FLATE[i];
            g.position.set(s[0], Math.sin(t * 1.2 + i) * 0.1, s[2] + forsk.current);
            g.rotation.z = Math.sin(t * 0.9 + i * 1.7) * 0.04;
        });
        if (krone.current) {
            const s = damp(krone.current.scale.x, beat >= 2 ? 1 : 0.001, 2.5, dt);
            krone.current.scale.setScalar(s);
            krone.current.rotation.y += dt < 1 ? dt * 0.6 : 0;
        }
        flagg.current.forEach((m, i) => {
            if (!m) return;
            const byttet = beat >= 3 && (beat > 3 || t > 0.6 + i * 0.45);
            m.color.lerp(byttet ? rod : bla, dt < 1 ? 1 - Math.exp(-4 * dt) : 1);
        });
    });
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[600, 600]} />
                <meshStandardMaterial
                    color="#2f6f9f"
                    emissive="#0d2c45"
                    emissiveIntensity={0.5}
                    roughness={0.5}
                />
            </mesh>
            {/* Englands kalkklipper */}
            <mesh position={[0, 3, -48]}>
                <boxGeometry args={[220, 6, 8]} />
                <meshStandardMaterial color="#f1efe6" flatShading />
            </mesh>
            <mesh position={[0, 6.2, -56]}>
                <boxGeometry args={[220, 0.6, 24]} />
                <meshStandardMaterial color="#6fa34f" />
            </mesh>
            {[-14, -8, -2.5, 2.5, 8, 14].map((x, i) => (
                <group key={x} position={[x, 6.5, -47]}>
                    <mesh position={[0, 1.6, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 3.2, 6]} />
                        <meshStandardMaterial color="#3f2a16" />
                    </mesh>
                    <mesh position={[0.75, 2.7, 0]}>
                        <planeGeometry args={[1.5, 1]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                flagg.current[i] = m;
                            }}
                            color="#2563eb"
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                </group>
            ))}
            <group ref={krone} position={[0, 15, -46]} scale={0.001}>
                <mesh>
                    <cylinderGeometry args={[2, 1.8, 1.4, 20, 1, true]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#a16207"
                        emissiveIntensity={0.7}
                        metalness={0.5}
                        roughness={0.3}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const a = (i / 8) * Math.PI * 2;
                    return (
                        <mesh key={i} position={[Math.cos(a) * 2, 1.1, Math.sin(a) * 2]}>
                            <coneGeometry args={[0.35, 0.9, 6]} />
                            <meshStandardMaterial
                                color="#facc15"
                                emissive="#a16207"
                                emissiveIntensity={0.7}
                            />
                        </mesh>
                    );
                })}
            </group>
            {FLATE.map((_, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        skip.current[i] = g;
                    }}
                    rotation={[0, -Math.PI / 2, 0]}
                >
                    <group rotation={[0, 0, 0]}>
                        <Langskip arer={false} />
                    </group>
                </group>
            ))}
        </>
    );
}

/* ---------- Scene ---------- */

const HIMMEL: Record<Modus, { bg: string; fog: [number, number] }> = {
    seinen: { bg: '#cfe6f5', fog: [80, 260] },
    rollo: { bg: '#d6ecf7', fog: [40, 160] },
    foten: { bg: '#2a1d14', fog: [30, 80] },
    kanalen: { bg: '#c5dcec', fog: [90, 300] },
};

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const kamSe = useRef(v(0, 0, 0));
    const rolloX = useRef(0);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        rolloX.current = modus === 'rollo' && beat >= 3 ? -beatTid.current * 0.9 : 0;
        const mal = kameraFor(modus, beat, beatTid.current, rolloX.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
    });
    const h = HIMMEL[modus];
    return (
        <>
            <color attach="background" args={[h.bg]} />
            <fog attach="fog" args={[h.bg, h.fog[0], h.fog[1]]} />
            <ambientLight intensity={modus === 'foten' ? 0.7 : 0.65} />
            <directionalLight
                position={[30, 50, 25]}
                intensity={modus === 'foten' ? 1.1 : 1.5}
                color="#fff4e0"
            />
            <hemisphereLight args={['#e0f2fe', '#3f3a2a', 0.5]} />
            {modus === 'foten' && (
                <pointLight position={[0, 6, 4]} intensity={30} color="#ffb366" />
            )}
            {modus === 'seinen' && <Seinen beat={beat} beatTid={beatTid} />}
            {modus === 'rollo' && <Rollo beat={beat} beatTid={beatTid} />}
            {modus === 'foten' && <Foten beat={beat} beatTid={beatTid} />}
            {modus === 'kanalen' && <Kanalen beat={beat} beatTid={beatTid} />}
        </>
    );
}

/* ---------- Merkelapper ---------- */

const TEKST: Record<Modus, (string | null)[]> = {
    seinen: [
        'Elva Seinen, år 911',
        'Vikingskip på vei oppover elva',
        'Paris',
        'Kong Karl den enfoldige',
    ],
    rollo: [
        'Rollo, på norrønt Gange-Rolv',
        'Sagaene forteller',
        'For stor til å sitte på en hest',
        'Derfor måtte han gå',
    ],
    foten: [
        'Rollo skal sverge troskap',
        'Rollo nekter å kysse foten',
        'En av Rollos menn gjør det',
        'Kongen velter bakover',
        null,
        null,
    ],
    kanalen: [
        'Vilhelm Erobreren, Rollos tipp-tipp-oldebarn',
        'Over havet fra Normandie',
        'Jula 1066: konge av England',
        'Etter hvert: franske ledere i stedet for engelske',
        'Vikingenes etterkommere',
    ],
};

function Midtstilt({ children, topp }: { children: ReactNode; topp: string }) {
    return (
        <div
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: topp }}
        >
            {children}
        </div>
    );
}

export function NormandieElva({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'seinen';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = TEKST[modus][Math.min(beat, TEKST[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 700, position: [40, 14, 30] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <Midtstilt key={`${modus}${beat}`} topp="7%">
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl"
                        >
                            {tekst}
                        </motion.div>
                    </Midtstilt>
                )}
                {modus === 'foten' && beat >= 4 && (
                    <Midtstilt key="kilde" topp="12%">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-2xl bg-amber-50/95 shadow-2xl px-8 py-5 text-center"
                            style={{ maxWidth: 640 }}
                        >
                            <div className="text-xl font-bold uppercase tracking-wider text-amber-800">
                                Eneste kilde
                            </div>
                            <div className="text-4xl font-display font-black text-slate-900 mt-1">
                                Dudo av Saint-Quentin
                            </div>
                            <div className="text-2xl font-semibold text-slate-700 mt-2">
                                skrev nesten 100 år senere
                            </div>
                            {beat >= 5 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-2xl font-semibold text-slate-700 mt-3"
                                >
                                    for Rollos etterkommere.
                                    <div className="text-4xl font-display font-black text-red-700 mt-2">
                                        Skjedde det? Vi vet ikke.
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </Midtstilt>
                )}
            </AnimatePresence>
        </div>
    );
}
