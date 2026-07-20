import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Connector,
    Hotspot,
    GroundPlane,
    Building,
    Tree,
    Gear,
    Person,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    SceneSlider,
    StepTracker,
    DataReadout,
    damp,
    type ConnectorNode,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om elektrisiteten. Lyspære-øyeblikket er Edisons
// store innsikt: ei pære alene gir ikke lys. Strømmen må ha en HEL vei å gå
// - fra fossen som lager den, gjennom ledningene, helt inn i taket ditt.
// Eleven bygger hele dette systemet i en norsk dal i kveldsmørket:
//   1) slipper vannet løs (slider) så fossen driver generatoren,
//   2) strekker ledningen fra kraftverket via stolpene til huset (Connector),
//   3) skrur på lyset (Hotspot) - og hele dalen lyser opp.

type Phase = 'water' | 'wire' | 'switch' | 'done';

const FLOW_NEEDED = 60; // nok vannføring til å drive generatoren

// Hvor sterkt huset lyser: bare når ledningen er koblet, bryteren på OG det
// faktisk renner nok vann. Ren funksjon (driver useFrame trygt fra props).
function powerLevel(flow: number, connected: boolean, on: boolean): number {
    if (!connected || !on) return 0;
    return Math.max(0, Math.min(1, (flow - 15) / 85));
}

// Punktene ledningen strekkes mellom (kraftverk -> stolpe -> stolpe -> hus).
const NODES: ConnectorNode[] = [
    { id: 'kraftverk', position: [-6.4, 2.7, 0.5] },
    { id: 'stolpe1', position: [-2.4, 3.1, 0] },
    { id: 'stolpe2', position: [2.2, 3.1, 0] },
    { id: 'hus', position: [6.3, 2.5, 0.5] },
];
const CORRECT: [string, string][] = [
    ['kraftverk', 'stolpe1'],
    ['stolpe1', 'stolpe2'],
    ['stolpe2', 'hus'],
];

const Stromveien3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('water');
    const [flow, setFlow] = useState(0);
    const [connected, setConnected] = useState(false);
    const [switchOn, setSwitchOn] = useState(false);
    const [banner, setBanner] = useState<string | null>(
        'Det er kveld og dalen er mørk. Slipp vannet løs i fossen.'
    );
    const [fact, setFact] = useState<string | null>(null);

    const reset = () => {
        setPhase('water');
        setFlow(0);
        setConnected(false);
        setSwitchOn(false);
        setFact(null);
        setBanner('Det er kveld og dalen er mørk. Slipp vannet løs i fossen.');
    };

    const onFlow = (v: number) => {
        setFlow(v);
        if (phase === 'water' && v >= FLOW_NEEDED) {
            sounds.play('advance');
            setPhase('wire');
            setFact(
                'Fossen driver generatoren, og nå lages det strøm. Men pæra er fortsatt mørk - stommen har ingen vei å gå enda.'
            );
            setBanner('Strekk ledningen: klikk punktene etter tur fra kraftverket til huset.');
        }
    };

    const onConnected = () => {
        if (phase !== 'wire') return;
        setConnected(true);
        sounds.play('advance');
        setPhase('switch');
        setFact(null);
        setBanner('Ledningen er framme. Klikk bryteren ved huset for å skru på lyset.');
    };

    const flipSwitch = () => {
        if (phase !== 'switch' || !connected) return;
        setSwitchOn(true);
        sounds.play('complete');
        setPhase('done');
        setBanner(null);
        setTimeout(() => onComplete({ score: 1, completed: true }), 250);
    };

    const lys = Math.round(powerLevel(flow, connected, switchOn) * 100);

    return (
        <MicroGameScaffold
            title="Strømmen kommer inn i huset"
            subtitle="Slipp vannet løs, strekk ledningen, og skru på lyset i den mørke dalen"
            estimatedSeconds={150}
            onRetry={phase !== 'water' || flow > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 6.5, 17], fov: 42 },
                target: [0, 1.8, 0],
                background: '#33405f',
                fog: { near: 30, far: 58 },
                light: 'twilight',
            }}
            containerClassName="bg-gradient-to-b from-[#33405f] via-[#46527090] to-[#2b3550]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Norge, ca. 1900</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Vannføring', value: Math.round(flow), unit: '%' },
                            { label: 'Lys i huset', value: lys, unit: '%' },
                        ]}
                    />
                    <DragHint show={phase === 'water'} corner="bc">
                        Dra spaken under vinduet for å slippe vannet løs
                    </DragHint>
                </>
            }
            scene={
                <Valley
                    phase={phase}
                    flow={flow}
                    connected={connected}
                    switchOn={switchOn}
                    onConnected={onConnected}
                    onSwitch={flipSwitch}
                />
            }
        >
            <div className="flex flex-col gap-3">
                <StepTracker
                    current={phase === 'water' ? 0 : phase === 'wire' ? 1 : phase === 'switch' ? 2 : 3}
                    total={3}
                />

                <SceneSlider
                    label="Vannføring i fossen"
                    min={0}
                    max={100}
                    step={1}
                    value={flow}
                    onChange={onFlow}
                    valueLabel={(v) =>
                        v < 15 ? 'Stille' : v < FLOW_NEEDED ? 'Renner litt' : 'Full kraft'
                    }
                />

                {phase === 'water' && (
                    <p className="text-sm text-slate-600">
                        Norge hadde noe som passet perfekt: masse vann som rant nedover bratte
                        fjell. Dra spaken opp til full kraft, så fossen kan drive generatoren i
                        kraftverket.
                    </p>
                )}

                {phase === 'wire' && (
                    <p className="text-sm text-slate-600">
                        Klikk punktene i scenen etter tur: først kraftverket, så de to stolpene, og
                        til slutt huset. Da strekker du ledningen hele veien fram.
                    </p>
                )}

                {phase === 'switch' && (
                    <p className="text-sm text-slate-600">
                        Alt henger sammen nå. Klikk den lysende ringen ved huset for å skru på
                        bryteren.
                    </p>
                )}

                {fact && phase !== 'done' && <SceneFact>{fact}</SceneFact>}

                {phase === 'done' && (
                    <WinScreen title="Lyset kom inn i huset!" onReplay={reset}>
                        Pæra alene gir ikke lys. Strømmen må ha en hel vei å gå - fra fossen som
                        lager den, gjennom ledningene, helt inn i taket ditt. Det var nettopp dette
                        Edison forstod: han bygde ikke bare pæra, men hele systemet fra kraftverk til
                        stikkontakt. Prøv å dra vannføringen ned igjen, så ser du at lyset svekkes -
                        hele kjeden må virke samtidig.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Valley({
    phase,
    flow,
    connected,
    switchOn,
    onConnected,
    onSwitch,
}: {
    phase: Phase;
    flow: number;
    connected: boolean;
    switchOn: boolean;
    onConnected: () => void;
    onSwitch: () => void;
}) {
    return (
        <group>
            <GroundPlane size={46} depth={32} color="#2f4a33" />

            {/* Fjellet med fossen og kraftverket til venstre */}
            <Mountain />
            <Waterfall flow={flow} />
            <PowerPlant flow={flow} />

            {/* To kraftstolper mellom kraftverk og hus */}
            <Pole position={[-2.4, 0, 0]} />
            <Pole position={[2.2, 0, 0]} />

            {/* Gatelys og huset til hoyre */}
            <StreetLamp flow={flow} connected={connected} on={switchOn} />
            <House flow={flow} connected={connected} on={switchOn} />

            {/* Litt natur i dalen */}
            <Tree position={[8.6, 0, -3]} seed={3} />
            <Tree position={[-9.5, 0, 3.5]} seed={7} />
            <Tree position={[4.2, 0, -5]} seed={11} />

            {/* En person utenfor huset som venter pa lyset */}
            <Person position={[8.1, 0, 2.2]} rotation={[0, -0.6, 0]} pose="idle" body="#3b3a4a" />

            {/* Ledningen strekkes ved a klikke punktene etter tur */}
            {phase !== 'water' && (
                <Connector
                    nodes={NODES}
                    correct={CORRECT}
                    nodeRadius={0.4}
                    linkRadius={0.06}
                    onComplete={onConnected}
                />
            )}

            {/* Bryteren ved huset i siste steg */}
            {phase === 'switch' && (
                <Hotspot
                    position={[6.3, 1.0, 1.5]}
                    onSelect={onSwitch}
                    label="Skru pa lyset"
                    radius={0.5}
                    color="#fbbf24"
                />
            )}
        </group>
    );
}

// Et mørkt fjell bak kraftverket.
function Mountain() {
    return (
        <group position={[-9, 0, -1]}>
            <mesh position={[0, 3, 0]} castShadow receiveShadow>
                <coneGeometry args={[5, 7, 5]} />
                <meshStandardMaterial color="#384a52" roughness={1} flatShading />
            </mesh>
            <mesh position={[0, 6.1, 0]}>
                <coneGeometry args={[1.6, 1.6, 5]} />
                <meshStandardMaterial color="#cdd6dd" roughness={1} flatShading />
            </mesh>
        </group>
    );
}

// Fossen som faller fra fjellet ned i dammen. Bredde, lengde og glød følger
// vannføringen, og noen dråper renner nedover.
function Waterfall({ flow }: { flow: number }) {
    const sheet = useRef<THREE.Mesh>(null);
    const sheetMat = useRef<THREE.MeshStandardMaterial>(null);
    const drops = useRef<THREE.Group>(null);

    useFrame((_, dt) => {
        const f = flow / 100;
        if (sheet.current) {
            sheet.current.scale.x = damp(sheet.current.scale.x, 0.25 + f * 0.9, dt, 5);
        }
        if (sheetMat.current) {
            sheetMat.current.opacity = damp(sheetMat.current.opacity, 0.15 + f * 0.75, dt, 5);
        }
        if (drops.current) {
            const t = performance.now() / 1000;
            drops.current.children.forEach((d, i) => {
                const cycle = (t * (0.7 + f) + i / 6) % 1;
                d.position.y = 4.6 - cycle * 4;
                d.visible = f > 0.1;
                d.scale.setScalar(0.6 + f * 0.6);
            });
        }
    });

    return (
        <group position={[-7.4, 0, 0.4]}>
            {/* selve vannflaket */}
            <mesh ref={sheet} position={[0, 2.6, 0]}>
                <planeGeometry args={[1.1, 4.2]} />
                <meshStandardMaterial
                    ref={sheetMat}
                    color="#9fd3ef"
                    emissive="#6fb8e0"
                    emissiveIntensity={0.4}
                    transparent
                    opacity={0.15}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* dammen nederst */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0.4]}>
                <circleGeometry args={[1.3, 20]} />
                <meshStandardMaterial color="#2c6a8c" roughness={0.3} metalness={0.2} />
            </mesh>
            {/* dråper */}
            <group ref={drops}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <mesh key={i} position={[(i % 3) * 0.28 - 0.28, 3, (i % 2) * 0.1]}>
                        <sphereGeometry args={[0.09, 6, 6]} />
                        <meshStandardMaterial color="#cdeafa" emissive="#7fc0e6" emissiveIntensity={0.5} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// Kraftverket med en generator (tannhjul) som snurrer fortere jo mer vann.
function PowerPlant({ flow }: { flow: number }) {
    const f = flow / 100;
    return (
        <group position={[-6.4, 0, 0.4]}>
            <Building body="#5b6470" roof="#343c47" w={2.6} h={2.2} d={2.4} />
            {/* generatorhjulet på fasaden */}
            <group position={[0, 1.2, 1.25]}>
                <Gear radius={0.7} teeth={12} color="#8a929c" spin={f * 4.5} />
                <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.22, 0.22, 0.5, 16]} />
                    <meshStandardMaterial color="#c9a23a" metalness={0.5} roughness={0.4} />
                </mesh>
                {/* liten glød som vokser med kraften */}
                <GeneratorGlow level={f} />
            </group>
        </group>
    );
}

// Glød rundt generatoren som vokser med vannføringen (viser at det lages strøm).
function GeneratorGlow({ level }: { level: number }) {
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((_, dt) => {
        if (mat.current) {
            mat.current.opacity = damp(mat.current.opacity, level * 0.55, dt, 4);
        }
    });
    return (
        <mesh position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.95, 16, 16]} />
            <meshBasicMaterial
                ref={mat}
                color="#ffd86b"
                transparent
                opacity={0}
                side={THREE.BackSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    );
}

// En enkel kraftstolpe med tverrarm.
function Pole({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 1.6, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.13, 3.2, 7]} />
                <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 3.0, 0]} castShadow>
                <boxGeometry args={[1.1, 0.12, 0.12]} />
                <meshStandardMaterial color="#3a2e22" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Huset. Vinduene og en innvendig glød tennes når hele kjeden virker.
function House({
    flow,
    connected,
    on,
}: {
    flow: number;
    connected: boolean;
    on: boolean;
}) {
    const winMats = useRef<THREE.MeshStandardMaterial[]>([]);
    const lamp = useRef<THREE.PointLight>(null);
    const halo = useRef<THREE.MeshBasicMaterial>(null);
    const bulbMat = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((_, dt) => {
        const target = powerLevel(flow, connected, on);
        for (const m of winMats.current) {
            if (m) m.emissiveIntensity = damp(m.emissiveIntensity, target * 1.8, dt, 4);
        }
        if (lamp.current) {
            lamp.current.intensity = damp(lamp.current.intensity, target * 3.2, dt, 4);
        }
        if (halo.current) {
            halo.current.opacity = damp(halo.current.opacity, target * 0.5, dt, 4);
        }
        if (bulbMat.current) {
            bulbMat.current.emissiveIntensity = damp(
                bulbMat.current.emissiveIntensity,
                target * 2.4,
                dt,
                4
            );
        }
    });

    return (
        <group position={[6.3, 0, 0.4]}>
            <Building body="#7a4a32" roof="#3f2a1d" w={2.4} h={2.0} d={2.2} />

            {/* to vinduer på fasaden som lyser opp */}
            {[-0.55, 0.55].map((x, i) => (
                <mesh key={x} position={[x, 1.0, 1.12]}>
                    <planeGeometry args={[0.62, 0.78]} />
                    <meshStandardMaterial
                        ref={(m) => {
                            if (m) winMats.current[i] = m;
                        }}
                        color="#fff2c2"
                        emissive="#ffcf66"
                        emissiveIntensity={0}
                        roughness={0.6}
                    />
                </mesh>
            ))}

            {/* taklampe inni (vises gjennom glød/lys) */}
            <pointLight ref={lamp} position={[0, 1.3, 0]} color="#ffd27a" intensity={0} distance={9} />

            {/* en synlig lyspære på veggen ved døra */}
            <group position={[1.0, 1.25, 1.16]}>
                <mesh>
                    <sphereGeometry args={[0.16, 14, 14]} />
                    <meshStandardMaterial
                        ref={bulbMat}
                        color="#fff4cf"
                        emissive="#ffd24d"
                        emissiveIntensity={0}
                        roughness={0.3}
                    />
                </mesh>
                <mesh>
                    <sphereGeometry args={[0.36, 14, 14]} />
                    <meshBasicMaterial
                        ref={halo}
                        color="#ffdf8a"
                        transparent
                        opacity={0}
                        side={THREE.BackSide}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            </group>
        </group>
    );
}

// Et gatelys ved huset som også tennes når strømmen er framme.
function StreetLamp({
    flow,
    connected,
    on,
}: {
    flow: number;
    connected: boolean;
    on: boolean;
}) {
    const headMat = useRef<THREE.MeshStandardMaterial>(null);
    const light = useRef<THREE.PointLight>(null);
    const haloRef = useRef<THREE.Mesh>(null);

    useFrame((_, dt) => {
        const target = powerLevel(flow, connected, on);
        if (headMat.current) {
            headMat.current.emissiveIntensity = damp(
                headMat.current.emissiveIntensity,
                target * 2.2,
                dt,
                4
            );
        }
        if (light.current) {
            light.current.intensity = damp(light.current.intensity, target * 2.4, dt, 4);
        }
        if (haloRef.current) {
            const s = damp(haloRef.current.scale.x, 0.2 + target * 1, dt, 4);
            haloRef.current.scale.setScalar(s);
        }
    });

    return (
        <group position={[3.7, 0, 1.8]}>
            <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.09, 3, 7]} />
                <meshStandardMaterial color="#2c3340" roughness={0.8} />
            </mesh>
            <mesh position={[0, 3.05, 0]}>
                <sphereGeometry args={[0.22, 14, 14]} />
                <meshStandardMaterial
                    ref={headMat}
                    color="#fff2c2"
                    emissive="#ffd24d"
                    emissiveIntensity={0}
                    roughness={0.4}
                />
            </mesh>
            <mesh ref={haloRef} position={[0, 3.05, 0]} scale={0.2}>
                <sphereGeometry args={[0.5, 14, 14]} />
                <meshBasicMaterial
                    color="#ffe39c"
                    transparent
                    opacity={0.4}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            <pointLight ref={light} position={[0, 3.05, 0]} color="#ffd98a" intensity={0} distance={8} />
        </group>
    );
}

export default Stromveien3D;
