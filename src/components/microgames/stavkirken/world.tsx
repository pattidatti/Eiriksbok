import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { Particles } from '../kit';
import { seasonOf, type G } from './game';

// Verden rundt kirka - og tiden som går. Årstidene ruller, bygda vokser og
// forfaller gjennom århundrene, den nye kirka reises i 1868, og til slutt kommer
// turistene. Alt leser g.year / g.t hver frame; ingenting her styrer spillet.

type GRef = React.MutableRefObject<G>;

function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------------------
// Himmel, lys og refleksjoner
// ---------------------------------------------------------------------------

const C = (h: string) => new THREE.Color(h);
const SKY = { day: C('#8e9faa'), storm: C('#56626d'), dry: C('#c4b28a'), winter: C('#c3ccd2'), night: C('#1c2735'), dusk: C('#b98a74') };
const GROUND = { summer: C('#4f6e39'), autumn: C('#7a6b36'), winter: C('#dde4e6') };

export function Atmosphere({ gRef }: { gRef: GRef }) {
    const scene = useThree((s) => s.scene);
    const sun = useRef<THREE.DirectionalLight>(null);
    const hemi = useRef<THREE.HemisphereLight>(null);
    const flash = useRef<THREE.AmbientLight>(null);
    const col = useMemo(() => new THREE.Color(), []);
    useFrame(() => {
        const g = gRef.current;
        const { winter } = seasonOf(g);
        // Døgnet: en rolig bølge, aldri helt mørkt.
        const day = (g.t / 24) % 1;
        const night = smooth(0.55, 0.8, 0.5 - 0.5 * Math.cos(day * Math.PI * 2)) * 0.62;
        const dusk = Math.max(0, 1 - Math.abs(0.5 - 0.5 * Math.cos(day * Math.PI * 2) - 0.5) * 4) * 0.35;
        const e = g.event?.id;
        col.copy(winter ? SKY.winter : SKY.day);
        if (e === 'storm') col.lerp(SKY.storm, 0.7);
        if (e === 'tort') col.lerp(SKY.dry, 0.6);
        col.lerp(SKY.dusk, dusk).lerp(SKY.night, night);
        if (scene.background instanceof THREE.Color) scene.background.copy(col);
        if (scene.fog) (scene.fog as THREE.Fog).color.copy(col);
        if (sun.current) {
            sun.current.intensity = (e === 'storm' ? 0.35 : e === 'tort' ? 1.5 : 0.85) * (1 - night * 1.1);
            sun.current.color.set(dusk > 0.1 ? '#ffc58a' : '#fff4e4');
        }
        if (hemi.current) hemi.current.intensity = 0.55 * (1 - night * 0.6);
        if (flash.current) flash.current.intensity = g.flashT > 0 ? g.flashT * 7 : 0;
    });
    return (
        <>
            <directionalLight ref={sun} position={[-14, 16, 8]} intensity={0.85} castShadow shadow-mapSize={[1024, 1024]}>
                <orthographicCamera attach="shadow-camera" args={[-16, 16, 16, -16, 1, 60]} />
            </directionalLight>
            <hemisphereLight ref={hemi} args={['#dfe8ee', '#3d4a33', 0.55]} />
            <ambientLight ref={flash} color="#e8f0ff" intensity={0} />
            {/* Refleksjoner til blank tjære og våt bakke - lokalt, ingen nedlasting. */}
            <Environment resolution={64} frames={1}>
                <Lightformer form="rect" intensity={1.4} color="#e4ecf2" position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
                <Lightformer form="rect" intensity={0.8} color="#ffd9a8" position={[-8, 2, 4]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
                <Lightformer form="rect" intensity={0.5} color="#9fb4c4" position={[8, 2, -4]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
            </Environment>
        </>
    );
}

// ---------------------------------------------------------------------------
// Dalen: bakke, elv, fjell, trær, kirkegård
// ---------------------------------------------------------------------------

const WORLD = (() => {
    const r = rng(7);
    const mountains: { x: number; z: number; h: number; r: number }[] = [];
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + r() * 0.25;
        const d = 36 + r() * 10 + Math.abs(Math.sin(a)) * 6;
        mountains.push({ x: Math.cos(a) * d * 1.2, z: Math.sin(a) * d * 0.85, h: 18 + r() * 18, r: 10 + r() * 7 });
    }
    const pines: { x: number; z: number; s: number }[] = [];
    const birches: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 46; i++) {
        const a = r() * Math.PI * 2;
        const d = 11 + r() * 20;
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d * 0.9;
        if (Math.abs(z + 15) < 3) continue; // ikke i elva
        (r() < 0.55 ? pines : birches).push({ x, z, s: 0.8 + r() * 0.6 });
    }
    const crosses: { x: number; z: number; r: number }[] = [];
    for (let i = 0; i < 16; i++) {
        const a = r() * Math.PI * 2;
        if (Math.cos(a) < -0.85) continue; // holder stien fri
        const d = 5.4 + r() * 1.4;
        crosses.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r: (r() - 0.5) * 0.3 });
    }
    const puddles: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 9; i++) puddles.push({ x: -6 + r() * 14, z: -6 + r() * 12, s: 0.5 + r() * 0.9 });
    return { mountains, pines, birches, crosses, puddles };
})();

export function Valley({ gRef }: { gRef: GRef }) {
    const ground = useRef<THREE.MeshStandardMaterial>(null);
    const leaf = useRef<THREE.MeshStandardMaterial>(null);
    const pine = useRef<THREE.MeshStandardMaterial>(null);
    const caps = useRef<(THREE.Mesh | null)[]>([]);
    const puddle = useRef<THREE.MeshStandardMaterial>(null);
    const birchCrowns = useRef<THREE.Group>(null);
    const col = useMemo(() => new THREE.Color(), []);
    useFrame(() => {
        const g = gRef.current;
        const { s, winter, autumn } = seasonOf(g);
        if (ground.current) {
            col.copy(GROUND.summer);
            if (autumn) col.lerp(GROUND.autumn, smooth(0.18, 0.3, s));
            if (winter) col.copy(GROUND.winter);
            ground.current.color.lerp(col, 0.08);
            // Våt bakke er blankere.
            ground.current.roughness = winter ? 0.9 : 0.55 - g.wet * 0.2;
        }
        if (leaf.current) {
            const target = autumn ? '#c7862c' : winter ? '#8a7a66' : '#6c9a45';
            leaf.current.color.lerp(col.set(target), 0.06);
        }
        if (birchCrowns.current) {
            const k = winter ? 0.35 : 1;
            birchCrowns.current.children.forEach((c) => c.scale.lerp(new THREE.Vector3(k, k, k), 0.05));
        }
        if (pine.current) pine.current.color.lerp(col.set(winter ? '#c9d4d4' : '#2d4f36'), 0.05);
        const snow = winter ? 0.55 : 0.3;
        for (const c of caps.current) if (c) c.scale.y = THREE.MathUtils.lerp(c.scale.y, snow / 0.3, 0.05);
        if (puddle.current) puddle.current.color.lerp(col.set(winter ? '#e9f1f4' : '#3b5560'), 0.06);
    });
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.02, 0]}>
                <circleGeometry args={[90, 56]} />
                <meshStandardMaterial ref={ground} color="#4f6e39" roughness={0.5} envMapIntensity={0.6} />
            </mesh>
            {WORLD.puddles.map((p, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.005, p.z]}>
                    <circleGeometry args={[p.s, 20]} />
                    <meshStandardMaterial ref={i === 0 ? puddle : undefined} color="#3b5560" roughness={0.04} metalness={0.3} />
                </mesh>
            ))}
            {/* grusstien fra porten til døra i vest */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.01, 0]}>
                <planeGeometry args={[16, 1.4]} />
                <meshStandardMaterial color="#8a8172" roughness={1} />
            </mesh>
            {/* elva */}
            <mesh rotation={[-Math.PI / 2, 0, 0.1]} position={[2, 0.02, -15]}>
                <planeGeometry args={[130, 3.6]} />
                <meshStandardMaterial color="#5f8595" roughness={0.08} metalness={0.2} />
            </mesh>
            {WORLD.mountains.map((m, i) => (
                <group key={i} position={[m.x, 0, m.z]}>
                    <mesh position={[0, m.h / 2, 0]} castShadow>
                        <coneGeometry args={[m.r, m.h, 7]} />
                        <meshStandardMaterial color="#3b4a42" roughness={1} flatShading />
                    </mesh>
                    <mesh
                        ref={(el) => {
                            caps.current[i] = el;
                        }}
                        position={[0, m.h, 0]}
                    >
                        {/* snøhette: spissen av fjellet, strekkes nedover om vinteren */}
                        <coneGeometry args={[m.r * 0.3, m.h * 0.3, 7, 1, false]} />
                        <meshStandardMaterial color="#eef3f4" roughness={1} flatShading />
                    </mesh>
                </group>
            ))}
            {WORLD.pines.map((t, i) => (
                <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
                    <mesh position={[0, 0.5, 0]}>
                        <cylinderGeometry args={[0.12, 0.16, 1, 5]} />
                        <meshStandardMaterial color="#4a3526" />
                    </mesh>
                    {[0, 1, 2].map((k) => (
                        <mesh key={k} position={[0, 1.3 + k * 0.8, 0]} castShadow>
                            <coneGeometry args={[1.1 - k * 0.28, 1.4, 7]} />
                            <meshStandardMaterial ref={i === 0 && k === 0 ? pine : undefined} color="#2d4f36" roughness={1} flatShading />
                        </mesh>
                    ))}
                </group>
            ))}
            <group ref={birchCrowns}>
                {WORLD.birches.map((t, i) => (
                    <group key={i} position={[t.x, 1.9 * t.s, t.z]}>
                        <mesh castShadow>
                            <icosahedronGeometry args={[0.95 * t.s, 0]} />
                            <meshStandardMaterial ref={i === 0 ? leaf : undefined} color="#6c9a45" roughness={1} flatShading />
                        </mesh>
                    </group>
                ))}
            </group>
            {WORLD.birches.map((t, i) => (
                <mesh key={i} position={[t.x, 0.9 * t.s, t.z]}>
                    <cylinderGeometry args={[0.08, 0.11, 1.8 * t.s, 5]} />
                    <meshStandardMaterial color="#e8e4da" />
                </mesh>
            ))}
            {/* kirkegården: steingjerde, port og kors */}
            {Array.from({ length: 48 }, (_, i) => {
                const a = (i / 48) * Math.PI * 2;
                if (Math.cos(a) < -0.985) return null; // åpning til porten i vest
                return (
                    <mesh key={i} position={[Math.cos(a) * 7.5, 0.28, Math.sin(a) * 7.5]} rotation={[0, -a, 0]} castShadow>
                        <boxGeometry args={[0.6, 0.56, 1.05]} />
                        <meshStandardMaterial color="#7d7c74" roughness={1} flatShading />
                    </mesh>
                );
            })}
            <group position={[-7.5, 0, 0]}>
                {[-0.8, 0.8].map((z) => (
                    <mesh key={z} position={[0, 1, z]}>
                        <boxGeometry args={[0.2, 2, 0.2]} />
                        <meshStandardMaterial color="#2c2019" />
                    </mesh>
                ))}
                <mesh position={[0, 2.15, 0]} rotation={[Math.PI / 4, 0, 0]}>
                    <boxGeometry args={[0.6, 1.3, 1.3]} />
                    <meshStandardMaterial color="#1c1510" />
                </mesh>
            </group>
            {WORLD.crosses.map((c, i) => (
                <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.r, 0]}>
                    <mesh position={[0, 0.45, 0]}>
                        <boxGeometry args={[0.1, 0.9, 0.1]} />
                        <meshStandardMaterial color="#3a2f26" />
                    </mesh>
                    <mesh position={[0, 0.65, 0]}>
                        <boxGeometry args={[0.45, 0.09, 0.09]} />
                        <meshStandardMaterial color="#3a2f26" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Bygda gjennom århundrene
// ---------------------------------------------------------------------------

interface Site {
    x: number;
    z: number;
    rot: number;
    built: number;
    lost?: number; // forlatt (svartedauden)
    rebuilt?: number;
    style: 'tun' | 'rodt' | 'hvitt';
}

const SITES: Site[] = [
    { x: -19, z: 9, rot: 0.3, built: 1180, style: 'tun' },
    { x: -23, z: 3, rot: -0.2, built: 1200, lost: 1350, rebuilt: 1620, style: 'tun' },
    { x: 17, z: 10, rot: 0.8, built: 1190, style: 'tun' },
    { x: 21, z: 4, rot: 0.1, built: 1230, lost: 1352, rebuilt: 1660, style: 'tun' },
    { x: -15, z: 15, rot: 1.2, built: 1260, lost: 1351, style: 'tun' },
    { x: 12, z: 16, rot: -0.5, built: 1290, lost: 1353, rebuilt: 1700, style: 'tun' },
    { x: -26, z: -6, rot: 0.6, built: 1320, lost: 1350, style: 'tun' },
    { x: 25, z: -5, rot: -0.9, built: 1560, style: 'tun' },
    { x: -21, z: 14, rot: 0.2, built: 1760, style: 'rodt' },
    { x: 27, z: 12, rot: -0.3, built: 1790, style: 'rodt' },
    { x: -28, z: 9, rot: 0.9, built: 1880, style: 'hvitt' },
    { x: 19, z: 17, rot: 0.4, built: 1905, style: 'hvitt' },
    { x: 8, z: 21, rot: -0.1, built: 1950, style: 'hvitt' },
];

function House({ site, gRef }: { site: Site; gRef: GRef }) {
    const group = useRef<THREE.Group>(null);
    const roof = useRef<THREE.Group>(null);
    const wall = useRef<THREE.MeshStandardMaterial>(null);
    const roofMat = useRef<THREE.MeshStandardMaterial>(null);
    const smoke = useRef<THREE.Group>(null);
    useFrame(() => {
        const g = gRef.current;
        const y = g.year;
        const grp = group.current;
        if (!grp) return;
        const standing = y >= site.built && !(site.lost && y >= site.lost + 60 && !(site.rebuilt && y >= site.rebuilt));
        const abandoned = !!site.lost && y >= site.lost && !(site.rebuilt && y >= site.rebuilt);
        const target = standing ? 1 : 0;
        grp.scale.y = THREE.MathUtils.lerp(grp.scale.y, target, 0.06);
        grp.visible = grp.scale.y > 0.02;
        // Et forlatt tun gråner og taket siger sammen.
        if (roof.current) roof.current.rotation.z = THREE.MathUtils.lerp(roof.current.rotation.z, abandoned ? 0.25 : 0, 0.03);
        if (wall.current) wall.current.color.lerp(new THREE.Color(abandoned ? '#77746c' : site.style === 'rodt' ? '#8e2b21' : site.style === 'hvitt' ? '#ece8df' : '#5a3f2a'), 0.05);
        if (roofMat.current) roofMat.current.color.lerp(new THREE.Color(abandoned ? '#6b6a55' : site.style === 'hvitt' ? '#3a3f45' : '#56733a'), 0.05);
        if (smoke.current) {
            const { winter } = seasonOf(g);
            smoke.current.visible = standing && !abandoned && winter;
            smoke.current.children.forEach((c, i) => {
                const t = (g.t * 0.6 + i / 3) % 1;
                c.position.set(0.9 + t * 0.6, 3.1 + t * 2.2, 0);
                c.scale.setScalar(0.25 + t * 0.6);
            });
        }
    });
    const big = site.style !== 'tun';
    return (
        <group position={[site.x, 0, site.z]} rotation={[0, site.rot, 0]}>
            <group ref={group} scale={[1, 0.001, 1]}>
                <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
                    <boxGeometry args={[big ? 4.2 : 3.4, 2.2, big ? 2.8 : 2.4]} />
                    <meshStandardMaterial ref={wall} color="#5a3f2a" roughness={0.9} />
                </mesh>
                <group ref={roof} position={[0, 2.2, 0]}>
                    {[-1, 1].map((s) => (
                        <mesh key={s} position={[0, 0.45, s * 0.72]} rotation={[s * 0.62, 0, 0]} castShadow>
                            <boxGeometry args={[big ? 4.5 : 3.7, 0.22, big ? 1.95 : 1.75]} />
                            <meshStandardMaterial ref={s === 1 ? roofMat : undefined} color="#56733a" roughness={1} />
                        </mesh>
                    ))}
                </group>
                {/* vinduet lyser om kvelden */}
                <mesh position={[0, 1.2, (big ? 1.41 : 1.21)]}>
                    <planeGeometry args={[0.55, 0.5]} />
                    <meshStandardMaterial color="#ffcf7a" emissive="#ffb347" emissiveIntensity={1.6} toneMapped={false} />
                </mesh>
            </group>
            <group ref={smoke}>
                {[0, 1, 2].map((i) => (
                    <mesh key={i}>
                        <sphereGeometry args={[1, 8, 6]} />
                        <meshStandardMaterial color="#b9bcbc" transparent opacity={0.55} depthWrite={false} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

/** Den nye kirka: bygget i 1868, like ved. Kirkeloven i ett bilde. */
function NewChurch({ gRef }: { gRef: GRef }) {
    const body = useRef<THREE.Group>(null);
    const scaffold = useRef<THREE.Group>(null);
    useFrame(() => {
        const y = gRef.current.year;
        const k = THREE.MathUtils.clamp((y - 1862) / 6, 0, 1);
        if (body.current) {
            body.current.scale.y = THREE.MathUtils.lerp(body.current.scale.y, Math.max(0.001, k), 0.1);
            body.current.visible = k > 0;
        }
        if (scaffold.current) scaffold.current.visible = y > 1860 && y < 1869;
    });
    return (
        <group position={[16, 0, -7]} rotation={[0, 0.25, 0]}>
            <group ref={body} scale={[1, 0.001, 1]}>
                <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[8, 4.4, 4.6]} />
                    <meshStandardMaterial color="#f1eee6" roughness={0.8} />
                </mesh>
                {[-1, 1].map((s) => (
                    <mesh key={s} position={[0, 5.05, s * 1.25]} rotation={[s * 0.7, 0, 0]} castShadow>
                        <boxGeometry args={[8.3, 0.2, 3.3]} />
                        <meshStandardMaterial color="#3d4248" roughness={0.8} />
                    </mesh>
                ))}
                <mesh position={[-4.6, 3.6, 0]} castShadow>
                    <boxGeometry args={[1.8, 7.2, 1.8]} />
                    <meshStandardMaterial color="#f1eee6" roughness={0.8} />
                </mesh>
                <mesh position={[-4.6, 8.6, 0]} castShadow>
                    <coneGeometry args={[1.3, 3.2, 4]} />
                    <meshStandardMaterial color="#3d4248" roughness={0.8} />
                </mesh>
                {[-2, 0, 2].map((x) => (
                    <mesh key={x} position={[x, 2.6, 2.31]}>
                        <planeGeometry args={[0.8, 1.6]} />
                        <meshStandardMaterial color="#ffd89a" emissive="#ffb347" emissiveIntensity={0.9} toneMapped={false} />
                    </mesh>
                ))}
            </group>
            <group ref={scaffold}>
                {Array.from({ length: 10 }, (_, i) => (
                    <mesh key={i} position={[-4 + (i % 5) * 2, 3, i < 5 ? -2.6 : 2.6]}>
                        <cylinderGeometry args={[0.06, 0.06, 6, 5]} />
                        <meshStandardMaterial color="#8a6a44" />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

/** Vei og turister: 1900-tallet og i dag. */
function Modern({ gRef }: { gRef: GRef }) {
    const road = useRef<THREE.Mesh>(null);
    const bus = useRef<THREE.Group>(null);
    const people = useRef<THREE.Group>(null);
    useFrame(() => {
        const g = gRef.current;
        if (road.current) road.current.visible = g.year > 1900;
        if (bus.current) {
            bus.current.visible = g.year > 1965;
            bus.current.position.x = -40 + ((g.t * 4) % 80);
        }
        if (people.current) {
            people.current.visible = g.year > 1955;
            people.current.children.forEach((c, i) => {
                const a = g.t * 0.12 + (i / 6) * Math.PI * 2;
                c.position.set(Math.cos(a) * 9.2, 0, Math.sin(a) * 9.2);
                c.rotation.y = -a;
            });
        }
    });
    const coats = ['#f2c233', '#d8412f', '#2f7fd8', '#48a860', '#f28c2a', '#9b59b6'];
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            <mesh ref={road} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 13]} visible={false}>
                <planeGeometry args={[140, 2.6]} />
                <meshStandardMaterial color="#4b4d50" roughness={0.6} />
            </mesh>
            <group ref={bus} position={[0, 0, 13]} visible={false}>
                <mesh position={[0, 1.1, 0]} castShadow>
                    <boxGeometry args={[5, 1.9, 1.9]} />
                    <meshStandardMaterial color="#c9362c" />
                </mesh>
                <mesh position={[0, 1.45, 0.96]}>
                    <planeGeometry args={[4.4, 0.6]} />
                    <meshStandardMaterial color="#cfe6f2" roughness={0.1} />
                </mesh>
            </group>
            <group ref={people} visible={false}>
                {coats.map((c, i) => (
                    <group key={i}>
                        <mesh position={[0, 0.55, 0]}>
                            <capsuleGeometry args={[0.2, 0.6, 3, 8]} />
                            <meshStandardMaterial color={c} />
                        </mesh>
                        <mesh position={[0, 1.15, 0]}>
                            <sphereGeometry args={[0.16, 10, 8]} />
                            <meshStandardMaterial color="#e0b58c" />
                        </mesh>
                        {/* paraply - det regner jo */}
                        <mesh position={[0, 1.55, 0]}>
                            <coneGeometry args={[0.55, 0.3, 8]} />
                            <meshStandardMaterial color={coats[(i + 2) % coats.length]} side={THREE.DoubleSide} />
                        </mesh>
                    </group>
                ))}
            </group>
        </group>
    );
}

export function Village({ gRef }: { gRef: GRef }) {
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {SITES.map((s, i) => (
                <House key={i} site={s} gRef={gRef} />
            ))}
            <NewChurch gRef={gRef} />
            <Modern gRef={gRef} />
        </group>
    );
}

// ---------------------------------------------------------------------------
// Vær: regn, snø, storm og lyn
// ---------------------------------------------------------------------------

export function Weather({ gRef }: { gRef: GRef }) {
    const [state, setState] = useState({ winter: false, storm: false, dry: false });
    const bolt = useRef<THREE.Group>(null);
    const boltPts = useMemo(() => {
        const r = rng(3);
        const pts: THREE.Vector3[] = [];
        let x = 3;
        let z = -2;
        for (let y = 30; y > 8; y -= 2.5) {
            pts.push(new THREE.Vector3(x, y, z));
            x += (r() - 0.5) * 3;
            z += (r() - 0.5) * 3;
        }
        pts.push(new THREE.Vector3(0.3, 7.8, 0));
        return pts;
    }, []);
    useFrame(() => {
        const g = gRef.current;
        const { winter } = seasonOf(g);
        const storm = g.event?.id === 'storm';
        const dry = g.event?.id === 'tort';
        if (winter !== state.winter || storm !== state.storm || dry !== state.dry) setState({ winter, storm, dry });
        if (bolt.current) bolt.current.visible = g.flashT > 0.35;
    });
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            {!state.dry && !state.winter && <Particles preset="rain" area={[40, 40]} center={[0, 0, 0]} height={18} seed={2} />}
            {state.storm && <Particles preset="rain" area={[34, 34]} center={[-4, 0, 0]} height={18} seed={9} />}
            {state.winter && <Particles preset="snow" area={[36, 36]} center={[0, 0, 0]} height={16} seed={4} />}
            <group ref={bolt} visible={false}>
                {boltPts.slice(0, -1).map((p, i) => {
                    const q = boltPts[i + 1];
                    const mid = p.clone().add(q).multiplyScalar(0.5);
                    const len = p.distanceTo(q);
                    const dir = q.clone().sub(p).normalize();
                    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
                    return (
                        <mesh key={i} position={mid} quaternion={quat}>
                            <cylinderGeometry args={[0.07, 0.07, len, 4]} />
                            <meshBasicMaterial color="#f4f8ff" toneMapped={false} />
                        </mesh>
                    );
                })}
            </group>
        </group>
    );
}
