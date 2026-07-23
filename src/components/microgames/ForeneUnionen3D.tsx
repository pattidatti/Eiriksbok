import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Unlink, Flag, Trophy, RotateCcw, Hand, ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Burst } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Forene unionen — et stage-drevet 3D-mikrospill om den amerikanske borgerkrigen.
// Landet starter delt i to: et fritt, industrielt Nord og et Sør bygd på slaveri,
// med en lysende sprekk imellom. Eleven driver historien framover i tre trinn:
// krigen bryter ut (1861), slaveriet avskaffes (1863), og unionen samles igjen
// (1865). Scenen leser bare `stage` (0-3) og demper alt mykt mot mål utledet av
// stage. Lyspæra ligger i selve mekanikken: krig + frigjøring + samling gjorde et
// splittet slaveland om til én fri nasjon.

function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

interface Beat {
    id: string;
    stage: number;
    title: string;
    blurb: string;
    Icon: React.ComponentType<{ className?: string }>;
    banner: string;
    fact: string;
}

const BEATS: Beat[] = [
    {
        id: 'krig',
        stage: 1,
        title: 'Krigen bryter ut (1861)',
        blurb: 'Sørstatene melder seg ut av unionen. Nord vil holde landet samlet.',
        Icon: Swords,
        banner: 'Sør bryter ut og danner Konføderasjonen. Nord går til krig for å redde unionen.',
        fact: 'I 1861 meldte elleve sørstater seg ut og dannet sin egen stat. President Lincoln nektet å la landet bli splittet, og den blodigste krigen i USAs historie startet.',
    },
    {
        id: 'frigjoring',
        stage: 2,
        title: 'Frigjøringen (1863)',
        blurb: 'Lincoln erklærer de slavebundne i Sør for frie.',
        Icon: Unlink,
        banner: 'Frigjøringserklæringen: de slavebundne i opprørsstatene er frie. Lenkene faller.',
        fact: 'I 1863 erklærte Lincoln at alle slavebundne i sørstatene var frie. Mange rømte og kjempet selv i Nords hær. Nå handlet krigen tydelig om å avskaffe slaveriet.',
    },
    {
        id: 'samling',
        stage: 3,
        title: 'Unionen samles (1865)',
        blurb: 'Sør gir opp. Landet blir ett igjen, uten slaveri.',
        Icon: Flag,
        banner: 'Sør overgir seg. Landet er samlet igjen, og slaveriet er forbudt i hele USA.',
        fact: 'I 1865 ga Sør opp. Det 13. grunnlovstillegget forbød slaveri i hele landet. Rundt fire millioner mennesker var fri, og USA var igjen én nasjon.',
    },
];

const ForeneUnionen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const nextBeat = BEATS[stage];

    const choose = (beat: Beat) => {
        if (beat.stage !== stage + 1 || done) return;
        sounds.play(beat.stage === 3 ? 'sceneChange' : 'advance');
        setStage(beat.stage);
        setBanner(beat.banner);
        setFact(beat.fact);
        if (beat.stage === 3) {
            setTimeout(() => {
                sounds.play('complete');
                setDone(true);
                setBurst((b) => b + 1);
                onComplete({ score: 1, completed: true, artifact: { stage: 3 } });
            }, 4200);
        } else {
            sounds.play('correct');
        }
    };

    const reset = () => {
        setStage(0);
        setBanner(null);
        setFact(null);
        setDone(false);
    };

    const idle = stage === 0;

    return (
        <MicroGameFrame
            title="Forene unionen"
            subtitle="Gjør et splittet slaveland om til én fri nasjon"
            estimatedSeconds={150}
            onRetry={stage > 0 ? reset : undefined}
            bleed
        >
            <div className="flex flex-col">
                {/* --- 3D-scenen (full bredde) --- */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#cfe0f2] via-[#e3e8ee] to-[#d8cdb6] overflow-hidden"
                    style={{ aspectRatio: '16 / 10.8', minHeight: 360 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [0, 9.5, 15] }}
                        background="#cfe0f2"
                        fog={{ color: '#d3e0ec', near: 28, far: 54 }}
                        target={[0, 0.6, 0]}
                    >
                        <Nation stage={stage} />
                        <Burst position={[0, 4, 0]} trigger={burst} color="#2563eb" count={34} spread={3.8} />
                    </MicroCanvas>
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{ boxShadow: 'inset 0 0 90px 10px rgba(15,23,42,0.18)' }}
                    />

                    {idle && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-blue-800 shadow"
                        >
                            <Hand className="w-3.5 h-3.5" />
                            Dra for å se det delte landet - velg et steg under
                        </motion.div>
                    )}

                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        {stage === 0
                            ? '1860 · Et delt land'
                            : stage === 1
                              ? '1861 · Krig'
                              : stage === 2
                                ? '1863 · Frigjøring'
                                : '1865 · Én union'}
                    </div>

                    <AnimatePresence>
                        {banner && !done && (
                            <motion.div
                                key={banner}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-3 left-3 right-3 mx-auto max-w-md rounded-xl bg-blue-900/85 text-blue-50 px-4 py-2.5 text-sm font-semibold shadow-lg text-center"
                            >
                                {banner}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- Kontrollpanel UNDER vinduet --- */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-amber-200">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                        {done ? 'Unionen er gjenforent' : `Steg ${stage + 1} av 3`}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {BEATS.map((beat) => {
                            const isDone = stage >= beat.stage;
                            const isNext = nextBeat?.id === beat.id && !done;
                            const Icon = beat.Icon;
                            return (
                                <button
                                    key={beat.id}
                                    onClick={() => choose(beat)}
                                    disabled={!isNext}
                                    className={`relative text-left rounded-xl border-2 p-3 transition ${
                                        isDone
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : isNext
                                              ? 'bg-amber-100 border-amber-400 hover:bg-amber-200 hover:border-amber-500 shadow-sm cursor-pointer'
                                              : 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                                isDone
                                                    ? 'bg-emerald-500 text-white'
                                                    : isNext
                                                      ? 'bg-amber-500 text-white'
                                                      : 'bg-slate-200 text-slate-400'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                                {beat.title}
                                            </p>
                                        </div>
                                        {isNext && (
                                            <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                                        {beat.blurb}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        {done ? (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                                className="mt-3 bg-emerald-50 border border-emerald-300 rounded-xl p-3 sm:flex sm:items-center sm:gap-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-2">
                                        <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm font-bold text-emerald-900 leading-snug">
                                            Ett land, fritt for slaveri.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        Krigen kostet over 600 000 liv, men den holdt USA samlet og
                                        gjorde slutt på slaveriet. Sprekken i landet ble lukket - men
                                        kampen for like rettigheter var ikke over.
                                    </p>
                                </div>
                                <button
                                    onClick={reset}
                                    className="mt-2.5 sm:mt-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition flex-shrink-0"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Spill igjen
                                </button>
                            </motion.div>
                        ) : fact ? (
                            <motion.div
                                key={fact}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-3 bg-white border border-amber-200 rounded-xl p-3"
                            >
                                <p className="text-xs text-slate-600 leading-relaxed">{fact}</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 text-center text-xs text-slate-500 italic px-2"
                            >
                                Velg stegene i rekkefølge og se landet leges sammen.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MicroGameFrame>
    );
};

// ============================================================
//  3D-SCENEN — alt utledes av `stage` og dempes mykt mot mal.
// ============================================================

function Nation({ stage }: { stage: number }) {
    return (
        <group>
            <NorthHalf stage={stage} />
            <SouthHalf stage={stage} />
            <Fracture stage={stage} />
            <UnionFlag stage={stage} />
        </group>
    );
}

// Nord-halvdelen glir innover mot midten ved stage 3.
function NorthHalf({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!group.current) return;
        const gap = stage >= 3 ? 0 : 1.1;
        group.current.position.x = damp(group.current.position.x, -gap, dt, 2.2);
    });
    return (
        <group ref={group} position={[-1.1, 0, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.2, 0, 0]} receiveShadow>
                <planeGeometry args={[9, 18]} />
                <meshStandardMaterial color="#5f8f5a" roughness={1} />
            </mesh>
            {/* Industrielt Nord: to fabrikker */}
            <Factory position={[-5.5, 0, -2]} />
            <Factory position={[-3, 0, 2.6]} small />
            {/* En fri arbeider (alltid stolt stående, blå) */}
            <Person position={[-4, 0, 5]} body="#2f5fa6" enslaved={false} stage={stage} phase={0.2} />
            {/* Union-soldater dukker opp ved krig (stage 1) */}
            <Soldier position={[-2.4, 0, -4]} stage={stage} phase={0} />
            <Soldier position={[-3.6, 0, -4.6]} stage={stage} phase={0.5} />
            <Soldier position={[-5, 0, -4]} stage={stage} phase={1.0} />
        </group>
    );
}

// Sør-halvdelen glir innover mot midten ved stage 3.
function SouthHalf({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!group.current) return;
        const gap = stage >= 3 ? 0 : 1.1;
        group.current.position.x = damp(group.current.position.x, gap, dt, 2.2);
    });
    return (
        <group ref={group} position={[1.1, 0, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.2, 0, 0]} receiveShadow>
                <planeGeometry args={[9, 18]} />
                <meshStandardMaterial color="#caa85f" roughness={1} />
            </mesh>
            {/* Plantasjehus */}
            <Plantation position={[5.5, 0, -2.4]} />
            {/* Bomullsrader */}
            <CottonField />
            {/* Slavebundne figurer som reises og frigjøres ved stage 2 */}
            <Person position={[3.2, 0, 1.5]} body="#8a6a4a" enslaved stage={stage} phase={0.1} />
            <Person position={[4.6, 0, 2.6]} body="#8a6a4a" enslaved stage={stage} phase={0.7} />
            <Person position={[5.8, 0, 1.2]} body="#8a6a4a" enslaved stage={stage} phase={1.3} />
        </group>
    );
}

// Den lysende sprekken i landet. Glødende ved krig, lukkes ved samling.
function Fracture({ stage }: { stage: number }) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const mesh = useRef<THREE.Mesh>(null);
    const COLD = new THREE.Color('#6b8bd6');
    const HOT = new THREE.Color('#d4452f');
    useFrame(({ clock }, dt) => {
        const t = clock.getElapsedTime();
        if (mesh.current) {
            // Bredden krymper til null ved stage 3
            const w = stage >= 3 ? 0.02 : 0.55;
            mesh.current.scale.x = damp(mesh.current.scale.x, w / 0.55, dt, 2.2);
            mesh.current.visible = mesh.current.scale.x > 0.06;
        }
        if (matRef.current) {
            // Rød og pulserende under krig (stage 1-2), kjølig ellers
            const target = stage === 1 || stage === 2 ? HOT : COLD;
            matRef.current.color.lerp(target, Math.min(1, dt * 2));
            const pulse = stage === 1 || stage === 2 ? 0.5 + Math.sin(t * 5) * 0.3 : 0.25;
            matRef.current.emissiveIntensity = pulse;
            matRef.current.emissive.lerp(target, Math.min(1, dt * 2));
        }
    });
    return (
        <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <planeGeometry args={[0.55, 18]} />
            <meshStandardMaterial
                ref={matRef}
                color="#6b8bd6"
                emissive="#6b8bd6"
                emissiveIntensity={0.25}
                roughness={0.5}
            />
        </mesh>
    );
}

// En person. Slavebundne starter bøyd med en lenke, og reiser seg fri ved stage 2.
function Person({
    position,
    body,
    enslaved,
    stage,
    phase,
}: {
    position: [number, number, number];
    body: string;
    enslaved: boolean;
    stage: number;
    phase: number;
}) {
    const group = useRef<THREE.Group>(null);
    const torso = useRef<THREE.Group>(null);
    const chain = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const FREE = new THREE.Color('#3f7d4a');
    const BOUND = new THREE.Color(body);
    const freed = !enslaved || stage >= 2;

    useFrame(({ clock }, dt) => {
        const t = clock.getElapsedTime();
        if (torso.current) {
            // Bøyd (negativ x-rotasjon) når bundet, oppreist når fri
            const targetTilt = freed ? 0 : 0.7;
            torso.current.rotation.x = damp(torso.current.rotation.x, targetTilt, dt, 3);
            // Liten gledes-vugg når fri
            torso.current.position.y = freed ? Math.abs(Math.sin(t * 2 + phase)) * 0.05 : 0;
        }
        if (chain.current) {
            const s = enslaved && stage < 2 ? 1 : 0;
            chain.current.scale.setScalar(damp(chain.current.scale.x, s, dt, 4));
            chain.current.visible = chain.current.scale.x > 0.05;
        }
        if (matRef.current) {
            matRef.current.color.lerp(freed ? FREE : BOUND, Math.min(1, dt * 2));
        }
    });

    return (
        <group ref={group} position={position}>
            <group ref={torso} position={[0, 0.1, 0]}>
                {/* kropp */}
                <mesh position={[0, 0.4, 0]} castShadow>
                    <cylinderGeometry args={[0.16, 0.22, 0.62, 8]} />
                    <meshStandardMaterial ref={matRef} color={body} roughness={0.9} />
                </mesh>
                {/* hode */}
                <mesh position={[0, 0.84, 0]} castShadow>
                    <sphereGeometry args={[0.16, 12, 12]} />
                    <meshStandardMaterial color="#caa07a" roughness={0.8} />
                </mesh>
            </group>
            {/* lenke ved føttene (kun bundet) */}
            <mesh ref={chain} position={[0, 0.08, 0.22]} visible={enslaved}>
                <torusGeometry args={[0.16, 0.045, 8, 16]} />
                <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.5} />
            </mesh>
        </group>
    );
}

// En blå Union-soldat som dukker opp ved krig (stage >= 1).
function Soldier({
    position,
    stage,
    phase,
}: {
    position: [number, number, number];
    stage: number;
    phase: number;
}) {
    const group = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!group.current) return;
        const rise = stage >= 1 ? 1 : 0;
        group.current.scale.y = damp(group.current.scale.y, rise, dt, 3 + phase);
        group.current.visible = group.current.scale.y > 0.05;
    });
    return (
        <group ref={group} position={position} scale={[1, 0, 1]} visible={false}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
                <meshStandardMaterial color="#27406e" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.82, 0]} castShadow>
                <sphereGeometry args={[0.15, 12, 12]} />
                <meshStandardMaterial color="#caa07a" roughness={0.8} />
            </mesh>
            {/* rifle */}
            <mesh position={[0.18, 0.55, 0]} rotation={[0, 0, 0.25]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
                <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
            </mesh>
        </group>
    );
}

// En fabrikk med pipe i Nord.
function Factory({ position, small = false }: { position: [number, number, number]; small?: boolean }) {
    const s = small ? 0.7 : 1;
    return (
        <group position={position}>
            <mesh position={[0, 0.7 * s, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.8 * s, 1.4 * s, 1.3 * s]} />
                <meshStandardMaterial color="#9a4634" roughness={0.85} />
            </mesh>
            <mesh position={[0.6 * s, 1.9 * s, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.18, 1.3 * s, 10]} />
                <meshStandardMaterial color="#5a3326" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Et hvitt plantasjehus med søyler i Sør.
function Plantation({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.4, 1.6, 1.8]} />
                <meshStandardMaterial color="#ece6d6" roughness={0.9} />
            </mesh>
            {/* tak */}
            <mesh position={[0, 2.0, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[1.7, 0.7, 4]} />
                <meshStandardMaterial color="#5c4030" roughness={0.9} />
            </mesh>
            {/* søyler */}
            {[-0.8, 0, 0.8].map((x, i) => (
                <mesh key={i} position={[x, 0.7, 1.0]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 1.4, 8]} />
                    <meshStandardMaterial color="#f5f1e6" roughness={0.85} />
                </mesh>
            ))}
        </group>
    );
}

// Bomullsrader: små hvite dotter på rekke.
function CottonField() {
    const rows: [number, number, number][] = [];
    for (let cx = 0; cx < 4; cx++) {
        for (let cz = 0; cz < 4; cz++) {
            rows.push([2.6 + cx * 0.9, 0.18, 4.2 + cz * 0.7]);
        }
    }
    return (
        <group>
            {rows.map((p, i) => (
                <mesh key={i} position={p} castShadow>
                    <sphereGeometry args={[0.12, 8, 8]} />
                    <meshStandardMaterial color="#f3f1ea" roughness={0.95} />
                </mesh>
            ))}
        </group>
    );
}

// Det amerikanske flagget reiser seg i midten når unionen samles (stage 3).
function UnionFlag({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const cloth = useRef<THREE.Mesh>(null);
    useFrame(({ clock }, dt) => {
        if (group.current) {
            const rise = stage >= 3 ? 1 : 0;
            group.current.scale.y = damp(group.current.scale.y, rise, dt, 2.2);
            group.current.visible = group.current.scale.y > 0.04;
        }
        if (cloth.current) {
            cloth.current.rotation.y = Math.sin(clock.getElapsedTime() * 1.6) * 0.12;
        }
    });
    return (
        <group ref={group} position={[0, 0, 5]} scale={[1, 0, 1]} visible={false}>
            {/* stang */}
            <mesh position={[0, 1.4, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 2.8, 8]} />
                <meshStandardMaterial color="#8a6a3a" roughness={0.8} />
            </mesh>
            {/* duk */}
            <mesh ref={cloth} position={[0.7, 2.3, 0]} castShadow>
                <planeGeometry args={[1.4, 0.9]} />
                <meshStandardMaterial color="#bf2030" side={THREE.DoubleSide} roughness={0.85} />
            </mesh>
            {/* blå kanton */}
            <mesh position={[0.25, 2.55, 0.01]}>
                <planeGeometry args={[0.55, 0.45]} />
                <meshStandardMaterial color="#27408b" side={THREE.DoubleSide} roughness={0.85} />
            </mesh>
        </group>
    );
}

export default ForeneUnionen3D;
