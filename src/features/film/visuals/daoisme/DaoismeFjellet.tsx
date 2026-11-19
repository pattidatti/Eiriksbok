import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Yin og yang (3D): et fjell der sola lyser på sørsiden, mens nordsiden ligger i skygge.
 * Så går sola fra øst til vest, og den samme fjellsiden går fra skygge til sol.
 * Nord er -z, sør er +z, øst er +x, vest er -x. Fjellet har hjørnene mot himmelretningene, så
 * flatene vender mot nordøst, sørøst, sørvest og nordvest.
 */

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const OVERSKRIFT = [
    'Yin og yang',
    'Yin: skyggesiden. Yang: solsiden.',
    'Alle par som hører sammen',
    'Den samme fjellsiden, samme dag',
    'Ingen side er god eller ond',
    'Symbolet er mye yngre enn tanken',
];

function kameraFor(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(20 - t * 0.4, 9, 20), se: v(0, 3, 0) };
        case 1:
        case 2:
            return { pos: v(26, 7, 0), se: v(0, 3.5, 0) };
        case 3:
            return { pos: v(0, 8, 25), se: v(0, 3.5, 0) };
        default:
            return { pos: v(-14, 10, 20), se: v(0, 3, 0) };
    }
}

/** Solas plass: midt i sør, eller fra øst (p = 0) til vest (p = 1). */
function solFor(beat: number, t: number) {
    if (beat !== 3) return v(0, 22, 34);
    const p = THREE.MathUtils.clamp((t - 1.2) / 2.6, 0, 1);
    const a = p * Math.PI;
    return v(40 * Math.cos(a), 6 + 16 * Math.sin(a), 18 * Math.sin(a));
}

function Merke({
    pos,
    tekst,
    under,
    farge,
}: {
    pos: [number, number, number];
    tekst: string;
    under?: string;
    farge: string;
}) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div
                className="px-4 py-2 rounded-xl shadow-xl text-center whitespace-nowrap"
                style={{ background: farge }}
            >
                <div className="text-3xl font-black text-white">{tekst}</div>
                {under && <div className="text-xl font-semibold text-white/90">{under}</div>}
            </div>
        </Html>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const kamSe = useRef(new THREE.Vector3());
    const sol = useRef<THREE.Mesh>(null);
    const lys = useRef<THREE.DirectionalLight>(null);
    const solPos = useRef(v(0, 22, 34));

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        const mal = solFor(beat, t);
        if (beat === 3) solPos.current.copy(mal);
        else solPos.current.lerp(mal, forste.current ? 1 : 1 - Math.exp(-2 * dt));
        sol.current?.position.copy(solPos.current);
        lys.current?.position.copy(solPos.current);

        const m = kameraFor(beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        kamSe.current.lerp(m.se, k);
        camera.lookAt(kamSe.current);
    });

    const smaFjell = useMemo(
        () => [
            { p: [-16, 0, -10], r: 5, h: 6 },
            { p: [15, 0, -14], r: 6, h: 7 },
            { p: [-20, 0, 8], r: 4, h: 4.5 },
        ],
        []
    );

    return (
        <>
            <color attach="background" args={['#dbeafe']} />
            <fog attach="fog" args={['#e2ecf7', 45, 110]} />
            <ambientLight intensity={0.22} />
            <hemisphereLight args={['#bfdbfe', '#1f2937', 0.15]} />
            <directionalLight ref={lys} intensity={2.4} color="#fff3d6" />
            <mesh ref={sol}>
                <sphereGeometry args={[2.2, 16, 12]} />
                <meshBasicMaterial color="#fbbf24" />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#a3b18a" />
            </mesh>
            {/* Fjellet: fire flater som vender mot nord, sør, øst og vest. */}
            <mesh position={[0, 5, 0]}>
                <coneGeometry args={[9, 10, 4]} />
                <meshStandardMaterial color="#c8b892" flatShading roughness={0.95} />
            </mesh>
            {smaFjell.map((f, i) => (
                <mesh key={i} position={[f.p[0], f.h / 2, f.p[2]]} rotation={[0, 0.3 + i, 0]}>
                    <coneGeometry args={[f.r, f.h, 4]} />
                    <meshStandardMaterial color="#b6a785" flatShading />
                </mesh>
            ))}

            {(beat === 1 || beat === 2) && (
                <>
                    <Merke
                        pos={[3.2, 3.2, -4.2]}
                        tekst="YIN"
                        under="skyggesiden, mot nord"
                        farge="#1e293b"
                    />
                    <Merke
                        pos={[3.2, 3.2, 4.2]}
                        tekst="YANG"
                        under="solsiden, mot sør"
                        farge="#d97706"
                    />
                </>
            )}
            {beat === 3 && <Merke pos={[-3.4, 2.6, 3.4]} tekst="Siden mot vest" farge="#334155" />}
        </>
    );
}

/** Yin-yang-symbolet i SVG. */
function Symbol({ storrelse }: { storrelse: number }) {
    return (
        <svg width={storrelse} height={storrelse} viewBox="-52 -52 104 104">
            <circle r={50} fill="#ffffff" stroke="#0f172a" strokeWidth={3} />
            <path
                d="M0 -50 A50 50 0 0 1 0 50 A25 25 0 0 1 0 0 A25 25 0 0 0 0 -50 Z"
                fill="#0f172a"
            />
            <circle cy={-25} r={7} fill="#0f172a" />
            <circle cy={25} r={7} fill="#ffffff" />
        </svg>
    );
}

const PAR = [
    ['mørkt', 'lyst'],
    ['kaldt', 'varmt'],
    ['stille', 'aktivt'],
];

export function DaoismeFjellet({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [20, 9, 20] }}
            >
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <Overskrift tekst={OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)]} />

            <AnimatePresence>
                {beat === 0 && (
                    <motion.div
                        key="symbol"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute right-[6%] bottom-[10%] p-4 rounded-full bg-white/80 shadow-xl"
                    >
                        <Symbol storrelse={170} />
                    </motion.div>
                )}
                {beat === 2 && (
                    <motion.div
                        key="par"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-[4%] bottom-[8%] rounded-2xl bg-white/95 shadow-xl overflow-hidden"
                    >
                        <div className="grid grid-cols-2 text-2xl font-black">
                            <div className="px-6 py-2 bg-slate-800 text-white text-center">yin</div>
                            <div className="px-6 py-2 bg-amber-500 text-white text-center">
                                yang
                            </div>
                            {PAR.map(([a, b], i) => (
                                <motion.div
                                    key={a}
                                    className="contents"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 + i * 0.7 }}
                                >
                                    <div className="px-6 py-2 text-center text-slate-800 border-t border-slate-200">
                                        {a}
                                    </div>
                                    <div className="px-6 py-2 text-center text-amber-700 border-t border-slate-200">
                                        {b}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
                {beat === 3 && (
                    <motion.div
                        key="dag"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-[4%] bottom-[8%] px-6 py-4 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold"
                    >
                        <div className="text-slate-500">Siden mot vest:</div>
                        <div className="mt-1 text-slate-900">Morgen (sola i øst): skygge</div>
                        <motion.div
                            className="mt-1 text-amber-600"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.4 }}
                        >
                            Kveld (sola i vest): sol
                        </motion.div>
                    </motion.div>
                )}
                {beat === 4 && (
                    <motion.div
                        key="midt"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 bottom-[8%] flex justify-center"
                    >
                        <div className="flex items-center gap-6 px-8 py-4 rounded-3xl bg-white/90 shadow-xl">
                            <motion.div
                                animate={playing ? { rotate: 360 } : { rotate: 0 }}
                                transition={
                                    playing
                                        ? { duration: 12, repeat: Infinity, ease: 'linear' }
                                        : { duration: 0 }
                                }
                            >
                                <Symbol storrelse={150} />
                            </motion.div>
                            <div className="text-3xl font-black text-slate-900 leading-tight">
                                Ingen av dem
                                <br />
                                finnes alene
                            </div>
                        </div>
                    </motion.div>
                )}
                {beat >= 5 && (
                    <motion.div
                        key="zhou"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 bottom-[8%] flex justify-center"
                    >
                        <div className="flex items-center gap-6 px-8 py-4 rounded-3xl bg-white/95 shadow-xl">
                            <Symbol storrelse={130} />
                            <div className="text-2xl font-bold text-slate-700">
                                <div>Knyttes til tenkeren</div>
                                <div className="text-3xl font-black text-slate-900">
                                    Zhou Dunyi (levde 1017 til 1073)
                                </div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.6 }}
                                    className="text-amber-700"
                                >
                                    Formen vi kjenner: trolig enda seinere
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
