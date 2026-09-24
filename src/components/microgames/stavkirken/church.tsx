import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { PANELS, DRAGONS, M, MILE_POS } from './model';
import { writeTextures, type Grid } from './paint';
import type { G, Foundation, Mode, BrushHit } from './game';

// Kirka i 3D: statisk pynt + de malbare flatene, penselmarkøren, flammer,
// partikler og tjæremila. Alt som endrer seg per frame leses fra gRef.

type GRef = React.MutableRefObject<G>;

// ---------------------------------------------------------------------------
// Relieff-teksturer: spon (skjell) og stående planker. Brukes som bumpMap på
// uv-kanal 1, så mønsteret har lik størrelse på alle flater.
// ---------------------------------------------------------------------------

let shingleBump: THREE.CanvasTexture | null = null;
let plankBump: THREE.CanvasTexture | null = null;

function makeShingleBump() {
    if (shingleBump) return shingleBump;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    if (x) {
        for (let row = 0; row < 4; row++) {
            const y = row * 32;
            const off = row % 2 ? 16 : 0;
            for (let col = -1; col < 5; col++) {
                const cx = col * 32 + off + 16;
                // hver spon: lys midt, mørk kant - gir en avrundet tunge i relieff
                const g = x.createRadialGradient(cx, y + 10, 2, cx, y + 14, 22);
                g.addColorStop(0, '#ffffff');
                g.addColorStop(0.75, '#9a9a9a');
                g.addColorStop(1, '#202020');
                x.fillStyle = g;
                x.beginPath();
                x.moveTo(cx - 16, y - 2);
                x.lineTo(cx - 16, y + 18);
                x.quadraticCurveTo(cx, y + 38, cx + 16, y + 18);
                x.lineTo(cx + 16, y - 2);
                x.closePath();
                x.fill();
            }
        }
    }
    shingleBump = new THREE.CanvasTexture(c);
    shingleBump.wrapS = shingleBump.wrapT = THREE.RepeatWrapping;
    shingleBump.channel = 1;
    return shingleBump;
}

function makePlankBump() {
    if (plankBump) return plankBump;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    if (x) {
        for (let i = 0; i < 4; i++) {
            const g = x.createLinearGradient(i * 16, 0, i * 16 + 16, 0);
            g.addColorStop(0, '#303030');
            g.addColorStop(0.15, '#dddddd');
            g.addColorStop(0.85, '#bbbbbb');
            g.addColorStop(1, '#303030');
            x.fillStyle = g;
            x.fillRect(i * 16, 0, 16, 64);
        }
    }
    plankBump = new THREE.CanvasTexture(c);
    plankBump.wrapS = plankBump.wrapT = THREE.RepeatWrapping;
    plankBump.channel = 1;
    return plankBump;
}

// ---------------------------------------------------------------------------
// Statiske deler
// ---------------------------------------------------------------------------

const TAR_DARK = '#15100c';
const WOOD = '#2e2118';

function Dragon({ at, dir }: { at: [number, number, number]; dir: number }) {
    // Dragehodet: en buet hals som krøller seg opp og ut, som på skipsstevnene.
    const geo = useMemo(() => {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(dir * 0.35, 0.35, 0),
            new THREE.Vector3(dir * 0.55, 0.85, 0),
            new THREE.Vector3(dir * 0.9, 1.05, 0),
        ]);
        return new THREE.TubeGeometry(curve, 16, 0.07, 6, false);
    }, [dir]);
    return (
        <group position={at}>
            <mesh geometry={geo} castShadow>
                <meshStandardMaterial color={TAR_DARK} roughness={0.35} />
            </mesh>
            <mesh position={[dir * 1.02, 1.07, 0]} rotation={[0, 0, -dir * Math.PI / 2]}>
                <coneGeometry args={[0.1, 0.36, 5]} />
                <meshStandardMaterial color={TAR_DARK} roughness={0.35} />
            </mesh>
        </group>
    );
}

function Arcade({ length, z, x, rot }: { length: number; z: number; x: number; rot: number }) {
    // Svalgangens buerekke: lav vegg med små rundbuer over.
    const n = Math.max(3, Math.round(length / 0.8));
    const step = length / n;
    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                <boxGeometry args={[length, 0.75, 0.16]} />
                <meshStandardMaterial color={WOOD} roughness={0.8} />
            </mesh>
            {Array.from({ length: n + 1 }, (_, k) => (
                <mesh key={k} position={[-length / 2 + k * step, 1.52, 0]}>
                    <boxGeometry args={[0.1, 0.55, 0.12]} />
                    <meshStandardMaterial color={WOOD} />
                </mesh>
            ))}
            {Array.from({ length: n }, (_, k) => (
                <mesh key={k} position={[-length / 2 + (k + 0.5) * step, 1.78, 0]}>
                    <torusGeometry args={[step / 2 - 0.04, 0.04, 5, 10, Math.PI]} />
                    <meshStandardMaterial color={WOOD} />
                </mesh>
            ))}
            <mesh position={[0, 1.93, 0]}>
                <boxGeometry args={[length, 0.1, 0.14]} />
                <meshStandardMaterial color={WOOD} />
            </mesh>
        </group>
    );
}

function Body({ foundation }: { foundation: Foundation }) {
    const { naveX: X, naveZ: Z, base, naveWall, clereZ: CZ, clereBottom, clereTop, korX0, korX1, korZ: KZ, svalOut: SO, svalWest: SW } = M;
    return (
        <group>
            {/* Fundamentet - artikkelens nederste lag */}
            {foundation === 'sviller' ? (
                <group>
                    {[-X, -X / 2, 0, X / 2, X].flatMap((x) =>
                        [-Z, Z].map((z) => (
                            <mesh key={`${x}${z}`} position={[x, 0.16, z]} castShadow>
                                <dodecahedronGeometry args={[0.42, 0]} />
                                <meshStandardMaterial color="#8d8a80" roughness={1} flatShading />
                            </mesh>
                        ))
                    )}
                    {[-Z, Z].map((z) => (
                        <mesh key={z} position={[0, 0.44, z]} castShadow>
                            <boxGeometry args={[X * 2 + 0.5, 0.26, 0.36]} />
                            <meshStandardMaterial color="#4a3526" roughness={0.9} />
                        </mesh>
                    ))}
                    {[-X, X].map((x) => (
                        <mesh key={x} position={[x, 0.44, 0]} castShadow>
                            <boxGeometry args={[0.36, 0.26, Z * 2 + 0.5]} />
                            <meshStandardMaterial color="#4a3526" roughness={0.9} />
                        </mesh>
                    ))}
                </group>
            ) : null}

            {/* skipet under svalgangen */}
            <mesh position={[0, (base + naveWall) / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[X * 2, naveWall - base, Z * 2]} />
                <meshStandardMaterial color={WOOD} roughness={0.85} />
            </mesh>
            {/* svalgangens buerekker */}
            <Arcade length={korX0 - SW} x={(korX0 + SW) / 2} z={-SO + 0.05} rot={0} />
            <Arcade length={korX0 - SW} x={(korX0 + SW) / 2} z={SO - 0.05} rot={0} />
            <Arcade length={SO * 2} x={SW + 0.05} z={0} rot={Math.PI / 2} />
            {/* inngangen i vest: portal med utskjæringer */}
            <group position={[SW - 0.02, 0, 0]}>
                <mesh position={[0, 1.05, 0]}>
                    <boxGeometry args={[0.12, 1.5, 1.0]} />
                    <meshStandardMaterial color="#0d0907" />
                </mesh>
                <mesh position={[-0.06, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <torusGeometry args={[0.52, 0.07, 6, 14, Math.PI]} />
                    <meshStandardMaterial color="#6b4a2a" roughness={0.6} />
                </mesh>
            </group>
            {/* midtrommet */}
            <mesh position={[0, (naveWall + clereTop) / 2, 0]} castShadow>
                <boxGeometry args={[(X - 0.6) * 2 - 0.02, clereTop - naveWall, CZ * 2 - 0.02]} />
                <meshStandardMaterial color={WOOD} roughness={0.85} />
            </mesh>
            {/* glugger: små runde vinduer som lyser innenfra */}
            {[-1.4, 0, 1.4].flatMap((x) =>
                [-1, 1].map((s) => (
                    <mesh key={`${x}${s}`} position={[x, (clereBottom + clereTop) / 2, s * (CZ + 0.02)]} rotation={[0, s < 0 ? Math.PI : 0, 0]}>
                        <circleGeometry args={[0.13, 12]} />
                        <meshStandardMaterial color="#ffcf7a" emissive="#ffb347" emissiveIntensity={2.4} toneMapped={false} />
                    </mesh>
                ))
            )}
            {/* koret og apsis med sitt lille tårn */}
            <mesh position={[(korX0 + korX1) / 2, (base + naveWall) / 2, 0]} castShadow>
                <boxGeometry args={[korX1 - korX0, naveWall - base, KZ * 2]} />
                <meshStandardMaterial color={WOOD} roughness={0.85} />
            </mesh>
            <mesh position={[korX1, (base + naveWall - 0.3) / 2, 0]} castShadow>
                <cylinderGeometry args={[0.95, 0.95, naveWall - 0.3 - base, 14, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color={WOOD} roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[korX1 + 0.05, naveWall + 0.25, 0]} castShadow>
                <coneGeometry args={[1.15, 1.2, 14, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color={TAR_DARK} roughness={0.4} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[korX1 + 0.1, naveWall + 1.2, 0]}>
                <cylinderGeometry args={[0.28, 0.28, 0.7, 10]} />
                <meshStandardMaterial color={WOOD} />
            </mesh>
            <mesh position={[korX1 + 0.1, naveWall + 1.9, 0]} castShadow>
                <coneGeometry args={[0.36, 0.8, 10]} />
                <meshStandardMaterial color={TAR_DARK} roughness={0.4} />
            </mesh>
            {/* kor-gavlen i øst */}
            <mesh position={[korX1 + 0.01, naveWall - 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
                <shapeGeometry
                    args={[
                        new THREE.Shape([
                            new THREE.Vector2(-KZ - 0.2, 0),
                            new THREE.Vector2(KZ + 0.2, 0),
                            new THREE.Vector2(0, M.korRidge - naveWall + 0.1),
                        ]),
                    ]}
                />
                <meshStandardMaterial color={WOOD} side={THREE.DoubleSide} />
            </mesh>
            {/* takrytterens kropp */}
            <mesh position={[0, 7.35, 0]} castShadow>
                <boxGeometry args={[1.7, 0.95, 1.7]} />
                <meshStandardMaterial color={WOOD} />
            </mesh>
            <mesh position={[0, 8.57, 0]} castShadow>
                <boxGeometry args={[1.0, 0.66, 1.0]} />
                <meshStandardMaterial color={WOOD} />
            </mesh>
            {[0, 1, 2, 3].map((k) => (
                <mesh key={k} position={[Math.sin((k * Math.PI) / 2) * 0.51, 8.6, Math.cos((k * Math.PI) / 2) * 0.51]} rotation={[0, (k * Math.PI) / 2, 0]}>
                    <planeGeometry args={[0.55, 0.36]} />
                    <meshStandardMaterial color="#0a0706" side={THREE.DoubleSide} />
                </mesh>
            ))}
            <mesh position={[0, 11.1, 0]}>
                <sphereGeometry args={[0.1, 8, 6]} />
                <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.3} />
            </mesh>
            {DRAGONS.map(([at, dir], i) => (
                <Dragon key={i} at={at} dir={dir} />
            ))}
            {/* lykta ved døra */}
            <mesh position={[SW - 0.12, 2.05, 0.75]}>
                <boxGeometry args={[0.2, 0.28, 0.2]} />
                <meshStandardMaterial color="#ffcf7a" emissive="#ffb347" emissiveIntensity={3} toneMapped={false} />
            </mesh>
            <pointLight position={[SW - 0.6, 2.05, 0.75]} color="#ffb347" intensity={4} distance={7} />
        </group>
    );
}

// ---------------------------------------------------------------------------
// Kirka med malbare flater
// ---------------------------------------------------------------------------

export interface BrushCallbacks {
    start: (hit: BrushHit) => void;
    move: (hit: BrushHit) => void;
    end: () => void;
    hover: (hit: BrushHit | null) => void;
}

export function Church({
    foundation,
    grids,
    gRef,
    modeRef,
    brush,
}: {
    foundation: Foundation;
    grids: Grid[];
    gRef: GRef;
    modeRef: React.MutableRefObject<Mode>;
    brush: BrushCallbacks;
}) {
    const group = useRef<THREE.Group>(null);
    const stolpeMat = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const get = useThree((s) => s.get);
    const shingles = useMemo(() => makeShingleBump(), []);
    const planks = useMemo(() => makePlankBump(), []);
    const acc = useRef(0);
    const painting = useRef(false);
    const brushRef = useRef(brush);
    useEffect(() => {
        brushRef.current = brush;
    });

    // Slipp penselen hvor som helst (også utenfor lerretet).
    useEffect(() => {
        const up = () => {
            if (!painting.current) return;
            painting.current = false;
            const c = get().controls as unknown as { enabled: boolean } | null;
            if (c) c.enabled = true;
            brushRef.current.end();
        };
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        return () => {
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
        };
    }, [get]);

    useFrame((_, dt) => {
        const g = gRef.current;
        acc.current += dt;
        if (acc.current > 0.05) {
            acc.current = 0;
            const t = g.t;
            for (const gr of g.grids) writeTextures(gr, g.wet, t);
        }
        const gr = group.current;
        if (gr) {
            const lean = g.foundation === 'stolper' ? g.bunn * g.bunn * 0.18 : 0;
            const c = g.collapse;
            gr.rotation.z = lean + c * c * 0.5;
            gr.rotation.x = lean * 0.35 + c * c * 0.2;
            gr.position.y = -(g.foundation === 'stolper' ? g.bunn * 0.5 : 0) - c * c * 3;
        }
        for (const m of stolpeMat.current) if (m) m.color.set('#6b4a2e').lerp(new THREE.Color('#3f4a28'), g.bunn);
    });

    const hitOf = (i: number, e: ThreeEvent<PointerEvent>): BrushHit | null =>
        e.uv ? { panel: i, u: e.uv.x, v: e.uv.y, point: e.point.clone() } : null;

    return (
        <group ref={group}>
            <Body foundation={foundation} />
            {foundation === 'stolper' && (
                <group>
                    {[-M.naveX, 0, M.naveX].flatMap((x) =>
                        [-M.naveZ, M.naveZ].map((z, k) => (
                            <mesh key={`${x}${z}`} position={[x, 0.2, z]} castShadow>
                                <cylinderGeometry args={[0.26, 0.26, 1.2, 8]} />
                                <meshStandardMaterial
                                    ref={(m) => {
                                        stolpeMat.current[(x + M.naveX) * 2 + k] = m;
                                    }}
                                    color="#6b4a2e"
                                    roughness={1}
                                />
                            </mesh>
                        ))
                    )}
                </group>
            )}
            {PANELS.map((p, i) => {
                const grid = grids[i];
                return (
                    <mesh
                        key={p.id}
                        geometry={p.geo}
                        castShadow
                        receiveShadow
                        onPointerDown={(e) => {
                            if (modeRef.current !== 'play' || e.button !== 0) return;
                            e.stopPropagation();
                            const hit = hitOf(i, e);
                            if (!hit) return;
                            painting.current = true;
                            const c = get().controls as unknown as { enabled: boolean } | null;
                            if (c) c.enabled = false;
                            brushRef.current.start(hit);
                        }}
                        onPointerMove={(e) => {
                            e.stopPropagation();
                            const hit = hitOf(i, e);
                            if (!hit) return;
                            brushRef.current.hover(hit);
                            if (painting.current) brushRef.current.move(hit);
                        }}
                        onPointerOut={() => brushRef.current.hover(null)}
                    >
                        <meshStandardMaterial
                            map={grid.color}
                            roughnessMap={grid.rough}
                            emissiveMap={grid.glow}
                            emissive="#ffffff"
                            emissiveIntensity={2.2}
                            bumpMap={p.kind === 'roof' ? shingles : planks}
                            bumpScale={p.kind === 'roof' ? 2.2 : 1.2}
                            metalness={0.05}
                            envMapIntensity={1.1}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Penselmarkøren
// ---------------------------------------------------------------------------

export interface BrushCursorState {
    visible: boolean;
    point: THREE.Vector3;
    normal: THREE.Vector3;
    fire: boolean;
}

export function BrushCursor({ state }: { state: React.MutableRefObject<BrushCursorState> }) {
    const ring = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    const up = useMemo(() => new THREE.Vector3(0, 0, 1), []);
    useFrame(() => {
        const r = ring.current;
        const s = state.current;
        if (!r) return;
        r.visible = s.visible;
        if (!s.visible) return;
        r.position.copy(s.point).addScaledVector(s.normal, 0.05);
        r.quaternion.setFromUnitVectors(up, s.normal);
        const k = 1 + Math.sin(performance.now() / 120) * 0.06;
        r.scale.setScalar(k);
        if (mat.current) mat.current.color.set(s.fire ? '#7fd3ff' : '#ffd46a');
    });
    return (
        <mesh ref={ring} visible={false} renderOrder={10}>
            <ringGeometry args={[0.42, 0.52, 32]} />
            <meshBasicMaterial ref={mat} color="#ffd46a" transparent opacity={0.9} depthTest={false} toneMapped={false} />
        </mesh>
    );
}

// ---------------------------------------------------------------------------
// Flammer der det brenner
// ---------------------------------------------------------------------------

const FLAME_N = 36;
const FLAME_DUMMY = new THREE.Object3D();

function placeFlames(g: G, m: THREE.InstancedMesh, light: THREE.PointLight | null, t: number) {
    let k = 0;
    const avg = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    let n = 0;
    for (const gr of g.grids) {
        if (gr.burning <= 0) continue;
        for (let i = 0; i < gr.fire.length && k < FLAME_N; i += 2) {
            const f = gr.fire[i];
            if (f <= 0) continue;
            const x = i % gr.w;
            const y = Math.floor(i / gr.w);
            gr.def.uvToWorld((x + 0.5) / gr.w, (y + 0.5) / gr.h, tmp).addScaledVector(gr.def.normal, 0.1);
            const s = (0.25 + f * 0.55) * (0.85 + 0.3 * Math.sin(t * 17 + i));
            FLAME_DUMMY.position.copy(tmp).setY(tmp.y + s * 0.5);
            FLAME_DUMMY.scale.set(s, s * (1.6 + 0.4 * Math.sin(t * 23 + i)), s);
            FLAME_DUMMY.updateMatrix();
            m.setMatrixAt(k++, FLAME_DUMMY.matrix);
            avg.add(tmp);
            n++;
        }
    }
    for (let j = k; j < FLAME_N; j++) {
        FLAME_DUMMY.scale.setScalar(0);
        FLAME_DUMMY.updateMatrix();
        m.setMatrixAt(j, FLAME_DUMMY.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (light) {
        light.intensity = n > 0 ? 8 + Math.sin(t * 21) * 2 : 0;
        if (n > 0) light.position.copy(avg.multiplyScalar(1 / n)).setY(light.position.y + 0.8);
    }
}

export function Flames({ gRef }: { gRef: GRef }) {
    const inst = useRef<THREE.InstancedMesh>(null);
    const light = useRef<THREE.PointLight>(null);
    useFrame(() => {
        if (inst.current) placeFlames(gRef.current, inst.current, light.current, performance.now() / 1000);
    });
    return (
        <group>
            <instancedMesh ref={inst} args={[undefined, undefined, FLAME_N]}>
                <coneGeometry args={[0.5, 1, 6]} />
                <meshBasicMaterial color="#ff8a2a" transparent opacity={0.85} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
            </instancedMesh>
            <pointLight ref={light} color="#ff9a3a" intensity={0} distance={16} />
        </group>
    );
}

// ---------------------------------------------------------------------------
// Partikler: tjæredrypp, damp, spon, gnister
// ---------------------------------------------------------------------------

const P_N = 160;
const P_DUMMY = new THREE.Object3D();
const P_COL: Record<string, THREE.Color> = {
    drip: new THREE.Color('#0b0806'),
    steam: new THREE.Color('#eef3f6'),
    shingle: new THREE.Color('#8a7a60'),
    spark: new THREE.Color('#ffb347'),
};

function placeParticles(g: G, m: THREE.InstancedMesh) {
    for (let i = 0; i < P_N; i++) {
        const p = g.particles[i];
        if (p) {
            const a = p.life / p.max;
            P_DUMMY.position.copy(p.p);
            const s = p.kind === 'steam' ? 0.35 * (1.6 - a) : p.kind === 'shingle' ? 0.12 : 0.06;
            P_DUMMY.scale.set(s, p.kind === 'drip' ? s * 2.2 : p.kind === 'shingle' ? s * 0.3 : s, s);
            P_DUMMY.rotation.set(p.life * 7, p.life * 5, 0);
            m.setColorAt(i, P_COL[p.kind]);
        } else P_DUMMY.scale.setScalar(0);
        P_DUMMY.updateMatrix();
        m.setMatrixAt(i, P_DUMMY.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
}

export function ParticleView({ gRef }: { gRef: GRef }) {
    const inst = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        if (inst.current) placeParticles(gRef.current, inst.current);
    });
    return (
        <instancedMesh ref={inst} args={[undefined, undefined, P_N]}>
            <sphereGeometry args={[1, 6, 5]} />
            <meshStandardMaterial roughness={0.3} />
        </instancedMesh>
    );
}

// ---------------------------------------------------------------------------
// Tjæremila
// ---------------------------------------------------------------------------

export function Mile({ gRef, onCollect }: { gRef: GRef; onCollect: () => void }) {
    const barrel = useRef<THREE.Group>(null);
    const glow = useRef<THREE.Mesh>(null);
    const ember = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(() => {
        const g = gRef.current;
        const t = performance.now() / 1000;
        if (barrel.current) {
            barrel.current.visible = g.mileReady;
            barrel.current.position.y = 2 + Math.abs(Math.sin(t * 4)) * 0.4;
            barrel.current.rotation.y = t;
        }
        if (glow.current) glow.current.visible = g.mileReady;
        if (ember.current) ember.current.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.5;
    });
    return (
        <group position={MILE_POS.toArray()} userData={{ sceneAuditIgnore: true }}>
            <mesh castShadow>
                <sphereGeometry args={[1.7, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#3b2a1e" roughness={1} flatShading />
            </mesh>
            {/* glørne i sprekkene */}
            <mesh position={[0.9, 0.5, 1.2]} rotation={[0, 0.6, 0]}>
                <planeGeometry args={[0.5, 0.18]} />
                <meshStandardMaterial ref={ember} color="#ff7a2a" emissive="#ff5a1a" emissiveIntensity={1.4} toneMapped={false} />
            </mesh>
            <group
                ref={barrel}
                onClick={(e) => {
                    if (e.delta > 8) return;
                    e.stopPropagation();
                    onCollect();
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = '')}
            >
                <mesh castShadow>
                    <cylinderGeometry args={[0.5, 0.5, 1, 14]} />
                    <meshStandardMaterial color="#5a3b22" roughness={0.7} />
                </mesh>
                {[-0.34, 0.34].map((y) => (
                    <mesh key={y} position={[0, y, 0]}>
                        <cylinderGeometry args={[0.52, 0.52, 0.09, 14]} />
                        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
                    </mesh>
                ))}
                <mesh>
                    <boxGeometry args={[2.6, 2.8, 2.6]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
            </group>
            <mesh ref={glow} position={[0, 2.3, 0]}>
                <sphereGeometry args={[1.2, 16, 12]} />
                <meshBasicMaterial color="#ffd46a" transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
            </mesh>
        </group>
    );
}
