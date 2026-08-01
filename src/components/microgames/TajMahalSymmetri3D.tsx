import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MicroGameProps } from './types';
import {
    MicroGameScaffold,
    Draggable,
    Hotspot,
    CompareToggle,
    StepTracker,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    Burst,
    GroundPlane,
    WaterMaterial,
    Tree,
    damp,
    microSfx,
} from './kit';

// Lyspære-øyeblikk: Taj Mahal er bygd rundt en usynlig midtakse. Eleven får bare
// lov til å bygge VENSTRE side. Alt hen setter ned der, spretter opp speilvendt på
// høyre side. Da kjenner eleven på kroppen at mogulenes byggekunst ikke er pynt,
// men en lov: hver del må ha sin tvilling.

const MARBLE = '#f4f1ea';
const MARBLE_SHADE = '#ded8cc';
const SANDSTONE = '#b4553f';
const GOLD = '#d8ae4a';
const GARDEN = '#6f8c4a';
const WATER = '#79aab8';
const PATH = '#cbbf9e';

interface Piece {
    id: string;
    label: string;
    hint: string;
    // Målet på VENSTRE side. Tvillingen bygges automatisk på -x.
    target: [number, number];
    fact: string;
}

const PIECES: Piece[] = [
    {
        id: 'minaret-front',
        label: 'Minaret mot hagen',
        hint: 'Dra minareten ut til hjørnet nærmest hagen.',
        target: [-5, 2.6],
        fact: 'De fire minaretene står i hvert sitt hjørne, like langt fra midten.',
    },
    {
        id: 'minaret-bak',
        label: 'Minaret mot elva',
        hint: 'Dra den andre minareten til hjørnet mot elva.',
        target: [-5, -4.2],
        fact: 'Minaretene heller litt utover. Faller de, faller de bort fra gravkammeret.',
    },
    {
        id: 'sidebygg',
        label: 'Sidebygningen',
        hint: 'Dra sandsteinsbygget ut til siden av marmorplassen.',
        target: [-8.6, -1],
        fact: 'På den ene siden ligger moskeen. På den andre står et helt likt bygg som ingen ber i. Det står der bare for at bildet skal bli likt.',
    },
    {
        id: 'hagekvadrant',
        label: 'Hagefeltet',
        hint: 'Dra hagefeltet ned i hagen, ved siden av vannrenna.',
        target: [-3.6, 6.2],
        fact: 'Hagen er delt i fire like store felt av vannrenner. En slik firdelt hage kalles charbagh.',
    },
];

const STAGING: [number, number, number] = [-7.5, 0, 9];
const SNAP_RADIUS = 2.6;

// Mykt oppsprett: skalerer fra null til full størrelse når delen er satt ned.
function RiseIn({ show, children }: { show: boolean; children: React.ReactNode }) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!g.current) return;
        const t = damp(g.current.scale.x, show ? 1 : 0.001, dt, 6);
        g.current.scale.setScalar(t);
        g.current.visible = t > 0.02;
    });
    return (
        <group ref={g} scale={0.001}>
            {children}
        </group>
    );
}

function Minaret() {
    return (
        <group>
            <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.15, 0.36, 1.15]} />
                <meshStandardMaterial color={MARBLE_SHADE} roughness={0.8} />
            </mesh>
            <mesh position={[0, 2.7, 0]} castShadow>
                <cylinderGeometry args={[0.28, 0.38, 4.7, 14]} />
                <meshStandardMaterial color={MARBLE} roughness={0.55} />
            </mesh>
            {[1.6, 3.1, 4.5].map((y) => (
                <mesh key={y} position={[0, y, 0]} castShadow>
                    <cylinderGeometry args={[0.46, 0.46, 0.14, 14]} />
                    <meshStandardMaterial color={MARBLE_SHADE} roughness={0.7} />
                </mesh>
            ))}
            <mesh position={[0, 5.35, 0]} castShadow>
                <sphereGeometry args={[0.42, 14, 10]} />
                <meshStandardMaterial color={MARBLE} roughness={0.45} />
            </mesh>
            <mesh position={[0, 5.88, 0]} castShadow>
                <coneGeometry args={[0.09, 0.42, 8]} />
                <meshStandardMaterial color={GOLD} metalness={0.55} roughness={0.3} />
            </mesh>
        </group>
    );
}

function SidePavilion() {
    return (
        <group>
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.4, 3, 6]} />
                <meshStandardMaterial color={SANDSTONE} roughness={0.85} />
            </mesh>
            {[-1.9, 0, 1.9].map((z) => (
                <mesh key={z} position={[1.72, 1.3, z]} castShadow>
                    <boxGeometry args={[0.12, 2, 1.2]} />
                    <meshStandardMaterial color="#8d4232" roughness={0.9} />
                </mesh>
            ))}
            <mesh position={[0, 3.9, 0]} castShadow>
                <sphereGeometry args={[1.05, 16, 12]} />
                <meshStandardMaterial color={MARBLE} roughness={0.5} />
            </mesh>
            <mesh position={[0, 5.15, 0]} castShadow>
                <coneGeometry args={[0.12, 0.5, 8]} />
                <meshStandardMaterial color={GOLD} metalness={0.55} roughness={0.3} />
            </mesh>
        </group>
    );
}

function GardenQuarter() {
    return (
        <group>
            <mesh position={[0, 0.12, 0]} receiveShadow>
                <boxGeometry args={[4.4, 0.24, 5.6]} />
                <meshStandardMaterial color={GARDEN} roughness={1} />
            </mesh>
            <mesh position={[0, 0.26, 0]} receiveShadow>
                <boxGeometry args={[4.6, 0.06, 0.5]} />
                <meshStandardMaterial color={PATH} roughness={1} />
            </mesh>
            {[
                [-1.4, -1.8],
                [1.4, -1.8],
                [-1.4, 1.8],
                [1.4, 1.8],
            ].map(([x, z], i) => (
                <Tree key={i} position={[x, 0.24, z]} leaf="#3d6b3a" seed={i + 3} />
            ))}
        </group>
    );
}

function Mausoleum() {
    return (
        <group>
            <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[5.2, 3.2, 5.2]} />
                <meshStandardMaterial color={MARBLE} roughness={0.5} />
            </mesh>
            {/* iwan: den store portbuen midt på fasaden mot hagen */}
            <mesh position={[0, 1.5, 2.63]}>
                <boxGeometry args={[2, 2.6, 0.12]} />
                <meshStandardMaterial color={MARBLE_SHADE} roughness={0.8} />
            </mesh>
            <mesh position={[0, 4.6, 0]} castShadow>
                <sphereGeometry args={[2.05, 22, 16]} />
                <meshStandardMaterial color={MARBLE} roughness={0.42} />
            </mesh>
            <mesh position={[0, 7.05, 0]} castShadow>
                <coneGeometry args={[0.2, 1.05, 10]} />
                <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.28} />
            </mesh>
            {/* fire små kupler (chattri) som står på taket */}
            {[
                [-2.1, -2.1],
                [2.1, -2.1],
                [-2.1, 2.1],
                [2.1, 2.1],
            ].map(([x, z], i) => (
                <group key={i} position={[x, 3.82, z]}>
                    <mesh castShadow>
                        <sphereGeometry args={[0.62, 14, 10]} />
                        <meshStandardMaterial color={MARBLE} roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 0.78, 0]} castShadow>
                        <coneGeometry args={[0.08, 0.34, 8]} />
                        <meshStandardMaterial color={GOLD} metalness={0.55} roughness={0.3} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function PieceModel({ id }: { id: string }) {
    if (id === 'sidebygg') return <SidePavilion />;
    if (id === 'hagekvadrant') return <GardenQuarter />;
    return <Minaret />;
}

interface SceneProps {
    placed: number;
    attempt: number;
    mirrored: boolean;
    onSnap: () => void;
    onMiss: () => void;
}

function Scene({ placed, attempt, mirrored, onSnap, onMiss }: SceneProps) {
    const active = placed < PIECES.length ? PIECES[placed] : null;
    const last = placed > 0 ? PIECES[placed - 1] : PIECES[0];
    // Slås speilloven av, sklir tvillingene ut av stilling og roen forsvinner.
    const skewX = mirrored ? 0 : 1.9;
    const skewZ = mirrored ? 0 : -1.4;

    return (
        <group>
            <GroundPlane size={46} depth={42} color="#89a45c" />

            {/* sandsteinsbrem rundt marmorplassen, så plassen ikke svever på gresset */}
            <mesh position={[0, 0.006, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[15.4, 11]} />
                <meshStandardMaterial color="#a5654c" roughness={1} />
            </mesh>

            {/* marmorplassen: flat terrasse, alt står på bakkenivå */}
            <mesh position={[0, 0.018, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[13, 9]} />
                <meshStandardMaterial color={MARBLE_SHADE} roughness={0.9} />
            </mesh>

            {/* midtaksen: den usynlige loven, gjort synlig */}
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.22, 20]} />
                <meshBasicMaterial color={GOLD} transparent opacity={0.75} />
            </mesh>

            {/* vannrenna langs aksen, med steinkant på hver side */}
            {[-0.95, 0.95].map((x) => (
                <mesh key={x} position={[x, 0.09, 5.6]} receiveShadow>
                    <boxGeometry args={[0.55, 0.18, 7]} />
                    <meshStandardMaterial color={PATH} roughness={1} />
                </mesh>
            ))}
            <mesh position={[0, 0.05, 5.6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.4, 7, 6, 22]} />
                <WaterMaterial color={WATER} waveHeight={0.03} speed={0.7} />
            </mesh>

            {/* muren rundt anlegget: rammer hagen inn og gir dybde */}
            <mesh position={[0, 0.75, -6.6]} castShadow receiveShadow>
                <boxGeometry args={[21, 1.5, 0.5]} />
                <meshStandardMaterial color={SANDSTONE} roughness={0.9} />
            </mesh>

            {/* ferdig plasserte par */}
            {PIECES.slice(0, placed).map((p) => (
                <group key={p.id}>
                    <group position={[p.target[0], 0, p.target[1]]}>
                        <PieceModel id={p.id} />
                    </group>
                    <group
                        position={[-p.target[0] + skewX, 0, p.target[1] + skewZ]}
                        rotation={[0, mirrored ? Math.PI : 0.35, 0]}
                    >
                        <RiseIn show>
                            <PieceModel id={p.id} />
                        </RiseIn>
                    </group>
                </group>
            ))}

            <Burst
                position={[-last.target[0], 1.4, last.target[1]]}
                trigger={placed}
                color={GOLD}
                count={22}
            />

            {/* mausoleet reiser seg når alle fire par står */}
            <group position={[0, 0, -1]}>
                <RiseIn show={placed >= PIECES.length}>
                    <Mausoleum />
                </RiseIn>
            </group>

            {/* aktivt mål + delen som skal dras */}
            {active && (
                <>
                    <Hotspot
                        position={[active.target[0], 1.1, active.target[1]]}
                        radius={0.72}
                        label="Sett den her"
                        sound={null}
                    />
                    <Draggable
                        key={`${active.id}-${attempt}`}
                        position={STAGING}
                        planeY={0}
                        bounds={{ minX: -11.5, maxX: -0.9, minZ: -5.5, maxZ: 10 }}
                        snapPoints={[active.target]}
                        snapRadius={SNAP_RADIUS}
                        onSnap={onSnap}
                        onDrop={(pos) => {
                            const dx = pos.x - active.target[0];
                            const dz = pos.z - active.target[1];
                            if (Math.hypot(dx, dz) > SNAP_RADIUS) onMiss();
                        }}
                        dropFx="dustPuff"
                    >
                        {/* romslig usynlig gripeflate: trygg på trackpad */}
                        <mesh position={[0, 1.6, 0]}>
                            <boxGeometry args={[3.6, 3.4, 3.6]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                        <PieceModel id={active.id} />
                    </Draggable>
                </>
            )}
        </group>
    );
}

const START_BANNER = 'Du bygger bare venstre side. Midtaksen speiler alt over til høyre.';

export default function TajMahalSymmetri3D({ onComplete, onRetry }: MicroGameProps) {
    const [step, setStep] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [banner, setBanner] = useState<string | null>(START_BANNER);
    const [mirrored, setMirrored] = useState<'a' | 'b'>('a');

    const done = step >= PIECES.length;
    const active = done ? null : PIECES[step];

    const handleSnap = () => {
        const next = step + 1;
        setStep(next);
        setAttempt(0);
        if (next >= PIECES.length) {
            microSfx.play('complete');
            setBanner('Alle fire par står. Mausoleet reiser seg midt på aksen.');
            onComplete({ score: 1, completed: true });
        } else {
            microSfx.play('correct');
            setBanner(PIECES[step].fact);
        }
    };

    const handleMiss = () => {
        setAttempt((a) => a + 1);
        microSfx.play('incorrect');
        setBanner('For langt fra målet. Da finner ikke speilaksen tvillingen, og delen går tilbake.');
    };

    const reset = () => {
        setStep(0);
        setAttempt(0);
        setMirrored('a');
        setBanner(START_BANNER);
        onRetry?.();
    };

    return (
        <MicroGameScaffold
            title="Speilaksen i Taj Mahal"
            subtitle="Dra hver del ut på venstre side. Alt du setter ned, spretter opp speilvendt på høyre side."
            estimatedSeconds={150}
            onRetry={reset}
            scene={
                <Scene
                    placed={step}
                    attempt={attempt}
                    mirrored={mirrored === 'a'}
                    onSnap={handleSnap}
                    onMiss={handleMiss}
                />
            }
            canvas={{
                camera: { position: [0, 12.5, 26.5], fov: 42 },
                background: '#e9dfc9',
                fog: { color: '#e6dcc6', near: 38, far: 72 },
                light: 'golden',
                target: [0, 2.3, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Agra, 1631-1648</SceneBadge>
                    <DragHint show={step === 0 && attempt === 0}>
                        Dra delen til den gule markøren
                    </DragHint>
                </>
            }
        >
            <div className="flex flex-wrap items-center gap-3">
                <StepTracker current={Math.min(step + 1, PIECES.length)} total={PIECES.length} />
                {active && (
                    <span className="text-sm font-semibold text-slate-700">{active.label}</span>
                )}
            </div>

            {active && (
                <div className="mt-2">
                    <SceneFact>{active.hint}</SceneFact>
                </div>
            )}

            {done && (
                <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <CompareToggle
                            labelA="Med speilaksen"
                            labelB="Uten speilaksen"
                            value={mirrored}
                            onChange={setMirrored}
                        />
                        <span className="text-sm text-slate-600">
                            Slå av loven og se hva som skjer med bygget.
                        </span>
                    </div>
                    <WinScreen title="Du bygde Taj Mahal rundt en usynlig linje" onReplay={reset}>
                        Shah Jahan lot dette mausoleet reise mellom 1631 og 1648 til minne om kona
                        si, Mumtaz. Hver eneste del har en tvilling på den andre siden av
                        midtaksen. Derfor ser bygget rolig ut uansett hvor du står. Slår du av
                        speilingen, forsvinner roen med en gang.
                    </WinScreen>
                </div>
            )}
        </MicroGameScaffold>
    );
}
