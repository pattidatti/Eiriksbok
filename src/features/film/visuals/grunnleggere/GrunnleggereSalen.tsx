import { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { NIVA, damp, useDpr, v3, type Niva } from './felles3d';

/**
 * Salen med soklene: hver religion får en sokkel, og høyden viser hvor høyt grunnleggeren
 * er plassert (Gud, utsending, profet, lærer). Fire modus:
 * - aapning: kristendom, islam, buddhisme og hinduisme (tom sokkel).
 * - abrahamittisk: Abraham som skygge, så pakten, Moses, Jesus og Muhammad.
 * - indisk: hinduismen tom, Buddha som lærer, mahayana som skygge oppe ved Gud, så læren.
 * - nyere: bahá'í (to budbringere), Joseph Smith, og Jehovas vitner som ikke vil svare.
 */

type Modus = 'aapning' | 'abrahamittisk' | 'indisk' | 'nyere';
type Figur = 'ingen' | 'person' | 'to' | 'tavler' | 'tavlerPerson' | 'laere' | 'sporsmal';

interface Slot {
    navn: string;
    farge: string;
    hoyde: Niva[];
    figur: Figur[];
    merke: (string | null)[];
    lys: boolean[];
    /** Merkelappen nede ved foten i stedet for over figuren. */
    lavMerke?: boolean[];
}

const L: Niva = 'lav';

const MODUSER: Record<Modus, { tekst: string[]; slots: Slot[]; trinnFra: number }> = {
    aapning: {
        tekst: [
            'Hvem står på sokkelen?',
            'Kristne: Jesus er Gud',
            'Muslimer: Muhammad er et menneske',
            'Buddhister: våknet ved egen kraft',
            'Hinduismen: ingen grunnlegger',
        ],
        trinnFra: 1,
        slots: [
            {
                navn: 'Kristendom',
                farge: '#6366f1',
                hoyde: [L, 'gud', 'gud', 'gud', 'gud'],
                figur: ['ingen', 'person', 'person', 'person', 'person'],
                merke: [null, 'Jesus', 'Jesus', 'Jesus', 'Jesus'],
                lys: [false, true, false, false, false],
            },
            {
                navn: 'Islam',
                farge: '#10b981',
                hoyde: [L, L, 'profet', 'profet', 'profet'],
                figur: ['ingen', 'ingen', 'person', 'person', 'person'],
                merke: [null, null, 'Muhammad', 'Muhammad', 'Muhammad'],
                lys: [false, false, true, false, false],
            },
            {
                navn: 'Buddhisme',
                farge: '#f59e0b',
                hoyde: [L, L, L, 'laerer', 'laerer'],
                figur: ['ingen', 'ingen', 'ingen', 'person', 'person'],
                merke: [null, null, null, 'Buddha', 'Buddha'],
                lys: [false, false, false, true, false],
            },
            {
                navn: 'Hinduisme',
                farge: '#ec4899',
                hoyde: [L, L, L, L, L],
                figur: ['ingen', 'ingen', 'ingen', 'ingen', 'sporsmal'],
                merke: [null, null, null, null, 'tom'],
                lys: [false, false, false, false, true],
            },
        ],
    },
    abrahamittisk: {
        tekst: [
            'Abraham: stamfar for alle tre',
            'Tre religioner, tre plasser',
            'Jødedommen: pakten i midten',
            'Moses: vår lærer, ikke vår frelser',
        ],
        trinnFra: 1,
        slots: [
            {
                navn: 'Jødedom',
                farge: '#3b82f6',
                hoyde: [L, L, L, L],
                figur: ['ingen', 'tavler', 'tavler', 'tavlerPerson'],
                merke: [null, 'pakten', 'pakten', 'Moses'],
                lys: [false, false, true, true],
            },
            {
                navn: 'Kristendom',
                farge: '#6366f1',
                hoyde: [L, 'gud', 'gud', 'gud'],
                figur: ['ingen', 'person', 'person', 'person'],
                merke: [null, 'Jesus', 'Jesus', 'Jesus'],
                lys: [false, false, false, false],
            },
            {
                navn: 'Islam',
                farge: '#10b981',
                hoyde: [L, 'profet', 'profet', 'profet'],
                figur: ['ingen', 'person', 'person', 'person'],
                merke: [null, 'Muhammad', 'Muhammad', 'Muhammad'],
                lys: [false, false, false, false],
            },
        ],
    },
    indisk: {
        tekst: [
            'Buddhismen: en grunnlegger, ingen gud',
            'Buddha: den som har våknet',
            'De eldste tekstene: en lærer',
            'Buddhistene er uenige',
            'Ingen arvtaker: læren selv',
        ],
        trinnFra: 0,
        slots: [
            {
                navn: 'Hinduisme',
                farge: '#ec4899',
                hoyde: [L, L, L, L, L],
                figur: ['sporsmal', 'sporsmal', 'sporsmal', 'sporsmal', 'sporsmal'],
                merke: ['tom', 'tom', 'tom', 'tom', 'tom'],
                lys: [false, false, false, false, false],
            },
            {
                navn: 'Buddhisme',
                farge: '#f59e0b',
                hoyde: [L, L, 'laerer', 'laerer', 'laerer'],
                figur: ['person', 'person', 'person', 'person', 'laere'],
                merke: [
                    'Buddha',
                    'den som har våknet',
                    'lærer for guder og mennesker',
                    'theravada: stort sett den eldste læren',
                    'læren',
                ],
                lys: [false, true, false, false, true],
                lavMerke: [false, false, false, true, false],
            },
        ],
    },
    nyere: {
        tekst: [
            'Tre nyere bevegelser',
            "Bahá'í: to budbringere fra Gud",
            'Joseph Smith: profet, ikke gud',
            'Jehovas vitner: vil ikke svare',
        ],
        trinnFra: 0,
        slots: [
            {
                navn: "Bahá'í",
                farge: '#14b8a6',
                hoyde: [L, 'utsending', 'utsending', 'utsending'],
                figur: ['ingen', 'to', 'to', 'to'],
                merke: [
                    'fra sjia-islam',
                    "Báb og Bahá'u'lláh",
                    "Báb og Bahá'u'lláh",
                    "Báb og Bahá'u'lláh",
                ],
                lys: [false, true, false, false],
            },
            {
                navn: 'Mormonisme',
                farge: '#8b5cf6',
                hoyde: [L, L, 'profet', 'profet'],
                figur: ['ingen', 'ingen', 'person', 'person'],
                merke: ['fra kristendommen', null, 'Joseph Smith', 'Joseph Smith'],
                lys: [false, false, true, false],
            },
            {
                navn: 'Jehovas vitner',
                farge: '#64748b',
                hoyde: [L, L, L, L],
                figur: ['ingen', 'ingen', 'ingen', 'sporsmal'],
                merke: ['fra kristendommen', null, null, 'De sier: Jesus grunnla den'],
                lys: [false, false, false, true],
            },
        ],
    },
};

const TRINN: { niva: Niva; navn: string }[] = [
    { niva: 'gud', navn: 'Gud' },
    { niva: 'utsending', navn: 'utsending' },
    { niva: 'profet', navn: 'profet' },
    { niva: 'laerer', navn: 'lærer' },
];

function slotX(i: number, n: number) {
    return (i - (n - 1) / 2) * (n >= 4 ? 4.2 : 4.8);
}

function Person({ farge, skygge = false }: { farge: string; skygge?: boolean }) {
    return (
        <group>
            <mesh position={[0, 0.75, 0]}>
                <capsuleGeometry args={[0.38, 0.8, 8, 16]} />
                <meshStandardMaterial
                    color={farge}
                    roughness={0.6}
                    transparent={skygge}
                    opacity={skygge ? 0.35 : 1}
                    emissive={farge}
                    emissiveIntensity={skygge ? 0.5 : 0.08}
                />
            </mesh>
            <mesh position={[0, 1.62, 0]}>
                <sphereGeometry args={[0.3, 32, 24]} />
                <meshStandardMaterial
                    color={skygge ? farge : '#e8c9a4'}
                    roughness={0.8}
                    transparent={skygge}
                    opacity={skygge ? 0.35 : 1}
                />
            </mesh>
        </group>
    );
}

function Tavler() {
    return (
        <group position={[0, 0, -0.35]}>
            {[-0.38, 0.38].map((x) => (
                <group key={x} position={[x, 0, 0]}>
                    <mesh position={[0, 0.65, 0]}>
                        <boxGeometry args={[0.66, 1.3, 0.14]} />
                        <meshStandardMaterial
                            color="#e7e0cf"
                            emissive="#fde68a"
                            emissiveIntensity={0.35}
                        />
                    </mesh>
                    <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry
                            args={[0.33, 0.33, 0.14, 24, 1, false, -Math.PI / 2, Math.PI]}
                        />
                        <meshStandardMaterial
                            color="#e7e0cf"
                            emissive="#fde68a"
                            emissiveIntensity={0.35}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Laere({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        if (ref.current && playing) ref.current.rotation.y += Math.min(dt, 0.05) * 0.8;
    });
    return (
        <mesh ref={ref} position={[0, 0.9, 0]}>
            <icosahedronGeometry args={[0.6, 1]} />
            <meshStandardMaterial
                color="#fbbf24"
                emissive="#f59e0b"
                emissiveIntensity={0.9}
                flatShading
            />
        </mesh>
    );
}

function Sokkel({
    slot,
    x,
    beat,
    playing,
}: {
    slot: Slot;
    x: number;
    beat: number;
    playing: boolean;
}) {
    const b = Math.min(beat, slot.hoyde.length - 1);
    const mal = NIVA[slot.hoyde[b]];
    const [start] = useState<number>(mal);
    const sokkel = useRef<THREE.Mesh>(null);
    const topp = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const hoyde = useRef(start);
    const forste = useRef(true);

    useFrame((_, rawDt) => {
        const dt = forste.current ? 10 : playing ? Math.min(rawDt, 0.05) : 0;
        forste.current = false;
        hoyde.current = damp(hoyde.current, mal, 2.2, dt);
        const h = hoyde.current;
        if (sokkel.current) {
            sokkel.current.scale.y = h;
            sokkel.current.position.y = h / 2;
        }
        if (topp.current) topp.current.position.y = h;
        if (mat.current) {
            mat.current.emissiveIntensity = damp(
                mat.current.emissiveIntensity,
                slot.lys[b] ? 0.55 : 0.04,
                3,
                dt
            );
        }
    });

    const figur = slot.figur[b];
    const merke = slot.merke[b];
    return (
        <group position={[x, 0, 0]}>
            <mesh ref={sokkel} position={[0, start / 2, 0]} scale={[1, start, 1]}>
                <boxGeometry args={[2.1, 1, 1.6]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#e9e1d1"
                    emissive={slot.farge}
                    emissiveIntensity={0.04}
                    roughness={0.85}
                />
            </mesh>
            <mesh position={[0, 0.06, 0.81]}>
                <boxGeometry args={[2.1, 0.12, 0.02]} />
                <meshStandardMaterial color={slot.farge} />
            </mesh>
            <group ref={topp} position={[0, start, 0]}>
                {(figur === 'person' || figur === 'tavlerPerson') && (
                    <group position={[0, 0, figur === 'tavlerPerson' ? 0.35 : 0]}>
                        <Person farge={slot.farge} />
                    </group>
                )}
                {figur === 'to' && (
                    <>
                        <group position={[-0.5, 0, 0]}>
                            <Person farge={slot.farge} />
                        </group>
                        <group position={[0.5, 0, 0]}>
                            <Person farge={slot.farge} />
                        </group>
                    </>
                )}
                {(figur === 'tavler' || figur === 'tavlerPerson') && <Tavler />}
                {figur === 'laere' && <Laere playing={playing} />}
                {merke && !slot.lavMerke?.[b] && (
                    <Html
                        position={[
                            0,
                            figur === 'ingen' ? 0.7 : figur === 'sporsmal' ? 1.35 : 2.3,
                            0,
                        ]}
                        center
                        zIndexRange={[20, 0]}
                    >
                        <div
                            className="px-3 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-black whitespace-nowrap"
                            style={{ color: '#1e293b', borderBottom: `5px solid ${slot.farge}` }}
                        >
                            {merke}
                        </div>
                    </Html>
                )}
                {figur === 'sporsmal' && (
                    <Html position={[0, 0.55, 0.3]} center zIndexRange={[20, 0]}>
                        <div
                            className="font-display font-black"
                            style={{ fontSize: 72, color: slot.farge, lineHeight: 1 }}
                        >
                            ?
                        </div>
                    </Html>
                )}
            </group>
            {merke && slot.lavMerke?.[b] && (
                <Html position={[0, 0.8, 1.2]} center zIndexRange={[20, 0]}>
                    <div
                        className="px-3 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-black whitespace-nowrap"
                        style={{ color: '#1e293b', borderBottom: `5px solid ${slot.farge}` }}
                    >
                        {merke}
                    </div>
                </Html>
            )}
            <Html position={[0, -0.05, 1.3]} center zIndexRange={[20, 0]}>
                <div
                    className="px-3 py-1 rounded-lg text-2xl font-black whitespace-nowrap text-white shadow"
                    style={{ background: slot.farge }}
                >
                    {slot.navn}
                </div>
            </Html>
        </group>
    );
}

/** Skyggen av Abraham (stamfar, men neppe historisk) og av mahayana-Buddha. */
function Skygge({ synlig, x, y, farge }: { synlig: boolean; x: number; y: number; farge: string }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const s = damp(ref.current.scale.x, synlig ? 1 : 0.001, 3, Math.min(dt, 0.05));
        ref.current.scale.setScalar(synlig ? Math.max(s, 0.6) : s);
    });
    return (
        <group ref={ref} position={[x, y, 0]} scale={synlig ? 1 : 0.001}>
            <Person farge={farge} skygge />
        </group>
    );
}

function kameraFor(modus: Modus, beat: number, n: number) {
    const bred = n >= 4 ? 15 : n === 3 ? 11.5 : 10.5;
    const x = modus === 'indisk' ? 1.2 : 0;
    if (modus === 'abrahamittisk' && beat === 0) return { pos: v3(0, 3, 9.5), se: v3(0, 1.6, 0) };
    return { pos: v3(x, 4.4, bred), se: v3(x, 3.4, 0) };
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const se = useRef(v3(0, 3.4, 0));
    const forste = useRef(true);
    const m = MODUSER[modus];
    const n = m.slots.length;

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mal = kameraFor(modus, beat, n);
        const f = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, f);
        se.current.lerp(mal.se, f);
        camera.lookAt(se.current);
    });

    const visTrinn = beat >= m.trinnFra;
    const venstre = slotX(0, n) - 1.6;
    const hoyre = slotX(n - 1, n) + 1.3;
    const buddhaX = modus === 'indisk' ? slotX(1, n) : 0;

    return (
        <>
            <color attach="background" args={['#ece3d2']} />
            <fog attach="fog" args={['#ece3d2', 26, 60]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[6, 14, 10]} intensity={1.2} color="#fff4e0" />
            <hemisphereLight args={['#fff6e6', '#8c7a62', 0.45]} />

            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[80, 60]} />
                <meshStandardMaterial color="#d6c6a6" roughness={0.95} />
            </mesh>
            <mesh position={[0, 5, -4]}>
                <boxGeometry args={[40, 10, 0.3]} />
                <meshStandardMaterial color="#e4d8c1" roughness={0.95} />
            </mesh>
            {[-12, -7.5, 7.5, 12].map((x) => (
                <mesh key={x} position={[x, 4, -3.4]}>
                    <cylinderGeometry args={[0.45, 0.5, 8, 20]} />
                    <meshStandardMaterial color="#efe7d8" roughness={0.9} />
                </mesh>
            ))}

            {/* Trinnene i trappa som tynne lister bak soklene */}
            {visTrinn &&
                TRINN.map((t) => (
                    <group key={t.niva}>
                        <mesh position={[(venstre + hoyre) / 2, NIVA[t.niva], -0.8]}>
                            <boxGeometry args={[hoyre - venstre, 0.05, 0.05]} />
                            <meshStandardMaterial color="#a8a29e" />
                        </mesh>
                        <Html
                            position={[venstre - 0.2, NIVA[t.niva], -0.8]}
                            center
                            zIndexRange={[10, 0]}
                        >
                            <div
                                className="text-2xl font-bold whitespace-nowrap"
                                style={{ color: '#57534e', transform: 'translateX(-50%)' }}
                            >
                                {t.navn}
                            </div>
                        </Html>
                    </group>
                ))}

            {m.slots.map((s, i) => (
                <Sokkel
                    key={`${modus}-${i}`}
                    slot={s}
                    x={slotX(i, n)}
                    beat={beat}
                    playing={playing}
                />
            ))}

            {modus === 'abrahamittisk' && (
                <>
                    <group position={[0, 0, 2.4]}>
                        <Skygge synlig={beat === 0} x={0} y={0} farge="#78716c" />
                    </group>
                    {beat === 0 && (
                        <Html position={[0, 2.4, 2.4]} center zIndexRange={[20, 0]}>
                            <div className="px-3 py-1 rounded-xl bg-white/90 shadow-lg text-2xl font-black whitespace-nowrap text-stone-700">
                                Abraham: levde han?
                            </div>
                        </Html>
                    )}
                </>
            )}
            {modus === 'indisk' && (
                <>
                    <group position={[0, 0, 0]} scale={1}>
                        <Skygge
                            synlig={beat === 3}
                            x={buddhaX + 2.8}
                            y={NIVA.laerer}
                            farge="#f59e0b"
                        />
                    </group>
                    {beat === 3 && (
                        <>
                            <mesh position={[buddhaX + 2.8, NIVA.laerer / 2, 0]}>
                                <boxGeometry args={[1.6, NIVA.laerer, 1.2]} />
                                <meshStandardMaterial color="#fde68a" transparent opacity={0.3} />
                            </mesh>
                            <pointLight
                                position={[buddhaX + 2.8, NIVA.laerer + 1.2, 1]}
                                intensity={6}
                                distance={5}
                                color="#fbbf24"
                            />
                            <Html
                                position={[buddhaX + 2.8, NIVA.laerer + 2.4, 0]}
                                center
                                zIndexRange={[20, 0]}
                            >
                                <div className="px-3 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-black whitespace-nowrap text-amber-800 text-center leading-tight">
                                    mahayana:
                                    <br />
                                    evig og guddommelig
                                </div>
                            </Html>
                        </>
                    )}
                </>
            )}
        </>
    );
}

export function GrunnleggereSalen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'aapning';
    const dpr = useDpr();
    const tekst = MODUSER[modus].tekst;
    const start = kameraFor(modus, 0, MODUSER[modus].slots.length).pos;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 45, near: 0.2, far: 200, position: [start.x, start.y, start.z] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: '4%' }}
                >
                    <div
                        className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl md:text-4xl font-display font-black text-slate-900"
                        style={{ borderLeft: '10px solid #b45309' }}
                    >
                        {tekst[Math.min(beat, tekst.length - 1)]}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
