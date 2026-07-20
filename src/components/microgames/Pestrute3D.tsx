import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    WaterPlane,
    Tree,
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

// Mikrospill til artikkelen "Svartedauden". Et stilisert handelskart over Europa
// sett ovenfra. Pesten starter ved Svartehavet i 1346, og eleven klikker neste
// havn langs handelsruta. En mørk pest-sky glir langs ruta til byen, husene blir
// grå, folk faller, graver reiser seg, og dødstallet stiger. Slik føler eleven
// på kroppen hvordan Svartedauden fulgte handelsrutene helt til Bergen i 1349.
//
// Lyspæra (rett fra artikkelen): pesten spredte seg via handelsrutene fra ost,
// by for by, og nådde Bergen i 1349. De samme skipene og veiene som bærte
// rikdom, bærte også døden. Rundt halvparten av folket i Norge døde.
//
// Mekanikk (rute + forvandling): klikk den pulserende ringen ved neste havn langs
// ruta. Bare neste by er klikkbar, så eleven følger selve ruta. Pest-skyen seiler
// dit, byen forvandles, og året + dødstallet teller oppover.

interface City {
    name: string;
    year: string;
    x: number;
    z: number;
}

// Byene i historisk rekkefolge langs handelsrutene. Caffa ved Svartehavet er
// utgangspunktet (pesten var allerede der), så eleven sprer den videre vestover.
const CITIES: City[] = [
    { name: 'Caffa', year: '1346', x: 8.6, z: 0.4 },
    { name: 'Konstantinopel', year: '1347', x: 5.3, z: 1.7 },
    { name: 'Messina', year: '1347', x: 1.4, z: 3.4 },
    { name: 'Marseille', year: '1348', x: -2.4, z: 1.3 },
    { name: 'London', year: '1348', x: -4.8, z: -3.0 },
    { name: 'Bergen', year: '1349', x: -1.9, z: -6.2 },
];
const TOTAL = CITIES.length;

// Omtrentlig dødstall i Europa (millioner) etter hvert som pesten når nye byer.
const DEATHS = [2, 5, 11, 17, 22, 25];

// Korte fakta for en 14-åring, ett per nytt steg langs ruta.
const FACTS = [
    'Fra Svartehavet seilte genovesiske handelsskip vestover. Rotter og lopper med pestsmitte fulgte med lasten.',
    'Høsten 1347 kom skip med døde og døende sjøfolk til Messina på Sicilia. Nå var pesten i Europa.',
    'Langs handelsrutene spredte pesten seg videre til travle havnebyer i Frankrike.',
    'I 1348 nådde pesten England. Den fulgte veiene og elvene innover i landet.',
    'Et engelsk skip brakte pesten til Bergen i 1349. Herfra spredte Svartedauden seg over hele Norge.',
];

// En stilisert lavpoly-utgave av Europa, bygd av flate øyer (landflekker) på
// havet. Ikke et nøyaktig kart, men det leser som en kyst med havner og hav.
interface Blob {
    x: number;
    z: number;
    r: number;
    s: number;
    c: string;
}
const G = '#6f9d4e';
const S = '#5f8a44';
const A = '#bfa765';
const LAND: Blob[] = [
    // Det europeiske fastlandet
    { x: 0, z: -2, r: 3.6, s: 9, c: G },
    { x: 3.4, z: -1.4, r: 3.0, s: 8, c: G },
    { x: -3.2, z: -2.0, r: 2.8, s: 9, c: G },
    { x: 5.4, z: -1.0, r: 2.6, s: 8, c: G },
    { x: 6.9, z: -0.3, r: 2.2, s: 7, c: G },
    { x: 1.6, z: 0.4, r: 2.2, s: 8, c: G },
    { x: -2.2, z: 0.8, r: 1.9, s: 8, c: G },
    { x: -4.9, z: -3.2, r: 2.1, s: 8, c: G },
    { x: -4.6, z: -1.2, r: 1.7, s: 7, c: G },
    // Land rundt Svartehavet ved Caffa
    { x: 8.9, z: -1.6, r: 2.0, s: 7, c: G },
    { x: 9.6, z: 1.9, r: 1.7, s: 7, c: G },
    // Italia og Sicilia ned mot Messina
    { x: 1.4, z: 2.1, r: 1.2, s: 7, c: G },
    { x: 1.4, z: 3.1, r: 0.9, s: 7, c: G },
    { x: 1.4, z: 3.85, r: 0.7, s: 7, c: G },
    // Skandinavia med Bergen
    { x: -1.0, z: -6.0, r: 2.2, s: 8, c: S },
    { x: -3.0, z: -5.2, r: 1.7, s: 7, c: S },
    { x: 0.7, z: -6.7, r: 1.6, s: 7, c: S },
    // Nord-Afrika lukker Middelhavet i sør
    { x: -4.2, z: 5.4, r: 1.9, s: 7, c: A },
    { x: -0.5, z: 5.7, r: 2.0, s: 7, c: A },
    { x: 3.3, z: 5.4, r: 1.9, s: 7, c: A },
    { x: 6.8, z: 5.0, r: 1.8, s: 7, c: A },
];

const C_BODY = new THREE.Color('#cf9d6b');
const C_BODY_DEAD = new THREE.Color('#6f6f6f');
const C_ROOF = new THREE.Color('#8a4a30');
const C_ROOF_DEAD = new THREE.Color('#3f3f3f');

const Pestrute3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    // Caffa (index 0) er smittet fra start. Eleven sprer videre.
    const [infected, setInfected] = useState<boolean[]>(() =>
        CITIES.map((_, i) => i === 0)
    );
    const [banner, setBanner] = useState<string | null>(
        'Pesten startet ved Svartehavet rundt 1346. Klikk den pulserende ringen ved neste havn langs handelsruta.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([8.6, 0.6, 0.4]);

    const count = infected.filter(Boolean).length;
    const nextIndex = infected.findIndex((v) => !v);
    const done = nextIndex === -1;
    const latest = CITIES[count - 1];
    const year = latest.year;
    const deaths = DEATHS[Math.min(count - 1, DEATHS.length - 1)];

    const reset = () => {
        setInfected(CITIES.map((_, i) => i === 0));
        setBanner(
            'Pesten startet ved Svartehavet rundt 1346. Klikk den pulserende ringen ved neste havn langs handelsruta.'
        );
        setFact(null);
        setBurstPos([8.6, 0.6, 0.4]);
    };

    const infect = (i: number) => {
        if (i < 0 || infected[i] || done) return;
        const next = infected.slice();
        next[i] = true;
        const city = CITIES[i];
        setInfected(next);
        setBurstPos([city.x, 0.7, city.z]);
        setBurst((b) => b + 1);
        const newCount = next.filter(Boolean).length;
        if (newCount >= TOTAL) {
            sounds.play('complete');
            setBanner(null);
            setFact(null);
        } else {
            sounds.play('advance');
            setFact(FACTS[Math.min(i - 1, FACTS.length - 1)]);
            setBanner('Pesten sprer seg videre langs ruta. Klikk neste havn.');
        }
    };

    useEffect(() => {
        if (!done) return;
        const t = setTimeout(() => onComplete({ score: 1, completed: true }), 400);
        return () => clearTimeout(t);
    }, [done, onComplete]);

    const idle = count <= 1;

    return (
        <MicroGameScaffold
            title="Pestens reise langs handelsrutene"
            subtitle="Følg Svartedauden fra Svartehavet til Bergen, by for by langs handelsrutene"
            estimatedSeconds={130}
            onRetry={count > 1 ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0.5, 15, 11], fov: 42 },
                background: '#cfe6f2',
                fog: { near: 30, far: 64 },
                target: [0.5, 0, -0.6],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Bergen 1349' : `År ${year}`}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Rammet', value: `${count} / ${TOTAL}`, unit: 'byer' },
                                { label: 'Døde i Europa', value: `~${deaths}`, unit: 'mill.' },
                            ]}
                        />
                    )}
                    <DragHint show={idle} corner="bc">
                        Klikk neste havn langs ruta
                    </DragHint>
                </>
            }
            scene={
                <Map
                    infected={infected}
                    count={count}
                    nextIndex={done ? -1 : nextIndex}
                    burst={burst}
                    burstPos={burstPos}
                    onInfect={infect}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done && <StepTracker current={count} total={TOTAL} />}

                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Klikk den røde{' '}
                            <span className="font-bold text-rose-700">ringen</span> ved neste havn.
                            Da følger du pesten langs handelsruta. Byen blir grå, folk dør, og
                            graver reiser seg. Pesten flytter seg fra by til by helt til den når
                            Bergen.
                        </p>
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen title="Pesten nådde Bergen i 1349." onReplay={reset}>
                        Pesten fulgte handelsrutene fra Svartehavet til Bergen på bare tre år. De
                        samme skipene og veiene som bærte rikdom mellom byene, bærte også døden.
                        I Norge døde rundt halvparten av befolkningen, og mange gårder ble stående
                        tomme.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-KARTET
// ============================================================

function Map({
    infected,
    count,
    nextIndex,
    burst,
    burstPos,
    onInfect,
}: {
    infected: boolean[];
    count: number;
    nextIndex: number;
    burst: number;
    burstPos: [number, number, number];
    onInfect: (i: number) => void;
}) {
    const { ref: shakeRef, shake } = useShake(0.18, 0.03, 2.2);
    const prevCount = useRef(count);
    useEffect(() => {
        if (count > prevCount.current) shake(0.5);
        prevCount.current = count;
    }, [count, shake]);

    // Pest-skyen glir mot den sist smittede byen.
    const cloudTarget: [number, number] = [CITIES[count - 1].x, CITIES[count - 1].z];

    return (
        <group ref={shakeRef}>
            {/* Havet */}
            <WaterPlane position={[1, 0, -0.5]} size={[42, 38]} color="#356f97" />

            {/* Landflekkene */}
            {LAND.map((b, i) => (
                <Island key={i} blob={b} />
            ))}

            {/* Litt liv: noen trær på fastlandet */}
            <Tree position={[2.6, 0.3, -2.4]} leaf="#4f7a34" />
            <Tree position={[-1.4, 0.3, -1.6]} leaf="#4f7a34" />
            <Tree position={[5.0, 0.3, -1.8]} leaf="#4f7a34" />

            {/* Ruteledd mellom byene */}
            {CITIES.slice(0, -1).map((c, i) => (
                <RouteSegment
                    key={i}
                    a={c}
                    b={CITIES[i + 1]}
                    reached={infected[i + 1]}
                />
            ))}

            {/* Byene */}
            {CITIES.map((c, i) => (
                <CityNode key={c.name} city={c} infected={infected[i]} />
            ))}

            {/* Pest-skyen som følger ruta */}
            <PlagueCloud target={cloudTarget} active={count > 1} />

            {/* Klikkbar ring ved neste havn langs ruta */}
            {nextIndex >= 0 && (
                <Hotspot
                    position={[CITIES[nextIndex].x, 1.5, CITIES[nextIndex].z]}
                    onSelect={() => onInfect(nextIndex)}
                    label={CITIES[nextIndex].name}
                    radius={0.62}
                    color="#dc2626"
                />
            )}

            {/* Mork stovsky-burst når en by rammes */}
            <Burst position={burstPos} trigger={burst} color="#7f1d1d" count={20} spread={1.8} />
        </group>
    );
}

// En flat landflekk (lavpoly øy) på havet.
function Island({ blob }: { blob: Blob }) {
    return (
        <mesh
            position={[blob.x, 0.16, blob.z]}
            rotation={[0, (blob.x + blob.z) * 0.6, 0]}
            castShadow
            receiveShadow
        >
            <cylinderGeometry args={[blob.r * 0.92, blob.r, 0.32, blob.s]} />
            <meshStandardMaterial color={blob.c} roughness={1} flatShading />
        </mesh>
    );
}

// Et ledd av handelsruta mellom to byer. Demper fra dempet gull til mørk rød når
// pesten har nådd fram langs leddet.
const ROUTE_IDLE = new THREE.Color('#d9b066');
const ROUTE_HOT = new THREE.Color('#9a1f1f');
function RouteSegment({ a, b, reached }: { a: City; b: City; reached: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    useFrame((_, dt) => {
        if (mat.current) {
            mat.current.color.lerp(reached ? ROUTE_HOT : ROUTE_IDLE, Math.min(1, dt * 3));
            mat.current.emissiveIntensity = damp(
                mat.current.emissiveIntensity,
                reached ? 0.5 : 0.15,
                dt,
                3
            );
        }
    });
    return (
        <mesh
            position={[(a.x + b.x) / 2, 0.42, (a.z + b.z) / 2]}
            rotation={[0, angle, 0]}
        >
            <boxGeometry args={[0.1, 0.05, len]} />
            <meshStandardMaterial
                ref={mat}
                color="#d9b066"
                emissive="#9a1f1f"
                emissiveIntensity={0.15}
                roughness={0.6}
            />
        </mesh>
    );
}

// En by på kartet. Frisk: lyse hus, folk på beina, et tre. Rammet: husene blir
// grå, folkene faller og forsvinner, graver reiser seg, og en mørk pest-dis
// legger seg over byen. Alt drives av infected-propen.
function CityNode({ city, infected }: { city: City; infected: boolean }) {
    const bodyA = useRef<THREE.MeshStandardMaterial>(null);
    const bodyB = useRef<THREE.MeshStandardMaterial>(null);
    const roofA = useRef<THREE.MeshStandardMaterial>(null);
    const roofB = useRef<THREE.MeshStandardMaterial>(null);
    const people = useRef<THREE.Group>(null);
    const graves = useRef<THREE.Group>(null);
    const haze = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((_, dt) => {
        const k = Math.min(1, dt * 2.2);
        if (bodyA.current) bodyA.current.color.lerp(infected ? C_BODY_DEAD : C_BODY, k);
        if (bodyB.current) bodyB.current.color.lerp(infected ? C_BODY_DEAD : C_BODY, k);
        if (roofA.current) roofA.current.color.lerp(infected ? C_ROOF_DEAD : C_ROOF, k);
        if (roofB.current) roofB.current.color.lerp(infected ? C_ROOF_DEAD : C_ROOF, k);
        if (people.current) {
            const s = damp(people.current.scale.x, infected ? 0 : 1, dt, 4);
            people.current.scale.set(s, s, s);
        }
        if (graves.current) {
            const s = damp(graves.current.scale.x, infected ? 1 : 0, dt, 3.5);
            graves.current.scale.set(s, s, s);
        }
        if (haze.current) {
            haze.current.opacity = damp(haze.current.opacity, infected ? 0.5 : 0, dt, 3);
        }
    });

    return (
        <group position={[city.x, 0.31, city.z]}>
            {/* To små hus */}
            <group position={[-0.35, 0, 0]}>
                <mesh position={[0, 0.32, 0]} castShadow>
                    <boxGeometry args={[0.6, 0.64, 0.55]} />
                    <meshStandardMaterial ref={bodyA} color="#cf9d6b" roughness={0.85} />
                </mesh>
                <mesh position={[0, 0.82, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[0.5, 0.42, 4]} />
                    <meshStandardMaterial ref={roofA} color="#8a4a30" roughness={0.9} />
                </mesh>
            </group>
            <group position={[0.4, 0, 0.15]}>
                <mesh position={[0, 0.26, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.52, 0.46]} />
                    <meshStandardMaterial ref={bodyB} color="#cf9d6b" roughness={0.85} />
                </mesh>
                <mesh position={[0, 0.68, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[0.42, 0.36, 4]} />
                    <meshStandardMaterial ref={roofB} color="#8a4a30" roughness={0.9} />
                </mesh>
            </group>

            {/* Folk på beina (forsvinner når byen rammes) */}
            <group ref={people} position={[0, 0, -0.5]}>
                <Person x={-0.2} body="#3f5d8a" />
                <Person x={0.25} body="#7a4a6a" />
            </group>

            {/* Graver som reiser seg når byen rammes */}
            <group ref={graves} position={[0, 0, 0.6]} scale={[0, 0, 0]}>
                <Grave x={-0.25} />
                <Grave x={0.2} tilt={0.18} />
            </group>

            {/* Mørk pest-dis over byen */}
            <mesh position={[0, 1.05, 0]} scale={[1, 0.5, 1]}>
                <sphereGeometry args={[1.15, 14, 12]} />
                <meshStandardMaterial
                    ref={haze}
                    color="#6b1f2a"
                    emissive="#3a0f16"
                    emissiveIntensity={0.4}
                    transparent
                    opacity={0}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Bynavn (og år når byen er rammet) */}
            <Html position={[0, 1.9, 0]} center pointerEvents="none">
                <div className="px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[11px] font-bold whitespace-nowrap shadow">
                    {city.name}
                    {infected && <span className="text-rose-300 ml-1">{city.year}</span>}
                </div>
            </Html>
        </group>
    );
}

function Person({ x, body }: { x: number; body: string }) {
    return (
        <group position={[x, 0, 0]}>
            <mesh position={[0, 0.26, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.14, 0.42, 7]} />
                <meshStandardMaterial color={body} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.55, 0]} castShadow>
                <sphereGeometry args={[0.11, 10, 10]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.8} />
            </mesh>
        </group>
    );
}

function Grave({ x, tilt = -0.12 }: { x: number; tilt?: number }) {
    return (
        <group position={[x, 0, 0]} rotation={[0, 0, tilt]}>
            <mesh position={[0, 0.28, 0]} castShadow>
                <boxGeometry args={[0.1, 0.56, 0.08]} />
                <meshStandardMaterial color="#9aa0a6" roughness={1} />
            </mesh>
            <mesh position={[0, 0.38, 0]} castShadow>
                <boxGeometry args={[0.34, 0.1, 0.08]} />
                <meshStandardMaterial color="#9aa0a6" roughness={1} />
            </mesh>
        </group>
    );
}

// Den mørke pest-skyen som glir langs handelsruta mot den sist smittede byen.
function PlagueCloud({ target, active }: { target: [number, number]; active: boolean }) {
    const group = useRef<THREE.Group>(null);
    const glow = useRef<THREE.Mesh>(null);
    useFrame(({ clock }, dt) => {
        const g = group.current;
        if (!g) return;
        g.visible = active;
        if (!active) return;
        g.position.x = damp(g.position.x, target[0], dt, 1.6);
        g.position.z = damp(g.position.z, target[1], dt, 1.6);
        g.position.y = 1.3 + Math.sin(clock.getElapsedTime() * 1.6) * 0.12;
        g.rotation.y += dt * 0.6;
        if (glow.current) {
            const s = 1 + Math.sin(clock.getElapsedTime() * 2.2) * 0.08;
            glow.current.scale.setScalar(s);
        }
    });
    return (
        <group ref={group} position={[CITIES[0].x, 1.3, CITIES[0].z]}>
            <mesh>
                <sphereGeometry args={[0.42, 12, 12]} />
                <meshStandardMaterial
                    color="#2a1016"
                    emissive="#5a1622"
                    emissiveIntensity={0.6}
                    roughness={0.9}
                />
            </mesh>
            <mesh ref={glow}>
                <sphereGeometry args={[0.66, 12, 12]} />
                <meshBasicMaterial
                    color="#b91c1c"
                    transparent
                    opacity={0.28}
                    depthWrite={false}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    );
}

export default Pestrute3D;
