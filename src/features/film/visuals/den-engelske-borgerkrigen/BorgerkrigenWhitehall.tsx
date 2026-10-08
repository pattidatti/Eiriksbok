import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';
import { BorgerkrigenFigurer as Figurer, type Plass } from './BorgerkrigenFigurer';

/**
 * Whitehall i London, 30. januar 1649: Banqueting House, skafottet foran huset og
 * folkemengden som venter. Filmen viser aldri selve henrettelsen, bare stedet,
 * menneskene og det tomme skafottet.
 */

const STEIN = '#d9ccb0';
const STEIN_MORK = '#b8a988';

type Modus = 'skafott' | 'ord';

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'ord') {
        return beat === 0
            ? { pos: v(-1.8 + t * 0.1, 6.3, -3.4), se: v(0, 5.7, -8) }
            : { pos: v(8 - t * 0.2, 2.9, 15), se: v(0, 5.4, -8) };
    }
    switch (beat) {
        case 0:
            return { pos: v(44 - t * 0.8, 30 - t * 0.3, 58), se: v(0, 4, -6) };
        case 1:
            return { pos: v(-2 + t * 0.3, 10, 26 - t * 0.4), se: v(0, 7, -12) };
        case 2:
            return { pos: v(14 - t * 0.3, 2.9, 16), se: v(-2, 3.5, -6) };
        case 3:
            return { pos: v(1.5, 6.4, -3.2), se: v(0, 5.6, -8) };
        default:
            return { pos: v(2.5 - Math.min(t, 8) * 0.1, 3.4, 3.5), se: v(0, 5.6, -7.6) };
    }
}

/** Kongen, som føres ut gjennom vinduet og blir stående på skafottet. */
function Kongen({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        g.visible = synlig;
        // Starter i vinduet og går rolig fram på plattformen.
        g.position.z = synlig ? damp(g.position.z, -7.6, 0.9, dt) : -9.6;
    });
    return (
        <group ref={ref} position={[0, 4.45, -9.6]}>
            <mesh position={[0, 0.65, 0]}>
                <capsuleGeometry args={[0.28, 0.75, 3, 10]} />
                <meshStandardMaterial color="#1e1b4b" flatShading />
            </mesh>
            <mesh position={[0, 1.62, 0]}>
                <sphereGeometry args={[0.2, 12, 10]} />
                <meshStandardMaterial color="#e8c39e" />
            </mesh>
            <mesh position={[0, 1.86, 0]}>
                <cylinderGeometry args={[0.2, 0.17, 0.16, 8, 1, true]} />
                <meshStandardMaterial
                    color="#eab308"
                    metalness={0.6}
                    roughness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

function BanquetingHouse() {
    const vinduer = useMemo(() => {
        const ut: { x: number; y: number }[] = [];
        for (let i = 0; i < 7; i++) {
            const x = -13.5 + i * 4.5;
            ut.push({ x, y: 4 }, { x, y: 11 });
        }
        return ut;
    }, []);
    return (
        <group position={[0, 0, -18]}>
            {/* Nedre etasje (mørkere) og hovedkroppen */}
            <mesh position={[0, 3.5, 0]}>
                <boxGeometry args={[34, 7, 16]} />
                <meshStandardMaterial color={STEIN_MORK} flatShading />
            </mesh>
            <mesh position={[0, 11, 0]}>
                <boxGeometry args={[34, 8, 16]} />
                <meshStandardMaterial color={STEIN} flatShading />
            </mesh>
            {/* Gesims og balustrade */}
            <mesh position={[0, 15.3, 0.3]}>
                <boxGeometry args={[35, 0.6, 16.8]} />
                <meshStandardMaterial color="#e8dcc0" />
            </mesh>
            <mesh position={[0, 16.3, 7.9]}>
                <boxGeometry args={[34, 1.4, 0.5]} />
                <meshStandardMaterial color="#e8dcc0" />
            </mesh>
            {/* Søyler mellom vinduene */}
            {Array.from({ length: 8 }, (_, i) => (
                <mesh key={i} position={[-15.75 + i * 4.5, 11, 8.15]}>
                    <boxGeometry args={[0.7, 7.6, 0.4]} />
                    <meshStandardMaterial color="#efe4ca" />
                </mesh>
            ))}
            {vinduer.map((w, i) => {
                const midten = w.x === 0 && w.y === 11;
                return (
                    <group key={i} position={[w.x, w.y, 8.05]}>
                        <mesh>
                            <boxGeometry args={[1.8, 3.2, 0.2]} />
                            <meshStandardMaterial
                                color={midten ? '#ffd27a' : '#2a3340'}
                                emissive={midten ? '#ffb347' : '#000000'}
                                emissiveIntensity={midten ? 0.9 : 0}
                            />
                        </mesh>
                        <mesh position={[0, 1.95, 0.1]}>
                            <boxGeometry args={[2.3, 0.4, 0.3]} />
                            <meshStandardMaterial color="#efe4ca" />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

function Skafott() {
    return (
        <group position={[0, 0, -7]}>
            {/* Plattformen, dekket med svart stoff */}
            <mesh position={[0, 4.2, 0]}>
                <boxGeometry args={[11, 0.5, 6]} />
                <meshStandardMaterial color="#3b2a1d" flatShading />
            </mesh>
            <mesh position={[0, 2.1, 3]}>
                <boxGeometry args={[11, 4.2, 0.12]} />
                <meshStandardMaterial color="#1c1c22" roughness={1} />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 5.5, 2.1, 0]}>
                    <boxGeometry args={[0.12, 4.2, 6]} />
                    <meshStandardMaterial color="#1c1c22" roughness={1} />
                </mesh>
            ))}
            {/* Rekkverk */}
            {[-5.3, -2.65, 0, 2.65, 5.3].map((x) => (
                <mesh key={x} position={[x, 5, 2.85]}>
                    <boxGeometry args={[0.18, 1.2, 0.18]} />
                    <meshStandardMaterial color="#1c1c22" />
                </mesh>
            ))}
            <mesh position={[0, 5.55, 2.85]}>
                <boxGeometry args={[10.8, 0.16, 0.16]} />
                <meshStandardMaterial color="#1c1c22" />
            </mesh>
        </group>
    );
}

function Gate() {
    // Husrekker langs gata, slik at Banqueting House står i en by.
    const hus = useMemo(
        () =>
            Array.from({ length: 10 }, (_, i) => {
                const side = i < 5 ? -1 : 1;
                const n = i % 5;
                return {
                    x: side * (26 + frø(i) * 3),
                    z: -14 + n * 11,
                    h: 9 + frø(i + 20) * 7,
                    farge: ['#a89f8c', '#9a8c78', '#b5a990', '#8f857a'][i % 4],
                };
            }),
        []
    );
    return (
        <>
            {hus.map((h, i) => (
                <mesh key={i} position={[h.x, h.h / 2, h.z]}>
                    <boxGeometry args={[10, h.h, 10]} />
                    <meshStandardMaterial color={h.farge} flatShading />
                </mesh>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ambient = useRef<THREE.AmbientLight>(null);
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);

    const folk = useMemo<Plass[]>(() => {
        const farger = [
            '#4b3b2f',
            '#3f4652',
            '#5c4a3a',
            '#2f3640',
            '#6b5a48',
            '#45403a',
            '#7a2e2e',
        ];
        const ut: Plass[] = [];
        for (let i = 0; i < 420; i++) {
            const x = (frø(i) - 0.5) * 46;
            const z = -1 + frø(i + 999) * 32;
            // Hold en åpen plass rett foran skafottet.
            if (Math.abs(x) < 6.5 && z < 3) continue;
            ut.push({ x, y: 0, z, farge: farger[i % farger.length], s: 0.92 + frø(i + 7) * 0.18 });
        }
        return ut;
    }, []);

    useFrame((_, dt) => {
        // Lyset dempes litt mot slutten.
        if (ambient.current)
            ambient.current.intensity = damp(
                ambient.current.intensity,
                beat >= 4 || modus === 'ord' ? 0.5 : 0.75,
                0.8,
                playing ? Math.min(dt, 0.05) : 0
            );
    });

    return (
        <>
            <color attach="background" args={['#c4ccd4']} />
            <fog attach="fog" args={['#c4ccd4', 45, 140]} />
            <ambientLight ref={ambient} intensity={0.75} />
            <hemisphereLight args={['#e6ecf2', '#5a5248', 0.6]} />
            <directionalLight position={[-20, 30, 25]} intensity={1.1} color="#f1f3f6" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color="#8c867a" roughness={1} />
            </mesh>
            <BanquetingHouse />
            <Skafott />
            <Kongen synlig={modus === 'ord' || beat >= 3} playing={playing} />
            <Gate />
            <Figurer plasser={folk} vugg={0.025} playing={playing} />
        </>
    );
}

export function BorgerkrigenWhitehall({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'skafott';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapp =
        modus === 'ord'
            ? ['30. januar 1649', 'Karl 1. på skafottet'][Math.min(beat, 1)]
            : [
                  'London, 30. januar 1649',
                  'Banqueting House og skafottet',
                  'Folkemengden venter',
                  'Karl 1., konge av England og Skottland',
                  'Dømt til døden',
              ][Math.min(beat, 4)];
    return (
        <div className="absolute inset-0">
            <Canvas
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [44, 30, 58] }}
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
                    className="absolute top-[7%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'ord' && beat >= 1 && (
                    <motion.blockquote
                        key="sitat"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="absolute bottom-[7%] left-1/2 -translate-x-1/2 w-[86%] text-center px-8 py-5 rounded-3xl bg-slate-900/90 text-amber-100 font-black text-3xl md:text-5xl leading-tight shadow-2xl"
                    >
                        «En undersått og en hersker er to helt forskjellige ting.»
                    </motion.blockquote>
                )}
            </AnimatePresence>
        </div>
    );
}
