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
    SceneFact,
    SceneQuiz,
    WinScreen,
    DataReadout,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Kunstig intelligens: Kan en maskin gjøre det rette?".
// Lyspære-øyeblikket: en KI kjenner bare igjen det den har sett før. Fôrer du den
// skjeve treningsdata, tar den skjeve valg, og bommer på dem den aldri fikk lære.
//   - Eleven bygger treningsdataen ved å klikke ansiktstyper inn i KI-maskinen.
//   - "Kjør KI-en" tester den på alle fire typene.
//   - Typer som var med, lyser grønt (gjenkjent). Typer som manglet, lyser rødt (bommet).
// Ansikter skilles på FORM (rund, firkantet, høy, bred), ikke farge/identitet.

type Phase = 'train' | 'result' | 'quiz' | 'won';
type Shape = 'rund' | 'firkantet' | 'hoy' | 'bred';

interface FaceType {
    id: Shape;
    label: string;
    trayX: number;
    testX: number;
}

const FACE_TYPES: FaceType[] = [
    { id: 'rund', label: 'Rund', trayX: -4.5, testX: -4.5 },
    { id: 'firkantet', label: 'Firkantet', trayX: -1.5, testX: -1.5 },
    { id: 'hoy', label: 'Høy', trayX: 1.5, testX: 1.5 },
    { id: 'bred', label: 'Bred', trayX: 4.5, testX: 4.5 },
];

const Skjevhetsspeilet3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('train');
    const [trained, setTrained] = useState<Set<Shape>>(new Set());
    const [banner, setBanner] = useState<string | null>(
        'Klikk ansiktstyper for å legge dem i treningsdataen. KI-en lærer bare av det du gir den.'
    );
    const [burst, setBurst] = useState(0);
    const doneRef = useRef(false);

    const recognized = phase !== 'train' ? FACE_TYPES.filter((f) => trained.has(f.id)).length : 0;

    const reset = () => {
        setPhase('train');
        setTrained(new Set());
        setBanner('Klikk ansiktstyper for å legge dem i treningsdataen. KI-en lærer bare av det du gir den.');
        setBurst(0);
        doneRef.current = false;
    };

    const toggleTrain = (id: Shape) => {
        if (phase !== 'train') return;
        sounds.play('pick');
        setTrained((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const run = () => {
        if (trained.size === 0) return;
        setPhase('result');
        setBurst((b) => b + 1);
        sounds.play('advance');
        const miss = FACE_TYPES.length - trained.size;
        if (miss === 0) {
            setBanner('KI-en kjente igjen alle fire. Variert treningsdata gir en KI som ser alle.');
        } else {
            setBanner(
                `KI-en kjente igjen ${trained.size} av 4. Den bommer på de ${miss} typene den aldri så i treningen.`
            );
        }
    };

    const finish = (correct: boolean) => {
        if (doneRef.current) return;
        doneRef.current = true;
        setBurst((b) => b + 1);
        setPhase('won');
        sounds.play('complete');
        onComplete({ score: correct ? 1 : 0.7, completed: true, artifact: { trained: trained.size } });
    };

    const showHint = phase === 'train' && trained.size === 0;

    return (
        <MicroGameScaffold
            title="Skjevhets-speilet"
            subtitle="Tren en ansiktsgjenkjennings-KI, og se hvem den lærer å se – og hvem den bommer på"
            estimatedSeconds={150}
            onRetry={trained.size > 0 || phase !== 'train' ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#d5e2f2] via-[#dce7f1] to-[#eef0f4]"
            canvas={{
                idle: phase === 'train' && trained.size === 0,
                autoRotateSpeed: 0.15,
                camera: { position: [0, 6.5, 13], fov: 42 },
                background: '#dbe6f3',
                fog: { color: '#e2ebf4', near: 26, far: 80 },
                target: [0, 1.2, 0],
                contactShadows: false,
                maxPolarAngle: Math.PI / 2.1,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Ser bare det den har sett før</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            phase === 'train'
                                ? { label: 'Typer i dataen', value: trained.size, unit: '/ 4' }
                                : { label: 'Gjenkjent', value: recognized, unit: '/ 4' },
                        ]}
                    />
                    <DragHint show={showHint}>Klikk et ansikt for å legge det i treningsdataen</DragHint>
                </>
            }
            scene={<BiasScene phase={phase} trained={trained} burst={burst} onTrain={toggleTrain} />}
        >
            {phase === 'train' && (
                <div className="flex flex-col gap-3">
                    <SceneFact>
                        <span className="font-bold text-slate-800">Bygg treningsdataen.</span> Klikk
                        ansiktene du vil at KI-en skal lære av. Prøv gjerne å utelate én type, og se
                        hva som skjer når du kjører den.
                    </SceneFact>
                    <button
                        onClick={run}
                        disabled={trained.size === 0}
                        className="self-start inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
                    >
                        Kjør KI-en på alle fire typene
                    </button>
                </div>
            )}

            {phase === 'result' && (
                <div className="flex flex-col gap-3">
                    <SceneFact>
                        Grønt ansikt = KI-en kjente det igjen. Rødt = den bommet, fordi den aldri så
                        den typen i treningen. En KI som trener på skjeve data, behandler folk skjevt.
                    </SceneFact>
                    <button
                        onClick={() => {
                            setBanner(null);
                            setPhase('quiz');
                            sounds.play('advance');
                        }}
                        className="self-start inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
                    >
                        Jeg har sett resultatet, svar på spørsmålet
                    </button>
                </div>
            )}

            {phase === 'quiz' && (
                <SceneQuiz
                    question="Hvorfor bommet KI-en på noen av ansiktene?"
                    options={[
                        'Fordi den aldri fikk se den typen i treningsdataen',
                        'Fordi de ansiktene var stygge',
                        'Fordi KI-en ble sur og valgte å ikke svare',
                        'Fordi maskinen forstår hva som er rettferdig',
                    ]}
                    answerIndex={0}
                    explanation="Riktig. En KI lærer mønstre av eksemplene den får. Mangler en type i treningsdataen, lærer den aldri å kjenne den igjen. Derfor kan skjeve data føre til at ekte mennesker blir behandlet urettferdig, uten at noen mente det."
                    onResult={finish}
                />
            )}

            {phase === 'won' && (
                <WinScreen title="Du så hvordan skjevheten oppstår!" onReplay={reset}>
                    En KI er et speil av dataene den lærer av. Fôrer du den et smalt utvalg, blir den
                    god på det og blind for resten. Derfor er variert og rettferdig treningsdata ikke
                    bare teknikk, men et etisk valg: det avgjør hvem KI-en ser, og hvem den overser.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN: KI-maskinen bak, treningstrau foran, testrad i midten
// ============================================================

interface SceneProps {
    phase: Phase;
    trained: Set<Shape>;
    burst: number;
    onTrain: (id: Shape) => void;
}

function BiasScene({ phase, trained, burst, onTrain }: SceneProps) {
    return (
        <group>
            <SkyDome />
            {/* Gulv */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                <circleGeometry args={[16, 48]} />
                <meshStandardMaterial color="#e9eef4" roughness={1} />
            </mesh>

            {/* KI-maskinen bak scenen */}
            <Machine active={phase !== 'train'} />

            {phase === 'train' ? (
                // Treningstrau: klikkbare ansiktstyper
                FACE_TYPES.map((f) => {
                    const inData = trained.has(f.id);
                    return (
                        <Interactive
                            key={f.id}
                            position={[f.trayX, 0, 3.6]}
                            hitArea={[2, 2.4, 2]}
                            sound={null}
                            onSelect={() => onTrain(f.id)}
                        >
                            <group>
                                <FaceMesh shape={f.id} tint={inData ? '#a7f3d0' : '#e7d9c4'} glow={inData} />
                                <FaceLabel y={2.1} active={inData}>
                                    {inData ? `${f.label} ✓` : f.label}
                                </FaceLabel>
                            </group>
                        </Interactive>
                    );
                })
            ) : (
                // Testrad: alle fire typene bedommes
                FACE_TYPES.map((f) => {
                    const ok = trained.has(f.id);
                    return (
                        <group key={f.id} position={[f.testX, 0, 1.4]}>
                            <FaceMesh
                                shape={f.id}
                                tint={ok ? '#bbf7d0' : '#fecdd3'}
                                glow={ok}
                                fail={!ok}
                            />
                            <FaceLabel y={2.1} active={ok} fail={!ok}>
                                {ok ? `${f.label}  gjenkjent` : `${f.label}  bommet`}
                            </FaceLabel>
                        </group>
                    );
                })
            )}

            <Burst position={[0, 2.4, 0]} trigger={burst} color="#a5c9f2" count={26} spread={4} />
        </group>
    );
}

// KI-maskinen: en boks med en glødende skjerm som lyser sterkere når den er aktiv.
function Machine({ active }: { active: boolean }) {
    const screen = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (screen.current) {
            const target = active ? 1.1 : 0.35;
            screen.current.emissiveIntensity = damp(screen.current.emissiveIntensity, target, dt, 4);
        }
    });
    return (
        <group position={[0, 0, -3.4]}>
            {/* kabinett */}
            <mesh position={[0, 1.7, 0]} castShadow>
                <boxGeometry args={[6.4, 3.4, 1.4]} />
                <meshStandardMaterial color="#cfd6e0" roughness={0.6} metalness={0.15} />
            </mesh>
            {/* skjerm */}
            <mesh position={[0, 1.9, 0.72]}>
                <planeGeometry args={[5.4, 2.2]} />
                <meshStandardMaterial
                    ref={screen}
                    color="#1e3a5f"
                    emissive="#4f9be8"
                    emissiveIntensity={0.35}
                />
            </mesh>
            {/* et lite "øye"/linse over skjermen */}
            <mesh position={[0, 3.6, 0.6]}>
                <sphereGeometry args={[0.34, 18, 18]} />
                <meshStandardMaterial color="#334155" emissive="#7dd3fc" emissiveIntensity={active ? 1.4 : 0.4} />
            </mesh>
            <Billboard position={[0, 4.4, 0.6]}>
                <Html center pointerEvents="none">
                    <div className="px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shadow bg-white/90 text-slate-800">
                        Ansikts-KI
                    </div>
                </Html>
            </Billboard>
        </group>
    );
}

// Et enkelt "ansikt" med hodeform per type, samme nøytrale hudtone.
// Distinksjonen er FORM, ikke farge, for å unngå identitets-koding.
function FaceMesh({ shape, tint, glow, fail }: { shape: Shape; tint: string; glow?: boolean; fail?: boolean }) {
    const haloRef = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((_, dt) => {
        if (haloRef.current) {
            const target = glow ? 0.55 : fail ? 0.4 : 0;
            haloRef.current.opacity = damp(haloRef.current.opacity, target, dt, 5);
        }
    });

    // hodeform
    let head: React.ReactNode;
    const skin = <meshStandardMaterial color="#e7d0b3" roughness={0.7} />;
    switch (shape) {
        case 'rund':
            head = (
                <mesh position={[0, 1.2, 0]} castShadow>
                    <sphereGeometry args={[0.8, 20, 18]} />
                    {skin}
                </mesh>
            );
            break;
        case 'firkantet':
            head = (
                <mesh position={[0, 1.2, 0]} castShadow>
                    <boxGeometry args={[1.4, 1.4, 1.2]} />
                    {skin}
                </mesh>
            );
            break;
        case 'hoy':
            head = (
                <mesh position={[0, 1.35, 0]} castShadow>
                    <boxGeometry args={[1, 1.9, 1]} />
                    {skin}
                </mesh>
            );
            break;
        case 'bred':
        default:
            head = (
                <mesh position={[0, 1.15, 0]} castShadow>
                    <boxGeometry args={[1.9, 1, 1.1]} />
                    {skin}
                </mesh>
            );
            break;
    }

    return (
        <group>
            {/* kropp/skulder */}
            <mesh position={[0, 0.35, 0]} castShadow>
                <cylinderGeometry args={[0.55, 0.75, 0.8, 16]} />
                <meshStandardMaterial color="#8ea2b8" roughness={0.8} />
            </mesh>
            {head}
            {/* øyne */}
            <mesh position={[-0.28, 1.32, 0.6]}>
                <sphereGeometry args={[0.11, 10, 10]} />
                <meshStandardMaterial color="#33414f" />
            </mesh>
            <mesh position={[0.28, 1.32, 0.6]}>
                <sphereGeometry args={[0.11, 10, 10]} />
                <meshStandardMaterial color="#33414f" />
            </mesh>
            {/* farge-ring rundt foten viser status (gronn/rod) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <ringGeometry args={[0.95, 1.15, 40]} />
                <meshBasicMaterial color={tint} transparent opacity={0.9} fog={false} />
            </mesh>
            {/* mykt glødeskall */}
            <mesh position={[0, 1.2, 0]} scale={1.9}>
                <sphereGeometry args={[0.8, 18, 18]} />
                <meshBasicMaterial
                    ref={haloRef}
                    color={fail ? '#fda4af' : '#8ef0b8'}
                    transparent
                    opacity={0}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.BackSide}
                    fog={false}
                />
            </mesh>
        </group>
    );
}

function FaceLabel({
    children,
    y,
    active,
    fail,
}: {
    children: React.ReactNode;
    y: number;
    active?: boolean;
    fail?: boolean;
}) {
    const cls = fail
        ? 'bg-rose-600/80 text-rose-50'
        : active
          ? 'bg-emerald-600/85 text-emerald-50'
          : 'bg-white/90 text-slate-800';
    return (
        <Billboard position={[0, y, 0]}>
            <Html center pointerEvents="none">
                <div className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shadow ${cls}`}>
                    {children}
                </div>
            </Html>
        </Billboard>
    );
}

// Lys himmelkuppel (kjølig topp -> lys horisont, aldri mørk).
function SkyDome() {
    const texture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 256;
        const ctx = c.getContext('2d');
        if (ctx) {
            const g = ctx.createLinearGradient(0, 0, 0, 256);
            g.addColorStop(0, '#a6c0e2');
            g.addColorStop(0.5, '#cddcee');
            g.addColorStop(0.85, '#e6ebf2');
            g.addColorStop(1, '#eef1f5');
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

export default Skjevhetsspeilet3D;
