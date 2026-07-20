import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    GroundPlane,
    Building,
    Tree,
    Column,
    Wall,
    Tower,
    Boat,
    MarketStall,
    Person,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    SceneSlider,
    DataReadout,
    damp,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til "Romas grunnleggelse". Eleven bygger Roma slik arkeologien
// forteller det, ikke slik myten gjør: ikke en by reist på en dag av en mann,
// men sju små landsbyer på hver sin høyde ved elven Tiberen som sakte vokser
// sammen til en by. (All tekst med riktige norske tegn.)
//
// Lyspæra: stedet var perfekt fordi høydene ga forsvar OG elven ga handel.
// Først slår folk seg ned på de sju trygge høydene. Men sumpen i midten
// skiller dem. Når eleven tørrlegger sumpen blir den til Forum, det felles
// torget, og de sju landsbyene smelter sammen til EN by med mur rundt.
//
// Mekanikk (kombinerer direkte 3D-klikk + spak):
//   - Hotspot på hver av de sju høydene: klikk for å la en landsby slå seg ned.
//   - Når alle sju står: SceneSlider "Tørrlegg sumpen" senker myrvannet, hever
//     Forum-torget, og reiser bymuren rundt det hele. Da er Roma en by.

interface HillSpec {
    name: string;
    pos: [number, number]; // x, z på bakken
    leaf: string;
    body: string;
    seed: number;
}

// De sju klassiske høydene, lost gruppert rundt sumpen i midten.
// Kapitol ligger nær elven i vest (byens borg og marked).
const HILLS: HillSpec[] = [
    { name: 'Palatinen', pos: [0.4, 3.0], leaf: '#5f8a3e', body: '#b06a3a', seed: 2 },
    { name: 'Aventin', pos: [3.4, 1.5], leaf: '#6b9146', body: '#a85f34', seed: 5 },
    { name: 'Cælius', pos: [3.7, -1.7], leaf: '#5d863c', body: '#b5713e', seed: 8 },
    { name: 'Esquilin', pos: [1.7, -3.7], leaf: '#688f44', body: '#a96338', seed: 11 },
    { name: 'Viminal', pos: [-0.9, -3.8], leaf: '#5e8a3d', body: '#b26a3b', seed: 14 },
    { name: 'Quirinal', pos: [-3.3, -1.9], leaf: '#6a9046', body: '#a75e33', seed: 17 },
    { name: 'Kapitol', pos: [-3.7, 1.1], leaf: '#5b853b', body: '#b97640', seed: 20 },
];
const TOTAL = HILLS.length;
const HILL_TOP = 1.25; // høyden på flat topp der landsbyen sitter

// Korte fakta for en 14-åring, dukker opp underveis.
const FIRST_FACT =
    'Folk slo seg ned på høydene fordi det var lett å forsvare. Fiender måtte angripe oppover. Sagnet sier Romulus bygde her på Palatinen.';
const ALL_SETTLED_FACT =
    'Sju landsbyer står, men en sump i midten skiller dem. Dra spaken og tørrlegg sumpen. Da blir den til Forum, det felles torget der alle møtes.';

const DeSjuHoydene3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [settled, setSettled] = useState<boolean[]>(() => HILLS.map(() => false));
    const [drain, setDrain] = useState(0); // 0-1, hvor tørrlagt sumpen er
    const [won, setWon] = useState(false);
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Klikk en høyde for å la en landsby slå seg ned der.'
    );
    const [fact, setFact] = useState<string | null>(null);

    const count = settled.filter(Boolean).length;
    const allSettled = count >= TOTAL;

    const reset = () => {
        setSettled(HILLS.map(() => false));
        setDrain(0);
        setWon(false);
        setFact(null);
        setBanner('Klikk en høyde for å la en landsby slå seg ned der.');
    };

    const settle = (i: number) => {
        if (settled[i] || allSettled) return;
        setBurst((b) => b + 1);
        const next = settled.map((s, k) => (k === i ? true : s));
        const newCount = next.filter(Boolean).length;
        setSettled(next);
        if (newCount === 1) setFact(FIRST_FACT);
        if (newCount >= TOTAL) {
            sounds.play('advance');
            setFact(ALL_SETTLED_FACT);
            setBanner('Alle sju høydene er bebodd. Nå tørrlegger du sumpen i midten.');
        } else {
            sounds.play('correct');
            setBanner(`${newCount} av ${TOTAL} høyder bebodd. Fortsett.`);
        }
    };

    const onDrain = (v: number) => {
        if (!allSettled) return;
        setDrain(v);
        if (v < 0.99) setBanner(null);
    };

    // Seier når sumpen er tørrlagt og byen er samlet.
    useEffect(() => {
        if (allSettled && drain >= 0.99 && !won) {
            setWon(true);
            setFact(null);
            setBanner(null);
            sounds.play('complete');
            setTimeout(() => onComplete({ score: 1, completed: true }), 300);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drain, allSettled, won]);

    const idle = count === 0;

    return (
        <MicroGameScaffold
            title="Bygg Roma på de sju høydene"
            subtitle="La folk slå seg ned på hver høyde, tørrlegg sumpen, og se landsbyene smelte sammen til én by"
            estimatedSeconds={150}
            onRetry={count > 0 || drain > 0 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 7.8, 12.8], fov: 42 },
                background: '#cfe3ef',
                fog: { near: 22, far: 52 },
                target: [0, 0.6, -0.2],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {won ? 'Roma er én by' : 'Tiberen, ca. 1000-753 fvt.'}
                    </SceneBadge>
                    {!won && (
                        <DataReadout
                            corner="bl"
                            items={
                                allSettled
                                    ? [
                                          {
                                              label: 'Høyder bebodd',
                                              value: count,
                                              unit: `/${TOTAL}`,
                                          },
                                          {
                                              label: 'Sumpen tørrlagt',
                                              value: Math.round(drain * 100),
                                              unit: '%',
                                          },
                                      ]
                                    : [
                                          {
                                              label: 'Høyder bebodd',
                                              value: count,
                                              unit: `/${TOTAL}`,
                                          },
                                      ]
                            }
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Klikk en av de sju høydene
                    </DragHint>
                </>
            }
            scene={
                <RomeScene
                    settled={settled}
                    drain={drain}
                    won={won}
                    allSettled={allSettled}
                    burst={burst}
                    onSettle={settle}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!won ? (
                    <>
                        {allSettled ? (
                            <SceneSlider
                                label="Tørrlegg sumpen og reis Forum"
                                min={0}
                                max={1}
                                step={0.01}
                                value={drain}
                                onChange={onDrain}
                                valueLabel={(v) => `${Math.round(v * 100)} % tørrlagt`}
                            />
                        ) : (
                            <p className="text-sm text-slate-600 leading-snug">
                                Klikk de pulserende ringene over hver høyde. Folk slår seg ned på{' '}
                                <span className="font-bold text-amber-700">høydene</span> fordi de er
                                trygge å forsvare, og nær{' '}
                                <span className="font-bold text-sky-700">elven Tiberen</span> som gir
                                handel med salt og varer.
                            </p>
                        )}
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen title="Roma er grunnlagt!" onReplay={reset}>
                        Du bygde ikke Roma på én dag, og ikke med én mann. Sju små landsbyer på hver
                        sin høyde vokste sakte sammen til én by, fordi stedet var perfekt: høydene ga
                        forsvar, og elven Tiberen ga handel. Da sumpen ble tørrlagt, ble den til
                        Forum, det felles torget der alle møtes. Det er det arkeologene ser, bak
                        myten om Romulus og ulvinnen.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function RomeScene({
    settled,
    drain,
    won,
    allSettled,
    burst,
    onSettle,
}: {
    settled: boolean[];
    drain: number;
    won: boolean;
    allSettled: boolean;
    burst: number;
    onSettle: (i: number) => void;
}) {
    return (
        <group>
            {/* Tørt sletteland langs elven */}
            <GroundPlane size={56} depth={50} color="#94a059" />

            {/* Elven Tiberen i vest, med handelsbåter */}
            <River />

            {/* Sumpen i midten som blir tørrlagt til Forum */}
            <MarshForum drain={drain} won={won} />

            {/* De sju høydene med landsbyer */}
            {HILLS.map((hill, i) => (
                <group key={hill.name} position={[hill.pos[0], 0, hill.pos[1]]}>
                    <HillMound color={hill.leaf} />
                    <Village hill={hill} grown={settled[i]} />
                    {!settled[i] && !allSettled && (
                        <Hotspot
                            position={[0, 2.15, 0]}
                            onSelect={() => onSettle(i)}
                            label={hill.name}
                            radius={0.55}
                            color="#b45309"
                        />
                    )}
                    <Burst
                        position={[0, 1.7, 0]}
                        trigger={settled[i] ? burst : 0}
                        color="#e7c9a0"
                        count={16}
                        spread={1.8}
                    />
                </group>
            ))}

            {/* Bymuren reiser seg når byen er samlet */}
            <CityRampart raised={won} />
        </group>
    );
}

// En høyde: avkortet kjegle med flat topp og litt skog i skråningen.
function HillMound({ color }: { color: string }) {
    return (
        <group>
            <mesh position={[0, 0.625, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[1.0, 1.95, 1.25, 7]} />
                <meshStandardMaterial color={color} roughness={1} flatShading />
            </mesh>
            <Tree position={[1.25, 0.5, 0.5]} leaf="#3f6b39" seed={2} />
            <Tree position={[-1.1, 0.45, -0.7]} leaf="#447040" seed={7} />
        </group>
    );
}

// Landsbyen på toppen av en høyde. Vokser inn når eleven klikker høyden.
function Village({ hill, grown }: { hill: HillSpec; grown: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const target = grown ? 1 : 0.0001;
        const s = damp(ref.current.scale.x, target, dt, 7);
        ref.current.scale.setScalar(s);
    });
    return (
        <group ref={ref} position={[0, HILL_TOP, 0]} scale={0.0001}>
            <Building
                position={[-0.4, 0, 0.2]}
                body={hill.body}
                roof="#5c3326"
                w={0.7}
                h={0.55}
                d={0.6}
                seed={hill.seed}
            />
            <Building
                position={[0.45, 0, -0.25]}
                body={hill.body}
                roof="#54402b"
                w={0.62}
                h={0.5}
                d={0.55}
                seed={hill.seed + 1}
            />
            <Building
                position={[0.1, 0, 0.6]}
                body={hill.body}
                roof="#5c3326"
                w={0.55}
                h={0.45}
                d={0.5}
                seed={hill.seed + 2}
            />
            <Person position={[0.0, 0, -0.05]} scale={0.7} body="#7a5a36" pose="idle" />
        </group>
    );
}

// Elven Tiberen i vest med to handelsbåter (salt og varer fra kysten).
function River() {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        if (mat.current) {
            mat.current.emissiveIntensity = 0.12 + Math.sin(clock.getElapsedTime() * 1.1) * 0.05;
        }
    });
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7.6, 0.04, -1]}>
                <planeGeometry args={[4.6, 30]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#3d7fa6"
                    roughness={0.3}
                    metalness={0.15}
                    emissive="#1e4d6b"
                    emissiveIntensity={0.14}
                />
            </mesh>
            <Boat position={[-7.4, 0.18, 2.5]} rotation={[0, 0.3, 0]} color="#7a5230" sail="#e7dcc4" />
            <Boat position={[-7.9, 0.18, -4.5]} rotation={[0, -0.2, 0]} color="#6f4a2c" sail="#ded2b6" />
        </group>
    );
}

// Sumpen i midten. Når drain stiger: vannet synker, Forum-torget hever seg,
// søyler og en markedsbod reiser seg, og folk samles på torget.
function MarshForum({ drain, won }: { drain: number; won: boolean }) {
    const water = useRef<THREE.Group>(null);
    const forum = useRef<THREE.Group>(null);
    const builds = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (water.current) {
            water.current.position.y = damp(water.current.position.y, 0.16 - drain * 1.4, dt, 5);
        }
        if (forum.current) {
            forum.current.position.y = damp(forum.current.position.y, -0.55 + drain * 0.6, dt, 5);
        }
        if (builds.current) {
            const target = Math.max(0.0001, Math.min(1, (drain - 0.4) / 0.5));
            const s = damp(builds.current.scale.x, target, dt, 6);
            builds.current.scale.setScalar(s);
        }
    });
    return (
        <group position={[0, 0, -0.4]}>
            {/* Forum-torget som hever seg under sumpen */}
            <group ref={forum} position={[0, -0.55, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                    <circleGeometry args={[2.7, 36]} />
                    <meshStandardMaterial color="#d8c9a3" roughness={1} />
                </mesh>
            </group>

            {/* Myrvannet som synker */}
            <group ref={water} position={[0, 0.16, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[2.75, 36]} />
                    <meshStandardMaterial
                        color="#5e7a52"
                        roughness={0.4}
                        metalness={0.1}
                        emissive="#2d3f24"
                        emissiveIntensity={0.18}
                        transparent
                        opacity={0.92}
                    />
                </mesh>
            </group>

            {/* Forum-bygg: søyler, markedsbod og folk, skalerer inn når tørrlagt */}
            <group ref={builds} scale={0.0001}>
                <Column position={[-1.3, 0, -1.2]} height={1.5} radius={0.16} color="#e7dcc4" />
                <Column position={[-0.5, 0, -1.4]} height={1.5} radius={0.16} color="#e7dcc4" />
                <Column position={[0.3, 0, -1.4]} height={1.5} radius={0.16} color="#e7dcc4" />
                <Column position={[1.1, 0, -1.2]} height={1.5} radius={0.16} color="#e7dcc4" />
                <MarketStall position={[0.9, 0, 1.0]} rotation={[0, -0.4, 0]} />
                <MarketStall position={[-1.0, 0, 0.9]} rotation={[0, 0.5, 0]} />
                <Person position={[0.1, 0, 0.4]} scale={0.7} body="#8a3f2c" pose="walk" />
                <Person position={[-0.4, 0, 0.0]} scale={0.7} body="#6f5a8a" pose="idle" />
                <Person position={[0.6, 0, -0.3]} scale={0.7} body="#3f6b6f" pose="walk" />
                {won && (
                    <Burst position={[0, 1.4, 0]} trigger={1} color="#ffd98a" count={24} spread={3} />
                )}
            </group>
        </group>
    );
}

// Bymuren rundt hele byen. Reiser seg (skala-Y) når byen er samlet.
const RAMPART_R = 6.7;
const VERTS = Array.from({ length: 8 }, (_, k) => k * (Math.PI / 4));
const SEGS = Array.from({ length: 8 }, (_, k) => k * (Math.PI / 4) + Math.PI / 8);

function CityRampart({ raised }: { raised: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const target = raised ? 1 : 0.0001;
        ref.current.scale.y = damp(ref.current.scale.y, target, dt, 4);
    });
    return (
        <group ref={ref} scale={[1, 0.0001, 1]}>
            {SEGS.map((a, k) => (
                <Wall
                    key={`w${k}`}
                    position={[Math.sin(a) * RAMPART_R, 0, Math.cos(a) * RAMPART_R]}
                    rotation={[0, a, 0]}
                    length={5.3}
                    height={1.7}
                    thickness={0.5}
                    color="#cdbb94"
                    crenellations
                />
            ))}
            {VERTS.map((a, k) => (
                <Tower
                    key={`t${k}`}
                    position={[Math.sin(a) * RAMPART_R, 0, Math.cos(a) * RAMPART_R]}
                    radius={0.55}
                    height={2.2}
                    color="#c3b088"
                    roof="#8a5a3a"
                />
            ))}
        </group>
    );
}

export default DeSjuHoydene3D;
