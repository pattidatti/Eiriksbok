import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    GroundPlane,
    WaterPlane,
    Tree,
    Rock,
    Figure,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    StepTracker,
    DataReadout,
    damp,
    Burst,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til Mesopotamia. Eleven graver kanaler fra Eufrat og Tigris ut til
// tørre åkrer midt på sletta. For hver kanal renner vannet ut, jorda blir grønn,
// og kornet spirer. Når alle åkrene har vann, reiser byen seg i midten - en
// ziggurat vokser lag for lag.
//
// Lyspæra (rett fra artikkelen): elvene flommet til feil tid og kunne være
// farlige, så bøndene MÅTTE grave kanaler for å styre vannet. Det krevde at
// mange mennesker samarbeidet. Det samarbeidet, og matoverskuddet kanalene ga,
// er en av hovedgrunnene til at verdens første byer vokste fram nettopp her.
//
// Mekanikk (direkte 3D-klikk + voksende verden):
//   - Klikk en pulserende Hotspot over en tørr åker for å grave en kanal.
//   - Kanalen vokser fra elva ut til åkeren, jorda damper fra brun til grønn,
//     og kornaks spirer fram.
//   - Byen i midten vokser for hver vannet åker. Alle åkre vannet => byen står.

interface FieldSpec {
    x: number;
    z: number;
    side: -1 | 1; // hvilken elv kanalen kommer fra
}

// Seks åkrer, tre på hver side, mellom de to elvene.
const FIELDS: FieldSpec[] = [
    { x: -4.2, z: 3.0, side: -1 },
    { x: -4.0, z: 0.0, side: -1 },
    { x: -4.2, z: -3.0, side: -1 },
    { x: 4.2, z: 3.0, side: 1 },
    { x: 4.0, z: 0.0, side: 1 },
    { x: 4.2, z: -3.0, side: 1 },
];
const TOTAL = FIELDS.length;
const RIVER_X = 7.0; // avstand fra midten til hver elv
const RIVER_EDGE = RIVER_X - 1.1; // indre bredd der kanalen starter

// Korte fakta som dukker opp etter hvert som eleven graver - for en 14-åring.
const FACTS = [
    'Vannet renner ut til åkeren, og den tørre jorda blir grønn. Nå kan bonden dyrke bygg her.',
    'Flere kanaler gir mer mat. Men kanalene gror fort igjen, så de må holdes ved like hele tiden.',
    'For å grave og passe alle kanalene måtte mange mennesker samarbeide. Det bandt folk sammen.',
    'Matoverskuddet gjør at ikke alle trenger å dyrke jorda. Noen kan bli håndverkere, prester eller skrivere.',
    'Nok mat på ett sted lar tusenvis bo tett sammen. Slik vokser den første byen fram.',
];

const DRY_SOIL = new THREE.Color('#a17c45');
const WET_SOIL = new THREE.Color('#5d9b34');

function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
}

const Kanalbyggeren3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const ambience = useAmbience('wind');
    const [watered, setWatered] = useState<boolean[]>(() => FIELDS.map(() => false));
    const [banner, setBanner] = useState<string | null>(
        'Sletta er tørr. Klikk den pulserende ringen over en åker for å grave en kanal fra elva.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([0, 0.6, 0]);

    const count = watered.filter(Boolean).length;
    const done = count >= TOTAL;
    const progress = count / TOTAL;

    const reset = () => {
        setWatered(FIELDS.map(() => false));
        setBanner(
            'Sletta er tørr. Klikk den pulserende ringen over en åker for å grave en kanal fra elva.'
        );
        setFact(null);
    };

    const digCanal = (i: number) => {
        if (watered[i] || done) return;
        ambience.start();
        const next = watered.slice();
        next[i] = true;
        const newCount = next.filter(Boolean).length;
        setWatered(next);
        setBurstPos([FIELDS[i].x, 0.6, FIELDS[i].z]);
        setBurst((b) => b + 1);
        if (newCount >= TOTAL) {
            sounds.play('complete');
            setBanner(null);
            setFact(null);
        } else {
            sounds.play('advance');
            setFact(FACTS[Math.min(newCount - 1, FACTS.length - 1)]);
            setBanner('Bra! Klikk en ny tørr åker for å grave neste kanal.');
        }
    };

    useEffect(() => {
        if (!done) return;
        const t = setTimeout(() => onComplete({ score: 1, completed: true }), 350);
        return () => clearTimeout(t);
    }, [done, onComplete]);

    const idle = count === 0;

    return (
        <MicroGameScaffold
            title="Grav kanalene i Sumer"
            subtitle="Led vannet fra Eufrat og Tigris ut til de tørre åkrene - og se den første byen reise seg"
            estimatedSeconds={130}
            onRetry={count > 0 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 8.5, 13], fov: 42 },
                background: '#e7d3a4',
                fog: { near: 24, far: 58 },
                target: [0, 0.6, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Byen Uruk reiser seg' : 'Sumer, 3500 fvt'}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Vannede åkrer', value: `${count} / ${TOTAL}` },
                                {
                                    label: 'Matoverskudd',
                                    value: Math.round(progress * 100),
                                    unit: '%',
                                },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Klikk en åker for å grave kanal
                    </DragHint>
                </>
            }
            scene={
                <Plain
                    watered={watered}
                    progress={progress}
                    burst={burst}
                    burstPos={burstPos}
                    onDig={digCanal}
                    done={done}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done && <StepTracker current={count} total={TOTAL} />}

                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Klikk den blå{' '}
                            <span className="font-bold text-sky-700">ringen</span> over hver tørre
                            åker. Da graver du en kanal fra elva, og vannet får jorda til å gro. Når
                            alle åkrene har vann, har byen nok mat til å vokse fram.
                        </p>
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen title="Sletta er grønn, og byen står!" onReplay={reset}>
                        Du styrte vannet fra elvene ut til åkrene. Elvene flommet til feil tid og
                        kunne være farlige, så bøndene måtte grave kanaler for å styre vannet selv.
                        Det krevde at mange mennesker samarbeidet. Samarbeidet, og maten kanalene ga,
                        er en av hovedgrunnene til at verdens første byer vokste fram nettopp her i
                        Mesopotamia.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Plain({
    watered,
    progress,
    burst,
    burstPos,
    onDig,
    done,
}: {
    watered: boolean[];
    progress: number;
    burst: number;
    burstPos: [number, number, number];
    onDig: (i: number) => void;
    done: boolean;
}) {
    return (
        <group>
            {/* Tørr slette mellom elvene */}
            <GroundPlane size={52} depth={42} color="#d8bd86" />

            {/* De to elvene - Eufrat og Tigris */}
            <WaterPlane position={[-RIVER_X, 0.02, 0]} size={[2.4, 42]} />
            <WaterPlane position={[RIVER_X, 0.02, 0]} size={[2.4, 42]} />

            {/* Åkrer med kanaler */}
            {FIELDS.map((f, i) => (
                <Field key={i} spec={f} watered={watered[i]} />
            ))}

            {/* Byen i midten - vokser for hver vannet åker */}
            <CityCenter progress={progress} />

            {/* Litt liv langs elvebreddene - på land, med klaring til vannet
                (elvene dekker x 5.8..8.2; trær/figurer sto tidligere uti vannet) */}
            <Tree position={[-5.2, 0, 6.8]} leaf="#5a7a36" />
            <Tree position={[5.2, 0, -6.6]} leaf="#5a7a36" />
            <Rock position={[-2.0, 0, 6.4]} color="#c3b48c" scale={0.9} />
            <Rock position={[2.4, 0, -6.0]} color="#bcad85" scale={1.1} />
            <Figure position={[-3.0, 0, 4.9]} body="#7a5a36" skin="#d8a878" />
            <Figure position={[3.4, 0, -5.6]} body="#6b5436" skin="#c79468" />

            {/* Hotspots over de tørre åkrene */}
            {!done &&
                FIELDS.map((f, i) =>
                    watered[i] ? null : (
                        <Hotspot
                            key={`h${i}`}
                            position={[f.x, 1.35, f.z]}
                            onSelect={() => onDig(i)}
                            label="Grav kanal"
                            radius={0.62}
                            color="#0ea5e9"
                        />
                    )
                )}

            {/* Suksess-partikler der kornet spirer */}
            <Burst position={burstPos} trigger={burst} color="#7ec850" count={22} spread={2.2} />
        </group>
    );
}

// Korn-aksene fordeles i et lite rutenett inne i åkeren.
const WHEAT_OFFSETS: [number, number][] = [
    [-0.7, -0.7],
    [0, -0.7],
    [0.7, -0.7],
    [-0.7, 0],
    [0, 0],
    [0.7, 0],
    [-0.7, 0.7],
    [0, 0.7],
    [0.7, 0.7],
];

// En åker med en kanal som vokser inn fra elva. Jorda damper brun -> grønn og
// kornaksene spirer fram når åkeren får vann. Alt drives av watered-propen.
function Field({ spec, watered }: { spec: FieldSpec; watered: boolean }) {
    const soil = useRef<THREE.MeshStandardMaterial>(null);
    const canal = useRef<THREE.Group>(null);
    const wheat = useRef<THREE.Group>(null);

    const innerX = spec.side * RIVER_EDGE;
    const len = Math.abs(spec.x - innerX);
    const dir = Math.sign(spec.x - innerX);

    useFrame((_, dt) => {
        const k = Math.min(1, dt * 2.5);
        if (soil.current) soil.current.color.lerp(watered ? WET_SOIL : DRY_SOIL, k);
        if (canal.current) canal.current.scale.x = damp(canal.current.scale.x, watered ? 1 : 0, dt, 4);
        if (wheat.current) {
            const s = damp(wheat.current.scale.x, watered ? 1 : 0, dt, 4);
            wheat.current.scale.set(s, s, s);
        }
    });

    return (
        <group>
            {/* Kanalen - forankret ved elva, vokser ut mot åkeren */}
            <group ref={canal} position={[innerX, 0.05, spec.z]} scale={[0, 1, 1]}>
                <mesh position={[(dir * len) / 2, 0, 0]}>
                    <boxGeometry args={[len, 0.12, 0.55]} />
                    <meshStandardMaterial
                        color="#3d7fa6"
                        roughness={0.35}
                        metalness={0.12}
                        emissive="#1e4d6b"
                        emissiveIntensity={0.22}
                    />
                </mesh>
            </group>

            {/* Selve jordlappen */}
            <mesh
                position={[spec.x, 0.04, spec.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[2.6, 2.6]} />
                <meshStandardMaterial ref={soil} color="#a17c45" roughness={1} />
            </mesh>

            {/* Kornaks som spirer når åkeren får vann */}
            <group ref={wheat} position={[spec.x, 0, spec.z]} scale={[0, 0, 0]}>
                {WHEAT_OFFSETS.map((o, k) => (
                    <mesh key={k} position={[o[0], 0.4, o[1]]} castShadow>
                        <coneGeometry args={[0.11, 0.8, 5]} />
                        <meshStandardMaterial color="#c9b347" roughness={0.85} flatShading />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// Byen i midten: en ziggurat som vokser lag for lag når flere åkrer får vann.
function CityCenter({ progress }: { progress: number }) {
    return (
        <group position={[0, 0, 0.4]}>
            {/* Lavt mudderbrikke-fundament som ligger der fra start */}
            <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
                <boxGeometry args={[4.0, 0.16, 4.0]} />
                <meshStandardMaterial color="#b79a63" roughness={1} />
            </mesh>

            <Tier y={0.16} w={3.2} h={0.9} show={clamp01(progress / 0.34)} color="#c08a4a" />
            <Tier y={1.06} w={2.2} h={0.8} show={clamp01((progress - 0.34) / 0.33)} color="#cb965a" />
            <Tier y={1.86} w={1.2} h={0.7} show={clamp01((progress - 0.67) / 0.33)} color="#d8a96a" />

            {/* Lite tempel på toppen når byen er ferdig */}
            <Shrine y={2.56} show={clamp01((progress - 0.92) / 0.08)} />
        </group>
    );
}

// Ett trinn i zigguraten. Vokser oppover fra sin egen base via scale.y.
// Skjules helt når skalaen er ~0: en boks med scale.y = 0 tegnes fortsatt som
// et flatt, svevende plan (og z-fighter mot fundamentet), så uten visible-vakt
// hang alle trinnene synlig i lufta før eleven hadde gravd noe.
function Tier({
    y,
    w,
    h,
    show,
    color,
}: {
    y: number;
    w: number;
    h: number;
    show: number;
    color: string;
}) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!g.current) return;
        g.current.scale.y = damp(g.current.scale.y, show, dt, 3);
        g.current.visible = g.current.scale.y > 0.02;
    });
    return (
        <group ref={g} position={[0, y, 0]} scale={[1, 0, 1]} visible={false}>
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, h, w]} />
                <meshStandardMaterial color={color} roughness={0.92} flatShading />
            </mesh>
        </group>
    );
}

// Lite tempelskur på toppen av zigguraten.
function Shrine({ y, show }: { y: number; show: number }) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (g.current) {
            const s = damp(g.current.scale.x, show, dt, 4);
            g.current.scale.set(s, s, s);
            g.current.visible = s > 0.02;
        }
    });
    return (
        <group ref={g} position={[0, y, 0]} scale={[0, 0, 0]} visible={false}>
            <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.7, 0.6, 0.7]} />
                <meshStandardMaterial color="#e6c98a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.72, 0]} castShadow>
                <coneGeometry args={[0.55, 0.4, 4]} />
                <meshStandardMaterial color="#a86f3c" roughness={0.9} />
            </mesh>
        </group>
    );
}

export default Kanalbyggeren3D;
