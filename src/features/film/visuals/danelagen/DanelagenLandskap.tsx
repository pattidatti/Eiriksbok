import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Danelagen i 3D, fire steder:
 *  - ankomst: flåten kommer inn mot kysten av East Anglia i 865 og blir liggende
 *  - myra:    Alfred i ødemarkene i Somerset: hytta til svinerøkteren, og troppene som samles
 *  - bygd:    skandinaviske bønder, handelsmenn og håndverkere slår seg ned
 *  - jorvik:  byen ved elva, skipene ved kaia, byen som vokser og ullhandelen
 *
 * Ingen kamp vises. Bare stedene, skipene, husene og dyrene.
 */

type Modus = 'ankomst' | 'myra' | 'bygd' | 'jorvik';

const damp = (a: number, b: number, l: number, dt: number) =>
    THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Tilfeldig tall med frø, så scenen ser lik ut hver gang. */
function fro(n: number) {
    const x = Math.sin(n * 91.7 + 17.3) * 43758.5453;
    return x - Math.floor(x);
}

interface KameraMal {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): KameraMal {
    if (modus === 'ankomst') {
        if (beat === 0) return { pos: v(-34, 9, 26), se: v(40, 1, 0) };
        if (beat === 1) return { pos: v(10, 34, 62), se: v(40, 0, 0) };
        return { pos: v(18 + t * 0.2, 13, 34), se: v(-24, 1, 0) };
    }
    if (modus === 'myra') {
        if (beat === 0) return { pos: v(-10 + t * 0.4, 34, 64), se: v(0, 0, 0) };
        if (beat === 1) return { pos: v(26, 12, 30), se: v(0, 1, 0) };
        if (beat === 2) return { pos: v(11, 5, 13), se: v(0, 1.2, 0) };
        if (beat === 3) return { pos: v(9, 7, 11), se: v(0, 3.4, 0) };
        return { pos: v(-6, 12, 34), se: v(0, 5, -50) };
    }
    if (modus === 'bygd') {
        if (beat === 0) return { pos: v(-4, 16, 38), se: v(0, 1, 0) };
        if (beat === 1) return { pos: v(-24, 12, 26), se: v(-10, 0, 4) };
        if (beat === 2) return { pos: v(26, 12, 26), se: v(14, 1, -4) };
        return { pos: v(0, 90 + t * 0.5, 70), se: v(0, 0, -10) };
    }
    if (beat === 0) return { pos: v(-36, 26, 46), se: v(0, 0, 0) };
    if (beat === 1) return { pos: v(36, 16, 30), se: v(10, 0, 3) };
    if (beat === 2) return { pos: v(-10, 60, 60), se: v(0, 0, -4) };
    return { pos: v(-6, 11, 38), se: v(8, 1, 18) };
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const m = kameraFor(modus, beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

/** Gruppe som vokser opp fra bakken når den skal vises, og synker bort ellers. Tåler hopp. */
function Vokse({
    synlig,
    playing,
    children,
    position,
}: {
    synlig: boolean;
    playing: boolean;
    children: React.ReactNode;
    position?: [number, number, number];
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, raw) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const mal = synlig ? 1 : 0.001;
        const s = forste.current ? mal : damp(g.scale.y, mal, 2.2, dt);
        forste.current = false;
        g.scale.set(Math.max(s, 0.001), Math.max(s, 0.001), Math.max(s, 0.001));
        g.visible = s > 0.01;
    });
    return (
        <group ref={ref} position={position}>
            {children}
        </group>
    );
}

/* ---------- Skipet ---------- */

function useSkrog() {
    return useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-5, 2.6);
        s.bezierCurveTo(-4.6, 0.6, -3.4, 0, -2.2, 0);
        s.lineTo(2.2, 0);
        s.bezierCurveTo(3.4, 0, 4.6, 0.6, 5, 2.6);
        s.lineTo(4.55, 2.6);
        s.bezierCurveTo(4.1, 1.2, 3.2, 1.0, 2.2, 1.0);
        s.lineTo(-2.2, 1.0);
        s.bezierCurveTo(-3.2, 1.0, -4.1, 1.2, -4.55, 2.6);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, {
            depth: 1.3,
            bevelEnabled: true,
            bevelThickness: 0.4,
            bevelSize: 0.15,
            bevelSegments: 2,
        });
        g.translate(0, 0, -0.65);
        return g;
    }, []);
}

function Skip({ skrog, seil = true }: { skrog: THREE.BufferGeometry; seil?: boolean }) {
    return (
        <group>
            <mesh geometry={skrog} position={[0, -0.4, 0]}>
                <meshStandardMaterial color="#7c4a24" roughness={0.9} flatShading />
            </mesh>
            {seil && (
                <>
                    <mesh position={[0, 3.2, 0]}>
                        <cylinderGeometry args={[0.09, 0.11, 5, 6]} />
                        <meshStandardMaterial color="#3f2a16" />
                    </mesh>
                    <mesh position={[0, 3.6, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <planeGeometry args={[3.2, 2.6]} />
                        <meshStandardMaterial
                            color="#e5e7eb"
                            emissive="#6b7280"
                            emissiveIntensity={0.15}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    {[-0.8, 0.8].map((z) => (
                        <mesh key={z} position={[0, 3.6, z * 0.6]} rotation={[0, Math.PI / 2, 0]}>
                            <planeGeometry args={[0.5, 2.62]} />
                            <meshStandardMaterial
                                color="#b91c1c"
                                side={THREE.DoubleSide}
                                polygonOffset
                                polygonOffsetFactor={-1}
                            />
                        </mesh>
                    ))}
                </>
            )}
        </group>
    );
}

function GlideSkip({
    skrog,
    mal,
    vinkel,
    playing,
    fart = 0.6,
    seil = true,
    gynge = true,
    skala = 1,
}: {
    skrog: THREE.BufferGeometry;
    mal: THREE.Vector3;
    vinkel: number;
    playing: boolean;
    fart?: number;
    seil?: boolean;
    gynge?: boolean;
    skala?: number;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useRef((mal.x * 0.31 + mal.z * 0.77) % 7);
    useFrame((_, raw) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        tid.current += dt;
        if (forste.current) {
            g.position.copy(mal);
            g.rotation.y = vinkel;
            forste.current = false;
            return;
        }
        g.position.x = damp(g.position.x, mal.x, fart, dt);
        g.position.z = damp(g.position.z, mal.z, fart, dt);
        g.position.y = mal.y + (gynge ? Math.sin(tid.current * 1.5) * 0.1 : 0);
        g.rotation.y = damp(g.rotation.y, vinkel, 1.2, dt);
    });
    return (
        <group ref={ref} scale={skala}>
            <Skip skrog={skrog} seil={seil} />
        </group>
    );
}

/* ---------- Felles ting ---------- */

function Lys({ dempet = false }: { dempet?: boolean }) {
    return (
        <>
            <hemisphereLight args={['#e0f2fe', '#4b5d3a', dempet ? 0.75 : 0.95]} />
            <directionalLight position={[30, 50, 20]} intensity={dempet ? 0.9 : 1.3} />
        </>
    );
}

function Vann({ farge = '#2f6f8f', y = 0 }: { farge?: string; y?: number }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
            <planeGeometry args={[1200, 1200]} />
            <meshStandardMaterial color={farge} emissive="#123a4d" emissiveIntensity={0.4} />
        </mesh>
    );
}

function Langhus({
    position,
    vinkel = 0,
    skala = 1,
}: {
    position: [number, number, number];
    vinkel?: number;
    skala?: number;
}) {
    return (
        <group position={position} rotation={[0, vinkel, 0]} scale={skala}>
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[5, 1.6, 2.2]} />
                <meshStandardMaterial color="#8a6a45" flatShading />
            </mesh>
            {/* Taket er et liggende prisme med mønet opp */}
            <group position={[0, 2.35, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                    <cylinderGeometry args={[1.5, 1.5, 5.4, 3, 1]} />
                    <meshStandardMaterial color="#c9a45c" flatShading />
                </mesh>
            </group>
        </group>
    );
}

/** Mange små hus i én instans (hus = boks, tak oppå i samme boks-rad). */
function Husflekk({
    plasser,
    farge = '#8a6a45',
    tak = '#b58b45',
}: {
    plasser: [number, number, number, number][];
    farge?: string;
    tak?: string;
}) {
    const vegg = useRef<THREE.InstancedMesh>(null);
    const topp = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const m = new THREE.Object3D();
        plasser.forEach(([x, z, r, s], i) => {
            m.position.set(x, 0.6 * s, z);
            m.rotation.set(0, r, 0);
            m.scale.set(s, s, s);
            m.updateMatrix();
            vegg.current?.setMatrixAt(i, m.matrix);
            m.position.set(x, 1.55 * s, z);
            m.updateMatrix();
            topp.current?.setMatrixAt(i, m.matrix);
        });
        if (vegg.current) vegg.current.instanceMatrix.needsUpdate = true;
        if (topp.current) topp.current.instanceMatrix.needsUpdate = true;
    }, [plasser]);
    return (
        <>
            <instancedMesh
                ref={vegg}
                args={[undefined, undefined, plasser.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[2.6, 1.2, 1.4]} />
                <meshStandardMaterial color={farge} flatShading />
            </instancedMesh>
            <instancedMesh
                ref={topp}
                args={[undefined, undefined, plasser.length]}
                frustumCulled={false}
            >
                <coneGeometry args={[1.7, 0.9, 4]} />
                <meshStandardMaterial color={tak} flatShading />
            </instancedMesh>
        </>
    );
}

/** Dyr som små kropper på bein: sau (hvit), gris (rosa), ku (brun). */
function Dyr({
    plasser,
    farge,
    stor = 1,
}: {
    plasser: [number, number, number][];
    farge: string;
    stor?: number;
}) {
    return (
        <>
            {plasser.map(([x, z, r], i) => (
                <group key={i} position={[x, 0, z]} rotation={[0, r, 0]} scale={stor}>
                    <mesh position={[0, 0.55, 0]}>
                        <boxGeometry args={[1.0, 0.6, 0.6]} />
                        <meshStandardMaterial color={farge} flatShading />
                    </mesh>
                    <mesh position={[0.6, 0.7, 0]}>
                        <boxGeometry args={[0.4, 0.4, 0.4]} />
                        <meshStandardMaterial color={farge} flatShading />
                    </mesh>
                    <mesh position={[0, 0.13, 0]}>
                        <boxGeometry args={[0.8, 0.26, 0.45]} />
                        <meshStandardMaterial color="#3f3f46" />
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** Røyk som stiger fra et punkt. */
function Roeyk({
    position,
    playing,
    farge = '#6b7280',
    antall = 6,
    hoyde = 7,
}: {
    position: [number, number, number];
    playing: boolean;
    farge?: string;
    antall?: number;
    hoyde?: number;
}) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, raw) => {
        tid.current += playing ? Math.min(raw, 0.05) : 0;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const f = (tid.current * 0.25 + i / antall) % 1;
            m.position.set(Math.sin(f * 5 + i) * 0.4 + f * 1.2, f * hoyde, 0);
            const s = 0.4 + f * 1.3;
            m.scale.set(s, s, s);
        });
    });
    return (
        <group position={position}>
            {Array.from({ length: antall }, (_, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                >
                    <sphereGeometry args={[0.6, 7, 6]} />
                    <meshStandardMaterial color={farge} transparent opacity={0.55} flatShading />
                </mesh>
            ))}
        </group>
    );
}

/* ---------- ankomst ---------- */

const FLATE = Array.from({ length: 10 }, (_, i) => ({
    rad: i % 4,
    kol: Math.floor(i / 4),
    z: (i - 4.5) * 4.2,
}));

function AnkomstScene({ beat, playing }: { beat: number; playing: boolean }) {
    const skrog = useSkrog();
    const telt = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => [
                -32 - fro(i) * 14,
                (i - 5.5) * 4.6 + fro(i + 9) * 2,
            ]),
        []
    );
    return (
        <>
            <color attach="background" args={['#cfe0e8']} />
            <fog attach="fog" args={['#cfe0e8', 70, 220]} />
            <Lys />
            <Vann />
            {/* Kysten av East Anglia: lav, grønn og flat */}
            <mesh position={[-80, 0.4, 0]}>
                <boxGeometry args={[120, 1.4, 300]} />
                <meshStandardMaterial color="#6f9a4a" flatShading />
            </mesh>
            <mesh position={[-21, 0.15, 0]} rotation={[0, 0, 0.06]}>
                <boxGeometry args={[6, 0.6, 300]} />
                <meshStandardMaterial color="#d8c69a" flatShading />
            </mesh>
            {FLATE.map((s, i) => {
                const mal =
                    beat === 0
                        ? v(48 + s.rad * 6 + s.kol * 4, 0, s.z)
                        : beat === 1
                          ? v(30 + s.rad * 4 + s.kol * 3, 0, s.z)
                          : v(-17 + (i % 2) * 1.2, 0.35, s.z);
                return (
                    <GlideSkip
                        key={i}
                        skrog={skrog}
                        mal={mal}
                        vinkel={beat >= 2 ? Math.PI * 0.94 : Math.PI}
                        playing={playing}
                        fart={0.5}
                        gynge={beat < 2}
                    />
                );
            })}
            {/* De gamle tokta: to skip som snur og seiler hjem */}
            {[-26, 26].map((z) => (
                <group key={z} visible={beat === 1}>
                    <GlideSkip
                        skrog={skrog}
                        mal={beat === 1 ? v(88, 0, z) : v(62, 0, z)}
                        vinkel={0}
                        playing={playing}
                        fart={0.35}
                    />
                </group>
            ))}
            <Vokse synlig={beat >= 2} playing={playing}>
                {telt.map(([x, z], i) => (
                    <mesh key={i} position={[x, 1.9, z]}>
                        <coneGeometry args={[1.4, 2.2, 4]} />
                        <meshStandardMaterial
                            color={i % 3 === 0 ? '#a8a29e' : '#d6d3d1'}
                            flatShading
                        />
                    </mesh>
                ))}
                {[0, 1, 2].map((i) => (
                    <mesh key={i} position={[-36 - i * 4, 1.3, (i - 1) * 12]}>
                        <coneGeometry args={[0.5, 1.0, 5]} />
                        <meshStandardMaterial
                            color="#f97316"
                            emissive="#f97316"
                            emissiveIntensity={0.9}
                        />
                    </mesh>
                ))}
            </Vokse>
        </>
    );
}

/* ---------- myra ---------- */

const OYER: [number, number, number][] = [
    [0, 0, 7],
    [-18, -10, 6],
    [16, -14, 5],
    [-14, 14, 4],
    [22, 10, 4.5],
    [-34, -2, 5],
    [36, -4, 5],
];

function MyraScene({ beat, playing }: { beat: number; playing: boolean }) {
    const siv = useRef<THREE.InstancedMesh>(null);
    const SIV = 260;
    useLayoutEffect(() => {
        const m = new THREE.Object3D();
        for (let i = 0; i < SIV; i++) {
            const o = OYER[i % OYER.length];
            const a = fro(i) * Math.PI * 2;
            const r = o[2] * (0.75 + fro(i + 300) * 0.45);
            const h = 0.8 + fro(i + 600) * 1.4;
            m.position.set(o[0] + Math.cos(a) * r, h / 2, o[1] + Math.sin(a) * r);
            m.rotation.set((fro(i + 900) - 0.5) * 0.3, 0, (fro(i + 1200) - 0.5) * 0.3);
            m.scale.set(1, h, 1);
            m.updateMatrix();
            siv.current?.setMatrixAt(i, m.matrix);
        }
        if (siv.current) siv.current.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <>
            <color attach="background" args={['#c9d1cb']} />
            <fog attach="fog" args={['#c9d1cb', 30, 130]} />
            <Lys dempet />
            <Vann farge="#5b7d72" y={0} />
            {OYER.map(([x, z, r], i) => (
                <mesh key={i} position={[x, 0.2, z]}>
                    <cylinderGeometry args={[r, r * 1.15, 0.6, 9]} />
                    <meshStandardMaterial color={i === 0 ? '#6b7f3e' : '#7a7448'} flatShading />
                </mesh>
            ))}
            <instancedMesh ref={siv} args={[undefined, undefined, SIV]} frustumCulled={false}>
                <boxGeometry args={[0.12, 1, 0.12]} />
                <meshStandardMaterial color="#a39a5a" flatShading />
            </instancedMesh>
            {/* Hytta til svinerøkteren */}
            <group position={[0, 0.5, 0]}>
                <mesh position={[0, 1, 0]}>
                    <boxGeometry args={[3.4, 2, 2.6]} />
                    <meshStandardMaterial color="#7a5a3a" flatShading />
                </mesh>
                <mesh position={[0, 2.8, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <coneGeometry args={[2.8, 1.8, 4]} />
                    <meshStandardMaterial color="#b8a060" flatShading />
                </mesh>
                <mesh position={[1.71, 0.7, 0]}>
                    <boxGeometry args={[0.05, 1.3, 0.8]} />
                    <meshStandardMaterial color="#2a1a0e" />
                </mesh>
                {/* Gjerde til grisene */}
                <mesh position={[3.6, 0.35, 0]}>
                    <boxGeometry args={[0.15, 0.7, 4]} />
                    <meshStandardMaterial color="#5a4128" />
                </mesh>
            </group>
            <Vokse synlig={beat >= 2} playing={playing} position={[0, 0.5, 0]}>
                <Dyr
                    farge="#f2a7b3"
                    plasser={[
                        [2.4, 1.6, 0.4],
                        [2.8, -0.8, -0.6],
                        [-2.8, 2.0, 2.4],
                    ]}
                />
            </Vokse>
            {beat >= 3 && <Roeyk position={[0, 3.8, 0]} playing={playing} farge="#3f3f46" />}
            {beat >= 3 && (
                <mesh position={[1.2, 0.9, 1.35]}>
                    <boxGeometry args={[0.6, 0.6, 0.05]} />
                    <meshStandardMaterial
                        color="#f97316"
                        emissive="#f97316"
                        emissiveIntensity={1}
                    />
                </mesh>
            )}
            {/* En liten båt ved hytta */}
            <mesh position={[-6.5, 0.15, 3]} rotation={[0, 0.5, 0]}>
                <boxGeometry args={[3, 0.4, 1]} />
                <meshStandardMaterial color="#5a4128" flatShading />
            </mesh>
            {/* Åsene bak, der troppene samles */}
            {[-30, -8, 16, 38].map((x, i) => (
                <mesh key={i} position={[x, 3, -62 - (i % 2) * 6]}>
                    <coneGeometry args={[16, 10, 7]} />
                    <meshStandardMaterial color="#56704a" flatShading />
                </mesh>
            ))}
            <Vokse synlig={beat >= 4} playing={playing}>
                {[-30, -18, -8, 4, 16, 28, 38].map((x, i) => (
                    <group key={i} position={[x, 7.2 + (i % 2) * 0.6, -58 - (i % 3) * 3]}>
                        <mesh position={[0, 2.2, 0]}>
                            <cylinderGeometry args={[0.12, 0.12, 4.4, 5]} />
                            <meshStandardMaterial color="#3f2a16" />
                        </mesh>
                        <mesh position={[0.9, 3.8, 0]}>
                            <planeGeometry args={[1.8, 1.2]} />
                            <meshStandardMaterial color="#1d4ed8" side={THREE.DoubleSide} />
                        </mesh>
                        <mesh position={[1.5, 0.5, 1]}>
                            <coneGeometry args={[0.7, 1.4, 5]} />
                            <meshStandardMaterial
                                color="#f97316"
                                emissive="#f97316"
                                emissiveIntensity={1}
                            />
                        </mesh>
                    </group>
                ))}
            </Vokse>
        </>
    );
}

/* ---------- bygd ---------- */

const LANGHUS: [number, number, number][] = [
    [-6, -6, 0.2],
    [3, -8, -0.1],
    [10, -2, 0.4],
    [-12, 2, -0.3],
    [-2, 4, 0.1],
    [6, 7, -0.2],
];

const AKRE: [number, number, number, number, string][] = [
    [-22, 2, 10, 7, '#c7a24a'],
    [-22, 12, 10, 7, '#8a6b3a'],
    [-12, 14, 8, 6, '#c7a24a'],
    [-30, -6, 8, 7, '#9fbf5a'],
];

function BygdScene({ beat, playing }: { beat: number; playing: boolean }) {
    const skrog = useSkrog();
    const landsbyer = useMemo(() => {
        const ut: [number, number, number, number][] = [];
        for (let b = 0; b < 26; b++) {
            const cx = (fro(b) - 0.5) * 170;
            const cz = -20 - fro(b + 50) * 90 + (b % 3) * 6;
            for (let h = 0; h < 4; h++) {
                ut.push([
                    cx + (fro(b * 7 + h) - 0.5) * 7,
                    cz + (fro(b * 11 + h) - 0.5) * 6,
                    fro(h + b),
                    1.1,
                ]);
            }
        }
        return ut;
    }, []);
    return (
        <>
            <color attach="background" args={['#d7e6ee']} />
            <fog attach="fog" args={['#d7e6ee', 80, 260]} />
            <Lys />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[600, 600]} />
                <meshStandardMaterial color="#7fa653" />
            </mesh>
            {/* Elva */}
            <mesh rotation={[-Math.PI / 2, 0, 0.25]} position={[20, 0.03, 0]}>
                <planeGeometry args={[7, 400]} />
                <meshStandardMaterial color="#3d7fa0" emissive="#123a4d" emissiveIntensity={0.4} />
            </mesh>
            {LANGHUS.map(([x, z, r], i) => (
                <Vokse key={i} synlig playing={playing} position={[x, 0, z]}>
                    <Langhus position={[0, 0, 0]} vinkel={r} />
                </Vokse>
            ))}
            <Vokse synlig={beat >= 1} playing={playing}>
                {AKRE.map(([x, z, w, d, f], i) => (
                    <mesh key={i} position={[x, 0.08, z]}>
                        <boxGeometry args={[w, 0.15, d]} />
                        <meshStandardMaterial color={f} flatShading />
                    </mesh>
                ))}
                <Dyr
                    farge="#f5f5f4"
                    plasser={[
                        [-8, 12, 0.3],
                        [-6, 14, -0.6],
                        [-9, 15, 1.2],
                        [-5.5, 11, 2.4],
                    ]}
                />
                <Dyr
                    farge="#7c4a24"
                    stor={1.5}
                    plasser={[
                        [-18, -3, 0.8],
                        [-15, -1, -0.4],
                    ]}
                />
            </Vokse>
            {/* Handel ved elva og smia */}
            <Vokse synlig={beat >= 2} playing={playing}>
                <mesh position={[17, 0.4, -4]}>
                    <boxGeometry args={[3, 0.6, 7]} />
                    <meshStandardMaterial color="#6b4a2a" flatShading />
                </mesh>
                {[
                    [14, -7],
                    [14.5, -2],
                ].map(([x, z], i) => (
                    <mesh key={i} position={[x, 0.6, z]}>
                        <boxGeometry args={[1.2, 1.2, 1.2]} />
                        <meshStandardMaterial color="#a16207" flatShading />
                    </mesh>
                ))}
                <group position={[12, 0, 6]}>
                    <mesh position={[0, 0.9, 0]}>
                        <boxGeometry args={[3, 1.8, 2.6]} />
                        <meshStandardMaterial color="#57534e" flatShading />
                    </mesh>
                    <mesh position={[1.55, 0.8, 0]}>
                        <boxGeometry args={[0.1, 0.9, 1.2]} />
                        <meshStandardMaterial
                            color="#f97316"
                            emissive="#f97316"
                            emissiveIntensity={1.2}
                        />
                    </mesh>
                </group>
            </Vokse>
            {beat >= 2 && <Roeyk position={[12, 2.2, 6]} playing={playing} antall={5} hoyde={6} />}
            <group visible={beat >= 2}>
                <GlideSkip
                    skrog={skrog}
                    mal={v(20.5, 0.05, -4)}
                    skala={0.6}
                    vinkel={Math.PI / 2 + 0.25}
                    playing={playing}
                    fart={0.5}
                />
            </group>
            <Vokse synlig={beat >= 3} playing={playing}>
                <Husflekk plasser={landsbyer} />
            </Vokse>
        </>
    );
}

/* ---------- jorvik ---------- */

function JorvikScene({ beat, playing }: { beat: number; playing: boolean }) {
    const skrog = useSkrog();
    const indre = useMemo(() => {
        const ut: [number, number, number, number][] = [];
        for (let i = 0; i < 34; i++) {
            const a = fro(i) * Math.PI * 2;
            const r = 2 + Math.sqrt(fro(i + 40)) * 10.5;
            ut.push([Math.cos(a) * r - 4, Math.sin(a) * r, a, 0.9 + fro(i + 80) * 0.3]);
        }
        return ut;
    }, []);
    const ytre = useMemo(() => {
        const ut: [number, number, number, number][] = [];
        for (let i = 0; i < 40; i++) {
            const a = fro(i + 200) * Math.PI * 1.6 + Math.PI * 0.2;
            const r = 16 + fro(i + 240) * 14;
            ut.push([Math.cos(a) * r - 4, Math.sin(a) * r * 0.9, a, 0.85]);
        }
        return ut.filter(([x]) => x < 8);
    }, []);
    return (
        <>
            <color attach="background" args={['#d7e6ee']} />
            <fog attach="fog" args={['#d7e6ee', 80, 240]} />
            <Lys />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[600, 600]} />
                <meshStandardMaterial color="#86a95c" />
            </mesh>
            {/* Elva langs byen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[16, 0.03, 0]}>
                <planeGeometry args={[9, 400]} />
                <meshStandardMaterial color="#3d7fa0" emissive="#123a4d" emissiveIntensity={0.4} />
            </mesh>
            {/* Palisaden rundt byen */}
            <mesh position={[-4, 1, 0]}>
                <cylinderGeometry args={[13.5, 13.5, 2, 28, 1, true]} />
                <meshStandardMaterial color="#6b4a2a" side={THREE.DoubleSide} flatShading />
            </mesh>
            <Husflekk plasser={indre} />
            {/* Kaia */}
            <mesh position={[11, 0.3, 4]}>
                <boxGeometry args={[2.4, 0.5, 18]} />
                <meshStandardMaterial color="#6b4a2a" flatShading />
            </mesh>
            {[-2, 5, 12].map((z, i) => (
                <group key={i} visible={beat >= 1}>
                    <GlideSkip
                        skrog={skrog}
                        mal={beat >= 1 ? v(15.5, 0.05, z) : v(15.5, 0.05, z - 60)}
                        vinkel={Math.PI / 2}
                        playing={playing}
                        fart={0.6}
                        skala={0.5}
                    />
                </group>
            ))}
            <Vokse synlig={beat >= 2} playing={playing}>
                <Husflekk plasser={ytre} farge="#9a7b55" tak="#c19a55" />
            </Vokse>
            <Vokse synlig={beat >= 3} playing={playing}>
                {Array.from({ length: 9 }, (_, i) => (
                    <mesh
                        key={i}
                        position={[
                            8 + (i % 3) * 0.9,
                            0.35 + Math.floor(i / 3) * 0.7,
                            17 + (i % 2) * 0.9,
                        ]}
                    >
                        <boxGeometry args={[0.8, 0.7, 0.8]} />
                        <meshStandardMaterial color="#f5f5f4" flatShading />
                    </mesh>
                ))}
                <Dyr
                    farge="#f5f5f4"
                    plasser={[
                        [2, 20, 0.3],
                        [4.5, 22, -0.8],
                        [0, 23, 1.4],
                        [6, 25, 2.1],
                        [3, 26, 0.6],
                    ]}
                />
            </Vokse>
        </>
    );
}

/* ---------- Merkelapper og kort ---------- */

interface Merkelapp {
    id: string;
    tekst: string;
    farge: string;
    synlig: boolean;
    punkt: THREE.Vector3;
}

function merkerFor(modus: Modus, beat: number): Merkelapp[] {
    if (modus === 'ankomst')
        return [
            {
                id: 'a1',
                tekst: 'East Anglia',
                farge: '#166534',
                synlig: beat === 2,
                punkt: v(-30, 6, -14),
            },
        ];
    if (modus === 'myra')
        return [
            {
                id: 'm1',
                tekst: 'Somerset',
                farge: '#166534',
                synlig: beat === 1,
                punkt: v(-16, 4, -10),
            },
        ];
    if (modus === 'bygd')
        return [
            {
                id: 'b1',
                tekst: 'Bønder',
                farge: '#166534',
                synlig: beat === 1,
                punkt: v(-22, 4, 6),
            },
            {
                id: 'b2',
                tekst: 'Handelsmenn',
                farge: '#a16207',
                synlig: beat === 2,
                punkt: v(18, 6, -8),
            },
            {
                id: 'b3',
                tekst: 'Håndverkere',
                farge: '#7c2d12',
                synlig: beat === 2,
                punkt: v(10, 4.5, 10),
            },
        ];
    return [
        {
            id: 'j1',
            tekst: 'Jorvik (York)',
            farge: '#7f1d1d',
            synlig: beat === 0,
            punkt: v(-4, 6, 4),
        },
        { id: 'j2', tekst: 'Ull', farge: '#a16207', synlig: beat >= 3, punkt: v(9, 3.4, 17.5) },
    ];
}

const tmp = new THREE.Vector3();

function Merkeflytter({
    merker,
    finn,
}: {
    merker: Merkelapp[];
    finn: (id: string) => HTMLDivElement | null | undefined;
}) {
    useFrame(({ camera, size }) => {
        for (const m of merker) {
            const el = finn(m.id);
            if (!el) continue;
            tmp.copy(m.punkt).project(camera);
            const bak = tmp.z > 1;
            el.style.left = `${((tmp.x + 1) / 2) * size.width}px`;
            el.style.top = `${((1 - tmp.y) / 2) * size.height}px`;
            el.style.opacity = m.synlig && !bak ? '1' : '0';
        }
    });
    return null;
}

const KORT: Record<Modus, ({ tittel: string; tekst?: string } | null)[]> = {
    ankomst: [
        { tittel: 'East Anglia, 865' },
        { tittel: 'Før: plyndre og dra hjem' },
        { tittel: 'Nå: kommet for å bli' },
    ],
    myra: [
        { tittel: 'Flukten fra Chippenham' },
        { tittel: 'Ødemarkene i Somerset', tekst: 'med en håndfull menn' },
        { tittel: 'Legenden: hos svinerøkteren' },
        { tittel: 'Legenden: brødet som svidde seg' },
        { tittel: 'Alfred samler troppene' },
    ],
    bygd: [
        { tittel: 'Tusenvis av skandinaver', tekst: 'ikke bare krigere' },
        null,
        null,
        { tittel: 'Skandinaviske stedsnavn', tekst: 'tett i tett i nord og øst' },
    ],
    jorvik: [
        null,
        { tittel: 'Hovedsentrum fra 867' },
        { tittel: 'Høymiddelalderen', tekst: 'trolig Englands største by' },
        { tittel: 'Handel med ull' },
    ],
};

export function DanelagenLandskap({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'ankomst';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const refs = useRef<Record<string, HTMLDivElement | null>>({});
    const merker = merkerFor(modus, beat);
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [30, 20, 40] }}
            >
                <Kamera modus={modus} beat={beat} playing={playing} />
                {modus === 'ankomst' && <AnkomstScene beat={beat} playing={playing} />}
                {modus === 'myra' && <MyraScene beat={beat} playing={playing} />}
                {modus === 'bygd' && <BygdScene beat={beat} playing={playing} />}
                {modus === 'jorvik' && <JorvikScene beat={beat} playing={playing} />}
                <Merkeflytter merker={merker} finn={(id) => refs.current[id]} />
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
            {kort && (
                <div
                    className="absolute inset-x-0 flex justify-center pointer-events-none"
                    style={{ top: '4%' }}
                >
                    <motion.div
                        key={kort.tittel}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="px-7 py-3 rounded-2xl bg-white/95 shadow-xl text-center border-b-4 border-red-800"
                    >
                        <div className="text-3xl font-black text-stone-900">{kort.tittel}</div>
                        {kort.tekst && (
                            <div className="text-xl font-semibold text-stone-500">{kort.tekst}</div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
