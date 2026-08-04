import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    useMeter,
    useGameClock,
    useShake,
    ScreenFlash,
    DangerVignette,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: Sarajevo var beleiret i nesten fire år. Den eneste veien ut
// gikk gjennom en tunnel gravd for hånd under flyplassen - så lav at folk måtte
// gå bøyd hele veien. Eleven kjenner selv avveiningen: rett rygg er raskt, men
// smeller i bjelkene; bøyd rygg er trygt, men sliter deg ut. Byen overlevde fordi
// vanlige folk gikk denne turen om og om igjen.

const START_Z = 24;
const END_Z = -21;
const TUNNEL_HALF = 25.5;
const SIDE_X = 0.9;
const TIME_LIMIT = 40;
const REAL_METRES = 800;

// Lave bjelker eleven må bøye seg under. Klaring 1,24 - står du rett (1,58) smeller det.
const LOW_BEAMS = [17, 10, 3, -4, -11, -18];
const BEAM_CLEARANCE = 1.24;

const CROUCH_Y = 1.02;
const STAND_Y = 1.58;
const CROUCH_SPEED = 2.2;
const STAND_BONUS = 1.7;

type GameState = 'idle' | 'playing' | 'exhausted' | 'flooded' | 'won';

// Statisk kulisse: en trang, hånd-gravd tunnel med treverk og svake lyspærer.
function TunnelShell() {
    const frames: number[] = [];
    for (let z = -TUNNEL_HALF + 1; z <= TUNNEL_HALF - 1; z += 3) frames.push(z);
    const bulbs: number[] = [];
    for (let z = -TUNNEL_HALF + 4; z <= TUNNEL_HALF - 4; z += 6) bulbs.push(z);

    return (
        <>
            {/* Gulv: rå jord */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[3.2, TUNNEL_HALF * 2]} />
                <meshStandardMaterial color="#4a3c2e" roughness={1} />
            </mesh>

            {/* Vannpytter - tunnelen lekket hele tiden */}
            {[19, 6, -9, -21].map((z) => (
                <mesh key={`p-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.015, z]}>
                    <circleGeometry args={[1.1, 20]} />
                    <meshStandardMaterial
                        color="#3a4a52"
                        roughness={0.15}
                        metalness={0.2}
                        transparent
                        opacity={0.85}
                    />
                </mesh>
            ))}

            {/* Skinnegang for tralla - liggende sylindre langs Z */}
            {[-0.55, 0.55].map((x) => (
                <mesh key={`r-${x}`} position={[x, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, TUNNEL_HALF * 2, 6]} />
                    <meshStandardMaterial color="#6b6257" roughness={0.6} metalness={0.35} />
                </mesh>
            ))}

            {/* Sidevegger og tak: jord som holdes oppe av treverk */}
            {[-1.55, 1.55].map((x) => (
                <mesh key={`w-${x}`} position={[x, 1.1, 0]}>
                    <boxGeometry args={[0.3, 2.2, TUNNEL_HALF * 2]} />
                    <meshStandardMaterial color="#584734" roughness={1} />
                </mesh>
            ))}
            <mesh position={[0, 2.12, 0]}>
                <boxGeometry args={[3.5, 0.24, TUNNEL_HALF * 2]} />
                <meshStandardMaterial color="#5b4a36" roughness={1} />
            </mesh>

            {/* Avstivning: to stolper og en tverrbjelke, satt opp hver tredje meter */}
            {frames.map((z) => (
                <group key={`f-${z}`} position={[0, 0, z]}>
                    {[-1.28, 1.28].map((x) => (
                        <mesh key={x} position={[x, 0.98, 0]}>
                            <boxGeometry args={[0.16, 1.96, 0.16]} />
                            <meshStandardMaterial color="#7d6141" roughness={0.95} />
                        </mesh>
                    ))}
                    <mesh position={[0, 1.9, 0]}>
                        <boxGeometry args={[2.86, 0.17, 0.16]} />
                        <meshStandardMaterial color="#7d6141" roughness={0.95} />
                    </mesh>
                </group>
            ))}

            {/* De lave bjelkene - merket lyse så de er lette å se i god tid */}
            {LOW_BEAMS.map((z) => (
                <group key={`lb-${z}`} position={[0, 0, z]}>
                    <mesh position={[0, 1.32, 0]}>
                        <boxGeometry args={[2.9, 0.2, 0.26]} />
                        <meshStandardMaterial
                            color="#c9a227"
                            emissive="#8a6a10"
                            emissiveIntensity={0.5}
                            roughness={0.8}
                        />
                    </mesh>
                    <mesh position={[0, 1.19, 0.14]}>
                        <boxGeometry args={[2.9, 0.06, 0.02]} />
                        <meshStandardMaterial
                            color="#f2e3a0"
                            emissive="#e8d68a"
                            emissiveIntensity={0.8}
                        />
                    </mesh>
                </group>
            ))}

            {/* Krigslamper i en ledning langs taket */}
            {bulbs.map((z) => (
                <group key={`b-${z}`} position={[0.9, 1.86, z]}>
                    <mesh>
                        <sphereGeometry args={[0.09, 10, 8]} />
                        <meshStandardMaterial
                            color="#ffe6ad"
                            emissive="#ffc964"
                            emissiveIntensity={2.2}
                        />
                    </mesh>
                    <pointLight intensity={0.55} distance={6.5} color="#ffdba0" />
                </group>
            ))}

            {/* Dagslyset i enden: utgangen på Butmir-siden. Ligger godt foran
                stopp-punktet, så seiersbildet viser tunnelen med lyset i enden. */}
            <mesh position={[0, 1.05, -TUNNEL_HALF + 0.3]}>
                <planeGeometry args={[2.4, 1.95]} />
                <meshBasicMaterial color="#e6eef3" toneMapped={false} />
            </mesh>
            <pointLight position={[0, 1.2, -TUNNEL_HALF + 1.6]} intensity={1.1} distance={9} color="#e8f1f6" />
        </>
    );
}

interface SceneProps {
    gameState: GameState;
    attempt: number;
    camPosRef: React.MutableRefObject<[number, number, number]>;
    movingRef: React.MutableRefObject<boolean>;
    postureRef: React.MutableRefObject<number>;
    steerRef: React.MutableRefObject<number>;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
    fatigueAdd: (amount: number) => void;
    onHeadHit: () => void;
    onArrive: () => void;
    hitCount: number;
}

function TunnelScene({
    gameState,
    attempt,
    camPosRef,
    movingRef,
    postureRef,
    steerRef,
    onAim,
    onHoldChange,
    fatigueAdd,
    onHeadHit,
    onArrive,
    hitCount,
}: SceneProps) {
    // Scenen remountes per forsøk (key={attempt}), så refs nullstiller seg selv.
    void attempt;
    // useShake bruker useFrame og MÅ derfor bo inne i Canvas.
    const { ref: shakeRef, shake } = useShake();
    useEffect(() => {
        if (hitCount > 0) shake(0.8);
    }, [hitCount, shake]);
    const smoothPosture = useRef(1);
    const beamHitRef = useRef<Set<number>>(new Set());
    const arrivedRef = useRef(false);
    const onHeadHitRef = useRef(onHeadHit);
    const onArriveRef = useRef(onArrive);
    const fatigueAddRef = useRef(fatigueAdd);
    useEffect(() => {
        onHeadHitRef.current = onHeadHit;
    }, [onHeadHit]);
    useEffect(() => {
        onArriveRef.current = onArrive;
    }, [onArrive]);
    useEffect(() => {
        fatigueAddRef.current = fatigueAdd;
    }, [fatigueAdd]);

    useFrame((_state, dt) => {
        if (gameState !== 'playing') return;
        const pos = camPosRef.current;

        // Rygg-stillingen glir mykt mot der eleven peker
        const target = postureRef.current;
        smoothPosture.current += (target - smoothPosture.current) * Math.min(1, dt * 7);
        const p = smoothPosture.current;
        const camY = CROUCH_Y + p * (STAND_Y - CROUCH_Y);

        let nz = pos[2];
        if (movingRef.current) {
            nz = pos[2] - dt * (CROUCH_SPEED + p * STAND_BONUS);
            // Rett rygg er billig, bøyd rygg tar på
            fatigueAddRef.current(dt * (0.052 - p * 0.03));
        } else {
            // Puste ut koster tid i stedet for krefter
            fatigueAddRef.current(-dt * 0.09);
        }

        const dx = steerRef.current - pos[0];
        const nx = Math.max(-SIDE_X, Math.min(SIDE_X, pos[0] + dx * Math.min(1, dt * 3)));
        camPosRef.current = [nx, camY, nz];

        // Smalt hode-treff: passerte du en lav bjelke uten å bøye deg?
        for (const bz of LOW_BEAMS) {
            if (beamHitRef.current.has(bz)) continue;
            if (pos[2] > bz && nz <= bz) {
                beamHitRef.current.add(bz);
                if (camY > BEAM_CLEARANCE) onHeadHitRef.current();
            }
        }

        // DEV: samme informasjon som eleven ser (egen posisjon, neste bjelke),
        // slik at balansen kan verifiseres med selvspill.
        if (import.meta.env.DEV) {
            const next = LOW_BEAMS.filter((b) => b < nz).sort((a, b) => b - a)[0];
            (window as unknown as Record<string, unknown>).__sarajevoTunnelDebug = {
                z: nz,
                camY,
                nextBeamDist: next === undefined ? null : nz - next,
            };
        }

        if (!arrivedRef.current && nz <= END_Z) {
            arrivedRef.current = true;
            onArriveRef.current();
        }
    });

    return (
        <>
            <PovCamera
                positionRef={camPosRef}
                lookAhead={[0, -0.05, -6]}
                moving={gameState === 'playing'}
                bob={0.05}
            />
            <AimPlane
                enabled={gameState === 'playing'}
                followCamera
                onAim={onAim}
                onHoldChange={onHoldChange}
            />
            <group ref={shakeRef}>
                <TunnelShell />
            </group>
        </>
    );
}

const SarajevoTunnelen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [bump, setBump] = useState(0);
    const [metresLeft, setMetresLeft] = useState(REAL_METRES);

    const camPosRef = useRef<[number, number, number]>([0, STAND_Y, START_Z]);
    const movingRef = useRef(false);
    const postureRef = useRef(1);
    const steerRef = useRef(0);
    const gameStateRef = useRef<GameState>('idle');
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const fail = useCallback(
        (kind: 'exhausted' | 'flooded') => {
            if (gameStateRef.current !== 'playing') return;
            sounds.play('incorrect');
            movingRef.current = false;
            setFails((f) => f + 1);
            setBanner(null);
            setGameState(kind);
        },
        [sounds]
    );

    const fatigue = useMeter({
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.55,
        onOverload: () => fail('exhausted'),
    });
    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => fail('flooded'),
    });

    const handleAim = useCallback((xPct: number, yPct: number) => {
        steerRef.current = ((xPct - 50) / 50) * SIDE_X;
        // Peker du høyt, går du med rett rygg. Peker du lavt, bøyer du deg.
        postureRef.current = Math.max(0, Math.min(1, 1 - (yPct - 35) / 40));
    }, []);

    const handleHold = useCallback((holding: boolean) => {
        movingRef.current = holding;
    }, []);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            const travelled = START_Z - camPosRef.current[2];
            const frac = Math.max(0, Math.min(1, travelled / (START_Z - END_Z)));
            setMetresLeft(Math.round((1 - frac) * REAL_METRES));
            if (import.meta.env.DEV) {
                (window as unknown as Record<string, unknown>).__sarajevoFatigue =
                    fatigue.peek();
            }
        }, 220);
        return () => clearInterval(t);
    }, [gameState, fatigue]);

    const begin = useCallback(() => {
        camPosRef.current = [0, STAND_Y, START_Z];
        movingRef.current = false;
        postureRef.current = 1;
        steerRef.current = 0;
        fatigue.reset();
        clock.restart();
        setMetresLeft(REAL_METRES);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        setBanner('Hold inne for å gå. Peker du lavt, bøyer du deg under bjelkene.');
        setTimeout(() => setBanner(null), 3400);
    }, [fatigue, clock, sounds]);

    const handleHeadHit = useCallback(() => {
        sounds.play('incorrect');
        fatigue.add(0.18);
        setBump((b) => b + 1);
        setBanner('Au! Du traff bjelka. Bøy deg neste gang - pek lavere.');
        setTimeout(() => setBanner(null), 2000);
    }, [fatigue, sounds]);

    const score = Math.max(0.4, 1 - fails * 0.15);

    const handleArrive = useCallback(() => {
        if (gameStateRef.current !== 'playing') return;
        sounds.play('complete');
        movingRef.current = false;
        setBanner(null);
        setGameState('won');
        onComplete({ score: Math.max(0.4, 1 - fails * 0.15), completed: true });
    }, [sounds, onComplete, fails]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        fatigue.reset();
        movingRef.current = false;
    }, [fatigue]);

    return (
        <MicroGameScaffold
            title="Tunnelen under flyplassen"
            subtitle="Bær lasset gjennom Sarajevos livsnerve - rett rygg er raskt, bøyd rygg er trygt"
            estimatedSeconds={140}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, STAND_Y, START_Z] as [number, number, number], fov: 66 },
                background: '#1a140e',
                fog: { color: '#1a140e', near: 6, far: 30 },
                sunPosition: [2, 8, 4] as [number, number, number],
                sunIntensity: 0.12,
                ambientIntensity: 0.62,
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#1a140e] to-[#0e0b07]"
            overlays={
                <>
                    <ScreenFlash trigger={bump} preset="damage" durationMs={160} />
                    <DangerVignette level={gameState === 'playing' ? fatigue.value : 0} />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Før pumpa stopper"
                            warnBelow={12}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[{ label: 'Igjen', value: metresLeft, unit: 'm' }]}
                        />
                    )}
                    <SceneBanner message={banner} wide />
                    {gameState === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-black/50 text-white/75 rounded-xl text-xs text-center max-w-sm leading-relaxed">
                                Sarajevo, 1993. Over deg ligger rullebanen. Foran deg er 800 meter
                                med jord, treverk og vann.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <TunnelScene
                    key={attempt}
                    gameState={gameState}
                    attempt={attempt}
                    camPosRef={camPosRef}
                    movingRef={movingRef}
                    postureRef={postureRef}
                    steerRef={steerRef}
                    onAim={handleAim}
                    onHoldChange={handleHold}
                    fatigueAdd={fatigue.add}
                    onHeadHit={handleHeadHit}
                    onArrive={handleArrive}
                    hitCount={bump}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Hold inne museknappen for å gå framover. Flytt pekeren opp for å rette
                        ryggen, og ned for å bøye deg. Rett rygg går fortest, men de gule bjelkene
                        henger lavt. Bøyd rygg er trygt, men sliter deg ut.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition shadow"
                    >
                        Ta på deg sekken og gå inn
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={fatigue.value}
                    label="Krefter brukt"
                    hint="Bøyd rygg sliter deg fortere ut enn rett rygg. Slipp knappen for å puste ut - men da renner tida."
                    labels={{ normal: 'Uthvilt', warn: 'Sliten', danger: 'Utslitt!' }}
                />
            )}

            {gameState === 'exhausted' && (
                <LoseScreen title="Kreftene tok slutt" onRetry={begin}>
                    Du måtte sette fra deg lasset midtveis. Folk som gikk denne turen sparte
                    krefter ved å gå med rett rygg der taket var høyt, og bøyde seg bare der
                    bjelkene hang lavt. Prøv igjen.
                </LoseScreen>
            )}

            {gameState === 'flooded' && (
                <LoseScreen title="Vannet steg" onRetry={begin}>
                    Tunnelen lekket hele tiden, og pumpene måtte gå for at den skulle være
                    farbar. Du brukte for lang tid. Prøv igjen, og stå oppreist der du kan.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={
                        fails === 0
                            ? 'Du kom fram - på første forsøk!'
                            : 'Du kom fram til Butmir-siden!'
                    }
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Tunnelen ble ferdig midt i 1993 og gikk under rullebanen på flyplassen. Den
                    var byens eneste vei ut. Mat, medisiner og strøm kom inn denne veien, og folk
                    gikk den bøyd, med tung sekk, om og om igjen. Beleiringen av Sarajevo varte
                    fra april 1992 til februar 1996 og var den lengste beleiringen av en by i
                    moderne europeisk historie.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default SarajevoTunnelen3D;
