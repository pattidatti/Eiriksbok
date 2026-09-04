import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Syringe, Play } from 'lucide-react';
import type { MicroGameProps } from './types';
import { useStepSounds } from '../../hooks/useStepSounds';
import {
    MicroGameScaffold,
    Interactive,
    Mover,
    Person,
    Building,
    Tree,
    Tent,
    GroundPlane,
    FlatRing,
    GlowMaterial,
    Burst,
    useMeter,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    DangerVignette,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneFact,
} from './kit';

// Vaksinekøen: knappe doser, en strøm av mennesker, og et sykehus som fylles opp.
// Lyspære: når det ikke er nok vaksiner til alle, redder du flest liv ved å gi dem
// til dem som blir sykest - ikke til dem som tilfeldigvis går først i køen.

type Risiko = 'eldre' | 'helse' | 'ung';

interface RisikoInfo {
    farge: string;
    kropp: string;
    bein: string;
    hatt: 'none' | 'cap' | 'hood';
    hattfarge: string;
    fart: number;
    // Hvor mye sykehusbelastningen stiger hvis personen går uvaksinert ut.
    kostnad: number;
}

const RISIKO: Record<Risiko, RisikoInfo> = {
    eldre: {
        farge: '#dc2626',
        kropp: '#b45309',
        bein: '#3f3f46',
        hatt: 'hood',
        hattfarge: '#7c2d12',
        fart: 1.05,
        kostnad: 0.32,
    },
    helse: {
        farge: '#2563eb',
        kropp: '#e5e7eb',
        bein: '#1e3a8a',
        hatt: 'cap',
        hattfarge: '#1d4ed8',
        fart: 1.35,
        kostnad: 0.2,
    },
    ung: {
        farge: '#16a34a',
        kropp: '#0ea5e9',
        bein: '#334155',
        hatt: 'none',
        hattfarge: '#334155',
        fart: 1.6,
        kostnad: 0.03,
    },
};

// Bølgene er faste, ikke tilfeldige. Da er spillet like rettferdig for alle, og
// en elev som skjønner mekanikken vinner hver gang.
const BOLGER: { folk: Risiko[]; doser: number; tekst: string }[] = [
    {
        folk: ['ung', 'ung', 'eldre', 'ung', 'eldre', 'helse'],
        doser: 5,
        tekst: 'Uke 1: 5 doser kom til kommunen. Klikk den du vil vaksinere.',
    },
    {
        folk: ['ung', 'helse', 'ung', 'ung', 'eldre', 'ung', 'eldre', 'eldre'],
        doser: 6,
        tekst: 'Uke 2: 6 doser og 8 mennesker. Hvem velger du?',
    },
    {
        folk: ['ung', 'ung', 'helse', 'eldre', 'eldre', 'ung', 'eldre', 'helse', 'eldre'],
        doser: 7,
        tekst: 'Uke 3: 7 doser og 9 mennesker. Nå teller hvert eneste valg.',
    },
];

const LANES = [-3.2, 0, 3.2];
const START_Z = -11.5;
const SLUTT_Z = 3;
const SPAWN_MS = 1500;

interface Kandidat {
    id: number;
    lane: number;
    risiko: Risiko;
    vaksinert: boolean;
    ute: boolean;
}

// ── Scenen ──────────────────────────────────────────────────────────────────

function Merke({ risiko, vaksinert }: { risiko: Risiko; vaksinert: boolean }) {
    const farge = vaksinert ? '#0d9488' : RISIKO[risiko].farge;
    return (
        <mesh position={[0, 1.62, 0]}>
            <sphereGeometry args={[0.17, 12, 12]} />
            <GlowMaterial color={farge} />
        </mesh>
    );
}

function Kulisse() {
    return (
        <group>
            <GroundPlane size={44} depth={38} color="#c2ccbb" />
            {/* Gangveien folk følger */}
            <mesh position={[0, 0.004, -4.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[10.4, 16.5]} />
                <meshStandardMaterial color="#a9b7c1" roughness={1} />
            </mesh>
            {/* Utgangslinja: her går folk ut i samfunnet igjen */}
            <mesh position={[0, 0.02, SLUTT_Z]}>
                <boxGeometry args={[10.4, 0.04, 0.34]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.6} />
            </mesh>
            {/* Vaksinasjonsteltet med skilt. Alt står på bakken. */}
            <group position={[-6.4, 0, -2.2]}>
                <Tent color="#f8fafc" scale={1.25} />
            </group>
            <group position={[-4.9, 0, -0.9]}>
                <mesh position={[0, 0.55, 0]} castShadow>
                    <cylinderGeometry args={[0.06, 0.06, 1.1, 8]} />
                    <meshStandardMaterial color="#94a3b8" roughness={0.8} />
                </mesh>
                <mesh position={[0, 1.28, 0]} castShadow>
                    <boxGeometry args={[0.78, 0.78, 0.09]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.85} />
                </mesh>
                <mesh position={[0, 1.28, 0.07]}>
                    <boxGeometry args={[0.52, 0.15, 0.06]} />
                    <meshStandardMaterial color="#dc2626" />
                </mesh>
                <mesh position={[0, 1.28, 0.07]}>
                    <boxGeometry args={[0.15, 0.52, 0.06]} />
                    <meshStandardMaterial color="#dc2626" />
                </mesh>
            </group>
            <FlatRing position={[-6.4, 0.01, -2.2]} radius={1.9} tube={0.05} color="#8fa0ae" />
            {/* Sykehuset */}
            <Building
                position={[6.9, 0, -2.2]}
                body="#e2e8f0"
                roof="#94a3b8"
                w={2.6}
                h={1.8}
                d={2.4}
            />
            {/* Byen folk kommer fra */}
            <Building
                position={[-5.4, 0, -13]}
                body="#cbd5e1"
                roof="#64748b"
                w={2.2}
                h={1.4}
                d={1.8}
                seed={2}
            />
            <Building
                position={[-1.9, 0, -13.4]}
                body="#d6d3d1"
                roof="#78716c"
                w={2}
                h={1.6}
                d={1.8}
                seed={5}
            />
            <Building
                position={[1.9, 0, -13.4]}
                body="#cbd5e1"
                roof="#64748b"
                w={2.2}
                h={1.5}
                d={1.8}
                seed={8}
            />
            <Building
                position={[5.4, 0, -13]}
                body="#d6d3d1"
                roof="#78716c"
                w={2}
                h={1.4}
                d={1.8}
                seed={11}
            />
            <Tree position={[-7.6, 0, -7.4]} leaf="#5d8352" seed={1} />
            <Tree position={[7.5, 0, -7.8]} leaf="#5d8352" seed={4} />
            <Tree position={[-7.7, 0, 0.6]} leaf="#5d8352" seed={7} />
            <Tree position={[7.6, 0, 0.9]} leaf="#5d8352" seed={9} />
            {/* Helsepersonell som står ved teltet og setter dosene */}
            <Person position={[-5.7, 0, -1.1]} rotation={[0, 2.4, 0]} body="#e5e7eb" legs="#1e3a8a" hat="cap" hatColor="#1d4ed8" />
            <Person position={[-6.9, 0, -0.9]} rotation={[0, 2.9, 0]} body="#e5e7eb" legs="#1e3a8a" hat="cap" hatColor="#1d4ed8" pose="raise" />
        </group>
    );
}

function Scene({
    folk,
    doser,
    frossen,
    onVaksiner,
    onUt,
}: {
    folk: Kandidat[];
    doser: number;
    frossen: boolean;
    onVaksiner: (id: number) => void;
    onUt: (id: number, risiko: Risiko, vaksinert: boolean) => void;
}) {
    return (
        <group>
            <Kulisse />
            {folk.map((k) => {
                const info = RISIKO[k.risiko];
                return (
                    <Mover
                        key={k.id}
                        from={[LANES[k.lane], 0, START_Z]}
                        to={[LANES[k.lane], 0, SLUTT_Z]}
                        speed={info.fart}
                        state={k.ute ? 'gone' : frossen ? 'frozen' : 'moving'}
                        phase={k.id}
                        onArrive={() => onUt(k.id, k.risiko, k.vaksinert)}
                    >
                        <Interactive
                            position={[0, 1.15, 0]}
                            onSelect={() => onVaksiner(k.id)}
                            disabled={k.vaksinert || doser <= 0 || frossen}
                            state={k.vaksinert ? 'correct' : undefined}
                            hitArea={[2, 2.4, 2]}
                            sound="correct"
                        >
                            {/* Gruppa har origo i bakkenivå, så skalering løfter
                                ikke føttene av bakken. */}
                            <group position={[0, -1.15, 0]} scale={1.25}>
                                <Person
                                    body={k.vaksinert ? '#0d9488' : info.kropp}
                                    legs={info.bein}
                                    hat={info.hatt}
                                    hatColor={info.hattfarge}
                                    pose="walk"
                                />
                                <Merke risiko={k.risiko} vaksinert={k.vaksinert} />
                                <Burst
                                    position={[0, 1.1, 0]}
                                    trigger={k.vaksinert ? 1 : 0}
                                    color="#2dd4bf"
                                    count={16}
                                    spread={2}
                                />
                            </group>
                        </Interactive>
                    </Mover>
                );
            })}
        </group>
    );
}

// ── Spillet ─────────────────────────────────────────────────────────────────

type Fase = 'idle' | 'spiller' | 'tapt' | 'vunnet';

const Vaksinekoen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const lyd = useStepSounds();

    const [fase, setFase] = useState<Fase>('idle');
    const [bolge, setBolge] = useState(0); // 1-indeksert for visning
    const [folk, setFolk] = useState<Kandidat[]>([]);
    const [doser, setDoser] = useState(0);
    const [vaksinerte, setVaksinerte] = useState(0);
    const [bom, setBom] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [forsok, setForsok] = useState(0);

    const idRef = useRef(0);
    const doserRef = useRef(0);
    const igjenRef = useRef(0);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const overgangRef = useRef(false);
    const faseRef = useRef<Fase>('idle');
    const bomRef = useRef(0);

    useEffect(() => {
        faseRef.current = fase;
    }, [fase]);

    const nullstillTimere = useCallback(() => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    }, []);

    const sykehus = useMeter({
        drainPerSecond: 0.004,
        overloadAt: 1,
        recoverTo: 0.5,
        onOverload: () => {
            if (faseRef.current !== 'spiller') return;
            // Stopp alt som ligger og venter, ellers kan en seier som allerede
            // er planlagt overskrive tapet et halvsekund senere.
            nullstillTimere();
            setFase('tapt');
        },
    });

    useEffect(() => nullstillTimere, [nullstillTimere]);

    const settTimer = useCallback((fn: () => void, ms: number) => {
        timersRef.current.push(setTimeout(fn, ms));
    }, []);

    const startBolge = useCallback(
        (index: number) => {
            const b = BOLGER[index];
            igjenRef.current = b.folk.length;
            overgangRef.current = false;
            doserRef.current = b.doser;
            setBolge(index + 1);
            setDoser(b.doser);
            setBanner(b.tekst);
            settTimer(() => setBanner(null), 4200);
            b.folk.forEach((risiko, i) => {
                settTimer(() => {
                    // ID-en lages utenfor state-updateren: StrictMode kaller
                    // updateren to ganger, og da ville telleren hoppet.
                    const id = idRef.current++;
                    setFolk((prev) => [
                        ...prev,
                        { id, lane: i % LANES.length, risiko, vaksinert: false, ute: false },
                    ]);
                }, i * SPAWN_MS);
            });
        },
        [settTimer]
    );

    const start = useCallback(() => {
        nullstillTimere();
        setFolk([]);
        setVaksinerte(0);
        setBom(0);
        bomRef.current = 0;
        sykehus.reset();
        setForsok((f) => f + 1);
        setFase('spiller');
        startBolge(0);
        lyd.play('advance');
    }, [nullstillTimere, sykehus, startBolge, lyd]);

    const reset = useCallback(() => {
        nullstillTimere();
        setFase('idle');
        setFolk([]);
        setBolge(0);
        setDoser(0);
        doserRef.current = 0;
        setVaksinerte(0);
        setBom(0);
        bomRef.current = 0;
        setBanner(null);
        igjenRef.current = 0;
        overgangRef.current = false;
        setForsok((f) => f + 1);
        sykehus.reset();
    }, [nullstillTimere, sykehus]);

    const vaksiner = useCallback((id: number) => {
        if (doserRef.current <= 0) return;
        doserRef.current -= 1;
        setDoser(doserRef.current);
        setFolk((prev) => prev.map((k) => (k.id === id ? { ...k, vaksinert: true } : k)));
        setVaksinerte((v) => v + 1);
    }, []);

    const gaaUt = useCallback(
        (id: number, risiko: Risiko, vaksinert: boolean) => {
            if (!vaksinert) {
                sykehus.add(RISIKO[risiko].kostnad);
                if (RISIKO[risiko].kostnad > 0.1) {
                    bomRef.current += 1;
                    setBom(bomRef.current);
                }
            }
            igjenRef.current -= 1;
            setFolk((prev) => prev.map((k) => (k.id === id ? { ...k, ute: true } : k)));
        },
        [sykehus]
    );

    // Bølgeskifte: alle i bølgen er spawnet OG ute av bildet.
    useEffect(() => {
        if (fase !== 'spiller' || overgangRef.current) return;
        if (folk.length === 0 || igjenRef.current > 0) return;
        if (!folk.every((k) => k.ute)) return;
        overgangRef.current = true;
        const nesteIndex = bolge; // bolge er 1-indeksert, så dette er neste bølge
        if (nesteIndex >= BOLGER.length) {
            settTimer(() => {
                if (faseRef.current !== 'spiller') return;
                setFase('vunnet');
                setBanner(null);
                lyd.play('complete');
            }, 700);
        } else {
            settTimer(() => {
                if (faseRef.current !== 'spiller') return;
                setFolk([]);
                startBolge(nesteIndex);
            }, 1700);
        }
    }, [folk, fase, bolge, startBolge, settTimer, lyd]);

    const meldtRef = useRef(false);
    useEffect(() => {
        if (fase === 'vunnet' && !meldtRef.current) {
            meldtRef.current = true;
            onComplete({ score: Math.max(0.3, 1 - bom / 8), completed: true });
        }
        if (fase === 'idle' || fase === 'spiller') meldtRef.current = false;
    }, [fase, bom, onComplete]);

    // DEV-luke for selvspill-verifisering av balansen. Eksponerer bare det
    // eleven allerede ser i scenen (prikken over hodet, doser, målerne).
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const w = window as unknown as Record<string, unknown>;
        w.__vaksinekoenDebug = {
            fase,
            doser,
            sykehus: sykehus.value,
            folk: folk
                .filter((k) => !k.ute)
                .map((k) => ({ id: k.id, risiko: k.risiko, vaksinert: k.vaksinert })),
            start,
            vaksiner,
        };
    }, [fase, doser, sykehus.value, folk, start, vaksiner]);

    const avlesning = useMemo(
        () => [
            { label: 'Doser igjen', value: doser },
            { label: 'Vaksinert', value: vaksinerte },
            { label: 'Uke', value: `${Math.max(1, bolge)} / ${BOLGER.length}` },
        ],
        [doser, vaksinerte, bolge]
    );

    return (
        <MicroGameScaffold
            title="Vaksinekøen"
            subtitle="Dosene er få og folk går forbi. Klikk den du vil vaksinere før hen går ut igjen."
            estimatedSeconds={170}
            onRetry={fase !== 'idle' ? reset : undefined}
            scene={
                <Scene
                    key={forsok}
                    folk={folk}
                    doser={doser}
                    frossen={fase !== 'spiller'}
                    onVaksiner={vaksiner}
                    onUt={gaaUt}
                />
            }
            canvas={{
                camera: { position: [0, 9.8, 13], fov: 42 },
                target: [0, 0.9, -4.4],
                controls: false,
                background: '#dbeafe',
                light: 'overcast',
                fog: { color: '#dbeafe', near: 24, far: 48 },
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout items={avlesning} corner="bl" />
                    <SceneBadge corner="br">Norge 2021</SceneBadge>
                    <DragHint show={fase === 'spiller' && vaksinerte === 0} corner="bc">
                        Rød prikk: høy risiko. Blå: helsearbeider. Grønn: ung og frisk.
                    </DragHint>
                    <DangerVignette level={sykehus.value} />
                </>
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={sykehus.value}
                    label="Sykehusbelastning"
                    hint="Går den full, er intensivavdelingen overfylt."
                    labels={{ normal: 'Under kontroll', warn: 'Presset', danger: 'OVERFYLT!' }}
                />

                {fase === 'idle' && (
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Tre uker med vaksinering. Hver uke kommer det færre doser enn det er
                            folk. Du velger hvem som får dem.
                        </p>
                        <button
                            onClick={start}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-bold transition-colors flex-shrink-0"
                        >
                            <Play className="w-4 h-4" />
                            Start uke 1
                        </button>
                    </div>
                )}

                {fase === 'spiller' && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Syringe className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span>
                            {doser > 0
                                ? `${doser} doser igjen denne uka. Klikk på en person for å gi en dose.`
                                : 'Tomt for doser denne uka. Nå må du bare se på.'}
                        </span>
                    </div>
                )}

                {fase === 'tapt' && (
                    <LoseScreen title="Intensivavdelingen ble overfylt." onRetry={start}>
                        For mange i risikogruppene gikk uvaksinert ut. Da fylles sykehusene opp, og
                        de som trenger hjelp får den ikke. Prøv igjen, og se på prikken over hodet
                        før du bruker en dose.
                    </LoseScreen>
                )}

                {fase === 'vunnet' && (
                    <WinScreen
                        title="Du holdt sykehusene åpne gjennom alle tre ukene."
                        onReplay={start}
                    >
                        Du hadde aldri nok doser til alle. Det hadde ikke Norge heller. Derfor
                        laget myndighetene en rekkefølge: de som ble sykest av viruset, og de som
                        holdt helsevesenet i gang, fikk vaksinen først.
                    </WinScreen>
                )}

                <SceneFact>
                    Da vaksineringen i Norge startet 27. desember 2020, var det ikke nok doser til
                    alle. Ekspertene stilte tre spørsmål for å lage rekkefølgen: Hvor mye hjelper
                    dosen? Hvor alvorlig blir sykdommen for denne gruppa? Og har vi råd til å bruke
                    dosen her?
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
};

export default Vaksinekoen3D;
