import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Konfusianisme-filmens 3D-verden.
 * - «vei»: Konfucius går fra fyrstehoff til fyrstehoff. Portene lukkes, én etter én.
 * - «hall»: en forfedrehall uten gudebilde, med minnetavler for de døde i slekta.
 * - «band»: de fem båndene som par av figurer, med plikt som går begge veier.
 * - «bukk»: embetsmenn som bøyer seg i takt foran en hersker.
 * Veien går langs x. Portene står på nordsiden av veien (-z) og vender mot veien.
 */
type Modus = 'vei' | 'hall' | 'band' | 'bukk';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    vei: [
        'Kina: små riker i krig',
        'Et svar på hvordan krig kan bli til fred',
        'Fyrsten tar ikke planen i bruk',
        'Ingen fyrste vil prøve læren',
        'Han dør uten gjennomslag',
    ],
    hall: [
        'Et livssyn uten religion?',
        'Ingen gud i sentrum',
        'De samme store spørsmålene',
        'Forfedredyrkelse: en religiøs side',
        'Forskerne er ikke enige',
    ],
    band: [
        'De fem båndene',
        'Familien',
        'Riket',
        'Ekteskapet og vennskapet',
        'Bare lydighet oppover?',
        'Fyrsten og undersåtten',
    ],
    bukk: [
        'Li: de faste formene',
        'Små vaner hver dag',
        'Øvelse former følelser og tanker',
        'Herskeren skal gi folket opplæring',
    ],
};

/* ------------------------------------------------------------------ figurer */

interface FigurProps {
    farge: string;
    hatt?: string;
    skala?: number;
    bukk?: React.RefObject<THREE.Group | null>;
}

/** En figur i lang kappe. Overkroppen sitter i en egen gruppe som kan bøyes fram. */
function Figur({ farge, hatt = '#1c1917', skala = 1, bukk }: FigurProps) {
    return (
        <group scale={skala}>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.42, 0.62, 1, 12]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <group ref={bukk} position={[0, 1, 0]}>
                <mesh position={[0, 0.45, 0]}>
                    <cylinderGeometry args={[0.32, 0.42, 0.9, 12]} />
                    <meshStandardMaterial color={farge} flatShading />
                </mesh>
                <mesh position={[0, 1.15, 0]}>
                    <sphereGeometry args={[0.28, 14, 10]} />
                    <meshStandardMaterial color="#e7c9a0" />
                </mesh>
                <mesh position={[0, 1.45, 0]}>
                    <cylinderGeometry args={[0.14, 0.2, 0.22, 10]} />
                    <meshStandardMaterial color={hatt} />
                </mesh>
            </group>
        </group>
    );
}

/** Merkelapp over 3D, som DOM. */
function Merke({
    pos,
    children,
    farge = '#fbf6ea',
    tekst = '#1c1917',
}: {
    pos: [number, number, number];
    children: ReactNode;
    farge?: string;
    tekst?: string;
}) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div
                className="px-4 py-2 rounded-xl shadow-xl text-center text-2xl font-black leading-tight"
                style={{ background: farge, color: tekst, whiteSpace: 'nowrap' }}
            >
                {children}
            </div>
        </Html>
    );
}

/** Rødt kryss ved siden av ordet «Nei». */
function Nei({ pos }: { pos: [number, number, number] }) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div
                className="flex items-center gap-1 px-3 py-1 rounded-xl shadow-xl text-2xl font-black"
                style={{ background: '#fef2f2', color: '#b91c1c', whiteSpace: 'nowrap' }}
            >
                <X className="w-7 h-7" strokeWidth={4} /> Nei
            </div>
        </Html>
    );
}

/* ------------------------------------------------------------------ kamera */

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

const PORTER = [0, 16, 32];

function vandrerFor(beat: number, t: number): { x: number; z: number; ry: number } {
    switch (beat) {
        case 0:
            return { x: -16 + Math.min(t, 5) * 2.2, z: 1, ry: Math.PI / 2 };
        case 1:
        case 2:
            return { x: 0, z: -2.4, ry: Math.PI };
        case 3:
            return { x: 32 * (1 - Math.exp(-1.1 * t)), z: -2.4, ry: Math.PI };
        default:
            return { x: 32 + Math.min(t, 5) * 2, z: 1, ry: Math.PI / 2 };
    }
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'vei') {
        const w = vandrerFor(beat, t);
        switch (beat) {
            case 0:
                return { pos: v(w.x - 7, 3.4, 9), se: v(w.x + 4, 1.6, -2) };
            case 1:
            case 2:
                return { pos: v(6.5, 3.2, 10), se: v(0, 2.4, -4) };
            case 3:
                return { pos: v(18, 10, 25), se: v(18, 1.5, -3) };
            default:
                return { pos: v(33, 5, 13), se: v(39, 1, -1) };
        }
    }
    if (modus === 'hall') {
        switch (beat) {
            case 0:
                return { pos: v(0, 3.4, 14 - Math.min(t, 4) * 0.8), se: v(0, 2.4, -6) };
            case 1:
            case 2:
                return { pos: v(0, 3, 5), se: v(0, 2.2, -6) };
            case 3:
                return { pos: v(3.2, 3.6, 6.5), se: v(0, 1.8, -5) };
            default:
                return { pos: v(0, 5, 12), se: v(0, 2, -4) };
        }
    }
    if (modus === 'band') {
        switch (beat) {
            case 0:
                return { pos: v(0, 6, 22), se: v(0, 1.6, 0) };
            case 1:
                return { pos: v(-9, 4, 12), se: v(-9, 1.8, 0) };
            case 2:
                return { pos: v(0, 4, 10), se: v(0, 1.8, 0) };
            case 3:
                return { pos: v(9, 4, 12), se: v(9, 1.8, 0) };
            case 4:
                return { pos: v(0, 6, 22), se: v(0, 1.8, 0) };
            default:
                return { pos: v(0, 3.4, 7.5), se: v(0, 2.8, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-6.5, 3.4, 8.5), se: v(0, 1.4, 0) };
        case 1:
            return { pos: v(6.5, 3.6, 5.5), se: v(0, 1.2, 0) };
        case 2:
            return { pos: v(0, 3.4, 10), se: v(0, 1.8, -1) };
        default:
            return { pos: v(0, 4.4, 9), se: v(0, 2.2, -6) };
    }
}

/** Beat-klokka og kameraet. Gir tiden i beaten til de andre delene via ref. */
function useBeatKlokke(modus: Modus, beat: number, playing: boolean) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return beatTid;
}

/* ------------------------------------------------------------------ veien */

function Port({ x, lukket, tid }: { x: number; lukket: boolean; tid: React.RefObject<number> }) {
    const venstre = useRef<THREE.Group>(null);
    const hoyre = useRef<THREE.Group>(null);
    const vinkel = useRef(lukket ? 0 : 1.3);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        // Porten lukkes litt ut i beaten, så eleven ser den gå igjen.
        const mal = lukket && (tid.current ?? 0) > 0.6 ? 0 : 1.3;
        vinkel.current = damp(vinkel.current, mal, 3, dt);
        if (venstre.current) venstre.current.rotation.y = vinkel.current;
        if (hoyre.current) hoyre.current.rotation.y = -vinkel.current;
    });
    return (
        <group position={[x, 0, -5]}>
            {/* Mur på hver side */}
            <mesh position={[-4.2, 1.6, 0]}>
                <boxGeometry args={[5, 3.2, 0.8]} />
                <meshStandardMaterial color="#d6c7a8" flatShading />
            </mesh>
            <mesh position={[4.2, 1.6, 0]}>
                <boxGeometry args={[5, 3.2, 0.8]} />
                <meshStandardMaterial color="#d6c7a8" flatShading />
            </mesh>
            {[-1.6, 1.6].map((px) => (
                <mesh key={px} position={[px, 1.9, 0]}>
                    <boxGeometry args={[0.5, 3.8, 0.6]} />
                    <meshStandardMaterial color="#9f1d1d" />
                </mesh>
            ))}
            {/* Tak */}
            <mesh position={[0, 4, 0]}>
                <boxGeometry args={[5, 0.35, 1.6]} />
                <meshStandardMaterial color="#44403c" />
            </mesh>
            <mesh position={[0, 4.45, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[4, 0.5, 1.1]} />
                <meshStandardMaterial color="#57534e" />
            </mesh>
            {/* Dørfløyer som svinger inn */}
            <group ref={venstre} position={[-1.35, 0, 0]}>
                <mesh position={[0.67, 1.7, 0]}>
                    <boxGeometry args={[1.35, 3.4, 0.18]} />
                    <meshStandardMaterial color="#7f1d1d" />
                </mesh>
            </group>
            <group ref={hoyre} position={[1.35, 0, 0]}>
                <mesh position={[-0.67, 1.7, 0]}>
                    <boxGeometry args={[1.35, 3.4, 0.18]} />
                    <meshStandardMaterial color="#7f1d1d" />
                </mesh>
            </group>
        </group>
    );
}

function Veien({ beat, playing }: { beat: number; playing: boolean }) {
    const tid = useBeatKlokke('vei', beat, playing);
    const vandrer = useRef<THREE.Group>(null);
    const [start] = useState(() => vandrerFor(beat, 0));
    const lys = useRef<THREE.DirectionalLight>(null);

    useFrame(() => {
        const t = tid.current;
        const w = vandrerFor(beat, t);
        if (vandrer.current) {
            vandrer.current.position.set(w.x, Math.abs(Math.sin(t * 7)) * 0.06, w.z);
            vandrer.current.rotation.y = w.ry;
        }
        if (lys.current) lys.current.color.set(beat >= 4 ? '#ffb37a' : '#fff4dc');
    });

    const kveld = beat >= 4;
    const hoyder = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => ({
                x: -30 + i * 10 + (i % 2) * 3,
                z: -26 - (i % 3) * 6,
                h: 8 + ((i * 7) % 5) * 2,
            })),
        []
    );

    return (
        <>
            <color attach="background" args={[kveld ? '#f4c79a' : '#e9dcc0']} />
            <fog attach="fog" args={[kveld ? '#f4c79a' : '#e9dcc0', 30, 90]} />
            <ambientLight intensity={0.55} />
            <directionalLight ref={lys} position={[10, 20, 12]} intensity={2} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#b9a77c" />
            </mesh>
            {/* Den støvete veien */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.02, 0.5]}>
                <planeGeometry args={[120, 3.2]} />
                <meshStandardMaterial color="#d9c49a" />
            </mesh>
            {hoyder.map((h, i) => (
                <mesh key={i} position={[h.x, h.h / 2, h.z]}>
                    <coneGeometry args={[7, h.h, 5]} />
                    <meshStandardMaterial color="#8a9a6b" flatShading />
                </mesh>
            ))}
            {PORTER.map((x, i) => (
                <Port key={x} x={x} tid={tid} lukket={beat >= 2 && (i === 0 || beat >= 3)} />
            ))}
            {/* Fyrsten står i porten til den lukkes */}
            {beat === 1 && (
                <group position={[0, 0, -6.2]}>
                    <Figur farge="#ca8a04" hatt="#7c2d12" skala={1.1} />
                </group>
            )}
            <group ref={vandrer} position={[start.x, 0, start.z]}>
                <Figur farge="#e7e0cf" hatt="#292524" />
            </group>

            {beat === 1 && (
                <>
                    <Merke pos={[0.9, 4.2, -6.2]} farge="#ca8a04" tekst="#ffffff">
                        Fyrsten
                    </Merke>
                    <Merke pos={[-1.6, 3.0, -2.4]}>Konfucius</Merke>
                </>
            )}
            {beat === 2 && <Nei pos={[2.4, 4.6, -5]} />}
            {beat === 3 && PORTER.map((x) => <Nei key={x} pos={[x, 5.6, -5]} />)}
        </>
    );
}

/* ------------------------------------------------------------------ hallen */

function Hallrom({ dempet = false }: { dempet?: boolean }) {
    // I bukk-scenen står kameraet inne i hallen, så bare de bakerste søylene står igjen.
    const soyler = useMemo(() => {
        const s: [number, number][] = [];
        for (const z of dempet ? [-4] : [-4, 0, 4, 8]) for (const x of [-5, 5]) s.push([x, z]);
        return s;
    }, [dempet]);
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]}>
                <planeGeometry args={[16, 24]} />
                <meshStandardMaterial color="#5b3a22" />
            </mesh>
            <mesh position={[0, 3.5, -8]}>
                <boxGeometry args={[16, 7, 0.4]} />
                <meshStandardMaterial color={dempet ? '#7f5539' : '#8b5e3c'} />
            </mesh>
            {[-8, 8].map((x) => (
                <mesh key={x} position={[x, 3.5, 2]}>
                    <boxGeometry args={[0.4, 7, 24]} />
                    <meshStandardMaterial color="#8b5e3c" />
                </mesh>
            ))}
            {soyler.map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 3, z]}>
                    <cylinderGeometry args={[0.32, 0.36, 6, 12]} />
                    <meshStandardMaterial color="#a61b1b" />
                </mesh>
            ))}
            {/* Takbjelker */}
            {[-4, 0, 4, 8].map((z) => (
                <mesh key={z} position={[0, 6.1, z]}>
                    <boxGeometry args={[11, 0.35, 0.4]} />
                    <meshStandardMaterial color="#3f2a1c" />
                </mesh>
            ))}
        </>
    );
}

/** Alterbordet med minnetavler for de døde i slekta. Tavlene lyser når de blir æret. */
function Alter({ lys }: { lys: number }) {
    const tavler = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const glod = useRef(0);
    const rok = useRef<THREE.Group>(null);
    useFrame((state, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        glod.current = damp(glod.current, lys, 2, dt);
        tavler.current.forEach((m) => {
            if (m) m.emissiveIntensity = glod.current * 0.9;
        });
        if (rok.current) {
            rok.current.visible = lys > 0;
            rok.current.children.forEach((c, i) => {
                const f = (state.clock.elapsedTime * 0.35 + i / 6) % 1;
                c.position.set(Math.sin(f * 9 + i) * 0.15, 1.6 + f * 2.2, 0);
                c.scale.setScalar(0.08 + f * 0.18);
            });
        }
    });
    return (
        <group position={[0, 0, -6.4]}>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[6, 1.2, 1.6]} />
                <meshStandardMaterial color="#3f2a1c" />
            </mesh>
            <mesh position={[0, 1.6, -0.5]}>
                <boxGeometry args={[6, 0.8, 0.6]} />
                <meshStandardMaterial color="#3f2a1c" />
            </mesh>
            {[-2.2, -1.1, 0, 1.1, 2.2].map((x, i) => (
                <mesh key={x} position={[x, i === 2 ? 2.75 : 2.6, -0.5]}>
                    <boxGeometry args={[0.55, i === 2 ? 1.5 : 1.2, 0.12]} />
                    <meshStandardMaterial
                        ref={(m) => {
                            tavler.current[i] = m;
                        }}
                        color="#b45309"
                        emissive="#fbbf24"
                        emissiveIntensity={0}
                    />
                </mesh>
            ))}
            {/* Røkelseskar */}
            <mesh position={[0, 1.35, 0.3]}>
                <cylinderGeometry args={[0.35, 0.28, 0.3, 14]} />
                <meshStandardMaterial color="#78716c" />
            </mesh>
            <group ref={rok} position={[0, 0, 0.3]}>
                {Array.from({ length: 6 }, (_, i) => (
                    <mesh key={i}>
                        <sphereGeometry args={[1, 8, 6]} />
                        <meshBasicMaterial color="#e7e5e4" transparent opacity={0.5} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

function Hallen({ beat, playing }: { beat: number; playing: boolean }) {
    useBeatKlokke('hall', beat, playing);
    return (
        <>
            <color attach="background" args={['#2a1b12']} />
            <fog attach="fog" args={['#2a1b12', 18, 40]} />
            <ambientLight intensity={0.6} />
            <pointLight position={[0, 5, -3]} intensity={30} color="#ffd7a1" />
            <directionalLight position={[4, 10, 12]} intensity={1.1} />
            <Hallrom />
            <Alter lys={beat >= 3 ? 1 : 0} />
            {/* Plassen midt i hallen er tom: ingen gudestatue */}
            <mesh position={[0, 0.25, -3.2]}>
                <cylinderGeometry args={[0.9, 1, 0.5, 20]} />
                <meshStandardMaterial color="#78716c" />
            </mesh>
            {beat >= 3 &&
                [-1.4, 0, 1.4].map((x, i) => (
                    <group key={x} position={[x, 0, -1.6]} rotation={[0, Math.PI, 0]}>
                        <Figur
                            farge={['#1e3a8a', '#7c2d12', '#365314'][i]}
                            skala={i === 1 ? 0.75 : 0.95}
                        />
                    </group>
                ))}
            {(beat === 1 || beat === 2) && (
                <Merke pos={[0, 1.4, -3.2]} farge="#1c1917" tekst="#fde68a">
                    Ingen gud her
                </Merke>
            )}
            {beat === 3 && (
                <Merke pos={[-3.6, 3.4, -6.4]} farge="#b45309" tekst="#ffffff">
                    Til de døde i slekta
                </Merke>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ båndene */

interface Par {
    x: number;
    over: string;
    under: string;
    oppe: string;
    nede: string;
    likt?: boolean;
    vises: number;
}

const PAR: Par[] = [
    { x: -12, over: 'Foreldre', under: 'og barn', oppe: '#9a3412', nede: '#f59e0b', vises: 1 },
    { x: -6, over: 'Eldre søsken', under: 'og yngre', oppe: '#1d4ed8', nede: '#60a5fa', vises: 1 },
    { x: 0, over: 'Fyrste', under: 'og undersått', oppe: '#ca8a04', nede: '#78716c', vises: 2 },
    { x: 6, over: 'Ektemann', under: 'og kone', oppe: '#0f766e', nede: '#be185d', vises: 3 },
    {
        x: 12,
        over: 'Venner',
        under: 'like høyt',
        oppe: '#7c3aed',
        nede: '#7c3aed',
        likt: true,
        vises: 3,
    },
];

/** En pil mellom to punkter som vokser fram. */
function Pil({
    fra,
    til,
    farge,
    synlig,
}: {
    fra: THREE.Vector3;
    til: THREE.Vector3;
    farge: string;
    synlig: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const s = useRef(0);
    const { midt, kvat, lengde } = useMemo(() => {
        const d = til.clone().sub(fra);
        return {
            midt: fra.clone().add(til).multiplyScalar(0.5),
            kvat: new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), d.clone().normalize()),
            lengde: d.length(),
        };
    }, [fra, til]);
    useFrame((_, rawDt) => {
        s.current = damp(s.current, synlig ? 1 : 0, 3, Math.min(rawDt, 0.05));
        if (ref.current) {
            ref.current.scale.setScalar(Math.max(s.current, 0.001));
            ref.current.visible = s.current > 0.02;
        }
    });
    return (
        <group ref={ref} position={midt} quaternion={kvat}>
            <mesh>
                <cylinderGeometry args={[0.14, 0.14, lengde - 0.5, 8]} />
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.35} />
            </mesh>
            <mesh position={[0, lengde / 2 - 0.2, 0]}>
                <coneGeometry args={[0.4, 0.6, 12]} />
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.35} />
            </mesh>
        </group>
    );
}

function Baandene({ beat, playing }: { beat: number; playing: boolean }) {
    const tid = useBeatKlokke('band', beat, playing);
    const [tilbake, setTilbake] = useState(false);
    useFrame(() => {
        // Pila tilbake kommer litt ut i beat 4, når stemmen sier «begge veier».
        const vis = beat >= 5 || (beat === 4 && tid.current > 2.2);
        if (vis !== tilbake) setTilbake(vis);
    });
    return (
        <>
            <color attach="background" args={['#e8eef0']} />
            <fog attach="fog" args={['#e8eef0', 30, 70]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[6, 14, 10]} intensity={2} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial color="#a8b59a" />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[30, 0.3, 6]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
            {PAR.map((p) => {
                const aktiv = beat >= p.vises || beat === 0;
                const hoy = p.likt ? 0 : 0.6;
                const oppe = v(p.x - 1.1, 0.3 + hoy, 0);
                const nede = v(p.x + 1.1, 0.3, 0);
                const hodeOppe = oppe.clone().add(v(0, 2.3, 0));
                const hodeNede = nede.clone().add(v(0, 2.3, 0));
                const opp = beat >= 4;
                const fremhevet = beat !== 5 || p.x === 0;
                return (
                    <group key={p.x}>
                        {!p.likt && (
                            <mesh position={[oppe.x, 0.3 + hoy / 2, 0]}>
                                <boxGeometry args={[1.6, hoy, 1.6]} />
                                <meshStandardMaterial color="#a8a29e" />
                            </mesh>
                        )}
                        <group position={oppe}>
                            <Figur farge={aktiv ? p.oppe : '#cbd5e1'} />
                        </group>
                        <group position={nede}>
                            <Figur
                                farge={aktiv ? p.nede : '#cbd5e1'}
                                skala={p.over === 'Foreldre' ? 0.75 : 1}
                            />
                        </group>
                        <Pil
                            fra={hodeNede.clone().add(v(0, 0.2, 0.7))}
                            til={hodeOppe.clone().add(v(0, 0.2, 0.7))}
                            farge="#d97706"
                            synlig={opp && fremhevet}
                        />
                        <Pil
                            fra={hodeOppe.clone().add(v(0, 1, 0.7))}
                            til={hodeNede.clone().add(v(0, 1, 0.7))}
                            farge="#0d9488"
                            synlig={tilbake && fremhevet}
                        />
                    </group>
                );
            })}
            {(beat >= 1 && beat <= 3
                ? PAR.filter((p) => p.vises === beat)
                : beat === 0 || beat === 4
                  ? PAR
                  : []
            ).map((p, i) => (
                <Merke
                    key={p.x}
                    pos={[p.x, -0.6 - (beat === 0 || beat === 4 ? (i % 2) * 1.1 : 0), 1.2]}
                >
                    <div>{p.over}</div>
                    <div className="text-xl font-semibold text-stone-600">{p.under}</div>
                </Merke>
            ))}
            {beat === 5 && (
                <>
                    <Merke pos={[3.2, 3.9, 0.7]} farge="#0d9488" tekst="#ffffff">
                        Ned: styre rettferdig
                    </Merke>
                    <Merke pos={[0, 1.8, 1.6]} farge="#d97706" tekst="#ffffff">
                        Opp: troskap
                    </Merke>
                </>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ bukket */

const RADER = [0, 1, 2].flatMap((r) =>
    [-3.2, -1.6, 0, 1.6, 3.2].map((x) => ({ x: x + (r % 2) * 0.4, z: 2 - r * 2 }))
);

function Bukket({ beat, playing }: { beat: number; playing: boolean }) {
    const tid = useBeatKlokke('bukk', beat, playing);
    const ryggene = useRef<(THREE.Group | null)[]>([]);
    const vinkel = useRef(0);
    const glod = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        const t = tid.current;
        // Beat 0: bare den fremste til venstre bøyer seg. Beat 1: hele rekka, i takt.
        const mal = beat === 1 && t > 0.6 ? 0.75 : 0;
        vinkel.current = damp(vinkel.current, mal, 4, dt);
        ryggene.current.forEach((g, i) => {
            if (!g) return;
            const forste = i === 0 && beat === 0 && t > 0.8;
            g.rotation.x = forste ? 0.75 : vinkel.current;
        });
        glod.current.forEach((m) => {
            if (m) m.emissiveIntensity = damp(m.emissiveIntensity, beat === 2 ? 0.45 : 0, 2, dt);
        });
    });
    return (
        <>
            <color attach="background" args={['#2a1b12']} />
            <fog attach="fog" args={['#2a1b12', 16, 38]} />
            <ambientLight intensity={0.65} />
            <pointLight position={[0, 5, -1]} intensity={28} color="#ffd7a1" />
            <directionalLight position={[4, 10, 12]} intensity={1.1} />
            <Hallrom dempet />
            {/* Herskerens forhøyning ved bakveggen */}
            <mesh position={[0, 0.4, -6.4]}>
                <boxGeometry args={[4, 0.8, 2]} />
                <meshStandardMaterial color="#3f2a1c" />
            </mesh>
            <group position={[0, 0.8, -6.4]}>
                <Figur farge={beat >= 3 ? '#ca8a04' : '#78716c'} hatt="#7c2d12" skala={1.15} />
            </group>
            {RADER.map((p, i) => (
                <group key={i} position={[p.x, 0, p.z]} rotation={[0, Math.PI, 0]}>
                    <BukkFigur
                        settKappe={(m) => {
                            glod.current[i] = m;
                        }}
                        settRygg={(g) => {
                            ryggene.current[i] = g;
                        }}
                    />
                </group>
            ))}
            {beat === 3 && (
                <Merke pos={[0, 4.6, -6.4]} farge="#ca8a04" tekst="#ffffff">
                    Herskeren
                </Merke>
            )}
        </>
    );
}

/** Embetsmann i blå kappe som kan bøye seg. Ryggen og stoffet ligger i ref-lister. */
function BukkFigur({
    settKappe,
    settRygg,
}: {
    settKappe: (m: THREE.MeshStandardMaterial | null) => void;
    settRygg: (g: THREE.Group | null) => void;
}) {
    const farge = '#1e3a8a';
    return (
        <group>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.42, 0.62, 1, 12]} />
                <meshStandardMaterial
                    ref={settKappe}
                    color={farge}
                    emissive="#fbbf24"
                    emissiveIntensity={0}
                    flatShading
                />
            </mesh>
            <group ref={settRygg} position={[0, 1, 0]}>
                <mesh position={[0, 0.45, 0]}>
                    <cylinderGeometry args={[0.32, 0.42, 0.9, 12]} />
                    <meshStandardMaterial color={farge} flatShading />
                </mesh>
                <mesh position={[0, 1.15, 0]}>
                    <sphereGeometry args={[0.28, 14, 10]} />
                    <meshStandardMaterial color="#e7c9a0" />
                </mesh>
                <mesh position={[0, 1.45, 0]}>
                    <boxGeometry args={[0.5, 0.16, 0.3]} />
                    <meshStandardMaterial color="#1c1917" />
                </mesh>
            </group>
        </group>
    );
}

/* ------------------------------------------------------------------ DOM over lerretet */

function Kort({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className={`px-6 py-4 rounded-2xl shadow-xl bg-[#fbf6ea]/95 text-stone-900 ${className}`}
        >
            {children}
        </motion.div>
    );
}

function Tekstlag({ modus, beat }: { modus: Modus; beat: number }) {
    return (
        <AnimatePresence>
            {modus === 'vei' && beat === 1 && (
                <motion.div key="plan" className="absolute left-[4%] bottom-[8%]">
                    <Kort>
                        <div className="text-2xl font-black text-red-800">Planen</div>
                        <div className="text-2xl font-semibold">fra krig til fred</div>
                    </Kort>
                </motion.div>
            )}
            {modus === 'vei' && beat === 4 && (
                <motion.div
                    key="slutt"
                    className="absolute inset-x-0 bottom-[8%] flex justify-center"
                >
                    <Kort className="text-center">
                        <div className="text-3xl font-black">Ingen fyrste prøvde læren</div>
                        <div className="text-2xl font-semibold text-stone-600">mens han levde</div>
                    </Kort>
                </motion.div>
            )}
            {modus === 'hall' && beat === 1 && (
                <motion.div
                    key="ingen"
                    className="absolute right-[4%] bottom-[10%] flex flex-col gap-3"
                >
                    {['Ingen skapergud i sentrum', 'Ingen hellig bok fra himmelen'].map((t, i) => (
                        <motion.div
                            key={t}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 1.2 }}
                            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#fbf6ea]/95 shadow-xl text-2xl font-black text-stone-900"
                        >
                            <X className="w-8 h-8 text-red-600" strokeWidth={4} /> {t}
                        </motion.div>
                    ))}
                </motion.div>
            )}
            {modus === 'hall' && beat === 2 && (
                <motion.div
                    key="spm"
                    className="absolute right-[4%] bottom-[10%] flex flex-col gap-3"
                >
                    <Kort>
                        <div className="text-xl font-semibold text-stone-600">
                            Det store spørsmålet:
                        </div>
                        <div className="text-3xl font-black">Hva er et godt menneske?</div>
                    </Kort>
                </motion.div>
            )}
            {modus === 'hall' && beat === 4 && (
                <motion.div
                    key="filo"
                    className="absolute inset-x-0 bottom-[8%] flex justify-center"
                >
                    <Kort className="text-center">
                        <div className="text-xl font-semibold text-stone-600">
                            De fleste forskere:
                        </div>
                        <div className="text-3xl font-black">
                            En filosofi <span className="text-amber-700">med religiøse trekk</span>
                        </div>
                    </Kort>
                </motion.div>
            )}
            {modus === 'band' && beat === 4 && (
                <motion.div
                    key="begge"
                    className="absolute inset-x-0 top-[19%] flex justify-center gap-3"
                >
                    <Kort>
                        <div className="text-2xl font-black text-amber-700">Opp: lydighet</div>
                    </Kort>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.4 }}
                        className="px-6 py-4 rounded-2xl shadow-xl bg-[#fbf6ea]/95"
                    >
                        <div className="text-2xl font-black text-teal-700">Ned: plikt tilbake</div>
                    </motion.div>
                </motion.div>
            )}
            {modus === 'band' && beat === 5 && (
                <motion.div
                    key="misbruk"
                    className="absolute inset-x-0 bottom-[7%] flex justify-center"
                >
                    <Kort className="text-center">
                        <div className="text-2xl font-black">
                            Plikt begge veier hindrer misbruk av makt
                        </div>
                        <div className="text-xl font-semibold text-stone-600">mente Konfucius</div>
                    </Kort>
                </motion.div>
            )}
            {modus === 'bukk' && beat === 0 && (
                <motion.div
                    key="hvordan"
                    className="absolute right-[4%] bottom-[10%] flex flex-col gap-3"
                >
                    {['Hvordan bøyer du deg?', 'Hvem snakker først?'].map((t, i) => (
                        <motion.div
                            key={t}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 1 }}
                            className="px-5 py-3 rounded-2xl bg-[#fbf6ea]/95 shadow-xl text-2xl font-black text-stone-900"
                        >
                            {t}
                        </motion.div>
                    ))}
                </motion.div>
            )}
            {modus === 'bukk' && beat === 2 && (
                <motion.div
                    key="ove"
                    className="absolute inset-x-0 bottom-[8%] flex justify-center"
                >
                    <Kort className="text-center">
                        <div className="text-3xl font-black">
                            Øve på riktig oppførsel <span className="text-amber-700">→</span> nye
                            følelser og tanker
                        </div>
                    </Kort>
                </motion.div>
            )}
            {modus === 'bukk' && beat === 3 && (
                <motion.div
                    key="plikt"
                    className="absolute inset-x-0 bottom-[8%] flex justify-center"
                >
                    <Kort className="text-center">
                        <div className="text-xl font-semibold text-stone-600">
                            Herskerens plikt:
                        </div>
                        <div className="text-3xl font-black">gi folket opplæring</div>
                    </Kort>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function KonfusianismeVeien({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'vei';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 4, 16] }}
            >
                {modus === 'vei' && <Veien beat={beat} playing={playing} />}
                {modus === 'hall' && <Hallen beat={beat} playing={playing} />}
                {modus === 'band' && <Baandene beat={beat} playing={playing} />}
                {modus === 'bukk' && <Bukket beat={beat} playing={playing} />}
            </Canvas>
            <Overskrift
                tekst={liste[Math.min(beat, liste.length - 1)]}
                mork={modus === 'hall' || modus === 'bukk'}
            />
            <Tekstlag modus={modus} beat={beat} />
        </div>
    );
}
