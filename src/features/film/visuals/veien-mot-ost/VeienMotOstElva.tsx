import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Vikingskipene i øst, i 3D, i fire moduser:
 *
 * «elv»: et langskip ror på en elv gjennom skogen. Beat 0: nær, ved årene. Beat 1: litt
 * lenger unna. Beat 2: høyt over, elva fortsetter så langt vi ser. Beat 3: flere skip.
 *
 * «miklagard»: byen ved havet, med sjømur, kupler og veddeløpsbanen. Beat 0: skipet
 * kommer fra havet. Beat 1: nær murene. Beat 2: hele byen ovenfra. Beat 3: veddeløpsbanen.
 *
 * «angrep»: flåten foran murene. Beat 1: byens skip. Beat 2-3: gresk ild brenner på vannet.
 * Beat 4: flåten snur, og et handelsskip går inn i havna. Ingen mennesker vises.
 *
 * «hjem»: Haralds skip på havet. Beat 1: skipet krenger under gullet. Beat 2: kysten
 * hjemme. Beat 3: hirden, vist som en lang rad skjold på stranda.
 */

type Modus = 'elv' | 'miklagard' | 'angrep' | 'hjem';
type Mal = { pos: THREE.Vector3; se: THREE.Vector3 };

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Tilfeldig tall med frø, så scenen ser lik ut hver gang. */
function fro(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/* ---------------- skipet ---------------- */

const SKJOLD_X = Array.from({ length: 10 }, (_, i) => -4.2 + i * 0.93);
const SKJOLD = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 12);
const ARE = new THREE.BoxGeometry(0.08, 0.08, 3.2);
const KISTE = new THREE.BoxGeometry(0.7, 0.5, 0.5);

/** Langskipet. Bauen peker langs +x. */
function Langskip({
    playing,
    aarer = true,
    seil = true,
    gull = false,
    skrogFarge = '#6b4423',
    skjold = true,
}: {
    playing: boolean;
    aarer?: boolean;
    seil?: boolean;
    gull?: boolean;
    skrogFarge?: string;
    skjold?: boolean;
}) {
    const rode = useRef<THREE.InstancedMesh>(null);
    const gule = useRef<THREE.InstancedMesh>(null);
    const arer = useRef<THREE.InstancedMesh>(null);
    const kister = useRef<THREE.InstancedMesh>(null);
    const klokke = useRef(0);

    useLayoutEffect(() => {
        const o = new THREE.Object3D();
        let r = 0;
        let g = 0;
        SKJOLD_X.forEach((x, i) => {
            for (const side of [-1, 1]) {
                o.position.set(x, 0.55, side * 1.36);
                o.rotation.set(Math.PI / 2, 0, 0);
                o.updateMatrix();
                const m = (i + (side > 0 ? 1 : 0)) % 2 === 0 ? rode.current : gule.current;
                if (m === rode.current) m?.setMatrixAt(r++, o.matrix);
                else m?.setMatrixAt(g++, o.matrix);
            }
        });
        if (rode.current) rode.current.instanceMatrix.needsUpdate = true;
        if (gule.current) gule.current.instanceMatrix.needsUpdate = true;
        if (kister.current) {
            for (let i = 0; i < 14; i++) {
                o.position.set(
                    -3.4 + (i % 7) * 1.05,
                    0.45 + Math.floor(i / 7) * 0.5,
                    (i % 2 ? 0.35 : -0.35) * (i < 7 ? 1 : 0.5)
                );
                o.rotation.set(0, fro(i) * 0.4, 0);
                o.updateMatrix();
                kister.current.setMatrixAt(i, o.matrix);
            }
            kister.current.instanceMatrix.needsUpdate = true;
        }
    }, []);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        klokke.current += dt;
        const m = arer.current;
        if (!m) return;
        const o = new THREE.Object3D();
        const sving = Math.sin(klokke.current * 2.4) * 0.32;
        const loft = Math.cos(klokke.current * 2.4) * 0.12;
        SKJOLD_X.forEach((x, i) => {
            [-1, 1].forEach((side, j) => {
                o.position.set(x + 0.45, 0.62, side * 1.3);
                o.rotation.set(side * (0.42 + loft), side * sving, 0);
                o.translateZ(side * 1.5);
                o.updateMatrix();
                m.setMatrixAt(i * 2 + j, o.matrix);
            });
        });
        m.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            <mesh scale={[6, 1.15, 1.4]} position={[0, 0.6, 0]}>
                <sphereGeometry args={[1, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                <meshStandardMaterial color={skrogFarge} flatShading side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.42, 0]}>
                <boxGeometry args={[9.6, 0.08, 2.0]} />
                <meshStandardMaterial color="#b98a52" flatShading />
            </mesh>
            {/* Stavnene foran og bak */}
            <mesh position={[6.1, 1.35, 0]} rotation={[0, 0, -0.45]}>
                <cylinderGeometry args={[0.14, 0.24, 2.0, 6]} />
                <meshStandardMaterial color="#4a2d14" flatShading />
            </mesh>
            <mesh position={[6.5, 2.35, 0]} rotation={[0, 0, 0.6]}>
                <coneGeometry args={[0.28, 0.9, 5]} />
                <meshStandardMaterial color="#4a2d14" flatShading />
            </mesh>
            <mesh position={[-6.1, 1.35, 0]} rotation={[0, 0, 0.45]}>
                <cylinderGeometry args={[0.14, 0.24, 2.0, 6]} />
                <meshStandardMaterial color="#4a2d14" flatShading />
            </mesh>
            {skjold && (
                <>
                    <instancedMesh ref={rode} args={[SKJOLD, undefined, 10]} frustumCulled={false}>
                        <meshStandardMaterial color="#b91c1c" flatShading />
                    </instancedMesh>
                    <instancedMesh ref={gule} args={[SKJOLD, undefined, 10]} frustumCulled={false}>
                        <meshStandardMaterial color="#facc15" flatShading />
                    </instancedMesh>
                </>
            )}
            {aarer && (
                <instancedMesh ref={arer} args={[ARE, undefined, 20]} frustumCulled={false}>
                    <meshStandardMaterial color="#8b5a2b" />
                </instancedMesh>
            )}
            <mesh position={[0.3, 3.6, 0]}>
                <cylinderGeometry args={[0.1, 0.14, 6.4, 6]} />
                <meshStandardMaterial color="#4a2d14" />
            </mesh>
            {seil && (
                <group position={[0.4, 4.2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
                        <mesh key={x} position={[x, 0, 0]}>
                            <boxGeometry args={[1.0, 3.4, 0.05]} />
                            <meshStandardMaterial
                                color={i % 2 ? '#f5f0e1' : '#b91c1c'}
                                emissive={i % 2 ? '#3b2a14' : '#3b0a0a'}
                                emissiveIntensity={0.25}
                            />
                        </mesh>
                    ))}
                </group>
            )}
            {gull && (
                <instancedMesh ref={kister} args={[KISTE, undefined, 14]} frustumCulled={false}>
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#b45309"
                        emissiveIntensity={0.7}
                        flatShading
                    />
                </instancedMesh>
            )}
        </group>
    );
}

/** Byens skip: mørkt skrog, uten skjold og årer, med et bronserør i baugen. */
function Galei() {
    return (
        <group>
            <mesh scale={[5, 1.0, 1.3]} position={[0, 0.55, 0]}>
                <sphereGeometry args={[1, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                <meshStandardMaterial color="#4c1d1d" flatShading side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[7, 0.8, 2.0]} />
                <meshStandardMaterial color="#7f1d1d" flatShading />
            </mesh>
            <mesh position={[4.8, 1.3, 0]} rotation={[0, 0, -Math.PI / 2 + 0.15]}>
                <cylinderGeometry args={[0.18, 0.28, 1.8, 8]} />
                <meshStandardMaterial color="#b45309" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[-0.5, 3.2, 0]}>
                <cylinderGeometry args={[0.1, 0.12, 4.6, 6]} />
                <meshStandardMaterial color="#3f2a14" />
            </mesh>
        </group>
    );
}

/* ---------------- elva ---------------- */

const TRE = new THREE.ConeGeometry(1.4, 5, 6);
const TRAER = 320;

function shipX(beat: number, t: number) {
    return beat * 16 + Math.min(t, 16) * 1.0;
}

function Elva({ beat, playing }: { beat: number; playing: boolean }) {
    const traer = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const m = traer.current;
        if (!m) return;
        const o = new THREE.Object3D();
        const c = new THREE.Color();
        for (let i = 0; i < TRAER; i++) {
            const side = i % 2 ? 1 : -1;
            const x = -120 + fro(i) * 520;
            const z = side * (11 + fro(i + 700) * 55);
            const s = 0.8 + fro(i + 1400) * 0.9;
            o.position.set(x, -0.3 + 2.5 * s, z);
            o.scale.set(s, s, s);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            c.set(fro(i + 99) > 0.5 ? '#2f5d3a' : '#3d6e3f');
            m.setColorAt(i, c);
        }
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, []);

    const skip = useRef<THREE.Group>(null);
    const folge = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const t = tid.current;
        const sx = shipX(beat, t);
        const g = skip.current;
        const k = forste.current;
        forste.current = false;
        if (g) g.position.x = k ? sx : damp(g.position.x, sx, 1.4, dt);
        const s = g ? g.position.x : sx;
        if (folge.current) {
            folge.current.position.x = s;
            folge.current.visible = beat >= 3;
        }
        const m: Mal =
            beat === 0
                ? { pos: v(s - 5, 3.0, 6.5), se: v(s + 5, 1.2, 0) }
                : beat === 1
                  ? { pos: v(s - 16, 6, 13), se: v(s + 2, 1, 0) }
                  : beat === 2
                    ? { pos: v(s - 30, 40, 30), se: v(s + 50, 0, 0) }
                    : { pos: v(s - 74, 14, 15), se: v(s - 20, 0, 0) };
        const f = k ? 1 : 1 - Math.exp(-1.3 * dt);
        camera.position.lerp(m.pos, f);
        se.current.lerp(m.se, f);
        camera.lookAt(se.current);
    });

    return (
        <>
            <color attach="background" args={['#c9d6dc']} />
            <fog attach="fog" args={['#c9d6dc', 60, 220]} />
            <hemisphereLight args={['#e6eef2', '#3d5233', 1.1]} />
            <directionalLight position={[30, 40, 20]} intensity={1.2} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[140, -0.35, 0]}>
                <planeGeometry args={[700, 300]} />
                <meshStandardMaterial color="#5f7d4a" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[140, -0.2, 0]}>
                <planeGeometry args={[700, 17]} />
                <meshStandardMaterial color="#3f7fa6" emissive="#1e3a52" emissiveIntensity={0.5} />
            </mesh>
            <instancedMesh ref={traer} args={[TRE, undefined, TRAER]} frustumCulled={false}>
                <meshStandardMaterial flatShading />
            </instancedMesh>
            <group ref={skip}>
                <Langskip playing={playing} />
            </group>
            <group ref={folge} visible={false}>
                {(
                    [
                        [-16, -3.5],
                        [-30, 3],
                        [-44, -2.5],
                        [-58, 2.5],
                    ] as const
                ).map(([x, z]) => (
                    <group key={x} position={[x, 0, z]} scale={0.85}>
                        <Langskip playing={playing} seil={false} />
                    </group>
                ))}
            </group>
        </>
    );
}

/* ---------------- Miklagard ---------------- */

const HUS = new THREE.BoxGeometry(1, 1, 1);
const SETE = new THREE.BoxGeometry(2.4, 1.6, 1.6);
const FLAMME = new THREE.ConeGeometry(0.9, 3, 6);
const HIPPO: [number, number] = [-26, -32];
const KUPLER: [number, number, number][] = [
    [8, -30, 5],
    [22, -44, 3.6],
    [-6, -52, 3.2],
];

function Byen({ fremhevBane }: { fremhevBane: boolean }) {
    const hus = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const seter = useRef<THREE.InstancedMesh>(null);
    const plass = useMemo(() => {
        const ut: [number, number, number, number][] = [];
        for (let i = 0; ut.length < 360 && i < 3000; i++) {
            const x = -70 + fro(i) * 140;
            const z = -14 - fro(i + 5000) * 66;
            const iBane = Math.abs(x - HIPPO[0]) < 19 && Math.abs(z - HIPPO[1]) < 9;
            const iKuppel = KUPLER.some(([kx, kz, r]) => Math.hypot(x - kx, z - kz) < r + 2.5);
            if (iBane || iKuppel) continue;
            ut.push([x, z, 1 + fro(i + 77) * 2.2, 1.6 + fro(i + 33) * 1.4]);
        }
        return ut;
    }, []);
    useLayoutEffect(() => {
        const o = new THREE.Object3D();
        const c = new THREE.Color();
        plass.forEach(([x, z, h, b], i) => {
            o.position.set(x, 0.5 + h / 2, z);
            o.scale.set(b, h, b * 0.9);
            o.rotation.set(0, 0, 0);
            o.updateMatrix();
            hus.current?.setMatrixAt(i, o.matrix);
            c.set(fro(i + 3) > 0.5 ? '#efe7d6' : '#e2d3b5');
            hus.current?.setColorAt(i, c);
            o.position.set(x, 0.5 + h + 0.15, z);
            o.scale.set(b * 1.05, 0.3, b * 0.95);
            o.updateMatrix();
            tak.current?.setMatrixAt(i, o.matrix);
        });
        if (hus.current) {
            hus.current.instanceMatrix.needsUpdate = true;
            if (hus.current.instanceColor) hus.current.instanceColor.needsUpdate = true;
        }
        if (tak.current) tak.current.instanceMatrix.needsUpdate = true;
        const n = 52;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const x = HIPPO[0] + Math.cos(a) * 15;
            const z = HIPPO[1] + Math.sin(a) * 6;
            o.position.set(x, 1.3, z);
            o.scale.set(1, 1, 1);
            o.rotation.set(0, -Math.atan2(Math.sin(a) * 15, Math.cos(a) * 6), 0);
            o.updateMatrix();
            seter.current?.setMatrixAt(i, o.matrix);
        }
        if (seter.current) seter.current.instanceMatrix.needsUpdate = true;
    }, [plass]);

    return (
        <group>
            {/* Landet */}
            <mesh position={[0, 0, -52]}>
                <boxGeometry args={[200, 1, 80]} />
                <meshStandardMaterial color="#d8c49a" flatShading />
            </mesh>
            {/* Sjømuren med tårn */}
            {Array.from({ length: 15 }, (_, i) => -70 + i * 10).map((x) => (
                <group key={x}>
                    <mesh position={[x + 5, 2.2, -12.5]}>
                        <boxGeometry args={[10, 3.4, 1.2]} />
                        <meshStandardMaterial color="#c8b48c" flatShading />
                    </mesh>
                    <mesh position={[x, 3, -12.5]}>
                        <boxGeometry args={[2.2, 5, 2.2]} />
                        <meshStandardMaterial color="#b9a47a" flatShading />
                    </mesh>
                </group>
            ))}
            <instancedMesh ref={hus} args={[HUS, undefined, plass.length]} frustumCulled={false}>
                <meshStandardMaterial flatShading />
            </instancedMesh>
            <instancedMesh ref={tak} args={[HUS, undefined, plass.length]} frustumCulled={false}>
                <meshStandardMaterial color="#b45309" flatShading />
            </instancedMesh>
            {KUPLER.map(([x, z, r]) => (
                <group key={x} position={[x, 0.5, z]}>
                    <mesh position={[0, r * 0.6, 0]}>
                        <boxGeometry args={[r * 2.4, r * 1.2, r * 2.4]} />
                        <meshStandardMaterial color="#f1e6cf" flatShading />
                    </mesh>
                    <mesh position={[0, r * 1.2, 0]}>
                        <sphereGeometry args={[r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color="#9fb7c9" flatShading />
                    </mesh>
                </group>
            ))}
            {/* Veddeløpsbanen */}
            <mesh
                position={[HIPPO[0], 0.52, HIPPO[1]]}
                scale={[15, 6, 1]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <circleGeometry args={[1, 32]} />
                <meshStandardMaterial color="#e8d9b0" />
            </mesh>
            <mesh position={[HIPPO[0], 0.9, HIPPO[1]]}>
                <boxGeometry args={[16, 0.8, 0.8]} />
                <meshStandardMaterial color="#a8916a" />
            </mesh>
            <instancedMesh ref={seter} args={[SETE, undefined, 52]} frustumCulled={false}>
                <meshStandardMaterial color="#cdb888" flatShading />
            </instancedMesh>
            {fremhevBane && (
                <mesh
                    position={[HIPPO[0], 2.6, HIPPO[1]]}
                    scale={[17.5, 8.2, 1]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <ringGeometry args={[0.93, 1, 48]} />
                    <meshBasicMaterial color="#facc15" side={THREE.DoubleSide} />
                </mesh>
            )}
        </group>
    );
}

function Hav() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 60]}>
            <planeGeometry args={[400, 260]} />
            <meshStandardMaterial color="#2f6f9a" emissive="#163a55" emissiveIntensity={0.55} />
        </mesh>
    );
}

/** Kameraet glir mot målet for beaten. Første bilde hopper rett dit. */
function useKamera(mal: (beat: number, t: number) => Mal, beat: number, playing: boolean) {
    const tid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const m = mal(beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return tid;
}

function kameraMiklagard(beat: number, t: number): Mal {
    if (beat === 0) return { pos: v(20 - t * 0.3, 7, 50), se: v(0, 3, -16) };
    if (beat === 1) return { pos: v(-34, 9, 16), se: v(0, 4, -18) };
    if (beat === 2) return { pos: v(0 + t * 0.4, 78, 34), se: v(0, 0, -38) };
    return { pos: v(HIPPO[0] + 6, 26, HIPPO[1] + 30), se: v(HIPPO[0], 0, HIPPO[1]) };
}

function Miklagard({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kameraMiklagard, beat, playing);
    const skip = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const z = beat === 0 ? 36 - Math.min(tid.current, 12) * 0.6 : 12;
        const g = skip.current;
        if (!g) return;
        g.position.z = forste.current ? z : damp(g.position.z, z, 1.2, dt);
        forste.current = false;
    });
    return (
        <>
            <color attach="background" args={['#cfe3ee']} />
            <fog attach="fog" args={['#cfe3ee', 90, 260]} />
            <hemisphereLight args={['#fff7e6', '#5a6b4a', 1.1]} />
            <directionalLight position={[40, 60, 40]} intensity={1.3} />
            <Hav />
            <Byen fremhevBane={beat >= 3} />
            <group ref={skip} position={[2, 0, 30]} rotation={[0, Math.PI / 2, 0]}>
                <Langskip playing={playing} />
            </group>
        </>
    );
}

/* ---------------- angrep ---------------- */

const FLAATE: [number, number][] = [
    [-20, 24],
    [-8, 26],
    [4, 23],
    [16, 27],
    [-14, 34],
    [10, 35],
];
const GALEIER: [number, number][] = [
    [-14, 4],
    [0, 3],
    [14, 4],
];
const FLAMMER = 44;

function kameraAngrep(beat: number, t: number): Mal {
    if (beat === 0) return { pos: v(34 - t * 0.4, 13, 58), se: v(0, 2, 8) };
    if (beat === 1) return { pos: v(20, 6, 18), se: v(0, 1.5, 4) };
    if (beat === 2) return { pos: v(-30, 9, 32), se: v(0, 1, 12) };
    if (beat === 3) return { pos: v(0, 34, 56), se: v(0, 0, 4) };
    return { pos: v(34, 20, 66), se: v(0, 1, 12) };
}

function Angrep({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kameraAngrep, beat, playing);
    const flammer = useRef<THREE.InstancedMesh>(null);
    const flaate = useRef<(THREE.Group | null)[]>([]);
    const handel = useRef<THREE.Group>(null);
    const klokke = useRef(0);
    const styrke = useRef(0);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        klokke.current += dt;
        const k = forste.current;
        forste.current = false;
        const mal = beat === 2 ? 0.7 : beat === 3 ? 1 : 0;
        styrke.current = k ? mal : damp(styrke.current, mal, 1.5, dt);
        const m = flammer.current;
        if (m) {
            const o = new THREE.Object3D();
            for (let i = 0; i < FLAMMER; i++) {
                const x = -26 + fro(i) * 52;
                const z = 9 + fro(i + 40) * 9;
                const fl = 0.7 + Math.sin(klokke.current * 6 + i * 1.7) * 0.25;
                const s = styrke.current * (0.6 + fro(i + 90) * 0.8) * fl;
                o.position.set(x, s * 1.4, z);
                o.scale.set(Math.max(s, 0.001), Math.max(s, 0.001), Math.max(s, 0.001));
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
            }
            m.instanceMatrix.needsUpdate = true;
        }
        const snur = beat >= 4;
        flaate.current.forEach((g, i) => {
            if (!g) return;
            const [x, z] = FLAATE[i];
            const malZ = snur ? z + 26 : z;
            const malR = snur ? -Math.PI / 2 : Math.PI / 2;
            g.position.z = k ? malZ : damp(g.position.z, malZ, 0.5, dt);
            g.rotation.y = k ? malR : damp(g.rotation.y, malR, 0.9, dt);
            g.position.x = x;
        });
        const h = handel.current;
        if (h) {
            const malZ = snur ? -4 : 46;
            h.position.z = k ? malZ : damp(h.position.z, malZ, 0.45, dt);
            h.visible = snur;
        }
    });
    return (
        <>
            <color attach="background" args={['#d9cdb8']} />
            <fog attach="fog" args={['#d9cdb8', 80, 240]} />
            <hemisphereLight args={['#fff1dc', '#4a4a3a', 1.0]} />
            <directionalLight position={[40, 50, 50]} intensity={1.2} />
            <Hav />
            <Byen fremhevBane={false} />
            {FLAATE.map(([x, z], i) => (
                <group
                    key={i}
                    ref={(g) => {
                        flaate.current[i] = g;
                    }}
                    position={[x, 0, z]}
                    rotation={[0, Math.PI / 2, 0]}
                    scale={0.8}
                >
                    <Langskip playing={playing} aarer={false} seil={i < 2} />
                </group>
            ))}
            {beat >= 1 &&
                GALEIER.map(([x, z]) => (
                    <group key={x} position={[x, 0, z]} rotation={[0, -Math.PI / 2, 0]} scale={0.8}>
                        <Galei />
                    </group>
                ))}
            <instancedMesh ref={flammer} args={[FLAMME, undefined, FLAMMER]} frustumCulled={false}>
                <meshBasicMaterial color="#f97316" />
            </instancedMesh>
            <group
                ref={handel}
                position={[30, 0, 46]}
                rotation={[0, Math.PI / 2, 0]}
                visible={false}
            >
                <Langskip playing={playing} aarer={false} gull skjold={false} />
            </group>
        </>
    );
}

/* ---------------- hjem ---------------- */

const HIRD = 60;

function Hjem({ beat, playing }: { beat: number; playing: boolean }) {
    const skip = useRef<THREE.Group>(null);
    const skjold = useRef<THREE.InstancedMesh>(null);
    const klokke = useRef(0);
    const krengning = useRef(0);
    const forste = useRef(true);
    useLayoutEffect(() => {
        const m = skjold.current;
        if (!m) return;
        const o = new THREE.Object3D();
        const c = new THREE.Color();
        for (let i = 0; i < HIRD; i++) {
            const rad = Math.floor(i / 20);
            o.position.set(64 + rad * 1.6, 0.9, -15 + (i % 20) * 1.55);
            o.rotation.set(0, 0, Math.PI / 2);
            o.scale.setScalar(1.6);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            c.set(i % 3 === 0 ? '#facc15' : i % 3 === 1 ? '#b91c1c' : '#1d4ed8');
            m.setColorAt(i, c);
        }
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, []);
    useKamera(
        (b: number, t: number) => {
            if (b === 0) return { pos: v(16 - t * 0.3, 5, 20), se: v(0, 1.8, 0) };
            if (b === 1) return { pos: v(4, 3.2, 15), se: v(0, 1.2, 0) };
            if (b === 2) return { pos: v(-18, 7, 6), se: v(60, 5, 0) };
            return { pos: v(44, 9, 18), se: v(66, 1.5, -1) };
        },
        beat,
        playing
    );
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        klokke.current += dt;
        const k = forste.current;
        forste.current = false;
        const mal = beat >= 1 ? 0.2 : 0.06;
        krengning.current = k ? mal : damp(krengning.current, mal, 1.2, dt);
        const g = skip.current;
        if (!g) return;
        g.rotation.x = krengning.current + Math.sin(klokke.current * 1.1) * 0.02;
        g.rotation.z = Math.sin(klokke.current * 0.8) * 0.02;
        g.position.y = -0.15 - krengning.current * 0.6 + Math.sin(klokke.current * 1.3) * 0.05;
    });
    return (
        <>
            <color attach="background" args={['#e6c9a8']} />
            <fog attach="fog" args={['#e6c9a8', 50, 180]} />
            <hemisphereLight args={['#ffe9cc', '#3a4a5a', 1.0]} />
            <directionalLight position={[60, 30, 20]} intensity={1.4} color="#ffd9a8" />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[500, 400]} />
                <meshStandardMaterial color="#3a6f8f" emissive="#1b3d55" emissiveIntensity={0.55} />
            </mesh>
            {/* Kysten hjemme */}
            <mesh position={[78, 0, 0]}>
                <boxGeometry args={[30, 0.8, 120]} />
                <meshStandardMaterial color="#7d8f5a" flatShading />
            </mesh>
            {[-40, -24, -8, 8, 24, 40].map((z, i) => (
                <mesh key={z} position={[92 + (i % 2) * 6, 9 + (i % 3) * 3, z]}>
                    <coneGeometry args={[14, 22 + (i % 3) * 6, 5]} />
                    <meshStandardMaterial color={i % 2 ? '#9aa89a' : '#8a9a8c'} flatShading />
                </mesh>
            ))}
            <instancedMesh ref={skjold} args={[SKJOLD, undefined, HIRD]} frustumCulled={false}>
                <meshStandardMaterial flatShading />
            </instancedMesh>
            <group ref={skip}>
                <Langskip playing={playing} aarer={false} gull />
            </group>
        </>
    );
}

/* ---------------- tekst over bildet ---------------- */

function tekstFor(modus: Modus, beat: number): { tittel: string; tekst?: string } | null {
    if (modus === 'elv') {
        if (beat === 0) return { tittel: 'Ved åra' };
        if (beat === 1) return { tittel: 'Fra Sverige', tekst: 'østover, dypt inn i landet' };
        if (beat === 2) return { tittel: 'En motorvei av vann' };
        return { tittel: 'Mange skip', tekst: 'svensker og noen få nordmenn' };
    }
    if (modus === 'miklagard') {
        if (beat === 0) return { tittel: 'Konstantinopel', tekst: 'i dag Istanbul' };
        if (beat === 1) return { tittel: 'Miklagard', tekst: 'mikill = stor, gard = gård' };
        if (beat === 2) return { tittel: 'Flere hundre tusen innbyggere' };
        return { tittel: 'Veddeløpsbanen', tekst: 'plass til 100 000 tilskuere' };
    }
    if (modus === 'angrep') {
        if (beat === 0) return { tittel: 'Flåten ved murene', tekst: 'byen ble aldri tatt' };
        if (beat === 1) return { tittel: 'Byens skip', tekst: 'med et fryktet våpen' };
        if (beat === 2) return { tittel: 'Gresk ild', tekst: 'nafta, bek og svovel' };
        if (beat === 3) return { tittel: 'Gresk ild', tekst: 'brenner på vann' };
        return { tittel: 'Handel i stedet for krig' };
    }
    if (beat === 0) return { tittel: 'Hjemover', tekst: 'rundt 1043 eller 1044' };
    if (beat === 1) return { tittel: 'Skjevt i sjøen', tekst: 'tungt lastet med gull' };
    if (beat === 2) return { tittel: 'Formue gir makt', tekst: 'i maktkampen hjemme' };
    return { tittel: 'En stor hird', tekst: 'kongens egne krigere' };
}

function Boks({ children }: { children: ReactNode }) {
    return (
        <div
            className="absolute flex justify-start pointer-events-none"
            style={{ top: '4%', left: '3%' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="px-7 py-3 rounded-2xl bg-white/95 shadow-xl border-b-4 border-red-800"
            >
                {children}
            </motion.div>
        </div>
    );
}

export function VeienMotOstElva({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'elv';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const innhold = tekstFor(modus, beat);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [20, 8, 30], far: 600 }}
            >
                {modus === 'elv' && <Elva beat={beat} playing={playing} />}
                {modus === 'miklagard' && <Miklagard beat={beat} playing={playing} />}
                {modus === 'angrep' && <Angrep beat={beat} playing={playing} />}
                {modus === 'hjem' && <Hjem beat={beat} playing={playing} />}
            </Canvas>
            {innhold && (
                <Boks key={`${modus}-${innhold.tittel}-${innhold.tekst ?? ''}`}>
                    <div className="text-3xl font-black text-stone-900">{innhold.tittel}</div>
                    {innhold.tekst && (
                        <div className="text-xl font-semibold text-stone-500">{innhold.tekst}</div>
                    )}
                </Boks>
            )}
        </div>
    );
}
