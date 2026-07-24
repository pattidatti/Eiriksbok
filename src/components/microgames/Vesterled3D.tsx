import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Seascape,
    Boat,
    Hotspot,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    WinScreen,
    Burst,
    damp,
    faceAlong,
    useAmbience,
} from './kit';
import type { MicroGameProps } from './types';

// Mikrospill: Vesterled. Eleven seiler den norrøne ruten vestover ved å hoppe
// fra land til land - Norge -> Island -> Grønland -> Vinland. Lyspæra:
// nordboerne nådde Amerika ikke ved ETT langt sprang over Atlanteren, men ved
// å hoppe fra øy til øy. Hver etappe er en kort tur; hele veien blir mulig.

const WATER_Y = 0.06;

interface Landfall {
    id: string;
    name: string;
    pos: [number, number, number];
    legKm: number; // åpent hav fra forrige land
    fact: string;
}

// Øst (Norge, +X) til vest (Vinland, -X). Baugen peker +Z.
const LANDFALLS: Landfall[] = [
    { id: 'norge', name: 'Norge', pos: [9, WATER_Y, 3], legKm: 0, fact: 'Start: Norge. Herfra dro nordboerne vestover.' },
    { id: 'island', name: 'Island', pos: [3.5, WATER_Y, -2.5], legKm: 1000, fact: 'Island: rundt 1000 km åpent hav. Nordboerne bosatte øya fra rundt 870.' },
    { id: 'gronland', name: 'Grønland', pos: [-2, WATER_Y, 3], legKm: 1400, fact: 'Grønland: Eirik Raude grunnla bosetninger her rundt 985.' },
    { id: 'vinland', name: 'Vinland', pos: [-8.5, WATER_Y, -1.5], legKm: 1800, fact: 'Vinland! Leiv Eiriksson nådde Nord-Amerika rundt år 1000 - lenge før Columbus.' },
];

// Båten ankrer på vannet like utenfor øya (øyene er ~2.2 i radius), på den siden
// den kommer inn fra - da krysser seilasen aldri land. Norge (start) ankrer på
// avreisesiden, mot Island.
const ANCHOR_OFFSET = 3.8;
const ANCHORS: [number, number, number][] = LANDFALLS.map((lf, i) => {
    const other = i === 0 ? LANDFALLS[1].pos : LANDFALLS[i - 1].pos;
    const dx = other[0] - lf.pos[0];
    const dz = other[2] - lf.pos[2];
    const len = Math.hypot(dx, dz) || 1;
    return [lf.pos[0] + (dx / len) * ANCHOR_OFFSET, WATER_Y, lf.pos[2] + (dz / len) * ANCHOR_OFFSET];
});

const Vesterled3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    // Hvilket land båten hviler ved (0..3), og hvor den seiler (null = i ro).
    const [atIndex, setAtIndex] = useState(0);
    const [targetIndex, setTargetIndex] = useState<number | null>(null);
    const [banner, setBanner] = useState<string | null>(LANDFALLS[0].fact);
    const [longestLeg, setLongestLeg] = useState(0);
    const [won, setWon] = useState(false);
    const [burst, setBurst] = useState(0);

    const ambience = useAmbience('waves');

    const sailing = targetIndex !== null;
    const done = won;

    const sailTo = (i: number) => {
        if (sailing || won) return;
        ambience.start();
        setTargetIndex(i);
        setBanner(null);
    };

    const handleArrive = () => {
        if (targetIndex === null) return;
        const arrived = LANDFALLS[targetIndex];
        setLongestLeg((v) => Math.max(v, arrived.legKm));
        setBanner(arrived.fact);
        setAtIndex(targetIndex);
        setTargetIndex(null);
        if (targetIndex === LANDFALLS.length - 1) {
            setWon(true);
            setBurst((b) => b + 1);
            onComplete({ score: 1, completed: true, artifact: { route: 'vesterled' } });
        }
    };

    const reset = () => {
        setAtIndex(0);
        setTargetIndex(null);
        setBanner(LANDFALLS[0].fact);
        setLongestLeg(0);
        setWon(false);
    };

    // Retningen båten peker: langs inneværende etappe (ellers behold forrige).
    const heading = (() => {
        const next = targetIndex ?? atIndex + 1;
        const [from, to] =
            next < LANDFALLS.length
                ? [ANCHORS[atIndex], ANCHORS[next]]
                : [ANCHORS[atIndex - 1], ANCHORS[atIndex]];
        return faceAlong([to[0] - from[0], to[2] - from[2]]);
    })();

    return (
        <MicroGameScaffold
            title="Vesterled: sjøveien til Amerika"
            subtitle="Seil fra land til land. Klikk neste øy for å legge ut på etappen."
            estimatedSeconds={110}
            onRetry={atIndex > 0 || sailing ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 16, 20], fov: 42 },
                background: '#cfe6f4',
                target: [0, 0, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Vesterled ~ år 1000</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Etapper', value: `${atIndex}/3` },
                            { label: 'Lengste sprang', value: longestLeg, unit: 'km' },
                        ]}
                    />
                    <DragHint show={atIndex === 0 && !sailing}>
                        Klikk den pulserende ringen ved Island for å seile dit
                    </DragHint>
                </>
            }
            scene={
                <RouteScene
                    atIndex={atIndex}
                    targetIndex={targetIndex}
                    heading={heading}
                    sailing={sailing}
                    won={won}
                    burst={burst}
                    onArrive={handleArrive}
                    onSail={sailTo}
                />
            }
        >
            {done ? (
                <WinScreen title="Du nådde Vinland!" onReplay={reset}>
                    Nordboerne krysset aldri Atlanteren i ett sprang. De hoppet fra øy til øy -
                    Island, så Grønland, så Vinland. Hver etappe var rundt 1000 til 1800 km. Rett
                    over havet fra Norge ville vært over 3000 km åpent hav på en gang. Derfor var
                    det øyene som gjorde reisen mulig.
                </WinScreen>
            ) : (
                <p className="text-center text-sm text-slate-600">
                    Nordboerne seilte ikke rett over Atlanteren. Følg ruten vestover og se hvordan
                    de nådde Amerika ved å hoppe fra land til land.
                </p>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

interface RouteSceneProps {
    atIndex: number;
    targetIndex: number | null;
    heading: number;
    sailing: boolean;
    won: boolean;
    burst: number;
    onArrive: () => void;
    onSail: (i: number) => void;
}

function RouteScene({
    atIndex,
    targetIndex,
    heading,
    sailing,
    won,
    burst,
    onArrive,
    onSail,
}: RouteSceneProps) {
    const boat = useRef<THREE.Group>(null);
    const arrivedRef = useRef(false);

    // Nullstill "har ankommet"-vakten hver gang en ny etappe starter.
    useEffect(() => {
        if (targetIndex !== null) arrivedRef.current = false;
    }, [targetIndex]);

    useFrame((_, dt) => {
        if (!boat.current) return;
        const dest = targetIndex !== null ? ANCHORS[targetIndex] : ANCHORS[atIndex];
        boat.current.position.x = damp(boat.current.position.x, dest[0], dt, 0.9);
        boat.current.position.z = damp(boat.current.position.z, dest[2], dt, 0.9);
        boat.current.position.y = WATER_Y;
        // liten vugging
        boat.current.rotation.z = Math.sin(performance.now() / 600) * 0.04;

        if (targetIndex !== null && !arrivedRef.current) {
            const dx = boat.current.position.x - dest[0];
            const dz = boat.current.position.z - dest[2];
            if (dx * dx + dz * dz < 0.09) {
                arrivedRef.current = true;
                onArrive();
            }
        }
    });

    return (
        <group>
            {/* Lys: mildt dagslys */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[6, 12, 8]} intensity={1.1} castShadow />

            <Seascape position={[0, 0, 0]} size={[28, 22]} waterY={WATER_Y} color="#3f83ad">
                {/* Landmasser */}
                {LANDFALLS.map((lf, i) => (
                    <Island key={lf.id} position={lf.pos} active={i <= atIndex} />
                ))}

                {/* Båten */}
                <group ref={boat} position={ANCHORS[0]}>
                    <Boat heading={heading} sail="#efe7d4" color="#6b4a2c" />
                </group>

                {/* Klikkbare "seil hit"-markører over hvert land */}
                {LANDFALLS.map((lf, i) => {
                    if (i === 0) return null; // Norge er start
                    const visited = i <= atIndex;
                    const reachable = i === atIndex + 1 && !sailing && !won;
                    return (
                        <Hotspot
                            key={`hs-${lf.id}`}
                            position={[lf.pos[0], lf.pos[1] + 1.4, lf.pos[2]]}
                            radius={0.55}
                            state={visited ? 'correct' : reachable ? 'idle' : 'disabled'}
                            disabled={!reachable}
                            label={reachable ? `Seil til ${lf.name}` : undefined}
                            onSelect={() => onSail(i)}
                        />
                    );
                })}
            </Seascape>

            <Burst position={[LANDFALLS[3].pos[0], 1.6, LANDFALLS[3].pos[2]]} trigger={burst} />
        </group>
    );
}

// Enkel landmasse: en lav grønn øy som stikker opp av havet.
function Island({
    position,
    active,
}: {
    position: [number, number, number];
    active: boolean;
}) {
    return (
        <group position={[position[0], WATER_Y, position[2]]}>
            {/* strand/sokkel */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[1.9, 2.2, 0.5, 20]} />
                <meshStandardMaterial color="#d9c9a3" />
            </mesh>
            {/* grønt land */}
            <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[1.3, 1.8, 0.7, 20]} />
                <meshStandardMaterial color={active ? '#5a8f4e' : '#7a9a72'} />
            </mesh>
            {/* liten topp */}
            <mesh position={[0.2, 0.95, -0.1]}>
                <coneGeometry args={[0.7, 0.9, 16]} />
                <meshStandardMaterial color={active ? '#4d7d43' : '#6d8a66'} />
            </mesh>
        </group>
    );
}

export default Vesterled3D;
