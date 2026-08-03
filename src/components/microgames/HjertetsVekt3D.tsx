import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    GroundPlane,
    Column,
    Torch,
    Person,
    THEMES,
    GlowMaterial,
    Burst,
    damp,
    useShake,
    useGameClock,
    useMeter,
    useRandomPulse,
    PovCamera,
    SceneBanner,
    WinScreen,
    LoseScreen,
    TimerPill,
    MeterBar,
    DangerVignette,
} from './kit';
import type { MicroGameProps } from './types';

// Lyspære-øyeblikket: eleven står selv foran vekten i Dommens sal og kjenner at
// ma'at ikke var noe man hadde, men noe man måtte holde oppe hele tiden. Hjertet
// bar med seg alt du gjorde, og det ble veid mot fjæren til gudinnen Ma'at.

const T = THEMES.egypt;

const VARIGHET = 45; // sekunder
const START_VEKT = 0.45;
const DRIFT_PER_SEK = 0.03; // isfet siger inn av seg selv
const MAAT_KLIKK = -0.13;
const ISFET_KLIKK = 0.2;
const MAAT_TAPT = 0.05; // en god handling du ikke rakk
const LEVETID_MS = 3600;
const MAKS_SAMTIDIG = 3;

// Ma'at-handlingene er hentet fra den negative bekjennelsen i Dødebokens
// kapittel 125, der den døde sverger foran 42 guder at han ikke har brutt ma'at.
const MAAT_HANDLINGER = [
    'Jeg ga brød til den sultne',
    'Jeg sa sant i retten',
    'Jeg stjal ikke korn',
    'Jeg ga vann til den tørste',
    'Jeg flyttet ingen grensestein',
    'Jeg jukset ikke med vekten',
    'Jeg såret ingen med ord',
];

const ISFET_HANDLINGER = [
    'Jeg løy for dommeren',
    'Jeg tok naboens korn',
    'Jeg flyttet grensesteinen',
    'Jeg jukset med vekten',
    'Jeg nektet den sultne mat',
    'Jeg tok imot bestikkelser',
];

type Fase = 'klar' | 'spiller' | 'vant' | 'tapt';

interface Gjerning {
    id: number;
    slag: 'maat' | 'isfet';
    tekst: string;
    x: number;
    z: number;
}

let nesteId = 1;

// Fjær og slangevirvel: to tydelig ulike former, ikke bare to farger.
function MaatFjaer() {
    return (
        <group>
            <mesh position={[0, 0.34, 0]} rotation={[0, 0, 0.12]}>
                <coneGeometry args={[0.17, 0.72, 8]} />
                <GlowMaterial color="#fcd34d" />
            </mesh>
            <mesh position={[0, -0.12, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.34, 6]} />
                <meshStandardMaterial color="#e8c76a" roughness={0.6} />
            </mesh>
        </group>
    );
}

function IsfetVirvel() {
    return (
        <group>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.3, 0.11, 8, 18]} />
                <meshStandardMaterial color="#4c3566" roughness={0.5} emissive="#2a1b3d" />
            </mesh>
            <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0.7]}>
                <torusGeometry args={[0.19, 0.09, 8, 16]} />
                <meshStandardMaterial color="#5b4079" roughness={0.5} emissive="#2a1b3d" />
            </mesh>
            <mesh position={[0.22, 0.45, 0]}>
                <coneGeometry args={[0.1, 0.26, 6]} />
                <meshStandardMaterial color="#6b4a8c" roughness={0.5} />
            </mesh>
        </group>
    );
}

// Én flytende handling. Stiger langsomt og fader mot slutten av levetiden.
function GjerningsMerke({ g, onVelg }: { g: Gjerning; onVelg: (g: Gjerning) => void }) {
    const grp = useRef<THREE.Group>(null);
    const levd = useRef(0);
    const erMaat = g.slag === 'maat';

    useFrame((_, dt) => {
        levd.current += dt;
        const grup = grp.current;
        if (!grup) return;
        const p = Math.min(1, levd.current / (LEVETID_MS / 1000));
        grup.position.y = 0.95 + p * 2.2;
        // Mykt inn, mykt ut - ingenting popper brått i eller ut av synet.
        const inn = Math.min(1, levd.current / 0.35);
        const ut = p > 0.78 ? 1 - (p - 0.78) / 0.22 : 1;
        grup.scale.setScalar(Math.max(0.01, inn * ut));
    });

    return (
        <group ref={grp} position={[g.x, 0.95, g.z]}>
            <Billboard>
                <Interactive
                    onSelect={() => onVelg(g)}
                    hitArea={[1.7, 1.7, 0.6]}
                    sound={erMaat ? 'correct' : 'incorrect'}
                >
                    {() => (
                        <>
                            {erMaat ? <MaatFjaer /> : <IsfetVirvel />}
                            <Html center position={[0, -0.62, 0]} pointerEvents="none">
                                <div
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap shadow-lg ${
                                        erMaat
                                            ? 'bg-amber-100/95 text-amber-900'
                                            : 'bg-violet-950/85 text-violet-100'
                                    }`}
                                >
                                    {g.tekst}
                                </div>
                            </Html>
                        </>
                    )}
                </Interactive>
            </Billboard>
        </group>
    );
}

// Selve vekten: bjelken vipper etter hvor tungt hjertet er.
function Vekten({ vektRef }: { vektRef: React.MutableRefObject<number> }) {
    const bjelke = useRef<THREE.Group>(null);
    const venstreSkaal = useRef<THREE.Group>(null);
    const hoyreSkaal = useRef<THREE.Group>(null);
    const naa = useRef(0);

    const BJELKE_Y = 3.3;
    const ARM = 2.3;
    const SNOR = 1.0;

    useFrame((_, dt) => {
        // -1 = fjæren tyngst (lett hjerte), +1 = hjertet tyngst.
        const maal = Math.max(-1, Math.min(1, (vektRef.current - 0.5) * 2.4));
        naa.current = damp(naa.current, maal, dt, 3);
        const vinkel = naa.current * 0.3;
        if (bjelke.current) bjelke.current.rotation.z = vinkel;
        const loft = Math.sin(vinkel) * ARM;
        // Hjertet henger i venstre arm: tungt hjerte trekker den ned.
        if (venstreSkaal.current) venstreSkaal.current.position.y = BJELKE_Y - loft - SNOR;
        if (hoyreSkaal.current) hoyreSkaal.current.position.y = BJELKE_Y + loft - SNOR;
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Fot og stolpe - står PÅ gulvet */}
            <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 0.3, 1.5]} />
                <meshStandardMaterial color={T.stone} roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.8, 0]} castShadow>
                <cylinderGeometry args={[0.13, 0.16, 3.0, 10]} />
                <meshStandardMaterial color="#b08d4f" roughness={0.5} metalness={0.35} />
            </mesh>

            {/* Bjelken vipper om midten */}
            <group ref={bjelke} position={[0, BJELKE_Y, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.07, 0.07, ARM * 2, 8]} />
                    <meshStandardMaterial color="#c9a253" roughness={0.45} metalness={0.4} />
                </mesh>
                <mesh position={[0, 0.22, 0]}>
                    <sphereGeometry args={[0.17, 12, 12]} />
                    <meshStandardMaterial color="#d8b45f" roughness={0.4} metalness={0.4} />
                </mesh>
            </group>

            {/* Venstre skål: hjertet */}
            <group ref={venstreSkaal} position={[-ARM, BJELKE_Y - SNOR, 0]}>
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.012, 0.012, 1.0, 5]} />
                    <meshStandardMaterial color="#a98a4d" />
                </mesh>
                <mesh castShadow receiveShadow>
                    <cylinderGeometry args={[0.55, 0.5, 0.07, 16]} />
                    <meshStandardMaterial color="#c9a253" roughness={0.45} metalness={0.4} />
                </mesh>
                <mesh position={[0, 0.34, 0]} castShadow>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial color="#a12f3a" roughness={0.35} emissive="#3d0f16" />
                </mesh>
            </group>

            {/* Høyre skål: fjæren til Ma'at */}
            <group ref={hoyreSkaal} position={[ARM, BJELKE_Y - SNOR, 0]}>
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.012, 0.012, 1.0, 5]} />
                    <meshStandardMaterial color="#a98a4d" />
                </mesh>
                <mesh castShadow receiveShadow>
                    <cylinderGeometry args={[0.55, 0.5, 0.07, 16]} />
                    <meshStandardMaterial color="#c9a253" roughness={0.45} metalness={0.4} />
                </mesh>
                <mesh position={[0, 0.42, 0]} rotation={[0, 0, 0.1]}>
                    <coneGeometry args={[0.16, 0.72, 8]} />
                    <GlowMaterial color="#fde68a" />
                </mesh>
            </group>
        </group>
    );
}

// Ammit, "slukeren", venter ved siden av vekten. Reiser seg når hjertet taper.
function Ammit({ sulten }: { sulten: boolean }) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = grp.current;
        if (!g) return;
        g.position.x = damp(g.position.x, sulten ? 2.5 : 3.6, dt, 2.2);
        g.position.z = damp(g.position.z, sulten ? -0.3 : 0.9, dt, 2.2);
        g.rotation.y = damp(g.rotation.y, sulten ? -1.1 : -0.4, dt, 2.2);
    });
    return (
        <group ref={grp} position={[3.6, 0, 0.9]} rotation={[0, -0.4, 0]}>
            {/* Kropp - bunnen ligger på gulvet */}
            <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[0.9, 0.8, 2.1]} />
                <meshStandardMaterial color="#5d6b4a" roughness={0.85} />
            </mesh>
            {/* Hode og snute */}
            <mesh position={[0, 0.72, 1.25]} castShadow>
                <boxGeometry args={[0.66, 0.5, 0.8]} />
                <meshStandardMaterial color="#6b7a55" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.6, 1.9]} castShadow>
                <boxGeometry args={[0.44, 0.3, 0.7]} />
                <meshStandardMaterial color="#6b7a55" roughness={0.85} />
            </mesh>
            {/* Bein */}
            {[
                [-0.36, 0.7],
                [0.36, 0.7],
                [-0.36, -0.7],
                [0.36, -0.7],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.1, z]}>
                    <boxGeometry args={[0.2, 0.2, 0.2]} />
                    <meshStandardMaterial color="#4c5a3c" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

function Salen({
    gjerninger,
    onVelg,
    vektRef,
    sulten,
    feiring,
    rist,
}: {
    gjerninger: Gjerning[];
    onVelg: (g: Gjerning) => void;
    vektRef: React.MutableRefObject<number>;
    sulten: boolean;
    feiring: number;
    rist: { n: number; kraft: number };
}) {
    // useShake bruker useFrame og MÅ derfor bo inne i canvasen, ikke i DOM-laget.
    const { ref: ristRef, shake } = useShake(0.22, 0.05);
    const sistRist = useRef(0);
    useEffect(() => {
        if (rist.n > sistRist.current) {
            sistRist.current = rist.n;
            shake(rist.kraft);
        }
    }, [rist, shake]);

    return (
        <group ref={ristRef}>
            <PovCamera position={[0, 1.75, 8.6]} lookAt={[0, 2.1, 0]} sway={0.015} />

            <GroundPlane size={30} depth={40} color="#c8b48a" />

            {/* Bakvegg, så salen ikke ender i tomrom */}
            <mesh position={[0, 3, -11]} receiveShadow>
                <boxGeometry args={[22, 6.4, 0.6]} />
                <meshStandardMaterial color="#d9c79c" roughness={1} />
            </mesh>

            {/* Søylerekker på begge sider */}
            {[-8, -4.5, -1, 2.5, 6].map((z) => (
                <group key={z}>
                    <Column position={[-4.6, 0, z]} height={5.2} radius={0.34} color="#e2d0a4" />
                    <Column position={[4.6, 0, z]} height={5.2} radius={0.34} color="#e2d0a4" />
                </group>
            ))}

            {/* Fakler gir varm sal-stemning */}
            <Torch position={[-4.3, 0, 4.2]} height={2.1} />
            <Torch position={[4.3, 0, 4.2]} height={2.1} />
            <Torch position={[-4.3, 0, -6.6]} height={2.1} />
            <Torch position={[4.3, 0, -6.6]} height={2.1} />

            <Vekten vektRef={vektRef} />

            {/* Osiris dømmer, Anubis passer vekten, Thoth skriver ned */}
            {/* Osiris troner bak vekten. En kit-Person er bare ca. 0,97 enheter høy
                ved scale 1, så både podiet og skalaen må være store nok til at han
                havner godt OVER vektbjelken (y=3,3) og ikke skjules av stolpen. */}
            <mesh position={[0, 0.45, -5.6]} receiveShadow castShadow>
                <boxGeometry args={[4.2, 0.9, 2.4]} />
                <meshStandardMaterial color="#cbb894" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.65, -5.6]} receiveShadow castShadow>
                <boxGeometry args={[3.2, 1.5, 1.9]} />
                <meshStandardMaterial color="#bda882" roughness={0.9} />
            </mesh>
            {/* Ryggen på tronen */}
            <mesh position={[0, 3.6, -6.3]} receiveShadow castShadow>
                <boxGeometry args={[2.6, 2.4, 0.4]} />
                <meshStandardMaterial color="#c3ad84" roughness={0.9} />
            </mesh>
            <Person
                position={[0, 2.4, -5.6]}
                scale={2.6}
                body="#2f6b52"
                skin="#3f8a67"
                legs="#25543f"
                hat="crown"
                hatColor="#e8d48a"
            />
            <Person
                position={[-3.0, 0, -2.6]}
                scale={1.8}
                body="#2b2b33"
                skin="#3a3a44"
                legs="#1f1f26"
                hat="hood"
                hatColor="#20202a"
            />
            <Person
                position={[3.0, 0, -2.6]}
                scale={1.8}
                body="#b8b0d6"
                skin="#d8cfae"
                legs="#8f88ab"
                hat="cap"
                hatColor="#9a92bf"
            />

            <Ammit sulten={sulten} />

            {gjerninger.map((g) => (
                <GjerningsMerke key={g.id} g={g} onVelg={onVelg} />
            ))}

            <Burst position={[0, 3.6, 0]} trigger={feiring} color="#fbbf24" count={34} />
        </group>
    );
}

export default function HjertetsVekt3D({ onComplete }: MicroGameProps) {
    const [fase, setFase] = useState<Fase>('klar');
    const [gjerninger, setGjerninger] = useState<Gjerning[]>([]);
    const [banner, setBanner] = useState<string | null>(null);
    const [forsok, setForsok] = useState(0);
    const [feiring, setFeiring] = useState(0);
    const [treff, setTreff] = useState(0);
    const [bom, setBom] = useState(0);

    const vektRef = useRef(START_VEKT);
    const faseRef = useRef<Fase>('klar');
    const timere = useRef<ReturnType<typeof setTimeout>[]>([]);
    // Rist bor i scenen (useFrame), så DOM-laget sender bare et signal inn.
    const [rist, setRist] = useState({ n: 0, kraft: 0 });
    const skjelv = useCallback((kraft: number) => {
        setRist((r) => ({ n: r.n + 1, kraft }));
    }, []);

    const settFase = useCallback((f: Fase) => {
        faseRef.current = f;
        setFase(f);
    }, []);

    const hjerte = useMeter({
        initial: START_VEKT,
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.8,
        onOverload: () => {
            if (faseRef.current !== 'spiller') return;
            settFase('tapt');
            setBanner(null);
            skjelv(0.9);
        },
    });

    const klokke = useGameClock({
        seconds: VARIGHET,
        running: fase === 'spiller',
        onExpire: () => {
            if (faseRef.current !== 'spiller') return;
            settFase('vant');
            setBanner(null);
            setFeiring((f) => f + 1);
            const poeng = Math.max(0.5, Math.min(1, 1 - vektRef.current));
            onComplete({ score: Number(poeng.toFixed(2)), completed: true });
        },
    });

    // Speil målerverdien til en ref så 3D-scenen kan lese den uten re-render.
    useEffect(() => {
        vektRef.current = hjerte.value;
    }, [hjerte.value]);

    // Isfet siger inn av seg selv: gjør du ingenting, blir hjertet tyngre.
    useEffect(() => {
        if (fase !== 'spiller') return;
        const t = setInterval(() => hjerte.add(DRIFT_PER_SEK * 0.1), 100);
        return () => clearInterval(t);
    }, [fase, hjerte]);

    const fjern = useCallback((id: number) => {
        setGjerninger((g) => g.filter((x) => x.id !== id));
    }, []);

    const spawn = useCallback(() => {
        setGjerninger((naa) => {
            if (naa.length >= MAKS_SAMTIDIG) return naa;
            const erMaat = Math.random() < 0.6;
            const liste = erMaat ? MAAT_HANDLINGER : ISFET_HANDLINGER;
            const id = nesteId++;
            // Hold merkene i et bånd foran vekten, aldri oppå den.
            const x = -3.1 + Math.random() * 6.2;
            const z = 2.6 + Math.random() * 2.2;
            const g: Gjerning = {
                id,
                slag: erMaat ? 'maat' : 'isfet',
                tekst: liste[Math.floor(Math.random() * liste.length)],
                x,
                z,
            };
            const t = setTimeout(() => {
                setGjerninger((cur) => {
                    if (!cur.some((c) => c.id === id)) return cur;
                    // En god handling du ikke rakk, tynger hjertet litt.
                    if (g.slag === 'maat' && faseRef.current === 'spiller') {
                        hjerte.add(MAAT_TAPT);
                        setBom((b) => b + 1);
                    }
                    return cur.filter((c) => c.id !== id);
                });
            }, LEVETID_MS);
            timere.current.push(t);
            return [...naa, g];
        });
    }, [hjerte]);

    useRandomPulse({
        running: fase === 'spiller',
        minDelayMs: 650,
        maxDelayMs: 1250,
        onPulse: spawn,
    });

    const velg = useCallback(
        (g: Gjerning) => {
            if (faseRef.current !== 'spiller') return;
            if (g.slag === 'maat') {
                hjerte.add(MAAT_KLIKK);
                setTreff((t) => t + 1);
                setBanner("Ma'at. Hjertet blir lettere.");
            } else {
                hjerte.add(ISFET_KLIKK);
                setBom((b) => b + 1);
                skjelv(0.55);
                setBanner('Isfet. Hjertet blir tyngre.');
            }
            fjern(g.id);
            const t = setTimeout(() => setBanner(null), 1100);
            timere.current.push(t);
        },
        [hjerte, fjern, skjelv]
    );

    const start = useCallback(() => {
        timere.current.forEach(clearTimeout);
        timere.current = [];
        setGjerninger([]);
        setTreff(0);
        setBom(0);
        vektRef.current = START_VEKT;
        hjerte.reset();
        klokke.restart();
        setForsok((f) => f + 1);
        settFase('spiller');
        setBanner('Klikk de gylne ma\'at-handlingene. La de mørke isfet-virvlene være.');
        const t = setTimeout(() => setBanner(null), 3200);
        timere.current.push(t);
    }, [hjerte, klokke, settFase]);

    useEffect(() => {
        const liste = timere.current;
        return () => liste.forEach(clearTimeout);
    }, []);

    const spiller = fase === 'spiller';

    return (
        <MicroGameScaffold
            title="Hjertets vekt"
            subtitle="Du står i Dommens sal. Hold hjertet like lett som fjæren til Ma'at til dommen er over."
            estimatedSeconds={150}
            onRetry={start}
            containerClassName="bg-gradient-to-b from-[#e9d8a6] via-[#e0cb95] to-[#c9b183]"
            canvas={{
                controls: false,
                camera: { position: [0, 1.75, 8.6], fov: 58 },
                background: T.sky,
                fog: { color: T.fog, near: 12, far: 34 },
                light: 'golden',
                contactShadows: false,
            }}
            scene={
                <Salen
                    key={forsok}
                    gjerninger={gjerninger}
                    onVelg={velg}
                    vektRef={vektRef}
                    sulten={fase === 'tapt'}
                    feiring={feiring}
                    rist={rist}
                />
            }
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    {spiller && (
                        <TimerPill seconds={klokke.remaining} label="Dommen" warnBelow={10} />
                    )}
                    <DangerVignette level={spiller ? hjerte.value * 0.9 : 0} />
                </>
            }
        >
            {fase === 'klar' && (
                <div className="sm:flex sm:items-center sm:gap-4">
                    <p className="text-sm text-slate-700 flex-1 min-w-0">
                        Hjertet ditt ligger allerede på vekten. Gyldne fjær er handlinger som holder
                        ma&apos;at, mørke virvler er isfet. Gjør du ingenting, blir hjertet tyngre av
                        seg selv.
                    </p>
                    <button
                        type="button"
                        onClick={start}
                        className="mt-3 sm:mt-0 shrink-0 bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 py-2 text-sm font-semibold"
                    >
                        Start dommen
                    </button>
                </div>
            )}

            {spiller && (
                <div className="space-y-2">
                    <MeterBar
                        value={hjerte.value}
                        label="Hjertets vekt"
                        hint="Klikk fjærene. Lar du dem forsvinne, tynger det hjertet."
                        labels={{ normal: 'Lettere enn fjæren', warn: 'Tungt', danger: 'FOR TUNGT!' }}
                    />
                    <p className="text-xs text-slate-500">
                        Ma&apos;at-handlinger: {treff} · Feiltrinn: {bom}
                    </p>
                </div>
            )}

            {fase === 'vant' && (
                <WinScreen title="Hjertet veier som fjæren" onReplay={start}>
                    Thoth skriver ned dommen, og Osiris slipper deg inn. Slik trodde egypterne at
                    livet ble gjort opp: hjertet husket alt du hadde gjort, og målestokken var
                    ma&apos;at. Du traff {treff} ma&apos;at-handlinger og gjorde {bom} feiltrinn.
                </WinScreen>
            )}

            {fase === 'tapt' && (
                <LoseScreen title="Hjertet ble tyngre enn fjæren" onRetry={start}>
                    Ammit, slukeren, tar hjertet, og den døde slettes helt ut. Egypterne mente at
                    ma&apos;at måtte holdes oppe hele livet, ikke bare i dommens øyeblikk. Prøv
                    igjen: ta fjærene raskt, og la isfet-virvlene være i fred.
                </LoseScreen>
            )}
        </MicroGameScaffold>
    );
}
