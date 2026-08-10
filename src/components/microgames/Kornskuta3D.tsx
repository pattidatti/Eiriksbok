import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Mover,
    Boat,
    Seascape,
    useMeter,
    useGameClock,
    useCrosshair,
    Crosshair,
    DangerVignette,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    useAmbience,
    faceAlong,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: eleven kjenner på kroppen hvorfor «lite nådde fram» under
// blokaden 1807-1814. Seil oppe gir fart, men et hvitt seil i månelyset er
// synlig langt av gårde. Seil nede gjør deg nesten usynlig, men da driver du
// bare - og daggryet kommer uansett. Det er doseringen som er poenget.

const START_Z = 24;
const KYST_Z = -22;
const SEIL_FART = 3.0;
const DRIV_FART = 0.42;
const STYRE_X = 13;
const TID = 72;
const FLEKK_RADIUS = 3.4;
// Hvor langt foran kameraet skuta ligger. For nær = masta dekker hele bildet.
const SKUTE_AVSTAND = 8.4;

type Spill = 'idle' | 'seiler' | 'tatt' | 'daggry' | 'vunnet';

// Månelys som siver gjennom revnene i skydekket og driver over sjøen. Samme
// rolle som en lyskaster, men uten anakronisme: det er månen, ikke en lampe.
function Maaneflekk({
    amp,
    speed,
    phase,
    baseZ,
    onSveip,
}: {
    amp: number;
    speed: number;
    phase: number;
    baseZ: number;
    onSveip: (x: number, z: number) => void;
}) {
    const flate = useRef<THREE.Mesh>(null);
    const glo = useRef<THREE.Mesh>(null);
    const lys = useRef<THREE.PointLight>(null);
    const pos = useRef(new THREE.Vector3(0, 0.06, baseZ));

    useFrame((state, dt) => {
        const t = state.clock.getElapsedTime();
        // Skyene driver rolig. Flekkene er ikke ute etter deg - de bare flytter seg.
        const mx = Math.sin(t * speed + phase) * amp;
        const mz = baseZ + Math.sin(t * speed * 0.61 + phase * 1.4) * 5.5;
        pos.current.x += (mx - pos.current.x) * Math.min(1, dt * 1.6);
        pos.current.z += (mz - pos.current.z) * Math.min(1, dt * 1.6);
        flate.current?.position.set(pos.current.x, 0.06, pos.current.z);
        glo.current?.position.set(pos.current.x, 0.05, pos.current.z);
        lys.current?.position.set(pos.current.x, 1.4, pos.current.z);
        onSveip(pos.current.x, pos.current.z);
    });

    // Månelyset leses på VANNET, ikke som en lyskjegle i lufta. En kjegle her
    // ble til et stort trekantet spøkelse midt i bildet.
    return (
        <>
            <mesh ref={glo} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[FLEKK_RADIUS * 1.5, 28]} />
                <meshBasicMaterial color="#9fb8de" transparent opacity={0.12} depthWrite={false} />
            </mesh>
            <mesh ref={flate} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[FLEKK_RADIUS, 28]} />
                <meshBasicMaterial color="#dbe7ff" transparent opacity={0.34} depthWrite={false} />
            </mesh>
            <pointLight ref={lys} intensity={0.9} distance={11} color="#cfdcff" />
        </>
    );
}

// Skuta eleven står på. Ligger foran kameraet og følger det, så eleven kjenner
// at hen er OM BORD. Seilet er selve tilbakemeldingen: oppe = fart og fare.
function EgenSkute({
    camPosRef,
    seilOppe,
}: {
    camPosRef: React.MutableRefObject<[number, number, number]>;
    seilOppe: boolean;
}) {
    const grp = useRef<THREE.Group>(null);

    useFrame(() => {
        const p = camPosRef.current;
        // Skuta ligger et godt stykke foran kameraet. Ligger den for nær, fyller
        // masta hele skjermen som en svart stolpe. Klemmes innenfor vannet, så
        // den aldri havner "på land" i innseilingen.
        grp.current?.position.set(p[0], 0.02, Math.max(-24, p[2] - SKUTE_AVSTAND));
    });

    // Skroget bygges ALDRI for hånd - kit-Boat eier baugretning (+Z) og dypgang.
    // Vi seiler mot -Z, så baugen snus dit. Berget seil = ingen sail-prop, da
    // står bare det bare skroget igjen, og det er nettopp det som gjør deg usynlig.
    return (
        <group ref={grp} scale={1.25}>
            <Boat
                heading={faceAlong([0, -1])}
                color="#5b4530"
                sail={seilOppe ? '#f2ead8' : undefined}
            />
        </group>
    );
}

// Den norske kysten i nord: lave, mørke åser med noen få lys i husene.
function NorskKyst() {
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            <mesh position={[0, 1.2, -34]} receiveShadow>
                <boxGeometry args={[80, 2.6, 18]} />
                <meshStandardMaterial color="#1e2a2c" roughness={1} />
            </mesh>
            {[-18, -8, 3, 14, 24].map((x, i) => (
                <mesh key={`aas-${i}`} position={[x, 2.2, -30 - (i % 2) * 2]}>
                    <coneGeometry args={[5.5 + (i % 3), 4.5 + (i % 2) * 1.6, 6]} />
                    <meshStandardMaterial color="#22302f" roughness={1} />
                </mesh>
            ))}
            {[-12, -3, 6, 17].map((x, i) => (
                <mesh key={`lys-${i}`} position={[x, 1.4, -25.4]}>
                    <sphereGeometry args={[0.16, 8, 6]} />
                    <meshStandardMaterial
                        color="#ffe6a8"
                        emissive="#ffcf66"
                        emissiveIntensity={2}
                        fog={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

interface SceneProps {
    spill: Spill;
    forsok: number;
    seilOppe: boolean;
    camPosRef: React.MutableRefObject<[number, number, number]>;
    seilRef: React.MutableRefObject<boolean>;
    styreRef: React.MutableRefObject<number>;
    onSikt: (x: number, y: number) => void;
    onHold: (holder: boolean) => void;
    fareAdd: (m: number) => void;
    onFramme: () => void;
}

function SjoScene({
    spill,
    forsok,
    seilOppe,
    camPosRef,
    seilRef,
    styreRef,
    onSikt,
    onHold,
    fareAdd,
    onFramme,
}: SceneProps) {
    // Scenen remountes per forsøk (key={forsok}), så refs nullstiller seg selv.
    void forsok;
    const flekkerRef = useRef<{ x: number; z: number }[]>([
        { x: 0, z: 10 },
        { x: 0, z: -4 },
    ]);
    const fregattRef = useRef<{ x: number; z: number }>({ x: -12, z: 4 });
    const frammeRef = useRef(false);
    const onFrammeRef = useRef(onFramme);
    const fareAddRef = useRef(fareAdd);
    useEffect(() => {
        onFrammeRef.current = onFramme;
    }, [onFramme]);
    useEffect(() => {
        fareAddRef.current = fareAdd;
    }, [fareAdd]);

    // Fregatten krysser fram og tilbake foran innseilingen.
    const [etappe, setEtappe] = useState(0);
    const fraP: [number, number, number] = etappe % 2 === 0 ? [-12, 0.02, 4] : [12, 0.02, 4];
    const tilP: [number, number, number] = etappe % 2 === 0 ? [12, 0.02, 4] : [-12, 0.02, 4];

    useFrame((_state, dt) => {
        const p = camPosRef.current;

        if (spill === 'seiler') {
            // Seil oppe gir fart. Seil nede gir bare drift - men du er nesten usynlig.
            const fart = seilRef.current ? SEIL_FART : DRIV_FART;
            const nz = p[2] - dt * fart;
            const dx = styreRef.current - p[0];
            const nx = Math.max(
                -STYRE_X,
                Math.min(STYRE_X, p[0] + dx * Math.min(1, dt * (seilRef.current ? 2.2 : 0.8)))
            );
            camPosRef.current = [nx, 4.6, nz];

            if (!frammeRef.current && nz <= KYST_Z) {
                frammeRef.current = true;
                onFrammeRef.current();
            }

            // Sterkeste kilde teller, ikke summen - ellers stables måne og
            // fregatt til en urettferdig øyeblikks-død.
            let rate = 0;
            for (const f of flekkerRef.current) {
                const ddx = nx - f.x;
                const ddz = nz - f.z;
                if (ddx * ddx + ddz * ddz < FLEKK_RADIUS * FLEKK_RADIUS) {
                    // Et hvitt seil i månelyset er synlig. Bar mast er det ikke.
                    rate = Math.max(rate, seilRef.current ? 0.92 : 0.1);
                }
            }
            const gdx = nx - fregattRef.current.x;
            const gdz = nz - fregattRef.current.z;
            if (gdx * gdx + gdz * gdz < 6.2 * 6.2) {
                rate = Math.max(rate, seilRef.current ? 0.6 : 0.14);
            }
            if (rate > 0) fareAddRef.current(dt * rate);

            if (import.meta.env.DEV) {
                (window as unknown as Record<string, unknown>).__kornskutaDebug = {
                    skute: [nx, nz],
                    fregatt: [fregattRef.current.x, fregattRef.current.z],
                    flekker: flekkerRef.current.map((f) => [f.x, f.z]),
                };
            }
        } else if (spill === 'vunnet') {
            // Gli inn mot lysene i land
            const k = Math.min(1, dt * 0.9);
            camPosRef.current = [
                p[0] + (0 - p[0]) * k,
                p[1],
                p[2] + (KYST_Z - 3 - p[2]) * k,
            ];
        }
    });

    return (
        <>
            <PovCamera
                positionRef={camPosRef}
                lookAhead={[0, -1.6, -10]}
                moving={spill === 'seiler' && seilOppe}
                bob={0.045}
            />
            <AimPlane
                enabled={spill === 'seiler'}
                followCamera
                onAim={onSikt}
                onHoldChange={onHold}
                hideCursor
            />

            <Seascape position={[0, 0, 4]} size={[80, 62]} waterY={0.02} color="#16324a">
                <Maaneflekk
                    amp={11}
                    speed={0.5}
                    phase={0.4}
                    baseZ={10}
                    onSveip={(x, z) => {
                        flekkerRef.current[0] = { x, z };
                    }}
                />
                <Maaneflekk
                    amp={12}
                    speed={0.38}
                    phase={2.6}
                    baseZ={-6}
                    onSveip={(x, z) => {
                        flekkerRef.current[1] = { x, z };
                    }}
                />

                {/* Britisk fregatt på blokadepost */}
                {spill !== 'vunnet' && (
                    <Mover
                        from={fraP}
                        to={tilP}
                        speed={1.7}
                        bob={0.03}
                        phase={etappe}
                        onArrive={() => setEtappe((e) => e + 1)}
                        onMove={(x, _y, z) => {
                            fregattRef.current = { x, z };
                        }}
                    >
                        <Boat
                            heading={faceAlong(etappe % 2 === 0 ? [1, 0] : [-1, 0])}
                            color="#2b2f38"
                            sail="#8e9099"
                        />
                    </Mover>
                )}

                <EgenSkute camPosRef={camPosRef} seilOppe={seilOppe} />
            </Seascape>

            <NorskKyst />

            {/* Måne bak skydekket */}
            <mesh position={[13, 17, -30]} userData={{ sceneAuditIgnore: true }}>
                <circleGeometry args={[1.7, 24]} />
                <meshStandardMaterial
                    color="#eef4ff"
                    emissive="#ccd9ff"
                    emissiveIntensity={1.2}
                    fog={false}
                />
            </mesh>
        </>
    );
}

const Kornskuta3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const boelger = useAmbience('waves', -30);

    const [spill, setSpill] = useState<Spill>('idle');
    const [forsok, setForsok] = useState(0);
    const [tap, setTap] = useState(0);
    const [seilOppe, setSeilOppe] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [igjen, setIgjen] = useState(START_Z - KYST_Z);

    const camPosRef = useRef<[number, number, number]>([0, 4.6, START_Z]);
    const seilRef = useRef(false);
    const styreRef = useRef(0);
    const spillRef = useRef<Spill>('idle');
    useEffect(() => {
        spillRef.current = spill;
    }, [spill]);

    const tapt = useCallback(
        (slag: 'tatt' | 'daggry') => {
            if (spillRef.current !== 'seiler') return;
            sounds.play('incorrect');
            seilRef.current = false;
            setSeilOppe(false);
            setTap((t) => t + 1);
            setSpill(slag);
        },
        [sounds]
    );

    const fare = useMeter({
        drainPerSecond: 0.22,
        overloadAt: 1,
        recoverTo: 0.5,
        onOverload: () => tapt('tatt'),
    });
    const klokke = useGameClock({
        seconds: TID,
        running: spill === 'seiler',
        onExpire: () => tapt('daggry'),
    });

    const sikte = useCrosshair();
    const handleSikt = useCallback(
        (xPct: number, yPct: number) => {
            sikte.move(xPct, yPct);
            styreRef.current = ((xPct - 50) / 50) * STYRE_X;
        },
        [sikte]
    );

    const handleHold = useCallback((holder: boolean) => {
        seilRef.current = holder;
        setSeilOppe(holder);
    }, []);

    useEffect(() => {
        if (spill !== 'seiler') return;
        const t = setInterval(() => {
            setIgjen(Math.max(0, Math.round(camPosRef.current[2] - KYST_Z)));
        }, 250);
        return () => clearInterval(t);
    }, [spill]);

    const start = useCallback(() => {
        camPosRef.current = [0, 4.6, START_Z];
        seilRef.current = false;
        styreRef.current = 0;
        fare.reset();
        klokke.restart();
        setSeilOppe(false);
        setIgjen(START_Z - KYST_Z);
        setForsok((f) => f + 1);
        setSpill('seiler');
        sounds.play('sceneChange');
        boelger.start();
        setBanner('Hold inne for å sette seil. Slipp for å berge seilet i månelyset!');
        setTimeout(() => setBanner(null), 3400);
    }, [fare, klokke, sounds, boelger]);

    const score = Math.max(0.4, 1 - tap * 0.15);

    const iLand = useCallback(() => {
        sounds.play('complete');
        setSpill('vunnet');
        setBanner(null);
        onComplete({ score: Math.max(0.4, 1 - tap * 0.15), completed: true });
    }, [sounds, onComplete, tap]);

    const nullstill = useCallback(() => {
        setSpill('idle');
        setBanner(null);
        fare.reset();
        seilRef.current = false;
        setSeilOppe(false);
        boelger.stop();
    }, [fare, boelger]);

    return (
        <MicroGameScaffold
            title="Kornskuta gjennom blokaden"
            subtitle="Smugle korn fra Danmark til Norge før det blir lyst - seil i mørket, berg seilet i månelyset"
            estimatedSeconds={160}
            onRetry={spill !== 'idle' ? nullstill : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 4.6, START_Z] as [number, number, number], fov: 58 },
                background: '#0f1b2b',
                fog: { color: '#0f1b2b', near: 14, far: 52 },
                sunPosition: [8, 12, -8] as [number, number, number],
                sunIntensity: 0.2,
                ambientIntensity: 0.62,
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#0f1b2b] to-[#081018]"
            overlays={
                <>
                    <Crosshair show={spill === 'seiler'} crosshairRef={sikte.ref} variant="dot" />
                    <DangerVignette level={spill === 'seiler' ? fare.value : 0} />
                    {spill === 'seiler' && (
                        <TimerPill
                            seconds={klokke.remaining}
                            label="Til daggry"
                            warnBelow={15}
                            corner="br"
                        />
                    )}
                    {spill === 'seiler' && (
                        <DataReadout
                            corner="bl"
                            items={[{ label: 'Til land', value: igjen, unit: 'nm' }]}
                        />
                    )}
                    <SceneBanner message={banner} wide />
                    {spill === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-black/50 text-white/75 rounded-xl text-xs text-center max-w-sm leading-relaxed">
                                Skagerrak, en natt i 1809. Lasterommet er fullt av dansk korn.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <SjoScene
                    key={forsok}
                    spill={spill}
                    forsok={forsok}
                    seilOppe={seilOppe}
                    camPosRef={camPosRef}
                    seilRef={seilRef}
                    styreRef={styreRef}
                    onSikt={handleSikt}
                    onHold={handleHold}
                    fareAdd={fare.add}
                    onFramme={iLand}
                />
            }
        >
            {spill === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Du er skipper på en liten skute full av korn. Hold inne museknappen for å
                        sette seil, og styr med pekeren. Slipp for å berge seilet - fregatten ser
                        det hvite seilet når månelyset treffer det.
                    </p>
                    <button
                        onClick={start}
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow"
                    >
                        Kast loss - nordover!
                    </button>
                </div>
            )}

            {spill === 'seiler' && (
                <MeterBar
                    value={fare.value}
                    label="Oppdaget"
                    hint="Fregatten speider etter seil. Berg seilet når du driver inn i en månestripe, og hold avstand."
                    labels={{ normal: 'Uoppdaget', warn: 'De aner noe', danger: 'OPPDAGET!' }}
                />
            )}

            {spill === 'tatt' && (
                <LoseScreen title="Fregatten tok skuta" onRetry={start}>
                    Lasten ble oppbrakt og solgt som prise. I Norge ventet folk forgjeves på kornet.
                    Prøv igjen: seil når det er mørkt, og berg seilet når månelyset kommer.
                </LoseScreen>
            )}

            {spill === 'daggry' && (
                <LoseScreen title="Det ble lyst før du nådde land" onRetry={start}>
                    I dagslys så blokadeflåten alt som rørte seg. Derfor seilte kornskutene om
                    natten - og de som lyktes, brukte hver time av mørket.
                </LoseScreen>
            )}

            {spill === 'vunnet' && (
                <WinScreen
                    title={
                        tap === 0
                            ? 'Du nådde norskekysten - på første forsøk!'
                            : 'Du nådde norskekysten!'
                    }
                    onReplay={start}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Én skute berget noen få tonn korn. Norge hentet normalt tre fjerdedeler av
                    kornet sitt sjøveien fra Danmark. Selv når enkeltskuter slapp gjennom, kunne de
                    aldri erstatte en hel handelsvei - og derfor ble det likevel barkebrødstid.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default Kornskuta3D;
