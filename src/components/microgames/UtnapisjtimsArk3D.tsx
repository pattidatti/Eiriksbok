import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MicroGameProps } from './types';
import {
    MicroGameScaffold,
    Shoreline,
    Boat,
    Building,
    Person,
    Animal,
    Draggable,
    Hotspot,
    Particles,
    Burst,
    Smoke,
    Fire,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    LoseScreen,
    TimerPill,
    DangerVignette,
    StepTracker,
    useGameClock,
    damp,
    microSfx,
} from './kit';

// Lyspære-øyeblikket: gudene i Mesopotamia var avhengige av menneskene sine.
// Uten mennesker fikk ingen gud offer og mat - derfor måtte olje til offeret om
// bord, og derfor reddet Ea én familie da de andre gudene ville utslette alle.

type Fase = 'laster' | 'tetter' | 'storm' | 'vunnet' | 'tapt';

interface Last {
    id: string;
    navn: string;
    riktig: boolean;
    /** Startplass på land (x, z). */
    start: [number, number];
    svar: string;
}

const LASTER: Last[] = [
    {
        id: 'familien',
        navn: 'Familien din',
        riktig: true,
        start: [-8, -3],
        svar: 'Familien er om bord. Utnapisjtim tok med seg slekta og folkene som hjalp ham.',
    },
    {
        id: 'dyrene',
        navn: 'Dyr fra marka',
        riktig: true,
        start: [-8.5, 1],
        svar: 'Både tamme og ville dyr ble berget, står det i fortellingen.',
    },
    {
        id: 'kornet',
        navn: 'Korn og mat',
        riktig: true,
        start: [-5.5, 3.4],
        svar: 'Mat til alle om bord. Sju dager er lenge uten niste.',
    },
    {
        id: 'oljen',
        navn: 'Olje til offeret',
        riktig: true,
        start: [-4.5, -3.6],
        svar: 'Viktigst av alt. Uten olje kan du ikke ofre til gudene når vannet trekker seg tilbake.',
    },
    {
        id: 'gullet',
        navn: 'Kiste med gull',
        riktig: false,
        start: [-6.5, -0.6],
        svar: 'Gull metter ingen guder. Det tar bare plass, og du mister tid.',
    },
    {
        id: 'tronen',
        navn: 'Kongens trone',
        riktig: false,
        start: [-2.6, 1.8],
        svar: 'Tronen berger ingen. I flommen drukner kongen som alle andre.',
    },
];

const RIKTIGE = LASTER.filter((l) => l.riktig).length;
const ARK: [number, number, number] = [5, 0.06, 0];
const VANN_Y = 0.06;

// --- Scene ---

function Ark({ fase, lastet }: { fase: Fase; lastet: string[] }) {
    const grp = useRef<THREE.Group>(null);
    const stormer = fase === 'storm' || fase === 'vunnet';
    useFrame((_, dt) => {
        if (!grp.current) return;
        const maal = stormer ? 1.5 : 0;
        grp.current.position.y = damp(grp.current.position.y, maal, dt, 1.4);
        grp.current.rotation.z = damp(
            grp.current.rotation.z,
            stormer ? Math.sin(performance.now() / 620) * 0.07 : 0,
            dt,
            3
        );
    });
    return (
        <group ref={grp} position={ARK}>
            <group scale={[2.5, 1.5, 2.2]}>
                <Boat position={[0, 0, 0]} heading={Math.PI / 2} color="#7a5636" />
            </group>
            {/* Dekk over skroget, og huset med høyt tak som fortellingen beskriver */}
            <mesh position={[0, 1.32, 0]} castShadow receiveShadow>
                <boxGeometry args={[5.4, 0.16, 2.0]} />
                <meshStandardMaterial color="#a2794c" roughness={0.9} />
            </mesh>
            <mesh position={[0.2, 1.9, 0]} castShadow>
                <boxGeometry args={[2.8, 1.0, 1.6]} />
                <meshStandardMaterial color="#c2a06d" roughness={0.9} />
            </mesh>
            <mesh position={[0.2, 2.51, 0]} castShadow>
                <boxGeometry args={[3.1, 0.22, 1.9]} />
                <meshStandardMaterial color="#7d5c37" roughness={0.9} />
            </mesh>
            {/* Lasten som er kommet om bord, stablet på dekk */}
            {lastet.map((id, i) => (
                <mesh
                    key={id}
                    position={[-1.9 + (i % 2) * 0.9, 1.65, -0.45 + Math.floor(i / 2) * 0.9]}
                    castShadow
                >
                    <boxGeometry args={[0.62, 0.5, 0.62]} />
                    <meshStandardMaterial
                        color={id === 'oljen' ? '#c9822f' : '#b79a63'}
                        roughness={0.85}
                    />
                </mesh>
            ))}
            {/* Offerbålet på taket ved seier */}
            {fase === 'vunnet' && (
                <group position={[0.2, 2.62, 0]}>
                    <Fire position={[0, 0, 0]} scale={0.8} />
                    <Smoke origin={[0, 0.7, 0]} />
                </group>
            )}
        </group>
    );
}

function LastPakke({ last, onLevert }: { last: Last; onLevert: (l: Last) => void }) {
    return (
        <Draggable
            position={[last.start[0], 0, last.start[1]]}
            bounds={{ minX: -11, maxX: 6.4, minZ: -6, maxZ: 6 }}
            snapPoints={[[ARK[0], ARK[2]]]}
            snapRadius={3.2}
            onSnap={() => onLevert(last)}
            dropFx="dustPuff"
        >
            {/* Romslig usynlig gripeflate - trygg å ta tak i på trackpad */}
            <mesh position={[0, 0.7, 0]}>
                <boxGeometry args={[1.7, 1.6, 1.7]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            {last.id === 'familien' && (
                <group>
                    <Person position={[-0.28, 0, 0]} pose="idle" hat="hood" />
                    <Person position={[0.3, 0, 0.2]} pose="idle" />
                </group>
            )}
            {last.id === 'dyrene' && <Animal position={[0, 0, 0]} kind="sheep" />}
            {last.id === 'kornet' && (
                <mesh position={[0, 0.34, 0]} castShadow>
                    <boxGeometry args={[0.78, 0.68, 0.78]} />
                    <meshStandardMaterial color="#c8b070" roughness={0.9} />
                </mesh>
            )}
            {last.id === 'oljen' && (
                <mesh position={[0, 0.4, 0]} castShadow>
                    <cylinderGeometry args={[0.3, 0.38, 0.8, 10]} />
                    <meshStandardMaterial color="#c9822f" roughness={0.7} />
                </mesh>
            )}
            {last.id === 'gullet' && (
                <mesh position={[0, 0.28, 0]} castShadow>
                    <boxGeometry args={[0.86, 0.56, 0.6]} />
                    <meshStandardMaterial color="#d4a017" roughness={0.4} />
                </mesh>
            )}
            {last.id === 'tronen' && (
                <group position={[0, 0, 0]}>
                    <mesh position={[0, 0.28, 0]} castShadow>
                        <boxGeometry args={[0.62, 0.14, 0.62]} />
                        <meshStandardMaterial color="#8d6a3f" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.62, -0.26]} castShadow>
                        <boxGeometry args={[0.62, 0.72, 0.12]} />
                        <meshStandardMaterial color="#8d6a3f" roughness={0.8} />
                    </mesh>
                </group>
            )}
        </Draggable>
    );
}

function Flomvann({ fase }: { fase: Fase }) {
    const mesh = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        if (!mesh.current) return;
        const maal = fase === 'storm' || fase === 'vunnet' ? 1.45 : VANN_Y - 0.4;
        mesh.current.position.y = damp(mesh.current.position.y, maal, dt, 1.3);
    });
    return (
        <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[-6, VANN_Y - 0.4, 0]}>
            <planeGeometry args={[34, 34]} />
            <meshStandardMaterial color="#4d7f9e" transparent opacity={0.82} roughness={0.35} />
        </mesh>
    );
}

function Scene({
    fase,
    lastet,
    igjen,
    onLevert,
    onTett,
}: {
    fase: Fase;
    lastet: string[];
    igjen: Last[];
    onLevert: (l: Last) => void;
    onTett: () => void;
}) {
    return (
        <group>
            <Shoreline
                splitX={0}
                size={[56, 40]}
                waterY={VANN_Y}
                landColor="#c2a875"
                seaColor="#4d7f9e"
            >
                {/* Byen Shuruppak på elvebredden */}
                <Building position={[-8.6, 0, -5.2]} seed={3} body="#c9b083" roof="#8a6f45" />
                <Building position={[-5.6, 0, -6.0]} seed={7} body="#bda374" roof="#856a42" />
                <Building position={[-2.3, 0, -5.7]} seed={11} body="#c6ac80" roof="#8a6f45" />

                <Ark fase={fase} lastet={lastet} />

                {fase === 'laster' &&
                    igjen.map((l) => <LastPakke key={l.id} last={l} onLevert={onLevert} />)}

                {fase === 'tetter' && (
                    <Hotspot position={[ARK[0], 3.3, ARK[2]]} onSelect={onTett} label="Tett igjen døra" />
                )}
            </Shoreline>

            <Flomvann fase={fase} />

            {/* Regnet er atmosfære, ikke spillinnhold - holdes utenfor scene-revisjonens
                modellboks så det ikke blåser opp innrammings-sjekken. */}
            {fase !== 'vunnet' && (
                <group userData={{ sceneAuditIgnore: true }}>
                    <Particles preset="rain" count={fase === 'storm' ? 420 : 150} />
                </group>
            )}
            {fase === 'vunnet' && <Burst position={[ARK[0], 3.4, ARK[2]]} trigger={1} />}
        </group>
    );
}

// --- Spillet ---

export default function UtnapisjtimsArk3D({ onComplete, onRetry }: MicroGameProps) {
    const [forsok, setForsok] = useState(0);
    const [fase, setFase] = useState<Fase>('laster');
    const [lastet, setLastet] = useState<string[]>([]);
    const [brukt, setBrukt] = useState<string[]>([]);
    const [banner, setBanner] = useState('Last det som betyr noe om bord. Dra pakkene ut til arken.');
    const ferdigRef = useRef(false);

    const klokke = useGameClock({
        seconds: 40,
        running: fase === 'laster',
        onExpire: () => {
            setBanner('Flommen slo inn over Shuruppak.');
            setFase('tapt');
        },
    });

    const nullstill = useCallback(() => {
        setFase('laster');
        setLastet([]);
        setBrukt([]);
        setBanner('Last det som betyr noe om bord. Dra pakkene ut til arken.');
        ferdigRef.current = false;
        klokke.restart(40);
        setForsok((f) => f + 1);
        onRetry?.();
    }, [klokke, onRetry]);

    const levert = useCallback(
        (l: Last) => {
            setBrukt((b) => (b.includes(l.id) ? b : [...b, l.id]));
            setBanner(l.svar);
            if (l.riktig) {
                microSfx.play('correct');
                setLastet((s) => {
                    const ny = s.includes(l.id) ? s : [...s, l.id];
                    if (ny.length >= RIKTIGE) setFase('tetter');
                    return ny;
                });
            } else {
                microSfx.play('incorrect');
                klokke.restart(Math.max(1, klokke.remaining - 7));
            }
        },
        [klokke]
    );

    const tett = useCallback(() => {
        microSfx.play('advance');
        setBanner('Døra er tettet. Nå stiger vannet.');
        setFase('storm');
    }, []);

    useEffect(() => {
        if (fase !== 'storm') return;
        const t = setTimeout(() => {
            setFase('vunnet');
            setBanner('Sju dager senere strander arken. Du tenner offerbålet.');
        }, 2900);
        return () => clearTimeout(t);
    }, [fase]);

    useEffect(() => {
        if (fase === 'vunnet' && !ferdigRef.current) {
            ferdigRef.current = true;
            microSfx.play('complete');
            onComplete({ score: 1, completed: true });
        }
    }, [fase, onComplete]);

    const igjen = LASTER.filter((l) => !brukt.includes(l.id));

    return (
        <MicroGameScaffold
            title="Utnapisjtims ark"
            subtitle="Flommen kommer. Hva tar du med deg om bord?"
            estimatedSeconds={110}
            onRetry={nullstill}
            scene={
                <Scene
                    key={forsok}
                    fase={fase}
                    lastet={lastet}
                    igjen={igjen}
                    onLevert={levert}
                    onTett={tett}
                />
            }
            canvas={{
                camera: { position: [-3, 11, 17], fov: 42 },
                target: [-1, 1.2, 0],
                background: '#94a9bb',
                light: 'overcast',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Shuruppak ved Eufrat</SceneBadge>
                    {fase === 'laster' && (
                        <>
                            <TimerPill seconds={klokke.remaining} label="Til flommen" corner="bl" />
                            <DragHint show={lastet.length === 0} corner="bc">
                                Dra lasten ut til arken
                            </DragHint>
                        </>
                    )}
                    {fase === 'laster' && <DangerVignette level={1 - klokke.ratio} />}
                    {fase === 'storm' && <DangerVignette level={0.6} />}
                </>
            }
        >
            {fase === 'vunnet' ? (
                <WinScreen title="Arken berget deg" onReplay={nullstill}>
                    Du hadde olje om bord, så du kunne ofre. I fortellingen samlet gudene seg rundt
                    røyken som fluer. De hadde ikke fått offer på sju dager. Slik forteller
                    mesopotamerne det: gudene trengte menneskene like mye som menneskene trengte
                    gudene.
                </WinScreen>
            ) : fase === 'tapt' ? (
                <LoseScreen title="Vannet kom først" onRetry={nullstill}>
                    Arken var ikke tettet da flommen slo inn. Utnapisjtim fikk bare noen få dager
                    på seg etter at Ea advarte ham i drømme. Prøv igjen, og la gullet ligge.
                </LoseScreen>
            ) : (
                <StepTracker current={Math.min(lastet.length, RIKTIGE)} total={RIKTIGE} />
            )}
        </MicroGameScaffold>
    );
}
