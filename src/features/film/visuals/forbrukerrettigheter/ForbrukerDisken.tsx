import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Butikken i 3D. Fire moduser:
 * - disk: Mia ved disken. Mobilen slutter å lade, kvitteringen på disken, mannen rister på hodet.
 * - lov: tre kjøp på disken, så en vekt der butikken veier mest, til loven legges i Mias skål.
 * - gulv: butikken tømt. Gulvet (reklamasjonsretten) lyser, garantihylla på veggen forsvinner.
 * - skyld: to store mobiler. Den ene er død av seg selv (mangel), den andre faller i asfalten.
 */

type Modus = 'disk' | 'lov' | 'gulv' | 'skyld';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    disk: ['Mia, 15 år', '13 måneder senere', 'Tilbake i butikken', 'Butikken sier nei'],
    lov: [
        'Forbruker: du kjøper til deg selv',
        'Butikken vet som regel mer',
        'Forbrukerkjøpsloven',
        'Loven står over de små bokstavene',
    ],
    gulv: [
        'Garanti og reklamasjon',
        'Reklamasjon: står i loven',
        'Garanti: et frivillig løfte',
        'Gulvet og hylla',
        'Hylla er borte. Gulvet står.',
    ],
    skyld: [
        'Mangel: en feil ved varen',
        'Hva er en mangel?',
        'Men hvem skyldes feilen?',
        'Din skyld: ingen reklamasjon',
    ],
};

const MIA = v(0.9, 0, 1.35);
const EKSPEDITOR = v(-0.3, 0, -1.1);

// ---------- Byggeklosser ----------

function Person({
    pos,
    farge,
    har,
    hodeRef,
}: {
    pos: THREE.Vector3;
    farge: string;
    har: string;
    hodeRef?: React.RefObject<THREE.Group | null>;
}) {
    return (
        <group position={pos}>
            <mesh position={[0, 0.9, 0]}>
                <capsuleGeometry args={[0.36, 0.9, 4, 10]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <group ref={hodeRef} position={[0, 2, 0]}>
                <mesh>
                    <sphereGeometry args={[0.34, 16, 12]} />
                    <meshStandardMaterial color="#e8b48c" />
                </mesh>
                <mesh position={[0, 0.1, 0.06]}>
                    <sphereGeometry args={[0.36, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
                    <meshStandardMaterial color={har} />
                </mesh>
                {/* Nese, så eleven ser hvilken vei hodet snur */}
                <mesh position={[0, -0.02, -0.33]}>
                    <sphereGeometry args={[0.06, 8, 6]} />
                    <meshStandardMaterial color="#d99c74" />
                </mesh>
            </group>
        </group>
    );
}

function Mobil({
    pos,
    skala = 1,
    lys,
    sprukket = false,
    rot = [0, 0, 0],
}: {
    pos: THREE.Vector3 | [number, number, number];
    skala?: number;
    lys: boolean;
    sprukket?: boolean;
    rot?: [number, number, number];
}) {
    return (
        <group position={pos} rotation={rot} scale={skala}>
            <mesh>
                <boxGeometry args={[0.36, 0.72, 0.05]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 0, 0.027]}>
                <planeGeometry args={[0.32, 0.66]} />
                <meshStandardMaterial
                    color={lys ? '#38bdf8' : '#0f172a'}
                    emissive={lys ? '#0ea5e9' : '#000000'}
                    emissiveIntensity={lys ? 0.8 : 0}
                />
            </mesh>
            {sprukket &&
                [
                    [0.02, 0.05, 0.6],
                    [-0.05, -0.08, -0.9],
                    [0.06, -0.15, 0.3],
                    [-0.02, 0.18, -0.4],
                ].map(([x, y, r], i) => (
                    <mesh key={i} position={[x, y, 0.03]} rotation={[0, 0, r]}>
                        <planeGeometry args={[0.012, 0.42]} />
                        <meshBasicMaterial color="#f8fafc" />
                    </mesh>
                ))}
        </group>
    );
}

function Disken() {
    return (
        <group>
            <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[4.4, 1.1, 0.9]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </mesh>
            <mesh position={[0, 1.12, 0]}>
                <boxGeometry args={[4.6, 0.06, 1.05]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            {/* Kasseapparat */}
            <mesh position={[-1.4, 1.35, -0.1]}>
                <boxGeometry args={[0.6, 0.4, 0.45]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
        </group>
    );
}

/** Hyller med varer på bakveggen. */
function Bakvegg({ synlig }: { synlig: boolean }) {
    const varer = useMemo(() => {
        const ut: { p: [number, number, number]; f: string; s: [number, number, number] }[] = [];
        const farger = ['#f97316', '#0ea5e9', '#a855f7', '#22c55e', '#e11d48', '#eab308'];
        for (let rad = 0; rad < 3; rad++)
            for (let i = 0; i < 6; i++)
                ut.push({
                    p: [-3.4 + i * 1.35, 1.25 + rad * 0.9, -2.75],
                    f: farger[(i + rad * 2) % farger.length],
                    s: [0.5, 0.45 + ((i + rad) % 3) * 0.08, 0.35],
                });
        return ut;
    }, []);
    return (
        <group>
            <mesh position={[0, 2.5, -3]}>
                <boxGeometry args={[12, 5, 0.2]} />
                <meshStandardMaterial color="#f1f5f9" />
            </mesh>
            {synlig && (
                <>
                    {[0, 1, 2].map((rad) => (
                        <mesh key={rad} position={[0, 0.98 + rad * 0.9, -2.75]}>
                            <boxGeometry args={[8.6, 0.06, 0.5]} />
                            <meshStandardMaterial color="#cbd5e1" />
                        </mesh>
                    ))}
                    {varer.map((x, i) => (
                        <mesh key={i} position={[x.p[0], x.p[1] + x.s[1] / 2, x.p[2]]}>
                            <boxGeometry args={x.s} />
                            <meshStandardMaterial color={x.f} flatShading />
                        </mesh>
                    ))}
                </>
            )}
        </group>
    );
}

// ---------- Vekta (lov) ----------

function Vekta({ beat, playing }: { beat: number; playing: boolean }) {
    const bjelke = useRef<THREE.Group>(null);
    const venstre = useRef<THREE.Group>(null);
    const hoyre = useRef<THREE.Group>(null);
    const bok = useRef<THREE.Group>(null);
    const vinkel = useRef(0.32);
    const bokY = useRef(3);
    const forste = useRef(true);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const mal = beat >= 2 ? 0 : 0.32;
        const bokMal = beat >= 2 ? 0 : 3;
        if (forste.current) {
            vinkel.current = mal;
            bokY.current = bokMal;
            forste.current = false;
        }
        vinkel.current = damp(vinkel.current, mal, 2.5, dt);
        bokY.current = damp(bokY.current, bokMal, 4, dt);
        if (bjelke.current) bjelke.current.rotation.z = vinkel.current;
        // Skålene henger rett ned uansett hvor bjelken står.
        const a = vinkel.current;
        if (venstre.current)
            venstre.current.position.set(-1.1 * Math.cos(a), -1.1 * Math.sin(a), 0);
        if (hoyre.current) hoyre.current.position.set(1.1 * Math.cos(a), 1.1 * Math.sin(a), 0);
        if (bok.current) bok.current.position.y = bokY.current;
    });
    return (
        <group position={[0, 1.15, 0]}>
            {/* Fot og stang */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.35, 0.4, 0.1, 16]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>
            <mesh position={[0, 0.75, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>
            <group position={[0, 1.45, 0]}>
                <group ref={bjelke}>
                    <mesh>
                        <boxGeometry args={[2.3, 0.07, 0.07]} />
                        <meshStandardMaterial color="#ca8a04" />
                    </mesh>
                </group>
                {/* Butikkens skål: varer og regler */}
                <group ref={venstre}>
                    <mesh position={[0, -0.55, 0]}>
                        <cylinderGeometry args={[0.45, 0.3, 0.08, 16]} />
                        <meshStandardMaterial color="#ca8a04" />
                    </mesh>
                    <mesh position={[-0.12, -0.38, 0]}>
                        <boxGeometry args={[0.35, 0.28, 0.3]} />
                        <meshStandardMaterial color="#f97316" flatShading />
                    </mesh>
                    <mesh position={[0.17, -0.4, 0.05]}>
                        <boxGeometry args={[0.25, 0.24, 0.25]} />
                        <meshStandardMaterial color="#0ea5e9" flatShading />
                    </mesh>
                    <mesh position={[0.02, -0.17, 0]}>
                        <boxGeometry args={[0.4, 0.14, 0.3]} />
                        <meshStandardMaterial color="#7f1d1d" />
                    </mesh>
                </group>
                {/* Mias skål */}
                <group ref={hoyre}>
                    <mesh position={[0, -0.55, 0]}>
                        <cylinderGeometry args={[0.45, 0.3, 0.08, 16]} />
                        <meshStandardMaterial color="#ca8a04" />
                    </mesh>
                    <group ref={bok}>
                        <mesh position={[0, -0.36, 0]}>
                            <boxGeometry args={[0.75, 0.34, 0.5]} />
                            <meshStandardMaterial color="#1d4ed8" />
                        </mesh>
                        <mesh position={[0.005, -0.36, 0]}>
                            <boxGeometry args={[0.7, 0.28, 0.52]} />
                            <meshStandardMaterial color="#f8fafc" />
                        </mesh>
                    </group>
                </group>
            </group>
        </group>
    );
}

// ---------- Kamera ----------

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'disk') {
        switch (beat) {
            case 0:
                return { pos: v(4.2, 2.6, 4.6), se: v(0.6, 1.5, 0.6) };
            case 1:
                return { pos: v(3.2, 1.8, 1.6), se: v(0.85, 1.35, 0.85) };
            case 2:
                return { pos: v(3.6, 3.2, 5.2), se: v(0.2, 1.3, 0) };
            default:
                return { pos: v(-2.6 - t * 0.05, 2.7, 4.6), se: v(-0.3, 1.6, -0.6) };
        }
    }
    if (modus === 'lov') {
        if (beat === 0) return { pos: v(0, 3.2, 4.4), se: v(0, 1.2, 0) };
        return { pos: v(0.3, 2.7, 6 + t * 0.04), se: v(0, 2.1, 0) };
    }
    if (modus === 'gulv') {
        switch (beat) {
            case 0:
                return { pos: v(0, 3.4, 8), se: v(0, 1.4, -1) };
            case 1:
                return { pos: v(3.5, 5.5, 6.5), se: v(0, 0, -0.5) };
            case 2:
                return { pos: v(-1.6, 3, 3.2), se: v(-2.2, 2.3, -2.7) };
            default:
                return { pos: v(1.5, 3.8, 8.2), se: v(-0.6, 1.4, -1.2) };
        }
    }
    switch (beat) {
        case 0:
        case 1:
            return { pos: v(-0.4, 2.2, 3.6), se: v(-0.9, 1.3, 0) };
        default:
            return { pos: v(0.3, 2.6, 4.6), se: v(0.1, 1.1, 0) };
    }
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mal = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        se.current.lerp(mal.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

// ---------- Merkelapper ----------

function Skilt({ tekst, tone }: { tekst: string; tone: 'rod' | 'gronn' | 'gull' | 'bla' }) {
    const farge = {
        rod: 'border-red-500 text-red-700',
        gronn: 'border-teal-500 text-teal-700',
        gull: 'border-amber-500 text-amber-700',
        bla: 'border-blue-500 text-blue-700',
    }[tone];
    return (
        <div
            className={`px-3 py-1 rounded-xl bg-white/95 shadow-lg border-2 font-bold whitespace-nowrap text-2xl ${farge}`}
        >
            {tekst}
        </div>
    );
}

// ---------- Modusene ----------

function DiskScene({ beat, playing }: { beat: number; playing: boolean }) {
    const hode = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        tid.current += dt;
        if (hode.current)
            hode.current.rotation.y = beat >= 3 ? Math.sin(tid.current * 7) * 0.35 : 0;
    });
    return (
        <>
            <Disken />
            <Person pos={EKSPEDITOR} farge="#1e3a8a" har="#1f2937" hodeRef={hode} />
            <Person pos={MIA} farge="#0d9488" har="#78350f" />
            {beat <= 1 ? (
                <Mobil
                    pos={[MIA.x - 0.05, 1.45, MIA.z - 0.5]}
                    rot={[-0.3, 1.2, 0]}
                    skala={1.5}
                    lys={beat === 0}
                />
            ) : (
                <Mobil pos={[0.6, 1.18, 0.15]} rot={[-Math.PI / 2, 0, 0.3]} lys={false} />
            )}
            {beat >= 2 && (
                <mesh position={[0.05, 1.16, 0.2]} rotation={[-Math.PI / 2, 0, -0.2]}>
                    <planeGeometry args={[0.32, 0.6]} />
                    <meshStandardMaterial color="#fefce8" />
                </mesh>
            )}
            {beat === 1 && (
                <Html position={[MIA.x - 0.1, 0.95, MIA.z - 0.5]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Lader ikke" tone="rod" />
                </Html>
            )}
            {beat === 2 && (
                <Html position={[0.05, 1.5, 0.2]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Kvitteringen" tone="bla" />
                </Html>
            )}
            {beat >= 3 && (
                <Html
                    position={[EKSPEDITOR.x - 1.2, 2.9, EKSPEDITOR.z]}
                    center
                    zIndexRange={[10, 0]}
                >
                    <Skilt tekst="Garantien: 1 år" tone="rod" />
                </Html>
            )}
        </>
    );
}

function LovScene({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <Disken />
            <Person pos={EKSPEDITOR} farge="#1e3a8a" har="#1f2937" />
            {beat === 0 ? (
                <>
                    {/* Tre slags kjøp: sko, mobil, billett */}
                    <mesh position={[-1.1, 1.32, 0.1]}>
                        <boxGeometry args={[0.8, 0.34, 0.45]} />
                        <meshStandardMaterial color="#f97316" flatShading />
                    </mesh>
                    <Mobil pos={[0, 1.17, 0.1]} rot={[-Math.PI / 2, 0, 0]} lys />
                    <mesh position={[1.1, 1.16, 0.1]} rotation={[-Math.PI / 2, 0, 0.1]}>
                        <planeGeometry args={[0.7, 0.32]} />
                        <meshStandardMaterial color="#facc15" />
                    </mesh>
                    <Html position={[-1.1, 1.85, 0.1]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Sko" tone="gull" />
                    </Html>
                    <Html position={[0, 1.85, 0.1]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Mobil" tone="bla" />
                    </Html>
                    <Html position={[1.1, 1.85, 0.1]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Konsertbillett" tone="gull" />
                    </Html>
                </>
            ) : (
                <>
                    <Vekta beat={beat} playing={playing} />
                    <Html position={[-1.1, 1.3, 0.7]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Butikken" tone="rod" />
                    </Html>
                    <Html position={[1.1, 1.3, 0.7]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Du" tone="gronn" />
                    </Html>
                    {beat >= 2 && (
                        <Html position={[1.1, 3.05, 0.3]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Loven" tone="bla" />
                        </Html>
                    )}
                </>
            )}
        </>
    );
}

function GulvScene({ beat, playing }: { beat: number; playing: boolean }) {
    const gulv = useRef<THREE.MeshStandardMaterial>(null);
    const hylle = useRef<THREE.Group>(null);
    const lys = useRef(0);
    const hylleS = useRef(0);
    const forste = useRef(true);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const lysMal = beat >= 1 ? 0.55 : 0;
        const hylleMal = beat >= 2 && beat <= 3 ? 1 : 0;
        if (forste.current) {
            lys.current = lysMal;
            hylleS.current = hylleMal;
            forste.current = false;
        }
        lys.current = damp(lys.current, lysMal, 3, dt);
        hylleS.current = damp(hylleS.current, hylleMal, 3, dt);
        if (gulv.current) gulv.current.emissiveIntensity = lys.current;
        if (hylle.current) {
            hylle.current.scale.setScalar(Math.max(0.001, hylleS.current));
            hylle.current.visible = hylleS.current > 0.02;
        }
    });
    return (
        <>
            {/* Det lysende gulvet: reklamasjonsretten */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[7, 5]} />
                <meshStandardMaterial
                    ref={gulv}
                    color="#99f6e4"
                    emissive="#0d9488"
                    emissiveIntensity={0}
                />
            </mesh>
            {/* Garantihylla på veggen */}
            <group ref={hylle} position={[-2.2, 2.4, -2.7]}>
                <mesh>
                    <boxGeometry args={[2.6, 0.12, 0.6]} />
                    <meshStandardMaterial
                        color="#f59e0b"
                        emissive="#b45309"
                        emissiveIntensity={0.35}
                    />
                </mesh>
                {[-0.9, 0.9].map((x) => (
                    <mesh key={x} position={[x, -0.25, -0.15]}>
                        <boxGeometry args={[0.08, 0.45, 0.3]} />
                        <meshStandardMaterial color="#b45309" />
                    </mesh>
                ))}
                <mesh position={[0, 0.3, 0]}>
                    <boxGeometry args={[0.5, 0.48, 0.4]} />
                    <meshStandardMaterial color="#fde68a" flatShading />
                </mesh>
            </group>
            <Person pos={v(0.6, 0, 0.6)} farge="#0d9488" har="#78350f" />
            {beat === 0 && (
                <>
                    <Html position={[-1.8, 2.9, 0]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Garanti" tone="gull" />
                    </Html>
                    <Html position={[0, 2.9, 0]} center zIndexRange={[10, 0]}>
                        <div className="text-5xl font-black text-red-600">≠</div>
                    </Html>
                    <Html position={[1.9, 2.9, 0]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Reklamasjon" tone="gronn" />
                    </Html>
                </>
            )}
            {beat >= 1 && (
                <Html position={[1.6, 0.1, 1.8]} center zIndexRange={[10, 0]}>
                    <Skilt
                        tekst={
                            beat >= 4
                                ? 'Gulvet står: loven'
                                : beat >= 3
                                  ? 'Gulvet: loven'
                                  : 'Reklamasjon: loven'
                        }
                        tone="gronn"
                    />
                </Html>
            )}
            {beat >= 2 && beat <= 3 && (
                <Html position={[-2.2, 3.35, -2.6]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Hylla: garantien" tone="gull" />
                </Html>
            )}
            {beat >= 4 && (
                <Html position={[-2.2, 2.4, -2.6]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Garantien er ute" tone="rod" />
                </Html>
            )}
        </>
    );
}

function SkyldScene({ beat, playing }: { beat: number; playing: boolean }) {
    const fall = useRef<THREE.Group>(null);
    const vinkel = useRef(0);
    const forste = useRef(true);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const mal = beat >= 3 ? -Math.PI / 2 : 0;
        if (forste.current) {
            vinkel.current = mal;
            forste.current = false;
        }
        vinkel.current = damp(vinkel.current, mal, 5, dt);
        if (fall.current) fall.current.rotation.x = vinkel.current;
    });
    return (
        <>
            {/* Bord for mobilen med mangel, asfalt for den som faller */}
            <mesh position={[-1, 0.4, 0]}>
                <boxGeometry args={[1.6, 0.8, 1]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            {beat >= 2 && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.2, 0.03, 0.3]}>
                    <planeGeometry args={[2.4, 2.4]} />
                    <meshStandardMaterial color="#374151" />
                </mesh>
            )}
            <Mobil pos={[-1, 1.62, 0]} skala={2.2} lys={false} />
            {/* Rødt, tomt batteri på skjermen */}
            <mesh position={[-1, 1.62, 0.07]}>
                <planeGeometry args={[0.32, 0.16]} />
                <meshBasicMaterial color="#dc2626" />
            </mesh>
            {beat >= 2 && (
                <group ref={fall} position={[1.2, 0.08, 0.3]}>
                    <Mobil pos={[0, 0.8, 0]} skala={2.2} lys={beat < 3} sprukket={beat >= 3} />
                </group>
            )}
            <Html position={[-1, 0.5, 0.6]} center zIndexRange={[10, 0]}>
                <Skilt tekst="Mangel" tone="gronn" />
            </Html>
            {beat >= 3 && (
                <Html position={[1.2, 1.1, 0.3]} center zIndexRange={[10, 0]}>
                    <div className="flex items-center gap-2">
                        <Skilt tekst="Mistet i asfalten" tone="rod" />
                        <span className="text-5xl font-black text-red-600">✗</span>
                    </div>
                </Html>
            )}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#e0f2fe']} />
            <fog attach="fog" args={['#e0f2fe', 14, 40]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[6, 10, 8]} intensity={1.4} color="#fff7e6" />
            <hemisphereLight args={['#f8fafc', '#94a3b8', 0.4]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[30, 20]} />
                <meshStandardMaterial color={modus === 'gulv' ? '#cbd5e1' : '#e7d3b0'} />
            </mesh>
            <Bakvegg synlig={modus === 'disk' || modus === 'lov'} />
            <Kamera modus={modus} beat={beat} playing={playing} />
            {modus === 'disk' && <DiskScene beat={beat} playing={playing} />}
            {modus === 'lov' && <LovScene beat={beat} playing={playing} />}
            {modus === 'gulv' && <GulvScene beat={beat} playing={playing} />}
            {modus === 'skyld' && <SkyldScene beat={beat} playing={playing} />}
        </>
    );
}

/** Lista over hva loven kaller en mangel (skyld, beat 1). */
function Mangelliste({ beat }: { beat: number }) {
    const punkter = ['Holdbarhet', 'Funksjon', 'Sikkerhet', 'Det reklamen lovet'];
    return (
        <div className="rounded-2xl bg-white/95 shadow-xl px-5 py-4 space-y-2">
            {punkter.map((p, i) => (
                <motion.div
                    key={p}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: beat >= 1 ? 1 : 0, x: 0 }}
                    transition={{ delay: i * 0.25 }}
                    className="text-2xl font-bold text-slate-800 flex items-center gap-3"
                >
                    <span className="text-teal-600">✓</span>
                    {p}
                </motion.div>
            ))}
        </div>
    );
}

export function ForbrukerDisken({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'disk';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [4, 3, 6] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '5%' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'skyld' && beat === 1 && (
                <div className="absolute pointer-events-none" style={{ right: '5%', top: '24%' }}>
                    <Mangelliste beat={beat} />
                </div>
            )}
        </div>
    );
}
