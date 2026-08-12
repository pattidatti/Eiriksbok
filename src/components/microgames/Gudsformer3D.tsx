import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    Person,
    Particles,
    GlowHalo,
    Burst,
    SceneSlider,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    StepTracker,
    WinScreen,
    THEMES,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til sammenligningsartikkelen «Én, mange eller ingen gud?».
//
// Lyspære-øyeblikket: eleven bygger selv gudsbildet over en liten verden, og
// oppdager at «hvor mange?» bare er den ene aksen. Den andre er hvor NÆR guden
// står mennesket - og en gudsform kan til og med løses opp og bli til noe som
// finnes i alt. Siste runde ber eleven om null gudsformer, og verden går rundt
// likevel. Da har spørsmålet «hvor mange guder?» mistet grepet sitt.
//
// Vi tegner aldri en gud. Gudsformene er rent lys - av respekt for at flere av
// tradisjonene i artikkelen selv sier at Gud ikke kan avbildes.

type Phase = 'play' | 'miss' | 'won';
type Place = 'near' | 'far' | 'any';

interface Round {
    id: string;
    badge: string;
    task: string;
    count: 'none' | 'one' | 'some' | 'many';
    startCount: number;
    place: Place;
    dissolved: boolean;
    reveal: string;
    miss: string;
}

const ROUNDS: Round[] = [
    {
        id: 'islam',
        badge: 'Runde 1',
        task: 'Én gudsform, og den skal stå nær mennesket.',
        count: 'one',
        startCount: 1,
        place: 'near',
        dissolved: false,
        reveal:
            'Islam: Gud er én og udelelig, og griper inn i menneskenes liv. Derfor står lyset nær, men det er bare ett.',
        miss: 'Prøv igjen. Sett antallet til 1, og dra lyset helt inn til mennesket.',
    },
    {
        id: 'norron',
        badge: 'Runde 2',
        task: 'Mange gudsformer, alle nær mennesket.',
        count: 'many',
        startCount: 2,
        place: 'near',
        dissolved: false,
        reveal:
            'Norrøn religion: gudene utgjør et panteon, ordnet som en familie eller et kongehoff. De har menneskelige trekk, og ingen av dem er allmektig.',
        miss: 'Prøv igjen. Skru antallet opp til minst fire, og dra dem alle inn i den indre ringen.',
    },
    {
        id: 'brahman',
        badge: 'Runde 3',
        task: 'Løs gudsformene opp, så de finnes i alt.',
        count: 'some',
        startCount: 3,
        place: 'any',
        dissolved: true,
        reveal:
            'Brahman i hinduismen: én guddommelig virkelighet som er usynlig, uforanderlig og til stede i alt. Gudene kan forstås som former av den samme enheten.',
        miss: 'Prøv igjen. Ha minst én gudsform, og dra spaken «Løs opp i verden» helt over.',
    },
    {
        id: 'buddhisme',
        badge: 'Runde 4',
        task: 'Ingen gudsformer i det hele tatt.',
        count: 'none',
        startCount: 2,
        place: 'any',
        dissolved: false,
        reveal:
            'Buddhismen: gudene spiller en underordnet rolle, og det finnes ingen skapergud å bygge verden rundt. Verden går rundt likevel - og spørsmålet «hvor mange guder?» mister grepet sitt.',
        miss: 'Prøv igjen. Skru antallet helt ned til null, og la spaken stå på venstre side.',
    },
];

const NEAR_R = 2.5; // innenfor denne radien regnes gudsformen som nær
const FAR_R = 4.2; // utenfor denne er den opphøyd og fjern
const DISC_R = 5.0; // verdensskiva
const DISC_TOP = 0.36;
const ORB_Y = 1.9; // draplanet: hodehøyde over skiva
const T = THEMES.cosmic;

interface Orb {
    id: number;
    x: number;
    z: number;
}

// Startring for nye gudsformer: rett utenfor den nære sonen, jevnt fordelt.
function ringSpot(i: number): [number, number] {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    return [Math.cos(a) * 3.5, Math.sin(a) * 3.5];
}

function radius(o: Orb) {
    return Math.hypot(o.x, o.z);
}

// En enkelt gudsform: rent lys. Jo lenger ut den dras, jo høyere svever den, jo
// større og mer diffus blir den. Nær mennesket er den liten, tett og skarp.
function GudsformLys({ orb, dissolve, dim }: { orb: Orb; dissolve: number; dim: number }) {
    const inner = useRef<THREE.Group>(null);
    const core = useRef<THREE.Mesh>(null);

    useFrame((_, dt) => {
        const r = radius(orb);
        const t = Math.min(1, Math.max(0, (r - NEAR_R) / (FAR_R - NEAR_R)));
        const targetY = t * 2.6;
        const targetScale = (0.5 + t * 0.75) * (1 - dissolve * 0.85) * (1 - dim * 0.45);
        if (inner.current) {
            inner.current.position.y = damp(inner.current.position.y, targetY, dt, 5);
            const s = damp(inner.current.scale.x, Math.max(0.001, targetScale), dt, 5);
            inner.current.scale.setScalar(s);
            inner.current.visible = s > 0.02;
        }
        if (core.current) {
            const m = core.current.material as THREE.MeshStandardMaterial;
            m.emissiveIntensity = damp(m.emissiveIntensity, dim > 0.5 ? 0.15 : 1.5, dt, 4);
        }
    });

    const cold = dim > 0.5;
    return (
        <group ref={inner} position={[0, 0, 0]}>
            <mesh ref={core}>
                <sphereGeometry args={[0.5, 24, 24]} />
                <meshStandardMaterial
                    color={cold ? '#9ca3af' : '#fff6d8'}
                    emissive={cold ? '#6b7280' : T.accent}
                    emissiveIntensity={1.5}
                    roughness={0.35}
                />
            </mesh>
            <GlowHalo color={cold ? '#9ca3af' : '#ffd98a'} size={0.95} opacity={0.4} />
        </group>
    );
}

interface SceneProps {
    orbs: Orb[];
    dissolve: number;
    dim: number;
    burst: number;
    onMove: (id: number, x: number, z: number) => void;
}

function GudsformerScene({ orbs, dissolve, dim, burst, onMove }: SceneProps) {
    const world = useRef<THREE.Mesh>(null);

    useFrame((_, dt) => {
        if (world.current) {
            const m = world.current.material as THREE.MeshStandardMaterial;
            // Verden lyser opp når gudsformene løses opp i den.
            m.emissiveIntensity = damp(m.emissiveIntensity, dissolve * 0.85, dt, 3);
        }
    });

    return (
        <group>
            {/* Verdensskiva: menneskenes verden, som svever i et lyst kosmos. */}
            <mesh ref={world} position={[0, DISC_TOP / 2, 0]} receiveShadow>
                <cylinderGeometry args={[DISC_R, DISC_R * 0.9, DISC_TOP, 56]} />
                <meshStandardMaterial
                    color="#e4dcf1"
                    emissive={T.accent}
                    emissiveIntensity={0}
                    roughness={0.7}
                />
            </mesh>

            {/* Den nære ringen, tegnet flatt oppå skiva så eleven ser sonen. */}
            <mesh position={[0, DISC_TOP + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[NEAR_R - 0.07, NEAR_R, 64]} />
                <meshBasicMaterial color="#8b6fc4" transparent opacity={0.85} />
            </mesh>
            <mesh position={[0, DISC_TOP + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[FAR_R - 0.07, FAR_R, 64]} />
                <meshBasicMaterial color="#a894cf" transparent opacity={0.7} />
            </mesh>

            {/* Mennesket, midt i sin egen verden. */}
            <Person position={[0, DISC_TOP, 0]} scale={1.35} body="#6d5f86" legs="#4a4160" pose="idle" />

            {/* Gudsformene. Draggable holder dem på ett plan; høyden animeres inni. */}
            {orbs.map((o) => (
                <Draggable
                    key={o.id}
                    position={[o.x, ORB_Y, o.z]}
                    planeY={ORB_Y}
                    bounds={{ minX: -8.5, maxX: 8.5, minZ: -8.5, maxZ: 8.5 }}
                    onDrag={(p) => onMove(o.id, p.x, p.z)}
                    onDrop={(p) => onMove(o.id, p.x, p.z)}
                >
                    {/* Romslig usynlig gripeflate - trygg å ta tak i på trackpad. */}
                    <mesh>
                        <sphereGeometry args={[1.5, 12, 12]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <GudsformLys orb={o} dissolve={dissolve} dim={dim} />
                </Draggable>
            ))}

            {/* Oppløst: lyset finnes ikke lenger som former, men i alt. */}
            {dissolve > 0.35 && orbs.length > 0 && (
                <Particles preset="motes" area={[13, 13]} center={[0, 1.6, 0]} height={4} count={90} />
            )}

            {/* Kosmos rundt verden. Ren dekor - holdes utenfor innrammings-revisjonen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="motes" area={[30, 26]} center={[0, 4, 0]} height={11} count={54} />
            </group>

            <Burst position={[0, 2.2, 0]} trigger={burst} color={T.accent} spread={4} count={30} />
        </group>
    );
}

const Gudsformer3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [roundIdx, setRoundIdx] = useState(0);
    const [phase, setPhase] = useState<Phase>('play');
    const [count, setCount] = useState(1);
    const [orbs, setOrbs] = useState<Orb[]>([{ id: 0, x: ringSpot(0)[0], z: ringSpot(0)[1] }]);
    const [dissolve, setDissolve] = useState(0);
    const [banner, setBanner] = useState<string | null>(ROUNDS[0].task);
    const [burst, setBurst] = useState(0);
    const [touched, setTouched] = useState(false);
    const [misses, setMisses] = useState(0);
    const nextId = useRef(1);
    const done = useRef(false);

    const round = ROUNDS[Math.min(roundIdx, ROUNDS.length - 1)];

    // Antall styres av spaken; posisjonene beholdes for de som allerede finnes.
    const setAntall = (n: number) => {
        setTouched(true);
        setCount(n);
        if (phase === 'miss') setBanner(round.task);
        setOrbs((prev) => {
            if (n === prev.length) return prev;
            if (n < prev.length) return prev.slice(0, n);
            const next = [...prev];
            while (next.length < n) {
                const [x, z] = ringSpot(next.length);
                next.push({ id: nextId.current++, x, z });
            }
            return next;
        });
        if (phase === 'miss') setPhase('play');
        sounds.play('sceneChange');
    };

    const flyttOrb = (id: number, x: number, z: number) => {
        setTouched(true);
        setOrbs((prev) => prev.map((o) => (o.id === id ? { ...o, x, z } : o)));
        if (phase === 'miss') {
            setPhase('play');
            setBanner(round.task);
        }
    };

    const endreDissolve = (v: number) => {
        setTouched(true);
        setDissolve(v / 100);
        if (phase === 'miss') {
            setPhase('play');
            setBanner(round.task);
        }
    };

    const stemmer = useMemo(() => {
        const n = orbs.length;
        const okCount =
            round.count === 'none'
                ? n === 0
                : round.count === 'one'
                  ? n === 1
                  : round.count === 'some'
                    ? n >= 1
                    : n >= 4;
        if (!okCount) return false;
        const okDissolve = round.dissolved ? dissolve >= 0.7 : dissolve <= 0.3;
        if (!okDissolve) return false;
        if (round.place === 'near') return orbs.every((o) => radius(o) <= NEAR_R);
        if (round.place === 'far') return orbs.every((o) => radius(o) >= FAR_R);
        return true;
    }, [orbs, dissolve, round]);

    const nyRunde = (i: number) => {
        const r = ROUNDS[i];
        const startAntall = r.startCount;
        setCount(startAntall);
        setOrbs(
            Array.from({ length: startAntall }, (_, k) => {
                const [x, z] = ringSpot(k);
                return { id: nextId.current++, x, z };
            })
        );
        setDissolve(0);
        setPhase('play');
        setBanner(r.task);
    };

    const slaaFast = () => {
        if (phase === 'won') return;
        if (!stemmer) {
            setPhase('miss');
            setMisses((m) => m + 1);
            setBanner(round.miss);
            sounds.play('incorrect');
            return;
        }
        setBurst((b) => b + 1);
        sounds.play('correct');
        const neste = roundIdx + 1;
        if (neste >= ROUNDS.length) {
            setPhase('won');
            setBanner(null);
            if (!done.current) {
                done.current = true;
                onComplete({ score: Math.max(0.5, 1 - misses * 0.1), completed: true });
            }
            return;
        }
        setRoundIdx(neste);
        nyRunde(neste);
        sounds.play('advance');
    };

    const reset = () => {
        setRoundIdx(0);
        setMisses(0);
        setBurst(0);
        setTouched(false);
        done.current = false;
        nyRunde(0);
    };

    const naa = orbs.filter((o) => radius(o) <= NEAR_R).length;
    const fjern = orbs.filter((o) => radius(o) >= FAR_R).length;

    return (
        <MicroGameScaffold
            title="Gudsformene"
            subtitle="Bygg gudsbildet over en liten verden. Hvor mange, og hvor nær mennesket?"
            estimatedSeconds={170}
            onRetry={reset}
            containerClassName="bg-gradient-to-b from-[#efe9f7] via-[#e8e2f2] to-[#ded6ec]"
            canvas={{
                idle: !touched,
                camera: { position: [0, 9.4, 16.8], fov: 42 },
                background: T.sky,
                fog: { color: T.fog, near: 24, far: 52 },
                target: [0, 2.6, 0],
                light: 'day',
                sunIntensity: 0.75,
                ambientIntensity: 0.95,
                maxPolarAngle: 1.28,
            }}
            scene={
                <GudsformerScene
                    orbs={orbs}
                    dissolve={dissolve}
                    dim={phase === 'miss' ? 1 : 0}
                    burst={burst}
                    onMove={flyttOrb}
                />
            }
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'won' ? 'Ferdig' : `${round.badge} av ${ROUNDS.length}`}
                    </SceneBadge>
                    <DragHint show={!touched}>Dra lyset nærmere eller lenger vekk</DragHint>
                </>
            }
        >
            <div className="space-y-2.5">
                <StepTracker current={phase === 'won' ? ROUNDS.length : roundIdx + 1} total={ROUNDS.length} />

                {phase !== 'won' && (
                    <>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                            <SceneSlider
                                label="Hvor mange gudsformer?"
                                min={0}
                                max={6}
                                value={count}
                                onChange={setAntall}
                                valueLabel={(v) => (v === 0 ? 'ingen' : String(v))}
                            />
                            <SceneSlider
                                label="Løs opp i verden"
                                min={0}
                                max={100}
                                step={5}
                                value={Math.round(dissolve * 100)}
                                onChange={endreDissolve}
                                valueLabel={(v) =>
                                    v >= 70 ? 'finnes i alt' : v <= 30 ? 'egne former' : 'på vei'
                                }
                            />
                        </div>
                        <SceneFact>
                            {phase === 'miss'
                                ? round.miss
                                : `${round.task} Dra lysene i vinduet: innenfor den indre ringen står de nær mennesket, utenfor den ytre ringen svever de høyt og fjernt. Nå: ${naa} nær, ${fjern} fjern.`}
                        </SceneFact>
                        <button
                            type="button"
                            onClick={slaaFast}
                            className="w-full rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-700"
                        >
                            Slå fast
                        </button>
                    </>
                )}

                {roundIdx > 0 && phase !== 'won' && (
                    <SceneFact>{ROUNDS[roundIdx - 1].reveal}</SceneFact>
                )}

                {phase === 'won' && (
                    <>
                        <SceneFact>{ROUNDS[ROUNDS.length - 1].reveal}</SceneFact>
                        <WinScreen title="Du har bygd fire helt ulike gudsbilder." onReplay={reset}>
                            Legg merke til at du trengte to spaker, ikke én. Antall er den ene aksen.
                            Hvor nær guden står mennesket, er den andre. Og siste runde brukte ingen
                            gudsformer i det hele tatt - verden gikk rundt likevel.
                        </WinScreen>
                    </>
                )}
            </div>
        </MicroGameScaffold>
    );
};

export default Gudsformer3D;
