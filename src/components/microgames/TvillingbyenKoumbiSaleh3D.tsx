import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    Building,
    Tree,
    Banner,
    MarketStall,
    Tent,
    Person,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    DataReadout,
    StepTracker,
    Burst,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om Ghana-riket.
// Hovedstaden Koumbi Saleh var to byer i én: kongebyen El-Ghaba med kongens
// palass, den hellige lunden og kongegravene, og kjøpmannsbyen et stykke unna
// med moské, marked og handelshus for muslimske kjøpmenn fra nord. Eleven drar
// seks bygninger på plass i hver sin by. Lyspæra: Ghanas hovedstad var to
// verdener side om side - en gammel afrikansk kongeby og en muslimsk
// handelsby - bundet sammen av gullhandelen. Mekanikken ER poenget: du sorterer
// de to kulturene i hver sin bydel og ser tvillingbyen reise seg.

const TOTAL = 6;

type Town = 'konge' | 'kjopmann';

interface BuildingDef {
    id: string;
    name: string;
    town: Town;
    // Glødende tomt der bygningen skal stå (xz i verden).
    plot: [number, number];
    // Der bygningen starter i forgrunnen.
    start: [number, number];
}

const BUILDINGS: BuildingDef[] = [
    // Kongebyen El-Ghaba (til venstre)
    { id: 'palass', name: 'Kongens palass', town: 'konge', plot: [-5.4, -2.4], start: [-6.6, 6.4] },
    { id: 'lund', name: 'Den hellige lunden', town: 'konge', plot: [-3.6, -0.6], start: [-4.0, 6.4] },
    { id: 'graver', name: 'Kongegravene', town: 'konge', plot: [-6.6, -0.4], start: [-1.4, 6.6] },
    // Kjøpmannsbyen (til høyre)
    { id: 'moske', name: 'Moskeen', town: 'kjopmann', plot: [5.4, -2.4], start: [1.4, 6.6] },
    { id: 'marked', name: 'Markedet', town: 'kjopmann', plot: [3.6, -0.6], start: [4.0, 6.4] },
    { id: 'handelshus', name: 'Handelshusene', town: 'kjopmann', plot: [6.6, -0.4], start: [6.6, 6.4] },
];

const TvillingbyenKoumbiSaleh3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const ambience = useAmbience('wind');
    const [placed, setPlaced] = useState<boolean[]>(() => Array(TOTAL).fill(false));
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra hver bygning til den glødende tomten i riktig by.'
    );

    const count = placed.filter(Boolean).length;
    const done = count >= TOTAL;
    // Folk samler seg etter hvert som byen reiser seg.
    const people = 5000 + count * 2500;

    const place = (i: number) => {
        ambience.start();
        setPlaced((prev) => {
            if (prev[i]) return prev;
            const next = prev.slice();
            next[i] = true;
            const n = next.filter(Boolean).length;
            setBurst((b) => b + 1);
            if (n >= TOTAL) {
                sounds.play('complete');
                setBanner(null);
                setTimeout(() => onComplete({ score: 1, completed: true }), 250);
            } else {
                sounds.play('correct');
                const t = BUILDINGS[i].town === 'konge' ? 'kongebyen' : 'kjøpmannsbyen';
                setBanner(`${BUILDINGS[i].name} reiser seg i ${t}. Sett neste bygning på plass.`);
            }
            return next;
        });
    };

    const reset = () => {
        setPlaced(Array(TOTAL).fill(false));
        setBanner('Dra hver bygning til den glødende tomten i riktig by.');
    };

    const idle = count === 0;

    return (
        <MicroGameScaffold
            title="Bygg tvillingbyen Koumbi Saleh"
            subtitle="Reis Ghana-rikets hovedstad: en kongeby og en kjøpmannsby side om side"
            estimatedSeconds={140}
            onRetry={count > 0 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 9.5, 12.5], fov: 42 },
                background: '#e9d6a8',
                fog: { near: 28, far: 56 },
                target: [0, 0.4, 0.5],
            }}
            containerClassName="bg-gradient-to-b from-[#e9d6a8] via-[#eedcb6] to-[#cdb079]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Koumbi Saleh står ferdig' : 'Ghana-riket — ca. 1000 e.Kr.'}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Bygninger reist', value: `${count}/${TOTAL}` },
                            { label: 'Innbyggere', value: people.toLocaleString('no') },
                        ]}
                    />
                    <DragHint show={idle} corner="bc">
                        Dra en bygning til en glødende tomt
                    </DragHint>
                </>
            }
            scene={<TwinCity placed={placed} burst={burst} onPlace={place} />}
        >
            <div className="flex flex-col gap-3">
                {!done ? (
                    <>
                        <StepTracker current={count} total={TOTAL} />
                        <p className="text-sm text-slate-600 leading-snug">
                            Hovedstaden var{' '}
                            <span className="font-bold text-amber-700">to byer i én</span>. Til
                            venstre lå kongebyen med palasset, den hellige lunden og kongegravene. Et
                            stykke unna lå kjøpmannsbyen med moské, marked og handelshus for muslimske
                            kjøpmenn fra nord. Dra hver bygning til riktig by.
                        </p>
                    </>
                ) : (
                    <WinScreen title="Tvillingbyen Koumbi Saleh står ferdig!" onReplay={reset}>
                        Ghanas hovedstad var to verdener side om side. I kongebyen styrte kongen, og
                        folk dyrket de gamle gudene ved den hellige lunden. I kjøpmannsbyen bodde
                        muslimske kjøpmenn fra nord, med moskeer og et travelt marked. De to byene
                        levde fredelig ved siden av hverandre, bundet sammen av én ting: handelen med
                        gull og salt. Slik viser Koumbi Saleh at to kulturer og to religioner kunne
                        dele samme rike.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function TwinCity({
    placed,
    burst,
    onPlace,
}: {
    placed: boolean[];
    burst: number;
    onPlace: (i: number) => void;
}) {
    return (
        <group>
            {/* Sandfarget ørkenland */}
            <GroundPlane size={34} depth={34} color="#dcc187" />

            {/* To bydeler markert med svake fargeflater */}
            <mesh position={[-5, 0.015, -1.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[7.5, 6]} />
                <meshStandardMaterial color="#cdb884" roughness={1} />
            </mesh>
            <mesh position={[5, 0.015, -1.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[7.5, 6]} />
                <meshStandardMaterial color="#c9bf9a" roughness={1} />
            </mesh>

            {/* Bygninger som allerede er plassert, vises i full størrelse */}
            {BUILDINGS.map((b, i) =>
                placed[i] ? (
                    <group key={`built-${b.id}`} position={[b.plot[0], 0, b.plot[1]]}>
                        <BuildingModel id={b.id} />
                    </group>
                ) : null
            )}

            {/* Glødende tomter som markerer hvor neste bygning skal */}
            {BUILDINGS.map((b, i) =>
                placed[i] ? null : (
                    <PlotMarker
                        key={`plot-${b.id}`}
                        position={[b.plot[0], 0.06, b.plot[1]]}
                        town={b.town}
                    />
                )
            )}

            {/* Draggbare bygninger i forgrunnen */}
            {BUILDINGS.map((b, i) =>
                placed[i] ? null : (
                    <Draggable
                        key={`drag-${b.id}`}
                        position={[b.start[0], 0.18, b.start[1]]}
                        planeY={0.18}
                        snapPoints={[b.plot]}
                        snapRadius={2.3}
                        liftY={0.5}
                        onSnap={() => onPlace(i)}
                    >
                        {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                        <mesh>
                            <boxGeometry args={[2.4, 2, 2.4]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                        <BuildingModel id={b.id} />
                    </Draggable>
                )
            )}

            {/* En liten karavane mellom byene: handelen som binder dem sammen */}
            <Person position={[0, 0, 1.2]} body="#b5894a" skin="#7a4a2c" pose="walk" />

            {/* Feiringspartikler når en bygning settes på plass */}
            <Burst position={[0, 1.8, -1]} trigger={burst} color="#f2c14e" count={22} spread={2.6} />
        </group>
    );
}

// Velger riktig 3D-modell ut fra bygningens id.
function BuildingModel({ id }: { id: string }) {
    switch (id) {
        case 'palass':
            return (
                <group>
                    <Building body="#c89a4e" roof="#7a4a24" w={1.8} h={1.5} d={1.6} />
                    <group position={[0, 1.5, 0]}>
                        <Banner color="#1f6f54" height={1.6} />
                    </group>
                </group>
            );
        case 'lund':
            // Den hellige lunden: en liten klynge trær.
            return (
                <group>
                    <Tree position={[-0.5, 0, 0.3]} />
                    <Tree position={[0.5, 0, -0.2]} />
                    <Tree position={[0, 0, 0.6]} />
                </group>
            );
        case 'graver':
            // Kongegravene: lave kuppelhauger.
            return (
                <group>
                    <Mound position={[-0.55, 0, 0]} r={0.55} color="#b98f57" />
                    <Mound position={[0.55, 0, 0.1]} r={0.45} color="#ac8350" />
                </group>
            );
        case 'moske':
            // Moskeen: hvitt bygg med kuppel og minaret.
            return (
                <group>
                    <Building body="#efe7d2" roof="#d8c9a3" w={1.6} h={1.3} d={1.5} />
                    <mesh position={[0, 1.55, 0]} castShadow>
                        <sphereGeometry args={[0.5, 16, 12]} />
                        <meshStandardMaterial color="#e7ddc2" roughness={0.7} />
                    </mesh>
                    <mesh position={[0.9, 1.1, -0.6]} castShadow>
                        <cylinderGeometry args={[0.16, 0.18, 2.2, 10]} />
                        <meshStandardMaterial color="#efe7d2" roughness={0.8} />
                    </mesh>
                </group>
            );
        case 'marked':
            return <MarketStall awning="#b5402f" />;
        case 'handelshus':
            return (
                <group>
                    <Building body="#cbb079" roof="#6b4a2c" w={1.3} h={1.1} d={1.2} />
                    <Tent position={[0.95, 0, 0.6]} color="#d8c193" scale={0.7} />
                </group>
            );
        default:
            return <Building />;
    }
}

// En lav kuppelhaug (halvkule) til kongegravene.
function Mound({
    position,
    r,
    color,
}: {
    position: [number, number, number];
    r: number;
    color: string;
}) {
    return (
        <mesh position={position} castShadow receiveShadow>
            <sphereGeometry args={[r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
    );
}

// Pulserende ring som markerer en ledig tomt. Grønn i kongebyen, gull i
// kjøpmannsbyen, så eleven ser hvilken kultur som hører hjemme hvor.
function PlotMarker({
    position,
    town,
}: {
    position: [number, number, number];
    town: Town;
}) {
    const ref = useRef<THREE.Mesh>(null);
    const color = town === 'konge' ? '#4fae6b' : '#f2c14e';
    const emissive = town === 'konge' ? '#2f8a4a' : '#d99a2b';
    useFrame(({ clock }) => {
        if (!ref.current) return;
        ref.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 3) * 0.12);
    });
    return (
        <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.95, 0.12, 10, 28]} />
            <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={0.6}
                roughness={0.4}
            />
        </mesh>
    );
}

export default TvillingbyenKoumbiSaleh3D;
