import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    Fire,
    ChoiceRow,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    Burst,
    damp,
    type ChoiceItem,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om høytider og kultur.
// Lyspære-øyeblikket: fire religioner, fire høytider - men ALLE feirer med lys,
// samling og glede. Eleven tenner lysene på hvert høytidsbord og ser bordet
// lyse opp. Når alle fire er tent, sitter innsikten: lys og fest er felles for
// mennesker, på tvers av tro.

type CelebId = 'jul' | 'hanukka' | 'divali' | 'eid';

interface Celebration {
    id: CelebId;
    name: string;
    religion: string;
    glow: string;
    fact: string;
    // posisjoner for de tre lysene på bordet
    lights: [number, number, number][];
}

const TABLE_Y = 0;
const L: [number, number, number][] = [
    [-1.15, TABLE_Y, 0.5],
    [0, TABLE_Y, 0.85],
    [1.15, TABLE_Y, 0.5],
];

const CELEBRATIONS: Celebration[] = [
    {
        id: 'jul',
        name: 'Jul',
        religion: 'Kristendom',
        glow: '#ff8a4a',
        fact: 'I julen feirer kristne at Jesus ble født. Lys i mørket er selve symbolet på høytiden.',
        lights: L,
    },
    {
        id: 'hanukka',
        name: 'Hanukka',
        religion: 'Jødedom',
        glow: '#7aa6ff',
        fact: 'Hanukka er den jødiske lysfesten. Hver kveld tennes et nytt lys i den åtte-armede staken.',
        lights: L,
    },
    {
        id: 'divali',
        name: 'Divali',
        religion: 'Hinduisme',
        glow: '#ffb347',
        fact: 'Divali er hinduenes lysfest. Små oljelamper, diya, settes ut for at lyset skal vinne over mørket.',
        lights: L,
    },
    {
        id: 'eid',
        name: 'Id',
        religion: 'Islam',
        glow: '#5fcf8a',
        fact: 'Etter fastemåneden ramadan feirer muslimer id med lykter, god mat og besøk hos familie.',
        lights: L,
    },
];

const FestensLys3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [active, setActive] = useState(0);
    const [lit, setLit] = useState<Record<CelebId, boolean[]>>({
        jul: [false, false, false],
        hanukka: [false, false, false],
        divali: [false, false, false],
        eid: [false, false, false],
    });
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [touched, setTouched] = useState(false);
    const [won, setWon] = useState(false);
    const doneRef = useRef(false);

    const celeb = CELEBRATIONS[active];
    const celebDone = (id: CelebId) => lit[id].every(Boolean);
    const totalLit = CELEBRATIONS.reduce(
        (sum, c) => sum + lit[c.id].filter(Boolean).length,
        0
    );

    const lightUp = (index: number) => {
        setTouched(true);
        if (lit[celeb.id][index]) return;
        const next = { ...lit, [celeb.id]: lit[celeb.id].map((v, i) => (i === index ? true : v)) };
        setLit(next);
        sounds.play('pick');
        if (next[celeb.id].every(Boolean)) {
            setBurst((b) => b + 1);
            setBanner(`${celeb.name} lyser! ${celeb.religion} feirer med lys.`);
            sounds.play('advance');
            if (CELEBRATIONS.every((c) => next[c.id].every(Boolean)) && !doneRef.current) {
                doneRef.current = true;
                setTimeout(() => {
                    setWon(true);
                    sounds.play('complete');
                    onComplete({ score: 1, completed: true });
                }, 700);
            }
        } else {
            setBanner('Tenn de andre lysene på bordet.');
        }
    };

    const switchCeleb = (id: string) => {
        const idx = CELEBRATIONS.findIndex((c) => c.id === id);
        if (idx === active) return;
        setActive(idx);
        setBanner(null);
        setTouched(true);
        sounds.play('sceneChange');
    };

    const reset = () => {
        setActive(0);
        setLit({
            jul: [false, false, false],
            hanukka: [false, false, false],
            divali: [false, false, false],
            eid: [false, false, false],
        });
        setBanner(null);
        setTouched(false);
        setWon(false);
        doneRef.current = false;
    };

    const items: ChoiceItem[] = CELEBRATIONS.map((c, i) => ({
        id: c.id,
        title: c.name,
        blurb: c.religion,
        status: celebDone(c.id) ? 'done' : i === active ? 'active' : 'available',
    }));

    const idle = !touched;

    return (
        <MicroGameScaffold
            title="Festens lys"
            subtitle="Fire religioner, fire høytider - tenn lysene og se hva de har felles"
            estimatedSeconds={140}
            onRetry={touched ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#3a2a4d] via-[#5a4368] to-[#caa07a]"
            canvas={{
                idle,
                autoRotateSpeed: 0.25,
                camera: { position: [0, 3.1, 6.2], fov: 42 },
                background: '#2e2140',
                fog: { color: '#3a2a4d', near: 14, far: 42 },
                target: [0, 0.5, 0],
                maxPolarAngle: Math.PI / 2.05,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {celeb.name} · {celeb.religion}
                    </SceneBadge>
                    <DragHint show={idle}>Trykk de mørke lysene på bordet for å tenne dem</DragHint>
                </>
            }
            scene={
                <FestScene
                    celeb={celeb}
                    lit={lit[celeb.id]}
                    totalLit={totalLit}
                    burst={burst}
                    onLight={lightUp}
                />
            }
        >
            {won ? (
                <WinScreen title="Alle bordene lyser!" onReplay={reset}>
                    Fire religioner og fire helt ulike høytider - men alle feirer med lys, god mat og
                    samling. Lyset i mørket betyr håp og glede for mennesker overalt. Derfor kjenner
                    vi oss ofte igjen i hverandres fester, selv om vi tror på ulike ting.
                </WinScreen>
            ) : (
                <div className="flex flex-col gap-3">
                    <ChoiceRow items={items} onSelect={switchCeleb} />
                    <SceneFact>
                        <span className="font-bold text-slate-800">{celeb.name}:</span> {celeb.fact}
                    </SceneFact>
                    <p className="text-xs text-slate-500">
                        Tenn alle lysene på hvert bord. Bytt høytid med kortene over.
                    </p>
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN - et høytidsbord i et varmt rom
// ============================================================

interface SceneProps {
    celeb: Celebration;
    lit: boolean[];
    totalLit: number;
    burst: number;
    onLight: (index: number) => void;
}

function FestScene({ celeb, lit, totalLit, burst, onLight }: SceneProps) {
    const warmLight = useRef<THREE.PointLight>(null);

    useFrame((_, dt) => {
        if (warmLight.current) {
            // Rommet blir varmere og lysere jo flere lys som er tent.
            const target = 0.6 + totalLit * 0.42;
            warmLight.current.intensity = damp(warmLight.current.intensity, target, dt, 3);
            warmLight.current.color.lerp(new THREE.Color(celeb.glow), Math.min(1, dt * 2));
        }
    });

    return (
        <group>
            {/* Varmt rom-lys som vokser med antall tente lys */}
            <pointLight ref={warmLight} position={[0, 2.6, 1.5]} color={celeb.glow} distance={16} intensity={0.6} />

            <WarmRoom />

            {/* Bordet */}
            <group position={[0, -0.45, 0]}>
                <mesh receiveShadow castShadow position={[0, 0.25, 0]}>
                    <boxGeometry args={[3.6, 0.22, 2.4]} />
                    <meshStandardMaterial color="#7a4a2c" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.36, 0]}>
                    <boxGeometry args={[3.4, 0.04, 2.2]} />
                    <meshStandardMaterial color="#caa57a" roughness={0.7} />
                </mesh>
                {/* bordbein */}
                {[
                    [-1.6, -0.2, 1.0],
                    [1.6, -0.2, 1.0],
                    [-1.6, -0.2, -1.0],
                    [1.6, -0.2, -1.0],
                ].map((p, i) => (
                    <mesh key={i} position={p as [number, number, number]}>
                        <boxGeometry args={[0.18, 0.9, 0.18]} />
                        <meshStandardMaterial color="#5e3720" roughness={0.85} />
                    </mesh>
                ))}
            </group>

            {/* Senterpynt som forteller hvilken høytid det er */}
            <group position={[0, 0, -0.55]}>
                <Centerpiece celeb={celeb} />
            </group>

            {/* De tre lysene */}
            {celeb.lights.map((p, i) => (
                <Candle
                    key={i}
                    position={[p[0], -0.07, p[2]]}
                    lit={lit[i]}
                    color={celeb.glow}
                    onClick={() => onLight(i)}
                />
            ))}

            <Burst position={[0, 0.6, 0]} trigger={burst} color="#ffe7a8" count={34} spread={3} />
        </group>
    );
}

// Et lys: stake + flamme. Uten flamme vises en pulserende Hotspot over toppen.
function Candle({
    position,
    lit,
    color,
    onClick,
}: {
    position: [number, number, number];
    lit: boolean;
    color: string;
    onClick: () => void;
}) {
    return (
        <group position={position}>
            <mesh position={[0, 0.18, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.12, 0.36, 16]} />
                <meshStandardMaterial color="#f4ecd8" roughness={0.6} />
            </mesh>
            <Fire position={[0, 0.42, 0]} scale={0.42} lit={lit} />
            {lit && (
                <mesh position={[0, 0.42, 0]}>
                    <sphereGeometry args={[0.4, 12, 12]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.22}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            )}
            {!lit && (
                <Hotspot position={[0, 0.7, 0]} onSelect={onClick} label="Tenn" radius={0.32} />
            )}
        </group>
    );
}

// Ulik senterpynt per høytid - billig, men gjenkjennelig.
function Centerpiece({ celeb }: { celeb: Celebration }) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (grp.current) grp.current.rotation.y += dt * 0.2;
    });

    if (celeb.id === 'jul') {
        return (
            <group>
                {[0.0, 0.45, 0.85].map((y, i) => (
                    <mesh key={i} position={[0, 0.5 + y, 0]} castShadow>
                        <coneGeometry args={[0.7 - i * 0.18, 0.5, 12]} />
                        <meshStandardMaterial color="#2f7d4f" roughness={0.8} />
                    </mesh>
                ))}
                <mesh position={[0, 1.55, 0]}>
                    <sphereGeometry args={[0.12, 8, 8]} />
                    <meshStandardMaterial color="#ffd24a" emissive="#ffb000" emissiveIntensity={0.8} />
                </mesh>
            </group>
        );
    }

    if (celeb.id === 'hanukka') {
        // ni-armet stake (menorah): midtstamme + armer i ulik høyde
        const arms = [-2, -1, 0, 1, 2];
        return (
            <group position={[0, 0.45, 0]}>
                <mesh position={[0, 0.1, 0]}>
                    <boxGeometry args={[1.6, 0.1, 0.18]} />
                    <meshStandardMaterial color="#caa24a" metalness={0.6} roughness={0.3} />
                </mesh>
                {arms.map((a) => {
                    const h = 0.6 + Math.abs(a) * 0.0;
                    return (
                        <mesh key={a} position={[a * 0.32, 0.1 + h / 2, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, h, 10]} />
                            <meshStandardMaterial color="#caa24a" metalness={0.6} roughness={0.3} />
                        </mesh>
                    );
                })}
                <mesh position={[0, 0.85, 0]}>
                    <sphereGeometry args={[0.07, 8, 8]} />
                    <meshStandardMaterial color="#ffd24a" emissive="#ffb000" emissiveIntensity={0.6} />
                </mesh>
            </group>
        );
    }

    if (celeb.id === 'divali') {
        // rangoli: en flat gull-ring med en liten kuppel-lampe i midten
        return (
            <group ref={grp} position={[0, 0.5, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.55, 0.07, 12, 36]} />
                    <meshStandardMaterial color="#d98a2b" metalness={0.4} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.1, 0]}>
                    <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#caa24a" metalness={0.5} roughness={0.3} />
                </mesh>
            </group>
        );
    }

    // eid: stående måne-ring + en liten stjerne
    return (
        <group position={[0, 0.7, 0]}>
            <mesh rotation={[0, 0, 0.4]}>
                <torusGeometry args={[0.5, 0.09, 12, 32]} />
                <meshStandardMaterial color="#caa24a" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0.55, 0.5, 0]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshStandardMaterial color="#ffe082" emissive="#ffc04a" emissiveIntensity={0.7} />
            </mesh>
        </group>
    );
}

// Et lunt rom: gulv + bakvegg, holdt varmt og dunkelt slik at lysene betyr noe.
function WarmRoom() {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color="#3b2c2a" roughness={0.95} />
            </mesh>
            <mesh position={[0, 2.2, -6]}>
                <planeGeometry args={[40, 18]} />
                <meshStandardMaterial color="#4a3550" roughness={1} />
            </mesh>
        </group>
    );
}

export default FestensLys3D;
