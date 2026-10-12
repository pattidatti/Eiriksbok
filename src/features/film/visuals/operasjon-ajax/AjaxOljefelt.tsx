import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, House } from 'lucide-react';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, useKamera, v } from './felles3d';

/**
 * Oljefeltet i Iran, bygd av enkle former: pumper som nikker, et rør ned til havna,
 * lagertanker med flagg og et tankskip ved kaia. Fire modus:
 * «olje»: pumpene går, oljen renner, skipet laster. Britisk flagg.
 * «nasjonaliser»: flagget byttes til Irans flagg fra beat 1.
 * «blokade»: skipet seiler bort, pumpene stopper, havna blir tom.
 * «seier»: etter kuppet. Stille først, så kommer skipet tilbake og oljen renner igjen.
 */

type Modus = 'olje' | 'nasjonaliser' | 'blokade' | 'seier';

const PUMPER: [number, number][] = [
    [-22, -6],
    [-16, 5],
    [-11, -10],
    [-25, 6],
    [-6, 7],
];
const RØR_FRA = -14;
const RØR_TIL = 21;
const DRÅPER = 14;
const KAI_X = 22;
const SKIP_INNE = 38;
const SKIP_UTE = 95;

function pumperGår(modus: Modus, beat: number) {
    if (modus === 'blokade') return beat <= 1;
    if (modus === 'seier') return beat >= 3;
    return true;
}
function skipInne(modus: Modus, beat: number) {
    if (modus === 'blokade') return beat <= 0;
    if (modus === 'seier') return beat >= 3;
    return true;
}
function iranskFlagg(modus: Modus, beat: number) {
    if (modus === 'olje') return false;
    if (modus === 'nasjonaliser') return beat >= 1;
    return true;
}

function kamera(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'olje') {
            switch (beat) {
                case 0:
                    return { pos: v(-38 + t * 0.5, 13, 34), se: v(-8, 2, 0) };
                case 1:
                    return { pos: v(-9 - t * 0.15, 5, 16), se: v(-16, 3, 4) };
                case 2:
                    return { pos: v(4 + t * 0.4, 9, 24), se: v(26, 2, 0) };
                default:
                    return { pos: v(-4, 26, 46), se: v(4, 0, 0) };
            }
        }
        if (modus === 'nasjonaliser') {
            if (beat === 0) return { pos: v(-30, 10, 32), se: v(-10, 2, 0) };
            if (beat === 3) return { pos: v(-2, 12, 36), se: v(10, 4, 0) };
            return { pos: v(4, 9, 18), se: v(14, 8, -5) };
        }
        if (modus === 'blokade') {
            switch (beat) {
                case 0:
                    return { pos: v(4, 9, 18), se: v(14, 8, -5) };
                case 1:
                case 2:
                    return { pos: v(12, 14, 40), se: v(44, 0, 0) };
                case 3:
                    return { pos: v(-10, 6, 20), se: v(-16, 2, 0) };
                default:
                    return { pos: v(-6, 28, 48 + t * 0.3), se: v(4, 0, 0) };
            }
        }
        switch (beat) {
            case 0:
            case 1:
            case 2:
                return { pos: v(-20 + t * 0.3, 11, 34), se: v(0, 2, 0) };
            case 3:
                return { pos: v(12, 12, 36), se: v(32, 1, 0) };
            default:
                return { pos: v(-4, 26, 46), se: v(4, 0, 0) };
        }
    };
}

function lagFlagg(iransk: boolean) {
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 180;
    const g = c.getContext('2d')!;
    if (iransk) {
        g.fillStyle = '#239f40';
        g.fillRect(0, 0, 300, 60);
        g.fillStyle = '#ffffff';
        g.fillRect(0, 60, 300, 60);
        g.fillStyle = '#da0000';
        g.fillRect(0, 120, 300, 60);
    } else {
        g.fillStyle = '#1e3a8a';
        g.fillRect(0, 0, 300, 180);
        g.strokeStyle = '#ffffff';
        g.lineWidth = 34;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(300, 180);
        g.moveTo(300, 0);
        g.lineTo(0, 180);
        g.stroke();
        g.strokeStyle = '#c8102e';
        g.lineWidth = 12;
        g.stroke();
        g.fillStyle = '#ffffff';
        g.fillRect(125, 0, 50, 180);
        g.fillRect(0, 65, 300, 50);
        g.fillStyle = '#c8102e';
        g.fillRect(135, 0, 30, 180);
        g.fillRect(0, 75, 300, 30);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Et flagg som vaier. Det iranske og det britiske skaleres inn og ut når flagget byttes. */
function Flagg({
    iransk,
    playing,
    størrelse = 1,
}: {
    iransk: boolean;
    playing: boolean;
    størrelse?: number;
}) {
    const tekBrit = useMemo(() => lagFlagg(false), []);
    const tekIran = useMemo(() => lagFlagg(true), []);
    useEffect(
        () => () => {
            tekBrit.dispose();
            tekIran.dispose();
        },
        [tekBrit, tekIran]
    );
    const brit = useRef<THREE.Mesh>(null);
    const iran = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        for (const [m, på] of [
            [brit.current, !iransk],
            [iran.current, iransk],
        ] as const) {
            if (!m) continue;
            const s = forste.current ? (på ? 1 : 0.001) : damp(m.scale.y, på ? 1 : 0.001, 4, dt || 0.016);
            m.scale.set(1, s, 1);
            m.visible = s > 0.02;
            m.rotation.y = Math.sin(tid.current * 2) * 0.15;
        }
        forste.current = false;
    });
    return (
        <group scale={størrelse}>
            <mesh position={[0, 3.5, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 7, 8]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh ref={brit} position={[1.3, 6.2, 0]}>
                <planeGeometry args={[2.6, 1.56]} />
                <meshStandardMaterial map={tekBrit} side={THREE.DoubleSide} emissive="#ffffff" emissiveMap={tekBrit} emissiveIntensity={0.35} />
            </mesh>
            <mesh ref={iran} position={[1.3, 6.2, 0]}>
                <planeGeometry args={[2.6, 1.56]} />
                <meshStandardMaterial map={tekIran} side={THREE.DoubleSide} emissive="#ffffff" emissiveMap={tekIran} emissiveIntensity={0.35} />
            </mesh>
        </group>
    );
}

/** En pumpe som nikker opp og ned («hestehode»-pumpe). */
function Pumpe({
    x,
    z,
    fase,
    går,
    playing,
}: {
    x: number;
    z: number;
    fase: number;
    går: boolean;
    playing: boolean;
}) {
    const bjelke = useRef<THREE.Group>(null);
    const fart = useRef(går ? 1 : 0);
    const vinkel = useRef(fase);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        fart.current = damp(fart.current, går ? 1 : 0, 1.5, dt);
        vinkel.current += dt * 2.2 * fart.current;
        if (bjelke.current) bjelke.current.rotation.z = Math.sin(vinkel.current) * 0.32 * fart.current;
    });
    const stål = '#374151';
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[4.6, 0.5, 1.6]} />
                <meshStandardMaterial color="#6b7280" flatShading />
            </mesh>
            <mesh position={[0, 1.7, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.35, 3, 0.9]} />
                <meshStandardMaterial color={stål} flatShading />
            </mesh>
            <group ref={bjelke} position={[0, 3.2, 0]}>
                <mesh>
                    <boxGeometry args={[5, 0.45, 0.45]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#92400e" emissiveIntensity={0.3} flatShading />
                </mesh>
                <mesh position={[2.6, -0.5, 0]}>
                    <boxGeometry args={[0.6, 1.5, 0.6]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#92400e" emissiveIntensity={0.3} flatShading />
                </mesh>
                <mesh position={[-2.3, -0.4, 0]}>
                    <boxGeometry args={[0.9, 0.9, 0.9]} />
                    <meshStandardMaterial color={stål} flatShading />
                </mesh>
            </group>
            <mesh position={[2.6, 1.2, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 2.4, 6]} />
                <meshStandardMaterial color={stål} />
            </mesh>
        </group>
    );
}

/** Oljen i røret: mørke dråper som glir mot havna når pumpene går. */
function Dråper({ går, playing }: { går: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const fart = useRef(går ? 1 : 0);
    const forskyv = useRef(0);
    const m = useMemo(() => new THREE.Matrix4(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        fart.current = damp(fart.current, går ? 1 : 0, 1.5, dt);
        forskyv.current += dt * 0.08 * fart.current;
        const im = ref.current;
        if (!im) return;
        for (let i = 0; i < DRÅPER; i++) {
            const u = (i / DRÅPER + forskyv.current) % 1;
            const x = RØR_FRA + u * (RØR_TIL - RØR_FRA);
            const s = 0.15 + 0.85 * fart.current;
            m.makeScale(s, s, s).setPosition(x, 1.35, 0);
            im.setMatrixAt(i, m);
        }
        im.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, DRÅPER]}>
            <sphereGeometry args={[0.55, 10, 8]} />
            <meshStandardMaterial color="#111827" emissive="#1f2937" emissiveIntensity={0.4} />
        </instancedMesh>
    );
}

function Tankskip({ inne, playing }: { inne: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const g = ref.current;
        if (!g) return;
        const mål = inne ? SKIP_INNE : SKIP_UTE;
        g.position.x = forste.current ? mål : damp(g.position.x, mål, 1.1, dt);
        forste.current = false;
        g.position.y = Math.sin(tid.current * 0.9) * 0.08;
    });
    return (
        <group ref={ref} position={[SKIP_INNE, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[4.2, 2.2, 22]} />
                <meshStandardMaterial color="#7f1d1d" emissive="#450a0a" emissiveIntensity={0.3} flatShading />
            </mesh>
            <mesh position={[0, 2.15, 0]}>
                <boxGeometry args={[4.3, 0.3, 22.2]} />
                <meshStandardMaterial color="#1f2937" flatShading />
            </mesh>
            <mesh position={[0, 3.8, -8.5]}>
                <boxGeometry args={[3.6, 3, 3.2]} />
                <meshStandardMaterial color="#f8fafc" emissive="#94a3b8" emissiveIntensity={0.3} flatShading />
            </mesh>
            <mesh position={[0, 5.9, -9.2]}>
                <cylinderGeometry args={[0.6, 0.7, 1.6, 10]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            <group position={[0, 2.3, -10.8]} rotation={[0, -Math.PI / 2, 0]}>
                <Flagg iransk={false} playing={playing} størrelse={0.55} />
            </group>
        </group>
    );
}

function Havna() {
    return (
        <>
            <mesh position={[KAI_X + 1, 0.5, 0]}>
                <boxGeometry args={[4, 1, 16]} />
                <meshStandardMaterial color="#9ca3af" flatShading />
            </mesh>
            {[
                [12, -6],
                [12, 6],
            ].map(([x, z]) => (
                <group key={z} position={[x, 0, z]}>
                    <mesh position={[0, 2.2, 0]}>
                        <cylinderGeometry args={[3, 3, 4.4, 24]} />
                        <meshStandardMaterial color="#f1f5f9" emissive="#94a3b8" emissiveIntensity={0.25} flatShading />
                    </mesh>
                    <mesh position={[0, 4.5, 0]}>
                        <cylinderGeometry args={[2.6, 3, 0.4, 24]} />
                        <meshStandardMaterial color="#cbd5e1" flatShading />
                    </mesh>
                </group>
            ))}
            {/* Røret fra pumpene til kaia */}
            <mesh position={[(RØR_FRA + RØR_TIL) / 2, 1.35, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.32, 0.32, RØR_TIL - RØR_FRA, 10]} />
                <meshStandardMaterial color="#64748b" transparent opacity={0.55} />
            </mesh>
            {PUMPER.map(([x, z], i) => (
                <mesh key={i} position={[(x + RØR_FRA) / 2 + 1.3, 0.35, z / 2]} rotation={[0, Math.atan2(z, RØR_FRA - x - 2.6), 0]}>
                    <boxGeometry args={[Math.hypot(RØR_FRA - x - 2.6, z), 0.3, 0.3]} />
                    <meshStandardMaterial color="#64748b" />
                </mesh>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kam = useMemo(() => kamera(modus), [modus]);
    useKamera(kam, beat, playing);
    const går = pumperGår(modus, beat);
    return (
        <>
            <color attach="background" args={['#cfe6f5']} />
            <fog attach="fog" args={['#cfe6f5', 50, 140]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#fff7e6', '#c8a46a', 0.7]} />
            <directionalLight position={[-20, 30, 20]} intensity={1.3} color="#fff1d6" />
            {/* Ørkenen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-20, 0, 0]}>
                <planeGeometry args={[100, 120]} />
                <meshStandardMaterial color="#e4c48d" emissive="#7c5a26" emissiveIntensity={0.15} />
            </mesh>
            {/* Havet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[85, -0.05, 0]}>
                <planeGeometry args={[130, 160]} />
                <meshStandardMaterial color="#2b7bb9" emissive="#1e5f91" emissiveIntensity={0.5} />
            </mesh>
            {[
                [-34, -24, 9],
                [-12, -32, 7],
                [-46, 4, 8],
            ].map(([x, z, r], i) => (
                <mesh key={i} position={[x, -r * 0.55, z]}>
                    <sphereGeometry args={[r, 12, 8]} />
                    <meshStandardMaterial color="#d8b47a" flatShading />
                </mesh>
            ))}
            {PUMPER.map(([x, z], i) => (
                <Pumpe key={i} x={x} z={z} fase={i * 1.3} går={går} playing={playing} />
            ))}
            <Havna />
            <group position={[14.5, 4.6, -6]}>
                <Flagg iransk={iranskFlagg(modus, beat)} playing={playing} />
            </group>
            <Dråper går={går} playing={playing} />
            <Tankskip inne={skipInne(modus, beat)} playing={playing} />
        </>
    );
}

const TEKST: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    olje: [
        { tekst: 'Et oljefelt i Iran' },
        { tekst: 'Enorme mengder olje' },
        { tekst: 'Fra rør til tankskip' },
        { tekst: 'Hvem eier oljen?' },
    ],
    nasjonaliser: [
        { tekst: 'Oljen ligger i Iran' },
        { tekst: 'Staten tar over' },
        { tekst: 'Nasjonalisere: landet eier' },
        { tekst: '«Det som alltid har vært vårt»' },
    ],
    blokade: [
        { tekst: 'Helt eller tyv?' },
        { tekst: 'Britene: blokade', rod: true },
        { tekst: 'Ingen skip kommer', rod: true },
        { tekst: 'Pumpene står stille', rod: true },
        { tekst: 'Britene ber USA om hjelp' },
    ],
    seier: [
        { tekst: 'August 1953: kuppet lykkes', rod: true },
        { tekst: 'Mossadeq blir fjernet', rod: true },
        { tekst: 'Sjahen får all makt' },
        { tekst: 'Oljen går til Vesten igjen' },
        { tekst: 'En knusende seier?' },
    ],
};

export function AjaxOljefelt({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'olje';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const t = TEKST[modus][Math.min(beat, TEKST[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 300, position: [-38, 13, 34] }}
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
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-700 text-white' : 'bg-white/90 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'seier' && (beat === 1 || beat === 2) && (
                    <motion.div
                        key={`kort-${beat}`}
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 18 }}
                        className="absolute left-[6%] top-[26%] w-[19rem] p-5 rounded-3xl bg-white/95 shadow-2xl"
                    >
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white ${beat === 1 ? 'bg-slate-700' : 'bg-amber-500'}`}>
                            {beat === 1 ? <House className="w-11 h-11" /> : <Crown className="w-11 h-11" />}
                        </div>
                        <div className="mt-3 font-display font-black text-3xl text-slate-900">
                            {beat === 1 ? 'Mossadeq' : 'Sjahen'}
                        </div>
                        <div className="mt-1 text-xl font-semibold text-slate-600">
                            {beat === 1 ? 'Dømt for landssvik. Husarrest resten av livet.' : 'Irans konge. All makt tilbake, takket være USA.'}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
