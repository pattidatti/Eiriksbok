import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    Tree,
    Rock,
    Person,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    StepTracker,
    DataReadout,
    type KitTheme,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om Stor-Zimbabwe. Eleven bygger byens to kjennemerker
// i tørr stein: den buede ringmuren og det høye kjegletårnet. Kjernepoenget eleven
// kjenner på kroppen: byggerne stablet presist tilhugget granitt så tett at murene
// holdt seg oppe HELT UTEN mørtel. En live-teller viser "Mørtel brukt: 0" hele veien.
//
// Mekanikk: en granittblokk ligger ved steinbruddet. Eleven DRAR den bort til
// byggepunktet og slipper. Hvert slipp legger et nytt steinlag - først fire lag på
// ringmuren, så tre lag på tårnet - til byen står ferdig.

const WALL_COURSES = 4; // antall lag på ringmuren
const TOWER_COURSES = 3; // antall lag på kjegletårnet
const TOTAL = WALL_COURSES + TOWER_COURSES;

// Varm savanne-palett (Sør-Afrikas høyland: gyllent gress, gråbrun granitt).
const SAVANNA: KitTheme = {
    sky: '#e8dcae',
    fog: '#e3d6a4',
    ground: '#b89c54',
    water: '#4a7c8c',
    wood: '#6e4d2e',
    stone: '#bda079',
    leaf: '#6f7d3a',
    accent: '#b5651d',
};

// Byggepunktet på bakken der eleven slipper blokken.
const BUILD_X = 0;
const BUILD_Z = 0.5;

const StorZimbabweMur3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [stage, setStage] = useState(0); // antall steinlag som er lagt
    const [blockKey, setBlockKey] = useState(0); // remount for å sende blokken hjem
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra granittblokken bort til muren og slipp den. Stein på stein, helt uten mørtel.'
    );
    const [fact, setFact] = useState<string | null>(null);

    const snappedRef = useRef(false);

    const done = stage >= TOTAL;
    const buildingTower = stage >= WALL_COURSES;
    const idle = stage === 0;

    const reset = () => {
        setStage(0);
        setBlockKey((k) => k + 1);
        setFact(null);
        setBanner('Dra granittblokken bort til muren og slipp den. Stein på stein, helt uten mørtel.');
    };

    const placeStone = () => {
        if (done) return;
        sounds.play('pick');
        const next = stage + 1;
        setStage(next);
        setBurst((b) => b + 1);
        setBlockKey((k) => k + 1);
        if (next >= TOTAL) {
            sounds.play('complete');
            setBanner(null);
            setFact(null);
            window.setTimeout(() => onComplete({ score: 1, completed: true }), 400);
        } else if (next === WALL_COURSES) {
            sounds.play('advance');
            setFact(FACTS[next - 1]);
            setBanner('Ringmuren står. Bygg nå det høye kjegletårnet inne i borgen.');
        } else {
            sounds.play('advance');
            setFact(FACTS[Math.min(next - 1, FACTS.length - 1)]);
            setBanner(
                buildingTower
                    ? 'Et nytt lag på tårnet. Det smalner oppover.'
                    : 'Et nytt lag på ringmuren. Den buer seg rundt borgen.'
            );
        }
    };

    return (
        <MicroGameScaffold
            title="Bygg Stor-Zimbabwe"
            subtitle="Reis den buede ringmuren og det høye kjegletårnet ved å stable granitt - helt uten mørtel."
            estimatedSeconds={140}
            onRetry={stage > 0 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [10, 7, 12], fov: 42 },
                background: SAVANNA.sky,
                fog: { color: SAVANNA.fog, near: 28, far: 60 },
                target: [0, 1.8, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Stor-Zimbabwe står' : 'Sør-Afrika, ca. 1300'}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                {
                                    label: buildingTower ? 'Tårnlag' : 'Murlag',
                                    value: buildingTower
                                        ? `${stage - WALL_COURSES}/${TOWER_COURSES}`
                                        : `${stage}/${WALL_COURSES}`,
                                },
                                { label: 'Mørtel brukt', value: 0 },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Dra granittblokken til muren
                    </DragHint>
                </>
            }
            scene={
                <BuildSite
                    stage={stage}
                    blockKey={blockKey}
                    burst={burst}
                    done={done}
                    onSnap={() => {
                        snappedRef.current = true;
                        placeStone();
                    }}
                    onDrop={() => {
                        if (!snappedRef.current) setBlockKey((k) => k + 1);
                        snappedRef.current = false;
                    }}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done && <StepTracker current={stage} total={TOTAL} />}

                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Dra granittblokken fra steinbruddet bort til byggepunktet og slipp den.
                            For hvert slipp legges et nytt steinlag. Bygg først de fire lagene på den
                            buede ringmuren, så de tre lagene på kjegletårnet inne i borgen. Legg
                            merke til telleren: du bruker null mørtel hele veien.
                        </p>
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen title="Stor-Zimbabwe står ferdig!" onReplay={reset}>
                        Du bygde en mektig steinby uten å bruke en eneste klatt mørtel. Hver granittblokk
                        var hugget så jevn at den låste seg fast i steinene under bare av sin egen tyngde.
                        Ringmuren er over ti meter høy noen steder, og kjegletårnet ruver inne i borgen.
                        Da europeere kom hit på 1800-tallet, nektet mange å tro at afrikanere hadde bygget
                        dette. Men det hadde de: dyktige byggere i shona-folket, som ble rike på handel med
                        gull og elfenben helt ut til kysten.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// Korte fakta mellom byggetrinnene.
const FACTS = [
    'Første lag ligger. Steinene er kløyvd fra granitten i åsene rundt og hugget så jevne at de holder seg uten mørtel.',
    'Muren vokser. På det høyeste er ringmuren over ti meter, og noen steder fem meter tykk.',
    'Tredje laget. Muren buer seg mykt rundt borgen, uten skarpe hjørner.',
    'Ringmuren er ferdig. Inne i den reiser byggerne nå det berømte kjegletårnet, et solid tårn av stein.',
    'Tårnet smalner oppover, som en kornkurv i stein. Ingen vet helt hva det ble brukt til.',
];

// ============================================================
//  3D-SCENEN
// ============================================================

function BuildSite({
    stage,
    blockKey,
    burst,
    done,
    onSnap,
    onDrop,
}: {
    stage: number;
    blockKey: number;
    burst: number;
    done: boolean;
    onSnap: () => void;
    onDrop: () => void;
}) {
    const wallStage = Math.min(stage, WALL_COURSES);
    const towerStage = Math.max(0, stage - WALL_COURSES);
    const buildY = stage >= WALL_COURSES ? 0.8 + towerStage + 1.5 : stage + 1;

    return (
        <group>
            {/* Gyllent savanne-gress */}
            <GroundPlane size={64} depth={56} color={SAVANNA.ground} />

            {/* Den buede ringmuren som vokser lag for lag */}
            <RingWall courses={wallStage} stone={SAVANNA.stone} />

            {/* Kjegletårnet inne i borgen */}
            <ConicalTower courses={towerStage} stone={SAVANNA.stone} />

            {/* Burst der det nye laget lander */}
            <Burst
                position={[BUILD_X, Math.max(0.6, buildY - 0.4), BUILD_Z - 1]}
                trigger={burst}
                color="#e6d3a0"
                count={20}
                spread={2.2}
            />

            {/* Granittblokken eleven drar (skjules når byen er ferdig) */}
            {!done && (
                <Draggable
                    key={blockKey}
                    position={[6.5, 0, 5]}
                    snapPoints={[[BUILD_X, BUILD_Z]]}
                    snapRadius={3}
                    onSnap={onSnap}
                    onDrop={onDrop}
                    dropFx="dustPuff"
                >
                    {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh position={[0, 0.6, 0]}>
                        <boxGeometry args={[2.4, 1.8, 2.4]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <GraniteBlock />
                </Draggable>
            )}

            {/* Steinbrudd: noen råblokker av granitt */}
            <Rock position={[7.6, 0, 6.4]} color="#a89066" scale={1.1} />
            <Rock position={[8.4, 0, 4.2]} color="#9c8458" scale={0.9} />
            <Rock position={[6.2, 0, 7.4]} color="#b09872" scale={0.8} />

            {/* Granitt-kopjer (åser) i bakgrunnen */}
            <Rock position={[-12, 0, -12]} color="#9a8460" scale={3.2} />
            <Rock position={[12, 0, -14]} color="#8e7a58" scale={2.6} />

            {/* Akasietrær for savanne-stemning */}
            <Tree position={[-10, 0, 6]} seed={3} leaf={SAVANNA.leaf} />
            <Tree position={[10, 0, 8]} seed={7} leaf={SAVANNA.leaf} />
            <Tree position={[-8, 0, -4]} seed={11} leaf={SAVANNA.leaf} />

            {/* Byggere som arbeider ved muren */}
            {BUILDER_SLOTS.map((p, i) => (
                <Builder key={i} position={[p[0], 0, p[1]]} index={i} />
            ))}
        </group>
    );
}

// Den buede ringmuren: hvert lag er en ring av små granittblokker langs en bue.
// Ringmurens geometri er faste tall - de hører til modulen, ikke til hver render.
const RADIUS = 4.2;
const SEG = 14; // blokker per lag langs buen
const ARC = Math.PI * 1.35; // åpen ring (ikke helt lukket - har en åpning)
const START = -Math.PI * 0.55;

function RingWall({ courses, stone }: { courses: number; stone: string }) {

    const blocks = useMemo(() => {
        const out: { x: number; z: number; rot: number }[] = [];
        for (let s = 0; s < SEG; s++) {
            const a = START + (ARC * s) / (SEG - 1);
            out.push({ x: Math.sin(a) * RADIUS, z: Math.cos(a) * RADIUS, rot: a });
        }
        return out;
    }, []);

    const items: React.ReactNode[] = [];
    for (let c = 0; c < courses; c++) {
        for (let s = 0; s < SEG; s++) {
            const b = blocks[s];
            // Hvert lag forskjøvet litt, og muren smalner svakt oppover.
            const shrink = 1 - c * 0.04;
            items.push(
                <mesh
                    key={`${c}-${s}`}
                    position={[b.x, c + 0.5, b.z]}
                    rotation={[0, b.rot, 0]}
                    castShadow
                    receiveShadow
                >
                    <boxGeometry args={[1.05 * shrink, 1.02, 1.7]} />
                    <meshStandardMaterial
                        color={s % 2 === 0 ? stone : '#c7ab83'}
                        roughness={0.97}
                        flatShading
                    />
                </mesh>
            );
        }
    }
    return <group>{items}</group>;
}

// Kjegletårnet: stablede, krympende sylindre som danner et solid, taperende tårn.
function ConicalTower({ courses, stone }: { courses: number; stone: string }) {
    const items: React.ReactNode[] = [];
    for (let c = 0; c < courses; c++) {
        const bottom = 2.1 - c * 0.45;
        const top = 2.1 - (c + 1) * 0.45;
        items.push(
            <mesh key={c} position={[BUILD_X, 0.8 + c * 1.5 + 0.75, BUILD_Z - 1]} castShadow receiveShadow>
                <cylinderGeometry args={[Math.max(0.5, top), Math.max(0.6, bottom), 1.5, 24]} />
                <meshStandardMaterial color={c % 2 === 0 ? stone : '#c7ab83'} roughness={0.96} flatShading />
            </mesh>
        );
    }
    // Liten sokkel under tårnet, synlig så snart første lag legges.
    if (courses > 0) {
        items.push(
            <mesh key="base" position={[BUILD_X, 0.4, BUILD_Z - 1]} receiveShadow>
                <cylinderGeometry args={[2.3, 2.5, 0.8, 24]} />
                <meshStandardMaterial color="#b09872" roughness={0.97} flatShading />
            </mesh>
        );
    }
    return <group>{items}</group>;
}

// En enkelt granittblokk på en treslede (det eleven drar).
function GraniteBlock() {
    return (
        <group>
            <mesh position={[0, 0.12, 0]} castShadow>
                <boxGeometry args={[1.6, 0.18, 1.9]} />
                <meshStandardMaterial color="#7a5630" roughness={0.95} flatShading />
            </mesh>
            <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 0.95, 1.3]} />
                <meshStandardMaterial color="#bda079" roughness={0.96} flatShading />
            </mesh>
        </group>
    );
}

// Faste plasser for byggere rundt muren.
const BUILDER_SLOTS: [number, number][] = [
    [-2.4, 3.6],
    [2.6, 3.2],
    [3.4, -1.2],
];

// En bygger som lener seg framover og arbeider, med en liten rytmisk vugging.
function Builder({ position, index }: { position: [number, number, number]; index: number }) {
    const ref = useRef<THREE.Group>(null);
    const skin = index % 3 === 0 ? '#6b4a2f' : index % 3 === 1 ? '#7a5638' : '#5e4029';
    const body = index % 2 === 0 ? '#9a7d4a' : '#86683c';
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime() * 2 + index * 0.5;
        ref.current.rotation.x = -0.2 + Math.sin(t) * 0.1;
    });
    return (
        <group position={position} rotation={[0, Math.PI * 0.6 + index, 0]}>
            <group ref={ref}>
                <Person body={body} skin={skin} pose="raise" />
            </group>
        </group>
    );
}

export default StorZimbabweMur3D;
