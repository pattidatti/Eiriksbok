import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    SceneSlider,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    SceneFact,
    WinScreen,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Klokka som styrte livet". Kjernen i artikkelen er
// gangen (escapement): oppfinnelsen som slapp tannhjulene fri litt etter litt og
// gjorde at klokka tikket i et fast tempo.
//
// Lyspære-øyeblikket: eleven kjenner på kroppen at den jevne, ukontrollerte
// kraften fra loddet må temmes. Først henger eleven på loddet - og hjulet
// raser vilt av gårde. Så setter eleven inn gangen - og det samme hjulet begynner
// å tikke jevnt, ett tann om gangen. Til slutt stiller eleven pendelen til riktig
// takt: kort pendel = rask klokke, lang pendel = treg klokke.
//
// Mekanikk: to Draggable (loddet, gangen) bygger verket steg for steg, og en
// SceneSlider regulerer pendelens lengde til klokka går rett (60 tikk i minuttet).

type Stage = 'weight' | 'loose' | 'run' | 'won';

// Målposisjoner på bakken der delene slippes.
const DRUM_DROP: [number, number] = [-3.2, 0];
const GANG_DROP: [number, number] = [0, 0];

// Riktig takt: ett tikk i sekundet.
const TARGET_TPM = 60;
const TOL = 4;

// Escape-hjulet har 12 tenner. Ett tikk = ett tann.
const TEETH = 12;
const STEP = (Math.PI * 2) / TEETH;

// Pendelens halvsving (sekunder per tikk) = sqrt(lengde). Ved lengde 1.0 blir det
// 60 tikk i minuttet. Lengre pendel svinger saktere.
function tpmFromLength(len: number): number {
    return Math.round(60 / Math.sqrt(len));
}

// Brassy, varmt klokketårn-palett (ikke standard grønn åker).
const BRASS = '#c9a24a';
const BRASS_DARK = '#9c7a2e';
const STEEL = '#9aa0a6';
const WOOD = '#6b4a2c';
const WOOD_DARK = '#4a3018';
const FACE = '#f3ead2';

const Gangen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState<Stage>('weight');
    const [pendLen, setPendLen] = useState(2.2); // starter for langt -> for sakte
    const [banner, setBanner] = useState<string | null>(
        'Dra det tunge loddet bort under trommelen for å gi klokka kraft.'
    );
    const [burst, setBurst] = useState(0);
    const winTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const tpm = tpmFromLength(pendLen);

    const clearWin = () => {
        if (winTimer.current) {
            clearTimeout(winTimer.current);
            winTimer.current = null;
        }
    };

    const reset = () => {
        clearWin();
        setStage('weight');
        setPendLen(2.2);
        setBanner('Dra det tunge loddet bort under trommelen for å gi klokka kraft.');
    };

    useEffect(() => () => clearWin(), []);

    const placeWeight = (pos: THREE.Vector3) => {
        const dist = Math.hypot(pos.x - DRUM_DROP[0], pos.z - DRUM_DROP[1]);
        if (dist < 1.9) {
            sounds.play('drop');
            setStage('loose');
            setBanner('Loddet drar - men uten noe som bremser, raser hjulet vilt av gårde!');
        } else {
            setBanner('Dra loddet helt bort under trommelen til venstre.');
        }
    };

    const placeGang = (pos: THREE.Vector3) => {
        const dist = Math.hypot(pos.x - GANG_DROP[0], pos.z - GANG_DROP[1]);
        if (dist < 1.9) {
            sounds.play('advance');
            setStage('run');
            setBanner('Gangen slipper hjulet fri ett tann om gangen. Nå tikker klokka! Still pendelen til riktig takt.');
        } else {
            setBanner('Dra gangen inn over det store hjulet i midten.');
        }
    };

    const onSlide = (v: number) => {
        setPendLen(v);
        clearWin();
        if (stage !== 'run') return;
        const close = Math.abs(tpmFromLength(v) - TARGET_TPM) <= TOL;
        if (close) {
            sounds.play('correct');
            winTimer.current = setTimeout(() => {
                sounds.play('complete');
                setBurst((b) => b + 1);
                setStage('won');
                setBanner(null);
                setTimeout(() => onComplete({ score: 1, completed: true }), 280);
            }, 1100);
        }
    };

    const live = stage === 'run' || stage === 'won';
    const idleWeight = stage === 'weight';
    const taktLabel =
        tpm > TARGET_TPM + TOL ? 'For raskt' : tpm < TARGET_TPM - TOL ? 'For sakte' : 'Riktig takt';

    return (
        <MicroGameScaffold
            title="Gangen: klokkas hemmelighet"
            subtitle="Heng på loddet, sett inn gangen, og still pendelen til klokka går rett"
            estimatedSeconds={150}
            onRetry={stage !== 'weight' ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0.5, 2.6, 12], fov: 42 },
                background: '#e7dcc4',
                fog: { near: 26, far: 52 },
                target: [0, 2, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Mekanisk klokke</SceneBadge>
                    {live && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Takt', value: tpm, unit: 'tikk/min' },
                                { label: 'Mål', value: TARGET_TPM, unit: 'tikk/min' },
                            ]}
                        />
                    )}
                    <DragHint show={idleWeight} corner="bc">
                        Dra loddet under trommelen
                    </DragHint>
                </>
            }
            scene={
                <ClockScene
                    stage={stage}
                    pendLen={pendLen}
                    burst={burst}
                    onPlaceWeight={placeWeight}
                    onPlaceGang={placeGang}
                />
            }
        >
            {stage === 'weight' && (
                <SceneFact>
                    Loddet henger i et tau rundt trommelen. Tyngdekraften drar det nedover og prøver
                    å snurre hele verket rundt. Dette er kraften som driver klokka - men den er
                    ujevn og ute av kontroll.
                </SceneFact>
            )}

            {stage === 'loose' && (
                <div className="flex flex-col gap-2.5">
                    <p className="text-sm text-slate-600">
                        Se hvor vilt hjulet snurrer! Kraften fra loddet trenger noe som slipper
                        hjulet fri litt etter litt. Dra gangen (den vippende delen) inn over det store
                        hjulet i midten.
                    </p>
                    <SceneFact>
                        Gangen var hemmeligheten bak de første mekaniske klokkene på 1300-tallet.
                        Uten den kunne ingen lage en maskin som holdt jevn tid.
                    </SceneFact>
                </div>
            )}

            {stage === 'run' && (
                <div className="flex flex-col gap-3">
                    <SceneSlider
                        label="Pendelens lengde"
                        min={0.5}
                        max={3}
                        step={0.05}
                        value={pendLen}
                        onChange={onSlide}
                        valueLabel={() => `${tpm} tikk/min - ${taktLabel}`}
                    />
                    <SceneFact>
                        Pendelen bestemmer takten. En kort pendel svinger raskt og klokka går for
                        fort. En lang pendel svinger sakte og klokka går for tregt. Still den til
                        klokka tikker en gang i sekundet - 60 tikk i minuttet.
                    </SceneFact>
                </div>
            )}

            {stage === 'won' && (
                <WinScreen title="Klokka går rett!" onReplay={reset}>
                    Du temmet kraften fra loddet. Gangen slipper hjulet fri ett tann om gangen, og
                    pendelen holder takten jevn. Det var akkurat denne maskinen som tok over for sola
                    og begynte å styre når folk sto opp, jobbet og møttes.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function ClockScene({
    stage,
    pendLen,
    burst,
    onPlaceWeight,
    onPlaceGang,
}: {
    stage: Stage;
    pendLen: number;
    burst: number;
    onPlaceWeight: (pos: THREE.Vector3) => void;
    onPlaceGang: (pos: THREE.Vector3) => void;
}) {
    const wheel = useRef<THREE.Group>(null);
    const anchor = useRef<THREE.Group>(null);
    const pend = useRef<THREE.Group>(null);
    const hand = useRef<THREE.Group>(null);
    const weight = useRef<THREE.Group>(null);

    // All bevegelse drives av disse refene (aldri lest i render).
    const phase = useRef(0); // svinge-faser i hele perioder
    const tick = useRef(0); // antall fullførte tikk
    const free = useRef(0); // fri rotasjon i loose-fasen
    const wheelRot = useRef(0);
    const handRot = useRef(0);
    const drop = useRef(0); // hvor langt loddet har sunket

    const gangIn = stage === 'run' || stage === 'won';
    const running = stage === 'run' || stage === 'won';

    // Nullstill bevegelsen ved faseskifte så overgangene ikke hopper.
    useEffect(() => {
        if (stage === 'loose') {
            free.current = 0;
        }
        if (stage === 'run') {
            phase.current = 0;
            tick.current = 0;
            wheelRot.current = 0;
            handRot.current = 0;
        }
        if (stage === 'weight') {
            free.current = 0;
            phase.current = 0;
            tick.current = 0;
            wheelRot.current = 0;
            handRot.current = 0;
            drop.current = 0;
        }
    }, [stage]);

    useFrame((_, dt) => {
        const d = Math.min(dt, 0.05);

        if (stage === 'loose') {
            // Ingen brems: hjulet og viseren raser av gårde.
            free.current += 7 * d;
            wheelRot.current = free.current;
            handRot.current = -free.current * 0.6;
            drop.current = Math.min(3.4, drop.current + 1.6 * d);
            if (pend.current) pend.current.rotation.z = damp(pend.current.rotation.z, 0, d, 4);
            if (anchor.current) anchor.current.rotation.z = damp(anchor.current.rotation.z, 0.5, d, 4);
        } else if (running) {
            const fullPeriod = 2 * Math.sqrt(pendLen);
            phase.current += d / fullPeriod;
            const ang = 0.45 * Math.sin(phase.current * Math.PI * 2);
            if (pend.current) pend.current.rotation.z = ang;
            // Gangen vipper i takt med pendelen.
            if (anchor.current) anchor.current.rotation.z = ang * 0.32;
            // Ett tikk per halvsving.
            const t = Math.floor(phase.current * 2);
            if (t !== tick.current) tick.current = t;
            const wheelTarget = tick.current * STEP;
            wheelRot.current = damp(wheelRot.current, wheelTarget, d, 14);
            handRot.current = damp(handRot.current, -tick.current * 0.11, d, 9);
            drop.current = Math.min(3.4, drop.current + 0.06 * d);
        }

        if (wheel.current) wheel.current.rotation.z = wheelRot.current;
        if (hand.current) hand.current.rotation.z = handRot.current;
        if (weight.current) weight.current.position.y = 4.1 - drop.current;
    });

    return (
        <group>
            <Floor />
            <Frame />
            <Drum />

            {/* Loddet: dras på plass i weight-fasen, henger etterpå. */}
            {stage === 'weight' ? (
                <>
                    <GhostSpot pos={DRUM_DROP} />
                    <Draggable
                        position={[-1, 0, 3.6]}
                        planeY={0}
                        bounds={{ minX: -5, maxX: 4, minZ: -1, maxZ: 4 }}
                        onDrop={onPlaceWeight}
                        liftY={0.4}
                    >
                        <mesh position={[0, 0.9, 0]}>
                            <boxGeometry args={[1.8, 2, 1.8]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <WeightBlock />
                    </Draggable>
                </>
            ) : (
                <group ref={weight} position={[DRUM_DROP[0], 4.1, 0]}>
                    {/* tau fra trommelen ned til loddet */}
                    <mesh position={[0, 1.4, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, 2.8, 6]} />
                        <meshStandardMaterial color="#3a2c1c" roughness={1} />
                    </mesh>
                    <WeightBlock />
                </group>
            )}

            {/* Det store escape-hjulet i midten. */}
            <group ref={wheel} position={[0, 0.6, 0]}>
                <EscapeWheel />
            </group>

            {/* Gangen (anchor): dras inn i loose-fasen, vipper etterpå. */}
            {stage === 'loose' ? (
                <>
                    <GhostSpot pos={GANG_DROP} tall />
                    <Draggable
                        position={[2.6, 0, 3.6]}
                        planeY={0}
                        bounds={{ minX: -4, maxX: 5, minZ: -1, maxZ: 4 }}
                        onDrop={onPlaceGang}
                        liftY={0.4}
                    >
                        <mesh position={[0, 0.6, 0]}>
                            <boxGeometry args={[2.2, 1.6, 1.6]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <AnchorPiece />
                    </Draggable>
                </>
            ) : gangIn ? (
                <group ref={anchor} position={[0, 2.15, 0]} rotation={[0, 0, 0.32]}>
                    <AnchorPiece mounted />
                </group>
            ) : null}

            {/* Pendelen henger over verket og holder takten. */}
            {gangIn && (
                <group position={[0, 4.4, 0.35]}>
                    <group ref={pend}>
                        <Pendulum len={pendLen} />
                    </group>
                </group>
            )}

            {/* Urskiva med viser til høyre. */}
            <group position={[3.4, 2.4, 0.3]}>
                <ClockFace />
                <group ref={hand} position={[0, 0, 0.18]}>
                    <Hand />
                </group>
            </group>

            <Burst position={[0, 3, 0.5]} trigger={burst} color="#f4d06a" count={26} spread={3} />
        </group>
    );
}

// --- Prosedyrale deler ---

function Floor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[40, 40]} />
            <meshStandardMaterial color="#cdbb98" roughness={1} />
        </mesh>
    );
}

// Treramme som bærer verket - som innsiden av et tårn-urverk.
function Frame() {
    return (
        <group>
            {/* bakplate */}
            <mesh position={[0, 2.6, -0.6]} receiveShadow>
                <boxGeometry args={[8.4, 6, 0.3]} />
                <meshStandardMaterial color={WOOD_DARK} roughness={0.95} />
            </mesh>
            {/* loddrette stolper */}
            {[-3.9, 3.9].map((x) => (
                <mesh key={x} position={[x, 2.6, -0.2]} castShadow>
                    <boxGeometry args={[0.5, 6, 0.5]} />
                    <meshStandardMaterial color={WOOD} roughness={0.9} />
                </mesh>
            ))}
            {/* topp- og bunnbjelke */}
            {[5.4, 0].map((y) => (
                <mesh key={y} position={[0, y, -0.2]} castShadow>
                    <boxGeometry args={[8, 0.5, 0.5]} />
                    <meshStandardMaterial color={WOOD} roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

// Trommelen som tauet er kveilet rundt.
function Drum() {
    return (
        <group position={[-3.2, 4.1, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.5, 0.5, 1, 18]} />
                <meshStandardMaterial color={BRASS_DARK} metalness={0.5} roughness={0.5} />
            </mesh>
        </group>
    );
}

// Tungt blylodd.
function WeightBlock() {
    return (
        <group>
            <mesh position={[0, 0.7, 0]} castShadow>
                <cylinderGeometry args={[0.42, 0.5, 1.4, 14]} />
                <meshStandardMaterial color="#5c6066" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* krok på toppen */}
            <mesh position={[0, 1.5, 0]}>
                <torusGeometry args={[0.16, 0.05, 8, 16]} />
                <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.4} />
            </mesh>
        </group>
    );
}

// Escape-hjul: en messingplate med skrå tenner langs kanten.
function EscapeWheel() {
    const teeth = Array.from({ length: TEETH }, (_, i) => i);
    const r = 1.1;
    return (
        <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[r * 0.78, r * 0.78, 0.16, 28]} />
                <meshStandardMaterial color={BRASS} metalness={0.55} roughness={0.4} />
            </mesh>
            {/* nav */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.22, 12]} />
                <meshStandardMaterial color={BRASS_DARK} metalness={0.6} roughness={0.4} />
            </mesh>
            {teeth.map((i) => {
                const a = (i / TEETH) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        position={[Math.cos(a) * r, Math.sin(a) * r, 0]}
                        rotation={[0, 0, a - Math.PI / 2.4]}
                        castShadow
                    >
                        <boxGeometry args={[0.16, 0.42, 0.14]} />
                        <meshStandardMaterial color={BRASS} metalness={0.55} roughness={0.4} />
                    </mesh>
                );
            })}
        </group>
    );
}

// Gangen / anchor: en T-formet vippe med to klauer som griper tennene.
function AnchorPiece({ mounted = false }: { mounted?: boolean }) {
    return (
        <group>
            {/* tverrbjelke */}
            <mesh position={[0, mounted ? 0 : 0.5, 0]} castShadow>
                <boxGeometry args={[1.9, 0.22, 0.22]} />
                <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.45} />
            </mesh>
            {/* to klauer ned mot hjulet */}
            {[-0.85, 0.85].map((x) => (
                <mesh key={x} position={[x, mounted ? -0.45 : 0.05, 0]} castShadow>
                    <boxGeometry args={[0.24, 0.7, 0.24]} />
                    <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.45} />
                </mesh>
            ))}
            {/* dreiepunkt */}
            <mesh position={[0, mounted ? 0.18 : 0.7, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.4, 10]} />
                <meshStandardMaterial color={BRASS_DARK} metalness={0.6} roughness={0.4} />
            </mesh>
        </group>
    );
}

// Pendel: stang med justerbar lengde og en tung lodd-skive nederst.
function Pendulum({ len }: { len: number }) {
    const rodLen = 1.4 + len * 0.55;
    return (
        <group>
            <mesh position={[0, -rodLen / 2, 0]} castShadow>
                <boxGeometry args={[0.1, rodLen, 0.1]} />
                <meshStandardMaterial color={STEEL} metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[0, -rodLen, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.45, 0.14, 20]} />
                <meshStandardMaterial color={BRASS} metalness={0.6} roughness={0.35} />
            </mesh>
            {/* opphengs-nav */}
            <mesh>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshStandardMaterial color={BRASS_DARK} metalness={0.6} roughness={0.4} />
            </mesh>
        </group>
    );
}

// Urskive med tall-markeringer.
function ClockFace() {
    const ticks = Array.from({ length: 12 }, (_, i) => i);
    return (
        <group>
            <mesh castShadow>
                <cylinderGeometry args={[1.4, 1.4, 0.18, 36]} />
                <meshStandardMaterial color={FACE} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0, 0.1]}>
                <cylinderGeometry args={[1.42, 1.42, 0.06, 36]} />
                <meshStandardMaterial color={BRASS_DARK} metalness={0.5} roughness={0.4} />
            </mesh>
            {ticks.map((i) => {
                const a = (i / 12) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        position={[Math.sin(a) * 1.12, Math.cos(a) * 1.12, 0.12]}
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <boxGeometry args={[0.07, 0.12, 0.24]} />
                        <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
                    </mesh>
                );
            })}
        </group>
    );
}

// Enkel viser.
function Hand() {
    return (
        <group>
            <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[0.1, 1.1, 0.06]} />
                <meshStandardMaterial color="#2a2018" roughness={0.6} />
            </mesh>
            <mesh>
                <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} />
                <meshStandardMaterial color={BRASS_DARK} metalness={0.6} roughness={0.4} />
            </mesh>
        </group>
    );
}

// Pulserende målmarkør på bakken.
function GhostSpot({ pos, tall = false }: { pos: [number, number]; tall?: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const m = ref.current.material as THREE.MeshStandardMaterial;
        m.opacity = 0.22 + Math.sin(clock.getElapsedTime() * 3) * 0.12;
    });
    return (
        <mesh ref={ref} position={[pos[0], 0.05, pos[1]]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[tall ? 1.4 : 1.2, 24]} />
            <meshStandardMaterial color="#d8a838" transparent opacity={0.28} depthWrite={false} />
        </mesh>
    );
}

export default Gangen3D;
