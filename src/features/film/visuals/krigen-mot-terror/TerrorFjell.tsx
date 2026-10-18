import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Afghanistan som et brettspill i 3D: Kabul midt på brettet, fjellene ved Tora Bora i øst og
 * grensen til Pakistan bak dem. Soldatene er spillbrikker, ingen kamp vises.
 * «invasjon» (2001): blå brikker rykker inn, flagget i Kabul skifter, og en brikke for bin Laden
 * glir opp i fjellene og over grensen.
 * «kabul» (2021): et transportfly letter fra flyplassen, de blå brikkene forsvinner, og Taliban
 * marsjerer inn igjen. Flagget er tilbake der det startet.
 */

type Modus = 'invasjon' | 'kabul';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const GRENSE_X = 44;
const TORA_BORA = v(32, 0, 4);

const FJELL = Array.from({ length: 20 }, (_, i) => {
    // Et belte nord for Kabul og en klynge ved Tora Bora, nær grensen.
    const ved = i >= 11;
    const x = ved ? 26 + frø(i) * 14 : -36 + i * 7 + frø(i) * 3;
    const z = ved ? -10 + frø(i + 40) * 22 : -24 - frø(i + 20) * 10;
    const h = 7 + frø(i + 60) * 8;
    return { x, z, r: 4 + frø(i + 80) * 4, h };
}).filter((f) => Math.hypot(f.x - TORA_BORA.x, f.z - TORA_BORA.z) > 4.5);

function kamera(modus: Modus, beat: number, t: number) {
    if (modus === 'invasjon') {
        switch (beat) {
            case 0:
                return { pos: v(-46 + Math.min(t, 8) * 1.2, 16, 30), se: v(-18, 0, 0) };
            case 1:
                return { pos: v(-9, 9, 17), se: v(0, 2.5, 0) };
            case 2:
                return { pos: v(-16, 14, 24), se: v(0, 1, 0) };
            case 3:
                return { pos: v(8, 18, 36), se: v(28, 3, 0) };
            default:
                return { pos: v(26, 24, 44), se: v(42, 2, -2) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-32, 9, 34), se: v(2, 2, 13) };
        case 1:
            return { pos: v(-20, 6, 28), se: v(-8, 1, 14) };
        case 2:
            return { pos: v(22, 13, 24), se: v(4, 1, 0) };
        case 3:
            return { pos: v(-7, 7, 13), se: v(0, 4.5, 0) };
        default:
            return { pos: v(-30, 32, 52), se: v(6, 0, 0) };
    }
}

/** Hvor lenge beaten har vart, så alt kan regnes ut fra (beat, tid). */
function useBeatTid(beat: number, playing: boolean) {
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
    });
    return tid;
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const tid = useBeatTid(beat, playing);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const m = kamera(modus, beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Byen() {
    const ref = useRef<THREE.InstancedMesh>(null);
    const hus = useMemo(
        () =>
            Array.from({ length: 70 }, (_, i) => {
                const vinkel = frø(i) * Math.PI * 2;
                const r = 2 + Math.sqrt(frø(i + 9)) * 8;
                return {
                    x: Math.cos(vinkel) * r,
                    z: Math.sin(vinkel) * r * 0.8,
                    h: 0.6 + frø(i + 3) * 1.6,
                    s: 0.9 + frø(i + 5) * 0.8,
                    farge: new THREE.Color(frø(i + 7) > 0.5 ? '#f5efe0' : '#d9c7a3'),
                };
            }),
        []
    );
    useFrame(() => {
        const m = ref.current;
        if (!m || m.userData.ferdig) return;
        const o = new THREE.Object3D();
        hus.forEach((h, i) => {
            o.position.set(h.x, h.h / 2, h.z);
            o.scale.set(h.s, h.h, h.s);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            m.setColorAt(i, h.farge);
        });
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
        m.userData.ferdig = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, hus.length]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial flatShading />
        </instancedMesh>
    );
}

/** Flagget i Kabul: hvitt for Taliban, blått når USA har kontroll. */
function Flagg({ blatt, playing }: { blatt: boolean; playing: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const duk = useRef<THREE.Mesh>(null);
    const hvit = useMemo(() => new THREE.Color('#f8fafc'), []);
    const bla = useMemo(() => new THREE.Color('#2563eb'), []);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        if (mat.current) mat.current.color.lerp(blatt ? bla : hvit, 1 - Math.exp(-2.5 * (dt || 0.016)));
        if (duk.current) duk.current.rotation.y = Math.sin(tid.current * 2) * 0.12;
    });
    return (
        <group position={[0, 0, 0]}>
            <mesh position={[0, 3.5, 0]}>
                <cylinderGeometry args={[0.1, 0.12, 7, 8]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh ref={duk} position={[1.3, 6.2, 0]}>
                <boxGeometry args={[2.6, 1.5, 0.08]} />
                <meshStandardMaterial ref={mat} color="#f8fafc" side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

/** En spillbrikke: sokkel og hode. */
function Brikke({ farge, topp }: { farge: string; topp: string }) {
    return (
        <>
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.35, 0.55, 1.1, 10]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 1.35, 0]}>
                <sphereGeometry args={[0.36, 12, 10]} />
                <meshStandardMaterial color={topp} flatShading />
            </mesh>
        </>
    );
}

const BLA = Array.from({ length: 8 }, (_, i) => ({ dz: (i % 4) * 2.2 - 3.3, dx: Math.floor(i / 4) * 2 }));
const SVARTE = Array.from({ length: 7 }, (_, i) => ({ dz: (i % 4) * 2 - 3, dx: Math.floor(i / 4) * 2 }));

/** Blå brikker: USA og de allierte. */
function BlaBrikker({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const tid = useBeatTid(beat, playing);
    const grupper = useRef<(THREE.Group | null)[]>([]);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const t = tid.current;
        grupper.current.forEach((g, i) => {
            if (!g) return;
            const b = BLA[i];
            let x: number;
            let synlig = 1;
            if (modus === 'invasjon') {
                if (beat === 0) x = -40 + Math.min(t, 8) * 3;
                else if (beat === 1) x = -14;
                else x = -8;
            } else {
                // 2021: brikkene går mot flyplassen og forsvinner.
                x = beat === 0 ? -8 - Math.min(t, 5) * 1.6 : -16;
                synlig = beat === 0 ? Math.max(0, 1 - Math.max(0, t - 3 - i * 0.25) * 0.8) : 0;
            }
            const mx = x + b.dx;
            const mz = (modus === 'kabul' ? 9 : 0) + b.dz;
            g.position.x = forste.current ? mx : damp(g.position.x, mx, 2.5, dt);
            g.position.z = forste.current ? mz : damp(g.position.z, mz, 2.5, dt);
            const s = forste.current ? synlig : damp(g.scale.x, synlig, 4, dt);
            g.scale.setScalar(Math.max(s, 0.001));
            g.visible = s > 0.02;
        });
        forste.current = false;
    });
    return (
        <>
            {BLA.map((_, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        grupper.current[i] = g;
                    }}
                    position={[-40, 0, 0]}
                >
                    <Brikke farge="#2563eb" topp="#93c5fd" />
                </group>
            ))}
        </>
    );
}

/** Mørke brikker: Taliban. Forsvinner i 2001, kommer tilbake i 2021. */
function SvarteBrikker({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const tid = useBeatTid(beat, playing);
    const grupper = useRef<(THREE.Group | null)[]>([]);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const t = tid.current;
        grupper.current.forEach((g, i) => {
            if (!g) return;
            const b = SVARTE[i];
            let x = 4;
            let synlig = 1;
            if (modus === 'invasjon') {
                synlig = beat <= 1 ? 1 : 0;
            } else if (beat <= 1) {
                x = 34;
                synlig = 0;
            } else if (beat === 2) {
                x = 30 - Math.min(t, 7) * 3.7;
            }
            const mz = b.dz + 2;
            const mx = x + b.dx;
            g.position.x = forste.current ? mx : damp(g.position.x, mx, 2.5, dt);
            g.position.z = mz;
            const s = forste.current ? synlig : damp(g.scale.x, synlig, 3, dt);
            g.scale.setScalar(Math.max(s, 0.001));
            g.visible = s > 0.02;
        });
        forste.current = false;
    });
    return (
        <>
            {SVARTE.map((_, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        grupper.current[i] = g;
                    }}
                    position={[4, 0, 0]}
                >
                    <Brikke farge="#292524" topp="#f5f5f4" />
                </group>
            ))}
        </>
    );
}

/** Bin Laden som en oransje brikke: fra Kabul til Tora Bora (beat 3), over grensen (beat 4). */
function Flyktning({ beat, playing }: { beat: number; playing: boolean }) {
    const tid = useBeatTid(beat, playing);
    const g = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const gr = g.current;
        if (!gr) return;
        const t = tid.current;
        let mål = v(5, 0, 1);
        let synlig = beat >= 3 ? 1 : 0;
        if (beat === 3) mål = v(5, 0, 1).lerp(TORA_BORA, Math.min(1, t / 6));
        if (beat >= 4) {
            mål = TORA_BORA.clone().lerp(v(54, 0, -2), Math.min(1, t / 5));
            synlig = t > 7 ? 0 : 1;
        }
        if (forste.current) gr.position.copy(mål);
        else gr.position.lerp(mål, 1 - Math.exp(-3 * dt));
        const s = forste.current ? synlig : damp(gr.scale.x, synlig, 3, dt);
        gr.scale.setScalar(Math.max(s, 0.001));
        gr.visible = s > 0.02;
        forste.current = false;
    });
    return (
        <group ref={g} position={[5, 0, 1]} scale={0.001}>
            <Brikke farge="#ea580c" topp="#fed7aa" />
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1.1, 24]} />
                <meshBasicMaterial color="#ea580c" />
            </mesh>
        </group>
    );
}

/** Flyplassen og transportflyet som letter i 2021. */
function Flyplass({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const tid = useBeatTid(beat, playing);
    const fly = useRef<THREE.Group>(null);
    const folk = useRef<THREE.InstancedMesh>(null);
    const forste = useRef(true);
    const plasser = useMemo(
        () =>
            Array.from({ length: 36 }, (_, i) => ({
                x: -14 + frø(i + 100) * 9,
                z: 16.5 + frø(i + 200) * 3,
            })),
        []
    );
    const skala = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const t = tid.current;
        const f = fly.current;
        if (f) {
            let x = -16;
            let y = 0;
            if (modus === 'kabul' && beat <= 1) {
                // Flyet ruller, letter og forsvinner i disen. Beat 1: neste fly gjør det samme.
                const start = beat === 0 ? 1.5 : 4;
                const s = Math.max(0, t - start);
                x = -16 + s * s * 1.4;
                y = Math.max(0, (x + 2) * 0.22);
            }
            if (modus === 'kabul' && beat >= 2) {
                x = 120;
                y = 30;
            }
            f.position.set(x, y + 0.9, 14);
            f.rotation.z = y > 0 ? 0.2 : 0;
            f.visible = modus === 'kabul' && x < 90;
        }
        const m = folk.current;
        if (m) {
            const mål = modus === 'kabul' && beat === 1 ? 1 : 0;
            skala.current = forste.current ? mål : damp(skala.current, mål, 3, dt || 0.016);
            const o = new THREE.Object3D();
            plasser.forEach((p, i) => {
                o.position.set(p.x, 0.4 * skala.current, p.z);
                o.scale.setScalar(Math.max(skala.current, 0.001));
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
            });
            m.instanceMatrix.needsUpdate = true;
            m.visible = skala.current > 0.02;
        }
        forste.current = false;
    });
    return (
        <>
            <mesh position={[4, 0.03, 14]}>
                <boxGeometry args={[46, 0.06, 3.2]} />
                <meshStandardMaterial color="#57534e" />
            </mesh>
            {[-14, -6, 2, 10, 18].map((x) => (
                <mesh key={x} position={[x, 0.07, 14]}>
                    <boxGeometry args={[2.4, 0.02, 0.25]} />
                    <meshBasicMaterial color="#f8fafc" />
                </mesh>
            ))}
            <group ref={fly} position={[-16, 0.9, 14]} visible={modus === 'kabul'}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.8, 0.8, 9, 12]} />
                    <meshStandardMaterial color="#64748b" flatShading />
                </mesh>
                <mesh position={[4.9, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.8, 1.4, 12]} />
                    <meshStandardMaterial color="#64748b" flatShading />
                </mesh>
                <mesh position={[0.4, 0.7, 0]}>
                    <boxGeometry args={[2.2, 0.18, 12]} />
                    <meshStandardMaterial color="#475569" flatShading />
                </mesh>
                <mesh position={[-4, 1.4, 0]}>
                    <boxGeometry args={[1.4, 2, 0.2]} />
                    <meshStandardMaterial color="#475569" flatShading />
                </mesh>
            </group>
            <instancedMesh ref={folk} args={[undefined, undefined, plasser.length]}>
                <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
                <meshStandardMaterial color="#78716c" />
            </instancedMesh>
        </>
    );
}

function Fjellene() {
    return (
        <>
            {FJELL.map((f, i) => (
                <group key={i} position={[f.x, 0, f.z]}>
                    <mesh position={[0, f.h / 2, 0]}>
                        <coneGeometry args={[f.r, f.h, 6]} />
                        <meshStandardMaterial color="#a8a29e" flatShading />
                    </mesh>
                    {f.h > 10 && (
                        <mesh position={[0, f.h * 0.86, 0]}>
                            <coneGeometry args={[f.r * 0.29, f.h * 0.29, 6]} />
                            <meshStandardMaterial color="#f8fafc" flatShading />
                        </mesh>
                    )}
                </group>
            ))}
        </>
    );
}

/** Grensen til Pakistan: en rekke røde staker. */
function Grensen() {
    const ref = useRef<THREE.InstancedMesh>(null);
    const n = 30;
    useFrame(() => {
        const m = ref.current;
        if (!m || m.userData.ferdig) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < n; i++) {
            o.position.set(GRENSE_X, 0.6, -36 + i * 2.4);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
        m.userData.ferdig = true;
    });
    return (
        <>
            <instancedMesh ref={ref} args={[undefined, undefined, n]}>
                <boxGeometry args={[0.35, 1.2, 0.35]} />
                <meshStandardMaterial color="#dc2626" />
            </instancedMesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GRENSE_X + 25, 0.02, 0]}>
                <planeGeometry args={[50, 90]} />
                <meshStandardMaterial color="#c9b58c" />
            </mesh>
        </>
    );
}

function Merke({ pos, tekst, farge = '#0f172a' }: { pos: [number, number, number]; tekst: string; farge?: string }) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div
                className="px-3 py-1 rounded-lg bg-white/95 shadow-lg text-lg font-black whitespace-nowrap"
                style={{ color: farge }}
            >
                {tekst}
            </div>
        </Html>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const blatt = modus === 'invasjon' ? beat >= 2 : beat <= 1;
    const visTora = modus === 'invasjon' && beat >= 3;
    return (
        <>
            <color attach="background" args={['#cfe0ee']} />
            <fog attach="fog" args={['#cfe0ee', 50, 130]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#ffffff', '#a16207', 0.5]} />
            <directionalLight position={[15, 30, 20]} intensity={1.4} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[180, 140]} />
                <meshStandardMaterial color="#dcc59a" />
            </mesh>
            <Fjellene />
            <Grensen />
            <Byen />
            <Flagg blatt={blatt} playing={playing} />
            <Flyplass modus={modus} beat={beat} playing={playing} />
            <BlaBrikker modus={modus} beat={beat} playing={playing} />
            <SvarteBrikker modus={modus} beat={beat} playing={playing} />
            {modus === 'invasjon' && <Flyktning beat={beat} playing={playing} />}
            {/* Kabul-merket skjules når kameraet står så nær at det havner under overskriften (beat 1),
                og når kameraet er ved Tora Bora og byen ligger i bildekanten (beat 3-4). */}
            {(modus === 'kabul' ? beat !== 4 && beat !== 1 : beat === 0 || beat === 2) && (
                <Merke pos={[0, 8.2, 0]} tekst="Kabul" />
            )}
            {visTora && <Merke pos={[TORA_BORA.x, 6, TORA_BORA.z]} tekst="Tora Bora" farge="#9a3412" />}
            {(visTora || (modus === 'kabul' && beat === 4)) && (
                <Merke pos={[GRENSE_X + 8, 2.5, -6]} tekst="Pakistan" farge="#166534" />
            )}
        </>
    );
}

const MERKELAPPER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    invasjon: [
        { tekst: 'Oktober 2001: USA og allierte går inn' },
        { tekst: 'Mål: fjerne Taliban, ta bin Laden' },
        { tekst: 'Desember: USA kontrollerer Kabul' },
        { tekst: 'Bin Laden flykter til Tora Bora', rod: true },
        { tekst: 'Funnet i Pakistan, 2011' },
    ],
    kabul: [
        { tekst: 'August 2021: de siste soldatene drar' },
        { tekst: 'Desperate mennesker på flyplassen' },
        { tekst: 'Taliban marsjerer inn uten kamp', rod: true },
        { tekst: 'Taliban: 1996, 2001, 2021' },
        { tekst: 'Tilbake til start', rod: true },
    ],
};

export function TerrorFjell({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'invasjon';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const lapper = MERKELAPPER[modus];
    const lapp = lapper[Math.min(beat, lapper.length - 1)];
    const start = kamera(modus, beat, 0).pos;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 300, position: [start.x, start.y, start.z] }}
            >
                <Kamera modus={modus} beat={beat} playing={playing} />
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        lapp.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {lapp.tekst}
                </motion.div>
            </AnimatePresence>
            {modus === 'kabul' && beat === 3 && <Aarstall />}
            {modus === 'kabul' && beat === 4 && <Prislapper />}
        </div>
    );
}

/** Tre årstall som tennes etter hverandre: Taliban styrer, jages, og kommer tilbake. */
function Aarstall() {
    const steg = [
        { aar: '1996', tekst: 'Taliban styrer', farge: 'bg-stone-800' },
        { aar: '2001', tekst: 'Taliban jages', farge: 'bg-blue-600' },
        { aar: '2021', tekst: 'Taliban er tilbake', farge: 'bg-stone-800' },
    ];
    return (
        <div className="absolute bottom-[7%] left-1/2 -translate-x-1/2 flex items-center gap-3">
            {steg.map((s, i) => (
                <motion.div
                    key={s.aar}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.9 }}
                    className="flex items-center gap-3"
                >
                    {i > 0 && <span className="text-3xl font-black text-slate-700">→</span>}
                    <div className={`${s.farge} text-white rounded-2xl shadow-xl px-5 py-2 text-center`}>
                        <div className="text-3xl font-black">{s.aar}</div>
                        <div className="text-base font-semibold opacity-90">{s.tekst}</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

/** Det krigen i Afghanistan kostet, som tre brikker nederst. */
function Prislapper() {
    const lapper = ['20 år', 'Over 2300 milliarder dollar', 'Tusenvis av liv'];
    return (
        <div className="absolute bottom-[7%] left-1/2 -translate-x-1/2 flex gap-3">
            {lapper.map((l, i) => (
                <motion.div
                    key={l}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.8 }}
                    className="bg-white/95 rounded-2xl shadow-xl px-5 py-2 text-2xl font-black text-slate-900 whitespace-nowrap"
                >
                    {l}
                </motion.div>
            ))}
        </div>
    );
}
