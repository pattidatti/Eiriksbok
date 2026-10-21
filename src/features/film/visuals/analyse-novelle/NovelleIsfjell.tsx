import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Isfjell-teorien i 3D: en liten topp over vannet og en enorm kropp under. Etter den første
 * scenen står kameraet fast i et snitt, som et akvarium, så merkelappene kan ligge som DOM
 * på faste plasser ved siden av isfjellet.
 */

type Modus = 'overflate' | 'lag' | 'dykker' | 'faderen';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * Snittet: kameraet står akkurat over vannflaten og ser litt ned. Da ser vi toppen mot
 * himmelen og resten gjennom vannet, uten at toppen blir sett gjennom vann.
 */
const SNITT = { pos: v(0, 0.4, 50), se: v(0, -7.5, 0) };
const FOV = 42;
const ISFJELL_X = 7;

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'overflate') {
        // Fra siden, innenfor havblokkens forkant: da skjuler vannflaten resten av isfjellet.
        if (beat === 0) return { pos: v(-46 + t * 0.4, 3.5, 16), se: v(ISFJELL_X, 1.5, 0) };
        if (beat === 1)
            return { pos: v(-20 + Math.min(t, 8) * 0.5, 2.8, 12), se: v(ISFJELL_X, 2, 0) };
    }
    // Faderen: kameraet glir ned langs isfjellet, lag for lag.
    if (modus === 'faderen' && beat >= 1) {
        const y = beat >= 3 ? -15 : -7;
        return { pos: v(-2, y + 1, 40), se: v(2, y - 1.5, 0) };
    }
    return SNITT;
}

/** Skjermposisjon (0-1) for et punkt sett fra snitt-kameraet. */
const SNITT_KAMERA = (() => {
    const k = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.1, 500);
    k.position.copy(SNITT.pos);
    k.lookAt(SNITT.se);
    k.updateMatrixWorld();
    return k;
})();
function iSnitt(x: number, y: number, z: number) {
    const p = v(x, y, z).project(SNITT_KAMERA);
    return { x: (p.x + 1) / 2, y: (1 - p.y) / 2 };
}

interface Bit {
    p: [number, number, number];
    s: [number, number, number];
    r: [number, number, number];
}

function Isfjell() {
    const ref = useRef<THREE.Group>(null);
    const biter = useMemo<Bit[]>(() => {
        const topp: Bit[] = [
            { p: [0, 1.4, 0], s: [3.0, 3.4, 2.6], r: [0.3, 0.2, 0.1] },
            { p: [1.4, 0.5, 0.6], s: [2.2, 1.8, 2.0], r: [0.8, 0.4, 0.3] },
            { p: [-1.3, 0.4, -0.4], s: [2.2, 1.5, 2.0], r: [0.1, 1.2, 0.5] },
            { p: [0.3, 3.2, -0.2], s: [1.4, 1.9, 1.3], r: [0.5, 0.9, 0.2] },
        ];
        const bunn: Bit[] = [];
        // Kroppen under vannet: lag på lag, bredest et stykke ned, smalere mot bunnen.
        for (let lag = 0; lag < 7; lag++) {
            const y = -1.6 - lag * 3;
            const bredde = lag < 3 ? 4 + lag * 2.2 : 10.6 - (lag - 3) * 2.1;
            const antall = 3 + Math.round(bredde / 3);
            for (let i = 0; i < antall; i++) {
                const x = -bredde / 2 + (i + 0.5) * (bredde / antall) + Math.sin(lag * 3 + i) * 0.6;
                bunn.push({
                    p: [x, y + Math.cos(i * 1.7 + lag) * 0.6, Math.sin(i * 2.1 + lag) * 1.4],
                    s: [3.4, 3.6, 3.4],
                    r: [lag * 0.7 + i, i * 0.9, lag * 0.4],
                });
            }
        }
        return [...topp, ...bunn];
    }, []);
    const tid = useRef(0);
    useFrame((_, dt) => {
        tid.current += dt;
        if (ref.current) ref.current.rotation.y = Math.sin(tid.current * 0.15) * 0.08;
    });
    return (
        <group ref={ref} position={[ISFJELL_X, 0, 0]}>
            {biter.map((b, i) => (
                <mesh key={i} position={b.p} scale={b.s} rotation={b.r}>
                    <dodecahedronGeometry args={[0.7, 0]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive="#9cc3e4"
                        emissiveIntensity={0.35}
                        flatShading
                        roughness={0.4}
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Havet: en gjennomsiktig blokk sett fra siden, og en tett flate øverst sett ovenfra. */
function Havet({ stor }: { stor: boolean }) {
    return (
        <group>
            <mesh position={[0, -60, -40]} renderOrder={2}>
                <boxGeometry args={[220, 120, 120]} />
                <meshStandardMaterial
                    color="#0e5a86"
                    emissive="#0b4f78"
                    emissiveIntensity={0.55}
                    transparent
                    opacity={0.5}
                    depthWrite={false}
                />
            </mesh>
            {/* Sett fra skipet går havet helt fram til kameraet; i snittet slutter det ved forkanten. */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={stor ? [0, 0.02, 0] : [0, 0.02, -40]}
                renderOrder={3}
            >
                <planeGeometry args={stor ? [600, 600] : [220, 120]} />
                <meshStandardMaterial
                    color="#2f7fae"
                    emissive="#1d5f8a"
                    emissiveIntensity={0.5}
                    side={THREE.FrontSide}
                />
            </mesh>
        </group>
    );
}

function Dykker({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forste = useRef(true);
    const mal = [v(-8, -4, 12), v(-4.5, -8, 12), v(-4, -12.5, 12), v(-4, -16.5, 12)];
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        const m = mal[Math.min(beat, mal.length - 1)];
        if (forste.current) {
            g.position.copy(m);
            forste.current = false;
        }
        g.position.x = damp(g.position.x, m.x, 1.2, dt);
        g.position.y = damp(g.position.y, m.y + Math.sin(tid.current * 1.4) * 0.25, 1.2, dt);
        g.position.z = m.z;
        g.rotation.z = -0.9 + Math.sin(tid.current * 2) * 0.08;
    });
    return (
        <group ref={ref} scale={1.7}>
            {/* Drakt, hode med maske, flasker og svømmeføtter */}
            <mesh>
                <capsuleGeometry args={[0.45, 1.6, 4, 8]} />
                <meshStandardMaterial color="#f97316" emissive="#c2410c" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0, 1.35, 0]}>
                <sphereGeometry args={[0.45, 12, 10]} />
                <meshStandardMaterial color="#fde68a" emissive="#a16207" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0.32, 1.4, 0.25]}>
                <boxGeometry args={[0.35, 0.3, 0.3]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.9} />
            </mesh>
            <mesh position={[-0.5, 0.2, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 1.3, 8]} />
                <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.6} />
            </mesh>
            {[-0.2, 0.2].map((x) => (
                <mesh key={x} position={[x, -1.55, 0]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.28, 0.9, 0.08]} />
                    <meshStandardMaterial
                        color="#1e293b"
                        emissive="#334155"
                        emissiveIntensity={0.6}
                    />
                </mesh>
            ))}
            <Bobler />
        </group>
    );
}

const BOBLER = 10;
function Bobler() {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const alder = useRef(Array.from({ length: BOBLER }, (_, i) => (i / BOBLER) * 3));
    useFrame((_, dt) => {
        const m = ref.current;
        if (!m) return;
        alder.current.forEach((a, i) => {
            const na = (a + Math.min(dt, 0.05)) % 3;
            alder.current[i] = na;
            o.position.set(0.4 + Math.sin(i * 3 + na * 2) * 0.25, 1.8 + na * 1.6, 0);
            o.scale.setScalar(0.12 + na * 0.05);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, BOBLER]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.8} />
        </instancedMesh>
    );
}

/** Funnene til dykkeren: et spor, et symbol og et tomrom som lyser opp. */
const FUNN = [
    { fraBeat: 1, p: v(2.5, -8, 9), form: 'spor' as const },
    { fraBeat: 2, p: v(4, -12.5, 9), form: 'symbol' as const },
    { fraBeat: 3, p: v(4, -16.5, 9), form: 'tomrom' as const },
];

function Funn({ beat }: { beat: number }) {
    const ref = useRef<(THREE.Group | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, dt) => {
        tid.current += dt;
        FUNN.forEach((f, i) => {
            const g = ref.current[i];
            if (!g) return;
            const mal = beat >= f.fraBeat ? 1.8 : 0.001;
            const s = damp(g.scale.x, mal, 3, Math.min(dt, 0.05));
            g.scale.setScalar(s);
            g.visible = s > 0.02;
            g.rotation.y = tid.current * 0.8;
        });
    });
    return (
        <>
            {FUNN.map((f, i) => (
                <group
                    key={f.form}
                    position={f.p}
                    scale={0.001}
                    ref={(g) => {
                        ref.current[i] = g;
                    }}
                >
                    {f.form === 'spor' && (
                        <mesh>
                            <octahedronGeometry args={[0.9, 0]} />
                            <meshStandardMaterial
                                color="#fde047"
                                emissive="#facc15"
                                emissiveIntensity={1.2}
                            />
                        </mesh>
                    )}
                    {f.form === 'symbol' && (
                        <mesh>
                            <torusGeometry args={[0.9, 0.22, 8, 24]} />
                            <meshStandardMaterial
                                color="#f0abfc"
                                emissive="#d946ef"
                                emissiveIntensity={1.1}
                            />
                        </mesh>
                    )}
                    {f.form === 'tomrom' && (
                        <lineSegments>
                            <edgesGeometry args={[new THREE.BoxGeometry(1.8, 1.8, 1.8)]} />
                            <lineBasicMaterial color="#86efac" />
                        </lineSegments>
                    )}
                </group>
            ))}
        </>
    );
}

/** Et lysende belte rundt isfjellet på dybden som blir forklart nå. */
const BELTER = [2, -6, -11, -17];
function Belte({ beat, lag = false }: { beat: number; lag?: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        const m = ref.current;
        if (!m) return;
        const mal = lag
            ? beat === 4
                ? 100
                : beat % 2 === 0
                  ? BELTER[0]
                  : -9
            : BELTER[Math.min(beat === 2 ? 1 : beat, BELTER.length - 1)];
        m.position.y = damp(m.position.y, mal, 2.5, Math.min(dt, 0.05));
        m.visible = mal < 50;
    });
    return (
        <mesh
            ref={ref}
            position={[ISFJELL_X, BELTER[0], 0]}
            rotation={[-Math.PI / 2 + 0.22, 0, 0]}
            renderOrder={4}
        >
            <ringGeometry args={[6.5, 7.4, 48]} />
            <meshBasicMaterial
                color="#fde047"
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const se = useRef(new THREE.Vector3());
    const forrigeBeat = useRef(-1);
    const beatTid = useRef(0);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const k = kameraFor(modus, beat, beatTid.current);
        if (forste.current) {
            camera.position.copy(k.pos);
            se.current.copy(k.se);
            forste.current = false;
        } else {
            const f = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(k.pos, f);
            se.current.lerp(k.se, f);
        }
        camera.lookAt(se.current);
    });
    return null;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#7fb3d9']} />
            <fog attach="fog" args={['#7fb3d9', 90, 240]} />
            <hemisphereLight args={['#ffffff', '#1e3a5f', 0.9]} />
            <directionalLight position={[-20, 30, 25]} intensity={1.4} />
            <Kamera modus={modus} beat={beat} playing={playing} />
            <Isfjell />
            <Havet stor={modus === 'overflate' && beat < 2} />
            {modus === 'dykker' && (
                <>
                    <Dykker beat={beat} playing={playing} />
                    <Funn beat={beat} />
                </>
            )}
            {modus === 'faderen' && <Belte beat={beat} />}
            {modus === 'lag' && <Belte beat={beat} lag />}
        </>
    );
}

interface Merke {
    fraBeat: number;
    tilBeat?: number;
    tittel: string;
    tekst?: string;
    /** Skjermposisjon i prosent (venstre kant, topp). */
    x: number;
    y: number;
    tone: 'lys' | 'mork' | 'gull';
}

const VANNLINJE = iSnitt(0, 0, 20).y * 100;

function merkerFor(modus: Modus): Merke[] {
    if (modus === 'overflate') {
        return [
            {
                fraBeat: 1,
                tilBeat: 1,
                tittel: 'Det du ser',
                tekst: 'en liten topp',
                x: 6,
                y: 10,
                tone: 'lys',
            },
            {
                fraBeat: 2,
                tilBeat: 2,
                tittel: 'Under vannet',
                tekst: 'det meste av isfjellet',
                x: 6,
                y: 58,
                tone: 'mork',
            },
            {
                fraBeat: 3,
                tittel: 'En novelle',
                tekst: 'er som et isfjell',
                x: 6,
                y: 10,
                tone: 'lys',
            },
        ];
    }
    if (modus === 'lag') {
        return [
            {
                fraBeat: 0,
                tilBeat: 1,
                tittel: 'Den ytre handlingen',
                tekst: 'det personene gjør og sier',
                x: 5,
                y: 9,
                tone: 'lys',
            },
            {
                fraBeat: 1,
                tilBeat: 1,
                tittel: 'Det indre temaet',
                tekst: 'det personene føler og tenker',
                x: 5,
                y: 56,
                tone: 'mork',
            },
            {
                fraBeat: 2,
                tilBeat: 3,
                tittel: 'Over vannet',
                tekst: 'En mann kjøper kaffe.',
                x: 5,
                y: 9,
                tone: 'lys',
            },
            {
                fraBeat: 3,
                tilBeat: 3,
                tittel: 'Under vannet',
                tekst: 'Han er ensom og savner noen.',
                x: 5,
                y: 56,
                tone: 'mork',
            },
            {
                fraBeat: 4,
                tittel: 'Isfjell-teorien',
                tekst: 'knyttet til Ernest Hemingway',
                x: 5,
                y: 9,
                tone: 'gull',
            },
        ];
    }
    if (modus === 'dykker') {
        const spor = iSnitt(2.5 + 3.4, -8, 9);
        const sym = iSnitt(4 + 3.4, -12.5, 9);
        const tom = iSnitt(4 + 3.4, -16.5, 9);
        return [
            {
                fraBeat: 0,
                tilBeat: 0,
                tittel: 'Du er dykkeren',
                tekst: 'ned under overflaten',
                x: 5,
                y: 9,
                tone: 'lys',
            },
            { fraBeat: 1, tittel: 'Spor', x: spor.x * 100, y: spor.y * 100 - 3.5, tone: 'gull' },
            { fraBeat: 2, tittel: 'Symboler', x: sym.x * 100, y: sym.y * 100 - 3.5, tone: 'gull' },
            { fraBeat: 3, tittel: 'Tomrom', x: tom.x * 100, y: tom.y * 100 - 3.5, tone: 'gull' },
        ];
    }
    return [
        {
            fraBeat: 0,
            tittel: 'Motivet',
            tekst: 'En rik bonde mister sønnen sin',
            x: 5,
            y: 9,
            tone: 'lys',
        },
        { fraBeat: 1, tittel: 'Temaet', tekst: 'Hovmod og fall', x: 5, y: 47, tone: 'mork' },
        {
            fraBeat: 3,
            tittel: 'Budskapet',
            tekst: 'Lidelse kan være en vei til visdom',
            x: 5,
            y: 70,
            tone: 'gull',
        },
    ];
}

const TONE: Record<Merke['tone'], string> = {
    lys: 'bg-white/95 text-slate-900',
    mork: 'bg-sky-950/90 text-white',
    gull: 'bg-amber-300/95 text-slate-900',
};

export function NovelleIsfjell({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'overflate';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = merkerFor(modus).filter(
        (m) => beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat)
    );
    const visVannlinje = modus === 'faderen' ? beat === 0 : modus !== 'overflate' || beat >= 2;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: FOV, position: [SNITT.pos.x, SNITT.pos.y, SNITT.pos.z] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {visVannlinje && (
                    <motion.div
                        key="vannlinje"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, delay: modus === 'overflate' ? 1.4 : 0 }}
                        className="absolute text-sm font-bold uppercase tracking-widest text-sky-900"
                        style={{ right: '3%', top: `calc(${VANNLINJE}% - 1.6rem)` }}
                    >
                        Vannflaten
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {merker.map((m) => (
                    <motion.div
                        key={m.tittel}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className={`absolute rounded-2xl shadow-xl px-5 py-3 ${TONE[m.tone]}`}
                        style={{ left: `${m.x}%`, top: `${m.y}%`, maxWidth: '36%' }}
                    >
                        <div
                            className="text-2xl font-black leading-tight"
                            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                        >
                            {m.tittel}
                        </div>
                        {m.tekst && (
                            <div className="text-lg font-semibold opacity-90 mt-0.5">{m.tekst}</div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
