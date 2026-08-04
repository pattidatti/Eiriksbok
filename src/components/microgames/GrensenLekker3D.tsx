import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MicroGameScaffold,
    Interactive,
    Mover,
    Person,
    Tower,
    Tree,
    Building,
    Hill,
    GroundPlane,
    WaterPlane,
    FlatRing,
    Burst,
    useMeter,
    useGameClock,
    useRandomPulse,
    TimerPill,
    MeterBar,
    DataReadout,
    SceneBanner,
    WinScreen,
    LoseScreen,
    SceneFact,
} from './kit';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: Vestromerriket tapte ikke ETT slag. Det hadde en grense det
// ikke hadde råd til å bemanne. Eleven kjenner selv på saksa: hver legion du
// holder ute koster penger hvert sekund, men hvert vadested du forlater blir
// plyndret. Uansett hva eleven velger, lekker det et sted.

const CROSSINGS = [-10, -6, -2, 2, 6, 10];
const BANK_Z = 2.4; // romersk bredd der legionene står
const FAR_Z = -9.5; // der angriperne dukker opp
const RIVER_Z = -0.6;
const MARCH_SPEED = 2.0;
const RAID_SPEED = 1.55;
const TIME_LIMIT = 60;

// Statskasse-modellen. Måleren stiger = underskuddet vokser. Når den når 1 er
// kassa tom. Tallene er balansert slik at 4 legioner er uholdbart, 3 er
// omtrent i balanse og 2 sparer penger - men da står tre vadesteder åpne.
const TAX_INCOME = 0.085; // per sekund (drainPerSecond i useMeter)
const COST_PER_LEGION = 0.03; // per legion per sekund
const BREACH_COST = 0.13; // plyndring
const RECRUIT_COST = 0.1; // engangsutgift ved å verve en ny legion
const START_PRESSURE = 0.22;
const MAX_LEGIONS = 4;

type GameState = 'idle' | 'playing' | 'won' | 'lost';

const START_LEGIONS: Legion[] = [
    { id: 1, fromIndex: 1, toIndex: 1, moving: false, orderId: 0 },
    { id: 2, fromIndex: 2, toIndex: 2, moving: false, orderId: 0 },
    { id: 3, fromIndex: 3, toIndex: 3, moving: false, orderId: 0 },
    { id: 4, fromIndex: 4, toIndex: 4, moving: false, orderId: 0 },
];

interface Legion {
    id: number;
    fromIndex: number; // vadestedet den forlot
    toIndex: number; // vadestedet den er på vei til (eller står på)
    moving: boolean;
    orderId: number; // endres ved hver nye ordre, tvinger Mover til å starte på nytt
}

interface Raid {
    id: number;
    crossing: number;
    state: 'moving' | 'dying' | 'gone';
}

/* ---------------------------------------------------------------- scene ---- */

function Frontier({
    legions,
    raids,
    selected,
    onSelectLegion,
    onOrder,
    onRaidArrive,
    onRaidGone,
    onLegionArrive,
    burstAt,
    burstTrigger,
    interactive,
}: {
    legions: Legion[];
    raids: Raid[];
    selected: number | null;
    onSelectLegion: (id: number) => void;
    onOrder: (crossingIndex: number) => void;
    onRaidArrive: (raid: Raid) => void;
    onRaidGone: (id: number) => void;
    onLegionArrive: (id: number) => void;
    burstAt: [number, number, number];
    burstTrigger: number;
    interactive: boolean;
}) {
    // Hvilke vadesteder er faktisk bemannet akkurat nå (ikke på marsj)?
    const held = useMemo(
        () => new Set(legions.filter((l) => !l.moving).map((l) => l.toIndex)),
        [legions]
    );

    return (
        <group>
            {/* Land: romersk side i sør, barbarisk skogland i nord */}
            <GroundPlane size={46} color="#8fae63" position={[0, 0, 6]} />
            <GroundPlane size={46} color="#6d8a54" position={[0, -0.01, -16]} />

            {/* Elva som er selve grensen */}
            <WaterPlane position={[0, 0.04, RIVER_Z]} size={[46, 3.4]} color="#5aa0c8" />

            {/* Landskap: skog i nord, villaer og åser i sør */}
            {[-14, -9, -4, 1, 6, 11, 15].map((x, i) => (
                <Tree key={`t${x}`} position={[x, 0, -6.5 - (i % 3) * 2.2]} seed={i + 3} leaf="#3f6b3a" />
            ))}
            {[-13, -3, 8].map((x, i) => (
                <Hill key={`h${x}`} position={[x, 0, -13 - i]} radius={4.5} height={1.6} color="#5f7c4a" seed={i + 1} />
            ))}
            {[-15, -8, 8, 15].map((x, i) => (
                <Building
                    key={`b${x}`}
                    position={[x, 0, 9.5 + (i % 2) * 2.5]}
                    body="#e8dcc2"
                    roof="#b4553d"
                    w={2.0}
                    h={1.4}
                    d={1.8}
                    seed={i + 2}
                />
            ))}

            {/* Vadestedene: klikkbare grenseposter */}
            {CROSSINGS.map((x, i) => {
                const manned = held.has(i);
                return (
                    <group key={`c${i}`}>
                        <Interactive
                            onSelect={() => onOrder(i)}
                            disabled={!interactive || selected === null}
                            hitArea={[3.2, 3.2, 4.2]}
                            position={[x, 0, BANK_Z - 0.4]}
                            hoverScale={1.1}
                        >
                            <group>
                                {/* Vakttårnet står nærmere elva enn legionen, ellers
                                    skjuler det figuren sett fra kameraet. */}
                                <Tower
                                    position={[0, 0, -0.9]}
                                    radius={0.52}
                                    height={2.5}
                                    color={manned ? '#d8cbb0' : '#a89f8d'}
                                    roof={manned ? '#b4553d' : '#7d6f5e'}
                                />
                                {/* Selve vadet, markert i elva */}
                                <FlatRing
                                    position={[0, 0.07, RIVER_Z - BANK_Z + 0.4]}
                                    radius={1.25}
                                    tube={0.16}
                                    color={manned ? '#facc15' : '#f87171'}
                                />
                            </group>
                        </Interactive>
                    </group>
                );
            })}

            {/* Legionene */}
            {legions.map((l) => (
                <Mover
                    key={`${l.id}-${l.orderId}`}
                    from={[CROSSINGS[l.fromIndex], 0, BANK_Z]}
                    to={[CROSSINGS[l.toIndex], 0, BANK_Z]}
                    speed={MARCH_SPEED}
                    state={l.moving ? 'moving' : 'frozen'}
                    phase={l.id}
                    bob={l.moving ? 0.08 : 0}
                    onArrive={() => onLegionArrive(l.id)}
                >
                    <Interactive
                        onSelect={() => onSelectLegion(l.id)}
                        disabled={!interactive}
                        state={selected === l.id ? 'selected' : undefined}
                        hitArea={[1.6, 2.6, 1.6]}
                        hoverScale={1.12}
                    >
                        <group>
                            <Person
                                pose={l.moving ? 'walk' : 'idle'}
                                body="#b32d2d"
                                legs="#8a6b4f"
                                hat="helmet"
                                hatColor="#c9a227"
                            />
                            {selected === l.id && (
                                <FlatRing position={[0, 0.06, 0]} radius={0.85} tube={0.1} color="#facc15" />
                            )}
                        </group>
                    </Interactive>
                </Mover>
            ))}

            {/* Angripere som krysser elva i sanntid */}
            {raids.map((r) => (
                <Mover
                    key={r.id}
                    from={[CROSSINGS[r.crossing], 0, FAR_Z]}
                    to={[CROSSINGS[r.crossing], 0, BANK_Z - 1.1]}
                    speed={RAID_SPEED}
                    state={r.state}
                    phase={r.id}
                    deathStyle="pop"
                    onArrive={() => onRaidArrive(r)}
                    onDeathDone={() => onRaidGone(r.id)}
                >
                    <Person pose="walk" body="#4b5563" legs="#3f3b34" hat="hood" hatColor="#374151" />
                </Mover>
            ))}

            <Burst position={burstAt} trigger={burstTrigger} color="#fbbf24" count={22} spread={2.6} />
        </group>
    );
}

/* ----------------------------------------------------------------- spill ---- */

const GrensenLekker3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [legions, setLegions] = useState<Legion[]>(() => START_LEGIONS);
    const [raids, setRaids] = useState<Raid[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [breaches, setBreaches] = useState(0);
    const [repelled, setRepelled] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [burstAt, setBurstAt] = useState<[number, number, number]>([0, 1, 0]);
    const [burstTrigger, setBurstTrigger] = useState(0);

    const nextId = useRef(1);
    const nextOrder = useRef(1);
    const legionsRef = useRef<Legion[]>([]);
    const completedRef = useRef(false);
    const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        legionsRef.current = legions;
    }, [legions]);

    useEffect(
        () => () => {
            if (bannerTimer.current) clearTimeout(bannerTimer.current);
        },
        []
    );

    const say = useCallback((message: string) => {
        setBanner(message);
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setBanner(null), 2600);
    }, []);

    const pressure = useMeter({
        initial: START_PRESSURE,
        drainPerSecond: TAX_INCOME,
        overloadAt: 1,
        recoverTo: 0.55,
        onOverload: () => setGameState('lost'),
    });

    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => setGameState('won'),
    });

    // Lønn til hæren: trekkes hvert 100 ms ut fra hvor mange legioner som er ute.
    const pressureAdd = pressure.add;
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            pressureAdd(legionsRef.current.length * COST_PER_LEGION * 0.1);
        }, 100);
        return () => clearInterval(t);
    }, [gameState, pressureAdd]);

    // Innfall kommer på tilfeldige vadesteder, uavhengig av hva eleven gjør.
    useRandomPulse({
        running: gameState === 'playing',
        minDelayMs: 4200,
        maxDelayMs: 7600,
        onPulse: () => {
            const crossing = Math.floor(Math.random() * CROSSINGS.length);
            setRaids((prev) => [...prev, { id: nextId.current++, crossing, state: 'moving' }]);
        },
    });

    const startGame = useCallback(() => {
        completedRef.current = false;
        nextOrder.current = 1;
        setLegions(START_LEGIONS);
        setRaids([]);
        setSelected(null);
        setBreaches(0);
        setRepelled(0);
        pressure.reset();
        clock.restart();
        setGameState('playing');
        say('Hold grensen i 60 sekunder. Klikk en legion, så et vadested.');
    }, [clock, pressure, say]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setLegions(START_LEGIONS);
        setRaids([]);
        setSelected(null);
        setBreaches(0);
        setBanner(null);
        setRepelled(0);
        pressure.reset();
        clock.restart();
    }, [clock, pressure]);

    const handleSelectLegion = useCallback((id: number) => {
        setSelected((prev) => (prev === id ? null : id));
    }, []);

    const handleOrder = useCallback(
        (crossingIndex: number) => {
            if (selected === null) return;
            setLegions((prev) =>
                prev.map((l) => {
                    if (l.id !== selected) return l;
                    if (!l.moving && l.toIndex === crossingIndex) return l;
                    // Marsjerer den allerede, starter den nye marsjen fra vadestedet
                    // den var på vei fra. Det er en forenkling, men den holder
                    // marsjtiden ærlig: å snu koster tid.
                    return {
                        ...l,
                        fromIndex: l.moving ? l.fromIndex : l.toIndex,
                        toIndex: crossingIndex,
                        moving: true,
                        orderId: nextOrder.current++,
                    };
                })
            );
            setSelected(null);
        },
        [selected]
    );

    const handleLegionArrive = useCallback((id: number) => {
        setLegions((prev) =>
            prev.map((l) => (l.id === id ? { ...l, fromIndex: l.toIndex, moving: false } : l))
        );
    }, []);

    const handleRaidArrive = useCallback(
        (raid: Raid) => {
            const defended = legionsRef.current.some((l) => !l.moving && l.toIndex === raid.crossing);
            if (defended) {
                setBurstAt([CROSSINGS[raid.crossing], 1.1, BANK_Z - 0.8]);
                setBurstTrigger((t) => t + 1);
                setRaids((prev) => prev.map((r) => (r.id === raid.id ? { ...r, state: 'dying' } : r)));
                setRepelled((n) => n + 1);
                say('Vadestedet var bemannet. Angrepet ble slått tilbake.');
            } else {
                setRaids((prev) => prev.map((r) => (r.id === raid.id ? { ...r, state: 'dying' } : r)));
                setBreaches((b) => b + 1);
                pressure.add(BREACH_COST);
                say('Ingen forsvarte vadestedet. Provinsen ble plyndret.');
            }
        },
        [pressure, say]
    );

    const handleRaidGone = useCallback((id: number) => {
        setRaids((prev) => prev.filter((r) => r.id !== id));
    }, []);

    const disband = useCallback(() => {
        setLegions((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
        setSelected(null);
        say('Du oppløste en legion. Billigere, men ett vadested mindre er dekket.');
    }, [say]);

    const recruit = useCallback(() => {
        setLegions((prev) => {
            if (prev.length >= MAX_LEGIONS) return prev;
            const taken = new Set(prev.map((l) => l.toIndex));
            const free = CROSSINGS.findIndex((_, i) => !taken.has(i));
            const at = free === -1 ? 0 : free;
            return [
                ...prev,
                { id: nextId.current++, fromIndex: at, toIndex: at, moving: false, orderId: 0 },
            ];
        });
        pressure.add(RECRUIT_COST);
        say('Nye soldater må verves, og verving koster med en gang.');
    }, [pressure, say]);

    // Seier: meld fra én gang.
    useEffect(() => {
        if (gameState !== 'won' || completedRef.current) return;
        completedRef.current = true;
        const total = repelled + breaches;
        onComplete({
            score: total === 0 ? 1 : repelled / total,
            completed: true,
        });
    }, [gameState, onComplete, repelled, breaches]);

    return (
        <MicroGameScaffold
            title="Grensen som lekker"
            subtitle="Du er statskassa i Vestromerriket. Hold Rhinen og Donau i 60 sekunder - uten å gå tom for penger"
            estimatedSeconds={150}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                camera: { position: [0, 16.5, 23], fov: 41 },
                target: [0, 0, -1.5],
                background: '#cfe4f2',
                fog: { color: '#cfe4f2', near: 30, far: 62 },
                light: 'overcast',
                idle: gameState === 'idle',
                minPolarAngle: 0.35,
                maxPolarAngle: 1.15,
            }}
            containerClassName="bg-gradient-to-b from-[#cfe4f2] via-[#dfe9e2] to-[#9fb877]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    {gameState === 'playing' && (
                        <TimerPill seconds={clock.remaining} label="Holder ut" warnBelow={12} corner="br" />
                    )}
                    <DataReadout
                        corner="tr"
                        items={[
                            { label: 'Legioner', value: legions.length },
                            { label: 'Avverget', value: repelled },
                            { label: 'Plyndret', value: breaches },
                        ]}
                    />
                </>
            }
            scene={
                <Frontier
                    legions={legions}
                    raids={raids}
                    selected={selected}
                    onSelectLegion={handleSelectLegion}
                    onOrder={handleOrder}
                    onRaidArrive={handleRaidArrive}
                    onRaidGone={handleRaidGone}
                    onLegionArrive={handleLegionArrive}
                    burstAt={burstAt}
                    burstTrigger={burstTrigger}
                    interactive={gameState === 'playing'}
                />
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={pressure.value}
                    label="Press på statskassa"
                    hint="Hver legion du holder ute koster penger hvert sekund. Hvert vadested du forlater blir plyndret."
                    warnAt={0.6}
                    dangerAt={0.85}
                    labels={{ normal: 'Skattene holder', warn: 'Det strammer seg til', danger: 'Kassa er tom!' }}
                />

                {gameState === 'idle' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={startGame}
                            className="bg-rose-700 hover:bg-rose-800 text-white rounded-full px-6 py-2 text-sm font-bold transition"
                        >
                            Overta grensevakten
                        </button>
                        <p className="text-xs text-slate-600 flex-1 min-w-[14rem]">
                            Seks vadesteder. Fire legioner. Klikk en legion, så vadestedet den skal
                            marsjere til. Marsjen tar tid.
                        </p>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={disband}
                            disabled={legions.length <= 1}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-full px-4 py-2 text-xs font-bold disabled:opacity-40 transition"
                        >
                            Oppløs en legion (sparer lønn)
                        </button>
                        <button
                            type="button"
                            onClick={recruit}
                            disabled={legions.length >= MAX_LEGIONS}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-full px-4 py-2 text-xs font-bold disabled:opacity-40 transition"
                        >
                            Verv en legion (koster med en gang)
                        </button>
                        <p className="text-xs text-slate-500 flex-1 min-w-[12rem]">
                            {selected === null
                                ? 'Klikk en legion for å gi den ordre.'
                                : 'Klikk vadestedet legionen skal marsjere til.'}
                        </p>
                    </div>
                )}

                {gameState === 'won' && (
                    <WinScreen title="Du holdt grensen - men se på regnskapet" onReplay={startGame}>
                        Du avverget {repelled} angrep og mistet {breaches} provinser til plyndring. Du
                        klarte det ikke ved å vinne et slag, men ved å bestemme hva du skulle gi opp.
                        Slik var det for Vestromerriket også: grensen var for lang, hæren for dyr, og
                        skattene tok slutt før fiendene gjorde det.
                    </WinScreen>
                )}

                {gameState === 'lost' && (
                    <LoseScreen title="Statskassa er tom" onRetry={startGame} retryLabel="Prøv igjen">
                        Uten penger finnes det ingen hær. Da vestromerske keisere gikk tom, betalte de
                        soldatene med jord i stedet for lønn - og soldater som eide jorda de sto på,
                        ble til slutt mer lojale mot sin egen herre enn mot Roma.
                    </LoseScreen>
                )}

                <SceneFact>
                    Vestromerriket falt ikke i ett slag. Grensen langs Rhinen og Donau var flere tusen
                    kilometer lang, og staten hadde ikke råd til å bemanne alt samtidig. Da Nord-Afrika
                    gikk tapt i 439, forsvant også kornet og skattene derfra. Etter det måtte keiserne
                    velge hvilke provinser de skulle slippe.
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
};

export default GrensenLekker3D;
