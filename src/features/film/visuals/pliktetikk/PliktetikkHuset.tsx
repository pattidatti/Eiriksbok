import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Huset i 3D en kveld under krigen. «dora»: huset, familien i kjelleren (bakken blir
 * gjennomsiktig), offiseren som banker på og spørsmålet. «morder»: morderen på døra, vennen
 * som sniker seg ut bakveien, og hvem som har ansvaret for hva.
 */

type Modus = 'dora' | 'morder';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Kameraets mål for hver beat. `t` er sekunder siden beaten startet. */
function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'dora') {
        switch (beat) {
            case 0:
                return { pos: v(16 - t * 0.35, 6.5, 22 - t * 0.4), se: v(0, 2.2, 0) };
            case 1:
                return { pos: v(6, 1.6, 10.5), se: v(0, -1.8, 0) };
            case 2:
                return { pos: v(7, 3.2, 12.5), se: v(0.4, 1.6, 3) };
            case 3:
                return { pos: v(3.2, 2.5, 10), se: v(0, 1.8, 3) };
            default:
                return { pos: v(-2 + t * 0.2, 9, 21), se: v(0, 0.5, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(7, 3.2, 12.5), se: v(0.4, 1.6, 3) };
        case 1:
            return { pos: v(10, 5, 16), se: v(0, 2, 1) };
        case 2:
            return { pos: v(-6, 17, 15), se: v(-4, 0, 0) };
        case 3:
            return { pos: v(4, 8, 19), se: v(-1, 1, 1) };
        default: {
            const a = 0.5 + t * 0.06;
            return { pos: v(Math.sin(a) * 20, 8, Math.cos(a) * 20), se: v(0, 1.5, 0) };
        }
    }
}

/** Menneskefigur av primitiver. */
function Figur({
    farge,
    skala = 1,
    lue = false,
}: {
    farge: string;
    skala?: number;
    lue?: boolean;
}) {
    return (
        <group scale={skala}>
            <mesh position={[0, 0.75, 0]}>
                <capsuleGeometry args={[0.32, 0.8, 4, 10]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 1.62, 0]}>
                <sphereGeometry args={[0.26, 12, 10]} />
                <meshStandardMaterial color="#e0b98a" flatShading />
            </mesh>
            {lue && (
                <mesh position={[0, 1.86, 0]}>
                    <cylinderGeometry args={[0.3, 0.3, 0.14, 12]} />
                    <meshStandardMaterial color="#1f2937" />
                </mesh>
            )}
        </group>
    );
}

function Tak() {
    const geo = useMemo(() => {
        const f = new THREE.Shape();
        f.moveTo(-4.6, 0);
        f.lineTo(4.6, 0);
        f.lineTo(0, 2.8);
        f.closePath();
        const g = new THREE.ExtrudeGeometry(f, { depth: 6.8, bevelEnabled: false });
        g.translate(0, 0, -3.4);
        return g;
    }, []);
    return (
        <mesh geometry={geo} position={[0, 4.4, 0]}>
            <meshStandardMaterial color="#7f1d1d" flatShading />
        </mesh>
    );
}

function Vindu({ x, y, z, ry = 0 }: { x: number; y: number; z: number; ry?: number }) {
    return (
        <group position={[x, y, z]} rotation={[0, ry, 0]}>
            <mesh>
                <planeGeometry args={[1.3, 1.3]} />
                <meshStandardMaterial color="#fcd34d" emissive="#f59e0b" emissiveIntensity={1.1} />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[0.08, 1.3]} />
                <meshBasicMaterial color="#3f2a1a" />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[1.3, 0.08]} />
                <meshBasicMaterial color="#3f2a1a" />
            </mesh>
        </group>
    );
}

/** Ringer på døra når det banker. */
function Banking({ aktiv, playing }: { aktiv: boolean; playing: boolean }) {
    const ringer = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, delta) => {
        if (playing) tid.current += Math.min(delta, 0.05);
        ringer.current.forEach((r, i) => {
            if (!r) return;
            const f = (tid.current * 0.9 + i / 3) % 1;
            r.scale.setScalar(0.4 + f * 1.8);
            const m = r.material as THREE.MeshBasicMaterial;
            m.opacity = aktiv ? (1 - f) * 0.8 : 0;
        });
    });
    return (
        <group position={[0, 1.3, 3.08]}>
            {[0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        ringer.current[i] = m;
                    }}
                >
                    <ringGeometry args={[0.55, 0.65, 32]} />
                    <meshBasicMaterial color="#fde68a" transparent opacity={0} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const forste = useRef(true);
    const sistBeat = useRef(beat);
    const beatTid = useRef(0);
    const kamSe = useRef(new THREE.Vector3(0, 2, 0));
    const bakke = useRef<THREE.MeshStandardMaterial>(null);
    const kjellerLys = useRef<THREE.PointLight>(null);
    const besok = useRef<THREE.Group>(null);
    const venn = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (sistBeat.current !== beat) {
            sistBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        const hopp = forste.current;

        // Bakken blir gjennomsiktig når vi ser ned i kjelleren.
        const rontgen = modus === 'dora' && (beat === 1 || beat === 4);
        if (bakke.current) {
            const mål = rontgen ? (beat === 1 ? 0.12 : 0.45) : 1;
            bakke.current.opacity = hopp ? mål : damp(bakke.current.opacity, mål, 2.5, dt);
        }
        if (kjellerLys.current) {
            const mål = rontgen ? 6 : 0;
            kjellerLys.current.intensity = hopp
                ? mål
                : damp(kjellerLys.current.intensity, mål, 2.5, dt);
        }

        // Den som banker på: går fra veien opp til døra.
        if (besok.current) {
            const vedDora = modus === 'morder' || beat >= 2;
            const mål = vedDora ? v(0.4, 0, 4.4) : v(9, 0, 16);
            if (hopp || (modus === 'dora' && beat < 2)) besok.current.position.copy(mål);
            else besok.current.position.lerp(mål, 1 - Math.exp(-1.6 * dt));
            besok.current.visible = vedDora;
        }

        // Vennen: ut bakdøra og bort langs husveggen.
        if (venn.current) {
            const ute = modus === 'morder' && beat >= 2;
            const mål = beat >= 2 ? v(-8.5, 0, 5.5) : v(1.5, 0, -3.6);
            if (beat === 2 && !hopp) {
                const f = Math.min(1, t / 4);
                const a = v(1.5, 0, -3.6);
                const b = v(-6.5, 0, -4.5);
                const c = v(-8.5, 0, 5.5);
                const p = f < 0.5 ? a.lerp(b, f * 2) : b.lerp(c, (f - 0.5) * 2);
                venn.current.position.copy(p);
            } else venn.current.position.copy(mål);
            venn.current.visible = ute;
        }

        const kam = kameraFor(modus, beat, t);
        camera.position.lerp(kam.pos, k);
        kamSe.current.lerp(kam.se, k);
        camera.lookAt(kamSe.current);
        forste.current = false;
    });

    const visRuter = modus === 'morder' && beat >= 2;

    return (
        <>
            <color attach="background" args={['#14213d']} />
            <fog attach="fog" args={['#1d2c4f', 30, 90]} />
            <ambientLight intensity={0.75} color="#b9c7e6" />
            <hemisphereLight args={['#5b74a8', '#1a2236', 0.6]} />
            <directionalLight position={[-12, 20, 10]} intensity={0.8} color="#c7d6f5" />
            <Stars radius={80} depth={20} count={1200} factor={4} fade speed={0.2} />

            {/* Bakken. Gjennomsiktig i kjeller-beatene. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial
                    ref={bakke}
                    color="#3b4a3a"
                    emissive="#1c2a22"
                    transparent
                    opacity={1}
                />
            </mesh>
            {/* Veien foran huset */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 11]}>
                <planeGeometry args={[60, 3.2]} />
                <meshStandardMaterial color="#4b5563" emissive="#1f2937" />
            </mesh>

            {/* Kjelleren: et varmt rom under huset */}
            <group position={[0, -2.6, 0]}>
                <mesh>
                    <boxGeometry args={[7.2, 2.6, 5.4]} />
                    <meshStandardMaterial color="#8a6a4a" emissive="#3a2414" side={THREE.BackSide} />
                </mesh>
                <pointLight ref={kjellerLys} position={[0, 0.6, 0]} color="#ffbe6b" intensity={0} distance={12} />
                <mesh position={[0, 0.9, 0]}>
                    <sphereGeometry args={[0.18, 10, 8]} />
                    <meshBasicMaterial color="#ffd27a" />
                </mesh>
                {[
                    [-2, -1.3, 0.6, '#475569', 0.85],
                    [-0.8, -1.3, 1.1, '#9f1239', 0.8],
                    [0.6, -1.3, 0.8, '#1e40af', 0.6],
                    [1.7, -1.3, 1.2, '#065f46', 0.55],
                ].map(([x, y, z, f, s], i) => (
                    <group key={i} position={[x as number, y as number, z as number]}>
                        <Figur farge={f as string} skala={s as number} />
                    </group>
                ))}
            </group>

            {/* Huset */}
            <mesh position={[0, 2.2, 0]}>
                <boxGeometry args={[8, 4.4, 6]} />
                <meshStandardMaterial color="#d6c6a8" emissive="#3a3226" flatShading />
            </mesh>
            <Tak />
            <mesh position={[2.4, 7, -1]}>
                <boxGeometry args={[0.7, 1.6, 0.7]} />
                <meshStandardMaterial color="#57534e" />
            </mesh>
            {/* Dør foran og bak */}
            <mesh position={[0, 1.1, 3.02]}>
                <planeGeometry args={[1.2, 2.2]} />
                <meshStandardMaterial color="#5b3a1e" emissive="#2a1a0c" />
            </mesh>
            <mesh position={[1.5, 1.1, -3.02]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[1.2, 2.2]} />
                <meshStandardMaterial
                    color={modus === 'morder' && beat >= 2 ? '#fcd34d' : '#5b3a1e'}
                    emissive={modus === 'morder' && beat >= 2 ? '#f59e0b' : '#2a1a0c'}
                />
            </mesh>
            {/* Lykt over døra */}
            <mesh position={[0, 2.55, 3.15]}>
                <sphereGeometry args={[0.16, 10, 8]} />
                <meshBasicMaterial color="#fff1c2" />
            </mesh>
            <pointLight position={[0, 2.6, 4]} color="#ffd9a0" intensity={3} distance={9} />
            <Vindu x={-2.6} y={2.6} z={3.02} />
            <Vindu x={2.6} y={2.6} z={3.02} />
            <Vindu x={4.02} y={2.6} z={0} ry={Math.PI / 2} />
            <Vindu x={-4.02} y={2.6} z={0} ry={-Math.PI / 2} />

            {/* Trær langs veien */}
            {[-12, -8, 9, 13].map((x, i) => (
                <group key={x} position={[x, 0, 6 - (i % 2) * 3]}>
                    <mesh position={[0, 0.8, 0]}>
                        <cylinderGeometry args={[0.2, 0.25, 1.6, 6]} />
                        <meshStandardMaterial color="#4a3423" />
                    </mesh>
                    <mesh position={[0, 2.6, 0]}>
                        <coneGeometry args={[1.3, 3, 7]} />
                        <meshStandardMaterial color="#24432f" emissive="#0f1f16" flatShading />
                    </mesh>
                </group>
            ))}

            <group ref={besok} position={[9, 0, 16]}>
                <group rotation={[0, Math.PI, 0]}>
                    <Figur farge={modus === 'dora' ? '#3f4a3a' : '#44403c'} lue={modus === 'dora'} />
                </group>
            </group>
            <group ref={venn} position={[1.5, 0, -3.6]}>
                <Figur farge="#2563eb" />
            </group>

            <Banking aktiv={modus === 'dora' && beat === 2} playing={playing} />

            {visRuter && (
                <>
                    <Line
                        points={[
                            [1.5, 0.08, -3.6],
                            [-6.5, 0.08, -4.5],
                            [-8.5, 0.08, 5.5],
                        ]}
                        color="#60a5fa"
                        lineWidth={4}
                        dashed
                        dashSize={0.6}
                        gapSize={0.4}
                    />
                    {beat >= 3 || beat === 2 ? (
                        <Line
                            points={[
                                [0.4, 0.08, 4.4],
                                [-4, 0.08, 6.5],
                                [-7.6, 0.08, 6],
                            ]}
                            color="#f87171"
                            lineWidth={4}
                        />
                    ) : null}
                </>
            )}
        </>
    );
}

interface Merke {
    id: string;
    tekst: string;
    tone?: 'lys' | 'rod' | 'bla';
}

function merkerFor(modus: Modus, beat: number): Merke[] {
    if (modus === 'dora') {
        return [
            [{ id: 'kveld', tekst: 'Tyskland, under andre verdenskrig' }],
            [{ id: 'kjeller', tekst: 'I kjelleren: en jødisk familie i skjul' }],
            [{ id: 'bank', tekst: 'Gestapo banker på', tone: 'rod' as const }],
            [{ id: 'sporsmal', tekst: 'Skjuler du noen jøder i huset ditt?' }],
            [{ id: 'hva', tekst: 'Hva gjør du?', tone: 'rod' as const }],
        ][Math.min(beat, 4)];
    }
    return [
        [{ id: 'm0', tekst: 'Morderen spør etter vennen din', tone: 'rod' as const }],
        [{ id: 'm1', tekst: 'Du lyver: Han har stukket av' }],
        [
            { id: 'm2a', tekst: 'Vennen går ut bakveien', tone: 'bla' as const },
            { id: 'm2b', tekst: 'Morderen går samme vei', tone: 'rod' as const },
        ],
        [
            { id: 'm3a', tekst: 'Du sier sant: din plikt', tone: 'bla' as const },
            { id: 'm3b', tekst: 'Det han gjør: hans ansvar', tone: 'rod' as const },
        ],
        [{ id: 'm4', tekst: 'Regler er regler' }],
    ][Math.min(beat, 4)];
}

const TONE = {
    lys: 'bg-white/90 text-slate-900',
    rod: 'bg-red-700/90 text-white',
    bla: 'bg-blue-700/90 text-white',
} as const;

export function PliktetikkHuset({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'dora';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = merkerFor(modus, beat);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [16, 6.5, 22] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute top-[7%] left-0 right-0 flex flex-col items-center gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {merker.map((m, i) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.6 }}
                            className={`px-5 py-2 rounded-2xl font-display font-bold text-3xl shadow-xl whitespace-nowrap ${TONE[m.tone ?? 'lys']}`}
                        >
                            {m.tekst}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
