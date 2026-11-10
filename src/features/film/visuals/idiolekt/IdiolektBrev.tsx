import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * 3D: et skrivebord hos politiet med rundt hundre brev.
 * «bunke»: brevene ligger spredt, får ulike brevhoder (kontorer), en lupe går over dem, de samme
 * merkene lyser på hvert brev, og til slutt flyr alle sammen i én bunke under én penn.
 * «fag»: bunken ligger på bordet, og rettslingvistikkens verktøy kommer fram: klubbe, bok, mobil.
 */

type Modus = 'bunke' | 'fag';

const N = 100;
const KONTOR_FARGER = ['#2563eb', '#16a34a', '#c2410c', '#7c3aed', '#0891b2'];

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'bunke') {
        switch (beat) {
            case 0:
                return { pos: v(0, 12 - Math.min(t, 8) * 0.25, 9), se: v(0, 0, 0.3) };
            case 1:
                return { pos: v(-7 + Math.min(t, 8) * 0.3, 6, 7.5), se: v(-1, 0, 0) };
            case 2:
                return { pos: v(0, 6, 7), se: v(0, 0, 0.5) };
            case 3:
                return { pos: v(1.2, 5, 4.6), se: v(0.4, 0, -0.4) };
            default:
                return { pos: v(0, 6, 9), se: v(0, 1.4, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 6, 8.5), se: v(0, 0.6, 0.5) };
        case 1:
            return { pos: v(-4.5, 7.5, 7), se: v(-3.8, 0, 1.3) };
        case 2:
            return { pos: v(4.5, 7.5, 7), se: v(3.8, 0, 1.3) };
        case 3:
            return { pos: v(0, 8.5, 7.5), se: v(0, 0, 1.3) };
        default:
            return { pos: v(0, 9.5, 10.5), se: v(0, 0, 1) };
    }
}

interface Brev {
    spredt: THREE.Vector3;
    rotSpredt: number;
    rotBunke: number;
    forsinkelse: number;
    kontor: number;
}

function lagBrev(): Brev[] {
    let s = 11;
    const rand = () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
    const ut: Brev[] = [];
    for (let i = 0; i < N; i++) {
        const k = i % 10;
        const r = Math.floor(i / 10);
        ut.push({
            spredt: v(
                -7 + k * 1.55 + (rand() - 0.5) * 0.5,
                0.02 + rand() * 0.02,
                -4.4 + r * 1.0 + (rand() - 0.5) * 0.3
            ),
            rotSpredt: (rand() - 0.5) * 0.7,
            rotBunke: (rand() - 0.5) * 0.12,
            forsinkelse: rand(),
            kontor: Math.floor(rand() * KONTOR_FARGER.length),
        });
    }
    return ut;
}

/** Lokale biter på hvert brev: tre tekstlinjer, brevhodet og det røde merket. */
const LINJER = [-0.15, 0.1, 0.35];

function Brevene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const brev = useMemo(() => lagBrev(), []);
    const ark = useRef<THREE.InstancedMesh>(null);
    const linjer = useRef<THREE.InstancedMesh>(null);
    const hoder = useRef<THREE.InstancedMesh>(null);
    const merker = useRef<THREE.InstancedMesh>(null);
    const tilstand = useRef({ samlet: modus === 'fag' ? 1 : 0, hode: 0, merke: 0, forste: true });
    const hjelp = useMemo(
        () => ({
            o: new THREE.Object3D(),
            m: new THREE.Matrix4(),
            l: new THREE.Matrix4(),
            q: new THREE.Quaternion(),
            p: v(0, 0, 0),
            s: v(1, 1, 1),
        }),
        []
    );

    useEffect(() => {
        const h = hoder.current;
        if (!h) return;
        const c = new THREE.Color();
        brev.forEach((b, i) => h.setColorAt(i, c.set(KONTOR_FARGER[b.kontor])));
        if (h.instanceColor) h.instanceColor.needsUpdate = true;
    }, [brev]);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const st = tilstand.current;
        const malSamlet = modus === 'fag' || beat >= 4 ? 1 : 0;
        const malHode = modus === 'bunke' && beat >= 1 && beat <= 3 ? 1 : 0;
        const malMerke = modus === 'bunke' && beat === 3 ? 1 : 0;
        if (st.forste) {
            st.samlet = malSamlet;
            st.hode = malHode;
            st.merke = malMerke;
            st.forste = false;
        }
        st.samlet = damp(st.samlet, malSamlet, 1.1, dt);
        st.hode = damp(st.hode, malHode, 3, dt);
        st.merke = damp(st.merke, malMerke, 3, dt);
        // Ved et hopp rett til en beat skal bildet ikke henge igjen i forrige tilstand.
        if (!playing) {
            st.samlet = malSamlet;
            st.hode = malHode;
            st.merke = malMerke;
        }
        const { o, m, l, q, p, s } = hjelp;
        brev.forEach((b, i) => {
            const lokal = THREE.MathUtils.clamp(st.samlet * 1.5 - b.forsinkelse * 0.5, 0, 1);
            const e = lokal * lokal * (3 - 2 * lokal);
            o.position.set(
                THREE.MathUtils.lerp(b.spredt.x, 0, e),
                THREE.MathUtils.lerp(b.spredt.y, 0.03 + i * (modus === 'fag' ? 0.009 : 0.022), e) +
                    Math.sin(e * Math.PI) * 1.6,
                THREE.MathUtils.lerp(b.spredt.z, 0, e)
            );
            o.rotation.set(0, THREE.MathUtils.lerp(b.rotSpredt, b.rotBunke, e), 0);
            o.scale.set(1, 1, 1);
            o.updateMatrix();
            ark.current?.setMatrixAt(i, o.matrix);
            m.copy(o.matrix);
            LINJER.forEach((z, j) => {
                l.compose(p.set(-0.05, 0.02, z), q.identity(), s.set(1, 1, 1));
                linjer.current?.setMatrixAt(i * 3 + j, l.premultiply(m));
            });
            l.compose(
                p.set(0, 0.02, -0.48),
                q.identity(),
                s.set(1, Math.max(st.hode, 0.001), Math.max(st.hode, 0.001))
            );
            hoder.current?.setMatrixAt(i, l.premultiply(m));
            l.compose(
                p.set(-0.18, 0.025, 0.1),
                q.identity(),
                s.set(Math.max(st.merke, 0.001), 1, Math.max(st.merke, 0.001))
            );
            merker.current?.setMatrixAt(i, l.premultiply(m));
        });
        for (const r of [ark, linjer, hoder, merker])
            if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            <instancedMesh ref={ark} args={[undefined, undefined, N]} frustumCulled={false}>
                <boxGeometry args={[1.0, 0.025, 1.3]} />
                <meshStandardMaterial
                    color="#f5f0e6"
                    emissive="#3a332a"
                    emissiveIntensity={0.35}
                    roughness={0.9}
                />
            </instancedMesh>
            <instancedMesh ref={linjer} args={[undefined, undefined, N * 3]} frustumCulled={false}>
                <boxGeometry args={[0.7, 0.01, 0.06]} />
                <meshBasicMaterial color="#64748b" />
            </instancedMesh>
            <instancedMesh ref={hoder} args={[undefined, undefined, N]} frustumCulled={false}>
                <boxGeometry args={[0.85, 0.02, 0.16]} />
                <meshBasicMaterial color="#ffffff" />
            </instancedMesh>
            <instancedMesh ref={merker} args={[undefined, undefined, N]} frustumCulled={false}>
                <boxGeometry args={[0.36, 0.02, 0.14]} />
                <meshBasicMaterial color="#ef4444" />
            </instancedMesh>
        </group>
    );
}

function Bord() {
    return (
        <group>
            <mesh position={[0, -0.3, 0]}>
                <boxGeometry args={[18, 0.6, 12]} />
                <meshStandardMaterial color="#7c4a2a" roughness={0.8} />
            </mesh>
            {/* Bordlampe bak til venstre */}
            <group position={[-7.5, 0, -4.8]}>
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.6, 0.7, 0.2, 20]} />
                    <meshStandardMaterial color="#1f2937" />
                </mesh>
                <mesh position={[0, 1.2, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, 2.2, 8]} />
                    <meshStandardMaterial color="#1f2937" />
                </mesh>
                <mesh position={[0.4, 2.3, 0.4]} rotation={[0.5, 0, -0.5]}>
                    <coneGeometry args={[0.8, 0.9, 20, 1, true]} />
                    <meshStandardMaterial color="#166534" side={THREE.DoubleSide} />
                </mesh>
            </group>
        </group>
    );
}

/** Lupen glir over brevene. */
function Lupe({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        tid.current += playing ? Math.min(delta, 0.05) : 0;
        const t = tid.current;
        g.position.set(Math.sin(t * 0.45) * 4, 1.4, Math.cos(t * 0.3) * 1.6 + 0.5);
        const s = damp(g.scale.x, synlig ? 1 : 0.001, 4, playing ? Math.min(delta, 0.05) : 1);
        g.scale.setScalar(s);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.9, 0.09, 10, 36]} />
                <meshStandardMaterial color="#1f2937" metalness={0.4} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.85, 32]} />
                <meshStandardMaterial color="#bae6fd" transparent opacity={0.3} />
            </mesh>
            <mesh position={[1.4, 0, 0.6]} rotation={[0, -0.4, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.12, 1.3, 10]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
        </group>
    );
}

/** Én penn over den ene bunken. */
function Penn({ synlig }: { synlig: boolean }) {
    return (
        <group visible={synlig} position={[0.8, 2.9, 0.4]} rotation={[0, 0, -0.9]}>
            <mesh>
                <cylinderGeometry args={[0.1, 0.1, 2.2, 12]} />
                <meshStandardMaterial color="#7c3aed" emissive="#4c1d95" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, -1.3, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.1, 0.4, 12]} />
                <meshStandardMaterial color="#e5e7eb" metalness={0.6} />
            </mesh>
        </group>
    );
}

function Klubbe() {
    return (
        <group position={[-4.5, 0, 1.2]}>
            <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.9, 0.95, 0.3, 24]} />
                <meshStandardMaterial color="#5b3416" />
            </mesh>
            <group position={[0.2, 0.75, 0]} rotation={[0, 0.5, 0.25]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.32, 0.32, 1.2, 20]} />
                    <meshStandardMaterial color="#92400e" />
                </mesh>
                <mesh position={[0, 0, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.09, 0.09, 1.9, 10]} />
                    <meshStandardMaterial color="#92400e" />
                </mesh>
            </group>
        </group>
    );
}

function Bok() {
    return (
        <group position={[4.5, 0, 1.2]} rotation={[0, -0.3, 0]}>
            {[-1, 1].map((side) => (
                <group key={side} rotation={[0, 0, side * -0.12]}>
                    <mesh position={[side * 0.8, 0.12, 0]}>
                        <boxGeometry args={[1.5, 0.1, 2.0]} />
                        <meshStandardMaterial
                            color="#fefce8"
                            emissive="#3a332a"
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                    {[-0.5, -0.2, 0.1, 0.4].map((z) => (
                        <mesh key={z} position={[side * 0.8, 0.18, z]}>
                            <boxGeometry args={[1.1, 0.01, 0.06]} />
                            <meshBasicMaterial color="#64748b" />
                        </mesh>
                    ))}
                </group>
            ))}
            <mesh position={[0, 0.04, 0]}>
                <boxGeometry args={[3.3, 0.08, 2.15]} />
                <meshStandardMaterial color="#1e3a8a" />
            </mesh>
        </group>
    );
}

function Mobil() {
    return (
        <group position={[0, 0.08, 3.2]} rotation={[0, 0.15, 0]}>
            <mesh>
                <boxGeometry args={[1.3, 0.12, 2.5]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[0, 0.07, 0]}>
                <boxGeometry args={[1.15, 0.01, 2.3]} />
                <meshBasicMaterial color="#e0e7ff" />
            </mesh>
            {[
                { x: 0.2, z: -0.75, b: 0.6, f: '#7c3aed' },
                { x: -0.2, z: -0.35, b: 0.6, f: '#94a3b8' },
                { x: 0.15, z: 0.05, b: 0.7, f: '#7c3aed' },
                { x: -0.15, z: 0.45, b: 0.7, f: '#94a3b8' },
            ].map((m, i) => (
                <mesh key={i} position={[m.x, 0.09, m.z]}>
                    <boxGeometry args={[m.b, 0.01, 0.25]} />
                    <meshBasicMaterial color={m.f} />
                </mesh>
            ))}
        </group>
    );
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const st = useRef({ beat: -1, t: 0, se: v(0, 0, 0), forste: true });
    useFrame((_, delta) => {
        const s = st.current;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (s.beat !== beat) {
            s.beat = beat;
            s.t = 0;
        }
        s.t += dt;
        const k = kameraFor(modus, beat, s.t);
        if (s.forste || !playing) {
            camera.position.copy(k.pos);
            s.se.copy(k.se);
            s.forste = false;
        } else {
            const a = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(k.pos, a);
            s.se.lerp(k.se, a);
        }
        camera.lookAt(s.se);
    });
    return null;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#292524']} />
            <fog attach="fog" args={['#292524', 18, 40]} />
            <ambientLight intensity={0.55} />
            <hemisphereLight args={['#fde68a', '#1c1917', 0.6]} />
            <directionalLight position={[4, 10, 6]} intensity={1.1} />
            <pointLight position={[-6.5, 3, -3.5]} intensity={18} distance={14} color="#fbbf24" />
            <Kamera modus={modus} beat={beat} playing={playing} />
            <Bord />
            <Brevene modus={modus} beat={beat} playing={playing} />
            {modus === 'bunke' && (
                <>
                    <Lupe synlig={beat === 2 || beat === 3} playing={playing} />
                    <Penn synlig={beat >= 4} />
                </>
            )}
            {modus === 'fag' && (
                <>
                    {beat >= 1 && <Klubbe />}
                    {beat >= 2 && <Bok />}
                    {beat >= 3 && <Mobil />}
                </>
            )}
        </>
    );
}

const TITLER: Record<Modus, string[]> = {
    bunke: [
        'Rundt hundre brev',
        'Ulike kontorer?',
        'En språkforsker leser',
        'Samme ordvalg, stavefeil og setninger',
        'Én skribent',
    ],
    fag: [
        'Rettslingvistikk: språkkunnskap i rettssystemet',
        'I rettssystemet og i etterforskning',
        'Opphavsrett, og hvem skrev teksten?',
        'Chat-samtaler',
        'Rettslingvistikk i Norge',
    ],
};

export function IdiolektBrev({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'bunke';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tittel = TITLER[modus][Math.min(beat, 4)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 100, position: [0, 12, 9] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 flex justify-center" style={{ top: '6%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tittel}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl bg-white/90 px-5 py-2 text-center font-display font-bold text-slate-900 shadow-xl"
                        style={{ fontSize: 32 }}
                    >
                        {tittel}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'fag' && beat === 4 && (
                <div className="absolute inset-x-0 flex justify-center" style={{ bottom: '8%' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="rounded-2xl px-6 py-3 text-center font-bold text-white shadow-xl"
                        style={{ fontSize: 28, background: '#7c3aed' }}
                    >
                        Universitetet i Sørøst-Norge: første studieprogram, siden 2023
                    </motion.div>
                </div>
            )}
        </div>
    );
}
