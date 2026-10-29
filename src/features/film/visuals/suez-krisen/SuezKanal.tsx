import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Suezkanalen i 3D: en blå stripe gjennom ørkenen, med hav i hver ende.
 * «kanal»: et skip glir gjennom ørkenen, kameraet stiger så begge havene synes, og til slutt
 * kontoret til kanalselskapet med britisk og fransk flagg.
 * «fn»: FN-postene (UNEF) reiser seg i Sinai, én etter én, og en hvit FN-bil kjører langs linja.
 */

type Modus = 'kanal' | 'fn';

const KANAL_LENGDE = 90;
const KANAL_BREDDE = 5;
const POSTER = Array.from({ length: 8 }, (_, i) => -28 + i * 8);
const FN_LINJE = -16;

function skipMål(beat: number, t: number) {
    switch (beat) {
        case 0:
            return -20 + Math.min(t, 14) * 0.6;
        case 1:
            return -8 + Math.min(t, 14) * 0.4;
        case 2:
            return 0 + Math.min(t, 14) * 0.4;
        default:
            return 6 + Math.min(t, 14) * 0.4;
    }
}

function kameraKanal(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(-30 + t * 0.5, 3.5, 11), se: v(-17 + t * 0.6, 1.2, 0) };
        case 1:
            return { pos: v(0, 52, 46), se: v(0, 0, -2) };
        case 2:
            return { pos: v(-6 + t * 0.2, 4.5, 11), se: v(2 + t * 0.3, 1.2, 0) };
        default:
            return { pos: v(24, 8, -15), se: v(13, 1.5, 3) };
    }
}

function kameraFn(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(-22 + t * 0.3, 6, -2), se: v(-8, 1, FN_LINJE) };
        case 1:
            return { pos: v(10, 4, -7), se: v(4, 1.5, FN_LINJE) };
        case 2:
            return { pos: v(0, 44, 10), se: v(0, 0, -18) };
        default:
            return { pos: v(-28 + t * 0.4, 18, -2), se: v(0, 0, -19) };
    }
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera(modus === 'fn' ? kameraFn : kameraKanal, beat, playing);
    return null;
}

/** Sanddyner som flate kuler, aldri nær kanalen. */
function Dyner() {
    const antall = 46;
    return (
        <instancedMesh
            ref={(m) => {
                // Matrisene settes én gang når meshen finnes.
                if (!m) return;
                const o = new THREE.Object3D();
                for (let i = 0; i < antall; i++) {
                    const side = i % 2 === 0 ? 1 : -1;
                    const x = -42 + frø(i) * 84;
                    let z = side * (9 + frø(i + 50) * 45);
                    // Ikke oppå FN-linja i Sinai.
                    if (z < FN_LINJE + 6 && z > FN_LINJE - 6) z = FN_LINJE - 10 - frø(i + 7) * 20;
                    const s = 3 + frø(i + 100) * 6;
                    o.position.set(x, -0.2, z);
                    o.scale.set(s * 1.6, s * 0.28, s);
                    o.updateMatrix();
                    m.setMatrixAt(i, o.matrix);
                }
                m.instanceMatrix.needsUpdate = true;
            }}
            args={[undefined, undefined, antall]}
            frustumCulled={false}
        >
            <sphereGeometry args={[1, 10, 6]} />
            <meshStandardMaterial color="#e2bf7e" flatShading />
        </instancedMesh>
    );
}

function Landskap() {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[400, 300]} />
                <meshStandardMaterial color="#ecd29a" />
            </mesh>
            {/* Kanalbreddene: mørkere sand langs vannet */}
            {[1, -1].map((s) => (
                <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, s * (KANAL_BREDDE / 2 + 0.8)]}>
                    <planeGeometry args={[KANAL_LENGDE, 1.6]} />
                    <meshStandardMaterial color="#c9a467" />
                </mesh>
            ))}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <planeGeometry args={[KANAL_LENGDE + 2, KANAL_BREDDE]} />
                <meshStandardMaterial color="#1f7fb8" emissive="#145a85" emissiveIntensity={0.45} />
            </mesh>
            {/* Middelhavet i vest, Rødehavet i øst */}
            {[-1, 1].map((s) => (
                <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * (KANAL_LENGDE / 2 + 40), 0.03, 0]}>
                    <planeGeometry args={[80, 300]} />
                    <meshStandardMaterial color="#1f7fb8" emissive="#145a85" emissiveIntensity={0.45} />
                </mesh>
            ))}
            <Dyner />
        </group>
    );
}

function Skip({ beat, playing }: { beat: number; playing: boolean }) {
    const g = useRef<THREE.Group>(null);
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
        const s = g.current;
        if (!s) return;
        const mål = skipMål(beat, tid.current);
        s.position.x = forste.current ? mål : damp(s.position.x, mål, 1.5, dt);
        forste.current = false;
    });
    return (
        <group ref={g} position={[-20, 0, 0]}>
            <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[9, 1.1, 2.2]} />
                <meshStandardMaterial color="#1f2937" flatShading />
            </mesh>
            <mesh position={[4.9, 0.55, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[1.12, 1, 4]} />
                <meshStandardMaterial color="#1f2937" flatShading />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[9.1, 0.25, 2.25]} />
                <meshStandardMaterial color="#b91c1c" />
            </mesh>
            <mesh position={[-2.6, 1.7, 0]}>
                <boxGeometry args={[2.6, 1.3, 1.9]} />
                <meshStandardMaterial color="#f8fafc" flatShading />
            </mesh>
            <mesh position={[-2.2, 2.8, 0]}>
                <cylinderGeometry args={[0.35, 0.4, 1.3, 10]} />
                <meshStandardMaterial color="#f59e0b" />
            </mesh>
            <mesh position={[1.8, 1.4, 0]}>
                <boxGeometry args={[3.4, 0.7, 1.7]} />
                <meshStandardMaterial color="#7c2d12" flatShading />
            </mesh>
        </group>
    );
}

/** Kontoret til kanalselskapet, med to flagg som heises på beat 3. */
function Kontor({ beat, playing }: { beat: number; playing: boolean }) {
    const flagg = useRef<(THREE.Group | null)[]>([]);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        flagg.current.forEach((f) => {
            if (!f) return;
            const mål = beat >= 3 ? 1 : 0;
            f.position.y = damp(f.position.y, mål * 3.2 + 1.6, 2, dt || 0.016);
        });
    });
    const striper: [string[], 'v' | 'h'][] = [
        [['#1d4ed8', '#f8fafc', '#dc2626'], 'v'],
        [['#1e3a8a', '#dc2626', '#1e3a8a'], 'h'],
    ];
    return (
        <group position={[16, 0, 7.5]}>
            <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[6, 2.4, 3]} />
                <meshStandardMaterial color="#f5f0e6" flatShading />
            </mesh>
            <mesh position={[0, 2.55, 0]}>
                <boxGeometry args={[6.3, 0.3, 3.3]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>
            {striper.map(([farger, retning], i) => (
                <group key={i} position={[-1.6 + i * 3.2, 0, -1.8]}>
                    <mesh position={[0, 2.8, 0]}>
                        <cylinderGeometry args={[0.07, 0.07, 5.6, 6]} />
                        <meshStandardMaterial color="#475569" />
                    </mesh>
                    <group
                        ref={(g) => {
                            flagg.current[i] = g;
                        }}
                        position={[0.75, 1.6, 0]}
                    >
                        {farger.map((f, k) => (
                            <mesh
                                key={k}
                                position={retning === 'v' ? [-0.5 + k * 0.5, 0, 0] : [0, 0.33 - k * 0.33, 0]}
                            >
                                <boxGeometry args={retning === 'v' ? [0.5, 1, 0.05] : [1.5, 0.33, 0.05]} />
                                <meshStandardMaterial color={f} side={THREE.DoubleSide} />
                            </mesh>
                        ))}
                    </group>
                </group>
            ))}
        </group>
    );
}

/** FN-postene i Sinai og den hvite FN-bilen. */
function FnLinja({ beat, playing }: { beat: number; playing: boolean }) {
    const poster = useRef<(THREE.Group | null)[]>([]);
    const bil = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const total = useRef(0);
    const forrige = useRef(-1);
    const sone = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        total.current += dt;
        poster.current.forEach((p, i) => {
            if (!p) return;
            // Beat 0: postene reiser seg én etter én. Senere står de alle.
            const oppe = beat > 0 || tid.current * 2.2 > i;
            const s = damp(p.scale.y, oppe ? 1 : 0.001, 4, dt || 0.016);
            p.scale.set(1, s, 1);
            p.visible = s > 0.02;
        });
        if (bil.current) {
            bil.current.position.x = -32 + ((total.current * 3.5) % 64);
            bil.current.visible = beat >= 1;
        }
        if (sone.current) {
            sone.current.opacity = damp(sone.current.opacity, beat >= 2 ? 0.55 : 0, 2, dt || 0.016);
        }
    });
    return (
        <group>
            {/* Den blå linja på bakken mellom partene */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, FN_LINJE]}>
                <planeGeometry args={[66, 3.2]} />
                <meshStandardMaterial ref={sone} color="#60a5fa" transparent opacity={0} />
            </mesh>
            {POSTER.map((x, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        poster.current[i] = g;
                    }}
                    position={[x, 0, FN_LINJE]}
                    scale={[1, 0.001, 1]}
                >
                    <mesh position={[0, 0.7, 0]}>
                        <boxGeometry args={[2, 1.4, 2]} />
                        <meshStandardMaterial color="#f8fafc" flatShading />
                    </mesh>
                    <mesh position={[0, 1.5, 0]}>
                        <boxGeometry args={[2.3, 0.2, 2.3]} />
                        <meshStandardMaterial color="#3b82f6" />
                    </mesh>
                    <mesh position={[0.8, 2.6, 0.8]}>
                        <cylinderGeometry args={[0.06, 0.06, 2.4, 6]} />
                        <meshStandardMaterial color="#475569" />
                    </mesh>
                    <mesh position={[1.35, 3.4, 0.8]}>
                        <boxGeometry args={[1.1, 0.7, 0.05]} />
                        <meshStandardMaterial color="#60a5fa" emissive="#2563eb" emissiveIntensity={0.3} />
                    </mesh>
                </group>
            ))}
            <group ref={bil} position={[-32, 0, FN_LINJE + 3]}>
                <mesh position={[0, 0.55, 0]}>
                    <boxGeometry args={[2.2, 0.8, 1.2]} />
                    <meshStandardMaterial color="#f8fafc" flatShading />
                </mesh>
                <mesh position={[-0.3, 1.15, 0]}>
                    <boxGeometry args={[1.2, 0.5, 1.1]} />
                    <meshStandardMaterial color="#e2e8f0" flatShading />
                </mesh>
                <mesh position={[-0.3, 1.42, 0]}>
                    <boxGeometry args={[0.7, 0.06, 0.7]} />
                    <meshStandardMaterial color="#3b82f6" />
                </mesh>
            </group>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#f3e2bf']} />
            <fog attach="fog" args={['#f3e2bf', 70, 220]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#fff7e6', '#c08a3e', 0.6]} />
            <directionalLight position={[20, 30, 15]} intensity={1.5} />
            <Kamera modus={modus} beat={beat} playing={playing} />
            <Landskap />
            {modus === 'kanal' && (
                <>
                    <Skip beat={beat} playing={playing} />
                    <Kontor beat={beat} playing={playing} />
                    {beat === 1 && (
                        <>
                            <Html position={[-KANAL_LENGDE / 2 + 3, 0, -10]} center zIndexRange={[10, 0]}>
                                <Stedsnavn tekst="Middelhavet" />
                            </Html>
                            <Html position={[KANAL_LENGDE / 2 - 3, 0, -10]} center zIndexRange={[10, 0]}>
                                <Stedsnavn tekst="Rødehavet" />
                            </Html>
                        </>
                    )}
                </>
            )}
            {modus === 'fn' && (
                <>
                    <FnLinja beat={beat} playing={playing} />
                    {beat >= 2 && (
                        <>
                            <Html position={[6, 0.5, -6]} center zIndexRange={[10, 0]}>
                                <Stedsnavn tekst="Egypt" mork />
                            </Html>
                            <Html position={[6, 0.5, -30]} center zIndexRange={[10, 0]}>
                                <Stedsnavn tekst="Israel" mork />
                            </Html>
                        </>
                    )}
                </>
            )}
        </>
    );
}

const TEKST: Record<Modus, string[]> = {
    kanal: [
        'Et skip i ørkenen',
        'Suezkanalen: fra hav til hav',
        'Åpnet i 1869',
        'Eierne: flest britiske og franske',
    ],
    fn: [
        'UNEF: FNs første fredsstyrke',
        'Ideen: Lester B. Pearson, Canada',
        'I Sinai, mellom partene',
        'Ikke for å vinne, men for å stå mellom',
    ],
};

export function SuezKanal({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kanal';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekster = TEKST[modus];
    const tekst = tekster[Math.min(beat, tekster.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 45, near: 0.3, far: 400, position: [-30, 3.5, 11] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap bg-white/90 text-slate-900"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'fn' && beat === 1 && (
                    <motion.div
                        key="pearson"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute right-[4%] bottom-[8%] px-6 py-4 rounded-2xl shadow-xl bg-white/95 text-slate-900"
                    >
                        <div className="font-display font-black text-3xl">Lester B. Pearson</div>
                        <div className="text-xl font-semibold text-slate-600">politiker fra Canada</div>
                        <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-amber-400 font-bold text-xl">
                            Nobels fredspris
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Stedsnavn({ tekst, mork }: { tekst: string; mork?: boolean }) {
    return (
        <div
            className={`px-4 py-1.5 rounded-xl font-display font-black text-2xl whitespace-nowrap shadow-lg ${
                mork ? 'bg-slate-900/85 text-white' : 'bg-sky-900/85 text-white'
            }`}
        >
            {tekst}
        </div>
    );
}
