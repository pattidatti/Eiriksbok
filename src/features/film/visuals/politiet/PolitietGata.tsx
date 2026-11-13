import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * En gate en fredag kveld. Tre venner på fortauet, en politibil med blålys og to politifolk.
 * «stopp»: bilen kommer, stopper, og politiet går bort til vennene.
 * «rettigheter»: samtalen, med det du må si og det du ikke trenger å si.
 * «ordre»: politiet gir en ordre, vennene går, og du kan klage etterpå.
 */

type Modus = 'stopp' | 'rettigheter' | 'ordre';
type V3 = [number, number, number];

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const klamp = (x: number) => Math.min(1, Math.max(0, x));

const VENNER: { x: number; z: number; farge: string }[] = [
    { x: 2.4, z: 6.3, farge: '#7c3aed' },
    { x: 3.3, z: 5.7, farge: '#ea580c' },
    { x: 4.2, z: 6.4, farge: '#0891b2' },
];
const BIL_Z = 2;
const BIL_STOPP = -3;
const DOR: V3 = [-2.6, 0, 3.4];
const BETJENT_STAR: V3[] = [
    [0.5, 0, 5.3],
    [0.9, 0, 6.8],
];

function bilX(modus: Modus, beat: number, t: number) {
    if (modus === 'stopp' && beat === 0) return -16 + Math.min(t, 8) * 1.1;
    return BIL_STOPP;
}

/** Hvor langt vennene har gått bort langs fortauet (ordre-modus). */
function gaatt(modus: Modus, beat: number, t: number) {
    if (modus !== 'ordre') return 0;
    if (beat === 0) return klamp((t - 1.2) / 4) * 6;
    return 6;
}

function betjentPos(modus: Modus, beat: number, t: number, i: number): THREE.Vector3 | null {
    const star = v(...BETJENT_STAR[i]);
    if (modus === 'stopp') {
        if (beat < 2) return null;
        if (beat === 2) {
            const dor = v(DOR[0] + i * 0.8, 0, DOR[2]);
            return dor.lerp(star, klamp((t - 0.4 - i * 0.3) / 2.6));
        }
    }
    return star;
}

function kameraFor(modus: Modus, beat: number, t: number): { pos: THREE.Vector3; se: THREE.Vector3 } {
    if (modus === 'stopp') {
        switch (beat) {
            case 0:
                return { pos: v(4 - t * 0.15, 4.2, 18), se: v(-3.5, 1, 4) };
            case 1:
                return { pos: v(-0.5, 2.8, 13), se: v(-2, 1.1, 3) };
            case 2:
                return { pos: v(8.5, 3.2, 14), se: v(0, 1.2, 4.5) };
            case 3:
                return { pos: v(8, 2.6, 10.5), se: v(0.6, 1.6, 5.6) };
            default:
                return { pos: v(5.6 + Math.min(t, 6) * 0.05, 2.1, 7.6), se: v(0.6, 1.7, 5.8) };
        }
    }
    if (modus === 'rettigheter') {
        switch (beat) {
            case 0:
            case 1:
                return { pos: v(0.5 + t * 0.08, 3.6, 15.5), se: v(4.6, 1.3, 4.5) };
            case 2:
                return { pos: v(-2, 2.4, 11), se: v(4.2, 1.6, 5.5) };
            case 3:
                return { pos: v(7.5, 2.6, 12), se: v(6.2, 1.4, 5) };
            case 4:
                return { pos: v(-3.5, 2.3, 10.5), se: v(3.4, 1.6, 5.4) };
            default:
                return { pos: v(6.5, 2.4, 12.5), se: v(5, 1.5, 5.6) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(4, 4.4, 18), se: v(4.5, 1.2, 5) };
        case 1:
            return { pos: v(-1, 3.4, 15), se: v(5, 1.3, 5) };
        case 2:
            return { pos: v(-6.5, 3.2, 11), se: v(0.5, 1.2, 2.5) };
        case 3:
            return { pos: v(-1.5, 3, 14), se: v(4.5, 1.3, 5) };
        default:
            return { pos: v(-4, 6, 15), se: v(2.5, 0.8, 4) };
    }
}

function Person({ farge, politi = false }: { farge: string; politi?: boolean }) {
    return (
        <group>
            <mesh position={[0, 0.95, 0]}>
                <capsuleGeometry args={[0.34, 0.9, 4, 10]} />
                <meshStandardMaterial color={farge} flatShading roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.86, 0]}>
                <sphereGeometry args={[0.27, 14, 12]} />
                <meshStandardMaterial color="#e8b98f" roughness={0.9} />
            </mesh>
            {politi && (
                <>
                    <mesh position={[0, 2.1, 0]}>
                        <cylinderGeometry args={[0.3, 0.3, 0.14, 16]} />
                        <meshStandardMaterial color="#111827" />
                    </mesh>
                    <mesh position={[0, 1.2, 0]}>
                        <cylinderGeometry args={[0.37, 0.37, 0.12, 16]} />
                        <meshStandardMaterial color="#d9f99d" emissive="#a3e635" emissiveIntensity={0.35} />
                    </mesh>
                </>
            )}
        </group>
    );
}

function Politibil({ blaalys }: { blaalys: boolean }) {
    const a = useRef<THREE.MeshStandardMaterial>(null);
    const b = useRef<THREE.MeshStandardMaterial>(null);
    const lys = useRef<THREE.PointLight>(null);
    const tid = useRef(0);
    useFrame((_, dt) => {
        tid.current += dt;
        const fase = Math.floor(tid.current * 5) % 2 === 0;
        const pa = blaalys ? (fase ? 6 : 0.3) : 0.1;
        const pb = blaalys ? (fase ? 0.3 : 6) : 0.1;
        if (a.current) a.current.emissiveIntensity = pa;
        if (b.current) b.current.emissiveIntensity = pb;
        if (lys.current) lys.current.intensity = blaalys ? 45 + (fase ? 25 : 0) : 0;
    });
    return (
        <group>
            <mesh position={[0, 0.75, 0]}>
                <boxGeometry args={[4.6, 0.9, 2]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
            {/* Blå og gul stripe langs siden */}
            <mesh position={[0, 0.72, 0]}>
                <boxGeometry args={[4.64, 0.22, 2.04]} />
                <meshStandardMaterial color="#1d4ed8" />
            </mesh>
            <mesh position={[0, 0.94, 0]}>
                <boxGeometry args={[4.64, 0.08, 2.04]} />
                <meshStandardMaterial color="#facc15" />
            </mesh>
            <mesh position={[-0.2, 1.55, 0]}>
                <boxGeometry args={[2.5, 0.72, 1.8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.3} />
            </mesh>
            <mesh position={[-0.2, 1.93, 0]}>
                <boxGeometry args={[2.5, 0.06, 1.8]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[-0.2, 2.05, -0.35]}>
                <boxGeometry args={[0.7, 0.3, 0.6]} />
                <meshStandardMaterial ref={a} color="#3b82f6" emissive="#2563eb" emissiveIntensity={0.1} />
            </mesh>
            <mesh position={[-0.2, 2.05, 0.35]}>
                <boxGeometry args={[0.7, 0.3, 0.6]} />
                <meshStandardMaterial ref={b} color="#3b82f6" emissive="#2563eb" emissiveIntensity={0.1} />
            </mesh>
            <pointLight ref={lys} position={[-0.2, 2.8, 0]} color="#3b82f6" distance={22} decay={1.2} intensity={0} />
            {/* Frontlys */}
            <mesh position={[2.31, 0.85, 0.65]}>
                <boxGeometry args={[0.04, 0.2, 0.4]} />
                <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[2.31, 0.85, -0.65]}>
                <boxGeometry args={[0.04, 0.2, 0.4]} />
                <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={1.5} />
            </mesh>
            {[
                [1.5, 1],
                [1.5, -1],
                [-1.5, 1],
                [-1.5, -1],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 0.36, z]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.36, 0.36, 0.25, 14]} />
                    <meshStandardMaterial color="#111827" />
                </mesh>
            ))}
        </group>
    );
}

function Hus() {
    const hus = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => ({
                x: -32 + i * 8,
                h: 6 + ((i * 37) % 5),
                farge: ['#3f3a52', '#4a3f3a', '#36465a', '#4b4458'][i % 4],
            })),
        []
    );
    return (
        <>
            {hus.map((h) => (
                <group key={h.x} position={[h.x, 0, -12]}>
                    <mesh position={[0, h.h / 2, 0]}>
                        <boxGeometry args={[7.6, h.h, 4]} />
                        <meshStandardMaterial color={h.farge} emissive="#1a1f33" emissiveIntensity={0.4} />
                    </mesh>
                    {[-2.4, 0, 2.4].flatMap((wx) =>
                        [2.4, 4.6].map((wy) => (
                            <mesh key={`${wx}-${wy}`} position={[wx, wy, 2.02]}>
                                <planeGeometry args={[1.1, 1.2]} />
                                <meshStandardMaterial
                                    color="#fde68a"
                                    emissive="#fbbf24"
                                    emissiveIntensity={(Math.abs(h.x + wx * 3 + wy) % 3) > 1 ? 0.9 : 0.05}
                                    side={THREE.DoubleSide}
                                />
                            </mesh>
                        ))
                    )}
                </group>
            ))}
        </>
    );
}

function Lykt({ x }: { x: number }) {
    return (
        <group position={[x, 0, 4.6]}>
            <mesh position={[0, 2.2, 0]}>
                <cylinderGeometry args={[0.07, 0.09, 4.4, 8]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 4.45, 0]}>
                <sphereGeometry args={[0.28, 12, 10]} />
                <meshStandardMaterial color="#fff7d6" emissive="#fde68a" emissiveIntensity={2} />
            </mesh>
            <pointLight position={[0, 4.2, 0]} color="#ffd98a" intensity={22} distance={13} decay={1.5} />
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const bil = useRef<THREE.Group>(null);
    const venner = useRef<(THREE.Group | null)[]>([]);
    const betjenter = useRef<(THREE.Group | null)[]>([]);
    const kamSe = useRef(v(0, 1, 0));
    const forste = useRef(true);
    const beatTid = useRef(0);
    const forrige = useRef(beat);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        if (bil.current) bil.current.position.set(bilX(modus, beat, t), 0, BIL_Z);

        const g = gaatt(modus, beat, t);
        venner.current.forEach((p, i) => {
            if (!p) return;
            const gaar = (modus === 'stopp' && beat === 0) || (modus === 'ordre' && beat === 0 && g > 0 && g < 6);
            const bob = gaar ? Math.abs(Math.sin(t * 6 + i)) * 0.08 : 0;
            p.position.set(VENNER[i].x + g, bob, VENNER[i].z);
        });

        betjenter.current.forEach((p, i) => {
            if (!p) return;
            const pos = betjentPos(modus, beat, t, i);
            p.visible = pos !== null;
            if (pos) p.position.copy(pos);
        });

        const mal = kameraFor(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * (dt || 0));
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
    });

    const blaalys = !(modus === 'stopp' && beat === 0);
    const betjentBoble = (modus === 'stopp' && beat === 3) || (modus === 'rettigheter' && (beat === 2 || beat === 4 || beat === 5)) || (modus === 'ordre' && beat === 0);
    const bobleTekst =
        modus === 'stopp'
            ? 'Hei, kan vi snakke litt med dere?'
            : modus === 'ordre'
              ? 'Dere må gå herfra nå.'
              : beat === 2
                ? 'Hva heter du?'
                : beat === 4
                  ? 'Her er tjenestenummeret mitt.'
                  : 'Hva skjedde her?';
    const vennBoble = modus === 'rettigheter' && (beat === 2 || beat === 5);
    const vennTekst = beat === 2 ? 'Navn, fødselsdato og adresse.' : 'Jeg vil snakke med foreldrene mine først.';

    return (
        <>
            <color attach="background" args={['#0f1a33']} />
            <fog attach="fog" args={['#1b2a4d', 26, 70]} />
            <ambientLight intensity={0.75} color="#b8c6e8" />
            <hemisphereLight args={['#4b5f8f', '#1a1a24', 0.7]} />
            <directionalLight position={[-10, 14, 12]} intensity={0.6} color="#c7d2fe" />
            {/* Vei og fortau */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[140, 60]} />
                <meshStandardMaterial color="#2b3242" roughness={0.9} />
            </mesh>
            {Array.from({ length: 14 }, (_, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-40 + i * 6, 0.01, -0.6]}>
                    <planeGeometry args={[2.6, 0.18]} />
                    <meshStandardMaterial color="#e2e8f0" emissive="#64748b" emissiveIntensity={0.3} />
                </mesh>
            ))}
            <mesh position={[0, 0.09, 6.8]}>
                <boxGeometry args={[140, 0.18, 6]} />
                <meshStandardMaterial color="#6b7280" roughness={0.95} />
            </mesh>
            <Hus />
            <Lykt x={-9} />
            <Lykt x={7} />
            <group ref={bil} position={[BIL_STOPP, 0, BIL_Z]}>
                <Politibil blaalys={blaalys} />
            </group>
            {VENNER.map((p, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        venner.current[i] = g;
                    }}
                    position={[p.x, 0, p.z]}
                >
                    <Person farge={p.farge} />
                </group>
            ))}
            {BETJENT_STAR.map((p, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        betjenter.current[i] = g;
                    }}
                    position={p}
                >
                    <Person farge="#1f2a44" politi />
                </group>
            ))}
            {betjentBoble && (
                <Html position={[BETJENT_STAR[0][0], modus === 'rettigheter' && beat === 5 ? 2.3 : 2.75, BETJENT_STAR[0][2]]} center zIndexRange={[20, 0]}>
                    <Boble tekst={bobleTekst} farge="#1e3a8a" />
                </Html>
            )}
            {vennBoble && (
                <Html position={[VENNER[1].x, beat === 5 ? 3.7 : 2.6, VENNER[1].z]} center zIndexRange={[20, 0]}>
                    <Boble tekst={vennTekst} farge="#ea580c" />
                </Html>
            )}
        </>
    );
}

function Boble({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <div className="pointer-events-none" style={{ transform: 'translateY(-60%)' }}>
            <div
                className="rounded-2xl bg-white px-4 py-2 font-bold text-2xl text-slate-900 shadow-xl text-center"
                style={{ border: `4px solid ${farge}`, maxWidth: 300, width: 'max-content' }}
            >
                {tekst}
            </div>
        </div>
    );
}

interface Punkt {
    tekst: string;
    ok?: boolean;
    nei?: boolean;
}

const PANEL: Record<Modus, { tittel: string; punkter: Punkt[] }[]> = {
    stopp: [],
    rettigheter: [
        { tittel: 'Politiet kan stoppe deg', punkter: [{ tekst: 'hvis de mistenker deg' }] },
        {
            tittel: 'Politiet kan stoppe deg',
            punkter: [
                { tekst: 'hvis de mistenker deg' },
                { tekst: 'hvis du er under 18 og de er bekymret' },
                { tekst: 'hvis det kan bli bråk og de trenger oversikt' },
            ],
        },
        {
            tittel: 'Du må si',
            punkter: [
                { tekst: 'Navn', ok: true },
                { tekst: 'Fødselsdato', ok: true },
                { tekst: 'Adresse', ok: true },
            ],
        },
        {
            tittel: 'Legitimasjon',
            punkter: [
                { tekst: 'Ingen plikt til å ha med', ok: true },
                { tekst: 'Nekter du å si navn eller sier feil navn, kan de be om å se den' },
            ],
        },
        {
            tittel: 'Politiet skal',
            punkter: [
                { tekst: 'vise tjenestenummer eller si navn', ok: true },
                { tekst: 'si hvorfor, hvis de kan', ok: true },
            ],
        },
        {
            tittel: 'Du trenger ikke',
            punkter: [
                { tekst: 'forklare deg om saken', nei: true },
                { tekst: 'Pågrepet? Rett til advokat', ok: true },
            ],
        },
    ],
    ordre: [
        { tittel: 'En ordre', punkter: [{ tekst: 'må følges der og da' }] },
        {
            tittel: 'En ordre',
            punkter: [{ tekst: 'også om du synes den er urettferdig' }, { tekst: 'Bryter du den: kan gi bot', nei: true }],
        },
        {
            tittel: 'Med til stasjonen',
            punkter: [{ tekst: 'for eksempel hvis du nekter å si navn eller lager bråk' }, { tekst: 'opptil fire timer' }],
        },
        { tittel: 'Følg ordren nå', punkter: [{ tekst: 'Klag etterpå', ok: true }] },
        { tittel: '', punkter: [] },
    ],
};

function Sidepanel({ modus, beat }: { modus: Modus; beat: number }) {
    const liste = PANEL[modus];
    const steg = liste[Math.min(beat, liste.length - 1)];
    if (!steg || !steg.tittel) return null;
    if (modus === 'ordre' && beat === 0) return null;
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${steg.tittel}-${beat}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute rounded-3xl bg-white/95 shadow-2xl p-6"
                style={{ right: 28, top: 40, width: 380 }}
            >
                <div className="font-display font-black text-3xl text-slate-900 mb-3">{steg.tittel}</div>
                {steg.punkter.map((p) => (
                    <div key={p.tekst} className="flex items-start gap-3 py-1.5">
                        <span
                            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg"
                            style={{ background: p.nei ? '#dc2626' : p.ok ? '#0d9488' : '#1e3a8a' }}
                        >
                            {p.nei ? '✕' : p.ok ? '✓' : '•'}
                        </span>
                        <span className="text-2xl font-bold text-slate-800 leading-tight">{p.tekst}</span>
                    </div>
                ))}
            </motion.div>
        </AnimatePresence>
    );
}

function Epost() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute rounded-3xl bg-white shadow-2xl overflow-hidden"
            style={{ right: 40, top: 60, width: 470 }}
        >
            <div className="bg-slate-800 text-white px-5 py-2 text-xl font-bold">Ny e-post</div>
            <div className="px-5 py-3 text-2xl text-slate-800 border-b border-slate-200">
                <span className="text-slate-500">Til: </span>politiet der du bor
            </div>
            <div className="px-5 py-3 text-2xl font-black text-slate-900 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Emne: </span>Klage på politiet
            </div>
            <div className="px-5 py-3 text-2xl text-slate-700 leading-snug">
                Når skjedde det?
                <br />
                Hvor skjedde det?
                <br />
                Så noen det?
            </div>
        </motion.div>
    );
}

function Hjerte() {
    return (
        <div className="absolute" style={{ right: 60, top: 50 }}>
            <motion.svg
                viewBox="0 0 100 90"
                width={120}
                height={108}
                animate={{ scale: [1, 1.18, 1, 1.12, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
            >
                <path d="M 50 85 C 10 55 0 35 10 18 C 20 2 42 4 50 22 C 58 4 80 2 90 18 C 100 35 90 55 50 85 Z" fill="#dc2626" />
            </motion.svg>
        </div>
    );
}

export function PolitietGata({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'stopp';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, near: 0.3, far: 200, position: [4, 4, 18] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-0 pointer-events-none">
                <Flate>
                    <Sidepanel modus={modus} beat={beat} />
                    {modus === 'ordre' && beat >= 4 && <Epost />}
                    {modus === 'stopp' && beat === 4 && <Hjerte />}
                </Flate>
            </div>
        </div>
    );
}
