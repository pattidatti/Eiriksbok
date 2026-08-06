import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    MicroGameScaffold,
    Hotspot,
    Mover,
    Person,
    Rock,
    Hill,
    Torch,
    Particles,
    Burst,
    Impact,
    CameraRig,
    GlowMaterial,
    SceneBanner,
    SceneBadge,
    SceneFact,
    DataReadout,
    DragHint,
    SceneSlider,
    StepTracker,
    WinScreen,
    useShake,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Aksum og Etiopia: riket som slo tilbake".
//
// Lyspære-øyeblikket: klippekirkene i Lalibela ble ikke bygd oppover av stein
// som ble båret dit. De ble hugget NEDOVER, ut av ett eneste fjell, slik at
// taket ligger i flukt med bakken. Eleven kjenner det på kroppen: du legger
// ikke en stein oppå en annen, du fjerner alt som ikke er kirke.
//
// Mekanikken ER poenget. Spaken flytter ikke kirka - den fjerner fjell, og
// kirka blir stående igjen.

// 1 enhet i scenen er omtrent 2,9 meter.
const M_PER_UNIT = 2.9;
// Ytterkant av fjellplatået.
const OUT = 16;
// Halve bredden på gropa eleven hugger ut.
const PIT = 5.2;
// Halve lengden på korsarmene, og bredden på hver arm.
const ARM = 2.6;
const ARM_W = 1.5;
// Kirka står fri når gropa er minst så dyp.
const FRI_M = 11;
const MAX_M = 12;

const FJELL = '#a8593c';
const FJELL_MORK = '#9d5237';
const KIRKE = '#c58358';
const RITS = '#f0b37e';

type Steg = 'rits' | 'hugg' | 'hulut' | 'pilegrim' | 'ferdig';

// De fire kvadrantene eleven ritser, med hjørnet klikkmarkøren står i.
const HJORNER: { id: number; sx: number; sz: number }[] = [
    { id: 0, sx: 1, sz: 1 },
    { id: 1, sx: -1, sz: 1 },
    { id: 2, sx: -1, sz: -1 },
    { id: 3, sx: 1, sz: -1 },
];

type Apning = 'dor' | 'vindu-vest' | 'vindu-ost';

const APNINGER: { id: Apning; navn: string }[] = [
    { id: 'dor', navn: 'Hugg døra' },
    { id: 'vindu-vest', navn: 'Hugg vinduet' },
    { id: 'vindu-ost', navn: 'Hugg vinduet' },
];

export default function LalibelaKirke3D({ onComplete }: MicroGameProps) {
    const [steg, setSteg] = useState<Steg>('rits');
    const [ritset, setRitset] = useState<number[]>([]);
    const [dybdeM, setDybdeM] = useState(0);
    const [apnet, setApnet] = useState<Apning[]>([]);
    const [sprekk, setSprekk] = useState(false);
    const [sprekkTeller, setSprekkTeller] = useState(0);
    const [feiring, setFeiring] = useState(0);
    const [forsok, setForsok] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Rits omrisset av korset. Klikk de fire hjørnene i fjellet.'
    );

    const dybdeU = dybdeM / M_PER_UNIT;
    const fri = dybdeM >= FRI_M;

    const stegNr =
        steg === 'rits' ? 1 : steg === 'hugg' ? 2 : steg === 'hulut' ? 3 : 4;

    // Ritsing: hvert hjørne tegner sin fjerdedel av korset i fjelloverflaten.
    const rits = useCallback(
        (id: number) => {
            setRitset((prev) => {
                if (prev.includes(id)) return prev;
                const neste = [...prev, id];
                if (neste.length === HJORNER.length) {
                    setSteg('hugg');
                    setBanner('Omrisset er ferdig. Dra spaken og hugg fjellet nedover.');
                } else {
                    setBanner(`Ritset ${neste.length} av 4 hjørner.`);
                }
                return neste;
            });
        },
        []
    );

    // Dybden: eleven fjerner fjell, og kirka blir stående igjen.
    const settDybde = useCallback(
        (v: number) => {
            setDybdeM(v);
            if (v >= FRI_M) {
                setSteg((s) => {
                    if (s !== 'hugg') return s;
                    microSfx.play('advance');
                    setBanner('Kirka står fri. Nå hugger du ut dør og vinduer i veggene.');
                    return 'hulut';
                });
            } else if (v > 0) {
                setBanner(`Kirka henger fortsatt fast i fjellet. Hugg dypere enn ${FRI_M} meter.`);
            }
        },
        []
    );

    const hugg = useCallback((id: Apning) => {
        microSfx.play('correct');
        setApnet((prev) => {
            if (prev.includes(id)) return prev;
            const neste = [...prev, id];
            if (neste.length === APNINGER.length) {
                setSteg('pilegrim');
                setBanner('Ferdig. En pilegrim finner veien ned til døra.');
            } else {
                setBanner('Lyset siver inn i fjellet.');
            }
            return neste;
        });
    }, []);

    // Feil valg har en synlig konsekvens: hugger du i taket, revner fjellet.
    // Selve ristingen skjer inne i scenen (useShake kjører i useFrame).
    const huggTak = useCallback(() => {
        microSfx.play('incorrect');
        setSprekk(true);
        setSprekkTeller((n) => n + 1);
        setBanner('Hull i taket slipper regnet rett inn. Klikk sprekken og tett den igjen.');
    }, []);

    const tett = useCallback(() => {
        microSfx.play('drop');
        setSprekk(false);
        setBanner('Sprekken er tettet. Alt lyset skal komme fra vinduene i veggene.');
    }, []);

    const framme = useCallback(() => {
        setSteg('ferdig');
        setFeiring((n) => n + 1);
        setBanner(null);
    }, []);

    useEffect(() => {
        if (steg === 'ferdig') {
            microSfx.play('complete');
            onComplete({ score: sprekkTeller === 0 ? 1 : 0.85, completed: true });
        }
    }, [steg, sprekkTeller, onComplete]);

    const nullstill = useCallback(() => {
        setForsok((f) => f + 1);
        setSteg('rits');
        setRitset([]);
        setDybdeM(0);
        setApnet([]);
        setSprekk(false);
        setSprekkTeller(0);
        setFeiring(0);
        setBanner('Nytt forsøk. Rits omrisset av korset i fjellet.');
    }, []);

    return (
        <MicroGameScaffold
            title="Hugg klippekirka i Lalibela"
            subtitle="Du bygger ikke oppover. Du hugger nedover, ut av ett eneste fjell."
            estimatedSeconds={150}
            onRetry={nullstill}
            scene={
                <LalibelaScene
                    key={forsok}
                    ritset={ritset}
                    dybdeU={dybdeU}
                    fri={fri}
                    steg={steg}
                    apnet={apnet}
                    sprekk={sprekk}
                    sprekkTeller={sprekkTeller}
                    feiring={feiring}
                    onRits={rits}
                    onHugg={hugg}
                    onTak={huggTak}
                    onTett={tett}
                    onFramme={framme}
                />
            }
            canvas={{
                camera: { position: [0, 17, 11], fov: 45 },
                target: [0, -1.8, 0],
                background: '#e9d3b0',
                fog: { color: '#e9d3b0', near: 34, far: 74 },
                light: 'golden',
                idle: steg === 'rits' && ritset.length === 0,
                // Under nedstigningen styrer CameraRig kameraet selv.
                controls: steg !== 'pilegrim' && steg !== 'ferdig',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Dybde', value: dybdeM.toFixed(1), unit: 'm' },
                            { label: 'Kirka', value: fri ? 'står fri' : 'sitter fast' },
                        ]}
                    />
                    <SceneBadge corner="br">Lalibela, 1100-tallet</SceneBadge>
                    <DragHint show={steg === 'rits'} corner="bc">
                        Klikk de fire hjørnene
                    </DragHint>
                </>
            }
        >
            <div className="space-y-3">
                <StepTracker current={stegNr} total={4} />
                {steg === 'hugg' && (
                    <SceneSlider
                        label="Hugg fjellet nedover"
                        min={0}
                        max={MAX_M}
                        step={0.25}
                        value={dybdeM}
                        onChange={settDybde}
                        valueLabel={(v) => `${v.toFixed(1)} m`}
                    />
                )}
                {steg === 'ferdig' && (
                    <WinScreen title="Kirka er hugget ut av fjellet" onReplay={nullstill}>
                        Legg merke til taket: det ligger i flukt med bakken rundt. Slik er Bete
                        Giyorgis i Lalibela. Elleve slike kirker ble hugget ut av fjellet på
                        1000- og 1100-tallet, og den største er over 30 meter lang.
                    </WinScreen>
                )}
                <SceneFact>
                    Kirkene i Lalibela er hugget nedover, ut av ett stykke fjell, og står igjen som
                    frittstående bygninger nede i en grop. Kong Lalibela ville gjøre byen til et
                    nytt Jerusalem. I dag kalles stedet Afrikas Jerusalem, og pilegrimer kommer dit
                    fortsatt.
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
}

// ---------- Scenen ----------

function LalibelaScene({
    ritset,
    dybdeU,
    fri,
    steg,
    apnet,
    sprekk,
    sprekkTeller,
    feiring,
    onRits,
    onHugg,
    onTak,
    onTett,
    onFramme,
}: {
    ritset: number[];
    dybdeU: number;
    fri: boolean;
    steg: Steg;
    apnet: Apning[];
    sprekk: boolean;
    sprekkTeller: number;
    feiring: number;
    onRits: (id: number) => void;
    onHugg: (id: Apning) => void;
    onTak: () => void;
    onTett: () => void;
    onFramme: () => void;
}) {
    // Ristingen bor her inne, for useShake kjører i useFrame og må være
    // montert inne i canvaset.
    const { ref: ristRef, shake } = useShake(0.22, 0.04);
    useEffect(() => {
        if (sprekkTeller > 0) shake(0.9);
    }, [sprekkTeller, shake]);

    // Bunnen av gropa. Kirka står på den og rekker akkurat opp til bakkenivå.
    const bunn = -dybdeU;
    const synligKirke = dybdeU > 0.02;

    // Åpningene ligger i veggene, målt fra bunnen av gropa.
    const apningPos = useMemo(
        () => ({
            dor: [0, bunn + 0.62, ARM + 0.06] as [number, number, number],
            'vindu-vest': [-(ARM + 0.06), bunn + 1.25, 0] as [number, number, number],
            'vindu-ost': [ARM + 0.06, bunn + 1.25, 0] as [number, number, number],
        }),
        [bunn]
    );

    return (
        <group>
            {/* Landskapet og folkelivet rundt gropa. Ren bakgrunn - holdes
                utenfor scene-revisjonen så modellboksen ikke sprenges. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Hill position={[-13.5, 0, -12.5]} radius={5} height={3.2} color="#96593f" seed={3} />
                <Hill position={[12.5, 0, -13]} radius={5.4} height={3.6} color="#8a5039" seed={9} />
                {/* Steinrøysene etter alt fjellet som er hugget bort. */}
                <Rock position={[-9.2, 0, -7.4]} color="#8d4630" scale={1.6} />
                <Rock position={[-7.4, 0, -8.6]} color="#96593f" scale={1.1} />
                <Rock position={[8.6, 0, -7.8]} color="#8d4630" scale={1.4} />
                <Rock position={[-8.8, 0, 8.2]} color="#8d4630" scale={1.3} />
                <Rock position={[9.4, 0, 9.1]} color="#96593f" scale={1.5} />
                <Rock position={[10.6, 0, 7.4]} color="#8d4630" scale={0.9} />
                {/* Fakler ved kanten - varme lyspunkt mot all den brune steinen. */}
                <Torch position={[-6.4, 0, 6.4]} height={1.8} />
                <Torch position={[6.4, 0, 6.4]} height={1.8} />
                {/* Steinhoggere som hviler oppe på platået. */}
                <Person position={[-7.6, 0, 6.9]} body="#e8dcc4" legs="#6b4b33" hat="hood" />
                <Person position={[-6.6, 0, 7.7]} pose="raise" body="#d8c7a6" legs="#5c422f" />
                <Person position={[7.4, 0, -6.6]} pose="sit" body="#efe3ca" legs="#5c422f" />
                <Vandrer a={[9.6, 0, 7.4]} b={[9.6, 0, -7.4]} speed={1.4} phase={2} body="#efe3ca" />
                <Particles preset="dust" area={[34, 30]} height={8} />
            </group>

            <group ref={ristRef}>
                {/* Fjellplatået: fire plater som rammer inn gropa. Hver plate er
                    bredere enn 26 enheter, så de teller som terreng. */}
                <Plate x={[-OUT, OUT]} z={[-OUT, -PIT]} />
                <Plate x={[-OUT, OUT]} z={[PIT, OUT]} />
                <Plate x={[-OUT, -PIT]} z={[-OUT, OUT]} />
                <Plate x={[PIT, OUT]} z={[-OUT, OUT]} />

                {/* Bunnen av gropa. Den synker mens eleven hugger. */}
                <mesh position={[0, bunn - 0.15, 0]} receiveShadow>
                    <boxGeometry args={[PIT * 2, 0.3, PIT * 2]} />
                    <meshStandardMaterial color={FJELL_MORK} roughness={0.95} />
                </mesh>

                {/* Omrisset eleven ritser i overflaten. */}
                {HJORNER.filter((h) => ritset.includes(h.id)).map((h) => (
                    <group key={`rits-${h.id}`}>
                        <mesh position={[(h.sx * ARM) / 2, 0.04, (h.sz * ARM_W) / 4]}>
                            <boxGeometry args={[ARM, 0.09, ARM_W / 2]} />
                            <meshStandardMaterial color={RITS} roughness={0.8} />
                        </mesh>
                        <mesh position={[(h.sx * ARM_W) / 4, 0.04, (h.sz * ARM) / 2]}>
                            <boxGeometry args={[ARM_W / 2, 0.09, ARM]} />
                            <meshStandardMaterial color={RITS} roughness={0.8} />
                        </mesh>
                    </group>
                ))}

                {/* Kirka: to kryssende blokker som blir stående igjen når fjellet
                    rundt er fjernet. Taket ligger i flukt med bakken. */}
                <group scale={[1, Math.max(dybdeU, 0.001), 1]} visible={synligKirke}>
                    <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
                        <boxGeometry args={[ARM * 2, 1, ARM_W]} />
                        <meshStandardMaterial color={KIRKE} roughness={0.9} />
                    </mesh>
                    <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
                        <boxGeometry args={[ARM_W, 1, ARM * 2]} />
                        <meshStandardMaterial color={KIRKE} roughness={0.9} />
                    </mesh>
                </group>

                {/* Korset i taket - det eneste man ser fra bakkenivå. */}
                {synligKirke && (
                    <group position={[0, 0.06, 0]}>
                        <mesh>
                            <boxGeometry args={[ARM * 1.5, 0.06, ARM_W * 0.42]} />
                            <meshStandardMaterial color="#e8b184" roughness={0.7} />
                        </mesh>
                        <mesh>
                            <boxGeometry args={[ARM_W * 0.42, 0.06, ARM * 1.5]} />
                            <meshStandardMaterial color="#e8b184" roughness={0.7} />
                        </mesh>
                    </group>
                )}

                {/* Sprekken i taket etter et feilhugg. Må tettes. */}
                {sprekk && (
                    <mesh position={[0.55, 0.09, 0.2]} rotation={[0, 0.5, 0]}>
                        <boxGeometry args={[1.5, 0.1, 0.22]} />
                        <meshStandardMaterial color="#3c2418" roughness={1} />
                    </mesh>
                )}

                {/* Ferdige åpninger: mørkt hull med varmt lys innenfor. */}
                {apnet.map((id) => (
                    <Apningen key={id} id={id} pos={apningPos[id]} />
                ))}

                {/* Steg 1: rits omrisset. */}
                {steg === 'rits' &&
                    HJORNER.filter((h) => !ritset.includes(h.id)).map((h) => (
                        <Hotspot
                            key={`hs-${h.id}`}
                            position={[h.sx * 3.7, 0.75, h.sz * 3.7]}
                            radius={0.5}
                            label="Rits hjørnet"
                            onSelect={() => onRits(h.id)}
                        />
                    ))}

                {/* Steg 3: hugg ut dør og vinduer - og la taket være. */}
                {steg === 'hulut' && fri && !sprekk && (
                    <>
                        {APNINGER.filter((a) => !apnet.includes(a.id)).map((a) => (
                            <Hotspot
                                key={`ap-${a.id}`}
                                position={offset(apningPos[a.id], a.id)}
                                radius={0.42}
                                label={a.navn}
                                onSelect={() => onHugg(a.id)}
                            />
                        ))}
                        <Hotspot
                            position={[0, 0.85, 0]}
                            radius={0.38}
                            color="#94a3b8"
                            label="Hugg i taket"
                            onSelect={onTak}
                        />
                    </>
                )}

                {/* Sprekken må tettes før eleven kan fortsette. */}
                {sprekk && (
                    <Hotspot
                        position={[0.55, 0.9, 0.2]}
                        radius={0.44}
                        color="#f43f5e"
                        label="Tett sprekken"
                        onSelect={onTett}
                    />
                )}

                {/* Finalen: kameraet glir ned i gropa, slik en besøkende
                    faktisk opplever Bete Giyorgis - nede mellom fjellveggene,
                    med kirketaket i høyde med bakken over. */}
                {(steg === 'pilegrim' || steg === 'ferdig') && (
                    <CameraRig
                        to={[0, bunn + 2.2, 8.4]}
                        lookAt={[0, bunn + 1.1, 1.4]}
                        speed={0.85}
                        arriveDist={0.5}
                    />
                )}

                {/* Steg 4: pilegrimen går ned i gropa og inn døra. */}
                {(steg === 'pilegrim' || steg === 'ferdig') && (
                    <Mover
                        from={[0, bunn, 4.9]}
                        to={[0, bunn, 3.35]}
                        speed={1.25}
                        onArrive={onFramme}
                    >
                        <Person pose="walk" body="#f4ead6" legs="#5c422f" hat="hood" />
                    </Mover>
                )}

                <Impact preset="dustPuff" trigger={sprekkTeller} position={[0.55, 0.2, 0.2]} />
                <Burst position={[0, 0.9, 0]} trigger={feiring} color="#f5c07a" spread={2.6} />
            </group>
        </group>
    );
}

// Klikkmarkøren skyves litt ut fra veggen så den aldri gjemmer seg i fjellet.
function offset(p: [number, number, number], id: Apning): [number, number, number] {
    if (id === 'dor') return [p[0], p[1] + 0.3, p[2] + 0.55];
    return [p[0] + (id === 'vindu-ost' ? 0.55 : -0.55), p[1] + 0.3, p[2]];
}

// En plate av fjell. Bunnen ligger godt under gropa, så veggene er solide.
function Plate({ x, z }: { x: [number, number]; z: [number, number] }) {
    const bredde = x[1] - x[0];
    const dybde = z[1] - z[0];
    return (
        <mesh position={[(x[0] + x[1]) / 2, -3, (z[0] + z[1]) / 2]} receiveShadow>
            <boxGeometry args={[bredde, 6, dybde]} />
            <meshStandardMaterial color={FJELL} roughness={0.95} />
        </mesh>
    );
}

// En ferdig hugget åpning: mørkt hull med varmt lys bak.
function Apningen({ id, pos }: { id: Apning; pos: [number, number, number] }) {
    const dor = id === 'dor';
    const bredde = dor ? 0.6 : 0.42;
    const hoyde = dor ? 1.05 : 0.5;
    const langsX = id !== 'dor';
    const args: [number, number, number] = langsX
        ? [0.18, hoyde, bredde]
        : [bredde, hoyde, 0.18];
    return (
        <group position={pos}>
            <mesh>
                <boxGeometry args={args} />
                <meshStandardMaterial color="#2b1a12" roughness={1} />
            </mesh>
            <mesh position={langsX ? [id === 'vindu-ost' ? 0.11 : -0.11, 0, 0] : [0, 0, 0.11]}>
                <boxGeometry
                    args={langsX ? [0.05, hoyde * 0.8, bredde * 0.8] : [bredde * 0.8, hoyde * 0.8, 0.05]}
                />
                <GlowMaterial color="#f0a94e" intensity={0.8} />
            </mesh>
        </group>
    );
}

// En figur som går fram og tilbake, så platået lever.
function Vandrer({
    a,
    b,
    speed,
    phase,
    body,
}: {
    a: [number, number, number];
    b: [number, number, number];
    speed: number;
    phase: number;
    body: string;
}) {
    const [mot, setMot] = useState(true);
    return (
        <Mover
            key={mot ? 'fram' : 'tilbake'}
            from={mot ? a : b}
            to={mot ? b : a}
            speed={speed}
            phase={phase}
            onArrive={() => setMot((m) => !m)}
        >
            <Person pose="walk" body={body} legs="#5c422f" hat="hood" />
        </Mover>
    );
}
