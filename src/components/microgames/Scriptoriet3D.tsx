import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Hotspot,
    Column,
    Particles,
    Burst,
    useGameClock,
    useMeter,
    useRandomPulse,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    DragHint,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: eleven kjenner på kroppen hvorfor en bok tok så lang tid å
// lage i middelalderen. Hver linje må dras fram for hånd i dagslys, og hver gang
// bjella ringer må alt legges fra seg. Arbeid og bønn delte døgnet mellom seg -
// og det var akkurat dette arbeidet som reddet antikkens bøker.

const LINES = 6;
const TIME_LIMIT = 90;
// Hvor mange prosentpoeng vannrett pekerbevegelse som trengs per linje ved fullt
// dagslys. Høyt med vilje: kopieringen skal kjennes seig, ikke rask.
const SWEEP_PER_LINE = 150;
const BELL_ANSWER_MS = 7000;
// Nådefrist: så lenge etter at bjella slo, straffes ikke et strøk som var i gang.
const BELL_GRACE_MS = 900;
const PRAYER_MS = 2200;

// Sida ligger i en vippet gruppe. Lokal +X er mot høyre, lokal +Y oppover arket,
// lokal +Z er arkets normal (ut av papiret).
const DESK_TILT = -Math.PI / 2 + 0.25;
const PAGE_W = 1.12;
const PAGE_H = 0.78;
const LINE_X0 = -0.46;
const LINE_W = 0.92;
const lineY = (i: number) => 0.27 - i * 0.098;

type GameState = 'idle' | 'playing' | 'won' | 'dark' | 'abbot';
type BellState = 'none' | 'ringing' | 'praying';

// ---- Rommet: steinvegg, vindu, døråpning. Ren arkitektur rundt oppgaven, så
// den er merket som dekor for den mekaniske scene-revisjonen.
function Scriptorium() {
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {/* Gulv */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -1]} receiveShadow>
                <planeGeometry args={[14, 14]} />
                <meshStandardMaterial color="#9c9285" roughness={1} />
            </mesh>

            {/* Bakvegg */}
            <mesh position={[0, 1.7, -3.3]} receiveShadow>
                <boxGeometry args={[9, 3.4, 0.24]} />
                <meshStandardMaterial color="#b3aa9a" roughness={0.95} />
            </mesh>
            {/* Sidevegger */}
            <mesh position={[-4.3, 1.7, -1.2]} receiveShadow>
                <boxGeometry args={[0.24, 3.4, 4.5]} />
                <meshStandardMaterial color="#a79e8f" roughness={0.95} />
            </mesh>
            <mesh position={[4.3, 1.7, -1.2]} receiveShadow>
                <boxGeometry args={[0.24, 3.4, 4.5]} />
                <meshStandardMaterial color="#a79e8f" roughness={0.95} />
            </mesh>

            {/* Vindusnisje: lyst rektangel med rund topp, som i et klosterrom */}
            <group position={[-1.55, 0, -3.17]}>
                <mesh position={[0, 1.85, 0]}>
                    <planeGeometry args={[1.15, 1.4]} />
                    <meshBasicMaterial color="#fff4dc" toneMapped={false} />
                </mesh>
                <mesh position={[0, 2.55, 0]}>
                    <circleGeometry args={[0.575, 20, 0, Math.PI]} />
                    <meshBasicMaterial color="#fff4dc" toneMapped={false} />
                </mesh>
                {/* Sprosser */}
                <mesh position={[0, 1.85, 0.02]}>
                    <boxGeometry args={[0.05, 1.4, 0.03]} />
                    <meshStandardMaterial color="#6b5a44" roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.85, 0.02]}>
                    <boxGeometry args={[1.15, 0.05, 0.03]} />
                    <meshStandardMaterial color="#6b5a44" roughness={0.9} />
                </mesh>
            </group>

            {/* Døråpning ut mot korsgangen */}
            <group position={[1.35, 0, -3.17]}>
                <mesh position={[0, 1.05, 0]}>
                    <planeGeometry args={[0.92, 2.1]} />
                    <meshBasicMaterial color="#4a3d2e" />
                </mesh>
                <mesh position={[0, 2.1, 0]}>
                    <circleGeometry args={[0.46, 18, 0, Math.PI]} />
                    <meshBasicMaterial color="#4a3d2e" />
                </mesh>
            </group>

            <Column position={[-3.1, 0, -2.5]} height={3.0} radius={0.2} color="#cdc4b3" />
            <Column position={[3.1, 0, -2.5]} height={3.0} radius={0.2} color="#cdc4b3" />

            {/* Støv som svever i lysstripa fra vinduet. Holdes langt fra kameraet,
                ellers blir hvert støvkorn en stor flekk rett foran eleven. */}
            <Particles
                preset="motes"
                count={18}
                area={[1.4, 1.0]}
                center={[-1.4, 0.9, -2.7]}
                height={1.7}
            />
        </group>
    );
}

// ---- Pulten med arket eleven skriver på ----
function Desk({
    linesDone,
    chargeRef,
    aimXRef,
    writable,
}: {
    linesDone: number;
    chargeRef: React.MutableRefObject<number>;
    aimXRef: React.MutableRefObject<number>;
    writable: boolean;
}) {
    const inkRef = useRef<THREE.Group>(null);
    const quillRef = useRef<THREE.Group>(null);
    const quillX = useRef(0);

    useFrame((_, dt) => {
        // Den aktive linja vokser mot hvor langt eleven har dratt pennen.
        if (inkRef.current) {
            const target = Math.min(1, chargeRef.current);
            inkRef.current.scale.x = damp(inkRef.current.scale.x, target, dt, 14);
        }
        // Fjærpennen følger pekeren vannrett over arket.
        if (quillRef.current) {
            const want = LINE_X0 + (aimXRef.current / 100) * LINE_W;
            quillX.current = damp(quillX.current, want, dt, 12);
            quillRef.current.position.x = quillX.current;
            quillRef.current.position.y = lineY(Math.min(linesDone, LINES - 1)) + 0.05;
            quillRef.current.visible = writable;
        }
    });

    const active = Math.min(linesDone, LINES - 1);

    return (
        <group>
            {/* Bein */}
            {[-0.52, 0.52].map((x) => (
                <mesh key={`b${x}`} position={[x, 0.47, -0.55]} castShadow>
                    <boxGeometry args={[0.09, 0.94, 0.09]} />
                    <meshStandardMaterial color="#5b4227" roughness={0.9} />
                </mesh>
            ))}
            {[-0.52, 0.52].map((x) => (
                <mesh key={`f${x}`} position={[x, 0.36, 0.18]} castShadow>
                    <boxGeometry args={[0.09, 0.72, 0.09]} />
                    <meshStandardMaterial color="#5b4227" roughness={0.9} />
                </mesh>
            ))}

            {/* Hylle nederst, med blekkhus som står på den */}
            <mesh position={[0, 0.72, 0.22]} castShadow receiveShadow>
                <boxGeometry args={[1.4, 0.05, 0.18]} />
                <meshStandardMaterial color="#6b4e2c" roughness={0.9} />
            </mesh>
            <mesh position={[0.55, 0.79, 0.22]} castShadow>
                <cylinderGeometry args={[0.055, 0.065, 0.09, 12]} />
                <meshStandardMaterial color="#2f2a26" roughness={0.6} />
            </mesh>

            {/* Skråplata med arket */}
            <group position={[0, 0.86, -0.2]} rotation={[DESK_TILT, 0, 0]}>
                <mesh position={[0, 0, -0.035]} castShadow receiveShadow>
                    <boxGeometry args={[1.34, 0.92, 0.06]} />
                    <meshStandardMaterial color="#6b4e2c" roughness={0.9} />
                </mesh>
                {/* Pergamentarket */}
                <mesh position={[0, 0, 0]} receiveShadow>
                    <planeGeometry args={[PAGE_W, PAGE_H]} />
                    <meshStandardMaterial color="#f3e7c8" roughness={0.95} />
                </mesh>
                {/* Svake hjelpelinjer - viser hvor mange linjer som gjenstår */}
                {Array.from({ length: LINES }).map((_, i) => (
                    <mesh key={`g${i}`} position={[0, lineY(i), 0.002]}>
                        <planeGeometry args={[LINE_W, 0.006]} />
                        <meshBasicMaterial color="#cbb890" />
                    </mesh>
                ))}
                {/* Ferdig kopierte linjer */}
                {Array.from({ length: LINES }).map((_, i) =>
                    i < linesDone ? (
                        <group key={`d${i}`} position={[LINE_X0, lineY(i), 0.004]}>
                            <mesh position={[LINE_W / 2, 0, 0]}>
                                <planeGeometry args={[LINE_W, 0.022]} />
                                <meshBasicMaterial color="#3a2c1c" />
                            </mesh>
                        </group>
                    ) : null
                )}
                {/* Linja som skrives nå */}
                {linesDone < LINES && (
                    <group ref={inkRef} position={[LINE_X0, lineY(active), 0.004]} scale={[0, 1, 1]}>
                        <mesh position={[LINE_W / 2, 0, 0]}>
                            <planeGeometry args={[LINE_W, 0.022]} />
                            <meshBasicMaterial color="#3a2c1c" />
                        </mesh>
                    </group>
                )}
                {/* Fjærpennen */}
                <group ref={quillRef} position={[0, lineY(0) + 0.05, 0.03]}>
                    <mesh position={[0, 0.13, 0.05]} rotation={[0.35, 0, -0.32]} castShadow>
                        <cylinderGeometry args={[0.006, 0.012, 0.26, 8]} />
                        <meshStandardMaterial color="#e8e3d5" roughness={0.7} />
                    </mesh>
                    <mesh position={[0.02, 0.24, 0.09]} rotation={[0.35, 0, -0.32]}>
                        <coneGeometry args={[0.035, 0.16, 8]} />
                        <meshStandardMaterial color="#f6f2e6" roughness={0.8} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

// ---- Bjella ved døra ----
function Bell({ ringing }: { ringing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, dt) => {
        if (!ref.current) return;
        const t = state.clock.getElapsedTime();
        const want = ringing ? Math.sin(t * 9) * 0.42 : 0;
        ref.current.rotation.z = damp(ref.current.rotation.z, want, dt, 10);
    });
    return (
        <group position={[1.35, 2.32, -3.0]}>
            {/* Bjelke bjella henger i */}
            <mesh position={[0, 0.14, 0]}>
                <boxGeometry args={[0.5, 0.07, 0.09]} />
                <meshStandardMaterial color="#5b4227" roughness={0.9} />
            </mesh>
            <group ref={ref} position={[0, 0.1, 0]}>
                <mesh position={[0, -0.11, 0]} castShadow>
                    <cylinderGeometry args={[0.055, 0.13, 0.2, 14]} />
                    <meshStandardMaterial
                        color="#b98b32"
                        metalness={0.55}
                        roughness={0.45}
                        emissive={ringing ? '#7a4f10' : '#000000'}
                        emissiveIntensity={ringing ? 0.5 : 0}
                    />
                </mesh>
                <mesh position={[0, -0.23, 0]}>
                    <sphereGeometry args={[0.035, 10, 10]} />
                    <meshStandardMaterial color="#8a6522" metalness={0.5} roughness={0.5} />
                </mesh>
            </group>
        </group>
    );
}

// ---- Hele scenen ----
function ScriptoriumScene({
    playing,
    light,
    linesDone,
    chargeRef,
    aimXRef,
    bell,
    writable,
    onAim,
    onHold,
    onPray,
}: {
    playing: boolean;
    light: number;
    linesDone: number;
    chargeRef: React.MutableRefObject<number>;
    aimXRef: React.MutableRefObject<number>;
    bell: BellState;
    writable: boolean;
    onAim: (x: number, y: number) => void;
    onHold: (holding: boolean) => void;
    onPray: () => void;
}) {
    const sunRef = useRef<THREE.PointLight>(null);
    const fillRef = useRef<THREE.AmbientLight>(null);

    useFrame((_, dt) => {
        // Dagslyset dør sakte ut. Eleven ser og kjenner at det haster.
        const warm = 0.35 + 1.55 * light;
        if (sunRef.current) sunRef.current.intensity = damp(sunRef.current.intensity, warm, dt, 1.6);
        if (fillRef.current)
            fillRef.current.intensity = damp(fillRef.current.intensity, 0.28 + 0.42 * light, dt, 1.6);
    });

    return (
        <>
            <PovCamera position={[0, 1.52, 1.55]} lookAt={[0, 0.9, -0.55]} sway={0.012} />
            <AimPlane
                enabled={playing}
                position={[0, 1.4, -14]}
                onAim={onAim}
                onHoldChange={onHold}
            />

            <ambientLight ref={fillRef} intensity={0.6} color="#e8dcc4" />
            <pointLight
                ref={sunRef}
                position={[-1.55, 2.0, -2.6]}
                intensity={1.9}
                distance={9}
                color="#ffe6b8"
            />

            <Scriptorium />
            <Desk
                linesDone={linesDone}
                chargeRef={chargeRef}
                aimXRef={aimXRef}
                writable={writable}
            />
            <Bell ringing={bell === 'ringing'} />

            {bell === 'ringing' && (
                <Hotspot position={[1.35, 1.55, -2.95]} radius={0.34} onSelect={onPray} label="Gå til bønn" />
            )}

            <Burst position={[0, 1.05, -0.5]} trigger={linesDone} />
        </>
    );
}

// ---- Hovedelement ----
const Scriptoriet3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [gameState, setGameState] = useState<GameState>('idle');
    const [bell, setBell] = useState<BellState>('none');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [linesDone, setLinesDone] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);

    const chargeRef = useRef(0);
    const aimXRef = useRef(50);
    const lastXRef = useRef(50);
    const holdingRef = useRef(false);
    const linesRef = useRef(0);
    const lightRef = useRef(1);
    const bellRef = useRef<BellState>('none');
    const stateRef = useRef<GameState>('idle');
    const bellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const failsRef = useRef(0);
    const bellAtRef = useRef(0);

    useEffect(() => {
        failsRef.current = fails;
    }, [fails]);

    useEffect(() => {
        bellRef.current = bell;
    }, [bell]);
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    const clearTimers = useCallback(() => {
        if (bellTimer.current) clearTimeout(bellTimer.current);
        if (prayTimer.current) clearTimeout(prayTimer.current);
        bellTimer.current = null;
        prayTimer.current = null;
    }, []);

    const fail = useCallback(
        (kind: 'dark' | 'abbot') => {
            if (stateRef.current !== 'playing') return;
            sounds.play('incorrect');
            holdingRef.current = false;
            clearTimers();
            setBell('none');
            setFails((f) => f + 1);
            setGameState(kind);
        },
        [sounds, clearTimers]
    );

    const disobedience = useMeter({
        drainPerSecond: 0.05,
        overloadAt: 1,
        recoverTo: 0.4,
        onOverload: () => fail('abbot'),
    });

    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => fail('dark'),
    });

    // Dagslyset speiles til en ref som scenen leser per frame.
    const lightRatio = Math.max(0, Math.min(1, clock.remaining / TIME_LIMIT));
    useEffect(() => {
        lightRef.current = lightRatio;
    }, [lightRatio]);

    const win = useCallback(() => {
        sounds.play('complete');
        clearTimers();
        setBell('none');
        setGameState('won');
        setBanner(null);
        onComplete({ score: Math.max(0.4, 1 - failsRef.current * 0.15), completed: true });
    }, [sounds, clearTimers, onComplete]);

    // Kjernemekanikken: bare bevegelse mot høyre mens pennen holdes nede teller.
    const handleAim = useCallback(
        (xPct: number) => {
            const prev = lastXRef.current;
            lastXRef.current = xPct;
            aimXRef.current = xPct;
            if (stateRef.current !== 'playing' || !holdingRef.current) return;
            const dx = xPct - prev;
            if (dx <= 0) return;

            if (bellRef.current === 'ringing') {
                // Eleven får et lite øyeblikk på seg til å løfte pennen. Skriver
                // hen videre etter det, er det ulydighet - og den koster fort.
                if (Date.now() - bellAtRef.current > BELL_GRACE_MS) {
                    disobedience.add(dx * 0.011);
                }
                return;
            }
            if (bellRef.current === 'praying') return;

            const speed = 0.42 + 0.58 * lightRef.current;
            chargeRef.current += (dx * speed) / SWEEP_PER_LINE;
            if (chargeRef.current >= 1) {
                chargeRef.current = 0;
                linesRef.current += 1;
                setLinesDone(linesRef.current);
                if (linesRef.current >= LINES) {
                    win();
                } else {
                    sounds.play('correct');
                }
            }
        },
        [disobedience, sounds, win]
    );

    const handleHold = useCallback((holding: boolean) => {
        holdingRef.current = holding;
    }, []);

    const missBell = useCallback(() => {
        if (stateRef.current !== 'playing' || bellRef.current !== 'ringing') return;
        disobedience.add(0.34);
        setBell('none');
        setBanner('Du overhørte bjella. Abbeden merket seg det.');
        setTimeout(() => setBanner(null), 2400);
    }, [disobedience]);

    const ringBell = useCallback(() => {
        if (stateRef.current !== 'playing' || bellRef.current !== 'none') return;
        sounds.play('sceneChange');
        bellAtRef.current = Date.now();
        setBell('ringing');
        setBanner('Bjella ringer. Legg fra deg pennen og gå til bønn!');
        bellTimer.current = setTimeout(missBell, BELL_ANSWER_MS);
    }, [sounds, missBell]);

    useRandomPulse({
        running: gameState === 'playing' && bell === 'none',
        minDelayMs: 15000,
        maxDelayMs: 21000,
        onPulse: ringBell,
    });

    const goToPrayer = useCallback(() => {
        if (bellRef.current !== 'ringing') return;
        if (bellTimer.current) clearTimeout(bellTimer.current);
        bellTimer.current = null;
        sounds.play('advance');
        setBell('praying');
        setBanner('Du er i kirken. Arbeidet må vente.');
        prayTimer.current = setTimeout(() => {
            setBell('none');
            setBanner(null);
        }, PRAYER_MS);
    }, [sounds]);

    const begin = useCallback(() => {
        clearTimers();
        chargeRef.current = 0;
        linesRef.current = 0;
        holdingRef.current = false;
        aimXRef.current = 50;
        lastXRef.current = 50;
        lightRef.current = 1;
        disobedience.reset();
        clock.restart();
        setLinesDone(0);
        setBell('none');
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        setBanner('Dra pennen mot høyre, om og om igjen, til linja er full.');
        setTimeout(() => setBanner(null), 3400);
    }, [clearTimers, disobedience, clock, sounds]);

    const resetAll = useCallback(() => {
        clearTimers();
        setGameState('idle');
        setBell('none');
        setBanner(null);
        setLinesDone(0);
        linesRef.current = 0;
        chargeRef.current = 0;
        holdingRef.current = false;
        disobedience.reset();
    }, [clearTimers, disobedience]);

    useEffect(() => clearTimers, [clearTimers]);

    // Selvspill-krok (kun i DEV): lar en Playwright-bot lese nøyaktig det eleven
    // ser på skjermen, så balansen kan verifiseres maskinelt.
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        (window as unknown as { __scriptorietDebug?: unknown }).__scriptorietDebug = {
            state: gameState,
            bell,
            linesDone,
            disobedience: disobedience.value,
        };
    }, [gameState, bell, linesDone, disobedience.value]);

    const score = Math.max(0.4, 1 - fails * 0.15);
    const writable = gameState === 'playing' && bell === 'none';

    return (
        <MicroGameScaffold
            title="Skriveverkstedet"
            subtitle="Kopier siden ferdig før dagslyset dør - og slipp alt når bjella ringer"
            estimatedSeconds={170}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 1.52, 1.55] as [number, number, number], fov: 60 },
                background: '#c9c0ad',
                fog: { color: '#c9c0ad', near: 9, far: 22 },
                sunPosition: [-2, 4, 2] as [number, number, number],
                sunIntensity: 0.4,
                ambientIntensity: 0.5,
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#ded3bd] to-[#b9ae9a]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Linjer', value: `${linesDone} / ${LINES}` },
                                { label: 'Dagslys', value: Math.round(lightRatio * 100), unit: '%' },
                            ]}
                        />
                    )}
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Til skumring"
                            warnBelow={18}
                            corner="br"
                        />
                    )}
                    <DragHint show={gameState === 'idle'} corner="bc">
                        Hold inne og dra mot høyre
                    </DragHint>
                </>
            }
            scene={
                <ScriptoriumScene
                    key={attempt}
                    playing={gameState === 'playing'}
                    light={lightRatio}
                    linesDone={linesDone}
                    chargeRef={chargeRef}
                    aimXRef={aimXRef}
                    bell={bell}
                    writable={writable}
                    onAim={handleAim}
                    onHold={handleHold}
                    onPray={goToPrayer}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Du er munk i skriveverkstedet. Hold inne museknappen og dra pennen mot
                        høyre, igjen og igjen, til linja er full. Seks linjer skal kopieres før sola
                        går ned - og hver gang bjella ringer, må du slippe alt og gå til bønn.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-800 transition shadow"
                    >
                        Dypp pennen i blekket
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={disobedience.value}
                    label="Ulydighet"
                    hint="Skriver du videre mens bjella ringer, eller overhører den, stiger den. Blir den full, sender abbeden deg ut."
                    labels={{ normal: 'Lydig', warn: 'Abbeden ser deg', danger: 'UT AV SALEN!' }}
                />
            )}

            {gameState === 'dark' && (
                <LoseScreen title="Det ble mørkt før siden var ferdig" onRetry={begin}>
                    Munkene skrev i dagslys. Åpen ild var forbudt i et rom fullt av tørt pergament,
                    så når sola gikk ned, stanset arbeidet. Prøv igjen, og dra pennen raskere mens
                    lyset er godt.
                </LoseScreen>
            )}

            {gameState === 'abbot' && (
                <LoseScreen title="Abbeden sendte deg ut av skriveverkstedet" onRetry={begin}>
                    Lydighet var en av grunnreglene i klosteret. Når bjella kalte til bønn, skulle
                    alt legges fra seg med én gang - også en linje man var midt inne i. Prøv igjen,
                    og gå til bønn så snart du hører bjella.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title="Siden er ferdig kopiert"
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Du brukte drøyt ett minutt på seks linjer. En hel bok kunne ta et år. Slik ble
                    bøkene fra antikken reddet: én linje av gangen, i dagslys, mellom åtte
                    bønnetider i døgnet.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default Scriptoriet3D;
