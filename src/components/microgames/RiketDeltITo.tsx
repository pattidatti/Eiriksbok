import { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    MicroGameScaffold,
    Interactive,
    GroundPlane,
    Building,
    Tree,
    Banner,
    Tower,
    Person,
    Particles,
    Burst,
    Impact,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    LoseScreen,
    MeterBar,
    useMeter,
    useRandomPulse,
    useShake,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Lyspære: Ivan tok en tredjedel av riket som sitt eget for å knekke adelen.
// Eleven skal ta bare adelsgodsene inn i opritsjninaen. Griper eleven etter en
// bondelandsby i stedet, stiger uroen - og det var nettopp slik terroren gikk
// ut over vanlige folk og utpinte landet, ikke bare adelen.

const RING_RADIUS = 6.8;
const PLATEAU_TOP = 0.3;
const MAAL = 4; // antall adelsgods i opritsjninaen (Ivan tok omtrent en tredjedel)

type GodsType = 'bojar' | 'landsby';

interface Gods {
    id: string;
    navn: string;
    type: GodsType;
    x: number;
    z: number;
}

// Rene, deterministiske posisjoner: ti gods i ring rundt Kreml.
const BOJAR_INDEKSER = new Set([0, 3, 5, 8]);
const NAVN_BOJAR = [
    'Sjujskij-godset',
    'Kurbskij-godset',
    'Vorotynskij-godset',
    'Fjodorov-godset',
];
const NAVN_LANDSBY = [
    'Nikolskoje',
    'Petrovskoje',
    'Ivanovka',
    'Sosnovka',
    'Berjozovka',
    'Malaja Gorka',
];

function byggGods(): Gods[] {
    const liste: Gods[] = [];
    let bojar = 0;
    let landsby = 0;
    for (let i = 0; i < 10; i++) {
        const vinkel = (i / 10) * Math.PI * 2 + 0.31;
        const erBojar = BOJAR_INDEKSER.has(i);
        liste.push({
            id: `gods-${i}`,
            navn: erBojar ? NAVN_BOJAR[bojar++] : NAVN_LANDSBY[landsby++],
            type: erBojar ? 'bojar' : 'landsby',
            x: Math.cos(vinkel) * RING_RADIUS,
            z: Math.sin(vinkel) * RING_RADIUS,
        });
    }
    return liste;
}

const GODS = byggGods();

const FARGE = {
    snoe: '#e8eef4',
    mark: '#cdd8dc',
    stein: '#9aa3ab',
    tre: '#8a5a34',
    tak: '#7d3c2c',
    svart: '#2f3238',
    svartTak: '#1d2025',
    banner: '#a8342b',
};

// --- Ett gods på sitt eget platå ---------------------------------------

function Plateau({ radius }: { radius: number }) {
    return (
        <mesh position={[0, PLATEAU_TOP / 2, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[radius, radius * 1.06, PLATEAU_TOP, 14]} />
            <meshStandardMaterial color={FARGE.mark} roughness={1} />
        </mesh>
    );
}

function BojarGods({ tatt, seed }: { tatt: boolean; seed: number }) {
    const kropp = tatt ? FARGE.svart : FARGE.stein;
    const tak = tatt ? FARGE.svartTak : FARGE.tak;
    return (
        <group>
            <Plateau radius={1.85} />
            <Building
                position={[0, PLATEAU_TOP, 0]}
                body={kropp}
                roof={tak}
                w={1.55}
                h={2.4}
                d={1.4}
                seed={seed}
            />
            <Banner
                position={[1.5, PLATEAU_TOP, 0.9]}
                color={tatt ? FARGE.svartTak : FARGE.banner}
                height={2.4}
            />
            <Tree position={[-1.5, PLATEAU_TOP, 0.9]} leaf="#3d5b46" seed={seed + 5} />
        </group>
    );
}

function Landsby({ tatt, seed }: { tatt: boolean; seed: number }) {
    const kropp = tatt ? FARGE.svart : FARGE.tre;
    const tak = tatt ? FARGE.svartTak : '#6b4a2c';
    return (
        <group>
            <Plateau radius={1.85} />
            <Building
                position={[-0.75, PLATEAU_TOP, 0.35]}
                body={kropp}
                roof={tak}
                w={1}
                h={0.75}
                d={0.9}
                seed={seed}
            />
            <Building
                position={[0.65, PLATEAU_TOP, -0.4]}
                body={kropp}
                roof={tak}
                w={0.95}
                h={0.7}
                d={0.85}
                seed={seed + 1}
            />
            <Building
                position={[0.35, PLATEAU_TOP, 0.85]}
                body={kropp}
                roof={tak}
                w={0.85}
                h={0.65}
                d={0.8}
                seed={seed + 2}
            />
            {!tatt && (
                <Person
                    position={[-0.1, PLATEAU_TOP, -0.95]}
                    body="#6b5a3f"
                    legs="#4a3f30"
                    hat="hood"
                    hatColor="#8a6a3f"
                    scale={0.85}
                />
            )}
        </group>
    );
}

// --- Kreml i midten ------------------------------------------------------

function Kreml() {
    return (
        <group>
            <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[3, 3.15, 0.4, 18]} />
                <meshStandardMaterial color="#c3cdd3" roughness={1} />
            </mesh>
            <Tower position={[0, 0.4, 0]} radius={0.95} height={3.4} color="#b9432f" roof="#f0c04a" />
            <Tower position={[-1.8, 0.4, 1.1]} radius={0.5} height={2} color="#c9d2d6" roof="#7d3c2c" />
            <Tower position={[1.8, 0.4, 1.1]} radius={0.5} height={2} color="#c9d2d6" roof="#7d3c2c" />
            <Person
                position={[0, 0.4, 2]}
                body="#3d2f4a"
                legs="#2c2436"
                hat="crown"
                hatColor="#f0c04a"
                pose="raise"
            />
        </group>
    );
}

// --- Scenen --------------------------------------------------------------

interface SceneProps {
    tatte: string[];
    bomAt: [number, number, number] | null;
    bomTeller: number;
    treffAt: [number, number, number] | null;
    treffTeller: number;
    spiller: boolean;
    onVelg: (g: Gods) => void;
}

function Scene({
    tatte,
    bomAt,
    bomTeller,
    treffAt,
    treffTeller,
    spiller,
    onVelg,
}: SceneProps) {
    const { ref: shakeRef, shake } = useShake(0.22, 0.05);
    const forrigeBom = useRef(0);

    // Rist når eleven bommer. Sammenlikn mot forrige verdi - ikke per frame.
    useFrame(() => {
        if (bomTeller !== forrigeBom.current) {
            forrigeBom.current = bomTeller;
            shake(0.8);
        }
    });

    const tattSet = useMemo(() => new Set(tatte), [tatte]);

    return (
        <group ref={shakeRef}>
            <group>
                <GroundPlane size={40} depth={40} color={FARGE.snoe} />
                <Kreml />

                {GODS.map((g, i) => {
                    const tatt = tattSet.has(g.id);
                    return (
                        <Interactive
                            key={g.id}
                            position={[g.x, 0, g.z]}
                            onSelect={() => onVelg(g)}
                            disabled={tatt || !spiller}
                            state={tatt ? 'selected' : undefined}
                            hitArea={[3.8, 3.4, 3.8]}
                            hoverScale={1.06}
                            sound={null}
                        >
                            {g.type === 'bojar' ? (
                                <BojarGods tatt={tatt} seed={i} />
                            ) : (
                                <Landsby tatt={tatt} seed={i} />
                            )}
                        </Interactive>
                    );
                })}

                {/* Skog rundt kanten - ren dekor, holdes utenfor scene-revisjonen */}
                <group userData={{ sceneAuditIgnore: true }}>
                    {[
                        [-11, -9],
                        [11, -9.5],
                        [-11.5, 9],
                        [11.5, 8.5],
                        [0, -12],
                        [0, 12],
                    ].map(([x, z], i) => (
                        <Tree key={`skog-${i}`} position={[x, 0, z]} leaf="#3a5340" seed={i + 30} />
                    ))}
                </group>

                {bomAt && <Impact preset="dustPuff" trigger={bomTeller} position={bomAt} />}
                {treffAt && (
                    <Burst position={treffAt} trigger={treffTeller} color="#f0c04a" spread={2.4} />
                )}
            </group>

            {/* Snøvær - atmosfære, ikke spillinnhold */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="snow" count={90} area={[26, 26]} height={11} />
            </group>
        </group>
    );
}

// --- Spillet -------------------------------------------------------------

type Fase = 'spiller' | 'vunnet' | 'tapt';

export default function RiketDeltITo({ onComplete, onRetry }: MicroGameProps) {
    const [fase, setFase] = useState<Fase>('spiller');
    const [tatte, setTatte] = useState<string[]>([]);
    const [bom, setBom] = useState(0);
    const [bomAt, setBomAt] = useState<[number, number, number] | null>(null);
    const [treff, setTreff] = useState(0);
    const [treffAt, setTreffAt] = useState<[number, number, number] | null>(null);
    const [melding, setMelding] = useState<string | null>(null);
    const ferdigRef = useRef(false);
    const { play } = useStepSounds();

    const taptNa = useCallback(() => {
        if (ferdigRef.current) return;
        ferdigRef.current = true;
        setFase('tapt');
        play('incorrect');
    }, [play]);

    const uro = useMeter({
        drainPerSecond: 0,
        overloadAt: 1,
        onOverload: taptNa,
    });

    // Opritsjnikene rir ut på egen hånd: uroen kryper opp uansett hva eleven gjør.
    useRandomPulse({
        running: fase === 'spiller',
        minDelayMs: 2600,
        maxDelayMs: 5400,
        onPulse: () => uro.add(0.015),
    });

    const antallBojar = tatte.filter(
        (id) => GODS.find((g) => g.id === id)?.type === 'bojar'
    ).length;

    const velg = (g: Gods) => {
        if (fase !== 'spiller' || tatte.includes(g.id)) return;
        setTatte((t) => [...t, g.id]);

        if (g.type === 'bojar') {
            const nyeBojar = antallBojar + 1;
            setTreffAt([g.x, 1.6, g.z]);
            setTreff((t) => t + 1);
            play('correct');
            setMelding(
                `${g.navn} er tatt inn i opritsjninaen. Jorda går til Ivans egne menn, og familien mister grunnlaget for å stå imot.`
            );
            if (nyeBojar >= MAAL && !ferdigRef.current) {
                ferdigRef.current = true;
                setFase('vunnet');
                play('complete');
                onComplete({ score: 1, completed: true });
            }
        } else {
            setBomAt([g.x, 0.6, g.z]);
            setBom((b) => b + 1);
            uro.add(0.32);
            play('incorrect');
            setMelding(
                `${g.navn} var en bondelandsby, ikke et adelsgods. Bøndene ble drevet fra jorda, åkrene lå brakk, og uroen i riket steg.`
            );
        }
    };

    const nullstill = () => {
        setFase('spiller');
        setTatte([]);
        setBom(0);
        setBomAt(null);
        setTreff(0);
        setTreffAt(null);
        setMelding(null);
        uro.reset();
        ferdigRef.current = false;
        onRetry?.();
    };

    const banner =
        fase === 'vunnet'
            ? 'Fire adelsgods ligger i opritsjninaen. Ivan har sitt eget rike inni riket.'
            : fase === 'tapt'
              ? 'Uroen tok overhånd. Riket kollapset under sin egen terror.'
              : `Ta adelsgodsene inn i opritsjninaen: ${antallBojar} av ${MAAL}`;

    return (
        <MicroGameScaffold
            title="Riket delt i to"
            subtitle="Ivan krevde en tredjedel av Russland som sitt eget. Klikk godsene som skal inn i opritsjninaen."
            estimatedSeconds={150}
            onRetry={nullstill}
            scene={
                <Scene
                    tatte={tatte}
                    bomAt={bomAt}
                    bomTeller={bom}
                    treffAt={treffAt}
                    treffTeller={treff}
                    spiller={fase === 'spiller'}
                    onVelg={velg}
                />
            }
            canvas={{
                camera: { position: [0, 18, 18], fov: 42 },
                target: [0, 0.6, 0],
                background: '#dbe7f0',
                light: 'overcast',
                fog: { color: '#dbe7f0', near: 34, far: 62 },
                idle: tatte.length === 0,
                autoRotateSpeed: 0.35,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Adelsgods', value: `${antallBojar}/${MAAL}` },
                            { label: 'Landsbyer tatt', value: bom },
                        ]}
                    />
                    <SceneBadge corner="br">Rødt banner = adelsgods</SceneBadge>
                </>
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={uro.value}
                    label="Uro i riket"
                    hint="Hver landsby du tar, driver bønder fra jorda og øker uroen."
                    warnAt={0.45}
                    dangerAt={0.75}
                />
                {fase === 'vunnet' ? (
                    <WinScreen title="Opritsjninaen står" onReplay={nullstill}>
                        Slik ble adelen knekt: Ivan tok jorda deres og ga den til menn som skyldte
                        ham alt. Men i virkeligheten stoppet det ikke ved adelsgodsene. Hele byer,
                        som Novgorod i 1570, ble herjet, og da Ivan døde i 1584 lå riket utslitt.
                        Makten han samlet, ble stående. Regningen betalte de som bodde der.
                    </WinScreen>
                ) : fase === 'tapt' ? (
                    <LoseScreen title="Uroen tok riket" onRetry={nullstill}>
                        Opritsjnikene skilte ikke mellom adelsgods og bondegård. Åkrene lå brakk,
                        bøndene flyktet, og skattene sluttet å komme inn. Det var slik terroren
                        svekket landet Ivan ville gjøre sterkt. Prøv igjen, og se etter steinhuset
                        med banneret.
                    </LoseScreen>
                ) : (
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {melding ??
                            'I 1565 tok Ivan en tredjedel av riket som sitt private område. Det kalte han opritsjninaen. Målet var adelsgodsene: steinhusene med banner. Klikk de fire adelsgodsene i kartet. Tar du en bondelandsby i stedet, stiger uroen - og blir uroen full, faller riket sammen.'}
                    </p>
                )}
            </div>
        </MicroGameScaffold>
    );
}
