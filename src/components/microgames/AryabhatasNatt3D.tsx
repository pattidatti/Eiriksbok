import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Telescope } from 'lucide-react';
import {
    MicroGameScaffold,
    Interactive,
    Hotspot,
    Burst,
    SceneBanner,
    DragHint,
    SceneFact,
    WinScreen,
    LoseScreen,
    TimerPill,
    DataReadout,
    ScreenFlash,
    useGameClock,
    damp,
    FlatRing,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om Guptariket. Aryabhata (476-550) skrev at
// himmelens døgnlige bevegelse skyldes at JORDA snurrer, ikke at himmelen
// gjør det. Lyspæra ligger i selve grepet: eleven ser at observatoriet
// bæres rundt av kloden, og at det er den bevegelsen som lager soloppgang,
// middag og midnatt. Sola står stille hele tiden.

const R = 2; // klodens radius
const PY = 2.2; // klodens senterhøyde
const SPIN = (Math.PI * 2) / 20; // ett døgn = 20 sekunder
const TOL = 0.36; // hvor nær porten notatet må tas (radianer)
const GATE_R = 3.6; // portenes avstand fra klodens senter
const A0 = Math.PI * 1.5 - 1.15; // startvinkel: litt før soloppgang, observatoriet foran
const NIGHT_SECONDS = 55;
const MAX_MISSES = 4; // fire feilnoteringer, og natten er bortkastet

interface Target {
    id: string;
    label: string;
    angle: number;
    fact: string;
}

// Observatoriets retning ved vinkel a er (cos a, 0, -sin a). Sola ligger i +X.
// Da blir a = 0 middag, a = pi midnatt og a = 1,5 pi soloppgang.
const TARGETS: Target[] = [
    {
        id: 'soloppgang',
        label: 'soloppgang',
        angle: Math.PI * 1.5,
        fact: 'Soloppgang: observatoriet svinger inn i lyset. Sola flyttet seg ikke.',
    },
    {
        id: 'middag',
        label: 'middag',
        angle: 0,
        fact: 'Middag: observatoriet peker rett mot sola. Skyggene er kortest.',
    },
    {
        id: 'midnatt',
        label: 'midnatt',
        angle: Math.PI,
        fact: 'Midnatt: kloden har snudd baksiden til. Sola lyser fortsatt, bare ikke her.',
    },
];

// Korteste vinkelavstand, med omslag rundt 2 pi.
function angleDist(a: number, b: number) {
    let d = (a - b) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
}

// Lokal klokke i Ujjain ut fra hvor observatoriet står i forhold til sola.
function clockLabel(a: number) {
    const h = (((12 + (a / (Math.PI * 2)) * 24) % 24) + 24) % 24;
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

function gatePos(angle: number): [number, number, number] {
    return [Math.cos(angle) * GATE_R, PY, -Math.sin(angle) * GATE_R];
}

type Play = 'ready' | 'playing' | 'won' | 'lost';
type LoseReason = 'tid' | 'bom';

const AryabhatasNatt3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const angleRef = useRef(A0);
    const doneRef = useRef(false);

    const [play, setPlay] = useState<Play>('ready');
    const [stage, setStage] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [burst, setBurst] = useState(0);
    const [flash, setFlash] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [label, setLabel] = useState(clockLabel(A0));
    const [misses, setMisses] = useState(0);
    const [loseReason, setLoseReason] = useState<LoseReason>('tid');

    const clock = useGameClock({
        seconds: NIGHT_SECONDS,
        running: play === 'playing',
        onExpire: () => {
            if (doneRef.current) return;
            doneRef.current = true;
            setLoseReason('tid');
            setPlay('lost');
            setBanner(null);
            sounds.play('incorrect');
        },
    });

    const reset = () => {
        angleRef.current = A0;
        doneRef.current = false;
        setPlay('ready');
        setStage(0);
        setMisses(0);
        setLoseReason('tid');
        setBanner(null);
        setLabel(clockLabel(A0));
        setAttempt((a) => a + 1);
        clock.restart();
    };

    const start = () => {
        angleRef.current = A0;
        doneRef.current = false;
        setStage(0);
        setMisses(0);
        setLabel(clockLabel(A0));
        setBanner('Klikk observatoriet i det øyeblikket det når den gule porten.');
        clock.restart();
        setPlay('playing');
        sounds.play('advance');
    };

    // Eleven noterer en observasjon: enten fra selve observatoriet i 3D,
    // eller fra knappen under vinduet.
    const note = () => {
        if (play !== 'playing') return;
        const target = TARGETS[stage];
        const now = angleRef.current;
        if (angleDist(now, target.angle) <= TOL) {
            const next = stage + 1;
            setStage(next);
            setBurst((b) => b + 1);
            if (next >= TARGETS.length) {
                doneRef.current = true;
                setPlay('won');
                setBanner(null);
                sounds.play('complete');
                onComplete({ score: misses === 0 ? 1 : 0.8, completed: true });
            } else {
                setBanner(target.fact);
                sounds.play('correct');
            }
        } else {
            const bom = misses + 1;
            setMisses(bom);
            setFlash((f) => f + 1);
            sounds.play('incorrect');
            if (bom >= MAX_MISSES) {
                doneRef.current = true;
                setLoseReason('bom');
                setPlay('lost');
                setBanner(null);
                return;
            }
            setBanner(
                `Bom. Du noterte klokka ${clockLabel(now)}, og da er det ikke ${target.label}. Nå har du ${MAX_MISSES - bom} forsøk igjen.`
            );
        }
    };

    const active = TARGETS[Math.min(stage, TARGETS.length - 1)];

    const readout = useMemo(
        () => [
            { label: 'Klokka i Ujjain', value: label },
            { label: 'Notert', value: `${stage}/3` },
            { label: 'Bom', value: `${misses}/${MAX_MISSES}` },
        ],
        [label, stage, misses]
    );

    return (
        <MicroGameScaffold
            title="Aryabhatas natt"
            subtitle="Sola står stille. Fang soloppgang, middag og midnatt mens kloden snurrer deg rundt"
            estimatedSeconds={140}
            onRetry={play !== 'ready' ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#b9cdf0] via-[#d5e2f2] to-[#f0e6cd]"
            canvas={{
                idle: play === 'ready',
                autoRotateSpeed: 0.25,
                camera: { position: [1.6, 13.5, 15], fov: 40 },
                background: '#c9daf1',
                fog: { color: '#d8e4f3', near: 34, far: 100 },
                target: [1.6, PY, 0],
                contactShadows: false,
                sunPosition: [10, 4, 1],
                sunIntensity: 0.55,
                ambientIntensity: 0.62,
                maxPolarAngle: Math.PI / 2.1,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout items={readout} corner="bl" />
                    {play === 'playing' && (
                        <TimerPill seconds={clock.remaining} label="Til daggry" corner="br" />
                    )}
                    <DragHint show={play === 'ready'} corner="bc">
                        Trykk den gule knappen: Start natten
                    </DragHint>
                    <ScreenFlash trigger={flash} preset="damage" durationMs={220} />
                </>
            }
            scene={
                <NattScene
                    key={attempt}
                    angleRef={angleRef}
                    running={play === 'playing'}
                    stage={stage}
                    burst={burst}
                    showStart={play === 'ready'}
                    onStart={start}
                    onNote={note}
                    onClock={setLabel}
                />
            }
        >
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        {TARGETS.map((t, i) => (
                            <span
                                key={t.id}
                                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition ${
                                    i < stage
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                        : i === stage && play === 'playing'
                                          ? 'bg-amber-50 border-amber-400 text-amber-800'
                                          : 'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                            >
                                {i < stage ? '✓ ' : ''}
                                {t.label}
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={play === 'ready' ? start : note}
                        disabled={play === 'won' || play === 'lost'}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition disabled:opacity-40"
                    >
                        <Telescope className="w-4 h-4" />
                        {play === 'ready' ? 'Start natten' : 'Noter observasjonen'}
                    </button>
                </div>

                {play === 'won' ? (
                    <WinScreen title="Tre observasjoner notert før daggry!" onReplay={reset}>
                        Sola sto stille hele tiden. Det var kloden som bar observatoriet ditt inn i
                        lyset, rundt til middag og videre inn i mørket. Nettopp dette skrev
                        Aryabhata rundt år 500: himmelens døgnlige bevegelse skyldes at jorda
                        snurrer.
                    </WinScreen>
                ) : play === 'lost' ? (
                    <LoseScreen
                        title={
                            loseReason === 'bom'
                                ? 'For mange feilnoterte tidspunkter'
                                : 'Daggry kom før du var ferdig'
                        }
                        onRetry={reset}
                    >
                        {loseReason === 'bom'
                            ? 'En astronom som noterer i hytt og vær, får ubrukelige tall. Vent til observatoriet faktisk treffer den gule porten, og klikk da. Du tåler tre bom.'
                            : 'Portene kommer bare rundt én gang per døgn, så et bom koster en hel omdreining. Følg observatoriet med øynene og klikk i det øyeblikket det treffer den gule porten.'}
                    </LoseScreen>
                ) : (
                    <SceneFact>
                        <span className="font-bold text-slate-800">Slik leser du scenen:</span> sola
                        til høyre står helt stille. Den mørke kappa er nattsiden, og den ligger
                        alltid på baksiden av sola. Observatoriet i Ujjain sitter fast på kloden og
                        blir båret gjennom lys og mørke. Klokka nede til venstre viser hva de som
                        står der, ville sagt at den var.
                    </SceneFact>
                )}

                <p className="text-xs text-slate-500">
                    Neste observasjon: <span className="font-bold text-slate-700">{active.label}</span>
                    . Klikk observatoriet i 3D, eller bruk knappen.
                </p>
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN - en klode som snurrer foran en stillestående sol
// ============================================================

interface SceneProps {
    angleRef: React.MutableRefObject<number>;
    running: boolean;
    stage: number;
    burst: number;
    showStart: boolean;
    onStart: () => void;
    onNote: () => void;
    onClock: (label: string) => void;
}

function NattScene({
    angleRef,
    running,
    stage,
    burst,
    showStart,
    onStart,
    onNote,
    onClock,
}: SceneProps) {
    const core = useRef<THREE.Group>(null);
    const lastLabel = useRef('');

    useFrame((_, dt) => {
        if (running) angleRef.current += SPIN * dt;
        const a = angleRef.current;
        if (core.current) core.current.rotation.y = a;

        const l = clockLabel(a);
        if (l !== lastLabel.current) {
            lastLabel.current = l;
            onClock(l);
        }
    });

    const activeGate = stage < TARGETS.length ? TARGETS[stage] : null;

    return (
        <group>
            <SkyDome />
            <StarMotes />

            {/* Sola - står helt stille gjennom hele spillet */}
            <group position={[8.8, 3.2, 0]}>
                <mesh>
                    <sphereGeometry args={[0.95, 26, 26]} />
                    <meshStandardMaterial
                        color="#fff3c8"
                        emissive="#ffcb45"
                        emissiveIntensity={1.6}
                        toneMapped={false}
                    />
                </mesh>
                <mesh scale={1.6}>
                    <sphereGeometry args={[0.95, 20, 20]} />
                    <meshBasicMaterial
                        color="#ffd97a"
                        transparent
                        opacity={0.13}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        fog={false}
                    />
                </mesh>
                <pointLight color="#ffe9b0" distance={30} intensity={3.4} />
            </group>

            {/* Kloden */}
            <group position={[0, PY, 0]}>
                <group ref={core}>
                    <mesh>
                        <sphereGeometry args={[R, 44, 44]} />
                        <meshStandardMaterial color="#4a93bd" roughness={0.85} metalness={0.04} />
                    </mesh>
                    {CONTINENTS.map((p, i) => (
                        <mesh
                            key={i}
                            position={[p[0] * R * 0.95, p[1] * R * 0.95, p[2] * R * 0.95]}
                            scale={[0.72 + (i % 3) * 0.14, 0.5, 0.7 + (i % 2) * 0.16]}
                        >
                            <sphereGeometry args={[0.8, 16, 16]} />
                            <meshStandardMaterial color="#5c9a52" roughness={0.95} />
                        </mesh>
                    ))}

                    {/* Observatoriet i Ujjain - klikkemålet */}
                    <Interactive
                        onSelect={onNote}
                        position={[R, 0, 0]}
                        rotation={[0, 0, -Math.PI / 2]}
                        scale={1.35}
                        hitArea={[1.5, 1.5, 1.5]}
                        hoverScale={1.12}
                        sound={null}
                    >
                        <group>
                            <mesh position={[0, 0.18, 0]}>
                                <cylinderGeometry args={[0.22, 0.3, 0.36, 12]} />
                                <meshStandardMaterial color="#e6d7b4" roughness={0.9} />
                            </mesh>
                            <mesh position={[0, 0.47, 0]}>
                                <cylinderGeometry args={[0.15, 0.2, 0.24, 12]} />
                                <meshStandardMaterial color="#d9c69c" roughness={0.9} />
                            </mesh>
                            <mesh position={[0, 0.61, 0]}>
                                <sphereGeometry
                                    args={[0.19, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]}
                                />
                                <meshStandardMaterial color="#b9502f" roughness={0.8} />
                            </mesh>
                            <mesh position={[0, 0.78, 0]}>
                                <sphereGeometry args={[0.1, 12, 12]} />
                                <meshStandardMaterial
                                    color="#fff6d8"
                                    emissive="#ffc247"
                                    emissiveIntensity={2}
                                    toneMapped={false}
                                />
                            </mesh>
                        </group>
                    </Interactive>
                </group>

                {/* Nattsiden - en tynn kappe som ligger tett på kloden */}
                <mesh>
                    <sphereGeometry args={[2.06, 40, 28, -Math.PI / 2, Math.PI]} />
                    <meshBasicMaterial
                        color="#16204a"
                        transparent
                        opacity={0.46}
                        side={THREE.FrontSide}
                        depthWrite={false}
                    />
                </mesh>
            </group>

            {/* Døgnringen: banen observatoriet blir båret rundt i */}
            <FlatRing position={[0, PY, 0]} radius={GATE_R} tube={0.035} color="#aebfd8" />

            {/* Portene: soloppgang, middag og midnatt */}
            {TARGETS.map((t, i) => (
                <Gate key={t.id} angle={t.angle} done={i < stage} active={i === stage} />
            ))}

            {activeGate && (
                <Burst
                    position={gatePos(activeGate.angle)}
                    trigger={burst}
                    color="#ffe08a"
                    count={30}
                    spread={3}
                />
            )}

            {showStart && (
                <Hotspot
                    position={[0, PY + 3.5, 0]}
                    onSelect={onStart}
                    label="Start natten"
                    radius={0.48}
                />
            )}
        </group>
    );
}

// En port i døgnringen som observatoriet skal treffe. Den aktive porten
// sender opp en lysende søyle, så eleven ser på lang avstand hvor og når den
// skal klikke. Porten ligger i samme flate som observatoriet beveger seg i.
function Gate({ angle, done, active }: { angle: number; done: boolean; active: boolean }) {
    const grp = useRef<THREE.Group>(null);
    const beam = useRef<THREE.Mesh>(null);
    useFrame((state, dt) => {
        const puls = 1 + Math.sin(state.clock.elapsedTime * 3.4) * 0.12;
        if (grp.current) {
            const s = damp(grp.current.scale.x, active ? puls : 0.75, dt, 10);
            grp.current.scale.setScalar(s);
        }
        if (beam.current) {
            const m = beam.current.material as THREE.MeshBasicMaterial;
            m.opacity = damp(m.opacity, active ? 0.42 : 0, dt, 8);
            beam.current.visible = m.opacity > 0.02;
        }
    });
    const color = done ? '#34d399' : active ? '#fbbf24' : '#cbd5e1';
    const emissive = done ? '#10b981' : active ? '#f59e0b' : '#94a3b8';
    return (
        <group position={gatePos(angle)}>
            {/* Lyssøyle - synlig fra alle vinkler når porten er aktiv */}
            <mesh ref={beam} position={[0, 1.15, 0]} visible={false}>
                <cylinderGeometry args={[0.16, 0.26, 2.3, 12, 1, true]} />
                <meshBasicMaterial
                    color="#ffd76a"
                    transparent
                    opacity={0}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            <group ref={grp}>
                <mesh>
                    <sphereGeometry args={[0.3, 18, 18]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={emissive}
                        emissiveIntensity={active ? 1.8 : 0.5}
                        toneMapped={false}
                    />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.58, 0.07, 10, 30]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={emissive}
                        emissiveIntensity={active ? 1.4 : 0.4}
                        toneMapped={false}
                    />
                </mesh>
            </group>
        </group>
    );
}

// Kontinenter: faste punkter på kula (fibonacci-fordeling).
const CONTINENTS: [number, number, number][] = (() => {
    const pts: [number, number, number][] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    const n = 8;
    for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * (i + 0.5);
        pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
    }
    return pts;
})();

// Lys himmelkuppel med gradient. Ren dekor - holdes utenfor scene-revisjonen.
function SkyDome() {
    const texture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 256;
        const ctx = c.getContext('2d');
        if (ctx) {
            const g = ctx.createLinearGradient(0, 0, 0, 256);
            g.addColorStop(0, '#8ea9dd');
            g.addColorStop(0.45, '#c1d4ef');
            g.addColorStop(0.8, '#e5e1d8');
            g.addColorStop(1, '#f4e9cf');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 16, 256);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }, []);
    return (
        <mesh scale={[-1, 1, 1]} userData={{ sceneAuditIgnore: true }}>
            <sphereGeometry args={[60, 24, 24]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false} />
        </mesh>
    );
}

// Deterministisk pseudo-random på modulnivå (ingen mutasjon under render).
function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// Svake stjernepunkter i bakgrunnen. Ren dekor.
function StarMotes() {
    const data = useMemo(() => {
        const rand = makeRng(4761);
        return Array.from({ length: 44 }, () => {
            const r = 14 + rand() * 22;
            const theta = rand() * Math.PI * 2;
            const phi = (rand() - 0.5) * Math.PI;
            return [
                Math.cos(theta) * Math.cos(phi) * r,
                2 + rand() * 12,
                Math.sin(theta) * Math.cos(phi) * r - 8,
            ] as [number, number, number];
        });
    }, []);
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {data.map((p, i) => (
                <mesh key={i} position={p} userData={{ sceneAuditIgnore: true }}>
                    <sphereGeometry args={[0.055, 6, 6]} />
                    <meshBasicMaterial color="#fff6da" transparent opacity={0.75} fog={false} />
                </mesh>
            ))}
        </group>
    );
}

export default AryabhatasNatt3D;
