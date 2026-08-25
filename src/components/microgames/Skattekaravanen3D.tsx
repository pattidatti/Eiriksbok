import { useCallback, useEffect, useRef, useState } from 'react';
import {
    MicroGameScaffold,
    Interactive,
    Hotspot,
    Mover,
    GroundPlane,
    Building,
    Tree,
    Wall,
    Tower,
    Cart,
    Person,
    Tent,
    Banner,
    Burst,
    THEMES,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    WinScreen,
    LoseScreen,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Skattekaravanen: eleven er fyrsten i Moskva og krever inn skatten for khanen.
// Lyspære: Moskva ble ikke stort ved å slåss mot mongolene, men ved å kreve inn
// skatten for dem - og beholde en bit selv. Beholder du for lite, vokser byen
// aldri. Beholder du for mye, kommer khanens ryttere.

const YEARS = 3;
const CARTS_PER_YEAR = 8;
const KHAN_DEMAND = 4; // må sendes videre hvert år
const WIN_CHEST = 7; // samlet beholdt over tre år for å vinne
const SPAWN_MS = 2000;

const LANES = [-1.5, 0, 1.5];
const ROAD_START = -8.8;
const GATE_X = 0.2;
const ROAD_END = 4.6;

const t = THEMES.medieval;

type Status = 'idle' | 'playing' | 'lostRaid' | 'lostPoor' | 'won';
type CartStatus = 'waiting' | 'leg1' | 'leg2' | 'done';

interface CartState {
    id: number;
    lane: number;
    status: CartStatus;
    kept: boolean;
}

function makeCarts(year: number): CartState[] {
    return Array.from({ length: CARTS_PER_YEAR }, (_, i) => ({
        id: year * 100 + i,
        lane: LANES[i % LANES.length],
        status: 'waiting' as CartStatus,
        kept: false,
    }));
}

function startFirst(carts: CartState[]): CartState[] {
    if (carts.length === 0) return carts;
    const next = carts.slice();
    next[0] = { ...next[0], status: 'leg1' };
    return next;
}

// Moskva vokser med kista: flere hus, høyere tårn og etter hvert murtinder.
function Moskva({ chest }: { chest: number }) {
    const houses = 3 + Math.min(6, chest);
    const stone = chest >= 4;
    const towerH = stone ? 3.4 : 2.5;
    const wallColor = stone ? '#c3bcae' : '#8a6c42';
    return (
        <group position={[0.2, 0, -5.2]}>
            <Wall
                position={[0, 0, 2.4]}
                length={6.4}
                height={1.35}
                color={wallColor}
                crenellations={stone}
            />
            <Tower
                position={[-3, 0, 2.4]}
                radius={0.68}
                height={towerH}
                color={wallColor}
                roof="#8c4a33"
            />
            <Tower
                position={[3, 0, 2.4]}
                radius={0.68}
                height={towerH}
                color={wallColor}
                roof="#8c4a33"
            />
            {Array.from({ length: houses }, (_, i) => (
                <Building
                    key={i}
                    position={[-2.4 + (i % 4) * 1.6, 0, 0.5 - Math.floor(i / 4) * 1.8]}
                    body="#9a7850"
                    roof="#8c4a33"
                    w={1.15}
                    h={1.05}
                    d={1.15}
                    seed={i + 1}
                />
            ))}
            <Person position={[-1.2, 0, 1.9]} pose="idle" body="#5c4a2e" hat="hood" />
            <Person position={[1, 0, 2]} pose="raise" body="#6b4630" hat="cap" />
        </group>
    );
}

// Khanens leir i sør-øst: dit skatten skal videre.
function Saraj() {
    return (
        <group position={[5.6, 0, -4.2]}>
            <Tent position={[0, 0, 0]} color="#c8ad74" scale={1.1} />
            <Tent position={[1.3, 0, 1.3]} color="#bda169" scale={0.85} />
            <Banner position={[-1.2, 0, 1.4]} color={t.accent} height={2.5} />
            <Person position={[-0.5, 0, 2]} pose="idle" body="#4d4030" hat="helmet" />
        </group>
    );
}

function Scene({
    carts,
    chest,
    onKeep,
    onGate,
    onKhan,
    burst,
}: {
    carts: CartState[];
    chest: number;
    onKeep: (id: number) => void;
    onGate: (id: number, kept: boolean) => void;
    onKhan: (id: number) => void;
    burst: number;
}) {
    return (
        <group>
            <GroundPlane color={t.ground} />

            {/* Veien fra fyrstedømmene, forbi Moskva, videre mot khanen. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.1, 0.01, 0]} receiveShadow>
                <planeGeometry args={[16.4, 4.6]} />
                <meshStandardMaterial color="#a8946c" roughness={1} />
            </mesh>

            <Moskva chest={chest} />
            <Saraj />

            {/* Skog på sørsiden av veien. */}
            {[-8, -6, -4, 2.6, 4.4].map((x, i) => (
                <Tree key={x} position={[x, 0, 4.1]} leaf={t.leaf} seed={i + 2} />
            ))}
            <Tree position={[-7.2, 0, -4.4]} leaf={t.leaf} seed={9} />
            <Tree position={[-5.2, 0, -5.2]} leaf={t.leaf} seed={11} />
            <Tree position={[-2.6, 0, -4]} leaf={t.leaf} seed={13} />

            {/* Vognene. Klikk en vogn mens den er på vei inn for å beholde den. */}
            {carts.map((c) => {
                if (c.status === 'waiting' || c.status === 'done') return null;
                const leg1 = c.status === 'leg1';
                const from: [number, number, number] = leg1
                    ? [ROAD_START, 0, c.lane]
                    : [GATE_X, 0, c.lane];
                const to: [number, number, number] = leg1
                    ? [GATE_X, 0, c.lane]
                    : [ROAD_END, 0, c.lane];
                return (
                    <Mover
                        key={`${c.id}-${c.status}`}
                        from={from}
                        to={to}
                        speed={leg1 ? 1.15 : 3.0}
                        bob={0.04}
                        phase={c.id}
                        // Posisjonen er fasit. onArrive kan fyre på første frame
                        // (før Mover har målt rutelengden), og da ville vogna
                        // "komme fram" i samme øyeblikk den startet.
                        onMove={(x) => {
                            if (leg1) {
                                if (x >= GATE_X - 0.05) onGate(c.id, c.kept);
                            } else if (x >= ROAD_END - 0.05) {
                                onKhan(c.id);
                            }
                        }}
                    >
                        <Interactive
                            onSelect={() => onKeep(c.id)}
                            disabled={!leg1 || c.kept}
                            state={c.kept ? 'correct' : undefined}
                            hitArea={[3.4, 2.6, 3.4]}
                            sound="correct"
                        >
                            <Cart color={c.kept ? '#d9a441' : '#7a5230'} wheel="#3a2a18" />
                            {c.kept && (
                                <mesh position={[0, 1.02, 0]} castShadow>
                                    <sphereGeometry args={[0.24, 12, 12]} />
                                    <meshStandardMaterial
                                        color="#f5cf72"
                                        emissive="#8a6410"
                                        emissiveIntensity={0.45}
                                        roughness={0.4}
                                    />
                                </mesh>
                            )}
                        </Interactive>
                        {leg1 && !c.kept && (
                            <Hotspot
                                position={[0, 1.7, 0]}
                                radius={0.9}
                                onSelect={() => onKeep(c.id)}
                                label="Behold i Moskva"
                            />
                        )}
                    </Mover>
                );
            })}

            <Burst position={[0.2, 1.6, -3.2]} trigger={burst} />
        </group>
    );
}

export default function Skattekaravanen3D({ onComplete, onRetry }: MicroGameProps) {
    const [attempt, setAttempt] = useState(0);
    const [year, setYear] = useState(1);
    const [carts, setCarts] = useState<CartState[]>(() => makeCarts(1));
    const [khanPaid, setKhanPaid] = useState(0);
    const [chest, setChest] = useState(0);
    const [status, setStatus] = useState<Status>('idle');
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Skatten fra nabobyene er på vei. Start året når du er klar.'
    );

    // Slipp løs én ventende vogn av gangen, så veien alltid lever.
    useEffect(() => {
        if (status !== 'playing') return;
        const timer = window.setInterval(() => {
            setCarts((prev) => {
                const idx = prev.findIndex((c) => c.status === 'waiting');
                if (idx === -1) return prev;
                const next = prev.slice();
                next[idx] = { ...next[idx], status: 'leg1' };
                return next;
            });
        }, SPAWN_MS);
        return () => window.clearInterval(timer);
    }, [status, year, attempt]);

    const onKeep = useCallback((id: number) => {
        setCarts((prev) =>
            prev.map((c) => (c.id === id && c.status === 'leg1' ? { ...c, kept: true } : c))
        );
        setBanner('Den vogna blir i Moskva.');
    }, []);

    // Årets regnskap lever i refs: en vogn kan komme fram midt i en frame, og
    // flere kan komme fram i samme frame. Refs teller riktig uansett.
    const yearRef = useRef(1);
    const paidRef = useRef(0);
    const chestRef = useRef(0);
    const resolvedRef = useRef(0);
    // Én vogn skal telles nøyaktig én gang, uansett om onArrive skulle fyre to ganger.
    const settledRef = useRef<Set<number>>(new Set());
    // Samme vogn skal bare passere porten én gang, selv om onMove fyrer hver frame.
    const gatedRef = useRef<Set<number>>(new Set());

    // Én vogn er ferdig behandlet: enten beholdt i Moskva, eller sendt videre.
    // Når alle årets vogner er gjort opp, faller årsoppgjøret her og da.
    const settle = useCallback(
        (id: number, kept: boolean) => {
            if (settledRef.current.has(id)) return;
            settledRef.current.add(id);
            if (kept) {
                chestRef.current += 1;
                setChest(chestRef.current);
                setBurst((b) => b + 1);
            } else {
                paidRef.current += 1;
                setKhanPaid(paidRef.current);
            }

            resolvedRef.current += 1;
            if (resolvedRef.current < CARTS_PER_YEAR) return;

            if (paidRef.current < KHAN_DEMAND) {
                microSfx.play('incorrect');
                setStatus('lostRaid');
                return;
            }
            if (yearRef.current >= YEARS) {
                if (chestRef.current >= WIN_CHEST) {
                    microSfx.play('complete');
                    setStatus('won');
                    onComplete({
                        score: 1,
                        completed: true,
                        artifact: { chest: chestRef.current, years: YEARS },
                    });
                } else {
                    microSfx.play('incorrect');
                    setStatus('lostPoor');
                }
                return;
            }

            yearRef.current += 1;
            paidRef.current = 0;
            resolvedRef.current = 0;
            microSfx.play('advance');
            setYear(yearRef.current);
            setKhanPaid(0);
            setCarts(startFirst(makeCarts(yearRef.current)));
            setBanner(`Khanen fikk sitt. År ${yearRef.current} begynner.`);
        },
        [onComplete]
    );

    const onGate = useCallback(
        (id: number, kept: boolean) => {
            if (gatedRef.current.has(id)) return;
            gatedRef.current.add(id);
            setCarts((prev) =>
                prev.map((c) => (c.id === id ? { ...c, status: kept ? 'done' : 'leg2' } : c))
            );
            if (kept) settle(id, true);
        },
        [settle]
    );

    const onKhan = useCallback(
        (id: number) => {
            setCarts((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'done' } : c)));
            settle(id, false);
        },
        [settle]
    );

    const reset = useCallback(() => {
        yearRef.current = 1;
        paidRef.current = 0;
        chestRef.current = 0;
        resolvedRef.current = 0;
        settledRef.current = new Set();
        gatedRef.current = new Set();
        setAttempt((a) => a + 1);
        setYear(1);
        setCarts(makeCarts(1));
        setKhanPaid(0);
        setChest(0);
        setStatus('idle');
        setBurst(0);
        setBanner('Skatten fra nabobyene er på vei. Start året når du er klar.');
        onRetry?.();
    }, [onRetry]);

    const rolling = carts.some((c) => c.status === 'leg1' || c.status === 'leg2');

    return (
        <MicroGameScaffold
            title="Skattekaravanen"
            subtitle="Du er fyrsten i Moskva. Skatten fra nabobyene går gjennom deg, videre til khanen. Klikk en vogn for å la den bli igjen hos deg."
            estimatedSeconds={150}
            onRetry={reset}
            scene={
                <Scene
                    key={attempt}
                    carts={carts}
                    chest={chest}
                    onKeep={onKeep}
                    onGate={onGate}
                    onKhan={onKhan}
                    burst={burst}
                />
            }
            canvas={{
                camera: { position: [-0.6, 9.4, 16], fov: 44 },
                target: [-1.4, 0.4, -1.6],
                background: t.sky,
                fog: { color: t.fog, near: 30, far: 62 },
                light: 'overcast',
                idle: false,
                // Fast sideblikk: eleven skal klikke vogner, ikke slåss med kamerarotasjon.
                controls: false,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            {
                                label: 'Sendt til khanen',
                                value: khanPaid,
                                unit: `(krav ${KHAN_DEMAND})`,
                            },
                            {
                                label: 'Moskvas kiste',
                                value: chest,
                                unit: `(mål ${WIN_CHEST})`,
                            },
                        ]}
                    />
                    <SceneBadge corner="br">{`År ${year} av ${YEARS}`}</SceneBadge>
                    <DragHint
                        show={status === 'playing' && rolling && chest === 0}
                        corner="bc"
                    >
                        Klikk en vogn før den passerer byen
                    </DragHint>
                </>
            }
        >
            {status === 'idle' && (
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => {
                            setStatus('playing');
                            setCarts((prev) => startFirst(prev));
                            setBanner('År 1. Klikk en vogn på veien for å beholde den i Moskva.');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Start år 1
                    </button>
                    <p className="text-sm text-slate-600">
                        Khanen krever {KHAN_DEMAND} vogner hvert år. Alt du beholder utover det,
                        bygger Moskva.
                    </p>
                </div>
            )}

            {status === 'playing' && (
                <p className="text-sm text-slate-600">
                    Khanen krever {KHAN_DEMAND} vogner hvert år. Alt du beholder utover det,
                    bygger Moskva. Beholder du for mye, kommer rytterne hans.
                </p>
            )}

            {status === 'won' && (
                <WinScreen title="Moskva ble stor" onReplay={reset}>
                    Du betalte khanen i tide hvert eneste år, og beholdt en bit selv. Moskva slo
                    aldri mongolene i denne perioden. Byen jobbet for dem, og vokste på jobben.
                </WinScreen>
            )}

            {status === 'lostRaid' && (
                <LoseScreen title="Khanens ryttere kom" onRetry={reset} retryLabel="Prøv igjen">
                    Du sendte bare {khanPaid} av {KHAN_DEMAND} vogner videre. Khanen straffet
                    fyrster som kom til kort. Behold mindre, og sørg for at kvoten alltid går
                    gjennom.
                </LoseScreen>
            )}

            {status === 'lostPoor' && (
                <LoseScreen title="Moskva forble en liten by" onRetry={reset} retryLabel="Prøv igjen">
                    Du betalte alt du krevde inn, hvert år. Khanen var fornøyd, men kista var tom,
                    og Moskva vokste aldri forbi naboene. Tør å beholde mer, uten å svikte kvoten.
                </LoseScreen>
            )}
        </MicroGameScaffold>
    );
}
