import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    FlatRing,
    Tree,
    Rock,
    Person,
    Particles,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    SceneFact,
    WinScreen,
    SceneSlider,
    StepTracker,
    Burst,
    CameraRig,
    damp,
    useRandomPulse,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// «Grava i skogen» - mikrospill til artikkelen om Anastasia.
// Lyspære: gåten levde i HULLET mellom kildene. Eleven legger navnene ned i
// massegrava fra 1991, oppdager at grava bare rommer ni, og sitter igjen med to
// navn i hånda. Mens de to mangler, samler det seg folk i skogkanten som sier
// de er de savnede barna. Først når eleven skrur året fram til 2007 og den
// andre grava dukker opp 70 meter unna, får de to siste navnene et sted - og
// menneskemengden løser seg opp.

type Phase = 'fyll' | 'hull' | 'andre' | 'vunnet';

interface Navn {
    id: string;
    label: string;
    // true = et av de to barna som manglet i grava fra 1991
    savnet: boolean;
    shelf: [number, number];
}

// Ni i den store grava: fem av familien og fire tjenere. To barn manglet.
const NAVN: Navn[] = [
    { id: 'tsaren', label: 'Tsar Nikolaj 2.', savnet: false, shelf: [-5.0, 4.2] },
    { id: 'tsarinaen', label: 'Tsarina Aleksandra', savnet: false, shelf: [-3.0, 4.2] },
    { id: 'datter1', label: 'Eldste datter', savnet: false, shelf: [-1.0, 4.2] },
    { id: 'datter2', label: 'Nest eldste datter', savnet: false, shelf: [1.0, 4.2] },
    { id: 'datter3', label: 'En datter til', savnet: false, shelf: [3.0, 4.2] },
    { id: 'legen', label: 'Legen', savnet: false, shelf: [5.0, 4.2] },
    { id: 'kokken', label: 'Kokken', savnet: false, shelf: [-4.0, 6.0] },
    { id: 'kammerpiken', label: 'Kammerpiken', savnet: false, shelf: [-2.0, 6.0] },
    { id: 'tjeneren', label: 'Tjeneren', savnet: false, shelf: [0.0, 6.0] },
    { id: 'sonnen', label: 'Sønnen Aleksej', savnet: true, shelf: [2.2, 6.0] },
    { id: 'sosteren', label: 'Den siste søsteren', savnet: true, shelf: [4.6, 6.0] },
];

const STORE_SLOTS: [number, number][] = [];
for (const dz of [-1.0, 0, 1.0]) {
    for (const dx of [-1.35, 0, 1.35]) {
        STORE_SLOTS.push([-3.3 + dx, -0.6 + dz]);
    }
}
const LILLE_SLOTS: [number, number][] = [
    [4.3, 1.9],
    [5.6, 1.9],
];

const START_AAR = 1991;
const FUNN_AAR = 2007;

const GravaISkogen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [placeringer, setPlasseringer] = useState<Record<string, number>>({});
    const [bumps, setBumps] = useState<Record<string, number>>({});
    const [aar, setAar] = useState(START_AAR);
    const [spokelser, setSpokelser] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra navnene ned i den store grava i skogen.'
    );
    const [burst, setBurst] = useState(0);
    const [introDone, setIntroDone] = useState(false);
    const snappet = useRef(false);

    const iStore = Object.keys(placeringer).filter((id) => placeringer[id] < 100).length;
    const iLille = Object.keys(placeringer).filter((id) => placeringer[id] >= 100).length;
    const andreGravFunnet = aar >= FUNN_AAR;

    const phase: Phase =
        iLille >= 2 ? 'vunnet' : andreGravFunnet ? 'andre' : iStore >= 9 ? 'hull' : 'fyll';

    // Mens de to navnene mangler, samler det seg folk i skogkanten som sier de
    // er de savnede barna. Verden beveger seg selv om eleven står stille.
    useRandomPulse({
        running: phase === 'hull' || phase === 'andre',
        minDelayMs: 2200,
        maxDelayMs: 4200,
        onPulse: () => setSpokelser((n) => Math.min(n + 1, 8)),
    });

    const reset = () => {
        setPlasseringer({});
        setBumps({});
        setAar(START_AAR);
        setSpokelser(0);
        setBanner('Dra navnene ned i den store grava i skogen.');
    };

    const bump = (id: string, melding: string) => {
        setBumps((b) => ({ ...b, [id]: (b[id] ?? 0) + 1 }));
        setBanner(melding);
        sounds.play('incorrect');
    };

    // Ledige plasser i den grava som er åpen akkurat nå.
    const ledigeStore = STORE_SLOTS.map((p, i) => ({ p, i })).filter(
        ({ i }) => !Object.values(placeringer).includes(i)
    );
    const ledigeLille = LILLE_SLOTS.map((p, i) => ({ p, i })).filter(
        ({ i }) => !Object.values(placeringer).includes(100 + i)
    );

    const snapPunkter = (navn: Navn): [number, number][] => {
        if (navn.savnet) {
            return andreGravFunnet ? ledigeLille.map((s) => s.p) : [];
        }
        return ledigeStore.map((s) => s.p);
    };

    const handleSnap = (navn: Navn, idx: number) => {
        snappet.current = true;
        if (navn.savnet) {
            const slot = ledigeLille[idx];
            if (!slot) return;
            const nyeILille = iLille + 1;
            setPlasseringer((p) => ({ ...p, [navn.id]: 100 + slot.i }));
            if (nyeILille >= 2) {
                sounds.play('complete');
                setBurst((b) => b + 1);
                setBanner(null);
                setTimeout(() => onComplete({ score: 1, completed: true }), 250);
            } else {
                sounds.play('correct');
                setBanner('Ett navn igjen. Den andre grava rommer akkurat to.');
            }
            return;
        }
        const slot = ledigeStore[idx];
        if (!slot) return;
        const nyeIStore = iStore + 1;
        setPlasseringer((p) => ({ ...p, [navn.id]: slot.i }));
        if (nyeIStore >= 9) {
            sounds.play('advance');
            setBanner('Grava er full. Ni plasser, og to navn ligger fortsatt igjen.');
        } else {
            sounds.play('correct');
            setBanner(null);
        }
    };

    const handleDrop = (navn: Navn) => {
        if (snappet.current) {
            snappet.current = false;
            return;
        }
        if (navn.savnet && !andreGravFunnet) {
            bump(navn.id, 'Det er ikke plass. Den store grava rommer bare ni.');
        } else if (navn.savnet) {
            bump(navn.id, 'Slipp navnet på en ledig plass i den lille grava.');
        } else {
            bump(navn.id, 'Slipp navnet på en ledig plass i grava.');
        }
    };

    const idle = iStore === 0 && introDone;

    return (
        <MicroGameScaffold
            title="Grava i skogen"
            subtitle="Legg navnene ned i grava, og se hva som skjer med de to som blir til overs"
            estimatedSeconds={170}
            onRetry={iStore > 0 || aar > START_AAR ? reset : undefined}
            canvas={{
                idle: false,
                controls: introDone,
                camera: { position: [4, 20, 24], fov: 40 },
                target: [0.5, 0, 0.8],
                background: '#c9d6cd',
                light: 'overcast',
                fog: { color: '#c9d6cd', near: 22, far: 48 },
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'vunnet'
                            ? 'Saken er lukket'
                            : andreGravFunnet
                              ? 'Skogen, 2007'
                              : `Skogen, ${aar}`}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'I grava', value: `${iStore + iLille}`, unit: '/ 11' },
                            { label: 'Sier de overlevde', value: spokelser },
                        ]}
                    />
                    <DragHint show={idle} corner="bc">
                        Dra et navn ned i grava
                    </DragHint>
                </>
            }
            scene={
                <>
                    <CameraRig
                        to={[2.5, 12.5, 14.5]}
                        lookAt={[0.5, 0, 0.8]}
                        active={!introDone}
                        onArrive={() => setIntroDone(true)}
                    />
                    <Skogen
                        navn={NAVN}
                        placeringer={placeringer}
                        bumps={bumps}
                        andreGravFunnet={andreGravFunnet}
                        spokelser={spokelser}
                        vunnet={phase === 'vunnet'}
                        burst={burst}
                        snapPunkter={snapPunkter}
                        onSnap={handleSnap}
                        onDrop={handleDrop}
                    />
                </>
            }
        >
            {phase === 'fyll' && (
                <div className="flex flex-col gap-2.5">
                    <StepTracker current={iStore} total={9} />
                    <p className="text-sm text-slate-600">
                        I 1991 ble massegrava i skogen utenfor Jekaterinburg åpnet. Dra navnene ned
                        i de ledige plassene og se hvor mange grava faktisk rommer.
                    </p>
                </div>
            )}

            {(phase === 'hull' || phase === 'andre') && (
                <div className="flex flex-col gap-3">
                    <SceneSlider
                        label="Skru fram året, og let videre i skogen"
                        min={START_AAR}
                        max={FUNN_AAR}
                        step={1}
                        value={aar}
                        onChange={setAar}
                        valueLabel={(v) => String(v)}
                    />
                    <SceneFact>
                        {andreGravFunnet
                            ? 'Sommeren 2007 fant letemannskaper en andre, mindre grav omtrent 70 meter fra den første. Dra de to siste navnene dit.'
                            : 'To navn er til overs, og i skogkanten samler det seg folk som sier at de er de savnede barna. Så lenge hullet står åpent, vokser ryktet.'}
                    </SceneFact>
                </div>
            )}

            {phase === 'vunnet' && (
                <WinScreen title="Alle elleve er gjort rede for" onReplay={reset}>
                    Den store grava rommet ni. De to som manglet lå 70 meter unna, og DNA-prøvene
                    fra 2007 viste at det var sønnen og en av søstrene. Da hullet i kildene ble
                    fylt, hadde ryktet ingen steder å bo lenger. Gåten om at Anastasia kom seg unna,
                    levde ikke av bevis, men av mangelen på dem.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Skogen({
    navn,
    placeringer,
    bumps,
    andreGravFunnet,
    spokelser,
    vunnet,
    burst,
    snapPunkter,
    onSnap,
    onDrop,
}: {
    navn: Navn[];
    placeringer: Record<string, number>;
    bumps: Record<string, number>;
    andreGravFunnet: boolean;
    spokelser: number;
    vunnet: boolean;
    burst: number;
    snapPunkter: (n: Navn) => [number, number][];
    onSnap: (n: Navn, idx: number) => void;
    onDrop: (n: Navn) => void;
}) {
    return (
        <group>
            <GroundPlane size={46} depth={38} color="#67784c" />

            {/* Den gamle skogsveien bak gravene */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, -4.2]} receiveShadow>
                <planeGeometry args={[30, 2.2]} />
                <meshStandardMaterial color="#8d7c5c" roughness={1} />
            </mesh>

            <Grav
                center={[-3.3, -0.6]}
                size={[4.6, 3.4]}
                slots={STORE_SLOTS}
                tatt={Object.values(placeringer).filter((v) => v < 100)}
                label="Den store grava - funnet 1991"
                visible
            />
            <Grav
                center={[4.95, 1.9]}
                size={[2.8, 1.8]}
                slots={LILLE_SLOTS}
                tatt={Object.values(placeringer)
                    .filter((v) => v >= 100)
                    .map((v) => v - 100)}
                label="Den lille grava - funnet 2007, 70 meter unna"
                visible={andreGravFunnet}
            />

            {/* Navneplatene */}
            {navn.map((n, ni) => {
                const plassert = placeringer[n.id];
                const labelY = ni % 2 === 0 ? 0.28 : 0.62;
                if (plassert !== undefined) {
                    const p =
                        plassert >= 100 ? LILLE_SLOTS[plassert - 100] : STORE_SLOTS[plassert];
                    // Etikettene trappes i høyden rad for rad, ellers legger de
                    // seg oppå hverandre sett fra kameraet.
                    const lagtLabelY =
                        plassert >= 100
                            ? 0.78 - (plassert - 100) * 0.4
                            : 0.98 - Math.floor(plassert / 3) * 0.33;
                    return (
                        <group key={n.id} position={[p[0], 0, p[1]]}>
                            <Plate label={n.label} lagt labelY={lagtLabelY} />
                        </group>
                    );
                }
                const punkter = snapPunkter(n);
                return (
                    <Draggable
                        key={`${n.id}-${bumps[n.id] ?? 0}`}
                        position={[n.shelf[0], 0, n.shelf[1]]}
                        planeY={0}
                        bounds={{ minX: -7.5, maxX: 8, minZ: -3, maxZ: 6.6 }}
                        snapPoints={punkter}
                        snapRadius={0.95}
                        onSnap={(i) => onSnap(n, i)}
                        onDrop={() => onDrop(n)}
                        liftY={0.55}
                        dropFx="dustPuff"
                    >
                        {/* Romslig usynlig gripeflate - trygg på trackpad */}
                        <mesh position={[0, 0.35, 0]}>
                            <boxGeometry args={[1.25, 0.9, 1.0]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <Plate label={n.label} savnet={n.savnet} labelY={labelY} />
                    </Draggable>
                );
            })}

            {/* Skogen rundt */}
            {[
                [-9.5, -6.5],
                [-6.5, -7.5],
                [-3, -7.2],
                [0.5, -7.8],
                [4, -7],
                [7.5, -6.4],
                [10, -4],
                [10.5, -0.5],
                [-10.5, -3],
                [-11, 0.5],
                [-10, 3.5],
                [9.5, 4],
            ].map(([x, z], i) => (
                <Tree
                    key={`${x}-${z}`}
                    position={[x, 0, z]}
                    leaf={i % 3 === 0 ? '#5d7a43' : '#6d8b4c'}
                    seed={i * 7 + 3}
                />
            ))}
            <Rock position={[-7.2, 0.25, 2.6]} color="#7f857c" scale={0.9} />
            <Rock position={[7.6, 0.2, -2.2]} color="#767d74" scale={0.7} />
            <Rock position={[1.6, 0.18, -2.9]} color="#7f857c" scale={0.55} />

            {/* De som sa de var de savnede barna */}
            {Array.from({ length: spokelser }).map((_, i) => (
                <Paastand key={i} index={i} borte={vunnet} />
            ))}

            {andreGravFunnet && <Particles preset="leaves" />}

            <Burst position={[4.95, 1.4, 1.9]} trigger={burst} color="#f6efd8" count={34} spread={3} />
        </group>
    );
}

// En grav: mørk jordflate med lav jordvoll rundt, og ringer for hver plass.
function Grav({
    center,
    size,
    slots,
    tatt,
    label,
    visible,
}: {
    center: [number, number];
    size: [number, number];
    slots: [number, number][];
    tatt: number[];
    label: string;
    visible: boolean;
}) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grp.current) return;
        const mål = visible ? 1 : 0.001;
        grp.current.scale.x = damp(grp.current.scale.x, mål, dt, 3.5);
        grp.current.scale.y = damp(grp.current.scale.y, mål, dt, 3.5);
        grp.current.scale.z = damp(grp.current.scale.z, mål, dt, 3.5);
    });
    if (!visible) {
        // Skjul helt til grava er funnet - en flat boks ville vist seg som et kort.
        return null;
    }
    return (
        <group ref={grp} position={[center[0], 0, center[1]]} scale={0.001}>
            {/* Selve gravgropa (mørk jord) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
                <planeGeometry args={size} />
                <meshStandardMaterial color="#463525" roughness={1} />
            </mesh>
            {/* Jordvoll langs kantene - står PÅ bakken */}
            {[
                { p: [0, 0.09, -size[1] / 2 - 0.2] as [number, number, number], a: [size[0] + 0.8, 0.18, 0.4] as [number, number, number] },
                { p: [0, 0.09, size[1] / 2 + 0.2] as [number, number, number], a: [size[0] + 0.8, 0.18, 0.4] as [number, number, number] },
                { p: [-size[0] / 2 - 0.2, 0.09, 0] as [number, number, number], a: [0.4, 0.18, size[1]] as [number, number, number] },
                { p: [size[0] / 2 + 0.2, 0.09, 0] as [number, number, number], a: [0.4, 0.18, size[1]] as [number, number, number] },
            ].map((v, i) => (
                <mesh key={i} position={v.p} castShadow receiveShadow>
                    <boxGeometry args={v.a} />
                    <meshStandardMaterial color="#5a4630" roughness={1} />
                </mesh>
            ))}
            {/* Ledige plasser lyser svakt */}
            {slots.map((s, i) =>
                tatt.includes(i) ? null : (
                    <FlatRing
                        key={i}
                        position={[s[0] - center[0], 0.02, s[1] - center[1]]}
                        radius={0.42}
                        tube={0.05}
                        color="#e0c98a"
                    />
                )
            )}
            <Html center position={[0, 0.05, size[1] / 2 + 0.85]} style={{ pointerEvents: 'none' }}>
                <span
                    style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#334155',
                        background: 'rgba(255,255,255,0.88)',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </span>
            </Html>
        </group>
    );
}

// Navneplate: en flat plate som ligger på bakken, med navnet over.
function Plate({
    label,
    savnet = false,
    lagt = false,
    labelY = 0.3,
}: {
    label: string;
    savnet?: boolean;
    lagt?: boolean;
    labelY?: number;
}) {
    const farge = lagt ? '#cbb894' : savnet ? '#f0c774' : '#e6ddc6';
    return (
        <group>
            <mesh position={[0, 0.045, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.78, 0.09, 0.5]} />
                <meshStandardMaterial color={farge} roughness={0.8} />
            </mesh>
            <Html center position={[0, labelY, 0]} style={{ pointerEvents: 'none' }}>
                <span
                    style={{
                        fontSize: lagt ? '9px' : '10px',
                        fontWeight: 700,
                        color: savnet && !lagt ? '#92400e' : '#1e293b',
                        background: savnet && !lagt ? 'rgba(254,243,199,0.95)' : 'rgba(255,255,255,0.9)',
                        border: savnet && !lagt ? '1px solid #f59e0b' : '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '5px',
                        padding: '1px 6px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </span>
            </Html>
        </group>
    );
}

const PAASTAND_PLASSER: [number, number][] = [
    [-8.6, -1.6],
    [-6.4, -4.6],
    [-1.4, -5.2],
    [2.6, -5],
    [6.6, -4.4],
    [8.8, -1.4],
    [-9, 1.8],
    [8.6, 2.6],
];

// En av dem som sa at de var et av de savnede barna. Vokser fram mens hullet
// står åpent, og forsvinner når det siste navnet har fått sin plass.
function Paastand({ index, borte }: { index: number; borte: boolean }) {
    const grp = useRef<THREE.Group>(null);
    const pos = PAASTAND_PLASSER[index % PAASTAND_PLASSER.length];
    useFrame(({ clock }, dt) => {
        if (!grp.current) return;
        const mål = borte ? 0.001 : 1;
        const s = damp(grp.current.scale.x, mål, dt, borte ? 2.2 : 3);
        grp.current.scale.set(s, s, s);
        // Uroen i skogkanten: en langsom vugging.
        grp.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5 + index) * 0.35;
    });
    return (
        <group ref={grp} position={[pos[0], 0, pos[1]]} scale={0.001}>
            <Person body="#6b6f7d" legs="#3c4049" skin="#e0b98c" pose="idle" hat="hood" hatColor="#8a8f9c" />
        </group>
    );
}

export default GravaISkogen3D;
