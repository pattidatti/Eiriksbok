import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Animal,
    Cart,
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
    Particles,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: eleven kjenner på kroppen hvorfor lakotaene måtte gi opp
// sletta. Første vinter er flokkene overalt og du rir rett inn i dem. Tredje
// vinter er jernbanen der, jegerleirene ligger langs sporet, og du må lete
// lenge etter én flokk. Bøffelen var ikke bare mat. Den var friheten.

const MAX_HERDS = 6;
const RIDE_SPEED = 6.4;
const SPRINT_SPEED = 11.5;
const STEER_X = 9.5;
const SPAWN_Z = -46;
const SPAWN_Z_MAX = -80;
const CATCH_X = 2.9;
const CATCH_Z = 2.6;
const SEASON_SECONDS = 30;

// Per vinter: hvor mange flokker som er ute samtidig, hvor bredt de sprer seg,
// og hvor fort sulten vokser. Tallene speiler at bestanden falt fra titalls
// millioner til noen få hundre på under tjue år.
const SEASONS = [
    { herds: 4, spread: 6.5, gap: 15, hunger: 0.042, label: 'Vinteren 1868' },
    { herds: 3, spread: 8.2, gap: 22, hunger: 0.052, label: 'Vinteren 1874' },
    { herds: 2, spread: 9.2, gap: 30, hunger: 0.062, label: 'Vinteren 1882' },
];

type GameState = 'idle' | 'playing' | 'starved' | 'won';

interface Herd {
    x: number;
    z: number;
    active: boolean;
    size: number;
}

// Enkel, deterministisk pseudo-tilfeldighet på modulnivå (ikke i useMemo).
function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// Dyrene i én flokk: faste, deterministiske plasseringer rundt flokkens midtpunkt.
function makeHerdOffsets(index: number) {
    const rand = makeRng(index * 977 + 41);
    return Array.from({ length: 7 }, () => ({
        x: (rand() - 0.5) * 5.6,
        z: (rand() - 0.5) * 5.6,
        r: rand() * 0.5 - 0.25,
        s: 1.35 + rand() * 0.5,
    }));
}

// Gresstuster spredd over sletta.
function makeTufts() {
    const rand = makeRng(20260907);
    return Array.from({ length: 90 }, () => ({
        x: (rand() - 0.5) * 46,
        z: -rand() * 54,
        s: 0.5 + rand() * 0.9,
        dark: rand() > 0.7,
    }));
}

// Startoppstillingen: første flokk står rett fram og godt synlig fra
// startkameraet, resten ligger på rekke lenger ute på sletta.
function makeInitialHerds(): Herd[] {
    return Array.from({ length: MAX_HERDS }, (_, i) => ({
        x: i === 0 ? 0 : (i % 2 === 0 ? 1 : -1) * (2.5 + i * 1.4),
        z: -16 - i * 11,
        active: i < SEASONS[0].herds,
        size: 0.6,
    }));
}

// ── Bøffelflokk ──────────────────────────────────────────────────────────────
// Posisjonen leses fra den delte ref-en hver frame. Ingen re-render mens
// verdenen ruller mot eleven.
function HerdView({
    index,
    herdsRef,
}: {
    index: number;
    herdsRef: React.MutableRefObject<Herd[]>;
}) {
    const group = useRef<THREE.Group>(null);
    const offsets = useMemo(() => makeHerdOffsets(index), [index]);

    useFrame((state) => {
        const g = group.current;
        if (!g) return;
        const h = herdsRef.current[index];
        if (!h) return;
        g.visible = h.active;
        g.position.set(h.x, 0, h.z);
        // Flokken beiter og skifter litt på seg, så den lever i ro.
        g.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.35 + index) * 0.25;
    });

    return (
        <group ref={group} visible={false}>
            {offsets.map((o, i) => (
                <group key={i} position={[o.x, 0, o.z]} rotation={[0, o.r, 0]} scale={o.s}>
                    {/* Bøffel: kropp og manke bygd av Animal-oksen med mørk pels */}
                    <Animal kind="ox" color="#4a3524" />
                    <mesh position={[0.28, 0.92, 0]} castShadow>
                        <boxGeometry args={[0.5, 0.34, 0.54]} />
                        <meshStandardMaterial color="#3a291b" roughness={1} flatShading />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ── Rullende slettedekor ─────────────────────────────────────────────────────
// Gresstuster og steiner som ruller mot eleven, så farten kjennes.
function GrassField({ scrollRef, playing }: {
    scrollRef: React.MutableRefObject<number>;
    playing: boolean;
}) {
    const group = useRef<THREE.Group>(null);
    const tufts = useMemo(() => makeTufts(), []);
    const baseZ = useMemo(() => tufts.map((t) => t.z), [tufts]);
    const meshes = useRef<(THREE.Group | null)[]>([]);

    useFrame(() => {
        if (!playing) return;
        const scroll = scrollRef.current;
        const list = meshes.current;
        for (let i = 0; i < list.length; i++) {
            const m = list[i];
            if (!m) continue;
            let z = ((baseZ[i] + scroll) % 60) + 8;
            if (z > 8) z -= 60;
            m.position.z = z;
        }
    });

    return (
        <group ref={group}>
            {tufts.map((t, i) => (
                <group
                    key={i}
                    ref={(el) => {
                        meshes.current[i] = el;
                    }}
                    position={[t.x, 0, t.z]}
                    scale={t.s}
                >
                    <mesh position={[0, 0.16, 0]} castShadow>
                        <coneGeometry args={[0.34, 0.32, 5]} />
                        <meshStandardMaterial
                            color={t.dark ? '#8d7a3f' : '#b9a45c'}
                            roughness={1}
                            flatShading
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ── Jernbane og jegerleir ────────────────────────────────────────────────────
// Dukker opp fra andre vinter. Sporet fulgte de gamle bøffeltråkkene, og langs
// det lå leirene som tok skinnet og lot resten ligge.
function HunterCamp({ side }: { side: number }) {
    return (
        <group position={[side * 12, 0, 0]}>
            <Cart position={[0, 0, 0]} rotation={[0, side > 0 ? -1.2 : 1.2, 0]} />
            {/* Stabler med skinn, klare for jernbanen */}
            {[0, 1, 2].map((i) => (
                <mesh key={i} position={[2.1 + i * 1.5, 0.42, 2.2]} castShadow>
                    <boxGeometry args={[1.3, 0.84, 1.5]} />
                    <meshStandardMaterial color="#6b4f31" roughness={1} flatShading />
                </mesh>
            ))}
        </group>
    );
}

function RailLine() {
    return (
        <group>
            {/* Grusfylling under sporet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
                <planeGeometry args={[52, 3.4]} />
                <meshStandardMaterial color="#8b8071" roughness={1} />
            </mesh>
            {/* To skinner som LIGGER langs x (roterte sylindre) */}
            {[-0.7, 0.7].map((z) => (
                <mesh key={z} position={[0, 0.14, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.07, 0.07, 52, 6]} />
                    <meshStandardMaterial color="#5d5148" roughness={0.7} metalness={0.3} />
                </mesh>
            ))}
            {/* Sviller */}
            {Array.from({ length: 26 }, (_, i) => (
                <mesh key={i} position={[-25 + i * 2, 0.06, 0]} castShadow>
                    <boxGeometry args={[0.34, 0.12, 2.1]} />
                    <meshStandardMaterial color="#4f3d2c" roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// Jernbanen og leirene ruller mot eleven som resten av verdenen.
function RailAndCamps({
    scrollRef,
    playing,
    show,
}: {
    scrollRef: React.MutableRefObject<number>;
    playing: boolean;
    show: boolean;
}) {
    const group = useRef<THREE.Group>(null);
    useFrame(() => {
        const g = group.current;
        if (!g) return;
        g.visible = show && playing;
        if (!playing) return;
        let z = ((-30 + scrollRef.current) % 120) + 8;
        if (z > 8) z -= 120;
        g.position.z = z;
    });
    return (
        <group ref={group} visible={false} position={[0, 0, -80]}>
            <RailLine />
            <HunterCamp side={-1} />
            <HunterCamp side={1} />
        </group>
    );
}

// ── Hesten eleven sitter på ──────────────────────────────────────────────────
// Hals og hode rett foran kameraet gir kroppsfølelse uten CSS-silhuett.
function HorseNeck({
    camXRef,
    sprintRef,
}: {
    camXRef: React.MutableRefObject<number>;
    sprintRef: React.MutableRefObject<boolean>;
}) {
    const group = useRef<THREE.Group>(null);
    useFrame((state) => {
        const g = group.current;
        if (!g) return;
        g.visible = true;
        const t = state.clock.getElapsedTime();
        const bob = sprintRef.current ? Math.sin(t * 9) * 0.06 : Math.sin(t * 3.4) * 0.025;
        g.position.set(camXRef.current, 0.06 + bob, -1.6);
        g.rotation.x = -0.34 + bob * 0.3;
    });
    return (
        <group ref={group} scale={0.85}>
            {/* Hals */}
            <mesh position={[0, 0.28, 0]} castShadow>
                <boxGeometry args={[0.42, 0.86, 0.5]} />
                <meshStandardMaterial color="#6b4526" roughness={1} flatShading />
            </mesh>
            {/* Hode */}
            <mesh position={[0, 0.76, -0.28]} rotation={[0.5, 0, 0]} castShadow>
                <boxGeometry args={[0.34, 0.62, 0.34]} />
                <meshStandardMaterial color="#5e3c20" roughness={1} flatShading />
            </mesh>
            {/* Ører */}
            {[-0.11, 0.11].map((x) => (
                <mesh key={x} position={[x, 1.02, -0.42]} rotation={[0.4, 0, 0]}>
                    <coneGeometry args={[0.05, 0.16, 5]} />
                    <meshStandardMaterial color="#4c3018" roughness={1} />
                </mesh>
            ))}
            {/* Manke */}
            <mesh position={[0, 0.62, 0.02]} castShadow>
                <boxGeometry args={[0.12, 0.7, 0.38]} />
                <meshStandardMaterial color="#33210f" roughness={1} flatShading />
            </mesh>
        </group>
    );
}

// ── Himmel og skybanker (dekor, holdes utenfor scene-revisjonens modellboks) ──
function BigSky() {
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {[
                [-16, 13, -40, 9],
                [12, 15, -46, 11],
                [2, 17, -34, 7],
                [-24, 14, -26, 6],
            ].map(([x, y, z, s], i) => (
                <mesh key={i} position={[x, y, z]} scale={[s, s * 0.34, s * 0.6]}>
                    <sphereGeometry args={[1, 10, 8]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.6}
                        depthWrite={false}
                        fog={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ── Scene-rot: all sanntidslogikk bor her ────────────────────────────────────
interface SceneProps {
    gameState: GameState;
    attempt: number;
    season: number;
    camXRef: React.MutableRefObject<number>;
    camPosRef: React.MutableRefObject<[number, number, number]>;
    scrollRef: React.MutableRefObject<number>;
    sprintRef: React.MutableRefObject<boolean>;
    steerRef: React.MutableRefObject<number>;
    sprinting: boolean;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
    hungerAdd: (amount: number) => void;
    onReachHerd: (x: number, z: number) => void;
    burstAt: [number, number, number];
    burstTrigger: number;
}

function PlainsScene({
    gameState,
    attempt,
    season,
    camXRef,
    camPosRef,
    scrollRef,
    sprintRef,
    steerRef,
    sprinting,
    onAim,
    onHoldChange,
    hungerAdd,
    onReachHerd,
    burstAt,
    burstTrigger,
}: SceneProps) {
    // Scenen remountes per forsøk (key={attempt}), så refs nullstilles selv.
    void attempt;
    const playing = gameState === 'playing';
    // Scenen eier flokkene selv. Da muteres aldri en prop, og key={attempt}
    // gir en ny, ferdig oppstilt slette for hvert forsøk.
    const herdsRef = useRef<Herd[]>(makeInitialHerds());
    const seasonRef = useRef(season);
    useEffect(() => {
        seasonRef.current = season;
    }, [season]);
    const onReachRef = useRef(onReachHerd);
    const hungerAddRef = useRef(hungerAdd);
    useEffect(() => {
        onReachRef.current = onReachHerd;
    }, [onReachHerd]);
    useEffect(() => {
        hungerAddRef.current = hungerAdd;
    }, [hungerAdd]);

    useFrame((state, dt) => {
        if (!playing) return;
        const cfg = SEASONS[Math.min(SEASONS.length - 1, seasonRef.current)];

        // 1) Verdenen ruller mot eleven uansett. Hold inne = jag flokken.
        const speed = sprintRef.current ? SPRINT_SPEED : RIDE_SPEED;
        const step = speed * dt;
        scrollRef.current += step;

        // 2) Styring: pekeren peker ut hvor på sletta du rir.
        const dx = steerRef.current - camXRef.current;
        const agility = sprintRef.current ? 3.2 : 1.9;
        camXRef.current = Math.max(
            -STEER_X,
            Math.min(STEER_X, camXRef.current + dx * Math.min(1, dt * agility))
        );
        camPosRef.current = [camXRef.current, 1.95, 0];

        // 3) Sult vokser med tiden, og fortere når du jager.
        hungerAddRef.current(dt * (cfg.hunger + (sprintRef.current ? 0.048 : 0)));

        // 4) Flokkene kommer mot deg. Passerte eller spiste flokker settes ut på nytt.
        const herds = herdsRef.current;
        for (let i = 0; i < herds.length; i++) {
            const h = herds[i];
            if (!h.active) continue;
            h.z += step;
            if (
                Math.abs(h.x - camXRef.current) < CATCH_X + h.size &&
                Math.abs(h.z) < CATCH_Z
            ) {
                h.active = false;
                onReachRef.current(h.x, h.z);
                continue;
            }
            if (h.z > 12) h.active = false;
        }
        // Fyll opp til sesongens antall, aldri flere.
        let live = 0;
        for (const h of herds) if (h.active) live++;
        if (live < cfg.herds) {
            let furthest = 0;
            for (const h of herds) if (h.active) furthest = Math.min(furthest, h.z);
            for (const h of herds) {
                if (h.active || live >= cfg.herds) continue;
                const r = Math.sin(state.clock.getElapsedTime() * 12.9898 + live * 7.13);
                h.x = ((r + 1) / 2) * cfg.spread * 2 - cfg.spread;
                h.z = Math.max(SPAWN_Z_MAX, Math.min(SPAWN_Z, furthest - cfg.gap));
                h.size = 0.6;
                h.active = true;
                furthest = h.z;
                live++;
            }
        }

        if (import.meta.env.DEV) {
            (window as unknown as Record<string, unknown>).__bisonDebug = {
                player: camXRef.current,
                herds: herds.filter((h) => h.active).map((h) => [h.x, h.z]),
            };
        }
    });

    return (
        <>
            <PovCamera
                positionRef={camPosRef}
                lookAhead={[0, -0.42, -9]}
                moving={playing && sprinting}
                bob={0.05}
            />
            <AimPlane
                enabled={playing}
                followCamera
                onAim={onAim}
                onHoldChange={onHoldChange}
                hideCursor
            />

            {/* Sletta: bredere enn 26 enheter, så scene-revisjonen holder den
                utenfor modellboksen slik den skal. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -18]} receiveShadow>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial color="#c0a765" roughness={1} />
            </mesh>

            <BigSky />
            <GrassField scrollRef={scrollRef} playing={playing} />
            <RailAndCamps scrollRef={scrollRef} playing={playing} show={season >= 1} />

            {Array.from({ length: MAX_HERDS }, (_, i) => (
                <HerdView key={i} index={i} herdsRef={herdsRef} />
            ))}

            <HorseNeck camXRef={camXRef} sprintRef={sprintRef} />

            <Burst position={burstAt} trigger={burstTrigger} color="#e2b872" spread={2.6} />
            <Particles preset="dust" count={18} area={[24, 24]} center={[0, 0, -9]} height={1.5} />
        </>
    );
}

// ── Hovedelement ─────────────────────────────────────────────────────────────

const BisonSletta3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const wind = useAmbience('wind', -30);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [season, setSeason] = useState(0);
    const [caught, setCaught] = useState(0);
    const [fails, setFails] = useState(0);
    const [sprinting, setSprinting] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [burstAt, setBurstAt] = useState<[number, number, number]>([0, 1, 0]);
    const [burstTrigger, setBurstTrigger] = useState(0);

    const camXRef = useRef(0);
    const camPosRef = useRef<[number, number, number]>([0, 1.95, 0]);
    const scrollRef = useRef(0);
    const sprintRef = useRef(false);
    const steerRef = useRef(0);
    const seasonRef = useRef(0);
    const gameStateRef = useRef<GameState>('idle');

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const starve = useCallback(() => {
        if (gameStateRef.current !== 'playing') return;
        sounds.play('incorrect');
        sprintRef.current = false;
        setSprinting(false);
        setFails((f) => f + 1);
        setGameState('starved');
    }, [sounds]);

    const hunger = useMeter({
        initial: 0.28,
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.5,
        onOverload: starve,
    });

    // Én vinter om gangen. Overlever du vinteren, kommer neste - med færre dyr.
    const nextSeason = useCallback(() => {
        if (gameStateRef.current !== 'playing') return;
        const next = seasonRef.current + 1;
        if (next >= SEASONS.length) {
            sounds.play('complete');
            setGameState('won');
            setBanner(null);
            onComplete({ score: Math.max(0.4, 1 - fails * 0.15), completed: true });
            return;
        }
        seasonRef.current = next;
        setSeason(next);
        hunger.add(-0.12);
        sounds.play('sceneChange');
        setBanner(
            next === 1
                ? 'Jernbanen kom i 1869. Skinnjegerne fulgte sporet, og flokkene ble færre.'
                : 'Nå drepes det mellom 2000 og 10 000 dyr hver dag. Du må lete lenger.'
        );
        window.setTimeout(() => setBanner(null), 3600);
    }, [sounds, onComplete, fails, hunger]);

    const clock = useGameClock({
        seconds: SEASON_SECONDS,
        running: gameState === 'playing',
        onExpire: nextSeason,
    });

    // Klokka starter på nytt for hver vinter.
    useEffect(() => {
        if (gameState === 'playing' && season > 0) clock.restart(SEASON_SECONDS);
        // clock.restart er stabil; vi vil kun reagere på sesongskifte.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [season]);

    const aim = useCrosshair();
    const handleAim = useCallback(
        (xPct: number, yPct: number) => {
            aim.move(xPct, yPct);
            steerRef.current = ((xPct - 50) / 50) * STEER_X;
        },
        [aim]
    );

    const handleHold = useCallback((holding: boolean) => {
        sprintRef.current = holding;
        setSprinting(holding);
    }, []);

    const handleReachHerd = useCallback(
        (x: number, z: number) => {
            hunger.add(-0.5);
            sounds.play('correct');
            setCaught((c) => c + 1);
            setBurstAt([x, 1.1, z]);
            setBurstTrigger((t) => t + 1);
        },
        [hunger, sounds]
    );

    const begin = useCallback(() => {
        camXRef.current = 0;
        camPosRef.current = [0, 1.95, 0];
        scrollRef.current = 0;
        sprintRef.current = false;
        steerRef.current = 0;
        seasonRef.current = 0;
        hunger.reset();
        clock.restart(SEASON_SECONDS);
        setSeason(0);
        setCaught(0);
        setSprinting(false);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        wind.start();
        setBanner('Styr med pekeren. Hold inne for å jage - men jaging tærer på kreftene.');
        window.setTimeout(() => setBanner(null), 3800);
    }, [hunger, clock, sounds, wind]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        hunger.reset();
        sprintRef.current = false;
        setSprinting(false);
        wind.stop();
    }, [hunger, wind]);

    const score = Math.max(0.4, 1 - fails * 0.15);

    const handleNext = useCallback(() => {
        onComplete({ score, completed: true });
    }, [onComplete, score]);

    return (
        <MicroGameScaffold
            title="Sletta som ble tom"
            subtitle="Tre vintre på prærien. Finn flokken før forrådet tar slutt."
            estimatedSeconds={170}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 1.95, 0] as [number, number, number], fov: 66 },
                background: '#cfe0ee',
                fog: { color: '#d8e2e8', near: 16, far: 58 },
                light: 'golden',
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#cfe0ee] via-[#e4e3d5] to-[#cbb478]"
            overlays={
                <>
                    <Crosshair show={gameState === 'playing'} crosshairRef={aim.ref} variant="dot" />
                    <DangerVignette level={gameState === 'playing' ? hunger.value : 0} />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Til vinteren"
                            warnBelow={8}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Vinter', value: `${season + 1}`, unit: '/3' },
                                { label: 'Flokker', value: caught },
                            ]}
                        />
                    )}
                    <SceneBanner message={banner} wide />
                    {gameState === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-black/45 text-white/85 rounded-xl text-xs text-center max-w-sm leading-relaxed">
                                Slettelandet, 1868. Foran deg beiter flokker så store at de dekker
                                horisonten.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <PlainsScene
                    key={attempt}
                    gameState={gameState}
                    attempt={attempt}
                    season={season}
                    camXRef={camXRef}
                    camPosRef={camPosRef}
                    scrollRef={scrollRef}
                    sprintRef={sprintRef}
                    steerRef={steerRef}
                    sprinting={sprinting}
                    onAim={handleAim}
                    onHoldChange={handleHold}
                    hungerAdd={hunger.add}
                    onReachHerd={handleReachHerd}
                    burstAt={burstAt}
                    burstTrigger={burstTrigger}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Du rir over sletta. Styr med pekeren, og rid rett inn i en flokk for å fylle
                        forrådet. Hold inne museknappen for å jage raskere - men da tærer du mer på
                        kreftene. Du skal overleve tre vintre.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-800 transition shadow"
                    >
                        Rid ut på sletta
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={hunger.value}
                    label="Sult i leiren"
                    hint="Forrådet minker hele tiden. Hver flokk du når fyller det opp igjen."
                    labels={{ normal: 'Nok mat', warn: 'Knapt', danger: 'SULT!' }}
                />
            )}

            {gameState === 'starved' && (
                <LoseScreen title="Forrådet tok slutt" onRetry={begin}>
                    Da bøffelen ble borte, forsvant maten, klærne og teltdukene på én gang. Familier
                    som sultet, måtte til slutt reise til agenturet og godta livet i reservatet.
                    Prøv igjen: styr mot flokken i god tid, og spar på kreftene mellom jaktene.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={
                        fails === 0
                            ? 'Du berget folket gjennom tre vintre - på første forsøk!'
                            : 'Du berget folket gjennom tre vintre'
                    }
                    onReplay={begin}
                    onNext={handleNext}
                >
                    Bestanden var trolig på 60-70 millioner dyr. På 1870-tallet ble det drept mellom
                    2000 og 10 000 hver eneste dag, og i 1884 var det bare noen få hundre igjen
                    (Schandy, 2026). Da fantes det ingen flokk å ri mot lenger, og det var nettopp
                    poenget: i 1873 sa USAs innenriksminister rett ut at urfolk ikke kunne
                    kontrolleres så lenge bøffelen fortsatt fantes på sletta.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default BisonSletta3D;
