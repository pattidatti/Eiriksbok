import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Swords } from 'lucide-react';
import {
    MicroGameScaffold,
    Hotspot,
    GroundPlane,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    SceneSlider,
    StepTracker,
    DataReadout,
    damp,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: bygg en gresk falanks. Eleven kjenner kjerneideen på kroppen:
// styrken lå ikke i den enkelte soldaten, men i at hver manns skjold vernet
// naboen. Først plasseres hoplittene i rekka (klikk), så justeres tettheten
// (slider), og til slutt slippes fiendens angrep løs. En tett skjoldmur står
// imot. En rekke med luker brytes.

type Phase = 'forming' | 'tune' | 'won';

const N = 5; // antall hoplitter i rekka
const TIGHT_GAP = 0.2; // under dette holder skjoldmuren
const SHIELD_R = 0.52;

const PLACE_FACTS = [
    'Hver hoplitt bærer et tungt rundt skjold (hoplon) på venstre arm. Det dekker hans egen venstre side og naboens høyre.',
    'I høyre hånd har han et langt spyd. Forreste rekke stikker spydene fram mellom skjoldene.',
    'Tung bronsehjelm og brystplate. En hoplitt måtte selv ha råd til utstyret, så det var ofte bønder med litt jord.',
    'Mann ved mann lener skjoldene mot hverandre. Ingen åpning slipper fienden inn.',
    'Rekka er full. Nå er det en levende mur av bronse og spyd, ikke fem enkeltmenn.',
];

// Ved gap <= TIGHT_GAP (tett skjoldmur) skal skjoldene (diameter 1.04) faktisk
// overlappe hverandre visuelt, derfor er senteravstanden <= 1.03 ved terskelen.
const spacing = (gap: number) => 0.72 + gap * 1.55;
const hopliteX = (i: number, gap: number) => (i - (N - 1) / 2) * spacing(gap);

const Falanksen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('forming');
    const [placed, setPlaced] = useState(0);
    const [gap, setGap] = useState(0.55);
    const [banner, setBanner] = useState<string | null>(
        'Klikk de pulserende ringene for å stille hoplittene opp i rekka.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [attack, setAttack] = useState(0); // teller: hvert angrep starter en ny "bølge"
    const [outcome, setOutcome] = useState<'idle' | 'repelled' | 'broke'>('idle');
    const [burst, setBurst] = useState(0);

    const reset = () => {
        setPhase('forming');
        setPlaced(0);
        setGap(0.55);
        setBanner('Klikk de pulserende ringene for å stille hoplittene opp i rekka.');
        setFact(null);
        setAttack(0);
        setOutcome('idle');
    };

    const placeOne = () => {
        const next = placed + 1;
        setPlaced(next);
        setFact(PLACE_FACTS[Math.min(next - 1, PLACE_FACTS.length - 1)]);
        if (next >= N) {
            sounds.play('advance');
            setPhase('tune');
            setBanner('Rekka står. Hold mennene tett sammen og slipp angrepet løs.');
        } else {
            sounds.play('correct');
        }
    };

    const tight = gap <= TIGHT_GAP;

    const launchAttack = () => {
        if (tight) {
            setOutcome('repelled');
            setAttack((a) => a + 1);
            sounds.play('complete');
            setBanner(null);
            setTimeout(() => {
                setBurst((b) => b + 1);
                setPhase('won');
                onComplete({ score: 1, completed: true, artifact: { gap } });
            }, 1100);
        } else {
            setOutcome('broke');
            setAttack((a) => a + 1);
            sounds.play('incorrect');
            setBanner('Fienden fant en luke i rekka! Skyv mennene tettere sammen og prøv igjen.');
            setTimeout(() => setOutcome('idle'), 1600);
        }
    };

    return (
        <MicroGameScaffold
            title="Bygg falanksen"
            subtitle="Still opp hoplittene, hold skjoldmuren tett, og stå imot angrepet"
            estimatedSeconds={140}
            onRetry={placed > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 6.5, 13], fov: 42 },
                background: '#cfe3ef',
                target: [0, 1, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'won' ? 'Skjoldmuren holdt' : 'Hellas, ca. 450 fvt'}
                    </SceneBadge>
                    {phase === 'tune' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Skjoldmur', value: tight ? 'Tett' : 'Luker' },
                                { label: 'Hoplitter', value: N },
                            ]}
                        />
                    )}
                </>
            }
            scene={
                <PhalanxField
                    placed={placed}
                    gap={gap}
                    attack={attack}
                    outcome={outcome}
                    burst={burst}
                    onPlace={placeOne}
                />
            }
        >
            {phase === 'forming' && (
                <div className="flex flex-col gap-2.5">
                    <StepTracker current={placed} total={N} />
                    <p className="text-sm text-slate-600">
                        Klikk den pulserende ringen for å sette neste hoplitt på plass i rekka.
                    </p>
                    {fact && <SceneFact>{fact}</SceneFact>}
                </div>
            )}

            {phase === 'tune' && (
                <div className="flex flex-col gap-3">
                    <SceneSlider
                        label="Avstand i rekka: tett ↔ spredt"
                        min={0}
                        max={1}
                        step={0.01}
                        value={gap}
                        onChange={setGap}
                        valueLabel={() => (tight ? 'Tett skjoldmur' : 'Luker i rekka')}
                    />
                    <div className="rounded-xl border border-amber-200 bg-white p-3 sm:flex sm:items-center sm:gap-4">
                        <p className="text-xs text-slate-600 leading-relaxed min-w-0 flex-1">
                            {tight
                                ? 'Skjoldene ligger over hverandre. Hver manns skjold verner naboen. Slipp angrepet løs.'
                                : 'Det er luker mellom mennene. Skyv dem tettere sammen før du slipper angrepet løs.'}
                        </p>
                        <button
                            onClick={launchAttack}
                            className="mt-2.5 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition flex-shrink-0"
                        >
                            <Swords className="w-4 h-4" />
                            Slipp angrepet løs
                        </button>
                    </div>
                </div>
            )}

            {phase === 'won' && (
                <WinScreen title="Skjoldmuren holdt!" onReplay={reset}>
                    Da skjoldene lå tett over hverandre, ble fem menn til én mur av bronse og spyd.
                    Det var hele hemmeligheten bak falanksen: styrken lå ikke i den enkelte
                    soldaten, men i at hver manns skjold vernet naboen. Derfor var den greske
                    hoplitthæren så fryktet.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function PhalanxField({
    placed,
    gap,
    attack,
    outcome,
    burst,
    onPlace,
}: {
    placed: number;
    gap: number;
    attack: number;
    outcome: 'idle' | 'repelled' | 'broke';
    burst: number;
    onPlace: () => void;
}) {
    return (
        <group>
            <GroundPlane size={40} depth={32} color="#c2a86a" />

            {/* Plasserte hoplitter */}
            {Array.from({ length: placed }, (_, i) => (
                <Hoplite key={i} index={i} gap={gap} />
            ))}

            {/* Hotspot over neste tomme plass */}
            {placed < N && (
                <Hotspot
                    position={[hopliteX(placed, gap), 1.7, 0]}
                    onSelect={onPlace}
                    label="Sett hoplitt på plass"
                    radius={0.5}
                />
            )}

            {/* Fiendens angrep */}
            <Attackers attack={attack} outcome={outcome} />

            {/* Feiringspartikler ved seier */}
            <Burst position={[0, 2.2, 0]} trigger={burst} color="#f4e7c5" count={30} spread={4} />
        </group>
    );
}

// Én hoplitt: kropp, hjelm, rundt bronseskjold (mot fienden, +Z) og spyd.
function Hoplite({ index, gap }: { index: number; gap: number }) {
    const grp = useRef<THREE.Group>(null);
    const appear = useRef(0);
    useFrame((_, dt) => {
        if (!grp.current) return;
        const targetX = hopliteX(index, gap);
        grp.current.position.x = damp(grp.current.position.x, targetX, dt, 5);
        appear.current = damp(appear.current, 1, dt, 6);
        const s = 0.6 + appear.current * 0.4;
        grp.current.scale.setScalar(s);
    });
    return (
        <group ref={grp} position={[hopliteX(index, gap), 0, 0]} scale={0.6}>
            {/* kropp */}
            <mesh position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.26, 0.95, 8]} />
                <meshStandardMaterial color="#9a3b2e" roughness={0.85} />
            </mesh>
            {/* hode */}
            <mesh position={[0, 1.18, 0]} castShadow>
                <sphereGeometry args={[0.17, 12, 12]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.8} />
            </mesh>
            {/* hjelm med kam */}
            <mesh position={[0, 1.26, 0]} castShadow>
                <sphereGeometry args={[0.2, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
                <meshStandardMaterial color="#b98b34" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.42, -0.02]} castShadow>
                <boxGeometry args={[0.06, 0.16, 0.34]} />
                <meshStandardMaterial color="#8a2f24" roughness={0.7} />
            </mesh>
            {/* rundt bronseskjold mot fienden (+Z) - sylinder roteres så skiva står oppreist */}
            <mesh position={[0, 0.62, SHIELD_R - 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[SHIELD_R, SHIELD_R, 0.1, 24]} />
                <meshStandardMaterial color="#c98f2e" metalness={0.55} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.62, SHIELD_R + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.14, 0.14, 0.12, 16]} />
                <meshStandardMaterial color="#8a5a1f" metalness={0.5} roughness={0.4} />
            </mesh>
            {/* spyd */}
            <mesh position={[0.28, 1.0, 0.1]} rotation={[0.18, 0, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 2.4, 6]} />
                <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
            </mesh>
            <mesh position={[0.28, 2.18, 0.32]} rotation={[0.18, 0, 0]} castShadow>
                <coneGeometry args={[0.07, 0.32, 8]} />
                <meshStandardMaterial color="#b0b4ba" metalness={0.6} roughness={0.3} />
            </mesh>
        </group>
    );
}

// Fiendens rekke: tre figurer som stormer fram fra +Z. Ved 'repelled' stopper
// de ved muren og kastes tilbake. Ved 'broke' løper én rett gjennom rekka.
function Attackers({
    attack,
    outcome,
}: {
    attack: number;
    outcome: 'idle' | 'repelled' | 'broke';
}) {
    const grp = useRef<THREE.Group>(null);
    const charged = useRef(0); // 0 = bak, 1 = framme ved muren
    const lastAttack = useRef(0);

    useFrame((_, dt) => {
        if (!grp.current) return;
        // Ny angrepsbølge: nullstill posisjonen.
        if (attack !== lastAttack.current) {
            lastAttack.current = attack;
            charged.current = 0;
        }
        let target = 0;
        if (outcome === 'repelled') target = 0.55; // stoppes ved muren
        else if (outcome === 'broke') target = 1.25; // bryter gjennom
        charged.current = damp(charged.current, attack > 0 ? target : 0, dt, 2.4);

        const startZ = 8;
        const z = startZ - charged.current * (8 + 3.5);
        grp.current.position.z = z;
        // Rekyl-rist ved repelled idet de treffer muren.
        if (outcome === 'repelled' && charged.current > 0.4) {
            grp.current.position.z += Math.sin(performance.now() / 60) * 0.12;
        }
    });

    return (
        <group ref={grp} position={[0, 0, 8]}>
            {[-1.1, 0, 1.1].map((x) => (
                <group key={x} position={[x, 0, 0]}>
                    <mesh position={[0, 0.5, 0]} castShadow>
                        <cylinderGeometry args={[0.18, 0.24, 0.85, 8]} />
                        <meshStandardMaterial color="#3a4a63" roughness={0.85} />
                    </mesh>
                    <mesh position={[0, 1.05, 0]} castShadow>
                        <sphereGeometry args={[0.16, 12, 12]} />
                        <meshStandardMaterial color="#cda884" roughness={0.8} />
                    </mesh>
                    {/* skjold mot grekerne (-Z) - sylinder roteres så skiva står oppreist */}
                    <mesh position={[0, 0.55, -0.42]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.42, 0.42, 0.09, 18]} />
                        <meshStandardMaterial color="#5a6577" metalness={0.4} roughness={0.5} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

export default Falanksen3D;
