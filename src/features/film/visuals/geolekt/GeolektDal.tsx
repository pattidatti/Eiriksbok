import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * En dal i 3D der isoglossene er lysende linjer på bakken.
 * «innsamling»: forskerne spør i hver bygd, svarene blir to farger, og linja mellom dem er en
 * isogloss. «tre-bygder»: tre bygder og tre trekk, linjene sprer seg, og ingen strek blir riktig.
 * «belte»: mange linjer samlet gir en tydelig grense, spredt gir de et overgangsområde, og tett
 * på deler én linje seg i flere. «setesdal»: en lukket dal som får vei sent, og holder på gamle trekk.
 */

type Modus = 'innsamling' | 'tre-bygder' | 'belte' | 'setesdal';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const BLA = '#2563eb';
const ORANSJE = '#ea580c';
const ROD = '#dc2626';
const GRONN = '#16a34a';
const LILLA = '#7c3aed';

function kameraFor(modus: Modus, beat: number, t: number) {
    const sakte = t * 0.15;
    switch (modus) {
        case 'innsamling':
            if (beat <= 1) return { pos: v(-6 + sakte, 22, 36), se: v(0, 0, 0) };
            if (beat <= 3) return { pos: v(0, 30, 30), se: v(0, 0, -1) };
            return { pos: v(-14, 12, 20), se: v(-4, 1, 0) };
        case 'tre-bygder':
            if (beat <= 1) return { pos: v(0, 30, 26), se: v(0, 0, -1) };
            return { pos: v(0 + sakte, 20, 26), se: v(0, 1, 0) };
        case 'belte':
            if (beat <= 1) return { pos: v(0, 34, 30), se: v(0, 0, -2) };
            return { pos: v(8, 15, 15), se: v(4.5, 0.5, 0) };
        default:
            if (beat === 0) return { pos: v(16, 26, 40), se: v(0, 0, 4) };
            if (beat === 1) return { pos: v(0, 24, 12), se: v(0, 0, -8) };
            return { pos: v(-12, 30, 44), se: v(0, 0, 8) };
    }
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
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
    });
    return null;
}

/** En bygd: tre små hus. */
function Bygd({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]} scale={1.4}>
            {[
                [-0.9, -0.4, 0.2],
                [0.8, -0.6, -0.3],
                [0.1, 0.9, 0.5],
            ].map(([dx, dz, r], i) => (
                <group key={i} position={[dx, 0, dz]} rotation={[0, r, 0]}>
                    <mesh position={[0, 0.45, 0]}>
                        <boxGeometry args={[1.1, 0.9, 0.8]} />
                        <meshStandardMaterial color="#c2410c" flatShading />
                    </mesh>
                    <mesh position={[0, 1.1, 0]} rotation={[0, Math.PI / 4, 0]}>
                        <coneGeometry args={[0.85, 0.6, 4]} />
                        <meshStandardMaterial color="#e7e5e4" flatShading />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Et svar som stikker opp over bygda: en stang med en kule i svarets farge. */
function Nal({
    x,
    z,
    farge,
    synlig,
    playing,
}: {
    x: number;
    z: number;
    farge: string;
    synlig: boolean;
    playing: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = synlig ? 1 : 0.001;
        g.scale.y = playing ? damp(g.scale.y, mål, 5, dt) : mål;
        g.visible = g.scale.y > 0.01;
    });
    return (
        <group ref={ref} position={[x, 0, z]} scale={[1, 0.001, 1]}>
            <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 4, 6]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 4.3, 0]}>
                <sphereGeometry args={[0.75, 14, 10]} />
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.45} />
            </mesh>
        </group>
    );
}

/** Et flagg for et trekk: stang og en farget duk. */
function Flagg({ x, z, farge }: { x: number; z: number; farge: string }) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 3.6, 6]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0.6, 3.2, 0]}>
                <boxGeometry args={[1.2, 0.75, 0.06]} />
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
}

/** En isogloss: en lysende, lav vegg tvers over dalen. Glir mot x, og vokser opp fra bakken. */
function Linje({
    x,
    farge,
    hoyde = 0.7,
    lengde = 26,
    bredde = 0.35,
    vinkel = 0,
    playing,
    z = 0,
}: {
    x: number;
    farge: string;
    hoyde?: number;
    lengde?: number;
    bredde?: number;
    vinkel?: number;
    playing: boolean;
    z?: number;
}) {
    const ref = useRef<THREE.Mesh>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forste.current || !playing) {
            m.position.x = x;
            m.scale.y = 1;
            forste.current = false;
            return;
        }
        m.position.x = damp(m.position.x, x, 3, dt);
    });
    return (
        <mesh ref={ref} position={[x, hoyde / 2, z]} rotation={[0, vinkel, 0]}>
            <boxGeometry args={[bredde, hoyde, lengde]} />
            <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.7} />
        </mesh>
    );
}

interface Fjell {
    x: number;
    z: number;
    r: number;
    h: number;
}

function fjellFor(modus: Modus): Fjell[] {
    const ut: Fjell[] = [];
    if (modus === 'setesdal') {
        // En lang dal fra nord til sør med høye vegger. Lavlandet i sør er åpent.
        for (let i = 0; i < 9; i++) {
            const z = -26 + i * 4.4;
            ut.push({ x: -8 - frø(i) * 2, z, r: 5 + frø(i + 3) * 1.5, h: 9 + frø(i + 5) * 4 });
            ut.push({ x: 8 + frø(i + 9) * 2, z, r: 5 + frø(i + 13) * 1.5, h: 9 + frø(i + 15) * 4 });
        }
        for (let i = 0; i < 4; i++)
            ut.push({ x: -6 + i * 4, z: -32, r: 5, h: 11 + frø(i + 30) * 3 });
        return ut;
    }
    for (let i = 0; i < 12; i++) {
        const x = -33 + i * 6;
        ut.push({
            x: x + frø(i) * 2,
            z: -17 - frø(i + 1) * 3,
            r: 5 + frø(i + 2) * 2,
            h: 7 + frø(i + 4) * 5,
        });
        ut.push({
            x: x + frø(i + 7) * 2,
            z: 17 + frø(i + 8) * 3,
            r: 4 + frø(i + 9) * 2,
            h: 5 + frø(i + 6) * 4,
        });
    }
    return ut;
}

function Landskap({ modus, rygg }: { modus: Modus; rygg: boolean }) {
    const fjell = useMemo(() => fjellFor(modus), [modus]);
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[220, 220]} />
                <meshStandardMaterial color="#8fbf73" />
            </mesh>
            {/* Elva gjennom dalen */}
            {modus === 'setesdal' ? (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.2, 0.02, 0]}>
                    <planeGeometry args={[1.2, 70]} />
                    <meshStandardMaterial
                        color="#5b9bd5"
                        emissive="#3b82c4"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ) : (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 6]}>
                    <planeGeometry args={[80, 1.2]} />
                    <meshStandardMaterial
                        color="#5b9bd5"
                        emissive="#3b82c4"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            )}
            {fjell.map((f, i) => (
                <group key={i} position={[f.x, f.h / 2, f.z]}>
                    <mesh>
                        <coneGeometry args={[f.r, f.h, 7]} />
                        <meshStandardMaterial color="#8a8f8a" flatShading />
                    </mesh>
                    <mesh position={[0, f.h * 0.32, 0]}>
                        <coneGeometry args={[f.r * 0.36, f.h * 0.36, 7]} />
                        <meshStandardMaterial color="#f8fafc" flatShading />
                    </mesh>
                </group>
            ))}
            {rygg &&
                [-10, -5, 0, 5, 10].map((z, i) => (
                    <mesh key={i} position={[0, 2.2, z]}>
                        <coneGeometry args={[3.2, 4.4 + frø(i + 40) * 1.6, 6]} />
                        <meshStandardMaterial color="#8a8f8a" flatShading />
                    </mesh>
                ))}
        </>
    );
}

const INNSAMLING_X = [-24, -16, -8, 0, 8, 16, 24];

function Innsamling({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            {INNSAMLING_X.map((x, i) => (
                <group key={x}>
                    <Bygd x={x} z={i % 2 ? 1.5 : -2.5} />
                    <Nal
                        x={x}
                        z={i % 2 ? 1.5 : -2.5}
                        farge={x <= -8 ? BLA : ORANSJE}
                        synlig={beat >= 2}
                        playing={playing}
                    />
                </group>
            ))}
            {beat === 1 && <Merke pos={[0, 4.2, -2.5]} tekst="«mannj»" farge="text-violet-700" />}
            {beat >= 3 && <Linje x={-4} farge={ROD} hoyde={1.2} bredde={0.5} playing={playing} />}
            {beat >= 4 && (
                <Html position={[-4, 2.2, 7]} center zIndexRange={[10, 0]}>
                    <div className="px-4 py-1.5 rounded-xl bg-white/95 text-red-700 font-black text-3xl shadow-lg whitespace-nowrap">
                        isogloss
                    </div>
                </Html>
            )}
        </>
    );
}

const TRE = [-14, 0, 14];

function TreBygder({ beat, playing }: { beat: number; playing: boolean }) {
    const samlet = beat === 0;
    const xs = samlet ? [6.4, 7, 7.6] : [-7, 5.5, 9];
    return (
        <>
            {TRE.map((x) => (
                <Bygd key={x} x={x} z={0} />
            ))}
            <Linje x={xs[0]} farge={ROD} playing={playing} />
            <Linje x={xs[1]} farge={BLA} playing={playing} />
            <Linje x={xs[2]} farge={GRONN} playing={playing} />
            {beat >= 2 && (
                <>
                    <Flagg x={14 - 1} z={-2.6} farge={ROD} />
                    <Flagg x={14 + 0.2} z={-2.6} farge={BLA} />
                    <Flagg x={14 + 1.4} z={-2.6} farge={GRONN} />
                </>
            )}
            {beat >= 3 && <Flagg x={0} z={-2.6} farge={ROD} />}
            {beat >= 2 && (
                <>
                    <Merke pos={[-14, 4.6, 0]} tekst="0 av 3" />
                    <Merke pos={[14, 5.2, 0]} tekst="3 av 3" />
                </>
            )}
            {beat >= 3 && <Merke pos={[0, 5.2, 0]} tekst={beat === 3 ? '1 av 3 ?' : '1 av 3'} />}
            {beat >= 4 && <Sveip playing={playing} />}
        </>
    );
}

/** Din strek: en hvit linje som leter etter et sted å stå, men aldri finner et riktig. */
function Sveip({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const t = useRef(0.6);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        t.current += playing ? Math.min(rawDt, 0.05) : 0;
        m.position.x = Math.sin(t.current * 0.9) * 9;
    });
    return (
        <mesh ref={ref} position={[0, 1.1, 0]}>
            <boxGeometry args={[0.3, 2.2, 28]} />
            <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.6}
                transparent
                opacity={0.85}
            />
        </mesh>
    );
}

const BELTE_FARGER = [ROD, BLA, GRONN, LILLA, ORANSJE, '#0891b2', '#ca8a04', '#db2777'];
const BELTE_SPREDT = [-17, -12, 4.4, -6, -1, 9, 13, 17];

function Belte({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            {[-26, -14, -4, 6, 16, 26].map((x, i) => (
                <Bygd key={x} x={x} z={i % 2 ? 2.5 : -3} />
            ))}
            {BELTE_FARGER.map((f, i) => {
                // Linja for tjukk l (grønn) deler seg i to fra beat 3.
                const x = beat === 0 ? (i - 3.5) * 0.45 : BELTE_SPREDT[i];
                if (i === 2 && beat >= 3) return null;
                return <Linje key={i} x={x} farge={f} playing={playing} />;
            })}
            {beat === 1 && (
                <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[36, 26]} />
                    <meshStandardMaterial color="#fde047" transparent opacity={0.35} />
                </mesh>
            )}
            {beat >= 3 && (
                <>
                    <Linje x={3.2} farge={GRONN} vinkel={0.05} playing={playing} />
                    <Linje x={5.6} farge="#86efac" vinkel={-0.06} playing={playing} />
                </>
            )}
            {beat === 2 && <Merke pos={[4.4, 1.6, 2]} tekst="tjukk l" farge="text-green-800" />}
            {beat === 3 && (
                <>
                    <Merke pos={[2.6, 1.6, 3.5]} tekst="der det var l" farge="text-green-800" />
                    <Merke pos={[6.4, 1.6, -1.5]} tekst="der det var rð" farge="text-green-600" />
                </>
            )}
            {beat >= 4 &&
                Array.from({ length: 12 }, (_, i) => (
                    <Linje
                        key={`f${i}`}
                        x={1 + frø(i + 70) * 8}
                        farge={BELTE_FARGER[i % BELTE_FARGER.length]}
                        hoyde={0.35}
                        bredde={0.16}
                        vinkel={(frø(i + 90) - 0.5) * 0.4}
                        playing={playing}
                    />
                ))}
        </>
    );
}

const DAL_BYGDER: [number, number][] = [
    [-1.5, -20],
    [2.5, -12],
    [-1.2, -4],
    [2.4, 4],
];
const LAV_BYGDER: [number, number][] = [
    [-16, 22],
    [-4, 26],
    [10, 23],
    [22, 28],
];

function Setesdal({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            {DAL_BYGDER.map(([x, z]) => (
                <group key={`d${z}`}>
                    <Bygd x={x} z={z} />
                    {beat >= 1 && <Flagg x={x + 1.4} z={z - 1} farge="#b45309" />}
                </group>
            ))}
            {LAV_BYGDER.map(([x, z], i) => (
                <group key={`l${x}`}>
                    <Bygd x={x} z={z} />
                    {beat >= 1 && (
                        <Flagg x={x + 1.4} z={z - 1} farge={[BLA, GRONN, LILLA, '#0891b2'][i]} />
                    )}
                </group>
            ))}
            <Vei beat={beat} playing={playing} />
            {beat >= 2 && <Reisende playing={playing} />}
        </>
    );
}

/** Veien inn i dalen: en mørk stripe som vokser nordover fra lavlandet. */
function Vei({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = 1;
        m.scale.y = playing && beat === 0 ? damp(m.scale.y, mål, 0.8, dt) : mål;
        m.position.z = 24 - (m.scale.y * 46) / 2;
    });
    return (
        <mesh
            ref={ref}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[-0.2, 0.05, 1]}
            scale={[1, 0.05, 1]}
        >
            <planeGeometry args={[0.9, 46]} />
            <meshStandardMaterial color="#57534e" />
        </mesh>
    );
}

/** Folk på reise i lavlandet: små vogner som går fram og tilbake mellom bygdene. */
function Reisende({ playing }: { playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const t = useRef(0);
    useFrame((_, rawDt) => {
        t.current += playing ? Math.min(rawDt, 0.05) : 0;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const a = LAV_BYGDER[i % LAV_BYGDER.length];
            const b = LAV_BYGDER[(i + 1) % LAV_BYGDER.length];
            const k = (Math.sin(t.current * 0.6 + i * 1.7) + 1) / 2;
            m.position.set(a[0] + (b[0] - a[0]) * k, 0.4, a[1] + (b[1] - a[1]) * k);
        });
    });
    return (
        <>
            {Array.from({ length: 6 }, (_, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                >
                    <boxGeometry args={[1.8, 1.3, 1.1]} />
                    <meshStandardMaterial
                        color="#f8fafc"
                        emissive="#cbd5e1"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            ))}
        </>
    );
}

function Merke({
    pos,
    tekst,
    farge = 'text-slate-900',
}: {
    pos: [number, number, number];
    tekst: string;
    farge?: string;
}) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div
                className={`px-3 py-1 rounded-xl bg-white/95 font-black text-2xl shadow-lg whitespace-nowrap ${farge}`}
            >
                {tekst}
            </div>
        </Html>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#cfe3f2']} />
            <fog attach="fog" args={['#cfe3f2', 60, 140]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#ffffff', '#6b8f5a', 0.6]} />
            <directionalLight position={[20, 30, 15]} intensity={1.1} />
            <Kamera modus={modus} beat={beat} playing={playing} />
            <Landskap modus={modus} rygg={false} />
            {modus === 'innsamling' && <Innsamling beat={beat} playing={playing} />}
            {modus === 'tre-bygder' && <TreBygder beat={beat} playing={playing} />}
            {modus === 'belte' && <Belte beat={beat} playing={playing} />}
            {modus === 'setesdal' && <Setesdal beat={beat} playing={playing} />}
        </>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    innsamling: [
        'Ett trekk om gangen',
        'Et målmerke: ett trekk',
        'Forskerne spør på mange steder',
        'Der svaret skifter',
        'Isogloss',
    ],
    'tre-bygder': [
        'Samme sted: én strek',
        'Men linjene sprer seg',
        'Tre bygder, tre trekk',
        'Bygda i midten?',
        'Noe havner på feil side',
    ],
    belte: [
        'Mange linjer samme sted',
        'Spredte linjer',
        'Ett målmerke: tjukk l',
        'To typer tjukk l',
        'Enda flere linjer',
    ],
    setesdal: ['Setesdal', 'Gamle trekk holdt seg', 'Tung reise og lett reise'],
};

const KORT: Record<Modus, (string | null)[]> = {
    innsamling: [null, 'f.eks. tjukk l eller «mannj»', null, null, 'Grensen for ett målmerke'],
    'tre-bygder': [null, null, null, null, null],
    belte: ['Tydelig dialektgrense', 'Overgangsområde', null, null, null],
    setesdal: ['Ordentlig vei: slutten av 1800-tallet', null, null],
};

export function GeolektDal({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'innsamling';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [0, 26, 34] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none"
                >
                    <div className="px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-display font-black text-4xl shadow-xl whitespace-nowrap">
                        {overskrift}
                    </div>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {kort && (
                    <motion.div
                        key={kort}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute inset-x-0 bottom-[6%] flex justify-center pointer-events-none"
                    >
                        <div className="px-6 py-3 rounded-2xl bg-amber-50 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap">
                            {kort}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {modus === 'innsamling' && beat >= 2 && beat <= 3 && <Forklaring />}
            {modus === 'setesdal' && beat >= 1 && <SetesdalForklaring beat={beat} />}
        </div>
    );
}

function Forklaring() {
    return (
        <div className="absolute right-[3%] bottom-[6%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl flex flex-col gap-2">
            <div className="flex items-center gap-3 text-2xl font-black text-slate-900">
                <span
                    className="inline-block rounded-full"
                    style={{ width: 26, height: 26, background: BLA }}
                />
                sier det på én måte
            </div>
            <div className="flex items-center gap-3 text-2xl font-black text-slate-900">
                <span
                    className="inline-block rounded-full"
                    style={{ width: 26, height: 26, background: ORANSJE }}
                />
                sier det på en annen måte
            </div>
        </div>
    );
}

function SetesdalForklaring({ beat }: { beat: number }) {
    return (
        <div className="absolute left-[3%] bottom-[6%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl flex flex-col gap-2">
            <div className="flex items-center gap-3 text-2xl font-black text-slate-900">
                <span
                    className="inline-block"
                    style={{ width: 30, height: 20, background: '#b45309' }}
                />
                gamle trekk i dalen
            </div>
            {beat >= 2 && (
                <>
                    <div className="text-2xl font-black text-slate-900">
                        Tung reise: språket ligger i ro
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                        Lett reise: språket blandes
                    </div>
                </>
            )}
        </div>
    );
}
