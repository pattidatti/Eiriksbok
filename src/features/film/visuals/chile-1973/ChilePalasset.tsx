import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { damp, frø, lerretTekstur, tegnChile, useKamera, v } from './felles3d';

/**
 * Presidentpalasset i hovedstaden, morgenen 11. september 1973. Ingen mennesker vises.
 * Beat 0: palasset i morgenlys. Beat 1: militærkjøretøy ringer det inn.
 * Beat 2: røyk stiger fra taket og himmelen mørkner. Beat 3: kameraet trekker seg ut,
 * Pinochet tar makten, og telleren viser 17 år med diktatur.
 */

const BRED = 36;
const DYP = 16;
const HØY = 7;
const KJØRETØY = 10;
const RØYK = 26;

function kamera(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(-8 + t * 0.6, 7, 42 - t * 0.3), se: v(0, 4, 0) };
        case 1:
            return { pos: v(34, 22, 46), se: v(0, 2, 0) };
        case 2:
            return { pos: v(16, 10, 34), se: v(0, 9, 0) };
        default:
            return { pos: v(-30, 34, 64 + t * 0.5), se: v(0, 4, 0) };
    }
}

function Palass({ mørkt, playing }: { mørkt: boolean; playing: boolean }) {
    const vegg = mørkt ? '#9ca3af' : '#f1ece2';
    const vinduer = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const m = vinduer.current;
        if (m) m.emissiveIntensity = damp(m.emissiveIntensity, mørkt ? 0 : 0.6, 1.5, dt || 0.016);
    });
    return (
        <group>
            {/* Hovedbygget */}
            <mesh position={[0, HØY / 2, 0]}>
                <boxGeometry args={[BRED, HØY, DYP]} />
                <meshStandardMaterial
                    color={vegg}
                    emissive="#57534e"
                    emissiveIntensity={0.12}
                    flatShading
                />
            </mesh>
            {/* Takkant */}
            <mesh position={[0, HØY + 0.3, 0]}>
                <boxGeometry args={[BRED + 1, 0.6, DYP + 1]} />
                <meshStandardMaterial color={mørkt ? '#6b7280' : '#d6cfc0'} flatShading />
            </mesh>
            {/* Midtpartiet med søyler */}
            <mesh position={[0, HØY / 2 + 0.6, DYP / 2 + 0.8]}>
                <boxGeometry args={[9, HØY + 1.2, 1.6]} />
                <meshStandardMaterial
                    color={vegg}
                    emissive="#57534e"
                    emissiveIntensity={0.12}
                    flatShading
                />
            </mesh>
            {[-3, -1, 1, 3].map((x) => (
                <mesh key={x} position={[x, HØY / 2, DYP / 2 + 2.1]}>
                    <cylinderGeometry args={[0.35, 0.35, HØY, 10]} />
                    <meshStandardMaterial color="#ffffff" flatShading />
                </mesh>
            ))}
            {/* Vinduene på forsiden, som én lysende stripe per etasje */}
            {[2.2, 5].map((y) => (
                <mesh key={y} position={[0, y, DYP / 2 + 0.02]}>
                    <planeGeometry args={[BRED - 3, 1.1]} />
                    <meshStandardMaterial
                        ref={y === 2.2 ? vinduer : undefined}
                        color="#475569"
                        emissive="#fde68a"
                        emissiveIntensity={0.6}
                    />
                </mesh>
            ))}
        </group>
    );
}

function Flagg({ playing }: { playing: boolean }) {
    const tek = useMemo(() => lerretTekstur(300, 180, tegnChile), []);
    useEffect(() => () => tek.dispose(), [tek]);
    const ref = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        if (ref.current) ref.current.rotation.y = Math.sin(tid.current * 2) * 0.15;
    });
    return (
        <group position={[0, HØY + 0.6, 2]}>
            <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh ref={ref} position={[1.5, 5.2, 0]}>
                <planeGeometry args={[3, 1.8]} />
                <meshStandardMaterial
                    map={tek}
                    emissive="#ffffff"
                    emissiveMap={tek}
                    emissiveIntensity={0.35}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

/** Militærkjøretøy i en ring rundt palasset. De glir inn utenfra når beat 1 starter. */
function Kjøretøy({ vis, playing }: { vis: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tårn = useRef<THREE.InstancedMesh>(null);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const q = useMemo(() => new THREE.Quaternion(), []);
    const avstand = useRef(vis ? 0 : 1);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        avstand.current = forste.current
            ? vis
                ? 0
                : 1
            : damp(avstand.current, vis ? 0 : 1, 0.9, dt);
        forste.current = false;
        for (let i = 0; i < KJØRETØY; i++) {
            const a = (i / KJØRETØY) * Math.PI * 2 + 0.3;
            const rx = BRED / 2 + 9 + avstand.current * 40;
            const rz = DYP / 2 + 10 + avstand.current * 40;
            const x = Math.cos(a) * rx;
            const z = Math.sin(a) * rz;
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
            const s = avstand.current > 0.97 ? 0.001 : 1;
            m.compose(new THREE.Vector3(x, 0.9, z), q, new THREE.Vector3(s, s, s));
            ref.current?.setMatrixAt(i, m);
            m.compose(new THREE.Vector3(x, 2.1, z), q, new THREE.Vector3(s, s, s));
            tårn.current?.setMatrixAt(i, m);
        }
        if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
        if (tårn.current) tårn.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={ref} args={[undefined, undefined, KJØRETØY]}>
                <boxGeometry args={[2.6, 1.6, 4.6]} />
                <meshStandardMaterial
                    color="#4d5a3a"
                    emissive="#1f2617"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </instancedMesh>
            <instancedMesh ref={tårn} args={[undefined, undefined, KJØRETØY]}>
                <boxGeometry args={[1.6, 0.9, 2]} />
                <meshStandardMaterial color="#3f4a2f" flatShading />
            </instancedMesh>
        </>
    );
}

/** Mørk røyk som stiger rolig fra taket. Ingen flammer eller eksplosjoner. */
function Røyk({ vis, playing }: { vis: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const tid = useRef(0);
    const styrke = useRef(vis ? 1 : 0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        styrke.current = damp(styrke.current, vis ? 1 : 0, 0.8, dt || 0.016);
        const im = ref.current;
        if (!im) return;
        for (let i = 0; i < RØYK; i++) {
            const u = (tid.current * 0.12 + frø(i)) % 1;
            const x = -8 + frø(i + 40) * 10 + u * 6;
            const z = -3 + frø(i + 80) * 6;
            const s = (1.2 + u * 3.5) * styrke.current + 0.001;
            m.makeScale(s, s, s).setPosition(x, HØY + 1 + u * 20, z);
            im.setMatrixAt(i, m);
        }
        im.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, RØYK]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#4b5563" transparent opacity={0.7} flatShading />
        </instancedMesh>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kamera, beat, playing);
    const mørkt = beat >= 2;
    const himmel = mørkt ? '#a8a29e' : '#f6d7c3';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 70, 180]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#ffe4cc', '#8b8478', 0.6]} />
            <directionalLight
                position={[-40, 18, 30]}
                intensity={mørkt ? 0.7 : 1.3}
                color="#ffd2a8"
            />
            {/* Plassen foran og rundt */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[260, 260]} />
                <meshStandardMaterial color="#c8c2b6" emissive="#57534e" emissiveIntensity={0.1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, DYP / 2 + 14]}>
                <planeGeometry args={[BRED + 10, 18]} />
                <meshStandardMaterial color="#a8a29e" />
            </mesh>
            {/* Byen rundt: lave kvartaler */}
            {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                const h = 6 + frø(i) * 10;
                return (
                    <mesh key={i} position={[Math.cos(a) * 75, h / 2, Math.sin(a) * 60 - 10]}>
                        <boxGeometry args={[16, h, 14]} />
                        <meshStandardMaterial color={mørkt ? '#9ca3af' : '#e7dccb'} flatShading />
                    </mesh>
                );
            })}
            <Palass mørkt={mørkt} playing={playing} />
            <Flagg playing={playing} />
            <Kjøretøy vis={beat >= 1} playing={playing} />
            <Røyk vis={beat >= 2} playing={playing} />
        </>
    );
}

const TEKST: { tekst: string; rod?: boolean }[] = [
    { tekst: 'Morgen, 11. september 1973' },
    { tekst: 'Hæren omringer palasset', rod: true },
    { tekst: 'Palasset bombes. Allende dør.', rod: true },
    { tekst: 'Pinochet tar makten', rod: true },
];

export function ChilePalasset({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const t = TEKST[Math.min(beat, TEKST.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [-8, 7, 42] }}
            >
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-700 text-white' : 'bg-white/90 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 3 && (
                    <motion.div
                        key="pinochet"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6, type: 'spring', stiffness: 160, damping: 18 }}
                        className="absolute left-[5%] top-[26%] w-[20rem] p-5 rounded-3xl bg-white/95 shadow-2xl"
                    >
                        <div className="font-display font-black text-3xl text-slate-900">
                            General Augusto Pinochet
                        </div>
                        <div className="mt-1 text-xl font-semibold text-slate-600">
                            Diktator: styrer alene, uten frie valg
                        </div>
                        <div className="mt-4 flex">
                            <Teller
                                verdi={17}
                                etikett="år med diktatur"
                                forsinkelse={1.4}
                                tone="rod"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
