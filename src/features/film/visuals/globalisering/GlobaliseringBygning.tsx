import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { Overskrift, Skilt } from './felles';
import { damp, frø, tekstFor, useKamera, v } from './felles3d';

/**
 * Rana Plaza i 3D, i to moduser. Ingen mennesker vises.
 *
 * «sprekker»: bygningen i utkanten av Dhaka. Beat 1: vinduene lyser (fabrikkene inne).
 * Beat 2: sprekker vokser i fasaden. Beat 3: morgen, lyset kommer. Beat 4: kameraet glir
 * sakte mot inngangen.
 *
 * «raste»: etasjene synker sammen til en haug (beat 0), støvet legger seg. Beat 1: tallene.
 * Beat 3: merkene arbeiderne sydde for. Beat 4: bare ruinen.
 */

type Modus = 'sprekker' | 'raste';

const ETASJER = 8;
const EH = 1.4;
const BB = 14;
const BD = 10;
const STEINER = 70;

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'sprekker') {
        switch (beat) {
            case 0:
                return { pos: v(24 - t * 0.3, 9, 30), se: v(0, 5, 0) };
            case 1:
                return { pos: v(12, 7, 22), se: v(0, 6, 0) };
            case 2:
                return { pos: v(3, 5.5, 12), se: v(0, 5.5, 0) };
            case 3:
                return { pos: v(18, 6, 26), se: v(0, 5, 0) };
            default:
                return { pos: v(0, 4, Math.max(19, 26 - t * 0.4)), se: v(0, 4.5, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(22, 9, 30), se: v(0, 2.5, 0) };
        case 3:
            return { pos: v(-20, 8, 26), se: v(0, 1.5, 0) };
        case 4:
            return { pos: v(0, 6, 30 + t * 0.2), se: v(0, 1.5, 0) };
        default:
            return { pos: v(24 - t * 0.2, 10, 30), se: v(0, 2, 0) };
    }
}

/** Sprekkene i fasaden: [x, y, lengde, vinkel]. */
const SPREKKER: [number, number, number, number][] = [
    [-3.2, 3.0, 2.2, 1.1],
    [-2.6, 4.6, 1.8, 0.5],
    [-1.6, 5.8, 1.6, 1.3],
    [2.4, 2.4, 2.0, 2.0],
    [3.1, 3.9, 1.6, 1.4],
    [3.4, 5.3, 1.4, 2.3],
    [-0.4, 1.6, 1.4, 0.3],
];

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    const etasjer = useRef<(THREE.Group | null)[]>([]);
    const vinduer = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const sprekker = useRef<(THREE.Mesh | null)[]>([]);
    const bakgrunn = useRef<THREE.Color>(null);
    const sol = useRef<THREE.DirectionalLight>(null);
    const stein = useRef<THREE.InstancedMesh>(null);
    const stov = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    const totalTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const o = useMemo(() => new THREE.Object3D(), []);
    const morgen = useMemo(() => new THREE.Color('#f3e3c4'), []);
    const kveld = useMemo(() => new THREE.Color('#aab4c3'), []);

    const steiner = useMemo(
        () =>
            Array.from({ length: STEINER }, (_, i) => {
                const r = 2 + frø(i + 3) * 8;
                const a = frø(i + 11) * Math.PI * 2;
                return {
                    x: Math.cos(a) * r * 1.1,
                    z: Math.sin(a) * r * 0.8,
                    y: Math.max(0.2, 2.6 - r * 0.28) * frø(i + 7),
                    s: 0.4 + frø(i + 5) * 0.9,
                    rx: frø(i + 1) * 3,
                    ry: frø(i + 2) * 3,
                };
            }),
        []
    );

    const raser = modus === 'raste';

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        totalTid.current += dt;
        const t = tid.current;
        const k = forste.current;
        // Etasjene raser bare foran øynene våre når filmen starter i beat 0.
        const hopp = k && (!raser || beat > 0);
        const glid = (x: number, mål: number, l = 3) => (hopp ? mål : damp(x, mål, l, dt));

        etasjer.current.forEach((g, i) => {
            if (!g) return;
            const ned = raser && (beat > 0 || totalTid.current > 0.6 + (ETASJER - i) * 0.05);
            const yMål = ned ? 0.35 + i * 0.32 : EH / 2 + i * EH;
            const fart = ned ? 1.6 + i * 0.12 : 3;
            g.position.y = glid(g.position.y, yMål, fart);
            g.rotation.z = glid(g.rotation.z, ned ? (frø(i + 21) - 0.5) * 0.35 : 0, 1.5);
            g.rotation.x = glid(g.rotation.x, ned ? (frø(i + 31) - 0.5) * 0.25 : 0, 1.5);
            g.position.x = glid(g.position.x, ned ? (frø(i + 41) - 0.5) * 2.4 : 0, 1.5);
            const sk = ned ? 0.92 : 1;
            g.scale.set(1, glid(g.scale.y, ned ? 0.35 : 1, 1.4), sk);
        });

        const lys = raser ? 0 : beat >= 1 ? (beat === 3 ? 0.6 : 1) : 0.15;
        vinduer.current.forEach((m) => {
            if (m) m.emissiveIntensity = glid(m.emissiveIntensity, lys, 3);
        });

        sprekker.current.forEach((m, i) => {
            if (!m) return;
            const vis = !raser && beat >= 2;
            const vekst = vis
                ? Math.min(1, (beat > 2 ? 1 : 0) + Math.max(0, t - i * 0.35) * 0.8)
                : 0;
            const s = glid(m.scale.x, Math.max(vekst, 0.001), 4);
            m.scale.x = Math.max(s, 0.001);
            m.visible = s > 0.02;
        });

        if (bakgrunn.current) {
            const mål = !raser && beat >= 3 ? morgen : kveld;
            if (hopp) bakgrunn.current.copy(mål);
            else bakgrunn.current.lerp(mål, 1 - Math.exp(-1.5 * dt));
        }
        if (sol.current)
            sol.current.intensity = glid(sol.current.intensity, !raser && beat >= 3 ? 1.6 : 0.9, 2);

        const m = stein.current;
        if (m) {
            const vis = raser
                ? beat > 0
                    ? 1
                    : Math.min(1, Math.max(0, totalTid.current - 1.2))
                : 0;
            steiner.forEach((s, i) => {
                o.position.set(s.x, s.y, s.z);
                o.rotation.set(s.rx, s.ry, 0);
                o.scale.setScalar(Math.max(0.001, s.s * vis));
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
            });
            m.instanceMatrix.needsUpdate = true;
            m.visible = vis > 0;
        }

        stov.current.forEach((d, i) => {
            if (!d) return;
            const mat = d.material as THREE.MeshStandardMaterial;
            const alder = raser ? (beat > 0 ? 8 : totalTid.current) : 0;
            const opp = Math.min(1, Math.max(0, (alder - 0.8) * 0.7));
            const tetthet = raser ? (beat >= 4 ? 0.05 : beat > 0 ? 0.08 : 0.16 * opp) : 0;
            mat.opacity = glid(mat.opacity, tetthet, 1.2);
            d.scale.setScalar(
                3 + opp * 3 + frø(i) * 2 + Math.sin(totalTid.current * 0.3 + i) * 0.2
            );
            d.visible = mat.opacity > 0.01;
        });
        forste.current = false;
    });

    return (
        <>
            <color ref={bakgrunn} attach="background" args={['#aab4c3']} />
            <fog attach="fog" args={['#c9c3b6', 40, 110]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#ffffff', '#8b7d6b', 0.5]} />
            <directionalLight ref={sol} position={[14, 22, 18]} intensity={0.9} />

            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[220, 220]} />
                <meshStandardMaterial color="#b7a98f" />
            </mesh>
            {/* Veien foran bygningen. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 11]}>
                <planeGeometry args={[120, 5]} />
                <meshStandardMaterial color="#6b7280" />
            </mesh>
            {/* Lave hus rundt. */}
            {[
                [-20, 3, -2, 6, 6],
                [-19, 2, -14, 8, 4],
                [19, 4, -3, 6, 8],
                [21, 2.5, -15, 7, 5],
                [-30, 3, 3, 6, 6],
                [31, 3.5, 2, 6, 7],
                [6, 2, -20, 10, 4],
            ].map(([x, h, z, b, d], i) => (
                <mesh key={i} position={[x, h / 2, z]}>
                    <boxGeometry args={[b, h, d]} />
                    <meshStandardMaterial color={i % 2 ? '#d6cbb5' : '#c4b8a2'} flatShading />
                </mesh>
            ))}

            {Array.from({ length: ETASJER }, (_, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        etasjer.current[i] = g;
                    }}
                    position={[0, EH / 2 + i * EH, 0]}
                >
                    <mesh>
                        <boxGeometry args={[BB, EH * 0.98, BD]} />
                        <meshStandardMaterial color={i % 2 ? '#d8d2c6' : '#cfc8ba'} flatShading />
                    </mesh>
                    {/* Vindusbånd foran og på siden. */}
                    <mesh position={[0, 0.05, BD / 2 + 0.03]}>
                        <boxGeometry args={[BB * 0.9, EH * 0.45, 0.06]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                vinduer.current[i * 2] = m;
                            }}
                            color="#334155"
                            emissive="#fde68a"
                            emissiveIntensity={0}
                        />
                    </mesh>
                    <mesh position={[BB / 2 + 0.03, 0.05, 0]}>
                        <boxGeometry args={[0.06, EH * 0.45, BD * 0.86]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                vinduer.current[i * 2 + 1] = m;
                            }}
                            color="#334155"
                            emissive="#fde68a"
                            emissiveIntensity={0}
                        />
                    </mesh>
                    {[-4.2, -1.4, 1.4, 4.2].map((x) => (
                        <mesh key={x} position={[x, 0.05, BD / 2 + 0.07]}>
                            <boxGeometry args={[0.35, EH * 0.5, 0.06]} />
                            <meshStandardMaterial color="#cfc8ba" />
                        </mesh>
                    ))}
                </group>
            ))}

            {SPREKKER.map(([x, y, l, a], i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        sprekker.current[i] = m;
                    }}
                    position={[x, y, BD / 2 + 0.12]}
                    rotation={[0, 0, a]}
                    scale={[0.001, 1, 1]}
                >
                    <boxGeometry args={[l, 0.09, 0.04]} />
                    <meshBasicMaterial color="#111827" />
                </mesh>
            ))}

            <instancedMesh ref={stein} args={[undefined, undefined, STEINER]} frustumCulled={false}>
                <boxGeometry args={[1, 0.6, 0.8]} />
                <meshStandardMaterial color="#a8a29e" flatShading />
            </instancedMesh>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        stov.current[i] = m;
                    }}
                    position={[
                        (frø(i + 50) - 0.5) * 12,
                        2 + frø(i + 60) * 3,
                        (frø(i + 70) - 0.5) * 8,
                    ]}
                >
                    <sphereGeometry args={[1, 12, 10]} />
                    <meshStandardMaterial
                        color="#cfc8ba"
                        transparent
                        opacity={0}
                        depthWrite={false}
                        flatShading={false}
                    />
                </mesh>
            ))}

            {!raser && beat === 1 && (
                <Html position={[BB / 2 + 2.5, 8, 2]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Klesfabrikker" farge="#b45309" />
                </Html>
            )}
        </>
    );
}

export function GlobaliseringBygning({
    beat,
    playing,
    props,
}: VisualProps<{
    modus?: Modus;
    tekster?: string[];
    tall?: { verdi: number; etikett: string; fraBeat: number; prefiks?: string }[];
    merkenavn?: string[];
}>) {
    const modus: Modus = props?.modus ?? 'sprekker';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = tekstFor(props?.tekster, beat);
    const tall = (props?.tall ?? []).filter((t) => beat >= t.fraBeat);
    const visMerker = modus === 'raste' && beat === 3;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 250, position: [24, 9, 30] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <Overskrift
                        key={`${modus}-${tekst}`}
                        tekst={tekst}
                        tone={modus === 'sprekker' && beat >= 2 ? 'rod' : 'lys'}
                    />
                )}
            </AnimatePresence>
            {modus === 'raste' && beat >= 1 && beat <= 2 && (
                <div className="absolute flex gap-4" style={{ right: '4%', bottom: '8%' }}>
                    {tall.map((t, i) => (
                        <Teller
                            key={t.etikett}
                            verdi={t.verdi}
                            etikett={t.etikett}
                            prefiks={t.prefiks ? `${t.prefiks} ` : ''}
                            tone={i === 0 ? 'rod' : 'noytral'}
                            forsinkelse={i * 0.4}
                        />
                    ))}
                </div>
            )}
            {visMerker && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3"
                    style={{ bottom: '8%', width: '86%' }}
                >
                    {(props?.merkenavn ?? []).map((n, i) => (
                        <motion.div
                            key={n}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.35 }}
                            className="px-4 py-2 rounded-xl bg-slate-900/90 text-white font-bold text-2xl"
                        >
                            {n}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
