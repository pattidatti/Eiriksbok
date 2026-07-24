import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    SceneBanner,
    DataReadout,
    WinScreen,
    StepTracker,
    SceneFact,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill for km-10-digitale-spor.
// Lyspære: fem passive spor er ufarlige alene - kombinasjonen gir algoritmen
// et komplett portrett av hvem du er.
// Eleven spiller rollen som algoritme og samler inn spor fra personen i sentrum.

type Phase = 'collect' | 'won';

interface Orb {
    id: string;
    label: string;
    pos: [number, number, number];
    color: string;
    phaseOff: number;
}

// Plassert rundt personen i 3D-rommet. phaseOff gir ulik sveifhastighet per orb.
const ORBS: Orb[] = [
    { id: 'soek', label: 'Søk kl. 02:00', pos: [-3.2, 2.5, -1.2], color: '#8b5cf6', phaseOff: 0.0 },
    { id: 'gps', label: 'GPS ved klinikk', pos: [3.1, 2.2, -1.0], color: '#ef4444', phaseOff: 1.3 },
    { id: 'app', label: 'Søvn-app åpnet', pos: [-2.8, 1.4, 2.4], color: '#3b82f6', phaseOff: 2.1 },
    {
        id: 'forsikring',
        label: 'Forsikringsside',
        pos: [2.9, 1.6, 2.0],
        color: '#f59e0b',
        phaseOff: 3.4,
    },
    {
        id: 'jobb',
        label: '«Hjemmekontor»-søk',
        pos: [0.2, 3.1, 2.9],
        color: '#10b981',
        phaseOff: 4.7,
    },
];

const Datasporet3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('collect');
    const [collected, setCollected] = useState<Set<string>>(new Set());
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Fem passive spor flyter rundt personen. Klikk dem for å samle profilen.'
    );

    const count = collected.size;
    const total = ORBS.length;

    const reset = () => {
        setPhase('collect');
        setCollected(new Set());
        setBanner('Fem passive spor flyter rundt personen. Klikk dem for å samle profilen.');
    };

    const collect = (id: string) => {
        if (phase !== 'collect' || collected.has(id)) return;
        sounds.play('correct');
        const next = new Set(collected);
        next.add(id);
        setCollected(next);
        if (next.size >= total) {
            setBurst((b) => b + 1);
            sounds.play('complete');
            setPhase('won');
            setBanner(null);
            onComplete({ score: 1, completed: true });
        } else if (next.size === 2) {
            setBanner('To spor samlet. Algoritmen begynner å se et mønster.');
        } else if (next.size === 4) {
            setBanner('Nesten komplett. Profilen tar form.');
        }
    };

    return (
        <MicroGameScaffold
            title="Datasporet"
            subtitle="Du er algoritmen. Samle sporene og se profilen bygge seg opp."
            estimatedSeconds={120}
            onRetry={count > 0 || phase !== 'collect' ? reset : undefined}
            canvas={{
                idle: count === 0,
                camera: { position: [0, 5, 11], fov: 42 },
                background: '#d8ecfa',
                target: [0, 1.5, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Spor samlet', value: count },
                            {
                                label: 'Profil komplett (%)',
                                value: Math.round((count / total) * 100),
                            },
                        ]}
                    />
                </>
            }
            scene={
                <DatasporetScene
                    collected={collected}
                    count={count}
                    burst={burst}
                    onCollect={collect}
                    phase={phase}
                />
            }
        >
            {phase === 'collect' && (
                <div className="flex flex-col gap-3">
                    <StepTracker current={count} total={total} />
                    <SceneFact>
                        Hvert spor er ufarlig alene. Men kombinasjonen av fem uskyldige digitale
                        handlinger gir algoritmen et presist portrett av deg.
                    </SceneFact>
                </div>
            )}
            {phase === 'won' && (
                <WinScreen title="Profilen er komplett!" onReplay={reset}>
                    Fem tilsynelatende uskyldige spor gav algoritmen et detaljert bilde: helse,
                    økonomi og arbeidssituasjon - uten at personen noen gang fortalte noe direkte.
                    Det er dette GDPR og retten til privatliv prøver å beskytte deg mot.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  SCENE
// ─────────────────────────────────────────────────────────────────────────────

function DatasporetScene({
    collected,
    count,
    burst,
    onCollect,
    phase,
}: {
    collected: Set<string>;
    count: number;
    burst: number;
    onCollect: (id: string) => void;
    phase: Phase;
}) {
    return (
        <group>
            {/* Gulvflate - digital, lys */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <circleGeometry args={[6.5, 40]} />
                <meshStandardMaterial color="#c2def5" roughness={0.95} />
            </mesh>

            {/* Sirkler på gulvet som markerer "datanoder" */}
            <DataGrid />

            {/* Personen i sentrum */}
            <PersonFigure collectedCount={count} />

            {/* Svevende spor-orber */}
            {ORBS.map((orb) =>
                !collected.has(orb.id) ? (
                    <FloatingOrb
                        key={orb.id}
                        orb={orb}
                        onCollect={onCollect}
                        disabled={phase !== 'collect'}
                    />
                ) : null
            )}

            {/* Seier-burst */}
            <Burst position={[0, 2, 0]} trigger={burst} color="#6366f1" count={45} spread={5.5} />
        </group>
    );
}

// Enkle konsentriske sirkler på gulvet - gir "digital grid"-følelse uten mørk bakgrunn.
function DataGrid() {
    return (
        <group position={[0, 0.01, 0]}>
            {[1.5, 3.0, 5.0].map((r) => (
                <mesh key={r} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[r - 0.04, r, 48]} />
                    <meshBasicMaterial color="#9ac8e8" transparent opacity={0.45} />
                </mesh>
            ))}
        </group>
    );
}

// Person-silhuett med glød som vokser for hvert innsamlet spor.
function PersonFigure({ collectedCount }: { collectedCount: number }) {
    const bodyRef = useRef<THREE.MeshStandardMaterial>(null);
    const headRef = useRef<THREE.MeshStandardMaterial>(null);
    const glowTarget = (collectedCount / ORBS.length) * 0.85;

    useFrame((_, dt) => {
        if (bodyRef.current) {
            bodyRef.current.emissiveIntensity = damp(
                bodyRef.current.emissiveIntensity,
                glowTarget,
                dt,
                3
            );
        }
        if (headRef.current) {
            headRef.current.emissiveIntensity = damp(
                headRef.current.emissiveIntensity,
                glowTarget,
                dt,
                3
            );
        }
    });

    return (
        <group>
            {/* Kropp - kapselen er 1.6 høy totalt, senter 0.8 gir bunn på gulvet (y=0) */}
            <mesh position={[0, 0.8, 0]} castShadow>
                <capsuleGeometry args={[0.3, 1.0, 4, 10]} />
                <meshStandardMaterial
                    ref={bodyRef}
                    color="#4a6b8a"
                    emissive="#3b82f6"
                    emissiveIntensity={0}
                    roughness={0.5}
                />
            </mesh>
            {/* Hode - bunnen (y ≈ 1.57) møter kapseltoppen (1.6) så hodet ikke svever */}
            <mesh position={[0, 1.9, 0]} castShadow>
                <sphereGeometry args={[0.33, 14, 14]} />
                <meshStandardMaterial
                    ref={headRef}
                    color="#5a7a9a"
                    emissive="#3b82f6"
                    emissiveIntensity={0}
                    roughness={0.4}
                />
            </mesh>
        </group>
    );
}

// Svevende data-orb med Hotspot for klikk og liten glødende kule.
function FloatingOrb({
    orb,
    onCollect,
    disabled,
}: {
    orb: Orb;
    onCollect: (id: string) => void;
    disabled: boolean;
}) {
    const grpRef = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (!grpRef.current) return;
        const t = clock.getElapsedTime();
        grpRef.current.position.y = orb.pos[1] + Math.sin(t * 0.85 + orb.phaseOff) * 0.28;
    });

    return (
        <group ref={grpRef} position={orb.pos}>
            {/* Glødende kule */}
            <mesh>
                <sphereGeometry args={[0.22, 12, 12]} />
                <meshStandardMaterial
                    color={orb.color}
                    emissive={orb.color}
                    emissiveIntensity={0.75}
                    roughness={0.2}
                />
            </mesh>
            {/* Hotspot for klikk */}
            {!disabled && (
                <Hotspot
                    position={[0, 0, 0]}
                    onSelect={() => onCollect(orb.id)}
                    label={orb.label}
                    radius={0.55}
                />
            )}
        </group>
    );
}

export default Datasporet3D;
