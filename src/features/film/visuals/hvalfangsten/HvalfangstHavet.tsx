import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Sørishavet i 3D: kokeriet (den flytende fabrikken), hvalbåtene og isfjellene.
 * Fire modus: åpningen i 1930, kokeriet «Admiralen» (uten slipp), opphalingsslippen,
 * og det tomme havet når fangsten er over. Hvalene er bare mørke former. Filmen viser
 * aldri selve jakten.
 */

type Modus = 'apning' | 'kokeri' | 'slipp' | 'tomt';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

/** Kokeriet ligger langs x-aksen med baugen mot +x. Dekket er i y = 3. */
function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'apning') {
        switch (beat) {
            case 0:
                return { pos: v(70 - t * 1.2, 26, 90 - t * 1.0), se: v(0, 0, 0) };
            case 1:
                return { pos: v(-38 + t * 0.4, 4, 52), se: v(-46, 8, 18) };
            case 2:
                return { pos: v(30 - t * 0.8, 9, 26), se: v(0, 3, 0) };
            case 3:
                return { pos: v(34, 6, 38), se: v(14, 1, 18) };
            default:
                return { pos: v(-4 + t * 0.3, 8, 18), se: v(6, 4, 0) };
        }
    }
    if (modus === 'kokeri') {
        switch (beat) {
            case 0:
                return { pos: v(34 - t * 0.9, 7, 26), se: v(0, 3, 0) };
            case 1:
                return { pos: v(-6, 22, 30), se: v(0, 3, 0) };
            case 2:
                return { pos: v(8, 14, 13), se: v(-2, 3, 0) };
            default:
                return { pos: v(60 + t * 1.2, 30, 70), se: v(0, 2, 0) };
        }
    }
    if (modus === 'slipp') {
        switch (beat) {
            case 0:
                return { pos: v(-50 + t * 0.6, 12, 30), se: v(-8, 3, 0) };
            case 1:
                return { pos: v(-30, 7, 9), se: v(-14, 2, 0) };
            case 2:
                return { pos: v(-26, 13, 14), se: v(-10, 3, 0) };
            default:
                return { pos: v(-20 - t * 1.0, 28, 52), se: v(4, 2, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-30, 9, 34), se: v(0, 3, 0) };
        case 1:
            return { pos: v(-60, 16, 60), se: v(-10, 4, 0) };
        case 2:
            return { pos: v(-50, 20, 90), se: v(40, 3, 0) };
        default:
            return { pos: v(-10, 5, 42), se: v(3, 1, 27) };
    }
}

const mat = {
    skrog: new THREE.MeshStandardMaterial({ color: '#2b2f36', roughness: 0.8, flatShading: true }),
    bunn: new THREE.MeshStandardMaterial({ color: '#9b2c2c', roughness: 0.8 }),
    dekk: new THREE.MeshStandardMaterial({ color: '#8a6f4d', roughness: 0.9 }),
    hvit: new THREE.MeshStandardMaterial({ color: '#eef2f5', roughness: 0.7 }),
    gul: new THREE.MeshStandardMaterial({ color: '#d9a43a', roughness: 0.7 }),
    svart: new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.8 }),
    slipp: new THREE.MeshStandardMaterial({ color: '#4a3b2c', roughness: 0.95 }),
    hval: new THREE.MeshStandardMaterial({
        color: '#3a4552',
        emissive: '#1b232d',
        roughness: 0.6,
        flatShading: true,
    }),
    is: new THREE.MeshStandardMaterial({
        color: '#eef5fb',
        emissive: '#7d9bb8',
        emissiveIntensity: 0.3,
        roughness: 0.5,
        flatShading: true,
    }),
};

/** Sideprofil av et skrog, trukket ut i bredden. Baugen spisser seg mot +x. */
function skrogGeometri(lengde: number, hoyde: number, bredde: number, baug: number) {
    const s = new THREE.Shape();
    const h = lengde / 2;
    s.moveTo(-h, -0.6);
    s.lineTo(h - baug, -0.6);
    s.lineTo(h, hoyde + 0.3);
    s.lineTo(-h, hoyde);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: bredde, bevelEnabled: false });
    g.translate(0, 0, -bredde / 2);
    return g;
}

/** Kokeriet. Med `slipp` får det en åpning i akterenden der hvalen dras opp. */
function Kokeri({ slipp }: { slipp: boolean }) {
    const fremre = useMemo(() => skrogGeometri(26, 3, 4.6, 3), []);
    return (
        <group>
            {/* Skroget foran slippen */}
            <mesh geometry={fremre} material={mat.skrog} position={[2, 0, 0]} />
            {/* Akterenden: to sider med åpning i midten når slippen finnes */}
            {slipp ? (
                [-1.75, 1.75].map((z) => (
                    <mesh key={z} material={mat.skrog} position={[-13.5, 1.2, z]}>
                        <boxGeometry args={[4, 3.6, 1.1]} />
                    </mesh>
                ))
            ) : (
                <mesh material={mat.skrog} position={[-13.5, 1.2, 0]}>
                    <boxGeometry args={[4, 3.6, 4.6]} />
                </mesh>
            )}
            {slipp && (
                <mesh
                    material={mat.slipp}
                    position={[-13.4, 1.55, 0]}
                    rotation={[0, 0, Math.atan2(3.1, 4.4)]}
                >
                    <boxGeometry args={[5.4, 0.15, 2.4]} />
                </mesh>
            )}
            {/* Rød bunn i vannlinja */}
            <mesh material={mat.bunn} position={[0.5, 0.05, 0]}>
                <boxGeometry args={[30.5, 0.3, 4.7]} />
            </mesh>
            {/* Dekket */}
            <mesh material={mat.dekk} position={[1, 3.02, 0]}>
                <boxGeometry args={[23, 0.08, 4.4]} />
            </mesh>
            {/* Brua foran og overbygget bak */}
            <mesh material={mat.hvit} position={[10, 4.3, 0]}>
                <boxGeometry args={[3, 2.6, 3.6]} />
            </mesh>
            <mesh material={mat.svart} position={[10.6, 5.2, 0]}>
                <boxGeometry args={[1.95, 0.4, 3.65]} />
            </mesh>
            <mesh material={mat.hvit} position={[-7, 4.1, 0]}>
                <boxGeometry args={[5, 2.2, 3.8]} />
            </mesh>
            {/* Skorstein */}
            <mesh material={mat.gul} position={[-7, 6.6, 0]}>
                <cylinderGeometry args={[0.75, 0.85, 3, 12]} />
            </mesh>
            <mesh material={mat.svart} position={[-7, 8.3, 0]}>
                <cylinderGeometry args={[0.76, 0.76, 0.5, 12]} />
            </mesh>
            {/* Kokehus midtskips der spekket kokes */}
            <mesh material={mat.hvit} position={[1.5, 3.9, 0]}>
                <boxGeometry args={[6, 1.7, 3.4]} />
            </mesh>
            {/* Master og kraner */}
            {[6.5, -2.5].map((x) => (
                <group key={x} position={[x, 3, 0]}>
                    <mesh material={mat.svart} position={[0, 3.5, 0]}>
                        <cylinderGeometry args={[0.15, 0.18, 7, 8]} />
                    </mesh>
                    <mesh material={mat.svart} position={[-1.4, 4, 0]} rotation={[0, 0, 1.1]}>
                        <cylinderGeometry args={[0.08, 0.08, 3.4, 6]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Hvalbåten: liten og rask, med kanon på baugen. */
function Hvalbat() {
    const skrog = useMemo(() => skrogGeometri(7, 1.3, 1.6, 1.4), []);
    return (
        <group>
            <mesh geometry={skrog} material={mat.skrog} />
            <mesh material={mat.hvit} position={[0.2, 1.9, 0]}>
                <boxGeometry args={[1.8, 1.2, 1.3]} />
            </mesh>
            <mesh material={mat.gul} position={[-1.2, 2.6, 0]}>
                <cylinderGeometry args={[0.32, 0.36, 1.8, 10]} />
            </mesh>
            <mesh material={mat.svart} position={[-1.2, 3.55, 0]}>
                <cylinderGeometry args={[0.33, 0.33, 0.25, 10]} />
            </mesh>
            <mesh material={mat.svart} position={[1.6, 3.3, 0]}>
                <cylinderGeometry args={[0.06, 0.07, 4, 6]} />
            </mesh>
            {/* Kanonen på baugen */}
            <mesh
                material={mat.svart}
                position={[3.1, 1.85, 0]}
                rotation={[0, 0, Math.PI / 2 - 0.15]}
            >
                <cylinderGeometry args={[0.12, 0.16, 0.9, 8]} />
            </mesh>
        </group>
    );
}

/** En hval som en enkel, mørk form: kropp og hale. */
function Hval({ lengde = 6 }: { lengde?: number }) {
    return (
        <group scale={[lengde / 6, 1, 1]}>
            <mesh material={mat.hval} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.8]}>
                <capsuleGeometry args={[0.6, 4.2, 4, 10]} />
            </mesh>
            <mesh material={mat.hval} position={[-3.1, 0, 0]} scale={[0.5, 0.12, 1.6]}>
                <octahedronGeometry args={[0.9, 0]} />
            </mesh>
        </group>
    );
}

/** Tabulære isfjell (flate på toppen, som i Antarktis) og noen kantete biter. */
function Isfjell() {
    const fjell = useMemo(
        () => [
            { p: [-46, 0, 14], s: [16, 10, 11], r: 0.3 },
            { p: [-62, 0, -18], s: [22, 13, 14], r: 0.9 },
            { p: [40, 0, -40], s: [18, 9, 12], r: 1.6 },
            { p: [-20, 0, -48], s: [12, 7, 9], r: 0.5 },
            { p: [85, 0, 30], s: [14, 8, 10], r: 2.2 },
            { p: [-110, 0, 40], s: [26, 12, 16], r: 0.1 },
            { p: [20, 0, 70], s: [10, 6, 8], r: 1.1 },
        ],
        []
    );
    const biter = useMemo(
        () => [
            { p: [-30, 0.4, 20], s: 1.6 },
            { p: [18, 0.3, 22], s: 1.1 },
            { p: [-8, 0.3, -16], s: 1.4 },
            { p: [32, 0.4, -12], s: 1.8 },
            { p: [-38, 0.3, 30], s: 1.0 },
        ],
        []
    );
    return (
        <group>
            {fjell.map((f, i) => (
                <mesh
                    key={i}
                    material={mat.is}
                    position={[f.p[0], f.s[1] / 2 - 1, f.p[2]]}
                    rotation={[0, f.r, 0]}
                >
                    <cylinderGeometry args={[f.s[0] / 2, f.s[0] / 2 + 1.2, f.s[1], 7, 1]} />
                </mesh>
            ))}
            {biter.map((b, i) => (
                <mesh
                    key={i}
                    material={mat.is}
                    position={b.p as [number, number, number]}
                    scale={b.s}
                    rotation={[i, i * 2, 0]}
                >
                    <dodecahedronGeometry args={[1, 0]} />
                </mesh>
            ))}
        </group>
    );
}

/** Hvalbåtene som kommer inn, med hval på slep langs siden. */
const BATER = [
    { fra: v(70, 0, 40), til: v(16, 0, 14), rot: 2.6 },
    { fra: v(80, 0, 22), til: v(22, 0, 7.5), rot: 2.9 },
    { fra: v(60, 0, 60), til: v(28, 0, 24), rot: 2.4 },
];

function Bater({ beat, beatTid }: { beat: number; beatTid: React.RefObject<number> }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    useFrame(() => {
        const t = beatTid.current ?? 0;
        // Før beat 3: langt ute. Under beat 3: på vei inn. Etter: ved kokeriet.
        const andel = beat < 3 ? 0 : beat === 3 ? Math.min(1, t / 7) : 1;
        const e = 1 - Math.pow(1 - andel, 2);
        refs.current.forEach((g, i) => {
            if (!g) return;
            const b = BATER[i];
            g.position.lerpVectors(b.fra, b.til, e);
            g.position.y = Math.sin(t * 1.4 + i) * 0.08;
            g.rotation.y = b.rot;
            g.rotation.z = Math.sin(t * 1.1 + i * 2) * 0.03;
        });
    });
    return (
        <>
            {BATER.map((_, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        refs.current[i] = g;
                    }}
                >
                    <Hvalbat />
                    <group position={[-2.5, -0.15, 1.6]}>
                        <Hval lengde={5.5} />
                    </group>
                </group>
            ))}
        </>
    );
}

/** Slippen: hvalen dras fra vannet bak skipet, opp skrånende og inn på dekk. */
function HvalPaSlipp({ beat, beatTid }: { beat: number; beatTid: React.RefObject<number> }) {
    const ref = useRef<THREE.Group>(null);
    const andel = useRef(0);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const t = beatTid.current ?? 0;
        const mål = beat < 2 ? 0 : beat === 2 ? Math.min(1, Math.max(0, (t - 0.8) / 6)) : 1;
        andel.current = beat === 2 ? mål : damp(andel.current, mål, 3, Math.max(dt, 0.016));
        const a = andel.current;
        // Tre punkter: i vannet bak, toppen av slippen, inne på dekk.
        let x: number;
        let y: number;
        let vinkel: number;
        if (a < 0.6) {
            const k = a / 0.6;
            x = THREE.MathUtils.lerp(-22, -12.6, k);
            y = THREE.MathUtils.lerp(-0.1, 3.4, Math.max(0, (k - 0.35) / 0.65));
            vinkel = k > 0.35 ? 0.62 : 0;
        } else {
            const k = (a - 0.6) / 0.4;
            x = THREE.MathUtils.lerp(-12.6, -5.5, k);
            y = 3.6;
            vinkel = THREE.MathUtils.lerp(0.62, 0, Math.min(1, k * 3));
        }
        g.position.set(x, y, 0);
        g.rotation.z = damp(g.rotation.z, vinkel, 6, Math.max(dt, 0.016));
    });
    return (
        <group ref={ref}>
            {/* Halen først opp slippen, så hvalen ligger med hodet mot havet */}
            <group rotation={[0, Math.PI, 0]}>
                <Hval lengde={6} />
            </group>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3(0, 2, 0));
    const forste = useRef(true);
    const skip = useRef<THREE.Group>(null);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        // Kokeriet: duver svakt. I det tomme havet seiler det bort og forsvinner.
        const s = skip.current;
        if (s) {
            s.rotation.x = Math.sin(t * 0.7) * 0.012;
            s.rotation.z = Math.sin(t * 0.5) * 0.008;
            if (modus === 'tomt') {
                const mål = beat === 0 ? 0 : beat === 1 ? 40 : 160;
                s.position.x = damp(s.position.x, mål, beat === 2 ? 0.25 : 0.4, dt || 0.016);
                s.visible = beat < 3;
            }
            if (modus === 'slipp' && beat === 3) s.position.x = damp(s.position.x, 0, 1, dt);
        }

        const mål = kameraFor(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
    });

    return (
        <>
            <color attach="background" args={['#c5d3df']} />
            <fog attach="fog" args={['#c8d5e0', 70, 260]} />
            <ambientLight intensity={0.75} color="#e2ebf3" />
            <directionalLight position={[-40, 60, 30]} intensity={1.2} color="#f4f1ea" />
            <hemisphereLight args={['#dce7f1', '#2b4255', 0.5]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[900, 900]} />
                <meshStandardMaterial color="#3e5b73" emissive="#1c3245" roughness={0.55} />
            </mesh>
            <Isfjell />
            <group ref={skip}>
                <Kokeri slipp={modus !== 'kokeri'} />
            </group>
            {modus === 'apning' && <Bater beat={beat} beatTid={beatTid} />}
            {modus === 'slipp' && <HvalPaSlipp beat={beat} beatTid={beatTid} />}
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    apning: [
        'Desember 1930',
        'Isfjell større enn kirker',
        'Kokeri: en flytende fabrikk',
        'Hvalbåter',
        'Tusenvis av km hjemmefra',
    ],
    kokeri: [
        '«Admiralen», 1903',
        'Verdens første moderne kokeri',
        'Hvalen kokes rett om bord',
        'Ingen stasjon på land',
    ],
    slipp: ['1920-tallet', 'Opphalingsslipp', 'Hele hvalen opp på dekk', 'Petter Sørlle · 1925'],
    tomt: [
        'Landene trekker seg ut',
        'Sør-Georgia: stengt 1966',
        'Siste norske sesong: 1967-1968',
        'Etter rundt hundre år',
    ],
};

interface Props {
    modus: Modus;
}

export function HvalfangstHavet({ beat, playing, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'apning';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = MERKER[modus][Math.min(beat, MERKER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 900, position: [70, 26, 90] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[8%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
