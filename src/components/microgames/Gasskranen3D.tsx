import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ArrowRight, Ship, Wind, Cable } from 'lucide-react';
import { MicroGameScaffold } from './kit/MicroGameScaffold';
import { Hotspot } from './kit/Hotspot';
import { Burst } from './kit/Burst';
import { Particles } from './kit/Particles';
import { GroundPlane, WaterPlane, Fire, Smoke, Banner } from './kit/scene-parts';
import { GlowHalo } from './kit/materials';
import { SceneBanner, SceneBadge, DataReadout, DragHint, WinScreen } from './kit/overlays';
import { ChoiceRow, SceneSlider, type ChoiceItem } from './kit/controls';
import { damp } from './kit/damp';
import { microSfx } from './kit/sound';
import { useOrbitToggle } from './kit/useOrbitToggle';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Lyspære-øyeblikk: gass er bare et våpen så lenge ingen har alternativer.
// Steg 1: eleven sitter i Kreml og vrir på den røde gasskranen. Lys, røyk og
// pengestrøm i tre europeiske byer følger kranen i sanntid - én hånd på ett
// ratt styrer et helt kontinent. Steg 2: rollebytte. Kreml har strupt kranen,
// og eleven bygger Europa fritt med LNG-havn, vindmøller og rør fra Norge.
// Når alternativene står, lyser byene igjen - og kranen har mistet makten.

const PIPE_Y = 0.95;
const TRUNK_Z = 0.6;
const TRUNK_FROM: [number, number, number] = [7.5, PIPE_Y, TRUNK_Z];
const TRUNK_TO: [number, number, number] = [-2.4, PIPE_Y, TRUNK_Z];
const TRUNK_SUPPORT_X = [6.8, 5.6, 3.2, 1.4, -0.6, -2.2];

const CITIES: {
    pos: [number, number, number];
    rot: number;
    branchEnd: [number, number, number];
}[] = [
    { pos: [-6.6, 0, -3.6], rot: 0.5, branchEnd: [-5.8, PIPE_Y, -3.3] },
    { pos: [-7.4, 0, 0.8], rot: 0.05, branchEnd: [-6.5, PIPE_Y, 0.7] },
    { pos: [-5.6, 0, 4.4], rot: -0.4, branchEnd: [-4.9, PIPE_Y, 4.1] },
];

interface BuildSite {
    id: string;
    title: string;
    blurb: string;
    icon: typeof Ship;
    pos: [number, number, number];
}

const SITES: BuildSite[] = [
    {
        id: 'lng',
        title: 'LNG-havn',
        blurb: 'Skip med nedkjølt gass fra hele verden.',
        icon: Ship,
        pos: [-1.4, 0, 6.4],
    },
    {
        id: 'vind',
        title: 'Vindmøller',
        blurb: 'Strøm fra vind, helt uten gass.',
        icon: Wind,
        pos: [0.8, 0, -5.2],
    },
    {
        id: 'norge',
        title: 'Rør fra Norge',
        blurb: 'Gass fra en nabo Europa stoler på.',
        icon: Cable,
        pos: [-8.4, 0, -5.0],
    },
];

const Gasskranen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [flow, setFlow] = useState(100); // % åpen kran (steg 1)
    const [froze, setFroze] = useState(false); // eleven har strupt kranen under 30 %
    const [ready, setReady] = useState(false); // rollebyttet er låst opp
    const [stage, setStage] = useState<1 | 2>(1);
    const [built, setBuilt] = useState<string[]>([]);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([0, 2, 0]);
    const [touched, setTouched] = useState(false);

    const updateFlow = (v: number) => {
        if (stage !== 1 || done) return;
        const next = Math.max(0, Math.min(100, Math.round(v)));
        setFlow(next);
        setTouched(true);
        if (next < 30) setFroze(true);
    };

    // Når eleven har strupt kranen, lander innsikten - og rollebyttet låses opp.
    useEffect(() => {
        if (!froze || ready) return;
        sounds.play('sceneChange');
        const t = window.setTimeout(() => {
            setReady(true);
            sounds.play('advance');
        }, 3000);
        return () => window.clearTimeout(t);
    }, [froze, ready, sounds]);

    const switchSide = () => {
        setStage(2);
        setFlow(0); // Kreml struper kranen selv
        sounds.play('advance');
    };

    const build = (id: string) => {
        if (stage !== 2 || done || built.includes(id)) return;
        const site = SITES.find((s) => s.id === id);
        if (!site) return;
        const nextBuilt = [...built, id];
        setBuilt(nextBuilt);
        setBurstPos([site.pos[0], 1.6, site.pos[2]]);
        setBurst((b) => b + 1);
        if (nextBuilt.length === 3) {
            // Seier: alle tre alternativene står.
            setDone(true);
            sounds.play('complete');
            onComplete({ score: 1, completed: true, artifact: { built: nextBuilt } });
        } else {
            sounds.play('correct');
        }
    };

    const reset = () => {
        setFlow(100);
        setFroze(false);
        setReady(false);
        setStage(1);
        setBuilt([]);
        setDone(false);
        setTouched(false);
    };

    const effectiveFlow = stage === 2 ? 0 : flow;
    const freezing = !done && (stage === 1 ? flow < 35 : built.length === 0);
    const kremlMoney = stage === 1 ? flow : Math.max(0, 90 - built.length * 30);
    const newSources = Math.round((built.length / 3) * 100);
    const lastTitle = SITES.find((s) => s.id === built[built.length - 1])?.title ?? '';

    const banner = done
        ? 'Kranen har mistet makten. Europa lyser uten russisk gass.'
        : stage === 2
        ? built.length === 0
            ? 'Kreml har strupt kranen. Bygg Europa fritt: klikk de tre byggeplassene.'
            : `${lastTitle} er i drift. ${3 - built.length} igjen.`
        : ready
        ? 'Europa lærte. Nå bytter vi side.'
        : flow < 35
        ? 'Europa fryser... protesterer... og betaler.'
        : froze
        ? 'Du så det: hele Europa hang på denne ene kranen.'
        : 'Du sitter i Kreml. Vri på kranen og se hva som skjer med Europa.';

    const choiceItems: ChoiceItem[] = SITES.map((s) => ({
        id: s.id,
        title: s.title,
        blurb: s.blurb,
        icon: s.icon,
        status: built.includes(s.id) ? 'done' : 'active',
    }));

    const sky = freezing ? '#bccadb' : '#cfe0ee';

    return (
        <MicroGameScaffold
            title="Gasskranen: rørene som styrte Europa"
            subtitle="Først sitter du i Kreml med hånden på kranen. Så bytter du side og bygger Europa fritt."
            estimatedSeconds={150}
            onRetry={touched || stage === 2 || done ? reset : undefined}
            scene={
                <GassScene
                    flow={effectiveFlow}
                    stage={stage}
                    built={built}
                    done={done}
                    burst={burst}
                    burstPos={burstPos}
                    onBuild={build}
                    onFlowChange={updateFlow}
                />
            }
            canvas={{
                idle: stage === 1 && !touched && !done,
                camera: { position: [0.6, 7.6, 15.3], fov: 44 },
                background: sky,
                fog: { color: sky, near: 24, far: 48 },
                target: [0, 0.9, 0.3],
                light: 'arctic',
            }}
            containerClassName="bg-gradient-to-b from-[#cfe0ee] via-[#dce8f2] to-[#e9eef4]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={
                            stage === 1
                                ? [
                                      { label: 'Gass til Europa', value: flow, unit: '%' },
                                      { label: 'Penger til Kreml', value: kremlMoney, unit: '%' },
                                  ]
                                : [
                                      { label: 'Gass fra Russland', value: 0, unit: '%' },
                                      { label: 'Nye kilder', value: newSources, unit: '%' },
                                      { label: 'Penger til Kreml', value: kremlMoney, unit: '%' },
                                  ]
                        }
                    />
                    <SceneBadge corner="br">
                        {stage === 1 ? 'Russland 2006' : 'Europa 2022'}
                    </SceneBadge>
                    <DragHint show={stage === 1 && !touched} corner="bc">
                        Dra det røde rattet sidelengs
                    </DragHint>
                </>
            }
        >
            {done ? (
                <WinScreen title="Europa bygde seg fri" onReplay={reset}>
                    Gass er bare et våpen så lenge ingen har alternativer. I 2006 kunne ett håndtak
                    i Kreml slukke lys og varme over hele Europa. I 2022 svarte Europa med
                    LNG-havner, vindkraft og rør fra Norge - og da Europa bygde seg fri, mistet
                    kranen makten.
                </WinScreen>
            ) : stage === 1 ? (
                <div className="flex flex-col gap-2.5">
                    <SceneSlider
                        label="Gasskranen"
                        min={0}
                        max={100}
                        step={5}
                        value={flow}
                        onChange={updateFlow}
                        valueLabel={(v) => `${v} % åpen`}
                    />
                    {ready ? (
                        <button
                            onClick={switchSide}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition"
                        >
                            Bytt side: du er Europa i 2022
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <p className="text-xs text-slate-500">
                            Kranen bestemmer både lyset i Europa og pengene til Kreml. Prøv å strupe
                            den helt.
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <ChoiceRow items={choiceItems} onSelect={build} />
                    <p className="text-xs text-slate-500">
                        Klikk byggeplassene i 3D-vinduet, eller kortene over. Hvert alternativ
                        tenner en tredjedel av lysene igjen.
                    </p>
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function GassScene({
    flow,
    stage,
    built,
    done,
    burst,
    burstPos,
    onBuild,
    onFlowChange,
}: {
    flow: number; // effektiv gasstrøm 0-100 (alltid 0 i steg 2)
    stage: 1 | 2;
    built: string[];
    done: boolean;
    burst: number;
    burstPos: [number, number, number];
    onBuild: (id: string) => void;
    onFlowChange: (v: number) => void;
}) {
    const cityLit = stage === 1 ? flow / 100 : built.length / 3;
    const locked = stage === 2 || done;

    return (
        <group>
            <GroundPlane size={46} depth={36} color="#e7edf3" />
            <WaterPlane position={[-2, 0.015, 9.4]} size={[36, 6]} color="#54819f" />
            <Particles preset="snow" count={80} area={[30, 24]} height={10} />

            <GasField />

            {/* Hovedrøret vestover, med støtter og ventilratt */}
            <PipeSegment from={TRUNK_FROM} to={TRUNK_TO} radius={0.16} />
            {TRUNK_SUPPORT_X.map((x) => (
                <PipeSupport key={x} position={[x, 0, TRUNK_Z]} />
            ))}
            <mesh position={[TRUNK_TO[0], PIPE_Y, TRUNK_Z]} castShadow>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="#7d8892" metalness={0.4} roughness={0.5} />
            </mesh>
            <ValveWheel
                position={[4.6, PIPE_Y, TRUNK_Z]}
                value={flow}
                locked={locked}
                onChange={onFlowChange}
            />

            {/* Gasspuls i hovedrøret og grenrørene */}
            <GasFlow from={TRUNK_FROM} to={TRUNK_TO} strength={flow / 100} seed={3} />
            {CITIES.map((c, i) => (
                <group key={i}>
                    <PipeSegment from={TRUNK_TO} to={c.branchEnd} radius={0.11} />
                    <PipeSupport position={[c.branchEnd[0], 0, c.branchEnd[2]]} />
                    <GasFlow
                        from={TRUNK_TO}
                        to={c.branchEnd}
                        strength={flow / 100}
                        count={6}
                        seed={11 + i}
                        size={0.08}
                    />
                </group>
            ))}

            {/* Tre europeiske byer */}
            {CITIES.map((c, i) => (
                <City key={i} position={c.pos} rot={c.rot} lit={done ? 1 : cityLit} />
            ))}

            {/* Byggeplassene (steg 2) */}
            <Rise position={SITES[0].pos} built={built.includes('lng')}>
                <LngPort />
            </Rise>
            <Rise position={SITES[1].pos} built={built.includes('vind')}>
                <WindFarm on={built.includes('vind')} />
            </Rise>
            <Rise position={SITES[2].pos} built={built.includes('norge')}>
                <NorwayPipe active={built.includes('norge')} />
            </Rise>
            {stage === 2 &&
                !done &&
                SITES.map(
                    (s) =>
                        !built.includes(s.id) && (
                            <Hotspot
                                key={s.id}
                                position={[s.pos[0], 1.6, s.pos[2]]}
                                label={`Bygg: ${s.title}`}
                                onSelect={() => onBuild(s.id)}
                                sound="correct"
                            />
                        )
                )}

            <Burst position={burstPos} trigger={burst} color="#7dd3fc" count={30} spread={3.5} />
        </group>
    );
}

// --- Gassfeltet i øst: plattform, tanker, fakkeltårn med flamme ---
function GasField() {
    return (
        <group>
            <mesh position={[7.4, 0.25, -1.3]} castShadow receiveShadow>
                <boxGeometry args={[3.6, 0.5, 3.4]} />
                <meshStandardMaterial color="#6e7a86" roughness={0.85} />
            </mesh>
            {/* Lagertanker */}
            {[-1.7, -0.7].map((z) => (
                <mesh key={z} position={[6.8, 0.95, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.42, 0.42, 1.5, 12]} />
                    <meshStandardMaterial color="#c9d2da" metalness={0.3} roughness={0.5} />
                </mesh>
            ))}
            {/* Pumpehus */}
            <mesh position={[8.1, 0.95, 0.2]} castShadow>
                <boxGeometry args={[1.4, 0.9, 1.1]} />
                <meshStandardMaterial color="#8b6b52" roughness={0.9} />
            </mesh>
            {/* Fakkeltårn med brennende flamme */}
            <mesh position={[8.2, 1.85, -2.6]} castShadow>
                <cylinderGeometry args={[0.07, 0.12, 3.3, 8]} />
                <meshStandardMaterial color="#8b959f" metalness={0.4} roughness={0.5} />
            </mesh>
            <Fire position={[8.2, 3.4, -2.6]} scale={0.65} lit />
            <group position={[8.2, 3.9, -2.6]}>
                <GlowHalo color="#ffb054" size={0.9} opacity={0.3} />
            </group>
            <Particles
                preset="embers"
                count={12}
                center={[8.2, 3.6, -2.6]}
                area={[0.7, 0.7]}
                height={2.2}
            />
            <Banner position={[9.0, 0, 0.9]} color="#a83232" height={2.2} />
        </group>
    );
}

// --- Rørsegment fra A til B (sylinder orientert langs retningen) ---
function pipeTransform(from: [number, number, number], to: [number, number, number]) {
    const f = new THREE.Vector3(from[0], from[1], from[2]);
    const t = new THREE.Vector3(to[0], to[1], to[2]);
    const dir = t.clone().sub(f);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.normalize()
    );
    const mid = f.add(t).multiplyScalar(0.5);
    return { pos: [mid.x, mid.y, mid.z] as [number, number, number], quat, len };
}

function PipeSegment({
    from,
    to,
    radius = 0.14,
    color = '#a9b3bd',
}: {
    from: [number, number, number];
    to: [number, number, number];
    radius?: number;
    color?: string;
}) {
    const tr = useMemo(() => pipeTransform(from, to), [from, to]);
    return (
        <mesh position={tr.pos} quaternion={tr.quat} castShadow>
            <cylinderGeometry args={[radius, radius, tr.len, 10]} />
            <meshStandardMaterial color={color} metalness={0.45} roughness={0.5} />
        </mesh>
    );
}

function PipeSupport({ position }: { position: [number, number, number] }) {
    return (
        <mesh position={[position[0], PIPE_Y / 2 - 0.08, position[2]]} castShadow>
            <boxGeometry args={[0.13, PIPE_Y - 0.16, 0.13]} />
            <meshStandardMaterial color="#7d8892" roughness={0.7} />
        </mesh>
    );
}

// --- Gasspuls: instanserte lysende kuler som glir langs et rør ---
function makeFlowOffsets(count: number, seed: number): Float32Array {
    let s = (seed * 2654435761) >>> 0;
    const next = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
    const arr = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
        arr[i * 2] = (i + next() * 0.8) / count; // fase langs røret
        arr[i * 2 + 1] = (next() - 0.5) * 0.07; // liten jitter
    }
    return arr;
}

function GasFlow({
    from,
    to,
    strength,
    color = '#ffb054',
    count = 14,
    seed = 1,
    size = 0.11,
    speed = 0.16,
}: {
    from: [number, number, number];
    to: [number, number, number];
    strength: number; // 0-1: tetthet/størrelse på pulsene
    color?: string;
    count?: number;
    seed?: number;
    size?: number;
    speed?: number;
}) {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const offsets = useMemo(() => makeFlowOffsets(count, seed), [count, seed]);
    const smooth = useRef(0);

    useFrame((state, dt) => {
        const m = mesh.current;
        if (!m) return;
        smooth.current = damp(smooth.current, strength, dt, 3);
        const s = smooth.current;
        const t = state.clock.getElapsedTime();
        for (let i = 0; i < count; i++) {
            const u = (offsets[i * 2] + t * speed) % 1;
            dummy.position.set(
                from[0] + (to[0] - from[0]) * u,
                from[1] + (to[1] - from[1]) * u + offsets[i * 2 + 1],
                from[2] + (to[2] - from[2]) * u + offsets[i * 2 + 1]
            );
            dummy.scale.setScalar(Math.max(0.001, size * s));
            dummy.updateMatrix();
            m.setMatrixAt(i, dummy.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1.7}
                toneMapped={false}
            />
        </instancedMesh>
    );
}

// --- Det røde ventilrattet: dra sidelengs for å vri kranen ---
function ValveWheel({
    position,
    value,
    locked,
    onChange,
}: {
    position: [number, number, number];
    value: number; // 0 (stengt) - 100 (åpen)
    locked: boolean;
    onChange: (v: number) => void;
}) {
    const setOrbit = useOrbitToggle();
    const wheel = useRef<THREE.Group>(null);
    const lastX = useRef(0);
    const draggingRef = useRef(false);
    const [hover, setHover] = useState(false);

    useFrame((_, dt) => {
        if (!wheel.current) return;
        const target = (1 - value / 100) * Math.PI * 2.5;
        wheel.current.rotation.y = damp(wheel.current.rotation.y, target, dt, 7);
    });

    const wheelColor = locked ? '#8ba3b5' : hover ? '#e8564a' : '#d23b2f';

    return (
        <group position={position}>
            {/* Stamme fra røret opp til rattet */}
            <mesh position={[0, 0.38, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.76, 8]} />
                <meshStandardMaterial color="#97a2ad" metalness={0.4} roughness={0.5} />
            </mesh>
            <group
                onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                    if (locked) return;
                    e.stopPropagation();
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    lastX.current = e.nativeEvent.clientX;
                    draggingRef.current = true;
                    setOrbit(false);
                    document.body.style.cursor = 'grabbing';
                    microSfx.play('pick');
                }}
                onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                    if (!draggingRef.current) return;
                    e.stopPropagation();
                    const x = e.nativeEvent.clientX;
                    const dx = x - lastX.current;
                    lastX.current = x;
                    if (dx !== 0) onChange(value - dx * 0.45);
                }}
                onPointerUp={(e: ThreeEvent<PointerEvent>) => {
                    if (!draggingRef.current) return;
                    e.stopPropagation();
                    (e.target as Element).releasePointerCapture?.(e.pointerId);
                    draggingRef.current = false;
                    setOrbit(true);
                    document.body.style.cursor = '';
                    microSfx.play('drop');
                }}
                onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                    e.stopPropagation();
                    if (locked) return;
                    setHover(true);
                    if (!draggingRef.current) document.body.style.cursor = 'grab';
                }}
                onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                    e.stopPropagation();
                    setHover(false);
                    if (!draggingRef.current) document.body.style.cursor = '';
                }}
            >
                {/* Romslig usynlig gripeflate (trackpad-trygg) */}
                <mesh position={[0, 0.8, 0]}>
                    <boxGeometry args={[2.1, 1.5, 2.1]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                <group ref={wheel} position={[0, 0.8, 0]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                        <torusGeometry args={[0.58, 0.09, 10, 24]} />
                        <meshStandardMaterial color={wheelColor} metalness={0.3} roughness={0.45} />
                    </mesh>
                    {[0, 1, 2, 3].map((i) => (
                        <mesh key={i} rotation={[0, (i * Math.PI) / 4, 0]} castShadow>
                            <boxGeometry args={[1.12, 0.06, 0.08]} />
                            <meshStandardMaterial
                                color={wheelColor}
                                metalness={0.3}
                                roughness={0.45}
                            />
                        </mesh>
                    ))}
                    <mesh castShadow>
                        <cylinderGeometry args={[0.12, 0.12, 0.18, 10]} />
                        <meshStandardMaterial color="#5b656f" metalness={0.5} roughness={0.4} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

// --- En europeisk by: hus med vinduer som lyser, fabrikk med røyk ---
const WIN_COLD = new THREE.Color('#33506b');
const WIN_WARM = new THREE.Color('#ffb054');

type WinRegister = (m: THREE.MeshStandardMaterial | null) => void;

function City({
    position,
    rot,
    lit,
}: {
    position: [number, number, number];
    rot: number;
    lit: number; // 0-1: hvor mye lys og liv byen har
}) {
    // Vindusmaterialene registreres via callback-refs og dempes i takt i useFrame,
    // så hele byen tennes/slukkes mykt uten re-render per frame.
    const mats = useRef<THREE.MeshStandardMaterial[]>([]);
    const smooth = useRef(0.999);

    const registerWin: WinRegister = (m) => {
        if (m && !mats.current.includes(m)) mats.current.push(m);
    };

    useFrame((_, dt) => {
        smooth.current = damp(smooth.current, lit, dt, 2.5);
        for (const m of mats.current) {
            m.emissive.copy(WIN_COLD).lerp(WIN_WARM, smooth.current);
            m.emissiveIntensity = 0.35 + smooth.current * 1.5;
        }
    });

    return (
        <group position={position} rotation={[0, rot, 0]}>
            <House position={[-0.7, 0, 0.35]} rotY={0.15} registerWin={registerWin} />
            <House
                position={[0.55, 0, -0.45]}
                rotY={-0.25}
                w={0.95}
                h={1.15}
                registerWin={registerWin}
            />
            <House
                position={[0.65, 0, 0.85]}
                rotY={0.05}
                w={0.85}
                h={0.75}
                registerWin={registerWin}
            />
            <Factory
                position={[-0.45, 0, -1.35]}
                rotY={0.1}
                registerWin={registerWin}
                active={lit > 0.35}
            />
        </group>
    );
}

function House({
    position,
    rotY = 0,
    w = 1.1,
    h = 0.9,
    d = 1.0,
    registerWin,
}: {
    position: [number, number, number];
    rotY?: number;
    w?: number;
    h?: number;
    d?: number;
    registerWin: WinRegister;
}) {
    return (
        <group position={position} rotation={[0, rotY, 0]}>
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#7e8994" roughness={0.9} />
            </mesh>
            {/* Snødekt tak */}
            <mesh position={[0, h + 0.26, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[w * 0.82, 0.52, 4]} />
                <meshStandardMaterial color="#e8edf2" roughness={0.95} />
            </mesh>
            {[-w * 0.25, w * 0.25].map((x) => (
                <mesh key={x} position={[x, h * 0.55, d / 2 + 0.015]}>
                    <boxGeometry args={[0.2, 0.24, 0.02]} />
                    <meshStandardMaterial
                        ref={registerWin}
                        color="#16202b"
                        emissive="#33506b"
                        emissiveIntensity={0.4}
                        roughness={0.6}
                    />
                </mesh>
            ))}
        </group>
    );
}

function Factory({
    position,
    rotY = 0,
    registerWin,
    active,
}: {
    position: [number, number, number];
    rotY?: number;
    registerWin: WinRegister;
    active: boolean;
}) {
    return (
        <group position={position} rotation={[0, rotY, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.8, 1.2, 1.2]} />
                <meshStandardMaterial color="#66727e" roughness={0.9} />
            </mesh>
            {[-0.55, 0, 0.55].map((x) => (
                <mesh key={x} position={[x, 0.65, 0.615]}>
                    <boxGeometry args={[0.3, 0.4, 0.02]} />
                    <meshStandardMaterial
                        ref={registerWin}
                        color="#16202b"
                        emissive="#33506b"
                        emissiveIntensity={0.4}
                        roughness={0.6}
                    />
                </mesh>
            ))}
            <mesh position={[0.6, 1.65, -0.3]} castShadow>
                <cylinderGeometry args={[0.13, 0.16, 1.0, 8]} />
                <meshStandardMaterial color="#4a545e" roughness={0.85} />
            </mesh>
            <Smoke origin={[0.6, 2.15, -0.3]} show={active} count={4} color="#9aa4ad" />
        </group>
    );
}

// --- Bygg-animasjon: anlegget reiser seg mykt fra bakken ---
function Rise({
    position,
    built,
    children,
}: {
    position: [number, number, number];
    built: boolean;
    children: React.ReactNode;
}) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!g.current) return;
        const s = damp(g.current.scale.x, built ? 1 : 0.001, dt, 3.5);
        g.current.scale.setScalar(s);
    });
    return (
        <group position={position}>
            <group ref={g} scale={0.001}>
                {children}
            </group>
        </group>
    );
}

// --- LNG-havn: kai og tankskip med kuletanker ---
function LngPort() {
    return (
        <group>
            <mesh position={[0, 0.18, 0.2]} castShadow receiveShadow>
                <boxGeometry args={[2.8, 0.36, 1.4]} />
                <meshStandardMaterial color="#8d9198" roughness={0.9} />
            </mesh>
            {/* Skipet ligger i vannet bak kaia */}
            <group position={[0.2, 0.3, 2.1]}>
                <mesh position={[0, 0.25, 0]} castShadow>
                    <boxGeometry args={[2.6, 0.5, 1.0]} />
                    <meshStandardMaterial color="#31537a" roughness={0.7} />
                </mesh>
                {[-0.75, 0, 0.75].map((x) => (
                    <mesh key={x} position={[x, 0.72, 0]} castShadow>
                        <sphereGeometry args={[0.34, 12, 12]} />
                        <meshStandardMaterial color="#eef2f5" roughness={0.4} />
                    </mesh>
                ))}
                <mesh position={[1.05, 0.75, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.55, 0.6]} />
                    <meshStandardMaterial color="#d8dde2" roughness={0.6} />
                </mesh>
            </group>
            {/* Mottakstank på land */}
            <mesh position={[-1.0, 0.75, -0.4]} castShadow>
                <cylinderGeometry args={[0.42, 0.42, 0.8, 14]} />
                <meshStandardMaterial color="#dfe5ea" roughness={0.5} />
            </mesh>
        </group>
    );
}

// --- Vindpark: tre møller med roterende rotorer ---
function WindFarm({ on }: { on: boolean }) {
    return (
        <group>
            <WindTurbine position={[-0.9, 0, 0]} on={on} phase={0} />
            <WindTurbine position={[0.35, 0, 0.75]} on={on} phase={2.1} />
            <WindTurbine position={[0.95, 0, -0.7]} on={on} phase={4.2} />
        </group>
    );
}

function WindTurbine({
    position,
    on,
    phase,
}: {
    position: [number, number, number];
    on: boolean;
    phase: number;
}) {
    const rotor = useRef<THREE.Group>(null);
    const speed = useRef(0);
    useFrame((_, dt) => {
        speed.current = damp(speed.current, on ? 3.0 : 0, dt, 2);
        if (rotor.current) rotor.current.rotation.z += speed.current * dt;
    });
    return (
        <group position={position}>
            <mesh position={[0, 1.2, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.1, 2.4, 8]} />
                <meshStandardMaterial color="#eef2f5" roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.4, 0.08]} castShadow>
                <boxGeometry args={[0.2, 0.2, 0.35]} />
                <meshStandardMaterial color="#dfe5ea" roughness={0.5} />
            </mesh>
            <group ref={rotor} position={[0, 2.4, 0.28]} rotation={[0, 0, phase]}>
                {[0, 1, 2].map((i) => (
                    <mesh
                        key={i}
                        position={[
                            Math.sin((i * Math.PI * 2) / 3) * 0.45,
                            Math.cos((i * Math.PI * 2) / 3) * 0.45,
                            0,
                        ]}
                        rotation={[0, 0, (-i * Math.PI * 2) / 3]}
                        castShadow
                    >
                        <boxGeometry args={[0.07, 0.9, 0.03]} />
                        <meshStandardMaterial color="#f4f7f9" roughness={0.4} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// --- Rør fra Norge: kommer inn fra nordvest med blå gasspuls ---
const NORGE_FROM: [number, number, number] = [-1.2, PIPE_Y, -3.6];
const NORGE_TO: [number, number, number] = [1.0, PIPE_Y, 3.4];

function NorwayPipe({ active }: { active: boolean }) {
    return (
        <group>
            <PipeSegment from={NORGE_FROM} to={NORGE_TO} radius={0.13} color="#9fb6c6" />
            <PipeSupport position={[-0.5, 0, -1.4]} />
            <PipeSupport position={[0.4, 0, 1.5]} />
            {/* Skilt: hvor gassen kommer fra */}
            <mesh position={[-1.2, 1.55, -3.6]} castShadow>
                <boxGeometry args={[0.9, 0.4, 0.06]} />
                <meshStandardMaterial color="#2f5e8f" roughness={0.6} />
            </mesh>
            <GasFlow
                from={NORGE_FROM}
                to={NORGE_TO}
                strength={active ? 1 : 0}
                color="#7dd3fc"
                count={10}
                seed={23}
                size={0.09}
            />
        </group>
    );
}

export default Gasskranen3D;
