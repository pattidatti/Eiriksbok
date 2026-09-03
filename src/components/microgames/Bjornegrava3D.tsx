import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    Hotspot,
    GroundPlane,
    Rock,
    Tree,
    Hill,
    Particles,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    WinScreen,
    LoseScreen,
    StepTracker,
    Burst,
    damp,
    useAmbience,
    THEMES,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Bjørnegrava.
// Pedagogisk kjerne (ÉN innsikt): For samene var jakten ikke ferdig når bjørnen
// var død. Beina måtte legges tilbake i ura i riktig rekkefølge, fra hode til
// hale, slik at bjørnen kunne bli født på nytt. Eleven kjenner det på fingrene:
// hun legger bjørkeriset, legger bjørnen sammen igjen i riktig orden, dekker med
// never og legger steinene tilbake.
//
// Konsekvens: legger du et bein i feil rom, spretter det tilbake til haugen.
// Tre bomturer og seremonien er ødelagt (LoseScreen).

const t = THEMES.arctic;

type Phase = 'ris' | 'bein' | 'never' | 'stein' | 'won' | 'lost';

interface BoneDef {
    id: string;
    label: string;
    // Riktig rom i grava, talt fra hodeenden.
    slot: number;
    start: [number, number];
}

// Grava ligger langs X. Rom 0 er hodeenden.
const SLOT_X = [-3, -1, 1, 3];
const SLOT_Z = 0;
const SLOT_POINTS: [number, number][] = SLOT_X.map((x) => [x, SLOT_Z]);
const BONE_Y = 0.16;
const MAX_MISS = 3;

const BONES: BoneDef[] = [
    { id: 'skalle', label: 'Hodeskallen', slot: 0, start: [-3.7, 4.3] },
    { id: 'forbein', label: 'Forbeina', slot: 1, start: [-1.25, 4.9] },
    { id: 'ryggrad', label: 'Ryggraden', slot: 2, start: [1.25, 4.9] },
    { id: 'bakbein', label: 'Bakbeina', slot: 3, start: [3.7, 4.3] },
];

const Bjornegrava3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const ambience = useAmbience('wind');

    const [phase, setPhase] = useState<Phase>('ris');
    const [placed, setPlaced] = useState<string[]>([]);
    const [misses, setMisses] = useState(0);
    const [runId, setRunId] = useState(0);
    const [bumps, setBumps] = useState<Record<string, number>>({});
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Klikk bunnen av grava for å legge et lag med bjørkeris.'
    );

    const reset = () => {
        setPhase('ris');
        setPlaced([]);
        setMisses(0);
        setBumps({});
        setBurst(0);
        setRunId((r) => r + 1);
        setBanner('Klikk bunnen av grava for å legge et lag med bjørkeris.');
    };

    const layBirch = () => {
        if (phase !== 'ris') return;
        sounds.play('advance');
        ambience.start();
        setPhase('bein');
        setBanner('Legg bjørnen sammen igjen. Hodet i det venstre rommet, halen i det høyre.');
    };

    const handleSnap = (bone: BoneDef, slotIndex: number) => {
        if (phase !== 'bein') return;
        const taken = placed.some((id) => BONES.find((b) => b.id === id)?.slot === slotIndex);
        if (slotIndex === bone.slot && !taken) {
            sounds.play('correct');
            setBurst((b) => b + 1);
            const next = [...placed, bone.id];
            setPlaced(next);
            if (next.length === BONES.length) {
                setPhase('never');
                setBanner('Bjørnen ligger hel. Klikk grava for å dekke beina med never.');
            } else {
                setBanner(`${bone.label} ligger riktig. ${BONES.length - next.length} igjen.`);
            }
            return;
        }
        // Feil rom (eller opptatt rom): beinet spretter tilbake til haugen.
        sounds.play('incorrect');
        setBumps((b) => ({ ...b, [bone.id]: (b[bone.id] ?? 0) + 1 }));
        const m = misses + 1;
        setMisses(m);
        if (m >= MAX_MISS) {
            setPhase('lost');
            setBanner(null);
            return;
        }
        setBanner(`${bone.label} hører ikke hjemme der. ${MAX_MISS - m} forsøk igjen.`);
    };

    const layBark = () => {
        if (phase !== 'never') return;
        sounds.play('advance');
        setPhase('stein');
        setBanner('Til slutt: klikk for å legge steinene tilbake over grava.');
    };

    const layStones = () => {
        if (phase !== 'stein') return;
        sounds.play('complete');
        setBurst((b) => b + 1);
        setPhase('won');
        setBanner(null);
        onComplete({ score: misses === 0 ? 1 : 0.7, completed: true });
    };

    const stepNumber =
        phase === 'ris' ? 1 : phase === 'bein' ? 2 : phase === 'never' ? 3 : phase === 'stein' ? 4 : 4;

    return (
        <MicroGameScaffold
            title="Bjørnegrava"
            subtitle="Legg bjørnen tilbake i ura, i riktig orden, slik at den kan bli født på nytt"
            estimatedSeconds={150}
            onRetry={phase !== 'ris' ? reset : undefined}
            canvas={{
                idle: phase === 'ris',
                camera: { position: [0, 9.2, 13.6], fov: 44 },
                background: t.sky,
                fog: { color: t.fog, near: 24, far: 52 },
                light: 'arctic',
                target: [0, 0.4, 1.2],
            }}
            containerClassName="bg-gradient-to-b from-[#dceaf2] via-[#e7f0f4] to-[#e8eef2]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Ur i Nord-Norge</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Bein på plass', value: `${placed.length}/${BONES.length}` },
                            { label: 'Bomturer', value: `${misses}/${MAX_MISS}` },
                        ]}
                    />
                    <DragHint show={phase === 'bein'} corner="bc">
                        Dra beina ned i grava
                    </DragHint>
                </>
            }
            scene={
                <Ura
                    key={runId}
                    phase={phase}
                    placed={placed}
                    bumps={bumps}
                    burst={burst}
                    onBirch={layBirch}
                    onBark={layBark}
                    onStones={layStones}
                    onSnap={handleSnap}
                />
            }
        >
            <div className="flex items-center justify-between gap-3 mb-3">
                <StepTracker current={stepNumber} total={4} />
                <span className="text-xs text-slate-500">
                    {phase === 'ris' && 'Steg 1: bjørkeris i bunnen'}
                    {phase === 'bein' && 'Steg 2: bein fra hode til hale'}
                    {phase === 'never' && 'Steg 3: never over beina'}
                    {phase === 'stein' && 'Steg 4: steinene tilbake'}
                </span>
            </div>

            {phase === 'ris' && (
                <p className="text-sm text-slate-600">
                    Bjørnen er felt, og kjøttet er spist i et eget måltid. Nå står det viktigste
                    igjen. Grava er en naturlig sprekk i ura, og bunnen skal kles med bjørkeris før
                    beina legges ned.
                </p>
            )}

            {phase === 'bein' && (
                <p className="text-sm text-slate-600">
                    Beina skal ikke kastes ned i en haug. De skal ligge omtrent slik de lå i den
                    levende bjørnen: hodeskallen først, så forbeina, så ryggraden, og bakbeina sist.
                </p>
            )}

            {phase === 'never' && (
                <p className="text-sm text-slate-600">
                    Bjørnen ligger hel igjen. Over beina la de et lag med never, altså bark fra
                    bjørk, som beskyttelse mot jord og vann.
                </p>
            )}

            {phase === 'stein' && (
                <p className="text-sm text-slate-600">
                    Så ble grava lukket med planker, torv og stein. Utenfra ser den ut som resten av
                    ura. Det var meningen.
                </p>
            )}

            {phase === 'won' && (
                <WinScreen title="Bjørnen ligger hel i fjellet." onReplay={reset}>
                    Beina ble lagt i omtrent den orden de hadde i den levende bjørnen, på en seng av
                    bjørkeris og under et dekke av never. Slik kunne bjørnen bli hel igjen og bli
                    født på nytt, og da ville den også være villig til å la seg jakte på en gang til.
                    {misses > 0 && ' Denne gangen tok det noen forsøk å finne riktig orden.'}
                </WinScreen>
            )}

            {phase === 'lost' && (
                <LoseScreen title="Beina lå i uorden." onRetry={reset}>
                    Etter det folk trodde, kunne ikke bjørnen finne kroppen sin igjen når beina lå
                    hulter til bulter. Da ville den heller ikke komme tilbake. Ordenen var ikke pynt,
                    den var hele poenget. Prøv en gang til, og legg beina fra hode til hale.
                </LoseScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Ura({
    phase,
    placed,
    bumps,
    burst,
    onBirch,
    onBark,
    onStones,
    onSnap,
}: {
    phase: Phase;
    placed: string[];
    bumps: Record<string, number>;
    burst: number;
    onBirch: () => void;
    onBark: () => void;
    onStones: () => void;
    onSnap: (bone: BoneDef, slot: number) => void;
}) {
    const birchDown = phase !== 'ris';
    const barkDown = phase === 'stein' || phase === 'won';
    const lidDown = phase === 'won';

    return (
        <group>
            {/* Bakgrunn: fjell og snøvær. Merket som dekor så scene-revisjonen
                måler selve grava, ikke horisonten. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Hill position={[-11, 0, -16]} radius={8} height={6.5} color="#c3d2db" seed={3} />
                <Hill position={[10, 0, -18]} radius={9} height={7.5} color="#b6c7d2" seed={7} />
                <Particles preset="snow" center={[0, 5, 0]} area={[26, 22]} height={11} />
            </group>

            <GroundPlane color="#d7e2ea" />

            {/* Bjørketrær ute i kanten, klar av ura */}
            <Tree position={[-7.8, 0, -6.2]} leaf="#7e9a86" seed={1} />
            <Tree position={[-4.4, 0, -7]} leaf="#789583" seed={4} />
            <Tree position={[4.8, 0, -7.2]} leaf="#829e8a" seed={9} />
            <Tree position={[8, 0, -6]} leaf="#7c9986" seed={12} />

            {/* Selve ura: steinblokker som rammer inn grava */}
            <ScreeFrame />

            {/* Gravbunnen: et hulrom mellom steinene, ikke en plattform */}
            <mesh position={[0, 0.03, SLOT_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[8.4, 2.1]} />
                <meshStandardMaterial color="#463d31" roughness={1} />
            </mesh>

            {/* Rommene i grava, i orden fra hodeenden */}
            {phase === 'bein' &&
                SLOT_X.map((x, i) => {
                    const filled = placed.some(
                        (id) => BONES.find((b) => b.id === id)?.slot === i
                    );
                    return <SlotMark key={x} x={x} filled={filled} />;
                })}

            {/* Steg 1: bjørkeriset */}
            <BirchBed down={birchDown} />
            {phase === 'ris' && (
                <Hotspot
                    position={[0, 0.9, SLOT_Z]}
                    onSelect={onBirch}
                    label="Legg bjørkeris i bunnen"
                    radius={0.62}
                />
            )}

            {/* Steg 2: beina eleven drar ned i grava */}
            {BONES.map((bone) => {
                const done = placed.includes(bone.id);
                if (done) {
                    return (
                        <group key={bone.id} position={[SLOT_X[bone.slot], BONE_Y, SLOT_Z]}>
                            <BoneMesh id={bone.id} />
                        </group>
                    );
                }
                if (phase !== 'bein') return null;
                return (
                    <Draggable
                        key={`${bone.id}-${bumps[bone.id] ?? 0}`}
                        position={[bone.start[0], BONE_Y, bone.start[1]]}
                        planeY={BONE_Y}
                        bounds={{ minX: -5.5, maxX: 5.5, minZ: -1.2, maxZ: 5.6 }}
                        snapPoints={SLOT_POINTS}
                        snapRadius={0.95}
                        onSnap={(i) => onSnap(bone, i)}
                        liftY={0.35}
                        dropFx="dustPuff"
                    >
                        {/* Romslig usynlig gripeflate - trygg på trackpad */}
                        <mesh position={[0, 0.25, 0]}>
                            <boxGeometry args={[1.7, 1.1, 1.5]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <BoneMesh id={bone.id} />
                    </Draggable>
                );
            })}

            {/* Steg 3: neverdekket */}
            <BarkCover down={barkDown} />
            {phase === 'never' && (
                <Hotspot
                    position={[0, 1, SLOT_Z]}
                    onSelect={onBark}
                    label="Legg never over beina"
                    radius={0.62}
                    color="#b07a3c"
                />
            )}

            {/* Steg 4: steinene som lukker grava */}
            <StoneLid down={lidDown} />
            {phase === 'stein' && (
                <Hotspot
                    position={[0, 1.2, SLOT_Z]}
                    onSelect={onStones}
                    label="Legg steinene tilbake"
                    radius={0.62}
                    color="#94a3b8"
                />
            )}

            <Burst position={[0, 0.6, SLOT_Z]} trigger={burst} color="#f8fafc" count={22} spread={2.4} />

            {/* Finalen: bjørnen reiser seg og går */}
            <BearSpirit active={phase === 'won'} />
        </group>
    );
}

// ── Steinura rundt grava ──────────────────────────────────────────────────────
// Store blokker rammer inn hulrommet, mindre stein og grus fyller ut, slik at
// det leser som en ur og ikke som en plattform på en hvit slette.
// Blokkene ligger bak og ute på sidene. Korridoren mellom beinhaugen og grava
// holdes åpen, ellers skygger steinene for både grava og rommene i den.
const BLOCKS: { x: number; z: number; s: number; rot: number }[] = [
    { x: -6.5, z: -2.4, s: 2.4, rot: 0.4 },
    { x: -4.1, z: -3.2, s: 1.7, rot: 1.1 },
    { x: -1.4, z: -3.5, s: 2.1, rot: 2.2 },
    { x: 1.4, z: -3.5, s: 1.8, rot: 0.7 },
    { x: 4.2, z: -3.1, s: 2.3, rot: 1.7 },
    { x: 6.6, z: -2.2, s: 1.9, rot: 2.8 },
    { x: -6.9, z: -0.9, s: 1.7, rot: 1.3 },
    { x: 6.9, z: -1, s: 1.6, rot: 0.2 },
    { x: -7, z: 3.2, s: 1.4, rot: 2.5 },
    { x: 7, z: 3.1, s: 1.3, rot: 1.9 },
];

// Kantstein tett inntil hulrommet, så grava får en lippe i stedet for en skarp
// kant. Fremre rad holdes lav, ellers dekker den rommene sett fra kameraet.
const RIM: { x: number; z: number; s: number }[] = [];
for (let i = 0; i < 9; i++) {
    const x = -4.2 + i * 1.05;
    RIM.push({ x, z: -1.5, s: 0.62 + ((i * 7) % 5) * 0.06 });
    RIM.push({ x: x + 0.5, z: 1.5, s: 0.38 + ((i * 5) % 4) * 0.05 });
}

// Grus utover, deterministisk fordelt, men aldri i korridoren foran grava.
const GRAVEL: { x: number; z: number; s: number }[] = [];
for (let i = 0; i < 34; i++) {
    const a = i * 2.399;
    const r = 5 + ((i * 13) % 9) * 0.3;
    const x = Math.cos(a) * r * 1.34;
    const z = Math.sin(a) * r * 0.74;
    if (Math.abs(x) > 7 || Math.abs(z) > 4.4) continue;
    // Ute av hulrommet.
    if (Math.abs(x) < 5.4 && Math.abs(z) < 2.3) continue;
    // Ute av korridoren mellom beinhaugen og grava.
    if (z > 2 && Math.abs(x) < 5.4) continue;
    GRAVEL.push({ x, z, s: 0.28 + ((i * 11) % 5) * 0.05 });
}

function ScreeFrame() {
    return (
        <group>
            {BLOCKS.map((r, i) => (
                <group key={`b${i}`} rotation={[0, r.rot, 0]}>
                    <Rock
                        position={[r.x, 0.44 * r.s, r.z]}
                        scale={r.s}
                        color={i % 3 === 0 ? '#9aa8b3' : t.stone}
                    />
                </group>
            ))}
            {RIM.map((r, i) => (
                <Rock
                    key={`r${i}`}
                    position={[r.x, 0.42 * r.s, r.z]}
                    scale={r.s}
                    color={i % 2 === 0 ? '#aab6c0' : '#98a5b0'}
                />
            ))}
            {GRAVEL.map((r, i) => (
                <Rock
                    key={`g${i}`}
                    position={[r.x, 0.4 * r.s, r.z]}
                    scale={r.s}
                    color={i % 4 === 0 ? '#b9c4cc' : '#a4b0ba'}
                />
            ))}
        </group>
    );
}

// ── Markør for hvert rom i grava ─────────────────────────────────────────────
function SlotMark({ x, filled }: { x: number; filled: boolean }) {
    return (
        <mesh position={[x, 0.05, SLOT_Z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.52, 0.66, 24]} />
            <meshBasicMaterial
                color={filled ? '#10b981' : '#f59e0b'}
                transparent
                opacity={filled ? 0.5 : 0.85}
            />
        </mesh>
    );
}

// ── Bjørkeriset i bunnen ─────────────────────────────────────────────────────
function BirchBed({ down }: { down: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.position.y = damp(ref.current.position.y, down ? 0.06 : 1.6, dt, 4);
        const s = damp(ref.current.scale.x, down ? 1 : 0.001, dt, 6);
        ref.current.scale.setScalar(s);
        ref.current.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={[0, 1.6, SLOT_Z]} scale={0.001} visible={false}>
            {[-1.05, -0.35, 0.35, 1.05].map((z, i) => (
                <mesh key={z} position={[0, 0.03 * (i % 2), z]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.055, 0.055, 8.4, 6]} />
                    <meshStandardMaterial color="#7a6a4a" roughness={1} />
                </mesh>
            ))}
            {[-3, -1.4, 0.6, 2.6].map((x) => (
                <mesh key={x} position={[x, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.045, 0.045, 2.2, 6]} />
                    <meshStandardMaterial color="#8c7c58" roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// ── Neverdekket ──────────────────────────────────────────────────────────────
function BarkCover({ down }: { down: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.position.y = damp(ref.current.position.y, down ? 0.34 : 2.2, dt, 3.4);
        const s = damp(ref.current.scale.x, down ? 1 : 0.001, dt, 6);
        ref.current.scale.setScalar(s);
        ref.current.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={[0, 2.2, SLOT_Z]} scale={0.001} visible={false}>
            {[-2.9, -0.95, 0.95, 2.9].map((x) => (
                <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
                    <planeGeometry args={[1.85, 2.3]} />
                    <meshStandardMaterial
                        color="#c9a06a"
                        roughness={0.95}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ── Steinlokket ──────────────────────────────────────────────────────────────
function StoneLid({ down }: { down: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.position.y = damp(ref.current.position.y, down ? 0 : 3.2, dt, 2.6);
        const s = damp(ref.current.scale.x, down ? 1 : 0.001, dt, 5);
        ref.current.scale.setScalar(s);
        ref.current.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={[0, 3.2, SLOT_Z]} scale={0.001} visible={false}>
            {[-3.1, -1.1, 1, 3.1].map((x, i) => (
                <Rock
                    key={x}
                    position={[x, 0.5, i % 2 === 0 ? -0.2 : 0.25]}
                    scale={1.9}
                    color={i % 2 === 0 ? '#9fadb7' : t.stone}
                />
            ))}
        </group>
    );
}

// ── Beina ────────────────────────────────────────────────────────────────────
function BoneMesh({ id }: { id: string }) {
    const bone = '#ece0c6';
    if (id === 'skalle') {
        return (
            <group>
                <mesh position={[0.12, 0.2, 0]} castShadow>
                    <sphereGeometry args={[0.34, 14, 12]} />
                    <meshStandardMaterial color={bone} roughness={0.8} />
                </mesh>
                <mesh position={[-0.34, 0.16, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.13, 0.19, 0.5, 10]} />
                    <meshStandardMaterial color={bone} roughness={0.8} />
                </mesh>
            </group>
        );
    }
    if (id === 'ryggrad') {
        return (
            <group>
                {[-0.6, -0.3, 0, 0.3, 0.6].map((x) => (
                    <mesh key={x} position={[x, 0.13, 0]} castShadow>
                        <boxGeometry args={[0.2, 0.22, 0.26]} />
                        <meshStandardMaterial color={bone} roughness={0.8} />
                    </mesh>
                ))}
            </group>
        );
    }
    // Forbein og bakbein: to lange bein som ligger flatt, side ved side.
    const len = id === 'bakbein' ? 1.15 : 0.95;
    const r = id === 'bakbein' ? 0.11 : 0.09;
    return (
        <group>
            {[-0.28, 0.28].map((z) => (
                <mesh key={z} position={[0, 0.12, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[r, r, len, 10]} />
                    <meshStandardMaterial color={bone} roughness={0.8} />
                </mesh>
            ))}
        </group>
    );
}

// ── Finalen: bjørnen reiser seg og går inn i fjellet ─────────────────────────
function BearSpirit({ active }: { active: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);

    useFrame((_, dt) => {
        if (!ref.current) return;
        const tx = active ? -7.5 : 0;
        const ty = active ? 2.4 : 0.3;
        const tz = active ? -7.5 : SLOT_Z;
        ref.current.position.x = damp(ref.current.position.x, tx, dt, 0.38);
        ref.current.position.y = damp(ref.current.position.y, ty, dt, 0.38);
        ref.current.position.z = damp(ref.current.position.z, tz, dt, 0.38);
        const s = damp(ref.current.scale.x, active ? 1 : 0.001, dt, 2.4);
        ref.current.scale.setScalar(s);
        ref.current.visible = active && s > 0.02;
        if (mat.current) {
            const travelled = Math.min(1, Math.abs(ref.current.position.x) / 7.5);
            mat.current.opacity = active ? 0.78 * (1 - travelled * 0.7) : 0;
        }
    });

    return (
        <group ref={ref} position={[0, 0.3, SLOT_Z]} scale={0.001} visible={false}>
            <mesh position={[0, 0.72, 0]} scale={[1.25, 1, 1]}>
                <sphereGeometry args={[0.86, 16, 12]} />
                <meshBasicMaterial
                    ref={mat}
                    color="#cfe6f5"
                    transparent
                    opacity={0.5}
                    depthWrite={false}
                />
            </mesh>
            <mesh position={[-1.15, 1.05, 0]} scale={[1, 1, 0.85]}>
                <sphereGeometry args={[0.5, 14, 12]} />
                <meshBasicMaterial color="#dcefff" transparent opacity={0.62} depthWrite={false} />
            </mesh>
            <mesh position={[-1.45, 0.92, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.16, 0.22, 0.4, 10]} />
                <meshBasicMaterial color="#dcefff" transparent opacity={0.55} depthWrite={false} />
            </mesh>
        </group>
    );
}

export default Bjornegrava3D;
