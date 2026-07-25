import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Hotspot,
    GroundPlane,
    Tower,
    Wall,
    Banner,
    Rock,
    Tree,
    Torch,
    Particles,
    GlowMaterial,
    GlowHalo,
    Burst,
    damp,
    ScreenFlash,
    MeterBar,
    WinScreen,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: eleven GÅR bort fra år 500 og ser Camelot vokse i takt med
// avstanden. Hver kilde eleven passerer legger nye detaljer til legenden, mens
// telleren "Bevis fra år 500" blir stående på null hele veien.
// Lyspæra: jo lenger unna hendelsen en kilde er skrevet, jo mer "vet" den.

const START_Z = 20;
const END_Z = -40;
const SPAN = START_Z - END_Z;
const WALK_SPEED = 3.6;
const CASTLE_Z = -84;
const CROSS_Z = -28;
const CROSS_X = 2.7;

interface Kilde {
    z: number;
    yearLabel: string;
    name: string;
    adds: number;
    banner: string;
}

const KILDER: Kilde[] = [
    {
        z: 8,
        yearLabel: 'ca. 540',
        name: 'Gildas',
        adds: 0,
        banner: 'Gildas skriver om slaget ved Badon rundt år 500. Arthur er ikke nevnt med ett ord.',
    },
    {
        z: 1,
        yearLabel: 'ca. 830',
        name: 'Historia Brittonum',
        adds: 3,
        banner: 'Her dukker navnet Arthur opp for aller første gang: en hærfører med tolv seire.',
    },
    {
        z: -6,
        yearLabel: 'ca. 970',
        name: 'Annales Cambriae',
        adds: 3,
        banner: 'Årboka setter årstall på ham: Badon i 516 og Camlann i 537.',
    },
    {
        z: -12,
        yearLabel: 'ca. 1135',
        name: 'Geoffrey of Monmouth',
        adds: 4,
        banner: 'Geoffrey gjør Arthur til en mektig konge, og slipper trollmannen Merlin inn.',
    },
    {
        z: -22,
        yearLabel: 'ca. 1180',
        name: 'Chrétien de Troyes',
        adds: 3,
        banner: 'De franske dikterne gir Arthur høviske riddere og den hellige gral.',
    },
    {
        z: -34,
        yearLabel: '1485',
        name: 'Thomas Malory',
        adds: 2,
        banner: 'Malory samler alt til den Arthur vi kjenner fra filmer og spill i dag.',
    },
];

type GameState = 'idle' | 'playing' | 'won';

// Deterministisk pseudo-tilfeldighet for trær langs veien (ingen Math.random).
function rnd(i: number) {
    const s = Math.sin(i * 127.1) * 43758.5453;
    return s - Math.floor(s);
}

// Mykt voksende gruppe. `visible` styres av en terskel, for scale 0 skjuler
// ikke en boks - den blir tegnet som et flatt kort.
function Grow({
    show,
    position,
    children,
    speed = 2.6,
}: {
    show: boolean;
    position?: [number, number, number];
    children: React.ReactNode;
    speed?: number;
}) {
    const group = useRef<THREE.Group>(null);

    useFrame((_, dt) => {
        const g = group.current;
        if (!g) return;
        const s = damp(g.scale.x, show ? 1 : 0.001, dt, speed);
        g.scale.setScalar(s);
        const vis = s > 0.04;
        if (vis !== g.visible) g.visible = vis;
    });

    return (
        <group ref={group} position={position} scale={0.001} visible={false}>
            {children}
        </group>
    );
}

// Camelot vokser lag for lag: en liten trefort ved år 500, en full borg av
// legende når alle seks kildene er passert.
function Camelot({ stage }: { stage: number }) {
    return (
        <group position={[0, 0, CASTLE_Z]}>
            <mesh position={[0, 2, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[15, 21, 4, 28]} />
                <meshStandardMaterial color="#7f8b62" roughness={1} flatShading />
            </mesh>

            {/* Trefortet som faktisk kan ha stått i 500-tallets Britannia */}
            <group position={[0, 4, 0]}>
                <mesh position={[0, 1.1, 0]} castShadow>
                    <boxGeometry args={[5, 2.2, 5]} />
                    <meshStandardMaterial color="#8a6a45" />
                </mesh>
                <mesh position={[0, 3, 0]}>
                    <coneGeometry args={[4.2, 1.8, 4]} />
                    <meshStandardMaterial color="#6b4f33" />
                </mesh>
            </group>

            {/* Hvert lag følger en ny kilde */}
            <Grow show={stage >= 2} position={[0, 4, 0]}>
                <Tower position={[0, 0, 0]} radius={3.6} height={11} color="#c9c3b4" roof="#7c6a8f" />
            </Grow>

            <Grow show={stage >= 3} position={[0, 4, 0]}>
                <Wall position={[0, 0, 9]} length={18} height={4} color="#cfcabb" />
                <Wall
                    position={[9, 0, 0]}
                    rotation={[0, Math.PI / 2, 0]}
                    length={18}
                    height={4}
                    color="#cfcabb"
                />
                <Wall
                    position={[-9, 0, 0]}
                    rotation={[0, Math.PI / 2, 0]}
                    length={18}
                    height={4}
                    color="#cfcabb"
                />
            </Grow>

            <Grow show={stage >= 4} position={[0, 4, 0]}>
                <Tower position={[8, 0, 8]} radius={2.1} height={14} color="#d6d0c1" roof="#6d5b86" />
                <Tower
                    position={[-8, 0, 8]}
                    radius={2.1}
                    height={14}
                    color="#d6d0c1"
                    roof="#6d5b86"
                />
            </Grow>

            <Grow show={stage >= 5} position={[0, 4, 0]}>
                <Tower position={[0, 0, -7]} radius={2.6} height={20} color="#e4dece" roof="#5d4b78" />
                <Banner position={[6, 0, 9.4]} color="#b3324a" height={5} />
                <Banner position={[-6, 0, 9.4]} color="#b3324a" height={5} />
            </Grow>

            <Grow show={stage >= 6} position={[0, 4, 0]}>
                <Tower position={[8, 0, -6]} radius={1.8} height={16} color="#e8e2d3" roof="#5d4b78" />
                <Tower
                    position={[-8, 0, -6]}
                    radius={1.8}
                    height={16}
                    color="#e8e2d3"
                    roof="#5d4b78"
                />
                <Torch position={[3, 0, 9.6]} height={2.4} lit />
                <Torch position={[-3, 0, 9.6]} height={2.4} lit />
            </Grow>
        </group>
    );
}

// Kildestein langs veien. Lyser gyllent når eleven har gått forbi den.
function Kildestein({ kilde, index, passed }: { kilde: Kilde; index: number; passed: boolean }) {
    const x = index % 2 === 0 ? -3.9 : 3.9;
    return (
        <group position={[x, 0, kilde.z]}>
            <mesh position={[0, 1.05, 0]} castShadow>
                <boxGeometry args={[0.5, 2.1, 1.5]} />
                <meshStandardMaterial color={passed ? '#c9b06a' : '#9aa0a6'} roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.25, 0]}>
                <sphereGeometry args={[0.42, 14, 12]} />
                {passed ? (
                    <GlowMaterial color="#ffcc66" intensity={1.4} />
                ) : (
                    <meshStandardMaterial color="#8b9096" />
                )}
            </mesh>
            {passed && <GlowHalo color="#ffdb8a" size={1.1} opacity={0.28} />}
            <Rock position={[x > 0 ? 1.2 : -1.2, 0, 0.8]} color="#8d9384" scale={0.5} />
        </group>
    );
}

interface SceneProps {
    playing: boolean;
    stage: number;
    burst: number;
    crossLive: boolean;
    camPosRef: React.MutableRefObject<[number, number, number]>;
    movingRef: React.MutableRefObject<boolean>;
    onPass: (index: number) => void;
    onProgress: (p: number) => void;
    onArrive: () => void;
    onHold: (holding: boolean) => void;
    onCross: () => void;
}

// Per-frame-motoren: flytter kameraet, teller passerte kilder og rapporterer
// framdrift i grove hakk (aldri setState hver frame).
function Walker({
    playing,
    camPosRef,
    movingRef,
    onPass,
    onProgress,
    onArrive,
}: Pick<SceneProps, 'playing' | 'camPosRef' | 'movingRef' | 'onPass' | 'onProgress' | 'onArrive'>) {
    const passedRef = useRef(0);
    const arrivedRef = useRef(false);
    const bucketRef = useRef(-1);

    useFrame((_, dt) => {
        if (!playing) return;
        if (movingRef.current) {
            camPosRef.current[2] = Math.max(END_Z, camPosRef.current[2] - WALK_SPEED * dt);
        }
        const z = camPosRef.current[2];

        while (passedRef.current < KILDER.length && z <= KILDER[passedRef.current].z) {
            const i = passedRef.current;
            passedRef.current = i + 1;
            onPass(i);
        }

        const p = Math.min(1, Math.max(0, (START_Z - z) / SPAN));
        const bucket = Math.round(p * 25);
        if (bucket !== bucketRef.current) {
            bucketRef.current = bucket;
            onProgress(p);
        }

        if (z <= END_Z + 0.02 && !arrivedRef.current) {
            arrivedRef.current = true;
            movingRef.current = false;
            onArrive();
        }
    });

    return null;
}

function RoadScene({
    playing,
    stage,
    burst,
    crossLive,
    camPosRef,
    movingRef,
    onPass,
    onProgress,
    onArrive,
    onHold,
    onCross,
}: SceneProps) {
    return (
        <group>
            <GroundPlane size={90} depth={190} color="#8b9a68" position={[0, 0, -22]} />

            {/* Veien: en flat steinsti langs tidsaksen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -4]} receiveShadow>
                <planeGeometry args={[6.2, 122]} />
                <meshStandardMaterial color="#b6ab92" roughness={1} />
            </mesh>

            {/* Trær langs veien - deterministisk spredning */}
            {Array.from({ length: 24 }, (_, i) => {
                const side = i % 2 === 0 ? -1 : 1;
                const x = side * (7 + rnd(i) * 9);
                const z = 22 - i * 3.1 - rnd(i + 40) * 1.6;
                return (
                    <Tree key={`t${i}`} position={[x, 0, z]} leaf="#4a6b46" seed={i * 7 + 3} />
                );
            })}

            {KILDER.map((k, i) => (
                <Kildestein key={k.name} kilde={k} index={i} passed={stage > i} />
            ))}

            <Camelot stage={stage} />

            {/* Legendedetaljer langs innkjørselen til borgen */}
            <Grow show={stage >= 4} position={[-3.4, 0, -52]}>
                <mesh position={[0, 0.5, 0]} castShadow>
                    <boxGeometry args={[1.9, 1, 1.9]} />
                    <meshStandardMaterial color="#9aa0a6" roughness={0.95} />
                </mesh>
                <mesh position={[0, 1.9, 0]}>
                    <boxGeometry args={[0.14, 1.9, 0.36]} />
                    <GlowMaterial color="#dfe7ef" intensity={0.7} />
                </mesh>
                <mesh position={[0, 1.1, 0]}>
                    <boxGeometry args={[0.14, 0.16, 1]} />
                    <meshStandardMaterial color="#c9a227" />
                </mesh>
            </Grow>

            <Grow show={stage >= 5} position={[3.6, 0, -57]}>
                <mesh position={[0, 0.6, 0]} castShadow>
                    <cylinderGeometry args={[0.6, 0.8, 1.2, 12]} />
                    <meshStandardMaterial color="#b6ab92" />
                </mesh>
                <mesh position={[0, 1.6, 0]}>
                    <cylinderGeometry args={[0.5, 0.22, 0.8, 14]} />
                    <GlowMaterial color="#ffd166" intensity={1.5} />
                </mesh>
                <GlowHalo color="#ffe6a8" size={1.5} opacity={0.35} />
            </Grow>

            {/* Glastonbury-korset: ser ut som bevis, men er det ikke */}
            {crossLive && (
                <group position={[CROSS_X, 0, CROSS_Z]}>
                    <mesh position={[0, 0.25, 0]}>
                        <cylinderGeometry args={[1.5, 1.8, 0.5, 14]} />
                        <meshStandardMaterial color="#8f9a72" />
                    </mesh>
                    <mesh position={[0, 1.3, 0]}>
                        <boxGeometry args={[0.2, 1.6, 0.2]} />
                        <GlowMaterial color="#ffd166" intensity={1.2} />
                    </mesh>
                    <mesh position={[0, 1.6, 0]}>
                        <boxGeometry args={[0.9, 0.2, 0.2]} />
                        <GlowMaterial color="#ffd166" intensity={1.2} />
                    </mesh>
                    <group position={[0, 1.5, 0]}>
                        <GlowHalo color="#ffe3a0" size={0.85} opacity={0.18} />
                    </group>
                    <Hotspot
                        position={[0, 2.6, 0]}
                        onSelect={onCross}
                        label="Bevis?"
                        radius={0.75}
                        sound={null}
                    />
                </group>
            )}

            <Burst position={[0, 3.4, CASTLE_Z + 18]} trigger={burst} color="#ffd166" spread={4} />

            <Particles preset="motes" count={40} area={[26, 90]} center={[0, 3, -20]} height={9} />

            <Walker
                playing={playing}
                camPosRef={camPosRef}
                movingRef={movingRef}
                onPass={onPass}
                onProgress={onProgress}
                onArrive={onArrive}
            />

            <PovCamera positionRef={camPosRef} lookAhead={[0, 0.55, -9]} moving={playing} />
            <AimPlane
                enabled={playing}
                followCamera
                followDistance={14}
                size={[70, 40]}
                onHoldChange={onHold}
            />
        </group>
    );
}

const LegendensVei3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [stage, setStage] = useState(0);
    const [details, setDetails] = useState(0);
    const [progress, setProgress] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [badge, setBadge] = useState('Rundt år 500');
    const [crossLive, setCrossLive] = useState(true);
    const [tookCross, setTookCross] = useState(false);
    const [flash, setFlash] = useState(0);
    const [burst, setBurst] = useState(0);

    const camPosRef = useRef<[number, number, number]>([0, 1.65, START_Z]);
    const movingRef = useRef(false);

    // Banneret er en kort beskjed, ikke en fast tekst - la den falme.
    useEffect(() => {
        if (!banner) return;
        const id = window.setTimeout(() => setBanner(null), 5200);
        return () => window.clearTimeout(id);
    }, [banner]);

    const begin = useCallback(() => {
        camPosRef.current = [0, 1.65, START_Z];
        movingRef.current = false;
        setStage(0);
        setDetails(0);
        setProgress(0);
        setCrossLive(true);
        setTookCross(false);
        setBadge('Rundt år 500');
        setBanner('Hold inne museknappen for å gå framover i tid.');
        setGameState('playing');
        setAttempt((a) => a + 1);
    }, []);

    const handlePass = useCallback(
        (i: number) => {
            const k = KILDER[i];
            setStage(i + 1);
            setDetails((d) => d + k.adds);
            setBanner(k.banner);
            setBadge(`${k.yearLabel}, ${k.name}`);
            if (k.adds > 0) {
                setBurst((b) => b + 1);
                sounds.play('correct');
            } else {
                sounds.play('advance');
            }
        },
        [sounds]
    );

    const handleArrive = useCallback(() => {
        movingRef.current = false;
        setGameState('won');
        setBanner(null);
        sounds.play('complete');
    }, [sounds]);

    const handleCross = useCallback(() => {
        setCrossLive(false);
        setTookCross(true);
        setFlash((f) => f + 1);
        setBanner(
            'Klosteret i Glastonbury brant i 1184. Sju år senere «fant» munkene Arthurs grav, og pilegrimene kom med penger. Korset var ikke ekte bevis.'
        );
        sounds.play('incorrect');
    }, [sounds]);

    const handleHold = useCallback((holding: boolean) => {
        movingRef.current = holding;
    }, []);

    const score = tookCross ? 0.75 : 1;

    return (
        <MicroGameScaffold
            title="Legendens vei"
            subtitle="Gå bort fra år 500 og se Camelot vokse for hver kilde du passerer"
            estimatedSeconds={150}
            onRetry={gameState !== 'idle' ? begin : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 1.65, START_Z] as [number, number, number], fov: 62 },
                background: '#c6d4dc',
                fog: { color: '#c6d4dc', near: 16, far: 96 },
                light: 'overcast',
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#cfdce3] to-[#e6e2cf]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <ScreenFlash trigger={flash} preset="flare" durationMs={220} />
                    {gameState !== 'idle' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Kilder', value: `${stage}/${KILDER.length}` },
                                { label: 'Detaljer', value: details },
                                { label: 'Bevis fra år 500', value: 0 },
                            ]}
                        />
                    )}
                    <SceneBadge corner="br">{badge}</SceneBadge>
                    <DragHint show={gameState === 'playing' && stage < 1} corner="bc">
                        Hold inne museknappen for å gå
                    </DragHint>
                </>
            }
            scene={
                <RoadScene
                    key={attempt}
                    playing={gameState === 'playing'}
                    stage={stage}
                    burst={burst}
                    crossLive={crossLive}
                    camPosRef={camPosRef}
                    movingRef={movingRef}
                    onPass={handlePass}
                    onProgress={setProgress}
                    onArrive={handleArrive}
                    onHold={handleHold}
                    onCross={handleCross}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Du står på veien i året 500, der Arthur skal ha levd. Hold inne museknappen
                        for å gå framover i tid. For hver kildestein du passerer, vokser borgen
                        Camelot i horisonten.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow"
                    >
                        Start vandringen
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={progress}
                    label="Avstand fra Arthurs egen tid"
                    hint="Følg med på telleren nede til venstre: detaljene vokser, men bevisene fra år 500 blir stående på null."
                    labels={{
                        normal: 'Nær hendelsen',
                        warn: 'Flere hundre år unna',
                        danger: 'Nesten 1000 år unna',
                    }}
                />
            )}

            {gameState === 'won' && (
                <WinScreen
                    title="Du gikk nesten 1000 år bort fra Arthur"
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    {tookCross
                        ? 'Camelot vokste fra en liten trefort til en full borg, og legenden fikk 15 nye detaljer. Bevisene fra Arthurs egen tid: null. Korset du plukket opp i Glastonbury var heller ikke bevis, men en historie munkene trengte etter brannen.'
                        : 'Camelot vokste fra en liten trefort til en full borg, og legenden fikk 15 nye detaljer. Bevisene fra Arthurs egen tid: null. Du lot til og med det gyldne korset i Glastonbury ligge, og det var klokt: det var en historie munkene trengte etter brannen i 1184.'}
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default LegendensVei3D;
