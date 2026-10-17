import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useBeatTid, useKamera, v } from './felles3d';

/**
 * Gata i Sidi Bouzid, i 3D.
 * Morgen: vogna med frukt, Bouazizi, byråkraten som kommer og tar varene, og døra til
 * kommunehuset som er stengt. Kveld: den tomme vogna, og så tennes lysene i byen hus for
 * hus utover fra fortauet - protestene sprer seg. Ingen flammer og ingen mennesker som skades.
 */

type Modus = 'morgen' | 'kveld';

const FRUKT = 26;
const HUS = 70;
const KOMMUNEHUS = v(15, 0, -7);

/** Husene i byen, bortsett fra dem langs gata. Sortert etter avstand fra vogna. */
const BYEN = (() => {
    const ut: { x: number; z: number; b: number; h: number; d: number }[] = [];
    let n = 0;
    while (ut.length < HUS && n < 600) {
        n++;
        const x = (frø(n) - 0.5) * 120;
        const z = -12 - frø(n + 900) * 70;
        if (Math.abs(x - KOMMUNEHUS.x) < 6 && z > -14) continue;
        const b = 3 + frø(n + 300) * 3;
        const h = 2.5 + frø(n + 600) * 3.5;
        ut.push({ x, z, b, h, d: Math.hypot(x, z) });
    }
    return ut.sort((a, b) => a.d - b.d);
})();

/** Husene langs gata, bak fortauet. Siden mot kameraet står åpen. */
const GATEHUS: { x: number; z: number; h: number; farge: string }[] = [
    ...[-22, -15, -8, -1, 6].map((x, i) => ({
        x,
        z: -6,
        h: 3.5 + (i % 2) * 1.2,
        farge: i % 2 ? '#f1e4c8' : '#e8d3a9',
    })),
];

function kamera(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'kveld') {
            switch (beat) {
                case 0:
                    return { pos: v(-6 + t * 0.2, 3, 9), se: v(0, 1, 0) };
                case 1:
                    return { pos: v(3.5, 2.6, 5), se: v(0, 0.9, 0) };
                case 2:
                    return { pos: v(-14, 22, 34), se: v(0, 0, -20) };
                default:
                    return { pos: v(0, 48, 40), se: v(0, 0, -28) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(-14 + t * 0.3, 6, 15), se: v(2, 1, -2) };
            case 1:
                return { pos: v(-5, 3.2, 8), se: v(0, 1.2, 0) };
            case 2:
                return { pos: v(2.5, 3.6, 5.5), se: v(0, 1, 0) };
            case 3:
                return { pos: v(6, 3.6, 9), se: v(0.5, 1.3, 0) };
            case 4:
                return { pos: v(-4, 4.4, 7), se: v(0.5, 1, 0) };
            default:
                return { pos: v(8, 3.8, 6), se: v(14, 2.2, -6) };
        }
    };
}

/** En enkel figur: kropp, hode og to ben. */
function Figur({ farge, hud = '#b07a52' }: { farge: string; hud?: string }) {
    return (
        <group>
            <mesh position={[-0.13, 0.45, 0]}>
                <boxGeometry args={[0.2, 0.9, 0.22]} />
                <meshStandardMaterial color="#334155" flatShading />
            </mesh>
            <mesh position={[0.13, 0.45, 0]}>
                <boxGeometry args={[0.2, 0.9, 0.22]} />
                <meshStandardMaterial color="#334155" flatShading />
            </mesh>
            <mesh position={[0, 1.3, 0]}>
                <boxGeometry args={[0.6, 0.85, 0.34]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 1.95, 0]}>
                <sphereGeometry args={[0.24, 12, 10]} />
                <meshStandardMaterial color={hud} flatShading />
            </mesh>
        </group>
    );
}

/** Vogna med frukt. Frukten forsvinner når varene blir tatt. */
function Vogna({ beat, playing, modus }: { beat: number; playing: boolean; modus: Modus }) {
    const frukt = useRef<THREE.InstancedMesh>(null);
    const lys = useRef<THREE.MeshStandardMaterial>(null);
    const fylt = useRef(-1);
    const o = useMemo(() => new THREE.Object3D(), []);
    const farger = useMemo(() => ['#f97316', '#dc2626', '#facc15', '#65a30d', '#ea580c'], []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const m = frukt.current;
        if (!m) return;
        const mål = modus === 'morgen' && beat >= 1 && beat <= 3 ? 1 : 0;
        fylt.current = fylt.current < 0 ? mål : damp(fylt.current, mål, 4, dt);
        for (let i = 0; i < FRUKT; i++) {
            const kasse = i % 2;
            const rad = Math.floor(i / 2);
            o.position.set(
                -0.85 + kasse * 1.7 + ((rad % 3) - 1) * 0.42,
                1.32 + Math.floor(rad / 3) * 0.12,
                -0.35 + (Math.floor(rad / 3) % 2) * 0.55
            );
            o.scale.setScalar(Math.max(0.001, fylt.current) * 0.22);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
        if (lys.current) {
            const glød = modus === 'morgen' && beat === 2 ? 0.6 : 0;
            lys.current.emissiveIntensity = damp(lys.current.emissiveIntensity, glød, 3, dt);
        }
    });
    const fruktFarger = useMemo(() => {
        const a = new Float32Array(FRUKT * 3);
        const c = new THREE.Color();
        for (let i = 0; i < FRUKT; i++) {
            c.set(farger[i % farger.length]);
            c.toArray(a, i * 3);
        }
        return a;
    }, [farger]);
    return (
        <group position={[0, 0, 0]}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[3.6, 0.5, 1.6]} />
                <meshStandardMaterial
                    ref={lys}
                    color="#a16207"
                    emissive="#fbbf24"
                    emissiveIntensity={0}
                    flatShading
                />
            </mesh>
            {[-0.85, 0.85].map((x) => (
                <mesh key={x} position={[x, 1.33, 0]}>
                    <boxGeometry args={[1.5, 0.22, 1.4]} />
                    <meshStandardMaterial color="#d6a35c" flatShading />
                </mesh>
            ))}
            {[-0.85, 0.85].map((z) => (
                <mesh key={z} position={[0.4, 0.5, z]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.5, 0.5, 0.12, 14]} />
                    <meshStandardMaterial color="#44403c" flatShading />
                </mesh>
            ))}
            {[-0.6, 0.6].map((z) => (
                <mesh key={z} position={[-2.4, 1.05, z]} rotation={[0, 0, -0.15]}>
                    <boxGeometry args={[1.4, 0.1, 0.1]} />
                    <meshStandardMaterial color="#78350f" />
                </mesh>
            ))}
            <instancedMesh ref={frukt} args={[undefined, undefined, FRUKT]}>
                <sphereGeometry args={[1, 10, 8]}>
                    <instancedBufferAttribute attach="attributes-color" args={[fruktFarger, 3]} />
                </sphereGeometry>
                <meshStandardMaterial vertexColors flatShading />
            </instancedMesh>
        </group>
    );
}

/** Bouazizi og byråkraten. De står der replikken sier at de er. */
function Folk({ beat, playing, modus }: { beat: number; playing: boolean; modus: Modus }) {
    const han = useRef<THREE.Group>(null);
    const hun = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useBeatTid(beat, playing);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const k = forste.current ? 1 : 1 - Math.exp(-1.6 * dt);
        forste.current = false;
        const a = han.current;
        if (a) {
            a.visible = modus === 'morgen' && beat >= 1;
            const mål = beat >= 5 ? v(13.5, 0, -4.2) : v(-0.6, 0, 1.4);
            a.position.lerp(mål, beat >= 5 ? 1 - Math.exp(-0.9 * dt) : k);
            a.rotation.y = beat >= 5 ? Math.PI * 0.8 : 0.3;
        }
        const b = hun.current;
        if (b) {
            b.visible = modus === 'morgen' && (beat === 3 || beat === 4);
            const inn = beat === 3 ? Math.min(1, tid.current / 2.5) : 1;
            const mål = beat === 4 ? v(2.6, 0, 1.6) : v(9 - inn * 6.6, 0, 1.6);
            b.position.lerp(mål, beat === 4 ? 1 - Math.exp(-2 * dt) : 1);
            b.rotation.y = -1.2;
        }
    });
    return (
        <>
            <group ref={han} position={[-0.6, 0, 1.4]} visible={false}>
                <Figur farge="#2563eb" />
            </group>
            <group ref={hun} position={[9, 0, 1.6]} visible={false}>
                <Figur farge="#1e293b" hud="#c08a5e" />
                <mesh position={[0, 1.95, 0.02]}>
                    <sphereGeometry args={[0.27, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            </group>
        </>
    );
}

/** Byen bak gata. Om kvelden tennes vinduene utover fra vogna. */
function Byen({ beat, playing, modus }: { beat: number; playing: boolean; modus: Modus }) {
    const vinduer = useRef<THREE.InstancedMesh>(null);
    const radius = useRef(-1);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const m = vinduer.current;
        if (!m) return;
        const mål = modus === 'kveld' ? [0, 0, 40, 140][Math.min(beat, 3)] : 0;
        radius.current = radius.current < 0 ? mål : damp(radius.current, mål, 0.5, dt);
        BYEN.forEach((h, i) => {
            const på = h.d < radius.current;
            o.position.set(h.x, h.h * 0.55, h.z + h.b / 2 + 0.03);
            o.scale.set(på ? h.b * 0.55 : 0.001, på ? h.h * 0.3 : 0.001, 0.05);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh
                ref={(m) => {
                    if (!m) return;
                    const oo = new THREE.Object3D();
                    BYEN.forEach((h, i) => {
                        oo.position.set(h.x, h.h / 2, h.z);
                        oo.scale.set(h.b, h.h, h.b);
                        oo.updateMatrix();
                        m.setMatrixAt(i, oo.matrix);
                    });
                    m.instanceMatrix.needsUpdate = true;
                }}
                args={[undefined, undefined, HUS]}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={modus === 'kveld' ? '#b9a27f' : '#e5d3ad'} flatShading />
            </instancedMesh>
            <instancedMesh ref={vinduer} args={[undefined, undefined, HUS]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={1.4} />
            </instancedMesh>
        </>
    );
}

function Kommunehus({ modus }: { modus: Modus }) {
    return (
        <group position={[KOMMUNEHUS.x, 0, KOMMUNEHUS.z]}>
            <mesh position={[0, 3, 0]}>
                <boxGeometry args={[9, 6, 5]} />
                <meshStandardMaterial color={modus === 'kveld' ? '#c7b9a0' : '#f8fafc'} flatShading />
            </mesh>
            <mesh position={[0, 6.3, 0]}>
                <boxGeometry args={[9.6, 0.6, 5.6]} />
                <meshStandardMaterial color="#cbd5e1" flatShading />
            </mesh>
            {/* Den stengte døra */}
            <mesh position={[0, 1.3, 2.53]}>
                <boxGeometry args={[1.8, 2.6, 0.1]} />
                <meshStandardMaterial color="#7c2d12" flatShading />
            </mesh>
            {[-3, 3].map((x) => (
                <mesh key={x} position={[x, 3.6, 2.53]}>
                    <boxGeometry args={[1.4, 1.2, 0.08]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
            ))}
            {/* Tunisias flagg på taket */}
            <mesh position={[3.5, 8, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 3.2, 6]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh position={[4.3, 9, 0]}>
                <boxGeometry args={[1.5, 0.95, 0.05]} />
                <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[4.3, 9, 0.04]}>
                <circleGeometry args={[0.28, 16]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
        </group>
    );
}

function Scene({ beat, playing, modus }: { beat: number; playing: boolean; modus: Modus }) {
    const mål = useMemo(() => kamera(modus), [modus]);
    useKamera(mål, beat, playing);
    const kveld = modus === 'kveld';
    const himmel = kveld ? '#c7a6c9' : '#dbeefa';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 40, 150]} />
            <ambientLight intensity={kveld ? 0.55 : 0.8} color={kveld ? '#e9d5ff' : '#ffffff'} />
            <hemisphereLight args={[kveld ? '#fbcfe8' : '#ffffff', '#a8885a', 0.6]} />
            <directionalLight
                position={kveld ? [-30, 8, 10] : [12, 25, 14]}
                intensity={kveld ? 0.9 : 1.6}
                color={kveld ? '#fdba74' : '#fffbeb'}
            />
            {/* Bakken, gata og fortauet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
                <planeGeometry args={[220, 140]} />
                <meshStandardMaterial color={kveld ? '#a8916b' : '#d9c39a'} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4.5]}>
                <planeGeometry args={[80, 6]} />
                <meshStandardMaterial color={kveld ? '#8a7f78' : '#8f8a85'} />
            </mesh>
            <mesh position={[0, 0.1, 0.2]}>
                <boxGeometry args={[80, 0.2, 2.8]} />
                <meshStandardMaterial color={kveld ? '#a8a29e' : '#d6d3d1'} flatShading />
            </mesh>
            {GATEHUS.map((h, i) => (
                <mesh key={i} position={[h.x, h.h / 2, h.z]}>
                    <boxGeometry args={[6, h.h, 4]} />
                    <meshStandardMaterial color={h.farge} flatShading />
                </mesh>
            ))}
            <Kommunehus modus={modus} />
            <Byen beat={beat} playing={playing} modus={modus} />
            <Vogna beat={beat} playing={playing} modus={modus} />
            <Folk beat={beat} playing={playing} modus={modus} />
        </>
    );
}

const TEKST: Record<Modus, (string | [string, 'rod'])[]> = {
    morgen: [
        'Sidi Bouzid, Tunisia · 17. desember 2010',
        'Mohamed Bouazizi, 26 år',
        'Vogna gir familien penger',
        ['Byråkraten krever bestikkelse', 'rod'],
        ['Varene blir tatt', 'rod'],
        ['Kommunehuset: ingen vil ta imot ham', 'rod'],
    ],
    kveld: [
        'Fortauet i Sidi Bouzid',
        'Ydmyket en gang for mye',
        'Millioner kjente seg igjen',
        'Protestene sprer seg over hele Tunisia',
    ],
};

export function ArabiskVarGata({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus === 'kveld' ? 'kveld' : 'morgen';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = TEKST[modus];
    const linje = linjer[Math.min(beat, linjer.length - 1)];
    const [tekst, farge] = Array.isArray(linje) ? linje : [linje, undefined];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 260, position: [-20, 9, 22] }}
            >
                <Scene beat={beat} playing={playing} modus={modus} />
            </Canvas>
            <AnimatePresence>
                <motion.div
                    key={`${modus}-${beat}`}
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
            {modus === 'kveld' && beat === 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="absolute bottom-[7%] right-[5%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                >
                    <div className="text-sm font-semibold text-slate-500">Bouazizi dør</div>
                    <div className="text-3xl font-black text-slate-900">4. januar 2011</div>
                </motion.div>
            )}
        </div>
    );
}
