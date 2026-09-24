import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Shoreline,
    Boat,
    Building,
    Fire,
    Smoke,
    Banner,
    FlatRing,
    Interactive,
    Hotspot,
    Explosion,
    Burst,
    useMeter,
    useRandomPulse,
    DangerVignette,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    faceAlong,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: Stalingrad ble ikke avgjort inne i byen. De sovjetiske
// forsvarerne skulle bare holde byen LENGE NOK, med forsterkninger fraktet
// over Volga, mens den store knipetangen ble bygd opp nord og sør for byen.
// Eleven holder liv i byen - og ser at det avgjørende skjer bak den.

const LANES = [-5, 0, 5];
const LANE_NAMES = ['Traktorfabrikken', 'Mamajev-haugen', 'Sentrum'];
const START_X = 9.5;
const LAND_X = 1.4;
const SPEED = 2.4;
const WATER_Y = 0.02;
const GAME_SECONDS = 70;
const RELIEF = 0.18;
const WARN_MS = 2000;
const HIT_RADIUS = 1.25;

type GameState = 'idle' | 'playing' | 'fallen' | 'won';
type FerryMode = 'ready' | 'out' | 'unload' | 'back' | 'sunk';

interface FerrySim {
    x: number;
    mode: FerryMode;
    halted: boolean;
    t: number;
}
interface FerryView {
    mode: FerryMode;
    halted: boolean;
}
interface Bomb {
    id: number;
    lane: number;
    x: number;
}
interface Hit {
    id: number;
    x: number;
    z: number;
}

const freshFerries = (): FerrySim[] =>
    LANES.map(() => ({ x: START_X, mode: 'ready', halted: false, t: 0 }));
const freshView = (): FerryView[] => LANES.map(() => ({ mode: 'ready', halted: false }));

// Kvadratisk Bézier i XZ-planet for de to armene i knipetangen.
type P2 = [number, number];
function bez(a: P2, b: P2, c: P2, t: number): P2 {
    const u = 1 - t;
    return [
        u * u * a[0] + 2 * u * t * b[0] + t * t * c[0],
        u * u * a[1] + 2 * u * t * b[1] + t * t * c[1],
    ];
}
const NORTH_ARM: [P2, P2, P2] = [
    [-3.5, -14],
    [-15, -13],
    [-15.5, -0.7],
];
const SOUTH_ARM: [P2, P2, P2] = [
    [-3.5, 14],
    [-15, 13],
    [-15.5, 0.7],
];
const ARM_MARKS = 16;

// Én arm av tangen: en rekke røde stridsvogn-klosser som vokser fram langs
// banen etter hvert som tiden går, med en pil i tuppen.
function PincerArm({ arm, progress }: { arm: [P2, P2, P2]; progress: number }) {
    const head = useRef<THREE.Group>(null);
    const shown = useRef(0);
    const marks = useMemo(
        () =>
            Array.from({ length: ARM_MARKS }, (_, i) => {
                const t = (i + 0.5) / ARM_MARKS;
                const p = bez(arm[0], arm[1], arm[2], t);
                const q = bez(arm[0], arm[1], arm[2], Math.min(1, t + 0.02));
                return { t, p, rot: faceAlong([q[0] - p[0], q[1] - p[1]]) };
            }),
        [arm]
    );
    useFrame((_, dt) => {
        shown.current = damp(shown.current, progress, dt, 3);
        const t = Math.max(0.02, Math.min(1, shown.current));
        const p = bez(arm[0], arm[1], arm[2], t);
        const q = bez(arm[0], arm[1], arm[2], Math.min(1, t + 0.02));
        const r = bez(arm[0], arm[1], arm[2], Math.max(0, t - 0.02));
        if (head.current) {
            head.current.position.set(p[0], 0, p[1]);
            head.current.rotation.y = faceAlong([q[0] - r[0], q[1] - r[1]]);
        }
    });
    return (
        <group>
            {marks.map((m, i) => (
                <mesh
                    key={i}
                    position={[m.p[0], 0.16, m.p[1]]}
                    rotation={[0, m.rot, 0]}
                    visible={progress >= m.t}
                    castShadow
                >
                    <boxGeometry args={[0.45, 0.32, 0.6]} />
                    <meshStandardMaterial color="#b91c1c" roughness={0.8} />
                </mesh>
            ))}
            <group ref={head}>
                {/* Pila ligger flatt og peker framover (+Z før rotasjon) */}
                <mesh position={[0, 0.2, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.55, 1.1, 3]} />
                    <meshStandardMaterial color="#dc2626" roughness={0.6} />
                </mesh>
            </group>
        </group>
    );
}

// Varselring på vannet der bomben kommer til å treffe.
function BombMarker({ x, z }: { x: number; z: number }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const s = 1 + Math.sin(clock.getElapsedTime() * 12) * 0.12;
        ref.current.scale.set(s, 1, s);
    });
    return (
        <group ref={ref} position={[x, 0, z]}>
            <FlatRing
                position={[0, WATER_Y + 0.04, 0]}
                radius={HIT_RADIUS}
                tube={0.09}
                color="#ef4444"
            />
            <FlatRing position={[0, WATER_Y + 0.04, 0]} radius={0.35} tube={0.07} color="#ef4444" />
        </group>
    );
}

// Et tysk fly som stuper over målet og er borte etter angrepet.
function Bomber({ x, z }: { x: number; z: number }) {
    const ref = useRef<THREE.Group>(null);
    const start = useRef(-1);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        if (start.current < 0) start.current = clock.getElapsedTime();
        const k = (clock.getElapsedTime() - start.current) / (WARN_MS / 1000);
        ref.current.position.set(x + 1.5, 7 - Math.min(k, 1) * 2.5, z - 14 + k * 14);
        ref.current.visible = k < 1.6;
    });
    return (
        <group ref={ref}>
            <mesh>
                <boxGeometry args={[0.3, 0.25, 1.6]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[0, 0.02, 0.1]}>
                <boxGeometry args={[2.2, 0.06, 0.45]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
        </group>
    );
}

// Den ødelagte byen langs vestbredden.
function RuinedCity() {
    const blocks = useMemo(() => {
        const out: { x: number; z: number; h: number; seed: number }[] = [];
        for (let i = 0; i < 18; i++) {
            const z = -8.5 + i;
            out.push({ x: -1.6 - (i % 3) * 1.1, z, h: 0.5 + ((i * 7) % 5) * 0.25, seed: i });
        }
        return out;
    }, []);
    return (
        <group>
            {blocks.map((b) => (
                <Building
                    key={b.seed}
                    position={[b.x, 0, b.z]}
                    w={0.9}
                    h={b.h}
                    d={0.8}
                    body="#8b8378"
                    roof="#5b554d"
                    seed={b.seed}
                />
            ))}
            <Fire position={[-2.4, 0, -3.5]} scale={0.7} />
            <Fire position={[-1.8, 0, 2.5]} scale={0.6} />
            <Smoke origin={[-2.4, 0.8, -3.5]} color="#5b5b5b" />
            <Smoke origin={[-2.8, 0.8, 6]} color="#6b6b6b" />
            {/* Sovjetiske landingsplasser ved elvebredden */}
            {LANES.map((z) => (
                <Banner key={z} position={[-0.6, 0, z + 0.9]} color="#b91c1c" height={1.4} />
            ))}
        </group>
    );
}

// Den tyske 6. armé vest for byen: grå klosser.
function GermanArmy() {
    const units = useMemo(() => {
        const out: [number, number][] = [];
        for (let i = 0; i < 22; i++) {
            const x = -5.5 - (i % 5) * 1.6;
            const z = -5 + Math.floor(i / 5) * 2.4 + (i % 2) * 0.6;
            out.push([x, z]);
        }
        return out;
    }, []);
    return (
        <group>
            {units.map(([x, z], i) => (
                <mesh key={i} position={[x, 0.15, z]} castShadow>
                    <boxGeometry args={[0.55, 0.3, 0.4]} />
                    <meshStandardMaterial color="#6b7280" roughness={0.85} />
                </mesh>
            ))}
        </group>
    );
}

interface SceneProps {
    gameState: GameState;
    progress: number;
    ferriesRef: React.MutableRefObject<FerrySim[]>;
    view: FerryView[];
    bombs: Bomb[];
    hits: Hit[];
    landings: number;
    lastLane: number;
    pressAdd: (v: number) => void;
    onTick: (t: number) => void;
    onFerryClick: (lane: number) => void;
    onModeChange: (lane: number, mode: FerryMode) => void;
    onLanded: (lane: number) => void;
}

function VolgaScene({
    gameState,
    progress,
    ferriesRef,
    view,
    bombs,
    hits,
    landings,
    lastLane,
    pressAdd,
    onTick,
    onFerryClick,
    onModeChange,
    onLanded,
}: SceneProps) {
    const groups = useRef<(THREE.Group | null)[]>([]);
    const timeRef = useRef(0);
    const tickRef = useRef(-1);
    const boatRot = useRef<(THREE.Group | null)[]>([]);

    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.25);
        const playing = gameState === 'playing';
        if (playing) {
            // All spilltid måles i samme takt som ferjene beveger seg, så presset,
            // klokka og ferjene alltid følger hverandre - også på trege maskiner.
            timeRef.current += dt;
            const prog = Math.min(1, timeRef.current / GAME_SECONDS);
            // Tyskerne presser hele tiden på, og hardere jo lenger det går.
            pressAdd(dt * (0.03 + 0.03 * prog));
            const tick = Math.floor(timeRef.current * 10);
            if (tick !== tickRef.current) {
                tickRef.current = tick;
                onTick(timeRef.current);
            }
        }
        ferriesRef.current.forEach((f, i) => {
            if (playing) {
                if (f.mode === 'out' && !f.halted) {
                    f.x -= SPEED * dt;
                    if (f.x <= LAND_X) {
                        f.x = LAND_X;
                        f.mode = 'unload';
                        f.t = 0;
                        onModeChange(i, 'unload');
                        onLanded(i);
                    }
                } else if (f.mode === 'unload') {
                    f.t += dt;
                    if (f.t > 1.0) {
                        f.mode = 'back';
                        onModeChange(i, 'back');
                    }
                } else if (f.mode === 'back' && !f.halted) {
                    f.x += SPEED * 1.15 * dt;
                    if (f.x >= START_X) {
                        f.x = START_X;
                        f.mode = 'ready';
                        onModeChange(i, 'ready');
                    }
                } else if (f.mode === 'sunk') {
                    f.t += dt;
                    if (f.t > 5) {
                        f.x = START_X;
                        f.mode = 'ready';
                        f.halted = false;
                        f.t = 0;
                        onModeChange(i, 'ready');
                    }
                }
            }
            const g = groups.current[i];
            if (g) {
                g.position.x = f.x;
                const sinkY = f.mode === 'sunk' ? -Math.min(f.t, 1.6) * 0.5 : 0;
                g.position.y = WATER_Y + sinkY;
                g.rotation.z = f.mode === 'sunk' ? Math.min(f.t, 1.6) * 0.25 : 0;
            }
            const r = boatRot.current[i];
            if (r) {
                r.rotation.y = f.mode === 'back' ? faceAlong([1, 0]) : faceAlong([-1, 0]);
            }
        });
        if (import.meta.env.DEV) {
            (window as unknown as Record<string, unknown>).__volgaDebug = {
                ferries: ferriesRef.current.map((f) => ({
                    x: f.x,
                    mode: f.mode,
                    halted: f.halted,
                })),
                bombs: bombs.map((b) => ({ lane: b.lane, x: b.x })),
            };
        }
    });

    const won = gameState === 'won';

    return (
        <>
            <Shoreline
                splitX={0}
                size={[46, 40]}
                waterY={WATER_Y}
                landColor="#a39a86"
                seaColor="#4d7e96"
            >
                {LANES.map((z, i) => {
                    const v = view[i];
                    const clickable =
                        gameState === 'playing' && v.mode !== 'sunk' && v.mode !== 'unload';
                    return (
                        <group
                            key={z}
                            ref={(el) => {
                                groups.current[i] = el;
                            }}
                            position={[START_X, WATER_Y, z]}
                        >
                            <Interactive
                                onSelect={() => onFerryClick(i)}
                                disabled={!clickable}
                                hitArea={[3, 2, 2.6]}
                            >
                                <group
                                    ref={(el) => {
                                        boatRot.current[i] = el;
                                    }}
                                    rotation={[0, faceAlong([-1, 0]), 0]}
                                >
                                    <Boat
                                        position={[0, 0, 0]}
                                        color={v.halted ? '#d97706' : '#8a7a62'}
                                    />
                                    {/* Flatt ferjedekk oppå skroget */}
                                    <mesh position={[0, 0.75, 0]} castShadow>
                                        <boxGeometry args={[0.95, 0.08, 1.9]} />
                                        <meshStandardMaterial
                                            color={v.halted ? '#fbbf24' : '#b7a484'}
                                        />
                                    </mesh>
                                    {/* Soldater om bord på vei over */}
                                    {v.mode === 'out' &&
                                        [-0.5, 0, 0.5].map((dz) => (
                                            <mesh key={dz} position={[0, 1.04, dz]}>
                                                <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
                                                <meshStandardMaterial color="#4d5a3a" />
                                            </mesh>
                                        ))}
                                </group>
                            </Interactive>
                            {gameState === 'playing' && v.mode === 'ready' && (
                                <Hotspot
                                    position={[0, 1.9, 0]}
                                    onSelect={() => onFerryClick(i)}
                                    label="Send over"
                                    radius={0.45}
                                />
                            )}
                        </group>
                    );
                })}
                {bombs.map((b) => (
                    <React.Fragment key={b.id}>
                        <BombMarker x={b.x} z={LANES[b.lane]} />
                        <Bomber x={b.x} z={LANES[b.lane]} />
                    </React.Fragment>
                ))}
                {hits.map((h) => (
                    <Explosion key={h.id} x={h.x} z={h.z} scale={0.9} palette="dust" />
                ))}
            </Shoreline>

            <RuinedCity />
            <GermanArmy />
            <Burst position={[LAND_X, 1, LANES[lastLane]]} trigger={landings} />

            {/* Knipetangen bygges opp bak byen mens eleven holder den */}
            <PincerArm arm={NORTH_ARM} progress={progress} />
            <PincerArm arm={SOUTH_ARM} progress={progress} />
            {/* Kalatsj ved Don, der armene møttes */}
            <mesh position={[-16, 0.05, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            {won && (
                <FlatRing
                    position={[-8.5, 0.06, 0]}
                    radius={7.6}
                    tube={0.16}
                    color="#dc2626"
                    segments={64}
                />
            )}
        </>
    );
}

const OverVolga3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [view, setView] = useState<FerryView[]>(freshView);
    const [bombs, setBombs] = useState<Bomb[]>([]);
    const [hits, setHits] = useState<Hit[]>([]);
    const [landings, setLandings] = useState(0);
    const [lastLane, setLastLane] = useState(1);
    const [sunk, setSunk] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const ferriesRef = useRef<FerrySim[]>(freshFerries());
    const idRef = useRef(0);
    const stateRef = useRef<GameState>('idle');
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);
    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const later = useCallback((fn: () => void, ms: number) => {
        timers.current.push(setTimeout(fn, ms));
    }, []);

    const flash = useCallback(
        (msg: string, ms = 2600) => {
            setBanner(msg);
            later(() => setBanner((b) => (b === msg ? null : b)), ms);
        },
        [later]
    );

    const press = useMeter({
        initial: 0.3,
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.5,
        onOverload: () => {
            if (stateRef.current !== 'playing') return;
            sounds.play('incorrect');
            setFails((f) => f + 1);
            setBombs([]);
            setGameState('fallen');
        },
    });

    const [elapsed, setElapsed] = useState(0);
    const onTick = useCallback(
        (t: number) => {
            setElapsed(t);
            if (t >= GAME_SECONDS && stateRef.current === 'playing') {
                stateRef.current = 'won';
                sounds.play('complete');
                setBombs([]);
                setGameState('won');
                setBanner(null);
            }
        },
        [sounds]
    );
    const progress = gameState === 'won' ? 1 : Math.min(1, elapsed / GAME_SECONDS);
    const pressAdd = press.add;

    const setMode = useCallback((lane: number, mode: FerryMode) => {
        setView((v) =>
            v.map((f, i) => (i === lane ? { mode, halted: ferriesRef.current[lane].halted } : f))
        );
    }, []);

    const onLanded = useCallback(
        (lane: number) => {
            press.add(-RELIEF);
            setLandings((n) => n + 1);
            setLastLane(lane);
            sounds.play('correct');
            flash(`Forsterkninger i land ved ${LANE_NAMES[lane]}!`, 1600);
        },
        [press, sounds, flash]
    );

    const onFerryClick = useCallback(
        (lane: number) => {
            if (stateRef.current !== 'playing') return;
            const f = ferriesRef.current[lane];
            if (f.mode === 'ready') {
                f.mode = 'out';
                f.halted = false;
                sounds.play('advance');
            } else if (f.mode === 'out' || f.mode === 'back') {
                f.halted = !f.halted;
                sounds.play(f.halted ? 'drop' : 'pick');
            } else return;
            setView((v) => v.map((x, i) => (i === lane ? { mode: f.mode, halted: f.halted } : x)));
        },
        [sounds]
    );

    // DEV: selvspill-kroken bruker samme klikk som eleven.
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        (window as unknown as Record<string, unknown>).__volgaClick = onFerryClick;
    }, [onFerryClick]);

    // Tyske fly angriper ferjene. Oftest sikter de dit en ferje er på vei.
    useRandomPulse({
        running: gameState === 'playing',
        minDelayMs: 2300,
        maxDelayMs: 4000,
        onPulse: () => {
            const ferries = ferriesRef.current;
            const moving = ferries
                .map((f, i) => ({ f, i }))
                .filter(({ f }) => (f.mode === 'out' || f.mode === 'back') && !f.halted);
            let lane: number;
            let x: number;
            if (moving.length > 0 && Math.random() < 0.75) {
                const pick = moving[Math.floor(Math.random() * moving.length)];
                lane = pick.i;
                const dir = pick.f.mode === 'out' ? -1 : 1.15;
                x = pick.f.x + dir * SPEED * (WARN_MS / 1000);
                x = Math.max(LAND_X + 1.2, Math.min(START_X - 1.2, x));
            } else {
                lane = Math.floor(Math.random() * LANES.length);
                x = 3 + Math.random() * 6;
            }
            const id = ++idRef.current;
            setBombs((b) => [...b, { id, lane, x }]);
            later(() => {
                setBombs((b) => b.filter((bb) => bb.id !== id));
                if (stateRef.current !== 'playing') return;
                setHits((h) => [...h, { id, x, z: LANES[lane] }]);
                later(() => setHits((h) => h.filter((hh) => hh.id !== id)), 2600);
                const f = ferriesRef.current[lane];
                if ((f.mode === 'out' || f.mode === 'back') && Math.abs(f.x - x) < HIT_RADIUS) {
                    f.mode = 'sunk';
                    f.t = 0;
                    setMode(lane, 'sunk');
                    setSunk((s) => s + 1);
                    press.add(0.1);
                    sounds.play('incorrect');
                    flash(
                        'Ferjen ble truffet! Stopp ferjen FØR den kjører inn i en rød ring.',
                        2800
                    );
                }
            }, WARN_MS);
        },
    });

    const begin = useCallback(() => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        ferriesRef.current = freshFerries();
        setView(freshView());
        setBombs([]);
        setHits([]);
        setLandings(0);
        setSunk(0);
        press.reset();
        setElapsed(0);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        flash('Klikk på en ferje for å sende den over. Klikk igjen for å stoppe den!', 3600);
        // Når tangen er godt i gang, skal eleven legge merke til den.
        later(() => {
            if (stateRef.current === 'playing') {
                flash('Se bak byen: sovjetiske styrker samler seg i nord og sør.', 3400);
            }
        }, GAME_SECONDS * 400);
    }, [press, sounds, flash, later]);

    const resetAll = useCallback(() => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        ferriesRef.current = freshFerries();
        setView(freshView());
        setBombs([]);
        setHits([]);
        press.reset();
        setBanner(null);
        setGameState('idle');
    }, [press]);

    const score = Math.max(0.5, 1 - fails * 0.15);

    // Seier: meld fra til rammen med én gang, ikke først ved "gå videre".
    const reported = useRef(false);
    useEffect(() => {
        if (gameState === 'won' && !reported.current) {
            reported.current = true;
            onComplete({ score, completed: true });
        }
        if (gameState === 'playing') reported.current = false;
    }, [gameState, onComplete, score]);

    return (
        <MicroGameScaffold
            title="Over Volga"
            subtitle="Hold byen lenge nok - mens det avgjørende skjer bak den"
            estimatedSeconds={130}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [15, 17, 16], fov: 48 },
                target: [-3, 0, -1],
                background: '#cfd6db',
                fog: { color: '#cfd6db', near: 30, far: 70 },
                light: 'overcast',
            }}
            overlays={
                <>
                    <DangerVignette
                        level={gameState === 'playing' ? Math.max(0, press.value - 0.55) * 2 : 0}
                    />
                    <SceneBanner message={banner} wide />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={Math.max(0, GAME_SECONDS - elapsed)}
                            label="Til 19. november"
                            warnBelow={10}
                            corner="br"
                        />
                    )}
                    {gameState !== 'idle' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Ferjer i land', value: landings },
                                { label: 'Senket', value: sunk },
                            ]}
                        />
                    )}
                </>
            }
            scene={
                <VolgaScene
                    key={attempt}
                    gameState={gameState}
                    progress={progress}
                    ferriesRef={ferriesRef}
                    view={view}
                    bombs={bombs}
                    hits={hits}
                    landings={landings}
                    lastLane={lastLane}
                    pressAdd={pressAdd}
                    onTick={onTick}
                    onFerryClick={onFerryClick}
                    onModeChange={setMode}
                    onLanded={onLanded}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed max-w-xl mx-auto">
                        Stalingrad, høsten 1942. Tyskerne har tatt det meste av byen. Du sender
                        forsterkninger over Volga med ferjer. Tyske fly angriper elva: når en rød
                        ring dukker opp foran en ferje, klikk på ferjen for å stoppe den. Hold byen
                        til 19. november.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 transition shadow"
                    >
                        Start forsvaret
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="space-y-2">
                    <MeterBar
                        value={press.value}
                        label="Tysk press på byen"
                        hint="Hver ferje som kommer i land, presser tyskerne tilbake. Når måleren er full, faller byen."
                        labels={{
                            normal: 'Byen holder',
                            warn: 'Hardt presset',
                            danger: 'Byen faller!',
                        }}
                    />
                    <div className="grid grid-cols-3 gap-2">
                        {view.map((v, i) => (
                            <button
                                key={i}
                                onClick={() => onFerryClick(i)}
                                disabled={v.mode === 'sunk' || v.mode === 'unload'}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <span className="block font-semibold">{LANE_NAMES[i]}</span>
                                {v.mode === 'ready'
                                    ? 'Send over'
                                    : v.mode === 'sunk'
                                      ? 'Senket'
                                      : v.mode === 'unload'
                                        ? 'Losser'
                                        : v.halted
                                          ? 'Kjør videre'
                                          : 'Stopp'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {gameState === 'fallen' && (
                <LoseScreen title="Byen falt før tangen var klar" onRetry={begin}>
                    Hvis tyskerne tok hele byen, kunne de flytte 6. armé dit den trengtes andre
                    steder på fronten. Da hadde knipetangen ingen å fange. Prøv igjen: hold ferjene
                    i gang, og stopp dem når flyene sikter.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={fails === 0 ? 'Byen holdt - på første forsøk!' : 'Byen holdt!'}
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    19. november 1942 slo Den røde armé til nord for byen, og dagen etter sør for
                    den. Den 23. november møttes armene ved Kalatsj. Se den røde ringen: 6. armé
                    satt fanget. Du holdt byen, men slaget ble avgjort bak den.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default OverVolga3D;
