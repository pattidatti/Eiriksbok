import { useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { Brikke } from './felles';
import { fro, useKamera, v } from './felles3d';

/**
 * FN-salen i 3D. Generalforsamlingen stemmer 2. mars 2022: 141 for, 5 mot, 35 avsto.
 * Hver plass i salen er et land som stemte (141 + 5 + 35 = 181 plasser). Så går kameraet til
 * Sikkerhetsrådet, der Russland har vetorett, og til slutt arrestordren fra 2023.
 */

const FOR = 141;
const MOT = 5;
const AVSTO = 35;
const N = FOR + MOT + AVSTO;

const NOYTRAL = new THREE.Color('#64748b');
const GRONN = new THREE.Color('#16a34a');
const ROD = new THREE.Color('#dc2626');
const GUL = new THREE.Color('#f59e0b');

/** Plassene i en vifte foran talerstolen, rad for rad. */
function plasser() {
    const ut: [number, number][] = [];
    const rader = 7;
    let igjen = N;
    for (let r = 0; r < rader && igjen > 0; r++) {
        const radius = 6 + r * 1.15;
        const antall = r === rader - 1 ? igjen : Math.min(igjen, Math.round(16 + r * 3.6));
        for (let k = 0; k < antall; k++) {
            const a = Math.PI * (0.12 + (0.76 * k) / Math.max(1, antall - 1));
            ut.push([Math.cos(a) * radius, Math.sin(a) * radius - 3]);
        }
        igjen -= antall;
    }
    return ut;
}

/** Hvilken stemme hver plass har. Spredt i salen, slik land sitter. */
function stemmer(): ('for' | 'mot' | 'avsto')[] {
    const liste: ('for' | 'mot' | 'avsto')[] = [
        ...Array(FOR).fill('for'),
        ...Array(MOT).fill('mot'),
        ...Array(AVSTO).fill('avsto'),
    ];
    for (let i = liste.length - 1; i > 0; i--) {
        const j = Math.floor(fro(i + 11) * (i + 1));
        [liste[i], liste[j]] = [liste[j], liste[i]];
    }
    return liste;
}

function kameraFor(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(0, 7 + t * 0.1, 19), se: v(0, 1, -2) };
        case 1:
            return { pos: v(-9, 5, 14), se: v(0, 1, -1) };
        case 2:
        case 3:
            return { pos: v(0, 17, 15), se: v(0, 0, 2) };
        case 4:
            return { pos: v(18, 4.4, 7), se: v(18, 1, 0) };
        default:
            return { pos: v(18, 5, 9), se: v(18, 1.2, 0) };
    }
}

function Plasser({ beat }: { beat: number }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const pos = useMemo(() => plasser(), []);
    const st = useMemo(() => stemmer(), []);
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        pos.forEach(([x, z], i) => {
            o.position.set(x, 0.3, z);
            o.rotation.set(0, Math.atan2(x, z + 3), 0);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    }, [pos]);
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        st.forEach((s, i) => {
            const c =
                beat >= 2 && s === 'for'
                    ? GRONN
                    : beat >= 3 && s === 'mot'
                      ? ROD
                      : beat >= 3 && s === 'avsto'
                        ? GUL
                        : NOYTRAL;
            m.setColorAt(i, c);
        });
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [beat, st]);
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
            <boxGeometry args={[0.6, 0.6, 0.5]} />
            <meshStandardMaterial emissive="#111827" emissiveIntensity={0.2} />
        </instancedMesh>
    );
}

/** Sikkerhetsrådet: fem stoler for landene med vetorett. Russlands stol er rød. */
function Radet({ beat }: { beat: number }) {
    return (
        <group position={[18, 0, 0]}>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry
                    args={[3.2, 3.2, 0.2, 48, 1, false, Math.PI * 0.15, Math.PI * 1.7]}
                />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            {Array.from({ length: 5 }, (_, i) => {
                const a = Math.PI * (0.15 + (0.7 * i) / 4);
                const russland = i === 2;
                return (
                    <group
                        key={i}
                        position={[Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4]}
                        rotation={[0, Math.atan2(-Math.cos(a), -Math.sin(a)), 0]}
                    >
                        <mesh position={[0, 0.55, 0]}>
                            <boxGeometry args={[0.8, 0.12, 0.8]} />
                            <meshStandardMaterial
                                color={russland && beat >= 4 ? '#dc2626' : '#94a3b8'}
                            />
                        </mesh>
                        <mesh position={[0, 1.1, -0.35]}>
                            <boxGeometry args={[0.8, 1.1, 0.12]} />
                            <meshStandardMaterial
                                color={russland && beat >= 4 ? '#dc2626' : '#94a3b8'}
                                emissive={russland && beat >= 4 ? '#7f1d1d' : '#000000'}
                                emissiveIntensity={0.5}
                            />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kameraFor, beat, playing);
    return (
        <>
            <color attach="background" args={['#1e3a5f']} />
            <fog attach="fog" args={['#1e3a5f', 22, 60]} />
            <ambientLight intensity={0.9} />
            <directionalLight position={[4, 14, 8]} intensity={1.6} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[60, 60]} />
                <meshStandardMaterial color="#334e6e" />
            </mesh>
            {/* Talerstolen og den gylne veggen bak */}
            <mesh position={[0, 0.7, -3]}>
                <boxGeometry args={[1.6, 1.4, 0.8]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>
            <mesh position={[0, 3.5, -4.8]}>
                <boxGeometry args={[9, 7, 0.3]} />
                <meshStandardMaterial color="#c9a227" emissive="#6b5200" emissiveIntensity={0.3} />
            </mesh>
            <Plasser beat={beat} />
            {beat >= 4 && <Radet beat={beat} />}
        </>
    );
}

const BRIKKER: { tekst: string; farge?: 'rod' | 'mork' | 'gul' }[] = [
    { tekst: 'Folkeretten: forbudt å ta land fra et annet land', farge: 'mork' },
    { tekst: 'FNs generalforsamling, 2. mars 2022' },
    { tekst: 'Fordømmer angrepet: 141 stemte for' },
    { tekst: '5 mot, 35 avsto' },
    { tekst: 'Sikkerhetsrådet: Russland har vetorett', farge: 'rod' },
    { tekst: 'Mars 2023: arrestordre mot Putin', farge: 'mork' },
];

export function UkrainaSalen({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const b = BRIKKER[Math.min(beat, BRIKKER.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [0, 7, 15] }}
            >
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <Brikke key={beat} {...b} />
            </AnimatePresence>
            {(beat === 2 || beat === 3) && (
                <div
                    className="absolute inset-x-0 flex justify-center gap-4"
                    style={{ bottom: '5%' }}
                >
                    <Teller verdi={FOR} etikett="for" tone="gronn" />
                    {beat >= 3 && <Teller verdi={MOT} etikett="mot" tone="rod" forsinkelse={0.3} />}
                    {beat >= 3 && <Teller verdi={AVSTO} etikett="avsto" forsinkelse={0.6} />}
                </div>
            )}
            {beat === 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute rounded-2xl bg-white/95 shadow-xl px-5 py-3 font-display font-bold text-2xl text-slate-900"
                    style={{ left: '3%', top: '22%', width: 300 }}
                >
                    <span className="text-red-700">Mot:</span> Russland, Belarus, Nord-Korea, Syria
                    og Eritrea
                </motion.div>
            )}
            {beat === 4 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute rounded-2xl bg-white/95 shadow-xl px-5 py-3 font-display font-bold text-3xl text-slate-900"
                    style={{ right: '4%', bottom: '8%', width: 380 }}
                >
                    Russland kan alene stanse alle vedtak om straff
                </motion.div>
            )}
            {beat === 5 && (
                <div className="absolute inset-x-0 flex justify-center" style={{ bottom: '8%' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="rounded-2xl bg-white shadow-xl px-7 py-4"
                        style={{ width: 640, borderTop: '8px solid #0f172a' }}
                    >
                        <div className="font-display font-black text-3xl text-slate-900">
                            Den internasjonale straffedomstolen
                        </div>
                        <div className="font-display font-bold text-2xl text-slate-700 mt-1">
                            Grunnen: ukrainske barn ble ført ulovlig til Russland
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
