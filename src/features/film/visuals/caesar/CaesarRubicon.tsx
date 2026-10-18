import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';
import { CaesarFigurer } from './CaesarFigurer';

/**
 * Elva Rubicon en januardag år 49 fvt. Cæsar står ved bredden, legionen hans bak ham,
 * og langt der framme ligger Roma på en høyde. Elva går langs x-aksen ved z = 0.
 * Modus «elva»: stedet og valget. «valg»: de tre dårlige valgene. «krysser»:
 * terningen kastes og soldatene vasser over.
 */

type Modus = 'elva' | 'valg' | 'krysser';

const KOL = 12;
const RAD = 12;
const SOLDATER = KOL * RAD;
const ELV = 3; // halv bredde
const ROMA_Z = -95;
const CAESAR_Z = 4.6;
const TERNING: [number, number, number] = [-1.7, 0, 3.9];

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'elva') {
        switch (beat) {
            case 0:
                return { pos: v(26 - t * 0.3, 12, 24), se: v(0, 0, 2) };
            case 1:
                return { pos: v(-9, 4, 1.2), se: v(0, 1.4, 12) };
            case 2:
                return { pos: v(0.9, 3.0, 9.5 - t * 0.15), se: v(0, 3, ROMA_Z) };
            case 3:
                return { pos: v(15, 14, 22), se: v(0, 0, 3) };
            default:
                return { pos: v(20 - t * 0.3, 2.4, 0.4), se: v(-10, 0.4, 0) };
        }
    }
    if (modus === 'valg') {
        if (beat === 0) return { pos: v(18 - t * 0.3, 2.6, 0.6), se: v(-10, 0.5, 0) };
        if (beat === 1) return { pos: v(1.5, 4.5, -12 + t * 0.1), se: v(0, 1.5, 8) };
        return { pos: v(16 - t * 0.15, 8, 18), se: v(0, 0.5, 7) };
    }
    switch (beat) {
        case 0:
            return { pos: v(1.6, 2.3, 0.6), se: v(-0.4, 1.0, 4.5) };
        case 1:
            return { pos: v(-1.2, 1.5, 1.6), se: TERNING_VEC };
        default:
            return { pos: v(26 - t * 0.2, 10, 8), se: v(0, 0, -4) };
    }
}
const TERNING_VEC = v(TERNING[0], 0.3, TERNING[2]);

/** Hvor langt legionen er flyttet bakover (+) eller framover (-) for beaten. */
function fremrykk(modus: Modus, beat: number) {
    if (modus === 'valg') return beat === 2 ? 10 : beat >= 3 ? -2.5 : 0;
    if (modus === 'krysser') return beat >= 2 ? -34 : 0;
    return 0;
}

/** Figurer synker ned i vannet midt i elva. */
function vadeY(z: number) {
    const a = Math.abs(z);
    if (a > ELV + 0.6) return 0;
    if (a < ELV - 0.6) return -0.5;
    return -0.5 * ((ELV + 0.6 - a) / 1.2);
}

function Landskap() {
    const traer = useMemo(
        () =>
            Array.from({ length: 46 }, (_, i) => {
                const side = i % 2 ? 1 : -1;
                return {
                    x: side * (12 + frø(i) * 40),
                    z: (frø(i + 50) - 0.5) * 120,
                    h: 2 + frø(i + 90) * 2.5,
                };
            }).filter((t) => Math.abs(t.z) > ELV + 1.5),
        []
    );
    const traerRef = useRef<THREE.InstancedMesh>(null);
    const ferdig = useRef(false);
    useFrame(() => {
        const m = traerRef.current;
        if (!m || ferdig.current) return;
        const o = new THREE.Object3D();
        traer.forEach((t, i) => {
            o.position.set(t.x, t.h / 2, t.z);
            o.scale.set(1, t.h, 1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
        ferdig.current = true;
    });
    const hus = useMemo(
        () =>
            Array.from({ length: 26 }, (_, i) => {
                const a = frø(i + 7) * Math.PI * 2;
                const r = 3 + frø(i + 17) * 11;
                return {
                    x: Math.cos(a) * r,
                    z: ROMA_Z + Math.sin(a) * r * 0.7,
                    h: 1.5 + frø(i + 27) * 2.5,
                    b: 1.8 + frø(i + 37) * 2,
                };
            }),
        []
    );
    return (
        <>
            {/* Nordre og søndre bredd, elvebunn og vann */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ELV + 100]}>
                <planeGeometry args={[400, 200]} />
                <meshStandardMaterial color="#8d916c" roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -ELV - 100]}>
                <planeGeometry args={[400, 200]} />
                <meshStandardMaterial color="#959874" roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
                <planeGeometry args={[400, ELV * 2]} />
                <meshStandardMaterial color="#5a4a36" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
                <planeGeometry args={[400, ELV * 2]} />
                <meshStandardMaterial
                    color="#5f93b8"
                    emissive="#2d6a92"
                    emissiveIntensity={0.45}
                    roughness={0.3}
                    transparent
                    opacity={0.88}
                />
            </mesh>
            {/* Veien mot Roma */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, ROMA_Z / 2 - ELV]}>
                <planeGeometry args={[3, -ROMA_Z - 6]} />
                <meshStandardMaterial color="#b49b74" roughness={1} />
            </mesh>
            {/* Trær */}
            <instancedMesh ref={traerRef} args={[undefined, undefined, traer.length]}>
                <coneGeometry args={[0.9, 1, 7]} />
                <meshStandardMaterial color="#3f5a3a" flatShading />
            </instancedMesh>
            {/* Roma på en høyde langt der framme */}
            <mesh position={[0, -4, ROMA_Z]} scale={[1, 0.45, 0.8]}>
                <sphereGeometry args={[20, 24, 12]} />
                <meshStandardMaterial color="#a2a079" flatShading />
            </mesh>
            {hus.map((h, i) => (
                <mesh key={i} position={[h.x, 4.6 + h.h / 2, h.z]}>
                    <boxGeometry args={[h.b, h.h, h.b * 0.8]} />
                    <meshStandardMaterial
                        color={i % 3 ? '#e9dcc3' : '#c8693f'}
                        emissive="#e9dcc3"
                        emissiveIntensity={0.15}
                        flatShading
                    />
                </mesh>
            ))}
            {/* Tempelet øverst */}
            <group position={[0, 8.6, ROMA_Z]}>
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[7, 1, 4.5]} />
                    <meshStandardMaterial
                        color="#f4efe4"
                        emissive="#f4efe4"
                        emissiveIntensity={0.25}
                    />
                </mesh>
                {Array.from({ length: 6 }, (_, i) => (
                    <mesh key={i} position={[-2.9 + i * 1.16, 2.3, 2]}>
                        <cylinderGeometry args={[0.25, 0.25, 2.6, 8]} />
                        <meshStandardMaterial
                            color="#f4efe4"
                            emissive="#f4efe4"
                            emissiveIntensity={0.25}
                        />
                    </mesh>
                ))}
                <mesh position={[0, 4.2, 0]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[7.4, 1.2, 5]} />
                    <meshStandardMaterial
                        color="#c8693f"
                        emissive="#c8693f"
                        emissiveIntensity={0.2}
                    />
                </mesh>
            </group>
        </>
    );
}

/** Terningen: kastes i beat 0 og blir liggende. */
function Terning({
    modus,
    beatTid,
    beat,
}: {
    modus: Modus;
    beatTid: React.RefObject<number>;
    beat: number;
}) {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        const g = ref.current;
        if (!g) return;
        g.visible = modus === 'krysser';
        const t = beat === 0 ? Math.min(beatTid.current ?? 0, 1.6) : 1.6;
        // Fall med to sprett, så ro. Rulling fram mot sluttstillingen.
        const fall = Math.max(0, 1 - t / 1.6);
        const sprett = Math.abs(Math.cos(t * 5)) * fall * fall * 3;
        g.position.set(TERNING[0] + fall * 1.5, 0.35 + sprett, TERNING[2] + fall * 1.2);
        g.rotation.set(fall * 7, fall * 4, fall * 5);
    });
    const prikker: [number, number, number][] = [
        // Toppen: fem
        [0, 0.36, 0],
        [-0.18, 0.36, -0.18],
        [0.18, 0.36, 0.18],
        [-0.18, 0.36, 0.18],
        [0.18, 0.36, -0.18],
        // Forsiden: to
        [-0.15, 0.15, -0.36],
        [0.15, -0.15, -0.36],
        // Siden: tre
        [0.36, 0.17, 0.17],
        [0.36, 0, 0],
        [0.36, -0.17, -0.17],
    ];
    return (
        <group ref={ref}>
            <mesh>
                <boxGeometry args={[0.7, 0.7, 0.7]} />
                <meshStandardMaterial color="#f5f0e1" emissive="#f5f0e1" emissiveIntensity={0.15} />
            </mesh>
            {prikker.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.06, 8, 6]} />
                    <meshStandardMaterial color="#1c1917" />
                </mesh>
            ))}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useKamera((b, t) => kameraFor(modus, b, t), beat, playing);

    const base = useMemo(
        () =>
            Array.from({ length: SOLDATER }, (_, i) => {
                const r = Math.floor(i / KOL);
                const k = i % KOL;
                return {
                    x: (k - (KOL - 1) / 2) * 1.15 + (frø(i) - 0.5) * 0.15,
                    z: 7.5 + r * 1.35 + (frø(i + 9) - 0.5) * 0.15,
                    r,
                };
            }),
        []
    );
    const farger = useMemo(() => base.map((_, i) => (i % 9 === 4 ? '#7f1d1d' : '#9f1239')), [base]);
    const data = useRef(new Float32Array(SOLDATER * 4));
    const offset = useRef<number[] | null>(null);
    if (offset.current === null) offset.current = base.map(() => fremrykk(modus, beat));
    const caesar = useRef(new Float32Array([0, 0, CAESAR_Z, 1.25]));
    const caesarZ = useRef(CAESAR_Z + fremrykk(modus, beat) * 0.9);
    const kappe = useRef<THREE.Mesh>(null);
    const ørner = useRef<THREE.Group>(null);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = fremrykk(modus, beat);
        const t = beatTid.current ?? 0;
        const d = data.current;
        const off = offset.current!;
        base.forEach((b, i) => {
            // Bakerste rader venter litt, så kolonnen beveger seg som en hær.
            const venter = mål < -5 ? b.r * 0.35 + 0.8 : 0;
            if (t > venter) off[i] = damp(off[i], mål, mål < -5 ? 0.45 : 1.2, dt);
            const z = b.z + off[i];
            d[i * 4] = b.x;
            d[i * 4 + 1] = vadeY(z) + (playing ? Math.sin(t * 6 + i) * 0.02 : 0);
            d[i * 4 + 2] = z;
            d[i * 4 + 3] = 1;
        });
        // Cæsar går først over.
        const cMål = CAESAR_Z + (mål < -5 ? mål - 2 : 0);
        caesarZ.current = damp(caesarZ.current, cMål, mål < -5 ? 0.5 : 1.2, dt);
        const c = caesar.current;
        c[1] = vadeY(caesarZ.current);
        c[2] = caesarZ.current;
        if (kappe.current) kappe.current.position.set(0, c[1] + 0.95, c[2] + 0.28);
        if (ørner.current) ørner.current.position.set(0, vadeY(off[0] + 6.6), off[0]);
    });

    return (
        <>
            <color attach="background" args={['#cfd8e0']} />
            <fog attach="fog" args={['#cfd8e0', 45, 200]} />
            <ambientLight intensity={0.75} color="#eef2f6" />
            <hemisphereLight args={['#f1f5f9', '#5b5a44', 0.7]} />
            <directionalLight position={[-20, 30, 10]} intensity={1.0} color="#fff7ea" />
            <Landskap />
            <CaesarFigurer data={data} farger={farger} skjold="#b91c1c" hjelm="#9ca3af" />
            {/* Cæsar: større, i purpur, med rød kappe */}
            <CaesarFigurer data={caesar} farger={['#6b21a8']} hjelm="#d4a017" />
            <mesh ref={kappe}>
                <boxGeometry args={[0.85, 1.35, 0.1]} />
                <meshStandardMaterial color="#dc2626" flatShading />
            </mesh>
            {/* Legionens ørner på stenger, foran soldatene */}
            <group ref={ørner}>
                {[-5.5, -2.2, 5.5].map((x) => (
                    <group key={x} position={[x, 0, 6.6]}>
                        <mesh position={[0, 1.9, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, 3.8, 6]} />
                            <meshStandardMaterial color="#57534e" />
                        </mesh>
                        <mesh position={[0, 3.9, 0]}>
                            <boxGeometry args={[0.7, 0.3, 0.2]} />
                            <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
                        </mesh>
                        <mesh position={[0, 3.3, 0]}>
                            <boxGeometry args={[0.6, 0.7, 0.05]} />
                            <meshStandardMaterial color="#b91c1c" />
                        </mesh>
                    </group>
                ))}
            </group>
            <Terning modus={modus} beatTid={beatTid} beat={beat} />
        </>
    );
}

interface Lapp {
    tekst: string;
    under?: string;
}

const LAPPER: Record<Modus, Lapp[]> = {
    elva: [
        { tekst: 'Nord-Italia, januar 49 fvt.' },
        { tekst: 'Cæsar og soldatene hans' },
        { tekst: 'Roma', under: 'rik, berømt og hatet' },
        { tekst: 'To dårlige valg' },
        { tekst: 'RUBICON', under: 'grensa ingen general fikk krysse med hæren' },
    ],
    valg: [
        { tekst: 'Loven', under: 'krysse Rubicon med hæren = høyforræderi' },
        { tekst: 'Uten soldater i Roma venter:' },
        { tekst: 'Tre valg. To av dem:' },
        { tekst: 'Tre valg. To av dem:' },
        { tekst: 'Alle valgene er dårlige' },
    ],
    krysser: [
        { tekst: '«Alea iacta est»' },
        { tekst: 'Terningen er kastet', under: 'valget kan ikke tas tilbake' },
        { tekst: 'Borgerkrig', under: 'krig mellom romere' },
    ],
};

const FARER = [
    'Fiender som hater ham',
    'Anklager om krigsforbrytelser',
    'Sannsynligvis dødsstraff',
];
const VALG = [
    { tekst: 'Sende hæren hjem og dra alene', fare: 'blir trolig drept' },
    { tekst: 'Krysse elva med hæren', fare: 'høyforræderi og krig' },
];

export function CaesarRubicon({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'elva';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapp = LAPPER[modus][Math.min(beat, LAPPER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 44, near: 0.2, far: 400, position: [26, 12, 24] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp.tekst + (lapp.under ?? '')}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-[90%]"
                >
                    <div className="px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap">
                        {lapp.tekst}
                    </div>
                    {lapp.under && (
                        <div className="px-4 py-1.5 rounded-xl bg-slate-900/80 text-white font-bold text-lg md:text-2xl">
                            {lapp.under}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* To valg ved elva: venstre og høyre */}
            {modus === 'elva' && beat === 3 && (
                <div className="absolute bottom-[8%] left-0 right-0 flex justify-center gap-6 px-[5%]">
                    {[
                        { t: 'Krysser med soldatene', u: 'bryter loven', f: '#b91c1c' },
                        { t: 'Sender soldatene hjem', u: 'blir trolig drept', f: '#1e3a8a' },
                    ].map((k, i) => (
                        <motion.div
                            key={k.t}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.9 }}
                            className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl border-l-[10px] max-w-[42%]"
                            style={{ borderColor: k.f }}
                        >
                            <div className="text-2xl md:text-3xl font-black text-slate-900">
                                {k.t}
                            </div>
                            <div className="text-lg md:text-xl font-bold text-slate-600">{k.u}</div>
                        </motion.div>
                    ))}
                </div>
            )}

            {modus === 'valg' && beat === 1 && (
                <div className="absolute bottom-[8%] left-0 right-0 flex justify-center gap-4 px-[4%]">
                    {FARER.map((f, i) => (
                        <motion.div
                            key={f}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + i * 1.1 }}
                            className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl border-l-[10px] border-red-700 text-xl md:text-2xl font-black text-slate-900"
                        >
                            {f}
                        </motion.div>
                    ))}
                </div>
            )}

            {modus === 'valg' && beat >= 2 && (
                <div className="absolute bottom-[7%] left-0 right-0 flex justify-center gap-4 px-[4%]">
                    {VALG.map((k, i) => {
                        const vist = beat >= i + 2;
                        const aktiv = beat === i + 2;
                        return (
                            <motion.div
                                key={k.tekst}
                                initial={false}
                                animate={{
                                    opacity: vist ? 1 : 0,
                                    y: vist ? 0 : 20,
                                    scale: aktiv ? 1.06 : 1,
                                }}
                                transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                                className="relative w-[40%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl border-t-[8px] border-amber-600"
                            >
                                <div className="text-sm md:text-base font-black text-amber-700">
                                    VALG {i + 1}
                                </div>
                                <div className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                                    {k.tekst}
                                </div>
                                <div className="text-base md:text-lg font-bold text-red-700 mt-1">
                                    {k.fare}
                                </div>
                                {beat === 4 && (
                                    <motion.div
                                        initial={{ scale: 2, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.3 + i * 0.4 }}
                                        className="absolute -top-5 -right-3 w-12 h-12 rounded-full bg-red-700 text-white text-3xl font-black flex items-center justify-center shadow-lg"
                                    >
                                        ✕
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
