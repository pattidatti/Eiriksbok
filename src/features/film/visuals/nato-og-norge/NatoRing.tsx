import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, v } from './felles';

/**
 * NATO som en ring av søyler, én per medlemsland. Ingen mennesker, ingen vold: et angrep er en
 * rød kjegle utenfra, og hjelpen er lysende pulser langs stråler mellom søylene.
 *
 * - `vekst`: tolv søyler reiser seg (1949), Norge lyser, så alle 32. Brussel og Stoltenberg.
 * - `artikkel5`: ett land blir angrepet, alle lyser opp, hvert land velger selv hvordan.
 * - `avskrekking`: kjeglen kommer, ser hele gjengen, og trekker seg tilbake.
 * - `beggeveier`: hjelp til Norge, bånd fra Norge, hjelp fra Norge, og USA i 2001.
 */

type Modus = 'vekst' | 'artikkel5' | 'avskrekking' | 'beggeveier';

const N = 32;
const R = 10;
const NORGE = 0;
const ANGREPET = 8;
const USA = 16;
/** Tolv grunnleggere spredt rundt ringen, med Norge foran. */
const GRUNNLEGGERE = new Set(Array.from({ length: 12 }, (_, i) => Math.round((i * N) / 12) % N));

function vinkel(i: number) {
    return Math.PI / 2 + (i * 2 * Math.PI) / N;
}
function plass(i: number, r = R) {
    return v(Math.cos(vinkel(i)) * r, 0, Math.sin(vinkel(i)) * r);
}

const BLA = new THREE.Color('#2563eb');
const BLA_LYS = new THREE.Color('#93c5fd');
const GRA = new THREE.Color('#94a3b8');
const ROD = new THREE.Color('#dc2626');
const GULL = new THREE.Color('#fbbf24');

interface Stand {
    oppe: (i: number) => boolean;
    /** Høyde når søylen er oppe (1 = full). */
    hoyde?: (i: number) => number;
    farge: (i: number) => THREE.Color;
    lys: (i: number) => number;
    /** Stråler: fra -> til. Pulsene går i den retningen. */
    straaler: [number, number][];
    /** Kjeglens avstand fra sentrum ved søyle ANGREPET, eller null når den er borte. */
    kjegle: number | null;
    overskrift: string;
    kort?: string;
    merker: { i: number; tekst: string }[];
}

function alleTil(mal: number): [number, number][] {
    return Array.from({ length: N }, (_, i) => i)
        .filter((i) => i !== mal)
        .map((i) => [i, mal]);
}
function fraTilAlle(kilde: number): [number, number][] {
    return alleTil(kilde).map(([a, b]) => [b, a]);
}

function standFor(modus: Modus, beat: number): Stand {
    const alle = () => true;
    const bla = () => BLA;
    const ingen = () => 0.15;
    if (modus === 'vekst') {
        return {
            oppe: (i) => (beat >= 3 ? true : beat >= 1 ? GRUNNLEGGERE.has(i) : false),
            farge: (i) => (beat >= 2 && i === NORGE ? ROD : beat >= 3 && !GRUNNLEGGERE.has(i) ? BLA_LYS : BLA),
            lys: (i) => (beat >= 2 && i === NORGE ? 0.6 : 0.15),
            straaler: [],
            kjegle: null,
            overskrift: [
                'En allianse: en avtale om å hjelpe hverandre',
                '4. april 1949: tolv land skriver under',
                'Norge er ett av de tolv',
                'I dag: 32 land',
                'Hovedkvarteret ligger i Brussel i Belgia',
                'Generalsekretær 2014 til 2024: Jens Stoltenberg',
            ][Math.min(beat, 5)],
            kort: beat === 0 ? 'Én plass per land' : beat >= 3 ? 'Mørkeblå: de tolv fra 1949' : undefined,
            merker: beat >= 2 ? [{ i: NORGE, tekst: 'Norge' }] : [],
        };
    }
    if (modus === 'artikkel5') {
        return {
            oppe: alle,
            farge: (i) => (beat >= 1 && i === ANGREPET ? ROD : beat >= 2 ? BLA : GRA),
            lys: (i) => (beat === 1 && i === ANGREPET ? 0.8 : beat >= 2 ? (beat === 3 ? 0.15 + (i % 4) * 0.15 : 0.5) : 0.1),
            straaler: beat >= 2 ? alleTil(ANGREPET) : [],
            kjegle: beat === 1 ? R + 2.2 : null,
            overskrift: [
                'Artikkel 5',
                'Tenk deg: ett land blir angrepet',
                'Et angrep på ett land = et angrep på alle',
                'Hvert land bestemmer selv hvordan det hjelper',
            ][Math.min(beat, 3)],
            kort: beat === 3 ? 'Det kan også bety å sende soldater' : undefined,
            merker: [],
        };
    }
    if (modus === 'avskrekking') {
        return {
            oppe: alle,
            farge: bla,
            lys: () => (beat >= 1 ? 0.45 : 0.15),
            straaler: beat === 1 || beat === 2 ? alleTil(ANGREPET) : [],
            kjegle: [R + 16, R + 3, R + 9, null][Math.min(beat, 3)],
            overskrift: [
                'En gjeng som har lovet å stå sammen',
                'Tar du én, møter du hele gjengen',
                'Mye mindre fristende å prøve seg',
                'Avskrekking: så risikabelt at ingen tør',
            ][Math.min(beat, 3)],
            merker: [],
        };
    }
    // beggeveier
    const straaler: [number, number][][] = [
        [],
        alleTil(NORGE),
        [
            [USA, NORGE],
            [12, NORGE],
            [20, NORGE],
        ],
        fraTilAlle(NORGE),
        alleTil(USA),
    ];
    return {
        oppe: alle,
        hoyde: (i) => (beat === 2 && i === NORGE ? 0.6 : 1),
        farge: (i) => (i === NORGE ? ROD : beat === 4 && i === USA ? GULL : BLA),
        lys: (i) => (i === NORGE || (beat === 4 && i === USA) ? 0.6 : ingen()),
        straaler: straaler[Math.min(beat, 4)],
        kjegle: null,
        overskrift: [
            'Ulike syn på NATO-medlemskapet',
            'De som støtter det: Norge står ikke alene',
            'De kritiske: mer avhengig, mindre frihet?',
            'Et løfte begge veier: Norge lover også hjelp',
            'Brukt én gang: etter 11. september 2001',
        ][Math.min(beat, 4)],
        kort: beat === 4 ? 'Da var det USA som var angrepet, ikke et land i Europa' : undefined,
        merker: beat === 4 ? [{ i: NORGE, tekst: 'Norge' }, { i: USA, tekst: 'USA' }] : [{ i: NORGE, tekst: 'Norge' }],
    };
}

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    const sakte = Math.min(t, 12) * 0.25;
    if (modus === 'vekst') {
        switch (beat) {
            case 0:
                return { pos: v(0, 20, 20), se: v(0, 0, 0) };
            case 1:
                return { pos: v(-8 + sakte, 11, 22), se: v(0, 1, 0) };
            case 2:
                return { pos: v(3, 6, 20), se: v(0, 1.5, 8) };
            case 3:
                return { pos: v(16 - sakte, 15, 18), se: v(0, 0, 0) };
            default:
                return { pos: v(0, 21, 25), se: v(0, 0, -1.5) };
        }
    }
    if (modus === 'artikkel5') {
        switch (beat) {
            case 0:
                return { pos: v(-6 + sakte, 14, 21), se: v(0, 0, 0) };
            case 1:
                return { pos: v(3, 10, 15), se: v(-9, 1, 0) };
            default:
                return { pos: v(-18, 18, 14), se: v(1, 0, 0) };
        }
    }
    if (modus === 'avskrekking') {
        switch (beat) {
            case 0:
                return { pos: v(-12, 9, 17), se: v(0, 1, 0) };
            default:
                return { pos: v(7, 16, 23), se: v(-6, 0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 9, 22), se: v(0, 1, 4) };
        case 4:
            return { pos: v(0, 16, 24), se: v(0, 0, -3) };
        default:
            return { pos: v(-10 + sakte * 0.5, 18, 18), se: v(0, 0, 0) };
    }
}

function Soyler({ stand }: { stand: Stand }) {
    const grupper = useRef<(THREE.Group | null)[]>([]);
    const mat = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        const hopp = forste.current;
        forste.current = false;
        for (let i = 0; i < N; i++) {
            const g = grupper.current[i];
            const m = mat.current[i];
            if (!g || !m) continue;
            const mal = stand.oppe(i) ? (stand.hoyde?.(i) ?? 1) : 0.02;
            g.scale.y = hopp ? mal : damp(g.scale.y, mal, 4, dt);
            m.color.lerp(stand.farge(i), hopp ? 1 : 1 - Math.exp(-5 * dt));
            m.emissive.copy(m.color);
            m.emissiveIntensity = damp(m.emissiveIntensity, stand.lys(i), 4, dt);
        }
    });
    return (
        <group>
            {Array.from({ length: N }, (_, i) => {
                const p = plass(i);
                return (
                    <group key={i} position={[p.x, 0, p.z]}>
                        <mesh position={[0, 0.06, 0]}>
                            <cylinderGeometry args={[0.85, 0.85, 0.12, 24]} />
                            <meshStandardMaterial color="#cbd5e1" />
                        </mesh>
                        <group ref={(g) => { grupper.current[i] = g; }}>
                            <mesh position={[0, 1.6, 0]}>
                                <cylinderGeometry args={[0.55, 0.65, 3.2, 20]} />
                                <meshStandardMaterial
                                    ref={(m) => { mat.current[i] = m; }}
                                    color="#94a3b8"
                                    roughness={0.5}
                                />
                            </mesh>
                        </group>
                    </group>
                );
            })}
        </group>
    );
}

/** Stråler mellom søylene, med pulser som viser hvilken vei hjelpen går. */
function Straaler({ straaler, playing }: { straaler: [number, number][]; playing: boolean }) {
    const pulser = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const linjer = useMemo(() => {
        const pos: number[] = [];
        for (const [a, b] of straaler) {
            const pa = plass(a);
            const pb = plass(b);
            pos.push(pa.x, 2.6, pa.z, pb.x, 2.6, pb.z);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        return geo;
    }, [straaler]);
    const hjelp = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, delta) => {
        if (playing) tid.current += Math.min(delta, 0.05);
        const m = pulser.current;
        if (!m) return;
        straaler.forEach(([a, b], i) => {
            // På pause står pulsene midt på strålen, så retningen likevel synes som en rekke.
            const f = playing ? (tid.current * 0.45 + (i % 5) * 0.2) % 1 : 0.6;
            const p = plass(a).lerp(plass(b), f);
            hjelp.position.set(p.x, 2.6, p.z);
            hjelp.scale.setScalar(1);
            hjelp.updateMatrix();
            m.setMatrixAt(i, hjelp.matrix);
        });
        m.count = straaler.length;
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <group>
            <lineSegments geometry={linjer}>
                <lineBasicMaterial color="#2563eb" transparent opacity={0.8} />
            </lineSegments>
            <instancedMesh ref={pulser} args={[undefined, undefined, N]} frustumCulled={false}>
                <sphereGeometry args={[0.28, 16, 12]} />
                <meshBasicMaterial color="#fde047" />
            </instancedMesh>
        </group>
    );
}

function Kjegle({ avstand }: { avstand: number | null }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const retning = useMemo(() => plass(ANGREPET, 1).normalize(), []);
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const dt = Math.min(delta, 0.05);
        const mal = avstand ?? R + 22;
        const naa = forste.current ? mal : damp(g.position.length(), mal, 2.2, dt);
        forste.current = false;
        g.position.set(retning.x * naa, 2.2, retning.z * naa);
        const s = damp(g.scale.x, avstand === null ? 0.001 : 1, 3, dt);
        g.scale.setScalar(s);
        g.visible = s > 0.02;
    });
    // Spissen (lokal -z etter dreiingen) peker inn mot ringen.
    const rot = Math.atan2(retning.x, retning.z);
    return (
        <group ref={ref} rotation={[0, rot, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[1.7, 4.4, 24]} />
                <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.5} />
            </mesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const stand = useMemo(() => standFor(modus, beat), [modus, beat]);
    const beatTid = useRef(0);
    const forste = useRef(true);
    useEffect(() => {
        beatTid.current = 0;
    }, [beat]);
    useFrame(({ camera }, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        beatTid.current += dt;
        const k = kameraFor(modus, beat, beatTid.current);
        if (forste.current) {
            camera.position.copy(k.pos);
            forste.current = false;
        } else {
            const a = 1 - Math.exp(-1.3 * Math.max(dt, playing ? 0 : 0.05));
            camera.position.lerp(k.pos, a);
        }
        camera.lookAt(k.se);
    });
    return (
        <>
            <color attach="background" args={['#e0ecfb']} />
            <fog attach="fog" args={['#e0ecfb', 40, 80]} />
            <hemisphereLight args={['#ffffff', '#93a3b8', 1.1]} />
            <directionalLight position={[10, 20, 12]} intensity={1.2} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <circleGeometry args={[R + 3, 64]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[R - 0.15, R + 0.15, 96]} />
                <meshBasicMaterial color="#1e3a8a" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
                <circleGeometry args={[60, 32]} />
                <meshStandardMaterial color="#cfe0f5" />
            </mesh>
            <Soyler stand={stand} />
            <Straaler straaler={stand.straaler} playing={playing} />
            <Kjegle avstand={stand.kjegle} />
            {stand.merker.map((m) => {
                const p = plass(m.i);
                return (
                    <Html key={`${m.i}-${m.tekst}`} position={[p.x, 4.6, p.z]} center zIndexRange={[10, 0]}>
                        <div className="px-3 py-1 rounded-lg bg-white/95 text-2xl font-black text-slate-900 shadow whitespace-nowrap">
                            {m.tekst}
                        </div>
                    </Html>
                );
            })}
        </>
    );
}

export function NatoRing({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'vekst';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const stand = standFor(modus, beat);
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [0, 20, 20] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 top-5 flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={stand.overskrift}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="px-6 py-2 rounded-2xl bg-slate-900/85 text-white text-3xl font-black shadow-xl"
                    >
                        {stand.overskrift}
                    </motion.div>
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {stand.kort && (
                    <motion.div
                        key={stand.kort}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-6 bottom-6 max-w-[26rem] px-5 py-3 rounded-2xl bg-white/95 text-2xl font-bold text-slate-800 shadow-xl pointer-events-none"
                    >
                        {stand.kort}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
