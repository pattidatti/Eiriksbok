import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Landet som former stemmen, i 3D.
 * «leir»: fire ungdommer rundt et bål på leirskolen, hver med sin måte å si «jeg er trøtt».
 * «dal»: daler skilt av fjell. Folk i hver dal snakker med hverandre, og hver dal får sin farge.
 * «veier»: veier og byen knytter dalene sammen, fargene blandes, og nye trekk kommer over alt.
 */

type Modus = 'leir' | 'dal' | 'veier';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function kameraFor(modus: Modus, beat: number, t: number) {
    const sakte = t * 0.12;
    if (modus === 'leir') {
        if (beat === 0) return { pos: v(-4 + sakte, 7, 17), se: v(0, 1.4, -1) };
        if (beat === 4) return { pos: v(0, 6, 17), se: v(0, 2.4, -1.5) };
        return { pos: v(0, 5.5, 15), se: v(0, 2.2, -1.5) };
    }
    if (modus === 'dal') {
        if (beat === 0) return { pos: v(-8 + sakte, 34, 46), se: v(0, 0, -2) };
        if (beat === 1) return { pos: v(-10, 16, 34), se: v(-6, 3, -4) };
        if (beat === 2) return { pos: v(0, 24, 22), se: v(0, 0, -3) };
        return { pos: v(0 + sakte, 50, 30), se: v(0, 0, -1) };
    }
    if (beat === 4) return { pos: v(0, 54, 34), se: v(0, 0, 0) };
    return { pos: v(-3 + sakte, 50, 32), se: v(0, 0, 0) };
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
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
    return null;
}

/* ------------------------------ Leirskolen ------------------------------ */

const UNGDOM = [
    { x: -7, z: -0.6, farge: '#1d4ed8' },
    { x: -2.4, z: -2.6, farge: '#4d7c0f' },
    { x: 2.4, z: -2.6, farge: '#ea580c' },
    { x: 7, z: -0.6, farge: '#60a5fa' },
];

function Person({ x, z, farge }: { x: number; z: number; farge: string }) {
    const vend = Math.atan2(-x, 1 - z) * 0.6;
    return (
        <group position={[x, 0, z]} rotation={[0, vend, 0]}>
            {/* Stokken de sitter på */}
            <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.35, 0.35, 2.2, 10]} />
                <meshStandardMaterial color="#78350f" flatShading />
            </mesh>
            <mesh position={[0, 1.55, 0]}>
                <capsuleGeometry args={[0.55, 1.1, 4, 10]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 2.75, 0]}>
                <sphereGeometry args={[0.45, 16, 12]} />
                <meshStandardMaterial color="#f1c7a3" flatShading />
            </mesh>
        </group>
    );
}

function Baal({ playing }: { playing: boolean }) {
    const flamme = useRef<THREE.Mesh>(null);
    const lys = useRef<THREE.PointLight>(null);
    const t = useRef(0);
    useFrame((_, rawDt) => {
        t.current += playing ? Math.min(rawDt, 0.05) : 0;
        const s = 1 + Math.sin(t.current * 9) * 0.08 + Math.sin(t.current * 13.7) * 0.05;
        if (flamme.current) flamme.current.scale.set(1, s, 1);
        if (lys.current) lys.current.intensity = 26 * s;
    });
    return (
        <group position={[0, 0, 1.2]}>
            {[0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    position={[0, 0.25, 0]}
                    rotation={[0, (i * Math.PI) / 3, Math.PI / 2]}
                >
                    <cylinderGeometry args={[0.18, 0.18, 2.2, 6]} />
                    <meshStandardMaterial color="#451a03" />
                </mesh>
            ))}
            <mesh ref={flamme} position={[0, 1, 0]}>
                <coneGeometry args={[0.7, 1.8, 7]} />
                <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[0, 0.85, 0]}>
                <coneGeometry args={[0.38, 1.1, 7]} />
                <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={1.8} />
            </mesh>
            <pointLight
                ref={lys}
                position={[0, 2, 0]}
                color="#fb923c"
                intensity={26}
                distance={22}
            />
        </group>
    );
}

const SETNING = [
    { tekst: 'Æ e trøtt', fra: 1 },
    { tekst: 'Eg er trøytt', fra: 2 },
    { tekst: 'Jæ ær trøtt', fra: 2 },
    { tekst: 'Æ e trøtt', fra: 3 },
];

function Leir({ beat, playing }: { beat: number; playing: boolean }) {
    const traer = useMemo(
        () =>
            Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                const r = 13 + frø(i) * 5;
                return { x: Math.cos(a) * r, z: Math.sin(a) * r - 4, h: 4 + frø(i + 5) * 3 };
            }).filter((t) => t.z < 6),
        []
    );
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[40, 32]} />
                <meshStandardMaterial color="#1f3b2b" emissive="#0f2a1c" emissiveIntensity={0.6} />
            </mesh>
            {traer.map((t, i) => (
                <mesh key={i} position={[t.x, t.h / 2, t.z]}>
                    <coneGeometry args={[1.4, t.h, 6]} />
                    <meshStandardMaterial color="#14532d" flatShading />
                </mesh>
            ))}
            <Baal playing={playing} />
            {UNGDOM.map((u) => (
                <Person key={u.x} x={u.x} z={u.z} farge={u.farge} />
            ))}
            {SETNING.map((s, i) =>
                beat >= s.fra ? (
                    <Html
                        key={i}
                        position={[UNGDOM[i].x, i % 2 ? 5.3 : 3.9, UNGDOM[i].z]}
                        center
                        zIndexRange={[10, 0]}
                    >
                        <div
                            className="px-4 py-2 rounded-2xl bg-white text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap"
                            style={{ outline: beat === s.fra ? '4px solid #f59e0b' : 'none' }}
                        >
                            {i === 3 ? (
                                <>
                                    Æ e t<span className="text-red-600 underline">r</span>øtt
                                </>
                            ) : (
                                s.tekst
                            )}
                        </div>
                    </Html>
                ) : null
            )}
        </>
    );
}

/* ------------------------------ Dalene ------------------------------ */

/** Dalene ligger på x = -24, -12, 0, 12, 24. Fjellryggene mellom dem. */
const DALER = [-24, -12, 0, 12, 24];
const DAL_FARGER = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ea580c'];
const BY_FARGE = '#0891b2';
const RYGGER = [-30, -18, -6, 6, 18, 30];

function Fjellrygger() {
    const fjell = useMemo(() => {
        const ut: { x: number; z: number; r: number; h: number }[] = [];
        RYGGER.forEach((x, ri) => {
            for (let i = 0; i < 7; i++) {
                ut.push({
                    x: x + (frø(ri * 10 + i) - 0.5) * 1.6,
                    z: -22 + i * 5.2,
                    r: 2.4 + frø(ri * 10 + i + 3) * 0.9,
                    h: 6 + frø(ri * 10 + i + 6) * 4,
                });
            }
        });
        return ut;
    }, []);
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[220, 220]} />
                <meshStandardMaterial color="#8fbf73" />
            </mesh>
            {/* Fjorden foran dalene */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 19]}>
                <planeGeometry args={[90, 9]} />
                <meshStandardMaterial color="#5b9bd5" emissive="#3b82c4" emissiveIntensity={0.35} />
            </mesh>
            {DALER.map((x) => (
                <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, 0]}>
                    <planeGeometry args={[0.8, 32]} />
                    <meshStandardMaterial
                        color="#5b9bd5"
                        emissive="#3b82c4"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
            {fjell.map((f, i) => (
                <group key={i} position={[f.x, f.h / 2, f.z]}>
                    <mesh>
                        <coneGeometry args={[f.r, f.h, 7]} />
                        <meshStandardMaterial color="#8a8f8a" flatShading />
                    </mesh>
                    <mesh position={[0, f.h * 0.32, 0]}>
                        <coneGeometry args={[f.r * 0.36, f.h * 0.36, 7]} />
                        <meshStandardMaterial color="#f8fafc" flatShading />
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** Tre hus per bygd. */
function Bygd({ x, z, stor = false }: { x: number; z: number; stor?: boolean }) {
    const hus = stor
        ? [
              [-1.6, 0, 2.2],
              [0, -0.6, 3.2],
              [1.6, 0.2, 2.6],
              [-0.6, 1.4, 1.8],
              [0.9, 1.5, 2],
          ]
        : [
              [-0.8, -0.3, 0.9],
              [0.7, -0.5, 0.9],
              [0, 0.8, 0.9],
          ];
    return (
        <group position={[x, 0, z]}>
            {hus.map(([dx, dz, h], i) => (
                <group key={i} position={[dx, 0, dz]}>
                    <mesh position={[0, h / 2, 0]}>
                        <boxGeometry args={[1, h, 0.8]} />
                        <meshStandardMaterial color={stor ? '#cbd5e1' : '#c2410c'} flatShading />
                    </mesh>
                    {!stor && (
                        <mesh position={[0, h + 0.28, 0]} rotation={[0, Math.PI / 4, 0]}>
                            <coneGeometry args={[0.8, 0.56, 4]} />
                            <meshStandardMaterial color="#e7e5e4" flatShading />
                        </mesh>
                    )}
                </group>
            ))}
        </group>
    );
}

/** Bygdene i hver dal: tre bygder langs elva. */
const BYGDER = DALER.flatMap((x, d) =>
    [-12, -3, 6].map((z, i) => ({ x: x + (i % 2 ? 1.6 : -1.6), z, dal: d }))
);
const BYEN = { x: 2.5, z: 10.5 };

function blanding(farge: string, mot: string, k: number) {
    return new THREE.Color(farge).lerp(new THREE.Color(mot), k);
}

/** En farget, gjennomsiktig flekk på bakken: talemålet i bygda. Fargen glir mot målet. */
function Flekk({
    x,
    z,
    farge,
    synlig,
    radius,
    playing,
}: {
    x: number;
    z: number;
    farge: THREE.Color;
    synlig: boolean;
    radius: number;
    playing: boolean;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const mesh = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const m = mat.current;
        const me = mesh.current;
        if (!m || !me) return;
        const k = playing ? 1 - Math.exp(-1.6 * dt) : 1;
        m.color.lerp(farge, k);
        m.emissive.lerp(farge, k);
        const mål = synlig ? 1 : 0.001;
        const s = playing ? damp(me.scale.x, mål, 3, dt) : mål;
        me.scale.set(s, s, 1);
        me.visible = s > 0.01;
    });
    return (
        <mesh
            ref={mesh}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, 0.08, z]}
            scale={[synlig ? 1 : 0.001, synlig ? 1 : 0.001, 1]}
        >
            <circleGeometry args={[radius, 28]} />
            <meshStandardMaterial
                ref={mat}
                color={farge}
                emissive={farge}
                emissiveIntensity={0.5}
                transparent
                opacity={0.7}
            />
        </mesh>
    );
}

/** Folk som går mellom bygdene i samme dal: små kuler som pendler. */
function Pendlere({
    stier,
    playing,
    farge,
}: {
    stier: [number, number, number, number][];
    playing: boolean;
    farge: string;
}) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const t = useRef(0.4);
    useFrame((_, rawDt) => {
        t.current += playing ? Math.min(rawDt, 0.05) : 0;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const [ax, az, bx, bz] = stier[i];
            const k = (Math.sin(t.current * 0.8 + i * 1.9) + 1) / 2;
            m.position.set(ax + (bx - ax) * k, 0.6, az + (bz - az) * k);
        });
    });
    return (
        <>
            {stier.map((_, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                >
                    <boxGeometry args={[1.1, 0.9, 0.9]} />
                    <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.5} />
                </mesh>
            ))}
        </>
    );
}

function Dal({ beat, playing }: { beat: number; playing: boolean }) {
    const lys = beat >= 3;
    return (
        <>
            <Fjellrygger />
            {BYGDER.map((b, i) => (
                <group key={i}>
                    <Bygd x={b.x} z={b.z} />
                    <Flekk
                        x={b.x}
                        z={b.z}
                        radius={4.3}
                        synlig={lys || (beat === 2 && b.dal === 2)}
                        farge={new THREE.Color(DAL_FARGER[b.dal])}
                        playing={playing}
                    />
                </group>
            ))}
            {beat >= 2 && (
                <Pendlere
                    farge="#fef9c3"
                    playing={playing}
                    stier={
                        beat === 2
                            ? [
                                  [-1.6, -12, 1.6, -3],
                                  [1.6, -3, -1.6, 6],
                                  [-1.6, -12, -1.6, 6],
                              ]
                            : DALER.flatMap((x) => [
                                  [x - 1.6, -12, x + 1.6, -3] as [number, number, number, number],
                                  [x + 1.6, -3, x - 1.6, 6] as [number, number, number, number],
                              ])
                    }
                />
            )}
        </>
    );
}

/* ------------------------------ Veier ------------------------------ */

function Veier({ beat, playing }: { beat: number; playing: boolean }) {
    // Hvor langt fargene har glidd mot byen: 0 = hver dal sin, 1 = nesten som byen.
    const mot = beat <= 0 ? 0 : beat === 1 ? 0.3 : 0.75;
    return (
        <>
            <Fjellrygger />
            <Bygd x={BYEN.x} z={BYEN.z} stor />
            <Flekk
                x={BYEN.x}
                z={BYEN.z + 1}
                radius={5}
                synlig={beat >= 1}
                farge={new THREE.Color(BY_FARGE)}
                playing={playing}
            />
            {BYGDER.map((b, i) => (
                <group key={i}>
                    <Bygd x={b.x} z={b.z} />
                    <Flekk
                        x={b.x}
                        z={b.z}
                        radius={4.3}
                        synlig
                        farge={blanding(DAL_FARGER[b.dal], BY_FARGE, mot)}
                        playing={playing}
                    />
                </group>
            ))}
            {beat >= 1 && (
                <>
                    {/* Veien langs fjorden og opp i hver dal */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 13.8]}>
                        <planeGeometry args={[56, 0.6]} />
                        <meshStandardMaterial color="#78716c" />
                    </mesh>
                    {DALER.map((x) => (
                        <mesh
                            key={x}
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[x + 0.9, 0.12, 0.6]}
                        >
                            <planeGeometry args={[0.5, 26]} />
                            <meshStandardMaterial color="#78716c" />
                        </mesh>
                    ))}
                    <Pendlere
                        farge="#f8fafc"
                        playing={playing}
                        stier={DALER.map(
                            (x) => [x + 0.9, -10, BYEN.x, 13.8] as [number, number, number, number]
                        )}
                    />
                </>
            )}
            {beat >= 3 && <NyeTrekk playing={playing} />}
        </>
    );
}

/** Nye trekk fra nettet: like, lilla krystaller som svever over alle bygdene. */
function NyeTrekk({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const t = useRef(0);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        t.current += playing ? Math.min(rawDt, 0.05) : 0;
        const m = ref.current;
        if (!m) return;
        BYGDER.forEach((b, i) => {
            tmp.position.set(b.x, 4.2 + Math.sin(t.current * 2 + i) * 0.4, b.z);
            tmp.rotation.set(0, t.current + i, 0);
            const s = Math.min(1, t.current * 1.5 + 0.4);
            tmp.scale.set(s, s, s);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, BYGDER.length]} frustumCulled={false}>
            <octahedronGeometry args={[1.2]} />
            <meshStandardMaterial color="#c026d3" emissive="#c026d3" emissiveIntensity={0.7} />
        </instancedMesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const natt = modus === 'leir';
    const himmel = natt ? '#172554' : '#cfe3f2';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, natt ? 22 : 70, natt ? 60 : 150]} />
            <ambientLight intensity={natt ? 0.35 : 0.75} />
            <hemisphereLight args={[natt ? '#93c5fd' : '#ffffff', '#3f5f3a', natt ? 0.4 : 0.6]} />
            <directionalLight position={[20, 30, 15]} intensity={natt ? 0.35 : 1.1} />
            <Kamera modus={modus} beat={beat} playing={playing} />
            {modus === 'leir' && <Leir beat={beat} playing={playing} />}
            {modus === 'dal' && <Dal beat={beat} playing={playing} />}
            {modus === 'veier' && <Veier beat={beat} playing={playing} />}
        </>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    leir: [
        'Kveld på leirskolen',
        'Den første',
        'Den andre og den tredje',
        'Den fjerde: en annen r',
        'Samme setning, fire dialekter',
    ],
    dal: [
        'Fjell, fjorder og daler',
        'Vanskelig å reise',
        'Folk i dalen snakket sammen',
        'Dalene fikk ulike talemål',
        'Mange måter å snakke på',
    ],
    veier: [
        'Dialektene endrer seg',
        'Folk flytter, reiser og møtes',
        'Noen bygder låter mer som byen',
        'Nye ord fra sosiale medier',
        'Trist, eller bare språk?',
    ],
};

const KORT: Record<Modus, (string | null)[]> = {
    leir: [null, null, null, null, null],
    dal: [null, '✕ Tungt å komme over fjellet', null, 'Én farge = ett talemål', null],
    veier: [null, null, null, null, null],
};

export function DialekterLand({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'leir';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [0, 7, 17] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none"
                >
                    <div className="px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-display font-black text-4xl shadow-xl whitespace-nowrap">
                        {overskrift}
                    </div>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {kort && (
                    <motion.div
                        key={kort}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute inset-x-0 bottom-[6%] flex justify-center pointer-events-none"
                    >
                        <div className="px-6 py-3 rounded-2xl bg-amber-50 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap">
                            {kort}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {modus === 'veier' && beat === 4 && (
                <div className="absolute inset-x-[4%] bottom-[6%] flex justify-between gap-6 pointer-events-none">
                    <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl font-black text-slate-900">
                        Noen: trist at gamle
                        <br />
                        dialekter blir svakere
                    </div>
                    <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl font-black text-slate-900 text-right">
                        Andre: språk har
                        <br />
                        alltid forandret seg
                    </div>
                </div>
            )}
            {modus === 'veier' && beat >= 1 && beat <= 3 && (
                <div className="absolute right-[3%] bottom-[6%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl flex flex-col gap-2 pointer-events-none">
                    <div className="flex items-center gap-3 text-2xl font-black text-slate-900">
                        <span
                            className="inline-block rounded-full"
                            style={{ width: 24, height: 24, background: BY_FARGE }}
                        />
                        talemålet i byen
                    </div>
                    {beat >= 3 && (
                        <div className="flex items-center gap-3 text-2xl font-black text-slate-900">
                            <span
                                className="inline-block rotate-45"
                                style={{ width: 20, height: 20, background: '#c026d3' }}
                            />
                            nytt trekk over hele landet
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
