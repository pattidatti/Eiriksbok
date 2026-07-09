import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    WaterPlane,
    Tree,
    SceneBanner,
    SceneBadge,
    DragHint,
    StepTracker,
    Burst,
    Particles,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: natten 25. desember 1776 ror Washington hæren over den iskalde
// Delaware-elven for å overraske fienden i Trenton. Eleven drar hver båt fra
// Pennsylvania-bredden over elven til New Jersey-bredden. Lyspæren i hendene:
// Washington snudde en tapende krig ved å våge det ingen trodde var mulig -
// et hemmelig angrep tvers over en frossen elv midt på julenatten.

const BOAT_COUNT = 3;
const START_Z = 6; // Pennsylvania-bredden (foran)
const LAND_Z = -6; // New Jersey-bredden (bak)
const CROSS_LINE = -1.5; // slipper du båten forbi denne, har den krysset
const START_X = [-3.4, 0, 3.4];
const LAND_X = [-3.4, 0, 3.4];

const DelawareKrysning3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [landed, setLanded] = useState<boolean[]>([false, false, false]);
    const [banner, setBanner] = useState<string | null>(
        'Dra en robåt tvers over den iskalde elven til den andre bredden.'
    );
    const [burst, setBurst] = useState(0);
    const [won, setWon] = useState(false);

    const count = landed.filter(Boolean).length;

    const reset = () => {
        setLanded([false, false, false]);
        setBanner('Dra en robåt tvers over den iskalde elven til den andre bredden.');
        setWon(false);
    };

    const handleDrop = (i: number, pos: THREE.Vector3) => {
        if (landed[i]) return;
        if (pos.z <= CROSS_LINE) {
            const next = [...landed];
            next[i] = true;
            setLanded(next);
            const c = next.filter(Boolean).length;
            if (c >= BOAT_COUNT) {
                sounds.play('complete');
                setBurst((b) => b + 1);
                setBanner(null);
                setWon(true);
                setTimeout(() => onComplete({ score: 1, completed: true }), 250);
            } else {
                sounds.play('correct');
                setBanner(`Godt rodd! ${c} av ${BOAT_COUNT} båter er over. Ta neste.`);
            }
        } else {
            sounds.play('incorrect');
            setBanner('Nesten. Ro båten helt over til bredden på den andre siden.');
        }
    };

    return (
        <MicroGameScaffold
            title="Kryss Delaware-elven"
            subtitle="Ro Washingtons soldater tvers over den frosne elven for å overraske fienden i Trenton"
            estimatedSeconds={120}
            onRetry={count > 0 || won ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 11, 15], fov: 42 },
                background: '#c3d4de',
                target: [0, 0.4, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">25. desember 1776</SceneBadge>
                    <DragHint show={count === 0 && !won}>Dra en båt over elven</DragHint>
                </>
            }
            scene={
                <RiverScene
                    landed={landed}
                    burst={burst}
                    won={won}
                    onDrop={handleDrop}
                />
            }
        >
            <div className="flex flex-col gap-2.5">
                <StepTracker current={count} total={BOAT_COUNT} />
                {won ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                        <p className="text-sm text-emerald-800 leading-relaxed">
                            Hele hæren er over! I grålysningen overrasket Washington fienden i
                            Trenton og vant. Etter måneder med nederlag ga det dristige julenatt
                            angrepet nytt håp. Washington vant ikke fordi han var forsiktig, men
                            fordi han våget det ingen andre trodde var mulig.
                        </p>
                    </div>
                ) : (
                    <p className="text-center text-sm text-slate-600">
                        Ta tak i en båt og dra den fra den nære bredden helt over til den andre
                        siden. Det er kaldt, mørkt og fullt av is, men overraskelsen er alt.
                    </p>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function RiverScene({
    landed,
    burst,
    won,
    onDrop,
}: {
    landed: boolean[];
    burst: number;
    won: boolean;
    onDrop: (i: number, pos: THREE.Vector3) => void;
}) {
    return (
        <group>
            {/* Snødekt land på begge bredder */}
            <GroundPlane size={40} depth={34} color="#e2e9ec" />
            {/* Den iskalde elven som skiller bredden foran fra bredden bak */}
            <WaterPlane position={[0, 0.02, 0]} size={[40, 11]} color="#4f6f88" />

            {/* Isflak som driver på elven */}
            <IceFloes />

            {/* Litt vinterskog i bakkant */}
            <WinterTree position={[-9, 0, -13]} />
            <WinterTree position={[9.5, 0, -12.5]} />
            <WinterTree position={[-11, 0, 13]} />
            <WinterTree position={[11, 0, 12]} />

            {/* Landingsmarkører på den andre bredden */}
            {LAND_X.map((x, i) =>
                landed[i] ? null : (
                    <mesh key={`slot-${i}`} position={[x, 0.06, LAND_Z]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.9, 1.15, 24]} />
                        <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
                    </mesh>
                )
            )}

            {/* Båtene: dra dem over hvis de ikke er landet, ellers stå på bredden */}
            {landed.map((isLanded, i) =>
                isLanded ? (
                    <group key={`landed-${i}`} position={[LAND_X[i], 0.15, LAND_Z + 0.4]}>
                        <RowBoat lead={i === 1} />
                    </group>
                ) : (
                    <Draggable
                        key={`boat-${i}`}
                        position={[START_X[i], 0, START_Z]}
                        planeY={0}
                        liftY={0.35}
                        bounds={{ minX: -8, maxX: 8, minZ: LAND_Z - 0.5, maxZ: START_Z + 1 }}
                        onDrop={(p) => onDrop(i, p)}
                    >
                        {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                        <mesh position={[0, 0.4, 0]}>
                            <boxGeometry args={[2.6, 1.4, 3.4]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <group position={[0, 0.15, 0]}>
                            <RowBoat lead={i === 1} />
                        </group>
                    </Draggable>
                )
            )}

            {/* Feiringspartikler når hele hæren er over */}
            <Burst position={[0, 2, LAND_Z]} trigger={burst} color="#dbeafe" count={40} spread={5} />

            {/* Snøvær hele veien - julenatt 1776 */}
            <Particles preset="snow" />

            {won && <Victory />}
        </group>
    );
}

// En lav-poly robåt med et par soldater. `lead`-båten har Washington stående i baugen.
function RowBoat({ lead = false }: { lead?: boolean }) {
    return (
        <group>
            {/* Skrog */}
            <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
                <boxGeometry args={[1.1, 0.3, 2.6]} />
                <meshStandardMaterial color="#5a3d24" roughness={0.9} />
            </mesh>
            {/* Baug og akter - spisse endestykker */}
            {[1, -1].map((dir) => (
                <mesh key={dir} position={[0, 0.15, dir * 1.5]} rotation={[dir * 0.5, 0, 0]} castShadow>
                    <boxGeometry args={[1.0, 0.28, 0.6]} />
                    <meshStandardMaterial color="#4a3120" roughness={0.9} />
                </mesh>
            ))}
            {/* Soldater om bord */}
            <Soldier position={[0, 0, -0.5]} color="#3b5a78" />
            <Soldier position={[0, 0, 0.4]} color="#6b6f76" />
            {/* Washington står i baugen på den fremste båten */}
            {lead && <Soldier position={[0, 0.15, 1.05]} color="#1e3a5f" tall />}
        </group>
    );
}

function Soldier({
    position,
    color,
    tall = false,
}: {
    position: [number, number, number];
    color: string;
    tall?: boolean;
}) {
    const h = tall ? 0.9 : 0.6;
    return (
        <group position={position}>
            <mesh position={[0, 0.25 + h / 2, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.18, h, 8]} />
                <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.28 + h, 0]} castShadow>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshStandardMaterial color="#e8c9a0" roughness={0.8} />
            </mesh>
            {/* Trekantet hatt */}
            <mesh position={[0, 0.4 + h, 0]} castShadow>
                <coneGeometry args={[0.2, 0.16, 4]} />
                <meshStandardMaterial color="#2b2b2b" roughness={0.7} />
            </mesh>
        </group>
    );
}

// Isflak som driver rolig nedover elven.
function IceFloes() {
    const group = useRef<THREE.Group>(null);
    const floes = [
        [-6, 3],
        [-2, -1],
        [3, 2],
        [6, -2],
        [1, 4],
        [-4, -3],
    ] as const;
    useFrame((_, dt) => {
        if (!group.current) return;
        group.current.children.forEach((c) => {
            c.position.x += dt * 0.5;
            if (c.position.x > 9) c.position.x = -9;
        });
    });
    return (
        <group ref={group}>
            {floes.map(([x, z], i) => (
                <mesh
                    key={i}
                    position={[x, 0.09, z]}
                    rotation={[-Math.PI / 2, 0, i * 0.7]}
                    receiveShadow
                >
                    <circleGeometry args={[0.7 + (i % 3) * 0.25, 6]} />
                    <meshStandardMaterial color="#eef4f6" roughness={0.6} />
                </mesh>
            ))}
        </group>
    );
}

function WinterTree({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <Tree position={[0, 0, 0]} leaf="#8fae9a" />
            {/* Snødryss på toppen */}
            <mesh position={[0, 1.9, 0]} castShadow>
                <coneGeometry args={[0.55, 0.6, 8]} />
                <meshStandardMaterial color="#f3f8fa" roughness={0.7} />
            </mesh>
        </group>
    );
}

// Soloppgang som stiger når hæren er over - grålysningen før angrepet i Trenton.
function Victory() {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.position.y = damp(ref.current.position.y, 3.2, dt, 0.7);
        const m = ref.current.material as THREE.MeshBasicMaterial;
        m.opacity = damp(m.opacity, 0.85, dt, 1);
    });
    return (
        <mesh ref={ref} position={[0, -1, -14]}>
            <circleGeometry args={[2.2, 32]} />
            <meshBasicMaterial color="#ffd9a0" transparent opacity={0} />
        </mesh>
    );
}

export default DelawareKrysning3D;
