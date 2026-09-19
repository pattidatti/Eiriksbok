import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MicroGameScaffold,
    Draggable,
    Mover,
    GroundPlane,
    Building,
    Wall,
    Tower,
    Cart,
    Person,
    Fire,
    Smoke,
    Particles,
    Burst,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    SceneFact,
    WinScreen,
    LoseScreen,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Beleiringen av gesandtskapskvartalet i Beijing, sommeren 1900.
//
// Lyspæren: kvartalet holdt fordi hver åpning ble tettet i tide - og nettopp
// det at det holdt, ga stormaktene grunnen de trengte til å marsjere inn i
// Beijing, plyndre byen og sende Kina regningen etterpå.
//
// Arketype: bygg/monter under press. Eleven drar forsyninger fra gårdsplassen
// ut i åpningene i muren mens bokserne nærmer seg. En åpning som står tom når
// et angrep når fram, er tapt.

type Phase = 'play' | 'won' | 'lost';

interface Gap {
    x: number;
    navn: string;
}

// Muren ligger langs X ved z = WALL_Z. Fire åpninger, hver 2,2 enheter bred.
const WALL_Z = -5;
const LAYER1_Z = -5;
const LAYER2_Z = -3.6;

const GAPS: Gap[] = [
    { x: -5.4, navn: 'Nordporten' },
    { x: -1.8, navn: 'Kanalporten' },
    { x: 1.8, navn: 'Bakgården' },
    { x: 5.4, navn: 'Sørmuren' },
];

// Murstykkene mellom åpningene (senter-x og lengde langs X).
const WALL_PARTS: { x: number; len: number }[] = [
    { x: -7.8, len: 2.4 },
    { x: -3.6, len: 1.4 },
    { x: 0, len: 1.4 },
    { x: 3.6, len: 1.4 },
    { x: 7.8, len: 2.4 },
];

// Gapene som må ha et ekstra lag i andre bølge.
const REINFORCE = [1, 2];

interface Supply {
    id: string;
    navn: string;
    x: number;
    kind: 'sekker' | 'kjerre' | 'dor' | 'kasser' | 'ris' | 'mobler';
}

const SUPPLIES: Supply[] = [
    { id: 's1', navn: 'Sandsekker', x: -6.5, kind: 'sekker' },
    { id: 's2', navn: 'Kjerre', x: -3.9, kind: 'kjerre' },
    { id: 's3', navn: 'Dør', x: -1.3, kind: 'dor' },
    { id: 's4', navn: 'Kasser', x: 1.3, kind: 'kasser' },
    { id: 's5', navn: 'Rissekker', x: 3.9, kind: 'ris' },
    { id: 's6', navn: 'Møbler', x: 6.5, kind: 'mobler' },
];

const SUPPLY_Z = 4.2;

interface Attacker {
    lane: number;
    speed: number;
}

const WAVE1: Attacker[] = [
    { lane: 0, speed: 0.4 },
    { lane: 1, speed: 0.34 },
    { lane: 2, speed: 0.29 },
    { lane: 3, speed: 0.25 },
];

const WAVE2: Attacker[] = [
    { lane: 1, speed: 0.52 },
    { lane: 2, speed: 0.44 },
];

const START_Z = -13;
const STOP_Z = -6.2;

// ── Forsyningene som prosedyrale mesher ─────────────────────────────────────

function SupplyMesh({ kind }: { kind: Supply['kind'] }) {
    if (kind === 'kjerre') return <Cart position={[0, 0, 0]} />;
    if (kind === 'dor') {
        return (
            <group>
                <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.7, 1.7, 0.16]} />
                    <meshStandardMaterial color="#8a5a34" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.85, 0.11]} castShadow>
                    <boxGeometry args={[1.4, 0.16, 0.08]} />
                    <meshStandardMaterial color="#5f3d22" roughness={0.9} />
                </mesh>
            </group>
        );
    }
    if (kind === 'kasser') {
        return (
            <group>
                <mesh position={[-0.42, 0.34, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.8, 0.68, 0.7]} />
                    <meshStandardMaterial color="#9a7345" roughness={0.95} />
                </mesh>
                <mesh position={[0.45, 0.3, 0.05]} castShadow receiveShadow>
                    <boxGeometry args={[0.76, 0.6, 0.66]} />
                    <meshStandardMaterial color="#87643b" roughness={0.95} />
                </mesh>
                <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.8, 0.62, 0.66]} />
                    <meshStandardMaterial color="#a67c4c" roughness={0.95} />
                </mesh>
            </group>
        );
    }
    if (kind === 'ris') {
        return (
            <group>
                {[-0.5, 0.05, 0.6].map((x, i) => (
                    <mesh
                        key={i}
                        position={[x, 0.26, i === 1 ? 0.12 : -0.05]}
                        rotation={[Math.PI / 2, 0, i * 0.4]}
                        castShadow
                        receiveShadow
                    >
                        <capsuleGeometry args={[0.26, 0.4, 4, 8]} />
                        <meshStandardMaterial color="#d8c79a" roughness={1} />
                    </mesh>
                ))}
                <mesh position={[0.05, 0.72, 0.02]} rotation={[Math.PI / 2, 0, 0.9]} castShadow>
                    <capsuleGeometry args={[0.26, 0.4, 4, 8]} />
                    <meshStandardMaterial color="#cbb98a" roughness={1} />
                </mesh>
            </group>
        );
    }
    if (kind === 'mobler') {
        return (
            <group>
                <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.5, 0.12, 0.8]} />
                    <meshStandardMaterial color="#6b4526" roughness={0.85} />
                </mesh>
                {[
                    [-0.62, 0.3],
                    [0.62, 0.3],
                    [-0.62, -0.3],
                    [0.62, -0.3],
                ].map(([x, z], i) => (
                    <mesh key={i} position={[x, 0.33, z]} castShadow>
                        <boxGeometry args={[0.12, 0.66, 0.12]} />
                        <meshStandardMaterial color="#5a381e" roughness={0.9} />
                    </mesh>
                ))}
                <mesh position={[0, 1.05, -0.2]} rotation={[0.25, 0, 0]} castShadow>
                    <boxGeometry args={[0.7, 0.55, 0.1]} />
                    <meshStandardMaterial color="#7d5230" roughness={0.9} />
                </mesh>
            </group>
        );
    }
    // Sandsekker: tre lag stablede sekker.
    return (
        <group>
            {[
                [-0.5, 0.2, 0],
                [0.15, 0.2, 0.06],
                [0.72, 0.2, -0.04],
                [-0.22, 0.58, 0.02],
                [0.44, 0.58, -0.02],
                [0.1, 0.94, 0],
            ].map(([x, y, z], i) => (
                <mesh
                    key={i}
                    position={[x, y, z]}
                    rotation={[Math.PI / 2, 0, i * 0.5]}
                    castShadow
                    receiveShadow
                >
                    <capsuleGeometry args={[0.2, 0.42, 4, 8]} />
                    <meshStandardMaterial color={i % 2 ? '#c8b58c' : '#bda87d'} roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// ── Scenen ──────────────────────────────────────────────────────────────────

interface SceneProps {
    attempt: number;
    wave: number;
    phase: Phase;
    placed: Record<string, { gap: number; layer: 1 | 2 }>;
    targets: { gap: number; layer: 1 | 2; xz: [number, number] }[];
    sealed: Set<number>;
    onPlace: (supplyId: string, targetIndex: number) => void;
    onBreach: (lane: number) => void;
    winBurst: number;
}

function Scene({
    attempt,
    wave,
    phase,
    placed,
    targets,
    sealed,
    onPlace,
    onBreach,
    winBurst,
}: SceneProps) {
    const attackers = wave === 1 ? WAVE1 : WAVE2;
    const snapPoints = useMemo(() => targets.map((t) => t.xz), [targets]);

    return (
        <group>
            <GroundPlane size={40} depth={34} color="#b8a476" />

            {/* Selve muren rundt gesandtskapskvartalet */}
            {WALL_PARTS.map((w, i) => (
                <Wall
                    key={i}
                    position={[w.x, 0, WALL_Z]}
                    length={w.len}
                    height={1.8}
                    thickness={0.5}
                    color="#a39684"
                    crenellations
                />
            ))}
            <Tower position={[-9.6, 0, WALL_Z]} radius={0.62} height={2.6} color="#a39684" />
            <Tower position={[9.6, 0, WALL_Z]} radius={0.62} height={2.6} color="#a39684" />

            {/* Gesandtskapene inne på gårdsplassen */}
            <Building position={[-9.4, 0, 1.6]} w={2.2} h={1.5} d={1.8} body="#d8cdb4" roof="#7a4a33" seed={3} />
            <Building position={[9.4, 0, 1.6]} w={2.2} h={1.5} d={1.8} body="#d3c6ad" roof="#7a4a33" seed={7} />

            {/* Byen brenner utenfor muren */}
            <Fire position={[-7.6, 0, -7.6]} scale={1.1} />
            <Fire position={[7.2, 0, -8.2]} scale={0.9} />
            {/* Drivende dekor: holdes utenfor scene-revisjonens modellboks, ellers
                blåser røyk og støv opp boksen og et riktig innrammet spill
                flagges for "feil innramming". */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Smoke origin={[-7.6, 1.2, -7.6]} />
                <Smoke origin={[7.2, 1.1, -8.2]} />
                <Particles preset="dust" />
            </group>

            {/* Forsvarerne på plassen */}
            <Person position={[-2.6, 0, -1.4]} scale={1.7} body="#4a5a72" hat="cap" hatColor="#2f3a4c" />
            <Person position={[2.9, 0, -1.1]} scale={1.7} body="#5c4a3a" pose="raise" hat="cap" hatColor="#3a2f26" />

            {/* Bokserne som rykker fram mot hver åpning */}
            {attackers.map((a) => {
                const gx = GAPS[a.lane].x;
                const stopped = phase !== 'play' || sealed.has(a.lane) || isDone(a.lane, wave, placed);
                return (
                    <Mover
                        key={`a${attempt}-${wave}-${a.lane}`}
                        from={[gx, 0, START_Z]}
                        to={[gx, 0, STOP_Z]}
                        speed={a.speed}
                        phase={a.lane}
                        state={stopped ? 'frozen' : 'moving'}
                        onArrive={() => onBreach(a.lane)}
                    >
                        <Person
                            scale={1.7}
                            pose={stopped ? 'idle' : 'walk'}
                            body="#8f2f2a"
                            legs="#3b2a22"
                            hat="hood"
                            hatColor="#a83a2f"
                        />
                    </Mover>
                );
            })}

            {/* Forsyninger eleven kan dra ut i åpningene */}
            {SUPPLIES.map((s) => {
                const p = placed[s.id];
                if (p) {
                    const z = p.layer === 1 ? LAYER1_Z : LAYER2_Z;
                    return (
                        <group key={`p${attempt}-${s.id}`} position={[GAPS[p.gap].x, 0, z]}>
                            <SupplyMesh kind={s.kind} />
                        </group>
                    );
                }
                return (
                    <Draggable
                        key={`d${attempt}-${s.id}`}
                        position={[s.x, 0, SUPPLY_Z]}
                        bounds={{ minX: -9, maxX: 9, minZ: -5.5, maxZ: 5.5 }}
                        snapPoints={snapPoints}
                        snapRadius={1.7}
                        dropFx="dustPuff"
                        onSnap={(i) => onPlace(s.id, i)}
                    >
                        {/* Romslig usynlig gripeflate - trygg på trackpad */}
                        <mesh position={[0, 0.8, 0]}>
                            <boxGeometry args={[2.1, 1.8, 1.8]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                        <SupplyMesh kind={s.kind} />
                    </Draggable>
                );
            })}

            <Burst position={[0, 2, -4]} trigger={winBurst} />
        </group>
    );
}

// Er denne banen allerede ferdig behandlet i gjeldende bølge?
function isDone(
    lane: number,
    wave: number,
    placed: Record<string, { gap: number; layer: 1 | 2 }>
) {
    const lag = wave === 1 ? 1 : 2;
    return Object.values(placed).some((p) => p.gap === lane && p.layer === lag);
}

// ── Spillet ─────────────────────────────────────────────────────────────────

export default function BeleiringenBeijing3D({ onComplete, onRetry }: MicroGameProps) {
    const [attempt, setAttempt] = useState(0);
    const [wave, setWave] = useState(1);
    const [phase, setPhase] = useState<Phase>('play');
    const [placed, setPlaced] = useState<Record<string, { gap: number; layer: 1 | 2 }>>({});
    const [banner, setBanner] = useState<string | null>(
        'Dra forsyninger ut i åpningene i muren.'
    );
    const [winBurst, setWinBurst] = useState(0);

    // Speil av fasen som kan leses trygt fra callbacks uten å gjøre dem ferske
    // ved hver render.
    const phaseRef = useRef<Phase>('play');
    const waveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (waveTimer.current) clearTimeout(waveTimer.current);
    }, []);

    const sealed = useMemo(() => {
        const s = new Set<number>();
        Object.values(placed).forEach((p) => {
            if (p.layer === 1) s.add(p.gap);
        });
        return s;
    }, [placed]);

    const reinforced = useMemo(() => {
        const s = new Set<number>();
        Object.values(placed).forEach((p) => {
            if (p.layer === 2) s.add(p.gap);
        });
        return s;
    }, [placed]);

    // Bare de åpningene som fortsatt mangler noe er gyldige slipp-punkter.
    const targets = useMemo(() => {
        if (wave === 1) {
            return GAPS.map((g, i) => ({
                gap: i,
                layer: 1 as const,
                xz: [g.x, LAYER1_Z] as [number, number],
            })).filter((t) => !sealed.has(t.gap));
        }
        return REINFORCE.map((i) => ({
            gap: i,
            layer: 2 as const,
            xz: [GAPS[i].x, LAYER2_Z] as [number, number],
        })).filter((t) => !reinforced.has(t.gap));
    }, [wave, sealed, reinforced]);

    const onPlace = useCallback(
        (supplyId: string, targetIndex: number) => {
            const t = targets[targetIndex];
            if (!t || phaseRef.current !== 'play') return;
            microSfx.play('correct');
            const neste = { ...placed, [supplyId]: { gap: t.gap, layer: t.layer } };
            setPlaced(neste);

            const verdier = Object.values(neste);
            if (t.layer === 1) {
                const tettet = new Set(verdier.filter((p) => p.layer === 1).map((p) => p.gap));
                if (tettet.size < GAPS.length) {
                    setBanner(`${GAPS[t.gap].navn} er tettet.`);
                    return;
                }
                // Alle fire er tette: bokserne samler seg mot midten.
                setBanner('Alle fire er tettet. Nå samler bokserne seg mot midten.');
                waveTimer.current = setTimeout(() => {
                    if (phaseRef.current !== 'play') return;
                    setWave(2);
                    setBanner('Andre angrep. De to midtre åpningene trenger ett lag til.');
                }, 1500);
                return;
            }

            const lag2 = new Set(verdier.filter((p) => p.layer === 2).map((p) => p.gap));
            if (lag2.size < REINFORCE.length) {
                setBanner(`${GAPS[t.gap].navn} er forsterket.`);
                return;
            }
            // Begge midtåpningene har fått et lag til: kvartalet holdt.
            phaseRef.current = 'won';
            microSfx.play('complete');
            setWinBurst((n) => n + 1);
            setBanner('Kvartalet holdt.');
            setPhase('won');
            onComplete({ score: 1, completed: true });
        },
        [targets, placed, onComplete]
    );

    const onBreach = useCallback((lane: number) => {
        if (phaseRef.current !== 'play') return;
        phaseRef.current = 'lost';
        microSfx.play('incorrect');
        setBanner(`Bokserne brøt gjennom ved ${GAPS[lane].navn}.`);
        setPhase('lost');
    }, []);

    const reset = useCallback(() => {
        if (waveTimer.current) clearTimeout(waveTimer.current);
        phaseRef.current = 'play';
        setAttempt((a) => a + 1);
        setWave(1);
        setPhase('play');
        setPlaced({});
        setBanner('Dra forsyninger ut i åpningene i muren.');
        onRetry?.();
    }, [onRetry]);

    const tettet = wave === 1 ? sealed.size : GAPS.length;
    const lag2 = reinforced.size;

    return (
        <MicroGameScaffold
            title="Beleiringen i Beijing"
            subtitle="Sommeren 1900. Dra forsyninger ut i åpningene i muren før bokserne når fram."
            estimatedSeconds={150}
            onRetry={reset}
            scene={
                <Scene
                    attempt={attempt}
                    wave={wave}
                    phase={phase}
                    placed={placed}
                    targets={targets}
                    sealed={sealed}
                    onPlace={onPlace}
                    onBreach={onBreach}
                    winBurst={winBurst}
                />
            }
            canvas={{
                camera: { position: [0, 13, 17.5], fov: 42 },
                target: [0, 0.5, -3],
                background: '#e6cfa4',
                fog: { color: '#e6cfa4', near: 26, far: 52 },
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Åpninger tettet', value: `${tettet}/${GAPS.length}` },
                            { label: 'Ekstra lag', value: `${lag2}/${REINFORCE.length}` },
                        ]}
                    />
                    <SceneBadge corner="br">Beijing, juni 1900</SceneBadge>
                    <DragHint show={Object.keys(placed).length === 0} corner="bc">
                        Dra en forsyning til en åpning
                    </DragHint>
                </>
            }
        >
            <div className="space-y-3">
                {phase === 'won' && (
                    <WinScreen title="Kvartalet holdt i nesten to måneder." onReplay={reset}>
                        Men det å holde ut var ikke seieren det kan se ut som. Beleiringen ga
                        stormaktene grunnen de trengte: 14. august 1900 tok en internasjonal styrke
                        Beijing og plyndret byen, og året etter måtte Kina betale 450 millioner tael
                        sølv i erstatning.
                    </WinScreen>
                )}
                {phase === 'lost' && (
                    <LoseScreen title="En åpning sto tom da angrepet kom." onRetry={reset}>
                        Bokserne var mange, og de gikk mot den svakeste åpningen først. Se hvem som
                        er nærmest, og tett den åpningen før de andre.
                    </LoseScreen>
                )}
                {phase === 'play' && (
                    <SceneFact>
                        Gesandtskapskvartalet var området i Beijing der de utenlandske utsendingene
                        bodde. Da bokserne stengte dem inne sommeren 1900, barrikaderte de seg med
                        det de hadde for hånden: sandsekker, kjerrer, dører og møbler.
                    </SceneFact>
                )}
            </div>
        </MicroGameScaffold>
    );
}
