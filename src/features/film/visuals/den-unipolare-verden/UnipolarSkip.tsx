import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Containerskipet og verdenshandelen. Beat 0: skipet kommer mot en tollbom (WTO, 1995).
 * Beat 1: bommen går opp og skipet glir gjennom. Beat 2: Kina blir medlem, og de første
 * fabrikkene reiser seg på kaia. Beat 3: fabrikkene fyller kaia. Beat 4: skipet lastes fullt
 * av containere fra verdens fabrikk.
 */

const LENGDE = 10;
const BREDDE = 3;
const HOYDE = 3;
const PLASSER = LENGDE * BREDDE * HOYDE;
const FARGER = ['#dc2626', '#2563eb', '#16a34a', '#ea580c', '#0891b2', '#ca8a04', '#7c3aed'];
const FABRIKKER = Array.from({ length: 8 }, (_, i) => ({ x: 4 + i * 4.2, z: -12 - (i % 2) * 4 }));

function skipX(beat: number, t: number) {
    if (beat === 0) return -18 + Math.min(t, 6) * 0.6;
    if (beat === 1) return -14.4 + Math.min(1, t / 6) * 26;
    return 14;
}

function antallContainere(beat: number, t: number) {
    if (beat <= 2) return 12;
    if (beat === 3) return 30;
    return Math.min(PLASSER, 30 + Math.floor(t * 14));
}

function kamera(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(-24 + t * 0.4, 7, 18), se: v(-10, 1.5, 0) };
        case 1:
            return { pos: v(-4, 8, 22), se: v(0, 2, 0) };
        case 2:
            return { pos: v(8, 13, 26), se: v(16, 2, -9) };
        case 3:
            return { pos: v(28 - t * 0.3, 10, 18), se: v(16, 2, -8) };
        default:
            return { pos: v(2, 15, 30), se: v(15, 2, -4) };
    }
}

function Skip({ beat, playing }: { beat: number; playing: boolean }) {
    const gruppe = useRef<THREE.Group>(null);
    const last = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const o = useMemo(() => new THREE.Object3D(), []);
    const farger = useMemo(
        () => Array.from({ length: PLASSER }, (_, i) => new THREE.Color(FARGER[Math.floor(frø(i + 3) * FARGER.length)])),
        []
    );
    const skala = useRef(new Float32Array(PLASSER));
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const t = tid.current;
        const g = gruppe.current;
        if (g) {
            const mål = skipX(beat, t);
            g.position.x = forste.current ? mål : damp(g.position.x, mål, 3, dt || 0.016);
            g.position.y = Math.sin(t * 1.3) * 0.06;
        }
        const m = last.current;
        if (!m) return;
        const n = antallContainere(beat, t);
        for (let i = 0; i < PLASSER; i++) {
            // Fylles nedenfra: først hele bunnlaget, så neste.
            const lag = Math.floor(i / (LENGDE * BREDDE));
            const rest = i % (LENGDE * BREDDE);
            const lx = rest % LENGDE;
            const lz = Math.floor(rest / LENGDE);
            const mål = i < n ? 1 : 0;
            const s = forste.current ? mål : damp(skala.current[i], mål, 6, dt || 0.016);
            skala.current[i] = s;
            o.position.set(-5.4 + lx * 1.15, 1.9 + lag * 0.9 + (1 - s) * 2, (lz - 1) * 0.95);
            o.scale.set(Math.max(s, 0.001), Math.max(s, 0.001), Math.max(s, 0.001));
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            m.setColorAt(i, farger[i]);
        }
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
        forste.current = false;
    });
    return (
        <group ref={gruppe} position={[-18, 0, 0]}>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[13, 2, 3.4]} />
                <meshStandardMaterial color="#1e3a8a" flatShading />
            </mesh>
            <mesh position={[7.4, 0.6, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[1.7, 1.8, 4]} />
                <meshStandardMaterial color="#1e3a8a" flatShading />
            </mesh>
            <mesh position={[0, -0.25, 0]}>
                <boxGeometry args={[13.2, 0.3, 3.5]} />
                <meshStandardMaterial color="#b91c1c" />
            </mesh>
            <mesh position={[-6.4, 3, 0]}>
                <boxGeometry args={[1.4, 3, 3]} />
                <meshStandardMaterial color="#f1f5f9" flatShading />
            </mesh>
            <mesh position={[-6.4, 3.9, 0]}>
                <boxGeometry args={[1.45, 0.4, 3.05]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <instancedMesh ref={last} args={[undefined, undefined, PLASSER]}>
                <boxGeometry args={[1.08, 0.85, 0.88]} />
                <meshStandardMaterial flatShading />
            </instancedMesh>
        </group>
    );
}

/** Tollbommen: rød og hvit stang over vannet som går opp på beat 1. */
function Bom({ beat, playing }: { beat: number; playing: boolean }) {
    const arm = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const a = arm.current;
        if (!a) return;
        const mål = beat >= 1 ? Math.PI / 2.4 : 0;
        a.rotation.x = damp(a.rotation.x, mål, 2.5, dt || 0.016);
    });
    const striper = Array.from({ length: 8 }, (_, i) => i);
    return (
        <group position={[0, 0, 4.6]}>
            <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.25, 0.3, 4, 10]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
            <group ref={arm} position={[0, 3.6, 0]}>
                {striper.map((i) => (
                    <mesh key={i} position={[0, 0, -0.6 - i * 1.15]}>
                        <boxGeometry args={[0.35, 0.35, 1.15]} />
                        <meshStandardMaterial color={i % 2 === 0 ? '#dc2626' : '#f8fafc'} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

function Kai({ beat, playing }: { beat: number; playing: boolean }) {
    const fabrikker = useRef<(THREE.Group | null)[]>([]);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        fabrikker.current.forEach((f, i) => {
            if (!f) return;
            const antall = beat < 2 ? 0 : beat === 2 ? 3 : 8;
            // Fabrikkene reiser seg én etter én.
            const på = i < antall && tid.current * 2.5 > (beat === 3 ? i - 3 : i);
            const s = damp(f.scale.y, på || (beat > 3 && i < antall) ? 1 : 0.001, 3, dt || 0.016);
            f.scale.set(1, s, 1);
            f.visible = s > 0.02;
        });
    });
    return (
        <group>
            <mesh position={[22, 0.4, -13]}>
                <boxGeometry args={[42, 0.8, 16]} />
                <meshStandardMaterial color="#9ca3af" flatShading />
            </mesh>
            {FABRIKKER.map((f, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        fabrikker.current[i] = g;
                    }}
                    position={[f.x, 0.8, f.z]}
                    scale={[1, 0.001, 1]}
                >
                    <mesh position={[0, 1.4, 0]}>
                        <boxGeometry args={[3.6, 2.8, 3]} />
                        <meshStandardMaterial color="#e5e7eb" flatShading />
                    </mesh>
                    {[-1, 0, 1].map((k) => (
                        <mesh key={k} position={[k * 1.2, 3.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.6, 0.6, 3, 3, 1, false, 0, Math.PI]} />
                            <meshStandardMaterial color="#64748b" flatShading side={THREE.DoubleSide} />
                        </mesh>
                    ))}
                    <mesh position={[1.4, 3.6, -0.9]}>
                        <cylinderGeometry args={[0.25, 0.3, 2, 8]} />
                        <meshStandardMaterial color="#b45309" />
                    </mesh>
                    <mesh position={[0, 1.4, 1.52]}>
                        <planeGeometry args={[2.8, 0.7]} />
                        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.8} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kamera, beat, playing);
    return (
        <>
            <color attach="background" args={['#bcd7ee']} />
            <fog attach="fog" args={['#bcd7ee', 40, 110]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#ffffff', '#3b82f6', 0.6]} />
            <directionalLight position={[10, 25, 15]} intensity={1.5} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0, 0]}>
                <planeGeometry args={[160, 120]} />
                <meshStandardMaterial color="#2f6fa8" emissive="#1d4f80" emissiveIntensity={0.35} roughness={0.6} />
            </mesh>
            <Skip beat={beat} playing={playing} />
            <Bom beat={beat} playing={playing} />
            <Kai beat={beat} playing={playing} />
        </>
    );
}

export function UnipolarSkip({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 45, near: 0.3, far: 250, position: [-24, 7, 18] }}
            >
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {beat === 0 && <Merkelapp key="s0" tekst="1. januar 1995: WTO" />}
                {beat === 1 && <Merkelapp key="s1" tekst="Felles regler, mindre toll" />}
                {beat === 2 && <Merkelapp key="s2" tekst="Desember 2001: Kina blir medlem" />}
                {beat === 3 && <Merkelapp key="s3" tekst="Fabrikkene flytter dit arbeidet er billig" />}
                {beat === 4 && <Merkelapp key="s4" tekst="Kina: verdens fabrikk" />}
            </AnimatePresence>
        </div>
    );
}

function Merkelapp({ tekst }: { tekst: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap bg-white/90 text-slate-900"
        >
            {tekst}
        </motion.div>
    );
}
