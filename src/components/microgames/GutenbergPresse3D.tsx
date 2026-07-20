import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Printer } from 'lucide-react';
import {
    MicroGameScaffold,
    Interactive,
    GroundPlane,
    Figure,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    SceneSlider,
    StepTracker,
    DataReadout,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Gutenbergs presse. Eleven kjenner kjerneideen fra artikkelen på
// kroppen: de løse typene settes EN gang, og deretter kan samme side svertes og
// trykkes igjen og igjen, lynraskt. Mens munken i hjørnet fortsatt sliter med
// sin første håndkopierte side, vokser pressens bunke til mange sider.
//   1) Sett typene  - klikk metalbokstavene i rett rekkefølge inn i setterammen
//   2) Sverte typene - klikk de to svarte sverteballene
//   3) Trekk pressen - dra spaken ned så platen presser papiret mot typene
//   4) Masseproduser - trykk side etter side og se bunken vokse

type Phase = 'compose' | 'ink' | 'press' | 'mass' | 'done';

const WORD = 'BIBEL';
const TARGET_PAGES = 6;

// Løse typer i stokket rekkefølge på settebordet. Fast (ingen RNG) - hver
// brikke har egen id slik at de to B-ene kan skilles fra hverandre.
const TILES: { id: number; ch: string; pos: [number, number, number] }[] = [
    { id: 0, ch: 'L', pos: [-5.3, 1.05, 1.7] },
    { id: 1, ch: 'I', pos: [-4.5, 1.05, 2.35] },
    { id: 2, ch: 'B', pos: [-3.75, 1.05, 1.65] },
    { id: 3, ch: 'E', pos: [-3.0, 1.05, 2.3] },
    { id: 4, ch: 'B', pos: [-4.2, 1.05, 1.2] },
];

// Plass i setterammen for hver bokstav i ordet (langs x, på pressens bed).
function slotX(i: number) {
    return -0.8 + i * 0.4;
}

const GutenbergPresse3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('compose');
    const [placedIds, setPlacedIds] = useState<number[]>([]);
    const [inkDabs, setInkDabs] = useState(0);
    const [pull, setPull] = useState(0); // 0-100 spak-verdi (første trykk)
    const [pages, setPages] = useState(0);
    const [massPressing, setMassPressing] = useState(false);
    const [banner, setBanner] = useState<string | null>(
        'Sett de løse typene: klikk metalbokstavene i rett rekkefølge.'
    );
    const [burst, setBurst] = useState(0);

    const placedCount = placedIds.length;
    const expectedChar = phase === 'compose' ? WORD[placedCount] : null;
    const inked = inkDabs >= 2;

    const reset = () => {
        setPhase('compose');
        setPlacedIds([]);
        setInkDabs(0);
        setPull(0);
        setPages(0);
        setMassPressing(false);
        setBanner('Sett de løse typene: klikk metalbokstavene i rett rekkefølge.');
    };

    // Klikk en bokstavbrikke. Bare den som matcher neste bokstav teller.
    const pickTile = (id: number, ch: string) => {
        if (phase !== 'compose') return;
        if (ch !== expectedChar) {
            sounds.play('incorrect');
            setBanner('Sett bokstavene i rekkefølge: B - I - B - E - L.');
            return;
        }
        const next = [...placedIds, id];
        setPlacedIds(next);
        if (next.length >= WORD.length) {
            sounds.play('advance');
            setPhase('ink');
            setBanner('Typene står i rammen. Klikk sverteballene for å farge dem.');
        } else {
            sounds.play('pick');
        }
    };

    const dab = () => {
        if (phase !== 'ink') return;
        const next = inkDabs + 1;
        setInkDabs(next);
        if (next >= 2) {
            sounds.play('advance');
            setPhase('press');
            setBanner('Legg papiret på og dra spaken ned for å trykke første side.');
        } else {
            sounds.play('correct');
        }
    };

    const onPull = (v: number) => {
        if (phase !== 'press') return;
        setPull(v);
        if (v >= 98) {
            sounds.play('sceneChange');
            setPages(1);
            setBurst((b) => b + 1);
            setPull(0);
            setPhase('mass');
            setBanner('Første side er trykt! Typene står fortsatt. Trykk en side til.');
        }
    };

    // Masseproduksjon: hvert trykk gir en ny side, lynraskt - typene er allerede satt.
    const printAgain = () => {
        if (phase !== 'mass' || massPressing) return;
        const next = pages + 1;
        setMassPressing(true);
        setPages(next);
        sounds.play('drop');
        setBurst((b) => b + 1);
        window.setTimeout(() => setMassPressing(false), 260);
        if (next >= TARGET_PAGES) {
            sounds.play('complete');
            setPhase('done');
            setBanner(null);
            window.setTimeout(() => onComplete({ score: 1, completed: true }), 300);
        }
    };

    // Hvor langt platen presses ned (0 = oppe, 1 = nede mot typene).
    const pressAmount =
        phase === 'press'
            ? pull / 100
            : phase === 'mass' || phase === 'done'
            ? massPressing
                ? 1
                : 0
            : 0;

    const idle = phase === 'compose' && placedCount === 0;

    return (
        <MicroGameScaffold
            title="Gutenbergs presse"
            subtitle="Sett typene en gang, og trykk den samme siden igjen og igjen"
            estimatedSeconds={150}
            onRetry={phase !== 'compose' || placedCount > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0.5, 6.5, 12], fov: 42 },
                background: '#e7d6b6',
                target: [0, 1.6, 0.4],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Mainz, ca. 1450</SceneBadge>
                    {(phase === 'press' || phase === 'mass' || phase === 'done') && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Pressen', value: pages, unit: 'sider' },
                                { label: 'Munken', value: 1, unit: 'side' },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Klikk bokstaven B for å begynne
                    </DragHint>
                </>
            }
            scene={
                <Workshop
                    phase={phase}
                    placedCount={placedCount}
                    placedIds={placedIds}
                    expectedChar={expectedChar}
                    inked={inked}
                    inkDabs={inkDabs}
                    pressAmount={pressAmount}
                    pages={pages}
                    burst={burst}
                    onPickTile={pickTile}
                    onDab={dab}
                />
            }
        >
            {phase === 'compose' && (
                <div className="flex flex-col gap-2.5">
                    <StepTracker current={placedCount} total={WORD.length} />
                    <p className="text-sm text-slate-600">
                        Gutenberg laget bokstavene som løse metalbiter. Klikk dem i rett
                        rekkefølge og bygg ordet i rammen: B - I - B - E - L.
                    </p>
                </div>
            )}

            {phase === 'ink' && (
                <div className="flex flex-col gap-2.5">
                    <StepTracker current={inkDabs} total={2} />
                    <p className="text-sm text-slate-600">
                        Klikk de to svarte sverteballene for å rulle oljebasert trykksverte utover
                        typene.
                    </p>
                </div>
            )}

            {phase === 'press' && (
                <div className="flex flex-col gap-2.5">
                    <SceneSlider
                        label="Trekk pressen ned"
                        min={0}
                        max={100}
                        value={pull}
                        onChange={onPull}
                        valueLabel={(v) => (v >= 98 ? 'Trykk!' : `${Math.round(v)} %`)}
                    />
                    <p className="text-sm text-slate-600">
                        Den store treskruen presser platen mot papiret. Dra spaken helt ut for å
                        trykke den første siden.
                    </p>
                </div>
            )}

            {(phase === 'mass' || phase === 'done') && (
                <div className="flex flex-col gap-3">
                    {phase === 'mass' ? (
                        <>
                            <button
                                onClick={printAgain}
                                disabled={massPressing}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition disabled:opacity-60"
                            >
                                <Printer className="w-4 h-4" />
                                Trykk en side til ({pages} av {TARGET_PAGES})
                            </button>
                            <SceneFact>
                                Typene står fortsatt i rammen. Mens munken bruker et helt år på
                                en bibel, spytter pressen ut side etter side - samme tekst, helt
                                lik, gang på gang.
                            </SceneFact>
                        </>
                    ) : (
                        <WinScreen title="Pressen ruller!" onReplay={reset}>
                            Du satte typene en eneste gang, og kunne så trykke den samme siden om
                            og om igjen. Det som tok en munk et helt år, klarte pressen på
                            minutter. Bøker ble billige, og innen år 1500 fantes det over 20
                            millioner av dem i Europa. Nå kunne ingen konge eller kirke stoppe en
                            idé som var trykt i tusen eksemplarer.
                        </WinScreen>
                    )}
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN: trykkeverkstedet
// ============================================================

function Workshop({
    phase,
    placedCount,
    placedIds,
    expectedChar,
    inked,
    inkDabs,
    pressAmount,
    pages,
    burst,
    onPickTile,
    onDab,
}: {
    phase: Phase;
    placedCount: number;
    placedIds: number[];
    expectedChar: string | null;
    inked: boolean;
    inkDabs: number;
    pressAmount: number;
    pages: number;
    burst: number;
    onPickTile: (id: number, ch: string) => void;
    onDab: () => void;
}) {
    return (
        <group>
            <GroundPlane size={34} depth={26} color="#7a5a38" />

            {/* Selve pressen i sentrum */}
            <Press
                pressAmount={pressAmount}
                placedCount={placedCount}
                inked={inked}
                burst={burst}
            />

            {/* Settebordet med løse typer til venstre */}
            <Table position={[-4.1, 0, 1.8]} width={3.4} depth={2} />
            {phase === 'compose' &&
                TILES.filter((t) => !placedIds.includes(t.id)).map((t) => (
                    <LetterTile
                        key={t.id}
                        position={t.pos}
                        ch={t.ch}
                        glow={t.ch === expectedChar}
                        onSelect={() => onPickTile(t.id, t.ch)}
                    />
                ))}

            {/* Sverteballer ved pressens bed */}
            {phase === 'ink' && (
                <>
                    <InkBall position={[-1.5, 1.25, 1.9]} used={inkDabs >= 1} onSelect={onDab} />
                    <InkBall position={[1.5, 1.25, 1.9]} used={inkDabs >= 2} onSelect={onDab} />
                </>
            )}

            {/* Utbunke til høyre - vokser med antall trykte sider */}
            <Table position={[4.2, 0, 1.6]} width={2.4} depth={2} />
            <PaperStack position={[4.2, 0.92, 1.6]} count={pages} />

            {/* Munken i bakgrunnen, fortsatt på sin ene håndkopierte side */}
            <Monk position={[0, 0, -4.2]} />
        </group>
    );
}

// --- Pressen: rammeverk, skrue, plate og setteramme ---
function Press({
    pressAmount,
    placedCount,
    inked,
    burst,
}: {
    pressAmount: number;
    placedCount: number;
    inked: boolean;
    burst: number;
}) {
    const platen = useRef<THREE.Group>(null);
    const screwBar = useRef<THREE.Group>(null);
    const PLATEN_UP = 2.55;
    const PLATEN_DOWN = 1.4;

    useFrame((_, dt) => {
        if (platen.current) {
            const targetY = PLATEN_UP - pressAmount * (PLATEN_UP - PLATEN_DOWN);
            platen.current.position.y = damp(platen.current.position.y, targetY, dt, 6);
        }
        if (screwBar.current) {
            // Skruebjelken roterer mens pressen trekkes ned.
            const targetRot = pressAmount * Math.PI * 1.4;
            screwBar.current.rotation.y = damp(screwBar.current.rotation.y, targetRot, dt, 6);
        }
    });

    return (
        <group>
            {/* Bed/bord pressen står på */}
            <Table position={[0, 0, 0]} width={3} depth={2.2} />

            {/* To stolper */}
            {[-1.25, 1.25].map((x) => (
                <mesh key={x} position={[x, 2.2, -0.2]} castShadow>
                    <boxGeometry args={[0.34, 4.4, 0.34]} />
                    <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
                </mesh>
            ))}
            {/* Topbjelke */}
            <mesh position={[0, 4.3, -0.2]} castShadow>
                <boxGeometry args={[3, 0.4, 0.5]} />
                <meshStandardMaterial color="#5c3f24" roughness={0.9} />
            </mesh>

            {/* Treskruen */}
            <mesh position={[0, 3.5, -0.2]} castShadow>
                <cylinderGeometry args={[0.18, 0.18, 1.6, 10]} />
                <meshStandardMaterial color="#8a6a3a" roughness={0.7} />
            </mesh>
            {/* Spakbjelke (stjernebar) som vris */}
            <group ref={screwBar} position={[0, 3.9, -0.2]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.07, 0.07, 2.6, 8]} />
                    <meshStandardMaterial color="#3f2c1a" roughness={0.8} />
                </mesh>
            </group>

            {/* Platen (presseplaten) som beveger seg ned */}
            <group ref={platen} position={[0, 2.55, -0.2]}>
                <mesh castShadow>
                    <boxGeometry args={[2, 0.3, 1.6]} />
                    <meshStandardMaterial color="#7a5535" roughness={0.85} />
                </mesh>
            </group>

            {/* Setterammen på bedet med de satte typene */}
            <group position={[0, 0.95, 0.05]}>
                <mesh position={[0, -0.04, 0]} receiveShadow>
                    <boxGeometry args={[2.6, 0.08, 1.4]} />
                    <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
                </mesh>
                {Array.from({ length: placedCount }, (_, i) => (
                    <SetType key={i} x={slotX(i)} ch={WORD[i]} inked={inked} />
                ))}
            </group>

            <Burst
                position={[0, 1.3, 0.6]}
                trigger={burst}
                color="#f4ecd6"
                count={18}
                spread={2.4}
            />
        </group>
    );
}

// En satt type i rammen (liten metalblokk med bokstav).
function SetType({ x, ch, inked }: { x: number; ch: string; inked: boolean }) {
    return (
        <group position={[x, 0.08, 0]}>
            <mesh castShadow>
                <boxGeometry args={[0.32, 0.24, 0.5]} />
                <meshStandardMaterial
                    color={inked ? '#2b2b30' : '#b9bfc6'}
                    metalness={0.5}
                    roughness={0.5}
                />
            </mesh>
            <Html center position={[0, 0.16, 0]} pointerEvents="none">
                <div
                    style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '13px',
                        color: inked ? '#1b1b1f' : '#475569',
                    }}
                >
                    {ch}
                </div>
            </Html>
        </group>
    );
}

// En løs type på settebordet - klikkbar.
function LetterTile({
    position,
    ch,
    glow,
    onSelect,
}: {
    position: [number, number, number];
    ch: string;
    glow: boolean;
    onSelect: () => void;
}) {
    return (
        <Interactive
            position={position}
            onSelect={onSelect}
            state={glow ? 'selected' : 'idle'}
            hitArea={[0.7, 0.7, 0.7]}
        >
            {(s) => (
                <group>
                    <mesh castShadow>
                        <boxGeometry args={[0.42, 0.3, 0.42]} />
                        <meshStandardMaterial
                            color={s === 'hover' || glow ? '#d8b15a' : '#aeb4bb'}
                            metalness={0.5}
                            roughness={0.45}
                            emissive={glow ? '#7a5a1e' : '#000000'}
                            emissiveIntensity={glow ? 0.4 : 0}
                        />
                    </mesh>
                    <Html center position={[0, 0.2, 0]} pointerEvents="none">
                        <div
                            style={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: '15px',
                                color: '#1f2937',
                            }}
                        >
                            {ch}
                        </div>
                    </Html>
                </group>
            )}
        </Interactive>
    );
}

// Sverteball (dauber) - lærpute på et håndtak.
function InkBall({
    position,
    used,
    onSelect,
}: {
    position: [number, number, number];
    used: boolean;
    onSelect: () => void;
}) {
    return (
        <Interactive
            position={position}
            onSelect={onSelect}
            state={used ? 'correct' : 'selected'}
            disabled={used}
            hitArea={[0.8, 0.9, 0.8]}
        >
            {(s) => (
                <group>
                    {/* håndtak */}
                    <mesh position={[0, 0.32, 0]} castShadow>
                        <cylinderGeometry args={[0.05, 0.06, 0.6, 8]} />
                        <meshStandardMaterial color="#7a5535" roughness={0.9} />
                    </mesh>
                    {/* puten */}
                    <mesh castShadow>
                        <sphereGeometry args={[0.26, 14, 12]} />
                        <meshStandardMaterial
                            color={used ? '#1c1c20' : s === 'hover' ? '#3a3a42' : '#2b2b32'}
                            roughness={0.8}
                        />
                    </mesh>
                </group>
            )}
        </Interactive>
    );
}

// Enkelt arbeidsbord.
function Table({
    position,
    width,
    depth,
}: {
    position: [number, number, number];
    width: number;
    depth: number;
}) {
    return (
        <group position={position}>
            <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
                <boxGeometry args={[width, 0.16, depth]} />
                <meshStandardMaterial color="#8a6a44" roughness={0.9} />
            </mesh>
            {[
                [-width / 2 + 0.2, depth / 2 - 0.2],
                [width / 2 - 0.2, depth / 2 - 0.2],
                [-width / 2 + 0.2, -depth / 2 + 0.2],
                [width / 2 - 0.2, -depth / 2 + 0.2],
            ].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, 0.42, lz]} castShadow>
                    <boxGeometry args={[0.14, 0.84, 0.14]} />
                    <meshStandardMaterial color="#5c4326" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

// Bunke med trykte sider som vokser.
function PaperStack({ position, count }: { position: [number, number, number]; count: number }) {
    const shown = Math.min(count, 14);
    return (
        <group position={position}>
            {Array.from({ length: shown }, (_, i) => (
                <mesh
                    key={i}
                    position={[(i % 2) * 0.04 - 0.02, i * 0.035, (i % 3) * 0.03 - 0.03]}
                    rotation={[0, ((i % 4) - 1.5) * 0.03, 0]}
                    castShadow
                >
                    <boxGeometry args={[1, 0.03, 1.3]} />
                    <meshStandardMaterial color="#f3ecd8" roughness={0.95} />
                </mesh>
            ))}
        </group>
    );
}

// Munken ved pulten - fortsatt på sin ene håndkopierte side.
function Monk({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <Table position={[0, 0, 0]} width={1.8} depth={1.2} />
            {/* en enslig side foran ham */}
            <mesh position={[0, 0.94, 0.2]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
                <planeGeometry args={[0.8, 1]} />
                <meshStandardMaterial color="#f3ecd8" roughness={0.95} side={THREE.DoubleSide} />
            </mesh>
            <Figure position={[0, 0, -0.7]} body="#4a3a55" skin="#e0b98c" />
        </group>
    );
}

export default GutenbergPresse3D;
