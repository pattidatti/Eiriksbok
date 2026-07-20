import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    Tower,
    Boat,
    Hill,
    WaterMaterial,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    SceneFact,
    StepTracker,
    WinScreen,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om det portugisiske sjøimperiet.
//
// Lyspære: Portugal var et lite land, men kontrollerte verdenshandelen ved å
// plassere befestede handelsstasjoner ved knutepunktene langs sjøveien til India
// - ikke ved å erobre store landområder. Eleven bygger kjeden av festninger
// langs ruten, ser ruten lyse opp etappe for etappe og krydderskipet seile
// videre, og kjenner således thalassokratiet (sjøimperiet) på kroppen.

interface SeaNode {
    name: string;
    year: string;
    pos: [number, number, number];
    fact: string;
}

const LISBOA: [number, number, number] = [-6, 0.12, -6.5];

const NODES: SeaNode[] = [
    {
        name: 'Ceuta',
        year: '1415',
        pos: [-5, 0.12, -4],
        fact: 'Ceuta i Nord-Afrika ble erobret i 1415. Det var startskuddet. Herfra kunne Portugal sikre skipene sine og lære om handelen sørover.',
    },
    {
        name: 'Elmina',
        year: '1482',
        pos: [-3, 0.12, 1],
        fact: 'På Gullkysten bygde de festningen Elmina. Her byttet de til seg gull, og senere mennesker. Festningen voktet havnen mot andre europeere.',
    },
    {
        name: 'Kapp det gode håp',
        year: '1488',
        pos: [-1.5, 0.12, 5.5],
        fact: 'I 1488 rundet Bartolomeu Dias sørspissen av Afrika. Nå lå veien til Det indiske hav åpen.',
    },
    {
        name: 'Goa',
        year: '1510',
        pos: [4, 0.12, 1.5],
        fact: 'I Goa tok Portugal kontroll over krydderkilden. Her kjøpte de pepper og kanel direkte, uten arabiske mellomledd.',
    },
    {
        name: 'Malakka',
        year: '1511',
        pos: [7.5, 0.12, -1],
        fact: 'Malakka var porten til krydderøyene. Den som styrte dette sundet, styrte halve verdenshandelen.',
    },
];

// Hele ruten: hjemmehavn + de fem knutepunktene.
const PATH: [number, number, number][] = [LISBOA, ...NODES.map((n) => n.pos)];

// Lavpoly-kontinenter (flate blobber) som leser som et kart sett ovenfra.
const LAND: { pos: [number, number, number]; r: number; color: string }[] = [
    // Iberia / Europa
    { pos: [-6.8, -0.2, -8.2], r: 2.6, color: '#cdb892' },
    { pos: [-4.6, -0.2, -7.4], r: 1.8, color: '#c6b083' },
    // Afrika (vest- og sørkysten ligger inntil ruten)
    { pos: [2.2, -0.2, 1.6], r: 3.6, color: '#cdb892' },
    { pos: [0.4, -0.2, 4.6], r: 2.4, color: '#c6b083' },
    { pos: [-0.4, -0.2, 6.3], r: 1.5, color: '#cdb892' },
    { pos: [3.4, -0.2, -1.6], r: 2.2, color: '#c6b083' },
    // India
    { pos: [5.8, -0.2, 0.4], r: 2.0, color: '#cdb892' },
    { pos: [6.4, -0.2, 2.0], r: 1.5, color: '#c6b083' },
    // Sørøst-Asia / Malayahalvøya
    { pos: [9.4, -0.2, -2.8], r: 2.2, color: '#cdb892' },
];

const Sjoimperiet3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [placed, setPlaced] = useState(0);
    const [fact, setFact] = useState<string | null>(null);
    const [won, setWon] = useState(false);
    const [burst, setBurst] = useState(0);

    const reset = () => {
        setPlaced(0);
        setFact(null);
        setWon(false);
    };

    const place = () => {
        const idx = placed; // knutepunktet som bygges nå (0-basert)
        setFact(NODES[idx].fact);
        const next = idx + 1;
        setPlaced(next);
        if (next >= NODES.length) {
            sounds.play('complete');
            setWon(true);
            setBurst((b) => b + 1);
            setTimeout(() => onComplete({ score: 1, completed: true }), 350);
        } else {
            sounds.play('correct');
        }
    };

    const banner = won
        ? 'Sjøimperiet står! Krydderet flyter hjem til Lisboa.'
        : `Klikk knutepunktet ved ${NODES[placed].name} for å bygge festningen.`;

    const badge = won ? 'Krydderhandelen sikret' : placed > 0 ? NODES[placed - 1].year : 'Sagres, 1400-tallet';

    // Skipet seiler langs ruten etter hvert som festningene reises. Når alt er
    // bygd, vender det hjem til Lisboa med last (krydderet flyter tilbake).
    const shipTarget = won ? LISBOA : PATH[Math.min(placed, PATH.length - 1)];

    return (
        <MicroGameScaffold
            title="Bygg sjøimperiet"
            subtitle="Reis kjeden av festninger langs sjøveien til India og styr krydderhandelen"
            estimatedSeconds={150}
            onRetry={placed > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 17, 13], fov: 42 },
                target: [0.5, 0, 0],
                background: '#bfe0f2',
                light: 'golden',
                minPolarAngle: 0.15,
                maxPolarAngle: 1.05,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{badge}</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Festninger', value: `${placed}/${NODES.length}` },
                            { label: 'Krydderrute', value: Math.round((placed / NODES.length) * 100), unit: '%' },
                        ]}
                    />
                    <DragHint show={placed === 0} corner="bc">
                        Klikk den pulserende ringen for å bygge
                    </DragHint>
                </>
            }
            scene={
                <SeaMap placed={placed} shipTarget={shipTarget} burst={burst} onPlace={place} won={won} />
            }
        >
            <div className="flex flex-col gap-2.5">
                <StepTracker current={placed} total={NODES.length} />
                {!won && (
                    <p className="text-sm text-slate-600">
                        Portugal var for lite til å erobre land. I stedet bygde de et sjøimperium:
                        en kjede av befestede havner ved knutepunktene. Klikk det neste punktet langs
                        ruten for å reise festningen der.
                    </p>
                )}
                {fact && <SceneFact>{fact}</SceneFact>}
                {won && (
                    <WinScreen title="Du bygde et sjøimperium!" onReplay={reset}>
                        Et lite land styrte krydderhandelen ved å kontrollere knutepunktene langs
                        sjøveien, ikke ved å erobre store landområder. Det kalles et thalassokrati
                        - et rike bygd på havet.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

function SeaMap({
    placed,
    shipTarget,
    burst,
    onPlace,
    won,
}: {
    placed: number;
    shipTarget: [number, number, number];
    burst: number;
    onPlace: () => void;
    won: boolean;
}) {
    return (
        <group>
            {/* Havet med ekte bølger */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, -0.06, 0]} receiveShadow>
                <planeGeometry args={[34, 30, 48, 48]} />
                <WaterMaterial color="#3d7fa6" waveHeight={0.08} waveScale={0.5} />
            </mesh>

            {/* Kontinenter */}
            {LAND.map((l, i) => (
                <Hill key={i} position={l.pos} radius={l.r} height={0.55} color={l.color} seed={i + 2} />
            ))}

            {/* Ruten: etappe for etappe lyser den opp idet festningene reises */}
            {PATH.slice(0, -1).map((a, i) => (
                <RouteLeg key={i} a={a} b={PATH[i + 1]} lit={placed > i} />
            ))}

            {/* Hjemmehavnen Lisboa */}
            <group position={[LISBOA[0], 0, LISBOA[2]]}>
                <Tower position={[0, 0, 0]} radius={0.45} height={1.6} color="#e6dcc4" roof="#b23b2e" />
                <mesh position={[0.9, 0.15, 0.4]} castShadow>
                    <boxGeometry args={[0.7, 0.5, 0.7]} />
                    <meshStandardMaterial color="#d8cba8" roughness={0.9} />
                </mesh>
                <Burst position={[0, 2, 0]} trigger={burst} />
            </group>

            {/* Festningene langs ruten */}
            {NODES.map((n, i) => (
                <Fort key={n.name} position={[n.pos[0], 0, n.pos[2]]} active={placed > i} />
            ))}

            {/* Krydderskipet seiler langs ruten */}
            <Caravel target={shipTarget} />

            {/* Neste klikkbare knutepunkt */}
            {!won && placed < NODES.length && (
                <Hotspot
                    position={[NODES[placed].pos[0], 0.7, NODES[placed].pos[2]]}
                    onSelect={onPlace}
                    radius={0.6}
                    label={`Bygg festning: ${NODES[placed].name}`}
                />
            )}
        </group>
    );
}

// En etappe av sjøruten. En svak grunnstrek alltid, og en gyllen glød som
// demper inn når etappen er sikret av en festning.
function RouteLeg({
    a,
    b,
    lit,
}: {
    a: [number, number, number];
    b: [number, number, number];
    lit: boolean;
}) {
    const matRef = useRef<THREE.MeshBasicMaterial>(null);
    const { pos, rotY, len } = useMemo(() => {
        const dx = b[0] - a[0];
        const dz = b[2] - a[2];
        const length = Math.hypot(dx, dz);
        return {
            pos: [(a[0] + b[0]) / 2, 0.14, (a[2] + b[2]) / 2] as [number, number, number],
            rotY: Math.atan2(dx, dz),
            len: length,
        };
    }, [a, b]);

    useFrame((_, dt) => {
        if (matRef.current) {
            matRef.current.opacity = damp(matRef.current.opacity, lit ? 0.95 : 0, dt, 5);
        }
    });

    return (
        <group position={pos} rotation={[0, rotY, 0]}>
            <mesh>
                <boxGeometry args={[0.1, 0.02, len]} />
                <meshBasicMaterial color="#5b6b82" transparent opacity={0.3} />
            </mesh>
            <mesh position={[0, 0.015, 0]}>
                <boxGeometry args={[0.18, 0.03, len]} />
                <meshBasicMaterial ref={matRef} color="#f5b301" transparent opacity={0} toneMapped={false} />
            </mesh>
        </group>
    );
}

// En festning som reiser seg fra havflaten når den blir bygd.
function Fort({ position, active }: { position: [number, number, number]; active: boolean }) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (g.current) {
            const s = damp(g.current.scale.x, active ? 1 : 0, dt, 6);
            g.current.scale.setScalar(s);
        }
    });
    return (
        <group ref={g} position={position} scale={0}>
            {/* Kai/plattform */}
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.7, 0.8, 0.2, 8]} />
                <meshStandardMaterial color="#b8a279" roughness={0.95} />
            </mesh>
            <Tower position={[0, 0.2, 0]} radius={0.42} height={1.2} color="#e6dcc4" roof="#b23b2e" />
        </group>
    );
}

// Krydderskipet (karavell) som glir langs ruten.
function Caravel({ target }: { target: [number, number, number] }) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (g.current) {
            g.current.position.x = damp(g.current.position.x, target[0], dt, 2.2);
            g.current.position.z = damp(g.current.position.z, target[2], dt, 2.2);
        }
    });
    return (
        <group ref={g} position={[target[0], 0.18, target[2]]}>
            <Boat color="#6b4a2c" sail="#f4efe2" />
        </group>
    );
}

export default Sjoimperiet3D;
