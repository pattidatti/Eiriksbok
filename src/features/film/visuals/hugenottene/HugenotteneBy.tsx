import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';
import { Figurer, type Plass } from './figurer';

/**
 * To byer i 3D. Paris i august 1572: en gate pyntet til bryllup, som blir tom og mørk.
 * Filmen viser aldri drapene, bare festen og den tomme gata etterpå.
 * La Rochelle: havnebyen med murer og tårn, som mister murene i 1629.
 */

type Modus = 'bryllup' | 'murby' | 'richelieu';

const PROTESTANT = '#0f766e';
const KONGE = '#1e3a8a';

// ---------- Felles byggeklosser ----------

/** Saltak som et prisme: trekant ekstrudert langs dybden. */
function useTak(bredde: number, hoyde: number, dybde: number) {
    return useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-bredde / 2, 0);
        s.lineTo(bredde / 2, 0);
        s.lineTo(0, hoyde);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, { depth: dybde, bevelEnabled: false });
        g.translate(0, 0, -dybde / 2);
        return g;
    }, [bredde, hoyde, dybde]);
}

function Hus({
    x,
    z,
    b,
    h,
    d,
    farge,
    takFarge = '#5b4636',
    rotY = 0,
}: {
    x: number;
    z: number;
    b: number;
    h: number;
    d: number;
    farge: string;
    takFarge?: string;
    rotY?: number;
}) {
    const tak = useTak(b + 0.4, b * 0.45, d + 0.4);
    return (
        <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
            <mesh position={[0, h / 2, 0]}>
                <boxGeometry args={[b, h, d]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh geometry={tak} position={[0, h, 0]}>
                <meshStandardMaterial color={takFarge} flatShading />
            </mesh>
        </group>
    );
}

// ---------- Paris ----------

const GATE_HUS = Array.from({ length: 14 }, (_, i) => {
    const side = i < 7 ? -1 : 1;
    const n = i % 7;
    return {
        x: side * 9.5,
        z: 24 - n * 8.4,
        h: 8 + frø(i) * 5,
        farge: ['#e7dcc4', '#d8c7a6', '#efe6d2', '#cdb991'][i % 4],
    };
});

const GIRLANDER = [20, 11, 2, -7, -16];

function Kirke() {
    const tak = useTak(15, 6, 26);
    return (
        <group position={[0, 0, -42]}>
            <mesh position={[0, 9, -6]}>
                <boxGeometry args={[14, 18, 26]} />
                <meshStandardMaterial color="#d6cdb8" flatShading />
            </mesh>
            <mesh geometry={tak} position={[0, 18, -6]}>
                <meshStandardMaterial color="#58606b" flatShading />
            </mesh>
            {[-6, 6].map((x) => (
                <mesh key={x} position={[x, 14, 8]}>
                    <boxGeometry args={[6, 28, 6]} />
                    <meshStandardMaterial color="#e2d9c3" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 11, 7.2]}>
                <boxGeometry args={[6, 22, 4]} />
                <meshStandardMaterial color="#e2d9c3" flatShading />
            </mesh>
            {/* Rosevinduet */}
            <mesh position={[0, 16, 9.3]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[2.2, 2.2, 0.3, 20]} />
                <meshStandardMaterial color="#7c3aed" emissive="#a78bfa" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 3.5, 9.3]}>
                <boxGeometry args={[3, 7, 0.4]} />
                <meshStandardMaterial color="#3f3328" />
            </mesh>
        </group>
    );
}

/** Flagg-girlandere over gata. Instanser, så de koster lite. */
function Girlandere({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const skala = useRef(1);
    const tid = useRef(0);
    const flagg = useMemo(() => {
        const ut: { x: number; z: number; y: number }[] = [];
        GIRLANDER.forEach((z) => {
            for (let i = 0; i < 9; i++) {
                const x = -8 + i * 2;
                ut.push({ x, z, y: 9.6 - Math.sin((i / 8) * Math.PI) * 1.4 });
            }
        });
        return ut;
    }, []);
    useEffect(() => {
        const c = new THREE.Color();
        const farger = ['#1d4ed8', '#eab308', '#f8fafc', '#b91c1c'];
        flagg.forEach((_, i) => ref.current?.setColorAt(i, c.set(farger[i % 4])));
        if (ref.current?.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [flagg]);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        skala.current = damp(skala.current, synlig ? 1 : 0, 1.6, dt);
        const m = ref.current;
        if (!m) return;
        flagg.forEach((f, i) => {
            o.position.set(f.x, f.y - 0.5, f.z);
            o.rotation.set(Math.PI, Math.sin(tid.current * 2 + i) * 0.25, 0);
            o.scale.setScalar(Math.max(0.0001, skala.current));
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, flagg.length]}>
            <coneGeometry args={[0.5, 1.1, 3]} />
            <meshStandardMaterial flatShading side={THREE.DoubleSide} />
        </instancedMesh>
    );
}

function Paris({ beat, playing }: { beat: number; playing: boolean }) {
    const natt = beat >= 3;
    const ambient = useRef<THREE.AmbientLight>(null);
    const sol = useRef<THREE.DirectionalLight>(null);
    const himmel = useRef<THREE.Color>(new THREE.Color('#cfe0ee'));
    const tåke = useRef<THREE.Fog>(null);
    const bakgrunn = useRef<THREE.Color>(null);

    useKamera(
        (b, t) => {
            switch (b) {
                case 0:
                    return { pos: v(24 - t * 0.5, 30, 52), se: v(0, 4, -10) };
                case 1:
                    return { pos: v(-3, 7 + t * 0.15, 4 - t * 0.3), se: v(0, 12, -36) };
                case 2:
                    return { pos: v(4 - t * 0.3, 3.2, 22), se: v(-1, 4, 0) };
                default:
                    return { pos: v(18, 34 - t * 0.2, 48), se: v(0, 2, -6) };
            }
        },
        beat,
        playing
    );

    const folk = useMemo<Plass[]>(() => {
        const farger = [
            '#7a2e2e',
            '#1e3a8a',
            '#4b3b2f',
            '#a16207',
            '#3f4652',
            '#6b5a48',
            '#0f766e',
        ];
        return Array.from({ length: 170 }, (_, i) => ({
            x: (frø(i) - 0.5) * 12,
            y: 0,
            z: 30 - frø(i + 500) * 58,
            farge: farger[i % farger.length],
            s: 0.9 + frø(i + 3) * 0.2,
        }));
    }, []);
    const skala = useRef<number[]>(folk.map(() => 1));
    const felles = useRef(1);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        felles.current = damp(felles.current, natt ? 0 : 1, 1.2, dt);
        skala.current = folk.map(() => felles.current);
        if (ambient.current)
            ambient.current.intensity = damp(ambient.current.intensity, natt ? 0.35 : 0.8, 1, dt);
        if (sol.current)
            sol.current.intensity = damp(sol.current.intensity, natt ? 0.25 : 1.1, 1, dt);
        himmel.current.lerp(new THREE.Color(natt ? '#3b4658' : '#cfe0ee'), 1 - Math.exp(-1 * dt));
        bakgrunn.current?.copy(himmel.current);
        tåke.current?.color.copy(himmel.current);
    });

    return (
        <>
            <color ref={bakgrunn} attach="background" args={['#cfe0ee']} />
            <fog ref={tåke} attach="fog" args={['#cfe0ee', 60, 160]} />
            <ambientLight ref={ambient} intensity={0.8} />
            <hemisphereLight args={['#f4ecdc', '#6b5d4a', 0.5]} />
            <directionalLight ref={sol} position={[-25, 40, 20]} intensity={1.1} color="#fff1d6" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color="#a39a88" roughness={1} />
            </mesh>
            {/* Brostein i gata */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -4]}>
                <planeGeometry args={[14, 80]} />
                <meshStandardMaterial color="#8a8274" roughness={1} />
            </mesh>
            {GATE_HUS.map((h, i) => (
                <Hus key={i} x={h.x} z={h.z} b={5} h={h.h} d={7.6} farge={h.farge} />
            ))}
            <Kirke />
            <Girlandere synlig={!natt} playing={playing} />
            {/* Lykter langs gata, som slukkes om natta */}
            {[18, 6, -6, -18].flatMap((z) =>
                [-1, 1].map((s) => (
                    <mesh key={`${z}-${s}`} position={[s * 6.6, 4, z]}>
                        <sphereGeometry args={[0.35, 8, 6]} />
                        <meshStandardMaterial
                            color={natt ? '#3f3a32' : '#fde68a'}
                            emissive={natt ? '#000000' : '#f59e0b'}
                            emissiveIntensity={natt ? 0 : 0.8}
                        />
                    </mesh>
                ))
            )}
            <Figurer plasser={folk} skala={skala} vugg={0.04} playing={playing} />
        </>
    );
}

// ---------- La Rochelle ----------

const SENTRUM = new THREE.Vector3(0, 0, -10);
const MUR_R = 17;
const MUR_PUNKTER = Array.from({ length: 10 }, (_, i) => {
    // Muren går rundt byen på landsiden. Havnesiden (mot +z) står åpen.
    const a = Math.PI * 0.18 + (i / 9) * Math.PI * 1.64;
    return new THREE.Vector3(
        SENTRUM.x + Math.sin(a) * MUR_R,
        0,
        SENTRUM.z + Math.cos(a) * MUR_R * 0.8
    );
});

function Tarn({
    x,
    z,
    r,
    h,
    flagg,
}: {
    x: number;
    z: number;
    r: number;
    h: number;
    flagg: THREE.MeshStandardMaterial;
}) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]}>
                <cylinderGeometry args={[r * 0.9, r, h, 10]} />
                <meshStandardMaterial color="#cbbf9f" flatShading />
            </mesh>
            <mesh position={[0, h + r * 0.7, 0]}>
                <coneGeometry args={[r * 1.05, r * 1.4, 10]} />
                <meshStandardMaterial color="#5b6470" flatShading />
            </mesh>
            <mesh position={[0, h + r * 1.4 + 1.2, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 2.4, 4]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[0.75, h + r * 1.4 + 1.9, 0]} material={flagg}>
                <boxGeometry args={[1.4, 0.9, 0.06]} />
            </mesh>
        </group>
    );
}

function LaRochelle({
    modus,
    beat,
    playing,
}: {
    modus: 'murby' | 'richelieu';
    beat: number;
    playing: boolean;
}) {
    const murer = useRef<THREE.Group>(null);
    const flaggMat = useMemo(() => new THREE.MeshStandardMaterial({ color: PROTESTANT }), []);
    const kirkeLys = useRef<THREE.MeshStandardMaterial>(null);
    const kongensFlagg = modus === 'richelieu';
    // Artikkelen sier at Richelieu tok byene, ikke at murene ble revet. Murene står, flaggene skifter.
    const murNede = false;
    const vakter = modus === 'murby' && beat >= 1;

    useKamera(
        (b, t) => {
            if (modus === 'murby') {
                return b === 0
                    ? { pos: v(30 - t * 0.6, 34, 52), se: v(0, 2, -8) }
                    : { pos: v(-38 + t * 0.3, 16, 14), se: v(-10, 3, -12) };
            }
            switch (b) {
                case 0:
                    return { pos: v(-30 + t * 0.4, 24, 44), se: v(0, 5, -2) };
                case 1:
                    return { pos: v(34 - t * 0.4, 30, 40), se: v(0, 2, -10) };
                default:
                    return { pos: v(16 - t * 0.2, 16, 14), se: v(2, 3, -10) };
            }
        },
        beat,
        playing
    );

    const hus = useMemo(() => {
        const ut: { x: number; z: number; h: number; farge: string; rot: number }[] = [];
        for (let i = 0; i < 60 && ut.length < 34; i++) {
            const x = (frø(i) - 0.5) * 26;
            const z = -10 + (frø(i + 77) - 0.5) * 22;
            const dx = (x - SENTRUM.x) / MUR_R;
            const dz = (z - SENTRUM.z) / (MUR_R * 0.8);
            if (dx * dx + dz * dz > 0.7) continue;
            if (Math.abs(x - 2) < 4 && Math.abs(z + 10) < 4) continue; // plass til kirka
            ut.push({
                x,
                z,
                h: 3 + frø(i + 9) * 3,
                farge: ['#efe6d2', '#e2d3b3', '#d9c8a5'][i % 3],
                rot: Math.round(frø(i + 40) * 3) * (Math.PI / 2),
            });
        }
        return ut;
    }, []);

    const soldater = useMemo<Plass[]>(
        () =>
            MUR_PUNKTER.slice(0, -1).flatMap((p, i) => {
                const q = MUR_PUNKTER[i + 1];
                return [0.3, 0.7].map((k) => ({
                    x: p.x + (q.x - p.x) * k,
                    y: 4.2,
                    z: p.z + (q.z - p.z) * k,
                    farge: PROTESTANT,
                    s: 1.1,
                }));
            }),
        []
    );
    const soldatSkala = useRef<number[]>(soldater.map(() => 0));
    const sSkala = useRef(0);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (murer.current)
            murer.current.scale.y = damp(murer.current.scale.y, murNede ? 0.08 : 1, 1.4, dt);
        const mål = new THREE.Color(kongensFlagg ? KONGE : PROTESTANT);
        flaggMat.color.lerp(mål, 1 - Math.exp(-2 * dt));
        sSkala.current = damp(sSkala.current, vakter ? 1 : 0, 2, dt);
        soldatSkala.current = soldater.map(() => sSkala.current);
        if (kirkeLys.current)
            kirkeLys.current.emissiveIntensity = damp(
                kirkeLys.current.emissiveIntensity,
                modus === 'richelieu' && beat >= 2 ? 1.2 : 0.25,
                1.5,
                dt
            );
    });

    const kirkeTak = useTak(7.4, 3.4, 11.4);

    return (
        <>
            <color attach="background" args={['#cfe2ee']} />
            <fog attach="fog" args={['#cfe2ee', 70, 180]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#eef4f8', '#6b6150', 0.55]} />
            <directionalLight position={[-30, 40, 25]} intensity={1.1} color="#fff6e6" />
            {/* Land og hav */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -40]}>
                <planeGeometry args={[300, 100]} />
                <meshStandardMaterial color="#9fa77d" roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 60]}>
                <planeGeometry args={[300, 100]} />
                <meshStandardMaterial
                    color="#3f86b5"
                    emissive="#1e5a85"
                    emissiveIntensity={0.35}
                    roughness={0.4}
                />
            </mesh>
            {/* Havnebassenget inne i byen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 7]}>
                <planeGeometry args={[9, 10]} />
                <meshStandardMaterial color="#3f86b5" emissive="#1e5a85" emissiveIntensity={0.35} />
            </mesh>

            {hus.map((h, i) => (
                <Hus key={i} x={h.x} z={h.z} b={3.2} h={h.h} d={4} farge={h.farge} rotY={h.rot} />
            ))}

            {/* Kirka (hugenottenes tempel) med opplyste vinduer */}
            <group position={[2, 0, -10]}>
                <mesh position={[0, 3.5, 0]}>
                    <boxGeometry args={[7, 7, 11]} />
                    <meshStandardMaterial color="#f3ecdc" flatShading />
                </mesh>
                <mesh geometry={kirkeTak} position={[0, 7, 0]}>
                    <meshStandardMaterial color="#4b5563" flatShading />
                </mesh>
                <mesh position={[0, 3.6, 5.55]}>
                    <boxGeometry args={[4.6, 3.2, 0.1]} />
                    <meshStandardMaterial
                        ref={kirkeLys}
                        color="#fde68a"
                        emissive="#f59e0b"
                        emissiveIntensity={0.25}
                    />
                </mesh>
            </group>

            {/* Muren rundt byen, som synker i 1629 */}
            <group ref={murer}>
                {MUR_PUNKTER.slice(0, -1).map((p, i) => {
                    const q = MUR_PUNKTER[i + 1];
                    const midt = p.clone().add(q).multiplyScalar(0.5);
                    const lengde = p.distanceTo(q);
                    const vinkel = Math.atan2(q.x - p.x, q.z - p.z);
                    return (
                        <mesh key={i} position={[midt.x, 2, midt.z]} rotation={[0, vinkel, 0]}>
                            <boxGeometry args={[1.2, 4, lengde + 0.6]} />
                            <meshStandardMaterial color="#bfb393" flatShading />
                        </mesh>
                    );
                })}
                {MUR_PUNKTER.map((p, i) => (
                    <mesh key={`t${i}`} position={[p.x, 2.8, p.z]}>
                        <cylinderGeometry args={[1.5, 1.7, 5.6, 8]} />
                        <meshStandardMaterial color="#b3a684" flatShading />
                    </mesh>
                ))}
            </group>

            {/* De to tårnene ved havneinnløpet */}
            <Tarn x={-5.5} z={13} r={2.6} h={12} flagg={flaggMat} />
            <Tarn x={5.5} z={13} r={2.2} h={10} flagg={flaggMat} />
            <Tarn x={MUR_PUNKTER[3].x} z={MUR_PUNKTER[3].z} r={1.9} h={8} flagg={flaggMat} />
            <Tarn x={MUR_PUNKTER[6].x} z={MUR_PUNKTER[6].z} r={1.9} h={8} flagg={flaggMat} />

            {/* To skip i havna */}
            {[
                [-1.5, 6],
                [2.2, 22],
            ].map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[1.8, 0.9, 4.4]} />
                        <meshStandardMaterial color="#6b4a2f" flatShading />
                    </mesh>
                    <mesh position={[0, 2.6, 0]}>
                        <cylinderGeometry args={[0.07, 0.07, 3.6, 4]} />
                        <meshStandardMaterial color="#3f2d1d" />
                    </mesh>
                    <mesh position={[0, 2.8, 0.05]}>
                        <boxGeometry args={[1.8, 2, 0.05]} />
                        <meshStandardMaterial color="#f5f0e6" />
                    </mesh>
                </group>
            ))}
            <Figurer plasser={soldater} skala={soldatSkala} playing={playing} />
        </>
    );
}

// ---------- Etiketter ----------

interface Lapp {
    tekst: string;
    farge?: string;
}

const LAPPER: Record<Modus, Lapp[][]> = {
    bryllup: [
        [{ tekst: 'Paris, august 1572' }],
        [
            { tekst: 'Margrete: katolikk', farge: '#7e22ce' },
            { tekst: 'Henrik av Navarra: protestant', farge: PROTESTANT },
        ],
        [{ tekst: 'Fred etter ti år med krig?' }],
        [{ tekst: 'Noen dager senere' }],
    ],
    murby: [
        [{ tekst: 'La Rochelle' }, { tekst: 'En av rundt 100 byer med murer', farge: PROTESTANT }],
        [{ tekst: 'Egne murer, egne soldater', farge: PROTESTANT }],
    ],
    richelieu: [
        [{ tekst: '1629' }, { tekst: 'Richelieu tar byene', farge: KONGE }],
        [{ tekst: 'Byene er kongens nå', farge: KONGE }],
        [{ tekst: 'Troen er lov. Men de kan ikke forsvare seg.', farge: PROTESTANT }],
    ],
};

export function HugenotteneBy({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'bryllup';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapper = LAPPER[modus][Math.min(beat, LAPPER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                key={modus === 'bryllup' ? 'paris' : 'rochelle'}
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [24, 30, 52] }}
                gl={{ antialias: true }}
            >
                {modus === 'bryllup' ? (
                    <Paris beat={beat} playing={playing} />
                ) : (
                    <LaRochelle modus={modus} beat={beat} playing={playing} />
                )}
            </Canvas>
            <div className="absolute top-[6%] left-0 right-0 flex flex-col items-center gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {lapper.map((l, i) => (
                        <motion.div
                            key={`${modus}-${beat}-${l.tekst}`}
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.5 }}
                            className={
                                l.farge
                                    ? 'px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-bold text-2xl md:text-3xl shadow-xl border-l-[10px] whitespace-nowrap'
                                    : 'px-6 py-2.5 rounded-2xl bg-slate-900/90 text-white font-black text-3xl md:text-4xl shadow-xl whitespace-nowrap'
                            }
                            style={l.farge ? { borderColor: l.farge } : undefined}
                        >
                            {l.tekst}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
