import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Flame } from 'lucide-react';
import {
    MicroGameScaffold,
    AimPlane,
    GroundPlane,
    FlatRing,
    Building,
    Wall,
    Fire,
    Person,
    Burst,
    Particles,
    GlowMaterial,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    LoseScreen,
    TimerPill,
    MeterBar,
    DangerVignette,
    useGameClock,
    useMeter,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Messingplata - voksutsmelting i Benin City.
//
// Lyspæren: leirformen må knuses for å få platen ut. Formen kan derfor bare
// brukes én gang, og hver eneste plate fra Benin er en original som ikke finnes
// i flere eksemplarer. Eleven kjenner det på kroppen ved å stå med diglen: du
// har ett forsøk, metallet kjølner mens du holder på, og søler du utenfor,
// sprekker formen og alt arbeidet er borte.
//
// Mekanikk: hold inne pekeren for å helle, og styr diglen sidelengs langs
// skinna over formen. Tre innløpshull skal fylles før metallet stivner. Treffer
// du utenfor et hull, eller heller i et hull som allerede er fullt, renner
// messingen utover og søl-måleren stiger.

const HOLE_X = [-2.2, 0, 2.2];
const HOLE_TOL = 0.85;
// Sekunder med treff som trengs for å fylle ett hull.
const FILL_PER_SECOND = 0.42;
// Hvor fort sølet bygger seg opp når strålen bommer.
const SPILL_PER_SECOND = 0.5;
const TIME_LIMIT = 34;

// Faste høyder. Alt står på underlaget sitt: bordet på bakken, formen på
// bordet, stolpene på bakken, skinna på stolpene, diglen i skinna.
const BENCH_TOP = 0.8;
const MOULD_TOP = 1.25;
const RAIL_Y = 3.01;
const CRUCIBLE_Y = 2.18;
const RAIL_HALF = 4.7;

type GameState = 'idle' | 'playing' | 'won' | 'spilled' | 'cooled';

const CLAY = '#e0c39c';
const BENCH = '#8f7a63';
const BRASS = '#edb949';

// ---------------------------------------------------------------
//  3D-SCENEN
// ---------------------------------------------------------------

function Foundry({
    playing,
    won,
    holdingRef,
    aimRef,
    onFills,
    onSpill,
    onFilled,
    burst,
}: {
    playing: boolean;
    won: boolean;
    holdingRef: React.MutableRefObject<boolean>;
    aimRef: React.MutableRefObject<number>;
    onFills: (fills: number[]) => void;
    onSpill: (amount: number) => void;
    onFilled: () => void;
    burst: number;
}) {
    const fills = useRef<number[]>([0, 0, 0]);
    const reported = useRef<number[]>([0, 0, 0]);
    const finished = useRef(false);
    const crucibleX = useRef(-3.8);
    const openRef = useRef(0);

    const crucible = useRef<THREE.Group>(null);
    const stream = useRef<THREE.Mesh>(null);
    const plugs = useRef<Array<THREE.Mesh | null>>([null, null, null]);
    const holes = useRef<Array<THREE.Group | null>>([null, null, null]);
    const leftHalf = useRef<THREE.Mesh>(null);
    const rightHalf = useRef<THREE.Mesh>(null);
    const plate = useRef<THREE.Group>(null);

    useFrame((_, rawDt) => {
        // Klemmes kun mot store hopp (fanebytte). For lav grense ville gjort
        // fylling og søl tregere på en svak Chromebook enn på en rask maskin.
        const dt = Math.min(rawDt, 0.12);

        // Diglen glir mykt mot der eleven peker.
        const targetX = THREE.MathUtils.clamp(aimRef.current, -RAIL_HALF + 0.6, RAIL_HALF - 0.6);
        crucibleX.current = damp(crucibleX.current, targetX, dt, 7);
        if (crucible.current) {
            crucible.current.position.x = crucibleX.current;
            // Vipp diglen når det helles.
            const tilt = playing && holdingRef.current ? -0.5 : 0;
            crucible.current.rotation.z = damp(crucible.current.rotation.z, tilt, dt, 8);
        }

        const pouring = playing && holdingRef.current;

        // Strålen: en glødende søyle fra diglen ned i formen.
        if (stream.current) {
            const want = pouring ? 1 : 0;
            const s = damp(stream.current.scale.x, want, dt, 14);
            stream.current.scale.set(s, 1, s);
            stream.current.visible = s > 0.04;
            stream.current.position.x = crucibleX.current;
        }

        if (pouring) {
            let hit = -1;
            for (let i = 0; i < 3; i++) {
                if (Math.abs(crucibleX.current - HOLE_X[i]) < HOLE_TOL) hit = i;
            }
            if (hit >= 0 && fills.current[hit] < 1) {
                fills.current[hit] = Math.min(1, fills.current[hit] + dt * FILL_PER_SECOND);
            } else {
                onSpill(dt * SPILL_PER_SECOND);
            }
        }

        // Fyllnivå tegnes som en glødende propp som vokser i hvert innløp.
        // Proppene skjules når formen åpnes - da er de en del av platen.
        for (let i = 0; i < 3; i++) {
            const m = plugs.current[i];
            if (!m) continue;
            const f = fills.current[i];
            m.visible = f > 0.02 && openRef.current < 0.2;
            m.scale.y = Math.max(0.02, f);
            m.position.y = MOULD_TOP + 0.02 + (f * 0.36) / 2;
            const g = holes.current[i];
            if (g) g.visible = openRef.current < 0.2;
        }

        // Meld fra til DOM kun når tallene faktisk har flyttet seg.
        let changed = false;
        for (let i = 0; i < 3; i++) {
            if (Math.abs(fills.current[i] - reported.current[i]) > 0.02) changed = true;
        }
        if (changed) {
            reported.current = [...fills.current];
            onFills(reported.current);
        }

        if (!finished.current && fills.current.every((f) => f >= 1)) {
            finished.current = true;
            reported.current = [1, 1, 1];
            onFills(reported.current);
            onFilled();
        }

        // Finalen: leirformen vippes fra hverandre langs skjøten, og platen
        // løftes ut. Halvdelene ligger allerede delt i Z, så de åpnes i Z.
        openRef.current = damp(openRef.current, won ? 1 : 0, dt, 2.2);
        const o = openRef.current;
        // Halvdelene vippes ut til bordkanten - de skal fortsatt hvile på benken.
        if (leftHalf.current) {
            leftHalf.current.position.z = -0.6 - o * 1.1;
            leftHalf.current.rotation.x = -o * 0.5;
        }
        if (rightHalf.current) {
            rightHalf.current.position.z = 0.6 + o * 1.1;
            rightHalf.current.rotation.x = o * 0.5;
        }
        // Platen ligger på benken hele tiden, skjult inni formen, og løftes
        // bare så vidt fram når leira er ute av veien.
        if (plate.current) {
            plate.current.visible = o > 0.05;
            plate.current.position.y = BENCH_TOP + 0.09 + o * 0.3;
            plate.current.rotation.y = o * 0.5;
        }
    });

    return (
        <group>
            <GroundPlane size={44} color="#d6a97e" />

            {/* Bakgrunn: palassmuren og et par leirhus. Ren dekor. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Wall
                    position={[0, 0, -8.5]}
                    length={22}
                    height={2.6}
                    color="#c08a5e"
                    crenellations={false}
                />
                <Building
                    position={[-7.6, 0, -11]}
                    body="#c69a6d"
                    roof="#7d5636"
                    w={3}
                    h={2}
                    d={3}
                    seed={3}
                />
                <Building
                    position={[7.4, 0, -11.4]}
                    body="#cda372"
                    roof="#7d5636"
                    w={2.6}
                    h={1.9}
                    d={2.8}
                    seed={7}
                />
            </group>

            {/* Smelteovnen ved siden av benken - der messingen ble gjort flytende. */}
            <Fire position={[-5.5, 0, -2.2]} scale={0.9} />
            <Person
                position={[3.6, 0, -3.6]}
                rotation={[0, -0.45, 0]}
                pose="raise"
                body="#e0c07a"
                skin="#6b4529"
            />
            <Particles preset="embers" center={[-5.5, 1.2, -2.2]} area={[2.2, 2.2]} height={3} />

            {/* Arbeidsbenken av leire. Bunnen står på bakken. */}
            <mesh position={[0, BENCH_TOP / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[8.6, BENCH_TOP, 3.4]} />
                <meshStandardMaterial color={BENCH} roughness={1} />
            </mesh>

            {/* Leirformen, i to halvdeler som skyves fra hverandre til slutt. */}
            <mesh
                ref={leftHalf}
                position={[0, BENCH_TOP + 0.225, -0.6]}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[7.2, 0.45, 1.2]} />
                <meshStandardMaterial color={CLAY} roughness={1} />
            </mesh>
            <mesh
                ref={rightHalf}
                position={[0, BENCH_TOP + 0.225, 0.6]}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[7.2, 0.45, 1.2]} />
                <meshStandardMaterial color={CLAY} roughness={1} />
            </mesh>

            {/* Den ferdige platen, skjult til formen åpnes. */}
            <group ref={plate} position={[0, BENCH_TOP + 0.09, 0]} visible={false}>
                <mesh castShadow>
                    <boxGeometry args={[4.2, 0.18, 2.2]} />
                    <meshStandardMaterial color={BRASS} metalness={0.2} roughness={0.42} />
                </mesh>
                {/* Obaen i midten, størst. Følget er mindre. */}
                <mesh position={[0, 0.32, 0]} castShadow>
                    <boxGeometry args={[0.44, 0.44, 0.24]} />
                    <meshStandardMaterial color="#f7d27e" metalness={0.18} roughness={0.45} />
                </mesh>
                <mesh position={[0, 0.63, 0]} castShadow>
                    <sphereGeometry args={[0.16, 12, 12]} />
                    <meshStandardMaterial color="#f7d27e" metalness={0.18} roughness={0.45} />
                </mesh>
                {[-1.3, 1.3].map((x) => (
                    <mesh key={x} position={[x, 0.24, 0]} castShadow>
                        <boxGeometry args={[0.3, 0.28, 0.2]} />
                        <meshStandardMaterial color="#e6c069" metalness={0.18} roughness={0.5} />
                    </mesh>
                ))}
            </group>

            {/* Tre innløpshull med glødende fyllpropp. */}
            {HOLE_X.map((x, i) => (
                <group
                    key={x}
                    position={[x, 0, 0]}
                    ref={(g) => {
                        holes.current[i] = g;
                    }}
                >
                    <FlatRing
                        position={[0, MOULD_TOP + 0.015, 0]}
                        radius={0.66}
                        tube={0.07}
                        color="#c8721f"
                    />
                    <mesh position={[0, MOULD_TOP + 0.18, 0]} castShadow>
                        <cylinderGeometry args={[0.44, 0.24, 0.36, 14]} />
                        <meshStandardMaterial color="#7d5c3e" roughness={1} />
                    </mesh>
                    <mesh
                        ref={(m) => {
                            plugs.current[i] = m;
                        }}
                        position={[0, MOULD_TOP + 0.2, 0]}
                        visible={false}
                    >
                        <cylinderGeometry args={[0.3, 0.2, 0.36, 12]} />
                        <GlowMaterial color="#ffb547" />
                    </mesh>
                </group>
            ))}

            {/* Skinna over formen. Stolpene står på bakken, skinna på stolpene. */}
            {[-RAIL_HALF, RAIL_HALF].map((x) => (
                <mesh key={x} position={[x, 1.45, 0]} castShadow>
                    <boxGeometry args={[0.26, 2.9, 0.26]} />
                    <meshStandardMaterial color="#5d4630" roughness={0.9} />
                </mesh>
            ))}
            <mesh position={[0, RAIL_Y, 0]} castShadow>
                <boxGeometry args={[RAIL_HALF * 2 + 0.26, 0.22, 0.26]} />
                <meshStandardMaterial color="#5d4630" roughness={0.9} />
            </mesh>

            {/* Diglen henger i skinna og glir sidelengs. */}
            <group ref={crucible} position={[0, 0, 0]}>
                <mesh position={[0, 2.68, 0]}>
                    <boxGeometry args={[0.14, 0.44, 0.14]} />
                    <meshStandardMaterial color="#3f3227" roughness={0.9} />
                </mesh>
                <mesh position={[0, CRUCIBLE_Y, 0]} castShadow>
                    <cylinderGeometry args={[0.5, 0.34, 0.55, 16]} />
                    <meshStandardMaterial color="#4a3b2c" roughness={0.85} />
                </mesh>
                <mesh position={[0, CRUCIBLE_Y + 0.21, 0]}>
                    <cylinderGeometry args={[0.44, 0.44, 0.08, 16]} />
                    <GlowMaterial color="#ffcf6b" />
                </mesh>
            </group>

            {/* Strålen av flytende messing. */}
            <mesh
                ref={stream}
                position={[0, (MOULD_TOP + 1.9) / 2, 0]}
                visible={false}
                scale={[0, 1, 0]}
            >
                <cylinderGeometry args={[0.11, 0.09, 1.9 - MOULD_TOP + 0.3, 10]} />
                <GlowMaterial color="#ffc24d" />
            </mesh>

            <Burst position={[0, 2.4, 0]} trigger={burst} />
        </group>
    );
}

// ---------------------------------------------------------------
//  SPILLET
// ---------------------------------------------------------------

const Messingplata3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [state, setState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fills, setFills] = useState<number[]>([0, 0, 0]);
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Messingen er flytende. Hold inne pekeren og styr strålen ned i hullene.'
    );

    const holdingRef = useRef(false);
    const aimRef = useRef(-3.8);
    const stateRef = useRef<GameState>('idle');
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const fail = useCallback(
        (why: 'spilled' | 'cooled') => {
            if (stateRef.current !== 'playing') return;
            holdingRef.current = false;
            stateRef.current = why;
            setState(why);
            sounds.play('incorrect');
            setBanner(null);
        },
        [sounds]
    );

    const spill = useMeter({
        drainPerSecond: 0.1,
        overloadAt: 1,
        recoverTo: 0.35,
        onOverload: () => fail('spilled'),
    });

    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: state === 'playing',
        onExpire: () => fail('cooled'),
    });

    const begin = () => {
        spill.reset();
        clock.restart();
        setFills([0, 0, 0]);
        holdingRef.current = false;
        aimRef.current = -3.8;
        setAttempt((a) => a + 1);
        stateRef.current = 'playing';
        setState('playing');
        setBanner('Hold inne pekeren og styr strålen ned i hullene.');
        sounds.play('advance');
    };

    const handleFills = useCallback((next: number[]) => {
        setFills(next);
    }, []);

    const spillAdd = spill.add;
    const handleSpill = useCallback(
        (amount: number) => {
            spillAdd(amount);
        },
        [spillAdd]
    );

    const handleFilled = useCallback(() => {
        if (stateRef.current !== 'playing') return;
        holdingRef.current = false;
        stateRef.current = 'won';
        setState('won');
        setBurst((b) => b + 1);
        setBanner('Formen er full. Nå knuses leira, og platen kommer ut.');
        sounds.play('complete');
        onComplete({ score: 1, completed: true, artifact: { fylt: 3 } });
    }, [onComplete, sounds]);

    const handleAim = useCallback((xPct: number) => {
        // Skjermprosent til verdens-X langs skinna.
        aimRef.current = (xPct / 100 - 0.5) * 10.4;
    }, []);

    const handleHold = useCallback((holding: boolean) => {
        if (stateRef.current !== 'playing') return;
        holdingRef.current = holding;
    }, []);

    const ferdige = fills.filter((f) => f >= 1).length;
    const playing = state === 'playing';

    const etikett =
        state === 'won'
            ? 'Platen er støpt'
            : state === 'spilled'
              ? 'Formen sprakk'
              : state === 'cooled'
                ? 'Metallet stivnet'
                : 'Benin City · messingstøperiet';

    return (
        <MicroGameScaffold
            title="Messingplata"
            subtitle="Fyll alle tre innløpshullene før messingen stivner"
            estimatedSeconds={150}
            onRetry={state !== 'idle' ? begin : undefined}
            canvas={{
                idle: false,
                controls: false,
                camera: { position: [0, 5.6, 12.5], fov: 38 },
                target: [0, 1.35, 0],
                background: '#f2ddb4',
                fog: { color: '#eed7ad', near: 22, far: 48 },
                light: 'noon',
            }}
            containerClassName="bg-gradient-to-b from-[#f5e3bd] to-[#d8a97a]"
            scene={
                <>
                    <Foundry
                        key={attempt}
                        playing={playing}
                        won={state === 'won'}
                        holdingRef={holdingRef}
                        aimRef={aimRef}
                        onFills={handleFills}
                        onSpill={handleSpill}
                        onFilled={handleFilled}
                        burst={burst}
                    />
                    <AimPlane
                        enabled={playing}
                        position={[0, 2, -14]}
                        size={[80, 40]}
                        onAim={handleAim}
                        onHoldChange={handleHold}
                    />
                </>
            }
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    {playing && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Metallet kjølner"
                            warnBelow={10}
                            corner="bl"
                        />
                    )}
                    <SceneBadge corner="br">{etikett}</SceneBadge>
                    <DragHint show={playing} corner="bc">
                        Hold inne og dra sidelengs
                    </DragHint>
                    <DangerVignette level={playing ? spill.value : 0} />
                </>
            }
        >
            <div className="mb-2.5 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-slate-500">
                    Ett forsøk per form. Leira knuses uansett når platen er ute.
                </span>
                <span className="text-[11px] font-semibold text-amber-700">
                    {ferdige} av 3 hull fylt
                </span>
            </div>

            {playing ? (
                <MeterBar
                    value={spill.value}
                    label="Søl utenfor formen"
                    hint="Treffer du utenfor hullene, renner messingen utover og leira sprekker"
                    warnAt={0.5}
                    dangerAt={0.8}
                />
            ) : state === 'idle' ? (
                <button
                    type="button"
                    onClick={begin}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-3 text-sm font-bold text-amber-900 shadow-sm transition hover:border-amber-500 hover:bg-amber-200"
                >
                    <Flame className="h-5 w-5" />
                    Ta diglen ut av ovnen og begynn å helle
                </button>
            ) : null}

            {state === 'won' ? (
                <div className="mt-3">
                    <WinScreen title="Platen er ferdig." onReplay={begin}>
                        Nå knuses leirformen for å få platen ut, og da er formen borte for godt.
                        Derfor er hver eneste plate fra Benin en original. Da britene tok med seg
                        tusenvis av dem i 1897, fantes det ingen kopier igjen.
                    </WinScreen>
                </div>
            ) : state === 'spilled' ? (
                <div className="mt-3">
                    <LoseScreen title="Leirformen sprakk" onRetry={begin}>
                        For mye messing rant utenfor innløpene. Den varme metallstrålen sprengte
                        leira, og voksmodellen er allerede smeltet bort. Hele arbeidet må gjøres om
                        fra bunnen av.
                    </LoseScreen>
                </div>
            ) : state === 'cooled' ? (
                <div className="mt-3">
                    <LoseScreen title="Metallet stivnet for tidlig" onRetry={begin}>
                        Messing stivner fort når den forlater ovnen. Formen ble ikke full, og platen
                        fikk hull der metallet aldri nådde fram. Den må smeltes om og støpes på
                        nytt.
                    </LoseScreen>
                </div>
            ) : state === 'idle' ? (
                <p className="mt-3 px-2 text-center text-xs italic text-slate-500">
                    Voksmodellen er allerede smeltet ut av leirformen. Det som er igjen, er et
                    hulrom med nøyaktig samme form som platen skal ha.
                </p>
            ) : null}
        </MicroGameScaffold>
    );
};

export default Messingplata3D;
