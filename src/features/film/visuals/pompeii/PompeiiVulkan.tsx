import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Vesuv og byene ved foten i 3D. «morgen»: en rolig by under et grønt fjell. «utbrudd»:
 * røyksøylen som greiner seg ut som et pinjetre. «askeregn»: pimpstein faller over Pompeii,
 * laget stiger og takene raser. «strom»: de pyroklastiske strømmene ned fjellsiden, først mot
 * Herculaneum ved sjøen, så mot Pompeii.
 */

type Modus = 'morgen' | 'utbrudd' | 'askeregn' | 'strom';

const KRATER = v(0, 9, 0);
const POMPEII = v(15, 0, 9);
const HERCULANEUM = v(-14, 0, 8);

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'morgen') {
        switch (beat) {
            case 0:
                return { pos: v(46 - t * 0.8, 16, 52), se: v(4, 3, 2) };
            case 1:
                return { pos: v(26 + t * 0.3, 6, 24), se: v(15, 1, 8) };
            case 2:
                return { pos: v(-6 + t * 0.4, 9, 22), se: v(0, 5, 0) };
            default:
                return { pos: v(10 - t * 0.6, 12, 46), se: v(2, 5, 0) };
        }
    }
    if (modus === 'utbrudd') {
        switch (beat) {
            case 0:
                return { pos: v(30, 14 + t * 0.6, 62), se: v(0, 22, 0) };
            case 1:
                return { pos: v(-20, 20, 72), se: v(0, 28, 0) };
            default:
                return { pos: v(-50 + t * 0.4, 16, 80), se: v(0, 24, 0) };
        }
    }
    if (modus === 'askeregn') {
        switch (beat) {
            case 0:
                return { pos: v(30, 7, 26), se: v(15, 1, 8) };
            case 1:
                return { pos: v(22, 3.5, 17), se: v(15, 1.2, 8) };
            case 2:
                return { pos: v(34 + t * 0.2, 10, 30), se: v(10, 3, 4) };
            default:
                return { pos: v(27, 6.5, 20), se: v(15, 0.8, 8) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(34, 9, 34), se: v(10, 4, 4) };
        case 1:
        case 2:
            return { pos: v(-36, 14, 40), se: v(-4, 5, 2) };
        case 3:
            return { pos: v(-32, 8, 30), se: v(-12, 2, 6) };
        default:
            return { pos: v(36, 10, 34), se: v(12, 2, 6) };
    }
}

interface Tilstand {
    soyle: number;
    krone: number;
    stein: number;
    lag: number;
    ras: number;
    stromH: number;
    stromP: number;
    grå: number;
}
type TilstandRef = React.RefObject<Tilstand>;

function malFor(modus: Modus, beat: number): Tilstand {
    const t: Tilstand = { soyle: 0, krone: 0, stein: 0, lag: 0, ras: 0, stromH: 0, stromP: 0, grå: 0 };
    if (modus === 'utbrudd') {
        t.soyle = 1;
        t.krone = beat >= 1 ? 1 : 0.35;
        t.grå = 0.2;
    }
    if (modus === 'askeregn') {
        t.soyle = 1;
        t.krone = 1.2;
        t.stein = beat >= 2 ? 1 : 0.5;
        t.lag = [0.2, 0.4, 0.65, 0.85][Math.min(beat, 3)];
        t.ras = beat >= 3 ? 1 : 0;
        t.grå = 0.5;
    }
    if (modus === 'strom') {
        t.soyle = 1;
        t.krone = 1.2;
        t.stein = 0.3;
        t.lag = 0.85;
        t.ras = 1;
        t.grå = 0.8;
        t.stromH = beat >= 1 ? (beat >= 3 ? 1 : 0.55) : 0;
        t.stromP = beat >= 4 ? 1 : 0;
    }
    return t;
}

const GRONN = new THREE.Color('#6f8a4a');
const ASKEGRA = new THREE.Color('#8d8a85');

/** Fjellet: en avkappet kjegle med grønne lier og vinranker nederst. */
function Vesuv({ tilstand }: { tilstand: TilstandRef }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const rankeMat = useRef<THREE.MeshStandardMaterial>(null);
    const ranker = useMemo(
        () =>
            Array.from({ length: 70 }, (_, i) => {
                const a = frø(i + 3) * Math.PI * 1.3 + 0.1;
                const r = 9.5 + frø(i + 50) * 4;
                return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: Math.max(0.4, (15 - r) * 0.62) };
            }),
        []
    );
    const instanser = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const m = instanser.current;
        if (!m) return;
        const o = new THREE.Object3D();
        ranker.forEach((p, i) => {
            o.position.set(p.x, p.y, p.z);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    }, [ranker]);
    useFrame(() => {
        const g = tilstand.current?.grå ?? 0;
        if (mat.current) mat.current.color.lerpColors(GRONN, ASKEGRA, g);
        if (rankeMat.current) rankeMat.current.color.lerpColors(RANKE, ASKEGRA, g);
    });
    return (
        <group>
            <mesh position={[0, 4.5, 0]}>
                <cylinderGeometry args={[2.4, 15, 9, 22, 1, true]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#6f8a4a"
                    emissive="#1f2614"
                    emissiveIntensity={0.4}
                    flatShading
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh position={[0, 8.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[2.4, 22]} />
                <meshStandardMaterial color="#3b2f28" emissive="#7c2d12" emissiveIntensity={0.4} />
            </mesh>
            <instancedMesh ref={instanser} args={[undefined, undefined, ranker.length]} frustumCulled={false}>
                <sphereGeometry args={[0.5, 6, 4]} />
                <meshStandardMaterial ref={rankeMat} color="#4e7a2e" emissive="#1c2a10" emissiveIntensity={0.4} flatShading />
            </instancedMesh>
        </group>
    );
}
const RANKE = new THREE.Color('#4e7a2e');

/** En by av små hus med teglstein-tak. Takene synker når `ras` går mot 1. */
function By({
    sentrum,
    antall,
    frøStart,
    tilstand,
    medLag,
}: {
    sentrum: THREE.Vector3;
    antall: number;
    frøStart: number;
    tilstand: TilstandRef;
    medLag: boolean;
}) {
    const hus = useMemo(
        () =>
            Array.from({ length: antall }, (_, i) => {
                const gx = (i % 8) - 3.5;
                const gz = Math.floor(i / 8) - 3;
                return {
                    x: sentrum.x + gx * 1.5 + (frø(frøStart + i) - 0.5) * 0.4,
                    z: sentrum.z + gz * 1.5 + (frø(frøStart + i + 99) - 0.5) * 0.4,
                    h: 0.9 + frø(frøStart + i + 7) * 0.8,
                    w: 1 + frø(frøStart + i + 13) * 0.25,
                    raser: frø(frøStart + i + 31) > 0.25,
                };
            }),
        [antall, frøStart, sentrum]
    );
    const vegger = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const lag = useRef<THREE.Mesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    useEffect(() => {
        const m = vegger.current;
        if (!m) return;
        hus.forEach((h, i) => {
            o.position.set(h.x, h.h / 2, h.z);
            o.scale.set(h.w, h.h, h.w);
            o.rotation.set(0, 0, 0);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    }, [hus, o]);
    useFrame(() => {
        const s = tilstand.current;
        const m = tak.current;
        if (!m || !s) return;
        const ras = medLag ? s.ras : 0;
        hus.forEach((h, i) => {
            const f = ras * (h.raser ? 1 : 0.15);
            o.position.set(h.x, h.h + 0.25 - f * h.h * 0.75, h.z);
            o.scale.set(h.w * 1.05, 0.5 * (1 - f * 0.5), h.w * 1.05);
            o.rotation.set(f * 0.5, Math.PI / 4, f * 0.3);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
        const l = lag.current;
        if (l) {
            const hoyde = medLag ? s.lag : 0;
            l.visible = hoyde > 0.02;
            l.scale.set(13.5, Math.max(hoyde, 0.001), 12);
            l.position.set(sentrum.x, hoyde / 2, sentrum.z - 0.75);
        }
    });
    return (
        <group>
            <instancedMesh ref={vegger} args={[undefined, undefined, hus.length]} frustumCulled={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#efe3cc" emissive="#4a3f30" emissiveIntensity={0.25} flatShading />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, hus.length]} frustumCulled={false}>
                <coneGeometry args={[0.8, 1, 4]} />
                <meshStandardMaterial color="#b4532a" emissive="#4a1d0c" emissiveIntensity={0.3} flatShading />
            </instancedMesh>
            {/* Pimpsteinlaget som stiger over gatene */}
            <mesh ref={lag} visible={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#a7a196" emissive="#3b3833" emissiveIntensity={0.35} flatShading />
            </mesh>
        </group>
    );
}

/** Røyksøylen: tynn stamme og en krone som brer seg ut, som et pinjetre. */
function Soyle({ tilstand, mork }: { tilstand: TilstandRef; mork: boolean }) {
    const stamme = useRef<THREE.Mesh>(null);
    const krone = useRef<THREE.Group>(null);
    const biter = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => ({
                x: (frø(i + 600) - 0.5) * 26,
                z: (frø(i + 640) - 0.5) * 12,
                y: (frø(i + 680) - 0.5) * 4,
                r: 4 + frø(i + 720) * 3.5,
            })),
        []
    );
    useFrame(() => {
        const s = tilstand.current;
        if (!s) return;
        const h = Math.max(s.soyle, 0.001) * 34;
        if (stamme.current) {
            stamme.current.scale.set(1, h, 1);
            stamme.current.position.set(0, KRATER.y + h / 2, 0);
            stamme.current.visible = s.soyle > 0.02;
        }
        if (krone.current) {
            const k = Math.max(s.krone, 0.001);
            krone.current.scale.set(k, k * 0.8, k);
            krone.current.position.set(0, KRATER.y + h, 0);
            krone.current.visible = s.krone > 0.02;
        }
    });
    const farge = mork ? '#5b5550' : '#8a837b';
    return (
        <group>
            <mesh ref={stamme} visible={false}>
                <cylinderGeometry args={[2.6, 1.8, 1, 12]} />
                <meshStandardMaterial color={farge} emissive="#2a2522" emissiveIntensity={0.5} flatShading />
            </mesh>
            <group ref={krone} visible={false}>
                {biter.map((b, i) => (
                    <mesh key={i} position={[b.x, b.y, b.z]} scale={[1, 0.55, 1]}>
                        <icosahedronGeometry args={[b.r, 1]} />
                        <meshStandardMaterial color={farge} emissive="#2a2522" emissiveIntensity={0.5} flatShading />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

const STEIN_ANTALL = 320;

/** Pimpstein som faller over Pompeii. */
function Steinregn({ playing, tilstand }: { playing: boolean; tilstand: TilstandRef }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const steiner = useMemo(
        () =>
            Array.from({ length: STEIN_ANTALL }, (_, i) => ({
                x: POMPEII.x + (frø(i + 1000) - 0.5) * 26,
                z: POMPEII.z + (frø(i + 1400) - 0.5) * 22,
                y0: frø(i + 1800) * 20,
                fart: 4 + frø(i + 2200) * 3,
            })),
        []
    );
    const tid = useRef(0);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        const s = tilstand.current;
        if (!m || !s) return;
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        steiner.forEach((st, i) => {
            const y = (((st.y0 - st.fart * tid.current) % 20) + 20) % 20;
            o.position.set(st.x, y, st.z);
            o.scale.setScalar(i / STEIN_ANTALL < s.stein ? 0.13 : 0);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, STEIN_ANTALL]} frustumCulled={false}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#e2dccd" emissive="#6b655c" emissiveIntensity={0.45} flatShading />
        </instancedMesh>
    );
}

/** En pyroklastisk strøm: glødende skyer som ruller fra krateret ned mot et mål. */
function Strom({
    mål,
    felt,
    playing,
    frøStart,
    tilstand,
}: {
    mål: THREE.Vector3;
    felt: 'stromH' | 'stromP';
    playing: boolean;
    frøStart: number;
    tilstand: TilstandRef;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const n = 34;
    const tid = useRef(0);
    const biter = useMemo(
        () =>
            Array.from({ length: n }, (_, i) => ({
                andel: i / (n - 1),
                side: (frø(frøStart + i) - 0.5) * 4,
                r: 1.4 + frø(frøStart + i + 50) * 1.6,
            })),
        [frøStart]
    );
    const o = useMemo(() => new THREE.Object3D(), []);
    const retning = useMemo(() => new THREE.Vector3().subVectors(mål, KRATER), [mål]);
    const tvers = useMemo(() => new THREE.Vector3(-retning.z, 0, retning.x).normalize(), [retning]);
    const p = useMemo(() => new THREE.Vector3(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        const s = tilstand.current;
        if (!m || !s) return;
        if (playing) tid.current += Math.min(rawDt, 0.05);
        const fram = s[felt];
        biter.forEach((b, i) => {
            const a = b.andel * fram;
            p.lerpVectors(KRATER, mål, a);
            p.y = THREE.MathUtils.lerp(KRATER.y - 0.5, 0.8, Math.sqrt(a)) + Math.sin(tid.current * 2 + i) * 0.2;
            p.addScaledVector(tvers, b.side * (0.3 + a));
            o.position.copy(p);
            o.scale.setScalar(fram > 0.02 ? b.r * (0.6 + a * 0.8) : 0);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#7a6a5e" emissive="#c2410c" emissiveIntensity={0.55} flatShading />
        </instancedMesh>
    );
}

const HERC_MÅL = v(HERCULANEUM.x, 0, HERCULANEUM.z);
const POMP_MÅL = v(POMPEII.x, 0, POMPEII.z);

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    const tilstand = useRef<Tilstand>(malFor(modus, beat));
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = malFor(modus, beat);
        const s = tilstand.current;
        (Object.keys(mål) as (keyof Tilstand)[]).forEach((k) => {
            s[k] = damp(s[k], mål[k], k === 'stromH' || k === 'stromP' ? 0.9 : 1.6, dt);
        });
    });
    const lys = modus === 'morgen' ? 1 : modus === 'utbrudd' ? 0.8 : 0.6;
    const himmel = modus === 'morgen' ? '#bcd9ec' : modus === 'utbrudd' ? '#c3bcb0' : '#9a9083';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 80, 240]} />
            <ambientLight intensity={0.65 * lys + 0.15} color="#f4ede0" />
            <directionalLight position={[40, 60, 30]} intensity={1.3 * lys} color="#fff1dc" />
            <hemisphereLight args={['#e6eef2', '#4b4a38', 0.5]} />
            {/* Land bak, hav foran: byene ligger langs bukta */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -34]}>
                <planeGeometry args={[400, 100]} />
                <meshStandardMaterial color="#a8a06a" emissive="#2f2c18" emissiveIntensity={0.35} roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 74]}>
                <planeGeometry args={[400, 120]} />
                <meshStandardMaterial color="#3d7fa8" emissive="#1d4a68" emissiveIntensity={0.5} roughness={0.5} />
            </mesh>
            <Vesuv tilstand={tilstand} />
            <By sentrum={POMPEII} antall={56} frøStart={10} tilstand={tilstand} medLag />
            <By sentrum={HERCULANEUM} antall={24} frøStart={300} tilstand={tilstand} medLag={false} />
            {modus !== 'morgen' && <Soyle tilstand={tilstand} mork={modus !== 'utbrudd'} />}
            {(modus === 'askeregn' || modus === 'strom') && <Steinregn playing={playing} tilstand={tilstand} />}
            {modus === 'strom' && (
                <Strom mål={HERC_MÅL} felt="stromH" playing={playing} frøStart={3000} tilstand={tilstand} />
            )}
            {modus === 'strom' && (
                <Strom mål={POMP_MÅL} felt="stromP" playing={playing} frøStart={3100} tilstand={tilstand} />
            )}
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    morgen: ['År 79, Romerriket', 'Pompeii: en rik by', 'Vesuv: vindruer i liene', 'Ingen vet at det er en vulkan'],
    utbrudd: ['Røyksøylen: 30 km opp', 'Som et pinjetre', 'Regnes som første beskrivelse', 'Plinsk utbrudd'],
    askeregn: ['Steinregn over Pompeii', 'Pimpstein: tung og varm', 'Nesten et døgn', 'Takene raser sammen'],
    strom: [
        'Det verste var ikke steinene',
        'Pyroklastisk strøm: gass og aske',
        null,
        'Om kvelden: Herculaneum',
        'Neste morgen: Pompeii',
    ],
};

/** Pinjetreet Plinius sammenlignet søylen med, som en liten tegning i hjørnet. */
function Pinjetre() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-[3%] top-[22%] rounded-2xl bg-white/90 shadow-xl px-4 pt-3 pb-2 text-center"
        >
            <svg viewBox="0 0 120 140" style={{ width: 150, height: 175 }}>
                <rect x="55" y="45" width="10" height="90" rx="3" fill="#7c4a2a" />
                <ellipse cx="60" cy="38" rx="52" ry="20" fill="#3f6b2c" />
                <ellipse cx="40" cy="30" rx="26" ry="13" fill="#4f7f37" />
                <ellipse cx="80" cy="30" rx="26" ry="13" fill="#4f7f37" />
            </svg>
            <div className="font-bold text-slate-800 text-lg">Pinjetre</div>
        </motion.div>
    );
}

function Tall() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-[9%] flex justify-center gap-6"
        >
            <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center">
                <div className="text-5xl font-black text-orange-700 tabular-nums">ofte over 100 km/t</div>
                <div className="text-base font-semibold text-slate-500 mt-1">fart nedover fjellet</div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center">
                <div className="text-5xl font-black text-red-600 tabular-nums">600-700 °C</div>
                <div className="text-base font-semibold text-slate-500 mt-1">gassene i strømmen</div>
            </div>
        </motion.div>
    );
}

export function PompeiiVulkan({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'morgen';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const tekst = MERKER[modus][Math.min(beat, MERKER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 600, position: [46, 16, 52] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>{modus === 'utbrudd' && beat === 1 && <Pinjetre key="pinje" />}</AnimatePresence>
            <AnimatePresence>{modus === 'strom' && beat === 2 && <Tall key="tall" />}</AnimatePresence>
        </div>
    );
}
