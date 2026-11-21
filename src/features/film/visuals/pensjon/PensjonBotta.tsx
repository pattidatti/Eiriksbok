import { useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';
import { damp, useKamera, v } from './felles3d';

/**
 * Pensjonsbøtta i 3D. Tre kraner renner inn i én bøtte, og en tapp nederst drypper ut.
 * Fire moduser:
 * - avis: avisbunken, sykkelen, en mynt på 1 810 kroner som faller i bøtta, og et lokk med lås.
 * - kraner: kranene skrus på én etter én, og til slutt drypper bøtta ut i et glass.
 * - arbeidsgiver: kran to og tre, med kort om 2006, minst 2 prosent og skattefordel.
 * - tom: en nesten tom bøtte, streken for garantipensjon, og bøtta som fylles over streken.
 * Alt er et mål per beat som det glir mot, så eleven kan hoppe rett inn.
 */

type Modus = 'avis' | 'kraner' | 'arbeidsgiver' | 'tom';

const BUNN = 1.2; // bøttas bunn står på en krakk
const HOYDE = 4.4;
const R_BUNN = 2.1;
const R_TOPP = 2.6;

const KRANER = [
    { navn: 'Folketrygden', farge: '#3b82f6', tykk: 0.5, x: -1.5, z: 0.3, inn: [-1, 0] as const },
    { navn: 'Tjenestepensjon', farge: '#10b981', tykk: 0.14, x: 0, z: -1.2, inn: [0, -1] as const },
    { navn: 'Egen sparing', farge: '#f59e0b', tykk: 0.14, x: 1.5, z: 0.3, inn: [1, 0] as const },
];
const KRAN_Y = 7.4;

interface Tilstand {
    /** Om røret til kranen vises. */
    vis: [boolean, boolean, boolean];
    /** Om kranen renner. */
    på: [boolean, boolean, boolean];
    /** Merkelapp på kranen. */
    merke: [boolean, boolean, boolean];
    nivå: number;
    tapp: boolean;
    mynt: boolean;
    lokk: boolean;
    garanti: boolean;
    /** Bøtta vises (i avisscenen kommer den først når Nav nevnes). */
    botte: boolean;
    aviser: boolean;
    sykkel: boolean;
    bøtteMerke: string | null;
    kort: { tekst: ReactNode; tone?: 'rod' | 'gronn' | 'bla' } | null;
}

const AV: [boolean, boolean, boolean] = [false, false, false];
const ALLE: [boolean, boolean, boolean] = [true, true, true];

function tilstand(modus: Modus, beat: number): Tilstand {
    const grunn: Tilstand = {
        vis: ALLE,
        på: AV,
        merke: AV,
        nivå: 0.3,
        tapp: false,
        mynt: false,
        lokk: false,
        garanti: false,
        botte: true,
        aviser: false,
        sykkel: false,
        bøtteMerke: null,
        kort: null,
    };
    if (modus === 'avis') {
        const b = Math.min(beat, 3);
        return {
            ...grunn,
            vis: AV,
            botte: b >= 2,
            aviser: true,
            sykkel: b >= 1,
            nivå: b >= 2 ? 0.45 : 0,
            mynt: b >= 2,
            lokk: b >= 3,
            bøtteMerke: b >= 2 ? 'Kontoen din hos Nav' : null,
            kort: [
                { tekst: 'Sommerjobb: avisrute' },
                { tekst: 'Lønn etter fire uker: 10\u00a0000\u00a0kr', tone: 'gronn' as const },
                { tekst: 'Til pensjonen: 1\u00a0810 kr', tone: 'bla' as const },
                { tekst: 'Låst til du er over 60 år', tone: 'rod' as const },
            ][b],
        };
    }
    if (modus === 'kraner') {
        const b = Math.min(beat, 4);
        const på: [boolean, boolean, boolean] = [b >= 1, b >= 2, b >= 3];
        return {
            ...grunn,
            på,
            merke: [b >= 1, b >= 2, b >= 3],
            nivå: [0.3, 1.4, 2.0, 2.5, 2.5][b],
            tapp: b >= 4,
            bøtteMerke: b === 0 ? 'Pensjonen din' : null,
            kort:
                b === 4
                    ? { tekst: 'Som pensjonist: litt ut hver måned', tone: 'bla' }
                    : b === 0
                      ? { tekst: 'Tre kraner, én bøtte' }
                      : null,
        };
    }
    if (modus === 'arbeidsgiver') {
        const b = Math.min(beat, 4);
        return {
            ...grunn,
            på: [false, true, b >= 3],
            merke: [false, true, b >= 3],
            nivå: [1.4, 1.6, 1.9, 2.3, 3.0][b],
            kort: [
                { tekst: 'Staten og kommunene: egne ordninger' },
                {
                    tekst: (
                        <>
                            Private bedrifter
                            <div className="mt-2 flex items-center gap-2 text-xl">
                                <span className="px-2 py-1 rounded-lg bg-slate-200 text-slate-600">Før: frivillig</span>
                                <span>→</span>
                                <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white">1.1.2006: påbudt</span>
                            </div>
                        </>
                    ),
                    tone: 'gronn' as const,
                },
                {
                    tekst: (
                        <>
                            Arbeidsgiveren: minst 2 % av årslønna
                            <div className="mt-2 flex h-7 rounded-md overflow-hidden border-2 border-slate-400" style={{ width: 300 }}>
                                <div className="bg-slate-200 text-slate-600 text-lg px-2 flex items-center" style={{ width: 290 }}>
                                    Årslønna
                                </div>
                                <div className="bg-emerald-600" style={{ width: 10 }} />
                            </div>
                        </>
                    ),
                    tone: 'gronn' as const,
                },
                { tekst: 'Egen sparing: skattefordel for noe av den' },
                { tekst: 'Tidlig start: mer tid til å vokse', tone: 'bla' as const },
            ][b],
        };
    }
    // tom
    const b = Math.min(beat, 4);
    return {
        ...grunn,
        på: [false, b >= 4, b >= 4],
        merke: [false, b >= 4, b >= 4],
        nivå: [0.25, 1.3, 1.3, 2.7, 3.4][b],
        garanti: b >= 1,
        kort: [
            { tekst: 'Jobbet lite: lite i bøtta' },
            { tekst: 'Garantipensjon: en minstepensjon', tone: 'rod' as const },
            { tekst: 'Desember 2025: 11 prosent av alderspensjonistene var minstepensjonister', tone: 'rod' as const },
            {
                tekst: 'Snitt i 2025: 310\u00a0700 kr i året fra folketrygden, før skatt',
                tone: 'bla' as const,
            },
            { tekst: 'I tillegg: arbeidsgiveren og egen sparing', tone: 'gronn' as const },
        ][b],
    };
}

function kamera(modus: Modus) {
    return (beat: number, t: number) => {
        const sakte = Math.sin(t * 0.15) * 0.6;
        if (modus === 'avis') {
            if (beat === 0) return { pos: v(-3 + sakte * 0.3, 4.5, 9), se: v(-4, 1.2, 0) };
            if (beat === 1) return { pos: v(1.5 + sakte, 6.5, 15), se: v(1.6, 2.6, 0) };
            return { pos: v(sakte, 9.5, 11.5), se: v(0, 3.2, 0) };
        }
        if (modus === 'arbeidsgiver') {
            if (beat === 0) return { pos: v(1.2 + sakte * 0.3, 8.6, 9.5), se: v(0, 6.2, -0.5) };
            if (beat === 3) return { pos: v(3.6 + sakte * 0.3, 8.6, 9.5), se: v(1.4, 6, 0) };
            if (beat === 4) return { pos: v(sakte, 9.2, 14.5), se: v(0, 4.4, 0) };
        }
        if (modus === 'tom') return { pos: v(sakte, 9, 14.5), se: v(0, 4, 0) };
        return { pos: v(sakte, 8, 15.5), se: v(0, 4.4, 0) };
    };
}

/** Radius inni bøtta i høyden h over bunnen. */
const radius = (h: number) => R_BUNN + ((R_TOPP - R_BUNN) * h) / HOYDE;

function Botte() {
    return (
        <group>
            {/* Krakken */}
            <mesh position={[0, BUNN / 2, 0]}>
                <boxGeometry args={[3.6, BUNN, 3.6]} />
                <meshStandardMaterial color="#78350f" flatShading />
            </mesh>
            <mesh position={[0, BUNN + HOYDE / 2, 0]}>
                <cylinderGeometry args={[R_TOPP, R_BUNN, HOYDE, 48, 1, true]} />
                <meshStandardMaterial
                    color="#cbd5e1"
                    metalness={0.35}
                    roughness={0.45}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.55}
                />
            </mesh>
            <mesh position={[0, BUNN + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[R_BUNN, 48]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[0, BUNN + HOYDE, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[R_TOPP, 0.09, 8, 64]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.3} />
            </mesh>
            {/* Tappen foran nederst */}
            <mesh position={[0, BUNN + 0.45, R_BUNN + 0.45]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.16, 0.16, 0.9, 12]} />
                <meshStandardMaterial color="#64748b" metalness={0.5} />
            </mesh>
            <mesh position={[0, BUNN + 0.3, R_BUNN + 0.85]}>
                <cylinderGeometry args={[0.16, 0.16, 0.35, 12]} />
                <meshStandardMaterial color="#64748b" metalness={0.5} />
            </mesh>
        </group>
    );
}

/** Vannet i bøtta. Høyden glir mot nivået for beaten. */
function Vann({ nivå, playing }: { nivå: number; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const h = useRef(nivå);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        h.current = playing ? damp(h.current, nivå, 1.6, dt) : nivå;
        const m = ref.current;
        if (!m) return;
        const hh = Math.max(h.current, 0.001);
        m.visible = h.current > 0.02;
        m.scale.set(radius(hh / 2) - 0.03, hh, radius(hh / 2) - 0.03);
        m.position.y = BUNN + hh / 2 + 0.03;
    });
    return (
        <mesh ref={ref}>
            <cylinderGeometry args={[1, 1, 1, 48]} />
            <meshStandardMaterial
                color="#38bdf8"
                emissive="#0ea5e9"
                emissiveIntensity={0.45}
                transparent
                opacity={0.9}
            />
        </mesh>
    );
}

/** Ett rør med kran og en stråle ned i bøtta. */
function Kran({
    i,
    vis,
    på,
    merke,
    nivå,
    playing,
}: {
    i: number;
    vis: boolean;
    på: boolean;
    merke: boolean;
    nivå: number;
    playing: boolean;
}) {
    const k = KRANER[i];
    const stråle = useRef<THREE.Mesh>(null);
    const s = useRef(på ? 1 : 0);
    const topp = KRAN_Y - 0.5;
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        s.current = playing ? damp(s.current, på ? 1 : 0, 4, dt) : på ? 1 : 0;
        const m = stråle.current;
        if (!m) return;
        const bunn = BUNN + nivå;
        const lengde = (topp - bunn) * s.current;
        m.visible = s.current > 0.02;
        m.scale.set(1, Math.max(lengde, 0.001), 1);
        m.position.y = topp - lengde / 2;
    });
    if (!vis) return null;
    // Røret kommer inn fra siden (eller bakfra) og ender over bøtta.
    const lengde = 6;
    const [dx, dz] = k.inn;
    const midt: [number, number, number] = [
        k.x + (dx * lengde) / 2,
        KRAN_Y + 0.25,
        k.z + (dz * lengde) / 2,
    ];
    const rot: [number, number, number] = dx !== 0 ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0];
    const merkePos: [number, number, number] =
        i === 1 ? [0, KRAN_Y + 1.45, k.z - 0.6] : [k.x + dx * 4.2, KRAN_Y + 1.25, k.z];
    return (
        <group>
            <mesh position={midt} rotation={rot}>
                <cylinderGeometry args={[0.32, 0.32, lengde, 16]} />
                <meshStandardMaterial color={k.farge} flatShading />
            </mesh>
            {/* Albuen og tuten */}
            <mesh position={[k.x, KRAN_Y, k.z]}>
                <cylinderGeometry args={[0.3, 0.22, 0.8, 16]} />
                <meshStandardMaterial color={k.farge} flatShading />
            </mesh>
            {/* Rattet på kranen */}
            <group position={[k.x + dx * 1.4, KRAN_Y + 0.85, k.z + dz * 1.4]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.45, 0.08, 8, 24]} />
                    <meshStandardMaterial color={på ? '#f8fafc' : '#475569'} />
                </mesh>
                <mesh position={[0, -0.3, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, 0.6, 8]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
            </group>
            <mesh ref={stråle} position={[k.x, topp, k.z]}>
                <cylinderGeometry args={[k.tykk, k.tykk * 0.8, 1, 12]} />
                <meshStandardMaterial
                    color={k.farge}
                    emissive={k.farge}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.85}
                />
            </mesh>
            {merke && (
                <Html position={merkePos} center zIndexRange={[10, 0]}>
                    <div
                        className="px-3 py-1 rounded-xl text-white font-display font-black text-2xl whitespace-nowrap shadow-xl"
                        style={{ background: k.farge }}
                    >
                        {k.navn}
                    </div>
                </Html>
            )}
        </group>
    );
}

/** Dråper fra tappen ned i et glass. Står i fast stilling på pause. */
function Drypp({ på, playing }: { på: boolean; playing: boolean }) {
    const dråper = useRef<(THREE.Mesh | null)[]>([]);
    const t = useRef(0);
    const x0 = R_BUNN + 0.85;
    const topp = BUNN + 0.1;
    const bunn = 0.5;
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        t.current += dt;
        dråper.current.forEach((d, i) => {
            if (!d) return;
            d.visible = på;
            const fase = ((playing ? t.current * 0.9 : 0) + i / 3) % 1;
            d.position.set(0, topp - (topp - bunn) * fase, x0);
        });
    });
    if (!på) return null;
    return (
        <group>
            {[0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        dråper.current[i] = m;
                    }}
                >
                    <sphereGeometry args={[0.13, 10, 8]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.6} />
                </mesh>
            ))}
            {/* Glasset */}
            <mesh position={[0, 0.45, x0]}>
                <cylinderGeometry args={[0.55, 0.45, 0.9, 24, 1, true]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.2, x0]}>
                <cylinderGeometry args={[0.5, 0.45, 0.4, 24]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
}

/** Mynten på 1 810 kroner som faller i bøtta. */
function Mynt({ vis, playing }: { vis: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const y = useRef(vis ? BUNN + 0.6 : 13);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = vis ? BUNN + 0.6 : 13;
        y.current = playing ? damp(y.current, mål, 2.5, dt) : mål;
        const g = ref.current;
        if (!g) return;
        g.position.y = y.current;
        g.rotation.z = 0.35;
    });
    return (
        <group ref={ref} position={[0, 13, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.9, 0.9, 0.18, 32]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} emissive="#b45309" emissiveIntensity={0.25} />
            </mesh>
        </group>
    );
}

/** Lokket med lås som legges på bøtta. */
function Lokk({ vis, playing }: { vis: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const y = useRef(vis ? BUNN + HOYDE + 0.1 : 14);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = vis ? BUNN + HOYDE + 0.1 : 14;
        y.current = playing ? damp(y.current, mål, 2.5, dt) : mål;
        if (ref.current) ref.current.position.y = y.current;
    });
    return (
        <group ref={ref} position={[0, 14, 0]}>
            <mesh>
                <cylinderGeometry args={[R_TOPP + 0.15, R_TOPP + 0.15, 0.2, 48]} />
                <meshStandardMaterial color="#475569" metalness={0.4} />
            </mesh>
            {/* Hengelåsen */}
            <mesh position={[0, 0.65, 0]}>
                <boxGeometry args={[1.1, 0.9, 0.5]} />
                <meshStandardMaterial color="#facc15" metalness={0.5} roughness={0.35} />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
                <torusGeometry args={[0.35, 0.09, 8, 24, Math.PI]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
            </mesh>
        </group>
    );
}

/** En bunke aviser ved siden av bøtta. */
function Aviser() {
    return (
        <group position={[-5, 0, 1]} rotation={[0, 0.3, 0]}>
            {Array.from({ length: 7 }, (_, i) => (
                <mesh key={i} position={[0, 0.12 + i * 0.22, 0]} rotation={[0, (i % 3) * 0.08, 0]}>
                    <boxGeometry args={[2.2, 0.2, 1.6]} />
                    <meshStandardMaterial color={i % 2 ? '#f1f5f9' : '#e2e8f0'} />
                </mesh>
            ))}
            <mesh position={[0, 1.64, 0]}>
                <boxGeometry args={[2.22, 0.02, 0.18]} />
                <meshStandardMaterial color="#dc2626" />
            </mesh>
        </group>
    );
}

/** Sykkelen som lønna går til. */
function Sykkel() {
    const farge = '#e11d48';
    return (
        <group position={[5.2, 0, 1]} rotation={[0, -0.5, 0]}>
            {[-1.3, 1.3].map((x) => (
                <mesh key={x} position={[x, 0.95, 0]}>
                    <torusGeometry args={[0.9, 0.09, 8, 32]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            ))}
            {/* Rammen: tre staver mellom hjulene, setet og styret */}
            <mesh position={[-0.6, 1.4, 0]} rotation={[0, 0, -0.75]}>
                <cylinderGeometry args={[0.07, 0.07, 1.7, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0.35, 1.9, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.07, 0.07, 1.9, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0.6, 1.35, 0]} rotation={[0, 0, 0.7]}>
                <cylinderGeometry args={[0.07, 0.07, 1.5, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[1.2, 1.5, 0]} rotation={[0, 0, 0.35]}>
                <cylinderGeometry args={[0.06, 0.06, 1.3, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[-0.6, 2.3, 0]}>
                <boxGeometry args={[0.7, 0.12, 0.3]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[1.4, 2.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 1, 8]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
        </group>
    );
}

/** Streken for garantipensjon inni bøtta. */
function Garanti({ vis }: { vis: boolean }) {
    if (!vis) return null;
    const h = 1.3;
    return (
        <group>
            <mesh position={[0, BUNN + h, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[radius(h) + 0.04, 0.07, 8, 64]} />
                <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.7} />
            </mesh>
            <Html position={[-radius(h) - 2.4, BUNN + h, 0]} center zIndexRange={[10, 0]}>
                <div className="px-3 py-1 rounded-xl bg-rose-600 text-white font-display font-black text-2xl whitespace-nowrap shadow-xl">
                    Minstenivå
                </div>
            </Html>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kam = useMemo(() => kamera(modus), [modus]);
    useKamera(kam, beat, playing);
    const s = tilstand(modus, beat);
    return (
        <>
            <color attach="background" args={['#1e293b']} />
            <fog attach="fog" args={['#1e293b', 28, 60]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#e0f2fe', '#334155', 0.7]} />
            <directionalLight position={[-6, 14, 12]} intensity={1.3} />
            <pointLight position={[0, 10, 6]} intensity={40} distance={40} color="#fde68a" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[60, 40]} />
                <meshStandardMaterial color="#475569" emissive="#1e293b" emissiveIntensity={0.4} />
            </mesh>
            {s.botte && (
                <>
                    <Botte />
                    <Vann nivå={s.nivå} playing={playing} />
                </>
            )}
            {KRANER.map((_, i) => (
                <Kran
                    key={i}
                    i={i}
                    vis={s.vis[i]}
                    på={s.på[i]}
                    merke={s.merke[i]}
                    nivå={s.nivå}
                    playing={playing}
                />
            ))}
            <Drypp på={s.tapp} playing={playing} />
            {modus === 'avis' && (
                <>
                    <Mynt vis={s.mynt} playing={playing} />
                    <Lokk vis={s.lokk} playing={playing} />
                    {s.aviser && <Aviser />}
                    {s.sykkel && <Sykkel />}
                </>
            )}
            <Garanti vis={s.garanti} />
            {s.bøtteMerke && (
                <Html position={[0, BUNN + 1.6, R_TOPP + 0.6]} center zIndexRange={[10, 0]}>
                    <div className="px-3 py-1 rounded-xl bg-white text-slate-900 font-display font-black text-2xl whitespace-nowrap shadow-xl">
                        {s.bøtteMerke}
                    </div>
                </Html>
            )}
        </>
    );
}

const KORTFARGE = {
    rod: 'border-rose-500',
    gronn: 'border-emerald-500',
    bla: 'border-sky-500',
} as const;

export function PensjonBotta({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kraner';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const kort = tilstand(modus, beat).kort;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [0, 8, 15.5] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-0 pointer-events-none">
                <Flate>
                    <AnimatePresence mode="wait">
                        {kort && (
                            <motion.div
                                key={`${modus}-${Math.min(beat, 4)}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="absolute"
                                style={{ left: 28, bottom: 28, maxWidth: 380 }}
                            >
                                <div
                                    className={`px-4 py-3 rounded-2xl bg-white/95 shadow-xl border-l-8 text-slate-900 font-display font-black text-2xl leading-tight ${
                                        kort.tone ? KORTFARGE[kort.tone] : 'border-slate-400'
                                    }`}
                                >
                                    {kort.tekst}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Flate>
            </div>
        </div>
    );
}
