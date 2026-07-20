import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SeascapeContext, type SeascapeInfo } from './seascapeContext';

// Gjenbrukbare lavpoly-deler for raskt å bygge en levende mikrospill-scene.
// Alle er billige (få polygoner), kaster/mottar skygge, og tar farger som props
// så de kan tilpasses hvert emne. Sett dem sammen til en hel verden.
//
// Flere deler (Person, Wall, Tower, Column, Arch, Bridge, Cart, Boat, Animal,
// Tent, Torch, MarketStall, Hill) ligger i scene-parts-extra.tsx.

// Deterministisk pseudo-random for valgfri seed-variasjon (samme mønster som
// InstancedField): så en rad hus/trær ikke er identiske, uten Math.random.
function variate(seed: number | undefined, spread: number): number {
    if (seed === undefined) return 1;
    let s = (seed * 2654435761) >>> 0;
    s = (s * 1664525 + 1013904223) >>> 0;
    return 1 + (s / 4294967296 - 0.5) * 2 * spread;
}

// --- Bakkeplan ---
export function GroundPlane({
    size = 44,
    depth = 34,
    color = '#7aa84f',
}: {
    size?: number;
    depth?: number;
    color?: string;
}) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[size, depth]} />
            <meshStandardMaterial color={color} roughness={1} />
        </mesh>
    );
}

// --- Vannflate med svak skimring ---
export function WaterPlane({
    position = [0, 0.02, 0],
    size = [16, 30],
    color = '#3d7fa6',
}: {
    position?: [number, number, number];
    size?: [number, number];
    color?: string;
}) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        if (mat.current) {
            mat.current.emissiveIntensity =
                0.12 + Math.sin(clock.getElapsedTime() * 1.2) * 0.05;
        }
    });
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
            <planeGeometry args={size} />
            <meshStandardMaterial
                ref={mat}
                color={color}
                roughness={0.3}
                metalness={0.15}
                emissive="#1e4d6b"
                emissiveIntensity={0.14}
            />
        </mesh>
    );
}

// --- Seascape: vannflate + felles vannlinje-kontekst ---
// Foretrukket måte å legge vann i et mikrospill: i stedet for en løs `WaterPlane`
// pluss hånd-tunede båt-Y-verdier, wrap sjø-scenen i `<Seascape>` og plasser
// flytende deler inni. Da har spillet ÉN sannhet for vannlinja (`waterY`) å
// plassere båter mot, og `Boat` kan i DEV varsle hvis noe havner på land eller
// flyter/synker. `waterY` er world-Y (default = position[1] + 0.02, samme lille
// skimmer-offset som `WaterPlane`).
export function Seascape({
    position = [0, 0, 0],
    size = [30, 30],
    waterY,
    color = '#3d7fa6',
    children,
}: {
    position?: [number, number, number];
    size?: [number, number];
    /** Vannlinje i world-Y. Utelates → position[1] + 0.02. Plasser båter her. */
    waterY?: number;
    color?: string;
    children?: React.ReactNode;
}) {
    const [w, d] = size;
    const [px, py, pz] = position;
    const surfaceY = waterY ?? py + 0.02;
    const info = useMemo<SeascapeInfo>(
        () => ({
            waterY: surfaceY,
            bounds: {
                x: [px - w / 2, px + w / 2],
                z: [pz - d / 2, pz + d / 2],
            },
        }),
        [surfaceY, px, pz, w, d]
    );
    return (
        <SeascapeContext.Provider value={info}>
            <WaterPlane position={[px, surfaceY, pz]} size={size} color={color} />
            {children}
        </SeascapeContext.Provider>
    );
}

// --- Hus med saltak (boks + flattrykt 4-sidig kjegle) ---
export function Building({
    position = [0, 0, 0],
    body = '#a8412f',
    roof = '#5c3326',
    w = 1.6,
    h = 1.1,
    d = 1.3,
    seed,
}: {
    position?: [number, number, number];
    body?: string;
    roof?: string;
    w?: number;
    h?: number;
    d?: number;
    // Valgfritt frø: varierer høyde/bredde litt så en rad hus ikke er identiske.
    // Udefinert = ingen variasjon (bakoverkompatibelt).
    seed?: number;
}) {
    const vw = w * variate(seed, 0.18);
    const vh = h * variate(seed === undefined ? undefined : seed + 1, 0.22);
    const vd = d * variate(seed === undefined ? undefined : seed + 2, 0.18);
    return (
        <group position={position}>
            <mesh position={[0, vh / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[vw, vh, vd]} />
                <meshStandardMaterial color={body} roughness={0.85} />
            </mesh>
            <mesh position={[0, vh + 0.32, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[vw * 0.82, 0.64, 4]} />
                <meshStandardMaterial color={roof} roughness={0.9} />
            </mesh>
        </group>
    );
}

// --- Tre (stamme + løvkjegle) ---
export function Tree({
    position = [0, 0, 0],
    leaf = '#3f6b39',
    seed,
}: {
    position?: [number, number, number];
    leaf?: string;
    // Valgfritt frø: varierer høyde/bredde litt så en skog ikke er identiske kjegler.
    seed?: number;
}) {
    const vh = variate(seed, 0.25);
    const vr = variate(seed === undefined ? undefined : seed + 1, 0.2);
    return (
        <group position={position} scale={[vr, vh, vr]}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.14, 0.8, 6]} />
                <meshStandardMaterial color="#5c3f26" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.1, 0]} castShadow>
                <coneGeometry args={[0.6, 1.4, 8]} />
                <meshStandardMaterial color={leaf} roughness={0.9} />
            </mesh>
        </group>
    );
}

// --- Liten figur (kropp + hode), valgfri farge. Sett rotation utenfra. ---
export function Figure({
    position = [0, 0, 0],
    body = '#5a4632',
    skin = '#e0b98c',
    children,
}: {
    position?: [number, number, number];
    body?: string;
    skin?: string;
    children?: React.ReactNode; // f.eks. et redskap festet til figuren
}) {
    return (
        <group position={position}>
            <mesh position={[0, 0.32, 0]} castShadow>
                <cylinderGeometry args={[0.13, 0.18, 0.5, 7]} />
                <meshStandardMaterial color={body} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.66, 0]} castShadow>
                <sphereGeometry args={[0.13, 10, 10]} />
                <meshStandardMaterial color={skin} roughness={0.8} />
            </mesh>
            {children}
        </group>
    );
}

// --- Stein (lavpoly, flatshaded) ---
export function Rock({
    position = [0, 0, 0],
    color = '#8a8f96',
    scale = 1,
}: {
    position?: [number, number, number];
    color?: string;
    scale?: number;
}) {
    return (
        <mesh position={position} scale={scale} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color={color} roughness={1} flatShading />
        </mesh>
    );
}

// --- Bål/flamme som flakker. Lyser opp scenen når `lit`. ---
export function Fire({
    position = [0, 0, 0],
    scale = 1,
    lit = true,
}: {
    position?: [number, number, number];
    scale?: number;
    lit?: boolean;
}) {
    const flame = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!flame.current) return;
        const t = clock.getElapsedTime();
        flame.current.scale.y = lit ? (0.85 + Math.sin(t * 13) * 0.15) * scale : 0;
        flame.current.visible = lit;
    });
    return (
        <group position={position}>
            <pointLight
                color="#ff8c3a"
                intensity={lit ? 2.2 : 0}
                distance={7}
                position={[0, 0.7, 0]}
            />
            <group ref={flame} scale={scale}>
                <mesh position={[0, 0.5, 0]}>
                    <coneGeometry args={[0.3, 1, 8]} />
                    <meshStandardMaterial color="#ff7a18" emissive="#ff5a00" emissiveIntensity={1.2} />
                </mesh>
                <mesh position={[0, 0.36, 0]}>
                    <coneGeometry args={[0.17, 0.7, 8]} />
                    <meshStandardMaterial color="#ffd23a" emissive="#ffb000" emissiveIntensity={1.5} />
                </mesh>
            </group>
        </group>
    );
}

// --- Banner/vimpel på stang som vaier lett ---
export function Banner({
    position = [0, 0, 0],
    color = '#a23b2e',
    height = 2,
}: {
    position?: [number, number, number];
    color?: string;
    height?: number;
}) {
    const cloth = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (cloth.current) cloth.current.rotation.y = Math.sin(clock.getElapsedTime() * 2) * 0.14;
    });
    return (
        <group position={position}>
            <mesh position={[0, height / 2, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, height, 6]} />
                <meshStandardMaterial color="#5c3f26" roughness={0.9} />
            </mesh>
            <mesh ref={cloth} position={[0.36, height - 0.45, 0]} castShadow>
                <planeGeometry args={[0.72, 0.9]} />
                <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

// --- Tannhjul (maskin-spill). Sett `spin` (rad/sek) for å rotere. ---
export function Gear({
    position = [0, 0, 0],
    radius = 0.6,
    teeth = 10,
    color = '#7a7f86',
    spin = 0,
}: {
    position?: [number, number, number];
    radius?: number;
    teeth?: number;
    color?: string;
    spin?: number;
}) {
    const ref = useRef<THREE.Group>(null);
    const teethArr = useMemo(() => Array.from({ length: teeth }, (_, i) => i), [teeth]);
    useFrame((_, dt) => {
        if (ref.current) ref.current.rotation.z += spin * dt;
    });
    return (
        <group position={position} ref={ref}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[radius, radius, 0.18, Math.max(16, teeth * 2)]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
            </mesh>
            {teethArr.map((i) => {
                const a = (i / teeth) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]}
                        rotation={[0, 0, -a]}
                        castShadow
                    >
                        <boxGeometry args={[0.18, 0.18, 0.18]} />
                        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
                    </mesh>
                );
            })}
        </group>
    );
}

// --- Røyk/damp: puffer som stiger og toner ut. Bra for fabrikker, ildsteder. ---
export function Smoke({
    origin = [0, 0, 0],
    show = true,
    count = 5,
    color = '#6b6b6b',
}: {
    origin?: [number, number, number];
    show?: boolean;
    count?: number;
    color?: string;
}) {
    const puffs = useRef<THREE.Mesh[]>([]);
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        for (let i = 0; i < count; i++) {
            const m = puffs.current[i];
            if (!m) continue;
            const cycle = (t * 0.5 + i / count) % 1;
            const y = origin[1] + cycle * 2.2;
            const spread = cycle * 0.6;
            m.position.set(
                origin[0] + Math.sin(t + i) * spread,
                y,
                origin[2] + Math.cos(t * 0.7 + i) * spread * 0.5
            );
            m.scale.setScalar(0.18 + cycle * 0.45);
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.opacity = show ? (1 - cycle) * 0.6 : 0;
            m.visible = show;
        }
    });
    return (
        <group>
            {Array.from({ length: count }).map((_, i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        if (el) puffs.current[i] = el;
                    }}
                >
                    <sphereGeometry args={[1, 8, 8]} />
                    <meshStandardMaterial color={color} transparent opacity={0} roughness={1} />
                </mesh>
            ))}
        </group>
    );
}
