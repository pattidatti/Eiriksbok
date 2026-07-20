import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Disc3, Trophy } from 'lucide-react';
import {
    MicroGameScaffold,
    GroundPlane,
    Fire,
    Figure,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    SceneSlider,
    DataReadout,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: kast diskos på Olympias hellige stadion. Eleven justerer vinkel
// og kraft, ser kastebanen tegne seg i sanntid, og kaster. Lyspæra: dette var
// en ekte idrettskonkurranse ved et hellig sted - og diskosen flyr lengst når
// vinkelen er rundt 45 grader. Eleven kjenner både idretten og fysikken på
// kroppen.

type Phase = 'aim' | 'flying' | 'won';

const RECORD = 27; // skritt å slå
const K = 33; // skalering: maks ca. 33 skritt ved 45 grader og full kraft
const SCALE = 0.42; // scene-enheter per skritt
const START_X = -7; // der kasteren står

// Lengde i skritt ut fra vinkel (grader) og kraft (0-1). Maks ved 45 grader.
function distanceSkritt(angleDeg: number, power: number): number {
    const rad = (angleDeg * Math.PI) / 180;
    return K * power * Math.sin(2 * rad);
}

// Kastebanens topp-punkt i scene-enheter (høyere ved bratt vinkel).
function apex(rangeScene: number, angleDeg: number): number {
    const rad = (angleDeg * Math.PI) / 180;
    return Math.min(rangeScene * 0.25 * Math.tan(rad), 7);
}

const OlympiaDiskos3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('aim');
    const [angle, setAngle] = useState(34);
    const [power, setPower] = useState(0.6);
    const [throwId, setThrowId] = useState(0);
    const [lastDist, setLastDist] = useState<number | null>(null);
    const [best, setBest] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Still inn vinkel og kraft. Se kastebanen, og kast diskosen.'
    );
    const [burst, setBurst] = useState(0);

    const predicted = distanceSkritt(angle, power);
    const rangeScene = predicted * SCALE;
    const peak = apex(rangeScene, angle);

    const reset = () => {
        setPhase('aim');
        setAngle(34);
        setPower(0.6);
        setLastDist(null);
        setBanner('Still inn vinkel og kraft. Se kastebanen, og kast diskosen.');
    };

    const handleThrow = () => {
        if (phase === 'flying') return;
        const dist = predicted;
        setThrowId((n) => n + 1);
        setPhase('flying');
        setBanner(null);
        sounds.play('advance');
        window.setTimeout(() => {
            const skritt = Math.round(dist);
            setLastDist(skritt);
            setBest((b) => Math.max(b, skritt));
            if (skritt >= RECORD) {
                sounds.play('complete');
                setBurst((b) => b + 1);
                setPhase('won');
                onComplete({ score: 1, completed: true, artifact: { skritt, angle } });
            } else {
                sounds.play('incorrect');
                setBanner(
                    skritt < RECORD - 6
                        ? 'For kort. Prøv mer kraft og en vinkel nær 45 grader.'
                        : 'Nær! Juster vinkelen mot 45 grader for å nå lengst.'
                );
                setPhase('aim');
            }
        }, 1500);
    };

    return (
        <MicroGameScaffold
            title="Diskos på Olympia"
            subtitle="Still inn vinkel og kraft, og kast diskosen lengre enn rekorden"
            estimatedSeconds={140}
            onRetry={lastDist !== null || phase === 'won' ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [2, 6, 17], fov: 42 },
                background: '#cfe3ef',
                target: [1, 1.4, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'won' ? 'Olivenkrans vunnet' : 'Olympia, 776 fvt'}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Rekord', value: RECORD, unit: 'skritt' },
                            {
                                label: phase === 'flying' ? 'Kaster' : 'Ditt kast',
                                value: lastDist ?? '-',
                                unit: 'skritt',
                            },
                            { label: 'Vinkel', value: angle, unit: '°' },
                        ]}
                    />
                </>
            }
            scene={
                <StadiumScene
                    rangeScene={rangeScene}
                    peak={peak}
                    throwId={throwId}
                    showPreview={phase === 'aim'}
                    burst={burst}
                />
            }
        >
            {phase !== 'won' && (
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <SceneSlider
                            label="Vinkel"
                            min={15}
                            max={75}
                            step={1}
                            value={angle}
                            onChange={(v) => phase === 'aim' && setAngle(v)}
                            valueLabel={(v) => `${v}°`}
                        />
                        <SceneSlider
                            label="Kraft"
                            min={30}
                            max={100}
                            step={1}
                            value={Math.round(power * 100)}
                            onChange={(v) => phase === 'aim' && setPower(v / 100)}
                            valueLabel={(v) => `${v} %`}
                        />
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-white p-3 sm:flex sm:items-center sm:gap-4">
                        <p className="text-xs text-slate-600 leading-relaxed min-w-0 flex-1">
                            Den stiplede banen viser hvor langt kastet rekker. Diskos var en av fem
                            grener i femkampen. Slå rekorden på {RECORD} skritt for å vinne
                            olivenkransen.
                        </p>
                        <button
                            onClick={handleThrow}
                            disabled={phase === 'flying'}
                            className="mt-2.5 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition flex-shrink-0 disabled:opacity-50"
                        >
                            <Disc3 className="w-4 h-4" />
                            Kast diskosen
                        </button>
                    </div>
                    <SceneFact>
                        Predikert lengde: {Math.round(predicted)} skritt. Prøv ulike vinkler - du
                        oppdager at diskosen flyr lengst når vinkelen er rundt 45 grader.
                    </SceneFact>
                </div>
            )}

            {phase === 'won' && (
                <WinScreen title="Olivenkransen er din!" onReplay={reset}>
                    <span className="inline-flex items-center gap-1 align-middle">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    </span>{' '}
                    Du kastet {best} skritt og slo rekorden. Vinneren i Olympia fikk ingen
                    pengepremie, bare en krans av oliventre (kotinos) og evig ære. Diskosen var en
                    av fem grener i femkampen, og den flyr lengst når vinkelen er rundt 45 grader.
                    Lekene samlet greske bystater fra hele Hellas til den samme festen.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function StadiumScene({
    rangeScene,
    peak,
    throwId,
    showPreview,
    burst,
}: {
    rangeScene: number;
    peak: number;
    throwId: number;
    showPreview: boolean;
    burst: number;
}) {
    const landX = START_X + rangeScene;
    return (
        <group>
            <GroundPlane size={48} depth={30} color="#d8c184" />
            {/* Løpebane / stadion-stripe i sanden */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.01, 0]} receiveShadow>
                <planeGeometry args={[26, 5]} />
                <meshStandardMaterial color="#caa85f" roughness={1} />
            </mesh>

            {/* Zevs-tempel i bakgrunnen */}
            <Temple position={[-2, 0, -7]} />

            {/* Alteret med den hellige ilden */}
            <group position={[START_X - 1.4, 0, -1.6]}>
                <mesh position={[0, 0.45, 0]} castShadow>
                    <boxGeometry args={[1, 0.9, 1]} />
                    <meshStandardMaterial color="#cfc2a0" roughness={0.9} />
                </mesh>
                <Fire position={[0, 0.9, 0]} scale={0.8} />
            </group>

            {/* Kasteren (diskobolos) */}
            <Figure position={[START_X, 0, 0.3]} body="#b8742e" skin="#e0b98c" />

            {/* Avstandsmarkører langs banen */}
            {[10, 20, 30].map((m) => (
                <group key={m} position={[START_X + m * SCALE, 0, 1.9]}>
                    <mesh position={[0, 0.4, 0]} castShadow>
                        <cylinderGeometry args={[0.05, 0.05, 0.8, 6]} />
                        <meshStandardMaterial color="#9a8049" />
                    </mesh>
                    <mesh position={[0, 0.85, 0]}>
                        <boxGeometry args={[0.5, 0.25, 0.04]} />
                        <meshStandardMaterial color="#f0e6cf" />
                    </mesh>
                </group>
            ))}

            {/* Rekord-flagg */}
            <group position={[START_X + RECORD * SCALE, 0, -1.9]}>
                <mesh position={[0, 0.7, 0]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 1.4, 6]} />
                    <meshStandardMaterial color="#7a5a2a" />
                </mesh>
                <mesh position={[0.28, 1.2, 0]}>
                    <boxGeometry args={[0.55, 0.35, 0.03]} />
                    <meshStandardMaterial color="#c0392b" />
                </mesh>
            </group>

            {/* Stiplet kastebane (oppdateres mens eleven drar sliderne) */}
            {showPreview &&
                Array.from({ length: 14 }, (_, i) => {
                    const s = i / 13;
                    const x = START_X + s * rangeScene;
                    const y = 0.4 + 4 * peak * s * (1 - s);
                    return (
                        <mesh key={i} position={[x, y, 0]}>
                            <sphereGeometry args={[0.07, 8, 8]} />
                            <meshStandardMaterial
                                color="#e0b13a"
                                emissive="#e0b13a"
                                emissiveIntensity={0.4}
                            />
                        </mesh>
                    );
                })}

            {/* Selve diskosen i flukt */}
            <Diskos throwId={throwId} rangeScene={rangeScene} peak={peak} />

            <Burst
                position={[landX, 0.6, 0]}
                trigger={burst}
                color="#9cc94f"
                count={28}
                spread={3.5}
            />
        </group>
    );
}

// Et enkelt dorisk tempel: trappetrinn, søyler og gavl.
function Temple({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
                <boxGeometry args={[8, 0.5, 4]} />
                <meshStandardMaterial color="#e7ddc4" roughness={0.9} />
            </mesh>
            {[-3.2, -1.6, 0, 1.6, 3.2].map((x) => (
                <mesh key={x} position={[x, 1.6, 1.6]} castShadow>
                    <cylinderGeometry args={[0.28, 0.32, 2.6, 12]} />
                    <meshStandardMaterial color="#f1e9d4" roughness={0.85} />
                </mesh>
            ))}
            <mesh position={[0, 3.1, 1.6]} castShadow>
                <boxGeometry args={[8, 0.5, 0.9]} />
                <meshStandardMaterial color="#e7ddc4" roughness={0.9} />
            </mesh>
            <mesh position={[0, 3.7, 1.6]} rotation={[0, 0, 0]} castShadow>
                <boxGeometry args={[8.2, 1, 0.5]} />
                <meshStandardMaterial color="#ded2b4" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Diskosen flyr fra kasteren langs den forhåndsviste banen når throwId endrer
// seg. All animasjon lever i refs - ingen state settes per frame.
function Diskos({
    throwId,
    rangeScene,
    peak,
}: {
    throwId: number;
    rangeScene: number;
    peak: number;
}) {
    const mesh = useRef<THREE.Mesh>(null);
    const t = useRef(1); // 1 = i ro hos kasteren
    const last = useRef(0);
    // Frys banen ved kast-øyeblikket så slider-endringer ikke påvirker den.
    const flight = useRef({ rangeScene, peak });

    useFrame((_, dt) => {
        if (!mesh.current) return;
        if (throwId !== last.current) {
            last.current = throwId;
            t.current = 0;
            flight.current = { rangeScene, peak };
        }
        if (t.current < 1) {
            t.current = Math.min(1, t.current + dt * 0.7);
        }
        const s = t.current;
        const { rangeScene: r, peak: p } = flight.current;
        const x = START_X + s * r;
        const y = 0.5 + 4 * p * s * (1 - s);
        mesh.current.position.set(x, y, 0);
        mesh.current.rotation.z += dt * 9;
        mesh.current.visible = throwId > 0;
    });

    return (
        <mesh
            ref={mesh}
            position={[START_X, 0.5, 0]}
            rotation={[Math.PI / 2.4, 0, 0]}
            castShadow
            visible={false}
        >
            <cylinderGeometry args={[0.28, 0.28, 0.08, 18]} />
            <meshStandardMaterial color="#b98b34" metalness={0.5} roughness={0.4} />
        </mesh>
    );
}

export default OlympiaDiskos3D;
