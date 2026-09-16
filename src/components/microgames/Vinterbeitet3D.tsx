import { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    FlatRing,
    Tree,
    Rock,
    Tent,
    Person,
    Particles,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    DataReadout,
    WinScreen,
    LoseScreen,
    TimerPill,
    useGameClock,
    microSfx,
    damp,
} from './kit';
import type { MicroGameProps } from './types';

// Vinterbeitet: Fosen-dommen som en romlig oppgave. Eleven er utbyggeren og skal
// sette tre vindturbiner på et vinterbeite. Loven forbyr ikke utbygging - den
// forbyr utbygging som tar så mye beite at reindrifta ikke kan fortsette.
//
// Lyspæra: HVOR du bygger avgjør om det er lovlig. Sprer du turbinene utover,
// forsvinner beite tre steder i stedet for ett, og legger du én av dem nær
// trekkleia, stopper hele flokken. Klynger du dem i utkanten, overlapper
// skadesonene hverandre og beitet holder. Det er nettopp den samlede virkningen
// Høyesterett målte i 2021.

const T = {
    sky: '#d7e4ee',
    fog: '#dbe6ee',
    snow: '#dfe6e0',
    beite: '#c6d3b7',
    lei: '#a9bf8e',
    leiStengt: '#a3a6a2',
};

/** Vinterbeitet eleven kan bygge på (x/z-grenser i verden). */
const PLATAA = { minX: -13, maxX: 13, minZ: -10, maxZ: 10 };
/** Anleggsområdet der turbinene står parkert før de settes ut. */
const RIGG_X = -18;
/** Hvor langt en turbin skremmer reinen bort fra beitet. */
const SKADE = 4;
/** Trekkleia er beltet |z| <= LEI_HALV. */
const LEI_HALV = 2;
/** En turbin nærmere trekkleia enn dette stenger den. */
const LEI_BUFFER = 3.2;
/** Hvor mye vinterbeite som må stå igjen for at utbyggingen skal være lovlig. */
const KRAV = 0.85;

const START: [number, number][] = [
    [RIGG_X, -6.5],
    [RIGG_X, 0],
    [RIGG_X, 6.5],
];

type Punkt = [number, number];

interface Maaling {
    beite: number;
    leiApen: boolean;
    plassert: number;
    stengere: boolean[];
}

function paaPlataa(p: Punkt) {
    return (
        p[0] >= PLATAA.minX && p[0] <= PLATAA.maxX && p[1] >= PLATAA.minZ && p[1] <= PLATAA.maxZ
    );
}

// Andelen av vinterbeitet som ligger utenfor alle skadesoner. Regnes på et fast
// rutenett, så tallet er stabilt og sammenliknbart mellom forsøk.
function mal(ts: Punkt[]): Maaling {
    const aktive = ts.filter(paaPlataa);
    let totalt = 0;
    let fritt = 0;
    for (let x = PLATAA.minX; x <= PLATAA.maxX; x += 0.5) {
        for (let z = PLATAA.minZ; z <= PLATAA.maxZ; z += 0.5) {
            totalt += 1;
            let rort = false;
            for (const t of aktive) {
                if (Math.hypot(x - t[0], z - t[1]) <= SKADE) {
                    rort = true;
                    break;
                }
            }
            if (!rort) fritt += 1;
        }
    }
    const stengere = ts.map((t) => paaPlataa(t) && Math.abs(t[1]) < LEI_HALV + LEI_BUFFER);
    return {
        beite: totalt === 0 ? 1 : fritt / totalt,
        leiApen: !stengere.some(Boolean),
        plassert: aktive.length,
        stengere,
    };
}

/* ------------------------------------------------------------------ */
/* Scene-deler                                                         */
/* ------------------------------------------------------------------ */

function Turbin({ farge, ute }: { farge: string; ute: boolean }) {
    const rotor = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (rotor.current) rotor.current.rotation.z += dt * 1.4;
    });
    return (
        <group>
            {/* Fundament - bunnen står på bakken */}
            <mesh position={[0, 0.13, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.62, 0.72, 0.26, 12]} />
                <meshStandardMaterial color="#9aa0a6" roughness={0.95} />
            </mesh>
            {/* Tårnet: loddrett sylinder, ingen rotasjon */}
            <mesh position={[0, 2.45, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.3, 4.4, 12]} />
                <meshStandardMaterial color="#f1f3f5" roughness={0.6} />
            </mesh>
            {/* Maskinhuset på toppen */}
            <mesh position={[0, 4.68, 0.2]} castShadow>
                <boxGeometry args={[0.5, 0.44, 1]} />
                <meshStandardMaterial color="#e2e6ea" roughness={0.7} />
            </mesh>
            {/* Rotoren står i XY-planet og snurrer om Z - tre blader 120 grader fra hverandre */}
            <group ref={rotor} position={[0, 4.68, 0.78]}>
                {[0, 1, 2].map((i) => (
                    <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
                        <mesh position={[0, 1.5, 0]} castShadow>
                            <boxGeometry args={[0.16, 2.9, 0.05]} />
                            <meshStandardMaterial color="#fbfcfd" roughness={0.5} />
                        </mesh>
                    </group>
                ))}
                <mesh>
                    <sphereGeometry args={[0.2, 10, 10]} />
                    <meshStandardMaterial color="#cfd5da" roughness={0.6} />
                </mesh>
            </group>
            {/* Skadesonen vises først når turbinen står på beitet. En flat skive
                på bakken, aldri en stående ring. */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.015, 0]}
                visible={ute}
                scale={ute ? 1 : 0.001}
            >
                <circleGeometry args={[SKADE, 40]} />
                <meshBasicMaterial color={farge} transparent opacity={0.22} depthWrite={false} />
            </mesh>
            {ute ? (
                <FlatRing position={[0, 0.03, 0]} radius={SKADE} tube={0.1} color={farge} />
            ) : (
                <FlatRing position={[0, 0.03, 0]} radius={1.3} tube={0.12} color="#38bdf8" />
            )}
        </group>
    );
}

function Rein({ color = '#8a7361' }: { color?: string }) {
    const legH = 0.42;
    return (
        <group>
            <mesh position={[0, legH + 0.22, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.92, 0.4, 0.42]} />
                <meshStandardMaterial color={color} roughness={0.95} flatShading />
            </mesh>
            {/* Hals og hode peker framover (+X) */}
            <mesh position={[0.52, legH + 0.46, 0]} rotation={[0, 0, -0.55]} castShadow>
                <boxGeometry args={[0.36, 0.24, 0.24]} />
                <meshStandardMaterial color={color} roughness={0.95} flatShading />
            </mesh>
            {/* Gevir */}
            {[-1, 1].map((s) => (
                <group key={s} position={[0.66, legH + 0.66, s * 0.11]}>
                    <mesh rotation={[0, 0, -0.3]} castShadow>
                        <cylinderGeometry args={[0.035, 0.045, 0.62, 6]} />
                        <meshStandardMaterial color="#d9cdb6" roughness={0.8} />
                    </mesh>
                    <mesh position={[0.16, 0.3, 0]} rotation={[0, 0, -1.1]} castShadow>
                        <cylinderGeometry args={[0.025, 0.03, 0.34, 6]} />
                        <meshStandardMaterial color="#d9cdb6" roughness={0.8} />
                    </mesh>
                </group>
            ))}
            {/* Bein - bunnen står på bakken */}
            {[
                [0.32, 0.15],
                [0.32, -0.15],
                [-0.34, 0.15],
                [-0.34, -0.15],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, legH / 2, z]} castShadow>
                    <boxGeometry args={[0.09, legH, 0.09]} />
                    <meshStandardMaterial color="#6d5a4a" roughness={0.95} />
                </mesh>
            ))}
        </group>
    );
}

// Flokken går vestfra mot vinterbeitet i øst, uavhengig av hva eleven gjør.
// Stenges trekkleia, stopper den - det er den synlige konsekvensen.
function Flokk({ stengtRef }: { stengtRef: React.RefObject<boolean> }) {
    const dyr = useMemo(
        () =>
            [
                { z: -1.3, fart: 2.1, start: -13, farge: '#8a7361' },
                { z: 0.2, fart: 2.3, start: -17, farge: '#7e6857' },
                { z: 1.4, fart: 2, start: -20.5, farge: '#95806c' },
                { z: -0.5, fart: 2.2, start: -24, farge: '#82705f' },
                { z: 1, fart: 2.15, start: -27.5, farge: '#8d7663' },
            ].map((d) => ({ ...d })),
        []
    );
    const refs = useRef<(THREE.Group | null)[]>([]);
    const xs = useRef<number[]>(dyr.map((d) => d.start));

    useFrame((_, dt) => {
        const stengt = stengtRef.current === true;
        for (let i = 0; i < dyr.length; i++) {
            const g = refs.current[i];
            if (!g) continue;
            if (!stengt) {
                xs.current[i] += dyr[i].fart * dt;
                if (xs.current[i] > 14) xs.current[i] = -14;
                // Liten gang-bob så flokken ser levende ut
                g.position.y = Math.abs(Math.sin(xs.current[i] * 2.2 + i)) * 0.06;
            } else {
                g.position.y = damp(g.position.y, 0, dt, 5);
            }
            g.position.x = xs.current[i];
        }
    });

    return (
        <group>
            {dyr.map((d, i) => (
                <group
                    key={d.z + '-' + d.start}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                    position={[d.start, 0, d.z]}
                    scale={1.3}
                >
                    <Rein color={d.farge} />
                </group>
            ))}
        </group>
    );
}

function Landskap({ leiApen }: { leiApen: boolean }) {
    const lei = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(() => {
        // Trekkleia gråner når den er stengt. Fargen er utledet av én kilde.
        if (lei.current) lei.current.color.set(leiApen ? T.lei : T.leiStengt);
    });
    return (
        <group>
            <GroundPlane size={78} depth={58} color={T.snow} />

            {/* Vinterbeitet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow>
                <planeGeometry args={[PLATAA.maxX - PLATAA.minX, PLATAA.maxZ - PLATAA.minZ]} />
                <meshStandardMaterial color={T.beite} roughness={1} />
            </mesh>

            {/* Trekkleia tvers over beitet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, 0.008, 0]}>
                <planeGeometry args={[PLATAA.maxX - PLATAA.minX + 4, LEI_HALV * 2]} />
                <meshStandardMaterial ref={lei} color={T.lei} roughness={1} />
            </mesh>

            {/* Anleggsområdet i vest der turbinene står parkert */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[RIGG_X, 0.006, 0]}>
                <planeGeometry args={[5, 18]} />
                <meshStandardMaterial color="#c4bdb2" roughness={1} />
            </mesh>

            {/* Skoggrensa i vest og nord */}
            {[
                [-15.5, -13],
                [-12, -14.5],
                [-8, -13.5],
                [-4, -14.8],
                [0.5, -13.6],
                [5, -14.4],
                [9.5, -13.2],
                [-16.5, 13.5],
                [-11, 14.6],
                [-6, 13.4],
                [-1, 14.8],
                [4.5, 13.6],
                [9, 14.5],
                [14.5, 13.2],
            ].map(([x, z], i) => (
                <Tree key={`tre-${x}-${z}`} position={[x, 0, z]} seed={i + 3} leaf="#4d6b46" />
            ))}

            <Rock position={[-9, 0, -11.5]} />
            <Rock position={[6.5, 0, 11.6]} />
            <Rock position={[15.6, 0, -6]} />

            {/* Gjeterne øst for beitet, der flokken skal ende */}
            <group position={[15.2, 0, 5.4]}>
                <Tent color="#b9a173" />
                <Person position={[1.7, 0, 1.1]} pose="idle" hat="hood" />
                <Person position={[2.5, 0, -0.5]} pose="raise" hat="cap" />
            </group>

            <Particles preset="snow" count={220} area={[42, 38]} height={12} />
        </group>
    );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

function Scene({
    posRef,
    stengtRef,
    onMal,
    onSlipp,
}: {
    posRef: React.RefObject<Punkt[]>;
    stengtRef: React.RefObject<boolean>;
    onMal: (m: Maaling) => void;
    onSlipp: (i: number, p: Punkt) => void;
}) {
    const [ringer, setRinger] = useState<string[]>(['#38bdf8', '#38bdf8', '#38bdf8']);
    const [ute, setUte] = useState<boolean[]>([false, false, false]);
    const [leiApen, setLeiApen] = useState(true);
    const forrige = useRef({ beite: 1, apen: true, plassert: 0 });

    useFrame(() => {
        const ts = posRef.current;
        if (!ts) return;
        const m = mal(ts);
        stengtRef.current = !m.leiApen;
        const f = forrige.current;
        if (
            Math.abs(m.beite - f.beite) > 0.008 ||
            m.leiApen !== f.apen ||
            m.plassert !== f.plassert
        ) {
            forrige.current = { beite: m.beite, apen: m.leiApen, plassert: m.plassert };
            setLeiApen(m.leiApen);
            setUte(ts.map(paaPlataa));
            setRinger(
                m.stengere.map((stenger, i) =>
                    !paaPlataa(ts[i]) ? '#38bdf8' : stenger ? '#f43f5e' : '#f59e0b'
                )
            );
            onMal(m);
        }
    });

    return (
        <group>
            <Landskap leiApen={leiApen} />
            <Flokk stengtRef={stengtRef} />
            {START.map((s, i) => (
                <Draggable
                    key={i}
                    position={[s[0], 0, s[1]]}
                    bounds={{ minX: RIGG_X, maxX: 13, minZ: -10, maxZ: 10 }}
                    liftY={0.5}
                    dropFx="dustPuff"
                    onDrag={(p) => {
                        const ts = posRef.current;
                        if (ts) ts[i] = [p.x, p.z];
                    }}
                    onDrop={(p) => onSlipp(i, [p.x, p.z])}
                >
                    {/* Romslig, men LAV gripeflate: en høy boks ville projisert seg
                        oppover skjermen og skygget for turbinen bak. */}
                    <mesh position={[0, 1.15, 0]}>
                        <boxGeometry args={[3.4, 2.3, 3.4]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <Turbin farge={ringer[i]} ute={ute[i]} />
                </Draggable>
            ))}
        </group>
    );
}

/* ------------------------------------------------------------------ */
/* Spill                                                               */
/* ------------------------------------------------------------------ */

const START_BANNER =
    'Dra de tre turbinene ut på vinterbeitet. Den grønne stripa er trekkleia reinen går i.';

export default function Vinterbeitet3D({ onComplete, onRetry }: MicroGameProps) {
    const [fase, setFase] = useState<'spiller' | 'vunnet' | 'tapt'>('spiller');
    const [banner, setBanner] = useState<string | null>(START_BANNER);
    const [visning, setVisning] = useState<Maaling>(() => mal(START));
    const [bom, setBom] = useState(0);
    const [forsok, setForsok] = useState(0);
    const posRef = useRef<Punkt[]>(START.map((p) => [...p] as Punkt));
    const stengtRef = useRef(false);

    const klokke = useGameClock({
        seconds: 110,
        running: fase === 'spiller',
        onExpire: () => {
            setFase('tapt');
            microSfx.play('incorrect');
        },
    });

    const slipp = useCallback(
        (i: number, p: Punkt) => {
            const ts = posRef.current;
            ts[i] = p;
            const m = mal(ts);
            setVisning(m);
            if (m.plassert < 3) {
                setBanner('Alle tre turbinene må stå på vinterbeitet før søknaden kan sendes.');
                return;
            }
            if (!m.leiApen) {
                setBom((n) => n + 1);
                microSfx.play('incorrect');
                setBanner('Trekkleia er stengt. Flokken stopper og kommer seg ikke til beitet.');
                return;
            }
            if (m.beite < KRAV) {
                setBom((n) => n + 1);
                microSfx.play('incorrect');
                setBanner(
                    `Bare ${Math.round(m.beite * 100)} prosent av beitet står igjen. Det er for lite til at flokken klarer vinteren.`
                );
                return;
            }
            setFase('vunnet');
            microSfx.play('complete');
            setBanner('Godkjent. Turbinene står, og reindrifta kan fortsette.');
            onComplete({ score: Math.max(0.4, 1 - bom * 0.12), completed: true });
        },
        [onComplete, bom]
    );

    const nullstill = useCallback(() => {
        posRef.current = START.map((p) => [...p] as Punkt);
        stengtRef.current = false;
        setVisning(mal(START));
        setFase('spiller');
        setBom(0);
        setBanner(START_BANNER);
        setForsok((n) => n + 1);
        klokke.restart();
        onRetry?.();
    }, [klokke, onRetry]);

    return (
        <MicroGameScaffold
            title="Vinterbeitet"
            subtitle="Du er utbyggeren. Sett tre vindturbiner på fjellet uten å ta fra reinen vinterbeitet."
            estimatedSeconds={150}
            onRetry={nullstill}
            scene={
                <Scene
                    key={forsok}
                    posRef={posRef}
                    stengtRef={stengtRef}
                    onMal={setVisning}
                    onSlipp={slipp}
                />
            }
            canvas={{
                camera: { position: [-3, 34, 30], fov: 44 },
                target: [-3, 0, 0],
                background: T.sky,
                fog: { color: T.fog, near: 58, far: 105 },
                light: 'overcast',
                idle: false,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            {
                                label: 'Vinterbeite igjen',
                                value: `${Math.round(visning.beite * 100)} %`,
                            },
                            { label: 'Kravet', value: `${Math.round(KRAV * 100)} %` },
                            { label: 'Trekkleia', value: visning.leiApen ? 'Åpen' : 'Stengt' },
                            { label: 'Turbiner ute', value: `${visning.plassert} av 3` },
                        ]}
                    />
                    {fase === 'spiller' ? (
                        <TimerPill
                            seconds={klokke.remaining}
                            label="Frist for søknaden"
                            warnBelow={25}
                            corner="br"
                        />
                    ) : (
                        <SceneBadge corner="br">Fosen, vinterbeite</SceneBadge>
                    )}
                    <DragHint show={fase === 'spiller' && bom === 0} corner="bc">
                        Dra en turbin
                    </DragHint>
                </>
            }
        >
            {fase === 'vunnet' && (
                <WinScreen title="Konsesjonen holder" onReplay={nullstill}>
                    Du bygde alle tre turbinene, og reindrifta kan fortsette. Legg merke til hvordan
                    du fikk det til: du klynget turbinene sammen ute i kanten, slik at skadesonene
                    dekket hverandre i stedet for å spise av beitet tre forskjellige steder. Det er
                    nettopp den samlede virkningen Høyesterett målte i Fosen-saken i 2021. Loven
                    forbyr ikke vindkraft. Den forbyr utbygging som tar så mye at reindrifta ikke
                    kan fortsette.
                </WinScreen>
            )}
            {fase === 'tapt' && (
                <LoseScreen title="Fristen gikk ut" onRetry={nullstill}>
                    Søknaden ble aldri levert. Prøv igjen, og legg merke til to ting: turbiner som
                    står langt fra hverandre ødelegger beite tre steder i stedet for ett, og en
                    turbin nær den grønne stripa stopper hele flokken. Kanten av fjellet, godt unna
                    trekkleia, er der de gjør minst skade.
                </LoseScreen>
            )}
            {fase === 'spiller' && (
                <SceneFact>
                    11. oktober 2021 slo Høyesterett fast at konsesjonene til vindkraftverkene på
                    Fosen var ugyldige, fordi utbyggingen krenket reindriftssamenes rett til å
                    drive sin egen kultur. Det avgjørende var ikke hvor mange turbiner som sto der,
                    men om det ble igjen nok vinterbeite til at reindrifta kunne fortsette.
                </SceneFact>
            )}
        </MicroGameScaffold>
    );
}
