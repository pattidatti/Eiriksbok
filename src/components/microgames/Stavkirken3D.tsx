import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MicroGameProps } from './types';
import {
    MicroGameScaffold,
    Draggable,
    Hotspot,
    SceneSlider,
    CompareToggle,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    WinScreen,
    StepTracker,
    GroundPlane,
    Tree,
    Rock,
    Particles,
    THEMES,
    damp,
    microSfx,
} from './kit';

// Lyspære-øyeblikket:
// "Etter denne interaksjonen skal eleven forstå at stavkirken står ennå fordi
//  treverket aldri rører jorda. Stolper gravd ned i bakken råtner der de står.
//  En ramme av sviller på stein gjør ikke det."
//
// Eleven bygger kirken selv: drar svillrammen opp på steinene, reiser stavene,
// legger taket. Så drar hen tidsspaken fra 1180 til i dag og ser kirken bli
// stående. Bytter hen til den eldre byggemåten, stolper gravd rett ned i jorda,
// spiller den samme tiden ut helt annerledes: stolpene råtner, kirken synker og
// velter. Mekanikken ER poenget.

const M = THEMES.medieval;

// --- Geometri-holdepunkter. Alt fluktes mot disse, så ingenting svever. ---
const STONE_TOP = 0.3; // steinfundamentets overside
const SILL_H = 0.3; // svillens tykkelse
const SILL_TOP = STONE_TOP + SILL_H; // 0.6 - stavene står her
const STAVE_H = 3.8;
const STAVE_TOP = SILL_TOP + STAVE_H; // 4.4
const HALF = 1.9; // halve grunnflaten
const STAVE_XZ: [number, number][] = [
    [-HALF, -HALF],
    [HALF, -HALF],
    [HALF, HALF],
    [-HALF, HALF],
];

const START_YEAR = 1180;
const END_YEAR = 2026;
// Stolpene i jorda er helt gjennområtne rundt 1350.
const ROT_DONE_YEAR = 1350;

function StoneFooting({ x, z }: { x: number; z: number }) {
    return (
        <mesh position={[x, STONE_TOP / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[0.85, STONE_TOP, 0.85]} />
            <meshStandardMaterial color={M.stone} roughness={1} flatShading />
        </mesh>
    );
}

// Rammen av sviller: fire liggende bjelker som danner et rektangel.
function SillFrame({ opacity = 1 }: { opacity?: number }) {
    const span = HALF * 2 + 0.7;
    const beam = 0.36;
    return (
        <group>
            {[-HALF, HALF].map((z) => (
                <mesh key={`x${z}`} position={[0, SILL_H / 2, z]} castShadow receiveShadow>
                    <boxGeometry args={[span, SILL_H, beam]} />
                    <meshStandardMaterial
                        color={M.wood}
                        roughness={0.9}
                        transparent={opacity < 1}
                        opacity={opacity}
                    />
                </mesh>
            ))}
            {[-HALF, HALF].map((x) => (
                <mesh key={`z${x}`} position={[x, SILL_H / 2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[beam, SILL_H, span]} />
                    <meshStandardMaterial
                        color={M.wood}
                        roughness={0.9}
                        transparent={opacity < 1}
                        opacity={opacity}
                    />
                </mesh>
            ))}
        </group>
    );
}

// En stav: loddrett sylinder. cylinderGeometry står langs Y som standard,
// så den trenger ingen rotasjon.
function Stave({ x, z, grow, tone }: { x: number; z: number; grow: number; tone: string }) {
    const h = Math.max(0.001, STAVE_H * grow);
    return (
        <mesh position={[x, SILL_TOP + h / 2, z]} visible={grow > 0.02} castShadow receiveShadow>
            <cylinderGeometry args={[0.26, 0.3, h, 12]} />
            <meshStandardMaterial color={tone} roughness={0.85} />
        </mesh>
    );
}

// Veggplankene mellom stavene. De står som enkeltplanker med smale spalter
// mellom, og er trukket inn fra hjørnene, slik at stavene blir synlige. Det er
// hele poenget: stavene bærer, plankene fyller bare igjen.
const PLANKS = [0, 1, 2, 3, 4, 5];
const PLANK_W = 0.5;
const PLANK_GAP = 0.06;
const WALL_SPAN = PLANKS.length * PLANK_W + (PLANKS.length - 1) * PLANK_GAP;

function Walls({ grow, tone }: { grow: number; tone: string }) {
    const h = Math.max(0.001, STAVE_H * grow);
    const start = -WALL_SPAN / 2 + PLANK_W / 2;
    const inset = HALF - 0.12;
    return (
        <group visible={grow > 0.05}>
            {[-inset, inset].map((z) =>
                PLANKS.map((i) => (
                    <mesh
                        key={`wx${z}-${i}`}
                        position={[start + i * (PLANK_W + PLANK_GAP), SILL_TOP + h / 2, z]}
                        castShadow
                        receiveShadow
                    >
                        <boxGeometry args={[PLANK_W, h, 0.14]} />
                        <meshStandardMaterial color={tone} roughness={0.95} />
                    </mesh>
                ))
            )}
            {[-inset, inset].map((x) =>
                PLANKS.map((i) => (
                    <mesh
                        key={`wz${x}-${i}`}
                        position={[x, SILL_TOP + h / 2, start + i * (PLANK_W + PLANK_GAP)]}
                        castShadow
                        receiveShadow
                    >
                        <boxGeometry args={[0.14, h, PLANK_W]} />
                        <meshStandardMaterial color={tone} roughness={0.95} />
                    </mesh>
                ))
            )}
        </group>
    );
}

// Taket: spontekket pyramide i to nivåer, med en liten takrytter og dragehoder.
function Roof({ drop, tone }: { drop: number; tone: string }) {
    // drop 0 = ikke lagt ennå, 1 = på plass.
    const y = STAVE_TOP + 0.2 + (1 - drop) * 3.4;
    return (
        <group position={[0, y, 0]} visible={drop > 0.02}>
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
                <coneGeometry args={[3.1, 1.5, 4]} />
                <meshStandardMaterial color={tone} roughness={1} flatShading />
            </mesh>
            <mesh position={[0, 1.75, 0]} castShadow>
                <coneGeometry args={[1.9, 1.4, 4]} />
                <meshStandardMaterial color={tone} roughness={1} flatShading />
            </mesh>
            {/* takrytteren på toppen */}
            <mesh position={[0, 2.75, 0]} castShadow>
                <cylinderGeometry args={[0.24, 0.3, 0.7, 8]} />
                <meshStandardMaterial color={tone} roughness={1} />
            </mesh>
            <mesh position={[0, 3.45, 0]} castShadow>
                <coneGeometry args={[0.38, 0.8, 4]} />
                <meshStandardMaterial color={tone} roughness={1} flatShading />
            </mesh>
            {/* Dragehoder ytterst på mønet. Kjegla har radius 3,1 ved
                takfoten, så hodene står på 3,25 og er dermed klar av taket.
                Kjeglen peker +Y som standard; rotasjon om X vipper den
                utover og opp. */}
            {[1, -1].map((sz) => (
                <mesh
                    key={sz}
                    position={[0, -0.05, sz * 3.25]}
                    rotation={[sz * (Math.PI / 2 - 0.7), 0, 0]}
                    castShadow
                >
                    <coneGeometry args={[0.16, 0.9, 5]} />
                    <meshStandardMaterial color={M.accent} roughness={0.8} />
                </mesh>
            ))}
        </group>
    );
}

interface SceneProps {
    step: number; // 0 ramme, 1 staver, 2 tak, 3 ferdig
    stavesUp: number;
    year: number;
    mode: 'a' | 'b';
    onFrameDrop: (pos: THREE.Vector3) => void;
    onRaise: (i: number) => void;
    onRoof: () => void;
    raised: boolean[];
}

function Scene({
    step,
    stavesUp,
    year,
    mode,
    onFrameDrop,
    onRaise,
    onRoof,
    raised,
}: SceneProps) {
    const church = useRef<THREE.Group>(null);

    // Én sannhet (år + byggemåte) driver hele forfallet. Alt dempes mot mål
    // utledet av den - ingen tilstand spredt utover flere refs.
    const rot =
        mode === 'b'
            ? Math.min(1, Math.max(0, (year - START_YEAR) / (ROT_DONE_YEAR - START_YEAR)))
            : 0;

    useFrame((_, dt) => {
        const g = church.current;
        if (!g) return;
        // Stolpene i jorda synker og kirken heller. Sviller på stein rører seg ikke.
        g.position.y = damp(g.position.y, mode === 'b' ? -rot * 1.15 : 0, dt, 2.5);
        g.rotation.z = damp(g.rotation.z, rot * 0.34, dt, 2.5);
        g.rotation.x = damp(g.rotation.x, rot * 0.16, dt, 2.5);
    });

    const frameDone = step >= 1;
    const roofDrop = step >= 3 ? 1 : 0;

    // Treverket gråner med åra. Råtner det, blir det mørkt og vått.
    const age = Math.min(1, Math.max(0, (year - START_YEAR) / (END_YEAR - START_YEAR)));
    // Stavene er kraftige og lyse; plankene er et hakk mørkere, så det er lett
    // å se hva som bærer og hva som bare fyller igjen.
    const wood = new THREE.Color('#9a6f42').lerp(new THREE.Color('#b0a183'), age * 0.6);
    const rotten = wood.clone().lerp(new THREE.Color('#463a2c'), rot * 0.85);
    const woodTone = `#${rotten.getHexString()}`;
    const plankTone = `#${rotten.clone().lerp(new THREE.Color('#000000'), 0.22).getHexString()}`;
    const roofTone = `#${new THREE.Color('#4b4038')
        .lerp(new THREE.Color('#76705f'), age * 0.6)
        .lerp(new THREE.Color('#2b2620'), rot * 0.7)
        .getHexString()}`;

    return (
        <group>
            <GroundPlane size={46} depth={36} color={M.ground} />

            {/* Omgivelser: furuskog og stein i lia. Alt står på bakken (y=0).
                Dette er bakgrunnsdekor, ikke selve modellen, så det holdes
                utenfor innrammings-målingen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                {[
                    [-8.5, -6],
                    [-10, 1.5],
                    [-7.5, 7],
                    [8.5, -6.5],
                    [10.5, 1],
                    [7.8, 7.5],
                    [0, -11],
                    [5, -10],
                    [-5.5, -10.5],
                ].map(([x, z], i) => (
                    <Tree key={i} position={[x, 0, z]} leaf={M.leaf} seed={i * 3 + 1} />
                ))}
                {[
                    [-5.5, 5.5, 0.9],
                    [6.2, 4.8, 1.1],
                    [-6.5, -3.2, 0.8],
                ].map(([x, z, s], i) => (
                    <Rock key={i} position={[x, 0.2 * s, z]} color={M.stone} scale={s} />
                ))}
            </group>

            {/* Steinfundamentet - ligger der fra start og viser hvor rammen skal. */}
            {mode === 'a' &&
                STAVE_XZ.map(([x, z], i) => <StoneFooting key={i} x={x} z={z} />)}

            {/* Svillrammen som skal dras på plass. */}
            {!frameDone && (
                <Draggable
                    position={[-4.9, 0, 3.4]}
                    planeY={0}
                    snapPoints={[[0, 0]]}
                    snapRadius={3.4}
                    bounds={{ minX: -7, maxX: 6, minZ: -6, maxZ: 6 }}
                    liftY={0.45}
                    dropFx="dustPuff"
                    onDrop={onFrameDrop}
                >
                    {/* Romslig usynlig gripeflate - trygg å ta tak i på Chromebook. */}
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[5.2, 1.4, 5.2]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <SillFrame />
                </Draggable>
            )}

            {/* Selve kirken. Alt fra svillnivå og opp synker/heller sammen. */}
            <group ref={church}>
                {frameDone && mode === 'a' && <SillFrame />}
                {frameDone &&
                    STAVE_XZ.map(([x, z], i) => (
                        <Stave
                            key={i}
                            x={x}
                            z={z}
                            grow={raised[i] ? 1 : 0}
                            tone={woodTone}
                        />
                    ))}
                {frameDone && <Walls grow={stavesUp >= 4 ? 1 : 0} tone={plankTone} />}
                <Roof drop={roofDrop} tone={roofTone} />
            </group>

            {/* Klikkpunkter: kun det aktive steget har hotspots. */}
            {step === 1 &&
                STAVE_XZ.map(([x, z], i) =>
                    raised[i] ? null : (
                        <Hotspot
                            key={i}
                            position={[x, SILL_TOP + 0.9, z]}
                            radius={0.55}
                            label="Reis staven"
                            onSelect={() => onRaise(i)}
                        />
                    )
                )}
            {step === 2 && (
                <Hotspot
                    position={[0, STAVE_TOP + 1.5, 0]}
                    radius={0.7}
                    label="Legg taket"
                    onSelect={onRoof}
                />
            )}

            {/* Regnet er fienden i hele denne historien. Atmosfære, ikke modell. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="rain" area={[18, 16]} center={[0, 0, 0]} height={9} />
            </group>
        </group>
    );
}

export default function Stavkirken3D({ onComplete, onRetry }: MicroGameProps) {
    const [step, setStep] = useState(0);
    const [raised, setRaised] = useState<boolean[]>([false, false, false, false]);
    const [year, setYear] = useState(START_YEAR);
    const [mode, setMode] = useState<'a' | 'b'>('a');
    const [sawRot, setSawRot] = useState(false);
    const [sawSurvival, setSawSurvival] = useState(false);
    const [nudge, setNudge] = useState<string | null>(null);
    const completed = useRef(false);

    const stavesUp = raised.filter(Boolean).length;
    // Seieren er avledet: kirken er bygd, og eleven har sett BEGGE utfallene
    // spilt ut i tid.
    const won = step === 3 && sawRot && sawSurvival;

    // Kalles fra handlerne med de nye verdiene, så seieren fyrer én gang.
    const maybeWin = (rot: boolean, survival: boolean) => {
        if (completed.current || step !== 3 || !rot || !survival) return;
        completed.current = true;
        microSfx.play('complete');
        onComplete({ score: 1, completed: true });
    };

    const handleFrameDrop = (pos: THREE.Vector3) => {
        if (step !== 0) return;
        const onTarget = Math.hypot(pos.x, pos.z) < 1.4;
        if (onTarget) {
            microSfx.play('correct');
            setStep(1);
            setNudge(null);
        } else {
            setNudge('Rammen må ligge oppå de fire steinene. Prøv en gang til.');
        }
    };

    const handleRaise = (i: number) => {
        setRaised((r) => {
            const next = [...r];
            next[i] = true;
            if (next.every(Boolean)) {
                microSfx.play('advance');
                setStep(2);
            }
            return next;
        });
    };

    const handleRoof = () => {
        microSfx.play('advance');
        setStep(3);
    };

    const handleYear = (v: number) => {
        setYear(v);
        const rot = sawRot || (mode === 'b' && v >= ROT_DONE_YEAR);
        const survival = sawSurvival || (mode === 'a' && v >= END_YEAR - 40);
        setSawRot(rot);
        setSawSurvival(survival);
        maybeWin(rot, survival);
    };

    const handleMode = (v: 'a' | 'b') => {
        setMode(v);
        microSfx.play('sceneChange');
        const rot = sawRot || (v === 'b' && year >= ROT_DONE_YEAR);
        const survival = sawSurvival || (v === 'a' && year >= END_YEAR - 40);
        setSawRot(rot);
        setSawSurvival(survival);
        maybeWin(rot, survival);
    };

    const reset = () => {
        setStep(0);
        setRaised([false, false, false, false]);
        setYear(START_YEAR);
        setMode('a');
        setSawRot(false);
        setSawSurvival(false);
        completed.current = false;
        setNudge(null);
        onRetry?.();
    };

    const rotted = mode === 'b' && year >= ROT_DONE_YEAR;

    const banner =
        nudge ??
        (step === 0
            ? 'Dra rammen av sviller opp på de fire steinene.'
            : step === 1
              ? `Klikk på hjørnene og reis stavene. ${stavesUp} av 4.`
              : step === 2
                ? 'Legg taket på toppen.'
                : rotted
                  ? 'Stolpene råtnet der de stod nede i jorda. Kirken sank og veltet.'
                  : !sawSurvival
                    ? 'Dra tidsspaken helt fram til i dag.'
                    : !sawRot
                      ? 'Bytt til den eldre byggemåten, og dra tida fram en gang til.'
                      : 'Samme kirke, samme regn. Bare fundamentet er ulikt.');

    const standing = mode === 'b' ? Math.min(year, ROT_DONE_YEAR) - START_YEAR : year - START_YEAR;

    return (
        <MicroGameScaffold
            title="Stavkirken som ble stående"
            subtitle="Bygg kirken, og dra så tida fram til i dag. Står den ennå?"
            estimatedSeconds={170}
            onRetry={reset}
            scene={
                <Scene
                    step={step}
                    stavesUp={stavesUp}
                    year={year}
                    mode={mode}
                    raised={raised}
                    onFrameDrop={handleFrameDrop}
                    onRaise={handleRaise}
                    onRoof={handleRoof}
                />
            }
            canvas={{
                // Ingen auto-rotasjon: første oppgave er et presist drag, og et mål
                // som roterer er unødig vanskelig på en Chromebook-styreplate.
                idle: false,
                camera: { position: [11, 10, 15], fov: 44 },
                background: M.sky,
                fog: { color: M.fog, near: 26, far: 56 },
                light: 'overcast',
                // Sikt lavt mens grunnen legges, høyere når kirken reiser seg.
                target: step >= 2 ? [0, 2.6, 0] : [0, 0.9, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Norge, {year}</SceneBadge>
                    {step === 3 && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Kirken har stått', value: standing, unit: 'år' },
                            ]}
                        />
                    )}
                    <DragHint show={step === 0} corner="bc">
                        Dra svillrammen inn på steinene
                    </DragHint>
                </>
            }
        >
            {step < 3 ? (
                <StepTracker current={step + 1} total={3} />
            ) : (
                <div className="space-y-3">
                    <SceneSlider
                        label="Dra tida framover"
                        min={START_YEAR}
                        max={END_YEAR}
                        step={2}
                        value={year}
                        onChange={handleYear}
                        valueLabel={(v) => `år ${v}`}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                        <CompareToggle
                            labelA="Sviller på stein"
                            labelB="Stolper i jorda"
                            value={mode}
                            onChange={handleMode}
                        />
                        <span className="text-xs text-slate-500 leading-snug">
                            {mode === 'a'
                                ? 'Treverket rører aldri bakken.'
                                : 'Slik ble de eldste trekirkene bygd.'}
                        </span>
                    </div>
                </div>
            )}

            {won && (
                <div className="mt-3">
                    <WinScreen title="Du fant grunnen til at stavkirkene står ennå" onReplay={reset}>
                        Det var ikke taket eller utskjæringene som avgjorde. Det var svillene.
                        Da byggmesterne la treverket på en steinramme i stedet for å grave
                        stolpene ned i jorda, sluttet kirken å råtne nedenfra. Borgund har stått
                        slik siden 1180-tallet.
                    </WinScreen>
                </div>
            )}
        </MicroGameScaffold>
    );
}
