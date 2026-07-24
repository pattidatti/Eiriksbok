import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameScaffold } from './kit/MicroGameScaffold';
import { Interactive, Burst } from './kit';
import { SceneBanner, SceneBadge, DragHint, WinScreen } from './kit/overlays';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Kalmarunionen som et 3D-mikrospill. Eleven klikker de tre kronene (Danmark,
// Norge, Sverige) og ser dem fly opp og samle seg over én trone - unionen dannes
// i 1397. Men da Sverige bryter seg løs i 1523, blir Norge igjen som den svake
// parten, bundet til Danmark. Mekanikken ER lyspæra: tre riker under én konge,
// men ulik makt, og til slutt sprenges unionen.
//
// Hele scenen drives av to tilstander: hvilke kroner som er plassert, og fasen
// (gather -> united -> broken). Hvert delobjekt demper mykt mot et mål utledet
// av disse - ingen tilstand spres ut i mange refs.

function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

type CrownId = 'dk' | 'no' | 'se';
type Phase = 'gather' | 'united' | 'broken';

interface Kingdom {
    id: CrownId;
    name: string;
    gem: string; // farge på edelstenen som viser riket
    home: [number, number, number]; // pidestall på gulvet
    slot: [number, number, number]; // plass i ringen over trona
    fact: string;
}

// Danmark sitter høyest og midt i ringen - makten lå i Danmark.
// home-y = 0.75 løfter krona opp på steinsokkelen (sokkelen står på bakken,
// y 0..0.6) - med y = 0 lå kronene halvveis nedsunket i gresset og soklene
// var helt begravd. Radius ~5 holder soklene utenfor plattformen og alle tre
// kronene innenfor kamerautsnittet.
const KINGDOMS: Kingdom[] = [
    {
        id: 'dk',
        name: 'Danmark',
        gem: '#d24b54',
        home: [-4.4, 0.75, 2.9],
        slot: [0, 3.05, 0.2],
        fact: 'Danmark var det rikeste riket. Unionskongen styrte fra Danmark, og derfor lå makten her.',
    },
    {
        id: 'no',
        name: 'Norge',
        gem: '#5688c7',
        home: [0, 0.75, 5.0],
        slot: [-1.35, 2.35, -0.7],
        fact: 'Norge var svekket etter svartedauden. Som det minste riket ble Norge den svake parten i unionen.',
    },
    {
        id: 'se',
        name: 'Sverige',
        gem: '#f2c200',
        home: [4.4, 0.75, 2.9],
        slot: [1.35, 2.35, -0.7],
        fact: 'Den svenske adelen likte ikke å bli styrt fra Danmark. Sverige gjorde opprør gang på gang.',
    },
];

export default function KalmarKronene3D({ onComplete }: MicroGameProps) {
    const sounds = useStepSounds();
    const [placed, setPlaced] = useState<CrownId[]>([]);
    const [phase, setPhase] = useState<Phase>('gather');
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const place = (k: Kingdom) => {
        if (placed.includes(k.id) || phase !== 'gather') return;
        sounds.play('pick');
        const next = [...placed, k.id];
        setPlaced(next);
        setBanner(`${k.name} slutter seg til unionen`);
        setFact(k.fact);
        if (next.length === 3) {
            setBurst((b) => b + 1);
            window.setTimeout(() => {
                sounds.play('advance');
                setPhase('united');
                setBanner('Kalmarunionen er dannet (1397)');
                setFact(
                    'Dronning Margrete samlet Danmark, Norge og Sverige under én konge i Kalmar i 1397. Tre kroner, men bare ett rike som egentlig bestemte: Danmark.'
                );
            }, 800);
        }
    };

    const breakUnion = () => {
        if (phase !== 'united') return;
        sounds.play('sceneChange');
        setPhase('broken');
        setBurst((b) => b + 1);
        setBanner('Sverige bryter ut (1523)');
        setFact(
            'I 1523 valgte svenskene Gustav Vasa til konge, og Sverige forlot unionen for godt. Norge ble igjen alene under Danmark i nesten 300 år til.'
        );
        window.setTimeout(() => {
            sounds.play('complete');
            setDone(true);
            onComplete({ score: 1, completed: true, artifact: { phase: 'broken' } });
        }, 2800);
    };

    const reset = () => {
        setPlaced([]);
        setPhase('gather');
        setBanner(null);
        setFact(null);
        setDone(false);
    };

    const idle = placed.length === 0;
    const era =
        phase === 'broken'
            ? '1523 · Unionen sprenges'
            : phase === 'united'
              ? '1397 · Tre riker, én konge'
              : 'Senmiddelalder · Norden samles';

    return (
        <MicroGameScaffold
            title="Samle de tre kronene"
            subtitle="Dann Kalmarunionen i 3D, og se hva som skjer da Sverige bryter ut"
            estimatedSeconds={130}
            onRetry={placed.length > 0 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 7.2, 13.5], fov: 42 },
                background: '#cfe4f2',
                fog: { color: '#d6e6f0', near: 28, far: 52 },
                target: [0, 1.6, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{era}</SceneBadge>
                    <DragHint show={idle}>Klikk en krone for å samle den</DragHint>
                </>
            }
            scene={
                <CoronationScene placed={placed} phase={phase} burst={burst} onPick={place} />
            }
        >
            {/* Kontroller under vinduet */}
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                {phase === 'gather'
                    ? `Kroner samlet: ${placed.length} av 3`
                    : phase === 'united'
                      ? 'Unionen står - men er den trygg?'
                      : 'Unionen er sprengt'}
            </p>

            {phase === 'gather' && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {KINGDOMS.map((k) => {
                        const isPlaced = placed.includes(k.id);
                        return (
                            <button
                                key={k.id}
                                onClick={() => place(k)}
                                disabled={isPlaced}
                                className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-left transition ${
                                    isPlaced
                                        ? 'border-emerald-300 bg-emerald-50'
                                        : 'border-amber-400 bg-amber-100 shadow-sm hover:border-amber-500 hover:bg-amber-200'
                                }`}
                            >
                                <span
                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: k.gem }}
                                >
                                    <Crown className="h-5 w-5 text-white" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-bold leading-tight text-slate-800">
                                        {k.name}
                                    </span>
                                    <span className="block text-xs text-slate-500">
                                        {isPlaced ? 'I unionen' : 'Klikk for å samle'}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {phase === 'united' && (
                <button
                    onClick={breakUnion}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700"
                >
                    <Sparkles className="h-4 w-4" />
                    Spol fram til 1523: Sverige bryter ut
                </button>
            )}

            <AnimatePresence mode="wait">
                {done ? (
                    <motion.div key="win" className="mt-3">
                        <WinScreen
                            title="Tre kroner, én konge - og til slutt to skilte veier."
                            onReplay={reset}
                        >
                            Kalmarunionen samlet Norden under én konge, men makten lå i Danmark. Da
                            Sverige rev seg løs i 1523, ble Norge igjen som den svake parten under
                            Danmark.
                        </WinScreen>
                    </motion.div>
                ) : fact ? (
                    <motion.div
                        key={fact}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 rounded-xl border border-amber-200 bg-white p-3"
                    >
                        <p className="text-xs leading-relaxed text-slate-600">{fact}</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 px-2 text-center text-xs italic text-slate-500"
                    >
                        Klikk kronene til Danmark, Norge og Sverige, og se unionen reise seg.
                    </motion.div>
                )}
            </AnimatePresence>
        </MicroGameScaffold>
    );
}

// ============================================================
//  3D-SCENEN
// ============================================================

function CoronationScene({
    placed,
    phase,
    burst,
    onPick,
}: {
    placed: CrownId[];
    phase: Phase;
    burst: number;
    onPick: (k: Kingdom) => void;
}) {
    return (
        <group>
            <Ground />
            <Dais />
            <Throne />
            <Queen />
            <UnionGlow active={phase !== 'gather'} broken={phase === 'broken'} />
            <BondBeam show={phase === 'broken'} />
            {KINGDOMS.map((k) => (
                <CrownPiece
                    key={k.id}
                    kingdom={k}
                    placed={placed.includes(k.id)}
                    phase={phase}
                    onPick={() => onPick(k)}
                />
            ))}
            {/* Feiring når unionen dannes og når den sprenges */}
            <Burst position={[0, 3.4, 0]} trigger={burst} color="#e9c94a" count={26} spread={3} />
        </group>
    );
}

function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <circleGeometry args={[16, 48]} />
            <meshStandardMaterial color="#7f8a57" roughness={1} />
        </mesh>
    );
}

// Rund steinplattform der kroningen skjer.
function Dais() {
    return (
        <group>
            <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[4.4, 4.7, 0.3, 40]} />
                <meshStandardMaterial color="#b7ad97" roughness={0.95} />
            </mesh>
            <mesh position={[0, 0.42, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[3.4, 3.7, 0.26, 40]} />
                <meshStandardMaterial color="#cabfa6" roughness={0.95} />
            </mesh>
        </group>
    );
}

// Tronen i sentrum.
function Throne() {
    return (
        <group position={[0, 0.55, -0.3]}>
            <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[1.3, 0.25, 1.1]} />
                <meshStandardMaterial color="#6e4a2b" roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.35, -0.45]} castShadow>
                <boxGeometry args={[1.3, 1.7, 0.22]} />
                <meshStandardMaterial color="#5d3e24" roughness={0.8} />
            </mesh>
            <mesh position={[-0.62, 0.85, 0]} castShadow>
                <boxGeometry args={[0.18, 0.6, 1.0]} />
                <meshStandardMaterial color="#5d3e24" roughness={0.8} />
            </mesh>
            <mesh position={[0.62, 0.85, 0]} castShadow>
                <boxGeometry args={[0.18, 0.6, 1.0]} />
                <meshStandardMaterial color="#5d3e24" roughness={0.8} />
            </mesh>
            <mesh position={[-0.62, 2.25, -0.45]} castShadow>
                <sphereGeometry args={[0.16, 12, 12]} />
                <meshStandardMaterial color="#d9b44a" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0.62, 2.25, -0.45]} castShadow>
                <sphereGeometry args={[0.16, 12, 12]} />
                <meshStandardMaterial color="#d9b44a" metalness={0.5} roughness={0.4} />
            </mesh>
        </group>
    );
}

// Dronning Margrete - enkel figur på tronen.
function Queen() {
    return (
        <group position={[0, 0.95, -0.25]}>
            <mesh position={[0, 0.55, 0]} castShadow>
                <coneGeometry args={[0.45, 1.1, 16]} />
                <meshStandardMaterial color="#7a2740" roughness={0.85} />
            </mesh>
            <mesh position={[0, 1.25, 0]} castShadow>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color="#e8c39a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.42, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.12, 10, 1, true]} />
                <meshStandardMaterial
                    color="#e9c94a"
                    metalness={0.6}
                    roughness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// En glødende ring som lyser opp når unionen står, og dempes når den sprenges.
function UnionGlow({ active, broken }: { active: boolean; broken: boolean }) {
    const matRef = useRef<THREE.MeshBasicMaterial>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    useFrame(({ clock }, dt) => {
        const target = broken ? 0.08 : active ? 0.42 : 0;
        if (matRef.current) {
            matRef.current.opacity = damp(matRef.current.opacity, target, dt, 2.2);
        }
        if (ringRef.current) {
            ringRef.current.rotation.z = clock.getElapsedTime() * 0.3;
        }
    });
    return (
        <mesh ref={ringRef} position={[0, 2.7, -0.1]} rotation={[Math.PI / 2.2, 0, 0]}>
            <ringGeometry args={[1.7, 2.3, 40]} />
            <meshBasicMaterial
                ref={matRef}
                color="#f4d36a"
                transparent
                opacity={0}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
}

// Et lysende bånd mellom Danmark og Norge som dukker opp når Sverige drar -
// Norge blir bundet til Danmark.
function BondBeam({ show }: { show: boolean }) {
    const matRef = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((_, dt) => {
        if (matRef.current) {
            matRef.current.opacity = damp(matRef.current.opacity, show ? 0.8 : 0, dt, 2);
        }
    });
    // Midt mellom dk-slot (0, 3.05, 0.2) og no-slot (-1.35, 2.35, -0.7).
    // Sylinderen står langs Y som default - roter den så aksen peker langs
    // linja mellom de to kronene (hånd-satte Euler-vinkler traff ikke).
    const quat = useMemo(
        () =>
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(-1.35, -0.7, -0.9).normalize()
            ),
        []
    );
    return (
        <mesh position={[-0.68, 2.7, -0.25]} quaternion={quat}>
            <cylinderGeometry args={[0.05, 0.05, 1.7, 8]} />
            <meshBasicMaterial
                ref={matRef}
                color="#c0504a"
                transparent
                opacity={0}
                depthWrite={false}
            />
        </mesh>
    );
}

// En krone: gullband med takker og en farget edelsten. Animerer mykt fra
// pidestall til ringplass, og Sverige flyr bort når unionen sprenges.
function CrownPiece({
    kingdom,
    placed,
    phase,
    onPick,
}: {
    kingdom: Kingdom;
    placed: boolean;
    phase: Phase;
    onPick: () => void;
}) {
    const group = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.MeshStandardMaterial>(null);
    const leaver = kingdom.id === 'se';

    // Målposisjon utledet av tilstand.
    const target: [number, number, number] =
        phase === 'broken' && leaver
            ? [kingdom.slot[0] * 3.2, 8.5, kingdom.slot[2] * 3.2 - 6]
            : placed
              ? kingdom.slot
              : kingdom.home;

    useFrame(({ clock }, dt) => {
        const g = group.current;
        if (!g) return;
        g.position.x = damp(g.position.x, target[0], dt, 3);
        g.position.y = damp(g.position.y, target[1], dt, 3);
        g.position.z = damp(g.position.z, target[2], dt, 3);
        if (placed) {
            g.rotation.y = clock.getElapsedTime() * 0.6;
            g.position.y += Math.sin(clock.getElapsedTime() * 1.5 + kingdom.home[0]) * 0.03;
        } else {
            g.rotation.y = damp(g.rotation.y, 0, dt, 4);
        }
        if (glowRef.current) {
            glowRef.current.emissiveIntensity = damp(
                glowRef.current.emissiveIntensity,
                placed ? 0.5 : 0,
                dt,
                3
            );
        }
    });

    const crownMesh = (
        <group>
            <mesh castShadow>
                <cylinderGeometry args={[0.34, 0.34, 0.3, 10, 1, true]} />
                <meshStandardMaterial
                    ref={glowRef}
                    color="#e3bf52"
                    metalness={0.6}
                    roughness={0.3}
                    emissive={kingdom.gem}
                    emissiveIntensity={0}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {Array.from({ length: 6 }).map((_, i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        position={[Math.cos(a) * 0.34, 0.28, Math.sin(a) * 0.34]}
                        castShadow
                    >
                        <coneGeometry args={[0.08, 0.26, 6]} />
                        <meshStandardMaterial color="#e9c94a" metalness={0.6} roughness={0.3} />
                    </mesh>
                );
            })}
            <mesh position={[0, 0.02, 0.34]} castShadow>
                <octahedronGeometry args={[0.12, 0]} />
                <meshStandardMaterial
                    color={kingdom.gem}
                    emissive={kingdom.gem}
                    emissiveIntensity={0.4}
                    roughness={0.3}
                />
            </mesh>
        </group>
    );

    const clickable = !placed && phase === 'gather';

    return (
        <group ref={group} position={kingdom.home}>
            {!placed && (
                <mesh position={[0, -0.45, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.4, 0.5, 0.6, 12]} />
                    <meshStandardMaterial color="#9a8f78" roughness={0.95} />
                </mesh>
            )}
            {clickable ? (
                <Interactive onSelect={onPick} hitArea={[1.3, 1.6, 1.3]}>
                    {crownMesh}
                </Interactive>
            ) : (
                crownMesh
            )}
        </group>
    );
}
