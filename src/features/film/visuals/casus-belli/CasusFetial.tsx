import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Fetialen ved grensen. Grensen går langs x-aksen ved z = 0: Roma ligger på +z, naboen på -z.
 * Beat 0: presten går fram til grensesteinen. 1: han roper kravet over grensen.
 * 2: Roma venter (sola går over himmelen, dag etter dag). 3: spydet kastes over grensen.
 * 4: kameraet trekker seg tilbake, og lyset blir gyllent: krigen er «rettferdig».
 */

const STEIN: [number, number, number] = [1.3, 0, 0.5];
const PREST_Z = 1.9;
const SPYD_LAND: [number, number, number] = [-0.3, 0, -5.5];

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Enkelt tilfeldig tall med frø, så landskapet ser likt ut hver gang. */
function fro(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function kameraFor(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(9 - t * 0.15, 4.5, 15 - t * 0.3), se: v(0, 1.2, 2) };
        case 1:
            return { pos: v(4.6, 2.1, 5.2), se: v(0, 1.6, 1.2) };
        case 2:
            return { pos: v(-11, 5, 11 + t * 0.1), se: v(0, 3, -3) };
        case 3:
            return { pos: v(8, 3.6, 4.5), se: v(0, 2, -2) };
        default:
            return { pos: v(13 + t * 0.2, 11, 17 + t * 0.2), se: v(0, 0, -3) };
    }
}

/** Hvor presten står: går fram i beat 0, står ved steinen etterpå. */
function prestZ(beat: number, t: number) {
    if (beat > 0) return PREST_Z;
    return THREE.MathUtils.lerp(9, PREST_Z, Math.min(1, t / 4.5));
}

/** Spydets bane i beat 3: fra hånda, i en bue over grensen, og ned i bakken. */
function spydFor(beat: number, t: number) {
    const hand = v(0.45, 2.15, PREST_Z - 0.1);
    const land = v(SPYD_LAND[0], 0.9, SPYD_LAND[2]);
    if (beat < 3) return { pos: hand, vinkel: 0.35, kastet: false };
    const u = beat > 3 ? 1 : THREE.MathUtils.clamp((t - 0.9) / 1.6, 0, 1);
    const pos = hand.clone().lerp(land, u);
    pos.y += Math.sin(u * Math.PI) * 4;
    // Spissen peker framover og litt opp, så nedover på slutten.
    const vinkel = THREE.MathUtils.lerp(0.6, -0.9, u);
    return { pos, vinkel, kastet: u > 0 };
}

function Landskap() {
    const steiner = useMemo(
        () =>
            Array.from({ length: 70 }, (_, i) => ({
                x: (fro(i) - 0.5) * 70,
                z: (fro(i + 40) - 0.5) * 70,
                s: 0.3 + fro(i + 80) * 1.1,
            })).filter((s) => Math.abs(s.x) > 3 || Math.abs(s.z) > 4),
        []
    );
    const ref = useRef<THREE.InstancedMesh>(null);
    const ferdig = useRef(false);
    useFrame(() => {
        const m = ref.current;
        if (!m || ferdig.current) return;
        const o = new THREE.Object3D();
        steiner.forEach((s, i) => {
            o.position.set(s.x, s.s * 0.3, s.z);
            o.scale.setScalar(s.s);
            o.rotation.set(fro(i) * 3, fro(i + 3) * 3, 0);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
        ferdig.current = true;
    });
    return (
        <>
            {/* Romas side og naboens side */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 50]}>
                <planeGeometry args={[300, 100]} />
                <meshStandardMaterial color="#a39a6e" roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -50]}>
                <planeGeometry args={[300, 100]} />
                <meshStandardMaterial color="#8f9a6a" roughness={1} />
            </mesh>
            {/* Grenselinja: en rad med små steiner */}
            {Array.from({ length: 26 }, (_, i) => (
                <mesh key={i} position={[-26 + i * 2, 0.12, 0]}>
                    <boxGeometry args={[0.5, 0.24, 0.4]} />
                    <meshStandardMaterial color="#e7e0cc" flatShading />
                </mesh>
            ))}
            {/* Grensesteinen */}
            <mesh position={[STEIN[0], 0.55, STEIN[2]]}>
                <boxGeometry args={[0.6, 1.1, 0.5]} />
                <meshStandardMaterial
                    color="#d6cfbd"
                    emissive="#d6cfbd"
                    emissiveIntensity={0.15}
                    flatShading
                />
            </mesh>
            <instancedMesh ref={ref} args={[undefined, undefined, steiner.length]}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#9c9480" flatShading />
            </instancedMesh>
            {/* Naboens landsby, langt borte */}
            {Array.from({ length: 7 }, (_, i) => (
                <group key={i} position={[-12 + i * 3.6, 0, -30 - (i % 2) * 4]}>
                    <mesh position={[0, 0.9, 0]}>
                        <boxGeometry args={[2.2, 1.8, 2]} />
                        <meshStandardMaterial color="#cbb894" flatShading />
                    </mesh>
                    <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 4, 0]}>
                        <coneGeometry args={[1.8, 1.1, 4]} />
                        <meshStandardMaterial color="#8a5a3b" flatShading />
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** Presten i toga med rød stripe. Hånda holder spydet til det kastes. */
function Prest({ beat, beatTid }: { beat: number; beatTid: React.RefObject<number> }) {
    const ref = useRef<THREE.Group>(null);
    const arm = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const t = beatTid.current ?? 0;
        const z = prestZ(beat, t);
        g.position.z = beat === 0 ? z : damp(g.position.z, z, 4, Math.min(rawDt, 0.05));
        // Gange: litt opp og ned mens han går.
        const gar = beat === 0 && t < 4.5;
        g.position.y = gar ? Math.abs(Math.sin(t * 6)) * 0.06 : 0;
        if (arm.current) {
            const mal =
                beat === 1
                    ? -1.1
                    : beat === 3 && t > 0.4 && t < 1.2
                      ? -2.2
                      : beat >= 3
                        ? -0.6
                        : -0.3;
            arm.current.rotation.x = damp(arm.current.rotation.x, mal, 6, Math.min(rawDt, 0.05));
        }
    });
    return (
        <group ref={ref} position={[0, 0, 9]} rotation={[0, Math.PI, 0]}>
            <mesh position={[0, 0.85, 0]}>
                <cylinderGeometry args={[0.28, 0.5, 1.7, 10]} />
                <meshStandardMaterial color="#efe6cf" flatShading />
            </mesh>
            <mesh position={[0.12, 1.1, -0.29]} rotation={[0, 0, 0.5]}>
                <boxGeometry args={[0.1, 1.3, 0.04]} />
                <meshStandardMaterial color="#9b2c2c" />
            </mesh>
            <mesh position={[0, 1.95, 0]}>
                <sphereGeometry args={[0.22, 14, 10]} />
                <meshStandardMaterial color="#d9a77f" flatShading />
            </mesh>
            <group ref={arm} position={[-0.3, 1.6, 0]}>
                <mesh position={[0, -0.3, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, 0.6, 6]} />
                    <meshStandardMaterial color="#d9a77f" />
                </mesh>
            </group>
        </group>
    );
}

function Spyd({ beat, beatTid }: { beat: number; beatTid: React.RefObject<number> }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        const g = ref.current;
        if (!g) return;
        const s = spydFor(beat, beatTid.current ?? 0);
        // I hånda følger spydet presten.
        if (!s.kastet) s.pos.z = prestZ(beat, beatTid.current ?? 0) - 0.1;
        g.position.copy(s.pos);
        g.rotation.set(s.vinkel, 0, 0);
    });
    return (
        <group ref={ref}>
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.07, 0.07, 2.6, 8]} />
                    <meshStandardMaterial
                        color="#5a3416"
                        emissive="#5a3416"
                        emissiveIntensity={0.3}
                    />
                </mesh>
                <mesh position={[0, 1.45, 0]}>
                    <coneGeometry args={[0.16, 0.5, 8]} />
                    <meshStandardMaterial color="#8a8f98" metalness={0.4} roughness={0.4} />
                </mesh>
            </group>
        </group>
    );
}

/** Sola: står stille, men i beat 2 går den over himmelen igjen og igjen (dagene går). */
function Sol({ beat, beatTid }: { beat: number; beatTid: React.RefObject<number> }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        const t = beatTid.current ?? 0;
        const u = beat === 2 ? (t / 1.6) % 1 : 0.35;
        const a = Math.PI * (0.1 + u * 0.8);
        m.position.set(Math.cos(a) * 60, Math.sin(a) * 30 + 2, -60);
    });
    return (
        <mesh ref={ref}>
            <sphereGeometry args={[3, 16, 12]} />
            <meshBasicMaterial color="#fff3c4" />
        </mesh>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const lys = useRef<THREE.HemisphereLight>(null);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
        if (lys.current) {
            const mal = beat >= 4 ? 1.5 : 1.05;
            lys.current.intensity = damp(lys.current.intensity, mal, 1.5, dt || 0.016);
        }
    });
    const gyllen = beat >= 4;
    return (
        <>
            <color attach="background" args={[gyllen ? '#f6d9a0' : '#bcd6ea']} />
            <fog attach="fog" args={[gyllen ? '#f6d9a0' : '#bcd6ea', 30, 95]} />
            <hemisphereLight ref={lys} args={['#fff6e0', '#6b5b3e', 1.05]} />
            <directionalLight
                position={[12, 20, 8]}
                intensity={gyllen ? 1.6 : 1.2}
                color={gyllen ? '#ffd27a' : '#ffffff'}
            />
            <Landskap />
            <Sol beat={beat} beatTid={beatTid} />
            <Prest beat={beat} beatTid={beatTid} />
            <Spyd beat={beat} beatTid={beatTid} />
            {(beat === 0 || beat >= 4) && (
                <>
                    <Html position={[-6, 0.5, 6]} center zIndexRange={[10, 0]}>
                        <Merkelapp tekst="Roma" farge="#9b2c2c" />
                    </Html>
                    <Html position={[-6, 0.5, -8]} center zIndexRange={[10, 0]}>
                        <Merkelapp tekst="Naboen" farge="#3f6212" />
                    </Html>
                </>
            )}
        </>
    );
}

function Merkelapp({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <div
            className="px-4 py-1 rounded-xl bg-white/90 font-black shadow-lg whitespace-nowrap"
            style={{ color: farge, fontSize: '1.6rem' }}
        >
            {tekst}
        </div>
    );
}

const LAPPER = [
    'Grensen til Roma',
    'Kravet: gjør det godt igjen',
    'Fristen: 30 eller 33 dager',
    'Spydet kastes over grensen',
    'Nå er krigen rettferdig, mener Roma',
];

export function CasusFetial({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapp = LAPPER[Math.min(beat, LAPPER.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [9, 4.5, 15] }}
            >
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="absolute left-[3%] bottom-[5%] px-5 py-3 rounded-2xl bg-slate-900/85 text-white font-bold shadow-xl"
                    style={{ fontSize: '1.65rem' }}
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
            {beat === 1 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute right-[6%] top-[12%] px-6 py-4 rounded-2xl bg-white shadow-2xl font-black text-slate-900"
                    style={{ fontSize: '1.9rem', maxWidth: '38%', lineHeight: 1.2 }}
                >
                    Roma er urettferdig behandlet. Gjør det godt igjen.
                </motion.div>
            )}
            {beat === 2 && <Dager />}
        </div>
    );
}

/** Dager som går: en enkel teller som fylles opp mens sola går over himmelen. */
function Dager() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute right-[5%] top-[8%] px-6 py-4 rounded-2xl bg-white/95 shadow-2xl text-center"
        >
            <div className="font-bold text-slate-500" style={{ fontSize: '1.2rem' }}>
                Roma venter
            </div>
            <div className="font-black text-slate-900 tabular-nums" style={{ fontSize: '2.6rem' }}>
                30 eller 33 dager
            </div>
        </motion.div>
    );
}
