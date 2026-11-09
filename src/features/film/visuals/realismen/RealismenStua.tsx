import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Et fint borgerhus en kveld i en norsk by, bygd som et dukkehus.
 * «fasade»: huset utenfra, kirken, gardinene som trekkes for.
 * «innsyn»: forveggen synker i bakken, og vi ser rett inn i stua (dobbeltmoralen).
 * «dukkehjem»: Nora, mannen og de tre barna. Døra åpnes, og Nora går.
 */

type Modus = 'fasade' | 'innsyn' | 'dukkehjem';

const BREDDE = 12;
const DYBDE = 8;
const HOYDE = 5;
const FRONT_Z = DYBDE / 2;
const BAK_Z = -DYBDE / 2;

function kameraFor(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'fasade') {
            switch (beat) {
                case 0:
                    return { pos: v(15 - t * 0.25, 7, 27), se: v(-1, 3, 0) };
                case 1:
                    return { pos: v(4 - t * 0.1, 3.4, 12.5), se: v(-0.5, 2.8, 4) };
                case 2:
                    return { pos: v(-4, 6.5, 16), se: v(-16, 6.5, -12) };
                default:
                    return { pos: v(-2.6, 2.9, 9.5 - t * 0.08), se: v(-3, 2.8, 4) };
            }
        }
        if (modus === 'innsyn') {
            switch (beat) {
                case 0:
                    return { pos: v(0, 3.6, 21), se: v(0, 3, 0) };
                case 1:
                    return { pos: v(0.6, 3.8, 17.5), se: v(0, 2.6, 0) };
                case 2:
                    return { pos: v(-0.6, 3.8, 16.5), se: v(0, 2.6, 0) };
                case 3:
                    return { pos: v(0, 3.4, 15), se: v(0, 2.4, 0) };
                default:
                    return { pos: v(0, 3.1, 10.5 - t * 0.12), se: v(0, 2.2, -2) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(0, 3.6, 14.5), se: v(0, 2.4, -1) };
            case 1:
                return { pos: v(-1.6, 4.3, 11.5), se: v(-1.4, 1.2, -1) };
            case 2:
                return { pos: v(2.4, 3.0, 10.5), se: v(3, 1.7, -2.5) };
            case 3:
                return { pos: v(3.2, 2.9, 9.5), se: v(4.2, 1.8, -3.5) };
            default:
                return { pos: v(11, 8, 25), se: v(0, 3, 0) };
        }
    };
}

/** Et enkelt menneske: kjole/frakk som kjegle og hode som kule. */
function Menneske({
    farge,
    storrelse = 1,
    gruppeRef,
    posisjon,
}: {
    farge: string;
    storrelse?: number;
    gruppeRef?: React.Ref<THREE.Group>;
    posisjon: [number, number, number];
}) {
    return (
        <group ref={gruppeRef} position={posisjon} scale={storrelse}>
            <mesh position={[0, 0.75, 0]}>
                <coneGeometry args={[0.48, 1.5, 10]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 1.72, 0]}>
                <sphereGeometry args={[0.3, 12, 10]} />
                <meshStandardMaterial color="#f1c9a5" />
            </mesh>
        </group>
    );
}

function Lenestol({ x, z, rot }: { x: number; z: number; rot: number }) {
    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[1.1, 0.5, 1.1]} />
                <meshStandardMaterial color="#7a1f2b" flatShading />
            </mesh>
            <mesh position={[0, 1.1, -0.48]}>
                <boxGeometry args={[1.1, 1.3, 0.2]} />
                <meshStandardMaterial color="#7a1f2b" flatShading />
            </mesh>
        </group>
    );
}

/** Rommet: gulv, tre vegger, bord med lampe, lenestoler som vender fra hverandre. */
function Stua({ modus, beat }: { modus: Modus; beat: number }) {
    const pengekiste = modus === 'innsyn' && beat >= 1;
    return (
        <group>
            {/* Gulv */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[BREDDE, DYBDE]} />
                <meshStandardMaterial color="#8a5a3b" emissive="#3b2416" emissiveIntensity={0.35} />
            </mesh>
            {/* Teppe */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, 0.04, 0.3]}>
                <planeGeometry args={[5.5, 3.6]} />
                <meshStandardMaterial color="#5b3a6e" emissive="#2a1834" emissiveIntensity={0.3} />
            </mesh>
            {/* Bakvegg, venstre og høyre vegg: pussede yttervegger, tapet på innsiden */}
            <mesh position={[0, HOYDE / 2, BAK_Z]}>
                <boxGeometry args={[BREDDE, HOYDE, 0.3]} />
                <meshStandardMaterial
                    color="#e8d6a8"
                    emissive="#5e5032"
                    emissiveIntensity={0.45}
                    flatShading
                />
            </mesh>
            {[-1, 1].map((side) => (
                <mesh key={side} position={[(side * BREDDE) / 2, HOYDE / 2, 0]}>
                    <boxGeometry args={[0.3, HOYDE, DYBDE]} />
                    <meshStandardMaterial
                        color="#d9c697"
                        emissive="#5e5032"
                        emissiveIntensity={0.4}
                        flatShading
                    />
                </mesh>
            ))}
            <mesh position={[0, HOYDE / 2, BAK_Z + 0.152]}>
                <planeGeometry args={[BREDDE - 0.3, HOYDE]} />
                <meshStandardMaterial color="#6f8f6b" emissive="#2c3d2a" emissiveIntensity={0.45} />
            </mesh>
            {[-1, 1].map((side) => (
                <mesh
                    key={side}
                    position={[side * (BREDDE / 2 - 0.152), HOYDE / 2, 0]}
                    rotation={[0, -side * (Math.PI / 2), 0]}
                >
                    <planeGeometry args={[DYBDE, HOYDE]} />
                    <meshStandardMaterial
                        color="#637f60"
                        emissive="#2c3d2a"
                        emissiveIntensity={0.45}
                    />
                </mesh>
            ))}
            {/* Bilder på veggen */}
            {[-3.6, -1.2].map((x) => (
                <mesh key={x} position={[x, 3.2, BAK_Z + 0.18]}>
                    <boxGeometry args={[1.3, 1, 0.05]} />
                    <meshStandardMaterial
                        color="#c9a14a"
                        emissive="#5a4410"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            ))}
            {/* Bordet */}
            <mesh position={[-0.8, 1.0, 0]}>
                <cylinderGeometry args={[1.1, 1.1, 0.12, 20]} />
                <meshStandardMaterial color="#5a3a24" />
            </mesh>
            <mesh position={[-0.8, 0.5, 0]}>
                <cylinderGeometry args={[0.14, 0.3, 1, 8]} />
                <meshStandardMaterial color="#4a2f1d" />
            </mesh>
            {/* Lampa */}
            <mesh position={[-0.8, 1.4, 0]}>
                <cylinderGeometry args={[0.22, 0.38, 0.5, 12]} />
                <meshStandardMaterial color="#ffe2a8" emissive="#ffc061" emissiveIntensity={1.3} />
            </mesh>
            {/* Brevet på bordet: en hemmelighet */}
            {modus === 'innsyn' && beat >= 1 && (
                <mesh position={[-0.2, 1.08, 0.4]} rotation={[0, 0.5, 0]}>
                    <boxGeometry args={[0.6, 0.02, 0.42]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive="#d8d8d8"
                        emissiveIntensity={0.5}
                    />
                </mesh>
            )}
            {/* To stoler som vender fra hverandre */}
            <Lenestol x={-4.3} z={1.9} rot={0.9} />
            <Lenestol x={2.0} z={0.6} rot={-0.9} />
            {/* Pengekista med mynter */}
            {pengekiste && (
                <group position={[-4.4, 0, -2.6]}>
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[1.2, 0.8, 0.8]} />
                        <meshStandardMaterial color="#6b4423" flatShading />
                    </mesh>
                    {[0, 1, 2, 3].map((i) => (
                        <mesh key={i} position={[-0.3 + i * 0.2, 0.86 + (i % 2) * 0.05, 0]}>
                            <cylinderGeometry args={[0.16, 0.16, 0.06, 12]} />
                            <meshStandardMaterial
                                color="#f5c542"
                                emissive="#a87b12"
                                emissiveIntensity={0.6}
                            />
                        </mesh>
                    ))}
                </group>
            )}
        </group>
    );
}

/** Døra i bakveggen. Den svinger inn i rommet, og kaldt lys kommer inn utenfra. */
function Dor({ apen, playing }: { apen: boolean; playing: boolean }) {
    const hengsel = useRef<THREE.Group>(null);
    const lys = useRef<THREE.MeshStandardMaterial>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const k = forste.current ? 1e6 : dt;
        forste.current = false;
        const g = hengsel.current;
        if (g) g.rotation.y = damp(g.rotation.y, apen ? -1.8 : 0, 1.6, k);
        if (lys.current)
            lys.current.emissiveIntensity = damp(
                lys.current.emissiveIntensity,
                apen ? 1.6 : 0.1,
                1.6,
                k
            );
    });
    return (
        <group>
            {/* Døråpningen: lys utenfra */}
            <mesh position={[4.3, 1.45, BAK_Z + 0.17]}>
                <boxGeometry args={[1.5, 2.9, 0.02]} />
                <meshStandardMaterial
                    ref={lys}
                    color="#dbeafe"
                    emissive="#bfdbfe"
                    emissiveIntensity={0.1}
                />
            </mesh>
            {/* Dørkarmen */}
            <mesh position={[4.3, 3.0, BAK_Z + 0.2]}>
                <boxGeometry args={[1.8, 0.2, 0.1]} />
                <meshStandardMaterial color="#f3ead7" />
            </mesh>
            <group ref={hengsel} position={[3.55, 0, BAK_Z + 0.22]}>
                <mesh position={[0.75, 1.45, 0]}>
                    <boxGeometry args={[1.5, 2.9, 0.12]} />
                    <meshStandardMaterial
                        color="#6b3f22"
                        emissive="#2a170b"
                        emissiveIntensity={0.4}
                        flatShading
                    />
                </mesh>
                <mesh position={[1.3, 1.4, 0.1]}>
                    <sphereGeometry args={[0.08, 8, 6]} />
                    <meshStandardMaterial color="#e2b33b" />
                </mesh>
            </group>
        </group>
    );
}

const VINDUER = [-3, 3];

/** Forveggen med vinduer og gardiner. Den synker i bakken når vi skal se inn. */
function Forvegg({
    borte,
    lukket,
    playing,
}: {
    borte: boolean;
    lukket: boolean;
    playing: boolean;
}) {
    const vegg = useRef<THREE.Group>(null);
    const gardiner = useRef<(THREE.Mesh | null)[]>([]);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const k = forste.current ? 1e6 : dt;
        forste.current = false;
        if (vegg.current)
            vegg.current.position.y = damp(
                vegg.current.position.y,
                borte ? -HOYDE - 0.5 : 0,
                1.4,
                k
            );
        gardiner.current.forEach((g, i) => {
            if (!g) return;
            const side = i % 2 === 0 ? -1 : 1;
            const bredde = lukket ? 0.95 : 0.4;
            g.scale.x = damp(g.scale.x, bredde, 1.5, k);
            const vx = VINDUER[Math.floor(i / 2)];
            g.position.x = vx + side * (0.9 - (g.scale.x * 1) / 2);
        });
    });
    return (
        <group ref={vegg}>
            <mesh position={[0, HOYDE / 2, FRONT_Z]}>
                <boxGeometry args={[BREDDE + 0.3, HOYDE, 0.3]} />
                <meshStandardMaterial
                    color="#e8d6a8"
                    emissive="#5e5032"
                    emissiveIntensity={0.45}
                    flatShading
                />
            </mesh>
            {/* Hvite lister */}
            <mesh position={[0, 0.25, FRONT_Z + 0.17]}>
                <boxGeometry args={[BREDDE + 0.3, 0.5, 0.06]} />
                <meshStandardMaterial color="#f8f4ea" emissive="#6d6a62" emissiveIntensity={0.4} />
            </mesh>
            {VINDUER.map((x) => (
                <group key={x}>
                    <mesh position={[x, 2.9, FRONT_Z + 0.16]}>
                        <boxGeometry args={[2.0, 2.2, 0.05]} />
                        <meshStandardMaterial
                            color="#f8f4ea"
                            emissive="#6d6a62"
                            emissiveIntensity={0.4}
                        />
                    </mesh>
                    <mesh position={[x, 2.9, FRONT_Z + 0.19]}>
                        <boxGeometry args={[1.8, 2.0, 0.03]} />
                        <meshStandardMaterial
                            color="#ffd98a"
                            emissive="#ffb84d"
                            emissiveIntensity={1.2}
                        />
                    </mesh>
                </group>
            ))}
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        gardiner.current[i] = m;
                    }}
                    position={[
                        VINDUER[Math.floor(i / 2)] + (i % 2 === 0 ? -0.7 : 0.7),
                        2.9,
                        FRONT_Z + 0.23,
                    ]}
                >
                    <boxGeometry args={[1, 2.0, 0.04]} />
                    <meshStandardMaterial
                        color="#8b1e2d"
                        emissive="#3a0b12"
                        emissiveIntensity={0.5}
                    />
                </mesh>
            ))}
            {/* Inngangsdøra midt på */}
            <mesh position={[0, 1.3, FRONT_Z + 0.21]}>
                <boxGeometry args={[1.4, 2.6, 0.06]} />
                <meshStandardMaterial color="#3f2a1a" emissive="#1c120a" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, 2.85, FRONT_Z + 0.19]}>
                <boxGeometry args={[1.0, 0.4, 0.04]} />
                <meshStandardMaterial color="#ffd98a" emissive="#ffb84d" emissiveIntensity={1.0} />
            </mesh>
        </group>
    );
}

/** Taket: et prisme over hele huset. */
function Tak() {
    return (
        <group>
            <mesh
                position={[0, HOYDE + 1.17, 0]}
                rotation={[-Math.PI / 2, 0, Math.PI / 2]}
                scale={[1, 1, 0.45]}
            >
                <cylinderGeometry args={[5.2, 5.2, BREDDE + 1, 3]} />
                <meshStandardMaterial
                    color="#4b5563"
                    emissive="#1f2937"
                    emissiveIntensity={0.4}
                    flatShading
                />
            </mesh>
            {/* Pipe */}
            <mesh position={[3.5, HOYDE + 2.6, -1]}>
                <boxGeometry args={[0.7, 1.6, 0.7]} />
                <meshStandardMaterial color="#7c2d12" emissive="#2d0f05" emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
}

/** Nabohus i gata, med lys i noen vinduer. */
function Gata() {
    const hus = useMemo(
        () =>
            [-31, 15.5, 29].map((x, i) => ({
                x,
                h: 4.5 + frø(i) * 2,
                b: 10 + frø(i + 4) * 2,
                farge: ['#c9b48f', '#b9c6c9', '#d8c3a5', '#c4a8a0'][i],
            })),
        []
    );
    return (
        <>
            {hus.map((h, i) => (
                <group key={i} position={[h.x, 0, 0]}>
                    <mesh position={[0, h.h / 2, 0]}>
                        <boxGeometry args={[h.b, h.h, 8]} />
                        <meshStandardMaterial
                            color={h.farge}
                            emissive="#3a3530"
                            emissiveIntensity={0.4}
                            flatShading
                        />
                    </mesh>
                    <mesh
                        position={[0, h.h + 1, 0]}
                        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
                        scale={[1, 1, 0.4]}
                    >
                        <cylinderGeometry args={[5, 5, h.b + 0.6, 3]} />
                        <meshStandardMaterial
                            color="#374151"
                            emissive="#111827"
                            emissiveIntensity={0.4}
                            flatShading
                        />
                    </mesh>
                    {[-2.5, 2.5].map((wx, j) => (
                        <mesh key={wx} position={[wx, h.h * 0.55, 4.02]}>
                            <boxGeometry args={[1.5, 1.6, 0.05]} />
                            <meshStandardMaterial
                                color={(i + j) % 2 === 0 ? '#ffd98a' : '#334155'}
                                emissive={(i + j) % 2 === 0 ? '#ffb84d' : '#0f172a'}
                                emissiveIntensity={(i + j) % 2 === 0 ? 0.9 : 0.3}
                            />
                        </mesh>
                    ))}
                </group>
            ))}
        </>
    );
}

/** Kirken bak husene: skip og tårn med spir. */
function Kirke({ lys }: { lys: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(() => {
        if (mat.current) mat.current.emissiveIntensity = lys ? 1.4 : 0.6;
    });
    return (
        <group position={[-17, 0, -16]}>
            <mesh position={[3.5, 2.5, 0]}>
                <boxGeometry args={[7, 5, 5]} />
                <meshStandardMaterial
                    color="#e5e7eb"
                    emissive="#4b5563"
                    emissiveIntensity={0.45}
                    flatShading
                />
            </mesh>
            <mesh
                position={[3.5, 6, 0]}
                rotation={[-Math.PI / 2, 0, Math.PI / 2]}
                scale={[1, 1, 0.5]}
            >
                <cylinderGeometry args={[3.2, 3.2, 7.4, 3]} />
                <meshStandardMaterial
                    color="#334155"
                    emissive="#0f172a"
                    emissiveIntensity={0.4}
                    flatShading
                />
            </mesh>
            <mesh position={[-1, 4.5, 0]}>
                <boxGeometry args={[2.6, 9, 2.6]} />
                <meshStandardMaterial
                    color="#f1f5f9"
                    emissive="#4b5563"
                    emissiveIntensity={0.45}
                    flatShading
                />
            </mesh>
            <mesh position={[-1, 11.2, 0]}>
                <coneGeometry args={[1.9, 4.4, 4]} />
                <meshStandardMaterial
                    color="#334155"
                    emissive="#0f172a"
                    emissiveIntensity={0.4}
                    flatShading
                />
            </mesh>
            {/* Klokketårnets vindu */}
            <mesh position={[-1, 7.6, 1.32]}>
                <boxGeometry args={[0.9, 1.3, 0.04]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#ffe2a8"
                    emissive="#ffc061"
                    emissiveIntensity={0.6}
                />
            </mesh>
            {[1.6, 3.5, 5.4].map((x) => (
                <mesh key={x} position={[x, 2.8, 2.52]}>
                    <boxGeometry args={[0.8, 1.8, 0.04]} />
                    <meshStandardMaterial
                        color="#ffe2a8"
                        emissive="#ffc061"
                        emissiveIntensity={0.8}
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Avisene som virvler rundt huset etter stykket. */
const AVISER = Array.from({ length: 14 }, (_, i) => ({
    a: frø(i) * Math.PI * 2,
    r: 8 + frø(i + 20) * 5,
    y: 2 + frø(i + 40) * 7,
    fart: 0.15 + frø(i + 60) * 0.2,
}));

function Aviser({ vis, playing }: { vis: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const g = ref.current;
        if (!g) return;
        g.children.forEach((c, i) => {
            const a = AVISER[i];
            const vinkel = a.a + tid.current * a.fart;
            c.position.set(
                Math.cos(vinkel) * a.r,
                a.y + Math.sin(tid.current + i) * 0.4,
                Math.sin(vinkel) * a.r
            );
            c.rotation.set(0.4 + Math.sin(tid.current * 0.7 + i) * 0.3, -vinkel, 0.2);
        });
        g.scale.setScalar(damp(g.scale.x, vis ? 1 : 0.001, 2, dt || 1));
    });
    return (
        <group ref={ref} scale={0.001}>
            {AVISER.map((_, i) => (
                <group key={i}>
                    <mesh>
                        <boxGeometry args={[1.6, 1.1, 0.03]} />
                        <meshStandardMaterial
                            color="#f5f1e6"
                            emissive="#8a8576"
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                    {[0.3, 0.05, -0.2].map((y) => (
                        <mesh key={y} position={[0, y, 0.02]}>
                            <boxGeometry args={[1.3, y === 0.3 ? 0.18 : 0.06, 0.01]} />
                            <meshStandardMaterial color="#334155" />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

/** Familien i dukkehjemmet. Nora går mot døra og ut. */
function Familien({ beat, playing }: { beat: number; playing: boolean }) {
    const nora = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const mål = useMemo(() => {
        if (beat <= 1) return v(0.6, 0, 1.2);
        if (beat === 2) return v(3.4, 0, -2.2);
        return v(4.3, 0, -6.5);
    }, [beat]);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = nora.current;
        if (!g) return;
        const k = forste.current ? 1 : 1 - Math.exp(-0.9 * dt);
        forste.current = false;
        g.position.lerp(mål, k);
        g.visible = g.position.z > BAK_Z - 0.6;
    });
    if (beat < 1) return null;
    return (
        <>
            <Menneske farge="#1e3a8a" storrelse={1.12} posisjon={[-2.4, 0, 1.6]} />
            <Menneske farge="#be185d" posisjon={[0.6, 0, 1.2]} gruppeRef={nora} />
            {/* De tre barna ved sengene sine */}
            {[-4.6, -3.5, -2.4].map((x) => (
                <group key={x}>
                    <mesh position={[x, 0.25, -3.1]}>
                        <boxGeometry args={[0.8, 0.5, 1.4]} />
                        <meshStandardMaterial
                            color="#f8fafc"
                            emissive="#64748b"
                            emissiveIntensity={0.35}
                        />
                    </mesh>
                    <Menneske farge="#f59e0b" storrelse={0.62} posisjon={[x, 0, -2.1]} />
                </group>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kamera = useMemo(() => kameraFor(modus), [modus]);
    useKamera(kamera, beat, playing);
    const veggBorte = modus === 'dukkehjem' || (modus === 'innsyn' && beat >= 1);
    const gardinerLukket = modus === 'fasade' && beat >= 3;
    const dorApen = modus === 'dukkehjem' && beat >= 2;
    return (
        <>
            <color attach="background" args={['#24324f']} />
            <fog attach="fog" args={['#2c3b5c', 35, 110]} />
            <ambientLight intensity={0.7} />
            <hemisphereLight args={['#a5b8dc', '#2b2f3a', 0.7]} />
            <directionalLight position={[14, 22, 18]} intensity={0.6} color="#c8d6f0" />
            <pointLight
                position={[-0.8, 3.6, 0.5]}
                color="#ffc27a"
                intensity={22}
                distance={14}
                decay={1.4}
            />
            {/* Gata */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[220, 220]} />
                <meshStandardMaterial color="#59606b" emissive="#23272e" emissiveIntensity={0.45} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 9]}>
                <planeGeometry args={[120, 6]} />
                <meshStandardMaterial color="#6b7280" emissive="#2b2f36" emissiveIntensity={0.45} />
            </mesh>
            <Gata />
            <Kirke lys={modus === 'fasade' && beat === 2} />
            <Stua modus={modus} beat={beat} />
            <Dor apen={dorApen} playing={playing} />
            <Forvegg borte={veggBorte} lukket={gardinerLukket} playing={playing} />
            <Tak />
            {modus === 'dukkehjem' && <Familien beat={beat} playing={playing} />}
            <Aviser vis={modus === 'dukkehjem' && beat >= 4} playing={playing} />
        </>
    );
}

const LAPPER: Record<Modus, string[]> = {
    fasade: [
        'En kveld i en norsk by',
        'Fine klær og tunge gardiner',
        'Søndag: til kirken',
        'Bak gardinene?',
    ],
    innsyn: [
        'Utad: pent og dannet',
        'Bak de lukkede dørene',
        'Dobbeltmoral',
        'Enkelt, direkte, presist',
        'Veggen inn til stua er borte',
    ],
    dukkehjem: [
        'Et dukkehjem, 1879',
        'Nora, mannen og tre små barn',
        'Nora forlater dem',
        'Et fritt menneske',
        'Stor debatt i avisene',
    ],
};

const HEMMELIGHETER = ['Løgner', 'Ulykkelige ekteskap', 'Utroskap', 'Lureri med penger'];

export function RealismenStua({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'fasade';
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
                camera={{ fov: 42, near: 0.3, far: 300, position: [15, 7, 27] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 top-[6%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={lapp}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-4xl shadow-xl"
                    >
                        {lapp}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'innsyn' && beat >= 1 && beat <= 2 && (
                <div className="absolute inset-x-0 bottom-[6%] flex justify-center gap-3 pointer-events-none">
                    {HEMMELIGHETER.map((h, i) => (
                        <motion.div
                            key={h}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 + i * 0.6 }}
                            className="px-4 py-2 rounded-xl bg-rose-100 text-rose-900 font-black text-2xl shadow-lg"
                        >
                            {h}
                        </motion.div>
                    ))}
                </div>
            )}
            {modus === 'innsyn' && beat === 2 && (
                <div className="absolute inset-x-0 top-[22%] flex justify-center gap-6 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="px-5 py-2 rounded-xl bg-amber-100 text-slate-900 font-bold text-2xl shadow-lg"
                    >
                        Utad: perfekt
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                        className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-2xl shadow-lg"
                    >
                        Hjemme: noe helt annet
                    </motion.div>
                </div>
            )}
        </div>
    );
}
