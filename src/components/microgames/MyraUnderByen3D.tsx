import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Particles,
    Person,
    Building,
    Tower,
    useMeter,
    useGameClock,
    useCrosshair,
    Crosshair,
    DangerVignette,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    Burst,
    Impact,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: Sankt Petersburg ble ikke bygd på fast grunn. Peter valgte
// en myr, og derfor måtte hver eneste vegg stå på påler som var banket ned til
// fast bunn. Eleven kjenner selv at byen bare reiser seg når noen orker å slå
// pålene ned - og at mannskapet bryter sammen hvis du aldri lar dem hvile.

const CAM: [number, number, number] = [0, 2.4, 5.2];
const LOOK: [number, number, number] = [0, 0.7, -8.5];
const TIME_LIMIT = 85;

// Slitasjen stiger mens rambukken går, og synker når mannskapet får puste.
// Netto stigning under hamring er STRAIN_PER_SECOND minus STRAIN_DRAIN.
const STRAIN_PER_SECOND = 0.42;
const STRAIN_DRAIN = 0.16;

// Hvor langt pekeren kan være unna en påle og likevel velge den.
const PICK_RANGE = 3.4;
const AIM_HALF_WIDTH = 8;

interface Pile {
    id: number;
    x: number;
    z: number;
    // Sekunder med hamring som skal til før pålen står på fast bunn.
    need: number;
    // Huset som reiser seg oppå pålen.
    body: string;
    roof: string;
    w: number;
    h: number;
}

const PILES: Pile[] = [
    { id: 0, x: -5.8, z: -5.2, need: 3.0, body: '#d8c9a8', roof: '#8a4a35', w: 1.9, h: 1.5 },
    { id: 1, x: -3.0, z: -7.4, need: 4.0, body: '#cdd7dd', roof: '#6a7f8c', w: 2.1, h: 1.8 },
    { id: 2, x: 0.1, z: -9.0, need: 4.5, body: '#e3d3b0', roof: '#7c5a3a', w: 2.4, h: 2.1 },
    { id: 3, x: 3.1, z: -7.4, need: 4.0, body: '#d3c2c6', roof: '#8a5b52', w: 2.1, h: 1.8 },
    { id: 4, x: 5.9, z: -5.2, need: 2.5, body: '#d8cfb4', roof: '#7a6440', w: 1.9, h: 1.4 },
];

const TOTAL_HAMMER = PILES.reduce((s, p) => s + p.need, 0);

// Sivtuster og myrhauger. Faste posisjoner - ingen Math.random i render.
const REEDS: [number, number, number][] = [
    [-9.4, -3.2, 0.9],
    [-7.8, -10.4, 1.1],
    [-4.8, -2.4, 0.8],
    [-1.6, -12.2, 1.0],
    [1.9, -3.0, 0.85],
    [5.1, -11.6, 1.15],
    [8.6, -8.4, 0.95],
    [9.8, -2.2, 1.05],
    [-10.2, -13.8, 1.0],
    [3.0, -15.4, 0.9],
    [-6.0, -16.6, 1.1],
    [7.4, -16.2, 0.95],
];

// Grunne vanndammer på myra. Dekor, ikke del av modellen revisjonen måler.
const POOLS: [number, number, number][] = [
    [-8.0, -3.4, 1.5],
    [-1.5, -3.2, 1.1],
    [4.6, -3.6, 1.3],
    [8.6, -7.2, 1.4],
    [-7.4, -11.0, 1.6],
    [1.2, -12.4, 1.8],
];

// Én påle: en tømmerstokk som synker mens rambukken slår, og et hus som
// reiser seg oppå steinfundamentet når pålen står på fast bunn.
function PileSite({
    pile,
    progressRef,
    active,
    done,
}: {
    pile: Pile;
    progressRef: React.MutableRefObject<number[]>;
    active: boolean;
    done: boolean;
}) {
    const log = useRef<THREE.Mesh>(null);
    const stone = useRef<THREE.Group>(null);
    const house = useRef<THREE.Group>(null);
    const ring = useRef<THREE.Mesh>(null);

    useFrame((_, delta) => {
        const dt = Math.min(0.05, delta);
        const ratio = Math.min(1, progressRef.current[pile.id] / pile.need);
        // Toppen av stokken går fra 3.0 til 0.6 mens den bankes ned.
        const topY = 3.0 - ratio * 2.4;
        if (log.current) {
            log.current.position.y = damp(log.current.position.y, topY - 1.7, dt, 9);
        }
        if (stone.current) {
            const target = done ? 0 : -0.75;
            stone.current.position.y = damp(stone.current.position.y, target, dt, 5);
        }
        if (house.current) {
            const target = done ? 0.5 : -2.6;
            house.current.position.y = damp(house.current.position.y, target, dt, 3.4);
        }
        if (ring.current) {
            const s = active && !done ? 1 : 0.001;
            ring.current.scale.x = damp(ring.current.scale.x, s, dt, 10);
            ring.current.scale.y = damp(ring.current.scale.y, s, dt, 10);
        }
    });

    return (
        <group position={[pile.x, 0, pile.z]}>
            {/* Markering av det aktive arbeidsstedet - ligger flatt på myra */}
            <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <ringGeometry args={[1.25, 1.55, 24]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} />
            </mesh>

            {/* Tømmerpålen. Bunnen ligger under bakken - den bankes jo ned. */}
            <mesh ref={log} position={[0, 1.3, 0]} castShadow>
                <cylinderGeometry args={[0.24, 0.2, 3.4, 10]} />
                <meshStandardMaterial color={done ? '#8a6a44' : '#a68050'} roughness={0.95} />
            </mesh>

            {/* Steinfundamentet som kommer opp når pålen står på fast bunn */}
            <group ref={stone} position={[0, -0.75, 0]}>
                <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
                    <boxGeometry args={[pile.w + 0.5, 0.5, pile.w + 0.5]} />
                    <meshStandardMaterial color="#b9b3a4" roughness={1} />
                </mesh>
            </group>

            {/* Huset. Står PÅ steinen (y = 0.5) når det er ferdig reist. */}
            <group ref={house} position={[0, -2.6, 0]}>
                <Building
                    position={[0, 0, 0]}
                    body={pile.body}
                    roof={pile.roof}
                    w={pile.w}
                    h={pile.h}
                    d={pile.w * 0.85}
                />
            </group>
        </group>
    );
}

// Rambukken: en ramme med et tungt lodd som løftes og slippes. Den flytter seg
// bort til pålen eleven sikter på.
function PileDriver({
    targetRef,
    hammeringRef,
    onStrike,
}: {
    targetRef: React.MutableRefObject<[number, number, number]>;
    hammeringRef: React.MutableRefObject<boolean>;
    onStrike: (x: number, z: number) => void;
}) {
    const rig = useRef<THREE.Group>(null);
    const weight = useRef<THREE.Mesh>(null);
    const phase = useRef(0);
    const wasDown = useRef(false);

    useFrame((_, delta) => {
        const dt = Math.min(0.05, delta);
        const t = targetRef.current;
        if (rig.current) {
            rig.current.position.x = damp(rig.current.position.x, t[0], dt, 6);
            rig.current.position.z = damp(rig.current.position.z, t[2], dt, 6);
        }
        if (!weight.current) return;
        if (hammeringRef.current) {
            phase.current += dt * 3.4;
            // Loddet løftes rolig og faller raskt - som en ekte rambukk.
            const cycle = phase.current % 1;
            const lift = cycle < 0.72 ? cycle / 0.72 : 1 - (cycle - 0.72) / 0.28;
            const y = 1.5 + lift * 2.1;
            const down = y < 1.75;
            if (down && !wasDown.current) onStrike(t[0], t[2]);
            wasDown.current = down;
            weight.current.position.y = y;
        } else {
            phase.current = 0;
            wasDown.current = false;
            weight.current.position.y = damp(weight.current.position.y, 3.5, dt, 5);
        }
    });

    return (
        <group ref={rig} position={[0, 0, -8]}>
            {[-0.95, 0.95].map((x) => (
                <mesh key={x} position={[x, 2.3, 0]} castShadow>
                    <boxGeometry args={[0.22, 4.6, 0.22]} />
                    <meshStandardMaterial color="#6f5537" roughness={0.95} />
                </mesh>
            ))}
            <mesh position={[0, 4.65, 0]} castShadow>
                <boxGeometry args={[2.3, 0.26, 0.26]} />
                <meshStandardMaterial color="#6f5537" roughness={0.95} />
            </mesh>
            <mesh ref={weight} position={[0, 3.5, 0]} castShadow>
                <boxGeometry args={[0.95, 0.7, 0.95]} />
                <meshStandardMaterial color="#4b5563" metalness={0.25} roughness={0.7} />
            </mesh>
        </group>
    );
}

type GameState = 'idle' | 'playing' | 'utslitt' | 'flom' | 'won';

function MarshScene({
    gameState,
    progressRef,
    activeId,
    doneIds,
    driverTargetRef,
    hammeringRef,
    onAim,
    onHoldChange,
    onStrike,
    onTick,
}: {
    gameState: GameState;
    progressRef: React.MutableRefObject<number[]>;
    activeId: number | null;
    doneIds: number[];
    driverTargetRef: React.MutableRefObject<[number, number, number]>;
    hammeringRef: React.MutableRefObject<boolean>;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
    onStrike: (x: number, z: number) => void;
    onTick: (dt: number) => void;
}) {
    const onTickRef = useRef(onTick);
    useEffect(() => {
        onTickRef.current = onTick;
    }, [onTick]);

    useFrame((_, delta) => {
        onTickRef.current(Math.min(0.05, delta));
    });

    const won = gameState === 'won';

    return (
        <>
            <PovCamera position={CAM} lookAt={LOOK} sway={0.015} />
            <AimPlane
                enabled={gameState === 'playing'}
                onAim={onAim}
                onHoldChange={onHoldChange}
                hideCursor
            />

            {/* Myra. Bredere enn 26 enheter, så den regnes som terreng. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]} receiveShadow>
                <planeGeometry args={[64, 60]} />
                <meshStandardMaterial color="#8d8a63" roughness={1} />
            </mesh>

            {/* Neva bakerst. Ligger langt bak alle landobjekter - ingen overlapp. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, -32]}>
                <planeGeometry args={[64, 22]} />
                <meshStandardMaterial color="#7ba3b8" roughness={0.35} metalness={0.1} />
            </mesh>

            {/* Sivtuster: atmosfære, ikke del av modellen scene-revisjonen måler */}
            <group userData={{ sceneAuditIgnore: true }}>
                {REEDS.map(([x, z, s], i) => (
                    <mesh key={i} position={[x, 0.34 * s, z]} rotation={[0, i * 0.7, 0]}>
                        <coneGeometry args={[0.4 * s, 0.68 * s, 6]} />
                        <meshStandardMaterial color="#7d8452" roughness={1} />
                    </mesh>
                ))}
                {POOLS.map(([x, z, r], i) => (
                    <mesh
                        key={`pool-${i}`}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[x, 0.02, z]}
                    >
                        <circleGeometry args={[r, 20]} />
                        <meshStandardMaterial color="#6f8b8f" roughness={0.3} metalness={0.15} />
                    </mesh>
                ))}
                <Particles preset="dust" area={[26, 22]} height={3.4} center={[0, 0, -7]} />
            </group>

            {PILES.map((p) => (
                <PileSite
                    key={p.id}
                    pile={p}
                    progressRef={progressRef}
                    active={activeId === p.id}
                    done={doneIds.includes(p.id)}
                />
            ))}

            <PileDriver
                targetRef={driverTargetRef}
                hammeringRef={hammeringRef}
                onStrike={onStrike}
            />

            {/* Arbeidslaget. Står på myra, foran pålerekka. */}
            <Person position={[-7.6, 0, -1.2]} pose="raise" body="#7a6a4f" hat="cap" />
            <Person position={[-3.4, 0, -0.4]} pose="idle" body="#8a7250" hat="cap" />
            <Person position={[3.6, 0, -0.5]} pose="raise" body="#6e6449" hat="cap" />
            <Person position={[7.7, 0, -1.3]} pose="idle" body="#7f6d52" hat="cap" />

            {/* Peter-Paulus-festningen reiser seg først når hele grunnen står */}
            {won && <Tower position={[0, 0, -15]} radius={1.1} height={5.4} color="#cfc7b4" roof="#c9a227" />}
        </>
    );
}

const MyraUnderByen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [doneIds, setDoneIds] = useState<number[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([0, 1.5, -8]);
    const [thud, setThud] = useState(0);
    const [thudPos, setThudPos] = useState<[number, number, number]>([0, 0.1, -8]);
    const [depthPct, setDepthPct] = useState(0);

    const progressRef = useRef<number[]>(PILES.map(() => 0));
    const doneRef = useRef<Set<number>>(new Set());
    const activeRef = useRef<number | null>(null);
    const aimXRef = useRef(0);
    const hammeringRef = useRef(false);
    const driverTargetRef = useRef<[number, number, number]>([0, 0, -8]);
    const gameStateRef = useRef<GameState>('idle');
    const failsRef = useRef(0);
    const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);
    useEffect(() => () => {
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
    }, []);

    const fail = useCallback(
        (kind: 'utslitt' | 'flom') => {
            if (gameStateRef.current !== 'playing') return;
            sounds.play('incorrect');
            hammeringRef.current = false;
            failsRef.current += 1;
            gameStateRef.current = kind;
            setFails(failsRef.current);
            setGameState(kind);
        },
        [sounds]
    );

    const strain = useMeter({
        drainPerSecond: STRAIN_DRAIN,
        overloadAt: 1,
        recoverTo: 0.3,
        onOverload: () => fail('utslitt'),
    });
    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => fail('flom'),
    });

    const aim = useCrosshair();

    const handleAim = useCallback(
        (xPct: number, yPct: number) => {
            aim.move(xPct, yPct);
            aimXRef.current = ((xPct - 50) / 50) * AIM_HALF_WIDTH;
        },
        [aim]
    );

    const handleHold = useCallback((holding: boolean) => {
        hammeringRef.current = holding;
    }, []);

    const handleStrike = useCallback(
        (x: number, z: number) => {
            setThudPos([x, 0.15, z]);
            setThud((t) => t + 1);
        },
        []
    );

    // All sanntidslogikk i én tick: velg påle, bank den ned, slit på mannskapet.
    const handleTick = useCallback(
        (dt: number) => {
            if (gameStateRef.current !== 'playing') return;

            // Nærmeste påle som ikke er ferdig, innenfor rekkevidde av pekeren.
            let best: Pile | null = null;
            let bestDist = PICK_RANGE;
            for (const p of PILES) {
                if (doneRef.current.has(p.id)) continue;
                const d = Math.abs(p.x - aimXRef.current);
                if (d < bestDist) {
                    bestDist = d;
                    best = p;
                }
            }
            const id = best ? best.id : null;
            if (id !== activeRef.current) {
                activeRef.current = id;
                setActiveId(id);
            }
            if (best) driverTargetRef.current = [best.x, 0, best.z];

            if (!best || !hammeringRef.current) return;

            strain.add(dt * STRAIN_PER_SECOND);
            progressRef.current[best.id] = Math.min(
                best.need,
                progressRef.current[best.id] + dt
            );
            if (progressRef.current[best.id] < best.need) return;

            doneRef.current.add(best.id);
            setDoneIds(Array.from(doneRef.current));
            if (bannerTimer.current) clearTimeout(bannerTimer.current);

            if (doneRef.current.size >= PILES.length) {
                // Seier: hele grunnen står, og byen kan reises. Først her slippes
                // rambukken - ellers glir eleven rett videre til neste påle.
                hammeringRef.current = false;
                // Trill rambukken bak husrekka, så den ikke står oppi et hus.
                driverTargetRef.current = [0, 0, -12.5];
                gameStateRef.current = 'won';
                sounds.play('complete');
                setBurstPos([0, 2.2, -9]);
                setBurst((b) => b + 1);
                setBanner(null);
                setGameState('won');
                onComplete({
                    score: Math.max(0.4, 1 - failsRef.current * 0.15),
                    completed: true,
                });
                return;
            }

            sounds.play('correct');
            setBanner('Pålen står på fast bunn. Huset kan reises.');
            bannerTimer.current = setTimeout(() => setBanner(null), 1900);
        },
        [strain, sounds, onComplete]
    );

    // Dybdemåleren og DEV-tilstanden speiles ~8 Hz, aldri per frame.
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            const sum = progressRef.current.reduce((a, b) => a + b, 0);
            setDepthPct(Math.round((sum / TOTAL_HAMMER) * 100));
            if (import.meta.env.DEV) {
                const w = window as unknown as Record<string, unknown>;
                w.__myraDebug = {
                    strain: strain.peek(),
                    piles: PILES.filter((p) => !doneRef.current.has(p.id)).map((p) => p.x),
                    aimHalfWidth: AIM_HALF_WIDTH,
                    done: doneRef.current.size,
                };
            }
        }, 125);
        return () => clearInterval(t);
    }, [gameState, strain]);

    const begin = useCallback(() => {
        progressRef.current = PILES.map(() => 0);
        doneRef.current = new Set();
        activeRef.current = null;
        aimXRef.current = 0;
        hammeringRef.current = false;
        driverTargetRef.current = [0, 0, -8];
        strain.reset();
        clock.restart();
        setDoneIds([]);
        setActiveId(null);
        setDepthPct(0);
        setAttempt((a) => a + 1);
        gameStateRef.current = 'playing';
        setGameState('playing');
        sounds.play('sceneChange');
        setBanner('Sikt med pekeren og hold inne for å slå. Slipp før mannskapet er utslitt.');
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setBanner(null), 4200);
    }, [strain, clock, sounds]);

    const resetAll = useCallback(() => {
        hammeringRef.current = false;
        strain.reset();
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        setBanner(null);
        gameStateRef.current = 'idle';
        setGameState('idle');
    }, [strain]);

    const score = Math.max(0.4, 1 - fails * 0.15);

    return (
        <MicroGameScaffold
            title="Byen på myra"
            subtitle="Nevadeltaet, 1703. Bank pålene ned til fast bunn før høstflommen kommer - og la mannskapet hvile innimellom."
            estimatedSeconds={150}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: CAM, fov: 60 },
                background: '#c9d6dc',
                fog: { color: '#d3dde1', near: 22, far: 60 },
                light: 'overcast',
            }}
            overlays={
                <>
                    <Crosshair
                        show={gameState === 'playing'}
                        crosshairRef={aim.ref}
                        variant="dot"
                    />
                    <DangerVignette level={gameState === 'playing' ? strain.value : 0} />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Byggesesong"
                            warnBelow={20}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Påler', value: `${doneIds.length}/${PILES.length}` },
                                { label: 'Nedbanket', value: depthPct, unit: '%' },
                            ]}
                        />
                    )}
                    <SceneBanner message={banner} wide />
                </>
            }
            scene={
                <>
                    <MarshScene
                        key={attempt}
                        gameState={gameState}
                        progressRef={progressRef}
                        activeId={activeId}
                        doneIds={doneIds}
                        driverTargetRef={driverTargetRef}
                        hammeringRef={hammeringRef}
                        onAim={handleAim}
                        onHoldChange={handleHold}
                        onStrike={handleStrike}
                        onTick={handleTick}
                    />
                    <Impact preset="dustPuff" trigger={thud} position={thudPos} />
                    <Burst position={burstPos} trigger={burst} color="#c9a227" />
                </>
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Tsar Peter har pekt på en myr i Nevadeltaet og sagt at her skal hovedstaden
                        ligge. Ingenting kan stå på bløt myr, så fem påler må bankes ned til fast
                        bunn først. Sikt med pekeren og hold inne museknappen for å slå. Slipp for
                        å la arbeidslaget hvile.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-800 transition shadow"
                    >
                        Sett rambukken i gang
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={strain.value}
                    label="Arbeidslaget"
                    hint="Slipp museknappen og la mannskapet puste før måleren er full."
                    labels={{ normal: 'Uthvilt', warn: 'Sliten', danger: 'Utslitt!' }}
                />
            )}

            {gameState === 'utslitt' && (
                <LoseScreen title="Arbeidslaget klarte ikke mer" onRetry={begin}>
                    Rundt 40 000 tvangsarbeidere ble sendt til myra, og tusenvis av dem døde av
                    sult og sykdom. Byen ble bygd av folk som ikke fikk hvile. Prøv igjen, og slipp
                    museknappen innimellom.
                </LoseScreen>
            )}

            {gameState === 'flom' && (
                <LoseScreen title="Høstflommen tok byggeplassen" onRetry={begin}>
                    Neva flommer over hver høst, og da står hele deltaet under vann. Bare sommeren
                    kunne brukes til å banke påler. Prøv igjen, og hold rambukken i gang så mye du
                    tør.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={
                        fails === 0
                            ? 'Grunnen står - på første forsøk!'
                            : 'Grunnen står, og byen kan reises'
                    }
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Sankt Petersburg ble grunnlagt i 1703 og sto ferdig i 1712, bygd på påler i en
                    myr av rundt 40 000 tvangsarbeidere. Peter fikk vinduet sitt mot vest. Regningen
                    ble betalt av folk som aldri fikk se byen ferdig.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default MyraUnderByen3D;
