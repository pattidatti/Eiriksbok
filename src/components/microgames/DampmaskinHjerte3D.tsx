import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    WaterPlane,
    Smoke,
    Fire,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    SceneSlider,
    StepTracker,
    DataReadout,
    Burst,
    damp,
    THEMES,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om dampmaskinen. Eleven KJØRER en dampmaskin og
// kjenner kjernepoenget på kroppen: Newcomen-maskinen varmer og kjøler den
// samme sylinderen hvert eneste slag, så tre fjerdedeler av kullet går tapt.
// Watts separate kondensator flytter nedkjølingen ut av sylinderen, så
// sylinderen holder seg gloheit - og det samme kullet pumper mye mer vann.
//
// Mekanikk: SceneSlider er maskinspaken (dra opp og ned = ett pumpeslag, bjelken
// vipper og vannet siger ut av gruva i sanntid), Draggable installerer den blå
// kondensatoren, og scenen forvandles fra Newcomen til Watt.

const T = THEMES.industrial;

type Stage = 'newcomen' | 'install' | 'watt' | 'won';

// Hvor mye et pumpeslag flytter, per modus.
const NEWCOMEN = { coal: 16, water: 8 };
const WATT = { coal: 4, water: 20 };

// Mål for kondensatoren når den dras på plass (ved siden av sylinderen).
const CONDENSER_TARGET: [number, number] = [-3.4, 0.6];

const DampmaskinHjerte3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState<Stage>('newcomen');
    const [cycle, setCycle] = useState(0); // 0-100, spaken / maskinslaget
    const [strokes, setStrokes] = useState(0); // fullførte slag i Newcomen-fasen
    const [coalLeft, setCoalLeft] = useState(100);
    const [mineWater, setMineWater] = useState(100);
    const [banner, setBanner] = useState<string | null>(
        'Dra spaken helt opp og helt ned for å kjøre ett pumpeslag.'
    );
    const [burst, setBurst] = useState(0);

    const armed = useRef(false); // true når spaken har vært høyt oppe

    const installed = stage === 'watt' || stage === 'won';
    const mode: 'newcomen' | 'watt' = installed ? 'watt' : 'newcomen';
    const cyc = cycle / 100;

    const reset = () => {
        setStage('newcomen');
        setCycle(0);
        setStrokes(0);
        setCoalLeft(100);
        setMineWater(100);
        setBanner('Dra spaken helt opp og helt ned for å kjøre ett pumpeslag.');
        armed.current = false;
    };

    // Et fullført pumpeslag: brenn kull, pump litt vann ut av gruva.
    const completeStroke = () => {
        if (stage === 'newcomen') {
            const next = strokes + 1;
            setStrokes(next);
            setCoalLeft((c) => Math.max(0, c - NEWCOMEN.coal));
            setMineWater((w) => Math.max(0, w - NEWCOMEN.water));
            if (next >= 2) {
                sounds.play('advance');
                setStage('install');
                setBanner(
                    'Se hvor fort kullet forsvinner! Hvert slag må varme opp den kalde sylinderen på nytt.'
                );
            } else {
                sounds.play('correct');
            }
        } else if (stage === 'watt') {
            sounds.play('correct');
            setCoalLeft((c) => Math.max(0, c - WATT.coal));
            setMineWater((w) => {
                const nw = Math.max(0, w - WATT.water);
                if (nw <= 0) {
                    sounds.play('complete');
                    setBurst((b) => b + 1);
                    setStage('won');
                    setBanner(null);
                    setTimeout(() => onComplete({ score: 1, completed: true }), 250);
                }
                return nw;
            });
        }
    };

    // Spaken styrer maskinslaget i sanntid. Et slag teller når spaken føres
    // helt opp (>80) og deretter helt ned igjen (<20).
    const handleCycle = (v: number) => {
        setCycle(v);
        if (v > 80) armed.current = true;
        if (v < 20 && armed.current) {
            armed.current = false;
            completeStroke();
        }
    };

    const installCondenser = (pos: THREE.Vector3) => {
        const dist = Math.hypot(pos.x - CONDENSER_TARGET[0], pos.z - CONDENSER_TARGET[1]);
        if (dist < 1.8) {
            sounds.play('drop');
            setBurst((b) => b + 1);
            setStage('watt');
            setBanner(
                'Kondensatoren står på plass. Nå kjøler dampen seg ned utenfor sylinderen.'
            );
        } else {
            setBanner('Dra den blå kondensatoren helt inntil sylinderen.');
        }
    };

    const idle = stage === 'newcomen' && strokes === 0 && cycle === 0;
    const pumping = stage === 'newcomen' || stage === 'watt';

    return (
        <MicroGameScaffold
            title="Dampmaskinens hjerte"
            subtitle="Kjør maskinen, sett inn Watts kondensator, og pump gruva tør"
            estimatedSeconds={150}
            onRetry={stage !== 'newcomen' || strokes > 0 || cycle > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [9, 6, 12], fov: 42 },
                background: T.sky,
                fog: { near: 30, far: 60 },
                target: [0, 1.8, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {mode === 'watt' ? 'Watt 1769' : 'Newcomen 1712'}
                    </SceneBadge>
                    {pumping && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Kull igjen', value: Math.round(coalLeft), unit: '%' },
                                {
                                    label: 'Gruve tør',
                                    value: Math.round(100 - mineWater),
                                    unit: '%',
                                },
                                {
                                    label: 'Kull per slag',
                                    value: mode === 'watt' ? WATT.coal : NEWCOMEN.coal,
                                },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Dra spaken opp og ned
                    </DragHint>
                </>
            }
            scene={
                <EngineScene
                    cyc={cyc}
                    mode={mode}
                    stage={stage}
                    coalLeft={coalLeft}
                    mineWater={mineWater}
                    burst={burst}
                    onInstall={installCondenser}
                />
            }
        >
            {pumping && (
                <div className="flex flex-col gap-3">
                    <SceneSlider
                        label="Maskinspaken: damp inn opp, kjøl ned"
                        min={0}
                        max={100}
                        step={1}
                        value={cycle}
                        onChange={handleCycle}
                        valueLabel={(v) => (v > 50 ? 'Damp slippes inn' : 'Dampen kjøles ned')}
                    />
                    {stage === 'newcomen' ? (
                        <div className="flex flex-col gap-2.5">
                            <StepTracker current={strokes} total={2} />
                            <SceneFact>
                                Newcomen sprøyter kaldt vann rett inn i sylinderen for å lage
                                vakuum. Da blir hele jernsylinderen kald, og den må varmes opp
                                igjen før neste slag. Tre fjerdedeler av kullet går bare til denne
                                oppvarmingen.
                            </SceneFact>
                        </div>
                    ) : (
                        <SceneFact>
                            Med den separate kondensatoren holder sylinderen seg gloheit hele tiden.
                            Det samme kullet pumper nå mye mer vann. Før spaken ned til gruva er
                            tør.
                        </SceneFact>
                    )}
                </div>
            )}

            {stage === 'install' && (
                <div className="flex flex-col gap-2.5">
                    <p className="text-sm text-slate-600">
                        Newcomen-maskinen sløser kull fordi den kjøler ned selve sylinderen. Watts
                        løsning: dra den blå kondensatoren inntil sylinderen, så dampen kan
                        kjøle seg ned i et eget kammer i stedet.
                    </p>
                    <SceneFact>
                        Klikk og dra den blå tanken nede til venstre helt inntil sylinderen.
                    </SceneFact>
                </div>
            )}

            {stage === 'won' && (
                <WinScreen title="Gruva er pumpet tør!" onReplay={reset}>
                    Den separate kondensatoren flyttet nedkjølingen ut av sylinderen. Sylinderen
                    holdt seg varm, og det samme kullet gjorde fire ganger så mye arbeid. Det var
                    denne ene ideen som gjorde dampkraft billig nok til å drive fabrikker, tog og
                    skip.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function EngineScene({
    cyc,
    mode,
    stage,
    coalLeft,
    mineWater,
    burst,
    onInstall,
}: {
    cyc: number;
    mode: 'newcomen' | 'watt';
    stage: Stage;
    coalLeft: number;
    mineWater: number;
    burst: number;
    onInstall: (pos: THREE.Vector3) => void;
}) {
    // Bjelken vipper med slaget: damp inn (cyc høy) løfter sylindersiden.
    const beamAngle = (cyc - 0.5) * 0.34;
    const installed = stage === 'watt' || stage === 'won';

    return (
        <group>
            <GroundPlane size={40} depth={34} color={T.ground} />

            {/* Fyrhuset med ovn og kullhaug */}
            <Boiler />
            <CoalPile amount={coalLeft} />
            <Fire position={[-2, 0.15, 1.2]} scale={mode === 'watt' ? 0.5 : 1.15} />
            {/* Skorsteinsrøyk - tykkere når mye kull brenner (Newcomen) */}
            <Smoke
                origin={[-2.9, 3.4, -0.6]}
                show
                count={mode === 'watt' ? 4 : 7}
                color="#55585c"
            />

            {/* Sylinderen - holder seg varm i Watt-modus, veksler varm/kald i Newcomen */}
            <SteamCylinder cyc={cyc} mode={mode} />

            {/* Vippebjelken med stempelstang og pumpestang */}
            <group position={[0.6, 3.7, 0]} rotation={[0, 0, beamAngle]}>
                <mesh castShadow>
                    <boxGeometry args={[5.4, 0.32, 0.5]} />
                    <meshStandardMaterial color={T.wood} roughness={0.85} />
                </mesh>
                {/* stempelstang ned i sylinderen */}
                <mesh position={[-2.2, -0.95, 0]} castShadow>
                    <boxGeometry args={[0.16, 1.9, 0.16]} />
                    <meshStandardMaterial color="#9aa0a6" metalness={0.4} roughness={0.5} />
                </mesh>
                {/* pumpestang ned i gruvesjakten */}
                <mesh position={[2.4, -1.4, 0]} castShadow>
                    <boxGeometry args={[0.16, 2.8, 0.16]} />
                    <meshStandardMaterial color="#9aa0a6" metalness={0.4} roughness={0.5} />
                </mesh>
            </group>

            {/* Dreiepunktet under bjelken */}
            <mesh position={[0.6, 1.9, 0]} castShadow>
                <boxGeometry args={[0.5, 3.6, 0.5]} />
                <meshStandardMaterial color="#6b3a2a" roughness={0.9} />
            </mesh>

            {/* Gruvesjakten med vann som siger ut */}
            <MineShaft water={mineWater} />

            {/* Kondensatoren: dras på plass i install-fasen, står fast etterpå */}
            {stage === 'install' ? (
                <>
                    <GhostTarget />
                    <Draggable
                        position={[3.2, 0, 3.2]}
                        planeY={0}
                        bounds={{ minX: -5, maxX: 4, minZ: -1, maxZ: 4 }}
                        onDrop={onInstall}
                        liftY={0.5}
                    >
                        {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                        <mesh position={[0, 0.8, 0]}>
                            <boxGeometry args={[2, 2.2, 2]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <CondenserTank />
                    </Draggable>
                </>
            ) : installed ? (
                <group position={[CONDENSER_TARGET[0], 0, CONDENSER_TARGET[1]]}>
                    <CondenserTank />
                    {/* rør fra sylinder til kondensator */}
                    <mesh position={[1.05, 1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.1, 0.1, 1.4, 8]} />
                        <meshStandardMaterial color="#7a7f86" metalness={0.4} roughness={0.5} />
                    </mesh>
                    {/* dampen kjøles ned HER nå - hvit damp ut av kondensatoren */}
                    <Smoke origin={[0, 1.7, 0]} show={cyc < 0.5} count={4} color="#e8eef2" />
                </group>
            ) : null}

            {/* Feiringspartikler ved installasjon og seier */}
            <Burst position={[-2, 3, 0]} trigger={burst} color="#fde68a" count={26} spread={3} />
        </group>
    );
}

// Murt fyrhus som bærer sylinderen.
function Boiler() {
    return (
        <group position={[-2, 0, 0.4]}>
            <mesh position={[0, 1, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.4, 2, 2.4]} />
                <meshStandardMaterial color={T.stone} roughness={0.95} />
            </mesh>
            {/* skorstein */}
            <mesh position={[-0.9, 3, -1]} castShadow>
                <boxGeometry args={[0.6, 2.4, 0.6]} />
                <meshStandardMaterial color="#5a2e22" roughness={0.95} />
            </mesh>
            {/* ovnsåpning */}
            <mesh position={[0, 0.55, 1.21]}>
                <boxGeometry args={[1, 0.7, 0.05]} />
                <meshStandardMaterial color="#2a1a12" roughness={1} />
            </mesh>
        </group>
    );
}

// Kullhaug som krymper etter hvert som kullet brennes.
function CoalPile({ amount }: { amount: number }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const s = Math.max(0.08, amount / 100);
        ref.current.scale.y = damp(ref.current.scale.y, s, dt, 3);
    });
    return (
        <group position={[-2, 0, 2.6]} ref={ref}>
            <mesh position={[0, 0.3, 0]} castShadow>
                <coneGeometry args={[0.8, 0.8, 7]} />
                <meshStandardMaterial color="#1f2226" roughness={1} flatShading />
            </mesh>
        </group>
    );
}

// Sylinderen. Varmen styres av modus: Newcomen veksler varm/kald hvert slag,
// Watt holder den gloheit. Glo-fargen forteller hele historien.
function SteamCylinder({ cyc, mode }: { cyc: number; mode: 'newcomen' | 'watt' }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const hot = useRef(0.2);
    const cold = new THREE.Color('#46739c');
    const warm = new THREE.Color('#d6452f');
    const tmp = new THREE.Color();

    useFrame((_, dt) => {
        if (!mat.current) return;
        // Newcomen: varm når damp slippes inn (cyc høy), kald når den kjøles
        // ned (cyc lav). Watt: alltid gloheit.
        const target = mode === 'watt' ? 1 : cyc;
        hot.current = damp(hot.current, target, dt, 4);
        tmp.copy(cold).lerp(warm, hot.current);
        mat.current.color.copy(tmp);
        mat.current.emissive.copy(warm);
        mat.current.emissiveIntensity = 0.15 + hot.current * 0.85;
    });

    return (
        <group position={[-1.6, 0, 0]}>
            <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.62, 0.62, 2.6, 20]} />
                <meshStandardMaterial ref={mat} metalness={0.3} roughness={0.45} />
            </mesh>
            {/* topplokk */}
            <mesh position={[0, 3.65, 0]} castShadow>
                <cylinderGeometry args={[0.7, 0.7, 0.2, 20]} />
                <meshStandardMaterial color="#5b5f63" metalness={0.5} roughness={0.4} />
            </mesh>
            {/* damp ut av sylindertoppen kun i Newcomen */}
            <Smoke
                origin={[0, 3.8, 0]}
                show={mode === 'newcomen' && cyc > 0.5}
                count={4}
                color="#e8eef2"
            />
        </group>
    );
}

// Gruvesjakt med en vannflate som synker mens den pumpes tør.
function MineShaft({ water }: { water: number }) {
    const plane = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!plane.current) return;
        // 100 = nær toppen, 0 = bunnen.
        const y = -1.9 + (water / 100) * 1.7;
        plane.current.position.y = damp(plane.current.position.y, y, dt, 3);
    });
    const wallColor = '#3a3430';
    return (
        <group position={[3, 0, 0]}>
            {/* fire vegger rundt et hull */}
            {[
                {
                    p: [0, -1, 1.1] as [number, number, number],
                    r: [0, 0, 0] as [number, number, number],
                },
                {
                    p: [0, -1, -1.1] as [number, number, number],
                    r: [0, 0, 0] as [number, number, number],
                },
            ].map((w, i) => (
                <mesh key={`z${i}`} position={w.p} castShadow>
                    <boxGeometry args={[2.2, 2.2, 0.12]} />
                    <meshStandardMaterial color={wallColor} roughness={1} />
                </mesh>
            ))}
            <mesh position={[1.1, -1, 0]} castShadow>
                <boxGeometry args={[0.12, 2.2, 2.2]} />
                <meshStandardMaterial color={wallColor} roughness={1} />
            </mesh>
            <mesh position={[-1.1, -1, 0]} castShadow>
                <boxGeometry args={[0.12, 2.2, 2.2]} />
                <meshStandardMaterial color={wallColor} roughness={1} />
            </mesh>
            {/* bunn */}
            <mesh position={[0, -2.1, 0]}>
                <boxGeometry args={[2.2, 0.1, 2.2]} />
                <meshStandardMaterial color="#241f1b" roughness={1} />
            </mesh>
            {/* vannet */}
            <group ref={plane}>
                <WaterPlane position={[0, 0, 0]} size={[2, 2]} color={T.water} />
            </group>
        </group>
    );
}

// Den blå kondensatoren - Watts oppfinnelse.
function CondenserTank() {
    return (
        <group>
            <mesh position={[0, 1, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.55, 0.55, 1.8, 16]} />
                <meshStandardMaterial color="#2f6fa6" metalness={0.35} roughness={0.5} />
            </mesh>
            <mesh position={[0, 2, 0]} castShadow>
                <cylinderGeometry args={[0.62, 0.62, 0.2, 16]} />
                <meshStandardMaterial color="#234f78" metalness={0.4} roughness={0.45} />
            </mesh>
            {/* vannbeholder på toppen (kaldt vann inn) */}
            <mesh position={[0, 2.4, 0]} castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#7fb6df" metalness={0.2} roughness={0.6} />
            </mesh>
        </group>
    );
}

// Lysende målmarkør der kondensatoren skal stå.
function GhostTarget() {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const m = ref.current.material as THREE.MeshStandardMaterial;
        m.opacity = 0.2 + Math.sin(clock.getElapsedTime() * 3) * 0.12;
    });
    return (
        <mesh ref={ref} position={[CONDENSER_TARGET[0], 1, CONDENSER_TARGET[1]]}>
            <cylinderGeometry args={[0.6, 0.6, 1.9, 16]} />
            <meshStandardMaterial color="#7fb6df" transparent opacity={0.25} depthWrite={false} />
        </mesh>
    );
}

export default DampmaskinHjerte3D;
