import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Et lite sted langs kysten i 3D. «nedlegging»: fabrikken ved kaia, møtet, lysene som slukkes
 * og folk som går hjem, og ledige jobber et annet sted i landet. «etterpa»: det samme stedet
 * etter at fabrikken stengte. Noen sitter igjen, noen forsvinner ut av arbeidslivet, mens
 * skolen og helsesenteret går som før. Folk glir mot målet for beaten, så hopp tåles.
 */

type Modus = 'nedlegging' | 'etterpa';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Pseudotilfeldig, men likt hver gang. */
function frø(i: number) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const OVERSKRIFT: Record<Modus, string[]> = {
    nedlegging: [
        'Mandag morgen, et lite sted ved kysten',
        'Møte for alle de ansatte',
        'Over hundre går hjem uten jobb',
        'Et annet sted i landet: ledige jobber',
    ],
    etterpa: [
        'Mer enn penger',
        'Forskning etter oljekrisen',
        'Lavere inntekt, mindre sjanse for jobb',
        'Noen faller helt ut av arbeidslivet',
        'Det offentlige ble lite berørt',
        'Målet: tilbake i jobb før de gir opp',
    ],
};

const FABRIKK = v(0, 0, -4);
const SKOLE = v(-20, 0, 16);
const HELSE = v(20, 0, 16);
const BY_LANGT = v(115, 0, 10);

const HUS: THREE.Vector3[] = Array.from({ length: 14 }, (_, i) => {
    const kol = i % 7;
    const rad = Math.floor(i / 7);
    return v(-27 + kol * 9 + (frø(i) - 0.5) * 3, 0, 26 + rad * 10 + (frø(i + 30) - 0.5) * 3);
});

const ANTALL = 22;

type Tilstand = 'jobb' | 'ledig' | 'offentlig' | 'borte';

interface Folk {
    mål: THREE.Vector3;
    tilstand: Tilstand;
}

function folkFor(modus: Modus, beat: number): Folk[] {
    return Array.from({ length: ANTALL }, (_, i) => {
        const hus = HUS[i % HUS.length];
        const ved = (p: THREE.Vector3, r: number) =>
            v(p.x + (frø(i + 7) - 0.5) * r, 0, p.z + 5 + frø(i + 11) * 2.5);
        if (modus === 'nedlegging') {
            if (beat === 0) {
                /* På jobb: langs kaia og foran fabrikken. */
                return { mål: v(-12 + frø(i + 3) * 24, 0, 5 + frø(i + 9) * 4), tilstand: 'jobb' };
            }
            if (beat === 1) {
                const kol = i % 6;
                const rad = Math.floor(i / 6);
                return { mål: v(-5 + kol * 2, 0, 6.5 + rad * 1.8), tilstand: 'jobb' };
            }
            return { mål: v(hus.x + 2.6, 0, hus.z + 3), tilstand: 'ledig' };
        }
        /* etterpa: de seks første jobber i det offentlige. */
        if (i < 3) return { mål: ved(SKOLE, 6), tilstand: 'offentlig' };
        if (i < 6) return { mål: ved(HELSE, 6), tilstand: 'offentlig' };
        if (beat < 2) return { mål: v(hus.x + 2.6, 0, hus.z + 3), tilstand: 'ledig' };
        /* Benkene foran den stengte fabrikken. */
        if (i < 14) {
            const k = i - 6;
            if (beat >= 3 && k < 4) return { mål: v(48 + k * 7, 0, 7 + (k % 2) * 1.5), tilstand: 'borte' };
            return { mål: v(-9 + k * 2.4, 0, 8), tilstand: 'ledig' };
        }
        return { mål: v(hus.x + 2.6, 0, hus.z + 3), tilstand: 'ledig' };
    });
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'nedlegging') {
        switch (beat) {
            case 0:
                return { pos: v(30 - t * 0.5, 16, 52), se: v(0, 3, 0) };
            case 1:
                return { pos: v(10, 7, 26), se: v(0, 3, 2) };
            case 2:
                return { pos: v(-10 + t * 0.3, 22, 62), se: v(0, 2, 14) };
            default:
                return { pos: v(40, 48, 100), se: v(58, 0, 6) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 24, 66), se: v(0, 2, 14) };
        case 1:
            return { pos: v(-30 + t * 0.4, 30, 70), se: v(0, 0, 10) };
        case 2:
            return { pos: v(6, 8, 28), se: v(-1, 2, 4) };
        case 3:
            return { pos: v(40, 8, 26), se: v(58, 1, 8) };
        case 4:
            return { pos: v(0, 24, 66), se: v(0, 2, 14) };
        default:
            return { pos: v(-20, 46 + t * 0.4, 92), se: v(10, 0, 10) };
    }
}

const mat = {
    gress: new THREE.MeshStandardMaterial({ color: '#9cc483', emissive: '#3c5a2c', emissiveIntensity: 0.25, roughness: 1 }),
    hav: new THREE.MeshStandardMaterial({ color: '#4c8fb5', emissive: '#1f4f6b', emissiveIntensity: 0.5, roughness: 0.4 }),
    kai: new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 0.9, flatShading: true }),
    vei: new THREE.MeshStandardMaterial({ color: '#6b7280', roughness: 1 }),
    fabrikk: new THREE.MeshStandardMaterial({ color: '#b45a3c', roughness: 0.9, flatShading: true }),
    tak: new THREE.MeshStandardMaterial({ color: '#4b5563', roughness: 0.9, flatShading: true }),
    pipe: new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.9, flatShading: true }),
    røyk: new THREE.MeshStandardMaterial({ color: '#e5e7eb', transparent: true, opacity: 0.8, flatShading: true }),
    husVegg: ['#f8fafc', '#fde68a', '#fca5a5', '#bfdbfe'].map(
        (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true })
    ),
    husTak: new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.9, flatShading: true }),
    skole: new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.9, flatShading: true }),
    helse: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true }),
    kors: new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#7f1d1d', emissiveIntensity: 0.4 }),
    kran: new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.8, flatShading: true }),
    benk: new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.9 }),
    hud: new THREE.MeshStandardMaterial({ color: '#e8b48c', roughness: 0.9, flatShading: true }),
};

const FOLKEFARGE: Record<Tilstand, string> = {
    jobb: '#ea580c',
    ledig: '#94a3b8',
    offentlig: '#0d9488',
    borte: '#cbd5e1',
};

function Person({ mål, tilstand }: Folk) {
    const g = useRef<THREE.Group>(null);
    const kropp = useRef<THREE.MeshStandardMaterial>(null);
    const forste = useRef(true);
    const farge = useMemo(() => new THREE.Color(), []);
    useFrame((state, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const dt = Math.min(rawDt, 0.05);
        if (forste.current) {
            gr.position.copy(mål);
            forste.current = false;
        }
        const før = gr.position.clone();
        gr.position.x = damp(gr.position.x, mål.x, 0.9, dt);
        gr.position.z = damp(gr.position.z, mål.z, 0.9, dt);
        const fart = før.distanceTo(gr.position) / Math.max(dt, 0.001);
        gr.position.y = fart > 0.3 ? Math.abs(Math.sin(state.clock.elapsedTime * 9)) * 0.15 : 0;
        const s = damp(gr.scale.x, 1, 1.5, dt);
        gr.scale.setScalar(s);
        if (kropp.current) {
            farge.set(FOLKEFARGE[tilstand]);
            kropp.current.color.lerp(farge, 1 - Math.exp(-2 * dt));
        }
    });
    return (
        <group ref={g}>
            <mesh position={[0, 0.75, 0]}>
                <cylinderGeometry args={[0.32, 0.4, 1.5, 8]} />
                <meshStandardMaterial ref={kropp} color={FOLKEFARGE[tilstand]} flatShading />
            </mesh>
            <mesh material={mat.hud} position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.32, 10, 8]} />
            </mesh>
        </group>
    );
}

/** Fabrikken ved kaia. Vinduene lyser og pipa ryker mens den er i drift. */
function Fabrikk({ drift, playing }: { drift: boolean; playing: boolean }) {
    const vinduer = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const røyk = useRef<THREE.Group>(null);
    useFrame((state, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        for (const m of vinduer.current) if (m) m.emissiveIntensity = damp(m.emissiveIntensity, drift ? 1.1 : 0, 1.5, dt);
        const r = røyk.current;
        if (!r) return;
        r.children.forEach((c, i) => {
            const fase = (state.clock.elapsedTime * 0.25 + i / r.children.length) % 1;
            c.position.set(fase * 3, fase * 9, 0);
            const s = damp(c.scale.x, drift ? 0.8 + fase * 1.6 : 0.001, 1.2, dt);
            c.scale.setScalar(s);
        });
    });
    return (
        <group position={FABRIKK}>
            <mesh material={mat.fabrikk} position={[0, 3.5, 0]}>
                <boxGeometry args={[18, 7, 10]} />
            </mesh>
            <mesh material={mat.tak} position={[0, 7.4, 0]}>
                <boxGeometry args={[18.6, 0.8, 10.6]} />
            </mesh>
            {[-6, 0, 6].map((x, i) => (
                <mesh key={x} position={[x, 4, 5.02]}>
                    <planeGeometry args={[4, 2]} />
                    <meshStandardMaterial
                        ref={(m) => {
                            vinduer.current[i] = m;
                        }}
                        color="#1f2937"
                        emissive="#fde68a"
                        emissiveIntensity={1}
                    />
                </mesh>
            ))}
            <mesh material={mat.tak} position={[0, 1.4, 5.02]}>
                <planeGeometry args={[3, 2.8]} />
            </mesh>
            <mesh material={mat.pipe} position={[6, 10, -2]}>
                <cylinderGeometry args={[0.9, 1.1, 8, 10]} />
            </mesh>
            <group ref={røyk} position={[6, 14.5, -2]}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <mesh key={i} material={mat.røyk}>
                        <icosahedronGeometry args={[1, 0]} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

/** Et lite hus med saltak. */
function Hus({ p, i }: { p: THREE.Vector3; i: number }) {
    return (
        <group position={p} rotation={[0, (frø(i + 50) - 0.5) * 0.4, 0]}>
            <mesh material={mat.husVegg[i % mat.husVegg.length]} position={[0, 1.6, 0]}>
                <boxGeometry args={[4.4, 3.2, 3.6]} />
            </mesh>
            <mesh material={mat.husTak} position={[0, 4, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[3.5, 1.8, 4]} />
            </mesh>
        </group>
    );
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

function Skilt({ tekst, tone }: { tekst: string; tone: 'rod' | 'gronn' | 'vanlig' }) {
    const farge =
        tone === 'rod' ? 'border-red-500 text-red-700' : tone === 'gronn' ? 'border-teal-500 text-teal-700' : 'border-slate-300 text-slate-800';
    return (
        <div className={`px-3 py-1 rounded-xl bg-white/95 shadow-lg border-2 font-bold whitespace-nowrap text-base ${farge}`}>
            {tekst}
        </div>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const folk = useMemo(() => folkFor(modus, beat), [modus, beat]);
    const drift = modus === 'nedlegging' && beat <= 1;
    const visLangt = modus === 'nedlegging' && beat === 3;
    return (
        <>
            <color attach="background" args={['#bfdcf0']} />
            <fog attach="fog" args={['#dbeaf5', 90, 260]} />
            <hemisphereLight args={['#ffffff', '#8aa77a', 1.1]} />
            <directionalLight position={[30, 50, 30]} intensity={1.4} />
            <mesh material={mat.gress} rotation={[-Math.PI / 2, 0, 0]} position={[40, 0, 60]}>
                <planeGeometry args={[340, 160]} />
            </mesh>
            <mesh material={mat.hav} rotation={[-Math.PI / 2, 0, 0]} position={[40, 0.02, -70]}>
                <planeGeometry args={[340, 120]} />
            </mesh>
            {/* Kaia */}
            <mesh material={mat.kai} position={[0, 0.3, -10.5]}>
                <boxGeometry args={[40, 0.6, 3]} />
            </mesh>
            {/* Veien gjennom bygda og ut */}
            <mesh material={mat.vei} position={[40, 0.04, 11]}>
                <boxGeometry args={[150, 0.06, 2.6]} />
            </mesh>
            <Fabrikk drift={drift} playing={playing} />
            {HUS.map((p, i) => (
                <Hus key={i} p={p} i={i} />
            ))}
            {/* Skolen */}
            <mesh material={mat.skole} position={[SKOLE.x, 2.5, SKOLE.z]}>
                <boxGeometry args={[12, 5, 6]} />
            </mesh>
            {/* Helsesenteret, bare etterpå, så det ikke blandes med sykehuset langt unna */}
            <group position={HELSE} visible={modus === 'etterpa'}>
                <mesh material={mat.helse} position={[0, 2.5, 0]}>
                    <boxGeometry args={[10, 5, 6]} />
                </mesh>
                <mesh material={mat.kors} position={[0, 3.2, 3.02]}>
                    <boxGeometry args={[2.2, 0.6, 0.05]} />
                </mesh>
                <mesh material={mat.kors} position={[0, 3.2, 3.02]}>
                    <boxGeometry args={[0.6, 2.2, 0.05]} />
                </mesh>
            </group>
            {/* Benker foran fabrikken */}
            {[-8, 0, 8].map((x) => (
                <mesh key={x} material={mat.benk} position={[x, 0.4, 9]}>
                    <boxGeometry args={[5, 0.3, 0.9]} />
                </mesh>
            ))}
            {/* Et annet sted i landet: sykehus og byggeplass */}
            <group position={BY_LANGT}>
                <mesh material={mat.helse} position={[0, 6, 0]}>
                    <boxGeometry args={[16, 12, 9]} />
                </mesh>
                <mesh material={mat.kors} position={[0, 9, 4.52]}>
                    <boxGeometry args={[3, 0.8, 0.05]} />
                </mesh>
                <mesh material={mat.kors} position={[0, 9, 4.52]}>
                    <boxGeometry args={[0.8, 3, 0.05]} />
                </mesh>
                <mesh material={mat.kran} position={[-24, 9, 2]}>
                    <boxGeometry args={[0.8, 18, 0.8]} />
                </mesh>
                <mesh material={mat.kran} position={[-19, 18, 2]}>
                    <boxGeometry args={[12, 0.6, 0.6]} />
                </mesh>
                <mesh material={mat.husVegg[0]} position={[-22, 2.5, 2]}>
                    <boxGeometry args={[8, 5, 6]} />
                </mesh>
            </group>
            {folk.map((f, i) => (
                <Person key={i} mål={f.mål} tilstand={f.tilstand} />
            ))}

            {modus === 'nedlegging' && beat === 0 && (
                <Html position={[FABRIKK.x - 4, 11, FABRIKK.z]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Fabrikken: 50 år ved kaia" tone="vanlig" />
                </Html>
            )}
            {modus === 'nedlegging' && beat === 1 && (
                <Html position={[FABRIKK.x, 9.5, FABRIKK.z + 5]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Fabrikken legges ned" tone="rod" />
                </Html>
            )}
            {visLangt && (
                <>
                    <Html position={[BY_LANGT.x, 16, BY_LANGT.z]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Sykehus: ledig stilling" tone="gronn" />
                    </Html>
                    <Html position={[BY_LANGT.x - 22, 23, BY_LANGT.z + 2]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Byggefirma: ledig stilling" tone="gronn" />
                    </Html>
                    <Html position={[FABRIKK.x, 11, FABRIKK.z]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Stengt" tone="rod" />
                    </Html>
                </>
            )}
            {modus === 'etterpa' && beat === 3 && (
                <Html position={[62, 4.5, 8]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Ut av arbeidslivet" tone="rod" />
                </Html>
            )}
            {modus === 'etterpa' && (beat === 0 || beat === 4) && (
                <>
                    <Html position={[SKOLE.x, 7.5, SKOLE.z]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Skolen: lærere" tone="gronn" />
                    </Html>
                    <Html position={[HELSE.x, 7.5, HELSE.z]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Helsesenter: sykepleiere" tone="gronn" />
                    </Html>
                </>
            )}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

export function ArbeidsledighetBygda({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'nedlegging';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [30, 16, 52] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
            {modus === 'nedlegging' && beat === 2 && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute left-[4%] bottom-[7%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl"
                >
                    <div className="text-5xl font-black text-red-600">over 100</div>
                    <div className="text-lg font-semibold text-slate-600">mister jobben samme dag</div>
                </motion.div>
            )}
            {modus === 'etterpa' && beat === 0 && (
                <div className="absolute left-[4%] bottom-[7%] flex flex-col gap-2">
                    {['Venner', 'En grunn til å stå opp', 'Å være til nytte'].map((t, i) => (
                        <motion.div
                            key={t}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.6 }}
                            className="px-4 py-2 rounded-xl bg-white/95 shadow-lg text-xl font-bold text-teal-700"
                        >
                            {t}
                        </motion.div>
                    ))}
                </div>
            )}
            {modus === 'etterpa' && beat >= 1 && (
                <div className="absolute right-[3%] bottom-[4%] px-3 py-1 rounded-lg bg-white/85 text-sm font-semibold text-slate-600">
                    Bygda er et tenkt eksempel
                </div>
            )}
            {modus === 'etterpa' && beat === 2 && (
                <div className="absolute left-[4%] bottom-[7%] flex flex-col gap-2">
                    {['Lavere inntekt', 'Mindre sjanse for jobb', 'I mange år etterpå'].map((t, i) => (
                        <motion.div
                            key={t}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.7 }}
                            className="px-4 py-2 rounded-xl bg-white/95 shadow-lg text-xl font-bold text-red-700"
                        >
                            {t}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
