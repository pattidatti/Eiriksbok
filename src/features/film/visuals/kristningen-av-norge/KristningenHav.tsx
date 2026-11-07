import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * 3D-scenene i kristningsfilmen.
 * «svolder»: Olav Tryggvasons skip blir omringet av tre flåter, og kongen forsvinner.
 * «bygging»: en trekirke reiser seg ved gårdene, og himmelen mørkner når bøndene blir sinte.
 * «nidaros»: kirka i kveldslys, lyset fra skrinet, og Nidaros som kirkelig hovedstad.
 * Ingen mennesker vises, og ingen kamp: bare skip, bygninger og lys.
 */

type Modus = 'svolder' | 'bygging' | 'nidaros';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function kameraFor(modus: Modus, beat: number, t: number): { pos: THREE.Vector3; se: THREE.Vector3 } {
    if (modus === 'svolder') {
        switch (beat) {
            case 0:
                return { pos: v(30 - t * 0.5, 9, 34 - t * 0.4), se: v(0, 1.5, 0) };
            case 1:
                return { pos: v(20, 8, 22), se: v(0, 1.5, 0) };
            case 2:
                return { pos: v(0, 50, 46), se: v(0, 0, 6) };
            case 3:
                return { pos: v(13, 5, 13), se: v(0, 1.2, 0) };
            default:
                return { pos: v(4, 62 + t * 0.6, 14), se: v(0, 0, 0) };
        }
    }
    if (modus === 'bygging') {
        switch (beat) {
            case 0:
                return { pos: v(14, 7, 10), se: v(0, 2, -5) };
            case 1:
                return { pos: v(-12 + t * 0.6, 8, 12), se: v(0, 3, -5) };
            case 2:
                return { pos: v(0, 26, 30), se: v(0, 0, -12) };
            default:
                return { pos: v(18, 10, 18), se: v(0, 3, -6) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(17, 6, 14), se: v(3, 1.5, -2) };
        case 1:
            return { pos: v(0, 9, 24), se: v(0, 5, -5) };
        case 2:
            return { pos: v(-22, 14, 22), se: v(0, 3, -8) };
        default:
            return { pos: v(0, 46 + t * 0.4, 40), se: v(0, 0, -10) };
    }
}

/** Skrog sett ovenfra: spiss i begge ender. */
function skrogForm() {
    const s = new THREE.Shape();
    s.moveTo(-5, 0);
    s.quadraticCurveTo(-2.5, 1.3, 0, 1.2);
    s.quadraticCurveTo(2.5, 1.3, 5, 0);
    s.quadraticCurveTo(2.5, -1.3, 0, -1.2);
    s.quadraticCurveTo(-2.5, -1.3, -5, 0);
    return s;
}

function Langskip({
    seil,
    stripe = '#f8fafc',
    seilRef,
}: {
    seil: string;
    stripe?: string;
    seilRef?: React.RefObject<THREE.Group | null>;
}) {
    const skrog = useMemo(
        () => new THREE.ExtrudeGeometry(skrogForm(), { depth: 1, bevelEnabled: false }),
        []
    );
    return (
        <group>
            <mesh geometry={skrog} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
                <meshStandardMaterial color="#7c4a1e" flatShading />
            </mesh>
            {[-1, 1].map((side) => (
                <mesh
                    key={side}
                    position={[side * 5.1, 1.2, 0]}
                    rotation={[0, 0, side * -0.35]}
                >
                    <boxGeometry args={[0.35, 2.4, 0.3]} />
                    <meshStandardMaterial color="#5b3412" flatShading />
                </mesh>
            ))}
            {/* Skjold langs relingen */}
            {[-3, -1.5, 0, 1.5, 3].flatMap((x) =>
                [-1, 1].map((side) => (
                    <mesh
                        key={`${x}-${side}`}
                        position={[x, 0.55, side * 1.18]}
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <cylinderGeometry args={[0.36, 0.36, 0.08, 10]} />
                        <meshStandardMaterial color={side > 0 ? '#facc15' : '#1e3a8a'} />
                    </mesh>
                ))
            )}
            <mesh position={[0, 3.3, 0]}>
                <cylinderGeometry args={[0.1, 0.12, 6.4, 6]} />
                <meshStandardMaterial color="#5b3412" />
            </mesh>
            <group ref={seilRef} position={[0, 5.6, 0]}>
                <mesh position={[0, -1.6, 0]}>
                    <boxGeometry args={[0.06, 3.2, 4.4]} />
                    <meshStandardMaterial color={seil} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.04, -1.6, 0]}>
                    <boxGeometry args={[0.06, 3.2, 0.7]} />
                    <meshStandardMaterial color={stripe} />
                </mesh>
            </group>
        </group>
    );
}

const FLATER = [
    { navn: 'Danskekongen', vinkel: -0.35, seil: '#b91c1c', stripe: '#fca5a5' },
    { navn: 'Sveakongen', vinkel: 1.75, seil: '#1d4ed8', stripe: '#fde047' },
    { navn: 'Ladejarlen', vinkel: 3.85, seil: '#15803d', stripe: '#d9f99d' },
];

function Svolder({ beat, playing }: { beat: number; playing: boolean }) {
    const fiender = useRef<(THREE.Group | null)[]>([]);
    const seil = useRef<THREE.Group>(null);
    const plask = useRef<THREE.Mesh>(null);
    const radius = useRef(80);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const mål = beat === 0 ? 78 : beat === 1 ? 32 : beat === 2 ? 22 : 13;
        radius.current = damp(radius.current, mål, 0.9, dt || 1);
        fiender.current.forEach((g, i) => {
            if (!g) return;
            const flate = FLATER[Math.floor(i / 3)];
            const k = (i % 3) - 1;
            const vinkel = flate.vinkel + k * 0.28;
            const r = radius.current + Math.abs(k) * 3;
            g.position.set(Math.cos(vinkel) * r, Math.sin(tid.current * 1.1 + i) * 0.08, Math.sin(vinkel) * r);
            g.rotation.y = -vinkel + Math.PI / 2;
        });
        if (seil.current) {
            const s = damp(seil.current.scale.y, beat >= 3 ? 0.15 : 1, 1.5, dt || 1);
            seil.current.scale.y = s;
        }
        if (plask.current) {
            const vis = beat === 3;
            plask.current.visible = vis;
            const f = vis ? (tid.current % 3) / 3 : 0;
            plask.current.scale.set(0.4 + f * 4, 0.4 + f * 4, 1);
            (plask.current.material as THREE.MeshBasicMaterial).opacity = vis ? 0.9 * (1 - f) : 0;
        }
    });
    return (
        <>
            <group rotation={[0, 0.3, 0]}>
                <Langskip seil="#f8fafc" stripe="#b91c1c" seilRef={seil} />
                {beat === 1 && (
                    <Html position={[0, 9, 0]} center zIndexRange={[10, 0]}>
                        <div className="px-4 py-2 rounded-xl bg-white/95 shadow-xl text-2xl font-black text-slate-900 whitespace-nowrap">
                            Olav Tryggvason
                        </div>
                    </Html>
                )}
            </group>
            <mesh ref={plask} rotation={[-Math.PI / 2, 0, 0]} position={[1.5, 0.08, 3.2]}>
                <ringGeometry args={[0.7, 1, 32]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
            </mesh>
            {FLATER.flatMap((f, fi) =>
                [0, 1, 2].map((k) => (
                    <group
                        key={`${fi}-${k}`}
                        ref={(g) => {
                            fiender.current[fi * 3 + k] = g;
                        }}
                        position={[Math.cos(f.vinkel) * 78, 0, Math.sin(f.vinkel) * 78]}
                    >
                        <Langskip seil={f.seil} stripe={f.stripe} />
                    </group>
                ))
            )}
            {beat === 2 &&
                FLATER.map((f) => (
                    <Html
                        key={f.navn}
                        position={[Math.cos(f.vinkel) * 22, 9, Math.sin(f.vinkel) * 22]}
                        center
                        zIndexRange={[10, 0]}
                    >
                        <div
                            className="px-4 py-2 rounded-xl shadow-xl text-2xl font-black text-white whitespace-nowrap"
                            style={{ background: f.seil }}
                        >
                            {f.navn}
                        </div>
                    </Html>
                ))}
        </>
    );
}

/** Tak som et prisme langs x-aksen. */
function takGeometri(lengde: number, bredde: number, hoyde: number) {
    const s = new THREE.Shape();
    s.moveTo(-bredde / 2, 0);
    s.lineTo(0, hoyde);
    s.lineTo(bredde / 2, 0);
    s.lineTo(-bredde / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: lengde, bevelEnabled: false });
    g.translate(0, 0, -lengde / 2);
    g.rotateY(Math.PI / 2);
    return g;
}

function Kirke({
    vegg,
    tak,
    vinduLys,
}: {
    vegg: React.RefObject<THREE.Group | null>;
    tak: React.RefObject<THREE.Group | null>;
    vinduLys?: THREE.Material;
}) {
    const takG = useMemo(() => takGeometri(7, 5, 2.6), []);
    const tarnTak = useMemo(() => new THREE.ConeGeometry(1.3, 2.6, 4), []);
    return (
        <group>
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[7.6, 0.3, 4.6]} />
                <meshStandardMaterial color="#9ca3af" flatShading />
            </mesh>
            {[
                [-3.4, -2],
                [3.4, -2],
                [-3.4, 2],
                [3.4, 2],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 2.2, z]}>
                    <boxGeometry args={[0.4, 4, 0.4]} />
                    <meshStandardMaterial color="#5b3412" flatShading />
                </mesh>
            ))}
            <group ref={vegg} position={[0, 0.3, 0]} scale={[1, 0.001, 1]}>
                <mesh position={[0, 2, 0]}>
                    <boxGeometry args={[7, 4, 4]} />
                    <meshStandardMaterial color="#8b5a2b" flatShading />
                </mesh>
                {vinduLys &&
                    [-2, 0, 2].map((x) => (
                        <mesh key={x} position={[x, 2.4, 2.02]} material={vinduLys}>
                            <planeGeometry args={[0.6, 1]} />
                        </mesh>
                    ))}
                <mesh position={[3.52, 1.2, 0]} material={vinduLys}>
                    <boxGeometry args={[0.05, 2.2, 1.2]} />
                    {!vinduLys && <meshStandardMaterial color="#3b2410" />}
                </mesh>
            </group>
            <group ref={tak} position={[0, 4.3, 0]} scale={[1, 0.001, 1]}>
                <mesh geometry={takG}>
                    <meshStandardMaterial color="#3b2410" flatShading />
                </mesh>
                <mesh position={[2.6, 2.9, 0]}>
                    <boxGeometry args={[1.6, 2.4, 1.6]} />
                    <meshStandardMaterial color="#6b4423" flatShading />
                </mesh>
                <mesh geometry={tarnTak} position={[2.6, 5.4, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <meshStandardMaterial color="#3b2410" flatShading />
                </mesh>
                <mesh position={[2.6, 7.4, 0]}>
                    <boxGeometry args={[0.18, 1.4, 0.18]} />
                    <meshStandardMaterial color="#facc15" />
                </mesh>
                <mesh position={[2.6, 7.6, 0]}>
                    <boxGeometry args={[0.18, 0.18, 0.8]} />
                    <meshStandardMaterial color="#facc15" />
                </mesh>
            </group>
        </group>
    );
}

const BONDER: [number, number][] = [
    [-5, 1],
    [-3, 3],
    [4, 2.5],
    [6.5, 0.5],
    [-7, -1.5],
];

/** Enkle bondefigurer foran kirka. Sinte: røde utropstegn over hodene. */
function Bonder({ sinte }: { sinte: boolean }) {
    return (
        <>
            {BONDER.map(([x, z], i) => (
                <group key={i} position={[x, 0.3, z]}>
                    <mesh position={[0, 0.7, 0]}>
                        <cylinderGeometry args={[0.35, 0.5, 1.4, 8]} />
                        <meshStandardMaterial color={['#7c2d12', '#365314', '#1e3a8a', '#713f12', '#4c1d95'][i]} />
                    </mesh>
                    <mesh position={[0, 1.7, 0]}>
                        <sphereGeometry args={[0.32, 10, 10]} />
                        <meshStandardMaterial color="#f1d3b3" />
                    </mesh>
                    {sinte && i % 2 === 1 && (
                        <Html position={[0, 3, 0]} center zIndexRange={[10, 0]}>
                            <div className="text-4xl font-black text-red-600" style={{ textShadow: '0 0 6px #fff' }}>
                                !
                            </div>
                        </Html>
                    )}
                </group>
            ))}
        </>
    );
}

function Langhus({ position, rotasjon = 0 }: { position: [number, number, number]; rotasjon?: number }) {
    const tak = useMemo(() => takGeometri(8, 3.6, 1.6), []);
    return (
        <group position={position} rotation={[0, rotasjon, 0]}>
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[8, 1.8, 3.2]} />
                <meshStandardMaterial color="#7c5a3a" flatShading />
            </mesh>
            <mesh geometry={tak} position={[0, 1.8, 0]}>
                <meshStandardMaterial color="#4d7c0f" flatShading />
            </mesh>
        </group>
    );
}

/** Lykter som beveger seg mot kirka: folk som kommer. Ikke et antall. */
const LYKTER = 14;

const TRAER: [number, number, number][] = Array.from({ length: 36 }, (_, i) => {
    const a = i * 2.39996;
    const r = 22 + (i % 6) * 4;
    return [Math.cos(a) * r, 0.3, -18 + Math.sin(a) * r * 0.5 - 6];
}).filter(([, , z]) => z < 4) as [number, number, number][];

function Traer() {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame(() => {
        const m = ref.current;
        if (!m || m.userData.satt) return;
        TRAER.forEach((p, i) => {
            o.position.set(p[0], p[1] + 1.6, p[2]);
            o.scale.setScalar(0.8 + (i % 4) * 0.15);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
        m.userData.satt = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, TRAER.length]} frustumCulled={false}>
            <coneGeometry args={[1.2, 3.4, 6]} />
            <meshStandardMaterial color="#166534" flatShading />
        </instancedMesh>
    );
}

function Bygda({ beat, playing, modus }: { beat: number; playing: boolean; modus: Modus }) {
    const vegg = useRef<THREE.Group>(null);
    const tak = useRef<THREE.Group>(null);
    const lysKjegle = useRef<THREE.Mesh>(null);
    const kveld = modus === 'nidaros';
    const vinduLys = useMemo(
        () => new THREE.MeshBasicMaterial({ color: '#ffd27a', side: THREE.DoubleSide }),
        []
    );
    const husVindu = useRef<THREE.MeshBasicMaterial>(null);
    const kiste = useRef<THREE.Group>(null);
    const lykter = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const veggMål = modus === 'bygging' ? (beat === 0 ? 0.5 : 1) : 1;
        const takMål = modus === 'bygging' ? (beat >= 1 ? 1 : 0.001) : 1;
        if (vegg.current) vegg.current.scale.y = damp(vegg.current.scale.y, veggMål, 0.8, dt || 1);
        if (tak.current) tak.current.scale.y = damp(tak.current.scale.y, takMål, 1, dt || 1);
        if (lysKjegle.current) {
            const m = lysKjegle.current.material as THREE.MeshBasicMaterial;
            m.opacity = damp(m.opacity, kveld && beat >= 1 ? 0.2 : 0, 1.5, dt || 1);
            lysKjegle.current.visible = m.opacity > 0.01;
        }
        tid.current += dt;
        if (kiste.current) {
            const mål = beat === 0 ? 0.6 : -2;
            kiste.current.position.y = damp(kiste.current.position.y, mål, 0.7, dt || 1);
            kiste.current.visible = kiste.current.position.y > -1.5;
        }
        if (lykter.current) {
            lykter.current.visible = kveld && beat >= 2;
            lykter.current.children.forEach((c, i) => {
                const f = ((tid.current * 0.08 + i / LYKTER) % 1);
                const vinkel = (i / LYKTER) * Math.PI * 2;
                const r = 30 - f * 24;
                c.position.set(Math.cos(vinkel) * r, 0.9, -5 + Math.sin(vinkel) * r * 0.7);
            });
        }
        if (husVindu.current) {
            husVindu.current.color.set(kveld && beat >= 2 ? '#ffd27a' : '#2b1d10');
        }
    });
    const skala = kveld ? 1.6 : 1;
    return (
        <>
            {/* Land og fjord */}
            <mesh position={[0, -0.8, -34]}>
                <boxGeometry args={[160, 2.2, 80]} />
                <meshStandardMaterial color={kveld ? '#4d7c0f' : '#65a30d'} flatShading />
            </mesh>
            {[
                [-40, -60, 22],
                [10, -70, 28],
                [55, -58, 18],
            ].map(([x, z, h], i) => (
                <mesh key={i} position={[x, h / 2 - 1, z]}>
                    <coneGeometry args={[h * 1.3, h, 7]} />
                    <meshStandardMaterial color={kveld ? '#334155' : '#64748b'} flatShading />
                </mesh>
            ))}
            <Traer />
            <group position={[0, 0.3, -5]} scale={skala}>
                <Kirke vegg={vegg} tak={tak} vinduLys={kveld ? vinduLys : undefined} />
            </group>
            {modus === 'bygging' && beat >= 2 && <Bonder sinte={beat >= 3} />}
            {modus === 'bygging' && beat === 0 && (
                <group position={[5.5, 0.6, -1.5]}>
                    {[0, 1, 2, 3].map((i) => (
                        <mesh key={i} position={[0, i * 0.42, (i % 2) * 0.2]} rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.2, 0.2, 4, 6]} />
                            <meshStandardMaterial color="#a16207" />
                        </mesh>
                    ))}
                </group>
            )}
            {[
                { p: [-15, 0.3, -12] as [number, number, number], r: 0.3 },
                { p: [14, 0.3, -15] as [number, number, number], r: -0.4 },
                { p: [-6, 0.3, -24] as [number, number, number], r: 0.1 },
                { p: [17, 0.3, -2] as [number, number, number], r: 1.2 },
            ].map((h, i) => (
                <group key={i}>
                    <Langhus position={h.p} rotasjon={h.r} />
                    <mesh position={[h.p[0], 1, h.p[2]]} rotation={[0, h.r, 0]}>
                        <boxGeometry args={[1, 0.7, 3.3]} />
                        <meshBasicMaterial ref={i === 0 ? husVindu : undefined} color="#2b1d10" />
                    </mesh>
                </group>
            ))}
            {modus === 'nidaros' && (
                <>
                    <group ref={lykter}>
                        {Array.from({ length: LYKTER }, (_, i) => (
                            <mesh key={i}>
                                <sphereGeometry args={[0.28, 8, 8]} />
                                <meshBasicMaterial color="#fde68a" />
                            </mesh>
                        ))}
                    </group>
                    <mesh ref={lysKjegle} position={[0, 18, -5]}>
                        <cylinderGeometry args={[1.5, 6, 30, 16, 1, true]} />
                        <meshBasicMaterial color="#fde68a" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
                    </mesh>
                    {/* Graven: åpnet, med jordhaugen ved siden og kista som løftes opp */}
                    <group position={[6, 0.3, 1]}>
                        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[2.6, 1.4]} />
                            <meshBasicMaterial color="#1c1917" />
                        </mesh>
                        <mesh position={[0, 0.3, -1.6]} scale={[1.6, 0.6, 0.7]}>
                            <sphereGeometry args={[1, 12, 8]} />
                            <meshStandardMaterial color="#57534e" flatShading />
                        </mesh>
                        <group ref={kiste} position={[0, -0.6, 0]}>
                            <mesh>
                                <boxGeometry args={[2.2, 0.6, 0.9]} />
                                <meshStandardMaterial color="#78350f" flatShading />
                            </mesh>
                        </group>
                        <mesh position={[1.8, 0.5, 0.4]}>
                            <sphereGeometry args={[0.18, 8, 8]} />
                            <meshBasicMaterial color="#ffd27a" />
                        </mesh>
                        <pointLight position={[1.8, 1, 0.4]} intensity={6} distance={8} color="#ffd27a" />
                    </group>
                </>
            )}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const sol = useRef<THREE.DirectionalLight>(null);
    const himmel = useRef<THREE.Color>(null);
    const kveld = modus === 'nidaros';
    const morkt = modus === 'bygging' && beat >= 3;

    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mål = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        se.current.lerp(mål.se, k);
        camera.lookAt(se.current);
        if (sol.current) sol.current.intensity = damp(sol.current.intensity, morkt ? 0.35 : kveld ? 1.0 : 1.5, 1.2, dt || 1);
        if (himmel.current) himmel.current.lerp(new THREE.Color(morkt ? '#64748b' : kveld ? '#f59e70' : '#cfe3f2'), dt ? 1 - Math.exp(-1.2 * dt) : 1);
    });

    const bakgrunn = kveld ? '#f59e70' : modus === 'svolder' ? '#c7d6e2' : '#cfe3f2';
    return (
        <>
            <color ref={himmel} attach="background" args={[bakgrunn]} />
            <fog attach="fog" args={[kveld ? '#e49a7a' : '#c7d6e2', modus === 'svolder' ? 50 : 60, modus === 'svolder' ? 170 : 220]} />
            <ambientLight intensity={kveld ? 0.85 : 0.7} />
            <hemisphereLight args={[kveld ? '#fbbf8a' : '#e0f2fe', '#1e3a5f', 0.5]} />
            <directionalLight ref={sol} position={kveld ? [-40, 14, -20] : [30, 50, 25]} intensity={1.5} color={kveld ? '#ffb17a' : '#fff6e5'} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[700, 700]} />
                <meshStandardMaterial
                    color={kveld ? '#3b5b7a' : '#3c7aa8'}
                    emissive={kveld ? '#3a2a2a' : '#0b2540'}
                    emissiveIntensity={0.4}
                    roughness={0.5}
                />
            </mesh>
            {modus === 'svolder' ? (
                <Svolder beat={beat} playing={playing} />
            ) : (
                <Bygda beat={beat} playing={playing} modus={modus} />
            )}
        </>
    );
}

const MERKER: Partial<Record<Modus, (string | null)[]>> = {
    bygging: ['Plikt: bygge kirker', 'Plikt: holde dem ved like', 'En ny hverdag', 'Bøndene blir sinte'],
    nidaros: [
        'Året etter: tatt opp av graven',
        'Skrinet på høyalteret i Klemenskirken',
        'Mirakler, og fiender som angret',
        'Nidaros: Norges kirkelige hovedstad',
    ],
    svolder: [null, null, null, 'Hoppet over bord, ifølge sagaene', 'Hvordan gikk det til?'],
};

/** Skrinet på høyalteret, tegnet som et innfelt bilde fra innsiden av kirka. */
function Skrin() {
    return (
        <div className="absolute pointer-events-none" style={{ right: '4%', bottom: '8%', width: '34%' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="rounded-2xl bg-white/95 shadow-xl p-2"
            >
                <svg viewBox="0 0 400 260" className="w-full h-auto">
                    <rect x={0} y={0} width={400} height={260} rx={14} fill="#3b2410" />
                    <circle cx={200} cy={110} r={110} fill="#fde68a" opacity={0.35} />
                    <rect x={90} y={170} width={220} height={70} fill="#a8a29e" />
                    <rect x={80} y={160} width={240} height={14} fill="#d6d3d1" />
                    <path d="M 130 160 L 130 110 L 200 72 L 270 110 L 270 160 Z" fill="#facc15" stroke="#a16207" strokeWidth={5} />
                    <path d="M 200 86 v 40 M 186 100 h 28" stroke="#a16207" strokeWidth={6} strokeLinecap="round" />
                </svg>
                <div className="text-center text-2xl font-black text-slate-900 pb-1">skrin på høyalteret</div>
            </motion.div>
        </div>
    );
}

export function KristningenHav({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'svolder';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const merke = MERKER[modus]?.[Math.min(beat, (MERKER[modus]?.length ?? 1) - 1)] ?? null;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 900, position: [30, 9, 34] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            {modus === 'nidaros' && beat === 1 && <Skrin />}
            <AnimatePresence>
                {merke && (
                    <div key={merke} className="absolute inset-x-0 flex justify-center pointer-events-none" style={{ top: '7%' }}>
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl"
                        >
                            {merke}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
