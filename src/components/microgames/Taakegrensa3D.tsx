import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    Rock,
    Particles,
    GlowMaterial,
    GlowHalo,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    LoseScreen,
    Burst,
    Impact,
    useShake,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Lyspære: agnostisme handler ikke om hva som er sant, men om hvor grensa for
// hva vi kan undersøke går. Eleven drar spørsmål ut på målerplatået eller ut i
// tåka, og kjenner at noen spørsmål lar seg avgjøre med målinger mens andre
// aldri gjør det - uten at de siste blir mindre viktige.

const PLATEAU_X = -4.6;
const FOG_X = 4.6;
const PLATEAU_TOP = 0.5;
const FOG_PAD_TOP = 0.24;
const LANTERNS = 3;

interface Question {
    q: string;
    // 0 = platået (kan undersøkes), 1 = tåka (utenfor rekkevidde)
    zone: 0 | 1;
    why: string;
}

const QUESTIONS: Question[] = [
    {
        q: 'Hvor langt er det fra jorda til månen?',
        zone: 0,
        why: 'Avstanden måles med laserlys. Alle som måler riktig, får samme svar.',
    },
    {
        q: 'Finnes det en gud?',
        zone: 1,
        why: 'Ingen måling kan avgjøre dette. Det er nettopp her agnostikere setter grensa.',
    },
    {
        q: 'Hvor mange mennesker bor i Norge?',
        zone: 0,
        why: 'Vi kan telle. Svaret kan sjekkes av hvem som helst.',
    },
    {
        q: 'Er det galt å lyve?',
        zone: 1,
        why: 'Ingen vekt kan veie rett og galt. Spørsmålet er likevel et av de viktigste vi har.',
    },
    {
        q: 'Hvor gammel er denne steinen?',
        zone: 0,
        why: 'Forskere måler hvor mye av stoffene i steinen som har brutt seg ned, og regner ut alderen.',
    },
    {
        q: 'Hva skjer med oss etter døden?',
        zone: 1,
        why: 'Ingen kan reise dit og komme tilbake med målinger. Religioner og livssyn svarer ulikt.',
    },
];

const MARKER_SPOTS: [number, number][] = [
    [-1.6, -1.9],
    [0, -1.9],
    [1.6, -1.9],
];

function Telescope() {
    return (
        <group position={[PLATEAU_X, PLATEAU_TOP, 1.2]}>
            {/* Symmetrisk trebein: tre like bein spredt rundt senter */}
            {[0, 1, 2].map((i) => (
                <group key={i} rotation={[0, (i / 3) * Math.PI * 2, 0]}>
                    <mesh position={[0.32, 0.46, 0]} rotation={[0, 0, -0.34]} castShadow>
                        <cylinderGeometry args={[0.055, 0.055, 1.0, 8]} />
                        <meshStandardMaterial color="#9a8a6e" roughness={0.9} />
                    </mesh>
                </group>
            ))}
            {/* Dreieledd */}
            <mesh position={[0, 0.98, 0]} castShadow>
                <sphereGeometry args={[0.2, 14, 12]} />
                <meshStandardMaterial color="#5c6b80" metalness={0.3} roughness={0.5} />
            </mesh>
            {/* Kikkertrør, tiltet mot himmelen */}
            <mesh position={[0, 1.42, -0.28]} rotation={[-0.72, 0, 0]} castShadow>
                <cylinderGeometry args={[0.17, 0.22, 1.6, 14]} />
                <meshStandardMaterial color="#b08d57" metalness={0.4} roughness={0.4} />
            </mesh>
        </group>
    );
}

// Selve grensa: en lav, flat stripe i bakken. Holdes lav med vilje, ellers
// kollapser den til en stang når kameraet ser langs den.
function BorderLine() {
    return (
        <group>
            <mesh position={[0, 0.03, 0]}>
                <boxGeometry args={[0.5, 0.06, 8.2]} />
                <meshStandardMaterial
                    color="#f59e0b"
                    emissive="#f59e0b"
                    emissiveIntensity={0.3}
                    roughness={0.6}
                />
            </mesh>
        </group>
    );
}

function Lantern({ position, lit }: { position: [number, number, number]; lit: boolean }) {
    const glow = useRef<THREE.Mesh>(null);
    useFrame((state, dt) => {
        if (!glow.current) return;
        const m = glow.current.material as THREE.MeshStandardMaterial;
        const flicker = lit ? 1.5 + Math.sin(state.clock.elapsedTime * 4 + position[0]) * 0.25 : 0;
        m.emissiveIntensity = damp(m.emissiveIntensity, flicker, dt, 6);
    });
    return (
        <group position={position}>
            <mesh position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.09, 1.1, 8]} />
                <meshStandardMaterial color="#6b7280" roughness={0.7} />
            </mesh>
            <mesh ref={glow} position={[0, 1.24, 0]} castShadow>
                <sphereGeometry args={[0.24, 16, 14]} />
                <meshStandardMaterial
                    color={lit ? '#ffdc8a' : '#98a2b3'}
                    emissive={lit ? '#ffbf3c' : '#000000'}
                    emissiveIntensity={lit ? 1.5 : 0}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}

function FogBank({ advance }: { advance: number }) {
    const group = useRef<THREE.Group>(null);
    useFrame((state, dt) => {
        if (!group.current) return;
        // Tåka ruller innover for hvert feilplasserte spørsmål.
        const target = FOG_X - advance * 2.6;
        group.current.position.x = damp(group.current.position.x, target, dt, 1.6);
        group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.09;
    });
    const blobs: [number, number, number, number][] = [
        [-1.4, 1.6, 2.2, 1.8],
        [0.6, 2.0, 0.2, 2.3],
        [2.6, 1.6, 1.8, 1.9],
        [1.4, 2.3, -2.2, 2.0],
        [-0.8, 1.4, -2.9, 1.6],
        [3.2, 1.9, -1.0, 1.7],
    ];
    return (
        <group ref={group} position={[FOG_X, 0, 0]} userData={{ sceneAuditIgnore: true }}>
            {blobs.map(([x, y, z, r], i) => (
                <mesh key={i} position={[x, y, z]}>
                    <sphereGeometry args={[r, 14, 12]} />
                    <meshStandardMaterial
                        color="#eef3fa"
                        transparent
                        opacity={0.6}
                        depthWrite={false}
                        roughness={1}
                    />
                </mesh>
            ))}
        </group>
    );
}

function QuestionOrb({ danger }: { danger: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!ref.current) return;
        ref.current.rotation.y = state.clock.elapsedTime * 0.6;
    });
    return (
        <group>
            {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
            <mesh>
                <boxGeometry args={[1.9, 1.9, 1.9]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            <group ref={ref}>
                <mesh castShadow>
                    <icosahedronGeometry args={[0.42, 1]} />
                    <GlowMaterial color={danger ? '#f59e0b' : '#6366f1'} intensity={1.1} />
                </mesh>
            </group>
            <GlowHalo color={danger ? '#fbbf24' : '#818cf8'} size={0.85} opacity={0.34} />
        </group>
    );
}

function Scene({
    index,
    dropCount,
    placedOnPlateau,
    placedInFog,
    lanterns,
    onSnap,
    onDrop,
    burst,
    dust,
    dustAt,
}: {
    index: number;
    dropCount: number;
    placedOnPlateau: number;
    placedInFog: number;
    lanterns: number;
    onSnap: (zone: number) => void;
    onDrop: () => void;
    burst: number;
    dust: number;
    dustAt: [number, number, number];
}) {
    const { ref: shakeRef, shake } = useShake(0.22, 0.05);
    const advance = LANTERNS - lanterns;

    // Hvert bom rister scenen én gang.
    const lastDust = useRef(0);
    useEffect(() => {
        if (dust > lastDust.current) {
            lastDust.current = dust;
            shake(0.7);
        }
    }, [dust, shake]);

    return (
        <group ref={shakeRef}>
            <GroundPlane color="#aab7c8" size={40} depth={30} />

            {/* Målerplatået: her kan spørsmål avgjøres */}
            <mesh position={[PLATEAU_X, PLATEAU_TOP / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[6.4, PLATEAU_TOP, 6.6]} />
                <meshStandardMaterial color="#d8d2c4" roughness={0.85} />
            </mesh>
            <Telescope />
            {/* En stein til å datere, og en til å sitte på */}
            <Rock position={[PLATEAU_X + 1.9, PLATEAU_TOP + 0.28, 1.9]} color="#94a0ad" scale={0.9} />
            <Rock position={[PLATEAU_X + 2.5, PLATEAU_TOP + 0.16, 2.6]} color="#a6b0bb" scale={0.5} />
            {[-2.3, 0, 2.3].map((z, i) => (
                <Lantern
                    key={i}
                    position={[PLATEAU_X - 2.5, PLATEAU_TOP, z]}
                    lit={i < lanterns}
                />
            ))}

            {/* Tåkeplatået: her stanser målingene */}
            <mesh position={[FOG_X, FOG_PAD_TOP / 2, 0]} receiveShadow>
                <boxGeometry args={[6.4, FOG_PAD_TOP, 6.6]} />
                <meshStandardMaterial color="#c3cddd" roughness={1} />
            </mesh>
            <FogBank advance={advance} />
            <Particles
                preset="motes"
                count={40}
                center={[FOG_X, 2.2, 0]}
                area={[7.4, 7.4]}
                height={4.4}
            />

            <BorderLine />

            {/* Sorterte spørsmål ligger igjen som kuler i hver sone */}
            {MARKER_SPOTS.slice(0, placedOnPlateau).map(([x, z], i) => (
                <mesh key={`p${i}`} position={[PLATEAU_X + x, PLATEAU_TOP + 0.22, z]} castShadow>
                    <sphereGeometry args={[0.22, 14, 12]} />
                    <meshStandardMaterial color="#34d399" roughness={0.4} />
                </mesh>
            ))}
            {MARKER_SPOTS.slice(0, placedInFog).map(([x, z], i) => (
                <mesh key={`f${i}`} position={[FOG_X + x, FOG_PAD_TOP + 0.22, z]} castShadow>
                    <sphereGeometry args={[0.22, 14, 12]} />
                    <meshStandardMaterial color="#a5b4fc" roughness={0.4} />
                </mesh>
            ))}

            {/* Sokkelen spørsmålet hviler på */}
            <mesh position={[0, 0.45, 4.6]} castShadow receiveShadow>
                <cylinderGeometry args={[0.6, 0.75, 0.9, 16]} />
                <meshStandardMaterial color="#8d99ab" roughness={0.8} />
            </mesh>

            {index < QUESTIONS.length && (
                <Draggable
                    key={`${index}-${dropCount}`}
                    position={[0, 1.32, 4.6]}
                    planeY={1.32}
                    snapPoints={[
                        [PLATEAU_X, 0],
                        [FOG_X, 0],
                    ]}
                    snapRadius={3.4}
                    bounds={{ minX: -8.5, maxX: 8.5, minZ: -4.5, maxZ: 5.5 }}
                    onSnap={onSnap}
                    onDrop={onDrop}
                >
                    <QuestionOrb danger={lanterns === 1} />
                </Draggable>
            )}

            <Burst position={[PLATEAU_X, 2.2, 0]} trigger={burst} color="#34d399" />
            <Impact preset="dustPuff" trigger={dust} position={dustAt} />
        </group>
    );
}

export default function Taakegrensa3D({ onComplete, onRetry }: MicroGameProps) {
    const [index, setIndex] = useState(0);
    const [dropCount, setDropCount] = useState(0);
    const [onPlateau, setOnPlateau] = useState(0);
    const [inFog, setInFog] = useState(0);
    const [lanterns, setLanterns] = useState(LANTERNS);
    const [burst, setBurst] = useState(0);
    const [dust, setDust] = useState(0);
    const [dustAt, setDustAt] = useState<[number, number, number]>([0, 0.4, 0]);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing');
    const sounds = useStepSounds();
    const doneRef = useRef(false);

    const current = QUESTIONS[index];

    const handleSnap = (zone: number) => {
        if (phase !== 'playing' || !current) return;
        const targetX = zone === 0 ? PLATEAU_X : FOG_X;

        if (zone === current.zone) {
            if (zone === 0) setOnPlateau((n) => n + 1);
            else setInFog((n) => n + 1);
            setBurst((b) => b + 1);
            setFeedback(current.why);
            sounds.play('correct');
            const next = index + 1;
            setIndex(next);
            if (next >= QUESTIONS.length && !doneRef.current) {
                doneRef.current = true;
                setPhase('won');
                sounds.play('complete');
                onComplete({ score: lanterns / LANTERNS, completed: true });
            }
            return;
        }

        // Feil sone: en lykt slukner og tåka ruller nærmere platået.
        const left = lanterns - 1;
        setLanterns(left);
        setDustAt([targetX, zone === 0 ? PLATEAU_TOP : FOG_PAD_TOP, 0]);
        setDust((d) => d + 1);
        sounds.play('incorrect');
        setFeedback(
            current.zone === 0
                ? 'Dette spørsmålet kan faktisk måles. Prøv platået.'
                : 'Ingen måling kan avgjøre dette. Prøv tåka.'
        );
        if (left <= 0) {
            setPhase('lost');
        }
    };

    const reset = () => {
        setIndex(0);
        setDropCount(0);
        setOnPlateau(0);
        setInFog(0);
        setLanterns(LANTERNS);
        setFeedback(null);
        setPhase('playing');
        doneRef.current = false;
        onRetry?.();
    };

    const banner =
        phase === 'won'
            ? 'Alle seks er sortert. Grensa mellom det målbare og det umålelige står klar.'
            : phase === 'lost'
              ? 'Tåka la seg over hele platået.'
              : `Spørsmål ${index + 1} av ${QUESTIONS.length}: ${current?.q ?? ''}`;

    return (
        <MicroGameScaffold
            title="Tåkegrensa"
            subtitle="Dra hvert spørsmål dit det hører hjemme: ut på målerplatået, eller ut i tåka."
            estimatedSeconds={140}
            onRetry={reset}
            scene={
                <Scene
                    index={phase === 'playing' ? index : QUESTIONS.length}
                    dropCount={dropCount}
                    placedOnPlateau={onPlateau}
                    placedInFog={inFog}
                    lanterns={lanterns}
                    onSnap={handleSnap}
                    onDrop={() => setDropCount((c) => c + 1)}
                    burst={burst}
                    dust={dust}
                    dustAt={dustAt}
                />
            }
            canvas={{
                camera: { position: [4.2, 11.8, 17.2], fov: 43 },
                background: '#dce6f2',
                target: [0, 0.6, -0.4],
                light: 'overcast',
                fog: { color: '#dce6f2', near: 26, far: 52 },
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Sortert', value: `${onPlateau + inFog}/${QUESTIONS.length}` },
                            { label: 'Lykter', value: lanterns },
                        ]}
                    />
                    <SceneBadge corner="br">Venstre: målbart · Høyre: utenfor rekkevidde</SceneBadge>
                </>
            }
        >
            {phase === 'won' ? (
                <WinScreen title="Du fant grensa!" onReplay={reset}>
                    Legg merke til hva som havnet i tåka: gud, rett og galt, og hva som skjer etter
                    døden. De er ikke uviktige. De er bare spørsmål som ingen måling kan avgjøre.
                    Det er dette agnostikere mener når de sier at vi ikke kan vite.
                </WinScreen>
            ) : phase === 'lost' ? (
                <LoseScreen title="Tåka tok platået" onRetry={reset}>
                    Når vi slutter å skille mellom det vi kan undersøke og det vi ikke kan, blir alt
                    like uklart. Prøv igjen, og spør deg selv for hvert spørsmål: finnes det en
                    måling som kunne avgjort dette?
                </LoseScreen>
            ) : (
                <p className="text-sm text-slate-600 leading-relaxed">
                    {feedback ??
                        'Noen spørsmål kan vi svare på med målinger. Andre kan ingen måle seg fram til. Dra kula til venstre side hvis spørsmålet kan undersøkes, og til høyre side hvis det ligger utenfor rekkevidde. Tre bom, og tåka tar platået.'}
                </p>
            )}
        </MicroGameScaffold>
    );
}
