import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    Hotspot,
    Person,
    Fire,
    Smoke,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    WinScreen,
    StepTracker,
    Burst,
    THEMES,
    damp,
    useShake,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Hverdagslivet i Roma".
// Lyspaere: I en romersk insula (leiegaard) stod byen paa hodet. De rikeste
// bodde NEDERST, paa gateplan, med innlagt vann og en dor rett ut. De fattigste
// ble presset OPP i de trange, morke loftsrommene uten vann og uten trygg
// rommningsvei. Eleven kjenner dette paa kroppen i to steg: forst setter hun
// fire familier inn i riktig etasje (rikest nederst, fattigst overst), saa
// velter en oljelampe og brannen sprer seg oppover. Bare familien paa gateplan
// slipper ut. De overste sitter fast. Mekanikken ER poenget: hoyden var
// motsatt av i dag - jo hoyere du bodde, jo fattigere og farligere var livet.

const T = THEMES.roman;

const FLOORS = 4; // etasje 0 (gateplan) opp til etasje 3 (toppen/loftet)
const FLOOR_H = 2.0; // hoyde per etasje

// Familiene, rikest forst. correctFloor: hvilken etasje de hoerer hjemme i.
// Regelen er invers: rikest -> gateplan (0), fattigst -> toppen (3).
type Family = {
    id: number;
    label: string;
    body: string; // tunika/toga-farge
    legs: string;
    correctFloor: number;
    startX: number;
};
const FAMILIES: Family[] = [
    { id: 0, label: 'Rik kjøpmann', body: '#7a1f1f', legs: '#8a3030', correctFloor: 0, startX: -3.2 },
    { id: 1, label: 'Bakerfamilie', body: '#b0894f', legs: '#7a5a34', correctFloor: 1, startX: -1.1 },
    { id: 2, label: 'Dagarbeider', body: '#6b6f52', legs: '#4a4c3a', correctFloor: 2, startX: 1.1 },
    { id: 3, label: 'Fattig enke', body: '#565663', legs: '#3f3f48', correctFloor: 3, startX: 3.2 },
];

// Kort info per etasje som vises på hotspoten ved hover.
const FLOOR_INFO = [
    'Gateplan: dyrest, vann i veggen, dør rett ut',
    '1. etasje: middels leie, litt lys',
    '2. etasje: billig, langt til vann',
    'Toppen: billigst, ingen vann, brannfelle',
];

const Leiegaarden3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    // placedFamily[floor] = family-id som bor i etasjen, eller null.
    const [placedFamily, setPlacedFamily] = useState<(number | null)[]>(() =>
        Array(FLOORS).fill(null)
    );
    const [selected, setSelected] = useState<number | null>(null);
    const [ignited, setIgnited] = useState(false);
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Klikk en familie, og sett den i riktig etasje.'
    );
    // Rist trigges via et signal fordi useShake (som kjører useFrame) MÅ leve
    // inne i Canvas - se ShakeGroup nederst. Å kalle useShake her (utenfor Canvas)
    // krasjet hele spillet med "Hooks can only be used within the Canvas".
    const [shakeSignal, setShakeSignal] = useState(0);

    const placedCount = placedFamily.filter((f) => f !== null).length;
    const allPlaced = placedCount >= FLOORS;
    // familyPlaced[id] = true naar familien har flyttet inn et sted.
    const familyPlaced = FAMILIES.map((fam) => placedFamily.includes(fam.id));

    const step = !allPlaced ? 1 : 2;

    const pickFamily = (id: number) => {
        if (familyPlaced[id] || allPlaced) return;
        setSelected(id);
        setBanner('Hvem bor nederst? Sett familien i etasjen som passer.');
    };

    const placeInFloor = (floor: number) => {
        if (allPlaced) return;
        if (selected === null) {
            setBanner('Velg en familie først, klikk den nede på gata.');
            return;
        }
        if (placedFamily[floor] !== null) return; // etasjen er opptatt
        const fam = FAMILIES[selected];
        if (fam.correctFloor !== floor) {
            setShakeSignal((s) => s + 1);
            sounds.play('incorrect');
            setBanner('Nei. Tenk motsatt av i dag: de rike bor NEDERST, de fattige ØVERST.');
            return;
        }
        setPlacedFamily((prev) => {
            const next = prev.slice();
            next[floor] = fam.id;
            const n = next.filter((x) => x !== null).length;
            setBurst((b) => b + 1);
            if (n >= FLOORS) {
                sounds.play('advance');
                setBanner('Alle bor. Merk: rikest nederst, fattigst øverst. Velt oljelampen.');
            } else {
                sounds.play('correct');
                setBanner('Bra. Neste familie: klikk den og sett den i riktig etasje.');
            }
            return next;
        });
        setSelected(null);
    };

    const startFire = () => {
        if (!allPlaced || ignited) return;
        setIgnited(true);
        setBurst((b) => b + 1);
        sounds.play('complete');
        setBanner('Brannen sprer seg oppover. Bare familien på gateplan slipper ut.');
        setTimeout(() => onComplete({ score: 1, completed: true }), 2000);
    };

    const reset = () => {
        setPlacedFamily(Array(FLOORS).fill(null));
        setSelected(null);
        setIgnited(false);
        setBanner('Klikk en familie, og sett den i riktig etasje.');
    };

    const idle = placedCount === 0 && selected === null;

    return (
        <MicroGameScaffold
            title="Leiegården: byen som stod på hodet"
            subtitle="Sett familiene inn i den romerske insulaen, og se hvem som bor trygt og hvem som ikke gjør det"
            estimatedSeconds={150}
            onRetry={placedCount > 0 || ignited ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [2.5, 5.2, 15], fov: 44 },
                background: T.sky,
                fog: { near: 30, far: 62 },
                target: [0, 3.6, 0],
            }}
            containerClassName="bg-gradient-to-b from-[#f6ecd2] via-[#efe2c6] to-[#d8c49a]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {ignited ? 'Brann i insulaen' : 'Roma, ca. 100 evt.'}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[{ label: 'Familier flyttet inn', value: `${placedCount}/${FLOORS}` }]}
                    />
                    <DragHint show={idle} corner="bc">
                        Klikk en familie nede på gata
                    </DragHint>
                </>
            }
            scene={
                <ShakeGroup signal={shakeSignal}>
                    <Insula
                        placedFamily={placedFamily}
                        selected={selected}
                        familyPlaced={familyPlaced}
                        allPlaced={allPlaced}
                        ignited={ignited}
                        burst={burst}
                        onPickFamily={pickFamily}
                        onFloor={placeInFloor}
                        onFire={startFire}
                    />
                </ShakeGroup>
            }
        >
            <div className="flex flex-col gap-3">
                {!ignited ? (
                    <>
                        <StepTracker current={step} total={2} />
                        <p className="text-sm text-slate-600 leading-snug">
                            Ni av ti romere bodde i store leiegårder som ble kalt{' '}
                            <span className="font-bold text-amber-700">insula</span>. Men her var alt
                            snudd på hodet mot i dag:{' '}
                            <span className="font-bold text-rose-700">de rikeste (røde)</span> bodde
                            nederst med innlagt vann og dør rett ut, mens{' '}
                            <span className="font-bold text-slate-700">de fattigste (grå)</span> bodde
                            øverst under taket.{' '}
                            {step === 1 &&
                                'Klikk en familie, og klikk så det gule punktet ved riktig etasje.'}
                            {step === 2 &&
                                'Alle bor. Klikk det røde punktet og velt oljelampen for å se hvorfor høyden var farlig.'}
                        </p>
                    </>
                ) : (
                    <WinScreen title="Byen som stod på hodet!" onReplay={reset}>
                        I en insula var høyden motsatt av i dag. Det fantes ingen heis, og byggene
                        brant og raste ofte sammen. Derfor bodde de rike nederst: de hadde innlagt
                        vann og kunne gå rett ut på gata om det tok fyr. De fattige ble presset opp i
                        de trange, mørke loftsrommene uten vann og uten en trygg vei ned. Da
                        oljelampen veltet, gikk kjøpmannen rett ut, mens enka øverst satt fast i røyken.
                        I dag er toppleiligheten finest. I Roma var den farligst.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

// Rist-gruppe som lever inne i Canvas. useShake kjører useFrame, så den kan bare
// brukes i en scene-komponent - ikke i det ytre spillet. Trigges når `signal`
// endres (samme mønster som Burst-triggeren).
function ShakeGroup({ signal, children }: { signal: number; children: React.ReactNode }) {
    const { ref, shake } = useShake();
    useEffect(() => {
        if (signal > 0) shake(0.7);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signal]);
    return <group ref={ref}>{children}</group>;
}

function Insula({
    placedFamily,
    selected,
    familyPlaced,
    allPlaced,
    ignited,
    burst,
    onPickFamily,
    onFloor,
    onFire,
}: {
    placedFamily: (number | null)[];
    selected: number | null;
    familyPlaced: boolean[];
    allPlaced: boolean;
    ignited: boolean;
    burst: number;
    onPickFamily: (id: number) => void;
    onFloor: (floor: number) => void;
    onFire: () => void;
}) {
    return (
        <group>
            {/* Gata av brostein */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                <planeGeometry args={[42, 34]} />
                <meshStandardMaterial color={T.ground} roughness={1} />
            </mesh>

            {/* Offentleg fontene til venstre: den einaste vasskjelda i gata */}
            <Fountain position={[-6.4, 0, 3.2]} />

            {/* Sjolve leigegarden i tverrsnitt (dukkehus-kutt i fronten) */}
            <group position={[0, 0, 0]}>
                {Array.from({ length: FLOORS }).map((_, f) => (
                    <FloorRoom
                        key={f}
                        floor={f}
                        occupant={placedFamily[f]}
                        ignited={ignited}
                    />
                ))}
                {/* Tak */}
                <mesh position={[0, FLOORS * FLOOR_H + 0.12, 0]} castShadow receiveShadow>
                    <boxGeometry args={[4.5, 0.25, 3.4]} />
                    <meshStandardMaterial color="#8a4a30" roughness={1} />
                </mesh>

                {/* Myntstabel ved kvar etasje viser leiga: dyrast nederst */}
                {Array.from({ length: FLOORS }).map((_, f) => (
                    <RentCoins key={f} floor={f} count={FLOORS - f} />
                ))}

                {/* Klikkpunkt for aa flytte inn valgt familie (steg 1) */}
                {!allPlaced &&
                    Array.from({ length: FLOORS }).map((_, f) =>
                        placedFamily[f] !== null ? null : (
                            <Hotspot
                                key={f}
                                position={[-2.7, f * FLOOR_H + 1.0, 1.5]}
                                radius={0.5}
                                label={FLOOR_INFO[f]}
                                state={selected !== null ? 'idle' : 'disabled'}
                                onSelect={() => onFloor(f)}
                            />
                        )
                    )}

                {/* Steg 2: velt oljelampa og start brannen */}
                {allPlaced && !ignited && (
                    <Hotspot
                        position={[2.4, FLOOR_H + 1.0, 1.5]}
                        radius={0.6}
                        color="#f43f5e"
                        label="Velt oljelampen"
                        onSelect={onFire}
                    />
                )}

                {/* Brann og roeyk som sprer seg oppover naar det tek fyr */}
                {ignited && (
                    <group>
                        <Fire position={[0.2, FLOOR_H, 0.3]} scale={1.3} />
                        <Fire position={[-0.8, FLOOR_H, -0.2]} scale={0.9} />
                        <Smoke origin={[0, FLOOR_H + 1.4, 0]} show count={7} color="#3a3330" />
                    </group>
                )}
            </group>

            {/* Kjopmannen fraa gateplan gaar trygt ut paa gata naar det brenn */}
            {ignited && <EscapedMerchant />}

            {/* Familiane som ventar nede paa gata (steg 1) */}
            {FAMILIES.map((fam) =>
                familyPlaced[fam.id] ? null : (
                    <StreetFamily
                        key={fam.id}
                        family={fam}
                        selected={selected === fam.id}
                        onPick={() => onPickFamily(fam.id)}
                    />
                )
            )}

            {/* Feiringspartiklar */}
            <Burst position={[0, 3.2, 0.5]} trigger={burst} color="#e3b23c" count={20} spread={2.4} />
        </group>
    );
}

// Ei etasje i tverrsnitt: golv, bakvegg og sidevegger, open front. Romma er
// lysare og romslegare nederst, moerkare og traangare opp mot loftet.
function FloorRoom({
    floor,
    occupant,
    ignited,
}: {
    floor: number;
    occupant: number | null;
    ignited: boolean;
}) {
    const y = floor * FLOOR_H;
    // Interioret moerknar oppover: gateplan lyst, loftet moerkt.
    const inner = ['#e8d9b8', '#d2c096', '#b0a077', '#8a7d66'][floor];
    const fam = occupant !== null ? FAMILIES[occupant] : null;
    // Kjopmannen paa gateplan (etasje 0) gaar ut paa gata naar det brenn.
    const escaped = ignited && floor === 0;
    // Dei overste sit fast og hever armane naar roeyken kjem.
    const trapped = ignited && floor > 0;

    return (
        <group position={[0, y, 0]}>
            {/* Golvplate */}
            <mesh position={[0, 0.0, 0]} receiveShadow castShadow>
                <boxGeometry args={[4.0, 0.2, 3.0]} />
                <meshStandardMaterial color="#9a6a44" roughness={1} />
            </mesh>
            {/* Bakvegg */}
            <mesh position={[0, FLOOR_H / 2, -1.4]} receiveShadow castShadow>
                <boxGeometry args={[4.0, FLOOR_H, 0.2]} />
                <meshStandardMaterial color={inner} roughness={1} />
            </mesh>
            {/* Sidevegger */}
            <mesh position={[-1.9, FLOOR_H / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[0.2, FLOOR_H, 3.0]} />
                <meshStandardMaterial color="#b06a44" roughness={1} />
            </mesh>
            <mesh position={[1.9, FLOOR_H / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[0.2, FLOOR_H, 3.0]} />
                <meshStandardMaterial color="#b06a44" roughness={1} />
            </mesh>

            {/* Gateplan: blaatt vassroer i veggen (innlagt vatn) */}
            {floor === 0 && (
                <mesh position={[1.5, FLOOR_H / 2, -1.28]}>
                    <boxGeometry args={[0.16, FLOOR_H * 0.8, 0.1]} />
                    <meshStandardMaterial
                        color={T.water}
                        emissive="#2f7fa0"
                        emissiveIntensity={0.3}
                        roughness={0.4}
                    />
                </mesh>
            )}

            {/* Bebuar inne i rommet (naar familien er flytta inn og ikkje har roemt) */}
            {fam && !escaped && (
                <Person
                    position={[-0.6, 0.2, -0.1]}
                    scale={0.82}
                    body={fam.body}
                    legs={fam.legs}
                    skin="#e0b98c"
                    pose={trapped ? 'raise' : 'idle'}
                    rotation={[0, 0.3, 0]}
                />
            )}

            {/* Roeyk-glimt i dei overste etasjane naar det brenn */}
            {trapped && (
                <mesh position={[0.6, FLOOR_H * 0.7, 0.2]}>
                    <sphereGeometry args={[0.5, 10, 10]} />
                    <meshStandardMaterial color="#4a4038" transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}

// Kjopmannen som gaar trygt ut paa gata naar brannen bryt ut.
function EscapedMerchant() {
    return (
        <Person
            position={[-3.3, 0, 5.2]}
            scale={0.9}
            body={FAMILIES[0].body}
            legs={FAMILIES[0].legs}
            skin="#e0b98c"
            pose="walk"
            rotation={[0, -0.5, 0]}
        />
    );
}

// Ein familie-token som ventar paa gata. Klikkbar; lyser og loeftar seg naar valgt.
function StreetFamily({
    family,
    selected,
    onPick,
}: {
    family: Family;
    selected: boolean;
    onPick: () => void;
}) {
    const ring = useRef<THREE.Mesh>(null);
    useFrame(({ clock }, dt) => {
        if (!ring.current) return;
        const pulse = selected ? 1 + Math.sin(clock.getElapsedTime() * 5) * 0.12 : 1;
        ring.current.scale.setScalar(pulse);
        const mat = ring.current.material as THREE.MeshStandardMaterial;
        mat.opacity = damp(mat.opacity, selected ? 0.9 : 0.0, dt, 6);
    });
    return (
        <group position={[family.startX, 0, 5.4]}>
            <Interactive
                onSelect={onPick}
                state={selected ? 'selected' : 'idle'}
                hitArea={[1.2, 2.0, 1.2]}
            >
                <Person
                    body={family.body}
                    legs={family.legs}
                    skin="#e0b98c"
                    pose="idle"
                    scale={1.0}
                />
            </Interactive>
            {/* Ring under foten som viser at familien er valgt */}
            <mesh ref={ring} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.5, 0.08, 10, 24]} />
                <meshStandardMaterial
                    color="#0ea5e9"
                    emissive="#0ea5e9"
                    emissiveIntensity={0.7}
                    transparent
                    opacity={0}
                />
            </mesh>
        </group>
    );
}

// Myntstabel ved sida av ei etasje. Fleire myntar = hoegare leige. Dyrast nederst.
function RentCoins({ floor, count }: { floor: number; count: number }) {
    return (
        <group position={[2.45, floor * FLOOR_H + 0.5, 1.3]}>
            {Array.from({ length: count }).map((_, i) => (
                <mesh key={i} position={[0, i * 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.14, 0.14, 0.07, 16]} />
                    <meshStandardMaterial
                        color="#e3b23c"
                        emissive="#b8860b"
                        emissiveIntensity={0.25}
                        metalness={0.5}
                        roughness={0.4}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Offentleg fontene: ei steinskaal med litt vatn. Einaste vasskjelda i gata,
// difor maatte folk hoegare oppe bere vatn opp mange trapper.
function Fountain({ position }: { position: [number, number, number] }) {
    const water = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        if (water.current) {
            water.current.emissiveIntensity = 0.28 + Math.sin(clock.getElapsedTime() * 2.5) * 0.1;
        }
    });
    return (
        <group position={position}>
            <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.8, 0.9, 0.7, 20]} />
                <meshStandardMaterial color={T.stone} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.62, 0]}>
                <cylinderGeometry args={[0.62, 0.62, 0.12, 20]} />
                <meshStandardMaterial
                    ref={water}
                    color={T.water}
                    emissive="#2f7fa0"
                    emissiveIntensity={0.3}
                    roughness={0.25}
                />
            </mesh>
            <mesh position={[0, 1.0, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.9, 12]} />
                <meshStandardMaterial color={T.stone} roughness={0.9} />
            </mesh>
        </group>
    );
}

export default Leiegaarden3D;
