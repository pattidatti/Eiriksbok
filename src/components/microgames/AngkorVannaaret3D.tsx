import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    Hotspot,
    GroundPlane,
    WaterPlane,
    Tree,
    Person,
    Particles,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    SceneFact,
    WinScreen,
    LoseScreen,
    MeterBar,
    ChoiceRow,
    useRandomPulse,
    useShake,
    microSfx,
    damp,
} from './kit';
import type { MicroGameProps } from './types';
import type { ChoiceItem } from './kit';

// Angkors vannår.
//
// Lyspære-øyeblikket: "Etter dette skal eleven forstå at Angkor ikke falt av
// tørke alene. Flommene brakk kanalene først, og da tørken kom, nådde ikke
// lageret fram til markene lenger."
//
// Eleven styrer tre sluseporter direkte i 3D gjennom tre faser: en vanlig
// regntid, en storflom, og tørkeåret 1403. I flommen MÅ minst to porter stå
// åpne, ellers sprenger flomtoppen en kanal - og en sprengt kanal slipper bare
// halvparten så mye vann videre resten av spillet. Tørken kommer etterpå, og
// da merker eleven hvert brudd på kroppen.

/* ------------------------------------------------------------------ */
/* Regler og balanse                                                   */
/* ------------------------------------------------------------------ */

const VARIGHET = 86; // sekunder totalt
const REGNTID_SLUTT = 22; // sekunder ut i spillet
const FLOM_SLUTT = 46;

const REGN_VANLIG = 0.07; // baray-andel per sekund
const REGN_FLOM = 0.15;

const PORT_UTTAK = 0.018; // baray-andel per sekund per åpen port
const PORT_INN_HEL = 0.14; // markandel per sekund, hel kanal
const PORT_INN_BRUDD = 0.09; // markandel per sekund, sprengt kanal
const FORDAMPING = 0.045; // markandel per sekund

const MARK_Z = [-6, 0, 6];
const MARK_NAVN = ['Nordmarka', 'Midtmarka', 'Sørmarka'];

type Fase = 'regn' | 'flom' | 'torke';
type Status = 'spiller' | 'vunnet' | 'tapt';

interface Sim {
    baray: number;
    marker: number[];
    porter: boolean[];
    brudd: boolean[];
    gatt: number;
    fase: Fase;
}

const START_SIM: Sim = {
    baray: 0.45,
    marker: [0.8, 0.8, 0.8],
    porter: [false, false, false],
    brudd: [false, false, false],
    gatt: 0,
    fase: 'regn',
};

function fasenAv(gatt: number): Fase {
    if (gatt < REGNTID_SLUTT) return 'regn';
    if (gatt < FLOM_SLUTT) return 'flom';
    return 'torke';
}

const FASETEKST: Record<Fase, string> = {
    regn: 'Regntid',
    flom: 'Storflommen',
    torke: 'Tørkeåret 1403',
};

/* ------------------------------------------------------------------ */
/* Scene-deler                                                         */
/* ------------------------------------------------------------------ */

// Barayen: et vannmagasin bygget OPP med jordvoller, slik khmerne gjorde det.
// Vannflata damper mellom tørr bunn og full voll etter lagernivået.
function Baray({ niva }: { niva: number }) {
    const vann = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = vann.current;
        if (!g) return;
        // Synker OG krymper: en nesten tom baray er en pytt midt i en tørr bunn.
        g.position.y = damp(g.position.y, 0.1 + niva * 0.92, dt, 2.4);
        const bredde = damp(g.scale.x, 0.22 + niva * 0.78, dt, 2.4);
        g.scale.set(bredde, 1, bredde);
    });

    // Ytre mål: x fra -14.5 til -2.5, z fra -6.5 til 6.5. Vollene står PÅ
    // bakken (bunn y = 0) og er 1.15 høye.
    const voll = '#9a8158';
    return (
        <group>
            {/* Tørr bunn, så den tomme barayen ser tom ut og ikke som et hull */}
            <mesh position={[-8.5, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[11.4, 12.4]} />
                <meshStandardMaterial color="#b9a273" roughness={1} />
            </mesh>

            {/* Vollene rundt */}
            <mesh position={[-8.5, 0.575, -6.2]} castShadow receiveShadow>
                <boxGeometry args={[12, 1.15, 0.6]} />
                <meshStandardMaterial color={voll} roughness={1} />
            </mesh>
            <mesh position={[-8.5, 0.575, 6.2]} castShadow receiveShadow>
                <boxGeometry args={[12, 1.15, 0.6]} />
                <meshStandardMaterial color={voll} roughness={1} />
            </mesh>
            <mesh position={[-14.2, 0.575, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 1.15, 13]} />
                <meshStandardMaterial color={voll} roughness={1} />
            </mesh>
            {/* Østvollen er delt i fire, med åpninger der slusene står */}
            {[
                [-4.55, 3.1],
                [0, 2.9],
                [4.55, 3.1],
            ].map(([z, d]) => (
                <mesh key={`ost-${z}`} position={[-2.8, 0.575, z]} castShadow receiveShadow>
                    <boxGeometry args={[0.6, 1.15, d]} />
                    <meshStandardMaterial color={voll} roughness={1} />
                </mesh>
            ))}

            {/* Vannflata. Gruppa står i barayens senter, slik at skaleringen
                krymper vannet innover mot midten og ikke mot scenens origo. */}
            <group ref={vann} position={[-8.5, 0.4, 0]}>
                <WaterPlane position={[0, 0, 0]} size={[11.2, 12.2]} color="#2f7fa8" />
            </group>
        </group>
    );
}

// En sluseport: to steinstolper og en tresluse som heves når porten åpnes.
function Sluse({
    z,
    apen,
    brudd,
    onKlikk,
}: {
    z: number;
    apen: boolean;
    brudd: boolean;
    onKlikk: () => void;
}) {
    const plate = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        const m = plate.current;
        if (!m) return;
        // Lukket: plata står nede og sperrer. Åpen: den er heist opp.
        m.position.y = damp(m.position.y, apen ? 1.35 : 0.45, dt, 3.4);
    });

    // Lyse stolper mot den mørke jordvollen, så slusa leses som noe eget.
    const stolpe = brudd ? '#b8705f' : '#d8d2c4';
    const platefarge = brudd ? '#a1554a' : apen ? '#3f9a5c' : '#8a5f38';
    const tilstand = brudd ? 'wrong' : apen ? 'correct' : 'idle';

    return (
        <group>
            <Interactive
                position={[-2.6, 0, z]}
                onSelect={onKlikk}
                state={tilstand}
                hitArea={[3, 4, 3]}
                hoverScale={1.06}
            >
                {/* Stolper */}
                <mesh position={[0, 1, -0.95]} castShadow>
                    <boxGeometry args={[0.85, 2, 0.55]} />
                    <meshStandardMaterial color={stolpe} roughness={0.95} />
                </mesh>
                <mesh position={[0, 1, 0.95]} castShadow>
                    <boxGeometry args={[0.85, 2, 0.55]} />
                    <meshStandardMaterial color={stolpe} roughness={0.95} />
                </mesh>
                {/* Overligger */}
                <mesh position={[0, 2.15, 0]} castShadow>
                    <boxGeometry args={[0.95, 0.35, 2.45]} />
                    <meshStandardMaterial color={stolpe} roughness={0.95} />
                </mesh>
                {/* Selve sluseplata */}
                <mesh ref={plate} position={[0, 0.45, 0]} castShadow>
                    <boxGeometry args={[0.34, 1, 1.5]} />
                    <meshStandardMaterial color={platefarge} roughness={0.85} />
                </mesh>
            </Interactive>
            {/* Stor, kameravendt klikkmarkør: eleven ser med én gang hva som er
                oppgaven, og treffer trygt på Chromebook-styreflate. */}
            <Hotspot
                position={[-2.6, 3.1, z]}
                onSelect={onKlikk}
                state={tilstand}
                radius={0.5}
                label={brudd ? 'Sprengt kanal' : apen ? 'Åpen' : 'Lukket'}
            />
        </group>
    );
}

// Kanalen fra slusa ut til marka. Vannet kryper utover når porten åpnes.
function Kanal({ z, apen, brudd }: { z: number; apen: boolean; brudd: boolean }) {
    const strom = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        const m = strom.current;
        if (!m) return;
        const mal = apen ? (brudd ? 0.5 : 1) : 0.001;
        m.scale.x = damp(m.scale.x, mal, dt, 2.2);
        // Stripa vokser fra sluseenden og utover mot marka.
        m.position.x = -2.3 + (m.scale.x * 6.6) / 2;
    });
    return (
        <group>
            {/* Tørt kanalløp */}
            <mesh position={[1, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[6.8, 1.5]} />
                <meshStandardMaterial color={brudd ? '#a08a6a' : '#bda87f'} roughness={1} />
            </mesh>
            {/* Rennende vann */}
            <mesh ref={strom} position={[-2.3, 0.1, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.001, 1, 1]}>
                <planeGeometry args={[6.6, 1.05]} />
                <meshStandardMaterial color="#3d92ba" roughness={0.35} metalness={0.1} />
            </mesh>
        </group>
    );
}

// Rismark: farge og riskorn følger vanninnholdet.
function Rismark({ z, vann }: { z: number; vann: number }) {
    const jord = useRef<THREE.MeshStandardMaterial>(null);
    const aks = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (jord.current) {
            // Brun ved 0, frodig grønn ved 1.
            const r = damp(jord.current.color.r, 0.55 - vann * 0.28, dt, 2);
            const g = damp(jord.current.color.g, 0.42 + vann * 0.2, dt, 2);
            const b = damp(jord.current.color.b, 0.25 - vann * 0.06, dt, 2);
            jord.current.color.setRGB(r, g, b);
        }
        if (aks.current) {
            aks.current.scale.y = damp(aks.current.scale.y, 0.25 + vann * 0.9, dt, 2.4);
        }
    });

    const korn = useMemo(() => {
        const ut: [number, number][] = [];
        for (let i = 0; i < 18; i++) {
            const x = 5.2 + (i % 6) * 1.15;
            const zz = z - 1.4 + Math.floor(i / 6) * 1.4;
            ut.push([x, zz]);
        }
        return ut;
    }, [z]);

    return (
        <group>
            <mesh position={[8, 0.05, z]} receiveShadow>
                <boxGeometry args={[7, 0.1, 4.6]} />
                <meshStandardMaterial ref={jord} color="#8c6b40" roughness={1} />
            </mesh>
            <group ref={aks} position={[0, 0.1, 0]} scale={[1, 0.5, 1]}>
                {korn.map(([x, zz]) => (
                    <mesh key={`aks-${x}-${zz}`} position={[x, 0.42, zz]} castShadow>
                        <coneGeometry args={[0.2, 0.85, 5]} />
                        <meshStandardMaterial color="#78a83c" roughness={0.95} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// Angkor Wat i bakgrunnen: fem tårn på en terrasse.
function Tempelet() {
    return (
        <group position={[-1, 0, -12.5]}>
            <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                <boxGeometry args={[9, 0.7, 5]} />
                <meshStandardMaterial color="#a1937c" roughness={1} />
            </mesh>
            <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[7, 0.8, 3.6]} />
                <meshStandardMaterial color="#ad9f86" roughness={1} />
            </mesh>
            {[
                [0, 0, 2.6],
                [-2.6, -1.1, 1.8],
                [2.6, -1.1, 1.8],
                [-2.6, 1.1, 1.8],
                [2.6, 1.1, 1.8],
            ].map(([x, z, h]) => (
                <group key={`taarn-${x}-${z}`} position={[x, 1.5, z]}>
                    <mesh position={[0, h / 2, 0]} castShadow>
                        <coneGeometry args={[0.85, h, 6]} />
                        <meshStandardMaterial color="#9b8b72" roughness={1} />
                    </mesh>
                    <mesh position={[0, h + 0.22, 0]} castShadow>
                        <sphereGeometry args={[0.22, 8, 8]} />
                        <meshStandardMaterial color="#8a7a62" roughness={1} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Scene({
    sim,
    bruddTeller,
    onPort,
}: {
    sim: Sim;
    bruddTeller: number;
    onPort: (i: number) => void;
}) {
    const { ref: ristRef, shake } = useShake(0.3, 0.05);
    useEffect(() => {
        if (bruddTeller > 0) shake(0.85);
    }, [bruddTeller, shake]);
    return (
        <group ref={ristRef}>
            <GroundPlane size={62} depth={50} color="#8fa35d" />
            <Tempelet />
            <Baray niva={sim.baray} />

            {MARK_Z.map((z, i) => (
                <group key={`linje-${z}`}>
                    <Kanal z={z} apen={sim.porter[i]} brudd={sim.brudd[i]} />
                    <Sluse
                        z={z}
                        apen={sim.porter[i]}
                        brudd={sim.brudd[i]}
                        onKlikk={() => onPort(i)}
                    />
                    <Rismark z={z} vann={sim.marker[i]} />
                </group>
            ))}

            {/* Litt liv rundt anlegget */}
            <Person position={[-1.6, 0, 8.6]} pose="idle" body="#6b5540" hat="hood" hatColor="#4e3f2f" />
            <Person position={[3.4, 0, 9.4]} pose="walk" body="#5a6a4a" />
            <Tree position={[-13, 0, 9.5]} seed={2} />
            <Tree position={[9.5, 0, 10.5]} seed={5} />
            <Tree position={[12, 0, -9]} seed={8} />

            {sim.fase !== 'torke' && (
                <Particles
                    preset="rain"
                    count={sim.fase === 'flom' ? 260 : 130}
                    area={[30, 26]}
                    center={[-2, 0, 0]}
                    height={14}
                />
            )}
        </group>
    );
}

/* ------------------------------------------------------------------ */
/* Spill                                                               */
/* ------------------------------------------------------------------ */

export default function AngkorVannaaret3D({ onComplete, onRetry }: MicroGameProps) {
    const [sim, setSim] = useState<Sim>(START_SIM);
    const [status, setStatus] = useState<Status>('spiller');
    const [dodMark, setDodMark] = useState<string | null>(null);
    const [forsok, setForsok] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Klikk på en sluseport for å åpne den. Regnet fyller barayen.'
    );
    const [bruddTeller, setBruddTeller] = useState(0);
    // Sannheten om simuleringen bor i en ref. State speiles ti ganger i
    // sekundet, slik at scenen kan dampe mot den uten å drive logikken.
    const simRef = useRef<Sim>(START_SIM);
    const ferdigRef = useRef(false);

    // Én vei inn til simuleringen, brukt både av tikket og av klikkene.
    const endre = useCallback((fn: (s: Sim) => Sim) => {
        simRef.current = fn(simRef.current);
        setSim(simRef.current);
    }, []);

    // onComplete kan ha ny identitet ved hver render. Uten denne refen ville
    // effekten under blitt revet ned og satt opp igjen ti ganger i sekundet, og
    // intervallet rakk aldri å fyre - spillklokka gikk i halv fart.
    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Simuleringen tikker ti ganger i sekundet. Alt annet damper mot den.
    // Tidssteget måles på klokka, ikke antas, så et hakk i nettleseren ikke
    // gjør spillåret lengre enn det skal være.
    useEffect(() => {
        if (status !== 'spiller') return;
        let forrige = performance.now();
        const t = setInterval(() => {
            const na = performance.now();
            const dt = Math.min(0.35, (na - forrige) / 1000);
            forrige = na;
            const s = simRef.current;
            const fase = fasenAv(s.gatt);
            const regn = fase === 'regn' ? REGN_VANLIG : fase === 'flom' ? REGN_FLOM : 0;
            let baray = s.baray + regn * dt;
            const marker = [...s.marker];

            for (let i = 0; i < 3; i++) {
                if (s.porter[i]) {
                    const uttak = PORT_UTTAK * dt;
                    if (baray >= uttak) {
                        baray -= uttak;
                        marker[i] += (s.brudd[i] ? PORT_INN_BRUDD : PORT_INN_HEL) * dt;
                    } else {
                        baray = 0;
                    }
                }
                marker[i] = Math.min(1, Math.max(0, marker[i] - FORDAMPING * dt));
            }
            baray = Math.min(1, Math.max(0, baray));

            const gatt = s.gatt + dt;
            const nyFase = fasenAv(gatt);
            simRef.current = { ...s, baray, marker, gatt, fase: nyFase };
            setSim(simRef.current);

            // Fasevarsler: eleven skal skjønne når spillereglene endrer seg.
            if (nyFase !== fase) {
                microSfx.play('sceneChange');
                if (nyFase === 'flom') {
                    setBanner(
                        'Storflommen er her. Hold minst to porter åpne, ellers brister en kanal.'
                    );
                } else {
                    setBanner(
                        'Tørkeåret 1403. Det kommer ikke mer regn. Nå er barayen alt du har.'
                    );
                }
            }

            const dod = marker.findIndex((m) => m <= 0);
            if (dod >= 0 && !ferdigRef.current) {
                ferdigRef.current = true;
                setDodMark(MARK_NAVN[dod]);
                setStatus('tapt');
                setBanner(`${MARK_NAVN[dod]} er tørr. Risen er tapt.`);
                microSfx.play('incorrect');
                return;
            }
            if (gatt >= VARIGHET && !ferdigRef.current) {
                ferdigRef.current = true;
                setStatus('vunnet');
                setBanner('Året er omme. Alle tre markene står grønne.');
                microSfx.play('complete');
                onCompleteRef.current({
                    score: Math.max(0.4, 1 - simRef.current.brudd.filter(Boolean).length * 0.25),
                    completed: true,
                });
            }
        }, 100);
        return () => clearInterval(t);
    }, [status]);

    // Flomtopper: kommer uansett hva eleven gjør.
    useRandomPulse({
        running: status === 'spiller' && sim.fase === 'flom',
        minDelayMs: 4200,
        maxDelayMs: 6800,
        onPulse: () => {
            const s = simRef.current;
            if (s.porter.filter(Boolean).length >= 2) {
                setBanner('Flomtoppen rant gjennom de åpne kanalene. Anlegget holdt.');
                microSfx.play('correct');
                return;
            }
            const kandidater = s.brudd.map((b, i) => (b ? -1 : i)).filter((i) => i >= 0);
            if (kandidater.length === 0) return;
            const valgt = kandidater[Math.floor(Math.random() * kandidater.length)];
            endre((n) => {
                const brudd = [...n.brudd];
                brudd[valgt] = true;
                return { ...n, brudd };
            });
            setBruddTeller((n) => n + 1);
            setBanner(
                `Flomtoppen sprengte kanalen til ${MARK_NAVN[valgt]}. Den slipper bare halvparten så mye vann videre nå.`
            );
            microSfx.play('incorrect');
        },
    });

    const vippPort = useCallback(
        (i: number) => {
            if (status !== 'spiller') return;
            endre((s) => {
                const porter = [...s.porter];
                porter[i] = !porter[i];
                return { ...s, porter };
            });
        },
        [status, endre]
    );

    const bruddAntall = sim.brudd.filter(Boolean).length;

    const nullstill = useCallback(() => {
        ferdigRef.current = false;
        simRef.current = START_SIM;
        setSim(START_SIM);
        setBruddTeller(0);
        setStatus('spiller');
        setDodMark(null);
        setBanner('Klikk på en sluseport for å åpne den. Regnet fyller barayen.');
        setForsok((n) => n + 1);
        onRetry?.();
    }, [onRetry]);

    const prosent = (v: number) => `${Math.round(v * 100)} %`;
    const igjen = Math.max(0, Math.ceil(VARIGHET - sim.gatt));

    const valg: ChoiceItem[] = MARK_NAVN.map((navn, i) => ({
        id: `port-${i}`,
        title: navn,
        blurb: sim.brudd[i]
            ? sim.porter[i]
                ? 'Åpen, sprengt kanal'
                : 'Lukket, sprengt kanal'
            : sim.porter[i]
              ? 'Porten er åpen'
              : 'Porten er lukket',
        status: sim.porter[i] ? 'done' : 'active',
    }));

    return (
        <MicroGameScaffold
            title="Angkors vannår"
            subtitle="Styr slusene i barayen gjennom regntid, storflom og tørkeåret 1403."
            estimatedSeconds={105}
            onRetry={nullstill}
            scene={
                <Scene key={forsok} sim={sim} bruddTeller={bruddTeller} onPort={vippPort} />
            }
            canvas={{
                camera: { position: [2, 21, 26], fov: 42 },
                target: [-2, 1, -1],
                background: sim.fase === 'torke' ? '#dfd6b4' : '#b9d3e2',
                fog: { color: sim.fase === 'torke' ? '#e2d9b8' : '#c6dae6', near: 44, far: 88 },
                light: sim.fase === 'flom' ? 'overcast' : sim.fase === 'torke' ? 'noon' : 'day',
                idle: false,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Baray', value: prosent(sim.baray) },
                            { label: MARK_NAVN[0], value: prosent(sim.marker[0]) },
                            { label: MARK_NAVN[1], value: prosent(sim.marker[1]) },
                            { label: MARK_NAVN[2], value: prosent(sim.marker[2]) },
                        ]}
                    />
                    <SceneBadge corner="br">
                        {FASETEKST[sim.fase]} · {igjen} s
                    </SceneBadge>
                    <DragHint
                        show={status === 'spiller' && sim.porter.every((p) => !p)}
                        corner="bc"
                    >
                        Klikk på en sluseport
                    </DragHint>
                </>
            }
        >
            {status === 'vunnet' && (
                <WinScreen title="Markene overlevde tørkeåret" onReplay={nullstill}>
                    {bruddAntall === 0
                        ? 'Ingen kanaler brast, og lageret rakk gjennom hele tørken. Slik fungerte Angkor i flere hundre år: regnet fra én årstid ble spart til den neste.'
                        : `${bruddAntall === 1 ? 'Én kanal' : `${bruddAntall} kanaler`} brast i flommen, og du merket det med én gang tørken kom. Det er nettopp dette forskerne finner i bakken ved Angkor: brudd, lappverk og kanaler som sluttet å virke.`}
                </WinScreen>
            )}
            {status === 'tapt' && (
                <LoseScreen title={`${dodMark} tørket ut`} onRetry={nullstill}>
                    Uten vann dør risen på noen få uker, og en by som ikke får ris, tømmes for folk.
                    Prøv igjen. Hold minst to porter åpne i flommen så kanalene overlever, og spar på
                    lageret når tørken kommer.
                </LoseScreen>
            )}
            {status === 'spiller' && (
                <div className="space-y-3">
                    {/* MeterBar fyller seg når det går galt, så den måler hvor
                        TOM barayen er. Selve vannstanden står i tallruta. */}
                    <MeterBar
                        value={1 - sim.baray}
                        label={`Hvor tom barayen er (${prosent(sim.baray)} vann igjen)`}
                        hint="Alt du ikke slipper ut nå, har du igjen når regnet slutter."
                        warnAt={0.6}
                        dangerAt={0.85}
                        labels={{ normal: 'God beholdning', warn: 'Synker', danger: 'Nesten tom!' }}
                    />
                    <ChoiceRow items={valg} onSelect={(id) => vippPort(Number(id.split('-')[1]))} />
                    <SceneFact>
                        Angkor fikk nesten alt regnet sitt i noen få måneder. Derfor bygde khmerne
                        barayer: store magasiner med jordvoller rundt, der regnet ble spart til
                        tørketiden. Den vestre barayen er åtte kilometer lang.
                    </SceneFact>
                </div>
            )}
        </MicroGameScaffold>
    );
}
