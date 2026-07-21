import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
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

// Målmerke-kartet - et 3D-mikrospill. Norge ligger som et ekte kart-omriss foran
// eleven, delt i fire landsdeler som til sammen tegner landet: bred sør, smal
// midje i Trøndelag, og en lang tynn arm opp til Finnmark. For hvert målmerke
// skal eleven klikke landsdelen der trekket er mest hjemme. Lyspæra: målmerkene
// tegner et kart. Tjukk l i øst, apokope i Trøndelag, palatalisering i nord,
// «eg» i vest - når du kjenner merkene, hører du hvor en dialekt kommer fra.

interface Region {
    id: string;
    // Polygon i kart-koordinater: x = øst, y = nord (opp på kartet). Landsdelene
    // deler nøyaktige sømpunkter, så de flyter sammen til ett sammenhengende Norge.
    shape: [number, number][];
    // Sentrum (kart-koord) - brukt til partikkel-burst når landsdelen løses.
    center: [number, number];
    // Grunnfarge (litt ulik grønn per landsdel) så grensene er synlige.
    base: string;
}

// Delte sømpunkter (må stemme mellom naboer):
//   A0 (0.4,-4.4) sørsplitt-bunn · split-mid (0,-1.6) · P (-0.3,0.6)
//   W1 (-1.9,1.0) · E1 (2.1,0.2)  = sør/Trøndelag-grense
//   W2 (0.2,3.2) · E2 (2.6,2.6)   = Trøndelag/Nord-grense
const REGIONS: Region[] = [
    {
        id: 'vestlandet',
        base: '#6fa063',
        center: [-1.5, -1.4],
        shape: [
            [0.4, -4.4],
            [-0.8, -4.5],
            [-2.0, -3.9], // sørvest-tippen
            [-2.6, -3.0],
            [-2.1, -2.4],
            [-2.85, -1.6], // fjord-takker på vestkysten
            [-2.2, -1.0],
            [-2.9, -0.2],
            [-2.2, 0.5],
            [-2.55, 1.15],
            [-1.9, 1.0], // W1
            [-0.3, 0.6], // P (sør/Trøndelag-grense)
            [0.0, -1.6], // split-mid
        ],
    },
    {
        id: 'ostlandet',
        base: '#8bb15f',
        center: [1.35, -1.9],
        shape: [
            [0.4, -4.4], // A0
            [0.0, -1.6], // split-mid
            [-0.3, 0.6], // P
            [2.1, 0.2], // E1
            [2.5, -1.0],
            [2.75, -2.6], // svenskegrensa
            [2.1, -3.8], // sørøst-hjørnet (Østfold)
            [1.0, -4.4],
        ],
    },
    {
        id: 'trondelag',
        base: '#7aa869',
        center: [0.5, 1.7],
        shape: [
            [-1.9, 1.0], // W1
            [-1.5, 1.9],
            [-1.0, 2.6],
            [0.2, 3.2], // W2
            [2.6, 2.6], // E2
            [2.35, 1.4],
            [2.1, 0.2], // E1
            [-0.3, 0.6], // P (tilbake langs sørgrensa)
        ],
    },
    {
        id: 'nordnorge',
        base: '#93b86f',
        center: [2.6, 5.2],
        shape: [
            [0.2, 3.2], // W2
            [0.6, 4.2],
            [1.2, 5.2],
            [2.0, 6.0],
            [2.8, 6.8],
            [3.6, 7.5],
            [4.5, 7.85], // Finnmark, nordøst-tippen
            [4.9, 7.15],
            [4.0, 6.55],
            [3.4, 5.8],
            [3.05, 4.9],
            [3.2, 3.9],
            [2.6, 2.6], // E2
        ],
    },
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

// Farge for hover/valgt/korrekt/feil. Idle henter grunnfargen fra landsdelen.
function fillFor(state: InteractiveState, base: string): string {
    switch (state) {
        case 'hover':
        case 'selected':
            return '#c9e79c';
        case 'correct':
            return '#10b981';
        case 'wrong':
            return '#f43f5e';
        case 'disabled':
            return '#94a3b8';
        default:
            return base;
    }
}

// Bygg én flat, ekstrudert landsdel av polygonet. Shapen tegnes i XY (y = nord),
// og mesh-en roteres -90° om X så den legger seg flatt med nord mot -Z.
function useLandGeometry(shape: [number, number][]) {
    return useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(shape[0][0], shape[0][1]);
        for (let i = 1; i < shape.length; i++) s.lineTo(shape[i][0], shape[i][1]);
        s.closePath();
        const geo = new THREE.ExtrudeGeometry(s, {
            depth: 0.45,
            bevelEnabled: true,
            bevelThickness: 0.06,
            bevelSize: 0.06,
            bevelSegments: 1,
        });
        geo.computeVertexNormals();
        return geo;
    }, [shape]);
}

function LandZone({
    region,
    state,
    highlight,
    onSelect,
}: {
    region: Region;
    state: InteractiveState;
    highlight: boolean;
    onSelect: () => void;
}) {
    const geometry = useLandGeometry(region.shape);
    return (
        <Interactive onSelect={onSelect} state={state === 'idle' ? undefined : state} hoverScale={1}>
            {(s) => {
                const glow = s === 'correct' ? '#10b981' : s === 'hover' || highlight ? '#facc15' : '#000000';
                const glowInt = s === 'correct' ? 0.55 : s === 'hover' ? 0.35 : highlight ? 0.4 : 0;
                return (
                    <mesh
                        geometry={geometry}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, 0.02, 0]}
                        castShadow
                        receiveShadow
                    >
                        <meshStandardMaterial
                            color={fillFor(s, region.base)}
                            emissive={glow}
                            emissiveIntensity={glowInt}
                            roughness={0.82}
                            flatShading
                        />
                    </mesh>
                );
            }}
        </Interactive>
    );
}

function NorthArrow() {
    // Enkel nord-peker ute på havet i nordvest: en kjegle som peker mot -Z (nord).
    return (
        <group position={[-2.9, 0.5, -5.6]}>
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

// R3F-hooker som useShake (via useFrame) må kjøre i en komponent inne i
// MicroCanvas - derfor er selve kartscenen splittet ut hit, mens
// MaalmerkeKartet3D (utenfor Canvas) bare eier spilltilstanden.
function Scene({
    solvedRegions,
    wrongRegion,
    current,
    hint,
    burst,
    burstPos,
    shakeTrigger,
    onSelect,
}: {
    solvedRegions: string[];
    wrongRegion: string | null;
    current: Merke | null;
    hint: number;
    burst: number;
    burstPos: [number, number, number];
    shakeTrigger: number;
    onSelect: (regionId: string) => void;
}) {
    const { ref: shakeRef, shake } = useShake();
    const prevShakeTrigger = useRef(shakeTrigger);
    useEffect(() => {
        if (shakeTrigger !== prevShakeTrigger.current) {
            prevShakeTrigger.current = shakeTrigger;
            shake(0.6);
        }
    }, [shakeTrigger, shake]);

    const zoneState = (regionId: string): InteractiveState => {
        if (solvedRegions.includes(regionId)) return 'correct';
        if (wrongRegion === regionId) return 'wrong';
        return 'idle';
    };

    return (
        <group ref={shakeRef}>
            {/* Havet rundt kartet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, -0.05, -1.5]} receiveShadow>
                <planeGeometry args={[34, 44]} />
                <meshStandardMaterial color="#8ec5e6" roughness={0.9} />
            </mesh>
            {REGIONS.map((r) => (
                <LandZone
                    key={r.id}
                    region={r}
                    state={zoneState(r.id)}
                    highlight={hint > 0 && current?.region === r.id && !solvedRegions.includes(r.id)}
                    onSelect={() => onSelect(r.id)}
                />
            ))}
            <NorthArrow />
            <Burst position={burstPos} trigger={burst} color="#34d399" count={26} spread={3} />
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
    const [shakeTrigger, setShakeTrigger] = useState(0);
    const { play } = useStepSounds();

    const current = step < MERKER.length ? MERKER[step] : null;
    const hint = useHintEscalation({ active: !!current && !done, resetKey: step, max: 1, stepMs: 9000 });

    const solvedRegions = MERKER.filter((m) => solved.includes(m.id)).map((m) => m.region);

    const handleClick = (regionId: string) => {
        if (!current || done) return;
        if (solvedRegions.includes(regionId)) return;
        if (regionId === current.region) {
            const region = REGIONS.find((r) => r.id === regionId)!;
            // Kart-sentrum → scene-koordinat: z = -nord.
            setBurstPos([region.center[0], 1.4, -region.center[1]]);
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
            setShakeTrigger((s) => s + 1);
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

    const banner = done
        ? null
        : current
          ? `Klikk landsdelen som er mest kjent for: ${current.label} (${current.eksempel})`
          : null;

    const revealed = MERKER.filter((m) => solved.includes(m.id));

    const scene = (
        <Scene
            solvedRegions={solvedRegions}
            wrongRegion={wrongRegion}
            current={current}
            hint={hint}
            burst={burst}
            burstPos={burstPos}
            shakeTrigger={shakeTrigger}
            onSelect={handleClick}
        />
    );

    return (
        <MicroGameScaffold
            title="Målmerke-kartet"
            subtitle="Plasser hvert målmerke på riktig landsdel."
            estimatedSeconds={110}
            onRetry={reset}
            scene={scene}
            canvas={{ camera: { position: [1.2, 14, 11], fov: 40 }, target: [1.0, 0, -1.4], background: '#cfe7f5' }}
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
