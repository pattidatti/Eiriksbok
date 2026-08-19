import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Zap, Home, GraduationCap, Cross, type LucideIcon } from 'lucide-react';
import {
    MicroGameScaffold,
    Hotspot,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DangerVignette,
    MeterBar,
    LoseScreen,
    WinScreen,
    ToolPalette,
    GroundPlane,
    Building,
    Tree,
    Rock,
    Hill,
    Person,
    Smoke,
    Burst,
    Impact,
    FlatRing,
    useGameClock,
    useMeter,
    damp,
    type Tool,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Gjenreisningen 1945-1970.
//
// Lyspære-øyeblikket: velferdsstaten ble bygd mens Norge fortsatt var fattig.
// Hver krone du brukte på ett bygg, kunne du ikke bruke på et annet - og folk
// som mangler bolig venter ikke.
//
// Mekanikk: seks tomter i en norsk dal. Eleven velger byggetype og klikker
// tomta i 3D. Pengene kommer sakte, men et kraftverk får hjulene i gang og
// mangedobler inntekten. Samtidig stiger bolignøden hvert sekund. Bygger du
// bare boliger, rekker du aldri skole og sykehus før 1970. Bygger du bare
// kraftverk, tar bolignøden deg.

type Kind = 'kraftverk' | 'bolig' | 'skole' | 'sykehus';
type Status = 'playing' | 'won' | 'lost';

interface KindInfo {
    label: string;
    cost: number;
    icon: LucideIcon;
}

const KINDS: Record<Kind, KindInfo> = {
    kraftverk: { label: 'Kraftverk (9 kr)', cost: 9, icon: Zap },
    bolig: { label: 'Bolig (5 kr)', cost: 5, icon: Home },
    skole: { label: 'Skole (8 kr)', cost: 8, icon: GraduationCap },
    sykehus: { label: 'Sykehus (11 kr)', cost: 11, icon: Cross },
};

const PLOTS: [number, number, number][] = [
    [-6.4, 0, 2.6],
    [-2.6, 0, 4.0],
    [1.2, 0, 2.6],
    [5.0, 0, 3.6],
    [-4.4, 0, -1.8],
    [2.6, 0, -2.4],
];

const TOTAL_SECONDS = 60;
const START_KRONER = 10;
const BASE_INCOME = 0.25; // kroner per sekund uten kraftverk
const KRAFT_INCOME = 1.0; // ekstra kroner per sekund per kraftverk
const NOD_START = 0.1;
const NOD_RISE = 0.05; // per sekund
const NOD_RELIEF_PER_BOLIG = 0.01; // hver bolig demper stigningen
const NOD_DROP_PER_BOLIG = 0.38; // hver bolig senker nøden med én gang

const TOOLS: Tool[] = (Object.keys(KINDS) as Kind[]).map((k) => ({
    id: k,
    label: KINDS[k].label,
    icon: KINDS[k].icon,
}));

function yearOf(remaining: number) {
    const done = (TOTAL_SECONDS - remaining) / TOTAL_SECONDS;
    return 1945 + Math.min(25, Math.round(done * 25));
}

const Gjenreisningen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [attempt, setAttempt] = useState(0);
    const [status, setStatus] = useState<Status>('playing');
    const [built, setBuilt] = useState<(Kind | null)[]>([null, null, null, null, null, null]);
    const [tool, setTool] = useState<Kind>('kraftverk');
    const [kroner, setKroner] = useState(START_KRONER);
    const [banner, setBanner] = useState<string | null>(
        'Velg byggetype under vinduet, og klikk en gul tomt. Klokka starter ved første bygg.'
    );
    const [burst, setBurst] = useState(0);
    const [dust, setDust] = useState(0);
    const [dustAt, setDustAt] = useState<[number, number, number]>([0, 0, 0]);
    const [loseReason, setLoseReason] = useState<'nod' | 'tid' | 'feil-mix'>('nod');

    const statusRef = useRef<Status>('playing');
    const builtRef = useRef<(Kind | null)[]>(built);
    useEffect(() => {
        builtRef.current = built;
    }, [built]);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const counts = useMemo(() => {
        const c: Record<Kind, number> = { kraftverk: 0, bolig: 0, skole: 0, sykehus: 0 };
        built.forEach((b) => {
            if (b) c[b] += 1;
        });
        return c;
    }, [built]);

    const filled = built.filter(Boolean).length;
    const income = BASE_INCOME + KRAFT_INCOME * counts.kraftverk;

    const finish = useCallback(
        (why: 'nod' | 'tid' | 'feil-mix') => {
            if (statusRef.current !== 'playing') return;
            statusRef.current = 'lost';
            setLoseReason(why);
            setStatus('lost');
            sounds.play('incorrect');
        },
        [sounds]
    );

    const nod = useMeter({
        initial: NOD_START,
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.5,
        onOverload: () => finish('nod'),
    });

    const [started, setStarted] = useState(false);

    // Toppmeldingen skal kvittere og forsvinne, ikke bli staaende og stjele
    // utsikten mens eleven bygger videre.
    useEffect(() => {
        if (!banner || !started || status !== 'playing') return;
        const t = setTimeout(() => setBanner(null), 4200);
        return () => clearTimeout(t);
    }, [banner, started, status]);

    const clock = useGameClock({
        seconds: TOTAL_SECONDS,
        running: started && status === 'playing',
        onExpire: () => finish('tid'),
    });

    const year = yearOf(clock.remaining);

    // Én sakte puls driver økonomien og bolignøden. Den skriver kun til state
    // ti ganger i sekundet - aldri per frame.
    const nodAdd = nod.add;
    useEffect(() => {
        if (!started || status !== 'playing') return;
        const t = setInterval(() => {
            const current = builtRef.current;
            const kraft = current.filter((b) => b === 'kraftverk').length;
            const bolig = current.filter((b) => b === 'bolig').length;
            setKroner((k) => k + (BASE_INCOME + KRAFT_INCOME * kraft) * 0.1);
            const rise = Math.max(0.008, NOD_RISE - NOD_RELIEF_PER_BOLIG * bolig);
            nodAdd(rise * 0.1);
        }, 100);
        return () => clearInterval(t);
    }, [started, status, nodAdd]);

    const place = (index: number) => {
        if (status !== 'playing' || built[index]) return;
        const info = KINDS[tool];
        if (kroner < info.cost) {
            setBanner(
                `Du mangler penger. ${info.label.split(' (')[0]} koster ${info.cost} kr, og du har ${Math.floor(kroner)} kr.`
            );
            sounds.play('incorrect');
            return;
        }

        const next = [...built];
        next[index] = tool;
        setBuilt(next);
        setStarted(true);
        setKroner((k) => k - info.cost);
        setDustAt(PLOTS[index]);
        setDust((d) => d + 1);

        if (tool === 'bolig') nodAdd(-NOD_DROP_PER_BOLIG);

        const nextCounts: Record<Kind, number> = {
            kraftverk: 0,
            bolig: 0,
            skole: 0,
            sykehus: 0,
        };
        next.forEach((b) => {
            if (b) nextCounts[b] += 1;
        });
        const nextFilled = next.filter(Boolean).length;

        if (nextFilled === PLOTS.length) {
            const complete =
                nextCounts.kraftverk >= 1 && nextCounts.skole >= 1 && nextCounts.sykehus >= 1;
            if (complete) {
                statusRef.current = 'won';
                setStatus('won');
                setBanner(null);
                setBurst((b) => b + 1);
                sounds.play('complete');
                onComplete({
                    score: 1,
                    completed: true,
                    artifact: { year, ...nextCounts },
                });
            } else {
                finish('feil-mix');
            }
            return;
        }

        sounds.play(tool === 'kraftverk' ? 'sceneChange' : 'correct');
        if (tool === 'kraftverk') {
            setBanner('Kraftverket er i gang. Industrien betaler skatt, og inntekten stiger.');
        } else if (tool === 'bolig') {
            setBanner('Folk flytter inn. Bolignøden faller for en stund.');
        } else {
            setBanner(`${info.label.split(' (')[0]} er reist. ${PLOTS.length - nextFilled} tomter igjen.`);
        }
    };

    const reset = () => {
        statusRef.current = 'playing';
        setStatus('playing');
        setBuilt([null, null, null, null, null, null]);
        setKroner(START_KRONER);
        setTool('kraftverk');
        setBanner('Velg byggetype under vinduet, og klikk en gul tomt. Klokka starter ved første bygg.');
        setStarted(false);
        setLoseReason('nod');
        nod.reset();
        clock.restart();
        setAttempt((a) => a + 1);
    };

    return (
        <MicroGameScaffold
            title="Gjenreisningen"
            subtitle="Bygg Norge på nytt mellom 1945 og 1970 - med altfor lite penger"
            estimatedSeconds={120}
            onRetry={filled > 0 || status !== 'playing' ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 13, 21], fov: 40 },
                background: '#cfe3f0',
                light: 'day',
                target: [0, 0.6, -1],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Kassa', value: Math.floor(kroner), unit: 'kr' },
                            { label: 'Inntekt', value: income.toFixed(2), unit: 'kr/s' },
                        ]}
                    />
                    <SceneBadge corner="br">{status === 'won' ? '1970' : year}</SceneBadge>
                    <DangerVignette level={Math.max(0, (nod.value - 0.5) * 2)} />
                </>
            }
            scene={
                <ValleyScene
                    key={attempt}
                    built={built}
                    nod={nod.value}
                    burst={burst}
                    dust={dust}
                    dustAt={dustAt}
                    won={status === 'won'}
                    onPlace={place}
                />
            }
        >
            {status === 'won' ? (
                <WinScreen title="Bygda står ferdig i 1970" onReplay={reset}>
                    Du bygde kraftverket som skaffet pengene, boligene folk trengte, og skolen og
                    sykehuset som gjorde Norge til en velferdsstat. Slik gikk det i virkeligheten
                    også: nettet ble vevd mens landet fortsatt var fattig, lenge før oljen kom.
                </WinScreen>
            ) : status === 'lost' ? (
                <LoseScreen title={LOSE_TITLES[loseReason]} onRetry={reset}>
                    {LOSE_TEXTS[loseReason]}
                </LoseScreen>
            ) : (
                <div className="flex flex-col gap-3">
                    <ToolPalette tools={TOOLS} activeId={tool} onPick={(id) => setTool(id as Kind)} />
                    <MeterBar
                        value={nod.value}
                        label="Bolignød"
                        hint="Folk bor i kjellere og brakker. Hver bolig du reiser, demper presset."
                        warnAt={0.6}
                        dangerAt={0.85}
                        labels={{ normal: 'Under kontroll', warn: 'Stigende', danger: 'KRISE!' }}
                    />
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                            {filled}/6 tomter bygd - du trenger minst ett kraftverk, én skole og ett
                            sykehus
                        </span>
                        <span>
                            {started
                                ? `${Math.ceil(clock.remaining)} sekunder igjen til 1970`
                                : 'Klokka står til du bygger det første bygget'}
                        </span>
                    </div>
                </div>
            )}
        </MicroGameScaffold>
    );
};

const LOSE_TITLES: Record<'nod' | 'tid' | 'feil-mix', string> = {
    nod: 'Bolignøden tok bygda',
    tid: 'Det ble 1970, og bygda står halvferdig',
    'feil-mix': 'Tomtene er fulle, men velferden mangler',
};

const LOSE_TEXTS: Record<'nod' | 'tid' | 'feil-mix', string> = {
    nod: 'Folk bodde fortsatt i kjellere, brakker og på kjøkkenbenker. Etter krigen var boligmangelen det som hastet mest. Prøv å reise en bolig tidlig, men husk at kraftverket er det som skaffer penger til resten.',
    tid: 'Pengene kom for sakte. Uten et kraftverk tidlig blir inntekten liggende lavt, og da rekker du aldri skolen og sykehuset. Bygg kraftverket først, så kommer resten raskere.',
    'feil-mix':
        'Du fylte alle tomtene, men uten kraftverk, skole og sykehus er dette ingen velferdsstat. Norge trengte begge deler: en økonomi som tjente penger, og tjenester som delte dem ut.',
};

// ============================================================
//  3D-SCENEN
// ============================================================

function ValleyScene({
    built,
    nod,
    burst,
    dust,
    dustAt,
    won,
    onPlace,
}: {
    built: (Kind | null)[];
    nod: number;
    burst: number;
    dust: number;
    dustAt: [number, number, number];
    won: boolean;
    onPlace: (index: number) => void;
}) {
    const worried = nod > 0.55 && !won;
    return (
        <group>
            <GroundPlane size={46} depth={34} color="#7e9a55" />

            {/* Bakgrunnsdekor: åser og skog. Merket som dekor så innrammings-
                revisjonen ikke måler dem som en del av modellen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Hill position={[-16, -1.4, -24]} radius={8} height={4.6} color="#5f7c46" seed={3} />
                <Hill position={[2, -1.6, -29]} radius={10} height={5.6} color="#557440" seed={7} />
                <Hill position={[17, -1.4, -22]} radius={7} height={4.2} color="#63804a" seed={11} />
                {([-10.6, -9.2, 9.4, 10.8] as number[]).map((x, i) => (
                    <Tree key={x} position={[x, 0, -5.5 + i * 2.6]} leaf="#3f6b39" seed={i + 2} />
                ))}
            </group>

            {/* Krigsskadene: murrester og forkullede bjelker etter brente hus */}
            <Ruin position={[-8.6, 0, -5.4]} />
            <Ruin position={[7.6, 0, -6.4]} />
            <Ruin position={[-0.4, 0, -7.6]} />
            <Rock position={[-10.2, 0, 1.4]} color="#8b8378" scale={0.7} />
            <Rock position={[9.8, 0, 0.6]} color="#93897c" scale={0.55} />

            {/* Veien gjennom dalen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.4]} receiveShadow>
                <planeGeometry args={[24, 1.6]} />
                <meshStandardMaterial color="#9c8b70" roughness={1} />
            </mesh>

            {PLOTS.map((p, i) => (
                <Plot
                    key={i}
                    position={p}
                    kind={built[i]}
                    onSelect={() => onPlace(i)}
                    locked={won}
                />
            ))}

            {/* Folk som venter på bolig */}
            <Person position={[-1.8, 0, 6.2]} body="#4a5a72" pose={worried ? 'raise' : 'idle'} hat="cap" />
            <Person position={[-0.6, 0, 6.6]} body="#6a4a3a" pose={worried ? 'raise' : 'idle'} />
            <Person position={[0.7, 0, 6.1]} body="#3f5b48" pose={worried ? 'raise' : 'idle'} />
            <Person position={[2.0, 0, 6.7]} body="#7a5a30" pose={worried ? 'raise' : 'idle'} hat="hood" />

            <Impact preset="dustPuff" trigger={dust} position={[dustAt[0], 0.2, dustAt[2]]} />
            <Burst position={[0, 3.4, 1]} trigger={burst} color="#ffd86b" count={34} spread={6} />
        </group>
    );
}

// Murrest etter et brent hus: to knekte vegger og en forkullet bjelke.
// Alt står på bakken - ingen deler henger i lufta.
function Ruin({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.9, 0.9, 0.22]} />
                <meshStandardMaterial color="#9a9188" roughness={1} />
            </mesh>
            <mesh position={[-0.84, 0.3, 0.72]} castShadow receiveShadow>
                <boxGeometry args={[0.22, 0.6, 1.4]} />
                <meshStandardMaterial color="#8f867d" roughness={1} />
            </mesh>
            <mesh position={[0.5, 0.06, 0.9]} rotation={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[1.6, 0.12, 0.12]} />
                <meshStandardMaterial color="#3d332b" roughness={1} />
            </mesh>
        </group>
    );
}

function Plot({
    position,
    kind,
    onSelect,
    locked,
}: {
    position: [number, number, number];
    kind: Kind | null;
    onSelect: () => void;
    locked: boolean;
}) {
    const grp = useRef<THREE.Group>(null);
    const grow = useRef(0.06);

    useFrame((_, dt) => {
        if (!grp.current) return;
        grow.current = damp(grow.current, kind ? 1 : 0.06, dt, 3.2);
        grp.current.scale.set(1, grow.current, 1);
    });

    return (
        <group position={position}>
            {!kind && (
                <>
                    <FlatRing position={[0, 0.03, 0]} radius={1.5} tube={0.09} color="#e3b23c" />
                    {!locked && <Hotspot position={[0, 1.5, 0]} onSelect={onSelect} label="Bygg her" radius={0.5} />}
                </>
            )}
            <group ref={grp} visible={kind !== null}>
                {kind === 'bolig' && <Bolig />}
                {kind === 'skole' && <Skole />}
                {kind === 'sykehus' && <Sykehus />}
                {kind === 'kraftverk' && <Kraftverk />}
            </group>
        </group>
    );
}

function Bolig() {
    return (
        <group>
            <Building position={[0, 0, 0]} w={2.1} h={1.7} d={1.9} body="#e0cfa8" roof="#8a4b32" />
        </group>
    );
}

function Skole() {
    return (
        <group>
            <Building position={[0, 0, 0]} w={3.0} h={1.5} d={2.0} body="#efe6d2" roof="#7a5230" />
            {/* Flaggstang - loddrett sylinder */}
            <mesh position={[1.9, 1.3, 0.9]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 2.6, 8]} />
                <meshStandardMaterial color="#e8e8e8" roughness={0.6} />
            </mesh>
            <mesh position={[2.28, 2.25, 0.9]}>
                <boxGeometry args={[0.72, 0.44, 0.03]} />
                <meshStandardMaterial color="#c8342f" roughness={0.8} />
            </mesh>
        </group>
    );
}

function Sykehus() {
    return (
        <group>
            <Building position={[0, 0, 0]} w={2.9} h={1.9} d={2.2} body="#f4f4f2" roof="#b23a3a" />
            {/* Rødt kors på fasaden */}
            <mesh position={[0, 1.05, 1.12]}>
                <boxGeometry args={[0.72, 0.2, 0.05]} />
                <meshStandardMaterial color="#c02b2b" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.05, 1.12]}>
                <boxGeometry args={[0.2, 0.72, 0.05]} />
                <meshStandardMaterial color="#c02b2b" roughness={0.7} />
            </mesh>
        </group>
    );
}

function Kraftverk() {
    return (
        <group>
            {/* Betongbygg - bunnen ligger på bakken */}
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.0, 1.5, 2.2]} />
                <meshStandardMaterial color="#b9bcbb" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.56, 0]} castShadow>
                <boxGeometry args={[3.2, 0.16, 2.4]} />
                <meshStandardMaterial color="#7c8281" roughness={0.95} />
            </mesh>
            {/* Rørgater - loddrette sylindre, bunnen på bakken */}
            {[-0.8, 0.8].map((x) => (
                <mesh key={x} position={[x, 1.3, -1.5]} castShadow>
                    <cylinderGeometry args={[0.26, 0.26, 2.6, 12]} />
                    <meshStandardMaterial color="#8f9a9c" roughness={0.7} metalness={0.3} />
                </mesh>
            ))}
            {/* Kraftmast */}
            <mesh position={[1.9, 1.5, 1.0]} castShadow>
                <cylinderGeometry args={[0.07, 0.1, 3.0, 6]} />
                <meshStandardMaterial color="#6e7573" roughness={0.8} />
            </mesh>
            <mesh position={[1.9, 2.75, 1.0]}>
                <boxGeometry args={[1.2, 0.09, 0.09]} />
                <meshStandardMaterial color="#6e7573" roughness={0.8} />
            </mesh>
            <Smoke origin={[-1.1, 1.7, -0.4]} show count={5} color="#d7dbd9" />
        </group>
    );
}

export default Gjenreisningen3D;
