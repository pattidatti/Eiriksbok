import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    FlatRing,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    StepTracker,
    CompareToggle,
    Burst,
    Impact,
    useShake,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til «Hvem eier vikingene?».
// Eleven er konservator og setter sammen Gjermundbuhjelmen - den eneste bevarte
// vikinghjelmen i Norge - av de delene som faktisk ble funnet i 1943. På bordet
// ligger også et par horn. Prøver eleven å sette dem på, spretter de av: det
// finnes ikke noe funn og ikke noe feste for dem. Til slutt reiser en ekstra
// sokkel seg med operahjelmen fra 1876, og eleven ser de to side om side.
// Lyspære: hornhjelmen kom fra en teaterscene, ikke fra vikingtiden.

type Phase = 'bygg' | 'sammenlign' | 'won';

interface Part {
    id: string;
    name: string;
    hint: string;
    color: string;
}

// De fire delene svarer til hovedtrekkene ved den ekte hjelmen: en rund kalott
// av jernplater, kryssende jernbånd, den karakteristiske brillebeskyttelsen og
// en liten pigg på toppen.
const PARTS: Part[] = [
    { id: 'kalott', name: 'Kalotten', hint: 'Fire buede jernplater', color: '#b3bcc7' },
    { id: 'band', name: 'Jernbåndene', hint: 'Holder platene sammen', color: '#98a2ad' },
    { id: 'briller', name: 'Brillebeskyttelsen', hint: 'Verner øyne og nese', color: '#bcc5cf' },
    { id: 'pigg', name: 'Piggen', hint: 'Sitter i toppen', color: '#a5aeb9' },
];

// Jern i en lys scene: lav metalness, ellers blir metallet kullsvart uten
// environment map.
const IRON = { roughness: 0.5, metalness: 0.22 };

// Arbeidshøyden: bordplata og sokkeltoppene ligger alle på y = 1.2, så alt står
// på et underlag og draget skjer i ett plan.
const WORK_Y = 1.2;
const STAND_X = -2.4;
const STAND_Z = -0.6;
const TABLE_Z = 4.2;
const PART_X = [-3, -1.5, 0, 1.5];
const HORN_X = 3.2;
// Hjelmen skaleres opp så den er stor nok til å lese på en Chromebook.
const STAND_SCALE = 1.45;

const Vikinghjelmen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [placed, setPlaced] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>('bygg');
    const [hornTries, setHornTries] = useState(0);
    const [seen, setSeen] = useState<string[]>(['funn']);
    const [side, setSide] = useState<'a' | 'b'>('a');
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra de fire delene fra bordet opp på hjelmestativet.'
    );

    const reset = () => {
        setPlaced([]);
        setPhase('bygg');
        setHornTries(0);
        setSeen(['funn']);
        setSide('a');
        setBanner('Dra de fire delene fra bordet opp på hjelmestativet.');
    };

    const placePart = (id: string) => {
        if (phase !== 'bygg' || placed.includes(id)) return;
        const next = [...placed, id];
        setPlaced(next);
        if (next.length === PARTS.length) {
            sounds.play('complete');
            setBurst((b) => b + 1);
            setPhase('sammenlign');
            setBanner('Hjelmen er hel - og helt glatt. Så hvor kom hornene fra?');
        } else {
            sounds.play('correct');
            setBanner(`${PARTS.find((p) => p.id === id)?.name} er på plass.`);
        }
    };

    const rejectHorns = () => {
        setHornTries((n) => n + 1);
        sounds.play('incorrect');
        setBanner('Hornene faller av. Ingen vikinghjelm er funnet med feste til horn.');
    };

    const flipSide = (v: 'a' | 'b') => {
        setSide(v);
        sounds.play('sceneChange');
        const key = v === 'a' ? 'funn' : 'opera';
        setSeen((prev) => (prev.includes(key) ? prev : [...prev, key]));
    };

    const finish = () => {
        sounds.play('complete');
        setBurst((b) => b + 1);
        setBanner(null);
        setPhase('won');
        onComplete({ score: 1, completed: true, artifact: { hornTries } });
    };

    const bothSeen = seen.includes('funn') && seen.includes('opera');

    return (
        <MicroGameScaffold
            title="Sett sammen vikinghjelmen"
            subtitle="Bygg den eneste bevarte vikinghjelmen i Norge - og se hvor hornene egentlig kom fra"
            estimatedSeconds={150}
            onRetry={placed.length > 0 || phase !== 'bygg' ? reset : undefined}
            canvas={{
                idle: placed.length === 0 && phase === 'bygg',
                camera: { position: [0, 5, 13], fov: 44 },
                background: '#e6e9ee',
                light: 'noon',
                target: phase === 'bygg' ? [0, 1.5, 1.5] : [0, 2.3, 0.6],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'bygg' ? 'Gjermundbu, funnet 1943' : 'Funn mot scene'}
                    </SceneBadge>
                    <DragHint show={placed.length === 0 && phase === 'bygg'} corner="bc">
                        Dra en del bort på stativet
                    </DragHint>
                </>
            }
            scene={
                <HjelmScene
                    placed={placed}
                    phase={phase}
                    hornTries={hornTries}
                    side={side}
                    burst={burst}
                    onPlace={placePart}
                    onRejectHorns={rejectHorns}
                />
            }
        >
            {phase === 'bygg' && (
                <div className="flex flex-col gap-3">
                    <StepTracker current={placed.length} total={PARTS.length} />
                    <SceneFact>
                        Hjelmen fra Gjermundbu på Ringerike ble funnet i 1943 og er den eneste
                        bevarte vikinghjelmen i Norge. Delene på bordet er de som faktisk lå i
                        grava.
                    </SceneFact>
                </div>
            )}

            {phase === 'sammenlign' && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <CompareToggle
                            labelA="Funnet 1943"
                            labelB="Operascenen 1876"
                            value={side}
                            onChange={flipSide}
                        />
                        {bothSeen && (
                            <button
                                onClick={finish}
                                className="px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition"
                            >
                                Jeg ser forskjellen
                            </button>
                        )}
                    </div>
                    <SceneFact>
                        {side === 'a'
                            ? 'Til venstre står hjelmen slik den ble funnet: rund, glatt og uten horn. Ingen hjelm med horn er funnet fra vikingtiden.'
                            : 'Til høyre står kostymehjelmen. Carl Emil Doepler satte horn på hjelmene i Wagners opera «Nibelungens ring» på 1870-tallet. Derfra spredte bildet seg til bøker og tegneserier.'}
                    </SceneFact>
                </div>
            )}

            {phase === 'won' && (
                <WinScreen title="Hjelmen er ekte - hornene er ikke det!" onReplay={reset}>
                    Du satte sammen hjelmen av de delene som faktisk lå i grava på Gjermundbu, og
                    hornene fant aldri et sted å sitte. Hornhjelmen er under hundre og femti år
                    gammel og kom fra en teaterscene. Neste gang du ser et vikingsymbol, er det
                    verdt å spørre: er dette fra vikingtiden, eller er det noe noen har funnet på
                    senere?
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN: et konserveringsrom med arbeidsbord og sokkel
// ============================================================

function HjelmScene({
    placed,
    phase,
    hornTries,
    side,
    burst,
    onPlace,
    onRejectHorns,
}: {
    placed: string[];
    phase: Phase;
    hornTries: number;
    side: 'a' | 'b';
    burst: number;
    onPlace: (id: string) => void;
    onRejectHorns: () => void;
}) {
    const { ref: shakeRef, shake } = useShake(0.14, 0.03, 2.4);
    // Rist scenen når hornene blir avvist - synlig konsekvens av et feil grep.
    useEffect(() => {
        if (hornTries > 0) shake(0.8);
    }, [hornTries, shake]);

    return (
        <group ref={shakeRef}>
            {/* Museumsgulv - bredere enn 26 enheter, holdes utenfor innrammings-revisjonen */}
            <mesh
                position={[0, -0.02, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
                userData={{ sceneAuditIgnore: true }}
            >
                <planeGeometry args={[30, 26]} />
                <meshStandardMaterial color="#d9d5cc" roughness={1} />
            </mesh>

            {/* Arbeidsbordet foran */}
            <Bord />

            {/* Sokkelen med hjelmestativet */}
            <Sokkel x={STAND_X} z={STAND_Z} lit={phase !== 'sammenlign' || side === 'a'} />
            <group position={[STAND_X, 0, STAND_Z]}>
                <Dreieskive position={[0, WORK_Y, 0]} scale={STAND_SCALE}>
                    <Hodeform />
                    <Hjelm placed={placed} horns={false} />
                </Dreieskive>
                {phase === 'bygg' && placed.length < PARTS.length && (
                    <FlatRing
                        position={[0, WORK_Y + 0.02, 0]}
                        radius={1.05}
                        tube={0.07}
                        color="#d99a2b"
                    />
                )}
            </group>

            {/* Sokkelen for operahjelmen - reiser seg først i sammenlign-fasen */}
            {phase !== 'bygg' && (
                <group>
                    <Sokkel x={-STAND_X} z={STAND_Z} lit={side === 'b'} />
                    <Dreieskive
                        position={[-STAND_X, WORK_Y, STAND_Z]}
                        scale={STAND_SCALE}
                    >
                        <Hodeform />
                        <Hjelm placed={PARTS.map((p) => p.id)} horns />
                    </Dreieskive>
                </group>
            )}

            {/* Delene som ennå ligger på bordet */}
            {phase === 'bygg' &&
                PARTS.map((part, i) =>
                    placed.includes(part.id) ? null : (
                        <Draggable
                            key={part.id}
                            position={[PART_X[i], WORK_Y, TABLE_Z]}
                            planeY={WORK_Y}
                            bounds={{ minX: -4.2, maxX: 4.2, minZ: -2.2, maxZ: 5.4 }}
                            snapPoints={[[STAND_X, STAND_Z]]}
                            snapRadius={2}
                            onSnap={() => onPlace(part.id)}
                            liftY={0.3}
                        >
                            {/* Romslig usynlig gripeflate - trygg på trackpad */}
                            <mesh>
                                <boxGeometry args={[1.5, 1.2, 1.5]} />
                                <meshBasicMaterial transparent opacity={0} />
                            </mesh>
                            <PartMesh part={part} />
                        </Draggable>
                    )
                )}

            {/* Hornene - de hører ikke hjemme, og spretter tilbake hver gang */}
            {phase === 'bygg' && (
                <Draggable
                    key={`horn-${hornTries}`}
                    position={[HORN_X, WORK_Y, TABLE_Z]}
                    planeY={WORK_Y}
                    bounds={{ minX: -4.2, maxX: 4.2, minZ: -2.2, maxZ: 5.4 }}
                    snapPoints={[[STAND_X, STAND_Z]]}
                    snapRadius={2}
                    onSnap={onRejectHorns}
                    liftY={0.3}
                >
                    <mesh>
                        <boxGeometry args={[1.6, 1.2, 1.4]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <HornPar />
                </Draggable>
            )}

            <Impact
                preset="dustPuff"
                trigger={hornTries}
                position={[STAND_X, WORK_Y + 1.4, STAND_Z]}
            />
            <Burst position={[STAND_X, 3.4, STAND_Z]} trigger={burst} color="#ffe2a1" count={34} />
        </group>
    );
}

// Museets dreieskive: hjelmen snurrer langsomt av seg selv, slik den ville gjort
// i en monter. Det gir scenen liv uavhengig av eleven, og eleven ser hele
// hjelmen rundt - også at det ikke finnes feste for horn noe sted.
function Dreieskive({
    position,
    scale,
    children,
}: {
    position: [number, number, number];
    scale: number;
    children: React.ReactNode;
}) {
    const grp = useRef<THREE.Group>(null);
    const reduce = useReducedMotion();
    useFrame((_, dt) => {
        if (grp.current && !reduce) grp.current.rotation.y += dt * 0.28;
    });
    return (
        <group ref={grp} position={position} scale={scale}>
            {children}
        </group>
    );
}

// Arbeidsbord: plata topper på WORK_Y, beina står på gulvet.
function Bord() {
    const legX = [-3.9, 3.9];
    const legZ = [TABLE_Z - 1, TABLE_Z + 1];
    return (
        <group>
            <mesh position={[0, WORK_Y - 0.09, TABLE_Z]} castShadow receiveShadow>
                <boxGeometry args={[9, 0.18, 2.8]} />
                <meshStandardMaterial color="#c2a681" roughness={0.85} />
            </mesh>
            {legX.map((x) =>
                legZ.map((z) => (
                    <mesh key={`${x}:${z}`} position={[x, 0.555, z]} castShadow>
                        <cylinderGeometry args={[0.09, 0.09, 1.11, 8]} />
                        <meshStandardMaterial color="#9a8161" roughness={0.9} />
                    </mesh>
                ))
            )}
        </group>
    );
}

// Utstillingssokkel: en blokk fra gulvet opp til arbeidshøyden.
function Sokkel({ x, z, lit }: { x: number; z: number; lit: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!mat.current) return;
        mat.current.emissiveIntensity = damp(
            mat.current.emissiveIntensity,
            lit ? 0.32 : 0.02,
            dt,
            4
        );
    });
    return (
        <mesh position={[x, WORK_Y / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[2.4, WORK_Y, 2.2]} />
            <meshStandardMaterial
                ref={mat}
                color="#efe9dd"
                roughness={0.95}
                emissive="#e0b972"
                emissiveIntensity={0.02}
            />
        </mesh>
    );
}

// Hodeform i tre: en stolpe med en avrundet topp som hjelmen hviler på.
function Hodeform() {
    return (
        <group>
            <mesh position={[0, 0.28, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.36, 0.56, 12]} />
                <meshStandardMaterial color="#b08d63" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.78, 0]} castShadow>
                <sphereGeometry args={[0.44, 18, 14]} />
                <meshStandardMaterial color="#c19a6d" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Selve hjelmen. Hver del vokser mykt inn når den er plassert.
function Hjelm({ placed, horns }: { placed: string[]; horns: boolean }) {
    const has = (id: string) => placed.includes(id);
    return (
        <group position={[0, 0.78, 0]}>
            <Del show={has('kalott')}>
                <mesh position={[0, 0.09, 0]} castShadow>
                    <sphereGeometry args={[0.5, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#8f9aa6" roughness={IRON.roughness} metalness={IRON.metalness} />
                </mesh>
            </Del>

            <Del show={has('band')}>
                <group position={[0, 0.09, 0]}>
                    <mesh position={[0, 0.28, 0]} rotation={[0, 0, 0]} castShadow>
                        <boxGeometry args={[0.12, 0.06, 1.02]} />
                        <meshStandardMaterial color="#5f6a76" roughness={IRON.roughness} metalness={IRON.metalness} />
                    </mesh>
                    <mesh position={[0, 0.28, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
                        <boxGeometry args={[0.12, 0.06, 1.02]} />
                        <meshStandardMaterial color="#5f6a76" roughness={IRON.roughness} metalness={IRON.metalness} />
                    </mesh>
                    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
                        <torusGeometry args={[0.5, 0.05, 8, 26]} />
                        <meshStandardMaterial color="#5f6a76" roughness={IRON.roughness} metalness={IRON.metalness} />
                    </mesh>
                </group>
            </Del>

            <Del show={has('briller')}>
                <group position={[0, 0.02, 0.4]}>
                    <mesh position={[0, -0.06, 0.05]} castShadow>
                        <boxGeometry args={[0.09, 0.34, 0.1]} />
                        <meshStandardMaterial color="#98a3af" roughness={IRON.roughness} metalness={IRON.metalness} />
                    </mesh>
                    {[-0.19, 0.19].map((x) => (
                        <mesh key={x} position={[x, 0.03, 0.02]} rotation={[0.2, 0, 0]} castShadow>
                            <boxGeometry args={[0.28, 0.16, 0.08]} />
                            <meshStandardMaterial
                                color="#98a3af"
                                roughness={IRON.roughness}
                                metalness={IRON.metalness}
                            />
                        </mesh>
                    ))}
                </group>
            </Del>

            <Del show={has('pigg')}>
                <mesh position={[0, 0.66, 0]} castShadow>
                    <coneGeometry args={[0.09, 0.26, 10]} />
                    <meshStandardMaterial color="#7b8692" roughness={IRON.roughness} metalness={IRON.metalness} />
                </mesh>
            </Del>

            {/* Kostymehornene - kun på operahjelmen */}
            {horns &&
                [-1, 1].map((s) => (
                    <mesh
                        key={s}
                        position={[s * 0.42, 0.3, 0]}
                        rotation={[0, 0, s * -0.85]}
                        castShadow
                    >
                        <coneGeometry args={[0.12, 0.78, 10]} />
                        <meshStandardMaterial color="#e8dcc0" roughness={0.7} />
                    </mesh>
                ))}
        </group>
    );
}

// Wrapper som lar en hjelmdel poppe mykt inn når den plasseres.
function Del({ show, children }: { show: boolean; children: React.ReactNode }) {
    const grp = useRef<THREE.Group>(null);
    const s = useRef(show ? 1 : 0);
    useFrame((_, dt) => {
        if (!grp.current) return;
        s.current = damp(s.current, show ? 1 : 0, dt, 7);
        grp.current.scale.setScalar(Math.max(0.001, s.current));
    });
    return (
        <group ref={grp} visible={show} scale={show ? 1 : 0.001}>
            {children}
        </group>
    );
}

// En løs hjelmdel slik den ligger på bordet: en liten jernbit på et treunderlag.
function PartMesh({ part }: { part: Part }) {
    return (
        <group>
            <mesh position={[0, 0.06, 0]} castShadow>
                <boxGeometry args={[1.02, 0.12, 1.02]} />
                <meshStandardMaterial color="#efe6d2" roughness={0.95} />
            </mesh>
            {/* Farget kantlist så hver del er lett å skille fra de andre */}
            <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.56, 0.035, 6, 4]} />
                <meshStandardMaterial color="#c9b489" roughness={0.9} />
            </mesh>
            {part.id === 'kalott' && (
                <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0.35]} castShadow>
                    <sphereGeometry
                        args={[0.46, 18, 12, 0, Math.PI / 2, 0, Math.PI / 2]}
                    />
                    <meshStandardMaterial color={part.color} roughness={IRON.roughness} metalness={IRON.metalness} />
                </mesh>
            )}
            {part.id === 'band' && (
                <group position={[0, 0.16, 0]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.88, 0.09, 0.14]} />
                        <meshStandardMaterial
                            color={part.color}
                            roughness={IRON.roughness}
                            metalness={IRON.metalness}
                        />
                    </mesh>
                    <mesh position={[0, 0.08, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
                        <boxGeometry args={[0.88, 0.09, 0.14]} />
                        <meshStandardMaterial
                            color={part.color}
                            roughness={IRON.roughness}
                            metalness={IRON.metalness}
                        />
                    </mesh>
                </group>
            )}
            {part.id === 'briller' && (
                <group position={[0, 0.16, 0]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.11, 0.11, 0.48]} />
                        <meshStandardMaterial
                            color={part.color}
                            roughness={IRON.roughness}
                            metalness={IRON.metalness}
                        />
                    </mesh>
                    {[-0.27, 0.27].map((x) => (
                        <mesh key={x} position={[x, 0.02, 0.08]} castShadow>
                            <boxGeometry args={[0.4, 0.19, 0.11]} />
                            <meshStandardMaterial
                                color={part.color}
                                roughness={IRON.roughness}
                                metalness={IRON.metalness}
                            />
                        </mesh>
                    ))}
                </group>
            )}
            {part.id === 'pigg' && (
                <mesh position={[0, 0.32, 0]} castShadow>
                    <coneGeometry args={[0.14, 0.4, 12]} />
                    <meshStandardMaterial color={part.color} roughness={IRON.roughness} metalness={IRON.metalness} />
                </mesh>
            )}
        </group>
    );
}

// Kostymehornene slik de ligger på bordet, på et eget lyst underlag.
function HornPar() {
    return (
        <group>
            <mesh position={[0, 0.06, 0]} castShadow>
                <boxGeometry args={[1.24, 0.12, 1.02]} />
                <meshStandardMaterial color="#f6d9d9" roughness={0.95} />
            </mesh>
            <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.62, 0.035, 6, 4]} />
                <meshStandardMaterial color="#d99a9a" roughness={0.9} />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh
                    key={s}
                    position={[s * 0.26, 0.4, 0]}
                    rotation={[0, 0, s * -0.5]}
                    castShadow
                >
                    <coneGeometry args={[0.13, 0.66, 12]} />
                    <meshStandardMaterial color="#c9a86a" roughness={0.65} />
                </mesh>
            ))}
        </group>
    );
}

export default Vikinghjelmen3D;
