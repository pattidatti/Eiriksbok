import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    WaterPlane,
    Building,
    Person,
    Wall,
    Tower,
    Boat,
    Tree,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    DataReadout,
    DragHint,
    Burst,
    Particles,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til "Trekant-handelen: Det Søte Livets Pris".
//
// Lyspære: trekant-handelen var et lukket kretsløp der skipet ALDRI seilte tomt.
// Hver etappe ga profitt og betalte for den neste, og hele maskinen hvilte på den
// midterste etappen, Midtpassasjen, der mennesker ble behandlet som last. Eleven
// drar skipet rundt de tre hjørnene og kjenner på kroppen at trekanten er et
// kretsløp. Den midterste etappen er bevisst tung: ingen feiring, bare det mørke
// faktumet om hva systemet gjorde med mennesker.
//
// Mekanikk: Draggable (samme grep tre ganger). Eleven drar skipet langs hver etappe
// fra havn til havn. Skipet lastes ulikt for hver etappe, og trekanten tegnes inn
// linje for linje til den er lukket.

// De tre havnene i Atlanterhavet (XZ-planet).
const EUROPA: [number, number, number] = [5, 0, -6];
const AFRIKA: [number, number, number] = [7, 0, 5];
const AMERIKA: [number, number, number] = [-7.5, 0, 1];

const SNAP_RADIUS = 3.4;

interface Leg {
    from: [number, number, number];
    to: [number, number, number];
    cargo: 'goods' | 'people' | 'raw';
    badge: string;
    banner: string;
    fact: string;
    grave: boolean;
}

const LEGS: Leg[] = [
    {
        from: EUROPA,
        to: AFRIKA,
        cargo: 'goods',
        badge: 'Etappe 1: Europa til Afrika',
        banner: 'Dra skipet fra Europa til Vest-Afrika. Lasten er våpen, tøy og brennevin.',
        fact: 'Skipene seilte fra havner som Liverpool og Nantes, fulle av ferdigvarer. I Afrika ble varene byttet bort. Ikke mot gull, men mot mennesker.',
        grave: false,
    },
    {
        from: AFRIKA,
        to: AMERIKA,
        cargo: 'people',
        badge: 'Etappe 2: Midtpassasjen',
        banner: 'Midtpassasjen. Nå frakter skipet mennesker, stuet sammen under dekk.',
        fact: 'Mellom 10 og 15 prosent av dem som ble tvunget om bord, døde under overfarten, av sykdom, tørst eller vold. De som overlevde, ble solgt som eiendom ved ankomst. Dette er det mørkeste kapittelet i hele systemet.',
        grave: true,
    },
    {
        from: AMERIKA,
        to: EUROPA,
        cargo: 'raw',
        badge: 'Etappe 3: Amerika til Europa',
        banner: 'Dra skipet hjem til Europa. Nå er lasten sukker, bomull og tobakk.',
        fact: 'Råvarene som slavene måtte dyrke, ble fraktet tilbake og solgt dyrt i Europa. Pengene bygde fabrikker og banker, og finansierte neste skip. Trekanten var sluttet.',
        grave: false,
    },
];

const Trekanthandelen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    // stage 0..2 = etappe som skal seiles nå. 3 = ferdig (trekanten lukket).
    const [stage, setStage] = useState(0);
    const [banner, setBanner] = useState<string | null>(LEGS[0].banner);
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>(AFRIKA);

    const done = stage >= 3;
    const leg = done ? null : LEGS[stage];

    const reset = () => {
        setStage(0);
        setBanner(LEGS[0].banner);
        setFact(null);
    };

    const handleArrive = () => {
        const current = LEGS[stage];
        setFact(current.fact);
        if (current.grave) {
            // Midtpassasjen: ingen feiring. Bare et alvorlig signal.
            sounds.play('advance');
        } else {
            sounds.play('advance');
            setBurstPos(current.to);
            setBurst((b) => b + 1);
        }
        const next = stage + 1;
        setStage(next);
        if (next >= 3) {
            setBanner(null);
            sounds.play('complete');
            window.setTimeout(() => onComplete({ score: 1, completed: true }), 500);
        } else {
            setBanner(LEGS[next].banner);
        }
    };

    return (
        <MicroGameScaffold
            title="Den dødelige trekanten"
            subtitle="Dra skipet rundt de tre hjørnene, og se hvorfor handelen aldri lot skipet seile tomt"
            estimatedSeconds={170}
            onRetry={stage > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 13, 15], fov: 42 },
                target: [0, 0, 0],
                // Midtpassasjen kjøler ned himmelen til en gråere, tyngre stemning.
                background: leg?.grave ? '#9fb0bb' : '#cfe0ea',
                fog: { near: 30, far: 64 },
                light: leg?.grave ? 'overcast' : 'day',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Trekanten er sluttet' : LEGS[stage].badge}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Etappe', value: `${stage + 1} / 3` },
                                {
                                    label: 'Skipet',
                                    value: leg?.grave ? 'Mennesker' : 'Lastet',
                                },
                            ]}
                        />
                    )}
                    <DragHint show={stage === 0} corner="bc">
                        Dra det brune skipet bort til den lysende ringen
                    </DragHint>
                </>
            }
            scene={
                <TradeScene
                    stage={stage}
                    burst={burst}
                    burstPos={burstPos}
                    onArrive={handleArrive}
                    onPick={() => sounds.play('pick')}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Tre verdensdeler bundet sammen i en trekant:{' '}
                            <span className="font-bold text-slate-700">Europa</span> oppe til høyre,{' '}
                            <span className="font-bold text-amber-800">Vest-Afrika</span> nede til
                            høyre og <span className="font-bold text-emerald-800">Amerika</span> til
                            venstre. Dra skipet langs hver etappe og slipp det ved den lysende ringen.
                        </p>
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen title="Skipet seilte aldri tomt" onReplay={reset}>
                        Hver etappe ga profitt og betalte for den neste: ferdigvarer ble byttet mot
                        mennesker, mennesker ble tvunget til å dyrke sukker og bomull, og råvarene ble
                        solgt dyrt i Europa. Hele dette kretsløpet av penger hvilte på Midtpassasjen,
                        der mennesker ble behandlet som last. Profitten bygde europeisk industri, mens
                        Afrika ble tappet for unge, friske mennesker. Det er prisen bak det søte livet.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function TradeScene({
    stage,
    burst,
    burstPos,
    onArrive,
    onPick,
}: {
    stage: number;
    burst: number;
    burstPos: [number, number, number];
    onArrive: () => void;
    onPick: () => void;
}) {
    const done = stage >= 3;
    const leg = done ? null : LEGS[stage];

    return (
        <group>
            {/* Atlanterhavet */}
            <WaterPlane position={[0, 0, 0]} size={[44, 40]} color="#3f6f90" />

            {/* De tre havnene */}
            <EuropaPort />
            <AfrikaPort />
            <AmerikaPort />

            {/* Etappe-linjene som tegner trekanten, en for hver fullført etappe */}
            <LegLine a={EUROPA} b={AFRIKA} drawn={stage > 0} grave={false} />
            <LegLine a={AFRIKA} b={AMERIKA} drawn={stage > 1} grave={true} />
            <LegLine a={AMERIKA} b={EUROPA} drawn={stage > 2} grave={false} />

            {/* Målring ved neste havn */}
            {leg && <TargetRing position={leg.to} grave={leg.grave} />}

            {/* Skipet eleven drar (remountes per etappe slik at det starter i riktig havn) */}
            {leg && (
                <Draggable
                    key={`leg-${stage}`}
                    position={[leg.from[0], 0.35, leg.from[2]]}
                    bounds={{ minX: -10.5, maxX: 10.5, minZ: -8.5, maxZ: 8 }}
                    snapPoints={[[leg.to[0], leg.to[2]]]}
                    snapRadius={SNAP_RADIUS}
                    liftY={0.3}
                    onDragStart={onPick}
                    onSnap={onArrive}
                    sound={!leg.grave}
                >
                    {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh>
                        <boxGeometry args={[3, 2.4, 3]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <TradeShip cargo={leg.cargo} />
                </Draggable>
            )}

            {/* Skipet i ro hjemme i Europa når trekanten er sluttet */}
            {done && (
                <group position={[EUROPA[0], 0.35, EUROPA[2]]}>
                    <TradeShip cargo="raw" />
                </group>
            )}

            {/* Feiring kun ved varehandel-etappene, aldri ved Midtpassasjen */}
            <Burst position={burstPos} trigger={burst} color="#ffe08a" count={22} spread={2.6} />

            {/* Lett havdis */}
            <Particles preset="motes" />
        </group>
    );
}

// Etappe-linje: en tynn strek over havet mellom to havner, som gløder når etappen
// er seilt. Bygger trekanten visuelt, linje for linje.
function LegLine({
    a,
    b,
    drawn,
    grave,
}: {
    a: [number, number, number];
    b: [number, number, number];
    drawn: boolean;
    grave: boolean;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const { length, position, angle } = useMemo(() => {
        const dx = b[0] - a[0];
        const dz = b[2] - a[2];
        return {
            length: Math.hypot(dx, dz),
            position: [(a[0] + b[0]) / 2, 0.12, (a[2] + b[2]) / 2] as [number, number, number],
            angle: Math.atan2(dx, dz),
        };
    }, [a, b]);

    useFrame((_, dt) => {
        if (mat.current) {
            mat.current.opacity = damp(mat.current.opacity, drawn ? 0.95 : 0.12, dt, 3);
            mat.current.emissiveIntensity = damp(
                mat.current.emissiveIntensity,
                drawn ? 0.7 : 0.0,
                dt,
                3
            );
        }
    });

    const color = grave ? '#7a2222' : '#c98a2a';
    return (
        <mesh position={position} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.18, 0.05, length]} />
            <meshStandardMaterial
                ref={mat}
                color={color}
                emissive={color}
                emissiveIntensity={0}
                transparent
                opacity={0.12}
            />
        </mesh>
    );
}

// Pulserende målring på vannet ved neste havn: viser hvor skipet skal slippes.
function TargetRing({
    position,
    grave,
}: {
    position: [number, number, number];
    grave: boolean;
}) {
    const ring = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        const p = 1 + Math.sin(clock.getElapsedTime() * 2.4) * 0.12;
        if (ring.current) ring.current.scale.set(p, p, p);
        if (mat.current)
            mat.current.emissiveIntensity = 0.6 + Math.sin(clock.getElapsedTime() * 2.4) * 0.3;
    });
    const color = grave ? '#b4452f' : '#ffcf5a';
    return (
        <mesh ref={ring} position={[position[0], 0.07, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.1, 0.16, 10, 36]} />
            <meshStandardMaterial
                ref={mat}
                color={color}
                emissive={color}
                emissiveIntensity={0.6}
                toneMapped={false}
            />
        </mesh>
    );
}

// Selve handelsskipet. Lasten på dekk forteller hvilken etappe det seiler.
function TradeShip({ cargo }: { cargo: 'goods' | 'people' | 'raw' }) {
    const hull = cargo === 'people' ? '#4a3722' : '#6b4a2c';
    const sail = cargo === 'people' ? '#7d7468' : '#efe3c6';
    return (
        <group>
            <Boat position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} color={hull} sail={sail} />
            <group position={[0, 0.45, 0]}>
                {cargo === 'goods' && <GoodsCargo />}
                {cargo === 'people' && <PeopleCargo />}
                {cargo === 'raw' && <RawCargo />}
            </group>
        </group>
    );
}

// Etappe 1: ferdigvarer. Kasser, en tønne brennevin og et gevær.
function GoodsCargo() {
    return (
        <group>
            <mesh position={[0.25, 0.15, 0]} castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#8a6a3a" roughness={0.85} />
            </mesh>
            <mesh position={[-0.25, 0.13, 0.1]} castShadow>
                <cylinderGeometry args={[0.22, 0.22, 0.46, 12]} />
                <meshStandardMaterial color="#7a5230" roughness={0.8} />
            </mesh>
            {/* Gevær-silhuett */}
            <mesh position={[0, 0.45, -0.1]} rotation={[0, 0, -0.5]} castShadow>
                <boxGeometry args={[0.06, 0.7, 0.06]} />
                <meshStandardMaterial color="#3a342c" roughness={0.7} metalness={0.3} />
            </mesh>
        </group>
    );
}

// Etappe 2, Midtpassasjen: mennesker stuet sammen, med en tynn jernlenke. Bevisst
// dempet og alvorlig, ikke gjort til pynt.
function PeopleCargo() {
    const rows: [number, number][] = [
        [-0.3, -0.15],
        [0, -0.15],
        [0.3, -0.15],
        [-0.15, 0.18],
        [0.15, 0.18],
    ];
    return (
        <group>
            {rows.map(([x, z], i) => (
                <Person
                    key={i}
                    position={[x, 0, z]}
                    scale={0.42}
                    pose="sit"
                    body="#4a4038"
                    legs="#3a322c"
                    skin="#5c4632"
                />
            ))}
            {/* Jernlenke over dekket */}
            <mesh position={[0, 0.16, 0]} castShadow>
                <boxGeometry args={[0.86, 0.04, 0.04]} />
                <meshStandardMaterial color="#3b3b40" metalness={0.6} roughness={0.5} />
            </mesh>
        </group>
    );
}

// Etappe 3: råvarene slavene måtte dyrke. Sukkersekker og en bomullsball.
function RawCargo() {
    return (
        <group>
            <mesh position={[0.22, 0.16, 0]} castShadow>
                <boxGeometry args={[0.46, 0.5, 0.5]} />
                <meshStandardMaterial color="#d8c79a" roughness={0.9} />
            </mesh>
            <mesh position={[-0.24, 0.16, 0.05]} castShadow>
                <boxGeometry args={[0.42, 0.46, 0.46]} />
                <meshStandardMaterial color="#cbb786" roughness={0.9} />
            </mesh>
            {/* Bomullsball */}
            <mesh position={[0, 0.45, -0.05]} castShadow>
                <dodecahedronGeometry args={[0.22, 0]} />
                <meshStandardMaterial color="#f2efe6" roughness={1} />
            </mesh>
        </group>
    );
}

// ── Havnene ───────────────────────────────────────────────────────────────────

// Europa: lagerhus og en kai. Utgangspunktet for hele systemet.
function EuropaPort() {
    return (
        <group position={EUROPA}>
            <Quay color="#9c8a6a" />
            <Building position={[0.4, 0, -1]} body="#b08d57" roof="#6b4a2c" w={1.6} h={1.3} d={1.4} seed={2} />
            <Building position={[-1.2, 0, -0.6]} body="#a8814d" roof="#5c3f26" w={1.3} h={1.0} d={1.2} seed={5} />
            <Tree position={[1.7, 0, 0.4]} leaf="#4a6b3a" />
        </group>
    );
}

// Vest-Afrika: et slavefort ved kysten, med mur og tårn.
function AfrikaPort() {
    return (
        <group position={AFRIKA}>
            <Quay color="#b9a072" />
            <Wall position={[0, 0, -1]} length={3} height={1.4} color="#c2a878" crenellations />
            <Tower position={[-1.4, 0, -1]} radius={0.55} height={2} color="#bda06f" roof="#6b4a2c" />
            <Tower position={[1.4, 0, -1]} radius={0.55} height={2} color="#bda06f" roof="#6b4a2c" />
            <Tree position={[2.1, 0, 0.6]} leaf="#3f6b39" />
        </group>
    );
}

// Amerika: plantasje med sukkerrader og et hus.
function AmerikaPort() {
    return (
        <group position={AMERIKA}>
            <Quay color="#8aa06a" />
            <Building position={[0.2, 0, -1.1]} body="#cdbfa0" roof="#7a5230" w={1.5} h={1.1} d={1.3} seed={3} />
            {/* Sukkerrader */}
            {[-1.3, -0.7, -0.1, 0.5, 1.1].map((x, i) => (
                <mesh key={i} position={[x, 0.12, 0.9]} castShadow>
                    <boxGeometry args={[0.16, 0.24, 1.8]} />
                    <meshStandardMaterial color="#7a9a4a" roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// Liten kai/brygge under hver havn.
function Quay({ color }: { color: string }) {
    return (
        <mesh position={[0, 0.04, 0]} receiveShadow>
            <cylinderGeometry args={[2.4, 2.6, 0.2, 18]} />
            <meshStandardMaterial color={color} roughness={1} />
        </mesh>
    );
}

export default Trekanthandelen3D;
