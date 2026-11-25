import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';
import { frø, v } from './felles';

/**
 * Hajj i 3D. Kaba står midt på en stor, lys plass, og mengden går rundt den mot klokka.
 * Til siden ligger de to haugene al-Safa og al-Marwa med 385 meter gang mellom seg, langt
 * borte Mina med tre søyler, og enda lenger ut Arafat-sletten med en liten høyde.
 * Avstandene mellom stedene er ikke i målestokk; Kaba og gangen mellom haugene er det.
 *
 * «aapning»: mengden rundt Kaba om kvelden.
 * «hajj»: plikten, Kaba på nært hold, tawaf med én pilegrim som går sju runder, haugene.
 * «arafat»: sletten fra middag til solnedgang, Mina, umra ved Kaba, og Mekka sett ovenfra.
 */

type Modus = 'aapning' | 'hajj' | 'arafat';

const SAFA_X = 150;
const HALV_GANG = 192.5; // 385 meter mellom haugene
const MINA_X = -420;
const ARAFAT_X = -900;
const TAWAF_R = 17;
const RUNDE_SEK = 2.2;

interface Mal {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kamera(modus: Modus, beat: number, t: number): Mal {
    if (modus === 'aapning') {
        switch (beat) {
            case 0:
                return { pos: v(190 - t * 1.2, 110, 210), se: v(0, 0, 0) };
            case 1:
                return { pos: v(120, 60, 120 - t * 0.8), se: v(0, 2, 0) };
            case 2:
                return { pos: v(34 + t * 0.3, 13, 44), se: v(0, 8, 0) };
            default:
                return { pos: v(-80, 70, 120), se: v(0, 4, 0) };
        }
    }
    if (modus === 'hajj') {
        switch (beat) {
            case 0:
                return { pos: v(10, 200, 170), se: v(0, 0, 0) };
            case 1:
                return { pos: v(140, 55, -70 + t * 0.8), se: v(0, 4, 0) };
            case 2:
                return { pos: v(24, 10, 30), se: v(0, 7, 0) };
            case 3:
                return { pos: v(0, 72, 52), se: v(0, 0, 0) };
            default:
                return { pos: v(SAFA_X + 400, 200, 0), se: v(SAFA_X - 20, 0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(ARAFAT_X + 190, 70, 200), se: v(ARAFAT_X, 6, 0) };
        case 1:
            return { pos: v(ARAFAT_X + 150, 40, 210), se: v(ARAFAT_X - 40, 18, -120) };
        case 2:
            return { pos: v(MINA_X + 80, 28, 70), se: v(MINA_X, 6, 0) };
        case 3:
            return { pos: v(46, 26, 64), se: v(0, 6, 0) };
        default:
            return { pos: v(200, 260, 260), se: v(-20, 0, 0) };
    }
}

function himmel(modus: Modus, beat: number) {
    if (modus === 'aapning') return '#f3d2a2';
    if (modus === 'arafat' && beat === 1) return '#f4a56a';
    if (modus === 'arafat' && beat === 0) return '#cfe3f3';
    return '#d6e6f2';
}

/** Kaba: svart steinbygning, 12 x 10 meter og 15 meter høy, med et gullbånd. */
function Kaba() {
    return (
        <group>
            <mesh position={[0, 7.5, 0]}>
                <boxGeometry args={[12, 15, 10]} />
                <meshStandardMaterial color="#111111" roughness={0.8} />
            </mesh>
            <mesh position={[0, 10.6, 0]}>
                <boxGeometry args={[12.15, 0.9, 10.15]} />
                <meshStandardMaterial color="#d4a017" emissive="#7a5a00" emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
}

/** Buegangen rundt plassen og noen høye tårn. */
function Moskeen() {
    const ref = useRef<THREE.InstancedMesh>(null);
    const antall = 72;
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < antall; i++) {
            const a = (i / antall) * Math.PI * 2;
            o.position.set(Math.cos(a) * 82, 6, Math.sin(a) * 82);
            o.rotation.set(0, -a, 0);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <group>
            <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
                <boxGeometry args={[4, 12, 7.5]} />
                <meshStandardMaterial color="#efe6d2" />
            </instancedMesh>
            {[0.4, 1.9, 3.3, 4.8].map((a) => (
                <mesh key={a} position={[Math.cos(a) * 92, 22, Math.sin(a) * 92]}>
                    <cylinderGeometry args={[2, 2.6, 44, 12]} />
                    <meshStandardMaterial color="#f5efe0" />
                </mesh>
            ))}
        </group>
    );
}

/** Mengden som går rundt Kaba mot klokka, sett ovenfra. */
function Mengden({ antall, playing }: { antall: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const data = useMemo(
        () =>
            Array.from({ length: antall }, (_, i) => {
                const r = 9.5 + Math.sqrt(frø(i)) * 64;
                return { r, a: frø(i + 900) * Math.PI * 2, fart: 3.2 / r };
            }),
        [antall]
    );
    const farger = useMemo(() => {
        const liste = ['#ffffff', '#f5f5f4', '#e7e5e4', '#d6d3d1', '#fef3c7'];
        const c = new THREE.Color();
        const arr = new Float32Array(antall * 3);
        for (let i = 0; i < antall; i++) {
            c.set(liste[Math.floor(frø(i + 50) * liste.length)]);
            arr.set([c.r, c.g, c.b], i * 3);
        }
        return arr;
    }, [antall]);
    const o = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        for (let i = 0; i < antall; i++) {
            const d = data[i];
            const a = d.a + tid.current * d.fart;
            o.position.set(Math.cos(a) * d.r, 0.85, -Math.sin(a) * d.r);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
            <cylinderGeometry args={[0.38, 0.38, 1.7, 6]}>
                <instancedBufferAttribute attach="attributes-color" args={[farger, 3]} />
            </cylinderGeometry>
            <meshStandardMaterial vertexColors />
        </instancedMesh>
    );
}

/** Én pilegrim i gull som går sju runder, og ringen han følger. */
function Tawaf({ playing, onRunde }: { playing: boolean; onRunde: (n: number) => void }) {
    const ref = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    const sist = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        const tt = Math.min(tid.current, RUNDE_SEK * 7 - 0.01);
        const a = Math.PI / 2 + (tt / RUNDE_SEK) * Math.PI * 2;
        ref.current?.position.set(Math.cos(a) * TAWAF_R, 1.6, -Math.sin(a) * TAWAF_R);
        const runde = playing ? Math.floor(tt / RUNDE_SEK) + 1 : 7;
        if (runde !== sist.current) {
            sist.current = runde;
            onRunde(runde);
        }
    });
    return (
        <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
                <torusGeometry args={[TAWAF_R, 0.45, 8, 96]} />
                <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.6} />
            </mesh>
            <mesh ref={ref} position={[0, 1.6, -TAWAF_R]}>
                <cylinderGeometry args={[1.1, 1.1, 3.2, 16]} />
                <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.7} />
            </mesh>
        </group>
    );
}

/** al-Safa og al-Marwa: to små hauger med en lang gang mellom, og folk som går fram og tilbake. */
function Haugene({ playing, vis }: { playing: boolean; vis: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const antall = 160;
    const o = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        for (let i = 0; i < antall; i++) {
            const fase = frø(i + 300) * 2 + tid.current * 0.05;
            const f = fase % 2;
            const s = f < 1 ? f : 2 - f;
            const z = -HALV_GANG + 14 + s * (HALV_GANG * 2 - 28);
            o.position.set(SAFA_X + (frø(i + 77) - 0.5) * 14, 1.2, z);
            o.scale.set(2, 2, 2);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <group visible={vis}>
            <mesh position={[SAFA_X, 0.2, 0]}>
                <boxGeometry args={[20, 0.4, HALV_GANG * 2]} />
                <meshStandardMaterial color="#f5f1e6" />
            </mesh>
            {[-HALV_GANG, HALV_GANG].map((z) => (
                <mesh key={z} position={[SAFA_X, 0, z]} scale={[1, 0.55, 1]}>
                    <sphereGeometry args={[16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#a1825c" />
                </mesh>
            ))}
            <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
                <cylinderGeometry args={[0.4, 0.4, 1.7, 6]} />
                <meshStandardMaterial color="#ffffff" />
            </instancedMesh>
        </group>
    );
}

/** Arafat-sletten: en lav høyde og en stor, stille mengde. */
function Arafat({ antall }: { antall: number }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < antall; i++) {
            const r = 30 + Math.sqrt(frø(i + 4000)) * 150;
            const a = frø(i + 5000) * Math.PI * 2;
            o.position.set(ARAFAT_X + Math.cos(a) * r, 0.85, Math.sin(a) * r);
            o.scale.set(1.6, 1.6, 1.6);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    }, [antall]);
    return (
        <group>
            <mesh position={[ARAFAT_X, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[220, 48]} />
                <meshStandardMaterial color="#d9c39a" />
            </mesh>
            <mesh position={[ARAFAT_X, 0, 0]}>
                <coneGeometry args={[26, 22, 20]} />
                <meshStandardMaterial color="#9c7a52" flatShading />
            </mesh>
            <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
                <cylinderGeometry args={[0.4, 0.4, 1.7, 6]} />
                <meshStandardMaterial color="#ffffff" />
            </instancedMesh>
        </group>
    );
}

/** Mina: tre søyler, og små steiner som flyr mot dem. */
function Mina({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const antall = 36;
    const o = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0.6);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        for (let i = 0; i < antall; i++) {
            const soyle = i % 3;
            const f = (tid.current * 0.7 + frø(i + 10)) % 1;
            const fraX = MINA_X + 26 + frø(i + 20) * 10;
            const fraZ = (soyle - 1) * 28 + (frø(i + 30) - 0.5) * 10;
            o.position.set(
                fraX + (MINA_X - fraX) * f,
                2 + Math.sin(f * Math.PI) * 6,
                fraZ + ((soyle - 1) * 28 - fraZ) * f
            );
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <group>
            {[-1, 0, 1].map((k) => (
                <mesh key={k} position={[MINA_X, 7, k * 28]}>
                    <cylinderGeometry args={[2.2, 2.6, 14, 16]} />
                    <meshStandardMaterial color="#b8a58a" />
                </mesh>
            ))}
            <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
                <sphereGeometry args={[0.35, 8, 6]} />
                <meshStandardMaterial color="#57534e" />
            </instancedMesh>
        </group>
    );
}

function Sol({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        // Middag: høyt. Beat 1: sola går ned mot horisonten (eller står lavt på pause).
        const lav = beat >= 1 ? (playing ? Math.min(1, tid.current / 6) : 1) : 0;
        ref.current?.position.set(ARAFAT_X - 80, 150 - lav * 140, -500);
    });
    return (
        <mesh ref={ref} position={[ARAFAT_X - 80, 150, -500]}>
            <sphereGeometry args={[16, 24, 16]} />
            <meshBasicMaterial color={beat >= 1 ? '#f97316' : '#fde68a'} />
        </mesh>
    );
}

function Scene({
    modus,
    beat,
    playing,
    onRunde,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    onRunde: (n: number) => void;
}) {
    const lav = useMemo(() => guessTier().tier === 'lav', []);
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
        const m = kamera(modus, beat, beatTid.current);
        // Lange hopp (Kaba til Arafat) tas rett, ellers glir kameraet.
        const hopp = forste.current || camera.position.distanceTo(m.pos) > 320;
        forste.current = false;
        if (hopp) {
            camera.position.copy(m.pos);
            se.current.copy(m.se);
        } else {
            const k = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(m.pos, k);
            se.current.lerp(m.se, k);
        }
        camera.lookAt(se.current);
    });
    const farge = himmel(modus, beat);
    const visTawaf = modus === 'hajj' && beat === 3;
    return (
        <>
            <color attach="background" args={[farge]} />
            <fog attach="fog" args={[farge, 500, 1500]} />
            <hemisphereLight args={['#fff7ed', '#c2a878', 1.1]} />
            <directionalLight position={[120, 200, 80]} intensity={1.4} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-300, -0.05, 0]}>
                <planeGeometry args={[2600, 1400]} />
                <meshStandardMaterial color="#cdb68d" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[78, 64]} />
                <meshStandardMaterial color="#f4f2ec" />
            </mesh>
            <Kaba />
            <Moskeen />
            <Mengden antall={lav ? 900 : 1600} playing={playing} />
            {visTawaf && <Tawaf playing={playing} onRunde={onRunde} />}
            <Haugene playing={playing} vis={modus === 'hajj' && beat === 4} />
            {modus === 'arafat' && (
                <>
                    <Arafat antall={lav ? 900 : 1500} />
                    <Mina playing={playing} />
                    <Sol beat={beat} playing={playing} />
                </>
            )}
            {modus === 'hajj' && beat === 2 && (
                <>
                    <Html position={[-10.5, 8, 5]} center>
                        <Merke tekst="15 m høy" />
                    </Html>
                    <Html position={[0, -1.2, 5.6]} center>
                        <Merke tekst="12 m" />
                    </Html>
                    <Html position={[6.8, -1.2, 0]} center>
                        <Merke tekst="10 m" />
                    </Html>
                </>
            )}
            {modus === 'hajj' && beat === 4 && (
                <>
                    <Html position={[SAFA_X, 14, -HALV_GANG]} center>
                        <Merke tekst="al-Safa" />
                    </Html>
                    <Html position={[SAFA_X, 14, HALV_GANG]} center>
                        <Merke tekst="al-Marwa" />
                    </Html>
                    <Html position={[SAFA_X + 16, 2, 0]} center>
                        <Merke tekst="385 meter" gull />
                    </Html>
                </>
            )}
            {modus === 'arafat' && beat <= 1 && (
                <Html position={[ARAFAT_X + 30, 30, 0]} center>
                    <Merke tekst="Arafat-sletten" />
                </Html>
            )}
            {modus === 'arafat' && beat === 2 && (
                <Html position={[MINA_X, 18, 28]} center>
                    <Merke tekst="Tre søyler ved Mina" />
                </Html>
            )}
        </>
    );
}

function Merke({ tekst, gull = false }: { tekst: string; gull?: boolean }) {
    return (
        <div
            className={`px-3 py-1 rounded-xl shadow-lg font-display font-bold text-2xl whitespace-nowrap ${
                gull ? 'bg-amber-500 text-slate-950' : 'bg-white/95 text-slate-900'
            }`}
        >
            {tekst}
        </div>
    );
}

const TEKST: Record<Modus, (string | null)[]> = {
    aapning: ['Mekka, i pilegrimsmåneden', 'Rundt to millioner mennesker', 'Kaba', 'En plikt, for dem som kan'],
    hajj: [
        'Hajj: en av islams fem søyler',
        'Plikt: voksne muslimer som har mulighet og råd',
        'Kaba',
        null,
        'Mellom to hauger',
    ],
    arafat: [
        'Det viktigste: Arafat-sletten',
        'Fra middag til solnedgang',
        'Stein mot søylene, og et dyr ofres',
        'Umra: når som helst på året, ikke en søyle',
        'Bare muslimer får komme inn i Mekka',
    ],
};

export function PilegrimMekka({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'aapning';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const [runde, setRunde] = useState(7);
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    const visRunder = modus === 'hajj' && beat === 3;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 2600, position: [190, 110, 210] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} onRunde={setRunde} />
            </Canvas>
            <Brikke
                tekst={tekst}
                nokkel={`${modus}-${beat}`}
                tone={modus === 'aapning' && beat === 3 ? 'gull' : 'lys'}
            />
            <AnimatePresence>
                {visRunder && (
                    <motion.div
                        key="runder"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-[4%] top-[8%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                    >
                        <div className="text-2xl font-bold text-slate-500">Tawaf</div>
                        <div className="text-5xl font-black text-amber-600 tabular-nums">
                            {playing ? `Runde ${Math.min(runde, 7)}` : '7 runder'}
                        </div>
                        <div className="text-xl font-semibold text-slate-500">
                            rundt Kaba
                        </div>
                    </motion.div>
                )}
                {modus === 'hajj' && beat === 0 && (
                    <motion.div
                        key="soyle"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 bottom-[6%] flex justify-center gap-3"
                    >
                        {[1, 2, 3, 4, 5].map((n) => (
                            <div
                                key={n}
                                className={`w-24 h-28 rounded-t-xl flex items-end justify-center pb-2 font-black text-2xl shadow-lg ${
                                    n === 5 ? 'bg-amber-500 text-slate-950' : 'bg-white/90 text-slate-400'
                                }`}
                            >
                                {n === 5 ? 'Hajj' : 'søyle'}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
