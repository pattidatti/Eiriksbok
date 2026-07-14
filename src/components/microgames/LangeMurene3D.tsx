import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    GroundPlane,
    WaterPlane,
    Building,
    Column,
    Person,
    Wall,
    Boat,
    Tree,
    Hotspot,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    StepTracker,
    damp,
    Burst,
    THEMES,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: DE LANGE MURENE.
// Eleven bygger de to lange murene som bandt Athen til havna Piraeus. Når
// korridoren er ferdig, seiler et kornskip inn i havna og maten strømmer opp
// til byen, mens Spartas hær står maktesløs utenfor.
//   Lyspære: så lenge flåten hersket over havet, kunne en landhær aldri sulte
//   Athen ut. Murene gjorde byen til en "øy på land".

const T = THEMES.greek;
const SECTIONS = 4; // antall murseksjoner eleven reiser (fra by mot havn)
const CITY_X = -8.5;
const PORT_X = 8.5;
// Seksjonssentre langs korridoren, fra byen (venstre) mot havna (høyre).
const SECTION_X = [-4.5, -1.5, 1.5, 4.5];
const WALL_Z = 2.4; // avstand fra midtlinja til hver mur

type Phase = 'building' | 'supplying' | 'done';

const LangeMurene3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [built, setBuilt] = useState(0);
    const [phase, setPhase] = useState<Phase>('building');
    const [banner, setBanner] = useState<string | null>(
        'Reis de lange murene: klikk ringen for å bygge korridoren fra byen mot havna.'
    );
    const [burst, setBurst] = useState(0);

    const reset = () => {
        setBuilt(0);
        setPhase('building');
        setBanner('Reis de lange murene: klikk ringen for å bygge korridoren fra byen mot havna.');
    };

    const raiseSection = () => {
        const next = built + 1;
        setBuilt(next);
        if (next >= SECTIONS) {
            sounds.play('advance');
            setPhase('supplying');
            setBanner('Korridoren er ferdig. Kornskipet seiler inn i Piraeus.');
            setTimeout(() => {
                sounds.play('complete');
                setBurst((b) => b + 1);
                setPhase('done');
                setBanner(null);
                onComplete({ score: 1, completed: true });
            }, 2600);
        } else {
            sounds.play('correct');
            setBanner(
                next === 1
                    ? 'Første stykke står. Fortsett å bygge muren utover mot havet.'
                    : 'Bra. Muren nærmer seg havna.'
            );
        }
    };

    return (
        <MicroGameScaffold
            title="De lange murene"
            subtitle="Bygg korridoren som bandt Athen til havna, og se hvorfor byen ikke kunne sultes ut"
            estimatedSeconds={130}
            onRetry={built > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 11, 20], fov: 42 },
                background: T.sky,
                target: [0, 0.6, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'done' ? 'Athen forsynt' : phase === 'supplying' ? 'Kornskip' : 'Athen 431 fvt'}
                    </SceneBadge>
                    <DragHint show={built === 0} corner="bl">
                        Klikk den pulserende ringen
                    </DragHint>
                </>
            }
            scene={<Scene built={built} phase={phase} burst={burst} onRaise={raiseSection} />}
        >
            {phase !== 'done' ? (
                <div className="flex flex-col gap-2.5">
                    <StepTracker current={built} total={SECTIONS} />
                    <p className="text-sm text-slate-600">
                        Athen er en sjømakt. Byen ligger inne i landet, men havna Piraeus ligger ved
                        sjøen. Klikk ringen langs korridoren for å reise de lange murene som binder
                        dem sammen. Legg merke til at Spartas hær står utenfor og ikke kommer inn.
                    </p>
                    {phase === 'supplying' && (
                        <SceneFact>
                            Skipet frakter korn fra Svartehavet rett inn i havna. Så lenge flåten
                            styrer sjøen, renner maten opp korridoren til byen.
                        </SceneFact>
                    )}
                </div>
            ) : (
                <WinScreen title="Athen er en øy på land!" onReplay={reset}>
                    De lange murene og flåten gjorde Athen umulig å sulte ut fra land. Spartas
                    soldater kunne brenne åkrene utenfor, men korn kom sjøveien inn i havna og opp
                    til byen. Derfor kunne ikke Sparta vinne raskt, og krigen ble en lang
                    utmattelseskamp. Først da Athen mistet flåten i 405 fvt, falt byen.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Scene({
    built,
    phase,
    burst,
    onRaise,
}: {
    built: number;
    phase: Phase;
    burst: number;
    onRaise: () => void;
}) {
    const supplying = phase === 'supplying' || phase === 'done';
    const nextX = built < SECTIONS ? SECTION_X[built] : 0;

    return (
        <group>
            <GroundPlane size={46} depth={30} color={T.ground} />
            {/* Havet til høyre for havna */}
            <WaterPlane position={[PORT_X + 6, 0.02, 0]} size={[16, 24]} color={T.water} />

            {/* Byen Athen til venstre, med et tempel på en liten høyde */}
            <City />
            {/* Havna Piraeus til høyre med brygge */}
            <Port />

            {/* Korridoren: de to lange murene, seksjon for seksjon */}
            {SECTION_X.map((x, i) => (
                <group key={i}>
                    <WallSection x={x} z={WALL_Z} raised={i < built} />
                    <WallSection x={x} z={-WALL_Z} raised={i < built} />
                </group>
            ))}

            {/* Kornstrøm opp korridoren når forsyningen er i gang */}
            <GrainStream active={supplying} />

            {/* Kornskipet som seiler inn i havna */}
            <GrainShip supplying={supplying} />

            {/* Spartas hær utenfor nordmuren – kommer aldri inn */}
            <SpartanArmy />

            {/* Litt natur bak byen */}
            <Tree position={[CITY_X - 4, 0, -7]} />
            <Tree position={[CITY_X - 2.5, 0, -8.5]} />

            {/* Hotspot: neste murseksjon */}
            {phase === 'building' && built < SECTIONS && (
                <Hotspot
                    position={[nextX, 1.9, 0]}
                    onSelect={onRaise}
                    label="Reis muren"
                    radius={0.6}
                />
            )}

            {/* Feiringspartikler over byen ved fullført forsyning */}
            <Burst position={[CITY_X, 3.2, 0]} trigger={burst} color="#f4e7c5" count={30} spread={3.2} />
        </group>
    );
}

// Én murseksjon = to murstykker (nord + sør deler vi opp i kaller). Her ett
// stykke som stiger opp fra bakken når det bygges.
function WallSection({ x, z, raised }: { x: number; z: number; raised: boolean }) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grp.current) return;
        // Skjult under bakken (y ~ -1.9) til det reises, så damper det opp til 0.
        grp.current.position.y = damp(grp.current.position.y, raised ? 0 : -1.9, dt, 4);
    });
    return (
        <group ref={grp} position={[x, -1.9, z]}>
            <Wall
                position={[0, 0, 0]}
                length={3}
                height={1.8}
                thickness={0.5}
                color={T.stone}
                crenellations
            />
        </group>
    );
}

// Byen Athen: husklynge + tempel med søyler på en liten høyde (akropolis).
function City() {
    return (
        <group position={[CITY_X, 0, 0]}>
            {/* liten høyde */}
            <mesh position={[0, 0.15, 0]} receiveShadow>
                <cylinderGeometry args={[3.2, 3.6, 0.4, 20]} />
                <meshStandardMaterial color="#b9ab84" roughness={0.95} />
            </mesh>
            {/* tempel: fire søyler + tak */}
            <group position={[0, 0.35, 0]}>
                {[-0.9, 0.9].map((tx) =>
                    [-0.7, 0.7].map((tz) => (
                        <Column key={`${tx}-${tz}`} position={[tx, 0, tz]} height={1.4} />
                    ))
                )}
                <mesh position={[0, 1.55, 0]} castShadow>
                    <boxGeometry args={[2.6, 0.25, 2.2]} />
                    <meshStandardMaterial color={T.stone} roughness={0.85} />
                </mesh>
                <mesh position={[0, 1.85, 0]} rotation={[0, 0, 0]} castShadow>
                    <boxGeometry args={[2.7, 0.3, 2.3]} />
                    <meshStandardMaterial color="#d9c7a0" roughness={0.85} />
                </mesh>
            </group>
            {/* noen hus rundt */}
            <Building position={[-2.4, 0, 1.8]} body="#c9975a" roof="#7a4a2c" w={1.1} h={0.9} d={1} seed={1} />
            <Building position={[-2.1, 0, -1.9]} body="#cf9f66" roof="#7a4a2c" w={1.1} h={0.8} d={1} seed={2} />
            <Building position={[-3.2, 0, 0.2]} body="#c69258" roof="#6e4227" w={1} h={0.7} d={1} seed={3} />
        </group>
    );
}

// Havna Piraeus: brygge ved sjøkanten.
function Port() {
    return (
        <group position={[PORT_X, 0, 0]}>
            {/* brygge */}
            <mesh position={[1.4, 0.12, 0]} receiveShadow castShadow>
                <boxGeometry args={[3, 0.24, 4.4]} />
                <meshStandardMaterial color="#a68a5c" roughness={0.95} />
            </mesh>
            {/* to pakkhus */}
            <Building position={[-0.4, 0, 1.6]} body="#b98a52" roof="#6e4227" w={1.1} h={0.9} d={1} seed={5} />
            <Building position={[-0.6, 0, -1.7]} body="#c0925a" roof="#6e4227" w={1.1} h={0.8} d={1} seed={6} />
        </group>
    );
}

// Kornstrøm: små kornsekker som glir fra havna opp korridoren til byen.
const SACK_OFFSETS = [0, 0.28, 0.56, 0.84]; // faseforskyvning langs strømmen
function GrainStream({ active }: { active: boolean }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const START = PORT_X - 1.5;
    const END = CITY_X + 2;
    const SPAN = START - END;
    useFrame((_, dt) => {
        refs.current.forEach((g, i) => {
            if (!g) return;
            if (!active) {
                g.visible = false;
                return;
            }
            g.visible = true;
            // Beveg jevnt mot byen; loop tilbake til havna.
            let p = (g.userData.p as number) ?? SACK_OFFSETS[i];
            p += dt * 0.18;
            if (p > 1) p -= 1;
            g.userData.p = p;
            g.position.x = START - p * SPAN;
            g.position.y = 0.35 + Math.sin(p * Math.PI) * 0.1;
        });
    });
    return (
        <group>
            {SACK_OFFSETS.map((_, i) => (
                <group
                    key={i}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                    position={[START, 0.35, i % 2 === 0 ? 0.6 : -0.6]}
                >
                    <mesh castShadow>
                        <boxGeometry args={[0.5, 0.45, 0.5]} />
                        <meshStandardMaterial color="#d9b25a" roughness={0.9} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// Kornskipet som seiler inn fra åpent hav og legger til ved havna.
function GrainShip({ supplying }: { supplying: boolean }) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grp.current) return;
        const targetX = supplying ? PORT_X + 3.2 : PORT_X + 12;
        grp.current.position.x = damp(grp.current.position.x, targetX, dt, 0.7);
        const t = performance.now() / 1000;
        grp.current.rotation.z = Math.sin(t * 1.3) * 0.04;
    });
    return (
        <group ref={grp} position={[PORT_X + 12, 0.25, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <Boat color="#6b4a2c" sail="#efe7d4" />
        </group>
    );
}

// Spartas hær står utenfor nordmuren og kan ikke bryte gjennom.
function SpartanArmy() {
    const xs = [-3, -0.5, 2, 4.5];
    return (
        <group>
            {xs.map((x, i) => (
                <Person
                    key={i}
                    position={[x, 0, WALL_Z + 3.2]}
                    rotation={[0, Math.PI, 0]}
                    body="#8a2f24"
                    legs="#5a2018"
                    hat="helmet"
                    hatColor="#b5482f"
                    pose="idle"
                    scale={1}
                />
            ))}
        </group>
    );
}

export default LangeMurene3D;
