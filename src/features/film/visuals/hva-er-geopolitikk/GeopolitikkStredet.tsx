import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, myk, v } from './felles';
import { Hjornekort, Overskrift } from './Brikker';

/**
 * Havet i 3D, i to moduser.
 *
 * «stredet»: et smalt sund mellom to land (Hormuzstredet). Beat 0: to tankskip. Beat 1:
 * en lang rekke tankskip (20 millioner fat om dagen). Beat 2: en femtedel av all olje.
 * Beat 3: kameraet følger ett skip. Beat 4: uro, et rødt varsel, skipene sakker farten.
 *
 * «havn»: en havn ved kysten (Mahan, 1890). Beat 0: skipene ligger ved kaia. Beat 1:
 * havområdet utenfor lyser. Beat 2: handelsskipene seiler ut. Beat 3: grå marineskip
 * seiler ut. Beat 4: havna fryser, og alle skipene ligger fast ved kaia.
 */

type Modus = 'stredet' | 'havn';

const TANKSKIP = 9;
const AVSTAND = 22;
const LOYPE = TANKSKIP * AVSTAND;

/** Hvor tankskip nr. i ligger ved tiden T. Samme funksjon brukes av kameraet. */
function tankX(i: number, T: number) {
    const x = (T * 2.2 + i * AVSTAND) % LOYPE;
    return x - LOYPE / 2;
}

function Tankskip({ farge = '#b91c1c' }: { farge?: string }) {
    return (
        <group>
            <mesh position={[0, 0.7, 0]}>
                <boxGeometry args={[12, 1.4, 2.6]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 1.55, 0]}>
                <boxGeometry args={[12, 0.3, 2.6]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            {/* Baugen */}
            <mesh position={[6.6, 0.85, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[1.3, 1.3, 1.7, 3]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            {/* Rørgata på dekk */}
            <mesh position={[0.5, 1.85, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.18, 0.18, 8, 6]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            {/* Brua bak */}
            <mesh position={[-4.6, 2.8, 0]}>
                <boxGeometry args={[1.8, 2.2, 2.2]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[-4.9, 4.4, 0]}>
                <cylinderGeometry args={[0.35, 0.35, 1.2, 8]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
        </group>
    );
}

function Lasteskip({ farge }: { farge: string }) {
    return (
        <group>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[8, 1.2, 2.2]} />
                <meshStandardMaterial color="#1e3a8a" flatShading />
            </mesh>
            <mesh position={[0.8, 1.6, 0]}>
                <boxGeometry args={[4.6, 0.9, 1.8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[-3, 2, 0]}>
                <boxGeometry args={[1.2, 1.6, 1.8]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
        </group>
    );
}

function Marineskip() {
    return (
        <group>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[9, 1.2, 1.8]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </mesh>
            <mesh position={[4.9, 0.7, 0]}>
                <cylinderGeometry args={[0.95, 0.95, 1.3, 3]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </mesh>
            <mesh position={[-0.5, 1.9, 0]}>
                <boxGeometry args={[2.6, 1.6, 1.4]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[-0.5, 3.3, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 1.6, 6]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[3, 1.45, 0]}>
                <cylinderGeometry args={[0.45, 0.45, 0.4, 10]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
        </group>
    );
}

/** Land som en rad lave blokker og åser, i sandfarge, på hver side av sundet. */
function Kyst({ side, farge = '#d6c49a' }: { side: 1 | -1; farge?: string }) {
    const biter = useMemo(
        () =>
            Array.from({ length: 16 }, (_, i) => {
                const x = -150 + i * 20;
                const inn = 9 + frø(i * 3 + (side > 0 ? 1 : 7)) * 7 - (Math.abs(x) < 25 ? 2 : 0);
                return { x, inn, h: 0.8 + frø(i + side * 11) * 1.2 };
            }),
        [side]
    );
    const aaser = useMemo(
        () =>
            Array.from({ length: 10 }, (_, i) => ({
                x: -130 + i * 28 + frø(i + 40) * 10,
                z: side * (30 + frø(i + 50) * 20),
                h: 5 + frø(i + 60) * 8,
            })),
        [side]
    );
    return (
        <group>
            {biter.map((b, i) => (
                <mesh key={i} position={[b.x, b.h / 2 - 0.2, side * (b.inn + 30)]}>
                    <boxGeometry args={[21, b.h, 60]} />
                    <meshStandardMaterial color={farge} flatShading />
                </mesh>
            ))}
            {aaser.map((a, i) => (
                <mesh key={i} position={[a.x, a.h / 2, a.z]}>
                    <coneGeometry args={[9, a.h, 5]} />
                    <meshStandardMaterial color="#b49a6a" flatShading />
                </mesh>
            ))}
        </group>
    );
}

function StredetScene({ beat, playing }: { beat: number; playing: boolean }) {
    const skip = useRef<(THREE.Group | null)[]>([]);
    const varsel = useRef<THREE.Mesh>(null);
    const varselMat = useRef<THREE.MeshBasicMaterial>(null);
    const T = useRef(0);
    const fart = useRef(1);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const k = forste.current;
        fart.current = k
            ? beat >= 4
                ? 0.25
                : 1
            : damp(fart.current, beat >= 4 ? 0.25 : 1, 1.5, dt);
        T.current += dt * fart.current;
        const synlige = beat === 0 ? 2 : TANKSKIP;
        skip.current.forEach((g, i) => {
            if (!g) return;
            g.position.x = tankX(i, T.current);
            g.position.z = i % 2 === 0 ? -2.2 : 2.2;
            g.position.y = Math.sin(T.current * 1.3 + i) * 0.08;
            const mål = i < synlige ? 1 : 0.001;
            const s = k ? mål : damp(g.scale.x, mål, 4, dt || 0.016);
            g.scale.setScalar(Math.max(s, 0.001));
            g.visible = s > 0.02;
        });
        if (varsel.current && varselMat.current) {
            const vis = beat >= 4;
            varselMat.current.opacity = vis ? 0.28 + Math.sin(tid.current * 4) * 0.1 : 0;
            varsel.current.visible = vis;
        }
        // Kameraet. Beat 3 følger tankskip nr. 0 med samme tidsfunksjon som flytter det.
        let pos: THREE.Vector3;
        let mål: THREE.Vector3;
        const t = tid.current;
        if (beat === 0) {
            pos = v(-112 + t * 0.4, 30, 46);
            mål = v(-84, 0, 0);
        } else if (beat === 1 || beat === 2) {
            pos = v(0, 62, 84);
            mål = v(0, 0, 0);
        } else if (beat === 3) {
            const x = tankX(0, T.current);
            pos = v(x - 16, 7, 20);
            mål = v(x + 1, 1.5, 0);
        } else {
            pos = v(30, 46, 58);
            mål = v(0, 0, 0);
        }
        const a = k || beat === 3 ? 1 : 1 - Math.exp(-1.3 * dt);
        camera.position.lerp(pos, a);
        se.current.lerp(mål, a);
        camera.lookAt(se.current);
        forste.current = false;
    });
    return (
        <>
            <color attach="background" args={['#bfdbfe']} />
            <fog attach="fog" args={['#bfdbfe', 90, 260]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#ffffff', '#64748b', 0.6]} />
            <directionalLight position={[20, 40, 20]} intensity={1.6} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[600, 600]} />
                <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={0.35} />
            </mesh>
            <Kyst side={-1} />
            <Kyst side={1} />
            {Array.from({ length: TANKSKIP }, (_, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        skip.current[i] = g;
                    }}
                >
                    <Tankskip farge={i % 3 === 1 ? '#7f1d1d' : '#b91c1c'} />
                </group>
            ))}
            <mesh ref={varsel} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <circleGeometry args={[34, 40]} />
                <meshBasicMaterial ref={varselMat} color="#ef4444" transparent opacity={0} />
            </mesh>
        </>
    );
}

const KAI_X = -18;
const HANDEL = [
    { z: -9, farge: '#f97316' },
    { z: -3, farge: '#16a34a' },
];
const MARINE = [{ z: 3 }, { z: 9 }];

function HavnScene({ beat, playing }: { beat: number; playing: boolean }) {
    const handel = useRef<(THREE.Group | null)[]>([]);
    const marine = useRef<(THREE.Group | null)[]>([]);
    const is = useRef<THREE.Mesh>(null);
    const sone = useRef<THREE.Mesh>(null);
    const soneMat = useRef<THREE.MeshBasicMaterial>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const t = tid.current;
        const k = forste.current;
        // Hvor langt ut skipene har kommet: 0 ved kaia, 1 langt ute.
        const utHandel = beat === 2 ? myk(0.35 + t / 5) : beat === 3 ? 1 : 0;
        const utMarine = beat === 3 ? myk(0.35 + t / 5) : 0;
        handel.current.forEach((g, i) => {
            if (!g) return;
            g.position.x = KAI_X + 7 + utHandel * (30 + i * 8);
            g.position.z = HANDEL[i].z + utHandel * (i === 0 ? -8 : 4);
        });
        marine.current.forEach((g, i) => {
            if (!g) return;
            g.position.x = KAI_X + 7 + utMarine * (24 + i * 8);
            g.position.z = MARINE[i].z + utMarine * (i === 0 ? 6 : 12);
        });
        if (is.current) {
            const mål = beat >= 4 ? 1 : 0.001;
            const s = k ? mål : damp(is.current.scale.x, mål, 1.6, dt);
            is.current.scale.set(Math.max(s, 0.001), Math.max(s, 0.001), 1);
            is.current.visible = s > 0.02;
        }
        if (sone.current && soneMat.current) {
            const vis = beat === 1;
            soneMat.current.opacity = vis ? 0.85 + Math.sin(t * 3) * 0.1 : 0;
            sone.current.visible = vis;
        }
        let pos: THREE.Vector3;
        let mål: THREE.Vector3;
        if (beat === 0) {
            pos = v(-2 + t * 0.3, 14, 30);
            mål = v(-12, 1, 0);
        } else if (beat === 1) {
            pos = v(-30, 48, 50);
            mål = v(22, 0, 0);
        } else if (beat === 2 || beat === 3) {
            pos = v(-22, 15, 32);
            mål = v(4, 0, 2);
        } else {
            pos = v(4, 30, 34);
            mål = v(-10, 0, 0);
        }
        const a = k ? 1 : 1 - Math.exp(-1.3 * dt);
        camera.position.lerp(pos, a);
        se.current.lerp(mål, a);
        camera.lookAt(se.current);
        forste.current = false;
    });
    const hus = useMemo(
        () =>
            Array.from({ length: 22 }, (_, i) => ({
                x: KAI_X - 8 - frø(i) * 24,
                z: -22 + (i % 11) * 4.2 + frø(i + 9) * 1.5,
                h: 1.5 + frø(i + 20) * 3,
                farge: ['#fef3c7', '#fecaca', '#e2e8f0', '#fde68a'][i % 4],
            })),
        []
    );
    return (
        <>
            <color attach="background" args={['#cbd5e1']} />
            <fog attach="fog" args={['#cbd5e1', 80, 220]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#ffffff', '#64748b', 0.6]} />
            <directionalLight position={[10, 40, 25]} intensity={1.5} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[600, 600]} />
                <meshStandardMaterial color="#1e40af" emissive="#1e3a8a" emissiveIntensity={0.4} />
            </mesh>
            {/* Land og kai */}
            <mesh position={[KAI_X - 60, 0.6, 0]}>
                <boxGeometry args={[120, 1.4, 200]} />
                <meshStandardMaterial color="#65a30d" flatShading />
            </mesh>
            <mesh position={[KAI_X + 1, 0.7, 0]}>
                <boxGeometry args={[2.4, 1.4, 34]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>
            {hus.map((h, i) => (
                <mesh key={i} position={[h.x, 1.3 + h.h / 2, h.z]}>
                    <boxGeometry args={[2.6, h.h, 2.6]} />
                    <meshStandardMaterial color={h.farge} flatShading />
                </mesh>
            ))}
            {HANDEL.map((s, i) => (
                <group
                    key={`h${i}`}
                    ref={(g) => {
                        handel.current[i] = g;
                    }}
                    position={[KAI_X + 7, 0, s.z]}
                >
                    <Lasteskip farge={s.farge} />
                </group>
            ))}
            {MARINE.map((s, i) => (
                <group
                    key={`m${i}`}
                    ref={(g) => {
                        marine.current[i] = g;
                    }}
                    position={[KAI_X + 7, 0, s.z]}
                >
                    <Marineskip />
                </group>
            ))}
            {/* Havområdet utenfor havna */}
            <mesh ref={sone} rotation={[-Math.PI / 2, 0, 0]} position={[28, 0.05, 0]}>
                <ringGeometry args={[30, 33, 64]} />
                <meshBasicMaterial ref={soneMat} color="#facc15" transparent opacity={0} />
            </mesh>
            {/* Isen som legger seg over havna, fra kaia og utover */}
            <mesh
                ref={is}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[KAI_X + 2, 0.08, 0]}
                scale={[0.001, 0.001, 1]}
            >
                <circleGeometry args={[30, 40]} />
                <meshStandardMaterial color="#f1f5f9" emissive="#e2e8f0" emissiveIntensity={0.4} />
            </mesh>
        </>
    );
}

const TEKSTER: Record<Modus, string[]> = {
    stredet: [
        'Hormuzstredet, ved Persiabukta',
        'Ca. 20 millioner fat olje om dagen (2024)',
        'Omtrent en femtedel av all olje verden bruker',
        'Kanskje til bilen hjemme?',
        'Uro her: bensinprisen i Norge kan stige',
    ],
    havn: [
        'Mahan, 1890: en bok om krig til sjøs',
        'Kontroller havområdene',
        'Skip ut når du vil: handel',
        'Frakte soldater og beskytte seg selv',
        'Hva om havna fryser?',
    ],
};

function Femtedel() {
    return (
        <Hjornekort>
            <div className="flex items-center gap-3">
                {Array.from({ length: 5 }, (_, i) => (
                    <div
                        key={i}
                        style={{
                            width: 40,
                            height: 56,
                            borderRadius: 8,
                            background: i === 0 ? '#b91c1c' : '#cbd5e1',
                            border: '3px solid #0f172a',
                        }}
                    />
                ))}
            </div>
            <div className="text-2xl font-bold mt-2">Omtrent 1 av 5 fat</div>
        </Hjornekort>
    );
}

function Pris() {
    return (
        <Hjornekort>
            <div className="flex items-center gap-4">
                <motion.div
                    animate={{ y: [6, -6, 6] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="text-5xl font-black text-red-600"
                >
                    ↑
                </motion.div>
                <div>
                    <div className="text-2xl font-bold">Bensinpris i Norge</div>
                    <div className="text-xl text-slate-600">kan stige</div>
                </div>
            </div>
        </Hjornekort>
    );
}

export function GeopolitikkStredet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus === 'havn' ? 'havn' : 'stredet';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = TEKSTER[modus][Math.min(beat, 4)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 400, position: [0, 60, 80] }}
            >
                {modus === 'stredet' ? (
                    <StredetScene beat={beat} playing={playing} />
                ) : (
                    <HavnScene beat={beat} playing={playing} />
                )}
            </Canvas>
            <AnimatePresence mode="wait">
                <Overskrift
                    key={`${modus}-${beat}`}
                    tekst={tekst}
                    tone={modus === 'stredet' && beat === 4 ? 'rod' : 'lys'}
                />
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'stredet' && beat === 2 && <Femtedel key="femtedel" />}
                {modus === 'stredet' && beat === 4 && <Pris key="pris" />}
            </AnimatePresence>
        </div>
    );
}
