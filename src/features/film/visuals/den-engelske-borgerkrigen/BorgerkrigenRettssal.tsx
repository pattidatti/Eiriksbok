import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { damp, frø, useKamera, v } from './felles3d';
import { BorgerkrigenFigurer as Figurer, type Plass } from './BorgerkrigenFigurer';

/**
 * Domstolen som dømte kongen, januar 1649. En lang sal med 135 dommerplasser i
 * benker, kongens stol alene på gulvet foran dem, og John Bradshaw i midten.
 * Modus «dommere»: plassene fylles, og rundt femti blir stående tomme.
 * Modus «anklage»: kongen og Bradshaw, og ordene de sa.
 */

type Modus = 'dommere' | 'anklage';

const PLASSER = 135;
const RADER = 5;
const PER_RAD = PLASSER / RADER;
const BRADSHAW_Z = -19.5;
const KONGE_Z = -8;

/** Rundt femti plasser blir tomme. Fast utvalg, spredt utover benkene. */
const TOMME = new Set(
    Array.from({ length: PLASSER }, (_, i) => i)
        .sort((a, b) => frø(a + 41) - frø(b + 41))
        .slice(0, 50)
);

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'dommere') {
        switch (beat) {
            case 0:
                return { pos: v(0, 9 - t * 0.1, 26 - t * 0.5), se: v(0, 3, -18) };
            case 1:
                return { pos: v(0, 5.5, -4 - t * 0.2), se: v(0, 3.4, -24) };
            case 2:
                return { pos: v(13 - t * 0.2, 6.5, -9), se: v(-2, 3, -24) };
            default:
                return { pos: v(2.6, 3.2, -14.8), se: v(0, 2.6, BRADSHAW_Z) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(7, 3.2, KONGE_Z - 2.5), se: v(-1.5, 1.9, -15) };
        case 1:
            return { pos: v(0.6, 2.6, KONGE_Z - 4.2), se: v(0, 1.6, KONGE_Z) };
        case 2:
            return { pos: v(0, 3.0, BRADSHAW_Z + 4.4), se: v(0, 2.6, BRADSHAW_Z) };
        case 3:
            return { pos: v(2.4, 2.5, KONGE_Z - 3.4 + t * 0.1), se: v(0, 1.7, KONGE_Z) };
        default:
            return { pos: v(5, 3, KONGE_Z + 3 + t * 0.25), se: v(0, 1.6, KONGE_Z) };
    }
}

function Sal() {
    const bjelker = Array.from({ length: 9 }, (_, i) => -28 + i * 7);
    return (
        <>
            {/* Gulv og vegger */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[26, 70]} />
                <meshStandardMaterial color="#9c8c74" roughness={1} />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 12, 7, 0]}>
                    <boxGeometry args={[0.6, 14, 70]} />
                    <meshStandardMaterial color="#cbbd9f" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 7, -31]}>
                <boxGeometry args={[24, 14, 0.6]} />
                <meshStandardMaterial color="#c2b394" flatShading />
            </mesh>
            {/* Høye vinduer */}
            {[-1, 1].map((s) =>
                [-20, -8, 4, 16].map((z) => (
                    <mesh key={`${s}${z}`} position={[s * 11.65, 9, z]}>
                        <boxGeometry args={[0.1, 4.5, 2.4]} />
                        <meshStandardMaterial
                            color="#e6eef5"
                            emissive="#c9d8e6"
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                ))
            )}
            {/* Takbjelker */}
            {bjelker.map((z) => (
                <group key={z} position={[0, 0, z]}>
                    <mesh position={[0, 14, 0]}>
                        <boxGeometry args={[24, 0.7, 0.7]} />
                        <meshStandardMaterial color="#5b3a1e" />
                    </mesh>
                    {[-1, 1].map((s) => (
                        <mesh key={s} position={[s * 7, 16.5, 0]} rotation={[0, 0, s * -0.55]}>
                            <boxGeometry args={[11, 0.6, 0.6]} />
                            <meshStandardMaterial color="#5b3a1e" />
                        </mesh>
                    ))}
                </group>
            ))}
            {/* Benkene for dommerne, i trinn */}
            {Array.from({ length: RADER }, (_, r) => (
                <mesh key={r} position={[0, 0.3 + r * 0.45, -22 - r * 1.2]}>
                    <boxGeometry args={[21, 0.6 + r * 0.9, 1.2]} />
                    <meshStandardMaterial color="#7f1d1d" flatShading />
                </mesh>
            ))}
            {/* Skranke mellom domstolen og tilskuerne */}
            <mesh position={[0, 0.6, 1]}>
                <boxGeometry args={[23, 1.2, 0.3]} />
                <meshStandardMaterial color="#5b3a1e" />
            </mesh>
        </>
    );
}

function Stol({ z, farge, hoy }: { z: number; farge: string; hoy: number }) {
    return (
        <group position={[0, 0, z]}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.1, 1, 1]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 0.5 + hoy / 2, z > BRADSHAW_Z + 1 ? 0.45 : -0.45]}>
                <boxGeometry args={[1.1, hoy, 0.15]} />
                <meshStandardMaterial color={farge} />
            </mesh>
        </group>
    );
}

/** Lyse puter på plassene til dommerne som nektet, så hullene i benkene synes. */
function TommePlasser({
    plasser,
    synlig,
    playing,
}: {
    plasser: Plass[];
    synlig: boolean;
    playing: boolean;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tomme = useMemo(() => plasser.filter((_, i) => TOMME.has(i)), [plasser]);
    const o = useMemo(() => new THREE.Object3D(), []);
    const s = useRef(0);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        s.current = damp(s.current, synlig ? 1 : 0, 3, playing ? Math.min(rawDt, 0.05) : 0.0001);
        tomme.forEach((p, i) => {
            o.position.set(p.x, p.y + 0.12, p.z);
            o.scale.setScalar(Math.max(0.0001, s.current));
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, tomme.length]}>
            <boxGeometry args={[0.5, 0.24, 0.5]} />
            <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.5} />
        </instancedMesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);

    const dommere = useMemo<Plass[]>(
        () =>
            Array.from({ length: PLASSER }, (_, i) => {
                const r = Math.floor(i / PER_RAD);
                const k = i % PER_RAD;
                return {
                    x: -10 + (k + 0.5) * (20 / PER_RAD),
                    y: 0.6 + r * 0.9,
                    z: -22 - r * 1.2,
                    farge: '#1f2937',
                    s: 0.75,
                };
            }),
        []
    );
    const tilskuere = useMemo<Plass[]>(
        () =>
            Array.from({ length: 140 }, (_, i) => ({
                x: (frø(i + 300) - 0.5) * 21,
                y: 0,
                z: 2.5 + frø(i + 600) * 14,
                farge: ['#4b3b2f', '#3f4652', '#5c4a3a', '#6b5a48'][i % 4],
            })),
        []
    );
    const skala = useRef<number[]>(
        Array.from({ length: PLASSER }, () => (modus === 'anklage' ? 1 : 0))
    );
    const tid = useRef(0);
    const hatt = useRef<THREE.Mesh>(null);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const s = skala.current;
        for (let i = 0; i < PLASSER; i++) {
            let mål = 1;
            if (modus === 'dommere') {
                if (beat === 0) mål = 0;
                else if (beat >= 2 && TOMME.has(i)) mål = 0;
            } else if (TOMME.has(i)) mål = 0;
            // Plassene fylles som en bølge fra midten og utover.
            const k = Math.abs((i % PER_RAD) - PER_RAD / 2);
            const venter = modus === 'dommere' && beat === 1 ? k * 0.05 : 0;
            if (tid.current > venter || mål === 0) s[i] = damp(s[i], mål, 3.5, dt || 0.0001);
        }
        // Stålhatten glinser når den blir nevnt.
        if (hatt.current) {
            const m = hatt.current.material as THREE.MeshStandardMaterial;
            const glans =
                modus === 'dommere' && beat === 3 ? 0.4 + Math.sin(tid.current * 4) * 0.3 : 0;
            m.emissiveIntensity = glans;
        }
    });

    return (
        <>
            <color attach="background" args={['#2a2420']} />
            <fog attach="fog" args={['#3a322b', 30, 80]} />
            <ambientLight intensity={0.6} color="#f4e7d3" />
            <hemisphereLight args={['#f1e4cf', '#3a2e24', 0.6]} />
            <directionalLight position={[8, 18, 6]} intensity={1.1} color="#fff2dc" />
            <pointLight position={[0, 6, KONGE_Z]} intensity={18} distance={14} color="#ffd9a0" />
            <Sal />
            <Figurer plasser={dommere} skala={skala} playing={playing} />
            <TommePlasser
                plasser={dommere}
                synlig={modus === 'anklage' || beat >= 2}
                playing={playing}
            />
            <Figurer plasser={tilskuere} vugg={0.02} playing={playing} />
            {/* Bradshaw: stolen i midten foran benkene, og hatten med stål inni */}
            <Stol z={BRADSHAW_Z} farge="#991b1b" hoy={2.4} />
            <Figurer
                plasser={[{ x: 0, y: 0.55, z: BRADSHAW_Z, farge: '#0f172a', s: 1 }]}
                playing={playing}
            />
            <mesh ref={hatt} position={[0, 2.38, BRADSHAW_Z]}>
                <cylinderGeometry args={[0.2, 0.22, 0.45, 14]} />
                <meshStandardMaterial
                    color="#111827"
                    emissive="#cbd5e1"
                    emissiveIntensity={0}
                    metalness={0.4}
                />
            </mesh>
            <mesh position={[0, 2.16, BRADSHAW_Z]}>
                <cylinderGeometry args={[0.38, 0.38, 0.05, 18]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            {/* Kongen alene på gulvet, med ryggen mot tilskuerne */}
            <Stol z={KONGE_Z} farge="#7e22ce" hoy={1} />
            <Figurer
                plasser={[{ x: 0, y: 0.55, z: KONGE_Z, farge: '#1e1b4b', s: 1 }]}
                playing={playing}
            />
            <mesh position={[0, 2.15, KONGE_Z]}>
                <cylinderGeometry args={[0.2, 0.18, 0.18, 8, 1, true]} />
                <meshStandardMaterial
                    color="#eab308"
                    metalness={0.6}
                    roughness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </>
    );
}

interface Lapp {
    tekst: string;
    sitat?: string;
}

const LAPPER: Record<Modus, Lapp[]> = {
    dommere: [
        { tekst: 'Januar 1649: en egen domstol' },
        { tekst: 'Dommere pekt ut' },
        { tekst: 'Rundt femti nektet' },
        { tekst: 'John Bradshaw: hatt med stål inni' },
    ],
    anklage: [
        { tekst: 'Anklage: forræderi mot England' },
        { tekst: 'Kongen nekter å svare' },
        { tekst: 'John Bradshaw', sitat: 'Selv en konge står under loven.' },
        { tekst: '27. januar 1649: dømt som tyrann og forræder' },
    ],
};

export function BorgerkrigenRettssal({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'dommere';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapp = LAPPER[modus][Math.min(beat, LAPPER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                dpr={dpr}
                camera={{ fov: 44, near: 0.2, far: 200, position: [0, 9, 26] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp.tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-[90%]"
                >
                    <div className="px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap">
                        {lapp.tekst}
                    </div>
                    {modus === 'dommere' && beat === 1 && (
                        <Teller verdi={PLASSER} etikett="dommere" forsinkelse={0.4} />
                    )}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {lapp.sitat && (
                    <motion.blockquote
                        key={lapp.sitat}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="absolute bottom-[7%] left-1/2 -translate-x-1/2 w-[86%] text-center px-8 py-5 rounded-3xl bg-slate-900/90 text-amber-100 font-black text-3xl md:text-5xl leading-tight shadow-2xl"
                    >
                        «{lapp.sitat}»
                    </motion.blockquote>
                )}
            </AnimatePresence>
        </div>
    );
}
