import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Bildet som filmen tolker, i 3D, i tre modus:
 * - regn: en gutt sitter alene i regnet (motivet i artikkelens første eksempel).
 * - skole: en jente står for seg selv i skolegården, mens de andre står i grupper.
 * - by: mannen i «Jeg ser» står mellom høye hus med tusen vinduer under gråblå skyer.
 */

type Modus = 'regn' | 'skole' | 'by';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function tilfeldig(frø: number) {
    let s = frø;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'regn') {
        switch (beat) {
            case 0:
                return { pos: v(9 - t * 0.15, 4.5, 13), se: v(0, 1, 0) };
            case 1:
                return { pos: v(3.2, 2.2, 5), se: v(0, 1.1, 0) };
            case 2:
                return { pos: v(-2.6 + t * 0.05, 1.5, 3.8), se: v(0, 1.1, 0) };
            default:
                return { pos: v(-10 + t * 0.2, 6, 15), se: v(0, 1, 0) };
        }
    }
    if (modus === 'skole') {
        switch (beat) {
            case 0:
                return { pos: v(0, 11, 28), se: v(0, 2, -4) };
            case 1:
                return { pos: v(13, 3, 9), se: v(9, 1.2, 2) };
            case 2:
                return { pos: v(15 - t * 0.2, 7, 18), se: v(2, 1, 0) };
            default:
                return { pos: v(11.5, 1.8, 5.5), se: v(9, 1.4, 2) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(18, 14, 26), se: v(0, 5, 0) };
        case 1:
            return { pos: v(1.4, 2.6, 7.5), se: v(0, 3.2, -8) };
        case 2:
            return { pos: v(-3.5, 2.5, 9), se: v(5, 11 + t * 0.15, -8) };
        default:
            return { pos: v(4, 34 + t * 0.4, 18), se: v(0, 0, 0) };
    }
}

/** En enkel figur av en kapsel og en kule. */
function Figur({
    pos,
    farge,
    sitter = false,
    hode = '#e0b98a',
    retning = 0,
}: {
    pos: [number, number, number];
    farge: string;
    sitter?: boolean;
    hode?: string;
    retning?: number;
}) {
    return (
        <group position={pos} rotation={[0, retning, 0]}>
            <mesh position={[0, sitter ? 0.75 : 0.85, 0]} rotation={[sitter ? 0.35 : 0, 0, 0]}>
                <capsuleGeometry args={[0.32, sitter ? 0.5 : 0.8, 4, 8]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, sitter ? 1.35 : 1.75, sitter ? 0.22 : 0]}>
                <sphereGeometry args={[0.27, 12, 10]} />
                <meshStandardMaterial color={hode} flatShading />
            </mesh>
            {sitter && (
                <mesh position={[0, 0.35, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
                    <capsuleGeometry args={[0.2, 0.5, 4, 6]} />
                    <meshStandardMaterial color="#334155" flatShading />
                </mesh>
            )}
        </group>
    );
}

/** Regndråper som faller, alle i én instans. */
function Regn({ playing, mengde }: { playing: boolean; mengde: number }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const dråper = useMemo(() => {
        const r = tilfeldig(7);
        return Array.from({ length: mengde }, () => ({
            x: (r() - 0.5) * 24,
            y: r() * 12,
            z: (r() - 0.5) * 20,
            fart: 9 + r() * 4,
        }));
    }, [mengde]);
    const m = useMemo(() => new THREE.Matrix4(), []);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        dråper.forEach((d, i) => {
            d.y -= d.fart * dt;
            if (d.y < 0) d.y += 12;
            m.makeTranslation(d.x, d.y, d.z);
            g.setMatrixAt(i, m);
        });
        g.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, mengde]} frustumCulled={false}>
            <boxGeometry args={[0.025, 0.45, 0.025]} />
            <meshBasicMaterial color="#cbd5e1" transparent opacity={0.6} />
        </instancedMesh>
    );
}

function RegnScene({ playing }: { playing: boolean }) {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[80, 80]} />
                <meshStandardMaterial color="#56606e" emissive="#1e2530" roughness={0.3} />
            </mesh>
            {/* Fortauskanten gutten sitter på */}
            <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[14, 0.4, 1.2]} />
                <meshStandardMaterial color="#8a919c" flatShading />
            </mesh>
            {/* Pytter */}
            {[
                [-3, 2.4, 1.6],
                [2.6, 3.4, 1.1],
                [5.5, 1.8, 0.8],
            ].map(([x, z, r], i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]}>
                    <circleGeometry args={[r, 20]} />
                    <meshStandardMaterial color="#7d8ca3" emissive="#2a3546" roughness={0.1} />
                </mesh>
            ))}
            {/* Gatelykt */}
            <mesh position={[-4, 2.5, -0.6]}>
                <cylinderGeometry args={[0.08, 0.1, 5, 8]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[-4, 5.05, -0.6]}>
                <sphereGeometry args={[0.32, 12, 10]} />
                <meshBasicMaterial color="#fde68a" toneMapped={false} />
            </mesh>
            <pointLight position={[-4, 4.6, -0.2]} intensity={6} distance={10} color="#fcd34d" />
            {/* Husvegg bak */}
            <mesh position={[0, 4, -4]}>
                <boxGeometry args={[30, 8, 1]} />
                <meshStandardMaterial color="#6b7280" emissive="#1f2937" flatShading />
            </mesh>
            <Figur pos={[0.4, 0.4, 0.1]} farge="#1d4ed8" sitter retning={0.25} />
            <Regn playing={playing} mengde={420} />
        </>
    );
}

const GRUPPER: [number, number][] = [
    [-7, -1],
    [-2, 4],
    [3, -3],
];
const FARGER = ['#dc2626', '#f59e0b', '#16a34a', '#7c3aed', '#0891b2', '#db2777'];

function SkoleScene({ beat }: { beat: number }) {
    const ring = useRef<THREE.Mesh>(null);
    const folk = useMemo(() => {
        const r = tilfeldig(11);
        const ut: { x: number; z: number; farge: string; retning: number }[] = [];
        GRUPPER.forEach(([gx, gz], gi) => {
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + r();
                ut.push({
                    x: gx + Math.cos(a) * 1.1,
                    z: gz + Math.sin(a) * 1.1,
                    farge: FARGER[(gi * 4 + i) % FARGER.length],
                    retning: -a - Math.PI / 2,
                });
            }
        });
        return ut;
    }, []);
    useFrame(({ clock }) => {
        const m = ring.current;
        if (!m) return;
        const på = beat >= 1;
        m.visible = på;
        m.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.06);
    });
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[90, 90]} />
                <meshStandardMaterial color="#9aa5b1" emissive="#2b3440" />
            </mesh>
            {/* Skolebygget */}
            <mesh position={[-2, 3, -10]}>
                <boxGeometry args={[22, 6, 4]} />
                <meshStandardMaterial color="#c2703d" flatShading />
            </mesh>
            {Array.from({ length: 8 }, (_, i) => (
                <mesh key={i} position={[-11 + i * 2.6, 3.6, -7.95]}>
                    <planeGeometry args={[1.4, 1.2]} />
                    <meshStandardMaterial
                        color="#dbeafe"
                        emissive="#93c5fd"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            ))}
            <mesh position={[-2, 1.1, -7.95]}>
                <planeGeometry args={[1.8, 2.2]} />
                <meshStandardMaterial color="#3f2a1c" />
            </mesh>
            {/* Trær */}
            {[
                [-14, -4],
                [12, -6],
            ].map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 1.2, 0]}>
                        <cylinderGeometry args={[0.25, 0.3, 2.4, 8]} />
                        <meshStandardMaterial color="#6b4f36" />
                    </mesh>
                    <mesh position={[0, 3.4, 0]}>
                        <icosahedronGeometry args={[1.8, 0]} />
                        <meshStandardMaterial color="#c2410c" flatShading />
                    </mesh>
                </group>
            ))}
            {folk.map((f, i) => (
                <Figur key={i} pos={[f.x, 0, f.z]} farge={f.farge} retning={f.retning} />
            ))}
            {/* Jenta, for seg selv */}
            <Figur pos={[9, 0, 2]} farge="#1d4ed8" retning={-0.9} />
            <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[9, 0.03, 2]}>
                <ringGeometry args={[0.8, 1, 32]} />
                <meshBasicMaterial color="#facc15" />
            </mesh>
        </>
    );
}

interface Hus {
    x: number;
    z: number;
    b: number;
    d: number;
    h: number;
    farge: string;
}

function lagHus(): Hus[] {
    const r = tilfeldig(23);
    const ut: Hus[] = [];
    const farger = ['#9aa3b5', '#8a8f9c', '#a8a29e', '#7d8597', '#b4b8c4'];
    for (let i = 0; i < 6; i++) {
        for (const side of [-1, 1]) {
            ut.push({
                x: side * (7 + r() * 1.5),
                z: 4 - i * 6.5,
                b: 5 + r() * 1.5,
                d: 5,
                h: 10 + r() * 10,
                farge: farger[Math.floor(r() * farger.length)],
            });
        }
    }
    return ut;
}

/** Vinduer på alle husveggene mot gata, i én instans. */
function Vinduer({ hus, lys }: { hus: Hus[]; lys: React.RefObject<number> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const plasser = useMemo(() => {
        const ut: THREE.Matrix4[] = [];
        hus.forEach((h) => {
            const xVegg = h.x - Math.sign(h.x) * (h.b / 2 + 0.02);
            const kol = 3;
            const rader = Math.floor((h.h - 2) / 1.6);
            for (let r = 0; r < rader; r++) {
                for (let k = 0; k < kol; k++) {
                    const m = new THREE.Matrix4();
                    m.makeRotationY(h.x > 0 ? -Math.PI / 2 : Math.PI / 2);
                    m.setPosition(xVegg, 1.8 + r * 1.6, h.z - 1.6 + k * 1.6);
                    ut.push(m);
                }
            }
        });
        return ut;
    }, [hus]);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useEffect(() => {
        const g = ref.current;
        if (!g) return;
        plasser.forEach((m, i) => g.setMatrixAt(i, m));
        g.instanceMatrix.needsUpdate = true;
    }, [plasser]);
    useFrame(() => {
        if (mat.current) mat.current.emissiveIntensity = 0.15 + (lys.current ?? 0) * 0.9;
    });
    return (
        <instancedMesh
            ref={ref}
            args={[undefined, undefined, plasser.length]}
            frustumCulled={false}
        >
            <planeGeometry args={[0.8, 1]} />
            <meshStandardMaterial
                ref={mat}
                color="#e5e7eb"
                emissive="#fde68a"
                emissiveIntensity={0.15}
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    );
}

/** Alle skyene deler ett materiale, så de mørkner sammen. */
function Skyer({ mørke }: { mørke: React.RefObject<number> }) {
    const mat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#b8c4d6',
                emissive: '#4b5a72',
                flatShading: true,
            }),
        []
    );
    const lys = useMemo(() => new THREE.Color('#b8c4d6'), []);
    const tung = useMemo(() => new THREE.Color('#71809a'), []);
    const skyer = useMemo(() => {
        const r = tilfeldig(3);
        return Array.from({ length: 9 }, () => ({
            x: (r() - 0.5) * 50,
            y: 21 + r() * 5,
            z: -10 - r() * 30,
            s: 5 + r() * 5,
        }));
    }, []);
    useFrame(() => {
        mat.color.copy(lys).lerp(tung, mørke.current ?? 0);
    });
    return (
        <group>
            {skyer.map((s, i) => (
                <mesh
                    key={i}
                    position={[s.x, s.y, s.z]}
                    scale={[s.s * 1.6, s.s * 0.5, s.s]}
                    material={mat}
                >
                    <icosahedronGeometry args={[1, 1]} />
                </mesh>
            ))}
        </group>
    );
}

function ByScene({ lys, mørke }: { lys: React.RefObject<number>; mørke: React.RefObject<number> }) {
    const hus = useMemo(() => lagHus(), []);
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial color="#6b7280" emissive="#1f2937" />
            </mesh>
            {hus.map((h, i) => (
                <mesh key={i} position={[h.x, h.h / 2, h.z]}>
                    <boxGeometry args={[h.b, h.h, h.d]} />
                    <meshStandardMaterial color={h.farge} flatShading />
                </mesh>
            ))}
            <Vinduer hus={hus} lys={lys} />
            <Skyer mørke={mørke} />
            {/* Folk langt borte i gata, mannen nærmest */}
            {[
                [-1.8, -8],
                [1.5, -12],
                [-0.6, -17],
                [2.2, -21],
            ].map(([x, z], i) => (
                <Figur key={i} pos={[x, 0, z]} farge="#475569" retning={i % 2 ? 0.4 : -0.3} />
            ))}
            <Figur pos={[0, 0, 1]} farge="#1e293b" retning={Math.PI} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 1]}>
                <ringGeometry args={[0.8, 1.05, 32]} />
                <meshBasicMaterial color="#facc15" />
            </mesh>
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const lys = useRef(0);
    const mørke = useRef(0);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        // Vinduene lyser og skyene mørkner fra beat 2. Første bilde hopper rett dit.
        const kveld = beat >= 2 ? 1 : 0;
        lys.current = forste.current ? kveld : damp(lys.current, kveld, 1.5, dt);
        mørke.current = forste.current ? kveld : damp(mørke.current, kveld, 0.8, dt);

        const mål = kameraFor(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
    });

    const himmel = modus === 'regn' ? '#4b5563' : modus === 'skole' ? '#cbd5e1' : '#94a3b8';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog
                attach="fog"
                args={[himmel, modus === 'by' ? 40 : 20, modus === 'by' ? 110 : 70]}
            />
            <ambientLight intensity={modus === 'regn' ? 0.7 : 0.9} color="#dbe4f0" />
            <hemisphereLight args={['#c7d2fe', '#3b3a2e', 0.7]} />
            <directionalLight position={[10, 20, 12]} intensity={modus === 'regn' ? 0.6 : 1.4} />
            {modus === 'regn' && <RegnScene playing={playing} />}
            {modus === 'skole' && <SkoleScene beat={beat} />}
            {modus === 'by' && <ByScene lys={lys} mørke={mørke} />}
        </>
    );
}

const TEKSTER: Record<Modus, (string | null)[]> = {
    regn: [null, 'Motiv: en gutt og regn', 'Tema: ensomhet?', 'Det du ser, og det du kjenner'],
    skole: [
        'Handling: ny by, ny skole',
        'Handlingen hører til henne',
        'Tema: ensomhet, utenforskap',
        'Tema: identitet',
    ],
    by: ['Jeg ser, 1893', 'Motiv: en mann ser på byen', 'Skyer, høye hus, vinduer', 'Feil klode'],
};

export function TemaGatebildet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'regn';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = TEKSTER[modus][Math.min(beat, TEKSTER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.2, far: 300, position: [9, 4.5, 13] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
