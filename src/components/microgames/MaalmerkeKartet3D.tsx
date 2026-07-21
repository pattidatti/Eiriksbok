import React, { useState } from 'react';
import {
    MicroGameScaffold,
    Interactive,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    Burst,
    useShake,
    useHintEscalation,
    type InteractiveState,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Målmerke-kartet - et 3D-mikrospill. Norge ligger som et kart foran eleven,
// delt i fire landsdeler. For hvert målmerke skal eleven klikke landsdelen der
// trekket er mest hjemme. Lyspæra: målmerkene tegner et kart. Tjukk l i øst,
// apokope i Trøndelag, palatalisering i nord, «eg» i vest - når du kjenner
// merkene, hører du hvor en dialekt kommer fra.

interface Region {
    id: string;
    position: [number, number, number];
    size: [number, number, number];
    rotation?: number;
}

const REGIONS: Region[] = [
    { id: 'nordnorge', position: [-1.5, 0.25, -4.1], size: [1.9, 0.5, 4.4], rotation: 0.5 },
    { id: 'trondelag', position: [0.3, 0.25, -0.5], size: [2.2, 0.5, 2.0] },
    { id: 'vestlandet', position: [-2.9, 0.25, 1.9], size: [1.8, 0.5, 3.6], rotation: -0.15 },
    { id: 'ostlandet', position: [1.9, 0.25, 3.1], size: [2.5, 0.5, 2.6] },
];

interface Merke {
    id: string;
    label: string;
    eksempel: string;
    region: string;
    fasit: string;
}

const MERKER: Merke[] = [
    { id: 'tjukk-l', label: 'Tjukk l', eksempel: 'såL, boL', region: 'ostlandet', fasit: 'Østlandet: tjukk l (såL, boL)' },
    { id: 'apokope', label: 'Apokope', eksempel: 'å kast', region: 'trondelag', fasit: 'Trøndelag: apokope (å kast)' },
    { id: 'palatalisering', label: 'Palatalisering', eksempel: 'mannj', region: 'nordnorge', fasit: 'Nord-Norge: palatalisering (mannj)' },
    { id: 'eg', label: 'Pronomenet «eg»', eksempel: '«eg», ikkje «jeg»', region: 'vestlandet', fasit: 'Vestlandet: «eg», og inga tjukk l' },
];

const COLOR: Record<InteractiveState, string> = {
    idle: '#7c9e6a',
    hover: '#a7c489',
    selected: '#a7c489',
    correct: '#10b981',
    wrong: '#f43f5e',
    disabled: '#94a3b8',
};

function LandZone({
    region,
    state,
    onSelect,
    highlight,
}: {
    region: Region;
    state: InteractiveState;
    onSelect: () => void;
    highlight: boolean;
}) {
    const color = COLOR[state];
    return (
        <Interactive
            position={region.position}
            rotation={[0, region.rotation ?? 0, 0]}
            onSelect={onSelect}
            state={state}
            hitArea={[region.size[0] + 1, 2, region.size[2] + 1]}
        >
            <mesh castShadow receiveShadow>
                <boxGeometry args={region.size} />
                <meshStandardMaterial
                    color={color}
                    emissive={state === 'correct' ? '#10b981' : highlight ? '#facc15' : '#000000'}
                    emissiveIntensity={state === 'correct' ? 0.5 : highlight ? 0.4 : 0}
                    roughness={0.85}
                />
            </mesh>
        </Interactive>
    );
}

function NorthArrow() {
    // Enkel nord-peker: en kjegle som peker mot -Z (nord/oppe på kartet).
    return (
        <group position={[3.6, 0.4, -4.6]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.4, 1.1, 4]} />
                <meshStandardMaterial color="#e11d48" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.9]}>
                <cylinderGeometry args={[0.09, 0.09, 0.9, 8]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
        </group>
    );
}

const MaalmerkeKartet3D: React.FC<MicroGameProps> = ({ onComplete, onRetry }) => {
    const [step, setStep] = useState(0);
    const [solved, setSolved] = useState<string[]>([]);
    const [wrongRegion, setWrongRegion] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([0, 1, 0]);
    const [done, setDone] = useState(false);
    const { ref: shakeRef, shake } = useShake();
    const { play } = useStepSounds();

    const current = step < MERKER.length ? MERKER[step] : null;
    const hint = useHintEscalation({ active: !!current && !done, resetKey: step, max: 1, stepMs: 9000 });

    const solvedRegions = MERKER.filter((m) => solved.includes(m.id)).map((m) => m.region);

    const handleClick = (regionId: string) => {
        if (!current || done) return;
        if (solvedRegions.includes(regionId)) return;
        if (regionId === current.region) {
            const region = REGIONS.find((r) => r.id === regionId)!;
            setBurstPos([region.position[0], 1.4, region.position[2]]);
            setBurst((b) => b + 1);
            play('correct');
            const nextSolved = [...solved, current.id];
            setSolved(nextSolved);
            setWrongRegion(null);
            if (nextSolved.length === MERKER.length) {
                setDone(true);
                play('complete');
                onComplete({ score: 1, completed: true, artifact: { solved: nextSolved } });
            } else {
                setStep((s) => s + 1);
            }
        } else {
            setWrongRegion(regionId);
            shake(0.6);
            play('incorrect');
            setTimeout(() => setWrongRegion((w) => (w === regionId ? null : w)), 500);
        }
    };

    const reset = () => {
        setStep(0);
        setSolved([]);
        setWrongRegion(null);
        setDone(false);
        onRetry?.();
    };

    const zoneState = (regionId: string): InteractiveState => {
        if (solvedRegions.includes(regionId)) return 'correct';
        if (wrongRegion === regionId) return 'wrong';
        return 'idle';
    };

    const banner = done
        ? null
        : current
          ? `Klikk landsdelen som er mest kjent for: ${current.label} (${current.eksempel})`
          : null;

    const revealed = MERKER.filter((m) => solved.includes(m.id));

    const scene = (
        <group ref={shakeRef}>
            {/* Havet rundt kartet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[26, 30]} />
                <meshStandardMaterial color="#8ec5e6" roughness={0.9} />
            </mesh>
            {REGIONS.map((r) => (
                <LandZone
                    key={r.id}
                    region={r}
                    state={zoneState(r.id)}
                    onSelect={() => handleClick(r.id)}
                    highlight={hint > 0 && current?.region === r.id && !solvedRegions.includes(r.id)}
                />
            ))}
            <NorthArrow />
            <Burst position={burstPos} trigger={burst} color="#34d399" count={26} spread={3} />
        </group>
    );

    return (
        <MicroGameScaffold
            title="Målmerke-kartet"
            subtitle="Plasser hvert målmerke på riktig landsdel."
            estimatedSeconds={110}
            onRetry={reset}
            scene={scene}
            canvas={{ camera: { position: [0.5, 9.5, 9], fov: 42 }, target: [0, 0, -0.4], background: '#cfe7f5' }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Nord er oppe</SceneBadge>
                    <DataReadout corner="bl" items={[{ label: 'Riktige', value: `${solved.length}/${MERKER.length}` }]} />
                    {done && (
                        <WinScreen title="Kartet er tegnet!" onReplay={reset}>
                            Målmerkene tegner et kart over Norge. Tjukk l og jamvekt i øst, apokope i
                            Trøndelag, palatalisering i nord og «eg» i vest. Når du kjenner merkene,
                            hører du hvor en dialekt hører hjemme.
                        </WinScreen>
                    )}
                </>
            }
        >
            <div className="px-4 py-3 text-sm text-slate-600">
                {revealed.length === 0 ? (
                    <p>Klikk landsdelen på kartet der målmerket i toppen hører hjemme.</p>
                ) : (
                    <ul className="space-y-1">
                        {revealed.map((m) => (
                            <li key={m.id} className="flex items-center gap-2 text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                {m.fasit}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </MicroGameScaffold>
    );
};

export default MaalmerkeKartet3D;
