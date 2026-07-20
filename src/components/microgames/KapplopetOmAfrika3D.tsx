import React, { useState } from 'react';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    GroundPlane,
    Figure,
    Rock,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    DataReadout,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til "Kappløpet om Afrika". Eleven ER en europeisk diplomat under
// kappløpet: hen klikker område etter område på kartet og planter et flagg
// for en stormakt. Kartet blir raskt et lappeteppe av europeiske farger.
// Når hele kontinentet er tatt, faller de rette grensestrekene på plass -
// tvers gjennom landsbyene. Lyspæra: Europa kappet til seg hele Afrika bit for
// bit, og tegnet grensene uten å spørre dem som bodde der.

interface Power {
    navn: string;
    color: string;
}

// Rekkefølgen flaggene plantes i - kartet blir et lappeteppe.
const POWERS: Power[] = [
    { navn: 'Storbritannia', color: '#c0392b' },
    { navn: 'Frankrike', color: '#2563eb' },
    { navn: 'Tyskland', color: '#1f2937' },
    { navn: 'Portugal', color: '#15803d' },
    { navn: 'Belgia', color: '#ca8a04' },
    { navn: 'Italia', color: '#0e7490' },
];

// Seks områder spredt over "kontinentet".
const REGIONS: [number, number][] = [
    [-3.4, -2.6],
    [2.8, -2.9],
    [-3.9, 1.4],
    [3.6, 1.8],
    [-0.4, -0.3],
    [0.2, 3.4],
];
const TOTAL = REGIONS.length;

// Landsbyer (folk) mellom områdene - de står stille, men grensene deler dem.
const VILLAGES: [number, number][] = [
    [-1.6, -1.4],
    [1.4, 0.4],
    [-1.9, 2.6],
    [2.0, -1.2],
];

// Rette grensestreker som faller på plass til slutt.
const BORDERS: { pos: [number, number, number]; rot: number; len: number }[] = [
    { pos: [0, 0.06, -0.4], rot: 0, len: 11 },
    { pos: [-0.2, 0.06, 0], rot: Math.PI / 2, len: 10 },
];

const KapplopetOmAfrika3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [flags, setFlags] = useState<(number | null)[]>(() => REGIONS.map(() => null));
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Klikk de pulserende punktene og plant et flagg. Ta hele kontinentet.'
    );

    const claimed = flags.filter((f) => f !== null).length;
    const done = claimed >= TOTAL;

    const claim = (i: number) => {
        if (flags[i] !== null || done) return;
        const powerIndex = claimed % POWERS.length;
        const next = flags.slice();
        next[i] = powerIndex;
        setFlags(next);
        setBurst((b) => b + 1);
        const nowClaimed = claimed + 1;
        if (nowClaimed >= TOTAL) {
            sounds.play('complete');
            setBanner(null);
            setTimeout(() => onComplete({ score: 1, completed: true }), 300);
        } else {
            sounds.play('advance');
            setBanner(`${POWERS[powerIndex].navn} tok et område. ${TOTAL - nowClaimed} igjen.`);
        }
    };

    const reset = () => {
        setFlags(REGIONS.map(() => null));
        setBanner('Klikk de pulserende punktene og plant et flagg. Ta hele kontinentet.');
    };

    const idle = claimed === 0;

    return (
        <MicroGameScaffold
            title="Kappløpet om Afrika"
            subtitle="Plant flagg og ta område for område - se hvordan Europa delte et helt kontinent"
            estimatedSeconds={110}
            onRetry={claimed > 0 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 9.5, 10.5], fov: 42 },
                background: '#cfe3ba',
                fog: { near: 22, far: 52 },
                target: [0, 0, 0.2],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Afrika er delt' : 'Berlin 1884-1885'}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Områder tatt', value: claimed, unit: `/${TOTAL}` },
                            { label: 'Afrika delt', value: Math.round((claimed / TOTAL) * 100), unit: '%' },
                        ]}
                    />
                    <DragHint show={idle} corner="bc">
                        Klikk et lysende punkt på kartet
                    </DragHint>
                </>
            }
            scene={
                <Continent flags={flags} burst={burst} done={done} onClaim={claim} />
            }
        >
            {done ? (
                <WinScreen title="Hele kontinentet er delt!" onReplay={reset}>
                    På under tretti år tok europeiske stormakter nesten hele Afrika - bit for bit, i
                    et kappløp om land og rikdom. Da grensene ble tegnet i Berlin, gikk de rett
                    gjennom folk som hørte sammen. Ingen afrikanske ledere var med i rommet. De fleste
                    av disse strekene er fortsatt Afrikas grenser i dag.
                </WinScreen>
            ) : (
                <p className="text-sm text-slate-600 leading-snug">
                    Hvert klikk planter et flagg for en ny stormakt, og kartet blir et lappeteppe av
                    europeiske farger. Ta alle {TOTAL} områdene og se hva som skjer med landsbyene i
                    mellom.
                </p>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Continent({
    flags,
    burst,
    done,
    onClaim,
}: {
    flags: (number | null)[];
    burst: number;
    done: boolean;
    onClaim: (i: number) => void;
}) {
    return (
        <group>
            {/* Kontinentet */}
            <GroundPlane size={44} depth={40} color="#d9c9a3" />

            {/* Fargede eierlapper der flagg er plantet - kartet blir et lappeteppe */}
            {REGIONS.map((r, i) => {
                const p = flags[i];
                if (p === null) return null;
                return (
                    <mesh
                        key={`patch-${i}`}
                        position={[r[0], 0.03, r[1]]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        <circleGeometry args={[2.1, 28]} />
                        <meshStandardMaterial
                            color={POWERS[p].color}
                            transparent
                            opacity={0.34}
                            roughness={1}
                        />
                    </mesh>
                );
            })}

            {/* Landsbyer (folk) - står stille mellom områdene */}
            {VILLAGES.map((v, i) => (
                <group key={`village-${i}`} position={[v[0], 0, v[1]]}>
                    <Figure body="#8b5e34" skin="#d8a878" />
                    <Figure body="#6b5436" skin="#c79468" position={[0.55, 0, 0.25]} />
                    <Rock position={[-0.5, 0, 0.3]} color="#b7ad97" scale={0.5} />
                </group>
            ))}

            {/* Flagg + klikkpunkter for hvert område */}
            {REGIONS.map((r, i) => {
                const p = flags[i];
                return (
                    <group key={`region-${i}`} position={[r[0], 0, r[1]]}>
                        {p === null ? (
                            <Hotspot
                                position={[0, 1.1, 0]}
                                onSelect={() => onClaim(i)}
                                label="Plant flagg"
                                radius={0.62}
                                color="#4f46e5"
                            />
                        ) : (
                            <Flag color={POWERS[p].color} />
                        )}
                    </group>
                );
            })}

            {/* Burst-partikler ved siste plantede flagg */}
            <Burst position={[0, 1.6, 0]} trigger={burst} color="#f8fafc" count={20} spread={2.2} />

            {/* Rette grensestreker faller på plass når alt er tatt */}
            {done &&
                BORDERS.map((b, i) => (
                    <mesh key={`border-${i}`} position={b.pos} rotation={[0, b.rot, 0]}>
                        <boxGeometry args={[b.len, 0.12, 0.14]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                ))}
        </group>
    );
}

// Et plantet flagg: stang + vaiende duk i stormaktens farge.
function Flag({ color }: { color: string }) {
    return (
        <group>
            <mesh position={[0, 0.85, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 1.7, 6]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            <mesh position={[0.45, 1.45, 0]} castShadow>
                <boxGeometry args={[0.8, 0.5, 0.04]} />
                <meshStandardMaterial color={color} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

export default KapplopetOmAfrika3D;
