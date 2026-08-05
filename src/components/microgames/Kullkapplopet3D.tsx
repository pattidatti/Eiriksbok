import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MicroGameScaffold,
    GroundPlane,
    Hill,
    Rock,
    Banner,
    Person,
    Tent,
    Fire,
    Particles,
    Hotspot,
    Mover,
    Burst,
    SceneBanner,
    SceneFact,
    DataReadout,
    DragHint,
    TimerPill,
    MeterBar,
    WinScreen,
    LoseScreen,
    useGameClock,
    useRandomPulse,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Svalbard: øyene ingen eide".
//
// Lyspære-øyeblikket: Svalbard var ingenmannsland. Da kull ble funnet, satte
// selskaper fra flere land opp skilt og krevde felt for seg selv - først til
// mølla. Eleven kjenner kappløpet på kroppen: to lag, lange avstander, og
// rivaler som tar felt mens laget ditt fortsatt går. Rotet som oppstår er
// nettopp grunnen til at landene måtte møtes og lage Svalbardtraktaten.
//
// Mekanikken ER poenget: du rekker ikke alt, så du må velge de store feltene -
// og en tur til et felt noen andre rakk først, er tapt tid du aldri får igjen.

const ROUND_SECONDS = 60;
const TEAM_SPEED = 3.1;
const START_YEAR = 1900;
const END_YEAR = 1920;

type Eier = 'norge' | 'usa' | 'britisk' | 'svensk' | 'russisk';

const EIER_FARGE: Record<Eier, string> = {
    norge: '#c8102e',
    usa: '#2b4a8b',
    britisk: '#1f6b4a',
    svensk: '#e0a800',
    russisk: '#6b3fa0',
};

const RIVALER: { id: Eier; navn: string }[] = [
    { id: 'usa', navn: 'Et amerikansk selskap' },
    { id: 'britisk', navn: 'Et britisk selskap' },
    { id: 'svensk', navn: 'Et svensk selskap' },
    { id: 'russisk', navn: 'Et russisk selskap' },
];

interface Kullfelt {
    id: string;
    navn: string;
    // Hvor mye kull feltet er verdt (1-3). Vises som antall kullknauser.
    verdi: number;
    x: number;
    z: number;
}

// Feltene ligger spredt over Spitsbergen. Leiren til laget ditt ligger sør,
// så de store feltene i nord koster deg mest tid.
const FELT: Kullfelt[] = [
    { id: 'kingsbay', navn: 'Kings Bay', verdi: 3, x: -13, z: -9 },
    { id: 'bohemanflya', navn: 'Bohemanflya', verdi: 1, x: -14, z: -1 },
    { id: 'gronfjorden', navn: 'Grønfjorden', verdi: 3, x: -10, z: 6 },
    { id: 'kolsdalen', navn: 'Kolsdalen', verdi: 1, x: -6, z: -6 },
    { id: 'grumantbyen', navn: 'Grumantbyen', verdi: 2, x: -5, z: 2 },
    { id: 'colesbukta', navn: 'Colesbukta', verdi: 2, x: -1, z: 7 },
    { id: 'longyeardalen', navn: 'Longyeardalen', verdi: 3, x: 0, z: -1 },
    { id: 'adventdalen', navn: 'Adventdalen', verdi: 2, x: 4, z: 4 },
    { id: 'hiorthhamn', navn: 'Hiorthhamn', verdi: 2, x: 5, z: -5 },
    { id: 'pyramiden', navn: 'Pyramiden', verdi: 2, x: 10, z: -9 },
    { id: 'braganza', navn: 'Braganzavågen', verdi: 3, x: 12, z: 2 },
    { id: 'bjorndalen', navn: 'Bjørndalen', verdi: 2, x: 14, z: 8 },
];

const TOTAL_VERDI = FELT.reduce((sum, f) => sum + f.verdi, 0);

interface Lag {
    id: number;
    x: number;
    z: number;
    // Feltet laget er på vei til. Null = laget står stille og venter på ordre.
    maal: { feltId: string; x: number; z: number } | null;
}

const START_LAG: Lag[] = [
    { id: 0, x: -3, z: 13, maal: null },
    { id: 1, x: 3, z: 13, maal: null },
];

function tomtKart(): Record<string, Eier | null> {
    const out: Record<string, Eier | null> = {};
    for (const f of FELT) out[f.id] = null;
    return out;
}

type Fase = 'playing' | 'won' | 'lost';

// ---------- 3D: ett kullfelt ----------

function Kullknaus({ felt, eier }: { felt: Kullfelt; eier: Eier | null }) {
    // Kullet ligger som mørke knauser i snøen. Antall knauser = verdien.
    const knauser: [number, number, number][] = [
        [0, 0, 0],
        [0.85, 0, 0.5],
        [-0.75, 0, 0.55],
    ].slice(0, felt.verdi) as [number, number, number][];
    return (
        <group position={[felt.x, 0, felt.z]}>
            {knauser.map((p, i) => (
                <Rock key={i} position={p} color="#3d4148" scale={1.15} />
            ))}
            {eier && <Banner position={[0, 0, -1.1]} color={EIER_FARGE[eier]} height={2.1} />}
        </group>
    );
}

// ---------- Spillet ----------

export default function Kullkapplopet3D({ onComplete }: MicroGameProps) {
    const [fase, setFase] = useState<Fase>('playing');
    const [forsok, setForsok] = useState(0);
    const [eiere, setEiere] = useState<Record<string, Eier | null>>(tomtKart);
    const [lag, setLag] = useState<Lag[]>(START_LAG);
    const [feiring, setFeiring] = useState(0);
    const [feiringSted, setFeiringSted] = useState<[number, number, number]>([0, 1, 0]);
    const [banner, setBanner] = useState<string | null>(
        'Klikk et kullfelt. Da går laget ditt dit og setter opp skiltet.'
    );

    const eiereRef = useRef(eiere);
    const lagRef = useRef(lag);
    const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        lagRef.current = lag;
    }, [lag]);
    useEffect(
        () => () => {
            if (bannerTimer.current) clearTimeout(bannerTimer.current);
        },
        []
    );

    const settEiere = useCallback(
        (fn: (prev: Record<string, Eier | null>) => Record<string, Eier | null>) => {
            const neste = fn(eiereRef.current);
            eiereRef.current = neste;
            setEiere(neste);
            return neste;
        },
        []
    );

    const si = useCallback((melding: string) => {
        setBanner(melding);
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setBanner(null), 3000);
    }, []);

    const verdiFor = useCallback((kart: Record<string, Eier | null>, eier: Eier | 'rival') => {
        let sum = 0;
        for (const f of FELT) {
            const e = kart[f.id];
            if (!e) continue;
            if (eier === 'rival' ? e !== 'norge' : e === eier) sum += f.verdi;
        }
        return sum;
    }, []);

    const norskVerdi = verdiFor(eiere, 'norge');
    const rivalVerdi = verdiFor(eiere, 'rival');
    const norskeFelt = FELT.filter((f) => eiere[f.id] === 'norge').length;

    const avslutt = useCallback(() => {
        const kart = eiereRef.current;
        let norsk = 0;
        let rival = 0;
        for (const f of FELT) {
            const e = kart[f.id];
            if (e === 'norge') norsk += f.verdi;
            else if (e) rival += f.verdi;
        }
        setFase(norsk > rival ? 'won' : 'lost');
    }, []);

    const klokke = useGameClock({
        seconds: ROUND_SECONDS,
        running: fase === 'playing',
        onExpire: avslutt,
    });

    // Året følger klokka mens runden går. Er runden over, står vi ved 1920 -
    // også når alle feltene ble tatt før tiden løp ut.
    const aar =
        fase === 'playing'
            ? Math.min(
                  END_YEAR,
                  START_YEAR +
                      Math.round((1 - klokke.remaining / ROUND_SECONDS) * (END_YEAR - START_YEAR))
              )
            : END_YEAR;

    // Rivalene setter opp skiltene sine uansett hva eleven gjør. Verdenen
    // venter ikke - det er dette som gjør kappløpet til et kappløp.
    useRandomPulse({
        running: fase === 'playing',
        minDelayMs: 3800,
        maxDelayMs: 6200,
        onPulse: () => {
            const ledige = FELT.filter((f) => !eiereRef.current[f.id]);
            if (ledige.length === 0) return;
            const felt = ledige[Math.floor(Math.random() * ledige.length)];
            const rival = RIVALER[Math.floor(Math.random() * RIVALER.length)];
            const neste = settEiere((prev) => ({ ...prev, [felt.id]: rival.id }));
            si(`${rival.navn} satte opp skiltet sitt på ${felt.navn}.`);
            if (FELT.every((f) => neste[f.id])) avslutt();
        },
    });

    useEffect(() => {
        if (fase === 'won') {
            microSfx.play('complete');
            onComplete({ score: Math.min(1, norskVerdi / TOTAL_VERDI + 0.4), completed: true });
        }
    }, [fase, norskVerdi, onComplete]);

    const framme = useCallback(
        (lagId: number) => {
            const enhet = lagRef.current.find((l) => l.id === lagId);
            const maal = enhet?.maal;
            if (!maal) return;
            setLag((prev) =>
                prev.map((l) => (l.id === lagId ? { ...l, x: maal.x, z: maal.z, maal: null } : l))
            );
            const felt = FELT.find((f) => f.id === maal.feltId);
            if (!felt) return;
            if (eiereRef.current[felt.id]) {
                // Noen rakk fram først. Turen var tapt tid.
                microSfx.play('incorrect');
                si(`For sent. Skiltet sto der alt på ${felt.navn}. Turen var bortkastet.`);
                return;
            }
            const neste = settEiere((prev) => ({ ...prev, [felt.id]: 'norge' }));
            microSfx.play('correct');
            setFeiringSted([felt.x, 1.4, felt.z]);
            setFeiring((n) => n + 1);
            si(`Norsk krav på ${felt.navn}. Kull verdt ${felt.verdi}.`);
            if (FELT.every((f) => neste[f.id])) avslutt();
        },
        [settEiere, si, avslutt]
    );

    const velgFelt = useCallback(
        (felt: Kullfelt) => {
            if (fase !== 'playing') return;
            if (eiereRef.current[felt.id]) return;
            const ledige = lagRef.current.filter((l) => !l.maal);
            if (ledige.length === 0) {
                si('Begge laga er ute på tur. Du må vente til ett av dem er framme.');
                return;
            }
            const naermest = ledige.reduce((best, l) => {
                const d = (l.x - felt.x) ** 2 + (l.z - felt.z) ** 2;
                const bd = (best.x - felt.x) ** 2 + (best.z - felt.z) ** 2;
                return d < bd ? l : best;
            });
            setLag((prev) =>
                prev.map((l) =>
                    l.id === naermest.id
                        ? { ...l, maal: { feltId: felt.id, x: felt.x, z: felt.z + 1.6 } }
                        : l
                )
            );
            si(`Laget går mot ${felt.navn}. Det tar tid over snøen.`);
        },
        [fase, si]
    );

    const nullstill = useCallback(() => {
        setForsok((f) => f + 1);
        settEiere(tomtKart);
        setLag(START_LAG);
        setFeiring(0);
        setFase('playing');
        klokke.restart();
        setBanner('Nytt forsøk. Klikk et kullfelt for å sende laget dit.');
    }, [klokke, settEiere]);

    return (
        <MicroGameScaffold
            title="Kappløpet om kullet"
            subtitle="Svalbard er ingenmannsland. Sikre Norge mest mulig kull før 1920."
            estimatedSeconds={140}
            onRetry={nullstill}
            scene={
                <SvalbardScene
                    key={forsok}
                    eiere={eiere}
                    lag={lag}
                    feiring={feiring}
                    feiringSted={feiringSted}
                    onFelt={velgFelt}
                    onFramme={framme}
                />
            }
            canvas={{
                camera: { position: [0, 26, 38], fov: 44 },
                target: [0, 0.6, 0],
                background: '#dceaf2',
                fog: { color: '#e4eef4', near: 58, far: 130 },
                light: 'arctic',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'År', value: aar },
                            { label: 'Norsk kull', value: `${norskVerdi}/${TOTAL_VERDI}` },
                            { label: 'Andre land', value: `${rivalVerdi}/${TOTAL_VERDI}` },
                        ]}
                    />
                    <TimerPill seconds={klokke.remaining} label="Til 1920" warnBelow={12} corner="br" />
                    <DragHint show={fase === 'playing' && norskeFelt === 0} corner="bc">
                        Klikk et kullfelt i snøen
                    </DragHint>
                </>
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={norskVerdi / TOTAL_VERDI}
                    label="Norsk andel av kullet"
                    hint="Store felt har flere kullknauser og er verdt mest. Laget bruker lang tid over snøen, så velg med omhu."
                    warnAt={0.34}
                    dangerAt={0.5}
                    labels={{ normal: 'Så vidt i gang', warn: 'God andel', danger: 'Flertallet!' }}
                />
                {fase === 'won' && (
                    <WinScreen title="Norge fikk mest kull - men ingen eide øyene" onReplay={nullstill}>
                        Du sikret {norskVerdi} av {TOTAL_VERDI} i kullverdi. Legg merke til kartet:
                        flagg fra fire land side om side, uten en eneste dommer. Nettopp dette rotet
                        er grunnen til at landene møttes i Paris og skrev Svalbardtraktaten i 1920.
                    </WinScreen>
                )}
                {fase === 'lost' && (
                    <LoseScreen title="Andre land tok de største feltene" onRetry={nullstill}>
                        Du fikk {norskVerdi} av {TOTAL_VERDI} i kullverdi. Laget ditt bruker lang tid
                        over snøen, så turer til små felt koster deg de store. Prøv å ta feltene med
                        tre kullknauser først.
                    </LoseScreen>
                )}
                <SceneFact>
                    Kulldrift på Svalbard begynte rundt 1905, og selskaper fra flere land krevde felt
                    for seg selv. Ingen stat styrte øyene, så det fantes ingen å klage til. Derfor
                    ble Svalbardtraktaten forhandlet fram i Paris og undertegnet 9. februar 1920.
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
}

// ---------- Scenen ----------

function SvalbardScene({
    eiere,
    lag,
    feiring,
    feiringSted,
    onFelt,
    onFramme,
}: {
    eiere: Record<string, Eier | null>;
    lag: Lag[];
    feiring: number;
    feiringSted: [number, number, number];
    onFelt: (felt: Kullfelt) => void;
    onFramme: (lagId: number) => void;
}) {
    const ledige = useMemo(() => FELT.filter((f) => !eiere[f.id]), [eiere]);

    return (
        <group>
            <GroundPlane size={140} depth={120} color="#e8eef2" />

            {/* Fjellryggen i nord. Ligger bak alle kullfeltene. */}
            <Hill position={[-11, 0, -16]} radius={5} height={3.4} color="#c3ced6" seed={3} />
            <Hill position={[1, 0, -17]} radius={5.5} height={4} color="#b9c5ce" seed={7} />
            <Hill position={[13, 0, -16]} radius={4.6} height={3.2} color="#c3ced6" seed={11} />
            <Rock position={[-17, 0, 9]} color="#aab6c0" scale={1.6} />
            <Rock position={[17, 0, -13]} color="#aab6c0" scale={1.4} />

            {/* Basecampen i sør, der ekspedisjonene starter. */}
            <Tent position={[0, 0, 14]} color="#c9d4dc" scale={1.1} />
            <Fire position={[2.2, 0, 13.4]} scale={0.8} />
            <Person position={[-2, 0, 13.6]} body="#3d5a80" legs="#2b3a4a" hat="cap" hatColor="#c8102e" />

            {/* Kullfeltene med flagg når de er tatt. */}
            {FELT.map((f) => (
                <Kullknaus key={f.id} felt={f} eier={eiere[f.id] ?? null} />
            ))}

            {/* Klikkmarkør kun på ledige felt - da er det alltid tydelig hva som kan tas. */}
            {ledige.map((f) => (
                <Hotspot
                    key={`hs-${f.id}`}
                    position={[f.x, 1.9, f.z]}
                    radius={0.62}
                    label={`${f.navn} - kull ${f.verdi}`}
                    onSelect={() => onFelt(f)}
                />
            ))}

            {/* Ekspedisjonslaga. De går, og det tar tid. */}
            {lag.map((l) =>
                l.maal ? (
                    <Mover
                        key={`mover-${l.id}-${l.maal.feltId}`}
                        from={[l.x, 0, l.z]}
                        to={[l.maal.x, 0, l.maal.z]}
                        speed={TEAM_SPEED}
                        bob={0.08}
                        phase={l.id}
                        onArrive={() => onFramme(l.id)}
                    >
                        <Person pose="walk" body="#3d5a80" legs="#2b3a4a" hat="cap" hatColor="#c8102e" />
                    </Mover>
                ) : (
                    <Person
                        key={`stille-${l.id}`}
                        position={[l.x, 0, l.z]}
                        body="#3d5a80"
                        legs="#2b3a4a"
                        hat="cap"
                        hatColor="#c8102e"
                    />
                )
            )}

            <Burst position={feiringSted} trigger={feiring} color="#c8102e" spread={2.4} />

            {/* Snødrev. Ren dekor - holdes utenfor den mekaniske scene-revisjonen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="snow" area={[52, 46]} height={12} />
            </group>
        </group>
    );
}
