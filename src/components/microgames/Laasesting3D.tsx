import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    SceneSlider,
    StepTracker,
    DataReadout,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om symaskinen. Eleven oppdager låsestinget på
// kroppen: en symaskin syr IKKE ved å dra en lang tråd gjennom stoffet slik
// hånda gjør. Den bruker TO tråder. Nåla fører den blå overtråden ned
// gjennom stoffet, en krok under bordet fanger sløyfa og fører den rundt den
// oransje undertråden på spolen, og når nåla løfter seg låses de to
// trådene fast inni stoffet. Lyspæra: derfor kan maskinen sy hundrevis av
// sting i minuttet uten at tråden floker seg eller ryker.
//
// Mekanikk: først drar eleven spolen med undertråden på plass under bordet
// (Draggable). Så er svinghjulet en SceneSlider eleven vugger fram og tilbake -
// hvert fulle drag plunger nåla en gang og syr ett låsesting, og sammen vokser
// det en søm der blått ligger på toppen og oransje under.

// Farger
const BLUE = '#2563eb'; // overtråd (går gjennom nåla, ligger på toppen)
const ORANGE = '#ea7317'; // undertråd (på spolen, ligger under stoffet)
const FABRIC_TOP = '#e8d5b5';
const FABRIC_BOT = '#d3bd97';
const IRON = '#26262c';
const STEEL = '#9aa0a6';
const GOLD = '#c9a227';
const WOOD = '#9c6b3e';

// Nåla-høyder: tipp like over stoffet (oppe) -> under bordet ved spolen (nede).
const NDL_UP = 0.6;
const NDL_DOWN = -0.66;

const STITCH_GAP = 0.45; // avstand mellom sting i sømmen
const TARGET_STITCHES = 5;

type Stage = 'thread' | 'sew' | 'won';

// Mål for spolen når den dras på plass (over maskinhalsen, der den faller ned
// i griperommet under bordet).
const SPOOL_TARGET: [number, number] = [0, 1.15];

const Laasesting3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState<Stage>('thread');
    const [cycle, setCycle] = useState(0); // 0-100, svinghjulet
    const [stitches, setStitches] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Maskinen har bare overtråden. Dra spolen med den oransje undertråden på plass under stoffet.'
    );
    const [burst, setBurst] = useState(0);

    // Hvilken ende svinghjulet sist var ved. Et sting teller hver gang hjulet
    // føres helt fra den ene enden til den andre (fram ELLER tilbake).
    const lastEnd = useRef<'lo' | 'hi'>('lo');

    const reset = () => {
        setStage('thread');
        setCycle(0);
        setStitches(0);
        setBanner(
            'Maskinen har bare overtråden. Dra spolen med den oransje undertråden på plass under stoffet.'
        );
        lastEnd.current = 'lo';
    };

    // Ett fullført hjulslag = ett låsesting.
    const sewStitch = () => {
        setStitches((n) => {
            const next = n + 1;
            setBurst((b) => b + 1);
            if (next >= TARGET_STITCHES) {
                sounds.play('complete');
                setStage('won');
                setBanner(null);
                setTimeout(() => onComplete({ score: 1, completed: true }), 250);
            } else {
                sounds.play('correct');
                if (next === 1) {
                    setBanner(
                        'Se godt etter: blått ligger på toppen, oransje under. De to trådene låser hverandre inni stoffet.'
                    );
                }
            }
            return next;
        });
    };

    // Svinghjulet styrer nåla i sanntid. Et sting teller når hjulet når en ny
    // ende (lo->hi eller hi->lo), så eleven vugger det fram og tilbake.
    const turnWheel = (v: number) => {
        setCycle(v);
        if (stage !== 'sew') return;
        if (v >= 98 && lastEnd.current !== 'hi') {
            lastEnd.current = 'hi';
            sewStitch();
        } else if (v <= 2 && lastEnd.current !== 'lo') {
            lastEnd.current = 'lo';
            sewStitch();
        }
    };

    const installSpool = (pos: THREE.Vector3) => {
        const dist = Math.hypot(pos.x - SPOOL_TARGET[0], pos.z - SPOOL_TARGET[1]);
        if (dist < 1.4) {
            sounds.play('advance');
            setBurst((b) => b + 1);
            setStage('sew');
            setBanner('Nå har maskinen to tråder. Vugg svinghjulet fram og tilbake for å sy.');
        } else {
            setBanner('Dra den oransje spolen helt inn over maskinhalsen, der griperingen er.');
        }
    };

    const idle = stage === 'sew' && stitches === 0 && cycle === 0;

    return (
        <MicroGameScaffold
            title="Laasesting: maskinen med to tråder"
            subtitle="Tre maskinen og sy en søm - og oppdag hvorfor symaskinen bruker to tråder"
            estimatedSeconds={120}
            onRetry={stage !== 'thread' || cycle > 0 ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#efe2cc] via-[#ecdcc0] to-[#d9c39c]"
            canvas={{
                idle: false,
                camera: { position: [5.6, 4.2, 7.2], fov: 42 },
                background: '#efe2cc',
                fog: { near: 26, far: 52 },
                target: [0, 0.2, 0],
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Symaskin 1846</SceneBadge>
                    {stage !== 'thread' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Sting sydd', value: stitches, unit: `/${TARGET_STITCHES}` },
                                { label: 'Overtråd', value: 'blå' },
                                { label: 'Undertråd', value: 'oransje' },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Vugg svinghjulet fram og tilbake
                    </DragHint>
                </>
            }
            scene={
                <SewingScene
                    cyc={cycle / 100}
                    stage={stage}
                    stitches={stitches}
                    burst={burst}
                    onInstall={installSpool}
                />
            }
        >
            {stage === 'thread' && (
                <div className="flex flex-col gap-2.5">
                    <p className="text-sm text-slate-600">
                        En maskin kan ikke dra en hel, lang tråd gjennom stoffet for hvert sting
                        slik hånda gjør - da floker tråden seg eller ryker. Løsningen er to
                        tråder. Dra den oransje spolen på plass under stoffet før du syr.
                    </p>
                    <SceneFact>
                        Klikk og dra den oransje spolen nede til høyre helt inn over maskinhalsen,
                        der griperingen sitter.
                    </SceneFact>
                </div>
            )}

            {stage === 'sew' && (
                <div className="flex flex-col gap-3">
                    <SceneSlider
                        label="Svinghjulet: vugg fram og tilbake for å sy"
                        min={0}
                        max={100}
                        step={1}
                        value={cycle}
                        onChange={turnWheel}
                        valueLabel={(v) =>
                            v > 65
                                ? 'Nåla løfter - stinget låses'
                                : v > 35
                                  ? 'Nåla nede - kroken fanger sløyfa'
                                  : 'Nåla oppe'
                        }
                    />
                    <StepTracker current={stitches} total={TARGET_STITCHES} />
                    <SceneFact>
                        Nåla fører den blå overtråden ned gjennom stoffet. Under bordet svinger
                        en krok rundt og fanger den lille sløyfa, og fører den rundt den oransje
                        undertråden på spolen. Når nåla løfter seg, strammes alt til et
                        låsesting. Slik kan maskinen sy hundrevis av sting i minuttet.
                    </SceneFact>
                </div>
            )}

            {stage === 'won' && (
                <WinScreen title="Sømmen er ferdig!" onReplay={reset}>
                    Du sydde en hel søm med låsesting. To tråder, en på toppen og en under,
                    hekter seg fast i hverandre inni stoffet. Det var dette trikset som gjorde
                    symaskinen mulig - og som gjorde klær billige nok til at vanlige folk kunne eie
                    mer enn noen få plagg. Symaskiner virker fortsatt på akkurat denne måten i
                    dag.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function SewingScene({
    cyc,
    stage,
    stitches,
    burst,
    onInstall,
}: {
    cyc: number;
    stage: Stage;
    stitches: number;
    burst: number;
    onInstall: (pos: THREE.Vector3) => void;
}) {
    // Nåla: oppe ved c=0 og c=1, helt nede ved c=0.5.
    const dip = Math.sin(Math.PI * cyc);
    const needleTipY = NDL_UP - (NDL_UP - NDL_DOWN) * dip;
    // Sløyfa under stoffet: dukker opp når nåla er nede og løfter seg igjen.
    const loopAmount = stage === 'sew' ? Math.max(0, dip - 0.45) / 0.55 : 0;
    // Kroken under bordet svinger en runde med hjulet.
    const hookAngle = cyc * Math.PI * 2;

    const installed = stage === 'sew' || stage === 'won';

    return (
        <group>
            {/* Bordplate med åpen front, så eleven ser mekanikken under */}
            <Table />

            {/* Stoffet: to lag som sys sammen */}
            <Fabric />

            {/* Den ferdige sømmen som vokser */}
            <Seam count={stitches} />

            {/* Selve symaskinen: søyle, arm, hode */}
            <MachineBody />

            {/* Spole med blå overtråd på toppen */}
            <ThreadSpool position={[0.75, 3.05, -0.7]} color={BLUE} />

            {/* Nålstangen som beveger seg opp og ned */}
            <Needle tipY={needleTipY} />

            {/* Trykkfoten holder stoffet nede ved nåla */}
            <PresserFoot />

            {/* Under bordet: griper, spole og sløyfe */}
            {installed && (
                <UnderBed hookAngle={hookAngle} loopAmount={loopAmount} cyc={cyc} />
            )}

            {/* Spolen som dras på plass i tre-fasen */}
            {stage === 'thread' && (
                <>
                    <GhostTarget />
                    <Draggable
                        position={[2.6, 0, 2.3]}
                        planeY={0.18}
                        bounds={{ minX: -1.5, maxX: 3, minZ: -0.5, maxZ: 2.6 }}
                        onDrop={onInstall}
                        liftY={0.4}
                    >
                        {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                        <mesh position={[0, 0.1, 0]}>
                            <boxGeometry args={[1.4, 1.2, 1.4]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <Bobbin />
                    </Draggable>
                </>
            )}

            <Burst position={[0, 1.4, 0]} trigger={burst} color="#fde68a" count={22} spread={2.4} />
        </group>
    );
}

// Bordplate: en tynn topp båret av en bakvegg, slik at fronten står åpen og
// vi ser griperommet under.
function Table() {
    return (
        <group>
            <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
                <boxGeometry args={[9, 0.12, 3.2]} />
                <meshStandardMaterial color={WOOD} roughness={0.85} />
            </mesh>
            {/* bakvegg/sokkel */}
            <mesh position={[0, -1, -1.4]} castShadow>
                <boxGeometry args={[9, 2, 0.3]} />
                <meshStandardMaterial color="#7d552f" roughness={0.9} />
            </mesh>
            {/* throat-plate i stål rundt nåla */}
            <mesh position={[0, 0.01, 0]}>
                <boxGeometry args={[1.3, 0.06, 1.1]} />
                <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.4} />
            </mesh>
        </group>
    );
}

// To stofflag som ligger på bordet og skal sys sammen.
function Fabric() {
    return (
        <group>
            <mesh position={[-0.3, 0.07, 0]} castShadow receiveShadow>
                <boxGeometry args={[5.2, 0.05, 1.7]} />
                <meshStandardMaterial color={FABRIC_BOT} roughness={1} />
            </mesh>
            <mesh position={[-0.3, 0.12, 0]} castShadow receiveShadow>
                <boxGeometry args={[5.2, 0.05, 1.7]} />
                <meshStandardMaterial color={FABRIC_TOP} roughness={1} />
            </mesh>
        </group>
    );
}

// Sømmen som vokser: hvert sting viser blått på toppen, oransje under, og en
// liten knute der de møtes inni stoffet. Nyeste sting ligger rett under nåla.
function Seam({ count }: { count: number }) {
    const items = [];
    for (let i = 0; i < count; i++) {
        const x = -((count - 1 - i) * STITCH_GAP);
        items.push(
            <group key={i} position={[x, 0, 0]}>
                {/* blå overtråd - synlig dash på toppen */}
                <mesh position={[0, 0.15, 0]}>
                    <boxGeometry args={[0.13, 0.04, 0.3]} />
                    <meshStandardMaterial color={BLUE} roughness={0.6} />
                </mesh>
                {/* blått ned til midten av stoffet */}
                <mesh position={[0, 0.11, 0.12]}>
                    <boxGeometry args={[0.05, 0.07, 0.05]} />
                    <meshStandardMaterial color={BLUE} roughness={0.6} />
                </mesh>
                {/* oransje undertråd - opp til midten */}
                <mesh position={[0, 0.06, 0.12]}>
                    <boxGeometry args={[0.05, 0.06, 0.05]} />
                    <meshStandardMaterial color={ORANGE} roughness={0.6} />
                </mesh>
                {/* knuten der trådene låser - midt i stoffet */}
                <mesh position={[0, 0.09, 0.12]}>
                    <sphereGeometry args={[0.05, 10, 10]} />
                    <meshStandardMaterial color={ORANGE} roughness={0.5} />
                </mesh>
                {/* oransje dash på undersiden */}
                <mesh position={[0, 0.02, 0]}>
                    <boxGeometry args={[0.13, 0.03, 0.3]} />
                    <meshStandardMaterial color={ORANGE} roughness={0.6} />
                </mesh>
            </group>
        );
    }
    return <group>{items}</group>;
}

// Symaskinens kropp i svart støpejern: søyle bak til høyre, arm over, hode med
// nålstang foran. Et gulltrykk gir den et 1800-tallspreg.
function MachineBody() {
    return (
        <group>
            {/* søyle */}
            <mesh position={[2.5, 1.45, -0.95]} castShadow receiveShadow>
                <boxGeometry args={[1, 2.9, 1]} />
                <meshStandardMaterial color={IRON} roughness={0.5} metalness={0.3} />
            </mesh>
            {/* overarm */}
            <mesh position={[1.1, 2.75, -0.95]} castShadow>
                <boxGeometry args={[3.8, 0.6, 0.6]} />
                <meshStandardMaterial color={IRON} roughness={0.5} metalness={0.3} />
            </mesh>
            {/* hode foran, bøyer seg fram til nåla */}
            <mesh position={[0, 2.5, -0.45]} castShadow>
                <boxGeometry args={[0.9, 1.3, 1.1]} />
                <meshStandardMaterial color={IRON} roughness={0.5} metalness={0.3} />
            </mesh>
            {/* gulltrykk på armen */}
            <mesh position={[1.1, 2.75, -0.64]}>
                <boxGeometry args={[2.6, 0.16, 0.02]} />
                <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.4} />
            </mesh>
            {/* svinghjul på enden av søyla */}
            <mesh position={[3.05, 2.4, -0.95]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.55, 0.55, 0.18, 24]} />
                <meshStandardMaterial color="#1c1c22" metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[3.15, 2.4, -0.95]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.16, 0.16, 0.1, 16]} />
                <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.4} />
            </mesh>
        </group>
    );
}

// Spole med tråd på toppen av maskinen.
function ThreadSpool({
    position,
    color,
}: {
    position: [number, number, number];
    color: string;
}) {
    return (
        <group position={position}>
            <mesh castShadow>
                <cylinderGeometry args={[0.16, 0.16, 0.5, 16]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
                <meshStandardMaterial color="#d9c7a8" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.28, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
                <meshStandardMaterial color="#d9c7a8" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Nålstangen med nåla. tipY er høyden på nålspissen.
function Needle({ tipY }: { tipY: number }) {
    // nåla er 1.0 lang, spissen nederst.
    const midY = tipY + 0.5;
    return (
        <group position={[0, 0, 0]}>
            {/* nålstang ned fra hodet */}
            <mesh position={[0, midY + 0.9, 0]} castShadow>
                <boxGeometry args={[0.12, 0.9, 0.12]} />
                <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.4} />
            </mesh>
            {/* selve nåla */}
            <mesh position={[0, midY, 0]}>
                <cylinderGeometry args={[0.025, 0.045, 1, 10]} />
                <meshStandardMaterial color="#d7dade" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* blå tråd gjennom nåløyet (liten markør) */}
            <mesh position={[0, tipY + 0.12, 0.05]}>
                <boxGeometry args={[0.03, 0.2, 0.03]} />
                <meshStandardMaterial color={BLUE} roughness={0.6} />
            </mesh>
        </group>
    );
}

// Trykkfoten som holder stoffet ned ved nåla.
function PresserFoot() {
    return (
        <group position={[0, 0.2, 0]}>
            <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[0.18, 0.5, 0.12]} />
                <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.02, 0]}>
                <boxGeometry args={[0.34, 0.06, 0.5]} />
                <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.4} />
            </mesh>
        </group>
    );
}

// Mekanikken under bordet: spolen med oransje undertråd, griperingen som
// svinger rundt, og den blå sløyfa nåla lager.
function UnderBed({
    hookAngle,
    loopAmount,
    cyc,
}: {
    hookAngle: number;
    loopAmount: number;
    cyc: number;
}) {
    const loopY = -0.42 - loopAmount * 0.12;
    const loopScale = 0.4 + loopAmount * 0.8;
    return (
        <group position={[0, 0, 0]}>
            {/* spolehus */}
            <mesh position={[0, -0.9, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.34, 0.34, 0.22, 20]} />
                <meshStandardMaterial color="#3a3a42" metalness={0.4} roughness={0.5} />
            </mesh>
            {/* spolen med oransje tråd */}
            <Bobbin position={[0, -0.9, 0.22]} />
            {/* griperingen som svinger rundt og fanger sløyfa */}
            <group position={[0, -0.9, 0.16]} rotation={[0, 0, hookAngle]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.4, 0.04, 8, 28, Math.PI * 1.5]} />
                    <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.35} />
                </mesh>
                {/* krokspissen */}
                <mesh position={[0.4, 0, 0]} rotation={[0, 0, -0.5]}>
                    <coneGeometry args={[0.05, 0.18, 8]} />
                    <meshStandardMaterial color="#cfd3d8" metalness={0.8} roughness={0.3} />
                </mesh>
            </group>
            {/* den blå sløyfa nåla lager - vises når loopAmount > 0 */}
            {loopAmount > 0.02 && (
                <mesh position={[0, loopY, 0.05]} scale={loopScale}>
                    <torusGeometry args={[0.14, 0.03, 8, 18]} />
                    <meshStandardMaterial color={BLUE} roughness={0.6} />
                </mesh>
            )}
            {/* oransje undertråd opp mot stoffet ved aktivt punkt */}
            <mesh position={[0, -0.5, 0.1]}>
                <boxGeometry args={[0.03, 0.7 - cyc * 0.2, 0.03]} />
                <meshStandardMaterial color={ORANGE} roughness={0.6} />
            </mesh>
        </group>
    );
}

// Spolen med oransje tråd (brukes både i draget og under bordet).
function Bobbin({ position }: { position?: [number, number, number] }) {
    return (
        <group position={position ?? [0, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.22, 0.22, 0.14, 18]} />
                <meshStandardMaterial color={ORANGE} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.26, 0.26, 0.03, 18]} />
                <meshStandardMaterial color="#caa06a" metalness={0.3} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.26, 0.26, 0.03, 18]} />
                <meshStandardMaterial color="#caa06a" metalness={0.3} roughness={0.6} />
            </mesh>
        </group>
    );
}

// Lysende målmarkør der spolen skal slippes.
function GhostTarget() {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const m = ref.current.material as THREE.MeshStandardMaterial;
        m.opacity = 0.25 + Math.sin(clock.getElapsedTime() * 3) * 0.14;
    });
    return (
        <mesh
            ref={ref}
            position={[SPOOL_TARGET[0], 0.2, SPOOL_TARGET[1]]}
            rotation={[Math.PI / 2, 0, 0]}
        >
            <torusGeometry args={[0.4, 0.06, 10, 24]} />
            <meshStandardMaterial color="#f2b56a" transparent opacity={0.3} depthWrite={false} />
        </mesh>
    );
}

export default Laasesting3D;
