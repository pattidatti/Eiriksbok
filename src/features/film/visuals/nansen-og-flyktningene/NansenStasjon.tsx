import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Jernbanestasjonen i 3D. Sergej (en oppdiktet flyktning) går fra luke til luke.
 * «uten»: ingen papirer, hver luke lyser rødt. «med»: et Nansenpass, de samme lukene
 * lyser grønt og døra ut av stasjonen åpner seg. Alt styres av beat, så eleven kan
 * hoppe rett til en hvilken som helst replikk.
 */

type Modus = 'uten' | 'med';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Lukene står langs bakveggen (z = -5). */
const LUKER = [
    { x: -15, navn: 'Grensen' },
    { x: -5, navn: 'Politiet' },
    { x: 5, navn: 'Fabrikken' },
    { x: 15, navn: 'Framtida' },
];
const DOR_X = 26;

/** Hvor mange luker Sergej har vært innom (-1 = ingen). */
function besokt(modus: Modus, beat: number) {
    if (modus === 'uten') return [-1, -1, 0, 3, 3][beat] ?? 3;
    return [-1, 0, 2, 3][beat] ?? 3;
}

/** Hvor Sergej står på hver beat (x, z). */
function sergejFor(modus: Modus, beat: number): [number, number] {
    if (modus === 'uten') {
        return (
            [
                [-24, 5],
                [-22, 2],
                [-15, -2.4],
                [5, -2.4],
                [15, 1.5],
            ] as [number, number][]
        )[Math.min(beat, 4)];
    }
    return (
        [
            [-22, 2],
            [-15, -2.4],
            [5, -2.4],
            [DOR_X + 1, -1],
        ] as [number, number][]
    )[Math.min(beat, 3)];
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'uten') {
        switch (beat) {
            case 0:
                return { pos: v(-11 - t * 0.2, 5.5, -2), se: v(-25, 2.2, 6) };
            case 1:
                return { pos: v(-34, 4, 13), se: v(-4, 2, -3) };
            case 2:
                return { pos: v(-10.5, 4, 8.5), se: v(-15, 3.6, -4) };
            case 3:
                return { pos: v(5, 5, 12), se: v(5, 3.4, -4) };
            default:
                return { pos: v(2, 26 + t * 0.4, 36), se: v(0, 0, -1) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-26, 4, 10), se: v(-21, 2.4, 0) };
        case 1:
            return { pos: v(-10.5, 4, 8.5), se: v(-15, 3.6, -4) };
        case 2:
            return { pos: v(9, 5, 12), se: v(1, 3.6, -4) };
        default:
            return { pos: v(6, 20, 32), se: v(6, 0, -1) };
    }
}

const ROD = '#dc2626';
const GRONN = '#16a34a';
const GRA = '#94a3b8';

function lampeFarge(modus: Modus, beat: number, i: number) {
    if (i > besokt(modus, beat)) return GRA;
    return modus === 'uten' ? ROD : GRONN;
}

function Figur({ farge, pass = false }: { farge: string; pass?: boolean }) {
    return (
        <group>
            <mesh position={[0, 1.05, 0]}>
                <cylinderGeometry args={[0.38, 0.45, 1.5, 12]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 2.15, 0]}>
                <sphereGeometry args={[0.36, 14, 12]} />
                <meshStandardMaterial color="#f1c9a5" flatShading />
            </mesh>
            <mesh position={[0, 2.42, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.14, 12]} />
                <meshStandardMaterial color="#1f2937" flatShading />
            </mesh>
            {/* Kofferten */}
            <mesh position={[0.62, 0.45, 0.1]}>
                <boxGeometry args={[0.28, 0.65, 0.9]} />
                <meshStandardMaterial color="#7c2d12" flatShading />
            </mesh>
            {/* Gul ring på bakken, så Sergej synes i mengden */}
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.7, 1.05, 24]} />
                <meshBasicMaterial color="#facc15" />
            </mesh>
            {pass && (
                <mesh position={[-0.55, 1.35, 0.35]} rotation={[0, 0.3, 0.2]}>
                    <boxGeometry args={[0.5, 0.7, 0.06]} />
                    <meshStandardMaterial color="#1d4ed8" emissive="#1e40af" emissiveIntensity={0.6} />
                </mesh>
            )}
        </group>
    );
}

function Luke({
    x,
    navn,
    farge,
    modus,
    vis,
}: {
    x: number;
    navn: string;
    farge: string;
    modus: Modus;
    vis: boolean;
}) {
    const tent = farge !== GRA;
    return (
        <group position={[x, 0, -5]}>
            <mesh position={[0, 2.2, 0]}>
                <boxGeometry args={[4.4, 4.4, 2]} />
                <meshStandardMaterial color="#7a5a3a" flatShading />
            </mesh>
            {/* Vinduet */}
            <mesh position={[0, 2.7, 1.01]}>
                <planeGeometry args={[2.6, 1.5]} />
                <meshStandardMaterial
                    color={tent ? farge : '#cbd5e1'}
                    emissive={tent ? farge : '#475569'}
                    emissiveIntensity={tent ? 0.55 : 0.15}
                />
            </mesh>
            {/* Disken */}
            <mesh position={[0, 1.45, 1.3]}>
                <boxGeometry args={[3, 0.18, 0.7]} />
                <meshStandardMaterial color="#4b3621" flatShading />
            </mesh>
            {/* Lampa over luka */}
            <mesh position={[0, 4.95, 0.4]}>
                <sphereGeometry args={[0.42, 14, 12]} />
                <meshStandardMaterial
                    color={farge}
                    emissive={farge}
                    emissiveIntensity={tent ? 1.1 : 0.1}
                />
            </mesh>
            {vis && (
                <Html position={[0, 6.1, 0.4]} center zIndexRange={[10, 0]}>
                    <div className="flex flex-col items-center gap-1 select-none pointer-events-none">
                        <div className="px-3 py-1 rounded-xl bg-white/95 text-slate-900 font-bold text-base md:text-xl shadow-lg whitespace-nowrap">
                            {navn}
                        </div>
                        {tent && (
                            <div
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-lg"
                                style={{ background: farge }}
                            >
                                {modus === 'uten' ? '✕' : '✓'}
                            </div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
}

/** Andre flyktninger på perrongen, som dukker opp når kameraet trekker seg ut. */
function Mengden({ synlig }: { synlig: boolean }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const skala = useRef(0);
    const plass = useMemo(
        () =>
            Array.from({ length: 70 }, (_, i) => {
                const x = -27 + ((i * 37) % 54) + Math.sin(i * 3.1) * 0.6;
                const z = -0.5 + ((i * 13) % 8) + Math.cos(i * 2.3) * 0.4;
                return [x, z] as const;
            }).filter(([x, z]) => !(Math.abs(x - 15) < 2 && z < 4)),
        []
    );
    const m = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, delta) => {
        skala.current = damp(skala.current, synlig ? 1 : 0, 2.2, Math.min(delta, 0.05));
        const s = Math.max(0.001, skala.current);
        plass.forEach(([x, z], i) => {
            m.position.set(x, 1.05 * s, z);
            m.scale.set(s, s, s);
            m.updateMatrix();
            kropp.current?.setMatrixAt(i, m.matrix);
            m.position.set(x, 2.15 * s, z);
            m.updateMatrix();
            hode.current?.setMatrixAt(i, m.matrix);
        });
        if (kropp.current) kropp.current.instanceMatrix.needsUpdate = true;
        if (hode.current) hode.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, plass.length]}>
                <cylinderGeometry args={[0.38, 0.45, 1.5, 8]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, plass.length]}>
                <sphereGeometry args={[0.36, 8, 6]} />
                <meshStandardMaterial color="#cbd5e1" flatShading />
            </instancedMesh>
        </>
    );
}

function Tog({ x }: { x: number }) {
    return (
        <group position={[x, 0, 11]}>
            {[0, 1, 2].map((i) => (
                <group key={i} position={[-i * 11, 0, 0]}>
                    <mesh position={[0, 2.6, 0]}>
                        <boxGeometry args={[10, 3.6, 3.2]} />
                        <meshStandardMaterial color={i === 0 ? '#1f2937' : '#14532d'} flatShading />
                    </mesh>
                    <mesh position={[0, 3.2, 1.62]}>
                        <planeGeometry args={[8, 1]} />
                        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.4} />
                    </mesh>
                    <mesh position={[0, 4.55, 0]}>
                        <boxGeometry args={[10.2, 0.3, 3.4]} />
                        <meshStandardMaterial color="#111827" flatShading />
                    </mesh>
                </group>
            ))}
            <mesh position={[4, 5.4, 0]}>
                <cylinderGeometry args={[0.5, 0.6, 1.8, 10]} />
                <meshStandardMaterial color="#111827" flatShading />
            </mesh>
        </group>
    );
}

function Skinner() {
    const sviller = useRef<THREE.InstancedMesh>(null);
    const ANTALL = 60;
    useLayoutEffect(() => {
        const m = new THREE.Object3D();
        for (let i = 0; i < ANTALL; i++) {
            m.position.set(-90 + i * 3, 0.1, 11);
            m.updateMatrix();
            sviller.current?.setMatrixAt(i, m.matrix);
        }
        if (sviller.current) sviller.current.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <>
            <instancedMesh ref={sviller} args={[undefined, undefined, ANTALL]}>
                <boxGeometry args={[0.6, 0.2, 3.6]} />
                <meshStandardMaterial color="#57534e" flatShading />
            </instancedMesh>
            {[-0.8, 0.8].map((dz) => (
                <mesh key={dz} position={[0, 0.3, 11 + dz]}>
                    <boxGeometry args={[180, 0.2, 0.18]} />
                    <meshStandardMaterial color="#9ca3af" metalness={0.4} />
                </mesh>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const sergej = useRef<THREE.Group>(null);
    const tog = useRef<THREE.Group>(null);
    const dor = useRef<THREE.MeshStandardMaterial>(null);
    const kamSe = useRef(v(0, 2, 0));
    const forste = useRef(true);
    const sistBeat = useRef(beat);
    const beatTid = useRef(0);
    const tid = useRef(0);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (sistBeat.current !== beat) {
            sistBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        tid.current += dt;
        const t = beatTid.current;
        const hopp = forste.current;

        // Sergej går mot plassen sin for denne beaten, med litt gange-gynging.
        const s = sergej.current;
        if (s) {
            const [mx, mz] = sergejFor(modus, beat);
            const fx = hopp ? mx : damp(s.position.x, mx, 1.4, dt);
            const fz = hopp ? mz : damp(s.position.z, mz, 1.4, dt);
            const fart = Math.hypot(fx - s.position.x, fz - s.position.z) / Math.max(dt, 0.001);
            s.position.x = fx;
            s.position.z = fz;
            s.position.y = fart > 0.4 ? Math.abs(Math.sin(tid.current * 9)) * 0.12 : 0;
            const retning = mz < -1 && Math.abs(mx - fx) < 0.6 ? Math.PI : Math.PI / 2;
            s.rotation.y = hopp ? retning : damp(s.rotation.y, retning, 3, dt);
        }

        // Toget står inne på beat 0 og kjører ut fra beat 1.
        const g = tog.current;
        if (g) {
            const målX = modus === 'uten' && beat === 0 ? -6 : 140;
            g.position.x = hopp ? målX : damp(g.position.x, målX, beat === 1 ? 0.35 : 1, dt);
            g.visible = modus === 'uten';
        }

        if (dor.current) {
            const åpen = modus === 'med' && beat >= 3 ? 1.4 : 0.05;
            dor.current.emissiveIntensity = hopp
                ? åpen
                : damp(dor.current.emissiveIntensity, åpen, 1.5, dt);
        }

        const mål = kameraFor(modus, beat, t);
        const k = hopp ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
    });

    const visEtiketter = !(modus === 'uten' && beat < 2) && !(modus === 'med' && beat === 0);

    return (
        <>
            <color attach="background" args={['#d9d2c3']} />
            <fog attach="fog" args={['#d9d2c3', 60, 160]} />
            <ambientLight intensity={0.8} color="#f5efe3" />
            <directionalLight position={[-20, 40, 30]} intensity={1.1} color="#fff7e6" />
            <hemisphereLight args={['#f1ead9', '#5b4a3a', 0.45]} />

            {/* Bakken og perrongen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <planeGeometry args={[400, 400]} />
                <meshStandardMaterial color="#8b8273" />
            </mesh>
            <mesh position={[0, -0.25, 1]}>
                <boxGeometry args={[64, 0.5, 15]} />
                <meshStandardMaterial color="#b8ad99" flatShading />
            </mesh>
            {/* Bakveggen */}
            <mesh position={[0, 4, -6.5]}>
                <boxGeometry args={[64, 8, 1]} />
                <meshStandardMaterial color="#e4d8c2" flatShading />
            </mesh>
            {/* Taket over perrongen, med søyler */}
            <mesh position={[0, 8.2, -0.5]} rotation={[0.12, 0, 0]}>
                <boxGeometry args={[64, 0.35, 13]} />
                <meshStandardMaterial color="#6b4f3a" flatShading />
            </mesh>
            {[-30, -20, -10, 0, 10, 20, 30].map((x) => (
                <mesh key={x} position={[x, 4, 6]}>
                    <cylinderGeometry args={[0.25, 0.25, 8, 8]} />
                    <meshStandardMaterial color="#3f3f46" flatShading />
                </mesh>
            ))}
            {/* Døra ut av stasjonen */}
            <mesh position={[DOR_X + 2, 2.6, -5.95]}>
                <planeGeometry args={[3.4, 5.2]} />
                <meshStandardMaterial ref={dor} color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.05} />
            </mesh>

            {LUKER.map((l, i) => (
                <Luke
                    key={l.navn}
                    x={l.x}
                    navn={l.navn}
                    farge={lampeFarge(modus, beat, i)}
                    modus={modus}
                    vis={visEtiketter}
                />
            ))}

            <Skinner />
            <group ref={tog}>
                <Tog x={0} />
            </group>
            <Mengden synlig={modus === 'uten' && beat >= 4} />
            <group ref={sergej}>
                <Figur farge="#1e3a8a" pass={modus === 'med'} />
            </group>
        </>
    );
}

const MERKER: Record<Modus, string[]> = {
    uten: [
        '1922',
        'En fremmed stasjon',
        '«Hvor er papirene dine?»',
        'Bo og jobbe? Samme spørsmål',
        'Hundretusener uten papirer',
    ],
    med: ['Nå med Nansenpass', 'Grensen: Du kan søke', 'Bo og arbeide: Du kan søke', 'Samme luker, nytt svar'],
};

export function NansenStasjon({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'uten';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = MERKER[modus][Math.min(beat, MERKER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [-11, 5.5, -2] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute z-30 bottom-[4%] left-[3%] px-4 py-2 rounded-2xl bg-white/90 shadow-xl flex items-center gap-3">
                <div
                    className={`w-8 h-10 rounded-md ${modus === 'med' ? 'bg-blue-700' : 'bg-slate-300 border-2 border-dashed border-slate-500'}`}
                />
                <div className="font-bold text-slate-900 text-lg md:text-2xl">
                    {modus === 'med' ? 'Nansenpass' : 'Ingen papirer'}
                </div>
            </div>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-30 top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
