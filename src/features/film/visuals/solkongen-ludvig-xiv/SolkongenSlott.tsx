import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Versailles i 3D. Fire moduser:
 * - morgen: slottet i soloppgang, så kongens soverom med adelsmenn rundt sengen
 * - vekst: jakthytta som vokser til et enormt barokkslott, med byggeplassen
 * - speil: Speilsalen, der de 357 speilglassene tennes ett for ett
 * - sol: solen som går fra øst til vest, rett over kongens soverom
 * Øst er +x. Soverommet ligger midt i den gamle jakthytta, på linja z = 0.
 */

type Modus = 'morgen' | 'vekst' | 'speil' | 'sol';
type V3 = [number, number, number];

interface Kasse {
    c: V3;
    s: V3;
}

const STEIN = '#efe3c8';
const MURSTEIN = '#b5654d';
const TAK = '#4b5563';
const GULL = '#d4a017';

/** Slottet som vokser fram rundt jakthytta. */
const PALASS: Kasse[] = [
    { c: [-1, 2.6, 0], s: [6, 5.2, 28] },
    { c: [9, 2.4, -11], s: [14, 4.8, 4] },
    { c: [9, 2.4, 11], s: [14, 4.8, 4] },
    { c: [-1, 2.4, -30], s: [6, 4.8, 32] },
    { c: [-1, 2.4, 30], s: [6, 4.8, 32] },
    { c: [21, 2, -17], s: [10, 4, 4] },
    { c: [21, 2, 17], s: [10, 4, 4] },
];
const JAKTHYTTE: Kasse = { c: [4, 1.9, 0], s: [4, 3.8, 9] };

/** Vinduer på alle fire sider av en kasse. */
function vinduerFor(k: Kasse, hopp: (x: number, z: number) => boolean = () => false) {
    const ut: THREE.Matrix4[] = [];
    const [cx, cy, cz] = k.c;
    const [w, h, d] = k.s;
    const etasjer = Math.max(1, Math.floor(h / 2.1));
    const m = new THREE.Matrix4();
    for (let e = 0; e < etasjer; e++) {
        const y = cy - h / 2 + 1.2 + e * 2;
        for (const side of [-1, 1]) {
            // Langs z (øst- og vestveggen)
            for (let z = -d / 2 + 1; z <= d / 2 - 0.8; z += 1.6) {
                const x = cx + side * (w / 2 + 0.03);
                if (hopp(x, cz + z)) continue;
                m.makeRotationY(Math.PI / 2).setPosition(x, y, cz + z);
                ut.push(m.clone());
            }
            // Langs x (nord- og sørveggen)
            for (let x = -w / 2 + 1; x <= w / 2 - 0.8; x += 1.6) {
                m.makeRotationY(0).setPosition(cx + x, y, cz + side * (d / 2 + 0.03));
                ut.push(m.clone());
            }
        }
    }
    return ut;
}

function Instanser({
    matriser,
    children,
    farger,
    meshRef,
}: {
    matriser: THREE.Matrix4[];
    children: React.ReactNode;
    farger?: string[];
    /** Gir eieren tilgang til instansene, f.eks. for å endre fargene underveis. */
    meshRef?: React.RefObject<THREE.InstancedMesh | null>;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const im = ref.current;
        if (!im) return;
        if (meshRef) meshRef.current = im;
        matriser.forEach((mx, i) => im.setMatrixAt(i, mx));
        if (farger) {
            const c = new THREE.Color();
            farger.forEach((f, i) => im.setColorAt(i, c.set(f)));
            if (im.instanceColor) im.instanceColor.needsUpdate = true;
        }
        im.instanceMatrix.needsUpdate = true;
    }, [matriser, farger, meshRef]);
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, matriser.length]}>
            {children}
        </instancedMesh>
    );
}

function Bygning({ k, farge, gull }: { k: Kasse; farge: string; gull: boolean }) {
    const [w, h, d] = k.s;
    return (
        <group position={k.c}>
            <mesh>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            {/* Mansardtak av skifer */}
            <mesh position={[0, h / 2 + 0.6, 0]}>
                <boxGeometry args={[w - 0.4, 1.2, d - 0.4]} />
                <meshStandardMaterial color={TAK} flatShading />
            </mesh>
            {gull && (
                <mesh position={[0, h / 2 + 0.08, 0]}>
                    <boxGeometry args={[w + 0.15, 0.22, d + 0.15]} />
                    <meshStandardMaterial
                        color={GULL}
                        emissive="#8a6100"
                        emissiveIntensity={0.4}
                        metalness={0.6}
                        roughness={0.3}
                    />
                </mesh>
            )}
        </group>
    );
}

/** Hager i vest, kanalen og alleen mot Paris i øst. */
function Hager() {
    const traer = useMemo(() => {
        const ut: THREE.Matrix4[] = [];
        const m = new THREE.Matrix4();
        const legg = (x: number, z: number) => ut.push(m.clone().setPosition(x, 1.6, z));
        for (let x = -40; x >= -112; x -= 5) {
            legg(x, -8);
            legg(x, 8);
        }
        for (let x = -8; x >= -36; x -= 4) {
            legg(x, -50);
            legg(x, 50);
        }
        for (let x = 30; x <= 100; x += 5) {
            legg(x, -7);
            legg(x, 7);
        }
        return ut;
    }, []);
    const bed = useMemo<V3[]>(() => {
        const ut: V3[] = [];
        for (let i = 0; i < 3; i++) for (const z of [-14, 14]) ut.push([-10 - i * 9, 0.1, z]);
        return ut;
    }, []);
    return (
        <group>
            {bed.map((p, i) => (
                <mesh key={i} position={p}>
                    <boxGeometry args={[7, 0.2, 18]} />
                    <meshStandardMaterial color="#5f8f4a" />
                </mesh>
            ))}
            {/* Grusgangen midt i hagen og fontenen */}
            <mesh position={[-22, 0.06, 0]}>
                <boxGeometry args={[30, 0.12, 6]} />
                <meshStandardMaterial color="#e2d6b8" />
            </mesh>
            <mesh position={[-22, 0.15, 0]}>
                <cylinderGeometry args={[2.4, 2.4, 0.2, 24]} />
                <meshStandardMaterial color="#7cc4e4" emissive="#3a8fb7" emissiveIntensity={0.4} />
            </mesh>
            {/* Den store kanalen, formet som et kors */}
            <mesh position={[-76, 0.08, 0]}>
                <boxGeometry args={[72, 0.1, 6]} />
                <meshStandardMaterial color="#7cc4e4" emissive="#3a8fb7" emissiveIntensity={0.45} />
            </mesh>
            <mesh position={[-74, 0.08, 0]}>
                <boxGeometry args={[6, 0.1, 50]} />
                <meshStandardMaterial color="#7cc4e4" emissive="#3a8fb7" emissiveIntensity={0.45} />
            </mesh>
            {/* Alleen og plassen foran slottet i øst */}
            <mesh position={[60, 0.04, 0]}>
                <boxGeometry args={[80, 0.08, 10]} />
                <meshStandardMaterial color="#d8ccb0" />
            </mesh>
            <mesh position={[14, 0.05, 0]}>
                <boxGeometry args={[24, 0.1, 18]} />
                <meshStandardMaterial color="#e2d6b8" />
            </mesh>
            <Instanser matriser={traer}>
                <sphereGeometry args={[1.8, 8, 6]} />
                <meshStandardMaterial color="#3f7a3a" flatShading />
            </Instanser>
        </group>
    );
}

/** Kongens soverom: den røde sengen, gullgjerdet og adelsmennene. */
function Soverom({ beat, playing }: { beat: number; playing: boolean }) {
    const folk = useRef<(THREE.Group | null)[]>([]);
    const plass = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => {
                // Beat 2: en løs flokk rundt sengen. Beat 3: to rette rekker.
                const flokk: V3 = [(frø(i) - 0.5) * 11, 0, 0.8 + frø(i + 40) * 3.6];
                const rad = i < 7 ? 0 : 1;
                const n = i % 7;
                const rekke: V3 = [-4.8 + n * 1.6, 0, 1 + rad * 1.5];
                const farge = ['#1e3a8a', '#7f1d1d', '#065f46', '#4c1d95', '#92400e', '#334155'][
                    i % 6
                ];
                return { flokk, rekke, farge };
            }),
        []
    );
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        plass.forEach((p, i) => {
            const g = folk.current[i];
            if (!g) return;
            const mål = beat >= 3 ? p.rekke : p.flokk;
            const k = g.userData.satt ? 1 - Math.exp(-1.6 * dt) : 1;
            g.userData.satt = true;
            g.position.x += (mål[0] - g.position.x) * k;
            g.position.z += (mål[2] - g.position.z) * k;
        });
    });
    const baluster = useMemo(() => {
        const m = new THREE.Matrix4();
        return Array.from({ length: 13 }, (_, i) =>
            m.clone().setPosition(-3.6 + i * 0.6, 0.55, -0.3)
        );
    }, []);
    return (
        <group position={[0, 0, 400]}>
            <mesh position={[0, -0.1, 0]}>
                <boxGeometry args={[16, 0.2, 12]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            <mesh position={[0, 3.5, -5.6]}>
                <boxGeometry args={[16, 7, 0.3]} />
                <meshStandardMaterial color="#9f1d1d" />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 8, 3.5, 0]}>
                    <boxGeometry args={[0.3, 7, 12]} />
                    <meshStandardMaterial color="#efe3c8" />
                </mesh>
            ))}
            <mesh position={[0, 7, 0]}>
                <boxGeometry args={[16, 0.3, 12]} />
                <meshStandardMaterial color="#e8d49a" />
            </mesh>
            {/* Gullkanter på bakveggen */}
            {[1.2, 5.8].map((y) => (
                <mesh key={y} position={[0, y, -5.4]}>
                    <boxGeometry args={[15.6, 0.25, 0.1]} />
                    <meshStandardMaterial color={GULL} metalness={0.6} roughness={0.3} />
                </mesh>
            ))}
            {/* Sengen med himmel */}
            <mesh position={[0, 0.5, -3.6]}>
                <boxGeometry args={[3.4, 1, 3.6]} />
                <meshStandardMaterial color="#b91c1c" />
            </mesh>
            <mesh position={[0, 1.1, -3.6]}>
                <boxGeometry args={[3.1, 0.3, 3.3]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            {[
                [-1.6, -5.3],
                [1.6, -5.3],
                [-1.6, -1.9],
                [1.6, -1.9],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 2.4, z]}>
                    <cylinderGeometry args={[0.1, 0.1, 4.8, 8]} />
                    <meshStandardMaterial color={GULL} metalness={0.6} roughness={0.3} />
                </mesh>
            ))}
            <mesh position={[0, 4.9, -3.6]}>
                <boxGeometry args={[3.8, 0.6, 3.9]} />
                <meshStandardMaterial color="#991b1b" />
            </mesh>
            {/* Kongen sitter oppreist i sengen */}
            <mesh position={[0, 1.75, -4.2]}>
                <capsuleGeometry args={[0.35, 0.6, 3, 10]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 2.55, -4.2]}>
                <sphereGeometry args={[0.28, 12, 10]} />
                <meshStandardMaterial color="#e8c39e" />
            </mesh>
            <mesh position={[0, 2.62, -4.42]}>
                <sphereGeometry args={[0.36, 12, 10]} />
                <meshStandardMaterial color="#3b2a1d" />
            </mesh>
            {/* Gullgjerdet foran sengen */}
            <Instanser matriser={baluster}>
                <cylinderGeometry args={[0.08, 0.1, 1.1, 6]} />
                <meshStandardMaterial color={GULL} metalness={0.6} roughness={0.3} />
            </Instanser>
            <mesh position={[0, 1.15, -0.3]}>
                <boxGeometry args={[7.8, 0.14, 0.2]} />
                <meshStandardMaterial color={GULL} metalness={0.6} roughness={0.3} />
            </mesh>
            {plass.map((p, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        folk.current[i] = g;
                    }}
                    position={p.flokk}
                    rotation={[0, Math.PI, 0]}
                >
                    <mesh position={[0, 0.85, 0]}>
                        <capsuleGeometry args={[0.3, 0.9, 3, 10]} />
                        <meshStandardMaterial color={p.farge} flatShading />
                    </mesh>
                    <mesh position={[0, 1.85, 0]}>
                        <sphereGeometry args={[0.22, 12, 10]} />
                        <meshStandardMaterial color="#e8c39e" />
                    </mesh>
                    {/* Parykk */}
                    <mesh position={[0, 1.88, 0.12]}>
                        <sphereGeometry args={[0.3, 12, 10]} />
                        <meshStandardMaterial color={i % 3 === 0 ? '#e7e5e4' : '#6b4a2b'} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

const SPEIL_X = Array.from({ length: 17 }, (_, i) => -32 + i * 4);
const MATTE_GLASS = Array.from({ length: 357 }, () => '#3f4a5a');

/** Speilsalen: 73 meter lang, 17 buede speil av 357 speilglass. */
function Speilsalen({ beat, playing }: { beat: number; playing: boolean }) {
    const glass = useRef<THREE.InstancedMesh>(null);
    const tent = useRef(-1);
    const tid = useRef(0);
    const forrigeBeat = useRef(-1);
    const glassMatriser = useMemo(() => {
        const ut: THREE.Matrix4[] = [];
        const m = new THREE.Matrix4();
        for (const x of SPEIL_X)
            for (let r = 0; r < 7; r++)
                for (let c = 0; c < 3; c++)
                    ut.push(m.clone().setPosition(x + (c - 1) * 0.86, 1.3 + r * 0.9, -4.72));
        return ut;
    }, []);
    const buer = useMemo(() => {
        const m = new THREE.Matrix4();
        return SPEIL_X.map((x) => m.clone().setPosition(x, 7.55, -4.72));
    }, []);
    const vinduer = useMemo(() => {
        const m = new THREE.Matrix4();
        return SPEIL_X.map((x) => m.clone().setPosition(x, 4.3, 4.85));
    }, []);
    const pilastre = useMemo(() => {
        const m = new THREE.Matrix4();
        const ut: THREE.Matrix4[] = [];
        for (let i = 0; i < 18; i++) {
            ut.push(m.clone().setPosition(-34 + i * 4, 5, -4.75));
            ut.push(m.clone().setPosition(-34 + i * 4, 5, 4.75));
        }
        return ut;
    }, []);
    const lysekroner = useMemo(() => {
        const m = new THREE.Matrix4();
        return Array.from({ length: 9 }, (_, i) => m.clone().setPosition(-32 + i * 8, 9.6, 0));
    }, []);
    const gaende = useRef<(THREE.Group | null)[]>([]);
    const folk = useMemo(
        () =>
            Array.from({ length: 18 }, (_, i) => ({
                x: -34 + frø(i + 3) * 68,
                z: -2.5 + frø(i + 13) * 5,
                fart: (0.6 + frø(i + 23) * 0.6) * (i % 2 ? 1 : -1),
                farge: ['#1e3a8a', '#7f1d1d', '#065f46', '#4c1d95', '#92400e'][i % 5],
            })),
        []
    );

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        // Beat 0: glassene er matte. Beat 1: de tennes ett for ett. Senere: alle lyser.
        const n = beat === 0 ? 0 : beat === 1 ? Math.min(357, Math.floor(tid.current * 90)) : 357;
        const im = glass.current;
        if (im && n !== tent.current) {
            tent.current = n;
            const lys = new THREE.Color('#f1f5f9');
            const matt = new THREE.Color('#3f4a5a');
            for (let i = 0; i < 357; i++) im.setColorAt(i, i < n ? lys : matt);
            if (im.instanceColor) im.instanceColor.needsUpdate = true;
        }
        folk.forEach((f, i) => {
            const g = gaende.current[i];
            if (!g) return;
            g.visible = beat >= 2;
            f.x += f.fart * dt;
            if (f.x > 35) f.x = -35;
            if (f.x < -35) f.x = 35;
            g.position.set(f.x, 0, f.z);
            g.rotation.y = f.fart > 0 ? Math.PI / 2 : -Math.PI / 2;
        });
    });

    return (
        <group position={[0, 0, -400]}>
            <mesh position={[0, -0.1, 0]}>
                <boxGeometry args={[74, 0.2, 10]} />
                <meshStandardMaterial color="#9a6a3a" />
            </mesh>
            <mesh position={[0, 5.5, -5]}>
                <boxGeometry args={[74, 11, 0.3]} />
                <meshStandardMaterial color={STEIN} />
            </mesh>
            <mesh position={[0, 5.5, 5]}>
                <boxGeometry args={[74, 11, 0.3]} />
                <meshStandardMaterial color={STEIN} />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 36.6, 5.5, 0]}>
                    <boxGeometry args={[0.3, 11, 10]} />
                    <meshStandardMaterial color={STEIN} />
                </mesh>
            ))}
            {/* Takmalerier */}
            <mesh position={[0, 11, 0]}>
                <boxGeometry args={[74, 0.3, 10]} />
                <meshStandardMaterial color="#d9b65c" />
            </mesh>
            {Array.from({ length: 6 }, (_, i) => (
                <mesh key={i} position={[-30 + i * 12, 10.8, 0]}>
                    <boxGeometry args={[9, 0.1, 6]} />
                    <meshStandardMaterial color={i % 2 ? '#6b8cb5' : '#a8774a'} />
                </mesh>
            ))}
            <Instanser matriser={glassMatriser} farger={MATTE_GLASS} meshRef={glass}>
                <boxGeometry args={[0.8, 0.84, 0.05]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#cbd5e1"
                    emissiveIntensity={0.08}
                    metalness={0.3}
                    roughness={0.15}
                />
            </Instanser>
            {/* Ramme rundt hvert speil */}
            <Instanser
                matriser={SPEIL_X.map((x) => new THREE.Matrix4().setPosition(x, 4.3, -4.82))}
            >
                <boxGeometry args={[2.9, 6.6, 0.08]} />
                <meshStandardMaterial color={GULL} metalness={0.6} roughness={0.35} />
            </Instanser>
            <Instanser matriser={buer}>
                <circleGeometry args={[1.35, 16, 0, Math.PI]} />
                <meshStandardMaterial color="#e2e8f0" emissive="#94a3b8" emissiveIntensity={0.3} />
            </Instanser>
            <Instanser matriser={vinduer}>
                <boxGeometry args={[2.6, 6.4, 0.1]} />
                <meshStandardMaterial color="#e0f2fe" emissive="#bae6fd" emissiveIntensity={0.9} />
            </Instanser>
            <Instanser matriser={pilastre}>
                <boxGeometry args={[0.8, 10, 0.25]} />
                <meshStandardMaterial color="#c9b98f" />
            </Instanser>
            <Instanser matriser={lysekroner}>
                <sphereGeometry args={[0.7, 10, 8]} />
                <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.8} />
            </Instanser>
            {folk.map((f, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        gaende.current[i] = g;
                    }}
                    position={[f.x, 0, f.z]}
                    visible={false}
                >
                    <mesh position={[0, 0.85, 0]}>
                        <capsuleGeometry args={[0.3, 0.9, 3, 10]} />
                        <meshStandardMaterial color={f.farge} flatShading />
                    </mesh>
                    <mesh position={[0, 1.85, 0]}>
                        <sphereGeometry args={[0.24, 12, 10]} />
                        <meshStandardMaterial color="#e8c39e" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'morgen') {
        switch (beat) {
            case 0:
                return { pos: v(-36 + t * 0.6, 22 - t * 0.2, 62), se: v(14, 2, 0) };
            case 1:
                return { pos: v(24 - t * 0.25, 5.5, 9 - t * 0.15), se: v(6, 2.4, 0) };
            case 2:
                return { pos: v(0.5, 4.4, 409.5 - t * 0.1), se: v(0, 1.6, 397) };
            default:
                return { pos: v(-3.5 + t * 0.08, 3.6, 409), se: v(0, 1.4, 397.5) };
        }
    }
    if (modus === 'vekst') {
        switch (beat) {
            case 0:
                return { pos: v(18, 7, 20 - t * 0.2), se: v(4, 2, 0) };
            case 1:
                return { pos: v(52 - t * 0.4, 34, 78), se: v(-6, 0, 0) };
            case 2:
                return { pos: v(-26, 9, 34 - t * 0.4), se: v(-1, 4, 4) };
            default:
                return { pos: v(36 + t * 0.3, 48, 84), se: v(-4, 0, 0) };
        }
    }
    if (modus === 'speil') {
        switch (beat) {
            case 0:
                return { pos: v(-35, 3.4, -397 + 0.4), se: v(20, 4, -401) };
            case 1: {
                const x = Math.min(-26 + t * 1.3, 16);
                return { pos: v(x, 3.8, -397), se: v(x + 5, 4.2, -404.7) };
            }
            default:
                return { pos: v(14 - t * 0.4, 7, -396.5), se: v(-12, 2, -401) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(10, 34, 96), se: v(0, 6, 0) };
        case 1:
            return { pos: v(0, 30, 112), se: v(0, 12, 0) };
        default:
            return { pos: v(24, 16, 48), se: v(3, 13, 0) };
    }
}

function Byggeplass({ synlig }: { synlig: boolean }) {
    const arbeidere = useMemo(() => {
        const ut: THREE.Matrix4[] = [];
        const m = new THREE.Matrix4();
        for (let i = 0; i < 520 && ut.length < 380; i++) {
            const x = -16 + frø(i) * 50;
            const z = (frø(i + 500) - 0.5) * 96;
            // Ikke inni bygningene
            const inni = [...PALASS, JAKTHYTTE].some(
                (k) =>
                    Math.abs(x - k.c[0]) < k.s[0] / 2 + 0.4 &&
                    Math.abs(z - k.c[2]) < k.s[2] / 2 + 0.4
            );
            if (inni) continue;
            ut.push(m.clone().setPosition(x, 0.45, z));
        }
        return ut;
    }, []);
    const farger = useMemo(
        () => arbeidere.map((_, i) => ['#57534e', '#78350f', '#44403c', '#7c2d12'][i % 4]),
        [arbeidere]
    );
    return (
        <group visible={synlig}>
            <Instanser matriser={arbeidere} farger={farger}>
                <boxGeometry args={[0.45, 0.9, 0.45]} />
                <meshStandardMaterial color="#ffffff" />
            </Instanser>
            {/* Byggekraner av tre */}
            {(
                [
                    [-6, -20],
                    [-6, 22],
                    [14, -16],
                    [16, 15],
                ] as [number, number][]
            ).map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 5, 0]}>
                        <boxGeometry args={[0.5, 10, 0.5]} />
                        <meshStandardMaterial color="#7c5a3a" />
                    </mesh>
                    <mesh position={[2.2, 9.8, 0]} rotation={[0, 0, -0.12]}>
                        <boxGeometry args={[6, 0.35, 0.35]} />
                        <meshStandardMaterial color="#7c5a3a" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    const palass = useRef<THREE.Group>(null);
    const sol = useRef<THREE.Mesh>(null);
    const solLys = useRef<THREE.DirectionalLight>(null);
    const strale = useRef<THREE.Mesh>(null);
    const vekst = useRef(modus === 'vekst' ? 0 : 1);
    const tid = useRef(0);
    const forrigeBeat = useRef(-1);

    const palassVinduer = useMemo(() => PALASS.flatMap((k) => vinduerFor(k)), []);
    const hytteVinduer = useMemo(
        () => vinduerFor(JAKTHYTTE, (x, z) => x > 5 && Math.abs(z) < 1),
        []
    );

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const mål = modus === 'vekst' && beat === 0 ? 0 : 1;
        vekst.current = damp(vekst.current, mål, 1.1, dt);
        if (modus === 'vekst' && beat >= 1 && vekst.current < 0.02) vekst.current = 0.02;
        const g = palass.current;
        if (g) {
            g.scale.y = Math.max(vekst.current, 0.001);
            g.visible = vekst.current > 0.01;
        }
        // Solen: lav i øst om morgenen, går over himmelen i sol-modus.
        let theta = 0.1;
        if (modus === 'sol') {
            if (beat === 0) theta = 0.06;
            else if (beat === 1) theta = Math.min(1, (tid.current % 10) / 8) * Math.PI;
            else theta = Math.PI / 2;
        }
        const r = 62;
        const solPos: V3 =
            modus === 'morgen'
                ? [150, 14, -40]
                : modus === 'sol'
                  ? [r * Math.cos(theta), 5 + 30 * Math.sin(theta), -12]
                  : [60, 80, 40];
        if (sol.current) {
            if (modus === 'sol' && beat === 2) {
                const p = sol.current.position;
                p.set(damp(p.x, solPos[0], 1.5, dt), damp(p.y, solPos[1], 1.5, dt), solPos[2]);
            } else sol.current.position.set(...solPos);
        }
        if (solLys.current && sol.current) solLys.current.position.copy(sol.current.position);
        if (strale.current) {
            const m = strale.current.material as THREE.MeshBasicMaterial;
            const vis = modus === 'sol' && beat === 2;
            m.opacity = damp(m.opacity, vis ? 0.32 : 0, 1.4, dt);
            strale.current.visible = m.opacity > 0.01;
        }
    });

    const himmel = modus === 'morgen' ? '#f4cfae' : '#cfe2f0';
    const gull = modus !== 'vekst' || beat >= 2;
    const visSol = modus === 'morgen' || modus === 'sol';
    const aksen = modus === 'sol';

    return (
        <>
            <color attach="background" args={[modus === 'speil' ? '#e8dcc0' : himmel]} />
            <fog attach="fog" args={[himmel, 120, 330]} />
            <ambientLight intensity={modus === 'speil' ? 0.9 : 0.65} />
            <hemisphereLight args={['#fff7ed', '#6b7d4f', 0.6]} />
            <directionalLight
                ref={solLys}
                position={[60, 80, 40]}
                intensity={1.2}
                color={modus === 'morgen' ? '#ffd8a8' : '#fffaf0'}
            />
            {modus === 'speil' && (
                <pointLight position={[0, 8, -400]} intensity={40} distance={60} />
            )}
            {(modus === 'morgen' && beat >= 2) || modus === 'speil' ? null : (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[600, 600]} />
                        <meshStandardMaterial color="#9cb67c" roughness={1} />
                    </mesh>
                    <group ref={palass}>
                        {PALASS.map((k, i) => (
                            <Bygning key={i} k={k} farge={STEIN} gull={gull} />
                        ))}
                        <Instanser matriser={palassVinduer}>
                            <boxGeometry args={[0.75, 1.3, 0.08]} />
                            <meshStandardMaterial color="#5b6b82" />
                        </Instanser>
                        <group visible={modus !== 'vekst' || beat >= 1}>
                            <Hager />
                        </group>
                    </group>
                    <Bygning k={JAKTHYTTE} farge={MURSTEIN} gull={gull} />
                    <Instanser matriser={hytteVinduer}>
                        <boxGeometry args={[0.75, 1.3, 0.08]} />
                        <meshStandardMaterial color="#5b6b82" />
                    </Instanser>
                    {/* Kongens vindu, midt på østveggen */}
                    <mesh position={[6.05, 2.3, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <boxGeometry args={[1.1, 1.8, 0.1]} />
                        <meshStandardMaterial
                            color="#ffd27a"
                            emissive="#ffb347"
                            emissiveIntensity={modus === 'vekst' ? 0.2 : 1.2}
                        />
                    </mesh>
                    {modus === 'vekst' && <Byggeplass synlig={beat === 3} />}
                    {aksen && (
                        <mesh position={[0, 0.3, 0]}>
                            <boxGeometry args={[240, 0.3, 0.9]} />
                            <meshBasicMaterial color="#f59e0b" />
                        </mesh>
                    )}
                    <mesh ref={strale} position={[4, 18, 0]} visible={false}>
                        <cylinderGeometry args={[3, 1.2, 32, 20, 1, true]} />
                        <meshBasicMaterial
                            color="#fcd34d"
                            transparent
                            opacity={0}
                            depthWrite={false}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    {visSol && (
                        <mesh ref={sol} position={[150, 14, -40]}>
                            <sphereGeometry args={[modus === 'sol' ? 5 : 7, 24, 16]} />
                            <meshBasicMaterial color="#fde047" fog={false} />
                        </mesh>
                    )}
                </>
            )}
            {modus === 'morgen' && <Soverom beat={beat} playing={playing} />}
            {modus === 'speil' && <Speilsalen beat={beat} playing={playing} />}
        </>
    );
}

const LAPPER: Record<Modus, string[]> = {
    morgen: [
        'Versailles, utenfor Paris',
        'Kongens soverom, midt i slottet',
        'Adelsmenn rundt kongens seng',
        'Faste regler for alt',
    ],
    vekst: [
        'Først: en liten jakthytte',
        'Fra 1669: et enormt slott',
        'Barokk: pynt, gull og store rom',
        'Byggeplassen',
    ],
    speil: ['Speilsalen', '17 buede speil', 'Hoffet går i Speilsalen'],
    sol: [
        'Kongens soverom: på linja fra øst til vest',
        'Solens vei over slottet',
        'Kongen er sentrum i alt',
    ],
};

export function SolkongenSlott({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'morgen';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapper = LAPPER[modus];
    const lapp = lapper[Math.min(beat, lapper.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 900, position: [-36, 22, 62] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
            {modus === 'sol' && beat <= 1 && (
                <>
                    <div className="absolute left-[4%] top-1/2 px-4 py-2 rounded-xl bg-slate-900/85 text-amber-200 font-black text-2xl tracking-widest">
                        VEST
                    </div>
                    <div className="absolute right-[4%] top-1/2 px-4 py-2 rounded-xl bg-slate-900/85 text-amber-200 font-black text-2xl tracking-widest">
                        ØST
                    </div>
                </>
            )}
            {modus === 'vekst' && beat === 3 && (
                <div className="absolute right-[5%] bottom-[8%]">
                    <Teller verdi={40000} prefiks="ca. " etikett="arbeidere på byggeplassen" />
                </div>
            )}
            {modus === 'speil' && beat === 0 && (
                <motion.div
                    initial={{ opacity: 0, scaleX: 0.2 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 1.2 }}
                    className="absolute bottom-[9%] left-[8%] right-[8%] flex items-center gap-3"
                >
                    <div className="h-1.5 flex-1 bg-white rounded-full shadow" />
                    <div className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl md:text-4xl shadow-xl">
                        73 meter
                    </div>
                    <div className="h-1.5 flex-1 bg-white rounded-full shadow" />
                </motion.div>
            )}
            {modus === 'speil' && beat === 1 && (
                <div className="absolute right-[5%] bottom-[8%] flex gap-3">
                    <Teller verdi={17} etikett="buede speil" />
                    <Teller verdi={357} etikett="speilglass" forsinkelse={0.8} />
                </div>
            )}
        </div>
    );
}
