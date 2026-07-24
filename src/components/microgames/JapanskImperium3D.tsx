import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    Hotspot,
    WaterPlane,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    StepTracker,
    DataReadout,
    damp,
    Burst,
    useShake,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Japansk imperialisme: Da Japan slo en stormakt".
//
// Lyspæra (rett fra artikkelen): Meiji-Japan brukte sin nye industri og hær til å
// bli en imperialistisk stormakt. Først slo det Kina og tok Taiwan (1895). Så kom
// det avgjørende: i 1905 senket Japans moderne flåte den russiske i Tsushimastredet.
// Det var første gang i moderne tid at et asiatisk land slo en europeisk stormakt.
// Etterpå gjorde Japan Korea til koloni (1910). Naboene betalte prisen for framgangen.
//
// Mekanikk: et stilisert kart over Øst-Asia sett ovenfra. Japans øyer ligger alt
// røde i øst. Eleven legger nabolandene under Japan i historisk rekkefølge - bare
// den aktive noden lyser og kan klikkes. Den midterste noden er sjøslaget ved
// Tsushima: en russisk flåte ligger i stredet, og eleven klikker for å ta slaget.
// Flåten synker, og først da åpnes Korea. For hvert land som faller, blir det rødt
// og en rød imperie-lenke fra Japan lyser opp.

type NodeKind = 'claim' | 'battle';

interface ImperialNode {
    id: string;
    name: string;
    x: number;
    z: number;
    kind: NodeKind;
    badge: string; // årstall på stedsetiketten
    fact: string;
    prompt: string;
}

// Japans hjemmeøyer (alltid røde). Ligger i øst.
const JAPAN_CENTER: [number, number, number] = [5.4, 0, 1.4];
const HOME_ISLANDS: { x: number; z: number; r: number }[] = [
    { x: 6.2, z: -2.6, r: 1.5 },
    { x: 5.4, z: 0.6, r: 1.7 },
    { x: 4.4, z: 3.6, r: 1.5 },
    { x: 6.6, z: 4.6, r: 1.1 },
];

// Nodene eleven legger under Japan, i historisk rekkefølge.
const NODES: ImperialNode[] = [
    {
        id: 'taiwan',
        name: 'Taiwan',
        x: -1.9,
        z: 5.2,
        kind: 'claim',
        badge: '1895',
        fact: 'Japan slo det mye større Kina i krig og tok øya Taiwan. Verden ble overrasket over den nye stormakten.',
        prompt: 'Klikk Taiwan. Japan vant øya fra Kina i 1895.',
    },
    {
        id: 'tsushima',
        name: 'Tsushima',
        x: 1.4,
        z: 3.2,
        kind: 'battle',
        badge: '1905',
        fact: 'Japans moderne flåte senket nesten hele den russiske flåten på en dag. Første gang et asiatisk land slo en europeisk stormakt.',
        prompt: 'Klikk den russiske flåten i stredet og ta sjøslaget ved Tsushima (1905).',
    },
    {
        id: 'korea',
        name: 'Korea',
        x: -3.8,
        z: -0.8,
        kind: 'claim',
        badge: '1910',
        fact: 'Etter seieren over Russland gjorde Japan Korea til sin koloni. Naboene betalte prisen for Japans framgang.',
        prompt: 'Klikk Korea. Japan gjorde landet til koloni i 1910.',
    },
];

const TOTAL_STEPS = NODES.length;

const JAPAN_RED = new THREE.Color('#bc002d');

const JapanskImperium3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [step, setStep] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Meiji-Japan var blitt en moderne stormakt. Klikk landet som lyser, og legg nabolandene under Japan.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>(JAPAN_CENTER);

    const done = step >= TOTAL_STEPS;
    const activeNode = done ? null : NODES[step];

    const claim = (id: string) => {
        if (!activeNode || id !== activeNode.id) return;
        setBurstPos([activeNode.x, 0.7, activeNode.z]);
        setBurst((b) => b + 1);
        setFact(activeNode.fact);
        const next = step + 1;
        setStep(next);
        if (next >= TOTAL_STEPS) {
            sounds.play('complete');
            setBanner('Japan var blitt et imperium. En europeisk stormakt var slått, og naboland lå under japansk styre.');
        } else {
            sounds.play(NODES[step].kind === 'battle' ? 'complete' : 'advance');
            setBanner(NODES[next].prompt);
        }
    };

    const reset = () => {
        setStep(0);
        setBanner(
            'Meiji-Japan var blitt en moderne stormakt. Klikk landet som lyser, og legg nabolandene under Japan.'
        );
        setFact(null);
        setBurstPos(JAPAN_CENTER);
    };

    useEffect(() => {
        if (!done) return;
        const t = setTimeout(() => onComplete({ score: 1, completed: true }), 500);
        return () => clearTimeout(t);
    }, [done, onComplete]);

    const idle = step === 0;

    return (
        <MicroGameScaffold
            title="Det japanske imperiet vokser"
            subtitle="Legg nabolandene under Japan i historisk rekkefølge, og ta det avgjørende sjøslaget mot Russland."
            estimatedSeconds={140}
            onRetry={step > 0 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0.5, 18, 13.5], fov: 40 },
                background: '#cfe6f2',
                fog: { near: 36, far: 74 },
                target: [0.8, 0, 1.6],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{done ? 'Japansk imperium' : 'Øst-Asia, 1895-1910'}</SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Land lagt under', value: `${step} / ${TOTAL_STEPS}` },
                                { label: 'Neste', value: activeNode?.name ?? '-' },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Klikk landet som lyser
                    </DragHint>
                </>
            }
            scene={
                <ImperiumMap
                    step={step}
                    activeId={activeNode?.id ?? null}
                    burst={burst}
                    burstPos={burstPos}
                    onClaim={claim}
                />
            }
        >
            <div className="flex flex-col gap-3">
                <StepTracker current={step} total={TOTAL_STEPS} />

                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Klikk landet som{' '}
                            <span className="font-bold text-rose-700">lyser</span> for å legge det
                            under Japan. For hvert land som faller, blir det rødt og en rød
                            imperie-lenke fra Japan lyser opp. Den midterste noden er sjøslaget ved
                            Tsushima: senk den russiske flåten for å åpne veien videre.
                        </p>
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen
                        title="Japan brukte Meiji-moderniseringen til å bli et imperium, og i 1905 slo det Russland som det første asiatiske landet i moderne tid."
                        onReplay={reset}
                    >
                        Først slo Japan Kina og tok Taiwan (1895). Så kom det avgjørende: i 1905
                        senket Japans moderne flåte den russiske i Tsushimastredet. For første gang
                        hadde et asiatisk land slått en europeisk stormakt. Etterpå gjorde Japan
                        Korea til koloni (1910). Den samme styrken som gjorde Japan stolt, kostet
                        naboene friheten.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-KARTET
// ============================================================

function ImperiumMap({
    step,
    activeId,
    burst,
    burstPos,
    onClaim,
}: {
    step: number;
    activeId: string | null;
    burst: number;
    burstPos: [number, number, number];
    onClaim: (id: string) => void;
}) {
    const { ref: shakeRef, shake } = useShake(0.18, 0.03, 2.6);
    const prevStep = useRef(step);
    useEffect(() => {
        if (step > prevStep.current) {
            // Sjøslaget (node-indeks 1) gir et kraftigere rist.
            shake(NODES[prevStep.current]?.kind === 'battle' ? 0.9 : 0.4);
        }
        prevStep.current = step;
    }, [step, shake]);

    const isOwned = (idx: number) => step > idx;

    return (
        <group ref={shakeRef}>
            {/* Havet */}
            <WaterPlane position={[1, 0, 1]} size={[52, 48]} color="#2f6f97" />

            {/* Imperie-lenker fra Japan til hvert land som faller */}
            {NODES.map((n, i) => (
                <ImperialLink
                    key={`link-${n.id}`}
                    from={JAPAN_CENTER}
                    to={[n.x, 0, n.z]}
                    on={isOwned(i)}
                />
            ))}

            {/* Japans hjemmeøyer, alltid røde */}
            {HOME_ISLANDS.map((b, i) => (
                <Landmass key={`home-${i}`} x={b.x} z={b.z} r={b.r} owned />
            ))}
            <Html position={[JAPAN_CENTER[0], 2.6, JAPAN_CENTER[2]]} center pointerEvents="none">
                <div className="px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap shadow bg-rose-700/90 text-white">
                    Japan
                </div>
            </Html>

            {/* Nodene eleven legger under Japan */}
            {NODES.map((n, i) => {
                const owned = isOwned(i);
                const active = n.id === activeId;
                if (n.kind === 'battle') {
                    return (
                        <BattleNode
                            key={n.id}
                            node={n}
                            owned={owned}
                            active={active}
                            onFight={() => onClaim(n.id)}
                        />
                    );
                }
                return (
                    <Interactive
                        key={n.id}
                        onSelect={() => onClaim(n.id)}
                        disabled={!active}
                        hitArea={[2.8, 2.4, 2.8]}
                        position={[n.x, 0, n.z]}
                    >
                        <TerritoryMarker node={n} owned={owned} active={active} />
                    </Interactive>
                );
            })}

            {/* Feiringspartikler der et land faller */}
            <Burst position={burstPos} trigger={burst} color="#f4d27a" count={26} spread={2.2} />
        </group>
    );
}

// Ei landmasse: lavpoly kystflekk som farges rød når den legges under Japan.
const LAND_FREE = new THREE.Color('#5f8a44');
function Landmass({
    x,
    z,
    r,
    owned,
    local = false,
}: {
    x: number;
    z: number;
    r: number;
    owned: boolean;
    local?: boolean;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!mat.current) return;
        mat.current.color.lerp(owned ? JAPAN_RED : LAND_FREE, Math.min(1, dt * 4));
        mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, owned ? 0.32 : 0, dt, 4);
    });
    const pos: [number, number, number] = local ? [0, 0.16, 0] : [x, 0.16, z];
    return (
        <mesh position={pos} rotation={[0, x * 0.7, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r * 0.9, r, 0.3, 8]} />
            <meshStandardMaterial
                ref={mat}
                color="#5f8a44"
                emissive="#bc002d"
                emissiveIntensity={0}
                roughness={1}
                flatShading
            />
        </mesh>
    );
}

// En klikkbar territorie-node: ei landmasse, en flaggstang som heiser det røde
// Hinomaru-flagget når landet faller, en pulserende ring når noden er aktiv, og
// en stedsetikett med årstall.
function TerritoryMarker({
    node,
    owned,
    active,
}: {
    node: ImperialNode;
    owned: boolean;
    active: boolean;
}) {
    return (
        <group>
            <Landmass x={0} z={0} r={1.3} owned={owned} local />
            <SunFlag held={owned} />
            {active && <ActiveRing />}
            <Html position={[0, 2.5, 0]} center pointerEvents="none">
                <div
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap shadow ${
                        owned ? 'bg-rose-700/90 text-white' : 'bg-slate-900/80 text-white'
                    }`}
                >
                    {node.name} {node.badge}
                </div>
            </Html>
        </group>
    );
}

// Sjøslag-noden ved Tsushima: en russisk flåte ligger i stredet mens slaget kan
// tas, og synker når Japan vinner. Etterpå heises det japanske flagget her også.
function BattleNode({
    node,
    owned,
    active,
    onFight,
}: {
    node: ImperialNode;
    owned: boolean;
    active: boolean;
    onFight: () => void;
}) {
    const fleet = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!fleet.current) return;
        // Flåten ligger synlig i stredet til slaget er tatt - så synker den
        // sakte under vannflata i stedet for å forsvinne brått.
        fleet.current.position.y = damp(fleet.current.position.y, owned ? -1.2 : 0, dt, 0.8);
    });

    return (
        <group position={[node.x, 0, node.z]}>
            {/* Den russiske flåten i stredet */}
            <group ref={fleet}>
                {[
                    [-0.7, 0.6],
                    [0.6, 0.9],
                    [0.0, 1.5],
                ].map(([x, z], i) => (
                    <RussianShip key={i} x={x} z={z} />
                ))}
            </group>

            {/* Tsushima-øya: gir flagget fast grunn i stredet */}
            <group position={[0.1, 0, -0.75]}>
                <Landmass x={0} z={0} r={0.55} owned={owned} local />
            </group>
            {/* Når slaget er vunnet: japansk flagg heises midt på øya
                (kompenserer for SunFlag sin interne offset på [0.4, 0.4]) */}
            {owned && (
                <group position={[-0.3, 0, -1.15]}>
                    <SunFlag held />
                </group>
            )}

            {/* Slag-Hotspot mens noden er aktiv */}
            {active && !owned && (
                <Hotspot
                    position={[0, 1.5, 0]}
                    onSelect={onFight}
                    label="Sjøslaget ved Tsushima"
                    radius={0.62}
                    color="#e0432f"
                />
            )}

            <Html position={[0, 2.5, 0]} center pointerEvents="none">
                <div
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap shadow ${
                        owned ? 'bg-rose-700/90 text-white' : 'bg-rose-900/85 text-white'
                    }`}
                >
                    {node.name} {node.badge}
                </div>
            </Html>
        </group>
    );
}

// En liten russisk krigsskip-silhuett med grå skrog og hvit-blå kommandostripe.
function RussianShip({ x, z }: { x: number; z: number }) {
    const hull = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!hull.current) return;
        hull.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.8 + x) * 0.06;
    });
    return (
        // Gruppa ligger ved vannlinja (y=0) slik at skroget får litt dypgang
        // i stedet for å sveve over havflata.
        <group position={[x, -0.12, z]} ref={hull}>
            <mesh position={[0, 0.18, 0]} castShadow>
                <boxGeometry args={[0.85, 0.24, 0.36]} />
                <meshStandardMaterial color="#566273" roughness={0.7} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.42, 0]} castShadow>
                <boxGeometry args={[0.34, 0.26, 0.24]} />
                <meshStandardMaterial color="#7a8696" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.7, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
                <meshStandardMaterial color="#3a414c" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Det japanske solflagget (Hinomaru) som heiser seg (skala 0 -> 1) når landet faller.
function SunFlag({ held }: { held: boolean }) {
    const grow = useRef<THREE.Group>(null);
    const cloth = useRef<THREE.Mesh>(null);
    useFrame(({ clock }, dt) => {
        if (grow.current) {
            const s = damp(grow.current.scale.x, held ? 1 : 0.0001, dt, 4);
            grow.current.scale.setScalar(s);
        }
        if (cloth.current) {
            cloth.current.rotation.y = Math.sin(clock.getElapsedTime() * 2) * 0.16;
        }
    });
    return (
        <group ref={grow} position={[0.4, 0.32, 0.4]} scale={0.0001}>
            <mesh position={[0, 0.7, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 1.4, 6]} />
                <meshStandardMaterial color="#4a3520" roughness={0.9} />
            </mesh>
            <group ref={cloth} position={[0.32, 1.05, 0]}>
                <mesh castShadow>
                    <planeGeometry args={[0.6, 0.42]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.85} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, 0, 0.01]}>
                    <circleGeometry args={[0.13, 24]} />
                    <meshStandardMaterial
                        color="#bc002d"
                        emissive="#bc002d"
                        emissiveIntensity={0.4}
                        roughness={0.8}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </group>
        </group>
    );
}

// Pulserende ring som peker ut den aktive noden.
function ActiveRing() {
    const ring = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ring.current) return;
        ring.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 3) * 0.14);
    });
    return (
        <mesh position={[0, 0.34, 0]} ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.8, 0.12, 12, 36]} />
            <meshStandardMaterial color="#e0432f" emissive="#e0432f" emissiveIntensity={0.7} roughness={0.4} />
        </mesh>
    );
}

// Ei imperie-lenke fra Japan til et erobret land. Dempet blå mens fritt, lyser
// rød når landet ligger under Japan.
const LINK_RED = new THREE.Color('#d23a3a');
const LINK_DIM = new THREE.Color('#7fa6c2');
function ImperialLink({
    from,
    to,
    on,
}: {
    from: [number, number, number];
    to: [number, number, number];
    on: boolean;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const dx = to[0] - from[0];
    const dz = to[2] - from[2];
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    useFrame((_, dt) => {
        if (!mat.current) return;
        mat.current.color.lerp(on ? LINK_RED : LINK_DIM, Math.min(1, dt * 3));
        mat.current.opacity = damp(mat.current.opacity, on ? 0.95 : 0.22, dt, 3);
        mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, on ? 0.5 : 0, dt, 3);
    });
    return (
        <mesh position={[(from[0] + to[0]) / 2, 0.2, (from[2] + to[2]) / 2]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.16, 0.05, len]} />
            <meshStandardMaterial
                ref={mat}
                color="#7fa6c2"
                emissive="#d23a3a"
                emissiveIntensity={0}
                transparent
                opacity={0.22}
                roughness={0.6}
            />
        </mesh>
    );
}

export default JapanskImperium3D;
