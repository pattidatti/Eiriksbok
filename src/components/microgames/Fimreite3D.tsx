import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Swords } from 'lucide-react';
import {
    MicroGameScaffold,
    Draggable,
    Hotspot,
    WaterPlane,
    Boat,
    Hill,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    damp,
    Burst,
    useAmbience,
    THEMES,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Slaget ved Fimreite (1184).
// Pedagogisk kjerne (ÉN innsikt): Kong Magnus lenket skipene sine sammen for å
// stå stødig i kamp - en flytende festning. Men lenken ble en felle: da
// birkebeinerne senket kongsskipet i midten, dro lenken naboskipene med i
// dypet. Eleven kjenner det på kroppen: hun ror birkebeiner-skipet ut til
// flåten, angriper kongsskipet, og ser hele den lenkede flåten synke sammen.

type Phase = 'approach' | 'attack' | 'sinking' | 'done';

const t = THEMES.medieval;

const PLAYER_START: [number, number, number] = [-9, 0, 0];
const FLEET_X = 5;
const FLEET_Z = [-3, 0, 3]; // kongens flåte: to fløyskip + kongsskipet Mariasuden i midten
const SNAP: [number, number] = [FLEET_X - 2.6, 0];

const Fimreite3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const ambience = useAmbience('waves');

    const [phase, setPhase] = useState<Phase>('approach');
    const [runId, setRunId] = useState(0);
    const [shipKey, setShipKey] = useState(0);
    const [sinkTrigger, setSinkTrigger] = useState(0);
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Birkebeinerne nærmer seg. Dra skipet ditt bort til kong Magnus sin flåte.'
    );

    const reset = () => {
        setPhase('approach');
        setRunId((r) => r + 1);
        setShipKey((k) => k + 1);
        setSinkTrigger(0);
        setBanner('Birkebeinerne nærmer seg. Dra skipet ditt bort til kong Magnus sin flåte.');
    };

    const handleArrive = () => {
        if (phase !== 'approach') return;
        sounds.play('advance');
        ambience.start();
        setPhase('attack');
        setBanner('Kongsskipet Mariasuden ligger rett foran deg. Klikk det for å gå til angrep.');
    };

    const handleAttack = () => {
        if (phase !== 'attack') return;
        sounds.play('complete');
        setBurst((b) => b + 1);
        setSinkTrigger((s) => s + 1);
        setPhase('sinking');
        setBanner('Kongsskipet synker - og drar naboskipene med seg i lenken!');
        setTimeout(() => {
            setBanner(null);
            setPhase('done');
            onComplete({ score: 1, completed: true });
        }, 2600);
    };

    return (
        <MicroGameScaffold
            title="Slaget ved Fimreite"
            subtitle="Ro birkebeiner-skipet ut i fjorden og angrip kong Magnus sin lenkede flåte"
            estimatedSeconds={90}
            onRetry={phase !== 'approach' ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [2, 7.5, 15], fov: 42 },
                background: t.sky,
                fog: { near: 26, far: 55 },
                target: [0, 0.6, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Sognefjorden · 15. juni 1184</SceneBadge>
                    <DragHint show={phase === 'approach'} corner="bl">
                        Dra skipet mot flåten
                    </DragHint>
                </>
            }
            scene={
                <Fjord
                    key={runId}
                    phase={phase}
                    shipKey={shipKey}
                    sinkTrigger={sinkTrigger}
                    burst={burst}
                    onArrive={handleArrive}
                    onAttack={handleAttack}
                />
            }
        >
            {phase === 'approach' && (
                <p className="text-sm text-slate-600">
                    Kong Magnus har lenket skipene sine sammen på rekke, side ved side. Slik står
                    flåten stødig i kamp, som en flytende festning. Dra ditt eget skip fra land og ut
                    til flåten.
                </p>
            )}

            {phase === 'attack' && (
                <div className="rounded-xl border border-amber-200 bg-white p-3 sm:flex sm:items-center sm:gap-4">
                    <p className="text-xs text-slate-600 leading-relaxed min-w-0 flex-1">
                        Lenken gjør flåten stødig, men den gjør den også sårbar: hvis ett skip synker,
                        kan det dra naboskipene med seg. Klikk kongsskipet Mariasuden i midten, eller
                        knappen her.
                    </p>
                    <button
                        onClick={handleAttack}
                        className="mt-2.5 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition flex-shrink-0"
                    >
                        <Swords className="w-4 h-4" />
                        Angrip kongsskipet
                    </button>
                </div>
            )}

            {phase === 'sinking' && (
                <p className="text-center text-sm text-slate-600">
                    Kongsskipet synker. Lenken som skulle gjøre flåten sterk, drar nå naboskipene ned i
                    dypet sammen med det.
                </p>
            )}

            {phase === 'done' && (
                <WinScreen title="Lenken ble en felle." onReplay={reset}>
                    Kong Magnus sine skip var lenket sammen for å stå stødig i kamp. Men da
                    birkebeinerne senket kongsskipet, dro lenkene de andre skipene med i dypet. Kong
                    Magnus Erlingsson døde ved Fimreite, og Sverre sto igjen som eneste konge i Norge.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Fjord({
    phase,
    shipKey,
    sinkTrigger,
    burst,
    onArrive,
    onAttack,
}: {
    phase: Phase;
    shipKey: number;
    sinkTrigger: number;
    burst: number;
    onArrive: () => void;
    onAttack: () => void;
}) {
    return (
        <group>
            {/* Bratte fjordsider på hver side av vannet */}
            <Hill position={[0, 1, -13]} radius={9} height={7} color="#5c6a4f" seed={2} />
            <Hill position={[0, 1, 13]} radius={9} height={7} color="#4d5c42" seed={5} />
            <WaterPlane position={[0, 0.02, 0]} size={[26, 30]} color={t.water} />

            {/* Kong Magnus sin lenkede flåte */}
            <MagnusFleet phase={phase} sinkTrigger={sinkTrigger} onAttack={onAttack} />

            {/* Feiringspartikler når kongsskipet går ned */}
            <Burst position={[FLEET_X, 1.2, 0]} trigger={burst} color="#dfe8f0" count={26} spread={3} />

            {/* Birkebeiner-skipet eleven drar ut til flåten */}
            {phase === 'approach' && (
                <Draggable
                    key={shipKey}
                    position={PLAYER_START}
                    planeY={0}
                    bounds={{ minX: -10, maxX: 3.2, minZ: -5, maxZ: 5 }}
                    liftY={0.3}
                    dropFx="splash"
                    snapPoints={[SNAP]}
                    snapRadius={2.6}
                    onSnap={onArrive}
                >
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[2.6, 1.4, 1.6]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <Boat position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} color="#4a3420" sail="#7a7264" />
                </Draggable>
            )}

            {/* Birkebeiner-skipet ligger fast ved siden av flåten etter ankomst */}
            {phase !== 'approach' && (
                <Boat
                    position={[SNAP[0], 0, SNAP[1]]}
                    rotation={[0, Math.PI / 2, 0]}
                    color="#4a3420"
                    sail="#7a7264"
                />
            )}
        </group>
    );
}

// ── Kong Magnus sin flåte: tre skip lenket sammen på rekke ────────────────────
function MagnusFleet({
    phase,
    sinkTrigger,
    onAttack,
}: {
    phase: Phase;
    sinkTrigger: number;
    onAttack: () => void;
}) {
    const refA = useRef<THREE.Group>(null);
    const refB = useRef<THREE.Group>(null);
    const refC = useRef<THREE.Group>(null);
    const refs = [refA, refB, refC];
    const sinkStart = useRef<number | null>(null);

    useEffect(() => {
        sinkStart.current = null;
    }, [sinkTrigger]);

    useFrame((_, dt) => {
        if (phase !== 'sinking') return;
        if (sinkStart.current === null) sinkStart.current = performance.now() / 1000;
        const elapsed = performance.now() / 1000 - sinkStart.current;
        // Flaggskipet (midten) synker først, naboskipene følger etter via lenken.
        const delays = [0.5, 0, 0.5];
        const tiltDir = [1, 0.15, -1];
        refs.forEach((ref, i) => {
            if (!ref.current) return;
            const local = Math.max(0, elapsed - delays[i]);
            const targetY = local > 0 ? -1.6 : 0;
            const targetTilt = local > 0 ? 0.55 * tiltDir[i] : 0;
            ref.current.position.y = damp(ref.current.position.y, targetY, dt, 1.4);
            ref.current.rotation.z = damp(ref.current.rotation.z, targetTilt, dt, 1.4);
        });
    });

    return (
        <group>
            {FLEET_Z.map((z, i) => (
                <group key={z} ref={refs[i]} position={[FLEET_X, 0, z]}>
                    <group scale={i === 1 ? 1.25 : 1}>
                        <Boat
                            rotation={[0, -Math.PI / 2, 0]}
                            color={i === 1 ? '#5a3018' : '#6b4a2c'}
                            sail={i === 1 ? '#8a2b2b' : '#caa24a'}
                        />
                    </group>
                    {i === 1 && phase === 'attack' && (
                        <Hotspot
                            position={[0, 1.4, 0]}
                            onSelect={onAttack}
                            label="Angrip Mariasuden"
                            radius={0.6}
                            color="#f43f5e"
                        />
                    )}
                </group>
            ))}
            {/* Lenker som binder skipene sammen */}
            {[0, 1].map((i) => (
                <mesh
                    key={i}
                    position={[FLEET_X, 0.3, (FLEET_Z[i] + FLEET_Z[i + 1]) / 2]}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <cylinderGeometry args={[0.05, 0.05, Math.abs(FLEET_Z[i + 1] - FLEET_Z[i]), 6]} />
                    <meshStandardMaterial color="#2a2420" metalness={0.4} roughness={0.7} />
                </mesh>
            ))}
        </group>
    );
}

export default Fimreite3D;
