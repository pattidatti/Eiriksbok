import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    WaterMaterial,
    Rock,
    Tree,
    Particles,
    useMeter,
    useGameClock,
    useShake,
    useAmbience,
    MeterBar,
    TimerPill,
    DangerVignette,
    ScreenFlash,
    DataReadout,
    SceneBanner,
    LoseScreen,
    WinScreen,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne (wu wei): du er et blad på ei elv. Strømdraget svinger, og
// den korteste linja ned er ikke den rette. Padler du hele veien, sliter du deg
// ut før du når havet. Driver du helt uten å ta i, blir du liggende i
// stillevannet. Wu wei er det tredje valget: få og godt timede tak som setter
// deg tilbake i draget, og så slippe og la kraften som alt finnes gjøre jobben.

const START_Z = 20;
const FLOW_START_Z = 13;
const SEA_Z = -30;
const WATER_Y = 0.06;
const EYE_Y = 2.8; // kamerahøyde over vannflata - lavt nok til innlevelse,
// høyt nok til at eleven ser draget svinge foran seg
const RIVER_HALF = 6.4;

const CHANNEL_AMP = 3.0;
const CHANNEL_K = 0.2;
const CHANNEL_HALF = 1.6;

const DRIFT_SPEED = 3.6; // fart midt i strømdraget, uten å ta i
const SLACK_SPEED = 0.5; // fart i stillevannet langs breddene
const PRESS_BOOST = 1.5;
const LAT_PULL = 2.2; // strømmen trekker deg selv tilbake mot draget
const LAT_PRESS = 4.6; // hvor fort du kan styre når du padler
const PRESS_BASE = 0.13; // slit per sekund når du padler MED strømmen
const PRESS_FIGHT = 0.45; // ... og tillegget når du padler mot den
const ROCK_COST = 0.1;
const ROCK_PUSH = 4.2; // hvor langt ut av draget en stein slenger deg
const STUN_SECONDS = 3.0; // ... og hvor lenge du henger fast etterpå
const STUN_FACTOR = 0.15;
const TIME_LIMIT = 22;

type GameState = 'idle' | 'playing' | 'spent' | 'late' | 'won';

// Strømdraget: veien elva allerede har laget. Ren funksjon på modulnivå, slik
// at både scenen og logikken leser samme sannhet.
function channelX(z: number) {
    return CHANNEL_AMP * Math.sin((FLOW_START_Z - z) * CHANNEL_K);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Hvor mye av draget du får med deg: 1 midt i, fallende ut mot stillevannet.
function flowFactor(x: number, z: number) {
    const off = Math.abs(x - channelX(z));
    if (off <= CHANNEL_HALF) return 1;
    return clamp(1 - (off - CHANNEL_HALF) / 3.4, 0, 1);
}

// Steiner to steder. LANE_ROCKS står midt i draget: dem må du styre unna, og
// det er derfor ren passivitet ikke holder. TRAP_ROCKS ligger i stillevannet
// midt på elva, nettopp der den «korteste» rette linja ned ville gått.
const LANE_SPEC: [number, number, number][] = [
    [9, 0.3, 1.2],
    [4, -0.4, 1.1],
    [-1, 0.4, 1.3],
    [-6, -0.3, 1.1],
    [-11, 0.4, 1.2],
    [-16, -0.4, 1.1],
    [-21, 0.3, 1.3],
    [-26, -0.3, 1.1],
];
// Absolutt x (ikke i forhold til draget) - plassert der draget svinger unna.
const TRAP_SPEC: [number, number, number][] = [
    [5.2, 0.2, 1.2],
    [-10.6, -0.2, 1.3],
    [-26.3, 0.3, 1.1],
    [-2.5, 3.6, 1.0],
    [-18.4, -3.6, 1.0],
    [7, -3.9, 1.0],
];

const ROCKS = [
    ...LANE_SPEC.map(([z, off, sc]) => ({ x: clamp(channelX(z) + off, -5.2, 5.2), z, s: sc })),
    ...TRAP_SPEC.map(([z, x, sc]) => ({ x, z, s: sc })),
].map((r) => ({ ...r, hit: 0.5 * r.s + 0.6 }));

// Strømdraget tegnet som overlappende flate sirkler. Sirkler er
// rotasjonssymmetriske, så de kan ikke havne feil vei.
const RIBBON = Array.from({ length: 36 }, (_, i) => {
    const z = FLOW_START_Z - i * 1.2;
    return { z, x: channelX(z) };
});

function CurrentRibbon() {
    return (
        <group>
            {RIBBON.map((p, i) => (
                <mesh
                    key={i}
                    position={[p.x, WATER_Y + 0.03, p.z]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <circleGeometry args={[CHANNEL_HALF + 0.35, 16]} />
                    <meshBasicMaterial
                        color="#d8f0ff"
                        transparent
                        opacity={0.42}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Skumstriper som faktisk renner nedover draget: verdenen beveger seg enten
// eleven gjør noe eller ikke.
const FOAM_COUNT = 16;

function FoamStreaks() {
    const group = useRef<THREE.Group>(null);
    const zs = useRef<number[]>(
        Array.from({ length: FOAM_COUNT }, (_, i) => FLOW_START_Z - (i * 43) / FOAM_COUNT)
    );

    useFrame((_, dt) => {
        const g = group.current;
        if (!g) return;
        for (let i = 0; i < zs.current.length; i++) {
            let z = zs.current[i] - dt * DRIFT_SPEED * 1.15;
            if (z < SEA_Z) z = FLOW_START_Z;
            zs.current[i] = z;
            const child = g.children[i];
            if (child) {
                child.position.set(
                    channelX(z) + (i % 3 === 0 ? 0.7 : i % 3 === 1 ? -0.8 : 0),
                    WATER_Y + 0.05,
                    z
                );
            }
        }
    });

    return (
        <group ref={group}>
            {Array.from({ length: FOAM_COUNT }, (_, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.3, 2.2]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.85}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Kulisse: et gjel med elv. Breddene er brede mesh (holdes utenfor
// scene-auditens modellboks), åsene og furuene er dekor.
function Gorge() {
    return (
        <>
            {/* Elvebunnen under vannet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, -6]} receiveShadow>
                <planeGeometry args={[19, 58]} />
                <meshStandardMaterial color="#6d7b6a" roughness={1} />
            </mesh>

            {/* Vannflata */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y, -6]}>
                <planeGeometry args={[19, 58, 48, 64]} />
                <WaterMaterial
                    color="#5f9fc0"
                    waveHeight={0.07}
                    waveScale={0.9}
                    speed={1.4}
                    transparent
                    opacity={0.88}
                />
            </mesh>

            {/* Breddene: to lange rygger som holder elva inne */}
            {[-1, 1].map((side) => (
                <mesh key={side} position={[side * 9.6, 0.7, -6]} receiveShadow castShadow>
                    <boxGeometry args={[5.6, 1.5, 58]} />
                    <meshStandardMaterial color="#7d8a62" roughness={1} />
                </mesh>
            ))}

            {/* Dekor på breddene: furuer og ur. Ikke del av «modellen». */}
            <group userData={{ sceneAuditIgnore: true }}>
                {Array.from({ length: 16 }, (_, i) => {
                    const z = 18 - i * 3.3;
                    const side = i % 2 === 0 ? -1 : 1;
                    return (
                        <Tree
                            key={`t-${i}`}
                            position={[side * (9.2 + (i % 3) * 0.7), 1.45, z]}
                            leaf="#3c5f42"
                            seed={i}
                        />
                    );
                })}
                {Array.from({ length: 12 }, (_, i) => {
                    const z = 15 - i * 4.1;
                    const side = i % 2 === 0 ? 1 : -1;
                    return (
                        <Rock
                            key={`br-${i}`}
                            position={[side * (8.0 + (i % 2) * 0.6), 1.5, z]}
                            color="#8d9184"
                            scale={0.9 + (i % 3) * 0.3}
                        />
                    );
                })}
                {/* Fjell i horisonten nedstrøms */}
                {[-14, -5, 6, 15].map((x, i) => (
                    <mesh key={`m-${i}`} position={[x * 1.6, 4.5, -64 - (i % 2) * 8]}>
                        <coneGeometry args={[11 + i * 1.5, 14 + (i % 3) * 4, 6]} />
                        <meshStandardMaterial color="#8fa2ad" roughness={1} flatShading />
                    </mesh>
                ))}
                {/* Havet der elva ender */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y - 0.01, -52]}>
                    <planeGeometry args={[110, 48]} />
                    <meshStandardMaterial color="#4f8fb2" roughness={0.35} />
                </mesh>
            </group>
        </>
    );
}

interface SceneProps {
    gameState: GameState;
    attempt: number;
    bumps: number;
    posRef: React.MutableRefObject<[number, number, number]>;
    pressRef: React.MutableRefObject<boolean>;
    steerRef: React.MutableRefObject<number>;
    isPressing: boolean;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
    strainAdd: (amount: number) => void;
    onRock: () => void;
    onSea: () => void;
}

function RiverScene({
    gameState,
    attempt,
    bumps,
    posRef,
    pressRef,
    steerRef,
    isPressing,
    onAim,
    onHoldChange,
    strainAdd,
    onRock,
    onSea,
}: SceneProps) {
    // Scenen remountes per forsøk (key={attempt}), så refs nullstiller seg selv.
    void attempt;
    // useShake kaller useFrame og MÅ derfor bo inne i canvas-treet.
    const { ref: shakeRef, shake } = useShake(0.18, 0.04, 2.2);
    useEffect(() => {
        if (bumps > 0) shake(0.7);
    }, [bumps, shake]);
    const hitRef = useRef<boolean[]>(ROCKS.map(() => false));
    const stunRef = useRef(0);
    const doneRef = useRef(false);
    const onRockRef = useRef(onRock);
    const onSeaRef = useRef(onSea);
    const strainRef = useRef(strainAdd);
    useEffect(() => {
        onRockRef.current = onRock;
    }, [onRock]);
    useEffect(() => {
        onSeaRef.current = onSea;
    }, [onSea]);
    useEffect(() => {
        strainRef.current = strainAdd;
    }, [strainAdd]);

    useFrame((_, dt) => {
        if (gameState !== 'playing') return;
        const p = posRef.current;
        const pressing = pressRef.current;

        // Sidelengs. Slipper du taket, gjør strømmen jobben: den trekker deg
        // selv inn mot draget. Padler du, styrer du dit pekeren er - og da kan
        // du både unngå en stein og rote deg ut av draget.
        const target = pressing
            ? clamp(steerRef.current, -RIVER_HALF, RIVER_HALF)
            : channelX(p[2]);
        const lat = pressing ? LAT_PRESS : LAT_PULL;
        const dx = target - p[0];
        const stepX = clamp(dx, -lat * dt, lat * dt);
        const nx = clamp(p[0] + stepX, -RIVER_HALF, RIVER_HALF);

        // Framover: elva bærer deg. Full fart midt i draget, nesten stille
        // langs breddene. Padling gir et lite påslag - og koster slit.
        const f = flowFactor(nx, p[2]);
        let speed = SLACK_SPEED + (DRIFT_SPEED - SLACK_SPEED) * f;
        if (pressing) {
            speed += PRESS_BOOST;
            // Kjernen i spillet: å styre MED strømmen koster nesten ingenting.
            // Å padle mot den, ute i stillevannet, sliter deg ut fort.
            strainRef.current(dt * (PRESS_BASE + PRESS_FIGHT * (1 - f)));
        }
        // Etter et sammenstøt henger du fast en liten stund.
        if (stunRef.current > 0) {
            stunRef.current = Math.max(0, stunRef.current - dt);
            speed *= STUN_FACTOR;
        }
        const nz = p[2] - speed * dt;
        posRef.current = [nx, p[1], nz];

        // Steinene i stillevannet
        for (let i = 0; i < ROCKS.length; i++) {
            if (hitRef.current[i]) continue;
            const r = ROCKS[i];
            const ddx = nx - r.x;
            const ddz = nz - r.z;
            if (ddx * ddx + ddz * ddz < r.hit * r.hit) {
                hitRef.current[i] = true;
                const away = nx >= r.x ? 1 : -1;
                posRef.current = [
                    clamp(nx + away * ROCK_PUSH, -RIVER_HALF, RIVER_HALF),
                    p[1],
                    nz,
                ];
                stunRef.current = STUN_SECONDS;
                strainRef.current(ROCK_COST);
                onRockRef.current();
            }
        }

        if (import.meta.env.DEV) {
            (window as unknown as Record<string, unknown>).__vannetsVeiDebug = {
                x: nx,
                z: nz,
                channel: channelX(nz),
                flow: flowFactor(nx, nz),
                toSea: nz - SEA_Z,
                rocks: ROCKS.map((r) => [r.x, r.z]),
            };
        }

        if (!doneRef.current && nz <= SEA_Z) {
            doneRef.current = true;
            onSeaRef.current();
        }
    });

    // Etter seieren: stig opp og se elva munne ut i havet.
    useFrame((_, dt) => {
        if (gameState !== 'won') return;
        const p = posRef.current;
        const k = Math.min(1, dt * 0.9);
        posRef.current = [
            p[0] + (0 - p[0]) * k,
            p[1] + (8.5 - p[1]) * k,
            p[2] + (SEA_Z + 7 - p[2]) * k,
        ];
    });

    return (
        <>
            <PovCamera
                positionRef={posRef}
                lookAhead={gameState === 'won' ? [0, -5.5, -13] : [0, -2.4, -9]}
                moving={gameState === 'playing' && isPressing}
                bob={0.035}
                sway={0.016}
            />
            <AimPlane
                enabled={gameState === 'playing'}
                followCamera
                onAim={onAim}
                onHoldChange={onHoldChange}
            />

            <group ref={shakeRef}>
                <Gorge />
                <CurrentRibbon />
                <FoamStreaks />

                {ROCKS.map((r, i) => (
                    <Rock
                        key={`r-${i}`}
                        position={[r.x, WATER_Y + 0.08 * r.s, r.z]}
                        color="#7e8489"
                        scale={r.s}
                    />
                ))}
            </group>

            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="motes" area={[18, 46]} center={[0, 0, -6]} height={5} />
            </group>
        </>
    );
}

// ---- Hovedelement ----

const VannetsVei3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const river = useAmbience('waves', -28);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [isPressing, setIsPressing] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [bump, setBump] = useState(0);
    const [left, setLeft] = useState(Math.round(START_Z - SEA_Z));
    const [inFlow, setInFlow] = useState(false);

    const posRef = useRef<[number, number, number]>([0, WATER_Y + EYE_Y, START_Z]);
    const pressRef = useRef(false);
    const steerRef = useRef(0);
    const stateRef = useRef<GameState>('idle');
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    const fail = useCallback(
        (kind: 'spent' | 'late') => {
            if (stateRef.current !== 'playing') return;
            sounds.play('incorrect');
            pressRef.current = false;
            setIsPressing(false);
            setFails((f) => f + 1);
            setGameState(kind);
        },
        [sounds]
    );

    const strain = useMeter({
        drainPerSecond: 0.26,
        overloadAt: 1,
        recoverTo: 0.45,
        onOverload: () => fail('spent'),
    });
    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => fail('late'),
    });

    const handleAim = useCallback((xPct: number) => {
        steerRef.current = ((xPct - 50) / 50) * RIVER_HALF;
    }, []);

    const handleHold = useCallback((holding: boolean) => {
        pressRef.current = holding;
        setIsPressing(holding);
    }, []);

    // DEV: eksponer slitet for selvspill-verifisering av balansen.
    useEffect(() => {
        if (import.meta.env.DEV) {
            (window as unknown as Record<string, unknown>).__vannetsVeiStrain = strain.value;
        }
    }, [strain.value]);

    // Avlesninger ~5 Hz, ikke per frame.
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            const p = posRef.current;
            setLeft(Math.max(0, Math.round(p[2] - SEA_Z)));
            setInFlow(flowFactor(p[0], p[2]) > 0.75);
        }, 200);
        return () => clearInterval(t);
    }, [gameState]);

    const begin = useCallback(() => {
        posRef.current = [0, WATER_Y + EYE_Y, START_Z];
        pressRef.current = false;
        steerRef.current = 0;
        strain.reset();
        clock.restart();
        setIsPressing(false);
        setBump(0);
        setLeft(Math.round(START_Z - SEA_Z));
        setInFlow(false);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        river.start();
        setBanner('Slipp taket, så bærer elva deg. Hold inne bare for å styre unna en stein.');
        setTimeout(() => setBanner(null), 3400);
    }, [strain, clock, sounds, river]);

    const handleRock = useCallback(() => {
        sounds.play('incorrect');
        setBump((b) => b + 1);
        setBanner('Stein! Ute av draget ligger de tett.');
        setTimeout(() => setBanner(null), 1800);
    }, [sounds]);

    const score = Math.max(0.4, 1 - fails * 0.15);

    const handleSea = useCallback(() => {
        sounds.play('complete');
        setBanner(null);
        setGameState('won');
        onComplete({ score: Math.max(0.4, 1 - fails * 0.15), completed: true });
    }, [sounds, onComplete, fails]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        strain.reset();
        pressRef.current = false;
        setIsPressing(false);
        river.stop();
    }, [strain, river]);

    return (
        <MicroGameScaffold
            title="Vannets vei"
            subtitle="Du er et blad på ei elv. Finn draget elva allerede har laget - og spar på kreftene."
            estimatedSeconds={160}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: {
                    position: [0, WATER_Y + EYE_Y, START_Z] as [number, number, number],
                    fov: 70,
                },
                background: '#cfe4ee',
                fog: { color: '#cfe4ee', near: 22, far: 62 },
                light: 'day',
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#cfe4ee] to-[#e6f1ea]"
            overlays={
                <>
                    <ScreenFlash trigger={bump} preset="damage" durationMs={150} />
                    <DangerVignette level={gameState === 'playing' ? strain.value : 0} />
                    <SceneBanner message={banner} wide />
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Til havet', value: left, unit: 'm' },
                                { label: 'Elva', value: inFlow ? 'I draget' : 'Stillevann' },
                            ]}
                        />
                    )}
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Før elva synker"
                            warnBelow={9}
                            corner="br"
                        />
                    )}
                    {gameState === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-white/75 text-slate-700 rounded-xl text-xs text-center max-w-sm leading-relaxed shadow">
                                Den lyse stripa er strømdraget. Den svinger - den rette linja
                                ned gjør den ikke.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <RiverScene
                    key={attempt}
                    gameState={gameState}
                    attempt={attempt}
                    bumps={bump}
                    posRef={posRef}
                    pressRef={pressRef}
                    steerRef={steerRef}
                    isPressing={isPressing}
                    onAim={handleAim}
                    onHoldChange={handleHold}
                    strainAdd={strain.add}
                    onRock={handleRock}
                    onSea={handleSea}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Slipper du taket, tar strømmen deg og holder deg i det lyse draget helt
                        av seg selv. Men det ligger steiner midt i draget. Hold inne museknappen
                        og styr med pekeren for å komme utenom dem. Å styre inne i draget koster
                        nesten ingenting. Å padle ute i stillevannet sliter deg ut fort.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-sky-700 text-white rounded-xl text-sm font-bold hover:bg-sky-800 transition shadow"
                    >
                        Slipp bladet på vannet
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={strain.value}
                    label="Slit"
                    hint="Å styre inne i draget koster nesten ingenting. Padler du ute i stillevannet, sliter du deg ut fort - slipp heller, så trekker elva deg tilbake."
                    labels={{ normal: 'Uthvilt', warn: 'Sliten', danger: 'UTSLITT!' }}
                />
            )}

            {gameState === 'spent' && (
                <LoseScreen title="Du padlet deg utslitt" onRetry={begin}>
                    Du padlet mot strømmen, ute i stillevannet, hele veien. Daodejing kaller dette
                    den harde veien: den ser sterk ut, men den tar slutt. Prøv igjen, og bruk taket
                    bare til korte styringer inne i draget. Havner du utenfor, slipp - da trekker
                    elva deg inn igjen gratis.
                </LoseScreen>
            )}

            {gameState === 'late' && (
                <LoseScreen title="Du kom ikke fram i tide" onRetry={begin}>
                    Wu wei betyr ikke å gjøre ingenting. Du tok ikke i én eneste gang, og da traff
                    du hver eneste stein som lå i draget. Hvert sammenstøt slang deg ut i
                    stillevannet. Du må fortsatt handle, bare mindre og i riktig øyeblikk.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={fails === 0 ? 'Du nådde havet - på første forsøk!' : 'Du nådde havet'}
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Du kom fortest fram da du sluttet å styre rett mot målet og la deg i veien
                    vannet alt hadde laget. Det er wu wei: ikke latskap, men få og godt timede tak.
                    Daodejing sier at ingenting i verden er mykere enn vann, og likevel er
                    ingenting bedre til å slite ned det harde.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default VannetsVei3D;
