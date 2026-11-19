import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Stortingssalen i 3D, bygd av enkle klosser. Fire moduser:
 * - talen: finansministeren på talerstolen med gul bok, og sitatet fra finanstalen.
 * - makt: regjeringen skriver forslaget, Stortinget bestemmer. Gul bok blir blå bok.
 * - komiteer: boka deles i 12 bunker, én per fagkomité. Partiene lager egne budsjetter.
 * - flertall: en mindretallsregjering trenger budsjettpartnere for å komme over halvparten.
 */

type Modus = 'talen' | 'makt' | 'komiteer' | 'flertall';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------- salen ----------

/** Midtpunktet i halvsirkelen. Talerstolen står her. */
const SENTER = v(0, 0, -3);
const RADER = [5.6, 6.8, 8.0, 9.2, 10.4];
const VINKEL = (80 * Math.PI) / 180;

interface Plass {
    pos: THREE.Vector3;
    vinkel: number;
    /** 0-1 sortert etter vinkel, brukt til setefordelingen i flertall. */
    rang: number;
    sektor: number;
    rad: number;
}

function lagPlasser(): Plass[] {
    const ut: Omit<Plass, 'rang'>[] = [];
    RADER.forEach((r, rad) => {
        const n = Math.round(r * 2.6);
        for (let i = 0; i < n; i++) {
            const a = -VINKEL + (2 * VINKEL * (i + 0.5)) / n;
            ut.push({
                pos: v(SENTER.x + r * Math.sin(a), 0.35 + rad * 0.32, SENTER.z + r * Math.cos(a)),
                vinkel: a,
                rad,
                sektor: Math.min(11, Math.floor(((a + VINKEL) / (2 * VINKEL)) * 12)),
            });
        }
    });
    const sortert = ut.map((p, i) => ({ i, a: p.vinkel })).sort((x, y) => x.a - y.a);
    const rang = new Array<number>(ut.length);
    sortert.forEach((s, k) => (rang[s.i] = k / ut.length));
    return ut.map((p, i) => ({ ...p, rang: rang[i] }));
}

const NOYTRAL = new THREE.Color('#c8b591');
const DEMPET = new THREE.Color('#8f8169');
const STORTING = new THREE.Color('#3b82f6');
const VEDTATT = new THREE.Color('#16a34a');
const REGJERING = new THREE.Color('#dc2626');
const PARTNER = new THREE.Color('#f59e0b');
const ANDRE = new THREE.Color('#94a3b8');
const KOMITE = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#14b8a6',
    '#06b6d4',
    '#3b82f6',
    '#6366f1',
    '#a855f7',
    '#ec4899',
    '#78716c',
].map((c) => new THREE.Color(c));

function seteFarge(modus: Modus, beat: number, p: Plass): THREE.Color {
    if (modus === 'makt') {
        if (beat === 1) return DEMPET;
        if (beat === 2) return STORTING;
        if (beat >= 4) return VEDTATT;
        return NOYTRAL;
    }
    if (modus === 'komiteer') return beat >= 1 ? KOMITE[p.sektor] : NOYTRAL;
    if (modus === 'flertall') {
        if (p.rang < 0.32) return REGJERING;
        if (beat >= 2 && p.rang < 0.54) return PARTNER;
        return ANDRE;
    }
    return NOYTRAL;
}

function Seter({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const plasser = useMemo(() => lagPlasser(), []);
    const ref = useRef<THREE.InstancedMesh>(null);
    const sokler = useRef<THREE.InstancedMesh>(null);
    const farger = useRef(plasser.map(() => NOYTRAL.clone()));
    const forste = useRef(true);
    const forrige = useRef(-1);
    const tid = useRef(0);

    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const d = new THREE.Object3D();
        plasser.forEach((p, i) => {
            d.position.copy(p.pos);
            d.rotation.set(0, p.vinkel, 0);
            d.updateMatrix();
            m.setMatrixAt(i, d.matrix);
            m.setColorAt(i, NOYTRAL);
        });
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
        const so = sokler.current;
        if (!so) return;
        plasser.forEach((p, i) => {
            const h = p.pos.y - 0.25;
            d.position.set(p.pos.x, h / 2 - 0.1, p.pos.z);
            d.scale.set(1, h + 0.2, 1);
            d.rotation.set(0, p.vinkel, 0);
            d.updateMatrix();
            so.setMatrixAt(i, d.matrix);
        });
        so.instanceMatrix.needsUpdate = true;
    }, [plasser]);

    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const snapp = forste.current;
        forste.current = false;
        plasser.forEach((p, i) => {
            const mal = seteFarge(modus, beat, p);
            // Vedtaket og komiteene sprer seg som en bølge fra midten.
            const forsinkelse =
                (modus === 'makt' && beat >= 4) || modus === 'komiteer'
                    ? Math.abs(p.vinkel) * 0.9
                    : 0;
            const k = snapp ? 1 : tid.current < forsinkelse ? 0 : 1 - Math.exp(-5 * dt);
            farger.current[i].lerp(mal, k);
            m.setColorAt(i, farger.current[i]);
        });
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });

    return (
        <group>
            <instancedMesh
                ref={ref}
                args={[undefined, undefined, plasser.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[0.62, 0.5, 0.5]} />
                <meshLambertMaterial />
            </instancedMesh>
            <instancedMesh
                ref={sokler}
                args={[undefined, undefined, plasser.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[1.0, 1, 1.2]} />
                <meshLambertMaterial color="#5c1717" />
            </instancedMesh>
        </group>
    );
}

function Rommet() {
    return (
        <group>
            {/* Gulvet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 1]}>
                <circleGeometry args={[18, 48]} />
                <meshLambertMaterial color="#6b1d1d" />
            </mesh>
            {/* Bakveggen med et stort maleri */}
            <mesh position={[0, 4, -9]}>
                <boxGeometry args={[26, 9, 0.4]} />
                <meshLambertMaterial color="#e8dcc0" />
            </mesh>
            <mesh position={[0, 5, -8.75]}>
                <boxGeometry args={[9, 3.6, 0.12]} />
                <meshLambertMaterial color="#b08d3c" />
            </mesh>
            <mesh position={[0, 5, -8.66]}>
                <boxGeometry args={[8.4, 3.0, 0.08]} />
                <meshLambertMaterial color="#5b6b4a" />
            </mesh>
            {[-11, -7, 7, 11].map((x) => (
                <mesh key={x} position={[x, 4, -8.6]}>
                    <boxGeometry args={[0.7, 9, 0.5]} />
                    <meshLambertMaterial color="#d6c6a0" />
                </mesh>
            ))}
            {/* Presidentskapets bord */}
            <mesh position={[0, 1.0, -6.2]}>
                <boxGeometry args={[5, 1.2, 1.2]} />
                <meshLambertMaterial color="#5a3a22" />
            </mesh>
            {/* Talerstolen */}
            <mesh position={[SENTER.x, 0.6, SENTER.z - 0.4]}>
                <boxGeometry args={[1.3, 1.3, 0.9]} />
                <meshLambertMaterial color="#6b4423" />
            </mesh>
            <mesh position={[SENTER.x, 1.3, SENTER.z - 0.2]} rotation={[-0.35, 0, 0]}>
                <boxGeometry args={[1.4, 0.08, 0.8]} />
                <meshLambertMaterial color="#7c5230" />
            </mesh>
        </group>
    );
}

/** Regjeringsbenken foran til venstre. */
function Regjeringsbenk({ lyser }: { lyser: boolean }) {
    const mats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
    useFrame(() => {
        mats.current.forEach((m) => {
            if (!m) return;
            m.color.set(lyser ? '#f59e0b' : '#a1906f');
            m.emissive.set(lyser ? '#7c2d12' : '#000000');
        });
    });
    return (
        <group position={[-3.6, 0.35, -1.6]} rotation={[0, 0.9, 0]}>
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} position={[(i - 2) * 0.72, 0, 0]}>
                    <boxGeometry args={[0.62, 0.5, 0.5]} />
                    <meshLambertMaterial
                        ref={(m) => {
                            mats.current[i] = m;
                        }}
                        color="#a1906f"
                    />
                </mesh>
            ))}
        </group>
    );
}

/** En enkel figur på talerstolen. */
function Taler({ synlig }: { synlig: boolean }) {
    if (!synlig) return null;
    return (
        <group position={[SENTER.x, 0, SENTER.z - 1.2]}>
            <mesh position={[0, 1.55, 0]}>
                <capsuleGeometry args={[0.32, 0.9, 4, 12]} />
                <meshLambertMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 2.45, 0]}>
                <sphereGeometry args={[0.26, 16, 12]} />
                <meshLambertMaterial color="#e0b394" />
            </mesh>
        </group>
    );
}

const GUL = new THREE.Color('#facc15');
const BLA = new THREE.Color('#2563eb');

interface BokMal {
    pos: THREE.Vector3;
    skala: number;
    bla: boolean;
}

function bokFor(modus: Modus, beat: number): BokMal | null {
    const paStol = { pos: v(SENTER.x, 1.42, SENTER.z - 0.15), skala: 1, bla: false };
    if (modus === 'talen') return beat >= 1 ? paStol : null;
    if (modus === 'makt') {
        if (beat === 1) return { pos: v(-3.6, 1.6, -1.6), skala: 1.6, bla: false };
        if (beat >= 3) return { pos: v(0, 3.4, -2.6), skala: 3.2, bla: beat >= 4 };
        return paStol;
    }
    if (modus === 'komiteer')
        return beat === 0 ? { pos: v(0, 2.4, -2.6), skala: 2.4, bla: false } : null;
    return null;
}

/** Budsjettboka. Gul forside til den er vedtatt, så blå. */
function Bok({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const g = useRef<THREE.Group>(null);
    const forside = useRef<THREE.MeshLambertMaterial>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const gr = g.current;
        if (!gr || !forside.current) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mal = bokFor(modus, beat);
        const k = forste.current ? 1 : 1 - Math.exp(-3 * dt);
        forste.current = false;
        const skala = mal ? mal.skala : 0.001;
        if (mal) gr.position.lerp(mal.pos, k);
        gr.scale.setScalar(THREE.MathUtils.lerp(gr.scale.x, skala, k));
        const stor = (modus === 'makt' && beat >= 3) || (modus === 'komiteer' && beat === 0);
        gr.rotation.x = stor ? 1.0 : 0;
        gr.rotation.y =
            modus === 'makt' && beat >= 3 && playing ? Math.sin(performance.now() / 1600) * 0.2 : 0;
        forside.current.color.lerp(mal?.bla ? BLA : GUL, mal?.bla ? 1 - Math.exp(-2 * dt) : 1);
    });
    return (
        <group ref={g} scale={0.001}>
            <group rotation={[-0.35, 0, 0]}>
                <mesh>
                    <boxGeometry args={[0.6, 0.1, 0.8]} />
                    <meshLambertMaterial color="#f8fafc" />
                </mesh>
                <mesh position={[0, 0.055, 0]}>
                    <boxGeometry args={[0.62, 0.02, 0.82]} />
                    <meshLambertMaterial ref={forside} color="#facc15" emissive="#3a2a00" />
                </mesh>
            </group>
        </group>
    );
}

/** De 12 bunkene, én per fagkomité. Står samlet til boka deles. */
function Bunker({ beat, playing }: { beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const forste = useRef(true);
    const mal = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => {
                const a = -VINKEL + (2 * VINKEL * (i + 0.5)) / 12;
                return v(SENTER.x + 4.2 * Math.sin(a), 0.5, SENTER.z + 4.2 * Math.cos(a));
            }),
        []
    );
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const k = forste.current ? 1 : 1 - Math.exp(-4 * dt);
        forste.current = false;
        refs.current.forEach((g, i) => {
            if (!g) return;
            const delt = beat >= 1;
            g.position.lerp(delt ? mal[i] : v(0, 2.4, -2.6), k);
            const s = delt ? 1 : 0.001;
            g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, s, k));
        });
    });
    return (
        <group>
            {mal.map((_, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        refs.current[i] = g;
                    }}
                    scale={0.001}
                >
                    {[0, 1, 2].map((h) => (
                        <mesh key={h} position={[0, h * 0.12, 0]} rotation={[0, h * 0.3, 0]}>
                            <boxGeometry args={[0.55, 0.1, 0.7]} />
                            <meshLambertMaterial color={h === 2 ? KOMITE[i] : '#facc15'} />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

/** Alternative budsjetter: bøker i andre farger over partienes seter. */
const ALTERNATIVE = [
    { a: 0.95, r: 9.6, farge: '#16a34a' },
    { a: 0.55, r: 11.2, farge: '#9333ea' },
    { a: -0.7, r: 10.4, farge: '#0891b2' },
];

function Alternative({ beat, playing }: { beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const k = forste.current ? 1 : 1 - Math.exp(-3 * dt);
        forste.current = false;
        refs.current.forEach((g, i) => {
            if (!g) return;
            const s = beat >= 2 ? (beat >= 3 && i === 0 ? 2.6 : 1.7) : 0.001;
            g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, s, k));
            g.rotation.y += dt * 0.6;
        });
    });
    return (
        <group>
            {ALTERNATIVE.map((b, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        refs.current[i] = g;
                    }}
                    position={[SENTER.x + b.r * Math.sin(b.a), 2.9, SENTER.z + b.r * Math.cos(b.a)]}
                    scale={0.001}
                >
                    <mesh>
                        <boxGeometry args={[0.6, 0.12, 0.8]} />
                        <meshLambertMaterial
                            color={b.farge}
                            emissive={b.farge}
                            emissiveIntensity={0.25}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Lysende strek midt i salen: halvparten av setene. */
function Halvlinje({ synlig }: { synlig: boolean }) {
    if (!synlig) return null;
    return (
        <mesh position={[SENTER.x, 2.1, SENTER.z + 8]}>
            <boxGeometry args={[0.12, 0.08, 6.4]} />
            <meshBasicMaterial color="#ffffff" />
        </mesh>
    );
}

// ---------- kamera ----------

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'talen') {
        switch (beat) {
            case 0:
                return { pos: v(-2 + t * 0.25, 7.5, 15 - t * 0.3), se: v(0, 1.5, -3) };
            case 1:
                return { pos: v(3.2, 3.2, 3.4), se: v(0, 1.8, -3.8) };
            case 2:
                return { pos: v(1.1, 2.9, -0.6), se: v(0, 1.4, -3.2) };
            default:
                return { pos: v(-4 + t * 0.2, 4.2, 7.5), se: v(0, 1.8, -4) };
        }
    }
    if (modus === 'makt') {
        switch (beat) {
            case 0:
                return { pos: v(0, 13, 13), se: v(0, 0, 1) };
            case 1:
                return { pos: v(2.2, 5.2, 4.6), se: v(-3.2, 0.6, -1.8) };
            case 2:
                return { pos: v(0, 6.5, -7.6), se: v(0, 1, 5) };
            case 3:
                return { pos: v(0, 5.2, 6.5), se: v(0, 3.0, -2.6) };
            default:
                return { pos: v(0, 11, 12), se: v(0, 1.2, 0) };
        }
    }
    if (modus === 'komiteer') {
        if (beat === 0) return { pos: v(0, 9, 12), se: v(0, 1, -1) };
        return { pos: v(0, 17, -8.5), se: v(0, 0, 3.2) };
    }
    return { pos: v(0, 19, -7.5), se: v(0, 0, 3.6) };
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mal = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.6 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
    });
    return (
        <>
            <color attach="background" args={['#2a1a14']} />
            <fog attach="fog" args={['#2a1a14', 22, 48]} />
            <ambientLight intensity={0.9} />
            <directionalLight position={[6, 14, 10]} intensity={1.4} />
            <hemisphereLight args={['#fff7e6', '#5a2a1a', 0.6]} />
            <Rommet />
            <Seter modus={modus} beat={beat} playing={playing} />
            {modus === 'makt' && <Regjeringsbenk lyser={beat === 1} />}
            <Taler synlig={modus === 'talen' && beat >= 1} />
            <Bok modus={modus} beat={beat} playing={playing} />
            {modus === 'komiteer' && <Bunker beat={beat} playing={playing} />}
            {modus === 'komiteer' && <Alternative beat={beat} playing={playing} />}
            <Halvlinje synlig={modus === 'flertall' && beat >= 1} />
        </>
    );
}

// ---------- tekst over bildet ----------

const OVERSKRIFT: Record<Modus, string[]> = {
    talen: [
        'Stortinget, 7. oktober 2026',
        'Finanstalen',
        'Forslaget til statsbudsjett for 2027',
        'Finanstalen',
        'Finanstalen',
    ],
    makt: [
        'Statsbudsjettet: planen for neste år',
        'Regjeringen skriver forslaget',
        'Stortinget bestemmer',
        'Gul bok: regjeringens forslag',
        'Blå bok: vedtatt av Stortinget',
    ],
    komiteer: [
        'Oktober til desember: 2,5 måneder',
        '12 fagkomiteer',
        'Alternative budsjetter',
        'Alternative budsjetter',
    ],
    flertall: [
        'Mindretallsregjering',
        'Mindretallsregjering',
        'Støttepartienes budsjetter',
        'Budsjettpartnere i finanstalen 2026',
        'Budsjettpartnere i finanstalen 2026',
    ],
};

const inn = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 22 }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold shadow-xl"
                    style={{ fontSize: 30 }}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Kort({
    children,
    farge,
    style,
}: {
    children: ReactNode;
    farge: string;
    style: CSSProperties;
}) {
    return (
        <motion.div
            {...inn}
            transition={{ delay: 0.4 }}
            className="absolute rounded-2xl bg-white/95 shadow-xl text-slate-900"
            style={{ padding: '14px 20px', borderLeft: `10px solid ${farge}`, ...style }}
        >
            {children}
        </motion.div>
    );
}

function Tekster({ modus, beat }: { modus: Modus; beat: number }) {
    const liste = OVERSKRIFT[modus];
    const tittel = liste[Math.min(beat, liste.length - 1)];
    return (
        <Flate>
            <Overskrift tekst={tittel} />
            <AnimatePresence>
                {modus === 'talen' && beat >= 3 && (
                    <Kort key="sitat" farge="#facc15" style={{ left: 120, right: 120, bottom: 34 }}>
                        <div className="font-bold text-slate-500" style={{ fontSize: 18 }}>
                            Jens Stoltenberg, finansminister:
                        </div>
                        <div
                            className="font-display font-bold leading-snug"
                            style={{ fontSize: 28 }}
                        >
                            «Selv om vi har oljepenger i Norge, har vi ikke ubegrenset med penger.
                            {beat >= 4 && (
                                <span className="text-amber-700">
                                    {' '}
                                    Når noen formål skal få mer, må noe annet få mindre …»
                                </span>
                            )}
                        </div>
                    </Kort>
                )}
                {modus === 'makt' && beat === 2 && (
                    <Kort key="gl" farge="#3b82f6" style={{ left: 40, bottom: 34, width: 430 }}>
                        <div className="font-black" style={{ fontSize: 26 }}>
                            Grunnloven § 75
                        </div>
                        <div
                            className="font-bold text-slate-600 leading-snug"
                            style={{ fontSize: 20 }}
                        >
                            Stortinget krever inn skatt og bevilger pengene. Bevilge = gi lov til å
                            bruke en sum til et bestemt formål.
                        </div>
                    </Kort>
                )}
                {modus === 'komiteer' && beat === 1 && (
                    <Kort key="komite" farge="#6366f1" style={{ left: 40, bottom: 30, width: 380 }}>
                        <div className="font-bold leading-snug" style={{ fontSize: 21 }}>
                            Komité: stortingsrepresentanter som jobber med ett område, som helse
                            eller utdanning
                        </div>
                    </Kort>
                )}
                {modus === 'komiteer' && beat >= 2 && (
                    <Kort key="alt" farge="#16a34a" style={{ left: 40, bottom: 30, width: 420 }}>
                        <div className="font-bold leading-snug" style={{ fontSize: 21 }}>
                            Fargede hefter: partiene utenfor regjeringen viser hva de mener er
                            viktigst
                        </div>
                        {beat >= 3 && (
                            <div className="font-black mt-2" style={{ fontSize: 22 }}>
                                <span className="text-green-700">+ skolen</span>
                                <span className="text-slate-400">
                                    {'  '}·{'  '}
                                </span>
                                <span className="text-red-600">− veier</span>
                                <span className="text-slate-500 font-bold" style={{ fontSize: 17 }}>
                                    {' '}
                                    (for eksempel)
                                </span>
                            </div>
                        )}
                    </Kort>
                )}
                {modus === 'flertall' && (
                    <motion.div
                        key="forkl"
                        {...inn}
                        className="absolute flex flex-col gap-2"
                        style={{ left: 30, bottom: 26 }}
                    >
                        <Merke farge="#dc2626" tekst="Regjeringen: under halvparten" />
                        {beat >= 2 && <Merke farge="#f59e0b" tekst="Støttepartiene" />}
                        <Merke farge="#94a3b8" tekst="Andre partier" />
                    </motion.div>
                )}
                {modus === 'flertall' && beat >= 1 && (
                    <motion.div
                        key="halv"
                        {...inn}
                        className="absolute rounded-xl bg-white text-slate-900 font-black shadow-lg"
                        style={{ right: 30, top: 96, padding: '6px 14px', fontSize: 22 }}
                    >
                        Hvit strek = halvparten av setene
                    </motion.div>
                )}
                {modus === 'flertall' && beat >= 3 && (
                    <Kort
                        key="partnere"
                        farge="#f59e0b"
                        style={{ right: 30, bottom: 26, width: 360 }}
                    >
                        <div className="font-bold text-slate-500" style={{ fontSize: 17 }}>
                            Stoltenberg nevnte:
                        </div>
                        <div className="font-black leading-tight" style={{ fontSize: 23 }}>
                            SV, Senterpartiet, Rødt og Miljøpartiet De Grønne
                        </div>
                        {beat >= 4 && (
                            <div className="font-bold text-amber-700 mt-1" style={{ fontSize: 19 }}>
                                Han var trygg på at de igjen ville bli enige.
                            </div>
                        )}
                    </Kort>
                )}
            </AnimatePresence>
            {modus === 'flertall' && (
                <div
                    className="absolute font-bold rounded-lg bg-slate-900/80 text-white"
                    style={{ right: 30, top: 142, fontSize: 20, padding: '3px 10px' }}
                >
                    Skisse, ikke ekte setefordeling
                </div>
            )}
        </Flate>
    );
}

function Merke({ farge, tekst }: { farge: string; tekst: string }) {
    return (
        <div
            className="flex items-center gap-2 rounded-xl bg-white/95 shadow-lg"
            style={{ padding: '5px 12px' }}
        >
            <div style={{ width: 20, height: 20, borderRadius: 5, background: farge }} />
            <span className="font-black text-slate-900" style={{ fontSize: 20 }}>
                {tekst}
            </span>
        </div>
    );
}

export function StatsbudsjettSalen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'talen';
    const [dpr] = useState<[number, number]>(() =>
        guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 9, 14] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Tekster modus={modus} beat={beat} />
        </div>
    );
}
