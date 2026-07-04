import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Banknote, Coins } from 'lucide-react';
import { MicroGameScaffold } from './kit/MicroGameScaffold';
import { Hotspot } from './kit/Hotspot';
import { Burst } from './kit/Burst';
import { WaterMaterial, GlowMaterial } from './kit/materials';
import { Building } from './kit/scene-parts';
import { Boat, MarketStall, Hill, Person } from './kit/scene-parts-extra';
import { SceneBanner, SceneBadge, DataReadout, WinScreen } from './kit/overlays';
import { ChoiceRow, StepTracker, type ChoiceItem } from './kit/controls';
import { damp } from './kit/damp';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Lyspære-øyeblikk: Makt flyttes uten soldater. Eleven leder et lite kystland
// gjennom tre byggerunder i havna. Hver runde velger hen stort eller lite lån
// fra banken - det store kinesiske lasteskipet som ligger for anker. Store lån
// gir spektakulære anlegg, men gjelden vokser mye fortere enn havnas inntekt.
// På nedbetalingsdagen kommer regningen: tok eleven for store lån, må havna
// leies bort i 99 år - flagget byttes, kailysene skifter til rødt og gull, og
// et gjerde tegner seg rundt havna. Bygde hen forsiktig, beholder landet
// kontrollen. Kjerne: den som eier gjelden, kan ende med å eie havna.
// Basert på Hambantota, Sri Lanka 2017.

type LoanSize = 'stor' | 'liten';
type Phase = 'velg' | 'bygg' | 'oppgjor' | 'kontrakt' | 'signert' | 'beholdt' | 'ferdig';

interface RoundSpec {
    id: string;
    title: string;
    spot: [number, number, number];
    stor: { kost: number; inntekt: number };
    liten: { kost: number; inntekt: number };
}

const ROUNDS: RoundSpec[] = [
    {
        id: 'molo',
        title: 'Havnebasseng og molo',
        spot: [-5.6, 1.0, -1.6],
        stor: { kost: 500, inntekt: 16 },
        liten: { kost: 150, inntekt: 12 },
    },
    {
        id: 'kai',
        title: 'Kraner og kaier',
        spot: [-3.1, 1.6, 1.0],
        stor: { kost: 600, inntekt: 24 },
        liten: { kost: 200, inntekt: 18 },
    },
    {
        id: 'bane',
        title: 'Jernbane innover i landet',
        spot: [2.6, 1.0, -1.6],
        stor: { kost: 700, inntekt: 30 },
        liten: { kost: 250, inntekt: 22 },
    },
];

// Årlig avdrag per lån: store lån koster mye mer å betjene enn små.
const AVDRAG: Record<LoanSize, number> = { stor: 30, liten: 8 };

const OFFICE_POS: [number, number, number] = [0.8, 0.15, 3.4];
const FLAG_POS: [number, number, number] = [1.8, 0.15, 4.3];
const CONTRACT_SPOT: [number, number, number] = [1.8, 3.1, 4.3];

// Deterministisk pseudo-random (modulnivå, aldri let-mutasjon i useMemo).
function prand(seed: number): number {
    let s = (seed * 2654435761) >>> 0;
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
}

const Gjeldshavna3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const { play } = useStepSounds();
    const [round, setRound] = useState(0);
    const [phase, setPhase] = useState<Phase>('velg');
    const [loans, setLoans] = useState<(LoanSize | null)[]>([null, null, null]);
    const [built, setBuilt] = useState(0);
    const [debt, setDebt] = useState(0);
    const [income, setIncome] = useState(0);
    const [shownDebt, setShownDebt] = useState(0);
    const [shownIncome, setShownIncome] = useState(0);
    const [burstCount, setBurstCount] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([0, 1.5, 0]);
    const [leased, setLeased] = useState(false);
    const [done, setDone] = useState(false);
    const [utfall, setUtfall] = useState<'leid' | 'beholdt' | null>(null);

    const payment = loans.reduce((sum, l) => sum + (l ? AVDRAG[l] : 0), 0);
    const lost = payment > income;

    // Telleren tikker seg oppover - eleven SER gjelden hoppe og inntekten krype.
    useEffect(() => {
        if (shownDebt >= debt) return;
        const t = setTimeout(() => setShownDebt((v) => Math.min(debt, v + 25)), 40);
        return () => clearTimeout(t);
    }, [shownDebt, debt]);

    useEffect(() => {
        if (shownIncome >= income) return;
        const t = setTimeout(() => setShownIncome((v) => Math.min(income, v + 1)), 60);
        return () => clearTimeout(t);
    }, [shownIncome, income]);

    // Nedbetalingsdagen: etter en pause faller dommen - kontrakt eller kontroll.
    useEffect(() => {
        if (phase === 'oppgjor') {
            const t = setTimeout(() => {
                if (lost) {
                    setPhase('kontrakt');
                    play('sceneChange');
                } else {
                    setPhase('beholdt');
                    play('correct');
                }
            }, 3400);
            return () => clearTimeout(t);
        }
        if (phase === 'signert' || phase === 'beholdt') {
            const path = phase === 'signert' ? 'leid' : 'beholdt';
            const t = setTimeout(
                () => {
                    if (path === 'beholdt') {
                        setBurstPos([OFFICE_POS[0], 2.2, OFFICE_POS[2]]);
                        setBurstCount((b) => b + 1);
                    }
                    setUtfall(path);
                    setDone(true);
                    setPhase('ferdig');
                    play('complete');
                    onComplete({ score: 1, completed: true, artifact: { utfall: path, laan: loans } });
                },
                phase === 'signert' ? 3200 : 2800
            );
            return () => clearTimeout(t);
        }
    }, [phase, lost, loans, onComplete, play]);

    const handleChoose = (id: string) => {
        if (phase !== 'velg' || done) return;
        const size: LoanSize = id === 'stor' ? 'stor' : 'liten';
        const spec = ROUNDS[round];
        setLoans((prev) => prev.map((l, i) => (i === round ? size : l)));
        setDebt((v) => v + spec[size].kost);
        setPhase('bygg');
        play('advance');
    };

    const handleBuild = () => {
        if (phase !== 'bygg') return;
        const size = loans[round];
        if (!size) return;
        const spec = ROUNDS[round];
        setIncome((v) => v + spec[size].inntekt);
        setBuilt((b) => b + 1);
        if (size === 'stor') {
            setBurstPos([spec.spot[0], spec.spot[1] + 1, spec.spot[2]]);
            setBurstCount((b) => b + 1);
            play('correct');
        } else {
            play('drop');
        }
        if (round < 2) {
            setRound((r) => r + 1);
            setPhase('velg');
        } else {
            setPhase('oppgjor');
        }
    };

    const handleSign = () => {
        if (phase !== 'kontrakt') return;
        setLeased(true);
        setPhase('signert');
        play('incorrect');
    };

    const reset = () => {
        setRound(0);
        setPhase('velg');
        setLoans([null, null, null]);
        setBuilt(0);
        setDebt(0);
        setIncome(0);
        setShownDebt(0);
        setShownIncome(0);
        setLeased(false);
        setDone(false);
        setUtfall(null);
    };

    const banner = done
        ? null
        : phase === 'velg'
          ? `Runde ${round + 1} av 3: ${ROUNDS[round].title}. Velg lån under vinduet.`
          : phase === 'bygg'
            ? 'Pengene er på konto. Klikk på det lysende byggepunktet i havna.'
            : phase === 'oppgjor'
              ? `Nedbetalingsdag. Avdragene koster $${payment}M i året - havna tjener $${income}M.`
              : phase === 'kontrakt'
                ? 'Du kan ikke betale. Kina tilbyr: lei bort havna i 99 år. Klikk på kontrakten.'
                : phase === 'signert'
                  ? 'Flagget senkes og et nytt heises. Havna er på nye hender i 99 år.'
                  : 'Inntektene dekker avdragene. Havna er liten, men den er din.';

    const spec = ROUNDS[round];
    const choices: ChoiceItem[] = [
        {
            id: 'stor',
            title: 'Stort lån - bygg raskt',
            blurb: `Lån $${spec.stor.kost}M fra banken på skipet. Stort og imponerende anlegg med en gang.`,
            icon: Banknote,
            status: 'available',
        },
        {
            id: 'liten',
            title: 'Lite lån - bygg forsiktig',
            blurb: `Lån $${spec.liten.kost}M. Enklere anlegg, men avdrag landet klarer å betale.`,
            icon: Coins,
            status: 'available',
        },
    ];

    const infoText =
        phase === 'bygg'
            ? `Du lånte $${loans[round] ? spec[loans[round] as LoanSize].kost : 0}M. Klikk på det lysende punktet i scenen for å bygge.`
            : phase === 'oppgjor'
              ? 'Tre anlegg står ferdig. Nå kommer regningen: hvert lån skal betales tilbake, år etter år.'
              : phase === 'kontrakt'
                ? 'Havna tjener ikke nok til å dekke avdragene. Långiveren tilbyr en løsning: de tar over havna i 99 år, og gjelden slettes.'
                : phase === 'signert'
                  ? 'Ingen soldater, ingen krig. Bare en underskrift - og havna skiftet eier.'
                  : 'Du bygde i takt med det havna faktisk tjente. Gjelden er til å leve med.';

    return (
        <MicroGameScaffold
            title="Gjeldshavna: lånet som tok havna"
            subtitle="Bygg drømmehavna for lånte penger - og se hvem som eier den til slutt"
            estimatedSeconds={160}
            onRetry={loans[0] !== null || done ? reset : undefined}
            scene={
                <HavnaScene
                    built={built}
                    loans={loans}
                    phase={phase}
                    round={round}
                    leased={leased}
                    burstCount={burstCount}
                    burstPos={burstPos}
                    onBuild={handleBuild}
                    onSign={handleSign}
                />
            }
            canvas={{
                idle: built === 0 && phase === 'velg',
                camera: { position: [8.5, 6.5, 11.5], fov: 42 },
                background: '#cfeef5',
                fog: { color: '#cfeef5', near: 28, far: 55 },
                target: [-0.5, 0.5, 0.5],
            }}
            containerClassName="bg-gradient-to-b from-[#d9f3f8] via-[#cfeef5] to-[#efe3c0]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Gjeld', value: `$${shownDebt}M` },
                            { label: 'Havnas inntekt', value: `$${shownIncome}M/år` },
                        ]}
                    />
                    <SceneBadge corner="br">Sri Lanka 2017</SceneBadge>
                </>
            }
        >
            {done && utfall ? (
                utfall === 'leid' ? (
                    <WinScreen title="Havna er leid bort i 99 år" onReplay={reset}>
                        Du bygde stort og raskt for lånte penger, men havna tjente aldri nok til å
                        betale avdragene. Da regningen kom, tok långiveren havna som betaling - uten
                        et eneste skudd. Makt flyttes uten soldater: den som eier gjelden, kan ende
                        med å eie havna. Akkurat dette skjedde med havna Hambantota på Sri Lanka i
                        2017. Prøv den andre veien: klarer du å beholde havna med små lån?
                    </WinScreen>
                ) : (
                    <WinScreen title="Havna er fortsatt din" onReplay={reset}>
                        Du lånte forsiktig og bygde i takt med det havna faktisk tjente. Havna ble
                        mindre og enklere enn i drømmen, men flagget ditt vaier fortsatt over
                        havnekontoret. Makt flyttes uten soldater: den som eier gjelden, kan ende
                        med å eie havna - men denne gangen var gjelden liten nok til å betale. Prøv
                        den andre veien: se hva som skjer med de store lånene.
                    </WinScreen>
                )
            ) : phase === 'velg' ? (
                <div className="space-y-2.5">
                    <StepTracker current={round + 1} total={3} />
                    <ChoiceRow items={choices} onSelect={handleChoose} />
                </div>
            ) : (
                <div className="space-y-2">
                    <StepTracker current={Math.min(round + 1, 3)} total={3} />
                    <p className="text-xs text-slate-600 leading-relaxed">{infoText}</p>
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function HavnaScene({
    built,
    loans,
    phase,
    round,
    leased,
    burstCount,
    burstPos,
    onBuild,
    onSign,
}: {
    built: number;
    loans: (LoanSize | null)[];
    phase: Phase;
    round: number;
    leased: boolean;
    burstCount: number;
    burstPos: [number, number, number];
    onBuild: () => void;
    onSign: () => void;
}) {
    return (
        <group>
            {/* Turkist hav med ekte bølger */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0, 0]}>
                <planeGeometry args={[30, 30, 36, 36]} />
                <WaterMaterial color="#2fb0c4" waveHeight={0.08} waveScale={0.7} />
            </mesh>

            {/* Sandete kystland */}
            <mesh position={[5.5, -0.11, 0]} receiveShadow>
                <boxGeometry args={[18, 0.52, 30]} />
                <meshStandardMaterial color="#e3d29a" roughness={1} />
            </mesh>
            {/* Grønt innland */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.17, 0]} receiveShadow>
                <planeGeometry args={[9, 30]} />
                <meshStandardMaterial color="#7fa653" roughness={1} />
            </mesh>
            <Hill position={[12.5, 0.15, -9]} radius={4} height={2.6} color="#6f9a4d" seed={3} />
            <Hill position={[13, 0.15, 7]} radius={3.4} height={2} color="#7aa257" seed={7} />

            {/* Fiskerlandsby */}
            <Building position={[3.2, 0.15, 5.6]} body="#d9784a" roof="#8a4a30" seed={1} />
            <Building position={[4.7, 0.15, 7.1]} body="#e8c76a" roof="#9a6a3a" seed={2} />
            <Building position={[5.6, 0.15, 4.9]} body="#c2603e" roof="#7a4030" seed={3} />
            <Building position={[4.0, 0.15, -5.2]} body="#7fa3b8" roof="#4a6a7a" seed={4} />
            <Building position={[5.9, 0.15, -6.6]} body="#e0a05a" roof="#8a5a34" seed={5} />
            <MarketStall position={[2.7, 0.15, -4.1]} rotation={[0, 0.5, 0]} />
            <Person position={[2.1, 0.15, -3.2]} body="#b5533c" hat="cap" hatColor="#e8c76a" />
            <Person position={[3.4, 0.15, -3.0]} body="#3e7f8f" pose="walk" />

            {/* Palmer langs stranda */}
            <Palm position={[1.4, 0.15, 6.6]} seed={11} />
            <Palm position={[6.6, 0.15, 8.2]} seed={12} />
            <Palm position={[2.1, 0.15, -7.4]} seed={13} />
            <Palm position={[7.2, 0.15, -3.4]} seed={14} />
            <Palm position={[9.2, 0.15, 5.6]} seed={15} />
            <Palm position={[-1.8, 0.15, 7.2]} seed={16} />
            <Palm position={[-1.2, 0.15, -6.0]} seed={17} />

            {/* Små fiskebåter */}
            <BobbingBoat position={[-5.4, 0, 6.4]} rotation={[0, 0.7, 0]} phase={0} />
            <BobbingBoat position={[-6.8, 0, 8.0]} rotation={[0, -0.4, 0]} phase={2.2} sail="#efe7d2" />

            {/* Banken: det kinesiske lasteskipet for anker */}
            <CargoShip />

            {/* Havnekontor med flaggstang */}
            <Building position={OFFICE_POS} body="#f2ead8" roof="#b5533c" w={1.9} h={1.25} d={1.4} />
            <Flagpole position={FLAG_POS} leased={leased} />

            {/* De tre anleggene - reiser seg med dempet animasjon når de bygges */}
            {built > 0 && loans[0] && (
                <Grow position={[-3.8, 0, -3.4]}>
                    <Molo size={loans[0]} />
                </Grow>
            )}
            {built > 1 && loans[1] && (
                <Grow position={[-3.1, 0, 1]}>
                    <KaiAnlegg size={loans[1]} leased={leased} />
                </Grow>
            )}
            {built > 2 && loans[2] && (
                <Grow position={[-1.4, 0.18, -1.5]}>
                    <Jernbane size={loans[2]} />
                </Grow>
            )}

            {/* Gjerdet som tegner seg rundt havna ved 99-årsavtalen */}
            <Fence active={leased} />

            {/* Byggepunkt for runden */}
            {phase === 'bygg' && (
                <Hotspot
                    position={ROUNDS[round].spot}
                    onSelect={onBuild}
                    label={`Bygg: ${ROUNDS[round].title}`}
                    sound={null}
                    radius={0.55}
                />
            )}

            {/* Kontrakten på nedbetalingsdagen */}
            {phase === 'kontrakt' && (
                <Hotspot
                    position={CONTRACT_SPOT}
                    onSelect={onSign}
                    label="Signer 99-årskontrakten"
                    sound={null}
                    radius={0.6}
                />
            )}

            <Burst position={burstPos} trigger={burstCount} color="#ffd23a" count={30} spread={3.6} />
        </group>
    );
}

// Reiser et anlegg mykt fra bakken (damp fra 0 til full størrelse).
function Grow({
    position,
    speed = 2.4,
    children,
}: {
    position: [number, number, number];
    speed?: number;
    children: React.ReactNode;
}) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!g.current) return;
        g.current.scale.setScalar(damp(g.current.scale.x, 1, dt, speed));
    });
    return (
        <group position={position}>
            <group ref={g} scale={0.001}>
                {children}
            </group>
        </group>
    );
}

// ── Runde 1: molo og havnebasseng ────────────────────────────────────────────

const MOLO_ARM: [number, number][] = [
    [0, 0],
    [-0.8, 0.2],
    [-1.6, 0.55],
    [-2.3, 1.05],
    [-2.9, 1.7],
    [-3.3, 2.5],
    [-3.5, 3.4],
];
const MOLO_ARM_2: [number, number][] = [
    [-0.3, 8.4],
    [-1.1, 8.7],
    [-1.9, 8.8],
];

function MoloStein({ x, z, seed }: { x: number; z: number; seed: number }) {
    return (
        <mesh position={[x, 0.28, z]} rotation={[0, (prand(seed) - 0.5) * 0.5, 0]} castShadow>
            <boxGeometry args={[1.05, 0.6, 0.95]} />
            <meshStandardMaterial color="#98928a" roughness={1} />
        </mesh>
    );
}

function Molo({ size }: { size: LoanSize }) {
    const stor = size === 'stor';
    const arm = stor ? MOLO_ARM : MOLO_ARM.slice(0, 4);
    const tip = arm[arm.length - 1];
    return (
        <group>
            {arm.map(([x, z], i) => (
                <MoloStein key={i} x={x} z={z} seed={i + 1} />
            ))}
            {stor &&
                MOLO_ARM_2.map(([x, z], i) => <MoloStein key={`b${i}`} x={x} z={z} seed={i + 20} />)}
            {/* Fyrlykt på molotuppen - bare det store anlegget får den */}
            {stor && (
                <group position={[tip[0], 0.58, tip[1]]}>
                    <mesh position={[0, 0.35, 0]} castShadow>
                        <cylinderGeometry args={[0.14, 0.18, 0.7, 8]} />
                        <meshStandardMaterial color="#f2ead8" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.78, 0]}>
                        <sphereGeometry args={[0.11, 10, 10]} />
                        <GlowMaterial color="#ff5a3c" intensity={1.4} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

// ── Runde 2: kai, kraner og kailys ───────────────────────────────────────────

function Crane({ position, height = 2.4 }: { position: [number, number, number]; height?: number }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.15, 0]} castShadow>
                <boxGeometry args={[0.6, 0.3, 0.6]} />
                <meshStandardMaterial color="#3f4750" roughness={0.7} />
            </mesh>
            <mesh position={[0, height / 2, 0]} castShadow>
                <boxGeometry args={[0.22, height, 0.22]} />
                <meshStandardMaterial color="#d9822b" roughness={0.6} />
            </mesh>
            <mesh position={[-0.9, height, 0]} castShadow>
                <boxGeometry args={[2.4, 0.14, 0.14]} />
                <meshStandardMaterial color="#d9822b" roughness={0.6} />
            </mesh>
            <mesh position={[0.5, height - 0.25, 0]} castShadow>
                <boxGeometry args={[0.35, 0.3, 0.3]} />
                <meshStandardMaterial color="#3f4750" roughness={0.7} />
            </mesh>
            <mesh position={[-1.7, height - 0.55, 0]}>
                <boxGeometry args={[0.03, 1.0, 0.03]} />
                <meshStandardMaterial color="#2b2f33" />
            </mesh>
            <mesh position={[-1.7, height - 1.1, 0]} castShadow>
                <boxGeometry args={[0.18, 0.14, 0.18]} />
                <meshStandardMaterial color="#c0392b" roughness={0.6} />
            </mesh>
        </group>
    );
}

function ContainerStack({
    position,
    tall = false,
}: {
    position: [number, number, number];
    tall?: boolean;
}) {
    const colors = ['#c0392b', '#e8a13a', '#2d6cdf'];
    return (
        <group position={position}>
            {(tall ? [0, 1, 2] : [0, 1]).map((i) => (
                <mesh key={i} position={[0, 0.19 + i * 0.38, 0]} castShadow>
                    <boxGeometry args={[0.55, 0.36, 1.05]} />
                    <meshStandardMaterial color={colors[i % 3]} roughness={0.7} />
                </mesh>
            ))}
        </group>
    );
}

const TMP_COLOR = new THREE.Color();

// Kailys som skifter fra varmt hvitt til rødt/gull når havna leies bort.
function LampPost({
    position,
    leased,
    gold = false,
}: {
    position: [number, number, number];
    leased: boolean;
    gold?: boolean;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!mat.current) return;
        TMP_COLOR.set(leased ? (gold ? '#ffb000' : '#ff2d2d') : '#fff3cf');
        const k = 1 - Math.exp(-dt * 3);
        mat.current.color.lerp(TMP_COLOR, k);
        mat.current.emissive.lerp(TMP_COLOR, k);
        mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, leased ? 1.9 : 0.5, dt, 3);
    });
    return (
        <group position={position}>
            <mesh position={[0, 0.45, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.05, 0.9, 6]} />
                <meshStandardMaterial color="#4a5560" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.95, 0]}>
                <sphereGeometry args={[0.09, 10, 10]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#fff3cf"
                    emissive="#fff3cf"
                    emissiveIntensity={0.5}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}

function KaiAnlegg({ size, leased }: { size: LoanSize; leased: boolean }) {
    const stor = size === 'stor';
    const len = stor ? 6.4 : 3.8;
    return (
        <group>
            <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.9, 0.62, len]} />
                <meshStandardMaterial color="#b7b0a4" roughness={0.9} />
            </mesh>
            {stor ? (
                <>
                    <Crane position={[0.2, 0.69, -2.1]} height={2.7} />
                    <Crane position={[0.2, 0.69, 0.1]} height={2.7} />
                    <Crane position={[0.2, 0.69, 2.3]} height={2.7} />
                    <ContainerStack position={[0.6, 0.69, -1.0]} tall />
                    <ContainerStack position={[0.6, 0.69, 1.2]} />
                </>
            ) : (
                <Crane position={[0.2, 0.69, 0.2]} height={2.0} />
            )}
            <LampPost position={[0.78, 0.69, -len / 2 + 0.4]} leased={leased} />
            <LampPost position={[0.78, 0.69, 0]} leased={leased} gold />
            <LampPost position={[0.78, 0.69, len / 2 - 0.4]} leased={leased} />
        </group>
    );
}

// ── Runde 3: jernbanen innover i landet ──────────────────────────────────────

function Jernbane({ size }: { size: LoanSize }) {
    const stor = size === 'stor';
    const len = stor ? 13 : 7;
    const sleepers = stor ? 13 : 8;
    return (
        <group rotation={[0, -0.06, 0]}>
            {Array.from({ length: sleepers }).map((_, i) => (
                <mesh
                    key={i}
                    position={[0.5 + (i * (len - 1)) / (sleepers - 1), 0.05, 0]}
                    receiveShadow
                >
                    <boxGeometry args={[0.24, 0.07, 0.85]} />
                    <meshStandardMaterial color="#5c4a33" roughness={0.95} />
                </mesh>
            ))}
            {[-0.24, 0.24].map((z) => (
                <mesh key={z} position={[len / 2, 0.11, z]} castShadow>
                    <boxGeometry args={[len, 0.07, 0.09]} />
                    <meshStandardMaterial color="#788089" metalness={0.5} roughness={0.4} />
                </mesh>
            ))}
            {stor ? (
                <>
                    <Building
                        position={[len - 1.6, 0, -1.6]}
                        body="#c47b3a"
                        roof="#7a4a2c"
                        w={1.9}
                        h={1.1}
                        d={1.3}
                    />
                    <mesh position={[len - 4.2, 0.55, 1.3]} castShadow receiveShadow>
                        <boxGeometry args={[2.4, 1.1, 1.5]} />
                        <meshStandardMaterial color="#93a0ab" roughness={0.8} />
                    </mesh>
                    <mesh position={[2.4, 0.42, 0]} castShadow>
                        <boxGeometry args={[1.6, 0.55, 0.7]} />
                        <meshStandardMaterial color="#7a3b2e" roughness={0.8} />
                    </mesh>
                </>
            ) : (
                <mesh position={[len - 1, 0.2, -0.9]} castShadow receiveShadow>
                    <boxGeometry args={[1.5, 0.35, 0.7]} />
                    <meshStandardMaterial color="#b7a98c" roughness={0.9} />
                </mesh>
            )}
        </group>
    );
}

// ── Flaggstang: landets flagg senkes, det kinesiske heises ───────────────────

function Flagpole({ position, leased }: { position: [number, number, number]; leased: boolean }) {
    const local = useRef<THREE.Group>(null);
    const kina = useRef<THREE.Group>(null);
    useFrame(({ clock }, dt) => {
        const wave = Math.sin(clock.getElapsedTime() * 2.2) * 0.14;
        if (local.current) {
            local.current.position.y = damp(local.current.position.y, leased ? 0.5 : 2.05, dt, 1.4);
            local.current.rotation.y = wave;
        }
        if (kina.current) {
            kina.current.position.y = damp(kina.current.position.y, leased ? 2.05 : 0.5, dt, 1.4);
            const s = damp(kina.current.scale.x, leased ? 1 : 0.001, dt, 1.6);
            kina.current.scale.setScalar(s);
            kina.current.rotation.y = -wave;
        }
    });
    return (
        <group position={position}>
            <mesh position={[0, 1.25, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.05, 2.5, 8]} />
                <meshStandardMaterial color="#d8d2c4" roughness={0.5} metalness={0.3} />
            </mesh>
            <mesh position={[0, 2.55, 0]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#e3b23c" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Landets flagg */}
            <group ref={local} position={[0, 2.05, 0]}>
                <mesh position={[0.45, 0, 0]} castShadow>
                    <planeGeometry args={[0.85, 0.5]} />
                    <meshStandardMaterial color="#8d2029" roughness={0.85} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.06, 0, 0.001]}>
                    <planeGeometry args={[0.09, 0.5]} />
                    <meshStandardMaterial color="#e3b23c" roughness={0.85} side={THREE.DoubleSide} />
                </mesh>
            </group>
            {/* Det kinesiske flagget */}
            <group ref={kina} position={[0, 0.5, 0]} scale={0.001}>
                <mesh position={[0.45, 0, 0]} castShadow>
                    <planeGeometry args={[0.85, 0.5]} />
                    <meshStandardMaterial color="#de2910" roughness={0.85} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.18, 0.12, 0.002]}>
                    <circleGeometry args={[0.06, 5]} />
                    <meshStandardMaterial color="#ffde00" roughness={0.7} side={THREE.DoubleSide} />
                </mesh>
            </group>
        </group>
    );
}

// ── Gjerdet som tegner seg rundt havneområdet ────────────────────────────────

const FENCE_PTS: [number, number][] = [
    [-3.3, -3.4],
    [-1.8, -3.4],
    [-0.3, -3.4],
    [1.2, -3.4],
    [1.9, -2.4],
    [1.9, -0.9],
    [1.9, 0.6],
    [1.9, 2.1],
    [1.9, 3.6],
    [1.9, 5.0],
    [0.6, 5.4],
    [-0.9, 5.4],
    [-2.4, 5.4],
    [-3.3, 5.4],
];

interface FenceSeg {
    mid: [number, number];
    angle: number;
    len: number;
}

const FENCE_SEGS: FenceSeg[] = FENCE_PTS.slice(0, -1).map((p, i) => {
    const q = FENCE_PTS[i + 1];
    const dx = q[0] - p[0];
    const dz = q[1] - p[1];
    return {
        mid: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2],
        angle: Math.atan2(dz, dx),
        len: Math.hypot(dx, dz),
    };
});

function Fence({ active }: { active: boolean }) {
    const prog = useRef(0);
    const posts = useRef<(THREE.Group | null)[]>([]);
    const rails = useRef<(THREE.Group | null)[]>([]);
    useFrame((_, dt) => {
        prog.current = damp(prog.current, active ? 1.05 : 0, dt, 0.9);
        const n = FENCE_PTS.length;
        for (let i = 0; i < n; i++) {
            const k = THREE.MathUtils.clamp(prog.current * (n + 2) - i, 0.001, 1);
            posts.current[i]?.scale.setScalar(k);
        }
        for (let i = 0; i < FENCE_SEGS.length; i++) {
            const k = THREE.MathUtils.clamp(prog.current * (n + 2) - i - 0.5, 0.001, 1);
            rails.current[i]?.scale.set(k, k, 1);
        }
    });
    return (
        <group position={[0, 0.15, 0]}>
            {FENCE_PTS.map((p, i) => (
                <group
                    key={`p${i}`}
                    position={[p[0], 0, p[1]]}
                    scale={0.001}
                    ref={(el) => {
                        posts.current[i] = el;
                    }}
                >
                    <mesh position={[0, 0.5, 0]} castShadow>
                        <cylinderGeometry args={[0.045, 0.045, 1, 6]} />
                        <meshStandardMaterial color="#6d7681" metalness={0.4} roughness={0.5} />
                    </mesh>
                </group>
            ))}
            {FENCE_SEGS.map((s, i) => (
                <group
                    key={`r${i}`}
                    position={[s.mid[0], 0, s.mid[1]]}
                    rotation={[0, -s.angle, 0]}
                    scale={0.001}
                    ref={(el) => {
                        rails.current[i] = el;
                    }}
                >
                    <mesh position={[0, 0.5, 0]}>
                        <planeGeometry args={[s.len, 0.75]} />
                        <meshStandardMaterial
                            color="#8d97a2"
                            transparent
                            opacity={0.4}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    <mesh position={[0, 0.92, 0]}>
                        <boxGeometry args={[s.len, 0.04, 0.04]} />
                        <meshStandardMaterial color="#6d7681" metalness={0.4} roughness={0.5} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ── Staffasje: palmer, fiskebåter og banken (lasteskipet) ────────────────────

function Palm({ position, seed = 1 }: { position: [number, number, number]; seed?: number }) {
    const lean = (prand(seed) - 0.5) * 0.3;
    const h = 1.5 + prand(seed + 1) * 0.6;
    return (
        <group position={position} rotation={[0, prand(seed + 2) * Math.PI * 2, lean]}>
            <mesh position={[0, h / 2, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.1, h, 6]} />
                <meshStandardMaterial color="#8a6b42" roughness={0.9} />
            </mesh>
            <group position={[0, h, 0]}>
                {[0, 1, 2, 3, 4, 5].map((i) => {
                    const a = (i / 6) * Math.PI * 2 + prand(seed + 3) * 0.6;
                    return (
                        <group key={i} rotation={[0, a, 0]}>
                            <mesh position={[0.55, 0.08, 0]} rotation={[0, 0, -0.4]} castShadow>
                                <boxGeometry args={[1.15, 0.045, 0.32]} />
                                <meshStandardMaterial color="#3f8f4f" roughness={0.9} />
                            </mesh>
                        </group>
                    );
                })}
                <mesh position={[0, -0.05, 0]} castShadow>
                    <sphereGeometry args={[0.09, 8, 8]} />
                    <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
                </mesh>
            </group>
        </group>
    );
}

function BobbingBoat({
    position,
    rotation,
    phase = 0,
    sail,
}: {
    position: [number, number, number];
    rotation?: [number, number, number];
    phase?: number;
    sail?: string;
}) {
    const g = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!g.current) return;
        const t = clock.getElapsedTime() + phase;
        g.current.position.y = Math.sin(t * 0.9) * 0.05;
        g.current.rotation.z = Math.sin(t * 0.7) * 0.03;
    });
    return (
        <group position={position} rotation={rotation}>
            <group ref={g}>
                <Boat color="#7a5230" sail={sail} />
            </group>
        </group>
    );
}

// Det store kinesiske lasteskipet for anker - banken i spillet.
function CargoShip() {
    const g = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!g.current) return;
        const t = clock.getElapsedTime();
        g.current.position.y = Math.sin(t * 0.55) * 0.07;
        g.current.rotation.z = Math.sin(t * 0.4) * 0.02;
    });
    return (
        <group position={[-11.5, 0, -5.5]} rotation={[0, 0.5, 0]}>
            <group ref={g}>
                {/* Skrog */}
                <mesh position={[0, 0.55, 0]} castShadow>
                    <boxGeometry args={[6.2, 1.1, 2.0]} />
                    <meshStandardMaterial color="#8a3324" roughness={0.7} />
                </mesh>
                <mesh position={[0, 1.14, 0]} castShadow>
                    <boxGeometry args={[6.3, 0.12, 2.1]} />
                    <meshStandardMaterial color="#3f4750" roughness={0.7} />
                </mesh>
                {/* Bro akter */}
                <mesh position={[2.4, 1.85, 0]} castShadow>
                    <boxGeometry args={[0.95, 1.4, 1.7]} />
                    <meshStandardMaterial color="#f0ede4" roughness={0.7} />
                </mesh>
                <mesh position={[2.4, 2.6, 0]} castShadow>
                    <boxGeometry args={[0.6, 0.16, 1.0]} />
                    <meshStandardMaterial color="#3f4750" roughness={0.7} />
                </mesh>
                {/* Containere i rødt og gull */}
                {[-1.9, -0.9, 0.1, 1.1].map((x, i) => (
                    <group key={i} position={[x, 1.2, 0]}>
                        <mesh position={[0, 0.25, 0.45]} castShadow>
                            <boxGeometry args={[0.85, 0.5, 0.8]} />
                            <meshStandardMaterial
                                color={i % 2 ? '#c0392b' : '#e8a13a'}
                                roughness={0.7}
                            />
                        </mesh>
                        <mesh position={[0, 0.25, -0.45]} castShadow>
                            <boxGeometry args={[0.85, 0.5, 0.8]} />
                            <meshStandardMaterial
                                color={i % 2 ? '#e8a13a' : '#c0392b'}
                                roughness={0.7}
                            />
                        </mesh>
                        {i % 2 === 0 && (
                            <mesh position={[0, 0.75, 0]} castShadow>
                                <boxGeometry args={[0.85, 0.5, 0.8]} />
                                <meshStandardMaterial color="#2d6cdf" roughness={0.7} />
                            </mesh>
                        )}
                    </group>
                ))}
                {/* Skipskran */}
                <mesh position={[-2.7, 1.9, 0]} castShadow>
                    <boxGeometry args={[0.16, 1.5, 0.16]} />
                    <meshStandardMaterial color="#d9822b" roughness={0.6} />
                </mesh>
                <mesh position={[-3.3, 2.55, 0]} rotation={[0, 0, 0.35]} castShadow>
                    <boxGeometry args={[1.5, 0.12, 0.12]} />
                    <meshStandardMaterial color="#d9822b" roughness={0.6} />
                </mesh>
                {/* Flagg akter */}
                <group position={[2.9, 2.9, 0]}>
                    <mesh position={[0, 0.25, 0]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
                        <meshStandardMaterial color="#d8d2c4" roughness={0.5} />
                    </mesh>
                    <mesh position={[0.22, 0.38, 0]}>
                        <planeGeometry args={[0.42, 0.26]} />
                        <meshStandardMaterial
                            color="#de2910"
                            roughness={0.85}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

export default Gjeldshavna3D;
