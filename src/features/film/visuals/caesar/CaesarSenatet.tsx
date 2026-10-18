import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';
import { damp, frø, useKamera, v } from './felles3d';
import { CaesarFigurer } from './CaesarFigurer';

/**
 * Senatet i Roma: senatorer i hvite togaer på benker i en halvsirkel, og en stol foran.
 * Modus «frykt»: senatet blir redd for Cæsar og stiller krav. «diktator»: Cæsar på
 * stolen, diktator på livstid. «idene»: 15. mars år 44. Drapet vises aldri, bare de
 * sammensvorne som merkes, og til slutt den tomme stolen.
 */

type Modus = 'frykt' | 'diktator' | 'idene';

const RADER = 5;
const PER_RAD = 30;
const N = RADER * PER_RAD;
const STOL_Z = -3;
const INN_X = 14;

/** Rundt seksti sammensvorne, spredt utover benkene. Én av dem er Brutus. */
const SAMMENSVORNE = new Set(
    Array.from({ length: N }, (_, i) => i)
        .sort((a, b) => frø(a + 13) - frø(b + 13))
        .slice(0, 60)
);
const BRUTUS =
    [...SAMMENSVORNE].find(
        (i) => Math.floor(i / PER_RAD) === 0 && Math.abs((i % PER_RAD) - 15) < 8
    ) ?? 15;

const BRUTUS_POS = (() => {
    const k = BRUTUS % PER_RAD;
    const a = -1.35 + (k / (PER_RAD - 1)) * 2.7;
    return { x: Math.sin(a) * 8.1, z: Math.cos(a) * 8.1 };
})();

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'frykt') {
        switch (beat) {
            case 0:
                return { pos: v(0, 6.5, -1.5 + t * 0.1), se: v(0, 1.5, 10) };
            case 1:
                return { pos: v(-11, 5, 1), se: v(4, 1.8, 9) };
            case 2:
                return { pos: v(0, 3.5, 4), se: v(0, 2, STOL_Z) };
            default:
                return { pos: v(10, 8, 1), se: v(-3, 1.2, 7) };
        }
    }
    if (modus === 'diktator') {
        switch (beat) {
            case 0:
                return { pos: v(0, 3.2, 6.5 - t * 0.1), se: v(0, 2.6, STOL_Z) };
            case 1:
                return { pos: v(7, 6, 10), se: v(0, 2, STOL_Z) };
            default:
                return { pos: v(0, 9, 16 - t * 0.2), se: v(0, 1.8, STOL_Z) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 10, 19 - t * 0.2), se: v(0, 1, 0) };
        case 1:
            return { pos: v(6, 3.2, 3), se: v(2, 1.5, STOL_Z) };
        case 2:
            return { pos: v(0, 15, -9), se: v(0, 0.5, 7) };
        case 3:
            return {
                pos: v(BRUTUS_POS.x * 0.45, 2.8, BRUTUS_POS.z * 0.45),
                se: v(BRUTUS_POS.x, 1.2, BRUTUS_POS.z),
            };
        default:
            return { pos: v(0, 3.4, 4.5 - t * 0.15), se: v(0, 1, STOL_Z) };
    }
}

function Sal({ mørk }: { mørk: boolean }) {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[30, 48]} />
                <meshStandardMaterial color="#c9bba0" roughness={1} />
            </mesh>
            {/* Mønster i gulvet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]}>
                <ringGeometry args={[3, 3.4, 40]} />
                <meshStandardMaterial color="#7c2d12" />
            </mesh>
            {/* Benker i trinn, i en halvsirkel */}
            <Benker />
            {/* Bakvegg med søyler bak stolen */}
            <mesh position={[0, 6, STOL_Z - 4]}>
                <boxGeometry args={[30, 12, 0.6]} />
                <meshStandardMaterial color={mørk ? '#a8987d' : '#e4d8c2'} flatShading />
            </mesh>
            {Array.from({ length: 8 }, (_, i) => (
                <mesh key={i} position={[-12.25 + i * 3.5, 4.5, STOL_Z - 3.3]}>
                    <cylinderGeometry args={[0.4, 0.45, 9, 10]} />
                    <meshStandardMaterial color="#f3ede0" />
                </mesh>
            ))}
            {/* Statue i nisjen */}
            <mesh position={[-7, 1.6, STOL_Z - 2.8]}>
                <boxGeometry args={[1.4, 3.2, 1]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
        </>
    );
}

/** Én benkeblokk per plass, som instanser: trinn som stiger bakover. */
function Benker() {
    const ref = useRef<THREE.InstancedMesh>(null);
    const ferdig = useRef(false);
    useFrame(() => {
        const m = ref.current;
        if (!m || ferdig.current) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < N; i++) {
            const r = Math.floor(i / PER_RAD);
            const k = i % PER_RAD;
            const a = -1.35 + (k / (PER_RAD - 1)) * 2.7;
            const R = 8.7 + r * 1.6;
            const h = 0.5 + r * 0.9;
            o.position.set(Math.sin(a) * R, h / 2, Math.cos(a) * R);
            o.rotation.set(0, a, 0);
            o.scale.set((2.7 * R) / (PER_RAD - 1) + 0.05, h, 1.6);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
        ferdig.current = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#e7dfcf" flatShading />
        </instancedMesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);

    const plasser = useMemo(
        () =>
            Array.from({ length: N }, (_, i) => {
                const r = Math.floor(i / PER_RAD);
                const k = i % PER_RAD;
                const a = -1.35 + (k / (PER_RAD - 1)) * 2.7;
                const R = 8.7 + r * 1.6 - 0.6;
                return { x: Math.sin(a) * R, y: 0.5 + r * 0.9, z: Math.cos(a) * R };
            }),
        []
    );
    const merk = modus === 'idene' && beat >= 2;
    const farger = useMemo(
        () =>
            plasser.map((_, i) => {
                if (merk && i === BRUTUS && beat === 3) return '#eab308';
                if (merk && SAMMENSVORNE.has(i)) return '#991b1b';
                return '#f5f3ee';
            }),
        [plasser, merk, beat]
    );
    const data = useRef(new Float32Array(N * 4));
    const reis = useRef(0);
    const tid = useRef(0);

    // Cæsar: på stolen (diktator), går inn (idene), eller borte.
    const caesar = useRef(new Float32Array([0, 0, STOL_Z, 0]));
    const cx = useRef(modus === 'idene' && beat === 0 ? INN_X : 0);
    const cs = useRef(modus === 'frykt' ? 0 : 1);
    const podium = useRef<THREE.Mesh>(null);
    const podiumH = useRef(modus === 'diktator' ? 1.6 : 0.5);
    const lys = useRef<THREE.AmbientLight>(null);
    const gull = useRef<THREE.PointLight>(null);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        // Senatorene reiser seg i frykt når Cæsar nevnes.
        reis.current = damp(reis.current, modus === 'frykt' && beat === 0 ? 1 : 0, 2, dt);
        const d = data.current;
        plasser.forEach((p, i) => {
            const brutus = i === BRUTUS && modus === 'idene' && beat === 3;
            const opp = reis.current * (frø(i + 3) > 0.35 ? 0.35 : 0) + (brutus ? 0.35 : 0);
            d[i * 4] = p.x;
            d[i * 4 + 1] = p.y - 0.35 + opp;
            d[i * 4 + 2] = p.z;
            d[i * 4 + 3] = brutus ? 1.3 : 0.9;
        });

        const borte = modus === 'frykt' || (modus === 'idene' && beat >= 4);
        cs.current = damp(cs.current, borte ? 0 : 1.2, 3, dt);
        cx.current = damp(cx.current, 0, modus === 'idene' && beat === 0 ? 0.5 : 2, dt);
        podiumH.current = damp(podiumH.current, modus === 'diktator' ? 1.6 : 0.5, 1.5, dt);
        const c = caesar.current;
        const pH = podiumH.current;
        const sitter = Math.abs(cx.current) < 0.5;
        c[0] = cx.current;
        c[1] = sitter ? pH + 0.25 : 0;
        c[2] = sitter ? STOL_Z : STOL_Z + 3;
        c[3] = cs.current;
        if (podium.current) {
            podium.current.scale.y = pH;
            podium.current.position.y = pH / 2;
        }
        if (lys.current)
            lys.current.intensity = damp(
                lys.current.intensity,
                modus === 'idene' && beat >= 4 ? 0.25 : 0.75,
                2,
                dt
            );
        if (gull.current)
            gull.current.intensity = modus === 'diktator' ? 30 + Math.sin(tid.current * 2) * 6 : 0;
    });

    const tomStol = modus === 'idene' && beat >= 4;
    return (
        <>
            <color attach="background" args={['#3b3027']} />
            <fog attach="fog" args={['#3b3027', 30, 70]} />
            <ambientLight ref={lys} intensity={0.75} color="#fbf3e4" />
            <hemisphereLight args={['#fff7e8', '#4a3b2d', 0.6]} />
            <directionalLight position={[6, 16, 12]} intensity={1.0} color="#fff2dc" />
            <pointLight ref={gull} position={[0, 5, STOL_Z + 2]} distance={14} color="#fcd34d" />
            <Sal mørk={tomStol} />
            <CaesarFigurer data={data} farger={farger} />
            {/* Podiet og stolen */}
            <mesh ref={podium} position={[0, 0.25, STOL_Z]}>
                <boxGeometry args={[3.4, 1, 2.6]} />
                <meshStandardMaterial color="#d6c7a8" flatShading />
            </mesh>
            <group position={[0, 0, STOL_Z]}>
                <Stol podiumH={podiumH} />
            </group>
            <CaesarFigurer data={caesar} farger={['#7e22ce']} />
            {/* Togaen som ligger igjen ved stolen */}
            {tomStol && (
                <mesh position={[0.9, 0.55, STOL_Z + 1.5]} rotation={[-Math.PI / 2, 0, 0.4]}>
                    <planeGeometry args={[1.6, 1.1]} />
                    <meshStandardMaterial color="#f5f3ee" side={THREE.DoubleSide} />
                </mesh>
            )}
        </>
    );
}

function Stol({ podiumH }: { podiumH: React.RefObject<number> }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        if (ref.current) ref.current.position.y = podiumH.current ?? 0.5;
    });
    return (
        <group ref={ref}>
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[1.2, 0.6, 1]} />
                <meshStandardMaterial color="#ca8a04" metalness={0.5} roughness={0.35} />
            </mesh>
            <mesh position={[0, 1.1, -0.45]}>
                <boxGeometry args={[1.2, 1.6, 0.15]} />
                <meshStandardMaterial color="#ca8a04" metalness={0.5} roughness={0.35} />
            </mesh>
        </group>
    );
}

interface Lapp {
    tekst: string;
    under?: string;
}

const LAPPER: Record<Modus, Lapp[]> = {
    frykt: [
        { tekst: 'Senatet blir livredd' },
        { tekst: 'Republikken', under: 'bygd for å stoppe én mann med for mye makt' },
        {
            tekst: 'År 49 fvt.: senatets krav',
            under: 'Gi fra deg hæren. Kom hjem som en vanlig mann.',
        },
    ],
    diktator: [
        { tekst: 'Dictator perpetuo', under: 'diktator på livstid' },
        {
            tekst: 'Diktator i republikken',
            under: 'all makt, men bare kort tid, i en nødsituasjon',
        },
        { tekst: 'Diktator på livstid', under: 'en konge i alt unntatt navnet' },
    ],
    idene: [
        { tekst: '15. mars 44 fvt.', under: 'Idene mars' },
        { tekst: 'Advart på forhånd', under: 'men Cæsar trodde ikke på spådommer' },
        { tekst: 'Rundt seksti menn med dolker', under: 'ledet av Cassius og Brutus' },
        { tekst: '«Også du, Brutus?»', under: 'Brutus, Cæsars venn (i gull)' },
        { tekst: 'Den tomme stolen' },
    ],
};

const TRUSLER = ['Penger', 'Soldater', 'Folket'];

export function CaesarSenatet({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'frykt';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapp = LAPPER[modus][Math.min(beat, LAPPER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 44, near: 0.2, far: 200, position: [0, 10, 19] }}
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
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-[92%]"
                >
                    <div className="px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap">
                        {lapp.tekst}
                    </div>
                    {lapp.under && (
                        <div className="px-4 py-1.5 rounded-xl bg-slate-900/85 text-white font-bold text-lg md:text-2xl text-center">
                            {lapp.under}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {modus === 'frykt' && beat === 0 && (
                <div className="absolute bottom-[8%] left-0 right-0 flex justify-center gap-5">
                    {TRUSLER.map((t, i) => (
                        <motion.div
                            key={t}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                delay: 0.8 + i * 0.9,
                                type: 'spring',
                                stiffness: 220,
                                damping: 16,
                            }}
                            className="px-7 py-3 rounded-2xl bg-red-700 text-white text-2xl md:text-4xl font-black shadow-xl"
                        >
                            {t}
                        </motion.div>
                    ))}
                </div>
            )}

            {modus === 'diktator' && beat >= 1 && (
                <div className="absolute bottom-[8%] left-[8%] right-[8%] flex flex-col gap-3 bg-white/92 rounded-2xl p-4 shadow-xl">
                    <Stolpe
                        etikett="Vanlig diktator"
                        bredde={0.12}
                        farge="#475569"
                        tekst="kort tid"
                    />
                    {beat >= 2 && (
                        <Stolpe
                            etikett="Cæsar"
                            bredde={1}
                            farge="#7e22ce"
                            tekst="resten av livet"
                        />
                    )}
                </div>
            )}

            {modus === 'idene' && beat >= 4 && (
                <div className="absolute bottom-[8%] left-0 right-0 flex justify-center gap-5">
                    <Tall verdi={23} etikett="stikk, anslagsvis" farge="text-slate-900" />
                    <Tall verdi={1} etikett="var dødelig" farge="text-red-600" forsinkelse={1.2} />
                </div>
            )}
        </div>
    );
}

/** Stort tall med tydelig etikett, lesbart på projektor. */
function Tall({
    verdi,
    etikett,
    farge,
    forsinkelse = 0,
}: {
    verdi: number;
    etikett: string;
    farge: string;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
            className="px-7 py-3 rounded-2xl bg-white/95 shadow-xl text-center min-w-[12rem]"
        >
            <div className={`text-5xl md:text-6xl font-black tabular-nums ${farge}`}>
                <TelleTall verdi={verdi} forsinkelse={forsinkelse} />
            </div>
            <div className="text-xl md:text-2xl font-bold text-slate-600">{etikett}</div>
        </motion.div>
    );
}

function Stolpe({
    etikett,
    bredde,
    farge,
    tekst,
}: {
    etikett: string;
    bredde: number;
    farge: string;
    tekst: string;
}) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-[22%] text-right text-xl md:text-2xl font-black text-slate-800">
                {etikett}
            </div>
            <div className="flex-1 h-10 rounded-lg bg-slate-200 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${bredde * 100}%` }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    className="h-full rounded-lg"
                    style={{ background: farge }}
                />
            </div>
            <div className="w-[20%] text-lg md:text-xl font-bold text-slate-600">{tekst}</div>
        </div>
    );
}
