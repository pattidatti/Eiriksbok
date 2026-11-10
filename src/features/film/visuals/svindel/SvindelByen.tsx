import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, useKamera, v } from './felles3d';

/**
 * Svindelfilmens 3D-verden: små hus, et bankhvelv og en skålvekt, flat-shaded. Fire moduser:
 * - hvelv: svindlerne bryter seg ikke inn. Kunden åpner hvelvdøra selv, styrt av tråder fra
 *   meldinger, annonser og falske nettsider (sosial manipulering).
 * - muldyr: pengene går fra de kriminelle, gjennom Jonas og videre. Sporet blir uklart.
 * - kjede: hvitvasking. Røde penger går gjennom mange kontoer og kommer ut hvite.
 * - vekt: 500 kroner på den ene skåla, straff, stengt konto og trusler på den andre.
 * Alt styres av (beat, tid i beaten), så eleven kan hoppe rett til en beat.
 */

type Modus = 'hvelv' | 'muldyr' | 'kjede' | 'vekt';

const OVERSKRIFTER: Record<Modus, string[]> = {
    hvelv: [
        'Svindel: å lure noen for penger',
        'Meldinger, annonser, falske nettsider',
        'Ingen bryter seg inn',
        'Du åpner døra selv',
        'Sosial manipulering: spill på følelser',
    ],
    muldyr: [
        'Hva er et pengemuldyr?',
        'Tar imot, sender videre, får betalt',
        'Pengene kommer ofte fra kriminalitet',
        'Sporet blir uklart for politiet',
    ],
    kjede: [
        'Hvitvasking: skjule hvor pengene kom fra',
        'Hvitvasking er straffbart',
        'Hvitvasking er straffbart',
        'Hvitvasking er straffbart',
    ],
    vekt: [
        'Prisen for å si ja',
        'Prisen for å si ja',
        'Prisen for å si ja',
        'Prisen for å si ja',
        'Ikke verdt det',
    ],
};

/* ---------- felles ---------- */

function lagTekstur(linjer: string[], bakgrunn: string, farge: string, b = 512, h = 256) {
    const c = document.createElement('canvas');
    c.width = b;
    c.height = h;
    const g = c.getContext('2d')!;
    g.fillStyle = bakgrunn;
    g.fillRect(0, 0, b, h);
    g.fillStyle = farge;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const str = linjer.length > 1 ? 64 : 84;
    g.font = `900 ${str}px sans-serif`;
    linjer.forEach((l, i) =>
        g.fillText(l, b / 2, h / 2 + (i - (linjer.length - 1) / 2) * (str * 1.15))
    );
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function useTekstur(linjer: string[], bakgrunn: string, farge: string, b?: number, h?: number) {
    const nokkel = linjer.join('|');
    const t = useMemo(
        () => lagTekstur(nokkel.split('|'), bakgrunn, farge, b, h),
        [nokkel, bakgrunn, farge, b, h]
    );
    useEffect(() => () => t.dispose(), [t]);
    return t;
}

function Hus({
    pos,
    farge,
    tak = '#334155',
    skala = 1,
}: {
    pos: [number, number, number];
    farge: string;
    tak?: string;
    skala?: number;
}) {
    return (
        <group position={pos} scale={skala}>
            <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[3, 2.4, 3]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 3.2, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[2.4, 1.6, 4]} />
                <meshStandardMaterial color={tak} flatShading />
            </mesh>
            <mesh position={[0, 0.7, 1.51]}>
                <planeGeometry args={[0.8, 1.4]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
        </group>
    );
}

/** En enkel figur: kropp og hode. */
function Figur({ pos, farge }: { pos: [number, number, number]; farge: string }) {
    return (
        <group position={pos}>
            <mesh position={[0, 0.9, 0]}>
                <capsuleGeometry args={[0.45, 0.9, 4, 10]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 2.1, 0]}>
                <sphereGeometry args={[0.42, 14, 10]} />
                <meshStandardMaterial color="#fcd9b6" flatShading />
            </mesh>
        </group>
    );
}

/** Punkt på en bue mellom to punkter. */
function bue(a: THREE.Vector3, b: THREE.Vector3, t: number, hoyde = 3, ut = new THREE.Vector3()) {
    ut.lerpVectors(a, b, t);
    ut.y += Math.sin(Math.PI * t) * hoyde;
    return ut;
}

const RØD = new THREE.Color('#dc2626');
const HVIT = new THREE.Color('#f8fafc');
const GULL = new THREE.Color('#facc15');

/**
 * Mynter som går langs en rekke punkter, i buer. `aktiv` skrur strømmen av og på.
 * `vask` gir myntene farge fra rød til hvit etter hvor langt de har kommet.
 */
function Strom({
    punkter,
    antall,
    aktiv,
    playing,
    vask = false,
    fart = 0.12,
}: {
    punkter: THREE.Vector3[];
    antall: number;
    aktiv: boolean;
    playing: boolean;
    vask?: boolean;
    fart?: number;
}) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    const synlig = useRef(0);
    const tmp = useMemo(() => new THREE.Vector3(), []);
    const farge = useMemo(() => new THREE.Color(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        synlig.current = damp(synlig.current, aktiv ? 1 : 0, 4, dt === 0 ? 1 : dt);
        const deler = punkter.length - 1;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const p = (tid.current * fart + i / antall) % 1;
            const del = Math.min(Math.floor(p * deler), deler - 1);
            const t = p * deler - del;
            bue(punkter[del], punkter[del + 1], t, 2.6, tmp);
            m.position.copy(tmp);
            m.rotation.y = tid.current * 3 + i;
            m.scale.setScalar(synlig.current);
            m.visible = synlig.current > 0.02;
            const mat = m.material as THREE.MeshStandardMaterial;
            if (vask) farge.copy(RØD).lerp(HVIT, p);
            else farge.copy(GULL);
            mat.color.copy(farge);
            mat.emissive.copy(farge).multiplyScalar(0.25);
        });
    });
    return (
        <>
            {Array.from({ length: antall }, (_, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <cylinderGeometry args={[0.42, 0.42, 0.14, 16]} />
                    <meshStandardMaterial color="#facc15" metalness={0.3} roughness={0.4} />
                </mesh>
            ))}
        </>
    );
}

function Bakke({ farge = '#334155' }: { farge?: string }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[120, 80]} />
            <meshStandardMaterial color={farge} emissive="#0f172a" emissiveIntensity={0.3} />
        </mesh>
    );
}

/* ---------- hvelv ---------- */

const PANELER = [
    { tekst: ['Melding'], pos: v(-6, 9, 2), farge: '#facc15' },
    { tekst: ['Annonse'], pos: v(0, 10.5, 3), farge: '#f472b6' },
    { tekst: ['Falsk', 'nettside'], pos: v(6, 9, 2), farge: '#38bdf8' },
];
const KUNDE = v(3.6, 0, 4.2);
const SVINDLER = v(11, 0, 7);

function Panel({ i, beat, playing }: { i: number; beat: number; playing: boolean }) {
    const p = PANELER[i];
    const tekstur = useTekstur(p.tekst, p.farge, '#0f172a');
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const g = ref.current;
        if (!g) return;
        const mål = beat === 1 || beat >= 4 ? 1 : 0;
        const s = forste.current ? mål : damp(g.scale.x, mål, 4, dt);
        forste.current = false;
        g.scale.setScalar(Math.max(s, 0.0001));
        g.visible = s > 0.02;
        g.position.set(p.pos.x, p.pos.y + Math.sin(tid.current * 1.2 + i) * 0.25, p.pos.z);
    });
    return (
        <group ref={ref}>
            <mesh>
                <boxGeometry args={[5, 2.5, 0.25]} />
                <meshStandardMaterial attach="material-0" color={p.farge} />
                <meshStandardMaterial attach="material-1" color={p.farge} />
                <meshStandardMaterial attach="material-2" color={p.farge} />
                <meshStandardMaterial attach="material-3" color={p.farge} />
                <meshStandardMaterial
                    attach="material-4"
                    map={tekstur}
                    emissive="#ffffff"
                    emissiveMap={tekstur}
                    emissiveIntensity={0.35}
                />
                <meshStandardMaterial attach="material-5" color={p.farge} />
            </mesh>
        </group>
    );
}

function Hvelv({ beat, playing }: { beat: number; playing: boolean }) {
    const dor = useRef<THREE.Group>(null);
    const hjul = useRef<THREE.MeshStandardMaterial>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const åpen = beat >= 3 ? -1.75 : 0;
        if (dor.current) {
            dor.current.rotation.y = forste.current
                ? åpen
                : damp(dor.current.rotation.y, åpen, 2, dt);
        }
        if (hjul.current) {
            const glød = beat === 2 ? 0.9 : 0.1;
            hjul.current.emissiveIntensity = forste.current
                ? glød
                : damp(hjul.current.emissiveIntensity, glød, 4, dt);
        }
        forste.current = false;
    });
    return (
        <>
            {/* Banken: en tung blokk med søyler. */}
            <mesh position={[0, 3.2, 0]}>
                <boxGeometry args={[10, 6.4, 6]} />
                <meshStandardMaterial color="#94a3b8" flatShading />
            </mesh>
            <mesh position={[0, 7, 0]}>
                <boxGeometry args={[11, 1.2, 7]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </mesh>
            {[-4.2, 4.2].map((x) => (
                <mesh key={x} position={[x, 3.2, 3.2]}>
                    <cylinderGeometry args={[0.45, 0.45, 6.4, 10]} />
                    <meshStandardMaterial color="#e2e8f0" flatShading />
                </mesh>
            ))}
            {/* Innsiden bak døra: mørk, med gull. */}
            <mesh position={[0, 2.6, 3.0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[2.2, 2.2, 0.1, 32]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            {[-0.9, 0, 0.9].map((x, i) => (
                <mesh key={x} position={[x, 1.2 + (i === 1 ? 0.3 : 0), 2.9]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.8 + (i === 1 ? 0.6 : 0), 14]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#a16207"
                        emissiveIntensity={0.5}
                    />
                </mesh>
            ))}
            {/* Døra, hengslet på venstre side. */}
            <group ref={dor} position={[-2.2, 2.6, 3.15]}>
                <mesh position={[2.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[2.25, 2.25, 0.5, 32]} />
                    <meshStandardMaterial
                        color="#cbd5e1"
                        metalness={0.5}
                        roughness={0.35}
                        flatShading
                    />
                </mesh>
                <mesh position={[2.2, 0, 0.3]}>
                    <torusGeometry args={[0.8, 0.14, 8, 24]} />
                    <meshStandardMaterial
                        ref={hjul}
                        color="#22c55e"
                        emissive="#22c55e"
                        emissiveIntensity={0.1}
                    />
                </mesh>
                {[0, 1, 2].map((k) => (
                    <mesh key={k} position={[2.2, 0, 0.3]} rotation={[0, 0, (k * Math.PI) / 3]}>
                        <boxGeometry args={[1.6, 0.14, 0.14]} />
                        <meshStandardMaterial color="#22c55e" />
                    </mesh>
                ))}
            </group>
            {/* Kunden som åpner, og svindleren som får pengene. */}
            {beat >= 3 && <Figur pos={[KUNDE.x, 0, KUNDE.z]} farge="#2563eb" />}
            {beat >= 3 && <Figur pos={[SVINDLER.x, 0, SVINDLER.z]} farge="#7f1d1d" />}
            <Strom
                punkter={[v(0.5, 1.6, 3.4), v(SVINDLER.x - 0.8, 1.3, SVINDLER.z)]}
                antall={7}
                aktiv={beat >= 3}
                playing={playing}
                fart={0.22}
            />
            {PANELER.map((_, i) => (
                <Panel key={i} i={i} beat={beat} playing={playing} />
            ))}
            {/* Trådene: følelsene som styrer kunden. */}
            {beat >= 4 &&
                PANELER.map((p, i) => (
                    <Line
                        key={i}
                        points={[
                            [p.pos.x, p.pos.y - 1, p.pos.z],
                            [KUNDE.x, 2.6, KUNDE.z],
                        ]}
                        color="#fde68a"
                        lineWidth={3}
                    />
                ))}
        </>
    );
}

function kameraHvelv(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(13 - t * 0.15, 7, 20), se: v(0, 3, 0) };
        case 1:
            return { pos: v(8, 8, 24), se: v(0, 5.5, 0) };
        case 2:
            return { pos: v(2.5, 3.2, 10.5), se: v(0, 2.6, 3) };
        case 3:
            return { pos: v(10, 7, 22), se: v(4, 3.6, 3) };
        default:
            return { pos: v(4, 9, 31), se: v(3, 6, 2) };
    }
}

/* ---------- muldyr ---------- */

const KRIM = v(-11, 0, -2);
const JONAS = v(0, 0, 1);
const VIDERE = v(11, 0, -3);

function Roeyk({ beat, playing, sted }: { beat: number; playing: boolean; sted: THREE.Vector3 }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const g = ref.current;
        if (!g) return;
        const mål = beat >= 3 ? 1 : 0;
        const s = forste.current ? mål : damp(g.scale.x, mål, 2.5, dt);
        forste.current = false;
        g.scale.setScalar(Math.max(s, 0.0001));
        g.visible = s > 0.02;
        g.rotation.y = tid.current * 0.1;
    });
    const skyer = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => ({
                x: Math.cos(i * 2.4) * (2 + (i % 4)),
                y: 1 + (i % 3) * 1.4,
                z: Math.sin(i * 2.4) * (2 + (i % 4)),
                r: 1.6 + (i % 3) * 0.5,
            })),
        []
    );
    return (
        <group ref={ref} position={[sted.x, 0, sted.z]}>
            {skyer.map((s, i) => (
                <mesh key={i} position={[s.x, s.y, s.z]}>
                    <sphereGeometry args={[s.r, 10, 8]} />
                    <meshStandardMaterial color="#64748b" transparent opacity={0.85} flatShading />
                </mesh>
            ))}
        </group>
    );
}

/** Lyskjegla fra politiet som leter, men ikke finner fram til kilden. */
function Soek({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        if (ref.current) ref.current.rotation.z = Math.sin(tid.current * 0.8) * 0.35 - 0.15;
    });
    if (beat < 3) return null;
    return (
        <group position={[4, 14, 10]}>
            <group ref={ref}>
                <mesh position={[0, -7, 0]}>
                    <coneGeometry args={[3.2, 14, 24, 1, true]} />
                    <meshBasicMaterial
                        color="#93c5fd"
                        transparent
                        opacity={0.22}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            </group>
        </group>
    );
}

function Skilt({
    tekst,
    pos,
    farge,
    vis,
}: {
    tekst: string[];
    pos: [number, number, number];
    farge: string;
    vis: boolean;
}) {
    const tekstur = useTekstur(tekst, farge, '#ffffff');
    if (!vis) return null;
    return (
        <mesh position={pos}>
            <planeGeometry args={[5.6, 2.8]} />
            <meshBasicMaterial map={tekstur} />
        </mesh>
    );
}

function Muldyr({ beat, playing }: { beat: number; playing: boolean }) {
    const rod = beat >= 2;
    return (
        <>
            <Hus pos={[KRIM.x, 0, KRIM.z]} farge={rod ? '#991b1b' : '#64748b'} tak="#1f2937" />
            <Hus pos={[JONAS.x, 0, JONAS.z]} farge="#2563eb" tak="#1e3a8a" />
            <Hus pos={[VIDERE.x, 0, VIDERE.z]} farge={rod ? '#7f1d1d' : '#64748b'} tak="#1f2937" />
            <Skilt tekst={['Jonas']} pos={[JONAS.x, 5.6, JONAS.z]} farge="#1d4ed8" vis />
            <Skilt
                tekst={['Penger fra', 'svindel']}
                pos={[KRIM.x, beat >= 3 ? 8.4 : 5.8, KRIM.z + (beat >= 3 ? 3 : 0)]}
                farge="#b91c1c"
                vis={beat >= 2}
            />
            <Skilt
                tekst={['Videre']}
                pos={[VIDERE.x, beat >= 3 ? 8.4 : 5.8, VIDERE.z + (beat >= 3 ? 3 : 0)]}
                farge="#475569"
                vis={beat >= 1}
            />
            <Strom
                punkter={[
                    v(KRIM.x + 1.6, 1.5, KRIM.z + 1),
                    v(JONAS.x, 1.5, JONAS.z + 1.8),
                    v(VIDERE.x - 1.6, 1.5, VIDERE.z + 1),
                ]}
                antall={10}
                aktiv={beat >= 1}
                playing={playing}
            />
            {/* Betalingen som blir igjen hos Jonas. */}
            {beat >= 1 && (
                <mesh position={[JONAS.x + 2.2, 0.35, JONAS.z + 2]}>
                    <cylinderGeometry args={[0.42, 0.42, 0.7, 16]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#a16207"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            )}
            <Roeyk beat={beat} playing={playing} sted={KRIM} />
            <Roeyk beat={beat} playing={playing} sted={VIDERE} />
            <Soek beat={beat} playing={playing} />
        </>
    );
}

function kameraMuldyr(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(6 - t * 0.1, 6, 18), se: v(0, 3.4, 0) };
        case 1:
            return { pos: v(0, 11, 26), se: v(0, 1.5, -1) };
        case 2:
            return { pos: v(-3, 10, 25), se: v(-2, 2, -1) };
        default:
            return { pos: v(2, 15, 28), se: v(0, 1, -1) };
    }
}

/* ---------- kjede ---------- */

const KJEDE = [
    v(-16, 0, -1),
    v(-9.5, 0, -5),
    v(-3, 0, -1),
    v(3.5, 0, -5),
    v(10, 0, -1),
    v(16.5, 0, -5),
];

function Kjede({ playing }: { playing: boolean }) {
    return (
        <>
            {KJEDE.map((p, i) => (
                <Hus
                    key={i}
                    pos={[p.x, 0, p.z]}
                    farge={i === 0 ? '#991b1b' : i === KJEDE.length - 1 ? '#e2e8f0' : '#2563eb'}
                    tak={i === 0 ? '#450a0a' : '#1e3a8a'}
                    skala={0.8}
                />
            ))}
            <Strom
                punkter={KJEDE.map((p) => v(p.x, 1.4, p.z + 1.6))}
                antall={16}
                aktiv
                vask
                playing={playing}
                fart={0.06}
            />
            <>
                <Skilt
                    tekst={['Fra', 'kriminalitet']}
                    pos={[KJEDE[0].x, 5.6, KJEDE[0].z]}
                    farge="#b91c1c"
                    vis
                />
                <Skilt
                    tekst={['Ser lovlige', 'ut']}
                    pos={[KJEDE[5].x, 5.6, KJEDE[5].z]}
                    farge="#475569"
                    vis
                />
            </>
        </>
    );
}

function kameraKjede(beat: number, t: number) {
    if (beat === 0) return { pos: v(-1 + t * 0.1, 15, 32), se: v(0, 1.5, -3) };
    return { pos: v(0, 17, 25), se: v(0, -3.5, -3) };
}

/** Kortene i kjede-modusen, som DOM nederst i bildet. */
function KjedeKort({ beat }: { beat: number }) {
    const kort = [
        { fra: 1, til: 1, tittel: 'Straffeloven', tekst: 'Bot eller fengsel' },
        { fra: 2, til: 9, tittel: 'Visste ikke sikkert?', tekst: 'Du kan straffes' },
        { fra: 3, til: 9, tittel: 'Burde ha skjønt det?', tekst: 'Du kan også straffes' },
    ];
    return (
        <div className="absolute inset-x-0 flex justify-center gap-6" style={{ bottom: '7%' }}>
            <AnimatePresence>
                {kort
                    .filter((k) => beat >= k.fra && beat <= k.til)
                    .map((k) => (
                        <motion.div
                            key={k.tittel}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="rounded-2xl bg-white/95 px-6 py-4 text-center shadow-2xl"
                            style={{ minWidth: 320, borderTop: '8px solid #dc2626' }}
                        >
                            <div className="text-3xl font-black text-slate-900">{k.tittel}</div>
                            <div className="mt-1 text-2xl font-bold text-red-700">{k.tekst}</div>
                        </motion.div>
                    ))}
            </AnimatePresence>
        </div>
    );
}

/* ---------- vekt ---------- */

const ARM = 5.5;
const TOPP = 6.5;
const HENG = 2.4;
const KLOSSER = [
    { fra: 1, linjer: ['Bot, samfunnsstraff', 'eller fengsel'], farge: '#7f1d1d', b: 5.4 },
    { fra: 2, linjer: ['Stengt', 'bankkonto'], farge: '#1e3a8a', b: 4.6 },
    { fra: 3, linjer: ['Noen blir', 'truet'], farge: '#0f172a', b: 4.2 },
];
const VINKEL = [0.22, -0.12, -0.24, -0.32, -0.32];

function Klosse({
    i,
    beat,
    playing,
    skaal,
}: {
    i: number;
    beat: number;
    playing: boolean;
    skaal: RefObject<THREE.Group | null>;
}) {
    const k = KLOSSER[i];
    const tekstur = useTekstur(k.linjer, k.farge, '#ffffff', 640, 220);
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = ref.current;
        const s = skaal.current;
        if (!g || !s) return;
        const mål = beat >= k.fra ? 0 : 8;
        const y = forste.current ? mål : damp(g.userData.løft ?? mål, mål, 3, dt);
        forste.current = false;
        g.userData.løft = y;
        g.position.set(s.position.x, s.position.y + 0.85 + i * 1.6 + y, s.position.z);
        g.visible = beat >= k.fra || y < 7.9;
    });
    return (
        <group ref={ref}>
            <mesh>
                <boxGeometry args={[k.b, 1.55, 2]} />
                <meshStandardMaterial attach="material-0" color={k.farge} flatShading />
                <meshStandardMaterial attach="material-1" color={k.farge} flatShading />
                <meshStandardMaterial attach="material-2" color={k.farge} flatShading />
                <meshStandardMaterial attach="material-3" color={k.farge} flatShading />
                <meshStandardMaterial
                    attach="material-4"
                    map={tekstur}
                    emissive="#ffffff"
                    emissiveMap={tekstur}
                    emissiveIntensity={0.3}
                />
                <meshStandardMaterial attach="material-5" color={k.farge} flatShading />
            </mesh>
        </group>
    );
}

/** En skål med snor opp til bommen. Den venstre har myntene og skiltet. */
function Skaal({ medMynter = false, skilt }: { medMynter?: boolean; skilt?: THREE.Texture }) {
    return (
        <>
            <mesh position={[0, HENG / 2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, HENG, 6]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            <mesh>
                <cylinderGeometry args={[2.4, 2, 0.3, 28]} />
                <meshStandardMaterial
                    color="#cbd5e1"
                    metalness={0.5}
                    roughness={0.35}
                    flatShading
                />
            </mesh>
            {medMynter && (
                <>
                    {[0, 1, 2, 3].map((k) => (
                        <mesh key={k} position={[0, 0.25 + k * 0.16, 0]}>
                            <cylinderGeometry args={[0.6, 0.6, 0.14, 18]} />
                            <meshStandardMaterial
                                color="#facc15"
                                emissive="#a16207"
                                emissiveIntensity={0.4}
                            />
                        </mesh>
                    ))}
                    <mesh position={[0, 1.7, 0.4]}>
                        <planeGeometry args={[2.2, 1]} />
                        <meshBasicMaterial map={skilt} />
                    </mesh>
                </>
            )}
        </>
    );
}

function Vekt({ beat, playing }: { beat: number; playing: boolean }) {
    const bom = useRef<THREE.Group>(null);
    const venstre = useRef<THREE.Group>(null);
    const hoyre = useRef<THREE.Group>(null);
    const vinkel = useRef(0);
    const forste = useRef(true);
    const skilt = useTekstur(['500 kr'], '#facc15', '#0f172a', 400, 180);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = VINKEL[Math.min(beat, VINKEL.length - 1)];
        vinkel.current = forste.current ? mål : damp(vinkel.current, mål, 2.2, dt);
        forste.current = false;
        const a = vinkel.current;
        if (bom.current) bom.current.rotation.z = a;
        // Skålene henger rett ned fra endene av bommen.
        if (venstre.current)
            venstre.current.position.set(-ARM * Math.cos(a), TOPP - ARM * Math.sin(a) - HENG, 0);
        if (hoyre.current)
            hoyre.current.position.set(ARM * Math.cos(a), TOPP + ARM * Math.sin(a) - HENG, 0);
    });
    return (
        <>
            <mesh position={[0, TOPP / 2, 0]}>
                <cylinderGeometry args={[0.3, 0.5, TOPP, 12]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.4} flatShading />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[2, 2.4, 0.4, 24]} />
                <meshStandardMaterial color="#94a3b8" flatShading />
            </mesh>
            <group ref={bom} position={[0, TOPP, 0]}>
                <mesh>
                    <boxGeometry args={[ARM * 2 + 0.4, 0.3, 0.3]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.4} flatShading />
                </mesh>
            </group>
            <group ref={venstre}>
                <Skaal medMynter skilt={skilt} />
            </group>
            <group ref={hoyre}>
                <Skaal />
            </group>
            {KLOSSER.map((_, i) => (
                <Klosse key={i} i={i} beat={beat} playing={playing} skaal={hoyre} />
            ))}
        </>
    );
}

function kameraVekt(beat: number, t: number) {
    if (beat === 0) return { pos: v(-3 - t * 0.1, 6, 17), se: v(-2, 4.2, 0) };
    if (beat >= 4) return { pos: v(1.5, 8.5, 18), se: v(1, 5, 0) };
    if (beat === 3) return { pos: v(4.5, 8.5, 17), se: v(3.5, 5.6, 0) };
    return { pos: v(4.5, 7.5, 15), se: v(3.5, 5, 0) };
}

/* ---------- scenen ---------- */

const KAMERA = { hvelv: kameraHvelv, muldyr: kameraMuldyr, kjede: kameraKjede, vekt: kameraVekt };

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera(KAMERA[modus], beat, playing);
    return (
        <>
            <color attach="background" args={['#1e293b']} />
            <fog attach="fog" args={['#1e293b', 30, 80]} />
            <ambientLight intensity={0.7} />
            <hemisphereLight args={['#e0e7ff', '#334155', 0.7]} />
            <directionalLight position={[-8, 16, 12]} intensity={1.4} />
            <pointLight position={[0, 10, 8]} intensity={30} distance={40} color="#fde68a" />
            <Bakke />
            {modus === 'hvelv' && <Hvelv beat={beat} playing={playing} />}
            {modus === 'muldyr' && <Muldyr beat={beat} playing={playing} />}
            {modus === 'kjede' && <Kjede playing={playing} />}
            {modus === 'vekt' && <Vekt beat={beat} playing={playing} />}
        </>
    );
}

export function SvindelByen({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'hvelv';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [10, 8, 22] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div
                className="pointer-events-none absolute inset-x-0 flex justify-center"
                style={{ top: '5%' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45 }}
                        className="rounded-2xl bg-slate-950/75 px-6 py-2 text-4xl font-black text-white"
                    >
                        {overskrift}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'kjede' && <KjedeKort beat={beat} />}
        </div>
    );
}
