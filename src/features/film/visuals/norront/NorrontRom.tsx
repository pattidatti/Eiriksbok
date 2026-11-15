import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { ELDRE, YNGRE, runeSti, type Rune } from './runer';

/**
 * Tingene norrønt ble skrevet på, i 3D.
 *
 *  - bok:       en gammel bok på et loft. Den åpnes, og vi leser den første setningen
 *  - stein:     en runestein ute i vinden, med den eldre og den yngre futharken
 *  - pergament: samme bok i stearinlys. Linjer med latinske bokstaver skrives inn
 *
 * All tekst ligger som DOM over lerretet, ikke som 3D-tekst.
 */

type Modus = 'bok' | 'stein' | 'pergament';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Bordflaten boka ligger på. */
const BORD_Y = 0.9;

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'bok') {
        switch (beat) {
            case 0:
                return { pos: v(4.6 - t * 0.12, 2.8, 5.2 - t * 0.12), se: v(0, 1.1, 0) };
            case 1:
                return { pos: v(0.6, 2.7, 2.4), se: v(-0.2, BORD_Y, 0) };
            case 2:
            case 3:
                return { pos: v(-0.2, 3.9, 1.5), se: v(-0.2, BORD_Y, 0.15) };
            default:
                return { pos: v(3.4, 3.1, 4.4), se: v(-0.3, 1.0, 0) };
        }
    }
    if (modus === 'pergament') {
        switch (beat) {
            case 0:
                return { pos: v(0.9, 3.4, 2.2), se: v(0.2, BORD_Y, 0) };
            case 1:
                return { pos: v(-0.9, 2.5, 2.4), se: v(0.2, BORD_Y + 0.1, 0) };
            default:
                return { pos: v(3.0 + t * 0.05, 2.6, 3.6), se: v(0, 1.0, 0) };
        }
    }
    // Runesteinen. Steinen står i origo, forsiden mot +z.
    switch (beat) {
        case 0: {
            const a = 0.9 - t * 0.05;
            return { pos: v(Math.sin(a) * 6.5, 2.0, Math.cos(a) * 6.5), se: v(0, 1.4, 0) };
        }
        case 1:
            return { pos: v(-1.2, 1.4, 5.2), se: v(0.2, 1.8, 0) };
        case 2:
            return { pos: v(1.4, 1.2, 5.0), se: v(-0.1, 1.6, 0) };
        default:
            return { pos: v(0, 1.6, 6.0), se: v(0, 1.8, 0) };
    }
}

/* ---------------- Loftet ---------------- */

function Loft() {
    const planker = useMemo(() => Array.from({ length: 9 }, (_, i) => -6 + i * 1.5), []);
    const sperrer = useMemo(() => [-4.5, -1.5, 1.5, 4.5], []);
    return (
        <group>
            {planker.map((x, i) => (
                <mesh key={x} position={[x, -0.02, 0]}>
                    <boxGeometry args={[1.45, 0.04, 16]} />
                    <meshToonMaterial color={i % 2 ? '#6b4a2f' : '#5c3f27'} />
                </mesh>
            ))}
            {/* Takets skråflater og sperrene */}
            {[-1, 1].map((s) => (
                <group key={s}>
                    <mesh position={[s * 3.2, 3.4, -1]} rotation={[0, 0, s * -0.85]}>
                        <boxGeometry args={[0.06, 7.5, 16]} />
                        <meshToonMaterial color="#3f2c1c" side={THREE.DoubleSide} />
                    </mesh>
                    {sperrer.map((z) => (
                        <mesh key={z} position={[s * 3.0, 3.3, z]} rotation={[0, 0, s * -0.85]}>
                            <boxGeometry args={[0.28, 7.6, 0.28]} />
                            <meshToonMaterial color="#7a5636" />
                        </mesh>
                    ))}
                </group>
            ))}
            {/* Bakvegg med et lite vindu */}
            <mesh position={[0, 3, -5]}>
                <boxGeometry args={[12, 6, 0.1]} />
                <meshToonMaterial color="#4a3422" />
            </mesh>
            <mesh position={[0, 3.6, -4.9]}>
                <planeGeometry args={[1.1, 0.9]} />
                <meshBasicMaterial color="#fde9b8" />
            </mesh>
            {/* Kista boka ligger på */}
            <mesh position={[0, BORD_Y / 2, 0]}>
                <boxGeometry args={[3.2, BORD_Y, 2.2]} />
                <meshToonMaterial color="#8b5a2b" />
            </mesh>
            <mesh position={[0, BORD_Y / 2, 1.11]}>
                <boxGeometry args={[3.0, 0.08, 0.02]} />
                <meshToonMaterial color="#c08a3e" />
            </mesh>
            {/* Ting som står rundt på loftet */}
            <mesh position={[-3.2, 0.5, -1.8]} rotation={[0, 0.4, 0]}>
                <boxGeometry args={[1.2, 1.0, 1.0]} />
                <meshToonMaterial color="#5a3d26" />
            </mesh>
            <mesh position={[3.1, 0.35, -2.2]}>
                <cylinderGeometry args={[0.45, 0.5, 0.7, 14]} />
                <meshToonMaterial color="#6d4c33" />
            </mesh>
        </group>
    );
}

/** Boka. `omslag` er venstre halvdel som dreies rundt ryggen. */
function Bok({
    omslag,
    linjer,
    antallLinjer,
}: {
    omslag: React.RefObject<THREE.Group | null>;
    linjer: React.RefObject<(THREE.Mesh | null)[]>;
    antallLinjer: number;
}) {
    const B = 1.3;
    const D = 1.8;
    const sider = useMemo(() => Array.from({ length: antallLinjer }, (_, i) => i), [antallLinjer]);
    return (
        <group position={[0.65, BORD_Y, 0]}>
            {/* Høyre halvdel: bakpermen og sidene */}
            <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[B + 0.08, 0.04, D + 0.08]} />
                <meshToonMaterial color="#5b1d12" />
            </mesh>
            <mesh position={[-0.02, 0.1, 0]}>
                <boxGeometry args={[B - 0.04, 0.12, D - 0.04]} />
                <meshToonMaterial color="#efe0bd" />
            </mesh>
            {/* Skrift på høyre side */}
            {sider.map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        linjer.current[i] = m;
                    }}
                    position={[-0.02, 0.165, -0.68 + i * 0.13]}
                >
                    <boxGeometry args={[1, 0.005, 0.035]} />
                    <meshBasicMaterial color="#3b2412" />
                </mesh>
            ))}
            {/* Venstre halvdel: dreies rundt ryggen (x = -B/2) */}
            <group position={[-B / 2, 0.16, 0]} ref={omslag}>
                <group position={[B / 2, 0, 0]}>
                    <mesh position={[0, 0.06, 0]}>
                        <boxGeometry args={[B - 0.04, 0.1, D - 0.04]} />
                        <meshToonMaterial color="#efe0bd" />
                    </mesh>
                    <mesh position={[0, 0.13, 0]}>
                        <boxGeometry args={[B + 0.08, 0.04, D + 0.08]} />
                        <meshToonMaterial color="#6b2416" />
                    </mesh>
                    {/* Pynt på forsiden av permen */}
                    <mesh position={[0, 0.155, 0]}>
                        <boxGeometry args={[0.8, 0.01, 1.2]} />
                        <meshToonMaterial color="#c08a3e" />
                    </mesh>
                    <mesh position={[0, 0.162, 0]}>
                        <boxGeometry args={[0.6, 0.01, 1.0]} />
                        <meshToonMaterial color="#6b2416" />
                    </mesh>
                    {/* Linjer på venstre side (synlige når boka er åpen) */}
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <mesh key={i} position={[0, 0.006, -0.65 + i * 0.13]}>
                            <boxGeometry args={[1, 0.005, 0.035]} />
                            <meshBasicMaterial color="#5a3a20" />
                        </mesh>
                    ))}
                </group>
            </group>
        </group>
    );
}

function Lys({ flamme }: { flamme: React.RefObject<THREE.Mesh | null> }) {
    return (
        <group position={[-1.2, BORD_Y, -0.6]}>
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.1, 0.11, 0.6, 12]} />
                <meshToonMaterial color="#f5ecd6" />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.22, 0.24, 0.04, 16]} />
                <meshToonMaterial color="#9a7b4f" />
            </mesh>
            <mesh ref={flamme} position={[0, 0.7, 0]}>
                <sphereGeometry args={[0.07, 10, 10]} />
                <meshBasicMaterial color="#ffcf5a" />
            </mesh>
            <pointLight position={[0, 0.8, 0]} color="#ffb347" intensity={6} distance={6} decay={1.6} />
        </group>
    );
}

/* ---------------- Runesteinen ---------------- */

function steinForm() {
    const s = new THREE.Shape();
    s.moveTo(-0.75, 0);
    s.lineTo(0.8, 0);
    s.quadraticCurveTo(0.95, 1.6, 0.6, 3.0);
    s.quadraticCurveTo(0.1, 3.5, -0.45, 3.1);
    s.quadraticCurveTo(-0.95, 1.8, -0.75, 0);
    return s;
}

/** En rune hogd inn som mørke streker på steinens forside. */
function RuneRisset({ rune, x, y, h }: { rune: Rune; x: number; y: number; h: number }) {
    const s = h / 2;
    const biter = useMemo(() => {
        const ut: { p: [number, number]; l: number; r: number }[] = [];
        for (const linje of rune) {
            for (let i = 0; i < linje.length - 1; i++) {
                const [ax, ay] = linje[i];
                const [bx, by] = linje[i + 1];
                const x1 = x + ax * s;
                const y1 = y - ay * s;
                const x2 = x + bx * s;
                const y2 = y - by * s;
                ut.push({
                    p: [(x1 + x2) / 2, (y1 + y2) / 2],
                    l: Math.hypot(x2 - x1, y2 - y1),
                    r: Math.atan2(y2 - y1, x2 - x1),
                });
            }
        }
        return ut;
    }, [rune, x, y, s]);
    return (
        <>
            {biter.map((b, i) => (
                <mesh key={i} position={[b.p[0], b.p[1], 0.49]} rotation={[0, 0, b.r]}>
                    <boxGeometry args={[b.l + 0.03, 0.05, 0.02]} />
                    <meshBasicMaterial color="#7f1d1d" />
                </mesh>
            ))}
        </>
    );
}

function Runestein() {
    const form = useMemo(() => steinForm(), []);
    const runer = useMemo(() => ELDRE.slice(0, 9), []);
    return (
        <group>
            <mesh>
                <extrudeGeometry
                    args={[form, { depth: 0.4, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 }]}
                />
                <meshToonMaterial color="#8d8a84" />
            </mesh>
            {/* To kolonner med runer nedover steinen */}
            {runer.map((r, i) => (
                <RuneRisset key={i} rune={r} x={i < 5 ? -0.32 : 0.12} y={2.8 - (i % 5) * 0.52} h={0.42} />
            ))}
            {/* Mark og steiner rundt */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <circleGeometry args={[60, 32]} />
                <meshToonMaterial color="#6f8a4a" />
            </mesh>
            {[
                [-2.5, 0.2, -1.5, 0.5],
                [3.0, 0.15, -2.4, 0.4],
                [1.8, 0.1, 1.6, 0.25],
                [-3.6, 0.25, 1.2, 0.55],
            ].map(([x, y, z, r], i) => (
                <mesh key={i} position={[x, y, z]}>
                    <dodecahedronGeometry args={[r, 0]} />
                    <meshToonMaterial color="#77736b" />
                </mesh>
            ))}
            {/* Åser i bakgrunnen */}
            {[
                [-18, -30, 9],
                [6, -36, 12],
                [26, -28, 8],
            ].map(([x, z, r], i) => (
                <mesh key={i} position={[x, 0, z]} scale={[1, 0.35, 1]}>
                    <sphereGeometry args={[r, 16, 10]} />
                    <meshToonMaterial color="#56703c" />
                </mesh>
            ))}
        </group>
    );
}

/* ---------------- Scenen ---------------- */

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const omslag = useRef<THREE.Group>(null);
    const linjer = useRef<(THREE.Mesh | null)[]>([]);
    const flamme = useRef<THREE.Mesh>(null);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const beatTid = useRef(0);
    const forrige = useRef(beat);
    const ute = modus === 'stein';
    const antallLinjer = 11;

    useFrame((state, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        // Boka åpnes fra beat 1 (bok) og er åpen hele tiden i pergament.
        if (omslag.current) {
            const apen = modus === 'pergament' || beat >= 1;
            const mal = apen ? Math.PI * 0.985 : 0;
            omslag.current.rotation.z = damp(omslag.current.rotation.z, mal, 2.6, dt || 0.016);
        }
        // Skriften på høyre side: full i bok, skrives linje for linje i pergament.
        const synlige =
            modus === 'pergament' ? Math.min(antallLinjer, 3 + beat * 4 + Math.floor(t * 1.5)) : antallLinjer;
        linjer.current.forEach((m, i) => {
            if (!m) return;
            const vis = i < synlige;
            m.visible = vis;
            const ny = modus === 'pergament' && i === synlige - 1 && synlige < antallLinjer;
            m.scale.x = ny ? Math.min(1, (t * 1.5) % 1) : 1;
        });
        if (flamme.current) {
            const k = state.clock.elapsedTime;
            flamme.current.scale.set(1, 1.6 + Math.sin(k * 9) * 0.15, 1);
        }

        const mal = kameraFor(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
    });

    if (ute) {
        return (
            <>
                <color attach="background" args={['#c9d8e2']} />
                <fog attach="fog" args={['#c9d8e2', 18, 60]} />
                <ambientLight intensity={0.7} />
                <directionalLight position={[6, 10, 8]} intensity={1.5} color="#fff4e0" />
                <hemisphereLight args={['#dbe7f0', '#4b5e33', 0.5]} />
                <Runestein />
            </>
        );
    }
    return (
        <>
            <color attach="background" args={['#1f150d']} />
            <fog attach="fog" args={['#1f150d', 7, 18]} />
            <ambientLight intensity={modus === 'pergament' ? 0.45 : 0.7} color="#ffe6c4" />
            <directionalLight position={[0, 5, -4]} intensity={modus === 'pergament' ? 0.5 : 1.1} color="#ffe7b0" />
            <directionalLight position={[4, 6, 5]} intensity={0.6} color="#ffd9a0" />
            <Loft />
            <Bok omslag={omslag} linjer={linjer} antallLinjer={antallLinjer} />
            {modus === 'pergament' && <Lys flamme={flamme} />}
        </>
    );
}

/* ---------------- DOM over lerretet ---------------- */

const ORD = [
    { gammel: 'Þar', ny: 'der' },
    { gammel: 'er', ny: '' },
    { gammel: 'maðr', ny: 'mann' },
    { gammel: 'nefndr', ny: 'nevnt' },
    { gammel: 'Egill', ny: '' },
];

function Kort({ children, top = '6%' }: { children: React.ReactNode; top?: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl shadow-2xl"
                style={{ background: 'rgba(250,240,215,0.96)', padding: '14px 28px' }}
            >
                {children}
            </motion.div>
        </div>
    );
}

function BokTekst({ beat }: { beat: number }) {
    return (
        <AnimatePresence>
            {beat >= 1 && beat <= 3 && (
                <Kort key="setning">
                    <div className="flex items-start" style={{ gap: 22 }}>
                        {ORD.map((o) => (
                            <div key={o.gammel} className="flex flex-col items-center">
                                <div
                                    className="font-serif italic"
                                    style={{
                                        fontSize: 46,
                                        color: beat >= 3 && o.ny ? '#b45309' : '#3b2412',
                                        fontWeight: beat >= 3 && o.ny ? 700 : 400,
                                    }}
                                >
                                    {o.gammel}
                                </div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: beat >= 3 && o.ny ? 1 : 0 }}
                                    className="font-display font-black"
                                    style={{ fontSize: 30, color: '#0f766e', height: 38 }}
                                >
                                    {o.ny ? `= ${o.ny}` : ''}
                                </motion.div>
                            </div>
                        ))}
                    </div>
                    {beat === 2 && (
                        <div className="text-center font-semibold" style={{ fontSize: 20, color: '#78716c' }}>
                            Les det høyt ...
                        </div>
                    )}
                </Kort>
            )}
            {beat >= 4 && (
                <Kort key="norront">
                    <div className="text-center">
                        <div className="font-display font-black" style={{ fontSize: 44, color: '#92400e' }}>
                            Dette er norrønt
                        </div>
                        <div className="font-semibold" style={{ fontSize: 22, color: '#3b2412' }}>
                            språket i Norge for tusen år siden
                        </div>
                    </div>
                </Kort>
            )}
        </AnimatePresence>
    );
}

function RuneRad({ runer, farge, h = 46 }: { runer: Rune[]; farge: string; h?: number }) {
    const bredde = h * 0.62;
    const w = runer.length * bredde;
    return (
        <svg width={w} height={h + 6} viewBox={`0 0 ${w} ${h + 6}`}>
            {runer.map((r, i) => (
                <path
                    key={i}
                    d={runeSti(r, i * bredde + bredde * 0.12, 3, h)}
                    fill="none"
                    stroke={farge}
                    strokeWidth={3.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ))}
        </svg>
    );
}

function SteinTekst({ beat }: { beat: number }) {
    return (
        <>
            <AnimatePresence>
                {beat === 0 && (
                    <Kort key="intro">
                        <div className="font-display font-black" style={{ fontSize: 34, color: '#3b2412' }}>
                            Runer: risset inn i stein
                        </div>
                    </Kort>
                )}
            </AnimatePresence>
            {beat >= 1 && (
                <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: '5%', gap: 12 }}>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl shadow-2xl"
                        style={{ background: 'rgba(250,240,215,0.96)', padding: '10px 22px' }}
                    >
                        <div className="font-display font-black" style={{ fontSize: 26, color: '#3b2412' }}>
                            Den eldre futharken: 24 tegn
                        </div>
                        <RuneRad runer={ELDRE} farge="#7f1d1d" />
                    </motion.div>
                    <AnimatePresence>
                        {beat >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl shadow-2xl"
                                style={{ background: 'rgba(250,240,215,0.96)', padding: '10px 22px' }}
                            >
                                <div className="font-display font-black" style={{ fontSize: 26, color: '#3b2412' }}>
                                    Den yngre futharken: 16 tegn, fra 800-tallet
                                </div>
                                <RuneRad runer={YNGRE} farge="#1e3a8a" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
            <AnimatePresence>
                {beat >= 3 && (
                    <div className="absolute inset-x-0 flex justify-center" style={{ bottom: '6%' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-2xl shadow-2xl flex items-center"
                            style={{ background: 'rgba(30,27,24,0.92)', padding: '12px 22px', gap: 18 }}
                        >
                            <Tastatur />
                            <div className="font-display font-bold" style={{ fontSize: 24, color: '#fef3c7' }}>
                                som et tastatur
                                <br />
                                med færre taster
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

function Tastatur() {
    const taster = Array.from({ length: 24 }, (_, i) => i);
    const borte = new Set([2, 5, 7, 11, 13, 18, 21, 23]);
    return (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(8, 26px)', gap: 5 }}>
            {taster.map((i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: borte.has(i) ? 0.12 : 1 }}
                    transition={{ delay: 0.5 + (i % 8) * 0.08, duration: 0.5 }}
                    style={{ width: 26, height: 22, borderRadius: 5, background: '#e7e5e4' }}
                />
            ))}
        </div>
    );
}

function PergamentTekst({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <Kort key="abc">
                    <div className="text-center">
                        <div className="font-semibold" style={{ fontSize: 20, color: '#78716c' }}>
                            Rundt år 1000: kristendommen kommer
                        </div>
                        <div className="font-serif" style={{ fontSize: 44, color: '#3b2412', letterSpacing: 6 }}>
                            A B C D E F G H I K L M
                        </div>
                        <div className="font-display font-bold" style={{ fontSize: 22, color: '#92400e' }}>
                            det latinske alfabetet
                        </div>
                    </div>
                </Kort>
            )}
            {beat === 1 && (
                <Kort key="perg">
                    <div className="text-center">
                        <div className="font-display font-black" style={{ fontSize: 38, color: '#3b2412' }}>
                            Pergament
                        </div>
                        <div className="font-semibold" style={{ fontSize: 22, color: '#78350f' }}>
                            ark laget av dyrehud. Skrevet av munker og skrivere på Island
                        </div>
                    </div>
                </Kort>
            )}
            {beat >= 2 && (
                <Kort key="saga">
                    <div className="text-center">
                        <div className="font-display font-black" style={{ fontSize: 40, color: '#92400e' }}>
                            Sagaene
                        </div>
                        <div className="font-semibold" style={{ fontSize: 22, color: '#3b2412' }}>
                            uten dem ville språket vært tapt
                        </div>
                    </div>
                </Kort>
            )}
        </AnimatePresence>
    );
}

export function NorrontRom({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'bok';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    return (
        <div className="absolute inset-0">
            <Canvas
                key={modus}
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.1, far: 200, position: [4.6, 2.8, 5.2] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            {modus === 'bok' && <BokTekst beat={beat} />}
            {modus === 'stein' && <SteinTekst beat={beat} />}
            {modus === 'pergament' && <PergamentTekst beat={beat} />}
        </div>
    );
}
