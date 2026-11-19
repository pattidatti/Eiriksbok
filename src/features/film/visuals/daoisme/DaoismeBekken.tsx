import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp } from './damp';
import { Overskrift } from './felles';

/**
 * Bekken i fjellet (3D).
 * - «stein»: vannet renner rundt steinen, og om hundre år er steinen slipt ned.
 * - «dao»: stien langs bekken, den skjulte kraften, frøet som spirer og vannet som renner ned.
 */
type Modus = 'stein' | 'dao';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const STEIN_X = 4;
const FOSS_X = -6;
const VANN_Y = 0.22;
const NEDRE_Y = -2.8;

const OVERSKRIFT: Record<Modus, string[]> = {
    stein: [
        'En bekk med en stein',
        'Vannet stopper ikke. Det renner rundt.',
        'Steinen er hard. Vannet er mykt.',
        'Om hundre år: steinen er slipt ned',
    ],
    dao: [
        'Dao betyr «vei»',
        'Den skjulte kraften bak alt',
        'Et frø spirer av seg selv',
        'Vann renner nedover av seg selv',
    ],
};

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'stein') {
        switch (beat) {
            case 0:
                return { pos: v(15 - t * 0.3, 6, 12), se: v(3, 0, 0) };
            case 1:
                return { pos: v(9, 2.6, 5), se: v(3.2, 0.2, 0) };
            case 2:
                return { pos: v(7.5, 3, -5.5), se: v(3.6, 0.4, 0) };
            default:
                return { pos: v(10, 5, 7), se: v(3.6, 0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(13, 4.5, 11), se: v(2, 0.6, 3) };
        case 1:
            return { pos: v(16, 8, 15), se: v(0, 0, 0) };
        case 2:
            return { pos: v(4.6, 1.9, 7.4), se: v(1.6, 1, 3.2) };
        default:
            return { pos: v(-15, -0.6, 7.5), se: v(-6, -1.2, 0) };
    }
}

const STROM = 240;

/** Vannet: små skumstriper som renner mot venstre, rundt steinen og ned fossen. */
function Strom({ steinSkala }: { steinSkala: React.RefObject<number> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const deler = useMemo(
        () =>
            Array.from({ length: STROM }, (_, i) => ({
                x: 22 - ((i * 37) % 44),
                z: (((i * 53) % 100) / 100) * 3.2 - 1.6,
                fart: 1.8 + ((i * 17) % 10) / 10,
            })),
        []
    );
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = Math.min(rawDt, 0.05);
        const r = 1.25 * (steinSkala.current ?? 1);
        deler.forEach((d, i) => {
            d.x -= d.fart * dt;
            if (d.x < -18) d.x = 22;
            const nar = Math.exp(-((d.x - STEIN_X) ** 2) / 1.6);
            const tegn = d.z >= 0 ? 1 : -1;
            const z = d.z + tegn * Math.max(0, r - Math.abs(d.z)) * nar;
            let y =
                VANN_Y + 0.05 + 0.18 * Math.exp(-((d.x - STEIN_X - 1.2) ** 2) / 0.8) * (r / 1.25);
            if (d.x < FOSS_X) y = Math.max(NEDRE_Y + 0.05, VANN_Y - 2.2 * (FOSS_X - d.x) ** 2);
            o.position.set(d.x, y, z);
            o.scale.set(0.38, 0.05, 0.09);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, STROM]} frustumCulled={false}>
            <sphereGeometry args={[1, 6, 4]} />
            <meshBasicMaterial color="#f0f9ff" transparent opacity={0.85} />
        </instancedMesh>
    );
}

const GLOD = 90;

/** Den skjulte kraften: små lys som driver rolig gjennom alt. */
function Kraften({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    const tid = useRef(0);
    const o = useMemo(() => new THREE.Object3D(), []);
    const deler = useMemo(
        () =>
            Array.from({ length: GLOD }, (_, i) => ({
                x: ((i * 41) % 36) - 14,
                y: 0.6 + ((i * 13) % 30) / 10,
                z: ((i * 29) % 18) - 9,
                fase: i * 0.7,
            })),
        []
    );
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m || !mat.current) return;
        const dt = Math.min(rawDt, 0.05);
        tid.current += dt;
        mat.current.opacity = damp(mat.current.opacity, synlig ? 0.9 : 0, 3, dt || 0.016);
        m.visible = mat.current.opacity > 0.02;
        deler.forEach((d, i) => {
            const t = tid.current * 0.4 + d.fase;
            o.position.set(
                d.x + Math.sin(t) * 1.2,
                d.y + Math.sin(t * 1.3) * 0.4,
                d.z + Math.cos(t) * 1.2
            );
            o.scale.setScalar(0.09);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, GLOD]} frustumCulled={false}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial
                ref={mat}
                color="#fde047"
                transparent
                opacity={0}
                depthWrite={false}
            />
        </instancedMesh>
    );
}

function Spire({ vekst }: { vekst: number }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.y, vekst, 1.4, Math.min(rawDt, 0.05));
        g.scale.set(Math.max(0.001, s), Math.max(0.001, s), Math.max(0.001, s));
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={[1.6, 0.6, 3.2]} scale={0.001}>
            <mesh position={[0, 0.06, 0]}>
                <sphereGeometry args={[0.16, 8, 6]} />
                <meshStandardMaterial color="#7c4a1e" />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 1, 6]} />
                <meshStandardMaterial color="#4d7c0f" />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh
                    key={s}
                    position={[s * 0.22, 0.95, 0]}
                    rotation={[0, 0, s * -0.6]}
                    scale={[0.26, 0.08, 0.14]}
                >
                    <sphereGeometry args={[1, 10, 8]} />
                    <meshStandardMaterial color="#65a30d" flatShading />
                </mesh>
            ))}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const kamSe = useRef(new THREE.Vector3());
    const stein = useRef<THREE.Mesh>(null);
    const steinSkala = useRef(1);
    const sti = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        // Steinen slipes ned i siste beat av «stein».
        const mal = modus === 'stein' && beat >= 3 ? 0.55 : 1;
        steinSkala.current = damp(steinSkala.current, mal, 0.9, dt || 0.016);
        const s = stein.current;
        if (s) {
            const k = steinSkala.current;
            s.scale.set(1.5 * k, 1.05 * k * k, 1.25 * k);
            s.position.y = VANN_Y + 0.35 * k;
        }
        const glod = modus === 'dao' && beat === 0 ? 0.35 + Math.sin(t * 3) * 0.15 : 0;
        sti.current.forEach((m) => {
            if (m) m.emissiveIntensity = glod;
        });

        const m = kameraFor(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        kamSe.current.lerp(m.se, k);
        camera.lookAt(kamSe.current);
    });

    const fjell = useMemo(
        () => [
            { p: [-30, -6, -40], s: 18, h: 26 },
            { p: [-5, -6, -48], s: 22, h: 32 },
            { p: [22, -6, -44], s: 16, h: 22 },
            { p: [40, -6, -30], s: 14, h: 18 },
        ],
        []
    );
    const steiner = useMemo(
        () => [
            [9, 2.6],
            [6.6, 2.9],
            [4.2, 2.7],
            [1.8, 3.0],
            [-0.6, 2.7],
            [-3, 2.9],
        ],
        []
    );

    return (
        <>
            <color attach="background" args={['#cfe6f5']} />
            <fog attach="fog" args={['#d8eaf5', 35, 95]} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[20, 30, 15]} intensity={1.5} color="#fff6e5" />
            <hemisphereLight args={['#e0f2fe', '#3f6212', 0.4]} />

            {/* Øvre bredder og bekk */}
            {[-1, 1].map((side) => (
                <mesh key={side} position={[12, 0.3, side * 6.3]}>
                    <boxGeometry args={[36, 0.6, 9]} />
                    <meshStandardMaterial color="#6b8e3a" flatShading />
                </mesh>
            ))}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, VANN_Y, 0]}>
                <planeGeometry args={[36, 3.6]} />
                <meshStandardMaterial
                    color="#3b82c4"
                    emissive="#1e4f80"
                    emissiveIntensity={0.35}
                    roughness={0.25}
                />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, 0.05, 0]}>
                <planeGeometry args={[36, 4]} />
                <meshStandardMaterial color="#4b5563" />
            </mesh>
            {/* Fossekant og nedre bekk */}
            <mesh
                position={[FOSS_X - 0.62, (VANN_Y + NEDRE_Y) / 2, 0]}
                rotation={[0, -Math.PI / 2, 0]}
            >
                <planeGeometry args={[3.6, VANN_Y - NEDRE_Y]} />
                <meshBasicMaterial color="#9fd0f7" side={THREE.DoubleSide} />
            </mesh>
            {[-1, 1].map((side) => (
                <mesh key={`n${side}`} position={[FOSS_X - 15, NEDRE_Y + 0.3, side * 6.3]}>
                    <boxGeometry args={[30, 0.6, 9]} />
                    <meshStandardMaterial color="#5f7f33" flatShading />
                </mesh>
            ))}
            <mesh position={[FOSS_X - 0.3, (0.6 + NEDRE_Y) / 2, 0]}>
                <boxGeometry args={[0.5, 0.6 - NEDRE_Y, 3.6]} />
                <meshStandardMaterial color="#57534e" flatShading />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[FOSS_X - 15, NEDRE_Y + 0.22, 0]}>
                <planeGeometry args={[30, 3.6]} />
                <meshStandardMaterial
                    color="#3b82c4"
                    emissive="#1e4f80"
                    emissiveIntensity={0.35}
                    roughness={0.25}
                />
            </mesh>

            {/* Steinen */}
            <mesh ref={stein} position={[STEIN_X, VANN_Y + 0.35, 0]}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#78716c" flatShading roughness={0.9} />
            </mesh>

            <Strom steinSkala={steinSkala} />

            {modus === 'dao' && (
                <>
                    {steiner.map(([x, z], i) => (
                        <mesh key={i} position={[x, 0.63, z]}>
                            <boxGeometry args={[1.5, 0.08, 1]} />
                            <meshStandardMaterial
                                ref={(m) => {
                                    sti.current[i] = m;
                                }}
                                color="#d6c7a1"
                                emissive="#facc15"
                                emissiveIntensity={0}
                            />
                        </mesh>
                    ))}
                    <Kraften synlig={beat === 1} />
                    <Spire vekst={beat >= 2 ? 1.5 : 0.001} />
                </>
            )}

            {fjell.map((f, i) => (
                <mesh key={i} position={f.p as [number, number, number]}>
                    <coneGeometry args={[f.s, f.h, 5]} />
                    <meshStandardMaterial color="#7d8f87" flatShading />
                </mesh>
            ))}
        </>
    );
}

export function DaoismeBekken({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'stein';
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
                camera={{ fov: 42, position: [15, 6, 12] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
