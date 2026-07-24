import React, { useRef, useState } from 'react';
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
    ChoiceRow,
    KitOutline,
    damp,
    Burst,
    type ChoiceItem,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: bygg broen fra spørsmål til en gyldig konklusjon. De fem plankene
// er de fem stegene i samfunnsfaglig metode. Ved hvert steg velger eleven mellom
// en SOLID metode og en fristende SNARVEI. Til slutt sendes konklusjonen over
// broen. Lyspæren: en konklusjon er bare så sterk som det svakeste metode-steget.
// Legg én råtten planke, og hele konklusjonen faller gjennom akkurat der.

type Phase = 'build' | 'ready' | 'crossing' | 'won';

const N = 5;
// Plankenes sentrum langs X. Fem planker fyller kløfta fra -5 til +5.
const PLANK_X = [-4, -2, 0, 2, 4];

interface Step {
    label: string;
    fact: string;
    solid: { title: string; blurb: string };
    shortcut: { title: string; blurb: string };
}

const STEPS: Step[] = [
    {
        label: 'Steg 1: Problemstilling',
        fact: 'Alt starter med spørsmålet. En god problemstilling er tydelig, avgrenset og drøftbar - et spørsmål du faktisk kan svare på.',
        solid: {
            title: 'Avgrenset, drøftbar problemstilling',
            blurb: 'Et spørsmål du kan svare på',
        },
        shortcut: { title: 'Vagt tema uten retning', blurb: '"Noe om sosiale medier"' },
    },
    {
        label: 'Steg 2: Kilder',
        fact: 'Du trenger data. Kildekritikk betyr å spørre hvem, når og hvorfor - og å sette flere kilder opp mot hverandre.',
        solid: { title: 'Flere kilder, vurdert kritisk', blurb: 'SSB + sjekk hvem og hvorfor' },
        shortcut: { title: 'Første Google-treff', blurb: 'Tar det som ligger øverst' },
    },
    {
        label: 'Steg 3: Tolke statistikk',
        fact: 'Tall lyver ikke, men kan villede. Spør alltid "av hva?" og sammenlign med et normalår, ikke et spesielt år.',
        solid: { title: 'Spør "av hva?" og ser trenden', blurb: 'Sammenligner over tid' },
        shortcut: { title: 'Tar tallet for pålydende', blurb: '"Doblet seg" - skummelt!' },
    },
    {
        label: 'Steg 4: Presentere funn',
        fact: 'Funn må fram til andre. En tydelig graf med tittel og kilde sier mer enn tall lest opp fra et ark.',
        solid: { title: 'Tydelig graf med tittel og kilde', blurb: 'Ett poeng per diagram' },
        shortcut: { title: 'Leser tall opp fra et ark', blurb: 'Ingen ser hva du mener' },
    },
    {
        label: 'Steg 5: Drøfte gyldighet',
        fact: 'Det viktigste steget: vær ærlig om hva undersøkelsen kan og ikke kan si. Å innrømme svakheter er en styrke.',
        solid: { title: 'Innrømmer svakheter ærlig', blurb: '"Dette er usikkert fordi..."' },
        shortcut: { title: 'Later som alt er sikkert', blurb: 'Skjuler hull i jobben' },
    },
];

const Konklusjonsbroen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('build');
    const [step, setStep] = useState(0);
    // For hver plassert planke: true = solid, false = råtten snarvei.
    const [planks, setPlanks] = useState<boolean[]>([]);
    const [banner, setBanner] = useState<string | null>(
        'Bygg broen fra spørsmålet til en gyldig konklusjon. Velg metode for hvert steg.'
    );
    const [burst, setBurst] = useState(0);

    const firstRotten = planks.findIndex((p) => p === false);
    const allSolid = planks.length === N && firstRotten === -1;

    const reset = () => {
        setPhase('build');
        setStep(0);
        setPlanks([]);
        setBanner(
            'Bygg broen fra spørsmålet til en gyldig konklusjon. Velg metode for hvert steg.'
        );
    };

    const choose = (solid: boolean) => {
        if (phase !== 'build') return;
        sounds.play(solid ? 'correct' : 'drop');
        const next = [...planks, solid];
        setPlanks(next);
        if (next.length >= N) {
            setPhase('ready');
            setBanner('Broen står. Send konklusjonen over - holder den hele veien?');
        } else {
            setStep((s) => s + 1);
        }
    };

    const sendCart = () => {
        if (phase !== 'ready') return;
        setPhase('crossing');
        setBanner(null);
        sounds.play('advance');
    };

    const onCrossResult = (reachedEnd: boolean) => {
        if (reachedEnd) {
            setBurst((b) => b + 1);
            sounds.play('complete');
            setPhase('won');
            onComplete({ score: 1, completed: true, artifact: { planks } });
        } else {
            sounds.play('incorrect');
            const i = firstRotten;
            setBanner(
                `Konklusjonen falt gjennom ved ${STEPS[
                    i
                ].label.toLowerCase()}! En snarvei her gjør at ingen kan stole på svaret. Bygg broen på nytt med solid metode.`
            );
            setPhase('build');
            setStep(0);
            setPlanks([]);
        }
    };

    const cur = STEPS[Math.min(step, N - 1)];

    const choiceItems: ChoiceItem[] = [
        { id: 'solid', title: cur.solid.title, blurb: cur.solid.blurb, status: 'active' },
        { id: 'shortcut', title: cur.shortcut.title, blurb: cur.shortcut.blurb, status: 'active' },
    ];

    return (
        <MicroGameScaffold
            title="Bygg konklusjonsbroen"
            subtitle="Velg metode for hvert steg, og send konklusjonen over kløfta"
            estimatedSeconds={150}
            onRetry={planks.length > 0 || phase !== 'build' ? reset : undefined}
            canvas={{
                // Ingen idle-rotasjon: scenen er en retningskomposisjon
                // (spørsmål til venstre -> konklusjon til høyre), og drift i
                // build-fasen etterlot kamera skjevt før kryssingen.
                idle: false,
                camera: { position: [0, 5.5, 14], fov: 42 },
                background: '#d3e7f2',
                target: [0, 0.5, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'won' ? 'Gyldig konklusjon' : 'Samfunnsfaglig metode'}
                    </SceneBadge>
                </>
            }
            scene={
                <BridgeScene
                    planks={planks}
                    phase={phase}
                    burst={burst}
                    failX={firstRotten === -1 ? null : PLANK_X[firstRotten]}
                    onResult={onCrossResult}
                    onSend={sendCart}
                />
            }
        >
            {phase === 'build' && (
                <div className="flex flex-col gap-3">
                    <StepTracker current={planks.length} total={N} />
                    <p className="text-sm font-bold text-slate-700">{cur.label}</p>
                    <ChoiceRow items={choiceItems} onSelect={(id) => choose(id === 'solid')} />
                    <SceneFact>{cur.fact}</SceneFact>
                </div>
            )}

            {phase === 'ready' && (
                <div className="rounded-xl border border-amber-200 bg-white p-3 sm:flex sm:items-center sm:gap-4">
                    <p className="text-xs text-slate-600 leading-relaxed min-w-0 flex-1">
                        {allSolid
                            ? 'Alle fem plankene er solide. Send konklusjonen over og se den nå helt fram.'
                            : 'Minst én planke er en snarvei. Send konklusjonen over og se hva som skjer - eller bygg om med Start på nytt.'}
                    </p>
                    <button
                        onClick={sendCart}
                        className="mt-2.5 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition flex-shrink-0"
                    >
                        Send konklusjonen over
                    </button>
                </div>
            )}

            {phase === 'crossing' && (
                <p className="text-sm text-slate-600 py-2">Konklusjonen ruller over broen...</p>
            )}

            {phase === 'won' && (
                <WinScreen title="Konklusjonen holdt hele veien!" onReplay={reset}>
                    Hver planke var et steg i samfunnsfaglig metode: en god problemstilling,
                    kritiske kilder, ærlig tolkning av statistikk, en tydelig presentasjon og en
                    drøfting som innrømmer svakheter. En konklusjon er bare så sterk som det
                    svakeste steget. Holder alle fem, kan andre stole på svaret ditt.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function BridgeScene({
    planks,
    phase,
    burst,
    failX,
    onResult,
    onSend,
}: {
    planks: boolean[];
    phase: Phase;
    burst: number;
    failX: number | null;
    onResult: (reachedEnd: boolean) => void;
    onSend: () => void;
}) {
    return (
        <group>
            {/* Kløftas bunn - en kjølig, lys dis langt nede */}
            <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[60, 30]} />
                <meshStandardMaterial color="#9fb8cc" roughness={1} />
            </mesh>

            {/* Venstre platform: SPØRSMÅL */}
            <Platform x={-7.2} color="#6b8f3f" />
            {/* Høyre platform: KONKLUSJON */}
            <Platform x={7.2} color="#c79a3a" glow={phase === 'won'} />

            {/* Plankene */}
            {PLANK_X.map((x, i) => (
                <Plank key={i} x={x} placed={i < planks.length} solid={planks[i]} />
            ))}

            {/* Vogna med konklusjonen */}
            <Cart phase={phase} failX={failX} onResult={onResult} />

            {/* Hotspot for å sende vogna - direkte 3D-interaksjon */}
            {phase === 'ready' && (
                <Hotspot
                    position={[-7.2, 1.7, 0]}
                    onSelect={onSend}
                    label="Send konklusjonen"
                    radius={0.5}
                />
            )}

            <Burst position={[6.4, 1.6, 0]} trigger={burst} color="#ffe9a8" count={34} spread={4} />
        </group>
    );
}

// Stor steinplatform på hver side av kløfta.
function Platform({ x, color, glow }: { x: number; color: string; glow?: boolean }) {
    return (
        <group position={[x, 0, 0]}>
            <mesh position={[0, -0.6, 0]} receiveShadow castShadow>
                <boxGeometry args={[5, 1.2, 6]} />
                <meshStandardMaterial color="#8a8170" roughness={0.95} />
            </mesh>
            {/* gress/topp-flate som signaliserer start/mål */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[5, 6]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.85}
                    emissive={glow ? '#f0c24a' : '#000000'}
                    emissiveIntensity={glow ? 0.5 : 0}
                />
            </mesh>
            {/* liten port/stolpe som markør */}
            <mesh position={[x < 0 ? 2 : -2, 1, -2]} castShadow>
                <cylinderGeometry args={[0.16, 0.16, 2, 8]} />
                <meshStandardMaterial color="#7a5a35" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Én planke. Animerer ned på plass når den blir lagt. Solid = varmt tre med
// kant. Råtten snarvei = grå, sprukken og henger litt skjevt.
function Plank({ x, placed, solid }: { x: number; placed: boolean; solid: boolean }) {
    const grp = useRef<THREE.Group>(null);
    const t = useRef(0);
    useFrame((_, dt) => {
        if (!grp.current) return;
        t.current = damp(t.current, placed ? 1 : 0, dt, 6);
        const fall = (1 - t.current) * 5;
        grp.current.position.y = fall + (placed && !solid ? -0.18 : 0);
        grp.current.rotation.z = placed && !solid ? -0.09 : 0;
        const s = 0.4 + t.current * 0.6;
        grp.current.scale.setScalar(placed ? s : 0.0001);
    });
    if (!placed) {
        // Tomt spor: en svak ramme som viser hvor planken skal.
        return (
            <mesh position={[x, 0.02, 0]}>
                <boxGeometry args={[1.9, 0.05, 2.2]} />
                <meshStandardMaterial color="#b9c6d2" transparent opacity={0.35} />
            </mesh>
        );
    }
    return (
        <group ref={grp} position={[x, 0, 0]}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1.9, 0.26, 2.2]} />
                <meshStandardMaterial
                    color={solid ? '#b9823f' : '#8d887c'}
                    roughness={solid ? 0.7 : 1}
                    emissive={solid ? '#6b4a1f' : '#000000'}
                    emissiveIntensity={solid ? 0.15 : 0}
                />
                {solid && <KitOutline />}
            </mesh>
            {/* sprekk på den råtne planka */}
            {!solid && (
                <mesh position={[0, 0.16, 0]} rotation={[0, 0, 0.4]}>
                    <boxGeometry args={[0.08, 0.04, 2.0]} />
                    <meshStandardMaterial color="#4a4640" />
                </mesh>
            )}
        </group>
    );
}

// Vogna som bærer konklusjonen. I 'crossing' ruller den fra venstre mot høyre.
// Treffer den en råtten planke (failX), faller den ned der. Når over => seier.
function Cart({
    phase,
    failX,
    onResult,
}: {
    phase: Phase;
    failX: number | null;
    onResult: (reachedEnd: boolean) => void;
}) {
    const grp = useRef<THREE.Group>(null);
    const progress = useRef(0); // X-posisjon
    const falling = useRef(false);
    const done = useRef(false);
    const lastPhase = useRef<Phase>('build');

    const START_X = -7.2;
    // Stopper litt inne på målplatformen så vogna ikke klippes av høyre
    // billedkant fra startkameraet.
    const END_X = 6.4;
    // Hjulsenter ligger 0.35 under gruppa og hjulradius er 0.32: med gruppe-y
    // 0.69 står hjula på platformtoppen (0.02), med 0.8 på planketoppen (0.13).
    const Y_PLATFORM = 0.69;
    const Y_BRIDGE = 0.8;

    useFrame((_, dt) => {
        if (!grp.current) return;

        // Nullstill når vi går inn i en ny crossing.
        if (phase === 'crossing' && lastPhase.current !== 'crossing') {
            progress.current = START_X;
            falling.current = false;
            done.current = false;
        }
        lastPhase.current = phase;

        if (phase === 'ready') {
            progress.current = START_X;
            grp.current.position.set(START_X, Y_PLATFORM, 0);
            grp.current.rotation.z = 0;
            return;
        }
        if (phase === 'build') {
            // Nullstill også rotasjonen - etter et fall står vogna ellers
            // veltet igjen på startplatformen.
            grp.current.position.set(START_X, Y_PLATFORM, 0);
            grp.current.rotation.z = 0;
            return;
        }
        if (phase === 'won') {
            grp.current.position.set(END_X, Y_PLATFORM, 0);
            grp.current.rotation.z = 0;
            return;
        }

        if (phase === 'crossing' && !done.current) {
            if (falling.current) {
                // Faller ned i kløfta.
                grp.current.position.y = damp(grp.current.position.y, -5, dt, 3);
                grp.current.rotation.z += dt * 3;
                if (grp.current.position.y < -3 && !done.current) {
                    done.current = true;
                    onResult(false);
                }
                return;
            }
            // Rull framover. På broa (|x| < 5) står hjula på planketoppen,
            // på platformene litt lavere.
            progress.current = Math.min(END_X, progress.current + dt * 4.5);
            grp.current.position.x = progress.current;
            grp.current.position.y = Math.abs(progress.current) < 5 ? Y_BRIDGE : Y_PLATFORM;
            // Treff på råtten planke?
            if (failX !== null && progress.current >= failX) {
                falling.current = true;
            } else if (progress.current >= END_X) {
                done.current = true;
                onResult(true);
            }
        }
    });

    return (
        <group ref={grp} position={[START_X, Y_PLATFORM, 0]}>
            {/* hjul */}
            {[-0.5, 0.5].map((zx) => (
                <mesh key={zx} position={[zx, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.32, 0.32, 0.18, 16]} />
                    <meshStandardMaterial color="#4a3a28" roughness={0.8} />
                </mesh>
            ))}
            {/* kasse */}
            <mesh position={[0, 0.05, 0]} castShadow>
                <boxGeometry args={[1.2, 0.6, 1]} />
                <meshStandardMaterial color="#a36b3a" roughness={0.7} />
            </mesh>
            {/* glødende "konklusjon"-kule */}
            <mesh position={[0, 0.7, 0]} castShadow>
                <sphereGeometry args={[0.34, 20, 20]} />
                <meshStandardMaterial
                    color="#ffd86b"
                    emissive="#f5b942"
                    emissiveIntensity={0.7}
                    roughness={0.3}
                />
            </mesh>
            {/* myk glød rundt kula */}
            <mesh position={[0, 0.7, 0]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshBasicMaterial
                    color="#ffe9a8"
                    transparent
                    opacity={0.25}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
}

export default Konklusjonsbroen3D;
