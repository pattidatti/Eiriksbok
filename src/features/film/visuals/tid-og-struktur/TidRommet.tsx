import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Et soverom i 3D, som et dukkehus uten forvegg. «royk»: pangstarten, der et smell vekker
 * oss og rommet fylles av røyk. «glass»: det utvidede øyeblikket, der et glass faller fra
 * bordet i sakte film, roterer i lyset fra vinduet og mister dråpe etter dråpe.
 */

type Modus = 'royk' | 'glass';

const FOV = 42;
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const BORD_Y = 2.1;
const BORDKANT_X = 3.6;
const GLASS_H = 0.8;

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'royk') {
        if (beat === 0) return { pos: v(-4.6, 1.5, 1.5), se: v(2, 2.4, -6) };
        if (beat === 1) return { pos: v(-4.2, 1.7, 2), se: v(4, 3.2, -3) };
        if (beat === 2) return { pos: v(-3.5 + Math.min(t, 8) * 0.2, 1.8, 3), se: v(0, 2.6, -4) };
        return { pos: v(0, 6, 17), se: v(0, 2.2, -2) };
    }
    if (beat === 0)
        return {
            pos: v(8.6 - Math.min(t, 8) * 0.25, 3.9, 7.6 - Math.min(t, 8) * 0.25),
            se: v(2.4, 2, -1.2),
        };
    if (beat === 1) return { pos: v(5.8, 2.9, 3.4), se: v(3.2, 2.4, -0.6) };
    if (beat === 5) return { pos: v(7, 1.6, 4.2), se: v(3.6, 0.9, -0.8) };
    return { pos: v(6.6, 2, 3.6), se: v(3.8, 1.5, -0.8) };
}

function Rom() {
    return (
        <group>
            {/* Gulv, bakvegg og sidevegg */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[16, 12]} />
                <meshStandardMaterial color="#8a5a33" emissive="#3d2412" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, 3.25, -6]}>
                <boxGeometry args={[16, 6.5, 0.2]} />
                <meshStandardMaterial color="#c9d6c8" emissive="#3f4f45" emissiveIntensity={0.35} />
            </mesh>
            <mesh position={[-8, 3.25, 0]}>
                <boxGeometry args={[0.2, 6.5, 12]} />
                <meshStandardMaterial color="#b9c8b8" emissive="#33443a" emissiveIntensity={0.35} />
            </mesh>
            {/* Vinduet: lyset kommer herfra */}
            <mesh position={[3, 3.8, -5.88]}>
                <planeGeometry args={[2.6, 2.4]} />
                <meshStandardMaterial color="#fff7d6" emissive="#fde68a" emissiveIntensity={1.1} />
            </mesh>
            <mesh position={[3, 3.8, -5.85]}>
                <boxGeometry args={[0.12, 2.4, 0.05]} />
                <meshStandardMaterial color="#5b4636" />
            </mesh>
            <mesh position={[3, 3.8, -5.85]}>
                <boxGeometry args={[2.6, 0.12, 0.05]} />
                <meshStandardMaterial color="#5b4636" />
            </mesh>
            {/* Senga */}
            <mesh position={[-5.4, 0.45, -3]}>
                <boxGeometry args={[4, 0.9, 2.6]} />
                <meshStandardMaterial color="#6b4f3a" />
            </mesh>
            <mesh position={[-5.4, 1.0, -3]}>
                <boxGeometry args={[3.8, 0.3, 2.4]} />
                <meshStandardMaterial color="#e2e8f0" emissive="#64748b" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[-3.6, 1.2, -3]}>
                <boxGeometry args={[0.2, 2.4, 2.6]} />
                <meshStandardMaterial color="#6b4f3a" />
            </mesh>
            {/* Bordet */}
            <mesh position={[2, BORD_Y - 0.08, -0.8]}>
                <boxGeometry args={[3.2, 0.16, 1.8]} />
                <meshStandardMaterial color="#7c4a26" emissive="#2b170a" emissiveIntensity={0.4} />
            </mesh>
            {[
                [0.6, -1.5],
                [3.4, -1.5],
                [0.6, -0.1],
                [3.4, -0.1],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, (BORD_Y - 0.16) / 2, z]}>
                    <boxGeometry args={[0.14, BORD_Y - 0.16, 0.14]} />
                    <meshStandardMaterial color="#5b3416" />
                </mesh>
            ))}
        </group>
    );
}

const ROYK_ANTALL = 48;
function Royk({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const frø = useMemo(
        () =>
            Array.from({ length: ROYK_ANTALL }, (_, i) => ({
                x: -6.5 + ((i * 37) % 130) / 10,
                y: 3.2 + ((i * 17) % 25) / 10,
                z: -5 + ((i * 23) % 70) / 10,
                s: 0.9 + ((i * 7) % 10) / 10,
                f: i * 0.7,
            })),
        []
    );
    const tid = useRef(0);
    const tetthet = useRef(-1);
    useFrame((_, delta) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        const mal = beat === 0 ? 0.55 : 1;
        tetthet.current = tetthet.current < 0 ? mal : damp(tetthet.current, mal, 0.8, dt);
        frø.forEach((f, i) => {
            const synlig = i / ROYK_ANTALL < tetthet.current;
            o.position.set(
                f.x + Math.sin(tid.current * 0.2 + f.f) * 0.6,
                f.y + Math.sin(tid.current * 0.3 + f.f) * 0.2,
                f.z
            );
            o.scale.setScalar(synlig ? f.s * (1 + tetthet.current * 0.4) : 0.001);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, ROYK_ANTALL]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
                color="#9ca3af"
                emissive="#4b5563"
                emissiveIntensity={0.5}
                transparent
                opacity={0.42}
                depthWrite={false}
                flatShading
            />
        </instancedMesh>
    );
}

/** Smellet: et kort, kraftig lys som dør ut i begynnelsen av første replikk. */
function Smell({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.PointLight>(null);
    const t = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, delta) => {
        if (beat !== forrige.current) {
            forrige.current = beat;
            t.current = 0;
        }
        t.current += playing ? Math.min(delta, 0.05) : 0;
        if (ref.current)
            ref.current.intensity = beat === 0 ? 120 * Math.exp(-t.current * 2.2) + 4 : 4;
    });
    return (
        <pointLight ref={ref} position={[2, 4, -3]} color="#ffedd5" intensity={4} distance={30} />
    );
}

/** Glasset: faller sakte fra bordkanten, roterer og mister dråper. */
const DRAPER = 14;
function Glasset({ beat, playing }: { beat: number; playing: boolean }) {
    const glass = useRef<THREE.Group>(null);
    const drapene = useRef<THREE.InstancedMesh>(null);
    const glimt = useRef<THREE.PointLight>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const retning = useMemo(
        () =>
            Array.from({ length: DRAPER }, (_, i) => {
                const a = (i / DRAPER) * Math.PI * 2;
                return v(Math.cos(a) * 0.5, 0.25 + ((i * 7) % 5) / 10, Math.sin(a) * 0.5);
            }),
        []
    );
    const tid = useRef(0);
    const spredning = useRef(0);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const g = glass.current;
        if (!g) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        const paBordet = BORD_Y + GLASS_H / 2;
        const mal =
            beat < 2
                ? { x: BORDKANT_X - 0.35, y: paBordet, rot: beat === 1 ? 0.08 : 0 }
                : [
                      { x: BORDKANT_X + 0.4, y: 2.05, rot: 0.6 },
                      { x: BORDKANT_X + 0.55, y: 1.5, rot: 1.3 },
                      { x: BORDKANT_X + 0.65, y: 1.0, rot: 1.9 },
                      { x: BORDKANT_X + 0.7, y: 0.6, rot: 2.3 },
                  ][Math.min(beat - 2, 3)];
        if (forste.current) {
            g.position.set(mal.x, mal.y, -0.4);
            g.rotation.z = -mal.rot;
            forste.current = false;
        }
        // Sakte film: alt glir langsomt mot målet for replikken.
        g.position.x = damp(g.position.x, mal.x, 0.7, dt);
        g.position.y = damp(g.position.y, mal.y, 0.7, dt);
        g.rotation.z = damp(g.rotation.z, -mal.rot, 0.7, dt);
        if (glimt.current) {
            glimt.current.position.set(g.position.x - 0.6, g.position.y + 0.6, 0.4);
            glimt.current.intensity = beat >= 3 ? 6 + Math.sin(tid.current * 2.4) * 4 : 0;
        }
        const m = drapene.current;
        if (!m) return;
        spredning.current = damp(spredning.current, beat >= 4 ? 1 : beat === 3 ? 0.25 : 0, 0.6, dt);
        retning.forEach((r, i) => {
            const vis = spredning.current > 0.05 && i / DRAPER < spredning.current + 0.1;
            o.position.set(
                g.position.x + r.x * spredning.current * 1.6,
                g.position.y + r.y * spredning.current * 1.4 + 0.2,
                g.position.z + r.z * spredning.current * 1.6
            );
            o.scale.setScalar(vis ? 0.07 + (i % 3) * 0.02 : 0.001);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <group ref={glass}>
                <mesh>
                    <cylinderGeometry args={[0.3, 0.24, GLASS_H, 24, 1, true]} />
                    <meshStandardMaterial
                        color="#e0f2fe"
                        emissive="#bae6fd"
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.45}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
                <mesh position={[0, -GLASS_H / 2 + 0.03, 0]}>
                    <cylinderGeometry args={[0.24, 0.24, 0.06, 24]} />
                    <meshStandardMaterial color="#e0f2fe" transparent opacity={0.6} />
                </mesh>
                <mesh position={[0, -0.12, 0]}>
                    <cylinderGeometry args={[0.26, 0.23, 0.5, 24]} />
                    <meshStandardMaterial
                        color="#38bdf8"
                        emissive="#0284c7"
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.7}
                    />
                </mesh>
            </group>
            <instancedMesh ref={drapene} args={[undefined, undefined, DRAPER]}>
                <sphereGeometry args={[1, 10, 8]} />
                <meshStandardMaterial color="#7dd3fc" emissive="#0ea5e9" emissiveIntensity={0.9} />
            </instancedMesh>
            <pointLight ref={glimt} color="#fff7d6" intensity={0} distance={5} />
        </>
    );
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const se = useRef(new THREE.Vector3());
    const forrigeBeat = useRef(-1);
    const beatTid = useRef(0);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const k = kameraFor(modus, beat, beatTid.current);
        if (forste.current) {
            camera.position.copy(k.pos);
            se.current.copy(k.se);
            forste.current = false;
        } else {
            const f = 1 - Math.exp(-1.1 * dt);
            camera.position.lerp(k.pos, f);
            se.current.lerp(k.se, f);
        }
        camera.lookAt(se.current);
    });
    return null;
}

interface Merke {
    fraBeat: number;
    tilBeat?: number;
    tekst: string;
    x: number;
    y: number;
    tone: 'lys' | 'mork' | 'gull';
}

const MERKER: Record<Modus, Merke[]> = {
    royk: [
        { fraBeat: 1, tilBeat: 1, tekst: 'Hvem?', x: 5, y: 8, tone: 'lys' },
        { fraBeat: 1, tilBeat: 1, tekst: 'Hvor?', x: 23, y: 8, tone: 'lys' },
        { fraBeat: 1, tilBeat: 1, tekst: 'Hva har skjedd?', x: 41, y: 8, tone: 'lys' },
        { fraBeat: 2, tilBeat: 2, tekst: 'Du vil vite mer', x: 5, y: 7, tone: 'mork' },
        { fraBeat: 3, tekst: 'Midt i noe, uten forklaring', x: 5, y: 7, tone: 'gull' },
    ],
    glass: [
        { fraBeat: 1, tilBeat: 1, tekst: '1 sekund, tusen tanker', x: 5, y: 7, tone: 'mork' },
        { fraBeat: 2, tilBeat: 4, tekst: 'Sakte film', x: 5, y: 7, tone: 'mork' },
        { fraBeat: 5, tekst: 'Utvidet øyeblikk', x: 5, y: 7, tone: 'gull' },
    ],
};

const TONE: Record<Merke['tone'], string> = {
    lys: 'bg-white/95 text-slate-900',
    mork: 'bg-slate-900/90 text-white',
    gull: 'bg-amber-300/95 text-slate-900',
};

export function TidRommet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'royk';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = MERKER[modus].filter(
        (m) => beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat)
    );
    const royk = modus === 'royk';
    const himmel = royk ? '#1f2430' : '#2a2f3a';
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: FOV, position: [0, 4, 14] }}
            >
                <color attach="background" args={[himmel]} />
                <fog attach="fog" args={[himmel, royk ? 14 : 22, royk ? 40 : 60]} />
                <hemisphereLight args={[royk ? '#cbd5e1' : '#fff7e6', '#2b1d12', royk ? 0.6 : 1]} />
                <directionalLight
                    position={[3, 6, -4]}
                    intensity={royk ? 0.6 : 1.6}
                    color="#fff1cc"
                />
                <directionalLight position={[8, 8, 10]} intensity={0.6} />
                <Kamera modus={modus} beat={beat} playing={playing} />
                <Rom />
                {royk ? (
                    <>
                        <Smell beat={beat} playing={playing} />
                        <Royk beat={beat} playing={playing} />
                    </>
                ) : (
                    <Glasset beat={beat} playing={playing} />
                )}
            </Canvas>
            <AnimatePresence>
                {merker.map((m, i) => (
                    <motion.div
                        key={m.tekst}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.5 }}
                        className={`absolute rounded-2xl shadow-xl px-5 py-3 text-3xl font-black ${TONE[m.tone]}`}
                        style={{
                            left: `${m.x}%`,
                            top: `${m.y}%`,
                            fontFamily: 'Outfit, Inter, sans-serif',
                        }}
                    >
                        {m.tekst}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
