import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { GlowHalo, Particles, Smoke } from '../kit';
import {
    STATIONS,
    SEDLER,
    DAYS,
    RUN_SECONDS,
    CART_CAP,
    PED_COUNT,
    pedsActive,
    dayAt,
    priceAt,
    formatMark,
    dollarAt,
    cashInBread,
    cashFade,
    bundleCount,
    isClosed,
    canAfford,
    type G,
    type Good,
    type StationId,
} from './game';
import {
    cobbleTexture,
    plasterTexture,
    makeBoard,
    noteTexture,
    posterTexture,
    makeTag,
} from './textures';

// Plassen i Berlin, høsten 1923. Ekspresjonistiske fasader som lener seg og har
// skjeve takrygger (som i filmen «Dr. Caligaris kabinett»), brostein, gasslykter
// og en Litfaß-søyle med dollarkursen. Alt her LESER spilltilstanden hver frame;
// ingenting her styrer reglene.

type GRef = React.MutableRefObject<G>;

function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

const WALL_BACK = -8.6;
const WALL_SIDE = 12.3;
const C = (h: string) => new THREE.Color(h);

// ---------------------------------------------------------------------------
// Lys og himmel: fra gyllen augustkveld til kald novembersnø
// ---------------------------------------------------------------------------

const SKY = [C('#e6c29a'), C('#d6bda2'), C('#b9b4b8'), C('#a9b5c7')];
const SUN = [C('#ffcf96'), C('#ffd9b0'), C('#f0e6de'), C('#dfe8ff')];

function monthBlend(day: number, arr: THREE.Color[], out: THREE.Color) {
    const f = Math.min(arr.length - 1, Math.max(0, (day / DAYS) * (arr.length - 1)));
    const i = Math.min(arr.length - 2, Math.floor(f));
    return out.copy(arr[i]).lerp(arr[i + 1], f - i);
}

export function Atmosphere({ gRef }: { gRef: GRef }) {
    const scene = useThree((s) => s.scene);
    const sun = useRef<THREE.DirectionalLight>(null);
    const hemi = useRef<THREE.HemisphereLight>(null);
    const col = useMemo(() => new THREE.Color(), []);
    useFrame(() => {
        const day = dayAt(gRef.current.t);
        monthBlend(day, SKY, col);
        if (scene.background instanceof THREE.Color) scene.background.copy(col);
        if (scene.fog) (scene.fog as THREE.Fog).color.copy(col);
        if (sun.current) {
            monthBlend(day, SUN, sun.current.color);
            sun.current.intensity = 1.35 - (day / DAYS) * 0.45;
        }
        if (hemi.current) hemi.current.intensity = 0.62 + (day / DAYS) * 0.18;
    });
    return (
        <>
            <directionalLight
                ref={sun}
                position={[-16, 20, 12]}
                intensity={1.3}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0006}
            >
                <orthographicCamera attach="shadow-camera" args={[-22, 22, 18, -18, 1, 70]} />
            </directionalLight>
            <hemisphereLight ref={hemi} args={['#f3e6d6', '#4a4550', 0.65]} />
            <Environment resolution={64} frames={1}>
                <Lightformer
                    form="rect"
                    intensity={1.2}
                    color="#f4e8dc"
                    position={[0, 9, 0]}
                    rotation-x={Math.PI / 2}
                    scale={[24, 24, 1]}
                />
                <Lightformer
                    form="rect"
                    intensity={1.1}
                    color="#ffb766"
                    position={[-10, 2, 6]}
                    rotation-y={Math.PI / 2}
                    scale={[12, 3, 1]}
                />
                <Lightformer
                    form="rect"
                    intensity={0.6}
                    color="#8ea3c4"
                    position={[10, 3, -4]}
                    rotation-y={-Math.PI / 2}
                    scale={[12, 4, 1]}
                />
            </Environment>
        </>
    );
}

// ---------------------------------------------------------------------------
// Plassen: brostein, fortau, dørmatter og verdiløse sedler som hoper seg opp
// ---------------------------------------------------------------------------

const LITTER_MAX = 160;
const LITTER = (() => {
    const r = rng(77);
    const out: { x: number; z: number; rot: number; tilt: number; hue: number }[] = [];
    for (let i = 0; i < LITTER_MAX; i++) {
        // Mest langs veggene og i hjørnene, der vinden legger papiret.
        const edge = r() < 0.6;
        const x = edge ? (r() < 0.5 ? -1 : 1) * (8.5 + r() * 3.2) : -11 + r() * 22;
        const z = edge ? -8 + r() * 15 : r() < 0.5 ? -7.8 + r() * 2 : 5.5 + r() * 1.6;
        out.push({
            x,
            z,
            rot: r() * Math.PI * 2,
            tilt: (r() - 0.5) * 0.3,
            hue: Math.floor(r() * 3),
        });
    }
    return out;
})();

export function Plaza({ gRef }: { gRef: GRef }) {
    const cobble = useMemo(() => {
        const t = cobbleTexture();
        t.repeat.set(10, 7.5);
        return t;
    }, []);
    const ground = useRef<THREE.MeshStandardMaterial>(null);
    const litter = useRef<THREE.InstancedMesh>(null);
    const noteTex = useMemo(() => noteTexture('1 000 000'), []);
    const col = useMemo(() => new THREE.Color(), []);
    const snowCol = useMemo(() => C('#d9dee6'), []);
    const baseCol = useMemo(() => C('#cfc8c0'), []);
    useEffect(() => {
        const m = litter.current;
        if (!m) return;
        const o = new THREE.Object3D();
        const tints = [C('#cfe0b8'), C('#ddd0ea'), C('#eadcc0')];
        LITTER.forEach((l, i) => {
            o.position.set(l.x, 0.02 + (i % 5) * 0.002, l.z);
            o.rotation.set(-Math.PI / 2 + l.tilt, 0, l.rot);
            o.scale.setScalar(1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            m.setColorAt(i, tints[l.hue]);
        });
        m.count = 0;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, []);
    useFrame(() => {
        const day = dayAt(gRef.current.t);
        if (litter.current) litter.current.count = Math.floor(Math.min(1, day / 95) * LITTER_MAX);
        if (ground.current) {
            const snow = Math.max(0, (day - 96) / 10) * 0.55;
            ground.current.color.copy(col.copy(baseCol).lerp(snowCol, snow));
        }
    });
    // Bakken, fortauet og papiret er gulv, ikke «modellen» scene-revisjonen skal ramme inn.
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 1]} receiveShadow>
                <planeGeometry args={[46, 30]} />
                <meshStandardMaterial
                    ref={ground}
                    map={cobble}
                    color="#cfc8c0"
                    roughness={0.78}
                    metalness={0.05}
                />
            </mesh>
            {/* fortauet langs husene */}
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, WALL_BACK + 0.6]} receiveShadow>
                <planeGeometry args={[30, 1.2]} />
                <meshStandardMaterial color="#8d8a8c" roughness={0.9} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[-WALL_SIDE + 0.6, 0.005, 0.2]} receiveShadow>
                <planeGeometry args={[1.2, 17.6]} />
                <meshStandardMaterial color="#8d8a8c" roughness={0.9} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[WALL_SIDE - 0.6, 0.005, 0.2]} receiveShadow>
                <planeGeometry args={[1.2, 17.6]} />
                <meshStandardMaterial color="#8d8a8c" roughness={0.9} />
            </mesh>
            {/* trikkeskinner foran */}
            {[8.1, 8.8].map((z) => (
                <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.012, z]}>
                    <planeGeometry args={[46, 0.09]} />
                    <meshStandardMaterial color="#b9bcc4" metalness={0.8} roughness={0.3} />
                </mesh>
            ))}
            <instancedMesh ref={litter} args={[undefined, undefined, LITTER_MAX]} receiveShadow>
                <planeGeometry args={[0.36, 0.18]} />
                <meshStandardMaterial map={noteTex} roughness={0.9} side={THREE.DoubleSide} />
            </instancedMesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Husene: skjeve fasader, vinduer (instansert), butikkfronter og skilt
// ---------------------------------------------------------------------------

type Facing = 'back' | 'left' | 'right';
interface BDef {
    facing: Facing;
    a0: number;
    a1: number;
    h: number;
    /** Høydeforskjell mellom høyre og venstre takhjørne. */
    skew: number;
    /** Hvor mye toppen lener seg sidelengs. */
    lean: number;
    color: string;
    depth: number;
    kind?: 'fabrikk' | 'kull' | 'bakeri' | 'hjem';
}

// u = posisjon langs veggen, venstre til høyre sett fra plassen.
const BUILDINGS: BDef[] = [
    {
        facing: 'back',
        a0: -18,
        a1: -10.2,
        h: 7.6,
        skew: 1.2,
        lean: 0.35,
        color: '#b8894f',
        depth: 5,
    },
    {
        facing: 'back',
        a0: -10.2,
        a1: -1.8,
        h: 5.8,
        skew: 0,
        lean: 0,
        color: '#8a3f30',
        depth: 7,
        kind: 'fabrikk',
    },
    {
        facing: 'back',
        a0: -1.8,
        a1: 1.6,
        h: 9.2,
        skew: -1.4,
        lean: -0.45,
        color: '#7f8f84',
        depth: 5,
    },
    {
        facing: 'back',
        a0: 1.6,
        a1: 7.2,
        h: 6.6,
        skew: 0.8,
        lean: 0.25,
        color: '#45434b',
        depth: 5,
        kind: 'kull',
    },
    { facing: 'back', a0: 7.2, a1: 18, h: 7.8, skew: -1.6, lean: -0.3, color: '#7d3b3b', depth: 5 },
    { facing: 'left', a0: 8.6, a1: 4.4, h: 7.2, skew: 0.9, lean: 0.3, color: '#99a0a8', depth: 5 },
    {
        facing: 'left',
        a0: 4.4,
        a1: -2.2,
        h: 6.8,
        skew: -0.9,
        lean: -0.2,
        color: '#c9a04e',
        depth: 5,
        kind: 'bakeri',
    },
    { facing: 'left', a0: -2.2, a1: -9.8, h: 8, skew: 1.3, lean: 0.4, color: '#6d7c92', depth: 5 },
    {
        facing: 'right',
        a0: -8.6,
        a1: -0.8,
        h: 8.4,
        skew: -1.1,
        lean: -0.35,
        color: '#c29a61',
        depth: 5,
    },
    {
        facing: 'right',
        a0: -0.8,
        a1: 9.8,
        h: 9.4,
        skew: 1.2,
        lean: 0.3,
        color: '#7f8f84',
        depth: 5,
        kind: 'hjem',
    },
];

function facingTransform(f: Facing): { pos: [number, number, number]; rotY: number } {
    if (f === 'back') return { pos: [0, 0, WALL_BACK], rotY: 0 };
    if (f === 'left') return { pos: [-WALL_SIDE, 0, 0], rotY: Math.PI / 2 };
    return { pos: [WALL_SIDE, 0, 0], rotY: -Math.PI / 2 };
}

/** Veggpunkt (u) for en stasjons dør, i den lokale fasade-rammen. */
function doorU(id: StationId): number {
    const [x, z] = STATIONS[id].door;
    if (id === 'bakeri') return -z;
    if (id === 'hjem') return z;
    return x;
}

function buildingShape(b: BDef) {
    const w = b.a1 - b.a0;
    const hl = b.h - b.skew / 2;
    const hr = b.h + b.skew / 2;
    const s = new THREE.Shape();
    s.moveTo(b.a0, 0);
    s.lineTo(b.a1, 0);
    s.lineTo(b.a1 + b.lean, hr);
    // en knekk i takryggen gir den skjeve, tegnede silhuetten
    s.lineTo(b.a0 + w * 0.55 + b.lean, (hl + hr) / 2 + 0.5 + Math.abs(b.skew) * 0.2);
    s.lineTo(b.a0 + b.lean, hl);
    s.lineTo(b.a0, 0);
    return s;
}

const topAt = (b: BDef, u: number) => {
    const w = b.a1 - b.a0;
    const k = (u - b.a0) / w;
    return b.h - b.skew / 2 + b.skew * k;
};

interface WinSpec {
    m: THREE.Matrix4;
    lit: boolean;
}

function windowsFor(b: BDef, seed: number): WinSpec[] {
    const r = rng(seed);
    const out: WinSpec[] = [];
    const { pos, rotY } = facingTransform(b.facing);
    const group = new THREE.Matrix4().compose(
        new THREE.Vector3(...pos),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
        new THREE.Vector3(1, 1, 1)
    );
    const o = new THREE.Object3D();
    const w = b.a1 - b.a0;
    const cols = Math.max(2, Math.floor(w / 1.35));
    const shear = Math.atan2(b.lean, b.h);
    const floor0 = b.kind === 'fabrikk' ? 3.4 : 2.9;
    for (let fy = floor0; fy < b.h + 2; fy += 1.95) {
        for (let c = 0; c < cols; c++) {
            const u0 = b.a0 + (w / cols) * (c + 0.5);
            const u = u0 + (b.lean * fy) / b.h;
            if (fy + 0.75 > topAt(b, u) - 0.45) continue;
            if (Math.abs(u) > 17 || (b.facing !== 'back' && Math.abs(u) > 10.2)) continue;
            o.position.set(u, fy, 0.03);
            o.rotation.set(0, 0, -shear);
            o.scale.set(b.kind === 'fabrikk' ? 1.4 : 1, 1, 1);
            o.updateMatrix();
            out.push({ m: new THREE.Matrix4().multiplyMatrices(group, o.matrix), lit: r() < 0.38 });
        }
    }
    return out;
}

export function Buildings({ gRef }: { gRef: GRef }) {
    const plaster = useMemo(() => {
        const t = plasterTexture();
        t.repeat.set(0.25, 0.25);
        return t;
    }, []);
    const geos = useMemo(
        () =>
            BUILDINGS.map((b) => {
                const g = new THREE.ExtrudeGeometry(buildingShape(b), {
                    depth: b.depth,
                    bevelEnabled: false,
                });
                g.translate(0, 0, -b.depth);
                return g;
            }),
        []
    );
    const wins = useMemo(() => BUILDINGS.flatMap((b, i) => windowsFor(b, i * 31 + 3)), []);
    const litRef = useRef<THREE.InstancedMesh>(null);
    const darkRef = useRef<THREE.InstancedMesh>(null);
    const lit = useMemo(() => wins.filter((w) => w.lit), [wins]);
    const dark = useMemo(() => wins.filter((w) => !w.lit), [wins]);
    useEffect(() => {
        lit.forEach((w, i) => litRef.current?.setMatrixAt(i, w.m));
        dark.forEach((w, i) => darkRef.current?.setMatrixAt(i, w.m));
        if (litRef.current) litRef.current.instanceMatrix.needsUpdate = true;
        if (darkRef.current) darkRef.current.instanceMatrix.needsUpdate = true;
    }, [lit, dark]);
    // Husrekkene er kulisse rundt plassen og strekker seg langt ut av bildet. De
    // holdes utenfor scene-revisjonens modellboks; butikkfrontene (under) er med.
    return (
        <group>
            <group userData={{ sceneAuditIgnore: true }}>
                {BUILDINGS.map((b, i) => {
                    const { pos, rotY } = facingTransform(b.facing);
                    const w = b.a1 - b.a0;
                    const hl = b.h - b.skew / 2;
                    const hr = b.h + b.skew / 2;
                    return (
                        <group key={i} position={pos} rotation-y={rotY}>
                            <mesh geometry={geos[i]} castShadow receiveShadow>
                                <meshStandardMaterial
                                    color={b.color}
                                    map={plaster}
                                    roughness={0.92}
                                />
                            </mesh>
                            {/* mørk takkant langs den skjeve ryggen */}
                            <mesh
                                position={[
                                    b.a0 + w / 2 + b.lean,
                                    (hl + hr) / 2 + 0.05,
                                    -b.depth / 2,
                                ]}
                                rotation-z={Math.atan2(hr - hl, w)}
                                castShadow
                            >
                                <boxGeometry args={[w + 0.3, 0.22, b.depth + 0.3]} />
                                <meshStandardMaterial color="#2a262b" roughness={0.8} />
                            </mesh>
                            {/* gesims over første etasje */}
                            <mesh position={[b.a0 + w / 2, 2.55, 0.08]}>
                                <boxGeometry args={[w, 0.16, 0.18]} />
                                <meshStandardMaterial color="#3a3438" roughness={0.8} />
                            </mesh>
                            {!b.kind && <PlainGround b={b} />}
                        </group>
                    );
                })}
                <instancedMesh ref={litRef} args={[undefined, undefined, lit.length]}>
                    <planeGeometry args={[0.62, 0.95]} />
                    <meshStandardMaterial
                        color="#ffc46a"
                        emissive="#ffae4a"
                        emissiveIntensity={1.25}
                        toneMapped={false}
                    />
                </instancedMesh>
                <instancedMesh ref={darkRef} args={[undefined, undefined, dark.length]}>
                    <planeGeometry args={[0.62, 0.95]} />
                    <meshStandardMaterial
                        color="#2c3440"
                        roughness={0.2}
                        metalness={0.4}
                        envMapIntensity={1.4}
                    />
                </instancedMesh>
            </group>
            <Fabrikk gRef={gRef} />
            <Kullhandel gRef={gRef} />
            <Bakeri gRef={gRef} />
            <Hjem gRef={gRef} />
        </group>
    );
}

/** Første etasje på vanlige hus: port og to butikkvinduer med persienner. */
function PlainGround({ b }: { b: BDef }) {
    const w = b.a1 - b.a0;
    const mid = b.a0 + w / 2;
    if (Math.abs(mid) > 16 || (b.facing !== 'back' && Math.abs(mid) > 11)) return null;
    return (
        <group>
            <mesh position={[mid, 1.1, 0.04]}>
                <boxGeometry args={[1.1, 2.2, 0.1]} />
                <meshStandardMaterial color="#2e2522" roughness={0.7} />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[mid + s * Math.min(2.2, w * 0.3), 1.35, 0.04]}>
                    <boxGeometry args={[1.3, 1.3, 0.06]} />
                    <meshStandardMaterial color="#3a4452" roughness={0.25} metalness={0.3} />
                </mesh>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Butikkene og porten, med skilt som viser prisene akkurat nå
// ---------------------------------------------------------------------------

function useSign(lines: string[], style: Parameters<typeof makeBoard>[2], w = 512, h = 160) {
    const board = useMemo(() => makeBoard(w, h, style), [w, h, style]);
    const key = lines.join('|');
    useEffect(() => {
        board.draw(key.split('|'));
    }, [board, key]);
    return board;
}

const SIGN_DARK = {
    bg: '#1d1c22',
    fg: '#f4efe4',
    accent: '#f2b441',
    border: '#f4efe4',
    sizes: [0.5, 0.24],
};
const PRICE_STYLE = {
    bg: '#f4efe4',
    fg: '#1d1c22',
    accent: '#c8322b',
    border: '#1d1c22',
    sizes: [0.3, 0.36],
};

/** Pristavle som oppdateres fire ganger i sekundet mens prisen løper. */
function PriceBoard({
    gRef,
    id,
    good,
    position,
    rotation,
}: {
    gRef: GRef;
    id: StationId;
    good: Good;
    position: [number, number, number];
    rotation?: [number, number, number];
}) {
    const board = useMemo(() => makeBoard(512, 200, PRICE_STYLE), []);
    const acc = useRef(1);
    const last = useRef('');
    useFrame((_, dt) => {
        acc.current += dt;
        if (acc.current < 0.25) return;
        acc.current = 0;
        const g = gRef.current;
        const unit =
            good === 'kull' ? '1 SEKK KULL' : good === 'brod' ? '1 BRØD' : '1 SEKK POTETER';
        const lines = isClosed(g, id)
            ? ['STENGT', 'vil ikke ha mark']
            : g.t >= RUN_SECONDS
              ? [unit, 'RENTENMARK']
              : [unit, formatMark(priceAt(good, g.t)) + ' M'];
        const k = lines.join('|');
        if (k !== last.current) {
            last.current = k;
            board.draw(lines);
        }
    });
    return (
        <mesh position={position} rotation={rotation}>
            <planeGeometry args={[2.1, 0.82]} />
            <meshBasicMaterial map={board.tex} toneMapped={false} />
        </mesh>
    );
}

function Fabrikk({ gRef }: { gRef: GRef }) {
    const u = doorU('fabrikk');
    const lamp = useRef<THREE.MeshStandardMaterial>(null);
    const halo = useRef<THREE.Group>(null);
    const sign = useSign(['LØNN', 'Lohnkasse'], SIGN_DARK);
    const name = useSign(['FABRIKK'], { bg: '#8a3f30', fg: '#f4efe4', sizes: [0.62] }, 512, 110);
    useFrame(({ clock }) => {
        const ready = gRef.current.payReady > 0;
        const k = ready ? 0.6 + 0.4 * Math.sin(clock.getElapsedTime() * 8) : 0.15;
        if (lamp.current) lamp.current.emissiveIntensity = 0.4 + k * 2.4;
        if (halo.current) halo.current.visible = ready;
    });
    return (
        <group position={[0, 0, WALL_BACK]}>
            {/* porten */}
            <mesh position={[u, 1.6, 0.05]}>
                <boxGeometry args={[2.6, 3.2, 0.12]} />
                <meshStandardMaterial color="#1c1718" roughness={0.9} />
            </mesh>
            <mesh position={[u, 3.35, 0.12]}>
                <boxGeometry args={[3.1, 0.35, 0.3]} />
                <meshStandardMaterial color="#5a2a22" roughness={0.8} />
            </mesh>
            {/* lønningsluka: lyser når lønna er klar */}
            <mesh position={[u + 1.9, 1.5, 0.08]}>
                <boxGeometry args={[0.9, 0.7, 0.12]} />
                <meshStandardMaterial
                    ref={lamp}
                    color="#ffd36a"
                    emissive="#ffb030"
                    emissiveIntensity={0.6}
                    toneMapped={false}
                />
            </mesh>
            <group ref={halo} position={[u + 1.9, 1.5, 0.3]}>
                <GlowHalo color="#ffc040" size={0.9} opacity={0.35} />
            </group>
            <mesh position={[u, 4.2, 0.1]}>
                <planeGeometry args={[2.4, 0.75]} />
                <meshBasicMaterial map={sign.tex} toneMapped={false} />
            </mesh>
            <mesh position={[-6.1, 5.1, 0.1]}>
                <planeGeometry args={[3.6, 0.78]} />
                <meshBasicMaterial map={name.tex} toneMapped={false} />
            </mesh>
            {/* sagtakene og pipa: kulisse */}
            <group userData={{ sceneAuditIgnore: true }}>
                {[-8.8, -6.2, -3.6].map((x) => (
                    <mesh key={x} position={[x, 6.4, -3.5]} rotation-z={Math.PI / 4} castShadow>
                        <boxGeometry args={[1.8, 1.8, 6.6]} />
                        <meshStandardMaterial color="#5e2b22" roughness={0.9} />
                    </mesh>
                ))}
                <mesh position={[-9.2, 7, -4.2]} castShadow>
                    <cylinderGeometry args={[0.45, 0.65, 12, 12]} />
                    <meshStandardMaterial color="#6e3326" roughness={0.9} />
                </mesh>
                <Smoke origin={[-9.2, 13.1, -4.2]} count={6} color="#5b5660" />
            </group>
        </group>
    );
}

function Kullhandel({ gRef }: { gRef: GRef }) {
    const u = doorU('kullhandel');
    const sign = useSign(['KULL', 'Kohlen'], SIGN_DARK);
    const sacks = useMemo(() => {
        const r = rng(9);
        return Array.from({ length: 7 }, (_, i) => ({
            x: u - 2.2 + (i % 4) * 0.42 + r() * 0.1,
            y: 0.25 + Math.floor(i / 4) * 0.36,
            z: 0.5 + r() * 0.2,
            s: 0.8 + r() * 0.3,
        }));
    }, [u]);
    return (
        <group position={[0, 0, WALL_BACK]}>
            <mesh position={[u, 1.1, 0.05]}>
                <boxGeometry args={[1.3, 2.2, 0.12]} />
                <meshStandardMaterial color="#17161a" roughness={0.9} />
            </mesh>
            <mesh position={[u + 1.9, 1.3, 0.05]}>
                <boxGeometry args={[1.8, 1.4, 0.08]} />
                <meshStandardMaterial
                    color="#ffb766"
                    emissive="#ff9a3a"
                    emissiveIntensity={0.6}
                    roughness={0.4}
                />
            </mesh>
            <mesh position={[u, 3.2, 0.1]}>
                <planeGeometry args={[2.3, 0.72]} />
                <meshBasicMaterial map={sign.tex} toneMapped={false} />
            </mesh>
            <PriceBoard gRef={gRef} id="kullhandel" good="kull" position={[u + 1.9, 2.3, 0.1]} />
            {sacks.map((s, i) => (
                <mesh key={i} position={[s.x, s.y, s.z]} scale={[s.s, s.s * 0.85, s.s]} castShadow>
                    <dodecahedronGeometry args={[0.25, 0]} />
                    <meshStandardMaterial color="#2a2826" roughness={0.95} />
                </mesh>
            ))}
        </group>
    );
}

function StripedAwning({ width, color }: { width: number; color: string }) {
    const tex = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 16;
        const x = c.getContext('2d')!;
        for (let i = 0; i < 16; i++) {
            x.fillStyle = i % 2 ? '#f1e9d8' : color;
            x.fillRect(i * 16, 0, 16, 16);
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }, [color]);
    return (
        <mesh rotation-x={0.55} castShadow>
            <boxGeometry args={[width, 0.05, 1.3]} />
            <meshStandardMaterial map={tex} roughness={0.8} />
        </mesh>
    );
}

function Bakeri({ gRef }: { gRef: GRef }) {
    const u = doorU('bakeri');
    const sign = useSign(['BAKER', 'Bäckerei'], SIGN_DARK);
    return (
        <group position={[-WALL_SIDE, 0, 0]} rotation-y={Math.PI / 2}>
            <mesh position={[u, 1.1, 0.05]}>
                <boxGeometry args={[1.2, 2.2, 0.12]} />
                <meshStandardMaterial color="#2c2019" roughness={0.9} />
            </mesh>
            <mesh position={[u - 1.9, 1.35, 0.05]}>
                <boxGeometry args={[2, 1.5, 0.08]} />
                <meshStandardMaterial
                    color="#ffd08a"
                    emissive="#ffb050"
                    emissiveIntensity={0.7}
                    roughness={0.4}
                />
            </mesh>
            <group position={[u - 0.6, 2.75, 0.62]}>
                <StripedAwning width={3.9} color="#b33a2e" />
            </group>
            <mesh position={[u - 0.6, 3.55, 0.1]}>
                <planeGeometry args={[2.4, 0.75]} />
                <meshBasicMaterial map={sign.tex} toneMapped={false} />
            </mesh>
            <PriceBoard gRef={gRef} id="bakeri" good="brod" position={[u + 1.7, 1.7, 0.1]} />
            {/* kringla - bakerens gamle laugsmerke */}
            <group position={[u + 1.6, 3.55, 0.55]}>
                <mesh>
                    <torusGeometry args={[0.32, 0.08, 8, 20]} />
                    <meshStandardMaterial
                        color="#d49a3a"
                        emissive="#8a5010"
                        emissiveIntensity={0.4}
                        metalness={0.4}
                        roughness={0.4}
                    />
                </mesh>
            </group>
        </group>
    );
}

function Hjem({ gRef }: { gRef: GRef }) {
    const u = doorU('hjem');
    const sign = useSign(
        ['HJEM'],
        { bg: '#f4efe4', fg: '#1d1c22', border: '#1d1c22', sizes: [0.6] },
        256,
        110
    );
    const win = useRef<THREE.MeshStandardMaterial>(null);
    const halo = useRef<THREE.Mesh>(null);
    const warm = useMemo(() => C('#ffb347'), []);
    const cold = useMemo(() => C('#6f87b0'), []);
    useFrame(({ clock }) => {
        const g = gRef.current;
        const k = Math.max(0, Math.min(1, g.heat / 70));
        const flick = g.heat < 25 ? 0.7 + 0.3 * Math.sin(clock.getElapsedTime() * 13) : 1;
        if (win.current) {
            win.current.emissive.copy(cold).lerp(warm, k);
            win.current.color.copy(win.current.emissive);
            win.current.emissiveIntensity = (0.5 + k * 1.5) * flick;
        }
        if (halo.current)
            (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + k * 0.3;
    });
    return (
        <group position={[WALL_SIDE, 0, 0]} rotation-y={-Math.PI / 2}>
            <mesh position={[u, 1.2, 0.05]}>
                <boxGeometry args={[1.3, 2.4, 0.12]} />
                <meshStandardMaterial color="#3b2a22" roughness={0.9} />
            </mesh>
            <mesh position={[u, 2.75, 0.1]}>
                <planeGeometry args={[1.4, 0.6]} />
                <meshBasicMaterial map={sign.tex} toneMapped={false} />
            </mesh>
            {/* familiens vindu: varmt når ovnen har kull, blått når det er kaldt */}
            <mesh position={[u + 1.7, 4.3, 0.06]}>
                <planeGeometry args={[1.5, 1.25]} />
                <meshStandardMaterial
                    ref={win}
                    color="#ffb347"
                    emissive="#ffb347"
                    emissiveIntensity={1.6}
                    toneMapped={false}
                />
            </mesh>
            <mesh ref={halo} position={[u + 1.7, 4.3, 0.2]}>
                <circleGeometry args={[1.3, 24]} />
                <meshBasicMaterial
                    color="#ffb347"
                    transparent
                    opacity={0.3}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            {[-0.8, 0.8].map((d) => (
                <mesh key={d} position={[u + 1.7 + d * 0.62, 4.3, 0.08]}>
                    <planeGeometry args={[0.3, 1.25]} />
                    <meshStandardMaterial color="#8a2f2a" roughness={0.9} />
                </mesh>
            ))}
            <mesh position={[u + 1.7, 3.6, 0.2]}>
                <boxGeometry args={[1.8, 0.1, 0.35]} />
                <meshStandardMaterial color="#3a3438" />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Potetvogna, Litfaß-søylen og gasslyktene
// ---------------------------------------------------------------------------

export function Stall({ gRef }: { gRef: GRef }) {
    const [x, z] = STATIONS.marked.door;
    return (
        <group position={[x, 0, z + 1.7]}>
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.4, 0.5, 1.2]} />
                <meshStandardMaterial color="#6b4a2e" roughness={0.9} />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 1.25, 0.45, 0]} rotation-z={Math.PI / 2} castShadow>
                    <cylinderGeometry args={[0.45, 0.45, 0.1, 14]} />
                    <meshStandardMaterial color="#3a2a1e" roughness={0.8} />
                </mesh>
            ))}
            {Array.from({ length: 6 }, (_, i) => (
                <mesh
                    key={i}
                    position={[
                        -0.8 + (i % 3) * 0.8,
                        1.2 + Math.floor(i / 3) * 0.2,
                        -0.2 + Math.floor(i / 3) * 0.3,
                    ]}
                    castShadow
                >
                    <sphereGeometry args={[0.32, 8, 6]} />
                    <meshStandardMaterial color="#a68a5c" roughness={1} />
                </mesh>
            ))}
            {[-1.1, 1.1].map((s) => (
                <mesh key={s} position={[s, 1.6, 0.5]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
                    <meshStandardMaterial color="#3a2a1e" />
                </mesh>
            ))}
            <group position={[0, 2.5, 0.1]} rotation-y={Math.PI}>
                <StripedAwning width={2.8} color="#3f6a47" />
            </group>
            <PriceBoard
                gRef={gRef}
                id="marked"
                good="poteter"
                position={[0, 1.55, -0.62]}
                rotation={[0, Math.PI, 0]}
            />
            <Walker
                colors={WALKER_COLORS[3]}
                hat="scarf"
                position={[0.4, 0, 0.9]}
                rotation={[0, Math.PI, 0]}
            />
        </group>
    );
}

export function Litfass({ gRef }: { gRef: GRef }) {
    const poster = useMemo(() => posterTexture(), []);
    const acc = useRef(1);
    useFrame((_, dt) => {
        acc.current += dt;
        if (acc.current < 0.3) return;
        acc.current = 0;
        const t = gRef.current.t;
        const day = dayAt(t);
        const news =
            t >= RUN_SECONDS
                ? 'NY VALUTA: RENTENMARK'
                : day >= 99
                  ? 'KUPP I MÜNCHEN'
                  : day >= 61
                    ? 'VI VIL HA BRØD!'
                    : day >= 31
                      ? 'PENGEPRESSA GÅR DØGNET RUNDT'
                      : 'RUHR OKKUPERT';
        poster.drawRate(
            t >= RUN_SECONDS ? '4,2 BILLIONER' : formatMark(dollarAt(day)).toUpperCase(),
            news
        );
    });
    return (
        <group position={[3, 0, -0.6]}>
            <mesh position={[0, 1.55, 0]} rotation-y={Math.PI * 0.62} castShadow>
                <cylinderGeometry args={[0.95, 0.95, 3, 28, 1, true]} />
                <meshStandardMaterial map={poster.tex} roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[1.05, 1.1, 0.2, 28]} />
                <meshStandardMaterial color="#2f4a3c" roughness={0.6} />
            </mesh>
            <mesh position={[0, 3.15, 0]} castShadow>
                <cylinderGeometry args={[1.12, 1.0, 0.25, 28]} />
                <meshStandardMaterial color="#2f4a3c" roughness={0.6} />
            </mesh>
            <mesh position={[0, 3.35, 0]} castShadow>
                <sphereGeometry args={[0.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#2f4a3c" roughness={0.5} metalness={0.3} />
            </mesh>
            <mesh position={[0, 4.4, 0]}>
                <coneGeometry args={[0.12, 0.5, 8]} />
                <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
        </group>
    );
}

const LAMPS: [number, number][] = [
    [-11.2, -7.6],
    [11.2, -7.6],
    [-11.4, 7.2],
    [11.4, 7.2],
    [-1.2, -7.6],
];

export function Lamps() {
    return (
        <group>
            {LAMPS.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 1.6, 0]} castShadow>
                        <cylinderGeometry args={[0.06, 0.1, 3.2, 8]} />
                        <meshStandardMaterial color="#26302c" metalness={0.5} roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 3.35, 0]}>
                        <cylinderGeometry args={[0.2, 0.12, 0.42, 6]} />
                        <meshStandardMaterial
                            color="#fff0c0"
                            emissive="#ffd27a"
                            emissiveIntensity={2.2}
                            toneMapped={false}
                        />
                    </mesh>
                    <mesh position={[0, 3.62, 0]}>
                        <coneGeometry args={[0.28, 0.22, 6]} />
                        <meshStandardMaterial color="#26302c" metalness={0.5} roughness={0.5} />
                    </mesh>
                    <group position={[0, 3.35, 0]}>
                        <GlowHalo color="#ffc970" size={0.75} opacity={0.22} />
                    </group>
                </group>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Folk: fotgjengere på plassen og køene utenfor butikkene
// ---------------------------------------------------------------------------

type Hat = 'cap' | 'bowler' | 'cloche' | 'scarf' | 'none';
interface WalkerColors {
    coat: string;
    legs: string;
    hat: string;
    skin: string;
}
const WALKER_COLORS: WalkerColors[] = [
    { coat: '#4b4038', legs: '#2a2522', hat: '#2a2522', skin: '#e2b995' },
    { coat: '#36404e', legs: '#232830', hat: '#1d1c22', skin: '#d9ad86' },
    { coat: '#5a4a3a', legs: '#2d2723', hat: '#6a5a44', skin: '#e8c3a0' },
    { coat: '#6a3b36', legs: '#2d2320', hat: '#8c6f5e', skin: '#e0b48e' },
    { coat: '#3f4d3f', legs: '#23291f', hat: '#1d1c22', skin: '#dcb18c' },
    { coat: '#7a6a58', legs: '#3a342e', hat: '#4a3e34', skin: '#e6bf9b' },
];
const HATS: Hat[] = ['cap', 'bowler', 'cloche', 'cap', 'scarf', 'bowler'];

function HatMesh({ hat, color }: { hat: Hat; color: string }) {
    if (hat === 'cap')
        return (
            <mesh position={[0, 1.66, 0.04]} scale={[1, 0.45, 1.15]}>
                <sphereGeometry args={[0.17, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
        );
    if (hat === 'bowler')
        return (
            <group position={[0, 1.66, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.2, 0.2, 0.03, 12]} />
                    <meshStandardMaterial color={color} roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.07, 0]}>
                    <sphereGeometry args={[0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={color} roughness={0.6} />
                </mesh>
            </group>
        );
    if (hat === 'cloche')
        return (
            <mesh position={[0, 1.62, 0]}>
                <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
                <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
        );
    if (hat === 'scarf')
        return (
            <mesh position={[0, 1.6, -0.01]} scale={[1.05, 1.05, 1.05]}>
                <sphereGeometry args={[0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
                <meshStandardMaterial color="#7b5a4a" roughness={1} />
            </mesh>
        );
    return null;
}

interface WalkerRefs {
    root: THREE.Object3D | null;
    l: THREE.Object3D | null;
    r: THREE.Object3D | null;
    body: THREE.Object3D | null;
}
type Bind = (k: keyof WalkerRefs, el: THREE.Object3D | null) => void;

/** En figur i frakk. Bein og kropp animeres av eieren gjennom refs. */
function Walker({
    colors,
    hat,
    position,
    rotation,
    bind,
    scale = 1,
    scarf,
}: {
    colors: WalkerColors;
    hat: Hat;
    position?: [number, number, number];
    rotation?: [number, number, number];
    bind?: Bind;
    scale?: number;
    scarf?: string;
}) {
    return (
        <group
            position={position}
            rotation={rotation}
            scale={scale}
            ref={(el) => bind?.('root', el)}
        >
            {[-1, 1].map((s) => (
                <mesh
                    key={s}
                    position={[s * 0.09, 0.42, 0]}
                    ref={(el) => bind?.(s < 0 ? 'l' : 'r', el)}
                >
                    <boxGeometry args={[0.11, 0.84, 0.13]} />
                    <meshStandardMaterial color={colors.legs} roughness={0.9} />
                </mesh>
            ))}
            <group ref={(el) => bind?.('body', el)}>
                <mesh position={[0, 1.08, 0]} castShadow>
                    <cylinderGeometry args={[0.17, 0.27, 0.95, 10]} />
                    <meshStandardMaterial color={colors.coat} roughness={0.95} />
                </mesh>
                {scarf && (
                    <mesh position={[0, 1.46, 0]}>
                        <torusGeometry args={[0.13, 0.06, 6, 12]} />
                        <meshStandardMaterial color={scarf} roughness={0.9} />
                    </mesh>
                )}
                <mesh position={[0, 1.6, 0]}>
                    <sphereGeometry args={[0.15, 8, 6]} />
                    <meshStandardMaterial color={colors.skin} roughness={0.8} />
                </mesh>
                <HatMesh hat={hat} color={colors.hat} />
            </group>
        </group>
    );
}

function Ped({ gRef, i }: { gRef: GRef; i: number }) {
    // Eieren av figuren holder refs til kropp og bein, så den kan animere dem.
    const refs = useRef<WalkerRefs>({ root: null, l: null, r: null, body: null });
    const bind = useCallback<Bind>((k, el) => {
        refs.current[k] = el;
    }, []);
    useFrame(() => {
        const g = gRef.current;
        const p = g.peds[i];
        const r = refs.current;
        if (r.root) r.root.visible = i < pedsActive(g.t);
        if (!p || !r.root) return;
        const dx = p.tx - p.x;
        const dz = p.tz - p.z;
        r.root.position.set(p.x, 0, p.z);
        if (Math.hypot(dx, dz) > 0.05) {
            const want = Math.atan2(dx, dz);
            let d = want - r.root.rotation.y;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            r.root.rotation.y += d * 0.15;
        }
        const swing = p.stumble > 0 ? 0 : Math.sin(p.phase) * 0.5;
        if (r.l) r.l.rotation.x = swing;
        if (r.r) r.r.rotation.x = -swing;
        if (r.body) {
            r.body.rotation.x = p.stumble > 0 ? -0.45 * Math.sin((p.stumble / 0.9) * Math.PI) : 0;
            r.body.position.y = Math.abs(Math.sin(p.phase)) * 0.04;
        }
    });
    return (
        <Walker
            colors={WALKER_COLORS[i % WALKER_COLORS.length]}
            hat={HATS[i % HATS.length]}
            bind={bind}
        />
    );
}

/** Lommetyven: mørk frakk, rødt skjerf og et rødt varselsmerke over hodet. */
function Thief({ gRef }: { gRef: GRef }) {
    const refs = useRef<WalkerRefs>({ root: null, l: null, r: null, body: null });
    const bind = useCallback<Bind>((k, el) => {
        refs.current[k] = el;
    }, []);
    const mark = useRef<THREE.Mesh>(null);
    const phase = useRef(0);
    useFrame(({ clock }, dt) => {
        const th = gRef.current.thief;
        const r = refs.current;
        if (!r.root) return;
        r.root.visible = th.on;
        if (mark.current) mark.current.visible = th.on;
        if (!th.on) return;
        const c = gRef.current.cart;
        const face =
            th.flee > 0 ? Math.atan2(th.x > 0 ? 1 : -1, 0.3) : Math.atan2(c.x - th.x, c.z - th.z);
        r.root.position.set(th.x, 0, th.z);
        r.root.rotation.y = face;
        phase.current += dt * 14;
        const sw = Math.sin(phase.current) * 0.8;
        if (r.l) r.l.rotation.x = sw;
        if (r.r) r.r.rotation.x = -sw;
        if (r.body) r.body.rotation.x = 0.3;
        if (mark.current) {
            mark.current.position.set(
                th.x,
                2.5 + Math.sin(clock.getElapsedTime() * 8) * 0.12,
                th.z
            );
            mark.current.rotation.y = clock.getElapsedTime() * 3;
        }
    });
    return (
        <>
            <Walker
                colors={{ coat: '#1f1d24', legs: '#141318', hat: '#141318', skin: '#d9ad86' }}
                hat="cap"
                scarf="#e0302a"
                bind={bind}
                scale={1.05}
            />
            <mesh ref={mark} rotation-x={Math.PI}>
                <coneGeometry args={[0.28, 0.55, 4]} />
                <meshStandardMaterial
                    color="#ff3b2e"
                    emissive="#ff2a1a"
                    emissiveIntensity={1.8}
                    toneMapped={false}
                />
            </mesh>
        </>
    );
}

export function Crowd({ gRef }: { gRef: GRef }) {
    return (
        <group>
            <Thief gRef={gRef} />
            {Array.from({ length: PED_COUNT }, (_, i) => (
                <Ped key={i} gRef={gRef} i={i} />
            ))}
        </group>
    );
}

// Køplassene står langs veggen ved siden av døra, vekk fra kjørefeltet.
const QUEUE_SPOTS: Record<
    'bakeri' | 'kullhandel' | 'marked',
    (i: number) => [number, number, number]
> = {
    bakeri: (i) => [-WALL_SIDE + 0.75, 0, STATIONS.bakeri.door[1] + 1.3 + i * 0.62],
    kullhandel: (i) => [STATIONS.kullhandel.door[0] + 1.2 + i * 0.62, 0, WALL_BACK + 0.75],
    marked: (i) => [STATIONS.marked.door[0] - 1.6 - i * 0.6, 0, STATIONS.marked.door[1] + 1.2],
};
const QUEUE_FACE: Record<'bakeri' | 'kullhandel' | 'marked', number> = {
    bakeri: Math.PI,
    kullhandel: -Math.PI / 2,
    marked: Math.PI / 2,
};

function QueueLine({ gRef, id }: { gRef: GRef; id: 'bakeri' | 'kullhandel' | 'marked' }) {
    const group = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        const n = gRef.current.queue[id];
        const grp = group.current;
        if (!grp) return;
        grp.children.forEach((c, i) => {
            c.visible = i < n;
            c.rotation.z = Math.sin(clock.getElapsedTime() * 1.3 + i * 1.7) * 0.03;
        });
    });
    return (
        <group ref={group}>
            {Array.from({ length: 6 }, (_, i) => (
                <group key={i} position={QUEUE_SPOTS[id](i)} rotation-y={QUEUE_FACE[id]}>
                    <Walker
                        colors={WALKER_COLORS[(i + 2) % WALKER_COLORS.length]}
                        hat={HATS[(i + 3) % HATS.length]}
                        scale={0.95}
                    />
                </group>
            ))}
        </group>
    );
}

export function Queues({ gRef }: { gRef: GRef }) {
    return (
        <>
            <QueueLine gRef={gRef} id="bakeri" />
            <QueueLine gRef={gRef} id="kullhandel" />
            <QueueLine gRef={gRef} id="marked" />
        </>
    );
}

// ---------------------------------------------------------------------------
// Kjerra og eleven
// ---------------------------------------------------------------------------

const GOOD_COLOR: Record<Good, string> = { brod: '#b9793a', poteter: '#b39a6a', kull: '#232225' };

function GoodMesh({ good }: { good: Good }) {
    if (good === 'brod')
        return (
            <mesh scale={[1, 0.6, 1.5]} castShadow>
                <sphereGeometry args={[0.14, 10, 8]} />
                <meshStandardMaterial color={GOOD_COLOR.brod} roughness={0.7} />
            </mesh>
        );
    if (good === 'poteter')
        return (
            <mesh scale={[1, 0.8, 1]} castShadow>
                <sphereGeometry args={[0.16, 8, 6]} />
                <meshStandardMaterial color={GOOD_COLOR.poteter} roughness={1} />
            </mesh>
        );
    return (
        <mesh castShadow>
            <dodecahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial color={GOOD_COLOR.kull} roughness={0.5} metalness={0.2} />
        </mesh>
    );
}

const ITEM_SLOTS: [number, number][] = Array.from({ length: CART_CAP }, (_, i) => [
    -0.18 + (i % 2) * 0.36,
    -0.36 + Math.floor(i / 2) * 0.24,
]);

export function PlayerCart({ gRef }: { gRef: GRef }) {
    const root = useRef<THREE.Group>(null);
    const wheels = useRef<THREE.Group>(null);
    const bundles = useRef<THREE.Group>(null);
    const items = useRef<THREE.Group>(null);
    const tagMesh = useRef<THREE.Sprite>(null);
    const kid = useRef<WalkerRefs>({ root: null, l: null, r: null, body: null });
    const bindKid = useCallback<Bind>((k, el) => {
        kid.current[k] = el;
    }, []);
    const tag = useMemo(() => makeTag(), []);
    const noteTex = useMemo(() => noteTexture('MARK'), []);
    const fresh = useMemo(() => C('#ffffff'), []);
    const stale = useMemo(() => C('#6b6660'), []);
    const lastTag = useRef('');
    const bundleMats = useRef<THREE.MeshStandardMaterial[]>([]);
    const phase = useRef(0);
    useFrame((_, dt) => {
        const g = gRef.current;
        const c = g.cart;
        const r = root.current;
        if (!r) return;
        r.position.set(c.x, 0, c.z);
        r.rotation.y = c.heading;
        const sp = Math.hypot(c.vx, c.vz);
        wheels.current?.children.forEach((w) => (w.rotation.x = c.wheel));
        // Barnet som skyver: bein i takt med farten.
        phase.current += sp * dt * 3.2;
        const k = kid.current;
        const swing = sp > 0.3 ? Math.sin(phase.current) * 0.6 : 0;
        if (k.l) k.l.rotation.x = swing;
        if (k.r) k.r.rotation.x = -swing;
        if (k.body) k.body.rotation.x = Math.min(0.35, sp * 0.05);
        // Seddelbuntene: flere når lønna er stor, gråere jo mindre de er verdt.
        const n = bundleCount(g);
        const fade = cashFade(g);
        bundles.current?.children.forEach((b, i) => {
            b.visible = i < n;
        });
        bundleMats.current.forEach((m) => m.color.copy(fresh).lerp(stale, fade));
        // Varene i kjerra.
        const grp = items.current;
        if (grp)
            grp.children.forEach((ch, i) => {
                const it = g.items[i];
                ch.visible = !!it;
                if (!it) return;
                const age = g.t - it.born;
                const s = age < 0.25 ? 0.3 + (age / 0.25) * 0.9 : 1;
                ch.scale.setScalar(s);
                ch.children.forEach(
                    (m, j) =>
                        (m.visible = j === (it.good === 'brod' ? 0 : it.good === 'poteter' ? 1 : 2))
                );
            });
        // Merkelappen over kjerra: hva sedlene er verdt i brød akkurat nå.
        const bread = cashInBread(g);
        let text = '';
        let color = '#7ccf5b';
        if (g.cash > 0) {
            if (canAfford(g, 'brod')) {
                text = `= ${bread.toFixed(1).replace('.', ',')} BRØD`;
                color = fade < 0.35 ? '#7ccf5b' : fade < 0.65 ? '#f2c233' : '#e5483a';
            } else {
                text = 'VERDILØST';
                color = '#e5483a';
            }
        }
        if (text !== lastTag.current) {
            lastTag.current = text;
            if (text) tag.draw(text, color);
        }
        if (tagMesh.current) {
            tagMesh.current.visible = !!text;
            tagMesh.current.position.set(c.x, 3.1, c.z);
        }
    });
    return (
        <>
            <group ref={root} scale={1.45}>
                {/* ring under kjerra: her er du */}
                <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
                    <ringGeometry args={[1.05, 1.28, 32]} />
                    <meshBasicMaterial
                        color="#ffe27a"
                        transparent
                        opacity={0.75}
                        toneMapped={false}
                        depthWrite={false}
                    />
                </mesh>
                {/* kjerra */}
                <group position={[0, 0, 0.35]}>
                    <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.95, 0.12, 1.25]} />
                        <meshStandardMaterial color="#b0432f" roughness={0.8} />
                    </mesh>
                    {[
                        [-0.48, 0],
                        [0.48, 0],
                    ].map(([x], i) => (
                        <mesh key={i} position={[x, 0.75, 0]} castShadow>
                            <boxGeometry args={[0.06, 0.32, 1.25]} />
                            <meshStandardMaterial color="#8f3526" roughness={0.8} />
                        </mesh>
                    ))}
                    <mesh position={[0, 0.75, 0.6]} castShadow>
                        <boxGeometry args={[0.95, 0.32, 0.06]} />
                        <meshStandardMaterial color="#8f3526" roughness={0.8} />
                    </mesh>
                    {[-0.3, 0.3].map((x) => (
                        <mesh key={x} position={[x, 0.72, -0.95]} rotation-x={-0.35}>
                            <cylinderGeometry args={[0.035, 0.035, 0.8, 6]} />
                            <meshStandardMaterial color="#5a3e26" />
                        </mesh>
                    ))}
                    <group ref={wheels}>
                        {[-0.55, 0.55].map((x) => (
                            <group key={x} position={[x, 0.36, 0.1]}>
                                <mesh rotation-z={Math.PI / 2} castShadow>
                                    <cylinderGeometry args={[0.36, 0.36, 0.07, 14]} />
                                    <meshStandardMaterial color="#3a2a1e" roughness={0.8} />
                                </mesh>
                                <mesh rotation-z={Math.PI / 2}>
                                    <boxGeometry args={[0.02, 0.08, 0.66]} />
                                    <meshStandardMaterial color="#8a6a44" />
                                </mesh>
                            </group>
                        ))}
                    </group>
                    <group ref={bundles}>
                        {Array.from({ length: 14 }, (_, i) => (
                            <mesh
                                key={i}
                                position={[
                                    -0.22 + (i % 2) * 0.44,
                                    0.7 + Math.floor(i / 6) * 0.17,
                                    -0.42 + (Math.floor(i / 2) % 3) * 0.42,
                                ]}
                                rotation-y={(i % 3) * 0.2 - 0.2}
                                castShadow
                            >
                                <boxGeometry args={[0.42, 0.16, 0.26]} />
                                <meshStandardMaterial
                                    ref={(m) => {
                                        if (m && !bundleMats.current.includes(m))
                                            bundleMats.current.push(m);
                                    }}
                                    map={noteTex}
                                    roughness={0.9}
                                />
                            </mesh>
                        ))}
                    </group>
                    <group ref={items} position={[0, 0.78, 0.12]}>
                        {ITEM_SLOTS.map(([x, z], i) => (
                            <group key={i} position={[x, 0.12 + (i >= 6 ? 0.12 : 0), z]}>
                                <GoodMesh good="brod" />
                                <GoodMesh good="poteter" />
                                <GoodMesh good="kull" />
                            </group>
                        ))}
                    </group>
                </group>
                <Walker
                    colors={{ coat: '#3b4a5c', legs: '#2a2522', hat: '#2d2a2a', skin: '#ecc6a2' }}
                    hat="cap"
                    position={[0, 0, -1.05]}
                    scale={0.82}
                    bind={bindKid}
                    scarf="#d0342c"
                />
            </group>
            <sprite ref={tagMesh} scale={[2.2, 0.62, 1]} renderOrder={10}>
                <spriteMaterial map={tag.tex} depthTest={false} transparent toneMapped={false} />
            </sprite>
        </>
    );
}

// ---------------------------------------------------------------------------
// Veivisning: ring ved stedet som gir mening nå, og linje dit kjerra kjører
// ---------------------------------------------------------------------------

function suggested(g: G): StationId[] {
    if (g.payReady > 0 && !canAfford(g, 'brod')) return ['fabrikk'];
    if (canAfford(g, 'brod') && g.items.length < CART_CAP)
        return (['bakeri', 'marked', 'kullhandel'] as StationId[]).filter((id) => !isClosed(g, id));
    if (g.items.length) return ['hjem'];
    return ['fabrikk'];
}

const RING_IDS: StationId[] = ['fabrikk', 'bakeri', 'marked', 'kullhandel', 'hjem'];

export function Guides({ gRef, active }: { gRef: GRef; active: boolean }) {
    const rings = useRef<(THREE.Group | null)[]>([]);
    const dash = useRef<THREE.InstancedMesh>(null);
    const target = useRef<THREE.Mesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame(({ clock }) => {
        const g = gRef.current;
        const on = active ? suggested(g) : [];
        const t = clock.getElapsedTime();
        RING_IDS.forEach((id, i) => {
            const r = rings.current[i];
            if (!r) return;
            r.visible = on.includes(id);
            const s = 1 + Math.sin(t * 5 + i) * 0.08;
            r.scale.set(s, 1, s);
            const arrow = r.children[1];
            if (arrow) arrow.position.y = 2.1 + Math.sin(t * 4 + i) * 0.2;
        });
        const d = dash.current;
        if (d) {
            let n = 0;
            if (active && g.target) {
                const dx = g.target.x - g.cart.x;
                const dz = g.target.z - g.cart.z;
                const len = Math.hypot(dx, dz);
                const steps = Math.min(40, Math.floor(len / 0.6));
                for (let k = 1; k < steps; k++) {
                    const f = k / steps;
                    o.position.set(g.cart.x + dx * f, 0.03, g.cart.z + dz * f);
                    o.rotation.set(-Math.PI / 2, 0, -Math.atan2(dz, dx));
                    o.updateMatrix();
                    d.setMatrixAt(n++, o.matrix);
                }
            }
            d.count = n;
            d.instanceMatrix.needsUpdate = true;
        }
        if (target.current) {
            target.current.visible = active && !!g.target;
            if (g.target) target.current.position.set(g.target.x, 0.04, g.target.z);
            target.current.rotation.z = t * 2;
        }
    });
    return (
        <group>
            {RING_IDS.map((id, i) => {
                const [x, z] = STATIONS[id].door;
                return (
                    <group
                        key={id}
                        position={[x, 0, z]}
                        ref={(el) => {
                            rings.current[i] = el;
                        }}
                    >
                        <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
                            <ringGeometry args={[1.25, 1.55, 36]} />
                            <meshBasicMaterial
                                color="#ffd23a"
                                transparent
                                opacity={0.85}
                                toneMapped={false}
                            />
                        </mesh>
                        <mesh position={[0, 2.1, 0]} rotation-x={Math.PI}>
                            <coneGeometry args={[0.32, 0.6, 4]} />
                            <meshStandardMaterial
                                color="#ffd23a"
                                emissive="#ffb000"
                                emissiveIntensity={1.4}
                                toneMapped={false}
                            />
                        </mesh>
                    </group>
                );
            })}
            <instancedMesh ref={dash} args={[undefined, undefined, 40]}>
                <planeGeometry args={[0.28, 0.1]} />
                <meshBasicMaterial color="#fff3c4" transparent opacity={0.8} toneMapped={false} />
            </instancedMesh>
            <mesh ref={target} rotation-x={-Math.PI / 2}>
                <ringGeometry args={[0.3, 0.42, 4]} />
                <meshBasicMaterial color="#fff3c4" transparent opacity={0.9} toneMapped={false} />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Store skilt over dørene: navn og pris akkurat nå, alltid vendt mot kameraet
// ---------------------------------------------------------------------------

const LABEL_STYLE = {
    bg: '#1d1c22',
    fg: '#f4efe4',
    accent: '#f2b441',
    border: '#f2b441',
    sizes: [0.4, 0.3],
};
const LABELS: { id: StationId; name: string; lift: [number, number] }[] = [
    { id: 'fabrikk', name: 'LØNN', lift: [0, -0.6] },
    { id: 'kullhandel', name: 'KULL', lift: [0, -0.6] },
    { id: 'bakeri', name: 'BAKER', lift: [1.1, 0] },
    { id: 'marked', name: 'POTETER', lift: [0, 0.6] },
    { id: 'hjem', name: 'HJEM', lift: [-1.7, 0] },
];

function StationLabel({
    gRef,
    id,
    name,
    lift,
}: {
    gRef: GRef;
    id: StationId;
    name: string;
    lift: [number, number];
}) {
    const board = useMemo(() => makeBoard(384, 160, LABEL_STYLE), []);
    const acc = useRef(1);
    const last = useRef('');
    useFrame((_, dt) => {
        acc.current += dt;
        if (acc.current < 0.25) return;
        acc.current = 0;
        const g = gRef.current;
        let sub: string;
        const good = STATIONS[id].good;
        if (good)
            sub = isClosed(g, id)
                ? 'STENGT'
                : g.t >= RUN_SECONDS
                  ? 'RENTENMARK'
                  : formatMark(priceAt(good, g.t)) + ' M';
        else if (id === 'fabrikk')
            sub =
                g.payReady > 0
                    ? 'LØNNA ER KLAR'
                    : `om ${Math.max(0, Math.ceil(g.nextPay - g.t))} s`;
        else sub = g.items.length ? 'LEVER HER' : 'familien';
        const k = name + '|' + sub;
        if (k !== last.current) {
            last.current = k;
            board.draw([name, sub]);
        }
    });
    const [x, z] = STATIONS[id].door;
    return (
        <sprite position={[x + lift[0], 3.7, z + lift[1]]} scale={[3.5, 1.46, 1]} renderOrder={5}>
            <spriteMaterial map={board.tex} toneMapped={false} />
        </sprite>
    );
}

export function StationLabels({ gRef }: { gRef: GRef }) {
    return (
        <group>
            {LABELS.map((l) => (
                <StationLabel key={l.id} gRef={gRef} {...l} />
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Partikler: sedler som flagrer, varer som flyr, samlesedler på bakken
// ---------------------------------------------------------------------------

export function ParticleView({ gRef }: { gRef: GRef }) {
    const notes = useRef<THREE.InstancedMesh>(null);
    const flyers = useRef<Record<Good, THREE.InstancedMesh | null>>({
        brod: null,
        poteter: null,
        kull: null,
    });
    const noteTex = useMemo(() => noteTexture('MARK'), []);
    const o = useMemo(() => new THREE.Object3D(), []);
    const col = useMemo(() => new THREE.Color(), []);
    useFrame(() => {
        const g = gRef.current;
        let n = 0;
        const cnt: Record<Good, number> = { brod: 0, poteter: 0, kull: 0 };
        const nm = notes.current;
        for (const p of g.particles) {
            if (p.kind === 'note' && nm && n < 200) {
                o.position.set(p.x, p.y, p.z);
                o.rotation.set(p.life * 5, p.life * 3.3, p.life * 2);
                o.scale.setScalar(Math.min(1, p.life * 2));
                o.updateMatrix();
                nm.setMatrixAt(n, o.matrix);
                nm.setColorAt(n, col.setHex(p.color));
                n++;
            } else if (p.kind === 'fly' && p.good) {
                const m = flyers.current[p.good];
                if (!m || cnt[p.good] >= 24) continue;
                o.position.set(p.x, p.y, p.z);
                o.rotation.set(p.life * 8, p.life * 6, 0);
                o.scale.setScalar(1);
                o.updateMatrix();
                m.setMatrixAt(cnt[p.good]++, o.matrix);
            }
        }
        if (nm) {
            nm.count = n;
            nm.instanceMatrix.needsUpdate = true;
            if (nm.instanceColor) nm.instanceColor.needsUpdate = true;
        }
        (Object.keys(cnt) as Good[]).forEach((k) => {
            const m = flyers.current[k];
            if (!m) return;
            m.count = cnt[k];
            m.instanceMatrix.needsUpdate = true;
        });
    });
    return (
        <group>
            <instancedMesh ref={notes} args={[undefined, undefined, 200]}>
                <planeGeometry args={[0.34, 0.17]} />
                <meshStandardMaterial map={noteTex} side={THREE.DoubleSide} roughness={0.9} />
            </instancedMesh>
            {(['brod', 'poteter', 'kull'] as Good[]).map((k) => (
                <instancedMesh
                    key={k}
                    ref={(el) => {
                        flyers.current[k] = el;
                    }}
                    args={[undefined, undefined, 24]}
                >
                    {k === 'kull' ? (
                        <dodecahedronGeometry args={[0.18, 0]} />
                    ) : (
                        <sphereGeometry args={[0.17, 8, 6]} />
                    )}
                    <meshStandardMaterial color={GOOD_COLOR[k]} roughness={0.8} />
                </instancedMesh>
            ))}
        </group>
    );
}

export function SeddelView({ gRef }: { gRef: GRef }) {
    const group = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const texs = useMemo(() => {
        const labels: Record<string, [string, 'gronn' | 'lilla' | 'brun']> = {
            '100k': ['100 000', 'brun'],
            '1m': ['1 MILLION', 'gronn'],
            '10m': ['10 MILL.', 'lilla'],
            '100m': ['100 MILL.', 'gronn'],
            '1mrd': ['1 MILLIARD', 'lilla'],
            '100mrd': ['100 MRD.', 'brun'],
            '1bill': ['1 BILLION', 'gronn'],
            renten: ['RENTENMARK', 'brun'],
        };
        return Object.fromEntries(SEDLER.map((s) => [s.id, noteTexture(...labels[s.id])]));
    }, []);
    const lastId = useRef('');
    useFrame(({ clock }) => {
        const g = gRef.current;
        const grp = group.current;
        if (!grp) return;
        const s = g.seddel;
        grp.visible = !!s;
        if (!s) return;
        const t = clock.getElapsedTime();
        grp.position.set(s.x, 0.5 + Math.sin(t * 3) * 0.12, s.z);
        grp.rotation.y = t * 1.4;
        if (mat.current && lastId.current !== s.s.id) {
            lastId.current = s.s.id;
            mat.current.map = texs[s.s.id];
            mat.current.emissiveMap = texs[s.s.id];
            mat.current.needsUpdate = true;
        }
    });
    return (
        <group ref={group} visible={false}>
            <mesh rotation-x={-0.9}>
                <planeGeometry args={[1.1, 0.55]} />
                <meshStandardMaterial
                    ref={mat}
                    side={THREE.DoubleSide}
                    emissive="#ffffff"
                    emissiveIntensity={0.55}
                    roughness={0.6}
                />
            </mesh>
            <GlowHalo color="#d8a8ff" size={0.9} opacity={0.3} />
            <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.14, 0.4, 3.6, 12, 1, true]} />
                <meshBasicMaterial
                    color="#e2c2ff"
                    transparent
                    opacity={0.22}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Vær og vind: løv i oktober, snø i november, sedler som blåser over plassen
// ---------------------------------------------------------------------------

const DRIFT = Array.from({ length: 10 }, (_, i) => ({
    z: -6 + (i * 13) / 10,
    y: 0.4 + (i % 3) * 0.5,
    speed: 1.6 + (i % 4) * 0.5,
    off: i * 3.7,
}));

export function Weather({ gRef }: { gRef: GRef }) {
    const leaves = useRef<THREE.Group>(null);
    const snow = useRef<THREE.Group>(null);
    const drift = useRef<THREE.InstancedMesh>(null);
    const noteTex = useMemo(() => noteTexture('MARK', 'lilla'), []);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame(({ clock }) => {
        const day = dayAt(gRef.current.t);
        if (leaves.current) leaves.current.visible = day > 50 && day < 96;
        if (snow.current) snow.current.visible = day >= 92;
        const d = drift.current;
        if (!d) return;
        const t = clock.getElapsedTime();
        const n = Math.min(DRIFT.length, 3 + Math.floor((day / DAYS) * DRIFT.length));
        for (let i = 0; i < n; i++) {
            const k = DRIFT[i];
            const x = ((t * k.speed + k.off * 4) % 34) - 17;
            o.position.set(x, k.y + Math.sin(t * 2.3 + i) * 0.3, k.z + Math.sin(t * 0.7 + i) * 0.6);
            o.rotation.set(t * 3 + i, t * 2 + i, t * 1.3);
            o.updateMatrix();
            d.setMatrixAt(i, o.matrix);
        }
        d.count = n;
        d.instanceMatrix.needsUpdate = true;
    });
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            <group ref={leaves} visible={false}>
                <Particles preset="leaves" area={[30, 18]} height={9} count={40} />
            </group>
            <group ref={snow} visible={false}>
                <Particles preset="snow" area={[32, 20]} height={12} />
            </group>
            <instancedMesh ref={drift} args={[undefined, undefined, DRIFT.length]}>
                <planeGeometry args={[0.34, 0.17]} />
                <meshStandardMaterial map={noteTex} side={THREE.DoubleSide} roughness={0.9} />
            </instancedMesh>
        </group>
    );
}
