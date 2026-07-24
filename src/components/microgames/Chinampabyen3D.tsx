import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    WaterPlane,
    Figure,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    DataReadout,
    StepTracker,
    Burst,
    damp,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om Amerikas tidlige sivilisasjoner.
// Eleven bygger de flytende hagene (chinampas) til aztekernes hovedstad
// Tenochtitlán: dra hver hage ut på innsjøen og plant den. For hver chinampa
// vokser matmengden, og dermed vokser byen — husene reiser seg på øya i midten
// og folketallet stiger. Lyspæra: aztekerne dyrket mat PÅ vannet, og det
// ingeniørarbeidet gjorde det mulig å fø en av verdens største byer.
// Mekanikken ER poenget: jordbruk gjør sivilisasjon mulig.

const TOTAL = 5;

// Hvor de tomme hageplassene ligger ute på innsjøen (xz). Hver chinampa har
// sin egen plass, så to draggables aldri kjemper om samme rute. Alle plassene
// ligger klart utenfor øyas fot (sekskant, radius 5.0 ved bunnen, senter z -1.2)
// og unna demningene, så hagene aldri skjærer inn i land.
const SLOTS: [number, number][] = [
    [-5.4, 2.6],
    [-2.6, 4.6],
    [0, 5.9],
    [2.6, 4.6],
    [5.4, 2.6],
];

// Startplassene ved kanobrygga foran i bildet.
const SHORE: [number, number][] = [
    [-5.6, 7.4],
    [-2.8, 7.8],
    [0, 8.0],
    [2.8, 7.8],
    [5.6, 7.4],
];

// Hus som reiser seg på øya etter hvert som byen mettes.
const BUILDINGS: { x: number; z: number; maxH: number; w: number; color: string }[] = [
    { x: -2.0, z: -2.2, maxH: 1.3, w: 1.0, color: '#d9b27a' },
    { x: 1.9, z: -2.4, maxH: 1.6, w: 1.1, color: '#cf9f63' },
    { x: -2.6, z: -0.4, maxH: 1.0, w: 0.9, color: '#e0bd86' },
    { x: 2.6, z: -0.6, maxH: 1.2, w: 0.95, color: '#d4a96f' },
    { x: -1.1, z: -3.0, maxH: 1.0, w: 0.85, color: '#dcb47f' },
    { x: 1.0, z: -3.1, maxH: 1.4, w: 0.9, color: '#caa05f' },
    { x: 0, z: -1.0, maxH: 0.9, w: 0.8, color: '#e6c590' },
];

const Chinampabyen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const ambience = useAmbience('waves');
    const [planted, setPlanted] = useState<boolean[]>(() => Array(TOTAL).fill(false));
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra en flytende hage ut til en lysende ring på innsjøen.'
    );

    const placed = planted.filter(Boolean).length;
    const done = placed >= TOTAL;
    const growth = placed / TOTAL;
    const people = 20000 + placed * 36000; // 20 000 -> 200 000

    const place = (i: number) => {
        ambience.start();
        setPlanted((prev) => {
            if (prev[i]) return prev; // allerede plantet
            const nextArr = prev.slice();
            nextArr[i] = true;
            const nextCount = nextArr.filter(Boolean).length;
            setBurst((b) => b + 1);
            if (nextCount >= TOTAL) {
                sounds.play('complete');
                setBanner(null);
                setTimeout(() => onComplete({ score: 1, completed: true }), 250);
            } else {
                sounds.play('correct');
                setBanner('Mer mat! Flere folk kan bo i byen. Bygg neste hage.');
            }
            return nextArr;
        });
    };

    const reset = () => {
        setPlanted(Array(TOTAL).fill(false));
        setBanner('Dra en flytende hage ut til en lysende ring på innsjøen.');
    };

    const idle = placed === 0;

    return (
        <MicroGameScaffold
            title="Bygg byen på vannet"
            subtitle="Dra de flytende hagene (chinampas) ut på innsjøen og fø aztekernes hovedstad"
            estimatedSeconds={120}
            onRetry={placed > 0 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 11.5, 15], fov: 44 },
                background: '#bfe3ef',
                fog: { near: 26, far: 56 },
                target: [0, 0.2, 1.8],
            }}
            containerClassName="bg-gradient-to-b from-[#bfe3ef] via-[#cfeaf0] to-[#9ec6cf]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Tenochtitlán står' : 'Tenochtitlán - ca. 1500'}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Flytende hager', value: `${placed}/${TOTAL}` },
                            { label: 'Innbyggere', value: people.toLocaleString('no') },
                        ]}
                    />
                    <DragHint show={idle} corner="bc">
                        Dra en grønn hage ut på vannet
                    </DragHint>
                </>
            }
            scene={
                <LakeCity
                    planted={planted}
                    growth={growth}
                    burst={burst}
                    onPlace={place}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done ? (
                    <>
                        <StepTracker current={placed} total={TOTAL} />
                        <p className="text-sm text-slate-600 leading-snug">
                            Aztekerne hadde lite tørt land. Derfor bygde de{' '}
                            <span className="font-bold text-emerald-700">chinampas</span> - frodige
                            hager av slam og siv rett på innsjøen. Dra hver hage ut til en ring. For
                            hver hage du planter, får byen mer mat, og flere mennesker kan bo der.
                        </p>
                    </>
                ) : (
                    <WinScreen title="Byen på vannet lever!" onReplay={reset}>
                        Med rad på rad av flytende hager fødde aztekerne en by på rundt 200 000
                        mennesker - større enn nesten alle byer i Europa på samme tid. Maten kom
                        ikke fra erobring, men fra smart jordbruk på vannet. Slik blir det tydelig:
                        det er overskudd av mat som gjør store byer og riker mulig.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function LakeCity({
    planted,
    growth,
    burst,
    onPlace,
}: {
    planted: boolean[];
    growth: number;
    burst: number;
    onPlace: (i: number) => void;
}) {
    return (
        <group>
            {/* Innsjøen i Mexicodalen */}
            <WaterPlane position={[0, 0.02, 1]} size={[26, 24]} color="#3f97a8" />

            {/* Vulkaner i bakgrunnen — Mexicodalen var omkranset av fjell */}
            <Volcano position={[-9, 0, -7]} h={5.2} />
            <Volcano position={[9.5, 0, -8]} h={6.0} />

            {/* Den hellige øya i midten med trappepyramiden (Templo Mayor) */}
            <group position={[0, 0, -1.2]}>
                <IslandBase />
                <StepPyramid />
                {BUILDINGS.map((b, i) => (
                    <GrowingBuilding key={i} {...b} growth={growth} />
                ))}
                {/* Folk dukker opp på torget når byen vokser (øyplatået ligger på y 0.2) */}
                {growth > 0.35 && (
                    <Figure position={[-1.4, 0.2, 1.3]} body="#7a3f2c" skin="#d8a878" />
                )}
                {growth > 0.6 && <Figure position={[1.3, 0.2, 1.4]} body="#5c4a8a" skin="#e0b98c" />}
                {growth > 0.85 && (
                    <Figure position={[0.2, 0.2, 1.8]} body="#8a6d2c" skin="#c79468" />
                )}
            </group>

            {/* Demninger/veier (causeways) fra øya ut mot land. Den søndre stopper
                før hageplassene og kanobrygga, så ingen hage havner oppå stein. */}
            <Causeway from={[0, -2.8]} to={[0, 4.6]} />
            <Causeway from={[-2.4, -1.2]} to={[-9, -1.2]} />
            <Causeway from={[2.4, -1.2]} to={[9, -1.2]} />

            {/* Tomme hageplasser: en lysende ring viser hvor neste hage skal */}
            {SLOTS.map((s, i) =>
                planted[i] ? null : <SlotMarker key={i} position={[s[0], 0.06, s[1]]} />
            )}

            {/* De flytende hagene eleven drar ut. Hver har sin egen plass. */}
            {/* Flåten ligger med litt dypgang: bunnen (y 0) så vidt under vannflata (y 0.02) */}
            {SHORE.map((s, i) => (
                <Draggable
                    key={i}
                    position={[s[0], 0, s[1]]}
                    planeY={0}
                    snapPoints={[SLOTS[i]]}
                    snapRadius={2.4}
                    liftY={0.5}
                    onSnap={() => onPlace(i)}
                >
                    {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh>
                        <boxGeometry args={[2.2, 1.2, 2.2]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <Chinampa planted={planted[i]} />
                </Draggable>
            ))}

            {/* Feiringspartikler når en hage faller på plass */}
            <Burst position={[0, 1.4, 1]} trigger={burst} color="#7ed957" count={22} spread={2.4} />
        </group>
    );
}

// En flytende hage: en flåte av jord med grønne rader som spretter opp når plantet.
function Chinampa({ planted }: { planted: boolean }) {
    const crops = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!crops.current) return;
        const target = planted ? 1 : 0.18;
        const s = damp(crops.current.scale.y, target, dt, 6);
        crops.current.scale.y = s;
    });
    return (
        <group>
            {/* jordflåten */}
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 0.24, 1.5]} />
                <meshStandardMaterial color="#6b4a2b" roughness={1} />
            </mesh>
            {/* grønn kant av siv rundt */}
            <mesh position={[0, 0.26, 0]}>
                <boxGeometry args={[1.62, 0.06, 1.62]} />
                <meshStandardMaterial color="#4f7d3a" roughness={1} />
            </mesh>
            {/* avlingsrader som vokser ved planting */}
            <group ref={crops} position={[0, 0.26, 0]}>
                {[-0.45, -0.15, 0.15, 0.45].map((x) => (
                    <mesh key={x} position={[x, 0.22, 0]} castShadow>
                        <boxGeometry args={[0.18, 0.44, 1.2]} />
                        <meshStandardMaterial color="#5fae3f" roughness={0.9} flatShading />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// Pulsende ring som markerer en tom hageplass.
function SlotMarker({ position }: { position: [number, number, number] }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        ref.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 3) * 0.12);
    });
    return (
        <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.85, 0.1, 10, 28]} />
            <meshStandardMaterial
                color="#9be37a"
                emissive="#5fae3f"
                emissiveIntensity={0.6}
                roughness={0.4}
            />
        </mesh>
    );
}

// Et hus som reiser seg fra bakken etter hvert som byen mettes.
function GrowingBuilding({
    x,
    z,
    maxH,
    w,
    color,
    growth,
}: {
    x: number;
    z: number;
    maxH: number;
    w: number;
    color: string;
    growth: number;
}) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const target = Math.max(0.05, maxH * growth);
        const h = damp(ref.current.scale.y, target, dt, 4);
        ref.current.scale.y = h;
        ref.current.position.y = 0.2 + h / 2; // foten blir stående på øyplatået (y 0.2)
    });
    return (
        <mesh ref={ref} position={[x, 0, z]} castShadow receiveShadow>
            <boxGeometry args={[w, 1, w]} />
            <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
    );
}

// Den hellige øya: et lavt tan-platå over vannet.
function IslandBase() {
    return (
        <mesh position={[0, 0.05, 0]} receiveShadow>
            <cylinderGeometry args={[4.6, 5.0, 0.3, 6]} />
            <meshStandardMaterial color="#cdb482" roughness={1} />
        </mesh>
    );
}

// Templo Mayor: tre avtrappede plattformer med en liten helligdom på toppen.
function StepPyramid() {
    return (
        <group position={[0, 0.2, -1.2]}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[2.6, 0.8, 2.0]} />
                <meshStandardMaterial color="#c9a06a" roughness={0.95} />
            </mesh>
            <mesh position={[0, 1.1, 0]} castShadow>
                <boxGeometry args={[1.9, 0.7, 1.4]} />
                <meshStandardMaterial color="#bd9259" roughness={0.95} />
            </mesh>
            <mesh position={[0, 1.7, 0]} castShadow>
                <boxGeometry args={[1.3, 0.6, 0.95]} />
                <meshStandardMaterial color="#b1864f" roughness={0.95} />
            </mesh>
            {/* helligdom på toppen */}
            <mesh position={[0, 2.2, 0]} castShadow>
                <boxGeometry args={[0.9, 0.5, 0.7]} />
                <meshStandardMaterial color="#a23b2e" roughness={0.9} />
            </mesh>
        </group>
    );
}

// En demning/vei som krysser vannet (lavt steinbånd like over vannflaten).
function Causeway({ from, to }: { from: [number, number]; to: [number, number] }) {
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    const cx = (from[0] + to[0]) / 2;
    const cz = (from[1] + to[1]) / 2;
    return (
        <mesh position={[cx, 0.08, cz]} rotation={[0, angle, 0]} receiveShadow>
            <boxGeometry args={[0.7, 0.1, len]} />
            <meshStandardMaterial color="#a99a78" roughness={1} />
        </mesh>
    );
}

// En lavpoly vulkan i horisonten — Mexicodalen lå mellom snødekte vulkaner.
function Volcano({ position, h }: { position: [number, number, number]; h: number }) {
    return (
        <group position={position}>
            <mesh position={[0, h / 2, 0]} castShadow>
                <coneGeometry args={[h * 0.7, h, 7]} />
                <meshStandardMaterial color="#8a8f7a" roughness={1} flatShading />
            </mesh>
            {/* snøtopp */}
            <mesh position={[0, h - h * 0.12, 0]}>
                <coneGeometry args={[h * 0.24, h * 0.3, 7]} />
                <meshStandardMaterial color="#eef3f5" roughness={1} flatShading />
            </mesh>
        </group>
    );
}

export default Chinampabyen3D;
