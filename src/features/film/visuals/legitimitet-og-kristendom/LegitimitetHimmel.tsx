import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * 3D: himmelen over riket.
 * - sol: et tempel og en keiserstatue. Sola stiger (Sol Invictus), og de små
 *   helligdommene for de gamle gudene blekner.
 * - bro: den milviske bro over Tiberen i år 312. To hærer på hver sin side, ingen kamp.
 *   Et lyskors på himmelen, så natt og drøm, så Chi-Rho-tegnet på skjoldene. Til slutt
 *   forsvinner den andre hæren: Konstantin vant.
 */

type Modus = 'sol' | 'bro';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'sol') {
        switch (beat) {
            case 0:
                return { pos: v(0, 4, 30 - t * 0.2), se: v(4, 6, -20) };
            case 1:
                return { pos: v(-6, 3, 22), se: v(0, 15, -30) };
            case 2:
                return { pos: v(26 - t * 0.3, 16, 26), se: v(0, 2, -4) };
            case 3:
                return { pos: v(0, 3.5, 20), se: v(0, 10, -18) };
            default:
                return { pos: v(-18 + t * 0.3, 12, 22), se: v(0, 2, -6) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(34 - t * 0.3, 14, 26), se: v(0, 0, 0) };
        case 1:
            return { pos: v(0, 26, 44), se: v(0, 0, -2) };
        case 2:
            return { pos: v(0, 5, -40), se: v(0, 16, 10) };
        case 3:
            return { pos: v(-4, 4, -38), se: v(0, 14, 10) };
        default:
            return { pos: v(7, 3.2, -7 - t * 0.1), se: v(0, 1.2, -19) };
    }
}

export function LegitimitetHimmel({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'sol';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const merke = merkelapp(modus, beat);
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [20, 8, 30] }}>
                {modus === 'sol' ? (
                    <SolScene beat={beat} playing={playing} />
                ) : (
                    <BroScene beat={beat} playing={playing} />
                )}
            </Canvas>
            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={merke?.topp ? { top: '6%' } : { bottom: '7%' }}
            >
                <AnimatePresence mode="wait">
                    {merke && (
                        <motion.div
                            key={merke.tekst}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-6 py-3 rounded-2xl shadow-xl text-center whitespace-nowrap"
                            style={{
                                background: merke.mork ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.93)',
                                color: merke.mork ? '#fde68a' : '#0f172a',
                            }}
                        >
                            <div className="font-display font-bold text-3xl">{merke.tekst}</div>
                            {merke.under && <div className="text-xl font-semibold opacity-80 mt-0.5">{merke.under}</div>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function merkelapp(modus: Modus, beat: number): { tekst: string; under?: string; mork?: boolean; topp?: boolean } | null {
    if (modus === 'sol') {
        return [
            { tekst: 'Keiser Aurelian, 270-275' },
            { tekst: 'Sol Invictus', under: 'den uovervinnelige sol skal binde riket sammen' },
            { tekst: 'Fra Syria, på 200-tallet', under: 'en av de mest populære kultene i riket' },
            { tekst: 'Én sol på himmelen, én keiser på jorden' },
            { tekst: 'De gamle gudene blekner', under: 'et steg mot troen på én gud' },
        ][Math.min(beat, 4)];
    }
    return [
        { tekst: 'Den milviske bro, år 312' },
        { tekst: 'Konstantin (rød) mot Maxentius (grå)', under: 'hvem skal styre den vestlige delen av riket?' },
        { tekst: 'I dette tegn skal du seire', under: 'slik Evsebios forteller det', mork: true, topp: true },
        { tekst: 'Et kristent tegn i en drøm', under: 'slik Lactantius forteller det', mork: true, topp: true },
        { tekst: 'Tegnet på skjoldene', under: 'og Konstantin vant' },
    ][Math.min(beat, 4)];
}

/** Kameraet glir mot målet for beaten. Første bilde hopper rett dit. */
function useBeatKamera(modus: Modus, beat: number, playing: boolean) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return beatTid;
}

/* ---------------- Sol ---------------- */

const HIMMEL_DAGGRY = new THREE.Color('#f6b98a');
const HIMMEL_DAG = new THREE.Color('#9cc8ea');

function SolScene({ beat, playing }: { beat: number; playing: boolean }) {
    useBeatKamera('sol', beat, playing);
    const sol = useRef<THREE.Group>(null);
    const straler = useRef<THREE.Group>(null);
    const himmel = useRef<THREE.Color>(null);
    const tåke = useRef<THREE.Fog>(null);
    const gamle = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const forste = useRef(true);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const k = forste.current ? 1 : 1 - Math.exp(-1.2 * dt);
        forste.current = false;
        const målY = beat === 0 ? 9 : 24;
        const målX = beat === 0 ? 22 : 0;
        if (sol.current) {
            sol.current.position.y = THREE.MathUtils.lerp(sol.current.position.y, målY, k);
            sol.current.position.x = THREE.MathUtils.lerp(sol.current.position.x, målX, k);
        }
        if (straler.current) straler.current.rotation.z += dt * 0.15;
        const farge = beat === 0 ? HIMMEL_DAGGRY : HIMMEL_DAG;
        if (himmel.current) himmel.current.lerp(farge, k);
        if (tåke.current) tåke.current.color.lerp(farge, k);
        const blek = beat >= 4 ? 0.15 : 1;
        gamle.current.forEach((m) => {
            if (!m) return;
            m.opacity = THREE.MathUtils.lerp(m.opacity, blek, k * 0.6 + (k === 1 ? 0.4 : 0));
        });
    });

    const helligdommer = useMemo(
        () =>
            Array.from({ length: 10 }, (_, i) => {
                const a = -1.2 + (i / 9) * 2.4;
                const r = 16 + (i % 3) * 3;
                return {
                    pos: [Math.sin(a) * r, 0, -4 + Math.cos(a) * r * 0.6 - 2] as [number, number, number],
                    farge: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa'][i % 5],
                };
            }),
        []
    );

    return (
        <>
            <color ref={himmel} attach="background" args={['#9cc8ea']} />
            <fog ref={tåke} attach="fog" args={['#9cc8ea', 40, 140]} />
            <hemisphereLight args={['#fff7ed', '#a8a29e', 1.1]} />
            <directionalLight position={[10, 20, 10]} intensity={1.4} />

            {/* Bakken */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[120, 48]} />
                <meshStandardMaterial color="#d9c7a0" roughness={1} />
            </mesh>
            {/* Åser i bakgrunnen */}
            {[-40, -15, 15, 42].map((x, i) => (
                <mesh key={x} position={[x, 0, -70]} scale={[22, 8 + (i % 2) * 5, 10]}>
                    <sphereGeometry args={[1, 16, 10]} />
                    <meshStandardMaterial color="#b8a77d" flatShading />
                </mesh>
            ))}

            <Tempel />

            {/* Keiserstatuen foran tempelet */}
            <group position={[0, 0, 4]}>
                <mesh position={[0, 1, 0]}>
                    <boxGeometry args={[2.4, 2, 2.4]} />
                    <meshStandardMaterial color="#e7e5e4" />
                </mesh>
                <mesh position={[0, 3.6, 0]}>
                    <cylinderGeometry args={[0.55, 0.85, 3.2, 10]} />
                    <meshStandardMaterial color="#7e22ce" flatShading />
                </mesh>
                <mesh position={[0, 5.6, 0]}>
                    <sphereGeometry args={[0.55, 14, 10]} />
                    <meshStandardMaterial color="#f2c9a0" />
                </mesh>
                <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.5, 0.1, 6, 20]} />
                    <meshStandardMaterial color="#facc15" emissive="#b45309" emissiveIntensity={0.4} />
                </mesh>
            </group>

            {/* De gamle gudenes små helligdommer */}
            {helligdommer.map((h, i) => (
                <group key={i} position={h.pos}>
                    <mesh position={[0, 0.8, 0]}>
                        <boxGeometry args={[1.6, 1.6, 1.6]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                gamle.current[i] = m;
                            }}
                            color={h.farge}
                            transparent
                            opacity={1}
                        />
                    </mesh>
                    <mesh position={[0, 2, 0]}>
                        <coneGeometry args={[1.3, 0.9, 4]} />
                        <meshStandardMaterial color="#e7e5e4" />
                    </mesh>
                </group>
            ))}

            {/* Sola */}
            <group ref={sol} position={[0, 20, -60]}>
                <mesh>
                    <sphereGeometry args={[6, 32, 20]} />
                    <meshBasicMaterial color="#fde047" fog={false} />
                </mesh>
                <mesh>
                    <sphereGeometry args={[8.5, 32, 20]} />
                    <meshBasicMaterial color="#fef08a" transparent opacity={0.35} fog={false} />
                </mesh>
                <group ref={straler}>
                    {Array.from({ length: 12 }, (_, i) => {
                        const a = (i / 12) * Math.PI * 2;
                        return (
                            <mesh key={i} position={[Math.cos(a) * 11, Math.sin(a) * 11, 0]} rotation={[0, 0, a]}>
                                <boxGeometry args={[4, 0.6, 0.1]} />
                                <meshBasicMaterial color="#facc15" fog={false} />
                            </mesh>
                        );
                    })}
                </group>
            </group>
        </>
    );
}

function Tempel() {
    const tak = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-7, 0);
        s.lineTo(7, 0);
        s.lineTo(0, 2.6);
        s.closePath();
        return new THREE.ExtrudeGeometry(s, { depth: 9, bevelEnabled: false });
    }, []);
    return (
        <group position={[0, 0, -8]}>
            <mesh position={[0, 0.75, 0]}>
                <boxGeometry args={[14, 1.5, 9]} />
                <meshStandardMaterial color="#e7e0d0" />
            </mesh>
            {Array.from({ length: 6 }, (_, i) => (
                <mesh key={i} position={[-5.5 + i * 2.2, 4.5, 3.6]}>
                    <cylinderGeometry args={[0.45, 0.5, 6, 12]} />
                    <meshStandardMaterial color="#f5f0e6" />
                </mesh>
            ))}
            <mesh position={[0, 4.5, -1]}>
                <boxGeometry args={[11, 6, 6]} />
                <meshStandardMaterial color="#e4dccb" />
            </mesh>
            <mesh position={[0, 8, 0]}>
                <boxGeometry args={[14, 1, 9]} />
                <meshStandardMaterial color="#ede6d6" />
            </mesh>
            <mesh geometry={tak} position={[0, 8.5, -4.5]}>
                <meshStandardMaterial color="#d6cdb8" flatShading />
            </mesh>
            {/* Solskive på gavlen */}
            <mesh position={[0, 9.5, 4.6]}>
                <circleGeometry args={[0.8, 20]} />
                <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={0.6} />
            </mesh>
        </group>
    );
}

/* ---------------- Broa ---------------- */

const DAG = new THREE.Color('#a9cbe4');
const NATT = new THREE.Color('#1e293b');

function lagChiRho() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d');
    if (g) {
        g.clearRect(0, 0, 128, 128);
        g.strokeStyle = '#fde68a';
        g.lineWidth = 12;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(64, 14);
        g.lineTo(64, 114);
        g.moveTo(64, 14);
        g.bezierCurveTo(108, 14, 108, 62, 64, 58);
        g.moveTo(30, 44);
        g.lineTo(98, 104);
        g.moveTo(98, 44);
        g.lineTo(30, 104);
        g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

const RADER = 5;
const PER_RAD = 16;
const N_SKJOLD = RADER * PER_RAD;

function BroScene({ beat, playing }: { beat: number; playing: boolean }) {
    useBeatKamera('bro', beat, playing);
    const himmel = useRef<THREE.Color>(null);
    const tåke = useRef<THREE.Fog>(null);
    const kors = useRef<THREE.Group>(null);
    const korsMat = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
    const drøm = useRef<THREE.MeshBasicMaterial>(null);
    const tegnMat = useRef<THREE.MeshBasicMaterial>(null);
    const fiendeMat = useRef<THREE.MeshStandardMaterial>(null);
    const hemi = useRef<THREE.HemisphereLight>(null);
    const forste = useRef(true);
    const tid = useRef(0);

    const chiRho = useMemo(() => lagChiRho(), []);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const k = forste.current ? 1 : 1 - Math.exp(-1.4 * dt);
        forste.current = false;
        const natt = beat === 3;
        const farge = natt ? NATT : DAG;
        if (himmel.current) himmel.current.lerp(farge, k);
        if (tåke.current) tåke.current.color.lerp(farge, k);
        if (hemi.current) hemi.current.intensity = damp(hemi.current.intensity, natt ? 0.35 : 1.1, 1.4, k === 1 ? 100 : dt);
        const korsSynlig = beat === 2 ? 1 : 0;
        korsMat.current.forEach((m) => {
            if (m) m.opacity = THREE.MathUtils.lerp(m.opacity, korsSynlig, k);
        });
        if (kors.current) kors.current.scale.setScalar(1 + Math.sin(tid.current * 1.5) * 0.03);
        if (drøm.current) drøm.current.opacity = THREE.MathUtils.lerp(drøm.current.opacity, natt ? 0.95 : 0, k);
        if (tegnMat.current) tegnMat.current.opacity = THREE.MathUtils.lerp(tegnMat.current.opacity, beat >= 4 ? 1 : 0, k);
        if (fiendeMat.current) {
            const o = beat >= 4 ? 0 : 1;
            fiendeMat.current.opacity = THREE.MathUtils.lerp(fiendeMat.current.opacity, o, k * 0.5 + (k === 1 ? 0.5 : 0));
            fiendeMat.current.visible = fiendeMat.current.opacity > 0.02;
        }
    });

    return (
        <>
            <color ref={himmel} attach="background" args={['#a9cbe4']} />
            <fog ref={tåke} attach="fog" args={['#a9cbe4', 50, 160]} />
            <hemisphereLight ref={hemi} args={['#f8fafc', '#78716c', 1.1]} />
            <directionalLight position={[-12, 22, -8]} intensity={1.2} />

            {/* Bakken på begge sider */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[220, 220]} />
                <meshStandardMaterial color="#9fb27a" roughness={1} />
            </mesh>
            {/* Elva Tiberen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[220, 12]} />
                <meshStandardMaterial color="#5b8fb8" emissive="#1e3a5f" emissiveIntensity={0.35} />
            </mesh>

            <Bro />

            {/* Konstantins hær, nord for elva, med skjoldene mot elva */}
            <Skjoldvegg z0={-14} retning={1} farge="#b91c1c" />
            <Skjoldtegn z0={-14} tekstur={chiRho} matRef={tegnMat} />
            {/* Maxentius' hær, sør for elva */}
            <Skjoldvegg z0={14} retning={-1} farge="#475569" matRef={fiendeMat} />

            {/* Lyskorset på himmelen */}
            <group ref={kors} position={[0, 26, 18]}>
                {[
                    [0, 0, 1.4, 14],
                    [0, 3, 9, 1.4],
                ].map(([x, y, b, h], i) => (
                    <mesh key={i} position={[x, y, 0]}>
                        <planeGeometry args={[b, h]} />
                        <meshBasicMaterial
                            ref={(m) => {
                                korsMat.current[i] = m;
                            }}
                            color="#fff7cc"
                            transparent
                            opacity={0}
                            fog={false}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                ))}
            </group>

            {/* Drømmen: tegnet gløder svakt på nattehimmelen */}
            <mesh position={[0, 20, 14]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshBasicMaterial ref={drøm} map={chiRho} transparent opacity={0} fog={false} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
        </>
    );
}

function Bro() {
    return (
        <group>
            {/* Brodekket går over elva langs z */}
            <mesh position={[0, 2.4, 0]}>
                <boxGeometry args={[4, 0.6, 20]} />
                <meshStandardMaterial color="#cbbfa4" flatShading />
            </mesh>
            {[-6, -2, 2, 6].map((z) => (
                <mesh key={z} position={[0, 1.1, z]}>
                    <boxGeometry args={[4.2, 2.2, 1]} />
                    <meshStandardMaterial color="#b8ab8f" flatShading />
                </mesh>
            ))}
            {[-4, 0, 4].map((z) => (
                <mesh key={z} position={[0, 1.6, z]} rotation={[0, Math.PI / 2, 0]}>
                    <torusGeometry args={[1.5, 0.35, 6, 16, Math.PI]} />
                    <meshStandardMaterial color="#b8ab8f" flatShading />
                </mesh>
            ))}
            {/* Rekkverk */}
            {[-1.9, 1.9].map((x) => (
                <mesh key={x} position={[x, 3, 0]}>
                    <boxGeometry args={[0.25, 0.7, 20]} />
                    <meshStandardMaterial color="#a89a7c" />
                </mesh>
            ))}
        </group>
    );
}

function skjoldPos(i: number, z0: number, retning: number) {
    const r = Math.floor(i / PER_RAD);
    const k = i % PER_RAD;
    const x = -18 + k * 2.4 + (k >= PER_RAD / 2 ? 6 : 0) - 3;
    const z = z0 - retning * r * 2.2;
    return { x, z };
}

function Skjoldvegg({
    z0,
    retning,
    farge,
    matRef,
}: {
    z0: number;
    retning: number;
    farge: string;
    matRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const ferdig = useRef(false);
    useFrame(() => {
        const m = ref.current;
        if (!m || ferdig.current) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < N_SKJOLD; i++) {
            const { x, z } = skjoldPos(i, z0, retning);
            o.position.set(x, 1.1, z);
            o.rotation.set(0, 0, 0);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
        ferdig.current = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N_SKJOLD]} frustumCulled={false}>
            <boxGeometry args={[1.6, 2, 0.25]} />
            <meshStandardMaterial ref={matRef} color={farge} transparent opacity={1} />
        </instancedMesh>
    );
}

function Skjoldtegn({
    z0,
    tekstur,
    matRef,
}: {
    z0: number;
    tekstur: THREE.Texture;
    matRef: React.RefObject<THREE.MeshBasicMaterial | null>;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const ferdig = useRef(false);
    useFrame(() => {
        const m = ref.current;
        if (!m || ferdig.current) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < N_SKJOLD; i++) {
            const { x, z } = skjoldPos(i, z0, 1);
            o.position.set(x, 1.15, z + 0.14);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
        ferdig.current = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N_SKJOLD]} frustumCulled={false}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshBasicMaterial ref={matRef} map={tekstur} transparent opacity={0} depthWrite={false} />
        </instancedMesh>
    );
}
