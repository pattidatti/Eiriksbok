import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Seascape,
    Boat,
    Building,
    Rock,
    Torch,
    Draggable,
    Hotspot,
    Mover,
    Particles,
    Burst,
    GlowMaterial,
    useAmbience,
    damp,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    WinScreen,
    LoseScreen,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: fønikerne solgte sedertre, purpur og glass - varer som ble
// brukt opp. Skrifttegnene de tok med seg ble derimot kopiert i hver havn og
// ble liggende igjen. Eleven har bare to plasser om bord og må velge. Seiler
// hen uten skrivetavla, kommer varene fram, men alfabetet blir igjen i Tyros.

const DEKKSPLASSER = 2;
const FART = 2.2;
const SEILINGSLINJE = 4.6;

interface Vare {
    id: string;
    navn: string;
    farge: string;
    hjem: [number, number];
    tegn: boolean;
}

// Varene står på brygga i Tyros (y = PLATA_TOPP). hjem er [x, z] på brygga.
const VARER: Vare[] = [
    { id: 'sedertre', navn: 'Sedertre', farge: '#8b5a2b', hjem: [8.2, 3.0], tegn: false },
    { id: 'purpur', navn: 'Purpurstoff', farge: '#6b2d6b', hjem: [9.2, 3.0], tegn: false },
    { id: 'glass', navn: 'Glass', farge: '#4fb3a4', hjem: [10.2, 3.0], tegn: false },
    { id: 'tavle', navn: 'Skrivetavle', farge: '#e6dcc3', hjem: [11.2, 3.0], tegn: true },
];

const HAVNER = [
    { id: 'tyros', navn: 'Tyros', x: 9.6 },
    { id: 'kypros', navn: 'Kypros', x: 3.2 },
    { id: 'kartago', navn: 'Kartago', x: -3.2 },
    { id: 'gadir', navn: 'Gadir', x: -9.6 },
];

const PLATA_TOPP = 1.0;
const VANNLINJE = 0.05;
const BAT_START: [number, number, number] = [8.0, VANNLINJE, SEILINGSLINJE];

const ANKOMST_TEKST = [
    'Kypros: kobber inn, varer ut. Havna vokser.',
    'Kartago: nybygget koloni. Handelen fyller lagerhusene.',
    'Gadir, ytterst i vest. Lengre kom ingen.',
];

type Spillfase = 'laster' | 'seiler' | 'vant' | 'tapte';

// ── Last: en kasse på kaia eller om bord ─────────────────────────────────────
function Kasse({ vare, scale = 1 }: { vare: Vare; scale?: number }) {
    if (vare.tegn) {
        // Skrivetavla: lys leirtavle med glødende tegn. Samme motiv som steinen
        // som reiser seg i havnene - det er selve poenget at de ligner.
        return (
            <group scale={scale}>
                <mesh position={[0, 0.26, 0]} castShadow>
                    <boxGeometry args={[0.44, 0.52, 0.14]} />
                    <meshStandardMaterial color={vare.farge} roughness={0.85} />
                </mesh>
                {[0.36, 0.26, 0.16].map((y, i) => (
                    <mesh key={y} position={[i === 1 ? -0.03 : 0, y, 0.08]}>
                        <boxGeometry args={[0.26 - i * 0.05, 0.035, 0.02]} />
                        <GlowMaterial color="#c2410c" />
                    </mesh>
                ))}
            </group>
        );
    }
    if (vare.id === 'glass') {
        return (
            <group scale={scale}>
                <mesh position={[0, 0.24, 0]} castShadow>
                    <cylinderGeometry args={[0.16, 0.22, 0.48, 10]} />
                    <meshStandardMaterial color={vare.farge} roughness={0.35} />
                </mesh>
                <mesh position={[0, 0.52, 0]}>
                    <cylinderGeometry args={[0.09, 0.13, 0.12, 10]} />
                    <meshStandardMaterial color="#2f8377" roughness={0.4} />
                </mesh>
            </group>
        );
    }
    if (vare.id === 'purpur') {
        return (
            <group scale={scale}>
                <mesh position={[0, 0.22, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.44, 0.46]} />
                    <meshStandardMaterial color={vare.farge} roughness={0.95} />
                </mesh>
                <mesh position={[0, 0.44, 0]}>
                    <boxGeometry args={[0.52, 0.06, 0.48]} />
                    <meshStandardMaterial color="#9d4edd" roughness={0.9} />
                </mesh>
            </group>
        );
    }
    return (
        <group scale={scale}>
            <mesh position={[0, 0.2, 0]} castShadow>
                <boxGeometry args={[0.54, 0.4, 0.48]} />
                <meshStandardMaterial color={vare.farge} roughness={0.95} />
            </mesh>
            <mesh position={[0, 0.42, 0]} castShadow>
                <boxGeometry args={[0.5, 0.08, 0.44]} />
                <meshStandardMaterial color="#a9743d" roughness={0.95} />
            </mesh>
        </group>
    );
}

// ── Skipet med lasten om bord ────────────────────────────────────────────────
function Skip({ last }: { last: Vare[] }) {
    return (
        <group scale={1.35}>
            <Boat color="#7a5232" sail="#efe2c4" />
            {last.map((vare, i) => (
                <group key={vare.id} position={[i === 0 ? -0.32 : 0.32, 0.72, -0.5]}>
                    <Kasse vare={vare} scale={0.85} />
                </group>
            ))}
        </group>
    );
}

// ── Vekst: myk oppskalering når en havn blomstrer ────────────────────────────
function Vekst({ aktiv, children }: { aktiv: boolean; children: React.ReactNode }) {
    const ref = useRef<THREE.Group>(null);
    const [synlig, setSynlig] = useState(false);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.x, aktiv ? 1 : 0.001, dt, 2.8);
        g.scale.setScalar(s);
        const na = s > 0.06;
        if (na !== synlig) setSynlig(na);
    });
    return (
        <group ref={ref} scale={0.001} visible={synlig}>
            {children}
        </group>
    );
}

// ── Skriftsteinen: reiser seg i havna når tegnene kom med skipet ─────────────
function Skriftstein({ x }: { x: number }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        g.scale.y = damp(g.scale.y, 1, dt, 2.4);
        g.scale.x = damp(g.scale.x, 1, dt, 2.4);
        g.scale.z = damp(g.scale.z, 1, dt, 2.4);
    });
    return (
        <group ref={ref} position={[x - 2.0, PLATA_TOPP, 1.4]} scale={0.001}>
            <mesh position={[0, 0.72, 0]} castShadow>
                <boxGeometry args={[0.98, 1.44, 0.2]} />
                <meshStandardMaterial color="#e6dcc3" roughness={0.85} />
            </mesh>
            {[1.06, 0.82, 0.58, 0.34].map((y, i) => (
                <mesh key={y} position={[i % 2 === 0 ? -0.06 : 0.05, y, 0.12]}>
                    <boxGeometry args={[0.62 - (i % 3) * 0.14, 0.07, 0.03]} />
                    <GlowMaterial color="#c2410c" />
                </mesh>
            ))}
        </group>
    );
}

// ── Havn: øy med kai, hus som vokser og fakkel som tennes ────────────────────
function Havn({
    x,
    aktiv,
    medTegn,
    start,
}: {
    x: number;
    aktiv: boolean;
    medTegn: boolean;
    start: boolean;
}) {
    return (
        <group>
            {/* Øya. Toppen ligger på PLATA_TOPP - alt annet står på den. */}
            <mesh position={[x, PLATA_TOPP / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[5.4, PLATA_TOPP, 4.4]} />
                <meshStandardMaterial color="#cdbb92" roughness={1} />
            </mesh>
            <Rock position={[x + 2.2, PLATA_TOPP + 0.18, 1.5]} scale={0.5} color="#9a9384" />
            <Rock position={[x + 2.1, PLATA_TOPP + 0.18, -1.6]} scale={0.46} color="#a29a8a" />

            {/* Ett hus står der fra før i alle havner. */}
            <Building
                position={[x - 1.8, PLATA_TOPP, 0.7]}
                w={1.7}
                h={1.3}
                d={1.5}
                body="#efe0c4"
                roof="#a2643c"
                seed={Math.round(x) + 5}
            />

            {/* Handelen får havna til å vokse. */}
            <Vekst aktiv={aktiv || start}>
                <Building
                    position={[x + 0.5, PLATA_TOPP, 0.9]}
                    w={2}
                    h={1.8}
                    d={1.7}
                    body="#f4e8cf"
                    roof="#8f5330"
                    seed={Math.round(x) + 11}
                />
                <Building
                    position={[x + 1.8, PLATA_TOPP, -0.9]}
                    w={1.6}
                    h={1.2}
                    d={1.4}
                    body="#e8d8b8"
                    roof="#a2643c"
                    seed={Math.round(x) + 17}
                />
            </Vekst>

            <Torch position={[x - 2.1, PLATA_TOPP, -1.5]} height={1.5} lit={aktiv || start} />

            {/* Tyros har brygga der lasten står. Toppen ligger i samme høyde som
                øya, så kassene står på fast underlag - ikke på vannet. */}
            {start && (
                <mesh position={[x + 0.1, PLATA_TOPP / 2, 3.0]} receiveShadow castShadow>
                    <boxGeometry args={[4.8, PLATA_TOPP, 1.8]} />
                    <meshStandardMaterial color="#b9a583" roughness={1} />
                </mesh>
            )}

            {medTegn && <Skriftstein x={x} />}
        </group>
    );
}

// ── Scenen ───────────────────────────────────────────────────────────────────
function ReiseScene({
    fase,
    last,
    lastet,
    naddeHavner,
    medTegn,
    onLast,
    onBom,
    onSeil,
    onFramme,
}: {
    fase: Spillfase;
    last: Vare[];
    lastet: string[];
    naddeHavner: number;
    medTegn: boolean;
    onLast: (id: string) => void;
    onBom: () => void;
    onSeil: () => void;
    onFramme: () => void;
}) {
    const traff = useRef(false);
    const seiler = fase === 'seiler';
    const legg = Math.min(naddeHavner, HAVNER.length - 2);
    // Startpunktet følger hvor mange havner skipet har nådd - ikke om det
    // seiler akkurat nå. Ellers hopper skipet hjem til Tyros i det siste
    // ankomsten setter fasen til vant/tapte.
    const fra: [number, number, number] =
        naddeHavner === 0
            ? BAT_START
            : [HAVNER[naddeHavner].x, VANNLINJE, SEILINGSLINJE];
    const til: [number, number, number] = [HAVNER[legg + 1].x, VANNLINJE, SEILINGSLINJE];

    const dekkPunkter = useMemo<[number, number][]>(
        () => [
            [BAT_START[0] - 0.7, SEILINGSLINJE],
            [BAT_START[0] + 0.7, SEILINGSLINJE],
        ],
        []
    );

    return (
        <>
            <Seascape position={[0, 0, 0]} size={[84, 74]} waterY={VANNLINJE} color="#3aa8cd">
                {fase !== 'laster' ? (
                    <Mover
                        key={`legg-${naddeHavner}`}
                        from={fra}
                        to={til}
                        speed={FART}
                        state={seiler ? 'moving' : 'frozen'}
                        bob={0.03}
                        face
                        onArrive={onFramme}
                    >
                        <Skip last={last} />
                    </Mover>
                ) : (
                    <group position={BAT_START} rotation={[0, -Math.PI / 2, 0]}>
                        <Skip last={last} />
                    </group>
                )}
            </Seascape>

            {HAVNER.map((h, i) => (
                <Havn
                    key={h.id}
                    x={h.x}
                    start={i === 0}
                    aktiv={i > 0 && i <= naddeHavner}
                    medTegn={i === 0 || (medTegn && i <= naddeHavner)}
                />
            ))}

            {/* Last som ennå står på kaia i Tyros. */}
            {fase === 'laster' &&
                VARER.filter((v) => !lastet.includes(v.id)).map((vare) => (
                    <Draggable
                        key={`${vare.id}-${lastet.length}`}
                        position={[vare.hjem[0], PLATA_TOPP, vare.hjem[1]]}
                        planeY={PLATA_TOPP}
                        snapPoints={dekkPunkter}
                        snapRadius={1.7}
                        liftY={0.5}
                        dropFx="dustPuff"
                        onDragStart={() => {
                            traff.current = false;
                        }}
                        onSnap={() => {
                            traff.current = true;
                            onLast(vare.id);
                        }}
                        onDrop={() => {
                            if (!traff.current) onBom();
                        }}
                    >
                        {/* Romslig usynlig gripeflate - trygg på trackpad. */}
                        <mesh position={[0, 0.4, 0]}>
                            <boxGeometry args={[1.5, 1.4, 1.5]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                        <Kasse vare={vare} scale={1.3} />
                    </Draggable>
                ))}

            {/* Kast loss: åpen først når skipet er fullastet. */}
            {fase === 'laster' && lastet.length >= DEKKSPLASSER && (
                <Hotspot
                    position={[BAT_START[0] - 2.9, 1.7, SEILINGSLINJE]}
                    onSelect={onSeil}
                    label="Kast loss"
                    radius={0.7}
                    color="#f59e0b"
                />
            )}

            <Burst position={[HAVNER[3].x, 2.4, 0]} trigger={fase === 'vant' ? 1 : 0} />

            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="motes" />
            </group>
        </>
    );
}

// ── Spillet ──────────────────────────────────────────────────────────────────
const AlfabetetsReise3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [fase, setFase] = useState<Spillfase>('laster');
    const [lastet, setLastet] = useState<string[]>([]);
    const [naddeHavner, setNaddeHavner] = useState(0);
    const [banner, setBanner] = useState('Dra to laster om bord. Du har bare plass til to.');
    const [forsok, setForsok] = useState(0);
    const havnRef = useRef(0);
    const { play } = useStepSounds();
    const { start: startAmbience } = useAmbience('waves');

    const last = useMemo(
        () => lastet.map((id) => VARER.find((v) => v.id === id)!).filter(Boolean),
        [lastet]
    );
    const medTegn = last.some((v) => v.tegn);

    const handleLast = useCallback(
        (id: string) => {
            setLastet((forrige) => {
                if (forrige.includes(id) || forrige.length >= DEKKSPLASSER) return forrige;
                const neste = [...forrige, id];
                const vare = VARER.find((v) => v.id === id);
                play('correct');
                setBanner(
                    neste.length >= DEKKSPLASSER
                        ? 'Skipet er fullt. Klikk den gule knappen ved skipet for å kaste loss.'
                        : `${vare?.navn} er om bord. Én plass igjen.`
                );
                return neste;
            });
        },
        [play]
    );

    const handleBom = useCallback(() => {
        setBanner('Lasten må slippes oppe på dekket. Dra den helt bort til skipet.');
    }, []);

    const handleSeil = useCallback(() => {
        setFase('seiler');
        setBanner('Kursen går vestover langs kysten.');
        startAmbience();
        play('advance');
    }, [play, startAmbience]);

    // Ankomsten avgjøres i selve hendelsen. Tellingen ligger i en ref slik at
    // state-oppdateringen holdes ren (ingen bivirkninger i en updater-funksjon).
    const handleFramme = useCallback(() => {
        const neste = havnRef.current + 1;
        havnRef.current = neste;
        setNaddeHavner(neste);
        if (neste >= HAVNER.length - 1) {
            if (medTegn) {
                play('complete');
                setFase('vant');
                setBanner('Gadir, ytterst i vest. Tegnene fulgte med hele veien.');
            } else {
                play('incorrect');
                setFase('tapte');
                setBanner('Gadir fikk varene. Men ingen tegn kom i land.');
            }
        } else {
            play('advance');
            setBanner(ANKOMST_TEKST[neste - 1]);
        }
    }, [medTegn, play]);

    const nullstill = useCallback(() => {
        setFase('laster');
        setLastet([]);
        setNaddeHavner(0);
        havnRef.current = 0;
        setBanner('Dra to laster om bord. Du har bare plass til to.');
        setForsok((f) => f + 1);
    }, []);

    return (
        <MicroGameScaffold
            title="Alfabetets reise"
            subtitle="Last skipet i Tyros og seil vestover over Middelhavet"
            estimatedSeconds={150}
            aspectRatio="16/9"
            onRetry={nullstill}
            canvas={{
                camera: { position: [0, 10.5, 20] as [number, number, number], fov: 46 },
                target: [0.4, 1.1, 1.4] as [number, number, number],
                background: '#c6e6f4',
                fog: { color: '#dcf0f8', near: 30, far: 74 },
                light: 'golden',
            }}
            containerClassName="bg-gradient-to-b from-[#b4dcee] via-[#d6ebf3] to-[#ecdfc2]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={
                            fase === 'laster'
                                ? [{ label: 'Lastet', value: lastet.length, unit: `/${DEKKSPLASSER}` }]
                                : [{ label: 'Havner nådd', value: naddeHavner, unit: '/3' }]
                        }
                    />
                    <SceneBadge corner="br">Middelhavet, ca. 1000 fvt</SceneBadge>
                    <DragHint show={fase === 'laster' && lastet.length === 0} corner="bc">
                        Dra en last fra kaia og slipp den på dekket
                    </DragHint>
                </>
            }
            scene={
                <ReiseScene
                    key={forsok}
                    fase={fase}
                    last={last}
                    lastet={lastet}
                    naddeHavner={naddeHavner}
                    medTegn={medTegn}
                    onLast={handleLast}
                    onBom={handleBom}
                    onSeil={handleSeil}
                    onFramme={handleFramme}
                />
            }
        >
            {fase === 'laster' && (
                <div className="space-y-2">
                    <p className="text-xs text-slate-600 text-center leading-relaxed">
                        Du er kjøpmann i Tyros. Fire laster står på kaia, men skipet har bare to
                        plasser. Tenk over hva som er mest verdt å ta med vestover.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {VARER.map((v) => (
                            <span
                                key={v.id}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                                    lastet.includes(v.id)
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-white border-slate-200 text-slate-600'
                                }`}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: v.farge }}
                                />
                                {v.navn}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {fase === 'seiler' && (
                <p className="text-xs text-slate-600 text-center leading-relaxed">
                    Skipet går fra havn til havn langs kysten. Se hva hver havn sitter igjen med
                    etter at skipet har vært innom.
                </p>
            )}

            {fase === 'tapte' && (
                <LoseScreen title="Varene kom fram. Tegnene ble igjen." onRetry={nullstill}>
                    Lasten ble solgt og brukt opp. Treet ble bygd inn i hus, stoffet ble slitt
                    ut, og krukkene gikk i stykker. Om noen år var alt borte, og ingen i vest
                    kunne skrive ned en handel. Prøv igjen, og ta med skrivetavla. Den er den
                    eneste lasten som kan kopieres i hver havn uten at det blir mindre igjen av
                    den.
                </LoseScreen>
            )}

            {fase === 'vant' && (
                <WinScreen
                    title="Tegnene nådde helt til Gadir"
                    onReplay={nullstill}
                    onNext={() => onComplete({ score: 1, completed: true })}
                >
                    Sedertreet ble brukt opp og purpuren ble slitt ut, men skrifttegnene ble
                    kopiert i hver eneste havn. Derfor overlevde alfabetet både skipene og byene
                    som fraktet det. Grekerne lånte de samme tegnene rundt 900 fvt og la til
                    vokaler. Det er den linja som ender i bokstavene du leser nå.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default AlfabetetsReise3D;
