import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Et lite, tenkt landskap i 3D der et nytt dialekttrekk sprer seg. Bygdene er to små hus,
 * byene er klynger av høye hus. Takene får farge når trekket når fram.
 *
 * «fjord»: to nabobygder på hver side av en fjord snakker likt, så zoomer vi ut og ser to
 * byer langt fra hverandre med samme nye trekk, og bygdene imellom som før.
 * «dam»: en stein i en stille dam, ringene brer seg utover og når husene rundt.
 * «bolge»: bølgemodellen. Trekket ruller fra bygd til bygd og dør ut før fjellene.
 * «sprang»: sprangmodellen. Trekket hopper fra Oslo til Tromsø og hopper over bygdene.
 */

type Modus = 'fjord' | 'dam' | 'bolge' | 'sprang';

interface Sted {
    x: number;
    z: number;
    by?: boolean;
    navn?: string;
}

const UTEN = new THREE.Color('#a8a29e');
const BY_UTEN = new THREE.Color('#cbd5e1');
const NYTT = new THREE.Color('#f97316');
const LIKT = new THREE.Color('#0d9488');

/* ---------- Oppsett per modus ---------- */

const FJORD_A: Sted = { x: -3, z: -7 };
const FJORD_B: Sted = { x: 4, z: 7 };
const FJORD_MELLOM: Sted[] = [
    { x: -44, z: -10 },
    { x: -32, z: 9 },
    { x: -20, z: -12 },
    { x: 20, z: 12 },
    { x: 32, z: -9 },
    { x: 44, z: 10 },
];
const FJORD_BYER: Sted[] = [
    { x: -62, z: 0, by: true },
    { x: 62, z: 0, by: true },
];

const BOLGE_KILDE: Sted = { x: -38, z: 0 };
const BOLGE_BYGDER: Sted[] = (() => {
    const ut: Sted[] = [];
    const xs = [-38, -23, -8, 7, 21];
    const zs = [-24, -8, 8, 24];
    xs.forEach((x, i) =>
        zs.forEach((z, j) => {
            if (x === -38 && (z === -8 || z === 8)) return;
            ut.push({ x: x + ((i + j) % 2 ? 2.5 : -2), z: z + (i % 2 ? 3 : -2) });
        })
    );
    ut.push({ x: -38, z: 0 });
    // Bortenfor fjellene: bølgen når aldri hit.
    [-18, 0, 18].forEach((z, i) => ut.push({ x: 46 + (i % 2) * 6, z }));
    return ut;
})();
const BOLGE_RADIUS = [6, 18, 34, 50, 60];
const FJELLRYGG = 33;

const OSLO: Sted = { x: -52, z: 14, by: true, navn: 'Oslo' };
const TROMSO: Sted = { x: 52, z: -14, by: true, navn: 'Tromsø' };
const SPRANG_BYGDER: Sted[] = (() => {
    const ut: Sted[] = [];
    [-34, -17, 0, 17, 34].forEach((x, i) =>
        [-22, 0, 22].forEach((z, j) =>
            ut.push({ x: x + (j % 2 ? 3 : -2), z: z + (i % 2 ? 4 : -3) })
        )
    );
    return ut;
})();

const DAM_HUS: Sted[] = Array.from({ length: 10 }, (_, i) => {
    const v = (i / 10) * Math.PI * 2 + 0.3;
    const r = 18 + (i % 3) * 5;
    return { x: Math.cos(v) * r, z: Math.sin(v) * r };
});

function fjell(modus: Modus): [number, number, number][] {
    if (modus === 'fjord')
        return [
            [-12, -24, 9],
            [6, -26, 11],
            [22, -22, 8],
            [-38, 26, 8],
            [36, 30, 9],
            [-50, -26, 9],
            [52, -26, 10],
        ];
    if (modus === 'bolge')
        return Array.from({ length: 9 }, (_, i) => [
            FJELLRYGG + (i % 2) * 2,
            -32 + i * 8,
            8 + (i % 3) * 2,
        ]);
    if (modus === 'sprang')
        return [
            [-20, -34, 9],
            [10, -36, 10],
            [30, 34, 8],
            [-6, 36, 9],
        ];
    return [];
}

function steder(modus: Modus): Sted[] {
    if (modus === 'fjord') return [FJORD_A, FJORD_B, ...FJORD_MELLOM, ...FJORD_BYER];
    if (modus === 'bolge') return BOLGE_BYGDER;
    if (modus === 'sprang') return [...SPRANG_BYGDER, OSLO, TROMSO];
    return DAM_HUS;
}

/* ---------- Kamera ---------- */

type V3 = [number, number, number];
function kameraFor(modus: Modus, beat: number): { pos: V3; se: V3 } {
    if (modus === 'fjord') {
        if (beat === 0) return { pos: [10, 12, 30], se: [0, 0, 0] };
        if (beat === 1) return { pos: [0, 13, 26], se: [0, 0, 0] };
        return { pos: [0, 82, 80], se: [0, 0, -4] };
    }
    if (modus === 'dam') {
        if (beat === 0) return { pos: [0, 12, 28], se: [0, 3, 0] };
        if (beat === 1) return { pos: [0, 14, 26], se: [0, 1, 0] };
        if (beat === 2) return { pos: [0, 26, 32], se: [0, 0, 0] };
        return { pos: [0, 48, 52], se: [0, 0, 0] };
    }
    if (modus === 'bolge') {
        if (beat === 0) return { pos: [-24, 34, 44], se: [-30, 0, 0] };
        if (beat === 1) return { pos: [-14, 52, 60], se: [-18, 0, 0] };
        return { pos: [-2, 92, 88], se: [-2, 0, 2] };
    }
    return { pos: [0, 84, 80], se: [0, 0, -2] };
}

/* ---------- Byggeklosser ---------- */

function Bygd({ sted, mat, skala = 1 }: { sted: Sted; mat: THREE.Material; skala?: number }) {
    return (
        <group position={[sted.x, 0, sted.z]} scale={skala}>
            {[
                [-1.1, 0.4],
                [1.2, -0.6],
            ].map(([dx, dz], i) => (
                <group key={i} position={[dx, 0, dz]}>
                    <mesh position={[0, 0.7, 0]}>
                        <boxGeometry args={[1.8, 1.4, 1.6]} />
                        <meshStandardMaterial color="#f5efe3" />
                    </mesh>
                    <mesh position={[0, 1.95, 0]} rotation={[0, Math.PI / 4, 0]} material={mat}>
                        <coneGeometry args={[1.5, 1.1, 4]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function By({ sted, mat, skala = 1 }: { sted: Sted; mat: THREE.Material; skala?: number }) {
    const hus: [number, number, number][] = [
        [0, 0, 7],
        [-2.6, 1.4, 4.5],
        [2.6, -1, 5.5],
        [-1, -2.8, 3.5],
        [1.6, 2.8, 4],
    ];
    return (
        <group position={[sted.x, 0, sted.z]} scale={skala}>
            {hus.map(([dx, dz, h], i) => (
                <mesh key={i} position={[dx, h / 2, dz]} material={mat}>
                    <boxGeometry args={[2.2, h, 2.2]} />
                </mesh>
            ))}
        </group>
    );
}

function Fjell({ x, z, h }: { x: number; z: number; h: number }) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]}>
                <coneGeometry args={[h * 0.75, h, 7]} />
                <meshStandardMaterial color="#8b8f86" flatShading />
            </mesh>
            <mesh position={[0, h * 0.86, 0]}>
                <coneGeometry args={[h * 0.21, h * 0.28, 7]} />
                <meshStandardMaterial color="#ffffff" flatShading />
            </mesh>
        </group>
    );
}

/* ---------- Scenen ---------- */

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const liste = useMemo(() => steder(modus), [modus]);
    const mats = useMemo(
        () =>
            liste.map(
                (s) =>
                    new THREE.MeshStandardMaterial({
                        color: s.by ? BY_UTEN.clone() : UTEN.clone(),
                        flatShading: true,
                    })
            ),
        [liste]
    );
    const beatTid = useRef(0);
    const sistBeat = useRef(beat);
    const forste = useRef(true);
    const kamSe = useRef(new THREE.Vector3());
    const radius = useRef(0);
    const ring = useRef<THREE.Mesh>(null);
    const ringMat = useRef<THREE.MeshBasicMaterial>(null);
    const stein = useRef<THREE.Mesh>(null);
    const damRinger = useRef<(THREE.Mesh | null)[]>([]);
    const bue = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.Mesh>(null);
    const spokelse = useRef<THREE.Mesh>(null);
    const spokelseMat = useRef<THREE.MeshBasicMaterial>(null);

    const buePunkter = useMemo(() => {
        const kurve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(OSLO.x, 7, OSLO.z),
            new THREE.Vector3(0, 40, 0),
            new THREE.Vector3(TROMSO.x, 7, TROMSO.z)
        );
        return kurve.getPoints(47);
    }, []);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(({ camera }, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== sistBeat.current) {
            sistBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);

        // Fargen på hvert tak.
        let bueFram = 0;
        if (modus === 'sprang') bueFram = beat === 1 ? Math.min(1, t / 1.6) : beat >= 2 ? 1 : 0;
        if (modus === 'bolge') {
            const mal = BOLGE_RADIUS[Math.min(beat, BOLGE_RADIUS.length - 1)];
            radius.current = forste.current
                ? mal
                : THREE.MathUtils.damp(radius.current, mal, 1.1, dt);
        }
        liste.forEach((s, i) => {
            let mal = s.by ? BY_UTEN : UTEN;
            if (modus === 'fjord') {
                if ((s === FJORD_A || s === FJORD_B) && beat >= 1) mal = LIKT;
                if (s.by && beat >= 2) mal = NYTT;
            } else if (modus === 'bolge') {
                const d = Math.hypot(s.x - BOLGE_KILDE.x, s.z - BOLGE_KILDE.z);
                if (d <= radius.current + 0.5 && s.x < FJELLRYGG) mal = NYTT;
            } else if (modus === 'sprang') {
                if (s === OSLO) mal = NYTT;
                if (s === TROMSO && bueFram >= 1) mal = NYTT;
            } else if (modus === 'dam') {
                const r = Math.hypot(s.x, s.z);
                if (beat >= 3 && t > (r - 15) * 0.18) mal = NYTT;
            }
            const m = mats[i];
            if (forste.current) m.color.copy(mal);
            else m.color.lerp(mal, 1 - Math.exp(-4 * dt));
        });

        // Bølgefronten.
        if (ring.current && ringMat.current) {
            const r = Math.max(0.5, radius.current);
            ring.current.scale.set(r, r, 1);
            ringMat.current.opacity = beat >= 4 ? Math.max(0, 0.75 - t / 2.2) : 0.75;
        }

        // Steinen og ringene i dammen.
        if (stein.current) {
            let y = 7;
            if (beat === 1) y = Math.max(-2, 7 - 9 * t * t);
            else if (beat >= 2) y = -2;
            stein.current.position.y = y;
            stein.current.visible = y > -1.5;
        }
        damRinger.current.forEach((m, i) => {
            if (!m) return;
            const aktiv = (beat === 1 && t > 0.9) || beat >= 2;
            const start = beat === 1 ? 0.9 : 0;
            const fase = (t - start - i * 0.9) / 3.6;
            const syk = ((fase % 1) + 1) % 1;
            const r = 0.5 + syk * (beat >= 3 ? 30 : 14);
            m.visible = aktiv && (beat !== 1 || fase >= 0);
            m.scale.set(r, r, 1);
            (m.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - syk);
        });

        // Spranget: prikker langs buen.
        if (bue.current) {
            const n = Math.floor(bueFram * buePunkter.length);
            buePunkter.forEach((p, i) => {
                dummy.position.copy(p);
                dummy.scale.setScalar(i < n ? 1 : 0.0001);
                dummy.updateMatrix();
                bue.current!.setMatrixAt(i, dummy.matrix);
            });
            bue.current.instanceMatrix.needsUpdate = true;
            if (hode.current) {
                const p = buePunkter[Math.min(buePunkter.length - 1, Math.max(0, n - 1))];
                hode.current.position.copy(p);
                hode.current.visible = beat === 1 && bueFram > 0 && bueFram < 1;
            }
        }
        if (spokelse.current && spokelseMat.current) {
            const syk = (t % 4.5) / 4.5;
            const r = beat >= 3 ? 4 + syk * 110 : 0.1;
            spokelse.current.scale.set(r, r, 1);
            spokelse.current.visible = beat >= 3;
            spokelseMat.current.opacity = 0.95 * (1 - syk * 0.7);
        }

        // Kamera.
        const kam = kameraFor(modus, beat);
        const pos = new THREE.Vector3(...kam.pos);
        const se = new THREE.Vector3(...kam.se);
        camera.position.lerp(pos, k);
        kamSe.current.lerp(se, k);
        camera.lookAt(kamSe.current);
        forste.current = false;
    });

    const byer = liste.map((s, i) => ({ s, i })).filter(({ s }) => s.by);
    const bygder = liste.map((s, i) => ({ s, i })).filter(({ s }) => !s.by);

    return (
        <>
            <color attach="background" args={['#cfe6f5']} />
            <fog attach="fog" args={['#dcecf7', 110, 260]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[30, 60, 40]} intensity={1.5} color="#fff6e5" />
            <hemisphereLight args={['#e0f2fe', '#4d7c0f', 0.45]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#9cbf7f" emissive="#1f2d14" emissiveIntensity={0.15} />
            </mesh>
            {modus === 'fjord' && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                    <planeGeometry args={[34, 7]} />
                    <meshStandardMaterial
                        color="#3b82c4"
                        emissive="#123b66"
                        emissiveIntensity={0.35}
                    />
                </mesh>
            )}
            {modus === 'dam' && (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                        <circleGeometry args={[14, 48]} />
                        <meshStandardMaterial
                            color="#3b82c4"
                            emissive="#123b66"
                            emissiveIntensity={0.35}
                        />
                    </mesh>
                    <mesh ref={stein} position={[0, 12, 0]}>
                        <dodecahedronGeometry args={[1.3, 0]} />
                        <meshStandardMaterial color="#57534e" flatShading />
                    </mesh>
                    {[0, 1, 2, 3].map((i) => (
                        <mesh
                            key={i}
                            ref={(m) => {
                                damRinger.current[i] = m;
                            }}
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[0, 0.15, 0]}
                            visible={false}
                        >
                            <ringGeometry args={[0.93, 1, 64]} />
                            <meshBasicMaterial
                                color="#ffffff"
                                transparent
                                opacity={0.8}
                                depthWrite={false}
                            />
                        </mesh>
                    ))}
                </>
            )}
            {modus === 'bolge' && (
                <mesh
                    ref={ring}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[BOLGE_KILDE.x, 0.3, BOLGE_KILDE.z]}
                >
                    <ringGeometry args={[0.95, 1, 96]} />
                    <meshBasicMaterial
                        ref={ringMat}
                        color="#ea580c"
                        transparent
                        opacity={0.75}
                        depthWrite={false}
                    />
                </mesh>
            )}
            {modus === 'sprang' && (
                <>
                    <instancedMesh
                        ref={bue}
                        args={[undefined, undefined, buePunkter.length]}
                        frustumCulled={false}
                    >
                        <sphereGeometry args={[0.55, 8, 8]} />
                        <meshBasicMaterial color="#ea580c" />
                    </instancedMesh>
                    <mesh ref={hode}>
                        <sphereGeometry args={[1.4, 16, 16]} />
                        <meshBasicMaterial color="#fb923c" />
                    </mesh>
                    <mesh
                        ref={spokelse}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[OSLO.x, 0.3, OSLO.z]}
                        visible={false}
                    >
                        <ringGeometry args={[0.9, 1, 96]} />
                        <meshBasicMaterial
                            ref={spokelseMat}
                            color="#dc2626"
                            transparent
                            opacity={0.6}
                            depthWrite={false}
                        />
                    </mesh>
                </>
            )}
            {fjell(modus).map(([x, z, h], i) => (
                <Fjell key={i} x={x} z={z} h={h} />
            ))}
            {bygder.map(({ s, i }) => (
                <Bygd
                    key={i}
                    sted={s}
                    mat={mats[i]}
                    skala={modus === 'dam' || s === FJORD_A || s === FJORD_B ? 1 : 1.7}
                />
            ))}
            {byer.map(({ s, i }) => (
                <By key={i} sted={s} mat={mats[i]} skala={1.3} />
            ))}
            {modus === 'bolge' && beat >= 4 && (
                <Html position={[50, 7, 0]} center zIndexRange={[20, 0]}>
                    <div className="px-3 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-bold text-slate-700 whitespace-nowrap">
                        Hit kom den aldri
                    </div>
                </Html>
            )}
            {modus === 'sprang' &&
                [OSLO, TROMSO].map((s) => (
                    <Html key={s.navn} position={[s.x, 11, s.z]} center zIndexRange={[20, 0]}>
                        <div className="px-3 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-bold text-slate-900 whitespace-nowrap">
                            {s.navn}
                        </div>
                    </Html>
                ))}
            {modus === 'fjord' &&
                beat >= 2 &&
                FJORD_BYER.map((s, i) => (
                    <Html key={i} position={[s.x, 11, s.z]} center zIndexRange={[20, 0]}>
                        <div className="px-3 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-bold text-orange-700 whitespace-nowrap">
                            By: ny uttale
                        </div>
                    </Html>
                ))}
            {modus === 'fjord' &&
                beat === 1 &&
                [FJORD_A, FJORD_B].map((s, i) => (
                    <Html key={i} position={[s.x, 4.2, s.z]} center zIndexRange={[20, 0]}>
                        <div className="px-3 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-bold text-teal-700 whitespace-nowrap">
                            {i === 0 ? 'Bygd A' : 'Bygd B'}
                        </div>
                    </Html>
                ))}
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    fjord: [
        'To nabobygder',
        'Nesten lik dialekt',
        'To byer langt fra hverandre',
        'Bygdene imellom: som før',
    ],
    dam: ['En stille dam', 'Plopp!', 'Ringer i vann', 'Nærmest først, lengst unna sist'],
    bolge: [
        'Et nytt trekk i én bygd',
        'Først nabolaget rett rundt',
        'Så nabolaget etter det',
        'Lenger unna: senere',
        'Bølgen dør ut',
    ],
    sprang: [
        'Et nytt trekk i Oslo',
        'Omtrent samtidig: Tromsø',
        'Bygdene imellom: ingen endring',
        'En bølge måtte ha passert bygdene',
    ],
};

export function SpredningLandskap({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'fjord';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 600, position: [18, 11, 28] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none">
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
        </div>
    );
}
