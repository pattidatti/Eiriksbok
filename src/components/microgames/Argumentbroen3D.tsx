import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    SceneBanner,
    WinScreen,
    DataReadout,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill for km-16 (Dagsaktuelle tema). Kjernen: et argument har tre deler -
// påstand, belegg og forklaring. Forklaringen er BROEN mellom belegget og påstanden.
// Uten den henger de to delene i lufta på hver sin side av kløften.
//
// Scene: minimalistisk lyst rom med et bredt gap i gulvet.
// Venstre: Belegg-tårn (glødende kube). Høyre: Påstand-tårn (hvit sfære).
// I lufta: 3 planker (Hotspot). En er den ekte forklaringen. To er feil.
// Riktig planke → detter ned og sveiser seg fast som bro → figur-bue lyser opp → Burst.
// Gal planke → rister og forsvinner (respawn etter 1 sek).
//
// 2 runder med ulike temaer. Lyspære: uten forklaringen - ingen bro.

interface Round {
    topic: string;
    claim: string;
    source: string;
    planks: { label: string; correct: boolean }[];
}

const ROUNDS: Round[] = [
    {
        topic: 'Klimakvotehandel',
        claim: 'Klimakvotehandel er ikke nok for å nå 1,5-gradersmålet.',
        source: 'FNs klimapanel: verden er på vei mot 2,7°C med dagens kvotesystemer.',
        planks: [
            {
                label: 'Siden vi ser at kvotene ikke er tilstrekkelige, betyr det at vi trenger strengere tiltak.',
                correct: true,
            },
            { label: 'I tillegg er det mange land som ikke deltar i kvotehandel.', correct: false },
            {
                label: 'Det er selvsagt klart at klimakrisen er vår tids største utfordring.',
                correct: false,
            },
        ],
    },
    {
        topic: 'Reklameforbud for barn',
        claim: 'Norge bør innføre reklameforbud for usunn mat rettet mot barn.',
        source: 'Folkehelseinstituttet: barn som ser mye matvarereklame spiser mer sukker og fett.',
        planks: [
            {
                label: 'Siden barn ikke kan motstå profesjonell markedsføring, bør vi beskytte dem med et forbud.',
                correct: true,
            },
            {
                label: 'Dessuten bruker matvarebransjen milliarder på reklame hvert år.',
                correct: false,
            },
            { label: 'Det er klart at reklame er skadelig i alle sammenhenger.', correct: false },
        ],
    },
];

// Belegg-tårn (venstre)
function BeleggTower({ glow }: { glow: number }) {
    const emRef = useRef(0);
    useFrame((_, dt) => {
        emRef.current = damp(emRef.current, glow * 0.8, dt, 3);
    });
    return (
        <group position={[-4.5, 0, 0]}>
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[2, 1.6, 2]} />
                <meshStandardMaterial color="#e0f2fe" />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
                <boxGeometry args={[1.2, 0.6, 1.2]} />
                <meshStandardMaterial
                    color="#38bdf8"
                    emissive="#38bdf8"
                    emissiveIntensity={0.6 + glow * 0.8}
                />
            </mesh>
            <mesh position={[0, 2.4, 0]}>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={glow} />
            </mesh>
        </group>
    );
}

// Påstand-tårn (høyre)
function PaastrandTower({ glow }: { glow: number }) {
    return (
        <group position={[4.5, 0, 0]}>
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[2, 1.6, 2]} />
                <meshStandardMaterial color="#f0fdf4" />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.8, 16, 12]} />
                <meshStandardMaterial
                    color="#f8fafc"
                    emissive="#6366f1"
                    emissiveIntensity={glow * 1.2}
                    roughness={0.2}
                    metalness={0.1}
                />
            </mesh>
        </group>
    );
}

// Kløften i gulvet
function Chasm() {
    return (
        <group>
            {/* Venstre side gulv */}
            <mesh position={[-5.5, -0.1, 0]} receiveShadow>
                <boxGeometry args={[5, 0.2, 6]} />
                <meshStandardMaterial color="#f1f5f9" />
            </mesh>
            {/* Høyre side gulv */}
            <mesh position={[5.5, -0.1, 0]} receiveShadow>
                <boxGeometry args={[5, 0.2, 6]} />
                <meshStandardMaterial color="#f1f5f9" />
            </mesh>
            {/* Mørk kløft - like bred som gapet mellom gulvflatene (x -3..3),
                ellers blir det synlige sprekker rett ned til bakgrunnen */}
            <mesh position={[0, -0.5, 0]}>
                <boxGeometry args={[6, 0.8, 6]} />
                <meshStandardMaterial color="#cbd5e1" />
            </mesh>
        </group>
    );
}

// Bro (bygges etter seier) - animerer via group.scale i useFrame, ikke i render
function Bridge({ visible }: { visible: boolean }) {
    const groupRef = useRef<THREE.Group>(null!);
    const scaleX = useRef(0);

    useFrame((_, dt) => {
        scaleX.current = damp(scaleX.current, visible ? 1 : 0, dt, 4);
        if (groupRef.current) {
            groupRef.current.scale.x = scaleX.current;
        }
    });

    return (
        <group ref={groupRef} scale={[0, 1, 1]}>
            {/* Plankene må nå helt over gapet (x -3..3) og hvile på begge kantene */}
            {[-0.8, 0, 0.8].map((z, i) => (
                <mesh key={i} position={[0, 0.05, z]}>
                    <boxGeometry args={[6.4, 0.1, 0.7]} />
                    <meshStandardMaterial
                        color="#fbbf24"
                        emissive="#fbbf24"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Flytende planke i lufta
function FloatingPlank({
    position,
    label,
    chosen,
    wrong,
    onSelect,
}: {
    position: [number, number, number];
    label: string;
    chosen: boolean;
    wrong: boolean;
    onSelect: () => void;
}) {
    const ref = useRef<THREE.Group>(null!);
    const shakeRef = useRef(0);

    useFrame((state, dt) => {
        if (!ref.current) return;
        const t = state.clock.elapsedTime;
        ref.current.position.y = damp(
            ref.current.position.y,
            chosen ? -5 : wrong ? -5 : position[1] + Math.sin(t * 1.2) * 0.12,
            dt,
            wrong ? 6 : 2
        );
        if (wrong) {
            shakeRef.current += dt * 20;
            ref.current.rotation.z =
                Math.sin(shakeRef.current) * 0.15 * Math.max(0, 1 - shakeRef.current / 15);
        }
    });

    if (chosen || wrong) return null;

    return (
        <group ref={ref} position={position}>
            <Hotspot
                position={[0, 0, 0]}
                onSelect={onSelect}
                label={label.length > 40 ? label.slice(0, 40) + '…' : label}
            />
            <mesh>
                <boxGeometry args={[3.2, 0.18, 0.6]} />
                <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.2} />
            </mesh>
        </group>
    );
}

function Scene({
    round,
    wonRound,
    selectedPlank,
    wrongPlank,
    onSelect,
    winCount,
}: {
    round: Round;
    wonRound: boolean;
    selectedPlank: number | null;
    wrongPlank: number | null;
    onSelect: (i: number) => void;
    winCount: number;
}) {
    const plankPositions: [number, number, number][] = [
        [-1.5, 3.2, 1.2],
        [0, 3.8, -1.0],
        [1.6, 3.0, 1.8],
    ];

    return (
        <>
            <ambientLight intensity={1.2} />
            <directionalLight position={[6, 8, 4]} intensity={1.0} castShadow />
            <directionalLight position={[-4, 5, -3]} intensity={0.4} />

            <Chasm />
            <BeleggTower glow={wonRound ? 1 : 0.3} />
            <PaastrandTower glow={wonRound ? 1 : 0.3} />
            <Bridge visible={wonRound} />

            {round.planks.map((plank, i) => (
                <FloatingPlank
                    key={`${round.topic}-${i}`}
                    position={plankPositions[i]}
                    label={plank.label}
                    chosen={selectedPlank === i}
                    wrong={wrongPlank === i}
                    onSelect={() => onSelect(i)}
                />
            ))}

            <Burst position={[0, 2, 0]} trigger={winCount} count={28} />
        </>
    );
}

export default function Argumentbroen3D({ onComplete }: MicroGameProps) {
    const { play } = useStepSounds();
    const [roundIndex, setRoundIndex] = useState(0);
    const [selectedPlank, setSelectedPlank] = useState<number | null>(null);
    const [wrongPlank, setWrongPlank] = useState<number | null>(null);
    const [wonRound, setWonRound] = useState(false);
    const [winCount, setWinCount] = useState(0);
    const [banner, setBanner] = useState('');
    const [allDone, setAllDone] = useState(false);

    const round = ROUNDS[roundIndex];

    const handleSelect = (i: number) => {
        if (selectedPlank !== null || wrongPlank !== null) return;
        const plank = round.planks[i];

        if (plank.correct) {
            play('correct');
            setSelectedPlank(i);
            setWonRound(true);
            setWinCount((c) => c + 1);
            setBanner('Riktig forklaring - broen holder!');

            setTimeout(() => {
                if (roundIndex < ROUNDS.length - 1) {
                    setRoundIndex((r) => r + 1);
                    setSelectedPlank(null);
                    setWonRound(false);
                    setBanner('');
                } else {
                    play('complete');
                    setAllDone(true);
                    onComplete?.({ score: 100, completed: true });
                }
            }, 2400);
        } else {
            play('incorrect');
            setWrongPlank(i);
            setBanner('Denne planken bærer ikke argumentet over kløften - prøv igjen.');
            setTimeout(() => {
                setWrongPlank(null);
                setBanner('');
            }, 1600);
        }
    };

    const reset = () => {
        setRoundIndex(0);
        setSelectedPlank(null);
        setWrongPlank(null);
        setWonRound(false);
        setWinCount(0);
        setBanner('');
        setAllDone(false);
    };

    return (
        <MicroGameScaffold
            title="Bygg argumentbroen"
            subtitle="Klikk den planken som forklarer hvorfor belegget støtter påstanden"
            estimatedSeconds={90}
            onRetry={reset}
            scene={
                <Scene
                    round={round}
                    wonRound={wonRound}
                    selectedPlank={selectedPlank}
                    wrongPlank={wrongPlank}
                    onSelect={handleSelect}
                    winCount={winCount}
                />
            }
            canvas={{
                camera: { position: [0, 5, 11], fov: 45 },
                background: '#e8f4fd',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Tema', value: round.topic },
                            {
                                label: 'Påstand',
                                value:
                                    round.claim.length > 55
                                        ? round.claim.slice(0, 55) + '…'
                                        : round.claim,
                            },
                            {
                                label: 'Belegg',
                                value:
                                    round.source.length > 55
                                        ? round.source.slice(0, 55) + '…'
                                        : round.source,
                            },
                            { label: 'Runde', value: `${roundIndex + 1} / ${ROUNDS.length}` },
                        ]}
                    />
                </>
            }
        >
            {allDone ? (
                <WinScreen
                    title="Broen holder! Du forstår hva en forklaring gjør i et argument."
                    onReplay={reset}
                >
                    Uten forklaringen henger påstand og belegg i lufta på hver sin side av
                    tomrommet. Det er forklaringen som bærer argumentet over kløften.
                </WinScreen>
            ) : (
                <p className="px-1 py-1 text-sm leading-relaxed text-slate-600">
                    Klikk planken i lufta som forklarer{' '}
                    <span className="font-semibold text-slate-800">hvorfor</span> belegget støtter
                    påstanden. Den riktige planken blir broen mellom de to tårnene.
                </p>
            )}
        </MicroGameScaffold>
    );
}
