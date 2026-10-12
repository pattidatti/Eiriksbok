import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, lerretTekstur, tegnChile, tegnUsa, useKamera, v } from './felles3d';

/**
 * Kobbergruva i Chile: et dagbrudd i trapper der lastebiler kjører i ring, en vei til havna
 * og en liten by. Kobberet går som oransje kasser enten til skipet (ut av landet) eller til byen.
 * «gruve»: amerikansk flagg, kasser til skipet som seiler til USA.
 * «deling»: flagget byttes til Chiles, kassene går til byen, skole og sykehus reiser seg.
 * «stille»: alt stopper opp. Grå himmel, ingen lastebiler i bevegelse, ingen skip.
 * «privat»: skipet kommer tilbake, flagget blir amerikansk igjen, og byen får SOLGT-skilt.
 */

type Modus = 'gruve' | 'deling' | 'stille' | 'privat';

const TRAPPER = [17, 14, 11, 8, 5.5];
const TRINN = 1.7;
const KAI_X = 44;
const SKIP_INNE = 52;
const SKIP_UTE = 105;
const KASSER = 10;
const BY_X = -38;

function usaFlagg(modus: Modus, beat: number) {
    if (modus === 'gruve') return true;
    if (modus === 'deling') return beat <= 1;
    if (modus === 'privat') return false;
    return false;
}
function skipInne(modus: Modus, beat: number) {
    if (modus === 'gruve') return beat <= 2;
    if (modus === 'privat') return beat >= 0;
    return false;
}
/** Hvor kobberet går: til havna, til byen eller ingen steder. */
function flyt(modus: Modus, beat: number): 'hav' | 'by' | 'stopp' {
    if (modus === 'stille') return 'stopp';
    if (modus === 'deling') return beat >= 3 ? 'by' : beat === 2 ? 'stopp' : 'hav';
    return 'hav';
}
function byVises(modus: Modus, beat: number) {
    if (modus === 'gruve') return false;
    if (modus === 'deling') return beat >= 3;
    return true;
}

function kamera(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'gruve') {
            switch (beat) {
                case 0:
                    return { pos: v(-14 + t * 0.4, 16, 34), se: v(0, -4, 0) };
                case 1:
                    return { pos: v(3, 3, 5), se: v(-8, -7, -5) };
                case 2:
                    return { pos: v(34, 7, 12), se: v(21, 4, -6) };
                case 3:
                    return { pos: v(36 + t * 0.8, 9, 26), se: v(62 + t * 1.2, 1, 2) };
                default:
                    return { pos: v(-6, 46, 62), se: v(8, -2, 0) };
            }
        }
        if (modus === 'deling') {
            switch (beat) {
                case 0:
                case 1:
                    return { pos: v(-10 + t * 0.3, 15, 36), se: v(2, -3, 0) };
                case 2:
                    return { pos: v(34, 7, 12), se: v(21, 4, -6) };
                default:
                    return { pos: v(-20, 18, 34), se: v(-30, 0, -4) };
            }
        }
        if (modus === 'stille') {
            switch (beat) {
                case 0:
                    return { pos: v(4, 5, 8), se: v(-8, -7, -5) };
                case 1:
                    return { pos: v(-6, 46, 62 + t * 0.4), se: v(4, -2, 0) };
                default:
                    return { pos: v(-30 + t * 0.4, 20, 44), se: v(0, -2, 0) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(30, 12, 32), se: v(50, 0, 0) };
            case 1:
            case 2:
                return { pos: v(-6, 46 + t * 0.3, 62), se: v(4, -2, 0) };
            case 3:
                return { pos: v(34, 7, 12), se: v(21, 4, -6) };
            default:
                return { pos: v(-22, 16, 30), se: v(-36, 1, -4) };
        }
    };
}

/** Flaggstang med to flagg som byttes ved å skaleres inn og ut. */
function Flagg({
    usa,
    playing,
    størrelse = 1,
}: {
    usa: boolean;
    playing: boolean;
    størrelse?: number;
}) {
    const tekUsa = useMemo(() => lerretTekstur(300, 180, tegnUsa), []);
    const tekChile = useMemo(() => lerretTekstur(300, 180, tegnChile), []);
    useEffect(
        () => () => {
            tekUsa.dispose();
            tekChile.dispose();
        },
        [tekUsa, tekChile]
    );
    const a = useRef<THREE.Mesh>(null);
    const b = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        for (const [m, på] of [
            [a.current, usa],
            [b.current, !usa],
        ] as const) {
            if (!m) continue;
            const s = forste.current
                ? på
                    ? 1
                    : 0.001
                : damp(m.scale.y, på ? 1 : 0.001, 4, dt || 0.016);
            m.scale.set(1, s, 1);
            m.visible = s > 0.02;
            m.rotation.y = Math.sin(tid.current * 2) * 0.15;
        }
        forste.current = false;
    });
    return (
        <group scale={størrelse}>
            <mesh position={[0, 3.5, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 7, 8]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            {[
                [a, tekUsa],
                [b, tekChile],
            ].map(([ref, tek], i) => (
                <mesh key={i} ref={ref as RefObject<THREE.Mesh>} position={[1.3, 6.2, 0]}>
                    <planeGeometry args={[2.6, 1.56]} />
                    <meshStandardMaterial
                        map={tek as THREE.Texture}
                        side={THREE.DoubleSide}
                        emissive="#ffffff"
                        emissiveMap={tek as THREE.Texture}
                        emissiveIntensity={0.35}
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Dagbruddet: trapper ned i bakken, laget av ringer og åpne sylindere. */
function Dagbrudd({ grå }: { grå: boolean }) {
    const jord = grå ? '#a8998a' : '#c98c5a';
    const vegg = grå ? '#8f8173' : '#a86a3d';
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[TRAPPER[0], 140, 48, 1]} />
                <meshStandardMaterial
                    color={grå ? '#b9ad9f' : '#dcb07c'}
                    emissive="#5c3b1e"
                    emissiveIntensity={0.12}
                />
            </mesh>
            {TRAPPER.map((r, i) => {
                const y = -i * TRINN;
                const indre = TRAPPER[i + 1];
                return (
                    <group key={i}>
                        <mesh position={[0, y - TRINN / 2, 0]}>
                            <cylinderGeometry args={[r, r, TRINN, 40, 1, true]} />
                            <meshStandardMaterial color={vegg} side={THREE.BackSide} flatShading />
                        </mesh>
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y - TRINN, 0]}>
                            {indre ? (
                                <ringGeometry args={[indre, r, 40, 1]} />
                            ) : (
                                <circleGeometry args={[r, 40]} />
                            )}
                            <meshStandardMaterial
                                color={jord}
                                emissive="#5c3b1e"
                                emissiveIntensity={0.12}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    </group>
                );
            })}
            {/* Kobberårer: grønne flekker i veggen */}
            {[0.4, 1.9, 3.3, 4.6, 5.6].map((a, i) => {
                const r = TRAPPER[(i % 3) + 1] - 0.05;
                return (
                    <mesh
                        key={i}
                        position={[Math.cos(a) * r, -(i % 3) * TRINN - 2.5, Math.sin(a) * r]}
                        rotation={[0, -a + Math.PI / 2, 0]}
                    >
                        <boxGeometry args={[2.6, 0.9, 0.3]} />
                        <meshStandardMaterial
                            color="#2bb39a"
                            emissive="#0f766e"
                            emissiveIntensity={0.5}
                            flatShading
                        />
                    </mesh>
                );
            })}
        </>
    );
}

/** En gul gruvebil som kjører i ring på sin trapp. Den stopper når gruva står stille. */
function Lastebil({
    trapp,
    fase,
    går,
    playing,
}: {
    trapp: number;
    fase: number;
    går: boolean;
    playing: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const vinkel = useRef(fase);
    const fart = useRef(går ? 1 : 0);
    const r = (TRAPPER[trapp] + TRAPPER[trapp + 1]) / 2;
    const y = -trapp * TRINN - TRINN;
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        fart.current = damp(fart.current, går ? 1 : 0, 1.4, dt);
        vinkel.current += (dt * 0.22 * fart.current * 12) / r;
        const g = ref.current;
        if (!g) return;
        g.position.set(Math.cos(vinkel.current) * r, y, Math.sin(vinkel.current) * r);
        g.rotation.y = -vinkel.current;
    });
    return (
        <group ref={ref}>
            <mesh position={[0, 0.7, 0]}>
                <boxGeometry args={[1.3, 0.8, 2.6]} />
                <meshStandardMaterial
                    color="#facc15"
                    emissive="#a16207"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 1.3, -0.3]}>
                <boxGeometry args={[1.25, 0.5, 1.6]} />
                <meshStandardMaterial
                    color="#c2410c"
                    emissive="#7c2d12"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 1.25, 1]}>
                <boxGeometry args={[1.1, 0.6, 0.6]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
        </group>
    );
}

/** Kobberet som oransje kasser på vei til havna eller byen. */
function Kasser({ retning, playing }: { retning: 'hav' | 'by' | 'stopp'; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const fart = useRef(retning === 'stopp' ? 0 : 1);
    const synlig = useRef(retning === 'stopp' ? 0 : 1);
    const forskyv = useRef(0);
    const sist = useRef<'hav' | 'by'>(retning === 'by' ? 'by' : 'hav');
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (retning !== 'stopp') sist.current = retning;
        fart.current = damp(fart.current, retning === 'stopp' ? 0 : 1, 1.5, dt);
        synlig.current = damp(synlig.current, retning === 'stopp' ? 0.0 : 1, 0.8, dt);
        forskyv.current += dt * 0.09 * fart.current;
        const im = ref.current;
        if (!im) return;
        const [fra, til] =
            sist.current === 'hav' ? [TRAPPER[0] + 1, KAI_X] : [-TRAPPER[0] - 1, BY_X + 6];
        for (let i = 0; i < KASSER; i++) {
            const u = (i / KASSER + forskyv.current) % 1;
            const s = 0.05 + 0.95 * synlig.current;
            m.makeScale(s, s, s).setPosition(fra + u * (til - fra), 0.75, 2);
            im.setMatrixAt(i, m);
        }
        im.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, KASSER]}>
            <boxGeometry args={[1.4, 1.1, 1.4]} />
            <meshStandardMaterial
                color="#ea7a2b"
                emissive="#9a3412"
                emissiveIntensity={0.45}
                flatShading
            />
        </instancedMesh>
    );
}

function Skip({ inne, playing }: { inne: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const g = ref.current;
        if (!g) return;
        const mål = inne ? SKIP_INNE : SKIP_UTE;
        g.position.x = forste.current ? mål : damp(g.position.x, mål, 0.35, dt);
        forste.current = false;
        g.position.y = Math.sin(tid.current * 0.9) * 0.08;
    });
    return (
        <group ref={ref} position={[SKIP_INNE, 0, 2]} rotation={[0, Math.PI / 2, 0]}>
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[4.4, 2.2, 20]} />
                <meshStandardMaterial
                    color="#1e3a8a"
                    emissive="#172554"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
            {[-4, 1].map((z) => (
                <mesh key={z} position={[0, 2.6, z]}>
                    <boxGeometry args={[3, 1.3, 3.4]} />
                    <meshStandardMaterial
                        color="#ea7a2b"
                        emissive="#9a3412"
                        emissiveIntensity={0.4}
                        flatShading
                    />
                </mesh>
            ))}
            <mesh position={[0, 3.6, -8]}>
                <boxGeometry args={[3.6, 3, 3]} />
                <meshStandardMaterial
                    color="#f8fafc"
                    emissive="#94a3b8"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
            <group position={[0, 2.1, 8.6]} rotation={[0, -Math.PI / 2, 0]}>
                <Flagg usa playing={playing} størrelse={0.6} />
            </group>
        </group>
    );
}

/** Et lite bygg som vokser opp av bakken når byen skal vises. */
function Bygg({
    vis,
    playing,
    forsinkelse,
    children,
    pos,
}: {
    vis: boolean;
    playing: boolean;
    forsinkelse: number;
    children: ReactNode;
    pos: [number, number, number];
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current = vis ? tid.current + dt : 0;
        const g = ref.current;
        if (!g) return;
        const mål = vis && (forste.current || tid.current > forsinkelse) ? 1 : 0.001;
        const s = forste.current ? mål : damp(g.scale.y, mål, 3, dt);
        forste.current = false;
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={pos}>
            {children}
        </group>
    );
}

/** Rødt SOLGT-skilt over et bygg. */
function Solgt({ vis, playing, høyde }: { vis: boolean; playing: boolean; høyde: number }) {
    const tek = useMemo(
        () =>
            lerretTekstur(256, 96, (g) => {
                g.fillStyle = '#b91c1c';
                g.fillRect(0, 0, 256, 96);
                g.fillStyle = '#ffffff';
                g.font = 'bold 64px sans-serif';
                g.textAlign = 'center';
                g.textBaseline = 'middle';
                g.fillText('SOLGT', 128, 52);
            }),
        []
    );
    useEffect(() => () => tek.dispose(), [tek]);
    return (
        <Bygg vis={vis} playing={playing} forsinkelse={0.6} pos={[0, høyde, 0]}>
            <mesh position={[0, 1.4, 0]}>
                <planeGeometry args={[4.2, 1.6]} />
                <meshStandardMaterial
                    map={tek}
                    emissive="#ffffff"
                    emissiveMap={tek}
                    emissiveIntensity={0.5}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 1.2, 6]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
        </Bygg>
    );
}

function Byen({ vis, solgt, playing }: { vis: boolean; solgt: boolean; playing: boolean }) {
    return (
        <group position={[BY_X, 0, -4]} rotation={[0, 0.5, 0]}>
            {/* Skolen */}
            <Bygg vis={vis} playing={playing} forsinkelse={0.2} pos={[0, 0, 0]}>
                <mesh position={[0, 1.8, 0]}>
                    <boxGeometry args={[8, 3.6, 4]} />
                    <meshStandardMaterial
                        color="#fde68a"
                        emissive="#92400e"
                        emissiveIntensity={0.15}
                        flatShading
                    />
                </mesh>
                <mesh position={[0, 4.1, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 2.7]}>
                    <boxGeometry args={[1.6, 1.6, 1.6]} />
                    <meshStandardMaterial color="#b45309" flatShading />
                </mesh>
                <Solgt vis={solgt} playing={playing} høyde={5} />
            </Bygg>
            {/* Sykehuset */}
            <Bygg vis={vis} playing={playing} forsinkelse={0.9} pos={[-2, 0, 9]}>
                <mesh position={[0, 2.6, 0]}>
                    <boxGeometry args={[6, 5.2, 5]} />
                    <meshStandardMaterial
                        color="#f8fafc"
                        emissive="#94a3b8"
                        emissiveIntensity={0.25}
                        flatShading
                    />
                </mesh>
                <mesh position={[0, 3.6, 2.52]}>
                    <boxGeometry args={[2, 0.6, 0.05]} />
                    <meshStandardMaterial
                        color="#dc2626"
                        emissive="#dc2626"
                        emissiveIntensity={0.4}
                    />
                </mesh>
                <mesh position={[0, 3.6, 2.52]}>
                    <boxGeometry args={[0.6, 2, 0.05]} />
                    <meshStandardMaterial
                        color="#dc2626"
                        emissive="#dc2626"
                        emissiveIntensity={0.4}
                    />
                </mesh>
                <Solgt vis={solgt} playing={playing} høyde={5.4} />
            </Bygg>
            {/* Vanntårnet */}
            <Bygg vis={vis} playing={playing} forsinkelse={1.5} pos={[9, 0, 6]}>
                <mesh position={[0, 2.5, 0]}>
                    <cylinderGeometry args={[0.35, 0.5, 5, 8]} />
                    <meshStandardMaterial color="#64748b" />
                </mesh>
                <mesh position={[0, 6, 0]}>
                    <cylinderGeometry args={[2, 1.6, 2.4, 14]} />
                    <meshStandardMaterial
                        color="#38bdf8"
                        emissive="#0369a1"
                        emissiveIntensity={0.35}
                        flatShading
                    />
                </mesh>
                <Solgt vis={solgt} playing={playing} høyde={7.3} />
            </Bygg>
            {/* Boliger */}
            {[
                [-9, 2],
                [-8, -4],
                [6, -6],
                [11, -1],
            ].map(([x, z], i) => (
                <Bygg
                    key={i}
                    vis={vis}
                    playing={playing}
                    forsinkelse={0.5 + i * 0.3}
                    pos={[x, 0, z]}
                >
                    <mesh position={[0, 1.3, 0]}>
                        <boxGeometry args={[3, 2.6, 3]} />
                        <meshStandardMaterial
                            color={['#fecaca', '#bfdbfe', '#bbf7d0', '#fed7aa'][i]}
                            flatShading
                        />
                    </mesh>
                    <mesh position={[0, 3, 0]} rotation={[0, Math.PI / 4, 0]}>
                        <coneGeometry args={[2.4, 1.6, 4]} />
                        <meshStandardMaterial color="#9a3412" flatShading />
                    </mesh>
                </Bygg>
            ))}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kam = useMemo(() => kamera(modus), [modus]);
    useKamera(kam, beat, playing);
    const grå = modus === 'stille';
    const himmel = grå ? '#c9cdd2' : '#d6e9f6';
    const går = !grå;
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 60, 170]} />
            <ambientLight intensity={grå ? 0.7 : 0.85} />
            <hemisphereLight args={['#fff7e6', '#b07a4a', 0.7]} />
            <directionalLight
                position={[-25, 40, 25]}
                intensity={grå ? 0.8 : 1.3}
                color="#fff1d6"
            />
            <Dagbrudd grå={grå} />
            {/* Fjellene i bakgrunnen */}
            {[
                [-40, -60, 16],
                [-5, -70, 20],
                [30, -62, 14],
                [-70, -40, 13],
            ].map(([x, z, r], i) => (
                <mesh key={i} position={[x, r * 0.3, z]}>
                    <coneGeometry args={[r * 1.4, r * 1.6, 7]} />
                    <meshStandardMaterial color={grå ? '#9ca3af' : '#b98b62'} flatShading />
                </mesh>
            ))}
            {/* Havet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[KAI_X + 70, 0.05, 0]}>
                <planeGeometry args={[136, 200]} />
                <meshStandardMaterial color="#2f7fbf" emissive="#1e5f91" emissiveIntensity={0.5} />
            </mesh>
            {/* Veien og kaia */}
            <mesh position={[(TRAPPER[0] + KAI_X) / 2, 0.06, 2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[KAI_X - TRAPPER[0], 3]} />
                <meshStandardMaterial color="#78716c" />
            </mesh>
            <mesh
                position={[(-TRAPPER[0] + BY_X + 6) / 2, 0.06, 2]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[-TRAPPER[0] - BY_X - 6, 3]} />
                <meshStandardMaterial color="#78716c" />
            </mesh>
            <mesh position={[KAI_X + 1.5, 0.5, 2]}>
                <boxGeometry args={[3, 1, 14]} />
                <meshStandardMaterial color="#9ca3af" flatShading />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
                <Lastebil key={i} trapp={i % 4} fase={i * 1.7} går={går} playing={playing} />
            ))}
            <group position={[21, 0, -6]}>
                <Flagg usa={usaFlagg(modus, beat)} playing={playing} />
                <group position={[0, 3.2, 1]}>
                    <Solgt vis={modus === 'privat' && beat >= 3} playing={playing} høyde={0} />
                </group>
            </group>
            <Kasser retning={flyt(modus, beat)} playing={playing} />
            <Skip inne={skipInne(modus, beat)} playing={playing} />
            <Byen
                vis={byVises(modus, beat)}
                solgt={modus === 'privat' && beat >= 4}
                playing={playing}
            />
        </>
    );
}

const TEKST: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    gruve: [
        { tekst: 'En kobbergruve i Chile' },
        { tekst: 'Kobber: landets største rikdom' },
        { tekst: 'Eid av amerikanske selskaper' },
        { tekst: 'Fortjenesten seiler til USA', rod: true },
        { tekst: '«Det er jo vår rikdom»' },
    ],
    deling: [
        { tekst: '1970: Allende vinner valget' },
        { tekst: 'Rikdommen tilbake til folket' },
        { tekst: 'Nasjonalisert: staten eier gruvene' },
        { tekst: 'Kobberpenger til skoler og sykehus' },
    ],
    stille: [
        { tekst: 'Lav kobberpris, ingen deler', rod: true },
        { tekst: 'To år med kaos', rod: true },
        { tekst: 'Ingen hær trengs' },
        { tekst: 'Noen andre tar det siste steget', rod: true },
    ],
    privat: [
        { tekst: 'Døra er åpen igjen' },
        { tekst: 'Chile blir et laboratorium' },
        { tekst: 'Chicago-guttene får styre' },
        { tekst: 'Kobberet blir privat igjen' },
        { tekst: 'Skoler, vann og pensjoner: solgt', rod: true },
    ],
};

export function ChileGruva({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'gruve';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const t = TEKST[modus][Math.min(beat, TEKST[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [-14, 16, 34] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-700 text-white' : 'bg-white/90 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'deling' && beat <= 1 && (
                    <motion.div
                        key="allende"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 18 }}
                        className="absolute left-[5%] top-[26%] w-[20rem] p-5 rounded-3xl bg-white/95 shadow-2xl"
                    >
                        <div className="font-display font-black text-3xl text-slate-900">
                            Salvador Allende
                        </div>
                        <div className="mt-1 text-xl font-semibold text-slate-600">
                            President fra 1970
                        </div>
                        <AnimatePresence>
                            {beat >= 1 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-3 px-3 py-2 rounded-xl bg-red-50 text-xl font-bold text-red-800"
                                >
                                    Sosialist: rikdommen skal deles med folket
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
                {modus === 'stille' && beat >= 2 && (
                    <motion.div
                        key="oppskrift"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 18 }}
                        className="absolute left-[5%] top-[26%] w-[21rem] p-5 rounded-3xl bg-white/95 shadow-2xl space-y-3"
                    >
                        <div className="text-2xl font-black text-slate-900">
                            1. Gjør hverdagen vond
                        </div>
                        <AnimatePresence>
                            {beat >= 3 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="px-3 py-2 rounded-xl bg-red-700 text-2xl font-black text-white"
                                >
                                    2. Noen andre tar over
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
                {modus === 'privat' && beat === 2 && (
                    <motion.div
                        key="chicago"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 18 }}
                        className="absolute left-[6%] top-[28%] w-[21rem] p-5 rounded-3xl bg-white/95 shadow-2xl"
                    >
                        <div className="font-display font-black text-3xl text-slate-900">
                            Chicago-guttene
                        </div>
                        <div className="mt-2 text-xl font-semibold text-slate-600">
                            Chilenske økonomer utdannet i USA. Privatisere og kutte.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
