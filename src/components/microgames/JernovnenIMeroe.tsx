import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Hotspot,
    GroundPlane,
    Rock,
    Person,
    Smoke,
    Fire,
    Burst,
    GlowMaterial,
    Particles,
    useGameClock,
    useMeter,
    TimerPill,
    DangerVignette,
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

// Pedagogisk kjerne: Meroë ble rikt fordi byen hadde både jernmalm og skog til
// trekull. Men jern kommer ikke av seg selv. Ovnen må holdes i et smalt
// temperaturvindu, hele tiden, for hånd. Eleven kjenner på kroppen hvorfor
// slagghaugene rundt Meroë er så store, og hvorfor jern var verdt så mye.

const BLOOMS_NEEDED = 3;
const TIME_LIMIT = 90;
// Temperaturvinduet der jernet faktisk klumper seg. Under BAND_LOW skjer det
// ingenting; over BAND_HIGH stopper klumpen å vokse OG faren begynner å telle.
const BAND_LOW = 0.5;
const BAND_HIGH = 0.9;
// Hvor mye av en klump som blir til per sekund mens ovnen står i vinduet.
const BLOOM_PER_SECOND = 0.22;
// Hvor mye luft ett prosentpoeng loddrett pekerbevegelse gir.
const AIR_PER_PCT = 0.0062;
// Taket på hvor fort varmen kan stige, målt per sekund. Uten dette avgjør
// nettleserens pekerfrekvens hvor fort ovnen varmes opp, og ett raskt drag
// ville fylt måleren på et øyeblikk.
const MAX_AIR_PER_SECOND = 0.42;
// Ovnen tåler et øyeblikks overoppheting. Først når den har stått over
// faregrensa i halvannet sekund til sammen, renner jernet ut som slagg. Da får
// eleven en ekte sjanse til å slippe belgen, i stedet for å tape på et blunk.
const DANGER_AT = BAND_HIGH;
const DANGER_SECONDS = 1.5;

type GameState = 'idle' | 'playing' | 'won' | 'overheated' | 'timeout';

// ---- Palme: stamme med vifteblad. Kit-Tree er en grankjegle og hører ikke
// hjemme ved Nilen. ----
function Palme({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 1.35, 0]} rotation={[0, 0, 0.07]} castShadow>
                <cylinderGeometry args={[0.09, 0.15, 2.7, 7]} />
                <meshStandardMaterial color="#8a6b45" roughness={1} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <mesh
                    key={i}
                    position={[0, 2.66, 0]}
                    rotation={[0.55, (i * Math.PI) / 3, 0]}
                    castShadow
                >
                    <boxGeometry args={[0.16, 0.05, 1.5]} />
                    <meshStandardMaterial color="#4f7a38" roughness={0.95} />
                </mesh>
            ))}
        </group>
    );
}

// ---- Bakgrunn: pyramidefeltet ved Meroë. Ren dekor, derfor holdt utenfor den
// mekaniske scene-revisjonen. ----
function MeroeBakgrunn() {
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {/* Nubiske pyramider: mye brattere og mindre enn de egyptiske */}
            {[
                [-9, -17, 2.0, 6.2],
                [-4.4, -19, 1.7, 5.4],
                [1.2, -18, 2.2, 6.8],
                [6.6, -20, 1.6, 5.0],
                [11.5, -17.5, 1.9, 5.8],
            ].map(([x, z, r, h], i) => (
                <mesh key={i} position={[x, h / 2, z]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[r, h, 4]} />
                    <meshStandardMaterial color="#c9a978" roughness={1} flatShading />
                </mesh>
            ))}

            {/* Palmelunden langs Nilen. Skogen her ga trekullet ovnene levde av. */}
            {[
                [-13, -11.5, 1.05],
                [-8.6, -13, 0.9],
                [-4.2, -11, 1.0],
                [5.2, -11.5, 0.95],
                [9.4, -13, 1.05],
                [13.4, -11, 0.85],
            ].map(([x, z, sc], i) => (
                <Palme key={i} position={[x, 0, z]} scale={sc} />
            ))}

            {/* Folk som arbeider lenger bak i verkstedet */}
            <Person position={[-4.6, 0, -3.4]} rotation={[0, 0.7, 0]} body="#b2603a" pose="idle" />
            <Person position={[4.9, 0, -3.8]} rotation={[0, -0.6, 0]} body="#8a5a8c" pose="walk" />
        </group>
    );
}

// ---- Selve ovnen med belgene. Alt dampes mot varmen. ----
function Ovnen({
    heatRef,
    pumpRef,
    playing,
}: {
    heatRef: React.MutableRefObject<number>;
    pumpRef: React.MutableRefObject<boolean>;
    playing: boolean;
}) {
    const mouthRef = useRef<THREE.Mesh>(null);
    const leftBag = useRef<THREE.Mesh>(null);
    const rightBag = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.PointLight>(null);
    const squeeze = useRef(1);

    useFrame(({ clock }, dt) => {
        const heat = heatRef.current;
        const t = clock.getElapsedTime();

        // Belgene pustes sammen og ut i takt så lenge eleven holder inne.
        const target = pumpRef.current && playing ? 0.55 + Math.sin(t * 7) * 0.3 : 1;
        squeeze.current = damp(squeeze.current, target, dt, 9);
        if (leftBag.current) leftBag.current.scale.y = squeeze.current;
        if (rightBag.current) rightBag.current.scale.y = 2 - squeeze.current;

        // Ovnsmunnen går fra mørk rød til gulhvit med varmen.
        if (mouthRef.current) {
            const mat = mouthRef.current.material as THREE.MeshBasicMaterial;
            const flicker = 0.92 + Math.sin(t * 17) * 0.08;
            mat.color.setRGB(
                Math.min(1, 0.25 + heat * 1.1) * flicker,
                Math.min(1, heat * heat * 1.25) * flicker,
                Math.min(1, Math.max(0, heat - 0.72) * 2.4) * flicker
            );
        }
        if (glowRef.current) {
            glowRef.current.intensity = damp(glowRef.current.intensity, heat * 5.5, dt, 6);
        }
    });

    return (
        <group>
            {/* Leirovnen: bred fot, smalere topp */}
            <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.52, 0.96, 2.04, 14]} />
                <meshStandardMaterial color="#9c6b45" roughness={1} />
            </mesh>
            {/* Leirbånd rundt ovnen */}
            <mesh position={[0, 1.34, 0]}>
                <cylinderGeometry args={[0.62, 0.68, 0.18, 14]} />
                <meshStandardMaterial color="#82563a" roughness={1} />
            </mesh>

            {/* Munnen der jernklumpen tas ut */}
            <mesh ref={mouthRef} position={[0, 0.5, 1.02]}>
                <circleGeometry args={[0.26, 18]} />
                <meshBasicMaterial color="#3a1005" toneMapped={false} />
            </mesh>
            <pointLight ref={glowRef} color="#ff8320" intensity={0} distance={8} position={[0, 0.7, 1.35]} />

            {/* To skinnbelger med hvert sitt blåserør inn i ovnsfoten */}
            <group position={[-1.58, 0, 0.72]}>
                <mesh ref={leftBag} position={[0, 0.33, 0]} castShadow>
                    <sphereGeometry args={[0.33, 14, 10]} />
                    <meshStandardMaterial color="#7a5334" roughness={0.85} />
                </mesh>
                <mesh position={[0.72, 0.26, -0.3]} rotation={[0, 0, -Math.PI / 2.3]} castShadow>
                    <cylinderGeometry args={[0.06, 0.06, 1.5, 8]} />
                    <meshStandardMaterial color="#6b6b6b" roughness={0.7} metalness={0.3} />
                </mesh>
            </group>
            <group position={[1.58, 0, 0.72]}>
                <mesh ref={rightBag} position={[0, 0.33, 0]} castShadow>
                    <sphereGeometry args={[0.33, 14, 10]} />
                    <meshStandardMaterial color="#7a5334" roughness={0.85} />
                </mesh>
                <mesh position={[-0.72, 0.26, -0.3]} rotation={[0, 0, Math.PI / 2.3]} castShadow>
                    <cylinderGeometry args={[0.06, 0.06, 1.5, 8]} />
                    <meshStandardMaterial color="#6b6b6b" roughness={0.7} metalness={0.3} />
                </mesh>
            </group>

            {/* Glødende trekull i en grop foran ovnen */}
            <mesh position={[0, 0.015, 1.24]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.3, 16]} />
                <GlowMaterial color="#c2410c" />
            </mesh>
        </group>
    );
}

// ---- Hele 3D-scenen ----
function VerkstedScene({
    playing,
    ready,
    blooms,
    heatRef,
    pumpRef,
    hot,
    onAim,
    onHold,
    onPullOut,
}: {
    playing: boolean;
    ready: boolean;
    blooms: number;
    heatRef: React.MutableRefObject<number>;
    pumpRef: React.MutableRefObject<boolean>;
    hot: boolean;
    onAim: (x: number, y: number) => void;
    onHold: (holding: boolean) => void;
    onPullOut: () => void;
}) {
    return (
        <>
            <PovCamera position={[0, 2.35, 7.1]} lookAt={[0, 1.05, -1.2]} sway={0.012} />
            <AimPlane
                enabled={playing}
                position={[0, 3, -26]}
                size={[90, 50]}
                onAim={onAim}
                onHoldChange={onHold}
            />

            <GroundPlane size={52} depth={46} color="#d3b681" position={[0, 0, -6]} />
            <MeroeBakgrunn />

            <Ovnen heatRef={heatRef} pumpRef={pumpRef} playing={playing} />

            {/* Røyk og flamme fra toppen av ovnen når det er varmt */}
            <Fire position={[0, 2.04, 0]} scale={0.5} lit={hot} />
            <Smoke origin={[0, 2.25, 0]} show={playing} count={5} color="#8d8478" />

            {/* Trekullhaug til venstre, slagghaug til høyre */}
            <group>
                <Rock position={[-2.55, 0.2, 1.75]} color="#2f2b28" scale={0.8} />
                <Rock position={[-3.05, 0.16, 1.35]} color="#38322d" scale={0.6} />
                <Rock position={[-2.35, 0.14, 1.2]} color="#26221f" scale={0.55} />
            </group>
            <group>
                <Rock position={[2.6, 0.24, 1.2]} color="#79837a" scale={0.9} />
                <Rock position={[3.2, 0.18, 1.65]} color="#6c766d" scale={0.7} />
                <Rock position={[2.95, 0.15, 0.65]} color="#838d83" scale={0.55} />
                <Rock position={[2.25, 0.13, 1.85]} color="#727c73" scale={0.5} />
            </group>

            {/* Gnister over ovnen mens den er varm */}
            {hot && (
                <Particles preset="embers" count={20} center={[0, 2.3, 0]} area={[0.9, 0.9]} height={2.2} />
            )}

            {ready && playing && (
                <Hotspot
                    position={[0, 1.15, 1.35]}
                    radius={0.42}
                    onSelect={onPullOut}
                    label="Ta ut jernklumpen"
                    state="correct"
                />
            )}

            <Burst position={[0, 0.7, 1.2]} trigger={blooms} />
        </>
    );
}

// ---- Hovedelement ----
const JernovnenIMeroe: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [gameState, setGameState] = useState<GameState>('idle');
    const [blooms, setBlooms] = useState(0);
    const [progress, setProgress] = useState(0);
    const [ready, setReady] = useState(false);
    const [danger, setDanger] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);

    const heatRef = useRef(0);
    const pumpRef = useRef(false);
    const lastYRef = useRef(50);
    const lastMoveAtRef = useRef(0);
    const progressRef = useRef(0);
    const bloomsRef = useRef(0);
    const readyRef = useRef(false);
    const overheatRef = useRef(0);
    const stateRef = useRef<GameState>('idle');
    const failsRef = useRef(0);
    const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);
    useEffect(() => {
        failsRef.current = fails;
    }, [fails]);

    const flash = useCallback((message: string, ms = 2600) => {
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        setBanner(message);
        bannerTimer.current = setTimeout(() => setBanner(null), ms);
    }, []);

    const fail = useCallback(
        (kind: 'overheated' | 'timeout') => {
            if (stateRef.current !== 'playing') return;
            sounds.play('incorrect');
            pumpRef.current = false;
            setFails((f) => f + 1);
            setBanner(null);
            setGameState(kind);
        },
        [sounds]
    );

    const heat = useMeter({ drainPerSecond: 0.22, overloadAt: 2, recoverTo: 0 });
    const heatPeek = heat.peek;

    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => fail('timeout'),
    });

    // Scenen leser varmen per frame gjennom en ref, aldri gjennom state.
    useEffect(() => {
        heatRef.current = heat.value;
    }, [heat.value]);

    const win = useCallback(() => {
        sounds.play('complete');
        pumpRef.current = false;
        setBanner(null);
        setGameState('won');
        onComplete({ score: Math.max(0.4, 1 - failsRef.current * 0.15), completed: true });
    }, [sounds, onComplete]);

    // Klumpen vokser bare mens ovnen står i vinduet. Egen takt (10 Hz) i stedet
    // for per frame - da trenger scenen aldri å re-rendre for progresjonen.
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            const h = heatPeek();
            // Faresonen først: den gjelder uansett om en klump er klar.
            if (h >= DANGER_AT) {
                overheatRef.current += 0.1;
                setDanger(Math.min(1, overheatRef.current / DANGER_SECONDS));
                if (overheatRef.current >= DANGER_SECONDS) {
                    fail('overheated');
                    return;
                }
            } else if (overheatRef.current > 0) {
                overheatRef.current = Math.max(0, overheatRef.current - 0.15);
                setDanger(Math.min(1, overheatRef.current / DANGER_SECONDS));
            }
            if (readyRef.current) return;
            if (h < BAND_LOW || h > BAND_HIGH) return;
            progressRef.current = Math.min(1, progressRef.current + BLOOM_PER_SECOND * 0.1);
            setProgress(progressRef.current);
            if (progressRef.current >= 1) {
                readyRef.current = true;
                setReady(true);
                sounds.play('correct');
                flash('Klumpen er ferdig. Klikk på ovnsmunnen og dra den ut!', 3200);
            }
        }, 100);
        return () => clearInterval(t);
    }, [gameState, heatPeek, sounds, flash, fail]);

    // Kjernemekanikken: loddrett pekerbevegelse mens knappen holdes inne er
    // belgtaket. Fart og utholdenhet blir luft, og luft blir varme.
    const handleAim = useCallback(
        (_x: number, yPct: number) => {
            const prev = lastYRef.current;
            lastYRef.current = yPct;
            if (stateRef.current !== 'playing' || !pumpRef.current) return;
            const now = performance.now();
            const dt = Math.min(0.25, (now - lastMoveAtRef.current) / 1000);
            lastMoveAtRef.current = now;
            const dy = Math.abs(yPct - prev);
            heat.add(Math.min(dy * AIR_PER_PCT, MAX_AIR_PER_SECOND * dt));
        },
        [heat]
    );

    const handleHold = useCallback((holding: boolean) => {
        pumpRef.current = holding;
        if (holding) lastMoveAtRef.current = performance.now();
    }, []);

    const pullOut = useCallback(() => {
        if (stateRef.current !== 'playing' || !readyRef.current) return;
        sounds.play('advance');
        readyRef.current = false;
        setReady(false);
        progressRef.current = 0;
        setProgress(0);
        // Å åpne ovnen slipper ut varme. Neste klump starter kaldere.
        heat.add(-0.28);
        bloomsRef.current += 1;
        setBlooms(bloomsRef.current);
        if (bloomsRef.current >= BLOOMS_NEEDED) {
            win();
        } else {
            flash(`Jernklump ${bloomsRef.current} av ${BLOOMS_NEEDED} er ute. Ovnen kjølnet - fyr opp igjen.`);
        }
    }, [sounds, heat, win, flash]);

    const begin = useCallback(() => {
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        heat.reset();
        heatRef.current = 0;
        pumpRef.current = false;
        lastYRef.current = 50;
        lastMoveAtRef.current = performance.now();
        progressRef.current = 0;
        bloomsRef.current = 0;
        readyRef.current = false;
        overheatRef.current = 0;
        setDanger(0);
        clock.restart();
        setProgress(0);
        setBlooms(0);
        setReady(false);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        flash('Hold inne museknappen og dra opp og ned for å pumpe belgene.', 3600);
    }, [heat, clock, sounds, flash]);

    const resetAll = useCallback(() => {
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        pumpRef.current = false;
        progressRef.current = 0;
        bloomsRef.current = 0;
        readyRef.current = false;
        overheatRef.current = 0;
        setDanger(0);
        heat.reset();
        heatRef.current = 0;
        setBanner(null);
        setProgress(0);
        setBlooms(0);
        setReady(false);
        setGameState('idle');
    }, [heat]);

    useEffect(
        () => () => {
            if (bannerTimer.current) clearTimeout(bannerTimer.current);
        },
        []
    );

    // Selvspill-krok (kun i DEV): lar en bot lese nøyaktig det eleven ser.
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        (window as unknown as { __jernovnenDebug?: unknown }).__jernovnenDebug = {
            state: gameState,
            heat: heat.value,
            progress,
            blooms,
            ready,
            remaining: clock.remaining,
        };
    }, [gameState, heat.value, progress, blooms, ready, clock.remaining]);

    const playing = gameState === 'playing';
    const hot = playing && heat.value > 0.42;
    const score = Math.max(0.4, 1 - fails * 0.15);

    return (
        <MicroGameScaffold
            title="Jernovnen i Meroë"
            subtitle="Pump belgene og hold ovnen akkurat varm nok til å lage jern"
            estimatedSeconds={160}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 2.35, 7.1] as [number, number, number], fov: 55 },
                background: '#e8c99a',
                fog: { color: '#e8c99a', near: 16, far: 46 },
                light: 'golden',
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#f2d9ac] to-[#d9b984]"
            overlays={
                <>
                    <DangerVignette level={danger} />
                    <SceneBanner message={banner} wide />
                    {playing && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Jernklumper', value: `${blooms} / ${BLOOMS_NEEDED}` },
                                { label: 'Klumpen vokser', value: Math.round(progress * 100), unit: '%' },
                            ]}
                        />
                    )}
                    {playing && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Trekullet varer"
                            warnBelow={15}
                            corner="br"
                        />
                    )}
                    <DragHint show={gameState === 'idle'} corner="bc">
                        Hold inne og dra opp og ned
                    </DragHint>
                </>
            }
            scene={
                <VerkstedScene
                    key={attempt}
                    playing={playing}
                    ready={ready}
                    blooms={blooms}
                    heatRef={heatRef}
                    pumpRef={pumpRef}
                    hot={hot}
                    onAim={handleAim}
                    onHold={handleHold}
                    onPullOut={pullOut}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Du står ved en jernovn i Meroë. Hold inne museknappen og dra pekeren opp og
                        ned for å pumpe belgene. Ovnen må holdes i det gule feltet på måleren: blir
                        den for kald, skjer ingenting, og blir den for varm, smelter jernet til
                        slagg. Tre jernklumper skal ut før trekullet tar slutt.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-800 transition shadow"
                    >
                        Tenn på ovnen
                    </button>
                </div>
            )}

            {playing && (
                <MeterBar
                    value={heat.value}
                    label="Varmen i ovnen"
                    warnAt={BAND_LOW}
                    dangerAt={BAND_HIGH}
                    labels={{ normal: 'For kald', warn: 'Jernet klumper seg', danger: 'FOR VARMT!' }}
                    hint="Pump for å få opp varmen, og slipp før måleren går helt i rødt. Ovnen kjølner av seg selv hele tiden."
                />
            )}

            {gameState === 'overheated' && (
                <LoseScreen title="Ovnen gikk for varmt" onRetry={begin}>
                    Da ble jernet flytende og rant ned i bunnen som slagg. Smedene i Meroë måtte
                    treffe et smalt vindu: varmt nok til at jernet klumpet seg, men ikke så varmt at
                    det smeltet. Prøv igjen, og slipp belgene før måleren går i rødt.
                </LoseScreen>
            )}

            {gameState === 'timeout' && (
                <LoseScreen title="Trekullet tok slutt" onRetry={begin}>
                    En ovn slukner uten trekull, og trekull krever skog. Det var nettopp derfor
                    kongene i Kusj flyttet hovedstaden sør til Meroë, der det var både jernmalm og
                    trær. Prøv igjen, og hold varmen oppe i stedet for å la ovnen kjølne mellom
                    hvert tak.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={`${BLOOMS_NEEDED} jernklumper er ute av ovnen`}
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Du brukte drøyt ett minutt på tre klumper. Meroë holdt dette gående i
                    århundrer, og haugene av slagg rundt byen ligger der fortsatt. Jern ga bedre
                    plogjern, bedre våpen og varer å selge - og det gjorde Kusj rikt lenge etter at
                    riket hadde mistet Egypt.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default JernovnenIMeroe;
