import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ArrowUp, Layers, Sun } from 'lucide-react';
import {
    MicroGameScaffold,
    Hotspot,
    GroundPlane,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    DangerVignette,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om gotiske katedraler. Lyspæren eleven skal kjenne
// på kroppen: det høye, lyse kirkerommet er ikke gratis. Når eleven legger
// hvelvet, presser det murene utover (fare) - og bare når strebebuene fanger
// opp presset kan muren stå tynn og høy og slippe inn lyset. Mekanikken ER
// pedagogikken: du kjenner selv hvorfor katedralen trenger strebebuene.
// Kameraet ser rett inn i kirka framfra (tverrsnitt): begge murer, begge
// strebebuer og hvelvet er synlige samtidig, og glassrosen lyser i bakveggen.

const NAVE_DEPTH = 7;
const WALL_X = 1.9;

interface SceneProps {
    stage: number; // 0 lave murer, 1 høye murer, 2 hvelv lagt
    leftBut: boolean;
    rightBut: boolean;
    rose: boolean;
    onRaise: () => void;
    onVault: () => void;
    onButtress: (side: 'left' | 'right') => void;
    onRose: () => void;
    burst: number;
}

function Wall({ side, stage, supported }: { side: 1 | -1; stage: number; supported: boolean }) {
    const group = useRef<THREE.Group>(null);
    const box = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        const h = stage >= 1 ? 6 : 3;
        const thick = stage >= 1 ? 0.55 : 1.05;
        // Faresone: hvelvet er lagt, men denne siden mangler strebebue.
        const leaning = stage >= 2 && !supported;
        const lean = leaning ? 0.16 : 0;
        if (group.current) {
            // toppen skal vippe UTOVER (bort fra midten) når muren ikke er støttet
            group.current.rotation.z = damp(group.current.rotation.z, -side * lean, dt, 6);
        }
        if (box.current) {
            box.current.scale.y = damp(box.current.scale.y, h, dt, 6);
            box.current.position.y = damp(box.current.position.y, h / 2, dt, 6);
            box.current.scale.x = damp(box.current.scale.x, thick, dt, 6);
            const mat = box.current.material as THREE.MeshStandardMaterial;
            const target = new THREE.Color(leaning ? '#d98a8a' : '#c9c2b6');
            mat.color.lerp(target, 1 - Math.exp(-6 * dt));
        }
    });
    return (
        <group ref={group} position={[side * WALL_X, 0, 0]}>
            <mesh ref={box} position={[0, 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[1, 1, NAVE_DEPTH]} />
                <meshStandardMaterial color="#c9c2b6" roughness={0.9} />
            </mesh>
        </group>
    );
}

function FlyingButtress({ side, shown }: { side: 1 | -1; shown: boolean }) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grp.current) return;
        grp.current.scale.setScalar(damp(grp.current.scale.x, shown ? 1 : 0.001, dt, 8));
        grp.current.visible = grp.current.scale.x > 0.02;
    });
    return (
        <group ref={grp} position={[side * 3.4, 0, 0]} scale={0.001}>
            {/* strebepilar utenfor kirka */}
            <mesh position={[0, 2, 0]} castShadow>
                <boxGeometry args={[0.6, 4, 1.4]} />
                <meshStandardMaterial color="#b7b0a3" roughness={0.9} />
            </mesh>
            {/* strebebue: skråbjelke opp mot murtoppen */}
            <mesh position={[-side * 0.75, 4.3, 0]} rotation={[0, 0, side * 0.7]} castShadow>
                <boxGeometry args={[2.0, 0.4, 1]} />
                <meshStandardMaterial color="#b7b0a3" roughness={0.9} />
            </mesh>
        </group>
    );
}

function Vault({ stage }: { stage: number }) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grp.current) return;
        const target = stage >= 2 ? 1 : 0.001;
        grp.current.scale.setScalar(damp(grp.current.scale.x, target, dt, 6));
        grp.current.visible = grp.current.scale.x > 0.02;
    });
    // spisst hvelv: to skråflater som møtes i en topp
    return (
        <group ref={grp} position={[0, 6, 0]} scale={0.001}>
            <mesh position={[-1, 1.15, 0]} rotation={[0, 0, 0.7]} castShadow>
                <boxGeometry args={[0.35, 2.9, NAVE_DEPTH]} />
                <meshStandardMaterial color="#a878d6" roughness={0.7} />
            </mesh>
            <mesh position={[1, 1.15, 0]} rotation={[0, 0, -0.7]} castShadow>
                <boxGeometry args={[0.35, 2.9, NAVE_DEPTH]} />
                <meshStandardMaterial color="#a878d6" roughness={0.7} />
            </mesh>
        </group>
    );
}

// Bakvegg med glassrosen. Rosen vender framover (+Z) mot kameraet og lyser
// nedover kirkeskipet når den settes inn.
function BackWall({ stage, rose }: { stage: number; rose: boolean }) {
    const wall = useRef<THREE.Mesh>(null);
    const win = useRef<THREE.Mesh>(null);
    const glow = useRef<THREE.PointLight>(null);
    useFrame((_, dt) => {
        const h = stage >= 1 ? 6.6 : 3.6;
        if (wall.current) {
            wall.current.scale.y = damp(wall.current.scale.y, h, dt, 6);
            wall.current.position.y = damp(wall.current.position.y, h / 2, dt, 6);
        }
        if (win.current) {
            const mat = win.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = damp(mat.emissiveIntensity, rose ? 2.6 : 0, dt, 4);
            const s = damp(win.current.scale.x, rose ? 1 : 0.001, dt, 6);
            win.current.scale.set(s, s, 1);
            win.current.visible = s > 0.02;
        }
        if (glow.current) {
            glow.current.intensity = damp(glow.current.intensity, rose ? 4 : 0, dt, 4);
        }
    });
    return (
        <group position={[0, 0, -NAVE_DEPTH / 2]}>
            <mesh ref={wall} position={[0, 1.8, 0]} castShadow receiveShadow>
                <boxGeometry args={[4.8, 1, 0.5]} />
                <meshStandardMaterial color="#c9c2b6" roughness={0.9} />
            </mesh>
            {/* glassrosen vender framover mot kameraet */}
            <mesh ref={win} position={[0, 4.4, 0.3]} scale={0.001}>
                <circleGeometry args={[1.25, 40]} />
                <meshStandardMaterial
                    color="#f6c945"
                    emissive="#f6c945"
                    emissiveIntensity={0}
                    roughness={0.4}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <pointLight ref={glow} position={[0, 4.4, 2.5]} color="#ffe6a3" intensity={0} distance={18} />
        </group>
    );
}

function CathedralScene({
    stage,
    leftBut,
    rightBut,
    rose,
    onRaise,
    onVault,
    onButtress,
    onRose,
    burst,
}: SceneProps) {
    const both = leftBut && rightBut;
    return (
        <group>
            <GroundPlane size={30} depth={26} color="#8fa96a" />

            <Wall side={-1} stage={stage} supported={leftBut} />
            <Wall side={1} stage={stage} supported={rightBut} />
            <Vault stage={stage} />
            <BackWall stage={stage} rose={rose} />

            <FlyingButtress side={-1} shown={leftBut} />
            <FlyingButtress side={1} shown={rightBut} />

            {/* Steg 0 -> 1: reis murene med spissbuer */}
            {stage === 0 && (
                <Hotspot position={[0, 3.6, 1]} onSelect={onRaise} label="Reis murene med spissbuer" />
            )}
            {/* Steg 1 -> 2: legg ribbehvelvet */}
            {stage === 1 && (
                <Hotspot position={[0, 6.8, 1]} onSelect={onVault} label="Legg ribbehvelvet" />
            )}
            {/* Steg 2: fang opp presset med strebebuer (én på hver side) */}
            {stage >= 2 && !leftBut && (
                <Hotspot position={[-3.4, 4.2, 1.4]} onSelect={() => onButtress('left')} label="Sett strebebue" color="#f87171" />
            )}
            {stage >= 2 && !rightBut && (
                <Hotspot position={[3.4, 4.2, 1.4]} onSelect={() => onButtress('right')} label="Sett strebebue" color="#f87171" />
            )}
            {/* Steg 3: sett inn glassrosen (i bakveggen) */}
            {stage >= 2 && both && !rose && (
                <Hotspot position={[0, 4.4, -NAVE_DEPTH / 2 + 0.6]} onSelect={onRose} label="Sett inn glassrosen" color="#f6c945" />
            )}

            <Burst position={[0, 4.4, -NAVE_DEPTH / 2 + 0.4]} trigger={burst} color="#f6c945" />
        </group>
    );
}

const Katedralhvelvet3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState(0);
    const [leftBut, setLeftBut] = useState(false);
    const [rightBut, setRightBut] = useState(false);
    const [rose, setRose] = useState(false);
    const [won, setWon] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const doneRef = useRef(false);

    const both = leftBut && rightBut;
    const danger = stage >= 2 && !both;

    const reset = () => {
        setStage(0);
        setLeftBut(false);
        setRightBut(false);
        setRose(false);
        setWon(false);
        setBanner(null);
        setBurst(0);
        doneRef.current = false;
    };

    const raise = () => {
        setStage(1);
        setBanner('Murene reiser seg. Spissbuene leder tyngden rett nedover.');
        sounds.play('advance');
    };

    const vault = () => {
        setStage(2);
        setBanner('Hvelvet presser murene utover! De trenger støtte.');
        sounds.play('drop');
    };

    const buttress = (side: 'left' | 'right') => {
        if (side === 'left') setLeftBut(true);
        else setRightBut(true);
        sounds.play('pick');
        const nowBoth = side === 'left' ? rightBut : leftBut;
        if (nowBoth) {
            setBanner('Strebebuene fanger opp presset. Muren står trygt - sett inn glasset.');
            sounds.play('correct');
        } else {
            setBanner('En strebebue fanger opp presset på den ene siden. Den andre mangler.');
        }
    };

    const putRose = () => {
        setRose(true);
        setBurst((b) => b + 1);
        setBanner('Lyset strømmer inn gjennom glassrosen.');
        if (!doneRef.current) {
            doneRef.current = true;
            setWon(true);
            sounds.play('complete');
            onComplete({ score: 1, completed: true });
        }
    };

    const idle = stage === 0;

    return (
        <MicroGameScaffold
            title="Reis katedralhvelvet"
            subtitle="Bygg kirka høy og lys - men fang opp presset fra hvelvet før muren sprekker"
            estimatedSeconds={150}
            onRetry={stage > 0 ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#cdd9ec] via-[#dbe4f0] to-[#eef1e6]"
            canvas={{
                idle,
                autoRotateSpeed: 0.3,
                camera: { position: [2.5, 6.5, 15], fov: 42 },
                background: '#c8d6ea',
                target: [0, 3.6, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {stage === 0 ? 'Romansk start' : rose ? 'Gotisk katedral' : 'Under bygging'}
                    </SceneBadge>
                    <DragHint show={idle}>Trykk det lysende punktet for å reise murene</DragHint>
                    <DangerVignette level={danger ? 0.7 : 0} />
                </>
            }
            scene={
                <CathedralScene
                    stage={stage}
                    leftBut={leftBut}
                    rightBut={rightBut}
                    rose={rose}
                    onRaise={raise}
                    onVault={vault}
                    onButtress={buttress}
                    onRose={putRose}
                    burst={burst}
                />
            }
        >
            {won ? (
                <WinScreen title="Katedralen står - høy og full av lys!" onReplay={reset}>
                    Spissbuen og ribbehvelvet samlet tyngden, og strebebuene fanget opp presset som
                    ellers hadde skjøvet murene fra hverandre. Derfor kunne muren bli tynn og høy, og
                    lyset strømmer inn gjennom den store glassrosen. Det er hele hemmeligheten bak den
                    gotiske katedralen.
                </WinScreen>
            ) : (
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                        <ArrowUp className={`w-4 h-4 ${stage >= 1 ? 'text-emerald-500' : 'text-slate-300'}`} />
                        Reis murene
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Layers className={`w-4 h-4 ${stage >= 2 ? 'text-emerald-500' : 'text-slate-300'}`} />
                        Legg hvelvet
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className={`font-bold ${both ? 'text-emerald-500' : 'text-slate-300'}`}>
                            {(leftBut ? 1 : 0) + (rightBut ? 1 : 0)}/2
                        </span>
                        Strebebuer
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Sun className={`w-4 h-4 ${rose ? 'text-emerald-500' : 'text-slate-300'}`} />
                        Glassrosen
                    </span>
                </div>
            )}
        </MicroGameScaffold>
    );
};

export default Katedralhvelvet3D;
