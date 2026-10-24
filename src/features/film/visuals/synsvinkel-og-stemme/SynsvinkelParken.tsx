import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Den samme lille scenen i en park, sett gjennom tre linser. Anna sitter på benken med
 * ansiktet i hendene, Jonas kommer rundt hjørnet, stopper og går forbi.
 * «apning»: scenen uten forteller. «jeg»: kameraet sitter i hodet til Jonas, og bare
 * tankene hans vises. «flue»: kameraet sitter oppe i lyktestolpen og ser bare det som
 * skjer utenpå. «gud»: kameraet svever høyt over, og tankene til begge vises.
 */

type Modus = 'apning' | 'jeg' | 'flue' | 'gud';

const FOV = 42;
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const STI_Z = 1.6;
const ANNA = v(0, 0, 0);
const HJORNE_X = -14;
/** Jonas stopper her: omtrent to meter fra Anna. */
const STOPP_X = -1.2;
const FART = 2.4;

/** Hvor Jonas skal stå i hver beat. */
function jonasMal(modus: Modus, beat: number, t: number): number {
    if (modus === 'apning') {
        if (beat <= 1) return -12;
        if (beat === 2) return -6;
        if (beat === 3) return t < 4 ? STOPP_X : 9;
        return 12;
    }
    if (modus === 'jeg') {
        if (beat === 0) return -6.5;
        if (beat === 1) return -3.2;
        return 4;
    }
    if (modus === 'flue') {
        if (beat === 0) return -9;
        if (beat === 1) return -5.5;
        if (beat === 2) return STOPP_X;
        return 12;
    }
    if (beat === 0) return -12.5;
    if (beat === 1) return -8;
    if (beat === 2) return STOPP_X;
    return 5;
}

function kameraFor(modus: Modus, beat: number, t: number, jx: number) {
    if (modus === 'apning') {
        if (beat === 0) return { pos: v(7 - Math.min(t, 8) * 0.2, 2.6, 9), se: v(0, 0.9, 0) };
        if (beat === 1) return { pos: v(2.4, 1.5, 4.2), se: v(0, 0.95, 0) };
        if (beat === 2) return { pos: v(-4, 2.4, 9), se: v(-9, 1.1, STI_Z) };
        if (beat === 3) return { pos: v(1, 3.2, 10.5), se: v(-0.5, 0.9, 1) };
        return { pos: v(0, 8 + Math.min(t, 8) * 0.4, 15), se: v(0, 0.4, 0) };
    }
    if (modus === 'jeg') {
        const oye = v(jx, 1.62, STI_Z);
        if (beat <= 1) return { pos: oye, se: v(0, 0.85, 0) };
        if (beat === 2) return { pos: oye, se: v(jx + 2.5, 0.1, STI_Z - 0.6) };
        if (beat === 3) return { pos: v(jx - 3, 2.3, STI_Z + 1.8), se: v(jx + 4, 1.2, STI_Z) };
        return { pos: v(jx - 3.4, 2.6, STI_Z + 3.4), se: v(jx, 1.2, STI_Z) };
    }
    if (modus === 'flue') {
        return { pos: v(5.2 - Math.min(t, 6) * 0.03, 5.2, 3.4), se: v(-2.4, 0.6, 0.8) };
    }
    return { pos: v(-4 + Math.min(t, 8) * 0.1, 13, 10), se: v(-4, 0, 0) };
}

const M = {
    gress: { color: '#4d8b3a', emissive: '#1f3d17', emissiveIntensity: 0.45 },
    sti: { color: '#d6c29a', emissive: '#5e4f33', emissiveIntensity: 0.4 },
    tre: { color: '#6b4a2f' },
    lov: { color: '#3f7a35', emissive: '#16331a', emissiveIntensity: 0.4 },
    hus: { color: '#c7b8a3', emissive: '#4a4034', emissiveIntensity: 0.35 },
    benk: { color: '#8a5a33', emissive: '#2e1a0b', emissiveIntensity: 0.4 },
    jern: { color: '#334155' },
    hud: { color: '#e8b996' },
};

function Parken() {
    const traer: [number, number, number][] = [
        [-9, -7, 1.2],
        [-4, -9, 1.5],
        [3, -7.5, 1.3],
        [8, -9, 1.6],
        [12, -6, 1.2],
        [-3, 13, 1.1],
    ];
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[80, 60]} />
                <meshStandardMaterial {...M.gress} />
            </mesh>
            {/* Stien Jonas går på */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, 0.02, STI_Z]}>
                <planeGeometry args={[40, 1.8]} />
                <meshStandardMaterial {...M.sti} />
            </mesh>
            {/* Hjørnet Jonas kommer rundt */}
            <mesh position={[HJORNE_X - 3, 2.6, -1.6]}>
                <boxGeometry args={[6, 5.2, 4.4]} />
                <meshStandardMaterial {...M.hus} />
            </mesh>
            <mesh position={[HJORNE_X - 3, 5.5, -1.6]}>
                <boxGeometry args={[6.4, 0.6, 4.8]} />
                <meshStandardMaterial color="#8b3a2f" emissive="#3a120c" emissiveIntensity={0.4} />
            </mesh>
            {/* Benken */}
            <mesh position={[0, 0.48, -0.1]}>
                <boxGeometry args={[2.6, 0.12, 0.7]} />
                <meshStandardMaterial {...M.benk} />
            </mesh>
            <mesh position={[0, 0.95, -0.48]} rotation={[-0.15, 0, 0]}>
                <boxGeometry args={[2.6, 0.5, 0.08]} />
                <meshStandardMaterial {...M.benk} />
            </mesh>
            {[-1.1, 1.1].map((x) => (
                <mesh key={x} position={[x, 0.24, -0.1]}>
                    <boxGeometry args={[0.1, 0.48, 0.6]} />
                    <meshStandardMaterial {...M.jern} />
                </mesh>
            ))}
            {/* Lyktestolpen, der fluen sitter */}
            <mesh position={[3.6, 2.4, -0.8]}>
                <cylinderGeometry args={[0.07, 0.1, 4.8, 8]} />
                <meshStandardMaterial {...M.jern} />
            </mesh>
            <mesh position={[3.6, 4.95, -0.8]}>
                <boxGeometry args={[0.45, 0.4, 0.45]} />
                <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.6} />
            </mesh>
            {traer.map(([x, z, s], i) => (
                <group key={i} position={[x, 0, z]} scale={s}>
                    <mesh position={[0, 1, 0]}>
                        <cylinderGeometry args={[0.15, 0.22, 2, 8]} />
                        <meshStandardMaterial {...M.tre} />
                    </mesh>
                    <mesh position={[0, 2.6, 0]}>
                        <icosahedronGeometry args={[1.3, 0]} />
                        <meshStandardMaterial {...M.lov} flatShading />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Anna på benken, bøyd framover med ansiktet i hendene. Skuldrene rister svakt. */
function Anna({ playing }: { playing: boolean }) {
    const overkropp = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, delta) => {
        tid.current += playing ? Math.min(delta, 0.05) : 0;
        if (overkropp.current)
            overkropp.current.position.y = 0.55 + Math.sin(tid.current * 9) * 0.012;
    });
    const genser = '#be185d';
    return (
        <group position={[ANNA.x, 0, ANNA.z]}>
            {/* Lår og legger */}
            {[-0.13, 0.13].map((x) => (
                <group key={x}>
                    <mesh position={[x, 0.6, 0.15]}>
                        <boxGeometry args={[0.16, 0.14, 0.5]} />
                        <meshStandardMaterial color="#1e3a8a" />
                    </mesh>
                    <mesh position={[x, 0.3, 0.38]}>
                        <boxGeometry args={[0.14, 0.6, 0.14]} />
                        <meshStandardMaterial color="#1e3a8a" />
                    </mesh>
                </group>
            ))}
            <group ref={overkropp} position={[0, 0.55, 0]}>
                <group rotation={[0.55, 0, 0]}>
                    <mesh position={[0, 0.32, 0]}>
                        <boxGeometry args={[0.42, 0.62, 0.24]} />
                        <meshStandardMaterial color={genser} />
                    </mesh>
                    <mesh position={[0, 0.76, 0.06]}>
                        <sphereGeometry args={[0.15, 16, 12]} />
                        <meshStandardMaterial {...M.hud} />
                    </mesh>
                    <mesh position={[0, 0.82, -0.02]}>
                        <sphereGeometry args={[0.165, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
                        <meshStandardMaterial color="#5b3416" />
                    </mesh>
                    {/* Armene opp mot ansiktet */}
                    {[-0.2, 0.2].map((x) => (
                        <mesh key={x} position={[x * 0.8, 0.45, 0.2]} rotation={[-1.1, 0, 0]}>
                            <boxGeometry args={[0.1, 0.5, 0.1]} />
                            <meshStandardMaterial color={genser} />
                        </mesh>
                    ))}
                </group>
            </group>
        </group>
    );
}

/** Jonas med skolesekk. Beina svinger når han går, og han snur seg mot Anna når han står. */
function Jonas({
    gruppe,
    bein,
    synlig,
}: {
    gruppe: React.RefObject<THREE.Group | null>;
    bein: React.RefObject<(THREE.Group | null)[]>;
    synlig: boolean;
}) {
    const jakke = '#4338ca';
    return (
        <group ref={gruppe} visible={synlig}>
            {[-0.12, 0.12].map((z, i) => (
                <group
                    key={z}
                    position={[0, 0.9, z]}
                    ref={(g) => {
                        bein.current[i] = g;
                    }}
                >
                    <mesh position={[0, -0.45, 0]}>
                        <boxGeometry args={[0.16, 0.9, 0.16]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                </group>
            ))}
            <mesh position={[0, 1.22, 0]}>
                <boxGeometry args={[0.26, 0.66, 0.46]} />
                <meshStandardMaterial color={jakke} />
            </mesh>
            {/* Skolesekken */}
            <mesh position={[-0.22, 1.25, 0]}>
                <boxGeometry args={[0.2, 0.46, 0.36]} />
                <meshStandardMaterial color="#ea580c" />
            </mesh>
            {[-0.28, 0.28].map((z) => (
                <mesh key={z} position={[0, 1.18, z]}>
                    <boxGeometry args={[0.1, 0.56, 0.1]} />
                    <meshStandardMaterial color={jakke} />
                </mesh>
            ))}
            <mesh position={[0, 1.68, 0]}>
                <sphereGeometry args={[0.15, 16, 12]} />
                <meshStandardMaterial {...M.hud} />
            </mesh>
            <mesh position={[-0.02, 1.74, 0]}>
                <sphereGeometry args={[0.16, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#1c1917" />
            </mesh>
        </group>
    );
}

/** Svake lys over hodene: i gud-linsen ser vi inn i begge. */
function Tankelys({ jonas, beat }: { jonas: React.RefObject<THREE.Group | null>; beat: number }) {
    const jLys = useRef<THREE.Mesh>(null);
    useFrame(() => {
        if (jLys.current && jonas.current) {
            jLys.current.position.set(jonas.current.position.x, 2.5, STI_Z);
            jLys.current.visible = beat >= 2;
        }
    });
    return (
        <>
            <mesh position={[0, 2.05, 0.2]} visible={beat >= 1}>
                <sphereGeometry args={[0.4, 16, 12]} />
                <meshStandardMaterial color="#fda4af" emissive="#e11d48" emissiveIntensity={1} />
            </mesh>
            <mesh ref={jLys}>
                <sphereGeometry args={[0.4, 16, 12]} />
                <meshStandardMaterial color="#a5b4fc" emissive="#4f46e5" emissiveIntensity={1} />
            </mesh>
        </>
    );
}

/** Målebånd mellom Jonas og Anna i flue-linsen. */
function Avstand({ synlig }: { synlig: boolean }) {
    const a = v(STOPP_X, 0.08, STI_Z);
    const b = v(0, 0.08, 0.2);
    const midt = a.clone().add(b).multiplyScalar(0.5);
    const lengde = a.distanceTo(b);
    const vinkel = Math.atan2(b.x - a.x, b.z - a.z);
    return (
        <mesh position={midt} rotation={[0, vinkel, 0]} visible={synlig}>
            <boxGeometry args={[0.08, 0.04, lengde]} />
            <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.9} />
        </mesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const jonas = useRef<THREE.Group>(null);
    const bein = useRef<(THREE.Group | null)[]>([]);
    const se = useRef(new THREE.Vector3());
    const jx = useRef(0);
    const steg = useRef(0);
    const retning = useRef(0);
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
        const mal = jonasMal(modus, beat, beatTid.current);
        if (forste.current) jx.current = mal;
        const igjen = mal - jx.current;
        const flytt = Math.sign(igjen) * Math.min(Math.abs(igjen), FART * dt);
        jx.current += flytt;
        const gar = Math.abs(igjen) > 0.02;
        if (gar) steg.current += dt * 7;

        const g = jonas.current;
        if (g) {
            g.position.set(jx.current, 0, STI_Z);
            // Går han, ser han framover. Står han nær benken, snur han seg mot Anna.
            const nar = Math.abs(jx.current) < 4;
            const mot = !gar && nar ? Math.atan2(STI_Z - ANNA.z, ANNA.x - jx.current) : 0;
            retning.current = forste.current ? mot : THREE.MathUtils.lerp(retning.current, mot, 1 - Math.exp(-5 * dt));
            g.rotation.y = retning.current;
            bein.current.forEach((b, i) => {
                if (b) b.rotation.z = gar ? Math.sin(steg.current + i * Math.PI) * 0.5 : 0;
            });
        }

        const k = kameraFor(modus, beat, beatTid.current, jx.current);
        if (forste.current) {
            camera.position.copy(k.pos);
            se.current.copy(k.se);
            forste.current = false;
        } else if (modus === 'jeg' && beat <= 2) {
            // Inne i hodet følger kameraet øynene hans direkte.
            camera.position.copy(k.pos);
            se.current.lerp(k.se, 1 - Math.exp(-1.6 * dt));
        } else {
            const f = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(k.pos, f);
            se.current.lerp(k.se, f);
        }
        camera.lookAt(se.current);
    });

    return (
        <>
            <Parken />
            <Anna playing={playing} />
            <Jonas gruppe={jonas} bein={bein} synlig={!(modus === 'jeg' && beat <= 2)} />
            {modus === 'gud' && <Tankelys jonas={jonas} beat={beat} />}
            <Avstand synlig={modus === 'flue' && beat === 2} />
        </>
    );
}

type Tone = 'jeg' | 'flue' | 'gud' | 'anna' | 'gra' | 'gull' | 'lys';
interface Merke {
    fraBeat: number;
    tilBeat?: number;
    tekst: string;
    side: 'v' | 'h';
    rad: number;
    tone: Tone;
}

const MERKER: Record<Modus, Merke[]> = {
    apning: [
        { fraBeat: 0, tilBeat: 1, tekst: 'Anna', side: 'v', rad: 0, tone: 'anna' },
        { fraBeat: 2, tilBeat: 3, tekst: 'Jonas', side: 'v', rad: 0, tone: 'jeg' },
        { fraBeat: 4, tekst: 'Hva skjedde egentlig?', side: 'v', rad: 0, tone: 'gull' },
    ],
    jeg: [
        { fraBeat: 0, tilBeat: 2, tekst: 'Inne i hodet til Jonas', side: 'v', rad: 0, tone: 'lys' },
        { fraBeat: 1, tilBeat: 2, tekst: 'Skulle jeg gå bort?', side: 'v', rad: 1, tone: 'jeg' },
        { fraBeat: 1, tilBeat: 2, tekst: 'Hjertet hamrer', side: 'v', rad: 2, tone: 'jeg' },
        { fraBeat: 2, tilBeat: 2, tekst: 'Hva om hun ikke vil ha meg der?', side: 'v', rad: 3, tone: 'jeg' },
        { fraBeat: 1, tilBeat: 1, tekst: 'Anna: ?', side: 'h', rad: 1, tone: 'gra' },
        { fraBeat: 3, tekst: 'Personal synsvinkel', side: 'v', rad: 0, tone: 'gull' },
        { fraBeat: 3, tekst: 'Én persons øyne', side: 'v', rad: 1, tone: 'jeg' },
        { fraBeat: 4, tekst: 'Jeg-forteller', side: 'v', rad: 2, tone: 'jeg' },
    ],
    flue: [
        { fraBeat: 0, tilBeat: 3, tekst: 'Fluen ser bare utsiden', side: 'v', rad: 0, tone: 'lys' },
        { fraBeat: 1, tilBeat: 3, tekst: 'Skuldrene rister', side: 'v', rad: 1, tone: 'flue' },
        { fraBeat: 2, tilBeat: 3, tekst: 'Stopper ca. 2 meter unna', side: 'v', rad: 2, tone: 'flue' },
        { fraBeat: 2, tilBeat: 3, tekst: 'Strammer grepet om sekken', side: 'v', rad: 3, tone: 'flue' },
        { fraBeat: 3, tilBeat: 3, tekst: 'Går raskt videre', side: 'v', rad: 4, tone: 'flue' },
        { fraBeat: 4, tekst: 'Autoral synsvinkel', side: 'v', rad: 0, tone: 'gull' },
        { fraBeat: 4, tekst: 'Det vi ser og hører', side: 'v', rad: 1, tone: 'flue' },
        { fraBeat: 4, tekst: 'Tanker: ingen', side: 'v', rad: 2, tone: 'gra' },
    ],
    gud: [
        { fraBeat: 0, tekst: 'Fortelleren ser alt', side: 'v', rad: 0, tone: 'lys' },
        { fraBeat: 1, tekst: 'Anna tror hun er alene', side: 'v', rad: 1, tone: 'anna' },
        { fraBeat: 1, tekst: 'Vet ikke at Jonas er der', side: 'v', rad: 2, tone: 'anna' },
        { fraBeat: 2, tekst: 'Jonas er hemmelig forelsket', side: 'h', rad: 1, tone: 'jeg' },
        { fraBeat: 3, tekst: 'Redd for å bli avvist', side: 'h', rad: 2, tone: 'jeg' },
        { fraBeat: 4, tekst: 'Framtiden: han angrer', side: 'v', rad: 3, tone: 'gull' },
    ],
};

const MERKE_TONE: Record<Tone, string> = {
    jeg: 'bg-indigo-600/95 text-white',
    flue: 'bg-emerald-600/95 text-white',
    gud: 'bg-amber-400/95 text-slate-900',
    anna: 'bg-rose-600/95 text-white',
    gra: 'bg-slate-700/90 text-slate-100',
    gull: 'bg-amber-300/95 text-slate-900',
    lys: 'bg-white/95 text-slate-900',
};

const LINSE: Record<Modus, { tekst: string; tone: Tone } | null> = {
    apning: null,
    jeg: { tekst: 'Linse 1: Jeg', tone: 'jeg' },
    flue: { tekst: 'Linse 2: Flue på veggen', tone: 'flue' },
    gud: { tekst: 'Linse 3: Gud', tone: 'gud' },
};

export function SynsvinkelParken({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'apning';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = MERKER[modus].filter(
        (m) => beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat)
    );
    const linse = LINSE[modus];
    const himmel = '#bcd7ea';
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: FOV, position: [7, 2.6, 9] }}
            >
                <color attach="background" args={[himmel]} />
                <fog attach="fog" args={[himmel, 30, 80]} />
                <hemisphereLight args={['#f1f5f9', '#3f5f2a', 1.1]} />
                <directionalLight position={[6, 10, 8]} intensity={1.4} color="#fff7e6" />
                <directionalLight position={[-8, 6, -4]} intensity={0.4} />
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            {/* Jeg-linsen: kanten av bildet mørkner, som om vi ser ut gjennom øynene hans. */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: modus === 'jeg' && beat <= 2 ? 1 : 0 }}
                transition={{ duration: 0.8 }}
                style={{
                    background:
                        'radial-gradient(ellipse at center, rgba(30,27,75,0) 55%, rgba(30,27,75,0.55) 100%)',
                }}
            />
            {linse && (
                <div
                    className={`absolute rounded-full shadow-xl px-5 py-2 text-xl font-black ${MERKE_TONE[linse.tone]}`}
                    style={{ right: '4%', top: '5%', fontFamily: 'Outfit, Inter, sans-serif' }}
                >
                    {linse.tekst}
                </div>
            )}
            <AnimatePresence>
                {merker.map((m) => (
                    <motion.div
                        key={m.tekst}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 + m.rad * 0.35 }}
                        className={`absolute rounded-2xl shadow-xl px-4 py-2 text-2xl font-black ${MERKE_TONE[m.tone]}`}
                        style={{
                            ...(m.side === 'v' ? { left: '4%' } : { right: '4%' }),
                            top: `${5 + m.rad * 12}%`,
                            fontFamily: 'Outfit, Inter, sans-serif',
                        }}
                    >
                        {m.tekst}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
