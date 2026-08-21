import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    Hotspot,
    Mover,
    Person,
    Building,
    Tree,
    Rock,
    Banner,
    Tower,
    GroundPlane,
    Burst,
    useShake,
    useMeter,
    useGameClock,
    MeterBar,
    TimerPill,
    DangerVignette,
    ScreenFlash,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
    THEMES,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: så lenge flere menn har LOVLIG krav på kronen, ulmer krigen
// uansett hvor mange opprør kongen slår ned. Å slå ned et opprør hjelper i noen
// sekunder. Å stramme inn arveloven fjerner selve krigsgrunnen for godt.
// Eleven må oppdage det ved å tape på den første måten og vinne på den andre.

const T = THEMES.medieval;

const SPAWN_RADIUS = 8.0;
const THRONE_RADIUS = 3.6;
const WALK_SPEED = 0.62;
const TIME_LIMIT = 80;
// Hva et kongsemne som når tronen koster, og hva et nedslått opprør koster.
const BREACH_COST = 0.1;
const STRIKE_COST = 0.02;

// Hver innstramming av loven fjerner én klasse kongsemner for godt.
type ClaimClass = 'frille' | 'yngre' | 'samkonge';

const CLASS_ORDER: ClaimClass[] = ['frille', 'yngre', 'samkonge'];

const CLASS_INFO: Record<ClaimClass, { label: string; body: string; hat: 'helmet' | 'hood' | 'cap' }> = {
    frille: {
        label: 'Sønn født utenfor ekteskap',
        body: '#7a5a3a',
        hat: 'hood',
    },
    yngre: {
        label: 'Yngre bror av kongen',
        body: '#4a5f7a',
        hat: 'helmet',
    },
    samkonge: {
        label: 'Samkonge som vil ha hele landet',
        body: '#6d3a52',
        hat: 'cap',
    },
};

// Teksten som forklarer hva loven nettopp fjernet.
const LAW_STEP_TEXT = [
    'Loven sier nå: bare sønner født i ekteskap kan arve. Frillesønnene mistet kravet sitt.',
    'Loven sier nå: bare den eldste sønnen arver. De yngre brødrene mistet kravet sitt.',
    'Loven sier nå: Norge skal ha én konge om gangen. Samkongene mistet kravet sitt.',
];

interface Claim {
    key: number;
    cls: ClaimClass;
    angle: number;
    status: 'moving' | 'dying';
}

type GameState = 'idle' | 'playing' | 'lostWar' | 'lostTime' | 'won';

// ── Tronen: stein-podium, kongsstol, krone og lovrullen på pulten ────────────
function ThroneDais({
    lawStep,
    sealClicks,
    onLawClick,
    active,
    burstTrigger,
}: {
    lawStep: number;
    sealClicks: number;
    onLawClick: () => void;
    active: boolean;
    burstTrigger: number;
}) {
    return (
        <group>
            {/* Podium: topp ligger på y = 0.4 */}
            <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[3.2, 3.5, 0.4, 28]} />
                <meshStandardMaterial color={T.stone} roughness={0.95} />
            </mesh>

            {/* Kongsstol - står på podiet */}
            <group position={[0, 0.4, -1.1]}>
                <mesh position={[0, 0.22, 0]} castShadow>
                    <boxGeometry args={[0.9, 0.44, 0.8]} />
                    <meshStandardMaterial color={T.wood} roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.85, -0.34]} castShadow>
                    <boxGeometry args={[0.9, 1.2, 0.14]} />
                    <meshStandardMaterial color={T.wood} roughness={0.9} />
                </mesh>
            </group>

            {/* Kronesøyle med krone på toppen */}
            <group position={[0, 0.4, 0.2]}>
                <mesh position={[0, 0.45, 0]} castShadow>
                    <cylinderGeometry args={[0.24, 0.3, 0.9, 12]} />
                    <meshStandardMaterial color="#b9b2a4" roughness={0.9} />
                </mesh>
                {/* Krone: stående bånd (riktig - en krone er en loddrett ring) */}
                <mesh position={[0, 1.04, 0]} castShadow>
                    <cylinderGeometry args={[0.26, 0.26, 0.28, 16, 1, true]} />
                    <meshStandardMaterial
                        color="#e3b23c"
                        metalness={0.55}
                        roughness={0.35}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {[0, 1, 2, 3, 4].map((i) => {
                    const a = (i / 5) * Math.PI * 2;
                    return (
                        <mesh
                            key={i}
                            position={[Math.cos(a) * 0.26, 1.28, Math.sin(a) * 0.26]}
                            castShadow
                        >
                            <coneGeometry args={[0.06, 0.16, 6]} />
                            <meshStandardMaterial color="#e3b23c" metalness={0.55} roughness={0.35} />
                        </mesh>
                    );
                })}
                <Burst position={[0, 1.1, 0]} trigger={burstTrigger} />
            </group>

            {/* Lovpult med lovrullen - står på podiet foran krona */}
            <group position={[0, 0.4, 2.1]}>
                <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.1, 0.7, 0.62]} />
                    <meshStandardMaterial color={T.wood} roughness={0.92} />
                </mesh>
                {/* Rullen ligger vannrett på pulten (akse langs X) */}
                <mesh position={[0, 0.83, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.13, 0.13, 0.9, 12]} />
                    <meshStandardMaterial color="#efe4c8" roughness={0.85} />
                </mesh>
                {/* Tre segl - fylles opp mens eleven stemmer loven gjennom */}
                {[0, 1, 2].map((i) => (
                    <mesh key={i} position={[-0.3 + i * 0.3, 0.72, 0.33]}>
                        <sphereGeometry args={[0.075, 10, 10]} />
                        <meshStandardMaterial
                            color={i < sealClicks ? '#dc2626' : '#cbd5e1'}
                            emissive={i < sealClicks ? '#7f1d1d' : '#000000'}
                            emissiveIntensity={i < sealClicks ? 0.35 : 0}
                            roughness={0.7}
                        />
                    </mesh>
                ))}
            </group>

            {active && lawStep < 3 && (
                <Hotspot
                    position={[0, 2.0, 2.1]}
                    onSelect={onLawClick}
                    radius={0.44}
                    label={`Stram inn loven (${sealClicks}/3)`}
                    color="#0ea5e9"
                    sound="advance"
                />
            )}
        </group>
    );
}

// ── Scenen ───────────────────────────────────────────────────────────────────
function RealmScene({
    claims,
    lawStep,
    sealClicks,
    playing,
    won,
    breaches,
    burstTrigger,
    onStrike,
    onArrive,
    onRemove,
    onLawClick,
}: {
    claims: Claim[];
    lawStep: number;
    sealClicks: number;
    playing: boolean;
    won: boolean;
    breaches: number;
    burstTrigger: number;
    onStrike: (key: number) => void;
    onArrive: (key: number) => void;
    onRemove: (key: number) => void;
    onLawClick: () => void;
}) {
    const { ref: shakeRef, shake } = useShake(0.22, 0.045, 2.2);

    // Riket skjelver hver gang et kongsemne når fram til tronen.
    const lastBreach = useRef(breaches);
    useEffect(() => {
        if (breaches > lastBreach.current) shake(0.8);
        lastBreach.current = breaches;
    }, [breaches, shake]);

    return (
        <group ref={shakeRef}>
            <GroundPlane size={40} depth={40} color={T.ground} />

            <ThroneDais
                lawStep={lawStep}
                sealClicks={sealClicks}
                onLawClick={onLawClick}
                active={playing}
                burstTrigger={burstTrigger}
            />

            {/* Kongsgården: hallen bak tronen, med vakttårn på hver side */}
            <Building position={[0, 0, -6.2]} w={5.4} h={2.6} d={3.2} body="#8d6a44" roof="#4a3420" />
            <Tower position={[-3.4, 0, -5.4]} radius={0.7} height={3.2} color={T.stone} roof="#4a3420" />
            <Tower position={[3.4, 0, -5.4]} radius={0.7} height={3.2} color={T.stone} roof="#4a3420" />
            <Building position={[-6.2, 0, -2.6]} w={2.6} h={1.5} d={2.0} body="#8d6a44" roof="#4a3420" seed={7} />
            <Building position={[6.2, 0, -2.4]} w={2.6} h={1.5} d={2.0} body="#8d6a44" roof="#4a3420" seed={11} />
            <Banner position={[-2.7, 0.4, 2.3]} color={T.accent} height={2.4} />
            <Banner position={[2.7, 0.4, 2.3]} color={T.accent} height={2.4} />
            <Tree position={[7.4, 0, 2.2]} leaf={T.leaf} seed={2} />
            <Tree position={[-7.4, 0, 2.0]} leaf={T.leaf} seed={5} />
            <Tree position={[-4.4, 0, 6.0]} leaf={T.leaf} seed={13} />
            <Tree position={[4.6, 0, 6.2]} leaf={T.leaf} seed={17} />
            <Rock position={[-6.6, 0, 5.2]} />
            <Rock position={[6.6, 0, 5.0]} />

            {/* Seiersbildet: én kronet arving står igjen ved tronen */}
            {won && <Person position={[0, 0.4, 1.4]} pose="raise" hat="crown" body="#8a2b2b" scale={1.05} />}

            {/* Kongsemnene marsjerer mot tronen - uansett hva eleven gjør */}
            {claims.map((c) => {
                const info = CLASS_INFO[c.cls];
                const fx = Math.cos(c.angle) * SPAWN_RADIUS;
                const fz = Math.sin(c.angle) * SPAWN_RADIUS;
                const tx = Math.cos(c.angle) * THRONE_RADIUS;
                const tz = Math.sin(c.angle) * THRONE_RADIUS;
                return (
                    <Mover
                        key={c.key}
                        from={[fx, 0, fz]}
                        to={[tx, 0, tz]}
                        speed={WALK_SPEED}
                        state={c.status}
                        deathStyle="pop"
                        phase={c.key}
                        onArrive={() => onArrive(c.key)}
                        onDeathDone={() => onRemove(c.key)}
                    >
                        <Interactive
                            onSelect={() => onStrike(c.key)}
                            disabled={c.status !== 'moving' || !playing}
                            hitArea={[1.5, 2.2, 1.5]}
                            hoverScale={1.1}
                            sound="correct"
                        >
                            {(s) => (
                                <group>
                                    <Person
                                        pose="walk"
                                        body={s === 'hover' ? '#c2410c' : info.body}
                                        hat={info.hat}
                                        hatColor="#3f3f46"
                                        scale={1.05}
                                    />
                                    {/* Spyd - gjør figuren lettere å se og treffe */}
                                    <mesh position={[0.26, 0.72, 0]} castShadow>
                                        <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
                                        <meshStandardMaterial color="#6b4f2a" roughness={0.9} />
                                    </mesh>
                                </group>
                            )}
                        </Interactive>
                    </Mover>
                );
            })}
        </group>
    );
}

// ── Spillet ──────────────────────────────────────────────────────────────────
const Kongsemnene3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [claims, setClaims] = useState<Claim[]>([]);
    const [lawStep, setLawStep] = useState(0);
    const [sealClicks, setSealClicks] = useState(0);
    const [breaches, setBreaches] = useState(0);
    const [strikes, setStrikes] = useState(0);
    const [burstTrigger, setBurstTrigger] = useState(0);
    const [flash, setFlash] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    const nextKey = useRef(1);
    const sounds = useStepSounds();
    const crowd = useAmbience('crowd');

    // Refs, ikke state, i intervallene under: `war`/`claims` endrer identitet
    // mange ganger i sekundet, og hadde de stått i deps ville intervallene blitt
    // ryddet bort før de rakk å fyre.
    const activeCountRef = useRef(CLASS_ORDER.length);
    const sealRef = useRef(0);
    const breachRef = useRef(0);

    const activeCount = CLASS_ORDER.length - lawStep;
    useEffect(() => {
        activeCountRef.current = CLASS_ORDER.length - lawStep;
    }, [lawStep]);

    const war = useMeter({
        drainPerSecond: 0.03,
        overloadAt: 1,
        recoverTo: 0.4,
        onOverload: () => {
            setGameState('lostWar');
            setBanner(null);
            sounds.play('incorrect');
            crowd.stop();
        },
    });

    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => {
            setGameState('lostTime');
            setBanner(null);
            crowd.stop();
        },
    });

    // Grunnuroen: hver gruppe som fortsatt har lovlig krav holder krigen i live
    // av seg selv. Dette er kjernen - opprørene er bare symptomet.
    const warAdd = war.add;
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            warAdd(0.0021 * activeCountRef.current);
        }, 100);
        return () => clearInterval(t);
    }, [gameState, warAdd]);

    // Nye kongsemner reiser seg. Jo flere grupper som fortsatt har krav,
    // jo tettere kommer de.
    useEffect(() => {
        if (gameState !== 'playing') return;
        const t = setInterval(() => {
            const n = activeCountRef.current;
            if (n === 0) return;
            const chance = n >= 3 ? 0.41 : n === 2 ? 0.3 : 0.2;
            if (Math.random() > chance) return;
            const active = CLASS_ORDER.slice(CLASS_ORDER.length - n);
            const cls = active[Math.floor(Math.random() * active.length)];
            const angle = Math.random() * Math.PI * 2;
            const key = nextKey.current++;
            setClaims((prev) => (prev.length >= 7 ? prev : [...prev, { key, cls, angle, status: 'moving' }]));
        }, 900);
        return () => clearInterval(t);
    }, [gameState]);

    const remove = useCallback((key: number) => {
        setClaims((prev) => prev.filter((c) => c.key !== key));
    }, []);

    // Slå ned et opprør: virker med en gang, men bare i noen sekunder.
    const strike = useCallback(
        (key: number) => {
            setClaims((prev) =>
                prev.map((c) => (c.key === key ? { ...c, status: 'dying' as const } : c))
            );
            setStrikes((s) => s + 1);
            warAdd(STRIKE_COST);
        },
        [warAdd]
    );

    // Et kongsemne nådde tronen: krigen blusser opp.
    const arrive = useCallback(
        (key: number) => {
            remove(key);
            breachRef.current += 1;
            setBreaches(breachRef.current);
            setFlash((f) => f + 1);
            warAdd(BREACH_COST);
            sounds.play('incorrect');
            setBanner('Et kongsemne nådde tronen. Krigen blusser opp.');
            setTimeout(() => setBanner(null), 2200);
        },
        [remove, warAdd, sounds]
    );

    const win = useCallback(() => {
        setClaims([]);
        setGameState('won');
        setBanner(null);
        sounds.play('complete');
        crowd.stop();
        onComplete({ score: Math.max(0.5, 1 - breachRef.current * 0.1), completed: true });
    }, [sounds, crowd, onComplete]);

    // Lovrullen: tre stemmer per innstramming. Hver fullført innstramming
    // fjerner en hel gruppe kongsemner for godt. Ingen sideeffekter inne i en
    // state-updater - den kalles to ganger i StrictMode.
    const clickLaw = useCallback(() => {
        if (gameState !== 'playing') return;
        const next = sealRef.current + 1;
        if (next < 3) {
            sealRef.current = next;
            setSealClicks(next);
            return;
        }
        sealRef.current = 0;
        setSealClicks(0);
        const removed = CLASS_ORDER[lawStep];
        setClaims((cs) => cs.map((c) => (c.cls === removed ? { ...c, status: 'dying' as const } : c)));
        setBurstTrigger((b) => b + 1);
        setBanner(LAW_STEP_TEXT[lawStep]);
        setTimeout(() => setBanner(null), 3200);
        const nextStep = lawStep + 1;
        setLawStep(nextStep);
        if (nextStep >= 3) setTimeout(win, 700);
    }, [gameState, lawStep, win]);

    const begin = useCallback(() => {
        setClaims([]);
        setLawStep(0);
        setSealClicks(0);
        setBreaches(0);
        setStrikes(0);
        nextKey.current = 1;
        sealRef.current = 0;
        breachRef.current = 0;
        activeCountRef.current = CLASS_ORDER.length;
        war.reset();
        clock.restart();
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        crowd.start();
        setBanner('Klikk kongsemnene for å slå ned opprørene - eller stram inn loven på pulten.');
        setTimeout(() => setBanner(null), 4200);
    }, [war, clock, sounds, crowd]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setClaims([]);
        setLawStep(0);
        setSealClicks(0);
        setBanner(null);
        sealRef.current = 0;
        breachRef.current = 0;
        activeCountRef.current = CLASS_ORDER.length;
        war.reset();
        crowd.stop();
    }, [war, crowd]);

    const playing = gameState === 'playing';

    return (
        <MicroGameScaffold
            title="Kongsemnene"
            subtitle="Du er konge i Norge. Slå ned opprørene - eller fjern grunnen til at de kommer"
            estimatedSeconds={150}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                camera: { position: [0, 10.5, 18] as [number, number, number], fov: 44 },
                target: [0, 1, 0] as [number, number, number],
                background: T.sky,
                fog: { color: T.fog, near: 26, far: 54 },
                light: 'overcast',
                idle: false,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <ScreenFlash trigger={flash} preset="flare" durationMs={150} />
                    <DangerVignette level={playing ? war.value : 0} />
                    {playing && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Grupper med lovlig krav', value: activeCount },
                                { label: 'Kongsemner ute', value: claims.length },
                                { label: 'Loven', value: `${lawStep}/3` },
                            ]}
                        />
                    )}
                    {playing && (
                        <TimerPill seconds={clock.remaining} label="Din regjeringstid" warnBelow={20} corner="br" />
                    )}
                </>
            }
            scene={
                <RealmScene
                    key={attempt}
                    claims={claims}
                    lawStep={lawStep}
                    sealClicks={sealClicks}
                    playing={playing}
                    won={gameState === 'won'}
                    breaches={breaches}
                    burstTrigger={burstTrigger}
                    onStrike={strike}
                    onArrive={arrive}
                    onRemove={remove}
                    onLawClick={clickLaw}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed max-w-lg mx-auto">
                        Kongen er død, og flere menn mener de har rett til kronen. Klikk et kongsemne
                        for å slå ned opprøret hans. Klikk lovrullen på pulten tre ganger for å stramme
                        inn arveloven ett hakk. Finn ut hva som faktisk stopper krigen.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow"
                    >
                        Ta imot kronen
                    </button>
                </div>
            )}

            {playing && (
                <MeterBar
                    value={war.value}
                    label="Krigsfare"
                    hint="Så lenge flere har lovlig krav på kronen, stiger krigsfaren av seg selv. Å slå ned et opprør hjelper bare en liten stund."
                    labels={{ normal: 'Uro', warn: 'Opprør', danger: 'BORGERKRIG' }}
                />
            )}

            {gameState === 'lostWar' && (
                <LoseScreen title="Landet gikk i borgerkrig" onRetry={begin}>
                    Du slo ned opprør etter opprør, men nye kongsemner kom hele tiden. Det hjelper
                    ikke å slå ned menn som har loven på sin side. Prøv igjen, og bruk lovrullen
                    på pulten: hver innstramming fjerner en hel gruppe arvinger for godt.
                </LoseScreen>
            )}

            {gameState === 'lostTime' && (
                <LoseScreen title="Regjeringstiden din tok slutt" onRetry={begin}>
                    Du rakk ikke å endre loven mens du levde. Da du døde, sto det fortsatt flere menn
                    klare med lovlig krav - og krigen fortsatte inn i neste generasjon. Slik gikk det
                    i Norge i over hundre år.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title="Én arving. Krigen tok slutt."
                    onReplay={begin}
                    onNext={() => onComplete({ score: Math.max(0.5, 1 - breaches * 0.1), completed: true })}
                >
                    Du slo ned {strikes} opprør, men det var loven som stoppet krigen. Slik gikk det i
                    virkeligheten også: tronfølgeloven av 1163 slo fast at den eldste sønnen født i
                    ekteskap skulle arve, og loven fra 1260 gjorde Norge til et rent arvekongedømme.
                    Da var det ingen igjen som kunne reise hær med loven i ryggen.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default Kongsemnene3D;
