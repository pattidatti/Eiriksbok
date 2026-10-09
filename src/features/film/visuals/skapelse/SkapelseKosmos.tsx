import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Kosmos i 3D, i fire modus:
 * - natt: natthimmel over en ås, eleven ser opp.
 * - ord: mørke over dypet, så lys, så en verden av ingenting.
 * - ring: tiden som linje mot tiden som ring. Verdener blir til, består og går under.
 * - bigbang: et tett, varmt punkt som utvider seg.
 */

type Modus = 'natt' | 'ord' | 'ring' | 'bigbang';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Fast tilfeldig rekke, så stjernene og partiklene ligger likt hver gang. */
function tilfeldig(frø: number) {
    let s = frø;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'natt') {
        switch (beat) {
            case 0:
                return { pos: v(0, 2.5, 14), se: v(0, 10 + t * 0.3, -30) };
            case 1:
                return { pos: v(-4, 3, 13), se: v(-8 + t * 0.6, 22, -30) };
            default:
                return { pos: v(10, 8 + t * 0.2, 26), se: v(0, 10, -20) };
        }
    }
    if (modus === 'ord') {
        switch (beat) {
            case 0:
                return { pos: v(0, 4, 26), se: v(0, 2, 0) };
            case 1:
                return { pos: v(0, 3, 22), se: v(0, 6, 0) };
            case 2:
                return { pos: v(4, 5, 22), se: v(0, 6, 0) };
            case 3:
                return { pos: v(-6 + t * 0.4, 7, 18), se: v(0, 6, 0) };
            default:
                return { pos: v(10 - t * 0.4, 9, 15), se: v(0, 6, 0) };
        }
    }
    if (modus === 'ring') {
        switch (beat) {
            case 0:
                return { pos: v(0, 14, 24), se: v(0, 0, 0) };
            case 1:
                return { pos: v(-7, 16, 30), se: v(-7, -1, 0) };
            case 2:
                return { pos: v(4, 9, 18), se: v(0, 0, 0) };
            case 3:
                return { pos: v(-3 + t * 0.3, 6, 17), se: v(0, 0, 0) };
            default:
                return { pos: v(0, 12, 22), se: v(0, 4, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 0, 12), se: v(0, 0, 0) };
        case 1:
            return { pos: v(0, 2, 22 + t * 1.2), se: v(0, 0, 0) };
        case 2:
            return { pos: v(8, 4, 34), se: v(0, 0, 0) };
        case 3:
            return { pos: v(-10, 6, 36), se: v(0, 0, 0) };
        default:
            return { pos: v(0, 10, 44 + t * 0.6), se: v(0, 0, 0) };
    }
}

/** Melkeveien: et bånd av lyse punkter som blir tydeligere for hver beat. */
function Melkevei({ styrke }: { styrke: number }) {
    const ref = useRef<THREE.PointsMaterial>(null);
    const geo = useMemo(() => {
        const n = 1400;
        const pos = new Float32Array(n * 3);
        const r = tilfeldig(7);
        for (let i = 0; i < n; i++) {
            const x = (r() - 0.5) * 160;
            const spredning = (r() - 0.5) * (r() * 18);
            pos[i * 3] = x;
            pos[i * 3 + 1] = 26 + x * 0.25 + spredning;
            pos[i * 3 + 2] = -60 + (r() - 0.5) * 10;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return g;
    }, []);
    useEffect(() => () => geo.dispose(), [geo]);
    useFrame((_, dt) => {
        if (ref.current) ref.current.opacity = damp(ref.current.opacity, styrke, 1.5, dt);
    });
    return (
        <points geometry={geo}>
            <pointsMaterial
                ref={ref}
                color="#e8eeff"
                size={0.5}
                transparent
                opacity={0}
                sizeAttenuation
                fog={false}
            />
        </points>
    );
}

function Natt({ beat }: { beat: number }) {
    return (
        <>
            <Melkevei styrke={[0.35, 0.75, 1][Math.min(beat, 2)]} />
            {/* Åsen eleven ligger på */}
            <mesh position={[0, -38, -6]} scale={[2.2, 1, 1.4]}>
                <sphereGeometry args={[40, 32, 16]} />
                <meshStandardMaterial color="#14321f" emissive="#0b2216" flatShading />
            </mesh>
            {[
                [-16, -10],
                [-12, -16],
                [14, -12],
                [19, -18],
                [9, -20],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 1.2 + (i % 2) * 0.4, z]}>
                    <coneGeometry args={[1.2, 4 + (i % 3), 6]} />
                    <meshStandardMaterial color="#0f2a1b" emissive="#071a10" flatShading />
                </mesh>
            ))}
        </>
    );
}

/** «Gud sa»: lysringer som brer seg ut, og en verden som vokser fram av ingenting. */
function Ord({ beat, tid }: { beat: number; tid: React.RefObject<number> }) {
    const lys = useRef<THREE.Mesh>(null);
    const verden = useRef<THREE.Group>(null);
    const ringer = useRef<THREE.Group>(null);
    const dyp = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, rawDt) => {
        const dt = Math.max(rawDt, 0.001);
        const t = tid.current ?? 0;
        const l = lys.current;
        if (l) {
            const mål = beat === 0 ? 0.01 : beat === 1 ? 0.5 : beat === 2 ? 1.4 : 0.01;
            const s = damp(l.scale.x, mål, 2, dt);
            l.scale.setScalar(s);
        }
        const w = verden.current;
        if (w) {
            const mål = beat >= 3 ? 1 : 0.001;
            const s = damp(w.scale.x, mål, 1.6, dt);
            w.scale.setScalar(s);
            w.rotation.y += dt * 0.25;
            w.visible = s > 0.01;
        }
        const r = ringer.current;
        if (r) {
            r.visible = beat === 2;
            r.children.forEach((c, i) => {
                const fase = ((t * 0.9 + i * 0.35) % 3.5) / 3.5;
                c.scale.setScalar(0.5 + fase * 9);
                const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
                m.opacity = (1 - fase) * 0.8;
            });
        }
        if (dyp.current) {
            const mål = beat >= 3 ? 0.35 : 0.08;
            dyp.current.emissiveIntensity = damp(dyp.current.emissiveIntensity, mål, 2, dt);
        }
    });
    return (
        <>
            {/* Dypet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial
                    ref={dyp}
                    color="#0b1d3a"
                    emissive="#1e3a6e"
                    emissiveIntensity={0.08}
                    roughness={0.3}
                />
            </mesh>
            {/* Lyset */}
            <mesh ref={lys} position={[0, 6, 0]} scale={0.01}>
                <sphereGeometry args={[2.2, 32, 16]} />
                <meshBasicMaterial color="#fff6d8" fog={false} toneMapped={false} />
            </mesh>
            <pointLight position={[0, 6, 8]} intensity={beat >= 1 ? 60 : 0} color="#ffe6a8" />
            {/* Tre lys for de tre religionene, bare i første beat */}
            {beat === 0 &&
                ['#3b82f6', '#6366f1', '#10b981'].map((f, i) => (
                    <group key={f} position={[-6 + i * 6, 5, 0]}>
                        <mesh>
                            <sphereGeometry args={[0.9, 20, 12]} />
                            <meshBasicMaterial color={f} fog={false} toneMapped={false} />
                        </mesh>
                        <Html position={[0, -2, 0]} center>
                            <Etikett tekst={['Jødedom', 'Kristendom', 'Islam'][i]} farge={f} />
                        </Html>
                    </group>
                ))}
            <group ref={ringer} position={[0, 6, 0]}>
                {Array.from({ length: 10 }, (_, i) => (
                    <mesh key={i}>
                        <ringGeometry args={[0.95, 1, 64]} />
                        <meshBasicMaterial
                            color="#ffe6a8"
                            transparent
                            side={THREE.DoubleSide}
                            fog={false}
                        />
                    </mesh>
                ))}
            </group>
            {/* Verden som blir til */}
            <group ref={verden} position={[0, 6, 0]} scale={0.001}>
                <mesh>
                    <icosahedronGeometry args={[3.2, 2]} />
                    <meshStandardMaterial
                        color="#2f7fd1"
                        emissive="#0f2f5a"
                        flatShading
                        roughness={0.5}
                    />
                </mesh>
                {[
                    [0.4, 0.5, 0.75],
                    [-0.7, 0.1, 0.7],
                    [0.2, -0.6, 0.8],
                    [0.8, -0.2, -0.55],
                    [-0.3, 0.75, -0.6],
                ].map((p, i) => {
                    const d = new THREE.Vector3(...p).normalize().multiplyScalar(3.0);
                    return (
                        <mesh key={i} position={d} scale={[1.4, 0.7, 1.2]}>
                            <dodecahedronGeometry args={[1, 0]} />
                            <meshStandardMaterial color="#4caf50" emissive="#1b4d1e" flatShading />
                        </mesh>
                    );
                })}
            </group>
        </>
    );
}

const VERDENER = 6;

/** Tiden som ring: verdener går rundt, vokser fram, lyser og forsvinner. Og tiden som linje. */
function Ring({ beat, tid }: { beat: number; tid: React.RefObject<number> }) {
    const verdener = useRef<THREE.Group>(null);
    const linje = useRef<THREE.Group>(null);
    const sjel = useRef<THREE.Mesh>(null);
    const vinkel = useRef(0);
    useFrame((_, rawDt) => {
        const dt = Math.max(rawDt, 0.001);
        const t = tid.current ?? 0;
        vinkel.current += dt * (beat >= 2 ? 0.45 : 0.2);
        const g = verdener.current;
        if (g) {
            g.children.forEach((c, i) => {
                const a = vinkel.current + (i / VERDENER) * Math.PI * 2;
                c.position.set(Math.cos(a) * 8, 0.6, Math.sin(a) * 8);
                // Fase i kretsløpet: blir til (0-0.3), består (0.3-0.7), går under (0.7-1).
                const f = (((a / (Math.PI * 2)) % 1) + 1) % 1;
                const s = f < 0.3 ? f / 0.3 : f < 0.7 ? 1 : Math.max(0.02, (1 - f) / 0.3);
                c.scale.setScalar(0.2 + s * 1.1);
            });
        }
        const l = linje.current;
        if (l) {
            const mål = beat === 1 ? 1 : 0.001;
            const s = damp(l.scale.x, mål, 3, dt);
            l.scale.set(s, s, s);
            l.visible = s > 0.02;
        }
        const sj = sjel.current;
        if (sj) {
            sj.visible = beat >= 4;
            sj.position.set(8, 0.6 + Math.min(t, 6) * 1.3, 0);
        }
    });
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 20, 10]} intensity={1.4} />
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[8, 0.22, 12, 96]} />
                <meshBasicMaterial color="#f59e0b" fog={false} toneMapped={false} />
            </mesh>
            <group ref={verdener}>
                {Array.from({ length: VERDENER }, (_, i) => (
                    <mesh key={i}>
                        <icosahedronGeometry args={[0.9, 1]} />
                        <meshStandardMaterial
                            color={
                                ['#2f7fd1', '#4caf50', '#3b82f6', '#22c55e', '#0ea5e9', '#16a34a'][
                                    i
                                ]
                            }
                            emissive="#16325c"
                            flatShading
                        />
                    </mesh>
                ))}
            </group>
            {beat === 2 && (
                <>
                    <Html position={[6.8, 1, 9.4]} center>
                        <Etikett tekst="blir til" />
                    </Html>
                    <Html position={[-11.5, 1, 0]} center>
                        <Etikett tekst="består" />
                    </Html>
                    <Html position={[6.8, 1, -9.4]} center>
                        <Etikett tekst="går under" />
                    </Html>
                </>
            )}
            {/* Linja: tiden med en start */}
            <group ref={linje} position={[-24, 0, 4]} scale={0.001}>
                <mesh position={[7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.2, 0.2, 14, 12]} />
                    <meshBasicMaterial color="#60a5fa" fog={false} toneMapped={false} />
                </mesh>
                <mesh position={[14.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.6, 1.4, 12]} />
                    <meshBasicMaterial color="#60a5fa" fog={false} toneMapped={false} />
                </mesh>
                <mesh>
                    <sphereGeometry args={[0.7, 16, 12]} />
                    <meshBasicMaterial color="#ffffff" fog={false} toneMapped={false} />
                </mesh>
                <Html position={[0, 2, 0]} center>
                    <Etikett tekst="start" farge="#2563eb" />
                </Html>
            </group>
            <mesh ref={sjel}>
                <sphereGeometry args={[0.8, 16, 12]} />
                <meshBasicMaterial color="#fde68a" fog={false} toneMapped={false} />
            </mesh>
        </>
    );
}

const PARTIKLER = 420;

/** Big Bang: et punkt som utvider seg til et univers av lys. */
function Smell({ beat, tid }: { beat: number; tid: React.RefObject<number> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const kjerne = useRef<THREE.Mesh>(null);
    const utvidelse = useRef(0);
    const data = useMemo(() => {
        const r = tilfeldig(11);
        return Array.from({ length: PARTIKLER }, () => {
            const u = r() * 2 - 1;
            const th = r() * Math.PI * 2;
            const k = Math.sqrt(1 - u * u);
            const flat = 0.45;
            return {
                dir: new THREE.Vector3(k * Math.cos(th), u * flat, k * Math.sin(th)),
                lengde: 4 + r() * 22,
                farge: new THREE.Color().setHSL(0.55 + r() * 0.12, 0.7, 0.55 + r() * 0.3),
            };
        });
    }, []);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        data.forEach((d, i) => m.setColorAt(i, d.farge));
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [data]);
    useFrame((_, rawDt) => {
        const dt = Math.max(rawDt, 0.001);
        const t = tid.current ?? 0;
        const mål = beat === 0 ? 0 : beat === 1 ? Math.min(1, t / 6) : 1;
        utvidelse.current = damp(utvidelse.current, mål, 2.5, dt);
        const e = utvidelse.current;
        const m = ref.current;
        if (m) {
            data.forEach((d, i) => {
                dummy.position.copy(d.dir).multiplyScalar(d.lengde * e);
                dummy.scale.setScalar(0.08 + e * 0.22);
                dummy.updateMatrix();
                m.setMatrixAt(i, dummy.matrix);
            });
            m.instanceMatrix.needsUpdate = true;
            m.visible = e > 0.01;
        }
        const k = kjerne.current;
        if (k) {
            const puls = beat === 0 ? 1 + Math.sin(t * 4) * 0.15 : 1;
            k.scale.setScalar(Math.max(0.05, (1 - e) * 0.9 * puls + 0.05));
            const mat = k.material as THREE.MeshBasicMaterial;
            mat.color.setHSL(0.1, 1, 0.6 + (1 - e) * 0.35);
        }
    });
    return (
        <>
            <mesh ref={kjerne}>
                <sphereGeometry args={[1, 24, 16]} />
                <meshBasicMaterial color="#fff7d6" fog={false} toneMapped={false} />
            </mesh>
            <instancedMesh ref={ref} args={[undefined, undefined, PARTIKLER]}>
                <sphereGeometry args={[1, 8, 6]} />
                <meshBasicMaterial fog={false} toneMapped={false} />
            </instancedMesh>
        </>
    );
}

function Etikett({ tekst, farge = '#b45309' }: { tekst: string; farge?: string }) {
    return (
        <div
            className="px-3 py-1 rounded-xl bg-white/95 font-bold text-lg md:text-2xl shadow-lg whitespace-nowrap"
            style={{ color: farge }}
        >
            {tekst}
        </div>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mål = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
    });

    const bakgrunn = modus === 'ord' ? '#060c1c' : modus === 'bigbang' ? '#03050d' : '#0a1630';
    return (
        <>
            <color attach="background" args={[bakgrunn]} />
            <fog attach="fog" args={[bakgrunn, 60, 220]} />
            <ambientLight intensity={0.45} color="#a9bce0" />
            <hemisphereLight args={['#2a3d66', '#02050c', 0.4]} />
            {modus !== 'ord' && (
                <Stars
                    radius={160}
                    depth={40}
                    count={modus === 'natt' ? 3000 : 1500}
                    factor={5}
                    fade
                    speed={0.3}
                />
            )}
            {modus === 'natt' && <Natt beat={beat} />}
            {modus === 'ord' && <Ord beat={beat} tid={beatTid} />}
            {modus === 'ring' && <Ring beat={beat} tid={beatTid} />}
            {modus === 'bigbang' && <Smell beat={beat} tid={beatTid} />}
        </>
    );
}

const TEKSTER: Record<Modus, (string | null)[]> = {
    natt: [null, 'Har alt dette alltid vært der?', 'Hvem satte det i gang?'],
    ord: [
        'Jødedom · kristendom · islam',
        'Mørke over dypet',
        '«Gud sa»: ti ganger',
        'Skapt av ingenting',
        'ex nihilo = av ingenting',
    ],
    ring: [
        'Hinduismen: formen på tiden',
        'Linje med en start, eller en ring?',
        'Blir til, består, går under',
        'Ingen første gang',
        'Målet: slippe ut av kretsløpet',
    ],
    bigbang: [
        'Naturvitenskapen',
        'Big Bang: startet tett og varmt',
        'Georges Lemaître: fysiker og prest',
        'Forteller hvordan, ikke hvorfor',
        'Mennesket må lage mening selv',
    ],
};

export function SkapelseKosmos({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'natt';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = TEKSTER[modus][Math.min(beat, TEKSTER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                dpr={dpr}
                camera={{ fov: 45, near: 0.3, far: 600, position: [0, 4, 26] }}
                gl={{ antialias: true }}
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
            <AnimatePresence>
                {modus === 'bigbang' && beat === 2 && (
                    <motion.div
                        key="lemaitre"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[10%] left-1/2 -translate-x-1/2 flex gap-4"
                    >
                        <Brikke tekst="fysiker" farge="#0284c7" />
                        <span className="self-center text-white font-black text-4xl">+</span>
                        <Brikke tekst="prest" farge="#d97706" />
                    </motion.div>
                )}
                {modus === 'bigbang' && beat === 3 && (
                    <motion.div
                        key="hvordan"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[10%] left-1/2 -translate-x-1/2 flex gap-6"
                    >
                        <Brikke tekst="Hvordan? ✓" farge="#0d9488" />
                        <Brikke tekst="Hvorfor? ?" farge="#64748b" />
                    </motion.div>
                )}
                {modus === 'bigbang' && beat === 4 && (
                    <motion.div
                        key="mening"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[10%] left-1/2 -translate-x-1/2"
                    >
                        <Brikke tekst="Mening: lages av oss selv" farge="#4f46e5" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Brikke({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <div
            style={{ background: farge }}
            className={`px-6 py-3 rounded-2xl text-white font-display font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap`}
        >
            {tekst}
        </div>
    );
}
