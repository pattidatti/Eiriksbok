import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    GroundPlane,
    Column,
    Person,
    FlatRing,
    Draggable,
    Interactive,
    Burst,
    damp,
    useShake,
    useGameClock,
    useRandomPulse,
    SceneBanner,
    DataReadout,
    DragHint,
    TimerPill,
    MeterBar,
    WinScreen,
    LoseScreen,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: forbudet mot slavehandel kom ikke fordi noen holdt en god
// tale. Det kom fordi motstanderne la BEVIS på vektskåla raskere enn handelen
// la penger på den andre - og de tapte avstemningen mange ganger før de vant.
//
// Eleven er den som samler inn. Bevis dras opp på forbudssiden. Handelssiden
// blir tyngre av seg selv, hele tida, uten at eleven kan stoppe det. Påstander
// uten bevis veier ingenting og blir brukt mot deg.

const DEBATT_SEKUNDER = 75;
const BJELKE_HALV = 4.2; // halve bjelkelengden
const BJELKE_Y = 5.1;
const HENG = 2.0; // kjettinglengde fra bjelke ned til skål
const SKAAL_TOPP = 0.07; // halve skåltykkelsen
const MAKS_SYNLIG = 4; // hvor mange klosser som tegnes i en stabel
const MAKS_PAA_GULVET = 4;

const START_HANDEL = 2.0;
const BEVIS_VEKT = 1.5;
const PAASTAND_STRAFF = 0.8; // påstand uten bevis styrker motparten
const PENGE_VEKT = 0.7;

const BEVIS_TEKST = [
    'Vitnemål fra sjøfolk',
    'Underskrifter fra hele landet',
    'Bevis fra slaveskipene',
    'Nyheten om opprøret',
    'Rapport til parlamentet',
];
const PAASTAND_TEKST = ['Rykte uten kilde', 'Andrehånds historie', 'Påstand uten bevis'];

type Sort = 'bevis' | 'paastand' | 'penger';
type Spillstatus = 'idle' | 'playing' | 'won' | 'lost';

interface Kloss {
    id: number;
    sort: Sort;
    tekst: string;
    x: number;
    z: number;
}

interface Stabelvare {
    id: number;
    sort: Sort;
}

// Fargen en kloss får når den ligger i en skål.
const STABEL_FARGE: Record<Sort, string> = {
    bevis: '#2f7d5b',
    paastand: '#9aa2ac',
    penger: '#c9a227',
};

// Lite skilt over et objekt, så eleven ser hva klossen er.
function Skilt({
    position,
    tekst,
    farge = '#1e293b',
}: {
    position: [number, number, number];
    tekst: string;
    farge?: string;
}) {
    return (
        <Billboard position={position}>
            <Html center distanceFactor={15} style={{ pointerEvents: 'none' }} zIndexRange={[5, 0]}>
                <div
                    style={{
                        background: farge,
                        color: '#fff',
                        padding: '3px 9px',
                        borderRadius: 7,
                        fontSize: 13,
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        fontFamily: 'Inter, sans-serif',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
                    }}
                >
                    {tekst}
                </div>
            </Html>
        </Billboard>
    );
}

// Selve klossen. Grønn = bevis, grå = påstand uten bevis.
function KlossMesh({ sort }: { sort: Sort }) {
    const bevis = sort === 'bevis';
    return (
        <group>
            <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.1, 0.7, 0.9]} />
                <meshStandardMaterial
                    color={bevis ? '#2f7d5b' : '#9aa2ac'}
                    roughness={0.75}
                />
            </mesh>
            {/* Forsegling/bånd på toppen - gjør bevisklossen tydelig */}
            <mesh position={[0, 0.71, 0]} castShadow>
                <boxGeometry args={[1.14, 0.06, 0.24]} />
                <meshStandardMaterial color={bevis ? '#e8c46a' : '#c3c9d0'} roughness={0.6} />
            </mesh>
        </group>
    );
}

// Skålene henger i bjelken. Bjelken vipper mot den tyngste siden.
function Vektskaal({
    tiltTarget,
    forbudStabel,
    handelStabel,
    burst,
}: {
    tiltTarget: number;
    forbudStabel: Stabelvare[];
    handelStabel: Stabelvare[];
    burst: number;
}) {
    const bjelke = useRef<THREE.Group>(null);
    const venstre = useRef<THREE.Group>(null);
    const hoyre = useRef<THREE.Group>(null);
    const tilt = useRef(0);
    const maal = useRef(tiltTarget);

    useEffect(() => {
        maal.current = tiltTarget;
    }, [tiltTarget]);

    useFrame((_, dt) => {
        tilt.current = damp(tilt.current, maal.current, dt, 3.2);
        const t = tilt.current;
        if (bjelke.current) bjelke.current.rotation.z = t;
        const cos = Math.cos(t);
        const sin = Math.sin(t);
        if (venstre.current) {
            venstre.current.position.set(
                -BJELKE_HALV * cos,
                BJELKE_Y - BJELKE_HALV * sin - HENG,
                0
            );
        }
        if (hoyre.current) {
            hoyre.current.position.set(BJELKE_HALV * cos, BJELKE_Y + BJELKE_HALV * sin - HENG, 0);
        }
    });

    return (
        <group>
            {/* Fot og stolpe - står på gulvet */}
            <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.8, 0.3, 1.8]} />
                <meshStandardMaterial color="#6b5335" roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.65, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.22, 5.0, 14]} />
                <meshStandardMaterial color="#8a6b42" roughness={0.8} />
            </mesh>

            {/* Bjelken vipper om midten */}
            <group ref={bjelke} position={[0, BJELKE_Y, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[BJELKE_HALV * 2 + 0.2, 0.24, 0.36]} />
                    <meshStandardMaterial color="#b08e57" roughness={0.7} />
                </mesh>
            </group>

            <Skaal
                groupRef={venstre}
                farge="#a8543f"
                merke="#d98d6a"
                stabel={handelStabel}
                tittel="Handelen fortsetter"
                tittelFarge="#9a3412"
            />
            <Skaal
                groupRef={hoyre}
                farge="#2f5d7c"
                merke="#7fb2d1"
                stabel={forbudStabel}
                tittel="Forbud"
                tittelFarge="#1d4ed8"
            />

            <Burst position={[BJELKE_HALV, 3.2, 0]} trigger={burst} color="#34d399" count={20} />
        </group>
    );
}

function Skaal({
    groupRef,
    farge,
    merke,
    stabel,
    tittel,
    tittelFarge,
}: {
    groupRef: React.RefObject<THREE.Group | null>;
    farge: string;
    merke: string;
    stabel: Stabelvare[];
    tittel: string;
    tittelFarge: string;
}) {
    const synlig = stabel.slice(-MAKS_SYNLIG);
    return (
        <group ref={groupRef}>
            {/* Kjetting opp til bjelken */}
            <mesh position={[0, HENG / 2, 0]}>
                <cylinderGeometry args={[0.045, 0.045, HENG, 8]} />
                <meshStandardMaterial color="#8d9198" roughness={0.5} metalness={0.4} />
            </mesh>
            {/* Selve skåla - flat sylinder, ligger vannrett */}
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[1.5, 1.35, SKAAL_TOPP * 2, 22]} />
                <meshStandardMaterial color={farge} roughness={0.65} />
            </mesh>
            <FlatRing position={[0, SKAAL_TOPP + 0.01, 0]} radius={1.42} tube={0.06} color={merke} />
            {/* Det som er lagt oppå, stablet fra skålas overflate */}
            {synlig.map((v, i) => (
                <mesh key={v.id} position={[0, SKAAL_TOPP + 0.16 + i * 0.28, 0]} castShadow>
                    <boxGeometry args={[1.0, 0.3, 0.8]} />
                    <meshStandardMaterial color={STABEL_FARGE[v.sort]} roughness={0.75} />
                </mesh>
            ))}
            <Skilt position={[0, -1.15, 0]} tekst={tittel} farge={tittelFarge} />
        </group>
    );
}

function Salen({
    shakeReqRef,
    klosser,
    tiltTarget,
    forbudStabel,
    handelStabel,
    burst,
    spiller,
    onPlassert,
    onKlubbe,
    klubbeKlar,
}: {
    shakeReqRef: React.MutableRefObject<number>;
    klosser: Kloss[];
    tiltTarget: number;
    forbudStabel: Stabelvare[];
    handelStabel: Stabelvare[];
    burst: number;
    spiller: boolean;
    onPlassert: (kloss: Kloss, side: number) => void;
    onKlubbe: () => void;
    klubbeKlar: boolean;
}) {
    const { ref: shakeRef, shake } = useShake(0.22, 0.05);
    const sett = useRef(0);
    useFrame(() => {
        if (shakeReqRef.current !== sett.current) {
            sett.current = shakeReqRef.current;
            shake(0.7);
        }
    });

    return (
        <group ref={shakeRef}>
            <GroundPlane size={40} depth={32} color="#c3ab87" />

            {/* Bakvegg og søylerad - salen, ikke en åker */}
            <mesh position={[0, 2.7, -9.6]} receiveShadow castShadow>
                <boxGeometry args={[20, 5.4, 0.5]} />
                <meshStandardMaterial color="#d8cbb0" roughness={0.95} />
            </mesh>
            {[-7, -3.5, 0, 3.5, 7].map((x) => (
                <Column key={x} position={[x, 0, -8.9]} height={4.4} radius={0.24} color="#efe6d2" />
            ))}

            {/* Representantene som skal stemme */}
            {[-8.0, -6.6, -5.2, 5.2, 6.6, 8.0].map((x, i) => (
                <Person
                    key={x}
                    position={[x, 0, -7.2]}
                    scale={1.7}
                    pose={i % 3 === 0 ? 'raise' : 'idle'}
                    body={i % 2 === 0 ? '#3f4a5c' : '#4a3c4f'}
                    legs="#2e3440"
                    hat="none"
                />
            ))}

            {/* Slippsoner på gulvet, rett under hver skål. Draget skjer langs
                bakken, så det er HER klossen skal slippes - ikke oppe i skåla. */}
            <group>
                <FlatRing position={[-BJELKE_HALV, 0.015, 0]} radius={1.9} tube={0.13} color="#c2705a" />
                <FlatRing position={[-BJELKE_HALV, 0.015, 0]} radius={1.6} tube={0.05} color="#d89b86" />
                <Skilt position={[-BJELKE_HALV, 0.35, 3.2]} tekst="Slipp her: handelen" farge="#9a3412" />
                <FlatRing position={[BJELKE_HALV, 0.015, 0]} radius={1.9} tube={0.13} color="#2f9e6e" />
                <FlatRing position={[BJELKE_HALV, 0.015, 0]} radius={1.6} tube={0.05} color="#7fd9b4" />
                <Skilt position={[BJELKE_HALV, 0.35, 3.2]} tekst="Slipp her: forbud" farge="#15803d" />
            </group>

            <Vektskaal
                tiltTarget={tiltTarget}
                forbudStabel={forbudStabel}
                handelStabel={handelStabel}
                burst={burst}
            />

            {/* Klubba: krev avstemning når du mener du har nok */}
            <Interactive
                onSelect={onKlubbe}
                disabled={!klubbeKlar}
                position={[6.4, 0, 3.8]}
                hitArea={[2.6, 2.6, 2.6]}
                hoverScale={1.1}
                sound="advance"
            >
                <group>
                    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.5, 0.9, 1.1]} />
                        <meshStandardMaterial color="#7a5a34" roughness={0.85} />
                    </mesh>
                    <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.16, 0.16, 0.7, 12]} />
                        <meshStandardMaterial
                            color={klubbeKlar ? '#c9862f' : '#9c9287'}
                            roughness={0.6}
                        />
                    </mesh>
                    <Skilt
                        position={[0, 1.9, 0]}
                        tekst={klubbeKlar ? 'Krev avstemning' : 'Vent til vekta tipper'}
                        farge={klubbeKlar ? '#b45309' : '#78716c'}
                    />
                </group>
            </Interactive>

            {/* Bevis og påstander som kommer inn - dra dem opp på en skål */}
            {klosser.map((k) => (
                <Draggable
                    key={k.id}
                    position={[k.x, 0, k.z]}
                    bounds={{ minX: -9, maxX: 9, minZ: -2.5, maxZ: 8 }}
                    snapPoints={[
                        [-BJELKE_HALV, 0],
                        [BJELKE_HALV, 0],
                    ]}
                    snapRadius={3.0}
                    onSnap={(side) => spiller && onPlassert(k, side)}
                    dropFx="dustPuff"
                >
                    {/* Romslig usynlig gripeflate - trygg på trackpad */}
                    <mesh position={[0, 0.9, 0]}>
                        <boxGeometry args={[2.2, 2.0, 2.0]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <KlossMesh sort={k.sort} />
                    <Skilt
                        position={[0, k.id % 2 === 0 ? 1.15 : 1.75, 0]}
                        tekst={k.tekst}
                        farge={k.sort === 'bevis' ? '#166534' : '#64748b'}
                    />
                </Draggable>
            ))}
        </group>
    );
}

const ParlamentetsVekt3D: React.FC<MicroGameProps> = ({ onComplete, onRetry }) => {
    const sounds = useStepSounds();
    const [status, setStatus] = useState<Spillstatus>('idle');
    const statusRef = useRef<Spillstatus>('idle');
    const [attempt, setAttempt] = useState(0);
    const [klosser, setKlosser] = useState<Kloss[]>([]);
    const [forbudStabel, setForbudStabel] = useState<Stabelvare[]>([]);
    const [handelStabel, setHandelStabel] = useState<Stabelvare[]>([]);
    const [forbud, setForbud] = useState(0);
    const [handel, setHandel] = useState(START_HANDEL);
    const [bomskudd, setBomskudd] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const idRef = useRef(0);
    const forbudRef = useRef(0);
    const handelRef = useRef(START_HANDEL);
    const shakeReqRef = useRef(0);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const avgjor = useCallback(() => {
        if (statusRef.current !== 'playing') return;
        const vant = forbudRef.current > handelRef.current;
        statusRef.current = vant ? 'won' : 'lost';
        setStatus(vant ? 'won' : 'lost');
        sounds.play(vant ? 'complete' : 'incorrect');
    }, [sounds]);

    const clock = useGameClock({
        seconds: DEBATT_SEKUNDER,
        running: status === 'playing',
        onExpire: avgjor,
    });

    // Handelen tjener penger hele tida, helt uavhengig av hva eleven gjør.
    useRandomPulse({
        running: status === 'playing',
        minDelayMs: 3500,
        maxDelayMs: 5500,
        onPulse: () => {
            if (statusRef.current !== 'playing') return;
            handelRef.current += PENGE_VEKT;
            setHandel(handelRef.current);
            setHandelStabel((s) => [...s.slice(-12), { id: ++idRef.current, sort: 'penger' }]);
            setBanner('Nye penger fra handelen la seg på den andre skåla.');
        },
    });

    // Nye bevis og påstander bæres inn i salen.
    useRandomPulse({
        running: status === 'playing',
        minDelayMs: 1700,
        maxDelayMs: 3000,
        onPulse: () => {
            if (statusRef.current !== 'playing') return;
            setKlosser((k) => {
                if (k.length >= MAKS_PAA_GULVET) return k;
                const bevis = Math.random() > 0.35;
                const liste = bevis ? BEVIS_TEKST : PAASTAND_TEKST;
                return [
                    ...k,
                    {
                        id: ++idRef.current,
                        sort: bevis ? 'bevis' : 'paastand',
                        tekst: liste[Math.floor(Math.random() * liste.length)],
                        x: -7 + Math.random() * 14,
                        z: 4.4 + Math.random() * 3.2,
                    },
                ];
            });
        },
    });

    const plasser = useCallback(
        (kloss: Kloss, side: number) => {
            if (statusRef.current !== 'playing') return;
            setKlosser((k) => k.filter((c) => c.id !== kloss.id));

            // side 0 = venstre skål (handelen), side 1 = høyre skål (forbudet)
            if (side === 0) {
                handelRef.current += BEVIS_VEKT * 0.6;
                setHandel(handelRef.current);
                setHandelStabel((s) => [...s.slice(-12), { id: kloss.id, sort: kloss.sort }]);
                setBanner('Du la det på feil skål. Nå hjelper det motparten.');
                shakeReqRef.current += 1;
                sounds.play('incorrect');
                setBomskudd((b) => b + 1);
                return;
            }

            if (kloss.sort === 'bevis') {
                forbudRef.current += BEVIS_VEKT;
                setForbud(forbudRef.current);
                setForbudStabel((s) => [...s.slice(-12), { id: kloss.id, sort: 'bevis' }]);
                setBanner(`Bevis lagt fram: ${kloss.tekst}`);
                setBurst((b) => b + 1);
                sounds.play('correct');
            } else {
                handelRef.current += PAASTAND_STRAFF;
                setHandel(handelRef.current);
                setForbudStabel((s) => [...s.slice(-12), { id: kloss.id, sort: 'paastand' }]);
                setBanner('Påstand uten bevis. Motstanderne brukte det mot deg.');
                shakeReqRef.current += 1;
                sounds.play('incorrect');
                setBomskudd((b) => b + 1);
            }
        },
        [sounds]
    );

    const start = useCallback(() => {
        setAttempt((a) => a + 1);
        setKlosser([]);
        setForbudStabel([]);
        setHandelStabel([]);
        forbudRef.current = 0;
        handelRef.current = START_HANDEL;
        setForbud(0);
        setHandel(START_HANDEL);
        setBomskudd(0);
        setBurst(0);
        setBanner('Dra de grønne bevisene inn i den grønne ringen på gulvet.');
        clock.restart();
        statusRef.current = 'playing';
        setStatus('playing');
    }, [clock]);

    const sendEldsteBevis = useCallback(() => {
        const eldste = klosser.find((k) => k.sort === 'bevis');
        if (eldste) plasser(eldste, 1);
    }, [klosser, plasser]);

    const spiller = status === 'playing';
    const forspranget = forbud - handel;
    // Tyngste side skal ned: positiv tilt løfter høyre side.
    const tiltTarget = Math.max(-0.34, Math.min(0.34, (handel - forbud) * 0.055));
    // Måleren viser hvor stor andel av totalvekta forbudssiden har.
    const andel = forbud + handel > 0 ? forbud / (forbud + handel) : 0;
    const score = Math.max(0.5, 1 - bomskudd * 0.1);

    return (
        <MicroGameScaffold
            title="Vektskåla i parlamentet"
            subtitle="Dra bevisene inn i den grønne ringen. Handelen blir tyngre av seg selv, hele tida."
            estimatedSeconds={165}
            onRetry={status === 'idle' ? onRetry : start}
            scene={
                <Salen
                    key={attempt}
                    shakeReqRef={shakeReqRef}
                    klosser={klosser}
                    tiltTarget={tiltTarget}
                    forbudStabel={forbudStabel}
                    handelStabel={handelStabel}
                    burst={burst}
                    spiller={spiller}
                    onPlassert={plasser}
                    onKlubbe={avgjor}
                    klubbeKlar={spiller && forspranget > 0}
                />
            }
            canvas={{
                camera: { position: [0, 8.5, 22], fov: 44 },
                target: [0, 2.8, 0],
                background: '#e6dcc6',
                fog: { color: '#e6dcc6', near: 34, far: 70 },
                idle: status === 'idle',
                enablePan: false,
                enableZoom: false,
                light: 'overcast',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Forbud', value: Math.round(forbud * 10) / 10 },
                            { label: 'Handelen', value: Math.round(handel * 10) / 10 },
                        ]}
                    />
                    {spiller && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Til avstemning"
                            warnBelow={15}
                            corner="br"
                        />
                    )}
                    <DragHint show={spiller && forbudStabel.length === 0} corner="bc">
                        Dra en grønn kloss inn i den grønne ringen
                    </DragHint>
                </>
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={andel}
                    label="Hvor tung er forbudssiden?"
                    hint="Grønne klosser er bevis og veier. Grå klosser er påstander uten bevis - de veier ingenting og styrker motparten."
                    warnAt={0.35}
                    dangerAt={0.5}
                    labels={{
                        normal: 'Handelen vinner',
                        warn: 'Jevnt',
                        danger: 'Forbudet leder',
                    }}
                />

                {status === 'idle' && (
                    <button
                        onClick={start}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Åpne debatten
                    </button>
                )}

                {spiller && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={avgjor}
                            disabled={forspranget <= 0}
                            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                                forspranget > 0
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            Krev avstemning nå
                        </button>
                        <button
                            onClick={sendEldsteBevis}
                            className="rounded-full px-5 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                            Send inn nærmeste bevis
                        </button>
                        <span className="text-xs text-slate-500">
                            Du kan også klikke klubba til høyre i salen.
                        </span>
                    </div>
                )}

                {status === 'won' && (
                    <WinScreen
                        title="Forslaget gikk gjennom"
                        onReplay={start}
                        onNext={() => onComplete({ score, completed: true })}
                    >
                        Du vant fordi bevisene veide tyngre enn pengene akkurat da det ble stemt.
                        Slik gikk det i 1807, etter at forslaget hadde falt gang på gang i nesten
                        tjue år. Legg merke til hva som faktisk veide: ikke gode ord, men ting noen
                        kunne sjekke.
                    </WinScreen>
                )}

                {status === 'lost' && (
                    <LoseScreen title="Forslaget falt" onRetry={start}>
                        Handelen tjente penger hele tida du brukte på å samle inn, og de pengene la
                        seg på den andre skåla av seg selv. Det er derfor kampen tok så mange år.
                        Prøv igjen: dra flere grønne bevis, og la de grå påstandene ligge.
                    </LoseScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

export default ParlamentetsVekt3D;
