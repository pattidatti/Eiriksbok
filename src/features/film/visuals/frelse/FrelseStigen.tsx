import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { TRADISJONER, TRINN, plassPaTrinn, type Tradisjon } from './data';

/**
 * Frelsens stige i 3D: fem trinn fra «gjort for deg» øverst (i lyset) til «gjort av deg»
 * nederst (på bakken). Tradisjonene settes på stigen som brikker, én etter én. Hver beat har
 * et fokus: en tradisjon, en ende av stigen, eller et mønster (ytterst, midten, skygger).
 */

interface Fokus {
    tekst?: string;
    tradisjon?: string;
    /** Liste med id-er, eller «alle». */
    plassert?: string[] | 'alle';
    ende?: 'topp' | 'bunn';
    ytterst?: boolean;
    midten?: boolean;
    skygger?: boolean;
    /** Brikker som ikke er plassert ennå, venter på bakken. */
    venter?: boolean;
}

interface Props {
    fokus?: Fokus[];
}

const BREDDE = 13;
const trinnY = (k: number) => (4 - k) * 2.5 + 0.9;
const trinnZ = (k: number) => -(4 - k) * 0.9;
/** Piler opp: bhakti-hinduismen og rent land-buddhismen trekker mot nåden. */
const SKYGGER: { id: string; etikett: string }[] = [
    { id: 'hinduisme', etikett: 'bhakti: nærmere nåden' },
    { id: 'buddhisme', etikett: 'rent land: nærmere nåden' },
];

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

function brikkePos(t: Tradisjon): THREE.Vector3 {
    const { indeks, antall } = plassPaTrinn(t.id);
    const x = (indeks - (antall - 1) / 2) * 3.4;
    return new THREE.Vector3(x, trinnY(t.trinn) + 0.2, trinnZ(t.trinn) + 0.1);
}

function lysFor(t: Tradisjon, f: Fokus): number {
    if (f.tradisjon) return f.tradisjon === t.id ? 1 : 0.35;
    if (f.ytterst) return t.trinn === 0 || t.trinn === 4 ? 1 : 0.3;
    if (f.midten) return t.trinn >= 1 && t.trinn <= 3 ? 1 : 0.3;
    if (f.skygger) return SKYGGER.some((s) => s.id === t.id) ? 1 : 0.3;
    return 1;
}

function Brikke({
    t,
    synlig,
    fokus,
    nr,
}: {
    t: Tradisjon;
    synlig: boolean;
    fokus: Fokus;
    nr: number;
}) {
    const g = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const mal = useMemo(() => brikkePos(t), [t]);
    const forste = useRef(true);
    const lys = lysFor(t, fokus);
    const valgt = fokus.tradisjon === t.id;
    // Før de er plassert, kan brikkene vente i en rad på bakken foran stigen.
    const venter = !synlig && Boolean(fokus.venter);
    const vist = synlig || venter;
    useFrame((state, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const dt = forste.current ? 1 : Math.min(rawDt, 0.05);
        forste.current = false;
        // Brikken faller ned på trinnet sitt ovenfra når den plasseres.
        const y = venter
            ? Math.abs(Math.sin(state.clock.elapsedTime * 2 + nr)) * 0.25
            : synlig
              ? mal.y + (valgt ? 0.35 + Math.sin(state.clock.elapsedTime * 3) * 0.12 : 0)
              : mal.y + 6;
        gr.position.x = damp(gr.position.x, venter ? (nr - 4) * 2.3 : mal.x, 3, dt);
        gr.position.z = damp(gr.position.z, venter ? 4.5 : mal.z, 3, dt);
        gr.position.y = damp(gr.position.y, y, 4, dt);
        const s = vist ? (valgt ? 1.25 : venter ? 0.85 : 1) : 0.001;
        gr.scale.setScalar(damp(gr.scale.x, s, 5, dt));
        if (mat.current) {
            mat.current.opacity = damp(mat.current.opacity, 0.2 + lys * 0.8, 4, dt);
            mat.current.emissiveIntensity = damp(
                mat.current.emissiveIntensity,
                valgt ? 0.6 : 0.15,
                4,
                dt
            );
        }
    });
    return (
        <group ref={g} position={[mal.x, mal.y + 6, mal.z]} scale={0.001}>
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.75, 0.85, 1.1, 24]} />
                <meshStandardMaterial
                    ref={mat}
                    color={t.farge}
                    emissive={t.farge}
                    emissiveIntensity={0.15}
                    transparent
                    opacity={1}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 1.35, 0]}>
                <sphereGeometry args={[0.45, 16, 12]} />
                <meshStandardMaterial color={t.farge} flatShading />
            </mesh>
            {vist && (
                <Html
                    position={venter && nr % 2 === 1 ? [0, 2.4, 0] : [0, -0.45, 0.9]}
                    center
                    zIndexRange={[10, 0]}
                >
                    <div
                        className="px-2 py-0.5 rounded-md bg-white/95 shadow text-xs md:text-sm font-bold whitespace-nowrap text-slate-800 transition-opacity duration-500"
                        style={{ opacity: 0.35 + lys * 0.65, borderBottom: `3px solid ${t.farge}` }}
                    >
                        {t.navn}
                    </div>
                </Html>
            )}
        </group>
    );
}

/** En pil opp fra brikken: denne retningen ligger nærmere nåden enn resten av religionen. */
function Pil({ id, etikett, synlig }: { id: string; etikett: string; synlig: boolean }) {
    const t = TRADISJONER.find((x) => x.id === id)!;
    const fra = useMemo(() => brikkePos(t), [t]);
    const g = useRef<THREE.Group>(null);
    useFrame((state, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const dt = Math.min(rawDt, 0.05);
        gr.scale.setScalar(damp(gr.scale.x, synlig ? 1 : 0.001, 4, dt));
        gr.position.y = fra.y + 0.4 + ((state.clock.elapsedTime * 0.8) % 1) * 0.5;
    });
    return (
        <group ref={g} position={[fra.x + 1.4, fra.y + 0.4, fra.z + 0.6]} scale={0.001}>
            <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.16, 0.16, 1.6, 10]} />
                <meshStandardMaterial color={t.farge} emissive={t.farge} emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 1.9, 0]}>
                <coneGeometry args={[0.45, 0.8, 14]} />
                <meshStandardMaterial color={t.farge} emissive={t.farge} emissiveIntensity={0.5} />
            </mesh>
            {synlig && (
                <Html position={[0.5, 1.9, 0]} zIndexRange={[10, 0]}>
                    <div
                        className="-translate-y-1/2 px-2 py-0.5 rounded-md bg-white/95 shadow text-xs md:text-sm font-bold whitespace-nowrap text-slate-800 border-2 border-dashed"
                        style={{ borderColor: t.farge }}
                    >
                        {etikett}
                    </div>
                </Html>
            )}
        </group>
    );
}

/** Lyset som kommer ned ovenfra: «noen må hente deg». */
function Lysstrale({ synlig }: { synlig: boolean }) {
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((state, rawDt) => {
        if (!mat.current) return;
        const dt = Math.min(rawDt, 0.05);
        const mal = synlig ? 0.32 + Math.sin(state.clock.elapsedTime * 2) * 0.06 : 0;
        mat.current.opacity = damp(mat.current.opacity, mal, 3, dt);
    });
    return (
        <mesh position={[0, trinnY(0) + 7, trinnZ(0)]}>
            <cylinderGeometry args={[2.2, 4.5, 14, 32, 1, true]} />
            <meshBasicMaterial
                ref={mat}
                color="#fde68a"
                transparent
                opacity={0}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
}

/** Et menneske nederst ved stigen som må klatre opp selv. */
function Klatrer({ synlig }: { synlig: boolean }) {
    const g = useRef<THREE.Group>(null);
    useFrame((state, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const dt = Math.min(rawDt, 0.05);
        gr.scale.setScalar(damp(gr.scale.x, synlig ? 1 : 0.001, 4, dt));
        gr.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 3)) * 0.3;
    });
    return (
        <group ref={g} position={[-4.5, 0, 2.2]} scale={0.001}>
            <mesh position={[0, 0.8, 0]}>
                <capsuleGeometry args={[0.35, 0.9, 4, 10]} />
                <meshStandardMaterial color="#334155" flatShading />
            </mesh>
            <mesh position={[0, 1.85, 0]}>
                <sphereGeometry args={[0.33, 14, 12]} />
                <meshStandardMaterial color="#e0b98a" flatShading />
            </mesh>
            {/* Armer som strekker seg opp mot neste trinn */}
            <mesh position={[0.35, 1.7, 0]} rotation={[0, 0, -0.35]}>
                <capsuleGeometry args={[0.1, 0.8, 4, 6]} />
                <meshStandardMaterial color="#334155" flatShading />
            </mesh>
            <mesh position={[-0.35, 1.7, 0]} rotation={[0, 0, 0.35]}>
                <capsuleGeometry args={[0.1, 0.8, 4, 6]} />
                <meshStandardMaterial color="#334155" flatShading />
            </mesh>
        </group>
    );
}

function kameraFor(f: Fokus, t: number): { pos: THREE.Vector3; se: THREE.Vector3 } {
    const drift = Math.sin(t * 0.3) * 1.2;
    const tr = f.tradisjon ? TRADISJONER.find((x) => x.id === f.tradisjon) : undefined;
    if (tr) {
        const p = brikkePos(tr);
        return {
            pos: new THREE.Vector3(p.x * 0.2 + 3 + drift, p.y + 1.4, p.z + 19),
            se: new THREE.Vector3(p.x * 0.2 + 3, p.y - 0.2, p.z),
        };
    }
    if (f.ende === 'topp') {
        return {
            pos: new THREE.Vector3(3 + drift, trinnY(0) + 2.5, 16),
            se: new THREE.Vector3(3, trinnY(0) + 1, trinnZ(0)),
        };
    }
    if (f.ende === 'bunn') {
        return {
            pos: new THREE.Vector3(3 + drift, trinnY(4) + 3.5, 19),
            se: new THREE.Vector3(3, trinnY(4) + 2.6, trinnZ(4)),
        };
    }
    return {
        pos: new THREE.Vector3(2.5 + drift, 7.5, 24),
        se: new THREE.Vector3(2.5, 6.6, -1.8),
    };
}

function Scene({
    fokus,
    beat,
    playing,
    aktivt,
}: {
    fokus: Fokus;
    beat: number;
    playing: boolean;
    aktivt: number | null;
}) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3(0, 5, 0));
    const forste = useRef(true);
    const visEnder = !fokus.tradisjon && !fokus.venter;
    const plassert =
        fokus.plassert === 'alle' ? TRADISJONER.map((t) => t.id) : (fokus.plassert ?? []);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const k = kameraFor(fokus, beatTid.current);
        const f = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(k.pos, f);
        se.current.lerp(k.se, f);
        camera.lookAt(se.current);
    });

    const trinnFarge = (k: number) => {
        if (fokus.ende === 'topp' && k === 0) return '#fcd34d';
        if (fokus.ende === 'bunn' && k === 4) return '#fcd34d';
        if (fokus.ytterst && (k === 0 || k === 4)) return '#fcd34d';
        if (fokus.midten && k >= 1 && k <= 3) return '#fcd34d';
        const tr = fokus.tradisjon ? TRADISJONER.find((x) => x.id === fokus.tradisjon) : undefined;
        if (tr && tr.trinn === k) return '#fde68a';
        return '#c8a77a';
    };

    return (
        <>
            <color attach="background" args={['#e9eef5']} />
            <fog attach="fog" args={['#e9eef5', 40, 80]} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[8, 20, 16]} intensity={1.3} color="#fff7e8" />
            <hemisphereLight args={['#fff8e1', '#94a3b8', 0.45]} />
            {/* Bakken */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial color="#cbd5c0" />
            </mesh>
            {/* Lys sky øverst, der gaven kommer fra */}
            <mesh position={[0, trinnY(0) + 6.5, trinnZ(0) - 3]}>
                <sphereGeometry args={[2.4, 24, 16]} />
                <meshStandardMaterial color="#fff7d6" emissive="#fde68a" emissiveIntensity={0.9} />
            </mesh>
            {/* Vangene */}
            {[-1, 1].map((s) => (
                <mesh
                    key={s}
                    position={[
                        s * (BREDDE / 2 + 0.4),
                        (trinnY(0) + 1.5) / 2,
                        (trinnZ(0) + trinnZ(4)) / 2,
                    ]}
                    rotation={[Math.atan2(trinnZ(0) - trinnZ(4), trinnY(0) - trinnY(4)), 0, 0]}
                >
                    <boxGeometry args={[0.6, trinnY(0) + 2.4, 0.6]} />
                    <meshStandardMaterial color="#8a6a45" flatShading />
                </mesh>
            ))}
            {/* Trinnene, med navnet til høyre */}
            {TRINN.map((navn, k) => (
                <group key={k} position={[0, trinnY(k), trinnZ(k)]}>
                    <mesh>
                        <boxGeometry args={[BREDDE, 0.4, 2.2]} />
                        <meshStandardMaterial color={trinnFarge(k)} flatShading roughness={0.85} />
                    </mesh>
                    <Html position={[BREDDE / 2 + 1.1, 0.2, 0]} zIndexRange={[5, 0]}>
                        <div
                            className={`-translate-y-1/2 w-[11rem] md:w-[15rem] px-2.5 py-1 rounded-xl text-sm md:text-lg font-bold leading-tight transition-colors duration-500 ${
                                aktivt === k
                                    ? 'bg-amber-400 text-slate-900 shadow-lg'
                                    : 'bg-white/85 text-slate-600'
                            }`}
                        >
                            {navn}
                        </div>
                    </Html>
                </group>
            ))}
            {visEnder && (
                <Html
                    position={[-BREDDE / 2 - 1.2, trinnY(0) + 0.3, trinnZ(0)]}
                    zIndexRange={[5, 0]}
                >
                    <div className="-translate-x-full -translate-y-1/2 text-right text-lg md:text-2xl font-display font-black text-amber-700 uppercase leading-none whitespace-nowrap">
                        Gjort
                        <br />
                        for deg
                    </div>
                </Html>
            )}
            {visEnder && (
                <Html
                    position={[-BREDDE / 2 - 1.2, trinnY(4) + 0.3, trinnZ(4)]}
                    zIndexRange={[5, 0]}
                >
                    <div className="-translate-x-full -translate-y-1/2 text-right text-lg md:text-2xl font-display font-black text-slate-700 uppercase leading-none whitespace-nowrap">
                        Gjort
                        <br />
                        av deg
                    </div>
                </Html>
            )}
            {TRADISJONER.map((t, nr) => (
                <Brikke key={t.id} t={t} nr={nr} synlig={plassert.includes(t.id)} fokus={fokus} />
            ))}
            {SKYGGER.map((s) => (
                <Pil key={s.id} {...s} synlig={Boolean(fokus.skygger)} />
            ))}
            <Lysstrale synlig={fokus.ende === 'topp' || fokus.tradisjon === 'kristendom'} />
            <Klatrer synlig={fokus.ende === 'bunn'} />
        </>
    );
}

export function FrelseStigen({ beat, playing, props }: VisualProps<Props>) {
    const liste = props.fokus ?? [];
    const fokus: Fokus = liste[Math.min(beat, liste.length - 1)] ?? {};
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tr = fokus.tradisjon ? TRADISJONER.find((x) => x.id === fokus.tradisjon) : undefined;
    const aktivtTrinn = tr
        ? tr.trinn
        : fokus.ende === 'topp'
          ? 0
          : fokus.ende === 'bunn'
            ? 4
            : null;

    return (
        <div className="absolute inset-0">
            <Canvas dpr={dpr} camera={{ fov: 42, near: 0.5, far: 200, position: [2.5, 7.5, 24] }}>
                <Scene fokus={fokus} beat={beat} playing={playing} aktivt={aktivtTrinn} />
            </Canvas>

            <AnimatePresence mode="wait">
                {fokus.tekst && (
                    <motion.div
                        key={`${beat}-${fokus.tekst}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className={`absolute ${beat === 0 ? 'top-[12%]' : 'top-[4%]'} left-[3%] max-w-[60%] px-5 py-2.5 rounded-2xl bg-white/95 shadow-xl`}
                        style={tr ? { borderLeft: `10px solid ${tr.farge}` } : undefined}
                    >
                        <div className="text-xl md:text-3xl font-display font-black text-slate-900 leading-tight">
                            {fokus.tekst}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
