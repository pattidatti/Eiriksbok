import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import type { MicroGameProps } from './types';
import {
    MicroGameScaffold,
    Connector,
    Hotspot,
    Building,
    GroundPlane,
    FlatRing,
    Impact,
    Burst,
    SceneBanner,
    SceneBadge,
    SceneFact,
    DataReadout,
    WinScreen,
    LoseScreen,
    GlowMaterial,
    THEMES,
    microSfx,
    damp,
    type ConnectorNode,
} from './kit';

// Alliansefella 1914
// -----------------------------------------------------------------------------
// Lyspære: eleven kobler selv sammen alliansenettet i Europa, og ser deretter at
// nettopp de trådene gjør et lokalt mord i Sarajevo til en storkrig. De fem
// hoppene i kjeden er nøyaktig de øyeblikkene historikerne fortsatt krangler om.
//
// Fase 1 (rolig): knytt de fire alliansene ved å klikke to hovedsteder (Connector).
// Fase 2 (sanntid): telegrammer flyr fra by til by. Du har flygetiden på deg til å
// klikke «Forhandle» over mottakerbyen. Bommer du tre ganger, er hele Europa i krig.

const T = THEMES.industrial;

type CityId = 'london' | 'paris' | 'berlin' | 'wien' | 'stpetersburg' | 'beograd' | 'sarajevo';

interface City {
    id: CityId;
    name: string;
    land: string;
    position: [number, number, number];
}

const CITIES: City[] = [
    { id: 'london', name: 'London', land: 'Storbritannia', position: [-6.2, 0, -2.6] },
    { id: 'paris', name: 'Paris', land: 'Frankrike', position: [-4.2, 0, 0.8] },
    { id: 'berlin', name: 'Berlin', land: 'Tyskland', position: [-0.6, 0, -3.2] },
    { id: 'wien', name: 'Wien', land: 'Østerrike-Ungarn', position: [1.6, 0, 0.2] },
    { id: 'stpetersburg', name: 'St. Petersburg', land: 'Russland', position: [6.4, 0, -4.4] },
    { id: 'beograd', name: 'Beograd', land: 'Serbia', position: [3.2, 0, 2.8] },
    { id: 'sarajevo', name: 'Sarajevo', land: 'Bosnia', position: [1.2, 0, 5.6] },
];

const CITY_BY_ID: Record<string, City> = {};
for (const c of CITIES) CITY_BY_ID[c.id] = c;

// De fire bindingene som gjorde Europa til ett sammenkoblet system i 1914.
const ALLIANCES: [CityId, CityId][] = [
    ['berlin', 'wien'],
    ['beograd', 'stpetersburg'],
    ['stpetersburg', 'paris'],
    ['paris', 'london'],
];

const ALLIANCE_LABEL: Record<string, string> = {
    'berlin|wien': 'Tyskland og Østerrike-Ungarn: forbundet siden 1879',
    'beograd|stpetersburg': 'Russland stiller opp for Serbia',
    'paris|stpetersburg': 'Den fransk-russiske alliansen fra 1894',
    'london|paris': 'Ententen mellom Storbritannia og Frankrike',
};

interface Hop {
    from: CityId;
    to: CityId;
    date: string;
    title: string;
    fact: string;
    // Krigserklæring (rød) eller allianse som trekkes i (gul).
    war: boolean;
    // Første hopp er bare opptakten - der er det ingenting å forhandle om.
    negotiable: boolean;
}

const HOPS: Hop[] = [
    {
        from: 'sarajevo',
        to: 'wien',
        date: '28. juni 1914',
        title: 'Skuddene i Sarajevo',
        fact: 'Gavrilo Princip skjøt tronarvingen Franz Ferdinand og kona Sophie. Ennå var dette en lokal krise på Balkan.',
        war: false,
        negotiable: false,
    },
    {
        from: 'wien',
        to: 'berlin',
        date: '5. juli 1914',
        title: 'Blankofullmakten',
        fact: 'Keiser Wilhelm 2. lovet Østerrike-Ungarn ubetinget tysk støtte. Uten den hadde Wien neppe turt å gå så hardt fram.',
        war: false,
        negotiable: true,
    },
    {
        from: 'wien',
        to: 'beograd',
        date: '23. juli 1914',
        title: 'Ultimatumet',
        fact: 'Ti krav med 48 timers frist, laget for å bli avvist. Serbia godtok nesten alt, men ikke alt.',
        war: true,
        negotiable: true,
    },
    {
        from: 'beograd',
        to: 'stpetersburg',
        date: '30. juli 1914',
        title: 'Russland mobiliserer',
        fact: 'Russland satte hæren på krigsfot for å beskytte Serbia. Nå var alliansetråden strammet i begge ender.',
        war: false,
        negotiable: true,
    },
    {
        from: 'berlin',
        to: 'paris',
        date: '3. august 1914',
        title: 'Krig mot Frankrike',
        fact: 'Tyskland erklærte krig mot Frankrike og sendte hæren gjennom Belgia for å vinne fort i vest.',
        war: true,
        negotiable: true,
    },
    {
        from: 'paris',
        to: 'london',
        date: '4. august 1914',
        title: 'Storbritannia blir med',
        fact: 'Da tyske soldater gikk inn i Belgia, erklærte Storbritannia krig. Den lokale krisen var blitt en verdenskrig.',
        war: true,
        negotiable: true,
    },
];

const FLIGHT_SECONDS = 3.0;
const MAX_MISSES = 3;
const NEGOTIABLE_COUNT = HOPS.filter((h) => h.negotiable).length;

type Phase = 'wire' | 'chain' | 'pause' | 'won' | 'lost';

// --- Scene-deler ---------------------------------------------------------

// Høyden nodekulene (og etikettene) står i, godt over hustakene.
const NODE_Y = 1.94;

function CityCluster({ city, burning }: { city: City; burning: boolean }) {
    const ringColor = burning ? '#dc2626' : '#e3b23c';
    const body = burning ? '#8b2f22' : '#b7a98c';
    return (
        <group position={city.position}>
            <FlatRing position={[0, 0.01, 0]} radius={1.05} tube={0.07} color={ringColor} />
            <Building position={[-0.5, 0, 0.25]} body={body} roof="#4a3a2c" w={0.6} h={0.75} d={0.6} seed={1} />
            <Building position={[0.45, 0, -0.3]} body={body} roof="#4a3a2c" w={0.55} h={0.95} d={0.55} seed={4} />
            <Building position={[0.1, 0, 0.55]} body={body} roof="#4a3a2c" w={0.5} h={0.6} d={0.5} seed={7} />
        </group>
    );
}

// Stolpen som bærer bysymbolet opp over hustakene, så kula alltid er klikkbar.
function Pedestal({ position }: { position: [number, number, number] }) {
    return (
        <mesh position={[position[0], 0.8, position[2]]} castShadow receiveShadow>
            <cylinderGeometry args={[0.09, 0.16, 1.6, 12]} />
            <meshStandardMaterial color="#6b6357" roughness={0.85} />
        </mesh>
    );
}

// Permanent bynavn, alltid vendt mot kameraet. Eleven må kunne se hvilken by
// hen klikker på uten å måtte hovre over den først.
function CityLabel({ city, burning }: { city: City; burning: boolean }) {
    return (
        <Billboard position={[city.position[0], NODE_Y + 0.62, city.position[2]]}>
            <Html center pointerEvents="none">
                <div
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap shadow ${
                        burning ? 'bg-red-600 text-white' : 'bg-white/90 text-slate-800'
                    }`}
                >
                    {city.name}
                </div>
            </Html>
        </Billboard>
    );
}

// Statisk kabel mellom to punkter (samme matematikk som kit-Connector bruker).
function Cable({
    from,
    to,
    color,
    radius = 0.075,
}: {
    from: [number, number, number];
    to: [number, number, number];
    color: string;
    radius?: number;
}) {
    const { position, quaternion, length } = useMemo(() => {
        const a = new THREE.Vector3(...from);
        const b = new THREE.Vector3(...to);
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        const q = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir.clone().normalize()
        );
        return { position: mid, quaternion: q, length: len };
    }, [from, to]);

    return (
        <mesh position={position} quaternion={quaternion} castShadow>
            <cylinderGeometry args={[radius, radius, length, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28} roughness={0.5} />
        </mesh>
    );
}

// Et telegram som flyr i bue fra by til by. Kaller onArrive én gang.
function Telegram({
    from,
    to,
    seconds,
    color,
    onArrive,
}: {
    from: [number, number, number];
    to: [number, number, number];
    seconds: number;
    color: string;
    onArrive: () => void;
}) {
    const ref = useRef<THREE.Group>(null);
    const tRef = useRef(0);
    const doneRef = useRef(false);
    const arriveRef = useRef(onArrive);
    useEffect(() => {
        arriveRef.current = onArrive;
    }, [onArrive]);

    useFrame((_, dt) => {
        if (doneRef.current) return;
        tRef.current = Math.min(1, tRef.current + dt / seconds);
        const t = tRef.current;
        const g = ref.current;
        if (g) {
            g.position.x = from[0] + (to[0] - from[0]) * t;
            g.position.z = from[2] + (to[2] - from[2]) * t;
            g.position.y = NODE_Y + Math.sin(Math.PI * t) * 1.1;
            g.rotation.y += dt * 3.2;
        }
        if (t >= 1) {
            doneRef.current = true;
            arriveRef.current();
        }
    });

    return (
        <group ref={ref} position={[from[0], NODE_Y, from[2]]}>
            <mesh>
                <sphereGeometry args={[0.24, 14, 14]} />
                <GlowMaterial color={color} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.34, 0.46, 20]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

// Rolig svai på kartbordet så verdenen lever før eleven gjør noe.
function Board({ children }: { children: React.ReactNode }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, dt) => {
        const g = ref.current;
        if (!g) return;
        const target = Math.sin(state.clock.elapsedTime * 0.25) * 0.015;
        g.rotation.z = damp(g.rotation.z, target, dt, 2);
    });
    return <group ref={ref}>{children}</group>;
}

interface SceneProps {
    phase: Phase;
    hopIndex: number;
    burning: Record<string, boolean>;
    cables: [CityId, CityId][];
    impactAt: [number, number, number];
    impactTrigger: number;
    burstTrigger: number;
    burstAt: [number, number, number];
    onWire: (a: string, b: string, valid: boolean) => void;
    onWired: () => void;
    onNegotiate: () => void;
    onArrive: () => void;
}

function AllianceScene({
    phase,
    hopIndex,
    burning,
    cables,
    impactAt,
    impactTrigger,
    burstTrigger,
    burstAt,
    onWire,
    onWired,
    onNegotiate,
    onArrive,
}: SceneProps) {
    const nodes: ConnectorNode[] = useMemo(
        () =>
            CITIES.filter((c) => c.id !== 'sarajevo').map((c) => ({
                id: c.id,
                position: [c.position[0], NODE_Y, c.position[2]] as [number, number, number],
                label: c.name,
            })),
        []
    );

    const hop = phase === 'chain' ? HOPS[hopIndex] : null;
    const target = hop ? CITY_BY_ID[hop.to] : null;

    return (
        <Board>
            <GroundPlane size={34} depth={30} color="#8d9b7a" />
            {/* Kartbordets kant */}
            <FlatRing position={[0, 0.005, 0]} radius={8.4} tube={0.16} color="#6b5a3e" segments={64} />

            {CITIES.map((c) => (
                <CityCluster key={c.id} city={c} burning={!!burning[c.id]} />
            ))}
            {CITIES.map((c) => (
                <CityLabel key={`lbl-${c.id}`} city={c} burning={!!burning[c.id]} />
            ))}

            {/* Sarajevo markeres med en glødende gnist - her begynner alt */}
            <mesh position={[CITY_BY_ID.sarajevo.position[0], NODE_Y, CITY_BY_ID.sarajevo.position[2]]}>
                <sphereGeometry args={[0.26, 14, 14]} />
                <GlowMaterial color="#f97316" />
            </mesh>
            <Pedestal position={CITY_BY_ID.sarajevo.position} />

            {CITIES.filter((c) => c.id !== 'sarajevo').map((c) => (
                <Pedestal key={c.id} position={c.position} />
            ))}

            {phase === 'wire' ? (
                <Connector
                    nodes={nodes}
                    correct={ALLIANCES as [string, string][]}
                    nodeRadius={0.34}
                    onConnect={onWire}
                    onComplete={onWired}
                />
            ) : (
                <group>
                    {cables.map(([a, b]) => (
                        <Cable
                            key={`${a}-${b}`}
                            from={[CITY_BY_ID[a].position[0], NODE_Y, CITY_BY_ID[a].position[2]]}
                            to={[CITY_BY_ID[b].position[0], NODE_Y, CITY_BY_ID[b].position[2]]}
                            color="#10b981"
                        />
                    ))}
                    {nodes.map((n) => (
                        <mesh key={n.id} position={n.position} castShadow>
                            <sphereGeometry args={[0.34, 16, 16]} />
                            <meshStandardMaterial
                                color={burning[n.id] ? '#dc2626' : '#f59e0b'}
                                roughness={0.45}
                            />
                        </mesh>
                    ))}
                </group>
            )}

            {hop && (
                <Telegram
                    key={`hop-${hopIndex}`}
                    from={CITY_BY_ID[hop.from].position}
                    to={CITY_BY_ID[hop.to].position}
                    seconds={FLIGHT_SECONDS}
                    color={hop.war ? '#ef4444' : '#fbbf24'}
                    onArrive={onArrive}
                />
            )}

            {hop && hop.negotiable && target && (
                <Hotspot
                    position={[target.position[0], NODE_Y + 1.5, target.position[2]]}
                    radius={0.58}
                    label={`Forhandle i ${target.name}`}
                    onSelect={onNegotiate}
                />
            )}

            <Impact preset="sparks" trigger={impactTrigger} position={impactAt} />
            <Burst position={burstAt} trigger={burstTrigger} />
        </Board>
    );
}

// --- Spillet -------------------------------------------------------------

export default function Alliansefella1914({ onComplete, onRetry }: MicroGameProps) {
    const [attempt, setAttempt] = useState(0);
    const [phase, setPhase] = useState<Phase>('wire');
    const [hopIndex, setHopIndex] = useState(0);
    const [cables, setCables] = useState<[CityId, CityId][]>([]);
    const [burning, setBurning] = useState<Record<string, boolean>>({});
    const [caught, setCaught] = useState(0);
    const [misses, setMisses] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Klikk to hovedsteder etter hverandre for å knytte alliansen mellom dem.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [impactAt, setImpactAt] = useState<[number, number, number]>([0, 0.3, 0]);
    const [impactTrigger, setImpactTrigger] = useState(0);
    const [burstAt, setBurstAt] = useState<[number, number, number]>([0, 1.2, 0]);
    const [burstTrigger, setBurstTrigger] = useState(0);

    const resolvedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
    };

    const reset = useCallback(() => {
        clearTimer();
        resolvedRef.current = false;
        setPhase('wire');
        setHopIndex(0);
        setCables([]);
        setBurning({});
        setCaught(0);
        setMisses(0);
        setFact(null);
        setBanner('Klikk to hovedsteder etter hverandre for å knytte alliansen mellom dem.');
        setAttempt((a) => a + 1);
        onRetry?.();
    }, [onRetry]);

    // Gå videre til neste hopp, eller avslutt spillet.
    const advance = useCallback(
        (nextIndex: number, nextMisses: number, nextCaught: number) => {
            if (nextMisses >= MAX_MISSES) {
                setPhase('lost');
                microSfx.play('incorrect');
                return;
            }
            if (nextIndex >= HOPS.length) {
                setPhase('won');
                microSfx.play('complete');
                setBurstAt([0, 2.2, 0]);
                setBurstTrigger((t) => t + 1);
                onComplete({
                    score: Math.min(1, nextCaught / NEGOTIABLE_COUNT),
                    completed: true,
                    artifact: { fanget: nextCaught, bom: nextMisses },
                });
                return;
            }
            setPhase('pause');
            timerRef.current = setTimeout(() => {
                resolvedRef.current = false;
                setHopIndex(nextIndex);
                setPhase('chain');
                const h = HOPS[nextIndex];
                setBanner(
                    h.negotiable
                        ? `${h.date}: ${h.title}. Klikk «Forhandle» over ${CITY_BY_ID[h.to].name} før telegrammet lander.`
                        : `${h.date}: ${h.title}.`
                );
            }, 1100);
        },
        [onComplete]
    );

    const handleWire = useCallback((a: string, b: string, valid: boolean) => {
        if (valid) {
            const key = [a, b].sort().join('|');
            setCables((prev) => [...prev, [a, b] as [CityId, CityId]]);
            setBanner(ALLIANCE_LABEL[key] ?? 'Alliansen er knyttet.');
        } else {
            setBanner(
                `${CITY_BY_ID[a]?.name} og ${CITY_BY_ID[b]?.name} hadde ingen slik avtale i 1914. Prøv et annet par.`
            );
        }
    }, []);

    const handleWired = useCallback(() => {
        setBanner('Nettet er ferdig. Nå tenner gnisten i Sarajevo.');
        setPhase('pause');
        timerRef.current = setTimeout(() => {
            resolvedRef.current = false;
            setHopIndex(0);
            setPhase('chain');
            setBanner('28. juni 1914: Skuddene i Sarajevo.');
        }, 1300);
    }, []);

    // Eleven rakk å klikke «Forhandle» før telegrammet landet.
    const handleNegotiate = useCallback(() => {
        if (phase !== 'chain') return;
        clearTimer();
        const hop = HOPS[hopIndex];
        if (!hop.negotiable) return;
        resolvedRef.current = true;
        microSfx.play('correct');
        const nextCaught = caught + 1;
        setCaught(nextCaught);
        setFact(`${hop.date} - ${hop.title}: ${hop.fact}`);
        setBanner(`Du fanget beslutningen i ${CITY_BY_ID[hop.to].name}.`);
        const to = CITY_BY_ID[hop.to].position;
        setBurstAt([to[0], 1.6, to[2]]);
        setBurstTrigger((t) => t + 1);
        advance(hopIndex + 1, misses, nextCaught);
    }, [phase, hopIndex, caught, misses, advance]);

    // Telegrammet landet uten at eleven rakk å gripe inn.
    const handleArrive = useCallback(() => {
        if (phase !== 'chain') return;
        if (resolvedRef.current) return;
        const hop = HOPS[hopIndex];
        const to = CITY_BY_ID[hop.to].position;
        setBurning((prev) => ({ ...prev, [hop.to]: true }));
        setImpactAt([to[0], 0.35, to[2]]);
        setImpactTrigger((t) => t + 1);
        setFact(`${hop.date} - ${hop.title}: ${hop.fact}`);

        if (!hop.negotiable) {
            setBanner('Wien krever hevn over Serbia. Nå trekkes alliansene i.');
            advance(hopIndex + 1, misses, caught);
            return;
        }
        microSfx.play('incorrect');
        const nextMisses = misses + 1;
        setMisses(nextMisses);
        setBanner(`${CITY_BY_ID[hop.to].name} er dratt inn i krigen.`);
        advance(hopIndex + 1, nextMisses, caught);
    }, [phase, hopIndex, misses, caught, advance]);

    const activeHop = phase === 'chain' ? HOPS[hopIndex] : null;

    return (
        <MicroGameScaffold
            title="Alliansefella 1914"
            subtitle="Knytt alliansene selv, og se hva de gjør med ett enkelt skudd i Sarajevo."
            estimatedSeconds={120}
            onRetry={reset}
            scene={
                <AllianceScene
                    key={attempt}
                    phase={phase}
                    hopIndex={hopIndex}
                    burning={burning}
                    cables={cables}
                    impactAt={impactAt}
                    impactTrigger={impactTrigger}
                    burstAt={burstAt}
                    burstTrigger={burstTrigger}
                    onWire={handleWire}
                    onWired={handleWired}
                    onNegotiate={handleNegotiate}
                    onArrive={handleArrive}
                />
            }
            canvas={{
                camera: { position: [0, 20, 18], fov: 34 },
                target: [0, 0.6, 0.2],
                background: T.sky,
                fog: { color: T.fog, near: 30, far: 62 },
                light: 'overcast',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Fanget', value: `${caught}/${NEGOTIABLE_COUNT}` },
                            { label: 'Bom', value: `${misses}/${MAX_MISSES}` },
                        ]}
                    />
                    <SceneBadge corner="br">
                        {activeHop ? activeHop.date : 'Sommeren 1914'}
                    </SceneBadge>
                </>
            }
        >
            <div className="space-y-2.5">
                {phase === 'wire' && (
                    <p className="text-sm text-slate-600">
                        Fire bindinger holdt Europa sammen i 1914. Klikk Berlin og deretter Wien for
                        å knytte den første, og finn så de tre andre.
                    </p>
                )}

                {fact && <SceneFact>{fact}</SceneFact>}

                {phase === 'won' && (
                    <WinScreen title={`Krigen kom uansett - men du fanget ${caught} av ${NEGOTIABLE_COUNT} beslutninger`} onReplay={reset}>
                        Innen 4. august var alle stormaktene i krig. Legg merke til at du selv bygde
                        nettet som gjorde det mulig: uten alliansene hadde Sarajevo blitt en lokal
                        krise. Beslutningene du klikket på, er nettopp de øyeblikkene historikerne
                        fortsatt er uenige om hvem som burde ha stanset.
                    </WinScreen>
                )}

                {phase === 'lost' && (
                    <LoseScreen title="Krisen løp fra deg" onRetry={reset}>
                        Tre beslutninger gikk forbi uten at noen grep inn, og hele nettet tok fyr på
                        under en uke. Slik føltes julikrisen for dem som satt midt i den: hver
                        beslutning måtte tas raskere enn den forrige.
                    </LoseScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
}
