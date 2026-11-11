import { useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Bergen ved havna i 3D: trehusene på Bryggen med gavlene mot vannet, byen og fjellene bak.
 * «torg»: to bergensere møtes og sier den samme setningen på hver sin måte.
 * «hansa»: hansaskipene legger til, og norsk og nedertysk lever side om side.
 * «mote»: en nordmann og en tysk kjøpmann handler, og hunkjønnet slites vekk.
 * «varer»: kassene losses, og hver kasse bærer et ord som kom fra tysk.
 */

type Modus = 'torg' | 'hansa' | 'mote' | 'varer';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const HUSFARGER = ['#b4382f', '#d9a441', '#efe6d2', '#b4382f', '#c8642c', '#e9d9a8', '#8e2f28'];
const PEN = '#1e3a8a';
const GATE = '#ea580c';
const TYSK = '#a16207';

function kameraFor(modus: Modus, beat: number, t: number) {
    const s = Math.min(t, 14);
    if (modus === 'torg') {
        if (beat === 0) return { pos: v(9 - s * 0.35, 4.5, 15), se: v(0, 2.4, -2) };
        return { pos: v(0, 2.4, 8.6), se: v(0, 1.9, 0) };
    }
    if (modus === 'hansa') {
        if (beat === 0) return { pos: v(30 - s * 0.6, 9, 34), se: v(6, 2, 2) };
        if (beat === 1) return { pos: v(4, 7.5, 24), se: v(0, 3.5, -2) };
        if (beat === 2) return { pos: v(-6 + s * 0.4, 6.5, 19), se: v(-3 + s * 0.4, 2.2, -2) };
        return { pos: v(0, 21, 44), se: v(0, 3, -6) };
    }
    if (modus === 'mote') {
        if (beat === 0) return { pos: v(-12, 7, 22), se: v(-3, 3, -2) };
        return { pos: v(1.8 + s * 0.03, 2.6, 8.4), se: v(1.8, 1.6, 0) };
    }
    if (beat === 0) return { pos: v(-12, 6, 18), se: v(0, 1.5, 0) };
    if (beat === 1) return { pos: v(0, 5.2, 14.5), se: v(0, 1.8, 0) };
    if (beat === 2) return { pos: v(4, 4.8, 13.5), se: v(0, 2, 0) };
    return { pos: v(0, 6, 17), se: v(0, 2.4, 0) };
}

/** Et trehus med saltak. Gavlen vender mot vannet, slik husene på Bryggen gjør. */
function Hus({ x, b, h, farge }: { x: number; b: number; h: number; farge: string }) {
    const r = b / Math.sqrt(3);
    return (
        <group position={[x, 0.3, -4]}>
            <mesh position={[0, h / 2, 0]}>
                <boxGeometry args={[b, h, 6]} />
                <meshStandardMaterial color={farge} flatShading roughness={0.9} />
            </mesh>
            <mesh position={[0, h + r / 2 - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[r * 1.08, r * 1.08, 6.4, 3]} />
                <meshStandardMaterial color="#3f3a36" flatShading roughness={1} />
            </mesh>
            {/* Lasteluke i gavlen */}
            <mesh position={[0, h * 0.62, 3.01]}>
                <planeGeometry args={[b * 0.32, h * 0.32]} />
                <meshStandardMaterial color="#2b211c" />
            </mesh>
        </group>
    );
}

function Byen() {
    const hus = useMemo(
        () =>
            Array.from({ length: 13 }, (_, i) => ({
                x: -20.4 + i * 3.4,
                b: 3.1,
                h: 3.8 + ((i * 7) % 4) * 0.45,
                farge: HUSFARGER[i % HUSFARGER.length],
            })),
        []
    );
    const bak = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => ({
                x: -26 + i * 4.7,
                z: -14 - (i % 3) * 4,
                h: 4 + ((i * 5) % 4) * 1.2,
            })),
        []
    );
    const fjell = useMemo(
        () => [
            { x: -34, z: -62, h: 26, r: 22 },
            { x: -8, z: -72, h: 32, r: 26 },
            { x: 20, z: -64, h: 24, r: 21 },
            { x: 46, z: -70, h: 28, r: 24 },
            { x: -60, z: -66, h: 22, r: 22 },
        ],
        []
    );
    return (
        <>
            {/* Land og kai */}
            <mesh position={[0, 0.15, -30]}>
                <boxGeometry args={[200, 0.3, 63]} />
                <meshStandardMaterial color="#7d8a6b" />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[60, 0.32, 3]} />
                <meshStandardMaterial color="#9a8b78" />
            </mesh>
            {hus.map((h, i) => (
                <Hus key={i} {...h} />
            ))}
            {bak.map((h, i) => (
                <mesh key={i} position={[h.x, 0.3 + h.h / 2, h.z]}>
                    <boxGeometry args={[3.8, h.h, 3.6]} />
                    <meshStandardMaterial color={i % 2 ? '#f4f1ea' : '#e6dccb'} flatShading />
                </mesh>
            ))}
            {fjell.map((f, i) => (
                <mesh key={i} position={[f.x, f.h / 2, f.z]}>
                    <coneGeometry args={[f.r, f.h, 6]} />
                    <meshStandardMaterial color="#5b7356" flatShading roughness={1} />
                </mesh>
            ))}
        </>
    );
}

/** En kogge: bred skrog, én mast og ett råseil. */
function Kogge({ seil = '#efe4c8' }: { seil?: string }) {
    return (
        <group>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[7, 1.4, 2.4]} />
                <meshStandardMaterial color="#6b4423" flatShading />
            </mesh>
            <mesh position={[3.1, 1.6, 0]}>
                <boxGeometry args={[1.6, 0.9, 2.2]} />
                <meshStandardMaterial color="#5a3a1e" flatShading />
            </mesh>
            <mesh position={[0, 4.4, 0]}>
                <cylinderGeometry args={[0.12, 0.14, 6.2, 6]} />
                <meshStandardMaterial color="#3b2a1a" />
            </mesh>
            <mesh position={[0, 4.9, 0.18]}>
                <planeGeometry args={[3.6, 3.4]} />
                <meshStandardMaterial color={seil} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function Skip({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const mal = useMemo(
        () =>
            modus === 'hansa'
                ? [
                      { start: 46, x: 12, z: 7 },
                      { start: 62, x: -14, z: 8.5 },
                      { start: 78, x: 26, z: 9 },
                  ]
                : [
                      { start: 12, x: 12, z: 5.6 },
                      { start: 24, x: 22, z: 9 },
                  ],
        [modus]
    );
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        refs.current.forEach((g, i) => {
            if (!g) return;
            const m = mal[i];
            // Skipene seiler inn i første beat og ligger fortøyd etterpå (også ved hopp).
            if (modus === 'hansa' && beat === 0) {
                if (g.userData.init !== true) {
                    g.position.x = m.start;
                    g.userData.init = true;
                }
                g.position.x = damp(g.position.x, m.x, 0.32, dt);
            } else {
                g.position.x = m.x;
                g.userData.init = true;
            }
            g.position.z = m.z;
            g.position.y = Math.sin(tid.current * 0.9 + i) * 0.06;
        });
    });
    return (
        <>
            {mal.map((m, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        refs.current[i] = g;
                    }}
                    position={[m.start, 0, m.z]}
                >
                    <Kogge seil={i === 1 ? '#f3e7cf' : '#e8dcc0'} />
                </group>
            ))}
        </>
    );
}

/** En enkel person: kropp, hode og en farge som viser hvem det er. */
function Person({ farge }: { farge: string }) {
    return (
        <group>
            <mesh position={[0, 0.75, 0]}>
                <cylinderGeometry args={[0.32, 0.4, 1.5, 10]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 1.78, 0]}>
                <sphereGeometry args={[0.3, 14, 12]} />
                <meshStandardMaterial color="#f1c7a3" />
            </mesh>
        </group>
    );
}

function Folk({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const a = useRef<THREE.Group>(null);
    const b = useRef<THREE.Group>(null);
    const vandrere = useRef<(THREE.Group | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        if (modus === 'torg' && a.current && b.current) {
            // Beat 0: de går mot hverandre. Fra beat 1 står de der de skal (også ved hopp).
            const ma = -2.6;
            const mb = 2.6;
            if (beat === 0) {
                a.current.position.x = damp(a.current.position.x, ma, 0.5, dt);
                b.current.position.x = damp(b.current.position.x, mb, 0.5, dt);
            } else {
                a.current.position.x = ma;
                b.current.position.x = mb;
            }
        }
        if (modus === 'hansa') {
            vandrere.current.forEach((g, i) => {
                if (!g) return;
                g.visible = beat >= 2;
                const fart = 0.9 + (i % 3) * 0.25;
                const retning = i % 2 ? 1 : -1;
                const x = ((i * 5.3 + tid.current * fart * retning) % 40) - 20;
                g.position.set(x < -20 ? x + 40 : x, 0.32, -0.2 + (i % 2) * 0.9);
            });
        }
    });
    if (modus === 'torg') {
        return (
            <>
                <group ref={a} position={[-9, 0.32, 0.8]}>
                    <Person farge={PEN} />
                </group>
                <group ref={b} position={[9, 0.32, 0.8]}>
                    <Person farge={GATE} />
                </group>
            </>
        );
    }
    if (modus === 'mote') {
        return (
            <>
                <group position={[-1.6, 0.32, 0.6]}>
                    <Person farge="#2f6f8f" />
                </group>
                <group position={[1.6, 0.32, 0.6]}>
                    <Person farge={TYSK} />
                </group>
                <mesh position={[0, 0.72, 0.6]}>
                    <boxGeometry args={[0.9, 0.8, 0.9]} />
                    <meshStandardMaterial color="#b08a5a" flatShading />
                </mesh>
            </>
        );
    }
    if (modus === 'hansa') {
        return (
            <>
                {Array.from({ length: 10 }, (_, i) => (
                    <group
                        key={i}
                        ref={(g) => {
                            vandrere.current[i] = g;
                        }}
                        scale={0.8}
                        visible={false}
                    >
                        <Person farge={i % 2 ? TYSK : '#2f6f8f'} />
                    </group>
                ))}
            </>
        );
    }
    return null;
}

const KASSER = Array.from({ length: 8 }, (_, i) => ({ x: -7 + i * 2, z: 0.5 }));

function Kasser({ beat, playing }: { beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        refs.current.forEach((m, i) => {
            if (!m) return;
            // Beat 0: kassene kommer på land én etter én. Senere står alle der.
            const s = beat === 0 ? Math.min(1, Math.max(0.001, (tid.current - i * 0.45) * 2)) : 1;
            m.scale.setScalar(s);
        });
    });
    return (
        <>
            {KASSER.map((k, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                    position={[k.x, 0.82, k.z]}
                >
                    <boxGeometry args={[1.2, 1, 1.2]} />
                    <meshStandardMaterial color={i % 2 ? '#a77b4a' : '#bf9361'} flatShading />
                </mesh>
            ))}
        </>
    );
}

/** Flytter DOM-merkene til skjermposisjonen til punktene sine, uten setState. */
function Ankere({
    punkter,
    noder,
}: {
    punkter: THREE.Vector3[];
    noder: MutableRefObject<(HTMLDivElement | null)[]>;
}) {
    const tmp = useMemo(() => new THREE.Vector3(), []);
    useFrame(({ camera, size }) => {
        punkter.forEach((p, i) => {
            const el = noder.current[i];
            if (!el) return;
            tmp.copy(p).project(camera);
            const x = ((tmp.x + 1) / 2) * size.width;
            const y = ((1 - tmp.y) / 2) * size.height;
            el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            el.style.visibility = tmp.z < 1 ? 'visible' : 'hidden';
        });
    });
    return null;
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
        const m = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

/** Punktene DOM-merkene følger, per modus. */
function ankerFor(modus: Modus): THREE.Vector3[] {
    if (modus === 'torg') return [v(-2.6, 2.55, 0.8), v(2.6, 2.55, 0.8)];
    if (modus === 'hansa') return [v(0, 8.8, -4), v(-5, 8.4, -4), v(8, 10.5, -16)];
    if (modus === 'mote') return [v(-1.6, 2.5, 0.6), v(1.6, 2.5, 0.6)];
    return KASSER.map((k, i) => v(k.x, i % 2 ? 3.3 : 2.0, k.z));
}

const ORD = ['betale', 'bukse', 'frukt', 'sukker', 'snakke', 'prøve', 'reise', 'handle'];

export function BergenskBryggen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'torg';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const punkter = useMemo(() => ankerFor(modus), [modus]);
    const noder = useRef<(HTMLDivElement | null)[]>([]);
    const node = (i: number) => (el: HTMLDivElement | null) => {
        noder.current[i] = el;
    };

    return (
        <div className="absolute inset-0 overflow-hidden">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [20, 8, 30] }}
            >
                <color attach="background" args={['#c7d8e4']} />
                <fog attach="fog" args={['#c7d8e4', 45, 150]} />
                <ambientLight intensity={0.75} />
                <directionalLight position={[20, 40, 25]} intensity={1.3} color="#fff4e2" />
                <hemisphereLight args={['#dfeaf3', '#3a5a6e', 0.45]} />
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 40]}>
                    <planeGeometry args={[300, 80]} />
                    <meshStandardMaterial color="#3d6f8e" emissive="#16384d" roughness={0.35} />
                </mesh>
                <Byen />
                {(modus === 'hansa' || modus === 'varer') && (
                    <Skip modus={modus} beat={beat} playing={playing} />
                )}
                <Folk modus={modus} beat={beat} playing={playing} />
                {modus === 'varer' && <Kasser beat={beat} playing={playing} />}
                <Kamera modus={modus} beat={beat} playing={playing} />
                <Ankere punkter={punkter} noder={noder} />
            </Canvas>

            {/* Merker som følger punkter i 3D. Ytre div flyttes, indre div sentrerer. */}
            {punkter.map((_, i) => (
                <div key={`${modus}-${i}`} ref={node(i)} className="absolute left-0 top-0">
                    <AnkerInnhold modus={modus} indeks={i} beat={beat} />
                </div>
            ))}

            <AnimatePresence>
                {modus === 'torg' && beat === 3 && (
                    <Banner key="t3" tekst="Begge snakker bergensk" />
                )}
                {modus === 'hansa' && beat === 3 && (
                    <Banner key="h3" tekst="Formet på en helt egen måte" />
                )}
                {modus === 'mote' && <MoteKort key="mk" beat={beat} />}
                {modus === 'varer' && beat === 0 && (
                    <Banner key="v0" tekst="Nye ord kom med hansakjøpmennene" />
                )}
                {modus === 'varer' && beat === 2 && (
                    <Banner key="v2" tekst="Hverdagsord som kom fra tysk" />
                )}
                {modus === 'varer' && beat === 3 && <EiendomKort key="v3" />}
            </AnimatePresence>
        </div>
    );
}

function AnkerInnhold({ modus, indeks, beat }: { modus: Modus; indeks: number; beat: number }) {
    if (modus === 'torg') {
        const tekst =
            indeks === 0
                ? 'Jei vet ikke vor dere kjøpte kjøttet.'
                : 'Eg vet ikkje kor dokkar sjøpte sjøttet.';
        const vis = indeks === 0 ? beat === 1 || beat === 3 : beat >= 2;
        return (
            <div style={{ transform: 'translate(-50%, -100%)', width: 300 }} className="pb-3">
                <AnimatePresence>
                    {vis && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative rounded-2xl bg-white px-4 py-3 shadow-xl text-2xl font-bold leading-snug"
                            style={{
                                color: indeks === 0 ? PEN : '#9a3412',
                                border: `4px solid ${indeks === 0 ? PEN : GATE}`,
                            }}
                        >
                            {tekst}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
    if (modus === 'hansa') {
        const merker = [
            { tekst: 'Bryggen', fra: 0, til: 0, farge: '#0f172a' },
            { tekst: 'nedertysk', fra: 1, til: 2, farge: TYSK },
            { tekst: 'norsk', fra: 2, til: 2, farge: '#2f6f8f' },
        ];
        const m = merker[indeks];
        const vis = beat >= m.fra && beat <= m.til;
        return (
            <div style={{ transform: 'translate(-50%, -100%)' }}>
                <AnimatePresence>
                    {vis && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-xl bg-white/95 px-4 py-1.5 text-3xl font-black shadow-lg whitespace-nowrap"
                            style={{ color: m.farge }}
                        >
                            {m.tekst}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
    if (modus === 'mote') {
        const vis = beat >= 1;
        return (
            <div style={{ transform: 'translate(-50%, -100%)' }} className="pb-2">
                <AnimatePresence>
                    {vis && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-xl bg-white/95 px-3 py-1 text-2xl font-black shadow-lg whitespace-nowrap"
                            style={{ color: indeks === 0 ? '#2f6f8f' : TYSK }}
                        >
                            {indeks === 0 ? 'norsk' : 'nedertysk'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
    const vis = beat === 1 || beat === 2;
    return (
        <div style={{ transform: 'translate(-50%, -100%)' }}>
            <AnimatePresence>
                {vis && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: beat === 1 ? indeks * 0.35 : 0 }}
                        className="rounded-lg bg-amber-50 border-2 border-amber-700 px-3 py-0.5 text-2xl font-black text-amber-900 shadow-lg whitespace-nowrap"
                    >
                        {ORD[indeks]}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Banner({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: '7%' }}>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-6 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
            >
                {tekst}
            </motion.div>
        </div>
    );
}

const KJONN = [
    { navn: 'hankjønn', art: 'en' },
    { navn: 'hunkjønn', art: 'ei' },
    { navn: 'intetkjønn', art: 'et' },
];

/** Kortet til høyre i «mote»: de tre kjønnene, og hunkjønnet som slites vekk. */
function MoteKort({ beat }: { beat: number }) {
    const tittel =
        beat === 0
            ? 'Hvorfor forsvant hunkjønnet?'
            : beat <= 2
              ? 'Det som trengs minst, slites vekk'
              : beat === 3
                ? 'Det første som forsvant'
                : 'Igjen: bare to kjønn';
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl p-5"
            style={{ right: '4%', top: '9%', width: 410 }}
        >
            <div className="text-3xl font-black text-slate-900 leading-tight mb-4">{tittel}</div>
            <div className="flex flex-col gap-3">
                {KJONN.map((k) => {
                    const hun = k.navn === 'hunkjønn';
                    const borte = hun && beat >= 3;
                    const navn =
                        !hun && k.navn === 'hankjønn' && beat >= 4 ? 'felleskjønn' : k.navn;
                    return (
                        <motion.div
                            key={k.navn}
                            animate={{
                                opacity: borte ? 0 : hun && beat >= 1 ? 0.75 : 1,
                                height: borte ? 0 : 'auto',
                            }}
                            style={{ overflow: 'hidden' }}
                            transition={{ duration: borte ? 1.2 : 0.4 }}
                            className="flex items-center gap-3"
                        >
                            <div
                                className="flex-1 rounded-xl px-4 py-2 text-3xl font-bold"
                                style={{
                                    background: hun
                                        ? '#fce7f3'
                                        : navn === 'felleskjønn'
                                          ? '#dcfce7'
                                          : '#e0f2fe',
                                    color: '#0f172a',
                                    border:
                                        hun && beat >= 1
                                            ? '3px dashed #be185d'
                                            : '3px solid transparent',
                                }}
                            >
                                {navn}: <span className="font-black">{k.art}</span>
                            </div>
                            {hun && beat === 2 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-4xl font-black text-red-600"
                                >
                                    ✕
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
            {beat === 2 && (
                <div className="mt-4 text-2xl font-semibold text-slate-600">
                    Trengs minst for å forstå hverandre
                </div>
            )}
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-2xl font-semibold text-slate-600"
                >
                    Slik dansk også har
                </motion.div>
            )}
        </motion.div>
    );
}

function EiendomKort() {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: '8%' }}>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-3xl bg-white/95 shadow-2xl px-8 py-5 text-center"
            >
                <div className="text-xl font-bold text-slate-500 mb-2">Hvem eier bilen?</div>
                <div className="flex items-center gap-6 text-4xl font-black">
                    <span className="text-slate-500">mannens bil</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-amber-800">mannen sin bil</span>
                </div>
                <div className="text-xl font-semibold text-slate-600 mt-2">
                    kom trolig inn i norsk gjennom kontakten med tysk
                </div>
            </motion.div>
        </div>
    );
}
