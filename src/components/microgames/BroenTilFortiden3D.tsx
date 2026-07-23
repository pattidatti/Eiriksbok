import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Play } from 'lucide-react';
import {
    MicroGameScaffold,
    Interactive,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    LoseScreen,
    TimerPill,
    DangerVignette,
    StepTracker,
    Burst,
    Particles,
    GlowMaterial,
    GlowHalo,
    Building,
    Banner,
    damp,
    useGameClock,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Broen til fortiden - mikrospill for artikkelen om nasjonenes gullaldre.
// Lyspære: en nasjonal fortelling er en bro som bygges fra nåtiden til en VALGT
// fortid. Eleven ser et lands nåtid (byen til høyre) og tre epoke-øyer som
// langsomt synker i glemselens tåke. Bygg broen til epoken landet faktisk
// holder festtaler om - før øyene synker. Feil epoke: broen knekker og tiden
// renner ut. Øyene uten bro forsvinner i tåka - det er poenget.

type EmblemKind = 'torch' | 'crown' | 'pagoda' | 'torii' | 'ruin' | 'war' | 'ship';

interface EpochIsland {
    id: string;
    label: string;
    correct: boolean;
    emblem: EmblemKind;
    // Kort forklaring: hvorfor riktig / hvorfor ikke.
    fact: string;
}

interface Round {
    country: string;
    flagColor: string;
    question: string;
    islands: EpochIsland[];
    winFact: string;
}

const ROUNDS: Round[] = [
    {
        country: 'USA',
        flagColor: '#3c5fa0',
        question: 'USA: Hvilken fortid holder landet festtaler om?',
        winFact:
            'USA bygger sitt store «vi» på 1776: uavhengigheten, grunnleggerne og grunnloven. Borgerkrigen og Vietnam er sår - de nevnes, men ingen bygger nasjonen på dem.',
        islands: [
            {
                id: 'usa-1776',
                label: 'Uavhengigheten 1776',
                correct: true,
                emblem: 'torch',
                fact: 'Riktig! Grunnleggerne og friheten fra 1776 er fortellingen USA bygger på.',
            },
            {
                id: 'usa-borgerkrig',
                label: 'Borgerkrigen',
                correct: false,
                emblem: 'war',
                fact: 'Borgerkrigen splittet folket i to. Et sår - ikke en festtale.',
            },
            {
                id: 'usa-vietnam',
                label: 'Vietnamkrigen',
                correct: false,
                emblem: 'war',
                fact: 'Et nederlag mange amerikanere helst vil glemme.',
            },
        ],
    },
    {
        country: 'Frankrike',
        flagColor: '#2c4f9e',
        question: 'Frankrike: Hvilken fortid bygger republikken på?',
        winFact:
            'Frankrike bygger på revolusjonen i 1789. Frihet, likhet og brorskap står fortsatt på alle offentlige bygninger - fortellingen brukes hver eneste dag.',
        islands: [
            {
                id: 'fr-enevelde',
                label: 'Solkongens enevelde',
                correct: false,
                emblem: 'crown',
                fact: 'Revolusjonen kastet nettopp kongene. Eneveldet er det fortellingen bryter med.',
            },
            {
                id: 'fr-1789',
                label: 'Revolusjonen 1789',
                correct: true,
                emblem: 'torch',
                fact: 'Riktig! 1789 er selve grunnfortellingen i den franske republikken.',
            },
            {
                id: 'fr-waterloo',
                label: 'Nederlaget ved Waterloo',
                correct: false,
                emblem: 'war',
                fact: 'Napoleons fall i 1815 er ikke noe Frankrike feirer.',
            },
        ],
    },
    {
        country: 'Kina',
        flagColor: '#c0392b',
        question: 'Kina: Hvilken fortid kalles landets storhetstid?',
        winFact:
            'Kina bygger på Midtens rike - årtusener med dynastier, oppfinnelser og makt. Ydmykelsens århundre brukes som kontrast: såret som aldri skal skje igjen.',
        islands: [
            {
                id: 'cn-midtens',
                label: 'Midtens rike',
                correct: true,
                emblem: 'pagoda',
                fact: 'Riktig! De store dynastiene er gullalderen Kina viser tilbake til.',
            },
            {
                id: 'cn-ydmykelse',
                label: 'Ydmykelsens århundre',
                correct: false,
                emblem: 'war',
                fact: 'Dette er såret, ikke gullalderen. Det brukes som advarsel: aldri igjen.',
            },
            {
                id: 'cn-kulturrev',
                label: 'Kulturrevolusjonen',
                correct: false,
                emblem: 'ruin',
                fact: 'En smertefull tid landet selv snakker svært lite om.',
            },
        ],
    },
    {
        country: 'Japan',
        flagColor: '#c94f5f',
        question: 'Japan: Hvilken fortid ga landet sin «gamle sjel»?',
        winFact:
            'Japan bygger på samuraienes og keisernes eldgamle tid. Da landet moderniserte seg lynraskt på 1800-tallet, ble det fortalt som en reise tilbake til det ekte japanske.',
        islands: [
            {
                id: 'jp-1945',
                label: 'Nederlaget i 1945',
                correct: false,
                emblem: 'war',
                fact: 'Krigsnederlaget er et traume, ikke en gullalder.',
            },
            {
                id: 'jp-samurai',
                label: 'Samuraienes tid',
                correct: true,
                emblem: 'torii',
                fact: 'Riktig! Samuraiene og den eldgamle keiserætten er Japans store fortelling.',
            },
            {
                id: 'jp-kriger',
                label: 'Krigene i Kina',
                correct: false,
                emblem: 'war',
                fact: 'Overgrepene i 1930-årene er en fortid Japan omtaler minst mulig.',
            },
        ],
    },
];

const ROUND_SECONDS = 28;
const ISLAND_POS: [number, number, number][] = [
    [-4.6, 0, -4.2],
    [-6.2, 0, 0.6],
    [-4.2, 0, 4.6],
];
const CITY_ANCHOR: [number, number, number] = [4.2, 0.5, 0];

type Phase = 'idle' | 'playing' | 'bridging' | 'feedback' | 'lost' | 'won';

interface BridgeState {
    targetIdx: number | null;
    state: 'building' | 'broken' | 'landed';
}

const BroenTilFortiden3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('idle');
    const [roundIdx, setRoundIdx] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [bridge, setBridge] = useState<BridgeState>({ targetIdx: null, state: 'building' });
    const [wrongIds, setWrongIds] = useState<string[]>([]);
    const [fact, setFact] = useState<string | null>(null);
    const [banner, setBanner] = useState<string | null>(null);
    const [wonColors, setWonColors] = useState<string[]>([]);
    const [burst, setBurst] = useState(0);
    const timeouts = useRef<number[]>([]);

    const round = ROUNDS[roundIdx];

    const clock = useGameClock({
        seconds: ROUND_SECONDS,
        running: phase === 'playing',
        onExpire: () => {
            sounds.play('incorrect');
            setPhase('lost');
            setBanner(null);
        },
    });

    // Rydd opp planlagte overganger ved unmount.
    useEffect(() => {
        const list = timeouts.current;
        return () => list.forEach((t) => window.clearTimeout(t));
    }, []);
    const later = (fn: () => void, ms: number) => {
        timeouts.current.push(window.setTimeout(fn, ms));
    };

    const start = () => {
        sounds.play('advance');
        setPhase('playing');
        setBanner(round.question);
        clock.restart(ROUND_SECONDS);
    };

    const pick = (idx: number) => {
        if (phase !== 'playing') return;
        const island = round.islands[idx];
        if (wrongIds.includes(island.id)) return;
        setPhase('bridging');
        setBridge({ targetIdx: idx, state: 'building' });
        setBanner(null);
        sounds.play('pick');

        if (island.correct) {
            later(() => {
                sounds.play('correct');
                setBridge({ targetIdx: idx, state: 'landed' });
                setFact(round.winFact);
                setPhase('feedback');
                setWonColors((prev) => [...prev, round.flagColor]);
                setBurst((b) => b + 1);
            }, 1500);
            later(() => {
                if (roundIdx + 1 >= ROUNDS.length) {
                    sounds.play('complete');
                    setPhase('won');
                    onComplete({ score: 1, completed: true, artifact: { wrong: wrongIds.length } });
                } else {
                    sounds.play('sceneChange');
                    const next = roundIdx + 1;
                    setRoundIdx(next);
                    setBridge({ targetIdx: null, state: 'building' });
                    setWrongIds([]);
                    setFact(null);
                    setBanner(ROUNDS[next].question);
                    setPhase('playing');
                    clock.restart(ROUND_SECONDS);
                }
            }, 5200);
        } else {
            later(() => {
                sounds.play('incorrect');
                setBridge({ targetIdx: idx, state: 'broken' });
                setFact(island.fact);
            }, 900);
            later(() => {
                setWrongIds((prev) => [...prev, island.id]);
                setBridge({ targetIdx: null, state: 'building' });
                setBanner(round.question);
                // Straff: feil bro koster tid.
                clock.restart(Math.max(4, clock.remaining - 6));
                setPhase('playing');
            }, 2400);
        }
    };

    const resetAll = () => {
        setPhase('idle');
        setRoundIdx(0);
        setAttempt((a) => a + 1);
        setBridge({ targetIdx: null, state: 'building' });
        setWrongIds([]);
        setFact(null);
        setBanner(null);
        setWonColors([]);
        clock.restart(ROUND_SECONDS);
    };

    const retryRound = () => {
        setPhase('playing');
        setAttempt((a) => a + 1);
        setBridge({ targetIdx: null, state: 'building' });
        setWrongIds([]);
        setFact(null);
        setBanner(round.question);
        clock.restart(ROUND_SECONDS);
    };

    const active = phase === 'playing' || phase === 'bridging' || phase === 'feedback';
    const sinkT = phase === 'lost' ? 1 : active ? 1 - clock.ratio : 0;

    return (
        <MicroGameScaffold
            title="Broen til fortiden"
            subtitle="Bygg minnebroen til epoken landet faktisk feirer - før øyene synker i glemselen"
            estimatedSeconds={180}
            onRetry={phase !== 'idle' ? resetAll : undefined}
            scene={
                <MemorySea
                    key={`${roundIdx}-${attempt}`}
                    round={round}
                    sinkT={sinkT}
                    bridge={bridge}
                    wrongIds={wrongIds}
                    wonColors={wonColors}
                    burst={burst}
                    onPick={pick}
                    interactive={phase === 'playing'}
                />
            }
            canvas={{
                idle: phase === 'idle',
                camera: { position: [10, 8.5, 12], fov: 42 },
                background: '#dbe4f4',
                fog: { color: '#dbe4f4', near: 24, far: 46 },
                target: [-0.5, 0.5, 0],
            }}
            containerClassName="bg-gradient-to-b from-[#dbe4f4] via-[#e4e8f2] to-[#d8d4e6]"
            overlays={
                <>
                    <SceneBanner
                        message={
                            phase === 'idle'
                                ? 'Tre øyer fra fortiden synker sakte i glemselens tåke. Bare én av dem er landets gullalder.'
                                : banner
                        }
                        wide
                    />
                    {active && (
                        <TimerPill seconds={clock.remaining} label="Glemsel" corner="bl" warnBelow={8} />
                    )}
                    <SceneBadge corner="br">
                        {phase === 'idle' ? 'Nasjonenes gullaldre' : round.country}
                    </SceneBadge>
                    <DangerVignette level={Math.max(0, (sinkT - 0.5) * 1.6)} />
                </>
            }
        >
            <div className="flex items-center justify-between mb-2.5">
                <StepTracker current={roundIdx + 1} total={ROUNDS.length} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
                    {phase === 'won' ? 'Alle broer bygget' : `Land: ${round.country}`}
                </span>
            </div>

            {phase === 'idle' ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-xs text-slate-600 leading-relaxed flex-1">
                        Byen til høyre er nåtiden. Klikk øya med epoken landet bygger sin store
                        fortelling på, så bygges minnebroen. Velger du feil, knekker broen og du
                        mister tid. Fire land venter.
                    </p>
                    <button
                        onClick={start}
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-amber-600 text-white rounded-full text-sm font-bold hover:bg-amber-700 transition flex-shrink-0"
                    >
                        <Play className="w-4 h-4" />
                        Start
                    </button>
                </div>
            ) : phase === 'lost' ? (
                <LoseScreen title="Øyene sank i glemselens tåke." onRetry={retryRound}>
                    Uten en fortelling om fortiden mistet landet sitt store «vi». Slik er det i
                    virkeligheten også: en nasjonal fortelling må velges og holdes ved like -
                    ellers forsvinner den. Prøv landet på nytt.
                </LoseScreen>
            ) : phase === 'won' ? (
                <WinScreen title="Fire land, fire broer - fire valg." onReplay={resetAll}>
                    Ingen av broene bygde seg selv. Noen valgte hvilken øy folket skulle huske, og
                    lot de andre synke. Slik bygger alle nasjoner sin fortelling - også Norge, som
                    på 1800-tallet bygde bro til vikingtiden og 1814.
                </WinScreen>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {round.islands.map((island, idx) => {
                            const isWrong = wrongIds.includes(island.id);
                            const isTarget = bridge.targetIdx === idx;
                            return (
                                <button
                                    key={island.id}
                                    onClick={() => pick(idx)}
                                    disabled={phase !== 'playing' || isWrong}
                                    className={`text-left rounded-xl border-2 px-3 py-2 transition ${
                                        isTarget && bridge.state === 'landed'
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : isTarget && bridge.state === 'broken'
                                              ? 'bg-rose-50 border-rose-300'
                                              : isWrong
                                                ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                                                : phase === 'playing'
                                                  ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 hover:border-amber-400 cursor-pointer'
                                                  : 'bg-slate-50 border-slate-200 opacity-70'
                                    }`}
                                >
                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                        {island.label}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {isWrong ? 'Broen knakk' : 'Bygg bro hit'}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                    {fact && <div className="mt-2.5"><SceneFact>{fact}</SceneFact></div>}
                </>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

interface MemorySeaProps {
    round: Round;
    sinkT: number;
    bridge: BridgeState;
    wrongIds: string[];
    wonColors: string[];
    burst: number;
    onPick: (idx: number) => void;
    interactive: boolean;
}

function MemorySea({
    round,
    sinkT,
    bridge,
    wrongIds,
    wonColors,
    burst,
    onPick,
    interactive,
}: MemorySeaProps) {
    return (
        <group>
            <MistSea />
            <Particles preset="motes" />
            <CityIsland wonColors={wonColors} />
            {round.islands.map((island, idx) => (
                <EpochIslandMesh
                    key={island.id}
                    island={island}
                    position={ISLAND_POS[idx]}
                    sinkT={sinkT}
                    sunk={wrongIds.includes(island.id)}
                    landed={bridge.targetIdx === idx && bridge.state === 'landed'}
                    onPick={() => onPick(idx)}
                    interactive={interactive && !wrongIds.includes(island.id)}
                />
            ))}
            {bridge.targetIdx !== null && (
                <LightBridge
                    from={CITY_ANCHOR}
                    to={ISLAND_POS[bridge.targetIdx]}
                    state={bridge.state}
                    color={round.flagColor}
                />
            )}
            <Burst position={[4, 2.5, 0]} trigger={burst} color="#d8b24a" count={26} spread={2.8} />
        </group>
    );
}

// --- Glemselens hav: mykt, lysende tåkehav ---
function MistSea() {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        if (matRef.current) {
            matRef.current.emissiveIntensity =
                0.22 + Math.sin(clock.getElapsedTime() * 0.7) * 0.06;
        }
    });
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
                <planeGeometry args={[60, 48]} />
                <meshStandardMaterial
                    ref={matRef}
                    color="#b7c1e0"
                    roughness={0.9}
                    emissive="#7f8fc0"
                    emissiveIntensity={0.24}
                />
            </mesh>
            {/* Drivende tåkebanker */}
            {[
                [-9, 0.1, -7, 5],
                [2, 0, 7.5, 6],
                [-11, 0.2, 5, 4.5],
                [9, 0.1, -6, 5.5],
            ].map(([x, y, z, s], i) => (
                <FogBank key={i} position={[x, y, z]} scale={s} phase={i * 1.7} />
            ))}
        </group>
    );
}

function FogBank({
    position,
    scale,
    phase,
}: {
    position: [number, number, number];
    scale: number;
    phase: number;
}) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime();
        ref.current.position.x = position[0] + Math.sin(t * 0.12 + phase) * 1.6;
        ref.current.position.z = position[2] + Math.cos(t * 0.09 + phase) * 1.1;
    });
    return (
        <mesh ref={ref} position={position} scale={[scale, scale * 0.22, scale]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color="#e6eaf5" transparent opacity={0.45} roughness={1} />
        </mesh>
    );
}

// --- Nåtidsbyen til høyre ---
function CityIsland({ wonColors }: { wonColors: string[] }) {
    const flagColor = wonColors.length > 0 ? wonColors[wonColors.length - 1] : '#8b93a5';
    return (
        <group position={[5.4, 0, 0]}>
            {/* Plattform */}
            <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[3.1, 3.5, 0.5, 24]} />
                <meshStandardMaterial color="#9aa3b8" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.45, 0]}>
                <cylinderGeometry args={[3.4, 2.2, 0.9, 24]} />
                <meshStandardMaterial color="#7c86a0" roughness={1} />
            </mesh>
            {/* Moderne by */}
            <Building position={[0.6, 0.47, -1.3]} body="#dfe4ee" roof="#6b7690" w={1.1} h={1.9} d={1.1} seed={1} />
            <Building position={[1.6, 0.47, 0.4]} body="#ccd4e4" roof="#5c6680" w={0.9} h={1.3} d={0.9} seed={2} />
            <Building position={[0.2, 0.47, 1.5]} body="#d6dbe8" roof="#69748e" w={1} h={1.5} d={1} seed={3} />
            {/* Flaggstang: fargen skifter til det siste landet eleven "hentet hjem" */}
            <Banner position={[-1.1, 0.47, 0]} color={flagColor} height={2.6} />
            {/* Minnemonumenter for hvert land eleven har bygget bro til */}
            {wonColors.map((c, i) => (
                <group key={i} position={[-1.9 + i * 0.75, 0.47, 1.9]}>
                    <mesh position={[0, 0.45, 0]} castShadow>
                        <boxGeometry args={[0.22, 0.9, 0.22]} />
                        <GlowMaterial color={c} intensity={0.8} />
                    </mesh>
                    <mesh position={[0, 0.05, 0]}>
                        <boxGeometry args={[0.4, 0.12, 0.4]} />
                        <meshStandardMaterial color="#b8bfd0" roughness={0.8} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// --- En epoke-øy som synker mot tåka ---
function EpochIslandMesh({
    island,
    position,
    sinkT,
    sunk,
    landed,
    onPick,
    interactive,
}: {
    island: EpochIsland;
    position: [number, number, number];
    sinkT: number;
    sunk: boolean;
    landed: boolean;
    onPick: () => void;
    interactive: boolean;
}) {
    const group = useRef<THREE.Group>(null);
    useFrame(({ clock }, dt) => {
        if (!group.current) return;
        const t = clock.getElapsedTime();
        // Synk: mot -1.6 når tida renner ut, helt ned (-2.6) når broen knakk,
        // løftet (0.35) når broen har landet.
        const targetY = landed ? 0.35 : sunk ? -2.6 : -1.55 * Math.pow(sinkT, 1.4);
        group.current.position.y = damp(group.current.position.y, targetY, dt, sunk ? 1.2 : 2.5);
        // Svak duving så øyene lever
        group.current.position.y += Math.sin(t * 0.8 + position[0]) * 0.02;
    });

    return (
        <group position={position}>
            <group ref={group}>
                <Interactive
                    onSelect={onPick}
                    disabled={!interactive}
                    state={landed ? 'correct' : sunk ? 'disabled' : undefined}
                    hitArea={[3.2, 3.4, 3.2]}
                    sound={null}
                >
                    {(s) => (
                        <group>
                            {/* Øy-plattform */}
                            <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                                <cylinderGeometry args={[1.5, 1.9, 0.45, 18]} />
                                <meshStandardMaterial
                                    color={sunk ? '#8e94a6' : s === 'hover' ? '#d4b877' : '#bfa877'}
                                    roughness={0.95}
                                />
                            </mesh>
                            <mesh position={[0, -0.55, 0]}>
                                <coneGeometry args={[1.7, 1.5, 14]} />
                                <meshStandardMaterial color="#848ca2" roughness={1} />
                            </mesh>
                            <Emblem kind={island.emblem} highlight={landed} hover={s === 'hover'} />
                            {landed && <GlowHalo color="#ffd98a" size={1.7} opacity={0.22} />}
                        </group>
                    )}
                </Interactive>
            </group>
        </group>
    );
}

// --- Epoke-emblemer: små prosedyrale monumenter ---
function Emblem({
    kind,
    highlight,
    hover,
}: {
    kind: EmblemKind;
    highlight: boolean;
    hover: boolean;
}) {
    const stone = highlight ? '#e8c96b' : hover ? '#d9cfae' : '#c9c2a8';
    const dark = '#6e6a5c';
    switch (kind) {
        case 'torch':
            return (
                <group position={[0, 0.38, 0]}>
                    <mesh position={[0, 0.55, 0]} castShadow>
                        <cylinderGeometry args={[0.09, 0.16, 1.1, 8]} />
                        <meshStandardMaterial color={stone} roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 1.2, 0]}>
                        <sphereGeometry args={[0.17, 10, 10]} />
                        <GlowMaterial color="#ffb544" intensity={highlight ? 1.6 : 0.9} />
                    </mesh>
                </group>
            );
        case 'crown':
            return (
                <group position={[0, 0.38, 0]}>
                    <mesh position={[0, 0.3, 0]} castShadow>
                        <cylinderGeometry args={[0.34, 0.42, 0.6, 10]} />
                        <meshStandardMaterial color="#b98e3e" metalness={0.4} roughness={0.5} />
                    </mesh>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <mesh
                            key={i}
                            position={[
                                Math.cos((i / 5) * Math.PI * 2) * 0.32,
                                0.72,
                                Math.sin((i / 5) * Math.PI * 2) * 0.32,
                            ]}
                            castShadow
                        >
                            <coneGeometry args={[0.08, 0.3, 6]} />
                            <meshStandardMaterial color="#b98e3e" metalness={0.4} roughness={0.5} />
                        </mesh>
                    ))}
                </group>
            );
        case 'pagoda':
            return (
                <group position={[0, 0.38, 0]}>
                    {[0, 1, 2].map((i) => (
                        <group key={i} position={[0, i * 0.42, 0]}>
                            <mesh position={[0, 0.12, 0]} castShadow>
                                <boxGeometry args={[0.8 - i * 0.18, 0.26, 0.8 - i * 0.18]} />
                                <meshStandardMaterial color={stone} roughness={0.85} />
                            </mesh>
                            <mesh position={[0, 0.32, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                                <coneGeometry args={[(0.75 - i * 0.16) * 0.95, 0.22, 4]} />
                                <meshStandardMaterial color="#a5493c" roughness={0.8} />
                            </mesh>
                        </group>
                    ))}
                </group>
            );
        case 'torii':
            return (
                <group position={[0, 0.38, 0]}>
                    {[-0.42, 0.42].map((x) => (
                        <mesh key={x} position={[x, 0.5, 0]} castShadow>
                            <cylinderGeometry args={[0.07, 0.09, 1, 8]} />
                            <meshStandardMaterial color="#b8503f" roughness={0.75} />
                        </mesh>
                    ))}
                    <mesh position={[0, 1.05, 0]} castShadow>
                        <boxGeometry args={[1.25, 0.12, 0.14]} />
                        <meshStandardMaterial color="#b8503f" roughness={0.75} />
                    </mesh>
                    <mesh position={[0, 0.82, 0]} castShadow>
                        <boxGeometry args={[1, 0.09, 0.11]} />
                        <meshStandardMaterial color="#8f3c30" roughness={0.75} />
                    </mesh>
                </group>
            );
        case 'ruin':
            return (
                <group position={[0, 0.38, 0]}>
                    <mesh position={[-0.3, 0.32, 0.1]} rotation={[0, 0, 0.16]} castShadow>
                        <cylinderGeometry args={[0.12, 0.14, 0.65, 8]} />
                        <meshStandardMaterial color={dark} roughness={0.95} />
                    </mesh>
                    <mesh position={[0.28, 0.18, -0.12]} rotation={[0.3, 0, -0.5]} castShadow>
                        <cylinderGeometry args={[0.12, 0.14, 0.5, 8]} />
                        <meshStandardMaterial color={dark} roughness={0.95} />
                    </mesh>
                    <mesh position={[0.05, 0.06, 0.3]}>
                        <boxGeometry args={[0.5, 0.12, 0.3]} />
                        <meshStandardMaterial color={dark} roughness={0.95} />
                    </mesh>
                </group>
            );
        case 'war':
            return (
                <group position={[0, 0.38, 0]}>
                    {/* Brukket sverd i stein */}
                    <mesh position={[0, 0.1, 0]}>
                        <boxGeometry args={[0.55, 0.2, 0.55]} />
                        <meshStandardMaterial color={dark} roughness={0.95} />
                    </mesh>
                    <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0.12]} castShadow>
                        <boxGeometry args={[0.09, 0.7, 0.05]} />
                        <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.4} />
                    </mesh>
                    <mesh position={[0.28, 0.24, 0.1]} rotation={[0.4, 0.3, 1.2]} castShadow>
                        <boxGeometry args={[0.07, 0.4, 0.04]} />
                        <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.4} />
                    </mesh>
                </group>
            );
        case 'ship':
            return (
                <group position={[0, 0.45, 0]}>
                    <mesh position={[0, 0.12, 0]} castShadow>
                        <boxGeometry args={[0.9, 0.22, 0.34]} />
                        <meshStandardMaterial color="#7a5a38" roughness={0.85} />
                    </mesh>
                    <mesh position={[0, 0.5, 0]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
                        <meshStandardMaterial color="#5c4327" roughness={0.9} />
                    </mesh>
                </group>
            );
    }
}

// --- Broen av lys: planker som vokser fra byen mot øya ---
const PLANK_COUNT = 11;

function LightBridge({
    from,
    to,
    state,
    color,
}: {
    from: [number, number, number];
    to: [number, number, number];
    state: 'building' | 'broken' | 'landed';
    color: string;
}) {
    const progress = useRef(0);
    const planks = useRef<(THREE.Group | null)[]>([]);
    const orbT = useRef(0);
    const orbs = useRef<(THREE.Mesh | null)[]>([]);

    // Beregn plank-posisjoner langs linjen by -> øy (litt bue oppover på midten).
    const path = useMemo(() => {
        const a = new THREE.Vector3(from[0], from[1], from[2]);
        const b = new THREE.Vector3(to[0], 0.55, to[2]);
        const pts: { pos: THREE.Vector3; rotY: number }[] = [];
        for (let i = 0; i < PLANK_COUNT; i++) {
            const t = (i + 0.5) / PLANK_COUNT;
            const p = a.clone().lerp(b, t);
            p.y += Math.sin(t * Math.PI) * 0.55;
            pts.push({ pos: p, rotY: Math.atan2(b.x - a.x, b.z - a.z) });
        }
        return pts;
    }, [from, to]);

    useFrame(({ clock }, dt) => {
        const speed = state === 'building' ? 0.85 : 2.2;
        const targetP = state === 'broken' ? 0.62 : 1;
        progress.current = Math.min(targetP, progress.current + dt * speed * (state === 'building' ? 1 : 0.4));
        const t = clock.getElapsedTime();

        planks.current.forEach((g, i) => {
            if (!g) return;
            const reveal = progress.current * PLANK_COUNT;
            const on = i < reveal;
            const breakIt = state === 'broken' && i >= 4;
            if (breakIt) {
                // Planker faller ned i tåka
                g.position.y = damp(g.position.y, path[i].pos.y - 3.2, dt, 1.6);
                g.rotation.x = damp(g.rotation.x, 0.9 + i * 0.15, dt, 1.6);
                g.scale.setScalar(damp(g.scale.x, 0.01, dt, 1.2));
            } else {
                g.visible = on;
                g.position.y = damp(g.position.y, path[i].pos.y, dt, 8);
                g.scale.setScalar(damp(g.scale.x, on ? 1 : 0.01, dt, 10));
            }
        });

        // Minnelys som vandrer fra øya hjem til byen når broen står
        if (state === 'landed') {
            orbT.current += dt * 0.35;
            orbs.current.forEach((m, i) => {
                if (!m) return;
                const t01 = (orbT.current + i * 0.33) % 1;
                const idx = (1 - t01) * (PLANK_COUNT - 1);
                const lo = Math.floor(idx);
                const hi = Math.min(PLANK_COUNT - 1, lo + 1);
                const frac = idx - lo;
                m.position.lerpVectors(path[lo].pos, path[hi].pos, frac);
                m.position.y += 0.35 + Math.sin(t * 3 + i) * 0.06;
                m.visible = true;
            });
        }
    });

    return (
        <group>
            {path.map((p, i) => (
                <group
                    key={i}
                    ref={(el) => {
                        planks.current[i] = el;
                    }}
                    position={[p.pos.x, p.pos.y, p.pos.z]}
                    rotation={[0, p.rotY, 0]}
                    scale={0.01}
                    visible={false}
                >
                    <mesh castShadow>
                        <boxGeometry args={[0.62, 0.09, 0.94]} />
                        <GlowMaterial
                            color={state === 'broken' ? '#8d94a8' : color}
                            intensity={state === 'landed' ? 1.3 : 0.8}
                        />
                    </mesh>
                </group>
            ))}
            {state === 'landed' &&
                [0, 1, 2].map((i) => (
                    <mesh
                        key={i}
                        ref={(el) => {
                            orbs.current[i] = el;
                        }}
                        visible={false}
                    >
                        <sphereGeometry args={[0.12, 10, 10]} />
                        <GlowMaterial color="#ffe9a8" intensity={1.4} />
                    </mesh>
                ))}
        </group>
    );
}

export default BroenTilFortiden3D;
