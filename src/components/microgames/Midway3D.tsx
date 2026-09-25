import React, { useCallback, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Seascape,
    Boat,
    FlatRing,
    Draggable,
    Hotspot,
    Explosion,
    Impact,
    SceneBanner,
    DataReadout,
    DragHint,
    DangerVignette,
    MeterBar,
    WinScreen,
    LoseScreen,
    SceneFact,
    useMeter,
    damp,
    faceAlong,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Midway, juni 1942. Eleven styrer et amerikansk hangarskip.
// Den japanske flåten ligger et sted i nordøst, men ingen kan se den. Eleven
// sender speiderfly ut over havet (klikk i sjøen) og flytter hangarskipet med
// det gule kursmerket. Samtidig leter fienden etter deg - jo nærmere du går,
// jo raskere finner de deg.
//
// Lyspære: i Stillehavet så flåtene nesten aldri hverandre. Flyene fra
// hangarskipene avgjorde slaget - den som fant fienden først, og var innenfor
// flyenes rekkevidde, vant.

const VANN_Y = 0.06;
const START: [number, number] = [-9, 5];
const SKIP_FART = 1.7; // enheter per sekund
const SPEIDER_FART = 9;
const SPEIDER_REKKEVIDDE = 15; // hvor langt et speiderfly kan fly ut
const SYNSVIDDE = 5.5; // hvor nær speideren må komme for å se flåten
const ANGREP_REKKEVIDDE = 8; // bombeflyene når bare så langt
const FARE_GRUNN = 0.021; // fienden leter uansett (per sekund)
const FARE_NAER = 0.055; // ekstra når du er nær
const NAER_GRENSE = 15;
const FIENDE_DRIFT = 0.22; // fienden seiler sakte mot Midway
const MIDWAY: [number, number] = [-3, 1.5];
const BOUNDS = { minX: -14, maxX: 13, minZ: -11, maxZ: 9 };

// Tre mulige steder for den japanske flåten. Hvilket som gjelder, bytter per
// forsøk - eleven må lete, ikke huske.
const KANDIDATER: [number, number][] = [
    [8, -6],
    [11, 1.5],
    [2, -8.5],
];
// Formasjonen: fire hangarskip.
const FORMASJON: [number, number][] = [
    [-1.4, -2.3],
    [1.4, -2.3],
    [-1.4, 2.3],
    [1.4, 2.3],
];
// Skipet skal aldri seile over atollen: hold minst denne avstanden.
const ATOLL_KLARING = 2.9;
const FLATE_KLARING = 6.5;

type Fase = 'idle' | 'spiller' | 'angriper' | 'vunnet' | 'tapt';

const Midway3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [fase, setFase] = useState<Fase>('idle');
    const [forsok, setForsok] = useState(0);
    const [funnet, setFunnet] = useState(false);
    const [iRekkevidde, setIRekkevidde] = useState(false);
    const [speidere, setSpeidere] = useState(0);
    const [avstand, setAvstand] = useState<number | null>(null);
    const [banner, setBanner] = useState<string | null>(
        'Klikk i sjøen for å sende et speiderfly. Etterretningen tror fienden er et sted nordøst for deg.'
    );

    const fare = useMeter({
        drainPerSecond: 0,
        onOverload: () => {
            setFase((f) => (f === 'spiller' ? 'tapt' : f));
            setBanner(null);
            sounds.play('incorrect');
        },
    });

    const fiende = KANDIDATER[forsok % KANDIDATER.length];

    const start = useCallback(() => {
        if (fase !== 'idle') return;
        setFase('spiller');
        sounds.play('advance');
    }, [fase, sounds]);

    const nullstill = useCallback(() => {
        setForsok((f) => f + 1);
        setFase('idle');
        setFunnet(false);
        setIRekkevidde(false);
        setSpeidere(0);
        setAvstand(null);
        fare.reset();
        setBanner(
            'Klikk i sjøen for å sende et speiderfly. Etterretningen tror fienden er et sted nordøst for deg.'
        );
    }, [fare]);

    const handterSpeider = useCallback(() => {
        start();
        setSpeidere((s) => s + 1);
        setBanner('Speideren er i lufta. Følg med - og hold et øye med fare-måleren.');
    }, [start]);

    const handterFunnet = useCallback(() => {
        setFunnet(true);
        sounds.play('correct');
        setBanner(
            'Speideren fant fire japanske hangarskip! Flytt hangarskipet ditt til flåten er innenfor den grønne ringen.'
        );
    }, [sounds]);

    const handterBom = useCallback(() => {
        setBanner('Bare tomt hav der. Prøv et annet sted - men ikke vent for lenge.');
    }, []);

    const handterRekkevidde = useCallback((inne: boolean) => {
        setIRekkevidde(inne);
        if (inne)
            setBanner(
                'Fienden er innenfor rekkevidde. Klikk ANGRIP over flåten, eller knappen under.'
            );
    }, []);

    const angrip = useCallback(() => {
        if (fase !== 'spiller' || !funnet || !iRekkevidde) return;
        setFase('angriper');
        setBanner('Bombeflyene letter. Nå gjelder det å komme først.');
        sounds.play('advance');
    }, [fase, funnet, iRekkevidde, sounds]);

    const handterSeier = useCallback(() => {
        setFase('vunnet');
        setBanner(null);
        sounds.play('complete');
        onComplete({ score: 1, completed: true });
    }, [onComplete, sounds]);

    const farenivaa = fare.value;

    return (
        <MicroGameScaffold
            title="Midway 1942: Finn dem først"
            subtitle="Send speiderfly, finn den japanske flåten og angrip før de finner deg."
            estimatedSeconds={120}
            onRetry={nullstill}
            scene={
                <MidwayScene
                    key={forsok}
                    fase={fase}
                    fiende={fiende}
                    funnet={funnet}
                    kanAngripe={funnet && iRekkevidde && fase === 'spiller'}
                    onSpeider={handterSpeider}
                    onFunnet={handterFunnet}
                    onBom={handterBom}
                    onRekkevidde={handterRekkevidde}
                    onAvstand={setAvstand}
                    onFare={fare.add}
                    onFlytt={start}
                    onAngrip={angrip}
                    onSeier={handterSeier}
                />
            }
            canvas={{
                idle: false,
                controls: false,
                camera: { position: [0, 24, 17], fov: 50 },
                target: [0, 0, -1],
                background: '#b9d7e8',
                fog: { color: '#b9d7e8', near: 30, far: 60 },
                light: 'day',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Speiderfly', value: speidere },
                            { label: 'Fienden', value: funnet ? 'Funnet' : 'Ukjent' },
                            {
                                label: 'Avstand',
                                value: funnet && avstand !== null ? avstand.toFixed(0) : '?',
                            },
                        ]}
                    />
                    <DragHint show={fase === 'idle'} corner="bc">
                        Klikk i sjøen - eller dra det gule merket
                    </DragHint>
                    <DangerVignette
                        level={fase === 'spiller' ? Math.max(0, farenivaa - 0.4) * 1.6 : 0}
                    />
                </>
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={farenivaa}
                    label="Fiendens speidere leter etter deg"
                    hint="Stiger hele tiden - og raskere jo nærmere du går"
                    labels={{ normal: 'Skjult', warn: 'De nærmer seg', danger: 'Nesten funnet!' }}
                />

                {(fase === 'idle' || fase === 'spiller') && (
                    <button
                        onClick={angrip}
                        disabled={!(funnet && iRekkevidde && fase === 'spiller')}
                        className="w-full rounded-xl px-4 py-2.5 text-sm font-bold transition-colors bg-rose-600 hover:bg-rose-700 text-white disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        {!funnet
                            ? 'Finn fienden først - klikk i sjøen'
                            : iRekkevidde
                              ? 'Send bombeflyene!'
                              : 'For langt unna - dra det gule merket nærmere'}
                    </button>
                )}

                {fase === 'vunnet' && (
                    <WinScreen title="Fire hangarskip senket" onReplay={nullstill}>
                        Du fant fienden først og slo til innenfor rekkevidde. Ved Midway i juni 1942
                        mistet Japan fire hangarskip. Etter dette var det USA som angrep.
                    </WinScreen>
                )}

                {fase === 'tapt' && (
                    <LoseScreen title="De fant deg først" onRetry={nullstill}>
                        Japanske fly fant hangarskipet ditt før du fant dem. I Stillehavet så
                        flåtene nesten aldri hverandre - den som fant motstanderen først, fikk slå
                        først. Bruk speiderne tidlig, og gå ikke nærmere enn du må.
                    </LoseScreen>
                )}

                <SceneFact>
                    Et hangarskip er en flytende flyplass. Flyene rakk mye lenger enn kanonene på et
                    slagskip. Derfor var det hangarskipene, ikke slagskipene, som avgjorde krigen på
                    havet i Stillehavet.
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
};

export default Midway3D;

// ── Scenen ───────────────────────────────────────────────────────────────────

interface SceneProps {
    fase: Fase;
    fiende: [number, number];
    funnet: boolean;
    kanAngripe: boolean;
    onSpeider: () => void;
    onFunnet: () => void;
    onBom: () => void;
    onRekkevidde: (inne: boolean) => void;
    onAvstand: (d: number) => void;
    onFare: (amount: number) => void;
    onFlytt: () => void;
    onAngrip: () => void;
    onSeier: () => void;
}

interface Speider {
    x: number;
    z: number;
    maalX: number;
    maalZ: number;
    retur: boolean;
    sjekket: boolean;
}

function Hangarskip({ dekk, merke }: { dekk: string; merke?: string }) {
    return (
        <group scale={1.5}>
            <Boat color="#5b6470" />
            {/* Flydekket ligger flatt oppå skroget (skroget topper på y ~0.85) */}
            <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.9, 0.06, 2.7]} />
                <meshStandardMaterial color={dekk} roughness={0.85} />
            </mesh>
            {/* Kommandotårnet ("øya") på styrbord side */}
            <mesh position={[-0.34, 1.12, -0.1]} castShadow>
                <boxGeometry args={[0.18, 0.42, 0.5]} />
                <meshStandardMaterial color="#6b7280" roughness={0.8} />
            </mesh>
            {merke && (
                <mesh position={[0, 0.915, 0.75]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.2, 20]} />
                    <meshStandardMaterial color={merke} roughness={0.7} />
                </mesh>
            )}
        </group>
    );
}

function Fly({ farge = '#1f2937' }: { farge?: string }) {
    return (
        <group>
            <mesh>
                <boxGeometry args={[0.12, 0.1, 0.7]} />
                <meshStandardMaterial color={farge} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
                <boxGeometry args={[0.9, 0.04, 0.2]} />
                <meshStandardMaterial color={farge} roughness={0.6} />
            </mesh>
        </group>
    );
}

function MidwayScene({
    fase,
    fiende,
    funnet,
    kanAngripe,
    onSpeider,
    onFunnet,
    onBom,
    onRekkevidde,
    onAvstand,
    onFare,
    onFlytt,
    onAngrip,
    onSeier,
}: SceneProps) {
    const skipPos = useRef(new THREE.Vector3(START[0], VANN_Y, START[1]));
    const kursMerke = useRef(new THREE.Vector3(START[0], VANN_Y, START[1]));
    const skipKurs = useRef(faceAlong([1, -1]));
    const skipGruppe = useRef<THREE.Group>(null);
    const fiendePos = useRef(new THREE.Vector3(fiende[0], VANN_Y, fiende[1]));
    const fiendeGruppe = useRef<THREE.Group>(null);
    const speiderRef = useRef<Speider | null>(null);
    const speiderGruppe = useRef<THREE.Group>(null);
    const angrepT = useRef(0);
    const angrepGruppe = useRef<THREE.Group>(null);
    const sisteRekkevidde = useRef(false);
    const sisteAvstand = useRef(-1);
    const seierSendt = useRef(false);
    const synkRef = useRef(0);
    const [treff, setTreff] = useState<[number, number][]>([]);
    const [senker, setSenker] = useState(false);
    const [sprut, setSprut] = useState(0);
    const [sprutSted, setSprutSted] = useState<[number, number, number]>([0, VANN_Y, 0]);
    const [hotspotPos, setHotspotPos] = useState<[number, number, number]>([
        fiende[0],
        2.6,
        fiende[1],
    ]);

    const aktiv = fase === 'idle' || fase === 'spiller';

    const sendSpeider = useCallback(
        (e: ThreeEvent<MouseEvent>) => {
            // Et drag med kursmerket skal ikke også sende en speider.
            if (!aktiv || speiderRef.current || e.delta > 6) return;
            e.stopPropagation();
            const s = skipPos.current;
            let dx = e.point.x - s.x;
            let dz = e.point.z - s.z;
            const d = Math.hypot(dx, dz);
            if (d > SPEIDER_REKKEVIDDE) {
                dx = (dx / d) * SPEIDER_REKKEVIDDE;
                dz = (dz / d) * SPEIDER_REKKEVIDDE;
            }
            speiderRef.current = {
                x: s.x,
                z: s.z,
                maalX: s.x + dx,
                maalZ: s.z + dz,
                retur: false,
                sjekket: false,
            };
            onSpeider();
        },
        [aktiv, onSpeider]
    );

    const settKurs = useCallback(
        (p: THREE.Vector3) => {
            kursMerke.current.set(p.x, VANN_Y, p.z);
            onFlytt();
        },
        [onFlytt]
    );

    useFrame((_, dt) => {
        const d = Math.min(dt, 0.05);
        const s = skipPos.current;
        const f = fiendePos.current;

        // 1) Hangarskipet damper mot kursmerket.
        if (fase === 'idle' || fase === 'spiller') {
            const dx = kursMerke.current.x - s.x;
            const dz = kursMerke.current.z - s.z;
            const a = Math.hypot(dx, dz);
            if (a > 0.05) {
                const steg = Math.min(a, SKIP_FART * d);
                let ux = dx / a;
                let uz = dz / a;
                // Ligger atollen i veien, gli langs kanten av den.
                const ox = s.x - MIDWAY[0];
                const oz = s.z - MIDWAY[1];
                const od = Math.hypot(ox, oz);
                if (od < ATOLL_KLARING + 0.3 && ux * ox + uz * oz < 0) {
                    let tx = -oz / od;
                    let tz = ox / od;
                    if (tx * ux + tz * uz < 0) {
                        tx = -tx;
                        tz = -tz;
                    }
                    ux = tx;
                    uz = tz;
                }
                s.x += ux * steg;
                s.z += uz * steg;
                skipKurs.current = faceAlong([ux, uz]);
            }
            // Styr rundt Midway-atollen i stedet for å seile over land.
            const ax = s.x - MIDWAY[0];
            const az = s.z - MIDWAY[1];
            const ad = Math.hypot(ax, az);
            if (ad < ATOLL_KLARING) {
                const nx = ad > 0.01 ? ax / ad : 1;
                const nz = ad > 0.01 ? az / ad : 0;
                s.x = MIDWAY[0] + nx * ATOLL_KLARING;
                s.z = MIDWAY[1] + nz * ATOLL_KLARING;
            }
            // Og aldri inn i den japanske flåten.
            const ex = s.x - f.x;
            const ez = s.z - f.z;
            const ed = Math.hypot(ex, ez);
            if (ed < FLATE_KLARING) {
                const nx = ed > 0.01 ? ex / ed : -1;
                const nz = ed > 0.01 ? ez / ed : 0;
                s.x = f.x + nx * FLATE_KLARING;
                s.z = f.z + nz * FLATE_KLARING;
            }
        }
        if (skipGruppe.current) {
            skipGruppe.current.position.set(s.x, VANN_Y, s.z);
            skipGruppe.current.rotation.y = damp(
                skipGruppe.current.rotation.y,
                skipKurs.current,
                d,
                3
            );
        }

        // 2) Fienden seiler sakte mot Midway.
        if (fase === 'spiller') {
            const mx = MIDWAY[0] - f.x;
            const mz = MIDWAY[1] - f.z;
            const ma = Math.hypot(mx, mz);
            if (ma > 5) {
                f.x += (mx / ma) * FIENDE_DRIFT * d;
                f.z += (mz / ma) * FIENDE_DRIFT * d;
            }
        }
        if (fiendeGruppe.current) {
            fiendeGruppe.current.position.set(f.x, VANN_Y, f.z);
            fiendeGruppe.current.rotation.y = faceAlong([MIDWAY[0] - f.x, MIDWAY[1] - f.z]);
            fiendeGruppe.current.visible = funnet && synkRef.current < 1;
        }

        const avst = Math.hypot(f.x - s.x, f.z - s.z);

        // 3) Fienden leter etter deg - raskere jo nærmere du er.
        if (fase === 'spiller') {
            const naer = Math.max(0, (NAER_GRENSE - avst) / NAER_GRENSE);
            onFare((FARE_GRUNN + FARE_NAER * naer) * d);
        }

        // 4) Speiderflyet: ut til målet, sjekk, og hjem igjen.
        const sp = speiderRef.current;
        if (sp) {
            const tx = sp.retur ? s.x : sp.maalX;
            const tz = sp.retur ? s.z : sp.maalZ;
            const ddx = tx - sp.x;
            const ddz = tz - sp.z;
            const da = Math.hypot(ddx, ddz);
            const steg = Math.min(da, SPEIDER_FART * d);
            if (da > 0.01) {
                sp.x += (ddx / da) * steg;
                sp.z += (ddz / da) * steg;
            }
            if (speiderGruppe.current) {
                speiderGruppe.current.visible = true;
                speiderGruppe.current.position.set(sp.x, 2.2, sp.z);
                if (da > 0.01) speiderGruppe.current.rotation.y = faceAlong([ddx, ddz]);
            }
            if (!sp.retur && da < 0.2) {
                sp.retur = true;
                if (!sp.sjekket) {
                    sp.sjekket = true;
                    const naerFiende = Math.hypot(sp.x - f.x, sp.z - f.z) < SYNSVIDDE;
                    if (naerFiende && !funnet) onFunnet();
                    else if (!funnet) onBom();
                }
            } else if (sp.retur && da < 0.3) {
                speiderRef.current = null;
                if (speiderGruppe.current) speiderGruppe.current.visible = false;
            }
        }

        // 5) Rekkevidde og avstand - speil kun ved endring.
        const inne = funnet && avst <= ANGREP_REKKEVIDDE;
        if (inne !== sisteRekkevidde.current) {
            sisteRekkevidde.current = inne;
            onRekkevidde(inne);
        }
        const rundet = Math.round(avst);
        if (rundet !== sisteAvstand.current) {
            sisteAvstand.current = rundet;
            onAvstand(rundet);
        }
        if (funnet) {
            const hx = Math.round(f.x * 4) / 4;
            const hz = Math.round(f.z * 4) / 4;
            if (hx !== hotspotPos[0] || hz !== hotspotPos[2]) setHotspotPos([hx, 2.6, hz]);
        }

        // 6) Angrepet: bombeflyene flyr fra deg til fienden.
        if (fase === 'angriper' && angrepGruppe.current) {
            angrepT.current = Math.min(1, angrepT.current + d / 2.2);
            const t = angrepT.current;
            angrepGruppe.current.visible = t < 1;
            angrepGruppe.current.position.set(
                s.x + (f.x - s.x) * t,
                2.4 + Math.sin(t * Math.PI) * 1.2,
                s.z + (f.z - s.z) * t
            );
            angrepGruppe.current.rotation.y = faceAlong([f.x - s.x, f.z - s.z]);
            if (t >= 1 && !seierSendt.current) {
                seierSendt.current = true;
                setTreff(FORMASJON.map(([ox, oz]) => [f.x + ox, f.z + oz]));
                setSenker(true);
                setSprutSted([f.x, VANN_Y, f.z]);
                setSprut((n) => n + 1);
                window.setTimeout(onSeier, 2400);
            }
        }
    });

    // Fiendens skip synker etter treff.
    useFrame((_, dt) => {
        if (!senker || !fiendeGruppe.current) return;
        synkRef.current = Math.min(1, synkRef.current + dt * 0.35);
        fiendeGruppe.current.position.y = VANN_Y - synkRef.current * 2.4;
        if (synkRef.current >= 1) fiendeGruppe.current.visible = false;
    });

    // DEV-krok for selvspill-verifisering.
    useFrame(() => {
        if (!import.meta.env.DEV) return;
        const w = window as unknown as { __midwayDebug?: unknown };
        w.__midwayDebug = {
            skip: { x: skipPos.current.x, z: skipPos.current.z },
            fiende: { x: fiendePos.current.x, z: fiendePos.current.z },
            settKurs: (x: number, z: number) => kursMerke.current.set(x, VANN_Y, z),
        };
    });

    return (
        <group>
            <Seascape position={[0, 0, 0]} size={[80, 64]} waterY={VANN_Y} color="#2f7fae">
                {/* Klikkflate for speiderfly - usynlig, rett over vannet */}
                <mesh
                    position={[0, VANN_Y + 0.01, -1]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    onClick={sendSpeider}
                    userData={{ sceneAuditIgnore: true }}
                >
                    <planeGeometry args={[30, 22]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>

                {/* Midway-atollen: en lav sandbanke med flystripe */}
                <group position={[MIDWAY[0], VANN_Y, MIDWAY[1]]}>
                    <mesh position={[0, 0.06, 0]} receiveShadow>
                        <cylinderGeometry args={[1.5, 1.7, 0.12, 20]} />
                        <meshStandardMaterial color="#e9d9a6" roughness={1} />
                    </mesh>
                    <mesh position={[0, 0.125, 0]} rotation={[-Math.PI / 2, 0, 0.5]}>
                        <planeGeometry args={[0.35, 2.4]} />
                        <meshStandardMaterial color="#8b8b84" roughness={1} />
                    </mesh>
                    <FlatRing position={[0, 0.02, 0]} radius={2.1} tube={0.05} color="#e0f2fe" />
                </group>

                {/* Kursmerket - dra det dit hangarskipet skal */}
                <Draggable
                    position={[START[0] + 2.5, VANN_Y, START[1] - 1.5]}
                    planeY={VANN_Y}
                    bounds={BOUNDS}
                    onDrag={settKurs}
                    onDrop={settKurs}
                    liftY={0.25}
                >
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[2.6, 1.2, 2.6]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <FlatRing position={[0, 0.05, 0]} radius={0.9} tube={0.11} color="#facc15" />
                    <mesh position={[0, 0.5, 0]}>
                        <cylinderGeometry args={[0.07, 0.07, 1, 6]} />
                        <meshStandardMaterial color="#facc15" roughness={0.6} />
                    </mesh>
                </Draggable>

                {/* Ditt hangarskip med rekkevidde-ringen til bombeflyene */}
                <group ref={skipGruppe} position={[START[0], VANN_Y, START[1]]}>
                    <Hangarskip dekk="#a1866b" />
                    <FlatRing
                        position={[0, 0.03, 0]}
                        radius={ANGREP_REKKEVIDDE}
                        tube={0.07}
                        color={kanAngripe ? '#22c55e' : '#bbf7d0'}
                        segments={64}
                    />
                </group>

                {/* Den japanske flåten - skjult til en speider finner den */}
                <group ref={fiendeGruppe} position={[fiende[0], VANN_Y, fiende[1]]} visible={false}>
                    {FORMASJON.map(([ox, oz], i) => (
                        <group key={i} position={[ox, 0, oz]}>
                            <Hangarskip dekk="#c2a878" merke="#dc2626" />
                        </group>
                    ))}
                    <FlatRing position={[0, 0.03, 0]} radius={3.4} tube={0.07} color="#f87171" />
                </group>

                <Impact preset="splash" trigger={sprut} position={sprutSted} />
            </Seascape>

            {/* Speiderflyet */}
            <group ref={speiderGruppe} visible={false}>
                <Fly farge="#1e3a8a" />
            </group>

            {/* Bombeflyene */}
            <group ref={angrepGruppe} visible={false}>
                {[-0.7, 0, 0.7].map((o, i) => (
                    <group key={i} position={[o, 0, -Math.abs(o) * 0.8]}>
                        <Fly farge="#334155" />
                    </group>
                ))}
            </group>

            {kanAngripe && (
                <Hotspot position={hotspotPos} onSelect={onAngrip} label="ANGRIP" radius={0.8} />
            )}

            {treff.map(([x, z], i) => (
                <Explosion key={i} x={x} z={z} scale={0.8} palette="fire" />
            ))}
        </group>
    );
}
