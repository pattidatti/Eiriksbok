import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Et VOC-skip i 3D, bygd av enkle former. Fire modus:
 * «hjem»: skipet seiler hjem mot Nederland med krydder, og flere skip legger ut.
 * «oy»: Krydderøyene, med muskattrær og til slutt et VOC-fort.
 * «last»: skipet åpnet ovenfra, og lasterommet fylles vare for vare.
 * «storm»: storm på den lange reisen, et fremmed skip i disen, og så stilner det.
 */

type Modus = 'hjem' | 'oy' | 'last' | 'storm';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

/** Skipet ligger langs x-aksen med baugen mot +x. Dekket er i y = 2.2. */
function kameraFor(modus: Modus, beat: number, t: number, skipX: number): Kamera {
    if (modus === 'hjem') {
        switch (beat) {
            case 0:
                return { pos: v(skipX - 30 + t * 0.3, 9, 32), se: v(skipX + 4, 4, 0) };
            case 1:
                return { pos: v(skipX + 20, 5, 15), se: v(skipX, 4, 0) };
            case 2:
                return { pos: v(skipX + 3, 9, 9), se: v(skipX - 1, 2.4, 0) };
            default:
                return { pos: v(skipX - 20, 16, 46), se: v(skipX + 6, 2, -6) };
        }
    }
    if (modus === 'oy') {
        switch (beat) {
            case 0:
                return { pos: v(-10 + t * 0.4, 22, 62), se: v(0, 2, 0) };
            case 1:
                return { pos: v(-2, 9, 22), se: v(-4, 4, 6) };
            default:
                return { pos: v(26, 14, 40), se: v(8, 3, 6) };
        }
    }
    if (modus === 'last') {
        const fokus = [-4, -0.5, 2.5, 5][Math.min(beat, 3)];
        return { pos: v(fokus - 2.5, 6.5, 7.5), se: v(fokus, 0, 0) };
    }
    switch (beat) {
        case 0:
            return { pos: v(-22, 8, 22), se: v(0, 3, 0) };
        case 1:
            return { pos: v(-14, 6, 20), se: v(10, 3, -8) };
        default:
            return { pos: v(-28 + t * 0.3, 10, 30), se: v(2, 3, 0) };
    }
}

const mat = {
    skrog: new THREE.MeshStandardMaterial({ color: '#5b3a1e', roughness: 0.85, flatShading: true }),
    stripe: new THREE.MeshStandardMaterial({ color: '#c9a227', roughness: 0.7 }),
    dekk: new THREE.MeshStandardMaterial({ color: '#a07850', roughness: 0.9 }),
    mast: new THREE.MeshStandardMaterial({ color: '#3f2a17', roughness: 0.9 }),
    seil: new THREE.MeshStandardMaterial({
        color: '#f4ecd8',
        emissive: '#5a5040',
        emissiveIntensity: 0.25,
        roughness: 0.9,
        side: THREE.DoubleSide,
    }),
    morkSeil: new THREE.MeshStandardMaterial({
        color: '#7f1d1d',
        emissive: '#3b0a0a',
        roughness: 0.9,
        side: THREE.DoubleSide,
    }),
    rod: new THREE.MeshStandardMaterial({ color: '#c8102e' }),
    hvit: new THREE.MeshStandardMaterial({ color: '#f5f5f5' }),
    bla: new THREE.MeshStandardMaterial({ color: '#1e3a8a' }),
    oransje: new THREE.MeshStandardMaterial({ color: '#ea580c' }),
    sekk: new THREE.MeshStandardMaterial({ color: '#b08440', roughness: 1, flatShading: true }),
    morkSekk: new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 1, flatShading: true }),
    kiste: new THREE.MeshStandardMaterial({ color: '#7a4a24', roughness: 0.8 }),
    porselen: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 }),
    sand: new THREE.MeshStandardMaterial({ color: '#e8d6a0', roughness: 1 }),
    gress: new THREE.MeshStandardMaterial({ color: '#4d8a3a', roughness: 1, flatShading: true }),
    fjell: new THREE.MeshStandardMaterial({ color: '#5f6f4e', roughness: 1, flatShading: true }),
    tre: new THREE.MeshStandardMaterial({ color: '#2f6b2a', roughness: 1, flatShading: true }),
    stamme: new THREE.MeshStandardMaterial({ color: '#5b4026' }),
    muskat: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        emissive: '#b45309',
        emissiveIntensity: 0.6,
    }),
    mur: new THREE.MeshStandardMaterial({ color: '#d6cbb3', roughness: 1, flatShading: true }),
    kystland: new THREE.MeshStandardMaterial({ color: '#7fa05a', roughness: 1 }),
};

const STOFF = ['#b91c1c', '#1e40af', '#f5f5f4', '#7e22ce', '#ca8a04', '#0f766e'].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 })
);

/** Sideprofilen av en østindiafarer: lav baug, høy akter. */
function profil() {
    const s = new THREE.Shape();
    s.moveTo(-6, -0.8);
    s.lineTo(5, -0.8);
    s.lineTo(7.6, 2.4);
    s.lineTo(4.5, 2.2);
    s.lineTo(-4.4, 2.2);
    s.lineTo(-4.6, 3.6);
    s.lineTo(-7.3, 4.1);
    s.lineTo(-7.0, 0.6);
    s.closePath();
    return s;
}

function Skrog({ apen }: { apen: boolean }) {
    const hel = useMemo(() => {
        const g = new THREE.ExtrudeGeometry(profil(), { depth: 3.6, bevelEnabled: false });
        g.translate(0, 0, -1.8);
        return g;
    }, []);
    const vegg = useMemo(() => {
        const g = new THREE.ExtrudeGeometry(profil(), { depth: 0.25, bevelEnabled: false });
        g.translate(0, 0, -0.125);
        return g;
    }, []);
    if (apen) {
        return (
            <group>
                <mesh geometry={vegg} material={mat.skrog} position={[0, 0, -1.7]} />
                {/* Nær side: skåret ned, så lasten synes */}
                <mesh material={mat.skrog} position={[-0.5, -0.2, 1.7]}>
                    <boxGeometry args={[12.6, 1.2, 0.25]} />
                </mesh>
                <mesh material={mat.dekk} position={[-0.5, -0.65, 0]}>
                    <boxGeometry args={[11, 0.3, 3.4]} />
                </mesh>
                <mesh material={mat.skrog} position={[-6.6, 1.6, 0]}>
                    <boxGeometry args={[0.6, 4.6, 3.6]} />
                </mesh>
                <mesh material={mat.skrog} position={[5.8, 0.6, 0]}>
                    <boxGeometry args={[0.5, 2.6, 3.4]} />
                </mesh>
            </group>
        );
    }
    return (
        <group>
            <mesh geometry={hel} material={mat.skrog} />
            <mesh material={mat.stripe} position={[-0.5, 1.5, 0]}>
                <boxGeometry args={[11.6, 0.25, 3.65]} />
            </mesh>
            <mesh material={mat.dekk} position={[0, 2.22, 0]}>
                <boxGeometry args={[8.8, 0.06, 3.4]} />
            </mesh>
        </group>
    );
}

/** Master, seil og flagg. `pirat` gir mørke seil og ikke noe flagg. */
function Rigg({ pirat = false }: { pirat?: boolean }) {
    const seil = pirat ? mat.morkSeil : mat.seil;
    const master = [
        { x: 4, h: 10, b: 3.6 },
        { x: 0.4, h: 12, b: 4.4 },
        { x: -3.6, h: 9, b: 3.2 },
    ];
    return (
        <group>
            {master.map((m) => (
                <group key={m.x} position={[m.x, 2.2, 0]}>
                    <mesh material={mat.mast} position={[0, m.h / 2, 0]}>
                        <cylinderGeometry args={[0.1, 0.14, m.h, 6]} />
                    </mesh>
                    <mesh
                        material={seil}
                        position={[0.15, m.h * 0.38, 0]}
                        rotation={[0, Math.PI / 2, 0]}
                    >
                        <planeGeometry args={[m.b, m.h * 0.32]} />
                    </mesh>
                    <mesh
                        material={seil}
                        position={[0.15, m.h * 0.75, 0]}
                        rotation={[0, Math.PI / 2, 0]}
                    >
                        <planeGeometry args={[m.b * 0.75, m.h * 0.25]} />
                    </mesh>
                </group>
            ))}
            {/* Baugspryd */}
            <mesh material={mat.mast} position={[8.4, 3.2, 0]} rotation={[0, 0, -1.2]}>
                <cylinderGeometry args={[0.07, 0.09, 3, 6]} />
            </mesh>
            {!pirat && (
                <group position={[-7.1, 4.6, 0]}>
                    <mesh material={mat.mast} position={[0, 0.6, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, 2.2, 5]} />
                    </mesh>
                    {[mat.rod, mat.hvit, mat.bla].map((m, i) => (
                        <mesh key={i} material={m} position={[-0.7, 1.5 - i * 0.3, 0]}>
                            <boxGeometry args={[1.4, 0.3, 0.04]} />
                        </mesh>
                    ))}
                </group>
            )}
        </group>
    );
}

function Skip({ apen = false, pirat = false }: { apen?: boolean; pirat?: boolean }) {
    return (
        <group>
            <Skrog apen={apen} />
            {!apen && <Rigg pirat={pirat} />}
        </group>
    );
}

/** Krydder i sekker på dekk (hjem) eller i lasterommet. */
function Sekker({
    n,
    mat: m,
    x0,
    y,
    bredde,
}: {
    n: number;
    mat: THREE.Material;
    x0: number;
    y: number;
    bredde: number;
}) {
    return (
        <>
            {Array.from({ length: n }, (_, i) => (
                <mesh
                    key={i}
                    material={m}
                    position={[
                        x0 + (i % 4) * (bredde / 4),
                        y + Math.floor(i / 8) * 0.55,
                        -1.1 + (Math.floor(i / 4) % 2) * 1.4 + ((i * 7) % 3) * 0.2,
                    ]}
                    scale={[0.55, 0.42, 0.5]}
                >
                    <dodecahedronGeometry args={[0.7, 0]} />
                </mesh>
            ))}
        </>
    );
}

/** Lasterommet, vare for vare. */
function Last({ beat }: { beat: number }) {
    return (
        <group>
            {/* Krydder */}
            <Sekker n={16} mat={mat.sekk} x0={-5.6} y={-0.15} bredde={3.2} />
            {/* Stoffruller */}
            {beat >= 1 &&
                Array.from({ length: 12 }, (_, i) => (
                    <mesh
                        key={i}
                        material={STOFF[i % STOFF.length]}
                        position={[
                            -2 + (i % 3) * 0.95,
                            -0.2 + Math.floor(i / 6) * 0.5,
                            -1.2 + (Math.floor(i / 3) % 2) * 1.2 + (i >= 6 ? 0.6 : 0),
                        ]}
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <cylinderGeometry args={[0.24, 0.24, 1.0, 10]} />
                    </mesh>
                ))}
            {/* Tekister og kaffesekker */}
            {beat >= 2 && (
                <>
                    {Array.from({ length: 6 }, (_, i) => (
                        <mesh
                            key={i}
                            material={mat.kiste}
                            position={[
                                1.4 + (i % 2) * 0.9,
                                -0.1 + Math.floor(i / 4) * 0.8,
                                -1.1 + (Math.floor(i / 2) % 2) * 2.2,
                            ]}
                        >
                            <boxGeometry args={[0.8, 0.8, 0.8]} />
                        </mesh>
                    ))}
                    <Sekker n={6} mat={mat.morkSekk} x0={2} y={-0.15} bredde={1.8} />
                </>
            )}
            {/* Porselen */}
            {beat >= 3 &&
                Array.from({ length: 8 }, (_, i) => (
                    <group
                        key={i}
                        position={[3.9 + (i % 4) * 0.45, -0.1, -0.9 + Math.floor(i / 4) * 1.6]}
                    >
                        <mesh material={mat.porselen} position={[0, 0.35, 0]}>
                            <cylinderGeometry args={[0.16, 0.22, 0.8, 12]} />
                        </mesh>
                        <mesh material={mat.bla} position={[0, 0.45, 0]}>
                            <cylinderGeometry args={[0.2, 0.2, 0.12, 12]} />
                        </mesh>
                    </group>
                ))}
        </group>
    );
}

/** Krydderøya: sandstrand, grønt land, en vulkan og muskattrær. */
function Oy({ beat, tid }: { beat: number; tid: React.RefObject<number> }) {
    const traer = useMemo(
        () =>
            Array.from({ length: 18 }, (_, i) => {
                const a = i * 2.4;
                const r = 4 + ((i * 13) % 9);
                return { x: -4 + Math.cos(a) * r, z: 6 + Math.sin(a) * r * 0.6 };
            }),
        []
    );
    const glod = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(() => {
        if (glod.current) {
            const t = tid.current ?? 0;
            glod.current.emissiveIntensity = beat === 1 ? 0.6 + Math.sin(t * 3) * 0.4 : 0.4;
        }
    });
    return (
        <group>
            <mesh material={mat.sand} position={[0, -0.2, 0]}>
                <cylinderGeometry args={[24, 26, 1, 20]} />
            </mesh>
            <mesh material={mat.gress} position={[-2, 0.4, -2]}>
                <cylinderGeometry args={[20, 22, 1, 20]} />
            </mesh>
            <mesh material={mat.fjell} position={[-10, 6, -12]}>
                <coneGeometry args={[11, 13, 9]} />
            </mesh>
            {traer.map((t, i) => (
                <group key={i} position={[t.x, 0.9, t.z]}>
                    <mesh material={mat.stamme} position={[0, 1, 0]}>
                        <cylinderGeometry args={[0.15, 0.2, 2, 5]} />
                    </mesh>
                    <mesh material={mat.tre} position={[0, 2.8, 0]}>
                        <icosahedronGeometry args={[1.3, 0]} />
                    </mesh>
                    {[0, 1, 2].map((k) => (
                        <mesh
                            key={k}
                            position={[
                                Math.cos(k * 2.1 + i) * 1.1,
                                2.6 + (k % 2) * 0.6,
                                Math.sin(k * 2.1 + i) * 1.1,
                            ]}
                        >
                            <sphereGeometry args={[0.22, 6, 5]} />
                            <meshStandardMaterial
                                ref={i === 0 && k === 0 ? glod : undefined}
                                color="#f59e0b"
                                emissive="#b45309"
                                emissiveIntensity={0.5}
                            />
                        </mesh>
                    ))}
                </group>
            ))}
            {beat >= 2 && <Fort />}
        </group>
    );
}

/** Et firkantet fort med bastioner i hjørnene og VOC-flagg. */
function Fort() {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (ref.current) ref.current.scale.y = damp(ref.current.scale.y, 1, 3, Math.max(dt, 0.016));
    });
    return (
        <group ref={ref} position={[10, 0.9, 10]} scale={[1, 0.01, 1]}>
            {[
                [0, -3.5, 7, 0.6],
                [0, 3.5, 7, 0.6],
                [-3.5, 0, 0.6, 7],
                [3.5, 0, 0.6, 7],
            ].map(([x, z, w, d], i) => (
                <mesh key={i} material={mat.mur} position={[x, 1.1, z]}>
                    <boxGeometry args={[w, 2.2, d]} />
                </mesh>
            ))}
            {[
                [-3.5, -3.5],
                [3.5, -3.5],
                [-3.5, 3.5],
                [3.5, 3.5],
            ].map(([x, z], i) => (
                <mesh
                    key={i}
                    material={mat.mur}
                    position={[x, 1.4, z]}
                    rotation={[0, Math.PI / 4, 0]}
                >
                    <boxGeometry args={[1.8, 2.8, 1.8]} />
                </mesh>
            ))}
            <mesh material={mat.mast} position={[0, 3, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 6, 5]} />
            </mesh>
            {[mat.oransje, mat.hvit, mat.bla].map((m, i) => (
                <mesh key={i} material={m} position={[1.1, 5.6 - i * 0.45, 0]}>
                    <boxGeometry args={[2.2, 0.45, 0.05]} />
                </mesh>
            ))}
        </group>
    );
}

/** Kysten hjemme: flatt land med vindmøller. */
function Kyst() {
    return (
        <group position={[90, 0, -20]}>
            <mesh material={mat.kystland} position={[0, 0.3, 0]}>
                <boxGeometry args={[60, 1.2, 120]} />
            </mesh>
            {[-30, -10, 12, 30].map((z, i) => (
                <group key={z} position={[-24 + i * 3, 0.9, z]}>
                    <mesh material={mat.mur} position={[0, 2, 0]}>
                        <cylinderGeometry args={[0.8, 1.3, 4, 8]} />
                    </mesh>
                    <mesh material={mat.mast} position={[-1.4, 3.8, 0]} rotation={[0.6 * i, 0, 0]}>
                        <boxGeometry args={[0.1, 5, 0.5]} />
                    </mesh>
                    <mesh
                        material={mat.mast}
                        position={[-1.4, 3.8, 0]}
                        rotation={[0.6 * i + Math.PI / 2, 0, 0]}
                    >
                        <boxGeometry args={[0.1, 5, 0.5]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Havet: et rutenett som bølger seg. Høyden styres av modus og beat. */
function Hav({
    hoyde,
    farge,
    tid,
}: {
    hoyde: React.RefObject<number>;
    farge: string;
    tid: React.RefObject<number>;
}) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(() => {
        const geo = ref.current?.geometry;
        if (!geo) return;
        const t = tid.current ?? 0;
        const a = hoyde.current ?? 0;
        const pos = geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
            pos.setZ(i, bolge(pos.getX(i), -pos.getY(i), t, a));
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
    });
    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[400, 400, 70, 70]} />
            <meshStandardMaterial
                color={farge}
                emissive={farge}
                emissiveIntensity={0.35}
                roughness={0.6}
                flatShading
            />
        </mesh>
    );
}

function bolge(x: number, z: number, t: number, a: number) {
    return (
        a *
        (Math.sin(x * 0.14 + t * 1.3) * 0.7 +
            Math.sin(z * 0.21 - t * 0.9) * 0.5 +
            Math.sin((x + z) * 0.4 + t * 2.1) * 0.15)
    );
}

/** Regn i stormen: tynne streker som faller. */
function Regn({ synlig, tid }: { synlig: boolean; tid: React.RefObject<number> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const N = 260;
    const start = useMemo(
        () =>
            Array.from({ length: N }, (_, i) => [
                ((i * 37) % 60) - 30,
                (i * 13) % 20,
                ((i * 53) % 50) - 25,
            ]),
        []
    );
    const m = useMemo(() => new THREE.Matrix4(), []);
    useFrame(() => {
        const g = ref.current;
        if (!g) return;
        g.visible = synlig;
        const t = tid.current ?? 0;
        start.forEach(([x, y, z], i) => {
            const yy = (((y - t * 22) % 20) + 20) % 20;
            m.makeRotationZ(0.3);
            m.setPosition(x - yy * 0.3, yy, z);
            g.setMatrixAt(i, m);
        });
        g.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
            <boxGeometry args={[0.04, 0.9, 0.04]} />
            <meshBasicMaterial color="#c7d2dc" transparent opacity={0.6} />
        </instancedMesh>
    );
}

const ANDRE_SKIP = [
    { x: 40, z: -30, rot: 2.6 },
    { x: 55, z: -12, rot: 2.9 },
    { x: 30, z: -50, rot: 2.4 },
];

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const tid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3(0, 2, 0));
    const forste = useRef(true);
    const skip = useRef<THREE.Group>(null);
    const pirat = useRef<THREE.Group>(null);
    const andre = useRef<(THREE.Group | null)[]>([]);
    const bolgeHoyde = useRef(modus === 'storm' ? 2.2 : 0.35);
    const bakgrunn = useRef<THREE.Color>(null);
    const taake = useRef<THREE.Fog>(null);

    const stormFarger = useMemo(
        () => ({ mork: new THREE.Color('#4a5562'), lys: new THREE.Color('#e9d9b4') }),
        []
    );

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        tid.current += dt;
        const t = beatTid.current;
        const T = tid.current;

        // Stormen: høye bølger på beat 0-1, og stille hav på beat 2.
        if (modus === 'storm') {
            const mål = beat >= 2 ? 0.3 : 2.2;
            bolgeHoyde.current = forste.current ? mål : damp(bolgeHoyde.current, mål, 0.8, dt);
            const k = 1 - (bolgeHoyde.current - 0.3) / 1.9;
            if (bakgrunn.current) bakgrunn.current.copy(stormFarger.mork).lerp(stormFarger.lys, k);
            if (taake.current) {
                taake.current.color.copy(stormFarger.mork).lerp(stormFarger.lys, k);
                taake.current.far = 70 + k * 160;
            }
        }

        // Skipet seiler og duver med bølgene.
        const s = skip.current;
        let skipX = 0;
        if (s) {
            if (modus === 'hjem') skipX = -10 + T * 0.6;
            if (modus === 'oy') skipX = 24;
            const a = bolgeHoyde.current;
            s.position.x = skipX;
            s.position.z = modus === 'oy' ? 18 : 0;
            s.position.y = modus === 'last' ? 1.3 : bolge(skipX, s.position.z, T, a) * 0.8;
            const fram =
                bolge(skipX + 4, s.position.z, T, a) - bolge(skipX - 4, s.position.z, T, a);
            const side =
                bolge(skipX, s.position.z + 2, T, a) - bolge(skipX, s.position.z - 2, T, a);
            s.rotation.z = modus === 'last' ? 0 : Math.atan2(fram, 8) * 0.9;
            s.rotation.x = modus === 'last' ? 0 : -Math.atan2(side, 4) * 0.6;
            s.rotation.y = modus === 'oy' ? -0.6 : 0;
        }

        // Andre skip som legger ut (hjem, beat 3).
        andre.current.forEach((g, i) => {
            if (!g) return;
            g.visible = modus === 'hjem' && beat >= 3;
            const b = ANDRE_SKIP[i];
            const x = skipX + b.x - t * 0.8;
            g.position.set(x, bolge(x, b.z, T, 0.35) * 0.8, b.z);
            g.rotation.y = Math.PI;
        });

        // Et fremmed skip med mørke seil i disen (storm, beat 1).
        if (pirat.current) {
            pirat.current.visible = modus === 'storm' && beat === 1;
            const x = 30 - t * 0.5;
            pirat.current.position.set(x, bolge(x, -10, T, bolgeHoyde.current) * 0.8, -10);
            pirat.current.rotation.y = Math.PI + 0.3;
        }

        const mål = kameraFor(modus, beat, t, skipX);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
    });

    const himmel = modus === 'storm' ? '#4a5562' : modus === 'oy' ? '#bfe3ec' : '#cfdde6';
    const havFarge = modus === 'storm' ? '#2f4656' : modus === 'oy' ? '#2a9d9a' : '#3d6a86';

    return (
        <>
            <color ref={bakgrunn} attach="background" args={[himmel]} />
            <fog
                ref={taake}
                attach="fog"
                args={[himmel, modus === 'last' ? 60 : 50, modus === 'storm' ? 70 : 240]}
            />
            <ambientLight intensity={0.8} color="#f1ece2" />
            <directionalLight position={[30, 50, 25]} intensity={1.3} color="#fff4e0" />
            <hemisphereLight args={['#e0ecf5', '#2b4255', 0.5]} />
            <Hav hoyde={bolgeHoyde} farge={havFarge} tid={tid} />
            <group ref={skip}>
                <Skip apen={modus === 'last'} />
                {modus === 'hjem' && beat >= 2 && (
                    <Sekker n={8} mat={mat.sekk} x0={-1.5} y={2.6} bredde={4} />
                )}
                {modus === 'last' && <Last beat={beat} />}
            </group>
            {modus === 'hjem' && (
                <>
                    <Kyst />
                    {ANDRE_SKIP.map((_, i) => (
                        <group
                            key={i}
                            ref={(g) => {
                                andre.current[i] = g;
                            }}
                            visible={false}
                        >
                            <Skip />
                        </group>
                    ))}
                </>
            )}
            {modus === 'oy' && <Oy beat={beat} tid={tid} />}
            {modus === 'storm' && (
                <>
                    <group ref={pirat} visible={false}>
                        <Skip pirat />
                    </group>
                    <Regn synlig={beat < 2} tid={tid} />
                </>
            )}
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    hjem: [
        'Slutten av 1500-tallet',
        'Hjem fra Ostindia',
        'Lasten: muskat og nellik',
        'Flere vil være med',
    ],
    oy: ['Krydderøyene: Banda og Ambon', 'Muskat, nellik, pepper og kanel', 'VOC tar kontroll'],
    last: ['Krydder', 'Bomullsstoff og silke', 'Te og kaffe', 'Porselen og edelstener'],
    storm: ['Stormer', 'Sykdom og pirater', 'Nederland blir rikt'],
};

export function VocSkip({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'hjem';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = MERKER[modus][Math.min(beat, MERKER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 600, position: [-30, 9, 32] }}
                gl={{ antialias: true }}
            >
                <Scene key={modus} modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 top-[6%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    {tekst && (
                        <motion.div
                            key={tekst}
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                        >
                            {tekst}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
