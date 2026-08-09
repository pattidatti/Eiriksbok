import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MicroGameScaffold,
    GroundPlane,
    Hill,
    Rock,
    Wall,
    Building,
    Banner,
    Person,
    Tree,
    Particles,
    Interactive,
    Hotspot,
    Burst,
    SceneBanner,
    SceneFact,
    DataReadout,
    DragHint,
    TimerPill,
    MeterBar,
    DangerVignette,
    WinScreen,
    LoseScreen,
    useGameClock,
    useMeter,
    useRandomPulse,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Den irske hungersnøden".
//
// Lyspære-øyeblikket: for å få mat måtte familien gi fra seg jorda. Fra 1847
// nektet loven nødhjelp til alle som leide mer enn et kvart acre, så hjelpen
// som berget livet tok levebrødet i samme grep.
//
// Mekanikken ER poenget: du graver i en åker der du ikke ser hva som er råttent
// før spaden er i jorda, tørråten sprer seg mens du graver, og sulten stiger
// uansett. Til slutt står valget mellom å holde ut på egen jord eller melde seg
// til nødhjelpen og miste den.

const RUNDE_SEKUNDER = 70;
const SULT_START = 0.22;
const SULT_PER_SEKUND = 0.028;
const GOD_POTET_LETTELSE = 0.2;
const RAATTEN_STRAFF = 0.02;
const GRAVETID_MS = 750;
// Under dette nivået er sulten ennå ikke ille nok til at familien går til
// fattighuset. Over det dukker nødhjelpen opp som et reelt valg.
const NODHJELP_TERSKEL = 0.62;

type Status = 'frisk' | 'raatten' | 'god-gravd' | 'raatten-gravd';
type Fase = 'playing' | 'won-jord' | 'won-nodhjelp' | 'lost';

interface Plante {
    id: number;
    x: number;
    z: number;
    // Sann = det ligger spiselige poteter under. Eleven ser det ikke før hen graver.
    god: boolean;
    status: Status;
}

// Fast mønster: 8 av 24 ruter har spiselige poteter. Modulnivå, så ingen
// tilfeldighet kjøres under render.
const GODT_MONSTER = [
    false, true, false, false, true, false, false, true, false, false, false, true, false, true,
    false, false, true, false, false, true, false, false, true, false,
];

const KOLONNER = 6;
const RADER = 4;

function lagAaker(forsok: number): Plante[] {
    const ut: Plante[] = [];
    for (let i = 0; i < KOLONNER * RADER; i++) {
        const kol = i % KOLONNER;
        const rad = Math.floor(i / KOLONNER);
        ut.push({
            id: i,
            x: (kol - (KOLONNER - 1) / 2) * 1.75,
            z: (rad - (RADER - 1) / 2) * 1.75 - 1,
            // Mønsteret roterer med forsøket, så det ikke går an å pugge kartet.
            god: GODT_MONSTER[(i + forsok * 5) % GODT_MONSTER.length],
            status: 'frisk',
        });
    }
    return ut;
}

// ---------- 3D: én potetplante ----------

function Potetplante({ status }: { status: Status }) {
    const gravd = status === 'god-gravd' || status === 'raatten-gravd';
    const raatten = status === 'raatten' || status === 'raatten-gravd';
    const lov = raatten ? '#4a4034' : '#4f7a3a';

    return (
        <group>
            {/* Jordvollen planta står i. Bunnen ligger på bakkenivå. */}
            <mesh position={[0, 0.07, 0]} receiveShadow>
                <cylinderGeometry args={[0.58, 0.68, 0.14, 10]} />
                <meshStandardMaterial color={gravd ? '#4a3b2c' : '#6b563e'} roughness={1} />
            </mesh>

            {gravd ? (
                // Gravd opp: et hull med det du fant liggende ved siden av.
                <>
                    <mesh position={[0, 0.15, 0]}>
                        <cylinderGeometry args={[0.32, 0.26, 0.06, 10]} />
                        <meshStandardMaterial color="#2f2519" roughness={1} />
                    </mesh>
                    {[
                        [0.3, 0.19, 0.22],
                        [-0.26, 0.19, 0.3],
                        [0.05, 0.19, -0.32],
                    ].map((p, i) => (
                        <mesh key={i} position={p as [number, number, number]} castShadow>
                            <sphereGeometry args={[0.16, 10, 8]} />
                            <meshStandardMaterial
                                color={status === 'god-gravd' ? '#d8b169' : '#2b2620'}
                                roughness={0.85}
                            />
                        </mesh>
                    ))}
                </>
            ) : (
                // Står ennå: en liten busk. Frisk er grønn, angrepet er svartbrun og slapp.
                <>
                    {[
                        [0, 0.32, 0, 0.3],
                        [0.26, 0.26, 0.16, 0.24],
                        [-0.24, 0.25, -0.14, 0.23],
                        [0.08, 0.24, -0.28, 0.21],
                    ].map((b, i) => (
                        <mesh
                            key={i}
                            position={[b[0], raatten ? b[1] * 0.6 : b[1], b[2]]}
                            castShadow
                        >
                            <sphereGeometry args={[b[3], 10, 8]} />
                            <meshStandardMaterial color={lov} roughness={0.95} />
                        </mesh>
                    ))}
                </>
            )}
        </group>
    );
}

// ---------- Spillet ----------

export default function Vinteren1847({ onComplete }: MicroGameProps) {
    const [fase, setFase] = useState<Fase>('playing');
    const [forsok, setForsok] = useState(0);
    const [planter, setPlanter] = useState<Plante[]>(() => lagAaker(0));
    const [graver, setGraver] = useState<number | null>(null);
    const [funn, setFunn] = useState(0);
    const [funnSted, setFunnSted] = useState<[number, number, number]>([0, 0.6, 0]);
    const [maaltider, setMaaltider] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Klikk en potetplante for å grave den opp. Du ser ikke hva som ligger under før spaden er i jorda.'
    );

    const planterRef = useRef(planter);
    const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const graveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        planterRef.current = planter;
    }, [planter]);

    useEffect(
        () => () => {
            if (bannerTimer.current) clearTimeout(bannerTimer.current);
            if (graveTimer.current) clearTimeout(graveTimer.current);
        },
        []
    );

    const si = useCallback((melding: string) => {
        setBanner(melding);
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setBanner(null), 3200);
    }, []);

    const sult = useMeter({
        initial: SULT_START,
        drainPerSecond: 0,
        overloadAt: 1,
        onOverload: () => setFase('lost'),
    });

    const klokke = useGameClock({
        seconds: RUNDE_SEKUNDER,
        running: fase === 'playing',
        onExpire: () => setFase('won-jord'),
    });

    // Sulten stiger uansett hva eleven gjør. Verdenen venter ikke.
    // NB: bind effekten til sult.add (stabil callback), ikke til hele sult-objektet.
    // Objektet er nytt ved hver render, og da ville intervallet blitt startet på
    // nytt før det rakk å telle.
    const leggTilSult = sult.add;
    useEffect(() => {
        if (fase !== 'playing') return;
        const t = setInterval(() => leggTilSult(SULT_PER_SEKUND * 0.1), 100);
        return () => clearInterval(t);
    }, [fase, leggTilSult]);

    // Tørråten sprer seg. Den tar helst de plantene som ennå har mat under seg,
    // så det koster å nøle.
    useRandomPulse({
        running: fase === 'playing',
        minDelayMs: 4500,
        maxDelayMs: 7000,
        onPulse: () => {
            const staaende = planterRef.current.filter((p) => p.status === 'frisk');
            if (staaende.length === 0) return;
            const gode = staaende.filter((p) => p.god);
            const maal = (gode.length > 0 ? gode : staaende)[
                Math.floor(Math.random() * (gode.length > 0 ? gode.length : staaende.length))
            ];
            setPlanter((prev) =>
                prev.map((p) => (p.id === maal.id ? { ...p, status: 'raatten' } : p))
            );
            si('Tørråten sprer seg. Enda en rad ble svart over natta.');
        },
    });

    const grav = useCallback(
        (plante: Plante) => {
            if (fase !== 'playing') return;
            if (graver !== null) return;
            if (plante.status !== 'frisk' && plante.status !== 'raatten') return;

            setGraver(plante.id);
            si('Du graver ...');
            graveTimer.current = setTimeout(() => {
                const naa = planterRef.current.find((p) => p.id === plante.id);
                const spiselig = naa ? naa.god && naa.status === 'frisk' : false;
                setPlanter((prev) =>
                    prev.map((p) =>
                        p.id === plante.id
                            ? { ...p, status: spiselig ? 'god-gravd' : 'raatten-gravd' }
                            : p
                    )
                );
                if (spiselig) {
                    sult.add(-GOD_POTET_LETTELSE);
                    setMaaltider((m) => m + 1);
                    setFunnSted([plante.x, 0.7, plante.z]);
                    setFunn((n) => n + 1);
                    microSfx.play('correct');
                    si('Friske poteter! Familien får et måltid.');
                } else {
                    sult.add(RAATTEN_STRAFF);
                    microSfx.play('incorrect');
                    si('Råttent. Bare svart grøt under jorda, og tiden er tapt.');
                }
                setGraver(null);
            }, GRAVETID_MS);
        },
        [fase, graver, si, sult]
    );

    const taNodhjelp = useCallback(() => {
        if (fase !== 'playing') return;
        microSfx.play('complete');
        setFase('won-nodhjelp');
    }, [fase]);

    useEffect(() => {
        if (fase === 'won-jord') {
            microSfx.play('complete');
            onComplete({ score: 1, completed: true });
        } else if (fase === 'won-nodhjelp') {
            onComplete({ score: 0.7, completed: true });
        }
    }, [fase, onComplete]);

    const nullstill = useCallback(() => {
        const neste = forsok + 1;
        setForsok(neste);
        setPlanter(lagAaker(neste));
        setGraver(null);
        setFunn(0);
        setMaaltider(0);
        setFase('playing');
        sult.reset();
        klokke.restart();
        setBanner('Ny vinter. Klikk en potetplante for å grave.');
    }, [forsok, klokke, sult]);

    const staaende = planter.filter((p) => p.status === 'frisk' || p.status === 'raatten').length;
    const nodhjelpApen = fase === 'playing' && sult.value >= NODHJELP_TERSKEL;
    const jordaTapt = fase === 'won-nodhjelp';

    // DEV: eksponer tilstanden for selvspill-testing. Samme informasjon som
    // eleven ser på måleren, klokka og tellerne. Skrives i en effekt (ikke under
    // render) — å endre window mens komponenten rendrer er en uren render.
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const w = window as unknown as { __vinteren1847Debug?: unknown };
        w.__vinteren1847Debug = {
            fase,
            sult: sult.value,
            sekunderIgjen: klokke.remaining,
            maaltider,
            staaende,
            nodhjelpApen,
        };
        return () => {
            delete w.__vinteren1847Debug;
        };
    }, [fase, sult.value, klokke.remaining, maaltider, staaende, nodhjelpApen]);

    return (
        <MicroGameScaffold
            title="Vinteren 1847"
            subtitle="Grav opp poteter og hold familien i live. Det meste under jorda er råttent."
            estimatedSeconds={150}
            onRetry={nullstill}
            scene={
                <GaardScene
                    key={forsok}
                    planter={planter}
                    graver={graver}
                    funn={funn}
                    funnSted={funnSted}
                    nodhjelpApen={nodhjelpApen}
                    jordaTapt={jordaTapt}
                    onGrav={grav}
                    onNodhjelp={taNodhjelp}
                />
            }
            canvas={{
                camera: { position: [0, 13.5, 18], fov: 44 },
                target: [0, 0.7, -2.4],
                background: '#c3cbd0',
                fog: { color: '#ccd3d7', near: 34, far: 78 },
                light: 'overcast',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Måltider', value: maaltider },
                            { label: 'Planter igjen', value: staaende },
                        ]}
                    />
                    <TimerPill
                        seconds={klokke.remaining}
                        label="Til våren"
                        warnBelow={15}
                        corner="br"
                    />
                    <DragHint show={fase === 'playing' && maaltider === 0} corner="bc">
                        Klikk en plante i åkeren
                    </DragHint>
                    <DangerVignette level={fase === 'playing' ? Math.max(0, sult.value - 0.5) * 2 : 0} />
                </>
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={sult.value}
                    label="Sult i huset"
                    hint="Sulten stiger hele tiden. Friske poteter setter den ned, råtne koster deg bare tid."
                    warnAt={NODHJELP_TERSKEL}
                    dangerAt={0.82}
                    labels={{ normal: 'Vi klarer oss', warn: 'Barna er svake', danger: 'KRITISK!' }}
                />
                {nodhjelpApen && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                        Fattighuset har åpnet porten. Klikk det gule merket ved bygningen til høyre
                        for å melde familien til nødhjelp. Men loven fra 1847 gir bare mat til den
                        som leier mindre enn et kvart acre, så du må gi fra deg jorda.
                    </p>
                )}
                {fase === 'won-jord' && (
                    <WinScreen title="Familien kom seg gjennom vinteren på egen jord" onReplay={nullstill}>
                        Du fant {maaltider} måltid{maaltider === 1 ? '' : 'er'} i en åker som stort
                        sett var svart, og beholdt jorda. Svært få klarte dette. For de aller fleste
                        var det motsatte valget det eneste som fantes.
                    </WinScreen>
                )}
                {fase === 'won-nodhjelp' && (
                    <WinScreen title="Dere fikk mat, men jorda er borte" onReplay={nullstill}>
                        Familien overlevde vinteren. Prisen var jordlappen dere levde av, og uten
                        jord fantes ingen ny høst å vente på. Slik virket regelen om et kvart acre i
                        praksis: hjelpen som berget livet, tok levebrødet i samme grep.
                    </WinScreen>
                )}
                {fase === 'lost' && (
                    <LoseScreen title="Sulten tok familien" onRetry={nullstill}>
                        Du rakk {maaltider} måltid{maaltider === 1 ? '' : 'er'}. Å grave tar tid, og
                        tørråten tar de friske plantene mens du står bøyd over en råtten. Grav
                        raskere, og meld dere til nødhjelpen før sulten blir kritisk.
                    </LoseScreen>
                )}
                <SceneFact>
                    Fattigloven ble endret i juni 1847. En regel kalt kvart-acre-regelen nektet
                    nødhjelp til alle som leide mer enn et kvart acre jord. Historikeren Peter Gray
                    peker på at regelen gjorde det lettere for godseierne å kaste folk ut, og at
                    hundretusener døde av feber, sykdom og sult i fattighusene i årene 1847 til 1850.
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
}

// ---------- Scenen ----------

function GaardScene({
    planter,
    graver,
    funn,
    funnSted,
    nodhjelpApen,
    jordaTapt,
    onGrav,
    onNodhjelp,
}: {
    planter: Plante[];
    graver: number | null;
    funn: number;
    funnSted: [number, number, number];
    nodhjelpApen: boolean;
    jordaTapt: boolean;
    onGrav: (p: Plante) => void;
    onNodhjelp: () => void;
}) {
    const aakerFarge = jordaTapt ? '#7a746a' : '#5f7345';
    const gressFarge = jordaTapt ? '#8a8478' : '#6f8a4e';

    // Steingjerdet rundt jordlappen. Fire sider, alle med bunnen på bakken.
    const gjerde = useMemo(
        () => [
            { pos: [0, 0, 3.4] as [number, number, number], rot: undefined, len: 11.5 },
            { pos: [0, 0, -5.6] as [number, number, number], rot: undefined, len: 11.5 },
            {
                pos: [-5.75, 0, -1.1] as [number, number, number],
                rot: [0, Math.PI / 2, 0] as [number, number, number],
                len: 9,
            },
            {
                pos: [5.75, 0, -1.1] as [number, number, number],
                rot: [0, Math.PI / 2, 0] as [number, number, number],
                len: 9,
            },
        ],
        []
    );

    return (
        <group>
            <GroundPlane size={54} depth={44} color={gressFarge} />

            {/* Selve jordlappen: en mørkere flate innenfor steingjerdet. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -1.1]} receiveShadow>
                <planeGeometry args={[11.5, 9]} />
                <meshStandardMaterial color={aakerFarge} roughness={1} />
            </mesh>

            {gjerde.map((g, i) => (
                <Wall
                    key={i}
                    position={g.pos}
                    rotation={g.rot}
                    length={g.len}
                    height={0.55}
                    thickness={0.3}
                    color="#8f8b80"
                />
            ))}

            {/* Åsene i bakgrunnen. Irsk lavland med lave, våte høyder. */}
            <Hill position={[-7, 0, -13]} radius={4.4} height={2.2} color="#63784a" seed={2} />
            <Hill position={[1, 0, -14.5]} radius={5} height={2.7} color="#5b7044" seed={6} />
            <Hill position={[8, 0, -13]} radius={4.2} height={2} color="#63784a" seed={9} />
            <Rock position={[-8.6, 0, 5.4]} color="#8d8a82" scale={1.1} />
            <Rock position={[8.4, 0, 5.8]} color="#8d8a82" scale={0.9} />

            {/* Husmannsstua med familien utenfor. */}
            <group position={[-7.6, 0, 3.4]}>
                <Building body="#8b8375" roof="#4f4336" w={2.1} h={1.5} d={1.8} />
                <Person position={[1.5, 0, 0.9]} body="#6b5a45" legs="#4a3f31" skin="#e0b48c" />
                <Person
                    position={[2.1, 0, 1.4]}
                    scale={0.72}
                    body="#7a6a52"
                    legs="#4a3f31"
                    skin="#e0b48c"
                />
                <Tree position={[-1.7, 0, 1.2]} leaf="#4e6b3c" seed={4} />
            </group>

            {/* Fattighuset. Stort, kaldt og på andre siden av gjerdet. */}
            <group position={[8, 0, -4.4]}>
                <Building body="#9a958c" roof="#4a4640" w={2.8} h={2.5} d={2.3} />
                <Banner position={[-1.9, 0, 1.5]} color="#b45309" height={2.4} />
                <Person position={[-1.5, 0, 2.3]} body="#4b4b52" legs="#33333a" skin="#e0b48c" />
            </group>

            {/* Åkeren: hver plante er et eget klikkmål med romslig gripeflate. */}
            {planter.map((p) => {
                const ferdig = p.status === 'god-gravd' || p.status === 'raatten-gravd';
                return (
                    <Interactive
                        key={p.id}
                        position={[p.x, 0, p.z]}
                        onSelect={() => onGrav(p)}
                        disabled={ferdig || graver !== null}
                        state={
                            graver === p.id
                                ? 'selected'
                                : p.status === 'god-gravd'
                                  ? 'correct'
                                  : p.status === 'raatten-gravd'
                                    ? 'wrong'
                                    : undefined
                        }
                        hitArea={ferdig ? undefined : [1.5, 1.2, 1.5]}
                    >
                        <Potetplante status={p.status} />
                    </Interactive>
                );
            })}

            {/* Porten til fattighuset. Åpner seg først når sulten er ille nok. */}
            {nodhjelpApen && (
                <Hotspot
                    position={[6.3, 1.7, -3.2]}
                    radius={0.72}
                    label="Meld familien til nødhjelp"
                    onSelect={onNodhjelp}
                />
            )}

            <Burst position={funnSted} trigger={funn} color="#e0b84f" spread={2} />

            {/* Regn og lavt skydekke. Ren dekor - utenfor den mekaniske revisjonen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="rain" area={[40, 34]} height={13} />
            </group>
        </group>
    );
}
