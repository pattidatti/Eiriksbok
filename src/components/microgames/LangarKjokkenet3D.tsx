import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    GroundPlane,
    Column,
    Person,
    Fire,
    Draggable,
    Mover,
    Burst,
    Impact,
    Particles,
    GlowMaterial,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    WinScreen,
    LoseScreen,
    MeterBar,
    TimerPill,
    useMeter,
    useGameClock,
    damp,
} from './kit';
import type { MicroGameProps } from './types';

// Langar: det gratis fellesmåltidet i gurdwaraen. Alle setter seg på gulvet i
// lange rekker og spiser det samme. Maten lages og deles ut av frivillige, og
// det arbeidet kalles seva.
//
// Lyspære-øyeblikket: eleven kjenner at bønnen fortsetter på kjøkkenet. Du må
// selv bære maten ut i rekkene mens folk strømmer inn, og hente påfyll fra
// gryta når fatet er tomt. Ingen får gå sultne fra gulvet - det er poenget.

const SPILL_SEKUNDER = 70;
const PORSJONER_PA_FATET = 6;
const SERVERINGS_AVSTAND = 1.9;
const PAAFYLL_AVSTAND = 2.8;
// Hvor fort linja fylles per ventende gjest, og hvor fort den roer seg igjen.
const TRYKK_PER_VENTENDE = 0.016;
const RO_PER_SEKUND = 0.14;
// Hvor mye linja letner av én servering.
const SERVERINGS_LETTELSE = -0.09;
// Hvor ofte det kommer en ny gjest inn i salen.
const SEKUNDER_MELLOM_GJESTER = 2.6;
const GRYTE_XZ: [number, number] = [0, -5.8];

// Plassene på gulvet: to lange rekker som vender mot hverandre.
const PLASSER: { x: number; z: number; snu: number }[] = [];
for (let i = 0; i < 6; i++) {
    const x = -4.5 + i * 1.8;
    PLASSER.push({ x, z: -1.5, snu: Math.PI });
    PLASSER.push({ x, z: 1.5, snu: 0 });
}

const KROPPSFARGER = ['#6c8fb3', '#b8776a', '#7f9d76', '#a58bb0', '#c9a15c', '#6f8f95'];
const HATTEFARGER = ['#e0803c', '#3f6f8f', '#c9463f', '#d8b25c', '#57806a', '#8f7fb0'];

type GjestStatus = 'inn' | 'venter' | 'mett';

interface Gjest {
    id: number;
    plass: number;
    status: GjestStatus;
    startX: number;
    farge: number;
}

// ── Gryta på kjøkkenet. Damper og lyser når det er mat i den. ───────────────
function Gryte({ blink }: { blink: boolean }) {
    const glod = useRef<THREE.Mesh>(null);
    useFrame((state, dt) => {
        if (!glod.current) return;
        const puls = blink ? 1 + Math.sin(state.clock.elapsedTime * 6) * 0.22 : 0.9;
        const s = damp(glod.current.scale.x, puls, dt, 7);
        glod.current.scale.setScalar(s);
    });
    return (
        <group position={[GRYTE_XZ[0], 0, GRYTE_XZ[1]]}>
            {/* Lav plattform */}
            <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
                <boxGeometry args={[4.2, 0.24, 2.2]} />
                <meshStandardMaterial color="#b08b58" roughness={0.9} />
            </mesh>
            {/* Ildstedet under gryta */}
            <Fire position={[0, 0.24, 0]} scale={0.7} />
            {/* Selve gryta */}
            <mesh position={[0, 0.86, 0]} castShadow>
                <cylinderGeometry args={[0.95, 0.72, 0.9, 18]} />
                <meshStandardMaterial color="#5d5a55" roughness={0.55} metalness={0.35} />
            </mesh>
            <mesh position={[0, 1.32, 0]} castShadow>
                <torusGeometry args={[0.95, 0.07, 8, 20]} />
                <meshStandardMaterial color="#7a746c" roughness={0.5} metalness={0.4} />
            </mesh>
            {/* Maten i gryta - lyser når du kan hente påfyll */}
            <mesh ref={glod} position={[0, 1.27, 0]}>
                <cylinderGeometry args={[0.74, 0.74, 0.07, 18]} />
                <GlowMaterial color={blink ? '#f5b352' : '#d99f56'} />
            </mesh>
            {/* To frivillige som lager mat. Står PÅ plattformen (topp y=0.24). */}
            <Person
                position={[-1.55, 0.24, 0.35]}
                rotation={[0, Math.PI * 0.62, 0]}
                pose="raise"
                body="#e8dcc0"
                legs="#b9ac8e"
                hat="hood"
                hatColor="#e0803c"
            />
            <Person
                position={[1.55, 0.24, 0.35]}
                rotation={[0, -Math.PI * 0.62, 0]}
                pose="raise"
                body="#9db08f"
                legs="#6f7d64"
                hat="hood"
                hatColor="#3f6f8f"
            />
        </group>
    );
}

// ── Fatet eleven bærer rundt. Viser hvor mange porsjoner som er igjen. ──────
function Fat({ porsjoner }: { porsjoner: number }) {
    return (
        <group>
            {/* Brettet */}
            <mesh position={[0, 0.62, 0]} castShadow>
                <cylinderGeometry args={[0.72, 0.66, 0.12, 20]} />
                <meshStandardMaterial color="#d8c39a" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.31, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.2, 0.5, 10]} />
                <meshStandardMaterial color="#a5875a" roughness={0.85} />
            </mesh>
            {/* Porsjonene oppå */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        position={[Math.cos(a) * 0.34, 0.73, Math.sin(a) * 0.34]}
                        visible={i < porsjoner}
                        castShadow
                    >
                        <sphereGeometry args={[0.17, 10, 8]} />
                        <meshStandardMaterial color="#f0c46a" roughness={0.75} />
                    </mesh>
                );
            })}
        </group>
    );
}

// ── En gjest: går inn, setter seg, venter på mat, blir mett. ───────────────
function GjestFigur({ gjest, onFramme }: { gjest: Gjest; onFramme: (id: number) => void }) {
    const plass = PLASSER[gjest.plass];
    const sitter = gjest.status !== 'inn';
    const skaal = useRef<THREE.Mesh>(null);

    useFrame((state, dt) => {
        if (!skaal.current) return;
        const mal = gjest.status === 'venter' ? 1 : 0.001;
        const puls = gjest.status === 'venter' ? 1 + Math.sin(state.clock.elapsedTime * 4) * 0.14 : 1;
        const s = damp(skaal.current.scale.x, mal * puls, dt, 8);
        skaal.current.scale.setScalar(s);
    });

    return (
        <Mover
            from={[gjest.startX, 0, 6.9]}
            to={[plass.x, 0, plass.z]}
            speed={2.4}
            state={sitter ? 'frozen' : 'moving'}
            phase={gjest.id}
            onArrive={() => onFramme(gjest.id)}
        >
            <group rotation={[0, sitter ? plass.snu : 0, 0]}>
                <Person
                    pose={sitter ? 'sit' : 'walk'}
                    body={KROPPSFARGER[gjest.farge % KROPPSFARGER.length]}
                    legs="#4a4238"
                    hat={gjest.id % 2 === 0 ? 'hood' : 'cap'}
                    hatColor={HATTEFARGER[gjest.farge % HATTEFARGER.length]}
                />
                {/* Tom skål over hodet: dette er den som venter på mat */}
                <mesh ref={skaal} position={[0, 1.5, 0]} visible={gjest.status === 'venter'}>
                    <sphereGeometry args={[0.2, 10, 8]} />
                    <GlowMaterial color="#ffb347" />
                </mesh>
                {/* Mat på gulvet foran den som er mett */}
                <mesh position={[0, 0.08, 0.45]} visible={gjest.status === 'mett'} castShadow>
                    <cylinderGeometry args={[0.24, 0.2, 0.1, 12]} />
                    <meshStandardMaterial color="#f0c46a" roughness={0.8} />
                </mesh>
            </group>
        </Mover>
    );
}

// ── Scenen. All sanntidslogikk bor her og skriver kun refs. ────────────────
function Scene({
    gjester,
    porsjoner,
    spiller,
    onFramme,
    onServer,
    onPaafyll,
    onTaalmod,
    onSpawn,
    feiring,
    slippTeller,
    slippPos,
}: {
    gjester: Gjest[];
    porsjoner: number;
    spiller: boolean;
    onFramme: (id: number) => void;
    onServer: (id: number, x: number, z: number) => void;
    onPaafyll: () => void;
    onTaalmod: (dt: number, venter: number) => void;
    onSpawn: () => void;
    feiring: number;
    slippTeller: number;
    slippPos: [number, number, number];
}) {
    const fat = useRef<[number, number]>([0, 3.6]);
    const servertRef = useRef<Set<number>>(new Set());
    const spawnAkk = useRef(0);
    // Speil props til refs slik at useFrame-løkka kan lese dem uten å binde seg
    // til render. Skriving skjer i effekt, aldri under render.
    const porsjonerRef = useRef(porsjoner);
    const gjesterRef = useRef(gjester);
    const spillerRef = useRef(spiller);
    useEffect(() => {
        porsjonerRef.current = porsjoner;
    }, [porsjoner]);
    useEffect(() => {
        gjesterRef.current = gjester;
    }, [gjester]);
    useEffect(() => {
        spillerRef.current = spiller;
    }, [spiller]);

    useFrame((_, dt) => {
        if (!spillerRef.current) return;
        const [fx, fz] = fat.current;
        const liste = gjesterRef.current;

        // Tålmodigheten synker så lenge noen sitter og venter.
        const venter = liste.filter((g) => g.status === 'venter').length;
        onTaalmod(dt, venter);

        // Nye gjester kommer inn. Teller på samme dt som resten av spillet, slik
        // at tilstrømningen ikke løper fra eleven på en treg maskin.
        spawnAkk.current += dt;
        if (spawnAkk.current >= SEKUNDER_MELLOM_GJESTER) {
            spawnAkk.current = 0;
            onSpawn();
        }

        // Påfyll: bær fatet bort til gryta.
        if (porsjonerRef.current <= 0) {
            const d = Math.hypot(fx - GRYTE_XZ[0], fz - GRYTE_XZ[1]);
            if (d < PAAFYLL_AVSTAND) onPaafyll();
            return;
        }

        // Servering: nærmeste ventende gjest innenfor rekkevidde får mat.
        // servertRef hindrer at samme gjest serveres på nytt i bildene før
        // React-tilstanden har rukket å oppdatere seg - uten den tømmes fatet
        // på ett eneste menneske.
        for (const g of liste) {
            if (g.status !== 'venter' || servertRef.current.has(g.id)) continue;
            const p = PLASSER[g.plass];
            if (Math.hypot(fx - p.x, fz - p.z) < SERVERINGS_AVSTAND) {
                servertRef.current.add(g.id);
                porsjonerRef.current = Math.max(0, porsjonerRef.current - 1);
                onServer(g.id, p.x, p.z);
                break;
            }
        }
    });

    return (
        <group>
            <GroundPlane size={40} depth={40} color="#e7d8b6" />

            {/* Salens gulvflate - gjør at scenen leses som et rom, ikke en slette */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
                <planeGeometry args={[17, 17]} />
                <meshStandardMaterial color="#f0e6d0" roughness={1} />
            </mesh>

            {/* Teppene folk sitter på */}
            {[-1.5, 1.5].map((z) => (
                <mesh
                    key={z}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0.006, z]}
                    receiveShadow
                >
                    <planeGeometry args={[14.5, 1.6]} />
                    <meshStandardMaterial color="#a85f42" roughness={1} />
                </mesh>
            ))}
            {/* Midtgangen der maten bæres */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow>
                <planeGeometry args={[15.5, 1.5]} />
                <meshStandardMaterial color="#dcc79b" roughness={1} />
            </mesh>

            <Gryte blink={porsjoner <= 0} />

            {gjester.map((g) => (
                <GjestFigur key={g.id} gjest={g} onFramme={onFramme} />
            ))}

            {/* Fatet eleven bærer. Romslig usynlig gripeflate for trackpad. */}
            <Draggable
                position={[0, 0, 3.6]}
                bounds={{ minX: -7.6, maxX: 7.6, minZ: -7.4, maxZ: 6.4 }}
                onDrag={(p) => {
                    fat.current = [p.x, p.z];
                }}
                onDrop={(p) => {
                    fat.current = [p.x, p.z];
                }}
                liftY={0.1}
            >
                <mesh position={[0, 0.7, 0]}>
                    <boxGeometry args={[2.1, 1.8, 2.1]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                <Fat porsjoner={porsjoner} />
            </Draggable>

            {/* Hallen rundt */}
            {(
                [
                    [-7.2, -7.2],
                    [7.2, -7.2],
                    [-7.2, 7.2],
                    [7.2, 7.2],
                ] as [number, number][]
            ).map(([x, z]) => (
                <Column key={`${x}:${z}`} position={[x, 0, z]} height={3.4} color="#f2e8d4" />
            ))}

            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="motes" />
            </group>
            <Impact preset="dustPuff" trigger={slippTeller} position={slippPos} />
            <Burst position={[0, 1.4, 0]} trigger={feiring} />
        </group>
    );
}

// ── Spillet ────────────────────────────────────────────────────────────────
export default function LangarKjokkenet3D({ onComplete, onRetry }: MicroGameProps) {
    const [gjester, setGjester] = useState<Gjest[]>([]);
    const [porsjoner, setPorsjoner] = useState(PORSJONER_PA_FATET);
    const [mette, setMette] = useState(0);
    const [fase, setFase] = useState<'klar' | 'spiller' | 'tapt' | 'vunnet'>('klar');
    const [forsok, setForsok] = useState(0);
    const [feiring, setFeiring] = useState(0);
    const [slippTeller, setSlippTeller] = useState(0);
    const [slippPos, setSlippPos] = useState<[number, number, number]>([0, 0, 0]);

    const nesteId = useRef(0);
    // Fasen speiles til en ref så timer- og måler-callbackene kan sjekke den
    // uten å fyre to ganger. Skrives i effekt, ikke under render.
    const faseRef = useRef<'klar' | 'spiller' | 'tapt' | 'vunnet'>('klar');
    useEffect(() => {
        faseRef.current = fase;
    }, [fase]);

    // Både trykket og avlastningen regnes ut fra samme dt i useFrame (se
    // onTaalmod). Måleren har derfor ingen egen drenering: en tidsstyrt drenering
    // ville gått saktere enn rAF-påfyllet på en treg Chromebook, og spillet ville
    // blitt urettferdig hardt akkurat på maskinene vi bygger for.
    const taalmod = useMeter({
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.4,
        onOverload: () => {
            if (faseRef.current !== 'spiller') return;
            setFase('tapt');
        },
    });

    const klokke = useGameClock({
        seconds: SPILL_SEKUNDER,
        running: fase === 'spiller',
        onExpire: () => {
            if (faseRef.current !== 'spiller') return;
            setFase('vunnet');
            setFeiring((f) => f + 1);
        },
    });

    const start = useCallback(() => {
        setFase('spiller');
    }, []);

    const reset = useCallback(() => {
        nesteId.current = 0;
        setGjester([]);
        setPorsjoner(PORSJONER_PA_FATET);
        setMette(0);
        setFase('klar');
        setForsok((f) => f + 1);
        taalmod.reset();
        klokke.restart();
        onRetry?.();
    }, [onRetry, taalmod, klokke]);

    // Folk strømmer inn. Kalles fra scenens useFrame (se SEKUNDER_MELLOM_GJESTER).
    const onSpawn = useCallback(() => {
        setGjester((liste) => {
            const opptatt = new Set(liste.filter((g) => g.status !== 'mett').map((g) => g.plass));
            const ledige = PLASSER.map((_, i) => i).filter((i) => !opptatt.has(i));
            if (ledige.length === 0) return liste;
            const plass = ledige[nesteId.current % ledige.length];
            const id = nesteId.current++;
            const beholdt = liste.filter((g) => g.status !== 'mett' || g.plass !== plass);
            return [
                ...beholdt,
                { id, plass, status: 'inn', startX: -3 + ((id * 2.3) % 6), farge: id },
            ];
        });
    }, []);

    const onFramme = useCallback((id: number) => {
        setGjester((liste) =>
            liste.map((g) => (g.id === id && g.status === 'inn' ? { ...g, status: 'venter' } : g))
        );
    }, []);

    const onServer = useCallback(
        (id: number, x: number, z: number) => {
            setGjester((liste) =>
                liste.map((q) => (q.id === id && q.status === 'venter' ? { ...q, status: 'mett' } : q))
            );
            setPorsjoner((p) => Math.max(0, p - 1));
            setMette((m) => m + 1);
            setSlippPos([x, 0.05, z]);
            setSlippTeller((n) => n + 1);
            taalmod.add(SERVERINGS_LETTELSE);
        },
        [taalmod]
    );

    // Kalles hver frame mens fatet står ved gryta. React hopper over oppdateringen
    // når verdien er uendret, så det er trygt.
    const onPaafyll = useCallback(() => {
        setPorsjoner((p) => (p > 0 ? p : PORSJONER_PA_FATET));
    }, []);

    // Netto trykk per sekund: hver ventende gjest fyller linja, og gurdwaraen
    // henter seg inn igjen med en fast rate. Alt skalert med dt, slik at
    // balansen er den samme uansett hvor mange bilder i sekundet maskinen klarer.
    const onTaalmod = useCallback(
        (dt: number, venter: number) => {
            taalmod.add(dt * (TRYKK_PER_VENTENDE * venter - RO_PER_SEKUND));
        },
        [taalmod]
    );

    useEffect(() => {
        if (fase !== 'vunnet') return;
        onComplete({
            score: Math.min(1, 0.5 + mette / 40),
            completed: true,
            artifact: { mette },
        });
    }, [fase, mette, onComplete]);

    const venter = useMemo(() => gjester.filter((g) => g.status === 'venter').length, [gjester]);

    // Utledet banner - ingen egen tilstand, og dermed ingen risiko for at en
    // oppdatering midt i en annen setState blir forkastet.
    const banner =
        fase !== 'spiller'
            ? null
            : porsjoner === 0
              ? 'Fatet er tomt. Bær det bort til gryta og hent påfyll.'
              : mette === 0
                ? 'Dra fatet bort til dem som holder en skål over hodet.'
                : null;

    return (
        <MicroGameScaffold
            title="Langar: ingen skal gå sultne"
            subtitle="Dra fatet gjennom rekkene og gi mat til alle som venter. Er fatet tomt, henter du påfyll i gryta."
            estimatedSeconds={150}
            onRetry={reset}
            containerClassName="bg-gradient-to-b from-[#f7e9cc] via-[#f0dcbb] to-[#e2cba2]"
            canvas={{
                idle: fase === 'klar',
                camera: { position: [0, 13, 16], fov: 40 },
                background: '#f7e9cc',
                light: 'golden',
                target: [0, 0.4, 0],
            }}
            scene={
                <Scene
                    key={forsok}
                    gjester={gjester}
                    porsjoner={porsjoner}
                    spiller={fase === 'spiller'}
                    onFramme={onFramme}
                    onServer={onServer}
                    onPaafyll={onPaafyll}
                    onTaalmod={onTaalmod}
                    onSpawn={onSpawn}
                    feiring={feiring}
                    slippTeller={slippTeller}
                    slippPos={slippPos}
                />
            }
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Mette', value: mette },
                            { label: 'Venter', value: venter },
                            { label: 'På fatet', value: porsjoner },
                        ]}
                    />
                    <SceneBadge corner="br">Langar</SceneBadge>
                    {fase === 'spiller' && <TimerPill seconds={klokke.remaining} label="Økta" />}
                    <DragHint show={fase === 'klar'} corner="bc">
                        Dra fatet med maten
                    </DragHint>
                </>
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={taalmod.value}
                    label="Hvor lenge folk har ventet"
                    hint="Jo flere som sitter med tom skål, jo fortere fylles linja. Serv de nærmeste først."
                    labels={{ normal: 'Rolig', warn: 'Mange venter', danger: 'Køen låser seg!' }}
                />

                {fase === 'klar' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={start}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 py-2 text-sm font-bold transition-colors"
                        >
                            Åpne langar
                        </button>
                        <p className="text-sm text-slate-600">
                            Folk kommer inn og setter seg på gulvet i rekker. Hold ut i{' '}
                            {SPILL_SEKUNDER} sekunder uten at køen låser seg.
                        </p>
                    </div>
                )}

                {fase === 'tapt' && (
                    <LoseScreen title="Køen låste seg" onRetry={reset}>
                        For mange satt for lenge med tom skål. I en ekte langar er det nettopp dette
                        de frivillige passer på: alle som setter seg på gulvet, skal få mat. Prøv
                        igjen, og hent påfyll i gryta før fatet går helt tomt.
                    </LoseScreen>
                )}

                {fase === 'vunnet' && (
                    <WinScreen title="Økta er over" onReplay={reset}>
                        Du ga mat til {mette} personer. Alle satt på det samme gulvet og fikk det
                        samme måltidet, uansett hvem de var. Arbeidet du gjorde nå, kalles seva:
                        frivillig arbeid uten lønn. I sikhismen er det ikke noe utenfor bønnen. Det
                        er bønn med hendene.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
}
