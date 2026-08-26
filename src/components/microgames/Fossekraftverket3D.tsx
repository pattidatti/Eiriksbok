import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    GroundPlane,
    WaterPlane,
    Building,
    Tree,
    Rock,
    FlatRing,
    Smoke,
    Gear,
    Draggable,
    Hotspot,
    Burst,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    WinScreen,
    LoseScreen,
    DangerVignette,
    SceneSlider,
    StepTracker,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Fossekraftverket - mikrospillet til artikkelen om fossekraften.
//
// Lyspære-øyeblikket: fossen er ikke kraft i seg selv. Den blir kraft først
// når du bygger demning, rørgate og kraftstasjon - og magasinet i fjellet er
// batteriet ditt. Åpner du luka helt, tømmer du batteriet på sekunder og
// fabrikken stopper. Lukker du den, blir ovnene kalde. Kunsten er å dosere.
//
// Del 1: bygg anlegget (dra demningen på plass, klikk rørgata nedover fjellet,
// dra kraftstasjonen ned i dalen).
// Del 2: sanntid. Styr luka i demningen, hold ovnene varme, og produser
// 100 sekker kunstgjodsel for magasinet er tomt eller tida gar ut.

// ---------- Geometri: en fjellside i Vestfjorddalen ----------
// Platået ligger i vest (x -13..-4, topp y=6). Skråningen går fra A ned til B,
// dalbunnen ligger på y=0 i øst. Alt flukter mot sitt eget underlag.
const SLOPE_A: [number, number] = [-4, 6]; // toppen av skråningen (x, y)
const SLOPE_B: [number, number] = [2.4, 0]; // foten av skråningen (x, y)

const SLOPE_DX = SLOPE_B[0] - SLOPE_A[0];
const SLOPE_DY = SLOPE_B[1] - SLOPE_A[1];
const SLOPE_LEN = Math.hypot(SLOPE_DX, SLOPE_DY);
const SLOPE_ANGLE = Math.atan2(SLOPE_DY, SLOPE_DX);
// Normalen som peker opp fra skråningsflaten
const SLOPE_NX = -SLOPE_DY / SLOPE_LEN;
const SLOPE_NY = SLOPE_DX / SLOPE_LEN;
const SLAB_HALF = 0.6;
// Skråningsplata legges slik at overflaten treffer nøyaktig A og B
const SLAB_CENTER: [number, number, number] = [
    (SLOPE_A[0] + SLOPE_B[0]) / 2 - SLOPE_NX * SLAB_HALF,
    (SLOPE_A[1] + SLOPE_B[1]) / 2 - SLOPE_NY * SLAB_HALF,
    0,
];

const PIPE_R = 0.3;
const PIPE_LIFT = SLAB_HALF * 0 + PIPE_R + 0.04; // rørets senterlinje hviler på flaten
const PIPE_TOP: [number, number, number] = [
    SLOPE_A[0] + SLOPE_NX * PIPE_LIFT,
    SLOPE_A[1] + SLOPE_NY * PIPE_LIFT,
    0,
];
const PIPE_BOTTOM: [number, number, number] = [
    SLOPE_B[0] + SLOPE_NX * PIPE_LIFT,
    SLOPE_B[1] + SLOPE_NY * PIPE_LIFT,
    0,
];

function pipePoint(t: number): [number, number, number] {
    return [
        PIPE_TOP[0] + (PIPE_BOTTOM[0] - PIPE_TOP[0]) * t,
        PIPE_TOP[1] + (PIPE_BOTTOM[1] - PIPE_TOP[1]) * t,
        0,
    ];
}

const DAM_SNAP: [number, number] = [-4.6, 0]; // der demningen skal stå (x, z) på platået
const DAM_Y = 6; // platåtoppen
const HOUSE_SNAP: [number, number] = [3.9, 0]; // der kraftstasjonen skal stå i dalen

// ---------- Spillbalanse ----------
const MAGASIN_START = 60; // prosent fullt magasin
const TILSIG = 4; // prosent per sekund som renner inn fra fjellet
const UTTAK_MAX = 20; // prosent per sekund ved helt åpen luke
const OVN_GRENSE = 25; // under dette står ovnene
const KALD_TOLERANSE = 8; // sekunder ovnene tåler å være kalde
const MAAL_SEKKER = 100;
const TID = 55; // sekunder

const COL = {
    sky: '#cfe3ef',
    fjell: '#8d9096',
    fjellTopp: '#9aa0a6',
    dal: '#7c9a5c',
    vann: '#4d7f9c',
    ror: '#6b5344',
    betong: '#b9bcc0',
    tegl: '#9c4a34',
};

type Phase = 'bygg' | 'kjor' | 'vunnet' | 'tapt';

// ---------- Små scene-deler ----------

function PipeSegment({ t0, t1 }: { t0: number; t1: number }) {
    const { pos, quat, len } = useMemo(() => {
        const a = new THREE.Vector3(...pipePoint(t0));
        const b = new THREE.Vector3(...pipePoint(t1));
        const dir = new THREE.Vector3().subVectors(b, a);
        const l = dir.length();
        const q = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir.clone().normalize()
        );
        const p = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        return { pos: p, quat: q, len: l };
    }, [t0, t1]);

    return (
        <group>
            <mesh position={pos} quaternion={quat} castShadow>
                <cylinderGeometry args={[PIPE_R, PIPE_R, len, 14]} />
                <meshStandardMaterial color={COL.ror} roughness={0.6} metalness={0.25} />
            </mesh>
            {/* Bærebukk under røret, så det ikke ser ut til å sveve */}
            <mesh position={[pos.x, pos.y - 0.35, 0]} quaternion={quat}>
                <boxGeometry args={[0.16, 0.5, 0.16]} />
                <meshStandardMaterial color="#5b5b55" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Vanndråper som renner nedover rørgata når luka er åpen.
const DRAAPER = [0, 0.2, 0.4, 0.6, 0.8];

function Vannstrom({ luke, active }: { luke: number; active: boolean }) {
    const meshes = useRef<(THREE.Mesh | null)[]>([]);
    const ts = useRef([...DRAAPER]);

    useFrame((_, dt) => {
        const fart = 0.1 + (luke / 100) * 0.65;
        for (let i = 0; i < ts.current.length; i++) {
            const m = meshes.current[i];
            if (!m) continue;
            if (!active || luke < 2) {
                m.visible = false;
                continue;
            }
            m.visible = true;
            ts.current[i] = (ts.current[i] + fart * dt) % 1;
            const p = pipePoint(ts.current[i]);
            m.position.set(p[0], p[1], p[2]);
        }
    });

    return (
        <group>
            {DRAAPER.map((_, i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        meshes.current[i] = el;
                    }}
                    visible={false}
                >
                    <sphereGeometry args={[PIPE_R * 0.75, 8, 8]} />
                    <meshStandardMaterial
                        color="#8fd3f4"
                        emissive="#4aa3d0"
                        emissiveIntensity={0.5}
                        roughness={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}

function Demning({ ghost = false, flyttbar = false }: { ghost?: boolean; flyttbar?: boolean }) {
    return (
        <group>
            <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
                <boxGeometry args={[1, 1.6, 6.4]} />
                <meshStandardMaterial
                    color={ghost ? '#f0c37a' : flyttbar ? '#eef2f6' : COL.betong}
                    roughness={0.85}
                    transparent={ghost}
                    opacity={ghost ? 0.5 : 1}
                />
            </mesh>
            {/* Luketårn på toppen */}
            <mesh position={[0, 1.85, 0]} castShadow>
                <boxGeometry args={[0.8, 0.5, 1]} />
                <meshStandardMaterial color="#8a8d92" roughness={0.8} />
            </mesh>
        </group>
    );
}

function Kraftstasjon({
    ghost = false,
    spin = 0,
    lyser = false,
}: {
    ghost?: boolean;
    spin?: number;
    lyser?: boolean;
}) {
    return (
        <group>
            <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                <boxGeometry args={[3, 1.8, 3.2]} />
                <meshStandardMaterial
                    color={ghost ? '#f0c37a' : COL.tegl}
                    roughness={0.85}
                    transparent={ghost}
                    opacity={ghost ? 0.5 : 1}
                />
            </mesh>
            <mesh position={[0, 1.95, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[2.3, 0.6, 4]} />
                <meshStandardMaterial color="#5c3326" roughness={0.9} />
            </mesh>
            {!ghost && (
                <>
                    {/* Turbinhjulet på veggen, snurrer med vannmengden */}
                    <Gear position={[0, 0.95, 1.66]} radius={0.55} teeth={10} spin={spin} />
                    {/* Vinduer som lyser når stasjonen går */}
                    {[-0.9, 0.9].map((x) => (
                        <mesh key={x} position={[x, 1.35, 1.62]}>
                            <boxGeometry args={[0.5, 0.4, 0.06]} />
                            <meshStandardMaterial
                                color={lyser ? '#ffe08a' : '#5a5f66'}
                                emissive={lyser ? '#ffc94d' : '#000000'}
                                emissiveIntensity={lyser ? 1.1 : 0}
                                toneMapped={false}
                            />
                        </mesh>
                    ))}
                </>
            )}
        </group>
    );
}

// ---------- Scenen ----------

interface SceneProps {
    step: number;
    phase: Phase;
    luke: number;
    magasin: number;
    ovnerPaa: boolean;
    onDamSnap: () => void;
    onPipe: () => void;
    onHouseSnap: () => void;
    burst: number;
}

function Scene({
    step,
    phase,
    luke,
    magasin,
    ovnerPaa,
    onDamSnap,
    onPipe,
    onHouseSnap,
    burst,
}: SceneProps) {
    const lake = useRef<THREE.Group>(null);
    const bygget = phase !== 'bygg';
    const roer = Math.min(3, Math.max(0, step - 1));

    // Magasinet krymper synlig når vannet tappes ut.
    useFrame((_, dt) => {
        if (!lake.current) return;
        const maal = 0.45 + (magasin / 100) * 0.55;
        const s = damp(lake.current.scale.x, maal, dt, 2.2);
        lake.current.scale.set(s, 1, s);
    });

    return (
        <group>
            {/* Dalbunnen */}
            <GroundPlane size={60} depth={44} color={COL.dal} />

            {/* Fjellplatået i vest */}
            <mesh position={[-9, 3, 0]} castShadow receiveShadow>
                <boxGeometry args={[10, 6, 15]} />
                <meshStandardMaterial color={COL.fjell} roughness={1} />
            </mesh>
            {/* Selve skråningen ned mot dalen */}
            <mesh
                position={SLAB_CENTER}
                rotation={[0, 0, SLOPE_ANGLE]}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[SLOPE_LEN, SLAB_HALF * 2, 15]} />
                <meshStandardMaterial color={COL.fjellTopp} roughness={1} />
            </mesh>

            {/* Magasinet oppe på platået */}
            <group ref={lake} position={[-9, 0, 0]}>
                <WaterPlane position={[0, 6.03, 0]} size={[8.4, 12]} color={COL.vann} />
            </group>

            {/* Litt fjelltekstur */}
            <Rock position={[-13, 6, 6.6]} color="#8a8f95" scale={0.9} />
            <Rock position={[-11.2, 6, -6.6]} color="#82878d" scale={1.1} />
            <Rock position={[-5.4, 6, 6.7]} color="#8a8f95" scale={0.7} />

            {/* --- Steg 1: demningen --- */}
            {step === 0 ? (
                <>
                    <Draggable
                        position={[-9.8, DAM_Y, 6.4]}
                        planeY={DAM_Y}
                        bounds={{ minX: -13, maxX: -4.2, minZ: -6.8, maxZ: 6.8 }}
                        snapPoints={[DAM_SNAP]}
                        snapRadius={2.6}
                        onSnap={onDamSnap}
                        dropFx="dustPuff"
                    >
                        {/* Romslig usynlig gripeflate - lett å ta tak i på trackpad */}
                        <mesh position={[0, 1, 0]}>
                            <boxGeometry args={[2.6, 2.6, 7.4]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                        <FlatRing position={[0, 0.06, 0]} radius={2.4} tube={0.13} color="#2563eb" />
                        <Demning flyttbar />
                    </Draggable>
                    {/* Målmarkering der demningen skal stå */}
                    <group position={[DAM_SNAP[0], DAM_Y, DAM_SNAP[1]]}>
                        <FlatRing position={[0, 0.06, 0]} radius={2.4} tube={0.16} color="#f59e0b" />
                        <Demning ghost />
                    </group>
                </>
            ) : (
                <group position={[DAM_SNAP[0], DAM_Y, DAM_SNAP[1]]}>
                    <Demning />
                </group>
            )}

            {/* --- Steg 2-4: rørgata --- */}
            {[0, 1, 2].map((i) =>
                i < roer ? <PipeSegment key={i} t0={i / 3} t1={(i + 1) / 3} /> : null
            )}
            {step >= 1 && step <= 3 && (
                <Hotspot
                    position={pipePoint((step - 1) / 3 + 1 / 6)}
                    onSelect={onPipe}
                    label={step === 1 ? 'Legg rørgata' : undefined}
                    radius={0.7}
                />
            )}

            {/* --- Steg 5: kraftstasjonen --- */}
            {step === 4 ? (
                <>
                    <Draggable
                        position={[8.5, 0, 6]}
                        planeY={0}
                        bounds={{ minX: 2.6, maxX: 11, minZ: -6, maxZ: 7 }}
                        snapPoints={[HOUSE_SNAP]}
                        snapRadius={2.8}
                        onSnap={onHouseSnap}
                        dropFx="dustPuff"
                    >
                        <mesh position={[0, 1.1, 0]}>
                            <boxGeometry args={[4.2, 2.6, 4.4]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                        <Kraftstasjon />
                    </Draggable>
                    <group position={[HOUSE_SNAP[0], 0, HOUSE_SNAP[1]]}>
                        <Kraftstasjon ghost />
                    </group>
                </>
            ) : step > 4 ? (
                <group position={[HOUSE_SNAP[0], 0, HOUSE_SNAP[1]]}>
                    <Kraftstasjon spin={bygget ? luke * 0.06 : 0} lyser={ovnerPaa} />
                </group>
            ) : null}

            <Vannstrom luke={luke} active={bygget} />

            {/* Kunstgjodselfabrikken og bygda nedenfor */}
            <group position={[8.0, 0, -2.4]}>
                <Building body="#8d4433" roof="#4a2c22" w={4.6} h={2.7} d={3.4} />
                <mesh position={[1.8, 2.3, 0]} castShadow>
                    <cylinderGeometry args={[0.34, 0.44, 4.6, 12]} />
                    <meshStandardMaterial color="#7d4a38" roughness={0.9} />
                </mesh>
                <Smoke origin={[1.8, 4.6, 0]} show={ovnerPaa} count={6} color="#d8d8d2" />
                {[-1.2, 0, 1.2].map((x) => (
                    <mesh key={x} position={[x, 1.9, 1.75]}>
                        <boxGeometry args={[0.62, 0.58, 0.06]} />
                        <meshStandardMaterial
                            color={ovnerPaa ? '#ffd27a' : '#4f5459'}
                            emissive={ovnerPaa ? '#ff9d2e' : '#000000'}
                            emissiveIntensity={ovnerPaa ? 1.2 : 0}
                            toneMapped={false}
                        />
                    </mesh>
                ))}
            </group>

            <Building position={[7.0, 0, 4.6]} body="#c9a15c" roof="#6d4b31" seed={2} />
            <Building position={[9.6, 0, 3.4]} body="#c08f52" roof="#6d4b31" seed={5} />
            <Building position={[5.2, 0, 6.0]} body="#cba765" roof="#6d4b31" seed={8} />

            <Tree position={[3.2, 0, -6]} leaf="#3f6b39" seed={1} />
            <Tree position={[6.4, 0, -6.6]} leaf="#456f3c" seed={4} />
            <Tree position={[11.4, 0, -1.2]} leaf="#3f6b39" seed={7} />
            <Tree position={[11.6, 0, 4.8]} leaf="#456f3c" seed={9} />

            <Burst position={[HOUSE_SNAP[0], 2.6, HOUSE_SNAP[1]]} trigger={burst} />
        </group>
    );
}

// ---------- Spillet ----------

const Fossekraftverket3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [step, setStep] = useState(0); // 0 dam, 1-3 rør, 4 kraftstasjon, 5 ferdig bygd
    const [phase, setPhase] = useState<Phase>('bygg');
    const [luke, setLuke] = useState(0);
    const [magasin, setMagasin] = useState(MAGASIN_START);
    const [sekker, setSekker] = useState(0);
    const [tid, setTid] = useState(TID);
    const [tapAarsak, setTapAarsak] = useState('');
    // Sannheten i simuleringen lever i en ref, så tikket kan lese alle
    // verdiene samtidig og avgjøre utfallet uten kaskade-renders.
    const sim = useRef({ magasin: MAGASIN_START, sekker: 0, tid: TID, kald: 0, ferdig: false });
    // Luka og callbackene leses gjennom refs. Ellers ville intervallet blitt
    // revet ned og bygd opp igjen ved hver render, og klokka gått for sakte.
    const lukeRef = useRef(0);
    const playRef = useRef(sounds.play);
    const completeRef = useRef(onComplete);
    useEffect(() => {
        playRef.current = sounds.play;
        completeRef.current = onComplete;
    });

    const settLuke = useCallback((v: number) => {
        lukeRef.current = v;
        setLuke(v);
    }, []);
    const [banner, setBanner] = useState<string | null>(
        'Dra demningen bort til utløpet av fjellvannet.'
    );
    const [burst, setBurst] = useState(0);
    const [attempt, setAttempt] = useState(0);

    // Ovnene lyser mens anlegget går - og blir stående på etter seier, så
    // vinnerbildet viser en fabrikk i full drift.
    const ovnerPaa =
        phase === 'vunnet' || (phase === 'kjor' && luke >= OVN_GRENSE && magasin > 0);

    const reset = useCallback(() => {
        setStep(0);
        setPhase('bygg');
        settLuke(0);
        setMagasin(MAGASIN_START);
        setSekker(0);
        setTid(TID);
        setTapAarsak('');
        sim.current = { magasin: MAGASIN_START, sekker: 0, tid: TID, kald: 0, ferdig: false };
        setBanner('Dra demningen bort til utløpet av fjellvannet.');
        setAttempt((a) => a + 1);
    }, [settLuke]);

    const onDamSnap = () => {
        sounds.play('correct');
        setStep(1);
        setBanner('Demningen står. Klikk deg nedover fjellet og legg rørgata.');
    };

    const onPipe = () => {
        sounds.play('advance');
        setStep((s) => {
            const neste = s + 1;
            if (neste === 4) setBanner('Rørgata er ferdig. Dra kraftstasjonen ned til rørenden.');
            return neste;
        });
    };

    const onHouseSnap = () => {
        sounds.play('sceneChange');
        setStep(5);
        setPhase('kjor');
        setBanner('Anlegget står. Åpne luka - ovnene på fabrikken må aldri bli kalde.');
    };

    // Sanntidsløkka. Kjører på DOM-siden 10 ganger i sekundet, oppdaterer
    // simuleringen og avgjør seier eller tap i samme tikk.
    useEffect(() => {
        if (phase !== 'kjor') return;
        const dt = 0.1;

        const tap = (aarsak: string) => {
            sim.current.ferdig = true;
            playRef.current('incorrect');
            setTapAarsak(aarsak);
            setPhase('tapt');
        };

        const id = window.setInterval(() => {
            const s = sim.current;
            if (s.ferdig) return;
            const luke = lukeRef.current;

            const uttak = Math.pow(luke / 100, 1.6) * UTTAK_MAX;
            s.magasin = Math.min(100, Math.max(0, s.magasin + (TILSIG - uttak) * dt));
            s.tid = Math.max(0, s.tid - dt);

            if (luke >= OVN_GRENSE && s.magasin > 0) {
                s.sekker += (luke - OVN_GRENSE) * 0.2 * dt;
                s.kald = 0;
            } else {
                s.kald += dt;
            }

            setMagasin(s.magasin);
            setSekker(s.sekker);
            setTid(s.tid);

            if (s.sekker >= MAAL_SEKKER) {
                s.ferdig = true;
                playRef.current('complete');
                setPhase('vunnet');
                setBurst((b) => b + 1);
                completeRef.current({ score: 1, completed: true, artifact: { sekker: MAAL_SEKKER } });
            } else if (s.magasin <= 0) {
                tap(
                    'Magasinet er tomt. Du slapp ut mer vann enn fjellet klarte å fylle på, og da stopper alt.'
                );
            } else if (s.kald > KALD_TOLERANSE) {
                tap(
                    'Ovnene ble kalde. Smelta stivnet, og fabrikken måtte stanse. Lysbueovnene på Rjukan gikk døgnet rundt nettopp derfor.'
                );
            } else if (s.tid <= 0) {
                tap(
                    'Tida gikk ut. Du holdt igjen for mye vann, og fabrikken rakk ikke å lage nok gjødsel.'
                );
            }
        }, 100);

        return () => window.clearInterval(id);
    }, [phase]);

    const fare = magasin < 25 ? (25 - magasin) / 25 : 0;

    const readout = useMemo(
        () => [
            { label: 'Magasin', value: Math.round(magasin), unit: '%' },
            { label: 'Sekker', value: `${Math.floor(sekker)}/${MAAL_SEKKER}` },
            { label: 'Tid', value: Math.ceil(tid), unit: 's' },
        ],
        [magasin, sekker, tid]
    );

    return (
        <MicroGameScaffold
            title="Bygg kraftverket i fjellet"
            subtitle="Reis demning, rørgate og kraftstasjon - og doser vannet så fabrikken går"
            estimatedSeconds={170}
            onRetry={step > 0 ? reset : undefined}
            scene={
                <Scene
                    key={attempt}
                    step={step}
                    phase={phase}
                    luke={luke}
                    magasin={magasin}
                    ovnerPaa={ovnerPaa}
                    onDamSnap={onDamSnap}
                    onPipe={onPipe}
                    onHouseSnap={onHouseSnap}
                    burst={burst}
                />
            }
            canvas={{
                idle: false,
                controls: true,
                camera: { position: [7, 13, 34], fov: 40 },
                background: COL.sky,
                fog: { color: COL.sky, near: 42, far: 100 },
                target: [-1.6, 2.8, 0],
                light: 'overcast',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    {phase !== 'bygg' && <DataReadout items={readout} corner="bl" />}
                    <SceneBadge corner="br">Vestfjorddalen 1911</SceneBadge>
                    <DragHint show={step === 0} corner="bc">
                        Dra demningen bort til den gule ringen
                    </DragHint>
                    {phase === 'kjor' && <DangerVignette level={fare} />}
                </>
            }
        >
            {phase === 'bygg' && (
                <div className="space-y-3">
                    <StepTracker current={step + 1} total={5} />
                    <p className="text-sm text-slate-600">
                        {step === 0
                            ? 'Fjellvannet ligger 300 meter over dalen. Først må vannet demmes opp, så det ikke bare renner ubrukt til havs.'
                            : step <= 3
                            ? 'Rørgata fører vannet ned fjellsiden. Jo lengre fall, jo mer kraft i vannet når det treffer turbinen.'
                            : 'Kraftstasjonen står nederst, der vannet har mest fart. Der gjør turbinen fallet om til strøm.'}
                    </p>
                </div>
            )}

            {phase === 'kjor' && (
                <div className="space-y-3">
                    <SceneSlider
                        label="Luka i demningen"
                        min={0}
                        max={100}
                        step={1}
                        value={luke}
                        onChange={settLuke}
                        valueLabel={(v) => `${v} %`}
                    />
                    <p className="text-sm text-slate-600">
                        {luke < OVN_GRENSE
                            ? 'Ovnene står. Åpne luka, ellers stivner smelta.'
                            : magasin < 25
                            ? 'Magasinet tømmes fort. Skru ned litt, så fjellet rekker å fylle på.'
                            : 'Ovnene går. Finn den åpningen som gir mest gjødsel uten å tømme magasinet.'}
                    </p>
                </div>
            )}

            {phase === 'vunnet' && (
                <WinScreen title="100 sekker kunstgjødsel!" onReplay={reset}>
                    Fossen ble til strøm, strømmen ble til gjødsel, og gjødselen ble solgt til hele
                    verden. Magasinet er batteriet: fjellet samler vann om våren, og du tapper det
                    jevnt resten av året.
                </WinScreen>
            )}

            {phase === 'tapt' && (
                <LoseScreen title="Anlegget stoppet" onRetry={reset} retryLabel="Prøv igjen">
                    {tapAarsak}
                </LoseScreen>
            )}

        </MicroGameScaffold>
    );
};

export default Fossekraftverket3D;
