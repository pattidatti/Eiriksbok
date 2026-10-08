import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { TitanicSkip } from './TitanicSkip';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

type Modus = 'kollisjon' | 'storrelse' | 'synker';

/** Dempet glidning mot et mål, uavhengig av bildefrekvens. */
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

/** Kameraets mål for hver beat. `t` er sekunder siden beaten startet. */
function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'kollisjon') {
        switch (beat) {
            case 0:
                return { pos: v(22 - t * 0.6, 8 + t * 0.1, 30 - t * 0.4), se: v(0, 2, 0) };
            case 1:
                return {
                    pos: v(-15 + Math.min(t, 10) * 2.2, 2.6, 8.5),
                    se: v(-6 + Math.min(t, 10) * 2.2, 2.2, 0),
                };
            case 2:
                return { pos: v(9.5, 6.2, -0.6), se: v(40, 0.8, 3) };
            case 3:
                return { pos: v(12, 6, 24), se: v(0, 1.5, 2) };
            default:
                return { pos: v(-32, 11, 24), se: v(0, 1, 0) };
        }
    }
    if (modus === 'storrelse') {
        switch (beat) {
            case 0:
                return { pos: v(26 - t * 1.2, 6, 20), se: v(0, 2, 0) };
            case 1:
                return { pos: v(0, 46, 26), se: v(0, 0, 6) };
            case 2:
                return { pos: v(-10 + t * 0.8, 9, 15), se: v(0, 2.5, 0) };
            default:
                return { pos: v(-16, 9, 19), se: v(2, 4, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(24, 4, -26), se: v(0, 1, 0) };
        case 1:
            return { pos: v(-8, 14 + t * 0.3, -30), se: v(0, 4, 0) };
        case 2:
            return { pos: v(-26, 2.2, -24), se: v(2, Math.max(-2, 2 - t * 0.4), 0) };
        default:
            return { pos: v(-18, 3 + t * 0.4, -26), se: v(0, 0, 0) };
    }
}

function Isfjell() {
    const biter = useMemo(
        () =>
            [
                { p: [0, 1.2, 0], s: [3.2, 3.4, 2.6], r: [0.3, 0.2, 0.1] },
                { p: [1.6, 0.6, 0.8], s: [2.2, 2.0, 2.0], r: [0.8, 0.4, 0.3] },
                { p: [-1.5, 0.4, -0.5], s: [2.4, 1.6, 2.2], r: [0.1, 1.2, 0.5] },
                { p: [0.4, 2.9, -0.2], s: [1.5, 1.9, 1.3], r: [0.5, 0.9, 0.2] },
            ] as const,
        []
    );
    return (
        <group>
            {biter.map((b, i) => (
                <mesh
                    key={i}
                    position={b.p as unknown as [number, number, number]}
                    scale={b.s as unknown as [number, number, number]}
                    rotation={b.r as unknown as [number, number, number]}
                >
                    <dodecahedronGeometry args={[0.7, 0]} />
                    <meshStandardMaterial
                        color="#e8f1fb"
                        emissive="#5b7fa6"
                        emissiveIntensity={0.35}
                        flatShading
                        roughness={0.4}
                    />
                </mesh>
            ))}
        </group>
    );
}

function Fotballbaner({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.y, synlig ? 1 : 0.001, 4, dt);
        g.scale.set(1, s, 1);
        g.visible = s > 0.01;
    });
    return (
        <group ref={ref} position={[0, 0.05, 6.5]}>
            {[-9, 0, 9].map((x) => (
                <group key={x} position={[x, 0, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[8.8, 5.8]} />
                        <meshStandardMaterial color="#3f9d4a" />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                        <ringGeometry args={[0.85, 0.95, 32]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                        <planeGeometry args={[0.08, 5.8]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    {[-1, 1].map((side) => (
                        <mesh
                            key={side}
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[side * 4.4, 0.02, 0]}
                        >
                            <planeGeometry args={[0.08, 5.8]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

const ROYK_ANTALL = 54;

/** Røyk fra de tre fremste skorsteinene (den fjerde var bare til pynt). */
function Royk({ mengde, skip }: { mengde: number; skip: React.RefObject<THREE.Group | null> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const partikler = useMemo(
        () =>
            Array.from({ length: ROYK_ANTALL }, (_, i) => ({
                alder: (i / ROYK_ANTALL) * 6,
                kilde: i % 3,
            })),
        []
    );
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, dt) => {
        const m = ref.current;
        if (!m) return;
        const kilder = [4.7, 1.6, -1.5];
        partikler.forEach((p, i) => {
            p.alder = (p.alder + dt) % 6;
            const a = p.alder;
            const x = kilder[p.kilde] - 0.6 - a * 1.6;
            o.position.set(x, 6.3 + a * 0.55, Math.sin(i * 7.3) * 0.25 * a);
            const s = (0.35 + a * 0.35) * mengde;
            o.scale.setScalar(s);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
        if (skip.current) m.position.y = skip.current.position.y;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, ROYK_ANTALL]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
                color="#6b6b6b"
                transparent
                opacity={0.45}
                roughness={1}
                depthWrite={false}
            />
        </instancedMesh>
    );
}

/** Radiosignal: ringer som vokser ut fra masta. */
function Radio({ aktiv }: { aktiv: boolean }) {
    const ringer = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, dt) => {
        tid.current += dt;
        ringer.current.forEach((r, i) => {
            if (!r) return;
            const fase = ((tid.current + i * 0.7) % 2.1) / 2.1;
            r.scale.setScalar(0.5 + fase * 14);
            const mat = r.material as THREE.MeshBasicMaterial;
            mat.opacity = aktiv ? (1 - fase) * 0.8 : damp(mat.opacity, 0, 3, dt);
        });
    });
    return (
        <group position={[10.2, 7.4, 0]}>
            {[0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        ringer.current[i] = m;
                    }}
                    rotation={[0, Math.PI / 2, 0]}
                >
                    <torusGeometry args={[1, 0.035, 6, 48]} />
                    <meshBasicMaterial color="#fde68a" transparent opacity={0} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
}

/** Livbåter som ror bort fra skipet, med en lykt hver. */
function Livbater({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const bater = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => ({
                vinkel: -2.4 + i * 0.5,
                start: 3.5 + (i % 3) * 1.2,
                fart: 0.35 + (i % 4) * 0.08,
            })),
        []
    );
    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.visible = synlig;
        if (synlig) tid.current += dt;
        ref.current.children.forEach((c, i) => {
            const b = bater[i];
            const r = Math.min(26, b.start + tid.current * b.fart);
            c.position.set(
                Math.cos(b.vinkel) * r * 1.4,
                0.1 + Math.sin(tid.current * 1.3 + i) * 0.05,
                -Math.abs(Math.sin(b.vinkel)) * r - 2
            );
        });
    });
    return (
        <group ref={ref}>
            {bater.map((_, i) => (
                <group key={i}>
                    <mesh>
                        <boxGeometry args={[0.8, 0.22, 0.32]} />
                        <meshStandardMaterial color="#e2e8f0" />
                    </mesh>
                    <mesh position={[0, 0.3, 0]}>
                        <sphereGeometry args={[0.07, 8, 8]} />
                        <meshBasicMaterial color="#fde68a" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const skip = useRef<THREE.Group>(null);
    const isfjell = useRef<THREE.Group>(null);
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3(0, 2, 0));
    const forste = useRef(true);
    const natt = modus !== 'storrelse';

    const lys = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: natt ? '#ffd27a' : '#1f2937',
                side: THREE.DoubleSide,
            }),
        [natt]
    );
    useEffect(() => () => lys.dispose(), [lys]);

    // Isfjellets plass i forhold til skipet.
    const isRel = useRef(new THREE.Vector3(90, 0, 3.4));

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        const s = skip.current;
        if (!s) return;

        // Skipets bevegelse.
        let pitch = 0;
        let y = 0;
        let yaw = 0;
        let lysPaa = natt ? 1 : 0;
        if (modus === 'kollisjon') {
            if (beat >= 3) yaw = Math.min(1, t / 2.5) * 0.14;
            if (beat >= 4) {
                yaw = 0.14;
                pitch = -0.012;
            }
            // Isfjellet: kommer mot oss, glir langs styrbord, blir liggende igjen bak.
            const mål = beat < 2 ? 90 : beat === 2 ? 30 : beat === 3 ? -18 : -45;
            const fart = beat === 3 ? 0.55 : 0.8;
            isRel.current.x = damp(isRel.current.x, mål, fart, dt);
            if (isfjell.current) {
                isfjell.current.position.set(isRel.current.x, 0, isRel.current.z);
                isfjell.current.visible = isRel.current.x < 85;
            }
        } else if (modus === 'synker') {
            const stadier = [
                { p: -0.04, y: -0.35 },
                { p: -0.075, y: -0.75 },
            ];
            if (beat <= 1) {
                pitch = stadier[beat].p;
                y = stadier[beat].y;
            } else {
                // 02.20: baugen går under, lysene blinker og slukner, så er skipet borte.
                pitch = -0.075 - Math.min(1, t / 5) * 0.32;
                y = -0.75 - Math.max(0, t - 2.5) * Math.max(0, t - 2.5) * 0.9;
                if (t > 3 && t < 4.2) lysPaa = Math.sin(t * 40) > 0 ? 1 : 0.15;
                else if (t >= 4.2) lysPaa = 0;
                if (beat >= 3) {
                    y = -60;
                    lysPaa = 0;
                }
            }
        }
        s.rotation.z = damp(
            s.rotation.z,
            pitch,
            beat === 2 && modus === 'synker' ? 4 : 1.2,
            dt || 0.016
        );
        s.rotation.y = damp(s.rotation.y, yaw, 1.4, dt || 0.016);
        s.position.y =
            modus === 'synker' && beat >= 2 ? y : damp(s.position.y, y, 1.2, dt || 0.016);
        s.visible = s.position.y > -40;
        const varm = new THREE.Color(natt ? '#ffd27a' : '#1f2937');
        lys.color.copy(varm).multiplyScalar(lysPaa > 0 ? lysPaa : natt ? 0.04 : 1);

        // Kamera.
        const mål = kameraFor(modus, beat, t);
        // Risting når isen skraper skroget.
        if (modus === 'kollisjon' && beat === 3 && Math.abs(isRel.current.x) < 12 && playing) {
            mål.pos.x += (Math.random() - 0.5) * 0.25;
            mål.pos.y += (Math.random() - 0.5) * 0.18;
        }
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * (dt || 0));
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
    });

    return (
        <>
            <color attach="background" args={[natt ? '#0a1630' : '#bfe3ff']} />
            <fog
                attach="fog"
                args={[natt ? '#0e1f3f' : '#cfe8fb', natt ? 60 : 70, natt ? 220 : 260]}
            />
            {natt ? (
                <>
                    <ambientLight intensity={0.5} color="#a9bce0" />
                    <directionalLight position={[-30, 40, -20]} intensity={0.55} color="#9db6e8" />
                    <hemisphereLight args={['#2a3d66', '#02050c', 0.35]} />
                    <Stars radius={180} depth={40} count={2500} factor={5} fade speed={0.3} />
                </>
            ) : (
                <>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[30, 50, 25]} intensity={1.6} color="#fff6e5" />
                    <hemisphereLight args={['#dbeafe', '#1e3a5f', 0.5]} />
                </>
            )}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[800, 800]} />
                <meshStandardMaterial
                    color={natt ? '#123563' : '#2f78b5'}
                    emissive={natt ? '#0a2142' : '#000000'}
                    roughness={natt ? 0.3 : 0.45}
                    metalness={natt ? 0.2 : 0.1}
                />
            </mesh>
            <TitanicSkip ref={skip} lysMaterial={lys} />
            {modus === 'kollisjon' && (
                <group ref={isfjell} position={[90, 0, 3.4]}>
                    <Isfjell />
                </group>
            )}
            {modus === 'storrelse' && (
                <>
                    <Fotballbaner synlig={beat === 1} />
                    <Royk mengde={beat >= 3 ? 1.25 : 0.75} skip={skip} />
                </>
            )}
            {modus === 'synker' && (
                <>
                    <Radio aktiv={beat === 1} />
                    <Livbater synlig />
                </>
            )}
        </>
    );
}

interface Props {
    modus: Modus;
}

export function TitanicHavet({ beat, playing, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'kollisjon';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 900, position: [22, 8, 30] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {modus === 'kollisjon' && beat === 2 && (
                    <motion.div
                        key="isfjell"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[12%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-xl bg-red-600/90 text-white font-display font-bold text-2xl md:text-4xl tracking-wide shadow-xl"
                    >
                        Isfjell rett forut!
                    </motion.div>
                )}
                {modus === 'storrelse' && beat === 0 && (
                    <Merkelapp key="lengde" tekst="269 meter" />
                )}
                {modus === 'storrelse' && beat === 1 && (
                    <Merkelapp key="baner" tekst="≈ 3 fotballbaner" />
                )}
                {modus === 'storrelse' && beat === 2 && (
                    <motion.div
                        key="tall"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[8%] left-1/2 -translate-x-1/2 flex gap-4"
                    >
                        <Teller verdi={2435} etikett="passasjerplasser" />
                        <Teller
                            verdi={900}
                            etikett="i mannskapet"
                            forsinkelse={0.9}
                            prefiks="ca. "
                        />
                    </motion.div>
                )}
                {modus === 'storrelse' && beat === 3 && (
                    <Merkelapp key="damp" tekst="Kull → damp → fart" />
                )}
                {modus === 'synker' && beat === 1 && (
                    <Merkelapp key="sos" tekst="Nødsignal: CQD … SOS" />
                )}
            </AnimatePresence>
        </div>
    );
}

function Merkelapp({ tekst }: { tekst: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[9%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
        >
            {tekst}
        </motion.div>
    );
}
