import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import {
    MicroGameScaffold,
    Seascape,
    Boat,
    Building,
    Banner,
    Mover,
    Hotspot,
    useGameClock,
    useMeter,
    useRandomPulse,
    TimerPill,
    MeterBar,
    DangerVignette,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Lyspære-øyeblikket:
// Kongen i Bergen styrte et rike der beskjeden alltid kom for sent. Til Grønland
// tok skipet en hel sommer. Eleven prøver å svare på alt som skjer ute i
// skattlandene - og oppdager at den strategien taper. De små sakene ordner
// bygdene selv, og skipene må spares til det som truer kongens makt.
//
// Mekanikken ER poenget: hver sak har en levetid, hvert skattland har en
// seilingstid, og eleven må sammenlikne de to før hun sender et skip.

const WATER_Y = 0.05;
// Havet er med vilje mye større enn spillebrettet: da ender det aldri i en synlig
// kant midt i bildet, og tåka tar resten.
const MAP: [number, number] = [230, 210];
const MAP_CENTER: [number, number] = [0.5, -1];
const SHIPS = 3;
// Kongen hadde ikke uendelig med skip og mannskap. Åtte turer på et år er den
// harde grensa - og den er grunnen til at «send skip til alt» taper: brenner du
// turene på bygdesaker, står du tom når noe truer kronen.
const TURER_PER_AAR = 8;
const SPEED = 1.7;
const YEAR_SECONDS = 80;

// Uro-regnskapet. Kalibrert slik at «send skip til alt» taper (skipene ligger
// ute på nytteløse turer når en kongesak dukker opp) og «spar skipene til
// kongesakene» vinner.
const START_URO = 0.25;
const URO_KONGESAK_TAPT = 0.3;
const URO_KONGESAK_LOEST = -0.2;
const URO_BOMTUR = 0.1;

type LandId = 'orknoyene' | 'shetland' | 'faeroyene' | 'island' | 'gronland';

interface Land {
    id: LandId;
    name: string;
    x: number;
    z: number;
    radius: number;
    /** Sjansen for at en ny sak her er en kongesak. Uroen satt i vest, tett på
     *  Skottland. Lengst ute i havet var det stort sett bygdesaker. */
    kongesakSjanse: number;
}

// Grovt geografisk oppsett sett ovenfra: Bergen i øst, skattlandene strødd
// nordvestover mot Grønland. Avstandene er valgt så seilingstidene blir tydelig
// forskjellige - det er hele poenget med spillet.
const BERGEN = { x: 18, z: 7, radius: 4.2 };

const LANDS: Land[] = [
    { id: 'shetland', name: 'Shetland', x: 4, z: 2, radius: 2.6, kongesakSjanse: 0.45 },
    { id: 'orknoyene', name: 'Orknøyene', x: 2, z: 9, radius: 2.8, kongesakSjanse: 0.45 },
    { id: 'faeroyene', name: 'Færøyene', x: -6, z: -2, radius: 2.6, kongesakSjanse: 0.35 },
    { id: 'island', name: 'Island', x: -14, z: -6, radius: 3.4, kongesakSjanse: 0.2 },
    { id: 'gronland', name: 'Grønland', x: -23, z: -10, radius: 4.0, kongesakSjanse: 0.1 },
];

const LAND_BY_ID: Record<LandId, Land> = LANDS.reduce(
    (acc, l) => {
        acc[l.id] = l;
        return acc;
    },
    {} as Record<LandId, Land>
);

// Kaia utenfor hvert skattland: litt på utsiden av øya, mot Bergen. Da legger
// aldri en båt til inne på land.
function dockOf(land: Land): [number, number] {
    const dx = BERGEN.x - land.x;
    const dz = BERGEN.z - land.z;
    const len = Math.hypot(dx, dz) || 1;
    const out = land.radius + 1.2;
    return [land.x + (dx / len) * out, land.z + (dz / len) * out];
}

// Bergens egen kai peker mot midten av havet.
const BERGEN_DOCK: [number, number] = (() => {
    const dx = MAP_CENTER[0] - BERGEN.x;
    const dz = MAP_CENTER[1] - BERGEN.z;
    const len = Math.hypot(dx, dz) || 1;
    const out = BERGEN.radius + 1.2;
    return [BERGEN.x + (dx / len) * out, BERGEN.z + (dz / len) * out];
})();

function sailSeconds(land: Land): number {
    const dock = dockOf(land);
    return Math.hypot(dock[0] - BERGEN_DOCK[0], dock[1] - BERGEN_DOCK[1]) / SPEED;
}

const LOKALE_SAKER = [
    'Bønder krangler om et beite',
    'To slekter i strid om en arv',
    'Uenighet om en fiskeplass',
    'Strid om hvem som eier en teig',
    'Krangel om en båt som forliste',
];

const KONGESAKER = [
    'En stormann krever jarletittelen',
    'Skotske skip herjer kysten',
    'Skatten blir holdt tilbake',
    'En mann lar seg hylle som konge',
];

interface Sak {
    id: number;
    landId: LandId;
    kongesak: boolean;
    text: string;
    life: number;
    maxLife: number;
    sendt: boolean;
}

interface Ferd {
    id: number;
    landId: LandId;
    leg: 'ut' | 'hjem';
}

type GameState = 'idle' | 'playing' | 'lost' | 'won';

// ---------- Statisk verden: hav, Bergen og de fem skattlandene ----------

// Flat topp på y = PLATEAU så hus står PÅ platået, ikke i en skråning.
// Sylinderen stikker ned under vannlinja, så øya reiser seg av havet.
const PLATEAU = 1.0;

function Oy({ land }: { land: Land }) {
    return (
        <group position={[land.x, 0, land.z]}>
            <mesh position={[0, PLATEAU - 0.75, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[land.radius, land.radius * 0.84, 1.5, 22]} />
                <meshStandardMaterial color="#7d8f63" roughness={1} flatShading />
            </mesh>
            <Building
                position={[0, PLATEAU, 0]}
                w={1.5}
                h={1.0}
                d={1.2}
                body="#8a6a4a"
                roof="#4f3a2c"
            />
            {land.radius > 2.7 && (
                <Building
                    position={[land.radius * 0.42, PLATEAU, -0.9]}
                    w={1.2}
                    h={0.8}
                    d={1.0}
                    body="#8a6a4a"
                    roof="#4f3a2c"
                    seed={land.x}
                />
            )}
        </group>
    );
}

const Verden = React.memo(function Verden() {
    return (
        <>
            {/* Bergen: kongens sete, med kongsflagget */}
            <group position={[BERGEN.x, 0, BERGEN.z]}>
                <mesh position={[0, PLATEAU - 0.75, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[BERGEN.radius, BERGEN.radius * 0.86, 1.5, 26]} />
                    <meshStandardMaterial color="#6f8a52" roughness={1} flatShading />
                </mesh>
                <Building
                    position={[0, PLATEAU, 0]}
                    w={2.6}
                    h={1.7}
                    d={1.9}
                    body="#b0a48c"
                    roof="#6b3f2e"
                />
                <Building
                    position={[-2.1, PLATEAU, 1.3]}
                    w={1.4}
                    h={1.0}
                    d={1.2}
                    body="#8a6a4a"
                    roof="#4f3a2c"
                />
                <Building
                    position={[2.0, PLATEAU, 1.4]}
                    w={1.4}
                    h={1.0}
                    d={1.2}
                    body="#8a6a4a"
                    roof="#4f3a2c"
                    seed={3}
                />
                <Banner position={[2.6, PLATEAU, -1.7]} color="#a8322c" height={2.6} />
            </group>

            {LANDS.map((l) => (
                <Oy key={l.id} land={l} />
            ))}

            {/* Skjær i det åpne havet - gir dybde uten å flytte modellboksen */}
            {([
                [-18, 8, 0.7],
                [-9, 10, 0.5],
                [-24, 2, 0.6],
                [10, -8, 0.55],
            ] as [number, number, number][]).map(([x, z, r]) => (
                <mesh key={`skjer-${x}-${z}`} position={[x, 0.05, z]} castShadow>
                    <icosahedronGeometry args={[r, 0]} />
                    <meshStandardMaterial color="#6c7566" roughness={1} flatShading />
                </mesh>
            ))}
        </>
    );
});

// ---------- Etiketter: navn og seilingstid, alltid synlig ----------

function StedsNavn() {
    return (
        <>
            <Html center position={[BERGEN.x, 2.4, BERGEN.z]} pointerEvents="none">
                <div className="pointer-events-none select-none px-2 py-0.5 rounded-md bg-white/90 text-slate-800 text-[11px] font-bold whitespace-nowrap shadow">
                    Bergen
                </div>
            </Html>
            {LANDS.map((l) => (
                <Html key={l.id} center position={[l.x, 2.0, l.z]} pointerEvents="none">
                    <div className="pointer-events-none select-none px-2 py-0.5 rounded-md bg-white/85 text-slate-700 text-[11px] font-semibold whitespace-nowrap shadow">
                        {l.name}
                        <span className="ml-1 text-sky-700">{Math.round(sailSeconds(l))} s</span>
                    </div>
                </Html>
            ))}
        </>
    );
}

// ---------- Selve spillet ----------

const BeskjedenForSent3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const waves = useAmbience('waves', -32);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [saker, setSaker] = useState<Sak[]>([]);
    const [ferder, setFerder] = useState<Ferd[]>([]);
    const [banner, setBanner] = useState<string | null>(null);
    const [loest, setLoest] = useState(0);
    const [bomturer, setBomturer] = useState(0);
    const [turerBrukt, setTurerBrukt] = useState(0);

    const nextId = useRef(1);
    const stateRef = useRef<GameState>('idle');
    // Speil av state, så klikk-handlere og intervaller kan lese uten å legge
    // bivirkninger inn i en setState-oppdaterer.
    const sakerRef = useRef<Sak[]>([]);
    const ferderRef = useRef<Ferd[]>([]);
    const turerRef = useRef(0);
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);
    useEffect(() => {
        sakerRef.current = saker;
    }, [saker]);
    useEffect(() => {
        ferderRef.current = ferder;
    }, [ferder]);

    const say = useCallback((text: string) => {
        setBanner(text);
        window.setTimeout(() => setBanner((b) => (b === text ? null : b)), 2600);
    }, []);

    const uro = useMeter({
        initial: START_URO,
        // Uro forsvinner ikke av seg selv. Den eneste veien ned er å komme fram
        // i tide til en sak som faktisk truer kongen.
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.5,
        onOverload: () => {
            if (stateRef.current !== 'playing') return;
            sounds.play('incorrect');
            setGameState('lost');
        },
    });

    const clock = useGameClock({
        seconds: YEAR_SECONDS,
        running: gameState === 'playing',
        onExpire: () => {
            if (stateRef.current !== 'playing') return;
            sounds.play('complete');
            setGameState('won');
        },
    });

    // Nye saker dukker opp ute i riket, uansett hva eleven gjør.
    useRandomPulse({
        running: gameState === 'playing',
        minDelayMs: 2600,
        maxDelayMs: 4600,
        onPulse: () => {
            const ledige = LANDS.filter((l) => !sakerRef.current.some((s) => s.landId === l.id));
            if (ledige.length === 0) return;
            const land = ledige[Math.floor(Math.random() * ledige.length)];
            const kongesak = Math.random() < land.kongesakSjanse;
            const brukt = sakerRef.current.map((s) => s.text);
            const liste = (kongesak ? KONGESAKER : LOKALE_SAKER).filter((t) => !brukt.includes(t));
            const valg = liste.length ? liste : kongesak ? KONGESAKER : LOKALE_SAKER;
            // Kongesaker lever lenge nok til at selv Grønland kan nås - men da
            // binder skipet seg i førti sekunder. Bygdesaker rekker du sjelden.
            const maxLife = kongesak ? 16 + Math.random() * 6 : 7 + Math.random() * 3;
            sakerRef.current = [
                ...sakerRef.current,
                {
                    id: nextId.current++,
                    landId: land.id,
                    kongesak,
                    text: valg[Math.floor(Math.random() * valg.length)],
                    life: maxLife,
                    maxLife,
                    sendt: false,
                },
            ];
            setSaker(sakerRef.current);
        },
    });

    // Sakene tikker ned på DOM-siden (5 Hz), ikke per frame.
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            const beholdt: Sak[] = [];
            const tapte: Sak[] = [];
            for (const s of sakerRef.current) {
                const life = s.life - 0.2;
                if (life > 0) beholdt.push({ ...s, life });
                else if (s.kongesak) tapte.push(s);
            }
            for (const s of tapte) {
                uro.add(URO_KONGESAK_TAPT);
                say(`${LAND_BY_ID[s.landId].name}: ingen kom fra kongen. Saken gikk tapt.`);
            }
            sakerRef.current = beholdt;
            setSaker(beholdt);
        }, 200);
        return () => clearInterval(t);
    }, [gameState, uro, say]);

    const sendSkip = useCallback(
        (sakId: number) => {
            if (stateRef.current !== 'playing') return;
            const sak = sakerRef.current.find((s) => s.id === sakId);
            if (!sak || sak.sendt) return;
            if (turerRef.current >= TURER_PER_AAR) {
                say('Årets skipsturer er brukt opp. Kongen hadde ikke flere.');
                return;
            }
            if (ferderRef.current.length >= SHIPS) {
                say('Alle skipene er ute. Du må vente til ett kommer hjem.');
                return;
            }
            turerRef.current += 1;
            setTurerBrukt(turerRef.current);
            const ferd: Ferd = { id: nextId.current++, landId: sak.landId, leg: 'ut' };
            ferderRef.current = [...ferderRef.current, ferd];
            setFerder(ferderRef.current);
            sakerRef.current = sakerRef.current.map((s) =>
                s.id === sakId ? { ...s, sendt: true } : s
            );
            setSaker(sakerRef.current);
            sounds.play('advance');
        },
        [say, sounds]
    );

    const framme = useCallback(
        (ferdId: number, landId: LandId) => {
            const sak = sakerRef.current.find((s) => s.landId === landId && s.sendt);
            if (!sak) {
                uro.add(URO_BOMTUR);
                setBomturer((b) => b + 1);
                say(
                    `${LAND_BY_ID[landId].name}: skipet kom fram, men saken var over. ` +
                        `${Math.round(sailSeconds(LAND_BY_ID[landId]))} sekunder er for lang vei.`
                );
            } else {
                if (sak.kongesak) {
                    uro.add(URO_KONGESAK_LOEST);
                    setLoest((l) => l + 1);
                    sounds.play('correct');
                    say(`${LAND_BY_ID[landId].name}: kongens menn kom fram i tide.`);
                } else {
                    uro.add(URO_BOMTUR);
                    setBomturer((b) => b + 1);
                    sounds.play('incorrect');
                    say(`${LAND_BY_ID[landId].name}: bygda hadde alt ordnet det selv.`);
                }
                sakerRef.current = sakerRef.current.filter((s) => s.id !== sak.id);
                setSaker(sakerRef.current);
            }
            ferderRef.current = ferderRef.current.map((x) =>
                x.id === ferdId ? { ...x, leg: 'hjem' as const } : x
            );
            setFerder(ferderRef.current);
        },
        [say, sounds, uro]
    );

    const hjemme = useCallback((ferdId: number) => {
        ferderRef.current = ferderRef.current.filter((x) => x.id !== ferdId);
        setFerder(ferderRef.current);
    }, []);

    const begin = useCallback(() => {
        sakerRef.current = [];
        ferderRef.current = [];
        turerRef.current = 0;
        setTurerBrukt(0);
        setSaker([]);
        setFerder([]);
        setLoest(0);
        setBomturer(0);
        uro.reset();
        clock.restart();
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        waves.start();
        say('Rød sak truer kongens makt. Gul sak ordner bygda selv. Klikk for å sende skip.');
    }, [clock, sounds, uro, waves, say]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        sakerRef.current = [];
        ferderRef.current = [];
        turerRef.current = 0;
        setTurerBrukt(0);
        setSaker([]);
        setFerder([]);
        setBanner(null);
        uro.reset();
        waves.stop();
    }, [uro, waves]);

    const score = useMemo(
        () => Math.max(0.35, Math.min(1, 1 - uro.value * 0.6 - bomturer * 0.04)),
        [uro.value, bomturer]
    );

    const finish = useCallback(() => {
        onComplete({ score, completed: true });
    }, [onComplete, score]);

    return (
        <MicroGameScaffold
            title="Beskjeden som kom for sent"
            subtitle="Du er kongen i Bergen. Skipene er få, og havet er stort - velg hva som er verdt et skip"
            estimatedSeconds={150}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: [0.5, 46, 35] as [number, number, number], fov: 42 },
                target: [MAP_CENTER[0], 0, MAP_CENTER[1]] as [number, number, number],
                background: '#cfe1ee',
                fog: { color: '#cfe1ee', near: 62, far: 130 },
                light: 'overcast',
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#dceaf4] to-[#b9d3e2]"
            overlays={
                <>
                    <DangerVignette level={gameState === 'playing' ? uro.value * 0.45 : 0} />
                    <SceneBanner message={banner} wide />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Året går"
                            warnBelow={15}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Skip i havn', value: SHIPS - ferder.length },
                                { label: 'Skipsturer igjen', value: TURER_PER_AAR - turerBrukt },
                                { label: 'Kongesaker løst', value: loest },
                            ]}
                        />
                    )}
                </>
            }
            scene={
                <group key={attempt}>
                    <Seascape
                        position={[MAP_CENTER[0], 0, MAP_CENTER[1]]}
                        size={MAP}
                        waterY={WATER_Y}
                        color="#3f7fa8"
                    >
                        <Verden />
                        {ferder.map((f) => {
                            const land = LAND_BY_ID[f.landId];
                            const dock = dockOf(land);
                            const from = f.leg === 'ut' ? BERGEN_DOCK : dock;
                            const to = f.leg === 'ut' ? dock : BERGEN_DOCK;
                            return (
                                <Mover
                                    key={`${f.id}-${f.leg}`}
                                    from={[from[0], WATER_Y, from[1]]}
                                    to={[to[0], WATER_Y, to[1]]}
                                    speed={SPEED}
                                    bob={0.03}
                                    onArrive={() =>
                                        f.leg === 'ut' ? framme(f.id, f.landId) : hjemme(f.id)
                                    }
                                >
                                    <Boat color="#6b4a2c" sail="#f0e7d2" />
                                </Mover>
                            );
                        })}
                    </Seascape>

                    <StedsNavn />

                    {gameState === 'playing' &&
                        saker.map((s) => {
                            const land = LAND_BY_ID[s.landId];
                            const ratio = Math.max(0.25, s.life / s.maxLife);
                            return (
                                <Hotspot
                                    key={s.id}
                                    position={[land.x, 4.8, land.z]}
                                    radius={0.6 + 0.5 * ratio}
                                    color={s.sendt ? '#0ea5e9' : s.kongesak ? '#e11d48' : '#f59e0b'}
                                    label={`${land.name}: ${s.text}`}
                                    onSelect={() => sendSkip(s.id)}
                                    disabled={s.sendt}
                                />
                            );
                        })}
                </group>
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed max-w-xl mx-auto">
                        Ett år i Norgesveldet. Saker dukker opp ute i skattlandene, og du har tre
                        skip og åtte skipsturer for hele året. Tallet ved hvert land viser hvor mange
                        sekunder skipet bruker dit. Røde saker truer kongens makt. Gule saker klarer
                        bygdene selv - og hver tur du kaster bort der, har du ikke igjen når det
                        gjelder.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-sky-700 text-white rounded-xl text-sm font-bold hover:bg-sky-800 transition shadow"
                    >
                        Start året
                    </button>
                </div>
            )}

            {gameState === 'playing' && saker.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {saker.map((s) => (
                        <span
                            key={s.id}
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${
                                s.sendt
                                    ? 'bg-sky-50 border-sky-200 text-sky-700'
                                    : s.kongesak
                                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                                      : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}
                        >
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    s.sendt
                                        ? 'bg-sky-500'
                                        : s.kongesak
                                          ? 'bg-rose-500'
                                          : 'bg-amber-400'
                                }`}
                            />
                            <span className="font-semibold">{LAND_BY_ID[s.landId].name}</span>
                            <span>{s.text}</span>
                            {s.sendt && <span className="font-semibold">- skip på vei</span>}
                        </span>
                    ))}
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={uro.value}
                    label="Uro i riket"
                    hint="Uroen vokser når en rød sak går tapt - og når et skip seiler forgjeves. Du har bare åtte turer i året."
                    labels={{ normal: 'Riket står', warn: 'Det murrer', danger: 'Riket rakner!' }}
                />
            )}

            {gameState === 'lost' && (
                <LoseScreen title="Riket raknet" onRetry={begin}>
                    Skipene var på feil sted da det gjaldt. Kongen kunne ikke være overalt - derfor
                    måtte han spare skipene til det som truet kronen, og la bygdene ordne resten
                    selv. Prøv igjen: send bare på de røde sakene, og se på seilingstiden først.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={loest > 0 ? 'Året gikk, og riket sto' : 'Året gikk - så vidt'}
                    onReplay={begin}
                    onNext={finish}
                >
                    Du løste {loest} kongesaker og sendte {bomturer} skip forgjeves. Slik var
                    Norgesveldet: en beskjed til Grønland brukte en hel sommer, og kongen rakk aldri
                    fram til de små stridene. Derfor styrte skattlandene seg selv i det daglige, og
                    kongen brukte skipene på det som truet makten hans.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default BeskjedenForSent3D;
