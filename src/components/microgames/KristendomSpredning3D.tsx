import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    Burst,
    damp,
} from './kit';
import type { MicroGameProps } from './types';

// Kristendommens spredning: 12 disipler i Jerusalem → 2,4 milliarder i dag.
// Eleven trykker "Neste epoke" og ser glødende byer aktiveres på en roterende
// globus i mørkt kosmos, ett historisk steg om gangen.

const GLOBE_R = 2.3;

function latLng(lat: number, lng: number, r = GLOBE_R + 0.07): [number, number, number] {
    const phi = (lat * Math.PI) / 180;
    const theta = (lng * Math.PI) / 180;
    return [
        r * Math.cos(phi) * Math.cos(theta),
        r * Math.sin(phi),
        r * Math.cos(phi) * Math.sin(theta),
    ];
}

interface CityConfig {
    pos: [number, number, number];
    activeFromStage: number;
    color: string;
}

const CITIES: CityConfig[] = [
    // Stage 0 - Jerusalem
    { pos: latLng(31.8, 35.2), activeFromStage: 0, color: '#ffd700' },
    // Stage 1 - Romerriket (år 300)
    { pos: latLng(41.9, 12.5), activeFromStage: 1, color: '#ffb060' },
    { pos: latLng(36.2, 36.2), activeFromStage: 1, color: '#ffb060' },
    { pos: latLng(31.2, 29.9), activeFromStage: 1, color: '#ffb060' },
    { pos: latLng(41.0, 29.0), activeFromStage: 1, color: '#ffb060' },
    // Stage 2 - Europa (år 1000)
    { pos: latLng(63.4, 10.4), activeFromStage: 2, color: '#80c8ff' },
    { pos: latLng(51.3, 1.1), activeFromStage: 2, color: '#80c8ff' },
    { pos: latLng(50.5, 30.5), activeFromStage: 2, color: '#80c8ff' },
    { pos: latLng(42.9, -8.5), activeFromStage: 2, color: '#80c8ff' },
    { pos: latLng(48.9, 2.4), activeFromStage: 2, color: '#80c8ff' },
    // Stage 3 - Verden (år 1500)
    { pos: latLng(19.4, -99.1), activeFromStage: 3, color: '#80ff90' },
    { pos: latLng(15.5, 73.8), activeFromStage: 3, color: '#80ff90' },
    { pos: latLng(9.0, 38.7), activeFromStage: 3, color: '#80ff90' },
    { pos: latLng(14.6, 121.0), activeFromStage: 3, color: '#80ff90' },
    // Stage 4 - I dag
    { pos: latLng(40.7, -74.0), activeFromStage: 4, color: '#ff80c0' },
    { pos: latLng(-23.5, -46.6), activeFromStage: 4, color: '#ff80c0' },
    { pos: latLng(6.5, 3.4), activeFromStage: 4, color: '#ff80c0' },
    { pos: latLng(-1.3, 36.8), activeFromStage: 4, color: '#ff80c0' },
    { pos: latLng(-33.9, 18.4), activeFromStage: 4, color: '#ff80c0' },
];

const STAGES = [
    {
        year: 'År 30 e.Kr.',
        label: 'De første disiplene',
        christians: '~ 1 000',
        fact: 'Jesus korsfestes i Jerusalem. Disiplene sprer budskapet om oppstandelsen til de jødiske samfunnene i Palestina.',
        banner: 'Jerusalem: de aller første kristne møtes i hemmelighet',
    },
    {
        year: 'År 300 e.Kr.',
        label: 'Romerriket',
        christians: '~ 5 millioner',
        fact: 'Kristendommen sprer seg langs romervegene til Alexandria, Antiokia, Roma og Konstantinopel. Keiser Konstantin gjør troen lovlig i år 313.',
        banner: 'Troen følger romervegene rundt Middelhavet',
    },
    {
        year: 'År 1000 e.Kr.',
        label: 'Europa er kristent',
        christians: '~ 50 millioner',
        fact: 'Hele Europa har blitt kristnet. Norges vikinger ble kristne rundt år 1000. Olav Haraldsson er Norges skytshelgen.',
        banner: 'Olav Haraldsson kristner Norge - korsmerket er overalt i Europa',
    },
    {
        year: 'År 1500 e.Kr.',
        label: 'Misjonene',
        christians: '~ 100 millioner',
        fact: 'Europeiske misjonærer reiser med Columbus til Amerika og med Vasco da Gama til Afrika og Asia. Kristendommen krysser verdenshavene.',
        banner: 'Misjonærene krysser verdenshavene - kristendommen når alle verdensdeler',
    },
    {
        year: 'I dag',
        label: '2,4 milliarder',
        christians: '2,4 milliarder',
        fact: 'En av tre mennesker på jorda er kristen. Størst i Europa, Amerika og Afrika. Fra 12 disipler i Jerusalem til verdens største religion.',
        banner: 'Fra 12 disipler til 2,4 milliarder - verdens største religion',
    },
];

type Phase = 'play' | 'won';

const KristendomSpredning3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [stage, setStage] = useState(0);
    const [phase, setPhase] = useState<Phase>('play');
    const [burst, setBurst] = useState(0);

    const handleNext = () => {
        if (stage >= STAGES.length - 1) {
            setBurst((b) => b + 1);
            setPhase('won');
            onComplete({ score: 1, completed: true, artifact: {} });
        } else {
            setStage((s) => s + 1);
        }
    };

    const reset = () => {
        setStage(0);
        setPhase('play');
    };

    const current = STAGES[stage];

    return (
        <MicroGameScaffold
            title="Kristendommens spredning"
            subtitle="Fra 12 disipler i Jerusalem til 2,4 milliarder over hele verden"
            estimatedSeconds={130}
            onRetry={stage > 0 ? reset : undefined}
            containerClassName="bg-[#06060f]"
            canvas={{
                idle: false,
                camera: { position: [0, 1.5, 8], fov: 44 },
                background: '#06060f',
                fog: null,
                ambientIntensity: 0.18,
                sunPosition: [8, 3, 6],
                sunIntensity: 1.1,
                contactShadows: false,
                maxPolarAngle: Math.PI,
                minPolarAngle: 0,
            }}
            overlays={
                <>
                    <SceneBanner message={current.banner} wide />
                    <SceneBadge corner="br">{current.year}</SceneBadge>
                </>
            }
            scene={<GlobeScene stage={stage} burst={burst} />}
        >
            {phase === 'play' && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-800 text-sm">{current.label}</div>
                            <div className="text-xs text-indigo-600 font-semibold mt-0.5">
                                Estimerte kristne: {current.christians}
                            </div>
                        </div>
                        <button
                            onClick={handleNext}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-bold transition-colors shrink-0"
                        >
                            {stage >= STAGES.length - 1 ? 'Fullfør' : 'Neste epoke'}
                        </button>
                    </div>
                    <div className="flex gap-1.5">
                        {STAGES.map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-1.5 rounded-full transition-colors duration-500 ${
                                    i <= stage ? 'bg-indigo-500' : 'bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                    <SceneFact>{current.fact}</SceneFact>
                </div>
            )}
            {phase === 'won' && (
                <WinScreen title="Fra Jerusalem til hele verden!" onReplay={reset}>
                    På under 2000 år vokste kristendommen fra en liten gruppe disipler i Palestina til
                    verdens største religion. I dag er omtrent 2,4 milliarder mennesker - nesten en
                    tredjedel av jordens befolkning - kristne.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENE
// ============================================================

function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

function GlobeScene({ stage, burst }: { stage: number; burst: number }) {
    return (
        <group>
            <SpaceStars />
            <GlobeGroup stage={stage} />
            <Burst position={[0, 0, 0]} trigger={burst} color="#ffd700" count={32} spread={4.5} />
        </group>
    );
}

function SpaceStars() {
    const data = useMemo(() => {
        const rng = makeRng(9876);
        return Array.from({ length: 90 }, (_, i) => {
            const r = 28 + rng() * 18;
            const theta = rng() * Math.PI * 2;
            const phi = (rng() - 0.5) * Math.PI;
            return {
                pos: [
                    Math.cos(phi) * Math.cos(theta) * r,
                    Math.sin(phi) * r,
                    Math.cos(phi) * Math.sin(theta) * r,
                ] as [number, number, number],
                size: 0.03 + (i % 5) * 0.015,
                opacity: 0.3 + (i % 4) * 0.18,
            };
        });
    }, []);

    return (
        <>
            {data.map((s, i) => (
                <mesh key={i} position={s.pos}>
                    <sphereGeometry args={[s.size, 4, 4]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={s.opacity} />
                </mesh>
            ))}
        </>
    );
}

const CONTINENT_DATA = [
    // Europa
    { pos: latLng(54, 15, GLOBE_R + 0.02), scale: [0.9, 0.35, 0.7] as [number, number, number], color: '#5a8040' },
    // Vest-Asia / Midtøsten
    { pos: latLng(38, 42, GLOBE_R + 0.02), scale: [0.8, 0.32, 0.65] as [number, number, number], color: '#8a9050' },
    // Øst-Asia
    { pos: latLng(35, 105, GLOBE_R + 0.02), scale: [1.1, 0.38, 1.0] as [number, number, number], color: '#7a9050' },
    // Syd-Asia
    { pos: latLng(20, 78, GLOBE_R + 0.02), scale: [0.65, 0.3, 0.7] as [number, number, number], color: '#8a9050' },
    // Afrika
    { pos: latLng(5, 20, GLOBE_R + 0.02), scale: [0.85, 0.35, 1.1] as [number, number, number], color: '#b08040' },
    // Nord-Amerika
    { pos: latLng(48, -100, GLOBE_R + 0.02), scale: [1.0, 0.35, 0.9] as [number, number, number], color: '#5a8040' },
    // Sør-Amerika
    { pos: latLng(-15, -58, GLOBE_R + 0.02), scale: [0.7, 0.32, 0.9] as [number, number, number], color: '#5a8840' },
    // Australia
    { pos: latLng(-27, 134, GLOBE_R + 0.02), scale: [0.65, 0.28, 0.55] as [number, number, number], color: '#a07040' },
];

function GlobeGroup({ stage }: { stage: number }) {
    const globeRef = useRef<THREE.Group>(null);
    const glowMat = useRef<THREE.MeshBasicMaterial>(null);
    const targetGlow = (stage / (STAGES.length - 1)) * 0.5;

    useFrame((_, dt) => {
        if (globeRef.current) {
            globeRef.current.rotation.y += dt * 0.09;
        }
        if (glowMat.current) {
            glowMat.current.opacity = damp(glowMat.current.opacity, targetGlow, dt, 1.5);
        }
    });

    return (
        <group ref={globeRef}>
            {/* Ocean */}
            <mesh>
                <sphereGeometry args={[GLOBE_R, 48, 48]} />
                <meshStandardMaterial color="#1a3a5c" roughness={0.85} metalness={0.05} />
            </mesh>

            {/* Kontinent-flekker */}
            {CONTINENT_DATA.map((c, i) => (
                <mesh key={i} position={c.pos} scale={c.scale}>
                    <sphereGeometry args={[0.55, 14, 10]} />
                    <meshStandardMaterial color={c.color} roughness={0.92} />
                </mesh>
            ))}

            {/* Varm glød-overflate som øker med stage */}
            <mesh scale={1.055}>
                <sphereGeometry args={[GLOBE_R, 32, 32]} />
                <meshBasicMaterial
                    ref={glowMat}
                    color="#ffa040"
                    transparent
                    opacity={0}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Atmosfære-glød */}
            <mesh scale={1.04}>
                <sphereGeometry args={[GLOBE_R, 32, 32]} />
                <meshBasicMaterial
                    color="#4080ff"
                    transparent
                    opacity={0.05}
                    side={THREE.BackSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Byer aktiveres per stage */}
            {CITIES.map((city, i) => (
                <CityDot key={i} city={city} stage={stage} index={i} />
            ))}
        </group>
    );
}

function CityDot({
    city,
    stage,
    index,
}: {
    city: CityConfig;
    stage: number;
    index: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const isActive = stage >= city.activeFromStage;

    useFrame((state, dt) => {
        if (!meshRef.current || !matRef.current) return;
        const targetScale = isActive ? 1 : 0;
        const cur = meshRef.current.scale.x;
        const next = damp(cur, targetScale, dt, 3.5);
        meshRef.current.scale.setScalar(next);
        if (isActive) {
            const t = state.clock.elapsedTime;
            matRef.current.emissiveIntensity =
                1.2 + Math.sin(t * 2.2 + index * 0.7) * 0.5;
        }
    });

    return (
        <mesh ref={meshRef} position={city.pos} scale={0}>
            <sphereGeometry args={[0.085, 10, 10]} />
            <meshStandardMaterial
                ref={matRef}
                color={city.color}
                emissive={city.color}
                emissiveIntensity={0}
            />
        </mesh>
    );
}

export default KristendomSpredning3D;
