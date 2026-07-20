import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Play, Square, RotateCcw } from 'lucide-react';
import {
    MicroGameScaffold,
    Hotspot,
    Fire,
    Smoke,
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

// Mikrospill til artikkelen om eskatologi. Kjerneideen eleven skal kjenne på
// kroppen: SLUTTEN er den samme - en levende verden går under - men FORMEN på
// tiden avgjør hva slutten betyr.
//   - Tidshjulet (sirkulær tid): undergangen er en renselse. Verden fødes på
//     ny, grønn og frisk. Ragnarok og hinduismens yugaer.
//   - Tidspilen (lineær tid): historien når ett endelig punktum. En ny himmel
//     og en ny jord som varer evig. Kristendom, islam, zoroastrisme.
// Verden er en liten klode som svever i et lysende kosmos. Den lever gjennom
// fire faser (skapelse, blomstring, forfall, undergang), og enten fødes på ny
// (hjulet) eller forvandles til en strålende, evig ny jord (pilen).

type Shape = 'wheel' | 'arrow';
type Phase = 'explore' | 'quiz' | 'won';

const DURATION = 7; // sekunder for ett fullt løp gjennom tiden
const PCY = 1.7; // hoyden kloden svever i
const RING_R = 3.15; // radius på tidshjulet
const RING_TILT = 0.42; // helning på hjulet (3D-dybde)
const ARROW_X0 = -5.4;
const ARROW_X1 = 5.4;
const ARROW_Z = 2.5; // tidspilen ligger foran kloden

const PHASE_BANNERS = [
    'Skapelsen - en frisk, grønn verden våkner til liv.',
    'Storhetstid - verden blomstrer og lyser av liv.',
    'Forfall - lyset slukner, alt eldes og visner.',
    'Undergangen - verden brenner og faller i grus.',
];

const WHEEL_END = 'Tidshjulet snur: en ny, grønn verden stiger fram. Slutten var en begynnelse.';
const ARROW_END = 'Historien når sitt punktum. En ny himmel og en ny jord - for alltid.';

const TidensFormer3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('explore');
    const [shape, setShape] = useState<Shape>('wheel');
    const [running, setRunning] = useState(false);
    const [runKey, setRunKey] = useState(0); // bump = nullstill tiden (t -> 0)
    const [arrowFinal, setArrowFinal] = useState(false); // tidspilen har nådd punktumet
    const [seen, setSeen] = useState({ wheel: false, arrow: false });
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0); // partikler ved gjenfødelse / paradis
    const [pop, setPop] = useState(0); // spring-pop på kloden ved gjenfødelse
    const [touched, setTouched] = useState(false);
    const doneRef = useRef(false);

    const reset = () => {
        setPhase('explore');
        setShape('wheel');
        setRunning(false);
        setArrowFinal(false);
        setSeen({ wheel: false, arrow: false });
        setBanner(null);
        setTouched(false);
        setRunKey((k) => k + 1);
        doneRef.current = false;
    };

    const pickShape = (v: 'a' | 'b') => {
        const next: Shape = v === 'a' ? 'wheel' : 'arrow';
        if (next === shape) return;
        setShape(next);
        setRunning(false);
        setArrowFinal(false);
        setBanner(null);
        setRunKey((k) => k + 1); // ny form starter alltid fra skapelsen
        sounds.play('sceneChange');
    };

    const toggleRun = () => {
        setTouched(true);
        if (running) {
            setRunning(false); // frys tiden
            return;
        }
        if (arrowFinal) {
            // start tidspilen på nytt fra skapelsen
            setArrowFinal(false);
            setRunKey((k) => k + 1);
        }
        setBanner(PHASE_BANNERS[0]);
        setRunning(true);
        sounds.play('select');
    };

    // Faseskifte rapportert fra scenen (kun når fasen faktisk endrer seg).
    const handlePhase = (idx: number) => {
        setBanner(PHASE_BANNERS[Math.min(idx, PHASE_BANNERS.length - 1)]);
        sounds.play('pick');
    };

    // Et fullt løp er fullført: hjulet snur, eller pilen treffer punktumet.
    const handleCycleEnd = (s: Shape) => {
        setBurst((b) => b + 1);
        if (s === 'arrow') {
            setRunning(false);
            setArrowFinal(true);
            setBanner(ARROW_END);
            setSeen((p) => ({ ...p, arrow: true }));
            sounds.play('complete');
        } else {
            setPop((p) => p + 1);
            setBanner(WHEEL_END);
            setSeen((p) => ({ ...p, wheel: true }));
            sounds.play('advance');
        }
    };

    const bothSeen = seen.wheel && seen.arrow;

    const finish = (correct: boolean) => {
        if (doneRef.current) return;
        doneRef.current = true;
        setBurst((b) => b + 1);
        setPhase('won');
        setRunning(false);
        sounds.play('complete');
        onComplete({ score: correct ? 1 : 0.7, completed: true, artifact: { shape } });
    };

    const idle = !touched && !running;

    return (
        <MicroGameScaffold
            title="Tidens to former"
            subtitle="Samme verden, samme slutt - men formen på tiden avgjør hva slutten betyr"
            estimatedSeconds={150}
            onRetry={touched || phase !== 'explore' ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#acc6ec] via-[#cdddf0] to-[#f1e8d2]"
            canvas={{
                idle: idle && phase === 'explore',
                autoRotateSpeed: 0.3,
                camera: { position: [5.5, 4.6, 12], fov: 38 },
                background: '#c4d7ef',
                fog: { color: '#d2e0f0', near: 22, far: 80 },
                target: [0, PCY, 0.4],
                contactShadows: false,
                maxPolarAngle: Math.PI / 2.05,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {shape === 'wheel' ? 'Sirkulær tid' : 'Lineær tid'}
                    </SceneBadge>
                    <DragHint show={idle}>Trykk den lysende kjernen: La tiden gå</DragHint>
                </>
            }
            scene={
                <EschatonScene
                    shape={shape}
                    running={running}
                    runKey={runKey}
                    burst={burst}
                    pop={pop}
                    showStart={!running && !arrowFinal}
                    showReplay={arrowFinal}
                    onPhase={handlePhase}
                    onCycleEnd={handleCycleEnd}
                    onStart={toggleRun}
                />
            }
        >
            {phase === 'explore' && (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <CompareToggle
                            labelA="Tidshjul"
                            labelB="Tidspil"
                            value={shape === 'wheel' ? 'a' : 'b'}
                            onChange={pickShape}
                        />
                        <button
                            onClick={toggleRun}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition"
                        >
                            {running ? (
                                <>
                                    <Square className="w-4 h-4" /> Stopp tiden
                                </>
                            ) : arrowFinal ? (
                                <>
                                    <RotateCcw className="w-4 h-4" /> Kjør på ny
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" /> La tiden gå
                                </>
                            )}
                        </button>
                    </div>

                    {/* Hvilke former eleven har sett tiden løpe i */}
                    <div className="flex gap-2.5">
                        <SeenChip label="Tidshjul" hint="sirkulær" done={seen.wheel} />
                        <SeenChip label="Tidspil" hint="lineær" done={seen.arrow} />
                    </div>

                    <SceneFact>
                        {shape === 'wheel' ? (
                            <>
                                <span className="font-bold text-slate-800">Tidshjulet:</span> tiden
                                er en evig syklus. Verden skapes, blomstrer, forfaller og går under
                                - og fødes så på ny av asken. Slik tenkte de norrøne om Ragnarok, og
                                slik ser hinduismen for seg de enorme yugaene. Undergangen er en
                                renselse.
                            </>
                        ) : (
                            <>
                                <span className="font-bold text-slate-800">Tidspilen:</span> tiden
                                er en rett linje mot ett bestemt mål. Når pilen treffer enden, er
                                det over for alltid - en ny himmel og en ny jord. Slik tenker
                                zoroastrismen, jødedommen, kristendommen og islam. Hver handling
                                teller, for du får bare denne ene sjansen.
                            </>
                        )}
                    </SceneFact>

                    {bothSeen ? (
                        <button
                            onClick={() => {
                                setRunning(false);
                                setBanner(null);
                                setPhase('quiz');
                                sounds.play('advance');
                            }}
                            className="self-start inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
                        >
                            Du har sett begge - koble til tradisjonene
                        </button>
                    ) : (
                        <p className="text-xs text-slate-500">
                            La tiden løpe i begge former for å se forskjellen på de to sluttene.
                        </p>
                    )}
                </div>
            )}

            {phase === 'quiz' && (
                <SceneQuiz
                    question="Ragnarok ender med at en grønn, ny verden stiger opp av havet, og livet begynner på nytt. Hvilken form for tid passer best?"
                    options={[
                        'Tidshjulet - sirkulær tid',
                        'Tidspilen - lineær tid',
                        'Begge passer like godt',
                        'Ingen av dem',
                    ]}
                    answerIndex={0}
                    explanation="Riktig: i sirkulær tid er undergangen en renselse, og verden fødes på ny - slik som i Ragnarok og hinduismens yugaer. Kristendom, islam og zoroastrisme ser derimot for seg en tidspil mot ett endelig punktum."
                    onResult={finish}
                />
            )}

            {phase === 'won' && (
                <WinScreen title="Du forstår tidens to former!" onReplay={reset}>
                    Slutten er den samme i begge - verden går under. Men formen på tiden avgjør hva
                    det betyr: tidshjulet gjør undergangen til en ny begynnelse, mens tidspilen gjør
                    den til et endelig punktum. Derfor er dommedag for noen en gledens dag, og for
                    andre den siste dom.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// Liten "sett / ikke sett"-brikke under vinduet.
function SeenChip({ label, hint, done }: { label: string; hint: string; done: boolean }) {
    return (
        <div
            className={`flex-1 rounded-xl border-2 px-3 py-2 transition ${
                done ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
            }`}
        >
            <div className="flex items-center gap-2">
                <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        done ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-500'
                    }`}
                >
                    {done ? '✓' : ''}
                </span>
                <span className="text-sm font-bold text-slate-800">{label}</span>
                <span className="text-[11px] text-slate-400">{hint}</span>
            </div>
        </div>
    );
}

// ============================================================
//  3D-SCENEN - en levende klode i et lysende kosmos
// ============================================================

interface SceneProps {
    shape: Shape;
    running: boolean;
    runKey: number;
    burst: number;
    pop: number;
    showStart: boolean;
    showReplay: boolean;
    onPhase: (idx: number) => void;
    onCycleEnd: (shape: Shape) => void;
    onStart: () => void;
}

function EschatonScene({
    shape,
    running,
    runKey,
    burst,
    pop,
    showStart,
    showReplay,
    onPhase,
    onCycleEnd,
    onStart,
}: SceneProps) {
    const t = useRef(0); // 0..1 framdrift gjennom tiden
    const lastPhase = useRef(-1);
    const ended = useRef(false);
    const marker = useRef<THREE.Group>(null);
    const markerLight = useRef<THREE.PointLight>(null);
    const ringRef = useRef<THREE.Group>(null);
    const arrowRef = useRef<THREE.Group>(null);
    const ringMat = useRef<THREE.MeshStandardMaterial>(null);
    const arrowMat = useRef<THREE.MeshStandardMaterial>(null);
    const endGlow = useRef<THREE.Mesh>(null);
    const trail = useRef<THREE.Mesh>(null);

    // Visuell vekt for hver form (crossfade når eleven bytter form).
    const ringVis = useRef(1);
    const arrowVis = useRef(0);

    // Render-tilstand for kloden (oppdateres fra useFrame, kun ved endring).
    const [idx, setIdx] = useState(0);
    const [atEnd, setAtEnd] = useState(false);

    useEffect(() => {
        t.current = 0;
        lastPhase.current = -1;
        ended.current = false;
    }, [runKey]);

    const phaseIdxOf = (tt: number) => Math.min(3, Math.max(0, Math.floor(tt * 4)));

    // Posisjon for tidsmarkøren i gjeldende form.
    const markerPos = (tt: number, out: THREE.Vector3) => {
        if (shape === 'wheel') {
            const a = -tt * Math.PI * 2 + Math.PI / 2;
            const x = Math.cos(a) * RING_R;
            const z0 = Math.sin(a) * RING_R;
            out.set(x, PCY - z0 * Math.sin(RING_TILT), z0 * Math.cos(RING_TILT));
        } else {
            out.set(THREE.MathUtils.lerp(ARROW_X0, ARROW_X1, tt), PCY, ARROW_Z);
        }
        return out;
    };

    const tmp = useRef(new THREE.Vector3());

    useFrame((state, dt) => {
        if (running && !ended.current) {
            t.current += dt / DURATION;
            if (shape === 'arrow') {
                if (t.current >= 1) {
                    t.current = 1;
                    ended.current = true;
                    onCycleEnd('arrow');
                }
            } else if (t.current >= 1) {
                t.current -= 1;
                lastPhase.current = -1;
                onCycleEnd('wheel');
            }
            const i = phaseIdxOf(t.current);
            if (i !== lastPhase.current) {
                lastPhase.current = i;
                onPhase(i);
            }
        }

        const tt = t.current;

        // Crossfade mellom hjul og pil
        ringVis.current = damp(ringVis.current, shape === 'wheel' ? 1 : 0, dt, 5);
        arrowVis.current = damp(arrowVis.current, shape === 'arrow' ? 1 : 0, dt, 5);
        if (ringRef.current) {
            ringRef.current.visible = ringVis.current > 0.02;
            ringRef.current.scale.setScalar(0.7 + ringVis.current * 0.3);
        }
        if (arrowRef.current) {
            arrowRef.current.visible = arrowVis.current > 0.02;
            arrowRef.current.scale.setScalar(0.7 + arrowVis.current * 0.3);
        }
        if (ringMat.current) ringMat.current.opacity = ringVis.current * 0.9;
        if (arrowMat.current) arrowMat.current.opacity = arrowVis.current * 0.9;

        // Tidsmarkøren ("nå-punktet")
        if (marker.current) {
            markerPos(tt, tmp.current);
            marker.current.position.copy(tmp.current);
            marker.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.1);
        }
        if (markerLight.current) markerLight.current.intensity = running ? 2.4 : 1.1;

        // Lysende hale bak markøren (peker mot klodens kjerne)
        if (trail.current && marker.current) {
            const m = trail.current.material as THREE.MeshBasicMaterial;
            m.opacity = (running ? 0.5 : 0.25) * Math.max(ringVis.current, arrowVis.current);
        }

        // Punktumet (Dommen) gløder sterkere når pilen nærmer seg enden
        if (endGlow.current) {
            const m = endGlow.current.material as THREE.MeshStandardMaterial;
            const near = shape === 'arrow' ? tt : 0;
            m.emissiveIntensity = 0.5 + near * near * 2.2;
            endGlow.current.scale.setScalar(1 + (shape === 'arrow' ? tt * 0.7 : 0));
        }

        // Speil fase + slutt-tilstand til render-state
        const curIdx = phaseIdxOf(tt);
        if (curIdx !== idx) setIdx(curIdx);
        const curAtEnd = shape === 'arrow' && tt >= 0.999;
        if (curAtEnd !== atEnd) setAtEnd(curAtEnd);
    });

    return (
        <group>
            <SkyDome />
            <CloudBands />
            <StarMotes />

            {/* Tidshjulet - en glødende ring som kretser om kloden */}
            <group ref={ringRef} position={[0, PCY, 0]} rotation={[-Math.PI / 2 + RING_TILT, 0, 0]}>
                <mesh>
                    <torusGeometry args={[RING_R, 0.07, 16, 80]} />
                    <meshStandardMaterial
                        ref={ringMat}
                        color="#caa24a"
                        emissive="#ffd676"
                        emissiveIntensity={0.7}
                        transparent
                        roughness={0.4}
                    />
                </mesh>
                {[0, 1, 2, 3].map((i) => {
                    const ang = ((i + 0.5) / 4) * Math.PI * 2;
                    return (
                        <mesh
                            key={i}
                            position={[Math.cos(ang) * RING_R, Math.sin(ang) * RING_R, 0]}
                        >
                            <sphereGeometry args={[0.16, 14, 14]} />
                            <meshStandardMaterial
                                color={i <= idx && shape === 'wheel' ? '#fff0c4' : '#d8c79a'}
                                emissive={i <= idx && shape === 'wheel' ? '#ffcf4a' : '#000000'}
                                emissiveIntensity={0.6}
                            />
                        </mesh>
                    );
                })}
            </group>

            {/* Tidspilen - en lysstråle fra skapelsens stjerne til Dommens stjerne */}
            <group ref={arrowRef}>
                <mesh position={[0, PCY, ARROW_Z]}>
                    <boxGeometry args={[ARROW_X1 - ARROW_X0 + 0.6, 0.07, 0.07]} />
                    <meshStandardMaterial
                        ref={arrowMat}
                        color="#caa24a"
                        emissive="#ffd676"
                        emissiveIntensity={0.7}
                        transparent
                        roughness={0.4}
                    />
                </mesh>
                <mesh position={[ARROW_X1 + 0.5, PCY, ARROW_Z]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.22, 0.55, 4]} />
                    <meshStandardMaterial
                        color="#caa24a"
                        emissive="#ffd676"
                        emissiveIntensity={0.7}
                    />
                </mesh>
                {/* Skapelsens stjerne */}
                <mesh position={[ARROW_X0 - 0.1, PCY, ARROW_Z]}>
                    <sphereGeometry args={[0.22, 16, 16]} />
                    <meshStandardMaterial
                        color="#9fe06a"
                        emissive="#5fbf3a"
                        emissiveIntensity={0.7}
                    />
                </mesh>
                {/* Dommens stjerne / ny jord */}
                <mesh ref={endGlow} position={[ARROW_X1 + 0.1, PCY, ARROW_Z]}>
                    <sphereGeometry args={[0.32, 18, 18]} />
                    <meshStandardMaterial
                        color="#fff0b0"
                        emissive="#ffd24a"
                        emissiveIntensity={0.6}
                    />
                </mesh>
            </group>

            {/* Den levende kloden */}
            <WorldPlanet phaseIdx={idx} atEnd={atEnd} pop={pop} />

            {/* Tidsmarkøren - et lite, vandrende sollys */}
            <group ref={marker}>
                <mesh>
                    <sphereGeometry args={[0.24, 18, 18]} />
                    <meshStandardMaterial
                        color="#fff7da"
                        emissive="#ffd24a"
                        emissiveIntensity={1.8}
                    />
                </mesh>
                <mesh ref={trail} scale={[0.55, 0.55, 0.55]}>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshBasicMaterial
                        color="#ffe7a0"
                        transparent
                        opacity={0.3}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
                <pointLight ref={markerLight} color="#ffe6a8" distance={9} intensity={1.1} />
            </group>

            {/* Feiringspartikler ved gjenfødelse / paradis */}
            <Burst position={[0, PCY, 0]} trigger={burst} color="#f6e6a8" count={36} spread={3.8} />

            {/* Direkte 3D-interaksjon: trykk for å la tiden gå */}
            {showStart && (
                <Hotspot
                    position={[0, PCY + 2.4, 0]}
                    onSelect={onStart}
                    label="La tiden gå"
                    radius={0.5}
                />
            )}
            {showReplay && (
                <Hotspot
                    position={[0, PCY + 2.4, 0]}
                    onSelect={onStart}
                    label="Kjør på ny"
                    radius={0.5}
                    color="#0ea5e9"
                />
            )}
        </group>
    );
}

// --- Lysende himmelkuppel (gradient: kjølig blå topp -> varm horisont) ---
function SkyDome() {
    const texture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 256;
        const ctx = c.getContext('2d');
        if (ctx) {
            const g = ctx.createLinearGradient(0, 0, 0, 256);
            g.addColorStop(0, '#9fbdea');
            g.addColorStop(0.45, '#c4d7ef');
            g.addColorStop(0.78, '#e7e3da');
            g.addColorStop(1, '#f4ead0');
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

// --- Myke skybanker som driver sakte i bakgrunnen (dybde, "himmelen") ---
function CloudBands() {
    const grp = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (grp.current) grp.current.rotation.y = clock.getElapsedTime() * 0.012;
    });
    const clouds = useMemo(
        () => [
            { p: [-14, 2, -12] as [number, number, number], s: 5 },
            { p: [16, 4, -10] as [number, number, number], s: 6 },
            { p: [-10, -3, -16] as [number, number, number], s: 7 },
            { p: [12, -2, -18] as [number, number, number], s: 6.5 },
            { p: [0, 6, -20] as [number, number, number], s: 8 },
        ],
        []
    );
    return (
        <group ref={grp}>
            {clouds.map((c, i) => (
                <mesh key={i} position={c.p} scale={[c.s, c.s * 0.45, c.s]}>
                    <sphereGeometry args={[1, 12, 10]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.32}
                        depthWrite={false}
                        fog={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Deterministisk pseudo-random (samme layout ved hver render) - på modulnivå så
// vi ikke muterer en variabel under render.
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
        const rand = makeRng(1337);
        return Array.from({ length: 40 }, () => {
            const r = 9 + rand() * 22;
            const theta = rand() * Math.PI * 2;
            const phi = (rand() - 0.5) * Math.PI;
            return [
                Math.cos(theta) * Math.cos(phi) * r,
                2 + rand() * 10,
                Math.sin(theta) * Math.cos(phi) * r - 6,
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

// ============================================================
//  KLODEN
// ============================================================

// Jevnt fordelte punkter på en kule (fibonacci) - til kontinenter og bylys.
function spherePoints(n: number, seed = 0): THREE.Vector3[] {
    const pts: THREE.Vector3[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * (i + seed);
        pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
    }
    return pts;
}

// Mål-verdier for kloden i hver fase.
function planetLook(phaseIdx: number, atEnd: boolean) {
    if (atEnd)
        return {
            ocean: '#dcb24a',
            land: '#f4dd86',
            atmo: '#ffe39a',
            atmoOp: 0.55,
            civ: 1.0,
            civColor: '#fff3c4',
            lava: 0,
            glow: 0.55,
            fire: false,
            smoke: false,
        };
    switch (phaseIdx) {
        case 0:
            return {
                ocean: '#2f6f8f',
                land: '#3f8048',
                atmo: '#9bd3ff',
                atmoOp: 0.4,
                civ: 0.55,
                civColor: '#ffe9a8',
                lava: 0,
                glow: 0,
                fire: false,
                smoke: false,
            };
        case 1:
            return {
                ocean: '#368aa4',
                land: '#3f9a4a',
                atmo: '#aee08e',
                atmoOp: 0.5,
                civ: 1.0,
                civColor: '#fff0b0',
                lava: 0,
                glow: 0,
                fire: false,
                smoke: false,
            };
        case 2:
            return {
                ocean: '#566a6a',
                land: '#6f6a44',
                atmo: '#bcae8c',
                atmoOp: 0.35,
                civ: 0.3,
                civColor: '#e9d2a0',
                lava: 0.15,
                glow: 0,
                fire: false,
                smoke: true,
            };
        default:
            return {
                ocean: '#241c1a',
                land: '#33231a',
                atmo: '#ff6a2a',
                atmoOp: 0.6,
                civ: 0,
                civColor: '#ff7a2a',
                lava: 1,
                glow: 0.35,
                fire: true,
                smoke: true,
            };
    }
}

function WorldPlanet({ phaseIdx, atEnd, pop }: { phaseIdx: number; atEnd: boolean; pop: number }) {
    const float = useIdleMotion({ bob: 0.12, sway: 0.015, speed: 0.8 });
    const popGrp = useRef<THREE.Group>(null);
    const core = useRef<THREE.Group>(null);
    const oceanMat = useRef<THREE.MeshStandardMaterial>(null);
    const atmoMat = useRef<THREE.MeshBasicMaterial>(null);

    const landMats = useRef<THREE.MeshStandardMaterial[]>([]);
    const civMats = useRef<THREE.MeshStandardMaterial[]>([]);

    const popScale = useRef(1);
    const popVel = useRef(0);

    const cOcean = useRef(new THREE.Color('#2f6f8f'));
    const cLand = useRef(new THREE.Color('#3f8048'));
    const cAtmo = useRef(new THREE.Color('#9bd3ff'));
    const cCiv = useRef(new THREE.Color('#ffe9a8'));
    const cLava = useRef(new THREE.Color('#ff5a1e'));
    const black = useRef(new THREE.Color('#000000'));

    const continents = useMemo(() => spherePoints(7, 0.5), []);
    const cityPts = useMemo(() => spherePoints(14, 3.5), []);

    useEffect(() => {
        if (pop === 0) return;
        popScale.current = 1.32;
        popVel.current = 0;
    }, [pop]);

    useFrame((_, dt) => {
        const L = planetLook(phaseIdx, atEnd);
        const k = Math.min(1, dt * 3);
        cOcean.current.set(L.ocean);
        cLand.current.set(L.land);
        cAtmo.current.set(L.atmo);
        cCiv.current.set(L.civColor);

        if (oceanMat.current) {
            oceanMat.current.color.lerp(cOcean.current, k);
            oceanMat.current.emissive.lerp(atEnd ? cCiv.current : black.current, k);
            oceanMat.current.emissiveIntensity = damp(
                oceanMat.current.emissiveIntensity,
                L.glow,
                dt,
                3
            );
        }
        landMats.current.forEach((m) => {
            if (!m) return;
            m.color.lerp(cLand.current, k);
            m.emissive.lerp(cLava.current, k);
            m.emissiveIntensity = damp(m.emissiveIntensity, L.lava * 1.6, dt, 3);
        });
        civMats.current.forEach((m) => {
            if (!m) return;
            m.color.lerp(cCiv.current, k);
            m.emissiveIntensity = damp(m.emissiveIntensity, L.civ * 2.2, dt, 4);
        });
        if (atmoMat.current) {
            atmoMat.current.color.lerp(cAtmo.current, k);
            atmoMat.current.opacity = damp(atmoMat.current.opacity, L.atmoOp, dt, 3);
        }

        // klodens rotasjon
        if (core.current) core.current.rotation.y += dt * 0.16;

        // spring-pop ved gjenfødelse
        const stiff = 90;
        const damping = 2 * Math.sqrt(stiff) * 0.45;
        const accel = -stiff * (popScale.current - 1) - damping * popVel.current;
        popVel.current += accel * dt;
        popScale.current += popVel.current * dt;
        if (popGrp.current) popGrp.current.scale.setScalar(popScale.current);
    });

    const L = planetLook(phaseIdx, atEnd);

    return (
        <group ref={float} position={[0, PCY, 0]}>
            <group ref={popGrp}>
                {/* roterende klode-kjerne med kontinenter og bylys */}
                <group ref={core}>
                    <mesh castShadow>
                        <sphereGeometry args={[1.5, 40, 40]} />
                        <meshStandardMaterial
                            ref={oceanMat}
                            color="#2f6f8f"
                            roughness={0.85}
                            metalness={0.05}
                        />
                    </mesh>

                    {continents.map((p, i) => {
                        const pos = p.clone().multiplyScalar(1.42);
                        return (
                            <mesh
                                key={i}
                                position={[pos.x, pos.y, pos.z]}
                                scale={[0.62 + (i % 3) * 0.12, 0.5, 0.62 + (i % 2) * 0.14]}
                            >
                                <sphereGeometry args={[0.6, 16, 16]} />
                                <meshStandardMaterial
                                    ref={(m) => {
                                        if (m) landMats.current[i] = m;
                                    }}
                                    color="#3f8048"
                                    emissive="#000000"
                                    roughness={0.95}
                                />
                            </mesh>
                        );
                    })}

                    {/* bylys - lyser i storhetstid, slukner i forfall/undergang */}
                    {cityPts.map((p, i) => {
                        const pos = p.clone().multiplyScalar(1.52);
                        return (
                            <mesh key={i} position={[pos.x, pos.y, pos.z]}>
                                <sphereGeometry args={[0.045, 8, 8]} />
                                <meshStandardMaterial
                                    ref={(m) => {
                                        if (m) civMats.current[i] = m;
                                    }}
                                    color="#ffe9a8"
                                    emissive="#ffcf6a"
                                    emissiveIntensity={1.2}
                                    toneMapped={false}
                                />
                            </mesh>
                        );
                    })}

                    {/* ild på overflaten i undergangen */}
                    <Fire position={[0.9, 1.0, 0.4]} scale={0.7} lit={L.fire} />
                    <Fire position={[-0.7, 0.8, 0.9]} scale={0.6} lit={L.fire} />
                </group>

                {/* atmosfære-glød rundt kloden */}
                <mesh scale={1.18}>
                    <sphereGeometry args={[1.5, 32, 32]} />
                    <meshBasicMaterial
                        ref={atmoMat}
                        color="#9bd3ff"
                        transparent
                        opacity={0.4}
                        side={THREE.BackSide}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>

                {/* røyk som stiger i forfall/undergang */}
                <Smoke origin={[0, 1.4, 0]} show={L.smoke} count={6} color="#5a4a40" />
            </group>
        </group>
    );
}

export default TidensFormer3D;
