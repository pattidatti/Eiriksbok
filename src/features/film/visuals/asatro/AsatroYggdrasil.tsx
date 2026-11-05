import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Verdenstreet Yggdrasil i 3D, med rikene rundt det. «treet»: asketreet som alltid er grønt.
 * «riker»: de tre røttene, Åsgard øverst, Midgard i midten med muren, verdenshavet og Utgard
 * ytterst, og Helheim under jorda. «balanse»: gudene (orden) lyser, jotnene (kaos) står i
 * Utgard, stormen kommer når balansen tipper, og blotbålet i Midgard. «nornene»: Urds brønn
 * under treet, de tre nornene og trådene de spinner.
 */

type Modus = 'treet' | 'riker' | 'balanse' | 'nornene';

const ASGARD_Y = 23;
const HEL_Y = -10;
const BRONN: [number, number] = [3.2, 2.6];

type Mål = (beat: number, t: number) => { pos: THREE.Vector3; se: THREE.Vector3 };

function kameraFor(modus: Modus): Mål {
    return (beat, t) => {
        if (modus === 'treet') {
            switch (beat) {
                case 0:
                    return { pos: v(6 + t * 0.1, 1.6, 9), se: v(0, 13, 0) };
                case 1:
                    return { pos: v(16 - t * 0.2, 9, 24), se: v(0, 12, 0) };
                default: {
                    const a = 0.7 + t * 0.03;
                    return { pos: v(Math.sin(a) * 46, 14, Math.cos(a) * 46), se: v(0, 5, 0) };
                }
            }
        }
        if (modus === 'riker') {
            switch (beat) {
                case 0:
                    return { pos: v(30, -7, 32), se: v(0, -3.5, 0) };
                case 1:
                    return { pos: v(9, ASGARD_Y + 3, 16), se: v(0, ASGARD_Y, 0) };
                case 2:
                    return { pos: v(10 - t * 0.15, 6, 13), se: v(0, 0.5, 0) };
                case 3:
                    return { pos: v(0, 30, 36), se: v(0, -1, 0) };
                default:
                    return { pos: v(15, HEL_Y + 3.5, 17), se: v(0, HEL_Y + 1, 0) };
            }
        }
        if (modus === 'balanse') {
            switch (beat) {
                case 0:
                    return { pos: v(34, 10, 38), se: v(0, 6, 0) };
                case 1:
                    return { pos: v(10, ASGARD_Y + 2, 15), se: v(0, ASGARD_Y, 0) };
                case 2:
                    return { pos: v(-8, 7, 14), se: v(-17, 3, -2) };
                case 3:
                    return { pos: v(9, 5, 12), se: v(0, 0.8, 0) };
                case 4:
                    return { pos: v(30, 16, 40), se: v(0, 4, 0) };
                default:
                    return { pos: v(3 + t * 0.1, 5, 13), se: v(-4, 0.8, 3) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(12, 7, 15), se: v(0, 4, 0) };
            case 5:
                return { pos: v(22, 17, 38), se: v(0, 18, 0) };
            default:
                return { pos: v(BRONN[0] + 5.5, 4.2, BRONN[1] + 7), se: v(BRONN[0] - 0.4, 1.6, BRONN[1]) };
        }
    };
}

/** Stammen og kronen. Kronen bøyer seg litt i vinden. */
function Treet({ playing }: { playing: boolean }) {
    const krone = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        if (krone.current) krone.current.rotation.z = Math.sin(tid.current * 0.6) * 0.015;
    });
    const greiner = useMemo(
        () =>
            Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2 + 0.3;
                return { a, y: 11 + (i % 3) * 1.5, l: 7 + frø(i) * 2 };
            }),
        []
    );
    const blad = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                const r = i % 2 ? 7 : 4.5;
                return {
                    x: Math.cos(a) * r,
                    z: Math.sin(a) * r,
                    y: 15 + frø(i + 2) * 3 + (i % 2 ? -1 : 1.5),
                    s: 3.2 + frø(i + 5) * 1.6,
                };
            }),
        []
    );
    return (
        <group>
            <mesh position={[0, 8, 0]}>
                <cylinderGeometry args={[0.9, 1.6, 16, 10]} />
                <meshStandardMaterial color="#6b4a2f" flatShading />
            </mesh>
            <group ref={krone}>
                {greiner.map((g, i) => (
                    <mesh
                        key={i}
                        position={[Math.cos(g.a) * g.l * 0.45, g.y + 1.6, Math.sin(g.a) * g.l * 0.45]}
                        rotation={[Math.sin(g.a) * 1.05, 0, -Math.cos(g.a) * 1.05]}
                    >
                        <cylinderGeometry args={[0.25, 0.5, g.l, 6]} />
                        <meshStandardMaterial color="#6b4a2f" flatShading />
                    </mesh>
                ))}
                {blad.map((b, i) => (
                    <mesh key={i} position={[b.x, b.y, b.z]} scale={b.s}>
                        <icosahedronGeometry args={[1, 0]} />
                        <meshStandardMaterial
                            color={i % 3 ? '#3f8f3a' : '#2f7a34'}
                            emissive="#1f4d1c"
                            emissiveIntensity={0.25}
                            flatShading
                        />
                    </mesh>
                ))}
                <mesh position={[0, 19.5, 0]} scale={4}>
                    <icosahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color="#4c9a3f" emissive="#1f4d1c" emissiveIntensity={0.25} flatShading />
                </mesh>
            </group>
        </group>
    );
}

/** De tre røttene, som rør langs en kurve ned under verden. */
function Rotter({ glod }: { glod: number }) {
    const geo = useMemo(() => {
        const baner = [
            [v(0, 0.5, 0), v(0.8, -3, 0.4), v(1.5, -7, 0.6), v(1.2, HEL_Y + 0.4, 0.5)],
            [v(0, 0.5, 0), v(-3, -2.5, 1.5), v(-9, -4.5, 3), v(-15, -3.2, 4.5)],
            [v(0, 0.5, 0), v(2.4, -2.5, -4), v(6, -4.5, -10), v(8.5, -3.2, -14)],
        ];
        return baner.map((p) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 24, 0.55, 6));
    }, []);
    const mat = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    useFrame((_, rawDt) => {
        mat.current.forEach((m) => {
            if (m) m.emissiveIntensity = damp(m.emissiveIntensity, glod, 3, Math.min(rawDt, 0.05));
        });
    });
    return (
        <>
            {geo.map((g, i) => (
                <mesh key={i} geometry={g}>
                    <meshStandardMaterial
                        ref={(m) => {
                            mat.current[i] = m;
                        }}
                        color="#7a5534"
                        emissive="#f59e0b"
                        emissiveIntensity={glod}
                        flatShading
                    />
                </mesh>
            ))}
        </>
    );
}

/** Et lite hus med saltak. */
function Hus({ x, z, rot }: { x: number; z: number; rot: number }) {
    return (
        <group position={[x, 0.3, z]} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[1.6, 0.9, 0.9]} />
                <meshStandardMaterial color="#8b6b4a" flatShading />
            </mesh>
            <mesh position={[0, 1.05, 0]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.75, 0.75, 1]} />
                <meshStandardMaterial color="#4d6b3a" flatShading />
            </mesh>
        </group>
    );
}

/** En jotne: stor, mørk skikkelse av klosser. */
function Jotne({ x, z, s }: { x: number; z: number; s: number }) {
    return (
        <group position={[x, 0, z]} scale={s} rotation={[0, Math.atan2(-x, -z), 0]}>
            <mesh position={[0, 2.2, 0]}>
                <cylinderGeometry args={[0.8, 1.1, 3.6, 7]} />
                <meshStandardMaterial color="#3f4a5a" flatShading />
            </mesh>
            <mesh position={[0, 4.5, 0]}>
                <icosahedronGeometry args={[0.85, 0]} />
                <meshStandardMaterial color="#56637a" flatShading />
            </mesh>
            {[-1, 1].map((k) => (
                <mesh key={k} position={[k * 1.15, 2.4, 0]} rotation={[0, 0, k * 0.25]}>
                    <cylinderGeometry args={[0.3, 0.35, 2.8, 5]} />
                    <meshStandardMaterial color="#3f4a5a" flatShading />
                </mesh>
            ))}
        </group>
    );
}

/** En norne: en enkel kappe med hode, vendt mot brønnen. */
function Norne({ x, z, farge }: { x: number; z: number; farge: string }) {
    const rot = Math.atan2(BRONN[0] - x, BRONN[1] - z);
    return (
        <group position={[x, 0.3, z]} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.75, 0]}>
                <coneGeometry args={[0.45, 1.5, 8]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 1.7, 0]}>
                <sphereGeometry args={[0.24, 10, 8]} />
                <meshStandardMaterial color="#f1d3b3" />
            </mesh>
        </group>
    );
}

const NORNER = [
    { navn: 'Urd', tid: 'fortid', farge: '#7c3aed', a: 2.2 },
    { navn: 'Verdande', tid: 'nåtid', farge: '#0e7490', a: 3.3 },
    { navn: 'Skuld', tid: 'framtid', farge: '#b45309', a: 4.4 },
];
function nornePos(a: number): [number, number] {
    return [BRONN[0] + Math.cos(a) * 1.7, BRONN[1] + Math.sin(a) * 1.7];
}

/** Trådene nornene spinner: lysende linjer som stiger opp fra hver norne. */
function Trader({ vis, playing }: { vis: boolean; playing: boolean }) {
    const grupper = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        grupper.current.forEach((m, i) => {
            if (!m) return;
            const mål = vis ? 1 : 0.001;
            m.scale.y = damp(m.scale.y, mål, 2, dt || 0.05);
            m.rotation.y = tid.current * 0.5 + i;
        });
    });
    return (
        <>
            {NORNER.map((n, i) => {
                const [x, z] = nornePos(n.a);
                return (
                    <mesh
                        key={n.navn}
                        ref={(m) => {
                            grupper.current[i] = m;
                        }}
                        position={[x, 1.9, z]}
                        scale={[1, vis ? 1 : 0.001, 1]}
                    >
                        <cylinderGeometry args={[0.03, 0.03, 3.4, 4]} />
                        <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={1.4} />
                    </mesh>
                );
            })}
        </>
    );
}

/** Mennesker i Midgard: små figurer mellom husene. */
function Folk() {
    const folk = [
        { x: 3.5, z: 4.6, f: '#b91c1c' },
        { x: 4.5, z: 3.9, f: '#1d4ed8' },
        { x: -2.6, z: 5.2, f: '#047857' },
        { x: -3.4, z: 4.3, f: '#a16207' },
        { x: 5.4, z: -0.6, f: '#7c3aed' },
    ];
    return (
        <>
            {folk.map((p, i) => (
                <group key={i} position={[p.x, 0.3, p.z]}>
                    <mesh position={[0, 0.45, 0]}>
                        <coneGeometry args={[0.3, 0.9, 8]} />
                        <meshStandardMaterial color={p.f} flatShading />
                    </mesh>
                    <mesh position={[0, 1.05, 0]}>
                        <sphereGeometry args={[0.17, 10, 8]} />
                        <meshStandardMaterial color="#f1d3b3" />
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** Mørke stormskyer over Utgard når balansen tipper. */
function Storm({ styrke, playing }: { styrke: number; playing: boolean }) {
    const N = 14;
    const ref = useRef<THREE.InstancedMesh>(null);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    const s = useRef(styrke);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        s.current = dt ? damp(s.current, styrke, 1.4, dt) : styrke;
        const m = ref.current;
        if (!m) return;
        for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 1.6 + 1.9 + Math.sin(tid.current * 0.2 + i) * 0.05;
            const r = 15 - s.current * 4 + frø(i) * 4;
            tmp.position.set(Math.cos(a) * r, 8 + frø(i + 3) * 4, Math.sin(a) * r);
            const sk = Math.max(0.001, s.current * (2.6 + frø(i + 7) * 1.6));
            tmp.scale.set(sk * 1.4, sk * 0.6, sk);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#454b5e" flatShading />
        </instancedMesh>
    );
}

/** Blotbålet i Midgard. */
function Baal({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        if (ref.current) ref.current.scale.y = 1 + Math.sin(tid.current * 9) * 0.12;
    });
    return (
        <group position={[-4, 0.3, 3]}>
            <mesh ref={ref} position={[0, 0.5, 0]}>
                <coneGeometry args={[0.45, 1.1, 7]} />
                <meshStandardMaterial color="#f59e0b" emissive="#f97316" emissiveIntensity={1.6} />
            </mesh>
            <pointLight color="#fb923c" intensity={30} distance={10} position={[0, 1.4, 0]} />
            {[0, 1.6, 3.2, 4.8].map((a) => (
                <mesh key={a} position={[Math.cos(a) * 1.3, 0.55, Math.sin(a) * 1.3]}>
                    <coneGeometry args={[0.3, 1.1, 6]} />
                    <meshStandardMaterial color="#9f1239" flatShading />
                </mesh>
            ))}
        </group>
    );
}

interface Tilstand {
    himmel: string;
    asgard: number;
    utgard: number;
    rotter: number;
    storm: number;
}

function tilstand(modus: Modus, beat: number): Tilstand {
    const t: Tilstand = { himmel: '#b9d3ec', asgard: 0.3, utgard: 0, rotter: 0, storm: 0 };
    if (modus === 'riker') {
        if (beat === 0) t.rotter = 0.9;
        if (beat === 1) t.asgard = 1.2;
        if (beat === 4) t.himmel = '#8b9ab3';
    }
    if (modus === 'balanse') {
        if (beat === 1) t.asgard = 1.4;
        if (beat === 2) t.utgard = 0.35;
        if (beat >= 4) {
            t.himmel = beat === 4 ? '#5d6478' : '#8a93a8';
            t.storm = beat === 4 ? 1 : 0.6;
            t.utgard = 0.35;
        }
    }
    if (modus === 'nornene') {
        t.himmel = beat === 5 ? '#7b86a3' : '#93a7c4';
        if (beat === 5) t.asgard = 1.2;
    }
    return t;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera(useMemo(() => kameraFor(modus), [modus]), beat, playing);
    const t = tilstand(modus, beat);
    const himmel = useRef<THREE.Color>(null);
    const tåke = useRef<THREE.Fog>(null);
    const asgardMat = useRef<THREE.MeshStandardMaterial>(null);
    const utgardMat = useRef<THREE.MeshStandardMaterial>(null);
    const forste = useRef(true);
    const målHimmel = useMemo(() => new THREE.Color(t.himmel), [t.himmel]);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const k = forste.current ? 1 : 1 - Math.exp(-1.6 * dt);
        forste.current = false;
        himmel.current?.lerp(målHimmel, k);
        tåke.current?.color.lerp(målHimmel, k);
        if (asgardMat.current)
            asgardMat.current.emissiveIntensity = THREE.MathUtils.lerp(asgardMat.current.emissiveIntensity, t.asgard, k);
        if (utgardMat.current)
            utgardMat.current.emissiveIntensity = THREE.MathUtils.lerp(utgardMat.current.emissiveIntensity, t.utgard, k);
    });

    const hus = useMemo(
        () =>
            Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2 + 0.6;
                const r = 4.6 + frø(i) * 1.6;
                return { x: Math.cos(a) * r, z: Math.sin(a) * r, rot: frø(i + 9) * 3 };
            }).filter((h) => Math.hypot(h.x - BRONN[0], h.z - BRONN[1]) > 3),
        []
    );
    const fjell = useMemo(
        () =>
            Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2 + frø(i) * 0.3;
                const r = 17.5 + frø(i + 1) * 2.5;
                return { x: Math.cos(a) * r, z: Math.sin(a) * r, h: 3 + frø(i + 4) * 4, r: 1.6 + frø(i + 6) };
            }),
        []
    );
    const bølge = useRef<THREE.Mesh>(null);
    useLayoutEffect(() => {
        if (bølge.current) bølge.current.rotation.x = -Math.PI / 2;
    }, []);

    const iNornene = modus === 'nornene';
    return (
        <>
            <color ref={himmel} attach="background" args={[t.himmel]} />
            <fog ref={tåke} attach="fog" args={[t.himmel, 60, 140]} />
            <hemisphereLight args={['#f1f5f9', '#4b5563', 1.3]} />
            <directionalLight position={[20, 30, 15]} intensity={1.6} />
            <directionalLight position={[-20, -10, -10]} intensity={0.4} />

            {/* Utgard: den ytre ringen med mørke fjell */}
            <mesh position={[0, -0.6, 0]}>
                <cylinderGeometry args={[21, 21, 0.6, 48]} />
                <meshStandardMaterial
                    ref={utgardMat}
                    color="#5b5f6b"
                    emissive="#450a0a"
                    emissiveIntensity={0}
                    flatShading
                />
            </mesh>
            {fjell.map((f, i) => (
                <mesh key={i} position={[f.x, f.h / 2 - 0.3, f.z]}>
                    <coneGeometry args={[f.r, f.h, 6]} />
                    <meshStandardMaterial color="#4a4f5c" flatShading />
                </mesh>
            ))}
            {/* Verdenshavet */}
            <mesh ref={bølge} position={[0, -0.25, 0]}>
                <ringGeometry args={[7.9, 15.5, 48]} />
                <meshStandardMaterial color="#2f74b5" emissive="#1e4f80" emissiveIntensity={0.45} />
            </mesh>
            {/* Midgard med muren */}
            <mesh position={[0, -0.05, 0]}>
                <cylinderGeometry args={[8, 8.2, 0.7, 40]} />
                <meshStandardMaterial color="#6e9f4f" flatShading />
            </mesh>
            <mesh position={[0, 0.65, 0]}>
                <cylinderGeometry args={[7.75, 7.75, 0.75, 40, 1, true]} />
                <meshStandardMaterial color="#8a7356" side={THREE.DoubleSide} flatShading />
            </mesh>
            {hus.map((h, i) => (
                <Hus key={i} x={h.x} z={h.z} rot={h.rot} />
            ))}

            {/* Åsgard høyt oppe */}
            <group position={[0, ASGARD_Y, 0]}>
                <mesh>
                    <cylinderGeometry args={[5, 4, 1, 24]} />
                    <meshStandardMaterial
                        ref={asgardMat}
                        color="#e8d6a0"
                        emissive="#fbbf24"
                        emissiveIntensity={0.3}
                        flatShading
                    />
                </mesh>
                <mesh position={[0, 1.3, 0]}>
                    <boxGeometry args={[3.6, 1.6, 2]} />
                    <meshStandardMaterial color="#f5e7b8" flatShading />
                </mesh>
                <mesh position={[0, 2.5, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[1.6, 1.6, 2.1]} />
                    <meshStandardMaterial color="#d4a017" emissive="#b45309" emissiveIntensity={0.3} flatShading />
                </mesh>
            </group>

            {/* Helheim under jorda */}
            <group position={[0, HEL_Y, 0]}>
                <mesh>
                    <cylinderGeometry args={[6, 5, 1, 24]} />
                    <meshStandardMaterial color="#47506a" emissive="#1e293b" emissiveIntensity={0.4} flatShading />
                </mesh>
                <mesh position={[-1.8, 1.4, 0]}>
                    <boxGeometry args={[0.6, 2.2, 0.6]} />
                    <meshStandardMaterial color="#2b3142" flatShading />
                </mesh>
                <mesh position={[1.8, 1.4, 0]}>
                    <boxGeometry args={[0.6, 2.2, 0.6]} />
                    <meshStandardMaterial color="#2b3142" flatShading />
                </mesh>
                <mesh position={[0, 2.7, 0]}>
                    <boxGeometry args={[4.4, 0.5, 0.7]} />
                    <meshStandardMaterial color="#2b3142" flatShading />
                </mesh>
                <pointLight color="#93c5fd" intensity={25} distance={12} position={[0, 3, 3]} />
            </group>

            <Treet playing={playing} />
            <Rotter glod={t.rotter} />

            {/* Urds brønn */}
            <group position={[BRONN[0], 0.3, BRONN[1]]}>
                <mesh position={[0, 0.25, 0]}>
                    <cylinderGeometry args={[0.95, 1, 0.5, 16, 1, true]} />
                    <meshStandardMaterial color="#9ca3af" side={THREE.DoubleSide} flatShading />
                </mesh>
                <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.92, 16]} />
                    <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.8} />
                </mesh>
            </group>
            {iNornene &&
                NORNER.map((n) => {
                    const [x, z] = nornePos(n.a);
                    return <Norne key={n.navn} x={x} z={z} farge={n.farge} />;
                })}
            {iNornene && <Trader vis={beat >= 4} playing={playing} />}
            {iNornene && beat === 3 && <NyttLiv playing={playing} />}

            {modus === 'balanse' && (
                <>
                    <Jotne x={-17} z={-3} s={1.2} />
                    <Jotne x={-16} z={4} s={1} />
                    <Jotne x={-12.5} z={-12} s={1.1} />
                </>
            )}
            {modus === 'balanse' && beat >= 5 && <Baal playing={playing} />}
            {modus === 'balanse' && beat === 3 && <Folk />}
            <Storm styrke={t.storm} playing={playing} />

            <Merker modus={modus} beat={beat} />
        </>
    );
}

function Merke({ pos, tekst, under, farge = 'bg-white/95 text-slate-900' }: { pos: [number, number, number]; tekst: string; under?: string; farge?: string }) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div className={`px-4 py-1.5 rounded-xl shadow-lg text-center whitespace-nowrap ${farge}`}>
                <div className="font-black text-2xl">{tekst}</div>
                {under && <div className="font-bold text-lg opacity-80">{under}</div>}
            </div>
        </Html>
    );
}

/** Merkelapper i 3D der rikene ligger. Vises bare i beatene der kameraet ser dem. */
function Merker({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'riker') {
        if (beat === 2) return <Merke pos={[4.7, 0.6, 6.2]} tekst="muren rundt Midgard" farge="bg-amber-100 text-slate-900" />;
        if (beat === 3)
            return (
                <>
                    <Merke pos={[0, 2, 0]} tekst="Midgard" />
                    <Merke pos={[0, 1.2, 11.8]} tekst="verdenshavet" farge="bg-sky-100 text-slate-900" />
                    <Merke pos={[0, 1.5, 19]} tekst="Utgard" farge="bg-slate-800 text-white" />
                </>
            );
    }
    return null;
}

/** Barnet som blir født: et lite lys som stiger opp av brønnen. */
function NyttLiv({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        if (ref.current) ref.current.position.y = 2.1 + Math.sin(tid.current * 1.5) * 0.15;
    });
    return (
        <mesh ref={ref} position={[BRONN[0], 2.1, BRONN[1]]}>
            <sphereGeometry args={[0.32, 16, 12]} />
            <meshStandardMaterial color="#fff7ed" emissive="#fde68a" emissiveIntensity={2} />
        </mesh>
    );
}

/** Nornenes navn i en rad nederst i bildet, i samme farge som kappene. */
function NorneNavn({ beat }: { beat: number }) {
    if (beat < 2 || beat > 4) return null;
    return (
        <div className="absolute bottom-[6%] inset-x-0 flex justify-center gap-4 pointer-events-none">
            {NORNER.map((n) => (
                <div
                    key={n.navn}
                    className="px-5 py-2 rounded-2xl bg-white/95 shadow-xl text-center"
                    style={{ borderBottom: `8px solid ${n.farge}` }}
                >
                    <div className="font-black text-3xl text-slate-900">{n.navn}</div>
                    {beat === 2 && <div className="font-bold text-2xl text-slate-600">{n.tid}</div>}
                </div>
            ))}
        </div>
    );
}

const LAPPER: Record<Modus, string[]> = {
    treet: ['Et tre over hele verden', 'Yggdrasil: alltid grønt', 'I sentrum av alt'],
    riker: [
        'Tre røtter, flere riker',
        'Åsgard: gudenes hjem',
        'Midgard: menneskenes verden',
        'Utgard: jotnenes hjem',
        'Helheim: dødsriket',
    ],
    balanse: [
        'Balanse',
        'Gudene: orden',
        'Jotnene: kaos',
        'Menneskene: midt imellom',
        'Balansen tipper: ragnarok',
        'Menneskene ofrer',
    ],
    nornene: [
        'Skjebnen',
        'Urds brønn',
        'Fortid, nåtid, framtid',
        'Et barn blir født: skjebnen avgjøres',
        'Runer i treverk, eller tråder',
        'Ikke engang gudene',
    ],
};

export function AsatroYggdrasil({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'treet';
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
                camera={{ fov: 42, near: 0.3, far: 300, position: [30, 10, 30] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            {modus === 'nornene' && <NorneNavn beat={beat} />}
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] inset-x-0 flex justify-center pointer-events-none"
                >
                    <div className="px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-3xl md:text-4xl shadow-xl whitespace-nowrap">
                        {lapp}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
