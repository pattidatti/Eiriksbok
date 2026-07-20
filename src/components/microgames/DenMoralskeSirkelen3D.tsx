import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneSlider,
    SceneFact,
    SceneQuiz,
    WinScreen,
    DataReadout,
    Burst,
    Person,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Dyreetikk: Har dyr rettigheter?".
// Lyspære-øyeblikket eleven skal kjenne på kroppen: den moralske sirkelen -
// hvem som "teller" moralsk - har flyttet seg utover gjennom historien, og det
// avgjørende spørsmålet er ikke "kan de tenke?" men "kan de lide?".
//   - En SceneSlider blåser opp en glødende sirkel rundt mennesket.
//   - Vesener som havner innenfor lyser opp; utenfor er de grå.
//   - Grensa går der evnen til å lide slutter (mellom bie og plante/stein).

type Phase = 'explore' | 'quiz' | 'won';

interface Being {
    id: string;
    label: string;
    capacity: string;
    r: number;
    angle: number;
    sentient: boolean;
    kind: 'dog' | 'pig' | 'fish' | 'bee' | 'plant' | 'stone';
    color: string;
}

// Vesener plassert utover fra mennesket i midten. Radiusen bestemmer når de
// kommer innenfor sirkelen. Grensa for "kan lide" går mellom bie og plante.
const BEINGS: Being[] = [
    { id: 'hund', label: 'Hund', capacity: 'Kjenner smerte, glede og frykt', r: 2.4, angle: -0.5, sentient: true, kind: 'dog', color: '#b07a4a' },
    { id: 'gris', label: 'Gris', capacity: 'Like smart som en hund, kjenner lidelse', r: 3.7, angle: 0.9, sentient: true, kind: 'pig', color: '#e6a6ac' },
    { id: 'fisk', label: 'Fisk', capacity: 'Kjenner smerte, viser nyere forskning', r: 5.1, angle: -1.7, sentient: true, kind: 'fish', color: '#5fa8c9' },
    { id: 'bie', label: 'Insekt', capacity: 'Enkelt nervesystem, forskerne er usikre', r: 6.5, angle: 2.1, sentient: true, kind: 'bee', color: '#d8a520' },
    { id: 'plante', label: 'Plante', capacity: 'Ingen nervesystem, kan ikke føle', r: 8.0, angle: -2.7, sentient: false, kind: 'plant', color: '#5f9a45' },
    { id: 'stein', label: 'Stein', capacity: 'Livløs, kan ikke lide', r: 9.4, angle: 0.2, sentient: false, kind: 'stone', color: '#8a8f98' },
];

const MIN_R = 1.6;
const MAX_R = 10;
const SENTIENCE_EDGE = 7; // mellom bie (6.5) og plante (8.0)

const DenMoralskeSirkelen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('explore');
    const [circleR, setCircleR] = useState(MIN_R);
    const [explored, setExplored] = useState(false);
    const [selected, setSelected] = useState<Being | null>(null);
    const [banner, setBanner] = useState<string | null>(
        'Dra spaken og blås opp den moralske sirkelen. Hvem hører med?'
    );
    const [burst, setBurst] = useState(0);
    const doneRef = useRef(false);

    const insideCount = BEINGS.filter((b) => b.r <= circleR).length;

    const reset = () => {
        setPhase('explore');
        setCircleR(MIN_R);
        setExplored(false);
        setSelected(null);
        setBanner('Dra spaken og blås opp den moralske sirkelen. Hvem hører med?');
        setBurst(0);
        doneRef.current = false;
    };

    const onSlide = (v: number) => {
        setCircleR(v);
        if (v >= MAX_R - 0.5 && !explored) {
            setExplored(true);
            setBurst((b) => b + 1);
            sounds.play('advance');
            setBanner('Du har sett hele spekteret. Men hvor bør grensa egentlig gå?');
        } else if (!explored) {
            if (v > SENTIENCE_EDGE) {
                setBanner('Planter og stein har ikke nervesystem. Kan noe som ikke kan føle, ha krav på oss?');
            } else if (v >= 2.4) {
                setBanner('Alt innenfor sirkelen "teller" moralsk. Dyr som kan lide, kommer med.');
            }
        }
    };

    const inspect = (b: Being) => {
        setSelected(b);
        sounds.play('correct');
    };

    const finish = (correct: boolean) => {
        if (doneRef.current) return;
        doneRef.current = true;
        setBurst((b) => b + 1);
        setPhase('won');
        sounds.play('complete');
        onComplete({ score: correct ? 1 : 0.7, completed: true, artifact: { maxR: circleR } });
    };

    const showHint = phase === 'explore' && !explored && circleR < 3;

    return (
        <MicroGameScaffold
            title="Den moralske sirkelen"
            subtitle="Blås opp sirkelen over hvem som teller moralsk, og finn ut hva som avgjør grensa"
            estimatedSeconds={150}
            onRetry={circleR > MIN_R || phase !== 'explore' ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#cfe0f5] via-[#dbe8f2] to-[#f2ece0]"
            canvas={{
                idle: phase === 'explore' && circleR <= MIN_R + 0.01,
                autoRotateSpeed: 0.2,
                camera: { position: [0, 9.5, 13], fov: 42 },
                background: '#d6e4f2',
                fog: { color: '#dde8f2', near: 24, far: 80 },
                target: [0, 0.6, 0],
                contactShadows: false,
                maxPolarAngle: Math.PI / 2.1,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Kan de lide?</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[{ label: 'Innenfor', value: insideCount, unit: `/ ${BEINGS.length}` }]}
                    />
                    <DragHint show={showHint}>Dra spaken for å utvide sirkelen</DragHint>
                </>
            }
            scene={
                <CircleScene
                    circleR={circleR}
                    burst={burst}
                    selectedId={selected?.id ?? null}
                    onInspect={inspect}
                />
            }
        >
            {phase === 'explore' && (
                <div className="flex flex-col gap-3">
                    <SceneSlider
                        label="Hvor stor er den moralske sirkelen?"
                        min={MIN_R}
                        max={MAX_R}
                        step={0.1}
                        value={circleR}
                        onChange={onSlide}
                        valueLabel={() => `${insideCount} vesener med`}
                    />

                    <SceneFact>
                        {selected ? (
                            <>
                                <span className="font-bold text-slate-800">{selected.label}:</span>{' '}
                                {selected.capacity}.{' '}
                                {selected.sentient
                                    ? 'Kan kjenne smerte, og hører derfor hjemme i sirkelen.'
                                    : 'Uten evne til å føle har den ingenting å tape, og faller utenfor.'}
                            </>
                        ) : (
                            <>
                                <span className="font-bold text-slate-800">Klikk et vesen</span> for å
                                se hva det kan føle. Jo lenger ut sirkelen når, jo flere teller med,
                                helt til du passerer det som ikke kan lide.
                            </>
                        )}
                    </SceneFact>

                    {explored ? (
                        <button
                            onClick={() => {
                                setBanner(null);
                                setPhase('quiz');
                                sounds.play('advance');
                            }}
                            className="self-start inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
                        >
                            Jeg har utforsket sirkelen, svar på spørsmålet
                        </button>
                    ) : (
                        <p className="text-xs text-slate-500">
                            Dra spaken helt ut, så du ser både dyra, planten og steinen.
                        </p>
                    )}
                </div>
            )}

            {phase === 'quiz' && (
                <SceneQuiz
                    question="Hva avgjør best hvem som hører hjemme i den moralske sirkelen?"
                    options={[
                        'Om vesenet kan lide og føle',
                        'Om vesenet er like smart som et menneske',
                        'Om vesenet kan snakke og tenke i ord',
                        'Om vesenet er nyttig for mennesker',
                    ]}
                    answerIndex={0}
                    explanation="Riktig. Filosofen Jeremy Bentham skrev alt i 1789 at spørsmålet ikke er om dyr kan tenke eller snakke, men om de kan lide. Evnen til å føle smerte er grunnen til at et vesen kan behandles rett eller galt, og derfor faller planter og stein utenfor."
                    onResult={finish}
                />
            )}

            {phase === 'won' && (
                <WinScreen title="Du fant grensa for den moralske sirkelen!" onReplay={reset}>
                    Den moralske sirkelen har vokst gjennom historien: fra bare min egen slekt, til
                    alle mennesker, og for mange i dag også til dyr som kan lide. Det avgjørende er
                    ikke hvor smart et vesen er, men om det kan føle. Derfor er hund, gris og fisk med,
                    mens plante og stein faller utenfor.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN: mennesket i midten, vesener utover, en glødende sirkel
// ============================================================

interface SceneProps {
    circleR: number;
    burst: number;
    selectedId: string | null;
    onInspect: (b: Being) => void;
}

function CircleScene({ circleR, burst, selectedId, onInspect }: SceneProps) {
    const ringR = useRef(MIN_R);
    const ringMesh = useRef<THREE.Mesh>(null);
    const discMat = useRef<THREE.MeshBasicMaterial>(null);
    const haloMats = useRef<Record<string, THREE.MeshBasicMaterial | null>>({});

    const positions = useMemo(
        () =>
            BEINGS.map((b) => ({
                ...b,
                pos: [Math.cos(b.angle) * b.r, 0, Math.sin(b.angle) * b.r] as [number, number, number],
            })),
        []
    );

    useFrame((_, dt) => {
        ringR.current = damp(ringR.current, circleR, dt, 5);
        const r = ringR.current;
        if (ringMesh.current) ringMesh.current.scale.set(r, r, r);
        if (discMat.current) discMat.current.opacity = 0.12 + Math.min(0.1, r * 0.008);

        positions.forEach((b) => {
            const inside = b.r <= circleR;
            const halo = haloMats.current[b.id];
            if (halo) {
                const target = inside ? (b.sentient ? 0.6 : 0.32) : 0.0;
                halo.opacity = damp(halo.opacity, target, dt, 5);
            }
        });
    });

    return (
        <group>
            <SkyDome />
            <StarMotes />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                <circleGeometry args={[13, 48]} />
                <meshStandardMaterial color="#e7eef4" roughness={1} />
            </mesh>

            {/* Den glødende moralske sirkelen (skalert i useFrame) */}
            <group>
                <mesh ref={ringMesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
                    <ringGeometry args={[0.96, 1, 64]} />
                    <meshBasicMaterial color="#f2b34d" transparent opacity={0.9} fog={false} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[circleR, circleR, 1]}>
                    <circleGeometry args={[1, 64]} />
                    <meshBasicMaterial
                        ref={discMat}
                        color="#ffd98a"
                        transparent
                        opacity={0.16}
                        depthWrite={false}
                        fog={false}
                    />
                </mesh>
            </group>

            {/* Mennesket i sentrum - alltid innenfor */}
            <group position={[0, 0, 0]}>
                <Person position={[0, 0, 0]} scale={1.35} body="#3f6ea5" skin="#e8bd93" legs="#2f4a63" />
                <Billboard position={[0, 1.5, 0]}>
                    <Html center pointerEvents="none">
                        <div className="px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shadow bg-white/90 text-slate-800">
                            Meg
                        </div>
                    </Html>
                </Billboard>
            </group>

            {/* Vesenene utover */}
            {positions.map((b) => {
                const inside = b.r <= circleR;
                const isSel = selectedId === b.id;
                return (
                    <Interactive
                        key={b.id}
                        position={b.pos}
                        hitArea={[1.8, 1.8, 1.8]}
                        sound={null}
                        onSelect={() => onInspect(b)}
                    >
                        <group>
                            <BeingMesh kind={b.kind} color={inside ? b.color : '#aab1ba'} />
                            {/* mykt glød-skall som lyser når vesenet er innenfor */}
                            <mesh position={[0, 0.5, 0]} scale={1.8}>
                                <sphereGeometry args={[0.6, 18, 18]} />
                                <meshBasicMaterial
                                    ref={(m) => {
                                        haloMats.current[b.id] = m;
                                    }}
                                    color={b.sentient ? '#ffe0a0' : '#cdd4dc'}
                                    transparent
                                    opacity={0}
                                    depthWrite={false}
                                    blending={THREE.AdditiveBlending}
                                    side={THREE.BackSide}
                                    fog={false}
                                />
                            </mesh>
                            <Billboard position={[0, 1.4, 0]}>
                                <Html center pointerEvents="none">
                                    <div
                                        className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shadow ${
                                            inside
                                                ? 'bg-white/90 text-slate-800'
                                                : 'bg-slate-600/70 text-slate-100'
                                        } ${isSel ? 'ring-2 ring-amber-400' : ''}`}
                                    >
                                        {b.label}
                                    </div>
                                </Html>
                            </Billboard>
                        </group>
                    </Interactive>
                );
            })}

            <Burst position={[0, 1, 0]} trigger={burst} color="#ffd98a" count={30} spread={4} />
        </group>
    );
}

// Enkle, gjenkjennelige lavpoly-silhuetter per vesen.
function BeingMesh({ kind, color }: { kind: Being['kind']; color: string }) {
    const mat = <meshStandardMaterial color={color} roughness={0.7} />;
    switch (kind) {
        case 'dog':
            return (
                <group position={[0, 0, 0]}>
                    <mesh position={[0, 0.5, 0]} castShadow>
                        <boxGeometry args={[0.9, 0.42, 0.4]} />
                        {mat}
                    </mesh>
                    <mesh position={[0.5, 0.7, 0]} castShadow>
                        <boxGeometry args={[0.34, 0.34, 0.34]} />
                        {mat}
                    </mesh>
                    <mesh position={[0.68, 0.62, 0]} castShadow>
                        <boxGeometry args={[0.22, 0.16, 0.22]} />
                        {mat}
                    </mesh>
                    {[-0.3, 0.3].map((x) =>
                        [-0.14, 0.14].map((z) => (
                            <mesh key={`${x}-${z}`} position={[x, 0.18, z]} castShadow>
                                <boxGeometry args={[0.12, 0.36, 0.12]} />
                                {mat}
                            </mesh>
                        ))
                    )}
                </group>
            );
        case 'pig':
            return (
                <group>
                    <mesh position={[0, 0.55, 0]} castShadow>
                        <sphereGeometry args={[0.55, 16, 12]} />
                        {mat}
                    </mesh>
                    <mesh position={[0.5, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.18, 0.2, 0.18, 12]} />
                        {mat}
                    </mesh>
                    {[-0.25, 0.25].map((x) =>
                        [-0.22, 0.22].map((z) => (
                            <mesh key={`${x}-${z}`} position={[x, 0.16, z]} castShadow>
                                <boxGeometry args={[0.14, 0.32, 0.14]} />
                                {mat}
                            </mesh>
                        ))
                    )}
                </group>
            );
        case 'fish':
            return (
                <group position={[0, 0.7, 0]} rotation={[0, 0, 0]}>
                    <mesh castShadow scale={[1.1, 0.7, 0.4]}>
                        <sphereGeometry args={[0.55, 16, 12]} />
                        {mat}
                    </mesh>
                    <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <coneGeometry args={[0.32, 0.5, 4]} />
                        {mat}
                    </mesh>
                </group>
            );
        case 'bee':
            return (
                <group position={[0, 0.7, 0]}>
                    <mesh castShadow>
                        <sphereGeometry args={[0.34, 14, 12]} />
                        {mat}
                    </mesh>
                    <mesh position={[-0.05, 0.3, 0.28]} rotation={[0.4, 0, 0]}>
                        <planeGeometry args={[0.4, 0.24]} />
                        <meshStandardMaterial color="#e8f4ff" transparent opacity={0.7} side={THREE.DoubleSide} />
                    </mesh>
                    <mesh position={[-0.05, 0.3, -0.28]} rotation={[-0.4, 0, 0]}>
                        <planeGeometry args={[0.4, 0.24]} />
                        <meshStandardMaterial color="#e8f4ff" transparent opacity={0.7} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            );
        case 'plant':
            return (
                <group>
                    <mesh position={[0, 0.4, 0]} castShadow>
                        <cylinderGeometry args={[0.07, 0.09, 0.8, 8]} />
                        <meshStandardMaterial color="#4c7a35" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 0.9, 0]} castShadow>
                        <sphereGeometry args={[0.28, 14, 12]} />
                        {mat}
                    </mesh>
                    <mesh position={[0.22, 0.55, 0]} rotation={[0, 0, -0.7]} castShadow>
                        <boxGeometry args={[0.3, 0.05, 0.16]} />
                        <meshStandardMaterial color="#4c7a35" roughness={0.9} />
                    </mesh>
                </group>
            );
        case 'stone':
        default:
            return (
                <mesh position={[0, 0.42, 0]} castShadow>
                    <dodecahedronGeometry args={[0.5, 0]} />
                    {mat}
                </mesh>
            );
    }
}

// --- Lys himmelkuppel (kjølig topp -> varm horisont, aldri mørk) ---
function SkyDome() {
    const texture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 256;
        const ctx = c.getContext('2d');
        if (ctx) {
            const g = ctx.createLinearGradient(0, 0, 0, 256);
            g.addColorStop(0, '#9ab6de');
            g.addColorStop(0.5, '#cadcef');
            g.addColorStop(0.8, '#e7e4dc');
            g.addColorStop(1, '#f4ecdb');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 16, 256);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }, []);
    return (
        <mesh scale={[-1, 1, 1]}>
            <sphereGeometry args={[60, 24, 24]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false} />
        </mesh>
    );
}

function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

function StarMotes() {
    const data = useMemo(() => {
        const rand = makeRng(0x1c3);
        return Array.from({ length: 38 }, () => {
            const r = 11 + rand() * 22;
            const theta = rand() * Math.PI * 2;
            return [Math.cos(theta) * r, 3 + rand() * 12, Math.sin(theta) * r - 3] as [
                number,
                number,
                number,
            ];
        });
    }, []);
    const grp = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (grp.current) grp.current.position.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.3;
    });
    return (
        <group ref={grp}>
            {data.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.05, 6, 6]} />
                    <meshBasicMaterial color="#fff6da" transparent opacity={0.7} fog={false} />
                </mesh>
            ))}
        </group>
    );
}

export default DenMoralskeSirkelen3D;
