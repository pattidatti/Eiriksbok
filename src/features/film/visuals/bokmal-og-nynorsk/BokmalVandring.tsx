import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Ivar Aasen på vandring i et vestlandsdal, i 3D.
 *
 *  - vandring: Aasen går langs stien fra gård til gård og skriver ned det han hører.
 *              Til slutt lyser alle gårdene han har besøkt: et atlas over dialektene
 *  - bygg:     ark fra gårdene blir byggesteiner. Steinene stables til et hus, og på
 *              taket legges grammatikken (1848) og ordboka (1850). Skiltet: landsmål, så nynorsk
 *
 * All tekst ligger som DOM over lerretet, ikke som 3D-tekst.
 */

type Modus = 'vandring' | 'bygg';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Gårdene langs stien, fra venstre mot høyre. */
const GARDER: [number, number][] = [
    [-14, 2],
    [-7, -1.5],
    [0, 1.8],
    [7, -1.2],
    [14, 1.6],
];

/** Stien går gjennom alle gårdene, litt foran dem. */
function stiPunkt(s: number): [number, number] {
    // s går fra 0 (første gård) til 4 (siste gård)
    const i = Math.max(0, Math.min(3, Math.floor(s)));
    const f = Math.max(0, Math.min(1, s - i));
    const [x0, z0] = GARDER[i];
    const [x1, z1] = GARDER[i + 1];
    return [x0 + (x1 - x0) * f, z0 + 2.2 + (z1 - z0) * f];
}

/** Hvor langt Aasen har gått på stien (0-4), ut fra beat og tid i beaten. */
function aasenS(beat: number, t: number) {
    const start = [0.0, 0.9, 1.9, 2.85, 3.6][Math.min(beat, 4)];
    const slutt = [0.8, 1.85, 2.0, 3.0, 4.0][Math.min(beat, 4)];
    return Math.min(slutt, start + t * 0.12);
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'bygg') {
        switch (beat) {
            case 0:
                return { pos: v(-6 + t * 0.15, 9, 22), se: v(0, 2, -2) };
            case 1:
                return { pos: v(6, 6, 15), se: v(0, 2.2, 0) };
            case 2:
            case 3:
                return { pos: v(3.5, 6.5, 10), se: v(0, 3.4, 0) };
            default:
                return { pos: v(-4 - t * 0.1, 7, 13), se: v(0, 3, 0) };
        }
    }
    const [x, z] = stiPunkt(aasenS(beat, t));
    switch (beat) {
        case 0:
            return { pos: v(x + 7, 4.5, z + 11), se: v(x, 1.2, z) };
        case 1:
            return { pos: v(x - 4, 2.6, z + 6), se: v(x, 1.3, z) };
        case 2:
            return { pos: v(x + 3, 3.2, z + 7), se: v(x - 0.5, 1.2, z - 2) };
        case 3:
            return { pos: v(x - 2.5, 2.4, z + 5), se: v(x, 1.4, z) };
        default:
            return { pos: v(0, 22, 30), se: v(0, 0, -1) };
    }
}

/* ---------------- Landskapet ---------------- */

const FJELL: { x: number; z: number; r: number; h: number }[] = [
    { x: -24, z: -22, r: 9, h: 14 },
    { x: -10, z: -26, r: 11, h: 18 },
    { x: 6, z: -24, r: 10, h: 16 },
    { x: 20, z: -22, r: 9, h: 13 },
    { x: 32, z: -16, r: 8, h: 11 },
    { x: -34, z: -14, r: 8, h: 10 },
];

function Landskap() {
    return (
        <group>
            {/* Dalbunnen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[120, 80]} />
                <meshToonMaterial color="#8fb36a" />
            </mesh>
            {/* Fjorden foran gårdene */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 14]}>
                <planeGeometry args={[120, 10]} />
                <meshToonMaterial color="#5d9fc4" emissive="#1e4f6e" emissiveIntensity={0.35} />
            </mesh>
            {/* Fjellene bak */}
            {FJELL.map((f, i) => (
                <group key={i} position={[f.x, 0, f.z]}>
                    <mesh position={[0, f.h / 2, 0]}>
                        <coneGeometry args={[f.r, f.h, 7]} />
                        <meshToonMaterial color={i % 2 ? '#6b7c6a' : '#5f6f5e'} />
                    </mesh>
                    <mesh position={[0, f.h * 0.86, 0]}>
                        <coneGeometry args={[f.r * 0.29, f.h * 0.28, 7]} />
                        <meshToonMaterial color="#f1f5f9" />
                    </mesh>
                </group>
            ))}
            {/* Stien: små flate steiner */}
            {Array.from({ length: 58 }, (_, i) => {
                const [x, z] = stiPunkt((i / 57) * 4);
                return (
                    <mesh key={i} position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.32, 6]} />
                        <meshToonMaterial color="#c9b48a" />
                    </mesh>
                );
            })}
        </group>
    );
}

function Gard({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]}>
            {/* Stua */}
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[2.6, 1.8, 1.8]} />
                <meshToonMaterial color="#9a3412" />
            </mesh>
            {/* Torvtaket: et liggende trekantprisme */}
            <group position={[0, 2.42, 0]} rotation={[0, Math.PI / 2, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1.25, 1.25, 2.8, 3, 1, false]} />
                    <meshToonMaterial color="#3f6212" />
                </mesh>
            </group>
            {/* Fjøset ved siden av */}
            <mesh position={[-2.4, 0.7, -0.8]}>
                <boxGeometry args={[1.6, 1.4, 1.4]} />
                <meshToonMaterial color="#78350f" />
            </mesh>
            {/* Vinduet */}
            <mesh position={[0.6, 1.0, 0.91]}>
                <planeGeometry args={[0.5, 0.45]} />
                <meshBasicMaterial color="#fde68a" />
            </mesh>
        </group>
    );
}

/** Aasen: kropp, hode, hatt og ryggsekk. */
function Vandrer({ gruppe }: { gruppe: React.RefObject<THREE.Group | null> }) {
    return (
        <group ref={gruppe}>
            <mesh position={[0, 0.7, 0]}>
                <cylinderGeometry args={[0.26, 0.32, 1.1, 10]} />
                <meshToonMaterial color="#1e3a8a" />
            </mesh>
            <mesh position={[0, 1.45, 0]}>
                <sphereGeometry args={[0.24, 14, 12]} />
                <meshToonMaterial color="#f2c9a0" />
            </mesh>
            <mesh position={[0, 1.7, 0]}>
                <cylinderGeometry args={[0.2, 0.32, 0.22, 12]} />
                <meshToonMaterial color="#292524" />
            </mesh>
            <mesh position={[-0.3, 0.85, 0]}>
                <boxGeometry args={[0.28, 0.6, 0.45]} />
                <meshToonMaterial color="#78350f" />
            </mesh>
            {/* Notatboka */}
            <mesh position={[0.32, 0.85, 0.12]} rotation={[0, 0, -0.4]}>
                <boxGeometry args={[0.06, 0.32, 0.24]} />
                <meshToonMaterial color="#fef3c7" />
            </mesh>
            {/* Beina */}
            <mesh position={[0, 0.08, 0.1]}>
                <boxGeometry args={[0.18, 0.18, 0.16]} />
                <meshToonMaterial color="#292524" />
            </mesh>
            <mesh position={[0, 0.08, -0.1]}>
                <boxGeometry args={[0.18, 0.18, 0.16]} />
                <meshToonMaterial color="#292524" />
            </mesh>
        </group>
    );
}

/** Lysende merker over gårdene: et atlas over dialektene. */
function Merker({ refs }: { refs: React.RefObject<(THREE.Mesh | null)[]> }) {
    return (
        <>
            {GARDER.map(([x, z], i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                    position={[x, 4.4, z]}
                >
                    <octahedronGeometry args={[0.7, 0]} />
                    <meshBasicMaterial color="#f59e0b" />
                </mesh>
            ))}
        </>
    );
}

/* ---------------- Byggesteinene ---------------- */

/** Huset av steiner: 5 bred, 4 høy, med en åpning til døra. */
const STEINER: [number, number, number][] = (() => {
    const ut: [number, number, number][] = [];
    for (let rad = 0; rad < 4; rad++) {
        for (let k = 0; k < 5; k++) {
            if (rad < 2 && k === 2) continue; // døra
            ut.push([(k - 2) * 1.05, 0.5 + rad * 1.0, 0]);
        }
    }
    return ut;
})();

const STEINFARGER = ['#fcd34d', '#fbbf24', '#f59e0b', '#fde68a', '#facc15'];

function Steiner({ refs }: { refs: React.RefObject<(THREE.Mesh | null)[]> }) {
    return (
        <>
            {STEINER.map((_, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                >
                    <boxGeometry args={[1.0, 0.95, 1.2]} />
                    <meshToonMaterial color={STEINFARGER[i % STEINFARGER.length]} />
                </mesh>
            ))}
        </>
    );
}

function Boker({
    grammatikk,
    ordbok,
}: {
    grammatikk: React.RefObject<THREE.Group | null>;
    ordbok: React.RefObject<THREE.Group | null>;
}) {
    return (
        <>
            <group ref={grammatikk}>
                <mesh>
                    <boxGeometry args={[2.4, 0.45, 1.6]} />
                    <meshToonMaterial color="#991b1b" />
                </mesh>
                <mesh position={[0, 0, 0.81]}>
                    <boxGeometry args={[2.2, 0.32, 0.02]} />
                    <meshToonMaterial color="#fef3c7" />
                </mesh>
            </group>
            <group ref={ordbok}>
                <mesh>
                    <boxGeometry args={[2.2, 0.6, 1.5]} />
                    <meshToonMaterial color="#1e3a8a" />
                </mesh>
                <mesh position={[0, 0, 0.76]}>
                    <boxGeometry args={[2.0, 0.45, 0.02]} />
                    <meshToonMaterial color="#fef3c7" />
                </mesh>
            </group>
        </>
    );
}

/* ---------------- Scenen ---------------- */

const BYGG_X = 0;
const BYGG_Z = 5;

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const vandrer = useRef<THREE.Group>(null);
    const merker = useRef<(THREE.Mesh | null)[]>([]);
    const steiner = useRef<(THREE.Mesh | null)[]>([]);
    const grammatikk = useRef<THREE.Group>(null);
    const ordbok = useRef<THREE.Group>(null);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const beatTid = useRef(0);
    const forrige = useRef(beat);

    useFrame((state, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        const klokke = state.clock.elapsedTime;

        if (modus === 'vandring') {
            const s = aasenS(beat, t);
            const [x, z] = stiPunkt(s);
            const [x2, z2] = stiPunkt(Math.min(4, s + 0.05));
            const gar = playing && s < [0.8, 1.85, 2.0, 3.0, 4.0][Math.min(beat, 4)];
            if (vandrer.current) {
                vandrer.current.position.set(x, gar ? Math.abs(Math.sin(klokke * 7)) * 0.08 : 0, z);
                // Står stille og ser mot gården i beat 2 og 3
                const mot =
                    beat === 2 || beat === 3
                        ? Math.atan2(0, -1)
                        : Math.atan2(x2 - x, z2 - z) - Math.PI / 2;
                vandrer.current.rotation.y = mot;
            }
            // Gårdene han har besøkt får et lysende merke i beat 4
            merker.current.forEach((m, i) => {
                if (!m) return;
                const vis = beat >= 4 && i <= Math.floor(s + 0.01);
                m.visible = vis;
                m.rotation.y = klokke * 1.2 + i;
                m.position.y = 4.4 + Math.sin(klokke * 2 + i) * 0.15;
            });
        } else {
            if (vandrer.current) {
                vandrer.current.position.set(BYGG_X - 3.6, 0, BYGG_Z + 1.8);
                vandrer.current.rotation.y = -0.3;
            }
            merker.current.forEach((m) => {
                if (m) m.visible = false;
            });
            // Steinene: ligger ved gårdene i beat 0, flyr inn og stables i beat 1, står ferdig etter
            const n = STEINER.length;
            const ferdige = beat >= 2 ? n : beat === 1 ? Math.min(n, Math.floor(t * 4)) : 0;
            steiner.current.forEach((m, i) => {
                if (!m) return;
                const [gx, gz] = GARDER[i % GARDER.length];
                const hjem = v(
                    gx + ((i % 3) - 1) * 0.6,
                    0.5 + Math.floor(i / 5) * 0.2 + 2.6,
                    gz + 0.4
                );
                const [sx, sy, sz] = STEINER[i];
                const mal = v(BYGG_X + sx, sy, BYGG_Z + sz);
                if (i < ferdige) {
                    m.position.x = damp(m.position.x, mal.x, 3, dt || 1);
                    m.position.y = damp(m.position.y, mal.y, 3, dt || 1);
                    m.position.z = damp(m.position.z, mal.z, 3, dt || 1);
                    m.scale.setScalar(1);
                } else {
                    m.position.copy(hjem);
                    m.position.y += Math.sin(klokke * 2 + i) * 0.1;
                    m.scale.setScalar(beat === 0 ? 0.55 : 0.45);
                }
            });
            const taket = 0.5 + 3 * 1.0 + 0.48;
            if (grammatikk.current) {
                grammatikk.current.visible = beat >= 2;
                grammatikk.current.position.set(BYGG_X, taket + 0.22, BYGG_Z);
            }
            if (ordbok.current) {
                ordbok.current.visible = beat >= 3;
                ordbok.current.position.set(BYGG_X + 0.1, taket + 0.45 + 0.3, BYGG_Z);
                ordbok.current.rotation.y = 0.12;
            }
        }

        const mal = kameraFor(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
    });

    const garder = useMemo(() => GARDER, []);
    return (
        <>
            <color attach="background" args={['#cfe3ee']} />
            <fog attach="fog" args={['#cfe3ee', 30, 80]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[10, 18, 12]} intensity={1.4} color="#fff4e0" />
            <hemisphereLight args={['#e0f2fe', '#4d7c0f', 0.45]} />
            <Landskap />
            {garder.map(([x, z], i) => (
                <Gard key={i} x={x} z={z} />
            ))}
            <Vandrer gruppe={vandrer} />
            <Merker refs={merker} />
            {modus === 'bygg' && <Steiner refs={steiner} />}
            {modus === 'bygg' && <Boker grammatikk={grammatikk} ordbok={ordbok} />}
        </>
    );
}

/* ---------------- Tekst over lerretet ---------------- */

function Kort({ children, top = '5%' }: { children: React.ReactNode; top?: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl shadow-2xl text-center"
                style={{ background: 'rgba(255,251,235,0.96)', padding: '12px 28px' }}
            >
                {children}
            </motion.div>
        </div>
    );
}

function Stor({ children, farge = '#1c1917' }: { children: React.ReactNode; farge?: string }) {
    return (
        <div
            className="font-display font-black"
            style={{ fontSize: 34, color: farge, lineHeight: 1.15 }}
        >
            {children}
        </div>
    );
}

function Liten({ children }: { children: React.ReactNode }) {
    return (
        <div className="font-semibold" style={{ fontSize: 21, color: '#57534e' }}>
            {children}
        </div>
    );
}

function Chip({ tekst, forsinkelse }: { tekst: string; forsinkelse: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
            className="rounded-xl font-display font-bold"
            style={{
                background: '#fef3c7',
                border: '3px solid #b45309',
                color: '#78350f',
                fontSize: 26,
                padding: '6px 18px',
            }}
        >
            {tekst}
        </motion.div>
    );
}

function VandringTekst({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <Kort key="ar">
                    <Stor>1842</Stor>
                    <Liten>en ung mann på 28 år, med ryggsekk og notatbok</Liten>
                </Kort>
            )}
            {beat === 1 && (
                <Kort key="navn">
                    <Stor>Ivar Aasen</Stor>
                    <Liten>fra bygd til bygd: hvordan snakker folk her?</Liten>
                </Kort>
            )}
            {beat === 2 && (
                <div
                    key="steder"
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: '6%', gap: 16 }}
                >
                    <Chip tekst="i fjøset" forsinkelse={0} />
                    <Chip tekst="på kjøkkenet" forsinkelse={0.5} />
                    <Chip tekst="hos presten" forsinkelse={1} />
                </div>
            )}
            {beat === 3 && (
                <div
                    key="ord"
                    className="absolute inset-x-0 flex flex-col items-center"
                    style={{ top: '5%', gap: 10 }}
                >
                    <div className="flex" style={{ gap: 16 }}>
                        <Chip tekst="ord" forsinkelse={0} />
                        <Chip tekst="bøyninger" forsinkelse={0.4} />
                        <Chip tekst="setninger" forsinkelse={0.8} />
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                        className="rounded-xl font-display font-black"
                        style={{
                            background: 'rgba(255,251,235,0.96)',
                            fontSize: 34,
                            padding: '6px 24px',
                            color: '#1c1917',
                        }}
                    >
                        hest <span style={{ color: '#a8a29e' }}>→</span> hest
                        <span style={{ color: '#b45309' }}>en</span>
                    </motion.div>
                </div>
            )}
            {beat >= 4 && (
                <Kort key="atlas">
                    <Stor>1842 til 1846</Stor>
                    <Liten>et atlas over norske dialekter</Liten>
                </Kort>
            )}
        </AnimatePresence>
    );
}

function ByggTekst({ beat }: { beat: number }) {
    return (
        <>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Kort key="naer">
                        <Stor>Aasen mente:</Stor>
                        <Liten>dialektene lå nær norrønt. Dansken hadde endret seg mer</Liten>
                    </Kort>
                )}
                {beat === 1 && (
                    <Kort key="grunn">
                        <Stor>Fra grunnen av</Stor>
                        <Liten>dialektene blir byggesteiner</Liten>
                    </Kort>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 2 && (
                    <motion.div
                        key="g"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute rounded-2xl shadow-xl"
                        style={{
                            left: '4%',
                            top: '8%',
                            background: '#991b1b',
                            padding: '10px 22px',
                        }}
                    >
                        <div
                            className="font-display font-black"
                            style={{ fontSize: 30, color: 'white' }}
                        >
                            Grammatikk, 1848
                        </div>
                        <div className="font-semibold" style={{ fontSize: 19, color: '#fecaca' }}>
                            reglene for hvordan ord bøyes
                        </div>
                    </motion.div>
                )}
                {beat >= 3 && (
                    <motion.div
                        key="o"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute rounded-2xl shadow-xl"
                        style={{
                            right: '4%',
                            top: '8%',
                            background: '#1e3a8a',
                            padding: '10px 22px',
                        }}
                    >
                        <div
                            className="font-display font-black"
                            style={{ fontSize: 30, color: 'white' }}
                        >
                            Ordbok, 1850
                        </div>
                        <div className="font-semibold" style={{ fontSize: 19, color: '#bfdbfe' }}>
                            ordene fra dialektene
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 3 && (
                    <div
                        className="absolute inset-x-0 flex justify-center"
                        style={{ bottom: '7%' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl shadow-2xl text-center"
                            style={{ background: 'rgba(28,25,23,0.92)', padding: '10px 30px' }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={beat >= 4 ? 'ny' : 'land'}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="font-display font-black"
                                    style={{ fontSize: 44, color: '#fde68a' }}
                                >
                                    {beat >= 4 ? 'nynorsk' : 'landsmål'}
                                </motion.div>
                            </AnimatePresence>
                            <div
                                className="font-semibold"
                                style={{ fontSize: 19, color: '#e7e5e4' }}
                            >
                                {beat >= 4 ? 'offisielt navn fra 1929' : 'Aasens navn på språket'}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

export function BokmalVandring({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'vandring';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                key={modus}
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.1, far: 200, position: [8, 5, 14] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            {modus === 'vandring' ? <VandringTekst beat={beat} /> : <ByggTekst beat={beat} />}
        </div>
    );
}
