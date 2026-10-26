import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Ørkenen ved Kuwait sett ovenfra i 3D: grensene, Persiabukta, oljetårn og stridsvogner.
 *
 * «invasjon»: 2. august 1990. Irakske stridsvogner står ved grensen, ruller inn, sprer seg
 *   over hele Kuwait (landet blir rødt), og en gyllen pil viser at kongen flykter sørover.
 * «omringing»: februar 1991. Bløffen går rett mot Kuwait, hovedstyrken svinger langt vest
 *   inn i Irak og så østover bak de irakske styrkene. Til slutt hvite flagg.
 * «valg»: våren 1991. Kuwait er fritt (grønt), koalisjonen står nord for grensen, og veien
 *   mot Bagdad ligger åpen. FN-mandatet gjelder bare Kuwait, de arabiske allierte holder seg
 *   i Saudi-Arabia, og pila mot Bagdad blekner når koalisjonen stopper.
 *
 * Ingen skudd, ingen mennesker. Bare kjøretøy som flytter seg.
 */

type Modus = 'invasjon' | 'omringing' | 'valg';
type P2 = [number, number];

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const damp = (a: number, b: number, l: number, dt: number) =>
    THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));

/** Kuwait som polygon i (x, z). Nord er -z, øst er +x. */
const KUWAIT: P2[] = [
    [-6, 2],
    [-4, -3],
    [6, -3],
    [6, 6],
    [-2, 6],
];
const BUKTA: P2[] = [
    [6, -9],
    [40, -9],
    [40, 40],
    [12, 40],
    [8, 14],
    [6, 6],
];
/** Grenselinjer: Irak-Kuwait, Kuwait-Saudi og Irak-Saudi. */
const GRENSER: P2[][] = [
    [
        [-6, 2],
        [-4, -3],
        [6, -3],
    ],
    [
        [-6, 2],
        [-2, 6],
        [6, 6],
    ],
    [
        [-6, 2],
        [-60, 2],
    ],
];

const FARGE = {
    sand: '#e2c48e',
    kuwait: '#efd7a6',
    okkupert: '#dc2626',
    fritt: '#16a34a',
    alliert: '#15803d',
    hav: '#3b8fc4',
    irak: '#7f1d1d',
    koalisjon: '#1d4ed8',
    grense: '#ffffff',
    gull: '#f59e0b',
};

function formFra(punkter: P2[]) {
    const s = new THREE.Shape();
    punkter.forEach(([x, z], i) => (i === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)));
    s.closePath();
    return s;
}

function kamera(modus: Modus, beat: number, t: number) {
    if (modus === 'invasjon') {
        switch (beat) {
            case 0:
                return { pos: v(-9 + t * 0.15, 3.2, 5), se: v(0, 0.6, -6) };
            case 1:
                return { pos: v(11 - t * 0.3, 5, 9), se: v(1, 0, -2) };
            case 2:
                return { pos: v(5, 24, 21), se: v(0, 0, 1.5) };
            default:
                return { pos: v(-5, 30, 30), se: v(1, 0, 5) };
        }
    }
    if (modus === 'valg') {
        switch (beat) {
            case 0:
            case 3:
                return { pos: v(10 - t * 0.2, 20, 26), se: v(-13, 0, -22) };
            case 1:
                return { pos: v(6, 15, 17), se: v(0, 0, 1) };
            default:
                return { pos: v(-2, 30, 34), se: v(-8, 0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-8, 46, 40), se: v(-12, 0, 1) };
        case 1:
            return { pos: v(8, 16, 24), se: v(1, 0, 4) };
        case 2:
            return { pos: v(-24, 34, 34), se: v(-26, 0, 0) };
        case 3:
            return { pos: v(-10, 44, 40), se: v(-12, 0, -1) };
        default:
            return { pos: v(-3, 12, 14), se: v(0.5, 0, 0.5) };
    }
}

/** En stridsvogn av tre primitiver. Glir mot målet sitt, støv bak når den kjører. */
function Stridsvogn({
    mal,
    farge,
    flagg = false,
    playing,
}: {
    mal: THREE.Vector3;
    farge: string;
    flagg?: boolean;
    playing: boolean;
}) {
    const g = useRef<THREE.Group>(null);
    const stov = useRef<THREE.Mesh>(null);
    const flaggRef = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const retning = useRef(0);
    useFrame((_, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forste.current) {
            gr.position.copy(mal);
            forste.current = false;
        }
        const fra = gr.position.clone();
        gr.position.x = damp(gr.position.x, mal.x, 0.9, dt);
        gr.position.z = damp(gr.position.z, mal.z, 0.9, dt);
        const dx = gr.position.x - fra.x;
        const dz = gr.position.z - fra.z;
        const fart = dt > 0 ? Math.hypot(dx, dz) / dt : 0;
        if (fart > 0.2) retning.current = Math.atan2(dx, dz);
        gr.rotation.y = damp(gr.rotation.y, retning.current, 5, dt);
        if (stov.current) {
            const m = stov.current.material as THREE.MeshStandardMaterial;
            m.opacity = damp(m.opacity, Math.min(0.6, fart * 0.25), 4, dt || 0.016);
            stov.current.visible = m.opacity > 0.02;
        }
        if (flaggRef.current) {
            const s = damp(flaggRef.current.scale.y, flagg ? 1 : 0.001, 3, dt || 0.016);
            flaggRef.current.scale.set(1, s, 1);
            flaggRef.current.visible = s > 0.02;
        }
    });
    return (
        <group ref={g}>
            <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[0.9, 0.4, 1.4]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 0.58, -0.1]}>
                <boxGeometry args={[0.6, 0.28, 0.65]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 0.58, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.9, 6]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh ref={stov} position={[0, 0.45, -1.4]} scale={[1.3, 0.8, 1.6]}>
                <icosahedronGeometry args={[0.6, 0]} />
                <meshStandardMaterial
                    color="#d6b98a"
                    transparent
                    opacity={0}
                    depthWrite={false}
                    flatShading
                />
            </mesh>
            {flagg !== undefined && (
                <group ref={flaggRef} position={[0.2, 0.7, -0.3]} scale={[1, 0.001, 1]}>
                    <mesh position={[0, 0.7, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, 1.4, 5]} />
                        <meshStandardMaterial color="#334155" />
                    </mesh>
                    <mesh position={[0.32, 1.2, 0]}>
                        <boxGeometry args={[0.6, 0.4, 0.04]} />
                        <meshStandardMaterial
                            color="#ffffff"
                            emissive="#ffffff"
                            emissiveIntensity={0.4}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
}

/** En pil langs en kurve som tegnes fram (drawRange) og får spiss når den er ferdig. */
function Pil({
    punkter,
    andel,
    farge,
    playing,
}: {
    punkter: THREE.Vector3[];
    andel: number;
    farge: string;
    playing: boolean;
}) {
    const kurve = useMemo(() => new THREE.CatmullRomCurve3(punkter), [punkter]);
    const SEG = 80;
    const RAD = 6;
    const geo = useMemo(() => new THREE.TubeGeometry(kurve, SEG, 0.32, RAD, false), [kurve]);
    useEffect(() => () => geo.dispose(), [geo]);
    const spiss = useRef<THREE.Mesh>(null);
    const vist = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        vist.current = vist.current < 0 ? andel : damp(vist.current, andel, 1.1, dt);
        const n = Math.floor(vist.current * SEG);
        geo.setDrawRange(0, n * RAD * 6);
        const s = spiss.current;
        if (s) {
            const u = Math.max(0.001, Math.min(1, vist.current));
            s.position.copy(kurve.getPointAt(u));
            const tan = kurve.getTangentAt(u);
            s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
            s.visible = vist.current > 0.05;
        }
    });
    return (
        <group>
            <mesh geometry={geo}>
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.45} />
            </mesh>
            <mesh ref={spiss}>
                <coneGeometry args={[0.8, 1.6, 10]} />
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.45} />
            </mesh>
        </group>
    );
}

function Oljetarn({ pos }: { pos: P2 }) {
    return (
        <group position={[pos[0], 0, pos[1]]}>
            <mesh position={[0, 0.9, 0]}>
                <coneGeometry args={[0.3, 1.8, 4, 1, true]} />
                <meshStandardMaterial color="#334155" flatShading wireframe />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 1.8, 5]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
        </group>
    );
}

function Land({
    tilstand,
    playing,
}: {
    tilstand: 'fri' | 'okkupert' | 'frigjort';
    playing: boolean;
}) {
    const kuwaitGeo = useMemo(() => new THREE.ShapeGeometry(formFra(KUWAIT)), []);
    const buktaGeo = useMemo(() => new THREE.ShapeGeometry(formFra(BUKTA)), []);
    useEffect(
        () => () => {
            kuwaitGeo.dispose();
            buktaGeo.dispose();
        },
        [kuwaitGeo, buktaGeo]
    );
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const andel = useRef(-1);
    const fra = useMemo(() => new THREE.Color(FARGE.kuwait), []);
    const til = useMemo(
        () => new THREE.Color(tilstand === 'frigjort' ? FARGE.fritt : FARGE.okkupert),
        [tilstand]
    );
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mal = tilstand === 'fri' ? 0 : 0.75;
        andel.current = andel.current < 0 ? mal : damp(andel.current, mal, 0.8, dt);
        mat.current?.color.copy(fra).lerp(til, andel.current);
    });
    const dyner = useMemo(
        () =>
            Array.from({ length: 22 }, (_, i) => {
                const a = i * 2.39996;
                const r = 9 + ((i * 7.13) % 1) * 46;
                return [Math.cos(a) * r - 12, Math.sin(a) * r, 1 + (i % 4) * 0.6] as const;
            }).filter(([x, z]) => x < 5 && !(x > -7 && x < 7 && z > -4 && z < 7)),
        []
    );
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[260, 260]} />
                <meshStandardMaterial color={FARGE.sand} roughness={1} />
            </mesh>
            {dyner.map(([x, z, s], i) => (
                <mesh key={i} position={[x, 0, z]} scale={[s * 2.2, s * 0.35, s * 1.3]}>
                    <sphereGeometry args={[1, 10, 6]} />
                    <meshStandardMaterial color="#d9b77c" flatShading roughness={1} />
                </mesh>
            ))}
            <mesh geometry={kuwaitGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <meshStandardMaterial ref={mat} color={FARGE.kuwait} transparent opacity={0.85} />
            </mesh>
            <mesh geometry={buktaGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
                <meshStandardMaterial
                    color={FARGE.hav}
                    emissive="#1e5a85"
                    emissiveIntensity={0.3}
                />
            </mesh>
            {GRENSER.flatMap((linje, li) =>
                linje.slice(1).map((b, i) => {
                    const a = linje[i];
                    const lengde = Math.hypot(b[0] - a[0], b[1] - a[1]);
                    return (
                        <mesh
                            key={`${li}-${i}`}
                            position={[(a[0] + b[0]) / 2, 0.08, (a[1] + b[1]) / 2]}
                            rotation={[0, -Math.atan2(b[1] - a[1], b[0] - a[0]), 0]}
                        >
                            <boxGeometry args={[lengde, 0.12, 0.22]} />
                            <meshStandardMaterial
                                color={FARGE.grense}
                                emissive="#ffffff"
                                emissiveIntensity={0.3}
                            />
                        </mesh>
                    );
                })
            )}
            {/* Kuwait by: noen hvite hus ved kysten. */}
            {[
                [4.2, 0.4, 1.2],
                [5.0, 1.0, 0.9],
                [4.6, -0.4, 1.5],
                [3.6, 1.2, 0.7],
                [5.2, 0.0, 1.1],
            ].map(([x, z, h], i) => (
                <mesh key={i} position={[x, h / 2, z]}>
                    <boxGeometry args={[0.6, h, 0.6]} />
                    <meshStandardMaterial color="#f8fafc" flatShading />
                </mesh>
            ))}
        </>
    );
}

function Merke({
    pos,
    tekst,
    farge,
}: {
    pos: [number, number, number];
    tekst: string;
    farge: string;
}) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div
                className="px-3 py-1 rounded-lg bg-white/95 shadow-lg text-2xl font-black whitespace-nowrap uppercase tracking-wide"
                style={{ color: farge }}
            >
                {tekst}
            </div>
        </Html>
    );
}

/** Rutenett av posisjoner rundt et sentrum. */
function rute(n: number, cx: number, cz: number, kol: number, dx = 1.8, dz = 2): THREE.Vector3[] {
    return Array.from({ length: n }, (_, i) => {
        const k = i % kol;
        const r = Math.floor(i / kol);
        return v(cx + (k - (kol - 1) / 2) * dx, 0, cz + r * dz);
    });
}

const INV_START = rute(10, 1, -9, 5);
const INV_INNE = rute(10, 1, -0.5, 5);
const INV_SPREDT: THREE.Vector3[] = [
    v(-3, 0, 1),
    v(-1, 0, -1.5),
    v(1, 0, 0.5),
    v(3, 0, -1.8),
    v(-0.5, 0, 3),
    v(2, 0, 2.6),
    v(4.2, 0, 3.6),
    v(0.8, 0, 5),
    v(-2.4, 0, 4),
    v(3, 0, 4.8),
];

const IRAK_STILLING: THREE.Vector3[] = [
    v(-2, 0, -1),
    v(0.5, 0, -1.5),
    v(3, 0, -1),
    v(-3, 0, 2),
    v(-0.5, 0, 2),
    v(2, 0, 1.8),
    v(-0.5, 0, 4.6),
    v(2.2, 0, 4.4),
    v(4.4, 0, 2.6),
];
const BLOFF_START = rute(4, 2, 10, 4);
const BLOFF_FRAM = rute(4, 2, 7.6, 4);
const HOVED_START = rute(6, -19, 9.5, 3, 2, 2.2);
const HOVED_VEST = rute(6, -33, -5, 3, 2, 2.2);
const HOVED_BAK = rute(6, -6, -10, 6, 2.2, 2);

const HOVED_PIL = [
    v(-19, 0.3, 9),
    v(-31, 0.3, 6),
    v(-34, 0.3, -3),
    v(-24, 0.3, -9),
    v(-9, 0.3, -9),
];
const VALG_STILLING = rute(8, -1, -8, 4, 2, 2.2);
const ALLIERTE = rute(4, -14, 9, 4, 2, 2.2);
const BAGDAD = v(-34, 0, -46);
const BAGDAD_PIL = [v(-1, 0.3, -11), v(-12, 0.3, -24), v(-24, 0.3, -36), v(-32, 0.3, -43)];

const BLOFF_PIL = [v(2, 0.3, 11.5), v(2, 0.3, 8.5), v(2, 0.3, 6.6)];
const FLUKT_PIL = [v(4.5, 0.3, 1), v(4, 0.3, 7), v(2, 0.3, 14)];

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kamera(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });

    const oljetarn: P2[] = [
        [-3.5, -4.5],
        [-1, -5.6],
        [-2.8, -1.6],
        [-0.6, -2],
    ];

    return (
        <>
            <color attach="background" args={['#f3dfb8']} />
            <fog attach="fog" args={['#f3dfb8', 70, 170]} />
            <ambientLight intensity={0.65} />
            <directionalLight position={[30, 40, 18]} intensity={1.5} color="#fff2d6" />
            <hemisphereLight args={['#fde7c0', '#8a6a3c', 0.45]} />
            <Land
                tilstand={
                    modus === 'valg'
                        ? 'frigjort'
                        : modus === 'invasjon' && beat >= 2
                          ? 'okkupert'
                          : 'fri'
                }
                playing={playing}
            />
            {oljetarn.map((p, i) => (
                <Oljetarn key={i} pos={p} />
            ))}
            <Merke pos={[-22, 0.5, -12]} tekst="Irak" farge={FARGE.irak} />
            <Merke pos={[1, 0.5, 1.5]} tekst="Kuwait" farge="#0f172a" />
            {!(modus === 'invasjon' && beat === 2) && !(modus === 'valg' && beat !== 2) && (
                <Merke pos={[-16, 0.5, 15]} tekst="Saudi-Arabia" farge="#166534" />
            )}
            {!(modus === 'omringing' && beat === 1) &&
                !(modus === 'invasjon' && beat === 2) &&
                modus !== 'valg' && (
                    <Merke pos={[17, 0.5, 2]} tekst="Persiabukta" farge="#1e3a8a" />
                )}

            {modus === 'valg' && (
                <>
                    <Bagdad />
                    <Merke
                        pos={[BAGDAD.x, 3.4, BAGDAD.z]}
                        tekst={beat >= 3 ? 'Bagdad: Saddam sitter' : 'Bagdad'}
                        farge={beat >= 3 ? '#7f1d1d' : '#0f172a'}
                    />
                    {VALG_STILLING.map((s, i) => (
                        <Stridsvogn
                            key={`v${i}`}
                            mal={s}
                            farge={FARGE.koalisjon}
                            playing={playing}
                        />
                    ))}
                    {beat >= 2 &&
                        ALLIERTE.map((s, i) => (
                            <Stridsvogn
                                key={`a${i}`}
                                mal={s}
                                farge={FARGE.alliert}
                                playing={playing}
                            />
                        ))}
                    {beat <= 2 && (
                        <Pil
                            punkter={BAGDAD_PIL}
                            andel={beat === 0 ? 1 : 0.55}
                            farge="#60a5fa"
                            playing={playing}
                        />
                    )}
                    {beat === 1 && (
                        <Merke pos={[1, 2.6, 1.5]} tekst="FN: bare Kuwait" farge="#14532d" />
                    )}
                    {beat === 2 && (
                        <Merke pos={[-14, 2.6, 6]} tekst="Arabiske allierte: nei" farge="#14532d" />
                    )}
                    {beat >= 3 && <Stopp />}
                </>
            )}

            {modus === 'invasjon' && (
                <>
                    {INV_START.map((s, i) => (
                        <Stridsvogn
                            key={i}
                            mal={beat === 0 ? s : beat === 1 ? INV_INNE[i] : INV_SPREDT[i]}
                            farge={FARGE.irak}
                            playing={playing}
                        />
                    ))}
                    {beat >= 3 && (
                        <Pil punkter={FLUKT_PIL} andel={1} farge={FARGE.gull} playing={playing} />
                    )}
                </>
            )}

            {modus === 'omringing' && (
                <>
                    {IRAK_STILLING.map((s, i) => (
                        <Stridsvogn
                            key={`i${i}`}
                            mal={s}
                            farge={beat >= 4 ? '#9a8b7a' : FARGE.irak}
                            flagg={beat >= 4}
                            playing={playing}
                        />
                    ))}
                    {BLOFF_START.map((s, i) => (
                        <Stridsvogn
                            key={`b${i}`}
                            mal={beat >= 1 ? BLOFF_FRAM[i] : s}
                            farge={FARGE.koalisjon}
                            playing={playing}
                        />
                    ))}
                    {HOVED_START.map((s, i) => (
                        <Stridsvogn
                            key={`h${i}`}
                            mal={beat <= 1 ? s : beat === 2 ? HOVED_VEST[i] : HOVED_BAK[i]}
                            farge={FARGE.koalisjon}
                            playing={playing}
                        />
                    ))}
                    {beat >= 1 && (
                        <Pil punkter={BLOFF_PIL} andel={1} farge="#60a5fa" playing={playing} />
                    )}
                    {beat >= 2 && (
                        <Pil
                            punkter={HOVED_PIL}
                            andel={beat === 2 ? 0.5 : 1}
                            farge={FARGE.koalisjon}
                            playing={playing}
                        />
                    )}
                </>
            )}
        </>
    );
}

/** Bagdad langt unna: en klynge lave hus og en kuppel. */
function Bagdad() {
    const hus: [number, number, number][] = [
        [-1.6, -0.8, 1.6],
        [0.4, -1.2, 2.2],
        [1.8, 0.2, 1.4],
        [-0.6, 1.2, 1.2],
        [1.0, 1.6, 1.8],
        [-2.2, 0.8, 1.0],
    ];
    return (
        <group position={[BAGDAD.x, 0, BAGDAD.z]}>
            {hus.map(([x, z, h], i) => (
                <mesh key={i} position={[x, h / 2, z]}>
                    <boxGeometry args={[1.2, h, 1.2]} />
                    <meshStandardMaterial color="#f5e6c8" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 1.6, 0]}>
                <sphereGeometry args={[1.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#0e7490" flatShading />
            </mesh>
        </group>
    );
}

/** Et rødt stoppskilt foran kolonnen. */
function Stopp() {
    return (
        <group position={[-3, 0, -13.5]}>
            <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 3.6, 6]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[0, 3.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 0.2, 8]} />
                <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    invasjon: [
        { tekst: 'Grensen, 2. august 1990' },
        { tekst: 'Stridsvognene ruller inn', rod: true },
        { tekst: 'Under 12 timer: hele Kuwait', rod: true },
        { tekst: 'Kongen flykter til Saudi-Arabia' },
    ],
    omringing: [
        { tekst: '24. februar 1991' },
        { tekst: 'Bløffen: rett mot Kuwait' },
        { tekst: 'Hovedstyrken svinger vest' },
        { tekst: 'Bak dem: omringet' },
        { tekst: 'Soldatene gir opp' },
    ],
    valg: [
        { tekst: 'Videre til Bagdad?' },
        { tekst: 'FN: bare frigjør Kuwait' },
        { tekst: 'Redd for et tomrom' },
        { tekst: 'Koalisjonen stopper', rod: true },
    ],
};

export function GolfSand({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'invasjon';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = BRIKKER[modus];
    const brikke = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [-9, 3, 5] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
