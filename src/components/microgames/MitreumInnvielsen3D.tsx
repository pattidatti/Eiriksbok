import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Person,
    Torch,
    Particles,
    useMeter,
    useGameClock,
    MeterBar,
    TimerPill,
    DataReadout,
    DangerVignette,
    LoseScreen,
    WinScreen,
    SceneBanner,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: eleven kjenner på kroppen hvorfor en mysteriekult var noe
// helt annet enn statens religion. Jupitertempelet sto i dagslys midt i byen og
// rommet tusener. Mitreum lå under bakken, uten vinduer, og tok en liten flokk.
// Du går selv ned den mørke gangen med en oljelampe som ikke tåler at du haster.

const START_Z = 14;
const ROOM_Z = -14; // der gangen åpner seg inn i mitreum
const ALTAR_Z = -21.4;
const WALK_SPEED = 4.0;
const HALF_X = 1.6; // hvor langt til siden eleven kan styre i gangen
const TIME_LIMIT = 40;
const DARK_PER_SECOND_WALKING = 0.36;
const DARK_RECOVER_STANDING = 0.42;

type GameState = 'idle' | 'playing' | 'dark' | 'late' | 'won';

// De sju innvielsesgradene i mitraskulten, nederst først (Groth, 2025).
const GRADES = [
    { name: 'Corax', gloss: 'ravnen' },
    { name: 'Nymphus', gloss: 'brudgommen' },
    { name: 'Miles', gloss: 'soldaten' },
    { name: 'Leo', gloss: 'løven' },
    { name: 'Perses', gloss: 'perseren' },
    { name: 'Heliodromus', gloss: 'solløperen' },
    { name: 'Pater', gloss: 'faren' },
];
const GRADE_Z = [11, 7, 3, -1, -5, -9, -13];

// ── Gangen: lang, smal og hvelvet. Ren kulisse eleven beveger seg gjennom, og
// derfor merket som dekor for scene-revisjonen - "modellen" er selve mitreum.
function Korridor() {
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {/* Gulvet - ett langt plan (helleskift antydes av bånd under) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} receiveShadow>
                <planeGeometry args={[5.2, 34]} />
                <meshStandardMaterial color="#4a4038" roughness={1} />
            </mesh>

            {/* Sidevegger */}
            {[-2.5, 2.5].map((x) => (
                <mesh key={`v-${x}`} position={[x, 1.7, -2]}>
                    <boxGeometry args={[0.4, 3.4, 34]} />
                    <meshStandardMaterial color="#5b4c40" roughness={0.95} />
                </mesh>
            ))}

            {/* Tønnehvelv over gangen: sylinder med aksen langs Z, sett fra innsiden */}
            <mesh position={[0, 2.5, -2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[2.5, 2.5, 34, 18, 1, true]} />
                <meshStandardMaterial color="#6a5748" roughness={1} side={THREE.BackSide} />
            </mesh>

            {/* Fakler i veggen - lyspøler eleven går fra og til */}
            {[10, 5, 0, -5, -10].map((z, i) => (
                <Torch
                    key={`f-${z}`}
                    position={[i % 2 === 0 ? -2.1 : 2.1, 1.5, z]}
                    height={0.45}
                    color="#ffa346"
                />
            ))}

            {/* Gradsterskler: sju bånd i gulvet, ett for hvert trinn */}
            {GRADE_Z.map((z, i) => (
                <mesh key={`t-${z}`} position={[0, 0.06, z]}>
                    <boxGeometry args={[4.4, 0.12, 0.45]} />
                    <meshStandardMaterial
                        color={i >= 5 ? '#a8863f' : '#7d7065'}
                        roughness={0.8}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ── Mitreum: det lille, mørke rommet gangen ender i. To lange benker med en
// midtgang, et alter og relieffet av oksedrapet på endeveggen (Groth, 2020).
function Mitreum({ arrived }: { arrived: boolean }) {
    return (
        <group>
            {/* Gulv i rommet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -18]} receiveShadow>
                <planeGeometry args={[7.6, 9]} />
                <meshStandardMaterial color="#4f453b" roughness={1} />
            </mesh>

            {/* Sidevegger og endevegg */}
            {[-3.6, 3.6].map((x) => (
                <mesh key={`mv-${x}`} position={[x, 1.6, -18]}>
                    <boxGeometry args={[0.4, 3.2, 9]} />
                    <meshStandardMaterial color="#5b4c40" roughness={0.95} />
                </mesh>
            ))}
            <mesh position={[0, 1.6, -22.3]}>
                <boxGeometry args={[7.6, 3.2, 0.4]} />
                <meshStandardMaterial color="#5b4c40" roughness={0.95} />
            </mesh>

            {/* Hvelv over rommet */}
            <mesh position={[0, 1.7, -18]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[3.6, 3.6, 9, 18, 1, true]} />
                <meshStandardMaterial color="#6a5748" roughness={1} side={THREE.BackSide} />
            </mesh>

            {/* De to lange steinbenkene med midtgang mellom */}
            {[-2.2, 2.2].map((x) => (
                <mesh key={`b-${x}`} position={[x, 0.26, -18]} castShadow receiveShadow>
                    <boxGeometry args={[1.5, 0.52, 7.4]} />
                    <meshStandardMaterial color="#7b6b59" roughness={0.9} />
                </mesh>
            ))}

            {/* Innvidde som allerede sitter og venter på måltidet */}
            {[-16.6, -18.4, -20.2].map((z, i) => (
                <React.Fragment key={`p-${z}`}>
                    <Person
                        position={[-2.2, 0.52, z]}
                        rotation={[0, Math.PI / 2, 0]}
                        pose="sit"
                        scale={0.9}
                        body={i === 1 ? '#8a6b3f' : '#7a4a3a'}
                    />
                    <Person
                        position={[2.2, 0.52, z]}
                        rotation={[0, -Math.PI / 2, 0]}
                        pose="sit"
                        scale={0.9}
                        body={i === 0 ? '#6d5a7a' : '#7a4a3a'}
                    />
                </React.Fragment>
            ))}

            {/* Alteret i midtgangen foran endeveggen */}
            <mesh position={[0, 0.34, ALTAR_Z + 0.9]} castShadow>
                <boxGeometry args={[0.9, 0.68, 0.7]} />
                <meshStandardMaterial color="#8d7c63" roughness={0.85} />
            </mesh>

            {/* Relieffet: oksen og den unge mannen over den (tauroktonien) */}
            <group position={[0, 1.6, ALTAR_Z - 0.5]}>
                <mesh>
                    <boxGeometry args={[3.4, 2.1, 0.22]} />
                    <meshStandardMaterial
                        color="#c9b48c"
                        emissive="#3a2a12"
                        emissiveIntensity={arrived ? 0.7 : 0.25}
                        roughness={0.75}
                    />
                </mesh>
                {/* Oksekroppen */}
                <mesh position={[-0.15, -0.5, 0.16]}>
                    <boxGeometry args={[1.6, 0.44, 0.16]} />
                    <meshStandardMaterial color="#9c8a63" roughness={0.8} />
                </mesh>
                {/* Oksehodet, senket mot bakken */}
                <mesh position={[-1.12, -0.66, 0.16]}>
                    <boxGeometry args={[0.42, 0.34, 0.16]} />
                    <meshStandardMaterial color="#9c8a63" roughness={0.8} />
                </mesh>
                {/* Hornene */}
                <mesh position={[-1.3, -0.44, 0.16]} rotation={[0, 0, 0.5]}>
                    <boxGeometry args={[0.26, 0.08, 0.14]} />
                    <meshStandardMaterial color="#b6a074" roughness={0.8} />
                </mesh>
                {/* Beina som svikter under oksen */}
                {[-0.75, -0.1, 0.45].map((bx) => (
                    <mesh key={`ben-${bx}`} position={[bx, -0.85, 0.16]}>
                        <boxGeometry args={[0.12, 0.32, 0.14]} />
                        <meshStandardMaterial color="#9c8a63" roughness={0.8} />
                    </mesh>
                ))}
                {/* Mannen som kneler over oksen */}
                <mesh position={[0.22, 0.12, 0.18]}>
                    <boxGeometry args={[0.34, 0.72, 0.16]} />
                    <meshStandardMaterial color="#b6a074" roughness={0.8} />
                </mesh>
                {/* Hodet med den frygiske lua */}
                <mesh position={[0.22, 0.6, 0.18]}>
                    <boxGeometry args={[0.26, 0.28, 0.16]} />
                    <meshStandardMaterial color="#b6a074" roughness={0.8} />
                </mesh>
                {/* Armen med kniven, strukket ned mot oksen */}
                <mesh position={[-0.12, -0.02, 0.2]} rotation={[0, 0, 0.7]}>
                    <boxGeometry args={[0.5, 0.11, 0.13]} />
                    <meshStandardMaterial color="#b6a074" roughness={0.8} />
                </mesh>
                {/* Kappa som blafrer bak ham */}
                <mesh position={[0.68, 0.4, 0.14]} rotation={[0, 0, -0.4]}>
                    <boxGeometry args={[0.52, 0.62, 0.1]} />
                    <meshStandardMaterial color="#9c8a63" roughness={0.8} />
                </mesh>
            </group>

            {/* Fakler som flankerer relieffet */}
            <Torch position={[-1.5, 1.1, ALTAR_Z - 0.2]} height={0.5} color="#ffb257" />
            <Torch position={[1.5, 1.1, ALTAR_Z - 0.2]} height={0.5} color="#ffb257" />
        </group>
    );
}

// ── Scenen med all sanntidslogikk (refs, ikke state per frame) ───────────────
function GangScene({
    gameState,
    isWalking,
    camPosRef,
    movingRef,
    steerRef,
    darkPeek,
    darkAdd,
    onGrade,
    onArrive,
    onAim,
    onHoldChange,
}: {
    gameState: GameState;
    isWalking: boolean;
    camPosRef: React.MutableRefObject<[number, number, number]>;
    movingRef: React.MutableRefObject<boolean>;
    steerRef: React.MutableRefObject<number>;
    darkPeek: () => number;
    darkAdd: (n: number) => void;
    onGrade: (index: number) => void;
    onArrive: () => void;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
}) {
    const gradeRef = useRef(0);
    const arrivedRef = useRef(false);
    const onGradeRef = useRef(onGrade);
    const onArriveRef = useRef(onArrive);
    useEffect(() => {
        onGradeRef.current = onGrade;
    }, [onGrade]);
    useEffect(() => {
        onArriveRef.current = onArrive;
    }, [onArrive]);

    useFrame((_state, rawDt) => {
        // Klem tidssteget: et enkelt hakk i bildeflyten skal ikke rykke eleven
        // flere meter fremover eller blåse ut lampa på én frame.
        const dt = Math.min(rawDt, 0.15);
        const pos = camPosRef.current;

        if (gameState === 'playing') {
            if (movingRef.current) {
                // Fremover mot rommet, med sidestyring mot pekeren
                const nz = pos[2] - dt * WALK_SPEED;
                const dx = steerRef.current - pos[0];
                const nx = Math.max(-HALF_X, Math.min(HALF_X, pos[0] + dx * Math.min(1, dt * 2.6)));
                camPosRef.current = [nx, 1.55, nz];

                // Lufta fra gangen tar flammen når du haster
                darkAdd(dt * DARK_PER_SECOND_WALKING);

                // Passert en gradsterskel?
                while (gradeRef.current < GRADE_Z.length && nz <= GRADE_Z[gradeRef.current]) {
                    onGradeRef.current(gradeRef.current);
                    gradeRef.current += 1;
                }
                if (!arrivedRef.current && nz <= ROOM_Z - 2.5) {
                    arrivedRef.current = true;
                    onArriveRef.current();
                }
            } else {
                // Står du stille, tar flammen seg opp igjen. Både tap og
                // gjenoppretting drives av samme frame-klokke, så forholdet
                // mellom dem er det samme uansett hvor rask maskinen er.
                darkAdd(-dt * DARK_RECOVER_STANDING);
            }

            // DEV: samme info som eleven ser (posisjon, grad, om du går) - brukt
            // til selvspill-verifisering av balansen.
            if (import.meta.env.DEV) {
                (window as unknown as Record<string, unknown>).__mitreumDebug = {
                    z: camPosRef.current[2],
                    grade: gradeRef.current,
                    walking: movingRef.current,
                    dark: darkPeek(),
                };
            }
        } else if (gameState === 'won') {
            // Gli inn mot alteret og relieffet
            const k = Math.min(1, dt * 1.0);
            camPosRef.current = [
                pos[0] + (0 - pos[0]) * k,
                pos[1] + (1.75 - pos[1]) * k,
                pos[2] + (ALTAR_Z + 6.8 - pos[2]) * k,
            ];
        }
    });

    return (
        <>
            <PovCamera
                positionRef={camPosRef}
                lookAhead={[0, -0.12, -6]}
                moving={gameState === 'playing' && isWalking}
                bob={0.05}
            />
            <AimPlane
                enabled={gameState === 'playing'}
                followCamera
                onAim={onAim}
                onHoldChange={onHoldChange}
            />
            <Korridor />
            <Mitreum arrived={gameState === 'won'} />
            {/* Støv i faklenes lys - rommet lever selv når du står stille */}
            <Particles preset="motes" />
        </>
    );
}

// ── Hovedelement ────────────────────────────────────────────────────────────
const MitreumInnvielsen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [isWalking, setIsWalking] = useState(false);
    const [grade, setGrade] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [winBurst, setWinBurst] = useState(0);

    const camPosRef = useRef<[number, number, number]>([0, 1.55, START_Z]);
    const movingRef = useRef(false);
    const steerRef = useRef(0);
    const gameStateRef = useRef<GameState>('idle');
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const fail = useCallback(
        (kind: 'dark' | 'late') => {
            if (gameStateRef.current !== 'playing') return;
            sounds.play('incorrect');
            movingRef.current = false;
            setIsWalking(false);
            setFails((f) => f + 1);
            setBanner(null);
            setGameState(kind);
        },
        [sounds]
    );

    // Måleren er MØRKET: den stiger når du går, og synker når du står stille og
    // lar flammen ta seg opp igjen. Går den i taket, er lampa ute.
    const dark = useMeter({
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.5,
        onOverload: () => fail('dark'),
    });
    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => fail('late'),
    });

    const handleAim = useCallback((xPct: number) => {
        steerRef.current = ((xPct - 50) / 50) * HALF_X;
    }, []);

    const handleHold = useCallback((holding: boolean) => {
        movingRef.current = holding;
        setIsWalking(holding);
    }, []);

    const handleGrade = useCallback(
        (index: number) => {
            const g = GRADES[index];
            setGrade(index + 1);
            sounds.play('advance');
            setBanner(`Grad ${index + 1} av 7: ${g.name} - ${g.gloss}`);
        },
        [sounds]
    );

    const score = Math.max(0.4, 1 - fails * 0.15);

    // Mørket lukker seg rundt deg: tåka trekker seg innover når lampa svekkes.
    const fogFar = gameState === 'playing' ? Math.round(24 - dark.value * 17) : 24;

    const handleArrive = useCallback(() => {
        sounds.play('complete');
        setBanner(null);
        setWinBurst((b) => b + 1);
        setGameState('won');
        onComplete({ score: Math.max(0.4, 1 - fails * 0.15), completed: true });
    }, [sounds, onComplete, fails]);

    const begin = useCallback(() => {
        camPosRef.current = [0, 1.55, START_Z];
        movingRef.current = false;
        steerRef.current = 0;
        dark.reset();
        clock.restart();
        setIsWalking(false);
        setGrade(0);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        setBanner('Hold inne for å gå. Slipp for å la flammen ta seg opp igjen.');
        setTimeout(() => setBanner(null), 3000);
    }, [dark, clock, sounds]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        setGrade(0);
        dark.reset();
        movingRef.current = false;
        setIsWalking(false);
    }, [dark]);

    return (
        <MicroGameScaffold
            title="Ned i mitreum"
            subtitle="Bær oljelampen ned den mørke gangen. Haster du, blåser flammen ut."
            estimatedSeconds={140}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 1.55, START_Z] as [number, number, number], fov: 62 },
                background: '#150f0a',
                fog: { color: '#150f0a', near: 2, far: fogFar },
                sunPosition: [4, 9, 6] as [number, number, number],
                sunIntensity: 0.14,
                ambientIntensity: 0.4,
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#231710] to-[#0e0a07]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DangerVignette level={gameState === 'playing' ? dark.value : 0} />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Til måltidet"
                            warnBelow={8}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[{ label: 'Grad', value: `${grade} av 7` }]}
                        />
                    )}
                    {gameState === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-black/50 text-white/75 rounded-xl text-xs text-center max-w-sm leading-relaxed">
                                Roma, rundt år 200. Over deg går folk i solen. Her nede venter et
                                rom uten vinduer.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <>
                    <GangScene
                        key={attempt}
                        gameState={gameState}
                        isWalking={isWalking}
                        camPosRef={camPosRef}
                        movingRef={movingRef}
                        steerRef={steerRef}
                        darkPeek={dark.peek}
                        darkAdd={dark.add}
                        onGrade={handleGrade}
                        onArrive={handleArrive}
                        onAim={handleAim}
                        onHoldChange={handleHold}
                    />
                    <Burst position={[0, 1.4, ALTAR_Z + 1.6]} trigger={winBurst} />
                </>
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Du er på vei til din egen innvielse. Hold inne museknappen for å gå
                        fremover, og styr med pekeren. Går du for lenge om gangen, tar trekken
                        flammen. Stopp innimellom og la lampa ta seg opp - men rekk fram før
                        måltidet begynner.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition shadow"
                    >
                        Gå ned trappa
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={dark.value}
                    label="Mørket"
                    hint="Flammen svekkes mens du går, og tar seg opp igjen når du står stille. Gå i korte etapper."
                    labels={{ normal: 'Lampa lyser', warn: 'Flammen blafrer', danger: 'NESTEN UTE!' }}
                />
            )}

            {gameState === 'dark' && (
                <LoseScreen title="Lampa gikk ut" onRetry={begin}>
                    Et mitreum lå under bakken og hadde ingen vinduer. Uten ild var det helt mørkt
                    der nede. Prøv igjen, men gå i korte etapper og la flammen ta seg opp mellom
                    hver.
                </LoseScreen>
            )}

            {gameState === 'late' && (
                <LoseScreen title="Måltidet var alt begynt" onRetry={begin}>
                    De innvidde spiste sammen i rommet, og du kom for sent inn. Prøv igjen: stopp
                    akkurat lenge nok til at flammen tar seg opp, og ikke lenger.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={
                        fails === 0
                            ? 'Du kom fram med lampa i live - på første forsøk!'
                            : 'Du kom fram til mitreum'
                    }
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Se deg rundt: to benker, en midtgang, et alter og bildet av oksedrapet. Rommet
                    tar en liten flokk. Oppe i dagslyset sto templene som rommet hele byen. Det er
                    hele forskjellen mellom statens religion og en mysteriekult.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default MitreumInnvielsen3D;
