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

// Mikrospill til artikkelen "Rikssamlingen: Da Norge ble ett". Et stilisert kart
// over kysten sett ovenfra. Hvert kystrike har sin egen småkonge og sitt eget
// banner. Eleven klikker rikene ett for ett og legger dem under Harald. For hvert
// rike som faller, reiser en kongsgård seg, banneret skifter til Haralds gull, og
// en bit av den gylne kystleia, Nordvegen, lyser opp.
//
// Lyspæra (rett fra artikkelen): Norge var ikke ett land, men en rekke frie
// småkongedommer langs kysten. Harald samlet dem ved å ta kontroll over kysten,
// Nordvegen. Den som rådde over kysten, rådde over handelen og skipene. De siste
// frie kongene i sørvest ga seg ikke, og det avgjørende slaget sto i Hafrsfjord
// rundt år 872.
//
// Mekanikk: i fase 1 klikker eleven de fire rikene i felttogs-rekkefølge (bare det
// aktive riket lyser og kan klikkes). Et mørkt gap blir stående i kystleia ved
// Hafrsfjord, der de frie kongene fortsatt holder stand. I fase 2 klikker eleven
// Hafrsfjord-slaget: fienden samler flåten, slaget står, gapet fylles, og hele
// kysten blir en sammenhengende gullvei. Da er Norge ett rike.

interface Place {
    id: string;
    name: string;
    x: number;
    z: number;
    freeColor: string; // småkongens eget banner mens riket er fritt
}

// Vestfold er Haralds arverike (holdt fra start). Rogaland/Hafrsfjord er
// slag-noden (tas til slutt). Posisjonene følger grovt den norske kysten:
// Vestfold sørøst, så nordover langs vestkysten til Trøndelag i nord.
const VESTFOLD: Place = { id: 'vestfold', name: 'Vestfold', x: 4.6, z: 4.2, freeColor: '#caa028' };
const HAFRSFJORD: Place = {
    id: 'hafrsfjord',
    name: 'Hafrsfjord',
    x: -0.6,
    z: 4.7,
    freeColor: '#7d3b8f',
};
// Rikene eleven legger under Harald, i felttogs-rekkefølge (fase 1).
const TARGETS: Place[] = [
    { id: 'agder', name: 'Agder', x: 2.0, z: 5.4, freeColor: '#2f7d4f' },
    { id: 'hordaland', name: 'Hordaland', x: -2.6, z: 2.2, freeColor: '#3a6ea5' },
    { id: 'more', name: 'Møre', x: -2.3, z: -1.4, freeColor: '#a5562f' },
    { id: 'trondelag', name: 'Trøndelag', x: -0.4, z: -4.6, freeColor: '#7a5aa5' },
];
// Hafrsfjord ligger mellom Agder og Hordaland på den ekte kysten. La leia følge
// sør -> nord: Vestfold, Agder, Hafrsfjord, Hordaland, Møre, Trøndelag.
const COAST_LANE: Place[] = [VESTFOLD, TARGETS[0], HAFRSFJORD, TARGETS[1], TARGETS[2], TARGETS[3]];

const TOTAL_STEPS = TARGETS.length + 1; // fire riker + slaget

// Ett kort faktakort for en 14-åring per rike som faller.
const FACTS = [
    'Agder ga seg. Harald bygde en kongsgård her og tok kontroll over kysten, Nordvegen.',
    'Hordaland kom med. Den som rådde over kysten, rådde over handelen og skipene.',
    'Møre falt. Harald reiste kongsgårder langs hele leia for å holde grepet om makten.',
    'Trøndelag ble hans. Nå manglet bare de frie kongene i sørvest.',
];

const PROMPTS = [
    'Klikk Agder for å legge riket under Harald.',
    'Klikk Hordaland. Følg kysten nordover.',
    'Klikk Møre og knytt vestkysten sammen.',
    'Klikk Trøndelag, det siste riket i nord.',
];

const Rikssamlingen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    // Hvor mange av de fire rikene som er samlet (0..4).
    const [united, setUnited] = useState(0);
    const [battleWon, setBattleWon] = useState(false);
    const [banner, setBanner] = useState<string | null>(
        'Norge var ikke ett land. Hver kyststripe hadde sin egen småkonge. Samle dem under Harald.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([VESTFOLD.x, 0.6, VESTFOLD.z]);

    const phase1Done = united >= TARGETS.length;
    const done = battleWon;
    const activeTarget = phase1Done ? null : TARGETS[united];

    const unite = (id: string) => {
        if (!activeTarget || id !== activeTarget.id) return;
        setBurstPos([activeTarget.x, 0.7, activeTarget.z]);
        setBurst((b) => b + 1);
        const next = united + 1;
        setUnited(next);
        setFact(FACTS[united]);
        if (next >= TARGETS.length) {
            sounds.play('advance');
            setBanner(
                'De siste frie kongene samlet flåten i Hafrsfjord. Klikk for å ta det avgjørende slaget.'
            );
        } else {
            sounds.play('advance');
            setBanner(PROMPTS[next]);
        }
    };

    const fightHafrsfjord = () => {
        if (!phase1Done || battleWon) return;
        setBurstPos([HAFRSFJORD.x, 0.7, HAFRSFJORD.z]);
        setBurst((b) => b + 1);
        setBattleWon(true);
        sounds.play('complete');
        setBanner('Rundt år 872 vant Harald slaget ved Hafrsfjord. Norge var samlet til ett rike.');
        setFact(null);
    };

    const reset = () => {
        setUnited(0);
        setBattleWon(false);
        setBanner(
            'Norge var ikke ett land. Hver kyststripe hadde sin egen småkonge. Samle dem under Harald.'
        );
        setFact(null);
        setBurstPos([VESTFOLD.x, 0.6, VESTFOLD.z]);
    };

    useEffect(() => {
        if (!done) return;
        const t = setTimeout(() => onComplete({ score: 1, completed: true }), 500);
        return () => clearTimeout(t);
    }, [done, onComplete]);

    const idle = united === 0 && !battleWon;
    const currentStep = united + (battleWon ? 1 : 0);

    return (
        <MicroGameScaffold
            title="Rikssamlingen: da Norge ble ett"
            subtitle="Samle småkongedommene langs kysten under Harald, og vinn det avgjørende slaget i Hafrsfjord."
            estimatedSeconds={150}
            onRetry={united > 0 || battleWon ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0.5, 17, 12], fov: 40 },
                background: '#cfe6f2',
                fog: { near: 36, far: 72 },
                target: [0, 0, 0.4],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Samlet rike, ca. 872' : 'Vikingtiden'}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                {
                                    label: 'Riker samlet',
                                    value: `${currentStep} / ${TOTAL_STEPS}`,
                                },
                                { label: 'Neste', value: activeTarget?.name ?? 'Hafrsfjord' },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Klikk riket som lyser
                    </DragHint>
                </>
            }
            scene={
                <CoastMap
                    united={united}
                    battleWon={battleWon}
                    activeId={activeTarget?.id ?? null}
                    burst={burst}
                    burstPos={burstPos}
                    onUnite={unite}
                    onBattle={fightHafrsfjord}
                />
            }
        >
            <div className="flex flex-col gap-3">
                <StepTracker current={currentStep} total={TOTAL_STEPS} />

                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Klikk riket som <span className="font-bold text-amber-700">lyser</span>{' '}
                            for å legge det under Harald. For hvert rike du tar, reiser en
                            kongsgård seg og en bit av den gylne kystleia, Nordvegen, lyser opp. Men
                            ett mørkt gap blir stående ved Hafrsfjord, der de frie kongene holder
                            stand.
                        </p>
                        {phase1Done && (
                            <button
                                onClick={fightHafrsfjord}
                                className="self-start inline-flex items-center gap-2 rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-200 hover:border-amber-500"
                            >
                                Ta slaget ved Hafrsfjord (ca. 872)
                            </button>
                        )}
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen
                        title="Norge ble ett rike fordi Harald tok kontroll over kysten og vant slaget ved Hafrsfjord rundt år 872."
                        onReplay={reset}
                    >
                        Norge var før dette en rekke frie småkongedommer. Harald samlet dem ved å
                        råde over kysten, Nordvegen. Den som kontrollerte kysten, kontrollerte også
                        handelen og skipstrafikken. Da de siste frie kongene tapte i Hafrsfjord, lå
                        hele leia under en konge, og kysten ble en sammenhengende gullvei.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-KARTET
// ============================================================

function CoastMap({
    united,
    battleWon,
    activeId,
    burst,
    burstPos,
    onUnite,
    onBattle,
}: {
    united: number;
    battleWon: boolean;
    activeId: string | null;
    burst: number;
    burstPos: [number, number, number];
    onUnite: (id: string) => void;
    onBattle: () => void;
}) {
    const { ref: shakeRef, shake } = useShake(0.18, 0.03, 2.6);
    const prevUnited = useRef(united);
    const prevBattle = useRef(battleWon);
    useEffect(() => {
        if (united > prevUnited.current) shake(0.4);
        prevUnited.current = united;
    }, [united, shake]);
    useEffect(() => {
        if (battleWon && !prevBattle.current) shake(0.9);
        prevBattle.current = battleWon;
    }, [battleWon, shake]);

    // Hvilke steder er lagt under Harald.
    const isHeld = (id: string): boolean => {
        if (id === 'vestfold') return true;
        if (id === 'hafrsfjord') return battleWon;
        const idx = TARGETS.findIndex((t) => t.id === id);
        return idx > -1 && united > idx;
    };

    const phase1Done = united >= TARGETS.length;

    return (
        <group ref={shakeRef}>
            {/* Havet i vest */}
            <WaterPlane position={[0, 0, 0]} size={[48, 44]} color="#2f6f97" />

            {/* Norges innland som en svak rygg bak kystrikene */}
            <Backbone />

            {/* Kystleia, Nordvegen: lyser gull etappe for etappe */}
            {COAST_LANE.slice(0, -1).map((a, i) => {
                const b = COAST_LANE[i + 1];
                return <Lane key={`${a.id}-${b.id}`} a={a} b={b} gold={isHeld(a.id) && isHeld(b.id)} />;
            })}

            {/* Haralds arverike, alltid samlet */}
            <Kingdom place={VESTFOLD} held isActive={false} crown />

            {/* De fire rikene eleven samler */}
            {TARGETS.map((p) => (
                <Interactive
                    key={p.id}
                    onSelect={() => onUnite(p.id)}
                    disabled={p.id !== activeId}
                    hitArea={[2.6, 2.4, 2.6]}
                    position={[p.x, 0, p.z]}
                >
                    <Kingdom place={p} held={isHeld(p.id)} isActive={p.id === activeId} local />
                </Interactive>
            ))}

            {/* Hafrsfjord: slag-noden i sørvest */}
            <HafrsfjordNode
                active={phase1Done && !battleWon}
                won={battleWon}
                onBattle={onBattle}
            />

            {/* Feiringspartikler der noe blir samlet */}
            <Burst position={burstPos} trigger={burst} color="#f4d27a" count={24} spread={2.1} />
        </group>
    );
}

// Norges innland: noen store, flate landflekker på østsiden så kartet leser som
// ett land som tar form, ikke bare løse øyer.
function Backbone() {
    const blobs = useMemo(
        () => [
            { x: 5.4, z: 3.0, r: 3.4, s: 7 },
            { x: 3.0, z: -1.0, r: 3.0, s: 7 },
            { x: 1.4, z: -4.6, r: 3.2, s: 8 },
            { x: 2.2, z: 5.8, r: 2.6, s: 7 },
        ],
        []
    );
    return (
        <group>
            {blobs.map((b, i) => (
                <mesh
                    key={i}
                    position={[b.x, 0.12, b.z]}
                    rotation={[0, (b.x + b.z) * 0.6, 0]}
                    receiveShadow
                >
                    <cylinderGeometry args={[b.r * 0.92, b.r, 0.26, b.s]} />
                    <meshStandardMaterial color="#5d7d44" roughness={1} flatShading />
                </mesh>
            ))}
        </group>
    );
}

// Et kystrike: en kystflekk, et banner som skifter farge når riket faller, og en
// kongsgård som reiser seg. `local` betyr at gruppa allerede er flyttet til stedet
// av en Interactive-forelder (så vi ikke dobbelt-posisjonerer).
function Kingdom({
    place,
    held,
    isActive,
    local = false,
    crown = false,
}: {
    place: Place;
    held: boolean;
    isActive: boolean;
    local?: boolean;
    crown?: boolean;
}) {
    const pos: [number, number, number] = local ? [0, 0, 0] : [place.x, 0, place.z];
    return (
        <group position={pos}>
            {/* Kysten */}
            <mesh position={[0, 0.16, 0]} rotation={[0, place.x * 0.7, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[1.2, 1.34, 0.32, 8]} />
                <meshStandardMaterial color="#5f8a44" roughness={1} flatShading />
            </mesh>

            {/* Kongsgård / småkongens hus */}
            <Longhouse held={held} />

            {/* Banner: småkongens farge mens fritt, Haralds gull når samlet */}
            <KingdomBanner held={held} freeColor={place.freeColor} />

            {/* Gull-krone over Vestfold (Haralds arverike) */}
            {crown && <CrownMark y={2.0} />}

            {/* Lysende ring som peker ut det aktive riket */}
            {isActive && <ActiveRing />}

            {/* Stedsnavn */}
            <Html position={[0, 2.45, 0]} center pointerEvents="none">
                <div
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap shadow ${
                        held ? 'bg-amber-600/90 text-white' : 'bg-slate-900/80 text-white'
                    }`}
                >
                    {place.name}
                </div>
            </Html>
        </group>
    );
}

// Et langhus som reiser seg (skala 0 -> 1) når riket legges under Harald.
function Longhouse({ held }: { held: boolean }) {
    const grow = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!grow.current) return;
        const s = damp(grow.current.scale.x, held ? 1 : 0.0001, dt, 4);
        grow.current.scale.setScalar(s);
    });
    return (
        <group ref={grow} position={[0, 0.32, -0.1]} scale={0.0001}>
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.1, 0.6, 0.7]} />
                <meshStandardMaterial color="#8a5a32" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.72, 0]} rotation={[0, 0, 0]} castShadow>
                <boxGeometry args={[1.2, 0.34, 0.82]} />
                <meshStandardMaterial color="#5c3a22" roughness={0.9} />
            </mesh>
        </group>
    );
}

// Banneret over riket. Stanga står alltid, men kledet skifter farge fra
// småkongens egen til Haralds gull når riket faller.
const HARALD_GOLD = new THREE.Color('#e2b53a');
function KingdomBanner({ held, freeColor }: { held: boolean; freeColor: string }) {
    const cloth = useRef<THREE.Mesh>(null);
    const free = useMemo(() => new THREE.Color(freeColor), [freeColor]);
    useFrame(({ clock }, dt) => {
        if (!cloth.current) return;
        cloth.current.rotation.y = Math.sin(clock.getElapsedTime() * 2) * 0.16;
        const mat = cloth.current.material as THREE.MeshStandardMaterial;
        mat.color.lerp(held ? HARALD_GOLD : free, Math.min(1, dt * 4));
        mat.emissiveIntensity = damp(mat.emissiveIntensity, held ? 0.5 : 0, dt, 4);
    });
    return (
        <group position={[0.5, 0, 0.5]}>
            <mesh position={[0, 0.7, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 1.4, 6]} />
                <meshStandardMaterial color="#4a3520" roughness={0.9} />
            </mesh>
            <mesh ref={cloth} position={[0.32, 1.05, 0]} castShadow>
                <planeGeometry args={[0.6, 0.46]} />
                <meshStandardMaterial
                    color={freeColor}
                    emissive="#e2b53a"
                    emissiveIntensity={0}
                    roughness={0.85}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// En liten svevende gullkrone som markerer Haralds eget rike (og det samlede riket).
function CrownMark({ y }: { y: number }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime();
        ref.current.position.y = y + Math.sin(t * 1.6) * 0.12;
        ref.current.rotation.y = t * 0.6;
    });
    return (
        <group ref={ref} position={[0, y, 0]}>
            <mesh castShadow>
                <cylinderGeometry args={[0.34, 0.34, 0.2, 10, 1, true]} />
                <meshStandardMaterial
                    color="#f2c84b"
                    emissive="#caa028"
                    emissiveIntensity={0.5}
                    metalness={0.5}
                    roughness={0.4}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {Array.from({ length: 6 }).map((_, i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(a) * 0.34, 0.16, Math.sin(a) * 0.34]} castShadow>
                        <coneGeometry args={[0.07, 0.18, 4]} />
                        <meshStandardMaterial
                            color="#f6d469"
                            emissive="#caa028"
                            emissiveIntensity={0.5}
                            metalness={0.5}
                            roughness={0.4}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

// Pulserende ring på vannet som trekker blikket mot det aktive riket.
function ActiveRing() {
    const ring = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ring.current) return;
        ring.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 3) * 0.14);
    });
    return (
        <mesh ref={ring} position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.7, 0.12, 12, 36]} />
            <meshStandardMaterial
                color="#f59e0b"
                emissive="#f59e0b"
                emissiveIntensity={0.7}
                roughness={0.4}
            />
        </mesh>
    );
}

// Hafrsfjord: de frie sørvest-kongene samler flåten her. Mens noden er aktiv
// ligger fiendens langskip i fjorden og en Hotspot ber eleven ta slaget. Når
// slaget er vunnet, synker fienden, og en kongsgård + gull-krone reiser seg.
function HafrsfjordNode({
    active,
    won,
    onBattle,
}: {
    active: boolean;
    won: boolean;
    onBattle: () => void;
}) {
    const fleet = useRef<THREE.Group>(null);
    // Flåten vises når slaget kan tas, og synker når det er vunnet.
    useFrame((_, dt) => {
        if (!fleet.current) return;
        const target = active && !won ? 1 : 0.0001;
        const s = damp(fleet.current.scale.x, target, dt, 4);
        fleet.current.scale.setScalar(s);
        fleet.current.position.y = won ? damp(fleet.current.position.y, -0.6, dt, 3) : 0;
    });

    return (
        <group position={[HAFRSFJORD.x, 0, HAFRSFJORD.z]}>
            {/* Kysten rundt fjorden */}
            <mesh position={[0, 0.16, 0]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[1.2, 1.34, 0.32, 8]} />
                <meshStandardMaterial color="#5f8a44" roughness={1} flatShading />
            </mesh>

            {/* Fiendens flåte (de frie kongenes skip) */}
            <group ref={fleet}>
                {[
                    [-0.6, 0.7],
                    [0.5, 0.9],
                    [0.0, 1.4],
                ].map(([x, z], i) => (
                    <EnemyShip key={i} x={x} z={z} />
                ))}
            </group>

            {/* Når slaget er vunnet: kongsgård + krone som de andre rikene */}
            <Longhouse held={won} />
            <KingdomBanner held={won} freeColor={HAFRSFJORD.freeColor} />
            {won && <CrownMark y={2.0} />}

            {/* Slag-Hotspot */}
            {active && !won && (
                <Hotspot
                    position={[0, 1.5, 0]}
                    onSelect={onBattle}
                    label="Slaget ved Hafrsfjord"
                    radius={0.6}
                    color="#e0432f"
                />
            )}

            <Html position={[0, 2.45, 0]} center pointerEvents="none">
                <div
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap shadow ${
                        won ? 'bg-amber-600/90 text-white' : 'bg-rose-900/85 text-white'
                    }`}
                >
                    Hafrsfjord
                </div>
            </Html>
        </group>
    );
}

// Et lite fiendtlig langskip i fjorden, med rødt skjold på sida.
function EnemyShip({ x, z }: { x: number; z: number }) {
    const hull = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!hull.current) return;
        hull.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.8 + x) * 0.06;
    });
    return (
        <group position={[x, 0.34, z]} ref={hull}>
            <mesh position={[0, 0.18, 0]} castShadow>
                <boxGeometry args={[0.7, 0.22, 0.34]} />
                <meshStandardMaterial color="#5a3c22" roughness={0.85} />
            </mesh>
            <mesh position={[0.42, 0.24, 0]} rotation={[0, 0, 0.5]} castShadow>
                <coneGeometry args={[0.14, 0.4, 4]} />
                <meshStandardMaterial color="#4a2f1a" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.36, 0.18]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 0.04, 12]} />
                <meshStandardMaterial color="#b23b2e" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Et ledd av kystleia (Nordvegen) mellom to steder. Blå mens fri, lyser gull når
// begge endene ligger under Harald. Gapet ved Hafrsfjord blir stående mørkt til
// slaget er vunnet, og fyller seg først da, så hele leia blir sammenhengende.
const LANE_GOLD = new THREE.Color('#e3c069');
const LANE_DIM = new THREE.Color('#7fa6c2');
function Lane({ a, b, gold }: { a: Place; b: Place; gold: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    useFrame((_, dt) => {
        if (!mat.current) return;
        mat.current.color.lerp(gold ? LANE_GOLD : LANE_DIM, Math.min(1, dt * 3));
        mat.current.opacity = damp(mat.current.opacity, gold ? 0.95 : 0.32, dt, 3);
        mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, gold ? 0.45 : 0, dt, 3);
    });
    return (
        <mesh position={[(a.x + b.x) / 2, 0.2, (a.z + b.z) / 2]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.16, 0.05, len]} />
            <meshStandardMaterial
                ref={mat}
                color="#7fa6c2"
                emissive="#e3c069"
                emissiveIntensity={0}
                transparent
                opacity={0.32}
                roughness={0.6}
            />
        </mesh>
    );
}

export default Rikssamlingen3D;
