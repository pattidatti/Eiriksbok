import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, useBeatKamera, useMerkelapper, v, type KameraMal, type Merkelapp } from './felles3d';

/**
 * Roma bygges om: byen av teglstein blir en by av marmor (beat 1), akvedukten, badet og
 * tempelet kommer (beat 2), så Pantheon (beat 3-4), og til slutt folk i arbeid (beat 5).
 */

const TEGL = new THREE.Color('#b5653f');
const MARMOR = new THREE.Color('#efeae0');

/** Husene i byen: [x, z, bredde, høyde, dybde]. Fast frø, så byen ser lik ut hver gang. */
function lagHus() {
    const hus: [number, number, number, number, number][] = [];
    let n = 7;
    const r = () => {
        n = (n * 16807) % 2147483647;
        return n / 2147483647;
    };
    for (let gx = -5; gx <= 5; gx++) {
        for (let gz = -4; gz <= 3; gz++) {
            const x = gx * 4.2 + (r() - 0.5) * 1.2;
            const z = gz * 4.2 + (r() - 0.5) * 1.2;
            // Plass til Pantheon og tempelet foran i midten
            if (Math.abs(x) < 7 && z > 2) continue;
            if (Math.abs(x - 12) < 4 && Math.abs(z + 2) < 4) continue;
            if (r() < 0.18) continue;
            hus.push([x, z, 2 + r() * 1.4, 1.4 + r() * 2.2, 2 + r() * 1.4]);
        }
    }
    return hus;
}

function Hus({ marmor, playing }: { marmor: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const hus = useMemo(() => lagHus(), []);
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        hus.forEach(([x, z, b, h, d], i) => {
            o.position.set(x, h / 2, z);
            o.scale.set(b, h, d);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    }, [hus]);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const c = mat.current;
        if (!c) return;
        c.color.lerp(marmor ? MARMOR : TEGL, forste.current ? 1 : 1 - Math.exp(-1.2 * dt));
        forste.current = false;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, hus.length]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial ref={mat} color="#b5653f" flatShading />
        </instancedMesh>
    );
}

/** En gruppe som vokser opp av bakken når den skal vises. */
function Vokser({
    synlig,
    playing,
    children,
    position,
}: {
    synlig: boolean;
    playing: boolean;
    children: React.ReactNode;
    position: [number, number, number];
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const s = forste.current
            ? synlig
                ? 1
                : 0.001
            : damp(g.scale.y, synlig ? 1 : 0.001, 2.4, dt);
        forste.current = false;
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={position}>
            {children}
        </group>
    );
}

const Stein = ({ farge = '#efeae0' }: { farge?: string }) => (
    <meshStandardMaterial color={farge} flatShading />
);

function Akvedukt() {
    const buer = 12;
    return (
        <group>
            {Array.from({ length: buer }, (_, i) => (
                <mesh key={i} position={[-46 + i * 3.4, 2.4, -26 + i * 0.9]}>
                    <boxGeometry args={[0.9, 4.8, 0.9]} />
                    <Stein farge="#e2d6bf" />
                </mesh>
            ))}
            <mesh
                position={[-46 + (buer - 1) * 1.7, 5.2, -26 + (buer - 1) * 0.45]}
                rotation={[0, -Math.atan2(0.9, 3.4), 0]}
            >
                <boxGeometry args={[(buer - 1) * 3.52 + 1, 0.9, 1.1]} />
                <Stein farge="#e2d6bf" />
            </mesh>
        </group>
    );
}

function Sylinder({ x, z, h = 3.2, r = 0.28 }: { x: number; z: number; h?: number; r?: number }) {
    return (
        <mesh position={[x, h / 2 + 0.6, z]}>
            <cylinderGeometry args={[r, r, h, 8]} />
            <Stein />
        </mesh>
    );
}

function Tempel() {
    return (
        <group>
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[5, 0.6, 7]} />
                <Stein />
            </mesh>
            {[-1.9, -0.65, 0.65, 1.9].map((x) => (
                <Sylinder key={x} x={x} z={3} />
            ))}
            <mesh position={[0, 2.2, -1]}>
                <boxGeometry args={[4.2, 3.2, 4.6]} />
                <Stein />
            </mesh>
            {/* Gavltaket: et liggende trekantprisme med spissen opp */}
            <mesh position={[0, 4.45, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.45]}>
                <cylinderGeometry args={[2.9, 2.9, 7, 3]} />
                <Stein farge="#b5653f" />
            </mesh>
        </group>
    );
}

function Bad() {
    return (
        <group>
            <mesh position={[0, 1.3, 0]}>
                <boxGeometry args={[8, 2.6, 5]} />
                <Stein />
            </mesh>
            <mesh position={[0, 2.6, 0]}>
                <sphereGeometry args={[2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <Stein farge="#d9cfbd" />
            </mesh>
        </group>
    );
}

function Pantheon() {
    return (
        <group>
            <mesh position={[0, 2.4, -2]}>
                <cylinderGeometry args={[4.2, 4.2, 4.8, 24]} />
                <Stein />
            </mesh>
            <mesh position={[0, 4.8, -2]}>
                <sphereGeometry args={[4.2, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <Stein farge="#d9cfbd" />
            </mesh>
            {/* Forhallen med søyler og gavl */}
            {[-3, -1.8, -0.6, 0.6, 1.8, 3].map((x) => (
                <Sylinder key={x} x={x} z={3.6} h={3.6} r={0.3} />
            ))}
            <mesh position={[0, 0.3, 2.6]}>
                <boxGeometry args={[7.6, 0.6, 3]} />
                <Stein />
            </mesh>
            {/* Bjelken med innskriften */}
            <mesh position={[0, 4.6, 3.1]}>
                <boxGeometry args={[7.4, 0.7, 2.6]} />
                <Stein />
            </mesh>
            <mesh position={[0, 4.6, 4.42]}>
                <boxGeometry args={[5.4, 0.36, 0.02]} />
                <meshStandardMaterial color="#a16207" emissive="#a16207" emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, 5.77, 3.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.42]}>
                <cylinderGeometry args={[3.9, 3.9, 2.6, 3]} />
                <Stein />
            </mesh>
        </group>
    );
}

function Arbeidere({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        const g = ref.current;
        if (!g || !playing) return;
        g.children.forEach((c, i) => {
            c.position.y = Math.abs(Math.sin(clock.elapsedTime * 3 + i)) * 0.15;
        });
    });
    const plass = [
        [-14, 8],
        [-13, 9.5],
        [-15.5, 9.2],
        [-12, 7.6],
        [-16.5, 7.8],
    ];
    return (
        <Vokser synlig={synlig} playing={playing} position={[0, 0, 0]}>
            {/* Et hus under bygging, med stillas */}
            <mesh position={[-14, 1, 5.5]}>
                <boxGeometry args={[4, 2, 2.6]} />
                <Stein />
            </mesh>
            {[-16.2, -11.8].map((x) =>
                [4, 7].map((z) => (
                    <mesh key={`${x}${z}`} position={[x, 2, z]}>
                        <boxGeometry args={[0.12, 4, 0.12]} />
                        <meshStandardMaterial color="#6b4423" />
                    </mesh>
                ))
            )}
            <mesh position={[-14, 3.9, 5.5]}>
                <boxGeometry args={[4.6, 0.12, 3.2]} />
                <meshStandardMaterial color="#6b4423" />
            </mesh>
            <group ref={ref}>
                {plass.map(([x, z], i) => (
                    <group key={i} position={[x, 0, z]}>
                        <mesh position={[0, 0.55, 0]}>
                            <cylinderGeometry args={[0.22, 0.28, 1.1, 6]} />
                            <meshStandardMaterial color={i % 2 ? '#9a3412' : '#1e3a8a'} />
                        </mesh>
                        <mesh position={[0, 1.3, 0]}>
                            <sphereGeometry args={[0.22, 8, 6]} />
                            <meshStandardMaterial color="#d6a77a" />
                        </mesh>
                    </group>
                ))}
            </group>
        </Vokser>
    );
}

function kameraFor(beat: number, t: number): KameraMal {
    switch (beat) {
        case 0:
            return { pos: v(30 - t * 0.6, 20, 34), se: v(0, 0, -2) };
        case 1:
            return { pos: v(-28 + t * 0.5, 16, 30), se: v(0, 1, -2) };
        case 2:
            return { pos: v(-34, 14, 26), se: v(-14, 2, -12) };
        case 3:
            return { pos: v(14, 9, 26), se: v(0, 3.5, 2) };
        case 4:
            return { pos: v(4, 5.5, 19), se: v(0, 4.4, 4) };
        default:
            return { pos: v(-7, 5.5, 15), se: v(-14, 1.5, 6) };
    }
}

function Scene({
    beat,
    playing,
    merker,
    finn,
}: {
    beat: number;
    playing: boolean;
    merker: Merkelapp[];
    finn: (id: string) => HTMLDivElement | null | undefined;
}) {
    useBeatKamera(kameraFor, beat, playing);
    useMerkelapper(merker, finn);
    return (
        <>
            <color attach="background" args={['#cfe6f5']} />
            <fog attach="fog" args={['#dbeaf3', 60, 150]} />
            <hemisphereLight args={['#ffffff', '#8a7f62', 1.1]} />
            <directionalLight position={[20, 30, 15]} intensity={1.5} color="#fff1d6" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color="#c8b98c" />
            </mesh>
            {/* Elva Tiberen */}
            <mesh rotation={[-Math.PI / 2, 0, 0.35]} position={[-28, 0.03, 0]}>
                <planeGeometry args={[6, 120]} />
                <meshStandardMaterial color="#4f86a8" emissive="#2d5f7d" emissiveIntensity={0.3} />
            </mesh>
            {[
                [30, -40, 20],
                [-10, -50, 24],
                [50, -10, 16],
            ].map(([x, z, r], i) => (
                <mesh key={i} position={[x, -r * 0.7, z]}>
                    <sphereGeometry args={[r, 12, 8]} />
                    <meshStandardMaterial color="#9aa66b" flatShading />
                </mesh>
            ))}
            <Hus marmor={beat >= 1} playing={playing} />
            <Vokser synlig={beat >= 2} playing={playing} position={[0, 0, 0]}>
                <Akvedukt />
            </Vokser>
            <Vokser synlig={beat >= 2} playing={playing} position={[-12, 0, -12]}>
                <Bad />
            </Vokser>
            <Vokser synlig={beat >= 2} playing={playing} position={[12, 0, -2]}>
                <Tempel />
            </Vokser>
            <Vokser synlig={beat >= 3} playing={playing} position={[0, 0, 4]}>
                <Pantheon />
            </Vokser>
            <Arbeidere synlig={beat >= 5} playing={playing} />
        </>
    );
}

export function AugustusByen({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const refs = useRef<Record<string, HTMLDivElement | null>>({});
    const merker: Merkelapp[] = [
        {
            id: 'tegl',
            tekst: 'Teglstein',
            farge: '#9a3412',
            synlig: beat === 0,
            punkt: () => v(0, 6, -8),
        },
        {
            id: 'marmor',
            tekst: 'Marmor',
            farge: '#475569',
            synlig: beat === 1,
            punkt: () => v(0, 6, -8),
        },
        {
            id: 'akvedukt',
            tekst: 'Akvedukt',
            farge: '#1d4ed8',
            synlig: beat === 2,
            punkt: () => v(-28, 7, -21),
        },
        {
            id: 'bad',
            tekst: 'Bad',
            farge: '#1d4ed8',
            synlig: beat === 2,
            punkt: () => v(-12, 6, -12),
        },
        {
            id: 'tempel',
            tekst: 'Tempel',
            farge: '#1d4ed8',
            synlig: beat === 2,
            punkt: () => v(12, 6.5, -2),
        },
        {
            id: 'pantheon',
            tekst: 'Pantheon',
            farge: '#a16207',
            synlig: beat === 3,
            punkt: () => v(0, 10.5, 2),
        },
        {
            id: 'innskrift',
            tekst: 'Agrippas navn, gjentatt fra år 27 fvt.',
            farge: '#a16207',
            synlig: beat === 4,
            punkt: () => v(0, 6.6, 8.4),
        },
        {
            id: 'arbeid',
            tekst: 'Arbeid til folket',
            farge: '#9a3412',
            synlig: beat === 5,
            punkt: () => v(-14, 4.3, 5.5),
        },
    ];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [30, 20, 34] }}
            >
                <Scene
                    beat={beat}
                    playing={playing}
                    merker={merker}
                    finn={(id) => refs.current[id]}
                />
            </Canvas>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {merker.map((m) => (
                    <div
                        key={m.id}
                        ref={(el) => {
                            refs.current[m.id] = el;
                        }}
                        className="absolute"
                        style={{ opacity: 0, transition: 'opacity 0.6s' }}
                    >
                        <div
                            className="px-4 py-1.5 rounded-xl bg-white/95 shadow-lg font-black text-2xl whitespace-nowrap border-b-4"
                            style={{
                                transform: 'translate(-50%, -100%)',
                                color: m.farge,
                                borderColor: m.farge,
                            }}
                        >
                            {m.tekst}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
