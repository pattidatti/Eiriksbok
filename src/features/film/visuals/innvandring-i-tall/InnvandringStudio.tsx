import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * TV-studioet der de to politikerne krangler, bygd av enkle former.
 * «debatt»: to talerstoler, publikum og en stor skjerm. Hver politiker sier sitt tall.
 * «badekar»: et badekar midt på scenen. Vannet i karet er hvor mange som bor her,
 * strålen fra kranen er hvor mange som kommer i løpet av ett år, og avløpet er de som
 * flytter videre eller hjem.
 * «sjekk»: kameraet ser på skjermen, og de fem spørsmålene kommer opp ett for ett.
 * «losning»: politikerne og karet sammen. Den ene peker på karet, den andre på kranen.
 */

type Modus = 'debatt' | 'badekar' | 'sjekk' | 'losning';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const ORANSJE = '#ea580c';
const BLA = '#0d9488';
const VANN = '#38bdf8';

const KAR_X = 0;
const KAR_Z = 1.5;
const BEN = 0.6;
const KAR_B = 4;
const KAR_D = 2.2;
const KAR_H = 1.4;

function kameraFor(modus: Modus, beat: number, t: number) {
    const drift = t * 0.08;
    if (modus === 'debatt') {
        switch (beat) {
            case 0:
                return { pos: v(0, 5, 16 - drift * 4), se: v(0, 2.5, 0) };
            case 1:
                return { pos: v(-2.2, 3.3, 8.5), se: v(-5.5, 2.4, 0.5) };
            case 2:
                return { pos: v(2.2, 3.3, 8.5), se: v(5.5, 2.4, 0.5) };
            default:
                return { pos: v(0, 3.6, 14), se: v(0, 2.8, -1) };
        }
    }
    if (modus === 'badekar') {
        switch (beat) {
            case 0:
                return { pos: v(0, 4.4, 9.5 - drift * 2), se: v(0, 1.5, KAR_Z) };
            case 1:
                return { pos: v(1.6, 4.6, 7), se: v(0, 1.1, KAR_Z) };
            case 2:
                return { pos: v(-4.2, 3.6, 7.5), se: v(-1.8, 2, KAR_Z) };
            case 3:
                return { pos: v(0, 4.4, 9), se: v(0, 1.4, KAR_Z) };
            case 4:
                return { pos: v(-2, 3.8, 8.5), se: v(-0.5, 1.5, KAR_Z) };
            default:
                return { pos: v(4.6, 1.9, 9), se: v(1, 0.9, KAR_Z) };
        }
    }
    if (modus === 'sjekk') {
        return { pos: v(0, 4 + drift, 11), se: v(0, 3.9, -6) };
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 5.5, 17 - drift * 3), se: v(0, 2, 0) };
        case 1:
            return { pos: v(-3.2, 3.6, 11), se: v(-2.6, 2.2, 1) };
        case 2:
            return { pos: v(4, 4, 10.5), se: v(1.2, 1.8, 1) };
        default:
            return { pos: v(0, 5.5, 17), se: v(0, 2.4, -1) };
    }
}

/** En person: kropp og hode. */
function Person({ farge, hoyde = 1.7 }: { farge: string; hoyde?: number }) {
    return (
        <group>
            <mesh position={[0, hoyde * 0.35, 0]}>
                <cylinderGeometry args={[0.26, 0.32, hoyde * 0.7, 10]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, hoyde * 0.83, 0]}>
                <sphereGeometry args={[0.24, 12, 10]} />
                <meshStandardMaterial color="#e8c4a0" flatShading />
            </mesh>
        </group>
    );
}

function Talerstol({ x, farge, lys }: { x: number; farge: string; lys: number }) {
    return (
        <group position={[x, 0, 0.5]}>
            <group position={[0, 0, -0.6]}>
                <Person farge="#334155" hoyde={2.2} />
            </group>
            <mesh position={[0, 0.65, 0]}>
                <boxGeometry args={[1.6, 1.3, 0.8]} />
                <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={lys} flatShading />
            </mesh>
            <mesh position={[0, 1.34, 0]}>
                <boxGeometry args={[1.8, 0.08, 0.95]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            {/* Lyskjegle på gulvet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -0.2]}>
                <circleGeometry args={[1.6, 32]} />
                <meshBasicMaterial color="#fde68a" transparent opacity={0.18 + lys * 0.2} />
            </mesh>
        </group>
    );
}

function Publikum() {
    const plasser = useMemo(() => {
        const p: [number, number, string][] = [];
        const farger = ['#64748b', '#7c3aed', '#0ea5e9', '#a16207', '#be123c', '#15803d'];
        for (let rad = 0; rad < 2; rad++)
            for (let i = 0; i < 9; i++) p.push([-8 + i * 2 + rad, 6.2 + rad * 1.4, farger[(i + rad * 2) % farger.length]]);
        return p;
    }, []);
    return (
        <>
            {plasser.map(([x, z, f], i) => (
                <group key={i} position={[x, 0, z]}>
                    <Person farge={f} hoyde={1.25} />
                </group>
            ))}
        </>
    );
}

/** Badekaret med vann, kran, stråle og avløp. Alt glir mot målet for beaten. */
function Badekar({ niva, straale, ut, glod }: { niva: number; straale: number; ut: boolean; glod: number }) {
    const vann = useRef<THREE.Mesh>(null);
    const stråleRef = useRef<THREE.Mesh>(null);
    const utRef = useRef<THREE.Mesh>(null);
    const vannMat = useRef<THREE.MeshStandardMaterial>(null);
    const tid = useRef({ forste: true, t: 0 });

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        const k = tid.current;
        k.t += dt;
        const w = vann.current;
        const s = stråleRef.current;
        const u = utRef.current;
        if (!w || !s || !u) return;
        if (k.forste) {
            w.scale.y = niva;
            s.scale.x = s.scale.z = straale;
            u.scale.x = u.scale.z = ut ? 1 : 0.001;
            k.forste = false;
        }
        w.scale.y = damp(w.scale.y, niva, 0.9, dt);
        w.position.y = BEN + 0.12 + (w.scale.y * (KAR_H - 0.2)) / 2;
        const r = damp(s.scale.x, straale, 2, dt) * (1 + Math.sin(k.t * 14) * 0.06);
        s.scale.x = s.scale.z = r;
        const flate = BEN + 0.12 + w.scale.y * (KAR_H - 0.2);
        const topp = 2.75;
        s.scale.y = topp - flate;
        s.position.y = (topp + flate) / 2;
        s.visible = r > 0.01;
        const ur = damp(u.scale.x, ut ? 1 : 0.001, 2, dt) * (1 + Math.sin(k.t * 11) * 0.08);
        u.scale.x = u.scale.z = ur;
        u.visible = ur > 0.02;
        if (vannMat.current) vannMat.current.emissiveIntensity = damp(vannMat.current.emissiveIntensity, 0.35 + glod, 3, dt);
    });

    const indreB = KAR_B - 0.3;
    const indreD = KAR_D - 0.3;
    return (
        <group position={[KAR_X, 0, KAR_Z]}>
            {/* Ben */}
            {[
                [-1.6, -0.8],
                [1.6, -0.8],
                [-1.6, 0.8],
                [1.6, 0.8],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, BEN / 2, z]}>
                    <cylinderGeometry args={[0.12, 0.08, BEN, 8]} />
                    <meshStandardMaterial color="#d4a017" />
                </mesh>
            ))}
            {/* Bunn og vegger */}
            <mesh position={[0, BEN + 0.06, 0]}>
                <boxGeometry args={[KAR_B, 0.12, KAR_D]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={`l${s}`} position={[(s * (KAR_B - 0.15)) / 2, BEN + KAR_H / 2, 0]}>
                    <boxGeometry args={[0.15, KAR_H, KAR_D]} />
                    <meshStandardMaterial color="#f1f5f9" />
                </mesh>
            ))}
            <mesh position={[0, BEN + KAR_H / 2, -(KAR_D - 0.15) / 2]}>
                <boxGeometry args={[KAR_B, KAR_H, 0.15]} />
                <meshStandardMaterial color="#f1f5f9" />
            </mesh>
            {/* Fremveggen er lav og gjennomsiktig, så vannet synes */}
            <mesh position={[0, BEN + KAR_H / 2, (KAR_D - 0.15) / 2]}>
                <boxGeometry args={[KAR_B, KAR_H, 0.15]} />
                <meshStandardMaterial color="#e2e8f0" transparent opacity={0.35} />
            </mesh>
            <mesh ref={vann} position={[0, BEN + 0.5, 0]}>
                <boxGeometry args={[indreB, KAR_H - 0.2, indreD]} />
                <meshStandardMaterial
                    ref={vannMat}
                    color={VANN}
                    emissive="#0284c7"
                    emissiveIntensity={0.35}
                    transparent
                    opacity={0.85}
                />
            </mesh>
            {/* Kran */}
            <mesh position={[-2.3, 1.45, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 2.9, 10]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[-1.85, 2.85, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, 1, 10]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[-1.4, 2.78, 0]}>
                <cylinderGeometry args={[0.14, 0.12, 0.2, 10]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>
            <mesh ref={stråleRef} position={[-1.4, 2, 0]}>
                <cylinderGeometry args={[1, 1, 1, 10]} />
                <meshStandardMaterial color={VANN} emissive="#0ea5e9" emissiveIntensity={0.6} transparent opacity={0.85} />
            </mesh>
            {/* Avløp: vann som renner ut under karet */}
            <mesh position={[1.3, BEN / 2, 0.3]}>
                <cylinderGeometry args={[0.1, 0.1, BEN, 8]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh ref={utRef} position={[1.3, BEN / 2, 0.3]}>
                <cylinderGeometry args={[0.07, 0.07, BEN + 0.02, 8]} />
                <meshStandardMaterial color={VANN} emissive="#0ea5e9" emissiveIntensity={0.8} />
            </mesh>
            {ut && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.5, 0.03, 0.6]}>
                    <circleGeometry args={[0.9, 24]} />
                    <meshStandardMaterial color={VANN} emissive="#0284c7" emissiveIntensity={0.4} transparent opacity={0.7} />
                </mesh>
            )}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const tid = useRef({ beat: -1, t: 0, forste: true });
    const se = useRef(v(0, 2, 0));

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const k = tid.current;
        if (k.beat !== beat) {
            k.beat = beat;
            k.t = 0;
        }
        k.t += dt;
        const maal = kameraFor(modus, beat, k.t);
        if (k.forste) {
            camera.position.copy(maal.pos);
            se.current.copy(maal.se);
            k.forste = false;
        } else {
            const a = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(maal.pos, a);
            se.current.lerp(maal.se, a);
        }
        camera.lookAt(se.current);
    });

    const karSynlig = modus === 'badekar' || modus === 'losning';
    const venstreLys = (modus === 'debatt' && beat === 1) || (modus === 'losning' && beat === 1) ? 0.55 : 0.12;
    const hoyreLys = (modus === 'debatt' && beat === 2) || (modus === 'losning' && beat === 2) ? 0.55 : 0.12;

    let niva = 0.62;
    let straale = 0.13;
    let ut = false;
    let glod = 0;
    if (modus === 'badekar') {
        if (beat >= 3) niva = 0.88;
        if (beat === 2) straale = 0.16;
        if (beat === 3) straale = 0.07;
        if (beat >= 4) straale = 0.04;
        if (beat === 1 || beat === 4) glod = 0.4;
        ut = beat >= 5;
    } else if (modus === 'losning') {
        niva = 0.88;
        straale = beat === 2 ? 0.1 : 0.05;
        glod = beat === 1 ? 0.45 : 0;
    }

    return (
        <>
            <color attach="background" args={['#1e2a4a']} />
            <fog attach="fog" args={['#1e2a4a', 30, 70]} />
            <ambientLight intensity={0.85} />
            <directionalLight position={[6, 14, 12]} intensity={1.4} color="#fff7ed" />
            <hemisphereLight args={['#c7d2fe', '#1e293b', 0.5]} />

            {/* Gulv og scene */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[60, 40]} />
                <meshStandardMaterial color="#3b4a6b" emissive="#1e293b" emissiveIntensity={0.3} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.5]}>
                <circleGeometry args={[9, 48]} />
                <meshStandardMaterial color="#4c5f8a" emissive="#312e81" emissiveIntensity={0.25} />
            </mesh>
            {/* Bakvegg og skjerm */}
            <mesh position={[0, 5, -7.2]}>
                <boxGeometry args={[30, 10, 0.3]} />
                <meshStandardMaterial color="#27365e" emissive="#1e1b4b" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0, 4.2, -7]}>
                <boxGeometry args={[9.4, 5.2, 0.15]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 4.2, -6.9]}>
                <planeGeometry args={[9, 4.8]} />
                <meshStandardMaterial color="#1d4ed8" emissive="#2563eb" emissiveIntensity={0.7} />
            </mesh>
            {/* Lysrigg */}
            {[-6, -2, 2, 6].map((x) => (
                <mesh key={x} position={[x, 8.6, -3]}>
                    <cylinderGeometry args={[0.25, 0.4, 0.6, 8]} />
                    <meshStandardMaterial color="#e2e8f0" emissive="#fef3c7" emissiveIntensity={0.9} />
                </mesh>
            ))}

            {modus !== 'badekar' && (
                <>
                    <Talerstol x={-5.5} farge={ORANSJE} lys={venstreLys} />
                    <Talerstol x={5.5} farge={BLA} lys={hoyreLys} />
                </>
            )}
            {modus === 'debatt' && <Publikum />}
            {karSynlig && <Badekar niva={niva} straale={straale} ut={ut} glod={glod} />}

            <Merker modus={modus} beat={beat} />
        </>
    );
}

function Boble({ tekst, farge, smal = false }: { tekst: string; farge: string; smal?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 20 }}
            className="rounded-2xl bg-white/95 shadow-2xl px-4 py-3 text-slate-900 font-bold text-center"
            style={{ width: smal ? 210 : 290, fontSize: smal ? 20 : 24, lineHeight: 1.2, borderBottom: `6px solid ${farge}` }}
        >
            {tekst}
        </motion.div>
    );
}

function Brikke({ tekst, farge = '#0f172a', stor = false }: { tekst: string; farge?: string; stor?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-white/95 shadow-xl px-4 py-2 font-black whitespace-nowrap"
            style={{ color: farge, fontSize: stor ? 28 : 22 }}
        >
            {tekst}
        </motion.div>
    );
}

/** Merkelapper i 3D-rommet. Rendres betinget, så de forsvinner når de ikke skal vises. */
function Merker({ modus, beat }: { modus: Modus; beat: number }) {
    const z = [10, 0] as [number, number];
    if (modus === 'debatt') {
        return (
            <>
                {beat === 0 && (
                    <Html position={[0, 4.2, -6.8]} center zIndexRange={z}>
                        <div className="text-white font-display font-black whitespace-nowrap" style={{ fontSize: 30 }}>
                            Debatt: Innvandring
                        </div>
                    </Html>
                )}
                {beat >= 1 && (
                    <Html position={[-5.5, 3.9, 0]} center zIndexRange={z}>
                        <Boble tekst="Det bor nesten én million innvandrere i Norge." farge={ORANSJE} smal={beat === 3} />
                    </Html>
                )}
                {beat >= 2 && (
                    <Html position={[5.5, 3.9, 0]} center zIndexRange={z}>
                        <Boble tekst="Arbeidsinnvandringen er den laveste på 20 år." farge={BLA} smal={beat === 3} />
                    </Html>
                )}
                {beat === 3 && (
                    <Html position={[0, 4.6, -6.8]} center zIndexRange={z}>
                        <div className="text-white font-display font-black" style={{ fontSize: 96, lineHeight: 1 }}>
                            ?
                        </div>
                    </Html>
                )}
            </>
        );
    }
    if (modus === 'badekar') {
        return (
            <>
                {beat === 0 && (
                    <>
                        <Html position={[0.9, 2.5, KAR_Z]} center zIndexRange={z}>
                            <Brikke tekst="1. Vannet i karet" farge="#0369a1" />
                        </Html>
                        <Html position={[-2.3, 3.2, KAR_Z]} center zIndexRange={z}>
                            <Brikke tekst="2. Vannet fra kranen" farge="#0369a1" />
                        </Html>
                    </>
                )}
                {(beat === 1 || beat === 3) && (
                    <Html position={[0.6, 2.75, KAR_Z]} center zIndexRange={z}>
                        <Brikke
                            tekst={beat === 1 ? 'Bor i Norge 1. januar 2026: 987 120' : 'Aldri vært høyere'}
                            farge={ORANSJE}
                            stor
                        />
                    </Html>
                )}
                {beat === 2 && (
                    <Html position={[-1.4, 3.5, KAR_Z]} center zIndexRange={z}>
                        <Brikke tekst="Kommer i løpet av ett år" farge="#0369a1" stor />
                    </Html>
                )}
                {beat === 4 && (
                    <>
                        <Html position={[1, 2.6, KAR_Z]} center zIndexRange={z}>
                            <Brikke tekst="2025: økte bare med 22 000" farge={ORANSJE} stor />
                        </Html>
                        <Html position={[-3.3, 2.2, KAR_Z]} center zIndexRange={z}>
                            <Brikke tekst="Færre flyttet hit, særlig fra Ukraina" farge="#0369a1" />
                        </Html>
                    </>
                )}
                {beat >= 5 && (
                    <Html position={[3.6, 1.1, KAR_Z + 1]} center zIndexRange={z}>
                        <Brikke tekst="Flytter videre eller hjem" farge="#0369a1" stor />
                    </Html>
                )}
            </>
        );
    }
    if (modus === 'losning') {
        return (
            <>
                {beat === 0 && (
                    <Html position={[0, 4.4, -6.8]} center zIndexRange={z}>
                        <div className="text-white font-display font-black whitespace-nowrap" style={{ fontSize: 34 }}>
                            Begge hadde rett
                        </div>
                    </Html>
                )}
                {(beat === 1 || beat === 3) && (
                    <Html position={[-5.5, 3.9, 0]} center zIndexRange={z}>
                        <Boble tekst="Hvor mange som bor i Norge" farge={ORANSJE} smal />
                    </Html>
                )}
                {(beat === 2 || beat === 3) && (
                    <Html position={[5.5, 3.9, 0]} center zIndexRange={z}>
                        <Boble tekst="Hvor mange som kom for å jobbe, ett år" farge={BLA} smal />
                    </Html>
                )}
                {beat === 1 && (
                    <Html position={[0.4, 2.5, KAR_Z]} center zIndexRange={z}>
                        <Brikke tekst="Vannet i karet" farge={ORANSJE} stor />
                    </Html>
                )}
                {beat === 2 && (
                    <Html position={[-1.4, 3.4, KAR_Z]} center zIndexRange={z}>
                        <Brikke tekst="Vannet fra kranen" farge="#0369a1" stor />
                    </Html>
                )}
                {beat === 3 && (
                    <Html position={[0, 4.4, -6.8]} center zIndexRange={z}>
                        <div className="text-white font-display font-black whitespace-nowrap" style={{ fontSize: 34 }}>
                            Ulike spørsmål
                        </div>
                    </Html>
                )}
            </>
        );
    }
    return null;
}

const SPORSMAL = [
    { tittel: 'Hvem er talt med?', tekst: 'Også norskfødte med innvandrerforeldre?' },
    { tittel: 'Hvor er det talt?', tekst: 'Hele landet, én kommune eller én bydel?' },
    { tittel: 'Når er det talt?', tekst: 'Ett år, eller mange år til sammen?' },
    { tittel: 'Andel eller antall?', tekst: '32 % i en liten kommune kan være noen hundre' },
    { tittel: 'Hvem står bak tallet?', tekst: 'SSB, eller noen som vil vinne en debatt?' },
];

function Sjekkliste({ beat }: { beat: number }) {
    return (
        <div
            className="absolute rounded-3xl bg-slate-900/95 shadow-2xl px-7 py-5"
            style={{ left: '12%', right: '12%', top: '16%' }}
        >
            <div className="text-amber-300 font-display font-black mb-3" style={{ fontSize: 28 }}>
                Kildekritikk: fem spørsmål til et tall
            </div>
            {SPORSMAL.map((s, i) =>
                beat >= i + 1 ? (
                    <motion.div
                        key={s.tittel}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: beat === i + 1 ? 1 : 0.85, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-baseline gap-3 mb-2"
                    >
                        <span
                            className="inline-flex items-center justify-center rounded-full bg-amber-300 text-slate-900 font-black shrink-0"
                            style={{ width: 34, height: 34, fontSize: 20 }}
                        >
                            {i + 1}
                        </span>
                        <span className="text-white font-black whitespace-nowrap" style={{ fontSize: 24 }}>
                            {s.tittel}
                        </span>
                        <span className="text-slate-200 font-semibold whitespace-nowrap" style={{ fontSize: 19 }}>
                            {s.tekst}
                        </span>
                    </motion.div>
                ) : (
                    <div key={s.tittel} className="flex items-baseline gap-3 mb-2" style={{ height: 34 }}>
                        <span
                            className="inline-flex items-center justify-center rounded-full border-2 border-slate-500 text-slate-500 font-black"
                            style={{ width: 34, height: 34, fontSize: 20 }}
                        >
                            {i + 1}
                        </span>
                    </div>
                )
            )}
        </div>
    );
}

const LAPPER: Record<Modus, string[]> = {
    debatt: ['TV-debatt om innvandring', 'Politiker 1', 'Politiker 2', 'Hvem har rett?'],
    badekar: [
        'To typer tall',
        'Karet: hvor mange som bor her',
        'Kranen: hvor mange som kommer på ett år',
        'Mye vann, svak stråle',
        'Karet steg lite i 2025',
        'Avløpet: noen flytter ut igjen',
    ],
    sjekk: ['Kildekritikk'],
    losning: ['Tilbake i studio', 'Politiker 1: karet', 'Politiker 2: kranen', 'Ulike spørsmål, ulike tall'],
};

export function InnvandringStudio({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'debatt';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const lapper = LAPPER[modus];
    const lapp = lapper[Math.min(beat, lapper.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [0, 5, 16] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            {modus !== 'sjekk' && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={lapp}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute top-[5%] left-[3%] px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold shadow-xl whitespace-nowrap"
                        style={{ fontSize: 28 }}
                    >
                        {lapp}
                    </motion.div>
                </AnimatePresence>
            )}
            {modus === 'sjekk' && <Sjekkliste beat={beat} />}
        </div>
    );
}
