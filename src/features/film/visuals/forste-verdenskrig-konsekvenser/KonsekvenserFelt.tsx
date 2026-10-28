import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Slagmarken etter krigen, bygd av enkle former.
 * Modus «stilt»: røyken over et oppgravd felt letner, kanonene står stille. Hvite kors
 * kommer fram, ett for mange av de døde, og sola går opp. Ingen mennesker vises.
 * Modus «haer»: en oppstillingsplass. Hæren marsjerer inn som én blokk (høyst 100 000 mann),
 * og fly, ubåt og stridsvogn blir røde og synker i bakken, ett per beat.
 */

type Modus = 'stilt' | 'haer';

const KRATER = Array.from({ length: 46 }, (_, i) => ({
    x: (frø(i) - 0.5) * 60,
    z: (frø(i + 100) - 0.5) * 50 - 6,
    r: 0.8 + frø(i + 200) * 1.8,
}));
const TRAER = Array.from({ length: 14 }, (_, i) => ({
    x: (frø(i + 300) - 0.5) * 50,
    z: -8 - frø(i + 400) * 20,
    h: 2 + frø(i + 500) * 3,
    tilt: (frø(i + 600) - 0.5) * 0.5,
}));
const KORS = Array.from({ length: 120 }, (_, i) => ({
    x: -14 + (i % 15) * 2,
    z: 2 + Math.floor(i / 15) * 2.2,
}));
const ROYK = Array.from({ length: 18 }, (_, i) => ({
    x: (frø(i + 700) - 0.5) * 36,
    z: -4 - frø(i + 800) * 18,
    s: 2 + frø(i + 900) * 2.5,
    fase: frø(i + 1000) * 6,
}));

/** Soldatene: plass til seks blokker, men bare den første brukes. */
const BLOKKER = 6;
const PER_BLOKK = 48;
const SOLDATER = Array.from({ length: BLOKKER * PER_BLOKK }, (_, i) => {
    const b = Math.floor(i / PER_BLOKK);
    const j = i % PER_BLOKK;
    const bx = (b % 3) * 7 - 7;
    const bz = Math.floor(b / 3) * 7 - 2;
    return { b, x: bx + (j % 8) * 0.7 - 2.45, z: bz + Math.floor(j / 8) * 0.8 - 2 };
});

const FORBUDT = [
    { navn: 'fly', x: 7, beat: 1 },
    { navn: 'ubat', x: 14, beat: 2 },
    { navn: 'vogn', x: 21, beat: 3 },
];

function kameraFor(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'stilt') {
            switch (beat) {
                case 0:
                    return { pos: v(-4 + t * 0.15, 2.4, 16), se: v(0, 2, -6) };
                case 1:
                    return { pos: v(-12 + t * 0.25, 9, 24), se: v(0, 0, 4) };
                default:
                    return { pos: v(0, 14, 32 - t * 0.2), se: v(0, 1, -2) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(-7 + t * 0.15, 5 + t * 0.1, 7), se: v(-7, 0.4, -2) };
            case 1:
                return { pos: v(7 + t * 0.1, 4.6, 9), se: v(7, 2.6, 0) };
            case 2:
                return { pos: v(14 + t * 0.1, 3.2, 8), se: v(14, 1, 0) };
            default:
                return { pos: v(21 + t * 0.1, 3.2, 8), se: v(21, 1, 0) };
        }
    };
}

function Bakke({ modus }: { modus: Modus }) {
    const gjorme = modus === 'stilt';
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0, -4]}>
                <planeGeometry args={[140, 110]} />
                <meshStandardMaterial
                    color={gjorme ? '#6b5a44' : '#7c9a5a'}
                    emissive={gjorme ? '#2a2018' : '#1f2e14'}
                    emissiveIntensity={0.5}
                    roughness={1}
                    flatShading
                />
            </mesh>
            {gjorme &&
                KRATER.map((k, i) => (
                    <mesh key={i} position={[k.x, 0.02, k.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[k.r, k.r, 1]}>
                        <circleGeometry args={[1, 14]} />
                        <meshStandardMaterial color="#3f3326" roughness={1} />
                    </mesh>
                ))}
            {gjorme &&
                TRAER.map((t, i) => (
                    <mesh key={i} position={[t.x, t.h / 2, t.z]} rotation={[0, 0, t.tilt]}>
                        <cylinderGeometry args={[0.08, 0.18, t.h, 5]} />
                        <meshStandardMaterial color="#3b2f25" />
                    </mesh>
                ))}
        </>
    );
}

function Kanon({ x, z, rot }: { x: number; z: number; rot: number }) {
    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            <mesh position={[0, 1.2, 0.6]} rotation={[-Math.PI / 2 + 0.35, 0, 0]}>
                <cylinderGeometry args={[0.16, 0.22, 3, 10]} />
                <meshStandardMaterial color="#3f4a3c" />
            </mesh>
            <mesh position={[0, 0.8, -0.2]}>
                <boxGeometry args={[1.2, 0.6, 1.2]} />
                <meshStandardMaterial color="#4b5545" />
            </mesh>
            {[-0.8, 0.8].map((dx) => (
                <mesh key={dx} position={[dx, 0.7, -0.2]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.7, 0.7, 0.15, 14]} />
                    <meshStandardMaterial color="#5b4636" />
                </mesh>
            ))}
            <mesh position={[0, 0.35, -1.8]} rotation={[0.3, 0, 0]}>
                <boxGeometry args={[0.25, 0.2, 2.6]} />
                <meshStandardMaterial color="#4b5545" />
            </mesh>
        </group>
    );
}

function Royk({ beat, playing }: { beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const mål = beat === 0 ? 0.55 : beat === 1 ? 0.22 : 0.04;
        ROYK.forEach((r, i) => {
            const m = refs.current[i];
            const mat = mats.current[i];
            if (!m || !mat) return;
            m.position.set(r.x + Math.sin(tid.current * 0.2 + r.fase) * 0.8, 2 + ((tid.current * 0.3 + r.fase) % 5), r.z);
            mat.opacity = damp(mat.opacity, mål, 1.2, dt || 0.016);
        });
    });
    return (
        <>
            {ROYK.map((r, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                    scale={r.s}
                >
                    <sphereGeometry args={[1, 10, 8]} />
                    <meshStandardMaterial
                        ref={(m) => {
                            mats.current[i] = m;
                        }}
                        color="#9ca3af"
                        transparent
                        opacity={0.55}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </>
    );
}

/** Hvite kors som reiser seg rad for rad. */
function Kors({ beat, playing }: { beat: number; playing: boolean }) {
    const loddrett = useRef<THREE.InstancedMesh>(null);
    const vannrett = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const a = loddrett.current;
        const b = vannrett.current;
        if (!a || !b) return;
        KORS.forEach((k, i) => {
            const h = beat === 0 ? 0 : beat === 1 ? Math.min(1, Math.max(0, tid.current * 3 - i * 0.04)) : 1;
            const s = Math.max(h, 0.001);
            o.position.set(k.x, 0.6 * s, k.z);
            o.scale.set(1, s, 1);
            o.updateMatrix();
            a.setMatrixAt(i, o.matrix);
            o.position.set(k.x, 0.85 * s, k.z);
            o.scale.set(s, s, s);
            o.updateMatrix();
            b.setMatrixAt(i, o.matrix);
        });
        a.instanceMatrix.needsUpdate = true;
        b.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={loddrett} args={[undefined, undefined, KORS.length]} frustumCulled={false}>
                <boxGeometry args={[0.14, 1.2, 0.1]} />
                <meshStandardMaterial color="#f8fafc" emissive="#e2e8f0" emissiveIntensity={0.35} />
            </instancedMesh>
            <instancedMesh ref={vannrett} args={[undefined, undefined, KORS.length]} frustumCulled={false}>
                <boxGeometry args={[0.6, 0.12, 0.1]} />
                <meshStandardMaterial color="#f8fafc" emissive="#e2e8f0" emissiveIntensity={0.35} />
            </instancedMesh>
        </>
    );
}

function Sol({ beat }: { beat: number }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const mål = beat >= 2 ? 8 : -6;
        m.position.y = damp(m.position.y, mål, 0.8, Math.min(rawDt, 0.05));
    });
    return (
        <mesh ref={ref} position={[10, -6, -60]}>
            <circleGeometry args={[5, 32]} />
            <meshBasicMaterial color="#fde68a" fog={false} />
        </mesh>
    );
}

function Hær({ beat, playing }: { beat: number; playing: boolean }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const o = useMemo(() => new THREE.Object3D(), []);
    const skala = useRef<number[]>(Array(BLOKKER).fill(1));
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        for (let b = 0; b < BLOKKER; b++) {
            // Bare én blokk: artikkelen sier hvor stor hæren fikk være, ikke hvor stor den var før.
            // Den marsjerer inn rad for rad på beat 0.
            skala.current[b] = b > 0 ? 0 : beat > 0 ? 1 : Math.min(1, tid.current * 0.8);
        }
        const k = kropp.current;
        const h = hode.current;
        if (!k || !h) return;
        SOLDATER.forEach((s, i) => {
            const rad = Math.floor((i % PER_BLOKK) / 8);
            const sk = Math.max(Math.min(1, skala.current[s.b] * 6 - rad), 0.001);
            o.position.set(s.x, 0.45 * sk, s.z);
            o.scale.set(sk, sk, sk);
            o.updateMatrix();
            k.setMatrixAt(i, o.matrix);
            o.position.set(s.x, 1.05 * sk, s.z);
            o.updateMatrix();
            h.setMatrixAt(i, o.matrix);
        });
        k.instanceMatrix.needsUpdate = true;
        h.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, SOLDATER.length]} frustumCulled={false}>
                <boxGeometry args={[0.36, 0.9, 0.26]} />
                <meshStandardMaterial color="#64705a" flatShading />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, SOLDATER.length]} frustumCulled={false}>
                <sphereGeometry args={[0.17, 8, 6]} />
                <meshStandardMaterial color="#4b5545" />
            </instancedMesh>
        </>
    );
}

/** Ting som blir forbudt: blir røde på sin beat og synker i bakken. */
function Forbudt({ beat, playing }: { beat: number; playing: boolean }) {
    const grupper = useRef<(THREE.Group | null)[]>([]);
    const dybde = useRef([0, 0, 0]);
    const kryss = useRef<(THREE.Group | null)[]>([]);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const d = dt || 0.016;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        FORBUDT.forEach((f, i) => {
            const g = grupper.current[i];
            if (!g) return;
            // Tingen blir rød på sin egen beat og synker i bakken først når neste beat kommer.
            const rod = beat > f.beat || (beat === f.beat && tid.current > 0.8);
            const synk = beat > f.beat;
            const målY = synk ? -4 : 0;
            dybde.current[i] = beat > f.beat ? målY : damp(dybde.current[i], målY, 1.5, d);
            g.position.y = dybde.current[i] + (f.navn === 'fly' ? 3 * (1 + dybde.current[i] / 4) : 0);
            g.visible = beat >= f.beat && dybde.current[i] > -3.9;
            const x = kryss.current[i];
            if (x) x.visible = beat === f.beat && rod;
        });
    });
    return (
        <>
            {FORBUDT.map((f, i) => (
                <group
                    key={f.navn}
                    ref={(g) => {
                        kryss.current[i] = g;
                    }}
                    position={[f.x, f.navn === 'fly' ? 3 : 1.2, 2.2]}
                    visible={false}
                >
                    {[0.75, -0.75].map((r) => (
                        <mesh key={r} rotation={[0, 0, r]}>
                            <boxGeometry args={[4.6, 0.35, 0.2]} />
                            <meshBasicMaterial color="#dc2626" />
                        </mesh>
                    ))}
                </group>
            ))}
            {/* Toplansfly */}
            <group
                ref={(g) => {
                    grupper.current[0] = g;
                }}
                position={[FORBUDT[0].x, 3, 0]}
                rotation={[0, -0.5, 0]}
            >
                <mesh>
                    <boxGeometry args={[0.6, 0.6, 3.4]} />
                    <meshStandardMaterial color="#a16207" />
                </mesh>
                {[0.5, -0.4].map((y) => (
                    <mesh key={y} position={[0, y, 0.5]}>
                        <boxGeometry args={[5, 0.08, 0.9]} />
                        <meshStandardMaterial color="#ca8a04" />
                    </mesh>
                ))}
                <mesh position={[0, 0.3, -1.6]}>
                    <boxGeometry args={[1.6, 0.06, 0.6]} />
                    <meshStandardMaterial color="#ca8a04" />
                </mesh>
                <mesh position={[0, 0, 1.75]}>
                    <boxGeometry args={[1.4, 0.12, 0.05]} />
                    <meshStandardMaterial color="#44403c" />
                </mesh>
            </group>
            {/* Ubåt */}
            <group
                ref={(g) => {
                    grupper.current[1] = g;
                }}
                position={[FORBUDT[1].x, 0, 0]}
                rotation={[0, -0.4, 0]}
            >
                <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]}>
                    <capsuleGeometry args={[0.7, 4.2, 6, 14]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
                <mesh position={[0, 1.8, 0.4]}>
                    <boxGeometry args={[0.5, 0.9, 1.2]} />
                    <meshStandardMaterial color="#334155" />
                </mesh>
            </group>
            {/* Stridsvogn, slik de så ut i første verdenskrig */}
            <group
                ref={(g) => {
                    grupper.current[2] = g;
                }}
                position={[FORBUDT[2].x, 0, 0]}
                rotation={[0, -0.6, 0]}
            >
                {[-0.9, 0.9].map((x) => (
                    <mesh key={x} position={[x, 0.9, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <extrudeGeometry args={[ruteform(), { depth: 0.5, bevelEnabled: false }]} />
                        <meshStandardMaterial color="#57534e" flatShading />
                    </mesh>
                ))}
                <mesh position={[0, 1.1, 0]}>
                    <boxGeometry args={[1.4, 1.1, 2.4]} />
                    <meshStandardMaterial color="#78716c" />
                </mesh>
            </group>
        </>
    );
}

/** Siden av en stridsvogn fra første verdenskrig: en avlang rombe. */
function ruteform() {
    const s = new THREE.Shape();
    s.moveTo(-2.2, -0.2);
    s.lineTo(1.4, -0.9);
    s.lineTo(2.4, 0.4);
    s.lineTo(1.8, 0.9);
    s.lineTo(-1.6, 0.9);
    s.lineTo(-2.6, 0.2);
    s.closePath();
    return s;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const mål = useMemo(() => kameraFor(modus), [modus]);
    useKamera(mål, beat, playing);
    const stilt = modus === 'stilt';
    const himmel = stilt ? (beat >= 2 ? '#e8d6b0' : beat === 1 ? '#a8a29e' : '#78716c') : '#bcd4e6';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 30, stilt ? 75 : 90]} />
            <ambientLight intensity={stilt ? 0.8 : 1} />
            <hemisphereLight args={[stilt ? '#fef3c7' : '#e0f2fe', '#3f3326', 0.6]} />
            <directionalLight position={[10, 18, 10]} intensity={stilt && beat < 2 ? 0.7 : 1.3} color={stilt ? '#fde68a' : '#ffffff'} />
            <Bakke modus={modus} />
            {stilt && (
                <>
                    <Kanon x={-6} z={-2} rot={0.3} />
                    <Kanon x={5} z={-6} rot={-0.4} />
                    <Royk beat={beat} playing={playing} />
                    <Kors beat={beat} playing={playing} />
                    <Sol beat={beat} />
                </>
            )}
            {!stilt && (
                <>
                    <Hær beat={beat} playing={playing} />
                    <Forbudt beat={beat} playing={playing} />
                </>
            )}
        </>
    );
}

const FORBUDSLISTE = ['Flyvåpen', 'Ubåter', 'Tunge stridsvogner'];

export function KonsekvenserFelt({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'stilt';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const stilt = modus === 'stilt';
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 45, near: 0.3, far: 200, position: [0, 6, 20] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {stilt && beat === 0 && <Merkelapp key="s0" tekst="11. november 1918" />}
                {stilt && beat === 1 && <Merkelapp key="s1" tekst="Millioner av unge menn døde" />}
                {stilt && beat === 2 && <Merkelapp key="s2" tekst="Krigen er over" />}
                {!stilt && beat === 0 && <Merkelapp key="h0" tekst="Høyst 100 000 mann" />}
            </AnimatePresence>
            {!stilt && (
                <div className="absolute flex gap-3" style={{ bottom: '5%', left: '50%', transform: 'translateX(-50%)' }}>
                    {FORBUDSLISTE.map((t, i) =>
                        beat >= i + 1 ? (
                            <motion.div
                                key={t}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: beat === i + 1 ? 1 : 0 }}
                                className="px-4 py-2 rounded-xl bg-white/95 shadow-lg font-bold text-2xl text-red-700 whitespace-nowrap"
                            >
                                ✗ {t}
                            </motion.div>
                        ) : null
                    )}
                </div>
            )}
        </div>
    );
}

function Merkelapp({ tekst }: { tekst: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl bg-white/90 text-slate-900 font-display font-bold text-4xl whitespace-nowrap"
        >
            {tekst}
        </motion.div>
    );
}
