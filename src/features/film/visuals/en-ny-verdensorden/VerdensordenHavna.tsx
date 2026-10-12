import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { damp, useBeatTid, useKamera, v } from './felles3d';

/**
 * Havna i Hambantota på Sri Lanka.
 * Beat 0: tom kyst med palmer. Beat 1: kaia og kranene reiser seg, og en stabel lånte mynter
 * dukker opp på land. Beat 2: et skip seiler forbi uten å legge til. Beat 3: myntstabelen blir
 * rød - gjelda kan ikke betales. Beat 4: et nytt flagg heises på kaia: leid bort i 99 år.
 */

const KRANER = [-7, -2.5, 2, 6.5];
const PALMER: [number, number][] = [
    [-15, -3],
    [-11, -6],
    [12, -4],
    [15, -7],
    [9, -9],
];
const MYNTER = 30;
const STABEL = v(-13, 0.5, -3);

function kamera(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(-14 + t * 0.4, 10, 26), se: v(0, 1, 0) };
        case 1:
            return { pos: v(13, 9, 20), se: v(-1, 2, 0) };
        case 2:
            return { pos: v(2, 8, 32), se: v(0, 1.5, 10) };
        case 3:
            return { pos: v(-21, 7, 9), se: v(-12, 2, -3) };
        default:
            return { pos: v(7, 6, 15), se: v(0, 3, 1) };
    }
}

function Kai({ beat, playing }: { beat: number; playing: boolean }) {
    const kai = useRef<THREE.Group>(null);
    const kraner = useRef<(THREE.Group | null)[]>([]);
    const tid = useBeatTid(beat, playing);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const bygd = beat >= 1;
        const k = kai.current;
        if (k) {
            const mål = bygd ? 1 : 0.001;
            k.scale.x = forste.current ? mål : damp(k.scale.x, mål, 2.5, dt);
            k.visible = k.scale.x > 0.02;
        }
        kraner.current.forEach((g, i) => {
            if (!g) return;
            const på = bygd && (beat > 1 || tid.current > 0.8 + i * 0.5);
            const mål = på ? 1 : 0.001;
            g.scale.y = forste.current && beat > 1 ? mål : damp(g.scale.y, mål, 3, dt);
            g.visible = g.scale.y > 0.02;
        });
        forste.current = false;
    });
    return (
        <group>
            <group ref={kai} scale={[0.001, 1, 1]}>
                <mesh position={[0, 0.3, 1.5]}>
                    <boxGeometry args={[22, 0.6, 3.2]} />
                    <meshStandardMaterial color="#9ca3af" flatShading />
                </mesh>
                <mesh position={[0, 0.62, 2.9]}>
                    <boxGeometry args={[22, 0.06, 0.25]} />
                    <meshStandardMaterial color="#facc15" />
                </mesh>
            </group>
            {KRANER.map((x, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        kraner.current[i] = g;
                    }}
                    position={[x, 0.6, 1.2]}
                    scale={[1, 0.001, 1]}
                >
                    <mesh position={[0, 2.6, 0]}>
                        <boxGeometry args={[0.5, 5.2, 0.5]} />
                        <meshStandardMaterial color="#ea580c" flatShading />
                    </mesh>
                    <mesh position={[0, 5.1, 2.4]}>
                        <boxGeometry args={[0.35, 0.35, 7]} />
                        <meshStandardMaterial color="#ea580c" flatShading />
                    </mesh>
                    <mesh position={[0, 4.8, -1.4]}>
                        <boxGeometry args={[0.8, 0.8, 0.8]} />
                        <meshStandardMaterial color="#334155" flatShading />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Lånte penger som en stabel mynter på land. Rød når gjelda ikke kan betales. */
function Gjeld({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const tid = useBeatTid(beat, playing);
    const o = useMemo(() => new THREE.Object3D(), []);
    const gull = useMemo(() => new THREE.Color('#facc15'), []);
    const rod = useMemo(() => new THREE.Color('#dc2626'), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0.016;
        const m = ref.current;
        if (!m) return;
        const t = tid.current;
        for (let j = 0; j < MYNTER; j++) {
            const stabel = j % 3;
            const h = Math.floor(j / 3);
            const synlig = beat >= 2 || (beat === 1 && t > j * 0.05);
            o.position.set(STABEL.x + (stabel - 1) * 0.95, STABEL.y + 0.07 + h * 0.15, STABEL.z + (stabel === 1 ? -0.5 : 0));
            o.rotation.set(0, j, 0);
            o.scale.setScalar(synlig ? 1 : 0.001);
            o.updateMatrix();
            m.setMatrixAt(j, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
        const mm = mat.current;
        if (mm) {
            const mål = beat >= 3 ? 1 : 0;
            const a = damp(mm.userData.rod ?? 0, mål, 2, dt);
            mm.userData.rod = a;
            mm.color.copy(gull).lerp(rod, a);
            mm.emissive.copy(gull).lerp(rod, a).multiplyScalar(0.4);
        }
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, MYNTER]}>
            <cylinderGeometry args={[0.42, 0.42, 0.13, 16]} />
            <meshStandardMaterial ref={mat} color="#facc15" emissive="#a16207" emissiveIntensity={1} metalness={0.3} roughness={0.4} />
        </instancedMesh>
    );
}

/** Et lasteskip som seiler forbi havna uten å legge til. */
function Skip({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useBeatTid(beat, playing);
    useFrame(() => {
        const g = ref.current;
        if (!g) return;
        g.visible = beat === 2;
        g.position.x = -26 + Math.min(tid.current, 14) * 3.6;
        g.position.y = Math.sin(tid.current * 1.2) * 0.05;
    });
    return (
        <group ref={ref} position={[-26, 0, 15]} visible={false}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[8, 1.4, 1.9]} />
                <meshStandardMaterial color="#14532d" flatShading />
            </mesh>
            <mesh position={[4.6, 0.5, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.95, 1.3, 4]} />
                <meshStandardMaterial color="#14532d" flatShading />
            </mesh>
            <mesh position={[-3.2, 1.9, 0]}>
                <boxGeometry args={[1.2, 1.6, 1.6]} />
                <meshStandardMaterial color="#f8fafc" flatShading />
            </mesh>
            {[-1.5, 0, 1.5].map((x, i) => (
                <mesh key={x} position={[x, 1.6, 0]}>
                    <boxGeometry args={[1.3, 0.8, 1.5]} />
                    <meshStandardMaterial color={['#2563eb', '#dc2626', '#16a34a'][i]} flatShading />
                </mesh>
            ))}
        </group>
    );
}

/** Flagget som heises på kaia når havna leies bort. */
function Flagg({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const tid = useBeatTid(beat, playing);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0.016;
        const f = ref.current;
        if (!f) return;
        const mål = beat >= 4 ? 5.6 : 1.2;
        f.position.y = damp(f.position.y, mål, 1.2, dt);
        f.rotation.y = Math.sin(tid.current * 3) * 0.12;
        f.visible = beat >= 4;
    });
    return (
        <group position={[0, 0.6, 2.4]} visible={beat >= 4}>
            <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 6, 8]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh ref={ref} position={[0.85, 1.2, 0]}>
                <boxGeometry args={[1.6, 1, 0.05]} />
                <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kamera, beat, playing);
    return (
        <>
            <color attach="background" args={['#cfe8f5']} />
            <fog attach="fog" args={['#cfe8f5', 45, 110]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#ffffff', '#0ea5e9', 0.6]} />
            <directionalLight position={[10, 25, 15]} intensity={1.5} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 20]}>
                <planeGeometry args={[160, 60]} />
                <meshStandardMaterial color="#1f7fb8" emissive="#0c4a6e" emissiveIntensity={0.4} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.25, -20]}>
                <boxGeometry args={[160, 0.5, 40]} />
                <meshStandardMaterial color="#86a865" flatShading />
            </mesh>
            <mesh position={[0, 0.27, -0.6]}>
                <boxGeometry args={[160, 0.5, 1.4]} />
                <meshStandardMaterial color="#e7d8a8" flatShading />
            </mesh>
            {PALMER.map(([x, z], i) => (
                <group key={i} position={[x, 0.5, z]}>
                    <mesh position={[0, 1.6, 0]} rotation={[0, 0, 0.12]}>
                        <cylinderGeometry args={[0.14, 0.2, 3.2, 6]} />
                        <meshStandardMaterial color="#92400e" flatShading />
                    </mesh>
                    <mesh position={[0.2, 3.3, 0]}>
                        <coneGeometry args={[1.3, 0.8, 6]} />
                        <meshStandardMaterial color="#15803d" flatShading />
                    </mesh>
                </group>
            ))}
            {[-6, 0, 6].map((x) => (
                <mesh key={x} position={[x, 1.3, -3.5]} visible={beat >= 1}>
                    <boxGeometry args={[4.4, 1.6, 2.6]} />
                    <meshStandardMaterial color="#e2e8f0" flatShading />
                </mesh>
            ))}
            <Kai beat={beat} playing={playing} />
            <Gjeld beat={beat} playing={playing} />
            <Skip beat={beat} playing={playing} />
            <Flagg beat={beat} playing={playing} />
        </>
    );
}

const TEKST: (string | [string, 'rod'])[] = [
    'Hambantota, Sri Lanka',
    'En ny storhavn, bygd med lån fra Kina',
    'For få skip',
    ['Lånene kan ikke betales', 'rod'],
    ['2017: leid bort til et kinesisk selskap', 'rod'],
];

export function VerdensordenHavna({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linje = TEKST[Math.min(beat, TEKST.length - 1)];
    const [tekst, farge] = Array.isArray(linje) ? linje : [linje, undefined];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, near: 0.3, far: 220, position: [-14, 10, 26] }}>
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        farge === 'rod' ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
            {beat >= 1 && beat <= 3 && (
                <div className="absolute bottom-[6%] left-[4%] px-4 py-2 rounded-xl bg-white/90 shadow-lg text-xl font-bold text-slate-700 flex items-center gap-3">
                    <span className={`inline-block w-6 h-6 rounded-full ${beat >= 3 ? 'bg-red-600' : 'bg-yellow-400'} border-2 border-slate-500`} /> {beat >= 3 ? '= ubetalt gjeld' : '= lån fra Kina'}
                </div>
            )}
            {beat === 4 && (
                <div className="absolute bottom-[7%] right-[5%]">
                    <Teller verdi={99} etikett="år leieavtale" forsinkelse={0.8} tone="rod" />
                </div>
            )}
        </div>
    );
}
