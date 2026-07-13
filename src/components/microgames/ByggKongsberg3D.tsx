import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    Hotspot,
    GroundPlane,
    WaterPlane,
    Building,
    Tree,
    Smoke,
    Person,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    DataReadout,
    THEMES,
    GlowMaterial,
    GlowHalo,
    damp,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om Christian IV og sølvet på Kongsberg.
// Lyspære: sølvet i fjellet skapte en hel by. Uten sølvet hadde det bare vært skog.
// Eleven forvandler en tom skogsdal til gruvebyen Kongsberg, steg for steg, og ser
// innbyggertallet klatre fra null til tusener mens byen vokser rundt gruva.
//
// Mekanikk (dra + klikk direkte i 3D-verdenen):
//   Steg 0: DRA sølvklumpen ut av fjellet ned i dalen -> gruva åpner.
//   Steg 1: KLIKK hotspotet -> gruvearbeiderne får hus (gruvehyttene).
//   Steg 2: KLIKK -> smeltehytta og myntverket reiser seg (med røyk).
//   Steg 3: KLIKK -> Kongsberg kirke reiser seg. Byen står ferdig.

const TOTAL = 4; // antall byggesteg (gruve, hus, verk, kirke)
const POP = [0, 200, 2000, 5000, 8000]; // innbyggere etter hvert steg

const BANNERS = [
    'Dra sølvklumpen ut av fjellet og ned i dalen.',
    'Gruva er åpnet! Klikk der arbeiderne trenger hus.',
    'Klikk for å reise smeltehytta og myntverket.',
    'Klikk for å reise Kongsberg kirke. Da står byen ferdig.',
];

const ByggKongsberg3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const theme = THEMES.medieval;

    const [stage, setStage] = useState(0); // 0..TOTAL
    const [burst, setBurst] = useState(0);
    const [oreKey, setOreKey] = useState(0); // remount for å sende klumpen hjem
    const [banner, setBanner] = useState<string | null>(BANNERS[0]);

    const done = stage >= TOTAL;
    const idle = stage === 0;

    const reset = () => {
        setStage(0);
        setBurst(0);
        setOreKey((k) => k + 1);
        setBanner(BANNERS[0]);
    };

    const advance = () => {
        const next = stage + 1;
        setStage(next);
        setBurst((b) => b + 1);
        if (next >= TOTAL) {
            sounds.play('complete');
            setBanner(null);
            window.setTimeout(() => onComplete({ score: 1, completed: true }), 400);
        } else {
            sounds.play('advance');
            setBanner(BANNERS[next]);
        }
    };

    const handleOreSnap = () => {
        if (stage !== 0) return;
        sounds.play('correct');
        advance();
    };

    return (
        <MicroGameScaffold
            title="Bygg gruvebyen Kongsberg"
            subtitle="Finn sølvet i fjellet og se en hel by vokse fram i skogen, steg for steg."
            estimatedSeconds={140}
            onRetry={stage > 0 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [10, 7, 13], fov: 42 },
                background: theme.sky,
                fog: { color: theme.fog, near: 24, far: 52 },
                target: [0, 1.4, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Kongsberg står' : 'Kongsberg, grunnlagt 1624'}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Bygd', value: `${stage}/${TOTAL}` },
                                { label: 'Innbyggere', value: POP[stage] },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Dra sølvklumpen ned i dalen
                    </DragHint>
                </>
            }
            scene={
                <ValleyScene
                    stage={stage}
                    burst={burst}
                    oreKey={oreKey}
                    theme={theme}
                    onOreSnap={handleOreSnap}
                    onOreDrop={() => setOreKey((k) => k + 1)}
                    onBuild={advance}
                />
            }
        >
            {done ? (
                <WinScreen title="Kongsberg står ferdig!" onReplay={reset}>
                    Der det før bare var skog, ligger nå en hel by. Alt begynte med sølvåren i
                    fjellet. Sølvet trakk tusenvis av mennesker til dalen: gruvearbeidere,
                    smeltere, myntslagere og kjøpmenn. Christian IV grunnla Kongsberg i 1624, og på
                    1700-tallet var den blitt en av Norges største byer. Uten sølvet i fjellet hadde
                    det aldri blitt noen by her.
                </WinScreen>
            ) : (
                <p className="text-sm text-slate-600 leading-snug">
                    {stage === 0
                        ? 'Dra den glødende sølvklumpen ut av fjellet og ned i dalen. Da åpner gruva, og byen kan begynne å vokse.'
                        : 'Klikk på det gule punktet i dalen for å reise neste del av byen. For hvert steg klatrer innbyggertallet.'}
                </p>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function ValleyScene({
    stage,
    burst,
    oreKey,
    theme,
    onOreSnap,
    onOreDrop,
    onBuild,
}: {
    stage: number;
    burst: number;
    oreKey: number;
    theme: (typeof THEMES)['medieval'];
    onOreSnap: () => void;
    onOreDrop: () => void;
    onBuild: () => void;
}) {
    return (
        <group>
            {/* Skogsdal */}
            <GroundPlane size={56} depth={48} color={theme.ground} />
            {/* Elva som drev vannhjulene */}
            <WaterPlane position={[-9, 0.02, 2]} size={[6, 48]} color={theme.water} />

            {/* Fjellet med sølvåren */}
            <SilverMountain stone={theme.stone} opened={stage >= 1} />

            {/* Skogen rundt dalen (tynnes ut når byen vokser) */}
            <Forest leaf={theme.leaf} density={4 - stage} />

            {/* Steg 1: gruvehyttene */}
            <GrowGroup active={stage >= 2} position={[-3.4, 0, 1.6]}>
                <Building position={[0, 0, 0]} body="#7a5230" roof="#4a3420" w={1.3} h={1} d={1.2} seed={1} />
                <Building position={[1.6, 0, 0.4]} body="#83603a" roof="#4a3420" w={1.2} h={0.9} d={1.1} seed={5} />
                <Building position={[0.7, 0, 1.7]} body="#6f4a2a" roof="#4a3420" w={1.3} h={1} d={1.2} seed={9} />
                <Person position={[0.4, 0, 1]} body={theme.wood} pose="walk" />
            </GrowGroup>

            {/* Steg 2: smeltehytta og myntverket */}
            <GrowGroup active={stage >= 3} position={[3.2, 0, 1.4]}>
                <Building position={[0, 0, 0]} body="#8d8a82" roof={theme.accent} w={2} h={1.5} d={1.8} seed={2} />
                <Building position={[2, 0, 0.6]} body="#9a8f78" roof="#3a2a1a" w={1.6} h={1.2} d={1.4} seed={7} />
                {/* Røyk fra smeltehytta */}
                <Smoke origin={[0, 1.9, 0]} show={stage >= 3} color="#8a8480" count={7} />
                {/* Glødende ovn */}
                <mesh position={[0, 0.5, 1]}>
                    <boxGeometry args={[0.5, 0.5, 0.3]} />
                    <GlowMaterial color="#ff7a1a" />
                </mesh>
            </GrowGroup>

            {/* Steg 3: Kongsberg kirke */}
            <GrowGroup active={stage >= 4} position={[0, 0, 4]}>
                <Church accent={theme.accent} />
            </GrowGroup>

            {/* Burst der nye deler reiser seg */}
            <Burst position={[0, 1.8, 1.8]} trigger={burst} color="#e8dca0" count={26} spread={3} />

            {/* Steg 0: sølvklumpen eleven drar ut av fjellet */}
            {stage === 0 && (
                <Draggable
                    key={oreKey}
                    position={[0, 0.5, -4]}
                    snapPoints={[[0, 1.8]]}
                    snapRadius={3}
                    onSnap={onOreSnap}
                    onDrop={onOreDrop}
                >
                    {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh position={[0, 0.3, 0]}>
                        <boxGeometry args={[2.4, 2.2, 2.4]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <SilverOre />
                </Draggable>
            )}

            {/* Steg 1-3: klikk-hotspot for å reise neste bygg */}
            {stage >= 1 && stage < TOTAL && (
                <Hotspot
                    key={`hs-${stage}`}
                    position={HOTSPOTS[stage]}
                    onSelect={onBuild}
                    label={HOTSPOT_LABELS[stage]}
                />
            )}
        </group>
    );
}

// Hvor det neste bygget skal reises (over byggeplassen).
const HOTSPOTS: [number, number, number][] = [
    [0, 1.4, 0], // ubrukt (steg 0 bruker draggable)
    [-3, 1.4, 1.6], // gruvehyttene
    [3.2, 1.8, 1.4], // smeltehytta
    [0, 2.2, 4], // kirken
];
const HOTSPOT_LABELS = ['', 'Bygg gruvehytter', 'Bygg smeltehytta', 'Reis kirken'];

// Gruppe som vokser fram (skala 0 -> 1) fra bakken når `active`.
function GrowGroup({
    active,
    position,
    children,
}: {
    active: boolean;
    position: [number, number, number];
    children: React.ReactNode;
}) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const target = active ? 1 : 0.0001;
        const s = damp(ref.current.scale.x, target, dt, 5);
        ref.current.scale.setScalar(s);
        ref.current.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={position} scale={0.0001} visible={false}>
            {children}
        </group>
    );
}

// Fjellet med en glødende sølvåre og en mørk gruveinngang (når åpnet).
function SilverMountain({ stone, opened }: { stone: string; opened: boolean }) {
    return (
        <group position={[0, 0, -8]}>
            {/* Selve fjellet */}
            <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
                <coneGeometry args={[6, 6, 5]} />
                <meshStandardMaterial color={stone} roughness={1} flatShading />
            </mesh>
            {/* Sølvåren i berget (glød) */}
            <group position={[0.6, 3.4, 2.7]} rotation={[0.3, 0, 0.5]}>
                <mesh>
                    <boxGeometry args={[0.4, 1.8, 0.2]} />
                    <GlowMaterial color="#dfeaf2" />
                </mesh>
                <GlowHalo color="#cfe4f4" size={1.6} />
            </group>
            {/* Gruveinngang som åpner seg */}
            {opened && (
                <mesh position={[0, 0.7, 4.2]}>
                    <boxGeometry args={[1.2, 1.4, 0.6]} />
                    <meshStandardMaterial color="#1c1710" roughness={1} />
                </mesh>
            )}
        </group>
    );
}

// En glødende sølvklump på en liten treslede.
function SilverOre() {
    return (
        <group>
            <mesh position={[0, 0.1, 0]} castShadow>
                <boxGeometry args={[1.2, 0.16, 1.4]} />
                <meshStandardMaterial color="#6b4a2a" roughness={1} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
                <dodecahedronGeometry args={[0.6, 0]} />
                <meshStandardMaterial
                    color="#c9d6e0"
                    emissive="#8fa9bd"
                    emissiveIntensity={0.35}
                    roughness={0.4}
                    metalness={0.6}
                    flatShading
                />
            </mesh>
            <GlowHalo color="#d5e6f2" size={1} />
        </group>
    );
}

// Kongsberg kirke: et enkelt langt kirkeskip med tårn.
function Church({ accent }: { accent: string }) {
    return (
        <group>
            <mesh position={[0, 1, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.2, 2, 3]} />
                <meshStandardMaterial color="#e6ddc9" roughness={0.8} />
            </mesh>
            <mesh position={[0, 2.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[1.8, 1, 4]} />
                <meshStandardMaterial color={accent} roughness={0.9} />
            </mesh>
            {/* Tårn */}
            <mesh position={[0, 2.4, 1.7]} castShadow>
                <boxGeometry args={[1, 3, 1]} />
                <meshStandardMaterial color="#ded4bf" roughness={0.8} />
            </mesh>
            <mesh position={[0, 4.4, 1.7]} castShadow>
                <coneGeometry args={[0.8, 1.4, 4]} />
                <meshStandardMaterial color={accent} roughness={0.9} />
            </mesh>
        </group>
    );
}

// Skog rundt dalen. Tynnes ut når byen vokser (density synker med stage).
function Forest({ leaf, density }: { leaf: string; density: number }) {
    const spots: [number, number, number][] = [
        [-11, 0, -6],
        [11, 0, -5],
        [9, 0, 6],
        [-10, 0, 7],
        [7, 0, -9],
        [-7, 0, -10],
        [12, 0, 1],
        [-13, 0, 0],
        [5, 0, 9],
        [-5, 0, 10],
        [13, 0, -8],
        [-12, 0, -9],
    ];
    const shown = Math.max(0, Math.min(spots.length, density * 3));
    return (
        <group>
            {spots.slice(0, shown).map((p, i) => (
                <Tree key={i} position={p} leaf={leaf} seed={i + 1} />
            ))}
        </group>
    );
}

export default ByggKongsberg3D;
