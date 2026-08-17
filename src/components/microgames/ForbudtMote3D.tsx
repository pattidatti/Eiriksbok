import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Mover,
    Person,
    useMeter,
    useGameClock,
    DangerVignette,
    TimerPill,
    MeterBar,
    LoseScreen,
    WinScreen,
    SceneBanner,
    DataReadout,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: eleven skal kjenne på kroppen at staten en gang eide
// troen din. Konventikkelplakaten av 1741 gjorde det straffbart å samle folk
// til et religiøst møte uten at presten var med. Her sitter eleven i stua og
// må dosere stemmen etter hvor lensmannen er på veien utenfor vinduet.
// Lyspæra: religionsfrihet er ikke en selvfølge - den ble kjempet fram.

// Veien ligger så nær vinduet, og vindusåpningen er så lav og bred, at hele
// lensmannens vandring er synlig gjennom åpningen fra kamerastolen. Uten det
// kan ikke eleven lese faren visuelt, og spillet blir gjetting.
const ROAD_X = 2.6;
const ROAD_Z = -6.2;
const CAM: [number, number, number] = [0, 1.25, 2.4];
const TIME_LIMIT = 40;
const WALK_SPEED = 1.15;

type GameState = 'idle' | 'playing' | 'caught' | 'over' | 'won';

// Stua: gulv, to sidevegger, gavlvegg med vindusåpning og et lavt tak.
// Vindusåpningen er hullet mellom fire veggflater - eleven ser veien gjennom
// den, og det er der lensmannen dukker opp.
function Stue({ lysstyrke }: { lysstyrke: number }) {
    return (
        <>
            {/* Gulv i stua */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.75]} receiveShadow>
                <planeGeometry args={[7.4, 6.5]} />
                <meshStandardMaterial color="#4a3a2a" roughness={1} />
            </mesh>

            {/* Sidevegger */}
            {[-3.7, 3.7].map((x) => (
                <mesh key={`vegg-${x}`} position={[x, 1.25, -1.75]}>
                    <boxGeometry args={[0.15, 2.5, 6.5]} />
                    <meshStandardMaterial color="#6b543c" roughness={0.95} />
                </mesh>
            ))}

            {/* Tak */}
            <mesh position={[0, 2.5, -1.75]}>
                <boxGeometry args={[7.4, 0.14, 6.5]} />
                <meshStandardMaterial color="#3d3024" roughness={1} />
            </mesh>

            {/* Gavlvegg med vindusåpning (x -2.2 til 2.2, y 0.75 til 2.0) */}
            <mesh position={[-2.95, 1.25, -5]}>
                <boxGeometry args={[1.5, 2.5, 0.16]} />
                <meshStandardMaterial color="#6b543c" roughness={0.95} />
            </mesh>
            <mesh position={[2.95, 1.25, -5]}>
                <boxGeometry args={[1.5, 2.5, 0.16]} />
                <meshStandardMaterial color="#6b543c" roughness={0.95} />
            </mesh>
            <mesh position={[0, 0.375, -5]}>
                <boxGeometry args={[4.4, 0.75, 0.16]} />
                <meshStandardMaterial color="#6b543c" roughness={0.95} />
            </mesh>
            <mesh position={[0, 2.25, -5]}>
                <boxGeometry args={[4.4, 0.5, 0.16]} />
                <meshStandardMaterial color="#6b543c" roughness={0.95} />
            </mesh>
            {/* Vinduskarm og midtpost */}
            <mesh position={[0, 0.78, -4.94]}>
                <boxGeometry args={[4.44, 0.07, 0.07]} />
                <meshStandardMaterial color="#8a6f4e" />
            </mesh>
            <mesh position={[0, 1.38, -4.94]}>
                <boxGeometry args={[0.07, 1.25, 0.07]} />
                <meshStandardMaterial color="#8a6f4e" />
            </mesh>

            {/* Langbordet */}
            <mesh position={[0, 0.72, -2.2]} castShadow receiveShadow>
                <boxGeometry args={[2.4, 0.1, 1.3]} />
                <meshStandardMaterial color="#7a5f3f" roughness={0.9} />
            </mesh>
            {[
                [-1.05, -1.7],
                [1.05, -1.7],
                [-1.05, -2.7],
                [1.05, -2.7],
            ].map(([x, z]) => (
                <mesh key={`bein-${x}-${z}`} position={[x, 0.34, z]}>
                    <boxGeometry args={[0.1, 0.68, 0.1]} />
                    <meshStandardMaterial color="#5e4830" />
                </mesh>
            ))}

            {/* Talglyset på bordet - eneste lyskilde inne */}
            <mesh position={[0, 0.87, -2.2]}>
                <cylinderGeometry args={[0.05, 0.06, 0.2, 8]} />
                <meshStandardMaterial color="#f2ead4" />
            </mesh>
            <mesh position={[0, 1.02, -2.2]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshStandardMaterial
                    color="#ffd88a"
                    emissive="#ffb347"
                    emissiveIntensity={2.4}
                />
            </mesh>
            <pointLight
                position={[0, 1.15, -2.2]}
                intensity={lysstyrke}
                distance={7}
                color="#ffcf8a"
            />

            {/* Veien utenfor - bredere enn 26 enheter, holdes utenfor scene-revisjonen */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.01, ROAD_Z]}
                userData={{ sceneAuditIgnore: true }}
            >
                <planeGeometry args={[34, 12]} />
                <meshStandardMaterial color="#232a33" roughness={1} />
            </mesh>
        </>
    );
}

// Forsamlingen: fem mennesker rundt bordet. Jo høyere eleven synger, jo mer
// løfter de seg - synlig, umiddelbar respons på stemme-doseringen.
function Forsamlingen({ styrke }: { styrke: number }) {
    const folk: {
        pos: [number, number, number];
        rot: number;
        body: string;
        hat: 'none' | 'hood' | 'cap';
    }[] = [
        { pos: [-1.5, 0, -1.5], rot: 0.5, body: '#4d5a46', hat: 'none' },
        { pos: [1.5, 0, -1.5], rot: -0.5, body: '#5b4436', hat: 'hood' },
        { pos: [-1.7, 0, -2.9], rot: 1.1, body: '#3f4a58', hat: 'none' },
        { pos: [1.7, 0, -2.9], rot: -1.1, body: '#63523a', hat: 'cap' },
        { pos: [0, 0, -3.5], rot: Math.PI, body: '#4a3f52', hat: 'hood' },
    ];
    return (
        <>
            {folk.map((f, i) => (
                <group key={`folk-${i}`} position={f.pos} rotation={[0, f.rot, 0]}>
                    <Person
                        pose={styrke > 0.6 ? 'raise' : 'sit'}
                        body={f.body}
                        legs="#2f2921"
                        hat={f.hat}
                        hatColor="#4a3d2e"
                        scale={0.95}
                    />
                </group>
            ))}
        </>
    );
}

interface SceneProps {
    gameState: GameState;
    attempt: number;
    holdingRef: React.MutableRefObject<boolean>;
    volumeRef: React.MutableRefObject<number>;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
    mistankeAdd: (amount: number) => void;
    mistankePeek: () => number;
    onProgress: (p: number) => void;
    onLensmann: (x: number) => void;
    onWin: () => void;
    remaining: number;
    syngerNaa: boolean;
    styrke: number;
}

function StueScene({
    gameState,
    attempt,
    holdingRef,
    volumeRef,
    onAim,
    onHoldChange,
    mistankeAdd,
    mistankePeek,
    onProgress,
    onLensmann,
    onWin,
    remaining,
    syngerNaa,
    styrke,
}: SceneProps) {
    // Hele scenen remountes per forsøk (key={attempt}), så refs nullstilles selv.
    void attempt;
    const progressRef = useRef(0);
    const lensmannXRef = useRef(-ROAD_X);
    const wonRef = useRef(false);
    const lysRef = useRef(1.9);
    const [leg, setLeg] = useState(0);
    const [lysstyrke, setLysstyrke] = useState(1.9);

    const mistankeAddRef = useRef(mistankeAdd);
    const mistankePeekRef = useRef(mistankePeek);
    const onProgressRef = useRef(onProgress);
    const onLensmannRef = useRef(onLensmann);
    const onWinRef = useRef(onWin);
    useEffect(() => {
        mistankeAddRef.current = mistankeAdd;
    }, [mistankeAdd]);
    useEffect(() => {
        mistankePeekRef.current = mistankePeek;
    }, [mistankePeek]);
    useEffect(() => {
        onProgressRef.current = onProgress;
    }, [onProgress]);
    useEffect(() => {
        onLensmannRef.current = onLensmann;
    }, [onLensmann]);
    useEffect(() => {
        onWinRef.current = onWin;
    }, [onWin]);

    const from: [number, number, number] =
        leg % 2 === 0 ? [-ROAD_X, 0, ROAD_Z] : [ROAD_X, 0, ROAD_Z];
    const to: [number, number, number] =
        leg % 2 === 0 ? [ROAD_X, 0, ROAD_Z] : [-ROAD_X, 0, ROAD_Z];

    // Lensmannen stopper og lytter når mistanken er høy - lesbar, rettferdig fare.
    const lytter = gameState === 'playing' && mistankePeek() > 0.62;

    useFrame((_state, dt) => {
        if (gameState !== 'playing') return;

        // Nærhet: 1 rett utenfor vinduet (x = 0), 0 ute i hver ende av veien.
        const naerhet = Math.max(0, 1 - Math.abs(lensmannXRef.current) / ROAD_X);
        const vol = holdingRef.current ? volumeRef.current : 0;

        if (holdingRef.current) {
            progressRef.current = Math.min(1, progressRef.current + dt * (0.01 + 0.14 * vol));
            // Kvadrert nærhet: faren er mild når lykta er et stykke unna og
            // brå først når den står rett utenfor vinduet. Det gjør spillet
            // lesbart - eleven straffes for dårlig timing, ikke for uflaks.
            mistankeAddRef.current(dt * naerhet * naerhet * (0.15 + 1.0 * vol));
        }

        // Lyset blafrer, og dempes når forsamlingen holder pusten
        const maal = 1.6 + vol * 0.9;
        lysRef.current += (maal - lysRef.current) * Math.min(1, dt * 3);
        if (Math.abs(lysRef.current - lysstyrke) > 0.06) setLysstyrke(lysRef.current);

        onProgressRef.current(progressRef.current);
        onLensmannRef.current(lensmannXRef.current);

        if (!wonRef.current && progressRef.current >= 1) {
            wonRef.current = true;
            onWinRef.current();
        }

        if (import.meta.env.DEV) {
            (window as unknown as Record<string, unknown>).__forbudtMoteDebug = {
                lensmannX: lensmannXRef.current,
                naerhet,
                progress: progressRef.current,
                mistanke: mistankePeekRef.current(),
                remaining,
                holding: holdingRef.current,
                vol: volumeRef.current,
            };
        }
    });

    return (
        <>
            {/* Blikket senkes litt, ellers fyller det mørke taket øverste tredel */}
            <PovCamera position={CAM} lookAt={[0, 0.95, -4]} sway={0.012} moving={false} />
            {/* Flata må være bredere enn 26 enheter, ellers teller scene-revisjonen
                den som en del av modellen og melder feil innramming. */}
            <AimPlane
                enabled={gameState === 'playing'}
                position={[0, 2, -20]}
                size={[80, 40]}
                onAim={onAim}
                onHoldChange={onHoldChange}
            />

            <Stue lysstyrke={lysstyrke} />
            <Forsamlingen styrke={syngerNaa ? styrke : 0} />

            {/* Lensmannen på veien utenfor, med lykt */}
            <Mover
                from={from}
                to={to}
                speed={WALK_SPEED}
                state={lytter ? 'frozen' : 'moving'}
                bob={0.05}
                phase={leg}
                onArrive={() => setLeg((l) => l + 1)}
                onMove={(x) => {
                    lensmannXRef.current = x;
                }}
            >
                <Person
                    pose={lytter ? 'idle' : 'walk'}
                    body="#2f3a2c"
                    legs="#232a20"
                    hat="cap"
                    hatColor="#2f3a2c"
                    scale={1.05}
                />
                {/* Lykta - elevens visuelle avstandsmåler */}
                <mesh position={[0.3, 0.95, 0]}>
                    <sphereGeometry args={[0.14, 10, 10]} />
                    <meshStandardMaterial
                        color="#ffe9a8"
                        emissive="#ffc45c"
                        emissiveIntensity={2.8}
                    />
                </mesh>
                <pointLight position={[0.3, 1.0, 0]} intensity={2.1} distance={7} color="#ffd28a" />
            </Mover>

            {/* Måne over veien - dekor, holdes utenfor scene-revisjonen */}
            <mesh position={[5, 7, -18]} userData={{ sceneAuditIgnore: true }}>
                <circleGeometry args={[0.9, 20]} />
                <meshStandardMaterial
                    color="#eef2ff"
                    emissive="#cdd8ff"
                    emissiveIntensity={1.1}
                    side={THREE.DoubleSide}
                    fog={false}
                />
            </mesh>
        </>
    );
}

const ForbudtMote3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [synger, setSynger] = useState(false);
    const [styrke, setStyrke] = useState(0.5);
    const [progress, setProgress] = useState(0);
    const [lensmannNaer, setLensmannNaer] = useState(0);

    const holdingRef = useRef(false);
    const volumeRef = useRef(0.5);
    const gameStateRef = useRef<GameState>('idle');
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const fail = useCallback(
        (kind: 'caught' | 'over') => {
            if (gameStateRef.current !== 'playing') return;
            sounds.play('incorrect');
            holdingRef.current = false;
            setSynger(false);
            setFails((f) => f + 1);
            setGameState(kind);
        },
        [sounds]
    );

    const mistanke = useMeter({
        drainPerSecond: 0.32,
        overloadAt: 1,
        recoverTo: 0.45,
        onOverload: () => fail('caught'),
    });
    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => fail('over'),
    });

    // Pekeren styrer stemmestyrken: høyt oppe = høy sang, lavt nede = hvisking.
    // Full styrke nås allerede ved øverste 15 prosent og stillhet ved nederste
    // 15 prosent, så eleven slipper å treffe helt ytterst i vinduet.
    const handleAim = useCallback((_xPct: number, yPct: number) => {
        const v = Math.min(1, Math.max(0, (85 - yPct) / 70));
        volumeRef.current = v;
        setStyrke(v);
    }, []);

    const handleHold = useCallback((holding: boolean) => {
        holdingRef.current = holding;
        setSynger(holding);
    }, []);

    const begin = useCallback(() => {
        holdingRef.current = false;
        volumeRef.current = 0.5;
        mistanke.reset();
        clock.restart();
        setSynger(false);
        setStyrke(0.5);
        setProgress(0);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        setBanner('Hold inne for å holde møtet. Dra pekeren opp for høy sang, ned for hvisking.');
        setTimeout(() => setBanner(null), 3600);
    }, [mistanke, clock, sounds]);

    const score = Math.max(0.4, 1 - fails * 0.15);

    const handleWin = useCallback(() => {
        sounds.play('complete');
        holdingRef.current = false;
        setSynger(false);
        setBanner(null);
        setGameState('won');
        onComplete({ score: Math.max(0.4, 1 - fails * 0.15), completed: true });
    }, [sounds, onComplete, fails]);

    const resetAll = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        mistanke.reset();
        holdingRef.current = false;
        setSynger(false);
        setProgress(0);
    }, [mistanke]);

    const naerBeskrivelse =
        lensmannNaer > 0.66 ? 'utenfor vinduet' : lensmannNaer > 0.33 ? 'på vei forbi' : 'langt unna';

    return (
        <MicroGameScaffold
            title="Møtet som var forbudt"
            subtitle="Norge, 1820. Å samle folk til bønn uten presten var straffbart - hold møtet uten at lensmannen hører dere"
            estimatedSeconds={160}
            onRetry={gameState !== 'idle' ? resetAll : undefined}
            canvas={{
                controls: false,
                camera: { position: CAM, fov: 62 },
                background: '#131a26',
                fog: { color: '#131a26', near: 9, far: 30 },
                sunPosition: [4, 8, 4] as [number, number, number],
                sunIntensity: 0.12,
                ambientIntensity: 0.5,
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#1b2434] to-[#0d121b]"
            overlays={
                <>
                    <DangerVignette level={gameState === 'playing' ? mistanke.value : 0} />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Natten varer"
                            warnBelow={12}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Møtet', value: Math.round(progress * 100), unit: '%' },
                                { label: 'Lensmannen', value: naerBeskrivelse },
                            ]}
                        />
                    )}
                    <SceneBanner message={banner} wide />
                    {gameState === 'idle' && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                            <div className="px-4 py-2 bg-black/50 text-white/75 rounded-xl text-xs text-center max-w-sm leading-relaxed">
                                En gård i Norge, 1820. Sju naboer har møttes i stua for å synge og
                                lese. Ute på veien går lensmannen med lykt.
                            </div>
                        </div>
                    )}
                </>
            }
            scene={
                <StueScene
                    key={attempt}
                    gameState={gameState}
                    attempt={attempt}
                    holdingRef={holdingRef}
                    volumeRef={volumeRef}
                    onAim={handleAim}
                    onHoldChange={handleHold}
                    mistankeAdd={mistanke.add}
                    mistankePeek={mistanke.peek}
                    onProgress={setProgress}
                    onLensmann={(x) => setLensmannNaer(Math.max(0, 1 - Math.abs(x) / ROAD_X))}
                    onWin={handleWin}
                    remaining={clock.remaining}
                    syngerNaa={synger}
                    styrke={styrke}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Hold inne museknappen for å holde møtet i gang. Dra pekeren oppover for å
                        synge høyt, og nedover for å hviske. Høy sang fyller møtet fort, men bærer
                        langt ut i natten. Se på vinduet: syng når lykta er langt unna.
                    </p>
                    <button
                        onClick={begin}
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow"
                    >
                        Tenn lyset - begynn møtet
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="space-y-2">
                    <MeterBar
                        value={mistanke.value}
                        label="Mistanke"
                        hint="Lensmannen hører etter. Hvisk eller ti stille når lykta er utenfor vinduet."
                        labels={{ normal: 'Uhørt', warn: 'Han stanser', danger: 'Han banker på!' }}
                    />
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 shrink-0">
                            Stemme
                        </span>
                        <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                            <div
                                className="h-full bg-amber-500 transition-[width] duration-150"
                                style={{ width: `${(synger ? styrke : 0) * 100}%` }}
                            />
                        </div>
                        <span className="text-[11px] text-slate-500 shrink-0 tabular-nums w-20 text-right">
                            {synger ? (styrke > 0.6 ? 'høy sang' : 'hvisking') : 'stille'}
                        </span>
                    </div>
                </div>
            )}

            {gameState === 'caught' && (
                <LoseScreen title="Lensmannen banket på" onRetry={begin}>
                    Konventikkelplakaten av 1741 forbød vanlige folk å samle andre til religiøse
                    møter uten at presten var med. Prøv igjen: syng høyt bare når lykta er langt
                    unna, og hvisk når den er utenfor vinduet.
                </LoseScreen>
            )}

            {gameState === 'over' && (
                <LoseScreen title="Natten tok slutt" onRetry={begin}>
                    Dere hvisket så forsiktig at møtet aldri ble ferdig. Tør du å bruke de
                    øyeblikkene der lykta er lengst borte, rekker dere gjennom.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={fails === 0 ? 'Møtet ble holdt - uten at noen hørte!' : 'Møtet ble holdt'}
                    onReplay={begin}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Slike møter var straffbare i over hundre år. Hans Nielsen Hauge satt fengslet
                    fra 1804 og ble i 1814 dømt for å ha brutt Konventikkelplakaten. Først i 1842
                    ble forbudet opphevet, og folk fikk lov til å samles om troen sin uten å be
                    presten om lov.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default ForbudtMote3D;
