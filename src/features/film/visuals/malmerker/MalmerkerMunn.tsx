import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Munnen sett fra siden, som et snitt i 3D. «tjukkl»: tunga bøyer seg bakover og
 * tungespissen slår mot ganen. «norront»: munnen sier tjukk l mens ordene fra norrønt
 * kommer fram. «tonefall»: stemmen kommer ut av munnen som en linje som stiger (øst) eller
 * faller (vest). Fremst i munnen er +x, opp er +y.
 */

type Modus = 'tjukkl' | 'norront' | 'tonefall';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ------------------------------------------------------------ former */

function ekstruder(punkter: [number, number][], dybde: number) {
    const s = new THREE.Shape();
    punkter.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
        depth: dybde,
        bevelEnabled: true,
        bevelSize: 0.06,
        bevelThickness: 0.06,
        bevelSegments: 2,
        curveSegments: 6,
    });
    g.translate(0, 0, -dybde / 2);
    return g;
}

/** Ganen fra fortennene og bakover. */
const GANE: [number, number][] = [
    [3.15, 0.35],
    [2.75, 0.85],
    [2.2, 1.25],
    [1.4, 1.5],
    [0.3, 1.62],
    [-1.0, 1.55],
    [-2.1, 1.3],
    [-2.8, 0.8],
    [-3.0, 0.45],
];
const OVERKJEVE: [number, number][] = [...GANE, [-3.3, 0.5], [-3.4, 2.5], [3.5, 2.5], [3.5, 0.35]];
const UNDERKJEVE: [number, number][] = [
    [3.15, -0.95],
    [2.4, -1.55],
    [1.0, -1.95],
    [-1.0, -2.05],
    [-2.6, -1.85],
    [-3.1, -1.2],
    [-3.4, -1.2],
    [-3.4, -2.7],
    [3.5, -2.7],
    [3.5, -0.95],
];

/** Tungas form: seks kontrollpunkter fra rota til spissen. */
type Positur = [number, number][];
const HVILE: Positur = [
    [-2.4, -1.45],
    [-1.3, -0.75],
    [0.0, -0.5],
    [1.2, -0.55],
    [2.1, -0.8],
    [2.7, -0.95],
];
const BAKOVER: Positur = [
    [-2.4, -1.45],
    [-1.1, -0.8],
    [0.5, -0.75],
    [1.65, -0.35],
    [1.8, 0.35],
    [1.2, 0.9],
];
const SLAG: Positur = [
    [-2.4, -1.45],
    [-1.1, -0.8],
    [0.5, -0.65],
    [1.7, -0.15],
    [2.15, 0.5],
    [2.45, 0.92],
];
const ETTER: Positur = [
    [-2.4, -1.45],
    [-1.2, -0.78],
    [0.3, -0.55],
    [1.5, -0.5],
    [2.25, -0.55],
    [2.65, -0.75],
];

function blandPositur(a: Positur, b: Positur, k: number): Positur {
    return a.map(([x, y], i) => [x + (b[i][0] - x) * k, y + (b[i][1] - y) * k]);
}

/** Slaget: holder bakover, slår fram mot ganen og blir et øyeblikk der, faller ned, tilbake. Syklus på 2,6 s. */
function slagPositur(t: number): { p: Positur; treff: number } {
    const s = t % 2.6;
    if (s < 0.5) return { p: BAKOVER, treff: 0 };
    if (s < 0.65) return { p: blandPositur(BAKOVER, SLAG, (s - 0.5) / 0.15), treff: 0 };
    if (s < 1.6) return { p: SLAG, treff: 1 - (s - 0.65) / 1.2 };
    if (s < 1.85) return { p: blandPositur(SLAG, ETTER, (s - 1.6) / 0.25), treff: 0 };
    if (s < 2.1) return { p: ETTER, treff: 0 };
    return { p: blandPositur(ETTER, BAKOVER, (s - 2.1) / 0.5), treff: 0 };
}

const KULER = 28;

function Tunge({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kuler = useRef<(THREE.Mesh | null)[]>([]);
    const glimt = useRef<THREE.Mesh>(null);
    const naa = useRef<Positur>(HVILE.map((p) => [...p] as [number, number]));
    const tid = useRef(0);
    const forrige = useRef(-1);
    const kurve = useMemo(() => new THREE.CatmullRomCurve3(HVILE.map(([x, y]) => v(x, y, 0))), []);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            const forste = forrige.current === -1;
            forrige.current = beat;
            tid.current = 0;
            if (forste) {
                // Første bilde: rett på plass.
                naa.current = målFor(0).p.map((p) => [...p] as [number, number]);
            }
        }
        tid.current += dt;
        function målFor(t: number): { p: Positur; treff: number } {
            if (modus === 'tjukkl') {
                if (beat <= 1) return { p: HVILE, treff: 0 };
                if (beat === 2) return { p: BAKOVER, treff: 0 };
                // På pause skal bildet vise selve slaget mot ganen.
                if (!playing) return { p: SLAG, treff: 1 };
                return slagPositur(t + 0.8);
            }
            if (modus === 'norront') return playing ? slagPositur(t + 0.4) : { p: SLAG, treff: 0 };
            return { p: ETTER, treff: 0 };
        }
        const { p: mål, treff } = målFor(tid.current);
        const rask = modus !== 'tonefall' && (beat === 3 || modus === 'norront');
        naa.current = naa.current.map(([x, y], i) =>
            rask
                ? ([mål[i][0], mål[i][1]] as [number, number])
                : ([damp(x, mål[i][0], 5, dt || 0.016), damp(y, mål[i][1], 5, dt || 0.016)] as [
                      number,
                      number,
                  ])
        );
        kurve.points.forEach((pt, i) => pt.set(naa.current[i][0], naa.current[i][1], 0));
        kurve.updateArcLengths();
        for (let i = 0; i < KULER; i++) {
            const m = kuler.current[i];
            if (!m) continue;
            const u = i / (KULER - 1);
            const pt = kurve.getPointAt(u);
            m.position.copy(pt);
        }
        if (glimt.current) {
            const spiss = kurve.getPointAt(1);
            glimt.current.position.set(spiss.x + 0.05, spiss.y + 0.12, 0);
            const s = 0.2 + treff * 0.5;
            glimt.current.scale.setScalar(s);
            glimt.current.visible = treff > 0.05;
        }
    });

    return (
        <group>
            {Array.from({ length: KULER }, (_, i) => {
                const u = i / (KULER - 1);
                const r = 0.7 - u * 0.48;
                return (
                    <mesh
                        key={i}
                        ref={(m) => {
                            kuler.current[i] = m;
                        }}
                        scale={[1, 1, 1.55]}
                    >
                        <sphereGeometry args={[r, 18, 14]} />
                        <meshStandardMaterial
                            color={i === KULER - 1 ? '#fb7185' : '#e11d48'}
                            roughness={0.55}
                        />
                    </mesh>
                );
            })}
            <mesh ref={glimt} visible={false}>
                <sphereGeometry args={[1, 16, 12]} />
                <meshBasicMaterial color="#fde047" transparent opacity={0.85} />
            </mesh>
        </group>
    );
}

/* ------------------------------------------------------------ tonefall */

const STIGER = [
    v(3.8, -0.3, 0),
    v(5.5, -0.1, 0),
    v(7.2, 0.0, 0),
    v(8.6, 0.3, 0),
    v(9.8, 1.2, 0),
    v(10.8, 2.3, 0),
];
const FALLER = [
    v(3.8, -0.3, 0.3),
    v(5.5, 0.45, 0.3),
    v(7.2, 0.7, 0.3),
    v(8.6, 0.45, 0.3),
    v(9.8, -0.5, 0.3),
    v(10.8, -1.6, 0.3),
];
const BOLGE = [
    v(3.8, -0.3, 0),
    v(5.0, 0.2, 0),
    v(6.2, -0.4, 0),
    v(7.4, 0.25, 0),
    v(8.6, -0.35, 0),
    v(9.8, 0.1, 0),
];

function Stemme({
    punkter,
    farge,
    synlig,
    playing,
}: {
    punkter: THREE.Vector3[];
    farge: string;
    synlig: boolean;
    playing: boolean;
}) {
    const geo = useMemo(
        () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(punkter), 90, 0.13, 10, false),
        [punkter]
    );
    useEffect(() => () => geo.dispose(), [geo]);
    const andel = useRef(0);
    const forste = useRef(true);
    const totalt = geo.index ? geo.index.count : 0;
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = synlig ? 1 : 0;
        if (forste.current) {
            // Hopper eleven hit, står linja ferdig tegnet.
            andel.current = mål;
            forste.current = false;
        } else if (synlig) {
            andel.current = Math.min(1, andel.current + dt / 1.6);
        } else {
            andel.current = 0;
        }
        const n = Math.floor((totalt * andel.current) / 6) * 6;
        geo.setDrawRange(0, n);
    });
    return (
        <mesh geometry={geo} frustumCulled={false}>
            <meshStandardMaterial
                color={farge}
                emissive={farge}
                emissiveIntensity={0.35}
                roughness={0.4}
            />
        </mesh>
    );
}

/* ------------------------------------------------------------ scene */

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'tjukkl') {
        switch (beat) {
            case 0:
                return { pos: v(3.5 - t * 0.08, 1.6, 10.5), se: v(0, -0.1, 0) };
            case 1:
                return { pos: v(5.5, 1.2, 10), se: v(-1.3, -0.1, 0) };
            case 2:
                return { pos: v(3.4, 0.9, 7.6), se: v(0.6, 0.1, 0) };
            default:
                return { pos: v(3.0, 0.7, 6.6), se: v(1.4, 0.25, 0) };
        }
    }
    if (modus === 'norront') {
        return {
            pos: v(-3.2 + beat * 0.25, 1.4, 14 - beat * 0.3),
            se: v(-3.9 + beat * 0.15, -0.1, 0),
        };
    }
    if (beat === 0) return { pos: v(5.5, 0.9, 14.5), se: v(5.3, 0.1, 0) };
    return { pos: v(6.6, 0.8, 15.5), se: v(6.6, 0.25, 0) };
}

function Munn({ modus }: { modus: Modus }) {
    const over = useMemo(() => ekstruder(OVERKJEVE, 2.4), []);
    const under = useMemo(() => ekstruder(UNDERKJEVE, 2.4), []);
    useEffect(
        () => () => {
            over.dispose();
            under.dispose();
        },
        [over, under]
    );
    const aapen = modus === 'tonefall';
    return (
        <group>
            <mesh geometry={over}>
                <meshStandardMaterial color="#f9a8b8" roughness={0.7} flatShading />
            </mesh>
            <mesh geometry={under} position={[0, aapen ? -0.1 : 0, 0]}>
                <meshStandardMaterial color="#f48aa0" roughness={0.7} flatShading />
            </mesh>
            {/* Fortenner */}
            <mesh position={[3.12, 0.12, 0]}>
                <boxGeometry args={[0.32, 0.55, 2.2]} />
                <meshStandardMaterial color="#fffbeb" roughness={0.3} />
            </mesh>
            <mesh position={[3.05, -0.72, 0]}>
                <boxGeometry args={[0.3, 0.45, 2.1]} />
                <meshStandardMaterial color="#fffbeb" roughness={0.3} />
            </mesh>
            {/* Lepper */}
            <mesh position={[3.7, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.32, 1.9, 6, 12]} />
                <meshStandardMaterial color="#be123c" roughness={0.5} />
            </mesh>
            <mesh position={[3.68, aapen ? -1.0 : -0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.32, 1.9, 6, 12]} />
                <meshStandardMaterial color="#be123c" roughness={0.5} />
            </mesh>
            {/* Munnhula bak: mørk vegg */}
            <mesh position={[-0.2, -0.2, -1.21]}>
                <planeGeometry args={[6.8, 4.2]} />
                <meshStandardMaterial color="#4c0519" roughness={0.9} />
            </mesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const tid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(v(0, 0, 0));
    const forste = useRef(true);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const mål = kameraFor(modus, beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.6 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        se.current.lerp(mål.se, k);
        camera.lookAt(se.current);
    });

    return (
        <>
            <color attach="background" args={['#1e293b']} />
            <fog attach="fog" args={['#1e293b', 25, 60]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[6, 8, 10]} intensity={1.5} color="#fff7ed" />
            <hemisphereLight args={['#e0f2fe', '#3b0764', 0.45]} />
            <Munn modus={modus} />
            <Tunge modus={modus} beat={beat} playing={playing} />
            {modus === 'tonefall' && (
                <>
                    <Stemme punkter={BOLGE} farge="#94a3b8" synlig={beat === 0} playing={playing} />
                    <Stemme
                        punkter={STIGER}
                        farge="#f59e0b"
                        synlig={beat === 1 || beat >= 3}
                        playing={playing}
                    />
                    <Stemme punkter={FALLER} farge="#38bdf8" synlig={beat >= 2} playing={playing} />
                </>
            )}
        </>
    );
}

/* ------------------------------------------------------------ DOM over lerretet */

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <div
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: '5%' }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="px-5 py-1.5 rounded-xl bg-white/90 text-slate-800 font-black shadow text-3xl"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Merke({
    x,
    y,
    tekst,
    farge = '#ffffff',
}: {
    x: string;
    y: string;
    tekst: string;
    farge?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute font-black text-2xl px-3 py-1 rounded-lg bg-slate-900/80 pointer-events-none"
            style={{ left: x, top: y, color: farge }}
        >
            {tekst}
        </motion.div>
    );
}

function Ordpar({ fra, til, forsinkelse = 0 }: { fra: string; til: string; forsinkelse?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: forsinkelse }}
            className="flex items-center gap-3 rounded-2xl bg-white shadow-xl px-5 py-2"
        >
            <span className="text-4xl font-black text-slate-500">{fra}</span>
            <span className="text-3xl font-black text-slate-400">→</span>
            <span className="text-4xl font-black text-rose-600">{til}</span>
        </motion.div>
    );
}

function NorrontKort({
    ord,
    merke,
    forsinkelse = 0,
}: {
    ord: [string, string, string];
    merke: string;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: forsinkelse }}
            className="flex items-center gap-3 rounded-2xl bg-amber-50 shadow-xl px-5 py-2 border-4 border-amber-600"
        >
            <span className="text-4xl font-black text-slate-800">
                {ord[0]}
                <span className="text-amber-700 underline">{ord[1]}</span>
                {ord[2]}
            </span>
            <span className="text-2xl font-bold text-amber-800">{merke}</span>
        </motion.div>
    );
}

const TITLER: Record<Modus, string[]> = {
    tjukkl: [
        'Munnen, sett fra siden',
        'Tjukk l',
        'Tunga bøyes bakover',
        'Tungespissen slår mot ganen',
    ],
    norront: [
        'Arv fra norrønt',
        'Der norrønt hadde l',
        'Der norrønt hadde rð',
        'Over tusen år gamle spor',
    ],
    tonefall: [
        'Tonefall: stemmen opp og ned',
        'Østlandet og Trøndelag',
        'Vestlandet og Nord-Norge',
        'Grensa: omtrent ved Lillesand',
    ],
};

export function MalmerkerMunn({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'tjukkl';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const titler = TITLER[modus];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 40, near: 0.1, far: 100, position: [3.5, 1.6, 10.5] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Overskrift tekst={titler[Math.min(beat, titler.length - 1)]} />
            <AnimatePresence>
                {modus === 'tjukkl' && beat === 0 && (
                    <Merke key="tunga" x="38%" y="70%" tekst="tunga" farge="#fda4af" />
                )}
                {modus === 'tjukkl' && beat === 0 && (
                    <Merke key="gane" x="40%" y="20%" tekst="ganen" farge="#fde68a" />
                )}
                {modus === 'tjukkl' && beat === 0 && (
                    <Merke key="tenner" x="72%" y="44%" tekst="tennene" />
                )}
                {modus === 'tjukkl' && beat === 1 && (
                    <motion.div
                        key="ord"
                        className="absolute flex flex-col gap-4"
                        style={{ right: '5%', top: '30%' }}
                    >
                        <Ordpar fra="sol" til="såL" />
                        <Ordpar fra="bord" til="boL" forsinkelse={0.4} />
                    </motion.div>
                )}
                {modus === 'tjukkl' && beat === 2 && (
                    <Merke
                        key="bak"
                        x="12%"
                        y="70%"
                        tekst="← tunga bøyes bakover"
                        farge="#fda4af"
                    />
                )}
                {modus === 'tjukkl' && beat === 3 && (
                    <Merke
                        key="slag"
                        x="8%"
                        y="72%"
                        tekst="tungespissen slår mot ganen"
                        farge="#fde047"
                    />
                )}
                {modus === 'tjukkl' && beat === 3 && (
                    <Merke key="gane3" x="30%" y="20%" tekst="ganen" farge="#fde68a" />
                )}

                {modus === 'norront' && (
                    <motion.div
                        key="norront-ord"
                        className="absolute flex flex-col gap-4"
                        style={{ left: '6%', top: '22%' }}
                    >
                        {beat === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-2xl bg-amber-100 border-4 border-amber-700 px-6 py-4 shadow-xl"
                            >
                                <div className="text-4xl font-black text-amber-900">norrønt</div>
                                <div className="text-2xl font-bold text-amber-800">
                                    språket vikingene snakket
                                </div>
                            </motion.div>
                        )}
                        {beat >= 1 && <NorrontKort ord={['da', 'l', '']} merke="l i norrønt" />}
                        {beat >= 1 && (
                            <NorrontKort
                                ord={['so', 'l', '']}
                                merke="l i norrønt"
                                forsinkelse={0.3}
                            />
                        )}
                        {beat >= 2 && <NorrontKort ord={['ga', 'rd', '']} merke="rð i norrønt" />}
                        {beat >= 2 && (
                            <NorrontKort
                                ord={['jo', 'rd', '']}
                                merke="rð i norrønt"
                                forsinkelse={0.3}
                            />
                        )}
                    </motion.div>
                )}
                {modus === 'norront' && beat >= 1 && (
                    <Merke
                        key="blir"
                        x="40%"
                        y="80%"
                        tekst={beat >= 3 ? 'levende spor i dag: tjukk L' : 'i dag: tjukk L'}
                        farge="#fde047"
                    />
                )}

                {modus === 'tonefall' && beat === 0 && (
                    <Merke key="munn" x="8%" y="72%" tekst="stemmen ut av munnen" />
                )}
                {modus === 'tonefall' && (beat === 1 || beat >= 3) && (
                    <Merke
                        key="stiger"
                        x="62%"
                        y="18%"
                        tekst="↗ stiger: øst og Trøndelag"
                        farge="#fbbf24"
                    />
                )}
                {modus === 'tonefall' && beat >= 2 && (
                    <Merke
                        key="faller"
                        x="60%"
                        y="80%"
                        tekst="↘ faller: vest og nord"
                        farge="#7dd3fc"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
