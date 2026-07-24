import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Ship } from 'lucide-react';
import {
    MicroGameScaffold,
    Draggable,
    Hotspot,
    GroundPlane,
    WaterPlane,
    Building,
    Person,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    DataReadout,
    StepTracker,
    damp,
    Burst,
    useAmbience,
    THEMES,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Hansakoggen i Bergen (1400-tallet).
// Pedagogisk kjerne (ÉN innsikt): Hansaen kontrollerte handelen i Bergen -
// varene og fortjenesten gikk gjennom de tyske kjøpmennene (Kontoret), ikke
// kongen. Eleven kjenner det på kroppen: hun laster tørrfisk om bord, sender
// koggen til Europa, og når sølvet kommer tilbake MÅ hun dra kista til Kontoret.
// Prøver hun å gi sølvet til kongen, får hun beskjed om at all handel gikk
// gjennom hansakjøpmennene. Til slutt viser en måler at storparten ble deres.

type Phase = 'load' | 'sail' | 'voyage' | 'split' | 'done';
type SailStage = 'idle' | 'out' | 'back';

const t = THEMES.medieval;

const FISH_TOTAL = 3;

// Steder på kaia (x, z) - brukes til snap og plassering.
const KONTOR: [number, number] = [-4.6, -3.1];
const KONGE: [number, number] = [-4.6, 3.2];
// Koggen ligger PÅ VANNET langs kaikanten (kaia ender ved x≈1.0, skroget er
// 4.2 langt) - ikke oppå kaia.
const SHIP_X = 3.2;
const CHEST_START: [number, number, number] = [SHIP_X + 0.2, 0.55, 0];

// Startposisjoner for de tre tørrfisk-stablene på kaia.
const FISH_STARTS: [number, number, number][] = [
    [-5.8, 0, 2.6],
    [-6.6, 0, 0.6],
    [-5.8, 0, -1.4],
];

// Fakta som dukker opp for hver tørrfisk-stabel - korte, for en 14-åring.
const FISH_FACTS = [
    'Tørrfisk er tørket torsk fra Nord-Norge. Den kunne holde seg i årevis, og var Norges viktigste eksportvare i middelalderen.',
    'Nordlendingene seilte fisken til Bergen. Der overtok de tyske hansakjøpmennene alt salget videre ut til Europa.',
    'Koggen er full. Nå kan hansakjøpmennene sende fisken sørover og hente dyre varer tilbake.',
];

const Hansakoggen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const ambience = useAmbience('waves');

    const [phase, setPhase] = useState<Phase>('load');
    const [sailStage, setSailStage] = useState<SailStage>('idle');
    const [loaded, setLoaded] = useState(0);
    const [returned, setReturned] = useState(false);
    const [chestKey, setChestKey] = useState(0); // remonterer sølvkista ved feil slipp
    const [runId, setRunId] = useState(0); // remonterer scenen ved reset
    const [banner, setBanner] = useState<string | null>(
        'Last tørrfisken om bord i koggen. Dra en stabel fra kaia ut på skipet.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const doneRef = useRef(false);
    const chestResolved = useRef(false);

    const reset = () => {
        doneRef.current = false;
        chestResolved.current = false;
        setPhase('load');
        setSailStage('idle');
        setLoaded(0);
        setReturned(false);
        setChestKey(0);
        setBanner('Last tørrfisken om bord i koggen. Dra en stabel fra kaia ut på skipet.');
        setFact(null);
        setRunId((r) => r + 1);
    };

    // Én tørrfisk-stabel lastet om bord.
    const loadFish = () => {
        const next = loaded + 1;
        ambience.start();
        setLoaded(next);
        setFact(FISH_FACTS[Math.min(next - 1, FISH_FACTS.length - 1)]);
        if (next >= FISH_TOTAL) {
            sounds.play('advance');
            setPhase('sail');
            setBanner('Koggen er lastet med tørrfisk. Send den ut til Europa.');
        } else {
            sounds.play('correct');
        }
    };

    // Send koggen ut fra kaia.
    const setSail = () => {
        if (phase !== 'sail') return;
        sounds.play('sceneChange');
        ambience.start();
        setPhase('voyage');
        setSailStage('out');
        setFact(null);
        setBanner('Koggen seiler til de tyske hansabyene med last av tørrfisk.');
    };

    // Koggen er framme i Europa - fisken byttes i korn, mel og sølv.
    const reachEurope = () => {
        sounds.play('correct');
        setReturned(true);
        setSailStage('back');
        setBanner('I Europa byttes tørrfisken i korn, mel og sølv. Koggen snur hjem.');
    };

    // Koggen er tilbake i Bergen med sølv.
    const returnHome = () => {
        sounds.play('advance');
        setPhase('split');
        setSailStage('idle');
        setBanner('Sølvet er hjemme. Dra sølvkista i land - men hvem får fortjenesten?');
    };

    // Sølvkista dratt til Kontoret (riktig).
    const chestToKontor = () => {
        if (doneRef.current) return;
        chestResolved.current = true;
        doneRef.current = true;
        sounds.play('complete');
        setBurst((b) => b + 1);
        setPhase('done');
        setBanner(null);
        setTimeout(() => {
            onComplete({ score: 1, completed: true });
        }, 200);
    };

    // Sølvkista sluppet et sted som ikke er Kontoret.
    const chestWrong = () => {
        if (chestResolved.current || doneRef.current) return;
        sounds.play('incorrect');
        setChestKey((k) => k + 1); // kista spretter tilbake til skipet
        setBanner(
            'Nei. All handel i Bergen gikk gjennom Kontoret, ikke kongen. Dra sølvet til hansakjøpmennene.'
        );
    };

    const idleLoad = phase === 'load' && loaded === 0;

    // Live-avlesning som gjør poenget synlig.
    const readout =
        phase === 'done'
            ? [
                  { label: 'Kontoret', value: '85', unit: '%' },
                  { label: 'Kongen', value: '15', unit: '%' },
              ]
            : phase === 'split'
              ? [{ label: 'Sølv', value: 'i land?' }]
              : [{ label: 'Tørrfisk', value: `${loaded}/${FISH_TOTAL}` }];

    return (
        <MicroGameScaffold
            title="Hansakoggen i Bergen"
            subtitle="Last tørrfisken, send koggen til Europa, og se hvem som får fortjenesten"
            estimatedSeconds={150}
            onRetry={phase !== 'load' || loaded > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [11, 8.5, 12.5], fov: 42 },
                background: t.sky,
                fog: { near: 30, far: 60 },
                target: [-0.5, 0.8, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Bryggen i Bergen · 1400-tallet</SceneBadge>
                    <DataReadout items={readout} corner="bl" />
                    <DragHint show={idleLoad} corner="bc">
                        Dra en tørrfisk-stabel om bord
                    </DragHint>
                </>
            }
            scene={
                <Harbor
                    key={runId}
                    phase={phase}
                    sailStage={sailStage}
                    loaded={loaded}
                    returned={returned}
                    chestKey={chestKey}
                    burst={burst}
                    onLoadFish={loadFish}
                    onSetSail={setSail}
                    onReachEurope={reachEurope}
                    onReturnHome={returnHome}
                    onChestToKontor={chestToKontor}
                    onChestWrong={chestWrong}
                />
            }
        >
            {/* Kontrollområde under vinduet - skifter med fasen */}
            {phase === 'load' && (
                <div className="flex flex-col gap-2.5">
                    <StepTracker current={loaded} total={FISH_TOTAL} />
                    <p className="text-sm text-slate-600">
                        Dra hver tørrfisk-stabel fra kaia og slipp den om bord i koggen ved kaia.
                    </p>
                    {fact && <SceneFact>{fact}</SceneFact>}
                </div>
            )}

            {phase === 'sail' && (
                <div className="rounded-xl border border-amber-200 bg-white p-3 sm:flex sm:items-center sm:gap-4">
                    <p className="text-xs text-slate-600 leading-relaxed min-w-0 flex-1">
                        Koggen er et bredt, tungt lasteskip. Klikk seilet i scenen, eller knappen
                        her, for å sende den til de tyske hansabyene.
                    </p>
                    <button
                        onClick={setSail}
                        className="mt-2.5 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition flex-shrink-0"
                    >
                        <Ship className="w-4 h-4" />
                        Send koggen til Europa
                    </button>
                </div>
            )}

            {phase === 'voyage' && (
                <p className="text-center text-sm text-slate-600">
                    Koggen krysser Nordsjøen. Tørrfisken selges i Europa, og skipet fylles med korn,
                    mel og sølv før det snur hjem til Bergen.
                </p>
            )}

            {phase === 'split' && (
                <p className="text-center text-sm text-slate-600">
                    Dra den glødende sølvkista fra skipet og slipp den ved Kontoret - hansabygningen
                    med det røde skjoldet. Prøv gjerne kongen først, og se hva som skjer.
                </p>
            )}

            {phase === 'done' && (
                <WinScreen title="Hansakjøpmennene satt på handelen." onReplay={reset}>
                    Kontoret kjøpte tørrfisken billig av nordlendingene og solgte varer dyrt i
                    Europa. Storparten av sølvet ble kjøpmennenes, mens den norske kongen bare fikk
                    litt toll. Den som styrte handelen, styrte rikdommen - og i Bergen var det
                    Hansaen.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Harbor({
    phase,
    sailStage,
    loaded,
    returned,
    chestKey,
    burst,
    onLoadFish,
    onSetSail,
    onReachEurope,
    onReturnHome,
    onChestToKontor,
    onChestWrong,
}: {
    phase: Phase;
    sailStage: SailStage;
    loaded: number;
    returned: boolean;
    chestKey: number;
    burst: number;
    onLoadFish: () => void;
    onSetSail: () => void;
    onReachEurope: () => void;
    onReturnHome: () => void;
    onChestToKontor: () => void;
    onChestWrong: () => void;
}) {
    const ship = useRef<THREE.Group>(null);
    const prog = useRef(0); // 0 = ved kaia, 1 = ute i Europa
    const reached = useRef(false);
    const back = useRef(false);
    const chestResolved = useRef(false);

    useFrame((_, dt) => {
        if (!ship.current) return;
        const clock = performance.now() / 1000;

        if (sailStage === 'out') {
            prog.current = Math.min(1, prog.current + dt * 0.5);
            if (prog.current >= 0.98 && !reached.current) {
                reached.current = true;
                onReachEurope();
            }
        } else if (sailStage === 'back') {
            prog.current = Math.max(0, prog.current - dt * 0.5);
            if (prog.current <= 0.02 && !back.current) {
                back.current = true;
                onReturnHome();
            }
        }

        // Koggen glir ut mot havet (+X) og tilbake.
        const targetX = SHIP_X + prog.current * 14;
        ship.current.position.x = damp(ship.current.position.x, targetX, dt, 3);
        const sailing = prog.current > 0.02;
        // Baseline -0.12 gir skroget synlig dypgang i vannflata (y=0.02).
        ship.current.position.y = -0.12 + Math.sin(clock * 1.1) * (sailing ? 0.05 : 0.02);
        ship.current.rotation.z = Math.sin(clock * 1.3) * (sailing ? 0.05 : 0.02);
    });

    // Tørrfisk-stabler som fortsatt ligger på kaia (ikke lastet enda).
    const fishOnQuay = phase === 'load' ? FISH_STARTS.slice(loaded) : [];

    return (
        <group>
            {/* Land/kai på venstre side, hav på høyre. Vannet starter ved
                kaikanten (x≈1) - lenger inn og det flommer over land og hus. */}
            <GroundPlane size={44} depth={40} color={t.ground} />
            <WaterPlane position={[13.5, 0.02, 0]} size={[25, 40]} color={t.water} />

            {/* Trekai langs vannkanten der koggen ligger. */}
            <Quay />

            {/* Bryggen: en rad tyske gavlhus + selve Kontoret. */}
            <BryggenRow />
            <KontorHouse position={[KONTOR[0], 0, KONTOR[1]]} glow={phase === 'split'} />
            <Person position={[-3.2, 0, -3.1]} rotation={[0, 1.4, 0]} body="#4a3a6a" hat="cap" hatColor="#7a1f1f" />

            {/* Kongen - liten og for seg selv, med krone og et beskjedent banner. */}
            <KingCorner position={[KONGE[0], 0, KONGE[1]]} highlight={phase === 'split'} />

            {/* Koggen med last. */}
            <group ref={ship} position={[SHIP_X, -0.12, 0]}>
                <Kogge />
                {/* Last på dekk: tørrfisk før reisen, korn + sølv etter. */}
                {!returned ? (
                    <DeckFish count={loaded} />
                ) : (
                    <DeckReturnCargo hideChest={phase === 'split' || phase === 'done'} />
                )}
                {/* Feiringspartikler når sølvet er fordelt (over dekket). */}
                <Burst position={[0, 2, 0]} trigger={burst} color="#e8eef5" count={26} spread={3} />

                {/* Klikk seilet for å sende koggen ut. */}
                {phase === 'sail' && (
                    <Hotspot
                        position={[0.2, 2.9, 0]}
                        onSelect={onSetSail}
                        label="Seil til Europa"
                        radius={0.55}
                        color="#0ea5e9"
                    />
                )}
            </group>

            {/* Last tørrfisk om bord: dra stablene fra kaia til skipet. */}
            {fishOnQuay.map((start, i) => (
                <Draggable
                    key={`${loaded}-${i}`}
                    position={start}
                    planeY={0}
                    bounds={{ minX: -8, maxX: SHIP_X + 2.2, minZ: -4, maxZ: 4 }}
                    liftY={0.5}
                    dropFx="dustPuff"
                    onDrop={(pos) => {
                        const dist = Math.hypot(pos.x - SHIP_X, pos.z - 0);
                        if (dist < 2.8) onLoadFish();
                    }}
                >
                    {/* Romslig usynlig gripeflate - lett å ta tak i på trackpad */}
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[1.4, 1.2, 1.4]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <TorrfiskStack />
                </Draggable>
            ))}

            {/* Fordel fortjenesten: dra sølvkista i land. Kun Kontoret godtar den. */}
            {phase === 'split' && (
                <Draggable
                    key={`chest-${chestKey}`}
                    position={CHEST_START}
                    planeY={0.55}
                    bounds={{ minX: -6, maxX: SHIP_X + 2, minZ: -4.5, maxZ: 4.5 }}
                    liftY={0.4}
                    snapPoints={[KONTOR]}
                    snapRadius={2.6}
                    onSnap={() => {
                        chestResolved.current = true;
                        onChestToKontor();
                    }}
                    onDrop={() => {
                        if (!chestResolved.current) onChestWrong();
                    }}
                >
                    <mesh position={[0, 0.3, 0]}>
                        <boxGeometry args={[1.3, 1.2, 1.3]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <SilverChest />
                </Draggable>
            )}

            {/* Sluttbilde: to sølvhauger som viser fordelingen. */}
            {phase === 'done' && (
                <>
                    <CoinPile position={[KONTOR[0], 0, KONTOR[1] + 1.4]} amount={1} />
                    <CoinPile position={[KONGE[0], 0, KONGE[1] - 1.2]} amount={0.22} />
                </>
            )}
        </group>
    );
}

// ── Trekai langs vannkanten ───────────────────────────────────────────────────
function Quay() {
    return (
        <group>
            <mesh position={[-1.6, 0.06, 0]} receiveShadow castShadow>
                <boxGeometry args={[5.2, 0.24, 9]} />
                <meshStandardMaterial color="#6a4a2c" roughness={0.95} />
            </mesh>
            {/* Pæler ned i vannet mot havsiden */}
            {[-3.5, 0, 3.5].map((z) => (
                <mesh key={z} position={[1.1, -0.2, z]} castShadow>
                    <cylinderGeometry args={[0.14, 0.14, 1, 7]} />
                    <meshStandardMaterial color="#4a3420" roughness={0.95} />
                </mesh>
            ))}
        </group>
    );
}

// ── Rad med tyske gavlhus (Bryggen) ───────────────────────────────────────────
function BryggenRow() {
    const houses: { x: number; body: string; roof: string }[] = [
        { x: -1.5, body: '#b5622f', roof: '#4a2f22' },
        { x: -6.7, body: '#caa24a', roof: '#4a2f22' },
        { x: -8.6, body: '#8a5a2a', roof: '#4a2f22' },
    ];
    return (
        <group position={[0, 0, -5]}>
            {houses.map((h, i) => (
                <Building
                    key={h.x}
                    position={[h.x, 0, 0]}
                    body={h.body}
                    roof={h.roof}
                    w={1.3}
                    h={2.3}
                    d={1.6}
                    seed={i + 3}
                />
            ))}
        </group>
    );
}

// ── Kontoret: hansakjøpmennenes handelshus med rødt skjold ─────────────────────
function KontorHouse({
    position,
    glow,
}: {
    position: [number, number, number];
    glow: boolean;
}) {
    return (
        <group position={position}>
            {/* Selve handelshuset - høyt tregavlhus */}
            <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.4, 2.8, 2.2]} />
                <meshStandardMaterial color="#7a4a2a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 3.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[1.9, 1.2, 4]} />
                <meshStandardMaterial color="#3f2a1e" roughness={0.9} />
            </mesh>
            {/* Rødt hansaskjold over porten */}
            <mesh position={[0, 1.9, 1.14]} castShadow>
                <boxGeometry args={[0.7, 0.8, 0.08]} />
                <meshStandardMaterial color="#8a2b2b" roughness={0.6} />
            </mesh>
            <mesh position={[0, 1.9, 1.2]}>
                <boxGeometry args={[0.42, 0.5, 0.06]} />
                <meshStandardMaterial color="#e3b23c" emissive="#e3b23c" emissiveIntensity={0.35} roughness={0.5} />
            </mesh>
            {/* Port */}
            <mesh position={[0, 0.7, 1.12]}>
                <boxGeometry args={[0.9, 1.4, 0.08]} />
                <meshStandardMaterial color="#3a2716" roughness={0.9} />
            </mesh>
            {/* Glødende dropp-markør på bakken foran porten */}
            <mesh position={[0, 0.04, 1.9]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.7, 1, 32]} />
                <meshBasicMaterial
                    color={glow ? '#f4c542' : '#caa24a'}
                    transparent
                    opacity={glow ? 0.85 : 0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// ── Kongens hjørne: liten kronet figur med et beskjedent banner ────────────────
function KingCorner({
    position,
    highlight,
}: {
    position: [number, number, number];
    highlight: boolean;
}) {
    return (
        <group position={position}>
            <Person position={[0, 0, 0]} rotation={[0, -1.2, 0]} body="#5a2f6a" hat="crown" />
            {/* Lite banner */}
            <mesh position={[0.7, 1, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 2, 6]} />
                <meshStandardMaterial color="#4a3420" roughness={0.9} />
            </mesh>
            <mesh position={[1.05, 1.5, 0]} castShadow>
                <planeGeometry args={[0.6, 0.7]} />
                <meshStandardMaterial color="#8a2b2b" roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
            {/* Svak markør på bakken (ikke gyldig droppmål) */}
            <mesh position={[0, 0.04, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.55, 0.75, 28]} />
                <meshBasicMaterial
                    color="#9aa0aa"
                    transparent
                    opacity={highlight ? 0.4 : 0.2}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// ── Koggen: bredt, høysidet hansaskip med akterkastell og råseil ───────────────
function Kogge() {
    const wood = '#5b3f28';
    const wood2 = '#6e4d30';
    return (
        <group>
            {/* Hovedskrog - bredt og bolt */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[4.2, 1.05, 2.3]} />
                <meshStandardMaterial color={wood} roughness={0.9} />
            </mesh>
            {/* Klinker-antydning: mørke bordganger på hver side */}
            {[0.35, 0.7, 1.0].map((y) =>
                [1.17, -1.17].map((z) => (
                    <mesh key={`${y}-${z}`} position={[0, y, z]}>
                        <boxGeometry args={[4.05, 0.06, 0.04]} />
                        <meshStandardMaterial color="#3a2716" roughness={0.9} />
                    </mesh>
                ))
            )}
            {/* Rett forstevn (+X) og akterstevn (-X) - koggen har rette, skrå stevner */}
            <mesh position={[2.1, 0.8, 0]} rotation={[0, 0, -0.5]} castShadow>
                <boxGeometry args={[0.35, 1.5, 2.1]} />
                <meshStandardMaterial color={wood2} roughness={0.9} />
            </mesh>
            <mesh position={[-2.1, 0.85, 0]} rotation={[0, 0, 0.5]} castShadow>
                <boxGeometry args={[0.35, 1.5, 2.1]} />
                <meshStandardMaterial color={wood2} roughness={0.9} />
            </mesh>
            {/* Dekk */}
            <mesh position={[0, 1.12, 0]} receiveShadow>
                <boxGeometry args={[4, 0.1, 2.05]} />
                <meshStandardMaterial color="#7a5535" roughness={0.9} />
            </mesh>
            {/* Rekker langs sidene */}
            {[1.05, -1.05].map((z) => (
                <mesh key={z} position={[0, 1.28, z]} castShadow>
                    <boxGeometry args={[4, 0.22, 0.1]} />
                    <meshStandardMaterial color={wood2} roughness={0.9} />
                </mesh>
            ))}
            {/* Akterkastell - hevet plattform bak (koggens kjennemerke) */}
            <mesh position={[-1.7, 1.6, 0]} castShadow>
                <boxGeometry args={[0.9, 0.9, 2]} />
                <meshStandardMaterial color={wood2} roughness={0.9} />
            </mesh>
            {[0.95, -0.95].map((z) => (
                <mesh key={`c${z}`} position={[-1.7, 2.15, z]}>
                    <boxGeometry args={[0.9, 0.2, 0.08]} />
                    <meshStandardMaterial color={wood} roughness={0.9} />
                </mesh>
            ))}

            {/* Mast + råseil */}
            <mesh position={[0.2, 2.3, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.11, 2.6, 8]} />
                <meshStandardMaterial color={wood} roughness={0.9} />
            </mesh>
            {/* Rå (horisontal bom) */}
            <mesh position={[0.2, 3.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 3, 6]} />
                <meshStandardMaterial color="#4a3320" roughness={0.9} />
            </mesh>
            {/* Seil - lyst med rød hansastripe. Roteres π/2 om Y så det spenner
                råa (langs Z) og vender forover mot seilretningen (+X), i stedet
                for å henge på tvers av sin egen rå. */}
            <group position={[0.2, 2.55, 0]} rotation={[0, Math.PI / 2, 0]}>
                <mesh>
                    <planeGeometry args={[2.9, 2.1]} />
                    <meshStandardMaterial color="#efe7d4" roughness={0.95} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, 0, 0.02]}>
                    <planeGeometry args={[2.9, 0.45]} />
                    <meshStandardMaterial color="#8a2b2b" roughness={0.95} side={THREE.DoubleSide} />
                </mesh>
            </group>
            {/* Vimpel på mastetoppen */}
            <mesh position={[0.5, 3.7, 0]} castShadow>
                <planeGeometry args={[0.55, 0.24]} />
                <meshStandardMaterial color="#8a2b2b" roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

// ── Én tørrfisk-stabel (bunt av tørket torsk) ─────────────────────────────────
function TorrfiskStack() {
    const cod = ['#b8a884', '#a89778', '#c2b18c'];
    return (
        <group>
            {/* Liten pall */}
            <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
                <boxGeometry args={[1, 0.16, 0.8]} />
                <meshStandardMaterial color="#6a4a2c" roughness={0.95} />
            </mesh>
            {/* Stabel av flate, stive tørrfisker */}
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    position={[0, 0.24 + i * 0.13, (i % 2 ? 0.06 : -0.06)]}
                    rotation={[0, (i % 2 ? 0.12 : -0.1), 0]}
                    castShadow
                >
                    <boxGeometry args={[0.9, 0.11, 0.34]} />
                    <meshStandardMaterial color={cod[i % cod.length]} roughness={1} flatShading />
                </mesh>
            ))}
            {/* Snor rundt bunten */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[0.94, 0.5, 0.05]} />
                <meshStandardMaterial color="#5a4028" roughness={0.9} />
            </mesh>
        </group>
    );
}

// ── Tørrfisk på dekk (viser hvor mye som er lastet) ───────────────────────────
function DeckFish({ count }: { count: number }) {
    const spots: [number, number, number][] = [
        [-0.5, 1.32, 0.5],
        [0.4, 1.32, -0.5],
        [1.0, 1.32, 0.4],
    ];
    return (
        <group>
            {spots.slice(0, count).map((p, i) => (
                <group key={i} position={p} scale={0.85}>
                    <TorrfiskStack />
                </group>
            ))}
        </group>
    );
}

// ── Returlast på dekk: kornsekker + (valgfritt) en sølvkiste ───────────────────
function DeckReturnCargo({ hideChest }: { hideChest: boolean }) {
    const sacks: [number, number, number][] = [
        [-0.6, 1.3, 0.4],
        [0.1, 1.3, -0.45],
        [0.6, 1.3, 0.45],
        [-0.1, 1.3, 0.5],
    ];
    return (
        <group>
            {sacks.map((p, i) => (
                <GrainSack key={i} position={p} />
            ))}
            {/* Sølvkiste står på dekk til eleven drar den i land */}
            {!hideChest && (
                <group position={[0.9, 1.28, -0.1]} scale={0.9}>
                    <SilverChest />
                </group>
            )}
        </group>
    );
}

// ── Kornsekk ──────────────────────────────────────────────────────────────────
function GrainSack({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.22, 0.28, 0.44, 8]} />
                <meshStandardMaterial color="#d8c48a" roughness={0.95} flatShading />
            </mesh>
            <mesh position={[0, 0.46, 0]} castShadow>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshStandardMaterial color="#c9b47a" roughness={0.95} />
            </mesh>
        </group>
    );
}

// ── Sølvkiste med glødende mynter ─────────────────────────────────────────────
function SilverChest() {
    return (
        <group>
            <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.7, 0.42, 0.5]} />
                <meshStandardMaterial color="#5a3f28" roughness={0.85} />
            </mesh>
            {/* Beslag */}
            {[-0.28, 0.28].map((x) => (
                <mesh key={x} position={[x, 0.22, 0]}>
                    <boxGeometry args={[0.06, 0.44, 0.52]} />
                    <meshStandardMaterial color="#3a2716" roughness={0.8} metalness={0.3} />
                </mesh>
            ))}
            {/* Glødende sølvmynter på toppen */}
            {[
                [-0.15, 0.09],
                [0.12, -0.05],
                [0.0, 0.12],
                [0.2, 0.1],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.46 + (i % 2) * 0.05, z]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.11, 0.11, 0.04, 14]} />
                    <meshStandardMaterial
                        color="#e8eef5"
                        emissive="#cfe0f0"
                        emissiveIntensity={0.5}
                        roughness={0.3}
                        metalness={0.6}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ── Sølvhaug (sluttbilde): størrelse etter andel ──────────────────────────────
function CoinPile({
    position,
    amount,
}: {
    position: [number, number, number];
    amount: number; // 0-1, styrer størrelsen på haugen
}) {
    const n = Math.max(3, Math.round(4 + amount * 22));
    const coins = useCoinLayout(n, amount);
    return (
        <group position={position}>
            {coins.map((c, i) => (
                <mesh key={i} position={[c.x, c.y, c.z]} rotation={[Math.PI / 2, 0, c.r]}>
                    <cylinderGeometry args={[0.13, 0.13, 0.04, 12]} />
                    <meshStandardMaterial
                        color="#e8eef5"
                        emissive="#cfe0f0"
                        emissiveIntensity={0.45}
                        roughness={0.3}
                        metalness={0.6}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Deterministisk layout for myntene i en haug (ingen Math.random i render).
function coinRng(seed: number) {
    let s = (seed * 2654435761) >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

function useCoinLayout(count: number, amount: number) {
    return React.useMemo(() => {
        const rand = coinRng(count * 7 + Math.round(amount * 100));
        const spread = 0.4 + amount * 0.5;
        return Array.from({ length: count }, () => {
            const a = rand() * Math.PI * 2;
            const rad = Math.sqrt(rand()) * spread;
            return {
                x: Math.cos(a) * rad,
                z: Math.sin(a) * rad,
                y: 0.03 + rand() * (0.05 + amount * 0.35),
                r: rand() * Math.PI,
            };
        });
    }, [count, amount]);
}

export default Hansakoggen3D;
