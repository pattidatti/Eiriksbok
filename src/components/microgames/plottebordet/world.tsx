import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BASES, STATIONS, LONDON, TABLE_W, TABLE_D, HALF_W, HALF_D, type XZ } from './geo';
import { findRaid, raidActive, airborne, type G, type Mode, type Fx } from './game';
import { mapTexture, sectorTexture, labelTexture, floorTexture } from './textures';

// 3D-scenen for Plottebordet: kontrollrommet, kartbordet, brikkene og de små
// flyformasjonene som svever over plottene. All spilltilstand leses fra gRef i
// useFrame - ingenting her setter React-state per bilde.

export const RAID_RED = '#b3322a';
export const SQ_BLUE = '#27466f';
const RAID_ALT = 1.75;
const FLOOR_Y = -2.3;

type GRef = React.MutableRefObject<G>;

export interface DragState {
    active: boolean;
    sq: number;
    p: XZ;
    start: XZ;
    moved: boolean;
    sticky: boolean;
    hoverRaid: number;
}

const tmpObj = new THREE.Object3D();

/** Legger en stiplet linje fra `from` til `to` på bordet, eller skjuler den. */
function aimLine(line: THREE.Line, from: XZ | null, to: XZ | null, y: number, color?: string) {
    line.visible = !!from && !!to;
    if (!from || !to) return;
    const pos = line.geometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(0, from[0], y, from[1]);
    pos.setXYZ(1, to[0], y, to[1]);
    pos.needsUpdate = true;
    line.geometry.computeBoundingSphere();
    line.computeLineDistances();
    if (color) (line.material as THREE.LineDashedMaterial).color.set(color);
}
const labelCache = new Map<string, THREE.CanvasTexture>();
function cachedLabel(text: string, bg: string, fg: string) {
    const k = `${text}|${bg}|${fg}`;
    let t = labelCache.get(k);
    if (!t) {
        t = labelTexture(text, bg, fg);
        labelCache.set(k, t);
    }
    return t;
}

// ---------------------------------------------------------------------------
// Rommet og bordet
// ---------------------------------------------------------------------------

export function Room() {
    const floor = useMemo(() => floorTexture(), []);
    return (
        <group>
            <ambientLight intensity={0.35} color="#ffe9cc" />
            <hemisphereLight args={['#fff1d6', '#3b2f25', 0.55]} />
            <directionalLight
                position={[5, 16, 7]}
                intensity={1.35}
                color="#fff4e2"
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-left={-14}
                shadow-camera-right={14}
                shadow-camera-top={11}
                shadow-camera-bottom={-11}
                shadow-bias={-0.0004}
            />
            {/* Varme lamper over bordet */}
            {[-6.5, 0, 6.5].map((x) => (
                <pointLight key={x} position={[x, 6.5, -1]} intensity={22} distance={22} decay={2} color="#ffd29a" />
            ))}
            {/* Gulvet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} receiveShadow userData={{ sceneAuditIgnore: true }}>
                <planeGeometry args={[70, 50]} />
                <meshStandardMaterial map={floor} roughness={0.85} />
            </mesh>
            {/* Bordet: tykk eikeplate og messinglist */}
            <mesh position={[0, -0.28, 0]} receiveShadow castShadow>
                <boxGeometry args={[TABLE_W + 0.9, 0.55, TABLE_D + 0.9]} />
                <meshStandardMaterial color="#4a3222" roughness={0.6} />
            </mesh>
            <mesh position={[0, (FLOOR_Y - 0.55) / 2, 0]} userData={{ sceneAuditIgnore: true }}>
                <boxGeometry args={[TABLE_W - 1, -FLOOR_Y - 0.55, TABLE_D - 1]} />
                <meshStandardMaterial color="#2c1e15" roughness={0.9} />
            </mesh>
            {[
                [0, -HALF_D - 0.42, TABLE_W + 0.95, 0.1],
                [0, HALF_D + 0.42, TABLE_W + 0.95, 0.1],
            ].map(([x, z, w, d], i) => (
                <mesh key={i} position={[x, 0.02, z]}>
                    <boxGeometry args={[w, 0.07, d]} />
                    <meshStandardMaterial color="#c9a45a" metalness={0.8} roughness={0.3} />
                </mesh>
            ))}
            {[-HALF_W - 0.42, HALF_W + 0.42].map((x, i) => (
                <mesh key={`s${i}`} position={[x, 0.02, 0]}>
                    <boxGeometry args={[0.1, 0.07, TABLE_D + 0.95]} />
                    <meshStandardMaterial color="#c9a45a" metalness={0.8} roughness={0.3} />
                </mesh>
            ))}
        </group>
    );
}

/** Plotterne rundt bordet med de lange rivene sine. */
export function Plotters({ gRef }: { gRef: GRef }) {
    const spots = useMemo(
        () =>
            [
                { p: [-7.5, -HALF_D - 1.25] as XZ, rot: 0, hair: '#4a3222' },
                { p: [-1.5, -HALF_D - 1.25] as XZ, rot: 0, hair: '#b88a4a' },
                { p: [4.5, -HALF_D - 1.25] as XZ, rot: 0, hair: '#2a1e18' },
                { p: [-HALF_W - 1.25, -3] as XZ, rot: Math.PI / 2, hair: '#7a4a2a' },
                { p: [HALF_W + 1.25, -2.4] as XZ, rot: -Math.PI / 2, hair: '#3a2a20' },
                { p: [HALF_W + 1.25, 3.6] as XZ, rot: -Math.PI / 2, hair: '#b88a4a' },
            ].map((s, i) => ({ ...s, i })),
        []
    );
    const arms = useRef<(THREE.Group | null)[]>([]);
    useFrame(() => {
        const t = gRef.current.t;
        arms.current.forEach((a, i) => {
            if (!a) return;
            a.rotation.x = 0.16 + Math.sin(t * 0.9 + i * 1.7) * 0.05;
            a.rotation.y = Math.sin(t * 0.6 + i) * 0.12;
        });
    });
    return (
        <group>
            {spots.map((s) => (
                <group key={s.i} position={[s.p[0], FLOOR_Y, s.p[1]]} rotation={[0, s.rot, 0]} userData={{ sceneAuditIgnore: true }}>
                    {/* skjørt og jakke i WAAF-blått */}
                    <mesh position={[0, 0.9, 0]} castShadow>
                        <cylinderGeometry args={[0.36, 0.44, 1.8, 10]} />
                        <meshStandardMaterial color="#3e4b5e" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 2.35, 0]} castShadow>
                        <cylinderGeometry args={[0.4, 0.38, 1.15, 10]} />
                        <meshStandardMaterial color="#58677d" roughness={0.75} />
                    </mesh>
                    <mesh position={[0, 3.12, 0]} castShadow>
                        <sphereGeometry args={[0.3, 14, 12]} />
                        <meshStandardMaterial color="#e3bf98" roughness={0.7} />
                    </mesh>
                    <mesh position={[0, 3.2, -0.05]}>
                        <sphereGeometry args={[0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
                        <meshStandardMaterial color={s.hair} roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 3.05, -0.3]}>
                        <sphereGeometry args={[0.15, 10, 8]} />
                        <meshStandardMaterial color={s.hair} roughness={0.9} />
                    </mesh>
                    {/* hodetelefoner */}
                    <mesh position={[0, 3.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <torusGeometry args={[0.33, 0.035, 6, 16, Math.PI]} />
                        <meshStandardMaterial color="#1c1c1c" />
                    </mesh>
                    {/* armen med riva */}
                    <group
                        ref={(el) => {
                            arms.current[s.i] = el;
                        }}
                        position={[0.34, 2.75, 0.1]}
                    >
                        <mesh position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.09, 0.09, 0.8, 8]} />
                            <meshStandardMaterial color="#58677d" />
                        </mesh>
                        <mesh position={[0, 0, 2.1]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.035, 0.035, 3.2, 6]} />
                            <meshStandardMaterial color="#8a6a44" />
                        </mesh>
                        <mesh position={[0, 0, 3.7]}>
                            <boxGeometry args={[0.6, 0.08, 0.08]} />
                            <meshStandardMaterial color="#6a4e30" />
                        </mesh>
                    </group>
                </group>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Kartet og radarsektorene
// ---------------------------------------------------------------------------

export function MapTop({ gRef }: { gRef: GRef }) {
    const map = useMemo(() => mapTexture(), []);
    const sectors = useMemo(() => STATIONS.map((_, i) => sectorTexture(i)), []);
    const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
    const green = useMemo(() => new THREE.Color('#5fd08a'), []);
    const red = useMemo(() => new THREE.Color('#e0433a'), []);
    useFrame(() => {
        const g = gRef.current;
        mats.current.forEach((m, i) => {
            if (!m) return;
            const down = g.stationDown[i] > 0;
            m.color.copy(down ? red : green);
            m.opacity = down ? 0.6 + Math.sin(g.t * 9) * 0.25 : 0.62;
        });
    });
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
                <planeGeometry args={[TABLE_W, TABLE_D]} />
                <meshStandardMaterial map={map} roughness={0.92} />
            </mesh>
            {sectors.map((t, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006 + i * 0.001, 0]}>
                    <planeGeometry args={[TABLE_W, TABLE_D]} />
                    <meshBasicMaterial
                        ref={(m) => {
                            mats.current[i] = m;
                        }}
                        map={t}
                        transparent
                        depthWrite={false}
                        opacity={0.4}
                        color="#5fd08a"
                    />
                </mesh>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Radarmaster, flyplasser og London
// ---------------------------------------------------------------------------

export function Stations({ gRef }: { gRef: GRef }) {
    const groups = useRef<(THREE.Group | null)[]>([]);
    const lamps = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
    useFrame(() => {
        const g = gRef.current;
        groups.current.forEach((gr, i) => {
            if (!gr) return;
            const down = g.stationDown[i] > 0;
            gr.rotation.z = THREE.MathUtils.lerp(gr.rotation.z, down ? 0.35 : 0, 0.1);
            const l = lamps.current[i];
            if (l) l.color.setRGB(down ? 0.4 : 3.2, down ? 0.1 : 0.5 + Math.max(0, Math.sin(g.t * 4 + i)) * 0.6, down ? 0.1 : 0.4);
        });
    });
    return (
        <group>
            {STATIONS.map((s, i) => (
                <group
                    key={s.id}
                    position={[s.pos[0], 0, s.pos[1]]}
                    ref={(el) => {
                        groups.current[i] = el;
                    }}
                >
                    {[-0.16, 0, 0.16].map((dx) => (
                        <mesh key={dx} position={[dx, 0.75, 0]} castShadow>
                            <boxGeometry args={[0.04, 1.5, 0.04]} />
                            <meshStandardMaterial color="#3a3f44" metalness={0.5} roughness={0.5} />
                        </mesh>
                    ))}
                    {[0.5, 1.0, 1.4].map((y) => (
                        <mesh key={y} position={[0, y, 0]}>
                            <boxGeometry args={[0.42, 0.025, 0.025]} />
                            <meshStandardMaterial color="#3a3f44" />
                        </mesh>
                    ))}
                    <mesh position={[0, 1.55, 0]}>
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshBasicMaterial
                            ref={(m) => {
                                lamps.current[i] = m;
                            }}
                            color="#ff6040"
                            toneMapped={false}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

export function Bases({ gRef }: { gRef: GRef }) {
    const rings = useRef<(THREE.Mesh | null)[]>([]);
    const scorch = useRef<(THREE.Mesh | null)[]>([]);
    const fill = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(() => {
        const g = gRef.current;
        g.squadrons.forEach((q, i) => {
            const r = rings.current[i];
            if (r) {
                const m = r.material as THREE.MeshBasicMaterial;
                const ready = q.state === 'klar' && g.crater[i] <= 0;
                r.visible = ready || q.state === 'tanker';
                const pulse = 1 + Math.sin(g.t * 5 + i) * 0.08;
                r.scale.setScalar(ready ? pulse : 1);
                m.color.set(ready ? '#8cf0a4' : '#f2b441');
                m.opacity = ready ? 0.9 : 0.35;
            }
            const f = fill.current[i];
            if (f) {
                f.visible = q.state === 'tanker';
                const k = q.state === 'tanker' ? 1 - q.refuel / 7 : 0;
                f.scale.set(Math.max(0.01, k), 1, 1);
            }
            const s = scorch.current[i];
            if (s) {
                s.visible = g.crater[i] > 0;
                (s.material as THREE.MeshStandardMaterial).opacity = Math.min(0.85, g.crater[i] / 3);
            }
        });
    });
    return (
        <group>
            {BASES.map((b, i) => (
                <group key={b.id} position={[b.pos[0], 0, b.pos[1]]}>
                    <mesh position={[-0.52, 0.09, -0.12]} castShadow>
                        <boxGeometry args={[0.28, 0.18, 0.4]} />
                        <meshStandardMaterial color="#6f7462" roughness={0.8} />
                    </mesh>
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, 0.012, 0]}
                        ref={(el) => {
                            rings.current[i] = el;
                        }}
                    >
                        <ringGeometry args={[0.5, 0.6, 40]} />
                        <meshBasicMaterial color="#8cf0a4" transparent opacity={0.9} toneMapped={false} depthWrite={false} />
                    </mesh>
                    {/* tankemåler under flyplassen */}
                    <mesh
                        position={[0, 0.02, 0.5]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        ref={(el) => {
                            fill.current[i] = el;
                        }}
                    >
                        <planeGeometry args={[0.9, 0.08]} />
                        <meshBasicMaterial color="#f2b441" toneMapped={false} />
                    </mesh>
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, 0.01, 0]}
                        ref={(el) => {
                            scorch.current[i] = el;
                        }}
                        visible={false}
                    >
                        <circleGeometry args={[0.46, 18]} />
                        <meshStandardMaterial color="#2a2019" transparent opacity={0.8} depthWrite={false} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

export function London({ gRef }: { gRef: GRef }) {
    const fires = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => {
                const a = i * 2.4;
                const d = 0.2 + (i % 3) * 0.22;
                return [LONDON[0] + Math.cos(a) * d, LONDON[1] + Math.sin(a) * d * 0.7] as XZ;
            }),
        []
    );
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const blocks = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => {
                const a = i * 1.9;
                const d = 0.15 + ((i * 7) % 5) * 0.12;
                return { p: [LONDON[0] + Math.cos(a) * d, LONDON[1] + Math.sin(a) * d * 0.7] as XZ, h: 0.1 + ((i * 3) % 4) * 0.05 };
            }),
        []
    );
    useFrame(() => {
        const g = gRef.current;
        refs.current.forEach((m, i) => {
            if (!m) return;
            m.visible = i < g.londonHits;
            m.scale.setScalar(0.8 + Math.sin(g.t * 11 + i * 3) * 0.25);
        });
    });
    return (
        <group>
            {blocks.map((b, i) => (
                <mesh key={i} position={[b.p[0], b.h / 2, b.p[1]]} castShadow>
                    <boxGeometry args={[0.13, b.h, 0.13]} />
                    <meshStandardMaterial color="#8c8378" roughness={0.9} />
                </mesh>
            ))}
            {fires.map((p, i) => (
                <mesh
                    key={i}
                    position={[p[0], 0.12, p[1]]}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                    visible={false}
                >
                    <sphereGeometry args={[0.09, 8, 6]} />
                    <meshBasicMaterial color={[3.2, 1.3, 0.3]} toneMapped={false} />
                </mesh>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Flyformasjoner
// ---------------------------------------------------------------------------

const BOMBER_SLOTS: XZ[] = [
    [0, 0],
    [-0.24, -0.2],
    [0.24, -0.2],
    [-0.48, -0.4],
    [0.48, -0.4],
    [-0.72, -0.6],
    [0.72, -0.6],
];
const FIGHTER_SLOTS: XZ[] = [
    [0, 0],
    [-0.2, -0.16],
    [0.2, -0.16],
    [0.4, -0.32],
];

function Bomber() {
    return (
        <group>
            <mesh castShadow>
                <boxGeometry args={[0.055, 0.055, 0.32]} />
                <meshStandardMaterial color="#2f3236" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.02]} castShadow>
                <boxGeometry args={[0.42, 0.014, 0.08]} />
                <meshStandardMaterial color="#3a3e43" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.01, -0.14]}>
                <boxGeometry args={[0.14, 0.012, 0.05]} />
                <meshStandardMaterial color="#3a3e43" />
            </mesh>
            {[-0.1, 0.1].map((x) => (
                <mesh key={x} position={[x, -0.01, 0.06]}>
                    <boxGeometry args={[0.035, 0.035, 0.1]} />
                    <meshStandardMaterial color="#26282b" />
                </mesh>
            ))}
        </group>
    );
}

function Fighter() {
    return (
        <group>
            <mesh castShadow>
                <boxGeometry args={[0.04, 0.04, 0.22]} />
                <meshStandardMaterial color="#5d6647" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.015]} castShadow>
                <boxGeometry args={[0.28, 0.012, 0.07]} />
                <meshStandardMaterial color="#6b7352" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.012, -0.095]}>
                <boxGeometry args={[0.1, 0.01, 0.035]} />
                <meshStandardMaterial color="#6b7352" />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Raidene
// ---------------------------------------------------------------------------

const RAID_POOL = 16;

export function Raids({ gRef, dragRef }: { gRef: GRef; dragRef: React.MutableRefObject<DragState> }) {
    const groups = useRef<(THREE.Group | null)[]>([]);
    const forms = useRef<(THREE.Group | null)[]>([]);
    const planes = useRef<(THREE.Group | null)[][]>(Array.from({ length: RAID_POOL }, () => []));
    const labels = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
    const blocks = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const stands = useRef<(THREE.Mesh | null)[]>([]);
    const hovers = useRef<(THREE.Mesh | null)[]>([]);
    const shown = useRef<string[]>([]);
    useFrame(() => {
        const g = gRef.current;
        const list = g.raids.filter((r) => r.fade > 0.01);
        for (let k = 0; k < RAID_POOL; k++) {
            const gr = groups.current[k];
            if (!gr) continue;
            const r = list[k];
            if (!r) {
                gr.visible = false;
                continue;
            }
            gr.visible = true;
            gr.position.set(r.pos[0], 0, r.pos[1]);
            const f = forms.current[k];
            const inbound = r.state === 'inn';
            if (f) {
                f.rotation.y = r.heading;
                f.position.y = RAID_ALT + Math.sin(g.t * 2 + r.id) * 0.05;
                const n = Math.max(1, Math.min(7, Math.ceil(r.size / 2.6)));
                planes.current[k].forEach((p, j) => {
                    if (!p) return;
                    p.visible = j < n;
                    p.position.y = Math.sin(g.t * 3 + j * 1.3 + r.id) * 0.03;
                    p.rotation.z = Math.sin(g.t * 2.2 + j) * 0.08;
                });
                f.scale.setScalar(0.4 + r.fade * 0.6);
            }
            const st = stands.current[k];
            if (st) st.visible = inbound;
            const b = blocks.current[k];
            if (b) {
                b.opacity = r.fade * (inbound ? 1 : 0.18);
                b.color.set(inbound ? RAID_RED : '#8a6a64');
            }
            const txt = inbound ? `${Math.max(1, Math.round(r.size))}+` : '';
            const lm = labels.current[k];
            if (lm && shown.current[k] !== txt) {
                shown.current[k] = txt;
                lm.map = txt ? cachedLabel(txt, '#f4ecd8', '#7a1d16') : null;
                lm.visible = !!txt;
                lm.needsUpdate = true;
            }
            if (lm) lm.opacity = r.fade;
            const hv = hovers.current[k];
            if (hv) {
                const d = dragRef.current;
                hv.visible = d.active && d.hoverRaid === r.id;
                hv.scale.setScalar(1 + Math.sin(g.t * 10) * 0.08);
            }
        }
    });
    return (
        <group>
            {Array.from({ length: RAID_POOL }, (_, k) => (
                <group
                    key={k}
                    ref={(el) => {
                        groups.current[k] = el;
                    }}
                    visible={false}
                >
                    {/* plottbrikka */}
                    <mesh position={[0, 0.1, 0]} castShadow>
                        <boxGeometry args={[0.62, 0.2, 0.42]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                blocks.current[k] = m;
                            }}
                            color={RAID_RED}
                            transparent
                            roughness={0.55}
                        />
                    </mesh>
                    <mesh position={[0, 0.205, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[0.54, 0.3]} />
                        <meshBasicMaterial
                            ref={(m) => {
                                labels.current[k] = m;
                            }}
                            transparent
                        />
                    </mesh>
                    {/* stangen opp til formasjonen */}
                    <mesh
                        position={[0, RAID_ALT / 2, 0]}
                        ref={(el) => {
                            stands.current[k] = el;
                        }}
                    >
                        <cylinderGeometry args={[0.012, 0.012, RAID_ALT, 4]} />
                        <meshBasicMaterial color="#7a1d16" transparent opacity={0.5} />
                    </mesh>
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, 0.015, 0]}
                        ref={(el) => {
                            hovers.current[k] = el;
                        }}
                        visible={false}
                    >
                        <ringGeometry args={[0.55, 0.72, 32]} />
                        <meshBasicMaterial color={[2.5, 2.2, 0.8]} toneMapped={false} transparent opacity={0.9} depthWrite={false} />
                    </mesh>
                    <group
                        ref={(el) => {
                            forms.current[k] = el;
                        }}
                    >
                        {BOMBER_SLOTS.map((s, j) => (
                            <group
                                key={j}
                                position={[s[0], 0, s[1]]}
                                ref={(el) => {
                                    planes.current[k][j] = el;
                                }}
                            >
                                <Bomber />
                            </group>
                        ))}
                        {/* retningspil under formasjonen */}
                        <mesh position={[0, -0.02, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
                            <coneGeometry args={[0.1, 0.24, 3]} />
                            <meshBasicMaterial color={[2.2, 0.35, 0.25]} toneMapped={false} />
                        </mesh>
                    </group>
                </group>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Skvadronene
// ---------------------------------------------------------------------------

export function Squadrons({
    gRef,
    modeRef,
    onGrab,
}: {
    gRef: GRef;
    modeRef: React.MutableRefObject<Mode>;
    onGrab: (i: number, e: ThreeEvent<PointerEvent>) => void;
}) {
    const blocks = useRef<(THREE.Group | null)[]>([]);
    const forms = useRef<(THREE.Group | null)[]>([]);
    const planes = useRef<(THREE.Group | null)[][]>(BASES.map(() => []));
    const stands = useRef<(THREE.Mesh | null)[]>([]);
    const [lineObjs] = useState(() =>
        BASES.map(() => {
            const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
            const mat = new THREE.LineDashedMaterial({ color: '#2f6fd6', dashSize: 0.22, gapSize: 0.14, transparent: true, opacity: 0.95 });
            const l = new THREE.Line(geo, mat);
            l.computeLineDistances();
            return l;
        })
    );
    useFrame(() => {
        const g = gRef.current;
        g.squadrons.forEach((q, i) => {
            const b = blocks.current[i];
            if (b) {
                b.position.set(q.pos[0], 0, q.pos[1]);
                b.rotation.y = airborne(q) ? q.heading : 0;
            }
            const f = forms.current[i];
            const up = airborne(q);
            if (f) {
                f.visible = up || q.alt > 0.05;
                f.position.set(q.pos[0], 0.2 + q.alt * (RAID_ALT - 0.2), q.pos[1]);
                f.rotation.y = q.heading;
                const n = Math.max(1, Math.min(4, Math.ceil(q.planes / 3)));
                planes.current[i].forEach((p, j) => {
                    if (!p) return;
                    p.visible = j < n;
                    const bank = q.state === 'kamp' ? Math.sin(g.t * 6 + j * 2) * 0.7 : Math.sin(g.t * 2 + j) * 0.1;
                    p.rotation.z = bank;
                    p.rotation.x = q.alt < 0.95 && up ? -0.35 : 0; // nesen opp mens de klatrer
                    p.position.y = q.state === 'kamp' ? Math.sin(g.t * 5 + j * 1.9) * 0.12 : 0;
                });
            }
            const st = stands.current[i];
            if (st) {
                const h = 0.2 + q.alt * (RAID_ALT - 0.2);
                st.visible = up;
                st.scale.set(1, h, 1);
                st.position.set(q.pos[0], h / 2, q.pos[1]);
            }
            // kurslinja til målet
            const line = lineObjs[i];
            let to: XZ | null = null;
            if (q.state === 'lufta' && q.order?.kind === 'raid') {
                const r = findRaid(g, q.order.id);
                if (raidActive(r)) to = r.pos;
            } else if (q.state === 'lufta' && q.order?.kind === 'punkt') to = q.order.p;
            else if (q.state === 'hjem') to = BASES[i].pos;
            aimLine(line, modeRef.current !== 'menu' ? q.pos : null, to, 0.03, q.state === 'hjem' ? '#6a7a8c' : '#2f6fd6');
        });
    });
    return (
        <group>
            {lineObjs.map((l, i) => (
                <primitive key={`l${i}`} object={l} />
            ))}
            {BASES.map((b, i) => (
                <group key={b.id}>
                    <group
                        ref={(el) => {
                            blocks.current[i] = el;
                        }}
                    >
                        <mesh position={[0, 0.11, 0]} castShadow>
                            <boxGeometry args={[0.5, 0.22, 0.5]} />
                            <meshStandardMaterial color={SQ_BLUE} roughness={0.5} />
                        </mesh>
                        {/* RAF-merket på toppen */}
                        {(
                            [
                                [0.2, '#1f3a8a'],
                                [0.13, '#f4efe4'],
                                [0.065, '#c0392b'],
                            ] as const
                        ).map(([r, c], j) => (
                            <mesh key={j} position={[0, 0.222 + j * 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                                <circleGeometry args={[r, 24]} />
                                <meshStandardMaterial color={c} roughness={0.5} />
                            </mesh>
                        ))}
                        <mesh position={[0, 0.11, 0.252]}>
                            <planeGeometry args={[0.44, 0.2]} />
                            <meshBasicMaterial map={cachedLabel(b.squadron, SQ_BLUE, '#f4efe4')} />
                        </mesh>
                        {/* Stor, usynlig gripeflate */}
                        <mesh
                            position={[0, 0.4, 0]}
                            onPointerDown={(e) => onGrab(i, e)}
                            onPointerOver={() => {
                                document.body.style.cursor = 'grab';
                            }}
                            onPointerOut={() => {
                                document.body.style.cursor = '';
                            }}
                        >
                            <boxGeometry args={[1.25, 0.9, 1.25]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                    </group>
                    <mesh
                        ref={(el) => {
                            stands.current[i] = el;
                        }}
                    >
                        <cylinderGeometry args={[0.012, 0.012, 1, 4]} />
                        <meshBasicMaterial color="#1f3a8a" transparent opacity={0.45} />
                    </mesh>
                    <group
                        ref={(el) => {
                            forms.current[i] = el;
                        }}
                        visible={false}
                    >
                        {FIGHTER_SLOTS.map((s, j) => (
                            <group
                                key={j}
                                position={[s[0], 0, s[1]]}
                                ref={(el) => {
                                    planes.current[i][j] = el;
                                }}
                            >
                                <Fighter />
                            </group>
                        ))}
                    </group>
                </group>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Draget, veiledningen og effektene
// ---------------------------------------------------------------------------

export function DragView({ gRef, dragRef, hintRef }: { gRef: GRef; dragRef: React.MutableRefObject<DragState>; hintRef: React.MutableRefObject<{ sq: number; raid: number } | null> }) {
    const ghost = useRef<THREE.Group>(null);
    const [line] = useState(() => {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
        const l = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: '#f2c14e', dashSize: 0.18, gapSize: 0.12 }));
        l.computeLineDistances();
        return l;
    });
    const hintT = useRef(0);
    useFrame((_, dt) => {
        const g = gRef.current;
        const d = dragRef.current;
        const gh = ghost.current;
        let from: XZ | null = null;
        let to: XZ | null = null;
        let k = 1;
        if (d.active) {
            from = g.squadrons[d.sq].pos;
            to = d.p;
        } else if (hintRef.current) {
            // Veiledning før første ordre: en spøkelsesbrikke glir fra skvadronen til plottet.
            const h = hintRef.current;
            const r = findRaid(g, h.raid);
            if (raidActive(r) && r.visible) {
                hintT.current = (hintT.current + dt / 1.6) % 1.3;
                k = Math.min(1, hintT.current);
                from = g.squadrons[h.sq].pos;
                to = [from[0] + (r.pos[0] - from[0]) * k, from[1] + (r.pos[1] - from[1]) * k];
            }
        }
        aimLine(line, from && to ? from : null, to, 0.04);
        if (gh) gh.visible = !!to;
        if (from && to) {
            if (gh) {
                gh.position.set(to[0], 0.05 + (d.active ? 0.25 : 0.15 + Math.sin(k * Math.PI) * 0.3), to[1]);
                const m = (gh.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
                m.opacity = d.active ? 0.75 : 0.55 * (1 - Math.max(0, k - 0.85) * 6);
            }
        }
    });
    return (
        <group>
            <primitive object={line} />
            <group ref={ghost} visible={false}>
                <mesh>
                    <boxGeometry args={[0.5, 0.22, 0.5]} />
                    <meshBasicMaterial color="#4f86d9" transparent opacity={0.6} depthWrite={false} />
                </mesh>
            </group>
        </group>
    );
}

const FX_MAX = 240;
export function FxView({ gRef }: { gRef: GRef }) {
    const hot = useRef<THREE.InstancedMesh>(null);
    const smoke = useRef<THREE.InstancedMesh>(null);
    const rings = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(() => {
        const g = gRef.current;
        const h = hot.current;
        const s = smoke.current;
        if (!h || !s) return;
        let nh = 0;
        let ns = 0;
        let nr = 0;
        const col = new THREE.Color();
        for (const f of g.fx as Fx[]) {
            const k = f.life / f.max;
            if (f.kind === 'smoke') {
                tmpObj.position.set(f.p[0], f.p[1], f.p[2]);
                tmpObj.scale.setScalar(0.12 + k * 0.35);
                tmpObj.updateMatrix();
                s.setMatrixAt(ns++, tmpObj.matrix);
            } else if (f.kind === 'ring') {
                const m = rings.current[nr++];
                if (m) {
                    m.visible = true;
                    m.position.set(f.p[0], f.p[1], f.p[2]);
                    m.scale.setScalar(0.3 + k * 2.4);
                    (m.material as THREE.MeshBasicMaterial).opacity = 1 - k;
                }
            } else {
                tmpObj.position.set(f.p[0], f.p[1], f.p[2]);
                tmpObj.scale.setScalar((f.kind === 'bomb' ? 0.16 : 0.06) * (1 - k * 0.7));
                tmpObj.updateMatrix();
                h.setMatrixAt(nh, tmpObj.matrix);
                if (f.kind === 'bomb') col.setRGB(3.2, 1.2 + (1 - k), 0.25);
                else col.setRGB(3, 2.5, 0.9);
                h.setColorAt(nh, col);
                nh++;
            }
        }
        h.count = nh;
        s.count = ns;
        h.instanceMatrix.needsUpdate = true;
        if (h.instanceColor) h.instanceColor.needsUpdate = true;
        s.instanceMatrix.needsUpdate = true;
        for (let i = nr; i < rings.current.length; i++) {
            const m = rings.current[i];
            if (m) m.visible = false;
        }
    });
    return (
        <group>
            <instancedMesh ref={hot} args={[undefined, undefined, FX_MAX]} frustumCulled={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial toneMapped={false} />
            </instancedMesh>
            <instancedMesh ref={smoke} args={[undefined, undefined, FX_MAX]} frustumCulled={false}>
                <sphereGeometry args={[1, 8, 6]} />
                <meshStandardMaterial color="#5a524b" transparent opacity={0.55} roughness={1} depthWrite={false} />
            </instancedMesh>
            {Array.from({ length: 6 }, (_, i) => (
                <mesh
                    key={i}
                    rotation={[-Math.PI / 2, 0, 0]}
                    visible={false}
                    ref={(el) => {
                        rings.current[i] = el;
                    }}
                >
                    <ringGeometry args={[0.4, 0.5, 40]} />
                    <meshBasicMaterial color={[2.6, 2.1, 0.7]} toneMapped={false} transparent depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
}

/** Usynlig flate over bordet som fanger dra og slipp. */
export function TableCatcher({
    onMove,
    onUp,
}: {
    onMove: (p: XZ) => void;
    onUp: (p: XZ) => void;
}) {
    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.05, 0]}
            onPointerMove={(e) => onMove([e.point.x, e.point.z])}
            onPointerUp={(e) => onUp([e.point.x, e.point.z])}
            userData={{ sceneAuditIgnore: true }}
        >
            <planeGeometry args={[TABLE_W + 8, TABLE_D + 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
    );
}
