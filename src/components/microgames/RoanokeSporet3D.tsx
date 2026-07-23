import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Ship, Trees, Home } from 'lucide-react';
import {
    MicroGameScaffold,
    GroundPlane,
    Building,
    Tree,
    Wall,
    Person,
    Hotspot,
    InstancedField,
    Particles,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    StepTracker,
    ChoiceRow,
    damp,
    type ChoiceItem,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om den forsvunne kolonien Roanoke.
// Lyspære-øyeblikket: Eleven ER John White, tilbake etter tre år. Kolonien er
// tom. Ved å lete gjennom den tause, tåkelagte plassen selv - hus for hus,
// stolpe for stolpe - kjenner eleven på kroppen at det ikke finnes noen fasit,
// bare spor. Når alle spor er funnet, må eleven velge hvilket spor som er
// sterkest å følge. Det svakeste valget viser en synlig blindvei.

type Phase = 'sok' | 'valg' | 'ferdig';

// De fire sporene eleven leter fram i den forlatte kolonien.
interface Spor {
    id: string;
    fakta: string;
}
const SPOR: Spor[] = [
    {
        id: 'stolpe',
        fakta: 'På en stolpe i palisaden står det ett ord skåret inn: CROATOAN. Det var navnet på en øy - og et folk - rett i nærheten.',
    },
    {
        id: 'tre',
        fakta: 'I barken på et tre står bokstavene CRO. Ingen kors ved siden av. Krysset skulle bety fare - så de dro nok i ro, ikke på flukt.',
    },
    {
        id: 'hus',
        fakta: 'Husene er tomme. Ting er ryddet vekk, ikke slengt rundt. Det ser ut som folk pakket og gikk, ikke som et plyndret leir.',
    },
    {
        id: 'jord',
        fakta: 'Du leter etter graver. Du finner ingen. Hadde alle dødd av sult eller angrep her, ville det ligget spor i jorda. Trolig dro de levende.',
    },
];

const RoanokeSporet3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('sok');
    const [funnet, setFunnet] = useState<string[]>([]);
    const [banner, setBanner] = useState<string | null>(
        'August 1590. Du er John White, tilbake etter tre år. Kolonien er tom. Let etter spor.'
    );
    const [fakta, setFakta] = useState<string | null>(null);

    const reset = () => {
        setPhase('sok');
        setFunnet([]);
        setFakta(null);
        setBanner(
            'August 1590. Du er John White, tilbake etter tre år. Kolonien er tom. Let etter spor.'
        );
    };

    const finnSpor = (id: string) => {
        if (funnet.includes(id)) return;
        const spor = SPOR.find((s) => s.id === id);
        if (!spor) return;
        const nye = [...funnet, id];
        setFunnet(nye);
        setFakta(spor.fakta);
        sounds.play('advance');
        if (nye.length === SPOR.length) {
            setPhase('valg');
            setBanner('Alle spor er funnet. Hvilket spor er sterkest å følge?');
        } else {
            setBanner(null);
        }
    };

    const velg = (id: string) => {
        if (phase !== 'valg') return;
        if (id === 'croatoan') {
            sounds.play('complete');
            setPhase('ferdig');
            setBanner(null);
            setFakta(null);
            setTimeout(() => onComplete({ score: 1, completed: true }), 300);
        } else if (id === 'innland') {
            sounds.play('incorrect');
            setBanner(
                'Whites eget kart hintet om et fort innover i landet - men sporene her er langt tynnere enn mot Croatoan. Følg det sterkeste.'
            );
        } else {
            sounds.play('incorrect');
            setBanner(
                'Ingen av kolonistene kom noen gang fram til England. Det sporet er en blindvei.'
            );
        }
    };

    const valgKort: ChoiceItem[] = [
        {
            id: 'croatoan',
            title: 'Følg sporet mot Croatoan',
            blurb: 'Flest spor peker hit',
            icon: Ship,
            status: phase === 'valg' ? 'available' : 'locked',
        },
        {
            id: 'innland',
            title: 'Let innover i landet',
            blurb: 'Whites kart hintet om et fort',
            icon: Trees,
            status: phase === 'valg' ? 'available' : 'locked',
        },
        {
            id: 'hjem',
            title: 'De seilte nok hjem',
            blurb: 'Over havet til England',
            icon: Home,
            status: phase === 'valg' ? 'available' : 'locked',
        },
    ];

    return (
        <MicroGameScaffold
            title="Sporet etter kolonien"
            subtitle="Let gjennom den forlatte kolonien Roanoke og finn ut hvor folket kan ha tatt veien"
            estimatedSeconds={150}
            onRetry={funnet.length > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 6, 15], fov: 44 },
                target: [0, 1.2, 0],
                background: '#b9c2bd',
                fog: { near: 16, far: 46 },
                light: 'overcast',
            }}
            containerClassName="bg-gradient-to-b from-[#c9d0cb] via-[#c2c9c2] to-[#a7a58c]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Roanoke, 1590</SceneBadge>
                    <DragHint show={phase === 'sok'} corner="bl">
                        Dra for å se deg rundt. Trykk på de lysende punktene for å undersøke.
                    </DragHint>
                </>
            }
            scene={<Kolonien phase={phase} funnet={funnet} onFinn={finnSpor} />}
        >
            <div className="flex flex-col gap-3">
                <StepTracker current={funnet.length} total={SPOR.length} />

                {phase === 'sok' && (
                    <p className="text-sm text-slate-600">
                        Fire steder i kolonien skjuler et spor: palisadestolpen, treet, husene og
                        jorda. Trykk på hvert lysende punkt og les hva du finner.
                    </p>
                )}

                {phase !== 'sok' && <ChoiceRow items={valgKort} onSelect={velg} />}

                {fakta && phase !== 'ferdig' && <SceneFact>{fakta}</SceneFact>}

                {phase === 'ferdig' && (
                    <WinScreen title="Du følger det sterkeste sporet - mot Croatoan" onReplay={reset}>
                        Alle sporene peker samme vei: folket dro rolig, tok med seg tingene sine, og
                        etterlot ordet CROATOAN. Likevel har ingen noen gang bevist hva som skjedde.
                        Det er slik ekte historie fungerer: når det ikke finnes fasit, følger vi det
                        sterkeste sporet - men vi later ikke som vi vet mer enn vi gjør.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN - den forlatte, tåkelagte kolonien
// ============================================================

function Kolonien({
    phase,
    funnet,
    onFinn,
}: {
    phase: Phase;
    funnet: string[];
    onFinn: (id: string) => void;
}) {
    // Tåken letter litt for hvert spor eleven finner (verden reagerer).
    const mistRef = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const tetthet = 1 - funnet.length / (SPOR.length + 1);
        if (mistRef.current) {
            mistRef.current.scale.y = damp(mistRef.current.scale.y, 0.6 + tetthet * 0.9, dt, 2);
        }
    });

    return (
        <group>
            <GroundPlane size={44} depth={34} color="#6f6b4c" />

            {/* Gress og ugress som tar tilbake plassen - tegn på forlatt sted */}
            <InstancedField
                count={110}
                area={[26, 20]}
                y={0}
                minScale={0.5}
                maxScale={1.3}
                seed={7}
                geometry={<coneGeometry args={[0.16, 1.1, 5]} />}
                material={<meshStandardMaterial color="#7c7a45" roughness={1} flatShading />}
            />

            {/* Rester av palisaden rundt - noen deler står, noen har falt */}
            <Wall position={[0, 0, -6]} length={12} height={1.9} color="#8a7a5f" />
            <Wall
                position={[-6, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
                length={12}
                height={1.9}
                color="#87775c"
            />
            <Wall
                position={[6, 0, 1.5]}
                rotation={[0, Math.PI / 2, 0]}
                length={9}
                height={1.9}
                color="#87775c"
            />
            {/* En falt del av palisaden (ligger ned) */}
            <mesh position={[2.5, 0.2, 6]} rotation={[Math.PI / 2.3, 0, 0.1]} castShadow>
                <boxGeometry args={[5, 1.7, 0.35]} />
                <meshStandardMaterial color="#7d6d54" roughness={0.95} />
            </mesh>

            {/* Tomme hus */}
            <Building body="#6d5844" roof="#4a3a2c" w={2.6} h={2.0} d={2.4} />
            <group position={[-3.4, 0, -2]}>
                <Building body="#6a5540" roof="#463628" w={2.2} h={1.8} d={2.1} />
            </group>
            <group position={[3.3, 0, -2.4]}>
                <Building body="#705943" roof="#4c3b2c" w={2.3} h={1.9} d={2.2} />
            </group>

            {/* Et bart tre med CRO skåret inn */}
            <Tree position={[-4.6, 0, 3.2]} seed={4} />

            {/* John White står ved porten - elevens stedfortreder */}
            <Person position={[0, 0, 6.6]} rotation={[0, Math.PI, 0]} pose="idle" body="#3b3a44" />

            {/* Palisadestolpen med CROATOAN skåret inn */}
            <group position={[0.4, 0, 2.4]}>
                <mesh position={[0, 1.1, 0]} castShadow>
                    <cylinderGeometry args={[0.22, 0.26, 2.2, 8]} />
                    <meshStandardMaterial color="#6f5c44" roughness={0.95} />
                </mesh>
                {/* mørk innskåret flate */}
                <mesh position={[0, 1.35, 0.24]}>
                    <planeGeometry args={[0.34, 0.5]} />
                    <meshStandardMaterial color="#2e2418" roughness={1} />
                </mesh>
            </group>

            {/* Drivende tåke (lette lag som letter når spor finnes) */}
            <group ref={mistRef} scale={[1, 1.4, 1]}>
                <Particles preset="motes" />
            </group>

            {/* Spor-hotspots (kun i søke-fasen) */}
            {phase === 'sok' && (
                <>
                    {!funnet.includes('stolpe') && (
                        <Hotspot
                            position={[0.4, 1.7, 2.4]}
                            onSelect={() => onFinn('stolpe')}
                            label="Stolpen"
                            radius={0.42}
                            color="#f59e0b"
                        />
                    )}
                    {!funnet.includes('tre') && (
                        <Hotspot
                            position={[-4.6, 1.9, 3.2]}
                            onSelect={() => onFinn('tre')}
                            label="Treet"
                            radius={0.42}
                            color="#f59e0b"
                        />
                    )}
                    {!funnet.includes('hus') && (
                        <Hotspot
                            position={[0, 2.4, 0]}
                            onSelect={() => onFinn('hus')}
                            label="Husene"
                            radius={0.42}
                            color="#f59e0b"
                        />
                    )}
                    {!funnet.includes('jord') && (
                        <Hotspot
                            position={[3.2, 0.6, 3.4]}
                            onSelect={() => onFinn('jord')}
                            label="Jorda"
                            radius={0.42}
                            color="#f59e0b"
                        />
                    )}
                </>
            )}

            {/* En liten markør mot Croatoan i valg-fasen (peker mot havet) */}
            {phase !== 'sok' && (
                <group position={[5, 0.1, 5]}>
                    <mesh position={[0, 0.9, 0]}>
                        <sphereGeometry args={[0.28, 16, 16]} />
                        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

export default RoanokeSporet3D;
