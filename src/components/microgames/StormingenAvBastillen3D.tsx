import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Scissors, Crosshair, Flag } from 'lucide-react';
import {
    MicroGameScaffold,
    Interactive,
    Hotspot,
    Draggable,
    Tower,
    Person,
    WaterPlane,
    Burst,
    Smoke,
    damp,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    DataReadout,
    WinScreen,
    StepTracker,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Stormingen av Bastillen, 14. juli 1789.
//
// Lyspære: vanlige parisere, ikke kongen, tok en kongelig festning med makt.
// De kom egentlig for kruttet, ikke for fangene. Da symbolet på enevoldsmakten
// falt, forsto folket at makten lå hos dem. Eleven kjenner dette på kroppen ved å
// (1) kappe kjettingene så vindebrua dundrer ned og folket strømmer inn, (2) rulle
// de fem kanonene fra avhopperne i stilling foran porten, og (3) kreve overgivelse
// så det hvite flagget går opp, de få fangene går fri og trikoloren heises.
//
// Scenen drives av enkel React-tilstand (chains, placed, surge, surrender) og hvert
// delobjekt demper mykt mot mål utledet av den.

const STONE = '#c3b291';
const ROOF = '#6b4a33';
const GATE_X = 0;
// Kanonenes parkeringsplasser (sidegatene) og målslukene i raden foran porten.
const PARK: [number, number][] = [
    [-8, 2.4],
    [-8, 4.2],
    [8, 2.4],
    [8, 4.2],
    [-8, 6],
];
const SLOTS: [number, number][] = [
    [-4, 3.6],
    [-2, 3.6],
    [0, 3.6],
    [2, 3.6],
    [4, 3.6],
];

type Phase = 'bridge' | 'cannons' | 'storm' | 'done';

// --- Festningen: en grå steinkjempe med åtte runde tårn og en port ---
function Fortress() {
    return (
        <group>
            {/* hovedmuren */}
            <mesh position={[0, 2.6, -1.4]} castShadow receiveShadow>
                <boxGeometry args={[10.5, 5.2, 3]} />
                <meshStandardMaterial color={STONE} roughness={0.97} />
            </mesh>
            {/* tinder langs toppen */}
            {[-4.6, -2.8, -1, 1, 2.8, 4.6].map((x) => (
                <mesh key={x} position={[x, 5.4, 0.05]} castShadow>
                    <boxGeometry args={[0.7, 0.5, 0.4]} />
                    <meshStandardMaterial color={STONE} roughness={0.97} />
                </mesh>
            ))}
            {/* åtte runde tårn: fire foran, fire bak */}
            {[-5.2, -1.9, 1.9, 5.2].map((x) => (
                <Tower key={`f${x}`} position={[x, 0, 0.3]} radius={0.9} height={6.4} color={STONE} roof={ROOF} />
            ))}
            {[-5.2, -1.9, 1.9, 5.2].map((x) => (
                <Tower key={`b${x}`} position={[x, 0, -3]} radius={0.9} height={6.4} color={STONE} roof={ROOF} />
            ))}
            {/* mørkt portrom bak vindebrua */}
            <mesh position={[GATE_X, 1.5, 0.2]}>
                <boxGeometry args={[2.2, 3, 0.5]} />
                <meshStandardMaterial color="#2b241c" roughness={1} />
            </mesh>
            {/* portbue */}
            <mesh position={[GATE_X, 3, 0.25]}>
                <cylinderGeometry args={[1.1, 1.1, 0.5, 16, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color="#2b241c" roughness={1} />
            </mesh>
        </group>
    );
}

// --- Vindebrua: hengslet ved portfoten, svinger fra loddrett (lukket) til flat (nede) ---
function Drawbridge({ down }: { down: boolean }) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!g.current) return;
        // 0 = flat (nede, over vollgrava), -1.5 = står loddrett foran porten
        const target = down ? 0 : -1.5;
        g.current.rotation.x = damp(g.current.rotation.x, target, dt, down ? 4.5 : 3);
    });
    return (
        <group ref={g} position={[GATE_X, 0.45, 0.55]} rotation={[-1.5, 0, 0]}>
            <mesh position={[0, 0, 1.35]} castShadow receiveShadow>
                <boxGeometry args={[2.4, 0.18, 2.7]} />
                <meshStandardMaterial color="#5a4029" roughness={0.9} />
            </mesh>
            {/* planker på tvers */}
            {[-0.7, 0, 0.7, 1.4, 2.1].map((z) => (
                <mesh key={z} position={[0, 0.11, z + 0.15]}>
                    <boxGeometry args={[2.3, 0.05, 0.16]} />
                    <meshStandardMaterial color="#6e4d2e" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

// --- Kjetting som holder brua oppe: klikkbar til den kappes ---
function Chain({ x, cut, onCut }: { x: number; cut: boolean; onCut: () => void }) {
    if (cut) return null;
    return (
        <group position={[x, 0, 0]}>
            <Interactive onSelect={onCut} hitArea={[1.2, 2.6, 1.2]} sound="drop">
                {(s) => (
                    <mesh position={[0, 2.3, 1]} rotation={[0.5, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.08, 0.08, 2.4, 8]} />
                        <meshStandardMaterial
                            color={s === 'hover' ? '#facc15' : '#3a3a3a'}
                            metalness={0.6}
                            roughness={0.5}
                        />
                    </mesh>
                )}
            </Interactive>
        </group>
    );
}

// --- En kanon: hjul, lavett og løp. Dras i stilling, eller står fast når plassert ---
function CannonMesh() {
    return (
        <group>
            <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[0.7, 0.4, 1.5]} />
                <meshStandardMaterial color="#5b4a36" roughness={0.9} />
            </mesh>
            {/* løp, peker mot porten (-Z) */}
            <mesh position={[0, 0.6, -0.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.2, 1.7, 12]} />
                <meshStandardMaterial color="#2f2f33" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* to hjul */}
            {[-0.45, 0.45].map((x) => (
                <mesh key={x} position={[x, 0.32, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.34, 0.34, 0.12, 14]} />
                    <meshStandardMaterial color="#3c2c1c" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

function Cannon({
    park,
    slot,
    placed,
    onPlace,
}: {
    park: [number, number];
    slot: [number, number];
    placed: boolean;
    onPlace: () => void;
}) {
    if (placed) {
        return (
            <group position={[slot[0], 0, slot[1]]}>
                <CannonMesh />
            </group>
        );
    }
    return (
        <Draggable
            position={[park[0], 0, park[1]]}
            snapPoints={[slot]}
            snapRadius={1.8}
            onSnap={onPlace}
            dropFx="dustPuff"
        >
            {/* romslig usynlig gripeflate for trygg trackpad-treffing */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.8, 1.4, 2.2]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            <CannonMesh />
        </Draggable>
    );
}

// --- En opprører: damper framover mot courtyard når folket stormer inn ---
function Rioter({
    home,
    target,
    surge,
    body,
    hat,
}: {
    home: [number, number];
    target: [number, number];
    surge: number;
    body: string;
    hat: 'cap' | 'none';
}) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const tx = home[0] + (target[0] - home[0]) * surge;
        const tz = home[1] + (target[1] - home[1]) * surge;
        ref.current.position.x = damp(ref.current.position.x, tx, dt, 1.8);
        ref.current.position.z = damp(ref.current.position.z, tz, dt, 1.8);
        const bob = surge > 0.4 ? Math.abs(Math.sin(performance.now() * 0.008 + home[0])) * 0.12 : 0;
        ref.current.position.y = damp(ref.current.position.y, bob, dt, 6);
    });
    return (
        <group ref={ref} position={[home[0], 0, home[1]]} rotation={[0, Math.PI, 0]}>
            <Person body={body} pose={surge > 0.3 ? 'walk' : 'idle'} hat={hat} hatColor="#7a1f1f" />
        </group>
    );
}

// --- Fange som går ut av porten ved seier ---
function Prisoner({ out, x }: { out: number; x: number }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.position.z = damp(ref.current.position.z, -0.5 + out * 4.5, dt, 1.4);
    });
    return (
        <group ref={ref} position={[x, 0, -0.5]} rotation={[0, Math.PI, 0]}>
            <Person body="#8b8378" skin="#d9b18f" legs="#534a3f" pose={out > 0.2 ? 'walk' : 'idle'} />
        </group>
    );
}

// --- Flagg som heises på det høyeste tårnet (hvitt -> trikolor) ---
function VictoryFlag({ up }: { up: number }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.position.y = damp(ref.current.position.y, 4.6 + up * 2, dt, 2.6);
        ref.current.scale.setScalar(damp(ref.current.scale.x, up > 0.05 ? 1 : 0.001, dt, 3));
    });
    return (
        <group ref={ref} position={[5.2, 4.6, 0.3]} scale={0.001}>
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
                <meshStandardMaterial color="#4a3a26" />
            </mesh>
            {/* trikolor: blå, hvit, rød */}
            {[
                ['#2e4a9e', -0.32],
                ['#f4f4f4', 0],
                ['#c8352b', 0.32],
            ].map(([c, dx]) => (
                <mesh key={dx as number} position={[0.4 + (dx as number), 1.05, 0]}>
                    <boxGeometry args={[0.3, 0.7, 0.02]} />
                    <meshStandardMaterial color={c as string} roughness={0.8} side={THREE.DoubleSide} />
                </mesh>
            ))}
        </group>
    );
}

interface SceneProps {
    phase: Phase;
    chains: boolean[];
    placed: boolean[];
    surge: number;
    surrender: number;
    cutChain: (i: number) => void;
    placeCannon: (i: number) => void;
    surrenderGate: () => void;
}

function BastilleScene({
    phase,
    chains,
    placed,
    surge,
    surrender,
    cutChain,
    placeCannon,
    surrenderGate,
}: SceneProps) {
    const bridgeDown = chains.every(Boolean);

    // Folkemengden i gata foran festningen.
    const crowd = useMemo(() => {
        const bodies = ['#3f6fa3', '#a3553f', '#5b7d4a', '#8d6b3f', '#7a5a86', '#b08a3a'];
        const arr: { home: [number, number]; target: [number, number]; body: string; hat: 'cap' | 'none' }[] = [];
        let k = 0;
        for (let row = 0; row < 3; row++) {
            const z = 5 + row * 1.1;
            for (let x = -5; x <= 5; x += 1.25) {
                const jitter = ((k * 37) % 7) / 14 - 0.25;
                arr.push({
                    home: [x + jitter, z],
                    // front blir trukket inn på borggården, bakerste rad rykker bare litt fram
                    target: [x * 0.5 + jitter, 0.6 + row * 1.2],
                    body: bodies[k % bodies.length],
                    hat: k % 3 === 0 ? 'cap' : 'none',
                });
                k++;
            }
        }
        return arr;
    }, []);

    return (
        <group>
            {/* bakken: brustein-grå plass */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 2]} receiveShadow>
                <planeGeometry args={[34, 28]} />
                <meshStandardMaterial color="#9a9476" roughness={1} />
            </mesh>

            <Fortress />

            {/* vollgrav foran porten */}
            <WaterPlane position={[0, 0.03, 1.7]} size={[12, 1.5]} color="#4a6f86" />

            <Drawbridge down={bridgeDown} />

            {/* kjettinger (steg 1) */}
            {phase === 'bridge' && (
                <>
                    <Chain x={-1.1} cut={chains[0]} onCut={() => cutChain(0)} />
                    <Chain x={1.1} cut={chains[1]} onCut={() => cutChain(1)} />
                </>
            )}

            {/* kruttrøk fra forsvarerne når folket presser på(steg 2) */}
            {phase === 'cannons' && (
                <>
                    <Smoke origin={[-3, 4.4, 0.4]} />
                    <Smoke origin={[2.4, 4.6, 0.4]} />
                </>
            )}

            {/* målsluk-markører + kanoner (steg 2) */}
            {(phase === 'cannons' || phase === 'storm' || phase === 'done') &&
                SLOTS.map((s, i) =>
                    placed[i] ? null : (
                        <mesh key={`m${i}`} position={[s[0], 0.04, s[1]]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0.5, 0.7, 18]} />
                            <meshBasicMaterial color="#c98a2b" transparent opacity={0.7} />
                        </mesh>
                    )
                )}
            {(phase === 'cannons' || phase === 'storm' || phase === 'done') &&
                PARK.map((p, i) => (
                    <Cannon key={i} park={p} slot={SLOTS[i]} placed={placed[i]} onPlace={() => placeCannon(i)} />
                ))}

            {/* port-hotspot: krev overgivelse (steg 3) */}
            {phase === 'storm' && (
                <Hotspot
                    position={[GATE_X, 2.4, 0.6]}
                    onSelect={surrenderGate}
                    label="Krev overgivelse"
                    radius={0.7}
                />
            )}

            {/* folkemengden */}
            {crowd.map((p, i) => (
                <Rioter key={i} home={p.home} target={p.target} surge={surge} body={p.body} hat={p.hat} />
            ))}

            {/* de få fangene går fri ved seier */}
            <Prisoner out={surrender} x={-0.8} />
            <Prisoner out={surrender} x={0.8} />

            <VictoryFlag up={surrender} />

            {/* feiringspartikler over porten */}
            <Burst position={[0, 3.2, 1]} trigger={Math.round(surrender)} />
        </group>
    );
}

export default function StormingenAvBastillen3D({ onComplete }: MicroGameProps) {
    const [phase, setPhase] = useState<Phase>('bridge');
    const [chains, setChains] = useState<boolean[]>([false, false]);
    const [placed, setPlaced] = useState<boolean[]>([false, false, false, false, false]);
    const [surge, setSurge] = useState(0);
    const [surrender, setSurrender] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        '14. juli 1789: folket vil ha kruttet inne i Bastillen. Klikk de to kjettingene og kapp dem.'
    );
    const sound = useStepSounds();

    const reset = () => {
        setPhase('bridge');
        setChains([false, false]);
        setPlaced([false, false, false, false, false]);
        setSurge(0);
        setSurrender(0);
        setBanner('14. juli 1789: folket vil ha kruttet inne i Bastillen. Klikk de to kjettingene og kapp dem.');
    };

    const cutChain = (i: number) => {
        setChains((prev) => {
            if (prev[i]) return prev;
            const next = [...prev];
            next[i] = true;
            if (next.every(Boolean)) {
                setSurge(1);
                sound.play('advance');
                setBanner('Brua dundret ned, og folket strømmer inn! Men forsvarerne skyter. Hent kanonene fra avhopperne.');
                setTimeout(() => setPhase('cannons'), 1100);
            }
            return next;
        });
    };

    const placeCannon = (i: number) => {
        setPlaced((prev) => {
            if (prev[i]) return prev;
            const next = [...prev];
            next[i] = true;
            sound.play('correct');
            if (next.every(Boolean)) {
                sound.play('advance');
                setBanner('Fem kanoner peker mot porten. Kommandant de Launay ser at det er over.');
                setTimeout(() => setPhase('storm'), 900);
            } else {
                setBanner('Kanon i stilling! Rull resten av kanonene fram til ringene.');
            }
            return next;
        });
    };

    const surrenderGate = () => {
        if (surrender > 0) return;
        setSurrender(1);
        sound.play('complete');
        setBanner('Klokka fem: det hvite flagget går opp. Bastillen har falt, de sju fangene går fri og folket tar kruttet.');
        setPhase('done');
        onComplete({ score: 1, completed: true });
    };

    const stepNum = phase === 'bridge' ? 1 : phase === 'cannons' ? 2 : 3;
    const era = '14. juli 1789';
    const placedCount = placed.filter(Boolean).length;

    return (
        <MicroGameScaffold
            title="Stormingen av Bastillen"
            subtitle="Kapp vindebrua, rull kanonene i stilling, og tving festningen til å overgi seg"
            estimatedSeconds={150}
            onRetry={reset}
            scene={
                <BastilleScene
                    phase={phase}
                    chains={chains}
                    placed={placed}
                    surge={surge}
                    surrender={surrender}
                    cutChain={cutChain}
                    placeCannon={placeCannon}
                    surrenderGate={surrenderGate}
                />
            }
            canvas={{
                idle: phase === 'bridge' && !chains.some(Boolean),
                camera: { position: [9, 7, 14], fov: 42 },
                background: '#ece3cf',
                fog: { near: 32, far: 64 },
                target: [0, 1.8, 1.2],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{era}</SceneBadge>
                    {phase === 'cannons' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Kanoner i stilling', value: placedCount, unit: 'av 5' },
                                { label: 'Angripere', value: '~20 000' },
                            ]}
                        />
                    )}
                    {phase === 'bridge' && (
                        <DragHint show={!chains.every(Boolean)} corner="bc">
                            Klikk de to kjettingene
                        </DragHint>
                    )}
                    {phase === 'cannons' && (
                        <DragHint show={placedCount < 5} corner="bc">
                            Dra kanonene til de oransje ringene
                        </DragHint>
                    )}
                    {phase === 'storm' && (
                        <DragHint show corner="bc">
                            Klikk porten og krev overgivelse
                        </DragHint>
                    )}
                </>
            }
        >
            <div className="flex items-center justify-between mb-2.5">
                <StepTracker current={stepNum} total={3} />
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                    {phase === 'bridge' && (
                        <>
                            <Scissors className="w-3.5 h-3.5" /> Kapp vindebrua
                        </>
                    )}
                    {phase === 'cannons' && (
                        <>
                            <Crosshair className="w-3.5 h-3.5" /> Rull kanonene i stilling
                        </>
                    )}
                    {(phase === 'storm' || phase === 'done') && (
                        <>
                            <Flag className="w-3.5 h-3.5" /> Tving fram overgivelse
                        </>
                    )}
                </span>
            </div>

            {phase === 'bridge' && (
                <SceneFact>
                    Folket hadde alt tatt nesten tretti tusen gevær, men de manglet krutt, og uten krutt var
                    geværene bare jernrør. Kruttet lå i kjelleren under Bastillen. Vindebrua sperret veien.
                    Klikk de to kjettingene som holder brua oppe.
                </SceneFact>
            )}

            {phase === 'cannons' && (
                <SceneFact>
                    Da folket stormet inn på den ytre gården, ga kommandanten ordre om å skyte. På et par timer
                    falt nesten hundre angripere. Men så kom gardesoldater som hadde hoppet av kongens hær, med
                    fem store kanoner. Dra hver kanon fram til ringene foran porten.
                </SceneFact>
            )}

            {phase === 'storm' && (
                <SceneFact>
                    Med kanonene rettet mot hovedporten skjønte de Launay at festningen ikke kunne holde. Klikk
                    porten og krev at han overgir seg.
                </SceneFact>
            )}

            {phase === 'done' && (
                <WinScreen title="Bastillen har falt, 14. juli 1789" onReplay={reset}>
                    Du kjente det selv: det var vanlige parisere, ikke kongen, som tok en kongelig festning med
                    makt. De kom for kruttet, og inne satt det bare sju fanger. Likevel ble dagen enorm, for nå
                    visste folk at makten lå hos dem. Den 14. juli er fortsatt Frankrikes nasjonaldag.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
}
