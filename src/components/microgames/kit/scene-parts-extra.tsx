import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSeascape } from './seascapeContext';

// Utvidet bibliotek av lavpoly-scene-deler. Supplerer scene-parts.tsx med
// uttrykksfulle figurer og flere miljøbyggesteiner, så mikrospill slutter å se
// like ut på tvers av emner. Alle er billige, kaster/mottar skygge, og tar
// farger som props. Sett dem sammen til en hel verden.

// Deterministisk pseudo-random (samme mønster som InstancedField/Particles).
function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// ── Person ───────────────────────────────────────────────────────────────────
// Uttrykksfull figur med armer, bein, positur og valgfritt hodeplagg. Den gamle
// `Figure` (kropp + hode) er beholdt for bakoverkompatibilitet; bruk `Person` når
// folk skal leve og se forskjellige ut på tvers av epoker.

export type Pose = 'idle' | 'walk' | 'raise' | 'sit';
export type HeadGear = 'none' | 'cap' | 'helmet' | 'crown' | 'hood';

function Hat({ kind, color, skin }: { kind: HeadGear; color: string; skin: string }) {
    switch (kind) {
        case 'cap':
            return (
                <mesh position={[0, 0.94, 0]} castShadow>
                    <cylinderGeometry args={[0.16, 0.16, 0.08, 10]} />
                    <meshStandardMaterial color={color} roughness={0.85} />
                </mesh>
            );
        case 'helmet':
            return (
                <mesh position={[0, 0.86, 0]} castShadow>
                    <sphereGeometry args={[0.16, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.4} />
                </mesh>
            );
        case 'crown':
            return (
                <group position={[0, 0.95, 0]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.15, 0.15, 0.07, 8, 1, true]} />
                        <meshStandardMaterial color="#e3b23c" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
                    </mesh>
                    {[0, 1, 2, 3].map((i) => {
                        const a = (i / 4) * Math.PI * 2;
                        return (
                            <mesh key={i} position={[Math.cos(a) * 0.14, 0.06, Math.sin(a) * 0.14]} castShadow>
                                <coneGeometry args={[0.03, 0.08, 5]} />
                                <meshStandardMaterial color="#e3b23c" metalness={0.6} roughness={0.3} />
                            </mesh>
                        );
                    })}
                </group>
            );
        case 'hood':
            return (
                <mesh position={[0, 0.88, -0.02]} castShadow>
                    <coneGeometry args={[0.2, 0.34, 10]} />
                    <meshStandardMaterial color={color} roughness={0.9} />
                </mesh>
            );
        case 'none':
        default:
            void skin;
            return null;
    }
}

export function Person({
    position = [0, 0, 0],
    rotation,
    scale = 1,
    body = '#5a4632',
    skin = '#e0b98c',
    legs = '#39312a',
    pose = 'idle',
    hat = 'none',
    hatColor = '#7a1f1f',
}: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    body?: string;
    skin?: string;
    legs?: string;
    pose?: Pose;
    hat?: HeadGear;
    hatColor?: string;
}) {
    // Positur-vinkler (radianer) per kroppsdel.
    const legSwing = pose === 'walk' ? 0.5 : 0;
    const armSwing = pose === 'walk' ? 0.6 : pose === 'idle' ? 0.12 : 0;
    const sit = pose === 'sit';
    const raise = pose === 'raise';
    const yLift = sit ? -0.16 : 0;

    return (
        <group position={position} rotation={rotation} scale={scale}>
            <group position={[0, yLift, 0]}>
                {/* Bein */}
                <mesh position={[-0.08, 0.16, 0]} rotation={[sit ? -1.3 : legSwing, 0, 0]} castShadow>
                    <boxGeometry args={[0.1, 0.34, 0.1]} />
                    <meshStandardMaterial color={legs} roughness={0.9} />
                </mesh>
                <mesh position={[0.08, 0.16, 0]} rotation={[sit ? -1.3 : -legSwing, 0, 0]} castShadow>
                    <boxGeometry args={[0.1, 0.34, 0.1]} />
                    <meshStandardMaterial color={legs} roughness={0.9} />
                </mesh>
                {/* Overkropp */}
                <mesh position={[0, 0.55, 0]} castShadow>
                    <boxGeometry args={[0.28, 0.4, 0.18]} />
                    <meshStandardMaterial color={body} roughness={0.88} />
                </mesh>
                {/* Armer */}
                <mesh position={[-0.19, 0.56, 0]} rotation={[raise ? -2.6 : armSwing, 0, -0.12]} castShadow>
                    <boxGeometry args={[0.08, 0.34, 0.08]} />
                    <meshStandardMaterial color={body} roughness={0.88} />
                </mesh>
                <mesh position={[0.19, 0.56, 0]} rotation={[raise ? 0.2 : -armSwing, 0, 0.12]} castShadow>
                    <boxGeometry args={[0.08, 0.34, 0.08]} />
                    <meshStandardMaterial color={body} roughness={0.88} />
                </mesh>
                {/* Hode */}
                <mesh position={[0, 0.84, 0]} castShadow>
                    <sphereGeometry args={[0.13, 12, 12]} />
                    <meshStandardMaterial color={skin} roughness={0.8} />
                </mesh>
                <Hat kind={hat} color={hatColor} skin={skin} />
            </group>
        </group>
    );
}

// ── Murvegg (med valgfrie tinder) ────────────────────────────────────────────
export function Wall({
    position = [0, 0, 0],
    rotation,
    length = 4,
    height = 1.6,
    thickness = 0.4,
    color = '#9a9088',
    crenellations = false,
}: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    length?: number;
    height?: number;
    thickness?: number;
    color?: string;
    crenellations?: boolean;
}) {
    const merlons = crenellations ? Math.max(2, Math.floor(length / 0.7)) : 0;
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[length, height, thickness]} />
                <meshStandardMaterial color={color} roughness={0.95} />
            </mesh>
            {Array.from({ length: merlons }).map((_, i) => {
                const x = -length / 2 + 0.35 + (i / Math.max(1, merlons - 1)) * (length - 0.7);
                return (
                    <mesh key={i} position={[x, height + 0.15, 0]} castShadow>
                        <boxGeometry args={[0.3, 0.3, thickness]} />
                        <meshStandardMaterial color={color} roughness={0.95} />
                    </mesh>
                );
            })}
        </group>
    );
}

// ── Tårn (rund skaft + kjegletak) ────────────────────────────────────────────
export function Tower({
    position = [0, 0, 0],
    radius = 0.7,
    height = 3,
    color = '#9a9088',
    roof = '#5c3326',
}: {
    position?: [number, number, number];
    radius?: number;
    height?: number;
    color?: string;
    roof?: string;
}) {
    return (
        <group position={position}>
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[radius, radius * 1.08, height, 10]} />
                <meshStandardMaterial color={color} roughness={0.95} />
            </mesh>
            <mesh position={[0, height + radius * 0.7, 0]} castShadow>
                <coneGeometry args={[radius * 1.15, radius * 1.5, 10]} />
                <meshStandardMaterial color={roof} roughness={0.9} />
            </mesh>
        </group>
    );
}

// ── Klassisk søyle (base + riflet skaft + kapitél) ───────────────────────────
export function Column({
    position = [0, 0, 0],
    height = 2.4,
    radius = 0.22,
    color = '#e7e2d6',
}: {
    position?: [number, number, number];
    height?: number;
    radius?: number;
    color?: string;
}) {
    return (
        <group position={position}>
            <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
                <boxGeometry args={[radius * 2.6, 0.16, radius * 2.6]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            <mesh position={[0, height / 2, 0]} castShadow>
                <cylinderGeometry args={[radius, radius * 1.1, height, 16]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            <mesh position={[0, height + 0.06, 0]} castShadow>
                <boxGeometry args={[radius * 2.8, 0.16, radius * 2.8]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
        </group>
    );
}

// ── Bue/portal (to pilarer + buet topp) ──────────────────────────────────────
export function Arch({
    position = [0, 0, 0],
    rotation,
    width = 2.4,
    height = 2.6,
    color = '#ccbfa6',
}: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    width?: number;
    height?: number;
    color?: string;
}) {
    const pillar = 0.35;
    return (
        <group position={position} rotation={rotation}>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[(s * (width - pillar)) / 2, height / 2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[pillar, height, pillar]} />
                    <meshStandardMaterial color={color} roughness={0.9} />
                </mesh>
            ))}
            <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <torusGeometry args={[width / 2 - pillar / 2, pillar / 2, 8, 16, Math.PI]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
        </group>
    );
}

// ── Bro (dekke + buer/støtter) ───────────────────────────────────────────────
export function Bridge({
    position = [0, 0, 0],
    rotation,
    length = 6,
    width = 1.6,
    color = '#9c8769',
}: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    length?: number;
    width?: number;
    color?: string;
}) {
    const arches = Math.max(2, Math.round(length / 2.2));
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
                <boxGeometry args={[length, 0.22, width]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {Array.from({ length: arches }).map((_, i) => {
                const x = -length / 2 + (length / arches) * (i + 0.5);
                return (
                    <mesh key={i} position={[x, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                        <torusGeometry args={[0.5, 0.12, 6, 12, Math.PI]} />
                        <meshStandardMaterial color={color} roughness={0.9} />
                    </mesh>
                );
            })}
        </group>
    );
}

// ── Kjerre/vogn (kasse + to hjul) ────────────────────────────────────────────
export function Cart({
    position = [0, 0, 0],
    rotation,
    color = '#7a5230',
    wheel = '#3a2a18',
}: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    color?: string;
    wheel?: string;
}) {
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.3, 0.5, 0.8]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {[-0.5, 0.5].map((x) => (
                <mesh key={x} position={[x, 0.26, 0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.26, 0.26, 0.1, 12]} />
                    <meshStandardMaterial color={wheel} roughness={0.85} />
                </mesh>
            ))}
            {[-0.5, 0.5].map((x) => (
                <mesh key={`b${x}`} position={[x, 0.26, -0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.26, 0.26, 0.1, 12]} />
                    <meshStandardMaterial color={wheel} roughness={0.85} />
                </mesh>
            ))}
        </group>
    );
}

// ── Båt (enkelt skrog) ───────────────────────────────────────────────────────
// ── Båt ──────────────────────────────────────────────────────────────────────
// KONVENSJON: baugen peker mot **+Z** i båtens lokale ramme. Firkantseilet spenner
// på tvers (X) og vender forover/bakover (normal ±Z) - altså mot seilretningen,
// slik et råseil skal, med råa (bommen) langs X over seilet. For å snu båten, bruk
// `heading` (radianer om Y, tolkes som "hvor peker baugen") eller den rå
// `rotation`-tuppelen - da vender seilet automatisk riktig vei.
//
// Vann: legg båten inni `<Seascape>` og plasser den ved `waterY`. I DEV varsler
// båten hvis den havner utenfor vannet (på land) eller langt fra vannlinja.
export function Boat({
    position = [0, 0, 0],
    rotation,
    heading,
    color = '#6b4a2c',
    sail,
}: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    /** Retning baugen peker (radianer om Y). Ignoreres hvis `rotation` er satt. */
    heading?: number;
    color?: string;
    sail?: string;
}) {
    const group = useRef<THREE.Group>(null);
    const sea = useSeascape();
    const checked = useRef(false);
    // DEV-vakthund: kjør én sjekk på første frame (etter at world-matrisene er
    // oppdatert), varsle ved båt-på-land eller flyter/synker. Gratis i prod.
    useFrame(() => {
        if (!import.meta.env.DEV || checked.current || !group.current || !sea.bounds) return;
        checked.current = true;
        const p = group.current.getWorldPosition(new THREE.Vector3());
        const { x, z } = sea.bounds;
        if (p.x < x[0] || p.x > x[1] || p.z < z[0] || p.z > z[1]) {
            console.warn(
                `[kit/Boat] ligger utenfor Seascape-vannet (x=${p.x.toFixed(1)}, z=${p.z.toFixed(
                    1
                )}) - båt på land? Vann strekker seg x[${x[0]}..${x[1]}] z[${z[0]}..${z[1]}].`
            );
        } else if (Math.abs(p.y - sea.waterY) > 1.5) {
            console.warn(
                `[kit/Boat] y=${p.y.toFixed(1)} er langt fra vannlinja ${sea.waterY.toFixed(
                    2
                )} - flyter/synker? Plasser båten ved Seascape.waterY.`
            );
        }
    });
    const rot = rotation ?? (heading !== undefined ? [0, heading, 0] : undefined);
    return (
        <group ref={group} position={position} rotation={rot as [number, number, number] | undefined}>
            <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.5, 0.32, 2.4, 8, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
            {sail && (
                <group position={[0, 0, 0]}>
                    <mesh position={[0, 0.9, 0]} castShadow>
                        <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
                        <meshStandardMaterial color="#4a3320" roughness={0.9} />
                    </mesh>
                    {/* Rå (horisontal bom) på tvers - langs X, som seilet spenner. */}
                    <mesh position={[0, 1.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.03, 0.03, 1.15, 6]} />
                        <meshStandardMaterial color="#4a3320" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 1, 0]} castShadow>
                        <planeGeometry args={[1, 1.1]} />
                        <meshStandardMaterial color={sail} roughness={0.85} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

// ── Dyr (firbeint: hest/okse/sau) ────────────────────────────────────────────
export type AnimalKind = 'horse' | 'ox' | 'sheep';

export function Animal({
    position = [0, 0, 0],
    rotation,
    kind = 'horse',
    color,
}: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    kind?: AnimalKind;
    color?: string;
}) {
    const col = color ?? (kind === 'horse' ? '#7a4a28' : kind === 'ox' ? '#5a4636' : '#e8e4da');
    const bodyLen = kind === 'sheep' ? 0.8 : 1.1;
    const legH = kind === 'sheep' ? 0.3 : 0.45;
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, legH + 0.22, 0]} castShadow receiveShadow>
                <boxGeometry args={[bodyLen, 0.42, 0.5]} />
                <meshStandardMaterial color={col} roughness={0.92} flatShading />
            </mesh>
            {/* Hode + hals */}
            <mesh position={[bodyLen / 2 + 0.05, legH + 0.45, 0]} rotation={[0, 0, -0.5]} castShadow>
                <boxGeometry args={[0.34, 0.26, 0.26]} />
                <meshStandardMaterial color={col} roughness={0.92} flatShading />
            </mesh>
            {kind === 'ox' &&
                [-1, 1].map((s) => (
                    <mesh key={s} position={[bodyLen / 2 + 0.2, legH + 0.6, s * 0.1]} rotation={[0, 0, 0.6]} castShadow>
                        <coneGeometry args={[0.03, 0.18, 5]} />
                        <meshStandardMaterial color="#d8cbb0" roughness={0.7} />
                    </mesh>
                ))}
            {/* Bein */}
            {[
                [bodyLen / 2 - 0.12, 0.18],
                [bodyLen / 2 - 0.12, -0.18],
                [-bodyLen / 2 + 0.12, 0.18],
                [-bodyLen / 2 + 0.12, -0.18],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, legH / 2, z]} castShadow>
                    <boxGeometry args={[0.1, legH, 0.1]} />
                    <meshStandardMaterial color={col} roughness={0.92} />
                </mesh>
            ))}
        </group>
    );
}

// ── Telt ─────────────────────────────────────────────────────────────────────
export function Tent({
    position = [0, 0, 0],
    color = '#b8a06a',
    scale = 1,
}: {
    position?: [number, number, number];
    color?: string;
    scale?: number;
}) {
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
                <coneGeometry args={[1, 1.4, 4]} />
                <meshStandardMaterial color={color} roughness={0.92} flatShading />
            </mesh>
        </group>
    );
}

// ── Fakkel/stolpe-lys (emissiv flamme + lite punktlys) ───────────────────────
export function Torch({
    position = [0, 0, 0],
    height = 1.6,
    lit = true,
    color = '#ff8c3a',
}: {
    position?: [number, number, number];
    height?: number;
    lit?: boolean;
    color?: string;
}) {
    return (
        <group position={position}>
            <mesh position={[0, height / 2, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.07, height, 6]} />
                <meshStandardMaterial color="#5c3f26" roughness={0.9} />
            </mesh>
            {lit && (
                <>
                    <mesh position={[0, height + 0.12, 0]}>
                        <sphereGeometry args={[0.13, 8, 8]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} />
                    </mesh>
                    <pointLight color={color} intensity={1.6} distance={5} position={[0, height + 0.12, 0]} />
                </>
            )}
        </group>
    );
}

// ── Markedsbod (stolper + bord + stripet markise) ────────────────────────────
export function MarketStall({
    position = [0, 0, 0],
    rotation,
    post = '#6b4a2c',
    awning = '#b5402f',
    awningAlt = '#efe7d2',
}: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    post?: string;
    awning?: string;
    awningAlt?: string;
}) {
    return (
        <group position={position} rotation={rotation}>
            {[
                [-0.8, 0.5],
                [0.8, 0.5],
                [-0.8, -0.5],
                [0.8, -0.5],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.6, z]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 1.2, 6]} />
                    <meshStandardMaterial color={post} roughness={0.9} />
                </mesh>
            ))}
            <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.7, 0.1, 1.05]} />
                <meshStandardMaterial color={post} roughness={0.9} />
            </mesh>
            {/* Stripet markise */}
            {Array.from({ length: 5 }).map((_, i) => (
                <mesh
                    key={i}
                    position={[-0.68 + i * 0.34, 1.25, 0]}
                    rotation={[-0.25, 0, 0]}
                    castShadow
                >
                    <boxGeometry args={[0.34, 0.04, 1.2]} />
                    <meshStandardMaterial color={i % 2 ? awningAlt : awning} roughness={0.85} />
                </mesh>
            ))}
        </group>
    );
}

// ── Ås/fjell (lavpoly haug) ──────────────────────────────────────────────────
export function Hill({
    position = [0, 0, 0],
    radius = 4,
    height = 2.4,
    color = '#6f8a4d',
    seed = 1,
}: {
    position?: [number, number, number];
    radius?: number;
    height?: number;
    color?: string;
    seed?: number;
}) {
    const rough = rng(seed)() * 0.3 + 0.85;
    return (
        <mesh position={position} scale={[1, (height / radius) * rough, 1]} castShadow receiveShadow>
            <icosahedronGeometry args={[radius, 1]} />
            <meshStandardMaterial color={color} roughness={1} flatShading />
        </mesh>
    );
}
