import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Connector,
    GroundPlane,
    Building,
    Tree,
    Rock,
    Banner,
    Tower,
    Person,
    Cart,
    Mover,
    Burst,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    LoseScreen,
    TimerPill,
    MeterBar,
    StepTracker,
    useGameClock,
    useMeter,
    type ConnectorNode,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om eneveldet i Danmark-Norge.
//
// Lyspære-øyeblikket: eneveldet ga ikke bare kongen mer makt på papiret. Han
// fikk et apparat av lønnede embetsmenn som nådde helt ned i hver bygd. Eleven
// bygger selve kommandolinjen: konge -> stattholder -> amtmenn -> fogder. Først
// når hele kjeden henger sammen, kommer skatten fram til kongen.
//
// Press: skattefristen tikker, og hver kobling som hopper over et ledd øker
// forvirringen i apparatet. Tre bomkoblinger, og beskjeden stopper opp.

type Phase = 'playing' | 'won' | 'lost';

// Punktene i kommandolinjen. Y-en ligger over taket på stedet punktet hører
// til, så markørene er lette å treffe uten å skygge for husene.
const NODES: ConnectorNode[] = [
    { id: 'konge', position: [-7.6, 4.4, 0], color: '#eab308' },
    { id: 'stattholder', position: [-3.2, 3.8, 1.6], color: '#f59e0b' },
    { id: 'amt-nord', position: [1.2, 3.0, -3.2] },
    { id: 'amt-vest', position: [1.2, 3.0, 3.4] },
    { id: 'bygd-a', position: [5.9, 2.4, -4.8] },
    { id: 'bygd-b', position: [5.9, 2.4, -1.3] },
    { id: 'bygd-c', position: [5.9, 2.4, 3.6] },
];

// Bakkeposisjonene under hvert punkt. Skattevognene ruller her, ikke i lufta.
const GROUND: Record<string, [number, number, number]> = {
    konge: [-7.6, 0, 3.4],
    stattholder: [-3.2, 0, 3.0],
    'amt-nord': [1.2, 0, -1.9],
    'amt-vest': [1.2, 0, 4.7],
    'bygd-a': [5.9, 0, -6.0],
    'bygd-b': [5.9, 0, -0.1],
    'bygd-c': [5.9, 0, 4.8],
};

const CORRECT: [string, string][] = [
    ['konge', 'stattholder'],
    ['stattholder', 'amt-nord'],
    ['stattholder', 'amt-vest'],
    ['amt-nord', 'bygd-a'],
    ['amt-nord', 'bygd-b'],
    ['amt-vest', 'bygd-c'],
];

// Hver vogn foelger sin egen vei opp gjennom leddene til kongen.
const ROUTES: string[][] = [
    ['bygd-a', 'amt-nord', 'stattholder', 'konge'],
    ['bygd-b', 'amt-nord', 'stattholder', 'konge'],
    ['bygd-c', 'amt-vest', 'stattholder', 'konge'],
];

const SECONDS = 110;
const WRONG_COST = 0.34; // tre bomkoblinger fyller maaleren

const START_BANNER =
    'Klikk to punkter etter tur for å knytte dem sammen. Start hos kongen i København.';

const KongensArmer3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('playing');
    const [attempt, setAttempt] = useState(0);
    const [links, setLinks] = useState(0);
    const [wrong, setWrong] = useState(0);
    const [arrived, setArrived] = useState(0);
    const [banner, setBanner] = useState<string | null>(START_BANNER);
    // Vokter mot dobbel avslutning (fristen og forvirringen kan bikke samtidig).
    const endedRef = useRef(false);

    const lose = useCallback(
        (why: string) => {
            if (endedRef.current) return;
            endedRef.current = true;
            sounds.play('incorrect');
            setBanner(why);
            setPhase('lost');
        },
        [sounds]
    );

    const clock = useGameClock({
        seconds: SECONDS,
        running: phase === 'playing',
        onExpire: () => lose('Fristen gikk ut.'),
    });

    const confusion = useMeter({
        drainPerSecond: 0.02,
        overloadAt: 1,
        onOverload: () => lose('Apparatet floket seg til.'),
    });

    const reset = () => {
        endedRef.current = false;
        setPhase('playing');
        setLinks(0);
        setWrong(0);
        setArrived(0);
        setAttempt((a) => a + 1);
        confusion.reset();
        clock.restart();
        setBanner(START_BANNER);
    };

    const handleConnect = (_a: string, _b: string, valid: boolean) => {
        if (endedRef.current) return;
        if (valid) {
            const next = links + 1;
            setLinks(next);
            if (next === 1) {
                setBanner('Stattholderen i Christiania har fått beskjed. Send den videre.');
            } else if (next === 3) {
                setBanner('Begge amtmennene er på plass. Nå mangler bare fogdene i bygdene.');
            } else {
                setBanner(null);
            }
        } else {
            setWrong(wrong + 1);
            confusion.add(WRONG_COST);
            setBanner('Der hoppet du over et ledd. Beskjeden må gå ett trinn om gangen.');
        }
    };

    const handleComplete = () => {
        if (endedRef.current) return;
        endedRef.current = true;
        sounds.play('complete');
        setPhase('won');
        setBanner(null);
    };

    const handleArrive = useCallback(() => {
        setArrived((n) => n + 1);
    }, []);

    // Alle tre vognene framme = spillet er fullført.
    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);
    useEffect(() => {
        if (phase !== 'won' || arrived < ROUTES.length) return;
        const t = setTimeout(
            () => onCompleteRef.current({ score: wrong === 0 ? 1 : 0.8, completed: true }),
            200
        );
        return () => clearTimeout(t);
    }, [phase, arrived, wrong]);

    return (
        <MicroGameScaffold
            title="Kongens armer"
            subtitle="Bygg kommandolinjen fra kongen i København helt ned til bygdene i Norge"
            estimatedSeconds={170}
            onRetry={links > 0 || wrong > 0 || phase !== 'playing' ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 14, 20], fov: 40 },
                target: [-0.4, 0.6, 0],
                background: '#cfe3f2',
                fog: { color: '#cfe3f2', near: 36, far: 66 },
                light: 'overcast',
            }}
            containerClassName="bg-gradient-to-b from-[#cfe3f2] via-[#dfeadf] to-[#dcd6b8]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Danmark-Norge, 1660-årene</SceneBadge>
                    <TimerPill
                        corner="bl"
                        label="Skattefrist"
                        seconds={clock.remaining}
                        warnBelow={20}
                    />
                    <DragHint show={links === 0 && phase === 'playing'} corner="bc">
                        Klikk ett punkt, så det neste, for å knytte dem sammen
                    </DragHint>
                </>
            }
            scene={
                <Riket
                    key={attempt}
                    phase={phase}
                    arrived={arrived}
                    onConnect={handleConnect}
                    onComplete={handleComplete}
                    onArrive={handleArrive}
                />
            }
        >
            <div className="flex flex-col gap-3">
                <StepTracker current={links} total={CORRECT.length} />

                <MeterBar
                    value={confusion.value}
                    label="Forvirring i apparatet"
                    hint="Hvert hopp over et ledd gjør det vanskeligere for beskjeden å komme fram."
                    labels={{ normal: 'Ryddig', warn: 'Rotete', danger: 'BESKJEDEN STOPPER!' }}
                />

                {phase === 'playing' && (
                    <p className="text-sm text-slate-600">
                        Kongen sitter i København. Under ham står stattholderen i Christiania, så to
                        amtmenn, og nederst fogdene ute i bygdene. Knytt punktene sammen ett trinn om
                        gangen, ovenfra og ned. Hopper du over et ledd, blir det bare rot.
                    </p>
                )}

                {phase === 'playing' && wrong > 0 && (
                    <SceneFact>
                        Før 1660 satt det lensherrer ute i landet. Mange av dem var adelsmenn som
                        styrte omtrent som de ville. Etter 1660 satte kongen inn amtmenn på fast
                        lønn, og de svarte direkte til København.
                    </SceneFact>
                )}

                {phase === 'lost' && (
                    <LoseScreen title="Skatten kom aldri fram til kongen" onRetry={reset}>
                        En befaling måtte gå ett trinn om gangen: fra kongen til stattholderen, ned
                        til amtmannen, og derfra til fogden i bygda. Hopper man over et ledd, vet
                        ingen hvem som har ansvaret. Prøv igjen, og bygg kjeden ovenfra og ned.
                    </LoseScreen>
                )}

                {phase === 'won' && (
                    <WinScreen title="Kjeden henger sammen, og skatten ruller inn" onReplay={reset}>
                        Dette er det eneveldet egentlig ga kongen. Ikke bare et papir som sa at han
                        bestemte alt, men et apparat av lønnede embetsmenn som nådde helt ned i hver
                        eneste bygd. Beskjeden fra København kom fram, og skatten fant veien tilbake.
                        En konge uten dette apparatet kunne skrive hva han ville. Det ville bare ikke
                        skje noe.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Riket({
    phase,
    arrived,
    onConnect,
    onComplete,
    onArrive,
}: {
    phase: Phase;
    arrived: number;
    onConnect: (a: string, b: string, valid: boolean) => void;
    onComplete: () => void;
    onArrive: () => void;
}) {
    return (
        <group>
            <GroundPlane size={46} depth={30} color="#7d9a58" />

            {/* København: kongens sete, størst og med vaiende faner. Alt står
                på flat bakke (y=0), så ingenting svever eller graver seg ned. */}
            <group position={[-7.6, 0, 1.2]}>
                <Tower position={[0, 0, -1.2]} radius={0.9} height={3.4} color="#c8bda6" roof="#5d7a8c" />
                <Building
                    position={[-1.5, 0, 0.9]}
                    body="#cbbfa6"
                    roof="#6d5140"
                    w={2.1}
                    h={1.6}
                    d={1.8}
                    seed={2}
                />
                <Building
                    position={[1.9, 0, 1.0]}
                    body="#c2b49a"
                    roof="#6d5140"
                    w={1.9}
                    h={1.4}
                    d={1.7}
                    seed={9}
                />
                <Banner position={[-1.0, 0, 2.1]} color="#a8322c" height={2.4} />
                <Banner position={[1.1, 0, 2.2]} color="#a8322c" height={2.2} />
                <Person
                    position={[0.1, 0, 2.4]}
                    rotation={[0, 2.6, 0]}
                    pose="idle"
                    hat="crown"
                    hatColor="#e0b23a"
                    body="#6c2b2b"
                />
            </group>

            {/* Christiania: stattholderens by */}
            <group position={[-3.2, 0, 1.4]}>
                <Tower position={[0, 0, -1.0]} radius={0.7} height={2.9} color="#b7ad9b" roof="#5c3326" />
                <Building
                    position={[-1.6, 0, 0.7]}
                    body="#b08c63"
                    roof="#5c3326"
                    w={1.7}
                    h={1.3}
                    d={1.5}
                    seed={5}
                />
                <Building
                    position={[1.5, 0, 0.8]}
                    body="#a8845c"
                    roof="#5c3326"
                    w={1.6}
                    h={1.2}
                    d={1.4}
                    seed={12}
                />
                <Person position={[0.2, 0, 1.8]} rotation={[0, 2.9, 0]} pose="idle" hat="hood" body="#3f4a5c" />
            </group>

            {/* De to amtene */}
            <Amt position={[1.2, 0, -3.2]} seed={3} />
            <Amt position={[1.2, 0, 3.4]} seed={8} />

            {/* Bygdene med fogd og gårder */}
            <Bygd position={[5.9, 0, -4.8]} seed={6} />
            <Bygd position={[5.9, 0, -1.3]} seed={14} />
            <Bygd position={[5.9, 0, 3.6]} seed={21} />

            {/* Litt landskap mellom stedene */}
            <Tree position={[-5.6, 0, -3.4]} seed={2} />
            <Tree position={[-5.4, 0, 4.9]} seed={7} />
            <Tree position={[3.2, 0, -6.1]} seed={13} />
            <Tree position={[3.4, 0, 6.0]} seed={19} />
            <Tree position={[8.3, 0, 1.4]} seed={23} />
            <Rock position={[-1.2, 0.2, -5.4]} />
            <Rock position={[3.9, 0.2, 1.4]} scale={0.8} />

            {/* En bud som går sin runde uansett hva eleven gjør */}
            <Budet />

            {/* Selve oppgaven: knytt kommandolinjen sammen */}
            {phase === 'playing' && (
                <Connector
                    nodes={NODES}
                    correct={CORRECT}
                    nodeRadius={0.44}
                    linkRadius={0.075}
                    onConnect={onConnect}
                    onComplete={onComplete}
                />
            )}

            {/* Seieren: skatten ruller opp gjennom leddene til kongen */}
            {phase === 'won' && (
                <group>
                    <FerdigKjede />
                    {ROUTES.map((route, i) => (
                        <Skattevogn key={i} route={route} bobPhase={i} onArrive={onArrive} />
                    ))}
                    <Burst position={[-7.6, 1.8, 3.4]} trigger={arrived} color="#f6c453" />
                </group>
            )}
        </group>
    );
}

// Et amt: amtmannens gård med et uthus og amtmannen selv utenfor.
function Amt({ position, seed }: { position: [number, number, number]; seed: number }) {
    return (
        <group position={position}>
            <Building body="#9c7a52" roof="#4f3527" w={1.9} h={1.5} d={1.6} seed={seed} />
            <Building
                position={[1.7, 0, -1.0]}
                body="#8f7a58"
                roof="#4f3527"
                w={1.1}
                h={0.9}
                d={1.0}
                seed={seed + 3}
            />
            <Person position={[-1.2, 0, 1.2]} rotation={[0, 1.6, 0]} pose="idle" hat="cap" body="#4a4438" />
        </group>
    );
}

// Ei bygd: fogdens hus, en gård til og folk som bor der.
function Bygd({ position, seed }: { position: [number, number, number]; seed: number }) {
    return (
        <group position={position}>
            <Building body="#8a5f3c" roof="#4a3122" w={1.5} h={1.2} d={1.3} seed={seed} />
            <Building
                position={[1.4, 0, 1.3]}
                body="#7d5735"
                roof="#4a3122"
                w={1.1}
                h={0.9}
                d={1.0}
                seed={seed + 1}
            />
            <Person position={[-1.1, 0, 1.0]} rotation={[0, 1.4, 0]} pose="idle" body="#54604a" />
            <Person position={[0.7, 0, 2.0]} rotation={[0, 3.0, 0]} pose="idle" body="#63523f" />
            <Tree position={[-1.9, 0, -1.5]} seed={seed + 5} />
        </group>
    );
}

// En bud som går fram og tilbake langs bygdeveien. Verden lever uansett.
function Budet() {
    const [leg, setLeg] = useState(0);
    const a: [number, number, number] = [7.9, 0, -6.2];
    const b: [number, number, number] = [7.9, 0, 5.2];
    const from = leg % 2 === 0 ? a : b;
    const to = leg % 2 === 0 ? b : a;
    return (
        <Mover from={from} to={to} speed={1.5} onArrive={() => setLeg((l) => l + 1)}>
            <Person pose="walk" body="#5b5040" hat="cap" hatColor="#4a3f2f" />
        </Mover>
    );
}

// Skattevogn som ruller ledd for ledd oppover kjeden til kongen.
function Skattevogn({
    route,
    bobPhase,
    onArrive,
}: {
    route: string[];
    bobPhase: number;
    onArrive: () => void;
}) {
    const [leg, setLeg] = useState(0);
    const lastLeg = route.length - 1;
    if (leg >= lastLeg) return null;
    return (
        <Mover
            from={GROUND[route[leg]]}
            to={GROUND[route[leg + 1]]}
            speed={4.2}
            bob={0.04}
            phase={bobPhase}
            onArrive={() => {
                const next = leg + 1;
                setLeg(next);
                if (next >= lastLeg) onArrive();
            }}
        >
            <Cart color="#7a5230" />
        </Mover>
    );
}

// Den ferdige kjeden tegnet som gyldne bånd, så seieren er synlig etter at
// Connector-en er tatt ned.
function FerdigKjede() {
    const byId = useMemo(() => {
        const m: Record<string, [number, number, number]> = {};
        for (const n of NODES) m[n.id] = n.position;
        return m;
    }, []);
    return (
        <group>
            {CORRECT.map(([a, b]) => (
                <Baand key={`${a}-${b}`} from={byId[a]} to={byId[b]} />
            ))}
            {NODES.map((n) => (
                <mesh key={n.id} position={n.position}>
                    <sphereGeometry args={[0.44, 16, 16]} />
                    <meshStandardMaterial
                        color="#f6c453"
                        emissive="#f0b429"
                        emissiveIntensity={0.5}
                        roughness={0.4}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Ett gyllent bånd mellom to punkter. Sylinderen peker langs +Y som standard,
// så vi roterer den med en kvaternion i stedet for håndregnede Euler-vinkler.
function Baand({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
    const { mid, quaternion, length } = useMemo(() => {
        const a = new THREE.Vector3(...from);
        const b = new THREE.Vector3(...to);
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        const q = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir.clone().normalize()
        );
        return {
            mid: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
            quaternion: q,
            length: len,
        };
    }, [from, to]);

    return (
        <mesh position={mid} quaternion={quaternion}>
            <cylinderGeometry args={[0.075, 0.075, length, 10]} />
            <meshStandardMaterial
                color="#f6c453"
                emissive="#f0b429"
                emissiveIntensity={0.35}
                roughness={0.5}
            />
        </mesh>
    );
}

export default KongensArmer3D;
