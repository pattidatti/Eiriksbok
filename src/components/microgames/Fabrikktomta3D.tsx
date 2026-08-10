import { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    Shoreline,
    Building,
    Tree,
    Person,
    Cart,
    Boat,
    Hill,
    Rock,
    Smoke,
    Tower,
    FlatRing,
    MarketStall,
    SceneBanner,
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

// Fabrikktomta: hvorfor den industrielle revolusjonen begynte nettopp i
// Storbritannia. Eleven drar en fabrikk rundt i et nordengelsk landskap og ser
// tre målere svare i sanntid: avstanden til kullet, til havna og til folkene.
// Lyspæra: poengsummen er den SVAKESTE av de tre. Alle tre forutsetningene
// måtte ligge nær hverandre samtidig, og slike steder fantes det få av.
//
// Mekanikken er derfor selve poenget: eleven kan ikke vinne ved å maksimere én
// ressurs, bare ved å finne punktet der alle tre rekker fram.

// Sceneen er landsbygda i 1760, altså FØR fabrikkpipene. Derfor grønt land og
// lys himmel, ikke industri-temaets sotgrå palett: eleven skal se et landskap
// med tre steder i seg, og da må bakken være lesbar.
const T = {
    sky: '#c9dce9',
    fog: '#cfdde6',
    ground: '#7d9455',
    water: '#3d7fa6',
};

/** Ankerpunkter for de tre forutsetningene (x, z i verden). */
const KULL: [number, number] = [-8, -4];
const HAVN: [number, number] = [6, 1];
const BY: [number, number] = [-2, 6];

/** Avstand der en forutsetning er perfekt, og der den er tapt. */
const FULL_AVSTAND = 7.5;
const NULL_AVSTAND = 12.5;
/** Samlet score som kreves for at fabrikken skal overleve. */
const KRAV = 0.75;

const START: [number, number] = [-13, 4];

function avstand(a: [number, number], b: [number, number]) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** 1 nær, 0 langt unna. Lineær mellom FULL_AVSTAND og NULL_AVSTAND. */
function delscore(d: number) {
    if (d <= FULL_AVSTAND) return 1;
    if (d >= NULL_AVSTAND) return 0;
    return (NULL_AVSTAND - d) / (NULL_AVSTAND - FULL_AVSTAND);
}

type Ledd = 'kull' | 'havn' | 'by';

interface Maaling {
    kull: number;
    havn: number;
    by: number;
    total: number;
    svakest: Ledd;
}

function maal(p: [number, number]): Maaling {
    const kull = delscore(avstand(p, KULL));
    const havn = delscore(avstand(p, HAVN));
    const by = delscore(avstand(p, BY));
    // Den svakeste forutsetningen bestemmer alt. Dette ER læringsmålet.
    const total = Math.min(kull, havn, by);
    const svakest: Ledd = kull <= havn && kull <= by ? 'kull' : havn <= by ? 'havn' : 'by';
    return { kull, havn, by, total, svakest };
}

const BOM: Record<Ledd, string> = {
    kull: 'For langt fra kullet. Å frakte kull over land kostet mer enn kullet selv.',
    havn: 'For langt fra havna. Varene nådde aldri kjøperne.',
    by: 'For langt fra folk. Ingen gikk to mil til jobb hver morgen.',
};

/* ------------------------------------------------------------------ */
/* Scene-deler                                                         */
/* ------------------------------------------------------------------ */

function Fabrikk({ bygget, konkurs }: { bygget: boolean; konkurs: boolean }) {
    const pipe = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        const m = pipe.current;
        if (!m) return;
        const maalHoyde = bygget && !konkurs ? 1 : 0.55;
        m.scale.y = damp(m.scale.y, maalHoyde, dt, 4);
        m.position.y = 1.85 + (m.scale.y - 1) * 0.75;
    });
    const kropp = konkurs ? '#8d8577' : '#9c4a2f';
    const tak = konkurs ? '#6b665c' : '#5d2c1c';
    return (
        <group>
            {/* Fabrikkhall, bunnen står på bakken */}
            <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.4, 1.8, 2.4]} />
                <meshStandardMaterial color={kropp} roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.05, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[2.5, 0.7, 4]} />
                <meshStandardMaterial color={tak} roughness={0.95} />
            </mesh>
            <mesh ref={pipe} position={[1.2, 1.85, -0.7]} castShadow>
                <cylinderGeometry args={[0.24, 0.32, 1.5, 10]} />
                <meshStandardMaterial color={konkurs ? '#7d776c' : '#7a3a22'} roughness={0.95} />
            </mesh>
        </group>
    );
}

function Kullgruve() {
    return (
        <group position={[KULL[0], 0, KULL[1]]}>
            <Hill position={[-2.4, 0, -2.6]} radius={4.2} height={2.6} color="#63793f" seed={3} />
            <Hill position={[2.8, 0, -3.4]} radius={3.4} height={2} color="#6d8347" seed={7} />
            <Tower position={[0, 0, 0]} height={3.2} radius={0.6} color="#8b8177" roof="#4c3324" />
            <mesh position={[2.2, 0.6, 1.6]} castShadow receiveShadow>
                <coneGeometry args={[2, 1.2, 8]} />
                <meshStandardMaterial color="#26262b" roughness={1} />
            </mesh>
            <mesh position={[-1.4, 0.35, 2] } castShadow receiveShadow>
                <coneGeometry args={[1.1, 0.7, 8]} />
                <meshStandardMaterial color="#2e2e34" roughness={1} />
            </mesh>
            <Cart position={[3.4, 0, 2.6]} />
            <Person position={[1, 0, 2.2]} pose="idle" body="#4a4038" hat="cap" hatColor="#33302c" />
            <Rock position={[-2.6, 0, 2.4]} />
        </group>
    );
}

function Havn() {
    return (
        <group>
            {/* Kaifront på land, rett innenfor kystlinja ved x = 8 */}
            <mesh position={[HAVN[0] + 1.3, 0.2, HAVN[1]]} receiveShadow castShadow>
                <boxGeometry args={[1.2, 0.4, 7]} />
                <meshStandardMaterial color="#8a7c63" roughness={1} />
            </mesh>
            <MarketStall position={[HAVN[0] - 1.4, 0, HAVN[1] - 2.2]} />
            <Building
                position={[HAVN[0] - 1.6, 0, HAVN[1] + 2.4]}
                body="#b98a55"
                roof="#5b4630"
                seed={5}
            />
            <Person position={[HAVN[0] + 0.4, 0, HAVN[1] + 0.8]} pose="walk" body="#3f4a5a" />
            <Person position={[HAVN[0] - 0.2, 0, HAVN[1] - 1]} pose="idle" body="#6a4a3a" />
        </group>
    );
}

function Byen({ vokst }: { vokst: boolean }) {
    return (
        <group position={[BY[0], 0, BY[1]]}>
            {[
                [-1.8, -1.4],
                [0.2, -0.6],
                [1.8, 0.6],
                [-0.6, 1.8],
            ].map(([x, z], i) => (
                <Building
                    key={`hus-${x}-${z}`}
                    position={[x, 0, z]}
                    body="#c2a06d"
                    roof="#6d4a30"
                    seed={i + 1}
                />
            ))}
            {[
                [1.6, -2.2],
                [-2.4, 1.6],
                [2.6, 1.8],
            ].map(([x, z], i) => (
                <group key={`ny-${x}-${z}`} visible={vokst}>
                    <Building position={[x, 0, z]} body="#b5905e" roof="#5f4128" seed={i + 11} />
                </group>
            ))}
            <Person position={[0.8, 0, 2.6]} pose="walk" body="#4c3f52" />
            <Person
                position={[-1.4, 0, 0.4]}
                pose="idle"
                body="#5a4632"
                hat="hood"
                hatColor="#4a3a2c"
            />
            <Person position={[2.8, 0, -1.4]} pose="idle" body="#3f5245" />
        </group>
    );
}

function Scene({
    posRef,
    onSlipp,
    bygget,
    konkurs,
}: {
    posRef: React.RefObject<[number, number]>;
    onSlipp: (p: [number, number]) => void;
    bygget: boolean;
    konkurs: boolean;
}) {
    const [ring, setRing] = useState(0);
    const forrige = useRef(0);

    // Ringfargen speiler samlet score, men state settes kun når verdien endrer
    // seg merkbart, aldri hver frame.
    useFrame(() => {
        const s = maal(posRef.current).total;
        if (Math.abs(s - forrige.current) > 0.04) {
            forrige.current = s;
            setRing(s);
        }
    });

    const ringFarge = ring >= KRAV ? '#10b981' : ring >= 0.4 ? '#f59e0b' : '#f43f5e';

    return (
        <group>
            <Shoreline
                splitX={8}
                size={[80, 60]}
                waterY={0.03}
                landColor={T.ground}
                seaColor={T.water}
            >
                <Boat position={[11.5, 0.03, 1]} heading={Math.PI} sail="#e8dfc9" />
                <Boat position={[13.5, 0.03, -4.5]} heading={Math.PI * 0.85} sail="#ded3ba" />
            </Shoreline>

            <Kullgruve />
            <Havn />
            <Byen vokst={bygget && !konkurs} />

            {/* Tom hei og skog: alle stedene som IKKE duger */}
            {[
                [-15, -10],
                [-13.5, -7],
                [-17, -2],
                [-14, 9],
                [-11, 11],
                [-7, 11.5],
                [2, -11],
                [5, -9],
                [-1, -9.5],
            ].map(([x, z], i) => (
                <Tree key={`tre-${x}-${z}`} position={[x, 0, z]} seed={i + 2} />
            ))}
            <Rock position={[-16, 0, 6]} />
            <Rock position={[4, 0, 10]} />

            {/* Fabrikken eleven plasserer */}
            <Draggable
                position={[START[0], 0, START[1]]}
                bounds={{ minX: -16, maxX: 7, minZ: -12, maxZ: 12 }}
                liftY={0.5}
                dropFx="dustPuff"
                onDrag={(p) => {
                    posRef.current = [p.x, p.z];
                }}
                onDrop={(p) => onSlipp([p.x, p.z])}
            >
                {/* Romslig usynlig gripeflate, trygg på trackpad */}
                <mesh position={[0, 1.1, 0]}>
                    <boxGeometry args={[4.8, 2.8, 3.8]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
                <FlatRing position={[0, 0.02, 0]} radius={2.6} tube={0.12} color={ringFarge} />
                <Fabrikk bygget={bygget} konkurs={konkurs} />
                <Smoke origin={[1.2, 3.1, -0.7]} show={bygget && !konkurs} color="#6f6a63" />
            </Draggable>
        </group>
    );
}

/* ------------------------------------------------------------------ */
/* Spill                                                               */
/* ------------------------------------------------------------------ */

export default function Fabrikktomta3D({ onComplete, onRetry }: MicroGameProps) {
    const [fase, setFase] = useState<'spiller' | 'vunnet' | 'tapt'>('spiller');
    const [pos, setPos] = useState<[number, number]>(START);
    const [banner, setBanner] = useState<string | null>(
        'Dra fabrikken. Kullgruva ligger i åsene, havna ute ved sjøen, byen i sør.'
    );
    const [konkurser, setKonkurser] = useState(0);
    const [konkurs, setKonkurs] = useState(false);
    const [forsok, setForsok] = useState(0);
    const posRef = useRef<[number, number]>(START);

    const klokke = useGameClock({
        seconds: 80,
        running: fase === 'spiller',
        onExpire: () => {
            setFase('tapt');
            microSfx.play('incorrect');
        },
    });

    const m = useMemo(() => maal(pos), [pos]);

    const slipp = useCallback(
        (p: [number, number]) => {
            posRef.current = p;
            setPos(p);
            const res = maal(p);
            if (res.total >= KRAV) {
                setKonkurs(false);
                setFase('vunnet');
                microSfx.play('complete');
                setBanner('Fabrikken går. Alle tre forutsetningene rakk fram.');
                onComplete({ score: Math.max(0.4, 1 - konkurser * 0.15), completed: true });
            } else {
                setKonkurs(true);
                setKonkurser((n) => n + 1);
                microSfx.play('incorrect');
                setBanner(BOM[res.svakest]);
                // Fabrikken står konkurs et øyeblikk, så kan eleven flytte den igjen.
                window.setTimeout(() => setKonkurs(false), 1600);
            }
        },
        [onComplete, konkurser]
    );

    const nullstill = useCallback(() => {
        posRef.current = START;
        setPos(START);
        setFase('spiller');
        setKonkurs(false);
        setKonkurser(0);
        setBanner('Dra fabrikken. Kullgruva ligger i åsene, havna ute ved sjøen, byen i sør.');
        setForsok((n) => n + 1);
        klokke.restart();
        onRetry?.();
    }, [klokke, onRetry]);

    const prosent = (v: number) => `${Math.round(v * 100)} %`;

    return (
        <MicroGameScaffold
            title="Fabrikktomta"
            subtitle="Finn det ene stedet i Nord-England der kull, havn og arbeidsfolk møtes."
            estimatedSeconds={140}
            onRetry={nullstill}
            scene={
                <Scene
                    key={forsok}
                    posRef={posRef}
                    onSlipp={slipp}
                    bygget={fase === 'vunnet'}
                    konkurs={konkurs}
                />
            }
            canvas={{
                camera: { position: [-4, 26, 23], fov: 42 },
                target: [-4.5, 0, 0],
                background: T.sky,
                fog: { color: T.fog, near: 52, far: 95 },
                light: 'day',
                idle: false,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Kull', value: prosent(m.kull) },
                            { label: 'Havn', value: prosent(m.havn) },
                            { label: 'Arbeidsfolk', value: prosent(m.by) },
                            { label: 'Svakeste ledd', value: prosent(m.total) },
                        ]}
                    />
                    {fase === 'spiller' && (
                        <TimerPill
                            seconds={klokke.remaining}
                            label="Investorene venter"
                            warnBelow={20}
                            corner="br"
                        />
                    )}
                    <DragHint show={fase === 'spiller' && konkurser === 0} corner="bc">
                        Dra fabrikken
                    </DragHint>
                </>
            }
        >
            {fase === 'vunnet' && (
                <WinScreen title="Fabrikken går rundt" onReplay={nullstill}>
                    Du fant punktet der kullet, havna og arbeidsfolkene alle rakk fram. Legg merke
                    til at poengsummen hele tiden var den svakeste av de tre. Det er nettopp
                    poenget: én god forutsetning holder ikke. Slike steder fantes det få av, men i
                    Nord-England lå kullet grunt, havet nær og byene tett.
                </WinScreen>
            )}
            {fase === 'tapt' && (
                <LoseScreen title="Investorene trakk seg" onRetry={nullstill}>
                    Pengene gikk til noen andre. Legg merke til hva som skjedde underveis: du kunne
                    legge fabrikken helt inntil kullet og likevel få null, fordi havna eller folkene
                    lå for langt unna. Prøv igjen, og let etter punktet der alle tre rekker fram
                    samtidig.
                </LoseScreen>
            )}
            {fase === 'spiller' && (
                <SceneFact>
                    Kullet lå grunt og tett ved havner og elver i Storbritannia, og i begynnelsen av
                    1800-tallet kom rundt 75 prosent av all verdens kullproduksjon derfra. Men kull
                    alene var ikke nok. Fabrikken trengte også en vei ut til kjøperne, og folk som
                    kunne stå ved maskinene.
                </SceneFact>
            )}
        </MicroGameScaffold>
    );
}
