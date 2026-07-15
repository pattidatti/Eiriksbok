import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    Banner,
    Person,
    GroundPlane,
    Burst,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    THEMES,
    ToonMaterial,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Lyspære: mange små, selvstendige stater ble fysisk føyd sammen til ÉN nasjon.
// Eleven drar de tyske statene inn på kartbordet, og når den siste låser seg på
// plass, reiser keiserflagget seg - Tyskland er samlet (1871). Selve grepet -
// spredte biter som blir én form - ER poenget: nasjonssamling gjort håndgripelig.

const T = THEMES.enlightenment ?? THEMES.industrial;

interface StateDef {
    id: string;
    name: string;
    color: string;
    size: [number, number, number];
    slot: [number, number]; // xz på kartbordet
    start: [number, number]; // spredt startpunkt
}

// Fem tyske stater. `slot` danner en grov klynge = det samlede riket.
const STATES: StateDef[] = [
    { id: 'preussen', name: 'Preussen', color: '#3f5b7a', size: [2.4, 0.5, 1.7], slot: [1.4, -0.6], start: [-6.5, 3.2] },
    { id: 'bayern', name: 'Bayern', color: '#5a8f6b', size: [1.8, 0.5, 1.5], slot: [0.4, 2.1], start: [6.4, 3.2] },
    { id: 'sachsen', name: 'Sachsen', color: '#a9762f', size: [1.4, 0.5, 1.2], slot: [2.4, 1.0], start: [6.6, -3.0] },
    { id: 'hannover', name: 'Hannover', color: '#8a5a7a', size: [1.6, 0.5, 1.3], slot: [-1.1, -1.4], start: [-6.6, -3.0] },
    { id: 'baden', name: 'Baden', color: '#a3492f', size: [1.3, 0.5, 1.2], slot: [-1.4, 1.6], start: [0, 5.4] },
];

// Ett stat-blokk med tegneserie-materiale og en liten fane.
function StateBlock({ def }: { def: StateDef }) {
    const [w, h, d] = def.size;
    return (
        <group>
            <mesh position={[0, h / 2, 0]} castShadow>
                <boxGeometry args={[w, h, d]} />
                <ToonMaterial color={def.color} />
            </mesh>
            <mesh position={[0, h + 0.35, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
                <meshStandardMaterial color="#4a3520" />
            </mesh>
            <mesh position={[0.22, h + 0.55, 0]}>
                <planeGeometry args={[0.42, 0.3]} />
                <meshStandardMaterial color={def.color} side={THREE.DoubleSide} />
            </mesh>
            {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[w + 0.8, 1.6, d + 0.8]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
        </group>
    );
}

// Faint markør der en stat skal ligge - forsvinner når den er plassert.
function SlotGhost({ def, hidden }: { def: StateDef; hidden: boolean }) {
    const [w, , d] = def.size;
    if (hidden) return null;
    return (
        <mesh position={[def.slot[0], 0.06, def.slot[1]]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w + 0.3, d + 0.3]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.24} />
        </mesh>
    );
}

// Keiserflagget som reiser seg når riket er samlet.
function RisingFlag({ active }: { active: boolean }) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grp.current) return;
        grp.current.position.y = damp(grp.current.position.y, active ? 0 : -3, dt, 3);
        const s = damp(grp.current.scale.x, active ? 1 : 0.001, dt, 3);
        grp.current.scale.set(s, s, s);
    });
    return (
        <group ref={grp} position={[0.5, -3, 0.3]} scale={0.001}>
            <Banner position={[0, 0, 0]} color={T.accent} height={3.2} />
        </group>
    );
}

// Selve 3D-verdenen: kartbord, stat-blokker (dra) og det reisende flagget.
function Scene({
    placed,
    onPlace,
    burst,
    won,
}: {
    placed: Record<string, boolean>;
    onPlace: (def: StateDef) => void;
    burst: number;
    won: boolean;
}) {
    return (
        <group>
            <GroundPlane size={40} depth={30} color={T.ground} />
            {/* Kartbord */}
            <mesh position={[0.3, 0.02, 0.3]} receiveShadow>
                <boxGeometry args={[9, 0.2, 8]} />
                <meshStandardMaterial color={T.stone} roughness={0.95} />
            </mesh>

            {/* Målruter */}
            {STATES.map((s) => (
                <SlotGhost key={`g-${s.id}`} def={s} hidden={!!placed[s.id]} />
            ))}

            {/* Stat-blokker: låst på plass eller fri å dra */}
            {STATES.map((s) =>
                placed[s.id] ? (
                    <group key={`p-${s.id}`} position={[s.slot[0], 0.12, s.slot[1]]}>
                        <StateBlock def={s} />
                    </group>
                ) : (
                    <Draggable
                        key={`d-${s.id}`}
                        position={[s.start[0], 0.12, s.start[1]]}
                        planeY={0.12}
                        bounds={{ minX: -8, maxX: 8, minZ: -6, maxZ: 6 }}
                        snapPoints={[s.slot]}
                        snapRadius={2.4}
                        dropFx="dustPuff"
                        onSnap={() => onPlace(s)}
                    >
                        <StateBlock def={s} />
                    </Draggable>
                )
            )}

            {/* Bismarck ser på fra kanten */}
            <Person position={[5.4, 0, 4.2]} rotation={[0, -2.4, 0]} body="#2b2b33" hat="none" pose="idle" />

            <RisingFlag active={won} />
            <Burst position={[0.5, 1.4, 0.3]} trigger={burst} />
        </group>
    );
}

export default function SmiDetTyskeRiket3D({ onComplete, onRetry }: MicroGameProps) {
    const { play } = useStepSounds();
    const [placed, setPlaced] = useState<Record<string, boolean>>({});
    const [burst, setBurst] = useState(0);
    const [won, setWon] = useState(false);

    const count = Object.keys(placed).length;
    const total = STATES.length;

    const banner = useMemo(() => {
        if (won) return 'Tyskland er samlet - keiserriket er født (1871)!';
        if (count === 0) return 'Dra de spredte tyske statene inn på kartbordet.';
        const left = total - count;
        return `Godt! ${left} stat${left === 1 ? '' : 'er'} igjen å samle.`;
    }, [won, count, total]);

    const place = (def: StateDef) => {
        if (placed[def.id]) return;
        const next = { ...placed, [def.id]: true };
        setPlaced(next);
        setBurst((b) => b + 1);
        if (Object.keys(next).length === total) {
            setWon(true);
            play('complete');
            onComplete({ score: 1, completed: true, artifact: { nation: 'tyskland' } });
        } else {
            play('correct');
        }
    };

    const reset = () => {
        setPlaced({});
        setBurst(0);
        setWon(false);
        onRetry?.();
    };

    return (
        <MicroGameScaffold
            title="Smi det tyske riket"
            subtitle="Dra de tyske statene sammen til ett keiserrike (1815 til 1871)."
            estimatedSeconds={140}
            onRetry={reset}
            scene={<Scene placed={placed} onPlace={place} burst={burst} won={won} />}
            canvas={{
                idle: count === 0 && !won,
                camera: { position: [0, 9.5, 9.5], fov: 42 },
                background: T.sky,
                fog: { color: T.fog, near: 24, far: 52 },
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout corner="bl" items={[{ label: 'Stater samlet', value: `${count}/${total}` }]} />
                    <SceneBadge corner="br">1815 → 1871</SceneBadge>
                </>
            }
        >
            {won ? (
                <WinScreen title="Ett rike av mange stater!" onReplay={reset}>
                    Slik ble Tyskland til: Bismarck føyde dusinvis av stater sammen til ett
                    keiserrike. Én nasjon, smidd av mange biter - akkurat som du nettopp gjorde.
                </WinScreen>
            ) : (
                <p className="text-sm text-slate-600">
                    På midten av 1800-tallet var «Tyskland» dusinvis av småstater. Dra hver stat inn
                    på sin lyse rute på kartet. Når den siste låser seg, reiser flagget seg.
                </p>
            )}
        </MicroGameScaffold>
    );
}
