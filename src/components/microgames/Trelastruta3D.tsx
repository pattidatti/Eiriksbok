import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor } from 'lucide-react';
import {
    MicroGameScaffold,
    Draggable,
    Hotspot,
    StepTracker,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    DataReadout,
    DragHint,
    GroundPlane,
    WaterPlane,
    Tree,
    Gear,
    Boat,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill for artikkelen "Trelasthandelen".
// Lyspaere: en stokk maa reise fra skogen ut til Europa for aa bli verdt noe, og
// paa veien gjor NATUREN det tunge arbeidet gratis - elva baerer stokken ned til
// kysten, og fossen driver oppgangssaga som skjaerer den til planker. Til slutt
// kjoper hollenderne plankene. Eleven kjenner ruta paa kroppen i tre grep:
//   1) Dra en tommerstokk fra skogen ut i elva -> den flyter ned til saga.
//   2) Slipp vannet paa saga -> hjulet snurrer, bladet skjaerer stokken til planker.
//   3) Dra plankestabelen om bord i det hollandske skipet -> det seiler til Amsterdam.

const SKY = '#cfe6f2';
const COL = {
    ground: '#7da44e',
    water: '#3f86ab',
    wood: '#6b4a2a',
    woodDark: '#4f3620',
    plank: '#d9b877',
    stone: '#9aa0a6',
    leaf: '#3f6b39',
};

// Verdien stokken er verdt paa hvert steg (samme tall som i signaturkomponenten).
const VALUE = [3, 15, 30];

type Step = 1 | 2 | 3;

const Trelastruta3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [step, setStep] = useState<Step>(1);
    const [sawing, setSawing] = useState(false);
    const [sawed, setSawed] = useState(false); // stokk -> planker ferdig
    const [done, setDone] = useState(false);
    const [banner, setBanner] = useState<string | null>(
        'Dra tømmerstokken fra skogen ut i elva.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [resetKey, setResetKey] = useState(0);

    const reset = () => {
        setStep(1);
        setSawing(false);
        setSawed(false);
        setDone(false);
        setBanner('Dra tømmerstokken fra skogen ut i elva.');
        setFact(null);
        setResetKey((k) => k + 1);
    };

    // Steg 1: stokken er sluppet i elva (snappet til innlopet ved saga).
    const onLogInRiver = () => {
        if (step !== 1) return;
        setStep(2);
        sounds.play('advance');
        setBanner('Stokken fløt ned til saga. Elva bar den helt gratis!');
        setFact(
            'Om våren bar flommen tusenvis av stokker ned elvene til kysten. Fløterne styrte dem, men elva gjorde selve løftet: ingen hest, ingen vogn.'
        );
    };

    // Steg 2: slipp vannet paa saghjulet.
    const onOpenSluice = () => {
        if (step !== 2 || sawing) return;
        setSawing(true);
        sounds.play('correct');
        setBanner('Vannet driver hjulet, og oppgangssaga skjærer stokken.');
        setFact(null);
        window.setTimeout(() => {
            setSawed(true);
            setStep(3);
            sounds.play('sceneChange');
            setBanner('Ferdige planker! Dra plankestabelen om bord i skipet.');
            setFact(
                'Oppgangssaga kom til Norge rundt år 1500. Vannhjulet drev et sagblad opp og ned i en treramme, og skar stokken til jevne, tynne planker mye raskere enn en mann med øks.'
            );
        }, 2100);
    };

    // Steg 3: plankestabelen er lastet om bord.
    const onPlanksAboard = () => {
        if (step !== 3 || done) return;
        setDone(true);
        setBurst((b) => b + 1);
        sounds.play('complete');
        setBanner(null);
        window.setTimeout(() => onComplete({ score: 1, completed: true }), 400);
    };

    const value = done ? VALUE[2] : sawed ? VALUE[1] : VALUE[0];
    const idleHint = step === 1;

    return (
        <MicroGameScaffold
            title="Trelastruta: fra skog til Amsterdam"
            subtitle="Send stokken ned elva, sag den til planker, og last den om bord til hollenderne"
            estimatedSeconds={150}
            onRetry={step > 1 || sawing ? reset : undefined}
            canvas={{
                idle: false,
                controls: true,
                camera: { position: [10, 7.5, 11], fov: 42 },
                background: SKY,
                target: [0, 1, 1],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {step === 1 ? 'Skogen' : step === 2 ? 'Sagbruket' : 'Havna'}
                    </SceneBadge>
                    <DataReadout
                        items={[{ label: 'Verdi', value, unit: 'skilling' }]}
                        corner="bl"
                    />
                    <DragHint show={idleHint} corner="bc">
                        Dra stokken ut i elva
                    </DragHint>
                </>
            }
            scene={
                <RouteScene
                    key={resetKey}
                    step={step}
                    sawing={sawing}
                    sawed={sawed}
                    done={done}
                    burst={burst}
                    onLogInRiver={onLogInRiver}
                    onOpenSluice={onOpenSluice}
                    onPlanksAboard={onPlanksAboard}
                />
            }
        >
            <div className="flex flex-col gap-2.5">
                <StepTracker current={step} total={3} />
                <p className="text-sm text-slate-600">
                    {step === 1 &&
                        'Ta tak i tømmerstokken ved skogen og dra den ut i elva. Elva frakter den gratis ned til saga ved fossen.'}
                    {step === 2 &&
                        (sawing
                            ? 'Se sagbladet gå opp og ned. Fossen gjør det tunge arbeidet.'
                            : 'Klikk den gule ringen ved fossen for å slippe vannet på saghjulet.')}
                    {step === 3 &&
                        !done &&
                        'Dra plankestabelen fra saga og om bord i det hollandske skipet ved kaia.'}
                    {done &&
                        'Skipet seiler til Amsterdam. Naturen gjorde nesten alt arbeidet gratis.'}
                </p>
                {fact && <SceneFact>{fact}</SceneFact>}
                {done && (
                    <WinScreen title="Plankene er om bord!" onReplay={reset}>
                        <span className="inline-flex items-center gap-1.5">
                            <Anchor className="w-4 h-4 text-amber-500" />
                            Fra 3 til 30 skilling.
                        </span>{' '}
                        Elva bar stokken, fossen skar den, og hollenderne betalte gull. Fordi
                        naturen gjorde det tunge arbeidet gratis, ble skogen til rikdom, og
                        norske kystbyer vokste fram rundt sagbrukene.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function RouteScene({
    step,
    sawing,
    sawed,
    done,
    burst,
    onLogInRiver,
    onOpenSluice,
    onPlanksAboard,
}: {
    step: Step;
    sawing: boolean;
    sawed: boolean;
    done: boolean;
    burst: number;
    onLogInRiver: () => void;
    onOpenSluice: () => void;
    onPlanksAboard: () => void;
}) {
    const ship = useRef<THREE.Group>(null);
    // Skipet seiler av garde naar plankene er lastet.
    useFrame((_, dt) => {
        if (ship.current) {
            const targetX = done ? 20 : 6.5;
            ship.current.position.x = damp(ship.current.position.x, targetX, dt, 0.9);
        }
    });

    return (
        <group>
            <GroundPlane size={46} depth={34} color={COL.ground} />

            {/* Elva renner langs X, fra skogen (venstre) til havna (hoyre) */}
            <WaterPlane position={[0, 0.06, 1]} size={[24, 3.2]} color={COL.water} />

            {/* Skog til venstre */}
            <Tree position={[-9, 0, -3]} leaf={COL.leaf} />
            <Tree position={[-10.5, 0, -0.5]} leaf="#4a7a3e" />
            <Tree position={[-8, 0, -5]} leaf="#4a7a3e" />
            <Tree position={[-11, 0, -4.5]} leaf={COL.leaf} />

            {/* Sagbruket i midten, med foss og vannhjul */}
            <Sawmill sawing={sawing} onOpenSluice={step === 2 && !sawing ? onOpenSluice : undefined} />

            {/* Steg 1: dra stokken fra skogen ut i elva (snapper ved sag-innlopet) */}
            {step === 1 && (
                <Draggable
                    position={[-8, 0.4, 4.2]}
                    bounds={{ minX: -9, maxX: 1, minZ: -1, maxZ: 5 }}
                    planeY={0.4}
                    snapPoints={[[-2.4, 1]]}
                    snapRadius={2.2}
                    onSnap={onLogInRiver}
                    dropFx="splash"
                >
                    <Log />
                    {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh>
                        <boxGeometry args={[2.4, 1.4, 1.4]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                </Draggable>
            )}

            {/* Steg 2: stokken ligger ved saga og skjaeres */}
            {step === 2 && (
                <group position={[-2.4, 0.35, 1]}>
                    <Log />
                </group>
            )}

            {/* Steg 3: ferdige planker - draggbar stabel som lastes om bord */}
            {sawed && !done && (
                <Draggable
                    position={[-0.4, 0.45, 3]}
                    bounds={{ minX: -2, maxX: 7, minZ: 0.5, maxZ: 4 }}
                    planeY={0.45}
                    snapPoints={[[6, 1]]}
                    snapRadius={2.4}
                    onSnap={onPlanksAboard}
                >
                    <PlankStack />
                    <mesh>
                        <boxGeometry args={[2, 1.4, 1.6]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                </Draggable>
            )}

            {/* Planker om bord etter lasting */}
            {done && (
                <group position={[6, 1.05, 1]}>
                    <PlankStack />
                </group>
            )}

            {/* Kaia og det hollandske skipet til hoyre */}
            <group position={[6.5, 0, 3.4]}>
                <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
                    <boxGeometry args={[3, 0.3, 1.4]} />
                    <meshStandardMaterial color={COL.woodDark} roughness={0.9} />
                </mesh>
            </group>
            <group ref={ship} position={[6.5, 0.5, 1]}>
                <Boat position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} sail="#f2ead6" />
            </group>

            <Burst position={[6, 3, 1]} trigger={burst} color="#dff0ff" count={30} spread={4} />
        </group>
    );
}

// --- En rund tommerstokk ---
function Log() {
    return (
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 2.2, 12]} />
            <meshStandardMaterial color={COL.wood} roughness={0.95} />
        </mesh>
    );
}

// --- En stabel med ferdige planker ---
function PlankStack() {
    const rows = useMemo(() => [0, 1, 2, 3], []);
    return (
        <group>
            {rows.map((r) =>
                [0, 1, 2].map((c) => (
                    <mesh
                        key={`${r}-${c}`}
                        position={[(c - 1) * 0.42, 0.14 + r * 0.16, 0]}
                        castShadow
                    >
                        <boxGeometry args={[0.36, 0.12, 1.8]} />
                        <meshStandardMaterial color={COL.plank} roughness={0.9} />
                    </mesh>
                ))
            )}
        </group>
    );
}

// --- Sagbruket: hus, foss, vannhjul, oppgangssag ---
function Sawmill({
    sawing,
    onOpenSluice,
}: {
    sawing: boolean;
    onOpenSluice?: () => void;
}) {
    const wheel = useRef<THREE.Group>(null);
    const blade = useRef<THREE.Group>(null);
    const phase = useRef(0);
    useFrame((_, dt) => {
        if (wheel.current) wheel.current.rotation.z -= (sawing ? 3 : 0) * dt;
        if (blade.current) {
            phase.current += (sawing ? 7 : 0) * dt;
            const y = sawing ? Math.sin(phase.current) * 0.28 : 0;
            blade.current.position.y = damp(blade.current.position.y, 1.5 + y, dt, 16);
        }
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Sagbrukshuset ved elvebredden */}
            <group position={[0, 0, -1.3]}>
                <mesh position={[0, 1, 0]} castShadow receiveShadow>
                    <boxGeometry args={[2.6, 2, 2.4]} />
                    <meshStandardMaterial color={COL.wood} roughness={0.9} />
                </mesh>
                <mesh position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[2.2, 1.1, 4]} />
                    <meshStandardMaterial color={COL.woodDark} roughness={0.9} />
                </mesh>
            </group>

            {/* Oppgangssaga: en treramme med sagblad som gaar opp og ned */}
            <group position={[0, 0, 0.6]}>
                <mesh position={[-0.5, 1.5, 0]} castShadow>
                    <boxGeometry args={[0.12, 2.4, 0.12]} />
                    <meshStandardMaterial color={COL.woodDark} roughness={0.9} />
                </mesh>
                <mesh position={[0.5, 1.5, 0]} castShadow>
                    <boxGeometry args={[0.12, 2.4, 0.12]} />
                    <meshStandardMaterial color={COL.woodDark} roughness={0.9} />
                </mesh>
                <group ref={blade} position={[0, 1.5, 0]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.9, 0.9, 0.04]} />
                        <meshStandardMaterial
                            color={COL.stone}
                            metalness={0.5}
                            roughness={0.4}
                        />
                    </mesh>
                </group>
            </group>

            {/* Fossen og vannhjulet */}
            <group position={[2, 1.2, 1]}>
                <group ref={wheel}>
                    {[-0.3, 0.3].map((z) => (
                        <mesh key={z} position={[0, 0, z]} castShadow>
                            <torusGeometry args={[1, 0.08, 8, 24]} />
                            <meshStandardMaterial color={COL.wood} roughness={0.9} />
                        </mesh>
                    ))}
                    {Array.from({ length: 8 }, (_, i) => {
                        const a = (i / 8) * Math.PI * 2;
                        return (
                            <mesh
                                key={i}
                                position={[Math.cos(a), Math.sin(a), 0]}
                                rotation={[0, 0, a]}
                                castShadow
                            >
                                <boxGeometry args={[0.08, 0.34, 0.7]} />
                                <meshStandardMaterial color={COL.woodDark} roughness={0.9} />
                            </mesh>
                        );
                    })}
                </group>
                {/* liten kraftoverforing */}
                <Gear position={[-1.3, 0, 0]} radius={0.4} teeth={10} color={COL.stone} spin={sawing ? -3 : 0} />
            </group>

            {/* Sluse-hotspot: slipp vannet paa hjulet */}
            {onOpenSluice && (
                <Hotspot
                    position={[2, 2.9, 1]}
                    onSelect={onOpenSluice}
                    label="Slipp vannet på saga"
                    radius={0.6}
                />
            )}
        </group>
    );
}

export default Trelastruta3D;
