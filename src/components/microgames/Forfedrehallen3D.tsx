import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    AimPlane,
    SceneBanner,
    SceneBadge,
    SceneFact,
    DataReadout,
    WinScreen,
    LoseScreen,
    MeterBar,
    DangerVignette,
    ScreenFlash,
    Person,
    Column,
    Smoke,
    GlowMaterial,
    THEMES,
    useMeter,
    useShake,
    damp,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Mikrospill: Seremonien i forfedrehallen.
//
// Arketype: "reager i tide". Eleven står som yngste embetsmann bakerst i en
// konfusiansk forfedrehall. Den eldste ved alteret gir tegn, og et bukk ruller
// nedover rekkene mot deg. Hold inne for å bøye deg - og bøy deg NÅR bukket når
// fram, ikke før og ikke etter.
//
// LYSPÆRA: li - de faste formene - var ikke pynt. Å gjøre riktig ting til riktig
// tid var selve treningen i å høre til et fellesskap. Derfor straffer spillet
// begge feil: den som aldri bøyer seg bryter rekka, og den som står bøyd hele
// tiden bryter den like mye.

const T = THEMES.asian;

const TOTAL_ROUNDS = 6;
const MIN_HITS = 4;

// Hvor bukket starter (ved alteret) og ender (der eleven står).
const WAVE_FROM = -6.6;
const WAVE_TO = 2.6;

// Embetsmennene i to rekker langs midtgangen. z stiger mot eleven.
const OFFICIALS: { x: number; z: number; body: string; hat: 'cap' | 'hood' | 'none' }[] = [
    { x: -1.95, z: -4.7, body: '#4c5f7a', hat: 'cap' },
    { x: 1.95, z: -4.7, body: '#5a4a6e', hat: 'cap' },
    { x: -1.95, z: -3.1, body: '#3f6b5c', hat: 'hood' },
    { x: 1.95, z: -3.1, body: '#6b4a3a', hat: 'cap' },
    { x: -1.95, z: -1.5, body: '#5a4a6e', hat: 'cap' },
    { x: 1.95, z: -1.5, body: '#4c5f7a', hat: 'hood' },
    { x: -1.95, z: 0.1, body: '#6b4a3a', hat: 'cap' },
    { x: 1.95, z: 0.1, body: '#3f6b5c', hat: 'cap' },
];

const roundWave = (round: number) => Math.max(1.75, 2.65 - round * 0.15);
const roundGap = (round: number) => Math.max(1.5, 2.45 - round * 0.16);

interface CeremonyRefs {
    // Elevens bukk: 0 = rak rygg, 1 = dypt bukk. Styres av hold-input.
    bow: React.MutableRefObject<number>;
    holding: React.MutableRefObject<boolean>;
}

// Kamera i øyehøyde som faktisk bøyer seg. PovCamera har fast lookAhead, og
// et bukk må kunne endre BÅDE høyde og blikkretning - derfor egen rigg her.
function BowCamera({ bowRef }: { bowRef: React.MutableRefObject<number> }) {
    const { camera } = useThree();
    const cur = useRef(0);
    useFrame((state, dt) => {
        cur.current = damp(cur.current, bowRef.current, dt, 8);
        const b = cur.current;
        const t = state.clock.getElapsedTime();
        const breathe = Math.sin(t * 1.5) * 0.012;
        camera.position.set(0, 1.62 - b * 0.5 + breathe, 6.6 + b * 0.2);
        camera.lookAt(0, 1.25 - b * 2.2, 2.6);
    });
    return null;
}

// Én embetsmann med bukk-pivot i føttene (ingenting svever).
function Official({
    x,
    z,
    body,
    hat,
    bowRef,
}: {
    x: number;
    z: number;
    body: string;
    hat: 'cap' | 'hood' | 'none';
    bowRef: React.MutableRefObject<number>;
}) {
    const pivot = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!pivot.current) return;
        pivot.current.rotation.x = damp(pivot.current.rotation.x, bowRef.current * 0.8, dt, 9);
    });
    return (
        <group position={[x, 0, z]} rotation={[0, Math.PI, 0]}>
            <group ref={pivot}>
                <Person body={body} hat={hat} hatColor="#2b2b2b" legs="#2f2a25" pose="idle" />
            </group>
        </group>
    );
}

function Hall({
    refs,
    running,
    onJudge,
    onWrongHold,
    onWaveStart,
    attempt,
}: {
    refs: CeremonyRefs;
    running: boolean;
    onJudge: (hit: boolean) => void;
    onWrongHold: (amount: number) => void;
    onWaveStart: () => void;
    attempt: number;
}) {
    const { ref: shakeRef, shake } = useShake(0.16, 0.03, 2.2);

    // Bukk-nivå per embetsmann (0-1). Leses kun i useFrame.
    const bows = useMemo(
        () => OFFICIALS.map(() => ({ current: 0 })) as React.MutableRefObject<number>[],
        []
    );

    // Gongen som svinger når den eldste gir tegn.
    const gong = useRef<THREE.Group>(null);
    const gongSwing = useRef(0);

    const cb = useRef({ onJudge, onWrongHold, onWaveStart });
    useEffect(() => {
        cb.current = { onJudge, onWrongHold, onWaveStart };
    }, [onJudge, onWrongHold, onWaveStart]);

    // Hele seremoniens tidslinje bor her - én kilde, lest kun i useFrame.
    const st = useRef({
        t: 0,
        round: 0,
        waveT: -1,
        bowedInWindow: false,
        judged: false,
        nextAt: 1.6,
    });

    // Nullstill ved nytt forsøk (scenen remountes på attempt).
    useEffect(() => {
        st.current = { t: 0, round: 0, waveT: -1, bowedInWindow: false, judged: false, nextAt: 1.6 };
    }, [attempt]);

    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        const s = st.current;

        if (running) {
            s.t += dt;
            const wave = roundWave(s.round);

            if (s.waveT < 0 && s.t >= s.nextAt && s.round < TOTAL_ROUNDS) {
                s.waveT = 0;
                s.bowedInWindow = false;
                s.judged = false;
                gongSwing.current = 1;
                cb.current.onWaveStart();
            }

            if (s.waveT >= 0) {
                s.waveT += dt;
                const travel = s.waveT / wave;

                // Elevens vindu: bukket ruller inn i rekka der eleven står.
                const inWindow = travel >= 0.72 && travel <= 1.1;
                if (inWindow && refs.bow.current >= 0.5) s.bowedInWindow = true;

                // Straff for å stå bøyd utenfor formen: for tidlig eller for lenge.
                const inGrace = travel >= 0.45 && travel <= 1.45;
                if (!inGrace && refs.bow.current >= 0.4) cb.current.onWrongHold(dt * 0.3);

                if (!s.judged && travel > 1.1) {
                    s.judged = true;
                    cb.current.onJudge(s.bowedInWindow);
                    if (!s.bowedInWindow) shake(0.55);
                }

                if (s.waveT > wave + 0.9) {
                    s.waveT = -1;
                    s.round += 1;
                    s.nextAt = s.t + roundGap(s.round);
                }
            } else if (refs.bow.current >= 0.4) {
                cb.current.onWrongHold(dt * 0.3);
            }
        }

        // Bukk-bølgen: hver embetsmann bøyer seg når fronten passerer ham.
        const wave = roundWave(s.round);
        OFFICIALS.forEach((o, i) => {
            let target = 0;
            if (s.waveT >= 0) {
                const passAt = ((o.z - WAVE_FROM) / (WAVE_TO - WAVE_FROM)) * wave;
                const local = s.waveT - passAt;
                if (local > 0 && local < 1.0) {
                    target = Math.max(0, Math.min(1, Math.min(local / 0.2, (1.0 - local) / 0.3)));
                }
            }
            bows[i].current = damp(bows[i].current, target, dt, 9);
        });

        // Gongen svinger av og dør ut.
        gongSwing.current = Math.max(0, gongSwing.current - dt * 0.9);
        if (gong.current) {
            gong.current.rotation.z = Math.sin(s.t * 9) * 0.28 * gongSwing.current;
        }

        // Kun i utvikling: samme informasjon som eleven ser i scenen, slik at
        // balansen kan selvspilles av en bot (se build_microgame.md).
        if (import.meta.env.DEV) {
            (window as unknown as { __forfedrehallenDebug?: unknown }).__forfedrehallenDebug = {
                round: s.round,
                waveActive: s.waveT >= 0,
                travel: s.waveT >= 0 ? s.waveT / wave : -1,
            };
        }
    });

    return (
        <group ref={shakeRef}>
            <BowCamera bowRef={refs.bow} />

            {/* Hallgulv - bredere enn 26 enheter, så scene-revisjonen leser det
                som underlag og ikke som "modellen". Toppen ligger på y=0. */}
            <mesh position={[0, -0.06, -2]} receiveShadow>
                <boxGeometry args={[30, 0.12, 34]} />
                <meshStandardMaterial color="#6b4630" roughness={0.85} />
            </mesh>
            {/* Midtgangen i lysere tre */}
            <mesh position={[0, 0.005, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[2.4, 22]} />
                <meshStandardMaterial color="#8a5c3c" roughness={0.8} />
            </mesh>

            {/* Søylerekker - lakkerte trestolper */}
            {[-7, -4.4, -1.8, 0.8].map((z) => (
                <React.Fragment key={`col-${z}`}>
                    <Column position={[-3.4, 0, z]} height={3.3} radius={0.2} color={T.wood} />
                    <Column position={[3.4, 0, z]} height={3.3} radius={0.2} color={T.wood} />
                </React.Fragment>
            ))}
            {/* Tverrbjelker som binder søylene sammen */}
            {[-3.4, 3.4].map((x) => (
                <mesh key={`beam-${x}`} position={[x, 3.5, -3.1]} castShadow>
                    <boxGeometry args={[0.28, 0.22, 8.4]} />
                    <meshStandardMaterial color="#4e2b22" roughness={0.8} />
                </mesh>
            ))}

            {/* Bakvegg bak alteret - lukker hallen så gulvet ikke ender i tomrom.
                Holdt smalere enn søylerekkene, så modellboksen ikke blir bredere
                enn kamerautsnittet nærmest eleven. */}
            <mesh position={[0, 2.1, -9.0]} receiveShadow>
                <boxGeometry args={[8, 4.2, 0.3]} />
                <meshStandardMaterial color="#d8bb96" roughness={0.95} />
            </mesh>
            <mesh position={[0, 4.28, -9.0]} castShadow>
                <boxGeometry args={[8.6, 0.26, 0.7]} />
                <meshStandardMaterial color="#4e2b22" roughness={0.8} />
            </mesh>

            {/* Alterplattformen med forfedretavlene */}
            <mesh position={[0, 0.2, -7.4]} castShadow receiveShadow>
                <boxGeometry args={[5.4, 0.4, 1.8]} />
                <meshStandardMaterial color={T.stone} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.62, -7.8]} castShadow>
                <boxGeometry args={[4.2, 0.44, 0.7]} />
                <meshStandardMaterial color="#4e2b22" roughness={0.8} />
            </mesh>
            {[-1.5, -0.75, 0, 0.75, 1.5].map((x) => (
                <mesh key={`tavle-${x}`} position={[x, 1.14, -7.8]} castShadow>
                    <boxGeometry args={[0.34, 0.6, 0.08]} />
                    <meshStandardMaterial color="#f2e7cc" roughness={0.6} />
                </mesh>
            ))}

            {/* Røkelseskar med røyk - står PÅ plattformen (y = 0.4) */}
            {[-2.1, 2.1].map((x) => (
                <group key={`kar-${x}`} position={[x, 0.4, -7.3]}>
                    <mesh position={[0, 0.16, 0]} castShadow>
                        <cylinderGeometry args={[0.24, 0.18, 0.32, 14]} />
                        <meshStandardMaterial color="#7a5a2e" roughness={0.5} metalness={0.3} />
                    </mesh>
                    <Smoke origin={[0, 0.34, 0]} count={2} color="#e9e0d1" />
                </group>
            ))}

            {/* Den eldste ved alteret - står PÅ plattformen og vender mot rekkene */}
            <group position={[0, 0.4, -6.6]}>
                <Person body={T.accent} hat="crown" hatColor="#3a2a18" legs="#2f2a25" pose="raise" />
            </group>

            {/* Gongen ved siden av alteret */}
            <group position={[-3.0, 0, -6.6]}>
                <mesh position={[0, 1.05, 0]} castShadow>
                    <boxGeometry args={[0.12, 2.1, 0.12]} />
                    <meshStandardMaterial color="#4e2b22" roughness={0.8} />
                </mesh>
                <mesh position={[0.55, 2.05, 0]} castShadow>
                    <boxGeometry args={[1.2, 0.12, 0.12]} />
                    <meshStandardMaterial color="#4e2b22" roughness={0.8} />
                </mesh>
                <group ref={gong} position={[1.05, 2.0, 0]}>
                    <mesh position={[0, -0.18, 0]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.36, 8]} />
                        <meshStandardMaterial color="#3a2a18" />
                    </mesh>
                    <mesh position={[0, -0.62, 0]} castShadow>
                        <cylinderGeometry args={[0.5, 0.5, 0.07, 22]} />
                        <meshStandardMaterial color="#b8862f" roughness={0.4} metalness={0.6} />
                    </mesh>
                </group>
            </group>

            {/* Papirlykter som henger i bjelkene - snor fra bjelke ned til lykt.
                Ingen additiv glød-halo her: bakgrunnen er lys, og en additiv
                halo blåser da ut til en hvit klump i stedet for et varmt skjær. */}
            {[-5.6, -2.4, 0.4].map((z) =>
                [-3.4, 3.4].map((x) => (
                    <group key={`lykt-${x}-${z}`} position={[x, 0, z]}>
                        <mesh position={[0, 3.12, 0]}>
                            <cylinderGeometry args={[0.015, 0.015, 0.46, 6]} />
                            <meshStandardMaterial color="#3a2a18" />
                        </mesh>
                        <mesh position={[0, 2.74, 0]} scale={[1, 0.85, 1]}>
                            <sphereGeometry args={[0.2, 14, 12]} />
                            <GlowMaterial color="#e8892f" />
                        </mesh>
                        <mesh position={[0, 2.92, 0]}>
                            <cylinderGeometry args={[0.09, 0.09, 0.06, 10]} />
                            <meshStandardMaterial color="#4e2b22" />
                        </mesh>
                    </group>
                ))
            )}

            {/* Embetsmennene i rekkene */}
            {OFFICIALS.map((o, i) => (
                <Official
                    key={`emb-${o.x}-${o.z}`}
                    x={o.x}
                    z={o.z}
                    body={o.body}
                    hat={o.hat}
                    bowRef={bows[i]}
                />
            ))}
        </group>
    );
}

type Phase = 'intro' | 'playing' | 'won' | 'lost';

export default function Forfedrehallen3D({ onComplete, onRetry }: MicroGameProps) {
    const [phase, setPhase] = useState<Phase>('intro');
    const [hits, setHits] = useState(0);
    const [rounds, setRounds] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Trykk Start seremonien under vinduet. Så holder du inne for å bøye deg.'
    );
    const [flash, setFlash] = useState(0);

    const bow = useRef(0);
    const holding = useRef(false);
    const score = useRef({ rounds: 0, hits: 0 });
    const refs = useMemo<CeremonyRefs>(() => ({ bow, holding }), []);

    const uro = useMeter({
        drainPerSecond: 0.03,
        overloadAt: 1,
        recoverTo: 0.4,
        onOverload: () => setPhase('lost'),
    });

    const setHold = useCallback((down: boolean) => {
        holding.current = down;
        bow.current = down ? 1 : 0;
    }, []);

    // Slipp bukket når spillet ikke lenger er i gang.
    useEffect(() => {
        if (phase !== 'playing') setHold(false);
    }, [phase, setHold]);

    const handleJudge = useCallback(
        (hit: boolean) => {
            const s = score.current;
            s.rounds += 1;
            if (hit) s.hits += 1;
            setRounds(s.rounds);
            setHits(s.hits);

            if (hit) {
                uro.add(-0.12);
                microSfx.play('correct');
                setBanner('I takt med rekka.');
            } else {
                uro.add(0.45);
                setFlash((f) => f + 1);
                microSfx.play('incorrect');
                setBanner('Du falt ut av rekka. De andre merket det.');
            }

            // Seremonien er over når alle bukkene er dømt.
            if (s.rounds >= TOTAL_ROUNDS) {
                if (s.hits >= MIN_HITS) {
                    setPhase('won');
                    microSfx.play('complete');
                    onComplete({ score: s.hits / TOTAL_ROUNDS, completed: true });
                } else {
                    setPhase('lost');
                }
            }
        },
        [uro, onComplete]
    );

    const handleWrongHold = useCallback(
        (amount: number) => {
            uro.add(amount);
        },
        [uro]
    );

    const handleWaveStart = useCallback(() => {
        microSfx.play('advance');
        setBanner('Den eldste gir tegn. Bukket ruller nedover rekkene.');
    }, []);

    const reset = useCallback(() => {
        setHold(false);
        score.current = { rounds: 0, hits: 0 };
        setHits(0);
        setRounds(0);
        uro.reset();
        setFlash(0);
        setBanner('Trykk Start seremonien under vinduet. Så holder du inne for å bøye deg.');
        setAttempt((a) => a + 1);
        setPhase('intro');
        onRetry?.();
    }, [onRetry, setHold, uro]);

    const start = useCallback(() => {
        score.current = { rounds: 0, hits: 0 };
        setHits(0);
        setRounds(0);
        uro.reset();
        setAttempt((a) => a + 1);
        setBanner('Den eldste gjør seg klar. Vent på tegnet.');
        setPhase('playing');
    }, [uro]);

    return (
        <MicroGameScaffold
            title="Seremonien i forfedrehallen"
            subtitle="Du er yngste embetsmann bakerst i hallen. Bøy deg i takt med rekka."
            estimatedSeconds={110}
            onRetry={reset}
            containerClassName="bg-gradient-to-b from-[#f0e2c8] via-[#e6d4bb] to-[#c9a887]"
            canvas={{
                controls: false,
                camera: { position: [0, 1.62, 6.6], fov: 64 },
                background: '#f2e4cb',
                fog: { color: '#e8d6bb', near: 12, far: 30 },
                light: 'golden',
                contactShadows: false,
            }}
            scene={
                <>
                    <Hall
                        key={attempt}
                        refs={refs}
                        running={phase === 'playing'}
                        onJudge={handleJudge}
                        onWrongHold={handleWrongHold}
                        onWaveStart={handleWaveStart}
                        attempt={attempt}
                    />
                    <AimPlane
                        enabled={phase === 'playing'}
                        onHoldChange={setHold}
                        position={[0, 2, -18]}
                        size={[80, 44]}
                    />
                </>
            }
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'I takt', value: `${hits} av ${TOTAL_ROUNDS}` },
                            { label: 'Bukk', value: `${rounds} av ${TOTAL_ROUNDS}` },
                        ]}
                    />
                    <SceneBadge corner="br">Kina, ca. 500 fvt</SceneBadge>
                    <DangerVignette level={uro.value} />
                    <ScreenFlash trigger={flash} preset="damage" durationMs={160} />
                </>
            }
        >
            <div className="space-y-3">
                <MeterBar
                    value={uro.value}
                    label="Uro i hallen"
                    hint="Uroen vokser både når du glemmer bukket og når du står bøyd hele tiden."
                    warnAt={0.5}
                    dangerAt={0.78}
                />

                {phase === 'intro' && (
                    <button
                        type="button"
                        onClick={start}
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white rounded-full px-6 py-3 text-sm font-semibold transition-colors"
                    >
                        Start seremonien
                    </button>
                )}

                {phase === 'playing' && (
                    <button
                        type="button"
                        onPointerDown={() => setHold(true)}
                        onPointerUp={() => setHold(false)}
                        onPointerLeave={() => setHold(false)}
                        onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') setHold(true);
                        }}
                        onKeyUp={() => setHold(false)}
                        className="w-full select-none bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white rounded-full px-6 py-4 text-base font-semibold transition-colors"
                    >
                        Hold inne for å bøye deg
                    </button>
                )}

                {phase === 'won' && (
                    <WinScreen title="Seremonien holdt" onReplay={reset}>
                        Du traff {hits} av {TOTAL_ROUNDS} bukk. Formene - li - var ikke pynt for
                        Konfucius. Å gjøre riktig ting til riktig tid var selve treningen i å høre
                        til et fellesskap, og derfor brøt både den som glemte bukket og den som
                        bøyde seg hele tiden like mye av rekka.
                    </WinScreen>
                )}

                {phase === 'lost' && (
                    <LoseScreen title="Seremonien brøt sammen" onRetry={reset}>
                        Uroen ble for stor. Du traff {hits} av {TOTAL_ROUNDS} bukk. I en konfusiansk
                        hall bar ritualet hele fellesskapet: én som falt ut av takten, dro med seg
                        alle de andre. Prøv igjen, og se etter når bukket når rekka foran deg.
                    </LoseScreen>
                )}

                <SceneFact>
                    Li betyr de faste formene: hvordan man hilser, står og bøyer seg. Konfucius
                    mente at små endringer i de daglige vanene former mennesket, og at en hersker
                    hadde plikt til å gi folket opplæring i dem.
                </SceneFact>
            </div>
        </MicroGameScaffold>
    );
}
