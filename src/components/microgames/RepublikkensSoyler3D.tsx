import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MicroGameScaffold } from './kit/MicroGameScaffold';
import { Interactive } from './kit/Interactive';
import { Burst } from './kit/Burst';
import { GroundPlane } from './kit/scene-parts';
import { SceneBanner, SceneBadge, DataReadout, WinScreen } from './kit/overlays';
import { damp } from './kit/damp';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Lyspære-øyeblikk: Etter at amerikanerne hadde beseiret en konge, bygde de en
// stat der makten ble delt i tre. Eleven fordeler tre maktklosser på de tre
// statsmaktene. Legger hen én på hver, står republikken trygt og taket lyser.
// Stabler hen to på samme søyle, blir den for mektig, taket tipper, og en
// gullkrone senker seg ned over den - en ny konge er i ferd med å vokse fram.
// Kjerne: makten må deles likt mellom de tre, ellers kan én ta over.

interface Branch {
    id: string;
    label: string;
    role: string;
    color: string;
    x: number;
}

const BRANCHES: Branch[] = [
    { id: 'kongress', label: 'Kongressen', role: 'lager lovene', color: '#3b82f6', x: -3.4 },
    { id: 'president', label: 'Presidenten', role: 'styrer landet', color: '#ef4444', x: 0 },
    { id: 'hoyesterett', label: 'Høyesterett', role: 'dømmer etter loven', color: '#22c55e', x: 3.4 },
];

const TOTAL = 3; // tre maktklosser å fordele
const COL_H = 3.0; // søylehøyde

const RepublikkensSoyler3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [counts, setCounts] = useState<[number, number, number]>([0, 0, 0]);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const placed = counts[0] + counts[1] + counts[2];
    const pool = TOTAL - placed;
    const maxCount = Math.max(...counts);
    const warnIndex = maxCount >= 2 ? counts.indexOf(maxCount) : -1;
    const balanced = counts[0] === 1 && counts[1] === 1 && counts[2] === 1;

    const clickBranch = (i: number) => {
        if (done) return;
        setCounts((cur) => {
            const next: [number, number, number] = [...cur] as [number, number, number];
            const used = next[0] + next[1] + next[2];
            if (used < TOTAL) {
                // Det er makt igjen i bunken: legg en kloss på denne søylen.
                next[i] += 1;
                sounds.play(next[i] >= 2 ? 'incorrect' : 'drop');
            } else {
                // Makta er brukt opp: klikk tar klossene av søylen igjen så du
                // kan fordele på nytt.
                if (next[i] === 0) {
                    sounds.play('pick');
                    return cur;
                }
                next[i] = 0;
                sounds.play('pick');
            }
            return next;
        });
    };

    // Fyr av seier når fordelingen blir 1-1-1.
    React.useEffect(() => {
        if (balanced && !done) {
            setDone(true);
            setBurst((b) => b + 1);
            sounds.play('complete');
            onComplete({ score: 1, completed: true, artifact: { counts } });
        }
    }, [balanced, done, counts, onComplete, sounds]);

    const reset = () => {
        setCounts([0, 0, 0]);
        setDone(false);
    };

    const banner = done
        ? 'Makten er delt likt. Ingen kan bli konge - republikken står.'
        : warnIndex >= 0
          ? `For mye makt på ${BRANCHES[warnIndex].label}. Da vokser en ny konge fram - del makta likt.`
          : pool > 0
            ? `Klikk en søyle for å gi den makt. ${pool} maktkloss${pool > 1 ? 'er' : ''} igjen.`
            : 'All makta er fordelt. Klikk en søyle for å flytte om.';

    return (
        <MicroGameScaffold
            title="Republikkens tre søyler"
            subtitle="Del makten likt mellom de tre statsmaktene - ellers reiser en ny konge seg"
            estimatedSeconds={130}
            onRetry={placed > 0 || done ? reset : undefined}
            scene={
                <TempleScene
                    counts={counts}
                    warnIndex={warnIndex}
                    done={done}
                    burst={burst}
                    onPick={clickBranch}
                />
            }
            canvas={{
                idle: placed === 0 && !done,
                camera: { position: [0, 4.6, 11], fov: 42 },
                background: '#dbe7f2',
                fog: { color: '#dbe7f2', near: 20, far: 40 },
                target: [0, 2.4, 0],
            }}
            containerClassName="bg-gradient-to-b from-[#eef4fa] via-[#dbe7f2] to-[#c4d6e8]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={BRANCHES.map((b, i) => ({
                            label: b.label,
                            value: counts[i],
                        }))}
                    />
                    <SceneBadge corner="br">USA 1787</SceneBadge>
                </>
            }
        >
            {done ? (
                <WinScreen title="Maktfordelingen står" onReplay={reset}>
                    Du ga én maktkloss til hver av de tre statsmaktene. Kongressen lager lovene,
                    presidenten styrer landet, og Høyesterett dømmer etter loven. Ingen av dem
                    kan styre alene, og hver av dem kan stoppe de andre. Det var nettopp dette
                    grunnloven fra 1787 skulle sikre: at ingen kunne bli en ny konge.
                </WinScreen>
            ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    {BRANCHES.map((b) => (
                        <span key={b.id} className="inline-flex items-center gap-1.5">
                            <span
                                className="inline-block h-3 w-3 rounded-sm"
                                style={{ backgroundColor: b.color }}
                            />
                            <span className="font-medium text-slate-700">{b.label}</span>
                            <span className="text-slate-400">{b.role}</span>
                        </span>
                    ))}
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function TempleScene({
    counts,
    warnIndex,
    done,
    burst,
    onPick,
}: {
    counts: [number, number, number];
    warnIndex: number;
    done: boolean;
    burst: number;
    onPick: (i: number) => void;
}) {
    return (
        <group>
            <GroundPlane size={40} depth={30} color="#cfc8b6" />
            {/* Stylobat - trappetrinn republikken hviler på */}
            <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
                <boxGeometry args={[10, 0.3, 4]} />
                <meshStandardMaterial color="#e7e0cf" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.42, 0]} receiveShadow castShadow>
                <boxGeometry args={[9, 0.28, 3.4]} />
                <meshStandardMaterial color="#efe9da" roughness={0.9} />
            </mesh>

            {BRANCHES.map((b, i) => (
                <BranchColumn
                    key={b.id}
                    x={b.x}
                    color={b.color}
                    count={counts[i]}
                    warn={warnIndex === i}
                    onPick={() => onPick(i)}
                />
            ))}

            <Pediment counts={counts} done={done} />
            <Crown counts={counts} warnIndex={warnIndex} />

            <Burst position={[0, COL_H + 1.4, 0]} trigger={burst} color="#f5c542" count={34} spread={4} />
        </group>
    );
}

// En søyle = én statsmakt. Klikkbar. Lyser opp med makten den har.
function BranchColumn({
    x,
    color,
    count,
    warn,
    onPick,
}: {
    x: number;
    color: string;
    count: number;
    warn: boolean;
    onPick: () => void;
}) {
    const glow = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!glow.current) return;
        // Lyser sterkere jo mer makt, blinker rødt-varmt ved overmakt.
        const targetE = count === 0 ? 0 : warn ? 0.9 : 0.4;
        glow.current.emissiveIntensity = damp(glow.current.emissiveIntensity, targetE, dt, 5);
    });

    const capY = 0.56 + COL_H; // topp av søylen (over stylobat)

    return (
        <group position={[x, 0, 0]}>
            <Interactive
                onSelect={onPick}
                state={warn ? 'wrong' : count > 0 ? 'selected' : 'idle'}
                hitArea={[2.2, COL_H + 1.2, 2.2]}
            >
                {/* Base */}
                <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.1, 0.28, 1.1]} />
                    <meshStandardMaterial color="#efe9da" roughness={0.85} />
                </mesh>
                {/* Skaft */}
                <mesh position={[0, 0.56 + COL_H / 2, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.42, 0.46, COL_H, 20]} />
                    <meshStandardMaterial
                        ref={glow}
                        color="#f4efe2"
                        emissive={warn ? '#ef4444' : color}
                        emissiveIntensity={0}
                        roughness={0.7}
                    />
                </mesh>
                {/* Kapitel */}
                <mesh position={[0, capY + 0.14, 0]} castShadow>
                    <boxGeometry args={[1.15, 0.28, 1.15]} />
                    <meshStandardMaterial color="#efe9da" roughness={0.85} />
                </mesh>
            </Interactive>

            {/* Maktklosser stablet over kapitelet */}
            {Array.from({ length: count }).map((_, k) => (
                <PowerBlock key={k} y={capY + 0.5 + k * 0.5} color={color} />
            ))}
        </group>
    );
}

function PowerBlock({ y, color }: { y: number; color: string }) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!g.current) return;
        // Klossen faller mykt på plass.
        g.current.position.y = damp(g.current.position.y, y, dt, 8);
        g.current.rotation.y += dt * 0.6;
    });
    return (
        <group ref={g} position={[0, y + 2, 0]}>
            <mesh castShadow>
                <boxGeometry args={[0.66, 0.42, 0.66]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.35}
                    roughness={0.5}
                    metalness={0.2}
                />
            </mesh>
        </group>
    );
}

// Taket - "REPUBLIKKEN". Tipper når makten er skjevt fordelt, lyser gull ved balanse.
function Pediment({
    counts,
    done,
}: {
    counts: [number, number, number];
    done: boolean;
}) {
    const grp = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (grp.current) {
            // Tilt: forskjell mellom venstre og høyre søyle.
            const tiltTarget = THREE.MathUtils.clamp((counts[0] - counts[2]) * 0.14, -0.4, 0.4);
            grp.current.rotation.z = damp(grp.current.rotation.z, tiltTarget, dt, 4);
            // Løftes litt når midtsøylen er overlesset.
            const liftTarget = 0.56 + COL_H + 0.5 + (counts[1] >= 2 ? 0.5 : 0);
            grp.current.position.y = damp(grp.current.position.y, liftTarget, dt, 4);
        }
        if (mat.current) {
            const target = done ? 0.75 : 0;
            mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, target, dt, 4);
        }
    });
    return (
        <group ref={grp} position={[0, 0.56 + COL_H + 0.5, 0]}>
            {/* Bjelke (arkitrav) */}
            <mesh position={[0, 0.2, 0]} castShadow>
                <boxGeometry args={[8.4, 0.5, 1.5]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#f2ecdd"
                    emissive="#f5c542"
                    emissiveIntensity={0}
                    roughness={0.7}
                />
            </mesh>
            {/* Gavl (trekantet takrygg som løper i bredden) */}
            <mesh position={[0, 0.85, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.05, 1.1, 8.4, 3]} />
                <meshStandardMaterial color="#eae3d2" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Gullkronen som senker seg ned over en overmektig statsmakt.
function Crown({
    counts,
    warnIndex,
}: {
    counts: [number, number, number];
    warnIndex: number;
}) {
    const grp = useRef<THREE.Group>(null);
    const targetX = warnIndex >= 0 ? BRANCHES[warnIndex].x : 0;
    const show = warnIndex >= 0;
    const topY = 0.56 + COL_H + 0.5 + (counts[warnIndex] ?? 0) * 0.5 + 0.6;

    useFrame((_, dt) => {
        if (!grp.current) return;
        const s = show ? 1 : 0.001;
        const yTarget = show ? topY : topY + 2.5;
        grp.current.scale.x = damp(grp.current.scale.x, s, dt, 6);
        grp.current.scale.y = damp(grp.current.scale.y, s, dt, 6);
        grp.current.scale.z = damp(grp.current.scale.z, s, dt, 6);
        grp.current.position.x = damp(grp.current.position.x, targetX, dt, 8);
        grp.current.position.y = damp(grp.current.position.y, yTarget, dt, 5);
        grp.current.rotation.y += dt * 0.8;
    });

    return (
        <group ref={grp} position={[targetX, topY + 2.5, 0]} scale={0.001}>
            {/* Krans */}
            <mesh castShadow>
                <cylinderGeometry args={[0.5, 0.42, 0.34, 16]} />
                <meshStandardMaterial
                    color="#f5c542"
                    emissive="#f5c542"
                    emissiveIntensity={0.6}
                    metalness={0.7}
                    roughness={0.25}
                />
            </mesh>
            {/* Takker */}
            {[0, 1, 2, 3, 4].map((i) => {
                const a = (i / 5) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(a) * 0.46, 0.32, Math.sin(a) * 0.46]} castShadow>
                        <coneGeometry args={[0.12, 0.34, 8]} />
                        <meshStandardMaterial
                            color="#f5c542"
                            emissive="#f5c542"
                            emissiveIntensity={0.6}
                            metalness={0.7}
                            roughness={0.25}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

export default RepublikkensSoyler3D;
