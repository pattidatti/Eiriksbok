import { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    FlatRing,
    Building,
    Tree,
    Rock,
    Person,
    Banner,
    Burst,
    DataReadout,
    DragHint,
    SceneBanner,
    SceneFact,
    TimerPill,
    WinScreen,
    LoseScreen,
    useGameClock,
    damp,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Lyspære: et rike som er for stort til å styres med hær, kan holdes sammen av
// en beskjed som står i stein i hver eneste avkrok - men bare hvis beskjeden
// faktisk NÅR fram overalt. Eleven kjenner problemet på kroppen: fem søyler,
// seks provinser, og tiden renner ut mens de uopplyste glemmer budskapet.

interface Provins {
    id: string;
    navn: string;
    x: number;
    z: number;
    seed: number;
}

// Alle seks er ekte steder der Ashokas edikter er funnet.
const PROVINSER: Provins[] = [
    { id: 'kandahar', navn: 'Kandahar', x: -8.5, z: -3.5, seed: 3 },
    { id: 'kalsi', navn: 'Kalsi', x: -4, z: -5.5, seed: 7 },
    { id: 'sarnath', navn: 'Sarnath', x: -0.5, z: -4, seed: 11 },
    { id: 'girnar', navn: 'Girnar', x: -6.5, z: 2.5, seed: 5 },
    { id: 'dhauli', navn: 'Dhauli', x: 4.5, z: 1.5, seed: 9 },
    { id: 'brahmagiri', navn: 'Brahmagiri', x: 1, z: 4.5, seed: 13 },
];

const REKKEVIDDE = 4.6;
const OPPLYST = 0.85;
const RUNDETID = 80;

// Startplassene i steinbruddet foran riket. Ingen av dem når en provins.
const STEINBRUDD: [number, number][] = [
    [-3.2, 9.5],
    [-1.6, 9.5],
    [0, 9.5],
    [1.6, 9.5],
    [3.2, 9.5],
];

const STEIN_KALD = new THREE.Color('#6f6559');
const STEIN_GULL = new THREE.Color('#e0a63a');

type Fase = 'idle' | 'spiller' | 'vunnet' | 'tapt';

function startSoyler(): [number, number][] {
    return STEINBRUDD.map((s) => [s[0], s[1]] as [number, number]);
}

// ---------------------------------------------------------------- provinsen

function ProvinsMesh({
    provins,
    tillitRef,
    indeks,
}: {
    provins: Provins;
    tillitRef: React.RefObject<number[]>;
    indeks: number;
}) {
    const plataRef = useRef<THREE.MeshStandardMaterial>(null);
    const stripeRef = useRef<THREE.Mesh>(null);
    const stripeMatRef = useRef<THREE.MeshBasicMaterial>(null);

    useFrame((_, dtRaa) => {
        const dt = Math.min(dtRaa, 0.05);
        const t = tillitRef.current?.[indeks] ?? 0;
        if (plataRef.current) {
            plataRef.current.color.lerpColors(STEIN_KALD, STEIN_GULL, t);
        }
        if (stripeRef.current) {
            const maal = 0.2 + t * 3.6;
            stripeRef.current.scale.y = damp(stripeRef.current.scale.y, maal, dt, 4);
            stripeRef.current.position.y = stripeRef.current.scale.y / 2;
        }
        if (stripeMatRef.current) {
            stripeMatRef.current.opacity = damp(stripeMatRef.current.opacity, 0.08 + t * 0.5, dt, 4);
        }
    });

    return (
        <group position={[provins.x, 0, provins.z]}>
            {/* Steinplata provinsen står på - farges av tilliten */}
            <mesh position={[0, 0.04, 0]} receiveShadow>
                <cylinderGeometry args={[1.9, 2, 0.08, 24]} />
                <meshStandardMaterial ref={plataRef} color="#6f6559" roughness={0.9} />
            </mesh>

            <Building
                position={[-0.7, 0.08, -0.4]}
                w={1.1}
                h={0.8}
                d={0.9}
                body="#c8a271"
                roof="#7a4a2f"
                seed={provins.seed}
            />
            <Building
                position={[0.75, 0.08, 0.35]}
                w={0.9}
                h={0.7}
                d={0.8}
                body="#d8bb8e"
                roof="#7a4a2f"
                seed={provins.seed + 1}
            />
            <Person position={[0.05, 0.08, 1]} scale={0.72} body="#e8dcc0" legs="#4a3b2a" />
            <Tree position={[-1.35, 0.08, 0.85]} leaf="#4f7a3d" seed={provins.seed + 2} />

            {/* Lysstripa: hvor godt budskapet står i denne provinsen */}
            <mesh ref={stripeRef} position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.13, 0.2, 1, 10]} />
                <meshBasicMaterial
                    ref={stripeMatRef}
                    color="#ffd77a"
                    transparent
                    opacity={0.1}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}

// ------------------------------------------------------------------- søylen

function SoyleMesh() {
    return (
        <group>
            {/* Sokkel */}
            <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.42, 0.5, 0.18, 12]} />
                <meshStandardMaterial color="#b8ad97" roughness={0.9} />
            </mesh>
            {/* Skaftet - loddrett, som en ekte ediktsøyle */}
            <mesh position={[0, 1.73, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.29, 3.1, 14]} />
                <meshStandardMaterial color="#e6ddc6" roughness={0.55} />
            </mesh>
            {/* Innskriften - et belte av skrift rundt skaftet */}
            <mesh position={[0, 1.35, 0]}>
                <cylinderGeometry args={[0.278, 0.288, 0.85, 14, 1, true]} />
                <meshStandardMaterial color="#9a8663" roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
            {/* Klokkekapitel */}
            <mesh position={[0, 3.44, 0]} castShadow>
                <cylinderGeometry args={[0.32, 0.19, 0.34, 14]} />
                <meshStandardMaterial color="#efe7d2" roughness={0.5} />
            </mesh>
            {/* Rundplata over kapitelet */}
            <mesh position={[0, 3.67, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.14, 16]} />
                <meshStandardMaterial color="#efe7d2" roughness={0.5} />
            </mesh>
            {/* Fire løver som ser hver sin vei - Ashokas løvesøyle */}
            {[0, 1, 2, 3].map((i) => {
                const v = (i * Math.PI) / 2;
                return (
                    <group
                        key={i}
                        position={[Math.sin(v) * 0.17, 3.92, Math.cos(v) * 0.17]}
                        rotation={[0, v, 0]}
                    >
                        <mesh castShadow>
                            <boxGeometry args={[0.2, 0.3, 0.28]} />
                            <meshStandardMaterial color="#e8c76a" roughness={0.45} />
                        </mesh>
                        <mesh position={[0, 0.12, 0.16]} castShadow>
                            <sphereGeometry args={[0.11, 10, 8]} />
                            <meshStandardMaterial color="#e8c76a" roughness={0.45} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

// -------------------------------------------------------------------- scene

interface SceneProps {
    faseRef: React.RefObject<Fase>;
    feiring: number;
    onStatus: (opplyst: boolean[]) => void;
    onSeier: () => void;
    onGrep: () => void;
}

// Scenen eier sin egen muterbare tilstand (søyleposisjoner og tillit per
// provins). Ved nytt forsøk remonteres den med `key`, og da nullstiller alt
// seg selv - ingen tilstand å rydde opp i utenfra.
function Scene({ faseRef, feiring, onStatus, onSeier, onGrep }: SceneProps) {
    const forrigeRef = useRef('');
    const soylerRef = useRef<[number, number][]>(startSoyler());
    const tillitRef = useRef<number[]>(PROVINSER.map(() => 0.1));
    const soyleBounds = useMemo(() => ({ minX: -11, maxX: 10, minZ: -8, maxZ: 10 }), []);
    // Rekkevidde-ringen vises først når eleven tar tak i søyla. Fem ringer
    // oppå hverandre i steinbruddet ble bare et virvar av streker.
    const [rort, setRort] = useState<boolean[]>(() => STEINBRUDD.map(() => false));

    useFrame((_, dtRaa) => {
        const dt = Math.min(dtRaa, 0.05);
        if (faseRef.current !== 'spiller') return;
        const soyler = soylerRef.current;
        const tillit = tillitRef.current;
        const flagg: boolean[] = [];
        let antall = 0;
        for (let i = 0; i < PROVINSER.length; i++) {
            const p = PROVINSER[i];
            let dekket = false;
            for (const s of soyler) {
                const dx = s[0] - p.x;
                const dz = s[1] - p.z;
                if (dx * dx + dz * dz <= REKKEVIDDE * REKKEVIDDE) {
                    dekket = true;
                    break;
                }
            }
            tillit[i] = Math.min(1, Math.max(0, tillit[i] + (dekket ? 0.6 : -0.085) * dt));
            const lyser = tillit[i] >= OPPLYST;
            flagg.push(lyser);
            if (lyser) antall++;
        }
        const nokkel = flagg.map((f) => (f ? '1' : '0')).join('');
        if (nokkel !== forrigeRef.current) {
            forrigeRef.current = nokkel;
            onStatus(flagg);
        }
        if (antall === PROVINSER.length) onSeier();
    });

    return (
        <group>
            <GroundPlane size={34} depth={30} color="#c3a878" position={[0, 0, 1.5]} />

            {/* Riket rundt provinsene: fjell i nord, skog i utkantene */}
            <Rock position={[-10.5, 0.35, -6]} color="#9a917f" scale={1.6} />
            <Rock position={[-7.4, 0.28, -7]} color="#9a917f" scale={1.3} />
            <Rock position={[7.6, 0.3, -6.4]} color="#9a917f" scale={1.4} />
            <Tree position={[8.6, 0, 3.5]} leaf="#426b33" seed={21} />
            <Tree position={[-9.6, 0, 5.4]} leaf="#426b33" seed={22} />
            <Tree position={[6.4, 0, 6.6]} leaf="#426b33" seed={23} />

            {/* Hovedstaden Pataliputra - der Ashoka sitter */}
            <group position={[0.5, 0, -0.5]}>
                <mesh position={[0, 0.03, 0]} receiveShadow>
                    <cylinderGeometry args={[2.4, 2.5, 0.06, 26]} />
                    <meshStandardMaterial color="#b09a72" roughness={0.9} />
                </mesh>
                <Building
                    position={[0, 0.06, 0]}
                    w={1.9}
                    h={1.7}
                    d={1.7}
                    body="#e5d6b4"
                    roof="#8c3b2c"
                    seed={31}
                />
                <Building
                    position={[-1.3, 0.06, 0.9]}
                    w={1}
                    h={0.9}
                    d={0.9}
                    body="#d9c8a4"
                    roof="#8c3b2c"
                    seed={32}
                />
                <Banner position={[1.5, 0.06, 0.8]} color="#c2410c" height={1.8} />
                <Person
                    position={[0.25, 0.06, 1.5]}
                    scale={0.8}
                    body="#f4e9cf"
                    hat="crown"
                    hatColor="#d4a017"
                />
            </group>

            {PROVINSER.map((p, i) => (
                <ProvinsMesh key={p.id} provins={p} indeks={i} tillitRef={tillitRef} />
            ))}

            {/* Steinbruddet: fem uhugde søyler eleven kan dra ut i riket */}
            {STEINBRUDD.map((start, i) => (
                <Draggable
                    key={i}
                    position={[start[0], 0, start[1]]}
                    bounds={soyleBounds}
                    liftY={0.3}
                    dropFx="dustPuff"
                    onDragStart={() => {
                        onGrep();
                        setRort((f) => (f[i] ? f : f.map((v, j) => (j === i ? true : v))));
                    }}
                    onDrag={(pos) => {
                        soylerRef.current[i] = [pos.x, pos.z];
                    }}
                    onDrop={(pos) => {
                        soylerRef.current[i] = [pos.x, pos.z];
                    }}
                >
                    {/* Romslig usynlig gripeflate - trygg på trackpad */}
                    <mesh position={[0, 1.7, 0]}>
                        <boxGeometry args={[1.8, 3.6, 1.8]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <SoyleMesh />
                    {/* Rekkevidden budskapet når - ligger flatt på bakken */}
                    {rort[i] && (
                        <FlatRing
                            position={[0, 0.02, 0]}
                            radius={REKKEVIDDE}
                            tube={0.09}
                            color="#d99a2b"
                            segments={48}
                        />
                    )}
                </Draggable>
            ))}

            <Burst position={[0.5, 2.6, -0.5]} trigger={feiring} color="#f6c85f" count={34} spread={4} />
        </group>
    );
}

// ----------------------------------------------------------------- spillet

export default function EdiktSoylene3D({ onComplete, onRetry }: MicroGameProps) {
    const [fase, setFase] = useState<Fase>('idle');
    const [lys, setLys] = useState<boolean[]>(() => PROVINSER.map(() => false));
    const [forsok, setForsok] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra en søyle ut i riket. Der den står, når budskapet fram.'
    );
    const [feiring, setFeiring] = useState(0);

    const faseRef = useRef<Fase>('idle');

    const settFase = useCallback((f: Fase) => {
        faseRef.current = f;
        setFase(f);
    }, []);

    const paaUtloept = useCallback(() => {
        if (faseRef.current !== 'spiller') return;
        settFase('tapt');
        setBanner(null);
        microSfx.play('incorrect');
    }, [settFase]);

    const klokke = useGameClock({
        seconds: RUNDETID,
        running: fase === 'spiller',
        onExpire: paaUtloept,
    });

    const start = useCallback(() => {
        if (faseRef.current !== 'idle') return;
        settFase('spiller');
        setBanner('Provinsene glemmer budskapet hvis ingen søyle når dem.');
    }, [settFase]);

    const seier = useCallback(() => {
        if (faseRef.current !== 'spiller') return;
        settFase('vunnet');
        setBanner(null);
        setFeiring((f) => f + 1);
        microSfx.play('complete');
        onComplete({ score: 1, completed: true });
    }, [onComplete, settFase]);

    const nullstill = useCallback(() => {
        setLys(PROVINSER.map(() => false));
        setBanner('Dra en søyle ut i riket. Der den står, når budskapet fram.');
        settFase('idle');
        klokke.restart();
        setForsok((f) => f + 1);
        onRetry?.();
    }, [klokke, onRetry, settFase]);

    const antallLys = lys.filter(Boolean).length;

    return (
        <MicroGameScaffold
            title="Reis ediktsøylene"
            subtitle="Ashoka kan ikke rope til hele riket. Sett budskapet i stein der folk bor."
            estimatedSeconds={150}
            onRetry={nullstill}
            scene={
                <Scene
                    key={forsok}
                    faseRef={faseRef}
                    feiring={feiring}
                    onStatus={setLys}
                    onSeier={seier}
                    onGrep={start}
                />
            }
            canvas={{
                idle: fase === 'idle',
                autoRotateSpeed: 0.2,
                camera: { position: [0, 18, 22], fov: 44 },
                target: [0, 0, 1.5],
                background: '#dfe9f0',
                fog: { color: '#dfe9f0', near: 30, far: 60 },
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Opplyste provinser', value: `${antallLys} av ${PROVINSER.length}` },
                        ]}
                    />
                    {fase === 'spiller' && (
                        <TimerPill corner="br" label="Ashokas tid" seconds={klokke.remaining} warnBelow={15} />
                    )}
                    <DragHint show={fase === 'idle'} corner="bc">
                        Dra en søyle med musa
                    </DragHint>
                </>
            }
        >
            <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                    {PROVINSER.map((p, i) => (
                        <span
                            key={p.id}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                lys[i]
                                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                                    : 'bg-slate-100 border-slate-200 text-slate-500'
                            }`}
                        >
                            {p.navn}
                        </span>
                    ))}
                </div>

                {fase === 'vunnet' && (
                    <WinScreen title="Budskapet står i stein over hele riket!" onReplay={nullstill}>
                        Du hadde fem søyler til seks provinser. Det var nettopp Ashokas problem: riket var
                        større enn stemmen hans. Derfor hugget han de samme reglene i stein overalt, og derfor
                        kan vi lese dem den dag i dag.
                    </WinScreen>
                )}

                {fase === 'tapt' && (
                    <LoseScreen
                        title="Tiden gikk ut. Deler av riket hørte aldri budskapet."
                        onRetry={nullstill}
                    >
                        En søyle rekker bare så langt. Sett én søyle midt mellom to provinser som ligger nær
                        hverandre, så holder de fem søylene til alle seks.
                    </LoseScreen>
                )}

                {fase !== 'vunnet' && fase !== 'tapt' && (
                    <SceneFact>
                        Ashoka satte opp innskrifter i stein over hele riket, fra Kandahar i nordvest til
                        Brahmagiri i sør. Den gyldne ringen viser hvor langt én søyle rekker.
                    </SceneFact>
                )}
            </div>
        </MicroGameScaffold>
    );
}
