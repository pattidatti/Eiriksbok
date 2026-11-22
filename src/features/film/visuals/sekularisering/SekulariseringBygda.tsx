import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';
import { SekOverskrift, SekSkilt } from './felles';

/**
 * Bygda i 3D: stua der naboene samles, kirken og staten (huset med krona).
 * «natt»: Hauges møte i stua i 1804, lensmannens lykt, den tomme stua.
 * «baand»: 1537, kirken blir bundet til staten med et tau, og alle skal være lutherske.
 * «skillet»: 1814, biskopene utnevnes, tauet kuttes i 2012, kirken står for seg selv i 2017,
 * og en tynn gulltråd blir igjen (folkekirken som staten støtter).
 * «folk»: i dag: kirken er størst, men nye trossamfunn og livssynssamfunn vokser fram.
 */

type Modus = 'natt' | 'baand' | 'skillet' | 'folk';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const STUA = v(-5, 0, 11);
const KIRKE = v(7, 0, 0);
const STATEN = v(-9, 0, -1);
const MOSKE = v(-17, 0, 5);
const TEMPEL = v(-14, 0, -11);
const ORTODOKS = v(19, 0, -8);
const LIVSSYN = v(19, 0, 9);

/** Tauet mellom staten og kirken: fra toppen av statens hus til kirketårnet. */
const TAU_FRA = v(STATEN.x + 3.4, 4.2, STATEN.z);
const TAU_TIL = v(KIRKE.x - 2.6, 4.2, KIRKE.z + 0.4);

function kameraFor(modus: Modus, beat: number, t: number) {
    const s = Math.min(t, 12);
    if (modus === 'natt') {
        switch (beat) {
            case 0:
                return { pos: v(8 - s * 0.3, 9, 32), se: v(-3, 1, 7) };
            case 1:
                return { pos: v(-5, 2.7, 17.2 - s * 0.08), se: v(-5, 1.1, 10.6) };
            case 2:
                return { pos: v(-2.2, 2.5, 16), se: v(-5.6, 1.3, 10.6) };
            case 3:
                return { pos: v(1.5, 3.2, 20), se: v(-3, 1, 13) };
            default:
                return { pos: v(-5, 4.5, 23), se: v(-5, 1.2, 10.5) };
        }
    }
    if (modus === 'baand') {
        switch (beat) {
            case 0:
                return { pos: v(-1 + s * 0.15, 10, 27), se: v(-1, 3, 0) };
            case 1:
                return { pos: v(-13, 7.5, 12), se: v(-9, 5, -1) };
            case 2:
                return { pos: v(0, 15, 30), se: v(0, 0, 4) };
            default:
                return { pos: v(13, 5, 19), se: v(0, 2, 4) };
        }
    }
    if (modus === 'skillet') {
        switch (beat) {
            case 0:
                return { pos: v(-1, 9, 25), se: v(-1, 3, 0) };
            case 1:
                return { pos: v(0, 5.5, 18), se: v(-1, 2, 1) };
            case 2:
                return { pos: v(-1, 8, 23), se: v(-1, 2.5, 0) };
            case 3:
                return { pos: v(-1, 8, 23), se: v(-1, 2.5, 0) };
            default:
                return { pos: v(-1, 8, 24), se: v(-1, 3, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(13, 8, 23), se: v(6, 2, 3) };
        case 1:
            return { pos: v(0, 30, 44), se: v(0, 0, -1) };
        case 2:
            return { pos: v(-4, 18, 32), se: v(0, 1, -3) };
        case 3:
            return { pos: v(28, 8, 24), se: v(18, 1.5, 7) };
        default:
            return { pos: v(-5, 2.7, 17.5), se: v(-5, 1.1, 10.6) };
    }
}

/** Kameraet glir mot målet for beaten. Første bilde hopper rett dit. */
function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
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
    return null;
}

/* ------------------------------------------------------------------ bygninger */

function Saltak({
    bredde,
    dybde,
    hoyde,
    y,
    farge,
}: {
    bredde: number;
    dybde: number;
    hoyde: number;
    y: number;
    farge: string;
}) {
    const geo = useMemo(() => {
        const f = new THREE.Shape();
        f.moveTo(-bredde / 2 - 0.3, 0);
        f.lineTo(bredde / 2 + 0.3, 0);
        f.lineTo(0, hoyde);
        f.closePath();
        const g = new THREE.ExtrudeGeometry(f, { depth: dybde + 0.6, bevelEnabled: false });
        g.translate(0, 0, -(dybde + 0.6) / 2);
        return g;
    }, [bredde, dybde, hoyde]);
    return (
        <mesh geometry={geo} position={[0, y, 0]}>
            <meshStandardMaterial color={farge} flatShading />
        </mesh>
    );
}

/** Kirken: hvitt skip, tårn med spir og kors. Står med tårnet mot vest (mot staten). */
function Kirke({ lys }: { lys: number }) {
    return (
        <group position={KIRKE}>
            <mesh position={[0.8, 2, 0]}>
                <boxGeometry args={[6, 4, 4.4]} />
                <meshStandardMaterial color="#f8fafc" emissive="#94a3b8" emissiveIntensity={lys} />
            </mesh>
            <group position={[0.8, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <Saltak bredde={4.4} dybde={6} hoyde={2.2} y={4} farge="#334155" />
            </group>
            <mesh position={[-3, 3, 0]}>
                <boxGeometry args={[1.8, 6, 1.8]} />
                <meshStandardMaterial color="#f1f5f9" emissive="#94a3b8" emissiveIntensity={lys} />
            </mesh>
            <mesh position={[-3, 7.6, 0]}>
                <coneGeometry args={[1.35, 3.2, 4]} />
                <meshStandardMaterial color="#1e293b" flatShading />
            </mesh>
            <mesh position={[-3, 9.7, 0]}>
                <boxGeometry args={[0.16, 1.2, 0.16]} />
                <meshStandardMaterial color="#ca8a04" emissive="#ca8a04" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-3, 9.9, 0]}>
                <boxGeometry args={[0.7, 0.16, 0.16]} />
                <meshStandardMaterial color="#ca8a04" emissive="#ca8a04" emissiveIntensity={0.4} />
            </mesh>
            {[-0.8, 0.8, 2.4].map((x) => (
                <mesh key={x} position={[x + 0.8, 2.4, 2.22]}>
                    <boxGeometry args={[0.6, 1.4, 0.05]} />
                    <meshStandardMaterial
                        color="#7dd3fc"
                        emissive="#38bdf8"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Statens hus: grått steinhus med søyler og ei gullkrone på taket. */
function Staten({ kroneGlod, lys }: { kroneGlod: number; lys: number }) {
    return (
        <group position={STATEN}>
            <mesh position={[0, 2.25, 0]}>
                <boxGeometry args={[7, 4.5, 5]} />
                <meshStandardMaterial color="#cbd5e1" emissive="#64748b" emissiveIntensity={lys} />
            </mesh>
            <mesh position={[0, 4.75, 0]}>
                <boxGeometry args={[7.6, 0.5, 5.6]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            {[-2.6, -0.9, 0.9, 2.6].map((x) => (
                <mesh key={x} position={[x, 2.1, 2.9]}>
                    <cylinderGeometry args={[0.28, 0.28, 4.2, 10]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
            ))}
            {/* Krona */}
            <group position={[0, 5.4, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.9, 0.9, 0.6, 16]} />
                    <meshStandardMaterial
                        color="#eab308"
                        emissive="#f59e0b"
                        emissiveIntensity={kroneGlod}
                        metalness={0.3}
                        roughness={0.4}
                    />
                </mesh>
                {[0, 1, 2, 3, 4].map((i) => {
                    const a = (i / 5) * Math.PI * 2;
                    return (
                        <mesh key={i} position={[Math.cos(a) * 0.75, 0.6, Math.sin(a) * 0.75]}>
                            <coneGeometry args={[0.22, 0.7, 5]} />
                            <meshStandardMaterial
                                color="#eab308"
                                emissive="#f59e0b"
                                emissiveIntensity={kroneGlod}
                            />
                        </mesh>
                    );
                })}
            </group>
        </group>
    );
}

/** Stua: åpen mot kameraet (mot +z), med bord, lys og benker. Torvtak. */
function Stua({ natt, lysInne }: { natt: boolean; lysInne: number }) {
    const vegg = natt ? '#5b3a1e' : '#8b5a2b';
    return (
        <group position={STUA}>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[6, 4.6]} />
                <meshStandardMaterial
                    color="#a16207"
                    emissive="#78350f"
                    emissiveIntensity={natt ? 0.25 + lysInne * 0.4 : 0.1}
                />
            </mesh>
            <mesh position={[0, 1.4, -2.2]}>
                <boxGeometry args={[6, 2.8, 0.3]} />
                <meshStandardMaterial
                    color={vegg}
                    emissive="#92400e"
                    emissiveIntensity={natt ? lysInne * 0.45 : 0.05}
                />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 3, 1.4, 0]}>
                    <boxGeometry args={[0.3, 2.8, 4.6]} />
                    <meshStandardMaterial
                        color={vegg}
                        emissive="#92400e"
                        emissiveIntensity={natt ? lysInne * 0.3 : 0.05}
                    />
                </mesh>
            ))}
            {/* Torvtak, løftet så kameraet ser inn */}
            <group position={[0, 0, -0.3]}>
                <Saltak bredde={6.2} dybde={4.4} hoyde={1.6} y={2.8} farge="#3f6212" />
            </group>
            {/* Vindu i bakveggen */}
            <mesh position={[1.6, 1.7, -2.03]}>
                <planeGeometry args={[0.9, 0.7]} />
                <meshStandardMaterial
                    color={natt ? '#1e293b' : '#bae6fd'}
                    emissive={natt ? '#0f172a' : '#7dd3fc'}
                    emissiveIntensity={0.4}
                />
            </mesh>
            {/* Bordet */}
            <mesh position={[0, 0.75, -0.4]}>
                <boxGeometry args={[2.6, 0.12, 1.2]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            {[-1.1, 1.1].map((x) => (
                <mesh key={x} position={[x, 0.37, -0.4]}>
                    <boxGeometry args={[0.12, 0.74, 1]} />
                    <meshStandardMaterial color="#713f12" />
                </mesh>
            ))}
            {/* Bibelen */}
            <mesh position={[0.5, 0.86, -0.3]} rotation={[0, 0.3, 0]}>
                <boxGeometry args={[0.45, 0.1, 0.32]} />
                <meshStandardMaterial color="#1e1b4b" />
            </mesh>
            {/* Lyset */}
            <mesh position={[-0.3, 0.95, -0.4]}>
                <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
                <meshStandardMaterial color="#fef3c7" />
            </mesh>
            <mesh position={[-0.3, 1.16, -0.4]} scale={lysInne > 0.05 ? 1 : 0.001}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color="#fde047" />
            </mesh>
            {natt && (
                <pointLight
                    position={[-0.3, 1.5, -0.2]}
                    color="#fbbf24"
                    intensity={lysInne * 9}
                    distance={7}
                    decay={1.6}
                />
            )}
        </group>
    );
}

function Moske({ skala }: { skala: number }) {
    return (
        <group position={MOSKE} scale={[1, skala, 1]} visible={skala > 0.02}>
            <mesh position={[0, 1.6, 0]}>
                <boxGeometry args={[4, 3.2, 4]} />
                <meshStandardMaterial color="#f5f5f4" emissive="#a8a29e" emissiveIntensity={0.15} />
            </mesh>
            <mesh position={[0, 3.2, 0]}>
                <sphereGeometry args={[1.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#0f766e" flatShading />
            </mesh>
            <mesh position={[2.6, 3.2, 1.4]}>
                <cylinderGeometry args={[0.3, 0.35, 6.4, 10]} />
                <meshStandardMaterial color="#f5f5f4" />
            </mesh>
            <mesh position={[2.6, 6.8, 1.4]}>
                <coneGeometry args={[0.4, 0.9, 10]} />
                <meshStandardMaterial color="#0f766e" />
            </mesh>
        </group>
    );
}

function Tempel({ skala }: { skala: number }) {
    return (
        <group position={TEMPEL} scale={[1, skala, 1]} visible={skala > 0.02}>
            {[0, 1, 2].map((i) => (
                <group key={i}>
                    <mesh position={[0, 0.9 + i * 1.7, 0]}>
                        <boxGeometry args={[3.4 - i * 0.8, 1.4, 3.4 - i * 0.8]} />
                        <meshStandardMaterial color="#b91c1c" />
                    </mesh>
                    <mesh position={[0, 1.75 + i * 1.7, 0]} rotation={[0, Math.PI / 4, 0]}>
                        <coneGeometry args={[(3.4 - i * 0.8) * 0.95, 0.7, 4]} />
                        <meshStandardMaterial color="#422006" flatShading />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Ortodoks({ skala }: { skala: number }) {
    return (
        <group position={ORTODOKS} scale={[1, skala, 1]} visible={skala > 0.02}>
            <mesh position={[0, 1.6, 0]}>
                <boxGeometry args={[3.4, 3.2, 4.4]} />
                <meshStandardMaterial color="#fde68a" emissive="#ca8a04" emissiveIntensity={0.1} />
            </mesh>
            <mesh position={[0, 3.9, 0]}>
                <cylinderGeometry args={[0.8, 0.8, 1.4, 12]} />
                <meshStandardMaterial color="#fde68a" />
            </mesh>
            <mesh position={[0, 5.0, 0]} scale={[1, 1.3, 1]}>
                <sphereGeometry args={[0.95, 14, 10]} />
                <meshStandardMaterial color="#1d4ed8" flatShading />
            </mesh>
            <mesh position={[0, 6.3, 0]}>
                <coneGeometry args={[0.3, 0.9, 10]} />
                <meshStandardMaterial color="#ca8a04" />
            </mesh>
        </group>
    );
}

/** Et enkelt forsamlingshus uten religiøse symboler (livssynssamfunn uten gudstro). */
function Livssynshus({ skala }: { skala: number }) {
    return (
        <group position={LIVSSYN} scale={[1, skala, 1]} visible={skala > 0.02}>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[4.4, 3, 3.6]} />
                <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" emissiveIntensity={0.12} />
            </mesh>
            <mesh position={[0, 3.1, 0]}>
                <boxGeometry args={[4.8, 0.25, 4]} />
                <meshStandardMaterial color="#0369a1" />
            </mesh>
            {[-1.2, 0, 1.2].map((x) => (
                <mesh key={x} position={[x, 1.8, 1.82]}>
                    <planeGeometry args={[0.7, 1.2]} />
                    <meshStandardMaterial
                        color="#38bdf8"
                        emissive="#0ea5e9"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ------------------------------------------------------------------ folk */

/** Mange figurer som instanser: kropp (kapsel) og hode (kule). */
function Folk({ punkter, farger }: { punkter: [number, number, number][]; farger: string[] }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const k = kropp.current;
        const h = hode.current;
        if (!k || !h) return;
        const m = new THREE.Matrix4();
        const c = new THREE.Color();
        punkter.forEach(([x, y, z], i) => {
            m.makeTranslation(x, y + 0.55, z);
            k.setMatrixAt(i, m);
            m.makeTranslation(x, y + 1.25, z);
            h.setMatrixAt(i, m);
            c.set(farger[i % farger.length]);
            k.setColorAt(i, c);
            c.set('#fcd9b6');
            h.setColorAt(i, c);
        });
        k.count = punkter.length;
        h.count = punkter.length;
        k.instanceMatrix.needsUpdate = true;
        h.instanceMatrix.needsUpdate = true;
        if (k.instanceColor) k.instanceColor.needsUpdate = true;
        if (h.instanceColor) h.instanceColor.needsUpdate = true;
    }, [punkter, farger]);
    return (
        <group>
            <instancedMesh ref={kropp} args={[undefined, undefined, 80]} frustumCulled={false}>
                <capsuleGeometry args={[0.24, 0.6, 4, 8]} />
                <meshStandardMaterial emissive="#334155" emissiveIntensity={0.15} />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, 80]} frustumCulled={false}>
                <sphereGeometry args={[0.2, 10, 8]} />
                <meshStandardMaterial />
            </instancedMesh>
        </group>
    );
}

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Et klynge av punkter rundt et sentrum. */
function klynge(
    cx: number,
    cz: number,
    n: number,
    radius: number,
    seed: number
): [number, number, number][] {
    return Array.from({ length: n }, (_, i) => {
        const a = frø(seed + i) * Math.PI * 2;
        const r = Math.sqrt(frø(seed + i + 100)) * radius;
        return [cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r];
    });
}

/** Én figur som kan flyttes (Hauge, lensmannen, biskopene). */
function Person({ farge, hatt }: { farge: string; hatt?: string }) {
    return (
        <group>
            <mesh position={[0, 0.55, 0]}>
                <capsuleGeometry args={[0.24, 0.6, 4, 8]} />
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0, 1.25, 0]}>
                <sphereGeometry args={[0.2, 10, 8]} />
                <meshStandardMaterial color="#fcd9b6" />
            </mesh>
            {hatt && (
                <mesh position={[0, 1.5, 0]}>
                    <coneGeometry args={[0.22, 0.4, 8]} />
                    <meshStandardMaterial color={hatt} />
                </mesh>
            )}
        </group>
    );
}

/** Naboene rundt bordet i stua (lokale koordinater i stua). */
const RUNDT_BORDET: [number, number, number][] = [
    [-1.7, 0, -0.4],
    [1.7, 0, -0.4],
    [-0.7, 0, -1.4],
    [0.6, 0, -1.4],
    [-0.8, 0, 0.6],
    [0.8, 0, 0.6],
];

/* ------------------------------------------------------------------ tau */

function Tau({
    fra,
    til,
    henger,
    radius,
    farge,
}: {
    fra: THREE.Vector3;
    til: THREE.Vector3;
    henger: number;
    radius: number;
    farge: string;
}) {
    const geo = useMemo(() => {
        const midt = fra.clone().lerp(til, 0.5);
        midt.y -= henger;
        const kurve = new THREE.QuadraticBezierCurve3(fra, midt, til);
        return new THREE.TubeGeometry(kurve, 32, radius, 8, false);
    }, [fra, til, henger, radius]);
    return (
        <mesh geometry={geo}>
            <meshStandardMaterial
                color={farge}
                emissive={farge}
                emissiveIntensity={0.25}
                roughness={0.8}
            />
        </mesh>
    );
}

/** Biskopene går fra staten til kirken under tauet. */
function Biskoper({ playing }: { playing: boolean }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, raw) => {
        tid.current += playing ? Math.min(raw, 0.05) : 0;
        refs.current.forEach((g, i) => {
            if (!g) return;
            const u = (tid.current * 0.07 + i / 3) % 1;
            const fra = STATEN.x + 4;
            const til = KIRKE.x - 4.5;
            g.position.set(fra + (til - fra) * u, 0, 3.2);
        });
    });
    return (
        <>
            {[0, 1, 2].map((i) => (
                <group
                    key={i}
                    ref={(g) => {
                        refs.current[i] = g;
                    }}
                    position={[STATEN.x + 4 + i * 4, 0, 3.2]}
                >
                    <group scale={1.4}>
                        <Person farge="#7e22ce" hatt="#f8fafc" />
                    </group>
                </group>
            ))}
        </>
    );
}

/** Lensmannen med lykt går langs veien mot døra til stua. */
function Lensmann({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, raw) => {
        const g = ref.current;
        if (!g) return;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += playing ? Math.min(raw, 0.05) : 0;
        const u = Math.min(tid.current / 7, 1);
        const start = v(6, 0, 16);
        const mal = v(STUA.x + 1.8, 0, STUA.z + 3.2);
        g.position.copy(start.lerp(mal, 0.35 + u * 0.65));
    });
    const [start] = useState(() => v(6, 0, 16).lerp(v(STUA.x + 1.8, 0, STUA.z + 3.2), 0.35));
    return (
        <group ref={ref} position={start}>
            <Person farge="#1e3a8a" hatt="#111827" />
            <mesh position={[0.4, 0.9, 0.1]}>
                <boxGeometry args={[0.18, 0.26, 0.18]} />
                <meshBasicMaterial color="#fde047" />
            </mesh>
            <pointLight
                position={[0.4, 1, 0.3]}
                color="#fbbf24"
                intensity={6}
                distance={6}
                decay={1.5}
            />
        </group>
    );
}

/* ------------------------------------------------------------------ scene */

const FOLK_1537 = klynge(-1, 7, 30, 4.2, 11);
const GULL = ['#ca8a04', '#eab308', '#a16207'];
const GRAA = ['#64748b', '#78716c', '#57534e', '#475569'];
const BLANDET = ['#2563eb', '#dc2626', '#0d9488', '#ca8a04', '#7c3aed', '#ea580c', '#475569'];

const KIRKEFOLK = klynge(KIRKE.x + 1, KIRKE.z + 6.5, 34, 3.6, 41);
const SMAA = [
    ...klynge(MOSKE.x, MOSKE.z + 4.2, 6, 1.6, 71),
    ...klynge(TEMPEL.x + 0.5, TEMPEL.z + 3.8, 4, 1.3, 81),
    ...klynge(ORTODOKS.x - 0.5, ORTODOKS.z + 4, 4, 1.3, 91),
    ...klynge(LIVSSYN.x - 0.5, LIVSSYN.z + 4, 6, 1.5, 101),
];

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const natt = modus === 'natt';
    const nye = useRef(0);
    const [nyeSkala, setNyeSkala] = useState(modus === 'folk' && beat >= 1 ? 1 : 0.001);
    const visNye = modus === 'folk' && beat >= 1 && beat <= 3;
    const visNyeHele = modus === 'folk' && beat >= 1;
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 1;
        const mal = visNyeHele ? 1 : 0.001;
        nye.current = playing ? damp(nye.current, mal, 3, dt) : mal;
        if (Math.abs(nye.current - nyeSkala) > 0.01 || (nye.current === mal && nyeSkala !== mal))
            setNyeSkala(nye.current);
    });

    const lysInne = natt
        ? beat >= 4
            ? 0
            : beat === 3
              ? 0.7
              : 1
        : modus === 'folk' && beat === 4
          ? 0.6
          : 0;
    const kroneGlod =
        (modus === 'baand' && beat === 1) || (modus === 'skillet' && beat <= 1) ? 1.2 : 0.2;
    const lys = natt ? 0.12 : 0.18;

    // Tauet
    let tau: ReactNode = null;
    if (modus === 'baand') {
        tau = <Tau fra={TAU_FRA} til={TAU_TIL} henger={1.2} radius={0.22} farge="#92400e" />;
    } else if (modus === 'skillet') {
        if (beat <= 1) {
            tau = <Tau fra={TAU_FRA} til={TAU_TIL} henger={0.8} radius={0.3} farge="#b45309" />;
        } else {
            const midtFra = v(-3, 0.4, 0.8);
            const midtTil = v(1.5, 0.4, 0.8);
            tau = (
                <>
                    <Tau fra={TAU_FRA} til={midtFra} henger={1.5} radius={0.22} farge="#78350f" />
                    <Tau fra={TAU_TIL} til={midtTil} henger={1.5} radius={0.22} farge="#78350f" />
                    {beat >= 4 && (
                        <Tau
                            fra={TAU_FRA}
                            til={TAU_TIL}
                            henger={0.4}
                            radius={0.07}
                            farge="#eab308"
                        />
                    )}
                </>
            );
        }
    }

    const folk1537 =
        modus === 'baand' ? <Folk punkter={FOLK_1537} farger={beat >= 2 ? GULL : GRAA} /> : null;

    return (
        <>
            <color attach="background" args={[natt ? '#0b1733' : '#c7e0f2']} />
            <fog
                attach="fog"
                args={[natt ? '#0b1733' : '#dbeafe', natt ? 30 : 45, natt ? 80 : 120]}
            />
            <ambientLight intensity={natt ? 0.35 : 0.9} color={natt ? '#93c5fd' : '#ffffff'} />
            <hemisphereLight
                args={[
                    natt ? '#1e3a8a' : '#e0f2fe',
                    natt ? '#0f172a' : '#65a30d',
                    natt ? 0.5 : 0.7,
                ]}
            />
            <directionalLight
                position={natt ? [-10, 20, 10] : [12, 24, 16]}
                intensity={natt ? 0.35 : 1.3}
                color={natt ? '#bfdbfe' : '#fff7ed'}
            />
            {natt && <Stars radius={90} depth={30} count={1200} factor={3} fade />}

            {/* Bakken og veien */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[140, 140]} />
                <meshStandardMaterial
                    color={natt ? '#1f3a2a' : '#7fb069'}
                    emissive={natt ? '#14532d' : '#3f6212'}
                    emissiveIntensity={natt ? 0.35 : 0.15}
                />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0.35]} position={[2, 0.02, 15]}>
                <planeGeometry args={[40, 2.2]} />
                <meshStandardMaterial
                    color={natt ? '#57534e' : '#d6c8a6'}
                    emissive={natt ? '#292524' : '#000000'}
                    emissiveIntensity={0.3}
                />
            </mesh>

            <Kirke lys={lys} />
            <Staten kroneGlod={kroneGlod} lys={lys} />
            <Stua natt={natt} lysInne={lysInne} />
            <Moske skala={nyeSkala} />
            <Tempel skala={nyeSkala} />
            <Ortodoks skala={nyeSkala} />
            <Livssynshus skala={nyeSkala} />
            {tau}
            {folk1537}

            {/* Naboene i stua */}
            {((natt && beat <= 3) || (modus === 'folk' && beat === 4)) && (
                <group position={STUA}>
                    <Folk
                        punkter={RUNDT_BORDET}
                        farger={natt ? ['#57534e', '#78716c', '#44403c', '#713f12'] : BLANDET}
                    />
                </group>
            )}
            {/* Hauge står ved enden av bordet */}
            {natt && beat >= 1 && beat <= 2 && (
                <group position={[STUA.x - 0.1, 0, STUA.z + 0.8]}>
                    <Person farge={beat === 2 ? '#b45309' : '#57534e'} />
                </group>
            )}
            {natt && beat === 3 && <Lensmann beat={beat} playing={playing} />}

            {modus === 'skillet' && beat === 1 && <Biskoper playing={playing} />}
            {modus === 'skillet' && beat >= 3 && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[KIRKE.x, 0.05, KIRKE.z]}>
                    <ringGeometry args={[6.2, 6.6, 48]} />
                    <meshBasicMaterial color="#0d9488" />
                </mesh>
            )}
            {modus === 'skillet' && beat >= 4 && <Mynter playing={playing} />}

            {modus === 'folk' && <Folk punkter={KIRKEFOLK} farger={BLANDET} />}
            {visNye && <Folk punkter={SMAA} farger={BLANDET} />}

            {/* Merkelapper */}
            {(modus === 'baand' || modus === 'skillet') && beat !== 1 && (
                <>
                    <Html position={[STATEN.x - 3.2, 6.4, STATEN.z]} center zIndexRange={[10, 0]}>
                        <SekSkilt tekst="Staten" />
                    </Html>
                    <Html
                        position={[KIRKE.x + 3.5, 0.8, KIRKE.z + 3.6]}
                        center
                        zIndexRange={[10, 0]}
                    >
                        <SekSkilt tekst="Kirken" />
                    </Html>
                </>
            )}
            {modus === 'baand' && beat === 1 && (
                <Html position={[STATEN.x, 1.2, STATEN.z + 4.2]} center zIndexRange={[10, 0]}>
                    <SekSkilt tekst="Kongen er sjef for kirken" tone="gull" />
                </Html>
            )}
            {modus === 'skillet' && beat === 1 && (
                <Html position={[-1, 1.4, 6]} center zIndexRange={[10, 0]}>
                    <SekSkilt tekst="Kongen utnevner biskopene" tone="gull" />
                </Html>
            )}
            {modus === 'skillet' && beat === 2 && (
                <Html position={[-1, 1.2, 4]} center zIndexRange={[10, 0]}>
                    <SekSkilt tekst="2012: statskirkeordningen oppløst" tone="rod" />
                </Html>
            )}
            {modus === 'skillet' && beat === 3 && (
                <Html position={[KIRKE.x - 3, 0.6, KIRKE.z + 6.5]} center zIndexRange={[10, 0]}>
                    <SekSkilt tekst="2017: Den norske kirke, egen organisasjon" tone="gronn" />
                </Html>
            )}
            {modus === 'skillet' && beat === 4 && (
                <Html position={[-1, 1.4, 5]} center zIndexRange={[10, 0]}>
                    <SekSkilt tekst="Folkekirken: staten skal støtte den" tone="gull" />
                </Html>
            )}
            {modus === 'folk' && beat === 0 && (
                <Html position={[KIRKE.x + 1, 0.2, KIRKE.z + 11.2]} center zIndexRange={[10, 0]}>
                    <SekSkilt tekst="Den norske kirke: 3,4 millioner medlemmer" />
                </Html>
            )}
            {modus === 'folk' && beat === 2 && (
                <>
                    <Html position={[MOSKE.x, 8.5, MOSKE.z]} center zIndexRange={[10, 0]}>
                        <SekSkilt tekst="Islam" tone="gronn" />
                    </Html>
                    <Html position={[TEMPEL.x, 7.5, TEMPEL.z]} center zIndexRange={[10, 0]}>
                        <SekSkilt tekst="Buddhisme" tone="gronn" />
                    </Html>
                    <Html position={[ORTODOKS.x, 8, ORTODOKS.z]} center zIndexRange={[10, 0]}>
                        <SekSkilt tekst="Ortodoks kristendom" tone="gronn" />
                    </Html>
                </>
            )}
            {modus === 'folk' && beat === 3 && (
                <Html position={[LIVSSYN.x, 5.4, LIVSSYN.z]} center zIndexRange={[10, 0]}>
                    <SekSkilt tekst="Livssynssamfunn uten gudstro" tone="gronn" />
                </Html>
            )}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

/** Små gullmynter som går langs tråden fra staten til kirken. */
function Mynter({ playing }: { playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    const kurve = useMemo(() => {
        const midt = TAU_FRA.clone().lerp(TAU_TIL, 0.5);
        midt.y -= 0.4;
        return new THREE.QuadraticBezierCurve3(TAU_FRA, midt, TAU_TIL);
    }, []);
    useFrame((_, raw) => {
        tid.current += playing ? Math.min(raw, 0.05) : 0;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const u = (tid.current * 0.12 + i / 4) % 1;
            m.position.copy(kurve.getPoint(u));
            m.position.y += 0.35;
        });
    });
    return (
        <>
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                    rotation={[Math.PI / 2, 0, 0]}
                    position={kurve.getPoint(i / 4)}
                >
                    <cylinderGeometry args={[0.32, 0.32, 0.1, 14]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#ca8a04"
                        emissiveIntensity={0.6}
                    />
                </mesh>
            ))}
        </>
    );
}

/* ------------------------------------------------------------------ DOM */

const OVERSKRIFT: Record<Modus, string[]> = {
    natt: [
        'Høsten 1804',
        'Bibellesing i stua, uten prest',
        'Hans Nielsen Hauge',
        'Arrestert og ført til Christiania',
        'I fengsel nesten hele tiden fra 1804 til 1814',
    ],
    baand: [
        '1537: kirken blir lagt under staten',
        'Kongen er sjefen',
        'Alle skal være lutherske',
        'Ikke et valg',
    ],
    skillet: [
        '1814: Grunnloven, paragraf 2',
        'Staten styrer kirken',
        '2012: Grunnloven endres',
        '2017: kirken skilles fra staten',
        'Men ikke helt',
    ],
    folk: [
        'Fortsatt det klart største',
        'Andre tros- og livssynssamfunn vokser',
        'Innvandring',
        'Uten gudstro',
        'Tvangen er borte',
    ],
};

export function SekulariseringBygda({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'natt';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [10, 10, 30] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <SekOverskrift tekst={tekst} mork={modus === 'natt'} />
            {modus === 'folk' && beat === 1 && (
                <div className="absolute inset-x-0 bottom-[6%] flex justify-center gap-6 pointer-events-none">
                    <AnimatePresence>
                        <motion.div
                            key="for"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                        >
                            <div className="text-4xl font-black text-slate-500 tabular-nums">
                                <TelleTall verdi={384000} />
                            </div>
                            <div className="text-lg font-semibold text-slate-500">i 2006</div>
                        </motion.div>
                        <motion.div
                            key="etter"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center border-2 border-teal-500"
                        >
                            <div className="text-4xl font-black text-teal-700 tabular-nums">
                                <TelleTall verdi={697000} forsinkelse={1.2} />
                            </div>
                            <div className="text-lg font-semibold text-slate-500">i 2020</div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}
            {modus === 'folk' && beat === 1 && (
                <div className="absolute inset-x-0 bottom-[22%] flex justify-center pointer-events-none">
                    <div className="px-4 py-1.5 rounded-xl bg-slate-900/80 text-white text-xl font-bold">
                        Medlemmer utenfor Den norske kirke
                    </div>
                </div>
            )}
        </div>
    );
}
