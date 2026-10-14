import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { frø, useKamera, v } from './felles3d';

/**
 * En kinesisk landsby i 1958: seks hus rundt et tun, åkre bak husene og skog på åsene.
 * Ingen mennesker vises.
 * «jern»: grytene glir fra husene til en haug, og så inn i ovnen i bakgården, som gløder.
 * «kollektiv»: gjerdene mellom familienes åkerlapper forsvinner, og alt blir én stor åker.
 * «ovner»: små stålovner tennes over hele landsbygda, skogen blir til stubber, åkeren visner.
 * «tom»: kveld og tørke. Lysene i husene slukner ett for ett.
 */

type Modus = 'jern' | 'kollektiv' | 'ovner' | 'tom';

const HUS_X = [-15, -9, -3, 3, 9, 15];
const HUS_Z = -6;
const OVN: [number, number, number] = [0, 0, 6];
const HAUG: [number, number, number] = [4.5, 0, 4];
const EKSTRA_OVNER: [number, number][] = [
    [-20, -20],
    [10, -30],
    [22, -17],
    [-8, -36],
    [-27, -33],
    [27, -37],
    [-2, -22],
    [16, -44],
];
const TRÆR = 46;
const RØYK = 36;

/** Åkerlappene: 4 x 3 bak husene. */
const LAPPER = Array.from({ length: 12 }, (_, i) => {
    const kol = i % 4;
    const rad = Math.floor(i / 4);
    return { x: -21 + kol * 14, z: -17 - rad * 9, i };
});

function kamera(modus: Modus, beat: number, t: number) {
    if (modus === 'jern') {
        switch (beat) {
            case 0:
                return { pos: v(30 - t * 0.5, 16, 40), se: v(0, 1, -6) };
            case 1:
                return { pos: v(16, 9, 20), se: v(1, 1, -2) };
            case 2:
                return { pos: v(9, 6, 16), se: v(0, 2, 6) };
            default:
                return { pos: v(-10 + t * 0.2, 4, 6), se: v(-9, 1.5, HUS_Z) };
        }
    }
    if (modus === 'kollektiv') {
        switch (beat) {
            case 0:
                return { pos: v(-26, 22, 26), se: v(0, 0, -10) };
            case 1:
                return { pos: v(0, 46, -6), se: v(0, 0, -30) };
            case 2:
                return { pos: v(8 + t * 0.4, 50, -4), se: v(0, 0, -30) };
            default:
                return { pos: v(24, 26, 14), se: v(0, 0, -22) };
        }
    }
    if (modus === 'ovner') {
        switch (beat) {
            case 0:
                return { pos: v(34, 20, 42), se: v(0, 1, -10) };
            case 1:
                return { pos: v(0, 48, 34), se: v(0, 0, -26) };
            case 2:
                return { pos: v(26, 18, 4), se: v(-6, 3, -50) };
            default:
                return { pos: v(-8, 6, 17), se: v(-1, 1, 5) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(30, 16, 40), se: v(0, 1, -8) };
        case 1:
            return { pos: v(0, 40, -4), se: v(0, 0, -30) };
        case 2:
            return { pos: v(10, 7, 14), se: v(0, 2, HUS_Z) };
        case 3:
            return { pos: v(-20, 30, 50 + t * 0.4), se: v(0, 0, -12) };
        default:
            return { pos: v(0, 60, 80 + t * 0.4), se: v(0, 0, -16) };
    }
}

/** Snapper ved første bilde og på pause, glir ellers. */
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

function åkerFarge(modus: Modus, beat: number, i: number) {
    const grønn = ['#65a30d', '#4d7c0f', '#84cc16', '#5b8c1a'][i % 4];
    if (modus === 'kollektiv') return beat >= 2 ? '#65a30d' : grønn;
    if (modus === 'ovner') return beat >= 3 ? '#a16207' : '#65a30d';
    if (modus === 'tom') return beat >= 1 ? '#a8836a' : '#8a7a4a';
    return '#65a30d';
}

function Hus({ x, i, lys }: { x: number; i: number; lys: (i: number) => number }) {
    const vindu = useRef<THREE.MeshStandardMaterial>(null);
    const glid = useGlid();
    useFrame((_, rawDt) => {
        const m = vindu.current;
        if (!m) return;
        m.emissiveIntensity = THREE.MathUtils.lerp(
            m.emissiveIntensity,
            lys(i),
            glid(true, rawDt, 2)
        );
    });
    return (
        <group position={[x, 0, HUS_Z]}>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[4.4, 3, 4]} />
                <meshStandardMaterial
                    color="#d6c3a0"
                    emissive="#57452c"
                    emissiveIntensity={0.15}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[3.9, 1.9, 4]} />
                <meshStandardMaterial color="#7c2d12" flatShading />
            </mesh>
            {/* Døra */}
            <mesh position={[-0.8, 1.05, 2.02]}>
                <planeGeometry args={[1, 2.1]} />
                <meshStandardMaterial color="#3f2a17" />
            </mesh>
            {/* Vinduet, som lyser om kvelden */}
            <mesh position={[1.1, 1.8, 2.02]}>
                <planeGeometry args={[1.1, 0.9]} />
                <meshStandardMaterial
                    ref={vindu}
                    color="#334155"
                    emissive="#fbbf24"
                    emissiveIntensity={0}
                />
            </mesh>
        </group>
    );
}

/** Seks gryter, én per hus. Glir fra døra til haugen og inn i ovnen. */
function Gryter({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const glid = useGlid();
    const steg = modus === 'jern' ? (beat === 0 ? 0 : beat === 1 ? 1 : 2) : 3;
    useFrame((_, rawDt) => {
        const k = glid(playing, rawDt, 1.4);
        refs.current.forEach((m, i) => {
            if (!m) return;
            let mål: THREE.Vector3;
            let s = 1;
            if (steg === 0) mål = v(HUS_X[i] - 0.8, 0.45, HUS_Z + 3);
            else if (steg === 1)
                mål = v(HAUG[0] + (i % 3) * 0.9 - 0.9, 0.45 + Math.floor(i / 3) * 0.7, HAUG[2]);
            else {
                mål = v(OVN[0], 3.4, OVN[2]);
                s = 0.01;
            }
            if (steg === 3) s = 0.01;
            m.position.lerp(mål, k);
            const ns = THREE.MathUtils.lerp(m.scale.x, s, k);
            m.scale.setScalar(ns);
        });
    });
    return (
        <>
            {HUS_X.map((x, i) => (
                <mesh
                    key={x}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                    position={[x - 0.8, 0.45, HUS_Z + 3]}
                >
                    <sphereGeometry args={[0.6, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                    <meshStandardMaterial
                        color="#27272a"
                        emissive="#52525b"
                        emissiveIntensity={0.3}
                        metalness={0.4}
                        roughness={0.5}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}
        </>
    );
}

function Ovn({
    pos,
    tent,
    playing,
}: {
    pos: [number, number, number];
    tent: boolean;
    playing: boolean;
}) {
    const glød = useRef<THREE.MeshStandardMaterial>(null);
    const lys = useRef<THREE.PointLight>(null);
    const glid = useGlid();
    useFrame((_, rawDt) => {
        const k = glid(playing, rawDt, 1.2);
        if (glød.current)
            glød.current.emissiveIntensity = THREE.MathUtils.lerp(
                glød.current.emissiveIntensity,
                tent ? 2.2 : 0,
                k
            );
        if (lys.current)
            lys.current.intensity = THREE.MathUtils.lerp(lys.current.intensity, tent ? 30 : 0, k);
    });
    return (
        <group position={pos}>
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.9, 1.5, 3, 8]} />
                <meshStandardMaterial
                    color="#9a3412"
                    emissive="#431407"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 3.05, 0]}>
                <cylinderGeometry args={[0.75, 0.75, 0.15, 8]} />
                <meshStandardMaterial
                    ref={glød}
                    color="#451a03"
                    emissive="#f97316"
                    emissiveIntensity={0}
                />
            </mesh>
            <pointLight
                ref={lys}
                position={[0, 4, 0]}
                color="#fb923c"
                intensity={0}
                distance={14}
            />
        </group>
    );
}

/** Skogen på åsene bak landsbyen. Trærne krymper til stubber når de hogges. */
function Skog({ hogd, playing }: { hogd: boolean; playing: boolean }) {
    const krone = useRef<THREE.InstancedMesh>(null);
    const stamme = useRef<THREE.InstancedMesh>(null);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const plass = useMemo(
        () =>
            Array.from({ length: TRÆR }, (_, i) => {
                const side = i % 3;
                if (side === 0) return [-50 + frø(i) * 100, -54 - frø(i + 9) * 18] as const;
                if (side === 1) return [-46 - frø(i + 3) * 14, -10 - frø(i + 5) * 40] as const;
                return [40 + frø(i + 7) * 14, -8 - frø(i + 11) * 44] as const;
            }),
        []
    );
    const høyde = useRef(hogd ? 0 : 1);
    const glid = useGlid();
    useFrame((_, rawDt) => {
        // Trærne faller ett om gangen: hvert tre har sin egen terskel.
        høyde.current = THREE.MathUtils.lerp(
            høyde.current,
            hogd ? 0 : 1,
            glid(playing, rawDt, 0.45)
        );
        plass.forEach(([x, z], i) => {
            const terskel = frø(i + 21) * 0.8;
            const h = THREE.MathUtils.clamp((høyde.current - terskel) / 0.2, 0, 1);
            const s = 1 + frø(i + 30) * 0.6;
            const kr = h < 0.05 ? 0.0001 : s;
            m.makeScale(kr, kr * h, kr).setPosition(x, 1.6 + 2.2 * s * h, z);
            krone.current?.setMatrixAt(i, m);
            m.makeScale(s, s * (0.35 + 0.65 * h), s).setPosition(x, 0.8 * s * (0.35 + 0.65 * h), z);
            stamme.current?.setMatrixAt(i, m);
        });
        if (krone.current) krone.current.instanceMatrix.needsUpdate = true;
        if (stamme.current) stamme.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={krone} args={[undefined, undefined, TRÆR]}>
                <coneGeometry args={[1.8, 4.5, 7]} />
                <meshStandardMaterial
                    color="#166534"
                    emissive="#052e16"
                    emissiveIntensity={0.4}
                    flatShading
                />
            </instancedMesh>
            <instancedMesh ref={stamme} args={[undefined, undefined, TRÆR]}>
                <cylinderGeometry args={[0.35, 0.45, 1.6, 6]} />
                <meshStandardMaterial color="#78350f" flatShading />
            </instancedMesh>
        </>
    );
}

/** Rolig røyk fra de tente ovnene. */
function Røyk({ ovner, playing }: { ovner: [number, number][]; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const tid = useRef(0);
    const styrke = useRef(0);
    const glid = useGlid();
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        styrke.current = THREE.MathUtils.lerp(
            styrke.current,
            ovner.length ? 1 : 0,
            glid(playing, rawDt, 0.8)
        );
        const im = ref.current;
        if (!im) return;
        for (let i = 0; i < RØYK; i++) {
            const o = ovner.length ? ovner[i % ovner.length] : [0, 0];
            const u = (tid.current * 0.15 + frø(i)) % 1;
            const s = (0.35 + u * 0.9) * styrke.current + 0.001;
            m.makeScale(s, s, s).setPosition(o[0] + u * 2.5, 3.6 + u * 9, o[1] - u * 1.5);
            im.setMatrixAt(i, m);
        }
        im.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, RØYK]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#57534e" transparent opacity={0.55} flatShading />
        </instancedMesh>
    );
}

function Akeren({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const mat = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const gjerder = useRef<THREE.Group>(null);
    const glid = useGlid();
    const mål = useMemo(() => new THREE.Color(), []);
    const visGjerder = modus === 'kollektiv' && beat === 0;
    useFrame((_, rawDt) => {
        const k = glid(playing, rawDt, 1.1);
        mat.current.forEach((m, i) => {
            if (!m) return;
            mål.set(åkerFarge(modus, beat, i));
            m.color.lerp(mål, k);
        });
        const g = gjerder.current;
        if (g) {
            const s = THREE.MathUtils.lerp(g.scale.y, visGjerder ? 1 : 0.001, k);
            g.scale.y = s;
            g.visible = s > 0.02;
        }
    });
    return (
        <group>
            {LAPPER.map((l) => (
                <mesh key={l.i} position={[l.x, 0.06, l.z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[13.4, 8.4]} />
                    <meshStandardMaterial
                        ref={(m) => {
                            mat.current[l.i] = m;
                        }}
                        color={åkerFarge(modus, 0, l.i)}
                        emissive="#1a2e05"
                        emissiveIntensity={0.25}
                    />
                </mesh>
            ))}
            <group ref={gjerder}>
                {[-14, 0, 14].map((x) => (
                    <mesh key={`x${x}`} position={[x, 0.5, -26]}>
                        <boxGeometry args={[0.25, 1, 27]} />
                        <meshStandardMaterial color="#e7e5e4" />
                    </mesh>
                ))}
                {[-21.5, -30.5].map((z) => (
                    <mesh key={`z${z}`} position={[0, 0.5, z]}>
                        <boxGeometry args={[56, 1, 0.25]} />
                        <meshStandardMaterial color="#e7e5e4" />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

/** Stålklumpene som kom ut av ovnen. Grå, ujevne og nesten ubrukelige. */
function Klumper({ vis }: { vis: boolean }) {
    if (!vis) return null;
    return (
        <>
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    position={[-2.6 + i * 0.9, 0.4, 8.2 + (i % 2) * 0.7]}
                    rotation={[frø(i) * 3, frø(i + 4) * 3, 0]}
                >
                    <dodecahedronGeometry args={[0.45 + frø(i + 8) * 0.2, 0]} />
                    <meshStandardMaterial
                        color="#57534e"
                        emissive="#292524"
                        emissiveIntensity={0.3}
                        flatShading
                    />
                </mesh>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useKamera((b, t) => kamera(modus, b, t), beat, playing);
    const kveld = modus === 'tom';
    const himmel = kveld ? (beat >= 1 ? '#d6b48a' : '#c9b9a6') : '#cfe4f2';
    const midtTent = (modus === 'jern' && beat >= 2) || (modus === 'ovner' && beat >= 1);
    const ekstraTent = modus === 'ovner' && beat >= 1;
    const røykFra: [number, number][] = [
        ...(midtTent ? [[OVN[0], OVN[2]] as [number, number]] : []),
        ...(ekstraTent ? EKSTRA_OVNER : []),
    ];
    // Lyset i husene: på i kveldsmodus, og slukner ett og ett fra beat 2.
    const lys = (i: number) => {
        if (!kveld) return 0;
        if (beat < 2) return 1.2;
        const slukket = beat > 2 ? 99 : beatTid.current * 4;
        return i < slukket ? 0 : 1.2;
    };
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 60, 170]} />
            <ambientLight intensity={kveld ? 0.55 : 0.8} />
            <hemisphereLight args={[kveld ? '#fcd9a8' : '#e0f2fe', '#6b5a3e', 0.6]} />
            <directionalLight
                position={kveld ? [-40, 10, 20] : [30, 40, 25]}
                intensity={kveld ? 0.8 : 1.3}
                color={kveld ? '#fdba74' : '#fff7ed'}
            />
            {/* Bakken og åsene */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial
                    color={kveld ? '#a39074' : '#b9a27a'}
                    emissive="#3f3422"
                    emissiveIntensity={0.15}
                />
            </mesh>
            {[
                [-30, -70, 22],
                [20, -78, 28],
                [62, -40, 20],
            ].map(([x, z, r], i) => (
                <mesh key={i} position={[x, -r * 0.55, z]}>
                    <sphereGeometry args={[r, 16, 10]} />
                    <meshStandardMaterial color={kveld ? '#8a7a5c' : '#7d9a57'} flatShading />
                </mesh>
            ))}
            <Akeren modus={modus} beat={beat} playing={playing} />
            {HUS_X.map((x, i) => (
                <Hus key={x} x={x} i={i} lys={lys} />
            ))}
            <Ovn pos={OVN} tent={midtTent} playing={playing} />
            {modus === 'ovner' &&
                EKSTRA_OVNER.map(([x, z]) => (
                    <Ovn key={`${x}${z}`} pos={[x, 0, z]} tent={ekstraTent} playing={playing} />
                ))}
            <Gryter modus={modus} beat={beat} playing={playing} />
            <Skog hogd={(modus === 'ovner' && beat >= 2) || modus === 'tom'} playing={playing} />
            <Røyk ovner={røykFra} playing={playing} />
            <Klumper vis={modus === 'ovner' && beat >= 3} />
        </>
    );
}

const TEKST: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    jern: [
        { tekst: 'En landsby i Kina, 1958' },
        { tekst: 'Alt av jern skal leveres' },
        { tekst: 'Grytene smeltes i ovnen', rod: true },
        { tekst: 'Hva skal familien lage mat i?' },
    ],
    kollektiv: [
        { tekst: 'Hver familie har sin åkerlapp' },
        { tekst: 'Gjerdene forsvinner' },
        { tekst: 'Én stor fellesgård: et kollektiv' },
        { tekst: 'Betalt i poeng, ikke i mat' },
    ],
    ovner: [
        { tekst: 'Det store spranget fremover, 1958' },
        { tekst: 'Små stålovner over hele landsbygda' },
        { tekst: 'Skogen hogges til ved', rod: true },
        { tekst: 'Ingen står på åkeren', rod: true },
    ],
    tom: [
        { tekst: 'Hungersnøden, 1959 til 1961', rod: true },
        { tekst: 'Tørke og flom, men mest politikk' },
        { tekst: 'Landsbyer blir tomme', rod: true },
        { tekst: 'Trolig titalls millioner døde', rod: true },
        { tekst: 'Fortsatt sensurert i Kina' },
    ],
};

export function SprangetLandsby({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'jern';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = TEKST[modus];
    const t = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [30, 16, 40] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        t.rod ? 'bg-red-700 text-white' : 'bg-white/90 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'kollektiv' && beat >= 3 && (
                    <motion.div
                        key="poeng"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 18 }}
                        className="absolute right-[5%] top-[28%] w-[19rem] p-5 rounded-3xl bg-white/95 shadow-2xl"
                    >
                        <div className="text-xl font-semibold text-slate-500">
                            En dags arbeid gir
                        </div>
                        <div className="mt-2 flex gap-2">
                            {['+', '+', '+'].map((p, i) => (
                                <span
                                    key={i}
                                    className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 font-black text-2xl flex items-center justify-center shadow"
                                >
                                    {p}
                                </span>
                            ))}
                        </div>
                        <div className="mt-3 font-display font-black text-3xl text-slate-900">
                            poeng, ikke mat
                        </div>
                    </motion.div>
                )}
                {modus === 'ovner' && beat >= 3 && (
                    <motion.div
                        key="stal"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute left-[5%] bottom-[10%] px-5 py-3 rounded-2xl bg-white/95 shadow-2xl"
                    >
                        <div className="font-display font-black text-3xl text-slate-900">
                            Stålet: nesten ubrukelig
                        </div>
                    </motion.div>
                )}
                {modus === 'tom' && beat === 3 && (
                    <motion.div
                        key="tall"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-1/2 -translate-x-1/2 top-[30%] flex flex-col items-center gap-3"
                    >
                        <Teller
                            verdi={20}
                            etikett="millioner: det laveste anslaget"
                            forsinkelse={0.8}
                            tone="rod"
                        />
                        <div className="px-4 py-1.5 rounded-xl bg-white/90 text-2xl font-semibold text-slate-600">
                            Noen anslag er mye høyere
                        </div>
                    </motion.div>
                )}
                {modus === 'tom' && beat >= 4 && (
                    <motion.div
                        key="sensur"
                        initial={{ opacity: 0, scale: 1.6, rotate: -14 }}
                        animate={{ opacity: 1, scale: 1, rotate: -8 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 16 }}
                        className="absolute left-1/2 top-[38%] -translate-x-1/2 px-8 py-3 border-[6px] border-red-700 rounded-xl text-red-700 font-display font-black text-5xl bg-white/80"
                    >
                        SENSURERT
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
