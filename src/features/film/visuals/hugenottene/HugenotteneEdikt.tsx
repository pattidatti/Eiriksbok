import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { damp, useKamera, v } from './felles3d';

/**
 * Ediktet i Nantes som en ting på et bord: et pergament med kongens segl, og kronen som
 * holder det oppe. Kongen gir (1598), friheten henger i kronen (1610), seglet sprekker
 * (1685). Til slutt reiser en steintavle seg: rettigheter for alle (1789).
 */

type Modus = 'gitt' | 'svakhet' | 'tatt' | 'rettighet';

const PROTESTANT = '#0f766e';
const ROD = '#b91c1c';
const GULL = '#d4a017';

interface Mål {
    /** Pergamentet: hvor høyt det henger, hvor synlig skriften er, hvor grått det er. */
    dokY: number;
    dokSynlig: number;
    skrift: number;
    grå: number;
    /** Seglet: 0 = over bordet, 1 = stemplet. Sprekk: hvor langt halvdelene glir fra hverandre. */
    segl: number;
    sprekk: number;
    /** Kronen: høyde, glans (0 = grå), og om snorene til pergamentet vises. */
    kroneY: number;
    kroneGlans: number;
    snorer: boolean;
    /** Murbyer som små tårn rundt pergamentet. */
    tarn: number;
    /** Steintavla (1789) og det lille toleranse-arket (1787). */
    tavle: number;
    smaark: number;
    lys: number;
}

const GRUNN: Mål = {
    dokY: 0,
    dokSynlig: 1,
    skrift: 1,
    grå: 0,
    segl: 1,
    sprekk: 0,
    kroneY: 6,
    kroneGlans: 1,
    snorer: false,
    tarn: 0,
    tavle: 0,
    smaark: 0,
    lys: 1,
};

function målFor(modus: Modus, beat: number): Mål {
    if (modus === 'gitt') {
        return {
            ...GRUNN,
            skrift: beat >= 1 ? 1 : 0,
            segl: beat >= 1 ? 1 : 0,
            kroneY: beat === 0 ? 4.2 : 6,
            tarn: beat >= 3 ? 1 : 0,
        };
    }
    if (modus === 'svakhet') {
        return {
            ...GRUNN,
            dokY: beat >= 1 ? 3 : 0,
            snorer: beat >= 1,
            kroneY: beat >= 1 ? 9.5 : 6,
            kroneGlans: beat >= 2 ? 0 : 1,
            lys: beat >= 2 ? 0.7 : 1,
        };
    }
    if (modus === 'tatt') {
        return {
            ...GRUNN,
            sprekk: beat >= 0 ? 1 : 0,
            grå: beat >= 1 ? 1 : 0,
            skrift: beat >= 1 ? 0.15 : 1,
            dokSynlig: beat >= 2 ? 0.35 : 1,
            lys: 0.75,
        };
    }
    // rettighet
    return {
        ...GRUNN,
        dokSynlig: 0,
        skrift: 0,
        segl: 0,
        kroneY: beat >= 3 ? 20 : 7,
        kroneGlans: beat >= 3 ? 0 : 0.6,
        smaark: beat >= 1 && beat <= 2 ? 1 : 0,
        tavle: beat >= 3 ? 1 : 0,
        lys: beat === 0 ? 0.45 : beat >= 3 ? 1.15 : 0.8,
    };
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'rettighet' && beat >= 3)
        return { pos: v(5 - t * 0.2, 7, 17), se: v(0, 4.5, -2) };
    if (modus === 'rettighet' && beat === 0) return { pos: v(-3, 5, 9), se: v(1, 1, 0) };
    if (modus === 'svakhet' && beat >= 1) return { pos: v(7 - t * 0.2, 6, 14), se: v(0, 5, 0) };
    if (modus === 'tatt') {
        return beat === 0
            ? { pos: v(2.5, 6.5, 6.5), se: v(1.6, 0.2, 2.2) }
            : { pos: v(-4 + t * 0.2, 9, 10), se: v(0, 0.5, 0) };
    }
    if (modus === 'gitt' && beat === 1) return { pos: v(3.5, 7, 7.5), se: v(1.6, 0, 1.6) };
    if (modus === 'gitt' && beat >= 3) return { pos: v(0, 13, 15), se: v(0, 0, 0) };
    return { pos: v(-5 + t * 0.2, 8, 10), se: v(0, 1, 0) };
}

/** En krone av en ring og fem takker. */
function Krone({ materiale }: { materiale: THREE.MeshStandardMaterial }) {
    return (
        <group>
            <mesh material={materiale}>
                <cylinderGeometry args={[1.3, 1.15, 0.7, 16, 1, true]} />
            </mesh>
            {Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        material={materiale}
                        position={[Math.sin(a) * 1.25, 0.7, Math.cos(a) * 1.25]}
                    >
                        <coneGeometry args={[0.28, 0.8, 4]} />
                    </mesh>
                );
            })}
            <mesh position={[0, 0.05, 1.18]}>
                <sphereGeometry args={[0.18, 8, 6]} />
                <meshStandardMaterial color="#b91c1c" emissive="#7f1d1d" emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const m = målFor(modus, beat);
    const tid = useRef(0);
    const nå = useRef<Mål | null>(null);

    const dok = useRef<THREE.Group>(null);
    const dokMat = useRef<THREE.MeshStandardMaterial>(null);
    const seglV = useRef<THREE.Group>(null);
    const seglH = useRef<THREE.Group>(null);
    const krone = useRef<THREE.Group>(null);
    const snorer = useRef<THREE.Group>(null);
    const tarn = useRef<THREE.Group>(null);
    const tavle = useRef<THREE.Group>(null);
    const smaark = useRef<THREE.Group>(null);
    const ambient = useRef<THREE.AmbientLight>(null);
    const skriftMat = useMemo(
        () => new THREE.MeshStandardMaterial({ color: '#3b2f22', transparent: true }),
        []
    );
    const kroneMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: GULL,
                metalness: 0.6,
                roughness: 0.3,
                emissive: '#7a5a00',
                emissiveIntensity: 0.4,
                flatShading: true,
            }),
        []
    );

    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);

    const linjer = useMemo(
        () =>
            Array.from({ length: 11 }, (_, i) => ({
                z: -3.2 + i * 0.5,
                b: i % 4 === 3 ? 2.6 : 4.2,
            })),
        []
    );
    const tarnPos = useMemo(
        () =>
            Array.from({ length: 10 }, (_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return [Math.sin(a) * 6.2, Math.cos(a) * 5] as [number, number];
            }),
        []
    );

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        // Første bilde hopper rett til målet, så et hopp i filmen aldri viser en mellomting.
        const n = nå.current ?? { ...m };
        const k = nå.current ? dt : 100;
        nå.current = n;
        (Object.keys(m) as (keyof Mål)[]).forEach((nøkkel) => {
            if (typeof m[nøkkel] === 'number')
                (n[nøkkel] as number) = damp(n[nøkkel] as number, m[nøkkel] as number, 2, k);
        });

        if (dok.current) {
            dok.current.position.y =
                0.2 + n.dokY + Math.sin(tid.current * 1.3) * 0.08 * Math.min(1, n.dokY);
            dok.current.rotation.x = -n.dokY * 0.35;
            dok.current.visible = n.dokSynlig > 0.02;
        }
        if (dokMat.current) {
            dokMat.current.color.set('#f1e3bf').lerp(new THREE.Color('#9ca3af'), n.grå);
            dokMat.current.opacity = n.dokSynlig;
        }
        skriftMat.opacity = n.skrift * n.dokSynlig;
        skriftMat.visible = skriftMat.opacity > 0.03;
        // Seglet faller ned og stemples, og sprekker i to i 1685.
        const seglY = 0.18 + (1 - n.segl) * 3 + n.dokY;
        if (seglV.current) {
            seglV.current.position.set(1.6 - n.sprekk * 0.9, seglY, 2.4 + n.sprekk * 0.3);
            seglV.current.rotation.z = n.sprekk * 0.5;
            seglV.current.visible = n.dokSynlig > 0.05;
        }
        if (seglH.current) {
            seglH.current.position.set(1.6 + n.sprekk * 0.9, seglY, 2.4 - n.sprekk * 0.2);
            seglH.current.rotation.z = -n.sprekk * 0.5;
            seglH.current.visible = n.dokSynlig > 0.05;
        }
        if (krone.current) {
            krone.current.position.y = n.kroneY + Math.sin(tid.current * 0.9) * 0.12;
            krone.current.rotation.y += dt * 0.3;
        }
        kroneMat.color.set(GULL).lerp(new THREE.Color('#6b7280'), 1 - n.kroneGlans);
        kroneMat.emissiveIntensity = 0.4 * n.kroneGlans;
        if (snorer.current) {
            snorer.current.visible = m.snorer && n.dokY > 0.5;
            snorer.current.position.y = n.dokY + 0.2;
            const h = Math.max(0.1, n.kroneY - n.dokY - 0.4);
            snorer.current.children.forEach((c) => {
                c.scale.y = h;
                c.position.y = h / 2;
            });
        }
        if (tarn.current) tarn.current.scale.setScalar(Math.max(0.0001, n.tarn));
        if (tavle.current) {
            tavle.current.position.y = -7 + n.tavle * 7;
            tavle.current.visible = n.tavle > 0.01;
        }
        if (smaark.current) smaark.current.scale.setScalar(Math.max(0.0001, n.smaark));
        if (ambient.current) ambient.current.intensity = 0.55 * n.lys;
    });

    const snorX: [number, number][] = [
        [-2.4, -3.4],
        [2.4, -3.4],
        [-2.4, 3.4],
        [2.4, 3.4],
    ];

    return (
        <>
            <color attach="background" args={['#2b2620']} />
            <fog attach="fog" args={['#2b2620', 26, 60]} />
            <ambientLight ref={ambient} intensity={0.55} />
            <hemisphereLight args={['#fff4dc', '#3b2a1a', 0.5]} />
            <pointLight position={[0, 12, 6]} intensity={180} color="#ffe2a8" distance={50} />
            <directionalLight position={[-8, 14, 10]} intensity={0.7} color="#fff1d6" />

            {/* Bordet */}
            <mesh position={[0, -0.3, 0]}>
                <boxGeometry args={[18, 0.6, 13]} />
                <meshStandardMaterial color="#6b4428" flatShading />
            </mesh>
            {[
                [-8, -5.5],
                [8, -5.5],
                [-8, 5.5],
                [8, 5.5],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, -4, z]}>
                    <boxGeometry args={[0.7, 7, 0.7]} />
                    <meshStandardMaterial color="#5a3820" />
                </mesh>
            ))}

            {/* Pergamentet med skrift */}
            <group ref={dok}>
                <mesh>
                    <boxGeometry args={[5.4, 0.08, 7.6]} />
                    <meshStandardMaterial ref={dokMat} color="#f1e3bf" transparent />
                </mesh>
                {/* Ruller øverst og nederst */}
                {[-3.85, 3.85].map((z) => (
                    <mesh key={z} position={[0, 0.12, z]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.22, 0.22, 5.6, 10]} />
                        <meshStandardMaterial color="#e4d1a3" />
                    </mesh>
                ))}
                {linjer.map((l, i) => (
                    <mesh key={i} position={[-2.1 + l.b / 2, 0.06, l.z]} material={skriftMat}>
                        <boxGeometry args={[l.b, 0.02, 0.14]} />
                    </mesh>
                ))}
            </group>

            {/* Seglet i to halvdeler */}
            <group ref={seglV}>
                <mesh rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[0.6, 0.6, 0.22, 16, 1, false, 0, Math.PI]} />
                    <meshStandardMaterial color="#9f1239" flatShading />
                </mesh>
            </group>
            <group ref={seglH}>
                <mesh>
                    <cylinderGeometry args={[0.6, 0.6, 0.22, 16, 1, false, Math.PI, Math.PI]} />
                    <meshStandardMaterial color="#9f1239" flatShading />
                </mesh>
            </group>

            {/* Kronen og snorene som pergamentet henger i */}
            <group ref={krone}>
                <Krone materiale={kroneMat} />
            </group>
            <group ref={snorer}>
                {snorX.map(([x, z], i) => (
                    <mesh key={i} position={[x * 0.5, 0, z * 0.3]}>
                        <boxGeometry args={[0.04, 1, 0.04]} />
                        <meshStandardMaterial
                            color="#e5c76b"
                            emissive="#a57d1b"
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                ))}
            </group>

            {/* Murbyene som små tårn rundt pergamentet */}
            <group ref={tarn}>
                {tarnPos.map(([x, z], i) => (
                    <group key={i} position={[x, 0, z]}>
                        <mesh position={[0, 0.7, 0]}>
                            <cylinderGeometry args={[0.45, 0.5, 1.4, 8]} />
                            <meshStandardMaterial color="#cbbf9f" flatShading />
                        </mesh>
                        <mesh position={[0, 1.65, 0]}>
                            <coneGeometry args={[0.55, 0.6, 8]} />
                            <meshStandardMaterial color={PROTESTANT} flatShading />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* Et lys på bordet: troen som holdes skjult */}
            {modus === 'rettighet' && beat <= 2 && (
                <group position={[-3.5, 0, 1.5]}>
                    <mesh position={[0, 0.7, 0]}>
                        <cylinderGeometry args={[0.25, 0.25, 1.4, 10]} />
                        <meshStandardMaterial color="#f5f0e1" />
                    </mesh>
                    <mesh position={[0, 1.65, 0]}>
                        <coneGeometry args={[0.14, 0.45, 8]} />
                        <meshStandardMaterial
                            color="#fde68a"
                            emissive="#f59e0b"
                            emissiveIntensity={2}
                        />
                    </mesh>
                    <pointLight position={[0, 2, 0]} intensity={8} color="#ffb347" distance={8} />
                </group>
            )}
            {/* Toleranse-arket fra 1787: lite, med et lite segl */}
            <group ref={smaark} position={[0, 0.2, 0]}>
                <mesh>
                    <boxGeometry args={[2.6, 0.06, 3.4]} />
                    <meshStandardMaterial color="#f1e3bf" />
                </mesh>
                <mesh position={[0.7, 0.12, 1.1]}>
                    <cylinderGeometry args={[0.3, 0.3, 0.14, 12]} />
                    <meshStandardMaterial color="#9f1239" />
                </mesh>
            </group>

            {/* Steintavla fra 1789 */}
            <group ref={tavle} position={[0, -7, -3]}>
                <mesh position={[0, 4.4, 0]}>
                    <boxGeometry args={[8, 8.8, 0.9]} />
                    <meshStandardMaterial color="#d6d3d1" flatShading />
                </mesh>
                {Array.from({ length: 8 }, (_, i) => (
                    <mesh key={i} position={[0, 7.4 - i * 0.8, 0.47]}>
                        <boxGeometry args={[i === 0 ? 5 : 6.2, 0.16, 0.04]} />
                        <meshStandardMaterial color="#57534e" />
                    </mesh>
                ))}
            </group>
        </>
    );
}

interface Kort {
    tekst: string;
    farge?: string;
    stor?: boolean;
}

const KORT: Record<Modus, Kort[][]> = {
    gitt: [
        [
            { tekst: 'Edikt', stor: true },
            { tekst: 'En lov kongen bestemmer alene', farge: GULL },
        ],
        [
            { tekst: 'Nantes, 1598', stor: true },
            { tekst: 'Henrik 4. skriver under', farge: GULL },
        ],
        [
            { tekst: 'Ingen tvang til å bytte tro', farge: PROTESTANT },
            { tekst: 'Gudstjenester på bestemte steder', farge: PROTESTANT },
            { tekst: 'Staten betaler prestene', farge: PROTESTANT },
        ],
        [{ tekst: 'Rundt 100 byer med murer og soldater', farge: PROTESTANT }],
    ],
    svakhet: [
        [
            { tekst: 'Midlertidig', stor: true },
            { tekst: 'For å sikre freden', farge: GULL },
        ],
        [{ tekst: 'Friheten henger i kronen', farge: GULL }],
        [
            { tekst: '1610', stor: true },
            { tekst: 'Hva gjør neste konge?', farge: ROD },
        ],
    ],
    tatt: [
        [
            { tekst: '1685', stor: true },
            { tekst: 'Ludvig 14. opphever ediktet', farge: ROD },
        ],
        [{ tekst: 'Protestantisk gudstjeneste: forbudt', farge: ROD }],
        [
            { tekst: 'Prestene: to uker', stor: true },
            { tekst: 'Bli katolikk, eller reis', farge: ROD },
        ],
        [],
    ],
    rettighet: [
        [{ tekst: 'Troen holdes skjult', stor: true }],
        [
            { tekst: '1787: toleranseedikt', stor: true },
            { tekst: 'Lov å gifte seg', farge: PROTESTANT },
        ],
        [
            { tekst: 'Ikke gudstjeneste åpent', farge: ROD },
            { tekst: 'Ikke jobbe i staten', farge: ROD },
        ],
        [
            { tekst: '1789', stor: true },
            { tekst: 'Rett til å tro det du vil', farge: PROTESTANT },
        ],
        [
            { tekst: '1791', stor: true },
            { tekst: 'Full religionsfrihet', farge: PROTESTANT },
        ],
    ],
};

export function HugenotteneEdikt({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'gitt';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];
    const prester = modus === 'tatt' && beat >= 3;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.2, far: 200, position: [-5, 8, 10] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute left-[3%] top-0 bottom-0 w-[36%] flex flex-col justify-center gap-4 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {kort.map((k, i) => (
                        <motion.div
                            key={`${modus}-${beat}-${k.tekst}`}
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{
                                delay: i * 0.5,
                                type: 'spring',
                                stiffness: 160,
                                damping: 20,
                            }}
                            className={
                                k.stor
                                    ? 'self-start px-5 py-3 rounded-2xl bg-amber-50 text-slate-900 font-black text-3xl md:text-5xl shadow-xl'
                                    : 'self-start px-5 py-3 rounded-2xl bg-white/95 text-slate-900 font-bold text-xl md:text-2xl shadow-xl border-l-[10px]'
                            }
                            style={k.farge ? { borderColor: k.farge } : undefined}
                        >
                            {k.tekst}
                        </motion.div>
                    ))}
                    {prester && (
                        <motion.div
                            key="prester"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-start gap-3"
                        >
                            <div className="px-4 py-2 rounded-xl bg-white/95 text-slate-900 font-black text-2xl md:text-3xl shadow-xl">
                                Rundt 700 prester
                            </div>
                            <div className="flex gap-3">
                                <Teller verdi={560} etikett="reiste ut" tone="gronn" />
                                <Teller
                                    verdi={140}
                                    etikett="ble katolikker"
                                    tone="rod"
                                    forsinkelse={0.8}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
