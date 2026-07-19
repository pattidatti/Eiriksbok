import React, { useState } from 'react';
import {
    MicroGameScaffold,
    SceneBanner,
    SceneBadge,
    SceneFact,
    DataReadout,
    WinScreen,
    Hotspot,
    GroundPlane,
    WaterPlane,
    Building,
    Hill,
    Rock,
    Fire,
    Smoke,
} from './kit';
import type { MicroGameProps } from './types';

// Mikrospill: Det greske opprøret sprer seg.
//
// AKTIVT VALG: eleven tenner varselbål på greske fjelltopper. Opprøret starter på
// Peloponnes (1821) og kan bare spre seg til NABO-toppene som allerede har fått ilden.
// Klikk for klikk brer revolten seg fra fjell til fjell over hele landet, mens
// landsbyene under lyser opp.
//
// AHA: den greske frigjøringskrigen var ingen enkelt slagmark. Et helt folk reiste
// seg område for område - fra Peloponnes ut til øyene og opp på fastlandet - helt til
// hele landet sto i brann og osmanene mistet kontrollen.

interface Beacon {
    id: string;
    name: string;
    note: string;
    pos: [number, number]; // x (vest->øst), z (nord->sør)
    neighbors: string[];
    start?: boolean;
}

const BEACONS: Beacon[] = [
    {
        id: 'peloponnes',
        name: 'Peloponnes',
        note: 'Her brøt opprøret ut i 1821. Greske bønder og krigere reiste seg mot osmanene.',
        pos: [-5.4, 2.2],
        neighbors: ['mani', 'mesolongi'],
        start: true,
    },
    {
        id: 'mani',
        name: 'Mani-halvøya',
        note: 'De harde fjellkrigerne i Mani sluttet seg raskt til reisningen.',
        pos: [-3.6, 3.3],
        neighbors: ['peloponnes', 'mesolongi'],
    },
    {
        id: 'mesolongi',
        name: 'Mesolongi',
        note: 'Her kjempet og døde dikteren Lord Byron i 1824. Byen ble et symbol for hele Europa.',
        pos: [-1.8, -0.4],
        neighbors: ['peloponnes', 'mani', 'oyene'],
    },
    {
        id: 'oyene',
        name: 'Øyene i Egeerhavet',
        note: 'Sjøfolk fra øyene Hydra og Spetses stilte skip og sperret havet for osmanene.',
        pos: [1.4, 3.4],
        neighbors: ['mesolongi', 'athen'],
    },
    {
        id: 'athen',
        name: 'Athen',
        note: 'Sommeren 1822 erobret opprørerne Athen. Antikkens by ble gresk igjen.',
        pos: [3.4, 1.2],
        neighbors: ['oyene', 'fastlandet'],
    },
    {
        id: 'fastlandet',
        name: 'Fastlandet i nord',
        note: 'Til slutt spredte revolten seg nordover, og osmanene mistet grepet om landet.',
        pos: [5.2, -1.4],
        neighbors: ['athen'],
    },
];

const HILL_COLORS = ['#b7a06a', '#a8925c', '#c2ad76'];

const GreskOpproret3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [lit, setLit] = useState<Set<string>>(new Set());
    const [latest, setLatest] = useState<Beacon | null>(null);
    const [won, setWon] = useState(false);

    function isReady(b: Beacon): boolean {
        if (lit.has(b.id)) return false;
        if (lit.size === 0) return !!b.start;
        return b.neighbors.some((n) => lit.has(n));
    }

    function light(b: Beacon) {
        if (!isReady(b)) return;
        const next = new Set(lit);
        next.add(b.id);
        setLit(next);
        setLatest(b);
        if (next.size === BEACONS.length && !won) {
            setWon(true);
            onComplete({ score: 1, completed: true });
        }
    }

    function reset() {
        setLit(new Set());
        setLatest(null);
        setWon(false);
    }

    const banner = won
        ? 'Hele Hellas står i opprør!'
        : lit.size === 0
          ? 'Tenn det første bålet på Peloponnes'
          : `Opprøret sprer seg — tenn nabobålene (${lit.size}/${BEACONS.length})`;

    return (
        <MicroGameScaffold
            title="Det greske opprøret sprer seg"
            subtitle="Tenn varselbålene fjell for fjell. Opprøret starter på Peloponnes (1821) og kan bare spre seg til nabotopper som alt brenner."
            estimatedSeconds={120}
            onRetry={lit.size > 0 ? reset : undefined}
            canvas={{
                idle: false,
                controls: false,
                camera: { position: [0, 7.5, 12], fov: 46 },
                background: '#bfe0f2',
                target: [0, 0.4, 0.6],
                ambientIntensity: 0.55,
                sunIntensity: 0.6,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">1821–1832</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[{ label: 'Bål tent', value: lit.size, unit: `/ ${BEACONS.length}` }]}
                    />
                </>
            }
            scene={
                <RevoltScene
                    beacons={BEACONS}
                    lit={lit}
                    isReady={isReady}
                    onLight={light}
                />
            }
        >
            {latest && !won && (
                <SceneFact>
                    <span className="font-bold text-slate-800">{latest.name}:</span> {latest.note}
                </SceneFact>
            )}
            {won && (
                <WinScreen title="Et helt folk reiste seg." onReplay={reset}>
                    Den greske frigjøringskrigen var ingen enkelt slagmark. Fra Peloponnes i 1821
                    spredte opprøret seg område for område — ut til øyene og opp på fastlandet — helt
                    til hele landet sto i brann og osmanene mistet kontrollen. I 1832 ble Hellas en
                    fri og selvstendig stat.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

function RevoltScene({
    beacons,
    lit,
    isReady,
    onLight,
}: {
    beacons: Beacon[];
    lit: Set<string>;
    isReady: (b: Beacon) => boolean;
    onLight: (b: Beacon) => void;
}) {
    return (
        <group>
            {/* Land og hav */}
            <GroundPlane size={40} depth={30} color="#cdbb84" />
            <WaterPlane position={[0, -0.05, 7.5]} size={[44, 16]} color="#4f9dd6" />

            {beacons.map((b, i) => {
                const on = lit.has(b.id);
                const ready = isReady(b);
                const [x, z] = b.pos;
                return (
                    <group key={b.id} position={[x, 0, z]}>
                        {/* Fjell + stein */}
                        <Hill position={[0, 0, 0]} radius={1.5} height={1.35} color={HILL_COLORS[i % 3]} seed={i + 2} />
                        <Rock position={[0.9, 0.15, 0.6]} color="#9a9186" scale={0.5} />
                        {/* Landsby ved foten */}
                        <Building
                            position={[1.4, 0, 1.3]}
                            body={on ? '#e7d6a6' : '#c9bfa6'}
                            roof={on ? '#b4462f' : '#8f8776'}
                            w={0.7}
                            h={0.7}
                            d={0.7}
                            seed={i}
                        />
                        {/* Bål på toppen */}
                        <group position={[0, 1.3, 0]}>
                            <Fire position={[0, 0, 0]} scale={on ? 0.9 : 0.6} lit={on} />
                            <Smoke origin={[0, 0.8, 0]} show={on} count={5} color="#7a7168" />
                        </group>
                        {/* Klikkbar markør når bålet kan tennes */}
                        {ready && (
                            <Hotspot
                                position={[0, 2.1, 0]}
                                onSelect={() => onLight(b)}
                                label={b.start && lit.size === 0 ? 'Start opprøret' : 'Tenn bålet'}
                                color="#f59e0b"
                                radius={0.55}
                            />
                        )}
                    </group>
                );
            })}
        </group>
    );
}

export default GreskOpproret3D;
