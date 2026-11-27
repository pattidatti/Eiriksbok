import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Brikke } from './felles';
import { damp, fro, useKamera, v } from './felles3d';

/**
 * Kjeden av hendelser fram mot krigen, i 3D. Lenkene er årstall; den som handler nå, gløder.
 * «1991»: Sovjetunionen (en rød plate) sprekker, Ukraina løfter seg ut, folkeavstemningen.
 * «1994»: atomvåpnene forsvinner, løftet gis, og lenken sprekker.
 * «2008»: NATO 2008, EU-avtalen 2013, protestene i Kyiv, februar 2014 og de to synene.
 * «grense»: en helt annen scene. Soldater samlet langs en grense i 2021.
 */

type Modus = '1991' | '1994' | '2008' | 'grense';

const AR = ['1991', '1994', '2008', '2013', '2014', '2021', '2022'];
const AVSTAND = 3.2;
const lenkeX = (i: number) => i * AVSTAND;

const GULL = new THREE.Color('#facc15');
const MORK = new THREE.Color('#475569');
const ROD = new THREE.Color('#dc2626');
const SVART = new THREE.Color('#000000');

/** Hvilke lenker som gløder på en beat. */
function lyser(modus: Modus, beat: number): number[] {
    if (modus === '1991') return [0];
    if (modus === '1994') return [0, 1];
    if (modus === '2008') {
        if (beat === 0) return [0, 1, 2];
        if (beat <= 2) return [0, 1, 2, 3];
        return [0, 1, 2, 3, 4];
    }
    return [0, 1, 2, 3, 4, 5];
}

function fokus(modus: Modus, beat: number): number {
    if (modus === '1991') return 0;
    if (modus === '1994') return 1;
    if (beat === 0) return 2;
    if (beat <= 2) return 3;
    if (beat === 3) return 4;
    return 3.5;
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'grense') {
        switch (beat) {
            case 0:
                return { pos: v(-16 + t * 0.5, 9, 18), se: v(0, 0, 0) };
            case 1:
                return { pos: v(6, 4, 9), se: v(0, 0.5, -3) };
            case 2:
                return { pos: v(14, 12, 14), se: v(0, 0, -2) };
            default:
                return { pos: v(0, 26, 12), se: v(0, 0, -2) };
        }
    }
    if (modus === '1991' && beat === 0) return { pos: v(8 + t * 0.2, 6.5, 21), se: v(8, 1.8, 0) };
    const x = lenkeX(fokus(modus, beat));
    if (modus === '1991') {
        if (beat <= 2) return { pos: v(x + 3, 4.5, 11 - t * 0.15), se: v(x, 2.6, 0) };
        return { pos: v(x + 4, 3.2, 10), se: v(x + 1.5, 1.2, 2) };
    }
    if (modus === '1994')
        return { pos: v(x + 3.5, 3.6 + (beat === 2 ? -1 : 0), 9 - t * 0.12), se: v(x, 1.4, 0) };
    if (beat === 2) return { pos: v(x + 3, 6, 11), se: v(x, 0.5, 3) };
    if (beat === 4) return { pos: v(x, 5, 15), se: v(x, 1, 0) };
    return { pos: v(x + 3, 3.8, 9.5 - t * 0.12), se: v(x, 1, 0) };
}

function Lenke({
    i,
    lys,
    sprekk,
    rod,
}: {
    i: number;
    lys: boolean;
    sprekk: boolean;
    rod: boolean;
}) {
    const venstre = useRef<THREE.Group>(null);
    const hoyre = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        if (venstre.current && hoyre.current) {
            const ut = sprekk ? 0.3 : 0;
            venstre.current.position.x = damp(venstre.current.position.x, -ut, 3, dt);
            hoyre.current.position.x = damp(hoyre.current.position.x, ut, 3, dt);
        }
    });
    const vridd = i % 2 === 1;
    const farge = rod ? ROD : lys ? GULL : MORK;
    const glod = rod ? ROD : lys ? GULL : SVART;
    // Lenken er to halve ringer, så den kan sprekke på midten. Skaleringen ligger på gruppa,
    // så lenken blir lang langs kjeden og ikke på høykant.
    return (
        <group position={[lenkeX(i), 1, 0]} rotation={[vridd ? Math.PI / 2 : 0, 0, 0]}>
            <group scale={[1.5, 1, 1]}>
                <group ref={venstre}>
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                        <torusGeometry args={[1, 0.24, 16, 32, Math.PI]} />
                        <meshStandardMaterial
                            color={farge}
                            emissive={glod}
                            emissiveIntensity={0.35}
                            metalness={0.4}
                            roughness={0.4}
                        />
                    </mesh>
                </group>
                <group ref={hoyre}>
                    <mesh rotation={[0, 0, -Math.PI / 2]}>
                        <torusGeometry args={[1, 0.24, 16, 32, Math.PI]} />
                        <meshStandardMaterial
                            color={farge}
                            emissive={glod}
                            emissiveIntensity={0.35}
                            metalness={0.4}
                            roughness={0.4}
                        />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

function Kjede({ modus, beat }: { modus: Modus; beat: number }) {
    const lys = lyser(modus, beat);
    const f = fokus(modus, beat);
    const visAr =
        !(modus === '1991' && beat >= 3) && !(modus === '2008' && (beat === 2 || beat === 4));
    return (
        <group>
            {AR.map((ar, i) => (
                <group key={ar}>
                    <Lenke
                        i={i}
                        lys={lys.includes(i)}
                        sprekk={modus === '1994' && beat >= 2 && i === 1}
                        rod={(modus === '1994' && beat >= 2 && i === 1) || i === 6}
                    />
                    {visAr &&
                        !(modus === '1991' && beat >= 1 && i === 1) &&
                        (modus === '1991' && beat === 0 ? true : Math.abs(i - f) <= 1.6) && (
                            <Html
                                position={[lenkeX(i), i % 2 === 0 ? -0.8 : 3, 0]}
                                center
                                zIndexRange={[5, 0]}
                            >
                                <div
                                    className="font-display font-black text-3xl px-3 py-1 rounded-lg shadow"
                                    style={{
                                        background:
                                            i === 6
                                                ? '#b91c1c'
                                                : lys.includes(i)
                                                  ? '#facc15'
                                                  : '#e2e8f0',
                                        color: i === 6 ? '#ffffff' : '#0f172a',
                                    }}
                                >
                                    {ar}
                                </div>
                            </Html>
                        )}
                </group>
            ))}
        </group>
    );
}

/** Sovjetunionen som en rød plate over 1991-lenken. Den sprekker, og én bit (Ukraina) løfter seg ut. */
function Plate({ beat }: { beat: number }) {
    const biter = useMemo(() => {
        const ut: { x: number; y: number; dx: number; dy: number; dz: number; s: number }[] = [];
        for (let r = 0; r < 4; r++)
            for (let k = 0; k < 7; k++) {
                const x = (k - 3) * 0.72;
                const y = (r - 1.5) * 0.62;
                ut.push({
                    x,
                    y,
                    dx: x * 0.7 + (fro(r * 7 + k) - 0.5) * 0.8,
                    dy: y * 0.7 + (fro(r * 13 + k) - 0.5) * 0.6,
                    dz: (fro(r + k * 3) - 0.5) * 1.6,
                    s: 0.6 + fro(r * 5 + k) * 0.25,
                });
            }
        return ut;
    }, []);
    const UKR = 17;
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        biter.forEach((b, i) => {
            const m = refs.current[i];
            if (!m) return;
            const brutt = beat >= 1;
            const ukr = i === UKR && beat >= 2;
            const tx = ukr ? 1.2 : b.x + (brutt ? b.dx : 0);
            const ty = 3.2 + (ukr ? 0.4 : b.y + (brutt ? b.dy : 0));
            const tz = ukr ? 2.4 : brutt ? b.dz : 0;
            m.position.set(
                damp(m.position.x, tx, 2.5, dt),
                damp(m.position.y, ty, 2.5, dt),
                damp(m.position.z, tz, 2.5, dt)
            );
            const s = ukr ? 1.7 : 1;
            m.scale.setScalar(damp(m.scale.x, s, 2.5, dt));
            const mat = mats.current[i];
            if (mat) {
                const dempet = beat >= 2 && i !== UKR;
                mat.opacity = damp(mat.opacity, beat >= 3 ? 0 : dempet ? 0.35 : 1, 2.5, dt);
                if (ukr) mat.color.lerp(GULL, 1 - Math.exp(-3 * dt));
            }
        });
    });
    return (
        <group>
            {beat <= 1 && (
                <Html position={[0, 4.9, 0]} center zIndexRange={[5, 0]}>
                    <div className="font-display font-black text-3xl px-3 py-1 rounded-lg shadow bg-red-700 text-white">
                        Sovjetunionen
                    </div>
                </Html>
            )}
            {biter.map((b, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                    position={[b.x, 3.2 + b.y, 0]}
                >
                    <boxGeometry args={[0.68 * b.s + 0.1, 0.58, 0.25]} />
                    <meshStandardMaterial
                        ref={(m) => {
                            mats.current[i] = m;
                        }}
                        color="#b91c1c"
                        emissive="#7f1d1d"
                        emissiveIntensity={0.3}
                        transparent
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Folkeavstemningen: en valgurne, og ti stemmesedler der ni er for selvstendighet. */
function Avstemning({ beat }: { beat: number }) {
    if (beat < 3) return null;
    return (
        <group position={[1.6, 0, 2.2]}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.2, 1, 0.9]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            <mesh position={[0, 1.01, 0]}>
                <boxGeometry args={[0.6, 0.02, 0.08]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            {beat >= 4 &&
                Array.from({ length: 10 }, (_, i) => (
                    <group key={i} position={[-2.9 + i * 0.65, 0, 1.3]}>
                        <mesh position={[0, 0.45, 0]}>
                            <boxGeometry args={[0.45, 0.9, 0.05]} />
                            <meshStandardMaterial
                                color={i < 9 ? '#facc15' : '#94a3b8'}
                                emissive={i < 9 ? '#a16207' : '#000000'}
                                emissiveIntensity={0.3}
                            />
                        </mesh>
                        {i < 9 && (
                            <mesh position={[0, 0.66, 0.03]}>
                                <boxGeometry args={[0.45, 0.4, 0.02]} />
                                <meshStandardMaterial color="#2563eb" />
                            </mesh>
                        )}
                    </group>
                ))}
        </group>
    );
}

/** Atomvåpnene ved 1994-lenken. De synker ned og blir borte. */
function Atom({ beat }: { beat: number }) {
    const grp = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        const g = grp.current;
        if (!g) return;
        const borte = beat >= 1;
        g.position.y = damp(g.position.y, borte ? -3 : 0, 1.6, dt);
        g.scale.setScalar(damp(g.scale.x, borte ? 0.01 : 1, 1.6, dt));
    });
    const raketter = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => ({
                x: (i % 7) * 0.55 - 1.65,
                z: Math.floor(i / 7) * 0.7 + 1.8 + (i % 2) * 0.15,
            })),
        []
    );
    return (
        <group position={[lenkeX(1), 0, 0]}>
            <group ref={grp}>
                {raketter.map((r, i) => (
                    <group key={i} position={[r.x, 0, r.z]}>
                        <mesh position={[0, 0.55, 0]}>
                            <cylinderGeometry args={[0.13, 0.13, 1.1, 12]} />
                            <meshStandardMaterial color="#cbd5e1" />
                        </mesh>
                        <mesh position={[0, 1.25, 0]}>
                            <coneGeometry args={[0.13, 0.35, 12]} />
                            <meshStandardMaterial color="#64748b" />
                        </mesh>
                    </group>
                ))}
            </group>
        </group>
    );
}

/** Folkemengden i Kyiv: mange små lys, for mange til å telle. */
function Folk({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const N = 420;
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < N; i++) {
            const a = fro(i) * Math.PI * 2;
            const r = Math.sqrt(fro(i + 999)) * 3.2;
            o.position.set(lenkeX(3) + Math.cos(a) * r * 1.4, 0.25, 3.4 + Math.sin(a) * r * 0.7);
            o.scale.setScalar(0.8 + fro(i + 77) * 0.4);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            m.setColorAt(i, new THREE.Color(fro(i + 5) > 0.5 ? '#facc15' : '#3b82f6'));
        }
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, []);
    return (
        <instancedMesh
            ref={ref}
            args={[undefined, undefined, N]}
            visible={synlig}
            frustumCulled={false}
        >
            <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
            <meshStandardMaterial emissive="#334155" emissiveIntensity={0.2} />
        </instancedMesh>
    );
}

/** 2021: soldater og kjøretøy samlet langs grensen. Tett og utellbar. */
function Grense({ beat }: { beat: number }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const N = 900;
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < N; i++) {
            const x = (fro(i) - 0.5) * 34;
            const z = -2.2 - Math.pow(fro(i + 300), 1.6) * 9;
            o.position.set(x, 0.18, z);
            o.rotation.set(0, (fro(i + 41) - 0.5) * 0.5, 0);
            o.scale.set(1, 1, 1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <group>
            {/* Russland bak grensa, Ukraina foran */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
                <planeGeometry args={[60, 16]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 8]}>
                <planeGeometry args={[60, 16]} />
                <meshStandardMaterial color="#d9c27a" />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
                <boxGeometry args={[60, 0.08, 0.25]} />
                <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.6} />
            </mesh>
            <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
                <boxGeometry args={[0.55, 0.32, 0.3]} />
                <meshStandardMaterial color="#3f4f2a" />
            </instancedMesh>
            {beat >= 3 && (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, 0.03, 2.6]}>
                        <circleGeometry args={[2.2, 40]} />
                        <meshStandardMaterial color="#dc2626" transparent opacity={0.55} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[13.5, 0.03, 2.4]}>
                        <circleGeometry args={[2, 40]} />
                        <meshStandardMaterial color="#dc2626" transparent opacity={0.55} />
                    </mesh>
                </>
            )}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    const grense = modus === 'grense';
    return (
        <>
            <color attach="background" args={[grense ? '#cbd5e1' : '#0f172a']} />
            <fog attach="fog" args={[grense ? '#cbd5e1' : '#0f172a', 18, 60]} />
            <ambientLight intensity={grense ? 1.1 : 0.7} />
            <directionalLight position={[8, 14, 10]} intensity={grense ? 1.6 : 1.4} />
            <pointLight position={[0, 6, 6]} intensity={grense ? 0 : 30} color="#fde68a" />
            {grense ? (
                <Grense beat={beat} />
            ) : (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, -0.6, 0]}>
                        <planeGeometry args={[80, 40]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    <Kjede modus={modus} beat={beat} />
                    {modus === '1991' && <Plate beat={beat} />}
                    {modus === '1991' && <Avstemning beat={beat} />}
                    {modus === '1994' && <Atom beat={beat} />}
                    {modus === '2008' && <Folk synlig={beat === 2} />}
                </>
            )}
        </>
    );
}

const BRIKKER: Record<Modus, { tekst: string; farge?: 'rod' | 'mork' | 'gul' }[]> = {
    '1991': [
        { tekst: 'Lenke 1: 1991', farge: 'gul' },
        { tekst: 'Sovjetunionen går i oppløsning', farge: 'rod' },
        { tekst: '24. august 1991: Ukraina blir selvstendig', farge: 'gul' },
        { tekst: 'Folkeavstemning 1. desember 1991' },
        { tekst: '90 prosent stemte for selvstendighet', farge: 'gul' },
    ],
    '1994': [
        { tekst: '1994: atomvåpen fra Sovjetunionen' },
        { tekst: 'Russland lover å respektere Ukrainas grenser', farge: 'gul' },
        { tekst: 'Løftet holdt ikke', farge: 'rod' },
    ],
    '2008': [
        { tekst: 'April 2008: NATO åpner døra for Ukraina' },
        { tekst: 'November 2013: nei til EU-avtalen' },
        { tekst: 'Store protester i Kyiv', farge: 'gul' },
        { tekst: '22. februar 2014: presidenten flykter' },
        { tekst: 'To syn på det som skjedde', farge: 'mork' },
    ],
    grense: [
        { tekst: '2021: om lag 130 000 soldater ved grensen', farge: 'rod' },
        { tekst: 'Russland: bare militærøvelser', farge: 'mork' },
        { tekst: 'Desember 2021: krav om løfte, aldri NATO' },
        { tekst: 'Tre dager før: områdene i øst anerkjent som egne land', farge: 'rod' },
    ],
};

export function UkrainaKjede({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? '1991';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = BRIKKER[modus];
    const brikke = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [10, 7, 22] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <Brikke key={`${modus}-${beat}`} {...brikke} />
            </AnimatePresence>
            {modus === '1991' && beat === 2 && (
                <Merke tekst="Ukraina" farge="#facc15" style={{ left: '58%', top: '30%' }} />
            )}
            {modus === '2008' && beat === 0 && (
                <Merke
                    tekst="Russland: en trussel"
                    farge="#fecaca"
                    style={{ left: '8%', bottom: '10%' }}
                />
            )}
            {modus === '2008' && beat === 2 && (
                <Merke
                    tekst="Protester i Kyiv"
                    farge="#facc15"
                    style={{ right: '8%', bottom: '10%' }}
                />
            )}
            {modus === '2008' && beat === 4 && (
                <div
                    className="absolute inset-x-0 flex justify-center gap-6"
                    style={{ bottom: '8%' }}
                >
                    <Kort
                        overskrift="Russland:"
                        tekst="et statskupp styrt fra Vesten"
                        farge="#b91c1c"
                    />
                    <Kort
                        overskrift="Mange ukrainere:"
                        tekst="en seier for demokratiet"
                        farge="#1d4ed8"
                        forsinkelse={0.9}
                    />
                </div>
            )}
            {modus === 'grense' && (
                <>
                    {beat <= 2 && (
                        <Merke
                            tekst="Russland"
                            farge="#e5e7eb"
                            style={{ left: '6%', top: '24%' }}
                        />
                    )}
                    {beat <= 2 && (
                        <Merke
                            tekst="Ukraina"
                            farge="#fde68a"
                            style={{ left: '6%', bottom: '8%' }}
                        />
                    )}
                    {beat >= 3 && (
                        <Merke
                            tekst="Donetsk og Luhansk (omtrentlig)"
                            farge="#fecaca"
                            style={{ right: '6%', bottom: '8%' }}
                        />
                    )}
                </>
            )}
        </div>
    );
}

function Merke({ tekst, farge, style }: { tekst: string; farge: string; style: CSSProperties }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute px-4 py-1.5 rounded-xl font-display font-black text-3xl shadow-lg text-slate-900"
            style={{ background: farge, ...style }}
        >
            {tekst}
        </motion.div>
    );
}

function Kort({
    overskrift,
    tekst,
    farge,
    forsinkelse = 0.3,
}: {
    overskrift: string;
    tekst: string;
    farge: string;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
            className="rounded-2xl bg-white/95 shadow-xl px-6 py-4"
            style={{ borderTop: `8px solid ${farge}`, width: 400 }}
        >
            <div className="font-display font-black text-3xl" style={{ color: farge }}>
                {overskrift}
            </div>
            <div className="font-display font-bold text-3xl text-slate-900">{tekst}</div>
        </motion.div>
    );
}
