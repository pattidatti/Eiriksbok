import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    WaterPlane,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    StepTracker,
    DataReadout,
    damp,
    Burst,
    useShake,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Oppdagelsesreiser i Vesterled". Et stilisert kart
// over Nord-Atlanteren sett ovenfra. Eleven drar et langskip vestover, hav for
// hav, fra Norge til Island, videre til Grønland og til slutt til Vinland i
// Amerika. Hver gang skipet når en ny kyst, våkner bosettingen til liv: hus
// reiser seg, sauer og vinranker dukker opp, og året teller framover.
//
// Lyspæra (rett fra artikkelen): vikingene nådde Amerika rundt 500 år før
// Columbus ved å hoppe fra øy til øy. Hver landingsplass de bosatte ble basen
// for neste sprang vestover. Vinland ble oppgitt nettopp fordi det lå for langt
// unna til at de kunne sende forsterkninger.
//
// Mekanikk (naviger over åpent hav): dra langskipet fra forrige kyst og helt
// fram til den lysende neste kysten. Slipper du for tidlig, driver skipet tilbake
// og du må prøve på nytt. En knapp under vinduet seiler også skipet fram for
// dem som heller vil klikke. Slik kjenner eleven på kroppen at hvert hav måtte
// krysses for seg, og at landet i vest lå stadig lenger unna hjelp.

interface Land {
    name: string;
    label: string;
    year: string;
    x: number;
    z: number;
    kind: 'home' | 'thing' | 'farm' | 'camp';
}

// Landene i historisk rekkefølge, lagt vestover (synkende x) over Nord-Atlanteren.
// Norge ligger øst (start), Vinland lengst vest (Newfoundland).
const LANDS: Land[] = [
    { name: 'Norge', label: 'Norge', year: '', x: 9.2, z: 0.6, kind: 'home' },
    { name: 'Island', label: 'Island', year: '870', x: 2.6, z: -1.6, kind: 'thing' },
    { name: 'Gronland', label: 'Grønland', year: '985', x: -3.8, z: -2.6, kind: 'farm' },
    { name: 'Vinland', label: 'Vinland', year: '1000', x: -9.0, z: 1.0, kind: 'camp' },
];
const TOTAL_LEGS = LANDS.length - 1;
const ARRIVE_RADIUS = 2.7;

// Kort fakta for en 14-åring, ett per ny kyst eleven når.
const FACTS = [
    'Rundt år 870 seilte misfornøyde høvdinger til Island. Der bygde de et samfunn uten konge, med Alltinget som ramme.',
    'Eirik Raude ble lyst fredløs og fant en stor øy i vest. Han kalte den Grønland for å lokke flere bosettere. Nå var Grønland basen for neste sprang.',
];

function distXZ(ax: number, az: number, bx: number, bz: number) {
    return Math.hypot(ax - bx, az - bz);
}

const Vesterleden3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const ambience = useAmbience('waves');
    // Hvor mange kyster er bosatt. Norge (index 0) er bosatt fra start.
    const [settled, setSettled] = useState(1);
    // Tvinger Draggable til å remounte tilbake til forrige kyst når et forsøk
    // bommer (skipet slippes for langt fra land).
    const [resetNonce, setResetNonce] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Seil vestover. Dra langskipet over havet og heilt fram til den lysende kysten.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([
        LANDS[0].x,
        0.7,
        LANDS[0].z,
    ]);

    const done = settled >= LANDS.length;
    const fromLand = LANDS[Math.min(settled - 1, LANDS.length - 1)];
    const targetLand = done ? null : LANDS[settled];
    const latest = LANDS[settled - 1];

    const startAmbience = () => {
        void ambience.start();
    };

    const arrive = () => {
        if (done) return;
        const reached = LANDS[settled];
        setBurstPos([reached.x, 0.7, reached.z]);
        setBurst((b) => b + 1);
        const next = settled + 1;
        setSettled(next);
        if (next >= LANDS.length) {
            sounds.play('complete');
            setBanner(null);
            setFact(null);
        } else {
            sounds.play('advance');
            setBanner('Bra! Du nådde land. Dra skipet videre til neste lysende kyst.');
            setFact(FACTS[Math.min(settled - 1, FACTS.length - 1)]);
        }
    };

    // Eleven slapp skipet. Nådde det fram til neste kyst?
    const handleDrop = (pos: THREE.Vector3) => {
        if (done || !targetLand) return;
        const d = distXZ(pos.x, pos.z, targetLand.x, targetLand.z);
        if (d <= ARRIVE_RADIUS) {
            arrive();
        } else {
            sounds.play('incorrect');
            setBanner('Du nådde ikke land. Dra langskipet heilt fram til den lysende kysten.');
            setResetNonce((n) => n + 1);
        }
    };

    const reset = () => {
        setSettled(1);
        setResetNonce((n) => n + 1);
        setBanner('Seil vestover. Dra langskipet over havet og heilt fram til den lysende kysten.');
        setFact(null);
        setBurstPos([LANDS[0].x, 0.7, LANDS[0].z]);
    };

    useEffect(() => {
        if (!done) return;
        const t = setTimeout(() => onComplete({ score: 1, completed: true }), 400);
        return () => clearTimeout(t);
    }, [done, onComplete]);

    const idle = settled <= 1;

    return (
        <MicroGameScaffold
            title="Vesterleden: fra øy til øy mot Amerika"
            subtitle="Dra langskipet vestover over Nord-Atlanteren. Hver ny kyst blir basen for neste sprang."
            estimatedSeconds={140}
            onRetry={settled > 1 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 18, 12.5], fov: 40 },
                background: '#cfe6f2',
                fog: { near: 34, far: 70 },
                target: [0, 0, -0.4],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Vinland 1000' : latest.year ? `År ${latest.year}` : 'Norge'}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                {
                                    label: 'Seilt',
                                    value: `${settled - 1} / ${TOTAL_LEGS}`,
                                    unit: 'hav',
                                },
                                { label: 'Neste kyst', value: targetLand?.label ?? '-' },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Dra langskipet fram til den lysende kysten
                    </DragHint>
                </>
            }
            scene={
                <Sea
                    settled={settled}
                    fromLand={fromLand}
                    targetLand={targetLand}
                    resetNonce={resetNonce}
                    burst={burst}
                    burstPos={burstPos}
                    onDrop={handleDrop}
                    onGrab={startAmbience}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done && <StepTracker current={settled - 1} total={TOTAL_LEGS} />}

                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Ta tak i{' '}
                            <span className="font-bold text-amber-700">langskipet</span> og dra det
                            over det åpne havet fram til den lysende kysten i vest. Når du når
                            land, reiser bosettingen seg, og du kan seile videre derfra. Du kan
                            også trykke knappen for å la skipet seile selv.
                        </p>
                        {targetLand && (
                            <button
                                onClick={() => {
                                    startAmbience();
                                    arrive();
                                }}
                                className="self-start inline-flex items-center gap-2 rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-200 hover:border-amber-500"
                            >
                                Sett seil mot {targetLand.label}
                                {targetLand.year ? ` (${targetLand.year})` : ''}
                            </button>
                        )}
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen title="Du nådde Vinland rundt år 1000, nesten 500 år før Columbus." onReplay={reset}>
                        Vikingene krysset Atlanteren ved å hoppe fra øy til øy. Hver kyst de bosatte
                        ble basen for neste sprang vestover: Island, så Grønland, så Vinland. Men
                        Vinland lå for langt unna til at de kunne sende nok folk og forsterkninger,
                        og bosettingen ble oppgitt etter bare noen år.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-HAVET
// ============================================================

function Sea({
    settled,
    fromLand,
    targetLand,
    resetNonce,
    burst,
    burstPos,
    onDrop,
    onGrab,
}: {
    settled: number;
    fromLand: Land;
    targetLand: Land | null;
    resetNonce: number;
    burst: number;
    burstPos: [number, number, number];
    onDrop: (pos: THREE.Vector3) => void;
    onGrab: () => void;
}) {
    const { ref: shakeRef, shake } = useShake(0.16, 0.025, 2.4);
    const prevSettled = useRef(settled);
    useEffect(() => {
        if (settled > prevSettled.current) shake(0.45);
        prevSettled.current = settled;
    }, [settled, shake]);

    return (
        <group ref={shakeRef}>
            {/* Det aapne havet */}
            <WaterPlane position={[0, 0, -0.4]} size={[46, 38]} color="#2f6f97" />

            {/* Allerede seilte ledd (gull) og det planlagte leddet (stiplet lys) */}
            {LANDS.slice(0, -1).map((a, i) => (
                <RouteLeg
                    key={i}
                    a={a}
                    b={LANDS[i + 1]}
                    sailed={settled > i + 1}
                    planned={targetLand !== null && settled === i + 1}
                />
            ))}

            {/* Landene */}
            {LANDS.map((land, i) => (
                <LandMass key={land.name} land={land} settled={i < settled} />
            ))}

            {/* Lysende maalkyst */}
            {targetLand && <TargetGlow position={[targetLand.x, 0.5, targetLand.z]} />}

            {/* Langskipet eleven drar. Remounter til forrige kyst ved nytt steg
                eller bommet forsøk (key bytter), så det alltid starter ved land. */}
            {targetLand && (
                <Draggable
                    key={`leg-${settled}-${resetNonce}`}
                    position={[fromLand.x, 0, fromLand.z]}
                    bounds={{ minX: -11, maxX: 10.5, minZ: -6, maxZ: 6 }}
                    liftY={0.18}
                    onDragStart={onGrab}
                    onDrop={onDrop}
                >
                    {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[3.2, 1.6, 3.2]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <Longship />
                </Draggable>
            )}

            {/* Skvulp-burst når en kyst nås */}
            <Burst position={burstPos} trigger={burst} color="#dbeafe" count={22} spread={1.9} />
        </group>
    );
}

// Et langskip pekende vestover (mot -x). Skrog, stripet seil på mast, dragehode
// i baugen. Vugger lett på bølgene.
function Longship() {
    const hull = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!hull.current) return;
        const t = clock.getElapsedTime();
        hull.current.rotation.z = Math.sin(t * 1.6) * 0.05;
        hull.current.position.y = Math.sin(t * 1.3) * 0.05;
    });
    return (
        // Baugen peker mot vest (-x): roter skipet 90 grader om y.
        <group rotation={[0, Math.PI / 2, 0]}>
            <group ref={hull}>
                {/* Skrog */}
                <mesh position={[0, 0.22, 0]} castShadow>
                    <boxGeometry args={[0.7, 0.32, 2.1]} />
                    <meshStandardMaterial color="#6b4a2b" roughness={0.85} />
                </mesh>
                {/* Spiss baug og akterstavn */}
                <mesh position={[0, 0.3, 1.15]} rotation={[0.5, 0, 0]} castShadow>
                    <coneGeometry args={[0.22, 0.7, 4]} />
                    <meshStandardMaterial color="#5c3f26" roughness={0.85} />
                </mesh>
                <mesh position={[0, 0.34, -1.1]} rotation={[-0.6, 0, 0]} castShadow>
                    <coneGeometry args={[0.2, 0.6, 4]} />
                    <meshStandardMaterial color="#5c3f26" roughness={0.85} />
                </mesh>
                {/* Dragehode i baugen */}
                <mesh position={[0, 0.62, 1.32]} castShadow>
                    <sphereGeometry args={[0.13, 8, 8]} />
                    <meshStandardMaterial color="#caa64a" roughness={0.6} metalness={0.2} />
                </mesh>
                {/* Skjold langs ripa */}
                {[-0.7, -0.25, 0.25, 0.7].map((z, i) => (
                    <mesh key={i} position={[0.37, 0.28, z]} castShadow>
                        <cylinderGeometry args={[0.13, 0.13, 0.05, 12]} />
                        <meshStandardMaterial color={i % 2 ? '#b23b2e' : '#e8dcc0'} roughness={0.8} />
                    </mesh>
                ))}
                {/* Mast + råseil */}
                <mesh position={[0, 0.8, 0]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
                    <meshStandardMaterial color="#4a3520" roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.05, 0]} castShadow>
                    <boxGeometry args={[0.04, 0.7, 0.9]} />
                    <meshStandardMaterial color="#e8dcc0" roughness={0.9} side={THREE.DoubleSide} />
                </mesh>
                {/* Røde striper på seilet */}
                {[-0.22, 0.22].map((z, i) => (
                    <mesh key={i} position={[0.025, 1.05, z]}>
                        <boxGeometry args={[0.02, 0.7, 0.18]} />
                        <meshStandardMaterial color="#b23b2e" roughness={0.9} side={THREE.DoubleSide} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// En lysende ring som markerer neste kyst eleven skal nå.
function TargetGlow({ position }: { position: [number, number, number] }) {
    const ring = useRef<THREE.Mesh>(null);
    const beam = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (ring.current) ring.current.scale.setScalar(1 + Math.sin(t * 3) * 0.14);
        if (beam.current) {
            const m = beam.current.material as THREE.MeshBasicMaterial;
            m.opacity = 0.22 + Math.sin(t * 3) * 0.08;
        }
    });
    return (
        <group position={position}>
            <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2.3, 0.16, 12, 40]} />
                <meshStandardMaterial
                    color="#10b981"
                    emissive="#10b981"
                    emissiveIntensity={0.7}
                    roughness={0.4}
                />
            </mesh>
            <mesh ref={beam} position={[0, 2.4, 0]}>
                <cylinderGeometry args={[0.5, 1.4, 4.8, 18, 1, true]} />
                <meshBasicMaterial
                    color="#34d399"
                    transparent
                    opacity={0.22}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    );
}

// Et ledd av seilruta mellom to land. Seilte ledd lyser i gull. Det planlagte
// neste leddet vises som en svak, stiplet lei som peker eleven i riktig retning.
const ROUTE_GOLD = new THREE.Color('#e3c069');
const ROUTE_DIM = new THREE.Color('#9fb6c9');
function RouteLeg({
    a,
    b,
    sailed,
    planned,
}: {
    a: Land;
    b: Land;
    sailed: boolean;
    planned: boolean;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    useFrame((_, dt) => {
        if (!mat.current) return;
        mat.current.color.lerp(sailed ? ROUTE_GOLD : ROUTE_DIM, Math.min(1, dt * 3));
        mat.current.opacity = damp(
            mat.current.opacity,
            sailed ? 0.95 : planned ? 0.5 : 0,
            dt,
            3
        );
    });
    return (
        <mesh position={[(a.x + b.x) / 2, 0.16, (a.z + b.z) / 2]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.12, 0.04, len]} />
            <meshStandardMaterial
                ref={mat}
                color="#9fb6c9"
                emissive="#e3c069"
                emissiveIntensity={0.3}
                transparent
                opacity={0}
                roughness={0.6}
            />
        </mesh>
    );
}

// Et land på kartet. Selve kysten er alltid synlig (lavpoly øyflekker). Når
// kysten bosettes, vokser bosettingen fram: hus, og innhold tilpasset stedet
// (Alltinget på Island, sauer på Grønland, vinranker på Vinland).
function LandMass({ land, settled }: { land: Land; settled: boolean }) {
    const grow = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grow.current) return;
        const s = damp(grow.current.scale.x, settled ? 1 : 0, dt, 4);
        grow.current.scale.setScalar(s);
    });

    // Faste øyflekker per land (deterministisk, ingen RNG i render).
    const blobs = useMemo(() => landBlobs(land.kind), [land.kind]);

    return (
        <group position={[land.x, 0, land.z]}>
            {/* Kysten */}
            {blobs.map((b, i) => (
                <mesh
                    key={i}
                    position={[b.x, 0.17, b.z]}
                    rotation={[0, (b.x + b.z) * 0.7, 0]}
                    castShadow
                    receiveShadow
                >
                    <cylinderGeometry args={[b.r * 0.9, b.r, 0.34, b.s]} />
                    <meshStandardMaterial color={b.c} roughness={1} flatShading />
                </mesh>
            ))}

            {/* Bosettingen som vokser fram */}
            <group ref={grow} position={[0, 0.34, 0]} scale={[settled ? 1 : 0, settled ? 1 : 0, settled ? 1 : 0]}>
                <Settlement kind={land.kind} />
            </group>

            {/* Stedsnavn (og år når bosatt) */}
            <Html position={[0, 2.0, 0]} center pointerEvents="none">
                <div className="px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[11px] font-bold whitespace-nowrap shadow">
                    {land.label}
                    {settled && land.year && <span className="text-amber-300 ml-1">{land.year}</span>}
                </div>
            </Html>
        </group>
    );
}

interface Blob {
    x: number;
    z: number;
    r: number;
    s: number;
    c: string;
}
// Land-paletter: grønn norsk kyst, brun-grønn Island, hvit-isete Grønland,
// frodig grønn Vinland.
function landBlobs(kind: Land['kind']): Blob[] {
    switch (kind) {
        case 'home':
            return [
                { x: 0.6, z: 0, r: 2.0, s: 8, c: '#5f8a44' },
                { x: -0.8, z: -0.6, r: 1.5, s: 7, c: '#557f3e' },
                { x: 0.2, z: 1.2, r: 1.2, s: 7, c: '#5f8a44' },
            ];
        case 'thing':
            return [
                { x: 0, z: 0, r: 1.7, s: 8, c: '#6f8f52' },
                { x: 1.0, z: 0.5, r: 1.1, s: 7, c: '#7d8a5a' },
                { x: -0.9, z: -0.4, r: 1.0, s: 7, c: '#6f8f52' },
            ];
        case 'farm':
            return [
                { x: 0, z: 0, r: 1.9, s: 8, c: '#cdd9de' },
                { x: 1.1, z: -0.4, r: 1.2, s: 7, c: '#b8c7cd' },
                { x: -1.0, z: 0.6, r: 1.1, s: 7, c: '#cdd9de' },
            ];
        case 'camp':
            return [
                { x: 0, z: 0, r: 1.8, s: 8, c: '#4f8a3f' },
                { x: 1.1, z: 0.6, r: 1.2, s: 7, c: '#5c9647' },
                { x: -0.9, z: -0.5, r: 1.0, s: 7, c: '#4f8a3f' },
            ];
    }
}

// Liten lavpoly-bygd, ulik per land. Holder polygonbudsjettet lavt.
function Settlement({ kind }: { kind: Land['kind'] }) {
    return (
        <group>
            {/* Felles: ett eller to torvhus */}
            <Hut x={-0.4} z={0.1} />
            {kind !== 'camp' && <Hut x={0.5} z={-0.2} small />}

            {kind === 'home' && <Banner3D x={0.1} z={0.7} />}

            {kind === 'thing' && (
                // Alltinget: en ring av stående steiner.
                <group>
                    {Array.from({ length: 6 }).map((_, i) => {
                        const a = (i / 6) * Math.PI * 2;
                        return (
                            <mesh
                                key={i}
                                position={[Math.cos(a) * 0.85, 0.22, 0.9 + Math.sin(a) * 0.6]}
                                castShadow
                            >
                                <boxGeometry args={[0.14, 0.44, 0.1]} />
                                <meshStandardMaterial color="#9aa0a6" roughness={1} flatShading />
                            </mesh>
                        );
                    })}
                </group>
            )}

            {kind === 'farm' &&
                // Sauer på beite.
                [
                    [0.3, 0.7],
                    [0.7, 0.4],
                    [-0.2, 0.8],
                ].map(([x, z], i) => <Sheep key={i} x={x} z={z} />)}

            {kind === 'camp' &&
                // Viltvoksende vinranker (derav navnet Vinland).
                [
                    [0.4, 0.6],
                    [0.7, 0.1],
                    [-0.3, 0.7],
                    [0.1, 0.9],
                ].map(([x, z], i) => <Vine key={i} x={x} z={z} />)}
        </group>
    );
}

function Hut({ x, z, small = false }: { x: number; z: number; small?: boolean }) {
    const w = small ? 0.5 : 0.66;
    const h = small ? 0.34 : 0.42;
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]} castShadow>
                <boxGeometry args={[w, h, w * 0.85]} />
                <meshStandardMaterial color="#caa06b" roughness={0.85} />
            </mesh>
            <mesh position={[0, h + 0.14, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[w * 0.72, 0.3, 4]} />
                <meshStandardMaterial color="#6e4a2c" roughness={0.9} />
            </mesh>
        </group>
    );
}

function Banner3D({ x, z }: { x: number; z: number }) {
    const cloth = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (cloth.current) cloth.current.rotation.y = Math.sin(clock.getElapsedTime() * 2) * 0.16;
    });
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 0.45, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
                <meshStandardMaterial color="#5c3f26" roughness={0.9} />
            </mesh>
            <mesh ref={cloth} position={[0.2, 0.7, 0]} castShadow>
                <planeGeometry args={[0.4, 0.28]} />
                <meshStandardMaterial color="#b23b2e" roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function Sheep({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 0.14, 0]} castShadow>
                <sphereGeometry args={[0.13, 8, 8]} />
                <meshStandardMaterial color="#eef0ef" roughness={1} />
            </mesh>
            <mesh position={[0.11, 0.16, 0]} castShadow>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#3a3a3a" roughness={1} />
            </mesh>
        </group>
    );
}

function Vine({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 0.18, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.05, 0.36, 5]} />
                <meshStandardMaterial color="#6b4a2b" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.42, 0]} castShadow>
                <sphereGeometry args={[0.16, 8, 8]} />
                <meshStandardMaterial color="#3f7a34" roughness={0.9} />
            </mesh>
            <mesh position={[0.08, 0.34, 0.05]} castShadow>
                <sphereGeometry args={[0.05, 6, 6]} />
                <meshStandardMaterial color="#6b2d6b" roughness={0.8} />
            </mesh>
        </group>
    );
}

export default Vesterleden3D;
