import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameScaffold, Interactive, Burst, DragHint, SceneFact, WinScreen } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Roter Colosseum og klikk de fire etasjene i riktig byggerekkefølge.
// Lærer arkitektur-rekkefølgen: dorisk (bunn) → jonisk → korintisk → attika.
//
// Bygd på interaksjons-toolkitet: MicroGameScaffold (full-bredde-vindu, kontroller
// under), Interactive (klikkbare etasjer), Burst (feiring ved fullført rekkefølge).

interface Level {
    order: number;
    name: string;
    columnStyle: string;
    fact: string;
    y: number;
    radiusOuter: number;
    radiusInner: number;
    height: number;
}

const LEVELS: Level[] = [
    {
        order: 1,
        name: '1. etasje',
        columnStyle: 'Dorisk',
        fact: 'Tyngste søylestil — enkle, kraftige søyler. Begynt under keiser Vespasian rundt år 70 e.Kr.',
        y: 0,
        radiusOuter: 3.0,
        radiusInner: 2.5,
        height: 1.6,
    },
    {
        order: 2,
        name: '2. etasje',
        columnStyle: 'Jonisk',
        fact: 'Slankere søyler med voluttkapiteler. Bygd under Vespasians sønn Titus.',
        y: 1.6,
        radiusOuter: 2.85,
        radiusInner: 2.35,
        height: 1.5,
    },
    {
        order: 3,
        name: '3. etasje',
        columnStyle: 'Korintisk',
        fact: 'Mest dekorerte søyler — akantusblader. Ferdig under Domitian rundt år 80 e.Kr.',
        y: 3.1,
        radiusOuter: 2.7,
        radiusInner: 2.2,
        height: 1.4,
    },
    {
        order: 4,
        name: '4. etasje (attika)',
        columnStyle: 'Pilaster',
        fact: 'Solid topp uten åpne bueganger. Her ble velariet (soltaket) festet med master.',
        y: 4.5,
        radiusOuter: 2.6,
        radiusInner: 2.1,
        height: 1.0,
    },
];

const Colosseum3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    // Etasjer valgt riktig, i rekkefølge (erstatter tidsstempel-sortering).
    const [correctOrder, setCorrectOrder] = useState<number[]>([]);
    const [wrongOrder, setWrongOrder] = useState<number | null>(null);
    const [hoveredOrder, setHoveredOrder] = useState<number | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const nextExpected = correctOrder.length + 1;

    const handleSelect = (order: number) => {
        if (done) return;
        if (correctOrder.includes(order)) return;

        if (order === nextExpected) {
            const next = [...correctOrder, order];
            setCorrectOrder(next);
            sounds.play('correct');
            if (next.length === LEVELS.length) {
                setTimeout(() => {
                    sounds.play('complete');
                    setDone(true);
                    setBurst((b) => b + 1);
                    onComplete({ score: 1, completed: true, artifact: { perfectOrder: true } });
                }, 600);
            }
        } else {
            sounds.play('incorrect');
            setWrongOrder(order);
            setTimeout(() => setWrongOrder(null), 800);
        }
    };

    const handleRetry = () => {
        setCorrectOrder([]);
        setWrongOrder(null);
        setDone(false);
    };

    const handleFinish = () => {
        onComplete({
            score: correctOrder.length / LEVELS.length,
            completed: true,
            artifact: { perfectOrder: done },
        });
    };

    const currentLevel = LEVELS.find((l) => l.order === nextExpected);
    const lastOrder = correctOrder[correctOrder.length - 1];
    const lastCorrectLevel = lastOrder ? LEVELS.find((l) => l.order === lastOrder) ?? null : null;
    const idle = correctOrder.length === 0 && !done;

    return (
        <MicroGameScaffold
            title="Roter Colosseum"
            subtitle="Klikk etasjene i byggerekkefølge — nederst først"
            estimatedSeconds={120}
            onRetry={correctOrder.length > 0 ? handleRetry : undefined}
            canvas={{
                idle,
                camera: { position: [9, 7, 9], fov: 38 },
                background: '#f8eed7',
                fog: { near: 22, far: 46 },
                target: [0, 2, 0],
            }}
            containerClassName="bg-gradient-to-b from-[#fef9ee] to-[#e8d8b8]"
            overlays={<DragHint show={idle}>Dra for å rotere - klikk nederste etasje først</DragHint>}
            scene={
                <>
                    {/* Grunn */}
                    <mesh receiveShadow position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[5, 64]} />
                        <meshStandardMaterial color="#d4be8f" roughness={0.95} />
                    </mesh>
                    {/* Indre arena-grøft */}
                    <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[2.0, 48]} />
                        <meshStandardMaterial color="#9b7d4a" roughness={1.0} />
                    </mesh>

                    {LEVELS.map((level) => (
                        <ColosseumLevel
                            key={level.order}
                            level={level}
                            state={
                                wrongOrder === level.order
                                    ? 'wrong'
                                    : correctOrder.includes(level.order)
                                      ? 'correct'
                                      : hoveredOrder === level.order
                                        ? 'hover'
                                        : 'idle'
                            }
                            onSelect={() => handleSelect(level.order)}
                            onHover={(h) => setHoveredOrder(h ? level.order : null)}
                        />
                    ))}

                    <Burst position={[0, 6, 0]} trigger={burst} color="#e0b54a" count={34} spread={3.5} />
                </>
            }
        >
            {/* Etasjeknapper som rad (også for trackpad) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LEVELS.map((level) => {
                    const isDone = correctOrder.includes(level.order);
                    const isExpected = level.order === nextExpected && !done;
                    const isWrong = wrongOrder === level.order;
                    return (
                        <button
                            key={level.order}
                            onClick={() => handleSelect(level.order)}
                            onMouseEnter={() => setHoveredOrder(level.order)}
                            onMouseLeave={() => setHoveredOrder(null)}
                            disabled={done || isDone}
                            className={`relative rounded-xl border-2 p-2.5 text-left transition group ${
                                isDone
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : isWrong
                                      ? 'bg-rose-50 border-rose-300 animate-pulse'
                                      : isExpected
                                        ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                                        : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                <span
                                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                        isDone
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 text-slate-600 group-hover:bg-amber-200'
                                    }`}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : isWrong ? (
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                    ) : (
                                        '?'
                                    )}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800">{level.name}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500">
                                        {level.columnStyle}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Status og fakta */}
            <div className="mt-3">
                <AnimatePresence mode="wait">
                    {done ? (
                        <WinScreen
                            key="done"
                            title="Perfekt! Du har Colosseums hele byggrekkefølge."
                            onReplay={handleRetry}
                            onNext={handleFinish}
                        >
                            Hele monumentet sto ferdig i år 80 e.Kr - 50 000 tilskuere kunne ta plass.
                        </WinScreen>
                    ) : lastCorrectLevel ? (
                        <SceneFact key={lastCorrectLevel.order}>
                            <span className="font-bold text-amber-700">
                                {lastCorrectLevel.name} · {lastCorrectLevel.columnStyle}.
                            </span>{' '}
                            {lastCorrectLevel.fact}
                        </SceneFact>
                    ) : currentLevel ? (
                        <motion.div
                            key="hint"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/70 border border-amber-200 rounded-xl p-3 text-center text-xs text-slate-600 italic"
                        >
                            Hvilken etasje ble bygd{' '}
                            {nextExpected === 1 ? 'som den første' : `som nummer ${nextExpected}`}? Klikk
                            etasjen direkte på modellen eller i listen.
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </MicroGameScaffold>
    );
};

// 3D-MESH PR. ETASJE - Interactive håndterer klikk/hover/cursor; ringRef beholder
// puls (korrekt) og risting (feil).

interface ColosseumLevelProps {
    level: Level;
    state: 'idle' | 'hover' | 'correct' | 'wrong';
    onSelect: () => void;
    onHover: (hovering: boolean) => void;
}

const ColosseumLevel: React.FC<ColosseumLevelProps> = ({ level, state, onSelect, onHover }) => {
    const ringRef = useRef<THREE.Group>(null);

    const archCount = level.order === 4 ? 36 : 28;
    const archHeight = level.height * 0.7;

    const baseColor =
        level.order === 1
            ? '#d3b98c'
            : level.order === 2
              ? '#cdb185'
              : level.order === 3
                ? '#c7a97c'
                : '#b78f57';

    const color =
        state === 'correct'
            ? '#34d399'
            : state === 'wrong'
              ? '#fb7185'
              : state === 'hover'
                ? '#fcd34d'
                : baseColor;

    const emissive = state === 'correct' ? '#10b981' : state === 'hover' ? '#f59e0b' : '#000000';
    const emissiveIntensity = state === 'correct' ? 0.25 : state === 'hover' ? 0.15 : 0;

    useFrame(({ clock }) => {
        if (!ringRef.current) return;
        const t = clock.getElapsedTime();
        if (state === 'correct') {
            const scale = 1 + Math.sin(t * 6) * 0.012;
            ringRef.current.scale.set(scale, 1, scale);
            ringRef.current.position.x = 0;
        } else if (state === 'wrong') {
            ringRef.current.position.x = Math.sin(t * 30) * 0.04;
            ringRef.current.scale.set(1, 1, 1);
        } else {
            ringRef.current.position.x = 0;
            ringRef.current.scale.set(1, 1, 1);
        }
    });

    return (
        <Interactive
            onSelect={onSelect}
            onHover={onHover}
            state={state}
            hoverScale={1}
            position={[0, level.y, 0]}
        >
            <group ref={ringRef}>
                {/* Ytre vegg */}
                <mesh castShadow receiveShadow>
                    <cylinderGeometry
                        args={[level.radiusOuter, level.radiusOuter, level.height, 48, 1, true]}
                    />
                    <meshStandardMaterial
                        color={color}
                        roughness={0.85}
                        emissive={emissive}
                        emissiveIntensity={emissiveIntensity}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Bunn/topp-ringer (gulvskille). Torus ligger i XY-planet som
                    standard - må roteres om X for å ligge vannrett rundt etasjen. */}
                <mesh position={[0, -level.height / 2 + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[level.radiusOuter, 0.08, 8, 48]} />
                    <meshStandardMaterial color="#9c7e51" roughness={0.7} />
                </mesh>
                <mesh position={[0, level.height / 2 - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[level.radiusOuter, 0.08, 8, 48]} />
                    <meshStandardMaterial color="#9c7e51" roughness={0.7} />
                </mesh>

                {/* Søyler/bueganger (ikke for attika) */}
                {level.order < 4 &&
                    Array.from({ length: archCount }).map((_, i) => {
                        const angle = (i / archCount) * Math.PI * 2;
                        const x = Math.cos(angle) * (level.radiusOuter + 0.01);
                        const z = Math.sin(angle) * (level.radiusOuter + 0.01);
                        return (
                            <mesh
                                key={i}
                                position={[x, 0, z]}
                                rotation={[0, -angle + Math.PI / 2, 0]}
                                castShadow
                            >
                                <boxGeometry args={[0.12, archHeight, 0.18]} />
                                <meshStandardMaterial color="#b6925c" roughness={0.9} />
                            </mesh>
                        );
                    })}
            </group>
        </Interactive>
    );
};

export default Colosseum3D;
