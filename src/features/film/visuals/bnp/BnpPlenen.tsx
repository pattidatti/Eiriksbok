import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * To hus med hver sin plen i 3D. «plen»: du klipper naboens plen for 200 kroner (teller i
 * BNP), så din egen (teller ikke). «brann»: naboens hus brenner, brannbilen og ambulansen
 * kommer, og BNP stiger likevel, selv om huset er borte (Bastiat: det vi ser og det vi ikke
 * ser). Ingen mennesker i nærheten av brannen.
 * Alt styres av (beat, beatTid), så bildet tåler at eleven hopper.
 */

type Modus = 'plen' | 'brann';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    plen: [
        'Lørdag: naboen spør om hjelp',
        'En time med klipping',
        'BNP ble litt større',
        'Uka etter: plenen hjemme',
        'Ingen betaling, ikke med i BNP',
    ],
    brann: ['Et hus brenner', 'Brannvesenet og ambulansen kommer', 'Det vi ser', 'Det vi ikke ser', 'Huset trekkes aldri fra'],
};

/** Naboens hus står til venstre, ditt til høyre. */
const NABO_X = -11;
const HJEM_X = 11;
const KOLONNER = 8;
const RADER = 6;
const RUTE = 1.5;
const RUTER = KOLONNER * RADER;
/** Sekunder det tar å klippe en hel plen. */
const KLIPPETID = 5.5;

/** Midten av rute nr. i i slangemønster (fram og tilbake), plenen ligger foran huset. */
function rutePlass(husX: number, i: number) {
    const rad = Math.floor(i / KOLONNER);
    const k = i % KOLONNER;
    const kol = rad % 2 === 0 ? k : KOLONNER - 1 - k;
    return v(husX + (kol - (KOLONNER - 1) / 2) * RUTE, 0, 4 + rad * RUTE);
}

/** Hvor langt plenen er klippet (0-1) for denne beaten. */
function klippet(modus: Modus, hus: 'nabo' | 'hjem', beat: number, t: number) {
    if (modus === 'brann') return 1;
    const start = hus === 'nabo' ? 1 : 3;
    if (beat < start) return 0;
    if (beat > start) return 1;
    return Math.min(1, t / KLIPPETID);
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'plen') {
        switch (beat) {
            case 0:
                return { pos: v(-2 - t * 0.3, 7, 24), se: v(NABO_X, 2, 3) };
            case 1:
                return { pos: v(NABO_X + 10, 9, 22), se: v(NABO_X, 0.5, 7) };
            case 2:
                return { pos: v(0, 15 + t * 0.3, 34), se: v(-4, 1, 4) };
            case 3:
                return { pos: v(HJEM_X - 9, 9, 22), se: v(HJEM_X, 0.5, 7) };
            default:
                return { pos: v(4 + t * 0.3, 16, 36), se: v(2, 1, 4) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(NABO_X + 15, 9, 30), se: v(NABO_X, 5, 0) };
        case 1:
            return { pos: v(4, 11, 30), se: v(NABO_X + 2, 2, 6) };
        case 2:
            return { pos: v(NABO_X + 9 - t * 0.3, 6, 18), se: v(NABO_X, 3, 0) };
        default:
            return { pos: v(0, 14, 34), se: v(-4, 2, 3) };
    }
}

const mat = {
    gress: new THREE.MeshStandardMaterial({ color: '#7cbf5a', emissive: '#2c4a1c', emissiveIntensity: 0.25, roughness: 1 }),
    plen: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true }),
    vei: new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 1 }),
    vegg: new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.8, flatShading: true }),
    veggHjem: new THREE.MeshStandardMaterial({ color: '#dbeafe', roughness: 0.8, flatShading: true }),
    svidd: new THREE.MeshStandardMaterial({ color: '#3f3a36', roughness: 1, flatShading: true }),
    tak: new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.8, flatShading: true }),
    takHjem: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8, flatShading: true }),
    vindu: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4 }),
    dor: new THREE.MeshStandardMaterial({ color: '#7c4a21', roughness: 0.9 }),
    stamme: new THREE.MeshStandardMaterial({ color: '#6b4423', roughness: 1, flatShading: true }),
    krone: new THREE.MeshStandardMaterial({ color: '#2f7d32', roughness: 1, flatShading: true }),
    klipper: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.6, flatShading: true }),
    svart: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.8 }),
    hud: new THREE.MeshStandardMaterial({ color: '#e8b48c', roughness: 0.9, flatShading: true }),
    du: new THREE.MeshStandardMaterial({ color: '#2563eb', flatShading: true }),
    flamme: new THREE.MeshBasicMaterial({ color: '#f97316', transparent: true, opacity: 0.9 }),
    flammeKjerne: new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0.95 }),
    royk: new THREE.MeshStandardMaterial({ color: '#6b7280', transparent: true, opacity: 0.55, roughness: 1 }),
    brannbil: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.5, flatShading: true }),
    stige: new THREE.MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.5 }),
    ambulanse: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5, flatShading: true }),
    kors: new THREE.MeshBasicMaterial({ color: '#dc2626' }),
    vann: new THREE.MeshBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.7 }),
};

const LANGT = new THREE.Color('#3f8f2f');
const KORT_A = new THREE.Color('#9be27a');
const KORT_B = new THREE.Color('#86d066');

/** Plenen: én instans per rute. Uklippet gress er høyt og mørkt, klippet er lavt i striper. */
function Plen({ husX, hus, modus, beat, playing }: { husX: number; hus: 'nabo' | 'hjem'; modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const hoyder = useRef<number[]>(new Array(RUTER).fill(-1));
    const dummy = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const ferdig = klippet(modus, hus, beat, tid.current) * RUTER;
        let endret = false;
        for (let i = 0; i < RUTER; i++) {
            const mål = i < ferdig ? 0.12 : 0.55;
            const før = hoyder.current[i];
            const h = før < 0 ? mål : damp(før, mål, 8, Math.max(dt, 0.016));
            if (Math.abs(h - før) < 0.001) continue;
            hoyder.current[i] = h;
            const p = rutePlass(husX, i);
            dummy.position.set(p.x, h / 2, p.z);
            dummy.scale.set(1, h, 1);
            dummy.updateMatrix();
            m.setMatrixAt(i, dummy.matrix);
            const rad = Math.floor(i / KOLONNER);
            m.setColorAt(i, h < 0.3 ? (rad % 2 ? KORT_A : KORT_B) : LANGT);
            endret = true;
        }
        if (endret) {
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, RUTER]} material={mat.plen}>
            <boxGeometry args={[RUTE * 0.98, 1, RUTE * 0.98]} />
        </instancedMesh>
    );
}

/** Gressklipperen og deg bak den. Står parkert til plenen skal klippes. */
function Klipper({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const g = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const hjem = beat >= 3;
        const husX = hjem ? HJEM_X : NABO_X;
        const p = klippet(modus, hjem ? 'hjem' : 'nabo', beat, tid.current);
        const i = Math.min(RUTER - 1, Math.floor(p * RUTER));
        // Før klippingen står klipperen ved hjørnet av plenen, etterpå ved siste rute.
        const mål = p === 0 ? v(husX + 7.5, 0, 2.5) : rutePlass(husX, i);
        if (forste.current) {
            gr.position.copy(mål);
            forste.current = false;
        }
        gr.position.x = damp(gr.position.x, mål.x, 6, Math.max(dt, 0.001));
        gr.position.z = damp(gr.position.z, mål.z, 6, Math.max(dt, 0.001));
        const rad = Math.floor(i / KOLONNER);
        const vinkel = p === 0 || p === 1 ? 0 : rad % 2 === 0 ? -Math.PI / 2 : Math.PI / 2;
        gr.rotation.y = damp(gr.rotation.y, vinkel, 6, Math.max(dt, 0.001));
    });
    if (modus === 'brann') return null;
    return (
        <group ref={g}>
            <mesh material={mat.klipper} position={[0, 0.45, 0]}>
                <boxGeometry args={[1.2, 0.5, 1.4]} />
            </mesh>
            {[-0.55, 0.55].map((x) =>
                [-0.55, 0.55].map((z) => (
                    <mesh key={`${x}${z}`} material={mat.svart} position={[x, 0.2, z]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.15, 10]} />
                    </mesh>
                ))
            )}
            <mesh material={mat.svart} position={[0, 1.1, 1.2]} rotation={[0.6, 0, 0]}>
                <boxGeometry args={[0.9, 0.08, 1.6]} />
            </mesh>
            {/* Deg: bak håndtaket */}
            <mesh material={mat.du} position={[0, 0.9, 2.1]}>
                <cylinderGeometry args={[0.32, 0.4, 1.6, 8]} />
            </mesh>
            <mesh material={mat.hud} position={[0, 2, 2.1]}>
                <sphereGeometry args={[0.32, 10, 8]} />
            </mesh>
        </group>
    );
}

function Hus({ x, vegg, tak, brenner, svidd }: { x: number; vegg: THREE.Material; tak: THREE.Material; brenner: boolean; svidd: boolean }) {
    const veggMat = svidd ? mat.svidd : vegg;
    return (
        <group position={[x, 0, -3]}>
            <mesh material={veggMat} position={[0, 2.2, 0]}>
                <boxGeometry args={[9, 4.4, 6]} />
            </mesh>
            {/* Saltak: et prisme med mønet øverst (thetaStart legger ett hjørne rett opp) */}
            <mesh material={svidd ? mat.svidd : tak} position={[0, 6.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[3.6, 3.6, 9.6, 3, 1, false, Math.PI / 2]} />
            </mesh>
            {[-2.6, 2.6].map((wx) => (
                <mesh key={wx} material={mat.vindu} position={[wx, 2.6, 3.01]}>
                    <planeGeometry args={[1.6, 1.3]} />
                </mesh>
            ))}
            <mesh material={mat.dor} position={[0, 1.2, 3.01]}>
                <planeGeometry args={[1.2, 2.4]} />
            </mesh>
            <mesh material={veggMat} position={[2.6, 8, -1]}>
                <boxGeometry args={[0.9, 2.2, 0.9]} />
            </mesh>
            {brenner && <Flammer />}
        </group>
    );
}

const FLAMMER: [number, number, number, number][] = [
    [-2.6, 3.4, 3.3, 1.6],
    [2.6, 3.4, 3.3, 1.8],
    [-2.4, 6.9, 1.4, 2.2],
    [1.8, 7.4, 1, 2.4],
    [0, 9.2, 0, 2.6],
    [-3.6, 8.2, -0.6, 2],
    [3.4, 8.4, -0.4, 2.1],
];

/** Flammer som blafrer på taket og i vinduene, med røyk som stiger rett opp bak huset. */
function Flammer() {
    const flammer = useRef<(THREE.Mesh | null)[]>([]);
    const royk = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        flammer.current.forEach((f, i) => {
            if (!f) return;
            const s = FLAMMER[i][3] * (1 + 0.18 * Math.sin(t * 7 + i * 1.7));
            f.scale.set(s, s * (1.1 + 0.25 * Math.sin(t * 9 + i)), s);
        });
        royk.current.forEach((r, i) => {
            if (!r) return;
            const fase = (t * 0.25 + i / 5) % 1;
            r.position.set(Math.sin(i * 2.1) * 1.5, 10 + fase * 8, -2 - fase * 3);
            r.scale.setScalar(1 + fase * 2.4);
        });
    });
    return (
        <>
            {FLAMMER.map(([x, y, z], i) => (
                <group key={i} position={[x, y, z]}>
                    <mesh
                        ref={(m) => {
                            flammer.current[i] = m;
                        }}
                        material={mat.flamme}
                    >
                        <coneGeometry args={[0.7, 2, 7]} />
                    </mesh>
                    <mesh material={mat.flammeKjerne} position={[0, -0.3, 0.1]} scale={0.55}>
                        <coneGeometry args={[0.7, 2, 7]} />
                    </mesh>
                </group>
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        royk.current[i] = m;
                    }}
                    material={mat.royk}
                >
                    <sphereGeometry args={[1.2, 10, 8]} />
                </mesh>
            ))}
        </>
    );
}

/** Et kjøretøy som kjører inn langs veien til plassen sin foran naboens hus. */
function Bil({ fra, til, kommer, children, merke }: { fra: number; til: number; kommer: boolean; children: React.ReactNode; merke: string | null }) {
    const g = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const mål = kommer ? til : fra;
        if (forste.current) {
            gr.position.x = mål;
            forste.current = false;
        }
        gr.position.x = damp(gr.position.x, mål, 1.4, Math.min(rawDt, 0.05));
        gr.visible = Math.abs(gr.position.x - fra) > 0.5 || kommer;
    });
    return (
        <group ref={g} position={[fra, 0, 16.5]}>
            {children}
            {merke && kommer && (
                <Html position={[0, 3.6, 0]} center zIndexRange={[10, 0]}>
                    <div className="px-3 py-1 rounded-xl bg-white/95 shadow-lg border-2 border-teal-500 text-teal-700 font-bold whitespace-nowrap text-base">
                        {merke}
                    </div>
                </Html>
            )}
        </group>
    );
}

function Brannbil({ spruter }: { spruter: boolean }) {
    return (
        <>
            <mesh material={mat.brannbil} position={[0, 1.3, 0]}>
                <boxGeometry args={[5.5, 1.9, 2.2]} />
            </mesh>
            <mesh material={mat.brannbil} position={[3.4, 1.1, 0]}>
                <boxGeometry args={[1.6, 1.5, 2.2]} />
            </mesh>
            <mesh material={mat.stige} position={[-0.3, 2.45, 0]}>
                <boxGeometry args={[4.6, 0.25, 0.8]} />
            </mesh>
            {[-1.8, 1.8].map((x) => (
                <mesh key={x} material={mat.svart} position={[x, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.45, 0.45, 2.4, 12]} />
                </mesh>
            ))}
            {spruter && (
                <mesh material={mat.vann} position={[-0.5, 4.2, -5.5]} rotation={[-0.95, 0, 0]}>
                    <cylinderGeometry args={[0.12, 0.35, 12, 8]} />
                </mesh>
            )}
        </>
    );
}

function Ambulanse() {
    return (
        <>
            <mesh material={mat.ambulanse} position={[0, 1.3, 0]}>
                <boxGeometry args={[4, 2, 2.1]} />
            </mesh>
            <mesh material={mat.kors} position={[-0.4, 1.5, 1.06]}>
                <planeGeometry args={[1.2, 0.35]} />
            </mesh>
            <mesh material={mat.kors} position={[-0.4, 1.5, 1.06]}>
                <planeGeometry args={[0.35, 1.2]} />
            </mesh>
            {[-1.3, 1.3].map((x) => (
                <mesh key={x} material={mat.svart} position={[x, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.42, 0.42, 2.3, 12]} />
                </mesh>
            ))}
        </>
    );
}

function Tre({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]}>
            <mesh material={mat.stamme} position={[0, 1, 0]}>
                <cylinderGeometry args={[0.25, 0.35, 2, 6]} />
            </mesh>
            <mesh material={mat.krone} position={[0, 3.2, 0]}>
                <coneGeometry args={[1.6, 3.6, 7]} />
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
        if (forste.current) se.current.copy(m.se);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const brann = modus === 'brann';
    const brenner = brann && beat < 3;
    return (
        <>
            <color attach="background" args={[brann ? '#f6c9a0' : '#9fd8ff']} />
            <fog attach="fog" args={[brann ? '#f3d2b4' : '#d6f0ff', 60, 140]} />
            <hemisphereLight args={['#ffffff', '#86a86a', 1.1]} />
            <directionalLight position={[15, 30, 20]} intensity={1.5} />
            <mesh material={mat.gress} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 120]} />
            </mesh>
            <mesh material={mat.vei} position={[0, 0.03, 16.5]}>
                <boxGeometry args={[120, 0.06, 4]} />
            </mesh>
            <Hus x={NABO_X} vegg={mat.vegg} tak={mat.tak} brenner={brenner} svidd={brann && beat >= 3} />
            <Hus x={HJEM_X} vegg={mat.veggHjem} tak={mat.takHjem} brenner={false} svidd={false} />
            <Plen husX={NABO_X} hus="nabo" modus={modus} beat={beat} playing={playing} />
            <Plen husX={HJEM_X} hus="hjem" modus={modus} beat={beat} playing={playing} />
            <Klipper modus={modus} beat={beat} playing={playing} />
            {[
                [-24, -2],
                [-21, 6],
                [0, -4],
                [24, -1],
                [22, 8],
            ].map(([x, z]) => (
                <Tre key={`${x}${z}`} x={x} z={z} />
            ))}
            {brann && (
                <>
                    <Bil fra={-70} til={NABO_X + 1} kommer={beat >= 1} merke={beat === 1 ? 'Betalt jobb' : null}>
                        <Brannbil spruter={beat === 1} />
                    </Bil>
                    <Bil fra={-80} til={NABO_X + 9} kommer={beat >= 1} merke={beat === 1 ? 'Betalt jobb' : null}>
                        <Ambulanse />
                    </Bil>
                </>
            )}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

/** Kortet i hjørnet: hva BNP fikk med seg. */
function BnpKort({ modus, beat }: { modus: Modus; beat: number }) {
    let linje: string | null = null;
    let tone: 'gronn' | 'rod' = 'gronn';
    let under = '';
    if (modus === 'plen') {
        if (beat === 1 || beat === 2) {
            linje = '+ 200 kr';
            under = beat === 1 ? 'betalt av naboen' : 'teller i BNP';
        } else if (beat >= 3) {
            linje = beat === 3 ? '?' : '+ 0 kr';
            tone = 'rod';
            under = beat === 3 ? 'din egen plen' : 'teller ikke i BNP';
        }
    } else {
        linje = 'BNP ↑';
        if (beat === 2) tone = 'rod';
        under = beat === 2 ? 'det vi ser: noen får betalt' : beat >= 3 ? 'stiger, selv om huset er borte' : beat >= 1 ? 'brannfolk og ambulanse får lønn' : 'en brann øker BNP';
    }
    return (
        <AnimatePresence mode="wait">
            {linje && (
                <motion.div
                    key={linje + under}
                    initial={{ opacity: 0, y: 16, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: modus === 'plen' && beat === 1 ? 3.5 : 0.3 }}
                    className="absolute right-[4%] bottom-[8%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                    style={{ minWidth: 220 }}
                >
                    <div className="text-sm font-bold uppercase tracking-wide text-slate-500">Norges BNP</div>
                    <div className={`text-5xl font-black tabular-nums ${tone === 'rod' && modus === 'plen' ? 'text-red-600' : 'text-teal-600'}`}>{linje}</div>
                    <div className={`text-lg font-semibold ${tone === 'rod' && modus === 'brann' ? 'text-red-600 font-black' : 'text-slate-600'}`}>{under}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function BnpPlenen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'plen';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [0, 10, 30] }}>
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
            <BnpKort modus={modus} beat={beat} />
        </div>
    );
}
