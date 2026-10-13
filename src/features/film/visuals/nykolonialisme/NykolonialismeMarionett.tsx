import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Et nytt, fritt land vist som en leder på en scene, med folket foran. Over ham henger et
 * marionettkors med tråder ned til hender, hode og kropp.
 * «flagg»: det gamle flagget går ned, det nye går opp og folk jubler. Så kommer trådene.
 * «verktoy»: fire tråder, én per verktøy (gjeld, selskaper, kupp, handel). Én lyser per beat.
 * «egne»: alle trådene blir røde («alt er Vestens skyld»), så forsvinner de og lederen
 *   beveger seg selv. Til slutt kommer noen svake tråder tilbake: virkeligheten er rotete.
 */

type Modus = 'flagg' | 'verktoy' | 'egne';

const STENGER = [
    { navn: 'Gjeld', farge: '#dc2626' },
    { navn: 'Selskaper', farge: '#2563eb' },
    { navn: 'Kupp', farge: '#7c3aed' },
    { navn: 'Ulik handel', farge: '#d97706' },
];
const TRAD_GRA = '#334155';
const SCENE_TOPP = 1.2;
const KORS_NEDE = 11.5;
const KORS_OPPE = 28;

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function kamera(m: Modus, b: number, t: number) {
    if (m === 'flagg') {
        if (b === 0) return { pos: v(-1 + t * 0.15, 7.5, 14), se: v(-2.5, 4.5, 0) };
        if (b === 1) return { pos: v(0, 4, 21), se: v(0, 3, 0) };
        if (b === 2) return { pos: v(4, 8.5, 16), se: v(0, 5, 0) };
        return { pos: v(0, 9, 20), se: v(0, 7.5, 0) };
    }
    if (m === 'verktoy') return { pos: v(-2 + t * 0.12, 8, 19), se: v(0, 7, 0) };
    if (b <= 1) return { pos: v(0, 8, 19), se: v(0, 7, 0) };
    if (b === 2) return { pos: v(3, 6.5, 15), se: v(0, 4, 0) };
    return { pos: v(-4, 7, 18), se: v(0, 6, 0) };
}

/** Hvor sterkt hver tråd vises (0-1) og hvilken farge den har. */
function trader(m: Modus, b: number): { styrke: number; farge: string; aktiv: boolean }[] {
    return STENGER.map((s, i) => {
        if (m === 'flagg') return { styrke: b >= 2 ? 1 : 0, farge: TRAD_GRA, aktiv: false };
        if (m === 'verktoy') {
            if (b === 0) return { styrke: 1, farge: s.farge, aktiv: false };
            const aktiv = b - 1 === i;
            return { styrke: aktiv ? 1 : 0.25, farge: s.farge, aktiv };
        }
        if (b === 0) return { styrke: 1, farge: TRAD_GRA, aktiv: false };
        if (b === 1) return { styrke: 1, farge: '#dc2626', aktiv: true };
        if (b === 2) return { styrke: 0, farge: TRAD_GRA, aktiv: false };
        return { styrke: i % 2 === 0 ? 0.45 : 0, farge: TRAD_GRA, aktiv: false };
    });
}

function korsHoyde(m: Modus, b: number) {
    if (m === 'flagg') return b >= 2 ? KORS_NEDE : KORS_OPPE;
    if (m === 'egne' && b === 2) return KORS_OPPE;
    return KORS_NEDE;
}

/** En tynn sylinder mellom to punkter, oppdatert hvert bilde. */
function plasserTrad(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const len = dir.length();
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.scale.set(1, Math.max(len, 0.001), 1);
}

const FOLK: { x: number; z: number; farge: string }[] = [
    [-7, 7.5, '#0d9488'],
    [-5.5, 8.6, '#ca8a04'],
    [-4, 7.2, '#be123c'],
    [-2.6, 8.8, '#2563eb'],
    [-1.2, 7.6, '#16a34a'],
    [0.3, 8.9, '#ea580c'],
    [1.7, 7.4, '#7c3aed'],
    [3.1, 8.7, '#0891b2'],
    [4.5, 7.6, '#db2777'],
    [5.9, 8.8, '#65a30d'],
    [7.2, 7.4, '#b45309'],
    [-6.3, 10, '#475569'],
    [6.5, 10, '#0f766e'],
].map(([x, z, farge]) => ({ x: x as number, z: z as number, farge: farge as string }));

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());

    const kors = useRef<THREE.Group>(null);
    const figur = useRef<THREE.Group>(null);
    const hode = useRef<THREE.Group>(null);
    const armV = useRef<THREE.Group>(null);
    const armH = useRef<THREE.Group>(null);
    const handV = useRef<THREE.Object3D>(null);
    const handH = useRef<THREE.Object3D>(null);
    const nakke = useRef<THREE.Object3D>(null);
    const rygg = useRef<THREE.Object3D>(null);
    const fester = useRef<(THREE.Object3D | null)[]>([]);
    const tradMesh = useRef<(THREE.Mesh | null)[]>([]);
    const gammelt = useRef<THREE.Group>(null);
    const nytt = useRef<THREE.Group>(null);
    const folk = useRef<(THREE.Group | null)[]>([]);
    const tid = useRef(0);

    const mal = trader(modus, beat);

    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        tid.current += dt;
        const t = tid.current;
        const bt = beatTid.current;
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        const hopp = forste.current;
        forste.current = false;

        const m = kamera(modus, beat, bt);
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);

        // Flaggene: det gamle ned i beat 0, det nye opp fra beat 1.
        const gammelMal =
            modus === 'flagg' && beat === 0 ? Math.max(0, 7.2 - Math.max(0, bt - 2.5) * 1.2) : 0;
        const nyttMal = modus === 'flagg' && beat === 0 ? 0 : 7.2;
        if (gammelt.current) {
            gammelt.current.position.y = hopp
                ? gammelMal
                : damp(gammelt.current.position.y, gammelMal, 4, dt);
            gammelt.current.visible = gammelt.current.position.y > 0.4;
        }
        if (nytt.current) {
            nytt.current.position.y = hopp
                ? nyttMal
                : damp(nytt.current.position.y, nyttMal, 1.2, dt);
            nytt.current.visible = nytt.current.position.y > 0.4;
            nytt.current.rotation.y = Math.sin(t * 2.2) * 0.12;
        }

        // Folket jubler når det nye flagget går opp.
        const jubel =
            modus === 'flagg' && beat === 1 ? 1 : modus === 'flagg' && beat === 0 ? 0.25 : 0;
        folk.current.forEach((g, i) => {
            if (!g) return;
            g.position.y = Math.max(0, Math.sin(t * 7 + i * 1.3)) * 0.6 * jubel;
        });

        // Korset senker seg ned når trådene kommer.
        const ky = korsHoyde(modus, beat);
        if (kors.current) {
            kors.current.position.y = hopp ? ky : damp(kors.current.position.y, ky, 1.6, dt);
            const rykk = mal.some((x) => x.aktiv) ? 0.18 : 0.06;
            const egen = modus === 'egne' && beat >= 2;
            kors.current.rotation.z = egen ? 0 : Math.sin(t * 1.8) * rykk;
            kors.current.rotation.x = egen ? 0 : Math.sin(t * 1.3 + 1) * rykk * 0.6;
        }

        // Lederen. Under trådene følger han korset. Uten tråder vinker han selv.
        const aktiv = mal.findIndex((x) => x.aktiv);
        const stram = mal[0].styrke > 0.5;
        const egenBevegelse = modus === 'egne' && beat >= 2;
        const vinker = modus === 'flagg' && beat === 1;
        let vMal = -0.25;
        let hMal = 0.25;
        if (vinker) hMal = 2.4 + Math.sin(t * 6) * 0.35;
        if (stram) {
            vMal = -0.9 + Math.sin(t * 1.8) * 0.5;
            hMal = 0.9 - Math.sin(t * 1.8) * 0.5;
        }
        if (aktiv === 0 || (modus === 'egne' && beat === 1)) vMal = -2.2 + Math.sin(t * 4) * 0.5;
        if (aktiv === 1 || (modus === 'egne' && beat === 1)) hMal = 2.2 + Math.sin(t * 4 + 1) * 0.5;
        if (egenBevegelse) {
            vMal = -0.3;
            hMal = 1.6 + Math.sin(t * 3) * 0.6;
        }
        if (armV.current)
            armV.current.rotation.z = hopp ? vMal : damp(armV.current.rotation.z, vMal, 5, dt);
        if (armH.current)
            armH.current.rotation.z = hopp ? hMal : damp(armH.current.rotation.z, hMal, 5, dt);
        if (hode.current) {
            const nikk =
                aktiv === 2 ? Math.sin(t * 5) * 0.35 : stram ? Math.sin(t * 1.3) * 0.12 : 0;
            hode.current.rotation.x = nikk;
            hode.current.rotation.z = aktiv === 2 ? Math.sin(t * 3) * 0.2 : 0;
        }
        if (figur.current) {
            const sprett =
                aktiv === 3
                    ? Math.abs(Math.sin(t * 4)) * 0.7
                    : stram
                      ? Math.abs(Math.sin(t * 1.8)) * 0.15
                      : 0;
            figur.current.position.y = SCENE_TOPP + sprett;
            figur.current.rotation.y = egenBevegelse ? Math.sin(t * 0.8) * 0.4 : 0;
        }

        // Trådene fra korset til hender, hode og rygg.
        const deler = [handV.current, handH.current, nakke.current, rygg.current];
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        tradMesh.current.forEach((mesh, i) => {
            const feste = fester.current[i];
            const del = deler[i];
            if (!mesh || !feste || !del) return;
            feste.getWorldPosition(a);
            del.getWorldPosition(b);
            plasserTrad(mesh, a, b);
            const mat = mesh.material as THREE.MeshStandardMaterial;
            const mo = mal[i].styrke;
            mat.opacity = hopp ? mo : damp(mat.opacity, mo, 3, dt);
            mat.color.set(mal[i].farge);
            mat.emissive.set(mal[i].farge);
            mesh.visible = mat.opacity > 0.03;
            const tykk = mal[i].aktiv ? 2.2 : 1;
            mesh.scale.x = tykk;
            mesh.scale.z = tykk;
        });
    });

    return (
        <>
            <color attach="background" args={['#dbeafe']} />
            <fog attach="fog" args={['#dbeafe', 40, 90]} />
            <hemisphereLight args={['#ffffff', '#c7b98f', 1.3]} />
            <directionalLight position={[8, 16, 12]} intensity={1.5} />

            {/* Bakken og scenen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <circleGeometry args={[40, 40]} />
                <meshStandardMaterial color="#e7dcc3" />
            </mesh>
            <mesh position={[0, SCENE_TOPP / 2, 0]}>
                <boxGeometry args={[16, SCENE_TOPP, 7]} />
                <meshStandardMaterial color="#a16207" flatShading />
            </mesh>
            <mesh position={[0, SCENE_TOPP + 0.02, 0]}>
                <boxGeometry args={[16.2, 0.06, 7.2]} />
                <meshStandardMaterial color="#ca8a04" />
            </mesh>
            {/* Talerstol */}
            <mesh position={[0, SCENE_TOPP + 1, 1.6]}>
                <boxGeometry args={[1.8, 2, 0.8]} />
                <meshStandardMaterial color="#78350f" flatShading />
            </mesh>

            {/* Flaggstanga */}
            <mesh position={[-5.5, SCENE_TOPP + 4.4, -1.5]}>
                <cylinderGeometry args={[0.08, 0.1, 8.8, 8]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            <group position={[-5.5, SCENE_TOPP, -1.5]}>
                <group ref={gammelt}>
                    <mesh position={[1.3, 0, 0]}>
                        <boxGeometry args={[2.6, 1.6, 0.06]} />
                        <meshStandardMaterial
                            color="#64748b"
                            emissive="#334155"
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                </group>
                <group ref={nytt}>
                    {[
                        ['#16a34a', 0.55],
                        ['#facc15', 0],
                        ['#dc2626', -0.55],
                    ].map(([farge, y]) => (
                        <mesh key={farge as string} position={[1.3, y as number, 0]}>
                            <boxGeometry args={[2.6, 0.55, 0.06]} />
                            <meshStandardMaterial
                                color={farge as string}
                                emissive={farge as string}
                                emissiveIntensity={0.2}
                            />
                        </mesh>
                    ))}
                    <mesh position={[1.3, 0, 0.05]}>
                        <circleGeometry args={[0.24, 5]} />
                        <meshStandardMaterial color="#111827" />
                    </mesh>
                </group>
            </group>

            {/* Lederen */}
            <group ref={figur} position={[0, SCENE_TOPP, 0]}>
                {[-0.4, 0.4].map((x) => (
                    <mesh key={x} position={[x, 0.9, 0]}>
                        <cylinderGeometry args={[0.28, 0.24, 1.8, 10]} />
                        <meshStandardMaterial
                            color="#1e293b"
                            emissive="#1e293b"
                            emissiveIntensity={0.25}
                        />
                    </mesh>
                ))}
                <mesh position={[0, 2.7, 0]}>
                    <boxGeometry args={[1.7, 1.9, 0.85]} />
                    <meshStandardMaterial
                        color="#1e3a8a"
                        emissive="#1e3a8a"
                        emissiveIntensity={0.2}
                        flatShading
                    />
                </mesh>
                {/* Skjerf i flaggets farger */}
                <mesh position={[0, 2.8, 0.44]} rotation={[0, 0, 0.6]}>
                    <boxGeometry args={[0.3, 2.2, 0.04]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#ca8a04"
                        emissiveIntensity={0.3}
                    />
                </mesh>
                <object3D ref={rygg} position={[0, 3.2, -0.45]} />
                <group ref={hode} position={[0, 3.75, 0]}>
                    <mesh position={[0, 0.55, 0]}>
                        <sphereGeometry args={[0.6, 18, 14]} />
                        <meshStandardMaterial color="#c08457" flatShading />
                    </mesh>
                    <object3D ref={nakke} position={[0, 1.15, 0]} />
                </group>
                <group ref={armV} position={[-1.05, 3.5, 0]}>
                    <mesh position={[0, -0.8, 0]}>
                        <cylinderGeometry args={[0.2, 0.18, 1.6, 8]} />
                        <meshStandardMaterial
                            color="#1e3a8a"
                            emissive="#1e3a8a"
                            emissiveIntensity={0.2}
                        />
                    </mesh>
                    <mesh position={[0, -1.7, 0]}>
                        <sphereGeometry args={[0.24, 10, 8]} />
                        <meshStandardMaterial color="#c08457" />
                    </mesh>
                    <object3D ref={handV} position={[0, -1.7, 0]} />
                </group>
                <group ref={armH} position={[1.05, 3.5, 0]}>
                    <mesh position={[0, -0.8, 0]}>
                        <cylinderGeometry args={[0.2, 0.18, 1.6, 8]} />
                        <meshStandardMaterial
                            color="#1e3a8a"
                            emissive="#1e3a8a"
                            emissiveIntensity={0.2}
                        />
                    </mesh>
                    <mesh position={[0, -1.7, 0]}>
                        <sphereGeometry args={[0.24, 10, 8]} />
                        <meshStandardMaterial color="#c08457" />
                    </mesh>
                    <object3D ref={handH} position={[0, -1.7, 0]} />
                </group>
            </group>

            {/* Marionettkorset */}
            <group ref={kors} position={[0, KORS_OPPE, 0]}>
                <mesh>
                    <boxGeometry args={[7, 0.35, 0.35]} />
                    <meshStandardMaterial color="#713f12" flatShading />
                </mesh>
                <mesh>
                    <boxGeometry args={[0.35, 0.35, 3]} />
                    <meshStandardMaterial color="#713f12" flatShading />
                </mesh>
                {(
                    [
                        [-3.4, 0, 0],
                        [3.4, 0, 0],
                        [0, 0, 1.4],
                        [0, 0, -1.4],
                    ] as [number, number, number][]
                ).map((p, i) => (
                    <object3D
                        key={i}
                        position={p}
                        ref={(o) => {
                            fester.current[i] = o;
                        }}
                    />
                ))}
            </group>

            {STENGER.map((s, i) => (
                <mesh
                    key={s.navn}
                    ref={(o) => {
                        tradMesh.current[i] = o;
                    }}
                >
                    <cylinderGeometry args={[0.045, 0.045, 1, 6]} />
                    <meshStandardMaterial
                        color={TRAD_GRA}
                        emissiveIntensity={0.35}
                        transparent
                        opacity={0}
                    />
                </mesh>
            ))}

            {/* Folket foran scenen */}
            {FOLK.map((f, i) => (
                <group
                    key={i}
                    position={[f.x, 0, f.z]}
                    ref={(o) => {
                        folk.current[i] = o;
                    }}
                >
                    <mesh position={[0, 0.8, 0]}>
                        <cylinderGeometry args={[0.32, 0.45, 1.6, 8]} />
                        <meshStandardMaterial color={f.farge} flatShading />
                    </mesh>
                    <mesh position={[0, 1.95, 0]}>
                        <sphereGeometry args={[0.36, 10, 8]} />
                        <meshStandardMaterial color="#a16207" />
                    </mesh>
                </group>
            ))}
        </>
    );
}

const BRIKKER: Record<Modus, (string | null)[]> = {
    flagg: [
        'Kolonien blir fri',
        'Et nytt flagg',
        'Fri på papiret?',
        'Noen andre trekker i trådene',
    ],
    verktoy: ['Fire tråder, ett system', null, null, null, null],
    egne: ['Et sterkt ord', 'Alt er Vestens skyld?', null, 'Virkeligheten er mer rotete'],
};

export function NykolonialismeMarionett({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'flagg';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [0, 6, 18] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>

            <AnimatePresence mode="wait">
                {brikke && (
                    <motion.div
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl whitespace-nowrap ${
                            modus === 'egne' && beat === 1
                                ? 'bg-red-700 text-white'
                                : 'bg-white/95 text-slate-900'
                        }`}
                    >
                        {brikke}
                    </motion.div>
                )}
            </AnimatePresence>

            {modus === 'verktoy' && (
                <div className="absolute right-[3%] top-1/2 -translate-y-1/2 flex flex-col gap-3">
                    {STENGER.map((s, i) => {
                        const aktiv = beat === 0 || beat - 1 === i;
                        return (
                            <motion.div
                                key={s.navn}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{
                                    opacity: aktiv ? 1 : 0.35,
                                    x: 0,
                                    scale: beat - 1 === i ? 1.08 : 1,
                                }}
                                transition={{ delay: beat === 0 ? 0.3 + i * 0.25 : 0.1 }}
                                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/95 shadow-xl"
                            >
                                <span
                                    className="w-6 h-6 rounded-full"
                                    style={{ background: s.farge }}
                                />
                                <span className="text-3xl font-black text-slate-900">
                                    {i + 1}. {s.navn}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {modus === 'egne' && beat === 2 && (
                    <motion.div
                        key="egne"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[5%] inset-x-0 flex justify-center gap-4"
                    >
                        {['Egne ledere', 'Egne valg', 'Egen korrupsjon'].map((t, i) => (
                            <motion.div
                                key={t}
                                initial={{ opacity: 0, y: -16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.6 }}
                                className="px-5 py-2 rounded-2xl bg-white/95 shadow-xl text-3xl font-black text-slate-900"
                            >
                                {t}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
