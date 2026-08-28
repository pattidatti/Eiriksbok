import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MicroGameScaffold,
    THEMES,
    GroundPlane,
    Building,
    Tree,
    Person,
    MarketStall,
    Cart,
    Wall,
    FlatRing,
    InstancedField,
    Particles,
    Draggable,
    Mover,
    Burst,
    SceneBanner,
    SceneFact,
    DataReadout,
    DragHint,
    TimerPill,
    MeterBar,
    ScreenFlash,
    DangerVignette,
    WinScreen,
    LoseScreen,
    useGameClock,
    useMeter,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Livegenskapet i Russland".
//
// Lyspære-øyeblikket: friheten fra 1861 kom med en regning. Bonden måtte kjøpe
// tilbake jorda han allerede dyrket, og innløsningen skulle betales med det
// samme kornet familien skulle leve av.
//
// Mekanikken ER poenget: du drar kornvogna mellom åkeren, skattefuten og huset.
// Rekker du ikke terminen, tar skattefuten en teig av jorda di - og da vokser
// det mindre korn neste år. Gjeldsspiralen er synlig som en åker som krymper.

const t = THEMES.enlightenment;

const TERMINER = 7;
const TERMIN_SEK = 9;
const KAPASITET = 4;
const TERMIN_KRAV = 2; // sekker korn per innløsningstermin
const MAT_KRAV = 2; // sekker korn familien trenger per termin
const START_TEIGER = 6;
const SULT_PER_SEK = 0.019;
const MAT_LETTELSE = 0.24; // per sekk levert til huset

// Åkerteigene. Teig 0 ligger lengst fra tunet og ryker først, så eleven ser
// jorda krympe mot seg selv.
const TEIG_X = [-10, -8.5, -7, -5.5, -4, -2.5];
const TEIG_Z = -3;
const TEIG_BREDDE = 1.2;
const TEIG_LENGDE = 8;

type Stasjon = 'ute' | 'aaker' | 'fut' | 'izba';
type Fase = 'playing' | 'won' | 'lost-jord' | 'lost-sult';

const STASJONER: { id: Stasjon; xz: [number, number] }[] = [
    { id: 'aaker', xz: [-0.6, -3.0] },
    { id: 'fut', xz: [6.5, -3.0] },
    { id: 'izba', xz: [3.0, 3.0] },
];

const SNAP_PUNKTER: [number, number][] = STASJONER.map((s) => s.xz);

// ---------- 3D: én åkerteig ----------

function Teig({ x, eid, seed }: { x: number; eid: boolean; seed: number }) {
    return (
        <group position={[x, 0, TEIG_Z]}>
            {/* Selve jordstykket. Ligger flatt oppå bakken. */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
                <planeGeometry args={[TEIG_BREDDE, TEIG_LENGDE]} />
                <meshStandardMaterial color={eid ? '#8a7433' : '#6b6659'} roughness={1} />
            </mesh>

            {eid ? (
                // Moden rug. Konene står med foten i jorda.
                <InstancedField
                    count={30}
                    area={[TEIG_BREDDE - 0.2, TEIG_LENGDE - 0.4]}
                    y={0.335}
                    minScale={0.95}
                    maxScale={1.05}
                    seed={seed}
                    geometry={<coneGeometry args={[0.09, 0.62, 5]} />}
                    material={<meshStandardMaterial color="#d8b25c" roughness={1} />}
                />
            ) : (
                // Mistet teig: gjerdet er satt opp, og den er ikke din lenger.
                <>
                    <Wall
                        position={[0, 0, -TEIG_LENGDE / 2]}
                        length={TEIG_BREDDE}
                        height={0.5}
                        thickness={0.12}
                        color="#7d7364"
                    />
                    <Wall
                        position={[0, 0, TEIG_LENGDE / 2]}
                        length={TEIG_BREDDE}
                        height={0.5}
                        thickness={0.12}
                        color="#7d7364"
                    />
                </>
            )}
        </group>
    );
}

// ---------- 3D: kornvogna eleven drar ----------

function Kornvogn({ last }: { last: number }) {
    const sekker: [number, number, number][] = [
        [-0.34, 0.92, -0.16],
        [0.06, 0.92, -0.16],
        [-0.34, 0.92, 0.18],
        [0.06, 0.92, 0.18],
    ];
    return (
        <group>
            {/* Romslig usynlig gripeflate - trygg å ta tak i på trackpad. */}
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[2.3, 1.7, 1.9]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            <Cart color="#6e4d2e" wheel="#3a2a18" />
            {sekker.slice(0, last).map((p, i) => (
                <mesh key={i} position={p} castShadow>
                    <sphereGeometry args={[0.18, 10, 8]} />
                    <meshStandardMaterial color="#c9a75c" roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// ---------- 3D: hele tunet ----------

function TunScene({
    teiger,
    last,
    termin,
    onStasjon,
    onLosne,
    tapPos,
    tapTrigger,
}: {
    teiger: number;
    last: number;
    termin: number;
    onStasjon: (id: Stasjon) => void;
    onLosne: () => void;
    tapPos: [number, number, number];
    tapTrigger: number;
}) {
    const forsteEide = START_TEIGER - teiger;

    return (
        <group>
            <GroundPlane size={54} depth={44} color="#7f8a56" />

            {/* Åkeren: seks teiger. De ytterste ryker først. */}
            {TEIG_X.map((x, i) => (
                <Teig key={i} x={x} eid={i >= forsteEide} seed={i + 3} />
            ))}

            {/* Izbaen: huset familien bor i. */}
            <group position={[3.2, 0, 7.0]}>
                <Building body="#7a5a3c" roof="#54432f" w={2.4} h={1.7} d={2.0} seed={2} />
                <Person
                    position={[-1.4, 0, -0.9]}
                    body="#8c5f4a"
                    legs="#4a3a2a"
                    skin="#e6bd93"
                    hat="hood"
                />
                <Person
                    position={[1.3, 0, -0.8]}
                    scale={0.74}
                    body="#a87a52"
                    legs="#4a3a2a"
                    skin="#e6bd93"
                />
            </group>

            {/* Skattefutens bord ved porten. */}
            <group position={[6.8, 0, -5.6]}>
                <MarketStall post="#5c4326" awning="#3f5f7d" awningAlt="#d7cbb0" />
            </group>

            {/* Herregården. Jorda kom herfra, og regningen gjør det også. */}
            <group position={[10.5, 0, -10]}>
                <Building body="#c8bda2" roof="#6b4f3a" w={4.2} h={3.0} d={3.4} seed={5} />
                <Tree position={[-3.2, 0, 1.8]} leaf="#4f6b3a" seed={7} />
            </group>

            {/* Skattefuten går fra herregården mot bordet mens terminen løper.
                Han starter på nytt for hver termin (key), så gangen ER klokka. */}
            <Mover
                key={termin}
                from={[9.8, 0, -8.6]}
                to={[7.6, 0, -2.6]}
                speed={0.71}
                bob={0.06}
                face
            >
                <Person body="#3f4652" legs="#2f333c" skin="#e6bd93" hat="cap" pose="walk" />
            </Mover>

            {/* Merkene eleven kan sette vogna på. */}
            {STASJONER.map((s) => (
                <FlatRing
                    key={s.id}
                    position={[s.xz[0], 0.03, s.xz[1]]}
                    radius={1.5}
                    tube={0.09}
                    color={s.id === 'aaker' ? '#c9a75c' : s.id === 'fut' ? '#5b7f9e' : '#c07d4a'}
                />
            ))}

            {/* Kornvogna: hovedinteraksjonen. Dras mellom de tre merkene. */}
            <Draggable
                position={[2.0, 0, 0.6]}
                bounds={{ minX: -1.8, maxX: 8.8, minZ: -6.6, maxZ: 6.6 }}
                snapPoints={SNAP_PUNKTER}
                snapRadius={2.2}
                onSnap={(i) => onStasjon(STASJONER[i].id)}
                onDragStart={onLosne}
                dropFx="dustPuff"
            >
                <Kornvogn last={last} />
            </Draggable>

            {/* Støvsky der skattefuten tok en teig. */}
            <Burst position={tapPos} trigger={tapTrigger} color="#9c9280" spread={2.4} />

            {/* Ramme og atmosfære. Ren dekor - utenfor den mekaniske revisjonen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Tree position={[-13, 0, 4.5]} leaf="#54703c" seed={1} />
                <Tree position={[-14.5, 0, -7]} leaf="#4c6837" seed={4} />
                <Tree position={[10.5, 0, 6]} leaf="#54703c" seed={9} />
                <Particles preset="leaves" area={[40, 34]} height={11} />
            </group>
        </group>
    );
}

// ---------- Spillet ----------

export default function Innlosningen3D({ onComplete }: MicroGameProps) {
    const [fase, setFase] = useState<Fase>('playing');
    const [teiger, setTeiger] = useState(START_TEIGER);
    const [last, setLast] = useState(0);
    const [termin, setTermin] = useState(1);
    const [betalt, setBetalt] = useState(0);
    const [matet, setMatet] = useState(0);
    const [stasjon, setStasjon] = useState<Stasjon>('ute');
    const [banner, setBanner] = useState<string | null>('Dra kornvogna ut i åkeren og fyll den.');
    const [forsok, setForsok] = useState(0);
    const [tapTrigger, setTapTrigger] = useState(0);
    const [flash, setFlash] = useState(0);

    // Refs som speiler staten, så intervallene under leser ferske verdier.
    const lastRef = useRef(0);
    const teigerRef = useRef(START_TEIGER);
    const stasjonRef = useRef<Stasjon>('ute');
    const betaltRef = useRef(0);
    const materRef = useRef(0);
    const terminRef = useRef(1);
    const fyllRef = useRef(0);

    useEffect(() => {
        lastRef.current = last;
    }, [last]);
    useEffect(() => {
        teigerRef.current = teiger;
    }, [teiger]);
    useEffect(() => {
        stasjonRef.current = stasjon;
    }, [stasjon]);
    useEffect(() => {
        betaltRef.current = betalt;
    }, [betalt]);
    useEffect(() => {
        materRef.current = matet;
    }, [matet]);
    useEffect(() => {
        terminRef.current = termin;
    }, [termin]);

    const spiller = fase === 'playing';

    const sult = useMeter({
        initial: 0.12,
        drainPerSecond: 0,
        overloadAt: 1,
        onOverload: () => setFase('lost-sult'),
    });

    // Terminen forfaller. Skattefuten krever sitt, eller tar en teig.
    const avsluttTermin = useCallback(() => {
        const betaltNok = betaltRef.current >= TERMIN_KRAV;

        if (!betaltNok) {
            const nyeTeiger = teigerRef.current - 1;
            teigerRef.current = nyeTeiger;
            setTeiger(nyeTeiger);
            setTapTrigger((c) => c + 1);
            setFlash((c) => c + 1);
            microSfx.play('incorrect');
            setBanner('Terminen forfalt ubetalt. Skattefuten tok en teig av jorda di.');
            if (nyeTeiger <= 0) {
                setFase('lost-jord');
                return;
            }
        } else {
            microSfx.play('correct');
            setBanner('Terminen er betalt. Neste forfaller om ni sekunder.');
        }

        if (terminRef.current >= TERMINER) {
            setFase('won');
            return;
        }

        setBetalt(0);
        setMatet(0);
        betaltRef.current = 0;
        materRef.current = 0;
        setTermin((n) => n + 1);
    }, []);

    const klokke = useGameClock({
        seconds: TERMIN_SEK,
        running: spiller,
        onExpire: avsluttTermin,
    });

    // Klokka startes på nytt for hver termin.
    useEffect(() => {
        klokke.restart();
        // Kun ved terminskifte - klokke-objektet er stabilt nok her.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [termin, forsok]);

    // useMeter returnerer et nytt objekt hver render. Hold på de stabile
    // callbackene, ellers rives intervallene under ned tolv ganger i sekundet
    // og rekker aldri å fyre.
    const sultAdd = sult.add;
    const sultReset = sult.reset;

    // Sulten stiger så lenge spillet går. Bare mat setter den ned.
    useEffect(() => {
        if (!spiller) return;
        const id = setInterval(() => sultAdd(SULT_PER_SEK * 0.2), 200);
        return () => clearInterval(id);
    }, [spiller, sultAdd]);

    // Vogna fylles mens den står i åkeren. Færre teiger gir tregere fylling.
    useEffect(() => {
        if (!spiller) return;
        const id = setInterval(() => {
            if (stasjonRef.current !== 'aaker') return;
            if (lastRef.current >= KAPASITET) return;
            if (teigerRef.current <= 0) return;
            fyllRef.current += teigerRef.current * 0.075;
            if (fyllRef.current >= 1) {
                const nye = Math.min(
                    KAPASITET,
                    lastRef.current + Math.floor(fyllRef.current)
                );
                fyllRef.current -= Math.floor(fyllRef.current);
                lastRef.current = nye;
                setLast(nye);
                microSfx.play('pick');
            }
        }, 250);
        return () => clearInterval(id);
    }, [spiller]);

    const losne = useCallback(() => {
        stasjonRef.current = 'ute';
        setStasjon('ute');
    }, []);

    // Vogna er satt på et merke. Levering skjer med én gang.
    const settPaaStasjon = useCallback((id: Stasjon) => {
        stasjonRef.current = id;
        setStasjon(id);
        fyllRef.current = 0;

        if (id === 'aaker') {
            setBanner('Vogna fylles. Jo flere teiger du har igjen, jo raskere går det.');
            return;
        }

        if (id === 'fut') {
            const trengs = Math.max(0, TERMIN_KRAV - betaltRef.current);
            const gir = Math.min(lastRef.current, trengs);
            if (gir <= 0) {
                setBanner(
                    trengs === 0
                        ? 'Terminen er alt betalt. Kjør heller korn hjem til huset.'
                        : 'Vogna er tom. Fyll den i åkeren først.'
                );
                return;
            }
            betaltRef.current += gir;
            lastRef.current -= gir;
            setBetalt(betaltRef.current);
            setLast(lastRef.current);
            microSfx.play('drop');
            setBanner(
                betaltRef.current >= TERMIN_KRAV
                    ? 'Innløsningen for denne terminen er betalt.'
                    : `Skattefuten mangler ${TERMIN_KRAV - betaltRef.current} sekk til.`
            );
            return;
        }

        // izba
        const trengsHjemme = Math.max(0, MAT_KRAV - materRef.current);
        const gir = Math.min(lastRef.current, trengsHjemme);
        if (gir <= 0) {
            setBanner(
                trengsHjemme === 0
                    ? 'Huset har fått nok denne terminen.'
                    : 'Vogna er tom. Fyll den i åkeren først.'
            );
            return;
        }
        materRef.current += gir;
        lastRef.current -= gir;
        setMatet(materRef.current);
        setLast(lastRef.current);
        sultAdd(-MAT_LETTELSE * gir);
        microSfx.play('correct');
        setBanner('Familien har mat. Men kornet gikk ikke til innløsningen.');
    }, [sultAdd]);

    const nullstill = useCallback(() => {
        lastRef.current = 0;
        teigerRef.current = START_TEIGER;
        stasjonRef.current = 'ute';
        betaltRef.current = 0;
        materRef.current = 0;
        terminRef.current = 1;
        fyllRef.current = 0;
        setLast(0);
        setTeiger(START_TEIGER);
        setStasjon('ute');
        setBetalt(0);
        setMatet(0);
        setTermin(1);
        setBanner('Dra kornvogna ut i åkeren og fyll den.');
        setFase('playing');
        sultReset();
        setForsok((f) => f + 1);
    }, [sultReset]);

    // Meld fra til læringssystemet når spillet er vunnet.
    const meldtRef = useRef(false);
    useEffect(() => {
        if (fase === 'won' && !meldtRef.current) {
            meldtRef.current = true;
            onComplete({ score: teiger / START_TEIGER, completed: true });
        }
    }, [fase, teiger, onComplete]);

    const tapPos = useMemo<[number, number, number]>(() => {
        const i = Math.min(TEIG_X.length - 1, Math.max(0, START_TEIGER - teiger - 1));
        return [TEIG_X[i], 0.6, TEIG_Z];
    }, [teiger]);

    const aarstall = 1861 + (termin - 1);

    return (
        <MicroGameScaffold
            title="Innløsningen"
            subtitle="Du er fri fra 1861. Nå skal jorda betales. Dra kornvogna dit den trengs mest."
            estimatedSeconds={110}
            onRetry={nullstill}
            scene={
                <TunScene
                    key={forsok}
                    teiger={teiger}
                    last={last}
                    termin={termin}
                    onStasjon={settPaaStasjon}
                    onLosne={losne}
                    tapPos={tapPos}
                    tapTrigger={tapTrigger}
                />
            }
            canvas={{
                camera: { position: [2, 21, 24], fov: 42 },
                target: [-0.8, 0.4, -0.4],
                background: t.sky,
                fog: { color: t.fog, near: 44, far: 92 },
                light: 'golden',
                idle: false,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'År', value: aarstall },
                            { label: 'Teiger igjen', value: teiger },
                            { label: 'Korn i vogna', value: last },
                            { label: 'Betalt', value: `${betalt}/${TERMIN_KRAV}` },
                        ]}
                    />
                    <TimerPill
                        seconds={klokke.remaining}
                        label="Til terminen forfaller"
                        warnBelow={3}
                        corner="br"
                    />
                    <DragHint show={spiller && stasjon === 'ute' && last === 0} corner="bc">
                        Dra vogna til det gule merket ved åkeren
                    </DragHint>
                    <ScreenFlash trigger={flash} preset="damage" />
                    <DangerVignette level={spiller ? Math.max(0, sult.value - 0.55) * 2.2 : 0} />
                </>
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={sult.value}
                    label="Sult i huset"
                    hint="Sulten stiger hele tiden. Bare korn levert hjem setter den ned, og det er det samme kornet skattefuten vil ha."
                    warnAt={0.55}
                    dangerAt={0.82}
                    labels={{ normal: 'Vi klarer oss', warn: 'Barna er svake', danger: 'KRITISK!' }}
                />
                <p className="text-xs text-slate-600 leading-relaxed">
                    Tre merker på tunet: det gule ved åkeren fyller vogna, det blå er skattefutens
                    bord, og det oransje er huset ditt. Hver termin krever {TERMIN_KRAV} sekker til
                    innløsningen og {MAT_KRAV} sekker til familien. Vogna tar {KAPASITET}.
                </p>

                {fase === 'won' && (
                    <WinScreen title="Sju terminer betalt" onReplay={nullstill}>
                        Du holdt {teiger} av {START_TEIGER} teiger gjennom sju terminer. Loven fra
                        1861 krevde 49. En bonde som var 25 år da han ble fri, ville vært 74 før
                        jorda var hans, og mange rakk aldri å bli ferdige. Staten strøk resten av
                        gjelden først i 1905.
                    </WinScreen>
                )}
                {fase === 'lost-jord' && (
                    <LoseScreen title="Jorda er borte" onRetry={nullstill}>
                        Skattefuten tok en teig for hver termin du ikke betalte, og med færre teiger
                        vokste det mindre korn. Da den siste var borte hadde du ingenting å dyrke.
                        Fyll vogna i åkeren og kjør innom det blå merket før terminen forfaller.
                    </LoseScreen>
                )}
                {fase === 'lost-sult' && (
                    <LoseScreen title="Familien sultet" onRetry={nullstill}>
                        Du betalte terminene, men glemte huset. Innløsningen skulle betales med det
                        samme kornet familien levde av, og nettopp den klemma satte reformen bøndene
                        i. Kjør innom det oransje merket også.
                    </LoseScreen>
                )}

                <SceneFact>
                    Manifestet 3. mars 1861 gjorde livegne bønder til frie mennesker. Fram til jorda
                    var innløst var de likevel midlertidig forpliktet overfor godseieren, og staten
                    krevde inn kjøpesummen av bonden over 49 år. Betalingene ble avviklet i 1905.
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
}
