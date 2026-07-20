import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Radar, Crosshair, Anchor } from 'lucide-react';
import {
    MicroGameScaffold,
    Hotspot,
    Draggable,
    WaterPlane,
    Burst,
    damp,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    DataReadout,
    WinScreen,
    StepTracker,
    SceneSlider,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Karantenelinja: Cuba-krisen 1962 som et geografisk sjakkspill.
//
// Lyspære: hele krisen handlet om geografi. Sovjetiske raketter på Cuba lå bare
// 150 km fra USA og kunne nå nesten alle store amerikanske byer på minutter.
// Kennedys svar var også et romlig grep: en ring av krigsskip (karantenen) rundt
// Cuba for å stanse flere sovjetiske skip, uten å starte en atomkrig.
//
// Eleven kjenner dette på kroppen i tre steg:
//  1) Oppdag: klikk de skjulte rakettrampene som U-2 flyet fant på Cuba.
//  2) Trusselen: dra en spak og se rekkevidden vokse nordover til byene lyser rødt.
//  3) Karantenen: dra krigsskip på plass i karantenelinja, og sovjetskipene snur.
//
// Scenen drives av enkel React-tilstand og hvert delobjekt demper mykt mot mål.

// Kartet sett skrått ovenfra. Nord (USA) = negativ Z. Sør (mot kamera) = positiv Z.
const CUBA_X = 0.2;
const CUBA_Z = 2.5;
const MISSILE_X = [-2.2, 0.4, 2.8];
const MAX_RADIUS = 14; // verdensenheter når spaken står på topp

const SLOT_X = 5; // karantenelinja går nord-sør øst for Cuba
const LANES_Z = [0.4, 3, 5.6];
const STAGE = [
    [-3.4, 0, 9],
    [0, 0, 9.2],
    [3.4, 0, 9],
] as const;

type City = { id: string; name: string; x: number; z: number };
const CITIES: City[] = [
    { id: 'miami', name: 'Miami', x: -2, z: -6.2 },
    { id: 'washington', name: 'Washington', x: 2, z: -7.8 },
    { id: 'newyork', name: 'New York', x: 4.2, z: -8.8 },
    { id: 'chicago', name: 'Chicago', x: -1.4, z: -9.3 },
    { id: 'la', name: 'Los Angeles', x: -7.6, z: -8.4 },
];

type Phase = 'discover' | 'range' | 'blockade' | 'done';

function dist(x: number, z: number): number {
    return Math.hypot(x - CUBA_X, z - CUBA_Z);
}

// --- USA-landmassen i nord, med Florida som peker ned mot Cuba ---
function Landmass() {
    return (
        <group>
            <mesh position={[-1.5, 0.18, -9]} receiveShadow castShadow>
                <boxGeometry args={[22, 0.5, 7]} />
                <meshStandardMaterial color="#86a85e" roughness={1} />
            </mesh>
            {/* Florida-halvøya som strekker seg ned mot Cuba */}
            <mesh position={[-2.6, 0.2, -4.4]} receiveShadow castShadow>
                <boxGeometry args={[1.5, 0.5, 4]} />
                <meshStandardMaterial color="#7fa357" roughness={1} />
            </mesh>
        </group>
    );
}

// --- En by på fastlandet: lyser rødt når den kommer i rakettenes rekkevidde ---
function CityMarker({ city, inRange }: { city: City; inRange: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const dot = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        if (mat.current) {
            const target = inRange ? 1.1 : 0;
            mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, target, dt, 4);
        }
        if (dot.current) {
            const s = inRange ? 1 + Math.sin(performance.now() * 0.006) * 0.18 : 0.6;
            dot.current.scale.setScalar(damp(dot.current.scale.x, s, dt, 5));
        }
    });
    return (
        <group position={[city.x, 0.45, city.z]}>
            <mesh castShadow>
                <boxGeometry args={[0.7, 0.7, 0.7]} />
                <meshStandardMaterial
                    ref={mat}
                    color={inRange ? '#d65a4a' : '#cfd6dd'}
                    emissive="#ff3b2f"
                    emissiveIntensity={0}
                    roughness={0.7}
                />
            </mesh>
            <mesh ref={dot} position={[0, 0.7, 0]}>
                <sphereGeometry args={[0.16, 10, 10]} />
                <meshStandardMaterial
                    color={inRange ? '#ff5a48' : '#9fb0bd'}
                    emissive={inRange ? '#ff2a1c' : '#000000'}
                    emissiveIntensity={inRange ? 1.4 : 0}
                />
            </mesh>
        </group>
    );
}

// --- Den røde rekkevidde-sirkelen som vokser ut fra Cuba ---
function RangeDisc({ range }: { range: number }) {
    const ref = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((_, dt) => {
        const targetR = Math.max(0.001, range * MAX_RADIUS);
        if (ref.current) {
            const s = damp(ref.current.scale.x, targetR, dt, 3);
            ref.current.scale.set(s, s, s);
        }
        if (mat.current) {
            mat.current.opacity = damp(mat.current.opacity, range > 0.02 ? 0.22 : 0, dt, 4);
        }
    });
    return (
        <mesh
            ref={ref}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[CUBA_X, 0.07, CUBA_Z]}
            scale={[0.001, 0.001, 0.001]}
        >
            <circleGeometry args={[1, 48]} />
            <meshBasicMaterial
                ref={mat}
                color="#ff4632"
                transparent
                opacity={0}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// --- En rakettrampe på Cuba: skjult til den oppdages, reiser seg så ---
function MissileRamp({ x, revealed }: { x: number; revealed: boolean }) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!g.current) return;
        g.current.scale.y = damp(g.current.scale.y, revealed ? 1 : 0.001, dt, 3.4);
        g.current.rotation.z = damp(g.current.rotation.z, revealed ? -0.35 : 0, dt, 3);
    });
    return (
        <group position={[x, 0.4, CUBA_Z]}>
            {/* utskytningsbord */}
            <mesh position={[0, 0.08, 0]} castShadow>
                <boxGeometry args={[1.1, 0.16, 1.1]} />
                <meshStandardMaterial color="#5f6b52" roughness={0.9} />
            </mesh>
            {/* selve raketten på skrå */}
            <group ref={g} position={[0, 0.16, 0]} scale={[1, 0.001, 1]}>
                <mesh position={[0, 0.9, 0]} castShadow>
                    <cylinderGeometry args={[0.16, 0.2, 1.8, 12]} />
                    <meshStandardMaterial color="#dfe3e8" roughness={0.5} metalness={0.2} />
                </mesh>
                <mesh position={[0, 1.85, 0]} castShadow>
                    <coneGeometry args={[0.16, 0.5, 12]} />
                    <meshStandardMaterial color="#c0392b" roughness={0.5} />
                </mesh>
            </group>
        </group>
    );
}

// --- Amerikansk krigsskip (grå destroyer) ---
function Warship({ sealed }: { sealed?: boolean }) {
    return (
        <group rotation={[0, Math.PI / 2, 0]}>
            <mesh position={[0, 0.28, 0]} castShadow>
                <boxGeometry args={[2.4, 0.42, 0.7]} />
                <meshStandardMaterial color="#8a949d" roughness={0.6} metalness={0.3} />
            </mesh>
            <mesh position={[1.25, 0.34, 0]} castShadow>
                <coneGeometry args={[0.36, 0.7, 4]} />
                <meshStandardMaterial color="#7c868f" roughness={0.6} />
            </mesh>
            <mesh position={[-0.1, 0.62, 0]} castShadow>
                <boxGeometry args={[0.7, 0.5, 0.5]} />
                <meshStandardMaterial color="#9aa4ad" roughness={0.5} />
            </mesh>
            <mesh position={[-0.1, 1.05, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
                <meshStandardMaterial color="#6b757e" />
            </mesh>
            {/* rødt-hvitt vimpel når skipet står i linja */}
            <mesh position={[-0.1, 1.45, 0]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshStandardMaterial
                    color="#f4f7fa"
                    emissive={sealed ? '#5db36a' : '#3f7fb0'}
                    emissiveIntensity={sealed ? 1.2 : 0.4}
                />
            </mesh>
        </group>
    );
}

// --- Sovjetisk fraktskip: nærmer seg fra øst, snur når linja stenges ---
function Freighter({ z, blocked }: { z: number; blocked: boolean }) {
    const g = useRef<THREE.Group>(null);
    const dir = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!g.current) return;
        // står øst for linja og driver inn; snur ut igjen når lane er stengt
        const targetX = blocked ? 13.5 : 7.4;
        g.current.position.x = damp(g.current.position.x, targetX, dt, blocked ? 1.6 : 0.7);
        // vugger lett
        g.current.rotation.z = Math.sin(performance.now() * 0.002 + z) * 0.04;
        if (dir.current) {
            dir.current.rotation.y = damp(dir.current.rotation.y, blocked ? Math.PI : 0, dt, 3);
        }
    });
    return (
        <group ref={g} position={[11, 0, z]}>
            <group ref={dir}>
                <mesh position={[0, 0.25, 0]} castShadow>
                    <boxGeometry args={[2.6, 0.5, 0.9]} />
                    <meshStandardMaterial color="#7a4a3a" roughness={0.85} />
                </mesh>
                {/* last (raketter under presenning) */}
                <mesh position={[0.2, 0.66, 0]} castShadow>
                    <boxGeometry args={[1.4, 0.5, 0.7]} />
                    <meshStandardMaterial color="#6b6f55" roughness={0.95} />
                </mesh>
                <mesh position={[-0.9, 0.7, 0]} castShadow>
                    <boxGeometry args={[0.6, 0.6, 0.7]} />
                    <meshStandardMaterial color="#9aa4ad" roughness={0.6} />
                </mesh>
                {/* rød stjerne på skroget */}
                <mesh position={[0.2, 0.4, 0.46]}>
                    <circleGeometry args={[0.22, 5]} />
                    <meshStandardMaterial color="#c0392b" emissive="#8a1f15" emissiveIntensity={0.4} />
                </mesh>
            </group>
        </group>
    );
}

interface SceneProps {
    phase: Phase;
    found: boolean[];
    range: number;
    sealed: boolean[];
    onFind: (i: number) => void;
    onSeal: (i: number) => void;
}

function CubaScene({ phase, found, range, sealed, onFind, onSeal }: SceneProps) {
    const radius = range * MAX_RADIUS;
    const planeX = useRef<THREE.Group>(null);
    // U-2 spionflyet glir over Cuba i oppdagelsesfasen
    useFrame((_, dt) => {
        if (!planeX.current) return;
        if (phase === 'discover') {
            planeX.current.position.x += dt * 2.4;
            if (planeX.current.position.x > 9) planeX.current.position.x = -9;
            planeX.current.visible = true;
        } else {
            planeX.current.visible = false;
        }
    });

    return (
        <group>
            <WaterPlane position={[0, 0, -1]} size={[34, 28]} color="#2f6f94" />
            <Landmass />

            {/* Cuba: en lang, smal øy */}
            <mesh position={[CUBA_X, 0.18, CUBA_Z]} receiveShadow castShadow>
                <boxGeometry args={[7.2, 0.5, 1.7]} />
                <meshStandardMaterial color="#6f9e4e" roughness={1} />
            </mesh>

            {/* byer på fastlandet */}
            {CITIES.map((c) => (
                <CityMarker key={c.id} city={c} inRange={radius >= dist(c.x, c.z)} />
            ))}

            {/* rekkevidde-sirkel */}
            <RangeDisc range={range} />

            {/* rakettramper på Cuba */}
            {MISSILE_X.map((x, i) => (
                <MissileRamp key={x} x={x} revealed={found[i]} />
            ))}

            {/* oppdagelses-hotspots over Cuba */}
            {phase === 'discover' &&
                MISSILE_X.map((x, i) =>
                    found[i] ? null : (
                        <Hotspot
                            key={x}
                            position={[x, 1.2, CUBA_Z]}
                            onSelect={() => onFind(i)}
                            label="Forstørr bildet"
                            radius={0.6}
                        />
                    )
                )}

            {/* U-2 spionfly */}
            <group ref={planeX} position={[-9, 4.2, CUBA_Z]}>
                <mesh rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.7, 0.12, 0.16]} />
                    <meshStandardMaterial color="#3a3f44" />
                </mesh>
                <mesh>
                    <boxGeometry args={[0.16, 0.06, 1.4]} />
                    <meshStandardMaterial color="#3a3f44" />
                </mesh>
            </group>

            {/* karantenelinja: markør-ringer + skip */}
            {(phase === 'blockade' || phase === 'done') && (
                <group>
                    {LANES_Z.map((z, i) => (
                        <mesh
                            key={z}
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[SLOT_X, 0.06, z]}
                        >
                            <ringGeometry args={[1.1, 1.35, 32]} />
                            <meshBasicMaterial
                                color={sealed[i] ? '#5db36a' : '#e2b007'}
                                transparent
                                opacity={0.7}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    ))}

                    {/* sovjetiske fraktskip i hver lane */}
                    {LANES_Z.map((z, i) => (
                        <Freighter key={z} z={z} blocked={sealed[i]} />
                    ))}

                    {/* amerikanske krigsskip: dra på plass (eller låst når stengt) */}
                    {LANES_Z.map((z, i) =>
                        sealed[i] ? (
                            <group key={z} position={[SLOT_X, 0, z]}>
                                <Warship sealed />
                            </group>
                        ) : (
                            <Draggable
                                key={z}
                                position={[STAGE[i][0], STAGE[i][1], STAGE[i][2]]}
                                planeY={0}
                                bounds={{ minX: -8, maxX: 8, minZ: -2, maxZ: 10 }}
                                snapPoints={[[SLOT_X, z]]}
                                snapRadius={2.2}
                                onSnap={() => onSeal(i)}
                                dropFx="splash"
                            >
                                <mesh>
                                    <boxGeometry args={[2.8, 1.4, 2.4]} />
                                    <meshBasicMaterial transparent opacity={0} />
                                </mesh>
                                <Warship />
                            </Draggable>
                        )
                    )}

                    <Burst position={[SLOT_X, 1.4, LANES_Z[1]]} trigger={sealed.filter(Boolean).length} />
                </group>
            )}
        </group>
    );
}

export default function Karantenelinja3D({ onComplete }: MicroGameProps) {
    const [phase, setPhase] = useState<Phase>('discover');
    const [found, setFound] = useState<boolean[]>([false, false, false]);
    const [range, setRange] = useState(0);
    const [sealed, setSealed] = useState<boolean[]>([false, false, false]);
    const [banner, setBanner] = useState<string | null>(
        '14. oktober 1962: U-2 flyet tok bilder av Cuba. Klikk og forstørr de mistenkelige stedene.'
    );
    const sound = useStepSounds();

    const reset = () => {
        setPhase('discover');
        setFound([false, false, false]);
        setRange(0);
        setSealed([false, false, false]);
        setBanner(
            '14. oktober 1962: U-2 flyet tok bilder av Cuba. Klikk og forstørr de mistenkelige stedene.'
        );
    };

    const handleFind = (i: number) => {
        setFound((prev) => {
            if (prev[i]) return prev;
            const next = [...prev];
            next[i] = true;
            sound.play('correct');
            if (next.every(Boolean)) {
                setBanner('Det er sovjetiske atomraketter! Hvor langt rekker de? Dra spaken.');
                setTimeout(() => setPhase('range'), 800);
            }
            return next;
        });
    };

    const handleRange = (v: number) => {
        setRange(v / 100);
        if (v % 20 === 0) sound.play('select');
        if (v >= 100 && phase === 'range') {
            sound.play('advance');
            setBanner('Rakettene når nesten hele USA på minutter. Kennedy svarer med karantene.');
            setTimeout(() => setPhase('blockade'), 1100);
        }
    };

    const handleSeal = (i: number) => {
        setSealed((prev) => {
            if (prev[i]) return prev;
            const next = [...prev];
            next[i] = true;
            sound.play('drop');
            if (next.every(Boolean)) {
                setBanner('Alle sovjetiske skip snur ved karantenelinja. Krisen løses.');
                setPhase('done');
                sound.play('complete');
                onComplete({ score: 1, completed: true });
            } else {
                setBanner('Et skip snur! Steng resten av karantenelinja.');
            }
            return next;
        });
    };

    const inRangeCount = CITIES.filter((c) => range * MAX_RADIUS >= dist(c.x, c.z)).length;
    const stepNum = phase === 'discover' ? 1 : phase === 'range' ? 2 : 3;
    const era =
        phase === 'discover'
            ? '14. oktober 1962'
            : phase === 'range'
              ? 'Trusselen'
              : '22.-28. oktober 1962';

    return (
        <MicroGameScaffold
            title="Karantenelinja: Cuba-krisen 1962"
            subtitle="Oppdag rakettene, se rekkevidden, og steng karantenelinja"
            estimatedSeconds={150}
            onRetry={reset}
            scene={
                <CubaScene
                    phase={phase}
                    found={found}
                    range={range}
                    sealed={sealed}
                    onFind={handleFind}
                    onSeal={handleSeal}
                />
            }
            canvas={{
                idle: phase === 'discover',
                camera: { position: [8, 10, 14], fov: 42 },
                background: '#bfe0f2',
                fog: { near: 34, far: 64 },
                target: [0, 0, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{era}</SceneBadge>
                    {phase === 'range' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Rekkevidde', value: Math.round(range * 100 * 22), unit: 'km' },
                                { label: 'Byer i fare', value: `${inRangeCount} av ${CITIES.length}` },
                            ]}
                        />
                    )}
                    {phase === 'discover' && (
                        <DragHint show={!found.every(Boolean)} corner="bc">
                            Klikk de gule punktene på Cuba
                        </DragHint>
                    )}
                    {phase === 'blockade' && (
                        <DragHint show={!sealed.every(Boolean)} corner="bc">
                            Dra krigsskipene til de gule ringene
                        </DragHint>
                    )}
                </>
            }
        >
            <div className="flex items-center justify-between mb-2.5">
                <StepTracker current={stepNum} total={3} />
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                    {phase === 'discover' && (
                        <>
                            <Radar className="w-3.5 h-3.5" /> Oppdag rakettene
                        </>
                    )}
                    {phase === 'range' && (
                        <>
                            <Crosshair className="w-3.5 h-3.5" /> Mål rekkevidden
                        </>
                    )}
                    {(phase === 'blockade' || phase === 'done') && (
                        <>
                            <Anchor className="w-3.5 h-3.5" /> Steng karantenen
                        </>
                    )}
                </span>
            </div>

            {phase === 'discover' && (
                <SceneFact>
                    Spionflyet U-2 fløy høyt over Cuba og tok tusenvis av bilder. Da analytikerne
                    forstørret dem, så de noe skremmende: sovjetiske utskytningsramper under bygging.
                    Klikk de tre mistenkelige stedene på øya.
                </SceneFact>
            )}

            {phase === 'range' && (
                <div className="space-y-2.5">
                    <SceneSlider
                        label="Rakettenes rekkevidde fra Cuba"
                        min={0}
                        max={100}
                        value={Math.round(range * 100)}
                        onChange={handleRange}
                        valueLabel={(v) => `${Math.round((v / 100) * 22) * 100} km`}
                    />
                    <SceneFact>
                        Cuba ligger bare 15 mil fra Florida. Dra spaken og se: jo lengre rekkevidde,
                        desto flere amerikanske byer lyser rødt. Fra Cuba kunne rakettene treffe
                        nesten hele USA på under ti minutter. Det var derfor geografien var alt.
                    </SceneFact>
                </div>
            )}

            {phase === 'blockade' && (
                <SceneFact>
                    Kennedy valgte ikke krig, men en karantene: en ring av krigsskip rundt Cuba som
                    stanset alle sovjetiske skip med flere våpen. Dra de tre krigsskipene ut i de
                    gule ringene og steng linja. Da må fraktskipene snu.
                </SceneFact>
            )}

            {phase === 'done' && (
                <WinScreen title="28. oktober 1962: krisen er over" onReplay={reset}>
                    Du løste den verste atomtrusselen i historien med geografi, ikke våpen.
                    Sovjet trakk rakettene tilbake mot at USA lovet å ikke invadere Cuba og i det
                    skjulte fjernet sine raketter i Tyrkia. Etterpå kom den røde telefonlinja mellom
                    Washington og Moskva, slik at supermaktene kunne snakke sammen raskt neste gang.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
}
