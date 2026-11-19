import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Rommet i novellen: et lite kjøkken en regnfull kveld, bygd som en scene uten forvegg.
 * «start»: døra smeller igjen, en person ved bordet knytter nevene. Vi er midt i handlingen.
 * «hylle»: bokhylla på veggen. Bøkene til de norske novelleforfatterne lyser opp etter tur.
 * «dor»: vis, ikke fortell. Det står ikke at personen er sint, vi ser det.
 * «symbol»: blomsten i vasen visner, og stormen slår mot vinduet.
 */

type Modus = 'start' | 'hylle' | 'dor' | 'symbol';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const damp = (a: number, b: number, l: number, dt: number) =>
    THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));

const DOR = { x: 3.2, z: -3 };
const VINDU = { x: -2.4, y: 2.6, z: -3 };
const BORD = { x: 0.2, z: 0 };
const VASE = { x: 0.7, y: 1.12, z: -0.1 };
const PERSON = { x: -0.9, z: 0.6 };
const HYLLE = { x: -4.4, y: 2.2, z: -0.6 };

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'start') {
        switch (beat) {
            case 0:
                return { pos: v(1.5, 3.4, 10.5), se: v(1.2, 1.8, -1.5) };
            case 1:
                return { pos: v(3.4 - t * 0.04, 2.4, 3.6), se: v(3.1, 1.8, -3) };
            case 2:
                return { pos: v(-0.6, 2.3, 4.2), se: v(-0.6, 1.3, 0.3) };
            default:
                return { pos: v(0.5, 4.2, 11.5 + t * 0.05), se: v(0, 1.6, -1) };
        }
    }
    if (modus === 'hylle') {
        return { pos: v(-0.8, 2.6, 2.6), se: v(-4.4, 2.2, -0.6) };
    }
    if (modus === 'dor') {
        switch (beat) {
            case 0:
                return { pos: v(0.8, 3.8 - t * 0.08, 11 - t * 0.35), se: v(0.4, 1.6, -1) };
            case 1:
                return { pos: v(-1.2, 2.2, 5.2), se: v(-0.9, 1.4, 0.4) };
            case 2:
                return { pos: v(1.6, 2.8, 7.5), se: v(1.4, 1.5, -1.2) };
            case 3:
                return { pos: v(0.8, 3.8, 11), se: v(0.4, 1.6, -1) };
            default:
                return { pos: v(-0.4, 2.0, 4.4 - t * 0.05), se: v(-0.9, 1.5, 0.4) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(2.3 - t * 0.03, 1.9, 2.1), se: v(1.0, 1.4, -0.1) };
        case 1:
            return { pos: v(2.6, 2.3, 3.4), se: v(0.5, 1.5, -0.1) };
        case 2:
            return { pos: v(0.2, 1.45, 1.5), se: v(0.6, 1.15, -0.1) };
        default:
            return { pos: v(-2.6, 2.7, 1.4), se: v(-2.4, 2.5, -3) };
    }
}

/** Døra er åpen bare et lite øyeblikk i starten av beaten den smeller på. */
function dorVinkel(modus: Modus, beat: number, t: number, playing: boolean) {
    const smell = (modus === 'start' && beat === 0) || (modus === 'dor' && beat === 2);
    if (!smell) return 0;
    // På pause står døra i det øyeblikket den slår igjen.
    if (!playing) return -0.45;
    if (t < 0.7) return -1.2;
    return 0;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());
    const dor = useRef<THREE.Group>(null);
    const stilk = useRef<THREE.Group>(null);
    const blomst = useRef<THREE.MeshStandardMaterial>(null);
    const hender = useRef<THREE.Group>(null);
    const lyn = useRef<THREE.PointLight>(null);
    const regn = useRef<THREE.InstancedMesh>(null);
    const himmel = useRef<THREE.MeshStandardMaterial>(null);
    const knytt = (modus === 'start' && beat >= 2) || (modus === 'dor' && beat >= 2 && beat !== 3);
    const visnet = modus === 'symbol' ? 1 : modus === 'hylle' ? 0 : 0;
    const storm = modus === 'symbol' && beat >= 3;
    const regnTetthet = modus === 'symbol' ? (storm ? 1 : 0.5) : modus === 'start' ? 0.5 : 0.25;

    const regnDrop = useMemo(
        () =>
            Array.from({ length: 70 }, (_, i) => {
                const a = Math.sin(i * 12.9898) * 43758.5453;
                const b = Math.sin(i * 78.233) * 12345.678;
                return { x: (a - Math.floor(a)) * 2.6 - 1.3, f: b - Math.floor(b) };
            }),
        []
    );
    const tmp = useMemo(() => new THREE.Object3D(), []);

    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const t = tid.current;
        const snapp = forste.current || !playing;
        forste.current = false;

        const m = kameraFor(modus, beat, t);
        const k = snapp ? 1 : 1 - Math.exp(-1.3 * dt);
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);

        if (dor.current) {
            const mal = dorVinkel(modus, beat, t, playing);
            dor.current.rotation.y = snapp
                ? mal
                : damp(dor.current.rotation.y, mal, mal === 0 ? 14 : 30, dt);
        }
        // Blomsten: rett og rød, eller bøyd og brun.
        if (stilk.current) {
            const mal = visnet ? 1.15 : 0;
            stilk.current.rotation.z = snapp ? mal : damp(stilk.current.rotation.z, mal, 0.9, dt);
            const grad = stilk.current.rotation.z / 1.15;
            if (blomst.current) {
                blomst.current.color.setRGB(
                    0.86 - grad * 0.4,
                    0.15 + grad * 0.25,
                    0.25 - grad * 0.12
                );
            }
        }
        if (hender.current) {
            const s = knytt ? 0.75 : 1;
            hender.current.scale.setScalar(snapp ? s : damp(hender.current.scale.x, s, 6, dt));
            const skjelv = knytt && playing ? Math.sin(t * 40) * 0.015 : 0;
            hender.current.position.x = skjelv;
        }
        if (lyn.current) {
            const blink = storm && playing && t % 3.2 < 0.12 ? 12 : storm && !playing ? 4 : 0;
            lyn.current.intensity = blink;
        }
        if (himmel.current) {
            const mork = storm ? 0.08 : 0.2;
            himmel.current.emissiveIntensity = snapp
                ? mork
                : damp(himmel.current.emissiveIntensity, mork, 2, dt);
        }
        if (regn.current) {
            const tt = playing ? performance.now() / 1000 : 1.3;
            regnDrop.forEach((d, i) => {
                const synlig = d.f < regnTetthet;
                const y = (((d.f * 7 - tt * (storm ? 3.5 : 2.2)) % 1.6) + 1.6) % 1.6;
                tmp.position.set(VINDU.x + d.x * 0.45, VINDU.y - 0.85 + y, VINDU.z - 0.5);
                tmp.rotation.set(0, 0, storm ? 0.35 : 0.1);
                tmp.scale.set(1, synlig ? 1 : 0.0001, 1);
                tmp.updateMatrix();
                regn.current!.setMatrixAt(i, tmp.matrix);
            });
            regn.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <>
            <color attach="background" args={['#1a1f2e']} />
            <fog attach="fog" args={['#1a1f2e', 14, 30]} />
            <ambientLight intensity={0.55} color="#c7d2fe" />
            <hemisphereLight args={['#ffe8c2', '#2b2f3f', 0.6]} />
            {/* Lampa over bordet */}
            <pointLight
                position={[BORD.x, 3.3, BORD.z]}
                intensity={18}
                distance={9}
                color="#ffd8a0"
            />
            <mesh position={[BORD.x, 3.4, BORD.z]}>
                <coneGeometry args={[0.45, 0.4, 16, 1, true]} />
                <meshStandardMaterial
                    color="#facc15"
                    emissive="#f59e0b"
                    emissiveIntensity={0.9}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <pointLight
                ref={lyn}
                position={[VINDU.x, VINDU.y, VINDU.z - 1.5]}
                intensity={0}
                distance={14}
                color="#dbeafe"
            />

            {/* Gulv og vegger */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[10, 7]} />
                <meshStandardMaterial color="#7a5a3a" emissive="#2a1d12" emissiveIntensity={0.4} />
            </mesh>
            {/* Bakvegg med hull til vindu og dør, bygd av fire biter */}
            <mesh position={[-4, 2, -3.1]}>
                <boxGeometry args={[2, 4, 0.2]} />
                <meshStandardMaterial
                    color="#9fb7a6"
                    emissive="#2f3d33"
                    emissiveIntensity={0.5}
                    flatShading
                />
            </mesh>
            <mesh position={[0.4, 2, -3.1]}>
                <boxGeometry args={[3.2, 4, 0.2]} />
                <meshStandardMaterial
                    color="#9fb7a6"
                    emissive="#2f3d33"
                    emissiveIntensity={0.5}
                    flatShading
                />
            </mesh>
            <mesh position={[-2.4, 0.8, -3.1]}>
                <boxGeometry args={[1.2, 1.6, 0.2]} />
                <meshStandardMaterial
                    color="#9fb7a6"
                    emissive="#2f3d33"
                    emissiveIntensity={0.5}
                    flatShading
                />
            </mesh>
            <mesh position={[-2.4, 3.65, -3.1]}>
                <boxGeometry args={[1.2, 0.7, 0.2]} />
                <meshStandardMaterial
                    color="#9fb7a6"
                    emissive="#2f3d33"
                    emissiveIntensity={0.5}
                    flatShading
                />
            </mesh>
            <mesh position={[4.35, 2, -3.1]}>
                <boxGeometry args={[1.3, 4, 0.2]} />
                <meshStandardMaterial
                    color="#9fb7a6"
                    emissive="#2f3d33"
                    emissiveIntensity={0.5}
                    flatShading
                />
            </mesh>
            <mesh position={[3.2, 3.5, -3.1]}>
                <boxGeometry args={[1.0, 1.0, 0.2]} />
                <meshStandardMaterial
                    color="#9fb7a6"
                    emissive="#2f3d33"
                    emissiveIntensity={0.5}
                    flatShading
                />
            </mesh>
            {/* Venstre vegg (hylla henger her) */}
            <mesh position={[-5, 2, 0]}>
                <boxGeometry args={[0.2, 4, 6.2]} />
                <meshStandardMaterial
                    color="#8ea896"
                    emissive="#2a372e"
                    emissiveIntensity={0.5}
                    flatShading
                />
            </mesh>

            {/* Himmelen ute, bak vinduet */}
            <mesh position={[VINDU.x, VINDU.y, VINDU.z - 1.6]}>
                <planeGeometry args={[3, 2.4]} />
                <meshStandardMaterial
                    ref={himmel}
                    color="#1e293b"
                    emissive="#334155"
                    emissiveIntensity={0.2}
                />
            </mesh>
            {/* Vinduskarm og sprosser */}
            <mesh position={[VINDU.x, VINDU.y, VINDU.z]}>
                <boxGeometry args={[1.2, 0.06, 0.24]} />
                <meshStandardMaterial color="#f5f5f4" />
            </mesh>
            <mesh position={[VINDU.x, VINDU.y, VINDU.z]}>
                <boxGeometry args={[0.06, 1.3, 0.24]} />
                <meshStandardMaterial color="#f5f5f4" />
            </mesh>
            <instancedMesh
                ref={regn}
                args={[undefined, undefined, regnDrop.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[0.015, 0.22, 0.015]} />
                <meshBasicMaterial color="#93c5fd" />
            </instancedMesh>

            {/* Døra, hengslet på venstre side */}
            <group ref={dor} position={[DOR.x - 0.5, 0, DOR.z]}>
                <mesh position={[0.5, 1.5, 0]}>
                    <boxGeometry args={[1.0, 3.0, 0.1]} />
                    <meshStandardMaterial
                        color="#7c2d12"
                        emissive="#3b1206"
                        emissiveIntensity={0.5}
                        flatShading
                    />
                </mesh>
                <mesh position={[0.85, 1.45, 0.08]}>
                    <sphereGeometry args={[0.06, 10, 8]} />
                    <meshStandardMaterial color="#fbbf24" />
                </mesh>
            </group>

            {/* Bordet */}
            <mesh position={[BORD.x, 1.0, BORD.z]}>
                <boxGeometry args={[2.4, 0.12, 1.4]} />
                <meshStandardMaterial
                    color="#a16207"
                    emissive="#3f2a06"
                    emissiveIntensity={0.4}
                    flatShading
                />
            </mesh>
            {[
                [-1.05, -0.6],
                [1.05, -0.6],
                [-1.05, 0.6],
                [1.05, 0.6],
            ].map(([x, z], i) => (
                <mesh key={i} position={[BORD.x + x, 0.5, BORD.z + z]}>
                    <boxGeometry args={[0.1, 1, 0.1]} />
                    <meshStandardMaterial color="#713f12" />
                </mesh>
            ))}

            {/* Vasen med blomsten */}
            <mesh position={[VASE.x, VASE.y + 0.15, VASE.z]}>
                <cylinderGeometry args={[0.1, 0.14, 0.32, 14]} />
                <meshStandardMaterial color="#60a5fa" emissive="#1e3a8a" emissiveIntensity={0.3} />
            </mesh>
            <group ref={stilk} position={[VASE.x, VASE.y + 0.3, VASE.z]}>
                <mesh position={[0, 0.3, 0]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.6, 6]} />
                    <meshStandardMaterial color="#4d7c0f" />
                </mesh>
                <mesh position={[0, 0.64, 0]}>
                    <sphereGeometry args={[0.11, 12, 10]} />
                    <meshStandardMaterial ref={blomst} color="#dc2626" />
                </mesh>
            </group>

            {/* Symbolet: en glorie rundt blomsten, og kronblader som har falt på bordet */}
            {modus === 'symbol' && beat === 1 && (
                <mesh position={[VASE.x - 0.5, VASE.y + 0.55, VASE.z]}>
                    <torusGeometry args={[0.3, 0.025, 8, 40]} />
                    <meshBasicMaterial color="#fde047" />
                </mesh>
            )}
            {modus === 'symbol' &&
                beat >= 2 &&
                [
                    [0.25, 0.25],
                    [0.05, 0.12],
                    [0.35, 0.05],
                    [-0.1, 0.3],
                ].map(([x, z], i) => (
                    <mesh
                        key={i}
                        position={[VASE.x - 0.4 + x, 1.07, VASE.z + z]}
                        scale={[1, 0.25, 1]}
                    >
                        <sphereGeometry args={[0.06, 10, 6]} />
                        <meshStandardMaterial color="#7c2d12" />
                    </mesh>
                ))}

            {/* Personen ved bordet, med hendene */}
            <group position={[PERSON.x, 0, PERSON.z]}>
                <mesh position={[0, 0.85, 0]}>
                    <coneGeometry args={[0.42, 1.7, 12]} />
                    <meshStandardMaterial color="#334155" flatShading />
                </mesh>
                <mesh position={[0, 1.92, 0]}>
                    <sphereGeometry args={[0.27, 14, 12]} />
                    <meshStandardMaterial color="#e8bf98" />
                </mesh>
                <group ref={hender}>
                    {[-0.42, 0.42].map((x) => (
                        <mesh key={x} position={[x, 1.0, 0.12]}>
                            <sphereGeometry args={[0.12, 10, 8]} />
                            <meshStandardMaterial color={knytt ? '#e79a7a' : '#e8bf98'} />
                        </mesh>
                    ))}
                </group>
            </group>

            {/* Bokhylla på venstre vegg */}
            <Hylle beat={modus === 'hylle' ? beat : -1} />
        </>
    );
}

/** Hvilke bøker som lyser per beat i «hylle». Indeks i hylla. */
const LYSER: number[][] = [[], [3, 4], [6], [8, 9]];
const KIELLAND = [0, 1, 2];

function Hylle({ beat }: { beat: number }) {
    const boker = useMemo(
        () =>
            Array.from({ length: 11 }, (_, i) => {
                const a = Math.sin(i * 91.7) * 1000;
                const f = a - Math.floor(a);
                return {
                    z: -1.9 + i * 0.36,
                    h: 0.55 + f * 0.25,
                    farge: ['#475569', '#57534e', '#3f6212', '#7f1d1d'][i % 4],
                };
            }),
        []
    );
    return (
        <group position={[HYLLE.x, 0, HYLLE.z]}>
            {[0, 1].map((r) => (
                <mesh key={r} position={[0.15, HYLLE.y - 0.45 + r * 1.0, 0.1]}>
                    <boxGeometry args={[0.5, 0.06, 4.4]} />
                    <meshStandardMaterial color="#78350f" />
                </mesh>
            ))}
            {boker.map((b, i) => {
                const lys =
                    beat >= 0 &&
                    ((beat >= 0 && KIELLAND.includes(i)) ||
                        LYSER.slice(0, beat + 1)
                            .flat()
                            .includes(i));
                const ny = beat >= 0 && LYSER[beat]?.includes(i);
                const kielland = beat >= 0 && KIELLAND.includes(i);
                return (
                    <mesh key={i} position={[0.15, HYLLE.y - 0.42 + b.h / 2 + 0.03, b.z + 0.1]}>
                        <boxGeometry args={[0.36, b.h, 0.28]} />
                        <meshStandardMaterial
                            color={
                                ny ? '#fbbf24' : kielland ? '#ea580c' : lys ? '#d97706' : b.farge
                            }
                            emissive={
                                ny ? '#f59e0b' : kielland ? '#9a3412' : lys ? '#92400e' : '#000000'
                            }
                            emissiveIntensity={ny ? 0.9 : lys || kielland ? 0.5 : 0}
                        />
                    </mesh>
                );
            })}
            {/* Nedre hylle: flere bøker, uten navn */}
            {boker.map((b, i) => (
                <mesh key={`n${i}`} position={[0.15, HYLLE.y + 0.58 + b.h / 2 + 0.03, b.z + 0.1]}>
                    <boxGeometry args={[0.36, b.h * 0.9, 0.28]} />
                    <meshStandardMaterial color={b.farge} />
                </mesh>
            ))}
        </group>
    );
}

/* ---------------------------------------------------------------- merkelapper (DOM) */

const NAVN: { tekst: string; fraBeat: number; ny?: boolean; stjerne?: boolean }[] = [
    { tekst: 'Alexander Kielland', fraBeat: 0 },
    { tekst: 'Cora Sandel', fraBeat: 1 },
    { tekst: 'Tarjei Vesaas', fraBeat: 1 },
    { tekst: 'Kjell Askildsen', fraBeat: 2, stjerne: true },
    { tekst: 'Frode Grytten', fraBeat: 3 },
    { tekst: 'Gunnhild Øyehaug', fraBeat: 3 },
];

function Kort({
    children,
    farge = '#ffffff',
    tekst = '#0f172a',
    className = '',
}: {
    children: React.ReactNode;
    farge?: string;
    tekst?: string;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-2xl px-6 py-3 shadow-xl font-black ${className}`}
            style={{ background: farge, color: tekst }}
        >
            {children}
        </motion.div>
    );
}

function Merkelapper({ modus, beat }: { modus: Modus; beat: number }) {
    const nokkel = `${modus}-${beat}`;
    let innhold: React.ReactNode = null;
    if (modus === 'start') {
        innhold =
            beat === 0 ? (
                <div className="absolute" style={{ right: '8%', top: '12%' }}>
                    <Kort farge="#7c2d12" tekst="#fff7ed" className="text-5xl">
                        SMELL!
                    </Kort>
                </div>
            ) : beat === 1 ? (
                <div className="absolute flex gap-4" style={{ left: '6%', top: '10%' }}>
                    <Kort className="text-4xl">Hvem?</Kort>
                    <Kort className="text-4xl">Hvorfor?</Kort>
                </div>
            ) : beat === 2 ? (
                <div className="absolute" style={{ left: '6%', top: '10%' }}>
                    <Kort className="text-3xl">Knytter nevene</Kort>
                </div>
            ) : (
                <div className="absolute inset-x-0 flex justify-center" style={{ top: '7%' }}>
                    <Kort farge="#0f172a" tekst="#fde68a" className="text-4xl text-center">
                        In medias res: midt inn i begivenhetene
                    </Kort>
                </div>
            );
    } else if (modus === 'hylle') {
        innhold = (
            <div
                className="absolute flex flex-col gap-3"
                style={{ right: '4%', top: '10%', width: '34%' }}
            >
                {NAVN.filter((n) => beat >= n.fraBeat).map((n) => (
                    <Kort
                        key={n.tekst}
                        farge={n.fraBeat === beat ? '#fbbf24' : '#ffffff'}
                        className="text-3xl"
                    >
                        {n.tekst}
                        {n.stjerne && (
                            <span className="block text-xl font-bold">
                                mest kjent i moderne tid
                            </span>
                        )}
                    </Kort>
                ))}
            </div>
        );
    } else if (modus === 'dor') {
        innhold =
            beat === 1 ? (
                <div
                    className="absolute flex items-center gap-4"
                    style={{ left: '6%', top: '10%' }}
                >
                    <Kort className="text-4xl">«Personen var sint.»</Kort>
                    <span className="text-7xl font-black" style={{ color: '#dc2626' }}>
                        ✕
                    </span>
                </div>
            ) : beat === 2 ? (
                <div className="absolute flex flex-col gap-3" style={{ left: '5%', top: '9%' }}>
                    <Kort farge="#0f766e" tekst="#ffffff" className="text-3xl">
                        Døra smeller
                    </Kort>
                    <Kort farge="#0f766e" tekst="#ffffff" className="text-3xl">
                        Knytter nevene
                    </Kort>
                </div>
            ) : beat === 3 ? (
                <div className="absolute inset-x-0 flex justify-center" style={{ top: '8%' }}>
                    <Kort farge="#0f172a" tekst="#ffffff" className="text-5xl text-center">
                        Show, don&apos;t tell
                        <span className="block text-3xl mt-1" style={{ color: '#fde68a' }}>
                            vis, ikke fortell
                        </span>
                    </Kort>
                </div>
            ) : beat >= 4 ? (
                <div className="absolute" style={{ left: '5%', top: '10%' }}>
                    <Kort className="text-3xl">
                        Handlinger og replikker viser hvordan personene har det
                    </Kort>
                </div>
            ) : null;
    } else {
        innhold =
            beat === 0 ? (
                <div className="absolute" style={{ right: '6%', top: '10%' }}>
                    <Kort className="text-3xl">Blomsten visner</Kort>
                </div>
            ) : beat === 1 ? (
                <div className="absolute" style={{ right: '6%', top: '10%', maxWidth: '40%' }}>
                    <Kort farge="#0f172a" tekst="#ffffff" className="text-3xl">
                        Symbol: en vanlig ting som betyr noe større
                    </Kort>
                </div>
            ) : beat === 2 ? (
                <div className="absolute" style={{ right: '6%', top: '10%' }}>
                    <Kort farge="#7f1d1d" tekst="#ffffff" className="text-3xl">
                        Visnet blomst: tapt kjærlighet
                    </Kort>
                </div>
            ) : (
                <div className="absolute" style={{ right: '5%', top: '10%' }}>
                    <Kort farge="#1e3a8a" tekst="#ffffff" className="text-3xl">
                        Storm: kaos inne i personen
                    </Kort>
                </div>
            );
    }
    return (
        <div className="absolute inset-0 pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div key={nokkel} className="absolute inset-0" exit={{ opacity: 0 }}>
                    {innhold}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export function NovelleRommet({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'start';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [1.5, 3.4, 10.5] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Merkelapper modus={modus} beat={beat} />
        </div>
    );
}
