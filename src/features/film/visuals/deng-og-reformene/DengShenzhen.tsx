import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Shenzhen i 3D, sett fra nord mot grensa og Hongkong.
 * «grenseby»: 1979. Lave hus, risåkre, en vei ned til tollstasjonen og brua over elva.
 * «vekst»: fabrikkene kommer, husene forsvinner, skyskrapere og motorveier skyter opp,
 * og lastebiler kjører varene ut. Til slutt hele storbyen.
 */

type Modus = 'grenseby' | 'vekst';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Tilfeldig tall med frø, så byen ser lik ut hver gang. */
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Dempet glidning. Første bilde og pause hopper rett til målet. */
function useGlid() {
    const forste = useRef(true);
    return (playing: boolean, rawDt: number, lambda: number) => {
        if (forste.current || !playing) {
            forste.current = false;
            return 1;
        }
        return 1 - Math.exp(-lambda * Math.min(rawDt, 0.05));
    };
}

const ELV_Z = -16;
const VEI_X = 6;

/** Husene i grensebyen: små og lave, på begge sider av veien. */
const HUS = Array.from({ length: 26 }, (_, i) => {
    let x = -30 + frø(i) * 60;
    if (Math.abs(x - VEI_X) < 4) x += 8;
    return { x, z: -6 + frø(i + 40) * 34, r: frø(i + 80) * Math.PI };
});

/** Risåkrene rundt byen. */
const AKRE = Array.from({ length: 18 }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const k = Math.floor(i / 2);
    return { x: side * (40 + (k % 3) * 11), z: -6 + Math.floor(k / 3) * 11 };
});

/** Skyskraperne. Høyest i midten, med veien fri. */
const TÅRN = (() => {
    const ut: { x: number; z: number; h: number; b: number }[] = [];
    let i = 0;
    for (let gx = -34; gx <= 34; gx += 8) {
        for (let gz = -6; gz <= 34; gz += 8) {
            if (Math.abs(gx - VEI_X) < 5) continue;
            if (Math.abs(gz - 12) < 3) continue;
            const midt = 1 - Math.min(1, Math.hypot(gx, gz - 14) / 45);
            ut.push({
                x: gx + (frø(i) - 0.5) * 2,
                z: gz + (frø(i + 7) - 0.5) * 2,
                h: 6 + midt * 22 + frø(i + 13) * 10,
                b: 3.4 + frø(i + 19) * 1.6,
            });
            i++;
        }
    }
    return ut;
})();

/** De to tårnene som lyser opp til slutt (selskapene som holder til i byen). */
const SIGNATUR = [
    { x: 14, z: 2 },
    { x: -14, z: 22 },
];

const FABRIKKER = [
    [-48, -2],
    [-48, 10],
    [-48, 24],
    [-62, 2],
    [-62, 16],
    [-62, 30],
] as const;

const BILER = 16;

function kamera(modus: Modus, beat: number, t: number) {
    if (modus === 'grenseby') {
        switch (beat) {
            case 0:
                return { pos: v(40 - t * 0.6, 30, 72), se: v(0, 0, 0) };
            case 1:
                return { pos: v(-16, 11, 38), se: v(-4, 1, 10) };
            case 2:
                return { pos: v(22, 10, 8), se: v(4, 1, -26) };
            default:
                return { pos: v(0, 58, 84 + t * 0.4), se: v(0, 0, -6) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-18, 24, 58), se: v(-52, 2, 12) };
        case 1:
            return { pos: v(52 - t * 0.5, 36, 72), se: v(0, 8, 8) };
        case 2:
            return { pos: v(64, 9, 3), se: v(10, 2, 13) };
        case 3:
            return { pos: v(0, 75, 115 + t * 0.4), se: v(0, 6, 0) };
        default:
            return { pos: v(72, 42, 86), se: v(0, 16, 10) };
    }
}

/** Hvor langt byen har kommet (0 = grenseby, 1 = storby). */
function byNivå(modus: Modus, beat: number) {
    if (modus === 'grenseby') return 0;
    return [0.12, 0.7, 0.85, 1, 1][Math.min(beat, 4)];
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
        const m = kamera(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Hus({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const s = useRef(synlig ? 1 : 0);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const q = useMemo(() => new THREE.Quaternion(), []);
    const glid = useGlid();
    useFrame((_, rawDt) => {
        s.current = THREE.MathUtils.lerp(s.current, synlig ? 1 : 0, glid(playing, rawDt, 1.5));
        const k = Math.max(0.0001, s.current);
        HUS.forEach((h, i) => {
            q.setFromAxisAngle(v(0, 1, 0), h.r);
            m.compose(v(h.x, 1 * k, h.z), q, v(k, k, k));
            kropp.current?.setMatrixAt(i, m);
            m.compose(v(h.x, 2.6 * k, h.z), q, v(k, k, k));
            tak.current?.setMatrixAt(i, m);
        });
        if (kropp.current) kropp.current.instanceMatrix.needsUpdate = true;
        if (tak.current) tak.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, HUS.length]}>
                <boxGeometry args={[3.2, 2, 2.6]} />
                <meshStandardMaterial
                    color="#e7dcc4"
                    emissive="#5c4a2e"
                    emissiveIntensity={0.15}
                    flatShading
                />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, HUS.length]}>
                <coneGeometry args={[2.4, 1.2, 4]} />
                <meshStandardMaterial color="#6b7280" flatShading />
            </instancedMesh>
        </>
    );
}

function Akre({ by, playing }: { by: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const grønn = useMemo(() => new THREE.Color('#7cb342'), []);
    const grå = useMemo(() => new THREE.Color('#9ca3af'), []);
    const mål = useMemo(() => new THREE.Color(), []);
    const glid = useGlid();
    useFrame((_, rawDt) => {
        if (mat.current) {
            mål.copy(grønn).lerp(grå, by);
            mat.current.color.lerp(mål, glid(playing, rawDt, 1.2));
        }
        const im = ref.current;
        if (!im || im.userData.klar) return;
        AKRE.forEach((a, i) => {
            m.makeRotationX(-Math.PI / 2).setPosition(a.x, 0.05, a.z);
            im.setMatrixAt(i, m);
        });
        im.instanceMatrix.needsUpdate = true;
        im.userData.klar = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, AKRE.length]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial
                ref={mat}
                color="#7cb342"
                emissive="#1a2e05"
                emissiveIntensity={0.2}
            />
        </instancedMesh>
    );
}

function Tårn({
    by,
    lysSignatur,
    playing,
}: {
    by: number;
    lysSignatur: boolean;
    playing: boolean;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const sig = useRef<(THREE.Mesh | null)[]>([]);
    const sigMat = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const nivå = useRef(by);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const glid = useGlid();
    useFrame((_, rawDt) => {
        nivå.current = THREE.MathUtils.lerp(nivå.current, by, glid(playing, rawDt, 0.7));
        const im = ref.current;
        if (im) {
            if (!im.userData.farget) {
                const c = new THREE.Color();
                TÅRN.forEach((_, i) => {
                    c.set(['#94a3b8', '#7dd3fc', '#cbd5e1', '#a5b4fc'][i % 4]);
                    im.setColorAt(i, c);
                });
                if (im.instanceColor) im.instanceColor.needsUpdate = true;
                im.userData.farget = true;
            }
            TÅRN.forEach((t, i) => {
                // Hvert tårn starter litt etter de andre, så byen vokser utover fra midten.
                const terskel = (1 - t.h / 38) * 0.5;
                const g = THREE.MathUtils.clamp((nivå.current - terskel) / 0.5, 0, 1);
                const h = Math.max(0.001, t.h * g);
                m.makeScale(g > 0.01 ? t.b : 0.0001, h, g > 0.01 ? t.b : 0.0001).setPosition(
                    t.x,
                    h / 2,
                    t.z
                );
                im.setMatrixAt(i, m);
            });
            im.instanceMatrix.needsUpdate = true;
        }
        const g = THREE.MathUtils.clamp((nivå.current - 0.6) / 0.4, 0, 1);
        sig.current.forEach((s) => {
            if (!s) return;
            s.visible = g > 0.01;
            const h = Math.max(0.001, 44 * g);
            s.scale.set(1, h, 1);
            s.position.y = h / 2;
        });
        sigMat.current.forEach((mm) => {
            if (!mm) return;
            mm.emissiveIntensity = THREE.MathUtils.lerp(
                mm.emissiveIntensity,
                lysSignatur ? 0.9 : 0.1,
                glid(playing, rawDt, 1.5)
            );
        });
    });
    return (
        <>
            <instancedMesh ref={ref} args={[undefined, undefined, TÅRN.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#1e293b"
                    emissiveIntensity={0.25}
                    flatShading
                />
            </instancedMesh>
            {SIGNATUR.map((s, i) => (
                <mesh
                    key={i}
                    position={[s.x, 0, s.z]}
                    ref={(r) => {
                        sig.current[i] = r;
                    }}
                    scale={[1, 0.001, 1]}
                >
                    <boxGeometry args={[5.5, 1, 5.5]} />
                    <meshStandardMaterial
                        ref={(r) => {
                            sigMat.current[i] = r;
                        }}
                        color={i === 0 ? '#ef4444' : '#2563eb'}
                        emissive={i === 0 ? '#ef4444' : '#3b82f6'}
                        emissiveIntensity={0.1}
                        flatShading
                    />
                </mesh>
            ))}
        </>
    );
}

function Fabrikker({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const s = useRef(synlig ? 1 : 0);
    const glid = useGlid();
    useFrame((_, rawDt) => {
        s.current = THREE.MathUtils.lerp(s.current, synlig ? 1 : 0, glid(playing, rawDt, 1.2));
        if (ref.current) {
            ref.current.scale.y = Math.max(0.001, s.current);
            ref.current.visible = s.current > 0.01;
        }
    });
    return (
        <group ref={ref}>
            {FABRIKKER.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 2.5, 0]}>
                        <boxGeometry args={[11, 5, 8]} />
                        <meshStandardMaterial
                            color="#cbd5e1"
                            emissive="#334155"
                            emissiveIntensity={0.2}
                            flatShading
                        />
                    </mesh>
                    <mesh position={[0, 5.4, 0]}>
                        <boxGeometry args={[11.4, 0.8, 8.4]} />
                        <meshStandardMaterial color="#0f766e" flatShading />
                    </mesh>
                    <mesh position={[4, 7.5, -2.5]}>
                        <cylinderGeometry args={[0.6, 0.8, 5, 8]} />
                        <meshStandardMaterial color="#b91c1c" flatShading />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Motorveiene. Rulles ut fra midten. */
function Motorveier({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const a = useRef<THREE.Mesh>(null);
    const b = useRef<THREE.Mesh>(null);
    const s = useRef(synlig ? 1 : 0);
    const glid = useGlid();
    useFrame((_, rawDt) => {
        s.current = THREE.MathUtils.lerp(s.current, synlig ? 1 : 0, glid(playing, rawDt, 0.9));
        const k = Math.max(0.001, s.current);
        if (a.current) {
            a.current.scale.x = k;
            a.current.visible = k > 0.01;
        }
        if (b.current) {
            b.current.scale.y = k;
            b.current.visible = k > 0.01;
        }
    });
    return (
        <>
            <mesh ref={a} position={[0, 0.12, 12]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[170, 4.5]} />
                <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh ref={b} position={[-26, 0.11, 10]} rotation={[-Math.PI / 2, 0, 0.5]}>
                <planeGeometry args={[4, 90]} />
                <meshStandardMaterial color="#374151" />
            </mesh>
        </>
    );
}

/** Lastebiler med varer, fra fabrikkene og østover langs motorveien. */
function Biler({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const m = useMemo(() => new THREE.Matrix4(), []);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        const im = ref.current;
        if (!im) return;
        im.visible = synlig;
        if (!im.userData.farget) {
            const c = new THREE.Color();
            for (let i = 0; i < BILER; i++) {
                c.set(['#f59e0b', '#2563eb', '#dc2626', '#16a34a'][i % 4]);
                im.setColorAt(i, c);
            }
            if (im.instanceColor) im.instanceColor.needsUpdate = true;
            im.userData.farget = true;
        }
        for (let i = 0; i < BILER; i++) {
            const u = (tid.current * 0.05 + i / BILER) % 1;
            const s = synlig ? 1 : 0.0001;
            m.makeScale(s, s, s).setPosition(-60 + u * 140, 1, 12 + (i % 2 ? 1 : -1));
            im.setMatrixAt(i, m);
        }
        im.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, BILER]}>
            <boxGeometry args={[3.2, 1.8, 1.6]} />
            <meshStandardMaterial color="#ffffff" flatShading />
        </instancedMesh>
    );
}

/** Elva, brua, tollstasjonen og Hongkong på den andre siden. */
function Grensa({ by }: { by: number }) {
    return (
        <>
            <mesh position={[0, 0.04, ELV_Z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 7]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0c4a6e" emissiveIntensity={0.5} />
            </mesh>
            {/* Brua */}
            <mesh position={[VEI_X, 0.6, ELV_Z]}>
                <boxGeometry args={[3.5, 0.6, 9]} />
                <meshStandardMaterial color="#a8a29e" flatShading />
            </mesh>
            {/* Veien fra brua og nordover */}
            <mesh position={[VEI_X, 0.08, 24]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3, 72]} />
                <meshStandardMaterial color={by > 0.5 ? '#374151' : '#a16207'} />
            </mesh>
            {/* Tollstasjonen */}
            <group position={[VEI_X, 0, -9]}>
                <mesh position={[-5, 1.6, 0]}>
                    <boxGeometry args={[5, 3.2, 4]} />
                    <meshStandardMaterial color="#f5f5f4" flatShading />
                </mesh>
                <mesh position={[-5, 3.6, 0]}>
                    <boxGeometry args={[5.6, 0.8, 4.6]} />
                    <meshStandardMaterial color="#b91c1c" flatShading />
                </mesh>
                {[-2, 2].map((x) => (
                    <mesh key={x} position={[x, 2, 0]}>
                        <boxGeometry args={[0.6, 4, 0.6]} />
                        <meshStandardMaterial color="#b91c1c" />
                    </mesh>
                ))}
                <mesh position={[0, 4.2, 0]}>
                    <boxGeometry args={[5, 0.7, 0.7]} />
                    <meshStandardMaterial color="#b91c1c" />
                </mesh>
            </group>
            {/* Hongkong: åser og hus på andre siden av elva */}
            {[
                [-30, -50, 18],
                [22, -58, 24],
                [62, -42, 16],
            ].map(([x, z, r], i) => (
                <mesh key={i} position={[x, -r * 0.5, z]}>
                    <sphereGeometry args={[r, 16, 10]} />
                    <meshStandardMaterial
                        color="#4d7c0f"
                        emissive="#1a2e05"
                        emissiveIntensity={0.3}
                        flatShading
                    />
                </mesh>
            ))}
            <mesh position={[0, -0.02, -60]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 80]} />
                <meshStandardMaterial color="#86a35a" />
            </mesh>
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const by = byNivå(modus, beat);
    const himmel = modus === 'grenseby' ? '#e8dcc8' : '#cfe4f2';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 90, 260]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#e0f2fe', '#6b5a3e', 0.6]} />
            <directionalLight position={[30, 50, 25]} intensity={1.3} color="#fff7ed" />
            <Kamera modus={modus} beat={beat} playing={playing} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 40]}>
                <planeGeometry args={[300, 120]} />
                <meshStandardMaterial
                    color={modus === 'grenseby' ? '#b9a27a' : '#a8a29e'}
                    emissive="#3f3422"
                    emissiveIntensity={0.15}
                />
            </mesh>
            <Grensa by={by} />
            <Akre by={by} playing={playing} />
            <Hus synlig={by < 0.3} playing={playing} />
            <Fabrikker synlig={modus === 'vekst'} playing={playing} />
            <Motorveier synlig={modus === 'vekst' && beat >= 1} playing={playing} />
            <Tårn by={by} lysSignatur={modus === 'vekst' && beat >= 4} playing={playing} />
            <Biler synlig={modus === 'vekst' && beat >= 2} playing={playing} />
        </>
    );
}

const TEKST: Record<Modus, string[]> = {
    grenseby: [
        'Shenzhen, 1979',
        'Rundt 30 000 innbyggere',
        'Tollstasjonen mot Hongkong',
        'Et eksperiment skal begynne',
    ],
    vekst: [
        'Fabrikkene kommer',
        '«Shenzhen-fart»',
        'Klær, elektronikk og maskiner',
        'Fra grenseby til storby',
        'Huawei og Tencent',
    ],
};

export function DengShenzhen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'grenseby';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 500, position: [40, 30, 72] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${tekst}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 shadow-xl font-display font-bold text-3xl text-slate-900 whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'grenseby' && beat === 2 && (
                    <motion.div
                        key="hk"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1.2 }}
                        className="absolute top-[24%] left-[50%] -translate-x-1/2 px-4 py-1.5 rounded-xl bg-slate-900/85 text-white font-display font-black text-2xl tracking-widest"
                    >
                        HONGKONG
                    </motion.div>
                )}
                {modus === 'grenseby' && beat === 2 && (
                    <motion.div
                        key="kina"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1.6 }}
                        className="absolute bottom-[8%] left-[6%] px-4 py-1.5 rounded-xl bg-red-700 text-white font-display font-black text-2xl tracking-widest"
                    >
                        KINA
                    </motion.div>
                )}
                {modus === 'vekst' && beat === 3 && (
                    <motion.div
                        key="tall"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex items-end gap-6"
                    >
                        <div className="flex flex-col items-center gap-1">
                            <Teller verdi={30000} etikett="innbyggere" forsinkelse={0.4} />
                            <span className="px-3 py-0.5 rounded-lg bg-slate-900/80 text-white font-bold text-xl">
                                1979
                            </span>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.6, type: 'spring', stiffness: 200, damping: 18 }}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center">
                                <div className="text-5xl font-black text-teal-600">
                                    over 7,5 millioner
                                </div>
                                <div className="text-base font-semibold text-slate-500">
                                    i storbyområdet
                                </div>
                            </div>
                            <span className="px-3 py-0.5 rounded-lg bg-slate-900/80 text-white font-bold text-xl">
                                2007
                            </span>
                        </motion.div>
                    </motion.div>
                )}
                {modus === 'vekst' && beat >= 4 && (
                    <motion.div
                        key="selskap"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.8 }}
                        className="absolute right-[5%] bottom-[10%] px-5 py-3 rounded-2xl bg-white/95 shadow-2xl"
                    >
                        <div className="text-xl font-semibold text-slate-500">
                            Holder til i Shenzhen
                        </div>
                        <div className="flex gap-3 mt-1 font-display font-black text-3xl">
                            <span className="text-red-600">Huawei</span>
                            <span className="text-slate-400">og</span>
                            <span className="text-blue-600">Tencent</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
