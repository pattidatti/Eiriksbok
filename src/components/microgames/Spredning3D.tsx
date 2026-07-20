import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Play, Square } from 'lucide-react';
import {
    MicroGameScaffold,
    Hotspot,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    SceneQuiz,
    CompareToggle,
    Burst,
    damp,
    useIdleMotion,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om bølge- og sprangmodellen. Kjerneideen eleven skal
// kjenne på kroppen: et nytt dialekttrekk oppstår ETT sted og må REISE utover
// landet. To modeller gir to helt ulike mønstre:
//   - Bølgemodellen: trekket brer seg som ringer i vann. Nabo tar det opp etter
//     nabo. Nære steder først, fjerne sist. Også bygdene.
//   - Sprangmodellen: trekket HOPPER fra by til by og hopper over bygdene imellom.
//     Derfor kan to fjerne byer dele et trekk som bygdene mellom dem ikke har.

type Model = 'bolge' | 'sprang';
type Phase = 'explore' | 'quiz' | 'won';

const DURATION = 4.5; // sekunder for ett fullt løp

interface Node {
    id: string;
    navn: string;
    pos: [number, number];
    by: boolean; // true = by, false = bygd
}

// Kilden der trekket oppstår.
const KILDE: [number, number] = [2, 5.5];

const NODES: Node[] = [
    { id: 'bergen', navn: 'Bergen', pos: [-5.5, 1.5], by: true },
    { id: 'trondheim', navn: 'Trondheim', pos: [0.5, -2], by: true },
    { id: 'tromso', navn: 'Tromsø', pos: [4.5, -7], by: true },
    { id: 'v1', navn: 'bygd', pos: [-1, 3], by: false },
    { id: 'v2', navn: 'bygd', pos: [1.5, 1.5], by: false },
    { id: 'v3', navn: 'bygd', pos: [-2.5, -0.5], by: false },
    { id: 'v4', navn: 'bygd', pos: [2.5, -4.5], by: false },
    { id: 'v5', navn: 'bygd', pos: [-1, -5], by: false },
];

const dist2 = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// Byer sortert etter avstand fra kilden — rekkefølgen sprangene tar.
const BYER = NODES.filter((n) => n.by).sort((a, b) => dist2(KILDE, a.pos) - dist2(KILDE, b.pos));
const MAX_DIST = Math.max(...NODES.map((n) => dist2(KILDE, n.pos)));

const Spredning3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('explore');
    const [model, setModel] = useState<Model>('bolge');
    const [running, setRunning] = useState(false);
    const [runKey, setRunKey] = useState(0);
    const [seen, setSeen] = useState({ bolge: false, sprang: false });
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [touched, setTouched] = useState(false);
    const doneRef = useRef(false);

    const reset = () => {
        setPhase('explore');
        setModel('bolge');
        setRunning(false);
        setSeen({ bolge: false, sprang: false });
        setBanner(null);
        setTouched(false);
        setRunKey((k) => k + 1);
        doneRef.current = false;
    };

    const pickModel = (v: 'a' | 'b') => {
        const next: Model = v === 'a' ? 'bolge' : 'sprang';
        if (next === model) return;
        setModel(next);
        setRunning(false);
        setBanner(null);
        setRunKey((k) => k + 1);
        sounds.play('sceneChange');
    };

    const toggleRun = () => {
        setTouched(true);
        if (running) {
            setRunning(false);
            return;
        }
        setBanner(
            model === 'bolge'
                ? 'Trekket brer seg som ringer i vann …'
                : 'Trekket hopper fra by til by …'
        );
        setRunKey((k) => k + 1);
        setRunning(true);
        sounds.play('select');
    };

    const handleCycleEnd = (m: Model) => {
        setRunning(false);
        setBurst((b) => b + 1);
        setSeen((p) => ({ ...p, [m]: true }));
        setBanner(
            m === 'bolge'
                ? 'Alle stedene tok opp trekket — nære først, fjerne sist. Også bygdene.'
                : 'Byene lyser, bygdene imellom er hoppet over. Byene deler et trekk bygdene ikke har.'
        );
        sounds.play(m === 'bolge' ? 'advance' : 'complete');
    };

    const bothSeen = seen.bolge && seen.sprang;

    const finish = (correct: boolean) => {
        if (doneRef.current) return;
        doneRef.current = true;
        setBurst((b) => b + 1);
        setPhase('won');
        setRunning(false);
        sounds.play('complete');
        onComplete({ score: correct ? 1 : 0.7, completed: true, artifact: { model } });
    };

    const idle = !touched && !running;

    return (
        <MicroGameScaffold
            title="Slik reiser et dialekttrekk"
            subtitle="Samme land, samme kilde — men modellen avgjør hvem som får trekket"
            estimatedSeconds={140}
            onRetry={touched || phase !== 'explore' ? reset : undefined}
            canvas={{
                idle: idle && phase === 'explore',
                autoRotateSpeed: 0.25,
                camera: { position: [0, 12, 15], fov: 42 },
                background: '#cfe6f5',
                fog: { color: '#dcecf7', near: 26, far: 70 },
                target: [0, 0, 0],
                maxPolarAngle: Math.PI / 2.15,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {model === 'bolge' ? 'Bølgemodellen' : 'Sprangmodellen'}
                    </SceneBadge>
                    <DragHint show={idle}>Trykk den lysende byen: slipp trekket løs</DragHint>
                </>
            }
            scene={
                <SpreadScene
                    model={model}
                    running={running}
                    runKey={runKey}
                    burst={burst}
                    showStart={!running}
                    onStart={toggleRun}
                    onCycleEnd={handleCycleEnd}
                />
            }
        >
            {phase === 'explore' && (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <CompareToggle
                            labelA="Bølge"
                            labelB="Sprang"
                            value={model === 'bolge' ? 'a' : 'b'}
                            onChange={pickModel}
                        />
                        <button
                            onClick={toggleRun}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition"
                        >
                            {running ? (
                                <>
                                    <Square className="w-4 h-4" /> Stopp
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" /> Slipp trekket løs
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex gap-2.5">
                        <SeenChip label="Bølge" hint="ringer i vann" done={seen.bolge} />
                        <SeenChip label="Sprang" hint="hopp mellom byer" done={seen.sprang} />
                    </div>

                    <SceneFact>
                        {model === 'bolge' ? (
                            <>
                                <span className="font-bold text-slate-800">Bølgemodellen:</span>{' '}
                                trekket brer seg jevnt utover fra kilden, som ringer i vann. Nabo tar
                                det opp etter nabo — også bygdene. De nære stedene får det først, de
                                fjerne sist.
                            </>
                        ) : (
                            <>
                                <span className="font-bold text-slate-800">Sprangmodellen:</span>{' '}
                                trekket hopper direkte fra by til by og hopper over bygdene imellom.
                                Media, flytting og internett gjør at trekk oftere hopper slik i dag.
                            </>
                        )}
                    </SceneFact>

                    {bothSeen ? (
                        <button
                            onClick={() => {
                                setRunning(false);
                                setBanner(null);
                                setPhase('quiz');
                                sounds.play('advance');
                            }}
                            className="self-start inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
                        >
                            Du har sett begge — sjekk forståelsen
                        </button>
                    ) : (
                        <p className="text-xs text-slate-500">
                            Slipp trekket løs i begge modellene for å se forskjellen på mønsteret.
                        </p>
                    )}
                </div>
            )}

            {phase === 'quiz' && (
                <SceneQuiz
                    question="To fjerne byer, Oslo og Tromsø, får det samme nye trekket, mens bygdene mellom dem ikke har det. Hvilken modell forklarer dette best?"
                    options={[
                        'Sprangmodellen — trekket hopper fra by til by',
                        'Bølgemodellen — trekket brer seg jevnt utover',
                        'Begge forklarer det like godt',
                        'Ingen av dem',
                    ]}
                    answerIndex={0}
                    explanation="Riktig: i sprangmodellen hopper trekket direkte mellom byene og hopper over bygdene imellom. Bølgemodellen ville i stedet ha spredt trekket jevnt til alle de nære stedene først."
                    onResult={finish}
                />
            )}

            {phase === 'won' && (
                <WinScreen title="Du forstår hvordan trekk reiser!" onReplay={reset}>
                    Bølgemodellen forklarer de myke overgangene fra bygd til bygd. Sprangmodellen
                    forklarer hvorfor byer langt fra hverandre kan ligne, mens bygdene imellom henger
                    igjen. De to modellene virker samtidig — og i dag hopper trekk stadig oftere i
                    sprang.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

function SeenChip({ label, hint, done }: { label: string; hint: string; done: boolean }) {
    return (
        <div
            className={`flex-1 rounded-xl border-2 px-3 py-2 transition ${
                done ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
            }`}
        >
            <div className="flex items-center gap-2">
                <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        done ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-500'
                    }`}
                >
                    {done ? '✓' : ''}
                </span>
                <span className="text-sm font-bold text-slate-800">{label}</span>
                <span className="text-[11px] text-slate-400">{hint}</span>
            </div>
        </div>
    );
}

// ============================================================
//  3D-SCENEN — et stilisert landskap med kilde, byer og bygder
// ============================================================

interface SceneProps {
    model: Model;
    running: boolean;
    runKey: number;
    burst: number;
    showStart: boolean;
    onStart: () => void;
    onCycleEnd: (m: Model) => void;
}

function SpreadScene({ model, running, runKey, burst, showStart, onStart, onCycleEnd }: SceneProps) {
    const t = useRef(0);
    const ended = useRef(false);

    const ring = useRef<THREE.Mesh>(null);
    const ringMat = useRef<THREE.MeshBasicMaterial>(null);
    const pulse = useRef<THREE.Mesh>(null);
    const pulseLight = useRef<THREE.PointLight>(null);

    // Materialer for "lyset" på hvert sted (glow-toppen).
    const litMats = useRef<Record<string, THREE.MeshStandardMaterial>>({});
    const litVal = useRef<Record<string, number>>({});

    useEffect(() => {
        t.current = 0;
        ended.current = false;
        NODES.forEach((n) => (litVal.current[n.id] = 0));
    }, [runKey]);

    const tmp = useRef(new THREE.Vector3());

    // Kvadratisk bezier for et sprang-hopp (løftet bue).
    const bezier = (
        p0: [number, number],
        p1: [number, number],
        u: number,
        out: THREE.Vector3
    ) => {
        const cx = (p0[0] + p1[0]) / 2;
        const cz = (p0[1] + p1[1]) / 2;
        const lift = 2.2 + dist2(p0, p1) * 0.18;
        const mx = (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * cx + u * u * p1[0];
        const mz = (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * cz + u * u * p1[1];
        const my = 2 * (1 - u) * u * lift + 0.3;
        out.set(mx, my, mz);
        return out;
    };

    useFrame((_, dt) => {
        if (running && !ended.current) {
            t.current += dt / DURATION;
            if (t.current >= 1) {
                t.current = 1;
                ended.current = true;
                onCycleEnd(model);
            }
        }
        const tt = t.current;

        // Mål-lys per sted
        const targets: Record<string, number> = {};
        if (model === 'bolge') {
            const ringR = tt * MAX_DIST;
            NODES.forEach((n) => {
                targets[n.id] = ringR >= dist2(KILDE, n.pos) ? 1 : 0;
            });
        } else {
            const n = BYER.length;
            NODES.forEach((node) => (targets[node.id] = 0));
            BYER.forEach((by, i) => {
                targets[by.id] = tt >= (i + 1) / n ? 1 : 0;
            });
        }

        // Damp lys mot mål
        NODES.forEach((n) => {
            const cur = litVal.current[n.id] ?? 0;
            const next = damp(cur, targets[n.id], dt, 8);
            litVal.current[n.id] = next;
            const m = litMats.current[n.id];
            if (m) {
                m.emissiveIntensity = next * 2.4;
                m.color.setRGB(
                    THREE.MathUtils.lerp(0.8, n.by ? 0.31 : 0.13, next),
                    THREE.MathUtils.lerp(0.83, n.by ? 0.27 : 0.77, next),
                    THREE.MathUtils.lerp(0.88, n.by ? 0.9 : 0.29, next)
                );
            }
        });

        // Bølgeringen
        if (ring.current && ringMat.current) {
            const show = model === 'bolge' && running;
            ring.current.visible = show;
            if (show) {
                const r = Math.max(0.001, tt * MAX_DIST);
                ring.current.scale.set(r, r, r);
                ringMat.current.opacity = 0.6 * (1 - tt);
            }
        }

        // Sprang-pulsen som hopper langs buen
        if (pulse.current) {
            const active = model === 'sprang' && running && tt < 1;
            pulse.current.visible = active;
            if (pulseLight.current) pulseLight.current.visible = active;
            if (active) {
                const n = BYER.length;
                const seg = Math.min(n - 1, Math.floor(tt * n));
                const u = tt * n - seg;
                bezier(KILDE, BYER[seg].pos, u, tmp.current);
                pulse.current.position.copy(tmp.current);
                if (pulseLight.current) pulseLight.current.position.copy(tmp.current);
            }
        }
    });

    return (
        <group>
            {/* Land + hav */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                <circleGeometry args={[26, 48]} />
                <meshStandardMaterial color="#bfe0f2" roughness={1} />
            </mesh>
            <Landmass />

            {/* Faste by-til-by-linjer (kun i sprang) */}
            {model === 'sprang' &&
                BYER.map((by) => <ArcLine key={`arc-${by.id}`} from={KILDE} to={by.pos} />)}

            {/* Kilden */}
            <NodeMesh
                node={{ id: 'kilde', navn: 'Oslo', pos: KILDE, by: true }}
                source
                registerMat={() => {}}
            />

            {/* Stedene */}
            {NODES.map((n) => (
                <NodeMesh
                    key={n.id}
                    node={n}
                    registerMat={(m) => {
                        litMats.current[n.id] = m;
                    }}
                />
            ))}

            {/* Bølgeringen (skaleres i useFrame) */}
            <mesh
                ref={ring}
                position={[KILDE[0], 0.06, KILDE[1]]}
                rotation={[-Math.PI / 2, 0, 0]}
                visible={false}
            >
                <ringGeometry args={[0.9, 1, 64]} />
                <meshBasicMaterial
                    ref={ringMat}
                    color="#4f46e5"
                    transparent
                    opacity={0.5}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Sprang-pulsen */}
            <mesh ref={pulse} visible={false}>
                <sphereGeometry args={[0.32, 16, 16]} />
                <meshStandardMaterial
                    color="#c4b5fd"
                    emissive="#7c3aed"
                    emissiveIntensity={2.2}
                    toneMapped={false}
                />
            </mesh>
            <pointLight ref={pulseLight} color="#a78bfa" distance={6} intensity={2} visible={false} />

            {/* Feiringspartikler ved fullført løp */}
            <Burst position={[KILDE[0], 1.4, KILDE[1]]} trigger={burst} color="#c7d2fe" count={30} spread={4} />

            {/* Start-hotspot over kilden */}
            {showStart && (
                <Hotspot
                    position={[KILDE[0], 2.6, KILDE[1]]}
                    onSelect={onStart}
                    label="Slipp trekket løs"
                    radius={0.5}
                />
            )}
        </group>
    );
}

// Et sted: en liten "sokkel" + en glow-kule på toppen som lyser når stedet
// tar opp trekket. Byer er høye tårn, bygder er lave hus.
function NodeMesh({
    node,
    source = false,
    registerMat,
}: {
    node: Node;
    source?: boolean;
    registerMat: (m: THREE.MeshStandardMaterial) => void;
}) {
    const h = node.by ? 1.6 : 0.7;
    const w = node.by ? 0.7 : 0.55;
    return (
        <group position={[node.pos[0], 0, node.pos[1]]}>
            {/* Bygningskropp */}
            <mesh position={[0, h / 2, 0]} castShadow>
                <boxGeometry args={[w, h, w]} />
                <meshStandardMaterial color={node.by ? '#e2e8f0' : '#e7efe4'} roughness={0.8} />
            </mesh>
            {/* Lys-topp */}
            <mesh position={[0, h + 0.28, 0]}>
                <sphereGeometry args={[node.by ? 0.34 : 0.26, 16, 16]} />
                {source ? (
                    <meshStandardMaterial
                        color="#4f46e5"
                        emissive="#4f46e5"
                        emissiveIntensity={2.6}
                        toneMapped={false}
                    />
                ) : (
                    <meshStandardMaterial
                        ref={(m) => {
                            if (m) registerMat(m);
                        }}
                        color="#cbd5e1"
                        emissive={node.by ? '#4f46e5' : '#22c55e'}
                        emissiveIntensity={0}
                        toneMapped={false}
                    />
                )}
            </mesh>
            {/* Bynavn */}
            {node.by && <NodeLabel text={node.navn} y={h + 1} />}
        </group>
    );
}

// Enkel tekst-etikett via kamera-vendt sprite ville krevd font — vi bruker en
// liten flytende plate med navnet malt i en CanvasTexture i stedet.
function NodeLabel({ text, y }: { text: string; y: number }) {
    const texture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 64;
        const ctx = c.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, 256, 64);
            ctx.font = 'bold 40px Inter, sans-serif';
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 128, 34);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }, [text]);
    const ref = useRef<THREE.Sprite>(null);
    return (
        <sprite ref={ref} position={[0, y, 0]} scale={[2.4, 0.6, 1]}>
            <spriteMaterial map={texture} transparent depthWrite={false} />
        </sprite>
    );
}

// En svak, buet stiplet linje mellom to steder (visualiserer sprang-forbindelsen).
function ArcLine({ from, to }: { from: [number, number]; to: [number, number] }) {
    const line = useMemo(() => {
        const cx = (from[0] + to[0]) / 2;
        const cz = (from[1] + to[1]) / 2;
        const lift = 2.2 + dist2(from, to) * 0.18;
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 24; i++) {
            const u = i / 24;
            const x = (1 - u) * (1 - u) * from[0] + 2 * (1 - u) * u * cx + u * u * to[0];
            const z = (1 - u) * (1 - u) * from[1] + 2 * (1 - u) * u * cz + u * u * to[1];
            const yy = 2 * (1 - u) * u * lift + 0.3;
            pts.push(new THREE.Vector3(x, yy, z));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: '#c4b5fd', transparent: true, opacity: 0.6 });
        return new THREE.Line(geo, mat);
    }, [from, to]);
    return <primitive object={line} />;
}

// En lav, uregelmessig "landmasse" for å gi scenen litt liv (svever mykt).
function Landmass() {
    const grp = useIdleMotion({ bob: 0.05, sway: 0.006, speed: 0.6 });
    const blobs = useMemo(() => {
        const rand = makeRng(77);
        return Array.from({ length: 22 }, () => ({
            x: (rand() - 0.5) * 20,
            z: (rand() - 0.5) * 24,
            s: 1.4 + rand() * 2.6,
        }));
    }, []);
    return (
        <group ref={grp}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <circleGeometry args={[13, 40]} />
                <meshStandardMaterial color="#d7e8cf" roughness={1} />
            </mesh>
            {blobs.map((b, i) => (
                <mesh key={i} position={[b.x, 0.02, b.z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[b.s, 18]} />
                    <meshStandardMaterial color={i % 2 ? '#cfe3c6' : '#dcecd4'} roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// Deterministisk pseudo-random på modulnivå (ingen mutasjon under render).
function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

export default Spredning3D;
