import { useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Hybelen til Jonas i 3D: seng, skrivebord, kjøleskap, vindu og en bunke sedler på pulten.
 * Fire moduser:
 * - rik: første uka. Sedlene (10 000 kr) ligger på pulten. Pizza, genser og spillkontroll
 *   dukker opp, og bunken krymper.
 * - tjuende: den 20. Bank-appen viser 340 kr, ti dager igjen, kjøleskapet er nesten tomt.
 * - buffer: knust mobil, sykkel som må repareres, en gave. Så en krukke med buffer.
 * - valg: pizza med venner er fortsatt lov. Budsjettet viser hva valget koster.
 * Bunken er et bilde, ikke en telling: hvor mye hver ting kostet, står ikke i artikkelen.
 */

type Modus = 'rik' | 'tjuende' | 'buffer' | 'valg';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const OVERSKRIFT: Record<Modus, string[]> = {
    rik: ['Jonas, 17 år, på hybel', '10 000 kroner i måneden', 'Første uka: pizza', 'Genser og spill'],
    tjuende: ['Den 20. i måneden', 'Ti dager igjen', 'Kjøleskapet er nesten tomt', 'Ingen plan'],
    buffer: ['Det uventede', 'Mobil, sykkel, gave', 'Noe kommer til å skje', 'Buffer', 'Buffer: 600 kroner'],
    valg: ['Et budsjett handler om å velge', 'Pizza med vennene', 'Hva koster pizzaen senere?', 'Ingen budsjetter er like'],
};

/** Hvor mange sedler som ligger på pulten (bilde, ikke beløp). */
function sedler(modus: Modus, beat: number) {
    if (modus === 'rik') return beat === 0 ? 0 : beat === 1 ? 12 : beat === 2 ? 8 : 4;
    if (modus === 'tjuende') return 1;
    if (modus === 'buffer') return 0;
    return 6;
}

// ---------- Kamera ----------

function kameraFor(modus: Modus, beat: number, t: number) {
    const sakte = Math.min(t, 12);
    if (modus === 'rik') {
        switch (beat) {
            case 0:
                return { pos: v(7 - sakte * 0.12, 5.2, 8.5), se: v(-0.5, 1, -1.5) };
            case 1:
                return { pos: v(-0.6, 2.9, 0.6), se: v(-2.6, 1.0, -3) };
            case 2:
                return { pos: v(-1.0, 3.0, 0.3), se: v(-2.1, 1.0, -3.2) };
            default:
                return { pos: v(5.4, 3.6, 3.6), se: v(0.6, 0.8, -2.4) };
        }
    }
    if (modus === 'tjuende') {
        switch (beat) {
            case 0:
                return { pos: v(-0.4, 2.9, 0.8), se: v(-2.6, 1.0, -3) };
            case 1:
                return { pos: v(6, 4.6, 7), se: v(-0.8, 1, -1.5) };
            case 2:
                return { pos: v(0.4, 2.2, 2.4), se: v(-3.9, 1.1, -0.6) };
            default:
                return { pos: v(7.5 + sakte * 0.1, 6, 9.5 + sakte * 0.1), se: v(-0.5, 0.8, -1.5) };
        }
    }
    if (modus === 'buffer') {
        switch (beat) {
            case 0:
                return { pos: v(7, 5, 8), se: v(-0.5, 1, -1.5) };
            case 1:
                return { pos: v(2.6, 3.4, 4.4), se: v(-0.6, 0.8, -2.6) };
            case 2:
                return { pos: v(6.5, 5.2, 7.5), se: v(-0.4, 1, -1.8) };
            default:
                return { pos: v(-0.3, 2.6, 0.9), se: v(-2.2, 1.1, -3) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(7, 5, 8), se: v(-0.5, 1, -1.5) };
        case 1:
        case 2:
            return { pos: v(2.8, 3.4, 4.4), se: v(-1, 1, -1.8) };
        default:
            return { pos: v(7.5, 5.6, 9), se: v(-0.5, 1, -1.5) };
    }
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mal = kameraFor(modus, beat, beatTid.current);
        const k = forste.current || !playing ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        se.current.lerp(mal.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

// ---------- Ting som dukker opp ----------

/** En gruppe som vokser fram når `vis` blir sann, og krymper bort ellers. */
function Dukk({
    vis,
    playing,
    children,
    position,
}: {
    vis: boolean;
    playing: boolean;
    children: ReactNode;
    position?: [number, number, number];
}) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const mal = vis ? 1 : 0.001;
        const k = playing ? 1 - Math.exp(-6 * Math.min(rawDt, 0.05)) : 1;
        const s = THREE.MathUtils.lerp(g.scale.x, mal, k);
        g.scale.setScalar(s);
        g.visible = s > 0.01;
    });
    return (
        <group ref={ref} position={position} scale={0.001}>
            {children}
        </group>
    );
}

function Boks({
    pos,
    str,
    farge,
    emissive,
}: {
    pos: [number, number, number];
    str: [number, number, number];
    farge: string;
    emissive?: string;
}) {
    return (
        <mesh position={pos}>
            <boxGeometry args={str} />
            <meshStandardMaterial color={farge} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 0.6 : 0} flatShading />
        </mesh>
    );
}

// ---------- Rommet ----------

function Rommet() {
    return (
        <group>
            {/* Gulv og vegger */}
            <Boks pos={[0, -0.05, -0.5]} str={[10, 0.1, 8]} farge="#d6b88a" />
            <Boks pos={[0, 1.6, -4.5]} str={[10, 3.3, 0.1]} farge="#e9e4f5" />
            <Boks pos={[-5, 1.6, -0.5]} str={[0.1, 3.3, 8]} farge="#f1eadc" />
            {/* Vindu */}
            <Boks pos={[0.6, 2.1, -4.43]} str={[1.8, 1.1, 0.04]} farge="#bfdbfe" emissive="#93c5fd" />
            <Boks pos={[0.6, 2.1, -4.4]} str={[0.08, 1.1, 0.05]} farge="#ffffff" />
            {/* Teppe */}
            <mesh position={[0.6, 0.01, -0.8]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.6, 32]} />
                <meshStandardMaterial color="#fca5a5" />
            </mesh>
            {/* Skrivebord */}
            <Boks pos={[-2.5, 1.0, -3.6]} str={[2.6, 0.1, 1.2]} farge="#a16207" />
            <Boks pos={[-3.7, 0.5, -3.6]} str={[0.1, 1.0, 1.1]} farge="#854d0e" />
            <Boks pos={[-1.3, 0.5, -3.6]} str={[0.1, 1.0, 1.1]} farge="#854d0e" />
            {/* Stol */}
            <Boks pos={[-2.5, 0.55, -2.5]} str={[0.7, 0.08, 0.7]} farge="#334155" />
            <Boks pos={[-2.5, 0.95, -2.18]} str={[0.7, 0.8, 0.08]} farge="#334155" />
            <Boks pos={[-2.5, 0.27, -2.5]} str={[0.08, 0.55, 0.08]} farge="#1e293b" />
            {/* Seng */}
            <Boks pos={[3.2, 0.25, -2.6]} str={[2.0, 0.5, 3.6]} farge="#78350f" />
            <Boks pos={[3.2, 0.55, -2.6]} str={[1.9, 0.18, 3.5]} farge="#f8fafc" />
            <Boks pos={[3.2, 0.68, -1.6]} str={[1.92, 0.1, 1.6]} farge="#60a5fa" />
            <Boks pos={[3.2, 0.72, -4.0]} str={[1.2, 0.18, 0.5]} farge="#ffffff" />
            {/* Kjøleskapet (døra er egen) */}
            <Boks pos={[-4.6, 1.0, -0.5]} str={[0.7, 2.0, 0.9]} farge="#e2e8f0" />
            <Boks pos={[-4.24, 1.0, -0.5]} str={[0.02, 1.84, 0.8]} farge="#f1f5f9" emissive="#e0f2fe" />
            <Boks pos={[-4.11, 1.0, -0.93]} str={[0.26, 2.0, 0.04]} farge="#e2e8f0" />
            <Boks pos={[-4.11, 1.0, -0.07]} str={[0.26, 2.0, 0.04]} farge="#e2e8f0" />
            <Boks pos={[-4.11, 1.98, -0.5]} str={[0.26, 0.04, 0.9]} farge="#e2e8f0" />
            <Boks pos={[-4.11, 0.02, -0.5]} str={[0.26, 0.04, 0.9]} farge="#e2e8f0" />
            <Boks pos={[-4.11, 0.6, -0.5]} str={[0.24, 0.03, 0.82]} farge="#bae6fd" />
            <Boks pos={[-4.11, 1.2, -0.5]} str={[0.24, 0.03, 0.82]} farge="#bae6fd" />
        </group>
    );
}

function KjoleskapDor({ apen, playing }: { apen: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        if (!ref.current) return;
        const k = playing ? 1 - Math.exp(-3 * Math.min(rawDt, 0.05)) : 1;
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, apen ? 1.9 : 0, k);
    });
    return (
        <group ref={ref} position={[-3.95, 0, -0.95]}>
            <mesh position={[0, 1.0, 0.45]}>
                <boxGeometry args={[0.08, 1.95, 0.9]} />
                <meshStandardMaterial color="#f8fafc" flatShading />
            </mesh>
            <mesh position={[0.07, 1.3, 0.82]}>
                <boxGeometry args={[0.05, 0.5, 0.05]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>
        </group>
    );
}

function Person({ pos, farge, har }: { pos: [number, number, number]; farge: string; har: string }) {
    return (
        <group position={pos}>
            <mesh position={[0, 0.85, 0]}>
                <capsuleGeometry args={[0.28, 0.8, 4, 12]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 1.72, 0]}>
                <sphereGeometry args={[0.24, 16, 12]} />
                <meshStandardMaterial color="#f5cba7" flatShading />
            </mesh>
            <mesh position={[0, 1.9, -0.03]}>
                <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={har} flatShading />
            </mesh>
        </group>
    );
}

/** En seddel på pulten. */
function Seddel({ i }: { i: number }) {
    return (
        <mesh position={[0, i * 0.035, 0]} rotation={[0, (i % 3) * 0.12 - 0.1, 0]}>
            <boxGeometry args={[0.7, 0.03, 0.36]} />
            <meshStandardMaterial color={i % 2 ? '#86efac' : '#4ade80'} flatShading />
        </mesh>
    );
}

function Pizzaeske() {
    return (
        <group>
            <Boks pos={[0, 0.05, 0]} str={[0.8, 0.1, 0.8]} farge="#f5f5f4" />
            <Boks pos={[0, 0.105, 0]} str={[0.5, 0.01, 0.5]} farge="#dc2626" />
        </group>
    );
}

function Sykkel() {
    return (
        <group>
            {[-0.65, 0.65].map((x) => (
                <mesh key={x} position={[x, 0.45, 0]}>
                    <torusGeometry args={[0.42, 0.05, 8, 24]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            ))}
            <Boks pos={[0, 0.75, 0]} str={[1.3, 0.07, 0.07]} farge="#dc2626" />
            <Boks pos={[0.1, 0.55, 0]} str={[0.07, 0.6, 0.07]} farge="#dc2626" />
            <Boks pos={[0.1, 0.9, 0]} str={[0.4, 0.06, 0.12]} farge="#1e293b" />
            <Boks pos={[0.62, 1.0, 0]} str={[0.06, 0.06, 0.6]} farge="#1e293b" />
        </group>
    );
}

function Krukke({ fyll, playing }: { fyll: number; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        if (!ref.current) return;
        const k = playing ? 1 - Math.exp(-2.5 * Math.min(rawDt, 0.05)) : 1;
        const s = THREE.MathUtils.lerp(ref.current.scale.y, Math.max(fyll, 0.001), k);
        ref.current.scale.y = s;
        ref.current.position.y = 0.04 + (0.6 * s) / 2;
    });
    return (
        <group>
            <mesh ref={ref} position={[0, 0.05, 0]} scale={[1, 0.001, 1]}>
                <cylinderGeometry args={[0.23, 0.23, 0.6, 20]} />
                <meshStandardMaterial color="#22c55e" flatShading />
            </mesh>
            <mesh position={[0, 0.33, 0]}>
                <cylinderGeometry args={[0.27, 0.27, 0.66, 20, 1, true]} />
                <meshStandardMaterial color="#bae6fd" transparent opacity={0.35} side={THREE.DoubleSide} />
            </mesh>
            <Boks pos={[0, 0.7, 0]} str={[0.4, 0.08, 0.4]} farge="#0891b2" />
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const antall = sedler(modus, beat);
    const pizza = (modus === 'rik' && beat >= 2) || (modus === 'valg' && beat >= 1);
    const genser = modus === 'rik' && beat >= 3;
    const knust = modus === 'buffer' && beat >= 1;
    const krukke = modus === 'buffer' && beat >= 3;
    const venner = modus === 'valg' && beat >= 1 && beat <= 2;
    const apen = modus === 'tjuende' && beat >= 2;
    return (
        <>
            <color attach="background" args={['#e0e7ff']} />
            <fog attach="fog" args={['#e0e7ff', 18, 34]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#ffffff', '#c7a17a', 0.6]} />
            <directionalLight position={[4, 8, 6]} intensity={1.3} />
            <pointLight position={[-2.5, 2.6, -2.5]} intensity={6} distance={6} color="#fde68a" />

            <Rommet />
            <KjoleskapDor apen={apen} playing={playing} />
            {/* Det eneste som er igjen i kjøleskapet */}
            <Boks pos={[-4.12, 0.7, -0.35]} str={[0.15, 0.16, 0.15]} farge="#fbbf24" />

            <Person pos={[0.6, 0, -0.6]} farge="#2563eb" har="#3f2a1d" />
            <Dukk vis={venner} playing={playing}>
                <Person pos={[1.7, 0, -0.9]} farge="#16a34a" har="#111827" />
                <Person pos={[-0.4, 0, -1.2]} farge="#db2777" har="#a16207" />
            </Dukk>

            {/* Sedlene på pulten */}
            <group position={[-3.1, 1.07, -3.6]}>
                {Array.from({ length: 12 }, (_, i) => (
                    <Dukk key={i} vis={i < antall} playing={playing}>
                        <Seddel i={i} />
                    </Dukk>
                ))}
            </group>

            <Dukk vis={pizza} playing={playing} position={modus === 'valg' ? [0.6, 0.02, 0.4] : [-2.0, 1.06, -3.5]}>
                <Pizzaeske />
            </Dukk>
            <Dukk vis={genser} playing={playing} position={[3.0, 0.75, -2.4]}>
                <Boks pos={[0, 0.06, 0]} str={[0.9, 0.14, 0.7]} farge="#9333ea" />
                <Boks pos={[0.9, 0.04, 0.5]} str={[0.45, 0.1, 0.25]} farge="#111827" />
            </Dukk>

            {/* Mobilen på pulten */}
            <group position={[-1.6, 1.07, -3.3]}>
                <Boks pos={[0, 0.02, 0]} str={[0.22, 0.03, 0.42]} farge="#0f172a" />
                <Dukk vis={knust} playing={playing}>
                    <Boks pos={[0, 0.04, 0]} str={[0.26, 0.012, 0.03]} farge="#f8fafc" />
                    <mesh position={[0, 0.04, 0]} rotation={[0, 0.7, 0]}>
                        <boxGeometry args={[0.3, 0.012, 0.025]} />
                        <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                </Dukk>
            </group>
            <Dukk vis={knust} playing={playing} position={[0.4, 0, -4.0]}>
                <Sykkel />
            </Dukk>
            <Dukk vis={knust} playing={playing} position={[1.6, 0, 0.5]}>
                <Boks pos={[0, 0.3, 0]} str={[0.6, 0.6, 0.6]} farge="#f43f5e" />
                <Boks pos={[0, 0.3, 0]} str={[0.62, 0.62, 0.12]} farge="#fde047" />
                <Boks pos={[0, 0.3, 0]} str={[0.12, 0.62, 0.62]} farge="#fde047" />
            </Dukk>
            <Dukk vis={krukke} playing={playing} position={[-2.4, 1.05, -3.6]}>
                <Krukke fyll={modus === 'buffer' && beat >= 4 ? 0.85 : 0} playing={playing} />
            </Dukk>

            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

// ---------- DOM over lerretet ----------

function Kort({ children, bredde = 300 }: { children: ReactNode; bredde?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl bg-white/95 shadow-xl p-4 text-slate-900"
            style={{ width: bredde }}
        >
            {children}
        </motion.div>
    );
}

function BankApp({ belop, tone, under }: { belop: string; tone: string; under: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] bg-slate-900 p-3 shadow-2xl"
            style={{ width: 220, height: 380 }}
        >
            <div className="h-full rounded-[1.5rem] bg-white flex flex-col items-center pt-8 px-3">
                <div className="text-lg font-bold text-slate-500">Brukskonto</div>
                <div className="mt-6 text-4xl font-black tabular-nums" style={{ color: tone }}>
                    {belop}
                </div>
                <div className="mt-6 text-xl font-bold text-slate-600 text-center">{under}</div>
            </div>
        </motion.div>
    );
}

function Overlegg({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'rik' && beat === 1) {
        return <BankApp belop="10 000 kr" tone="#0d9488" under="fra foreldrene og deltidsjobben" />;
    }
    if (modus === 'tjuende' && beat === 0) {
        return <BankApp belop="340 kr" tone="#dc2626" under="den 20. i måneden" />;
    }
    if (modus === 'tjuende' && beat === 1) {
        return (
            <Kort bredde={330}>
                <div className="text-2xl font-black mb-1">Husleia: betalt</div>
                <div className="text-xl font-bold text-slate-600 mb-3">Ti dager til det kommer penger</div>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    {Array.from({ length: 10 }, (_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.12 }}
                            className="rounded-lg bg-red-100 border-2 border-red-400"
                            style={{ height: 44 }}
                        />
                    ))}
                </div>
            </Kort>
        );
    }
    if (modus === 'tjuende' && beat === 3) {
        return (
            <Kort>
                <div className="text-2xl font-black">Ikke ulovlig.</div>
                <div className="text-2xl font-black">Ikke dumt.</div>
                <div className="text-2xl font-black text-red-600 mt-2">Bare ingen plan.</div>
            </Kort>
        );
    }
    if (modus === 'buffer' && beat === 1) {
        return (
            <Kort bredde={320}>
                <div className="text-2xl font-black text-red-600">Knust mobilskjerm</div>
                <div className="text-2xl font-black mt-1">Sykkel til reparasjon</div>
                <div className="text-2xl font-black mt-1">Gave til en venn</div>
            </Kort>
        );
    }
    if (modus === 'buffer' && beat === 2) {
        return (
            <Kort>
                <div className="text-2xl font-black">Du vet ikke hva.</div>
                <div className="text-2xl font-black text-cyan-700 mt-2">Men du vet at noe kommer.</div>
            </Kort>
        );
    }
    if (modus === 'buffer' && beat >= 3) {
        return (
            <Kort bredde={330}>
                <div className="text-2xl font-black text-cyan-700">Buffer</div>
                <div className="text-xl font-bold text-slate-600">penger satt av til uventede utgifter</div>
                {beat >= 4 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                        <div className="text-xl font-bold text-slate-700">På lønningsdagen: egen konto</div>
                        <div className="text-4xl font-black text-teal-600">600 kr</div>
                        <div className="text-xl font-bold text-slate-700 mt-1">Der når mobilen knuser</div>
                    </motion.div>
                )}
            </Kort>
        );
    }
    if (modus === 'valg' && beat === 2) {
        return (
            <Kort bredde={340}>
                <div className="text-2xl font-black">Pizza nå</div>
                <div className="text-3xl font-black text-slate-400 my-1">=</div>
                <div className="text-2xl font-black text-red-600">mindre til noe annet senere i måneden</div>
                <div className="text-xl font-bold text-teal-700 mt-3">Er det verdt det? Du bestemmer.</div>
            </Kort>
        );
    }
    if (modus === 'valg' && beat === 3) {
        return (
            <div className="flex flex-col gap-3">
                <Kort bredde={330}>
                    <div className="text-xl font-bold text-slate-500">Én person</div>
                    <div className="text-2xl font-black">Mye på klær</div>
                </Kort>
                <Kort bredde={330}>
                    <div className="text-xl font-bold text-slate-500">En annen</div>
                    <div className="text-2xl font-black">Sparer til en reise, lager matpakke</div>
                </Kort>
            </div>
        );
    }
    return null;
}

export function BudsjettHybel({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'rik';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [7, 5, 8] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 flex justify-center pointer-events-none" style={{ top: '5%' }}>
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
            <div className="absolute pointer-events-none" style={{ right: '4%', top: '18%' }}>
                <AnimatePresence mode="wait">
                    <motion.div key={`${modus}-${beat}`} exit={{ opacity: 0 }}>
                        <Overlegg modus={modus} beat={beat} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
