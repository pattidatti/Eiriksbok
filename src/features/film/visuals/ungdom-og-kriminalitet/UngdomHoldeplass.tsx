import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Bussholdeplassen en mørk novemberkveld, og møterommet hos politiet.
 * «ran»: gutten venter, tre kommer, to krever mobilen mens 14-åringen holder utkikk, de løper.
 * «samtale»: bekymringssamtalen rundt et bord: 14-åringen, foreldrene og politiet.
 * «tilbake»: de tre ved holdeplassen igjen, hva som skjer med hver, og morgenbussen.
 */

type Modus = 'ran' | 'samtale' | 'tilbake';
type V3 = [number, number, number];

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const klamp = (x: number) => Math.min(1, Math.max(0, x));

const FORTAU = 0.14;
/** Gutten som venter (offeret). */
const GUTT: V3 = [0.4, FORTAU, 0.3];
/** De tre: to 16-åringer og 14-åringen som holder utkikk. */
const TRE = [
    { farge: '#7c3aed', mal: [-0.75, FORTAU, 1.25] as V3, alder: '16' },
    { farge: '#16a34a', mal: [1.55, FORTAU, 1.3] as V3, alder: '16' },
    { farge: '#ea580c', mal: [-4.2, FORTAU, 2.6] as V3, alder: '14' },
];

/** Hvor de tre står, ut fra modus, beat og tid i beaten. */
function trePos(modus: Modus, beat: number, t: number, i: number): THREE.Vector3 | null {
    const mal = v(...TRE[i].mal);
    if (modus === 'ran') {
        if (beat === 0) return null;
        if (beat === 1) {
            const k = klamp((t - i * 0.25) / 3.2);
            return v(-13 + i * 0.8, FORTAU, 2.2 + i * 0.3).lerp(mal, k);
        }
        if (beat === 2) return mal;
        // De løper av gårde mot høyre.
        const ut = Math.min(t, 2.5) * 3.2;
        return v(mal.x + ut, FORTAU, mal.z + 1.2);
    }
    if (modus === 'tilbake') return mal;
    return null;
}

function kameraFor(
    modus: Modus,
    beat: number,
    t: number
): { pos: THREE.Vector3; se: THREE.Vector3 } {
    if (modus === 'ran') {
        switch (beat) {
            case 0:
                return { pos: v(5.5 - Math.min(t, 8) * 0.12, 3, 11.5), se: v(0, 1.4, 0.4) };
            case 1:
                return { pos: v(-3.5, 3.2, 12), se: v(-2.4, 1.2, 1.2) };
            case 2:
                return { pos: v(-1.2, 2.7, 10), se: v(-1.4, 1.4, 1.2) };
            default:
                return { pos: v(4.5, 3.4, 12.5), se: v(4, 1.1, 1.6) };
        }
    }
    if (modus === 'samtale') {
        switch (beat) {
            case 0:
                return { pos: v(0, 4.2, 8.5), se: v(0, 1, -0.6) };
            case 1:
                return { pos: v(-4.2, 2.8, 5.2), se: v(0.2, 1, -0.4) };
            case 2:
                return { pos: v(4.6, 2.6, 4.6), se: v(-0.2, 1.1, -0.4) };
            default:
                return { pos: v(0.2, 4.4, 4.6), se: v(0.4, 0.8, -0.3) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-0.8, 3.4, 12.5), se: v(-1, 1.3, 1.2) };
        case 1:
            return { pos: v(-6, 2.4, 8.4), se: v(-2.4, 1.5, 2.4) };
        case 2:
            return { pos: v(1.8, 2.4, 8.8), se: v(2.8, 1.5, 1.2) };
        default:
            return { pos: v(3, 5, 17), se: v(-1.5, 1.4, 0.5) };
    }
}

function Figur({
    farge,
    sitter = false,
    politi = false,
}: {
    farge: string;
    sitter?: boolean;
    politi?: boolean;
}) {
    const dy = sitter ? -0.45 : 0;
    return (
        <group>
            <mesh position={[0, 0.95 + dy, 0]}>
                <capsuleGeometry args={[0.32, sitter ? 0.5 : 0.85, 4, 10]} />
                <meshStandardMaterial color={farge} flatShading roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.82 + dy - (sitter ? -0.2 : 0), 0]}>
                <sphereGeometry args={[0.26, 14, 12]} />
                <meshStandardMaterial color="#e8b98f" roughness={0.9} />
            </mesh>
            {politi && (
                <>
                    <mesh position={[0, 2.06 + dy + 0.2, 0]}>
                        <cylinderGeometry args={[0.29, 0.29, 0.12, 16]} />
                        <meshStandardMaterial color="#111827" />
                    </mesh>
                    <mesh position={[0, 1.1 + dy, 0]}>
                        <cylinderGeometry args={[0.35, 0.35, 0.12, 16]} />
                        <meshStandardMaterial
                            color="#d9f99d"
                            emissive="#a3e635"
                            emissiveIntensity={0.35}
                        />
                    </mesh>
                </>
            )}
        </group>
    );
}

/** Leskuret med tak, glassvegger og benk. */
function Skur() {
    return (
        <group position={[0, FORTAU, -0.6]}>
            <mesh position={[0, 2.5, 0.2]}>
                <boxGeometry args={[4.4, 0.14, 2]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[0, 1.25, -0.75]}>
                <boxGeometry args={[4.2, 2.4, 0.06]} />
                <meshStandardMaterial color="#93c5fd" transparent opacity={0.28} />
            </mesh>
            <mesh position={[-2.1, 1.25, 0]}>
                <boxGeometry args={[0.06, 2.4, 1.5]} />
                <meshStandardMaterial color="#93c5fd" transparent opacity={0.28} />
            </mesh>
            {[-2.15, 2.15].map((x) => (
                <mesh key={x} position={[x, 1.25, -0.75]}>
                    <boxGeometry args={[0.1, 2.5, 0.1]} />
                    <meshStandardMaterial color="#374151" />
                </mesh>
            ))}
            <mesh position={[-0.6, 0.48, -0.45]}>
                <boxGeometry args={[2.2, 0.08, 0.45]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            {/* Skilt med buss-symbol */}
            <mesh position={[2.6, 1.6, 0.6]}>
                <cylinderGeometry args={[0.05, 0.05, 3.2, 8]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>
            <mesh position={[2.6, 3.05, 0.6]}>
                <boxGeometry args={[0.7, 0.55, 0.06]} />
                <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.4} />
            </mesh>
            {/* Lys i taket */}
            <mesh position={[0, 2.41, 0.2]}>
                <boxGeometry args={[3, 0.05, 0.3]} />
                <meshStandardMaterial color="#fff7d6" emissive="#fde68a" emissiveIntensity={1.4} />
            </mesh>
            <pointLight
                position={[0, 2.2, 0.6]}
                color="#ffe4a8"
                intensity={14}
                distance={9}
                decay={1.4}
            />
        </group>
    );
}

function Lykt({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 2.3, 0]}>
                <cylinderGeometry args={[0.07, 0.09, 4.6, 8]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 4.6, 0]}>
                <sphereGeometry args={[0.26, 12, 10]} />
                <meshStandardMaterial color="#fff7d6" emissive="#fde68a" emissiveIntensity={2} />
            </mesh>
            <pointLight
                position={[0, 4.3, 0]}
                color="#ffd98a"
                intensity={20}
                distance={13}
                decay={1.5}
            />
        </group>
    );
}

function Hus() {
    const hus = useMemo(
        () =>
            Array.from({ length: 8 }, (_, i) => ({
                x: -28 + i * 8,
                h: 5 + ((i * 29) % 4),
                farge: ['#3b3f55', '#45403c', '#334458', '#463f52'][i % 4],
            })),
        []
    );
    return (
        <>
            {hus.map((h) => (
                <group key={h.x} position={[h.x, 0, -11]}>
                    <mesh position={[0, h.h / 2, 0]}>
                        <boxGeometry args={[7.4, h.h, 4]} />
                        <meshStandardMaterial
                            color={h.farge}
                            emissive="#1a1f33"
                            emissiveIntensity={0.4}
                        />
                    </mesh>
                    {[-2.2, 0.2, 2.4].map((wx) => (
                        <mesh key={wx} position={[wx, 2.6, 2.02]}>
                            <planeGeometry args={[1.1, 1.2]} />
                            <meshStandardMaterial
                                color="#fde68a"
                                emissive="#fbbf24"
                                emissiveIntensity={Math.abs(h.x + wx * 3) % 3 > 1 ? 0.8 : 0.05}
                            />
                        </mesh>
                    ))}
                </group>
            ))}
        </>
    );
}

function Buss() {
    return (
        <group>
            <mesh position={[0, 1.6, 0]}>
                <boxGeometry args={[9, 2.8, 2.4]} />
                <meshStandardMaterial color="#dc2626" roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.1, 1.21]}>
                <boxGeometry args={[8.2, 1, 0.02]} />
                <meshStandardMaterial color="#1e293b" roughness={0.2} />
            </mesh>
            <mesh position={[4.51, 2, 0]}>
                <boxGeometry args={[0.02, 1.4, 2]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            {[-3, 3].map((x) =>
                [1.1, -1.1].map((z) => (
                    <mesh key={`${x}${z}`} position={[x, 0.45, z]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.45, 0.45, 0.3, 14]} />
                        <meshStandardMaterial color="#111827" />
                    </mesh>
                ))
            )}
        </group>
    );
}

function Gata({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const tre = useRef<(THREE.Group | null)[]>([]);
    const mobil = useRef<THREE.Mesh>(null);
    const buss = useRef<THREE.Group>(null);
    const himmel = useRef<THREE.Color>(null);
    const amb = useRef<THREE.AmbientLight>(null);
    const kamSe = useRef(v(0, 1, 0));
    const forste = useRef(true);
    const beatTid = useRef(0);
    const forrige = useRef(beat);
    const morgen = useRef(0);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        // På pause står bildet i nøkkelstillingen for beaten.
        const t = playing ? beatTid.current : modus === 'ran' && beat === 3 ? 1.2 : 20;

        tre.current.forEach((g, i) => {
            if (!g) return;
            const p = trePos(modus, beat, t, i);
            g.visible = p !== null;
            if (!p) return;
            const gaar =
                (modus === 'ran' && beat === 1 && t < 3.6) || (modus === 'ran' && beat === 3);
            const bob = gaar ? Math.abs(Math.sin(t * (beat === 3 ? 11 : 6) + i)) * 0.1 : 0;
            g.position.set(p.x, p.y + bob, p.z);
            // Utkikken ser seg rundt.
            if (i === 2 && modus === 'ran' && beat === 2) g.rotation.y = Math.sin(t * 1.4) * 0.9;
            else g.rotation.y = 0;
        });

        if (mobil.current) {
            const holder = modus === 'ran' && beat === 3 ? tre.current[0] : null;
            mobil.current.visible = modus === 'ran';
            if (holder)
                mobil.current.position.set(holder.position.x + 0.42, 1.35, holder.position.z + 0.1);
            else mobil.current.position.set(GUTT[0] + 0.42, 1.35, GUTT[2] + 0.2);
        }

        // Morgen i siste beat av «tilbake».
        const malMorgen = modus === 'tilbake' && beat === 3 ? 1 : 0;
        morgen.current += (malMorgen - morgen.current) * (playing ? 1 - Math.exp(-1.2 * dt) : 1);
        if (himmel.current)
            himmel.current.set('#0f1a33').lerp(new THREE.Color('#9cc4e8'), morgen.current);
        if (amb.current) amb.current.intensity = 0.75 + morgen.current * 1.1;
        if (buss.current) {
            buss.current.visible = malMorgen > 0;
            const k = playing ? klamp(beatTid.current / 3.5) : 1;
            buss.current.position.set(-26 + (26 - 10.5) * (1 - Math.pow(1 - k, 3)), 0, 5.2);
        }

        const mal = kameraFor(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * (dt || 0));
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
    });

    const visGutt = modus === 'ran';
    return (
        <>
            <color ref={himmel} attach="background" args={['#0f1a33']} />
            <fog attach="fog" args={['#1b2a4d', 24, 70]} />
            <ambientLight ref={amb} intensity={0.75} color="#b8c6e8" />
            <hemisphereLight args={['#4b5f8f', '#1a1a24', 0.7]} />
            <directionalLight position={[-10, 14, 12]} intensity={0.6} color="#c7d2fe" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[140, 60]} />
                <meshStandardMaterial color="#2b3242" roughness={0.9} />
            </mesh>
            {Array.from({ length: 14 }, (_, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-40 + i * 6, 0.01, 6.6]}>
                    <planeGeometry args={[2.6, 0.18]} />
                    <meshStandardMaterial
                        color="#e2e8f0"
                        emissive="#64748b"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
            <mesh position={[0, FORTAU / 2, 0]}>
                <boxGeometry args={[140, FORTAU, 7]} />
                <meshStandardMaterial color="#6b7280" roughness={0.95} />
            </mesh>
            <Hus />
            <Skur />
            <Lykt x={-6} z={3} />
            <Lykt x={6} z={3} />
            {visGutt && (
                <group position={GUTT}>
                    <Figur farge="#2563eb" />
                </group>
            )}
            <mesh ref={mobil}>
                <boxGeometry args={[0.1, 0.2, 0.03]} />
                <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" emissiveIntensity={2} />
            </mesh>
            {TRE.map((p, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        tre.current[i] = g;
                    }}
                    position={p.mal}
                >
                    <Figur farge={p.farge} />
                </group>
            ))}
            <group ref={buss} position={[-22, 0, 5.2]} visible={false}>
                <Buss />
            </group>
            <Merker modus={modus} beat={beat} />
        </>
    );
}

/** Merkelapper over figurene, som DOM. */
function Merker({ modus, beat }: { modus: Modus; beat: number }) {
    const merker: { pos: V3; tekst: string; farge: string }[] = [];
    if (modus === 'ran') {
        if (beat === 0)
            merker.push({ pos: [GUTT[0], 2.75, GUTT[2]], tekst: '15 år', farge: '#2563eb' });
        if (beat === 2) {
            merker.push({
                pos: [TRE[2].mal[0], 2.75, TRE[2].mal[2]],
                tekst: '14 år: holder utkikk',
                farge: '#ea580c',
            });
            merker.push({ pos: [0.4, 3.35, 1.2], tekst: 'To krever mobilen', farge: '#7c3aed' });
        }
        if (beat === 3)
            merker.push({
                pos: [GUTT[0], 2.75, GUTT[2]],
                tekst: 'Mobilen er borte',
                farge: '#2563eb',
            });
    }
    if (modus === 'tilbake') {
        if (beat === 0) {
            merker.push({
                pos: [TRE[2].mal[0], 2.7, TRE[2].mal[2]],
                tekst: '14 år',
                farge: TRE[2].farge,
            });
            merker.push({ pos: [0.4, 2.85, 1.3], tekst: 'To på 16 år', farge: TRE[0].farge });
        }
        if (beat === 1)
            merker.push({
                pos: [TRE[2].mal[0], 2.75, TRE[2].mal[2]],
                tekst: '14 år',
                farge: '#ea580c',
            });
        if (beat === 2)
            merker.push({ pos: [0.4, 2.85, 1.3], tekst: 'To på 16 år', farge: '#7c3aed' });
    }
    if (modus === 'samtale' && beat === 1) {
        merker.push({ pos: [-2.1, 2.05, 0], tekst: '14 år', farge: '#ea580c' });
        merker.push({ pos: [-0.55, 2.45, -1.2], tekst: 'Foreldrene', farge: '#a16207' });
        merker.push({ pos: [2.1, 2.3, 0], tekst: 'Politiet', farge: '#1e3a8a' });
    }
    return (
        <>
            {merker.map((m) => (
                <Html key={m.tekst} position={m.pos} center zIndexRange={[20, 0]}>
                    <div
                        className="pointer-events-none rounded-2xl bg-white px-4 py-1.5 font-black text-2xl text-slate-900 shadow-xl"
                        style={{ border: `4px solid ${m.farge}`, width: 'max-content' }}
                    >
                        {m.tekst}
                    </div>
                </Html>
            ))}
        </>
    );
}

/* ---------------- Møterommet ---------------- */

function Moterom({ beat, playing }: { beat: number; playing: boolean }) {
    const { camera } = useThree();
    const kamSe = useRef(v(0, 1, 0));
    const forste = useRef(true);
    const beatTid = useRef(0);
    const forrige = useRef(beat);
    const ark = useRef<THREE.Mesh>(null);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = playing ? beatTid.current : 20;
        if (ark.current) {
            const m = ark.current.material as THREE.MeshStandardMaterial;
            m.emissiveIntensity = beat === 3 ? 0.35 + 0.15 * Math.sin(t * 2) : 0;
        }
        const mal = kameraFor('samtale', beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * (dt || 0));
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
    });

    return (
        <>
            <color attach="background" args={['#cbd5e1']} />
            <fog attach="fog" args={['#cbd5e1', 14, 30]} />
            <ambientLight intensity={1.1} color="#f8fafc" />
            <hemisphereLight args={['#ffffff', '#94a3b8', 0.6]} />
            <directionalLight position={[3, 8, 6]} intensity={0.9} />
            <pointLight position={[0, 2.8, 0]} intensity={10} distance={8} color="#fff7ed" />
            {/* Gulv og vegger */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[14, 12]} />
                <meshStandardMaterial color="#a8a29e" />
            </mesh>
            <mesh position={[0, 2, -3]}>
                <planeGeometry args={[14, 4]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            <mesh position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[12, 4]} />
                <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            {/* Vindu: det er mørkt ute */}
            <mesh position={[1.8, 2.1, -2.98]}>
                <planeGeometry args={[2.4, 1.4]} />
                <meshStandardMaterial color="#0f1a33" emissive="#0f1a33" emissiveIntensity={0.6} />
            </mesh>
            {/* Bordet */}
            <mesh position={[0, 0.75, -0.3]}>
                <boxGeometry args={[3.4, 0.1, 1.9]} />
                <meshStandardMaterial color="#d6b88a" />
            </mesh>
            {[
                [-1.55, -1.1],
                [1.55, -1.1],
                [-1.55, 0.5],
                [1.55, 0.5],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 0.36, z]}>
                    <boxGeometry args={[0.1, 0.72, 0.1]} />
                    <meshStandardMaterial color="#78350f" />
                </mesh>
            ))}
            {/* Arket der samtalen skrives ned */}
            <mesh ref={ark} position={[0.75, 0.81, 0]} rotation={[-Math.PI / 2, 0, 0.2]}>
                <planeGeometry args={[0.6, 0.8]} />
                <meshStandardMaterial color="#ffffff" emissive="#fde68a" emissiveIntensity={0} />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    position={[0.75 - 0.06 * i * 0.2, 0.812, -0.22 + i * 0.12]}
                    rotation={[-Math.PI / 2, 0, 0.2]}
                >
                    <planeGeometry args={[0.42, 0.03]} />
                    <meshStandardMaterial color="#64748b" />
                </mesh>
            ))}
            <group position={[-2.1, 0, -0.3]}>
                <Figur farge="#ea580c" sitter />
            </group>
            <group position={[-0.55, 0, -1.55]}>
                <Figur farge="#a16207" sitter />
            </group>
            <group position={[0.55, 0, -1.55]}>
                <Figur farge="#0f766e" sitter />
            </group>
            <group position={[2.1, 0, -0.3]}>
                <Figur farge="#1f2a44" sitter politi />
            </group>
            <Merker modus="samtale" beat={beat} />
            {beat === 2 && (
                <Html position={[2.1, 2.55, -0.3]} center zIndexRange={[20, 0]}>
                    <Boble tekst="Snakker om: veien bort fra kriminalitet" farge="#1e3a8a" />
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
                style={{ border: `4px solid ${farge}`, maxWidth: 320, width: 'max-content' }}
            >
                {tekst}
            </div>
        </div>
    );
}

/* ---------------- Paneler over bildet ---------------- */

interface Rad {
    tekst: string;
    ok?: boolean;
    nei?: boolean;
}

function panel(modus: Modus, beat: number): { tittel: string; rader: Rad[] } | null {
    if (modus === 'samtale') {
        if (beat === 0)
            return {
                tittel: '14-åringen',
                rader: [
                    { tekst: 'Slipper straff', ok: true },
                    { tekst: 'Slipper ikke unna', nei: true },
                ],
            };
        if (beat === 3)
            return {
                tittel: 'Samtalen',
                rader: [
                    { tekst: 'Skrives ned hos politiet', ok: true },
                    { tekst: 'Havner ikke på rullebladet', nei: true },
                    { tekst: 'Rullebladet: listen over straffene du har fått' },
                ],
            };
        return null;
    }
    if (modus === 'tilbake') {
        if (beat === 1)
            return {
                tittel: '14 år: ingen straff',
                rader: [
                    { tekst: 'Bekymringssamtale med foreldrene' },
                    { tekst: 'Barnevernet kan bli koblet inn' },
                ],
            };
        if (beat === 2)
            return {
                tittel: '16 år: kan straffes',
                rader: [
                    { tekst: 'Ranet før? Kan få ungdomsstraff' },
                    { tekst: 'En plan og faste tider' },
                    { tekst: 'Møte med gutten de ranet, hvis han vil' },
                ],
            };
        if (beat === 3)
            return {
                tittel: 'Samme mål for alle tre',
                rader: [{ tekst: 'At de ikke gjør det igjen', ok: true }],
            };
    }
    return null;
}

function Panel({ modus, beat }: { modus: Modus; beat: number }) {
    const p = panel(modus, beat);
    return (
        <AnimatePresence mode="wait">
            {p && (
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute rounded-3xl bg-white/95 shadow-2xl p-5"
                    style={{ right: 24, top: 24, width: 400 }}
                >
                    <div className="font-display font-black text-3xl text-slate-900 mb-2">
                        {p.tittel}
                    </div>
                    {p.rader.map((r) => (
                        <div key={r.tekst} className="flex items-start gap-3 py-1">
                            <span
                                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg"
                                style={{
                                    background: r.nei ? '#dc2626' : r.ok ? '#0d9488' : '#1e3a8a',
                                }}
                            >
                                {r.nei ? '✕' : r.ok ? '✓' : '•'}
                            </span>
                            <span className="text-2xl font-bold text-slate-800 leading-tight">
                                {r.tekst}
                            </span>
                        </div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function UngdomHoldeplass({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'ran';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.2, far: 200, position: [5, 3, 12] }}
            >
                {modus === 'samtale' ? (
                    <Moterom beat={beat} playing={playing} />
                ) : (
                    <Gata modus={modus} beat={beat} playing={playing} />
                )}
            </Canvas>
            <div className="absolute inset-0 pointer-events-none">
                <Flate>
                    <Panel modus={modus} beat={beat} />
                </Flate>
            </div>
        </div>
    );
}
