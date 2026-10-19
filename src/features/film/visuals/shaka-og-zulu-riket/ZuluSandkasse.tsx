import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Overskrift } from './kartFelles';

/**
 * Sandkassa: et modellbord med fjellet Isandlwana, den britiske leiren og brikker for
 * hærene, slik en offiser ville vist slaget. Brikker, ikke mennesker: ingen kamp vises,
 * bare hvor hærene står. «leir»: leiren uten vegg, og zuluene på åsen. «horn»:
 * bøffelhornene. «slag»: Chelmsford drar, hornene lukker seg rundt leiren. «delt»: Ulundi,
 * og riket som deles i tretten biter.
 *
 * Alt glir mot et mål per beat, så eleven kan hoppe rett til en hvilken som helst beat.
 */

type Modus = 'leir' | 'horn' | 'slag' | 'delt';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const LEIR = v(6, 0, 4);
const FJELL = v(-20, 0, -6);
const HORN_MAL = v(34, 0, 16);
const KRAAL = v(0, 0, 0);

/** Åsen i nord: en lang, flat ellipsoide. Gir høyden der en brikke står. */
const ASEN = { z: -34, bredde: 60, dybde: 5, hoyde: 2.2 };
function hoyde(x: number, z: number) {
    const q = 1 - (x / ASEN.bredde) ** 2 - ((z - ASEN.z) / ASEN.dybde) ** 2;
    return q > 0 ? ASEN.hoyde * Math.sqrt(q) : 0;
}

const N_BRIT = 24;
const N_ZULU = 84;
const N_FIENDE = 18;

type Mal = [number, number, boolean]; // x, z, synlig

/** Brikkene i en ring rundt et punkt: fra vinkel a0 til a1 (0 = nord, mot -z). */
function ring(c: THREE.Vector3, i: number, n: number, r: number, a0: number, a1: number): Mal {
    const lag = i % 2;
    const j = Math.floor(i / 2);
    const k = Math.max(1, Math.ceil(n / 2) - 1);
    const a = a0 + ((a1 - a0) * j) / k;
    const rr = r + lag * 1.6;
    return [c.x + Math.sin(a) * rr, c.z - Math.cos(a) * rr, true];
}

/** Bøffelhodet: brystet foran, to horn ut på sidene. `fram` flytter hele hodet mot fienden. */
function bøffel(c: THREE.Vector3, i: number, brystFram: number, hornFram: number): Mal {
    if (i < 36) {
        const kol = i % 9;
        const rad = Math.floor(i / 9);
        return [c.x - 6.4 + kol * 1.6, c.z - 16 + brystFram - rad * 1.6, true];
    }
    const side = i < 60 ? -1 : 1;
    const j = (i - 36) % 24;
    const t = Math.floor(j / 2) / 11;
    const bredde = (j % 2) * 1.5;
    return [c.x + side * (8 + bredde + 5 * Math.sin(t * Math.PI * 0.55)), c.z - 16 + hornFram + 13 * t, true];
}

/** Omringet: brystet foran, hornene rundt på begge sider til de møtes bak. */
function omringet(c: THREE.Vector3, i: number, r: number): Mal {
    if (i < 36) return ring(c, i, 36, r, -0.9, 0.9);
    if (i < 60) return ring(c, i - 36, 24, r, -1.0, -Math.PI);
    return ring(c, i - 60, 24, r, 1.0, Math.PI);
}

const SKJULT: Mal = [0, -70, false];

function zuluMal(modus: Modus, beat: number, i: number): Mal {
    if (modus === 'leir') {
        if (beat < 3) return SKJULT;
        return [-30 + (i % 28) * 2.2, -35.5 + Math.floor(i / 28) * 1.7, true];
    }
    if (modus === 'horn') {
        if (beat === 0) return bøffel(HORN_MAL, i, 0, 0);
        if (beat === 1) return bøffel(HORN_MAL, i, 9, 3);
        return omringet(HORN_MAL, i, beat >= 3 ? 5.5 : 6.5);
    }
    if (modus === 'slag') {
        if (beat < 3) return SKJULT;
        return omringet(LEIR, i, beat >= 4 ? 10.5 : 13);
    }
    // delt: hæren står foran kraalen i beat 0, så er den borte.
    if (beat === 0 && i < 48) return [KRAAL.x - 9 + (i % 12) * 1.6, KRAAL.z - 12 - Math.floor(i / 12) * 1.6, true];
    return SKJULT;
}

function britMal(modus: Modus, beat: number, i: number): Mal {
    const iLeir: Mal = [LEIR.x - 8 + (i % 8) * 2.3, LEIR.z + 7 + Math.floor(i / 8) * 1.6, true];
    if (modus === 'leir') return iLeir;
    if (modus === 'slag') {
        if (beat === 0) return iLeir;
        if (i < 16) return [44 + (i % 4) * 1.8, 30 + Math.floor(i / 4) * 1.8, true];
        // De som ble igjen: spredt i leiren. I siste beat er de borte fra brettet.
        return [LEIR.x - 6 + (i % 4) * 4, LEIR.z - 1 + Math.floor((i - 16) / 4) * 4, beat < 4];
    }
    if (modus === 'delt' && beat === 0) {
        const kol = i % 8;
        const rad = Math.floor(i / 8);
        return [KRAAL.x - 6 + kol * 1.7, KRAAL.z + 12 + rad * 1.7, true];
    }
    return [0, 70, false];
}

function fiendeMal(modus: Modus, i: number): Mal {
    if (modus !== 'horn') return [0, 70, false];
    const a = i * 2.4;
    const r = 1 + Math.sqrt(i / N_FIENDE) * 2.6;
    return [HORN_MAL.x + Math.cos(a) * r, HORN_MAL.z + Math.sin(a) * r, true];
}

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'leir') {
        switch (beat) {
            case 0:
                return { pos: v(44 - t * 0.4, 20, 46), se: v(-8, 4, -4) };
            case 1:
                return { pos: v(22, 9, 26), se: v(4, 1, 4) };
            case 2:
                return { pos: v(8, 30, 26), se: v(6, 0, 4) };
            default:
                return { pos: v(14, 14, 16), se: v(-2, 1, -26) };
        }
    }
    if (modus === 'horn') {
        const c = HORN_MAL;
        switch (beat) {
            case 0:
                return { pos: v(c.x + 2, 30, c.z + 30), se: v(c.x, 0, c.z - 7) };
            case 1:
                return { pos: v(c.x + 4, 28, c.z + 28), se: v(c.x, 0, c.z - 4) };
            case 2:
                return { pos: v(c.x + 6, 32, c.z + 24), se: v(c.x, 0, c.z) };
            default:
                return { pos: v(c.x + 1, 42, c.z + 12), se: v(c.x, 0, c.z) };
        }
    }
    if (modus === 'slag') {
        switch (beat) {
            case 0:
                return { pos: v(44 - t * 0.4, 20, 46), se: v(-8, 4, -4) };
            case 1:
                return { pos: v(46, 34, 66), se: v(26, 0, 18) };
            case 2:
                return { pos: v(8, 30, 26), se: v(6, 0, 4) };
            case 3:
                return { pos: v(26, 50, 50), se: v(0, 0, 0) };
            default:
                return { pos: v(22, 40, 40), se: v(2, 0, 2) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(26, 26, 36), se: v(0, 0, 0) };
        case 1:
            return { pos: v(30, 30, 40), se: v(10, 0, 8) };
        default:
            return { pos: v(0, 58, 34 - t * 0.2), se: v(0, 0, 0) };
    }
}

/** Brikker av én farge, som instanser. Hver brikke glir mot målet sitt. */
function Brikker({
    antall,
    farge,
    topp,
    malFor,
    beat,
    modus,
    playing,
    hoydeBrikke = 0.9,
}: {
    antall: number;
    farge: string;
    topp: string;
    malFor: (i: number) => Mal;
    beat: number;
    modus: Modus;
    playing: boolean;
    hoydeBrikke?: number;
}) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const lokk = useRef<THREE.InstancedMesh>(null);
    const naa = useRef<{ x: number; z: number; s: number }[]>([]);
    const forste = useRef(true);
    const dummyRef = useRef(new THREE.Object3D());
    useEffect(() => {
        forste.current = true;
    }, [modus]);
    useFrame((_, delta) => {
        const k1 = kropp.current;
        const k2 = lokk.current;
        if (!k1 || !k2) return;
        const dummy = dummyRef.current;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const forsteBilde = forste.current;
        const k = forsteBilde ? 1 : 1 - Math.exp(-1.1 * dt);
        forste.current = false;
        for (let i = 0; i < antall; i++) {
            const [mx, mz, vis] = malFor(i);
            const n = naa.current[i] ?? (naa.current[i] = { x: mx, z: mz, s: vis ? 1 : 0 });
            // Usynlige brikker krymper der de står, så de ikke farer over brettet.
            if (vis) {
                n.x += (mx - n.x) * k;
                n.z += (mz - n.z) * k;
            }
            n.s += ((vis ? 1 : 0) - n.s) * (forsteBilde ? 1 : Math.min(1, k * 2));
            const y = hoyde(n.x, n.z);
            dummy.position.set(n.x, y + (hoydeBrikke / 2) * n.s, n.z);
            dummy.scale.set(n.s, n.s, n.s);
            dummy.updateMatrix();
            k1.setMatrixAt(i, dummy.matrix);
            dummy.position.y = y + (hoydeBrikke + 0.08) * n.s;
            dummy.updateMatrix();
            k2.setMatrixAt(i, dummy.matrix);
        }
        k1.instanceMatrix.needsUpdate = true;
        k2.instanceMatrix.needsUpdate = true;
    });
    // beat brukes av malFor via lukningen; den står her så brikkene oppdateres når den skifter.
    void beat;
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, antall]}>
                <cylinderGeometry args={[0.62, 0.7, hoydeBrikke, 10]} />
                <meshStandardMaterial color={farge} flatShading />
            </instancedMesh>
            <instancedMesh ref={lokk} args={[undefined, undefined, antall]}>
                <cylinderGeometry args={[0.5, 0.5, 0.16, 10]} />
                <meshStandardMaterial color={topp} />
            </instancedMesh>
        </>
    );
}

/** Isandlwana: et bratt fjell med en pukkel, som en liggende sfinks. */
function Fjell() {
    const geo = useMemo(() => {
        const s = new THREE.Shape();
        const pkt: [number, number][] = [
            [-13, 0],
            [-11.5, 4],
            [-9.5, 8],
            [-6, 9.6],
            [-2, 10],
            [1, 11.6],
            [4, 11.2],
            [7, 9.4],
            [9.2, 6.5],
            [10.6, 3],
            [12, 0],
        ];
        s.moveTo(pkt[0][0], pkt[0][1]);
        for (const [x, y] of pkt.slice(1)) s.lineTo(x, y);
        s.lineTo(-13, 0);
        const g = new THREE.ExtrudeGeometry(s, { depth: 9, bevelEnabled: true, bevelSize: 1.2, bevelThickness: 1.4, bevelSegments: 1 });
        g.translate(0, 0, -4.5);
        return g;
    }, []);
    useEffect(() => () => geo.dispose(), [geo]);
    return (
        <group position={FJELL.toArray()}>
            <mesh geometry={geo}>
                <meshStandardMaterial color="#7a6650" flatShading />
            </mesh>
            {/* Ur ved foten */}
            <mesh position={[0, 0.4, 0]} scale={[16, 2.4, 8]}>
                <sphereGeometry args={[1, 10, 6]} />
                <meshStandardMaterial color="#8c7a5e" flatShading />
            </mesh>
        </group>
    );
}

/** Teltene i leiren. */
function Telt() {
    const ref = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const d = new THREE.Object3D();
        let i = 0;
        for (let r = 0; r < 4; r++)
            for (let c = 0; c < 8; c++) {
                d.position.set(LEIR.x - 8 + c * 2.2 + (r % 2) * 0.6, 0.7, LEIR.z - 5 + r * 2.6);
                d.rotation.y = Math.PI / 4;
                d.updateMatrix();
                m.setMatrixAt(i++, d.matrix);
            }
        m.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, 32]}>
            <coneGeometry args={[0.9, 1.4, 4]} />
            <meshStandardMaterial color="#f8fafc" emissive="#94a3b8" emissiveIntensity={0.15} flatShading />
        </instancedMesh>
    );
}

/** Tretten biter av riket. Sitter sammen, skilles, og blir britiske. */
const BITER = (() => {
    const ut: { x: number; z: number; w: number; d: number }[] = [];
    const rader = [4, 5, 4];
    const D = 40 / 3;
    rader.forEach((n, r) => {
        let x = -30;
        const bredder = Array.from({ length: n }, (_, i) => 0.7 + ((i * 7 + r * 3) % 5) * 0.15);
        const sum = bredder.reduce((a, b) => a + b, 0);
        bredder.forEach((b) => {
            const w = (b / sum) * 60;
            ut.push({ x: x + w / 2, z: -20 + D * r + D / 2, w, d: D });
            x += w;
        });
    });
    return ut;
})();
const BITFARGER = ['#a3b18a', '#ccd5ae', '#d4a373', '#b5838d', '#e9c46a', '#84a59d', '#bc6c25', '#90a955', '#dda15e', '#6d597a', '#a5a58d', '#e5989b', '#8d99ae'];

function Biter({ beat, playing }: { beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const forste = useRef(true);
    const farger = useMemo(() => BITFARGER.map((f) => new THREE.Color(f)), []);
    const gull = useMemo(() => new THREE.Color('#c8a24a'), []);
    const rod = useMemo(() => new THREE.Color('#c0504d'), []);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const k = forste.current ? 1 : 1 - Math.exp(-1.4 * dt);
        forste.current = false;
        BITER.forEach((b, i) => {
            const m = refs.current[i];
            if (!m) return;
            const spredt = beat === 2 ? 1.22 : 1;
            m.position.x += (b.x * spredt - m.position.x) * k;
            m.position.z += (b.z * spredt - m.position.z) * k;
            const vri = beat === 2 ? ((i % 3) - 1) * 0.08 : 0;
            m.rotation.y += (vri - m.rotation.y) * k;
            const mål = beat <= 1 ? gull : beat === 2 ? farger[i] : rod;
            (m.material as THREE.MeshStandardMaterial).color.lerp(mål, k);
        });
    });
    return (
        <>
            {BITER.map((b, i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                    position={[b.x, 0.3, b.z]}
                >
                    <boxGeometry args={[b.w - 0.3, 0.6, b.d - 0.3]} />
                    <meshStandardMaterial color="#c8a24a" flatShading />
                </mesh>
            ))}
        </>
    );
}

/** Kraalen ved Ulundi: en ring av runde hus. */
function Kraal({ synlig }: { synlig: boolean }) {
    return (
        <group visible={synlig}>
            {Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                return (
                    <mesh key={i} position={[KRAAL.x + Math.cos(a) * 6, 0.6, KRAAL.z + Math.sin(a) * 6]} scale={[1, 0.8, 1]}>
                        <sphereGeometry args={[1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color="#b59a6a" flatShading />
                    </mesh>
                );
            })}
        </group>
    );
}

/** Cetshwayo: en gull-brikke som føres bort fra brettet. */
function Konge({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const k = forste.current ? 1 : 1 - Math.exp(-0.8 * dt);
        forste.current = false;
        const mål = beat === 0 ? v(0, 0, 0) : v(26, 0, 14);
        g.position.lerp(mål, k);
        g.visible = beat <= 1;
    });
    return (
        <group ref={ref}>
            <mesh position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.9, 1.0, 1.8, 12]} />
                <meshStandardMaterial color="#d4a017" emissive="#7c5a00" emissiveIntensity={0.3} />
            </mesh>
            {beat <= 1 && (
                <Html position={[0, 3.6, 0]} center zIndexRange={[10, 0]}>
                    <div className="px-3 py-1 rounded-xl bg-white/95 text-slate-900 font-bold text-xl whitespace-nowrap shadow">
                        {beat === 0 ? 'Cetshwayo' : 'Cetshwayo, i eksil'}
                    </div>
                </Html>
            )}
        </group>
    );
}

function Merkelapp({ pos, tekst, farge = 'text-slate-900' }: { pos: [number, number, number]; tekst: string; farge?: string }) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div className={`px-3 py-1 rounded-xl bg-white/95 font-bold text-xl whitespace-nowrap shadow ${farge}`}>{tekst}</div>
        </Html>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const tid = useRef(0);
    const forrige = useRef(beat);
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());
    useEffect(() => {
        forste.current = true;
    }, [modus]);
    useFrame(({ camera }, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const m = kameraFor(modus, beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });

    const isandlwana = modus === 'leir' || modus === 'slag';
    const himmel = modus === 'slag' && beat >= 3 ? '#e8d3b0' : '#dbe8ef';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 90, 220]} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[30, 50, 30]} intensity={1.4} color="#fff3dd" />
            <hemisphereLight args={['#e0f2fe', '#7c6a4a', 0.5]} />

            {/* Brettet: sand i en treramme */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[150, 110]} />
                <meshStandardMaterial color="#c9b27c" />
            </mesh>
            {[
                [0, -55, 152, 3],
                [0, 55, 152, 3],
                [-75, 0, 3, 110],
                [75, 0, 3, 110],
            ].map(([x, z, w, d], i) => (
                <mesh key={i} position={[x, 0.8, z]}>
                    <boxGeometry args={[w, 1.6, d]} />
                    <meshStandardMaterial color="#6b4423" flatShading />
                </mesh>
            ))}

            {isandlwana && (
                <>
                    <Fjell />
                    <mesh position={[0, 0, ASEN.z]} scale={[ASEN.bredde, ASEN.hoyde, ASEN.dybde]}>
                        <sphereGeometry args={[1, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color="#a89466" flatShading />
                    </mesh>
                    <Telt />
                    {[
                        [-2, 12],
                        [0.5, 12.6],
                        [3, 12],
                    ].map(([x, z], i) => (
                        <mesh key={i} position={[x, 0.5, z]}>
                            <boxGeometry args={[2, 1, 1.1]} />
                            <meshStandardMaterial color="#7c4a24" flatShading />
                        </mesh>
                    ))}
                </>
            )}
            {modus === 'horn' &&
                [-30, -10, 10].map((x, i) => (
                    <mesh key={i} position={[x, 0, -30 + i * 6]} scale={[10, 2, 6]}>
                        <sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color="#a89466" flatShading />
                    </mesh>
                ))}
            {modus === 'delt' && (
                <>
                    <Biter beat={beat} playing={playing} />
                    <Kraal synlig={beat <= 1} />
                    <Konge beat={beat} playing={playing} />
                </>
            )}

            <Brikker
                antall={N_ZULU}
                farge="#3f2a1d"
                topp="#f1ece0"
                malFor={(i) => zuluMal(modus, beat, i)}
                beat={beat}
                modus={modus}
                playing={playing}
            />
            <Brikker
                antall={N_BRIT}
                farge="#b91c1c"
                topp="#fde68a"
                malFor={(i) => britMal(modus, beat, i)}
                beat={beat}
                modus={modus}
                playing={playing}
            />
            <Brikker
                antall={N_FIENDE}
                farge="#64748b"
                topp="#cbd5e1"
                malFor={(i) => fiendeMal(modus, i)}
                beat={beat}
                modus={modus}
                playing={playing}
            />

            {/* Merkelapper i 3D */}
            {isandlwana && beat === 0 && <Merkelapp pos={[FJELL.x, 15, FJELL.z]} tekst="Isandlwana" />}
            {modus === 'leir' && beat === 1 && <Merkelapp pos={[LEIR.x, 4, LEIR.z - 4]} tekst="britisk leir" farge="text-red-700" />}
            {modus === 'leir' && beat === 3 && <Merkelapp pos={[0, 6, -36]} tekst="zuluene" farge="text-amber-900" />}
            {modus === 'horn' && beat <= 1 && (
                <>
                    <Merkelapp pos={[HORN_MAL.x, 3, HORN_MAL.z - 16 + (beat === 1 ? 6 : -3)]} tekst="brystet" farge="text-amber-900" />
                    <Merkelapp pos={[HORN_MAL.x - 15, 3, HORN_MAL.z - 6]} tekst="horn" farge="text-amber-900" />
                    <Merkelapp pos={[HORN_MAL.x + 15, 3, HORN_MAL.z - 6]} tekst="horn" farge="text-amber-900" />
                </>
            )}
            {modus === 'horn' && beat <= 2 && <Merkelapp pos={[HORN_MAL.x, 3, HORN_MAL.z + 5]} tekst="fienden" farge="text-slate-600" />}
            {modus === 'slag' && beat === 1 && <Merkelapp pos={[47, 4, 30]} tekst="Chelmsford drar" farge="text-red-700" />}
            {modus === 'delt' && beat === 0 && (
                <>
                    <Merkelapp pos={[KRAAL.x, 5, KRAAL.z - 4]} tekst="Ulundi" />
                    <Merkelapp pos={[KRAAL.x, 4, KRAAL.z + 16]} tekst="britene, med maskingevær" farge="text-red-700" />
                </>
            )}
        </>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    leir: ['22. januar 1879', 'En britisk leir', 'Ingen grøfter, ingen vegg', 'Zulu-hæren kommer'],
    horn: ['Bøffelhornene', 'Brystet holder fast', 'Hornene omringer', 'Raskere enn naboene'],
    slag: ['Isandlwana igjen', 'Chelmsford deler styrkene', 'Leiren står åpen', 'Bøffelhornene', 'Zuluene vinner'],
    delt: ['4. juli 1879: Ulundi', 'Cetshwayo i eksil', 'Tretten deler', '1897: en del av Natal'],
};

export function ZuluSandkasse({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'leir';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    const kort =
        modus === 'leir' && beat === 3
            ? ['ca. 25 000', 'krigere']
            : modus === 'slag' && beat === 4
              ? ['minst 1000', 'zulukrigere døde']
              : modus === 'delt' && beat === 2
                ? ['13 deler', 'som krigte mot hverandre']
                : modus === 'delt' && beat === 3
                  ? ['Natal', 'britisk koloni fra 1897']
                  : null;
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, near: 0.5, far: 400, position: [44, 20, 46] }} gl={{ antialias: true }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {kort && (
                    <motion.div
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="absolute right-[4%] bottom-[8%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                    >
                        <div className="text-4xl font-black text-slate-900">{kort[0]}</div>
                        <div className="text-xl font-semibold text-slate-600">{kort[1]}</div>
                    </motion.div>
                )}
            </AnimatePresence>
            <Overskrift tekst={overskrift} />
        </div>
    );
}
