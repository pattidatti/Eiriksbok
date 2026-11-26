import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Et landskap i skumring med to veier, i fire modus:
 * - start: to familier. En grav (islam, vendt mot Mekka) og et bål ved en elv (hinduisme).
 * - former: linja og ringen sett ovenfra. Linja ender i en port, ringen tar aldri slutt.
 * - linje: vi går linja: døden, ventetiden, dommen og det som varer for alltid.
 * - ring: samsara. Et lys går rundt og rundt, drevet av karma, uten noen dommer.
 */

type Modus = 'start' | 'former' | 'linje' | 'ring';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

// Plassene i landskapet.
const LINJE_X = -10;
const GRAV: [number, number, number] = [LINJE_X, 0, 8];
const STOPP_Z = [8, -3, -14, -26];
const RING_SENTER: [number, number, number] = [11, 0, -10];
const RING_R = 7;
const BAL: [number, number, number] = [18, 0, 6];
const ELV_X = 24;

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'start') {
        switch (beat) {
            case 1:
                return { pos: v(-3, 6.5, 21), se: v(-10, 0.3, 8) };
            case 2:
                return { pos: v(12, 6.5, 19), se: v(20, 0.5, 5) };
            default:
                return { pos: v(4 + t * 0.15, 13, 36), se: v(4, 0, 6) };
        }
    }
    if (modus === 'former') {
        switch (beat) {
            case 1:
                return { pos: v(-38, 24, -9), se: v(-10, 0, -9) };
            case 2:
                return { pos: v(24, 15, 10), se: v(11, 0, -10) };
            default:
                return { pos: v(1, 30, 30), se: v(1, 0, -9) };
        }
    }
    if (modus === 'linje') {
        const z = STOPP_Z[Math.min(beat, 3)];
        return { pos: v(-19, 5.5 + beat * 0.4, z + 9), se: v(LINJE_X, 1.5 + beat * 0.3, z - 1) };
    }
    switch (beat) {
        case 0:
            return { pos: v(11, 18, 12), se: v(11, 0, -10) };
        case 4:
            return { pos: v(0, 22, 26), se: v(1, 0, -10) };
        case 5:
            return { pos: v(11, 13, 9), se: v(11, 0, -10) };
        default:
            return { pos: v(23, 10, 6), se: v(11, 0, -10) };
    }
}

function Etikett({
    tekst,
    farge = '#0f172a',
    liten,
}: {
    tekst: string;
    farge?: string;
    liten?: boolean;
}) {
    return (
        <div
            className={`whitespace-nowrap rounded-xl bg-white/95 px-3 py-1 font-bold shadow-lg ${liten ? 'text-xl' : 'text-2xl'}`}
            style={{ color: farge }}
        >
            {tekst}
        </div>
    );
}

/** Steinheller langs linja. */
function LinjeSteiner({ lys }: { lys: number }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const antall = 26;
    useEffect(() => {
        const m = new THREE.Matrix4();
        for (let i = 0; i < antall; i++) {
            m.compose(
                v(LINJE_X + ((i * 37) % 5) * 0.06 - 0.12, 0.05, 11 - i * 1.5),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (i % 3) * 0.12, 0)),
                v(1, 1, 1)
            );
            ref.current?.setMatrixAt(i, m);
        }
        if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }, []);
    useFrame((_, dt) => {
        if (mat.current)
            mat.current.emissiveIntensity = damp(
                mat.current.emissiveIntensity,
                lys,
                2,
                Math.min(dt, 0.05)
            );
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
            <boxGeometry args={[2.2, 0.12, 1.2]} />
            <meshStandardMaterial
                ref={mat}
                color="#a8a29e"
                emissive="#fbbf24"
                emissiveIntensity={0}
            />
        </instancedMesh>
    );
}

/** Steinringen. */
function RingSteiner({ lys }: { lys: number }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const antall = 32;
    useEffect(() => {
        const m = new THREE.Matrix4();
        for (let i = 0; i < antall; i++) {
            const a = (i / antall) * Math.PI * 2;
            m.compose(
                v(
                    RING_SENTER[0] + Math.cos(a) * RING_R,
                    0.05,
                    RING_SENTER[2] + Math.sin(a) * RING_R
                ),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, 0)),
                v(1, 1, 1)
            );
            ref.current?.setMatrixAt(i, m);
        }
        if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }, []);
    useFrame((_, dt) => {
        if (mat.current)
            mat.current.emissiveIntensity = damp(
                mat.current.emissiveIntensity,
                lys,
                2,
                Math.min(dt, 0.05)
            );
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
            <boxGeometry args={[1.0, 0.12, 1.9]} />
            <meshStandardMaterial
                ref={mat}
                color="#a8a29e"
                emissive="#f59e0b"
                emissiveIntensity={0}
            />
        </instancedMesh>
    );
}

/** Graven: en åpen grav, en jordhaug, en stein og en pil mot Mekka. */
function Grav({ svopt, mekka, glod }: { svopt: boolean; mekka: boolean; glod: boolean }) {
    const [x, , z] = GRAV;
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.4, 4.2]} />
                <meshStandardMaterial color="#1c1410" />
            </mesh>
            <mesh position={[2.3, 0.35, 0]} scale={[1, 0.5, 1.6]}>
                <sphereGeometry args={[1.2, 24, 12]} />
                <meshStandardMaterial color="#6b4a2f" />
            </mesh>
            <mesh position={[0, 0.9, -2.6]}>
                <boxGeometry args={[1.6, 1.8, 0.3]} />
                <meshStandardMaterial
                    color="#d6d3d1"
                    emissive="#fde68a"
                    emissiveIntensity={glod ? 0.5 : 0}
                />
            </mesh>
            {svopt && (
                <mesh position={[0, 0.25, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                    <capsuleGeometry args={[0.45, 2.4, 8, 16]} />
                    <meshStandardMaterial
                        color="#f8fafc"
                        emissive="#e2e8f0"
                        emissiveIntensity={0.25}
                    />
                </mesh>
            )}
            {mekka && (
                <group position={[-2.6, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <mesh position={[0, 0, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[0.5, 2.2]} />
                        <meshStandardMaterial
                            color="#10b981"
                            emissive="#10b981"
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                    <mesh position={[0, 0.05, -2]} rotation={[-Math.PI / 2, 0, 0]}>
                        <coneGeometry args={[0.7, 1.2, 3]} />
                        <meshStandardMaterial
                            color="#10b981"
                            emissive="#10b981"
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
}

/** Bålet ved elva. Flammene blafrer bare når filmen spiller. */
function Bal({ brenner, playing, stige }: { brenner: boolean; playing: boolean; stige: boolean }) {
    const flammer = useRef<THREE.Group>(null);
    const soyle = useRef<THREE.Mesh>(null);
    const t = useRef(0);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        t.current += dt;
        if (flammer.current) {
            const s = brenner ? 1 + (playing ? Math.sin(t.current * 9) * 0.08 : 0) : 0.001;
            flammer.current.scale.set(1, s, 1);
        }
        if (soyle.current) {
            const m = soyle.current.material as THREE.MeshBasicMaterial;
            m.opacity = damp(m.opacity, stige ? 0.35 : 0, 1.5, Math.min(raw, 0.05));
        }
    });
    const [x, , z] = BAL;
    return (
        <group position={[x, 0, z]}>
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    position={[0, 0.25 + i * 0.4, 0]}
                    rotation={[0, (i % 2) * (Math.PI / 2), Math.PI / 2]}
                >
                    <cylinderGeometry args={[0.2, 0.2, 3, 8]} />
                    <meshStandardMaterial color="#78350f" />
                </mesh>
            ))}
            <group ref={flammer} position={[0, 1.6, 0]}>
                <mesh position={[0, 0.9, 0]}>
                    <coneGeometry args={[1.1, 2.4, 10]} />
                    <meshBasicMaterial color="#f97316" transparent opacity={0.9} />
                </mesh>
                <mesh position={[0.3, 0.6, 0.2]}>
                    <coneGeometry args={[0.6, 1.6, 8]} />
                    <meshBasicMaterial color="#fde047" />
                </mesh>
            </group>
            {brenner && (
                <pointLight position={[0, 3, 0]} color="#fb923c" intensity={30} distance={18} />
            )}
            <mesh ref={soyle} position={[0, 9, 0]}>
                <cylinderGeometry args={[0.6, 1.2, 14, 16, 1, true]} />
                <meshBasicMaterial
                    color="#fde68a"
                    transparent
                    opacity={0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

/** Stoppene langs linja: timeglass for ventetiden, en vekt for dommen, en lysende port. */
function LinjeStopp({ tent }: { tent: number }) {
    const port = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (port.current)
            port.current.emissiveIntensity = damp(
                port.current.emissiveIntensity,
                tent >= 4 ? 1.6 : 0.15,
                1.5,
                Math.min(dt, 0.05)
            );
    });
    const lyser = (i: number) => (tent > i ? 0.9 : 0);
    return (
        <group>
            {/* Ventetiden: et timeglass */}
            <group position={[LINJE_X - 2.4, 0, STOPP_Z[1]]}>
                <mesh position={[0, 1.2, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.7, 1.2, 16]} />
                    <meshStandardMaterial
                        color="#e7e5e4"
                        emissive="#fbbf24"
                        emissiveIntensity={lyser(1)}
                    />
                </mesh>
                <mesh position={[0, 2.4, 0]}>
                    <coneGeometry args={[0.7, 1.2, 16]} />
                    <meshStandardMaterial
                        color="#e7e5e4"
                        emissive="#fbbf24"
                        emissiveIntensity={lyser(1)}
                    />
                </mesh>
                <mesh position={[0, 0.3, 0]}>
                    <cylinderGeometry args={[0.9, 0.9, 0.2, 16]} />
                    <meshStandardMaterial color="#57534e" />
                </mesh>
            </group>
            {/* Dommen: en vekt */}
            <group position={[LINJE_X - 2.6, 0, STOPP_Z[2]]}>
                <mesh position={[0, 1.6, 0]}>
                    <cylinderGeometry args={[0.12, 0.18, 3.2, 8]} />
                    <meshStandardMaterial
                        color="#a16207"
                        emissive="#fbbf24"
                        emissiveIntensity={lyser(2)}
                    />
                </mesh>
                <mesh position={[0, 3.2, 0]}>
                    <boxGeometry args={[3.2, 0.14, 0.14]} />
                    <meshStandardMaterial
                        color="#a16207"
                        emissive="#fbbf24"
                        emissiveIntensity={lyser(2)}
                    />
                </mesh>
                {[-1.5, 1.5].map((dx) => (
                    <mesh key={dx} position={[dx, 2.2, 0]}>
                        <cylinderGeometry args={[0.6, 0.4, 0.16, 16]} />
                        <meshStandardMaterial
                            color="#ca8a04"
                            emissive="#fbbf24"
                            emissiveIntensity={lyser(2)}
                        />
                    </mesh>
                ))}
            </group>
            {/* Det evige: en port av lys */}
            <mesh position={[LINJE_X, 0, STOPP_Z[3] - 2]}>
                <torusGeometry args={[3, 0.35, 12, 32, Math.PI]} />
                <meshStandardMaterial
                    ref={port}
                    color="#fef3c7"
                    emissive="#fde68a"
                    emissiveIntensity={0.15}
                />
            </mesh>
        </group>
    );
}

/** Lyset som går rundt i ringen. */
function RingLys({
    aktiv,
    playing,
    sterk,
    bolge,
}: {
    aktiv: boolean;
    playing: boolean;
    sterk: boolean;
    bolge: boolean;
}) {
    const ref = useRef<THREE.Mesh>(null);
    const vinkel = useRef(Math.PI / 2);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        vinkel.current += dt * 0.7;
        if (!ref.current) return;
        const a = vinkel.current;
        ref.current.position.set(
            RING_SENTER[0] + Math.cos(a) * RING_R,
            0.9 + (bolge ? Math.sin(a * 3) * 1.6 + 1.6 : 0),
            RING_SENTER[2] + Math.sin(a) * RING_R
        );
        const s = damp(
            ref.current.scale.x,
            aktiv ? (sterk ? 1.6 : 1) : 0.001,
            3,
            Math.min(raw, 0.05)
        );
        ref.current.scale.setScalar(s);
    });
    return (
        <mesh ref={ref} scale={0.001}>
            <sphereGeometry args={[0.6, 32, 24]} />
            <meshBasicMaterial color="#fde68a" />
        </mesh>
    );
}

function Traer() {
    const plasser = useMemo(
        () => [
            [-15, 4],
            [-15, -8],
            [-15, -20],
            [-15, -32],
            [-5, 2],
            [-5, -12],
            [-5, -24],
            [2, -26],
            [20, -24],
            [26, -16],
            [-20, 14],
            [30, -4],
        ],
        []
    );
    return (
        <group>
            {plasser.map(([x, z], i) => (
                <mesh key={i} position={[x, 3, z]}>
                    <coneGeometry args={[0.9, 6 + (i % 3), 8]} />
                    <meshStandardMaterial color="#1f3b2a" />
                </mesh>
            ))}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const forste = useRef(true);
    const beatTid = useRef(0);
    const forrigeBeat = useRef(beat);
    const se = useRef(v(0, 0, 0));
    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (forrigeBeat.current !== beat) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mal = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        se.current.lerp(mal.se, k);
        camera.lookAt(se.current);
    });

    const linjeLys =
        modus === 'former' ? (beat === 1 || beat === 3 ? 0.8 : 0.1) : modus === 'linje' ? 0.5 : 0;
    const ringLys = modus === 'former' ? (beat >= 2 ? 0.8 : 0.1) : modus === 'ring' ? 0.7 : 0;
    const tent =
        modus === 'linje' ? beat + 1 : modus === 'former' && (beat === 1 || beat === 3) ? 4 : 0;

    return (
        <>
            <color attach="background" args={['#3b4a6b']} />
            <fog attach="fog" args={['#3b4a6b', 40, 120]} />
            <hemisphereLight args={['#c7d2fe', '#1e293b', 1.1]} />
            <directionalLight position={[-20, 30, 20]} intensity={1.2} color="#e0e7ff" />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}>
                <planeGeometry args={[160, 160]} />
                <meshStandardMaterial color="#3f5a3c" emissive="#1a2a1a" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ELV_X, 0.02, -10]}>
                <planeGeometry args={[5, 160]} />
                <meshStandardMaterial color="#3b82c4" emissive="#1e4f80" emissiveIntensity={0.8} />
            </mesh>
            <Traer />
            <LinjeSteiner lys={linjeLys} />
            <RingSteiner lys={ringLys} />
            <Grav
                svopt={modus === 'start' && beat >= 1}
                mekka={modus === 'start' && beat >= 1}
                glod={modus === 'start' && beat === 4}
            />
            <Bal
                brenner={modus === 'start' && beat >= 2}
                playing={playing}
                stige={modus === 'start' && beat === 4}
            />
            <LinjeStopp tent={tent} />
            <RingLys
                aktiv={(modus === 'former' && beat >= 2) || (modus === 'ring' && beat >= 1)}
                playing={playing}
                bolge={modus === 'ring' && beat === 3}
                sterk={modus === 'ring' && beat === 5}
            />
            <Merker modus={modus} beat={beat} />
        </>
    );
}

/** Merkelapper som står fast i landskapet. */
function Merker({ modus, beat }: { modus: Modus; beat: number }) {
    const [rx, , rz] = RING_SENTER;
    if (modus === 'start') {
        return (
            <>
                {beat === 1 && (
                    <Html position={[GRAV[0] - 4.6, 0.5, GRAV[2] + 0.6]} center>
                        <Etikett tekst="mot Mekka" farge="#047857" liten />
                    </Html>
                )}
                {(beat === 0 || beat >= 3) && (
                    <>
                        <Html position={[GRAV[0], 4.2, GRAV[2] - 2.6]} center>
                            <Etikett
                                tekst={
                                    beat === 4
                                        ? 'klar til dommens dag'
                                        : beat === 3
                                          ? 'helst innen ett døgn'
                                          : 'Islam'
                                }
                                farge="#047857"
                            />
                        </Html>
                        <Html position={[BAL[0] - (beat === 4 ? 6 : 0), 5.4, BAL[2]]} center>
                            <Etikett
                                tekst={
                                    beat === 4
                                        ? 'et sted sjelen bodde en stund'
                                        : beat === 3
                                          ? 'helst samme dag'
                                          : 'Hinduisme'
                                }
                                farge="#be185d"
                            />
                        </Html>
                    </>
                )}
                {beat === 2 && (
                    <Html position={[ELV_X, 0.5, BAL[2] - 4]} center>
                        <Etikett tekst="rennende vann" farge="#1d4ed8" liten />
                    </Html>
                )}
            </>
        );
    }
    if (modus === 'former') {
        return (
            <>
                {(beat === 0 || beat === 3) && (
                    <>
                        <Html position={[LINJE_X - 4.5, 0.5, -1]} center>
                            <Etikett
                                tekst={beat === 3 ? 'Hvor havner jeg?' : 'linja'}
                                farge="#92400e"
                            />
                        </Html>
                        <Html position={[rx, 0.5, rz + RING_R + 2.5]} center>
                            <Etikett
                                tekst={beat === 3 ? 'Hvordan kommer jeg ut?' : 'ringen'}
                                farge="#9a3412"
                            />
                        </Html>
                    </>
                )}
                {beat === 1 && (
                    <>
                        <Html position={[LINJE_X - 2.6, 4.6, STOPP_Z[2]]} center>
                            <Etikett tekst="oppgjør" farge="#92400e" />
                        </Html>
                        <Html position={[LINJE_X, 4.6, STOPP_Z[3] - 2]} center>
                            <Etikett tekst="varer for alltid" farge="#92400e" />
                        </Html>
                    </>
                )}
                {beat === 2 && (
                    <Html position={[rx, 0.5, rz]} center>
                        <Etikett tekst="ingen slutt" farge="#9a3412" />
                    </Html>
                )}
            </>
        );
    }
    if (modus === 'linje') {
        const navn = ['1 Døden', '2 Ventetiden', '3 Dommen', '4 For alltid'];
        const pos: [number, number, number][] = [
            [LINJE_X + 0.5, 3.4, STOPP_Z[0] - 2.6],
            [LINJE_X - 2.4, 4.0, STOPP_Z[1]],
            [LINJE_X - 2.6, 4.6, STOPP_Z[2]],
            [LINJE_X, 4.8, STOPP_Z[3] - 2],
        ];
        const i = Math.min(beat, 3);
        return (
            <Html position={pos[i]} center>
                <Etikett tekst={navn[i]} farge="#92400e" />
            </Html>
        );
    }
    // ring
    if (beat === 1)
        return (
            <>
                <Html position={[rx, 0.5, rz + RING_R + 1.6]} center>
                    <Etikett tekst="født" farge="#9a3412" />
                </Html>
                <Html position={[rx - RING_R - 2, 0.5, rz]} center>
                    <Etikett tekst="dør" farge="#9a3412" />
                </Html>
                <Html position={[rx, 0.5, rz - RING_R - 1.6]} center>
                    <Etikett tekst="født på nytt" farge="#9a3412" />
                </Html>
            </>
        );
    if (beat === 4)
        return (
            <>
                <Html position={[LINJE_X - 2.6, 4.8, STOPP_Z[2]]} center>
                    <Etikett tekst="linja: en dommer" farge="#92400e" liten />
                </Html>
                <Html position={[rx, 0.5, rz]} center>
                    <Etikett tekst="ringen: ingen dommer" farge="#9a3412" />
                </Html>
            </>
        );
    return null;
}

const OVERSKRIFT: Record<Modus, string[]> = {
    start: [
        'To familier',
        'Islam: begravet',
        'Hinduisme: brent',
        'Begge har det travelt',
        'Motsatte grunner',
    ],
    former: ['Hvordan går tiden?', 'Tiden som en linje', 'Tiden som en ring', 'To spørsmål'],
    linje: ['Linja: fire stopp', 'Linja: fire stopp', 'Linja: fire stopp', 'Linja: fire stopp'],
    ring: [
        'Ringen',
        'Samsara: kretsløpet',
        'Karma: handling',
        'Bedre eller verre',
        'Ingen dommer',
        'Buddhismen',
    ],
};

function Kort({ modus, beat }: { modus: Modus; beat: number }) {
    let innhold: React.ReactNode = null;
    if (modus === 'start' && beat === 1)
        innhold = (
            <>
                <div className="text-2xl font-bold text-slate-700">vasket</div>
                <div className="text-2xl font-bold text-slate-700">svøpt i hvitt</div>
                <div className="text-2xl font-bold text-slate-700">vendt mot Mekka</div>
                <div className="text-3xl font-black text-emerald-700 mt-2">
                    helst innen ett døgn
                </div>
            </>
        );
    if (modus === 'start' && beat === 2)
        innhold = (
            <>
                <div className="text-2xl font-bold text-slate-700">kroppen brennes</div>
                <div className="text-2xl font-bold text-slate-700">asken i rennende vann</div>
                <div className="text-3xl font-black text-pink-700 mt-2">helst samme dag</div>
            </>
        );
    if (modus === 'linje' && beat === 1)
        innhold = (
            <div className="text-2xl font-bold text-slate-700">
                Hvor lang? Tradisjonene svarer ulikt.
            </div>
        );
    if (modus === 'linje' && beat === 2)
        innhold = (
            <>
                <div className="text-2xl font-bold text-slate-700">
                    Gud dømmer mellom gode og onde
                </div>
                <div className="text-2xl font-black text-amber-800 mt-2">
                    Kristendommen: Jesus dømmer alle
                </div>
            </>
        );
    if (modus === 'linje' && beat === 3)
        innhold = (
            <>
                <div className="text-3xl font-black text-amber-800">paradis</div>
                <div className="text-2xl font-bold text-slate-700 mt-1">
                    samme ord i alle tre, men beskrevet ulikt
                </div>
            </>
        );
    if (modus === 'ring' && beat === 0)
        innhold = (
            <>
                <div className="text-2xl font-bold text-slate-700">hinduismen</div>
                <div className="text-2xl font-bold text-slate-700">buddhismen</div>
                <div className="text-2xl font-bold text-slate-700">sikhismen</div>
                <div className="text-2xl font-black text-orange-800 mt-2">
                    døden: en dør inn i neste liv
                </div>
            </>
        );
    if (modus === 'ring' && beat === 2)
        innhold = (
            <>
                <div className="text-3xl font-black text-orange-800">karma = handling</div>
                <div className="text-2xl font-bold text-slate-700 mt-1">
                    det du gjør, får følger
                </div>
            </>
        );
    if (modus === 'ring' && beat === 3)
        innhold = (
            <>
                <div className="text-2xl font-black text-teal-700">
                    ↑ gode handlinger: bedre neste fødsel
                </div>
                <div className="text-2xl font-black text-red-700 mt-1">
                    ↓ dårlige handlinger: verre neste fødsel
                </div>
                <div className="text-2xl font-bold text-slate-600 mt-2">
                    ingen av delene varer for alltid
                </div>
            </>
        );
    if (modus === 'ring' && beat === 4)
        innhold = (
            <div className="text-3xl font-black text-orange-800">Karma virker helt av seg selv</div>
        );
    if (modus === 'ring' && beat === 5)
        innhold = (
            <>
                <div className="text-2xl font-black text-orange-800">Buddhismen:</div>
                <div className="text-2xl font-bold text-slate-700">
                    Det du mente med handlingen teller,
                </div>
                <div className="text-2xl font-bold text-slate-700">ikke bare det du gjorde.</div>
            </>
        );
    if (!innhold) return null;
    return (
        <motion.div
            key={`${modus}-${beat}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-4"
            style={{ right: '3%', bottom: '6%', maxWidth: '40%' }}
        >
            {innhold}
        </motion.div>
    );
}

export function DodenVeiene({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'start';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 300, position: [4, 13, 36] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                <Kort modus={modus} beat={beat} />
            </AnimatePresence>
            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '4%' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
