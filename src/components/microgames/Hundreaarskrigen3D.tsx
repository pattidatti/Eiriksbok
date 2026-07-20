import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    Hotspot,
    WaterPlane,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    StepTracker,
    DataReadout,
    damp,
    Burst,
    useShake,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Hundreaarskrigen". Et stilisert kart over Frankrike
// sett ovenfra. Krigen mellom England og Frankrike svingte fram og tilbake i over
// hundre år. Eleven spiller arven: først klikker hen tre store engelske seire
// (Crecy 1346, Poitiers 1356, Azincourt 1415) som farger landet rødt og presser
// fronten sørover, helt til byen Orleans ligger beleiret. Så kommer vendepunktet:
// eleven klikker Jeanne d'Arc, som løfter beleiringen av Orleans i 1429. Da snur
// krigen, det franske blå skyller tilbake over kartet, og Frankrike vinner i 1453.
//
// Lyspæra (rett fra artikkelen): Hundreaarskrigen var ikke ett slag, men en serie
// kriger som svingte fram og tilbake i over hundre år. England vant slag etter
// slag, helt til en ung bondejente, Jeanne d'Arc, snudde krigen ved Orleans og ga
// franskmennene troen tilbake.

interface Place {
    id: string;
    name: string;
    x: number;
    z: number;
}

// Engelske seier-noder i historisk rekkefolge (fase 1).
const BATTLES: Place[] = [
    { id: 'crecy', name: 'Crécy 1346', x: 0.6, z: -3.4 },
    { id: 'poitiers', name: 'Poitiers 1356', x: -1.9, z: 0.6 },
    { id: 'azincourt', name: 'Azincourt 1415', x: 1.4, z: -4.3 },
];
// Orleans er vendepunkt-noden (tas til slutt, med Jeanne d'Arc).
const ORLEANS: Place = { id: 'orleans', name: 'Orléans 1429', x: 0.2, z: -0.6 };
// Paris ligger midt i landet som et fast holdepunkt på kartet.
const PARIS: Place = { id: 'paris', name: 'Paris', x: 1.1, z: -1.7 };

const TOTAL_STEPS = BATTLES.length + 1; // tre engelske seire + vendepunktet

const FACTS = [
    'Crécy 1346: de engelske langbueskytterne meide ned den franske ridderhæren. Et sjokk for hele Europa.',
    'Poitiers 1356: engelskmennene tok til og med den franske kongen til fange. Frankrike var i kne.',
    'Azincourt 1415: en liten, sliten engelsk hær slo en mye større fransk. Nå lå Frankrike helt nede.',
];

const PROMPTS = [
    'Klikk Crécy (1346), det første store engelske slaget.',
    'Klikk Poitiers (1356) og følg de engelske seirene.',
    'Klikk Azincourt (1415), den verste dagen for Frankrike.',
];

const Hundreaarskrigen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [enWon, setEnWon] = useState(0); // engelske seire klikket (0..3)
    const [jeanne, setJeanne] = useState(false); // Jeanne løftet Orleans
    const [banner, setBanner] = useState<string | null>(
        'England og Frankrike kriget i over hundre år. Klikk de tre store engelske seirene og se landet bli rødt.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([0, 0.7, 0]);
    const [burstColor, setBurstColor] = useState('#d9483b');

    const phase1Done = enWon >= BATTLES.length;
    const done = jeanne;
    const activeBattle = phase1Done ? null : BATTLES[enWon];

    const winBattle = (id: string) => {
        if (!activeBattle || id !== activeBattle.id) return;
        setBurstPos([activeBattle.x, 0.7, activeBattle.z]);
        setBurstColor('#d9483b');
        setBurst((b) => b + 1);
        const next = enWon + 1;
        setFact(FACTS[enWon]);
        setEnWon(next);
        sounds.play('advance');
        if (next >= BATTLES.length) {
            setBanner(
                'England hadde vunnet alt. Bare Orleans holdt stand, beleiret. Klikk Jeanne d’Arc for å snu krigen.'
            );
        } else {
            setBanner(PROMPTS[next]);
        }
    };

    const liftSiege = () => {
        if (!phase1Done || jeanne) return;
        setBurstPos([ORLEANS.x, 0.8, ORLEANS.z]);
        setBurstColor('#4f74c8');
        setBurst((b) => b + 1);
        setJeanne(true);
        sounds.play('complete');
        setBanner(
            'Jeanne d’Arc løftet beleiringen av Orleans i 1429. Krigen snudde, og i 1453 vant Frankrike.'
        );
        setFact(null);
    };

    const reset = () => {
        setEnWon(0);
        setJeanne(false);
        setBanner(
            'England og Frankrike kriget i over hundre år. Klikk de tre store engelske seirene og se landet bli rødt.'
        );
        setFact(null);
        setBurstPos([0, 0.7, 0]);
    };

    useEffect(() => {
        if (!done) return;
        const t = setTimeout(() => onComplete({ score: 1, completed: true }), 500);
        return () => clearTimeout(t);
    }, [done, onComplete]);

    const idle = enWon === 0 && !jeanne;
    const currentStep = enWon + (jeanne ? 1 : 0);

    return (
        <MicroGameScaffold
            title="Hundreaarskrigen: krigen som svingte"
            subtitle="Følg de engelske seirene som farger Frankrike rødt, og se Jeanne d&apos;Arc snu krigen ved Orleans."
            estimatedSeconds={150}
            onRetry={enWon > 0 || jeanne ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0.5, 17, 12], fov: 40 },
                background: '#cfe0ee',
                fog: { near: 36, far: 72 },
                target: [0, 0, -0.6],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Frankrike vinner, 1453' : '1337 - 1453'}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Engelske seire', value: `${enWon} / ${BATTLES.length}` },
                                { label: 'Neste', value: activeBattle?.name ?? 'Orléans' },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Klikk slaget som lyser
                    </DragHint>
                </>
            }
            scene={
                <WarMap
                    enWon={enWon}
                    jeanne={jeanne}
                    activeId={activeBattle?.id ?? null}
                    burst={burst}
                    burstPos={burstPos}
                    burstColor={burstColor}
                    onWinBattle={winBattle}
                    onLiftSiege={liftSiege}
                />
            }
        >
            <div className="flex flex-col gap-3">
                <StepTracker current={currentStep} total={TOTAL_STEPS} />

                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Klikk slaget som{' '}
                            <span className="font-bold text-rose-700">lyser</span>. For hver engelske
                            seier farges et stykke av Frankrike rødt og fronten presser sørover. Til
                            slutt holder bare Orleans stand. Da kan Jeanne d&apos;Arc snu alt.
                        </p>
                        {phase1Done && (
                            <button
                                onClick={liftSiege}
                                className="self-start inline-flex items-center gap-2 rounded-xl border-2 border-blue-400 bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800 transition hover:bg-blue-200 hover:border-blue-500"
                            >
                                Send Jeanne d&apos;Arc til Orleans (1429)
                            </button>
                        )}
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen
                        title="Hundreaarskrigen svingte fram og tilbake i over hundre år, helt til Jeanne d&apos;Arc snudde den ved Orleans og Frankrike vant i 1453."
                        onReplay={reset}
                    >
                        England vant slag etter slag med langbuene sine, og rundt 1420 så det ut som
                        Frankrike var ferdig. Men en ung bondejente, Jeanne d&apos;Arc, løftet
                        beleiringen av Orleans i 1429 og ga franskmennene troen tilbake. Etter det tok
                        Frankrike landet sitt tilbake bit for bit, og i 1453 var krigen over.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-KARTET
// ============================================================

function WarMap({
    enWon,
    jeanne,
    activeId,
    burst,
    burstPos,
    burstColor,
    onWinBattle,
    onLiftSiege,
}: {
    enWon: number;
    jeanne: boolean;
    activeId: string | null;
    burst: number;
    burstPos: [number, number, number];
    burstColor: string;
    onWinBattle: (id: string) => void;
    onLiftSiege: () => void;
}) {
    const { ref: shakeRef, shake } = useShake(0.18, 0.03, 2.6);
    const prevWon = useRef(enWon);
    const prevJeanne = useRef(jeanne);
    useEffect(() => {
        if (enWon > prevWon.current) shake(0.4);
        prevWon.current = enWon;
    }, [enWon, shake]);
    useEffect(() => {
        if (jeanne && !prevJeanne.current) shake(0.9);
        prevJeanne.current = jeanne;
    }, [jeanne, shake]);

    const phase1Done = enWon >= BATTLES.length;

    return (
        <group ref={shakeRef}>
            {/* Den engelske kanalen i nord + havet rundt */}
            <WaterPlane position={[0, 0, 0]} size={[48, 44]} color="#3a6f97" />

            {/* Frankrikes landmasse */}
            <FranceLand frenchVictory={jeanne} />

            {/* Territorie-flekker som farges rødt ved hver engelsk seier,
                og skyller blått tilbake når Jeanne vinner */}
            {BATTLES.map((b, i) => (
                <RegionPatch key={b.id} place={b} english={enWon > i && !jeanne} french={jeanne} />
            ))}

            {/* Paris: fast by midt i landet */}
            <Town place={PARIS} color="#d8d2c4" label />

            {/* De tre engelske slag-nodene */}
            {BATTLES.map((p) => (
                <Interactive
                    key={p.id}
                    onSelect={() => onWinBattle(p.id)}
                    disabled={p.id !== activeId}
                    hitArea={[2.6, 2.4, 2.6]}
                    position={[p.x, 0, p.z]}
                >
                    <BattleNode
                        place={p}
                        held={enWon > BATTLES.findIndex((b) => b.id === p.id) && !jeanne}
                        isActive={p.id === activeId}
                    />
                </Interactive>
            ))}

            {/* Orleans: beleiret by + vendepunktet med Jeanne d'Arc */}
            <OrleansNode active={phase1Done && !jeanne} won={jeanne} onLift={onLiftSiege} />

            {/* Feiringspartikler */}
            <Burst position={burstPos} trigger={burst} color={burstColor} count={26} spread={2.2} />
        </group>
    );
}

// Frankrikes landmasse: noen store, flate landflekker. Far en svak fransk blå-grønn
// grunntone, og lyser litt sterkere blått når Frankrike vinner.
function FranceLand({ frenchVictory }: { frenchVictory: boolean }) {
    const blobs = useMemo(
        () => [
            { x: 0.4, z: -2.6, r: 4.0, s: 7 },
            { x: -1.4, z: 0.6, r: 3.4, s: 7 },
            { x: 1.6, z: 0.2, r: 3.0, s: 8 },
            { x: 0.0, z: 2.8, r: 3.2, s: 7 },
            { x: 2.0, z: -3.6, r: 2.4, s: 7 },
        ],
        []
    );
    return (
        <group>
            {blobs.map((b, i) => (
                <LandBlob key={i} blob={b} frenchVictory={frenchVictory} />
            ))}
        </group>
    );
}

function LandBlob({
    blob,
    frenchVictory,
}: {
    blob: { x: number; z: number; r: number; s: number };
    frenchVictory: boolean;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const base = useMemo(() => new THREE.Color('#5f8a52'), []);
    const win = useMemo(() => new THREE.Color('#5478a8'), []);
    useFrame((_, dt) => {
        if (!mat.current) return;
        mat.current.color.lerp(frenchVictory ? win : base, Math.min(1, dt * 2));
    });
    return (
        <mesh position={[blob.x, 0.12, blob.z]} rotation={[0, (blob.x + blob.z) * 0.6, 0]} receiveShadow>
            <cylinderGeometry args={[blob.r * 0.92, blob.r, 0.26, blob.s]} />
            <meshStandardMaterial ref={mat} color="#5f8a52" roughness={1} flatShading />
        </mesh>
    );
}

// En territorie-flekk rundt en slag-node. Nær den engelske siden vinner her, lyser
// flekken rødt. Når Jeanne snur krigen, skifter alle flekkene til fransk blå.
const RED = new THREE.Color('#c4392f');
const BLUE = new THREE.Color('#3f63b3');
const NEUTRAL = new THREE.Color('#6f9a5e');
function RegionPatch({
    place,
    english,
    french,
}: {
    place: Place;
    english: boolean;
    french: boolean;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!mat.current) return;
        const target = french ? BLUE : english ? RED : NEUTRAL;
        mat.current.color.lerp(target, Math.min(1, dt * 3));
        mat.current.opacity = damp(mat.current.opacity, english || french ? 0.8 : 0.18, dt, 3);
        mat.current.emissiveIntensity = damp(
            mat.current.emissiveIntensity,
            english || french ? 0.4 : 0,
            dt,
            3
        );
    });
    return (
        <mesh position={[place.x, 0.21, place.z]} rotation={[-Math.PI / 2, 0, place.x]}>
            <circleGeometry args={[2.1, 24]} />
            <meshStandardMaterial
                ref={mat}
                color="#6f9a5e"
                emissive="#c4392f"
                emissiveIntensity={0}
                transparent
                opacity={0.18}
                roughness={0.7}
            />
        </mesh>
    );
}

// En slag-node: en liten haug med kryssede sverd, et banner som reiser seg rødt når
// England vinner her, og en lysende ring når noden er den aktive.
function BattleNode({ place, held, isActive }: { place: Place; held: boolean; isActive: boolean }) {
    return (
        <group>
            {/* Liten haug */}
            <mesh position={[0, 0.18, 0]} rotation={[0, place.x * 0.7, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.8, 0.95, 0.36, 8]} />
                <meshStandardMaterial color="#7d8a5a" roughness={1} flatShading />
            </mesh>

            {/* Kryssede sverd som markør */}
            <group position={[0, 0.5, 0]}>
                <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
                    <boxGeometry args={[0.08, 0.8, 0.08]} />
                    <meshStandardMaterial color="#cfd3d8" metalness={0.5} roughness={0.4} />
                </mesh>
                <mesh rotation={[0, 0, -Math.PI / 4]} castShadow>
                    <boxGeometry args={[0.08, 0.8, 0.08]} />
                    <meshStandardMaterial color="#cfd3d8" metalness={0.5} roughness={0.4} />
                </mesh>
            </group>

            {/* Engelsk seiers-banner som reiser seg */}
            <RisingBanner held={held} color="#c4392f" />

            {isActive && <ActiveRing />}

            <Html position={[0, 2.3, 0]} center pointerEvents="none">
                <div
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap shadow ${
                        held ? 'bg-rose-700/90 text-white' : 'bg-slate-900/80 text-white'
                    }`}
                >
                    {place.name}
                </div>
            </Html>
        </group>
    );
}

// Et banner som vokser opp (skala 0 -> 1) når slaget er vunnet.
function RisingBanner({ held, color }: { held: boolean; color: string }) {
    const grow = useRef<THREE.Group>(null);
    const cloth = useRef<THREE.Mesh>(null);
    useFrame(({ clock }, dt) => {
        if (grow.current) {
            const s = damp(grow.current.scale.x, held ? 1 : 0.0001, dt, 4);
            grow.current.scale.setScalar(s);
        }
        if (cloth.current) cloth.current.rotation.y = Math.sin(clock.getElapsedTime() * 2) * 0.16;
    });
    return (
        <group ref={grow} position={[0.55, 0, 0.2]} scale={0.0001}>
            <mesh position={[0, 0.7, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 1.4, 6]} />
                <meshStandardMaterial color="#4a3520" roughness={0.9} />
            </mesh>
            <mesh ref={cloth} position={[0.3, 1.05, 0]} castShadow>
                <planeGeometry args={[0.56, 0.42]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.4}
                    roughness={0.85}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// Pulserende ring som peker ut den aktive noden.
function ActiveRing() {
    const ring = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ring.current) return;
        ring.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 3) * 0.14);
    });
    return (
        <mesh ref={ring} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.5, 0.11, 12, 36]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.7} roughness={0.4} />
        </mesh>
    );
}

// En liten by (boks + tak) på kartet.
function Town({ place, color, label }: { place: Place; color: string; label?: boolean }) {
    return (
        <group position={[place.x, 0, place.z]}>
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.5, 0.6]} />
                <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.78, 0]} castShadow>
                <coneGeometry args={[0.5, 0.4, 4]} />
                <meshStandardMaterial color="#8a5a32" roughness={0.9} />
            </mesh>
            {label && (
                <Html position={[0, 1.5, 0]} center pointerEvents="none">
                    <div className="px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap shadow bg-slate-700/85 text-white">
                        {place.name}
                    </div>
                </Html>
            )}
        </group>
    );
}

// Orleans: byen som holder stand. Mens den er beleiret ligger en rød beleiringsring
// rundt og en Hotspot ber eleven sende Jeanne d'Arc. Når beleiringen løftes, bryter
// ringen, et fransk blått-hvitt banner reiser seg, og Jeanne står med sitt banner.
function OrleansNode({ active, won, onLift }: { active: boolean; won: boolean; onLift: () => void }) {
    const ring = useRef<THREE.Mesh>(null);
    const jeanne = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        // Beleiringsringen vises mens byen er beleiret, og synker bort når den løftes.
        if (ring.current) {
            const mat = ring.current.material as THREE.MeshStandardMaterial;
            mat.opacity = damp(mat.opacity, active && !won ? 0.85 : 0, dt, 3);
        }
        // Jeanne reiser seg når beleiringen er løftet.
        if (jeanne.current) {
            const s = damp(jeanne.current.scale.x, won ? 1 : 0.0001, dt, 4);
            jeanne.current.scale.setScalar(s);
        }
    });

    return (
        <group position={[ORLEANS.x, 0, ORLEANS.z]}>
            {/* Bymur + by */}
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.95, 1.05, 0.5, 10]} />
                <meshStandardMaterial color="#cdbfa6" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.75, 0]} castShadow>
                <boxGeometry args={[0.5, 0.55, 0.5]} />
                <meshStandardMaterial color="#e6ddca" roughness={0.85} />
            </mesh>

            {/* Rød beleiringsring */}
            <mesh ref={ring} position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.7, 0.13, 12, 40]} />
                <meshStandardMaterial
                    color="#c4392f"
                    emissive="#c4392f"
                    emissiveIntensity={0.6}
                    transparent
                    opacity={0}
                    roughness={0.5}
                />
            </mesh>

            {/* Jeanne d'Arc med fransk banner (reiser seg ved seier) */}
            <group ref={jeanne} position={[-0.1, 0.55, 0.7]} scale={0.0001}>
                <mesh position={[0, 0.45, 0]} castShadow>
                    <capsuleGeometry args={[0.16, 0.5, 4, 8]} />
                    <meshStandardMaterial color="#c9ccd2" metalness={0.4} roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.9, 0]} castShadow>
                    <sphereGeometry args={[0.16, 12, 12]} />
                    <meshStandardMaterial color="#e8c7a0" roughness={0.8} />
                </mesh>
                {/* Banner-stang + blått-hvitt kled */}
                <mesh position={[0.32, 0.7, 0]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
                    <meshStandardMaterial color="#5a4326" roughness={0.9} />
                </mesh>
                <mesh position={[0.58, 1.1, 0]} castShadow>
                    <planeGeometry args={[0.5, 0.42]} />
                    <meshStandardMaterial
                        color="#3f63b3"
                        emissive="#3f63b3"
                        emissiveIntensity={0.4}
                        roughness={0.85}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </group>

            {active && !won && (
                <Hotspot
                    position={[0, 1.6, 0]}
                    onSelect={onLift}
                    label="Jeanne d'Arc løfter beleiringen"
                    radius={0.6}
                    color="#3f63b3"
                />
            )}

            <Html position={[0, 2.35, 0]} center pointerEvents="none">
                <div
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap shadow ${
                        won ? 'bg-blue-700/90 text-white' : 'bg-rose-900/85 text-white'
                    }`}
                >
                    Orléans
                </div>
            </Html>
        </group>
    );
}

export default Hundreaarskrigen3D;
