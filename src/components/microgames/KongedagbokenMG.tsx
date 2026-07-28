import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MicroGameScaffold,
    PovCamera,
    Hotspot,
    Person,
    Mover,
    Column,
    Wall,
    Arch,
    Torch,
    GroundPlane,
    Particles,
    Burst,
    GlowHalo,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    DangerVignette,
    WinScreen,
    LoseScreen,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Lyspære-øyeblikket: eleven kjenner på kroppen hvorfor Aleksanders død er en
// gåte. Du er skriveren som fører kongedagboken i Babylon. Tegnene dukker opp
// og forsvinner igjen, ryktene svirrer i rommet, og til slutt sitter du med en
// dagbok full av hull. Det er nøyaktig den kilden historikere må jobbe med.

// Runden varer til det siste tegnet har rukket å blekne. Utledet av manuset,
// ikke gjettet, så det aldri blir dødtid på slutten.
const DAGER = 11;
const OBS_MAAL = 6;
const OBS_TOTALT = 8;

type Kind = 'obs' | 'rykte';
type Play = 'idle' | 'playing' | 'won' | 'lost';

interface Tegn {
    at: number;
    life: number;
    kind: Kind;
    label: string;
    pos: [number, number, number];
}

// Alle observasjonene er hentet fra det de antikke kildene faktisk beskriver.
// Ryktene er de som gikk i samtiden - ingen av dem har noen øyenvitne bak seg.
const SCRIPT: Tegn[] = [
    {
        at: 1.5,
        life: 6.5,
        kind: 'obs',
        label: 'Han drakk til langt på natt hos Medios',
        pos: [2.1, 1.35, -3.3],
    },
    { at: 5.4, life: 5.5, kind: 'rykte', label: 'rykte', pos: [-3.6, 1.9, -3.0] },
    { at: 9.0, life: 6.5, kind: 'obs', label: 'Feberen kommer og går ikke', pos: [0.2, 1.75, -4.6] },
    { at: 13.5, life: 6.5, kind: 'obs', label: 'Sterke smerter i magen', pos: [0.55, 1.45, -4.6] },
    { at: 18.0, life: 5.5, kind: 'rykte', label: 'rykte', pos: [3.7, 1.8, -2.6] },
    {
        at: 21.5,
        life: 6.5,
        kind: 'obs',
        label: 'Sumpene rundt byen står stille og stinker',
        pos: [0, 1.9, -8.6],
    },
    {
        at: 26.0,
        life: 6.5,
        kind: 'obs',
        label: 'Han klarer ikke lenger løfte armen',
        pos: [1.15, 1.45, -4.15],
    },
    { at: 30.5, life: 5.5, kind: 'rykte', label: 'rykte', pos: [-2.4, 2.3, -2.6] },
    {
        at: 34.0,
        life: 6.5,
        kind: 'obs',
        label: 'Stemmen er borte, men blikket følger oss',
        pos: [-1.15, 1.65, -4.6],
    },
    {
        at: 38.5,
        life: 6.5,
        kind: 'obs',
        label: 'Hæren får gå forbi senga én og én',
        pos: [-2.6, 1.5, -2.2],
    },
    { at: 43.0, life: 5.5, kind: 'rykte', label: 'rykte', pos: [3.9, 2.2, -4.4] },
    {
        at: 46.5,
        life: 6.5,
        kind: 'obs',
        label: 'Kroppen viser ingen tegn til forråtnelse',
        pos: [-0.35, 1.15, -4.6],
    },
    { at: 50.5, life: 5.5, kind: 'rykte', label: 'rykte', pos: [-4.1, 2.3, -5.0] },
];

// Runden er over når det siste tegnet har rukket å blekne. Utledet av manuset,
// ikke gjettet, så det aldri blir dødtid på slutten.
const SLUTT = Math.max(...SCRIPT.map((t) => t.at + t.life)) + 1;

const RYKTE_TEKST = [
    'Ved døra hvisker noen: «Antipatros sendte gift med sønnen sin.»',
    'En offiser mumler: «Det var vinen. Noen hadde blandet noe i den.»',
    'Fra gangen: «Gudene straffer ham for Babylon.»',
    'Noen sier: «Han ble forgiftet av sine egne generaler.»',
    'En tjener hvisker: «Han er allerede død. De skjuler det for oss.»',
];

interface AktivtTegn extends Tegn {
    key: number;
    rykteNr: number;
}

// ── Scenen: kongens sovekammer i Babylon, juni 323 fvt ───────────────────────

function Sovekammer({
    tegn,
    onPick,
    burst,
}: {
    tegn: AktivtTegn[];
    onPick: (t: AktivtTegn) => void;
    burst: number;
}) {
    // Prosesjonen av soldater som får gå forbi senga. Verden beveger seg
    // uansett hva eleven gjør.
    const [ben, setBen] = useState([0, 0, 0]);
    const snu = useCallback((i: number) => {
        setBen((b) => b.map((v, j) => (j === i ? v + 1 : v)));
    }, []);

    return (
        <group>
            <GroundPlane size={34} depth={30} color="#c9b58f" position={[0, 0, -3]} />

            {/* Vegger: bakvegg i to deler med en portåpning mot sumpen */}
            <Wall position={[-3.35, 0, -8.5]} length={3.7} height={4.4} thickness={0.4} color="#b0a184" />
            <Wall position={[3.35, 0, -8.5]} length={3.7} height={4.4} thickness={0.4} color="#b0a184" />
            <mesh position={[0, 3.9, -8.5]} castShadow>
                <boxGeometry args={[3.2, 1, 0.4]} />
                <meshStandardMaterial color="#b0a184" roughness={0.95} />
            </mesh>
            <Arch position={[0, 0, -8.5]} width={3} height={3.2} color="#c6b696" />
            <Wall
                position={[-5, 0, -3.5]}
                rotation={[0, Math.PI / 2, 0]}
                length={10}
                height={4.4}
                thickness={0.4}
                color="#a89a80"
            />
            <Wall
                position={[5, 0, -3.5]}
                rotation={[0, Math.PI / 2, 0]}
                length={10}
                height={4.4}
                thickness={0.4}
                color="#a89a80"
            />

            {/* Søyler */}
            <Column position={[-3.2, 0, -1.6]} height={3.9} radius={0.26} color="#ded1b4" />
            <Column position={[3.2, 0, -1.6]} height={3.9} radius={0.26} color="#ded1b4" />
            <Column position={[-3.2, 0, -6.2]} height={3.9} radius={0.26} color="#ded1b4" />
            <Column position={[3.2, 0, -6.2]} height={3.9} radius={0.26} color="#ded1b4" />

            {/* Fakler */}
            <Torch position={[-4.6, 0, -7.4]} height={2} />
            <Torch position={[4.6, 0, -7.4]} height={2} />
            <Torch position={[-4.6, 0, -1.4]} height={2} />
            <Torch position={[4.6, 0, -1.4]} height={2} />

            {/* Senga med den døende kongen */}
            <group>
                <mesh position={[0, 0.25, -4.6]} castShadow receiveShadow>
                    <boxGeometry args={[3.2, 0.5, 1.9]} />
                    <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.64, -4.6]} castShadow>
                    <boxGeometry args={[3, 0.28, 1.75]} />
                    <meshStandardMaterial color="#e8ddc4" roughness={0.95} />
                </mesh>
                {/* Kongen: kropp, teppe, pute og hode */}
                <mesh position={[0.2, 0.95, -4.6]} castShadow>
                    <boxGeometry args={[2.2, 0.34, 0.78]} />
                    <meshStandardMaterial color="#c9a15a" roughness={0.85} />
                </mesh>
                <mesh position={[0.35, 1.18, -4.6]} castShadow>
                    <boxGeometry args={[1.9, 0.12, 0.86]} />
                    <meshStandardMaterial color="#8c2f39" roughness={0.9} />
                </mesh>
                <mesh position={[0.95, 1.16, -4.15]} castShadow>
                    <boxGeometry args={[0.72, 0.13, 0.14]} />
                    <meshStandardMaterial color="#e0b98c" roughness={0.85} />
                </mesh>
                <mesh position={[-1.15, 0.88, -4.6]} castShadow>
                    <boxGeometry args={[0.66, 0.2, 0.7]} />
                    <meshStandardMaterial color="#f2ead5" roughness={0.95} />
                </mesh>
                <mesh position={[-1.15, 1.21, -4.6]} castShadow>
                    <sphereGeometry args={[0.23, 16, 16]} />
                    <meshStandardMaterial color="#e0b98c" roughness={0.8} />
                </mesh>
                {/* Diademet: det eneste som forteller at dette er en konge */}
                <mesh position={[-1.15, 1.3, -4.6]} castShadow>
                    <cylinderGeometry args={[0.225, 0.225, 0.07, 16]} />
                    <meshStandardMaterial
                        color="#e3b23c"
                        emissive="#e3b23c"
                        emissiveIntensity={0.35}
                        roughness={0.35}
                        metalness={0.6}
                    />
                </mesh>
            </group>

            {/* Bordet med vinkrukka */}
            <mesh position={[2.1, 0.34, -3.3]} castShadow receiveShadow>
                <boxGeometry args={[0.85, 0.68, 0.85]} />
                <meshStandardMaterial color="#5d4327" roughness={0.9} />
            </mesh>
            <mesh position={[2.1, 0.9, -3.3]} castShadow>
                <sphereGeometry args={[0.24, 16, 16]} />
                <meshStandardMaterial color="#3f4c63" roughness={0.6} />
            </mesh>
            <mesh position={[2.1, 1.14, -3.3]} castShadow>
                <cylinderGeometry args={[0.11, 0.14, 0.16, 12]} />
                <meshStandardMaterial color="#3f4c63" roughness={0.6} />
            </mesh>

            {/* Legene som våker */}
            <Person position={[-2.2, 0, -3.9]} rotation={[0, 0.7, 0]} body="#e6e0d0" legs="#4a4238" />
            <Person position={[2.9, 0, -4.6]} rotation={[0, -0.8, 0]} body="#d8d0bd" legs="#4a4238" />

            {/* Prosesjonen: soldatene får gå forbi senga */}
            {ben.map((leg, i) => {
                const venstre = leg % 2 === 0;
                const z = -2.0 - i * 0.5;
                return (
                    <Mover
                        key={`${i}-${leg}`}
                        from={venstre ? [-4.6, 0, z] : [4.6, 0, z]}
                        to={venstre ? [4.6, 0, z] : [-4.6, 0, z]}
                        speed={0.9 + i * 0.12}
                        phase={i}
                        onArrive={() => snu(i)}
                    >
                        <Person pose="walk" body="#7a4a3a" hat="helmet" hatColor="#9a8b5a" />
                    </Mover>
                );
            })}

            {/* Tåka fra sumpene utenfor portåpningen */}
            <Particles preset="dust" count={44} center={[0, 0, -11]} area={[8, 4]} height={4} />

            {/* Tegnene og ryktene eleven kan klikke */}
            {tegn.map((t) => (
                <group key={t.key}>
                    <group position={t.pos}>
                        <GlowHalo
                            color={t.kind === 'obs' ? '#fbbf24' : '#fb7185'}
                            size={0.85}
                            opacity={0.35}
                        />
                    </group>
                    <Hotspot
                        position={t.pos}
                        radius={0.42}
                        color={t.kind === 'obs' ? '#f59e0b' : '#e11d48'}
                        label={t.kind === 'obs' ? t.label : 'Rykte'}
                        onSelect={() => onPick(t)}
                        sound={null}
                    />
                </group>
            ))}

            <Burst position={[0, 1.9, -4.6]} trigger={burst} color="#fcd34d" count={20} />

            <PovCamera position={[0, 1.65, 4.2]} lookAt={[0, 1.05, -4.4]} sway={0.014} bob={0.02} />
        </group>
    );
}

// ── Spillet ─────────────────────────────────────────────────────────────────

const KongedagbokenMG: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [play, setPlay] = useState<Play>('idle');
    const [attempt, setAttempt] = useState(0);
    const [aktive, setAktive] = useState<AktivtTegn[]>([]);
    const [dagbok, setDagbok] = useState<string[]>([]);
    const [rykter, setRykter] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);

    const nedtegnetRef = useRef(0);
    const rykteRef = useRef(0);
    const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const avsluttetRef = useRef(false);

    const visBanner = useCallback((tekst: string) => {
        setBanner(tekst);
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setBanner(null), 3000);
    }, []);

    useEffect(() => {
        return () => {
            if (bannerTimer.current) clearTimeout(bannerTimer.current);
        };
    }, []);

    const avslutt = useCallback(() => {
        if (avsluttetRef.current) return;
        avsluttetRef.current = true;
        const rec = nedtegnetRef.current;
        const ryk = rykteRef.current;
        setAktive([]);
        if (rec >= OBS_MAAL && ryk <= 1) {
            setPlay('won');
            microSfx.play('complete');
            onComplete({ score: Math.min(1, rec / OBS_TOTALT), completed: true });
        } else {
            setPlay('lost');
            microSfx.play('incorrect');
        }
    }, [onComplete]);

    // Sanntids-teller. Vi måler faktisk forløpt tid i stedet for å telle ned i
    // et intervall: på en Chromebook med 3D-scenen i gang sklir et 100 ms-
    // intervall ut, og dagtelleren ville da henge etter tegnene i manuset.
    const [gaatt, setGaatt] = useState(0);
    useEffect(() => {
        if (play !== 'playing') return;
        const t0 = performance.now();
        const iv = setInterval(() => setGaatt((performance.now() - t0) / 1000), 200);
        return () => clearInterval(iv);
    }, [play, attempt]);

    // Tegnene dukker opp etter manus og forsvinner igjen om de ikke blir sett.
    useEffect(() => {
        if (play !== 'playing') return;
        const timers: ReturnType<typeof setTimeout>[] = [];
        let rykteNr = 0;
        SCRIPT.forEach((ev, i) => {
            const nr = ev.kind === 'rykte' ? rykteNr++ : 0;
            timers.push(
                setTimeout(() => {
                    setAktive((a) => [...a, { ...ev, key: i, rykteNr: nr }]);
                    visBanner(
                        ev.kind === 'obs'
                            ? `Nytt tegn: ${ev.label}`
                            : RYKTE_TEKST[nr % RYKTE_TEKST.length]
                    );
                    timers.push(
                        setTimeout(() => {
                            setAktive((a) => a.filter((m) => m.key !== i));
                        }, ev.life * 1000)
                    );
                }, ev.at * 1000)
            );
        });
        timers.push(setTimeout(avslutt, SLUTT * 1000));
        return () => timers.forEach(clearTimeout);
    }, [play, attempt, visBanner, avslutt]);

    const velg = useCallback(
        (t: AktivtTegn) => {
            setAktive((a) => a.filter((m) => m.key !== t.key));
            if (t.kind === 'obs') {
                nedtegnetRef.current += 1;
                setDagbok((d) => [...d, t.label]);
                setBurst((b) => b + 1);
                microSfx.play('correct');
                visBanner(`Nedtegnet: ${t.label}`);
            } else {
                rykteRef.current += 1;
                setRykter((r) => r + 1);
                microSfx.play('incorrect');
                visBanner('Du skrev ned et rykte. Ingen av dere så det skje.');
            }
        },
        [visBanner]
    );

    const start = useCallback(() => {
        nedtegnetRef.current = 0;
        rykteRef.current = 0;
        setDagbok([]);
        setRykter(0);
        setAktive([]);
        setBanner(null);
        setBurst(0);
        setAttempt((a) => a + 1);
        setGaatt(0);
        avsluttetRef.current = false;
        setPlay('playing');
        microSfx.play('advance');
    }, []);

    const nullstill = useCallback(() => {
        nedtegnetRef.current = 0;
        rykteRef.current = 0;
        setDagbok([]);
        setRykter(0);
        setAktive([]);
        setBanner(null);
        setBurst(0);
        setAttempt((a) => a + 1);
        setGaatt(0);
        avsluttetRef.current = false;
        setPlay('idle');
    }, []);

    const dag = useMemo(
        () => Math.min(DAGER, 1 + Math.floor(gaatt / (SLUTT / DAGER))),
        [gaatt]
    );

    // DEV-luke for selvspill-verifisering: eksponerer nøyaktig det eleven ser
    // (hvilke tegn som lyser nå, og om de er gule eller røde), slik at en bot
    // kan spille både blindt og seende og vise at balansen holder.
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const w = window as unknown as { __kongedagbokenDebug?: unknown };
        w.__kongedagbokenDebug = {
            play,
            aktive: aktive.map((a) => ({ key: a.key, kind: a.kind, label: a.label })),
            nedtegnet: dagbok.length,
            rykter,
            start,
            pick: (key: number) => {
                const t = aktive.find((a) => a.key === key);
                if (t) velg(t);
            },
        };
        return () => {
            delete w.__kongedagbokenDebug;
        };
    }, [play, aktive, dagbok.length, rykter, start, velg]);

    return (
        <MicroGameScaffold
            title="Kongedagboken"
            subtitle="Babylon, juni 323 fvt. Du fører dagboken ved kong Aleksanders seng. Klikk de gule tegnene du ser. La de røde ryktene være."
            estimatedSeconds={130}
            onRetry={nullstill}
            scene={
                <Sovekammer key={attempt} tegn={aktive} onPick={velg} burst={burst} />
            }
            canvas={{
                controls: false,
                camera: { position: [0, 1.65, 4.2], fov: 60 },
                background: '#4a3a52',
                fog: { color: '#4a3a52', near: 14, far: 34 },
                light: 'twilight',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Dag', value: dag, unit: `/11` },
                            {
                                label: 'Nedtegnet',
                                value: dagbok.length,
                                unit: `/${OBS_TOTALT}`,
                            },
                            { label: 'Rykter', value: rykter },
                        ]}
                    />
                    <SceneBadge corner="br">Babylon, 323 fvt</SceneBadge>
                    <DragHint show={play === 'idle'} corner="bc">
                        Klikk gult. Ikke klikk rødt.
                    </DragHint>
                    <DangerVignette level={Math.min(1, rykter / 3)} />
                </>
            }
        >
            {play === 'idle' && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-sm text-slate-700 flex-1 leading-relaxed">
                        I elleve dager ligger kongen syk. Alt du rekker å skrive ned, blir det
                        historikere har å jobbe med i to tusen år. Skriv ned minst {OBS_MAAL} tegn du
                        faktisk ser, og hold ryktene ute av dagboken.
                    </p>
                    <button
                        onClick={start}
                        className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 py-2 text-sm font-bold transition-colors"
                    >
                        Åpne dagboken
                    </button>
                </div>
            )}

            {play === 'playing' && (
                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                        Dagboken din ({dagbok.length} av {OBS_TOTALT} tegn)
                    </p>
                    <div className="flex flex-wrap gap-1.5 min-h-[2.5rem]">
                        {dagbok.length === 0 && (
                            <span className="text-xs text-slate-400">
                                Ingenting nedtegnet ennå. Tegnene forsvinner om du venter for lenge.
                            </span>
                        )}
                        {dagbok.map((d) => (
                            <span
                                key={d}
                                className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold"
                            >
                                {d}
                            </span>
                        ))}
                        {rykter > 0 && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
                                {rykter} rykte{rykter > 1 ? 'r' : ''} kom med i dagboken
                            </span>
                        )}
                    </div>
                </div>
            )}

            {play === 'won' && (
                <WinScreen title="Dagboken er den beste kilden vi har" onReplay={nullstill}>
                    Du fikk med {dagbok.length} av {OBS_TOTALT} tegn
                    {rykter === 0 ? ' og holdt ryktene helt ute' : ', og bare ett rykte slapp inn'}.
                    Likevel har dagboken hull, og de eldste beskrivelsene vi kjenner ble skrevet
                    flere hundre år etter at kongen døde. Derfor kan ingen lege i dag stille en
                    sikker diagnose.
                </WinScreen>
            )}

            {play === 'lost' && (
                <LoseScreen
                    title={
                        rykteRef.current > 1
                            ? 'Dagboken din er full av rykter'
                            : 'For mye gikk tapt'
                    }
                    onRetry={nullstill}
                >
                    {rykteRef.current > 1
                        ? 'Du skrev ned det folk sa, ikke det du så. Nettopp slik oppsto forgiftningshistoriene som fulgte Aleksander i to tusen år.'
                        : `Du rakk bare ${dagbok.length} av ${OBS_TOTALT} tegn. En kilde med så store hull kan ikke avgjøre noe. Prøv igjen og se hvor fort tegnene forsvinner.`}
                </LoseScreen>
            )}
        </MicroGameScaffold>
    );
};

export default KongedagbokenMG;
