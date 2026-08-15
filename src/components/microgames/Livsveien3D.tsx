import { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    FlatRing,
    Rock,
    Tree,
    Person,
    Burst,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    LoseScreen,
    TimerPill,
    faceAlong,
    damp,
    microSfx,
    THEMES,
} from './kit';
import type { MicroGameProps } from './types';

// Livsveien - livssynshumanismens fire seremonier.
//
// Lyspære-øyeblikket: livssynshumanismen markerer nøyaktig de samme fire
// punktene i livet som religionene gjør. Forskjellen er ikke HVA som markeres,
// men hvem som gir øyeblikket mening - her er det menneskene selv.
//
// Mekanikk: en person går langs livsveien i sanntid, uansett hva eleven gjør.
// Eleven drar de fire seremoniene ut til milepælene FØR vandreren rekker fram.
// Rekker hen ikke, går øyeblikket upåaktet forbi - og det er ikke til å ta igjen.

const t = THEMES.modern ?? THEMES.viking;

const START_Z = 7.4;
const END_Z = -7.6;
// Tempoet er balansert ved selvspill: den første milepælen nås etter ca. 23
// sekunder, og det går ca. 18 sekunder mellom hver. Da rekker en elev som
// faktisk leser og drar, mens en som lar det stå til taper milepæler.
const WALK_SECONDS = 84;

// Kameraet står på +X-siden, så veien renner tvers over bildet. Milepælene
// ligger bak veien (-X) og brikkeskuffen nærmest kameraet (+X), der de blir
// store og lette å gripe.
const SLOT_X = -2.4;
const POST_X = -3.8;

interface Milestone {
    id: string;
    z: number;
    label: string;
    age: string;
}

const MILESTONES: Milestone[] = [
    { id: 'navnefest', z: 3.2, label: 'Navnefest', age: 'Et barn er født' },
    { id: 'konfirmasjon', z: 0.0, label: 'Konfirmasjon', age: '15 år' },
    { id: 'vigsel', z: -3.2, label: 'Vigsel', age: 'To vil dele livet' },
    { id: 'gravferd', z: -6.4, label: 'Gravferd', age: 'Livet er slutt' },
];

// Startplassene i skuffen nærmest kameraet - bevisst i feil rekkefølge, så
// eleven må lese formene i stedet for å dra rett fram.
const TRAY: Record<string, [number, number]> = {
    vigsel: [4.3, 5.2],
    gravferd: [4.3, 1.8],
    navnefest: [4.3, -1.6],
    konfirmasjon: [4.3, -5.0],
};

type Status = 'playing' | 'won' | 'lost';

// ── Seremoni-brikkene ────────────────────────────────────────────────────────

// Felles sokkel, så alle fire leser som brikker av samme slag.
function Token({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <group>
            <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[0.62, 0.66, 0.1, 18]} />
                <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
            {children}
        </group>
    );
}

function TokenShape({ id }: { id: string }) {
    if (id === 'navnefest') {
        // Vogge: kasse på to meier, med et lite bylt oppi.
        return (
            <Token color="#f6d8a8">
                <mesh position={[0, 0.32, 0]} castShadow>
                    <boxGeometry args={[0.74, 0.3, 0.46]} />
                    <meshStandardMaterial color="#c98f4a" roughness={0.85} />
                </mesh>
                <mesh position={[0, 0.5, 0]} castShadow>
                    <sphereGeometry args={[0.13, 12, 12]} />
                    <meshStandardMaterial color="#f3e2cd" roughness={0.9} />
                </mesh>
            </Token>
        );
    }
    if (id === 'konfirmasjon') {
        // Bok på skrå pult: kurset i etikk og livssyn.
        return (
            <Token color="#cfe0f4">
                <mesh position={[0, 0.24, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.28, 0.4]} />
                    <meshStandardMaterial color="#8fa7c4" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.44, 0]} rotation={[-0.42, 0, 0]} castShadow>
                    <boxGeometry args={[0.66, 0.09, 0.5]} />
                    <meshStandardMaterial color="#3f6fb5" roughness={0.7} />
                </mesh>
            </Token>
        );
    }
    if (id === 'vigsel') {
        // To ringer som ligger side om side (FlatRing ligger alltid ned).
        return (
            <Token color="#f7e3c0">
                <mesh position={[0, 0.16, 0]} castShadow>
                    <cylinderGeometry args={[0.44, 0.46, 0.12, 16]} />
                    <meshStandardMaterial color="#e8d3ae" roughness={0.9} />
                </mesh>
                <FlatRing position={[-0.16, 0.24, 0]} radius={0.19} tube={0.05} color="#e3b23c" />
                <FlatRing position={[0.16, 0.24, 0]} radius={0.19} tube={0.05} color="#e3b23c" />
            </Token>
        );
    }
    // Gravferd: minnestein med en blomst ved foten.
    return (
        <Token color="#dcd9d2">
            <Rock position={[0, 0.36, -0.04]} color="#8a8f96" scale={0.86} />
            <mesh position={[0.26, 0.2, 0.2]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.24, 6]} />
                <meshStandardMaterial color="#4e6b3a" roughness={0.9} />
            </mesh>
            <mesh position={[0.26, 0.34, 0.2]} castShadow>
                <sphereGeometry args={[0.07, 10, 10]} />
                <meshStandardMaterial color="#d1607d" roughness={0.8} />
            </mesh>
        </Token>
    );
}

// ── Milepælstolpen ───────────────────────────────────────────────────────────

function Post({ m, state }: { m: Milestone; state: 'venter' | 'markert' | 'tapt' }) {
    const g = useRef<THREE.Group>(null);
    const lean = state === 'tapt' ? 0.34 : 0;
    useFrame((_, dt) => {
        if (g.current) g.current.rotation.z = damp(g.current.rotation.z, lean, dt, 3);
    });
    const color = state === 'markert' ? '#e3b23c' : state === 'tapt' ? '#9aa0a6' : '#b9c0c7';
    const board = state === 'markert' ? '#fff4d6' : state === 'tapt' ? '#c9ccd0' : '#eef1f4';
    return (
        <group ref={g} position={[POST_X, 0, m.z]}>
            <mesh position={[0, 0.85, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.11, 1.7, 8]} />
                <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
            {/* Skiltet vender mot kameraet (+X), så det leses som et skilt. */}
            <mesh position={[0, 1.62, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
                <boxGeometry args={[1.5, 0.5, 0.08]} />
                <meshStandardMaterial color={board} roughness={0.8} />
            </mesh>
            {state === 'markert' && (
                <mesh position={[0, 1.92, 0]}>
                    <sphereGeometry args={[0.11, 12, 12]} />
                    <meshStandardMaterial
                        color="#ffd970"
                        emissive="#ffb703"
                        emissiveIntensity={0.7}
                    />
                </mesh>
            )}
        </group>
    );
}

// Fellesskapet som møter opp når seremonien er på plass. Poenget i selve
// scenen: det er mennesker som gir øyeblikket vekt, ikke noe utenfor dem.
function Fellesskap({ z }: { z: number }) {
    return (
        <group position={[0, 0, z]}>
            <Person
                position={[-5.4, 0, 0.9]}
                rotation={[0, Math.PI / 2, 0]}
                body="#4a6fa5"
                pose="raise"
            />
            <Person
                position={[-6.1, 0, -0.3]}
                rotation={[0, Math.PI / 2, 0]}
                body="#7a5a8f"
                pose="idle"
            />
            <Person
                position={[-5.2, 0, -1.2]}
                rotation={[0, Math.PI / 2, 0]}
                body="#3f7a5e"
                pose="idle"
            />
        </group>
    );
}

// ── Vandreren ────────────────────────────────────────────────────────────────

function Walker({
    running,
    onPass,
    onFinish,
    onTick,
}: {
    running: boolean;
    onPass: (id: string) => void;
    onFinish: () => void;
    onTick: (secondsLeft: number) => void;
}) {
    const g = useRef<THREE.Group>(null);
    const prog = useRef(0);
    const nextPost = useRef(0);
    const finished = useRef(false);
    const lastSec = useRef(-1);
    const step = useRef(0);

    useFrame((_, dt) => {
        if (!running || finished.current) return;
        prog.current = Math.min(1, prog.current + dt / WALK_SECONDS);
        const z = START_Z + (END_Z - START_Z) * prog.current;
        step.current += dt * 7;
        if (g.current) {
            g.current.position.z = z;
            g.current.position.y = Math.abs(Math.sin(step.current)) * 0.05;
        }
        while (nextPost.current < MILESTONES.length && z <= MILESTONES[nextPost.current].z) {
            onPass(MILESTONES[nextPost.current].id);
            nextPost.current += 1;
        }
        const rem = Math.ceil((1 - prog.current) * WALK_SECONDS);
        if (rem !== lastSec.current) {
            lastSec.current = rem;
            onTick(rem);
        }
        if (prog.current >= 1) {
            finished.current = true;
            onFinish();
        }
    });

    return (
        <group ref={g} position={[0, 0, START_Z]}>
            <Person
                position={[0, 0, 0]}
                rotation={[0, faceAlong([0, -1]), 0]}
                body="#c05a3c"
                legs="#39312a"
                pose="walk"
                scale={1.15}
            />
        </group>
    );
}

// ── Scenen ───────────────────────────────────────────────────────────────────

function Livsveien({
    running,
    placed,
    lost,
    resetKeys,
    onPass,
    onFinish,
    onTick,
    onSnap,
    onGrab,
}: {
    running: boolean;
    placed: Record<string, boolean>;
    lost: Record<string, boolean>;
    resetKeys: Record<string, number>;
    onPass: (id: string) => void;
    onFinish: () => void;
    onTick: (s: number) => void;
    onSnap: (tokenId: string, index: number) => void;
    onGrab: () => void;
}) {
    const snapPoints = useMemo(
        () => MILESTONES.map((m) => [SLOT_X, m.z] as [number, number]),
        []
    );
    const trees = useMemo(
        () =>
            [
                [-8.4, 6.8],
                [-9.2, -0.6],
                [-8.6, -7.4],
                [-11.5, 3.2],
                [-11.8, -4.2],
                [8.6, 8.2],
                [9.4, -7.8],
            ] as [number, number][],
        []
    );

    return (
        <group>
            {/* Rikelig bakke, så horisonten forsvinner i tåka og kanten aldri
                vises mot himmelen. Bredere enn 26 enheter = utenfor scene-
                revisjonens modellboks, som det skal være for et bakkeplan. */}
            <GroundPlane size={120} depth={120} color="#8fb96a" />

            {/* Selve livsveien: fra fødsel (+Z) mot livets slutt (-Z). */}
            <mesh position={[0, 0.03, -0.1]} receiveShadow>
                <boxGeometry args={[2.6, 0.06, 17]} />
                <meshStandardMaterial color="#d8c9a3" roughness={1} />
            </mesh>

            {trees.map(([x, z], i) => (
                <Tree key={i} position={[x, 0, z]} leaf={t.leaf} seed={i} />
            ))}

            {MILESTONES.map((m) => (
                <group key={m.id}>
                    <Post
                        m={m}
                        state={placed[m.id] ? 'markert' : lost[m.id] ? 'tapt' : 'venter'}
                    />
                    {/* Merket sporet der brikken skal ligge. */}
                    <FlatRing
                        position={[SLOT_X, 0.02, m.z]}
                        radius={0.78}
                        tube={0.05}
                        color={placed[m.id] ? '#e3b23c' : '#ffffff'}
                    />
                    {placed[m.id] && (
                        <>
                            <group position={[SLOT_X, 0, m.z]} scale={1.3}>
                                <TokenShape id={m.id} />
                            </group>
                            <Fellesskap z={m.z} />
                            <Burst position={[SLOT_X, 0.9, m.z]} trigger={1} />
                        </>
                    )}
                </group>
            ))}

            {/* Brikkene i skuffen. Plasserte brikker tas ut av dra-laget. */}
            {MILESTONES.map((m) =>
                placed[m.id] ? null : (
                    <Draggable
                        key={`${m.id}-${resetKeys[m.id] ?? 0}`}
                        position={[TRAY[m.id][0], 0, TRAY[m.id][1]]}
                        bounds={{ minX: -6.4, maxX: 6.4, minZ: -8.6, maxZ: 8.4 }}
                        snapPoints={snapPoints}
                        snapRadius={2}
                        dropFx="dustPuff"
                        onDragStart={onGrab}
                        onSnap={(i) => onSnap(m.id, i)}
                    >
                        {/* Romslig usynlig gripeflate - trygt for trackpad. */}
                        <mesh position={[0, 0.6, 0]}>
                            <boxGeometry args={[2.2, 1.8, 2.2]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <group scale={1.3}>
                            <TokenShape id={m.id} />
                        </group>
                    </Draggable>
                )
            )}

            <Walker running={running} onPass={onPass} onFinish={onFinish} onTick={onTick} />
        </group>
    );
}

// ── Spillet ──────────────────────────────────────────────────────────────────

export default function Livsveien3D({ onComplete, onRetry }: MicroGameProps) {
    const [attempt, setAttempt] = useState(0);
    const [status, setStatus] = useState<Status>('playing');
    const [placed, setPlaced] = useState<Record<string, boolean>>({});
    const [lost, setLost] = useState<Record<string, boolean>>({});
    const [resetKeys, setResetKeys] = useState<Record<string, number>>({});
    const [secondsLeft, setSecondsLeft] = useState(WALK_SECONDS);
    const [banner, setBanner] = useState<string | null>(
        'Vandreren har begynt. Legg seremonien på plass før hen kommer fram.'
    );
    const [touched, setTouched] = useState(false);

    // Refs så vandrerens useFrame kan lese fersk tilstand uten å re-rendre.
    const placedRef = useRef<Record<string, boolean>>({});
    const missedRef = useRef(0);

    const reset = useCallback(() => {
        placedRef.current = {};
        missedRef.current = 0;
        setPlaced({});
        setLost({});
        setResetKeys({});
        setSecondsLeft(WALK_SECONDS);
        setStatus('playing');
        setTouched(false);
        setBanner('Vandreren har begynt. Legg seremonien på plass før hen kommer fram.');
        setAttempt((a) => a + 1);
        onRetry?.();
    }, [onRetry]);

    const handleSnap = useCallback((tokenId: string, index: number) => {
        const target = MILESTONES[index];
        if (target.id === tokenId) {
            placedRef.current = { ...placedRef.current, [tokenId]: true };
            setPlaced((p) => ({ ...p, [tokenId]: true }));
            microSfx.play('correct');
            setBanner(`${target.label} er på plass. Folk møter opp.`);
        } else {
            const riktig = MILESTONES.find((m) => m.id === tokenId);
            microSfx.play('incorrect');
            setBanner(`Det hører ikke hjemme her. ${riktig?.label} skal til «${riktig?.age}».`);
            setResetKeys((r) => ({ ...r, [tokenId]: (r[tokenId] ?? 0) + 1 }));
        }
    }, []);

    const handlePass = useCallback((id: string) => {
        if (placedRef.current[id]) return;
        missedRef.current += 1;
        setLost((l) => ({ ...l, [id]: true }));
        microSfx.play('incorrect');
        const m = MILESTONES.find((x) => x.id === id);
        setBanner(`${m?.label} gikk upåaktet forbi. Det øyeblikket kommer ikke igjen.`);
    }, []);

    const handleFinish = useCallback(() => {
        const missed = missedRef.current;
        if (missed === 0) {
            setStatus('won');
            setBanner(null);
            microSfx.play('complete');
            onComplete({ score: 1, completed: true });
        } else {
            setStatus('lost');
            setBanner(null);
        }
    }, [onComplete]);

    const handleTick = useCallback((s: number) => setSecondsLeft(s), []);

    const antallPlassert = Object.keys(placed).length;

    return (
        <MicroGameScaffold
            title="Livsveien"
            subtitle="Livssynshumanismen markerer de samme fire øyeblikkene som religionene gjør."
            estimatedSeconds={110}
            onRetry={reset}
            scene={
                <Livsveien
                    key={attempt}
                    running={status === 'playing'}
                    placed={placed}
                    lost={lost}
                    resetKeys={resetKeys}
                    onPass={handlePass}
                    onFinish={handleFinish}
                    onTick={handleTick}
                    onSnap={handleSnap}
                    onGrab={() => setTouched(true)}
                />
            }
            canvas={{
                idle: false,
                camera: { position: [15.5, 9.5, 3.5], fov: 46 },
                background: '#cfe6f4',
                fog: { color: '#dbe9f2', near: 24, far: 64 },
                light: 'day',
                target: [-0.4, 0.9, -0.2],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    {status === 'playing' && (
                        <TimerPill seconds={secondsLeft} label="Livet varer" warnBelow={12} />
                    )}
                    <SceneBadge corner="br">{antallPlassert} av 4 markert</SceneBadge>
                    <DragHint show={!touched && status === 'playing'} corner="bc">
                        Dra en seremoni ut til den hvite ringen
                    </DragHint>
                </>
            }
        >
            {status === 'won' && (
                <WinScreen title="Hele livsveien ble markert" onReplay={reset}>
                    Fire ganger stoppet livet opp, og fire ganger var det mennesker som ga
                    øyeblikket vekt. Human-Etisk Forbund holder nettopp disse fire seremoniene:
                    navnefest, konfirmasjon, vigsel og gravferd. Livssynshumanismen markerer altså
                    de samme punktene som religionene, men henter meningen fra mennesker i stedet
                    for fra en gud.
                </WinScreen>
            )}
            {status === 'lost' && (
                <LoseScreen title="Noen øyeblikk gikk upåaktet forbi" onRetry={reset}>
                    Livet stopper ikke opp og venter. Et livssyn trenger faste former for de store
                    øyeblikkene, ellers passerer de i stillhet. Prøv igjen, og legg seremonien klar
                    før vandreren kommer fram.
                </LoseScreen>
            )}
            {status === 'playing' && (
                <p className="text-sm text-slate-600 leading-relaxed">
                    Vandreren går fra fødsel til livets slutt. Dra hver seremoni ut til milepælen
                    den hører til, før hen rekker fram.
                </p>
            )}
        </MicroGameScaffold>
    );
}
