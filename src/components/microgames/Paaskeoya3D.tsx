import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreePine, Axe, RotateCcw } from 'lucide-react';
import {
    MicroGameScaffold,
    Interactive,
    WaterPlane,
    Tree,
    damp,
    Burst,
    Impact,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    DragHint,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Påskeøya: skogen og statuene. Eleven hogger palmene på en grønn øy for å
// reise moai. For hvert par trær reiser en ny statue seg langs kysten - men
// øya blir brunere for hvert tre som faller. Når siste tre er borte, står
// alle statuene ferdige på en naken stein. Lyspæra kommer i hendene: det
// samme arbeidet eleven er stolt av (reise moai) er nettopp det som hogg ned
// hele skogen og felte samfunnet. Ressursen ble brukt raskere enn den kunne
// fornye seg.

const TOTAL_TREES = 12;
const TREES_PER_MOAI = 2;
const TOTAL_MOAI = TOTAL_TREES / TREES_PER_MOAI; // 6

// Faste treposisjoner inne på øya (unngår tilfeldighet i render).
const TREE_POS: [number, number, number][] = [
    [-4.2, 0, -3.4],
    [-1.6, 0, -4.3],
    [1.4, 0, -3.9],
    [3.8, 0, -2.9],
    [-4.6, 0, -0.4],
    [-2.0, 0, -1.2],
    [1.0, 0, -0.9],
    [4.2, 0, 0.2],
    [-3.2, 0, 1.9],
    [-0.6, 0, 2.3],
    [2.4, 0, 2.0],
    [4.0, 0, 3.1],
];

// Moai-plattformer langs framkanten (mot havet).
const MOAI_POS: [number, number, number][] = [
    [-5.2, 0, 5.4],
    [-3.1, 0, 6.0],
    [-1.0, 0, 6.2],
    [1.1, 0, 6.2],
    [3.2, 0, 6.0],
    [5.3, 0, 5.4],
];

const GREEN = new THREE.Color('#5f9a44');
const BARREN = new THREE.Color('#a98a5a');

const Paaskeoya3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [cut, setCut] = useState<number[]>([]);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);
    const [impact, setImpact] = useState<{ pos: [number, number, number]; n: number }>({
        pos: [0, 0, 0],
        n: 0,
    });

    const remaining = TOTAL_TREES - cut.length;
    const moaiRaised = Math.floor(cut.length / TREES_PER_MOAI);
    const ratio = remaining / TOTAL_TREES; // 1 = full skog, 0 = naken øy

    const chop = (i: number) => {
        if (done || cut.includes(i)) return;
        const next = [...cut, i];
        setCut(next);
        setImpact({ pos: TREE_POS[i], n: impact.n + 1 });
        const raisedNow = Math.floor(next.length / TREES_PER_MOAI);
        if (raisedNow > moaiRaised) {
            sounds.play('advance');
            setBurst((b) => b + 1);
        } else {
            sounds.play('drop');
        }
        if (next.length >= TOTAL_TREES) {
            setTimeout(() => {
                sounds.play('complete');
                setDone(true);
                onComplete({ score: 1, completed: true, artifact: { moai: TOTAL_MOAI } });
            }, 900);
        }
    };

    // Tilgjengelighets-vei: hogg det første treet som står igjen.
    const chopNext = () => {
        const first = TREE_POS.findIndex((_, i) => !cut.includes(i));
        if (first >= 0) chop(first);
    };

    const reset = () => {
        setCut([]);
        setDone(false);
    };

    const banner = done
        ? 'Skogen er borte. Alle moaiene står ferdige - på en naken stein.'
        : remaining === 0
          ? 'Siste tre falt ...'
          : remaining <= 4
            ? 'Nesten ingen trær igjen. Snart er det ingen vei tilbake.'
            : remaining <= 8
              ? 'Skogen tynnes ut for hver moai du reiser.'
              : 'Klikk et palmetre for å hogge det og reise en moai.';

    const era = done ? 'Øya er bar' : `Skog: ${Math.round(ratio * 100)} %`;

    return (
        <MicroGameScaffold
            title="Påskeøya: skogen og statuene"
            subtitle="Hogg palmene for å reise moai - og se hva som skjer med øya"
            estimatedSeconds={140}
            onRetry={cut.length > 0 ? reset : undefined}
            canvas={{
                idle: cut.length === 0,
                camera: { position: [0, 9, 15], fov: 40 },
                background: '#bfe0f2',
                fog: { color: '#cfe4ee', near: 30, far: 60 },
                target: [0, 0.5, 1],
                light: 'golden',
            }}
            containerClassName="bg-gradient-to-b from-[#bfe0f2] via-[#dbeaf0] to-[#e9ddc4]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Trær igjen', value: remaining },
                            { label: 'Moai reist', value: moaiRaised },
                        ]}
                    />
                    <SceneBadge corner="br">{era}</SceneBadge>
                    <DragHint show={cut.length === 0} corner="bc">
                        Klikk et tre - eller bruk knappen under
                    </DragHint>
                </>
            }
            scene={
                <Island
                    ratio={ratio}
                    cut={cut}
                    moaiRaised={moaiRaised}
                    onChop={chop}
                    burst={burst}
                    impact={impact}
                />
            }
        >
            {done ? (
                <WinScreen title="Du reiste alle moaiene - men hogg ned hele skogen." onReplay={reset}>
                    Uten trær: ingen kanoer til fiske, ingen ved, ingen tømmer. Det samme arbeidet
                    øyboerne var stolte av, brukte opp ressursen som holdt dem i live. Statuene ble
                    stående igjen på en bar øy.
                </WinScreen>
            ) : (
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={chopNext}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors"
                    >
                        <Axe className="w-4 h-4" />
                        Hogg et tre
                    </button>
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <TreePine className="w-4 h-4 text-emerald-600" />
                        {remaining} av {TOTAL_TREES} trær står igjen
                    </div>
                    {cut.length > 0 && (
                        <button
                            onClick={reset}
                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Start på nytt
                        </button>
                    )}
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN - øya, havet, palmene og moaiene.
// ============================================================

function Island({
    ratio,
    cut,
    moaiRaised,
    onChop,
    burst,
    impact,
}: {
    ratio: number;
    cut: number[];
    moaiRaised: number;
    onChop: (i: number) => void;
    burst: number;
    impact: { pos: [number, number, number]; n: number };
}) {
    return (
        <group>
            {/* Havet rundt øya */}
            <WaterPlane position={[0, -0.15, 0]} size={[60, 60]} color="#3d7fa6" />
            {/* Selve øya - grønn som demper mot brun når skogen forsvinner */}
            <IslandGround ratio={ratio} />

            {/* Palmene - klikkbare */}
            {TREE_POS.map((pos, i) =>
                cut.includes(i) ? (
                    <Stump key={i} position={pos} />
                ) : (
                    <Interactive
                        key={i}
                        onSelect={() => onChop(i)}
                        hitArea={[1.6, 2.4, 1.6]}
                        position={pos}
                    >
                        {(s) => (
                            <group>
                                <Tree position={[0, 0, 0]} leaf={s === 'hover' ? '#8fd06a' : '#3f7d34'} seed={i} />
                            </group>
                        )}
                    </Interactive>
                )
            )}

            {/* Moaiene reiser seg etter hvert som trærne felles */}
            {MOAI_POS.map((pos, i) => (
                <Moai key={i} position={pos} raised={i < moaiRaised} />
            ))}

            {/* Feiring når en moai reises, og støvsky der treet falt */}
            <Burst position={[0, 3, 4]} trigger={burst} color="#e8d3a0" count={26} spread={3.2} />
            <Impact preset="dustPuff" trigger={impact.n} position={impact.pos} />
        </group>
    );
}

// Øy-bakken: en flat sirkel som demper farge fra grønn til brun.
function IslandGround({ ratio }: { ratio: number }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!mat.current) return;
        const target = BARREN.clone().lerp(GREEN, ratio);
        mat.current.color.r = damp(mat.current.color.r, target.r, dt, 3);
        mat.current.color.g = damp(mat.current.color.g, target.g, dt, 3);
        mat.current.color.b = damp(mat.current.color.b, target.b, dt, 3);
    });
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} receiveShadow>
            <circleGeometry args={[9, 48]} />
            <meshStandardMaterial ref={mat} color="#5f9a44" roughness={1} />
        </mesh>
    );
}

// En liten stubbe der et tre er hogd.
function Stump({ position }: { position: [number, number, number] }) {
    return (
        <mesh position={[position[0], 0.12, position[2]]} castShadow>
            <cylinderGeometry args={[0.14, 0.16, 0.24, 6]} />
            <meshStandardMaterial color="#6b4a2c" roughness={0.95} />
        </mesh>
    );
}

// Moai: den ikoniske statuen. Ligger flatt til den reises, så demper opp.
function Moai({ position, raised }: { position: [number, number, number]; raised: boolean }) {
    const group = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!group.current) return;
        // t: 0 = liggende (nylig hogd stein), 1 = reist og stående.
        const targetTilt = raised ? 0 : Math.PI / 2 - 0.12;
        group.current.rotation.x = damp(group.current.rotation.x, targetTilt, dt, 4);
        const targetY = raised ? 0 : -0.1;
        group.current.position.y = damp(group.current.position.y, targetY, dt, 4);
    });
    return (
        <group position={position}>
            {/* Ahu - steinplattformen statuen står på */}
            <mesh position={[0, 0.12, 0.1]} receiveShadow castShadow>
                <boxGeometry args={[1.5, 0.24, 0.9]} />
                <meshStandardMaterial color="#7d746a" roughness={1} />
            </mesh>
            {/* Statuen - reiser seg fra plattformen */}
            <group ref={group} position={[0, 0, 0]}>
                <group position={[0, 1.1, 0]}>
                    {/* kropp */}
                    <mesh position={[0, 0, 0]} castShadow>
                        <boxGeometry args={[0.7, 1.6, 0.55]} />
                        <meshStandardMaterial color="#8a8078" roughness={0.95} />
                    </mesh>
                    {/* hode - den tunge, avlange moai-pannen */}
                    <mesh position={[0, 1.15, 0.02]} castShadow>
                        <boxGeometry args={[0.62, 0.9, 0.6]} />
                        <meshStandardMaterial color="#948a80" roughness={0.95} />
                    </mesh>
                    {/* nese */}
                    <mesh position={[0, 1.05, 0.34]} castShadow>
                        <boxGeometry args={[0.14, 0.34, 0.16]} />
                        <meshStandardMaterial color="#8a8078" roughness={0.95} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

export default Paaskeoya3D;
