import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Vinteren 1944-1945: de som gjemte seg. En dal i mørketida med en hule i fjellet,
 * en enkel hytte og en gamme av torv. Snøen faller, og et lite lys brenner i døra.
 */

function kameraFor(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(26 - t * 0.4, 12, 34), se: v(0, 3, -4) };
        case 1:
            return { pos: v(-2 + t * 0.35, 4.5, 15), se: v(0, 2.2, 0) };
        case 2:
            return { pos: v(10, 7 + t * 0.1, 26), se: v(-2, 6, -8) };
        case 3:
            return { pos: v(1.8, 2.2, 7.2), se: v(0, 1.4, 1.4) };
        default:
            return { pos: v(-6, 9 + t * 0.2, 30), se: v(4, 5, 50) };
    }
}

/** Gammen: en lav kuppel av torv med snø på toppen og et varmt lys i døra. */
function Gamme({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 0, 0]} scale={[1, 0.62, 1]}>
                <sphereGeometry args={[2.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#5b4a32" flatShading />
            </mesh>
            <mesh position={[0, 0.25, 0]} scale={[1, 0.58, 1]}>
                <sphereGeometry args={[2.35, 12, 6, 0, Math.PI * 2, 0, Math.PI / 4]} />
                <meshStandardMaterial color="#eef3f8" emissive="#6c7c96" emissiveIntensity={0.35} flatShading />
            </mesh>
            {/* Døra */}
            <mesh position={[0, 0.65, 2.42]}>
                <boxGeometry args={[0.9, 1.3, 0.2]} />
                <meshStandardMaterial color="#ffb347" emissive="#ff9a2e" emissiveIntensity={1.4} />
            </mesh>
            <mesh position={[0, 1.6, 0.4]}>
                <cylinderGeometry args={[0.14, 0.14, 0.6, 6]} />
                <meshStandardMaterial color="#3d3428" />
            </mesh>
        </group>
    );
}

function Hytte({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]} rotation={[0, -0.4, 0]}>
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[3, 1.8, 2.4]} />
                <meshStandardMaterial color="#6b5440" flatShading />
            </mesh>
            <mesh position={[0, 2.0, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 1.15]}>
                <boxGeometry args={[1.6, 1.6, 2.4]} />
                <meshStandardMaterial color="#eef3f8" emissive="#6c7c96" emissiveIntensity={0.35} flatShading />
            </mesh>
            <mesh position={[0.6, 1.0, 1.22]}>
                <boxGeometry args={[0.6, 0.5, 0.05]} />
                <meshStandardMaterial color="#ffcf7a" emissive="#ffb347" emissiveIntensity={1.2} />
            </mesh>
        </group>
    );
}

function Fjell() {
    const topper = useMemo(
        () =>
            Array.from({ length: 8 }, (_, i) => ({
                x: -60 + i * 16 + frø(i) * 5,
                z: -30 - frø(i + 3) * 12,
                r: 13 + frø(i + 6) * 7,
                h: 13 + frø(i + 1) * 9,
            })),
        []
    );
    return (
        <>
            {topper.map((f, i) => (
                <mesh key={i} position={[f.x, f.h / 2, f.z]}>
                    <coneGeometry args={[f.r, f.h, 7]} />
                    <meshStandardMaterial color="#c9d3e0" emissive="#4a5a75" emissiveIntensity={0.35} flatShading />
                </mesh>
            ))}
            {/* Fjellveggen med hula */}
            <mesh position={[-12, 5, -9]} rotation={[0, 0.3, 0]}>
                <boxGeometry args={[12, 10, 6]} />
                <meshStandardMaterial color="#8a93a3" emissive="#3a4458" emissiveIntensity={0.3} flatShading />
            </mesh>
            <mesh position={[-11.2, 1.6, -5.95]} rotation={[0, 0.3, 0]} scale={[1.4, 1, 1]}>
                <circleGeometry args={[1.5, 16, 0, Math.PI]} />
                <meshStandardMaterial color="#3a2414" emissive="#ff8a2e" emissiveIntensity={0.55} side={THREE.DoubleSide} />
            </mesh>
        </>
    );
}

const SNO = 260;
/** Snøfnuggene lever utenfor React, de flyttes hvert bilde. */
const FNUGG = Array.from({ length: SNO }, (_, i) => ({
    x: (frø(i) - 0.5) * 50,
    y: frø(i + 400) * 18,
    z: (frø(i + 900) - 0.5) * 40,
    fart: 0.8 + frø(i + 50) * 0.8,
}));

/** Snøfall som tetner til når vinteren blir hard. */
function Snofall({ tett, playing }: { tett: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const fnugg = FNUGG;
    const tmp = useMemo(() => new THREE.Object3D(), []);
    const mengde = useRef(0.3);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        mengde.current = damp(mengde.current, tett ? 1 : 0.3, 1, dt);
        for (let i = 0; i < SNO; i++) {
            const f = fnugg[i];
            f.y -= f.fart * dt * (tett ? 2.2 : 1);
            f.x += dt * (tett ? 1.6 : 0.3);
            if (f.y < 0) f.y += 18;
            if (f.x > 25) f.x -= 50;
            tmp.position.set(f.x, f.y, f.z);
            tmp.scale.setScalar(i / SNO < mengde.current ? 1 : 0);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, SNO]} frustumCulled={false}>
            <sphereGeometry args={[0.07, 4, 3]} />
            <meshBasicMaterial color="#ffffff" />
        </instancedMesh>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kameraFor, beat, playing);
    const ambient = useRef<THREE.AmbientLight>(null);
    const ild = useRef<THREE.PointLight>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        if (ambient.current)
            ambient.current.intensity = damp(ambient.current.intensity, beat === 2 ? 0.45 : 0.7, 1, dt);
        if (ild.current) ild.current.intensity = 14 + Math.sin(tid.current * 8) * 2.5;
    });
    return (
        <>
            <color attach="background" args={['#1c2a44']} />
            <fog attach="fog" args={['#2a3a58', 40, 120]} />
            <Stars radius={140} depth={30} count={1500} factor={4} fade speed={0} />
            <ambientLight ref={ambient} intensity={0.7} />
            <hemisphereLight args={['#9fb4d6', '#2b3445', 0.6]} />
            <directionalLight position={[20, 30, 10]} intensity={0.55} color="#c8d6f0" />
            <pointLight ref={ild} position={[0, 1, 3.4]} color="#ff9a3d" intensity={14} distance={12} decay={1.5} />
            {/* Snø */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#e3e9f2" emissive="#56647d" emissiveIntensity={0.3} />
            </mesh>
            {/* Havet langt ute */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 75]}>
                <planeGeometry args={[200, 60]} />
                <meshStandardMaterial color="#27496a" emissive="#1c3858" emissiveIntensity={0.5} />
            </mesh>
            <Fjell />
            <Gamme x={0} z={0} />
            <Hytte x={8} z={-3} />
            <Snofall tett={beat === 2} playing={playing} />
            {/* Et skip med lys langt ute, når 500 blir fraktet til Skottland */}
            {beat >= 4 && (
                <group position={[10, 0, 62]}>
                    <mesh position={[0, 0.6, 0]}>
                        <boxGeometry args={[7, 1.4, 2]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    <mesh position={[0, 1.8, 0]}>
                        <boxGeometry args={[2.4, 1.2, 1.6]} />
                        <meshStandardMaterial color="#ffd27a" emissive="#ffb347" emissiveIntensity={1.2} />
                    </mesh>
                </group>
            )}
        </>
    );
}

const LAPPER = [
    'Vinteren 1944-1945',
    'Hule, hytte og gamme',
    'Mørketid og kulde',
    'Lite mat. Hjemmet brent.',
    'Februar 1945',
];

export function FinnmarkGamme({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapp = LAPPER[Math.min(beat, LAPPER.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas dpr={dpr} camera={{ fov: 42, near: 0.3, far: 400, position: [26, 12, 34] }}>
                <Scene beat={beat} playing={playing} />
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
            <AnimatePresence>
                {beat === 0 && (
                    <motion.div
                        key="tall"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[8%] right-[5%]"
                    >
                        <Teller verdi={23000} etikett="gjemte seg" prefiks="ca. " forsinkelse={0.6} />
                    </motion.div>
                )}
                {beat === 1 && (
                    <motion.div
                        key="gamme"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1.2 }}
                        className="absolute bottom-[8%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-amber-100 text-slate-900 font-black text-xl md:text-3xl shadow-xl whitespace-nowrap"
                    >
                        Gamme: en liten hytte av torv
                    </motion.div>
                )}
                {beat === 4 && (
                    <motion.div
                        key="skottland"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[8%] right-[5%] flex flex-col items-end gap-3"
                    >
                        <Teller verdi={500} etikett="over havet til Skottland" forsinkelse={0.6} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
