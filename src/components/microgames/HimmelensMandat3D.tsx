import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    Hotspot,
    SceneBanner,
    SceneBadge,
    SceneFact,
    DataReadout,
    DragHint,
    WinScreen,
    GroundPlane,
    Person,
    Tree,
    Fire,
    Burst,
    GlowHalo,
    GlowMaterial,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: "Himmelens mandat". Eleven spiller ut den kinesiske
// dynastisyklusen. En lysstråle av gull faller fra himmelen ned på keiserens
// palass - det er Himmelens mandat, retten til å styre. Eleven velger for hver
// keiser om han skal styre RETTFERDIG (hjelpe folket) eller GRÅDIG (kreve hard
// skatt). Rettferd løfter mandatet: rismarkene grønnes, folket jubler, palasset
// står stødig. Grådighet tapper mandatet: markene visner, folket lider, opprør
// og uro bryter ut, og til slutt trekker himmelen mandatet tilbake - palasset
// faller. Da reiser eleven et nytt dynasti som får mandatet på ny. Lyspæren:
// keiserens rett til å styre var betinget. Styrte han rettferdig, besto
// dynastiet; ble han grådig, mistet han Himmelens mandat og et nytt dynasti tok
// over. Dette er dynastisyklusen som gikk igjen i to tusen år.

type Phase = 'play' | 'fallen' | 'won';

const DYNASTIES = ['Qin', 'Han', 'Tang', 'Song', 'Ming', 'Qing'];

const START_MANDATE = 60;
const RENEW_MANDATE = 50;
const JUST_STEP = 20;
const GREEDY_STEP = 30;

function mandateLabel(m: number): string {
    if (m <= 0) return 'Mandatet tapt';
    if (m < 30) return 'Opprør og uro';
    if (m < 60) return 'Vaklende styre';
    if (m < 100) return 'Stødig rike';
    return 'Gullalder';
}

const HimmelensMandat3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [mandate, setMandate] = useState(START_MANDATE);
    const [dynasty, setDynasty] = useState(0);
    const [reign, setReign] = useState(1);
    const [phase, setPhase] = useState<Phase>('play');
    const [sawFall, setSawFall] = useState(false);
    const [burst, setBurst] = useState(0);
    const [moved, setMoved] = useState(false);

    // Sannheten om scenen: mandatstyrke 0..1. Under et fall tvinges den mot 0.
    const vis = phase === 'fallen' ? 0 : mandate / 100;
    const dynastyName = DYNASTIES[dynasty % DYNASTIES.length];

    const rule = (kind: 'just' | 'greedy') => {
        if (phase !== 'play') return;
        setMoved(true);
        const next = Math.max(
            0,
            Math.min(100, mandate + (kind === 'just' ? JUST_STEP : -GREEDY_STEP))
        );
        setMandate(next);
        if (next <= 0) {
            // Himmelen trekker mandatet tilbake - dynastiet faller.
            sounds.play('incorrect');
            setPhase('fallen');
            setSawFall(true);
            return;
        }
        sounds.play(kind === 'just' ? 'correct' : 'incorrect');
        if (next >= 100 && sawFall) {
            // Et nytt dynasti er reist til gullalder etter at syklusen snudde.
            setBurst((b) => b + 1);
            sounds.play('complete');
            setPhase('won');
            onComplete({ score: 1, completed: true, artifact: { dynasty: dynastyName } });
            return;
        }
        setReign((r) => r + 1);
    };

    const foundDynasty = () => {
        if (phase !== 'fallen') return;
        setDynasty((d) => d + 1);
        setMandate(RENEW_MANDATE);
        setReign(1);
        setPhase('play');
        sounds.play('advance');
    };

    const reset = () => {
        setMandate(START_MANDATE);
        setDynasty(0);
        setReign(1);
        setPhase('play');
        setSawFall(false);
        setMoved(false);
    };

    const banner =
        phase === 'won'
            ? null
            : phase === 'fallen'
              ? 'Himmelen har trukket mandatet tilbake. Dynastiet faller. Grunnlegg et nytt dynasti.'
              : !moved
                ? 'Klikk kornlageret for å styre rettferdig, eller skattekista for å styre grådig.'
                : mandate >= 100 && !sawFall
                  ? 'Sterkt styre! Men prøv å bli grådig - se hva som skjer med mandatet.'
                  : mandate < 30
                    ? 'Mandatet svinner. Ett grådig valg til, og himmelen tar det tilbake.'
                    : sawFall && mandate >= 60
                      ? 'Styr rettferdig videre og løft det nye dynastiet til gullalder.'
                      : null;

    return (
        <MicroGameScaffold
            title="Himmelens mandat"
            subtitle="Spill ut den kinesiske dynastisyklusen: rettferd holder mandatet, grådighet mister det"
            estimatedSeconds={150}
            onRetry={moved || dynasty > 0 ? reset : undefined}
            canvas={{
                idle: !moved,
                camera: { position: [0, 8, 15], fov: 40 },
                background: '#e6efe6',
                target: [0, 3, 0],
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {dynastyName}-dynastiet · keiser {reign}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Himmelens mandat', value: Math.round(mandate) },
                            { label: 'Tilstand', value: mandateLabel(mandate) },
                        ]}
                    />
                    <DragHint show={!moved} corner="bc">
                        Klikk kornlageret eller skattekista
                    </DragHint>
                </>
            }
            scene={
                <MandateScene
                    vis={vis}
                    phase={phase}
                    onJust={() => rule('just')}
                    onGreedy={() => rule('greedy')}
                    onFound={foundDynasty}
                    burst={burst}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {phase === 'won' ? (
                    <WinScreen title="Et nytt dynasti steg til gullalder!" onReplay={reset}>
                        Du så det selv: keiserens rett til å styre var betinget. Så lenge keiseren
                        styrte rettferdig, lyste Himmelens mandat og dynastiet besto. Ble han grådig,
                        visnet rikene, folket gjorde opprør, og himmelen tok mandatet tilbake. Da falt
                        dynastiet, og et nytt reiste seg. Denne dynastisyklusen gikk igjen i Kina i
                        nesten to tusen år.
                    </WinScreen>
                ) : phase === 'fallen' ? (
                    <>
                        <button
                            onClick={foundDynasty}
                            className="w-full rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-200"
                        >
                            Grunnlegg et nytt dynasti
                        </button>
                        <SceneFact>
                            Opprør, hungersnød og krig ble tolket som tegn på at himmelen hadde
                            trukket mandatet tilbake. En ny leder som vant, fikk mandatet - helt til
                            også han mistet det. Slik snudde syklusen om og om igjen.
                        </SceneFact>
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            <button
                                onClick={() => rule('just')}
                                className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-left transition hover:bg-emerald-100"
                            >
                                <p className="text-sm font-bold text-emerald-900">
                                    Styr rettferdig
                                </p>
                                <p className="mt-1 text-xs text-emerald-700">
                                    Senk skatten og hjelp folket. Mandatet styrkes.
                                </p>
                            </button>
                            <button
                                onClick={() => rule('greedy')}
                                className="rounded-xl border-2 border-rose-300 bg-rose-50 px-4 py-3 text-left transition hover:bg-rose-100"
                            >
                                <p className="text-sm font-bold text-rose-900">Styr grådig</p>
                                <p className="mt-1 text-xs text-rose-700">
                                    Krev hard skatt og overse nøden. Mandatet tappes.
                                </p>
                            </button>
                        </div>
                        <SceneFact>
                            Himmelens mandat var tanken om at keiseren styrte med himmelens
                            velsignelse - men bare så lenge han styrte rettferdig. Se på tallet nede
                            til venstre mens du velger.
                        </SceneFact>
                    </>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function MandateScene({
    vis,
    phase,
    onJust,
    onGreedy,
    onFound,
    burst,
}: {
    vis: number;
    phase: Phase;
    onJust: () => void;
    onGreedy: () => void;
    onFound: () => void;
    burst: number;
}) {
    const canRule = phase === 'play';
    return (
        <group>
            <GroundPlane size={30} depth={26} color="#8a9a68" />

            {/* Rismarkene rundt palasset - grønne i medgang, visne i motgang */}
            <Fields vis={vis} />

            {/* Palasshøyden med keiserpalasset */}
            <PalaceHill vis={vis} />

            {/* Himmelens mandat: gullstrålen fra himmelen ned på palasset */}
            <MandateBeam vis={vis} />

            {/* Folket ved markene */}
            <Villagers vis={vis} />

            {/* Trær i utkanten */}
            <Tree position={[-11, 0, -6]} seed={4} leaf="#4a7a3a" />
            <Tree position={[11, 0, -5]} seed={9} leaf="#4a7a3a" />
            <Tree position={[-10.5, 0, 6]} seed={2} leaf="#4a7a3a" />

            {/* Opprør og brann når mandatet svikter */}
            <Fire position={[-3.2, 0.2, 3.4]} scale={0.7} lit={vis < 0.28} />
            <Fire position={[3.4, 0.2, 3.0]} scale={0.6} lit={vis < 0.16} />

            {/* Kornlager: styr rettferdig (direkte 3D-klikk) */}
            <Interactive
                position={[-4.6, 0, 5.2]}
                onSelect={onJust}
                disabled={!canRule}
                hitArea={[2.2, 2.6, 2.2]}
                sound={null}
            >
                <Granary />
            </Interactive>

            {/* Skattekiste: styr grådig (direkte 3D-klikk) */}
            <Interactive
                position={[4.6, 0, 5.2]}
                onSelect={onGreedy}
                disabled={!canRule}
                hitArea={[2.2, 2.2, 2.2]}
                sound={null}
            >
                <TaxCoffer />
            </Interactive>

            {/* Fall: grunnlegg et nytt dynasti */}
            {phase === 'fallen' && (
                <Hotspot
                    position={[0, 8.2, 0]}
                    onSelect={onFound}
                    label="Grunnlegg et nytt dynasti"
                    radius={0.8}
                />
            )}

            <Burst position={[0, 5, 0]} trigger={burst} color="#ffe6a3" count={44} spread={6} />
        </group>
    );
}

// Himmelens mandat: en lysende gullstråle fra en sol høyt oppe ned på palasset.
// Sterk og høy når mandatet er stort; den trekker seg opp mot himmelen og
// slukner når mandatet tapes.
function MandateBeam({ vis }: { vis: number }) {
    const beam = useRef<THREE.Group>(null);
    const beamMat = useRef<THREE.MeshStandardMaterial>(null);
    const sunMat = useRef<THREE.MeshStandardMaterial>(null);
    const halo = useRef<THREE.Group>(null);
    const cur = useRef(0.001);
    useFrame((_, dt) => {
        cur.current = damp(cur.current, Math.max(0.001, vis), dt, 3);
        const u = cur.current;
        if (beam.current) {
            beam.current.scale.y = 0.06 + u * 1;
            beam.current.scale.x = beam.current.scale.z = 0.6 + u * 0.5;
        }
        if (beamMat.current) beamMat.current.opacity = 0.08 + u * 0.5;
        if (sunMat.current) sunMat.current.emissiveIntensity = 0.5 + u * 2.4;
        if (halo.current) halo.current.scale.setScalar(0.6 + u * 0.9);
    });
    return (
        <group>
            {/* Solen / himmelen som gir mandatet */}
            <group position={[0, 9.2, -1.5]}>
                <mesh>
                    <sphereGeometry args={[0.9, 20, 20]} />
                    <meshStandardMaterial
                        ref={sunMat}
                        color="#ffe9a8"
                        emissive="#ffcf5a"
                        emissiveIntensity={1.6}
                        toneMapped={false}
                    />
                </mesh>
                <group ref={halo}>
                    <GlowHalo color="#ffdd88" size={1.6} opacity={0.55} />
                </group>
            </group>
            {/* Selve strålen ned mot palasstaket */}
            <group ref={beam} position={[0, 6, -0.4]}>
                <mesh>
                    <cylinderGeometry args={[0.35, 1.1, 6, 18, 1, true]} />
                    <meshStandardMaterial
                        ref={beamMat}
                        color="#ffe6a0"
                        emissive="#ffd25a"
                        emissiveIntensity={1.4}
                        transparent
                        opacity={0.5}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                    />
                </mesh>
            </group>
        </group>
    );
}

// Palasset på en høyde. Ved høyt mandat står det stødig og taket lyser varmt.
// Ved lavt mandat heller det, synker og mørkner - riket vakler.
function PalaceHill({ vis }: { vis: number }) {
    const grp = useRef<THREE.Group>(null);
    const roofMat = useRef<THREE.MeshStandardMaterial>(null);
    const cur = useRef(0.6);
    useFrame((_, dt) => {
        cur.current = damp(cur.current, vis, dt, 2.6);
        const u = cur.current;
        if (grp.current) {
            grp.current.rotation.z = (1 - u) * 0.16;
            grp.current.position.y = -(1 - u) * 0.5;
        }
        if (roofMat.current) roofMat.current.emissiveIntensity = 0.06 + u * 0.5;
    });
    return (
        <group>
            {/* Høyden */}
            <mesh position={[0, 0.6, -0.4]} receiveShadow castShadow>
                <cylinderGeometry args={[3.4, 4.4, 1.4, 24]} />
                <meshStandardMaterial color="#9c8a5e" roughness={1} />
            </mesh>
            {/* Palasset (heller/synker med mandatet) */}
            <group ref={grp} position={[0, 1.3, -0.4]}>
                {/* Steinplattform */}
                <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                    <boxGeometry args={[4.4, 0.7, 3.2]} />
                    <meshStandardMaterial color="#d8cbb0" roughness={0.85} />
                </mesh>
                {/* Røde søyler */}
                {[-1.7, -0.57, 0.57, 1.7].map((x) => (
                    <mesh key={x} position={[x, 1.35, 1.1]} castShadow>
                        <cylinderGeometry args={[0.16, 0.16, 1.6, 10]} />
                        <meshStandardMaterial color="#b23a2b" roughness={0.7} />
                    </mesh>
                ))}
                {/* Vegg */}
                <mesh position={[0, 1.35, -0.2]} castShadow receiveShadow>
                    <boxGeometry args={[4, 1.7, 2.2]} />
                    <meshStandardMaterial color="#c0392b" roughness={0.75} />
                </mesh>
                {/* Nedre buede tak */}
                <mesh position={[0, 2.5, 0]} castShadow>
                    <coneGeometry args={[3.6, 1, 4]} />
                    <meshStandardMaterial
                        ref={roofMat}
                        color="#e3b23c"
                        emissive="#e3b23c"
                        emissiveIntensity={0.3}
                        roughness={0.5}
                        metalness={0.2}
                    />
                </mesh>
                {/* Øvre tak */}
                <mesh position={[0, 3.35, 0]} castShadow>
                    <coneGeometry args={[2.3, 0.9, 4]} />
                    <meshStandardMaterial color="#e3b23c" roughness={0.5} metalness={0.2} />
                </mesh>
            </group>
        </group>
    );
}

// Rismarkene: flate terrasser som lerper fra visne brune til frodige grønne.
function Fields({ vis }: { vis: number }) {
    const spots: [number, number][] = [
        [-6.4, 1.6],
        [-3.4, 3.0],
        [3.4, 3.0],
        [6.4, 1.6],
        [-6.8, -1.4],
        [6.8, -1.4],
    ];
    return (
        <group>
            {spots.map(([x, z], i) => (
                <Paddy key={i} position={[x, 0.02, z]} vis={vis} seed={i} />
            ))}
        </group>
    );
}

function Paddy({
    position,
    vis,
    seed,
}: {
    position: [number, number, number];
    vis: number;
    seed: number;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const cur = useRef(0.6);
    const dry = new THREE.Color('#a68a52');
    const lush = new THREE.Color('#4a8a34');
    useFrame((_, dt) => {
        cur.current = damp(cur.current, vis, dt, 2.4);
        if (mat.current) mat.current.color.lerpColors(dry, lush, cur.current);
    });
    const w = 2.4 + (seed % 2) * 0.5;
    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[w, 2.0]} />
            <meshStandardMaterial ref={mat} color="#7a8a52" roughness={1} />
        </mesh>
    );
}

// Folket ved markene. I medgang løfter de armene og jubler; i motgang sitter de
// nedbøyd av nød.
function Villagers({ vis }: { vis: number }) {
    const spots: [number, number][] = [
        [-5.6, 4.6],
        [-2.6, 5.4],
        [2.6, 5.4],
        [5.6, 4.6],
        [-1.2, 6.2],
        [1.2, 6.2],
    ];
    const pose = vis < 0.28 ? 'sit' : vis > 0.62 ? 'raise' : 'idle';
    const body = vis < 0.28 ? '#6b6256' : '#3f6b8a';
    return (
        <group>
            {spots.map(([x, z], i) => (
                <Person
                    key={i}
                    position={[x, 0, z]}
                    rotation={[0, Math.PI, 0]}
                    scale={1.05}
                    body={body}
                    legs="#39312a"
                    pose={pose}
                    hat={i === 0 ? 'cap' : 'none'}
                    hatColor="#c0392b"
                />
            ))}
        </group>
    );
}

// Kornlager (rettferd): rund låve i strågult med kjegletak.
function Granary() {
    return (
        <group>
            <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.75, 0.85, 1.4, 14]} />
                <meshStandardMaterial color="#d8b45a" roughness={0.85} />
            </mesh>
            <mesh position={[0, 1.7, 0]} castShadow>
                <coneGeometry args={[0.98, 0.8, 14]} />
                <meshStandardMaterial color="#8a6a34" roughness={0.9} />
            </mesh>
            {/* Liten dør */}
            <mesh position={[0, 0.5, 0.82]}>
                <boxGeometry args={[0.4, 0.6, 0.06]} />
                <meshStandardMaterial color="#5c3f26" roughness={0.9} />
            </mesh>
            {/* Kornhaug foran - tegnet på at folket får mat */}
            <mesh position={[0, 0.18, 1.1]} castShadow>
                <coneGeometry args={[0.45, 0.45, 12]} />
                <GlowMaterial color="#f4d477" intensity={0.5} />
            </mesh>
        </group>
    );
}

// Skattekiste (grådighet): en tung kiste med gull som lyser.
function TaxCoffer() {
    return (
        <group>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.4, 0.9, 1.0]} />
                <meshStandardMaterial color="#6e4a2c" roughness={0.85} />
            </mesh>
            {/* Lokk på gløtt */}
            <mesh position={[0, 0.95, -0.25]} rotation={[-0.5, 0, 0]} castShadow>
                <boxGeometry args={[1.42, 0.16, 1.0]} />
                <meshStandardMaterial color="#8a5a34" roughness={0.85} />
            </mesh>
            {/* Gullet inni */}
            <mesh position={[0, 0.9, 0.1]}>
                <boxGeometry args={[1.1, 0.3, 0.7]} />
                <GlowMaterial color="#f2c94c" intensity={0.9} />
            </mesh>
            {/* Jernbånd */}
            {[-0.45, 0.45].map((x) => (
                <mesh key={x} position={[x, 0.45, 0]}>
                    <boxGeometry args={[0.12, 0.94, 1.04]} />
                    <meshStandardMaterial color="#3a3230" metalness={0.5} roughness={0.5} />
                </mesh>
            ))}
        </group>
    );
}

export default HimmelensMandat3D;
