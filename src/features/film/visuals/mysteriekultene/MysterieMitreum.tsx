import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Mitreet: et lite rom under en gate i Roma. Gata ligger øverst, en trapp går ned, og nede
 * er det to lange steinbenker med en midtgang fram til alteret og bildet av oksedrapet.
 *
 * Moduser:
 * - `ned`: fra gata, ned trappa og inn i rommet, til mennene spiser i fakkellys.
 * - `rom`: rommet sett innenfra, med benker, alter, matrester og bildet på endeveggen.
 * - `tomt`: etter 392. Fakler slukket, benkene tomme, og lys fra trappa.
 *
 * Koordinater: rommet ligger under bakken (y < 0), langs z fra -13 (endeveggen) til 0,5.
 * Trappa går fra gata (y = 0, z = 6) ned til døra. I `rom` beat 0 er den ene langveggen
 * tatt bort, så eleven ser rommet i snitt.
 */

type Modus = 'ned' | 'rom' | 'tomt';

const ROM_B = 5; // bredde (x)
const ROM_H = 2.6; // høyden på veggene, hvelvet kommer i tillegg
const ROM_BUNN = -6.2; // gulvet
const ROM_FRA = -13; // endeveggen
const ROM_TIL = 0.5; // veggen ved trappa

function kameraFor(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'ned') {
            switch (beat) {
                case 0:
                    return { pos: v(0.5, 9 - t * 0.1, 22), se: v(0, -0.5, 4) };
                case 1:
                    return { pos: v(0, 2.4, 7.4), se: v(0, -5, 0.6) };
                case 2:
                    return { pos: v(0, -4.0, 0), se: v(0, -5.6, -10) };
                case 3:
                    return { pos: v(0, -4.3, -7.6), se: v(0, -3.8, -13) };
                default:
                    return { pos: v(0, -3.9, 0.3), se: v(0, -5.2, -8) };
            }
        }
        if (modus === 'rom') {
            switch (beat) {
                case 0:
                    return { pos: v(8.5, -2.6, -4), se: v(0, -5.4, -6.5) };
                case 1:
                    return { pos: v(0, -4.0, 0), se: v(0, -5.6, -10) };
                case 2:
                    return { pos: v(-0.2, -3.8, -2.2), se: v(-1.6, -5.6, -7.5) };
                case 3:
                    return { pos: v(0, -4.4, -8.2), se: v(0, -3.8, -13) };
                default:
                    return { pos: v(0.4, -4.3, -7.4 - t * 0.04), se: v(0, -3.8, -13) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(0, -4.0, 0), se: v(0, -5.6, -10) };
            case 1:
                return { pos: v(-1.4, -4.2, -3), se: v(0.5, -5.4, -10) };
            case 2:
                return { pos: v(0, -4.6, -9.5), se: v(0, -3.6, 2) };
            default:
                return { pos: v(0.5, 9 - t * 0.1, 22), se: v(0, -0.5, 4) };
        }
    };
}

const STEIN = '#9a8f80';
const STEIN_MORK = '#6e6357';

/** Gata over bakken: brostein, hus på begge sider og hullet med trappa ned. */
function Gata() {
    const hus = useMemo(
        () =>
            Array.from({ length: 10 }, (_, i) => {
                const side = i % 2 === 0 ? -1 : 1;
                const n = Math.floor(i / 2);
                return {
                    x: side * (6 + frø(i) * 1.5),
                    z: -10 + n * 6 + frø(i + 9) * 1.5,
                    h: 4 + frø(i + 3) * 4,
                    b: 4 + frø(i + 5) * 2,
                    farge: ['#d9b48a', '#c99a6e', '#e2c9a3', '#b9835a'][i % 4],
                };
            }),
        []
    );
    return (
        <group>
            {/* Gatelaget rundt hullet: fire plater rundt åpningen over trappa */}
            <mesh position={[0, -0.15, -12]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[30, 28]} />
                <meshStandardMaterial color="#c9b79c" emissive="#3a2e20" emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, -0.15, 12.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[30, 13]} />
                <meshStandardMaterial color="#c9b79c" emissive="#3a2e20" emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[-9.5, -0.15, 4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[17, 4]} />
                <meshStandardMaterial color="#c9b79c" emissive="#3a2e20" emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[9.5, -0.15, 4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[17, 4]} />
                <meshStandardMaterial color="#c9b79c" emissive="#3a2e20" emissiveIntensity={0.25} />
            </mesh>
            {/* Lav mur rundt åpningen */}
            {[-0.5, 0.5].map((s) => (
                <mesh key={s} position={[s * 2.0, 0.25, 4]}>
                    <boxGeometry args={[0.3, 0.8, 4]} />
                    <meshStandardMaterial color={STEIN} flatShading />
                </mesh>
            ))}
            {hus.map((h, i) => (
                <group key={i} position={[h.x, h.h / 2 - 0.15, h.z]}>
                    <mesh>
                        <boxGeometry args={[h.b, h.h, 5]} />
                        <meshStandardMaterial color={h.farge} flatShading />
                    </mesh>
                    <mesh position={[0, h.h / 2 + 0.25, 0]}>
                        <boxGeometry args={[h.b + 0.4, 0.5, 5.4]} />
                        <meshStandardMaterial color="#a4512e" flatShading />
                    </mesh>
                </group>
            ))}
            {/* Noen folk i gata */}
            {[
                [3.2, 7],
                [-3.4, 1],
                [2.6, -5],
                [-2.8, 9],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.75, z]}>
                    <capsuleGeometry args={[0.32, 0.9, 3, 8]} />
                    <meshStandardMaterial color={['#e7e2d4', '#7c4a2d', '#c2410c', '#e7e2d4'][i]} />
                </mesh>
            ))}
        </group>
    );
}

/** Trappa fra gata og ned til døra i rommet. */
function Trapp() {
    const trinn = 18;
    return (
        <group>
            {Array.from({ length: trinn }, (_, i) => (
                <mesh key={i} position={[0, -0.3 - i * 0.33, 5.8 - i * 0.3]}>
                    <boxGeometry args={[1.8, 0.33, 0.6]} />
                    <meshStandardMaterial color={i % 2 ? STEIN : '#8c8173'} flatShading />
                </mesh>
            ))}
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 1.05, -3.1, 3.3]}>
                    <boxGeometry args={[0.3, 6.2, 5.6]} />
                    <meshStandardMaterial color={STEIN_MORK} flatShading />
                </mesh>
            ))}
        </group>
    );
}

/** Selve rommet: gulv, vegger, hvelv, benker, alter og bildet på endeveggen. */
function Rom({ tomt, mennFram, snitt }: { tomt: boolean; mennFram: boolean; snitt: boolean }) {
    const midt = (ROM_FRA + ROM_TIL) / 2;
    const lengde = ROM_TIL - ROM_FRA;
    const menn = useMemo(() => {
        const liste: { x: number; z: number; farge: string }[] = [];
        for (let i = 0; i < 10; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const n = Math.floor(i / 2);
            liste.push({
                x: side * 1.75,
                z: -10.8 + n * 1.4,
                farge: ['#5b3a24', '#7a5a3c', '#46352a', '#8a6a48'][i % 4],
            });
        }
        return liste;
    }, []);
    return (
        <group>
            {/* Gulv */}
            <mesh position={[0, ROM_BUNN, midt]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[ROM_B, lengde]} />
                <meshStandardMaterial color="#7d6b58" emissive="#2a1d12" emissiveIntensity={0.4} />
            </mesh>
            {/* Sidevegger */}
            {(snitt ? [-1] : [-1, 1]).map((s) => (
                <mesh key={s} position={[s * (ROM_B / 2 + 0.15), ROM_BUNN + ROM_H / 2, midt]}>
                    <boxGeometry args={[0.3, ROM_H, lengde]} />
                    <meshStandardMaterial
                        color="#8a7a66"
                        emissive="#2a1d12"
                        emissiveIntensity={0.3}
                        flatShading
                    />
                </mesh>
            ))}
            {/* Hvelvet: et halvt rør langs rommet (se guiden §3c punkt 39). Borte i snittet. */}
            <mesh
                visible={!snitt}
                position={[0, ROM_BUNN + ROM_H, midt]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <cylinderGeometry
                    args={[
                        ROM_B / 2 + 0.3,
                        ROM_B / 2 + 0.3,
                        lengde,
                        16,
                        1,
                        true,
                        -Math.PI / 2,
                        Math.PI,
                    ]}
                />
                <meshStandardMaterial
                    color="#7a6a57"
                    emissive="#20160d"
                    emissiveIntensity={0.3}
                    side={THREE.DoubleSide}
                    flatShading
                />
            </mesh>
            {/* Endeveggen */}
            <mesh position={[0, ROM_BUNN + 2.6, ROM_FRA - 0.15]}>
                <boxGeometry args={[ROM_B + 0.6, 5.4, 0.3]} />
                <meshStandardMaterial
                    color="#8a7a66"
                    emissive="#2a1d12"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
            {/* Veggen ved trappa, med døråpning */}
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 1.75, ROM_BUNN + 2.6, ROM_TIL]}>
                    <boxGeometry args={[1.8, 5.4, 0.3]} />
                    <meshStandardMaterial color="#8a7a66" flatShading />
                </mesh>
            ))}
            {/* Benkene */}
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 1.75, ROM_BUNN + 0.4, midt - 0.5]}>
                    <boxGeometry args={[1.3, 0.8, lengde - 2]} />
                    <meshStandardMaterial
                        color="#b3a690"
                        emissive="#3a2e20"
                        emissiveIntensity={0.25}
                        flatShading
                    />
                </mesh>
            ))}
            {/* Alteret */}
            <mesh position={[0, ROM_BUNN + 0.55, ROM_FRA + 1.1]}>
                <boxGeometry args={[1.2, 1.1, 0.8]} />
                <meshStandardMaterial
                    color="#c8bca6"
                    emissive="#3a2e20"
                    emissiveIntensity={0.25}
                    flatShading
                />
            </mesh>
            {/* Bildet på endeveggen: en steinplate med et uthogd felt */}
            <group position={[0, ROM_BUNN + 2.5, ROM_FRA + 0.05]}>
                <mesh>
                    <boxGeometry args={[2.6, 1.8, 0.15]} />
                    <meshStandardMaterial
                        color="#d6c9ae"
                        emissive="#6b4a22"
                        emissiveIntensity={tomt ? 0.05 : 0.35}
                        flatShading
                    />
                </mesh>
                {/* Okse: kropp, hode, horn og bein, forenklet som et relieff */}
                <mesh position={[0.1, -0.25, 0.12]}>
                    <boxGeometry args={[1.2, 0.5, 0.12]} />
                    <meshStandardMaterial color="#8f7c5e" flatShading />
                </mesh>
                <mesh position={[-0.62, -0.12, 0.12]}>
                    <boxGeometry args={[0.34, 0.32, 0.12]} />
                    <meshStandardMaterial color="#8f7c5e" flatShading />
                </mesh>
                {[-0.7, -0.54].map((x) => (
                    <mesh
                        key={x}
                        position={[x, 0.1, 0.12]}
                        rotation={[0, 0, x < -0.6 ? 0.5 : -0.5]}
                    >
                        <coneGeometry args={[0.04, 0.18, 6]} />
                        <meshStandardMaterial color="#8f7c5e" flatShading />
                    </mesh>
                ))}
                {[-0.35, -0.15, 0.35, 0.55].map((x) => (
                    <mesh key={x} position={[x, -0.66, 0.12]}>
                        <boxGeometry args={[0.1, 0.36, 0.1]} />
                        <meshStandardMaterial color="#8f7c5e" flatShading />
                    </mesh>
                ))}
                {/* Den unge mannen med lue, oppå oksen */}
                <mesh position={[0.25, 0.3, 0.16]} rotation={[0, 0, -0.35]}>
                    <capsuleGeometry args={[0.13, 0.45, 3, 8]} />
                    <meshStandardMaterial color="#9a3412" flatShading />
                </mesh>
                <mesh position={[0.08, 0.72, 0.16]}>
                    <sphereGeometry args={[0.12, 10, 8]} />
                    <meshStandardMaterial color="#c58f63" flatShading />
                </mesh>
                <mesh position={[0.05, 0.86, 0.16]} rotation={[0, 0, 0.5]}>
                    <coneGeometry args={[0.11, 0.2, 8]} />
                    <meshStandardMaterial color="#9a3412" flatShading />
                </mesh>
            </group>
            {/* Mat på benkene: små skåler som sier «vi spiste her» */}
            {!tomt &&
                [-1, 1].flatMap((s) =>
                    [-10.1, -8.0, -5.9, -3.8].map((z, i) => (
                        <mesh key={`${s}-${i}`} position={[s * 1.25, ROM_BUNN + 0.86, z]}>
                            <cylinderGeometry args={[0.18, 0.12, 0.1, 10]} />
                            <meshStandardMaterial
                                color="#c2410c"
                                emissive="#7c2d12"
                                emissiveIntensity={0.3}
                            />
                        </mesh>
                    ))
                )}
            {/* Mennene på benkene */}
            {!tomt &&
                menn.map((m, i) => (
                    <group key={i} visible={mennFram}>
                        <mesh position={[m.x, ROM_BUNN + 1.35, m.z]}>
                            <capsuleGeometry args={[0.28, 0.5, 3, 8]} />
                            <meshStandardMaterial color={m.farge} />
                        </mesh>
                        <mesh position={[m.x, ROM_BUNN + 2.05, m.z]}>
                            <sphereGeometry args={[0.2, 10, 8]} />
                            <meshStandardMaterial color="#c58f63" />
                        </mesh>
                    </group>
                ))}
        </group>
    );
}

/** Faklene på veggene. Lyset blafrer bare når filmen går. */
function Fakler({ tent, playing }: { tent: boolean; playing: boolean }) {
    const lys = useRef<(THREE.PointLight | null)[]>([]);
    const flammer = useRef<(THREE.Mesh | null)[]>([]);
    const styrke = useRef(tent ? 1 : 0);
    const tid = useRef(0);
    const plasser: [number, number, number][] = [
        [-2.3, ROM_BUNN + 2.2, -11],
        [2.3, ROM_BUNN + 2.2, -11],
        [-2.3, ROM_BUNN + 2.2, -5],
        [2.3, ROM_BUNN + 2.2, -5],
    ];
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        styrke.current = damp(styrke.current, tent ? 1 : 0, 1.5, dt === 0 ? 1 : dt);
        plasser.forEach((_, i) => {
            const blaff = playing ? 1 + Math.sin(tid.current * 9 + i * 2) * 0.12 : 1;
            const l = lys.current[i];
            if (l) l.intensity = 6 * styrke.current * blaff;
            const f = flammer.current[i];
            if (f) f.scale.setScalar(Math.max(0.001, styrke.current));
        });
    });
    return (
        <>
            {plasser.map((p, i) => (
                <group key={i} position={p}>
                    <mesh position={[0, -0.25, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
                        <meshStandardMaterial color="#3b2a1a" />
                    </mesh>
                    <mesh
                        ref={(m) => {
                            flammer.current[i] = m;
                        }}
                        position={[0, 0.08, 0]}
                    >
                        <coneGeometry args={[0.1, 0.3, 8]} />
                        <meshBasicMaterial color="#ffb347" />
                    </mesh>
                    <pointLight
                        ref={(l) => {
                            lys.current[i] = l;
                        }}
                        color="#ff9a3d"
                        intensity={6}
                        distance={7}
                        decay={1.4}
                    />
                </group>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const mal = useMemo(() => kameraFor(modus), [modus]);
    useKamera(mal, beat, playing);
    const tomt = modus === 'tomt';
    const dagslys = (modus === 'ned' && beat === 0) || (modus === 'tomt' && beat >= 3);
    const mennFram = modus === 'ned' ? beat >= 4 : modus === 'rom';
    const snitt = modus === 'rom' && beat === 0;
    return (
        <>
            <color attach="background" args={[dagslys ? '#bcd3ea' : '#1a130d']} />
            <fog
                attach="fog"
                args={[dagslys ? '#d7e3ef' : '#1a130d', dagslys ? 30 : 14, dagslys ? 80 : 40]}
            />
            <ambientLight intensity={dagslys ? 0.9 : tomt ? 0.35 : 0.3} />
            <hemisphereLight args={['#fff1d6', '#3a2a1c', dagslys ? 0.8 : 0.25]} />
            <directionalLight
                position={[10, 20, 12]}
                intensity={dagslys ? 1.1 : 0.15}
                color="#fff3dc"
            />
            {/* Lys som faller ned trappa i det tomme rommet */}
            {tomt && (
                <pointLight
                    position={[0, -1.5, 4.5]}
                    color="#dfe8f5"
                    intensity={9}
                    distance={12}
                    decay={1.3}
                />
            )}
            {modus !== 'rom' && <Gata />}
            <Trapp />
            <Rom tomt={tomt} mennFram={mennFram} snitt={snitt} />

            <Fakler tent={!tomt} playing={playing} />
        </>
    );
}

const LAPPER: Record<Modus, string[]> = {
    ned: [
        'En gate i Roma',
        'Trappa ned',
        'To benker og en midtgang',
        'Bildet på endeveggen',
        'Ingen får fortelle hva som skjer her',
    ],
    rom: [
        'Hule, eller kjeller som føltes som en hule',
        'Benker, midtgang og alter',
        'Matrester: de spiste sammen',
        'Oksedrapet: verden skulle fornyes',
        'Forskerne: et bilde fra en fortelling',
    ],
    tomt: [
        'Etter 392: tomme rom',
        'Kultene forsvant',
        'Kristendommen: mye av det samme, i det åpne',
        'Ute i det åpne, eller bak lukkede dører',
    ],
};

const KRISTENDOM = [
    'Et fellesskap å høre til i',
    'En seremoni som slipper deg inn',
    'Et løfte om noe etter døden',
];

export function MysterieMitreum({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'ned';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapper = LAPPER[modus];
    const lapp = lapper[Math.min(beat, lapper.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 50, near: 0.1, far: 200, position: [14, 7, 16] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '6%' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={lapp}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black shadow-xl text-center"
                        style={{ fontSize: 30, maxWidth: 860 }}
                    >
                        {lapp}
                    </motion.div>
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {modus === 'tomt' && beat === 2 && (
                    <motion.div
                        key="kristendom"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex justify-center pointer-events-none"
                        style={{ bottom: '7%' }}
                    >
                        <div className="flex gap-4">
                            {KRISTENDOM.map((t, i) => (
                                <motion.div
                                    key={t}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + i * 1.2 }}
                                    className="px-5 py-3 rounded-2xl bg-amber-50 text-slate-900 font-extrabold shadow-xl text-center"
                                    style={{ fontSize: 22, width: 250 }}
                                >
                                    {t}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
