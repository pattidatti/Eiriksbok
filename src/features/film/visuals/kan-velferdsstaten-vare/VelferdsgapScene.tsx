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
 * Velferdsgapet i 3D. Fire moduser som ser helt ulike ut:
 * - familie: et kjøkkenbord med en myntstabel (inntekter) og en papirbunke (utgifter).
 *   Besteforeldrene kommer, regningene vokser, mynten krymper, og et rødt hull står igjen.
 * - velferd: en liten by med skole, sykehus, pensjonisthjem og et hjelpekontor. Skattepotten
 *   i midten sender mynter ut til hvert bygg.
 * - gap: to søyler av blokker, inntekter og utgifter. Utgiftene vokser med seks blokker,
 *   og hullet står igjen som seks røde spøkelsesblokker (inndekningsbehovet).
 * - tette: de fire veiene. Skatt og flere i jobb legger blokker på inntektene, mindre velferd
 *   og et smartere offentlig tar blokker av utgiftene. Ett eksempel på en blanding.
 * Alt er et mål per beat som det glir mot, så eleven kan hoppe rett inn.
 */

type Modus = 'familie' | 'velferd' | 'gap' | 'tette';

type Tone = 'rod' | 'gronn' | 'bla' | 'gul';
interface Kort {
    tekst: ReactNode;
    tone?: Tone;
}

/* ------------------------------------------------------------------ */
/* Familie: kjøkkenbordet                                              */
/* ------------------------------------------------------------------ */

const BORD_Y = 1.5;
const MYNT_H = 0.15;

function familieTilstand(beat: number) {
    const b = Math.min(beat, 3);
    return {
        besteforeldre: b >= 1,
        mynter: b >= 2 ? 6 : 10,
        ark: b >= 1 ? 17 : 10,
        hull: b >= 3,
        kort: [
            { tekst: 'Familiens budsjett for 35 år' },
            { tekst: 'Bestemor og bestefar trenger mer hjelp', tone: 'rod' as const },
            { tekst: 'Én av inntektene krymper', tone: 'rod' as const },
            { tekst: 'Et hull i regnestykket', tone: 'rod' as const },
        ][b] as Kort,
    };
}

/** En enkel figur: kropp og hode. Hodene har mange segmenter, så de ikke ser pikselerte ut. */
function Figur({
    pos,
    farge,
    hår,
    høyde = 2.4,
}: {
    pos: [number, number, number];
    farge: string;
    hår: string;
    høyde?: number;
}) {
    return (
        <group position={pos}>
            <mesh position={[0, høyde * 0.42, 0]}>
                <cylinderGeometry args={[0.32, 0.42, høyde * 0.84, 20]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, høyde * 0.84 + 0.3, 0]}>
                <sphereGeometry args={[0.3, 32, 24]} />
                <meshStandardMaterial color="#f1c9a5" />
            </mesh>
            <mesh position={[0, høyde * 0.84 + 0.42, -0.04]} scale={[1, 0.6, 1]}>
                <sphereGeometry args={[0.31, 32, 24]} />
                <meshStandardMaterial color={hår} />
            </mesh>
        </group>
    );
}

function Familie({ beat, playing }: { beat: number; playing: boolean }) {
    const s = familieTilstand(beat);
    const myntH = useRef(s.mynter * MYNT_H);
    const arkH = useRef(s.ark * MYNT_H);
    const mynt = useRef<THREE.Mesh>(null);
    const ark = useRef<THREE.Mesh>(null);
    const hull = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mm = s.mynter * MYNT_H;
        const am = s.ark * MYNT_H;
        myntH.current = playing ? damp(myntH.current, mm, 2.2, dt) : mm;
        arkH.current = playing ? damp(arkH.current, am, 2.2, dt) : am;
        if (mynt.current) {
            mynt.current.scale.y = myntH.current;
            mynt.current.position.y = BORD_Y + 0.15 + myntH.current / 2;
        }
        if (ark.current) {
            ark.current.scale.y = arkH.current;
            ark.current.position.y = BORD_Y + 0.15 + arkH.current / 2;
        }
        if (hull.current) {
            const h = Math.max(arkH.current - myntH.current, 0.01);
            hull.current.visible = s.hull;
            hull.current.scale.y = h;
            hull.current.position.y = BORD_Y + 0.15 + myntH.current + h / 2;
        }
    });
    return (
        <group>
            {/* Gulv og vegg */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[40, 30]} />
                <meshStandardMaterial color="#d6b98c" />
            </mesh>
            <mesh position={[0, 6, -5]}>
                <planeGeometry args={[40, 12]} />
                <meshStandardMaterial color="#f5ead6" />
            </mesh>
            {/* Vinduet */}
            <mesh position={[4.5, 5.5, -4.95]}>
                <planeGeometry args={[3.2, 2.4]} />
                <meshStandardMaterial color="#bae6fd" emissive="#7dd3fc" emissiveIntensity={0.5} />
            </mesh>
            {/* Bordet */}
            <mesh position={[0, BORD_Y, 0]}>
                <boxGeometry args={[7.5, 0.3, 3.6]} />
                <meshStandardMaterial color="#92400e" />
            </mesh>
            {[
                [-3.4, -1.5],
                [3.4, -1.5],
                [-3.4, 1.5],
                [3.4, 1.5],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, BORD_Y / 2, z]}>
                    <boxGeometry args={[0.25, BORD_Y, 0.25]} />
                    <meshStandardMaterial color="#78350f" />
                </mesh>
            ))}
            {/* Myntstabelen: inntektene */}
            <mesh ref={mynt} position={[-1.6, BORD_Y + 1, 0.3]}>
                <cylinderGeometry args={[0.7, 0.7, 1, 32]} />
                <meshStandardMaterial
                    color="#fbbf24"
                    metalness={0.5}
                    roughness={0.35}
                    emissive="#b45309"
                    emissiveIntensity={0.25}
                />
            </mesh>
            {/* Papirbunken: utgiftene */}
            <mesh ref={ark} position={[1.6, BORD_Y + 1, 0.3]}>
                <boxGeometry args={[1.5, 1, 1.9]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            {/* Hullet: det som mangler over myntene */}
            <mesh ref={hull} position={[-1.6, BORD_Y + 3, 0.3]}>
                <cylinderGeometry args={[0.72, 0.72, 1, 32]} />
                <meshStandardMaterial
                    color="#ef4444"
                    emissive="#dc2626"
                    emissiveIntensity={0.6}
                    transparent
                    opacity={0.4}
                />
            </mesh>
            {/* Familien bak bordet */}
            <Figur pos={[-3.3, 0, -2.6]} farge="#2563eb" hår="#3f2a1d" />
            <Figur pos={[0, 0, -2.7]} farge="#0d9488" hår="#a16207" />
            <Figur pos={[3.3, 0, -2.6]} farge="#be123c" hår="#1f2937" høyde={2.3} />
            {s.besteforeldre && (
                <>
                    <Figur pos={[-4.9, 0, 0.6]} farge="#6b7280" hår="#e5e7eb" høyde={2.2} />
                    <Figur pos={[4.9, 0, 0.6]} farge="#7c3aed" hår="#f3f4f6" høyde={2.1} />
                </>
            )}
            {s.hull && (
                <Html
                    position={[
                        -3.4,
                        BORD_Y + 0.15 + (s.mynter + (s.ark - s.mynter) / 2) * MYNT_H,
                        0.3,
                    ]}
                    center
                    zIndexRange={[10, 0]}
                >
                    <div className="px-3 py-1 rounded-xl bg-red-600 text-white font-display font-black text-2xl whitespace-nowrap shadow-xl">
                        Mangler →
                    </div>
                </Html>
            )}
            <Html position={[-1.6, BORD_Y - 0.55, 2.1]} center zIndexRange={[10, 0]}>
                <div className="px-3 py-1 rounded-xl bg-amber-500 text-white font-display font-black text-2xl whitespace-nowrap shadow-xl">
                    Inntekter
                </div>
            </Html>
            <Html position={[1.6, BORD_Y - 0.55, 2.1]} center zIndexRange={[10, 0]}>
                <div className="px-3 py-1 rounded-xl bg-slate-700 text-white font-display font-black text-2xl whitespace-nowrap shadow-xl">
                    Utgifter
                </div>
            </Html>
        </group>
    );
}

/* ------------------------------------------------------------------ */
/* Velferd: den lille byen                                             */
/* ------------------------------------------------------------------ */

const BYGG = [
    { navn: 'Skole', pos: [-7.6, 0, -2.5] as const, farge: '#facc15', fraBeat: 1 },
    { navn: 'Sykehus', pos: [-2.6, 0, -6] as const, farge: '#f8fafc', fraBeat: 1 },
    { navn: 'Pensjon', pos: [2.8, 0, -6] as const, farge: '#fda4af', fraBeat: 1 },
    {
        navn: 'Hjelp når du er\nsyk eller uten jobb',
        pos: [7.8, 0, -2.5] as const,
        farge: '#93c5fd',
        fraBeat: 2,
    },
];

function Bygg({ i, aktiv }: { i: number; aktiv: boolean }) {
    const b = BYGG[i];
    const [x, , z] = b.pos;
    const farge = aktiv ? b.farge : '#cbd5e1';
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 1.4, 0]}>
                <boxGeometry args={[3, 2.8, 2.4]} />
                <meshStandardMaterial
                    color={farge}
                    emissive={aktiv ? b.farge : '#000000'}
                    emissiveIntensity={aktiv ? 0.12 : 0}
                />
            </mesh>
            {/* Taket */}
            <mesh position={[0, 3.25, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[2.3, 1.1, 4]} />
                <meshStandardMaterial color={aktiv ? '#7f1d1d' : '#94a3b8'} flatShading />
            </mesh>
            {/* Vinduer */}
            {[-0.8, 0.8].map((wx) => (
                <mesh key={wx} position={[wx, 1.7, 1.21]}>
                    <planeGeometry args={[0.6, 0.6]} />
                    <meshStandardMaterial
                        color="#1e3a8a"
                        emissive={aktiv ? '#fde68a' : '#000000'}
                        emissiveIntensity={0.5}
                    />
                </mesh>
            ))}
            {/* Kjennetegn: rødt kors på sykehuset, flagg på skolen */}
            {i === 1 && (
                <group position={[0, 2.2, 1.22]}>
                    <mesh>
                        <planeGeometry args={[0.9, 0.28]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                    <mesh>
                        <planeGeometry args={[0.28, 0.9]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                </group>
            )}
            {i === 0 && (
                <group position={[1.8, 0, 0.8]}>
                    <mesh position={[0, 2, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
                        <meshStandardMaterial color="#e2e8f0" />
                    </mesh>
                    <mesh position={[0.45, 3.6, 0]}>
                        <planeGeometry args={[0.9, 0.6]} />
                        <meshStandardMaterial color="#dc2626" side={THREE.DoubleSide} />
                    </mesh>
                </group>
            )}
            {/* Døra */}
            <mesh position={[0, 0.55, 1.21]}>
                <planeGeometry args={[0.6, 1.1]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
        </group>
    );
}

const POTT: [number, number, number] = [0, 0, 1.6];

/** Mynter som går i bue fra potten ut til hvert bygg. Står i fast stilling på pause. */
function Myntstrom({ på, playing }: { på: boolean; playing: boolean }) {
    const mynter = useRef<(THREE.Mesh | null)[]>([]);
    const t = useRef(0);
    const fra = useMemo(() => new THREE.Vector3(POTT[0], 1.6, POTT[2]), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        t.current += dt;
        mynter.current.forEach((m, k) => {
            if (!m) return;
            m.visible = på;
            const i = k % BYGG.length;
            const nr = Math.floor(k / BYGG.length);
            const fase = playing ? (t.current * 0.45 + nr * 0.5 + i * 0.13) % 1 : 0.3 + nr * 0.4;
            const [bx, , bz] = BYGG[i].pos;
            const til = new THREE.Vector3(bx, 2.2, bz + 1.4);
            m.position.lerpVectors(fra, til, fase);
            m.position.y += Math.sin(fase * Math.PI) * 2.6;
            m.rotation.y = fase * 8;
        });
    });
    if (!på) return null;
    return (
        <group>
            {Array.from({ length: BYGG.length * 2 }, (_, k) => (
                <mesh
                    key={k}
                    ref={(m) => {
                        mynter.current[k] = m;
                    }}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <cylinderGeometry args={[0.32, 0.32, 0.08, 24]} />
                    <meshStandardMaterial
                        color="#fbbf24"
                        metalness={0.5}
                        roughness={0.3}
                        emissive="#b45309"
                        emissiveIntensity={0.35}
                    />
                </mesh>
            ))}
        </group>
    );
}

function Velferd({ beat, playing }: { beat: number; playing: boolean }) {
    const pott = beat >= 3;
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[60, 40]} />
                <meshStandardMaterial color="#86efac" />
            </mesh>
            {/* Vei rundt torget */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[3.2, 4.4, 48]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            {BYGG.map((b, i) => (
                <Bygg key={b.navn} i={i} aktiv={beat >= b.fraBeat} />
            ))}
            {/* Trær */}
            {[
                [-9, -6],
                [9, -6],
                [-9.5, 2],
                [9.5, 2.5],
                [0, -9],
            ].map(([x, z]) => (
                <group key={`${x}${z}`} position={[x, 0, z]}>
                    <mesh position={[0, 0.6, 0]}>
                        <cylinderGeometry args={[0.15, 0.2, 1.2, 8]} />
                        <meshStandardMaterial color="#78350f" />
                    </mesh>
                    <mesh position={[0, 1.7, 0]}>
                        <sphereGeometry args={[0.9, 20, 16]} />
                        <meshStandardMaterial color="#15803d" />
                    </mesh>
                </group>
            ))}
            {/* Skattepotten */}
            {pott && (
                <group position={POTT}>
                    <mesh position={[0, 0.6, 0]}>
                        <cylinderGeometry args={[1.3, 1, 1.2, 32]} />
                        <meshStandardMaterial color="#475569" metalness={0.4} />
                    </mesh>
                    <mesh position={[0, 1.25, 0]}>
                        <cylinderGeometry args={[1.15, 1.15, 0.2, 32]} />
                        <meshStandardMaterial
                            color="#fbbf24"
                            metalness={0.5}
                            emissive="#b45309"
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                </group>
            )}
            <Myntstrom på={pott} playing={playing} />
            {BYGG.map((b) =>
                beat >= b.fraBeat ? (
                    <Html
                        key={b.navn}
                        position={[b.pos[0], 4.5, b.pos[2] + 0.4]}
                        center
                        zIndexRange={[10, 0]}
                    >
                        <div
                            className="px-3 py-1 rounded-xl bg-white text-slate-900 font-display font-black text-2xl shadow-xl text-center"
                            style={{ whiteSpace: 'pre' }}
                        >
                            {b.navn}
                        </div>
                    </Html>
                ) : null
            )}
            {pott && (
                <Html position={[POTT[0], -0.2, POTT[2] + 1.8]} center zIndexRange={[10, 0]}>
                    <div className="px-3 py-1 rounded-xl bg-amber-500 text-white font-display font-black text-2xl whitespace-nowrap shadow-xl">
                        Skatt
                    </div>
                </Html>
            )}
        </group>
    );
}

function velferdKort(beat: number): Kort | null {
    return [
        { tekst: 'Velferdsstaten Norge' },
        { tekst: 'Fellesskapet betaler', tone: 'bla' as const },
        { tekst: 'Også når du blir syk eller mister jobben', tone: 'bla' as const },
        {
            tekst: 'Betalt med skatt. De fleste tjenestene er gratis eller nesten gratis.',
            tone: 'gul' as const,
        },
    ][Math.min(beat, 3)] as Kort;
}

/* ------------------------------------------------------------------ */
/* Gap og tette: søylene                                               */
/* ------------------------------------------------------------------ */

const BH = 0.55; // høyden på én blokk
const SOYLE_X = 2.4;
const BASE = 10;

interface Del {
    id: string;
    blokker: number;
    farge: string;
    /** Løftet bort (en del som kuttes): flyter opp og blir gjennomsiktig. */
    bort?: boolean;
    /** Helt borte. */
    skjult?: boolean;
}

interface SoyleTilstand {
    inn: Del[];
    ut: Del[];
    /** Spøkelsesblokker over inntektene: antall og om de er nummerert. */
    spokelse: number;
    nummer: boolean;
    puls: boolean;
    ar: string;
    kort: Kort | null;
}

const BLA = '#3b82f6';
const ORANSJE = '#f97316';
const SKATT = '#f59e0b';
const KUTT = '#f43f5e';
const JOBB = '#10b981';
const SMART = '#38bdf8';

function gapTilstand(beat: number): SoyleTilstand {
    const b = Math.min(beat, 5);
    const vekst = b === 0 ? 0 : b === 1 ? 3 : 6;
    return {
        inn: [{ id: 'inn', blokker: BASE, farge: BLA }],
        ut: [
            { id: 'ut', blokker: BASE, farge: ORANSJE },
            { id: 'vekst', blokker: vekst, farge: '#ea580c' },
        ],
        spokelse: b >= 3 ? 6 : 0,
        nummer: b >= 4,
        puls: b >= 5,
        ar: b <= 0 ? '2024' : b === 1 ? '2024 → 2060' : '2060',
        kort: [
            { tekst: 'Perspektivmeldingen 2024' },
            { tekst: 'Utgiftene vokser mye raskere enn inntektene', tone: 'rod' as const },
            {
                tekst: (
                    <>
                        Utgiftene: ventet +5,7 prosentpoeng
                        <div className="text-xl font-bold text-slate-600 mt-1">
                            som del av økonomien utenom olje og gass
                        </div>
                    </>
                ),
                tone: 'rod' as const,
            },
            { tekst: 'Hullet: inndekningsbehovet', tone: 'rod' as const },
            {
                tekst: (
                    <>
                        Gapet i 2060: ventet 6,2 prosent
                        <div className="text-xl font-bold text-slate-600 mt-1">
                            av økonomien utenom olje og gass. Omtrent én blokk per prosentpoeng.
                        </div>
                    </>
                ),
                tone: 'rod' as const,
            },
            { tekst: 'Advart om i alle perspektivmeldingene siden 2004', tone: 'gul' as const },
        ][b] as Kort,
    };
}

function tetteTilstand(beat: number): SoyleTilstand {
    const b = Math.min(beat, 5);
    // Ett eksempel: hver vei tar en firedel av gapet (1,5 av 6 blokker).
    const del = 1.5;
    const skatt = b >= 1;
    const kutt = b >= 2;
    const jobb = b >= 3;
    const smart = b >= 4;
    const tetta = (skatt ? del : 0) + (jobb ? del : 0) + (kutt ? del : 0) + (smart ? del : 0);
    return {
        inn: [
            { id: 'inn', blokker: BASE, farge: BLA },
            { id: 'skatt', blokker: skatt ? del : 0, farge: SKATT },
            { id: 'jobb', blokker: jobb ? del : 0, farge: JOBB },
        ],
        ut: [
            { id: 'ut', blokker: BASE + 3, farge: ORANSJE },
            {
                id: 'smart',
                blokker: del,
                farge: smart ? SMART : ORANSJE,
                bort: smart,
                skjult: b >= 5,
            },
            { id: 'kutt', blokker: del, farge: kutt ? KUTT : ORANSJE, bort: kutt, skjult: b >= 3 },
        ],
        spokelse: 6 - tetta,
        nummer: false,
        puls: b === 0,
        ar: '2060',
        kort: [
            { tekst: 'Fire veier for å tette gapet' },
            {
                tekst: (
                    <>
                        1. Høyere skatt
                        <div className="text-xl font-bold text-slate-600 mt-1">
                            Merkes av: folk i jobb og de med mest penger
                        </div>
                    </>
                ),
                tone: 'gul' as const,
            },
            {
                tekst: (
                    <>
                        2. Mindre velferd
                        <div className="text-xl font-bold text-slate-600 mt-1">
                            Merkes av: syke og uføre, ved store kutt også eldre
                        </div>
                    </>
                ),
                tone: 'rod' as const,
            },
            {
                tekst: (
                    <>
                        3. Flere i jobb
                        <div className="text-xl font-bold text-slate-600 mt-1">
                            Merkes av: folk i jobb og de som står utenfor arbeidslivet
                        </div>
                    </>
                ),
                tone: 'gronn' as const,
            },
            {
                tekst: (
                    <>
                        4. Et smartere offentlig
                        <div className="text-xl font-bold text-slate-600 mt-1">
                            Merkes av: de som jobber i det offentlige
                        </div>
                    </>
                ),
                tone: 'bla' as const,
            },
            { tekst: 'Ingen vei er gratis. Hver sender regningen til noen.', tone: 'rod' as const },
        ][b] as Kort,
    };
}

/** Én del av en søyle. Høyden og plassen glir mot målet. */
function SoyleDel({ x, bunn, d, playing }: { x: number; bunn: number; d: Del; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const h = useRef(d.blokker * BH);
    const y = useRef(bunn);
    const løft = useRef(d.bort ? 1.4 : 0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const målH = d.skjult ? 0 : d.blokker * BH;
        const målL = d.bort ? 1.4 : 0;
        h.current = playing ? damp(h.current, målH, 2.4, dt) : målH;
        y.current = playing ? damp(y.current, bunn, 2.4, dt) : bunn;
        løft.current = playing ? damp(løft.current, målL, 2, dt) : målL;
        const m = ref.current;
        if (!m) return;
        m.visible = h.current > 0.01;
        m.scale.y = Math.max(h.current, 0.001);
        m.position.set(x + løft.current * 2.2, y.current + h.current / 2 + løft.current * 0.25, 0);
        if (mat.current) mat.current.opacity = d.bort ? 0.55 : 1;
    });
    return (
        <mesh ref={ref}>
            <boxGeometry args={[2.6, 1, 2.6]} />
            <meshStandardMaterial
                ref={mat}
                color={d.farge}
                emissive={d.farge}
                emissiveIntensity={0.18}
                transparent
            />
        </mesh>
    );
}

/** Streker mellom blokkene, så søylen kan telles. */
function Fuger({ x, antall }: { x: number; antall: number }) {
    return (
        <group>
            {Array.from({ length: Math.max(0, Math.floor(antall) - 1) }, (_, i) => (
                <mesh key={i} position={[x, (i + 1) * BH + 0.6, 1.31]}>
                    <planeGeometry args={[2.6, 0.04]} />
                    <meshBasicMaterial color="#0f172a" transparent opacity={0.35} />
                </mesh>
            ))}
        </group>
    );
}

function Spokelser({
    fra,
    antall,
    nummer,
    puls,
    playing,
}: {
    fra: number;
    antall: number;
    nummer: boolean;
    puls: boolean;
    playing: boolean;
}) {
    const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const t = useRef(0);
    const y0 = useRef(fra);
    const grp = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        t.current += dt;
        y0.current = playing ? damp(y0.current, fra, 2.4, dt) : fra;
        if (grp.current) grp.current.position.y = y0.current;
        const o = puls && playing ? 0.35 + Math.sin(t.current * 3) * 0.15 : 0.38;
        mats.current.forEach((m) => {
            if (m) m.opacity = o;
        });
    });
    const hele = Math.floor(antall + 0.001);
    const rest = antall - hele;
    return (
        <group ref={grp}>
            {Array.from({ length: hele }, (_, i) => (
                <mesh key={i} position={[-SOYLE_X, i * BH + BH / 2, 0]}>
                    <boxGeometry args={[2.5, BH * 0.9, 2.5]} />
                    <meshStandardMaterial
                        ref={(m) => {
                            mats.current[i] = m;
                        }}
                        color="#ef4444"
                        emissive="#dc2626"
                        emissiveIntensity={0.7}
                        transparent
                        opacity={0.38}
                    />
                </mesh>
            ))}
            {rest > 0.01 && (
                <mesh position={[-SOYLE_X, hele * BH + (rest * BH) / 2, 0]}>
                    <boxGeometry args={[2.5, rest * BH * 0.9, 2.5]} />
                    <meshStandardMaterial
                        color="#ef4444"
                        emissive="#dc2626"
                        emissiveIntensity={0.7}
                        transparent
                        opacity={0.38}
                    />
                </mesh>
            )}
            {nummer &&
                Array.from({ length: hele }, (_, i) => (
                    <Html
                        key={i}
                        position={[-SOYLE_X, i * BH + BH / 2, 1.3]}
                        center
                        zIndexRange={[10, 0]}
                    >
                        <div
                            className="text-white font-display font-black text-2xl"
                            style={{ textShadow: '0 0 6px #7f1d1d' }}
                        >
                            {i + 1}
                        </div>
                    </Html>
                ))}
        </group>
    );
}

const PLINT = 0.6;

/** Hele blokker i en søyle, uten deler som er løftet bort. */
function blokkerI(deler: Del[]) {
    return deler.reduce((sum, d) => sum + (d.bort || d.skjult ? 0 : d.blokker), 0);
}

/** Stabler delene: hver del får bunnen sin fra summen av delene under. */
function stable(deler: Del[], hoyde: (d: Del) => number) {
    return deler.map((d, i) => ({
        d,
        bunn: PLINT + deler.slice(0, i).reduce((sum, e) => sum + hoyde(e), 0),
    }));
}

function Soyler({ s, playing }: { s: SoyleTilstand; playing: boolean }) {
    const inn = stable(s.inn, (d) => (d.skjult ? 0 : d.blokker * BH));
    // En del som løftes bort, teller ikke lenger i søylen.
    const ut = stable(s.ut, (d) => (d.bort || d.skjult ? 0 : d.blokker * BH));
    const yi = PLINT + s.inn.reduce((sum, d) => sum + (d.skjult ? 0 : d.blokker * BH), 0);
    return (
        <group>
            <mesh position={[0, PLINT / 2, 0]}>
                <boxGeometry args={[9.5, PLINT, 4.2]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            {inn.map(({ d, bunn }) => (
                <SoyleDel key={d.id} x={-SOYLE_X} bunn={bunn} d={d} playing={playing} />
            ))}
            {ut.map(({ d, bunn }) => (
                <SoyleDel key={d.id} x={SOYLE_X} bunn={bunn} d={d} playing={playing} />
            ))}
            <Fuger x={-SOYLE_X} antall={BASE} />
            <Fuger x={SOYLE_X} antall={blokkerI(s.ut)} />
            <Spokelser
                fra={yi}
                antall={s.spokelse}
                nummer={s.nummer}
                puls={s.puls}
                playing={playing}
            />
            <Html position={[-SOYLE_X, PLINT / 2, 2.2]} center zIndexRange={[10, 0]}>
                <div
                    className="px-3 py-1 rounded-xl text-white font-display font-black text-2xl whitespace-nowrap shadow-xl"
                    style={{ background: BLA }}
                >
                    Inntekter
                </div>
            </Html>
            <Html position={[SOYLE_X, PLINT / 2, 2.2]} center zIndexRange={[10, 0]}>
                <div
                    className="px-3 py-1 rounded-xl text-white font-display font-black text-2xl whitespace-nowrap shadow-xl"
                    style={{ background: ORANSJE }}
                >
                    Utgifter
                </div>
            </Html>
        </group>
    );
}

/* ------------------------------------------------------------------ */
/* Scene og kamera                                                     */
/* ------------------------------------------------------------------ */

function kamera(modus: Modus) {
    return (beat: number, t: number) => {
        const sakte = Math.sin(t * 0.15) * 0.6;
        if (modus === 'velferd') {
            if (beat === 0) return { pos: v(sakte, 14, 19), se: v(0, 1, -2) };
            return { pos: v(sakte, 12, 18), se: v(0, 2, -2.5) };
        }
        if (modus === 'familie') {
            if (beat === 0) return { pos: v(sakte, 6.2, 9.5), se: v(0, 2.8, 0) };
            return { pos: v(sakte, 6.8, 11.5), se: v(0, 3, 0) };
        }
        return { pos: v(sakte - 1.6, 6.8, 18.5), se: v(-1.9, 4.6, 0) };
    };
}

const BAKGRUNN: Record<Modus, string> = {
    familie: '#f5ead6',
    velferd: '#bae6fd',
    gap: '#1e293b',
    tette: '#1e293b',
};

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kam = useMemo(() => kamera(modus), [modus]);
    useKamera(kam, beat, playing);
    const mørk = modus === 'gap' || modus === 'tette';
    return (
        <>
            <color attach="background" args={[BAKGRUNN[modus]]} />
            <fog attach="fog" args={[BAKGRUNN[modus], 30, 70]} />
            <ambientLight intensity={mørk ? 0.7 : 0.9} />
            <hemisphereLight args={['#e0f2fe', mørk ? '#334155' : '#a3a3a3', 0.7]} />
            <directionalLight position={[-6, 14, 12]} intensity={1.3} />
            {modus === 'familie' && <Familie beat={beat} playing={playing} />}
            {modus === 'velferd' && <Velferd beat={beat} playing={playing} />}
            {modus === 'gap' && <Soyler s={gapTilstand(beat)} playing={playing} />}
            {modus === 'tette' && <Soyler s={tetteTilstand(beat)} playing={playing} />}
            {mørk && (
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[60, 40]} />
                    <meshStandardMaterial
                        color="#475569"
                        emissive="#1e293b"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            )}
        </>
    );
}

const KORTFARGE: Record<Tone, string> = {
    rod: 'border-rose-500',
    gronn: 'border-emerald-500',
    bla: 'border-sky-500',
    gul: 'border-amber-500',
};

function kortFor(modus: Modus, beat: number): Kort | null {
    if (modus === 'familie') return familieTilstand(beat).kort;
    if (modus === 'velferd') return velferdKort(beat);
    if (modus === 'gap') return gapTilstand(beat).kort;
    return tetteTilstand(beat).kort;
}

export function VelferdsgapScene({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'gap';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const kort = kortFor(modus, beat);
    const ar =
        modus === 'gap' || modus === 'tette'
            ? (modus === 'gap' ? gapTilstand(beat) : tetteTilstand(beat)).ar
            : null;
    const blanding = modus === 'tette' && beat >= 4;
    const oppe = modus !== 'velferd';
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [0, 7, 17] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-0 pointer-events-none">
                <Flate>
                    <AnimatePresence mode="wait">
                        {kort && (
                            <motion.div
                                key={`${modus}-${Math.min(beat, 5)}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="absolute"
                                style={{
                                    left: 28,
                                    ...(oppe ? { top: 24 } : { bottom: 28 }),
                                    maxWidth: 330,
                                }}
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
                    {ar && (
                        <div
                            className="absolute px-4 py-2 rounded-2xl bg-white/95 shadow-xl text-slate-900 font-display font-black text-3xl tabular-nums"
                            style={{ right: 28, top: 24 }}
                        >
                            {ar}
                        </div>
                    )}
                    {blanding && (
                        <div
                            className="absolute px-4 py-2 rounded-xl bg-slate-900/90 text-white font-black text-2xl"
                            style={{ right: 20, bottom: 110, maxWidth: 250 }}
                        >
                            Ett eksempel på en blanding. Hver vei tar en firedel.
                        </div>
                    )}
                </Flate>
            </div>
        </div>
    );
}
