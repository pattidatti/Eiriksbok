import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { PackageX } from 'lucide-react';
import {
    MicroGameScaffold,
    Draggable,
    Person,
    WaterPlane,
    Burst,
    Impact,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    DataReadout,
    WinScreen,
    useIdleMotion,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Teselskapet i Boston, 16. desember 1773.
//
// Lyspære: kolonistene nektet å betale en skatt de ikke fikk stemme om. I stedet
// for å losse teen for salg, kastet de hele lasten i havet. Eleven kjenner trassen
// på kroppen ved å dra kiste etter kiste over rekka og se dem plaske ned i Boston
// havn. Handlingen provoserte britene til å stenge havna, og et lite skritt fra
// protest til åpen krig var tatt.
//
// Scenen drives av enkel React-tilstand (dumped[]) og hvert delobjekt demper mykt.

const DECK: [number, number][] = [
    [-1.3, -0.6],
    [0, -0.9],
    [1.3, -0.6],
    [-0.7, 0.4],
    [0.7, 0.4],
];
// Målpunkter ute i havet der teen skal havne.
const SPLASH: [number, number][] = [
    [-5.5, -2],
    [0, -5.5],
    [5.5, -2],
    [-5.5, 2.5],
    [5.5, 2.5],
];

const TEA = '#5a3a1e';
const CHEST = '#7a5230';

// --- Handelsskipet: skrog, dekk, rekke og to master ---
function Merchantman() {
    const float = useIdleMotion({ bob: 0.05, sway: 0.02, speed: 0.7 });
    return (
        <group ref={float}>
            {/* skrog */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.2, 1.2, 6.4]} />
                <meshStandardMaterial color="#5b3f26" roughness={0.9} />
            </mesh>
            {/* baug (spiss front) */}
            <mesh position={[0, 0.5, -3.4]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <boxGeometry args={[2.26, 1.2, 2.26]} />
                <meshStandardMaterial color="#5b3f26" roughness={0.9} />
            </mesh>
            {/* dekk */}
            <mesh position={[0, 1.12, 0]} receiveShadow>
                <boxGeometry args={[3.0, 0.12, 6.2]} />
                <meshStandardMaterial color="#8a6a44" roughness={0.85} />
            </mesh>
            {/* rekke rundt dekket */}
            {[-1.5, 1.5].map((x) => (
                <mesh key={x} position={[x, 1.5, 0]} castShadow>
                    <boxGeometry args={[0.14, 0.7, 6.2]} />
                    <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
                </mesh>
            ))}
            {/* to master med sammenrullet seil */}
            {[-1.4, 1.6].map((z) => (
                <group key={z} position={[0, 1.2, z]}>
                    <mesh position={[0, 2.4, 0]} castShadow>
                        <cylinderGeometry args={[0.12, 0.14, 4.8, 10]} />
                        <meshStandardMaterial color="#4a3320" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 3.6, 0]}>
                        <boxGeometry args={[3.4, 0.16, 0.16]} />
                        <meshStandardMaterial color="#4a3320" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 3.3, 0.08]}>
                        <boxGeometry args={[3.0, 0.5, 0.1]} />
                        <meshStandardMaterial color="#d8cdb4" roughness={0.9} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// --- En tekiste: dras over rekka og ut i havet ---
function TeaChest() {
    return (
        <group>
            <mesh castShadow>
                <boxGeometry args={[0.8, 0.6, 0.8]} />
                <meshStandardMaterial color={CHEST} roughness={0.85} />
            </mesh>
            {/* lokk */}
            <mesh position={[0, 0.34, 0]} castShadow>
                <boxGeometry args={[0.86, 0.12, 0.86]} />
                <meshStandardMaterial color="#5f3f22" roughness={0.85} />
            </mesh>
            {/* jernbeslag */}
            {[-0.3, 0.3].map((x) => (
                <mesh key={x} position={[x, 0, 0]}>
                    <boxGeometry args={[0.06, 0.62, 0.84]} />
                    <meshStandardMaterial color="#33261a" metalness={0.4} roughness={0.6} />
                </mesh>
            ))}
        </group>
    );
}

function Chest({
    deck,
    splash,
    dumped,
    onDump,
}: {
    deck: [number, number];
    splash: [number, number];
    dumped: boolean;
    onDump: () => void;
}) {
    if (dumped) {
        // teen flyter som en mørk flekk på vannet
        return (
            <mesh position={[splash[0], 0.06, splash[1]]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.9, 20]} />
                <meshStandardMaterial color={TEA} roughness={1} transparent opacity={0.8} />
            </mesh>
        );
    }
    return (
        <Draggable
            position={[deck[0], 1.5, deck[1]]}
            snapPoints={[splash]}
            snapRadius={2.2}
            onSnap={onDump}
        >
            {/* romslig usynlig gripeflate for trygg trackpad-treffing */}
            <mesh>
                <boxGeometry args={[1.6, 1.4, 1.6]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            <TeaChest />
        </Draggable>
    );
}

// --- Utkledd "Sons of Liberty"-figur på dekket ---
function Raider({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 1.18, z]} rotation={[0, Math.PI, 0]}>
            <Person body="#3f5a3a" skin="#c99a6f" legs="#4a3f2f" pose="raise" hat="hood" hatColor="#6b4a2c" />
        </group>
    );
}

interface SceneProps {
    dumped: boolean[];
    dumpChest: (i: number) => void;
    dumpCount: number;
}

function HarborScene({ dumped, dumpChest, dumpCount }: SceneProps) {
    const raiders = useMemo(
        () => [
            [-1.2, 1.4],
            [1.2, -0.2],
        ],
        []
    );
    return (
        <group>
            {/* Boston havn */}
            <WaterPlane position={[0, 0, 0]} size={[30, 30]} color="#3a5f7a" />

            {/* brygge i bakkant */}
            <mesh position={[0, 0.35, 7]} receiveShadow castShadow>
                <boxGeometry args={[16, 0.7, 3]} />
                <meshStandardMaterial color="#6b5a44" roughness={0.95} />
            </mesh>

            <Merchantman />

            {raiders.map((r, i) => (
                <Raider key={i} x={r[0]} z={r[1]} />
            ))}

            {/* målpunkt-ringer der teen skal havne */}
            {SPLASH.map((s, i) =>
                dumped[i] ? null : (
                    <mesh key={`m${i}`} position={[s[0], 0.05, s[1]]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.7, 0.95, 20]} />
                        <meshBasicMaterial color="#e0c98a" transparent opacity={0.7} />
                    </mesh>
                )
            )}

            {/* tekistene */}
            {DECK.map((d, i) => (
                <Chest key={i} deck={d} splash={SPLASH[i]} dumped={dumped[i]} onDump={() => dumpChest(i)} />
            ))}

            {/* plask der siste kiste landet */}
            {SPLASH.map((s, i) =>
                dumped[i] ? <Impact key={`i${i}`} preset="splash" trigger={1} position={[s[0], 0.1, s[1]]} /> : null
            )}

            {/* feiringspartikler når alt er dumpet */}
            <Burst position={[0, 2, 0]} trigger={dumpCount >= DECK.length ? 1 : 0} />
        </group>
    );
}

export default function Teselskapet3D({ onComplete }: MicroGameProps) {
    const [dumped, setDumped] = useState<boolean[]>([false, false, false, false, false]);
    const [banner, setBanner] = useState<string | null>(
        '16. desember 1773: skipene er fulle av te med britisk skatt. Dra kistene over rekka og ut i havet.'
    );
    const sound = useStepSounds();

    const dumpCount = dumped.filter(Boolean).length;
    const done = dumpCount >= dumped.length;

    const reset = () => {
        setDumped([false, false, false, false, false]);
        setBanner(
            '16. desember 1773: skipene er fulle av te med britisk skatt. Dra kistene over rekka og ut i havet.'
        );
    };

    const dumpChest = (i: number) => {
        setDumped((prev) => {
            if (prev[i]) return prev;
            const next = [...prev];
            next[i] = true;
            const count = next.filter(Boolean).length;
            if (count >= next.length) {
                sound.play('complete');
                setBanner('All teen ligger i havn! Britene svarer med å stenge havna. Nå nærmer krigen seg.');
                onComplete({ score: 1, completed: true });
            } else {
                sound.play('correct');
                setBanner(`Plask! ${count} av ${next.length} kister er i havet. Fortsett.`);
            }
            return next;
        });
    };

    return (
        <MicroGameScaffold
            title="Teselskapet i Boston"
            subtitle="Dra tekistene over rekka og kast den skattlagte teen i havn"
            estimatedSeconds={110}
            onRetry={reset}
            scene={<HarborScene dumped={dumped} dumpChest={dumpChest} dumpCount={dumpCount} />}
            canvas={{
                idle: dumpCount === 0,
                camera: { position: [11, 8, 12], fov: 42 },
                background: '#9fb4cf',
                fog: { near: 34, far: 70 },
                target: [0, 1.2, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">16. des. 1773</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Kister i havet', value: dumpCount, unit: `av ${dumped.length}` },
                            { label: 'Skatt betalt', value: '£0' },
                        ]}
                    />
                    <DragHint show={!done} corner="bc">
                        Dra kistene ut til de lyse ringene
                    </DragHint>
                </>
            }
        >
            {!done && (
                <SceneFact>
                    Britene hadde gitt ett selskap enerett på å selge te i koloniene, med skatt på.
                    Kolonistene mente det var urettferdig: de skulle betale, men fikk aldri stemme om
                    loven. Om natten gikk menn forkledd om bord og kastet 342 kister med te i havna.
                    Dra hver kiste over rekka.
                </SceneFact>
            )}

            {done && (
                <WinScreen title="Teselskapet fullført, 16. desember 1773" onReplay={reset}>
                    <span className="inline-flex items-center gap-1.5">
                        <PackageX className="w-4 h-4" />
                        Du kjente trassen selv.
                    </span>{' '}
                    Kolonistene ville heller ødelegge teen enn å betale en skatt de ikke fikk stemme
                    om. Britene svarte med å stenge havna i Boston og ta fra byen selvstyret. Det gjorde
                    mange kolonister rasende, og bare halvannet år senere brøt krigen ut.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
}
