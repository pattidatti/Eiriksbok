import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    FlatRing,
    GlowMaterial,
    GlowHalo,
    Particles,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    DangerVignette,
    MeterBar,
    WinScreen,
    LoseScreen,
    Burst,
    useMeter,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// «Arkivesken» - mikrospill til artikkelen om folkemordet på armenerne.
// Eleven er arkivar. En eske fra et gammelt misjonsarkiv skal registreres, og
// hver mappe må dras til riktig hylle: den som handler om det som skjedde i
// 1915 hører hjemme under emneordet «Armenia 1915», resten under
// «Misjonsarbeid». Samtidig stiger en glemsel-måler: et arkiv som ikke blir
// merket, blir borte.
// Lyspære: et bevis ingen har merket riktig, er like usynlig som et bevis som
// ikke finnes. Bodil Biørns bilder lå i over 80 år under «misjonsarbeid» før
// noen skrev «Armenia» og «folkemord» i katalogen.

type Shelf = 'armenia' | 'misjon';
type Phase = 'ready' | 'playing' | 'won' | 'lost';

interface Mappe {
    id: string;
    tekst: string;
    farge: string;
    riktig: Shelf;
    start: [number, number];
}

// Seks mapper. Fire handler om det som skjedde i 1915, to er vanlig
// foreningspapir. Fargene gjør dem lette å skille fra hverandre i scenen.
const MAPPER: Mappe[] = [
    {
        id: 'foto-barnehjem',
        tekst: 'Foto: barna på barnehjemmet i Musch',
        farge: '#c0563c',
        riktig: 'armenia',
        start: [-5.0, 5.2],
    },
    {
        id: 'notat-sommer',
        tekst: 'Notat om det som skjedde i byen sommeren 1915',
        farge: '#3f6f8f',
        riktig: 'armenia',
        start: [0, 5.2],
    },
    {
        id: 'regnskap',
        tekst: 'Regnskapsbok for innsamlingen i Norge',
        farge: '#d3a13a',
        riktig: 'misjon',
        start: [5.0, 5.2],
    },
    {
        id: 'brev-flyktninger',
        tekst: 'Brev hjem: familier drives mot ørkenen',
        farge: '#7d8f44',
        riktig: 'armenia',
        start: [-5.0, 1.3],
    },
    {
        id: 'sangbok',
        tekst: 'Sangbok fra møtene i bedehuset',
        farge: '#54897f',
        riktig: 'misjon',
        start: [0, 1.3],
    },
    {
        id: 'foto-tomme-hus',
        tekst: 'Foto: tomme hus i landsbyen året etter',
        farge: '#8b5ea6',
        riktig: 'armenia',
        start: [5.0, 1.3],
    },
];

// Hylleplassene på gulvet. Hver mappe har sin egen rute på hver hylle, så to
// mapper aldri havner oppå hverandre.
const ARMENIA_SLOTS: [number, number][] = [
    [2.8, -4.4],
    [4.9, -4.4],
    [7.0, -4.4],
    [2.8, -2.5],
    [4.9, -2.5],
    [7.0, -2.5],
];
const MISJON_SLOTS: [number, number][] = [
    [-7.0, -4.4],
    [-4.9, -4.4],
    [-2.8, -4.4],
    [-7.0, -2.5],
    [-4.9, -2.5],
    [-2.8, -2.5],
];

// Hvor fort glemselen stiger av seg selv (per sekund).
const GLEMSEL_PER_SEK = 0.017;

const Arkivesken3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<Phase>('ready');
    // null = ligger fortsatt på gulvet foran.
    const [plassert, setPlassert] = useState<(Shelf | null)[]>(() => MAPPER.map(() => null));
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const sounds = useStepSounds();

    const glemsel = useMeter({
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.35,
        onOverload: () => setPhase('lost'),
    });
    const { add: addGlemsel, reset: resetGlemsel } = glemsel;

    const registrert = plassert.filter((p) => p !== null).length;
    const riktige = plassert.filter((p, i) => p !== null && p === MAPPER[i].riktig).length;

    // Glemselen stiger så lenge spillet er i gang.
    useEffect(() => {
        if (phase !== 'playing') return;
        const t = setInterval(() => addGlemsel(GLEMSEL_PER_SEK * 0.1), 100);
        return () => clearInterval(t);
    }, [phase, addGlemsel]);

    const start = useCallback(() => {
        setPhase((p) => (p === 'ready' ? 'playing' : p));
    }, []);

    const arkiver = useCallback(
        (index: number, hylle: Shelf) => {
            if (plassert[index] !== null) return;
            const mappe = MAPPER[index];
            const riktig = hylle === mappe.riktig;
            const neste = plassert.slice();
            neste[index] = hylle;
            setPlassert(neste);

            if (riktig) {
                addGlemsel(-0.16);
                setBurst((b) => b + 1);
                sounds.play('correct');
                setBanner(
                    hylle === 'armenia'
                        ? 'Registrert under «Armenia 1915». Nå finner forskerne den.'
                        : 'Riktig hylle. Dette er vanlig foreningspapir.'
                );
            } else {
                addGlemsel(0.14);
                sounds.play('incorrect');
                setBanner(
                    hylle === 'misjon'
                        ? 'Feil hylle. Den forsvinner i «misjonsarbeid» - ingen som søker på Armenia finner den.'
                        : 'Feil hylle. En sangbok er ikke et vitne om 1915.'
                );
            }

            if (neste.every((p) => p !== null)) {
                const treff = neste.filter((p, i) => p === MAPPER[i].riktig).length;
                setPhase('won');
                sounds.play('complete');
                onComplete({ score: treff / MAPPER.length, completed: true });
            }
        },
        [plassert, addGlemsel, sounds, onComplete]
    );

    const reset = useCallback(() => {
        setPlassert(MAPPER.map(() => null));
        setPhase('ready');
        setBanner(null);
        resetGlemsel();
        setAttempt((a) => a + 1);
    }, [resetGlemsel]);

    return (
        <MicroGameScaffold
            title="Arkivesken"
            subtitle="Du er arkivar. Dra hver mappe til riktig hylle før glemselen tar esken."
            estimatedSeconds={140}
            onRetry={registrert > 0 || phase === 'lost' ? reset : undefined}
            canvas={{
                idle: phase === 'ready',
                autoRotateSpeed: 0.25,
                camera: { position: [0, 12.5, 19.5], fov: 46 },
                background: '#e7dbc2',
                fog: { color: '#e7dbc2', near: 30, far: 58 },
                light: 'golden',
                target: [0, 1.4, -0.6],
            }}
            containerClassName="bg-gradient-to-b from-[#f0e6d2] via-[#e7dbc2] to-[#cbb894]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Riksarkivet</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Registrert', value: `${registrert}/${MAPPER.length}` },
                            { label: 'Søkbare', value: riktige },
                        ]}
                    />
                    <DragHint show={phase === 'ready'} corner="bc">
                        Dra en mappe til en hylle - tida starter når du tar den første
                    </DragHint>
                    <DangerVignette level={glemsel.value} />
                </>
            }
            scene={
                <ArkivRom
                    key={attempt}
                    plassert={plassert}
                    burst={burst}
                    faresone={glemsel.value}
                    onGrab={start}
                    onFile={arkiver}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {phase === 'won' ? (
                    <WinScreen title="Esken er registrert" onReplay={reset}>
                        {riktige === MAPPER.length
                            ? 'Alle fire mappene om 1915 ligger nå under emneordet «Armenia 1915». En forsker som søker på Armenia finner dem med en gang. Slik gikk det til på ekte: Bodil Biørns bilder og notater lå i Riksarkivet i over 80 år under «misjonsarbeid», til en arkivar skrev Armenia og folkemord inn i katalogen (Kvalnes, 2021).'
                            : `Du fikk ${riktige} av ${MAPPER.length} på riktig hylle. De som havnet feil, ligger fortsatt der - men ingen som søker på Armenia vil finne dem. Et bevis ingen har merket riktig, er like usynlig som et bevis som ikke finnes.`}
                    </WinScreen>
                ) : phase === 'lost' ? (
                    <LoseScreen title="Esken ble stående umerket" onRetry={reset}>
                        Den ble satt tilbake i hylla med lappen «misjonsarbeid» på lokket. Slik lå
                        Bodil Biørns fotografier fra Musch i over 80 år: bevart, men usynlige, fordi
                        katalogen ikke sa et ord om Armenia.
                    </LoseScreen>
                ) : (
                    <>
                        <MeterBar
                            value={glemsel.value}
                            label="Glemsel"
                            hint="Hver mappe du merker riktig, presser glemselen ned"
                            labels={{ normal: 'Under kontroll', warn: 'Støver ned', danger: 'GLEMT!' }}
                        />
                        <p className="text-sm text-slate-600 leading-snug">
                            Fire av mappene handler om det som skjedde i 1915. To er helt vanlig
                            foreningspapir. Bare det du merker med{' '}
                            <span className="font-bold text-amber-700">Armenia 1915</span> kan
                            forskere finne igjen senere.
                        </p>
                    </>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function ArkivRom({
    plassert,
    burst,
    faresone,
    onGrab,
    onFile,
}: {
    plassert: (Shelf | null)[];
    burst: number;
    faresone: number;
    onGrab: () => void;
    onFile: (index: number, hylle: Shelf) => void;
}) {
    return (
        <group>
            {/* Tregulvet i magasinet */}
            <GroundPlane size={30} depth={26} color="#8d7350" />

            {/* Bakvegg i lys puss */}
            <mesh position={[0, 2.9, -9.2]} receiveShadow>
                <boxGeometry args={[20, 5.8, 0.4]} />
                <meshStandardMaterial color="#e8dcc4" roughness={1} />
            </mesh>

            {/* De to reolene med skiltene sine */}
            <Reol
                x={-4.9}
                farge="#7d6a52"
                skilt="MISJONSARBEID"
                skiltFarge="#64748b"
                lys={false}
            />
            <Reol x={4.9} farge="#8a6a3e" skilt="ARMENIA 1915" skiltFarge="#b45309" lys />

            {/* Gulvruter foran reolene */}
            {MISJON_SLOTS.map((s, i) => (
                <FlatRing
                    key={`m${i}`}
                    position={[s[0], 0.012, s[1]]}
                    radius={0.85}
                    tube={0.05}
                    color="#a8a29e"
                />
            ))}
            {ARMENIA_SLOTS.map((s, i) => (
                <FlatRing
                    key={`a${i}`}
                    position={[s[0], 0.012, s[1]]}
                    radius={0.85}
                    tube={0.05}
                    color="#d9a441"
                />
            ))}

            {/* Lampe i taket over rommet */}
            <Taklampe />

            {/* Mappene */}
            {MAPPER.map((m, i) => {
                const hylle = plassert[i];
                if (hylle) {
                    const slot = hylle === 'armenia' ? ARMENIA_SLOTS[i] : MISJON_SLOTS[i];
                    const riktig = hylle === m.riktig;
                    return (
                        <group key={m.id} position={[slot[0], 0, slot[1]]}>
                            <MappeMesh farge={riktig ? m.farge : '#9aa0a6'} loft={riktig} />
                        </group>
                    );
                }
                return (
                    <Draggable
                        key={m.id}
                        position={[m.start[0], 0, m.start[1]]}
                        planeY={0}
                        bounds={{ minX: -8.2, maxX: 8.2, minZ: -5.4, maxZ: 6.2 }}
                        snapPoints={[ARMENIA_SLOTS[i], MISJON_SLOTS[i]]}
                        snapRadius={1.7}
                        liftY={0.55}
                        onDragStart={onGrab}
                        onSnap={(slotIndex) => onFile(i, slotIndex === 0 ? 'armenia' : 'misjon')}
                    >
                        {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                        <mesh>
                            <boxGeometry args={[2.1, 1.4, 2.1]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                        <MappeMesh farge={m.farge} loft={false} />
                        <Html center position={[0, 1.15, 0]} style={{ pointerEvents: 'none' }}>
                            <div
                                style={{
                                    width: '106px',
                                    fontSize: '9.5px',
                                    lineHeight: 1.22,
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    color: '#1e293b',
                                    background: 'rgba(255,255,255,0.93)',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    padding: '4px 6px',
                                }}
                            >
                                {m.tekst}
                            </div>
                        </Html>
                    </Draggable>
                );
            })}

            {/* Støv i lufta - og mer av det når glemselen stiger */}
            <Stovsky niva={faresone} />

            <Burst position={[4.9, 1.2, -3.4]} trigger={burst} color="#f5c451" count={20} spread={2.2} />
        </group>
    );
}

// En arkivmappe: en flat eske med en papirkant som stikker opp.
function MappeMesh({ farge, loft }: { farge: string; loft: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        // Riktig arkiverte mapper hever seg et lite hakk - en synlig kvittering.
        ref.current.position.y = damp(ref.current.position.y, loft ? 0.08 : 0, dt, 5);
    });
    return (
        <group ref={ref}>
            <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.35, 0.32, 1.0]} />
                <meshStandardMaterial color={farge} roughness={0.85} />
            </mesh>
            {/* Papirbunken som stikker opp av mappa */}
            <mesh position={[0, 0.37, 0]} castShadow>
                <boxGeometry args={[1.15, 0.12, 0.82]} />
                <meshStandardMaterial color="#f4ecdc" roughness={1} />
            </mesh>
        </group>
    );
}

// En reol mot bakveggen, med skiltet sitt over.
function Reol({
    x,
    farge,
    skilt,
    skiltFarge,
    lys,
}: {
    x: number;
    farge: string;
    skilt: string;
    skiltFarge: string;
    lys: boolean;
}) {
    return (
        <group position={[x, 0, -7.3]}>
            {/* Selve reolen står på gulvet */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[7.0, 3.0, 1.1]} />
                <meshStandardMaterial color={farge} roughness={0.95} />
            </mesh>
            {/* Hylleskiller */}
            {[0.72, 1.5, 2.28].map((y) => (
                <mesh key={y} position={[0, y, 0.58]}>
                    <boxGeometry args={[6.8, 0.09, 0.06]} />
                    <meshStandardMaterial color="#5b4a35" roughness={1} />
                </mesh>
            ))}
            {/* Skiltet over reolen */}
            <Html center position={[0, 3.7, 0]} style={{ pointerEvents: 'none' }}>
                <div
                    style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        color: '#ffffff',
                        background: skiltFarge,
                        borderRadius: '7px',
                        padding: '3px 12px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(15,23,42,0.25)',
                    }}
                >
                    {skilt}
                </div>
            </Html>
            {/* Varmt lys over den hylla som gjør esken søkbar. Haloen holdes over
                gulvet, så ingen geometri stikker ned under bakken. */}
            {lys && (
                <group position={[0, 2.1, 0.8]}>
                    <GlowHalo color="#f7d089" size={1.95} opacity={0.42} />
                </group>
            )}
        </group>
    );
}

// Lampe som henger over magasinet.
function Taklampe() {
    return (
        <group position={[0, 4.4, -1.6]}>
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
                <meshStandardMaterial color="#4b5563" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.1, 0]}>
                <coneGeometry args={[0.85, 0.6, 16, 1, true]} />
                <meshStandardMaterial color="#3f4854" roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.32, 0]}>
                <sphereGeometry args={[0.24, 14, 14]} />
                <GlowMaterial color="#ffd88a" />
            </mesh>
            <GlowHalo color="#ffd88a" size={1.5} />
        </group>
    );
}

// Støv i lufta. Tettheten øker med glemselen, så eleven SER at esken støver ned.
function Stovsky({ niva }: { niva: number }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const mal = 0.35 + niva * 0.65;
        const s = damp(ref.current.scale.x, mal, dt, 2);
        ref.current.scale.setScalar(s);
    });
    return (
        <group ref={ref} userData={{ sceneAuditIgnore: true }}>
            <Particles preset="dust" area={[24, 20]} center={[0, 0, -1]} height={6} />
        </group>
    );
}

export default Arkivesken3D;
