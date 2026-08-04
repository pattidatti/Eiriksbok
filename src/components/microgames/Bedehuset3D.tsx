import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Languages, Mountain, Church } from 'lucide-react';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Person,
    GlowMaterial,
    GlowHalo,
    Fire,
    damp,
    useGameClock,
    useMeter,
    useCrosshair,
    Crosshair,
    DangerVignette,
    TimerPill,
    MeterBar,
    DataReadout,
    SceneBanner,
    DragHint,
    LoseScreen,
    WinScreen,
    ChoiceRow,
    type ChoiceItem,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: et budskap når bare fram på et språk folk forstår.
// Eleven er predikant i et læstadiansk bedehus rundt 1900. Skolen og kirken
// bruker bare norsk, men her inne er samisk og kvensk lov. Eleven må veksle
// mellom de tre språka og se hvem som faktisk henger med - og det er nettopp
// derfor bedehuset ble et fristed for språka under fornorskinga.

type Lang = 'samisk' | 'kvensk' | 'norsk';
type GameState = 'idle' | 'playing' | 'uro' | 'slutt' | 'won';

const TIME_LIMIT = 80;
const START_LEVEL = 0.45;
const WIN_LEVEL = 0.8;
const DECAY = 0.03; // per sekund
const GAIN_MATCH = 0.06; // riktig språk, uten at du ser på dem
const GAIN_FOCUS = 0.12; // ekstra når du holder inne og ser rett på benken
const GAIN_OFF = 0.006; // feil språk: nesten ingenting når fram
const SVIKT_LEVEL = 0.18; // under dette begynner benken å bli urolig

const BENKER: { id: Lang; x: number; label: string; kappe: string; lue: string }[] = [
    { id: 'samisk', x: -3.15, label: 'Samisk', kappe: '#1e5fa8', lue: '#c02b2b' },
    { id: 'kvensk', x: 0, label: 'Kvensk', kappe: '#3f7d5a', lue: '#2f5c43' },
    { id: 'norsk', x: 3.15, label: 'Norsk', kappe: '#5b4636', lue: '#3a2e24' },
];

// --- Rommet: gulv, vegger, vinduer og ovn ---

function Rommet() {
    // Romskallet er bakgrunnsdekor: kameraet står INNE i det, så boksen rundt
    // gulv/vegger/tak vil alltid stikke utenfor utsnittet. Holdes utenfor
    // scene-revisjonens innrammingsmål; benker, folk og talerstol måles fortsatt.
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {/* Gulvbord */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} receiveShadow>
                <planeGeometry args={[12, 14]} />
                <meshStandardMaterial color="#9c7248" roughness={1} />
            </mesh>
            {/* Bakvegg bak benkene */}
            <mesh position={[0, 1.85, -8.6]} receiveShadow>
                <boxGeometry args={[12, 3.7, 0.3]} />
                <meshStandardMaterial color="#e6d7bd" roughness={0.95} />
            </mesh>
            {/* Sidevegger */}
            <mesh position={[-5.9, 1.85, -3]} receiveShadow>
                <boxGeometry args={[0.3, 3.7, 11.4]} />
                <meshStandardMaterial color="#e6d7bd" roughness={0.95} />
            </mesh>
            <mesh position={[5.9, 1.85, -3]} receiveShadow>
                <boxGeometry args={[0.3, 3.7, 11.4]} />
                <meshStandardMaterial color="#e6d7bd" roughness={0.95} />
            </mesh>
            {/* Tak i ubehandlet furu */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.7, -3]}>
                <planeGeometry args={[12, 11.4]} />
                <meshStandardMaterial color="#c9a877" roughness={1} />
            </mesh>
            {/* Vinduer med vinterlys */}
            {[-6.4, -3.4, -0.4].map((z) => (
                <group key={z}>
                    <mesh position={[-5.72, 2.1, z]}>
                        <boxGeometry args={[0.12, 1.4, 1]} />
                        <GlowMaterial color="#eaf3ff" intensity={0.9} />
                    </mesh>
                    <mesh position={[5.72, 2.1, z]}>
                        <boxGeometry args={[0.12, 1.4, 1]} />
                        <GlowMaterial color="#eaf3ff" intensity={0.9} />
                    </mesh>
                </group>
            ))}
            {/* Vedovn i hjørnet */}
            <group position={[4.9, 0, -7.7]}>
                <mesh position={[0, 0.55, 0]} castShadow>
                    <cylinderGeometry args={[0.42, 0.48, 1.1, 12]} />
                    <meshStandardMaterial color="#3a3a3c" roughness={0.7} metalness={0.3} />
                </mesh>
                <mesh position={[0, 1.95, 0]}>
                    <cylinderGeometry args={[0.11, 0.11, 1.7, 8]} />
                    <meshStandardMaterial color="#3a3a3c" roughness={0.7} metalness={0.3} />
                </mesh>
                <Fire position={[0, 0.75, 0.3]} scale={0.32} />
            </group>
        </group>
    );
}

// --- En benkerad med folk og en lampe som lyser når de forstår ---

function Benkerad({
    x,
    kappe,
    lue,
    levelsRef,
    fokusRef,
    index,
}: {
    x: number;
    kappe: string;
    lue: string;
    levelsRef: React.MutableRefObject<number[]>;
    fokusRef: React.MutableRefObject<number>;
    index: number;
}) {
    const lampe = useRef<THREE.Mesh>(null);
    const halo = useRef<THREE.Group>(null);
    const folk = useRef<THREE.Group>(null);
    const glod = useRef(START_LEVEL);
    const fokus = useRef(0);

    useFrame((state, dt) => {
        const t = state.clock.getElapsedTime();
        glod.current = damp(glod.current, levelsRef.current[index], dt, 3.2);
        fokus.current = damp(fokus.current, fokusRef.current === index ? 1 : 0, dt, 5);

        if (lampe.current) {
            const m = lampe.current.material as THREE.MeshStandardMaterial;
            m.emissiveIntensity = 0.25 + glod.current * 2.6;
        }
        if (halo.current) {
            halo.current.scale.setScalar(0.55 + glod.current * 0.75 + fokus.current * 0.16);
        }
        if (folk.current) {
            // Folk som ikke henger med, lener seg urolig. De som forstår, sitter rakt.
            const rastlos = 1 - glod.current;
            folk.current.rotation.z = Math.sin(t * 2.1 + index) * 0.05 * rastlos;
            folk.current.position.y = Math.sin(t * 1.4 + index * 2) * 0.015 * rastlos;
        }
    });

    // Fire personer per benk, spredt litt ulikt men fast per benk.
    const plasser = useMemo(() => {
        const base = [-1, -0.35, 0.35, 1];
        return base.map((dx, i) => ({
            dx,
            dz: i % 2 === 0 ? 0 : -1.25,
            skala: 0.95 + ((i * 7 + index * 3) % 4) * 0.045,
        }));
    }, [index]);

    return (
        <group position={[x, 0, -4.9]}>
            {/* Benkene */}
            <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
                <boxGeometry args={[3, 0.14, 0.5]} />
                <meshStandardMaterial color="#7d5a38" roughness={0.95} />
            </mesh>
            <mesh position={[0, 0.42, -1.25]} castShadow receiveShadow>
                <boxGeometry args={[3, 0.14, 0.5]} />
                <meshStandardMaterial color="#7d5a38" roughness={0.95} />
            </mesh>
            {/* Benkebein */}
            {[-1.3, 1.3].map((bx) =>
                [0, -1.25].map((bz) => (
                    <mesh key={`${bx}-${bz}`} position={[bx, 0.18, bz]} castShadow>
                        <boxGeometry args={[0.12, 0.35, 0.4]} />
                        <meshStandardMaterial color="#6a4c30" roughness={0.95} />
                    </mesh>
                ))
            )}
            {/* Folk på benken - vendt mot talerstolen */}
            <group ref={folk}>
                {plasser.map((p, i) => (
                    <Person
                        key={i}
                        position={[p.dx, 0.49, p.dz]}
                        rotation={[0, Math.PI, 0]}
                        scale={p.skala}
                        pose="sit"
                        body={kappe}
                        legs="#4a3f33"
                        skin={i % 2 === 0 ? '#e0b98c' : '#cf9f74'}
                        hat={i % 2 === 0 ? 'cap' : 'hood'}
                        hatColor={lue}
                    />
                ))}
            </group>
            {/* Parafinlampe over benken - lyser når folk forstår */}
            <group position={[0, 2.45, -0.6]}>
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 1, 6]} />
                    <meshStandardMaterial color="#4a4a4a" />
                </mesh>
                <mesh position={[0, 0.16, 0]}>
                    <coneGeometry args={[0.32, 0.24, 12]} />
                    <meshStandardMaterial color="#8c6b3f" roughness={0.8} metalness={0.2} />
                </mesh>
                <mesh ref={lampe}>
                    <sphereGeometry args={[0.15, 12, 12]} />
                    <meshStandardMaterial
                        color="#ffd07a"
                        emissive="#ffb84d"
                        emissiveIntensity={0.4}
                        toneMapped={false}
                    />
                </mesh>
                <group ref={halo}>
                    <GlowHalo color="#ffc670" size={1.1} opacity={0.32} />
                </group>
            </group>
        </group>
    );
}

// --- Scenen ---

const BedehusScene = React.memo(function BedehusScene({
    playing,
    levelsRef,
    fokusRef,
    onAim,
    onHoldChange,
}: {
    playing: boolean;
    levelsRef: React.MutableRefObject<number[]>;
    fokusRef: React.MutableRefObject<number>;
    onAim: (x: number, y: number) => void;
    onHoldChange: (holding: boolean) => void;
}) {
    return (
        <>
            <PovCamera position={[0, 1.74, 3.3]} lookAt={[0, 1.05, -5.4]} sway={0.016} />
            <AimPlane
                enabled={playing}
                position={[0, 1.5, -5.4]}
                size={[30, 18]}
                onAim={onAim}
                onHoldChange={onHoldChange}
                hideCursor
            />
            <Rommet />
            {/* Talerstolen foran eleven */}
            <mesh position={[0, 0.56, 1]} castShadow>
                <boxGeometry args={[0.9, 1.12, 0.44]} />
                <meshStandardMaterial color="#6f4f2f" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.16, 0.96]} rotation={[-0.35, 0, 0]} castShadow>
                <boxGeometry args={[0.78, 0.06, 0.44]} />
                <meshStandardMaterial color="#5d4126" roughness={0.9} />
            </mesh>
            {/* Salmeboka på pulten */}
            <mesh position={[0, 1.23, 0.94]} rotation={[-0.35, 0, 0]} castShadow>
                <boxGeometry args={[0.26, 0.05, 0.19]} />
                <meshStandardMaterial color="#3d2a1c" roughness={0.85} />
            </mesh>
            {BENKER.map((b, i) => (
                <Benkerad
                    key={b.id}
                    x={b.x}
                    kappe={b.kappe}
                    lue={b.lue}
                    levelsRef={levelsRef}
                    fokusRef={fokusRef}
                    index={i}
                />
            ))}
        </>
    );
});

// --- Hovedelement ---

const Bedehuset3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [tap, setTap] = useState(0);
    const tapRef = useRef(0);
    const [lang, setLang] = useState<Lang>('norsk');
    const [banner, setBanner] = useState<string | null>(null);
    const [levels, setLevels] = useState<number[]>([START_LEVEL, START_LEVEL, START_LEVEL]);
    const [taler, setTaler] = useState(false);

    const levelsRef = useRef<number[]>([START_LEVEL, START_LEVEL, START_LEVEL]);
    const fokusRef = useRef(-1);
    const holdRef = useRef(false);
    const langRef = useRef<Lang>('norsk');
    const stateRef = useRef<GameState>('idle');
    const onCompleteRef = useRef(onComplete);
    const play = sounds.play;

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        langRef.current = lang;
    }, [lang]);
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    const avslutt = useCallback(
        (kind: 'uro' | 'slutt') => {
            if (stateRef.current !== 'playing') return;
            play('incorrect');
            holdRef.current = false;
            setTaler(false);
            tapRef.current += 1;
            setTap(tapRef.current);
            setGameState(kind);
        },
        [play]
    );

    const uro = useMeter({
        drainPerSecond: 0.22,
        overloadAt: 1,
        recoverTo: 0.3,
        onOverload: () => avslutt('uro'),
    });
    const clock = useGameClock({
        seconds: TIME_LIMIT,
        running: gameState === 'playing',
        onExpire: () => avslutt('slutt'),
    });

    // uro-objektet fra useMeter er nytt ved hver render, mens uro.add er stabil.
    // Bruker vi hele objektet som effekt-avhengighet, rives simuleringssløyfa ned
    // og settes opp igjen ti ganger i sekundet (klokka re-rendrer like ofte).
    const uroAdd = uro.add;
    const uroPeek = uro.peek;
    const tikkRef = useRef(0);

    const aim = useCrosshair();
    const handleAim = useCallback(
        (xPct: number, yPct: number) => {
            aim.move(xPct, yPct);
            fokusRef.current = xPct < 38 ? 0 : xPct < 62 ? 1 : 2;
        },
        [aim]
    );
    const handleHold = useCallback((holding: boolean) => {
        holdRef.current = holding;
        setTaler(holding);
    }, []);

    // Simuleringssløyfe på 10 Hz. Skriver refs (scenen leser dem i useFrame) og
    // speiler til state for målerne - aldri setState per frame.
    useEffect(() => {
        if (gameState !== 'playing') return;
        // Regn med FAKTISK forløpt tid, ikke en antatt 0,1 s per tikk. På en
        // travel Chromebook kan setInterval henge etter, og da ville spillet gått
        // i sakte film hvis vi stolte blindt på intervallet.
        let forrige = performance.now();
        const t = setInterval(() => {
            const now = performance.now();
            const dt = Math.min(1, (now - forrige) / 1000);
            forrige = now;
            let tapt = 0;
            for (let i = 0; i < 3; i++) {
                const treff = BENKER[i].id === langRef.current;
                const fokusert = holdRef.current && fokusRef.current === i;
                let gain = treff ? GAIN_MATCH : GAIN_OFF;
                if (treff && fokusert) gain += GAIN_FOCUS;
                const gjeldende = levelsRef.current[i];
                const neste = Math.min(1, Math.max(0, gjeldende + (gain - DECAY) * dt));
                levelsRef.current[i] = neste;
                if (neste < SVIKT_LEVEL) tapt++;
            }
            if (tapt > 0) uroAdd(tapt * 0.14 * dt);
            // Målerne i DOM-en trenger ikke 10 oppdateringer i sekundet. Telleren
            // ligger i en ref så den overlever om effekten settes opp på nytt.
            tikkRef.current += 1;
            if (tikkRef.current % 3 === 0) setLevels([...levelsRef.current]);
            if (import.meta.env.DEV) {
                (window as unknown as Record<string, unknown>).__bedehusDebug = {
                    levels: [...levelsRef.current],
                    uro: uroPeek(),
                    lang: langRef.current,
                    fokus: fokusRef.current,
                    holder: holdRef.current,
                };
            }
            if (levelsRef.current.every((v) => v >= WIN_LEVEL)) {
                play('complete');
                setBanner(null);
                setGameState('won');
                onCompleteRef.current({
                    score: Math.max(0.4, 1 - tapRef.current * 0.15),
                    completed: true,
                });
            }
        }, 100);
        return () => clearInterval(t);
    }, [gameState, uroAdd, uroPeek, play]);

    const score = Math.max(0.4, 1 - tap * 0.15);

    const fullfor = useCallback((s: number) => {
        onCompleteRef.current({ score: s, completed: true });
    }, []);

    const start = useCallback(() => {
        levelsRef.current = [START_LEVEL, START_LEVEL, START_LEVEL];
        fokusRef.current = -1;
        holdRef.current = false;
        uro.reset();
        clock.restart();
        setLevels([START_LEVEL, START_LEVEL, START_LEVEL]);
        setLang('norsk');
        setTaler(false);
        setAttempt((a) => a + 1);
        setGameState('playing');
        play('sceneChange');
        setBanner('Hold inne og sikt på en benk for å tale rett til dem. Bytt språk under vinduet.');
        setTimeout(() => setBanner(null), 4200);
    }, [uro, clock, play]);

    const nullstill = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        holdRef.current = false;
        setTaler(false);
        uro.reset();
    }, [uro]);

    const velgSprak = useCallback(
        (id: string) => {
            if (gameState !== 'playing') return;
            setLang(id as Lang);
            play('advance');
        },
        [gameState, play]
    );

    const kort: ChoiceItem[] = [
        {
            id: 'samisk',
            title: 'Samisk',
            blurb: 'Benken til venstre',
            icon: Mountain,
            status: lang === 'samisk' ? 'active' : 'available',
        },
        {
            id: 'kvensk',
            title: 'Kvensk (finsk)',
            blurb: 'Benken i midten',
            icon: Languages,
            status: lang === 'kvensk' ? 'active' : 'available',
        },
        {
            id: 'norsk',
            title: 'Norsk',
            blurb: 'Benken til høyre',
            icon: Church,
            status: lang === 'norsk' ? 'active' : 'available',
        },
    ];

    const pst = (v: number) => `${Math.round(v * 100)}%`;

    return (
        <MicroGameScaffold
            title="Møtet i bedehuset"
            subtitle="Nord-Troms rundt 1900. Få ordet fram til alle tre benkene - på språket de faktisk forstår."
            estimatedSeconds={170}
            onRetry={gameState !== 'idle' ? nullstill : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 1.74, 3.3] as [number, number, number], fov: 68 },
                background: '#dbe6ef',
                fog: { color: '#dbe6ef', near: 16, far: 42 },
                light: 'arctic',
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#dbe6ef] to-[#cbb894]"
            overlays={
                <>
                    <Crosshair show={gameState === 'playing'} crosshairRef={aim.ref} variant="dot" />
                    <DangerVignette level={gameState === 'playing' ? uro.value : 0} />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={clock.remaining}
                            label="Møtet varer"
                            warnBelow={15}
                            corner="br"
                        />
                    )}
                    {gameState !== 'idle' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Samisk', value: pst(levels[0]) },
                                { label: 'Kvensk', value: pst(levels[1]) },
                                { label: 'Norsk', value: pst(levels[2]) },
                            ]}
                        />
                    )}
                    <DragHint show={gameState === 'idle'} corner="bc">
                        Hold inne og sikt på en benk
                    </DragHint>
                    <SceneBanner message={banner} wide />
                </>
            }
            scene={
                <BedehusScene
                    key={attempt}
                    playing={gameState === 'playing'}
                    levelsRef={levelsRef}
                    fokusRef={fokusRef}
                    onAim={handleAim}
                    onHoldChange={handleHold}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed max-w-xl mx-auto">
                        Du står på talerstolen. På benkene sitter samisktalende, kvensktalende og
                        norsktalende. Hold inne museknappen og sikt på en benk for å tale rett til
                        dem, og bytt språk med kortene under vinduet. Få alle tre over 80 prosent
                        før møtet er slutt.
                    </p>
                    <button
                        onClick={start}
                        className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-800 transition shadow"
                    >
                        Begynn møtet
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="space-y-3">
                    <ChoiceRow items={kort} onSelect={velgSprak} />
                    <MeterBar
                        value={uro.value}
                        label="Uro i salen"
                        hint={
                            taler
                                ? 'Du taler nå. De som ikke forstår språket, faller fra.'
                                : 'Hold inne museknappen for å tale rett til benken du sikter på.'
                        }
                        labels={{ normal: 'Rolig', warn: 'Folk mumler', danger: 'De går!' }}
                    />
                </div>
            )}

            {gameState === 'uro' && (
                <LoseScreen title="Salen gikk i oppløsning" onRetry={start}>
                    To av benkene satt for lenge uten å forstå et ord, og folk gikk hjem. Prøv
                    igjen: veksle mellom språka så ingen benk blir glemt for lenge.
                </LoseScreen>
            )}

            {gameState === 'slutt' && (
                <LoseScreen title="Møtet tok slutt før alle var med" onRetry={start}>
                    Du rakk ikke fram til alle tre. Det var nettopp derfor læstadianske predikanter
                    vekslet mellom språk og lot andre tolke underveis.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={
                        tap === 0
                            ? 'Alle tre benkene hang med - på første forsøk!'
                            : 'Alle tre benkene hang med!'
                    }
                    onReplay={start}
                    onNext={() => fullfor(score)}
                >
                    Utenfor bedehuset var norsk det eneste språket skolen godtok. Her inne ble det
                    forkynt på samisk og kvensk, og det som ble sagt på norsk, ble tolket. Derfor
                    ble bedehuset et av få steder der disse språka fikk leve videre.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default Bedehuset3D;
