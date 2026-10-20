import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { CONTAINERFARGER, damp, frø, useKamera, v } from './felles3d';
import { Merkelapp } from './felles';

/**
 * Containeren i 3D, i to moduser.
 *
 * «boks»: én container på kaia. Beat 0: boksen. Beat 1: like bokser stables bak den
 * (containerrevolusjonen). Beat 2: hjørnene lyser (faste mål). Beat 3: målestaven viser
 * 20 fot = 1 TEU. Beat 4: en ny 20-fots boks låses på, like lang som en 40-fots ved siden av.
 *
 * «kran»: kranen flytter samme boks fra skip til tog (beat 1) og fra tog til lastebil
 * (beat 2). Beat 3: lastebilen kjører av gårde, og toget fylles med flere bokser.
 */

type Modus = 'boks' | 'kran';

const L20 = 6;
const HOYDE = 2.6;
const BREDDE = 2.4;
const STABEL = 24;

function kameraBoks(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(8 - t * 0.2, 4, 9), se: v(0, 1.3, 0) };
        case 1:
            return { pos: v(15, 10, 17), se: v(0, 2, -6) };
        case 2:
            return { pos: v(5.5, 3.6, 5.2), se: v(1, 1.3, 0) };
        case 3:
            return { pos: v(0, 5, 12), se: v(0, 1, 0) };
        default:
            return { pos: v(0, 13, 13), se: v(0, 0.5, -2.5) };
    }
}

function kameraKran(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(-4 + t * 0.2, 7, 17), se: v(-5, 2.5, 0) };
        case 1:
            return { pos: v(-1, 8, 18), se: v(-2, 3, 0) };
        case 2:
            return { pos: v(6, 7, 17), se: v(4, 2.5, 0) };
        default:
            return { pos: v(4, 16, 28), se: v(4, 2, 0) };
    }
}

/** Én container med mørke hjørnebeslag. `lys` gjør beslagene gule. */
function Container({
    lengde,
    farge,
    lys,
}: {
    lengde: number;
    farge: string;
    lys?: React.RefObject<(THREE.MeshStandardMaterial | null)[]>;
}) {
    const hjorner = useMemo(() => {
        const ut: [number, number, number][] = [];
        for (const x of [-1, 1])
            for (const y of [-1, 1])
                for (const z of [-1, 1])
                    ut.push([(x * lengde) / 2, (y * HOYDE) / 2, (z * BREDDE) / 2]);
        return ut;
    }, [lengde]);
    return (
        <group>
            <mesh>
                <boxGeometry args={[lengde, HOYDE, BREDDE]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            {/* Riller på siden, så boksen leses som en container. */}
            {Array.from({ length: Math.round(lengde * 2) }, (_, i) => (
                <mesh key={i} position={[-lengde / 2 + 0.25 + i * 0.5, 0, BREDDE / 2 + 0.01]}>
                    <boxGeometry args={[0.08, HOYDE * 0.86, 0.04]} />
                    <meshStandardMaterial color="#0f172a" transparent opacity={0.25} />
                </mesh>
            ))}
            {hjorner.map((p, i) => (
                <mesh key={i} position={p}>
                    <boxGeometry args={[0.36, 0.36, 0.36]} />
                    {lys ? (
                        <meshStandardMaterial
                            ref={(m) => {
                                lys.current[i] = m;
                            }}
                            color="#334155"
                            emissive="#facc15"
                            emissiveIntensity={0}
                        />
                    ) : (
                        <meshStandardMaterial color="#334155" />
                    )}
                </mesh>
            ))}
        </group>
    );
}

function BoksScene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kameraBoks, beat, playing);
    const a = useRef<THREE.Group>(null);
    const b = useRef<THREE.Group>(null);
    const c = useRef<THREE.Group>(null);
    const stav = useRef<THREE.Group>(null);
    const stabel = useRef<THREE.InstancedMesh>(null);
    // Materialene til de åtte hjørnene, så alle lyser samtidig.
    const lys = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const o = useMemo(() => new THREE.Object3D(), []);
    const stabelSkala = useRef(new Float32Array(STABEL));
    const farger = useMemo(
        () =>
            Array.from(
                { length: STABEL },
                (_, i) =>
                    new THREE.Color(
                        CONTAINERFARGER[Math.floor(frø(i + 1) * CONTAINERFARGER.length)]
                    )
            ),
        []
    );
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const t = tid.current;
        const k = forste.current;
        const glid = (x: number, mål: number, l = 3) => (k ? mål : damp(x, mål, l, dt));
        if (a.current)
            a.current.position.x = glid(a.current.position.x, beat >= 4 ? -L20 / 2 - 0.05 : 0);
        if (b.current) {
            const ute = beat < 4;
            b.current.position.x = glid(b.current.position.x, ute ? 16 : L20 / 2 + 0.05, 2.2);
            b.current.visible = b.current.position.x < 15;
        }
        if (c.current) {
            const s = glid(c.current.scale.y, beat >= 4 ? 1 : 0.001, 3);
            c.current.scale.set(1, Math.max(s, 0.001), 1);
            c.current.visible = s > 0.02;
        }
        if (stav.current) {
            const vis = beat >= 3;
            const s = glid(stav.current.scale.x, vis ? (beat >= 4 ? 2 : 1) : 0.001, 3);
            stav.current.scale.set(Math.max(s, 0.001), 1, 1);
            stav.current.visible = s > 0.02;
        }
        {
            const mål = beat === 2 ? 0.9 + Math.sin(t * 5) * 0.5 : beat > 2 ? 0.4 : 0;
            for (const mat of lys.current) {
                if (mat) mat.emissiveIntensity = glid(mat.emissiveIntensity, mål, 6);
            }
        }
        const m = stabel.current;
        if (m) {
            const antall = beat < 1 ? 0 : beat === 1 ? Math.min(STABEL, Math.floor(t * 8)) : STABEL;
            for (let i = 0; i < STABEL; i++) {
                const mål = i < antall ? 1 : 0;
                stabelSkala.current[i] = k
                    ? mål
                    : damp(stabelSkala.current[i], mål, 5, dt || 0.016);
                const s = Math.max(stabelSkala.current[i], 0.001);
                const kol = i % 6;
                const lag = Math.floor(i / 6) % 2;
                const rad = Math.floor(i / 12);
                o.position.set(
                    -13 + kol * 6.3,
                    HOYDE / 2 + lag * HOYDE + (1 - s) * 3,
                    -9 - rad * 3
                );
                o.scale.set(s, s, s);
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
                m.setColorAt(i, farger[i]);
            }
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
        forste.current = false;
    });
    return (
        <>
            <color attach="background" args={['#dbe7f3']} />
            <fog attach="fog" args={['#dbe7f3', 40, 120]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#ffffff', '#64748b', 0.6]} />
            <directionalLight position={[8, 20, 12]} intensity={1.5} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>
            <group ref={a} position={[0, HOYDE / 2, 0]}>
                <Container lengde={L20} farge="#dc2626" lys={lys} />
            </group>
            <group ref={b} position={[16, HOYDE / 2, 0]}>
                <Container lengde={L20} farge="#ea580c" />
            </group>
            <group ref={c} position={[0, 0, -4]} scale={[1, 0.001, 1]}>
                <group position={[0, HOYDE / 2, 0]}>
                    <Container lengde={L20 * 2 + 0.1} farge="#2563eb" />
                </group>
            </group>
            {/* Målestaven foran boksen: gul, med en markør i hver ende. */}
            <group ref={stav} position={[0, 0.06, BREDDE / 2 + 0.9]} scale={[0.001, 1, 1]}>
                <mesh>
                    <boxGeometry args={[L20 + 0.05, 0.08, 0.18]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#ca8a04"
                        emissiveIntensity={0.4}
                    />
                </mesh>
                {[-1, 1].map((s) => (
                    <mesh key={s} position={[(s * (L20 + 0.05)) / 2, 0.25, 0]}>
                        <boxGeometry args={[0.1, 0.5, 0.18]} />
                        <meshStandardMaterial color="#facc15" />
                    </mesh>
                ))}
            </group>
            <instancedMesh ref={stabel} args={[undefined, undefined, STABEL]}>
                <boxGeometry args={[L20, HOYDE, BREDDE]} />
                <meshStandardMaterial flatShading />
            </instancedMesh>
        </>
    );
}

// Kranscenen: x < -4 er sjø, kaia er resten. Skip, tog og lastebil står på rekke.
const SKIP_X = -9;
const TOG_X = 0;
const BIL_X = 8;
const DEKK = { skip: 2.2, tog: 1.2, bil: 1.3 };
const BIL_Z = 3.2;
const KRAN_Z = 5.5;
/** Plassene på togvogna der flere bokser settes ned i beat 3. */
const VOGNPLASS = [-12.8, -6.4, 6.4, 12.8];

function KranScene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kameraKran, beat, playing);
    const boks = useRef<THREE.Group>(null);
    const katt = useRef<THREE.Group>(null);
    const vaier = useRef<THREE.Mesh>(null);
    const bil = useRef<THREE.Group>(null);
    const ekstra = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const o = useMemo(() => new THREE.Object3D(), []);
    const ekstraSkala = useRef(new Float32Array(4));
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const k = forste.current;
        const glid = (x: number, mål: number, l = 2) => (k ? mål : damp(x, mål, l, dt));
        // Lastebilen kjører av gårde i beat 3.
        if (bil.current)
            bil.current.position.x = glid(
                bil.current.position.x,
                beat >= 3 ? BIL_X + 14 : BIL_X,
                0.6
            );
        const bilX = bil.current?.position.x ?? BIL_X;
        const målX = beat === 0 ? SKIP_X : beat === 1 ? TOG_X : bilX;
        const dekk = beat === 0 ? DEKK.skip : beat === 1 ? DEKK.tog : DEKK.bil;
        const g = boks.current;
        if (g) {
            g.position.x = beat >= 3 ? målX : glid(g.position.x, målX, 1.3);
            const avstand = Math.abs(g.position.x - målX);
            // Boksen løftes mens den flyttes, og senkes når den er framme.
            const løft = Math.min(1, avstand / 1.5) * 4;
            g.position.y = glid(g.position.y, dekk + HOYDE / 2 + løft, 5);
            g.position.z = glid(g.position.z, beat >= 2 ? BIL_Z : 0, 1.4);
        }
        const bx = g?.position.x ?? 0;
        const by = g?.position.y ?? 0;
        const bz = g?.position.z ?? 0;
        // Kranens katt følger boksen langs bjelken; i beat 3 står den stille over toget.
        const kattX = beat >= 3 ? TOG_X : bx;
        if (katt.current)
            katt.current.position.x = beat >= 3 ? glid(katt.current.position.x, TOG_X, 2) : kattX;
        if (vaier.current) {
            const vis = beat < 3;
            const topp = 9.4;
            const bunn = by + HOYDE / 2;
            const l = Math.max(0.1, topp - bunn);
            vaier.current.visible = vis;
            vaier.current.position.set(kattX, bunn + l / 2, bz);
            vaier.current.scale.set(1, l, 1);
        }
        const m = ekstra.current;
        if (m) {
            for (let i = 0; i < 4; i++) {
                const mål = beat >= 3 && tid.current > 0.6 + i * 0.5 ? 1 : 0;
                ekstraSkala.current[i] = k
                    ? mål
                    : damp(ekstraSkala.current[i], mål, 5, dt || 0.016);
                const s = Math.max(ekstraSkala.current[i], 0.001);
                o.position.set(TOG_X + VOGNPLASS[i], DEKK.tog + HOYDE / 2 + (1 - s) * 3, 0);
                o.scale.set(s, s, s);
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
            }
            m.instanceMatrix.needsUpdate = true;
        }
        forste.current = false;
    });
    return (
        <>
            <color attach="background" args={['#bcd7ee']} />
            <fog attach="fog" args={['#bcd7ee', 50, 140]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#ffffff', '#3b82f6', 0.6]} />
            <directionalLight position={[8, 20, 12]} intensity={1.5} />
            {/* Sjøen og kaia. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-40, 0, 0]}>
                <planeGeometry args={[72, 160]} />
                <meshStandardMaterial color="#2f6fa8" emissive="#1d4f80" emissiveIntensity={0.35} />
            </mesh>
            <mesh position={[36, 0.4, 0]}>
                <boxGeometry args={[80, 0.8, 160]} />
                <meshStandardMaterial color="#a8a29e" flatShading />
            </mesh>
            {/* Skipet ved kaia. */}
            <mesh position={[SKIP_X, 1, 0]}>
                <boxGeometry args={[7.5, 2.4, 22]} />
                <meshStandardMaterial color="#1e3a8a" flatShading />
            </mesh>
            {[-4.2, -7.2].map((z) => (
                <mesh key={z} position={[SKIP_X, DEKK.skip + HOYDE / 2, z]}>
                    <boxGeometry args={[L20, HOYDE, BREDDE * 1.1]} />
                    <meshStandardMaterial color={z === -4.2 ? '#16a34a' : '#0891b2'} flatShading />
                </mesh>
            ))}
            {/* Togskinner og vogn. */}
            {[-0.7, 0.7].map((z) => (
                <mesh key={z} position={[TOG_X, 0.85, z]}>
                    <boxGeometry args={[60, 0.1, 0.12]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
            ))}
            <mesh position={[TOG_X, 1.05, 0]}>
                <boxGeometry args={[32, 0.3, 2.2]} />
                <meshStandardMaterial color="#78350f" flatShading />
            </mesh>
            {/* Lastebilen. */}
            <group ref={bil} position={[BIL_X, 0.8, BIL_Z]}>
                <mesh position={[0, 0.35, 0]}>
                    <boxGeometry args={[L20 + 0.4, 0.3, 2.2]} />
                    <meshStandardMaterial color="#334155" />
                </mesh>
                <mesh position={[L20 / 2 + 1.1, 1, 0]}>
                    <boxGeometry args={[1.6, 1.8, 2.2]} />
                    <meshStandardMaterial color="#f59e0b" flatShading />
                </mesh>
                {[-2, 0, 2, 3.8].map((x) => (
                    <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.4, 0.4, 2.3, 12]} />
                        <meshStandardMaterial color="#0f172a" />
                    </mesh>
                ))}
            </group>
            {/* Kranen: to bein og en bjelke over skip, tog og vei. */}
            {[-15, 13].map((x) =>
                [-KRAN_Z, KRAN_Z].map((z) => (
                    <mesh key={`${x}${z}`} position={[x, 5, z]}>
                        <boxGeometry args={[0.6, 10, 0.6]} />
                        <meshStandardMaterial color="#ea580c" flatShading />
                    </mesh>
                ))
            )}
            {[-KRAN_Z, KRAN_Z].map((z) => (
                <mesh key={z} position={[-1, 10, z]}>
                    <boxGeometry args={[30, 0.8, 0.6]} />
                    <meshStandardMaterial color="#ea580c" flatShading />
                </mesh>
            ))}
            <group ref={katt} position={[SKIP_X, 9.8, 0]}>
                <mesh>
                    <boxGeometry args={[1.8, 0.8, KRAN_Z * 2 + 0.4]} />
                    <meshStandardMaterial color="#334155" />
                </mesh>
            </group>
            <mesh ref={vaier}>
                <cylinderGeometry args={[0.06, 0.06, 1, 6]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* Boksen vi følger. */}
            <group ref={boks} position={[SKIP_X, DEKK.skip + HOYDE / 2, 0]}>
                <Container lengde={L20} farge="#dc2626" />
            </group>
            <instancedMesh ref={ekstra} args={[undefined, undefined, 4]}>
                <boxGeometry args={[L20, HOYDE, BREDDE]} />
                <meshStandardMaterial color="#7c3aed" flatShading />
            </instancedMesh>
        </>
    );
}

const TEKSTER: Record<Modus, string[]> = {
    boks: [
        'Containeren: en stor metallboks',
        'Fra 1960-årene: containerrevolusjonen',
        'Faste mål, ned til millimeteren',
        '20 fot = 1 TEU',
        '2 × 20 fot = 40 fot',
    ],
    kran: [
        'Samme boks passer overalt',
        'Fra skip til tog',
        'Fra tog til lastebil',
        'Raskere og billigere',
    ],
};

export function GlobalHandelBoks({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus === 'kran' ? 'kran' : 'boks';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekster = TEKSTER[modus];
    const tekst = tekster[Math.min(beat, tekster.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 45, near: 0.3, far: 250, position: [8, 4, 9] }}
            >
                {modus === 'kran' ? (
                    <KranScene beat={beat} playing={playing} />
                ) : (
                    <BoksScene beat={beat} playing={playing} />
                )}
            </Canvas>
            <AnimatePresence mode="wait">
                <Merkelapp key={`${modus}-${beat}`} tekst={tekst} />
            </AnimatePresence>
        </div>
    );
}
