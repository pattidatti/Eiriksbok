import { useState } from 'react';
import type { MicroGameProps } from './types';
import {
    MicroGameScaffold,
    SceneSlider,
    SceneQuiz,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    WinScreen,
    WaterMaterial,
    THEMES,
    microSfx,
} from './kit';

// Lyspære-øyeblikk: Arkimedes avslørte juks ved å måle hvor mye vann en gjenstand
// presset bort. Kronen og gullbarren veier akkurat like mye, men kronen er blandet
// med lettere sølv. Da må kronen være større — og en større gjenstand presser bort
// mer vann. Eleven senker begge i hvert sitt kar og SER kronen heve vannet mest.

const GREEK = THEMES.greek;

// To kar, samme tverrsnitt. Vannet starter likt. Gullbarren (rent gull, lite volum)
// hever vannet litt; kronen (samme vekt, men blandet med sølv = større volum) mer.
const BASE_WATER = 1.2;
const GOLD_RISE = 0.5;
const CROWN_RISE = 0.95;
const TANK_W = 2.2;
const TANK_H = 3.2;

function Tank({
    x,
    level,
    children,
}: {
    x: number;
    level: number;
    children: React.ReactNode;
}) {
    return (
        <group position={[x, 0, 0]}>
            {/* glassvegger (lett gjennomsiktig kasse) */}
            <mesh position={[0, TANK_H / 2, 0]}>
                <boxGeometry args={[TANK_W, TANK_H, TANK_W]} />
                <meshStandardMaterial
                    color="#cfe8f5"
                    transparent
                    opacity={0.12}
                    roughness={0.1}
                    metalness={0.1}
                />
            </mesh>
            {/* karbunn */}
            <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
                <boxGeometry args={[TANK_W, 0.08, TANK_W]} />
                <meshStandardMaterial color={GREEK.stone} />
            </mesh>
            {/* vannkropp */}
            <mesh position={[0, level / 2 + 0.08, 0]}>
                <boxGeometry args={[TANK_W - 0.12, level, TANK_W - 0.12]} />
                <meshStandardMaterial color={GREEK.water} transparent opacity={0.5} />
            </mesh>
            {/* vannoverflate med bolger */}
            <mesh position={[0, level + 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[TANK_W - 0.12, TANK_W - 0.12, 24, 24]} />
                <WaterMaterial color={GREEK.water} waveHeight={0.05} speed={0.8} />
            </mesh>
            {children}
        </group>
    );
}

function GoldBar({ y }: { y: number }) {
    return (
        <mesh position={[0, y, 0]} rotation={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.9, 0.55, 0.9]} />
            <meshStandardMaterial color="#f4c430" metalness={0.7} roughness={0.25} />
        </mesh>
    );
}

function Crown({ y }: { y: number }) {
    // Krone: en åpen gullring med takker rundt — større volum enn gullbarren.
    const spikes = [0, 1, 2, 3, 4, 5, 6, 7];
    const r = 0.72;
    return (
        <group position={[0, y, 0]}>
            <mesh castShadow>
                <cylinderGeometry args={[r, r, 0.5, 24, 1, true]} />
                <meshStandardMaterial color="#f4c430" metalness={0.7} roughness={0.25} side={2} />
            </mesh>
            {spikes.map((i) => {
                const a = (i / spikes.length) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        position={[Math.cos(a) * r, 0.42, Math.sin(a) * r]}
                        castShadow
                    >
                        <coneGeometry args={[0.1, 0.34, 6]} />
                        <meshStandardMaterial color="#f4c430" metalness={0.7} roughness={0.25} />
                    </mesh>
                );
            })}
        </group>
    );
}

function Scene({
    goldLevel,
    crownLevel,
    objY,
}: {
    goldLevel: number;
    crownLevel: number;
    objY: number;
}) {
    return (
        <group>
            {/* marmorgulv */}
            <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color={GREEK.ground} />
            </mesh>

            <Tank x={-2.6} level={goldLevel}>
                <GoldBar y={objY} />
            </Tank>
            <Tank x={2.6} level={crownLevel}>
                <Crown y={objY} />
            </Tank>
        </group>
    );
}

export default function ArkimedesKronen3D({ onComplete, onRetry }: MicroGameProps) {
    const [depth, setDepth] = useState(0); // 0..100 fra slideren
    const [answered, setAnswered] = useState(false);

    const f = depth / 100;
    const submerged = depth >= 99;

    const goldLevel = BASE_WATER + GOLD_RISE * f;
    const crownLevel = BASE_WATER + CROWN_RISE * f;
    // gjenstandene synker fra over vannet og ned i karet
    const objY = 2.9 - 1.9 * f;

    const goldDisplaced = Math.round(GOLD_RISE * 100 * f);
    const crownDisplaced = Math.round(CROWN_RISE * 100 * f);

    const banner = submerged
        ? 'Se! Kronen presset bort mer vann enn det rene gullet.'
        : depth > 5
          ? 'Senk begge helt ned i vannet.'
          : null;

    const reset = () => {
        setDepth(0);
        setAnswered(false);
        onRetry?.();
    };

    return (
        <MicroGameScaffold
            title="Arkimedes og kongens krone"
            subtitle="Senk gullbarren og kronen i vannet. De veier likt, men presser de bort like mye vann?"
            estimatedSeconds={120}
            onRetry={reset}
            scene={<Scene goldLevel={goldLevel} crownLevel={crownLevel} objY={objY} />}
            canvas={{
                camera: { position: [0, 5, 11], fov: 42 },
                background: GREEK.sky,
                fog: { color: GREEK.fog, near: 18, far: 38 },
                light: 'noon',
                target: [0, 1.6, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Syrakus, ca. 250 fvt</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Rent gull', value: goldDisplaced, unit: 'L' },
                            { label: 'Kronen', value: crownDisplaced, unit: 'L' },
                        ]}
                    />
                    <DragHint show={depth < 5} corner="bc">
                        Dra glidebryteren under vinduet
                    </DragHint>
                </>
            }
        >
            <SceneSlider
                label="Senk gjenstandene i vannet"
                min={0}
                max={100}
                step={1}
                value={depth}
                onChange={setDepth}
                valueLabel={(v) => `${v}%`}
            />

            {submerged && !answered && (
                <div className="mt-3">
                    <SceneQuiz
                        question="Kronen og gullbarren veier akkurat like mye. Hvorfor presset kronen bort mest vann?"
                        options={[
                            'Kronen er blandet med sølv. Sølv er lettere, så kronen må være større',
                            'Kronen er tyngre enn gullbarren',
                            'Vann presser hardere på gull enn på sølv',
                        ]}
                        answerIndex={0}
                        explanation="Riktig! Lik vekt, men kronen tar mer plass. En større gjenstand presser bort mer vann. Slik avslørte Arkimedes at gullsmeden hadde jukset."
                        onResult={(correct) => {
                            if (correct) {
                                setAnswered(true);
                                microSfx.play('complete');
                                onComplete({ score: 1, completed: true });
                            } else {
                                microSfx.play('incorrect');
                            }
                        }}
                    />
                </div>
            )}

            {answered && (
                <div className="mt-3">
                    <WinScreen title="Du løste kron-gåten med Arkimedes!" onReplay={reset}>
                        Med vann og fornuft, ikke gjetning, fant Arkimedes sannheten: kronen var
                        ikke rent gull. Akkurat denne tankegangen, mål og sammenlign og konkluder, er
                        kjernen i all naturvitenskap.
                    </WinScreen>
                </div>
            )}
        </MicroGameScaffold>
    );
}
