import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MicroGameScaffold,
    Shoreline,
    Boat,
    Building,
    Person,
    Hill,
    Tree,
    Rock,
    Fire,
    Banner,
    Interactive,
    Mover,
    SceneBanner,
    DataReadout,
    WinScreen,
    LoseScreen,
    TimerPill,
    MeterBar,
    SceneFact,
    useGameClock,
    useRandomPulse,
    microSfx,
    faceAlong,
} from './kit';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Samlet Harald Hårfagre virkelig Norge?".
//
// Lyspære-øyeblikket: Harald hadde ingen hær som kunne stå overalt. Makten hans
// var tre skip, gaver og vennskap med høvdinger langs kystleia. Eleven prøver å
// holde seks kystgårder trofaste i sanntid - og oppdager at innlandet aldri kan
// nås med skip. Da blir sagaens "hele Norge" vanskelig å tro.
//
// Mekanikken ER poenget: troskapen renner ut av seg selv, og eleven må dosere
// tre skip mellom seks gårder mens uro bryter ut på tilfeldige steder.

const WATER_Y = 0.06;
const SPLIT_X = -1; // kystlinja: land der x < -1, hav der x > -1
const SHIP_STOP_X = 1.7; // der skipet legger seg utenfor gården
const HOME_X = 6.4; // hjemmeposisjon ute på leia
const ROUND_SECONDS = 75;
const SHIP_SPEED = 5.2;

// Drenering per sekund. Vakthold halverer forfallet - "kongen ligger her nå".
const DRAIN_COAST = 0.055;
const DRAIN_GUARDED = 0.011;
const DRAIN_INLAND = 0.05;
const UNREST_HIT = 0.3;

interface Seat {
    id: string;
    name: string;
    kind: 'kyst' | 'innland';
    x: number;
    z: number;
    // Startverdi for troskapen. Ulik per gård, så de ikke faller i takt.
    start: number;
}

// Kystgårdene ligger som perler på en snor langs leia, én dagsseiling fra
// hverandre. Innlandsbygdene ligger bak fjellryggen, utenfor skipenes rekkevidde.
const SEATS: Seat[] = [
    { id: 'avaldsnes', name: 'Avaldsnes', kind: 'kyst', x: -4.6, z: 11.4, start: 1 },
    { id: 'utstein', name: 'Utstein', kind: 'kyst', x: -4.1, z: 6.8, start: 0.84 },
    { id: 'fitjar', name: 'Fitjar', kind: 'kyst', x: -4.8, z: 2.3, start: 0.95 },
    { id: 'alrekstad', name: 'Alrekstad', kind: 'kyst', x: -4.2, z: -2.3, start: 0.76 },
    { id: 'seim', name: 'Seim', kind: 'kyst', x: -4.9, z: -6.8, start: 0.9 },
    { id: 'sogn', name: 'Sogn', kind: 'kyst', x: -4.3, z: -11.4, start: 0.68 },
    { id: 'opplandene', name: 'Opplandene', kind: 'innland', x: -16.6, z: 4.4, start: 0.9 },
    { id: 'dalene', name: 'Innlandsdalene', kind: 'innland', x: -17.0, z: -5.6, start: 0.8 },
];

// Skogen i innlandet. Plasseringene er valgt manuelt så ingen trær havner inne
// i fjellryggen (x fra -13,6 til -6,0) eller oppå en gård.
const TREES: [number, number][] = [
    [-20.6, -14],
    [-20.6, -10.5],
    [-20.6, -1],
    [-20.6, 9],
    [-20.6, 13.5],
    [-16.2, -14.5],
    [-16.2, -11],
    [-16.2, -0.5],
    [-16.2, 9.5],
    [-16.2, 13],
    [-18.4, -12.5],
    [-18.4, 0.5],
    [-18.4, 11.5],
    [-21.8, -6],
    [-21.8, 4],
];

const COAST = SEATS.filter((s) => s.kind === 'kyst');
const INLAND = SEATS.filter((s) => s.kind === 'innland');

interface Ship {
    id: number;
    x: number;
    z: number;
    // Målet skipet er på vei til. Null = ligger i ro.
    target: { seatId: string; x: number; z: number } | null;
    // Gården skipet ligger utenfor akkurat nå.
    at: string | null;
}

const START_SHIPS: Ship[] = [
    { id: 0, x: HOME_X, z: 8.4, target: null, at: null },
    { id: 1, x: HOME_X, z: 0, target: null, at: null },
    { id: 2, x: HOME_X, z: -8.4, target: null, at: null },
];

function startLoyalty(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const s of SEATS) out[s.id] = s.start;
    return out;
}

type Phase = 'playing' | 'won' | 'lost';

// ---------- 3D: én gård med troskapsstolpe ----------

function Farm({
    seat,
    loyalty,
    guarded,
    onSelect,
}: {
    seat: Seat;
    loyalty: number;
    guarded: boolean;
    onSelect: () => void;
}) {
    const revolt = loyalty <= 0.005;
    const barColor = revolt ? '#b91c1c' : loyalty > 0.55 ? '#d4a017' : '#a16207';
    const flag = revolt ? '#7f1d1d' : loyalty > 0.55 ? '#c2410c' : '#78716c';
    const barHeight = Math.max(0.02, loyalty * 1.9);
    return (
        <Interactive
            position={[seat.x, 0, seat.z]}
            onSelect={onSelect}
            state={revolt ? 'wrong' : guarded ? 'correct' : 'idle'}
            hitArea={[3.2, 2.4, 3.2]}
            hoverScale={1.04}
        >
            <group>
                {/* Langhuset */}
                <Building
                    position={[0, 0, 0]}
                    w={2.2}
                    h={1.3}
                    d={1.55}
                    body={revolt ? '#6b4a3a' : '#a8815a'}
                    roof={revolt ? '#3f2d24' : '#5c3326'}
                    seed={seat.z}
                />
                {/* Høvdingen på tunet */}
                <Person
                    position={[1.5, 0, 0.8]}
                    pose={revolt ? 'raise' : 'idle'}
                    body={revolt ? '#7f1d1d' : '#4b5563'}
                    hat="helmet"
                    hatColor="#94a3b8"
                    rotation={[0, Math.PI / 2, 0]}
                />
                {/* Merket for troskap: stolpen synker når gården glir unna */}
                <mesh position={[-1.6, barHeight / 2, 0]} scale={[1, barHeight, 1]} visible={loyalty > 0.02}>
                    <boxGeometry args={[0.26, 1, 0.26]} />
                    <meshStandardMaterial color={barColor} roughness={0.7} />
                </mesh>
                <Banner position={[-1.6, 0, 0.9]} color={flag} height={2.2} />
                {revolt && <Fire position={[1.1, 0, -0.9]} scale={0.9} />}
            </group>
        </Interactive>
    );
}

// ---------- Spillet ----------

export default function HoldNordvegen3D({ onComplete }: MicroGameProps) {
    const [phase, setPhase] = useState<Phase>('playing');
    const [attempt, setAttempt] = useState(0);
    const [loyal, setLoyal] = useState<Record<string, number>>(startLoyalty);
    const [ships, setShips] = useState<Ship[]>(START_SHIPS);
    const [banner, setBanner] = useState<string | null>(
        'Klikk en gård på kysten. Da seiler ett av kongens skip dit.'
    );

    const loyalRef = useRef(loyal);
    const shipsRef = useRef(ships);
    const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        shipsRef.current = ships;
    }, [ships]);
    useEffect(
        () => () => {
            if (bannerTimer.current) clearTimeout(bannerTimer.current);
        },
        []
    );

    // Troskapen bor både i state (for tegning) og i en ref (for logikk utenfor
    // render). Alle endringer går gjennom denne, så de to aldri kommer i utakt.
    const applyLoyal = useCallback(
        (fn: (prev: Record<string, number>) => Record<string, number>) => {
            const next = fn(loyalRef.current);
            loyalRef.current = next;
            setLoyal(next);
            return next;
        },
        []
    );

    const say = useCallback((msg: string) => {
        setBanner(msg);
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setBanner(null), 3200);
    }, []);

    const coastRevolt = COAST.filter((s) => (loyal[s.id] ?? 0) <= 0.005).length;
    const coastLoyal = COAST.length - coastRevolt;
    const inlandLoyal = INLAND.filter((s) => (loyal[s.id] ?? 0) > 0.005).length;
    const unrest =
        1 - COAST.reduce((sum, s) => sum + (loyal[s.id] ?? 0), 0) / Math.max(1, COAST.length);

    const finish = useCallback(() => {
        const revolts = COAST.filter((s) => (loyalRef.current[s.id] ?? 0) <= 0.005).length;
        setPhase(revolts <= 1 ? 'won' : 'lost');
    }, []);

    const clock = useGameClock({
        seconds: ROUND_SECONDS,
        running: phase === 'playing',
        onExpire: finish,
    });

    // Troskapen renner ut av seg selv. Vakthold bremser den kraftig.
    useEffect(() => {
        if (phase !== 'playing') return;
        const t = setInterval(() => {
            const next = applyLoyal((prev) => {
                const guarded = new Set<string>();
                for (const s of shipsRef.current) if (s.at) guarded.add(s.at);
                const out: Record<string, number> = {};
                for (const seat of SEATS) {
                    const drain =
                        seat.kind === 'innland'
                            ? DRAIN_INLAND
                            : guarded.has(seat.id)
                              ? DRAIN_GUARDED
                              : DRAIN_COAST;
                    out[seat.id] = Math.max(0, (prev[seat.id] ?? 0) - drain * 0.1);
                }
                return out;
            });
            // Tre gårder i opprør samtidig, og riket faller fra hverandre.
            const revolts = COAST.filter((s) => (next[s.id] ?? 0) <= 0.005).length;
            if (revolts >= 3) {
                microSfx.play('incorrect');
                setPhase('lost');
            }
        }, 100);
        return () => clearInterval(t);
    }, [phase, applyLoyal]);

    // Uro bryter ut der eleven ikke er. Miljøet er fiendtlig uansett.
    useRandomPulse({
        running: phase === 'playing',
        minDelayMs: 5200,
        maxDelayMs: 9600,
        onPulse: () => {
            const kandidater = COAST.filter((s) => (loyalRef.current[s.id] ?? 0) > 0.24);
            if (kandidater.length === 0) return;
            const valgt = kandidater[Math.floor(Math.random() * kandidater.length)];
            applyLoyal((prev) => ({
                ...prev,
                [valgt.id]: Math.max(0, (prev[valgt.id] ?? 0) - UNREST_HIT),
            }));
            say(`Uro på ${valgt.name}. Høvdingen nekter å betale skatt.`);
        },
    });

    useEffect(() => {
        if (phase === 'won') {
            microSfx.play('complete');
            onComplete({ score: coastLoyal / COAST.length, completed: true });
        }
    }, [phase, coastLoyal, onComplete]);

    const arrive = useCallback((shipId: number) => {
        const ship = shipsRef.current.find((s) => s.id === shipId);
        const target = ship?.target;
        if (!target) return;
        setShips((prev) =>
            prev.map((s) =>
                s.id === shipId
                    ? { ...s, x: target.x, z: target.z, at: target.seatId, target: null }
                    : s
            )
        );
        applyLoyal((prev) => ({ ...prev, [target.seatId]: 1 }));
        microSfx.play('correct');
    }, [applyLoyal]);

    const handleSeat = useCallback(
        (seat: Seat) => {
            if (phase !== 'playing') return;
            if (seat.kind === 'innland') {
                say('Skipene rekker ikke opp i dalene. Innlandet må styres av andre.');
                return;
            }
            const ledige = shipsRef.current.filter((s) => !s.target && s.at !== seat.id);
            if (ledige.length === 0) {
                say('Alle skipene er ute eller ligger her alt. Du må velge.');
                return;
            }
            const naermest = ledige.reduce((best, s) =>
                Math.abs(s.z - seat.z) < Math.abs(best.z - seat.z) ? s : best
            );
            setShips((prev) =>
                prev.map((s) =>
                    s.id === naermest.id
                        ? {
                              ...s,
                              at: null,
                              target: { seatId: seat.id, x: SHIP_STOP_X, z: seat.z },
                          }
                        : s
                )
            );
            say(`Skipet seiler til ${seat.name}.`);
        },
        [phase, say]
    );

    const reset = useCallback(() => {
        setAttempt((a) => a + 1);
        applyLoyal(startLoyalty);
        setShips(START_SHIPS);
        setPhase('playing');
        clock.restart();
        setBanner('Nytt år. Klikk en gård på kysten for å sende skipet dit.');
    }, [clock, applyLoyal]);

    return (
        <MicroGameScaffold
            title="Hold Nordvegen"
            subtitle="Tre skip, seks gårder på kysten og to bygder i innlandet. Hvor langt rekker makten din?"
            estimatedSeconds={130}
            onRetry={reset}
            scene={
                <NordvegenScene
                    key={attempt}
                    loyal={loyal}
                    ships={ships}
                    onSeat={handleSeat}
                    onArrive={arrive}
                />
            }
            canvas={{
                camera: { position: [17, 16, 23], fov: 44 },
                target: [-7.5, 0.8, 0],
                background: '#c3ddec',
                fog: { near: 48, far: 104 },
                light: 'day',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Trofast kyst', value: `${coastLoyal}/${COAST.length}` },
                            { label: 'Innlandet', value: `${inlandLoyal}/${INLAND.length}` },
                        ]}
                    />
                    <TimerPill seconds={clock.remaining} label="Året" warnBelow={15} corner="br" />
                </>
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={unrest}
                    label="Uro i riket"
                    hint="Send skipet dit stolpen synker. Ligger skipet utenfor gården, holder troskapen seg."
                    labels={{ normal: 'Rolig', warn: 'Gnisninger', danger: 'OPPRØR!' }}
                />
                {phase === 'won' && (
                    <WinScreen title="Du holdt kysten - men bare kysten" onReplay={reset}>
                        Seks gårder langs leia klarte du å holde med tre skip. Innlandsbygdene gled
                        unna hele tiden, for dit kom du ikke. Nettopp derfor mener historikerne at
                        Harald var en kystkonge, ikke konge over hele Norge.
                    </WinScreen>
                )}
                {phase === 'lost' && (
                    <LoseScreen title="Riket falt fra hverandre" onRetry={reset}>
                        Tre gårder gikk i opprør samtidig. Makten til Harald var vennskap og gaver
                        som måtte fornyes hele tiden. Prøv å la skipene ligge lenger på gårdene som
                        er nærmest å svikte.
                    </LoseScreen>
                )}
                <SceneFact>
                    Harald hadde ingen hær som kunne stå overalt. Fem storgårder på Vestlandet ligger
                    omtrent én dagsseiling fra hverandre, og makten hans var skip, gaver og vennskap
                    med høvdinger langs kysten.
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
}

// Scenen som egen komponent så key={attempt} nullstiller alle Mover-ene.
function NordvegenScene({
    loyal,
    ships,
    onSeat,
    onArrive,
}: {
    loyal: Record<string, number>;
    ships: Ship[];
    onSeat: (seat: Seat) => void;
    onArrive: (shipId: number) => void;
}) {
    const guarded = useMemo(() => {
        const set = new Set<string>();
        for (const s of ships) if (s.at) set.add(s.at);
        return set;
    }, [ships]);

    return (
        <Shoreline
            splitX={SPLIT_X}
            size={[56, 40]}
            waterY={WATER_Y}
            landColor="#6f8a4d"
            seaColor="#3f7fa4"
            landSide="west"
        >
            <Hill position={[-9.8, 0, -8.5]} radius={3.8} height={2.9} color="#5f6d4a" seed={2} />
            <Hill position={[-9.8, 0, 0]} radius={3.8} height={3.2} color="#586647" seed={5} />
            <Hill position={[-9.8, 0, 8.5]} radius={3.8} height={2.8} color="#5f6d4a" seed={8} />
            <Rock position={[-6.6, 0, -14.4]} scale={1.4} />
            <Rock position={[-6.2, 0, 14.6]} scale={1.2} />
            {TREES.map(([tx, tz], i) => (
                <Tree key={i} position={[tx, 0, tz]} seed={i} leaf="#3f6b39" />
            ))}

            {SEATS.map((seat) => (
                <Farm
                    key={seat.id}
                    seat={seat}
                    loyalty={loyal[seat.id] ?? 0}
                    guarded={guarded.has(seat.id)}
                    onSelect={() => onSeat(seat)}
                />
            ))}

            {ships.map((s) =>
                s.target ? (
                    <Mover
                        key={`seiler-${s.id}-${s.target.seatId}`}
                        from={[s.x, WATER_Y, s.z]}
                        to={[s.target.x, WATER_Y, s.target.z]}
                        speed={SHIP_SPEED}
                        bob={0.03}
                        onArrive={() => onArrive(s.id)}
                    >
                        <Boat sail="#efe7d4" color="#6b4a2c" />
                    </Mover>
                ) : (
                    <Boat
                        key={`ligger-${s.id}`}
                        position={[s.x, WATER_Y, s.z]}
                        heading={faceAlong([-1, 0])}
                        sail="#efe7d4"
                        color="#6b4a2c"
                    />
                )
            )}
        </Shoreline>
    );
}
