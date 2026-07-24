import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    GroundPlane,
    Column,
    Rock,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    StepTracker,
    Impact,
    Burst,
    Particles,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til "Den trojanske krig".
// Eleven graver ut haugen Hisarlik lag for lag, akkurat slik arkeologene gjorde.
// Lyspære: byen Troja er ikke ett lag, men mange byer stablet oppå hverandre.
// Krigslaget (Troja VIIa) ligger langt nede. Schliemann gravde i 1873 for fort og
// for dypt, og han sprengte seg rett forbi nettopp dette laget, ned til Troja II,
// som var nesten 1000 år for gammelt. Eleven må grave forsiktig, ett lag av gangen,
// og stoppe ved brannlaget for å finne krigssporene.
//
// Mekanikk (grav-fram/avdekk): klikk det øverste laget for å fjerne det varsomt.
// For hvert klikk kommer en eldre by til syne. Når krigslaget VIIa ligger øverst,
// blir klikket til en "undersøk"-handling som vinner spillet.

interface LayerSpec {
    navn: string;
    dato: string;
    farge: string;
    desc: string;
    target?: boolean;
}

// Lagene i haugen, ovenfra og ned. Ekte rekkefølge, forenklet for et 14-års blikk.
const LAYERS: LayerSpec[] = [
    {
        navn: 'Overflaten',
        dato: 'i dag',
        farge: '#728f4c',
        desc: 'Jord og gress. Ingen by her, fjern det øverste laget for å komme i gang.',
    },
    {
        navn: 'Troja IX',
        dato: 'ca. 85 fvt til 500 evt',
        farge: '#caa863',
        desc: 'En romersk by lå øverst. Alt i antikken kom folk hit for å se "Troja".',
    },
    {
        navn: 'Troja VIII',
        dato: 'ca. 700 til 85 fvt',
        farge: '#b98c53',
        desc: 'En gresk by. Fortsatt altfor ung til å være byen fra Homers dikt.',
    },
    {
        navn: 'Troja VIIa',
        dato: 'ca. 1250 til 1150 fvt',
        farge: '#a94e37',
        desc: 'Brannlag, pilspisser og ubegravde skjeletter. Dette laget ble ødelagt av krig, og mange forskere mener det kan være Homers Troja.',
        target: true,
    },
    {
        navn: 'Troja VI',
        dato: 'ca. 1700 til 1250 fvt',
        farge: '#9a8360',
        desc: 'En mektig by med høye murer som endte i et kraftig jordskjelv.',
    },
    {
        navn: 'Troja II',
        dato: 'ca. 2550 til 2300 fvt',
        farge: '#c8a94f',
        desc: 'Her fant Schliemann "Priams skatt" i 1873. Men gullet var nesten 1000 år for gammelt til å tilhøre Homers Troja.',
    },
];

const TARGET = 3; // indeksen til krigslaget Troja VIIa
const H = 0.6; // høyden på hvert lag
const BASE_Y = 0.28; // senter-y for nederste lag; bunnen flukter med GroundPlane (y -0.02)
const N = LAYERS.length;

// y-senter for laget med array-indeks i (0 = øverst). Nederste lag ligger lavest.
function layerY(i: number): number {
    const levelFromBottom = N - 1 - i;
    return BASE_Y + levelFromBottom * H;
}

const TrojaUtgravning3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [dug, setDug] = useState(0); // hvor mange lag som er fjernet ovenfra
    const [won, setWon] = useState(false);
    const [banner, setBanner] = useState<string | null>(
        'Klikk det øverste laget for å grave det varsomt bort. Grav deg ned til krigslaget.'
    );
    const [digFx, setDigFx] = useState(0);
    const [winBurst, setWinBurst] = useState(0);

    const top = LAYERS[Math.min(dug, N - 1)];
    const atWarLayer = dug === TARGET;

    const reset = () => {
        setDug(0);
        setWon(false);
        setBanner(
            'Klikk det øverste laget for å grave det varsomt bort. Grav deg ned til krigslaget.'
        );
    };

    const handleTop = () => {
        if (won) return;
        if (atWarLayer) {
            // Undersøk krigslaget, seier.
            setWon(true);
            setWinBurst((b) => b + 1);
            sounds.play('complete');
            setBanner(null);
            setTimeout(() => onComplete({ score: 1, completed: true }), 250);
            return;
        }
        // Grav bort det øverste laget og avdekk det neste.
        const next = dug + 1;
        setDug(next);
        setDigFx((d) => d + 1);
        const revealed = LAYERS[next];
        if (revealed.target) {
            sounds.play('correct');
            setBanner(
                'Se! Brannlag, aske og pilspisser. Klikk laget en gang til for å undersøke krigssporene.'
            );
        } else {
            sounds.play('advance');
            setBanner(`Du gravde bort ${LAYERS[dug].navn}. Under ligger ${revealed.navn}.`);
        }
    };

    const topY = layerY(dug);

    return (
        <MicroGameScaffold
            title="Grav ut Troja"
            subtitle="Byen er ikke ett sted, men mange byer stablet oppå hverandre. Grav deg ned til krigslaget."
            estimatedSeconds={140}
            onRetry={dug > 0 || won ? reset : undefined}
            canvas={{
                idle: dug === 0 && !won,
                camera: { position: [7.5, 5.2, 9.5], fov: 42 },
                background: '#dfe7ec',
                fog: { near: 22, far: 52 },
                target: [0, 1.4, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {won ? 'Krigslaget funnet' : `${top.navn} - ${top.dato}`}
                    </SceneBadge>
                </>
            }
            scene={
                <DigSite
                    dug={dug}
                    won={won}
                    atWarLayer={atWarLayer}
                    topY={topY}
                    digFx={digFx}
                    winBurst={winBurst}
                    onDig={handleTop}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!won && <StepTracker current={dug} total={TARGET + 1} />}
                {!won ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Klikk den pulserende ringen over haugen for å fjerne ett jordlag om
                            gangen. Hvert lag er en egen by. Grav deg forsiktig ned til{' '}
                            <span className="font-bold text-rose-700">krigslaget Troja VIIa</span> og
                            stopp der.
                        </p>
                        <SceneFact>
                            <span className="font-semibold">{top.navn}</span> ({top.dato}):{' '}
                            {top.desc}
                        </SceneFact>
                    </>
                ) : (
                    <WinScreen title="Du fant krigslaget Troja VIIa!" onReplay={reset}>
                        Brannspor, pilspisser og ubegravde skjeletter viser at denne byen ble
                        ødelagt i kamp rundt 1180 fvt. Legg merke til at det ligger mange byer over
                        og under. Da Heinrich Schliemann gravde i 1873, dro han altfor fort rett
                        forbi dette laget og helt ned til Troja II. Der fant han gull han kalte
                        "Priams skatt", men det var nesten 1000 år for gammelt. Han hadde nok ødelagt
                        det ekte krigslaget på veien ned.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function DigSite({
    dug,
    won,
    atWarLayer,
    topY,
    digFx,
    winBurst,
    onDig,
}: {
    dug: number;
    won: boolean;
    atWarLayer: boolean;
    topY: number;
    digFx: number;
    winBurst: number;
    onDig: () => void;
}) {
    return (
        <group>
            {/* Slettelandet rundt utgravningen */}
            <GroundPlane size={44} depth={40} color="#cdbf96" />

            {/* Et par ruinbiter ved siden av haugen, antyder en utgravning */}
            <Column position={[4.7, 0, 2.4]} height={1.7} color="#d8cdb0" />
            <Rock position={[-4.4, 0, 2.8]} color="#b7ac90" scale={1.1} />
            <Rock position={[4.2, 0, -2.6]} color="#b0a68d" scale={0.9} />

            {/* Haugen: lagene som ennå står (fra det øverste udugde til bunnen) */}
            {LAYERS.map((layer, i) => {
                if (i < dug) return null; // gravd bort
                const isTop = i === dug;
                const isWar = Boolean(layer.target);
                return (
                    <LayerSlab
                        key={layer.navn}
                        index={i}
                        layer={layer}
                        isTop={isTop}
                        highlight={isTop && isWar}
                    />
                );
            })}

            {/* Støvsky når et lag graves bort */}
            <Impact preset="dustPuff" trigger={digFx} position={[0, topY, 1.4]} />

            {/* Glødende gnister og feiring ved krigslaget */}
            {atWarLayer && !won && (
                <Particles preset="embers" center={[0, topY + 0.4, 0]} area={[4, 3.4]} height={2} />
            )}
            <Burst
                position={[0, topY + 0.4, 0]}
                trigger={winBurst}
                color="#f4c56a"
                count={30}
                spread={3}
            />

            {/* Klikk-ringen over det øverste laget */}
            {!won && (
                <Hotspot
                    position={[0, topY + 1.0, 0]}
                    onSelect={onDig}
                    label={atWarLayer ? 'Undersøk krigslaget' : 'Grav forsiktig'}
                    radius={0.62}
                    color={atWarLayer ? '#b91c1c' : '#a16207'}
                />
            )}
        </group>
    );
}

// Ett jordlag i haugen: en bred, flat blokk. Krigslaget får varm glød og funn.
function LayerSlab({
    index,
    layer,
    isTop,
    highlight,
}: {
    index: number;
    layer: LayerSpec;
    isTop: boolean;
    highlight: boolean;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const width = 6.2 - (N - 1 - index) * 0.18; // svakt smalere mot toppen (haug-form)
    const depth = 5.0 - (N - 1 - index) * 0.14;
    const y = layerY(index);

    useFrame((_, dt) => {
        if (!mat.current) return;
        const targetEmissive = highlight ? 0.5 : isTop ? 0.12 : 0;
        mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, targetEmissive, dt, 4);
    });

    return (
        <group position={[0, y, 0]}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[width, H, depth]} />
                <meshStandardMaterial
                    ref={mat}
                    color={layer.farge}
                    roughness={1}
                    flatShading
                    emissive={highlight ? '#ff5a2c' : '#000000'}
                    emissiveIntensity={0}
                />
            </mesh>

            {/* Krigslaget: spredte pilspisser og et mørkt brannbelte */}
            {highlight && (
                <group position={[0, H / 2 + 0.02, 0]}>
                    <Arrowhead position={[-1.3, 0, 0.9]} rot={0.6} />
                    <Arrowhead position={[0.7, 0, -0.4]} rot={-0.9} />
                    <Arrowhead position={[1.6, 0, 1.1]} rot={1.7} />
                    {/* askestripe langs framkanten - stikker litt utenfor flaten
                        slik at den ikke z-fighter med lagets front */}
                    <mesh position={[0, -H / 2 + 0.03, depth / 2 + 0.01]}>
                        <boxGeometry args={[width, 0.08, 0.06]} />
                        <meshStandardMaterial color="#2f231b" roughness={1} />
                    </mesh>
                </group>
            )}

            {/* Troja II nederst: et lite gullglimt (Priams skatt) */}
            {index === N - 1 && (
                <mesh position={[1.4, H / 2 + 0.05, 1.2]} castShadow>
                    <boxGeometry args={[0.28, 0.14, 0.2]} />
                    <meshStandardMaterial
                        color="#e8c65a"
                        metalness={0.6}
                        roughness={0.3}
                        emissive="#8a6b12"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            )}
        </group>
    );
}

// En liten pilspiss som stikker opp av krigslaget.
function Arrowhead({ position, rot }: { position: [number, number, number]; rot: number }) {
    return (
        <mesh position={position} rotation={[Math.PI / 2, 0, rot]} castShadow>
            <coneGeometry args={[0.09, 0.34, 4]} />
            <meshStandardMaterial color="#8a7c63" metalness={0.4} roughness={0.6} flatShading />
        </mesh>
    );
}

export default TrojaUtgravning3D;
