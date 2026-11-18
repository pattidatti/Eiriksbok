import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Rommene i «Sult», bygd av enkle former. Stua der han møter Ylajali (møtet, synsvinkelen
 * og stolryggen), og det fattige kvistrommet der han prøver å skrive. Ingen ansikter, bare
 * kropper som står nær eller langt fra hverandre: avstanden er det som forteller.
 */

type Modus = 'motet' | 'kamera' | 'kvisten' | 'stolen';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

interface Plass {
    /** Gulvposisjon (x, z), høyde (y: 0 står, negativ sitter) og hvor figuren ser. */
    p: [number, number, number];
    ser: [number, number];
}

const HAN_SER_HENNE = (x: number, z: number): Plass['ser'] => [x, z];

function plasser(modus: Modus, beat: number): { han: Plass; hun: Plass } {
    if (modus === 'motet') {
        if (beat <= 1)
            return {
                han: { p: [-2.4, 0, 0.6], ser: HAN_SER_HENNE(1.4, 0.4) },
                hun: { p: [1.4, 0, 0.4], ser: [-2.4, 0.6] },
            };
        return {
            han: { p: [-4.2, 0, 1.4], ser: [-3.5, 1.2] },
            hun: { p: [-3.5, 0, 1.2], ser: [-4.2, 1.4] },
        };
    }
    if (modus === 'kamera')
        return {
            han: { p: [-1.8, 0, 1.6], ser: [1.0, -0.6] },
            hun: { p: [1.0, 0, -0.6], ser: [-1.8, 1.6] },
        };
    if (modus === 'kvisten')
        return {
            han:
                beat >= 3
                    ? { p: [0.9, 0, -0.2], ser: [5, 6] }
                    : { p: [0, -0.38, -0.55], ser: [0, -3] },
            hun: { p: [40, 0, 40], ser: [0, 0] },
        };
    // Stolen: hun sitter, han står ved stolryggen, så rygger han unna.
    const hun: Plass = { p: [-0.8, -0.38, -1.0], ser: [2, 2] };
    if (beat <= 1) return { han: { p: [0.15, 0, -1.45], ser: [-0.8, -1.3] }, hun };
    if (beat === 2) return { han: { p: [2.0, 0, 0.1], ser: [-0.8, -1.0] }, hun };
    return { han: { p: [2.6, 0, 0.7], ser: [-0.8, -1.0] }, hun };
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'motet') {
        if (beat === 0) return { pos: v(-0.5 + t * 0.05, 2.6, 8.5), se: v(-0.5, 1.2, 0) };
        if (beat === 1) return { pos: v(-0.6, 1.9, 3.6), se: v(-2.4, 1.45, 0.6) };
        if (beat === 2) return { pos: v(-1.6, 2.0, 5.2), se: v(-3.9, 1.0, 1.2) };
        return { pos: v(-2.6, 1.85, 3.6), se: v(-4.2, 1.5, 1.4) };
    }
    if (modus === 'kamera') {
        if (beat === 0) return { pos: v(0.4, 2.8, 8.6), se: v(-0.2, 1.0, 0.4) };
        if (beat === 1) return { pos: v(0.2, 9.5, 6.0), se: v(-0.3, 0.3, 0.4) };
        // Fra øynene hans, rett foran nesa: vi ser det han ser.
        return { pos: v(-1.5, 1.58, 1.36), se: v(1.0, 1.4, -0.6) };
    }
    if (modus === 'kvisten') {
        if (beat === 0) return { pos: v(3.6, 2.4, 3.6), se: v(0, 1.0, -1.0) };
        if (beat === 1) return { pos: v(1.6, 2.2, 1.6), se: v(0.4, 1.4, -2.6) };
        if (beat === 2) return { pos: v(-1.7, 2.0, -0.2), se: v(-0.5, 0.75, -1.45) };
        return { pos: v(3.8, 1.9, 4.2), se: v(0.6, 1.2, -0.4) };
    }
    if (beat === 0) return { pos: v(1.8, 2.2, 3.4), se: v(-0.3, 0.9, -1.2) };
    if (beat === 1) return { pos: v(0.9, 1.7, 1.2), se: v(-0.4, 1.0, -1.3) };
    return { pos: v(1.0, 2.6, 6.8), se: v(0.6, 0.9, -0.4) };
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const se = useRef(new THREE.Vector3());
    const forrigeBeat = useRef(-1);
    const beatTid = useRef(0);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const k = kameraFor(modus, beat, beatTid.current);
        if (forste.current) {
            camera.position.copy(k.pos);
            se.current.copy(k.se);
            forste.current = false;
        } else {
            const f = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(k.pos, f);
            se.current.lerp(k.se, f);
        }
        camera.lookAt(se.current);
    });
    return null;
}

function Mat({ farge, glod = 0.25 }: { farge: string; glod?: number }) {
    return (
        <meshStandardMaterial
            color={farge}
            emissive={farge}
            emissiveIntensity={glod}
            flatShading
            roughness={0.8}
        />
    );
}

/** En figur som glir mot plassen sin. Startplassen settes én gang (guiden §3c punkt 46). */
function Figur({
    plass,
    playing,
    kjole,
    hatt,
    arm = 0,
}: {
    plass: Plass;
    playing: boolean;
    kjole?: boolean;
    hatt?: boolean;
    /** Hvor langt armen er løftet fram (0-1). */
    arm?: number;
}) {
    const ref = useRef<THREE.Group>(null);
    const armRef = useRef<THREE.Group>(null);
    const [start] = useState<[number, number, number]>(plass.p);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const [x, y, z] = plass.p;
        const vinkel = Math.atan2(plass.ser[0] - x, plass.ser[1] - z);
        if (forste.current) {
            g.position.set(x, y, z);
            g.rotation.y = vinkel;
            forste.current = false;
        }
        g.position.x = damp(g.position.x, x, 3, dt);
        g.position.y = damp(g.position.y, y, 3, dt);
        g.position.z = damp(g.position.z, z, 3, dt);
        let d = vinkel - g.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        g.rotation.y += d * (1 - Math.exp(-4 * dt));
        if (armRef.current)
            armRef.current.rotation.x = damp(armRef.current.rotation.x, -arm * 1.3, 3, dt);
    });
    const kropp = kjole ? '#9f1239' : '#273449';
    return (
        <group ref={ref} position={start}>
            {kjole ? (
                <mesh position={[0, 0.6, 0]}>
                    <cylinderGeometry args={[0.2, 0.55, 1.2, 10]} />
                    <Mat farge={kropp} />
                </mesh>
            ) : (
                <>
                    <mesh position={[0, 0.85, 0]}>
                        <cylinderGeometry args={[0.27, 0.33, 0.9, 10]} />
                        <Mat farge={kropp} />
                    </mesh>
                    {[-0.13, 0.13].map((x) => (
                        <mesh key={x} position={[x, 0.2, 0]}>
                            <cylinderGeometry args={[0.1, 0.1, 0.4, 6]} />
                            <Mat farge="#1e293b" />
                        </mesh>
                    ))}
                </>
            )}
            {/* Hode og en nese, så vi ser hvor figuren ser */}
            <mesh position={[0, 1.52, 0]}>
                <sphereGeometry args={[0.22, 32, 24]} />
                <meshStandardMaterial
                    color="#e8b98a"
                    emissive="#e8b98a"
                    emissiveIntensity={0.3}
                    roughness={0.8}
                />
            </mesh>
            <mesh position={[0, 1.5, 0.22]}>
                <boxGeometry args={[0.06, 0.08, 0.08]} />
                <Mat farge="#d9a273" glod={0.35} />
            </mesh>
            {kjole && (
                <mesh position={[0, 1.62, -0.16]}>
                    <sphereGeometry args={[0.15, 10, 8]} />
                    <Mat farge="#5b3416" />
                </mesh>
            )}
            {hatt && (
                <group position={[0, 1.68, 0]}>
                    <mesh>
                        <cylinderGeometry args={[0.34, 0.34, 0.03, 16]} />
                        <Mat farge="#111827" glod={0.4} />
                    </mesh>
                    <mesh position={[0, 0.13, 0]}>
                        <cylinderGeometry args={[0.19, 0.2, 0.26, 14]} />
                        <Mat farge="#111827" glod={0.4} />
                    </mesh>
                </group>
            )}
            {!kjole && (
                <group ref={armRef} position={[0.34, 1.22, 0]}>
                    <mesh position={[0, -0.32, 0]}>
                        <boxGeometry args={[0.12, 0.64, 0.12]} />
                        <Mat farge={kropp} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

function Stol({ glod }: { glod: boolean }) {
    return (
        <group position={[-0.8, 0, -1.0]}>
            <mesh position={[0, 0.48, 0]}>
                <boxGeometry args={[0.62, 0.07, 0.6]} />
                <Mat farge="#6b3f22" />
            </mesh>
            {[
                [-0.26, -0.26],
                [0.26, -0.26],
                [-0.26, 0.26],
                [0.26, 0.26],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 0.24, z]}>
                    <boxGeometry args={[0.06, 0.48, 0.06]} />
                    <Mat farge="#4a2a15" />
                </mesh>
            ))}
            {/* Stolryggen */}
            <mesh position={[0, 0.98, -0.28]}>
                <boxGeometry args={[0.62, 0.95, 0.07]} />
                <meshStandardMaterial
                    color={glod ? '#fcd34d' : '#6b3f22'}
                    emissive={glod ? '#f59e0b' : '#6b3f22'}
                    emissiveIntensity={glod ? 0.9 : 0.25}
                    flatShading
                />
            </mesh>
        </group>
    );
}

function Stua({ modus, beat }: { modus: Modus; beat: number }) {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[14, 10]} />
                <Mat farge="#6b4428" glod={0.3} />
            </mesh>
            <mesh position={[0, 2.5, -4.1]}>
                <boxGeometry args={[14, 5, 0.2]} />
                <Mat farge="#3d5a4c" glod={0.3} />
            </mesh>
            <mesh position={[-6.1, 2.5, 0.9]}>
                <boxGeometry args={[0.2, 5, 10]} />
                <Mat farge="#35503f" glod={0.3} />
            </mesh>
            {/* Døra ut til gangen */}
            <mesh position={[-5.98, 1.15, 1.8]}>
                <boxGeometry args={[0.05, 2.3, 1.2]} />
                <Mat farge="#1c1208" glod={0.2} />
            </mesh>
            {/* Vinduet: kveld ute */}
            <mesh position={[2.6, 2.7, -3.99]}>
                <boxGeometry args={[2.4, 1.9, 0.05]} />
                <Mat farge="#5a3a22" glod={0.3} />
            </mesh>
            <mesh position={[2.6, 2.7, -3.95]}>
                <boxGeometry args={[2.1, 1.6, 0.05]} />
                <meshStandardMaterial color="#0f1f4a" emissive="#1e3a8a" emissiveIntensity={0.45} />
            </mesh>
            <mesh position={[2.6, 2.7, -3.91]}>
                <boxGeometry args={[0.08, 1.6, 0.04]} />
                <Mat farge="#5a3a22" glod={0.3} />
            </mesh>
            <mesh position={[2.6, 2.7, -3.91]}>
                <boxGeometry args={[2.1, 0.08, 0.04]} />
                <Mat farge="#5a3a22" glod={0.3} />
            </mesh>
            {/* Bordet med lampa */}
            <group position={[1.6, 0, -1.8]}>
                <mesh position={[0, 0.76, 0]}>
                    <cylinderGeometry args={[0.8, 0.8, 0.07, 20]} />
                    <Mat farge="#5a3218" />
                </mesh>
                <mesh position={[0, 0.38, 0]}>
                    <cylinderGeometry args={[0.08, 0.14, 0.76, 8]} />
                    <Mat farge="#4a2a15" />
                </mesh>
                <mesh position={[0, 1.05, 0]}>
                    <sphereGeometry args={[0.2, 12, 10]} />
                    <meshStandardMaterial
                        color="#fde68a"
                        emissive="#fbbf24"
                        emissiveIntensity={1.6}
                    />
                </mesh>
                <pointLight position={[0, 1.3, 0]} intensity={6} distance={9} color="#fcd9a0" />
            </group>
            <Stol glod={modus === 'stolen' && beat <= 1} />
        </group>
    );
}

function Kvisten({ beat }: { beat: number }) {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[9, 8]} />
                <Mat farge="#57534e" glod={0.3} />
            </mesh>
            <mesh position={[0, 2.2, -3.1]}>
                <boxGeometry args={[9, 4.4, 0.2]} />
                <Mat farge="#78716c" glod={0.28} />
            </mesh>
            <mesh position={[-3.6, 2.2, 0.5]}>
                <boxGeometry args={[0.2, 4.4, 8]} />
                <Mat farge="#6b6560" glod={0.28} />
            </mesh>
            {/* Vinduet mot byen, med lys i husene ute */}
            <mesh position={[0.4, 2.3, -2.98]}>
                <boxGeometry args={[1.8, 1.3, 0.05]} />
                <meshStandardMaterial color="#0f1f4a" emissive="#1e3a8a" emissiveIntensity={0.6} />
            </mesh>
            {[
                [-0.3, 1.95],
                [0.15, 2.05],
                [0.7, 1.9],
                [1.0, 2.15],
                [-0.1, 2.3],
            ].map(([x, y]) => (
                <mesh key={`${x}${y}`} position={[x, y, -2.94]}>
                    <boxGeometry args={[0.1, 0.08, 0.02]} />
                    <meshStandardMaterial
                        color="#fde68a"
                        emissive="#fbbf24"
                        emissiveIntensity={beat === 1 ? 2 : 0.8}
                    />
                </mesh>
            ))}
            {/* Senga langs veggen */}
            <mesh position={[-2.9, 0.3, 0.6]}>
                <boxGeometry args={[1.1, 0.4, 2.2]} />
                <Mat farge="#a8a29e" />
            </mesh>
            {/* Bordet med papir, lys og en tom tallerken */}
            <group position={[0, 0, -1.5]}>
                <mesh position={[0, 0.72, 0]}>
                    <boxGeometry args={[1.6, 0.06, 0.8]} />
                    <Mat farge="#5a3218" />
                </mesh>
                {[
                    [-0.7, -0.3],
                    [0.7, -0.3],
                    [-0.7, 0.3],
                    [0.7, 0.3],
                ].map(([x, z]) => (
                    <mesh key={`${x}${z}`} position={[x, 0.36, z]}>
                        <boxGeometry args={[0.06, 0.72, 0.06]} />
                        <Mat farge="#4a2a15" />
                    </mesh>
                ))}
                {[0, 1, 2].map((i) => (
                    <mesh
                        key={i}
                        position={[-0.1 + i * 0.08, 0.76 + i * 0.006, 0.05 - i * 0.04]}
                        rotation={[0, i * 0.3, 0]}
                    >
                        <boxGeometry args={[0.32, 0.005, 0.44]} />
                        <meshStandardMaterial
                            color="#fafaf9"
                            emissive="#fef3c7"
                            emissiveIntensity={beat === 1 ? 0.9 : 0.35}
                        />
                    </mesh>
                ))}
                <mesh position={[-0.55, 0.77, 0.1]}>
                    <cylinderGeometry args={[0.26, 0.2, 0.04, 20]} />
                    <meshStandardMaterial
                        color="#f5f5f4"
                        emissive="#e7e5e4"
                        emissiveIntensity={beat === 2 ? 0.7 : 0.3}
                    />
                </mesh>
                <mesh position={[0.6, 0.85, -0.2]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.22, 8]} />
                    <Mat farge="#fafaf9" glod={0.5} />
                </mesh>
                <mesh position={[0.6, 1.0, -0.2]}>
                    <sphereGeometry args={[0.04, 8, 6]} />
                    <meshStandardMaterial
                        color="#fde68a"
                        emissive="#f59e0b"
                        emissiveIntensity={2}
                    />
                </mesh>
                <pointLight
                    position={[0.6, 1.2, -0.1]}
                    intensity={2.5}
                    distance={5}
                    color="#fcd9a0"
                />
            </group>
            {/* Krakken hans */}
            <mesh position={[0, 0.25, -0.55]}>
                <cylinderGeometry args={[0.22, 0.22, 0.5, 10]} />
                <Mat farge="#4a2a15" />
            </mesh>
        </group>
    );
}

/** Et lite lys der hendene møtes ute i gangen. */
function Hender() {
    return (
        <mesh position={[-3.85, 0.95, 1.3]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={1.8} />
        </mesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { han, hun } = plasser(modus, beat);
    const bakgrunn = modus === 'kvisten' ? '#1a1714' : '#1c1410';
    return (
        <>
            <color attach="background" args={[bakgrunn]} />
            <fog attach="fog" args={[bakgrunn, 14, 30]} />
            <hemisphereLight args={['#fff1dc', '#2a1d14', 0.9]} />
            <directionalLight position={[4, 8, 6]} intensity={0.8} />
            <Kamera modus={modus} beat={beat} playing={playing} />
            {modus === 'kvisten' ? <Kvisten beat={beat} /> : <Stua modus={modus} beat={beat} />}
            <Figur
                plass={han}
                playing={playing}
                hatt={modus === 'motet'}
                arm={
                    modus === 'stolen' && beat === 1 ? 1 : modus === 'motet' && beat >= 2 ? 0.5 : 0
                }
            />
            {modus !== 'kvisten' && <Figur plass={hun} playing={playing} kjole />}
            {modus === 'motet' && beat >= 2 && <Hender />}
        </>
    );
}

interface Merke {
    fraBeat: number;
    tilBeat?: number;
    tittel: string;
    tekst?: string;
    /** Plass i prosent av bildet. */
    x: number;
    y: number;
    tone: 'lys' | 'mork' | 'gull' | 'rod';
}

function merkerFor(modus: Modus): Merke[] {
    if (modus === 'motet')
        return [
            {
                fraBeat: 0,
                tilBeat: 0,
                tittel: '«God aften!»',
                tekst: 'sier hun',
                x: 4,
                y: 7,
                tone: 'lys',
            },
            {
                fraBeat: 1,
                tilBeat: 1,
                tittel: 'Han glemmer å smile',
                tekst: 'hilser ikke med hatten',
                x: 4,
                y: 7,
                tone: 'lys',
            },
            {
                fraBeat: 2,
                tilBeat: 2,
                tittel: 'Ute i gangen',
                tekst: 'hun tar hånden hans',
                x: 4,
                y: 7,
                tone: 'gull',
            },
            { fraBeat: 3, tittel: 'Hva tenker han?', x: 4, y: 7, tone: 'mork' },
        ];
    if (modus === 'kamera')
        return [
            {
                fraBeat: 0,
                tilBeat: 0,
                tittel: 'Synsvinkel',
                tekst: 'hvor ser vi handlingen fra?',
                x: 4,
                y: 7,
                tone: 'lys',
            },
            {
                fraBeat: 1,
                tilBeat: 1,
                tittel: 'Utenfra',
                tekst: 'som et kamera',
                x: 4,
                y: 7,
                tone: 'lys',
            },
            {
                fraBeat: 2,
                tittel: 'Innenfra',
                tekst: 'personal synsvinkel: gjennom hans øyne',
                x: 4,
                y: 7,
                tone: 'gull',
            },
            {
                fraBeat: 3,
                tittel: 'Hva tenker hun?',
                tekst: 'det får vi ikke vite',
                x: 58,
                y: 66,
                tone: 'mork',
            },
        ];
    if (modus === 'kvisten')
        return [
            {
                fraBeat: 0,
                tilBeat: 0,
                tittel: 'Uten navn',
                tekst: 'en jeg-forteller',
                x: 4,
                y: 7,
                tone: 'lys',
            },
            {
                fraBeat: 1,
                tilBeat: 1,
                tittel: 'Kristiania',
                tekst: 'i dag Oslo. Han skriver.',
                x: 4,
                y: 7,
                tone: 'lys',
            },
            {
                fraBeat: 2,
                tilBeat: 2,
                tittel: 'Tom tallerken',
                tekst: 'han sulter',
                x: 4,
                y: 7,
                tone: 'rod',
            },
            { fraBeat: 3, tittel: 'Men enormt stolt', x: 4, y: 7, tone: 'gull' },
        ];
    return [
        {
            fraBeat: 0,
            tilBeat: 1,
            tittel: 'Hun:',
            tekst: '«... holde Deres hånd på min stolrygg»',
            x: 4,
            y: 7,
            tone: 'gull',
        },
        {
            fraBeat: 2,
            tilBeat: 2,
            tittel: 'Panikk',
            tekst: 'han trekker seg unna',
            x: 4,
            y: 7,
            tone: 'rod',
        },
        {
            fraBeat: 3,
            tittel: 'Han:',
            tekst: '«jeg er meget, meget fattig»',
            x: 4,
            y: 7,
            tone: 'mork',
        },
    ];
}

const TONE: Record<Merke['tone'], string> = {
    lys: 'bg-white/95 text-slate-900',
    mork: 'bg-slate-900/90 text-white',
    gull: 'bg-amber-300/95 text-slate-900',
    rod: 'bg-red-700/95 text-white',
};

export function SultRommet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'motet';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = merkerFor(modus).filter(
        (m) => beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat)
    );
    const forste = kameraFor(modus, beat, 0).pos;
    const kameraRamme = modus === 'kamera' && beat === 1;
    const fanget = modus === 'kamera' && beat >= 3;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [forste.x, forste.y, forste.z] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {fanget && (
                    <motion.div
                        key="fanget"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                'radial-gradient(ellipse 48% 52% at 50% 46%, transparent 55%, rgba(2,6,23,0.88) 100%)',
                        }}
                    />
                )}
                {kameraRamme && (
                    <motion.div
                        key="ramme"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute pointer-events-none"
                        style={{ left: '22%', right: '22%', top: '24%', bottom: '10%' }}
                    >
                        {[
                            { left: 0, top: 0, borderLeft: true, borderTop: true },
                            { right: 0, top: 0, borderRight: true, borderTop: true },
                            { left: 0, bottom: 0, borderLeft: true, borderBottom: true },
                            { right: 0, bottom: 0, borderRight: true, borderBottom: true },
                        ].map((h, i) => (
                            <div
                                key={i}
                                className="absolute"
                                style={{
                                    width: 48,
                                    height: 48,
                                    left: h.left,
                                    right: h.right,
                                    top: h.top,
                                    bottom: h.bottom,
                                    borderLeft: h.borderLeft ? '5px solid white' : undefined,
                                    borderRight: h.borderRight ? '5px solid white' : undefined,
                                    borderTop: h.borderTop ? '5px solid white' : undefined,
                                    borderBottom: h.borderBottom ? '5px solid white' : undefined,
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {merker.map((m) => (
                    <motion.div
                        key={m.tittel}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className={`absolute rounded-2xl shadow-xl px-5 py-3 ${TONE[m.tone]}`}
                        style={{ left: `${m.x}%`, top: `${m.y}%`, maxWidth: '40%' }}
                    >
                        <div
                            className="text-3xl font-black leading-tight"
                            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                        >
                            {m.tittel}
                        </div>
                        {m.tekst && (
                            <div className="text-xl font-semibold opacity-90 mt-0.5">{m.tekst}</div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
