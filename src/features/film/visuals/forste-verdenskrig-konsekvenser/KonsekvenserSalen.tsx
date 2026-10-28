import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, useKamera, v } from './felles3d';

/**
 * Speilsalen i Versailles, bygd av enkle former: speil på den ene veggen, vinduer på den
 * andre, lysekroner og et langt bord.
 * Modus «forhandling»: seierherrenes tre stoler lyser, Frankrike sterkest. Tysklands stol
 * står ute ved døra, og døra åpnes først når tyskerne skal skrive under.
 * Modus «traktat»: avtalen ligger på bordet, artikkel 231 lyser rødt, og stabler av
 * gullmynter vokser over Tysklands plass ved bordet.
 */

type Modus = 'forhandling' | 'traktat';

const SEIER = [
    { navn: 'Frankrike', farge: '#2563eb', x: -1.6 },
    { navn: 'Storbritannia', farge: '#b91c1c', x: 0 },
    { navn: 'USA', farge: '#0f766e', x: 1.6 },
];
const PILARER = Array.from({ length: 9 }, (_, i) => -22 + i * 3.4);
const KRONER = [-18, -11, -4, 3];
const MYNTER = Array.from({ length: 16 }, (_, i) => ({
    x: (i % 4) * 0.55 - 0.82,
    z: 4.6 + Math.floor(i / 4) * 0.55 - 0.8,
    h: 0.6 + ((i * 37) % 10) / 10,
}));

function kameraFor(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'forhandling') {
            switch (beat) {
                case 0:
                    return { pos: v(0, 4.6, 7.6 - t * 0.5), se: v(0, 1.6, -14) };
                case 1:
                    return { pos: v(-3.5, 3.4, -2.5), se: v(-1.2, 1.3, -8) };
                case 2:
                    return { pos: v(3.2, 3.4, -3), se: v(0.8, 1.3, -8) };
                default:
                    return { pos: v(0.4, 2.7, 1.5 - t * 0.1), se: v(0, 1, 7.4) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(0, 3.2, 2.8), se: v(0, 0.9, -0.6) };
            case 1:
                return { pos: v(0.3, 2.4, 1.2), se: v(0, 0.9, -0.5) };
            case 2:
                return { pos: v(3.6, 3.6, 8), se: v(0, 1.1, 3.4) };
            default:
                return { pos: v(4.2, 5 + t * 0.1, 8), se: v(0, 1.8, 3) };
        }
    };
}

function Rommet() {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
                <planeGeometry args={[12, 40]} />
                <meshStandardMaterial color="#8a6a46" emissive="#3a2a18" emissiveIntensity={0.4} />
            </mesh>
            {/* Speilveggen */}
            <mesh position={[-6, 4, -6]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[40, 8]} />
                <meshStandardMaterial color="#e7d8b8" />
            </mesh>
            {PILARER.map((z) => (
                <mesh key={`s${z}`} position={[-5.9, 3.4, z + 1.7]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[2.2, 5]} />
                    <meshStandardMaterial color="#cbd5e1" emissive="#93c5fd" emissiveIntensity={0.35} metalness={0.6} roughness={0.2} />
                </mesh>
            ))}
            {/* Vindusveggen */}
            <mesh position={[6, 4, -6]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[40, 8]} />
                <meshStandardMaterial color="#e7d8b8" />
            </mesh>
            {PILARER.map((z) => (
                <mesh key={`v${z}`} position={[5.9, 3.4, z + 1.7]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[2.2, 5]} />
                    <meshBasicMaterial color="#fff7d6" />
                </mesh>
            ))}
            {PILARER.map((z) => (
                <group key={`p${z}`}>
                    {[-5.85, 5.85].map((x) => (
                        <mesh key={x} position={[x, 4, z]}>
                            <boxGeometry args={[0.3, 8, 0.5]} />
                            <meshStandardMaterial color="#c9a227" emissive="#7c5a10" emissiveIntensity={0.4} metalness={0.5} />
                        </mesh>
                    ))}
                </group>
            ))}
            {/* Bakveggen med døra */}
            <mesh position={[0, 4, 8.5]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[12, 8]} />
                <meshStandardMaterial color="#e7d8b8" />
            </mesh>
            {KRONER.map((z) => (
                <group key={z} position={[0, 6.4, z]}>
                    <mesh>
                        <sphereGeometry args={[0.45, 12, 10]} />
                        <meshBasicMaterial color="#fde68a" />
                    </mesh>
                    <mesh position={[0, 0.9, 0]}>
                        <cylinderGeometry args={[0.03, 0.03, 1.6, 5]} />
                        <meshStandardMaterial color="#a16207" />
                    </mesh>
                </group>
            ))}
            {/* Det lange bordet */}
            <mesh position={[0, 0.85, -2]}>
                <boxGeometry args={[2.4, 0.12, 14]} />
                <meshStandardMaterial color="#14532d" emissive="#052e16" emissiveIntensity={0.4} />
            </mesh>
            {[-0.95, 0.95].map((x) =>
                [-8.5, 4.5].map((z) => (
                    <mesh key={`${x}${z}`} position={[x, 0.42, z]}>
                        <boxGeometry args={[0.12, 0.84, 0.12]} />
                        <meshStandardMaterial color="#5b3a1e" />
                    </mesh>
                ))
            )}
        </>
    );
}

function Stol({
    x,
    z,
    rot,
    farge,
    matRef,
}: {
    x: number;
    z: number;
    rot: number;
    farge: string;
    matRef?: (m: THREE.MeshStandardMaterial | null) => void;
}) {
    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[0.8, 0.14, 0.8]} />
                <meshStandardMaterial color="#c9a227" />
            </mesh>
            <mesh position={[0, 1.35, -0.38]}>
                <boxGeometry args={[0.85, 1.6, 0.14]} />
                <meshStandardMaterial ref={matRef} color={farge} emissive={farge} emissiveIntensity={0.15} />
            </mesh>
            {[-0.32, 0.32].map((dx) => (
                <mesh key={dx} position={[dx, 0.25, 0]}>
                    <boxGeometry args={[0.08, 0.5, 0.7]} />
                    <meshStandardMaterial color="#a16207" />
                </mesh>
            ))}
        </group>
    );
}

function Seierherrene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    useFrame((_, rawDt) => {
        const d = playing ? Math.min(rawDt, 0.05) : 0.016;
        mats.current.forEach((m, i) => {
            if (!m) return;
            let mål = 0.25;
            if (modus === 'forhandling') {
                if (beat === 1) mål = i === 0 ? 1.3 : 0.05;
                else if (beat === 2) mål = i === 0 ? 0.25 : 0.7;
                else if (beat === 0) mål = 0.5;
            }
            m.emissiveIntensity = damp(m.emissiveIntensity, mål, 3, d);
        });
    });
    return (
        <>
            {SEIER.map((s, i) => (
                <Stol
                    key={s.navn}
                    x={s.x}
                    z={-9.8}
                    rot={0}
                    farge={s.farge}
                    matRef={(m) => {
                        mats.current[i] = m;
                    }}
                />
            ))}
            {/* Flere delegater langs bordet, i nøytral farge */}
            {[-7, -5, -3, -1, 1, 3].map((z) =>
                [-1.7, 1.7].map((x) => (
                    <Stol key={`${x}${z}`} x={x} z={z} rot={x < 0 ? Math.PI / 2 : -Math.PI / 2} farge="#7c6a55" />
                ))
            )}
        </>
    );
}

/** Tysklands stol. I forhandlingen står den ute ved døra; i traktaten ved enden av bordet. */
function Tyskland({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const venstre = useRef<THREE.Group>(null);
    const hoyre = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const d = playing ? Math.min(rawDt, 0.05) : 0.016;
        const apen = modus === 'traktat' || beat >= 3 ? 1 : 0;
        if (venstre.current) venstre.current.rotation.y = damp(venstre.current.rotation.y, apen * 1.4, 1.5, d);
        if (hoyre.current) hoyre.current.rotation.y = damp(hoyre.current.rotation.y, -apen * 1.4, 1.5, d);
    });
    const ute = modus === 'forhandling';
    return (
        <>
            {/* Døra i bakveggen, to fløyer */}
            <group ref={venstre} position={[-1.2, 0, 8.45]}>
                <mesh position={[0.6, 1.8, 0]}>
                    <boxGeometry args={[1.2, 3.6, 0.1]} />
                    <meshStandardMaterial color="#8b5e34" />
                </mesh>
            </group>
            <group ref={hoyre} position={[1.2, 0, 8.45]}>
                <mesh position={[-0.6, 1.8, 0]}>
                    <boxGeometry args={[1.2, 3.6, 0.1]} />
                    <meshStandardMaterial color="#8b5e34" />
                </mesh>
            </group>
            <Stol x={0} z={ute ? 7.4 : 5.6} rot={Math.PI} farge="#6b7280" />
            {ute && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 7.4]}>
                    <circleGeometry args={[1.2, 24]} />
                    <meshStandardMaterial color="#d6d3d1" emissive="#a8a29e" emissiveIntensity={beat >= 3 ? 0.6 : 0} />
                </mesh>
            )}
        </>
    );
}

/** Avtalen på bordet, med artikkel 231 som lyser rødt. */
function Traktat({ beat, playing }: { beat: number; playing: boolean }) {
    const linje = useRef<THREE.MeshStandardMaterial>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        if (linje.current) {
            const på = beat >= 1;
            linje.current.emissiveIntensity = på ? 0.9 + 0.4 * Math.sin(tid.current * 3) : 0;
            linje.current.color.set(på ? '#dc2626' : '#94a3b8');
        }
    });
    return (
        <group position={[0, 0.92, -0.6]} rotation={[0, 0.05, 0]}>
            <mesh>
                <boxGeometry args={[1.1, 0.02, 1.45]} />
                <meshStandardMaterial color="#fffbeb" emissive="#fef3c7" emissiveIntensity={0.3} />
            </mesh>
            {Array.from({ length: 9 }, (_, i) => (
                <mesh key={i} position={[-0.05, 0.015, -0.55 + i * 0.12]}>
                    <boxGeometry args={[i % 3 === 2 ? 0.6 : 0.85, 0.005, 0.035]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
            ))}
            <mesh position={[-0.05, 0.02, 0.2]}>
                <boxGeometry args={[0.9, 0.006, 0.09]} />
                <meshStandardMaterial ref={linje} color="#94a3b8" emissive="#dc2626" emissiveIntensity={0} />
            </mesh>
            <mesh position={[0.35, 0.03, 0.6]}>
                <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
                <meshStandardMaterial color="#b91c1c" />
            </mesh>
        </group>
    );
}

/** Gullmynter som stables over Tysklands plass. */
function Mynter({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const hoyde = useRef(0);
    useFrame((_, rawDt) => {
        const d = playing ? Math.min(rawDt, 0.05) : 0.016;
        const mål = beat >= 3 ? 3.2 : beat === 2 ? 1.3 : 0;
        hoyde.current = beat < 2 ? 0 : damp(hoyde.current, mål, 0.9, d);
        const m = ref.current;
        if (!m) return;
        MYNTER.forEach((s, i) => {
            const h = Math.max(hoyde.current * s.h, 0.001);
            o.position.set(s.x, 0.92 + h / 2, s.z);
            o.scale.set(1, h, 1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, MYNTER.length]} frustumCulled={false}>
            <cylinderGeometry args={[0.24, 0.24, 1, 14]} />
            <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.5} metalness={0.6} roughness={0.35} />
        </instancedMesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const mål = useMemo(() => kameraFor(modus), [modus]);
    useKamera(mål, beat, playing);
    return (
        <>
            <color attach="background" args={['#3b2f22']} />
            <fog attach="fog" args={['#3b2f22', 24, 50]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#fff7ed', '#3b2f22', 0.6]} />
            <directionalLight position={[8, 10, 4]} intensity={1.2} color="#fff1d6" />
            <pointLight position={[0, 5, -6]} intensity={18} distance={20} color="#fde68a" />
            <Rommet />
            <Seierherrene modus={modus} beat={beat} playing={playing} />
            <Tyskland modus={modus} beat={beat} playing={playing} />
            {modus === 'traktat' && <Traktat beat={beat} playing={playing} />}
            {modus === 'traktat' && <Mynter beat={beat} playing={playing} />}
        </>
    );
}

export function KonsekvenserSalen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'forhandling';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const fh = modus === 'forhandling';
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 50, near: 0.1, far: 120, position: [0, 5, 14] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {fh && beat === 0 && <Merkelapp key="f0" tekst="Versailles, 1919" />}
                {fh && beat === 1 && <Merkelapp key="f1" tekst="Frankrike: knus Tyskland" />}
                {fh && beat === 2 && <Merkelapp key="f2" tekst="Storbritannia og USA: mildere" />}
                {fh && beat === 3 && <Merkelapp key="f3" tekst="Tyskland: bare kalt inn for å skrive under" farge="gra" />}
                {!fh && beat === 0 && <Merkelapp key="t0" tekst="Versailles-traktaten" />}
                {!fh && beat === 1 && <Merkelapp key="t1" tekst="Artikkel 231: Tyskland alene har skylden" farge="rod" />}
                {!fh && beat === 2 && <Merkelapp key="t2" tekst="Krigserstatning: enorme summer" />}
                {!fh && beat === 3 && <Merkelapp key="t3" tekst="Tysk økonomi blir kvalt" farge="rod" />}
            </AnimatePresence>
            {fh && (
                <div className="absolute flex justify-center gap-3" style={{ bottom: '5%', left: 0, right: 0 }}>
                    {SEIER.map((s, i) => (
                        <motion.div
                            key={s.navn}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: beat === 1 && i > 0 ? 0.45 : beat === 2 && i === 0 ? 0.45 : 1, y: 0 }}
                            transition={{ delay: beat === 0 ? 0.3 + i * 0.6 : 0 }}
                            className="px-4 py-1.5 rounded-xl bg-white/95 shadow-lg font-bold text-2xl"
                            style={{ color: s.farge, borderBottom: `4px solid ${s.farge}` }}
                        >
                            {s.navn}
                        </motion.div>
                    ))}
                    {beat >= 3 && (
                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="px-4 py-1.5 rounded-xl bg-slate-200 shadow-lg font-bold text-2xl text-slate-600"
                            style={{ borderBottom: '4px solid #6b7280' }}
                        >
                            Tyskland
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}

function Merkelapp({ tekst, farge }: { tekst: string; farge?: 'rod' | 'gra' }) {
    const klasse = farge === 'rod' ? 'bg-red-600 text-white' : farge === 'gra' ? 'bg-slate-700 text-white' : 'bg-white/90 text-slate-900';
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl whitespace-nowrap ${klasse}`}
        >
            {tekst}
        </motion.div>
    );
}
