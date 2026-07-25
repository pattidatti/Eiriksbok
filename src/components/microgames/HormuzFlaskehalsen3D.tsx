import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    AimPlane,
    Mover,
    Seascape,
    Boat,
    Building,
    Hill,
    Rock,
    Tower,
    Smoke,
    Burst,
    Explosion,
    useMeter,
    useGameClock,
    useCrosshair,
    useAmbience,
    Crosshair,
    DangerVignette,
    ScreenFlash,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    SceneFact,
    DataReadout,
    DragHint,
    StepTracker,
    faceAlong,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Krigen mellom USA og Iran" (2026).
//
// Lyspære-øyeblikket: et sund som bare er 33 kilometer bredt på det trangeste
// bestemmer hva verden betaler for olje - og dermed hva foreldrene dine betaler
// for bensin.
//
// Mekanikken ER poenget: eleven loser tankskip gjennom Hormuzstredet i sanntid.
// Hold inne for å kjøre, pek dit du vil styre. Ute i Persiabukta er det god
// plass. Inne i det trangeste er lanen så smal at vrak og angrepsbåter dekker
// nesten hele bredden, og en live-avlesning viser bredden i kilometer krympe fra
// over hundre til 33 mens skipet kjører inn i flaskehalsen. Hvert skip som
// kommer gjennom presser oljeprisen ned, hvert skip som går tapt presser den opp
// - og bensinprisen i Norge følger med på lasset.

const SEA_X = 58; // sjøens bredde (x)
const SEA_Z = 42; // sjøens dybde (z)
const WATER_Y = 0.04;

const NARROW_HALF = 3.2; // halv seilbar bredde på det trangeste (verdensenheter)
const WIDE_HALF = 12; // halv seilbar bredde ute i åpent farvann
const CURVE_X = 22; // hvor langt ut kysten åpner seg helt
const KM_PER_UNIT = 33 / (NARROW_HALF * 2); // 33 km = det trangeste stedet

const START_X = -18.5;
const GOAL_X = 18.5;
const SHIP_HALF = 0.7;
const SHIP_SPEED = 5.0;

const TIME_LIMIT = 100;
const GOAL_SHIPS = 5;
const MAX_LOST = 4;

const WRECK_HIT = 1.7;
const PATROL_RANGE = 2.3;

// Kysten: åpen ute i bukten, klemt sammen i midten. Én funksjon eier både
// landmassene, hvor langt skipet kan styre og bredde-avlesningen i km - så
// geometrien og tallet eleven leser kan aldri komme i utakt.
function coastHalf(x: number): number {
    const t = Math.min(1, Math.abs(x) / CURVE_X);
    return NARROW_HALF + (WIDE_HALF - NARROW_HALF) * Math.pow(t, 1.7);
}

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

// Oljeprisen i artikkelen: rundt 70 dollar fatet før krigen, over 110 da
// stredet var stengt. Flyt gjennom stredet trekker prisen ned igjen.
function priceFor(through: number, lost: number): number {
    return clamp(110 - through * 8 + lost * 10, 55, 155);
}

// Grovt anslag for pumpeprisen i Norge: avgifter og margin ligger fast, og
// råoljen slår inn med kursen ~9,2 kr per dollar delt på 159 liter i fatet.
function petrolFor(priceUsd: number): number {
    return 15.5 + (priceUsd * 9.2) / 159;
}

// Vrakene ligger i sikksakk, så den rette linja rett gjennom midten er sperret.
// Eleven MÅ veve seg gjennom lanen - og i det trangeste er det knapt plass.
const WRECKS: { x: number; z: number; rot: number }[] = [
    { x: -8.0, z: -1.6, rot: 0.7 },
    { x: 1.0, z: 1.5, rot: -1.2 },
    { x: 10.0, z: -1.8, rot: 2.1 },
];

const QUEUE: [number, number][] = [
    [-20, -7.5],
    [-20, -3],
    [-20, 3],
    [-20, 7.5],
];

type GameState = 'idle' | 'playing' | 'timeout' | 'blockade' | 'won';
type LossKind = 'wreck' | 'attack';

// ============================================================
//  Landmasser: Iran i nord, Oman i sør, med en kyst som klemmer
// ============================================================

// Ren modul-funksjon (ingen muterte let-variabler i useMemo).
function buildLand(side: number): THREE.ExtrudeGeometry {
    const shape = new THREE.Shape();
    const back = -side * (SEA_Z / 2);
    shape.moveTo(-SEA_X / 2, back);
    shape.lineTo(SEA_X / 2, back);
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
        const x = SEA_X / 2 - (SEA_X * i) / steps;
        shape.lineTo(x, -side * coastHalf(x));
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: false });
}

function buildShoal(side: number): THREE.ExtrudeGeometry {
    const shape = new THREE.Shape();
    const back = -side * (SEA_Z / 2);
    shape.moveTo(-SEA_X / 2, back);
    shape.lineTo(SEA_X / 2, back);
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
        const x = SEA_X / 2 - (SEA_X * i) / steps;
        shape.lineTo(x, -side * (coastHalf(x) - 0.75));
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
}

function LandMass({ side, land, shoal }: { side: number; land: string; shoal: string }) {
    const landGeo = useMemo(() => buildLand(side), [side]);
    const shoalGeo = useMemo(() => buildShoal(side), [side]);
    useEffect(() => {
        return () => {
            landGeo.dispose();
            shoalGeo.dispose();
        };
    }, [landGeo, shoalGeo]);
    return (
        <group>
            {/* Grunna rett utenfor stranda - lys sandkant mot vannet */}
            <mesh geometry={shoalGeo} rotation={[-Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color={shoal} roughness={1} />
            </mesh>
            <mesh geometry={landGeo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <meshStandardMaterial color={land} roughness={1} />
            </mesh>
        </group>
    );
}


// Etikett tegnet som ren 3D-tekstur, ikke som DOM. Et drei-`Html`-skilt legger
// et faktisk div oppå canvasen, og midt i stredet ville det spist pekerhendelser
// akkurat der eleven trenger presisjon mest. En billboard-plate gjør ikke det.
function makeTagTexture(text: string, bg: string, fg: string): THREE.CanvasTexture {
    const font = 'bold 44px Inter, system-ui, sans-serif';
    const probe = document.createElement('canvas').getContext('2d');
    if (probe) probe.font = font;
    const textW = probe ? probe.measureText(text).width : text.length * 24;
    const c = document.createElement('canvas');
    c.width = Math.ceil(textW) + 44;
    c.height = 72;
    const ctx = c.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = bg;
        if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(2, 6, c.width - 4, c.height - 12, 14);
            ctx.fill();
        } else {
            ctx.fillRect(2, 6, c.width - 4, c.height - 12);
        }
        ctx.font = font;
        ctx.fillStyle = fg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, c.width / 2, c.height / 2 + 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

function SceneTag({
    position,
    text,
    bg,
    fg,
    height = 0.9,
}: {
    position: [number, number, number];
    text: string;
    bg: string;
    fg: string;
    height?: number;
}) {
    const tex = useMemo(() => makeTagTexture(text, bg, fg), [text, bg, fg]);
    useEffect(() => () => tex.dispose(), [tex]);
    const w = (tex.image as HTMLCanvasElement).width;
    const h = (tex.image as HTMLCanvasElement).height;
    return (
        <Billboard position={position}>
            <mesh raycast={() => null}>
                <planeGeometry args={[(w / h) * height, height]} />
                <meshBasicMaterial map={tex} transparent depthWrite={false} fog={false} />
            </mesh>
        </Billboard>
    );
}

// ============================================================
//  Fartøy
// ============================================================

// Tankskip: kit-Boat som skrog (riktig baug mot +Z), med lastedekk,
// brostruktur og skorstein akterut.
function Tanker({ hull = '#28323f', deck = '#9a6a33' }: { hull?: string; deck?: string }) {
    return (
        <group>
            <group scale={[1.15, 1, 2.3]}>
                <Boat color={hull} />
            </group>
            {/* Lastedekk */}
            <mesh position={[0, 0.6, -0.2]} castShadow>
                <boxGeometry args={[1.0, 0.24, 4.3]} />
                <meshStandardMaterial color={deck} roughness={0.85} />
            </mesh>
            {/* Tanklokk */}
            {[-1.5, -0.4, 0.7, 1.8].map((z) => (
                <mesh key={z} position={[0, 0.78, z]}>
                    <cylinderGeometry args={[0.22, 0.22, 0.16, 10]} />
                    <meshStandardMaterial color="#c9c2b4" roughness={0.7} />
                </mesh>
            ))}
            {/* Brostruktur og skorstein akterut */}
            <mesh position={[0, 0.95, -2.2]} castShadow>
                <boxGeometry args={[0.95, 0.7, 0.9]} />
                <meshStandardMaterial color="#eceae4" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.45, -2.35]} castShadow>
                <cylinderGeometry args={[0.15, 0.17, 0.5, 8]} />
                <meshStandardMaterial color="#8f3a2a" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Brennende vrak etter et skip som ble angrepet. Ligger og sperrer lanen.
function Wreck({ x, z, rot }: { x: number; z: number; rot: number }) {
    return (
        <group position={[x, WATER_Y, z]} rotation={[0, rot, 0]}>
            <group rotation={[0, 0, 0.2]} scale={[1, 1, 1.7]}>
                <Boat color="#48403a" />
            </group>
            <mesh position={[0, 0.5, 0.1]} rotation={[0, 0, 0.25]}>
                <boxGeometry args={[0.7, 0.4, 1.7]} />
                <meshStandardMaterial color="#2c2723" roughness={1} />
            </mesh>
            <mesh position={[0, 0.72, 0.1]}>
                <boxGeometry args={[0.5, 0.22, 1.0]} />
                <meshStandardMaterial color="#e2703a" emissive="#ff5a1f" emissiveIntensity={1.5} />
            </mesh>
            <Smoke origin={[0, 0.9, 0]} count={5} color="#4d4a46" />
        </group>
    );
}

// Iransk angrepsbåt som patruljerer på tvers av lanen.
function Patrol({
    x,
    half,
    speed,
    phase,
    index,
    onPos,
}: {
    x: number;
    half: number;
    speed: number;
    phase: number;
    index: number;
    onPos: (i: number, x: number, z: number) => void;
}) {
    const [leg, setLeg] = useState(0);
    const north: [number, number, number] = [x, WATER_Y, -half];
    const south: [number, number, number] = [x, WATER_Y, half];
    const even = leg % 2 === 0;
    return (
        <Mover
            from={even ? north : south}
            to={even ? south : north}
            speed={speed}
            bob={0.02}
            phase={phase}
            onArrive={() => setLeg((l) => l + 1)}
            onMove={(px, _py, pz) => onPos(index, px, pz)}
        >
            <group scale={[0.85, 0.9, 1.05]}>
                <Boat color="#3b4650" />
            </group>
            <mesh position={[0, 0.62, 0.3]} castShadow>
                <boxGeometry args={[0.42, 0.32, 0.6]} />
                <meshStandardMaterial color="#5a6570" roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.0, 0.1]}>
                <cylinderGeometry args={[0.03, 0.03, 0.9, 5]} />
                <meshStandardMaterial color="#2a323a" />
            </mesh>
            <mesh position={[0, 1.5, 0.1]}>
                <sphereGeometry args={[0.11, 8, 8]} />
                <meshStandardMaterial color="#ff4030" emissive="#ff2010" emissiveIntensity={2.2} />
            </mesh>
        </Mover>
    );
}

// ============================================================
//  3D-scenen: all sanntidslogikk bor her (refs, ingen re-render per frame)
// ============================================================

interface SceneProps {
    playing: boolean;
    runId: number;
    movingRef: React.MutableRefObject<boolean>;
    steerRef: React.MutableRefObject<number>;
    widthRef: React.MutableRefObject<number>;
    shipPosRef: React.MutableRefObject<[number, number]>;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
    dangerAdd: (amount: number) => void;
    onThrough: (x: number, z: number) => void;
    onLost: (kind: LossKind, x: number, z: number) => void;
    through: number;
    burst: number;
    burstAt: [number, number];
    hits: { id: number; x: number; z: number }[];
}

function StraitScene({
    playing,
    runId,
    movingRef,
    steerRef,
    widthRef,
    shipPosRef,
    onAim,
    onHoldChange,
    dangerAdd,
    onThrough,
    onLost,
    through,
    burst,
    burstAt,
    hits,
}: SceneProps) {
    const shipRef = useRef<THREE.Group>(null);
    const posRef = useRef({ x: START_X, z: 0 });
    const patrolsRef = useRef([
        { x: -13, z: 0 },
        { x: 5, z: 0 },
    ]);
    const doneRef = useRef(false);

    const onThroughRef = useRef(onThrough);
    const onLostRef = useRef(onLost);
    const dangerAddRef = useRef(dangerAdd);
    useEffect(() => {
        onThroughRef.current = onThrough;
    }, [onThrough]);
    useEffect(() => {
        onLostRef.current = onLost;
    }, [onLost]);
    useEffect(() => {
        dangerAddRef.current = dangerAdd;
    }, [dangerAdd]);

    // Nytt tankskip: sett det tilbake i Persiabukta.
    useEffect(() => {
        posRef.current = { x: START_X, z: 0 };
        doneRef.current = false;
        shipRef.current?.position.set(START_X, WATER_Y, 0);
        shipRef.current?.rotation.set(0, faceAlong([1, 0]), 0);
        shipPosRef.current = [START_X, 0];
        widthRef.current = coastHalf(START_X) * 2 * KM_PER_UNIT;
    }, [runId, widthRef, shipPosRef]);

    const setPatrol = useCallback((i: number, x: number, z: number) => {
        patrolsRef.current[i] = { x, z };
    }, []);

    useFrame((_state, dt) => {
        const ship = shipRef.current;
        if (!ship) return;
        const p = posRef.current;

        if (!playing || doneRef.current) {
            widthRef.current = coastHalf(p.x) * 2 * KM_PER_UNIT;
            return;
        }

        // Framdrift: skipet kjører bare mens eleven holder inne.
        if (movingRef.current) p.x += dt * SHIP_SPEED;

        // Styring: lanen klemmer seg sammen, så styreutslaget begrenses av kysten.
        const limit = Math.max(0.4, coastHalf(p.x) - SHIP_HALF - 0.25);
        const targetZ = clamp(steerRef.current, -limit, limit);
        const dz = targetZ - p.z;
        p.z = clamp(p.z + dz * Math.min(1, dt * 3.4), -limit, limit);

        ship.position.set(p.x, WATER_Y, p.z);
        shipPosRef.current = [p.x, p.z];
        ship.rotation.y = faceAlong([1, clamp(dz * 0.35, -0.7, 0.7)]);
        ship.rotation.z = clamp(-dz * 0.05, -0.09, 0.09);

        widthRef.current = coastHalf(p.x) * 2 * KM_PER_UNIT;

        // Vrak sperrer lanen: treffer du et, er skipet tapt.
        for (const w of WRECKS) {
            if (Math.hypot(p.x - w.x, p.z - w.z) < WRECK_HIT) {
                doneRef.current = true;
                onLostRef.current('wreck', p.x, p.z);
                return;
            }
        }

        // Angrepsbåtene: jo nærmere du er, jo raskere stiger faren. Kjører du
        // forbi i god avstand rekker faren aldri å bygge seg opp.
        const nearest = patrolsRef.current.reduce(
            (best, b) => Math.min(best, Math.hypot(p.x - b.x, p.z - b.z)),
            999
        );
        if (nearest < PATROL_RANGE) {
            dangerAddRef.current(dt * 1.05 * (1 - nearest / PATROL_RANGE));
        }

        // Ute i åpent hav igjen.
        if (p.x >= GOAL_X) {
            doneRef.current = true;
            onThroughRef.current(p.x, p.z);
        }

        if (import.meta.env.DEV) {
            (window as unknown as Record<string, unknown>).__hormuzDebug = {
                ship: [p.x, p.z],
                moving: movingRef.current,
                steer: steerRef.current,
                limit,
                widthKm: widthRef.current,
                patrols: patrolsRef.current.map((b) => [b.x, b.z]),
                wrecks: WRECKS.map((w) => [w.x, w.z]),
            };
        }
    });

    const waiting = Math.max(0, GOAL_SHIPS - through - 1);

    return (
        <>
            <AimPlane
                enabled={playing}
                followCamera
                followDistance={20}
                size={[120, 90]}
                onAim={onAim}
                onHoldChange={onHoldChange}
                hideCursor
            />

            <Seascape size={[SEA_X, SEA_Z]} waterY={WATER_Y} color="#2f7fa8">
                {/* Iran i nord, Oman i sør */}
                <LandMass side={-1} land="#cfae76" shoal="#e6d2a4" />
                <LandMass side={1} land="#d6b782" shoal="#ead9ad" />

                {/* Kystbyer og terreng - nok til at land ser bebodd ut */}
                <Hill position={[-13, 0.3, -13]} radius={4.5} height={2.6} color="#b99a68" seed={3} />
                <Hill position={[9, 0.3, -14]} radius={4} height={2.2} color="#c2a271" seed={7} />
                <Hill position={[-6, 0.3, 13.5]} radius={4.2} height={2.1} color="#c6a976" seed={11} />
                <Hill position={[13, 0.3, 12.5]} radius={3.6} height={1.9} color="#bd9d6b" seed={5} />
                {[-16, -12.6, 2.4, 5.6].map((x, i) => (
                    <Building
                        key={`n-${x}`}
                        position={[x, 0.55, -coastHalf(x) - 1.6]}
                        body="#efe3cd"
                        roof="#a8724a"
                        w={1.5}
                        h={1.1}
                        d={1.3}
                        seed={i + 1}
                    />
                ))}
                {[-14.5, -3.2, 8.5, 14].map((x, i) => (
                    <Building
                        key={`s-${x}`}
                        position={[x, 0.55, coastHalf(x) + 1.6]}
                        body="#f3ead7"
                        roof="#9c6a45"
                        w={1.5}
                        h={1.0}
                        d={1.3}
                        seed={i + 5}
                    />
                ))}
                <Tower position={[-0.6, 0.55, -6.4]} radius={0.45} height={2.6} color="#e0d3b6" roof="#8c5b3c" />
                <Tower position={[1.4, 0.55, 6.6]} radius={0.45} height={2.4} color="#e6dbc0" roof="#8c5b3c" />
                {[-3.4, 3.6, 10.5].map((x) => (
                    <Rock key={`rn-${x}`} position={[x, 0.3, -coastHalf(x) - 0.4]} color="#b49b74" scale={0.8} />
                ))}
                {[-8.5, 0.6, 6.4].map((x) => (
                    <Rock key={`rs-${x}`} position={[x, 0.3, coastHalf(x) + 0.4]} color="#bda37c" scale={0.8} />
                ))}

                {/* Målestokken: det trangeste stedet er 33 km bredt */}
                <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.18, NARROW_HALF * 2]} />
                    <meshBasicMaterial color="#fbbf24" transparent opacity={0.75} depthWrite={false} />
                </mesh>
                {[-NARROW_HALF, NARROW_HALF].map((z) => (
                    <mesh key={z} position={[0, 0.45, z]}>
                        <cylinderGeometry args={[0.09, 0.09, 0.9, 6]} />
                        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
                    </mesh>
                ))}
                <SceneTag position={[0, 3.6, 0]} text="33 km" bg="#f59e0b" fg="#ffffff" height={1.5} />

                <SceneTag position={[-4, 1.7, -11.5]} text="IRAN" bg="#ffffff" fg="#334155" height={1.2} />
                <SceneTag position={[4, 1.7, 11]} text="OMAN" bg="#ffffff" fg="#334155" height={1.2} />

                {/* Vrak etter skip som alt er angrepet */}
                {WRECKS.map((w) => (
                    <Wreck key={`${w.x}-${w.z}`} x={w.x} z={w.z} rot={w.rot} />
                ))}

                {/* Iranske angrepsbåter på tvers av lanen */}
                <Patrol x={-13} half={3.4} speed={2.2} phase={0.4} index={0} onPos={setPatrol} />
                <Patrol x={5} half={2.2} speed={2.1} phase={1.9} index={1} onPos={setPatrol} />

                {/* Køen i Persiabukta: skip som venter på tur */}
                {QUEUE.slice(0, waiting).map(([x, z]) => (
                    <group key={`q-${x}-${z}`} position={[x, WATER_Y, z]} rotation={[0, faceAlong([1, 0]), 0]}>
                        <Tanker hull="#33404f" deck="#8b6130" />
                    </group>
                ))}

                {/* Skipet eleven loser */}
                <group ref={shipRef} position={[START_X, WATER_Y, 0]} rotation={[0, faceAlong([1, 0]), 0]}>
                    <Tanker />
                </group>

                {hits.map((h) => (
                    <Explosion key={h.id} x={h.x} z={h.z} scale={1.1} />
                ))}
                <Burst position={[burstAt[0], 1.1, burstAt[1]]} trigger={burst} color="#7dd3fc" count={26} spread={4} />
            </Seascape>
        </>
    );
}

// ============================================================
//  Hovedkomponent
// ============================================================

export const HormuzFlaskehalsen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const waves = useAmbience('waves', -30);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [runId, setRunId] = useState(0);
    const [through, setThrough] = useState(0);
    const [lost, setLost] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [widthKm, setWidthKm] = useState(Math.round(coastHalf(START_X) * 2 * KM_PER_UNIT));
    const [price, setPrice] = useState(110);
    const [flash, setFlash] = useState(0);
    const [burst, setBurst] = useState(0);
    const [burstAt, setBurstAt] = useState<[number, number]>([GOAL_X, 0]);
    const [hits, setHits] = useState<{ id: number; x: number; z: number }[]>([]);

    const movingRef = useRef(false);
    const steerRef = useRef(0);
    const widthRef = useRef(coastHalf(START_X) * 2 * KM_PER_UNIT);
    // Skipets posisjon, alltid oppdatert (ikke DEV-avhengig): brukes til å
    // plassere eksplosjonen når angrepsbåtene tar skipet.
    const shipPosRef = useRef<[number, number]>([START_X, 0]);
    const priceTargetRef = useRef(110);
    const stateRef = useRef<GameState>('idle');
    const completedRef = useRef(false);
    const hitIdRef = useRef(0);

    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        priceTargetRef.current = priceFor(through, lost);
    }, [through, lost]);

    // Oljeprisen glir mykt mot målet, så eleven ser tallet bevege seg.
    useEffect(() => {
        const t = setInterval(() => {
            setPrice((p) => {
                const target = priceTargetRef.current;
                return Math.abs(target - p) < 0.06 ? target : p + (target - p) * 0.16;
            });
        }, 80);
        return () => clearInterval(t);
    }, []);

    // Bredde-avlesningen (~8 Hz, aldri per frame).
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => setWidthKm(Math.round(widthRef.current)), 120);
        return () => clearInterval(t);
    }, [gameState]);

    const finish = useCallback(
        (kind: Exclude<GameState, 'idle' | 'playing'>) => {
            if (stateRef.current !== 'playing') return;
            movingRef.current = false;
            setGameState(kind);
        },
        []
    );

    const danger = useMeter({
        drainPerSecond: 0.45,
        overloadAt: 1,
        recoverTo: 0.4,
    });
    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => finish('timeout'),
    });

    const aim = useCrosshair();
    const handleAim = useCallback(
        (xPct: number, yPct: number) => {
            aim.move(xPct, yPct);
            // Skjermens loddrette akse styrer nord/sør i stredet.
            steerRef.current = ((yPct - 50) / 50) * (WIDE_HALF + 1);
        },
        [aim]
    );

    const handleHold = useCallback((holding: boolean) => {
        movingRef.current = holding;
    }, []);

    // Nytt skip fra køen. movingRef røres IKKE her: den speiler om eleven
    // faktisk holder pekeren inne, og et nytt pointerdown kommer ikke bare fordi
    // et skip gikk tapt. Nullstilte vi den, ville neste skip ligge bom stille til
    // eleven slapp og trykket på nytt.
    const nextShip = useCallback(() => {
        danger.reset();
        setRunId((r) => r + 1);
    }, [danger]);

    const handleThrough = useCallback(
        (x: number, z: number) => {
            if (stateRef.current !== 'playing') return;
            const total = through + 1;
            setThrough(total);
            setBurstAt([x, z]);
            setBurst((b) => b + 1);
            sounds.play('correct');
            if (total >= GOAL_SHIPS) {
                sounds.play('complete');
                setBanner(null);
                setGameState('won');
                if (!completedRef.current) {
                    completedRef.current = true;
                    onComplete({
                        score: Math.max(0.5, 1 - lost * 0.15),
                        completed: true,
                        artifact: { through: total, lost },
                    });
                }
                return;
            }
            setBanner(`Tankskip ${total} av ${GOAL_SHIPS} er gjennom. Oljeprisen faller.`);
            nextShip();
        },
        [through, lost, sounds, onComplete, nextShip]
    );

    const handleLost = useCallback(
        (kind: LossKind, x: number, z: number) => {
            if (stateRef.current !== 'playing') return;
            const total = lost + 1;
            setLost(total);
            sounds.play('incorrect');
            setFlash((f) => f + 1);
            const id = ++hitIdRef.current;
            setHits((h) => [...h, { id, x, z }]);
            setTimeout(() => setHits((h) => h.filter((it) => it.id !== id)), 2600);
            setBanner(
                kind === 'wreck'
                    ? 'Skipet gikk på et vrak i lanen. Trafikken stopper, og prisen stiger.'
                    : 'Angrepsbåtene traff skipet. Trafikken stopper, og prisen stiger.'
            );
            if (total >= MAX_LOST) {
                finish('blockade');
                return;
            }
            nextShip();
        },
        [lost, sounds, finish, nextShip]
    );

    // Farenivået bikker over: skipet blir angrepet.
    useEffect(() => {
        if (!danger.overloaded || gameState !== 'playing') return;
        const [sx, sz] = shipPosRef.current;
        handleLost('attack', sx, sz);
        // handleLost er stabil nok her: den leses kun når måleren nettopp bikket.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [danger.overloaded]);

    const begin = useCallback(() => {
        completedRef.current = false;
        setThrough(0);
        setLost(0);
        setHits([]);
        setPrice(110);
        priceTargetRef.current = 110;
        setWidthKm(Math.round(coastHalf(START_X) * 2 * KM_PER_UNIT));
        widthRef.current = coastHalf(START_X) * 2 * KM_PER_UNIT;
        danger.reset();
        clock.restart();
        movingRef.current = false;
        steerRef.current = 0;
        setAttempt((a) => a + 1);
        setRunId((r) => r + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        waves.start();
        setBanner('Hold inne for å kjøre. Pek dit du vil styre skipet.');
        setTimeout(() => setBanner(null), 3600);
    }, [danger, clock, sounds, waves]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        setThrough(0);
        setLost(0);
        setHits([]);
        setPrice(110);
        priceTargetRef.current = 110;
        danger.reset();
        movingRef.current = false;
        waves.stop();
    }, [danger, waves]);

    const playing = gameState === 'playing';
    const petrol = petrolFor(price);
    const priceText = `${Math.round(price)}`;
    const petrolText = petrol.toFixed(2).replace('.', ',');

    return (
        <MicroGameScaffold
            title="Flaskehalsen i Hormuz"
            subtitle="Los tankskipene gjennom stredet, og se hva bredden på et sund gjør med oljeprisen"
            estimatedSeconds={170}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            containerClassName="bg-gradient-to-b from-[#cfe4f0] via-[#dce9ee] to-[#e7dcc3]"
            canvas={{
                controls: false,
                camera: { position: [0, 30, 20] as [number, number, number], fov: 50 },
                target: [0, 0.3, 0] as [number, number, number],
                background: '#d8e8f1',
                fog: { color: '#dfe9ee', near: 46, far: 108 },
                light: 'noon',
                contactShadows: false,
            }}
            overlays={
                <>
                    <Crosshair show={playing} crosshairRef={aim.ref} variant="dot" />
                    <ScreenFlash trigger={flash} preset="damage" durationMs={220} />
                    <DangerVignette level={playing ? danger.value : 0} />
                    <SceneBanner message={banner} wide />
                    {playing && (
                        <TimerPill seconds={clock.remaining} label="Konvoi" warnBelow={18} corner="br" />
                    )}
                    {playing && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Bredde her', value: widthKm, unit: 'km' },
                                { label: 'Oljepris', value: priceText, unit: '$/fat' },
                                { label: 'Bensin i Norge', value: petrolText, unit: 'kr/l' },
                            ]}
                        />
                    )}
                    <DragHint show={playing && through === 0 && lost === 0} corner="bc">
                        Hold inne for å kjøre, pek for å styre
                    </DragHint>
                </>
            }
            scene={
                <StraitScene
                    key={attempt}
                    playing={playing}
                    runId={runId}
                    movingRef={movingRef}
                    steerRef={steerRef}
                    widthRef={widthRef}
                    shipPosRef={shipPosRef}
                    onAim={handleAim}
                    onHoldChange={handleHold}
                    dangerAdd={danger.add}
                    onThrough={handleThrough}
                    onLost={handleLost}
                    through={through}
                    burst={burst}
                    burstAt={burstAt}
                    hits={hits}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="flex flex-col gap-3">
                    <SceneFact>
                        <span className="font-bold text-slate-800">Mars 2026.</span> Iran har erklært
                        Hormuzstredet stengt og angriper skip som prøver å passere. Du er los og skal
                        få fem tankskip fra Persiabukta og ut i åpent hav. Ute i bukta er det god
                        plass. På det trangeste er stredet bare 33 kilometer bredt, og der ligger
                        både vrak og iranske angrepsbåter i veien.
                    </SceneFact>
                    <button
                        onClick={begin}
                        className="self-start px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow"
                    >
                        Send første tankskip
                    </button>
                </div>
            )}

            {playing && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <StepTracker current={through} total={GOAL_SHIPS} />
                        <span className="text-[11px] font-bold text-slate-500">
                            Tapte skip: {lost} av {MAX_LOST}
                        </span>
                    </div>
                    <MeterBar
                        value={danger.value}
                        label="Fare fra angrepsbåtene"
                        hint="Hold avstand til de grå båtene. Slipp knappen og vent hvis de sperrer lanen."
                        labels={{ normal: 'Rolig sjø', warn: 'Oppdaget', danger: 'ANGREP!' }}
                    />
                </div>
            )}

            {gameState === 'timeout' && (
                <LoseScreen title="Konvoien rakk det ikke" onRetry={begin}>
                    Slik virket blokaden. Goldman Sachs anslo i juli 2026 at bare 10 til 15 prosent av
                    de normale oljemengdene kom gjennom stredet. Når så lite slipper ut, stiger prisen
                    for alle som kjøper olje. Prøv igjen, og bruk pausene mellom angrepsbåtene.
                </LoseScreen>
            )}

            {gameState === 'blockade' && (
                <LoseScreen title="For mange skip tapt. Rederiene stanser trafikken" onRetry={begin}>
                    Det var akkurat dette som skjedde etter 4. mars 2026: skipstrafikken gjennom
                    Hormuzstredet falt med over 90 prosent, fordi rederiene ikke våget å sende skipene
                    sine inn. Oljeprisen steg fra rundt 70 til over 110 dollar fatet.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={
                        lost === 0
                            ? 'Fem skip gjennom uten tap. Prisen er tilbake på 70 dollar!'
                            : 'Du fikk fem tankskip gjennom stredet!'
                    }
                    onReplay={begin}
                    onNext={() =>
                        onComplete({
                            score: Math.max(0.5, 1 - lost * 0.15),
                            completed: true,
                            artifact: { through, lost },
                        })
                    }
                >
                    Du merket det selv: ute i bukta var det plass nok, men alt måtte gjennom den samme
                    smale porten. Rundt en femtedel av all olje verden bruker fraktes gjennom
                    Hormuzstredet, og på det trangeste er det bare 33 kilometer bredt. Derfor kunne
                    Iran løfte oljeprisen fra rundt 70 til over 110 dollar fatet bare ved å stenge et
                    sund, og derfor ble bensinen dyrere for familien din i Norge.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default HormuzFlaskehalsen3D;
