import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { damp, useBeatKlokke, useDpr, v3 } from './felles3d';

/**
 * Konklavet i 3D: et kapell med kardinaler i to rader. Beat 0 oversikt, 1 dørene lukkes,
 * 2 stemmesedler går til urnen (to tredeler trengs), 3 den nye paven, 4 ingen anke.
 */

const RAD_Z = Array.from({ length: 8 }, (_, i) => -4 + i * 1.5);
const URNE = v3(0, 1.9, -6.5);

const TEKST = [
    'Kardinalene skal velge en ny pave',
    'Konklave: atskilt fra omverdenen',
    'Fire avstemninger om dagen',
    'Leo 14: pave fra 2025',
    'Avgjørelsene kan ikke ankes',
];

function kameraFor(beat: number) {
    switch (beat) {
        case 0:
            return { pos: v3(6, 14, 22), se: v3(0, 1, -1) };
        case 1:
            return { pos: v3(2.5, 5.5, -6), se: v3(0, 2.6, 12) };
        case 2:
            return { pos: v3(4.2, 6.5, 9), se: v3(0, 1.2, -4) };
        case 3:
            return { pos: v3(0, 4.5, 3), se: v3(0, 2.2, -9.5) };
        default:
            return { pos: v3(1.6, 2.7, -4.2), se: v3(0, 2.4, -9.6) };
    }
}

function Kardinal({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 1.05, 0]}>
                <capsuleGeometry args={[0.36, 0.75, 6, 14]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.88, 0]}>
                <sphereGeometry args={[0.27, 32, 24]} />
                <meshStandardMaterial color="#e3b98c" roughness={0.8} />
            </mesh>
            <mesh position={[0, 2.08, 0]} scale={[1, 0.45, 1]}>
                <sphereGeometry args={[0.2, 24, 12]} />
                <meshStandardMaterial color="#dc2626" />
            </mesh>
        </group>
    );
}

function Seddel({ i, beat, playing }: { i: number; beat: number; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const klokke = useBeatKlokke();
    const side = i % 2 === 0 ? -1 : 1;
    const fra = v3(side * 2.7, 1.3, RAD_Z[Math.floor(i / 2) % 8]);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const t = klokke(beat, playing ? Math.min(rawDt, 0.05) : 0);
        m.visible = beat === 2;
        const f = (t * 0.3 + i / 16) % 1;
        m.position.lerpVectors(fra, URNE, f);
        m.position.y += Math.sin(Math.PI * f) * 1.6;
        m.rotation.y = f * 4;
    });
    return (
        <mesh ref={ref} visible={false}>
            <boxGeometry args={[0.32, 0.03, 0.42]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    const { camera } = useThree();
    const se = useRef(v3(0, 1, -1));
    const forste = useRef(true);
    const dorV = useRef<THREE.Mesh>(null);
    const dorH = useRef<THREE.Mesh>(null);
    const pave = useRef<THREE.Group>(null);
    const dais = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((_, rawDt) => {
        const dt = forste.current ? 1 : playing ? Math.min(rawDt, 0.05) : 0;
        const mal = kameraFor(beat);
        const f = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, f);
        se.current.lerp(mal.se, f);
        camera.lookAt(se.current);

        // Dørene er åpne bare i første beat, og lukkes når beat 1 starter.
        const apen = beat === 0;
        const lukk = beat >= 1;
        if (dorV.current && dorH.current) {
            const mx = apen ? 2.4 : 0.8;
            dorV.current.position.x = lukk ? damp(dorV.current.position.x, -mx, 2.2, dt) : -mx;
            dorH.current.position.x = lukk ? damp(dorH.current.position.x, mx, 2.2, dt) : mx;
        }
        if (pave.current) {
            const s = beat >= 3 ? 1 : 0.001;
            pave.current.scale.setScalar(beat >= 3 ? damp(pave.current.scale.x, s, 3, dt) : s);
        }
        if (dais.current) {
            dais.current.emissiveIntensity = damp(
                dais.current.emissiveIntensity,
                beat >= 3 ? 0.6 : 0.05,
                3,
                dt
            );
        }
    });

    return (
        <>
            <color attach="background" args={['#efe5d3']} />
            <fog attach="fog" args={['#efe5d3', 30, 70]} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[8, 20, 10]} intensity={1.3} color="#fff4e0" />
            <hemisphereLight args={['#fff6e6', '#8c7a62', 0.5]} />

            {/* Gulv */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[12, 24.4]} />
                <meshStandardMaterial color="#d8c6a3" roughness={0.9} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1]}>
                <planeGeometry args={[1.6, 22]} />
                <meshStandardMaterial color="#a8865a" roughness={0.9} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[80, 80]} />
                <meshStandardMaterial color="#cdbf9f" />
            </mesh>

            {/* Vegger */}
            {[-6, 6].map((x) => (
                <mesh key={x} position={[x, 3.5, 0]}>
                    <boxGeometry args={[0.4, 7, 24.4]} />
                    <meshStandardMaterial color="#ece2cf" roughness={0.95} />
                </mesh>
            ))}
            {[-6, 6].flatMap((x) =>
                [-8, -3, 2, 7].map((z) => (
                    <mesh key={`${x}${z}`} position={[x * 0.96, 4.8, z]}>
                        <boxGeometry args={[0.1, 2.4, 1.2]} />
                        <meshStandardMaterial
                            color="#bfdbfe"
                            emissive="#dbeafe"
                            emissiveIntensity={0.7}
                        />
                    </mesh>
                ))
            )}
            <mesh position={[0, 3.5, -12]}>
                <boxGeometry args={[12.4, 7, 0.4]} />
                <meshStandardMaterial color="#e6d9c2" roughness={0.95} />
            </mesh>
            <mesh position={[0, 4.2, -11.75]}>
                <boxGeometry args={[7, 4, 0.05]} />
                <meshStandardMaterial color="#7c9cc4" roughness={0.9} />
            </mesh>
            {/* Frontveggen med døråpning */}
            {[-3.8, 3.8].map((x) => (
                <mesh key={x} position={[x, 3.5, 12]}>
                    <boxGeometry args={[4.4, 7, 0.4]} />
                    <meshStandardMaterial color="#ece2cf" roughness={0.95} />
                </mesh>
            ))}
            <mesh position={[0, 5.75, 12]}>
                <boxGeometry args={[3.2, 2.5, 0.4]} />
                <meshStandardMaterial color="#ece2cf" roughness={0.95} />
            </mesh>
            <mesh ref={dorV} position={[-2.4, 2.25, 11.7]}>
                <boxGeometry args={[1.6, 4.5, 0.15]} />
                <meshStandardMaterial color="#6b3f1d" roughness={0.8} />
            </mesh>
            <mesh ref={dorH} position={[2.4, 2.25, 11.7]}>
                <boxGeometry args={[1.6, 4.5, 0.15]} />
                <meshStandardMaterial color="#6b3f1d" roughness={0.8} />
            </mesh>

            {/* Bord og kardinaler */}
            {[-2.2, 2.2].map((x) => (
                <mesh key={x} position={[x, 0.45, 1.25]}>
                    <boxGeometry args={[0.9, 0.9, 12.5]} />
                    <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
                </mesh>
            ))}
            {[-3.2, 3.2].flatMap((x) =>
                RAD_Z.map((z) => <Kardinal key={`${x}${z}`} x={x} z={z} />)
            )}

            {/* Urnen */}
            <mesh position={[0, 0.5, -6.5]}>
                <boxGeometry args={[1.6, 1, 1]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            <mesh position={[0, 1.4, -6.5]}>
                <cylinderGeometry args={[0.35, 0.28, 0.8, 24]} />
                <meshStandardMaterial color="#d4a017" metalness={0.4} roughness={0.4} />
            </mesh>
            {Array.from({ length: 16 }, (_, i) => (
                <Seddel key={i} i={i} beat={beat} playing={playing} />
            ))}

            {/* Paven på podiet */}
            <mesh position={[0, 0.25, -9.6]}>
                <boxGeometry args={[3.2, 0.5, 2.2]} />
                <meshStandardMaterial
                    ref={dais}
                    color="#c9a227"
                    emissive="#fcd34d"
                    emissiveIntensity={0.05}
                />
            </mesh>
            <group ref={pave} position={[0, 0.5, -9.6]} scale={0.001}>
                <mesh position={[0, 1.05, 0]}>
                    <capsuleGeometry args={[0.42, 0.95, 6, 14]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.6} />
                </mesh>
                <mesh position={[0, 2.0, 0]}>
                    <sphereGeometry args={[0.3, 32, 24]} />
                    <meshStandardMaterial color="#e3b98c" roughness={0.8} />
                </mesh>
                <mesh position={[0, 2.23, 0]} scale={[1, 0.45, 1]}>
                    <sphereGeometry args={[0.22, 24, 12]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
            </group>
        </>
    );
}

export function LedelseKonklave({ beat, playing }: VisualProps) {
    const dpr = useDpr();
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 45, near: 0.2, far: 200, position: [6, 14, 22] }}
            >
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: '5%' }}
                >
                    <div
                        className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl md:text-4xl font-display font-black text-slate-900"
                        style={{ borderLeft: '10px solid #b91c1c' }}
                    >
                        {TEKST[Math.min(beat, TEKST.length - 1)]}
                    </div>
                </motion.div>
            </AnimatePresence>
            {beat === 2 && (
                <div className="absolute inset-x-0 flex justify-center" style={{ bottom: '6%' }}>
                    <div
                        className="px-6 py-4 rounded-2xl bg-white/95 shadow-xl"
                        style={{ width: 620 }}
                    >
                        <div className="text-2xl font-bold text-slate-700 mb-2">
                            Andel av stemmene til én kandidat
                        </div>
                        <div className="relative rounded-full bg-slate-200" style={{ height: 30 }}>
                            <motion.div
                                className="absolute left-0 top-0 bottom-0 rounded-full bg-red-700"
                                initial={{ width: '0%' }}
                                animate={{ width: '66.7%' }}
                                transition={{ duration: 2.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            />
                            <div
                                className="absolute top-0 bottom-0 bg-slate-900"
                                style={{ left: '66.7%', width: 5 }}
                            />
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-2">
                            To tredeler trengs
                        </div>
                    </div>
                </div>
            )}
            {beat === 3 && (
                <div className="absolute inset-x-0 flex justify-center" style={{ bottom: '6%' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl md:text-3xl font-bold text-slate-800"
                    >
                        Kirken: ca. 1,36 milliarder medlemmer (2020)
                    </motion.div>
                </div>
            )}
        </div>
    );
}
