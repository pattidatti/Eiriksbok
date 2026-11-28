import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { BrainCircuit, CarFront, Smartphone } from 'lucide-react';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, useKamera, v } from './felles3d';
import { Overskrift } from './overskrift';

/**
 * Mobilen i 3D, i tre moduser.
 *
 * «deler»: mobilen deles opp i lag. Tegningen (kanskje USA), databrikken (Taiwan), magnetene
 * (sjeldne jordarter, Kina) og til slutt monteringen (fabrikk i Kina).
 * «brikke»: databrikken på nært hold. Bryterne lyser, så stopper en sperre de beste brikkene
 * på vei til Kina, mens en svakere brikke slipper gjennom.
 * «magnet»: Kinas råvarer bak et gjerde, og kampflyet som trenger magnetene.
 */

type Modus = 'deler' | 'brikke' | 'magnet';

const BLÅ = '#2563eb';
/** Faste startverdier, så R3F ikke setter dem på nytt ved hver render (se guiden §3c punkt 46). */
const MOBIL_ROT: [number, number, number] = [0.08, -0.5, 0];
const SVAK_START: [number, number, number] = [0.5, 0, 0];
const TEAL = '#0d9488';
const RØD = '#dc2626';

/* ------------------------------------------------------------------ */
/* Deler                                                               */
/* ------------------------------------------------------------------ */

/** Hvor langt ut hvert lag ligger langs mobilens dybde (z), samlet og delt. */
const LAG = { skjerm: [0.2, 3.2], kort: [0, 0.6], magnet: [-0.05, -1.4], bak: [-0.2, -3.6] };

function delt(beat: number) {
    return beat >= 1 && beat !== 4;
}

function Merke({
    tekst,
    under,
    farge,
}: {
    tekst: string;
    under: string;
    farge: string;
}) {
    return (
        <div
            className="px-4 py-2 rounded-2xl shadow-xl text-white text-center whitespace-nowrap"
            style={{ background: farge }}
        >
            <div className="font-display font-black text-2xl leading-tight">{tekst}</div>
            <div className="text-xl font-semibold text-white/90 leading-tight">{under}</div>
        </div>
    );
}

function Mobil({ beat, playing }: { beat: number; playing: boolean }) {
    const gruppe = useRef<THREE.Group>(null);
    const lag = useRef<Record<string, THREE.Group | null>>({});
    const brikkeMat = useRef<THREE.MeshStandardMaterial>(null);
    const magnetMat = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const bakMat = useRef<THREE.MeshStandardMaterial>(null);
    const tegning = useRef<THREE.LineSegments>(null);
    const tid = useRef(0);
    const forste = useRef(true);
    const kanter = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(3, 6, 0.4)), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const k = forste.current;
        forste.current = false;
        const ut = delt(beat);
        for (const [navn, [inne, ute]] of Object.entries(LAG)) {
            const g = lag.current[navn];
            if (!g) continue;
            const mål = ut ? ute : inne;
            g.position.z = k ? mål : damp(g.position.z, mål, 3, dt);
        }
        const g = gruppe.current;
        if (g) {
            // Beat 0: mobilen snur seg sakte. Ellers står den på skrå, så lagene synes.
            const mål = beat === 0 ? -0.5 + Math.sin(tid.current * 0.6) * 0.5 : -0.95;
            g.rotation.y = k ? mål : damp(g.rotation.y, mål, 2, dt);
        }
        const lys = (på: boolean) => (på ? 0.9 + Math.sin(tid.current * 4) * 0.15 : 0);
        if (brikkeMat.current) brikkeMat.current.emissiveIntensity = lys(beat === 2 || beat === 5);
        magnetMat.current.forEach((m) => {
            if (m) m.emissiveIntensity = lys(beat === 3 || beat === 5);
        });
        if (bakMat.current) bakMat.current.emissiveIntensity = lys(beat === 1 || beat === 5) * 0.5;
        if (tegning.current) {
            const m = tegning.current.material as THREE.LineBasicMaterial;
            const mål = beat === 1 || beat === 5 ? 1 : 0;
            m.opacity = k ? mål : damp(m.opacity, mål, 4, dt);
        }
    });
    const ut = delt(beat);
    return (
        <group ref={gruppe} rotation={MOBIL_ROT}>
            {/* Skjermen foran */}
            <group ref={(g) => { lag.current.skjerm = g; }}>
                <mesh>
                    <boxGeometry args={[3, 6, 0.12]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.3} />
                </mesh>
                <mesh position={[0, 0, 0.07]}>
                    <planeGeometry args={[2.7, 5.6]} />
                    <meshStandardMaterial color="#1e3a8a" emissive="#3b82f6" emissiveIntensity={0.35} />
                </mesh>
            </group>
            {/* Kretskortet med databrikken */}
            <group ref={(g) => { lag.current.kort = g; }}>
                <mesh>
                    <boxGeometry args={[2.5, 4.8, 0.08]} />
                    <meshStandardMaterial color="#166534" flatShading />
                </mesh>
                <mesh position={[0, 1.2, 0.1]}>
                    <boxGeometry args={[0.9, 0.9, 0.14]} />
                    <meshStandardMaterial ref={brikkeMat} color="#111827" emissive="#2dd4bf" emissiveIntensity={0} />
                </mesh>
                {[-0.7, 0.7].map((x) => (
                    <mesh key={x} position={[x, -0.3, 0.07]}>
                        <boxGeometry args={[0.5, 0.7, 0.08]} />
                        <meshStandardMaterial color="#334155" />
                    </mesh>
                ))}
                {ut && beat === 2 && (
                    <Html position={[1.9, 1.2, 0]} center zIndexRange={[20, 0]}>
                        <Merke tekst="Databrikker" under="laget av ett selskap på Taiwan" farge={TEAL} />
                    </Html>
                )}
            </group>
            {/* Magnetene */}
            <group ref={(g) => { lag.current.magnet = g; }}>
                {[-0.75, 0.75].map((x, i) => (
                    <mesh key={x} position={[x, -2.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.32, 0.32, 0.16, 32]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                magnetMat.current[i] = m;
                            }}
                            color="#94a3b8"
                            metalness={0.7}
                            roughness={0.3}
                            emissive="#ef4444"
                            emissiveIntensity={0}
                        />
                    </mesh>
                ))}
                {ut && beat === 3 && (
                    <Html position={[0, -3.1, 0]} center zIndexRange={[20, 0]}>
                        <Merke tekst="Magneter: sjeldne jordarter" under="Kina lager nesten 90 % av dem" farge={RØD} />
                    </Html>
                )}
            </group>
            {/* Baksiden */}
            <group ref={(g) => { lag.current.bak = g; }}>
                <mesh>
                    <boxGeometry args={[3, 6, 0.12]} />
                    <meshStandardMaterial ref={bakMat} color="#e2e8f0" emissive={BLÅ} emissiveIntensity={0} />
                </mesh>
                <mesh position={[-0.8, 2.3, -0.1]}>
                    <boxGeometry args={[0.9, 0.9, 0.1]} />
                    <meshStandardMaterial color="#cbd5e1" />
                </mesh>
                <lineSegments ref={tegning} geometry={kanter} position={[0, 0, -1.4]} scale={1.04}>
                    <lineBasicMaterial color="#60a5fa" transparent opacity={0} />
                </lineSegments>
                {ut && beat === 1 && (
                    <Html position={[0, 3.9, -0.6]} center zIndexRange={[20, 0]}>
                        <Merke tekst="Tegnet av et selskap" under="kanskje i USA" farge={BLÅ} />
                    </Html>
                )}
            </group>
        </group>
    );
}

/** Fabrikkgulvet under mobilen når den settes sammen (beat 4). */
function Fabrikk({ beat }: { beat: number }) {
    if (beat !== 4) return null;
    return (
        <group position={[0, -3.6, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[3.2, 48]} />
                <meshStandardMaterial color={RØD} emissive={RØD} emissiveIntensity={0.3} />
            </mesh>
            <Html position={[0, -0.6, 2.6]} center zIndexRange={[20, 0]}>
                <Merke tekst="Satt sammen" under="på fabrikker i Kina" farge={RØD} />
            </Html>
        </group>
    );
}

function kameraDeler(beat: number, t: number) {
    if (beat === 0) return { pos: v(0, 1.2, 13 - Math.min(t, 6) * 0.2), se: v(0, 0, 0) };
    if (beat === 4) return { pos: v(0, 1.5, 13.5), se: v(0, -0.6, 0) };
    return { pos: v(0.6, 1.4, 17.5), se: v(0.3, -0.1, 0) };
}

/* ------------------------------------------------------------------ */
/* Brikke                                                              */
/* ------------------------------------------------------------------ */

const N = 8;
const VEGG_X = 5.2;

function kameraBrikke(beat: number) {
    if (beat === 0) return { pos: v(-1, 7, 10), se: v(0, 0, 0) };
    if (beat === 1) return { pos: v(0, 5.2, 4.6), se: v(0, 0.2, 0) };
    if (beat === 2) return { pos: v(2.6, 4.6, 5.6), se: v(0, 0.3, 0) };
    return { pos: v(3.6, 11, 14), se: v(4, 0, 0.5) };
}

function Brytere({ beat, playing, svak = false }: { beat: number; playing: boolean; svak?: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const o = useMemo(() => new THREE.Object3D(), []);
    const farge = useMemo(() => new THREE.Color(), []);
    const antall = N * N;
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        const t = tid.current;
        const steg = 2.2 / N;
        for (let i = 0; i < antall; i++) {
            const x = (i % N) - (N - 1) / 2;
            const z = Math.floor(i / N) - (N - 1) / 2;
            o.position.set(x * steg, 0.18, z * steg);
            o.scale.setScalar(1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            // En bølge som går over brikken. På pause: et fast mønster.
            const bølge = playing
                ? Math.sin(t * 3 - (x + z) * 0.7) > 0.2
                : (Math.abs(x) + Math.abs(z)) % 2 < 1;
            let c = '#1f2937';
            if (beat >= 1) c = bølge ? (beat === 2 ? '#facc15' : '#5eead4') : '#134e4a';
            if (svak) c = bølge && i % 3 === 0 ? '#5eead4' : '#334155';
            farge.set(c);
            m.setColorAt(i, farge);
        }
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
            <boxGeometry args={[0.18, 0.06, 0.18]} />
            <meshBasicMaterial />
        </instancedMesh>
    );
}

function Brikke({ storrelse, children }: { storrelse: number; children?: React.ReactNode }) {
    const bein = [-0.36, -0.12, 0.12, 0.36];
    return (
        <group scale={storrelse / 2.6}>
            <mesh position={[0, 0.07, 0]}>
                <boxGeometry args={[2.6, 0.14, 2.6]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            {bein.map((b) =>
                [0, 1, 2, 3].map((side) => {
                    const r = (side * Math.PI) / 2;
                    const x = Math.cos(r) * 1.45 + Math.sin(r) * b * 2.6;
                    const z = Math.sin(r) * 1.45 - Math.cos(r) * b * 2.6;
                    return (
                        <mesh key={`${b}-${side}`} position={[x, 0.04, z]} rotation={[0, -r, 0]}>
                            <boxGeometry args={[0.3, 0.05, 0.14]} />
                            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
                        </mesh>
                    );
                })
            )}
            {children}
        </group>
    );
}

function BrikkeScene({ beat, playing }: { beat: number; playing: boolean }) {
    const stor = useRef<THREE.Group>(null);
    const svak = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        // På pause står alt i sluttstillingen for beaten.
        const f = playing ? Math.min(tid.current / 2.5, 1) : 1;
        const myk = f * f * (3 - 2 * f);
        if (stor.current) {
            stor.current.position.x = beat < 3 ? 0 : beat === 3 ? myk * 3.4 : 3.4;
        }
        if (svak.current) {
            svak.current.visible = beat >= 4;
            svak.current.position.x = beat === 4 ? 0.5 + myk * 7.5 : 8;
        }
    });
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 0, 0]}>
                <planeGeometry args={[40, 24]} />
                <meshStandardMaterial color="#14532d" />
            </mesh>
            {/* Kobberbaner på kortet */}
            {[-3, -1.5, 1.5, 3].map((z) => (
                <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[3, 0.01, z]}>
                    <planeGeometry args={[30, 0.12]} />
                    <meshStandardMaterial color="#ca8a04" />
                </mesh>
            ))}
            <group ref={stor}>
                <Brikke storrelse={2.6}>
                    <Brytere beat={beat} playing={playing} />
                </Brikke>
            </group>
            <group ref={svak} position={SVAK_START} visible={false}>
                <Brikke storrelse={1.2}>
                    <Brytere beat={beat} playing={playing} svak />
                </Brikke>
            </group>
            {/* Sperren mellom USA og Kina, med en åpning for de svakere brikkene */}
            {beat >= 3 &&
                [-1, 1].map((s) => (
                    <mesh key={s} position={[VEGG_X, 0.9, s * 3.4]}>
                        <boxGeometry args={[0.4, 1.8, 5]} />
                        <meshStandardMaterial color={RØD} emissive={RØD} emissiveIntensity={0.25} />
                    </mesh>
                ))}
            {beat === 3 && (
                <mesh position={[VEGG_X, 0.9, 0]}>
                    <boxGeometry args={[0.4, 1.8, 1.8]} />
                    <meshStandardMaterial color={RØD} emissive={RØD} emissiveIntensity={0.25} />
                </mesh>
            )}
            {beat >= 3 && (
                <>
                    <Html position={[-1.5, 0, -5.2]} center zIndexRange={[20, 0]}>
                        <div className="px-5 py-1.5 rounded-xl bg-blue-700 text-white font-display font-black text-3xl shadow-xl">
                            USA
                        </div>
                    </Html>
                    <Html position={[10, 0, -5.2]} center zIndexRange={[20, 0]}>
                        <div className="px-5 py-1.5 rounded-xl bg-red-700 text-white font-display font-black text-3xl shadow-xl">
                            KINA
                        </div>
                    </Html>
                </>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Magnet                                                              */
/* ------------------------------------------------------------------ */

const RÅVARER = [
    { navn: 'gallium', farge: '#a5b4fc', x: -3 },
    { navn: 'germanium', farge: '#9ca3af', x: 0 },
    { navn: 'magneter', farge: '#475569', x: 3 },
];

function kameraMagnet(beat: number) {
    if (beat === 0) return { pos: v(0, 6, 11), se: v(0, 0.5, 0) };
    if (beat === 1) return { pos: v(-1, 8.5, 12), se: v(0, 0.3, 0) };
    return { pos: v(6, 6.5, 15), se: v(7.5, 1, 0) };
}

function Gjerde({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 1;
        const mål = beat >= 1 ? 1 : 0.001;
        if (ref.current) ref.current.scale.y = damp(ref.current.scale.y, mål, 3, dt);
    });
    const stolper = useMemo(() => {
        const p: [number, number][] = [];
        for (let i = 0; i <= 12; i++) {
            const x = -5.4 + i * 0.9;
            p.push([x, -2.6], [x, 2.6]);
        }
        for (let i = 1; i < 6; i++) {
            const z = -2.6 + i * 0.866;
            p.push([-5.4, z], [5.4, z]);
        }
        return p;
    }, []);
    return (
        <group ref={ref} scale={[1, 0.001, 1]}>
            {stolper.map(([x, z], i) => (
                <mesh key={i} position={[x, 0.9, z]}>
                    <cylinderGeometry args={[0.07, 0.07, 1.8, 6]} />
                    <meshStandardMaterial color={RØD} emissive={RØD} emissiveIntensity={0.3} />
                </mesh>
            ))}
        </group>
    );
}

/** Et enkelt kampfly av grunnformer. */
function Fly() {
    const vinge = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(0, 0);
        s.lineTo(-1.6, 3.2);
        s.lineTo(-2.6, 3.2);
        s.lineTo(-2.2, 0);
        s.closePath();
        return s;
    }, []);
    return (
        <group position={[9, 2.2, 0]} rotation={[0, -0.5, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.45, 0.55, 6, 16]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </mesh>
            <mesh position={[-3.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.45, 1.4, 16]} />
                <meshStandardMaterial color="#475569" flatShading />
            </mesh>
            <mesh position={[-1.8, 0.45, 0]} scale={[1.2, 0.5, 0.6]}>
                <sphereGeometry args={[0.5, 24, 16]} />
                <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.2} />
            </mesh>
            {[1, -1].map((s) => (
                <mesh key={s} position={[1.1, 0, 0]} rotation={[(s * Math.PI) / 2, 0, 0]} scale={[1, s, 1]}>
                    <extrudeGeometry args={[vinge, { depth: 0.08, bevelEnabled: false }]} />
                    <meshStandardMaterial color="#64748b" side={THREE.DoubleSide} flatShading />
                </mesh>
            ))}
            {[0.5, -0.5].map((z) => (
                <mesh key={z} position={[2.6, 0.8, z]} rotation={[z * 0.6, 0, 0]}>
                    <boxGeometry args={[0.9, 1.2, 0.06]} />
                    <meshStandardMaterial color="#475569" flatShading />
                </mesh>
            ))}
            {/* Magneten inni flyet */}
            <mesh position={[0.2, 0.75, 0]}>
                <cylinderGeometry args={[0.45, 0.45, 0.2, 32]} />
                <meshStandardMaterial color="#94a3b8" emissive="#ef4444" emissiveIntensity={1} />
            </mesh>
        </group>
    );
}

function MagnetScene({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[11.2, 5.6]} />
                <meshStandardMaterial color="#fecaca" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.01, 0]}>
                <planeGeometry args={[60, 30]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            {RÅVARER.map((r) => (
                <group key={r.navn} position={[r.x, 0, 0]}>
                    {[0, 1, 2].map((i) => (
                        <mesh key={i} position={[(i - 1) * 0.75, 0.3 + (i === 1 ? 0.5 : 0), i === 1 ? 0 : 0.2]}>
                            <boxGeometry args={[0.7, 0.5, 1.4]} />
                            <meshStandardMaterial
                                color={r.farge}
                                metalness={0.6}
                                roughness={0.35}
                                emissive={r.navn === 'magneter' && beat >= 2 ? '#ef4444' : '#000000'}
                                emissiveIntensity={0.6}
                            />
                        </mesh>
                    ))}
                    {beat <= 1 && (
                        <Html position={[0, -0.2, 2.2]} center zIndexRange={[20, 0]}>
                            <div className="px-3 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-bold text-slate-900 whitespace-nowrap">
                                {r.navn}
                            </div>
                        </Html>
                    )}
                </group>
            ))}
            <Gjerde beat={beat} playing={playing} />
            {beat <= 1 && (
                <Html position={[0, 0, -3.6]} center zIndexRange={[20, 0]}>
                    <div className="px-5 py-1.5 rounded-xl bg-red-700 text-white font-display font-black text-3xl shadow-xl">
                        KINA
                    </div>
                </Html>
            )}
            {beat >= 2 && <Fly />}
            {beat >= 2 && (
                <Html position={[9.5, -0.4, 2.5]} center zIndexRange={[20, 0]}>
                    <div className="px-4 py-2 rounded-2xl bg-blue-700 text-white text-center shadow-xl whitespace-nowrap">
                        <div className="font-display font-black text-2xl">Kampflyet F-35</div>
                        <div className="text-lg font-semibold text-blue-100">trenger slike magneter</div>
                    </div>
                </Html>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ */

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera(
        modus === 'deler' ? kameraDeler : modus === 'brikke' ? kameraBrikke : kameraMagnet,
        beat,
        playing
    );
    const himmel = modus === 'brikke' ? '#0f172a' : modus === 'magnet' ? '#f1f5f9' : '#1e293b';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 30, 80]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#ffffff', '#64748b', 0.6]} />
            <directionalLight position={[6, 12, 10]} intensity={1.6} />
            <directionalLight position={[-8, 4, -6]} intensity={0.5} />
            {modus === 'deler' && (
                <>
                    <Mobil beat={beat} playing={playing} />
                    <Fabrikk beat={beat} />
                </>
            )}
            {modus === 'brikke' && <BrikkeScene beat={beat} playing={playing} />}
            {modus === 'magnet' && <MagnetScene beat={beat} playing={playing} />}
        </>
    );
}

const TITLER: Record<Modus, string[]> = {
    deler: [
        'Hvor kommer mobilen fra?',
        'Tegningen',
        'Databrikkene',
        'Magnetene',
        'Monteringen',
        'Et samarbeid mellom mange land',
    ],
    brikke: [
        'Kampen om databrikkene',
        'Bittesmå elektriske brytere',
        'Noen kaller dem «den nye oljen»',
        'Oktober 2022: USA sier stopp',
        'Nvidia: svakere brikker',
        'August 2025: noen slike brikker får lov',
    ],
    magnet: ['Kinas våpen: råvarer', 'Kina begrenser salget', 'USA: svært alvorlig'],
};

export function UsaKinaMobil({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'deler';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [0, 1.2, 13] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <Overskrift key={`${modus}-${tittel}`} tekst={tittel} />
            </AnimatePresence>

            {/* Alle tre opphavene samlet (deler, beat 5) */}
            <AnimatePresence>
                {modus === 'deler' && beat === 5 && (
                    <motion.div
                        key="alle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute inset-x-0 bottom-[5%] flex justify-center gap-3"
                    >
                        {[
                            ['Tegnet', 'kanskje i USA', BLÅ],
                            ['Databrikker', 'Taiwan', TEAL],
                            ['Magneter og montering', 'Kina', RØD],
                        ].map(([t, u, f]) => (
                            <Merke key={t} tekst={t} under={u} farge={f} />
                        ))}
                    </motion.div>
                )}
                {modus === 'brikke' && beat === 1 && (
                    <motion.div
                        key="hjerne"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute inset-x-0 bottom-[5%] flex justify-center gap-3"
                    >
                        {[
                            [Smartphone, 'mobiler'],
                            [CarFront, 'biler'],
                            [BrainCircuit, 'kunstig intelligens'],
                        ].map(([Ikon, t]) => {
                            const I = Ikon as typeof Smartphone;
                            return (
                                <div
                                    key={t as string}
                                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-slate-900"
                                >
                                    <I className="w-8 h-8 text-teal-600" /> {t as string}
                                </div>
                            );
                        })}
                    </motion.div>
                )}
                {modus === 'brikke' && beat === 3 && (
                    <Kort key="stopp" farge={RØD}>
                        <div className="font-display font-black text-2xl">De mest avanserte brikkene</div>
                        <div className="text-xl font-semibold text-white/90">og maskinene som lager dem</div>
                    </Kort>
                )}
                {modus === 'brikke' && beat === 4 && (
                    <Kort key="svak" farge="#334155">
                        <div className="font-display font-black text-2xl">Svakere utgaver</div>
                        <div className="text-lg font-semibold text-white/90">fikk fortsatt lov å selges til Kina</div>
                    </Kort>
                )}
                {modus === 'brikke' && beat === 5 && (
                    <Kort key="andel" farge="#ffffff">
                        <div className="flex items-center gap-4 text-slate-900">
                            <div
                                className="rounded-full"
                                style={{
                                    width: 72,
                                    height: 72,
                                    background: `conic-gradient(${BLÅ} 0 15%, #cbd5e1 15% 100%)`,
                                }}
                            />
                            <div>
                                <div className="font-display font-black text-3xl text-blue-700">15 %</div>
                                <div className="text-lg font-semibold text-slate-600">
                                    av inntektene til staten i USA
                                </div>
                            </div>
                        </div>
                    </Kort>
                )}
            </AnimatePresence>
        </div>
    );
}

function Kort({ children, farge }: { children: React.ReactNode; farge: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute left-[3%] bottom-[6%] px-5 py-3 rounded-2xl shadow-xl text-white"
            style={{ background: farge }}
        >
            {children}
        </motion.div>
    );
}
