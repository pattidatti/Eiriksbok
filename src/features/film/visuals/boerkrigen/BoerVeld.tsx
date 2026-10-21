import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Høysletta i Sør-Afrika, bygd av enkle former. «garden»: en boergård der soldatene
 * kommer, kuene drives bort og åkeren og huset brenner, og familien kjøres bort på en
 * vogn. «blokkhus»: jernbanen, geriljaen, brent jord og blokkhusene med piggtråd.
 * «leir»: teltleiren bak piggtråd som fylles. «bedre»: Emily Hobhouse og forbedringene.
 *
 * Filmen viser aldri vold mot mennesker. Soldatene rir inn, men ingen blir skadet, og
 * ingen er i husene når de brenner.
 */

type Modus = 'garden' | 'blokkhus' | 'leir' | 'bedre';

type Brann = { flamme: number; brent: number };
const KALD: Brann = { flamme: 0, brent: 0 };
const BRENNER: Brann = { flamme: 1, brent: 0.5 };
const ASKE: Brann = { flamme: 0.15, brent: 1 };

const SVART = new THREE.Color('#1f1a17');
const GLOD = new THREE.Color('#ff7a1a');

/** Hvor mye hver brann flammer akkurat nå. Leses av røyken og ildlyset. */
const NIVAA: number[] = Array.from({ length: 12 }, () => 0);
const KILDE: THREE.Vector3[] = Array.from({ length: 12 }, () => new THREE.Vector3(0, -50, 0));

// ---------------------------------------------------------------- sletta

function Sletta() {
    const koppier = useMemo(
        () =>
            Array.from({ length: 10 }, (_, i) => {
                const vinkel = (i / 10) * Math.PI * 2 + frø(i) * 0.4;
                const r = 95 + frø(i + 7) * 40;
                return {
                    x: Math.cos(vinkel) * r,
                    z: Math.sin(vinkel) * r,
                    r: 12 + frø(i + 3) * 10,
                    h: 5 + frø(i + 9) * 6,
                };
            }),
        []
    );
    const traer = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => ({
                x: (frø(i + 40) - 0.5) * 150,
                z: (frø(i + 60) - 0.5) * 150,
                s: 0.8 + frø(i + 80) * 0.6,
            })).filter((t) => Math.hypot(t.x, t.z) > 26),
        []
    );
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#c9b273" emissive="#5b4a22" emissiveIntensity={0.3} />
            </mesh>
            {koppier.map((k, i) => (
                <mesh key={i} position={[k.x, k.h / 2, k.z]}>
                    <cylinderGeometry args={[k.r * 0.55, k.r, k.h, 9]} />
                    <meshStandardMaterial color="#a08452" emissive="#4a3a1c" emissiveIntensity={0.25} flatShading />
                </mesh>
            ))}
            {traer.map((t, i) => (
                <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
                    <mesh position={[0, 1.4, 0]}>
                        <cylinderGeometry args={[0.18, 0.25, 2.8, 5]} />
                        <meshStandardMaterial color="#5b4636" />
                    </mesh>
                    {/* Akasie: flat krone */}
                    <mesh position={[0, 3.1, 0]} scale={[1, 0.32, 1]}>
                        <sphereGeometry args={[2.2, 8, 6]} />
                        <meshStandardMaterial color="#6b7f3a" flatShading />
                    </mesh>
                </group>
            ))}
        </>
    );
}

// ---------------------------------------------------------------- gården

/** Et trekantet tak som ligger langs husets lengde. */
function useTak(b: number, d: number, hoyde: number) {
    return useMemo(() => {
        const form = new THREE.Shape();
        form.moveTo(-d / 2 - 0.3, 0);
        form.lineTo(d / 2 + 0.3, 0);
        form.lineTo(0, hoyde);
        form.closePath();
        const g = new THREE.ExtrudeGeometry(form, { depth: b + 0.5, bevelEnabled: false });
        g.translate(0, 0, -(b + 0.5) / 2);
        g.rotateY(Math.PI / 2);
        return g;
    }, [b, d, hoyde]);
}

interface GaardProps {
    x: number;
    z: number;
    rot?: number;
    s?: number;
    hus: Brann;
    aaker: Brann;
    indeks: number;
    playing: boolean;
    uthevet?: boolean;
}

/** Våningshus med tak og åker ved siden av. Hver kan brenne for seg. */
function Gaard({ x, z, rot = 0, s = 1, hus, aaker, indeks, playing, uthevet = false }: GaardProps) {
    const kropp = useRef<THREE.Mesh>(null);
    const tak = useRef<THREE.Mesh>(null);
    const flammer = useRef<THREE.Group>(null);
    const aakerRef = useRef<THREE.Mesh>(null);
    const aakerFlammer = useRef<THREE.Group>(null);
    const ring = useRef<THREE.Mesh>(null);
    const st = useRef({ hf: 0, hb: 0, af: 0, ab: 0, tid: 0, forste: true });
    const takGeo = useTak(6, 4.2, 2);
    const hvit = useMemo(() => new THREE.Color('#ece6d6'), []);
    const takFarge = useMemo(() => new THREE.Color('#8a9096'), []);
    const korn = useMemo(() => new THREE.Color('#e0b84a'), []);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const t = st.current;
        if (t.forste) {
            t.hf = hus.flamme;
            t.hb = hus.brent;
            t.af = aaker.flamme;
            t.ab = aaker.brent;
            t.forste = false;
        }
        t.tid += dt;
        t.hf = damp(t.hf, hus.flamme, 1.4, dt);
        t.hb = damp(t.hb, hus.brent, 0.5, dt);
        t.af = damp(t.af, aaker.flamme, 1.4, dt);
        t.ab = damp(t.ab, aaker.brent, 0.6, dt);
        NIVAA[indeks] = Math.max(t.hf, t.af * 0.7);
        KILDE[indeks].set(x, 3 * s, z);

        const hoyde = 1 - t.hb * 0.8;
        if (kropp.current) {
            kropp.current.scale.y = hoyde;
            kropp.current.position.y = (2.6 * hoyde) / 2;
            const m = kropp.current.material as THREE.MeshStandardMaterial;
            m.color.copy(hvit).lerp(SVART, Math.min(1, t.hb * 1.3));
            m.emissive.copy(GLOD);
            m.emissiveIntensity = t.hf * (0.45 + 0.15 * Math.sin(t.tid * 9 + indeks));
        }
        if (tak.current) {
            tak.current.visible = t.hb < 0.5;
            tak.current.position.y = 2.6 * hoyde;
            (tak.current.material as THREE.MeshStandardMaterial).color
                .copy(takFarge)
                .lerp(SVART, Math.min(1, t.hb * 1.6));
        }
        if (flammer.current) {
            flammer.current.visible = t.hf > 0.03;
            flammer.current.position.y = 2.6 * hoyde + 0.3;
            flammer.current.children.forEach((c, k) => {
                const f = t.hf * (0.8 + 0.25 * Math.sin(t.tid * (7 + k * 3) + indeks));
                c.scale.set(t.hf, f * (1.2 + k * 0.3), t.hf);
            });
        }
        if (aakerRef.current) {
            const m = aakerRef.current.material as THREE.MeshStandardMaterial;
            m.color.copy(korn).lerp(SVART, Math.min(1, t.ab * 1.2));
            m.emissive.copy(GLOD);
            m.emissiveIntensity = t.af * 0.5;
        }
        if (aakerFlammer.current) {
            aakerFlammer.current.visible = t.af > 0.03;
            aakerFlammer.current.children.forEach((c, k) => {
                const f = t.af * (0.7 + 0.3 * Math.sin(t.tid * (6 + k) + k));
                c.scale.set(t.af, f, t.af);
            });
        }
        if (ring.current) ring.current.visible = uthevet;
    });

    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]} scale={s}>
            <mesh ref={kropp}>
                <boxGeometry args={[6, 2.6, 4.2]} />
                <meshStandardMaterial color="#ece6d6" flatShading />
            </mesh>
            <mesh ref={tak} geometry={takGeo} position={[0, 2.6, 0]}>
                <meshStandardMaterial color="#8a9096" flatShading />
            </mesh>
            {/* Pipa blir stående */}
            <mesh position={[2, 2.1, 0]}>
                <boxGeometry args={[0.6, 4.2, 0.6]} />
                <meshStandardMaterial color="#7a6a5a" flatShading />
            </mesh>
            <group ref={flammer} visible={false}>
                {[-1.6, 0.2, 1.5].map((fx, k) => (
                    <mesh key={k} position={[fx, 0.8, (k - 1) * 0.6]}>
                        <coneGeometry args={[1, 2.6, 6]} />
                        <meshBasicMaterial color={k === 1 ? '#ffd166' : '#ff6b1a'} transparent opacity={0.9} />
                    </mesh>
                ))}
            </group>
            {/* Åkeren */}
            <mesh ref={aakerRef} rotation={[-Math.PI / 2, 0, 0]} position={[-10, 0.05, 6]}>
                <planeGeometry args={[11, 8]} />
                <meshStandardMaterial color="#e0b84a" />
            </mesh>
            <group ref={aakerFlammer} position={[-10, 0, 6]} visible={false}>
                {[
                    [-3.5, -2],
                    [0, -2.5],
                    [3.4, -1.6],
                    [-2.2, 1.8],
                    [1.8, 2.2],
                ].map(([fx, fz], k) => (
                    <mesh key={k} position={[fx, 0.8, fz]}>
                        <coneGeometry args={[1, 1.8, 6]} />
                        <meshBasicMaterial color={k % 2 ? '#ffd166' : '#ff6b1a'} transparent opacity={0.85} />
                    </mesh>
                ))}
            </group>
            <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[-3, 0.15, 3]} visible={false}>
                <ringGeometry args={[9, 10.2, 40]} />
                <meshBasicMaterial color="#facc15" />
            </mesh>
        </group>
    );
}

const ROYK = 90;
const ROYK_DELER = Array.from({ length: ROYK }, (_, i) => ({
    kilde: i % 12,
    alder: frø(i + 50) * 7,
    dx: (frø(i + 80) - 0.5) * 2,
}));

/** Røyk fra det som brenner. Hver partikkel hører til én brann. */
function Royk({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        for (let i = 0; i < ROYK; i++) {
            const p = ROYK_DELER[i];
            p.alder += dt;
            if (p.alder > 7) p.alder -= 7;
            const k = KILDE[p.kilde];
            const n = NIVAA[p.kilde] ?? 0;
            const s = n < 0.05 ? 0 : (0.8 + p.alder * 0.5) * Math.min(1, n * 1.4);
            tmp.position.set(k.x + p.dx + p.alder * 1.2, k.y + p.alder * 2, k.z - p.alder * 0.6);
            tmp.scale.setScalar(s);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, ROYK]} frustumCulled={false}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#5a5450" emissive="#2a211a" transparent opacity={0.5} flatShading depthWrite={false} />
        </instancedMesh>
    );
}

// ---------------------------------------------------------------- folk, dyr og vogner

/** En rytter til hest. Glir mot målet og vugger når den beveger seg. */
function Rytter({
    mål,
    farge,
    playing,
    synlig = true,
}: {
    mål: THREE.Vector3;
    farge: string;
    playing: boolean;
    synlig?: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const st = useRef({ forste: true, tid: 0 });
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        g.visible = synlig;
        if (st.current.forste) {
            g.position.copy(mål);
            st.current.forste = false;
        }
        const fra = g.position.clone();
        g.position.lerp(mål, 1 - Math.exp(-0.7 * dt));
        const fart = fra.distanceTo(g.position) / Math.max(dt, 1e-4);
        st.current.tid += dt;
        if (fart > 0.3) {
            g.rotation.y = Math.atan2(mål.x - g.position.x, mål.z - g.position.z);
            g.position.y = Math.abs(Math.sin(st.current.tid * 9)) * 0.25;
        } else g.position.y = 0;
    });
    return (
        <group ref={ref}>
            <mesh position={[0, 1.3, 0]}>
                <boxGeometry args={[0.8, 0.9, 2.2]} />
                <meshStandardMaterial color="#6b4428" flatShading />
            </mesh>
            <mesh position={[0, 2, 1.1]} rotation={[0.6, 0, 0]}>
                <boxGeometry args={[0.45, 1.1, 0.5]} />
                <meshStandardMaterial color="#6b4428" flatShading />
            </mesh>
            {[
                [-0.3, 0.8],
                [0.3, 0.8],
                [-0.3, -0.8],
                [0.3, -0.8],
            ].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, 0.45, lz]}>
                    <boxGeometry args={[0.2, 0.9, 0.2]} />
                    <meshStandardMaterial color="#4a2f1c" />
                </mesh>
            ))}
            <mesh position={[0, 2.3, -0.1]}>
                <capsuleGeometry args={[0.28, 0.7, 3, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 3.05, -0.1]}>
                <sphereGeometry args={[0.24, 10, 8]} />
                <meshStandardMaterial color="#d9b99b" />
            </mesh>
        </group>
    );
}

/** Kuene i kveet. Fra beat 2 drives de bort. */
function Kuer({ bort, playing }: { bort: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const plasser = useMemo(
        () =>
            Array.from({ length: 6 }, (_, i) => ({
                hjemme: v(-9 + (i % 3) * 2.2, 0, -8 + Math.floor(i / 3) * 2.4),
                borte: v(34 + (i % 3) * 2.5, 0, -30 + Math.floor(i / 3) * 3),
                rot: frø(i + 5) * Math.PI,
            })),
        []
    );
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        g.children.forEach((c, i) => {
            const p = plasser[i];
            const mål = bort ? p.borte : p.hjemme;
            if (forste.current) c.position.copy(mål);
            else c.position.lerp(mål, 1 - Math.exp(-0.35 * dt));
            c.rotation.y = bort ? Math.atan2(p.borte.x - p.hjemme.x, p.borte.z - p.hjemme.z) : p.rot;
        });
        forste.current = false;
    });
    return (
        <group ref={ref}>
            {plasser.map((_, i) => (
                <group key={i}>
                    <mesh position={[0, 0.9, 0]}>
                        <boxGeometry args={[0.9, 0.9, 1.8]} />
                        <meshStandardMaterial color={i % 2 ? '#3f2a1d' : '#e8e0d0'} flatShading />
                    </mesh>
                    <mesh position={[0, 1.2, 1.1]}>
                        <boxGeometry args={[0.5, 0.5, 0.6]} />
                        <meshStandardMaterial color={i % 2 ? '#2f1f15' : '#cfc6b4'} flatShading />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Kveet: en ring av lave steiner. */
function Kve() {
    return (
        <group position={[-7, 0, -6]}>
            {Array.from({ length: 22 }, (_, i) => {
                const a = (i / 22) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(a) * 5, 0.35, Math.sin(a) * 4]}>
                        <boxGeometry args={[1.3, 0.7, 0.8]} />
                        <meshStandardMaterial color="#9a8b78" flatShading />
                    </mesh>
                );
            })}
        </group>
    );
}

/** En mann, kvinne eller et barn: kapsel og hode. Brukes i vognene. */
function Person({ x, y, z, farge, s = 1 }: { x: number; y: number; z: number; farge: string; s?: number }) {
    return (
        <group position={[x, y, z]} scale={s}>
            <mesh position={[0, 0.55, 0]}>
                <capsuleGeometry args={[0.24, 0.6, 3, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 1.2, 0]}>
                <sphereGeometry args={[0.2, 10, 8]} />
                <meshStandardMaterial color="#e2c4a8" />
            </mesh>
        </group>
    );
}

/** Oksevogn med kalesje. `folk` er fargene på dem som sitter på. */
function Vogn({
    mål,
    playing,
    synlig,
    folk,
}: {
    mål: THREE.Vector3;
    playing: boolean;
    synlig: boolean;
    folk: string[];
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        g.visible = synlig;
        if (forste.current || !synlig) {
            g.position.copy(mål);
            forste.current = false;
        }
        const fra = g.position.clone();
        g.position.lerp(mål, 1 - Math.exp(-0.3 * dt));
        if (fra.distanceTo(g.position) > 1e-3)
            g.rotation.y = Math.atan2(g.position.x - fra.x, g.position.z - fra.z);
    });
    return (
        <group ref={ref} visible={false}>
            <mesh position={[0, 1.1, 0]}>
                <boxGeometry args={[2.2, 0.5, 4.6]} />
                <meshStandardMaterial color="#7a5636" flatShading />
            </mesh>
            {/* Kalesjen bak, åpen foran så folkene synes */}
            <mesh position={[0, 1.35, -1.1]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[1.25, 1.25, 2.4, 10, 1, true, 0, Math.PI]} />
                <meshStandardMaterial color="#f1ebdc" side={THREE.DoubleSide} flatShading />
            </mesh>
            {[
                [-1.15, 1.6],
                [1.15, 1.6],
                [-1.15, -1.6],
                [1.15, -1.6],
            ].map(([hx, hz], i) => (
                <mesh key={i} position={[hx, 0.65, hz]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.65, 0.65, 0.2, 12]} />
                    <meshStandardMaterial color="#3b2a1d" />
                </mesh>
            ))}
            {/* To okser foran */}
            {[-0.6, 0.6].map((ox, i) => (
                <mesh key={i} position={[ox, 0.9, 3.6]}>
                    <boxGeometry args={[0.8, 0.9, 1.7]} />
                    <meshStandardMaterial color="#5a3b26" flatShading />
                </mesh>
            ))}
            {folk.map((f, i) => (
                <Person key={i} x={(i % 2 ? 0.5 : -0.5)} y={1.3} z={0.9 - Math.floor(i / 2) * 1.1} farge={f} s={i >= 2 ? 0.7 : 1} />
            ))}
        </group>
    );
}

// ---------------------------------------------------------------- jernbane og blokkhus

const ANGREP = v(10, 0, 0);
/** Gårdene langs jernbanen. De fire første ligger innenfor 16 km fra angrepet. */
const GAARDER: { x: number; z: number; rot: number }[] = [
    { x: -6, z: 17, rot: 0.3 },
    { x: 24, z: -16, rot: -0.4 },
    { x: 33, z: 13, rot: 1.1 },
    { x: 2, z: -21, rot: 0.8 },
    { x: -52, z: -26, rot: 0.2 },
    { x: -42, z: 32, rot: -0.6 },
    { x: 58, z: 30, rot: 0.5 },
    { x: 62, z: -32, rot: -1.0 },
    { x: -74, z: 6, rot: 0.9 },
];
const RADIUS = 30;

function Jernbane({ playing, rykk }: { playing: boolean; rykk: boolean }) {
    const sviller = useRef<THREE.InstancedMesh>(null);
    const ant = 110;
    const tmp = useMemo(() => new THREE.Object3D(), []);
    const ferdig = useRef(false);
    useFrame(() => {
        const m = sviller.current;
        if (!m || ferdig.current) return;
        for (let i = 0; i < ant; i++) {
            tmp.position.set(-110 + i * 2, 0.08, 0);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
        ferdig.current = true;
    });
    const roykRef = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        if (roykRef.current) {
            roykRef.current.visible = rykk;
            roykRef.current.children.forEach((c, i) => {
                const a = (tid.current * 0.4 + i * 0.25) % 1;
                c.position.set(ANGREP.x + Math.sin(i) * 0.8 + a * 2, 0.8 + a * 7, Math.cos(i) * 0.6);
                c.scale.setScalar(0.6 + a * 1.8);
            });
        }
    });
    return (
        <>
            <instancedMesh ref={sviller} args={[undefined, undefined, ant]} frustumCulled={false}>
                <boxGeometry args={[0.6, 0.16, 2.6]} />
                <meshStandardMaterial color="#5a4632" />
            </instancedMesh>
            {/* Skinnene, med et brudd der geriljaen slo til */}
            {[-0.7, 0.7].map((z) => (
                <group key={z}>
                    <mesh position={[(-110 + ANGREP.x - 1.5) / 2, 0.25, z]}>
                        <boxGeometry args={[ANGREP.x - 1.5 + 110, 0.18, 0.18]} />
                        <meshStandardMaterial color="#4b5563" />
                    </mesh>
                    <mesh position={[(ANGREP.x + 1.5 + 110) / 2, 0.25, z]}>
                        <boxGeometry args={[110 - ANGREP.x - 1.5, 0.18, 0.18]} />
                        <meshStandardMaterial color="#4b5563" />
                    </mesh>
                </group>
            ))}
            {/* Et skinnestykke som er revet løs */}
            <mesh position={[ANGREP.x + 0.4, 0.3, 2.4]} rotation={[0, 0.7, 0.1]}>
                <boxGeometry args={[3, 0.18, 0.18]} />
                <meshStandardMaterial color="#4b5563" />
            </mesh>
            <group ref={roykRef}>
                {Array.from({ length: 6 }, (_, i) => (
                    <mesh key={i}>
                        <dodecahedronGeometry args={[1, 0]} />
                        <meshStandardMaterial color="#6b6460" transparent opacity={0.55} depthWrite={false} flatShading />
                    </mesh>
                ))}
            </group>
        </>
    );
}

const BLOKKHUS_X = [-96, -80, -64, -48, -32, -16, 0, 22, 38, 54, 70, 86];

/** Blokkhus langs jernbanen, bundet sammen med piggtråd og telefonlinje. */
function Blokkhus({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const s = damp(g.scale.y, synlig ? 1 : 0.001, 1.4, dt || (synlig ? 1e3 : 0));
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} scale={[1, 0.001, 1]}>
            {BLOKKHUS_X.map((x) => (
                <group key={x} position={[x, 0, -5]}>
                    <mesh position={[0, 1.6, 0]}>
                        <cylinderGeometry args={[1.8, 1.9, 3.2, 8]} />
                        <meshStandardMaterial color="#8a8f94" flatShading />
                    </mesh>
                    <mesh position={[0, 3.8, 0]}>
                        <coneGeometry args={[2.3, 1.4, 8]} />
                        <meshStandardMaterial color="#4b5563" flatShading />
                    </mesh>
                    {/* Skyteskår */}
                    <mesh position={[0, 2.2, 1.85]}>
                        <boxGeometry args={[1.2, 0.25, 0.1]} />
                        <meshBasicMaterial color="#111827" />
                    </mesh>
                </group>
            ))}
            {/* Piggtråd i to høyder, og telefonlinja over */}
            {[0.7, 1.3].map((y) => (
                <mesh key={y} position={[-5, y, -9]}>
                    <boxGeometry args={[190, 0.06, 0.06]} />
                    <meshBasicMaterial color="#1f2937" />
                </mesh>
            ))}
            {Array.from({ length: 48 }, (_, i) => (
                <mesh key={i} position={[-100 + i * 4, 0.8, -9]}>
                    <boxGeometry args={[0.15, 1.6, 0.15]} />
                    <meshStandardMaterial color="#5b4636" />
                </mesh>
            ))}
            <mesh position={[-5, 4.6, -5]}>
                <boxGeometry args={[190, 0.05, 0.05]} />
                <meshBasicMaterial color="#111827" />
            </mesh>
            {Array.from({ length: 16 }, (_, i) => (
                <mesh key={i} position={[-100 + i * 12.5 + 6, 2.4, -5]}>
                    <cylinderGeometry args={[0.1, 0.12, 4.8, 5]} />
                    <meshStandardMaterial color="#4a3a2c" />
                </mesh>
            ))}
        </group>
    );
}

/** Ring på bakken: alt innenfor 16 km fra angrepet. */
function Radius({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        m.visible = synlig;
        (m.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.2 * Math.sin(tid.current * 3);
    });
    return (
        <mesh ref={ref} position={[ANGREP.x, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <ringGeometry args={[RADIUS - 0.9, RADIUS, 72]} />
            <meshBasicMaterial color="#dc2626" transparent opacity={0.8} />
        </mesh>
    );
}

// ---------------------------------------------------------------- leiren

const LEIR_X = [-28, 28];
const LEIR_Z = [-22, 16];
const TELT: { x: number; z: number }[] = (() => {
    const ut: { x: number; z: number }[] = [];
    for (let r = 0; r < 11; r++)
        for (let k = 0; k < 16; k++) {
            const x = -24 + k * 3.2 + (r % 2) * 1.2;
            const z = -19 + r * 3.1;
            // Plass til porten og gata inn
            if (Math.abs(x) < 6 && z > 4) continue;
            ut.push({ x, z });
        }
    // De første teltene står nær porten, de siste lengst inne.
    return ut.sort((a, b) => b.z - a.z + (Math.abs(a.x) - Math.abs(b.x)) * 0.2);
})();

function teltAntall(modus: Modus, beat: number) {
    if (modus === 'bedre') return TELT.length;
    if (beat === 0) return 22;
    if (beat === 1) return 80;
    return TELT.length;
}

function Telt({ antall, playing }: { antall: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const skala = useRef<number[]>(TELT.map(() => 0));
    const forste = useRef(true);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        for (let i = 0; i < TELT.length; i++) {
            const mål = i < antall ? 1 : 0;
            // Teltene reiser seg ett og ett når leiren vokser.
            const vent = Math.max(0, i - 22) * 0.004;
            skala.current[i] = forste.current ? mål : skala.current[i] + (mål - skala.current[i]) * Math.min(1, dt * (mål > skala.current[i] ? 2.5 - vent : 3));
            const s = skala.current[i];
            tmp.position.set(TELT[i].x, (2.2 * s) / 2, TELT[i].z);
            tmp.scale.set(s || 1e-4, s || 1e-4, s || 1e-4);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        }
        forste.current = false;
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, TELT.length]} frustumCulled={false}>
            <coneGeometry args={[1.15, 2.2, 8]} />
            <meshStandardMaterial color="#f4f1ea" emissive="#6b6552" emissiveIntensity={0.25} flatShading />
        </instancedMesh>
    );
}

/** Gjerdet rundt leiren: stolper og piggtråd. */
function Gjerde({ flaggSivilt }: { flaggSivilt: boolean }) {
    const [x0, x1] = LEIR_X;
    const [z0, z1] = LEIR_Z;
    const stolper = useMemo(() => {
        const ut: [number, number][] = [];
        for (let x = x0; x <= x1; x += 4) {
            ut.push([x, z0]);
            if (Math.abs(x) > 3) ut.push([x, z1]);
        }
        for (let z = z0 + 4; z < z1; z += 4) {
            ut.push([x0, z]);
            ut.push([x1, z]);
        }
        return ut;
    }, [x0, x1, z0, z1]);
    const flagg = useRef<THREE.Mesh>(null);
    useFrame(() => {
        if (flagg.current)
            (flagg.current.material as THREE.MeshStandardMaterial).color.set(flaggSivilt ? '#2563eb' : '#b91c1c');
    });
    const b = x1 - x0;
    const d = z1 - z0;
    return (
        <group>
            {stolper.map(([x, z], i) => (
                <mesh key={i} position={[x, 0.9, z]}>
                    <boxGeometry args={[0.16, 1.8, 0.16]} />
                    <meshStandardMaterial color="#5b4636" />
                </mesh>
            ))}
            {[0.6, 1.1, 1.6].map((y) => (
                <group key={y}>
                    <mesh position={[0, y, z0]}>
                        <boxGeometry args={[b, 0.05, 0.05]} />
                        <meshBasicMaterial color="#1f2937" />
                    </mesh>
                    <mesh position={[(x0 - 3) / 2, y, z1]}>
                        <boxGeometry args={[-3 - x0, 0.05, 0.05]} />
                        <meshBasicMaterial color="#1f2937" />
                    </mesh>
                    <mesh position={[(x1 + 3) / 2, y, z1]}>
                        <boxGeometry args={[x1 - 3, 0.05, 0.05]} />
                        <meshBasicMaterial color="#1f2937" />
                    </mesh>
                    <mesh position={[x0, y, (z0 + z1) / 2]}>
                        <boxGeometry args={[0.05, 0.05, d]} />
                        <meshBasicMaterial color="#1f2937" />
                    </mesh>
                    <mesh position={[x1, y, (z0 + z1) / 2]}>
                        <boxGeometry args={[0.05, 0.05, d]} />
                        <meshBasicMaterial color="#1f2937" />
                    </mesh>
                </group>
            ))}
            {/* Porten med flaggstang */}
            <mesh position={[-3, 1.6, z1]}>
                <boxGeometry args={[0.35, 3.2, 0.35]} />
                <meshStandardMaterial color="#4a3a2c" />
            </mesh>
            <mesh position={[3, 1.6, z1]}>
                <boxGeometry args={[0.35, 3.2, 0.35]} />
                <meshStandardMaterial color="#4a3a2c" />
            </mesh>
            <mesh position={[0, 3.2, z1]}>
                <boxGeometry args={[6.4, 0.3, 0.3]} />
                <meshStandardMaterial color="#4a3a2c" />
            </mesh>
            <mesh position={[5, 3.5, z1 + 1]}>
                <cylinderGeometry args={[0.08, 0.08, 7, 6]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
            <mesh ref={flagg} position={[6.1, 6.2, z1 + 1]}>
                <boxGeometry args={[2.2, 1.3, 0.06]} />
                <meshStandardMaterial color="#b91c1c" />
            </mesh>
        </group>
    );
}

const FOLK_MAKS = 70;
const FARGER_FOLK = ['#3b3f4a', '#5a3d2e', '#2f3b52', '#6b4e3d', '#4b4453', '#334155'];

/** Hvor folkene i leiren står, per beat. Menn som har gitt seg først, så kvinner og barn. */
function folkFor(modus: Modus, beat: number): { x: number; z: number; s: number; farge: string }[] {
    const ant = modus === 'leir' ? (beat === 0 ? 8 : beat >= 4 ? FOLK_MAKS : 44) : 44;
    const tett = modus === 'leir' && beat >= 4;
    return Array.from({ length: ant }, (_, i) => {
        const telt = TELT[(i * 3) % 60];
        const vinkel = frø(i + 200) * Math.PI * 2;
        const r = 1.6 + frø(i + 300) * (tett ? 0.8 : 1.4);
        const barn = i >= 8 && i % 3 === 0;
        return {
            x: telt.x + Math.cos(vinkel) * r,
            z: telt.z + Math.sin(vinkel) * r,
            s: barn ? 0.65 : 1,
            farge: i < 8 ? '#57534e' : FARGER_FOLK[i % FARGER_FOLK.length],
        };
    });
}

function Folk({ modus, beat }: { modus: Modus; beat: number }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const liste = useMemo(() => folkFor(modus, beat), [modus, beat]);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    const farge = useMemo(() => new THREE.Color(), []);
    useFrame(() => {
        const k = kropp.current;
        const h = hode.current;
        if (!k || !h) return;
        for (let i = 0; i < FOLK_MAKS; i++) {
            const p = liste[i];
            const s = p ? p.s : 1e-4;
            tmp.position.set(p?.x ?? 0, 0.55 * s, p?.z ?? 0);
            tmp.scale.setScalar(s);
            tmp.updateMatrix();
            k.setMatrixAt(i, tmp.matrix);
            if (p) k.setColorAt(i, farge.set(p.farge));
            tmp.position.setY(1.2 * s);
            tmp.updateMatrix();
            h.setMatrixAt(i, tmp.matrix);
        }
        k.instanceMatrix.needsUpdate = true;
        if (k.instanceColor) k.instanceColor.needsUpdate = true;
        h.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, FOLK_MAKS]} frustumCulled={false}>
                <capsuleGeometry args={[0.24, 0.6, 3, 8]} />
                <meshStandardMaterial color="#ffffff" />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, FOLK_MAKS]} frustumCulled={false}>
                <sphereGeometry args={[0.2, 10, 8]} />
                <meshStandardMaterial color="#e2c4a8" />
            </instancedMesh>
        </>
    );
}

/** To hauger med matsekker: én stor, én liten. */
function Sekker({ synlig }: { synlig: boolean }) {
    const hauger = [
        { x: -3.2, ant: 9 },
        { x: 3.2, ant: 3 },
    ];
    return (
        <group visible={synlig}>
            {hauger.map((h) =>
                Array.from({ length: h.ant }, (_, i) => {
                    const lag = i < 4 ? 0 : i < 7 ? 1 : 2;
                    const iLag = lag === 0 ? i : lag === 1 ? i - 4 : i - 7;
                    const bredde = lag === 0 ? 4 : lag === 1 ? 3 : 2;
                    return (
                        <mesh key={`${h.x}-${i}`} position={[h.x + (iLag - (bredde - 1) / 2) * 0.95, 0.4 + lag * 0.7, 8]}>
                            <boxGeometry args={[0.9, 0.7, 1.1]} />
                            <meshStandardMaterial color="#d6c29a" flatShading />
                        </mesh>
                    );
                })
            )}
        </group>
    );
}

/** Forbedringene: vanntanker og et sykehustelt. */
function Forbedringer({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const s = damp(g.scale.y, synlig ? 1 : 0.001, 1.5, dt || (synlig ? 1e3 : 0));
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} scale={[1, 0.001, 1]}>
            {[-14, 14].map((x) => (
                <group key={x} position={[x, 0, 11]}>
                    <mesh position={[0, 2.6, 0]}>
                        <cylinderGeometry args={[1.4, 1.4, 2, 12]} />
                        <meshStandardMaterial color="#60a5fa" flatShading />
                    </mesh>
                    {[-1, 1].map((sx) =>
                        [-1, 1].map((sz) => (
                            <mesh key={`${sx}${sz}`} position={[sx, 0.8, sz]}>
                                <boxGeometry args={[0.15, 1.6, 0.15]} />
                                <meshStandardMaterial color="#4a3a2c" />
                            </mesh>
                        ))
                    )}
                </group>
            ))}
            {/* Sykehustelt med rødt kors */}
            <group position={[0, 0, -8]}>
                <mesh position={[0, 1.6, 0]}>
                    <boxGeometry args={[10, 3.2, 5]} />
                    <meshStandardMaterial color="#fafaf9" emissive="#78716c" emissiveIntensity={0.15} flatShading />
                </mesh>
                <mesh position={[0, 1.9, 2.52]}>
                    <boxGeometry args={[2, 0.6, 0.05]} />
                    <meshBasicMaterial color="#dc2626" />
                </mesh>
                <mesh position={[0, 1.9, 2.52]}>
                    <boxGeometry args={[0.6, 2, 0.05]} />
                    <meshBasicMaterial color="#dc2626" />
                </mesh>
            </group>
        </group>
    );
}

/** Søyler av røyk langt bak leiren: gårder som brenner ute på sletta. */
function FjernRoyk({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        g.visible = synlig;
        g.children.forEach((søyle, i) => {
            søyle.children.forEach((c, k) => {
                const a = (tid.current * 0.15 + k / 6 + i * 0.13) % 1;
                c.position.set(a * 6, a * 26, 0);
                c.scale.setScalar(2 + a * 5);
            });
        });
    });
    return (
        <group ref={ref} visible={false}>
            {[-60, -25, 15, 50, 80].map((x, i) => (
                <group key={x} position={[x, 0, -90 - i * 8]}>
                    {Array.from({ length: 6 }, (_, k) => (
                        <mesh key={k}>
                            <dodecahedronGeometry args={[1, 0]} />
                            <meshStandardMaterial color="#4b4542" transparent opacity={0.55} depthWrite={false} flatShading />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------- tilstand per beat

function gardenBrann(beat: number): { hus: Brann; aaker: Brann } {
    return {
        aaker: beat >= 3 ? ASKE : beat === 2 ? BRENNER : KALD,
        hus: beat >= 3 ? BRENNER : KALD,
    };
}

function blokkhusBrann(i: number, beat: number): Brann {
    const innenfor = i < 4;
    if (beat === 3) return innenfor ? BRENNER : KALD;
    if (beat === 4) return innenfor ? ASKE : BRENNER;
    if (beat >= 5) return ASKE;
    return KALD;
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'garden') {
        switch (beat) {
            case 0:
                return { pos: v(-3 + t * 0.2, 10, 27), se: v(-4, 1, -3) };
            case 1:
                return { pos: v(26, 7, 18), se: v(6, 2, -2) };
            case 2:
                return { pos: v(-24, 9, 24), se: v(-6, 1, 0) };
            case 3:
                return { pos: v(14, 6, 19), se: v(2, 1.8, 0) };
            default:
                return { pos: v(50, 10 + t * 0.1, -54), se: v(0, 2, 0) };
        }
    }
    if (modus === 'blokkhus') {
        switch (beat) {
            case 0:
                return { pos: v(ANGREP.x + 18, 7, 16), se: v(ANGREP.x - 2, 1, -2) };
            case 1:
                return { pos: v(40, 30, 55), se: v(0, 0, -15) };
            case 2:
                return { pos: v(4, 58, 62), se: v(4, 0, 0) };
            case 3:
                return { pos: v(ANGREP.x, 72, 56), se: v(ANGREP.x, 0, 0) };
            case 4:
                return { pos: v(-10, 95, 96), se: v(0, 0, -4) };
            default:
                return { pos: v(-62 + t * 1.1, 7, 16), se: v(-30 + t * 1.1, 2, -5) };
        }
    }
    if (modus === 'leir') {
        switch (beat) {
            case 0:
                return { pos: v(22, 10, 42), se: v(0, 1, 6) };
            case 1:
                return { pos: v(-22, 9, 48), se: v(0, 1, 16) };
            case 2:
                return { pos: v(0, 18, 64), se: v(0, 6, -30) };
            case 3:
                return { pos: v(0, 62, 34), se: v(0, 0, -3) };
            case 4:
                return { pos: v(11, 5, 22), se: v(0, 1.5, 8) };
            default:
                return { pos: v(0, 4.5, 17), se: v(0, 1, 8) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(7, 4, 30), se: v(0, 1.6, 17) };
        case 1:
            return { pos: v(-6, 5, 34), se: v(6, 1, 21) };
        case 2:
            return { pos: v(26, 18, 42), se: v(0, 1, 2) };
        default:
            return { pos: v(9, 5, 30), se: v(3, 3.5, 16) };
    }
}

const HIMMEL: Record<Modus, string[]> = {
    garden: ['#bcd3e6', '#bcd3e6', '#a9b7c2', '#9c9a99', '#a29a92'],
    blokkhus: ['#c4d6e4', '#c4d6e4', '#c4d6e4', '#a8a8a8', '#9a948f', '#b7c7d4'],
    leir: ['#c9d8e4', '#c9d8e4', '#a9a6a2', '#c9d8e4', '#b5b8bb', '#b5b8bb'],
    bedre: ['#c9d8e4', '#c9d8e4', '#d4e3ee', '#d4e3ee'],
};

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    const bakgrunn = useRef<THREE.Color>(null);
    const taake = useRef<THREE.Fog>(null);
    const ild = useRef<THREE.PointLight>(null);
    const forste = useRef(true);
    const maalFarge = useMemo(() => new THREE.Color(), []);

    // Rytternes mål. I «blokkhus» rir geriljaen bort fra jernbanen i beat 0.
    const ryttere = useMemo(() => [v(0, 0, 0), v(0, 0, 0), v(0, 0, 0), v(0, 0, 0)], []);
    const vognMål = useMemo(() => [v(0, 0, 0), v(0, 0, 0), v(0, 0, 0)], []);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const liste = HIMMEL[modus];
        maalFarge.set(liste[Math.min(beat, liste.length - 1)]);
        const k = forste.current ? 1 : 1 - Math.exp(-0.8 * dt);
        forste.current = false;
        bakgrunn.current?.lerp(maalFarge, k);
        taake.current?.color.lerp(maalFarge, k);
        const snitt = NIVAA.reduce((a, b) => a + b, 0) / 4;
        if (ild.current) ild.current.intensity = Math.min(1.5, snitt) * 60;

        const t = beatTid.current;
        const r = ryttere;
        if (modus === 'garden') {
            const inne = beat >= 1;
            const plass = [v(10, 0, -4), v(13, 0, 0), v(8, 0, -8), v(14, 0, -6)];
            r.forEach((m, i) => {
                if (!inne) m.set(70 + i * 3, 0, -26 + i * 2);
                else if (beat === 2 && i === 0) m.set(30, 0, -26);
                else m.copy(plass[i]);
            });
            const vm = vognMål[0];
            if (beat <= 3) vm.set(4, 0, 7);
            else vm.set(4 + Math.min(t, 14) * 2.6, 0, 7 - Math.min(t, 14) * 1.2);
        } else if (modus === 'blokkhus') {
            r.forEach((m, i) => {
                if (beat === 0 && t < 1.8) m.set(ANGREP.x + 2 + i * 1.6, 0, 4 + i);
                else m.set(-34 + i * 2.5, 0, -64 - i * 2);
            });
        } else {
            const ankommet = beat >= 1 || modus === 'bedre';
            vognMål[0].set(ankommet ? -5 : -30, 0, ankommet ? 22 : 44);
            vognMål[1].set(ankommet ? 4 : -38, 0, ankommet ? 24 : 52);
            const inspeksjon = modus === 'bedre' && beat >= 1;
            vognMål[2].set(inspeksjon ? 10 : -40, 0, inspeksjon ? 23 : 50);
        }
    });

    const garden = modus === 'garden';
    const blokkhus = modus === 'blokkhus';
    const leir = modus === 'leir' || modus === 'bedre';
    const gb = gardenBrann(beat);

    return (
        <>
            <color ref={bakgrunn} attach="background" args={[HIMMEL[modus][0]]} />
            <fog ref={taake} attach="fog" args={[HIMMEL[modus][0], 70, 230]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#e9eef5', '#7a6a4a', 0.75]} />
            <directionalLight position={[40, 60, 30]} intensity={1.15} color="#fff4e0" />
            <pointLight ref={ild} position={[0, 8, 0]} color="#ff8a3d" intensity={0} distance={80} decay={1} />
            <Sletta />
            {garden && (
                <>
                    <Gaard x={0} z={0} hus={gb.hus} aaker={gb.aaker} indeks={0} playing={playing} />
                    <Kve />
                    {beat <= 2 && <Kuer bort={beat >= 2} playing={playing} />}
                    {/* Mannen, langt ute på sletta, på en liten kopje */}
                    <mesh position={[40, 2, -40]}>
                        <cylinderGeometry args={[4, 7, 4, 9]} />
                        <meshStandardMaterial color="#a08452" emissive="#4a3a1c" emissiveIntensity={0.25} flatShading />
                    </mesh>
                    <group position={[40, 4, -40]}>
                        <Rytter mål={v(0, 0, 0)} farge="#57534e" playing={playing} synlig={beat >= 4} />
                    </group>
                </>
            )}
            {blokkhus &&
                GAARDER.map((g, i) => (
                    <Gaard
                        key={i}
                        x={g.x}
                        z={g.z}
                        rot={g.rot}
                        s={0.8}
                        hus={blokkhusBrann(i, beat)}
                        aaker={blokkhusBrann(i, beat)}
                        indeks={i}
                        playing={playing}
                        uthevet={beat === 2}
                    />
                ))}
            {blokkhus && (
                <>
                    <Jernbane playing={playing} rykk={beat <= 1} />
                    <Radius synlig={beat === 3} playing={playing} />
                    <Blokkhus synlig={beat >= 5} playing={playing} />
                </>
            )}
            {(garden || blokkhus) &&
                ryttere.map((m, i) => (
                    <Rytter
                        key={i}
                        mål={m}
                        farge={garden ? '#8a7a4e' : '#57534e'}
                        playing={playing}
                        synlig={garden || i < 3}
                    />
                ))}
            {garden && (
                <Vogn
                    mål={vognMål[0]}
                    playing={playing}
                    synlig={beat >= 3}
                    folk={['#2f3b52', '#5a3d2e', '#6b4e3d', '#334155']}
                />
            )}
            {leir && (
                <>
                    <Telt antall={teltAntall(modus, beat)} playing={playing} />
                    <Gjerde flaggSivilt={modus === 'bedre' && beat >= 3} />
                    <Folk modus={modus} beat={beat} />
                    <Vogn mål={vognMål[0]} playing={playing} synlig={modus === 'leir' && (beat === 1 || beat === 2)} folk={['#2f3b52', '#5a3d2e', '#6b4e3d', '#334155']} />
                    <Vogn mål={vognMål[1]} playing={playing} synlig={modus === 'leir' && (beat === 1 || beat === 2)} folk={['#4b4453', '#3b3f4a', '#6b4e3d']} />
                    <Vogn mål={vognMål[2]} playing={playing} synlig={modus === 'bedre' && beat >= 1} folk={['#7c3aed', '#7c3aed', '#7c3aed', '#7c3aed']} />
                    <Sekker synlig={modus === 'leir' && beat >= 5} />
                    <Forbedringer synlig={modus === 'bedre' && beat >= 2} playing={playing} />
                    <FjernRoyk synlig={modus === 'leir' && beat === 2} playing={playing} />
                    {modus === 'bedre' && <Hobhouse beat={beat} playing={playing} />}
                </>
            )}
            <Royk playing={playing} />
        </>
    );
}

/** Emily Hobhouse ved porten, med en gul ring rundt seg i første beat. */
function Hobhouse({ beat, playing }: { beat: number; playing: boolean }) {
    const ring = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        if (ring.current) {
            ring.current.visible = beat === 0;
            const s = 1 + 0.08 * Math.sin(tid.current * 3);
            ring.current.scale.set(s, s, s);
        }
    });
    return (
        <group position={[1.5, 0, 19]}>
            <Person x={0} y={0} z={0} farge="#ca8a04" s={1.15} />
            <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[0.9, 1.2, 32]} />
                <meshBasicMaterial color="#facc15" />
            </mesh>
        </group>
    );
}

const LAPPER: Record<Modus, string[]> = {
    garden: [
        '1901: en gård på høysletta',
        'Britiske soldater rir inn',
        'Kuene drives bort, kornet brenner',
        'Huset brenner, familien må gå',
        'Mannen kjemper ute på sletta',
    ],
    blokkhus: [
        'Angrep på jernbanen',
        'Geriljakrig',
        'Gårdene gir mat',
        'Brent jord: 16 km fra angrepet',
        'Kitchener: enda hardere',
        'Blokkhus og piggtråd',
    ],
    leir: [
        'September 1900: de første leirene',
        'Kvinner og barn kommer',
        'For å knekke motstanden',
        'Konsentrasjonsleir: mange samlet',
        'Overfylte telt',
        'Mindre mat til noen',
    ],
    bedre: [
        'Emily Hobhouse',
        'Kvinner sendes for å undersøke',
        'Forholdene blir bedre',
        'Fra november 1901: sivile styrer',
    ],
};

export function BoerVeld({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'garden';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const liste = LAPPER[modus];
    const lapp = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 500, position: [34, 14, 30] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'leir' && beat >= 5 && (
                    <motion.div key="sekker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <span className="absolute bottom-[8%] left-[17%] px-4 py-2 rounded-xl bg-white/95 text-slate-900 font-black text-xl md:text-2xl shadow-xl">
                            andre familier
                        </span>
                        <span className="absolute bottom-[8%] right-[9%] px-4 py-2 rounded-xl bg-red-600 text-white font-black text-xl md:text-2xl shadow-xl">
                            familier til dem som kjempet
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
