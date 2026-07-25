import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Seascape,
    Boat,
    Building,
    Column,
    Hotspot,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    SceneFact,
    WinScreen,
    CompareToggle,
    StepTracker,
    Burst,
    Particles,
    Impact,
    useShake,
    damp,
    faceAlong,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om Atlantis.
//
// Eleven bygger byen NØYAKTIG slik Platon beskrev den: en borg med Poseidon-
// tempelet i midten, ringer av land og vann vekselvis rundt, broer inn til
// borgen og en kanal ut til havet. Byen blir vakker, detaljert og overbevisende.
//
// Så kommer vendepunktet: eleven vipper bryteren fra «Platons tekst» til «Det
// arkeologene finner» - og hele byen synker og forsvinner. Havet ligger tomt.
// Lyspære-øyeblikket: en fortelling kan være aldri så detaljert og levende, og
// likevel ikke ha ett eneste spor utenfor teksten den kom fra.

const WATER_Y = 0.05;
const GAP = 0.34; // halv åpningsvinkel for kanalen gjennom ringene
const R_INNER = 3.0;
const R_OUTER = 4.9;
const TUBE = 0.34;
const RING_TOP = WATER_Y + 0.1 + TUBE; // = 0.49, oversiden av landringene
const ISLAND_TOP = 0.85;
const SUNK_Y = -3.6; // hvor dypt byen synker (helt under vannflata)

type Mode = 'text' | 'funn';
type Phase = 'build' | 'compare' | 'won';

interface Step {
    label: string;
    hot: [number, number, number];
    banner: string;
}

const STEPS: Step[] = [
    {
        label: 'Bygg borgen med Poseidon-tempelet',
        hot: [0, 1.7, 0],
        banner: 'Midt i byen lå en borg med et tempel for havguden Poseidon.',
    },
    {
        label: 'Legg den indre landringen',
        hot: [-1.77, 1.0, 2.42],
        banner: 'Rundt borgen lå ringer av land og vann, annenhver gang.',
    },
    {
        label: 'Legg den ytre landringen',
        hot: [-2.88, 1.0, 3.96],
        banner: 'Enda en ring av land, og enda en ring med vann utenfor.',
    },
    {
        label: 'Bygg broene inn til borgen',
        hot: [-3.95, 1.0, 0],
        banner: 'Broer bandt ringene sammen, så folk kunne komme inn til borgen.',
    },
    {
        label: 'Åpne kanalen ut til havet',
        hot: [6.9, 0.9, 0],
        banner: 'En kanal gikk fra havet helt inn til borgen. Nå kan skipene seile inn.',
    },
];

const DONE_BANNER = 'Ferdig. Slik beskrev Platon Atlantis - ned til minste ring.';
const SUNK_BANNER = 'Tomt hav. Ingen har funnet spor etter ringbyen noe sted.';

// --- Ring av land med en åpning for kanalen ---
// Samme liggende orientering som kit-FlatRing (rotasjon [PI/2, 0, 0]), men med
// en arc slik at ringen har et gap. Gruppa dreier gapet til å ligge midt på +X,
// der kanalen går ut til havet.
function ArcRing({
    radius,
    tube = TUBE,
    color = '#d3bd93',
    y = WATER_Y + 0.1,
}: {
    radius: number;
    tube?: number;
    color?: string;
    y?: number;
}) {
    return (
        <group rotation={[0, -GAP, 0]}>
            <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <torusGeometry args={[radius, tube, 10, 60, Math.PI * 2 - GAP * 2]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
        </group>
    );
}

// Byggeplanen: bleke ringer som viser hvor byen skal reises. De ligger flatt på
// vannet og forsvinner etter hvert som delen de markerer faktisk blir bygd, så
// eleven alltid ser hva neste grep handler om.
function PlanRing({ radius, tube = 0.07 }: { radius: number; tube?: number }) {
    return (
        <mesh position={[0, WATER_Y + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius, tube, 8, 64]} />
            <meshBasicMaterial color="#f6f2e3" transparent opacity={0.5} />
        </mesh>
    );
}

// Små hus langs en landring. Hopper over sektoren der kanalen skjærer gjennom.
function RingHouses({ radius, count, seed0 }: { radius: number; count: number; seed0: number }) {
    const spots = useMemo(() => {
        const out: { a: number; seed: number }[] = [];
        const span = Math.PI * 2 - GAP * 2.6;
        for (let i = 0; i < count; i++) {
            const a = GAP * 1.3 + (span * (i + 0.5)) / count;
            out.push({ a, seed: seed0 + i });
        }
        return out;
    }, [count, seed0]);
    return (
        <>
            {spots.map(({ a, seed }) => (
                <Building
                    key={seed}
                    position={[Math.cos(a) * radius, RING_TOP - 0.03, Math.sin(a) * radius]}
                    w={0.36}
                    h={0.3}
                    d={0.36}
                    body="#eadfc6"
                    roof="#b5563c"
                    seed={seed}
                />
            ))}
        </>
    );
}

// Poseidon-tempelet på toppen av borgen.
function Temple() {
    const cols: [number, number][] = [
        [-0.42, -0.42],
        [0.42, -0.42],
        [-0.42, 0.42],
        [0.42, 0.42],
    ];
    return (
        <group>
            {/* Tempelgulv */}
            <mesh position={[0, ISLAND_TOP + 0.07, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 0.14, 1.5]} />
                <meshStandardMaterial color="#f0ece0" roughness={0.8} />
            </mesh>
            {cols.map(([x, z]) => (
                <Column
                    key={`${x}:${z}`}
                    position={[x, ISLAND_TOP + 0.14, z]}
                    height={0.86}
                    radius={0.09}
                    color="#f4f1e7"
                />
            ))}
            {/* Takbjelke over søylene */}
            <mesh position={[0, ISLAND_TOP + 1.16, 0]} castShadow>
                <boxGeometry args={[1.66, 0.16, 1.66]} />
                <meshStandardMaterial color="#f0ece0" roughness={0.8} />
            </mesh>
            {/* Saltak (firesidig pyramide) */}
            <mesh position={[0, ISLAND_TOP + 1.47, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[1.2, 0.46, 4]} />
                <meshStandardMaterial color="#c56a4a" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Broene: flate dekk som krysser vannringene, tre steder rundt byen.
function Bridges() {
    const angles = [Math.PI, Math.PI * 0.36, Math.PI * 1.64];
    return (
        <>
            {angles.map((a) => (
                <group key={a} rotation={[0, -a, 0]}>
                    {/* indre spenn: borgen -> indre ring */}
                    <mesh position={[2.12, 0.42, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.3, 0.12, 0.46]} />
                        <meshStandardMaterial color="#cbbda2" roughness={0.9} />
                    </mesh>
                    {/* ytre spenn: indre ring -> ytre ring */}
                    <mesh position={[3.95, 0.42, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.34, 0.12, 0.46]} />
                        <meshStandardMaterial color="#cbbda2" roughness={0.9} />
                    </mesh>
                </group>
            ))}
        </>
    );
}

// Kanalen: to lave kaimurer som leder skipene inn gjennom åpningen i ringene.
function Canal() {
    return (
        <>
            {[-1, 1].map((side) => (
                <mesh
                    key={side}
                    position={[4.5, WATER_Y + 0.14, side * 0.98]}
                    castShadow
                    receiveShadow
                >
                    <boxGeometry args={[4.6, 0.28, 0.22]} />
                    <meshStandardMaterial color="#c6b291" roughness={0.9} />
                </mesh>
            ))}
            <Boat position={[5.4, WATER_Y, 0]} heading={faceAlong([-1, 0])} sail="#f2e9d6" />
        </>
    );
}

function CityScene({
    stage,
    sunk,
    burst,
    splash,
    onPick,
}: {
    stage: number;
    sunk: boolean;
    burst: number;
    splash: number;
    onPick: () => void;
}) {
    const city = useRef<THREE.Group>(null);
    const { ref: quakeRef, shake } = useShake(0.22, 0.035, 1.5);

    // Rist når byen synker - jordskjelvet Platon beskriver.
    useEffect(() => {
        if (sunk) shake(1);
    }, [sunk, shake]);

    useFrame((_, dt) => {
        if (!city.current) return;
        const target = sunk ? SUNK_Y : 0;
        city.current.position.y = damp(city.current.position.y, target, dt, sunk ? 1.6 : 3.2);
    });

    const step = STEPS[stage];

    return (
        <group>
            <Seascape position={[0, 0, 0]} size={[150, 150]} waterY={WATER_Y} color="#2f7fa6">
                <group ref={quakeRef}>
                    <group ref={city}>
                        {/* Byggeplanen - vises for delene som ennå ikke er reist */}
                        {!sunk && stage < 1 && <PlanRing radius={1.62} tube={0.09} />}
                        {!sunk && stage < 2 && <PlanRing radius={R_INNER} />}
                        {!sunk && stage < 3 && <PlanRing radius={R_OUTER} />}
                        {stage >= 1 && (
                            <group>
                                {/* Borgøya: stiger opp av havet */}
                                <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                                    <cylinderGeometry args={[1.55, 1.72, 1.1, 40]} />
                                    <meshStandardMaterial color="#bda98a" roughness={0.95} />
                                </mesh>
                                <Temple />
                            </group>
                        )}
                        {stage >= 2 && (
                            <group>
                                <ArcRing radius={R_INNER} />
                                <RingHouses radius={R_INNER} count={7} seed0={11} />
                            </group>
                        )}
                        {stage >= 3 && (
                            <group>
                                <ArcRing radius={R_OUTER} />
                                <RingHouses radius={R_OUTER} count={11} seed0={31} />
                            </group>
                        )}
                        {stage >= 4 && <Bridges />}
                        {stage >= 5 && <Canal />}
                    </group>
                </group>
            </Seascape>

            {/* Neste byggetrinn - ett stort, tydelig mål om gangen */}
            {step && !sunk && (
                <Hotspot position={step.hot} onSelect={onPick} radius={0.62} label={step.label} />
            )}

            <Burst position={[0, 2.4, 0]} trigger={burst} color="#fde68a" spread={4} count={34} />
            <Impact preset="splash" trigger={splash} position={[0, WATER_Y, 0]} />
            <Particles preset="motes" area={[16, 16]} center={[0, 1.6, 0]} height={4} count={26} />
        </group>
    );
}

const AtlantisRingbyen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState(0);
    const [mode, setMode] = useState<Mode>('text');
    const [phase, setPhase] = useState<Phase>('build');
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [splash, setSplash] = useState(0);
    const [touched, setTouched] = useState(false);
    const doneRef = useRef(false);

    const built = stage >= STEPS.length;
    const sunk = mode === 'funn';

    const reset = () => {
        setStage(0);
        setMode('text');
        setPhase('build');
        setBanner(null);
        setTouched(false);
        doneRef.current = false;
    };

    const handlePick = () => {
        setTouched(true);
        const next = stage + 1;
        setStage(next);
        setBanner(STEPS[stage].banner);
        if (next >= STEPS.length) {
            setBanner(DONE_BANNER);
            setBurst((b) => b + 1);
            setPhase('compare');
            sounds.play('complete');
        } else {
            sounds.play('advance');
        }
    };

    const handleMode = (v: 'a' | 'b') => {
        const next: Mode = v === 'a' ? 'text' : 'funn';
        if (next === mode) return;
        setMode(next);
        setTouched(true);
        if (next === 'funn') {
            setBanner(SUNK_BANNER);
            setSplash((s) => s + 1);
            sounds.play('sceneChange');
            if (!doneRef.current) {
                doneRef.current = true;
                setPhase('won');
                onComplete({ score: 1, completed: true, artifact: { built: true } });
            }
        } else {
            setBanner(DONE_BANNER);
            sounds.play('select');
        }
    };

    const readout: { label: string; value: string | number }[] = sunk
        ? [
              { label: 'Funn av ringbyen', value: 0 },
              { label: 'Kilder utenom Platon', value: 0 },
          ]
        : [{ label: 'Deler bygd', value: `${stage}/${STEPS.length}` }];

    return (
        <MicroGameScaffold
            title="Bygg Platons Atlantis"
            subtitle="Reis ringbyen slik teksten beskriver den - og se hva arkeologene finner igjen av den"
            estimatedSeconds={150}
            onRetry={touched ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#bfe0f2] via-[#d9e9f2] to-[#e9ddc4]"
            canvas={{
                idle: !touched,
                autoRotateSpeed: 0.3,
                camera: { position: [11, 9.2, 14], fov: 40 },
                background: '#bfe0f2',
                fog: { color: '#bfe0f2', near: 34, far: 96 },
                target: [0, 0.7, 0],
                maxPolarAngle: Math.PI / 2.15,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout corner="bl" items={readout} />
                    <SceneBadge corner="br">
                        {sunk ? 'Det arkeologene finner' : 'Platons tekst'}
                    </SceneBadge>
                    <DragHint show={!touched} corner="bc">
                        Klikk den gule markøren: bygg borgen i midten
                    </DragHint>
                </>
            }
            scene={
                <CityScene
                    stage={stage}
                    sunk={sunk}
                    burst={burst}
                    splash={splash}
                    onPick={handlePick}
                />
            }
        >
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <StepTracker current={stage} total={STEPS.length} />
                    {built && (
                        <CompareToggle
                            labelA="Platons tekst"
                            labelB="Det arkeologene finner"
                            value={sunk ? 'b' : 'a'}
                            onChange={handleMode}
                        />
                    )}
                </div>

                {phase === 'build' && (
                    <SceneFact>
                        Platon beskrev Atlantis i detalj: en borg i midten, ringer av land og vann
                        rundt, broer og en kanal ut til havet. Bygg den ferdig, så prøver vi
                        beskrivelsen mot virkeligheten.
                    </SceneFact>
                )}

                {phase === 'compare' && (
                    <SceneFact>
                        Byen står ferdig. Vipp bryteren over til «Det arkeologene finner», og se hva
                        som blir igjen.
                    </SceneFact>
                )}

                {phase === 'won' && (
                    <WinScreen title="Havet ligger tomt" onReplay={reset}>
                        Du bygde en by med borg, ringer, broer og kanal - alt sammen ned til minste
                        detalj. Likevel finnes det ingen vitenskapelige bevis for at Atlantis har
                        eksistert. En fortelling kan være aldri så detaljert og likevel ikke ha ett
                        eneste spor utenfor teksten den kom fra.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

export default AtlantisRingbyen3D;
