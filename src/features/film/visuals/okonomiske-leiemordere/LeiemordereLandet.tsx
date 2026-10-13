import { useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Calculator, Shirt } from 'lucide-react';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, useKamera, v } from './felles3d';

/**
 * Petrolia, et lite oppdiktet land med olje, sett som en øy i havet.
 * «ankomst»: landet, så stridsvogner på stranda, så mannen i dress med stresskoffert på kaia.
 * «lan»: en haug med lånepenger. Myntene går til det vestlige skipet mens kraftverket reiser seg,
 *   og igjen står bare et rødt tårn av gjeld.
 * «gjeld»: gjeldstårnet vokser, husene får røde merker, oljetønner går ut på skipet og en
 *   fremmed militærbase dukker opp.
 * «elite»: tre gullvillaer på høyden. Penger fra prosjektet går dit, mens gjelden havner hos
 *   vanlige folk.
 */

type Modus = 'ankomst' | 'lan' | 'gjeld' | 'elite';

const SKIP_INNE = 37;
const SKIP_UTE = 110;
const HUS: [number, number][] = [
    [10, -6],
    [15, -1],
    [9, 2],
    [16, 6],
    [11, 9],
    [5, -11],
];
const BORETÅRN: [number, number][] = [
    [-14, -10],
    [-7, -16],
];
const KRAFTVERK: [number, number, number] = [-2, 0, 14];
const HAUG: [number, number, number] = [3, 0, -1];
const GJELD: [number, number, number] = [-5, 0, 3];
const VILLA_FOT: [number, number, number] = [-17, 0, 6];
const BASE: [number, number, number] = [-22, 0, -8];
const GJELD_MAKS = 12;

function skipInne(m: Modus, b: number) {
    if (m === 'ankomst') return b >= 2;
    if (m === 'lan') return true;
    if (m === 'gjeld') return b >= 2;
    return false;
}
function kraftverk(m: Modus, b: number) {
    if (m === 'lan') return b >= 2;
    return m !== 'ankomst';
}
function haug(m: Modus, b: number) {
    return m === 'lan' && b <= 1;
}
function gjeldHøyde(m: Modus, b: number) {
    if (m === 'lan') return b >= 3 ? 4 : 0;
    if (m === 'gjeld') return b === 0 ? 8 : GJELD_MAKS;
    if (m === 'elite') return 8;
    return 0;
}
function røde(m: Modus, b: number) {
    return (m === 'gjeld' && b >= 1) || (m === 'elite' && b >= 3);
}

function kamera(m: Modus) {
    return (b: number, t: number) => {
        if (m === 'ankomst') {
            if (b === 0) return { pos: v(-14 + t * 0.5, 42, 62), se: v(0, 0, 0) };
            if (b === 1) return { pos: v(48, 11, 26), se: v(20, 0, 0) };
            return { pos: v(36, 5.5, 4), se: v(27, 1.8, -1.5) };
        }
        if (m === 'lan') {
            if (b === 0) return { pos: v(20, 12, 20), se: v(3, 1, -1) };
            if (b === 1) return { pos: v(26 + t * 0.3, 18, 30), se: v(18, 0, 2) };
            if (b === 2) return { pos: v(-20, 14, 40), se: v(6, 2, 8) };
            return { pos: v(-24, 10, -2), se: v(-5, 4.5, 3) };
        }
        if (m === 'gjeld') {
            if (b === 0) return { pos: v(-26, 12, -4), se: v(-5, 6, 3) };
            if (b === 1) return { pos: v(24, 20, 34), se: v(2, 3, 0) };
            if (b === 2) return { pos: v(4 + t * 0.3, 32, 46), se: v(8, 0, -6) };
            return { pos: v(-46, 17, 12), se: v(-20, 3, -5) };
        }
        if (b === 0) return { pos: v(-12 + t * 0.4, 42, 62), se: v(0, 0, 0) };
        if (b === 1) return { pos: v(-34, 13, 28), se: v(-17, 3, 6) };
        if (b === 2) return { pos: v(-14, 20, 40), se: v(-8, 2, 9) };
        return { pos: v(30, 11, 20), se: v(11, 1, 1) };
    };
}

/** Et objekt som vokser opp av bakken når det skal vises. */
function Vokser({
    vis,
    playing,
    pos,
    forsinkelse = 0,
    children,
}: {
    vis: boolean;
    playing: boolean;
    pos: [number, number, number];
    forsinkelse?: number;
    children: ReactNode;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current = vis ? tid.current + dt : 0;
        const g = ref.current;
        if (!g) return;
        const mål = vis && (forste.current || tid.current >= forsinkelse) ? 1 : 0.001;
        const s = forste.current ? mål : damp(g.scale.y, mål, 3, dt);
        forste.current = false;
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={pos}>
            {children}
        </group>
    );
}

function Boretårn() {
    return (
        <>
            <mesh position={[0, 3.5, 0]}>
                <cylinderGeometry args={[0.25, 1.5, 7, 4]} />
                <meshStandardMaterial color="#334155" flatShading />
            </mesh>
            <mesh position={[0, 7.2, 0]}>
                <boxGeometry args={[0.9, 0.6, 0.9]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[1.8, 0.7, 0]}>
                <cylinderGeometry args={[0.9, 0.9, 1.4, 12]} />
                <meshStandardMaterial
                    color="#111827"
                    emissive="#111827"
                    emissiveIntensity={0.2}
                />
            </mesh>
        </>
    );
}

function Hus({ farge }: { farge: string }) {
    return (
        <>
            <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[2.8, 2.4, 2.8]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 2.9, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[2.2, 1.4, 4]} />
                <meshStandardMaterial color="#9a3412" flatShading />
            </mesh>
        </>
    );
}

/** Rødt gjeldsmerke som svever over et hus. */
function Merke({ vis, playing, i }: { vis: boolean; playing: boolean; i: number }) {
    return (
        <Vokser vis={vis} playing={playing} pos={[0, 4.2, 0]} forsinkelse={0.2 + i * 0.25}>
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[1.6, 1.6, 0.4]} />
                <meshStandardMaterial color="#dc2626" emissive="#b91c1c" emissiveIntensity={0.6} />
            </mesh>
        </Vokser>
    );
}

function Kraftverket() {
    return (
        <>
            <mesh position={[0, 3, 0]}>
                <boxGeometry args={[11, 6, 6]} />
                <meshStandardMaterial
                    color="#cbd5e1"
                    emissive="#64748b"
                    emissiveIntensity={0.2}
                    flatShading
                />
            </mesh>
            {[-3, 3].map((x) => (
                <mesh key={x} position={[x, 7.5, -1]}>
                    <cylinderGeometry args={[0.8, 1.1, 5, 10]} />
                    <meshStandardMaterial color="#e2e8f0" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 4, 3.05]}>
                <boxGeometry args={[6, 1, 0.1]} />
                <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.5} />
            </mesh>
        </>
    );
}

function Villa() {
    return (
        <>
            <mesh position={[0, 1.8, 0]}>
                <boxGeometry args={[5, 3.6, 4]} />
                <meshStandardMaterial
                    color="#fde68a"
                    emissive="#ca8a04"
                    emissiveIntensity={0.35}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 4.2, 0]}>
                <boxGeometry args={[5.6, 1.2, 4.6]} />
                <meshStandardMaterial color="#b45309" flatShading />
            </mesh>
            {[-1.6, 0, 1.6].map((x) => (
                <mesh key={x} position={[x, 1.6, 2.05]}>
                    <boxGeometry args={[0.35, 3.2, 0.35]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
            ))}
        </>
    );
}

function Base() {
    return (
        <>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[12, 9]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>
            <mesh position={[-2, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[2.2, 2.2, 6, 12, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color="#4d5b3a" side={THREE.DoubleSide} flatShading />
            </mesh>
            <mesh position={[3.5, 2.5, -2]}>
                <cylinderGeometry args={[0.2, 0.2, 5, 6]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[3.5, 5.2, -2]} rotation={[0.6, 0, 0]}>
                <cylinderGeometry args={[1.4, 0.2, 0.6, 12]} />
                <meshStandardMaterial color="#e2e8f0" flatShading />
            </mesh>
        </>
    );
}

/** Stridsvogn: kasse med tårn og kanon. Bare et bilde på «hæren», ingen skyting. */
function Stridsvogn() {
    return (
        <>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[3, 1.2, 1.9]} />
                <meshStandardMaterial color="#4d5b3a" flatShading />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[1.5, 0.7, 1.3]} />
                <meshStandardMaterial color="#3f4a30" flatShading />
            </mesh>
            <mesh position={[-1.6, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.14, 0.14, 2, 6]} />
                <meshStandardMaterial color="#2f3824" />
            </mesh>
        </>
    );
}

/** Mannen i dress med stresskoffert. */
function Mannen() {
    return (
        <>
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.28, 0.32, 1.1, 10]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 1.55, 0]}>
                <cylinderGeometry args={[0.4, 0.34, 1, 10]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 1.95, 0.33]}>
                <boxGeometry args={[0.12, 0.5, 0.05]} />
                <meshStandardMaterial color="#dc2626" />
            </mesh>
            <mesh position={[0, 2.35, 0]}>
                <sphereGeometry args={[0.3, 14, 12]} />
                <meshStandardMaterial color="#e8b892" />
            </mesh>
            <mesh position={[0, 0.6, 0.55]}>
                <boxGeometry args={[0.75, 0.55, 0.18]} />
                <meshStandardMaterial color="#7c4a1e" emissive="#3b1d07" emissiveIntensity={0.3} />
            </mesh>
        </>
    );
}

/** Skipet fra Vesten. Glir inn til kaia eller ut av bildet. */
function Skip({ inne, playing }: { inne: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const g = ref.current;
        if (!g) return;
        const mål = inne ? SKIP_INNE : SKIP_UTE;
        g.position.x = forste.current ? mål : damp(g.position.x, mål, 0.5, dt);
        forste.current = false;
        g.position.y = -0.4 + Math.sin(tid.current * 0.9) * 0.08;
    });
    return (
        <group ref={ref} position={[SKIP_INNE, -0.4, 0]}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[4.6, 2.4, 22]} />
                <meshStandardMaterial
                    color="#1e3a8a"
                    emissive="#172554"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 3.8, -7.5]}>
                <boxGeometry args={[3.8, 3.2, 3.6]} />
                <meshStandardMaterial
                    color="#f8fafc"
                    emissive="#94a3b8"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 6, -7.5]}>
                <cylinderGeometry args={[0.6, 0.6, 2, 10]} />
                <meshStandardMaterial color="#dc2626" />
            </mesh>
        </group>
    );
}

/**
 * Ting som strømmer fra ett sted til et annet: mynter eller oljetønner.
 * Forsvinner mykt når strømmen stopper.
 */
function Strøm({
    fra,
    til,
    på,
    playing,
    type,
    antall = 12,
}: {
    fra: [number, number, number];
    til: [number, number, number];
    på: boolean;
    playing: boolean;
    type: 'mynt' | 'tønne';
    antall?: number;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const synlig = useRef(på ? 1 : 0);
    const forskyv = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        synlig.current = damp(synlig.current, på ? 1 : 0, 2, dt);
        forskyv.current += dt * 0.12;
        const im = ref.current;
        if (!im) return;
        im.visible = synlig.current > 0.02;
        for (let i = 0; i < antall; i++) {
            const u = (i / antall + forskyv.current) % 1;
            const s = Math.max(0.001, synlig.current * Math.min(1, u * 8, (1 - u) * 8));
            const x = fra[0] + u * (til[0] - fra[0]);
            const z = fra[2] + u * (til[2] - fra[2]);
            const y = fra[1] + u * (til[1] - fra[1]) + Math.sin(u * Math.PI) * 3 + 0.6;
            m.makeScale(s, s, s).setPosition(x, y, z);
            im.setMatrixAt(i, m);
        }
        im.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, antall]}>
            {type === 'mynt' ? (
                <cylinderGeometry args={[0.7, 0.7, 0.25, 14]} />
            ) : (
                <cylinderGeometry args={[0.55, 0.55, 1.3, 10]} />
            )}
            <meshStandardMaterial
                color={type === 'mynt' ? '#facc15' : '#111827'}
                emissive={type === 'mynt' ? '#ca8a04' : '#0f172a'}
                emissiveIntensity={type === 'mynt' ? 0.6 : 0.2}
                metalness={type === 'mynt' ? 0.3 : 0}
                flatShading
            />
        </instancedMesh>
    );
}

/** Haugen med lånepenger: mynter stablet i en kjegle. */
function Pengehaug({ vis, playing }: { vis: boolean; playing: boolean }) {
    const mynter = useMemo(() => {
        const ut: [number, number, number][] = [];
        for (let lag = 0; lag < 5; lag++) {
            const r = 2.6 - lag * 0.5;
            const n = 10 - lag * 2;
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2 + lag;
                ut.push([Math.cos(a) * r * 0.7, 0.2 + lag * 0.45, Math.sin(a) * r * 0.7]);
            }
        }
        ut.push([0, 2.5, 0]);
        return ut;
    }, []);
    return (
        <Vokser vis={vis} playing={playing} pos={HAUG}>
            {mynter.map((p, i) => (
                <mesh key={i} position={p} rotation={[0.15 * (i % 3), 0, 0.1 * (i % 2)]}>
                    <cylinderGeometry args={[0.8, 0.8, 0.3, 14]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#ca8a04"
                        emissiveIntensity={0.55}
                        metalness={0.3}
                        flatShading
                    />
                </mesh>
            ))}
        </Vokser>
    );
}

/** Gjeldstårnet: røde blokker som stables opp. */
function Gjeldstårn({ høyde, playing }: { høyde: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const skala = useRef<number[]>(Array.from({ length: GJELD_MAKS }, (_, i) => (i < høyde ? 1 : 0)));
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const im = ref.current;
        if (!im) return;
        for (let i = 0; i < GJELD_MAKS; i++) {
            // Blokkene kommer én og én nedenfra.
            const mål = i < høyde ? 1 : 0;
            const fart = mål > skala.current[i] ? 6 - Math.min(5, i * 0.35) : 6;
            skala.current[i] = damp(skala.current[i], mål, fart, dt);
            const s = Math.max(0.001, skala.current[i]);
            m.makeScale(s, s, s).setPosition(0, 0.6 + i * 1.15, 0);
            im.setMatrixAt(i, m);
        }
        im.instanceMatrix.needsUpdate = true;
    });
    return (
        <group position={GJELD}>
            <instancedMesh ref={ref} args={[undefined, undefined, GJELD_MAKS]}>
                <boxGeometry args={[2.6, 1.05, 2.6]} />
                <meshStandardMaterial
                    color="#dc2626"
                    emissive="#991b1b"
                    emissiveIntensity={0.45}
                    flatShading
                />
            </instancedMesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kam = useMemo(() => kamera(modus), [modus]);
    useKamera(kam, beat, playing);
    const inne = skipInne(modus, beat);
    const kai: [number, number, number] = [SKIP_INNE - 3, 0, 0];
    return (
        <>
            <color attach="background" args={['#d6e9f6']} />
            <fog attach="fog" args={['#d6e9f6', 70, 190]} />
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#fff7e6', '#4d7c3a', 0.7]} />
            <directionalLight position={[-25, 40, 25]} intensity={1.3} color="#fff1d6" />

            {/* Havet og øya */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                <planeGeometry args={[400, 400]} />
                <meshStandardMaterial color="#2f7fbf" emissive="#1e5f91" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, -1, 0]}>
                <cylinderGeometry args={[31, 33, 2, 40]} />
                <meshStandardMaterial
                    color="#86b86a"
                    emissive="#3f6b2a"
                    emissiveIntensity={0.15}
                    flatShading
                />
            </mesh>
            <mesh position={[0, -0.45, 0]}>
                <cylinderGeometry args={[33.5, 33.5, 0.1, 40]} />
                <meshStandardMaterial color="#e9d9a6" />
            </mesh>
            {/* Høyden der eliten bor */}
            <mesh position={[VILLA_FOT[0], 0.6, VILLA_FOT[2]]}>
                <cylinderGeometry args={[6.5, 8, 1.6, 20]} />
                <meshStandardMaterial color="#7aa95e" flatShading />
            </mesh>
            {/* Kaia */}
            <mesh position={[30.5, 0.3, 0]}>
                <boxGeometry args={[5, 0.8, 8]} />
                <meshStandardMaterial color="#9ca3af" flatShading />
            </mesh>
            {/* Veien fra land til kaia */}
            <mesh position={[14, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[30, 2.6]} />
                <meshStandardMaterial color="#a8a29e" />
            </mesh>

            {BORETÅRN.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <Boretårn />
                </group>
            ))}
            {HUS.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <Hus farge={['#fecaca', '#bfdbfe', '#bbf7d0', '#fed7aa', '#e9d5ff', '#fef08a'][i]} />
                    <Merke vis={røde(modus, beat)} playing={playing} i={i} />
                </group>
            ))}

            <Vokser vis={kraftverk(modus, beat)} playing={playing} pos={KRAFTVERK} forsinkelse={0.3}>
                <Kraftverket />
            </Vokser>
            <Pengehaug vis={haug(modus, beat)} playing={playing} />
            <Gjeldstårn høyde={gjeldHøyde(modus, beat)} playing={playing} />

            {[
                [-2, 0, 0],
                [6, 0, 0],
            ].map(([dx, , dz], i) => (
                <Vokser
                    key={i}
                    vis={modus === 'elite' && beat >= 1}
                    playing={playing}
                    pos={[VILLA_FOT[0] + dx - 2, 1.4, VILLA_FOT[2] + dz + (i ? -3 : 1)]}
                    forsinkelse={0.2 + i * 0.4}
                >
                    <Villa />
                </Vokser>
            ))}

            <Vokser vis={modus === 'gjeld' && beat >= 3} playing={playing} pos={BASE} forsinkelse={0.3}>
                <Base />
            </Vokser>

            {[
                [24, -9],
                [22, -3],
                [24, 3],
                [22, 9],
            ].map(([x, z], i) => (
                <Vokser
                    key={i}
                    vis={modus === 'ankomst' && beat === 1}
                    playing={playing}
                    pos={[x, 0, z]}
                    forsinkelse={0.2 + i * 0.2}
                >
                    <Stridsvogn />
                </Vokser>
            ))}
            <Vokser vis={modus === 'ankomst' && beat >= 2} playing={playing} pos={[28, 0.7, 0]} forsinkelse={0.4}>
                <group rotation={[0, Math.PI / 2 - 0.5, 0]}>
                    <Mannen />
                </group>
            </Vokser>
            <Vokser vis={modus === 'lan' && beat === 0} playing={playing} pos={[7, 0, 1]}>
                <group rotation={[0, 0.9, 0]}>
                    <Mannen />
                </group>
            </Vokser>

            <Skip inne={inne} playing={playing} />
            {/* Lånepengene går til de vestlige selskapene, og videre ut på skipet. */}
            <Strøm
                fra={[HAUG[0], 0.5, HAUG[2]]}
                til={[KRAFTVERK[0], 2, KRAFTVERK[2] - 2]}
                på={modus === 'lan' && beat === 1}
                playing={playing}
                type="mynt"
            />
            <Strøm
                fra={[KRAFTVERK[0] + 4, 1, KRAFTVERK[2] - 3]}
                til={kai}
                på={modus === 'lan' && beat >= 2}
                playing={playing}
                type="mynt"
                antall={16}
            />
            {/* Olje i stedet for penger. */}
            {BORETÅRN.map(([x, z], i) => (
                <Strøm
                    key={i}
                    fra={[x + 2, 0, z]}
                    til={kai}
                    på={modus === 'gjeld' && beat >= 2}
                    playing={playing}
                    type="tønne"
                    antall={10}
                />
            ))}
            {/* Kontraktene: penger fra prosjektet opp til villaene. */}
            <Strøm
                fra={[KRAFTVERK[0] - 4, 1, KRAFTVERK[2] - 2]}
                til={[VILLA_FOT[0] + 1, 2, VILLA_FOT[2]]}
                på={modus === 'elite' && beat >= 2}
                playing={playing}
                type="mynt"
            />
        </>
    );
}

const TEKST: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    ankomst: [
        { tekst: 'Et helt land' },
        { tekst: 'Med en hær?' },
        { tekst: 'Eller med en stresskoffert?', rod: true },
    ],
    lan: [
        { tekst: 'Petrolia: et stort lån' },
        { tekst: 'Pengene går til vestlige selskaper' },
        { tekst: 'Pengene seiler hjem igjen' },
        { tekst: 'Igjen i landet: gjelden', rod: true },
    ],
    gjeld: [
        { tekst: 'Gjelden vokser', rod: true },
        { tekst: 'Petrolia kan ikke betale', rod: true },
        { tekst: 'Betal med olje' },
        { tekst: 'Baser og lojalitet' },
    ],
    elite: [
        { tekst: 'Hjelp fra innsiden' },
        { tekst: 'Eliten: de få på toppen' },
        { tekst: 'Kontrakter, jobber og makt' },
        { tekst: 'Vanlige folk: gjelden', rod: true },
    ],
};

export function LeiemordereLandet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'ankomst';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const t = TEKST[modus][Math.min(beat, TEKST[modus].length - 1)];
    const gjeldMerke = gjeldHøyde(modus, beat) > 0 && (modus === 'lan' || (modus === 'gjeld' && beat <= 1));
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 450, position: [-14, 42, 62] }}
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
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-700 text-white' : 'bg-white/90 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'ankomst' && beat >= 2 && (
                    <motion.div
                        key="koffert"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.8, type: 'spring', stiffness: 160, damping: 18 }}
                        className="absolute left-[5%] top-[26%] w-[19rem] p-5 rounded-3xl bg-white/95 shadow-2xl space-y-3"
                    >
                        {[
                            { Ikon: Shirt, tekst: 'Dress' },
                            { Ikon: Briefcase, tekst: 'Stresskoffert' },
                            { Ikon: Calculator, tekst: 'Kalkulator' },
                        ].map(({ Ikon, tekst }, i) => (
                            <motion.div
                                key={tekst}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 + i * 0.4 }}
                                className="flex items-center gap-4 text-2xl font-bold text-slate-900"
                            >
                                <Ikon className="w-9 h-9 text-slate-700" />
                                {tekst}
                            </motion.div>
                        ))}
                        <div className="pt-2 border-t border-slate-200 text-xl font-semibold text-red-700">
                            Ingen gevær
                        </div>
                    </motion.div>
                )}
                {gjeldMerke && (
                    <motion.div
                        key="gjeld"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1 }}
                        className="absolute right-[6%] bottom-[10%] px-5 py-3 rounded-2xl bg-red-700 text-white shadow-2xl font-display font-black text-3xl"
                    >
                        GJELD
                    </motion.div>
                )}
                {modus === 'elite' && beat >= 1 && beat <= 2 && (
                    <motion.div
                        key="elite"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute right-[5%] top-[26%] w-[18rem] p-5 rounded-3xl bg-amber-50/95 shadow-2xl"
                    >
                        <div className="font-display font-black text-3xl text-amber-800">Eliten</div>
                        <div className="mt-1 text-xl font-semibold text-slate-700">
                            Få personer, mye penger og makt
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
