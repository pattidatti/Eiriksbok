import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    AimPlane,
    Seascape,
    Boat,
    Building,
    Particles,
    useGameClock,
    useAmbience,
    TimerPill,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: vinden bestemte. Et seilskip på Indiahavet kom bare fram
// når det seilte med monsunen, og sesongen tok slutt. Eleven kjenner selv at
// beste kurs verken er rett mot målet eller rett med vinden, men midt imellom -
// og at når monsunen snur, hjelper ingen sjømannskunst.

// Avstand til India i spill-enheter. Kalibrert slik at en som ikke styrer etter
// vinden ikke rekker fram før monsunen snur, mens en som leser farten vinner.
const DIST = 115;
const SPEED = 3.0;
const TIME_LIMIT = 75;
const MAX_HEADING = 1.0;
const DRIFT_LIMIT = 6;

// Monsunfaser: retningen vinden BLÅSER mot (0 = rett mot India, altså +Z).
const WIND_PHASES = [
    { until: 16, dir: 0, text: 'Sørvestmonsunen står rett i ryggen. Hold pekeren nede og seil.' },
    { until: 32, dir: 1.15, text: 'Vinden dreier. Legg kursen litt ut mot vinden.' },
    { until: 48, dir: -1.25, text: 'Vinden har snudd til andre siden. Legg om kursen!' },
    { until: 62, dir: 0.95, text: 'Siste gode drag med monsunen. Press på!' },
    { until: 999, dir: 2.7, text: 'Monsunen snur! Nå står vinden rett imot.' },
];

type GameState = 'idle' | 'playing' | 'lost' | 'won';

// Ren modul-RNG (ingen mutert let i useMemo).
function rnd(i: number, salt: number) {
    const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
}

// Skumtopper som stryker forbi: gir fart-følelse. Ren dekor - holdes utenfor
// scene-revisjonens modellboks.
function Whitecaps({ speedRef }: { speedRef: React.MutableRefObject<number> }) {
    const group = useRef<THREE.Group>(null);
    const caps = useMemo(
        () =>
            Array.from({ length: 22 }, (_, i) => ({
                x: (rnd(i, 1) - 0.5) * 34,
                z: rnd(i, 2) * 44 - 10,
                s: 0.5 + rnd(i, 3) * 0.9,
            })),
        []
    );
    useFrame((_, dt) => {
        if (!group.current) return;
        const v = speedRef.current;
        group.current.children.forEach((c, i) => {
            c.position.z -= (v + 0.6) * dt * 2.2;
            if (c.position.z < -12) {
                c.position.z = 34;
                c.position.x = (rnd(i, 4 + c.position.z) - 0.5) * 34;
            }
        });
    });
    return (
        <group ref={group} userData={{ sceneAuditIgnore: true }}>
            {caps.map((c, i) => (
                <mesh key={i} position={[c.x, 0.1, c.z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[c.s * 0.9, c.s * 0.28]} />
                    <meshBasicMaterial color="#f2fbff" transparent opacity={0.75} />
                </mesh>
            ))}
        </group>
    );
}

// Vindpil like over vannflata foran båten. Den ligger lavt og flatt med vilje:
// en pil som svever høyt oppe blir en prikk når den peker rett fra kameraet.
// Nedenfor pilen ligger vindstriper på sjøen, så retningen er lesbar uansett.
function WindArrow({
    windDir,
    followRef,
}: {
    windDir: number;
    followRef: React.MutableRefObject<number>;
}) {
    const group = useRef<THREE.Group>(null);
    const streaks = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!group.current) return;
        group.current.rotation.y = damp(group.current.rotation.y, windDir, dt, 3);
        group.current.position.x = damp(group.current.position.x, followRef.current, dt, 4);
        if (streaks.current) {
            streaks.current.children.forEach((c) => {
                c.position.z += dt * 5.5;
                if (c.position.z > 5.5) c.position.z = -5.5;
            });
        }
    });
    return (
        <group ref={group} position={[0, 0.14, 7.5]}>
            {/* Pila ligger FLATT på sjøen. En pil som står opp blir en prikk når
                den peker rett bort fra kameraet - flat sett ovenfra er den lesbar. */}
            <mesh position={[0, 0, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.42, 3.2]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
            </mesh>
            {/* Spissen: to mothaker som danner en V mot +Z. */}
            <group position={[-0.52, 0, 1.35]} rotation={[0, -0.72, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.42, 1.7]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
                </mesh>
            </group>
            <group position={[0.52, 0, 1.35]} rotation={[0, 0.72, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.42, 1.7]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
                </mesh>
            </group>
            {/* Vindstriper som strømmer langs samme retning. Bevegelsen viser
                hvilken vei vinden går - en strek alene er tvetydig. */}
            <group ref={streaks} userData={{ sceneAuditIgnore: true }}>
                {[-3.6, -2.4, 2.4, 3.6].map((x, i) => (
                    <mesh
                        key={x}
                        position={[x, -0.04, -5 + i * 2.5]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        <planeGeometry args={[0.2, 2.6]} />
                        <meshBasicMaterial color="#f2fbff" transparent opacity={0.6} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// Kysten av India dukker opp av disen helt på slutten av seilasen.
function IndiaKysten({ z }: { z: number }) {
    return (
        <group position={[0, 0, z]}>
            {/* Landmassen er bredere enn 26 enheter og regnes derfor som terreng
                av scene-revisjonen, på linje med bakke- og vannplan. */}
            <mesh position={[0, 0.6, 8]} receiveShadow>
                <boxGeometry args={[34, 1.3, 20]} />
                <meshStandardMaterial color="#c9b184" roughness={1} />
            </mesh>
            <Building position={[-5.4, 1.25, 0.4]} w={2.4} h={1.8} d={2} body="#efe4cf" roof="#b08b5c" seed={3} />
            <Building position={[0, 1.25, 1.2]} w={3} h={2.4} d={2.4} body="#e7d9bf" roof="#a67f52" seed={7} />
            <Building position={[5.6, 1.25, 0.2]} w={2.2} h={1.6} d={2} body="#f2e8d5" roof="#b08b5c" seed={11} />
            <Building position={[-11, 1.25, 2.4]} w={2} h={1.5} d={1.8} body="#eadfc6" roof="#a67f52" seed={5} />
            <Building position={[10.8, 1.25, 2]} w={2.2} h={1.7} d={2} body="#f0e6d2" roof="#b08b5c" seed={9} />
        </group>
    );
}

function SeilScene({
    playing,
    windDir,
    onTick,
    onArrive,
    onEdge,
}: {
    playing: boolean;
    windDir: number;
    onTick: (progressPct: number, forwardPct: number) => void;
    onArrive: () => void;
    onEdge: () => void;
}) {
    const boat = useRef<THREE.Group>(null);
    const targetHeading = useRef(0);
    const heading = useRef(0);
    const sails = useRef(false);
    const progress = useRef(0);
    const driftX = useRef(0);
    const speedRef = useRef(0);
    const arrived = useRef(false);
    const edgeCooldown = useRef(0);
    const lastReport = useRef(-1);
    const [coastZ, setCoastZ] = useState<number | null>(null);
    const { camera } = useThree();
    const look = useRef(new THREE.Vector3());

    const handleAim = useCallback((xPct: number) => {
        targetHeading.current = (xPct / 100 - 0.5) * 2 * MAX_HEADING;
    }, []);

    const handleHold = useCallback((holding: boolean) => {
        sails.current = holding;
    }, []);

    useFrame((_, dtRaw) => {
        const dt = Math.min(dtRaw, 0.05);
        heading.current = damp(heading.current, playing ? targetHeading.current : 0, dt, 3.2);

        const align = Math.cos(heading.current - windDir);
        const push = playing && sails.current ? SPEED * Math.max(0, align) : 0;
        speedRef.current = push;

        if (playing && !arrived.current) {
            progress.current += push * Math.cos(heading.current) * dt;
            driftX.current += push * Math.sin(heading.current) * dt;
            if (driftX.current > DRIFT_LIMIT || driftX.current < -DRIFT_LIMIT) {
                driftX.current = Math.max(-DRIFT_LIMIT, Math.min(DRIFT_LIMIT, driftX.current));
                edgeCooldown.current -= dt;
                if (edgeCooldown.current <= 0) {
                    edgeCooldown.current = 3;
                    onEdge();
                }
            }
            if (progress.current >= DIST) {
                arrived.current = true;
                onArrive();
            }
        }

        if (boat.current) {
            boat.current.position.x = damp(boat.current.position.x, driftX.current, dt, 6);
            boat.current.rotation.y = heading.current;
            boat.current.rotation.z = damp(boat.current.rotation.z, -heading.current * 0.18, dt, 4);
        }

        // Kysten kommer til syne på de siste 15 prosentene.
        const remain = DIST - progress.current;
        if (remain < DIST * 0.15) {
            setCoastZ(8 + (remain / (DIST * 0.15)) * 20);
        } else if (coastZ !== null) {
            setCoastZ(null);
        }

        // Kamera tett bak båten og litt ovenfra, med myk sidefølging. Vinkelen
        // ned mot sjøen er valgt så vindpila og vindstripene er lesbare.
        camera.position.set(damp(camera.position.x, driftX.current * 0.55, dt, 3), 5.2, -7.6);
        look.current.set(driftX.current * 0.75, 0.7, 5);
        camera.lookAt(look.current);

        // Rapporter til DOM kun når heltallet endrer seg.
        const pct = Math.max(0, Math.min(100, Math.round((progress.current / DIST) * 100)));
        const fwd = Math.round(Math.max(0, align) * Math.cos(heading.current) * 100);
        const key = pct * 1000 + Math.max(0, fwd);
        if (key !== lastReport.current) {
            lastReport.current = key;
            onTick(pct, Math.max(0, fwd));
        }
    });

    return (
        <>
            <AimPlane
                enabled={playing}
                position={[0, 3, 13]}
                size={[90, 40]}
                onAim={handleAim}
                onHoldChange={handleHold}
            />
            <Seascape position={[0, 0, 22]} size={[90, 140]} waterY={0.06} color="#2f9ec2">
                <group ref={boat} position={[0, 0.06, 0]}>
                    <Boat color="#7a5232" sail="#f3e6c8" />
                </group>
            </Seascape>
            <Whitecaps speedRef={speedRef} />
            <WindArrow windDir={windDir} followRef={driftX} />
            {coastZ !== null && <IndiaKysten z={coastZ} />}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="motes" />
            </group>
        </>
    );
}

const MonsunSeilasen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [edgeMsg, setEdgeMsg] = useState('');
    const [pct, setPct] = useState(0);
    const [fwd, setFwd] = useState(0);
    const { play } = useStepSounds();
    const { start: startAmbience } = useAmbience('waves');
    const lastPhase = useRef(-1);
    const edgeTimer = useRef<number | null>(null);

    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => {
            setGameState((s) => (s === 'playing' ? 'lost' : s));
        },
    });

    // Monsunen dreier etter faste tider - forutsigbart nok til å læres.
    // Fasen utledes av klokka, så den trenger ingen egen tilstand.
    const elapsed = TIME_LIMIT - clock.remaining;
    const foundPhase = WIND_PHASES.findIndex((p) => elapsed < p.until);
    const phaseIdx = gameState === 'playing' && foundPhase >= 0 ? foundPhase : 0;

    // Effekten spiller bare lyd ved faseskifte - den setter ingen tilstand.
    useEffect(() => {
        if (gameState !== 'playing') {
            lastPhase.current = -1;
            return;
        }
        if (phaseIdx === lastPhase.current) return;
        const first = lastPhase.current === -1;
        lastPhase.current = phaseIdx;
        if (!first) play('sceneChange');
    }, [gameState, phaseIdx, play]);

    useEffect(
        () => () => {
            if (edgeTimer.current !== null) window.clearTimeout(edgeTimer.current);
        },
        []
    );

    const banner = edgeMsg || (gameState === 'playing' ? WIND_PHASES[phaseIdx].text : '');

    // DEV-luke for selvspill/balansetesting. Eksponerer nøyaktig det eleven
    // selv ser på skjermen - ikke noe mer.
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        (window as unknown as { __monsunDebug?: unknown }).__monsunDebug = {
            state: gameState,
            pct,
            fwd,
            windDir: WIND_PHASES[phaseIdx].dir,
            remaining: Math.round(clock.remaining),
        };
    }, [gameState, pct, fwd, phaseIdx, clock.remaining]);

    const restart = clock.restart;
    const begin = useCallback(() => {
        setAttempt((a) => a + 1);
        setPct(0);
        setFwd(0);
        setEdgeMsg('');
        lastPhase.current = -1;
        restart(TIME_LIMIT);
        setGameState('playing');
        startAmbience();
    }, [restart, startAmbience]);

    const handleTick = useCallback((p: number, f: number) => {
        setPct(p);
        setFwd(f);
    }, []);

    const handleArrive = useCallback(() => {
        setGameState((s) => {
            if (s !== 'playing') return s;
            play('complete');
            return 'won';
        });
    }, [play]);

    const handleEdge = useCallback(() => {
        setEdgeMsg('Du driver ut av leia. Legg kursen inn igjen.');
        if (edgeTimer.current !== null) window.clearTimeout(edgeTimer.current);
        edgeTimer.current = window.setTimeout(() => setEdgeMsg(''), 2200);
    }, []);

    const score = Math.max(0.5, Math.min(1, clock.remaining / TIME_LIMIT + 0.5));

    return (
        <MicroGameScaffold
            title="Monsunseilasen"
            subtitle="Seil lasten fra Kilwa til India før monsunen snur"
            estimatedSeconds={150}
            onRetry={gameState !== 'idle' ? begin : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 5.2, -7.6] as [number, number, number], fov: 55 },
                background: '#bfe4f4',
                fog: { color: '#d8eef7', near: 30, far: 86 },
                light: 'noon',
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#a9d8ee] via-[#cfe8f2] to-[#e8dfc4]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Seilt', value: pct, unit: '%' },
                                { label: 'Fart mot India', value: fwd, unit: '%' },
                            ]}
                        />
                    )}
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Sesong igjen"
                            warnBelow={16}
                            corner="br"
                        />
                    )}
                </>
            }
            scene={
                <SeilScene
                    key={attempt}
                    playing={gameState === 'playing'}
                    windDir={WIND_PHASES[phaseIdx].dir}
                    onTick={handleTick}
                    onArrive={handleArrive}
                    onEdge={handleEdge}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed max-w-lg mx-auto">
                        Du er om bord i en dhow full av gull og elfenbein. Hold inne museknappen
                        for å sette seil, og flytt pekeren til venstre eller høyre for å styre.
                        Skipet får bare fart når vinden kommer bakfra. Følg med på hvit vindpil og
                        på tallet «Fart mot India».
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-800 transition shadow"
                    >
                        Sett seil fra Kilwa
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <p className="text-xs text-slate-600 text-center leading-relaxed">
                    Beste kurs ligger midt mellom vinden og målet. Jag det høyeste tallet på «Fart
                    mot India».
                </p>
            )}

            {gameState === 'lost' && (
                <LoseScreen title="Monsunen snudde før du nådde fram" onRetry={begin}>
                    Sesongen var over, og vinden sto rett imot. Skipet måtte snu, og handelsmannen
                    ble liggende i havna til vinden kom tilbake et halvt år senere. Prøv igjen, og
                    hold farten oppe mens du har monsunen med deg.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title="Du nådde India på monsunen!"
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Slik gikk handelen over Indiahavet i hundrevis av år. Vinden bestemte når du
                    kunne dra, hvor fort du kom fram, og når du måtte bli liggende. Byene på
                    swahilikysten ble rike fordi de lå akkurat der vinden snudde.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default MonsunSeilasen3D;
