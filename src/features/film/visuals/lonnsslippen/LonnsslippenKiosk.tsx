import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Kiosken ved stranda i 3D. Fire moduser:
 * - sommer: Ida bak disken. 80 timer (80 ruter), 165 kroner timen, og en stabel mynter som
 *   vokser til 13 200 kroner.
 * - lonningsdag: mobilen viser 6 600 kroner, og halve stabelen forsvinner.
 * - trekk: myntene går fra kiosken til staten, og skattekortet kommer fra staten til kiosken.
 * - tojobber: klesbutikken og kiosken. Hele frikortet havner på klesbutikken.
 */

type Modus = 'sommer' | 'lonningsdag' | 'trekk' | 'tojobber';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    sommer: ['Sommerjobb i kiosken', 'Juli: 80 timer', '165 kroner timen', 'Lønn: 13 200 kroner'],
    lonningsdag: ['Lønningsdag', 'Kontoen: 6 600 kroner', 'Halvparten er borte?'],
    trekk: [
        'Det største trekket: skatt',
        'Kiosken sender skatten til staten',
        'Skattekortet sier hvor mye',
    ],
    tojobber: [
        'Ida har to jobber',
        'Hele frikortet på klesbutikken',
        'Kiosken: 0 kroner av frikortet',
    ],
};

const KIOSK = v(0, 0, 0);
const STABEL = v(-4, 0, 1.8);
const STATEN = v(-4, 0, -18);
const KLES = v(-7, 0, -1);
const MYNTER = 40;
const MYNT_H = 0.11;
const STROM_FRA = v(STABEL.x, 3.6, STABEL.z);
const STROM_TIL = v(STATEN.x, 5, STATEN.z + 2);

// ---------- Bygningene ----------

function Markise({ bredde, farge }: { bredde: number; farge: string }) {
    const striper = 7;
    return (
        <group>
            {Array.from({ length: striper }, (_, i) => (
                <mesh
                    key={i}
                    position={[-bredde / 2 + (i + 0.5) * (bredde / striper), 0, 0]}
                    rotation={[0.45, 0, 0]}
                >
                    <boxGeometry args={[bredde / striper, 0.08, 1.6]} />
                    <meshStandardMaterial color={i % 2 ? '#f8fafc' : farge} />
                </mesh>
            ))}
        </group>
    );
}

function Kiosken({ pos }: { pos: THREE.Vector3 }) {
    return (
        <group position={pos}>
            {/* Kroppen: vegger rundt luka, så Ida står i åpningen */}
            <mesh position={[0, 1.6, -1.1]}>
                <boxGeometry args={[5, 3.2, 2.4]} />
                <meshStandardMaterial color="#fde68a" flatShading />
            </mesh>
            <mesh position={[0, 0.55, 0.45]}>
                <boxGeometry args={[5, 1.1, 0.7]} />
                <meshStandardMaterial color="#fcd34d" flatShading />
            </mesh>
            {[-2.2, 2.2].map((x) => (
                <mesh key={x} position={[x, 1.6, 0.45]}>
                    <boxGeometry args={[0.6, 3.2, 0.7]} />
                    <meshStandardMaterial color="#fde68a" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 2.95, 0.45]}>
                <boxGeometry args={[5, 0.5, 0.7]} />
                <meshStandardMaterial color="#fde68a" flatShading />
            </mesh>
            {/* Disken i luka */}
            <mesh position={[0, 1.1, 1.05]}>
                <boxGeometry args={[4.4, 0.18, 0.7]} />
                <meshStandardMaterial color="#c08457" />
            </mesh>
            {/* Mørk vegg inne i kiosken */}
            <mesh position={[0, 2, 0.08]}>
                <boxGeometry args={[3.8, 1.8, 0.05]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <group position={[0, 3.05, 1.3]}>
                <Markise bredde={5.2} farge="#ef4444" />
            </group>
            <mesh position={[0, 3.45, -0.6]}>
                <boxGeometry args={[5.3, 0.3, 3.3]} />
                <meshStandardMaterial color="#b45309" />
            </mesh>
            {/* Is-skilt */}
            <group position={[3.2, 0, 1.4]}>
                <mesh position={[0, 0.7, 0]}>
                    <cylinderGeometry args={[0.06, 0.06, 1.4, 8]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
                <mesh position={[0, 1.6, 0]}>
                    <coneGeometry args={[0.35, 0.8, 12]} />
                    <meshStandardMaterial color="#d97706" />
                </mesh>
                <mesh position={[0, 2.1, 0]}>
                    <sphereGeometry args={[0.38, 14, 10]} />
                    <meshStandardMaterial color="#f9a8d4" />
                </mesh>
            </group>
        </group>
    );
}

function Klesbutikken({ pos }: { pos: THREE.Vector3 }) {
    return (
        <group position={pos}>
            <mesh position={[0, 2, -0.6]}>
                <boxGeometry args={[5, 4, 3]} />
                <meshStandardMaterial color="#e0e7ff" flatShading />
            </mesh>
            <mesh position={[0, 1.4, 0.92]}>
                <boxGeometry args={[3.6, 2, 0.05]} />
                <meshStandardMaterial color="#1e3a5f" />
            </mesh>
            {/* Kleshenger i vinduet */}
            {[-1, 0, 1].map((x) => (
                <group key={x} position={[x, 1.6, 1]}>
                    <mesh position={[0, 0.4, 0]}>
                        <torusGeometry args={[0.12, 0.03, 6, 12]} />
                        <meshStandardMaterial color="#cbd5e1" />
                    </mesh>
                    <mesh position={[0, -0.1, 0]}>
                        <boxGeometry args={[0.7, 0.8, 0.05]} />
                        <meshStandardMaterial color={['#ec4899', '#22c55e', '#f97316'][x + 1]} />
                    </mesh>
                </group>
            ))}
            <group position={[0, 3.55, 1.25]}>
                <Markise bredde={5.2} farge="#6366f1" />
            </group>
        </group>
    );
}

function Staten({ pos }: { pos: THREE.Vector3 }) {
    return (
        <group position={pos}>
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[8, 0.8, 5]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            {[-3, -1.5, 0, 1.5, 3].map((x) => (
                <mesh key={x} position={[x, 2.4, 2]}>
                    <cylinderGeometry args={[0.3, 0.3, 3.2, 12]} />
                    <meshStandardMaterial color="#f5f5f4" />
                </mesh>
            ))}
            <mesh position={[0, 2.4, -0.6]}>
                <boxGeometry args={[7, 3.2, 3]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
            <mesh position={[0, 4.4, 0.4]} rotation={[0, Math.PI / 4, 0]} scale={[1, 0.35, 1]}>
                <coneGeometry args={[5.6, 2.4, 4]} />
                <meshStandardMaterial color="#a8a29e" flatShading />
            </mesh>
        </group>
    );
}

function Person({ pos, farge }: { pos: THREE.Vector3; farge: string }) {
    return (
        <group position={pos}>
            <mesh position={[0, 0.9, 0]}>
                <capsuleGeometry args={[0.38, 0.9, 4, 10]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 2, 0]}>
                <sphereGeometry args={[0.36, 16, 12]} />
                <meshStandardMaterial color="#e8b48c" />
            </mesh>
            {/* Hår */}
            <mesh position={[0, 2.12, -0.08]}>
                <sphereGeometry args={[0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
        </group>
    );
}

// ---------- Myntstabelen ----------

/** Hvor mange mynter stabelen skal ha (av 40) i hver beat. */
function stabelFor(modus: Modus, beat: number) {
    if (modus === 'sommer') return beat === 0 ? 0 : beat === 1 ? 0 : beat === 2 ? 1 : MYNTER;
    if (modus === 'lonningsdag') return beat >= 2 ? MYNTER / 2 : MYNTER;
    if (modus === 'trekk') return beat >= 1 ? MYNTER / 2 : MYNTER;
    return 0;
}

function Stabel({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const vist = useRef(-1);
    const obj = useMemo(() => new THREE.Object3D(), []);
    const mal = stabelFor(modus, beat);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (vist.current < 0) vist.current = mal;
        vist.current = damp(vist.current, mal, 2.2, dt);
        for (let i = 0; i < MYNTER; i++) {
            const synlig = i < Math.round(vist.current);
            obj.position.set(STABEL.x, MYNT_H / 2 + i * MYNT_H, STABEL.z);
            obj.rotation.set(0, i * 0.7, 0);
            obj.scale.setScalar(synlig ? 1 : 0);
            obj.updateMatrix();
            m.setMatrixAt(i, obj.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, MYNTER]} frustumCulled={false}>
            <cylinderGeometry args={[0.7, 0.7, MYNT_H * 0.9, 20]} />
            <meshStandardMaterial
                color="#facc15"
                emissive="#a16207"
                emissiveIntensity={0.4}
                metalness={0.3}
            />
        </instancedMesh>
    );
}

/** Mynter som flyr fra stabelen til staten (trekk-modus). */
function Myntstrom({ aktiv, playing }: { aktiv: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const obj = useMemo(() => new THREE.Object3D(), []);
    const N = 12;
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        for (let j = 0; j < N; j++) {
            const f = (tid.current * 0.3 + j / N) % 1;
            obj.position.set(
                THREE.MathUtils.lerp(STROM_FRA.x, STROM_TIL.x, f),
                THREE.MathUtils.lerp(STROM_FRA.y, STROM_TIL.y, f) + Math.sin(f * Math.PI) * 4,
                THREE.MathUtils.lerp(STROM_FRA.z, STROM_TIL.z, f)
            );
            obj.rotation.set(Math.PI / 2, f * 6, 0);
            obj.scale.setScalar(aktiv ? 1 : 0);
            obj.updateMatrix();
            m.setMatrixAt(j, obj.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
            <cylinderGeometry args={[0.45, 0.45, 0.1, 16]} />
            <meshStandardMaterial
                color="#facc15"
                emissive="#a16207"
                emissiveIntensity={0.4}
                metalness={0.3}
            />
        </instancedMesh>
    );
}

/** Et kort (skattekort eller frikort) som glir mot et mål. */
function Kort({
    mal,
    start,
    farge,
    playing,
}: {
    mal: THREE.Vector3;
    start: THREE.Vector3;
    farge: string;
    playing: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((state, rawDt) => {
        const g = ref.current;
        if (!g) return;
        if (forste.current) {
            g.position.copy(start);
            forste.current = false;
        }
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        g.position.x = damp(g.position.x, mal.x, 1.6, dt);
        g.position.y = damp(g.position.y, mal.y, 1.6, dt);
        g.position.z = damp(g.position.z, mal.z, 1.6, dt);
        g.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    });
    return (
        <group ref={ref}>
            <mesh>
                <boxGeometry args={[2.4, 1.5, 0.08]} />
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, 0.35, 0.05]}>
                <boxGeometry args={[1.8, 0.18, 0.02]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-0.2, -0.1, 0.05]}>
                <boxGeometry args={[1.4, 0.12, 0.02]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
        </group>
    );
}

// ---------- Kamera ----------

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'sommer') {
        switch (beat) {
            case 0:
                return { pos: v(-6 + t * 0.15, 4.5, 15), se: v(0, 1.8, 0) };
            case 1:
                return { pos: v(1.5, 3.2, 8), se: v(2.4, 2, 0) };
            case 2:
                return { pos: v(1, 3, 6.5), se: v(2, 2, 0) };
            default:
                return { pos: v(-1, 4.6, 13), se: v(0.8, 2.6, 0.5) };
        }
    }
    if (modus === 'lonningsdag') {
        switch (beat) {
            case 0:
                return { pos: v(-1, 4.4, 15.5), se: v(0.4, 2.6, 0.5) };
            case 1:
                return { pos: v(-0.6, 4.2, 14.5), se: v(0.6, 2.6, 0.5) };
            default:
                return { pos: v(-1, 4.6, 15 + t * 0.1), se: v(0.2, 2.4, 0.5) };
        }
    }
    if (modus === 'trekk') {
        switch (beat) {
            case 0:
                return { pos: v(3, 4.5, 12), se: v(-1.6, 2.3, 0.5) };
            case 1:
                return { pos: v(8, 11, 15), se: v(-3, 2, -7) };
            default:
                return { pos: v(7, 9, 13), se: v(-2, 3, -5) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-3.5, 7, 16), se: v(-3.5, 2, -0.5) };
        case 1:
            return { pos: v(-3.5, 7, 17), se: v(-3.5, 4, -0.5) };
        default:
            return { pos: v(-3.5, 7, 17), se: v(-3.5, 4, -0.5) };
    }
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mal = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        se.current.lerp(mal.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Skilt({ tekst, tone }: { tekst: string; tone: 'rod' | 'gronn' | 'gull' | 'vanlig' }) {
    const farge = {
        rod: 'border-red-500 text-red-700',
        gronn: 'border-teal-500 text-teal-700',
        gull: 'border-amber-500 text-amber-700',
        vanlig: 'border-slate-300 text-slate-800',
    }[tone];
    return (
        <div
            className={`px-3 py-1 rounded-xl bg-white/95 shadow-lg border-2 font-bold whitespace-nowrap text-2xl ${farge}`}
        >
            {tekst}
        </div>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ida = v(KIOSK.x, 0.15, KIOSK.z + 0.5);
    const kortStart = modus === 'trekk' ? v(STATEN.x, 6, STATEN.z + 3) : v(KLES.x, 9, KLES.z + 2);
    const kortMal =
        modus === 'trekk'
            ? beat >= 2
                ? v(KIOSK.x + 1.4, 4.8, KIOSK.z + 1.6)
                : kortStart
            : beat >= 1
              ? v(KLES.x, 5.2, KLES.z + 1.8)
              : kortStart;
    return (
        <>
            <color attach="background" args={['#bae6fd']} />
            <fog attach="fog" args={['#bae6fd', 45, 110]} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[15, 30, 20]} intensity={1.5} color="#fff7e6" />
            <hemisphereLight args={['#e0f2fe', '#a16207', 0.4]} />

            {/* Sand og hav */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[140, 60]} />
                <meshStandardMaterial color="#f5deb3" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 40]}>
                <planeGeometry args={[200, 40]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0369a1" emissiveIntensity={0.3} />
            </mesh>
            {/* Parasoll på stranda */}
            {[
                [8, 9, '#f43f5e'],
                [-12, 11, '#22c55e'],
            ].map(([x, z, f]) => (
                <group key={String(x)} position={[x as number, 0, z as number]}>
                    <mesh position={[0, 1.2, 0]}>
                        <cylinderGeometry args={[0.07, 0.07, 2.4, 8]} />
                        <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                    <mesh position={[0, 2.5, 0]}>
                        <coneGeometry args={[1.6, 0.7, 12]} />
                        <meshStandardMaterial color={f as string} flatShading />
                    </mesh>
                </group>
            ))}

            <Kiosken pos={KIOSK} />
            <Person pos={ida} farge="#0d9488" />
            <Stabel modus={modus} beat={beat} playing={playing} />
            {modus === 'trekk' && (
                <>
                    <Staten pos={STATEN} />
                    <Myntstrom aktiv={beat === 1} playing={playing} />
                    <Kort mal={kortMal} start={kortStart} farge="#2563eb" playing={playing} />
                </>
            )}
            {modus === 'tojobber' && (
                <>
                    <Klesbutikken pos={KLES} />
                    <Kort mal={kortMal} start={kortStart} farge="#0d9488" playing={playing} />
                </>
            )}

            {/* Merkelapper */}
            {modus === 'sommer' && beat === 0 && (
                <Html position={[0, 4.4, 1]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Kiosken" tone="vanlig" />
                </Html>
            )}
            {modus === 'sommer' && beat >= 3 && (
                <Html
                    position={[STABEL.x, MYNTER * MYNT_H + 0.9, STABEL.z]}
                    center
                    zIndexRange={[10, 0]}
                >
                    <Skilt tekst="13 200 kr" tone="gull" />
                </Html>
            )}
            {modus === 'lonningsdag' && beat <= 1 && (
                <Html
                    position={[STABEL.x, MYNTER * MYNT_H + 0.9, STABEL.z]}
                    center
                    zIndexRange={[10, 0]}
                >
                    <Skilt tekst="Regnet med: 13 200 kr" tone="gull" />
                </Html>
            )}
            {modus === 'lonningsdag' && beat >= 2 && (
                <Html
                    position={[STABEL.x, (MYNTER / 2) * MYNT_H + 0.9, STABEL.z]}
                    center
                    zIndexRange={[10, 0]}
                >
                    <Skilt tekst="Fikk: 6 600 kr" tone="rod" />
                </Html>
            )}
            {modus === 'trekk' && beat === 0 && (
                <Html
                    position={[STABEL.x, MYNTER * MYNT_H + 0.9, STABEL.z]}
                    center
                    zIndexRange={[10, 0]}
                >
                    <Skilt tekst="Lønnen" tone="gull" />
                </Html>
            )}
            {modus === 'trekk' && beat >= 1 && (
                <>
                    {beat === 1 && (
                        <Html position={[STATEN.x, 1.4, STATEN.z + 4]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Staten" tone="vanlig" />
                        </Html>
                    )}
                    <Html
                        position={[KIOSK.x - 1.2, 0.6, KIOSK.z + 2.4]}
                        center
                        zIndexRange={[10, 0]}
                    >
                        <Skilt tekst="Kiosken" tone="vanlig" />
                    </Html>
                </>
            )}
            {modus === 'trekk' && beat >= 2 && (
                <Html position={[KIOSK.x + 1.4, 6.1, KIOSK.z + 1.6]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Skattekortet" tone="gronn" />
                </Html>
            )}
            {modus === 'tojobber' && (
                <>
                    <Html position={[KLES.x, 0.5, KLES.z + 2.6]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Klesbutikken (våren)" tone="vanlig" />
                    </Html>
                    <Html
                        position={[KIOSK.x + 0.4, 0.5, KIOSK.z + 2.6]}
                        center
                        zIndexRange={[10, 0]}
                    >
                        <Skilt tekst="Kiosken (sommeren)" tone="vanlig" />
                    </Html>
                </>
            )}
            {modus === 'tojobber' && beat >= 1 && (
                <Html position={[KLES.x + 3, 6.2, KLES.z + 1.8]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Frikort: 100 000 kr" tone="gronn" />
                </Html>
            )}
            {modus === 'tojobber' && beat >= 2 && (
                <Html position={[KIOSK.x + 0.4, 4.6, KIOSK.z + 1.4]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Frikort: 0 kr" tone="rod" />
                </Html>
            )}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

/** 80 ruter, én per time Ida jobber i juli. */
function Timerutene({ beat }: { beat: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl bg-white/95 shadow-xl p-4"
            style={{ width: 330 }}
        >
            <div className="text-xl font-bold text-slate-800 mb-2">80 timer i juli</div>
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                {Array.from({ length: 80 }, (_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.025 }}
                        className={`rounded-sm ${beat >= 2 && i === 0 ? 'bg-amber-400' : 'bg-teal-500'}`}
                        style={{ height: 22 }}
                    />
                ))}
            </div>
            {beat >= 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 text-2xl font-black text-amber-700"
                >
                    1 time = 165 kr
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-2xl font-black text-slate-900"
                >
                    80 × 165 = 13 200 kr
                </motion.div>
            )}
        </motion.div>
    );
}

/** Bank-appen på mobilen. */
function Mobil({ beat }: { beat: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] bg-slate-900 p-3 shadow-2xl"
            style={{ width: 230, height: 400 }}
        >
            <div className="h-full rounded-[1.5rem] bg-white flex flex-col items-center pt-8 px-4">
                <div className="text-lg font-bold text-slate-500">Brukskonto</div>
                <div className="mt-2 text-base text-slate-400">Lønn fra kiosken</div>
                <div
                    className="mt-6 text-4xl font-black tabular-nums"
                    style={{ color: beat >= 1 ? '#dc2626' : '#94a3b8' }}
                >
                    {beat >= 1 ? '6 600 kr' : '...'}
                </div>
                {beat >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-8 rounded-xl bg-red-50 border-2 border-red-400 px-3 py-2 text-xl font-bold text-red-700 text-center"
                    >
                        Regnet med <span className="whitespace-nowrap">13 200 kr</span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

export function LonnsslippenKiosk({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'sommer';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [-9, 5, 15] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '5%' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'sommer' && beat >= 1 && (
                <div className="absolute pointer-events-none" style={{ right: '4%', top: '20%' }}>
                    <Timerutene beat={beat} />
                </div>
            )}
            {modus === 'lonningsdag' && (
                <div className="absolute pointer-events-none" style={{ right: '6%', top: '18%' }}>
                    <Mobil beat={beat} />
                </div>
            )}
        </div>
    );
}
