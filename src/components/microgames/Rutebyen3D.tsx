import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    Hotspot,
    WaterPlane,
    Person,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    DataReadout,
    StepTracker,
    Burst,
    THEMES,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om Indusdalen (Mohenjo-daro).
// Lyspære: Mohenjo-daro var en av verdens første PLANLAGTE byer. Gatene gikk
// rett nord-sør og øst-vest som et sjakkbrett, husene var bygd i samme stil, og
// under hver gate løp et lukket avløpssystem. Eleven kjenner dette på kroppen
// i tre steg: først dra de skjeve husene inn på rutenettet så rette gater
// vokser fram, så legg de lukkede avløpene under gatene, og reis til slutt Det
// store badet i sentrum. Mekanikken ER poenget: orden kom fra plan, ikke tilfeldighet.

const T = THEMES.egypt;
const HOUSE_TOTAL = 5;
const DRAIN_TOTAL = 4;

// Rutenettet: hver husplass har sin egen rute, så to draggables aldri
// kjemper om samme felt. Sentrum (0,0) er reservert for Det store badet.
const SLOTS: [number, number][] = [
    [-3.5, -3.5],
    [0, -3.5],
    [3.5, -3.5],
    [-3.5, 0],
    [3.5, 0],
];

// Husene starter skjeve og spredt foran i bildet (uplanlagt klynge).
const START: { pos: [number, number]; angle: number }[] = [
    { pos: [-5.4, 5.6], angle: 0.7 },
    { pos: [-2.4, 6.4], angle: -0.5 },
    { pos: [0.6, 6.8], angle: 0.9 },
    { pos: [3.4, 6.2], angle: -0.8 },
    { pos: [5.6, 5.4], angle: 0.4 },
];

// Husfarger i brent leire (Mohenjo-daro var bygd av like, brente murstein).
const HOUSE_COLORS = ['#b5734a', '#c08152', '#a9683f', '#bd7b4d', '#b06e44'];

// De fire avløpsstrekkene under gatene. Hvert strekk er enten vannrett (langs x)
// eller loddrett (langs z). Hotspoten ligger midt på strekket.
type Drain = {
    x: number;
    z: number;
    len: number;
    dir: 'x' | 'z';
    hotspot: [number, number];
};
const DRAINS: Drain[] = [
    { x: 0, z: -1.75, len: 9, dir: 'x', hotspot: [0, -1.75] }, // gate mellom rad 1 og 2
    { x: 0, z: 1.75, len: 9, dir: 'x', hotspot: [0, 1.75] }, // gate foran sentrum
    { x: 1.75, z: -0.9, len: 5.7, dir: 'z', hotspot: [1.75, -0.9] }, // tverrgate
    { x: 0, z: -6, len: 8, dir: 'z', hotspot: [0, -6] }, // hovedavløp ut til elva
];

const Rutebyen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [placed, setPlaced] = useState<boolean[]>(() => Array(HOUSE_TOTAL).fill(false));
    const [drained, setDrained] = useState<boolean[]>(() => Array(DRAIN_TOTAL).fill(false));
    const [bath, setBath] = useState(false);
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra et skjevt hus inn på en lysende rute i rutenettet.'
    );

    const placedCount = placed.filter(Boolean).length;
    const drainCount = drained.filter(Boolean).length;
    const gridDone = placedCount >= HOUSE_TOTAL;
    const drainsDone = drainCount >= DRAIN_TOTAL;
    const done = bath;

    // Hvilket steg er vi på (1-3) for stegmåleren.
    const step = !gridDone ? 1 : !drainsDone ? 2 : 3;

    const placeHouse = (i: number) => {
        setPlaced((prev) => {
            if (prev[i]) return prev;
            const next = prev.slice();
            next[i] = true;
            const n = next.filter(Boolean).length;
            setBurst((b) => b + 1);
            if (n >= HOUSE_TOTAL) {
                sounds.play('advance');
                setBanner('Rette gater! Nå legger vi det lukkede avløpet under hver gate.');
            } else {
                sounds.play('correct');
                setBanner('Bra. Husene får samme stil og retning. Sett neste hus på plass.');
            }
            return next;
        });
    };

    const layDrain = (i: number) => {
        setDrained((prev) => {
            if (prev[i] || !gridDone) return prev;
            const next = prev.slice();
            next[i] = true;
            const n = next.filter(Boolean).length;
            if (n >= DRAIN_TOTAL) {
                sounds.play('advance');
                setBanner('Rent vann renner ut til elva. Reis nå Det store badet i sentrum.');
            } else {
                sounds.play('correct');
                setBanner('Avløpet er dekket til. Skittent vann renner trygt vekk.');
            }
            return next;
        });
    };

    const buildBath = () => {
        if (!drainsDone || bath) return;
        setBath(true);
        setBurst((b) => b + 1);
        sounds.play('complete');
        setBanner(null);
        setTimeout(() => onComplete({ score: 1, completed: true }), 300);
    };

    const reset = () => {
        setPlaced(Array(HOUSE_TOTAL).fill(false));
        setDrained(Array(DRAIN_TOTAL).fill(false));
        setBath(false);
        setBanner('Dra et skjevt hus inn på en lysende rute i rutenettet.');
    };

    const idle = placedCount === 0;

    return (
        <MicroGameScaffold
            title="Rutebyen: Mohenjo-daro"
            subtitle="Bygg en av verdens første planlagte byer: rette gater, lukket avløp og Det store badet"
            estimatedSeconds={150}
            onRetry={placedCount > 0 || drainCount > 0 || bath ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 10, 13], fov: 42 },
                background: T.sky,
                fog: { near: 26, far: 56 },
                target: [0, 0.3, -0.5],
            }}
            containerClassName="bg-gradient-to-b from-[#e9d8a6] via-[#e2cf95] to-[#cBb077]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Mohenjo-daro står' : 'Indusdalen ca. 2500 fvt.'}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Hus på rutenett', value: `${placedCount}/${HOUSE_TOTAL}` },
                            { label: 'Avløp lagt', value: `${drainCount}/${DRAIN_TOTAL}` },
                        ]}
                    />
                    <DragHint show={idle} corner="bc">
                        Dra et hus ut på rutenettet
                    </DragHint>
                </>
            }
            scene={
                <IndusCity
                    placed={placed}
                    drained={drained}
                    bath={bath}
                    gridDone={gridDone}
                    drainsDone={drainsDone}
                    burst={burst}
                    onPlace={placeHouse}
                    onDrain={layDrain}
                    onBath={buildBath}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done ? (
                    <>
                        <StepTracker current={step} total={3} />
                        <p className="text-sm text-slate-600 leading-snug">
                            Folket i Indusdalen bygde ikke byene tilfeldig. De{' '}
                            <span className="font-bold text-amber-700">planla</span> dem: rette gater
                            som et sjakkbrett, like hus, og et skjult avløp under hver gate.{' '}
                            {step === 1 && 'Dra hvert skjeve hus inn på en rute så gatene blir rette.'}
                            {step === 2 && 'Klikk de gule punktene og legg lokk over avløpet i hver gate.'}
                            {step === 3 && 'Klikk midt i byen og reis Det store badet.'}
                        </p>
                    </>
                ) : (
                    <WinScreen title="Byen som var planlagt!" onReplay={reset}>
                        Mohenjo-daro hadde rette gater, like hus av brente murstein og verdens første
                        bymessige avløpssystem, lukket under gatene. Mens andre byer vokste vilt og
                        rotete, ble denne TEGNET først og bygd etterpå. Det er derfor arkeologene blir
                        så forbløffet: for over 4000 år siden hadde indusfolket rennende vann og
                        kloakk, noe Europa ikke fikk igjen for mye, mye senere.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function IndusCity({
    placed,
    drained,
    bath,
    gridDone,
    drainsDone,
    burst,
    onPlace,
    onDrain,
    onBath,
}: {
    placed: boolean[];
    drained: boolean[];
    bath: boolean;
    gridDone: boolean;
    drainsDone: boolean;
    burst: number;
    onPlace: (i: number) => void;
    onDrain: (i: number) => void;
    onBath: () => void;
}) {
    return (
        <group>
            {/* Den tørre sletta av brent leire */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                <planeGeometry args={[46, 40]} />
                <meshStandardMaterial color="#cBa878" roughness={1} />
            </mesh>

            {/* Elva Indus i bakkant - avløpet renner ut hit */}
            <WaterPlane position={[0, 0.0, -12.5]} size={[46, 8]} color={T.water} />

            {/* Rutenettet: svake rette gatelinjer (planen ligger der fra start) */}
            <GridLines bright={gridDone} />

            {/* Tomme husruter: en pulsende ring viser hvor neste hus skal */}
            {SLOTS.map((s, i) =>
                placed[i] ? null : <SlotMarker key={i} position={[s[0], 0.06, s[1]]} />
            )}

            {/* Avlopsstrekkene under gatene */}
            {DRAINS.map((d, i) => (
                <DrainSegment key={i} drain={d} laid={drained[i]} />
            ))}

            {/* Steg 2: klikkpunkter for å legge lokk over avløpet */}
            {gridDone &&
                !drainsDone &&
                DRAINS.map((d, i) =>
                    drained[i] ? null : (
                        <Hotspot
                            key={i}
                            position={[d.hotspot[0], 0.5, d.hotspot[1]]}
                            radius={0.55}
                            label="Legg lokk"
                            onSelect={() => onDrain(i)}
                        />
                    )
                )}

            {/* Husene eleven drar inn på rutenettet. Hvert hus har sin egen rute. */}
            {START.map((s, i) => (
                <Draggable
                    key={i}
                    position={[s.pos[0], 0, s.pos[1]]}
                    snapPoints={[SLOTS[i]]}
                    snapRadius={2.6}
                    liftY={0.6}
                    dropFx="dustPuff"
                    onSnap={() => onPlace(i)}
                >
                    {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh position={[0, 0.7, 0]}>
                        <boxGeometry args={[2.6, 1.8, 2.6]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <IndusHouse
                        placed={placed[i]}
                        crooked={s.angle}
                        color={HOUSE_COLORS[i]}
                    />
                </Draggable>
            ))}

            {/* Det store badet i sentrum (steg 3) */}
            <GreatBath
                built={bath}
                clickable={drainsDone && !bath}
                onBuild={onBath}
            />

            {/* Folk fyller byen når den står ferdig */}
            {bath && (
                <group>
                    <Person position={[-1.6, 0, 2.4]} body="#7a4a2c" skin="#caa074" pose="walk" />
                    <Person position={[1.8, 0, 2.0]} body="#5c5a3a" skin="#d8b083" pose="idle" />
                    <Person position={[2.6, 0, -2.2]} body="#6e3f2c" skin="#c79468" pose="walk" />
                    <Person position={[-2.8, 0, -1.4]} body="#8a6d3a" skin="#d2a878" pose="idle" />
                </group>
            )}

            {/* Feiringspartikler */}
            <Burst position={[0, 1.6, 0]} trigger={burst} color="#e3b23c" count={22} spread={2.6} />
        </group>
    );
}

// Et hus i Mohenjo-daro: en flat-takt boks av brent leire med lav brystning og
// smale vindusspalter. Starter skjevt og retter seg opp når det settes på ruta.
function IndusHouse({
    placed,
    crooked,
    color,
}: {
    placed: boolean;
    crooked: number;
    color: string;
}) {
    const inner = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!inner.current) return;
        const targetRot = placed ? 0 : crooked;
        inner.current.rotation.y = damp(inner.current.rotation.y, targetRot, dt, 6);
        // Husene løftes litt opp i full høyde når de er på plass.
        const targetScale = placed ? 1 : 0.92;
        const s = damp(inner.current.scale.y, targetScale, dt, 6);
        inner.current.scale.y = s;
    });
    return (
        <group ref={inner} rotation={[0, crooked, 0]}>
            {/* underetasje */}
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.7, 1.1, 1.7]} />
                <meshStandardMaterial color={color} roughness={0.95} />
            </mesh>
            {/* overetasje (litt mindre) */}
            <mesh position={[0, 1.45, 0]} castShadow>
                <boxGeometry args={[1.4, 0.7, 1.4]} />
                <meshStandardMaterial color={color} roughness={0.95} />
            </mesh>
            {/* flatt tak med brystning */}
            <mesh position={[0, 1.85, 0]} castShadow>
                <boxGeometry args={[1.5, 0.12, 1.5]} />
                <meshStandardMaterial color="#9a6238" roughness={1} />
            </mesh>
            {/* smale vindusspalter */}
            <mesh position={[0, 0.7, 0.86]}>
                <boxGeometry args={[0.9, 0.16, 0.04]} />
                <meshStandardMaterial color="#3a2417" roughness={1} />
            </mesh>
            {/* døråpning */}
            <mesh position={[0, 0.3, 0.86]}>
                <boxGeometry args={[0.34, 0.6, 0.05]} />
                <meshStandardMaterial color="#2c1a10" roughness={1} />
            </mesh>
        </group>
    );
}

// Et avløpsstrekk under en gate. Før det legges: en åpen, mørk renne.
// Etter: et brent mursteinslokk med rent vann som glimter i kantene.
function DrainSegment({ drain, laid }: { drain: Drain; laid: boolean }) {
    const water = useRef<THREE.MeshStandardMaterial>(null);
    const lid = useRef<THREE.Group>(null);
    useFrame(({ clock }, dt) => {
        if (water.current) {
            water.current.emissiveIntensity = 0.3 + Math.sin(clock.getElapsedTime() * 3) * 0.12;
        }
        if (lid.current) {
            const target = laid ? 1 : 0;
            lid.current.scale.y = damp(lid.current.scale.y, target, dt, 7);
        }
    });
    const sizeX = drain.dir === 'x' ? drain.len : 0.7;
    const sizeZ = drain.dir === 'z' ? drain.len : 0.7;
    return (
        <group position={[drain.x, 0, drain.z]}>
            {/* åpen renne (alltid synlig under) */}
            <mesh position={[0, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[sizeX, sizeZ]} />
                <meshStandardMaterial color="#4a3525" roughness={1} />
            </mesh>
            {/* rennende vann i renna */}
            <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[sizeX * 0.5, sizeZ * 0.5]} />
                <meshStandardMaterial
                    ref={water}
                    color={T.water}
                    emissive="#2f7fa0"
                    emissiveIntensity={0.3}
                    roughness={0.3}
                />
            </mesh>
            {/* mursteinslokk som senkes på plass */}
            <group ref={lid} scale={[1, laid ? 1 : 0, 1]}>
                <mesh position={[0, 0.1, 0]} castShadow>
                    <boxGeometry args={[sizeX, 0.18, sizeZ]} />
                    <meshStandardMaterial color="#a9683f" roughness={0.95} />
                </mesh>
            </group>
        </group>
    );
}

// Det store badet (the Great Bath): et vanntett, nedsenket basseng med trapp,
// Mohenjo-daros mest kjente byggverk. Reiser seg og fylles når byen er ferdig.
function GreatBath({
    built,
    clickable,
    onBuild,
}: {
    built: boolean;
    clickable: boolean;
    onBuild: () => void;
}) {
    const pool = useRef<THREE.Group>(null);
    const fill = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        if (pool.current) {
            const target = built ? 1 : 0.001;
            const s = damp(pool.current.scale.y, target, dt, 5);
            pool.current.scale.y = s;
        }
        if (fill.current) {
            const t = built ? 0.5 : 0;
            fill.current.scale.y = damp(fill.current.scale.y, t, dt, 3);
        }
    });
    return (
        <group position={[0, 0, 0]}>
            {/* hellelagt torg rundt badet */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[3.2, 3.2]} />
                <meshStandardMaterial color="#c79a64" roughness={1} />
            </mesh>

            {clickable && (
                <Hotspot position={[0, 1.2, 0]} radius={0.7} label="Reis Det store badet" onSelect={onBuild} />
            )}

            {/* selve bassengkarmen som reiser seg */}
            <group ref={pool} scale={[1, 0.001, 1]}>
                <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                    <boxGeometry args={[2.4, 0.8, 2.0]} />
                    <meshStandardMaterial color="#b07b48" roughness={0.95} />
                </mesh>
                {/* den nedsenkte vanntette gropa */}
                <mesh position={[0, 0.55, 0]}>
                    <boxGeometry args={[1.8, 0.6, 1.4]} />
                    <meshStandardMaterial color="#5a3d27" roughness={1} />
                </mesh>
                {/* vannet som fyller badet */}
                <mesh ref={fill} position={[0, 0.5, 0]} scale={[1, 0, 1]}>
                    <boxGeometry args={[1.7, 0.6, 1.3]} />
                    <meshStandardMaterial
                        color={T.water}
                        emissive="#2f7fa0"
                        emissiveIntensity={0.3}
                        roughness={0.25}
                        metalness={0.1}
                    />
                </mesh>
            </group>
        </group>
    );
}

// Svake, rette gatelinjer som danner rutenettet. Lyser sterkere når byen står.
function GridLines({ bright }: { bright: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.children.forEach((c) => {
            const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (m) m.opacity = damp(m.opacity, bright ? 0.85 : 0.32, dt, 4);
        });
    });
    const lines: { x: number; z: number; len: number; dir: 'x' | 'z' }[] = [
        { x: 0, z: -1.75, len: 11, dir: 'x' },
        { x: 0, z: 1.75, len: 11, dir: 'x' },
        { x: -1.75, z: -1.5, len: 9, dir: 'z' },
        { x: 1.75, z: -1.5, len: 9, dir: 'z' },
    ];
    return (
        <group ref={ref}>
            {lines.map((l, i) => (
                <mesh
                    key={i}
                    position={[l.x, 0.015, l.z]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    receiveShadow
                >
                    <planeGeometry
                        args={[l.dir === 'x' ? l.len : 0.5, l.dir === 'z' ? l.len : 0.5]}
                    />
                    <meshStandardMaterial color="#e9d6a8" transparent opacity={0.32} roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// Pulsende ring som markerer en tom husrute.
function SlotMarker({ position }: { position: [number, number, number] }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        ref.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 3) * 0.12);
    });
    return (
        <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.95, 0.1, 10, 28]} />
            <meshStandardMaterial
                color="#f2c14e"
                emissive="#e3b23c"
                emissiveIntensity={0.6}
                roughness={0.4}
            />
        </mesh>
    );
}

export default Rutebyen3D;
