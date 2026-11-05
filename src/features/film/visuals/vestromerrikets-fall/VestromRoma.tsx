import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Roma i 3D: bymuren, husene og Jupiter-tempelet.
 * - port: natten i 410. Fakler samler seg utenfor porten, porten går opp, byen gløder.
 * - tempel: 455. Gulltaket skinner, halve taket løftes av, skip med gull seiler bort.
 * - ruiner: Forum forfaller, søylene er knekt, kuer beiter mellom ruinene.
 * Ingen mennesker vises, bare fakler, ting og steder.
 */

type Modus = 'port' | 'tempel' | 'ruiner';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Tilfeldig tall med frø, så scenen ser lik ut hver gang. */
function fro(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const MUR_R = 18;
const ELV_X = -27;

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'port') {
        switch (beat) {
            case 0:
                return { pos: v(4 - t * 0.3, 5, 50), se: v(0, 3, 18) };
            case 1:
                return { pos: v(-34 + t * 0.4, 24, 40), se: v(0, 1, 0) };
            case 2:
                return { pos: v(16, 6, 44), se: v(0, 2, 26) };
            case 3:
                return { pos: v(0, 7, 42 - Math.min(t, 6) * 0.8), se: v(0, 3, 16) };
            default:
                return { pos: v(26, 42, 44), se: v(0, 0, 0) };
        }
    }
    if (modus === 'tempel') {
        switch (beat) {
            case 0:
                return { pos: v(32 - t * 0.4, 20, 34), se: v(0, 2, 0) };
            case 1:
                return { pos: v(13, 8, 15), se: v(0, 5, -2) };
            case 2:
                return { pos: v(15, 12, 12), se: v(0, 6, -2) };
            case 3:
                return { pos: v(-8, 15, 30), se: v(ELV_X + 2, 1, 6) };
            default:
                return { pos: v(28, 26, 28), se: v(0, 3, 0) };
        }
    }
    if (beat === 0) return { pos: v(16 - t * 0.3, 6, 17), se: v(0, 3, -2) };
    return { pos: v(-14, 5, 15), se: v(-1, 1.5, 0) };
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
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

/** Bymuren som en ring av murbiter, med tårn. Porten står mot kameraet (+z). */
function Mur({ natt }: { natt: boolean }) {
    const biter = useRef<THREE.InstancedMesh>(null);
    const taarn = useRef<THREE.InstancedMesh>(null);
    const N = 40;
    useLayoutEffect(() => {
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        let i = 0;
        for (let k = 0; k < N; k++) {
            const a = (k / N) * Math.PI * 2 + Math.PI / 2;
            // Hopp over biten der porten står.
            if (Math.abs(Math.cos(a)) < 0.06 && Math.sin(a) > 0) continue;
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + Math.PI / 2);
            m.compose(v(Math.cos(a) * MUR_R, 1.6, Math.sin(a) * MUR_R), q, v(3.0, 3.2, 0.9));
            biter.current?.setMatrixAt(i++, m);
        }
        if (biter.current) {
            biter.current.count = i;
            biter.current.instanceMatrix.needsUpdate = true;
        }
        for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2 + Math.PI / 2 + Math.PI / 10;
            m.compose(
                v(Math.cos(a) * MUR_R, 2.2, Math.sin(a) * MUR_R),
                q.identity(),
                v(1.8, 4.4, 1.8)
            );
            taarn.current?.setMatrixAt(k, m);
        }
        if (taarn.current) taarn.current.instanceMatrix.needsUpdate = true;
    }, []);
    const farge = natt ? '#8a8578' : '#d9c9a3';
    return (
        <group>
            <instancedMesh ref={biter} args={[undefined, undefined, N]} frustumCulled={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={farge}
                    emissive={natt ? '#1c2236' : '#000000'}
                    flatShading
                />
            </instancedMesh>
            <instancedMesh ref={taarn} args={[undefined, undefined, 10]} frustumCulled={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={farge}
                    emissive={natt ? '#1c2236' : '#000000'}
                    flatShading
                />
            </instancedMesh>
        </group>
    );
}

/** Porten med to tårn og to dørfløyer som går opp. */
function Port({ apen, natt, playing }: { apen: boolean; natt: boolean; playing: boolean }) {
    const v1 = useRef<THREE.Group>(null);
    const v2 = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mal = apen ? 1.45 : 0;
        const k = forste.current ? 1 : 1 - Math.exp(-1.6 * dt);
        forste.current = false;
        if (v1.current)
            v1.current.rotation.y = THREE.MathUtils.lerp(v1.current.rotation.y, -mal, k);
        if (v2.current) v2.current.rotation.y = THREE.MathUtils.lerp(v2.current.rotation.y, mal, k);
    });
    const stein = natt ? '#8a8578' : '#d9c9a3';
    const tre = '#6b4423';
    return (
        <group position={[0, 0, MUR_R]}>
            {[-2.6, 2.6].map((x) => (
                <mesh key={x} position={[x, 2.8, 0]}>
                    <boxGeometry args={[2.2, 5.6, 2.2]} />
                    <meshStandardMaterial
                        color={stein}
                        emissive={natt ? '#1c2236' : '#000000'}
                        flatShading
                    />
                </mesh>
            ))}
            <mesh position={[0, 4.4, 0]}>
                <boxGeometry args={[3.2, 1.2, 1.6]} />
                <meshStandardMaterial
                    color={stein}
                    emissive={natt ? '#1c2236' : '#000000'}
                    flatShading
                />
            </mesh>
            <group ref={v1} position={[-1.5, 0, 0.2]}>
                <mesh position={[0.75, 1.9, 0]}>
                    <boxGeometry args={[1.5, 3.8, 0.25]} />
                    <meshStandardMaterial color={tre} emissive="#2a1606" />
                </mesh>
            </group>
            <group ref={v2} position={[1.5, 0, 0.2]}>
                <mesh position={[-0.75, 1.9, 0]}>
                    <boxGeometry args={[1.5, 3.8, 0.25]} />
                    <meshStandardMaterial color={tre} emissive="#2a1606" />
                </mesh>
            </group>
        </group>
    );
}

/** Husene innenfor muren. I ruinmodus står bare noen få lave murrester igjen. */
function Hus({ modus, natt }: { modus: Modus; natt: boolean }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const N = 110;
    useLayoutEffect(() => {
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        let i = 0;
        let j = 0;
        for (let k = 0; i < N && k < 600; k++) {
            const r = 4 + Math.sqrt(fro(k)) * (MUR_R - 6);
            const a = fro(k + 900) * Math.PI * 2;
            const x = Math.cos(a) * r;
            const z = Math.sin(a) * r;
            if (Math.abs(x) < 7 && Math.abs(z + 2) < 9) continue; // tempelhøyden
            if (Math.abs(x) < 3 && z > 8) continue; // gata fra porten
            const ruin = modus === 'ruiner';
            if (ruin && fro(k + 77) > 0.25) continue;
            const b = 1.2 + fro(k + 3) * 1.4;
            const d = 1.2 + fro(k + 5) * 1.4;
            const h = ruin ? 0.4 + fro(k + 9) * 0.6 : 1 + fro(k + 7) * 1.6;
            q.setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                Math.round(fro(k + 11) * 4) * (Math.PI / 2) + 0.15
            );
            m.compose(v(x, h / 2, z), q, v(b, h, d));
            kropp.current?.setMatrixAt(i++, m);
            if (!ruin) {
                m.compose(v(x, h + 0.35, z), q, v(b * 0.78, 0.7, d * 0.78));
                tak.current?.setMatrixAt(j++, m);
            }
        }
        if (kropp.current) {
            kropp.current.count = i;
            kropp.current.instanceMatrix.needsUpdate = true;
        }
        if (tak.current) {
            tak.current.count = j;
            tak.current.instanceMatrix.needsUpdate = true;
        }
    }, [modus]);
    return (
        <group>
            <instancedMesh ref={kropp} args={[undefined, undefined, N]} frustumCulled={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={natt ? '#a59f90' : '#eadcc0'}
                    emissive={natt ? '#262b40' : '#000000'}
                    flatShading
                />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, N]} frustumCulled={false}>
                <coneGeometry args={[0.75, 1, 4, 1]} />
                <meshStandardMaterial
                    color="#b4532a"
                    emissive={natt ? '#2a0f06' : '#000000'}
                    flatShading
                />
            </instancedMesh>
        </group>
    );
}

const TEMPEL_Z = -2;
const SOYLER: [number, number][] = [];
for (let i = 0; i < 6; i++) {
    SOYLER.push([-3.75 + i * 1.5, 3.6]);
    SOYLER.push([-3.75 + i * 1.5, -7.6]);
}
for (let i = 1; i < 7; i++) {
    SOYLER.push([-3.75, 3.6 - i * 1.6]);
    SOYLER.push([3.75, 3.6 - i * 1.6]);
}

/** Jupiter-tempelet på en høyde. Taket er to halvdeler av gullplater. */
function Tempel({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const soyler = useRef<THREE.InstancedMesh>(null);
    const ruin = modus === 'ruiner';
    const natt = modus === 'port';
    useLayoutEffect(() => {
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        SOYLER.forEach(([x, z], i) => {
            const h = ruin ? (fro(i + 40) > 0.55 ? 4.4 : 0.6 + fro(i + 41) * 2.4) : 4.4;
            const synlig = !ruin || fro(i + 60) > 0.2;
            m.compose(v(x, 2 + h / 2, z), q, synlig ? v(1, h, 1) : v(0.001, 0.001, 0.001));
            soyler.current?.setMatrixAt(i, m);
        });
        if (soyler.current) soyler.current.instanceMatrix.needsUpdate = true;
    }, [ruin]);

    const plater = useRef<(THREE.Mesh | null)[]>([]);
    const forste = useRef(true);
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const k = forste.current ? 1 : 1 - Math.exp(-1.2 * dt);
        forste.current = false;
        plater.current.forEach((p, i) => {
            if (!p) return;
            const hoyre = i >= 6;
            const borte = modus === 'tempel' && hoyre && beat >= 2;
            const iLufta = borte && beat === 2;
            // Platene løftes én etter én, så de ser ut til å bli revet av.
            const forsinket = iLufta ? Math.max(0, beatTid.current - (i - 6) * 0.35) : 0;
            const malY = iLufta ? Math.min(forsinket, 3) * 1.6 : 0;
            const malS = borte
                ? iLufta
                    ? Math.max(0, 1 - Math.max(0, forsinket - 2) * 0.6)
                    : 0
                : 1;
            p.position.y = THREE.MathUtils.lerp(p.position.y, malY, k);
            const s = THREE.MathUtils.lerp(p.scale.x, malS, k);
            p.scale.setScalar(Math.max(s, 0.001));
            p.visible = s > 0.02;
        });
    });

    const gullMat = useMemo(
        () => ({
            color: '#f2c14e',
            emissive: '#a8740c',
            emissiveIntensity: 0.55,
            metalness: 0.6,
            roughness: 0.3,
        }),
        []
    );
    const marmor = natt ? '#b7b3a6' : '#f1ece0';
    const front = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-4.6, 0);
        s.lineTo(4.6, 0);
        s.lineTo(0, 1.6);
        s.closePath();
        return s;
    }, []);
    return (
        <group position={[0, 0, TEMPEL_Z]}>
            <mesh position={[0, 0.5, -2]}>
                <cylinderGeometry args={[8, 9, 1, 24]} />
                <meshStandardMaterial
                    color={ruin ? '#7fa155' : natt ? '#4a5a3c' : '#9fb26e'}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 1.5, -2]}>
                <boxGeometry args={[9.4, 1, 13]} />
                <meshStandardMaterial
                    color={marmor}
                    emissive={natt ? '#22263a' : '#000000'}
                    flatShading
                />
            </mesh>
            <instancedMesh
                ref={soyler}
                args={[undefined, undefined, SOYLER.length]}
                frustumCulled={false}
            >
                <cylinderGeometry args={[0.32, 0.38, 1, 10]} />
                <meshStandardMaterial
                    color={marmor}
                    emissive={natt ? '#22263a' : '#000000'}
                    flatShading
                />
            </instancedMesh>
            {!ruin && (
                <>
                    <mesh position={[0, 6.7, -2]}>
                        <boxGeometry args={[9.2, 0.6, 12.6]} />
                        <meshStandardMaterial
                            color={marmor}
                            emissive={natt ? '#22263a' : '#000000'}
                            flatShading
                        />
                    </mesh>
                    {[4.3, -8.3].map((z) => (
                        <mesh key={z} position={[0, 7, z]}>
                            <extrudeGeometry args={[front, { depth: 0.3, bevelEnabled: false }]} />
                            <meshStandardMaterial
                                color={marmor}
                                emissive={natt ? '#22263a' : '#000000'}
                                flatShading
                            />
                        </mesh>
                    ))}
                    {/* Halvdelen til venstre (i 0-5) og til høyre (i 6-11), plate for plate langs taket. */}
                    {Array.from({ length: 12 }, (_, i) => {
                        const hoyre = i >= 6;
                        const z = 3.4 - (i % 6) * 2.1;
                        return (
                            <group
                                key={i}
                                position={[hoyre ? 2.35 : -2.35, 7.8, z]}
                                rotation={[0, 0, hoyre ? -0.33 : 0.33]}
                            >
                                <mesh
                                    ref={(m) => {
                                        plater.current[i] = m;
                                    }}
                                >
                                    <boxGeometry args={[5, 0.22, 2.05]} />
                                    <meshStandardMaterial {...gullMat} />
                                </mesh>
                            </group>
                        );
                    })}
                    {/* Bjelkene som blir synlige når gullet er borte. */}
                    {modus === 'tempel' &&
                        [3, 1, -1, -3, -5, -7].map((z) => (
                            <mesh key={z} position={[2.2, 7.6, z]} rotation={[0, 0, -0.33]}>
                                <boxGeometry args={[4.6, 0.18, 0.3]} />
                                <meshStandardMaterial color="#5b3a1e" />
                            </mesh>
                        ))}
                </>
            )}
            {ruin && (
                <>
                    {[
                        [5.5, 0.4, 3, 1.2],
                        [-6, 0.4, -1, 0.4],
                        [4.8, 0.4, -6, 2.2],
                    ].map(([x, y, z, r], i) => (
                        <mesh key={i} position={[x, y + 0.5, z]} rotation={[0, r, Math.PI / 2]}>
                            <cylinderGeometry args={[0.35, 0.35, 3.4, 10]} />
                            <meshStandardMaterial color={marmor} flatShading />
                        </mesh>
                    ))}
                </>
            )}
        </group>
    );
}

/** Fakler i en klynge utenfor porten. De trekker inn gjennom porten fra beat 3. */
function Fakler({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const N = 90;
    const pos = useMemo(
        () =>
            Array.from({ length: N }, (_, i) => ({
                x: (fro(i) - 0.5) * 18,
                z: MUR_R + 4 + fro(i + 300) * 14,
                inn: fro(i + 500),
            })),
        []
    );
    const tid = useRef(0);
    const forrige = useRef(-1);
    const synlig = useRef(0);
    const m = useMemo(() => new THREE.Matrix4(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const mal = beat >= 2 ? 1 : 0;
        synlig.current = forrige.current === -1 ? mal : damp(synlig.current, mal, 2, dt);
        if (beat >= 2 && synlig.current < 0.9 && dt === 0) synlig.current = 1;
        const g = ref.current;
        if (!g) return;
        pos.forEach((p, i) => {
            let x = p.x;
            let z = p.z;
            if (beat >= 3) {
                // Faklene går mot porten og videre inn i byen, i en strøm.
                const t = Math.max(0, (beat === 3 ? tid.current : 8) - p.inn * 4);
                const fram = Math.min(1, t / 6);
                x = THREE.MathUtils.lerp(p.x, p.x * 0.15, Math.min(1, fram * 2));
                z = p.z - fram * (p.z - (MUR_R - 8 - p.inn * 6));
            }
            const flimmer = 0.8 + Math.sin(tid.current * 9 + i) * 0.2;
            const s = 0.22 * synlig.current * flimmer;
            m.compose(v(x, 1.4, z), new THREE.Quaternion(), v(s, s, s));
            g.setMatrixAt(i, m);
        });
        g.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#ffb347" toneMapped={false} />
        </instancedMesh>
    );
}

/** Oransje glød over byen når den plyndres. */
function Glod({ beat, playing }: { beat: number; playing: boolean }) {
    const lys = useRef<THREE.PointLight>(null);
    const himmel = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 1;
        const mal = beat >= 4 ? 1 : beat >= 3 ? 0.35 : 0;
        if (lys.current) lys.current.intensity = damp(lys.current.intensity, mal * 900, 1.5, dt);
        const mat = himmel.current?.material as THREE.MeshBasicMaterial | undefined;
        if (mat) mat.opacity = damp(mat.opacity, mal * 0.28, 1.5, dt);
    });
    return (
        <>
            <pointLight
                ref={lys}
                position={[0, 8, 4]}
                color="#ff8a3d"
                intensity={0}
                distance={60}
                decay={1.6}
            />
            <mesh ref={himmel} position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[MUR_R - 0.5, 40]} />
                <meshBasicMaterial
                    color="#ff7a2e"
                    transparent
                    opacity={0}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
        </>
    );
}

/** Skip på elva, lastet med gullkasser. De seiler nedover elva fra beat 3. */
function Skip({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        if (!ref.current) return;
        const fart = beat === 3 ? Math.min(tid.current, 12) * 0.9 : beat > 3 ? 11 : 0;
        ref.current.position.z = 2 + fart;
    });
    const last = beat >= 3;
    return (
        <group ref={ref} position={[ELV_X, 0, 2]}>
            {[0, 1, 2].map((i) => (
                <group key={i} position={[(i % 2) * 2.2 - 1.1, 0.25, -i * 6]}>
                    <mesh>
                        <boxGeometry args={[1.8, 0.7, 4.6]} />
                        <meshStandardMaterial color="#6b4423" flatShading />
                    </mesh>
                    <mesh position={[0, 1.8, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 3.4, 6]} />
                        <meshStandardMaterial color="#4a2e14" />
                    </mesh>
                    <mesh position={[0, 2, 0.15]}>
                        <boxGeometry args={[0.06, 2.2, 1.9]} />
                        <meshStandardMaterial color="#f5ecd8" />
                    </mesh>
                    {last &&
                        [-1.2, 0, 1.2].map((z) => (
                            <mesh key={z} position={[0.35, 0.6, z]}>
                                <boxGeometry args={[0.6, 0.5, 0.8]} />
                                <meshStandardMaterial
                                    color="#f2c14e"
                                    emissive="#a8740c"
                                    emissiveIntensity={0.6}
                                />
                            </mesh>
                        ))}
                </group>
            ))}
        </group>
    );
}

/** Kuer som beiter mellom ruinene. */
function Kuer({ synlig }: { synlig: boolean }) {
    const steder: [number, number, number][] = [
        [-6.5, 2, 1.2],
        [-4.5, 5.5, 2.4],
        [6.5, 1, 0.3],
        [-8, -3, 0.9],
        [2.5, 7, 1.8],
    ];
    if (!synlig) return null;
    return (
        <group>
            {steder.map(([x, z, r], i) => (
                <group key={i} position={[x, 1, z + TEMPEL_Z]} rotation={[0, r, 0]}>
                    <mesh position={[0, 0.75, 0]}>
                        <boxGeometry args={[1.5, 0.75, 0.7]} />
                        <meshStandardMaterial color={i % 2 ? '#7c4a2a' : '#efe7da'} flatShading />
                    </mesh>
                    <mesh position={[0.9, 0.85, 0]}>
                        <boxGeometry args={[0.45, 0.45, 0.45]} />
                        <meshStandardMaterial color={i % 2 ? '#5e3820' : '#d8cbb8'} flatShading />
                    </mesh>
                    {[-0.55, 0.55].map((lx) =>
                        [-0.22, 0.22].map((lz) => (
                            <mesh key={`${lx}${lz}`} position={[lx, 0.2, lz]}>
                                <boxGeometry args={[0.15, 0.4, 0.15]} />
                                <meshStandardMaterial color="#3f2a1a" />
                            </mesh>
                        ))
                    )}
                </group>
            ))}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const natt = modus === 'port';
    const ruin = modus === 'ruiner';
    const himmel = natt ? '#0d1a38' : ruin ? '#f2cf9e' : '#a9d3ef';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 60, 150]} />
            <ambientLight intensity={natt ? 0.55 : 0.75} color={natt ? '#8ea4d8' : '#ffffff'} />
            <hemisphereLight
                args={[
                    natt ? '#3c4f86' : '#fff4dc',
                    natt ? '#1a2333' : '#6c7a4a',
                    natt ? 0.6 : 0.8,
                ]}
            />
            <directionalLight
                position={ruin ? [-30, 18, 20] : [30, 40, 20]}
                intensity={natt ? 0.5 : 1.6}
                color={natt ? '#b6c6ff' : ruin ? '#ffcc8a' : '#fff6e0'}
            />
            {natt && <Stars radius={160} depth={40} count={2000} factor={5} fade speed={0.3} />}

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[240, 240]} />
                <meshStandardMaterial
                    color={natt ? '#3b4a3a' : ruin ? '#93a85e' : '#b9b386'}
                    emissive={natt ? '#121a26' : '#000000'}
                />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ELV_X, 0.05, 0]}>
                <planeGeometry args={[6, 240]} />
                <meshStandardMaterial
                    color={natt ? '#2c4a78' : '#4f8fc0'}
                    emissive={natt ? '#14254a' : '#1d3d5c'}
                    emissiveIntensity={0.5}
                />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, MUR_R / 2 + 2]}>
                <planeGeometry args={[2.6, MUR_R - 4]} />
                <meshStandardMaterial
                    color={natt ? '#6d6a60' : '#cdbf9c'}
                    emissive={natt ? '#1a1c24' : '#000000'}
                />
            </mesh>

            <Mur natt={natt} />
            <Port apen={natt && beat >= 3} natt={natt} playing={playing} />
            <Hus modus={modus} natt={natt} />
            <Tempel modus={modus} beat={beat} playing={playing} />
            {natt && <Fakler beat={beat} playing={playing} />}
            {natt && <Glod beat={beat} playing={playing} />}
            {modus === 'tempel' && <Skip beat={beat} playing={playing} />}
            {ruin && <Kuer synlig={beat >= 1} />}

            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

function merke(modus: Modus, beat: number): { tittel: string; tekst?: string } | null {
    if (modus === 'port') {
        return [
            { tittel: 'Roma', tekst: 'natten til 24. august 410' },
            { tittel: 'Det utenkelige', tekst: 'at noen skal ta selve Roma' },
            { tittel: 'Visigoterne', tekst: 'ledet av kong Alarik' },
            { tittel: 'De bryter inn', tekst: 'denne natten' },
            { tittel: 'Plyndret i tre dager', tekst: 'alt av verdi tas med makt' },
        ][Math.min(beat, 4)];
    }
    if (modus === 'tempel') {
        return [
            { tittel: 'Roma, år 455', tekst: 'vandalene tømmer byen' },
            { tittel: 'Jupiter-tempelet', tekst: 'tak av bronse og gull, etter Prokopios' },
            { tittel: 'Halve taket revet av', tekst: 'etter Prokopios' },
            { tittel: 'Til Kartago', tekst: 'gull og skatter i skip' },
            { tittel: 'vandalisme', tekst: 'å ødelegge ting med vilje' },
        ][Math.min(beat, 4)];
    }
    return [
        { tittel: 'Forum Romanum', tekst: 'det gamle hjertet i riket' },
        { tittel: 'Beite mellom ruinene', tekst: 'kuer på det gamle torget' },
    ][Math.min(beat, 1)];
}

export function VestromRoma({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'port';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const m = merke(modus, beat);
    const natt = modus === 'port';
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [30, 20, 40] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute pointer-events-none" style={{ left: '4%', bottom: '7%' }}>
                <AnimatePresence mode="wait">
                    {m && (
                        <motion.div
                            key={m.tittel}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className={`px-6 py-3 rounded-2xl shadow-xl ${natt ? 'bg-slate-900/85 text-white' : 'bg-white/92 text-slate-900'}`}
                        >
                            <div className="font-display font-black text-4xl">{m.tittel}</div>
                            {m.tekst && (
                                <div
                                    className={`text-2xl font-semibold mt-1 ${natt ? 'text-amber-200' : 'text-slate-600'}`}
                                >
                                    {m.tekst}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {modus === 'port' && beat >= 4 && (
                <div
                    className="absolute pointer-events-none flex gap-3"
                    style={{ right: '4%', bottom: '7%' }}
                >
                    {[1, 2, 3].map((d) => (
                        <motion.div
                            key={d}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + d * 0.6 }}
                            className="rounded-2xl bg-orange-600 text-white text-center shadow-xl"
                            style={{ width: 110, padding: '10px 0' }}
                        >
                            <div className="text-xl font-semibold">dag</div>
                            <div className="text-5xl font-black">{d}</div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
