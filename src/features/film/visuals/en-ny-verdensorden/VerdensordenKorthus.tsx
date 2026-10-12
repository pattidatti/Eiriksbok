import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { damp, frø, useBeatTid, useKamera, v } from './felles3d';

/**
 * Finanskrisen som et korthus av boliglån.
 * «krise»: beat 0 lån svever over husene, beat 1 lånene pakkes til et høyt korthus, beat 2
 * korthuset skjelver (Lehman Brothers), beat 3 det faller, beat 4 lysene går ut i husene.
 * «redning»: beat 0 ruinene, beat 1 skattepenger flyr fra husene og bygger korthuset opp igjen,
 * beat 2 banken står, husene er mørke, beat 3 kameraet trekker seg ut til spørsmålet.
 */

type Modus = 'krise' | 'redning';

const KORT_H = 2;
const KORT_B = 1.4;
const VINKEL = 0.32;
const ETASJE = KORT_H * Math.cos(VINKEL) + 0.06;
const TARN_Z = -1;

interface Plass {
    pos: THREE.Vector3;
    rotZ: number;
    etasje: number;
}

/** Plassene i korthuset: telt av to lente kort, med et flatt kort over hvert par telt. */
const PLASSER: Plass[] = (() => {
    const ut: Plass[] = [];
    for (let e = 0; e < 4; e++) {
        const n = 4 - e;
        const bunn = e * ETASJE;
        for (let i = 0; i < n; i++) {
            const c = (i - (n - 1) / 2) * 1.5;
            const dx = Math.sin(VINKEL) * (KORT_H / 2);
            const y = bunn + (KORT_H / 2) * Math.cos(VINKEL);
            ut.push({ pos: v(c - dx, y, TARN_Z), rotZ: -VINKEL, etasje: e });
            ut.push({ pos: v(c + dx, y, TARN_Z), rotZ: VINKEL, etasje: e });
        }
        for (let i = 0; i < n - 1; i++) {
            const c = (i + 0.5 - (n - 1) / 2) * 1.5;
            ut.push({ pos: v(c, bunn + ETASJE - 0.02, TARN_Z), rotZ: Math.PI / 2, etasje: e });
        }
    }
    return ut;
})();
const ANTALL = PLASSER.length;

const HUS = Array.from({ length: 8 }, (_, i) => ({
    x: -9.1 + i * 2.6,
    z: 5,
    farge: ['#fca5a5', '#fde68a', '#bfdbfe', '#d9f99d', '#fed7aa', '#e9d5ff', '#a7f3d0', '#fecdd3'][i],
    kanIkkeBetale: [1, 3, 4, 6].includes(i),
}));

const MYNTER = 48;

function husPos(i: number) {
    const h = HUS[i % HUS.length];
    const k = Math.floor(i / HUS.length);
    return v(h.x, 2.6 + k * 0.32, h.z);
}

function faltPos(i: number) {
    return v((frø(i) - 0.5) * 13, 0.05 + i * 0.004, TARN_Z + (frø(i + 50) - 0.5) * 5);
}

function kamera(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'krise') {
            switch (beat) {
                case 0:
                    return { pos: v(-2 + t * 0.2, 6, 17), se: v(0, 2, 3) };
                case 1:
                    return { pos: v(9 - t * 0.4, 8, 15), se: v(0, 3.5, 0) };
                case 2:
                    return { pos: v(4, 5.5, 11), se: v(0, 4, TARN_Z) };
                case 3:
                    return { pos: v(0, 12, 15), se: v(0, 0.5, -1) };
                default:
                    return { pos: v(0, 4.5, 14), se: v(0, 1.5, 4) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(6, 9, 14), se: v(0, 0.5, 0) };
            case 1:
                return { pos: v(0, 8, 18), se: v(0, 3, 1) };
            case 2:
                return { pos: v(-7, 6, 14), se: v(0, 3, 1) };
            default:
                return { pos: v(0, 11, 24 + t * 0.3), se: v(0, 3, 0) };
        }
    };
}

function Kort({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useBeatTid(beat, playing);
    const o = useMemo(() => new THREE.Object3D(), []);
    const tilstand = useRef(Array.from({ length: ANTALL }, () => ({ pos: new THREE.Vector3(), rotZ: 0, rotY: 0, skala: 1 })));
    const forste = useRef(true);
    const farger = useMemo(
        () => Array.from({ length: ANTALL }, (_, i) => new THREE.Color(i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#fde68a' : '#93c5fd')),
        []
    );
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const t = tid.current;
        const m = ref.current;
        if (!m) return;
        for (let i = 0; i < ANTALL; i++) {
            const p = PLASSER[i];
            let mål: THREE.Vector3;
            let rotZ = p.rotZ;
            let rotY = 0;
            let skala = 1;
            let fart = 3;
            const iTarn =
                (modus === 'krise' && (beat === 1 ? t > i * 0.12 : beat === 2)) ||
                (modus === 'redning' && (beat === 1 ? t > 2.2 + i * 0.08 : beat >= 2));
            const falt =
                (modus === 'krise' && beat >= 3 && (beat > 3 || t > (ANTALL - i) * 0.035)) || (modus === 'redning' && !iTarn);
            if (iTarn) {
                mål = p.pos;
            } else if (falt) {
                mål = faltPos(i);
                rotZ = Math.PI / 2;
                rotY = frø(i + 9) * Math.PI;
                fart = 2.2;
            } else {
                mål = husPos(i);
                rotZ = Math.PI / 2;
                rotY = Math.sin(t * 0.8 + i) * 0.3;
                skala = 0.45;
            }
            const s = tilstand.current[i];
            if (forste.current) {
                s.pos.copy(mål);
                s.rotZ = rotZ;
                s.rotY = rotY;
                s.skala = skala;
            } else {
                const d = dt || 0;
                s.pos.x = damp(s.pos.x, mål.x, fart, d);
                s.pos.y = damp(s.pos.y, mål.y, fart, d);
                s.pos.z = damp(s.pos.z, mål.z, fart, d);
                s.rotZ = damp(s.rotZ, rotZ, fart, d);
                s.rotY = damp(s.rotY, rotY, fart, d);
                s.skala = damp(s.skala, skala, fart, d);
            }
            // Korthuset skjelver når Lehman Brothers går konkurs. Toppen rister mest.
            const skjelv = modus === 'krise' && beat === 2 ? Math.sin(t * 28 + i) * 0.05 * Math.min(t / 2.5, 1) * (p.etasje + 1) : 0;
            o.position.set(s.pos.x + skjelv, s.pos.y, s.pos.z);
            o.rotation.set(0, s.rotY, s.rotZ + skjelv * 0.4);
            o.scale.setScalar(s.skala);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            m.setColorAt(i, farger[i]);
        }
        forste.current = false;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, ANTALL]}>
            <boxGeometry args={[0.07, KORT_H, KORT_B]} />
            <meshStandardMaterial flatShading />
        </instancedMesh>
    );
}

/** Gullmynter: skattebetalernes penger som flyr fra husene til banken. */
function Mynter({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useBeatTid(beat, playing);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        const t = tid.current;
        for (let j = 0; j < MYNTER; j++) {
            const stabel = j % 8;
            const hoyde = Math.floor(j / 8);
            const haug = v(-3.15 + stabel * 0.9, 0.07 + hoyde * 0.14, 1.4);
            const h = HUS[j % HUS.length];
            const start = v(h.x, 1.2, h.z);
            let s = 0;
            if (modus === 'redning' && beat === 1) s = THREE.MathUtils.clamp((t - j * 0.04) / 1.3, 0, 1);
            if (modus === 'redning' && beat >= 2) s = 1;
            const synlig = modus === 'redning' && beat >= 1 && (beat >= 2 || t > j * 0.04);
            const x = start.x + (haug.x - start.x) * s;
            const z = start.z + (haug.z - start.z) * s;
            o.position.set(x, start.y + (haug.y - start.y) * s + Math.sin(Math.PI * s) * 4, z);
            o.rotation.set(s < 1 ? t * 6 + j : 0, 0, 0);
            o.scale.setScalar(synlig ? 1 : 0.001);
            o.updateMatrix();
            m.setMatrixAt(j, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, MYNTER]}>
            <cylinderGeometry args={[0.38, 0.38, 0.12, 16]} />
            <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.35} metalness={0.3} roughness={0.4} />
        </instancedMesh>
    );
}

function Hus({ modus, beat }: { modus: Modus; beat: number }) {
    const morkt = (modus === 'krise' && beat >= 4) || modus === 'redning';
    return (
        <group>
            {HUS.map((h, i) => {
                const rodt = modus === 'krise' && beat === 0 && h.kanIkkeBetale;
                return (
                    <group key={i} position={[h.x, 0, h.z]}>
                        <mesh position={[0, 0.6, 0]}>
                            <boxGeometry args={[1.5, 1.2, 1.5]} />
                            <meshStandardMaterial color={morkt ? '#94a3b8' : h.farge} flatShading />
                        </mesh>
                        <mesh position={[0, 1.6, 0]} rotation={[0, Math.PI / 4, 0]}>
                            <coneGeometry args={[1.25, 0.85, 4]} />
                            <meshStandardMaterial
                                color={rodt ? '#dc2626' : morkt ? '#475569' : '#7c2d12'}
                                emissive={rodt ? '#b91c1c' : '#000000'}
                                emissiveIntensity={rodt ? 0.6 : 0}
                                flatShading
                            />
                        </mesh>
                        <mesh position={[0, 0.65, 0.76]}>
                            <planeGeometry args={[0.6, 0.45]} />
                            <meshStandardMaterial
                                color={morkt ? '#1e293b' : '#fde68a'}
                                emissive={morkt ? '#000000' : '#f59e0b'}
                                emissiveIntensity={morkt ? 0 : 0.9}
                            />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

/** Rødt lys under korthuset når banken går konkurs, gyllent når staten redder den. */
function Varsel({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.PointLight>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0.016;
        const l = ref.current;
        if (!l) return;
        const rod = modus === 'krise' && (beat === 2 || beat === 3);
        const gull = modus === 'redning' && beat >= 1 && beat <= 2;
        l.color.set(rod ? '#ef4444' : '#facc15');
        l.intensity = damp(l.intensity, rod ? 60 : gull ? 40 : 0, 2.5, dt);
    });
    return <pointLight ref={ref} position={[0, 3, 3]} distance={18} intensity={0} />;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const mål = useMemo(() => kamera(modus), [modus]);
    useKamera(mål, beat, playing);
    return (
        <>
            <color attach="background" args={['#dbe7f3']} />
            <fog attach="fog" args={['#dbe7f3', 30, 70]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#ffffff', '#64748b', 0.6]} />
            <directionalLight position={[8, 18, 12]} intensity={1.5} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[80, 60]} />
                <meshStandardMaterial color="#c7d2c0" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 3.1]}>
                <planeGeometry args={[24, 1.6]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <Hus modus={modus} beat={beat} />
            <Kort modus={modus} beat={beat} playing={playing} />
            <Mynter modus={modus} beat={beat} playing={playing} />
            <Varsel modus={modus} beat={beat} playing={playing} />
        </>
    );
}

const TEKST: Record<Modus, (string | [string, 'rod'])[]> = {
    krise: [
        'Lån til folk som ikke kunne betale',
        'Pakket og solgt som «trygge»',
        ['15. september 2008: Lehman Brothers konkurs', 'rod'],
        ['Korthuset faller', 'rod'],
        ['Millioner mistet jobb, hus og sparepenger', 'rod'],
    ],
    redning: ['Hvem skal betale?', 'Skattebetalernes penger', 'Vanlige folk betalte regningen', ''],
};

export function VerdensordenKorthus({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'krise';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linje = TEKST[modus][Math.min(beat, TEKST[modus].length - 1)];
    const [tekst, farge] = Array.isArray(linje) ? linje : [linje, undefined];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, near: 0.3, far: 200, position: [0, 6, 17] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {tekst && (
                    <motion.div
                        key={`${modus}-${beat}`}
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
                )}
            </AnimatePresence>
            {modus === 'krise' && beat <= 1 && (
                <div className="absolute bottom-[6%] left-[4%] px-4 py-2 rounded-xl bg-white/90 shadow-lg text-xl font-bold text-slate-700 flex items-center gap-3">
                    <span className="inline-block w-5 h-6 rounded-sm bg-amber-300 border-2 border-slate-500" /> = et boliglån
                </div>
            )}
            {modus === 'redning' && beat === 1 && (
                <div className="absolute bottom-[7%] left-1/2 -translate-x-1/2">
                    <Teller verdi={700} etikett="milliarder dollar i krisepakker" prefiks="ca. " forsinkelse={0.8} tone="rod" />
                </div>
            )}
            <AnimatePresence>
                {modus === 'redning' && beat === 3 && (
                    <motion.div
                        key="sporsmal"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="absolute inset-x-[10%] top-[20%] px-8 py-6 rounded-3xl bg-slate-900/92 text-white text-center shadow-2xl"
                    >
                        <div className="text-xl font-bold text-amber-300 mb-2">Kina, India og Brasil spør:</div>
                        <div className="text-4xl font-black leading-tight">
                            «Hvorfor skal vi følge Vestens regler, når Vesten ikke klarer å følge dem selv?»
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
