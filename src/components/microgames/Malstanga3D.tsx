import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Target, ArrowRight } from 'lucide-react';
import {
    MicroGameScaffold,
    GroundPlane,
    Tree,
    Banner,
    Person,
    Draggable,
    Burst,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    DataReadout,
    damp,
    useShake,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: sikt og skyt beviset mot kravet. Mot den første debattanten blir
// målet stående, og to treff avgjør saken. Mot den andre glir målet lenger unna
// for hvert eneste treff. Lyspæra: du kan ikke vinne en debatt mot noen som
// flytter kravet sitt hver gang du oppfyller det - og det er nettopp derfor
// benektelse ikke er det samme som faglig uenighet.

type Phase = 'a' | 'a-ferdig' | 'b' | 'won';

const LAUNCH_Z = 8; // der eleven står med bevisene
const GOAL_START_Z = -2; // målet i utgangsposisjon
const STEP = 4; // hvor langt målet glir bakover per treff i runde 2
const HITS_A = 2;
const HITS_B = 3;
const MAX_PULL = 5; // hvor langt kassa kan dras bakover
const MIN_RANGE = 4; // kortest mulige kast (meter)
const MAX_RANGE = 26; // lengst mulige kast ved fullt tilbaketrekk
const HIT_TOLERANCE = 2.1; // hvor nær målet nedslaget må være for å telle

// Tilbaketrekk (0 - MAX_PULL) oversatt til kastelengde i meter.
function rangeFor(pull: number): number {
    const p = Math.min(Math.max(pull, 0), MAX_PULL);
    return MIN_RANGE + (p / MAX_PULL) * (MAX_RANGE - MIN_RANGE);
}

// Svarene debattant 2 gir hver gang beviset treffer. Kravet byttes ut, aldri gitt opp.
const UNNSKYLDNINGER = [
    'Dokumentene er forfalsket. Vis meg noe annet.',
    'Vitnene lyver. Vis meg noe annet.',
    'Alle forskerne er kjøpt og betalt. Vis meg noe annet.',
];

const Malstanga3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('a');
    const [hitsA, setHitsA] = useState(0);
    const [hitsB, setHitsB] = useState(0);
    const [bom, setBom] = useState(0);
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra i bevis-kassa for å lade, slipp for å skyte. Treff kravet to ganger.'
    );

    // Hindrer at et treff eller en bom registreres mens målet glir på plass.
    const settling = useRef(false);

    const goalZ = phase === 'b' || phase === 'won' ? GOAL_START_Z - hitsB * STEP : GOAL_START_Z;
    const avstand = Math.round(LAUNCH_Z - goalZ);

    const reset = () => {
        settling.current = false;
        setPhase('a');
        setHitsA(0);
        setHitsB(0);
        setBom(0);
        setBanner('Dra i bevis-kassa for å lade, slipp for å skyte. Treff kravet to ganger.');
    };

    const pause = (ms: number) => {
        settling.current = true;
        window.setTimeout(() => {
            settling.current = false;
        }, ms);
    };

    const handleHit = () => {
        if (settling.current) return;
        sounds.play('correct');
        setBurst((n) => n + 1);

        if (phase === 'a') {
            const n = hitsA + 1;
            setHitsA(n);
            if (n >= HITS_A) {
                setPhase('a-ferdig');
                setBanner('Debattant 1 endret påstanden sin. Saken er avgjort.');
            } else {
                setBanner('Treff. Kravet står der det stod. Ett treff igjen.');
            }
            pause(900);
            return;
        }

        if (phase === 'b') {
            const n = hitsB + 1;
            setHitsB(n);
            if (n >= HITS_B) {
                sounds.play('complete');
                setPhase('won');
                setBanner(null);
                onComplete({ score: 1, completed: true, artifact: { bom, avstand } });
            } else {
                setBanner(UNNSKYLDNINGER[n - 1]);
            }
            pause(1400);
        }
    };

    const handleMiss = () => {
        if (settling.current) return;
        sounds.play('incorrect');
        setBom((n) => n + 1);
        setBanner('Bom. Beviset landet i gresset. Dra lenger bakover for mer kraft.');
    };

    const startB = () => {
        setPhase('b');
        setHitsB(0);
        setBanner('Ny debattant, samme bevis. Treff kravet tre ganger.');
    };

    return (
        <MicroGameScaffold
            title="Flytt målstanga"
            subtitle="Skyt beviset mot kravet, og se hva som skjer med målet"
            estimatedSeconds={150}
            onRetry={phase !== 'a' || bom > 0 ? reset : undefined}
            canvas={{
                idle: false,
                controls: true,
                camera: { position: [0, 9, 20], fov: 46 },
                target: [0, 1.1, 0.5],
                background: '#cfe0ef',
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'a' || phase === 'a-ferdig' ? 'Debattant 1' : 'Debattant 2'}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Avstand til kravet', value: avstand, unit: 'm' },
                            {
                                label: 'Treff',
                                value: phase === 'a' || phase === 'a-ferdig' ? hitsA : hitsB,
                            },
                            { label: 'Bom', value: bom },
                        ]}
                    />
                </>
            }
            scene={
                <PitchScene
                    goalZ={goalZ}
                    moving={phase === 'b' || phase === 'won'}
                    burst={burst}
                    bom={bom}
                    onHit={handleHit}
                    onMiss={handleMiss}
                />
            }
        >
            {phase === 'a' && (
                <SceneFact>
                    Kravet er «vis meg beviset». Debattant 1 har sagt hva som skal til for å endre
                    mening. Treff målet to ganger, så ser du om hen står ved det.
                </SceneFact>
            )}

            {phase === 'a-ferdig' && (
                <div className="rounded-xl border border-amber-200 bg-white p-3 sm:flex sm:items-center sm:gap-4">
                    <p className="text-xs text-slate-600 leading-relaxed min-w-0 flex-1">
                        Målet stod stille hele veien. Da bevisene kom, endret debattant 1 påstanden
                        sin i stedet for kravet. Nå møter du en debattant som gjør det motsatte.
                    </p>
                    <button
                        onClick={startB}
                        className="mt-2.5 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition flex-shrink-0"
                    >
                        <ArrowRight className="w-4 h-4" />
                        Møt debattant 2
                    </button>
                </div>
            )}

            {phase === 'b' && (
                <SceneFact>
                    Følg med på avstanden nede til venstre for hvert treff. Kravet blir aldri
                    oppfylt, det blir bare byttet ut med et nytt.
                </SceneFact>
            )}

            {phase === 'won' && (
                <WinScreen title="Målet er utenfor banen" onReplay={reset}>
                    <span className="inline-flex items-center gap-1 align-middle">
                        <Target className="w-3.5 h-3.5 text-amber-500" />
                    </span>{' '}
                    Du traff hver eneste gang, og likevel kom du aldri i mål. Debattant 1 hadde et
                    krav som stod stille, og endret påstanden sin da beviset kom. Debattant 2 byttet
                    ut kravet hver gang du oppfylte det, og skjøv målet fra {LAUNCH_Z - GOAL_START_Z}{' '}
                    til {avstand} meter. Det er forskjellen på faglig uenighet og benektelse: den ene
                    kan avgjøres av bevis, den andre kan det ikke.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function PitchScene({
    goalZ,
    moving,
    burst,
    bom,
    onHit,
    onMiss,
}: {
    goalZ: number;
    moving: boolean;
    burst: number;
    bom: number;
    onHit: () => void;
    onMiss: () => void;
}) {
    // useShake bruker useFrame og må derfor bo inne i canvasen.
    const { ref: shakeRef, shake } = useShake();
    React.useEffect(() => {
        if (bom > 0) shake(0.5);
    }, [bom, shake]);

    // Slynge-tilstand. `dragKey` remounter Draggable så kassa spretter tilbake
    // til utgangspunktet etter hvert kast.
    const [pull, setPull] = useState(0);
    const [dragKey, setDragKey] = useState(0);
    const [shot, setShot] = useState({ id: 0, range: 0 });

    const fire = (rawPull: number) => {
        const range = rangeFor(rawPull);
        setShot((s) => ({ id: s.id + 1, range }));
        setPull(0);
        setDragKey((k) => k + 1);
        // Målet vurderes mot posisjonen det hadde da beviset ble kastet.
        const landZ = LAUNCH_Z - range;
        const gz = goalZ;
        window.setTimeout(() => {
            if (Math.abs(landZ - gz) <= HIT_TOLERANCE) onHit();
            else onMiss();
        }, 1100);
    };

    return (
        <group ref={shakeRef}>
            <GroundPlane size={46} depth={44} color="#6f9f4d" />

            {/* Oppmerket bane: en lys stripe fra kasteren og innover */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]} receiveShadow>
                <planeGeometry args={[7, 26]} />
                <meshStandardMaterial color="#7cae57" roughness={1} />
            </mesh>

            {/* Sidelinje-flagg gir liv og viser hvor langt målet har glidd */}
            {[4, -2, -8].map((z) => (
                <React.Fragment key={z}>
                    <Banner position={[-4.6, 0, z]} color="#c8442f" height={1.6} />
                    <Banner position={[4.6, 0, z]} color="#c8442f" height={1.6} />
                </React.Fragment>
            ))}

            {/* Trerekke i bakkant */}
            {[-11, -7, 7, 11].map((x, i) => (
                <Tree key={x} position={[x, 0, -15]} seed={i + 3} leaf="#3f6b39" />
            ))}

            {/* Eleven som legger fram bevisene */}
            <Person position={[-1.6, 0, LAUNCH_Z + 0.6]} body="#3f5f8a" pose="raise" />

            {/* Målet: kravet. Glir bakover i runde 2. */}
            <MovingGoal goalZ={goalZ} moving={moving} burst={burst} />

            {/* Bevis-slyngen: dra kassa bakover for å lade, slipp for å kaste */}
            <Draggable
                key={dragKey}
                position={[0, 0, LAUNCH_Z]}
                axis="z"
                planeY={0}
                bounds={{ minZ: LAUNCH_Z, maxZ: LAUNCH_Z + MAX_PULL }}
                liftY={0}
                onDrag={(p) => setPull(p.z - LAUNCH_Z)}
                onDrop={(p) => fire(p.z - LAUNCH_Z)}
                dropFx="dustPuff"
            >
                {/* Romslig usynlig gripeflate - trygg å treffe på trackpad */}
                <mesh position={[0, 0.6, 0]}>
                    <boxGeometry args={[2.4, 1.8, 2.4]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                <EvidenceCrate />
            </Draggable>

            {/* Forhåndsvist kastebane mens eleven drar */}
            {pull > 0.15 && <ArcPreview range={rangeFor(pull)} />}

            {/* Beviset i flukt */}
            <Projectile shotId={shot.id} range={shot.range} />
        </group>
    );
}

// Punktene i den forhåndsviste kastebanen. Samme parabel som prosjektilet flyr.
function arcPoint(range: number, s: number): [number, number, number] {
    const z = LAUNCH_Z - s * range;
    const apex = Math.min(range * 0.34, 6.5);
    const y = 0.4 + 4 * apex * s * (1 - s);
    return [0, y, z];
}

function ArcPreview({ range }: { range: number }) {
    return (
        <group>
            {Array.from({ length: 13 }, (_, i) => {
                const p = arcPoint(range, i / 12);
                return (
                    <mesh key={i} position={p}>
                        <sphereGeometry args={[0.09, 8, 8]} />
                        <meshStandardMaterial
                            color="#fbbf24"
                            emissive="#fbbf24"
                            emissiveIntensity={0.5}
                            transparent
                            opacity={0.9 - (i / 13) * 0.45}
                        />
                    </mesh>
                );
            })}
            {/* Nedslagsmerke, så eleven ser hvor beviset lander */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, LAUNCH_Z - range]}>
                <ringGeometry args={[0.55, 0.8, 20]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
            </mesh>
        </group>
    );
}

// Beviset i flukt. All animasjon lever i refs - ingen state per frame.
function Projectile({ shotId, range }: { shotId: number; range: number }) {
    const mesh = useRef<THREE.Mesh>(null);
    const t = useRef(1);
    const last = useRef(0);
    const flight = useRef(range);

    useFrame((_, dt) => {
        if (!mesh.current) return;
        if (shotId !== last.current) {
            last.current = shotId;
            t.current = 0;
            flight.current = range;
        }
        if (t.current < 1) t.current = Math.min(1, t.current + dt * 0.95);
        const p = arcPoint(flight.current, t.current);
        mesh.current.position.set(p[0], p[1], p[2]);
        mesh.current.rotation.x += dt * 6;
        mesh.current.visible = shotId > 0 && t.current < 1;
    });

    return (
        <mesh ref={mesh} position={[0, 0.4, LAUNCH_Z]} castShadow visible={false}>
            <boxGeometry args={[0.42, 0.12, 0.32]} />
            <meshStandardMaterial color="#f4f1e6" roughness={0.9} />
        </mesh>
    );
}

// Målstanga selv: to stolper, tverrligger og nett. Damper mot goalZ, så
// forflytningen i runde 2 er synlig som en bevegelse - ikke et hopp.
function MovingGoal({
    goalZ,
    moving,
    burst,
}: {
    goalZ: number;
    moving: boolean;
    burst: number;
}) {
    const group = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!group.current) return;
        group.current.position.z = damp(group.current.position.z, goalZ, dt, moving ? 2.6 : 8);
    });

    return (
        <group ref={group} position={[0, 0, goalZ]}>
            {/* Stolper: loddrette sylindre, bunn på bakken */}
            {[-1.8, 1.8].map((x) => (
                <mesh key={x} position={[x, 1.3, 0]} castShadow>
                    <cylinderGeometry args={[0.11, 0.11, 2.6, 10]} />
                    <meshStandardMaterial color="#f5f5f2" roughness={0.6} />
                </mesh>
            ))}
            {/* Tverrligger: liggende sylinder, må roteres eksplisitt */}
            <mesh position={[0, 2.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.11, 0.11, 3.82, 10]} />
                <meshStandardMaterial color="#f5f5f2" roughness={0.6} />
            </mesh>
            {/* Nettet: planeGeometry står loddrett som standard */}
            <mesh position={[0, 1.3, -0.35]}>
                <planeGeometry args={[3.6, 2.6]} />
                <meshStandardMaterial
                    color="#e8ecf1"
                    transparent
                    opacity={0.34}
                    side={THREE.DoubleSide}
                    roughness={1}
                />
            </mesh>
            {/* Skiltet som markerer kravet. Hviler rett oppå tverrliggeren. */}
            <mesh position={[0, 2.96, 0]} castShadow>
                <boxGeometry args={[2.2, 0.5, 0.1]} />
                <meshStandardMaterial color="#b45309" roughness={0.8} />
            </mesh>
            {/* Debattanten som eier kravet, står ved siden av målet */}
            <Person position={[2.9, 0, 0.4]} body="#7a3b3b" pose="idle" hat="cap" />

            <Burst position={[0, 1.4, 0]} trigger={burst} color="#fbbf24" count={24} spread={2.6} />
        </group>
    );
}

// Kassa med bevis som eleven drar i for å lade. Draggable holder gruppa på
// bakkenivå (y=0), så kassa bygges oppover derfra - bunnen står på bakken.
function EvidenceCrate() {
    return (
        <group>
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.1, 0.6, 0.9]} />
                <meshStandardMaterial color="#a4763f" roughness={0.85} />
            </mesh>
            {/* Papirbunken som stikker opp av kassa */}
            <mesh position={[0, 0.68, 0]} rotation={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.7, 0.2, 0.55]} />
                <meshStandardMaterial color="#f4f1e6" roughness={0.9} />
            </mesh>
        </group>
    );
}

export default Malstanga3D;
