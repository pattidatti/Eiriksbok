import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Sun, Moon } from 'lucide-react';
import {
    MicroGameScaffold,
    Interactive,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    SceneQuiz,
    CompareToggle,
    Burst,
    damp,
    useIdleMotion,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Nihilisme i etikk". Lyspære eleven skal kjenne på
// kroppen: i moralsk nihilisme finnes ingen "verdi-sol" som gir moralen lys av
// seg selv. Slukker du sola, blir verdiene kalde, grå steiner. Men eleven kan
// sjøl tenne dem - og da kommer lyset fra mennesket, ikke fra verden.
//   - Modus "Sol": en glødende verdi-sol gir orbene varmt lys (objektiv moral).
//   - Modus "Tomrom" (nihilisme): sola slukner, orbene blir steiner.
//   - I tomrommet kan eleven klikke en orb og tenne den med SITT eget (kjølige)
//     lys - verdien finnes igjen, men kilden er nye: deg.

type Mode = 'sun' | 'void';
type Phase = 'explore' | 'quiz' | 'won';

interface ValueOrb {
    id: string;
    label: string;
}

const VALUES: ValueOrb[] = [
    { id: 'aerlighet', label: 'Ærlighet' },
    { id: 'hjelpe', label: 'Hjelpe andre' },
    { id: 'rettferd', label: 'Rettferd' },
    { id: 'vennlighet', label: 'Vennlighet' },
];

const SUN_Y = 1.9;
const RING_R = 3.1;

const MoralskTomrom3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('explore');
    const [mode, setMode] = useState<Mode>('sun');
    const [litByMe, setLitByMe] = useState<Set<string>>(new Set());
    const [seen, setSeen] = useState({ sun: true, void: false });
    const [banner, setBanner] = useState<string | null>(
        'Verdiene lyser av seg selv - som om moralen fantes ute i verden.'
    );
    const [burst, setBurst] = useState(0);
    const doneRef = useRef(false);

    const reset = () => {
        setPhase('explore');
        setMode('sun');
        setLitByMe(new Set());
        setSeen({ sun: true, void: false });
        setBanner('Verdiene lyser av seg selv - som om moralen fantes ute i verden.');
        doneRef.current = false;
    };

    const pickMode = (v: 'a' | 'b') => {
        const next: Mode = v === 'a' ? 'sun' : 'void';
        if (next === mode) return;
        setMode(next);
        setSeen((p) => ({ ...p, [next]: true }));
        sounds.play('sceneChange');
        if (next === 'void') {
            setBanner('Verdi-solen slukner. Uten den blir verdiene kalde, grå steiner.');
        } else {
            setBanner('Verdiene lyser av seg selv - som om moralen fantes ute i verden.');
        }
    };

    const lightOrb = (id: string) => {
        if (mode !== 'void' || litByMe.has(id)) return;
        setLitByMe((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        setBurst((b) => b + 1);
        sounds.play('correct');
        setBanner('Du tente verdien selv. Lyset er ditt - ikke verdens.');
    };

    const bothSeen = seen.sun && seen.void;
    const litCount = litByMe.size;
    const canFinish = bothSeen && litCount >= 1;

    const finish = (correct: boolean) => {
        if (doneRef.current) return;
        doneRef.current = true;
        setBurst((b) => b + 1);
        setPhase('won');
        sounds.play('complete');
        onComplete({ score: correct ? 1 : 0.7, completed: true, artifact: { lit: [...litByMe] } });
    };

    const showHint = phase === 'explore' && mode === 'void' && litCount === 0;

    return (
        <MicroGameScaffold
            title="Det moralske tomrommet"
            subtitle="Slukk verdi-solen og se hva som skjer med verdiene - og hvem som kan tenne dem igjen"
            estimatedSeconds={140}
            onRetry={litCount > 0 || mode === 'void' || phase !== 'explore' ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#aebfe6] via-[#c7d3ee] to-[#efe6d6]"
            canvas={{
                idle: phase === 'explore' && mode === 'sun' && litCount === 0,
                autoRotateSpeed: 0.25,
                camera: { position: [0, 3.6, 11], fov: 40 },
                background: '#c2cfee',
                fog: { color: '#d2dcf0', near: 20, far: 70 },
                target: [0, SUN_Y, 0],
                contactShadows: false,
                maxPolarAngle: Math.PI / 2.05,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {mode === 'sun' ? 'Verdiene lyser selv' : 'Nihilisme: ingen kilde'}
                    </SceneBadge>
                    <DragHint show={showHint}>Klikk en grå verdi for å tenne den selv</DragHint>
                </>
            }
            scene={<VoidScene mode={mode} litByMe={litByMe} burst={burst} onLight={lightOrb} />}
        >
            {phase === 'explore' && (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <CompareToggle
                            labelA="Sol: verdiene lyser selv"
                            labelB="Tomrom: nihilisme"
                            value={mode === 'sun' ? 'a' : 'b'}
                            onChange={pickMode}
                        />
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            {mode === 'sun' ? (
                                <>
                                    <Sun className="w-4 h-4 text-amber-500" /> Objektiv moral
                                </>
                            ) : (
                                <>
                                    <Moon className="w-4 h-4 text-slate-500" /> Du har tent {litCount}{' '}
                                    av {VALUES.length}
                                </>
                            )}
                        </span>
                    </div>

                    <SceneFact>
                        {mode === 'sun' ? (
                            <>
                                <span className="font-bold text-slate-800">Verdi-solen:</span> her
                                gløder verdiene av seg selv, som om "rett" og "galt" var noe som
                                fantes ute i verden. Slukk sola og se hva nihilisten påstår.
                            </>
                        ) : (
                            <>
                                <span className="font-bold text-slate-800">Tomrommet:</span> uten
                                sola er verdiene bare grå steiner. Det er moralsk nihilisme. Men
                                klikk en stein - du kan tenne den selv. Da finnes verdien igjen, men
                                kilden er ny: deg.
                            </>
                        )}
                    </SceneFact>

                    {canFinish ? (
                        <button
                            onClick={() => {
                                setBanner(null);
                                setPhase('quiz');
                                sounds.play('advance');
                            }}
                            className="self-start inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
                        >
                            Du har sett begge - svar på spørsmålet
                        </button>
                    ) : (
                        <p className="text-xs text-slate-500">
                            Bytt mellom sol og tomrom, og tenn minst én verdi selv i tomrommet.
                        </p>
                    )}
                </div>
            )}

            {phase === 'quiz' && (
                <SceneQuiz
                    question="I nihilismen finnes ingen verdi-sol som gir moralen lys. Hvor kommer verdien fra da?"
                    options={[
                        'Fra mennesket som velger å skape den',
                        'Fra naturen, som forteller oss hva som er rett',
                        'Fra en høyere makt utenfor oss',
                        'Verdier finnes ikke, og kan heller ikke lages',
                    ]}
                    answerIndex={0}
                    explanation="Riktig: moralsk nihilisme sier at ingen verdi ligger ferdig i verden. Tenkere som Nietzsche og Sartre svarer at vi da må skape verdiene selv - og stå ansvarlig for dem. Lyset kommer fra mennesket, ikke fra verden."
                    onResult={finish}
                />
            )}

            {phase === 'won' && (
                <WinScreen title="Du forstår det moralske tomrommet!" onReplay={reset}>
                    Da sola slukner, blir verdiene kalde steiner - det er nihilismens påstand: ingen
                    moral ligger ferdig i verden. Men du kunne tenne dem selv. Verdien forsvant ikke,
                    den byttet kilde: fra verden til mennesket. Det er både nihilismens utfordring og
                    svaret tenkere som Nietzsche og Sartre gir på den.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN - en verdi-sol med orbiterende verdier i et lyst kosmos
// ============================================================

interface SceneProps {
    mode: Mode;
    litByMe: Set<string>;
    burst: number;
    onLight: (id: string) => void;
}

const WARM = new THREE.Color('#ffcf8a');
const WARM_EMIT = new THREE.Color('#ffb24a');
const STONE = new THREE.Color('#5b6472');
const HUMAN = new THREE.Color('#7dd3fc');
const HUMAN_EMIT = new THREE.Color('#38bdf8');
const BLACK = new THREE.Color('#000000');
const SUN_GRAY = new THREE.Color('#6b7280');

function VoidScene({ mode, litByMe, burst, onLight }: SceneProps) {
    const ring = useRef<THREE.Group>(null);
    const sunLevel = useRef(1); // 1 = sol lyser, 0 = tomrom

    const sunMat = useRef<THREE.MeshStandardMaterial>(null);
    const sunHalo = useRef<THREE.MeshBasicMaterial>(null);
    const sunLight = useRef<THREE.PointLight>(null);

    const orbMats = useRef<THREE.MeshStandardMaterial[]>([]);
    const orbHalos = useRef<THREE.MeshBasicMaterial[]>([]);

    // Forhåndsberegnede posisjoner på ringen rundt sola.
    const orbs = useMemo(
        () =>
            VALUES.map((v, i) => {
                const a = (i / VALUES.length) * Math.PI * 2;
                return {
                    ...v,
                    pos: [Math.cos(a) * RING_R, SUN_Y, Math.sin(a) * RING_R] as [
                        number,
                        number,
                        number,
                    ],
                };
            }),
        []
    );

    const tmpColor = useRef(new THREE.Color());

    useFrame((_, dt) => {
        sunLevel.current = damp(sunLevel.current, mode === 'sun' ? 1 : 0, dt, 4);
        const s = sunLevel.current;
        const k = Math.min(1, dt * 4);

        // Sola: varm og lysende i sol-modus, kald og død i tomrommet.
        if (sunMat.current) {
            tmpColor.current.copy(SUN_GRAY).lerp(WARM, s);
            sunMat.current.color.lerp(tmpColor.current, k);
            sunMat.current.emissive.lerp(WARM_EMIT, k);
            sunMat.current.emissiveIntensity = damp(
                sunMat.current.emissiveIntensity,
                0.05 + s * 2.4,
                dt,
                4
            );
        }
        if (sunHalo.current) sunHalo.current.opacity = damp(sunHalo.current.opacity, s * 0.55, dt, 4);
        if (sunLight.current) sunLight.current.intensity = 0.2 + s * 2.6;

        // Orbene: lyser av sola i sol-modus; steiner i tomrommet; men de eleven
        // har tent lyser med sitt eget, kjølige lys.
        orbs.forEach((orb, i) => {
            const litByStudent = litByMe.has(orb.id);
            const glowByStudent = mode === 'void' && litByStudent;
            const targetIntensity =
                mode === 'sun' ? 0.4 + s * 1.4 : glowByStudent ? 1.9 : 0.03;

            const m = orbMats.current[i];
            if (m) {
                if (glowByStudent) {
                    m.color.lerp(HUMAN, k);
                    m.emissive.lerp(HUMAN_EMIT, k);
                } else if (mode === 'sun') {
                    m.color.lerp(WARM, k);
                    m.emissive.lerp(WARM_EMIT, k);
                } else {
                    m.color.lerp(STONE, k);
                    m.emissive.lerp(BLACK, k);
                }
                m.emissiveIntensity = damp(m.emissiveIntensity, targetIntensity, dt, 4);
            }
            const halo = orbHalos.current[i];
            if (halo) {
                const haloTarget = glowByStudent ? 0.5 : mode === 'sun' ? s * 0.45 : 0;
                halo.opacity = damp(halo.opacity, haloTarget, dt, 4);
            }
        });

        // Rolig drift så verdenen lever.
        if (ring.current) ring.current.rotation.y += dt * 0.06;
    });

    return (
        <group>
            <SkyDome />
            <StarMotes />

            {/* Verdi-solen i midten */}
            <SunCore matRef={sunMat} haloRef={sunHalo} lightRef={sunLight} />

            {/* Verdiene som orbiterer sola */}
            <group ref={ring}>
                {orbs.map((orb, i) => {
                    const lit = mode === 'sun' || litByMe.has(orb.id);
                    const clickable = mode === 'void' && !litByMe.has(orb.id);
                    return (
                        <Interactive
                            key={orb.id}
                            position={orb.pos}
                            disabled={!clickable}
                            hitArea={[1.7, 1.7, 1.7]}
                            sound={null}
                            onSelect={() => onLight(orb.id)}
                        >
                            <group>
                                <mesh castShadow>
                                    <sphereGeometry args={[0.62, 28, 28]} />
                                    <meshStandardMaterial
                                        ref={(m) => {
                                            if (m) orbMats.current[i] = m;
                                        }}
                                        color="#ffcf8a"
                                        emissive="#ffb24a"
                                        emissiveIntensity={1.4}
                                        roughness={0.55}
                                        toneMapped={false}
                                    />
                                </mesh>
                                {/* mykt glød-skall */}
                                <mesh scale={1.7}>
                                    <sphereGeometry args={[0.62, 20, 20]} />
                                    <meshBasicMaterial
                                        ref={(m) => {
                                            if (m) orbHalos.current[i] = m;
                                        }}
                                        color="#ffd89a"
                                        transparent
                                        opacity={0.45}
                                        depthWrite={false}
                                        blending={THREE.AdditiveBlending}
                                        side={THREE.BackSide}
                                        fog={false}
                                    />
                                </mesh>
                                <Billboard position={[0, 1.05, 0]}>
                                    <Html center pointerEvents="none">
                                        <div
                                            className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shadow ${
                                                lit
                                                    ? 'bg-white/90 text-slate-800'
                                                    : 'bg-slate-700/80 text-slate-200'
                                            }`}
                                        >
                                            {orb.label}
                                        </div>
                                    </Html>
                                </Billboard>
                            </group>
                        </Interactive>
                    );
                })}
            </group>

            {/* Feiringspartikler når eleven tenner en verdi / fullfører */}
            <Burst position={[0, SUN_Y, 0]} trigger={burst} color="#bfe3ff" count={30} spread={3.4} />
        </group>
    );
}

function SunCore({
    matRef,
    haloRef,
    lightRef,
}: {
    matRef: React.RefObject<THREE.MeshStandardMaterial | null>;
    haloRef: React.RefObject<THREE.MeshBasicMaterial | null>;
    lightRef: React.RefObject<THREE.PointLight | null>;
}) {
    const float = useIdleMotion({ bob: 0.1, sway: 0.01, speed: 0.7 });
    return (
        <group ref={float} position={[0, SUN_Y, 0]}>
            <mesh>
                <sphereGeometry args={[0.95, 36, 36]} />
                <meshStandardMaterial
                    ref={matRef}
                    color="#ffcf8a"
                    emissive="#ffb24a"
                    emissiveIntensity={2.4}
                    roughness={0.4}
                    toneMapped={false}
                />
            </mesh>
            <mesh scale={1.7}>
                <sphereGeometry args={[0.95, 24, 24]} />
                <meshBasicMaterial
                    ref={haloRef}
                    color="#ffe0a8"
                    transparent
                    opacity={0.55}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.BackSide}
                    fog={false}
                />
            </mesh>
            <pointLight ref={lightRef} color="#ffe6b8" distance={14} intensity={2.6} />
        </group>
    );
}

// --- Lysende himmelkuppel (kosmisk, men lys: kjølig topp -> varm horisont) ---
function SkyDome() {
    const texture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 256;
        const ctx = c.getContext('2d');
        if (ctx) {
            const g = ctx.createLinearGradient(0, 0, 0, 256);
            g.addColorStop(0, '#8ea6da');
            g.addColorStop(0.5, '#c2cfee');
            g.addColorStop(0.8, '#e3e0db');
            g.addColorStop(1, '#f2e8d4');
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

// Deterministisk pseudo-random på modulnivå (samme layout hver render).
function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// --- Svake lyspartikler i lufta (atmosfære uten å bli mørkt) ---
function StarMotes() {
    const data = useMemo(() => {
        const rand = makeRng(0x5eed);
        return Array.from({ length: 44 }, () => {
            const r = 9 + rand() * 22;
            const theta = rand() * Math.PI * 2;
            const phi = (rand() - 0.5) * Math.PI;
            return [
                Math.cos(theta) * Math.cos(phi) * r,
                1 + rand() * 11,
                Math.sin(theta) * Math.cos(phi) * r - 4,
            ] as [number, number, number];
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

export default MoralskTomrom3D;
