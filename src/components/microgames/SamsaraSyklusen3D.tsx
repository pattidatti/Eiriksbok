import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    SceneBanner,
    SceneBadge,
    WinScreen,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til "Sentrale trekk i Buddhismen".
// Kjerneideen eleven skal kjenne på kroppen: Nirvana er ikke et sted - det er
// tilstanden som oppstår når De tre gifter er sluknet. "Nirvana" betyr bokstavelig
// "utblåsing" - som å blåse ut en flamme.
// Tre orbiterende gifter (Grådighet, Hat, Uvitenhet) omgir sjelen som en mørk
// tyngdekraft. Eleven klikker bort én gift om gangen og ser sjelen roe seg og
// lysne. Når alle tre er borte, forvandles den til rent lys.

interface PoisonDef {
    id: string;
    label: string;
    removal: string;
    color: string;
    emissive: string;
    burstColor: string;
    startAngle: number;
    orbitSpeed: number;
    orbitRadius: number;
}

const POISONS: PoisonDef[] = [
    {
        id: 'grådighet',
        label: 'Grådighet',
        removal: '"Raga" er sluknet - begjæret er ute',
        color: '#d92020',
        emissive: '#8b0f0f',
        burstColor: '#ff7070',
        startAngle: 0,
        orbitSpeed: 0.44,
        orbitRadius: 2.65,
    },
    {
        id: 'hat',
        label: 'Hat',
        removal: '"Dvesha" er sluknet - vreden er ute',
        color: '#1a38a8',
        emissive: '#0d1e68',
        burstColor: '#7090ff',
        startAngle: (Math.PI * 2) / 3,
        orbitSpeed: 0.36,
        orbitRadius: 2.92,
    },
    {
        id: 'uvitenhet',
        label: 'Uvitenhet',
        removal: '"Moha" er sluknet - mørket er ute',
        color: '#7a6e8a',
        emissive: '#4a3e5e',
        burstColor: '#d0b8f0',
        startAngle: (Math.PI * 4) / 3,
        orbitSpeed: 0.52,
        orbitRadius: 2.42,
    },
];

// Deterministisk pseudo-random for stjerner
function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// --- Stjerner i kosmos ---
const StarMotes: React.FC = () => {
    const positions = useMemo(() => {
        const rand = makeRng(2024);
        return Array.from({ length: 50 }, () => {
            const r = 10 + rand() * 25;
            const theta = rand() * Math.PI * 2;
            const phi = (rand() - 0.5) * Math.PI;
            return [
                Math.cos(theta) * Math.cos(phi) * r,
                (rand() - 0.5) * 14,
                Math.sin(theta) * Math.cos(phi) * r - 8,
            ] as [number, number, number];
        });
    }, []);

    return (
        <>
            {positions.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.05 + (i % 4) * 0.03, 4, 4]} />
                    <meshBasicMaterial color={i % 5 === 0 ? '#ffe8aa' : '#ddd0ff'} fog={false} />
                </mesh>
            ))}
        </>
    );
};

// --- Orbiterende giftorb ---
interface PoisonOrbProps {
    poison: PoisonDef;
    removed: boolean;
    burstTrigger: number;
    onRemove: () => void;
}

const PoisonOrb: React.FC<PoisonOrbProps> = ({ poison, removed, burstTrigger, onRemove }) => {
    const outerRef = useRef<THREE.Group>(null);
    const angleRef = useRef(poison.startAngle);

    useFrame((_, dt) => {
        if (!outerRef.current || removed) return;
        angleRef.current += dt * poison.orbitSpeed;
        const a = angleRef.current;
        const r = poison.orbitRadius;
        outerRef.current.position.set(
            Math.cos(a) * r,
            Math.sin(a * 1.4) * 0.45,
            Math.sin(a) * r
        );
    });

    return (
        <group ref={outerRef}>
            {/* Burst fires at last known position when burstTrigger increments */}
            <Burst
                position={[0, 0, 0]}
                trigger={burstTrigger}
                color={poison.burstColor}
                count={22}
                spread={3.2}
                size={0.15}
            />
            {!removed && (
                <Interactive onSelect={onRemove} hitArea={[1.6, 1.6, 1.6]}>
                    {(state) => (
                        <>
                            <mesh>
                                <sphereGeometry args={[0.5, 20, 20]} />
                                <meshStandardMaterial
                                    color={poison.color}
                                    emissive={poison.emissive}
                                    emissiveIntensity={state === 'hover' ? 0.95 : 0.42}
                                    roughness={0.45}
                                    metalness={0.25}
                                />
                            </mesh>
                            {/* Glowing ring around orb */}
                            <mesh rotation={[Math.PI / 2, 0, 0]}>
                                <torusGeometry args={[0.65, 0.04, 8, 32]} />
                                <meshStandardMaterial
                                    color={poison.color}
                                    emissive={poison.emissive}
                                    emissiveIntensity={state === 'hover' ? 1.4 : 0.55}
                                    transparent
                                    opacity={0.7}
                                />
                            </mesh>
                        </>
                    )}
                </Interactive>
            )}
        </group>
    );
};

// --- Sentralsfæren (sjelen i Samsara) ---
const SOUL_COLORS = [
    new THREE.Color(0.55, 0.6, 0.72),  // grå-blå (alle gifter)
    new THREE.Color(0.7, 0.75, 0.6),   // lys grønn-gul (to igjen)
    new THREE.Color(0.9, 0.85, 0.5),   // varm gull (én igjen)
    new THREE.Color(1.0, 0.96, 0.72),  // lyst gull (Nirvana)
];
const SOUL_EMISSIVE = [0.08, 0.28, 0.62, 1.5];

const SoulSphere: React.FC<{ removedCount: number }> = ({ removedCount }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const emRef = useRef(SOUL_EMISSIVE[0]);
    const colorRef = useRef(new THREE.Color().copy(SOUL_COLORS[0]));
    const targetColor = SOUL_COLORS[Math.min(removedCount, 3)];
    const targetEmissive = SOUL_EMISSIVE[Math.min(removedCount, 3)];

    useFrame((_, dt) => {
        if (!meshRef.current) return;
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        emRef.current = damp(emRef.current, targetEmissive, dt, 2.5);
        colorRef.current.lerp(targetColor, dt * 1.8);
        mat.emissiveIntensity = emRef.current;
        mat.emissive.copy(colorRef.current);
        mat.color.copy(colorRef.current);
        // Gentle rotation - faster the more liberated
        meshRef.current.rotation.y += dt * (0.12 + removedCount * 0.15);
        meshRef.current.rotation.x += dt * 0.04;
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.88, 36, 36]} />
            <meshStandardMaterial
                color={new THREE.Color(0.55, 0.6, 0.72)}
                emissive={new THREE.Color(0.4, 0.44, 0.6)}
                emissiveIntensity={0.08}
                roughness={0.28}
                metalness={0.42}
            />
        </mesh>
    );
};

// --- Samsara-ringen (dekorativ ring rundt sfæren) ---
const SamsaraRing: React.FC<{ removedCount: number }> = ({ removedCount }) => {
    const ringRef = useRef<THREE.Mesh>(null);
    const opacityRef = useRef(0.35);

    useFrame((_, dt) => {
        if (!ringRef.current) return;
        opacityRef.current = damp(opacityRef.current, removedCount >= 3 ? 0 : 0.35, dt, 3);
        (ringRef.current.material as THREE.MeshStandardMaterial).opacity = opacityRef.current;
        ringRef.current.rotation.y += dt * 0.22;
        ringRef.current.rotation.x += dt * 0.08;
    });

    return (
        <mesh ref={ringRef} rotation={[Math.PI / 6, 0, Math.PI / 8]}>
            <torusGeometry args={[1.55, 0.04, 8, 80]} />
            <meshStandardMaterial
                color="#6050a0"
                emissive="#302060"
                emissiveIntensity={0.4}
                transparent
                opacity={0.35}
            />
        </mesh>
    );
};

// --- Win-burst i midten ---
const WinCelebration: React.FC = () => (
    <>
        <Burst position={[0, 0, 0]} trigger={1} color="#ffe060" count={45} spread={5} size={0.22} />
        <Burst position={[0, 0, 0]} trigger={1} color="#ffffff" count={20} spread={3} size={0.12} />
        <Burst position={[0, 0, 0]} trigger={1} color="#d0a0ff" count={18} spread={4} size={0.14} />
    </>
);

// --- Hele scenen ---
interface SceneProps {
    removed: Set<string>;
    burstTriggers: Record<string, number>;
    onRemove: (id: string) => void;
    won: boolean;
}

const SamsaraScene: React.FC<SceneProps> = ({ removed, burstTriggers, onRemove, won }) => {
    const removedCount = removed.size;

    return (
        <>
            <StarMotes />
            <ambientLight intensity={0.12} color="#8080c0" />
            <pointLight position={[0, 0, 0]} intensity={2.2} color="#c0ccff" distance={14} />
            <pointLight position={[0, 8, -5]} intensity={0.9} color="#9ab0ff" distance={20} />
            <pointLight position={[6, -3, 6]} intensity={0.45} color="#ffeebb" distance={12} />

            <SoulSphere removedCount={removedCount} />
            <SamsaraRing removedCount={removedCount} />

            {POISONS.map((poison) => (
                <PoisonOrb
                    key={poison.id}
                    poison={poison}
                    removed={removed.has(poison.id)}
                    burstTrigger={burstTriggers[poison.id] ?? 0}
                    onRemove={() => onRemove(poison.id)}
                />
            ))}

            {won && <WinCelebration />}
        </>
    );
};

// --- Hovede komponent ---
const SamsaraSyklusen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [removed, setRemoved] = useState<Set<string>>(new Set());
    const [burstTriggers, setBurstTriggers] = useState<Record<string, number>>({});
    const [won, setWon] = useState(false);
    const [lastHint, setLastHint] = useState<string | null>(null);
    const winFiredRef = useRef(false);
    const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleRemove = useCallback(
        (id: string) => {
            if (removed.has(id) || won) return;
            sounds.play('correct');
            const newRemoved = new Set([...removed, id]);
            setRemoved(newRemoved);
            setBurstTriggers((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
            const poison = POISONS.find((p) => p.id === id);
            if (poison) setLastHint(poison.removal);
            if (newRemoved.size === 3 && !winFiredRef.current) {
                winFiredRef.current = true;
                winTimerRef.current = setTimeout(() => {
                    setWon(true);
                    sounds.play('complete');
                    onComplete({ score: 1, completed: true });
                }, 1100);
            }
        },
        [removed, won, sounds, onComplete]
    );

    const reset = useCallback(() => {
        if (winTimerRef.current) clearTimeout(winTimerRef.current);
        setRemoved(new Set());
        setBurstTriggers({});
        setWon(false);
        setLastHint(null);
        winFiredRef.current = false;
    }, []);

    useEffect(
        () => () => {
            if (winTimerRef.current) clearTimeout(winTimerRef.current);
        },
        []
    );

    const banner = won
        ? 'Nirvana - alle tre gifter er sluknet'
        : lastHint ?? 'Klikk De tre gifter for å frigjøre sjelen';

    const remaining = 3 - removed.size;

    return (
        <MicroGameScaffold
            title="Samsaras kretsløp"
            subtitle="Fjern De tre gifter og nå Nirvana"
            estimatedSeconds={90}
            onRetry={reset}
            scene={
                <SamsaraScene
                    removed={removed}
                    burstTriggers={burstTriggers}
                    onRemove={handleRemove}
                    won={won}
                />
            }
            canvas={{
                camera: { position: [0, 2.8, 10.5], fov: 42 },
                background: '#030212',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {remaining} {remaining === 1 ? 'gift' : 'gifter'} igjen
                    </SceneBadge>
                </>
            }
            containerClassName="bg-gradient-to-b from-[#03020e] via-[#060318] to-[#0a061e]"
        >
            {won ? (
                <WinScreen title="Nirvana oppnådd" onReplay={reset}>
                    <p className="text-sm text-emerald-700 text-center leading-relaxed">
                        "Nirvana" betyr "utblåsing" - som å blåse ut en flamme. Grådighet, hat og
                        uvitenhet er sluknet. Slik beskriver buddhismen veien til frigjøring fra
                        Samsaras kretsløp av gjenfødsel og lidelse.
                    </p>
                </WinScreen>
            ) : (
                <div className="flex gap-2 flex-wrap justify-center px-3 py-2.5">
                    {POISONS.map((p) => {
                        const isDone = removed.has(p.id);
                        return (
                            <div
                                key={p.id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
                                    isDone
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-500 line-through opacity-40'
                                        : 'bg-white border-slate-200 text-slate-600'
                                }`}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 inline-block"
                                    style={{ backgroundColor: p.color }}
                                />
                                {p.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </MicroGameScaffold>
    );
};

export default SamsaraSyklusen3D;
