import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Snowflake } from 'lucide-react';
import {
    MicroGameScaffold,
    Hotspot,
    SceneSlider,
    StepTracker,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    DataReadout,
    DragHint,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Kjøleskapet og maten som holdt seg".
// Lyspære: et kjøleskap lager ikke kulde. Det FLYTTER varmen ut av maten og
// dumper den i rommet. Trikset er en væske som fordamper inne (og suger til seg
// varme) og presses sammen ute (og slipper varmen). Eleven kjenner det slik:
//   Steg 1-4: følg kjølevæsken rundt det lukkede kretsløpet ved å klikke de fire
//     delene i riktig rekkefølge. Hver del forklarer hva den gjør med væsken.
//   Finale: skru på kompressoren med en spak. Væsken suser rundt, maten blir
//     kald, og varmen strømmer synlig ut bak kjøleskapet, inn i rommet.

// --- Loopen: en firkant kjølevæsken går rundt, tegnet foran kjøleskapet ---
// Rekkefølge (væskens vei): fordamper (topp venstre) -> ned -> kompressor
// (bunn venstre) -> bort -> opp -> kondensator (høyre) -> opp -> strupeventil
// (topp) -> tilbake til fordamper.
const CORNERS: [number, number][] = [
    [-1.6, 3.6], // TL - ved fordamperen
    [-1.6, 0.7], // BL - ved kompressoren
    [2.0, 0.7], // BR
    [2.0, 3.6], // TR
];
const LOOP_Z = 1.35;

// Segment-lengder rundt firkanten (inkludert lukkingen TR -> TL).
const SEG: { a: [number, number]; b: [number, number]; len: number }[] = CORNERS.map((c, i) => {
    const a = c;
    const b = CORNERS[(i + 1) % CORNERS.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { a, b, len };
});
const TOTAL_LEN = SEG.reduce((s, g) => s + g.len, 0);

// Posisjon langs loopen ved parameter u i [0,1).
function loopPos(u: number): [number, number] {
    let d = ((u % 1) + 1) % 1;
    d *= TOTAL_LEN;
    for (const g of SEG) {
        if (d <= g.len) {
            const f = g.len === 0 ? 0 : d / g.len;
            return [g.a[0] + (g.b[0] - g.a[0]) * f, g.a[1] + (g.b[1] - g.a[1]) * f];
        }
        d -= g.len;
    }
    return CORNERS[0];
}

// Kjølevæskens farge forteller tilstanden dens langs veien.
const C_COLD_GAS = '#7dd3fc'; // fordamper -> kompressor: kald lavtrykksgass
const C_HOT_GAS = '#ef4444'; // kompressor -> kondensator: brennhet gass
const C_WARM_LIQ = '#f59e0b'; // kondensator -> ventil: væske som gir fra seg varme
const C_COLD_LIQ = '#2563eb'; // ventil -> fordamper: iskald væske

function segmentColor(u: number): string {
    const d = ((u % 1) + 1) % 1;
    if (d < 0.28) return C_COLD_GAS;
    if (d < 0.6) return C_HOT_GAS;
    if (d < 0.86) return C_WARM_LIQ;
    return C_COLD_LIQ;
}

type StationKind = 'evaporator' | 'compressor' | 'condenser' | 'valve';
interface Station {
    id: StationKind;
    name: string;
    pos: [number, number, number];
    hint: string;
    banner: string;
    fact: string;
}

const STATIONS: Station[] = [
    {
        id: 'evaporator',
        name: 'Fordamperen',
        pos: [-1.6, 3.2, LOOP_Z],
        hint: 'Klikk fordamperen inne i kjøleskapet',
        banner: 'Fordamperen: her koker den iskalde væsken og blir til gass. Da suger den varmen rett ut av maten.',
        fact: 'Fordamperen er de kalde rørene inne i kjøleskapet. Når væske blir til gass, må den ha energi, og den energien tar den som varme fra maten rundt. Derfor blir maten kald.',
    },
    {
        id: 'compressor',
        name: 'Kompressoren',
        pos: [-1.6, 0.7, LOOP_Z],
        hint: 'Klikk kompressoren nederst',
        banner: 'Kompressoren presser gassen hardt sammen. Trykket gjør gassen brennhet.',
        fact: 'Kompressoren er den lille pumpa nederst som durer. Når du klemmer en gass sammen, blir den varm. Nå er gassen varmere enn rommet, og det er nettopp poenget.',
    },
    {
        id: 'condenser',
        name: 'Kondensatoren',
        pos: [2.0, 2.05, LOOP_Z],
        hint: 'Klikk kondensatoren bak kjøleskapet',
        banner: 'Kondensatoren sitter bak kjøleskapet. Her slipper den varme gassen varmen ut i rommet og blir væske igjen.',
        fact: 'Kondensatoren er de svarte rørene bak kjøleskapet. Fordi gassen er varmere enn rommet, strømmer varmen ut i luften. Kjenn bak et ekte kjøleskap: der er det varmt.',
    },
    {
        id: 'valve',
        name: 'Strupeventilen',
        pos: [0.2, 3.6, LOOP_Z],
        hint: 'Klikk strupeventilen på toppen',
        banner: 'Strupeventilen slipper væsken gjennom en trang åpning. Trykket faller, og væsken blir iskald igjen.',
        fact: 'I strupeventilen presses væsken gjennom et smalt hull. Da faller trykket brått, og væsken blir iskald. Nå er den klar til å suge varme i fordamperen, og runden starter på nytt.',
    },
];

const COLD_TARGET = 4; // °C maten skal ned til
const START_TEMP = 18; // °C maten starter på
const ROOM_BASE = 20; // °C rommet starter på

const Kjoleskapet3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [learnStep, setLearnStep] = useState(0); // 0..4 deler forstått
    const [pumpSpeed, setPumpSpeed] = useState(0); // 0..1 kompressor-spak
    const [foodTemp, setFoodTemp] = useState(START_TEMP);
    const [roomTemp, setRoomTemp] = useState(ROOM_BASE);
    const [done, setDone] = useState(false);
    const [banner, setBanner] = useState<string | null>(
        'Følg kjølevæsken rundt. Klikk den gule ringen ved fordamperen for å starte.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [resetKey, setResetKey] = useState(0);

    const phase: 'learn' | 'run' = learnStep < STATIONS.length ? 'learn' : 'run';

    const reset = () => {
        setLearnStep(0);
        setPumpSpeed(0);
        setFoodTemp(START_TEMP);
        setRoomTemp(ROOM_BASE);
        setDone(false);
        setBanner('Følg kjølevæsken rundt. Klikk den gule ringen ved fordamperen for å starte.');
        setFact(null);
        setResetKey((k) => k + 1);
    };

    // Klikk på riktig del: bare den neste i rekkefølgen er klikkbar.
    const clickStation = (i: number) => {
        if (i !== learnStep) return;
        const st = STATIONS[i];
        const next = i + 1;
        setLearnStep(next);
        setBanner(st.banner);
        setFact(st.fact);
        if (next >= STATIONS.length) {
            sounds.play('correct');
            window.setTimeout(() => {
                sounds.play('sceneChange');
                setBanner('Nå kjenner du hele kretsløpet. Skru på kompressoren og se hva som skjer.');
                setFact(
                    'Legg merke til at det er ett lukket kretsløp. Den samme væsken går rundt og rundt: den suger varme inne og slipper den ut igjen bak.'
                );
            }, 1600);
        } else {
            sounds.play('advance');
        }
    };

    // Temperaturen speiles fra scenens useFrame, og vi reagerer på selve
    // hendelsen (maten når målet) - aldri setState hver frame.
    const handleTemp = (food: number, room: number) => {
        setFoodTemp(food);
        setRoomTemp(room);
        if (!done && food <= COLD_TARGET + 1) {
            setDone(true);
            setBurst((b) => b + 1);
            sounds.play('complete');
            setBanner(null);
            window.setTimeout(() => onComplete({ score: 1, completed: true }), 300);
        }
    };

    const running = phase === 'run' && pumpSpeed > 0.08;
    const idleHint = learnStep === 0;

    return (
        <MicroGameScaffold
            title="Kjøleskapet: maskinen som flytter varme"
            subtitle="Følg kjølevæsken rundt kretsløpet, skru så på kompressoren og se varmen bli pumpet ut av maten"
            estimatedSeconds={160}
            onRetry={learnStep > 0 || pumpSpeed > 0 ? reset : undefined}
            canvas={{
                idle: false,
                controls: true,
                camera: { position: [1.6, 3.1, 8.8], fov: 42 },
                background: '#e8eef4',
                fog: { near: 22, far: 46 },
                light: 'overcast',
                target: [0.2, 2.0, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'learn'
                            ? STATIONS[Math.min(learnStep, STATIONS.length - 1)].name
                            : done
                              ? 'Kald!'
                              : 'Kjør kompressoren'}
                    </SceneBadge>
                    <DataReadout
                        items={[
                            { label: 'Maten', value: foodTemp, unit: '°C' },
                            { label: 'Rommet', value: roomTemp, unit: '°C' },
                        ]}
                        corner="bl"
                    />
                    <DragHint show={idleHint} corner="bc">
                        Klikk den gule ringen ved fordamperen
                    </DragHint>
                </>
            }
            scene={
                <FridgeScene
                    key={resetKey}
                    learnStep={learnStep}
                    phase={phase}
                    pumpSpeed={pumpSpeed}
                    running={running}
                    burst={burst}
                    onStation={clickStation}
                    onTemp={handleTemp}
                />
            }
        >
            {phase === 'learn' && (
                <div className="flex flex-col gap-2.5">
                    <StepTracker current={learnStep} total={STATIONS.length} />
                    <p className="text-sm text-slate-600">
                        {learnStep < STATIONS.length
                            ? `Klikk ${STATIONS[learnStep].name.toLowerCase()} for å følge kjølevæsken videre. Se på fargen: den forteller om væsken er kald eller varm akkurat der.`
                            : 'Alle fire delene er på plass.'}
                    </p>
                    {fact && <SceneFact>{fact}</SceneFact>}
                </div>
            )}

            {phase === 'run' && !done && (
                <div className="flex flex-col gap-2.5">
                    <p className="text-sm text-slate-600">
                        Skru opp kompressoren. Da suser væsken raskere rundt, den suger mer varme ut
                        av maten, og du ser varmen strømme ut bak kjøleskapet. Følg med på tallene:
                        maten blir kaldere, rommet litt varmere.
                    </p>
                    <SceneSlider
                        label="Kompressoren: hvor hardt skal pumpa jobbe?"
                        min={0}
                        max={1}
                        step={0.01}
                        value={pumpSpeed}
                        onChange={setPumpSpeed}
                        valueLabel={(v) => (v < 0.08 ? 'Av' : v < 0.5 ? 'Rolig' : 'For fullt')}
                    />
                    {fact && <SceneFact>{fact}</SceneFact>}
                </div>
            )}

            {done && (
                <WinScreen title="Maten er kald!" onReplay={reset}>
                    <span className="inline-flex items-center gap-1.5">
                        <Snowflake className="w-4 h-4 text-sky-500" />
                        Kjøleskapet lagde aldri noe kulde.
                    </span>{' '}
                    Det flyttet varmen ut av maten og dumpet den i rommet. Væsken sugde varme inne i
                    fordamperen og ga den fra seg bak, i kondensatoren. Derfor ble maten kald mens
                    rommet ble litt varmere. Det er derfor det alltid er varmt bak et kjøleskap.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function FridgeScene({
    learnStep,
    phase,
    pumpSpeed,
    running,
    burst,
    onStation,
    onTemp,
}: {
    learnStep: number;
    phase: 'learn' | 'run';
    pumpSpeed: number;
    running: boolean;
    burst: number;
    onStation: (i: number) => void;
    onTemp: (food: number, room: number) => void;
}) {
    // Kjølevæsken flyter alltid, men saktere før kompressoren skrus på, så du
    // rekker å se den lukkede runden.
    const phaseRef = useRef(0);
    // Temperaturene lever i refs (sannheten), speiles til state kun når heltallet
    // endrer seg. Aldri setState hver frame.
    const foodRef = useRef(START_TEMP);
    const roomRef = useRef(ROOM_BASE);
    const lastFood = useRef(START_TEMP);
    const lastRoom = useRef(ROOM_BASE);

    const dotRefs = useRef<(THREE.Mesh | null)[]>([]);
    const DOT_COUNT = 16;
    const dots = useMemo(() => Array.from({ length: DOT_COUNT }, (_, i) => i / DOT_COUNT), []);

    const pistonRef = useRef<THREE.Group>(null);
    const interiorRef = useRef<THREE.MeshStandardMaterial>(null);
    const frostRef = useRef<THREE.Group>(null);

    useFrame((_, dt) => {
        // Flyt-fart: rolig i lære-fasen, øker med kompressoren i finalen.
        const flow = phase === 'run' ? 0.05 + pumpSpeed * 0.55 : 0.06;
        phaseRef.current = (phaseRef.current + flow * dt) % 1;

        // Flytt og fargelegg hver dråpe langs loopen.
        for (let i = 0; i < DOT_COUNT; i++) {
            const m = dotRefs.current[i];
            if (!m) continue;
            const u = (dots[i] + phaseRef.current) % 1;
            const [x, y] = loopPos(u);
            m.position.set(x, y, LOOP_Z);
            const col = segmentColor(u);
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.color.set(col);
            mat.emissive.set(col);
        }

        // Kompressor-stempelet dunker i takt med farten.
        if (pistonRef.current) {
            const beat = phase === 'run' ? pumpSpeed : 0;
            const bob = Math.sin(phaseRef.current * Math.PI * 2 * 6) * 0.12 * beat;
            pistonRef.current.position.y = 0.7 + bob;
        }

        // Temperatur: pumpa flytter varme fra maten til rommet.
        if (running) {
            foodRef.current = damp(foodRef.current, COLD_TARGET, dt, 0.16 + pumpSpeed * 0.28);
            const roomTarget = ROOM_BASE + pumpSpeed * 3.2;
            roomRef.current = damp(roomRef.current, roomTarget, dt, 0.25);
        }
        const fi = Math.round(foodRef.current);
        const ri = Math.round(roomRef.current);
        if (fi !== lastFood.current || ri !== lastRoom.current) {
            lastFood.current = fi;
            lastRoom.current = ri;
            onTemp(fi, ri);
        }

        // Innsiden blir kaldere (blåere) etter hvert som maten kjøles ned.
        if (interiorRef.current) {
            const cold = 1 - (foodRef.current - COLD_TARGET) / (START_TEMP - COLD_TARGET); // 0..1
            const c = new THREE.Color('#e6eef6').lerp(new THREE.Color('#bfe0f5'), Math.max(0, cold));
            interiorRef.current.color.lerp(c, Math.min(1, dt * 3));
        }
        // Rimet inne dukker fram når det er kaldt nok.
        if (frostRef.current) {
            const want = foodRef.current < 9 ? 1 : 0;
            const s = damp(frostRef.current.scale.x, want, dt, 3);
            frostRef.current.scale.setScalar(s);
        }
    });

    const targetIdx = Math.min(learnStep, STATIONS.length);

    return (
        <group>
            <Room />
            <FridgeCabinet interiorRef={interiorRef} frostRef={frostRef} />

            {/* Rørene rundt kretsløpet */}
            <LoopPipes />

            {/* Kjølevæsken som suser rundt */}
            <group>
                {dots.map((_, i) => (
                    <mesh
                        key={i}
                        ref={(el) => {
                            dotRefs.current[i] = el;
                        }}
                    >
                        <sphereGeometry args={[0.11, 10, 10]} />
                        <meshStandardMaterial
                            color={C_COLD_LIQ}
                            emissive={C_COLD_LIQ}
                            emissiveIntensity={0.7}
                            toneMapped={false}
                            roughness={0.4}
                        />
                    </mesh>
                ))}
            </group>

            {/* De fire delene */}
            {STATIONS.map((st, i) => (
                <StationObject
                    key={st.id}
                    kind={st.id}
                    position={st.pos}
                    state={i < learnStep ? 'done' : i === learnStep ? 'active' : 'locked'}
                    running={running}
                />
            ))}

            {/* Klikk-ringen på den delen som er nestemann */}
            {phase === 'learn' && targetIdx < STATIONS.length && (
                <Hotspot
                    position={[
                        STATIONS[targetIdx].pos[0],
                        STATIONS[targetIdx].pos[1] + 0.75,
                        STATIONS[targetIdx].pos[2],
                    ]}
                    onSelect={() => onStation(targetIdx)}
                    label={STATIONS[targetIdx].hint}
                    radius={0.5}
                />
            )}

            {/* Kompressor-pumpa (stempel) nederst */}
            <group ref={pistonRef} position={[-1.6, 0.7, LOOP_Z]}>
                <mesh position={[0, 0.28, 0]} castShadow>
                    <boxGeometry args={[0.16, 0.5, 0.16]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
                </mesh>
            </group>

            {/* Feiringspartikler ved seier */}
            <Burst position={[-0.4, 2.4, 1.4]} trigger={burst} color="#dbeafe" count={34} spread={3.6} />
        </group>
    );
}

// --- Rommet: gulv + en svak vegg bak, så høyre side leses som "rommet" ---
function Room() {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0, -0.5]} receiveShadow>
                <planeGeometry args={[26, 20]} />
                <meshStandardMaterial color="#e9ddc4" roughness={1} />
            </mesh>
            <mesh position={[0.4, 4, -3.2]} receiveShadow>
                <planeGeometry args={[26, 12]} />
                <meshStandardMaterial color="#f2ede2" roughness={1} />
            </mesh>
        </group>
    );
}

// --- Kjøleskapet: hvit kabinett med åpen front, hylle og mat inni ---
function FridgeCabinet({
    interiorRef,
    frostRef,
}: {
    interiorRef: React.RefObject<THREE.MeshStandardMaterial | null>;
    frostRef: React.RefObject<THREE.Group | null>;
}) {
    const CX = -0.4; // sentrum i x (venstre 2/3 av scenen)
    const W = 3.3;
    const H = 3.9;
    const D = 1.9;
    const wall = '#e7ecf1';
    // Kabinettet tegnes med bakvegg, gulv, tak og to sidevegger - men INGEN
    // front, så vi ser rett inn (utsnitt).
    return (
        <group position={[CX, H / 2 + 0.05, 0.1]}>
            {/* bakvegg */}
            <mesh position={[0, 0, -D / 2]} receiveShadow>
                <boxGeometry args={[W, H, 0.12]} />
                <meshStandardMaterial ref={interiorRef} color="#e6eef6" roughness={0.9} />
            </mesh>
            {/* tak + gulv */}
            {[H / 2 - 0.06, -H / 2 + 0.06].map((y) => (
                <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
                    <boxGeometry args={[W, 0.12, D]} />
                    <meshStandardMaterial color={wall} roughness={0.85} />
                </mesh>
            ))}
            {/* sidevegger */}
            {[-W / 2 + 0.06, W / 2 - 0.06].map((x) => (
                <mesh key={x} position={[x, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.12, H, D]} />
                    <meshStandardMaterial color={wall} roughness={0.85} />
                </mesh>
            ))}
            {/* en hylle i midten */}
            <mesh position={[0, -0.15, 0.1]} castShadow>
                <boxGeometry args={[W - 0.4, 0.06, D - 0.5]} />
                <meshStandardMaterial color="#dfe6ec" transparent opacity={0.8} roughness={0.6} />
            </mesh>
            {/* mat: melkekartong + eple + en bolle */}
            <group position={[-0.55, 0.35, 0.15]}>
                <mesh castShadow>
                    <boxGeometry args={[0.42, 0.7, 0.42]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.45, 0]} castShadow>
                    <coneGeometry args={[0.3, 0.28, 4]} />
                    <meshStandardMaterial color="#dbe4ec" roughness={0.7} />
                </mesh>
            </group>
            <mesh position={[0.35, 0.22, 0.2]} castShadow>
                <sphereGeometry args={[0.24, 14, 14]} />
                <meshStandardMaterial color="#d1442f" roughness={0.6} />
            </mesh>
            <mesh position={[0.62, -0.62, 0.15]} castShadow>
                <cylinderGeometry args={[0.4, 0.32, 0.28, 16]} />
                <meshStandardMaterial color="#e2b23a" roughness={0.6} />
            </mesh>
            {/* rim/is som dukker fram når det blir kaldt */}
            <group ref={frostRef} scale={0}>
                {[
                    [-0.9, 1.2, 0.2],
                    [0.7, 1.4, 0.1],
                    [-0.2, 1.5, 0.3],
                    [1.0, 0.4, 0.2],
                    [-1.1, -0.2, 0.2],
                ].map((p, i) => (
                    <mesh key={i} position={p as [number, number, number]}>
                        <octahedronGeometry args={[0.09, 0]} />
                        <meshStandardMaterial
                            color="#ffffff"
                            emissive="#cfe8ff"
                            emissiveIntensity={0.5}
                            roughness={0.4}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// --- Rørene: fire tynne bokser langs firkanten ---
function LoopPipes() {
    return (
        <group>
            {SEG.map((g, i) => {
                const midX = (g.a[0] + g.b[0]) / 2;
                const midY = (g.a[1] + g.b[1]) / 2;
                const horizontal = Math.abs(g.b[0] - g.a[0]) > Math.abs(g.b[1] - g.a[1]);
                const args: [number, number, number] = horizontal
                    ? [g.len + 0.1, 0.13, 0.13]
                    : [0.13, g.len + 0.1, 0.13];
                return (
                    <mesh key={i} position={[midX, midY, LOOP_Z]} castShadow>
                        <boxGeometry args={args} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.5} />
                    </mesh>
                );
            })}
            {/* hjørne-kuler så røret ser sammenhengende ut */}
            {CORNERS.map((c, i) => (
                <mesh key={i} position={[c[0], c[1], LOOP_Z]}>
                    <sphereGeometry args={[0.11, 10, 10]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.5} />
                </mesh>
            ))}
        </group>
    );
}

// --- En del i kretsløpet, tegnet gjenkjennelig og farget etter tilstand ---
function StationObject({
    kind,
    position,
    state,
    running,
}: {
    kind: StationKind;
    position: [number, number, number];
    state: 'done' | 'active' | 'locked';
    running: boolean;
}) {
    const group = useRef<THREE.Group>(null);
    const glow = state === 'active' ? 0.6 : 0;
    // Aktiv del pulserer lett så blikket trekkes dit.
    useFrame((_, dt) => {
        if (!group.current) return;
        const want = state === 'locked' ? 0.85 : 1;
        const s = damp(group.current.scale.x, want, dt, 6);
        group.current.scale.setScalar(s);
    });
    const dim = state === 'locked';
    const opacity = dim ? 0.5 : 1;

    return (
        <group ref={group} position={position}>
            {kind === 'evaporator' && (
                <group>
                    {[-0.28, 0, 0.28].map((y) => (
                        <mesh key={y} position={[0, y, 0]} castShadow>
                            <boxGeometry args={[1.1, 0.1, 0.1]} />
                            <meshStandardMaterial
                                color="#93c5fd"
                                emissive="#60a5fa"
                                emissiveIntensity={0.3 + glow}
                                transparent
                                opacity={opacity}
                                roughness={0.5}
                            />
                        </mesh>
                    ))}
                    {running && <HeatArrows dir={[-0.9, 0, 0]} color="#38bdf8" />}
                </group>
            )}

            {kind === 'compressor' && (
                <group>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.42, 0.48, 0.7, 18]} />
                        <meshStandardMaterial
                            color="#334155"
                            emissive="#f97316"
                            emissiveIntensity={glow}
                            transparent
                            opacity={opacity}
                            metalness={0.4}
                            roughness={0.5}
                        />
                    </mesh>
                    <mesh position={[0.44, 0.1, 0]} castShadow>
                        <boxGeometry args={[0.3, 0.34, 0.34]} />
                        <meshStandardMaterial color="#1f2937" transparent opacity={opacity} />
                    </mesh>
                </group>
            )}

            {kind === 'condenser' && (
                <group>
                    {[-0.5, -0.25, 0, 0.25, 0.5].map((y) => (
                        <mesh key={y} position={[0, y, 0]} castShadow>
                            <boxGeometry args={[0.7, 0.08, 0.12]} />
                            <meshStandardMaterial
                                color="#475569"
                                emissive="#ef4444"
                                emissiveIntensity={(running ? 0.4 : 0.15) + glow}
                                transparent
                                opacity={opacity}
                                metalness={0.3}
                                roughness={0.6}
                            />
                        </mesh>
                    ))}
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[0.06, 1.1, 0.06]} />
                        <meshStandardMaterial color="#334155" transparent opacity={opacity} />
                    </mesh>
                    {running && <HeatArrows dir={[1.1, 0, 0]} color="#f97316" />}
                </group>
            )}

            {kind === 'valve' && (
                <group rotation={[0, 0, Math.PI / 2]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.06, 0.28, 0.34, 14]} />
                        <meshStandardMaterial
                            color="#b45309"
                            emissive="#f59e0b"
                            emissiveIntensity={0.2 + glow}
                            transparent
                            opacity={opacity}
                            metalness={0.5}
                            roughness={0.4}
                        />
                    </mesh>
                    <mesh position={[0, -0.34, 0]} castShadow>
                        <cylinderGeometry args={[0.28, 0.06, 0.34, 14]} />
                        <meshStandardMaterial
                            color="#2563eb"
                            emissive="#2563eb"
                            emissiveIntensity={0.2 + glow}
                            transparent
                            opacity={opacity}
                            roughness={0.4}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
}

// --- Varme-piler: tre kjegler som glir utover og gjentar, viser at varme
// flytter seg. Drives av én fase-ref (aldri lest i render), så bevegelsen er myk
// og uten drift. ---
const ARROW_SPAN = 1.2; // hvor langt hver pil glir før den starter forfra
function HeatArrows({ dir, color }: { dir: [number, number, number]; color: string }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const phase = useRef(0);
    const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    const nx = dir[0] / len;
    const ny = dir[1] / len;
    // Roter kjeglen (peker +Y som standard) mot retningen i XY-planet.
    const rotZ = Math.atan2(ny, nx) - Math.PI / 2;
    useFrame((_, dt) => {
        phase.current = (phase.current + dt * 0.7) % 1;
        for (let i = 0; i < 3; i++) {
            const m = refs.current[i];
            if (!m) continue;
            const d = ((phase.current + i / 3) % 1) * ARROW_SPAN;
            m.position.set(nx * d, ny * d, 0.22);
            const mat = m.material as THREE.MeshStandardMaterial;
            // fade inn ved start, ut mot slutten
            mat.opacity = Math.sin((d / ARROW_SPAN) * Math.PI) * 0.9;
        }
    });
    return (
        <group>
            {[0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                    rotation={[0, 0, rotZ]}
                >
                    <coneGeometry args={[0.11, 0.26, 8]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.8}
                        toneMapped={false}
                        transparent
                        opacity={0.6}
                    />
                </mesh>
            ))}
        </group>
    );
}

export default Kjoleskapet3D;
