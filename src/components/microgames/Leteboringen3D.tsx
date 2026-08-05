import { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Seascape,
    Boat,
    Draggable,
    Hotspot,
    FlatRing,
    Burst,
    Impact,
    DataReadout,
    DragHint,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    LoseScreen,
    faceAlong,
    damp,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Lyspære: oljen lå ikke og ventet på at noen skulle plukke den opp. Phillips
// boret tørt gang på gang i over tre år, og var i ferd med å gi opp da Ekofisk
// kom rett før jul i 1969. Eleven kjenner det på kroppen: fem brønner, et svakt
// seismisk signal å lese, og ingen garanti for at det finnes noe der nede.

const VANN_Y = 0.06;
const BREDDE = 64;
const DYBDE = 52;
const GRENSER = { minX: -11, maxX: 11, minZ: -8.5, maxZ: 8.5 };
const TREFF_RADIUS = 2.1;
const BROENNER = 5;

// Fire mulige reservoarer. Vi bytter mellom dem ved nytt forsøk, slik at eleven
// ikke bare husker svaret - men uten tilfeldighet som gjør spillet uforutsigbart.
const RESERVOARER: [number, number][] = [
    [6.4, -4.2],
    [-7.6, 3.4],
    [3.2, 5.6],
    [-4.8, -5.8],
];

type Fase = 'leter' | 'borer' | 'vunnet' | 'tapt';

interface Hull {
    x: number;
    z: number;
    treff: boolean;
}

function avstand(ax: number, az: number, bx: number, bz: number) {
    return Math.hypot(ax - bx, az - bz);
}

// Seismikken er sterkest rett over reservoaret og dør ut mot kanten av feltet.
function signalFor(d: number) {
    const raa = 1 - d / 15;
    return Math.max(0, Math.min(1, raa));
}

function signalOrd(s: number) {
    if (s > 0.86) return 'meget sterkt';
    if (s > 0.72) return 'sterkt';
    if (s > 0.55) return 'tydelig';
    if (s > 0.35) return 'svakt';
    return 'nesten stille';
}

// Forsyningsskipet: kit-Boat i stor skala med et lyst styrhus oppå, slik at
// det leses som et skip ovenfra og ikke som en mørk stokk i sjøen.
function Forsyningsskip({
    position,
    heading,
}: {
    position: [number, number, number];
    heading: number;
}) {
    return (
        <group position={position} rotation={[0, heading, 0]}>
            <group scale={1.9}>
                <Boat color="#5b6875" />
                {/* Styrhus akterut - baugen peker +Z, så huset står bakerst */}
                <mesh position={[0, 0.78, -0.55]} castShadow>
                    <boxGeometry args={[0.62, 0.5, 0.6]} />
                    <meshStandardMaterial color="#eef2f6" roughness={0.6} />
                </mesh>
                <mesh position={[0, 1.14, -0.55]} castShadow>
                    <boxGeometry args={[0.44, 0.24, 0.44]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.55} />
                </mesh>
                {/* Åpent lastedekk forut */}
                <mesh position={[0, 0.56, 0.45]} receiveShadow>
                    <boxGeometry args={[0.72, 0.08, 1.1]} />
                    <meshStandardMaterial color="#c96a2a" roughness={0.85} />
                </mesh>
            </group>
        </group>
    );
}

// ----------------------------------------------------------------- riggen

function Rigg({ borerRef }: { borerRef: React.RefObject<number> }) {
    const borRef = useRef<THREE.Mesh>(null);

    useFrame((_, dtRaa) => {
        const dt = Math.min(dtRaa, 0.05);
        const t = borerRef.current ?? 0;
        if (borRef.current) {
            // Borestrengen kjøres ned gjennom vannet mens det bores.
            const maal = -0.2 - t * 2.6;
            borRef.current.position.y = damp(borRef.current.position.y, maal, dt, 5);
        }
    });

    return (
        <group>
            {/* Fire bein ned i sjøen - en oppjekkbar rigg står på havbunnen */}
            {[
                [-1.15, -1.15],
                [1.15, -1.15],
                [-1.15, 1.15],
                [1.15, 1.15],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, -0.7, z]} castShadow>
                    <cylinderGeometry args={[0.14, 0.14, 3.2, 8]} />
                    <meshStandardMaterial color="#c2410c" roughness={0.75} />
                </mesh>
            ))}

            {/* Dekket - bunnen ligger på 0.9, godt over vannlinja */}
            <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.1, 0.3, 3.1]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
            </mesh>
            {/* Boligmodul */}
            <mesh position={[-0.85, 1.55, 0.8]} castShadow>
                <boxGeometry args={[1.2, 0.7, 1.2]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
            {/* Helikopterdekk - lyst, hevet på en sokkel over boligmodulen */}
            <mesh position={[-0.85, 1.98, 0.8]} castShadow>
                <cylinderGeometry args={[0.26, 0.26, 0.22, 10]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
            </mesh>
            <mesh position={[-0.85, 2.14, 0.8]} castShadow receiveShadow>
                <cylinderGeometry args={[0.78, 0.78, 0.1, 18]} />
                <meshStandardMaterial color="#9aa7b6" roughness={0.85} />
            </mesh>
            <mesh position={[-0.85, 2.2, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.4, 0.5, 20]} />
                <meshBasicMaterial color="#f8fafc" toneMapped={false} />
            </mesh>

            {/* Boretårnet - loddrett, fire bein som smalner mot toppen */}
            <group position={[0.55, 1.2, -0.4]}>
                {[
                    [-0.34, -0.34],
                    [0.34, -0.34],
                    [-0.34, 0.34],
                    [0.34, 0.34],
                ].map(([x, z], i) => (
                    <mesh key={i} position={[x * 0.72, 1.25, z * 0.72]} castShadow>
                        <cylinderGeometry args={[0.055, 0.055, 2.5, 6]} />
                        <meshStandardMaterial color="#ea580c" roughness={0.7} />
                    </mesh>
                ))}
                {/* Tverrbånd */}
                {[0.55, 1.35, 2.15].map((y, i) => (
                    <mesh key={i} position={[0, y, 0]}>
                        <boxGeometry args={[0.62, 0.06, 0.62]} />
                        <meshStandardMaterial color="#fb923c" roughness={0.7} />
                    </mesh>
                ))}
                {/* Toppen på tårnet */}
                <mesh position={[0, 2.55, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.14, 0.5]} />
                    <meshStandardMaterial color="#fdba74" roughness={0.7} />
                </mesh>
                {/* Borestrengen som kjøres ned */}
                <mesh ref={borRef} position={[0, -0.2, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, 3.4, 8]} />
                    <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.4} />
                </mesh>
            </group>
        </group>
    );
}

// Sonarringen under riggen: vokser og lyser med det seismiske signalet.
function Sonar({ signalRef }: { signalRef: React.RefObject<number> }) {
    const ringRef = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshBasicMaterial>(null);

    useFrame((state, dtRaa) => {
        const dt = Math.min(dtRaa, 0.05);
        const s = signalRef.current ?? 0;
        const puls = 1 + Math.sin(state.clock.elapsedTime * 2.6) * 0.06 * s;
        if (ringRef.current) {
            const maal = (1 + s * 0.9) * puls;
            const n = damp(ringRef.current.scale.x, maal, dt, 5);
            ringRef.current.scale.set(n, n, n);
        }
        if (matRef.current) {
            matRef.current.opacity = damp(matRef.current.opacity, 0.18 + s * 0.62, dt, 5);
            matRef.current.color.setRGB(0.15 + s * 0.85, 0.75 - s * 0.28, 0.35 - s * 0.3);
        }
    });

    return (
        <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.62, 2.9, 48]} />
            <meshBasicMaterial
                ref={matRef}
                color="#22c55e"
                transparent
                opacity={0.3}
                depthWrite={false}
                toneMapped={false}
            />
        </mesh>
    );
}

// -------------------------------------------------------------------- scene

interface SceneProps {
    hull: Hull[];
    riggPos: [number, number];
    feiring: number;
    sprut: number;
    sprutPos: [number, number, number];
    borerRef: React.RefObject<number>;
    signalRef: React.RefObject<number>;
    onFlytt: (x: number, z: number) => void;
    onGrep: () => void;
    onBor: () => void;
    kanBore: boolean;
}

function Scene({
    hull,
    riggPos,
    feiring,
    sprut,
    sprutPos,
    borerRef,
    signalRef,
    onFlytt,
    onGrep,
    onBor,
    kanBore,
}: SceneProps) {
    return (
        <group>
            <Seascape position={[0, 0, 0]} size={[BREDDE, DYBDE]} waterY={VANN_Y} color="#2f6f95">
                {/* Forsyningsskipene ligger og venter i utkanten av feltet */}
                <Forsyningsskip position={[-8.6, VANN_Y, 6.6]} heading={faceAlong([1, -0.3])} />
                <Forsyningsskip position={[9.2, VANN_Y, -5.4]} heading={faceAlong([-1, 0.25])} />

                {/* Alle brønnene som allerede er boret - tørre eller treff */}
                {hull.map((h, i) => (
                    <group key={i} position={[h.x, VANN_Y, h.z]}>
                        <FlatRing
                            position={[0, 0.03, 0]}
                            radius={0.62}
                            tube={0.09}
                            color={h.treff ? '#16a34a' : '#94a3b8'}
                        />
                        {/* Merkebøye som står i vannet der brønnen ble boret */}
                        <mesh position={[0, 0.32, 0]} castShadow>
                            <cylinderGeometry args={[0.13, 0.18, 0.62, 8]} />
                            <meshStandardMaterial
                                color={h.treff ? '#16a34a' : '#cbd5e1'}
                                roughness={0.7}
                            />
                        </mesh>
                        <mesh position={[0, 0.72, 0]}>
                            <sphereGeometry args={[0.11, 8, 8]} />
                            <meshStandardMaterial color={h.treff ? '#bbf7d0' : '#f1f5f9'} />
                        </mesh>
                    </group>
                ))}

                {/* Riggen eleven drar rundt på feltet */}
                <Draggable
                    position={[0, VANN_Y, 4.6]}
                    planeY={VANN_Y}
                    bounds={GRENSER}
                    liftY={0.12}
                    onDragStart={onGrep}
                    onDrag={(p) => onFlytt(p.x, p.z)}
                    onDrop={(p) => onFlytt(p.x, p.z)}
                >
                    {/* Romslig usynlig gripeflate - trygg på trackpad */}
                    <mesh position={[0, 1.7, 0]}>
                        <boxGeometry args={[5.2, 4.9, 5.2]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <Sonar signalRef={signalRef} />
                    <group scale={1.45}>
                        <Rigg borerRef={borerRef} />
                    </group>
                </Draggable>

                {/* Bore-markøren ligger UTENFOR Draggable. Inne i den blir klikk
                    spist av dragets pointer-capture, og eleven får ingen respons. */}
                {kanBore && (
                    <Hotspot
                        position={[riggPos[0] + 0.8, 6.6, riggPos[1] - 0.58]}
                        radius={0.75}
                        label="Bor her"
                        onSelect={onBor}
                    />
                )}
            </Seascape>

            <Impact preset="splash" trigger={sprut} position={sprutPos} count={16} />
            <Burst
                position={[sprutPos[0], sprutPos[1] + 2.4, sprutPos[2]]}
                trigger={feiring}
                color="#1f2937"
                count={40}
                spread={4.5}
            />
        </group>
    );
}

// ------------------------------------------------------------------ spillet

export default function Leteboringen3D({ onComplete, onRetry }: MicroGameProps) {
    const [fase, setFase] = useState<Fase>('leter');
    const [hull, setHull] = useState<Hull[]>([]);
    const [forsok, setForsok] = useState(0);
    const [signal, setSignal] = useState(0);
    const [riggPos, setRiggPos] = useState<[number, number]>([0, 4.6]);
    const [feiring, setFeiring] = useState(0);
    const [sprut, setSprut] = useState(0);
    const [sprutPos, setSprutPos] = useState<[number, number, number]>([0, VANN_Y, 4.6]);
    const [banner, setBanner] = useState<string | null>(
        'Dra riggen rundt på feltet. Seismikken blir sterkere jo nærmere oljen du kommer.'
    );

    const posRef = useRef<[number, number]>([0, 4.6]);
    const hullRef = useRef<Hull[]>([]);
    const signalRef = useRef(0);
    const borerRef = useRef(0);
    const faseRef = useRef<Fase>('leter');

    const maal = useMemo(() => RESERVOARER[forsok % RESERVOARER.length], [forsok]);

    const settFase = useCallback((f: Fase) => {
        faseRef.current = f;
        setFase(f);
    }, []);

    const oppdaterSignal = useCallback(
        (x: number, z: number) => {
            posRef.current = [x, z];
            const s = signalFor(avstand(x, z, maal[0], maal[1]));
            signalRef.current = s;
            // DEV: eksponer samme informasjon eleven ser (riggens posisjon og
            // seismikken), slik at spillet kan selvspilles og balanseres.
            if (import.meta.env.DEV) {
                (window as unknown as Record<string, unknown>).__leteboringDebug = {
                    rigg: [x, z],
                    signal: s,
                };
            }
            // Kvantiser til hele prosent, slik at vi ikke setter state hver piksel.
            setSignal((forrige) => (Math.round(s * 100) !== Math.round(forrige * 100) ? s : forrige));
            // Kvantiser posisjonen slik at hotspot-en følger riggen uten at vi
            // rendrer på hver piksel.
            setRiggPos((f) =>
                Math.abs(f[0] - x) > 0.15 || Math.abs(f[1] - z) > 0.15 ? [x, z] : f
            );
        },
        [maal]
    );

    const grep = useCallback(() => {
        if (faseRef.current !== 'leter') return;
        setBanner(null);
    }, []);

    const bor = useCallback(() => {
        if (faseRef.current !== 'leter') return;
        settFase('borer');
        borerRef.current = 1;
        const [x, z] = posRef.current;
        const treff = avstand(x, z, maal[0], maal[1]) <= TREFF_RADIUS;
        setSprutPos([x, VANN_Y, z]);

        window.setTimeout(() => {
            borerRef.current = 0;
            const nye = [...hullRef.current, { x, z, treff }];
            hullRef.current = nye;
            setHull(nye);
            setSprut((s) => s + 1);
            if (treff) {
                setFeiring((f) => f + 1);
                microSfx.play('complete');
                settFase('vunnet');
                setBanner(null);
                onComplete({ score: 1, completed: true });
                return;
            }
            microSfx.play('incorrect');
            if (nye.length >= BROENNER) {
                settFase('tapt');
                setBanner(null);
            } else {
                settFase('leter');
                setBanner('Tørr brønn. Les seismikken og flytt riggen.');
            }
        }, 1250);
    }, [maal, onComplete, settFase]);

    const nullstill = useCallback(() => {
        setHull([]);
        hullRef.current = [];
        setSignal(0);
        signalRef.current = 0;
        borerRef.current = 0;
        posRef.current = [0, 4.6];
        setRiggPos([0, 4.6]);
        setForsok((f) => f + 1);
        settFase('leter');
        setBanner('Dra riggen rundt på feltet. Seismikken blir sterkere jo nærmere oljen du kommer.');
        onRetry?.();
    }, [onRetry, settFase]);

    const brukt = hull.length;
    const igjen = Math.max(0, BROENNER - brukt);

    return (
        <MicroGameScaffold
            title="Leteboringen: fem brønner i Nordsjøen"
            subtitle="Du er leteleder for Phillips i 1969. Sjefene i USA vil gi opp. Finn oljen før brønnene er brukt opp."
            estimatedSeconds={160}
            onRetry={nullstill}
            scene={
                <Scene
                    key={forsok}
                    hull={hull}
                    riggPos={riggPos}
                    feiring={feiring}
                    sprut={sprut}
                    sprutPos={sprutPos}
                    borerRef={borerRef}
                    signalRef={signalRef}
                    onFlytt={oppdaterSignal}
                    onGrep={grep}
                    onBor={bor}
                    kanBore={fase === 'leter'}
                />
            }
            canvas={{
                idle: brukt === 0 && signal === 0,
                autoRotateSpeed: 0.18,
                camera: { position: [0, 18, 22], fov: 44 },
                target: [0, 0, 0],
                background: '#c6d7e2',
                fog: { color: '#c6d7e2', near: 24, far: 52 },
                light: 'overcast',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Seismikk', value: Math.round(signal * 100), unit: '%' },
                            { label: 'Signal', value: signalOrd(signal) },
                            { label: 'Brønner igjen', value: igjen },
                        ]}
                    />
                    <SceneBadge corner="br">Nordsjøen 1969</SceneBadge>
                    <DragHint show={fase === 'leter' && brukt === 0} corner="bc">
                        Dra riggen med musa
                    </DragHint>
                </>
            }
        >
            <div className="space-y-3">
                {/* Bor-knapp under vinduet: samme handling som hotspot-en i 3D.
                    Hotspot-en er hovedveien, men en stor knapp er tryggere på
                    trackpad og gjør spillet tastatur-tilgjengelig. */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={bor}
                        disabled={fase !== 'leter'}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors bg-amber-600 text-white hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400"
                    >
                        {fase === 'borer' ? 'Borer ...' : 'Bor her'}
                    </button>
                    <span className="text-xs text-slate-500">
                        Seismikk her: <strong className="text-slate-700">{Math.round(signal * 100)} %</strong>
                    </span>
                </div>

                {/* Brønnteller: fem ruter som fylles etter hvert */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Brønner
                    </span>
                    <div className="flex gap-1.5">
                        {Array.from({ length: BROENNER }, (_, i) => {
                            const h = hull[i];
                            return (
                                <span
                                    key={i}
                                    className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold ${
                                        h
                                            ? h.treff
                                                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                                : 'bg-slate-100 border-slate-300 text-slate-400'
                                            : 'bg-white border-slate-200 text-slate-300'
                                    }`}
                                >
                                    {h ? (h.treff ? 'Ja' : 'Tørr') : i + 1}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {fase === 'vunnet' && (
                    <WinScreen title="Olje! Boret traff reservoaret." onReplay={nullstill}>
                        Slik føltes det rett før jul i 1969. Phillips hadde boret tørt gang på gang
                        i over tre år og var i ferd med å gi opp da Ekofisk kom. Feltet lå omtrent
                        3000 meter under havbunnen, 290 kilometer fra kysten.
                    </WinScreen>
                )}

                {fase === 'tapt' && (
                    <LoseScreen title="Fem tørre brønner. Selskapet ga opp feltet." onRetry={nullstill}>
                        Slik holdt det på å gå på ekte. Neste gang: flytt riggen litt om gangen og
                        se på seismikken. Går tallet opp, er du på rett vei. Går det ned, snu.
                    </LoseScreen>
                )}

                {(fase === 'leter' || fase === 'borer') && (
                    <SceneFact>
                        Seismikk er lydbølger som sendes ned i havbunnen og kastes tilbake.
                        Geologene kunne ane hvor det lå olje, men bare boring ga svaret.
                    </SceneFact>
                )}
            </div>
        </MicroGameScaffold>
    );
}
