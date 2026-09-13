import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MicroGameProps } from './types';
import {
    MicroGameScaffold,
    GroundPlane,
    FlatRing,
    Tree,
    Rock,
    Person,
    Animal,
    Tent,
    Fire,
    Boat,
    Draggable,
    WaterMaterial,
    Burst,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    WinScreen,
    LoseScreen,
    MeterBar,
    DangerVignette,
    damp,
    faceAlong,
    microSfx,
} from './kit';

// Lyspære-øyeblikket: Doggerland gikk ikke under i én katastrofe. Havet steg så
// sakte at ingen generasjon merket det - men hver generasjon måtte flytte leiren
// litt lenger øst, til det ikke var mer land å flytte seg til. Eleven kjenner
// ratsjen på kroppen: vannet stopper aldri, og det finnes alltid én holme mindre.

type Fase = 'klar' | 'spiller' | 'avreise' | 'vunnet' | 'tapt';

interface Holme {
    id: string;
    navn: string;
    x: number;
    z: number;
    w: number;
    d: number;
    /** Høyden på platået. Vannet tar holmen når havet står høyere enn dette. */
    top: number;
    farge: string;
}

// Sju holmer i en trapp fra vest til øst. Doggerbanken ligger høyest og sist.
const HOLMER: Holme[] = [
    { id: 'vestsletta', navn: 'Vestsletta', x: -7.8, z: 2.6, w: 4.4, d: 3.6, top: 0.3, farge: '#9cb466' },
    { id: 'sorholmen', navn: 'Sørholmen', x: -6.2, z: -3.0, w: 3.8, d: 3.2, top: 0.3, farge: '#9cb466' },
    { id: 'elvebakken', navn: 'Elvebakken', x: -2.4, z: 2.8, w: 4.0, d: 3.4, top: 0.62, farge: '#8aa75c' },
    { id: 'furuhaugen', navn: 'Furuhaugen', x: -1.2, z: -3.2, w: 3.4, d: 3.0, top: 0.62, farge: '#8aa75c' },
    { id: 'hogmoen', navn: 'Høgmoen', x: 2.8, z: 1.2, w: 3.8, d: 3.8, top: 0.98, farge: '#789751' },
    { id: 'steinryggen', navn: 'Steinryggen', x: 4.2, z: -3.2, w: 3.2, d: 2.8, top: 1.3, farge: '#6d8b49' },
    { id: 'doggerbanken', navn: 'Doggerbanken', x: 7.2, z: 0.4, w: 4.6, d: 4.2, top: 1.75, farge: '#5f7d41' },
];

const DOGGER = HOLMER.length - 1;
const START_HOLME = 0;

// Havet starter under sletta og stiger til over den siste holmen.
const HAV_START = -0.32;
const HAV_MAKS = 1.92;
// Meter per sekund. Gir rundt 22 sekunder til første holme går under, og
// omtrent 69 sekunder til Doggerbanken er alt som er igjen.
const HAV_FART = 0.028;
// Når havet står hit og leiren er på Doggerbanken, går familien i båten.
const AVREISE_NIVA = 1.6;

// Tidslinja eleven ser: havnivået gjøres om til år før nåtid. Endepunktene er
// hentet fra kildene - Doggerbanken sto over vann til for rundt 7 800 år sia.
const AAR_START = 10000;
const AAR_SLUTT = 7800;
const tilAar = (hav: number) =>
    AAR_START - ((hav - HAV_START) / (HAV_MAKS - HAV_START)) * (AAR_START - AAR_SLUTT);

// --- Scene ---

function HolmeMesh({ holme, drukket }: { holme: Holme; drukket: boolean }) {
    return (
        <group>
            <mesh position={[holme.x, holme.top / 2, holme.z]} castShadow receiveShadow>
                <boxGeometry args={[holme.w, holme.top, holme.d]} />
                <meshStandardMaterial
                    color={drukket ? '#57624f' : holme.farge}
                    roughness={1}
                    flatShading
                />
            </mesh>
            {/* Vegetasjonen forsvinner når holmen går under. visible - ikke skala,
                for en flatklemt boks tegnes fortsatt som et kort. */}
            <group visible={!drukket}>
                <Tree
                    position={[holme.x - holme.w * 0.28, holme.top, holme.z + holme.d * 0.26]}
                    seed={holme.x + 3}
                    leaf="#3f6b39"
                />
                <Tree
                    position={[holme.x + holme.w * 0.3, holme.top, holme.z - holme.d * 0.22]}
                    seed={holme.z + 11}
                    leaf="#456f3c"
                />
                <Rock
                    position={[holme.x + holme.w * 0.18, holme.top + 0.2, holme.z + holme.d * 0.3]}
                    scale={0.6}
                />
            </group>
        </group>
    );
}

function Leir({ loftTil, jubel }: { loftTil: number; jubel: number }) {
    const loft = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!loft.current) return;
        loft.current.position.y = damp(loft.current.position.y, loftTil, dt, 4);
    });
    return (
        <group ref={loft}>
            {/* Romslig usynlig gripeflate - trygg å ta tak i på en trackpad. */}
            <mesh position={[0, 0.85, 0]}>
                <boxGeometry args={[2.4, 2.2, 2.4]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            <Tent position={[0, 0, 0]} color="#b08a52" scale={0.62} />
            <Person position={[0.72, 0, 0.24]} pose="idle" body="#6b543a" hat="hood" />
            <Person position={[-0.62, 0, -0.42]} pose="raise" body="#7a6144" scale={0.78} />
            <Fire position={[0.18, 0, -0.78]} scale={0.44} />
            {jubel > 0 && <Burst position={[0, 1.5, 0]} trigger={jubel} />}
        </group>
    );
}

function Scene({
    fase,
    hav,
    leirIdx,
    ildsteder,
    bounceKey,
    jubel,
    onHav,
    onTak,
    onSnapp,
    onSlipp,
}: {
    fase: Fase;
    /** Havnivået slik spillet kjenner det (rapportert opp fra useFrame). */
    hav: number;
    leirIdx: number;
    ildsteder: number[];
    bounceKey: number;
    jubel: number;
    onHav: (hav: number) => void;
    onTak: () => void;
    onSnapp: (i: number) => void;
    onSlipp: () => void;
}) {
    const vann = useRef<THREE.Mesh>(null);
    const baat = useRef<THREE.Group>(null);
    const havRef = useRef(HAV_START);
    const sisteRapport = useRef(HAV_START);
    const kjorer = fase === 'spiller';
    const leir = HOLMER[leirIdx];

    const snapPunkter = useMemo(
        () => HOLMER.map((h) => [h.x, h.z] as [number, number]),
        []
    );

    useFrame((_, dt) => {
        if (kjorer) havRef.current = Math.min(HAV_MAKS, havRef.current + dt * HAV_FART);
        if (vann.current) vann.current.position.y = havRef.current;
        // Båten følger vannflata og glir vestover når familien drar.
        if (baat.current) {
            baat.current.position.y = havRef.current + 0.02;
            const maal = fase === 'avreise' || fase === 'vunnet' ? -9 : HOLMER[DOGGER].x + 3.6;
            baat.current.position.x = damp(baat.current.position.x, maal, dt, 0.55);
        }
        const q = Math.round(havRef.current * 100) / 100;
        if (q !== sisteRapport.current) {
            sisteRapport.current = q;
            onHav(q);
        }
    });

    return (
        <group>
            {/* Sletta som blir havbunn. Bredere enn 26 enheter, så scene-revisjonen
                regner den som terreng og ikke som "modellen". */}
            <GroundPlane size={42} depth={32} color="#87a35c" />

            {HOLMER.map((h) => (
                <HolmeMesh key={h.id} holme={h} drukket={hav > h.top} />
            ))}

            {/* Urokse på en av de midtre holmene, så sletta virker levende. */}
            <group visible={hav <= HOLMER[2].top}>
                <Animal
                    position={[HOLMER[2].x + 1.1, HOLMER[2].top, HOLMER[2].z - 0.9]}
                    kind="ox"
                />
            </group>

            {/* Forlatte ildsteder. De blir liggende og havner under vann - nettopp
                slik steinalderboplasser i dag finnes på havbunnen. */}
            {ildsteder.map((i) => (
                <FlatRing
                    key={`ild-${HOLMER[i].id}`}
                    position={[HOLMER[i].x, HOLMER[i].top + 0.03, HOLMER[i].z]}
                    radius={0.52}
                    tube={0.08}
                    color="#7d6340"
                />
            ))}

            {fase !== 'vunnet' && (
                <Draggable
                    key={`leir-${bounceKey}`}
                    position={[leir.x, 0, leir.z]}
                    bounds={{ minX: -11, maxX: 11, minZ: -6, maxZ: 6 }}
                    snapPoints={snapPunkter}
                    snapRadius={3.4}
                    onDragStart={onTak}
                    onSnap={onSnapp}
                    onDrop={onSlipp}
                    dropFx="dustPuff"
                >
                    <Leir loftTil={leir.top} jubel={jubel} />
                </Draggable>
            )}

            {/* Båten dukker først opp når sletta er under vann, så den aldri ligger
                på land. Den blir liggende ved Doggerbanken til familien drar. */}
            {hav > 0.05 && (
                <group
                    ref={baat}
                    position={[HOLMER[DOGGER].x + 3.6, hav + 0.02, HOLMER[DOGGER].z]}
                >
                    <Boat position={[0, 0, 0]} heading={faceAlong([-1, 0])} color="#7a5636" />
                    {/* En padler om bord. Uten seil - i steinalderen padlet de,
                        og båtturene gikk i smult farvann med land i sikte. */}
                    <Person position={[0, 0.3, -0.25]} pose="sit" scale={0.66} body="#6b543a" />
                </group>
            )}

            {/* Havet. Ett plan som stiger hele spillet. */}
            <mesh ref={vann} rotation={[-Math.PI / 2, 0, 0]} position={[0, HAV_START, 0]}>
                <planeGeometry args={[58, 46, 46, 38]} />
                <WaterMaterial color="#4d86ad" transparent opacity={0.84} waveHeight={0.1} />
            </mesh>
        </group>
    );
}

// --- Spillet ---

export default function Doggerland3D({ onComplete, onRetry }: MicroGameProps) {
    const [forsok, setForsok] = useState(0);
    const [fase, setFase] = useState<Fase>('klar');
    const [leirIdx, setLeirIdx] = useState(START_HOLME);
    const [ildsteder, setIldsteder] = useState<number[]>([]);
    const [bounceKey, setBounceKey] = useState(0);
    const [jubel, setJubel] = useState(0);
    const [hav, setHav] = useState(HAV_START);
    const [banner, setBanner] = useState(
        'Dra leiren til en høyere holme før havet tar den du står på.'
    );
    const snappetRef = useRef(false);
    const ferdigRef = useRef(false);
    const varselRef = useRef(false);

    const leirTop = HOLMER[leirIdx].top;

    const nullstill = useCallback(() => {
        setFase('klar');
        setLeirIdx(START_HOLME);
        setIldsteder([]);
        setBounceKey((b) => b + 1);
        setJubel(0);
        setHav(HAV_START);
        setBanner('Dra leiren til en høyere holme før havet tar den du står på.');
        snappetRef.current = false;
        ferdigRef.current = false;
        varselRef.current = false;
        setForsok((f) => f + 1);
        onRetry?.();
    }, [onRetry]);

    // Havet driver hele spillet. Scenen rapporterer nivået hit fra useFrame, og
    // alt av tap, varsel og seier avgjøres i samme kall.
    const rapporterHav = useCallback(
        (niva: number) => {
            setHav(niva);
            if (fase !== 'spiller') return;
            if (niva > leirTop) {
                microSfx.play('incorrect');
                setBanner('Vannet gikk over leiren.');
                setFase('tapt');
                return;
            }
            if (leirIdx === DOGGER && niva >= AVREISE_NIVA) {
                microSfx.play('advance');
                setBanner('Det er ikke mer land igjen. Familien går i båten.');
                setFase('avreise');
                return;
            }
            if (!varselRef.current && leirTop - niva < 0.16) {
                varselRef.current = true;
                setBanner('Vannet slikker inn over leiren. Flytt den nå.');
            }
        },
        [fase, leirTop, leirIdx]
    );

    // Kort mellomspill mens båten glir vestover, så seier.
    useEffect(() => {
        if (fase !== 'avreise') return;
        const t = setTimeout(() => {
            setFase('vunnet');
            setBanner('Doggerland er borte. Folket lever videre på kystene rundt.');
        }, 2800);
        return () => clearTimeout(t);
    }, [fase]);

    useEffect(() => {
        if (fase === 'vunnet' && !ferdigRef.current) {
            ferdigRef.current = true;
            microSfx.play('complete');
            onComplete({ score: 1, completed: true });
        }
    }, [fase, onComplete]);

    const snapp = useCallback(
        (i: number) => {
            snappetRef.current = true;
            if (fase === 'tapt' || fase === 'vunnet' || fase === 'avreise') return;
            if (i === leirIdx) return;
            if (hav > HOLMER[i].top) {
                // Holmen er alt hav. Leiren blir satt tilbake der den sto.
                microSfx.play('incorrect');
                setBanner(`${HOLMER[i].navn} ligger alt under vann. Velg en høyere holme.`);
                setBounceKey((b) => b + 1);
                return;
            }
            microSfx.play('correct');
            varselRef.current = false;
            setIldsteder((liste) => (liste.includes(leirIdx) ? liste : [...liste, leirIdx]));
            setLeirIdx(i);
            setJubel((j) => j + 1);
            if (fase === 'klar') setFase('spiller');
            setBanner(
                i === DOGGER
                    ? 'Doggerbanken. Høyeste land som er igjen - og det siste.'
                    : `Leiren står på ${HOLMER[i].navn}. ${HOLMER[i].top.toFixed(2)} meter over havet.`
            );
        },
        [fase, leirIdx, hav]
    );

    // Slapp eleven leiren utenfor alle holmene, settes den tilbake.
    const slipp = useCallback(() => {
        if (snappetRef.current) {
            snappetRef.current = false;
            return;
        }
        snappetRef.current = false;
        microSfx.play('incorrect');
        setBanner('Der er det bare vann. Slipp leiren oppå en holme.');
        setBounceKey((b) => b + 1);
    }, []);

    // Klokka starter først når eleven tar i leiren, så ingen taper på å lese.
    const start = useCallback(() => {
        setFase((f) => (f === 'klar' ? 'spiller' : f));
    }, []);

    const aar = Math.round(tilAar(hav) / 50) * 50;
    const generasjoner = Math.round((AAR_START - tilAar(hav)) / 25);
    const havAndel = (hav - HAV_START) / (HAV_MAKS - HAV_START);
    const fare = Math.max(0, Math.min(1, 1 - (leirTop - hav) / 0.35));

    return (
        <MicroGameScaffold
            title="Doggerland synker"
            subtitle="Nordsjøen var land. Flytt leiren østover så lenge det finnes land å flytte til."
            estimatedSeconds={150}
            onRetry={nullstill}
            scene={
                <Scene
                    key={forsok}
                    fase={fase}
                    leirIdx={leirIdx}
                    ildsteder={ildsteder}
                    bounceKey={bounceKey}
                    jubel={jubel}
                    hav={hav}
                    onHav={rapporterHav}
                    onTak={start}
                    onSnapp={snapp}
                    onSlipp={slipp}
                />
            }
            canvas={{
                camera: { position: [0, 12.5, 18.5], fov: 42 },
                target: [0, 0.8, 0],
                background: '#b9d6e8',
                light: 'overcast',
                idle: fase === 'klar',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Nordsjøen, {aar} år sia</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Havnivå', value: hav.toFixed(2), unit: 'm' },
                            { label: 'Menneskeliv', value: Math.max(0, generasjoner) },
                        ]}
                    />
                    <DragHint show={fase === 'klar'} corner="bc">
                        Dra leiren til en høyere holme
                    </DragHint>
                    {fase === 'spiller' && <DangerVignette level={fare} />}
                </>
            }
        >
            {fase === 'vunnet' ? (
                    <WinScreen title="Du var blant de siste på Doggerland" onReplay={nullstill}>
                        Fire ganger måtte leiren flyttes, og hver gang holdt det så vidt. Ingen av
                        dem opplevde en flom. De opplevde bare at bestefars fiskeplass lå ute i
                        sjøen. De forlatte ildstedene ligger fortsatt der - på havbunnen, under 50
                        meter vann.
                    </WinScreen>
                ) : fase === 'tapt' ? (
                    <LoseScreen title="Havet tok leiren" onRetry={nullstill}>
                        Vannet stanser aldri. Det stiger bare noen millimeter i året, men det holder
                        ikke å bli stående - du må flytte leiren før holmen du står på er lavere enn
                        havet. Se på høydene: hver holme østover ligger litt høyere.
                    </LoseScreen>
                ) : (
                    <MeterBar
                        value={havAndel}
                        label="Havet stiger"
                        hint="Dra leiren østover. Holmene lengst øst ligger høyest."
                        warnAt={0.16}
                        dangerAt={0.72}
                        labels={{
                            normal: 'Sletta er tørr',
                            warn: 'Holmene krymper',
                            danger: 'Bare Doggerbanken igjen',
                        }}
                    />
            )}
        </MicroGameScaffold>
    );
}
