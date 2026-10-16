import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Kassettbåndene som veltet en konge. Ett bånd blir spilt inn ved en mikrofon i Frankrike,
 * smugles over grensen, kopieres ved moskeene til det ligger hundrevis av dem, og havner i
 * husene der lyset er tent. Til slutt trekker kameraet seg ut over et helt landskap av bånd.
 *
 * Beat 0: innspilling. 1: smuglet over grensen. 2: kopiert fra moské til moské.
 * 3: hørt i kjellere og bakgårder. 4: budskapet. 5: revolusjon ledet med lydopptak.
 */

const GRENSE_X = -18;
const ANTALL_KOPIER = 260;
const MOSKEER: [number, number][] = [
    [0, -6],
    [14, 10],
    [26, -12],
    [36, 8],
    [8, 22],
    [44, -24],
];
const HUS_ANTALL = 70;

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Hvor hovedkassetten står ved hver beat. */
function kassettPos(beat: number) {
    if (beat === 0) return v(-34, 2.2, 0);
    if (beat === 1) return v(-8, 2.2, 0);
    return v(-3, 2.2, 2);
}

function kameraFor(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(-29 - t * 0.12, 6, 9), se: v(-35, 2, 0) };
        case 1:
            return { pos: v(-20 + t * 0.5, 9, 20), se: v(-14, 1.5, 0) };
        case 2:
            return { pos: v(-6 + t * 0.4, 18, 34), se: v(16, 0, 0) };
        case 3:
            return { pos: v(4 + t * 0.4, 34, 54), se: v(18, 0, -2) };
        case 4:
            return { pos: v(3, 5.5, 12), se: v(1.5, 2.4, 2) };
        default:
            return { pos: v(-30 - t * 0.3, 52, 74), se: v(14, 0, -4) };
    }
}

/** Hvor mange kopier som ligger ute ved hver beat. */
function kopierFor(beat: number) {
    if (beat < 2) return 0;
    if (beat === 2) return 70;
    return ANTALL_KOPIER;
}

function Kamera({ beat, playing }: { beat: number; playing: boolean }) {
    const tid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const m = kameraFor(beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

/** Ett kassettbånd: svart skall, hvit etikett, vindu og to spoler som går rundt. */
function Kassett({ beat, playing }: { beat: number; playing: boolean }) {
    const gruppe = useRef<THREE.Group>(null);
    const spoler = useRef<THREE.Group[]>([]);
    const forste = useRef(true);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const g = gruppe.current;
        if (!g) return;
        const mål = kassettPos(beat);
        if (forste.current) g.position.copy(mål);
        else g.position.lerp(mål, 1 - Math.exp(-1.2 * dt));
        forste.current = false;
        // Under smuglingen vugger båndet litt, som i en bag.
        g.rotation.z = beat === 1 ? Math.sin(tid.current * 3) * 0.06 : 0;
        for (const s of spoler.current) if (s) s.rotation.z -= dt * 2.4;
    });
    return (
        <group ref={gruppe} rotation={[-0.35, 0, 0]}>
            <mesh>
                <boxGeometry args={[4.4, 2.8, 0.5]} />
                <meshStandardMaterial
                    color="#1f2937"
                    emissive="#111827"
                    emissiveIntensity={0.4}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 0.35, 0.26]}>
                <boxGeometry args={[3.8, 1.5, 0.02]} />
                <meshStandardMaterial color="#fef3c7" emissive="#fde68a" emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, 0.25, 0.28]}>
                <boxGeometry args={[2.4, 0.75, 0.02]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 0.85, 0.28]}>
                <boxGeometry args={[3.2, 0.12, 0.02]} />
                <meshStandardMaterial color="#16a34a" />
            </mesh>
            {[-0.75, 0.75].map((x, i) => (
                <group
                    key={x}
                    position={[x, 0.25, 0.3]}
                    ref={(el) => {
                        if (el) spoler.current[i] = el;
                    }}
                >
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.3, 0.3, 0.04, 6]} />
                        <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                    <mesh position={[0, 0, 0.03]}>
                        <boxGeometry args={[0.5, 0.08, 0.02]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                </group>
            ))}
            <mesh position={[0, -1.05, 0.2]}>
                <boxGeometry args={[2.8, 0.5, 0.2]} />
                <meshStandardMaterial color="#374151" flatShading />
            </mesh>
        </group>
    );
}

/** Bordet og mikrofonen i Frankrike. */
function Studio() {
    return (
        <group position={[-34, 0, 0]}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[9, 1, 6]} />
                <meshStandardMaterial color="#92400e" flatShading />
            </mesh>
            <group position={[-3.2, 1, -1]}>
                <mesh position={[0, 1.2, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 2.4, 8]} />
                    <meshStandardMaterial color="#9ca3af" />
                </mesh>
                <mesh position={[0, 2.7, 0]}>
                    <sphereGeometry args={[0.45, 14, 10]} />
                    <meshStandardMaterial
                        color="#374151"
                        emissive="#1f2937"
                        emissiveIntensity={0.3}
                    />
                </mesh>
                <mesh position={[0, 0.05, 0]}>
                    <cylinderGeometry args={[0.6, 0.6, 0.1, 16]} />
                    <meshStandardMaterial color="#4b5563" />
                </mesh>
            </group>
        </group>
    );
}

/** Grensen: en rekke røde og hvite stolper på tvers av bakken. */
function Grense() {
    return (
        <group position={[GRENSE_X, 0, 0]}>
            {Array.from({ length: 21 }, (_, i) => (
                <mesh key={i} position={[0, 1, -40 + i * 4]}>
                    <boxGeometry args={[0.5, 2, 0.5]} />
                    <meshStandardMaterial
                        color={i % 2 === 0 ? '#dc2626' : '#f8fafc'}
                        emissive={i % 2 === 0 ? '#7f1d1d' : '#94a3b8'}
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}

function Moske({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[4, 3, 4]} />
                <meshStandardMaterial
                    color="#f5f5f4"
                    emissive="#a8a29e"
                    emissiveIntensity={0.2}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 3, 0]}>
                <sphereGeometry args={[1.8, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial
                    color="#0d9488"
                    emissive="#115e59"
                    emissiveIntensity={0.35}
                    flatShading
                />
            </mesh>
            <mesh position={[2.6, 3, -1.6]}>
                <cylinderGeometry args={[0.3, 0.35, 6, 8]} />
                <meshStandardMaterial color="#f5f5f4" flatShading />
            </mesh>
            <mesh position={[2.6, 6.3, -1.6]}>
                <coneGeometry args={[0.45, 0.9, 8]} />
                <meshStandardMaterial color="#0d9488" />
            </mesh>
        </group>
    );
}

/** Husene i landskapet. Vinduene lyser når folk sitter og lytter. */
function Hus({ lys, playing }: { lys: boolean; playing: boolean }) {
    const vegger = useRef<THREE.InstancedMesh>(null);
    const vinduer = useRef<THREE.InstancedMesh>(null);
    const styrke = useRef(lys ? 1 : 0);
    const plass = useMemo(
        () =>
            Array.from({ length: HUS_ANTALL }, (_, i) => {
                const x = -10 + frø(i * 3 + 1) * 66;
                const z = -34 + frø(i * 3 + 2) * 60;
                const s = 1.4 + frø(i * 3 + 3) * 1.2;
                return { x, z, s };
            }).filter(
                (h) =>
                    MOSKEER.every(([mx, mz]) => Math.hypot(h.x - mx, h.z - mz) > 5) &&
                    Math.hypot(h.x + 3, h.z - 2) > 6
            ),
        []
    );
    const m = useMemo(() => new THREE.Matrix4(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0.016;
        styrke.current = damp(styrke.current, lys ? 1 : 0, 2, dt);
        const vg = vegger.current;
        const vi = vinduer.current;
        if (!vg || !vi) return;
        plass.forEach((h, i) => {
            m.makeScale(h.s, h.s, h.s).setPosition(h.x, h.s / 2, h.z);
            vg.setMatrixAt(i, m);
            const ss = 0.001 + styrke.current;
            m.makeScale(h.s * 0.45 * ss, h.s * 0.35 * ss, 0.05).setPosition(
                h.x,
                h.s * 0.55,
                h.z + h.s / 2 + 0.03
            );
            vi.setMatrixAt(i, m);
        });
        vg.instanceMatrix.needsUpdate = true;
        vi.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={vegger} args={[undefined, undefined, plass.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color="#e7d3a8"
                    emissive="#7c5a26"
                    emissiveIntensity={0.12}
                    flatShading
                />
            </instancedMesh>
            <instancedMesh ref={vinduer} args={[undefined, undefined, plass.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.2} />
            </instancedMesh>
        </>
    );
}

/** Kopiene: svarte bånd med hvit etikett som dukker opp rundt moskeene og husene. */
function Kopier({ beat, playing }: { beat: number; playing: boolean }) {
    const skall = useRef<THREE.InstancedMesh>(null);
    const etikett = useRef<THREE.InstancedMesh>(null);
    const vist = useRef(kopierFor(beat));
    const forste = useRef(true);
    const plass = useMemo(
        () =>
            Array.from({ length: ANTALL_KOPIER }, (_, i) => {
                // De første kopiene ligger ved moskeene, resten spres utover landskapet.
                if (i < 70) {
                    const [mx, mz] = MOSKEER[i % MOSKEER.length];
                    const r = 3 + frø(i + 7) * 3;
                    const a = frø(i + 11) * Math.PI * 2;
                    return {
                        x: mx + Math.cos(a) * r,
                        z: mz + Math.sin(a) * r,
                        rot: frø(i + 5) * Math.PI,
                    };
                }
                return {
                    x: -12 + frø(i + 13) * 70,
                    z: -38 + frø(i + 17) * 66,
                    rot: frø(i + 19) * Math.PI,
                };
            }),
        []
    );
    const m = useMemo(() => new THREE.Matrix4(), []);
    const q = useMemo(() => new THREE.Quaternion(), []);
    const e = useMemo(() => new THREE.Euler(), []);
    const s = useMemo(() => new THREE.Vector3(), []);
    const p = useMemo(() => new THREE.Vector3(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = kopierFor(beat);
        vist.current = forste.current ? mål : damp(vist.current, mål, 0.9, dt);
        forste.current = false;
        const sk = skall.current;
        const et = etikett.current;
        if (!sk || !et) return;
        for (let i = 0; i < ANTALL_KOPIER; i++) {
            const k = plass[i];
            const synlig = THREE.MathUtils.clamp(vist.current - i, 0, 1);
            const st = 0.001 + synlig;
            e.set(0, k.rot, 0);
            q.setFromEuler(e);
            p.set(k.x, 0.2 + (1 - synlig) * 3, k.z);
            s.set(1.6 * st, 0.22 * st, 1.0 * st);
            m.compose(p, q, s);
            sk.setMatrixAt(i, m);
            p.set(k.x, 0.32 + (1 - synlig) * 3, k.z);
            s.set(1.3 * st, 0.04 * st, 0.55 * st);
            m.compose(p, q, s);
            et.setMatrixAt(i, m);
        }
        sk.instanceMatrix.needsUpdate = true;
        et.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={skall} args={[undefined, undefined, ANTALL_KOPIER]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#1f2937" emissive="#111827" emissiveIntensity={0.3} />
            </instancedMesh>
            <instancedMesh ref={etikett} args={[undefined, undefined, ANTALL_KOPIER]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#fef3c7" emissive="#fde68a" emissiveIntensity={0.3} />
            </instancedMesh>
        </>
    );
}

/** Lydbølger: ringer som vokser ut fra båndet når budskapet spilles. */
function Lydbolger({ på, playing }: { på: boolean; playing: boolean }) {
    const ringer = useRef<THREE.Mesh[]>([]);
    const tid = useRef(0);
    const styrke = useRef(på ? 1 : 0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        styrke.current = damp(styrke.current, på ? 1 : 0, 3, dt || 0.016);
        ringer.current.forEach((r, i) => {
            if (!r) return;
            const u = (tid.current * 0.5 + i / 3) % 1;
            r.scale.setScalar(1 + u * 2.6);
            (r.material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.7 * styrke.current;
            r.visible = styrke.current > 0.02;
        });
    });
    return (
        <group position={[-3, 2.4, 1.6]} rotation={[-0.35, 0, 0]}>
            {[0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        if (el) ringer.current[i] = el;
                    }}
                >
                    <torusGeometry args={[1.2, 0.06, 6, 40]} />
                    <meshBasicMaterial color="#16a34a" transparent opacity={0} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#dbeafe']} />
            <fog attach="fog" args={['#dbeafe', 70, 170]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#fff7e6', '#c8a46a', 0.6]} />
            <directionalLight position={[-20, 30, 20]} intensity={1.2} color="#fff1d6" />
            <Kamera beat={beat} playing={playing} />
            {/* Frankrike: grønt. Iran: sand. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-49, 0, 0]}>
                <planeGeometry args={[62, 140]} />
                <meshStandardMaterial color="#a7c58b" emissive="#3f6212" emissiveIntensity={0.12} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[32, 0, 0]}>
                <planeGeometry args={[100, 140]} />
                <meshStandardMaterial color="#e4c48d" emissive="#7c5a26" emissiveIntensity={0.15} />
            </mesh>
            <Studio />
            <Grense />
            {MOSKEER.map(([x, z], i) => (
                <Moske key={i} x={x} z={z} />
            ))}
            <Hus lys={beat >= 3} playing={playing} />
            <Kopier beat={beat} playing={playing} />
            <Kassett beat={beat} playing={playing} />
            <Lydbolger på={beat === 0 || beat === 4} playing={playing} />
        </>
    );
}

const TEKST: { tekst: string; rod?: boolean }[] = [
    { tekst: 'Frankrike: talene spilles inn' },
    { tekst: 'Smuglet over grensen' },
    { tekst: 'Kopiert fra moské til moské' },
    { tekst: 'Millioner lytter i det skjulte' },
    { tekst: 'Budskapet' },
    { tekst: 'En revolusjon på kassett' },
];

const BUDSKAP = ['Sjahen er korrupt', 'USA styrer Iran', 'Islamsk styre er løsningen'];

export function IranKassett({ beat, playing }: VisualProps) {
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
                camera={{ fov: 42, near: 0.3, far: 300, position: [-29, 6, 9] }}
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
                {beat === 4 && (
                    <motion.div
                        key="budskap"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-[4%] top-[22%] flex flex-col gap-3"
                    >
                        {BUDSKAP.map((b, i) => (
                            <motion.div
                                key={b}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    delay: 0.6 + i * 1.1,
                                    type: 'spring',
                                    stiffness: 160,
                                    damping: 18,
                                }}
                                className={`px-5 py-3 rounded-2xl shadow-xl font-display font-black text-2xl md:text-3xl ${
                                    i === 2
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-white/95 text-slate-900'
                                }`}
                            >
                                {b}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
