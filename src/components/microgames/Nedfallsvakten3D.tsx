import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    Particles,
    GroundPlane,
    FlatRing,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    LoseScreen,
    MeterBar,
    TimerPill,
    DangerVignette,
    ScreenFlash,
    Burst,
    useGameClock,
    useMeter,
    useRandomPulse,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Nedfallsvakten. Norge, slutten av april 1986. Den radioaktive skyen
// fra Tsjernobyl driver inn over landet. Eleven er måleteamet: skyen kommer
// uansett hva de gjør, men nedfall setter seg bare der det REGNER. Hver gang en
// regnbyge treffer bakken under skyen, dukker det opp en nedfallsflekk som må
// måles før den forsvinner ut av oversikten.
//
// Lyspære: det var ikke avstanden til Tsjernobyl som avgjorde hvem som ble rammet
// i Norge - det var hvor det regnet mens skyen passerte.

const DURATION = 70; // sekunder skyen bruker over landet
const PLATE_TOP = 0.36; // toppen av landmassen (alt på land står her)
const MISS_COST = 0.3; // hvor mye måleren stiger for hvert tapt nedfall
const PATCH_LIFE = 8.5; // sekunder en nedfallsflekk kan måles

// Skyas bane: inn fra sørøst, ut mot nordvest. Ren funksjon, så både scenen og
// bygespawningen leser nøyaktig samme posisjon.
function cloudAt(progress: number): [number, number] {
    const t = Math.min(1, Math.max(0, progress));
    return [3.9 - t * 8.0, 6.2 - t * 13.2];
}

// Deterministisk pseudo-tilfeldig, slik at vi slipper Math.random i render.
function spread(seed: number): number {
    const s = Math.sin(seed * 12.9898) * 43758.5453;
    return s - Math.floor(s);
}

interface Patch {
    id: number;
    x: number;
    z: number;
    born: number;
    state: 'open' | 'measured' | 'missed';
}

const Nedfallsvakten3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
    const [attempt, setAttempt] = useState(0);
    const [patches, setPatches] = useState<Patch[]>([]);
    const [measured, setMeasured] = useState(0);
    const [missed, setMissed] = useState(0);
    const [burst, setBurst] = useState(0);
    const [flash, setFlash] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Trykk Start. Skyen driver over landet. Klikk hver nedfallsflekk som lyser opp, før den forsvinner.'
    );
    const nextId = useRef(1);
    const spawnCount = useRef(0);
    // Vern mot doble klikk på samme flekk: hotspoten kan rekke å bli klikket to
    // ganger før React har flushet tilstanden, og da telte den dobbelt.
    const handledRef = useRef<Set<number>>(new Set());

    const finish = useCallback(
        (measuredCount: number, missedCount: number) => {
            const total = measuredCount + missedCount;
            const score = total === 0 ? 0.5 : measuredCount / total;
            sounds.play('complete');
            setBanner(null);
            setPhase('won');
            onComplete({ score, completed: true, artifact: { measuredCount, missedCount } });
        },
        [onComplete, sounds]
    );

    const clock = useGameClock({
        seconds: DURATION,
        running: phase === 'playing',
        onExpire: () => finish(measured, missed),
    });

    const alarm = useMeter({
        drainPerSecond: 0.008,
        overloadAt: 1,
        recoverTo: 0.4,
        onOverload: () => {
            sounds.play('incorrect');
            setBanner(null);
            setPhase('lost');
        },
    });

    const progress = 1 - clock.remaining / DURATION;

    // Regnbyger kommer uforutsigbart. De faller under skya, og det er DER
    // nedfallet setter seg.
    useRandomPulse({
        running: phase === 'playing',
        minDelayMs: 3000,
        maxDelayMs: 5200,
        onPulse: () => {
            const [cx, cz] = cloudAt(1 - clock.remaining / DURATION);
            const n = spawnCount.current++;
            const ang = spread(n + 1) * Math.PI * 2;
            const rad = 1.1 + spread(n + 7) * 2.3;
            const x = Math.max(-4.2, Math.min(4.2, cx + Math.cos(ang) * rad));
            const z = Math.max(-6.6, Math.min(6.6, cz + Math.sin(ang) * rad * 1.4));
            const id = nextId.current++;
            sounds.play('sceneChange');
            setPatches((prev) => [
                ...prev.slice(-39),
                { id, x, z, born: performance.now(), state: 'open' },
            ]);
        },
    });

    const handleMeasure = (id: number) => {
        if (handledRef.current.has(id)) return;
        handledRef.current.add(id);
        setPatches((prev) =>
            prev.map((p) => (p.id === id && p.state === 'open' ? { ...p, state: 'measured' } : p))
        );
        setMeasured((m) => m + 1);
        setBurst((b) => b + 1);
        sounds.play('correct');
    };

    const handleExpire = useCallback(
        (id: number) => {
            if (handledRef.current.has(id)) return;
            handledRef.current.add(id);
            setPatches((prev) =>
                prev.map((p) => (p.id === id && p.state === 'open' ? { ...p, state: 'missed' } : p))
            );
            setMissed((m) => m + 1);
            setFlash((f) => f + 1);
            alarm.add(MISS_COST);
            sounds.play('incorrect');
        },
        [alarm, sounds]
    );

    const start = () => {
        setPatches([]);
        setMeasured(0);
        setMissed(0);
        nextId.current = 1;
        spawnCount.current = 0;
        handledRef.current = new Set();
        alarm.reset();
        clock.restart();
        setAttempt((a) => a + 1);
        setBanner('Skyen er over Sør-Norge. Klikk hver flekk som lyser opp.');
        setPhase('playing');
    };

    const reset = () => {
        setPhase('idle');
        setPatches([]);
        setMeasured(0);
        setMissed(0);
        handledRef.current = new Set();
        alarm.reset();
        clock.restart();
        setBanner(
            'Trykk Start. Skyen driver over landet. Klikk hver nedfallsflekk som lyser opp, før den forsvinner.'
        );
    };

    const playing = phase === 'playing';

    return (
        <MicroGameScaffold
            title="Nedfallsvakten: skyen over Norge"
            subtitle="Slutten av april 1986. Skyen fra Tsjernobyl driver inn. Du er måleteamet - finn nedfallet før sporet er kaldt."
            estimatedSeconds={150}
            onRetry={phase !== 'idle' ? reset : undefined}
            canvas={{
                idle: phase === 'idle',
                camera: { position: [0, 17, 18], fov: 45 },
                target: [0, 0.4, 0],
                background: '#c3d3de',
                light: 'overcast',
                fog: { color: '#cbd8e2', near: 28, far: 64 },
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    {playing ? (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Skyen passerer"
                            warnBelow={12}
                            corner="br"
                        />
                    ) : (
                        <SceneBadge corner="br">
                            {phase === 'won' ? 'Skyen har passert' : '26.-29. april 1986'}
                        </SceneBadge>
                    )}
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Målt', value: measured },
                            { label: 'Tapt', value: missed },
                        ]}
                    />
                    <ScreenFlash trigger={flash} preset="damage" />
                    <DangerVignette level={alarm.value} />
                </>
            }
            scene={
                <NedfallScene
                    key={attempt}
                    progress={progress}
                    active={playing}
                    patches={patches}
                    burst={burst}
                    onMeasure={handleMeasure}
                    onExpire={handleExpire}
                />
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={alarm.value}
                    label="Umålt nedfall"
                    hint="Hver flekk du mister, gjør kartet mer usikkert."
                    warnAt={0.45}
                    dangerAt={0.75}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-xs font-bold text-slate-700">1. Skyen kommer</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            Den driver over hele landet. Du kan ikke stanse den.
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-xs font-bold text-slate-700">2. Regnet avgjør</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            Nedfall setter seg bare der en byge vasker det ned.
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-xs font-bold text-slate-700">3. Mål i tide</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            Klikk flekken mens den lyser. Etterpå er sporet borte.
                        </p>
                    </div>
                </div>

                {phase === 'idle' && (
                    <button
                        onClick={start}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-semibold transition-colors"
                    >
                        Start målingen
                    </button>
                )}

                {phase === 'lost' && (
                    <LoseScreen title="Kartet ble for hullete" onRetry={start} retryLabel="Prøv igjen">
                        For mange nedfallsflekker ble aldri målt. Uten målinger kunne ingen si hvor
                        det var trygt å beite, plukke bær eller slakte. Nettopp den usikkerheten
                        gjorde at mange nordmenn mistet tilliten til det myndighetene sa i 1986.
                    </LoseScreen>
                )}

                {phase === 'won' && (
                    <WinScreen title="Nedfallskartet er tegnet!" onReplay={start}>
                        Se hvor flekkene havnet: bare der det regnet. Skyen dekket hele landet, men
                        nedfallet festet seg der bygene vasket det ned. Derfor ble Valdres,
                        Jotunheimen, indre Trøndelag og sørlige Nordland hardest rammet - ikke
                        områdene som lå nærmest Tsjernobyl. Været, ikke avstanden, bestemte hvem som
                        måtte leve med cesium i beitene i nesten 40 år.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

export default Nedfallsvakten3D;

// ============================================================
//  3D-SCENEN
// ============================================================

function NedfallScene({
    progress,
    active,
    patches,
    burst,
    onMeasure,
    onExpire,
}: {
    progress: number;
    active: boolean;
    patches: Patch[];
    burst: number;
    onMeasure: (id: number) => void;
    onExpire: (id: number) => void;
}) {
    return (
        <group>
            {/* Havet rundt: bredt bunnplan, aldri oppå landmassen */}
            <GroundPlane size={54} depth={54} color="#7f9bb0" />
            <Landmass />
            <CloudFront progress={progress} active={active} />
            {patches.map((p) => (
                <PatchMarker
                    key={p.id}
                    patch={p}
                    onMeasure={onMeasure}
                    onExpire={onExpire}
                    active={active}
                />
            ))}
            <Burst position={[0, 1.4, 0]} trigger={burst} color="#86efac" count={22} spread={2.6} />
        </group>
    );
}

// Stilisert landmasse: en hevet plate med fjellrygger oppå. Alt står på
// platåhøyden (PLATE_TOP) - ingenting svever eller er begravd.
function Landmass() {
    const ridges = useMemo(() => {
        const out: { x: number; z: number; r: number; h: number }[] = [];
        for (let i = 0; i < 26; i++) {
            const a = spread(i * 3 + 1);
            const b = spread(i * 5 + 2);
            out.push({
                x: -3.4 + a * 6.0,
                z: -6.6 + b * 13.2,
                r: 0.45 + spread(i * 7 + 3) * 0.5,
                h: 0.5 + spread(i * 11 + 4) * 1.0,
            });
        }
        return out;
    }, []);

    return (
        <group>
            {/* selve landplata: topp nøyaktig på PLATE_TOP */}
            <mesh position={[0, PLATE_TOP / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[9.8, PLATE_TOP, 15.6]} />
                <meshStandardMaterial color="#5f7d4c" roughness={1} flatShading />
            </mesh>
            {/* kystbrem i vest, litt lysere */}
            <mesh position={[-4.75, PLATE_TOP / 2, 0]} receiveShadow>
                <boxGeometry args={[0.5, PLATE_TOP * 0.98, 15.6]} />
                <meshStandardMaterial color="#93a172" roughness={1} flatShading />
            </mesh>
            {ridges.map((r, i) => (
                <mesh
                    key={i}
                    position={[r.x, PLATE_TOP + r.h / 2, r.z]}
                    castShadow
                    receiveShadow
                >
                    <coneGeometry args={[r.r, r.h, 6]} />
                    <meshStandardMaterial color="#9fae8c" roughness={1} flatShading />
                </mesh>
            ))}
        </group>
    );
}

// Skyfronten: en drivende, halvgjennomsiktig sky med skygge under seg og
// regnbyger som henger ned. Skyen dekker alt - men bare regnet avsetter noe.
function CloudFront({ progress, active }: { progress: number; active: boolean }) {
    const group = useRef<THREE.Group>(null);
    const shadow = useRef<THREE.Mesh>(null);
    const target = cloudAt(progress);

    useFrame((state, dt) => {
        const g = group.current;
        if (!g) return;
        const drift = active ? 0 : Math.sin(state.clock.elapsedTime * 0.25) * 0.4;
        g.position.x = damp(g.position.x, target[0] + drift, dt, 2.2);
        g.position.z = damp(g.position.z, target[1], dt, 2.2);
        if (shadow.current) {
            shadow.current.position.x = g.position.x;
            shadow.current.position.z = g.position.z;
        }
    });

    const puffs = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => ({
                x: -2.4 + spread(i * 13 + 5) * 4.8,
                y: -0.22 + spread(i * 17 + 6) * 0.44,
                z: -1.5 + spread(i * 19 + 7) * 3.0,
                s: 1.0 + spread(i * 23 + 8) * 0.9,
            })),
        []
    );

    return (
        <>
            {/* skyggen skyen kaster - viser at HELE landet får skyen over seg */}
            <mesh
                ref={shadow}
                position={[0, PLATE_TOP + 0.015, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <circleGeometry args={[4.2, 40]} />
                <meshBasicMaterial color="#2f3a45" transparent opacity={0.13} depthWrite={false} />
            </mesh>

            <group ref={group} position={[3.9, 3.4, 6.2]}>
                {puffs.map((p, i) => (
                    <mesh key={i} position={[p.x, p.y, p.z]}>
                        <sphereGeometry args={[p.s, 14, 10]} />
                        <meshStandardMaterial
                            color="#b9b3a4"
                            transparent
                            opacity={0.62}
                            roughness={1}
                            depthWrite={false}
                        />
                    </mesh>
                ))}
                {/* regn som henger under skyfronten */}
                <group position={[0, -1.6, 0]}>
                    <Particles preset="rain" count={70} area={[5.4, 3.6]} height={3.0} />
                </group>
            </group>
        </>
    );
}

// En nedfallsflekk: en flat skive på bakken med en klikkbar markør over.
// Lever i PATCH_LIFE sekunder. Blir den ikke målt, dør den og måleren stiger.
function PatchMarker({
    patch,
    onMeasure,
    onExpire,
    active,
}: {
    patch: Patch;
    onMeasure: (id: number) => void;
    onExpire: (id: number) => void;
    active: boolean;
}) {
    const disc = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const firedRef = useRef(false);
    const [expired, setExpired] = useState(false);

    useFrame((state, dt) => {
        const age = (performance.now() - patch.born) / 1000;
        if (
            active &&
            patch.state === 'open' &&
            age > PATCH_LIFE &&
            !firedRef.current
        ) {
            firedRef.current = true;
            setExpired(true);
            onExpire(patch.id);
        }
        if (mat.current) {
            const pulse =
                patch.state === 'open' ? 0.55 + Math.sin(state.clock.elapsedTime * 4) * 0.2 : 0.4;
            mat.current.opacity = damp(mat.current.opacity, pulse, dt, 5);
        }
        if (disc.current) {
            const grow = patch.state === 'open' ? 1 : 0.9;
            disc.current.scale.x = damp(disc.current.scale.x, grow, dt, 6);
            disc.current.scale.z = damp(disc.current.scale.z, grow, dt, 6);
        }
    });

    const open = patch.state === 'open' && !expired;
    const color =
        patch.state === 'measured' ? '#22c55e' : patch.state === 'missed' ? '#ef4444' : '#fbbf24';

    return (
        <group position={[patch.x, 0, patch.z]}>
            {/* selve flekken ligger flatt på platået */}
            <mesh ref={disc} position={[0, PLATE_TOP + 0.03, 0]}>
                <cylinderGeometry args={[0.78, 0.78, 0.04, 24]} />
                <meshStandardMaterial
                    ref={mat}
                    color={color}
                    transparent
                    opacity={0.55}
                    roughness={0.9}
                />
            </mesh>
            {patch.state === 'measured' && (
                <FlatRing position={[0, PLATE_TOP + 0.06, 0]} radius={0.95} tube={0.07} color="#16a34a" />
            )}
            {open && (
                <Hotspot
                    position={[0, PLATE_TOP + 1.05, 0]}
                    radius={0.6}
                    label="Mål nedfallet"
                    onSelect={() => onMeasure(patch.id)}
                />
            )}
        </group>
    );
}

