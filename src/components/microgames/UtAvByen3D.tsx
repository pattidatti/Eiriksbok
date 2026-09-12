import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    AimPlane,
    Interactive,
    Person,
    Tree,
    Cart,
    Particles,
    useMeter,
    MeterBar,
    TimerPill,
    DataReadout,
    DangerVignette,
    LoseScreen,
    WinScreen,
    SceneBanner,
    useAmbience,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Pedagogisk kjerne: 17. april 1975 fikk hele Phnom Penh beskjed om å gå ut av
// byen. Folk fikk høre at det bare gjaldt i tre dager. Eleven kjenner på kroppen
// at løftet var en løgn: veien tar aldri slutt, kreftene blir borte, og det
// eneste som hjelper er å legge fra seg det gamle livet langs veien.

const LOOP = 60; // lengden på ett veistykke (verdenen går i løkke)
const MAAL = 200; // meter som må gås
const FART = 4.2; // meter i sekundet
const TID = 88; // sekunder til mørket
const HVILE = 0.16; // hvor fort utmattelsen synker når du hviler (per sekund)
const GRUNNSLIT = 0.022; // slit per sekund når kjerra er tom
const SLIT_PER_BYLT = 0.03; // ekstra slit per sekund for hver bylt du fortsatt drar på

// Både nedtellingen og utmattelsen drives av dt i useFrame, ikke av setInterval.
// Kitets useGameClock/useMeter teller per timer-tikk, og på en travel WebGL-side
// kommer de tikkene saktere enn sanntid - da gikk klokka for sakte og slitasjen
// ble tilfeldig. Med dt er begge uavhengige av bildefrekvensen.

type GameState = 'idle' | 'playing' | 'kollaps' | 'morke' | 'won';

interface Bylt {
    id: string;
    navn: string;
    tap: string;
    farge: string;
    hoyde: number;
    plass: [number, number, number];
}

const BYLTER: Bylt[] = [
    {
        id: 'ris',
        navn: 'Rissekken',
        tap: 'Du satte fra deg risen. Nå er du avhengig av maten regimet deler ut.',
        farge: '#d8bd84',
        hoyde: 0.3,
        plass: [-0.49, 0.9, 0],
    },
    {
        id: 'kjele',
        navn: 'Kokekaret',
        tap: 'Kokekaret ble stående i grøfta. Fra nå av spiser alle fra samme felleskjøkken.',
        farge: '#9aa0a6',
        hoyde: 0.34,
        plass: [-0.165, 0.92, 0],
    },
    {
        id: 'boker',
        navn: 'Bøkene og brillene',
        tap: 'Bøkene ble liggende. Det var like greit: utdanning var blitt farlig å vise fram.',
        farge: '#7e5b43',
        hoyde: 0.28,
        plass: [0.165, 0.89, 0],
    },
    {
        id: 'bilder',
        navn: 'Familiebildene',
        tap: 'Bildene ble borte i støvet. Papirer fra det gamle livet kunne uansett røpe hvem du hadde vært.',
        farge: '#b05a4e',
        hoyde: 0.32,
        plass: [0.49, 0.91, 0],
    },
];

// ── Veistykke: gjenbrukbart kulisse-segment som glir bakover forbi eleven ────
function Veistykke({ variant }: { variant: 0 | 1 }) {
    const trar: [number, number][] =
        variant === 0
            ? [
                  [-7.2, -4],
                  [7.4, -11],
                  [-8.1, -19],
                  [7.8, -26],
                  [-6.6, -34],
                  [7.1, -41],
                  [-7.5, -50],
                  [6.4, -57],
              ]
            : [
                  [7.6, -6],
                  [-7.1, -14],
                  [8.0, -22],
                  [-7.8, -30],
                  [6.9, -38],
                  [-6.8, -46],
                  [7.4, -54],
              ];

    const folk: [number, number, 'walk' | 'idle'][] =
        variant === 0
            ? [
                  [-2.4, -9, 'walk'],
                  [2.6, -15, 'walk'],
                  [-1.8, -24, 'walk'],
                  [2.2, -31, 'idle'],
                  [-2.8, -40, 'walk'],
                  [1.9, -48, 'walk'],
                  [-2.2, -55, 'walk'],
              ]
            : [
                  [2.5, -7, 'walk'],
                  [-2.1, -13, 'idle'],
                  [2.8, -21, 'walk'],
                  [-2.6, -28, 'walk'],
                  [2.0, -36, 'walk'],
                  [-1.9, -44, 'walk'],
                  [2.7, -52, 'walk'],
              ];

    const vakter: [number, number][] = variant === 0 ? [[-4.7, -13], [4.7, -36]] : [[4.6, -25], [-4.8, -49]];

    const etterlatt: [number, number][] =
        variant === 0
            ? [
                  [-3.9, -6],
                  [4.0, -21],
                  [-4.1, -29],
                  [3.7, -45],
                  [-3.8, -53],
              ]
            : [
                  [3.8, -10],
                  [-4.0, -18],
                  [4.1, -33],
                  [-3.7, -42],
                  [3.9, -56],
              ];

    return (
        <group>
            {/* Tørr slette langs veien */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -LOOP / 2]} receiveShadow>
                <planeGeometry args={[46, LOOP]} />
                <meshStandardMaterial color="#c2ab7b" roughness={1} />
            </mesh>
            {/* Selve veien - oppkjørt støv */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -LOOP / 2]} receiveShadow>
                <planeGeometry args={[9, LOOP]} />
                <meshStandardMaterial color="#8d7547" roughness={1} />
            </mesh>
            {/* Hjulspor - gir fartsfølelse når veien glir forbi */}
            {[-1.5, 1.5].map((x) => (
                <mesh
                    key={`spor-${x}`}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[x, 0.01, -LOOP / 2]}
                >
                    <planeGeometry args={[0.7, LOOP]} />
                    <meshStandardMaterial color="#7a6339" roughness={1} />
                </mesh>
            ))}

            {trar.map(([x, z], i) => (
                <Tree key={`t-${i}`} position={[x, 0, z]} leaf="#6f7a45" seed={i + variant * 7} />
            ))}

            {folk.map(([x, z, positur], i) => (
                <Person
                    key={`p-${i}`}
                    position={[x, 0, z]}
                    pose={positur}
                    body={i % 2 === 0 ? '#8d7f6a' : '#6f6455'}
                    legs="#4a4136"
                    scale={1.05}
                />
            ))}

            {vakter.map(([x, z], i) => (
                <Person
                    key={`v-${i}`}
                    position={[x, 0, z]}
                    pose="idle"
                    body="#23242a"
                    legs="#1a1b20"
                    hat="cap"
                    hatColor="#7a1f1f"
                    scale={1.05}
                />
            ))}

            {etterlatt.map(([x, z], i) => (
                <mesh key={`e-${i}`} position={[x, 0.14, z]} rotation={[0, i * 0.7, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.28, 0.4]} />
                    <meshStandardMaterial color={i % 2 === 0 ? '#8a7a5e' : '#9c6f5a'} roughness={0.95} />
                </mesh>
            ))}

            {/* Grøftekantstein tett på veien - sterk parallaks når du går */}
            {(variant === 0
                ? [-5.2, -12.5, -23.5, -31, -39.5, -47, -55.5]
                : [-3.5, -10.5, -19.5, -27.5, -35.5, -44.5, -52.5]
            ).map((z, i) => (
                <mesh
                    key={`s-${i}`}
                    position={[i % 2 === 0 ? -5.4 : 5.4, 0.11, z]}
                    rotation={[0, i * 0.9, 0]}
                    castShadow
                >
                    <boxGeometry args={[0.6, 0.22, 0.5]} />
                    <meshStandardMaterial color="#9d8a63" roughness={1} />
                </mesh>
            ))}

            <Cart position={variant === 0 ? [3.4, 0, -18] : [-3.5, 0, -40]} rotation={[0, 0.4, 0]} />
        </group>
    );
}

// ── Kjerrer eleven skyver selv: bylter som kan legges igjen ──────────────────
function Handkjerre({
    igjen,
    onDrop,
    aktiv,
}: {
    igjen: string[];
    onDrop: (b: Bylt) => void;
    aktiv: boolean;
}) {
    return (
        <group position={[0, 0, -3.4]} scale={1.1}>
            <Cart color="#6f4b2c" wheel="#6d4e2e" />
            {/* Skjefter tilbake mot eleven - kroppsfølelse av å skyve */}
            {[-0.5, 0.5].map((x) => (
                <mesh key={x} position={[x, 0.72, 0.32]} rotation={[Math.PI / 2 - 0.18, 0, 0]}>
                    <cylinderGeometry args={[0.035, 0.035, 1.05, 8]} />
                    <meshStandardMaterial color="#5d3f25" roughness={0.9} />
                </mesh>
            ))}

            {BYLTER.filter((b) => igjen.includes(b.id)).map((b) => (
                <group key={b.id} onPointerDown={(e) => e.stopPropagation()}>
                    <Interactive
                        position={b.plass}
                        onSelect={() => aktiv && onDrop(b)}
                        disabled={!aktiv}
                        hitArea={[0.31, 0.46, 0.52]}
                        sound="drop"
                    >
                        {(s) => (
                            <mesh castShadow>
                                <boxGeometry args={[0.29, b.hoyde, 0.46]} />
                                <meshStandardMaterial
                                    color={b.farge}
                                    roughness={0.9}
                                    emissive={s === 'hover' ? '#facc15' : '#000000'}
                                    emissiveIntensity={s === 'hover' ? 0.5 : 0}
                                />
                            </mesh>
                        )}
                    </Interactive>
                </group>
            ))}
        </group>
    );
}

interface SceneProps {
    gameState: GameState;
    walking: boolean;
    lastRef: React.MutableRefObject<number>;
    offsetRef: React.MutableRefObject<number>;
    movingRef: React.MutableRefObject<boolean>;
    igjen: string[];
    slitAdd: (amount: number) => void;
    onHold: (holding: boolean) => void;
    onDrop: (b: Bylt) => void;
    onFramme: () => void;
    onTikk: (tidIgjen: number, gaatt: number) => void;
    onMorke: () => void;
    drops: { id: number; x: number; z: number; farge: string }[];
}

function VeiScene({
    gameState,
    walking,
    lastRef,
    offsetRef,
    movingRef,
    igjen,
    slitAdd,
    onHold,
    onDrop,
    onFramme,
    onTikk,
    onMorke,
    drops,
}: SceneProps) {
    const world = useRef<THREE.Group>(null);
    const dropLag = useRef<THREE.Group>(null);
    const frammeRef = useRef(false);
    // Scenen remountes per forsøk (key={attempt}), så tid og flagg nullstilles selv.
    const tidRef = useRef(TID);
    const morkeRef = useRef(false);
    const speilRef = useRef(0);
    const slitRef = useRef(slitAdd);
    const frammeCb = useRef(onFramme);
    const tikkCb = useRef(onTikk);
    const morkeCb = useRef(onMorke);
    useEffect(() => {
        slitRef.current = slitAdd;
    }, [slitAdd]);
    useEffect(() => {
        frammeCb.current = onFramme;
    }, [onFramme]);
    useEffect(() => {
        tikkCb.current = onTikk;
    }, [onTikk]);
    useEffect(() => {
        morkeCb.current = onMorke;
    }, [onMorke]);

    useFrame((_, dt) => {
        if (gameState !== 'playing') return;

        // Mørket kommer uansett hva eleven gjør.
        tidRef.current = Math.max(0, tidRef.current - dt);
        if (tidRef.current <= 0 && !morkeRef.current) {
            morkeRef.current = true;
            morkeCb.current();
        }

        if (movingRef.current) {
            offsetRef.current += FART * dt;
            // Utmattelsen stiger raskere jo mer du fortsatt drar på.
            slitRef.current(dt * (GRUNNSLIT + SLIT_PER_BYLT * lastRef.current));
            if (!frammeRef.current && offsetRef.current >= MAAL) {
                frammeRef.current = true;
                frammeCb.current();
            }
        } else {
            // Hvile: kreftene kommer tilbake, men bare så lenge du står stille.
            slitRef.current(-dt * HVILE);
        }

        // Speil tid og avstand til DOM-en ~4 ganger i sekundet, ikke per frame.
        speilRef.current += dt;
        if (speilRef.current >= 0.25) {
            speilRef.current = 0;
            tikkCb.current(tidRef.current, offsetRef.current);
        }

        if (import.meta.env.DEV) {
            (window as unknown as Record<string, unknown>).__utAvByenDebug = {
                gaatt: Math.round(offsetRef.current),
                last: lastRef.current,
                gaar: movingRef.current,
            };
        }

        if (world.current) world.current.position.z = offsetRef.current % LOOP;
        if (dropLag.current) dropLag.current.position.z = offsetRef.current;
    });

    return (
        <>
            <PovCamera
                position={[0, 1.62, 0]}
                lookAhead={[0, -0.22, -7]}
                moving={gameState === 'playing' && walking}
                bob={0.05}
            />
            <AimPlane enabled={gameState === 'playing'} onHoldChange={onHold} />

            {/* Kulissen glir bakover forbi eleven - to stykker i løkke */}
            <group ref={world} userData={{ sceneAuditIgnore: true }}>
                <Veistykke variant={0} />
                <group position={[0, 0, -LOOP]}>
                    <Veistykke variant={1} />
                </group>
            </group>

            {/* Det eleven selv har lagt igjen, blir liggende langs veien */}
            <group ref={dropLag} userData={{ sceneAuditIgnore: true }}>
                {drops.map((d) => (
                    <mesh key={d.id} position={[d.x, 0.16, d.z]} rotation={[0, 0.5, 0]} castShadow>
                        <boxGeometry args={[0.46, 0.32, 0.38]} />
                        <meshStandardMaterial color={d.farge} roughness={0.95} />
                    </mesh>
                ))}
            </group>

            <Handkjerre igjen={igjen} onDrop={onDrop} aktiv={gameState === 'playing'} />

            <group userData={{ sceneAuditIgnore: true }}>
                <Particles preset="dust" />
            </group>
        </>
    );
}

// ---- Hovedelement ----

const UtAvByen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const vind = useAmbience('wind', -32);

    const [gameState, setGameState] = useState<GameState>('idle');
    const [attempt, setAttempt] = useState(0);
    const [fails, setFails] = useState(0);
    const [walking, setWalking] = useState(false);
    const [igjen, setIgjen] = useState<string[]>(BYLTER.map((b) => b.id));
    const [drops, setDrops] = useState<{ id: number; x: number; z: number; farge: string }[]>([]);
    const [banner, setBanner] = useState<string | null>(null);
    const [meterIgjen, setMeterIgjen] = useState(MAAL);
    const [tidIgjen, setTidIgjen] = useState(TID);

    const offsetRef = useRef(0);
    const movingRef = useRef(false);
    const lastRef = useRef(BYLTER.length);
    const stateRef = useRef<GameState>('idle');
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    const fail = useCallback(
        (kind: 'kollaps' | 'morke') => {
            if (stateRef.current !== 'playing') return;
            sounds.play('incorrect');
            movingRef.current = false;
            setWalking(false);
            setFails((f) => f + 1);
            setGameState(kind);
        },
        [sounds]
    );

    // drainPerSecond: 0 - hvilen håndteres dt-basert i scenen, ikke av timer-tikk.
    const slit = useMeter({
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0.45,
        onOverload: () => fail('kollaps'),
    });

    const handleHold = useCallback((holding: boolean) => {
        movingRef.current = holding;
        setWalking(holding);
    }, []);

    const handleDrop = useCallback(
        (b: Bylt) => {
            setIgjen((v) => {
                if (!v.includes(b.id)) return v;
                const neste = v.filter((id) => id !== b.id);
                lastRef.current = neste.length;
                return neste;
            });
            setDrops((d) =>
                [
                    ...d,
                    {
                        id: Date.now(),
                        x: d.length % 2 === 0 ? -3.2 : 3.2,
                        z: -offsetRef.current - 3,
                        farge: b.farge,
                    },
                ].slice(-4)
            );
            setBanner(b.tap);
            setTimeout(() => setBanner(null), 3400);
        },
        []
    );

    // Scenen speiler tid og avstand hit ~4 ganger i sekundet.
    const handleTikk = useCallback((tidIgjen: number, gaatt: number) => {
        setTidIgjen(tidIgjen);
        setMeterIgjen(Math.max(0, Math.round(MAAL - gaatt)));
    }, []);

    const handleMorke = useCallback(() => fail('morke'), [fail]);

    const start = useCallback(() => {
        offsetRef.current = 0;
        movingRef.current = false;
        lastRef.current = BYLTER.length;
        slit.reset();
        setTidIgjen(TID);
        setIgjen(BYLTER.map((b) => b.id));
        setDrops([]);
        setWalking(false);
        setMeterIgjen(MAAL);
        setAttempt((a) => a + 1);
        setGameState('playing');
        sounds.play('sceneChange');
        vind.start();
        setBanner('Hold inne for å gå. Slipp for å hvile. Klikk en bylt for å legge den igjen.');
        setTimeout(() => setBanner(null), 4200);
    }, [slit, sounds, vind]);

    const score = Math.max(0.4, 1 - fails * 0.15);

    const handleFramme = useCallback(() => {
        sounds.play('complete');
        movingRef.current = false;
        setWalking(false);
        setBanner(null);
        setGameState('won');
        onComplete({ score: Math.max(0.4, 1 - fails * 0.15), completed: true });
    }, [sounds, onComplete, fails]);

    const nullstill = useCallback(() => {
        setGameState('idle');
        setBanner(null);
        slit.reset();
        movingRef.current = false;
        setWalking(false);
        vind.stop();
    }, [slit, vind]);

    return (
        <MicroGameScaffold
            title="Ut av byen"
            subtitle="17. april 1975: hele Phnom Penh må gå. Doser kreftene - og bestem hva du klarer å bære videre."
            estimatedSeconds={150}
            onRetry={gameState !== 'idle' ? nullstill : undefined}
            canvas={{
                controls: false,
                camera: { position: [0, 1.62, 0] as [number, number, number], fov: 62 },
                background: '#d8c79c',
                fog: { color: '#d8c79c', near: 14, far: 54 },
                sunPosition: [8, 12, -6] as [number, number, number],
                sunIntensity: 1.15,
                ambientIntensity: 0.75,
                contactShadows: false,
            }}
            containerClassName="bg-gradient-to-b from-[#e3d3a8] to-[#c9b184]"
            overlays={
                <>
                    <DangerVignette level={gameState === 'playing' ? slit.value : 0} />
                    {gameState === 'playing' && (
                        <TimerPill
                            seconds={tidIgjen}
                            label="Til mørket"
                            warnBelow={18}
                            corner="br"
                        />
                    )}
                    {gameState === 'playing' && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Igjen å gå', value: meterIgjen, unit: 'm' },
                                { label: 'Bærer', value: igjen.length, unit: 'bylter' },
                            ]}
                        />
                    )}
                    <SceneBanner message={banner} wide />
                </>
            }
            scene={
                <VeiScene
                    key={attempt}
                    gameState={gameState}
                    walking={walking}
                    lastRef={lastRef}
                    offsetRef={offsetRef}
                    movingRef={movingRef}
                    igjen={igjen}
                    slitAdd={slit.add}
                    onHold={handleHold}
                    onDrop={handleDrop}
                    onFramme={handleFramme}
                    onTikk={handleTikk}
                    onMorke={handleMorke}
                    drops={drops}
                />
            }
        >
            {gameState === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Soldatene sier at alle må ut av byen, men bare i tre dager. Du skyver
                        kjerra med alt du eier. Hold inne museknappen for å gå, slipp for å hvile -
                        og klikk på en bylt hvis du må legge den igjen for å orke resten av veien.
                    </p>
                    <button
                        onClick={start}
                        className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-800 transition shadow"
                    >
                        Begynn å gå
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <MeterBar
                    value={slit.value}
                    label="Utmattelse"
                    hint="Jo mer du bærer, jo fortere blir du sliten. Hvil - men husk at mørket kommer."
                    labels={{ normal: 'Du orker', warn: 'Tungt', danger: 'Du klarer ikke mer' }}
                />
            )}

            {gameState === 'kollaps' && (
                <LoseScreen title="Du klarte ikke mer" onRetry={start}>
                    Mange greide ikke marsjen. Syke og gamle ble drevet ut av byen sammen med alle
                    andre. Prøv igjen: hvil oftere, og legg fra deg noe av lasten.
                </LoseScreen>
            )}

            {gameState === 'morke' && (
                <LoseScreen title="Mørket kom før du var framme" onRetry={start}>
                    Det ble aldri sagt hvor langt folk skulle gå. Prøv igjen: du kommer fortere
                    fram med lettere kjerre enn med lange pauser.
                </LoseScreen>
            )}

            {gameState === 'won' && (
                <WinScreen
                    title={
                        igjen.length === 0
                            ? 'Du kom fram - men uten noe av det du eide'
                            : 'Du kom fram til landsbygda'
                    }
                    onReplay={start}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Rundt to millioner mennesker ble jaget ut av Phnom Penh 17. april 1975. De fikk
                    høre at det gjaldt i tre dager. De fleste kom aldri tilbake til byen, og det de
                    la igjen langs veien, fikk de aldri se igjen.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default UtAvByen3D;
