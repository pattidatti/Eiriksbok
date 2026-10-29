import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Terrorbalansen i 3D: to landflater, USA i vest og Sovjetunionen i øst, med rakettene som
 * vokser i antall. «kapplop»: bomben på begge sider og våpenkappløpet, så hydrogenbombene.
 * «mad»: begge kan treffe den andre, ingen tør, og så rakettene på Cuba.
 * Ingen rakett skytes ut: banene er bare stiplede linjer.
 */

type Modus = 'kapplop' | 'mad';

const MAKS = 36;
const SIDE_X = 13;

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'kapplop') {
        switch (beat) {
            case 0:
                return { pos: v(-14 + t * 0.2, 9, 24), se: v(-12, 1.5, 0) };
            case 1:
                return { pos: v(14 - t * 0.2, 9, 24), se: v(12, 1.5, 0) };
            case 2:
                return { pos: v(0, 20 + t * 0.3, 34), se: v(0, 0, 0) };
            default:
                return { pos: v(-4 + t * 0.3, 10, 46), se: v(0, 4, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 17, 36), se: v(0, 2, 0) };
        case 1:
            return { pos: v(4 - t * 0.3, 12, 30), se: v(0, 2, 0) };
        case 2:
            return { pos: v(0, 26, 42), se: v(0, 0, 0) };
        default:
            return { pos: v(-4, 13, 36), se: v(-5, 2, 7) };
    }
}

/** Hvor mange raketter hver side har, og om hydrogenbombene er der. */
function arsenal(modus: Modus, beat: number, t: number) {
    if (modus === 'mad') return { vest: MAKS, ost: MAKS };
    if (beat === 0) return { vest: 1, ost: 0 };
    if (beat === 1) return { vest: 1, ost: 1 };
    if (beat === 2) {
        const n = Math.min(MAKS - 6, 1 + Math.floor(t * 4));
        // Annenhver gang: den ene siden får flere, så den andre enda flere.
        return { vest: n, ost: Math.max(1, n - (Math.floor(t * 2) % 2) * 2) };
    }
    return { vest: MAKS - 6, ost: MAKS - 6 };
}

function plass(i: number, side: number): [number, number] {
    const kol = i % 6;
    const rad = Math.floor(i / 6);
    return [side * SIDE_X + (kol - 2.5) * 1.9, (rad - 2.5) * 1.9];
}

function Raketter({
    side,
    antall,
    farge,
}: {
    side: number;
    antall: RefObject<{ vest: number; ost: number }>;
    farge: string;
}) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const spiss = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const m = new THREE.Matrix4();
        for (let i = 0; i < MAKS; i++) {
            const [x, z] = plass(i, side);
            m.makeTranslation(x, 1.6, z);
            kropp.current?.setMatrixAt(i, m);
            m.makeTranslation(x, 3.6, z);
            spiss.current?.setMatrixAt(i, m);
        }
        if (kropp.current) kropp.current.instanceMatrix.needsUpdate = true;
        if (spiss.current) spiss.current.instanceMatrix.needsUpdate = true;
    }, [side]);
    useFrame(() => {
        const n = side < 0 ? antall.current.vest : antall.current.ost;
        if (kropp.current) kropp.current.count = n;
        if (spiss.current) spiss.current.count = n;
    });
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, MAKS]} frustumCulled={false}>
                <cylinderGeometry args={[0.35, 0.4, 2.8, 10]} />
                <meshStandardMaterial color="#e5e7eb" emissive="#475569" emissiveIntensity={0.4} />
            </instancedMesh>
            <instancedMesh ref={spiss} args={[undefined, undefined, MAKS]} frustumCulled={false}>
                <coneGeometry args={[0.35, 1.2, 10]} />
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.35} />
            </instancedMesh>
        </>
    );
}

function Hbombe({ x, z, farge, synlig }: { x: number; z: number; farge: string; synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.y, synlig ? 1 : 0.001, 2.5, Math.min(dt, 0.05));
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={[x, 0.5, z]} scale={[1, 0.001, 1]}>
            <mesh position={[0, 3.5, 0]}>
                <cylinderGeometry args={[0.8, 0.9, 7, 14]} />
                <meshStandardMaterial color="#f8fafc" emissive="#64748b" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 8, 0]}>
                <coneGeometry args={[0.8, 2.2, 14]} />
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.6} />
            </mesh>
        </group>
    );
}

function Flate({ x, farge, varsel }: { x: number; farge: string; varsel: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const tid = useRef(0);
    useFrame((_, dt) => {
        tid.current += Math.min(dt, 0.05);
        if (mat.current)
            mat.current.emissiveIntensity = varsel ? 0.45 + Math.sin(tid.current * 4) * 0.25 : 0.25;
    });
    return (
        <mesh position={[x, 0, 0]}>
            <boxGeometry args={[14, 0.8, 14]} />
            <meshStandardMaterial
                ref={mat}
                color={farge}
                emissive={farge}
                emissiveIntensity={0.25}
                flatShading
            />
        </mesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const antall = useRef(arsenal(modus, beat, 0));

    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
        antall.current = arsenal(modus, beat, beatTid.current);
    });

    return (
        <>
            <color attach="background" args={['#0b1730']} />
            <fog attach="fog" args={['#0b1730', 40, 95]} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 20, 12]} intensity={1.4} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#1e3a5f" emissive="#16304f" emissiveIntensity={0.6} />
            </mesh>
            <Flate x={-SIDE_X} farge="#2563eb" varsel={modus === 'mad' && beat === 1} />
            <Flate x={SIDE_X} farge="#dc2626" varsel={modus === 'mad' && beat === 1} />
            <Arsenal modus={modus} beat={beat} antall={antall} />
            {modus === 'mad' && (
                <>
                    <Baner synlig={beat <= 1} />
                    <Cuba synlig={beat >= 3} />
                </>
            )}
        </>
    );
}

function Arsenal({
    modus,
    beat,
    antall,
}: {
    modus: Modus;
    beat: number;
    antall: RefObject<{ vest: number; ost: number }>;
}) {
    const h = modus === 'mad' || beat >= 3;
    return (
        <group>
            <Raketter side={-1} antall={antall} farge="#3b82f6" />
            <Raketter side={1} antall={antall} farge="#ef4444" />
            {[-1, 1].map((side) =>
                [-4, 0, 4].map((z) => (
                    <Hbombe
                        key={`${side}${z}`}
                        x={side * (SIDE_X + 8.5)}
                        z={z}
                        farge={side < 0 ? '#3b82f6' : '#ef4444'}
                        synlig={h}
                    />
                ))
            )}
        </group>
    );
}

function Baner({ synlig }: { synlig: boolean }) {
    return (
        <group visible={synlig}>
            {[-3, 0, 3].map((z) => (
                <group key={z}>
                    <QuadraticBezierLine
                        start={[-SIDE_X, 4, z]}
                        end={[SIDE_X, 4, z + 1]}
                        mid={[0, 16, z + 0.5]}
                        color="#93c5fd"
                        lineWidth={3}
                        dashed
                        dashSize={0.8}
                        gapSize={0.6}
                    />
                    <QuadraticBezierLine
                        start={[SIDE_X, 4, z + 0.6]}
                        end={[-SIDE_X, 4, z - 0.6]}
                        mid={[0, 13, z]}
                        color="#fca5a5"
                        lineWidth={3}
                        dashed
                        dashSize={0.8}
                        gapSize={0.6}
                    />
                </group>
            ))}
        </group>
    );
}

function Cuba({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.x, synlig ? 1 : 0.001, 2.5, Math.min(dt, 0.05));
        g.scale.setScalar(s);
        g.visible = s > 0.02;
    });
    const raketter = useMemo(() => [-1.6, 0, 1.6], []);
    return (
        <group ref={ref} position={[-7, 0, 13]} scale={0.001}>
            <mesh scale={[5, 0.5, 1.8]} rotation={[0, 0.3, 0]}>
                <sphereGeometry args={[1, 16, 8]} />
                <meshStandardMaterial
                    color="#a3a36a"
                    emissive="#4d4d2a"
                    emissiveIntensity={0.5}
                    flatShading
                />
            </mesh>
            {raketter.map((x) => (
                <group key={x} position={[x, 0.4, 0]}>
                    <mesh position={[0, 1.2, 0]}>
                        <cylinderGeometry args={[0.3, 0.35, 2.2, 10]} />
                        <meshStandardMaterial
                            color="#e5e7eb"
                            emissive="#475569"
                            emissiveIntensity={0.4}
                        />
                    </mesh>
                    <mesh position={[0, 2.8, 0]}>
                        <coneGeometry args={[0.3, 1, 10]} />
                        <meshStandardMaterial
                            color="#ef4444"
                            emissive="#ef4444"
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

const MERKER: Record<
    Modus,
    { tekst: string; fra: number; til: number; pos: [number, number, number]; farge: string }[]
> = {
    kapplop: [
        { tekst: 'USA', fra: 0, til: 9, pos: [-SIDE_X, 0, 8.5], farge: '#1d4ed8' },
        { tekst: 'Sovjetunionen', fra: 1, til: 9, pos: [SIDE_X, 0, 8.5], farge: '#b91c1c' },
        {
            tekst: 'Sovjetunionens første atombombe, 1949',
            fra: 1,
            til: 1,
            pos: [SIDE_X, 6.5, 0],
            farge: '#0f172a',
        },
        { tekst: 'Hydrogenbomber', fra: 3, til: 3, pos: [0, 11.5, 0], farge: '#0f172a' },
    ],
    mad: [
        { tekst: 'USA', fra: 0, til: 2, pos: [-SIDE_X, 0, 8.5], farge: '#1d4ed8' },
        { tekst: 'Sovjetunionen', fra: 0, til: 2, pos: [SIDE_X, 0, 8.5], farge: '#b91c1c' },
        { tekst: 'Begge kan slå tilbake', fra: 0, til: 0, pos: [0, 17.5, 0], farge: '#0f172a' },
        {
            tekst: 'MAD: gjensidig garantert ødeleggelse',
            fra: 1,
            til: 1,
            pos: [0, 10.5, 0],
            farge: '#b91c1c',
        },
        { tekst: 'Ingen tør å starte', fra: 2, til: 2, pos: [0, 12, 0], farge: '#0f172a' },
        { tekst: 'Cuba, 1962', fra: 3, til: 3, pos: [-7, 4.5, 13], farge: '#b91c1c' },
    ],
};

export function KaldkrigRakettene({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'kapplop';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 18, 36] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
                {MERKER[modus]
                    .filter((m) => beat >= m.fra && beat <= m.til)
                    .map((m) => (
                        <Html key={m.tekst} position={m.pos} center zIndexRange={[10, 0]}>
                            <div
                                className="px-4 py-1.5 rounded-xl bg-white/95 shadow-lg font-black whitespace-nowrap"
                                style={{ color: m.farge, fontSize: 24 }}
                            >
                                {m.tekst}
                            </div>
                        </Html>
                    ))}
            </Canvas>
            {modus === 'mad' && beat === 3 && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-red-600 text-white font-black shadow-xl whitespace-nowrap"
                    style={{ top: 18, fontSize: 28 }}
                >
                    Minutter unna katastrofe
                </div>
            )}
        </div>
    );
}
