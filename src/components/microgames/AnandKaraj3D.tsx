import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    GroundPlane,
    FlatRing,
    Person,
    Column,
    Rotatable,
    Burst,
    Particles,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    WinScreen,
    StepTracker,
    GlowMaterial,
    damp,
    faceAlong,
} from './kit';
import type { MicroGameProps } from './types';

// Anand Karaj: sikh-bryllupet. Paret gifter seg ikke ved å love noe til en
// prest. De går fire runder rundt Guru Granth Sahib mens et vers (laav) blir
// sunget. Boka står i sentrum - bokstavelig talt.
//
// Lyspære-øyeblikket: eleven drar paret rundt boka fire ganger og må holde
// takten med sangen. Det er selve rundgangen som er vielsen.

const TWO_PI = Math.PI * 2;
const RADIUS = 3.2;
const SEK_PER_LAAV = 9;

const LAAV = [
    {
        tittel: 'Første runde',
        tema: 'Grunnlaget',
        tekst: 'Første verset handler om hvorfor ekteskapet er en god vei å gå i livet.',
    },
    {
        tittel: 'Andre runde',
        tema: 'Det nye livet',
        tekst: 'Andre verset handler om å forlate det gamle livet og begynne på et nytt sammen.',
    },
    {
        tittel: 'Tredje runde',
        tema: 'Å gi slipp',
        tekst: 'Tredje verset handler om å slippe taket i det som ikke betyr noe.',
    },
    {
        tittel: 'Fjerde runde',
        tema: 'Å bli ett',
        tekst: 'Fjerde verset handler om å bli helt ett - med hverandre og med Gud.',
    },
];

// ── Klokke for sangen. Går i sanntid mens eleven går runden. ────────────────
function SangKlokke({
    running,
    laav,
    onProgress,
}: {
    running: boolean;
    laav: number;
    onProgress: (p: number) => void;
}) {
    const p = useRef(0);
    const sist = useRef(-1);

    useEffect(() => {
        p.current = 0;
        sist.current = -1;
    }, [laav]);

    useFrame((_, dt) => {
        if (!running || p.current >= 1) return;
        p.current = Math.min(1, p.current + dt / SEK_PER_LAAV);
        const steg = Math.floor(p.current * 40);
        if (steg !== sist.current) {
            sist.current = steg;
            onProgress(p.current);
        }
    });
    return null;
}

// ── Levende detaljer: flammene blafrer, musikerne vugger. ───────────────────
function Liv({ children }: { children: React.ReactNode }) {
    const g = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!g.current) return;
        const t = state.clock.elapsedTime;
        g.current.rotation.z = Math.sin(t * 1.4) * 0.05;
        g.current.position.y = Math.sin(t * 2.1) * 0.02;
    });
    return <group ref={g}>{children}</group>;
}

// ── Oljelampe på ringen. Lyser når runden er gått. ─────────────────────────
function Diya({ position, lit }: { position: [number, number, number]; lit: boolean }) {
    const flamme = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        if (!flamme.current) return;
        const mal = lit ? 1 : 0.001;
        const s = damp(flamme.current.scale.x, mal, dt, 6);
        flamme.current.scale.setScalar(s);
    });
    return (
        <group position={position}>
            <mesh position={[0, 0.05, 0]} castShadow>
                <cylinderGeometry args={[0.17, 0.13, 0.1, 12]} />
                <meshStandardMaterial color="#8c5a2b" roughness={0.85} />
            </mesh>
            <mesh ref={flamme} position={[0, 0.19, 0]} visible={lit}>
                <sphereGeometry args={[0.1, 10, 10]} />
                <GlowMaterial color="#ffb347" />
            </mesh>
        </group>
    );
}

// ── Palkien: tronen med Guru Granth Sahib under baldakin. ──────────────────
function Palki() {
    return (
        <group>
            {/* Sokkel */}
            <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
                <boxGeometry args={[3, 0.34, 2.4]} />
                <meshStandardMaterial color="#b9873f" roughness={0.8} />
            </mesh>
            {/* Trone (manji) */}
            <mesh position={[0, 0.47, 0]} castShadow>
                <boxGeometry args={[2.2, 0.26, 1.7]} />
                <meshStandardMaterial color="#d8b25c" roughness={0.7} />
            </mesh>
            {/* Boka under kledet (rumala) */}
            <mesh position={[0, 0.68, 0]} castShadow>
                <boxGeometry args={[1.4, 0.16, 1]} />
                <meshStandardMaterial color="#f4efe2" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.78, 0]} castShadow>
                <boxGeometry args={[1.5, 0.05, 1.1]} />
                <meshStandardMaterial color="#c9463f" roughness={0.9} />
            </mesh>
            {/* Fire stolper */}
            {(
                [
                    [-1.35, -1.05],
                    [1.35, -1.05],
                    [-1.35, 1.05],
                    [1.35, 1.05],
                ] as [number, number][]
            ).map(([x, z]) => (
                <mesh key={`${x}:${z}`} position={[x, 1.29, z]} castShadow>
                    <cylinderGeometry args={[0.07, 0.07, 1.9, 10]} />
                    <meshStandardMaterial color="#8a6a3a" roughness={0.8} />
                </mesh>
            ))}
            {/* Baldakin (chanani) */}
            <mesh position={[0, 2.33, 0]} castShadow>
                <boxGeometry args={[3.4, 0.14, 2.8]} />
                <meshStandardMaterial color="#c9463f" roughness={0.85} />
            </mesh>
            <mesh position={[0, 2.45, 0]} castShadow>
                <boxGeometry args={[3.6, 0.1, 3]} />
                <meshStandardMaterial color="#e8c46a" roughness={0.7} />
            </mesh>
        </group>
    );
}

// ── Selve scenen ───────────────────────────────────────────────────────────
function Scene({
    laavsDone,
    walking,
    running,
    laav,
    onAngle,
    onSang,
    feiring,
    feilVei,
}: {
    laavsDone: number;
    walking: boolean;
    running: boolean;
    laav: number;
    onAngle: (a: number) => void;
    onSang: (p: number) => void;
    feiring: number;
    feilVei: boolean;
}) {
    // Pilene på ringen viser hvilken vei paret skal gå.
    const piler = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * TWO_PI + 0.3;
        return {
            key: i,
            pos: [Math.sin(a) * RADIUS, 0.03, Math.cos(a) * RADIUS] as [number, number, number],
            rot: a,
        };
    });

    const lamper = [0, 1, 2, 3].map((i) => {
        const a = (i / 4) * TWO_PI + Math.PI / 4;
        return {
            key: i,
            pos: [Math.sin(a) * (RADIUS + 0.85), 0, Math.cos(a) * (RADIUS + 0.85)] as [
                number,
                number,
                number,
            ],
        };
    });

    // Forsamlingen sitter langs kantene.
    const forsamling = [
        [-4.7, -2.6],
        [-4.7, -1.2],
        [-4.7, 0.2],
        [-4.7, 1.6],
        [4.7, -2.6],
        [4.7, -1.2],
        [4.7, 0.2],
        [4.7, 1.6],
        [-2.1, 4.7],
        [-0.7, 4.7],
        [0.7, 4.7],
        [2.1, 4.7],
    ] as [number, number][];

    return (
        <group>
            <SangKlokke running={running} laav={laav} onProgress={onSang} />
            <GroundPlane size={44} depth={44} color="#d9c9a8" />

            {/* Teppet i midten */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
                <planeGeometry args={[11.5, 11.5]} />
                <meshStandardMaterial color="#c8a97a" roughness={1} />
            </mesh>

            <Palki />

            {/* Ringen paret går langs */}
            <FlatRing
                radius={RADIUS}
                tube={0.07}
                color={feilVei ? '#d4553f' : '#e0b352'}
                position={[0, 0.02, 0]}
            />
            {piler.map((p) => (
                <mesh key={p.key} position={p.pos} rotation={[-Math.PI / 2, 0, -p.rot]}>
                    <coneGeometry args={[0.13, 0.34, 3]} />
                    <meshStandardMaterial
                        color={feilVei ? '#c8402c' : '#a9762c'}
                        emissive={feilVei ? '#8a2113' : '#000000'}
                        emissiveIntensity={feilVei ? 0.6 : 0}
                        roughness={0.8}
                    />
                </mesh>
            ))}

            {lamper.map((l, i) => (
                <Diya key={l.key} position={l.pos} lit={i < laavsDone} />
            ))}

            {/* Paret. Rotatable svinger dem rundt boka. */}
            <Rotatable
                axis="y"
                sensitivity={0.02}
                min={-0.2}
                onChange={onAngle}
                position={[0, 0, 0]}
            >
                {/* Romslig usynlig gripeflate - trygg å ta tak i på trackpad */}
                <mesh position={[0, 1, RADIUS]}>
                    <boxGeometry args={[2.6, 2.2, 1.8]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                <group position={[0, 0, RADIUS]} rotation={[0, faceAlong([1, 0]), 0]}>
                    <Person
                        position={[0, 0, -0.42]}
                        body="#d8455c"
                        legs="#a8313f"
                        hat="hood"
                        hatColor="#e8c46a"
                        pose={walking ? 'walk' : 'idle'}
                    />
                    <Person
                        position={[0, 0, 0.42]}
                        body="#e8dcc0"
                        legs="#cbbfa2"
                        hat="cap"
                        hatColor="#e0803c"
                        pose={walking ? 'walk' : 'idle'}
                    />
                    {/* Palla: skjerfet som binder dem sammen */}
                    <mesh position={[0, 0.82, 0]} castShadow>
                        <boxGeometry args={[0.1, 0.07, 0.86]} />
                        <meshStandardMaterial color="#f0a93c" roughness={0.85} />
                    </mesh>
                </group>
            </Rotatable>

            {/* Musikerne (ragi) med instrumenter */}
            <group position={[-3.3, 0, 3.1]}>
                <Liv>
                    <Person position={[0, 0, 0]} pose="sit" body="#3f6f8f" hat="hood" hatColor="#2f5570" />
                </Liv>
                <mesh position={[0.45, 0.28, 0.25]} castShadow>
                    <boxGeometry args={[0.5, 0.24, 0.3]} />
                    <meshStandardMaterial color="#8a5a2f" roughness={0.85} />
                </mesh>
                <Liv>
                    <Person
                        position={[1.2, 0, 0.3]}
                        pose="sit"
                        body="#57806a"
                        hat="hood"
                        hatColor="#3f6350"
                    />
                </Liv>
            </group>

            {/* Granthien som leser, bak boka */}
            <Person position={[0, 0, -2.1]} pose="sit" body="#e5e0d2" hat="hood" hatColor="#d8b25c" />

            {/* Forsamlingen */}
            {forsamling.map(([x, z], i) => (
                <Person
                    key={`${x}:${z}`}
                    position={[x, 0, z]}
                    rotation={[0, Math.atan2(-x, -z), 0]}
                    pose="sit"
                    body={i % 3 === 0 ? '#8f7fb0' : i % 3 === 1 ? '#c98f5a' : '#7fa0b8'}
                    hat={i % 2 === 0 ? 'hood' : 'cap'}
                    hatColor={i % 2 === 0 ? '#d8b25c' : '#b45a4a'}
                />
            ))}

            {/* Søyler i hallen */}
            {(
                [
                    [-5.2, -5.2],
                    [5.2, -5.2],
                    [-5.2, 5.2],
                    [5.2, 5.2],
                ] as [number, number][]
            ).map(([x, z]) => (
                <Column key={`${x}:${z}`} position={[x, 0, z]} height={3.2} color="#efe6d2" />
            ))}

            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="motes" />
            </group>
            <Burst position={[0, 1.6, 0]} trigger={feiring} />
        </group>
    );
}

// ── Spillet ────────────────────────────────────────────────────────────────
export default function AnandKaraj3D({ onComplete, onRetry }: MicroGameProps) {
    const [turns, setTurns] = useState(0);
    const [sang, setSang] = useState(0);
    const [laavsDone, setLaavsDone] = useState(0);
    const [iTakt, setITakt] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [feilVei, setFeilVei] = useState(false);
    const [won, setWon] = useState(false);
    const [feiring, setFeiring] = useState(0);
    const [forsok, setForsok] = useState(0);

    const maxAngle = useRef(0);
    const sisteAngle = useRef(0);
    const sisteSteg = useRef(-1);
    const sangRef = useRef(0);
    const gangFerdigVed = useRef<number | null>(null);
    const fullfortTil = useRef(0);

    const laav = Math.min(laavsDone, LAAV.length - 1);
    const gang = Math.min(1, Math.max(0, turns - laavsDone));
    const walking = gang > 0 && gang < 1 && !won;

    const reset = useCallback(() => {
        maxAngle.current = 0;
        sisteAngle.current = 0;
        sisteSteg.current = -1;
        sangRef.current = 0;
        gangFerdigVed.current = null;
        fullfortTil.current = 0;
        setTurns(0);
        setSang(0);
        setLaavsDone(0);
        setITakt(0);
        setBanner(null);
        setFeilVei(false);
        setWon(false);
        setForsok((f) => f + 1);
        onRetry?.();
    }, [onRetry]);

    // Fullfør runden når BÅDE rundgangen og verset er ferdig.
    const sjekkRunde = useCallback(
        (g: number, s: number) => {
            if (won) return;
            if (g < 1) return;
            if (gangFerdigVed.current === null) gangFerdigVed.current = s;
            if (s < 1) {
                setBanner('Vent på verset. Runden teller først når sangen er ferdig.');
                return;
            }
            // Både onAngle og onSang kan treffe samme fullføring i samme tikk.
            if (fullfortTil.current !== laavsDone) return;
            fullfortTil.current = laavsDone + 1;
            const traff = Math.abs((gangFerdigVed.current ?? 0) - 1) <= 0.25;
            gangFerdigVed.current = null;
            sangRef.current = 0;
            setSang(0);
            setITakt((n) => n + (traff ? 1 : 0));
            setFeiring((f) => f + 1);
            setLaavsDone((n) => {
                const neste = n + 1;
                if (neste >= 4) {
                    setWon(true);
                    setBanner('Fire runder er gått. Paret er gift.');
                } else {
                    setBanner(`${LAAV[neste].tittel}: ${LAAV[neste].tema}. Gå videre rundt boka.`);
                }
                return neste;
            });
        },
        [won, laavsDone]
    );

    const onAngle = useCallback(
        (a: number) => {
            if (won) return;
            if (a < sisteAngle.current - 0.004) {
                setFeilVei(true);
                setBanner('Gå samme vei rundt hele tiden. Følg pilene.');
            } else if (a > sisteAngle.current + 0.004) {
                setFeilVei(false);
            }
            sisteAngle.current = a;
            if (a <= maxAngle.current) return;
            maxAngle.current = a;
            const steg = Math.floor((a / TWO_PI) * 50);
            if (steg === sisteSteg.current) return;
            sisteSteg.current = steg;
            const t = a / TWO_PI;
            setTurns(t);
            sjekkRunde(Math.min(1, Math.max(0, t - laavsDone)), sangRef.current);
        },
        [won, laavsDone, sjekkRunde]
    );

    const onSang = useCallback(
        (p: number) => {
            sangRef.current = p;
            setSang(p);
            sjekkRunde(Math.min(1, Math.max(0, maxAngle.current / TWO_PI - laavsDone)), p);
        },
        [laavsDone, sjekkRunde]
    );

    useEffect(() => {
        if (!won) return;
        onComplete({ score: 0.5 + 0.5 * (iTakt / 4), completed: true, artifact: { iTakt } });
    }, [won, iTakt, onComplete]);

    const running = !won && gang > 0 && sang < 1;
    // Etter seieren står begge linjene fulle - ikke på 0 % som om runden var ugjort.
    const sangVis = won ? 1 : sang;
    const gangVis = won ? 1 : gang;

    return (
        <MicroGameScaffold
            title="Fire runder rundt boka"
            subtitle="Dra paret rundt Guru Granth Sahib fire ganger, i takt med sangen. Da er de gift."
            estimatedSeconds={150}
            onRetry={reset}
            containerClassName="bg-gradient-to-b from-[#f6e6c8] via-[#f0dcbb] to-[#e3cfa6]"
            canvas={{
                idle: turns === 0 && !won,
                camera: { position: [0, 9.5, 15.5], fov: 40 },
                background: '#f6e6c8',
                light: 'golden',
                target: [0, 1, 0],
            }}
            scene={
                <Scene
                    key={forsok}
                    laavsDone={laavsDone}
                    walking={walking}
                    running={running}
                    laav={laavsDone}
                    onAngle={onAngle}
                    onSang={onSang}
                    feiring={feiring}
                    feilVei={feilVei}
                />
            }
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Runde', value: `${Math.min(laavsDone + (won ? 0 : 1), 4)} av 4` },
                            { label: 'I takt', value: `${iTakt}` },
                        ]}
                    />
                    <SceneBadge corner="br">Anand Karaj</SceneBadge>
                    <DragHint show={turns === 0 && !won} corner="bc">
                        Dra paret rundt boka
                    </DragHint>
                </>
            }
        >
            <div className="space-y-3">
                <StepTracker current={Math.min(laavsDone + (won ? 0 : 1), 4)} total={4} />

                <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>
                            {LAAV[laav].tittel}: {LAAV[laav].tema}
                        </span>
                        <span>Sangen {Math.round(sangVis * 100)} %</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-amber-500 transition-[width] duration-150"
                            style={{ width: `${Math.round(sangVis * 100)}%` }}
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Runden du går</span>
                        <span>{Math.round(gangVis * 100)} %</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-indigo-500 transition-[width] duration-150"
                            style={{ width: `${Math.round(gangVis * 100)}%` }}
                        />
                    </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{LAAV[laav].tekst}</p>

                {won && (
                    <WinScreen title="Vielsen er fullført" onReplay={reset}>
                        Paret lovet ingenting til en prest. De gikk fire runder rundt Guru Granth
                        Sahib mens de fire versene ble sunget. Det er boka som står i sentrum, og
                        rundgangen er selve vielsen. Du gikk {iTakt} av 4 runder i takt med sangen.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
}
