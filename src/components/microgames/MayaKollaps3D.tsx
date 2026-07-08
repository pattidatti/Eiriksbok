import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RotateCcw } from 'lucide-react';
import {
    MicroGameScaffold,
    SceneSlider,
    Hotspot,
    Tree,
    Person,
    damp,
    THEMES,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    DragHint,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mayaenes kollaps: en tørke som tømmer en jungel-by. Mayabyene i lavlandet
// hadde ingen elver - de samlet regnvann i store magasin. Eleven drar en
// "tørkeår"-spak fra 0 til 8. For hvert år som går uten regn: vannmagasinet
// synker, maisåkrene brunes, folk forlater byen, og jungelen vokser tilbake
// over pyramiden. Lyspæra kommer i hendene: når regnet stanser i en by uten
// elver, renner det lagrede vannet ut, maten svikter, og hele byen må
// forlates. Jungelen sluker den.

const MAX_YEARS = 8;
const T = THEMES.mesoamerican;

const GREEN = new THREE.Color('#4f8a3a');
const BROWN = new THREE.Color('#9c7d46');
const WATER_FULL = new THREE.Color(T.water);
const WATER_DRY = new THREE.Color('#7a6a3c');

const MayaKollaps3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [years, setYears] = useState(0);
    const [done, setDone] = useState(false);
    const [fact, setFact] = useState<string | null>(null);

    const drought = years / MAX_YEARS; // 0 = frodig by, 1 = forlatt ruin

    const setYearsSafe = (v: number) => {
        setYears(v);
        if (v > years) sounds.play('sceneChange');
        if (v >= MAX_YEARS && !done) {
            setDone(true);
            sounds.play('complete');
            onComplete({ score: 1, completed: true, artifact: { droughtYears: MAX_YEARS } });
        }
    };

    const reset = () => {
        setYears(0);
        setDone(false);
        setFact(null);
    };

    const banner =
        fact ??
        (done
            ? 'Byen er forlatt. Jungelen har tatt tilbake pyramiden.'
            : years === 0
              ? 'Dra spaken for å la tørkeårene gå - og se hva som skjer med byen.'
              : years <= 2
                ? 'Regnet uteblir. Vannmagasinet begynner å synke.'
                : years <= 5
                  ? 'Åkrene visner, og folk begynner å forlate byen.'
                  : 'Nesten ingen igjen. Jungelen vokser over torget.');

    const era = done ? 'Forlatt ruin' : years === 0 ? 'Blomstrende by' : `Tørkeår ${years} av ${MAX_YEARS}`;

    return (
        <MicroGameScaffold
            title="Mayaenes kollaps: byen og tørken"
            subtitle="Dra tørkeår-spaken og se en jungel-by bli forlatt"
            estimatedSeconds={150}
            onRetry={years > 0 ? reset : undefined}
            canvas={{
                idle: years === 0,
                camera: { position: [0, 9, 15], fov: 40 },
                background: T.sky,
                fog: { color: T.fog, near: 32, far: 62 },
                target: [0, 1, 0],
                light: 'noon',
            }}
            containerClassName="bg-gradient-to-b from-[#dbe6cf] via-[#e3ecd8] to-[#cbbf99]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Vann i magasinet', value: `${Math.round((1 - drought) * 100)} %` },
                            { label: 'Folk igjen', value: `${Math.round((1 - drought) * 100)} %` },
                        ]}
                    />
                    <SceneBadge corner="br">{era}</SceneBadge>
                    <DragHint show={years === 0} corner="bc">
                        Dra spaken under - eller klikk et lyspunkt i byen
                    </DragHint>
                </>
            }
            scene={<MayaCity drought={drought} onInspect={setFact} />}
        >
            {done ? (
                <WinScreen title="Byen er tom. Jungelen har tatt over." onReplay={reset}>
                    Mayabyene i lavlandet hadde ingen elver. De levde av regnvann samlet i store
                    magasin. Da en lang tørke kom, rant det lagrede vannet ut, maisåkrene sviktet, og
                    folk måtte forlate byene sine. Men husk: tørken velter sjelden et samfunn alene.
                    Den ble dødelig fordi byene allerede var strukket til bristepunktet av for mange
                    mennesker og evig krig.
                </WinScreen>
            ) : (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                        <SceneSlider
                            label="Tørkeår uten regn"
                            min={0}
                            max={MAX_YEARS}
                            value={years}
                            onChange={setYearsSafe}
                            valueLabel={(v) => `${v} / ${MAX_YEARS}`}
                        />
                    </div>
                    {years > 0 && (
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
//  3D-SCENEN - jungel-byen: pyramide, vannmagasin, åkrer, hus.
// ============================================================

function MayaCity({ drought, onInspect }: { drought: number; onInspect: (f: string) => void }) {
    return (
        <group>
            <Ground drought={drought} />

            {/* Pyramiden i bakgrunnen - jungelen kryper over den ved tørke */}
            <Pyramid drought={drought} />
            <Hotspot
                position={[0, 4.6, -5]}
                onSelect={() =>
                    onInspect('Tempelpyramiden. Da byen ble forlatt, vokste jungelen over den.')
                }
                label="Tempelet"
            />

            {/* Vannmagasinet - synker for hvert tørkeår */}
            <Reservoir drought={drought} />
            <Hotspot
                position={[-4.5, 1, 4]}
                onSelect={() =>
                    onInspect(
                        'Vannmagasinet. Mayabyene hadde ingen elver - de samlet regnvann her.'
                    )
                }
                label="Vannmagasinet"
            />

            {/* Maisåkrene - grønne blir brune */}
            {MAIZE.map((pos, i) => (
                <MaizePatch key={i} position={pos} drought={drought} />
            ))}

            {/* Husene - folk forlater byen, husene tømmes */}
            {HUTS.map((pos, i) => (
                <Hut key={i} position={pos} drought={drought} leaveAt={0.15 + i * 0.14} />
            ))}

            {/* Folk på torget som forsvinner */}
            {PEOPLE.map((pos, i) => (
                <Villager key={i} position={pos} drought={drought} leaveAt={0.1 + i * 0.12} />
            ))}

            {/* Fast jungel rundt kanten */}
            {EDGE_TREES.map((pos, i) => (
                <Tree key={`e${i}`} position={pos} leaf={T.leaf} seed={i + 3} />
            ))}

            {/* Jungel som tar tilbake torget - vokser fram ved tørke */}
            {RECLAIM_TREES.map((pos, i) => (
                <ReclaimTree key={`r${i}`} position={pos} drought={drought} seed={i + 20} />
            ))}
        </group>
    );
}

const MAIZE: [number, number, number][] = [
    [3.4, 0, 3.6],
    [4.6, 0, 2.4],
    [5.2, 0, 4.2],
    [3.0, 0, 5.0],
];
const HUTS: [number, number, number][] = [
    [-3.4, 0, 1.2],
    [2.8, 0, 0.4],
    [-1.6, 0, 3.4],
    [1.4, 0, 3.0],
];
const PEOPLE: [number, number, number][] = [
    [-0.8, 0, 2.4],
    [0.8, 0, 1.8],
    [-2.0, 0, 0.6],
    [1.8, 0, 2.6],
    [0.2, 0, 3.2],
];
const EDGE_TREES: [number, number, number][] = [
    [-6.6, 0, -3.2],
    [-5.4, 0, -5.0],
    [6.4, 0, -3.6],
    [5.2, 0, -5.2],
    [-6.8, 0, 5.4],
    [6.8, 0, 5.0],
];
const RECLAIM_TREES: [number, number, number][] = [
    [-2.6, 0, -1.4],
    [0.4, 0, -0.6],
    [2.6, 0, -1.8],
    [-1.2, 0, 1.0],
    [1.8, 0, 0.2],
    [-3.6, 0, -2.6],
];

// Bakken: grønn jungelbunn. Selve byens torg brunes og gror igjen.
function Ground({ drought }: { drought: number }) {
    const plaza = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!plaza.current) return;
        // Torget starter lyst stein (by), brunes så og gror mosegrønt igjen.
        const stone = new THREE.Color(T.stone);
        const target = stone.clone().lerp(GREEN, drought * 0.7);
        plaza.current.color.r = damp(plaza.current.color.r, target.r, dt, 2.5);
        plaza.current.color.g = damp(plaza.current.color.g, target.g, dt, 2.5);
        plaza.current.color.b = damp(plaza.current.color.b, target.b, dt, 2.5);
    });
    return (
        <group>
            {/* Jungelbunnen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color={T.ground} roughness={1} />
            </mesh>
            {/* Byens torg */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} receiveShadow>
                <planeGeometry args={[16, 14]} />
                <meshStandardMaterial ref={plaza} color={T.stone} roughness={1} />
            </mesh>
        </group>
    );
}

// Tempelpyramiden: en trappepyramide. Får et grønt slør (jungel/mose) ved tørke.
function Pyramid({ drought }: { drought: number }) {
    const vine = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!vine.current) return;
        vine.current.opacity = damp(vine.current.opacity, drought * 0.85, dt, 2);
    });
    const tiers = [
        { w: 5.2, h: 1.1, y: 0.55 },
        { w: 4.0, h: 1.0, y: 1.6 },
        { w: 2.9, h: 0.95, y: 2.55 },
        { w: 1.9, h: 0.9, y: 3.45 },
    ];
    return (
        <group position={[0, 0, -5]}>
            {tiers.map((t, i) => (
                <group key={i}>
                    <mesh position={[0, t.y, 0]} castShadow receiveShadow>
                        <boxGeometry args={[t.w, t.h, t.w]} />
                        <meshStandardMaterial color={T.stone} roughness={1} />
                    </mesh>
                    {/* Grønt jungelslør som toner inn */}
                    <mesh position={[0, t.y, 0]}>
                        <boxGeometry args={[t.w + 0.03, t.h + 0.03, t.w + 0.03]} />
                        <meshStandardMaterial
                            ref={i === 0 ? vine : undefined}
                            color="#3f7a34"
                            transparent
                            opacity={0}
                            roughness={1}
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            ))}
            {/* Tempelrommet på toppen */}
            <mesh position={[0, 4.3, 0]} castShadow>
                <boxGeometry args={[1.4, 0.9, 1.4]} />
                <meshStandardMaterial color={T.accent} roughness={0.9} />
            </mesh>
            {/* Trappen opp forsiden */}
            <mesh position={[0, 1.9, 2.65]} rotation={[-0.5, 0, 0]} castShadow>
                <boxGeometry args={[1.2, 4.6, 0.3]} />
                <meshStandardMaterial color="#b7ab88" roughness={1} />
            </mesh>
        </group>
    );
}

// Vannmagasinet: en firkantet dam. Vannflaten synker og blir gjørmete ved tørke.
function Reservoir({ drought }: { drought: number }) {
    const water = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (water.current) {
            const level = 1 - drought; // 1 full, 0 tørr
            water.current.scale.y = damp(water.current.scale.y, Math.max(0.04, level), dt, 2);
            water.current.position.y = damp(water.current.position.y, -0.35 + level * 0.35, dt, 2);
        }
        if (mat.current) {
            const target = WATER_FULL.clone().lerp(WATER_DRY, drought);
            mat.current.color.r = damp(mat.current.color.r, target.r, dt, 2);
            mat.current.color.g = damp(mat.current.color.g, target.g, dt, 2);
            mat.current.color.b = damp(mat.current.color.b, target.b, dt, 2);
        }
    });
    return (
        <group position={[-4.5, 0, 4]}>
            {/* Kanten av magasinet */}
            <mesh position={[0, -0.1, 0]} receiveShadow>
                <boxGeometry args={[3.2, 0.7, 2.6]} />
                <meshStandardMaterial color="#8a7d5a" roughness={1} />
            </mesh>
            {/* Vannet */}
            <group ref={water} position={[0, 0, 0]}>
                <mesh position={[0, 0.05, 0]}>
                    <boxGeometry args={[2.7, 0.7, 2.1]} />
                    <meshStandardMaterial
                        ref={mat}
                        color={T.water}
                        roughness={0.3}
                        metalness={0.1}
                    />
                </mesh>
            </group>
        </group>
    );
}

// Maisåker: små grønne strå som brunes og faller sammen ved tørke.
function MaizePatch({
    position,
    drought,
}: {
    position: [number, number, number];
    drought: number;
}) {
    const grp = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (grp.current) {
            const h = Math.max(0.3, 1 - drought * 0.8);
            grp.current.scale.y = damp(grp.current.scale.y, h, dt, 2.5);
        }
        if (mat.current) {
            const target = GREEN.clone().lerp(BROWN, drought);
            mat.current.color.r = damp(mat.current.color.r, target.r, dt, 2.5);
            mat.current.color.g = damp(mat.current.color.g, target.g, dt, 2.5);
            mat.current.color.b = damp(mat.current.color.b, target.b, dt, 2.5);
        }
    });
    const offsets: [number, number][] = [
        [0, 0],
        [0.3, 0.2],
        [-0.25, 0.28],
        [0.15, -0.25],
    ];
    return (
        <group position={position}>
            <group ref={grp}>
                {offsets.map(([ox, oz], i) => (
                    <mesh key={i} position={[ox, 0.5, oz]} castShadow>
                        <coneGeometry args={[0.16, 1, 5]} />
                        <meshStandardMaterial
                            ref={i === 0 ? mat : undefined}
                            color="#5aa03a"
                            roughness={1}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// Hus: en enkel hytte som toner ut når familien forlater byen.
function Hut({
    position,
    drought,
    leaveAt,
}: {
    position: [number, number, number];
    drought: number;
    leaveAt: number;
}) {
    const wall = useRef<THREE.MeshStandardMaterial>(null);
    const roof = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        // Huset står, men slites ned (mørkner) og synker litt når det forlates.
        const gone = drought > leaveAt ? Math.min(1, (drought - leaveAt) / 0.3) : 0;
        if (wall.current) wall.current.opacity = damp(wall.current.opacity, 1 - gone * 0.55, dt, 2);
        if (roof.current) roof.current.opacity = damp(roof.current.opacity, 1 - gone * 0.75, dt, 2);
    });
    return (
        <group position={position}>
            <mesh position={[0, 0.35, 0]} castShadow>
                <boxGeometry args={[0.9, 0.7, 0.9]} />
                <meshStandardMaterial ref={wall} color={T.stone} transparent roughness={1} />
            </mesh>
            <mesh position={[0, 0.9, 0]} castShadow>
                <coneGeometry args={[0.75, 0.5, 4]} />
                <meshStandardMaterial ref={roof} color={T.wood} transparent roughness={1} />
            </mesh>
        </group>
    );
}

// Innbygger: går sin vei (og forsvinner) når tørken passerer et punkt.
function Villager({
    position,
    drought,
    leaveAt,
}: {
    position: [number, number, number];
    drought: number;
    leaveAt: number;
}) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grp.current) return;
        const gone = drought > leaveAt ? Math.min(1, (drought - leaveAt) / 0.25) : 0;
        // Går mot kanten og krymper bort.
        grp.current.position.x = damp(grp.current.position.x, position[0] + gone * 4, dt, 1.5);
        grp.current.position.z = damp(grp.current.position.z, position[2] + gone * 3, dt, 1.5);
        const s = 1 - gone;
        grp.current.scale.setScalar(damp(grp.current.scale.x, Math.max(0.001, s), dt, 2));
    });
    return (
        <group ref={grp} position={position}>
            <Person pose="walk" hat="cap" />
        </group>
    );
}

// Jungeltre som vokser fram over torget når byen forlates.
function ReclaimTree({
    position,
    drought,
    seed,
}: {
    position: [number, number, number];
    drought: number;
    seed: number;
}) {
    const grp = useRef<THREE.Group>(null);
    const appearAt = 0.35;
    useFrame((_, dt) => {
        if (!grp.current) return;
        const g = drought > appearAt ? Math.min(1, (drought - appearAt) / 0.55) : 0;
        grp.current.scale.setScalar(damp(grp.current.scale.x, Math.max(0.001, g), dt, 2));
    });
    return (
        <group ref={grp} position={position} scale={0.001}>
            <Tree leaf={T.leaf} seed={seed} />
        </group>
    );
}

export default MayaKollaps3D;
