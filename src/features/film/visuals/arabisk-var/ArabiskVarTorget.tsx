import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { damp, frø, useBeatTid, useKamera, v } from './felles3d';

/**
 * To torg i 3D der folk samlet seg. Folkemengden er instanser som fyller plassen og blir borte.
 * Tahrir (Kairo): plassen fylles, folk jubler, så tynnes mengden ut og hærens biler står igjen.
 * Pearl (Manama): folk rundt monumentet, saudiske kjøretøy ruller inn, plassen tømmes og
 * monumentet tas ned. Til slutt ligger et krigsskip ute i bukta. Ingen vold vises.
 */

type Sted = 'tahrir' | 'pearl';

const FOLK = 1100;
const BILER = 6;

/** Plassering for hver person: en ring rundt midten. Rekkefølgen er tilfeldig, men fast. */
const PLASS = Array.from({ length: FOLK }, (_, i) => {
    const vinkel = frø(i + 1) * Math.PI * 2;
    const r = 6.5 + Math.sqrt(frø(i + 4000)) * 15;
    return { x: Math.cos(vinkel) * r, z: Math.sin(vinkel) * r * 0.8, fase: frø(i + 8000) * 6 };
});

/** Hvor stor del av mengden som står der, per beat. */
const ANDEL: Record<Sted, number[]> = {
    tahrir: [0.15, 1, 1, 0.45, 0.08, 0],
    pearl: [0.55, 0.9, 0.9, 0, 0],
};

function kamera(sted: Sted) {
    return (beat: number, t: number) => {
        if (sted === 'pearl') {
            switch (beat) {
                case 0:
                    return { pos: v(-36 + t * 0.4, 22, 38), se: v(0, 2, 0) };
                case 1:
                    return { pos: v(14, 9, 22), se: v(0, 2, 0) };
                case 2:
                    return { pos: v(-22, 18, 34), se: v(-30, 1, 0) };
                case 3:
                    return { pos: v(0, 26, 40), se: v(0, 2, 0) };
                default:
                    return { pos: v(-6, 20, 30), se: v(12, 1, -18) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(-40 + t * 0.4, 24, 38), se: v(0, 0, 0) };
            case 1:
                return { pos: v(0, 48, 34), se: v(0, 0, 0) };
            case 2:
                return { pos: v(16, 7, 20), se: v(0, 1.5, 0) };
            case 3:
                return { pos: v(-26, 22, 30), se: v(0, 1, 0) };
            case 4:
                return { pos: v(-18, 16, 34), se: v(-6, 1, 10) };
            default:
                return { pos: v(24, 22, 36), se: v(-4, 1, 6) };
        }
    };
}

function Mengden({ beat, playing, sted }: { beat: number; playing: boolean; sted: Sted }) {
    const kropper = useRef<THREE.InstancedMesh>(null);
    const hoder = useRef<THREE.InstancedMesh>(null);
    const andel = useRef(-1);
    const tid = useBeatTid(beat, playing);
    const o = useMemo(() => new THREE.Object3D(), []);
    const farger = useMemo(() => {
        const a = new Float32Array(FOLK * 3);
        const c = new THREE.Color();
        const palett =
            sted === 'tahrir'
                ? ['#dc2626', '#f8fafc', '#1e293b', '#2563eb', '#a16207', '#64748b']
                : ['#f8fafc', '#1e293b', '#64748b', '#b91c1c', '#e2e8f0'];
        for (let i = 0; i < FOLK; i++) {
            c.set(palett[Math.floor(frø(i + 12000) * palett.length)]);
            c.toArray(a, i * 3);
        }
        return a;
    }, [sted]);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const k = kropper.current;
        const h = hoder.current;
        if (!k || !h) return;
        const liste = ANDEL[sted];
        const mål = liste[Math.min(beat, liste.length - 1)];
        andel.current = andel.current < 0 ? mål : damp(andel.current, mål, 1.4, dt);
        const jubel = sted === 'tahrir' && beat === 2;
        const t = tid.current;
        for (let i = 0; i < FOLK; i++) {
            const p = PLASS[i];
            const synlig = i / FOLK < andel.current;
            const s = synlig ? 1 : 0.001;
            const hopp = jubel ? Math.max(0, Math.sin(t * 6 + p.fase)) * 0.35 : 0;
            o.position.set(p.x, 0.6 + hopp, p.z);
            o.rotation.set(0, 0, 0);
            o.scale.set(s, s, s);
            o.updateMatrix();
            k.setMatrixAt(i, o.matrix);
            o.position.set(p.x, 1.42 + hopp, p.z);
            o.updateMatrix();
            h.setMatrixAt(i, o.matrix);
        }
        k.instanceMatrix.needsUpdate = true;
        h.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={kropper} args={[undefined, undefined, FOLK]}>
                <cylinderGeometry args={[0.28, 0.32, 1.2, 6]}>
                    <instancedBufferAttribute attach="attributes-color" args={[farger, 3]} />
                </cylinderGeometry>
                <meshStandardMaterial vertexColors flatShading />
            </instancedMesh>
            <instancedMesh ref={hoder} args={[undefined, undefined, FOLK]}>
                <sphereGeometry args={[0.24, 8, 6]} />
                <meshStandardMaterial color="#a8774f" flatShading />
            </instancedMesh>
        </>
    );
}

/** Kjøretøy som ruller inn på plassen: hærens biler i Kairo, saudiske i Manama. */
function Biler({ beat, playing, sted }: { beat: number; playing: boolean; sted: Sted }) {
    const ref = useRef<(THREE.Group | null)[]>([]);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const fra = sted === 'tahrir' ? 4 : 2;
        const inne = beat >= fra;
        ref.current.forEach((g, i) => {
            if (!g) return;
            // I Manama stopper bilene først utenfor plassen, og kjører inn når den er tømt.
            const utenfor = sted === 'pearl' && beat === 2;
            const målX = !inne ? -70 - i * 6 : utenfor ? -46 + i * 3.2 : -20 + i * 3.2;
            g.position.x = forste.current ? målX : damp(g.position.x, målX, 0.9, dt);
            g.visible = g.position.x > -60;
        });
        forste.current = false;
    });
    const farge = sted === 'tahrir' ? '#4d5a2c' : '#b59a6a';
    return (
        <>
            {Array.from({ length: BILER }, (_, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        ref.current[i] = g;
                    }}
                    position={[-70, 0, sted === 'tahrir' ? 12 + (i % 2) * 2.6 : (i % 2) * 2.6 - 1.3]}
                >
                    <mesh position={[0, 1, 0]}>
                        <boxGeometry args={[2.6, 1.4, 1.8]} />
                        <meshStandardMaterial color={farge} flatShading />
                    </mesh>
                    <mesh position={[0.9, 1.95, 0]}>
                        <boxGeometry args={[1, 0.7, 1.6]} />
                        <meshStandardMaterial color={farge} flatShading />
                    </mesh>
                    {[-0.8, 0.8].map((x) =>
                        [-0.95, 0.95].map((z) => (
                            <mesh key={`${x}${z}`} position={[x, 0.35, z]} rotation={[Math.PI / 2, 0, 0]}>
                                <cylinderGeometry args={[0.35, 0.35, 0.25, 10]} />
                                <meshStandardMaterial color="#1c1917" />
                            </mesh>
                        ))
                    )}
                </group>
            ))}
        </>
    );
}

/** Pearl-monumentet: seks buer som holder en hvit perle. Tas ned på beat 3. */
function Perlen({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        const mål = beat >= 3 ? 0.001 : 1;
        g.scale.y = forste.current ? mål : damp(g.scale.y, mål, 1.2, dt);
        forste.current = false;
        g.visible = g.scale.y > 0.03;
    });
    return (
        <group ref={ref}>
            {Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        position={[Math.cos(a) * 1.6, 4.5, Math.sin(a) * 1.6]}
                        rotation={[Math.sin(a) * 0.2, -a, -Math.cos(a) * 0.2]}
                    >
                        <boxGeometry args={[0.45, 9, 0.45]} />
                        <meshStandardMaterial color="#f1f5f9" flatShading />
                    </mesh>
                );
            })}
            <mesh position={[0, 9.6, 0]}>
                <sphereGeometry args={[1.5, 20, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#e0f2fe" emissiveIntensity={0.5} />
            </mesh>
        </group>
    );
}

/** Et grått krigsskip ute i bukta: USAs femte flåte. */
function Krigsskip({ beat }: { beat: number }) {
    return (
        <group position={[18, 0, -24]} visible={beat >= 4}>
            <mesh position={[0, 0.7, 0]}>
                <boxGeometry args={[14, 1.6, 2.6]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </mesh>
            <mesh position={[7.6, 0.7, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[1.3, 1.8, 4]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </mesh>
            <mesh position={[-1, 2.6, 0]}>
                <boxGeometry args={[3.5, 2.2, 1.8]} />
                <meshStandardMaterial color="#94a3b8" flatShading />
            </mesh>
            <mesh position={[-1, 4.6, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 2, 6]} />
                <meshStandardMaterial color="#cbd5e1" />
            </mesh>
        </group>
    );
}

/** Husene rundt plassen. */
const KVARTAL = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + 0.1;
    return { x: Math.cos(a) * 38, z: Math.sin(a) * 32, a, h: 3 + frø(i + 70) * 4 };
});

function Scene({ beat, playing, sted }: { beat: number; playing: boolean; sted: Sted }) {
    const mål = useMemo(() => kamera(sted), [sted]);
    useKamera(mål, beat, playing);
    const himmel = sted === 'tahrir' ? '#e6eef5' : '#d7ecf7';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 60, 160]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#ffffff', '#c2a878', 0.6]} />
            <directionalLight position={[15, 30, 18]} intensity={1.5} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#cdbb98" />
            </mesh>
            {/* Plassen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[24, 40]} />
                <meshStandardMaterial color="#a8a29e" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
                <circleGeometry args={[5.5, 32]} />
                <meshStandardMaterial color={sted === 'tahrir' ? '#65a30d' : '#d6d3d1'} />
            </mesh>
            {sted === 'pearl' && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -60]}>
                    <planeGeometry args={[200, 70]} />
                    <meshStandardMaterial color="#38a3d6" emissive="#0c4a6e" emissiveIntensity={0.35} />
                </mesh>
            )}
            {KVARTAL.filter((k) => sted === 'tahrir' || (k.z > -20 && !(k.x < -30 && Math.abs(k.z) < 12))).map((k, i) => (
                <mesh key={i} position={[k.x, k.h / 2, k.z]} rotation={[0, -k.a, 0]}>
                    <boxGeometry args={[6, k.h, 9]} />
                    <meshStandardMaterial color={i % 2 ? '#e7d8b8' : '#d8c39c'} flatShading />
                </mesh>
            ))}
            {sted === 'pearl' && <Perlen beat={beat} playing={playing} />}
            {sted === 'pearl' && <Krigsskip beat={beat} />}
            <Mengden beat={beat} playing={playing} sted={sted} />
            <Biler beat={beat} playing={playing} sted={sted} />
        </>
    );
}

const TEKST: Record<Sted, (string | [string, 'rod'])[]> = {
    tahrir: [
        'Tahrir-plassen, Kairo · 2011',
        'En million mennesker',
        'Mubarak går av',
        'Det muslimske brorskap vinner valget',
        ['2013: hæren tar makten', 'rod'],
        ['General el-Sisi styrer', 'rod'],
    ],
    pearl: [
        'Pearl-rundkjøringen, Manama · februar 2011',
        'Folket: mest sjia · kongen: sunni',
        ['Soldater fra Saudi-Arabia', 'rod'],
        ['Opprøret slås ned', 'rod'],
        'Base for den femte flåten til USA',
    ],
};

export function ArabiskVarTorget({ beat, playing, props }: VisualProps<{ sted?: Sted }>) {
    const sted: Sted = props.sted === 'pearl' ? 'pearl' : 'tahrir';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = TEKST[sted];
    const linje = linjer[Math.min(beat, linjer.length - 1)];
    const [tekst, farge] = Array.isArray(linje) ? linje : [linje, undefined];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 300, position: [-40, 24, 38] }}
            >
                <Scene beat={beat} playing={playing} sted={sted} />
            </Canvas>
            <AnimatePresence>
                <motion.div
                    key={`${sted}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        farge === 'rod' ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
            {sted === 'tahrir' && beat === 2 && (
                <div className="absolute bottom-[7%] right-[5%]">
                    <Teller verdi={18} etikett="dager på plassen" forsinkelse={0.6} />
                </div>
            )}
            {sted === 'pearl' && beat === 2 && (
                <div className="absolute bottom-[7%] right-[5%]">
                    <Teller verdi={1500} etikett="saudiske soldater" forsinkelse={0.6} tone="rod" />
                </div>
            )}
            {sted === 'pearl' && beat === 1 && (
                <div className="absolute bottom-[7%] left-[4%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-xl font-bold text-slate-700">
                    Islam har to store retninger: <span className="text-slate-900">sunni</span> og{' '}
                    <span className="text-slate-900">sjia</span>
                </div>
            )}
        </div>
    );
}
