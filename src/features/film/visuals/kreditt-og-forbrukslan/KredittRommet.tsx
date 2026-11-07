import { useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Rommet til Emil i 3D: skrivebord, gaming-PC, skjerm, seng og et kredittkort.
 * Fire moduser:
 * - kjop: Emil, 19 år. PC-en til 15 000 kr, 2000 kr på kontoen, kortet med plass til
 *   20 000 kr. Ett trykk, og PC-en står på pulten.
 * - toaar: to år senere. Mynter går fra Emil til kortselskapet hver måned, og gjelden
 *   krymper nesten ikke.
 * - gammel: PC-en blir grå og gammel, en ny står i eske. Lånet går lenger enn PC-en varer.
 * - spare: sparebøsse, en billigere PC, eller kortet betalt før fristen.
 * Myntene er et bilde, ikke en telling: hvor mye Emil betaler i måneden, står ikke i artikkelen.
 */

type Modus = 'kjop' | 'toaar' | 'gammel' | 'spare';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const OVERSKRIFT: Record<Modus, string[]> = {
    kjop: ['Emil, 19 år', 'Drømme-PC-en', 'Kontoen', 'Kredittkortet', 'Ett trykk'],
    toaar: ['To år senere', 'Fortsatt ikke betalt', 'Hver måned', 'Gjelden krymper nesten ikke'],
    gammel: ['PC-en blir gammel', 'Lånet kan vare lenger enn PC-en', 'Regelen'],
    spare: ['Hva kunne Emil gjort?', 'Spare først', 'En billigere PC', 'Betale hele fakturaen'],
};

// ---------- Kamera ----------

function kameraFor(modus: Modus, beat: number, t: number) {
    const sakte = Math.min(t, 12);
    const oversikt = { pos: v(6.5 - sakte * 0.08, 4.6, 7.5), se: v(-0.8, 1.0, -2) };
    const pult = { pos: v(1.2, 2.8, 0.4), se: v(-1.8, 1.3, -3.4) };
    if (modus === 'kjop') {
        if (beat === 0) return oversikt;
        if (beat === 1 || beat === 4) return pult;
        if (beat === 2) return { pos: v(2.2, 3.0, 2.8), se: v(-0.6, 1.0, -1.6) };
        return { pos: v(1.2, 2.2, 1.6), se: v(-0.4, 1.4, -1.2) };
    }
    if (modus === 'toaar') {
        if (beat === 0) return oversikt;
        if (beat === 1) return pult;
        return { pos: v(6.2, 4.2, 6.4), se: v(0.4, 1.4, -2) };
    }
    if (modus === 'gammel') {
        if (beat === 0) return pult;
        return { pos: v(5.8, 4.0, 6.8 + sakte * 0.06), se: v(-0.8, 1.0, -2.2) };
    }
    if (beat === 0) return oversikt;
    return pult;
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

// ---------- Byggeklosser ----------

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
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const mal = vis ? 1 : 0.001;
        const k = forste.current || !playing ? 1 : 1 - Math.exp(-6 * Math.min(rawDt, 0.05));
        forste.current = false;
        const s = THREE.MathUtils.lerp(g.scale.x, mal, k);
        g.scale.setScalar(s);
        g.visible = s > 0.01;
    });
    return (
        <group ref={ref} position={position} scale={vis ? 1 : 0.001}>
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
            <meshStandardMaterial
                color={farge}
                emissive={emissive ?? '#000000'}
                emissiveIntensity={emissive ? 0.7 : 0}
                flatShading
            />
        </mesh>
    );
}

function Rommet() {
    return (
        <group>
            <Boks pos={[0, -0.05, -0.5]} str={[11, 0.1, 9]} farge="#cbb08a" />
            <Boks pos={[0, 1.7, -4.5]} str={[11, 3.5, 0.1]} farge="#dbeafe" />
            <Boks pos={[-5.5, 1.7, -0.5]} str={[0.1, 3.5, 9]} farge="#e0e7ff" />
            {/* Plakat og vindu */}
            <Boks
                pos={[1.4, 2.3, -4.43]}
                str={[1.9, 1.1, 0.04]}
                farge="#bfdbfe"
                emissive="#93c5fd"
            />
            <Boks pos={[1.4, 2.3, -4.4]} str={[0.08, 1.1, 0.05]} farge="#ffffff" />
            <Boks pos={[-4.2, 2.4, -4.43]} str={[0.9, 1.2, 0.03]} farge="#7c3aed" />
            {/* Skrivebord */}
            <Boks pos={[-2.3, 1.0, -3.6]} str={[3.2, 0.1, 1.3]} farge="#334155" />
            <Boks pos={[-3.8, 0.5, -3.6]} str={[0.1, 1.0, 1.2]} farge="#1e293b" />
            <Boks pos={[-0.8, 0.5, -3.6]} str={[0.1, 1.0, 1.2]} farge="#1e293b" />
            {/* Skjerm og tastatur */}
            <Boks pos={[-2.4, 1.65, -3.95]} str={[1.5, 0.85, 0.06]} farge="#0f172a" />
            <Boks pos={[-2.4, 1.2, -3.95]} str={[0.1, 0.3, 0.1]} farge="#0f172a" />
            <Boks pos={[-2.4, 1.07, -3.3]} str={[1.0, 0.04, 0.32]} farge="#1f2937" />
            {/* Seng */}
            <Boks pos={[3.4, 0.25, -2.4]} str={[2.0, 0.5, 3.8]} farge="#1e3a8a" />
            <Boks pos={[3.4, 0.56, -2.4]} str={[1.9, 0.16, 3.7]} farge="#f8fafc" />
            <Boks pos={[3.4, 0.68, -1.4]} str={[1.92, 0.1, 1.8]} farge="#16a34a" />
            {/* Stol */}
            <Boks pos={[-2.3, 0.55, -2.4]} str={[0.75, 0.1, 0.75]} farge="#dc2626" />
            <Boks pos={[-2.3, 1.05, -2.05]} str={[0.75, 1.0, 0.1]} farge="#dc2626" />
            <Boks pos={[-2.3, 0.27, -2.4]} str={[0.1, 0.55, 0.1]} farge="#111827" />
        </group>
    );
}

/** PC-tårnet. Fargen glir mot grått og lyset slukker når den blir gammel. */
function PcTarn({
    gammel,
    playing,
    liten,
}: {
    gammel: boolean;
    playing: boolean;
    liten?: boolean;
}) {
    const kasse = useRef<THREE.MeshStandardMaterial>(null);
    const lys = useRef<THREE.MeshStandardMaterial>(null);
    const ny = useMemo(() => new THREE.Color('#111827'), []);
    const gml = useMemo(() => new THREE.Color('#9ca3af'), []);
    const forste = useRef(true);
    useFrame((state, rawDt) => {
        const k = forste.current || !playing ? 1 : 1 - Math.exp(-1.5 * Math.min(rawDt, 0.05));
        forste.current = false;
        if (kasse.current) kasse.current.color.lerp(gammel ? gml : ny, k);
        if (lys.current) {
            const mal = gammel ? 0 : 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
            lys.current.emissiveIntensity = THREE.MathUtils.lerp(
                lys.current.emissiveIntensity,
                mal,
                k
            );
        }
    });
    const s = liten ? 0.7 : 1;
    return (
        <group scale={s}>
            <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[0.5, 1.1, 1.0]} />
                <meshStandardMaterial ref={kasse} color="#111827" flatShading />
            </mesh>
            <mesh position={[0.26, 0.55, 0]}>
                <boxGeometry args={[0.02, 0.9, 0.06]} />
                <meshStandardMaterial
                    ref={lys}
                    color="#22d3ee"
                    emissive="#22d3ee"
                    emissiveIntensity={1.2}
                />
            </mesh>
            <mesh position={[0.26, 0.85, 0.3]}>
                <boxGeometry args={[0.02, 0.08, 0.3]} />
                <meshStandardMaterial
                    color="#a855f7"
                    emissive="#a855f7"
                    emissiveIntensity={gammel ? 0 : 1}
                />
            </mesh>
        </group>
    );
}

function Person({ pos, farge }: { pos: [number, number, number]; farge: string }) {
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
                <meshStandardMaterial color="#422006" flatShading />
            </mesh>
        </group>
    );
}

/** Kredittkortet. Svever i luften, og «trykker» mot terminalen på beaten med kjøpet. */
function Kortet({ trykk, playing }: { trykk: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const t = useRef(0);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        t.current += dt;
        const k = playing ? 1 - Math.exp(-3 * dt) : 1;
        const malY = trykk ? 1.25 : 1.9 + Math.sin(t.current * 1.5) * 0.06;
        g.position.y = THREE.MathUtils.lerp(g.position.y, malY, k);
        g.rotation.y = THREE.MathUtils.lerp(
            g.rotation.y,
            trykk ? 0 : 0.5 + Math.sin(t.current) * 0.15,
            k
        );
        g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, trykk ? -Math.PI / 2 : -0.2, k);
    });
    return (
        <group ref={ref} position={[-0.6, trykk ? 1.25 : 1.9, -1.4]}>
            <mesh>
                <boxGeometry args={[0.86, 0.54, 0.03]} />
                <meshStandardMaterial color="#1d4ed8" flatShading />
            </mesh>
            <mesh position={[-0.22, 0.08, 0.02]}>
                <boxGeometry args={[0.16, 0.12, 0.01]} />
                <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0.05, -0.15, 0.02]}>
                <boxGeometry args={[0.6, 0.05, 0.01]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
        </group>
    );
}

/** Mynter som går i en sløyfe fra pulten ut av rommet til kortselskapet. */
function Mynter({ vis, playing }: { vis: boolean; playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const t = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        t.current += dt;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const f = (t.current * 0.35 + i / 6) % 1;
            // Fra pulten (-1.2, 1.2, -3.2) til døra i høyre vegg (4.5, 1.8, 1.5)
            m.position.set(
                THREE.MathUtils.lerp(-1.2, 4.6, f),
                1.2 + Math.sin(f * Math.PI) * 1.4,
                THREE.MathUtils.lerp(-3.2, 1.5, f)
            );
            m.rotation.y = t.current * 3 + i;
            m.visible = vis;
        });
    });
    return (
        <group>
            {Array.from({ length: 6 }, (_, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                    rotation={[Math.PI / 2, 0, 0]}
                    visible={false}
                >
                    <cylinderGeometry args={[0.16, 0.16, 0.05, 20]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#ca8a04"
                        emissiveIntensity={0.5}
                        flatShading
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Sparebøssa fylles med mynter. */
function Sparebosse({ fylt }: { fylt: boolean }) {
    return (
        <group>
            <mesh position={[0, 0.25, 0]} scale={[1.2, 1, 1]}>
                <sphereGeometry args={[0.25, 16, 12]} />
                <meshStandardMaterial color="#f472b6" flatShading />
            </mesh>
            <mesh position={[0.3, 0.27, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.06, 12]} />
                <meshStandardMaterial color="#ec4899" />
            </mesh>
            {fylt &&
                [0, 1, 2].map((i) => (
                    <mesh key={i} position={[0, 0.58 + i * 0.06, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
                        <meshStandardMaterial
                            color="#facc15"
                            emissive="#ca8a04"
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                ))}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const pcPaPult =
        (modus === 'kjop' && beat >= 4) ||
        modus === 'toaar' ||
        modus === 'gammel' ||
        (modus === 'spare' && beat !== 2);
    const spokelsesPc = modus === 'kjop' && beat >= 1 && beat <= 3;
    const kort = (modus === 'kjop' && beat >= 3) || (modus === 'spare' && beat === 3);
    const trykk = (modus === 'kjop' && beat >= 4) || modus === 'spare';
    const gammel = modus === 'gammel';
    const nyEske = modus === 'gammel' && beat >= 1;
    const mynter = modus === 'toaar' && beat >= 2;
    const bosse = modus === 'spare' && beat >= 1 && beat <= 2;
    const liten = modus === 'spare' && beat === 2;
    return (
        <>
            <color attach="background" args={['#e0e7ff']} />
            <fog attach="fog" args={['#e0e7ff', 18, 34]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#ffffff', '#c7a17a', 0.6]} />
            <directionalLight position={[4, 8, 6]} intensity={1.3} />
            <pointLight position={[-2.3, 2.6, -2.6]} intensity={5} distance={6} color="#a5b4fc" />

            <Rommet />
            <Person pos={[-0.6, 0, -1.0]} farge="#0891b2" />

            {/* PC-en på pulten */}
            <Dukk vis={pcPaPult} playing={playing} position={[-1.2, 1.05, -3.5]}>
                <PcTarn gammel={gammel} playing={playing} />
            </Dukk>
            {/* PC-en Emil drømmer om: gjennomsiktig, med prislapp i DOM */}
            <Dukk vis={spokelsesPc} playing={playing} position={[-1.2, 1.05, -3.5]}>
                <mesh position={[0, 0.55, 0]}>
                    <boxGeometry args={[0.5, 1.1, 1.0]} />
                    <meshStandardMaterial color="#67e8f9" transparent opacity={0.35} />
                </mesh>
            </Dukk>
            {/* Den billigere PC-en */}
            <Dukk vis={liten} playing={playing} position={[-1.2, 1.05, -3.5]}>
                <PcTarn gammel={false} playing={playing} liten />
            </Dukk>
            {/* Den nye PC-en i eske på gulvet */}
            <Dukk vis={nyEske} playing={playing} position={[1.4, 0, -2.6]}>
                <Boks pos={[0, 0.5, 0]} str={[1.0, 1.0, 1.1]} farge="#d6a76c" />
                <Boks pos={[0, 1.005, 0]} str={[1.02, 0.02, 0.2]} farge="#b45309" />
                <Boks
                    pos={[0.51, 0.55, 0]}
                    str={[0.02, 0.4, 0.6]}
                    farge="#22d3ee"
                    emissive="#22d3ee"
                />
            </Dukk>
            <Dukk vis={bosse} playing={playing} position={[-0.4, 1.05, -3.4]}>
                <Sparebosse fylt={modus === 'spare' && beat >= 1} />
            </Dukk>
            <Dukk vis={kort} playing={playing}>
                <Kortet trykk={trykk} playing={playing} />
            </Dukk>
            {/* Betalingsterminalen */}
            <Dukk
                vis={modus === 'kjop' && beat >= 3}
                playing={playing}
                position={[-0.6, 1.0, -1.4]}
            >
                <Boks pos={[0, 0.1, 0]} str={[0.4, 0.2, 0.6]} farge="#0f172a" />
                <Boks
                    pos={[0, 0.21, -0.1]}
                    str={[0.3, 0.02, 0.25]}
                    farge="#22c55e"
                    emissive="#22c55e"
                />
            </Dukk>
            {/* Pidestall for terminalen */}
            <Dukk vis={modus === 'kjop' && beat >= 3} playing={playing} position={[-0.6, 0, -1.4]}>
                <Boks pos={[0, 0.5, 0]} str={[0.12, 1.0, 0.12]} farge="#64748b" />
            </Dukk>
            <Mynter vis={mynter} playing={playing} />

            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

// ---------- DOM over lerretet ----------

function Kort({ children, bredde = 320 }: { children: ReactNode; bredde?: number }) {
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

function Gjeldsstolpe({ krympet }: { krympet: boolean }) {
    return (
        <Kort bredde={340}>
            <div className="text-2xl font-black mb-2">Gjelden til kortselskapet</div>
            <div className="rounded-lg bg-slate-200 overflow-hidden" style={{ height: 40 }}>
                <motion.div
                    className="h-full bg-red-500"
                    initial={{ width: '100%' }}
                    animate={{ width: krympet ? '88%' : '100%' }}
                    transition={{ duration: 3 }}
                />
            </div>
            <div className="text-xl font-bold text-slate-600 mt-2">krymper nesten ikke</div>
        </Kort>
    );
}

function Overlegg({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'kjop' && beat === 0) {
        return (
            <Kort>
                <div className="text-2xl font-black">Ny jobb</div>
                <div className="text-xl font-bold text-slate-600">i en butikk</div>
            </Kort>
        );
    }
    if (modus === 'kjop' && beat === 1) {
        return (
            <Kort>
                <div className="text-xl font-bold text-slate-500">Gaming-PC</div>
                <div className="text-5xl font-black tabular-nums">15 000 kr</div>
            </Kort>
        );
    }
    if (modus === 'kjop' && beat === 2) {
        return (
            <div className="flex flex-col gap-3">
                <Kort>
                    <div className="text-xl font-bold text-slate-500">PC-en koster</div>
                    <div className="text-4xl font-black tabular-nums">15 000 kr</div>
                </Kort>
                <Kort>
                    <div className="text-xl font-bold text-slate-500">På kontoen</div>
                    <div className="text-4xl font-black tabular-nums text-red-600">2 000 kr</div>
                    <div className="text-xl font-bold text-red-600 mt-1">Det holder ikke</div>
                </Kort>
            </div>
        );
    }
    if (modus === 'kjop' && beat === 3) {
        return (
            <Kort>
                <div className="text-xl font-bold text-slate-500">Kredittkort</div>
                <div className="text-2xl font-black">plass til</div>
                <div className="text-5xl font-black tabular-nums text-blue-700">20 000 kr</div>
            </Kort>
        );
    }
    if (modus === 'kjop' && beat === 4) {
        return (
            <Kort>
                <div className="text-3xl font-black text-teal-700">Kjøpt!</div>
                <div className="text-2xl font-black text-red-600 mt-1">Men ikke betalt.</div>
            </Kort>
        );
    }
    if (modus === 'toaar' && beat === 1) {
        return (
            <Kort>
                <div className="text-2xl font-black">Han spiller fortsatt.</div>
                <div className="text-2xl font-black text-red-600 mt-1">Han betaler fortsatt.</div>
            </Kort>
        );
    }
    if (modus === 'toaar' && beat === 2) {
        return (
            <Kort>
                <div className="text-2xl font-black">Hver måned</div>
                <div className="text-xl font-bold text-slate-600">et lite beløp fra Emil</div>
                <div className="text-xl font-bold text-slate-600">til kortselskapet</div>
            </Kort>
        );
    }
    if (modus === 'toaar' && beat === 3) return <Gjeldsstolpe krympet />;
    if (modus === 'gammel' && beat === 0) {
        return (
            <Kort>
                <div className="text-xl font-bold text-slate-500">En gaming-PC holder</div>
                <div className="text-4xl font-black">kanskje 5 år</div>
            </Kort>
        );
    }
    if (modus === 'gammel' && beat === 1) {
        return (
            <Kort bredde={380}>
                <div className="text-xl font-bold text-slate-500">PC-en føles gammel</div>
                <div className="text-3xl font-black">etter kanskje 5 år</div>
                <div className="text-xl font-bold text-slate-500 mt-3">
                    Minstebeløpet, i eksemplet
                </div>
                <div className="text-3xl font-black text-red-600">over 6 år</div>
            </Kort>
        );
    }
    if (modus === 'gammel' && beat === 2) {
        return (
            <Kort bredde={360}>
                <div className="text-2xl font-black">Lån aldri til ting</div>
                <div className="text-2xl font-black text-red-600">
                    som er brukt opp før lånet er betalt
                </div>
            </Kort>
        );
    }
    if (modus === 'spare' && beat === 0) {
        return (
            <Kort>
                <div className="text-2xl font-black">Ikke ulovlig.</div>
                <div className="text-2xl font-black text-teal-700 mt-1">
                    Men det fantes andre valg.
                </div>
            </Kort>
        );
    }
    if (modus === 'spare' && beat === 1) {
        return (
            <Kort>
                <div className="text-3xl font-black text-teal-700">Spare først</div>
                <div className="text-xl font-bold text-slate-600">
                    noen måneder, så betale med egne penger
                </div>
            </Kort>
        );
    }
    if (modus === 'spare' && beat === 2) {
        return (
            <Kort>
                <div className="text-3xl font-black text-teal-700">Billigere PC</div>
                <div className="text-xl font-bold text-slate-600">og spare resten</div>
            </Kort>
        );
    }
    if (modus === 'spare' && beat === 3) {
        return (
            <Kort bredde={340}>
                <div className="text-2xl font-black">Betale hele fakturaen</div>
                <div className="text-2xl font-black">før fristen</div>
                <div className="text-3xl font-black text-teal-700 mt-2">
                    Kortet kostet ingenting
                </div>
            </Kort>
        );
    }
    return null;
}

export function KredittRommet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kjop';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [6.5, 4.6, 7.5] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '5%' }}
            >
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
            <div className="absolute pointer-events-none" style={{ right: '4%', top: '20%' }}>
                <AnimatePresence mode="wait">
                    <motion.div key={`${modus}-${beat}`} exit={{ opacity: 0 }}>
                        <Overlegg modus={modus} beat={beat} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
