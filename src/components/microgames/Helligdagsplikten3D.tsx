import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Person,
    Building,
    Tree,
    Tower,
    GroundPlane,
    FlatRing,
    useGameClock,
    useCrosshair,
    Crosshair,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: sabbatsforordningen av 1735 gjorde husbonden ansvarlig for
// at HELE husholdet møtte i kirken. Eleven kjenner det på kroppen ved at man
// ikke kan gå alene - man må hente folk, og man må STÅ STILLE for å overtale
// dem, mens klokka ringer. Staten nådde helt inn i søndagen på gården.

const CHURCH_Z = -16;
const DOOR_Z = -10.2;
const WALK_LIMIT_Z = -10.5;
const DOOR_X = 3.4;
const START_Z = 16;
const WALK_SPEED = 3.6;
const FOLLOW_SPEED = 4.1;
const FOLLOW_GAP = 1.35;
const REACH = 3.2;
const YARD_X = 12;
const TIME_LIMIT = 95;
// Pekeren over denne linja (i prosent av vinduets høyde) betyr framover, under betyr rygg.
const FORWARD_PIVOT = 60;

type GameState = 'idle' | 'playing' | 'late' | 'won';
type VisualState = 'ute' | 'folger' | 'inne';

interface Husfolk {
    id: string;
    name: string;
    doing: string;
    body: string;
    legs: string;
    hat: 'none' | 'cap' | 'hood';
    hatColor: string;
    start: [number, number];
    drift: [number, number];
    bound: [number, number];
    resist: number;
}

// Fem i huset, hver med sin sysselsetting - alle forbudt på en helligdag i 1740.
const HUSFOLK: Husfolk[] = [
    {
        id: 'ved',
        name: 'Ola, dreng',
        doing: 'hogger ved bak fjøset',
        body: '#6b5a3e',
        legs: '#3d3527',
        hat: 'cap',
        hatColor: '#57492f',
        start: [-7.5, 5.5],
        drift: [-0.15, 0.11],
        bound: [-11, 11],
        resist: 1.0,
    },
    {
        id: 'kort',
        name: 'Per, husmann',
        doing: 'spiller kort i låven',
        body: '#4d5b46',
        legs: '#2f3729',
        hat: 'none',
        hatColor: '#4d5b46',
        start: [8.2, 7.5],
        drift: [0.16, 0.12],
        bound: [11.5, 13],
        resist: 1.5,
    },
    {
        id: 'dans',
        name: 'Marit, budeie',
        doing: 'danser til fela',
        body: '#8a4a55',
        legs: '#4a2c33',
        hat: 'hood',
        hatColor: '#6d3b44',
        start: [-9.2, -0.5],
        drift: [-0.13, 0.16],
        bound: [-11.5, 10],
        resist: 1.8,
    },
    {
        id: 'handel',
        name: 'Anders, nabo',
        doing: 'selger fisk ved veien',
        body: '#3f5a6b',
        legs: '#27353d',
        hat: 'cap',
        hatColor: '#33495a',
        start: [6.6, -1.5],
        drift: [0.14, 0.14],
        bound: [11, 10],
        resist: 1.4,
    },
    {
        id: 'sover',
        name: 'Guri, tjenestejente',
        doing: 'sover ut på loftet',
        body: '#7a6b4e',
        legs: '#42392a',
        hat: 'hood',
        hatColor: '#655838',
        start: [4.8, 12.6],
        drift: [0.09, 0.14],
        bound: [8, 16],
        resist: 2.0,
    },
];

// Modul-konstant: samme array-identitet hver render, ellers re-applyer R3F
// position-propen og figuren hopper tilbake til utgangspunktet.
const START_POS: [number, number, number][] = HUSFOLK.map((h) => [h.start[0], 0, h.start[1]]);

// Plassene på kirkebakken. De ligger utenfor midtstien og minst 0,9 foran der
// eleven kan stå (WALK_LIMIT_Z), så en levert figur aldri stiller seg i veien
// for pekerstrålen eller dekker kirkedøra.
const KIRKEBAKKEN: [number, number][] = [
    [-2.5, -11.4],
    [2.5, -11.4],
    [-4.0, -11.0],
    [4.0, -11.0],
    [-1.4, -11.7],
];

interface Runtime {
    x: number;
    z: number;
    progress: number;
    gathered: boolean;
    delivered: boolean;
    order: number;
}

function makeRuntime(): Runtime[] {
    return HUSFOLK.map((h) => ({
        x: h.start[0],
        z: h.start[1],
        progress: 0,
        gathered: false,
        delivered: false,
        order: 0,
    }));
}

// --- Kulissen: kirken, tunet og skogkanten ---

function Bygda() {
    return (
        <>
            <GroundPlane size={46} depth={52} color="#c7cfc3" />

            {/* Kirkeveien: en lysere sti fra tunet og ned mot kirkedøra, så det
                alltid er tydelig hvilken vei eleven skal. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 2]}>
                <planeGeometry args={[3.2, 24]} />
                <meshStandardMaterial color="#d5d9cf" roughness={1} />
            </mesh>

            {/* Kirkegården: lysere grus foran kirkedøra */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, DOOR_Z + 1.6]}>
                <planeGeometry args={[10, 5]} />
                <meshStandardMaterial color="#dbdfd6" roughness={1} />
            </mesh>

            {/* Stavkirke-aktig kirke med tårn - det eleven skal fram til */}
            <Building position={[0, 0, CHURCH_Z]} body="#d9d3c4" roof="#4a3f36" w={7.4} h={3.6} d={8} />
            <Tower
                position={[0, 0, CHURCH_Z - 4.6]}
                radius={1.05}
                height={7.4}
                color="#d9d3c4"
                roof="#4a3f36"
            />
            {/* Kirkedøra, flukt mot kirkeveggen (framsiden ligger på z = CHURCH_Z + 4) */}
            <mesh position={[0, 1.05, CHURCH_Z + 4.09]}>
                <boxGeometry args={[1.6, 2.1, 0.16]} />
                <meshStandardMaterial color="#5b4630" roughness={0.85} />
            </mesh>
            {/* Kirkegårdsgjerde med åpning midt foran døra */}
            {[-4.6, -3.6, -2.6, 2.6, 3.6, 4.6].map((x) => (
                <mesh key={`gj-${x}`} position={[x, 0.45, DOOR_Z + 3.4]}>
                    <boxGeometry args={[0.12, 0.9, 0.12]} />
                    <meshStandardMaterial color="#6f6152" roughness={0.95} />
                </mesh>
            ))}

            {/* Gapestokken på kirkegården - straffen for å bli borte */}
            <group position={[5.6, 0, DOOR_Z + 0.6]}>
                <mesh position={[0, 0.75, 0]} castShadow>
                    <cylinderGeometry args={[0.11, 0.13, 1.5, 8]} />
                    <meshStandardMaterial color="#6b5a45" roughness={0.95} />
                </mesh>
                <mesh position={[0, 1.42, 0]} castShadow>
                    <boxGeometry args={[1.1, 0.22, 0.18]} />
                    <meshStandardMaterial color="#5b4c3a" roughness={0.95} />
                </mesh>
            </group>

            {/* Gårdshus rundt tunet */}
            <Building position={[-10.5, 0, 8.5]} body="#8a6a4a" roof="#4f4234" w={4.6} h={2.3} d={4} seed={3} />
            <Building position={[10.2, 0, 10]} body="#7d6045" roof="#4f4234" w={5} h={2.5} d={4.2} seed={7} />
            <Building position={[-11.5, 0, -3.5]} body="#816247" roof="#4f4234" w={3.8} h={2.1} d={3.4} seed={11} />

            {/* Vedstabel og fiskebod - det folk holder på med */}
            <mesh position={[-7.5, 0.35, 7.4]} castShadow>
                <boxGeometry args={[1.8, 0.7, 0.9]} />
                <meshStandardMaterial color="#7a6444" roughness={1} />
            </mesh>

            {/* Skogkanten */}
            {[
                [-15, 2],
                [-15.5, 9],
                [-14.5, -8],
                [15, 4],
                [15.5, 12],
                [14.5, -6],
                [-8, 19],
                [7, 19.5],
                [-13, 14.5],
                [13.2, 15.5],
                [-14.2, -3.2],
                [14, -1.8],
            ].map(([x, z], i) => (
                <Tree key={`t-${i}`} position={[x, 0, z]} leaf="#3d5540" seed={i} />
            ))}
        </>
    );
}

// --- Én person i husholdet ---

function Husmann({
    folk,
    startPos,
    groupRef,
    ringRef,
    state,
}: {
    folk: Husfolk;
    startPos: [number, number, number];
    groupRef: React.MutableRefObject<THREE.Group | null>;
    ringRef: React.MutableRefObject<THREE.Group | null>;
    state: VisualState;
}) {
    return (
        <group ref={groupRef} position={startPos}>
            <Person
                pose={state === 'folger' ? 'walk' : 'idle'}
                body={folk.body}
                legs={folk.legs}
                hat={folk.hat}
                hatColor={folk.hatColor}
            />
            {/* Overtalelsesringen på bakken: vokser mens du står stille ved dem */}
            <group ref={ringRef} visible={false}>
                <FlatRing radius={0.85} tube={0.08} color="#e0a53c" />
            </group>
        </group>
    );
}

// --- Scene-rot: all sanntidslogikk bor her, ref-basert ---

interface SceneProps {
    gameState: GameState;
    attempt: number;
    isWalking: boolean;
    camPosRef: React.MutableRefObject<[number, number, number]>;
    movingRef: React.MutableRefObject<boolean>;
    steerRef: React.MutableRefObject<number>;
    aimYRef: React.MutableRefObject<number>;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
    onGather: (index: number) => void;
    onDeliver: (count: number) => void;
}

function TunetScene({
    gameState,
    attempt,
    isWalking,
    camPosRef,
    movingRef,
    steerRef,
    aimYRef,
    onAim,
    onHoldChange,
    onGather,
    onDeliver,
}: SceneProps) {
    // Scenen remountes per forsøk (key={attempt}), så refs nullstiller seg selv.
    void attempt;
    // Sanntidstilstanden for husfolket eier scenen selv. Den remountes per
    // forsøk (key={attempt} hos forelderen), så den nullstilles av seg selv.
    const peopleRef = useRef<Runtime[]>(makeRuntime());
    // Den synlige tilstanden må være ekte React-state: refs kan ikke leses
    // under render. Den endrer seg bare ved to hendelser (blir med, kommer
    // inn), aldri per frame.
    const [visual, setVisual] = useState<VisualState[]>(() => HUSFOLK.map(() => 'ute'));
    const groupRefs = useRef(HUSFOLK.map(() => ({ current: null as THREE.Group | null })));
    const ringRefs = useRef(HUSFOLK.map(() => ({ current: null as THREE.Group | null })));
    const orderRef = useRef(0);
    const onGatherRef = useRef(onGather);
    const onDeliverRef = useRef(onDeliver);
    useEffect(() => {
        onGatherRef.current = onGather;
    }, [onGather]);
    useEffect(() => {
        onDeliverRef.current = onDeliver;
    }, [onDeliver]);

    useFrame((_state, delta) => {
        const dt = Math.min(delta, 0.05);
        const pos = camPosRef.current;
        const people = peopleRef.current;

        if (gameState === 'playing') {
            // Egen bevegelse: hold inne for å gå, pek for å styre sideveis
            if (movingRef.current) {
                // Sideveis: gli mot kolonnen pekeren står i.
                const dx = steerRef.current - pos[0];
                const nx = Math.max(-YARD_X, Math.min(YARD_X, pos[0] + dx * Math.min(1, dt * 2.4)));
                // Fram/tilbake: pekeren høyt i bildet går framover, lavt rygger.
                // Uten dette kunne eleven bare gå én vei og aldri hente resten.
                const fwd = Math.max(-1, Math.min(1, (FORWARD_PIVOT - aimYRef.current) / 40));
                const nz = Math.max(
                    WALK_LIMIT_Z,
                    Math.min(START_Z + 4, pos[2] - fwd * WALK_SPEED * dt)
                );
                camPosRef.current = [nx, 1.55, nz];
            }

            const px = camPosRef.current[0];
            const pz = camPosRef.current[2];

            // Er du innenfor kirkegjerdet? Da leverer du dem du har med deg.
            const atDoor = pz <= DOOR_Z && Math.abs(px) <= DOOR_X;
            if (atDoor) {
                let delivered = 0;
                let plass = people.filter((q) => q.delivered).length;
                for (const p of people) {
                    if (p.gathered && !p.delivered) {
                        p.delivered = true;
                        // Still dem opp på kirkebakken, så eleven ser flokken vokse
                        const spot = KIRKEBAKKEN[Math.min(plass, KIRKEBAKKEN.length - 1)];
                        p.x = spot[0];
                        p.z = spot[1];
                        plass++;
                        delivered++;
                    }
                }
                if (delivered > 0) {
                    setVisual((v) => v.map((s0, i) => (people[i].delivered ? 'inne' : s0)));
                    onDeliverRef.current(delivered);
                }
            }

            // Ute i tunet: driv unna, la deg overtale, eller følg etter
            let leadX = px;
            let leadZ = pz + 0.9;
            for (let i = 0; i < people.length; i++) {
                const p = people[i];
                const folk = HUSFOLK[i];
                if (p.delivered) continue;

                if (p.gathered) {
                    // Følger etter i rekke: hver holder avstand til den foran
                    const dx = leadX - p.x;
                    const dz = leadZ - p.z;
                    const len = Math.hypot(dx, dz);
                    if (len > FOLLOW_GAP) {
                        const step = Math.min(len - FOLLOW_GAP, FOLLOW_SPEED * dt);
                        p.x += (dx / len) * step;
                        p.z += (dz / len) * step;
                    }
                    leadX = p.x;
                    leadZ = p.z;
                } else {
                    // Driver sakte lenger bort fra kirken mens du somler
                    const nx = p.x + folk.drift[0] * dt;
                    const nz = p.z + folk.drift[1] * dt;
                    p.x = folk.bound[0] < 0 ? Math.max(folk.bound[0], nx) : Math.min(folk.bound[0], nx);
                    p.z = Math.min(folk.bound[1], nz);

                    // Overtalelse: bare når du står HELT stille tett ved dem
                    const near = Math.hypot(px - p.x, pz - p.z) < REACH;
                    if (near && !movingRef.current) {
                        p.progress = Math.min(1, p.progress + dt / folk.resist);
                        if (p.progress >= 1) {
                            p.gathered = true;
                            p.order = orderRef.current++;
                            setVisual((v) => v.map((s0, j) => (j === i ? 'folger' : s0)));
                            onGatherRef.current(i);
                        }
                    } else if (!near) {
                        p.progress = Math.max(0, p.progress - dt * 0.35);
                    }
                }
            }

            // DEV: eksponer tilstanden for selvspill-testing (samme informasjon
            // eleven ser visuelt: egen posisjon og hvor folkene står).
            if (import.meta.env.DEV) {
                (window as unknown as Record<string, unknown>).__helligdagDebug = {
                    player: [px, pz],
                    aimY: aimYRef.current,
                    moving: movingRef.current,
                    folk: people.map((q) => ({
                        x: q.x,
                        z: q.z,
                        progress: q.progress,
                        gathered: q.gathered,
                        delivered: q.delivered,
                    })),
                };
            }
        } else if (gameState === 'won') {
            // Seiersbilde: løft kameraet opp og tilbake så eleven ser hele
            // flokken stå samlet på kirkebakken.
            const k = Math.min(1, dt * 0.9);
            camPosRef.current = [
                pos[0] + (0 - pos[0]) * k,
                pos[1] + (5.2 - pos[1]) * k,
                pos[2] + (4.5 - pos[2]) * k,
            ];
        }

        // Tegn tilstanden: posisjoner, retning og overtalelsesring
        for (let i = 0; i < people.length; i++) {
            const p = people[i];
            const g = groupRefs.current[i].current;
            const ring = ringRefs.current[i].current;
            if (g) {
                g.position.set(p.x, 0, p.z);
                const dx = camPosRef.current[0] - p.x;
                const dz = camPosRef.current[2] - p.z;
                if (dx * dx + dz * dz > 0.01) g.rotation.y = Math.atan2(dx, dz);
            }
            if (ring) {
                const show = !p.gathered && p.progress > 0.02;
                ring.visible = show;
                const s = 0.55 + p.progress * 0.85;
                ring.scale.set(s, 1, s);
            }
        }
    });

    return (
        <>
            <PovCamera
                positionRef={camPosRef}
                lookAhead={[0, -0.3, -6]}
                moving={gameState === 'playing' && isWalking}
                bob={0.05}
            />
            {/* followDistance holdes helt inntil kameraet med hensikt. Står flata
                lenger unna (standard er 16), fanger bakken, kirkeveggen eller en
                figur pekerstrålen først, og da slutter både styring og «pek lavt
                for å rygge» å virke akkurat der eleven trenger det mest. */}
            <AimPlane
                enabled={gameState === 'playing'}
                followCamera
                followDistance={0.6}
                onAim={onAim}
                onHoldChange={onHoldChange}
                hideCursor
            />

            <Bygda />

            {HUSFOLK.map((folk, i) => {
                const state = visual[i];
                return (
                    <Husmann
                        key={folk.id}
                        folk={folk}
                        startPos={START_POS[i]}
                        state={state}
                        groupRef={groupRefs.current[i]}
                        ringRef={ringRefs.current[i]}
                    />
                );
            })}
        </>
    );
}

// ---- Hovedelement ----

const Helligdagsplikten3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const wind = useAmbience('wind', -32);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [isWalking, setIsWalking] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [inChurch, setInChurch] = useState(0);
    const [following, setFollowing] = useState(0);

    const camPosRef = useRef<[number, number, number]>([0, 1.55, START_Z]);
    const movingRef = useRef(false);
    const steerRef = useRef(0);
    const aimYRef = useRef(FORWARD_PIVOT);
    const gameStateRef = useRef<GameState>('idle');
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => {
            if (gameStateRef.current !== 'playing') return;
            sounds.play('incorrect');
            movingRef.current = false;
            setIsWalking(false);
            setFails((f) => f + 1);
            setGameState('late');
        },
    });

    const aim = useCrosshair();
    const handleAim = useCallback(
        (xPct: number, yPct: number) => {
            aim.move(xPct, yPct);
            steerRef.current = ((xPct - 50) / 50) * YARD_X;
            aimYRef.current = yPct;
        },
        [aim]
    );

    const handleHold = useCallback((holding: boolean) => {
        movingRef.current = holding;
        setIsWalking(holding);
    }, []);

    const handleGather = useCallback(
        (index: number) => {
            sounds.play('correct');
            setFollowing((n) => n + 1);
            setBanner(`${HUSFOLK[index].name} blir med. Følg dem helt inn i kirken.`);
            setTimeout(() => setBanner(null), 2200);
        },
        [sounds]
    );

    const finish = useCallback(() => {
        sounds.play('complete');
        setGameState('won');
        setBanner(null);
        onComplete({ score: Math.max(0.4, 1 - fails * 0.2), completed: true });
    }, [fails, onComplete, sounds]);

    const handleDeliver = useCallback(
        (count: number) => {
            sounds.play('advance');
            setFollowing((n) => Math.max(0, n - count));
            setInChurch((n) => {
                const total = n + count;
                if (total >= HUSFOLK.length) finish();
                else {
                    setBanner(
                        `${total} av ${HUSFOLK.length} er inne. Klokka ringer fortsatt - hent resten.`
                    );
                    setTimeout(() => setBanner(null), 2400);
                }
                return total;
            });
        },
        [finish, sounds]
    );

    const begin = useCallback(() => {
        camPosRef.current = [0, 1.55, START_Z];
        movingRef.current = false;
        steerRef.current = 0;
        aimYRef.current = FORWARD_PIVOT - 25;
        clock.restart();
        setIsWalking(false);
        setInChurch(0);
        setFollowing(0);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        wind.start();
        setBanner('Hold inne for å gå dit du peker. Slipp og bli stående tett ved folk for å få dem med.');
        setTimeout(() => setBanner(null), 3600);
    }, [clock, sounds, wind]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        movingRef.current = false;
        setIsWalking(false);
        wind.stop();
    }, [wind]);

    const igjen = HUSFOLK.length - inChurch;

    return (
        <MicroGameScaffold
            title="Søndag morgen 1740"
            subtitle="Du er husbond. Loven sier at hele husholdet skal i kirken - få dem inn før klokka slutter å ringe"
            estimatedSeconds={170}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 1.55, START_Z] as [number, number, number], fov: 62 },
                background: '#ccd7de',
                fog: { color: '#ccd7de', near: 22, far: 60 },
                light: 'overcast',
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#ccd7de] to-[#dde2d8]"
            overlays={
                <>
                    <Crosshair show={gameState === 'playing'} crosshairRef={aim.ref} variant="dot" />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Klokka ringer"
                            warnBelow={20}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'I kirken', value: inChurch },
                                { label: 'Med deg', value: following },
                            ]}
                        />
                    )}
                    <SceneBanner message={banner} wide />
                    {gameState === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-black/45 text-white/80 rounded-xl text-xs text-center max-w-sm leading-relaxed">
                                En norsk gård en søndag morgen i 1740. Kirkeklokka har begynt å
                                ringe.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <TunetScene
                    key={attempt}
                    gameState={gameState}
                    attempt={attempt}
                    isWalking={isWalking}
                    camPosRef={camPosRef}
                    movingRef={movingRef}
                    steerRef={steerRef}
                    aimYRef={aimYRef}
                    onAim={handleAim}
                    onHoldChange={handleHold}
                    onGather={handleGather}
                    onDeliver={handleDeliver}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Fem i huset holder på med noe som er forbudt på en helligdag: hogge ved,
                        spille kort, danse, selge fisk og sove ut. Hold inne museknappen for å gå
                        dit du peker: høyt i bildet går du framover, lavt rygger du tilbake. Slipp
                        og bli stående helt stille tett ved en av dem - først da hører de på deg.
                        Somler du, driver de lenger vekk.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow"
                    >
                        Klokka ringer - få dem i kirken
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={inChurch / HUSFOLK.length}
                    label={`I kirken: ${inChurch} av ${HUSFOLK.length}`}
                    hint="Stå stille tett ved en person for å overtale. Gå så inn gjennom kirkegjerdet med dem du har med deg."
                    labels={{ normal: 'Tunet er fullt', warn: 'Halvveis', danger: 'Nesten inne' }}
                />
            )}

            {gameState === 'late' && (
                <LoseScreen title="Klokka stoppet - og noen manglet" onRetry={begin}>
                    {igjen} av husets folk ble borte fra kirken. Etter forordningen av 1735 fikk de
                    bot, og den som ikke kunne betale, måtte stå i gapestokken på kirkegården: én
                    time første gang, to timer andre gang, tre timer tredje gang. Prøv igjen - stå
                    helt stille når du overtaler, og ta med flere om gangen.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title="Hele husholdet er inne"
                    onReplay={begin}
                    onNext={() => onComplete({ score: Math.max(0.4, 1 - fails * 0.2), completed: true })}
                >
                    Det var nettopp dette loven krevde. Sabbatsforordningen av 12. mars 1735 la
                    ansvaret på husbonden: han skulle sørge for at barn og tjenestefolk møtte fram.
                    Dans, kortspill, gjestebud og handel var forbudt hele dagen. Slik nådde
                    statspietismen helt inn på gårdstunet - og inn i søndagen din.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default Helligdagsplikten3D;
