import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Den samiske trommen i 3D. Tre moduser:
 * - tro: landskapet der naturen er full av liv, sola (Beaivi) og trommen ved lavvoen.
 * - innsamling: trommen i en kasse, symbolene som tegnes av, sieidien som veltes, kirken.
 * - brann: hylla med trommer i Misjonskollegiet, og bybrannen i København i 1728.
 * Ingen mennesker vises. Alt styres av beat, og kameraet glir mot et mål per beat.
 */

type Modus = 'tro' | 'innsamling' | 'brann';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

type Mål = { pos: THREE.Vector3; se: THREE.Vector3 };

const KAMERA: Record<Modus, (beat: number, t: number) => Mål> = {
    tro: (beat, t) => {
        switch (beat) {
            case 0:
                return { pos: v(15 - t * 0.2, 7, 22), se: v(1, 2, 0) };
            case 1:
                return { pos: v(6 + t * 0.15, 5, 16), se: v(12, 2, -10) };
            case 2:
                return { pos: v(-1, 11, 25), se: v(-1, 2, -12) };
            case 3:
                return { pos: v(6, 3, 14), se: v(-16, 12, -50) };
            default:
                return { pos: v(3.3, 4.6 - t * 0.04, 6.4), se: v(3, 1.2, 3) };
        }
    },
    innsamling: (beat, t) => {
        switch (beat) {
            case 0:
                return { pos: v(8.5 - t * 0.1, 4.2, 10), se: v(3, 0.6, 3) };
            case 1:
                return { pos: v(6, 3.2, 6.8), se: v(4.3, 0.5, 3.3) };
            case 2:
                return { pos: v(17, 4.5, 5), se: v(10, 1.2, -6) };
            case 3:
                return { pos: v(12, 6, 10), se: v(24, 2.5, -20) };
            default:
                return { pos: v(-2, 20 + t * 0.1, 38), se: v(8, 0, -10) };
        }
    },
    brann: (beat, t) => {
        switch (beat) {
            case 0:
                return { pos: v(-1 + t * 0.1, 3.6, 10), se: v(0, 3.2, -2) };
            case 1:
                return { pos: v(3, 3.8, 9.5), se: v(0, 3.2, -2) };
            case 2:
                return { pos: v(0, 15, 48 - t * 0.3), se: v(0, 4, 0) };
            case 3:
                return { pos: v(-4, 5, 14), se: v(0, 3.4, -1) };
            default:
                return { pos: v(0, 12, 17), se: v(0, 11, 0) };
        }
    },
};

/** Kameraet glir mot målet for beaten. Første bilde hopper rett dit. */
function useKamera(modus: Modus, beat: number, playing: boolean) {
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
        const m = KAMERA[modus](beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return beatTid;
}

/** Skinnet på trommen: sola i midten, linjer som deler verdenene, små figurer. */
function lagSkinn(sol = 1) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d');
    if (!g) return new THREE.CanvasTexture(c);
    g.fillStyle = '#efd9a8';
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#9f2a1a';
    g.fillStyle = '#9f2a1a';
    g.lineWidth = 5;
    g.lineCap = 'round';
    // To streker som deler skinnet
    g.beginPath();
    g.moveTo(20, 90);
    g.lineTo(236, 90);
    g.moveTo(20, 170);
    g.lineTo(236, 170);
    g.stroke();
    // Sola: en ruter med stråler
    g.save();
    g.translate(128, 130);
    g.lineWidth = 6 * sol;
    g.beginPath();
    g.moveTo(0, -28);
    g.lineTo(28, 0);
    g.lineTo(0, 28);
    g.lineTo(-28, 0);
    g.closePath();
    g.stroke();
    for (let i = 0; i < 4; i++) {
        g.rotate(Math.PI / 2);
        g.beginPath();
        g.moveTo(0, -30);
        g.lineTo(0, -46);
        g.stroke();
    }
    g.restore();
    // Figurer over og under
    const figur = (x: number, y: number) => {
        g.beginPath();
        g.arc(x, y - 16, 6, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.moveTo(x, y - 10);
        g.lineTo(x, y + 10);
        g.moveTo(x - 10, y - 2);
        g.lineTo(x + 10, y - 2);
        g.moveTo(x, y + 10);
        g.lineTo(x - 8, y + 22);
        g.moveTo(x, y + 10);
        g.lineTo(x + 8, y + 22);
        g.stroke();
    };
    figur(80, 52);
    figur(128, 48);
    figur(176, 52);
    // Rein og fjell under
    g.beginPath();
    g.moveTo(60, 230);
    g.lineTo(90, 192);
    g.lineTo(120, 230);
    g.moveTo(140, 214);
    g.lineTo(196, 214);
    g.moveTo(150, 214);
    g.lineTo(146, 232);
    g.moveTo(186, 214);
    g.lineTo(190, 232);
    g.moveTo(196, 214);
    g.lineTo(204, 198);
    g.moveTo(200, 206);
    g.lineTo(210, 196);
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Tromme: en oval ramme av tre med skinn på toppen. Står oppreist om `oppreist`. */
function Tromme({ skinn, glod = 0 }: { skinn: THREE.Texture; glod?: number }) {
    return (
        <group scale={[0.9, 1, 1.18]}>
            <mesh>
                <cylinderGeometry args={[1, 1, 0.28, 28, 1, true]} />
                <meshStandardMaterial color="#8a5a2b" side={THREE.DoubleSide} flatShading />
            </mesh>
            <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1, 32]} />
                <meshStandardMaterial map={skinn} emissive="#ffb347" emissiveIntensity={glod} emissiveMap={skinn} />
            </mesh>
        </group>
    );
}

function Fjell() {
    const topper = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => ({
                x: -70 + i * 17 + frø(i) * 6,
                z: -42 - frø(i + 3) * 14,
                r: 14 + frø(i + 6) * 8,
                h: 12 + frø(i + 1) * 10,
            })),
        []
    );
    return (
        <>
            {topper.map((f, i) => (
                <group key={i} position={[f.x, 0, f.z]}>
                    <mesh position={[0, f.h / 2, 0]}>
                        <coneGeometry args={[f.r, f.h, 7]} />
                        <meshStandardMaterial color="#7d8a7a" flatShading />
                    </mesh>
                    <mesh position={[0, f.h * 0.82, 0]}>
                        <coneGeometry args={[f.r * 0.36, f.h * 0.36, 7]} />
                        <meshStandardMaterial color="#f4f7fb" emissive="#8899aa" emissiveIntensity={0.25} flatShading />
                    </mesh>
                </group>
            ))}
        </>
    );
}

function Lavvo() {
    return (
        <group position={[-2.2, 0, -1.6]}>
            <mesh position={[0, 2, 0]}>
                <coneGeometry args={[2.2, 4, 10, 1, true]} />
                <meshStandardMaterial color="#c9b48f" side={THREE.DoubleSide} flatShading />
            </mesh>
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} position={[Math.cos(i * 1.26) * 0.25, 4.3, Math.sin(i * 1.26) * 0.25]} rotation={[Math.sin(i * 1.26) * 0.3, 0, -Math.cos(i * 1.26) * 0.3]}>
                    <cylinderGeometry args={[0.05, 0.05, 1.2, 4]} />
                    <meshStandardMaterial color="#5b3a1e" />
                </mesh>
            ))}
        </group>
    );
}

function Kirke({ pos }: { pos: [number, number, number] }) {
    return (
        <group position={pos} rotation={[0, -0.6, 0]}>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[5, 3, 3]} />
                <meshStandardMaterial color="#f8fafc" emissive="#94a3b8" emissiveIntensity={0.2} flatShading />
            </mesh>
            <mesh position={[0, 3, 0]} rotation={[Math.PI / 4, 0, 0]}>
                <boxGeometry args={[5.3, 2.1, 2.1]} />
                <meshStandardMaterial color="#7f1d1d" flatShading />
            </mesh>
            <mesh position={[-2.2, 3.2, 0]}>
                <boxGeometry args={[1.2, 6.4, 1.2]} />
                <meshStandardMaterial color="#f8fafc" emissive="#94a3b8" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[-2.2, 7.4, 0]}>
                <coneGeometry args={[0.9, 2.2, 4]} />
                <meshStandardMaterial color="#7f1d1d" flatShading />
            </mesh>
        </group>
    );
}

/** Sieidien: en hellig stein på en liten haug. Den veltes når `veltet`. */
function Sieidi({ veltet, playing, glod }: { veltet: boolean; playing: boolean; glod: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (ref.current) ref.current.rotation.z = damp(ref.current.rotation.z, veltet ? -1.45 : 0, 1.6, dt);
        if (mat.current) mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, glod ? 0.55 : 0.08, 2, dt);
    });
    return (
        <group position={[10, 0, -6]}>
            <mesh position={[0, 0.2, 0]} scale={[3.4, 0.7, 3]}>
                <sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#6f7d5c" flatShading />
            </mesh>
            <group ref={ref} position={[0.9, 0.7, 0]}>
                <mesh position={[-0.9, 1.4, 0]} scale={[0.9, 1.5, 0.8]}>
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial ref={mat} color="#8b8f94" emissive="#ffd27a" emissiveIntensity={0.08} flatShading />
                </mesh>
            </group>
        </group>
    );
}

/** Landskapet for «tro» og «innsamling». */
function Landskap({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera(modus, beat, playing);
    const skinn = useMemo(() => lagSkinn(), []);
    useEffect(() => () => skinn.dispose(), [skinn]);
    const sol = useRef<THREE.Mesh>(null);
    const solMat = useRef<THREE.MeshStandardMaterial>(null);
    const sjo = useRef<THREE.MeshStandardMaterial>(null);
    const vuorbi = useRef<THREE.Group>(null);
    const ark = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    const tro = modus === 'tro';
    const glod = tro && beat === 3 ? 0.8 : tro && beat === 4 ? 0.25 : 0;
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const solMål = tro && beat === 3 ? 2.2 : 1;
        if (sol.current) sol.current.scale.setScalar(damp(sol.current.scale.x, solMål, 1.5, dt));
        if (solMat.current) solMat.current.emissiveIntensity = damp(solMat.current.emissiveIntensity, tro && beat === 3 ? 2.2 : 0.9, 1.5, dt);
        if (sjo.current) sjo.current.emissiveIntensity = damp(sjo.current.emissiveIntensity, tro && beat === 2 ? 0.7 : 0.3, 2, dt);
        if (vuorbi.current) {
            const slag = tro && beat === 4 ? Math.max(0, Math.sin(tid.current * 5)) * 0.35 : 0;
            vuorbi.current.position.y = 1.75 + slag;
        }
        if (ark.current) ark.current.scale.setScalar(damp(ark.current.scale.x, !tro && beat >= 1 ? 1 : 0.001, 2.5, dt));
    });
    return (
        <>
            <color attach="background" args={['#a9cbe6']} />
            <fog attach="fog" args={['#c4d9ea', 50, 150]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#dbeafe', '#5b6b4a', 0.7]} />
            <directionalLight position={[-20, 25, 10]} intensity={1.1} color="#fff1d6" />
            {/* Sola, Beaivi */}
            <mesh ref={sol} position={[-30, 26, -85]}>
                <sphereGeometry args={[4, 20, 14]} />
                <meshStandardMaterial ref={solMat} color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.9} fog={false} />
            </mesh>
            {/* Lyng og mose */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[260, 260]} />
                <meshStandardMaterial color="#8a9a6b" emissive="#3f4a2e" emissiveIntensity={0.2} />
            </mesh>
            {/* Sjøen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.03, -8]}>
                <circleGeometry args={[7, 28]} />
                <meshStandardMaterial ref={sjo} color="#4f8fc0" emissive="#2f6fa0" emissiveIntensity={0.3} />
            </mesh>
            {/* Kilden: en liten bekk */}
            <mesh rotation={[-Math.PI / 2, 0, 0.5]} position={[-5, 0.04, -2]}>
                <planeGeometry args={[0.9, 10]} />
                <meshStandardMaterial color="#5fa0d0" emissive="#3a7fb0" emissiveIntensity={0.3} />
            </mesh>
            <Fjell />
            <Lavvo />
            <Sieidi veltet={!tro && beat >= 2} glod={(tro && beat === 2) || (!tro && beat === 2)} playing={playing} />
            {(!tro || beat >= 1) && <Kirke pos={[25, 0, -20]} />}
            {tro ? (
                <group position={[3, 0, 3]}>
                    {/* Trommen på et lite stativ, skrått mot kameraet */}
                    <mesh position={[0, 0.5, 0]}>
                        <cylinderGeometry args={[0.08, 0.1, 1, 6]} />
                        <meshStandardMaterial color="#5b3a1e" />
                    </mesh>
                    <group position={[0, 1.2, 0]} rotation={[0.55, 0, 0]}>
                        <Tromme skinn={skinn} glod={glod} />
                    </group>
                    <group ref={vuorbi} position={[0.4, 1.75, 0.6]} rotation={[0.3, 0.4, 0.2]}>
                        <mesh>
                            <boxGeometry args={[0.6, 0.08, 0.12]} />
                            <meshStandardMaterial color="#e7dcc4" />
                        </mesh>
                        <mesh position={[0, 0.18, 0]}>
                            <boxGeometry args={[0.1, 0.36, 0.1]} />
                            <meshStandardMaterial color="#e7dcc4" />
                        </mesh>
                    </group>
                </group>
            ) : (
                <group position={[3, 0, 3]}>
                    {/* Kassen med trommen */}
                    {[
                        [0, 0.6, -1.1, 2.6, 1.2, 0.12],
                        [0, 0.6, 1.1, 2.6, 1.2, 0.12],
                        [-1.25, 0.6, 0, 0.12, 1.2, 2.2],
                        [1.25, 0.6, 0, 0.12, 1.2, 2.2],
                        [0, 0.06, 0, 2.6, 0.12, 2.2],
                    ].map(([x, y, z, w, h, d], i) => (
                        <mesh key={i} position={[x, y, z]}>
                            <boxGeometry args={[w, h, d]} />
                            <meshStandardMaterial color="#b08350" flatShading />
                        </mesh>
                    ))}
                    <group position={[0, 0.85, -0.1]} rotation={[0.9, 0, 0]} scale={0.85}>
                        <Tromme skinn={skinn} />
                    </group>
                    {/* Arket der symbolene tegnes av */}
                    <mesh ref={ark} position={[2.2, 0.03, 0.6]} rotation={[-Math.PI / 2, 0, -0.2]} scale={0.001}>
                        <planeGeometry args={[1.6, 2.1]} />
                        <meshStandardMaterial map={skinn} color="#fffbea" />
                    </mesh>
                </group>
            )}
            {tro && beat === 2 && (
                <>
                    <Lapp pos={[-20, 16, -45]} tekst="fjell" />
                    <Lapp pos={[10, 4.5, -6]} tekst="stein" />
                    <Lapp pos={[-12, 1.5, -8]} tekst="sjø" />
                    <Lapp pos={[-5, 1.2, -2]} tekst="kilde" />
                </>
            )}
        </>
    );
}

function Lapp({ pos, tekst }: { pos: [number, number, number]; tekst: string }) {
    return (
        <Html position={pos} center zIndexRange={[20, 0]}>
            <div className="px-4 py-1.5 rounded-xl bg-white/95 text-emerald-800 font-black text-2xl shadow-lg whitespace-nowrap border-2 border-amber-300">
                {tekst}
            </div>
        </Html>
    );
}

const RADER = 4;
const KOLONNER = 9;
const TROMMER = RADER * KOLONNER;

/** Bybrannen: Misjonskollegiet med en hylle full av trommer, og byen rundt. */
function Brann({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera('brann', beat, playing);
    const skinn = useMemo(() => lagSkinn(), []);
    const mats = useMemo(
        () => [
            new THREE.MeshStandardMaterial({ color: '#8a5a2b', flatShading: true }),
            new THREE.MeshStandardMaterial({ map: skinn, color: '#ffffff', emissive: '#ff6a00', emissiveIntensity: 0 }),
            new THREE.MeshStandardMaterial({ color: '#8a5a2b' }),
        ],
        [skinn]
    );
    useEffect(
        () => () => {
            skinn.dispose();
            mats.forEach((m) => m.dispose());
        },
        [skinn, mats]
    );
    const trommer = useRef<THREE.InstancedMesh>(null);
    const flammer = useRef<THREE.InstancedMesh>(null);
    const papir = useRef<THREE.InstancedMesh>(null);
    const lys = useRef<THREE.PointLight>(null);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    const skala = useRef(Array.from({ length: TROMMER }, () => 1));
    const brent = useRef(0);
    const tid = useRef(0);
    const forkullet = useMemo(() => new THREE.Color('#2a1a12'), []);
    const tre = useMemo(() => new THREE.Color('#8a5a2b'), []);
    const hvit = useMemo(() => new THREE.Color('#ffffff'), []);

    // Flammene: noen langs husrekka til venstre, resten på kollegiet.
    const FLAMMER = useMemo(
        () =>
            Array.from({ length: 22 }, (_, i) => {
                const by = i < 12;
                return {
                    x: by ? -38 + i * 3 + frø(i) * 2 : -6 + (i - 12) * 1.35,
                    y: by ? 6 + frø(i + 9) * 4 : 7.6,
                    z: by ? -1 + frø(i + 4) * 2 : 0.5,
                    by,
                    s: 1.2 + frø(i + 2) * 1.2,
                };
            }),
        []
    );
    const ARK = 26;
    const ARKDATA = useMemo(
        () => Array.from({ length: ARK }, (_, i) => ({ x: (frø(i) - 0.5) * 12, y: frø(i + 30) * 12, fart: 0.6 + frø(i + 60) * 0.8, r: frø(i + 90) * 6 })),
        []
    );

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const t = tid.current;
        // Trommene: halvparten forsvinner på beat 1, resten forkulles på beat 3.
        const m = trommer.current;
        if (m) {
            for (let i = 0; i < TROMMER; i++) {
                const r = Math.floor(i / KOLONNER);
                const k = i % KOLONNER;
                const borte = beat >= 1 && (k + r) % 2 === 1;
                skala.current[i] = damp(skala.current[i], borte ? 0.001 : 1, 3, dt);
                tmp.position.set(-5.2 + k * 1.3, 1.25 + r * 1.55, -1.6);
                tmp.rotation.set(Math.PI / 2, 0, 0);
                tmp.scale.set(0.5 * skala.current[i], 0.5 * skala.current[i], 0.62 * skala.current[i]);
                tmp.updateMatrix();
                m.setMatrixAt(i, tmp.matrix);
            }
            m.instanceMatrix.needsUpdate = true;
        }
        brent.current = damp(brent.current, beat >= 3 ? 1 : 0, 0.9, dt);
        if (m) {
            // Materialene hentes fra meshen, så vi ikke endrer en hook-verdi direkte.
            const [side, topp] = m.material as THREE.MeshStandardMaterial[];
            side.color.copy(tre).lerp(forkullet, brent.current);
            topp.color.copy(hvit).lerp(forkullet, brent.current * 0.85);
            topp.emissiveIntensity = beat === 3 ? 0.25 + Math.sin(t * 9) * 0.1 : 0;
        }

        const f = flammer.current;
        if (f) {
            for (let i = 0; i < FLAMMER.length; i++) {
                const fl = FLAMMER[i];
                const på = fl.by ? beat >= 2 : beat >= 3;
                const s = på ? fl.s * (1 + Math.sin(t * 10 + i * 1.7) * 0.18) : 0.001;
                tmp.position.set(fl.x, fl.y + (på ? s * 0.8 : 0), fl.z);
                tmp.rotation.set(0, 0, 0);
                tmp.scale.set(s * 0.7, s * 1.8, s * 0.7);
                tmp.updateMatrix();
                f.setMatrixAt(i, tmp.matrix);
            }
            f.instanceMatrix.needsUpdate = true;
        }
        const pa = papir.current;
        if (pa) {
            for (let i = 0; i < ARK; i++) {
                const a = ARKDATA[i];
                const y = beat >= 4 ? 3 + ((a.y + t * a.fart) % 12) : -10;
                tmp.position.set(a.x, y, 2 + Math.sin(t + i) * 0.6);
                tmp.rotation.set(a.r + t * 0.8, a.r + t * 0.5, 0);
                tmp.scale.setScalar(1);
                tmp.updateMatrix();
                pa.setMatrixAt(i, tmp.matrix);
            }
            pa.instanceMatrix.needsUpdate = true;
        }
        if (lys.current) lys.current.intensity = damp(lys.current.intensity, beat >= 2 ? 30 + Math.sin(t * 12) * 5 : 0, 2, dt);
    });

    const hus = useMemo(
        () =>
            Array.from({ length: 10 }, (_, i) => {
                const x = -44 + i * 9 + (i >= 5 ? 11 : 0);
                return { x, h: 5 + frø(i) * 4 };
            }),
        []
    );

    return (
        <>
            <color attach="background" args={['#2b2440']} />
            <fog attach="fog" args={['#3a2f4a', 40, 140]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#b9a8d8', '#3a2a2a', 0.7]} />
            <directionalLight position={[10, 20, 20]} intensity={0.6} color="#ffe9c4" />
            <pointLight ref={lys} position={[-8, 10, 6]} color="#ff7a1a" intensity={0} distance={70} decay={1.2} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color="#5a4e46" emissive="#2a2420" emissiveIntensity={0.4} />
            </mesh>
            {/* Husrekka */}
            {hus.map((h, i) => (
                <group key={i} position={[h.x, 0, -1]}>
                    <mesh position={[0, h.h / 2, 0]}>
                        <boxGeometry args={[7.6, h.h, 5]} />
                        <meshStandardMaterial color={i % 2 ? '#c9a27a' : '#b98a6a'} emissive="#3a2418" emissiveIntensity={0.3} flatShading />
                    </mesh>
                    <mesh position={[0, h.h, 0]} rotation={[Math.PI / 4, 0, 0]}>
                        <boxGeometry args={[7.8, 3.5, 3.5]} />
                        <meshStandardMaterial color="#7f2d1d" flatShading />
                    </mesh>
                </group>
            ))}
            {/* Misjonskollegiet, åpent foran så vi ser hylla */}
            <group>
                <mesh position={[0, 3.5, -2.4]}>
                    <boxGeometry args={[14, 7, 0.3]} />
                    <meshStandardMaterial color="#e9dcc5" emissive="#4a3a2a" emissiveIntensity={0.25} />
                </mesh>
                <mesh position={[-7, 3.5, 0]}>
                    <boxGeometry args={[0.3, 7, 5]} />
                    <meshStandardMaterial color="#d8c8ae" />
                </mesh>
                <mesh position={[7, 3.5, 0]}>
                    <boxGeometry args={[0.3, 7, 5]} />
                    <meshStandardMaterial color="#d8c8ae" />
                </mesh>
                <mesh position={[0, 7.1, 0]}>
                    <boxGeometry args={[14.6, 0.3, 5.4]} />
                    <meshStandardMaterial color="#7f2d1d" />
                </mesh>
                {[0, 1, 2, 3].map((r) => (
                    <mesh key={r} position={[0, 0.7 + r * 1.55, -1.6]}>
                        <boxGeometry args={[12.6, 0.12, 1.4]} />
                        <meshStandardMaterial color="#6b4423" />
                    </mesh>
                ))}
                <instancedMesh ref={trommer} args={[undefined, mats, TROMMER]} frustumCulled={false}>
                    <cylinderGeometry args={[1, 1, 0.3, 20]} />
                </instancedMesh>
            </group>
            <instancedMesh ref={flammer} args={[undefined, undefined, FLAMMER.length]} frustumCulled={false}>
                <coneGeometry args={[0.7, 1.4, 6]} />
                <meshStandardMaterial color="#ffb02e" emissive="#ff5a00" emissiveIntensity={1.6} transparent opacity={0.92} />
            </instancedMesh>
            <instancedMesh ref={papir} args={[undefined, undefined, ARK]} frustumCulled={false}>
                <planeGeometry args={[0.7, 0.9]} />
                <meshStandardMaterial color="#fff3d6" emissive="#ff8a3a" emissiveIntensity={0.5} side={THREE.DoubleSide} />
            </instancedMesh>
        </>
    );
}

const LAPPER: Record<Modus, string[]> = {
    tro: ['Å omvende: få noen til å bytte tro', 'Døpt, men med den gamle troen', 'Naturen er full av liv', 'Solguden Beaivi', 'Noaiden og trommen'],
    innsamling: ['Trommen i en kasse', 'Symbolene tegnes av', 'Sieidi: en hellig stein', 'Alle må gå i kirken', 'Fram til 1814'],
    brann: ['Flere hundre trommer forsvant', 'Brent, eller sendt til museer', 'København, 1728', 'Misjonskollegiet brenner', 'Brev og rapporter: 1728 og 1795'],
};

export function WestenTromme({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'tro';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const lapper = LAPPER[modus];
    const lapp = lapper[Math.min(beat, lapper.length - 1)];
    const start = KAMERA[modus](0, 0).pos;
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, near: 0.3, far: 400, position: [start.x, start.y, start.z] }}>
                {modus === 'brann' ? <Brann beat={beat} playing={playing} /> : <Landskap modus={modus} beat={beat} playing={playing} />}
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[13%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'brann' && beat === 3 && (
                    <motion.div key="hundre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-[8%] right-[5%]">
                        <Teller verdi={100} etikett="trommer brant" prefiks="ca. " tone="rod" forsinkelse={0.8} />
                    </motion.div>
                )}
                {modus === 'innsamling' && beat === 4 && (
                    <motion.div key="misjonærer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-[8%] top-[24%] bottom-[8%] flex items-center gap-[4%] px-[4%] rounded-3xl bg-white/90 shadow-2xl">
                        <Teller verdi={130} etikett="misjonærer sendt nordover" prefiks="over " forsinkelse={0.4} />
                        <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5 flex-1">
                            {Array.from({ length: 130 }, (_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 + i * 0.012 }}
                                    className="aspect-square rounded-full bg-amber-800"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
