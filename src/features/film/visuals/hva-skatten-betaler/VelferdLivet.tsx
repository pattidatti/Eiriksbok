import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Livsveien i 3D: en vei gjennom livet med sykehus, barnehage, skole, arbeidsplass og
 * eldrehjem. Fire moduser:
 * - livet: en person går langs veien, og velferdsstaten hjelper på hvert sted.
 * - former: tjenester (byggene lyser) mot overføringer (mynter som faller ned i husene).
 * - total: et enormt myntårn på 2685 milliarder kroner, så delt på alle som bor i landet.
 * - poster: seks myntårn, ett per post, i riktig forhold til hverandre.
 */

type Modus = 'livet' | 'former' | 'total' | 'poster';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    livet: [
        'Velferd: å ha det trygt og godt',
        'Hjelp når du blir syk',
        'Hjelp når du mister jobben og blir gammel',
        'Rett til utdanning for alle',
    ],
    former: [
        'Hjelpen kommer i to former',
        'Tjenester: noe de gjør for deg',
        'Overføringer: penger inn på kontoen',
        'Overføringer: penger inn på kontoen',
    ],
    total: [
        'Det offentlige brukte 2 685 milliarder kroner i 2025',
        'Nesten umulig å se for seg',
        '5 627 400 innbyggere',
        'Nesten en halv million kroner per person i året',
    ],
    poster: [
        'De største postene i 2025',
        'De største postene i 2025',
        'De største postene i 2025',
        'De største postene i 2025',
        'De største postene i 2025',
    ],
};

// ---------- Livsveien ----------

type StedId = 'sykehus' | 'barnehage' | 'skole' | 'arbeid' | 'eldrehjem';

interface Sted {
    id: StedId;
    navn: string;
    pos: THREE.Vector3;
    str: [number, number, number];
    farge: string;
    tak: string;
}

const STEDER: Sted[] = [
    {
        id: 'sykehus',
        navn: 'Sykehus',
        pos: v(-15, 0, -4),
        str: [4.6, 5.2, 3.6],
        farge: '#f8fafc',
        tak: '#dc2626',
    },
    {
        id: 'barnehage',
        navn: 'Barnehage',
        pos: v(-8, 0, -4),
        str: [4.2, 2.4, 3.2],
        farge: '#fde68a',
        tak: '#ea580c',
    },
    {
        id: 'skole',
        navn: 'Skole',
        pos: v(-1, 0, -4),
        str: [5.6, 3.4, 3.6],
        farge: '#fed7aa',
        tak: '#9a3412',
    },
    {
        id: 'arbeid',
        navn: 'Arbeidsplass',
        pos: v(6, 0, -4),
        str: [4.2, 4.6, 3.6],
        farge: '#cbd5e1',
        tak: '#334155',
    },
    {
        id: 'eldrehjem',
        navn: 'Eldreomsorg',
        pos: v(13, 0, -4),
        str: [5.2, 3, 3.6],
        farge: '#fbcfe8',
        tak: '#9d174d',
    },
];

/** Hvilke steder som lyser i hver beat av livet-modusen. */
function lyserILivet(id: StedId, beat: number) {
    if (beat === 1) return id === 'sykehus';
    if (beat === 2) return id === 'arbeid' || id === 'eldrehjem';
    if (beat === 3) return id === 'skole';
    return false;
}

/** Hvor personen står i livet-modusen. */
function personILivet(beat: number) {
    if (beat === 1) return v(-15, 0, -0.6);
    if (beat === 2) return v(6, 0, -0.6);
    if (beat === 3) return v(-1, 0, -0.6);
    return v(-19, 0, 0);
}

const HJEM = [
    { pos: v(-8, 0, 7), navn: 'Barnetrygd' },
    { pos: v(0, 0, 7), navn: 'Pensjon' },
    { pos: v(8, 0, 7), navn: 'Dagpenger' },
];

function Bygg({ s, lys, dempet = false }: { s: Sted; lys: boolean; dempet?: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (mat.current)
            mat.current.emissiveIntensity = damp(
                mat.current.emissiveIntensity,
                lys ? 0.45 : 0,
                4,
                Math.min(dt, 0.1)
            );
    });
    return (
        <group position={s.pos}>
            <mesh position={[0, s.str[1] / 2, 0]}>
                <boxGeometry args={s.str} />
                <meshStandardMaterial
                    ref={mat}
                    color={dempet ? '#cbd5e1' : s.farge}
                    emissive="#facc15"
                    emissiveIntensity={0}
                    flatShading
                />
            </mesh>
            <mesh position={[0, s.str[1] + 0.15, 0]}>
                <boxGeometry args={[s.str[0] + 0.3, 0.3, s.str[2] + 0.3]} />
                <meshStandardMaterial color={dempet ? '#94a3b8' : s.tak} />
            </mesh>
            {/* Vinduer */}
            {[-1, 0, 1].map((i) => (
                <mesh
                    key={i}
                    position={[i * (s.str[0] / 3.2), s.str[1] * 0.55, s.str[2] / 2 + 0.02]}
                >
                    <boxGeometry args={[0.7, 0.7, 0.04]} />
                    <meshStandardMaterial
                        color="#1e3a5f"
                        emissive="#fde68a"
                        emissiveIntensity={lys ? 0.8 : 0.05}
                    />
                </mesh>
            ))}
            {s.id === 'sykehus' && (
                <group position={[0, s.str[1] * 0.85, s.str[2] / 2 + 0.04]}>
                    <mesh>
                        <boxGeometry args={[1.3, 0.4, 0.05]} />
                        <meshBasicMaterial color="#dc2626" />
                    </mesh>
                    <mesh>
                        <boxGeometry args={[0.4, 1.3, 0.05]} />
                        <meshBasicMaterial color="#dc2626" />
                    </mesh>
                </group>
            )}
        </group>
    );
}

function Hjem({ pos }: { pos: THREE.Vector3 }) {
    return (
        <group position={pos}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[2.6, 2, 2.4]} />
                <meshStandardMaterial color="#fef3c7" flatShading />
            </mesh>
            <mesh position={[0, 2.65, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[2.1, 1.3, 4]} />
                <meshStandardMaterial color="#b45309" flatShading />
            </mesh>
            <mesh position={[0, 0.6, 1.22]}>
                <boxGeometry args={[0.6, 1.2, 0.04]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
        </group>
    );
}

function Person({ pos, farge = '#2563eb' }: { pos: THREE.Vector3; farge?: string }) {
    return (
        <group position={pos}>
            <mesh position={[0, 0.85, 0]}>
                <capsuleGeometry args={[0.38, 0.9, 4, 10]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 1.95, 0]}>
                <sphereGeometry args={[0.34, 16, 12]} />
                <meshStandardMaterial color="#f5d0a9" />
            </mesh>
        </group>
    );
}

/** Mynter som faller ned mot et hus i en sløyfe. Står stille på pause. */
function Myntregn({
    mål,
    aktiv,
    playing,
}: {
    mål: THREE.Vector3;
    aktiv: boolean;
    playing: boolean;
}) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        if (playing) tid.current += Math.min(rawDt, 0.05);
        refs.current.forEach((m, i) => {
            if (!m) return;
            const fase = (tid.current * 0.55 + i / 5) % 1;
            m.position.set(
                mål.x + Math.sin(i * 2.1) * 0.6,
                mål.y + 4 - fase * 4,
                mål.z + Math.cos(i * 1.7) * 0.4
            );
            m.rotation.set(Math.PI / 2, 0, tid.current * 2 + i);
            m.visible = aktiv;
        });
    });
    return (
        <>
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                >
                    <cylinderGeometry args={[0.6, 0.6, 0.14, 20]} />
                    <meshStandardMaterial
                        color="#f59e0b"
                        emissive="#b45309"
                        emissiveIntensity={0.3}
                        metalness={0.3}
                        roughness={0.4}
                    />
                </mesh>
            ))}
        </>
    );
}

// ---------- Myntårn ----------

const MYNT_H = 0.1;

/** Et tårn av mynter som bygges opp mynt for mynt når det er aktivt. */
function Myntarn({
    pos,
    hoyde,
    radius,
    aktiv,
    playing,
    farge = '#f59e0b',
}: {
    pos: THREE.Vector3;
    hoyde: number;
    radius: number;
    aktiv: boolean;
    playing: boolean;
    farge?: string;
}) {
    const antall = Math.max(1, Math.round(hoyde / MYNT_H));
    const ref = useRef<THREE.InstancedMesh>(null);
    const vekst = useRef(-1);
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < antall; i++) {
            o.position.set(
                pos.x + Math.sin(i * 1.3) * 0.04,
                i * MYNT_H + MYNT_H / 2,
                pos.z + Math.cos(i * 0.9) * 0.04
            );
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    }, [antall, pos]);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const mål = aktiv ? 1 : 0;
        // Første bilde hopper rett til målet, så et hopp til en senere beat viser hele tårnet.
        if (vekst.current < 0) vekst.current = mål;
        const dt = playing ? Math.min(rawDt, 0.05) : 0.5;
        vekst.current = aktiv
            ? Math.min(1, vekst.current + dt * 0.7)
            : damp(vekst.current, 0, 5, dt);
        m.count = Math.round(antall * vekst.current);
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
            <cylinderGeometry args={[radius, radius, MYNT_H * 0.85, 28]} />
            <meshStandardMaterial
                color={farge}
                emissive="#92400e"
                emissiveIntensity={0.25}
                metalness={0.35}
                roughness={0.45}
            />
        </instancedMesh>
    );
}

interface Post {
    navn: string;
    belop: number;
    fraBeat: number;
}

const POSTER: Post[] = [
    { navn: 'Pensjon og sosiale ytelser', belop: 1049, fraBeat: 1 },
    { navn: 'Helse', belop: 392, fraBeat: 2 },
    { navn: 'Utdanning', belop: 255, fraBeat: 3 },
    { navn: 'Forsvar', belop: 172, fraBeat: 3 },
    { navn: 'Fritid, kultur og religion', belop: 79, fraBeat: 4 },
    { navn: 'Orden og trygghet', belop: 59, fraBeat: 4 },
];
const POST_SKALA = 12 / 1049;
const POST_X = (i: number) => -11.5 + i * 4.6;

// ---------- Mengden ----------

const MENGDE: THREE.Vector3[] = (() => {
    const ut: THREE.Vector3[] = [];
    for (let r = 0; r < 12; r++) {
        for (let k = 0; k < 34; k++) {
            const x = -24 + k * 1.45 + (r % 2) * 0.7 + Math.sin(r * 7 + k * 3) * 0.25;
            const z = 6 + r * 1.5 + Math.cos(r * 5 + k) * 0.25;
            if (Math.abs(x) < 4.2 && z < 10.5) continue;
            ut.push(v(x, 0, z));
        }
    }
    return ut;
})();
const MENGDE_FARGER = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#475569'];

function Mengden({ vis, mynter }: { vis: boolean; mynter: boolean }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const mynt = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const o = new THREE.Object3D();
        const c = new THREE.Color();
        MENGDE.forEach((p, i) => {
            o.position.set(p.x, 0.85, p.z);
            o.rotation.set(0, 0, 0);
            o.updateMatrix();
            kropp.current?.setMatrixAt(i, o.matrix);
            kropp.current?.setColorAt(i, c.set(MENGDE_FARGER[i % MENGDE_FARGER.length]));
            o.position.set(p.x, 2.6, p.z);
            o.rotation.set(Math.PI / 2, 0, 0);
            o.updateMatrix();
            mynt.current?.setMatrixAt(i, o.matrix);
        });
        if (kropp.current) {
            kropp.current.instanceMatrix.needsUpdate = true;
            if (kropp.current.instanceColor) kropp.current.instanceColor.needsUpdate = true;
        }
        if (mynt.current) mynt.current.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <>
            <instancedMesh
                ref={kropp}
                args={[undefined, undefined, MENGDE.length]}
                frustumCulled={false}
                visible={vis}
            >
                <capsuleGeometry args={[0.4, 1, 3, 8]} />
                <meshStandardMaterial color="#ffffff" />
            </instancedMesh>
            <instancedMesh
                ref={mynt}
                args={[undefined, undefined, MENGDE.length]}
                frustumCulled={false}
                visible={vis && mynter}
            >
                <cylinderGeometry args={[0.45, 0.45, 0.12, 16]} />
                <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.45} />
            </instancedMesh>
        </>
    );
}

// ---------- Kamera ----------

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'livet') {
        switch (beat) {
            case 0:
                return { pos: v(-6 + t * 0.15, 13, 24), se: v(-1, 1.5, -2) };
            case 1:
                return { pos: v(-11, 6, 11), se: v(-15, 2.4, -3) };
            case 2:
                return { pos: v(9.5, 9, 21), se: v(9.5, 2.6, -3) };
            default:
                return { pos: v(-1 + Math.sin(t * 0.1) * 6, 15, 26), se: v(-1, 1.5, -2) };
        }
    }
    if (modus === 'former') {
        switch (beat) {
            case 0:
                return { pos: v(0, 15, 27), se: v(-1, 1.5, 1) };
            case 1:
                return { pos: v(-1, 13, 26), se: v(-1, 2, -3) };
            default:
                return { pos: v(0, 9, 22), se: v(0, 3.2, 6) };
        }
    }
    if (modus === 'total') {
        switch (beat) {
            case 0:
                return { pos: v(0, 12, 46), se: v(0, 12, 0) };
            case 1:
                return { pos: v(-14, 12, 52), se: v(0, 13, -2) };
            case 2:
                return { pos: v(0, 16, 46), se: v(0, 7, 6) };
            default:
                return { pos: v(0, 12, 32), se: v(0, 1.5, 11) };
        }
    }
    // poster
    if (beat === 0) return { pos: v(0, 6, 25), se: v(0, 2, 0) };
    return { pos: v(0, 6.5, 30), se: v(0, 4.6, 0) };
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mål = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        se.current.lerp(mål.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Merke({
    tekst,
    tone = 'vanlig',
}: {
    tekst: string;
    tone?: 'gull' | 'gronn' | 'vanlig' | 'bla';
}) {
    const farge = {
        gull: 'border-amber-500 text-amber-800',
        gronn: 'border-teal-500 text-teal-800',
        bla: 'border-blue-500 text-blue-800',
        vanlig: 'border-slate-300 text-slate-800',
    }[tone];
    return (
        <div
            className={`px-3 py-1 rounded-xl bg-white/95 shadow-lg border-2 font-bold whitespace-nowrap text-2xl ${farge}`}
        >
            {tekst}
        </div>
    );
}

function formatMrd(n: number) {
    return n >= 1000 ? `${Math.floor(n / 1000)} ${String(n % 1000).padStart(3, '0')}` : String(n);
}

// ---------- Scenen ----------

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const visBy = modus === 'livet' || modus === 'former' || modus === 'total';
    const [totalPos] = useState(() => v(0, 0, 2));
    return (
        <>
            <color attach="background" args={['#dbeafe']} />
            <fog attach="fog" args={['#dbeafe', 60, 130]} />
            <ambientLight intensity={0.65} />
            <directionalLight position={[20, 30, 15]} intensity={1.4} color="#fff7e6" />
            <hemisphereLight args={['#e0f2fe', '#4b5563', 0.5]} />

            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[160, 160]} />
                <meshStandardMaterial color="#9cc47f" />
            </mesh>

            {visBy && (
                <>
                    {/* Livsveien */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, 0.02, 0]}>
                        <planeGeometry args={[40, 2.4]} />
                        <meshStandardMaterial color="#d6c7a1" />
                    </mesh>
                    {STEDER.map((s) => (
                        <Bygg
                            key={s.id}
                            s={s}
                            lys={
                                modus === 'livet'
                                    ? lyserILivet(s.id, beat)
                                    : modus === 'former' && beat === 1 && s.id !== 'arbeid'
                            }
                            dempet={
                                modus === 'former' &&
                                (beat >= 2 || (beat === 1 && s.id === 'arbeid'))
                            }
                        />
                    ))}
                </>
            )}

            {modus === 'livet' && (
                <>
                    <Person pos={personILivet(beat)} />
                    {beat === 2 && <Person pos={v(13, 0, -0.6)} farge="#7c3aed" />}
                    <Myntregn mål={v(6, 2.4, -0.6)} aktiv={beat === 2} playing={playing} />
                    <Myntregn mål={v(13, 2.4, -0.6)} aktiv={beat === 2} playing={playing} />
                    {beat === 1 && (
                        <Html position={[-12.4, 1.6, -0.6]} center zIndexRange={[10, 0]}>
                            <Merke tekst="Syk" tone="gronn" />
                        </Html>
                    )}
                    {beat === 2 && (
                        <>
                            <Html position={[3.4, 1.2, 0.6]} center zIndexRange={[10, 0]}>
                                <Merke tekst="Mister jobben" tone="gronn" />
                            </Html>
                            <Html position={[15.6, 1.2, 0.6]} center zIndexRange={[10, 0]}>
                                <Merke tekst="Gammel" tone="gronn" />
                            </Html>
                        </>
                    )}
                    {beat === 3 && (
                        <Html position={[-1, 5.4, -4]} center zIndexRange={[10, 0]}>
                            <Merke tekst="Skole for alle" tone="gronn" />
                        </Html>
                    )}
                </>
            )}

            {modus === 'former' && (
                <>
                    {HJEM.map((h) => (
                        <Hjem key={h.navn} pos={h.pos} />
                    ))}
                    {HJEM.map((h) => (
                        <Myntregn
                            key={h.navn}
                            mål={v(h.pos.x, 3.2, h.pos.z)}
                            aktiv={beat >= 2}
                            playing={playing}
                        />
                    ))}
                    {beat === 1 &&
                        STEDER.filter((s) => s.id !== 'arbeid').map((s) => (
                            <Html
                                key={s.id}
                                position={[s.pos.x, s.str[1] + 1.4, s.pos.z]}
                                center
                                zIndexRange={[10, 0]}
                            >
                                <Merke tekst={s.navn} tone="gronn" />
                            </Html>
                        ))}
                    {beat === 3 &&
                        HJEM.map((h) => (
                            <Html
                                key={h.navn}
                                position={[h.pos.x, -0.4, h.pos.z + 1.6]}
                                center
                                zIndexRange={[10, 0]}
                            >
                                <Merke tekst={h.navn} tone="gull" />
                            </Html>
                        ))}
                </>
            )}

            {modus === 'total' && (
                <>
                    <Myntarn
                        pos={totalPos}
                        hoyde={26}
                        radius={3.2}
                        aktiv={beat <= 2}
                        playing={playing}
                    />
                    <Mengden vis={beat >= 2} mynter={beat >= 3} />
                    {beat === 0 && (
                        <Html position={[3.8, 9, 2]} zIndexRange={[10, 0]}>
                            <Merke tekst="Staten + fylkene + kommunene" tone="gull" />
                        </Html>
                    )}
                </>
            )}

            {modus === 'poster' &&
                POSTER.map((p, i) => {
                    const pos = v(POST_X(i), 0, 0);
                    const h = p.belop * POST_SKALA;
                    return (
                        <group key={p.navn}>
                            <mesh position={[pos.x, 0.05, 0]}>
                                <cylinderGeometry args={[1.75, 1.75, 0.1, 32]} />
                                <meshStandardMaterial color="#94a3b8" />
                            </mesh>
                            <Myntarn
                                pos={pos}
                                hoyde={h}
                                radius={1.5}
                                aktiv={beat >= p.fraBeat}
                                playing={playing}
                            />
                            {beat >= p.fraBeat && (
                                <Html position={[pos.x, h + 1.1, 0]} center zIndexRange={[10, 0]}>
                                    <Merke
                                        tekst={`${formatMrd(p.belop)} mrd.`}
                                        tone={p.fraBeat === beat ? 'gull' : 'vanlig'}
                                    />
                                </Html>
                            )}
                            <Html position={[pos.x, 0, 6]} center zIndexRange={[10, 0]}>
                                <div
                                    className="text-center font-bold text-slate-800 text-xl leading-tight"
                                    style={{ width: 160, marginTop: i % 2 === 0 ? 0 : 56 }}
                                >
                                    {p.navn}
                                </div>
                            </Html>
                        </group>
                    );
                })}

            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

export function VelferdLivet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'livet';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 12, 26] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '5%' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
