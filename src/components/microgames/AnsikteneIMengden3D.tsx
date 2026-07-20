import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    StepTracker,
    GroundPlane,
    Figure,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: "Ansiktene i mengden". Dehumanisering -> re-humanisering.
// En gruppe er gjort om til grå, ansiktsløse, like skikkelser med et mørkt
// propaganda-symbol svevende over seg - "dem". Eleven klikker hver skikkelse,
// og den blir et unikt menneske: egen farge, ansikt og en liten detalj som
// skiller den fra de andre. Etter hvert som ansiktene kommer fram, smuldrer
// propaganda-symbolet, muren mellom "oss" og "dem" synker, og gruppene blandes.
// Lyspære: det er vanskelig å hate dem du ser som enkeltmennesker.

const N = 6;

// Individuelle farger og hudtoner skikkelsene får når de blir sett som mennesker.
const INDIVIDUALS: { body: string; skin: string; hat: string }[] = [
    { body: '#3f7cc4', skin: '#e8c39e', hat: '#e2574c' },
    { body: '#c98a2b', skin: '#b6815a', hat: '#5aa469' },
    { body: '#5aa469', skin: '#f0d2b0', hat: '#6c5ce7' },
    { body: '#b5546f', skin: '#caa17a', hat: '#f2b705' },
    { body: '#6c5ce7', skin: '#e8c39e', hat: '#e2574c' },
    { body: '#2fa3a3', skin: '#9c6f4a', hat: '#3f7cc4' },
];

const GREY_BODY = new THREE.Color('#8d949c');
const GREY_HEAD = new THREE.Color('#9aa0a7');

// Rutenett-posisjon for "dem" (høyre side), tett pakket og likt.
const GRID: [number, number][] = [
    [3.0, -1.2],
    [4.4, -1.2],
    [3.0, 0.0],
    [4.4, 0.0],
    [3.0, 1.2],
    [4.4, 1.2],
];

// "oss" - allerede menneskelige, varierte skikkelser på venstre side.
const OSS = [
    { pos: [-4.4, 0, -1.0] as [number, number, number], body: '#c4622d', skin: '#e8c39e' },
    { pos: [-3.0, 0, -0.2] as [number, number, number], body: '#3b6e4f', skin: '#caa17a' },
    { pos: [-4.6, 0, 1.1] as [number, number, number], body: '#7a5ea8', skin: '#f0d2b0' },
    { pos: [-3.2, 0, 1.4] as [number, number, number], body: '#b5546f', skin: '#9c6f4a' },
];

const AnsikteneIMengden3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [humanized, setHumanized] = useState<boolean[]>(() => Array(N).fill(false));
    const [burst, setBurst] = useState(0);
    const [bannerBurst, setBannerBurst] = useState(0);
    const [won, setWon] = useState(false);

    const count = humanized.filter(Boolean).length;
    const fraction = count / N;

    const [banner, setBanner] = useState<string | null>(
        'Klikk de grå skikkelsene og se menneskene bak merkelappen.'
    );

    const humanize = (i: number) => {
        if (humanized[i] || won) return;
        sounds.play('correct');
        setBurst((b) => b + 1);
        setHumanized((prev) => {
            const next = [...prev];
            next[i] = true;
            const newCount = next.filter(Boolean).length;
            if (newCount === N) {
                setBanner(null);
                setBannerBurst((b) => b + 1);
                sounds.play('complete');
                setWon(true);
                onComplete({ score: 1, completed: true });
            } else {
                setBanner(`Du ser mennesket. ${N - newCount} igjen i skyggen.`);
            }
            return next;
        });
    };

    const reset = () => {
        setHumanized(Array(N).fill(false));
        setWon(false);
        setBanner('Klikk de grå skikkelsene og se menneskene bak merkelappen.');
    };

    return (
        <MicroGameScaffold
            title="Ansiktene i mengden"
            subtitle="Se menneskene bak merkelappen - og se skillet forsvinne"
            estimatedSeconds={110}
            onRetry={count > 0 ? reset : undefined}
            canvas={{
                idle: count === 0,
                camera: { position: [0, 5.2, 12], fov: 42 },
                background: '#e8eef5',
                target: [0, 0.8, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{won ? 'Bare mennesker' : '"Oss" og "dem"'}</SceneBadge>
                </>
            }
            scene={
                <Scene
                    humanized={humanized}
                    fraction={fraction}
                    burst={burst}
                    bannerBurst={bannerBurst}
                    onHumanize={humanize}
                />
            }
        >
            {!won ? (
                <div className="flex flex-col gap-3">
                    <StepTracker current={count} total={N} />
                    <SceneFact>
                        Dehumanisering gjør en gruppe om til en ansiktsløs masse - "de andre". Det
                        senker terskelen for hat. Klikk en skikkelse for å se enkeltmennesket bak.
                    </SceneFact>
                </div>
            ) : (
                <WinScreen title="Skillet smuldret bort" onReplay={reset}>
                    Da ansiktene kom fram, ble "de andre" til seks ulike mennesker - hver med sin
                    egen farge og historie. Propagandaen mister grepet, og muren mellom "oss" og
                    "dem" synker. Det er vanskelig a hate dem du ser som enkeltmennesker. Derfor er
                    det å se hverandre en av de sterkeste motkreftene mot hat og folkemord.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Scene({
    humanized,
    fraction,
    burst,
    bannerBurst,
    onHumanize,
}: {
    humanized: boolean[];
    fraction: number;
    burst: number;
    bannerBurst: number;
    onHumanize: (i: number) => void;
}) {
    return (
        <group>
            <GroundPlane color="#cdd6e0" size={40} />

            {/* "oss" - allerede mennesker */}
            {OSS.map((p, i) => (
                <Figure key={`oss-${i}`} position={p.pos} body={p.body} skin={p.skin} />
            ))}

            {/* Muren mellom oss og dem - synker etter hvert som ansiktene kommer fram */}
            <Wall fraction={fraction} />

            {/* "dem" - grå, like, ansiktsløse til de blir sett */}
            {GRID.map(([x, z], i) => (
                <CrowdFigure
                    key={`dem-${i}`}
                    index={i}
                    humanized={humanized[i]}
                    baseX={x}
                    z={z}
                    onSelect={() => onHumanize(i)}
                    burst={burst}
                />
            ))}

            {/* Propaganda-symbolet som svever over "dem" og smuldrer bort */}
            <PropagandaMark fraction={fraction} />

            {/* Sluttburst når symbolet smuldrer helt */}
            <Burst
                position={[3.7, 2.2, 0]}
                trigger={bannerBurst}
                color="#94a3b8"
                count={30}
                spread={3}
            />
        </group>
    );
}

// Lav mur som deler torget. Synker ned i bakken etter hvert som skillet løses opp.
function Wall({ fraction }: { fraction: number }) {
    const grp = useRef<THREE.Group>(null);
    const y = useRef(0);
    useFrame((_, dt) => {
        if (!grp.current) return;
        y.current = damp(y.current, -fraction * 1.4, dt, 3);
        grp.current.position.y = y.current;
    });
    return (
        <group ref={grp}>
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 1.1, 5.5]} />
                <meshStandardMaterial color="#9aa3ad" roughness={0.95} />
            </mesh>
        </group>
    );
}

// Et mørkt, kantete propaganda-symbol med et rødt "øye". Krymper og synker
// etter hvert som folk blir sett som mennesker.
function PropagandaMark({ fraction }: { fraction: number }) {
    const grp = useRef<THREE.Group>(null);
    const s = useRef(1);
    const rot = useRef(0);
    useFrame((_, dt) => {
        if (!grp.current) return;
        const target = Math.max(0, 1 - fraction);
        s.current = damp(s.current, target, dt, 3);
        rot.current += dt * (0.3 + fraction * 1.6);
        grp.current.scale.setScalar(Math.max(0.0001, s.current));
        grp.current.position.y = 3.4 - (1 - s.current) * 1.5;
        grp.current.rotation.z = (1 - s.current) * rot.current * 0.4;
    });
    return (
        <group ref={grp} position={[3.7, 3.4, 0]}>
            {/* kantete mørk slab */}
            <mesh castShadow rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[1.3, 1.3, 0.2]} />
                <meshStandardMaterial color="#3b3f47" roughness={0.6} />
            </mesh>
            {/* rødt "øye" - hatets blikk */}
            <mesh position={[0, 0, 0.18]}>
                <sphereGeometry args={[0.26, 16, 16]} />
                <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.7} />
            </mesh>
        </group>
    );
}

// En skikkelse i "dem"-gruppen. Grå og ansiktsløs til den blir sett, da
// lerper kropp/ansikt mot en unik farge, en liten hatt-detalj vokser fram,
// og den sprer seg litt ut fra den tette, like massen.
function CrowdFigure({
    index,
    humanized,
    baseX,
    z,
    onSelect,
    burst,
}: {
    index: number;
    humanized: boolean;
    baseX: number;
    z: number;
    onSelect: () => void;
    burst: number;
}) {
    const grp = useRef<THREE.Group>(null);
    const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
    const headMat = useRef<THREE.MeshStandardMaterial>(null);
    const t = useRef(0);

    const ind = INDIVIDUALS[index];
    const targetBody = useMemo(() => new THREE.Color(ind.body), [ind.body]);
    const targetSkin = useMemo(() => new THREE.Color(ind.skin), [ind.skin]);

    // når den blir menneske, sprer den seg litt mot venstre (mot "oss") og får
    // sin egen lille plass - ikke lenger en del av den tette massen.
    const targetX = humanized ? baseX - 1.1 - (index % 2) * 0.2 : baseX;
    const targetZ = humanized ? z * 1.15 : z;

    useFrame((_, dt) => {
        if (!grp.current) return;
        t.current = damp(t.current, humanized ? 1 : 0, dt, 5);
        grp.current.position.x = damp(grp.current.position.x, targetX, dt, 4);
        grp.current.position.z = damp(grp.current.position.z, targetZ, dt, 4);
        // liten "vakne opp"-strekk
        const sc = 0.9 + t.current * 0.1;
        grp.current.scale.setScalar(sc);
        if (bodyMat.current) bodyMat.current.color.lerpColors(GREY_BODY, targetBody, t.current);
        if (headMat.current) headMat.current.color.lerpColors(GREY_HEAD, targetSkin, t.current);
    });

    return (
        <group ref={grp} position={[baseX, 0, z]}>
            {/* kropp */}
            <mesh position={[0, 0.32, 0]} castShadow>
                <cylinderGeometry args={[0.13, 0.18, 0.5, 7]} />
                <meshStandardMaterial ref={bodyMat} color="#8d949c" roughness={0.9} />
            </mesh>
            {/* hode */}
            <mesh position={[0, 0.66, 0]} castShadow>
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshStandardMaterial ref={headMat} color="#9aa0a7" roughness={0.8} />
            </mesh>
            {/* ansiktsløs grå "maske" foran hodet - forsvinner når den blir menneske */}
            {!humanized && (
                <mesh position={[0, 0.66, 0.1]}>
                    <circleGeometry args={[0.1, 16]} />
                    <meshStandardMaterial color="#6f757c" roughness={1} />
                </mesh>
            )}
            {/* individuell hatt-detalj - vokser fram */}
            <HatDetail show={humanized} color={ind.hat} />

            {/* Burst når den blir sett */}
            {humanized && (
                <Burst
                    position={[0, 0.7, 0]}
                    trigger={burst}
                    color={ind.hat}
                    count={16}
                    spread={1.6}
                />
            )}

            {/* Klikk-hotspot mens den fortsatt er ansiktsløs */}
            {!humanized && (
                <Hotspot
                    position={[0, 1.15, 0]}
                    onSelect={onSelect}
                    label="Se mennesket"
                    radius={0.42}
                />
            )}
        </group>
    );
}

// Liten farget detalj (lue) som popper fram når skikkelsen blir menneske.
function HatDetail({ show, color }: { show: boolean; color: string }) {
    const ref = useRef<THREE.Mesh>(null);
    const s = useRef(0);
    useFrame((_, dt) => {
        if (!ref.current) return;
        s.current = damp(s.current, show ? 1 : 0, dt, 8);
        ref.current.scale.setScalar(Math.max(0.0001, s.current));
    });
    return (
        <mesh ref={ref} position={[0, 0.79, 0]} castShadow>
            <coneGeometry args={[0.12, 0.16, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
    );
}

export default AnsikteneIMengden3D;
