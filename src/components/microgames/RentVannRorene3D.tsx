import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Connector,
    Building,
    Person,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    StepTracker,
    DataReadout,
    DragHint,
    damp,
    Burst,
    type Pose,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til "Den usynlige revolusjonen: rent vann og kloakk".
//
// Lyspæra (rett fra artikkelen): byene ble friske da de skilte det rene vannet
// fra det skitne. Eleven ser et tverrsnitt av en syk by på 1800-tallet. Under
// bakken siver avføring fra en utedo ned i grunnvannet og forgifter brønnen
// folk drikker fra. Eleven legger to rør:
//   1. Et kloakkrør som leder avføringen vekk -> grunnvannet blir rent igjen.
//   2. Et rent vannrør fra vanntårnet til husene -> folk slipper å drikke
//      fra den skitne brønnen.
// Når begge rørene ligger, blir folk friske. Mekanikken ER poenget: separasjon
// av rent og skittent vann er det som reddet flest liv i historien.
//
// Mekanikk: Connector (rute/koble A->B). Eleven klikker en node, så en annen,
// og et rør tegnes mellom dem. Riktige par lyser grønt; scenen forvandles for
// hvert riktige rør.

const NODE_UTEDO = 'utedo';
const NODE_KLOAKK = 'kloakk';
const NODE_KILDE = 'kilde';
const NODE_HUS = 'hus';

const DIRTY_WATER = new THREE.Color('#6f7a3a');
const CLEAN_WATER = new THREE.Color('#3d7fa6');

const START_BANNER =
    'Byen er syk. Avføring siver ned i grunnvannet. Klikk to punkter for å legge et rør mellom dem.';

const RentVannRorene3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [sewerDone, setSewerDone] = useState(false);
    const [cleanDone, setCleanDone] = useState(false);
    const [banner, setBanner] = useState<string | null>(START_BANNER);
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);

    const healthLevel = (sewerDone ? 1 : 0) + (cleanDone ? 1 : 0);
    const done = sewerDone && cleanDone;

    const reset = () => {
        // Connector eier sine egne forbindelser; vi remounter det via key.
        setSewerDone(false);
        setCleanDone(false);
        setBanner(START_BANNER);
        setFact(null);
    };

    const finish = () => {
        setBanner(null);
        setFact(null);
        setBurst((b) => b + 1);
        window.setTimeout(() => onComplete({ score: 1, completed: true }), 400);
    };

    const handleConnect = (a: string, b: string, valid: boolean) => {
        if (!valid) {
            setBanner('Det røret hjelper ikke. Tenk: hvor skal det skitne vekk, og hvor skal det rene komme fra?');
            return;
        }
        const pair = [a, b];
        const isSewer = pair.includes(NODE_UTEDO) && pair.includes(NODE_KLOAKK);
        const isClean = pair.includes(NODE_KILDE) && pair.includes(NODE_HUS);
        if (isSewer && !sewerDone) {
            setSewerDone(true);
            sounds.play('advance');
            if (cleanDone) {
                finish();
            } else {
                setFact(
                    'Nå renner avføringen vekk i kloakken i stedet for ned i grunnvannet. Brønnen blir gradvis renere.'
                );
                setBanner('Bra! Legg nå et rent vannrør fra vanntårnet til husene.');
            }
        } else if (isClean && !cleanDone) {
            setCleanDone(true);
            sounds.play('advance');
            if (sewerDone) {
                finish();
            } else {
                setFact(
                    'Husene får rent vann rett fra vanntårnet, og slipper å drikke fra den skitne brønnen.'
                );
                setBanner('Bra! Legg nå et kloakkrør som leder avføringen vekk fra byen.');
            }
        }
    };

    const idleHint = healthLevel === 0;

    return (
        <MicroGameScaffold
            title="Den usynlige revolusjonen"
            subtitle="Legg rørene som skilte rent vann fra skittent, og gjør den syke byen frisk"
            estimatedSeconds={140}
            onRetry={healthLevel > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 1.6, 17], fov: 40 },
                target: [0, -1.2, 0],
                background: '#cfe3f0',
                fog: { near: 30, far: 64 },
                light: 'overcast',
                minPolarAngle: 1.05,
                maxPolarAngle: 1.5,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{done ? 'Byen er frisk' : 'London, 1854'}</SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Rør lagt', value: `${healthLevel} / 2` },
                                {
                                    label: 'Grunnvann',
                                    value: sewerDone ? 'Rent' : 'Forurenset',
                                },
                            ]}
                        />
                    )}
                    <DragHint show={idleHint} corner="bc">
                        Klikk en gul kule, så en annen, for å legge et rør
                    </DragHint>
                </>
            }
            scene={
                <CrossSection
                    sewerDone={sewerDone}
                    healthLevel={healthLevel}
                    burst={burst}
                    onConnect={handleConnect}
                    onComplete={() => sounds.play('complete')}
                    done={done}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done && <StepTracker current={healthLevel} total={2} />}

                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Du ser et tverrsnitt av byen. Under bakken ligger{' '}
                            <span className="font-bold text-sky-700">grunnvannet</span> som brønnen
                            henter fra. Klikk de gule kulene to og to for å legge rør: før det
                            skitne vekk i en <span className="font-bold">kloakk</span>, og hent inn{' '}
                            <span className="font-bold">rent vann</span> fra vanntårnet til husene.
                        </p>
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen title="Du skilte det rene vannet fra det skitne!" onReplay={reset}>
                        Dette var nettopp det byene gjorde på 1800-tallet. De la kloakkrør som
                        førte avføringen langt vekk, og rene vannrør som ga trygt drikkevann.
                        Plutselig kunne folk åpne en kran og drikke uten å bli syke. Disse
                        usynlige rørene under gata har trolig reddet flere menneskeliv enn noen
                        medisin, og likevel tenker vi nesten aldri på dem.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-TVERRSNITTET
// ============================================================

// Nivå i bakken (y-verdier).
const STREET_Y = 1.0; // gatenivå / bakkeoverflate
const WATER_Y = -3.0; // grunnvannsbaand

const HOUSE_X = [-2.4, 0.0, 2.4];

interface PersonSpec {
    x: number;
}
const PEOPLE: PersonSpec[] = [{ x: -2.8 }, { x: -0.4 }, { x: 1.8 }, { x: 3.4 }];

function CrossSection({
    sewerDone,
    healthLevel,
    burst,
    onConnect,
    onComplete,
    done,
}: {
    sewerDone: boolean;
    healthLevel: number;
    burst: number;
    onConnect: (a: string, b: string, valid: boolean) => void;
    onComplete: () => void;
    done: boolean;
}) {
    return (
        <group>
            {/* Lufta over bakken */}
            {/* Jordmasse (tverrsnittsflate) */}
            <mesh position={[0, (STREET_Y + -5.6) / 2, -0.2]} receiveShadow>
                <boxGeometry args={[20, STREET_Y + 5.6, 1.6]} />
                <meshStandardMaterial color="#7a5a3a" roughness={1} />
            </mesh>
            {/* Gatedekke på toppen */}
            <mesh position={[0, STREET_Y + 0.06, 0.3]} receiveShadow>
                <boxGeometry args={[20, 0.12, 1.4]} />
                <meshStandardMaterial color="#9a9189" roughness={0.95} />
            </mesh>

            {/* Grunnvannsbånd - rent eller forurenset */}
            <GroundWater sewerDone={sewerDone} />

            {/* Husene på gata */}
            {HOUSE_X.map((x, i) => (
                <Building
                    key={i}
                    position={[x, STREET_Y, 0.4]}
                    body={i % 2 === 0 ? '#a8623f' : '#9c5236'}
                    roof="#4f3326"
                    w={1.7}
                    h={1.5}
                    d={1.1}
                    seed={i + 2}
                />
            ))}

            {/* Folk foran husene - syke til vannet er trygt */}
            {PEOPLE.map((p, i) => (
                <Townsfolk key={i} x={p.x} healthLevel={healthLevel} seed={i} />
            ))}

            {/* Brønnpumpe i midten: skaft ned i grunnvannet + pumpehode */}
            <Pump />

            {/* Utedo til venstre med lekkasje ned i grunnvannet */}
            <Cesspit sewerDone={sewerDone} />

            {/* Vanntårn til høyre - den rene kilden */}
            <WaterTower />

            {/* Rør-leggingen: koble node til node */}
            <Connector
                nodes={[
                    { id: NODE_UTEDO, position: [-4.6, 0.4, 0.6], label: 'Utedo' },
                    { id: NODE_KLOAKK, position: [6.8, -4.4, 0.6], label: 'Kloakk ut' },
                    { id: NODE_KILDE, position: [7.2, 2.4, 0.6], label: 'Rent vann' },
                    { id: NODE_HUS, position: [-0.4, 1.9, 0.6], label: 'Husene' },
                ]}
                correct={[
                    [NODE_UTEDO, NODE_KLOAKK],
                    [NODE_KILDE, NODE_HUS],
                ]}
                nodeRadius={0.5}
                linkRadius={0.13}
                onConnect={onConnect}
                onComplete={onComplete}
            />

            {/* Feiring når byen er frisk */}
            <Burst position={[0, STREET_Y + 1.2, 0.6]} trigger={burst} color="#7ec8ff" count={26} spread={3.2} />
            {done && (
                <Burst position={[2.5, STREET_Y + 1.0, 0.6]} trigger={burst} color="#9ef0b0" count={18} spread={2.4} />
            )}
        </group>
    );
}

// Grunnvannsbåndet under bakken. Forurenset (gulgrønt) når avføringen siver
// ned, klarner mykt til blått når kloakkrøret leder det skitne vekk.
function GroundWater({ sewerDone }: { sewerDone: boolean }) {
    const band = useRef<THREE.MeshStandardMaterial>(null);
    const plume = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        const k = Math.min(1, dt * 1.6);
        if (band.current) band.current.color.lerp(sewerDone ? CLEAN_WATER : DIRTY_WATER, k);
        if (plume.current) {
            plume.current.opacity = damp(plume.current.opacity, sewerDone ? 0 : 0.72, dt, 1.8);
        }
    });
    return (
        <group>
            {/* Selve grunnvannet */}
            <mesh position={[0, WATER_Y, 0.45]}>
                <boxGeometry args={[19.4, 1.5, 0.6]} />
                <meshStandardMaterial
                    ref={band}
                    color="#6f7a3a"
                    roughness={0.3}
                    metalness={0.15}
                    emissive="#1e4d6b"
                    emissiveIntensity={0.16}
                />
            </mesh>
            {/* Forurensningssky rundt brønnen */}
            <mesh position={[0, WATER_Y, 0.6]}>
                <boxGeometry args={[6.2, 1.5, 0.5]} />
                <meshStandardMaterial
                    ref={plume}
                    color="#4f5a24"
                    transparent
                    opacity={0.72}
                    roughness={0.6}
                />
            </mesh>
        </group>
    );
}

// Brønnpumpa: et skaft fra gata ned i grunnvannet, med pumpehode og håndtak.
function Pump() {
    return (
        <group position={[0, 0, 0.7]}>
            {/* Skaft ned i grunnvannet */}
            <mesh position={[0, (STREET_Y + WATER_Y) / 2, 0]}>
                <cylinderGeometry args={[0.16, 0.16, STREET_Y - WATER_Y, 10]} />
                <meshStandardMaterial color="#3a4654" roughness={0.6} metalness={0.3} />
            </mesh>
            {/* Pumpehode på gata */}
            <mesh position={[0, STREET_Y + 0.5, 0]} castShadow>
                <boxGeometry args={[0.34, 0.9, 0.34]} />
                <meshStandardMaterial color="#2f3a45" roughness={0.5} metalness={0.35} />
            </mesh>
            {/* Håndtak */}
            <mesh position={[0.32, STREET_Y + 0.8, 0]} rotation={[0, 0, 0.5]} castShadow>
                <boxGeometry args={[0.6, 0.1, 0.1]} />
                <meshStandardMaterial color="#5a4632" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Utedo med en lekkasjekolonne som siver ned i grunnvannet. Lekkasjen tones bort
// når kloakkrøret er lagt.
function Cesspit({ sewerDone }: { sewerDone: boolean }) {
    const leak = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (leak.current) {
            leak.current.opacity = damp(leak.current.opacity, sewerDone ? 0 : 0.8, dt, 1.8);
        }
    });
    return (
        <group position={[-4.6, 0, 0.5]}>
            {/* Liten utedo-bod på gata */}
            <mesh position={[0, STREET_Y + 0.55, 0]} castShadow>
                <boxGeometry args={[0.9, 1.1, 0.9]} />
                <meshStandardMaterial color="#6b4f33" roughness={0.9} />
            </mesh>
            <mesh position={[0, STREET_Y + 1.25, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[0.7, 0.4, 4]} />
                <meshStandardMaterial color="#4a3624" roughness={0.9} />
            </mesh>
            {/* Lekkasjekolonne ned i grunnvannet */}
            <mesh position={[0, (STREET_Y + WATER_Y) / 2, 0.1]}>
                <boxGeometry args={[0.5, STREET_Y - WATER_Y, 0.3]} />
                <meshStandardMaterial
                    ref={leak}
                    color="#5a4a1e"
                    transparent
                    opacity={0.8}
                    roughness={0.9}
                />
            </mesh>
        </group>
    );
}

// Vanntårn til høyre - den rene kilden røret henter fra.
function WaterTower() {
    return (
        <group position={[7.2, 0, 0.5]}>
            {/* Ben */}
            {[-0.45, 0.45].map((dx) => (
                <mesh key={dx} position={[dx, STREET_Y + 0.6, 0]} castShadow>
                    <boxGeometry args={[0.16, 1.2, 0.16]} />
                    <meshStandardMaterial color="#5a6470" roughness={0.6} metalness={0.3} />
                </mesh>
            ))}
            {/* Tank */}
            <mesh position={[0, STREET_Y + 1.8, 0]} castShadow>
                <cylinderGeometry args={[0.85, 0.85, 1.1, 14]} />
                <meshStandardMaterial color="#3d7fa6" roughness={0.4} metalness={0.2} emissive="#1e4d6b" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0, STREET_Y + 2.45, 0]} castShadow>
                <coneGeometry args={[0.95, 0.5, 14]} />
                <meshStandardMaterial color="#2f6786" roughness={0.5} />
            </mesh>
        </group>
    );
}

// En innbygger som er syk til vannet blir trygt. Sykdomsgrad styres av
// healthLevel (0 = alvorlig syk, 1 = bedre, 2 = frisk).
function Townsfolk({ x, healthLevel, seed }: { x: number; healthLevel: number; seed: number }) {
    // Diskret utseende per helsetilstand - ingen per-frame state.
    let pose: Pose;
    let skin: string;
    let body: string;
    if (healthLevel >= 2) {
        pose = 'raise';
        skin = '#e8c49a';
        body = seed % 2 === 0 ? '#3f6ea5' : '#7a4f6b';
    } else if (healthLevel === 1) {
        pose = 'idle';
        skin = '#cdbf94';
        body = '#6b6450';
    } else {
        pose = 'sit';
        skin = '#9fb38a';
        body = '#5d5a4a';
    }
    return (
        <Person
            position={[x, STREET_Y, 1.0]}
            rotation={[0, -0.2, 0]}
            scale={0.92}
            pose={pose}
            skin={skin}
            body={body}
            legs="#39312a"
        />
    );
}

export default RentVannRorene3D;
