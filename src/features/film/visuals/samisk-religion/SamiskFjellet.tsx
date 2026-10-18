import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Fjellet i Nord-Norge en junidag. «fjell»: lavvuen og åndene i landskapet. «sieidi»:
 * offersteinen ved fossen, der gavene legges. «siida»: leiren med noaiden i midten.
 * «bjorn»: bjørnen i skogen, ånden og graven med beina.
 */

type Modus = 'fjell' | 'sieidi' | 'siida' | 'bjorn';

const LAVVU: [number, number] = [0, 0];
const SIEIDI: [number, number] = [-13, -5];
const FOSS: [number, number] = [-17.5, -9];
const BJORN: [number, number] = [9, -14];
const GRAV: [number, number] = [12.5, -11];

function kameraFor(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'fjell') {
            switch (beat) {
                case 0:
                    return { pos: v(-4 + t * 0.25, 9, 40), se: v(-4, 8, -30) };
                case 1:
                    return { pos: v(6 - t * 0.2, 4, 12), se: v(0, 2.6, 0) };
                default:
                    return { pos: v(4 - t * 0.2, 6, 26), se: v(-3, 3, -6) };
            }
        }
        if (modus === 'sieidi') {
            switch (beat) {
                case 0:
                    return { pos: v(4, 7, 24), se: v(-6, 3, -4) };
                case 1:
                    return { pos: v(-2 - t * 0.2, 6, 16), se: v(-10, 3, -6) };
                default:
                    if (beat === 3)
                        return { pos: v(-10.6 + t * 0.08, 2.4, 1.6), se: v(-12.6, 0.6, -3.6) };
                    return { pos: v(-8 + t * 0.12, 3.2, 3.5), se: v(-14, 1.6, -6.5) };
            }
        }
        if (modus === 'siida') {
            switch (beat) {
                case 0:
                    return { pos: v(10 - t * 0.2, 9, 22), se: v(0, 1.5, 0) };
                case 1:
                    return { pos: v(3.4, 3.6, 10.5 + t * 0.08), se: v(0, 1.3, 3.8) };
                case 2:
                    return { pos: v(-6, 5, 16), se: v(4, 1.5, -6) };
                default:
                    return { pos: v(-3.2 + t * 0.12, 3.8, 11), se: v(0, 1.3, 4) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(16 - t * 0.2, 4, 0), se: v(9, 1.6, -14) };
            case 1:
                return { pos: v(13, 3, -5), se: v(9, 1.8, -14) };
            case 2:
                return { pos: v(16, 4.5, -3), se: v(10, 2.2, -13) };
            default:
                return { pos: v(18 - t * 0.15, 4.5, -3), se: v(12, 1.6, -11.5) };
        }
    };
}

/** En lavvu: kjegle av skinn med stengene stikkende opp. */
function Lavvu({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
    return (
        <group position={[x, 0, z]} scale={s}>
            <mesh position={[0, 1.6, 0]}>
                <coneGeometry args={[2, 3.2, 12, 1, true]} />
                <meshStandardMaterial color="#a9875e" flatShading side={THREE.DoubleSide} />
            </mesh>
            {[0, 1.3, 2.6, 3.9, 5.2].map((a) => (
                <mesh
                    key={a}
                    position={[Math.cos(a) * 0.12, 3.5, Math.sin(a) * 0.12]}
                    rotation={[Math.sin(a) * 0.22, 0, Math.cos(a) * 0.22]}
                >
                    <cylinderGeometry args={[0.04, 0.05, 1.3, 4]} />
                    <meshStandardMaterial color="#4a3826" />
                </mesh>
            ))}
            <mesh position={[0, 0.7, 1.86]} rotation={[-0.5, 0, 0]}>
                <planeGeometry args={[0.8, 1.2]} />
                <meshStandardMaterial color="#3a2a1a" side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

/** Røyk fra lavvutoppen. Få, store kuler som stiger og blekner. */
function Royk({ x, z, playing }: { x: number; z: number; playing: boolean }) {
    const N = 8;
    const ref = useRef<THREE.InstancedMesh>(null);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        for (let i = 0; i < N; i++) {
            const k = (tid.current * 0.18 + i / N) % 1;
            tmp.position.set(x + k * 1.6 + Math.sin(i + k * 4) * 0.3, 3.6 + k * 6, z - k * 0.6);
            tmp.scale.setScalar(0.35 + k * 1.1);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#d6dbe2" transparent opacity={0.4} depthWrite={false} />
        </instancedMesh>
    );
}

function Fjellkjede() {
    const topper = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => ({
                x: -70 + i * 17 + frø(i) * 6,
                z: -45 - frø(i + 3) * 18,
                r: 16 + frø(i + 6) * 8,
                h: 16 + frø(i + 1) * 12,
            })),
        []
    );
    return (
        <>
            {topper.map((f, i) => (
                <group key={i} position={[f.x, 0, f.z]}>
                    <mesh position={[0, f.h / 2, 0]}>
                        <coneGeometry args={[f.r, f.h, 7]} />
                        <meshStandardMaterial color="#7d8a7a" flatShading />
                    </mesh>
                    {/* Snøen ligger igjen øverst og nede i kløftene */}
                    <mesh position={[0, f.h * 0.82, 0]}>
                        <coneGeometry args={[f.r * 0.19, f.h * 0.37, 7]} />
                        <meshStandardMaterial
                            color="#f8fafc"
                            emissive="#9aa8bb"
                            emissiveIntensity={0.35}
                            flatShading
                        />
                    </mesh>
                    <mesh
                        position={[f.r * 0.32, f.h * 0.38, f.r * 0.55]}
                        rotation={[0.5, 0.4, -0.2]}
                    >
                        <boxGeometry args={[1.2, f.h * 0.45, 0.4]} />
                        <meshStandardMaterial
                            color="#f1f5f9"
                            emissive="#9aa8bb"
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** Bjørk og furu, instansert så skogen blir billig. */
function Skog() {
    const N = 46;
    const stamme = useRef<THREE.InstancedMesh>(null);
    const krone = useRef<THREE.InstancedMesh>(null);
    const plasser = useMemo(
        () =>
            Array.from({ length: N }, (_, i) => {
                // Mest skog rundt bjørnen, noen trær spredt ellers
                const naer = i < 30;
                const x = naer ? BJORN[0] + (frø(i) - 0.3) * 22 : (frø(i) - 0.5) * 60;
                const z = naer ? BJORN[1] - frø(i + 50) * 14 + 2 : -16 - frø(i + 50) * 20;
                const ok =
                    Math.hypot(x - BJORN[0], z - BJORN[1]) > 3.2 &&
                    Math.hypot(x - GRAV[0], z - GRAV[1]) > 2.6;
                return { x: ok ? x : x + 6, z, s: 0.8 + frø(i + 9) * 0.6 };
            }),
        []
    );
    useLayoutEffect(() => {
        const tmp = new THREE.Object3D();
        plasser.forEach((p, i) => {
            tmp.position.set(p.x, 0.9 * p.s, p.z);
            tmp.scale.set(p.s, p.s, p.s);
            tmp.updateMatrix();
            stamme.current?.setMatrixAt(i, tmp.matrix);
            tmp.position.set(p.x, 2.9 * p.s, p.z);
            tmp.updateMatrix();
            krone.current?.setMatrixAt(i, tmp.matrix);
        });
        if (stamme.current) stamme.current.instanceMatrix.needsUpdate = true;
        if (krone.current) krone.current.instanceMatrix.needsUpdate = true;
    }, [plasser]);
    return (
        <>
            <instancedMesh ref={stamme} args={[undefined, undefined, N]}>
                <cylinderGeometry args={[0.12, 0.16, 1.8, 5]} />
                <meshStandardMaterial color="#5b4630" />
            </instancedMesh>
            <instancedMesh ref={krone} args={[undefined, undefined, N]}>
                <coneGeometry args={[1.1, 3, 6]} />
                <meshStandardMaterial color="#3f6b45" flatShading />
            </instancedMesh>
        </>
    );
}

/** Fossen og kulpen ved sieidien. */
function Foss({ playing }: { playing: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        if (mat.current) mat.current.emissiveIntensity = 0.55 + Math.sin(tid.current * 6) * 0.08;
    });
    return (
        <group position={[FOSS[0], 0, FOSS[1]]}>
            <mesh position={[0, 3.4, -2.6]} scale={[5.4, 4.4, 2.6]}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#7b8088" flatShading />
            </mesh>
            <mesh position={[0.4, 3.4, 0.25]}>
                <planeGeometry args={[1.4, 6.8]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#dbeafe"
                    emissive="#93c5fd"
                    emissiveIntensity={0.55}
                />
            </mesh>
            <mesh position={[0.6, 0.03, 1.8]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[2.6, 20]} />
                <meshStandardMaterial color="#5b8db8" emissive="#2f5f8a" emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
}

/** Sieidien: en stor, rar stein. Gavene ligger foran den. */
function Sieidi({ gaver, veltet }: { gaver: boolean; veltet?: boolean }) {
    return (
        <group position={[SIEIDI[0], 0, SIEIDI[1]]}>
            <mesh
                position={[0, 1.5, 0]}
                rotation={veltet ? [0, 0, 1.3] : [0.1, 0.4, 0.15]}
                scale={[1.1, 1.6, 0.9]}
            >
                <dodecahedronGeometry args={[1.2, 0]} />
                <meshStandardMaterial color="#8b8478" flatShading />
            </mesh>
            {gaver && (
                <group position={[0.6, 0, 1.7]} scale={1.9}>
                    {/* Et reinhorn, en fisk og et lite skinn */}
                    <mesh position={[-0.6, 0.12, 0]} rotation={[0, 0.4, Math.PI / 2]}>
                        <cylinderGeometry args={[0.06, 0.08, 1.2, 5]} />
                        <meshStandardMaterial color="#e7dcc4" />
                    </mesh>
                    <mesh position={[-0.6, 0.35, 0.3]} rotation={[0.7, 0.4, 0.3]}>
                        <cylinderGeometry args={[0.04, 0.06, 0.7, 5]} />
                        <meshStandardMaterial color="#e7dcc4" />
                    </mesh>
                    <mesh position={[0.3, 0.1, 0.2]} rotation={[0, 0.8, 0]} scale={[1, 0.35, 0.45]}>
                        <sphereGeometry args={[0.45, 8, 6]} />
                        <meshStandardMaterial
                            color="#9ca3af"
                            emissive="#475569"
                            emissiveIntensity={0.25}
                        />
                    </mesh>
                    <mesh position={[0.9, 0.04, -0.2]} rotation={[-Math.PI / 2, 0, 0.3]}>
                        <planeGeometry args={[0.8, 0.6]} />
                        <meshStandardMaterial color="#7c5a3a" side={THREE.DoubleSide} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

/** Et menneske av to enkle former. Noaiden har trommen. */
function Person({
    x,
    z,
    farge,
    rot = 0,
    tromme = false,
}: {
    x: number;
    z: number;
    farge: string;
    rot?: number;
    tromme?: boolean;
}) {
    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.65, 0]}>
                <cylinderGeometry args={[0.22, 0.34, 1.3, 7]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <sphereGeometry args={[0.22, 8, 6]} />
                <meshStandardMaterial color="#e8c9a5" />
            </mesh>
            {tromme && (
                <mesh position={[0, 1.0, 0.42]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
                    <cylinderGeometry args={[0.38, 0.38, 0.1, 14]} />
                    <meshStandardMaterial
                        color="#d9b98a"
                        emissive="#b45309"
                        emissiveIntensity={0.25}
                    />
                </mesh>
            )}
        </group>
    );
}

/** Rein: kropp, fire bein og et gevir. */
function Rein({ x, z, rot }: { x: number; z: number; rot: number }) {
    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[1.2, 0.5, 0.4]} />
                <meshStandardMaterial color="#8a7a66" flatShading />
            </mesh>
            {[-0.45, 0.45].map((bx) =>
                [-0.13, 0.13].map((bz) => (
                    <mesh key={`${bx}${bz}`} position={[bx, 0.33, bz]}>
                        <boxGeometry args={[0.1, 0.66, 0.1]} />
                        <meshStandardMaterial color="#5b4d3d" />
                    </mesh>
                ))
            )}
            <mesh position={[0.72, 1.2, 0]}>
                <boxGeometry args={[0.36, 0.3, 0.26]} />
                <meshStandardMaterial color="#e5ddd0" />
            </mesh>
            <mesh position={[0.7, 1.6, 0]} rotation={[0, 0, -0.4]}>
                <torusGeometry args={[0.3, 0.035, 4, 8, Math.PI]} />
                <meshStandardMaterial color="#d6c7a8" />
            </mesh>
        </group>
    );
}

/** Bjørnen, bygd av kuler. «and» gjør den til en lysende ånd. */
function Bjorn({ and, playing }: { and: number; playing: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const g = useRef<THREE.Group>(null);
    const k = useRef(and);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        k.current = playing ? damp(k.current, and, 1.2, dt) : and;
        if (mat.current) {
            mat.current.color.lerpColors(
                new THREE.Color('#5a3d26'),
                new THREE.Color('#dbeafe'),
                k.current
            );
            mat.current.emissiveIntensity = k.current * 0.9;
            mat.current.opacity = 1 - k.current * 0.35;
        }
        if (g.current) g.current.position.y = k.current * 1.2;
    });
    return (
        <group ref={g} position={[BJORN[0], 0, BJORN[1]]} rotation={[0, -0.7, 0]}>
            <mesh position={[0, 1.3, 0]} scale={[1.5, 1, 1]}>
                <sphereGeometry args={[1, 12, 9]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#5a3d26"
                    emissive="#93c5fd"
                    emissiveIntensity={0}
                    transparent
                    flatShading
                />
            </mesh>
            <mesh position={[1.45, 1.75, 0]}>
                <sphereGeometry args={[0.6, 10, 8]} />
                <meshStandardMaterial
                    color="#4a3220"
                    flatShading
                    transparent
                    opacity={1 - and * 0.5}
                />
            </mesh>
            <mesh position={[1.95, 1.65, 0]}>
                <sphereGeometry args={[0.25, 8, 6]} />
                <meshStandardMaterial color="#2b1d12" transparent opacity={1 - and * 0.5} />
            </mesh>
            {[-0.25, 0.25].map((oz) => (
                <mesh key={oz} position={[1.3, 2.3, oz]}>
                    <sphereGeometry args={[0.16, 6, 5]} />
                    <meshStandardMaterial color="#4a3220" transparent opacity={1 - and * 0.5} />
                </mesh>
            ))}
            {[-0.8, 0.8].map((bx) =>
                [-0.45, 0.45].map((bz) => (
                    <mesh key={`${bx}${bz}`} position={[bx, 0.4, bz]}>
                        <cylinderGeometry args={[0.24, 0.26, 0.8, 7]} />
                        <meshStandardMaterial color="#4a3220" transparent opacity={1 - and * 0.5} />
                    </mesh>
                ))
            )}
        </group>
    );
}

/** Beina som legges i graven. */
function Bein() {
    return (
        <group position={[GRAV[0], 0.45, GRAV[1]]}>
            {[-0.8, -0.3, 0.2, 0.7].map((x, i) => (
                <mesh
                    key={x}
                    position={[x, 0, (i % 2) * 0.3 - 0.15]}
                    rotation={[0, 0.5 + i * 0.6, Math.PI / 2]}
                >
                    <cylinderGeometry args={[0.08, 0.08, 0.9, 6]} />
                    <meshStandardMaterial
                        color="#f5f0e1"
                        emissive="#a8a29e"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}

/** En ny, liten bjørn som tones inn ved graven: født på nytt. */
function Unge({ playing }: { playing: boolean }) {
    const g = useRef<THREE.Group>(null);
    const k = useRef(playing ? 0 : 1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        k.current = playing ? damp(k.current, 1, 0.8, dt) : 1;
        if (g.current) g.current.scale.setScalar(0.05 + k.current * 0.5);
    });
    return (
        <group ref={g} position={[GRAV[0] - 3.6, 0, GRAV[1] + 0.8]} rotation={[0, -1.6, 0]}>
            <mesh position={[0, 1.3, 0]} scale={[1.5, 1, 1]}>
                <sphereGeometry args={[1, 12, 9]} />
                <meshStandardMaterial
                    color="#dbeafe"
                    emissive="#93c5fd"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.7}
                    flatShading
                />
            </mesh>
            <mesh position={[1.45, 1.75, 0]}>
                <sphereGeometry args={[0.6, 10, 8]} />
                <meshStandardMaterial
                    color="#dbeafe"
                    emissive="#93c5fd"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.7}
                    flatShading
                />
            </mesh>
            {[-0.8, 0.8].map((bx) =>
                [-0.45, 0.45].map((bz) => (
                    <mesh key={`${bx}${bz}`} position={[bx, 0.4, bz]}>
                        <cylinderGeometry args={[0.24, 0.26, 0.8, 7]} />
                        <meshStandardMaterial
                            color="#dbeafe"
                            emissive="#93c5fd"
                            emissiveIntensity={0.8}
                            transparent
                            opacity={0.7}
                        />
                    </mesh>
                ))
            )}
        </group>
    );
}

/** Graven: en lav haug av jord med en ring av steiner. */
function Grav() {
    return (
        <group position={[GRAV[0], 0, GRAV[1]]}>
            <mesh position={[0, 0, 0]} scale={[1.6, 0.4, 1.1]}>
                <sphereGeometry args={[1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#6b4f35" flatShading />
            </mesh>
            {Array.from({ length: 9 }, (_, i) => {
                const a = (i / 9) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(a) * 2.1, 0.18, Math.sin(a) * 1.5]}>
                        <dodecahedronGeometry args={[0.25, 0]} />
                        <meshStandardMaterial color="#9ca3af" flatShading />
                    </mesh>
                );
            })}
        </group>
    );
}

/** Ånder: små, myke lys som pulserer ved stein, tre, vann og fjell. */
function Ander({
    steder,
    styrke,
    playing,
}: {
    steder: [number, number, number][];
    styrke: number;
    playing: boolean;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0);
    const k = useRef(styrke);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        k.current = playing ? damp(k.current, styrke, 1.2, dt) : styrke;
        steder.forEach(([x, y, z], i) => {
            const puls = 1 + Math.sin(tid.current * 2 + i * 1.7) * 0.18;
            tmp.position.set(x, y + Math.sin(tid.current * 0.9 + i) * 0.25, z);
            tmp.scale.setScalar(k.current * puls * 0.55);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, steder.length]} frustumCulled={false}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshBasicMaterial color="#fde68a" transparent opacity={0.85} />
        </instancedMesh>
    );
}

const ANDER_FJELL: [number, number, number][] = [
    [-13, 3.6, -5],
    [-17, 5, -7.6],
    [-6, 4, -16],
    [6, 5, -18],
    [-25, 14, -45],
    [18, 12, -50],
    [8.5, 3.6, -12],
    [-3, 2.4, -9],
    [-14.5, 2.2, -3.4],
    [-17, 1.4, -6.8],
    [3, 3.6, -14],
    [12, 4, -16],
    [-9, 3, -12],
    [-35, 12, -50],
    [2, 15, -55],
    [-4, 1.4, 6],
];

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera(
        useMemo(() => kameraFor(modus), [modus]),
        beat,
        playing
    );
    const andStyrke =
        modus === 'fjell'
            ? beat === 2
                ? 0.7
                : beat >= 3
                  ? 1.5
                  : 0
            : modus === 'sieidi'
              ? beat === 1
                  ? 1
                  : beat >= 3
                    ? 0.6
                    : 0
              : 0;
    const iSiida = modus === 'siida';
    return (
        <>
            <color attach="background" args={['#b9d4ea']} />
            <fog attach="fog" args={['#c9dcec', 50, 150]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#e0efff', '#6b7a52', 0.7]} />
            <directionalLight position={[30, 40, 20]} intensity={1.1} color="#fff7e6" />
            {/* Vidda i juni: lyng og gress */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[260, 260]} />
                <meshStandardMaterial color="#8a9a62" />
            </mesh>
            {/* Snøflekker igjen på bakken */}
            {[
                [-8, 10, 3],
                [14, -22, 4],
                [-24, -20, 5],
            ].map(([x, z, r], i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]}>
                    <circleGeometry args={[r, 9]} />
                    <meshStandardMaterial
                        color="#f1f5f9"
                        emissive="#94a3b8"
                        emissiveIntensity={0.25}
                    />
                </mesh>
            ))}
            <Fjellkjede />
            <Skog />
            <Foss playing={playing} />
            <Sieidi gaver={modus === 'sieidi' && beat >= 3} />
            <Lavvu x={LAVVU[0]} z={LAVVU[1]} />
            <Royk x={LAVVU[0]} z={LAVVU[1]} playing={playing} />
            {iSiida && (
                <>
                    <Lavvu x={-6} z={-3} s={0.85} />
                    <Lavvu x={6.5} z={-4} s={0.9} />
                    <mesh position={[0, 0.15, 4.3]}>
                        <coneGeometry args={[0.45, 0.6, 6]} />
                        <meshStandardMaterial
                            color="#f59e0b"
                            emissive="#f97316"
                            emissiveIntensity={1.4}
                        />
                    </mesh>
                    <Person x={0} z={3.0} farge="#1d4ed8" rot={0} tromme />
                    <Person x={-1.5} z={5.7} farge="#b91c1c" rot={2.8} />
                    <Person x={0.2} z={6.0} farge="#047857" rot={3.1} />
                    <Person x={1.8} z={5.6} farge="#a16207" rot={-2.8} />
                    {beat === 2 && (
                        <group position={[2.6, 0.3, 3.4]} rotation={[0, 0, Math.PI / 2]}>
                            <Person x={0} z={0} farge="#7c3aed" />
                        </group>
                    )}
                    {beat !== 2 &&
                        Array.from({ length: 6 }, (_, i) => (
                            <Rein
                                key={i}
                                x={8 + frø(i) * 8}
                                z={-8 - frø(i + 4) * 6}
                                rot={frø(i + 8) * 6}
                            />
                        ))}
                </>
            )}
            {modus === 'bjorn' && (
                <>
                    {beat <= 2 && <Bjorn and={beat === 2 ? 1 : 0} playing={playing} />}
                    {beat === 2 && (
                        <>
                            <Person
                                x={BJORN[0] + 3.4}
                                z={BJORN[1] + 2.6}
                                farge="#b91c1c"
                                rot={-2.2}
                            />
                            <Person
                                x={BJORN[0] + 4.4}
                                z={BJORN[1] + 1.2}
                                farge="#047857"
                                rot={-1.8}
                            />
                        </>
                    )}
                    {beat >= 3 && <Grav />}
                    {beat >= 3 && <Bein />}
                    {beat >= 3 && <Unge playing={playing} />}
                </>
            )}
            <Ander steder={ANDER_FJELL} styrke={andStyrke} playing={playing} />
        </>
    );
}

const LAPPER: Record<Modus, string[]> = {
    fjell: ['Et fjell i Nord-Norge, juni', 'En lavvu', 'Noen ser på deg', 'Naturen var ikke tom'],
    sieidi: [
        'Ingen kirke. Ingen hellig bok.',
        'Alt i naturen har en ånd',
        'Sieidi: en offerstein',
        'Gaver for å takke',
    ],
    siida: [
        'Siida: et lite slektsfellesskap',
        'Noaiden',
        'Reinflokken er borte',
        'Råd om det som skal komme',
    ],
    bjorn: [
        'Bjørnen var hellig',
        'Ikke si navnet',
        'Jegerne ber om unnskyldning',
        'Beina graves ned',
    ],
};

/** Merkelapper i bunnen av bildet, per modus og beat. */
function Lapper({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'sieidi' && beat === 1)
        return (
            <div className="flex gap-3">
                {['fjell', 'stein', 'tre', 'vann'].map((t, i) => (
                    <motion.div
                        key={t}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.6 }}
                        className="px-5 py-2 rounded-xl bg-amber-100 text-slate-900 font-black text-2xl shadow-lg"
                    >
                        {t}
                    </motion.div>
                ))}
            </div>
        );
    if (modus === 'sieidi' && beat === 0)
        return (
            <div className="flex gap-3">
                {['kirke', 'hellig bok', 'prest'].map((t, i) => (
                    <motion.div
                        key={t}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.7 }}
                        className="px-5 py-2 rounded-xl bg-white/95 text-slate-500 font-black text-2xl shadow-lg line-through decoration-red-600 decoration-4"
                    >
                        {t}
                    </motion.div>
                ))}
            </div>
        );
    if (modus === 'siida' && beat === 1) return <Brikke tekst="Litt lege og litt prest" />;
    if (modus === 'siida' && beat === 2)
        return (
            <div className="flex gap-3">
                <Brikke tekst="Noen er syke" />
            </div>
        );
    if (modus === 'bjorn' && beat === 1)
        return (
            <Teller verdi={20} etikett="andre navn på bjørnen" prefiks="ca. " forsinkelse={0.6} />
        );
    if (modus === 'bjorn' && beat === 3) return <Brikke tekst="Så den kan bli født på nytt" />;
    return null;
}

function Brikke({ tekst, forsinkelse = 0.5 }: { tekst: string; forsinkelse?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
            className="px-6 py-3 rounded-2xl bg-amber-100 text-slate-900 font-black text-2xl md:text-3xl shadow-xl whitespace-nowrap"
        >
            {tekst}
        </motion.div>
    );
}

export function SamiskFjellet({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'fjell';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapper = LAPPER[modus];
    const lapp = lapper[Math.min(beat, lapper.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [-4, 9, 40] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[7%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-[8%] left-1/2 -translate-x-1/2"
                >
                    <Lapper modus={modus} beat={beat} />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
