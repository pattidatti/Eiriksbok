import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Kort, Overskrift } from './felles';
import { frø } from './fro';

/**
 * Thaba Bosiu som modell: et flatt fjell med sju stier opp, kilder og hytter på toppen.
 * Brikker, ikke mennesker: ingen kamp vises, bare hvor folk står.
 * «fanger»: fangene i 1826 føres opp, renses og sendes hjem med kyr.
 * «festning»: ankomsten om natta, stiene, kildene og plassen på toppen.
 * «ndebele»: angrepet rundt 1831, som slås tilbake, og gaven med kyr etterpå.
 * «beleiring»: boerne har tatt sletta, bare fjellet står igjen.
 *
 * Alt glir mot et mål per beat, så eleven kan hoppe rett til en hvilken som helst beat.
 */

type Modus = 'fanger' | 'festning' | 'ndebele' | 'beleiring';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Fjellet: toppen er en ellipse med halvakser A og B i høyde TOPP, foten er FOT ganger større. */
const A = 16;
const B = 11;
const TOPP = 9;
const FOT = 1.45;

/** Høyden der en brikke står: flat topp, rett skråning, flat slette. */
function hoyde(x: number, z: number) {
    const q = Math.hypot(x / A, z / B);
    if (q <= 1) return TOPP;
    if (q >= FOT) return 0;
    return (TOPP * (FOT - q)) / (FOT - 1);
}

/** Punkt i fjellets egne koordinater: q er avstand (1 = toppkanten, 1.45 = foten), a er vinkel. */
function pq(q: number, a: number): [number, number] {
    return [A * q * Math.cos(a), B * q * Math.sin(a)];
}

/** De sju stiene. Sti 0 vender mot kameraet, og er den brikkene går på. */
const STIER = Array.from({ length: 7 }, (_, k) => 0.5 + (k * Math.PI * 2) / 7 + (k % 2) * 0.12);

/** Et punkt på sti k: t = 0 er toppkanten, t = 1 er foten, over 1 er ut på sletta. */
function påSti(k: number, t: number): [number, number] {
    const a = STIER[k] + Math.sin(t * 7) * 0.035;
    return pq(1 + (FOT - 1) * t, a);
}

type Mal = [number, number, boolean];
const SKJULT: Mal = [0, 0, false];

/** Faste plasser på toppen. */
const TOPPLASS: [number, number][] = (() => {
    const ut: [number, number][] = [];
    let i = 0;
    while (ut.length < 90 && i < 3000) {
        const r = 0.18 + Math.sqrt(frø(i + 11)) * 0.72;
        const a = frø(i + 97) * Math.PI * 2;
        i++;
        const p = pq(r, a);
        if (ut.some(([x, z]) => Math.hypot(x - p[0], z - p[1]) < 1.5)) continue;
        ut.push(p);
    }
    return ut;
})();

/** Plasser på sletta i en ring rundt foten. */
function slette(i: number, n: number, q0: number, q1: number, a0 = 0, a1 = Math.PI * 2): Mal {
    const a = a0 + ((a1 - a0) * (i + frø(i + 5) * 0.6)) / n;
    const q = q0 + frø(i + 300) * (q1 - q0);
    const [x, z] = pq(q, a);
    return [x, z, true];
}

function ring(r: number, i: number, n: number): Mal {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r, true];
}

const N_FOLK = 80;
const N_FANGER = 10;
const N_FIENDE = 90;
const N_KYR = 24;

function folkMal(modus: Modus, beat: number, i: number): Mal {
    const plass = (j: number): Mal => [...TOPPLASS[j % TOPPLASS.length], true] as Mal;
    if (modus === 'fanger') {
        if (i >= 40) return SKJULT;
        if (beat === 2 || beat === 3) return ring(i % 2 ? 7.5 : 6, i, 40);
        return plass(i + 20);
    }
    if (modus === 'festning') {
        if (beat === 0) {
            // På vei opp sti 0 i mørket
            if (i >= 24) return SKJULT;
            const [x, z] = påSti(0, 1.5 - i * 0.06);
            return [x, z, true];
        }
        if (beat < 3) return i < 24 ? plass(i) : SKJULT;
        return plass(i);
    }
    if (modus === 'ndebele') {
        if (i >= 40) return SKJULT;
        // Langs toppkanten på siden som vender mot angrepet
        if (beat <= 1) {
            const [x, z] = pq(0.9, 0.1 + (i / 40) * 1.4);
            return [x, z, true];
        }
        return plass(i);
    }
    // beleiring: folket samlet på toppen
    return i < 50 ? plass(i) : SKJULT;
}

function fangeMal(modus: Modus, beat: number, i: number): Mal {
    if (modus !== 'fanger') return SKJULT;
    if (beat === 0) {
        const [x, z] = påSti(0, 0.2 + i * 0.09);
        return [x, z, true];
    }
    if (beat <= 3) return ring(2.4, i, N_FANGER);
    const [x, z] = påSti(0, 1.2 + i * 0.2);
    return [x, z, true];
}

function fiendeMal(modus: Modus, beat: number, i: number): Mal {
    if (modus === 'festning') return beat === 4 ? slette(i, N_FIENDE, 1.8, 2.3) : SKJULT;
    if (modus === 'ndebele') {
        if (i >= 60) return SKJULT;
        if (beat === 0) return slette(i, 60, 3.3, 3.9, 0.0, 1.6);
        if (beat === 1) return slette(i, 60, 1.6, 2.0, 0.05, 1.5);
        return slette(i, 60, 4.2, 4.8, 0.2, 1.4);
    }
    if (modus === 'beleiring') return slette(i, N_FIENDE, 1.7, 3.4);
    return SKJULT;
}

function kuMal(modus: Modus, beat: number, i: number): Mal {
    if (modus === 'fanger') {
        if (beat < 4) return i < 10 ? [...TOPPLASS[60 + i], true] as Mal : SKJULT;
        if (i >= 10) return SKJULT;
        const [x, z] = påSti(0, 1.3 + i * 0.2 + 0.1);
        return [x + 0.9, z - 0.6, true];
    }
    if (modus === 'festning') return beat >= 3 ? ([...TOPPLASS[(i * 3 + 7) % 90], true] as Mal) : SKJULT;
    if (modus === 'ndebele') {
        if (beat < 2) return SKJULT;
        if (i >= 12) return SKJULT;
        const [x, z] = påSti(0, 1.4 + i * 0.22);
        return [x, z, true];
    }
    return i < 12 ? ([...TOPPLASS[(i * 5 + 3) % 90], true] as Mal) : SKJULT;
}

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    const sving = (r: number, y: number, a0: number, se: THREE.Vector3) => {
        const a = a0 + t * 0.03;
        return { pos: v(Math.cos(a) * r, y, Math.sin(a) * r), se };
    };
    if (modus === 'fanger') {
        switch (beat) {
            case 0:
                return { pos: v(40, 24, 42), se: v(10, 5, 4) };
            case 1:
                return { pos: v(16, 20, 24), se: v(0, 9, 0) };
            case 2:
                return { pos: v(4, 20, 16), se: v(0, 9, -2) };
            case 3:
                return sving(22, 21, 0.9, v(0, 9, 0));
            default:
                return { pos: v(46, 22, 40), se: v(14, 4, 5) };
        }
    }
    if (modus === 'festning') {
        switch (beat) {
            case 0:
                return { pos: v(52, 16, 46), se: v(6, 5, 2) };
            case 1:
                return { pos: v(4, 64, 50), se: v(0, 0, 0) };
            case 2:
                return { pos: v(18, 22, 22), se: v(0, 9, 0) };
            case 3:
                return sving(34, 30, 0.8, v(0, 9, 0));
            default:
                return { pos: v(6, 50, 54), se: v(0, 0, 2) };
        }
    }
    if (modus === 'ndebele') {
        switch (beat) {
            case 0:
                return { pos: v(78, 30, 70), se: v(26, 2, 14) };
            case 1:
                return { pos: v(52, 18, 40), se: v(18, 4, 8) };
            case 2:
                return { pos: v(66, 30, 62), se: v(28, 2, 16) };
            default:
                return { pos: v(52, 24, 44), se: v(22, 3, 8) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(6, 88, 88), se: v(0, 0, 0) };
        case 1:
            return { pos: v(42, 20, 34), se: v(14, 4, 5) };
        case 2:
            return { pos: v(12, 17, 17), se: v(0, 9, 0) };
        default:
            return sving(26, 22, 0.75, v(0, 10, 0));
    }
}

/** Brikker av én farge som instanser: kropp og hode. Hver brikke glir mot målet sitt. */
function Brikker({
    antall,
    farge,
    hode,
    malFor,
    modus,
    playing,
    ku = false,
}: {
    antall: number;
    farge: string;
    hode: string;
    malFor: (i: number) => Mal;
    modus: Modus;
    playing: boolean;
    ku?: boolean;
}) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const topp = useRef<THREE.InstancedMesh>(null);
    const naa = useRef<{ x: number; z: number; s: number }[]>([]);
    const forste = useRef(true);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    useEffect(() => {
        forste.current = true;
    }, [modus]);
    useFrame((_, delta) => {
        const k1 = kropp.current;
        const k2 = topp.current;
        if (!k1 || !k2) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const forsteBilde = forste.current;
        const k = forsteBilde ? 1 : 1 - Math.exp(-0.9 * dt);
        forste.current = false;
        for (let i = 0; i < antall; i++) {
            const [mx, mz, vis] = malFor(i);
            const n = naa.current[i] ?? (naa.current[i] = { x: mx, z: mz, s: vis ? 1 : 0 });
            if (forsteBilde) {
                n.x = mx;
                n.z = mz;
                n.s = vis ? 1 : 0;
            } else {
                // Usynlige brikker krymper der de står, så de ikke farer over brettet.
                if (vis) {
                    n.x += (mx - n.x) * k;
                    n.z += (mz - n.z) * k;
                }
                n.s += ((vis ? 1 : 0) - n.s) * Math.min(1, k * 2);
            }
            const y = hoyde(n.x, n.z);
            if (ku) {
                dummy.position.set(n.x, y + 0.4 * n.s, n.z);
                dummy.rotation.set(0, i * 1.3, 0);
                dummy.scale.setScalar(n.s);
                dummy.updateMatrix();
                k1.setMatrixAt(i, dummy.matrix);
                dummy.position.set(n.x + Math.cos(i * 1.3) * 0.75 * n.s, y + 0.6 * n.s, n.z - Math.sin(i * 1.3) * 0.75 * n.s);
                dummy.updateMatrix();
                k2.setMatrixAt(i, dummy.matrix);
            } else {
                dummy.rotation.set(0, 0, 0);
                dummy.position.set(n.x, y + 0.5 * n.s, n.z);
                dummy.scale.setScalar(n.s);
                dummy.updateMatrix();
                k1.setMatrixAt(i, dummy.matrix);
                dummy.position.set(n.x, y + 1.25 * n.s, n.z);
                dummy.updateMatrix();
                k2.setMatrixAt(i, dummy.matrix);
            }
        }
        k1.instanceMatrix.needsUpdate = true;
        k2.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, antall]} frustumCulled={false}>
                {ku ? <boxGeometry args={[1.3, 0.7, 0.6]} /> : <cylinderGeometry args={[0.32, 0.42, 1, 8]} />}
                <meshStandardMaterial color={farge} flatShading />
            </instancedMesh>
            <instancedMesh ref={topp} args={[undefined, undefined, antall]} frustumCulled={false}>
                {ku ? <boxGeometry args={[0.4, 0.45, 0.4]} /> : <sphereGeometry args={[0.3, 8, 6]} />}
                <meshStandardMaterial color={hode} flatShading />
            </instancedMesh>
        </>
    );
}

/** Thaba Bosiu: flat topp, bratte sider, en ur ved foten. */
function Fjellet() {
    return (
        <group>
            <mesh position={[0, TOPP / 2, 0]} scale={[A, 1, B]}>
                <cylinderGeometry args={[1, FOT, TOPP, 18, 1]} />
                <meshStandardMaterial color="#9c7a55" flatShading />
            </mesh>
            {/* Gress på toppen */}
            <mesh position={[0, TOPP + 0.02, 0]} scale={[A, B, 1]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1, 18]} />
                <meshStandardMaterial color="#9fae6a" />
            </mesh>
            {/* Klippebånd rundt toppen */}
            <mesh position={[0, TOPP - 1.2, 0]} scale={[A * 1.04, 1, B * 1.04]}>
                <cylinderGeometry args={[1, 1.03, 2.4, 18, 1, true]} />
                <meshStandardMaterial color="#c49a6c" flatShading side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

/** De sju stiene som rør langs skråningen. */
function Stiene({ uthevet }: { uthevet: boolean }) {
    const geos = useMemo(
        () =>
            STIER.map((_, k) => {
                const pts = Array.from({ length: 12 }, (_, i) => {
                    const t = -0.05 + (i / 11) * 1.12;
                    const [x, z] = påSti(k, t);
                    return new THREE.Vector3(x, hoyde(x, z) + 0.12, z);
                });
                return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, uthevet ? 0.45 : 0.28, 5);
            }),
        [uthevet]
    );
    useEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);
    return (
        <>
            {geos.map((g, i) => (
                <mesh key={i} geometry={g}>
                    <meshStandardMaterial
                        color={uthevet ? '#facc15' : '#d6c3a0'}
                        emissive={uthevet ? '#a16207' : '#000000'}
                        emissiveIntensity={uthevet ? 0.6 : 0}
                    />
                </mesh>
            ))}
        </>
    );
}

/** Rundhytter på toppen. */
function Hytter() {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const m = ref.current;
        const t = tak.current;
        if (!m || !t) return;
        const d = new THREE.Object3D();
        for (let i = 0; i < 14; i++) {
            const [x, z] = pq(0.35 + frø(i + 40) * 0.45, (i / 14) * Math.PI * 2 + 0.3);
            d.position.set(x, TOPP + 0.6, z);
            d.updateMatrix();
            m.setMatrixAt(i, d.matrix);
            d.position.set(x, TOPP + 1.75, z);
            d.updateMatrix();
            t.setMatrixAt(i, d.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
        t.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <>
            <instancedMesh ref={ref} args={[undefined, undefined, 14]}>
                <cylinderGeometry args={[1, 1, 1.2, 10]} />
                <meshStandardMaterial color="#c8a77a" flatShading />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, 14]}>
                <coneGeometry args={[1.3, 1.2, 10]} />
                <meshStandardMaterial color="#7a5b2e" flatShading />
            </instancedMesh>
        </>
    );
}

const KILDER: [number, number][] = [pq(0.2, 2.4), pq(0.55, 4.2), pq(0.5, 0.9)];

function Kilder() {
    return (
        <>
            {KILDER.map(([x, z], i) => (
                <mesh key={i} position={[x, TOPP + 0.08, z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[1.5, 16]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.7} />
                </mesh>
            ))}
        </>
    );
}

/** Ringen av lys rundt fangene: renselsen. */
function Renselse({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const s = useRef(0);
    useFrame((_, delta) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        s.current += ((synlig ? 1 : 0) - s.current) * (1 - Math.exp(-2 * dt));
        if (!playing) s.current = synlig ? 1 : 0;
        m.scale.setScalar(Math.max(0.001, s.current));
        m.rotation.z += dt * 0.4;
    });
    return (
        <mesh ref={ref} position={[0, TOPP + 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.4, 4.4, 40]} />
            <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={1.2} transparent opacity={0.85} />
        </mesh>
    );
}

/** Det britiske flagget på toppen: en stang og et rødt flagg. */
function Flagg() {
    return (
        <group position={[2, TOPP, -1]}>
            <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 6, 6]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh position={[1.3, 5.2, 0]}>
                <boxGeometry args={[2.6, 1.5, 0.08]} />
                <meshStandardMaterial color="#b91c1c" emissive="#7f1d1d" emissiveIntensity={0.3} />
            </mesh>
        </group>
    );
}

/** Moshoeshoe: en gullbrikke på toppen. */
function Hovding({ pos }: { pos: [number, number] }) {
    return (
        <group position={[pos[0], TOPP, pos[1]]}>
            <mesh position={[0, 0.7, 0]}>
                <cylinderGeometry args={[0.45, 0.6, 1.4, 10]} />
                <meshStandardMaterial color="#d4a017" emissive="#7c5a00" emissiveIntensity={0.35} />
            </mesh>
            <mesh position={[0, 1.7, 0]}>
                <sphereGeometry args={[0.38, 10, 8]} />
                <meshStandardMaterial color="#3f2a1d" />
            </mesh>
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

    const natt = modus === 'festning' && beat === 0;
    const himmel = natt ? '#1e2b4a' : modus === 'beleiring' ? '#e6dcc8' : '#d8e6ee';
    const slette = modus === 'beleiring' ? '#b9a67a' : '#b7b07a';
    const sti0: [number, number] = påSti(0, 0.5);

    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 140, 380]} />
            <ambientLight intensity={natt ? 0.35 : 0.75} />
            <directionalLight
                position={natt ? [-30, 60, 20] : [40, 60, 30]}
                intensity={natt ? 0.7 : 1.4}
                color={natt ? '#b8c6ff' : '#fff1d6'}
            />
            <hemisphereLight args={[natt ? '#3b4a7a' : '#e0f2fe', '#6b5a3a', natt ? 0.45 : 0.5]} />

            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2000, 2000]} />
                <meshStandardMaterial color={slette} emissive={natt ? '#1c2440' : '#000000'} emissiveIntensity={natt ? 0.5 : 0} />
            </mesh>
            <Fjellet />
            <Stiene uthevet={modus === 'festning' && beat === 1} />
            {!(modus === 'festning' && beat === 0) && <Hytter />}
            {(modus !== 'festning' || beat >= 2) && <Kilder />}
            <Renselse synlig={modus === 'fanger' && beat === 3} playing={playing} />
            {modus === 'beleiring' && beat >= 2 && <Hovding pos={[-1.5, 1]} />}
            {modus === 'fanger' && beat >= 2 && beat <= 3 && <Hovding pos={[0, -4.3]} />}
            {modus === 'beleiring' && beat >= 3 && <Flagg />}

            <Brikker antall={N_FOLK} farge="#8b3a1e" hode="#3f2a1d" malFor={(i) => folkMal(modus, beat, i)} modus={modus} playing={playing} />
            <Brikker antall={N_FANGER} farge="#94a3b8" hode="#3f2a1d" malFor={(i) => fangeMal(modus, beat, i)} modus={modus} playing={playing} />
            <Brikker
                antall={N_FIENDE}
                farge={modus === 'ndebele' ? '#334155' : '#e2e8f0'}
                hode={modus === 'ndebele' ? '#1e293b' : '#475569'}
                malFor={(i) => fiendeMal(modus, beat, i)}
                modus={modus}
                playing={playing}
            />
            <Brikker antall={N_KYR} farge="#7c4a24" hode="#f5efe0" malFor={(i) => kuMal(modus, beat, i)} modus={modus} playing={playing} ku />

            {/* Merkelapper */}
            {modus === 'fanger' && beat === 0 && <Merkelapp pos={[sti0[0] + 2, hoyde(...sti0) + 4, sti0[1] + 2]} tekst="fangene" farge="text-slate-600" />}
            {modus === 'fanger' && beat === 1 && <Merkelapp pos={[0, TOPP + 4, 0]} tekst="fangene" farge="text-slate-600" />}
            {modus === 'fanger' && beat === 4 && <Merkelapp pos={[24, 4, 11]} tekst="hjem med kyr" farge="text-amber-900" />}
            {modus === 'festning' && beat === 2 && <Merkelapp pos={[KILDER[0][0], TOPP + 3, KILDER[0][1]]} tekst="kilde" farge="text-sky-700" />}
            {modus === 'festning' && beat === 4 && <Merkelapp pos={[0, 3, 27]} tekst="fienden venter" farge="text-slate-700" />}
            {modus === 'ndebele' && beat <= 1 && <Merkelapp pos={beat === 0 ? [50, 4, 32] : [30, 4, 16]} tekst="Ndebele" farge="text-slate-800" />}
            {modus === 'ndebele' && beat === 3 && <Merkelapp pos={[30, 4, 13]} tekst="en gave med kyr" farge="text-amber-900" />}
            {modus === 'beleiring' && beat === 0 && <Merkelapp pos={[0, TOPP + 5, 0]} tekst="Thaba Bosiu" />}
            {modus === 'beleiring' && beat === 0 && <Merkelapp pos={[0, 3, 44]} tekst="boerne" farge="text-slate-700" />}
            {modus === 'fanger' && beat === 2 && <Merkelapp pos={[0, TOPP + 3.6, -4.3]} tekst="Moshoeshoe" farge="text-amber-800" />}
            {modus === 'beleiring' && beat === 3 && <Merkelapp pos={[4.5, TOPP + 8, -1]} tekst="britisk" farge="text-red-700" />}
            {modus === 'beleiring' && beat === 2 && <Merkelapp pos={[-1.5, TOPP + 3.4, 1]} tekst="Moshoeshoe" farge="text-amber-800" />}
        </>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    fanger: ['1826: fangene føres opp', 'De spiste bestefaren hans', 'Alle venter', 'Ingen hevn', 'Sendt hjem'],
    festning: ['1824: Thaba Bosiu', 'Bare sju stier opp', 'Vann på toppen', 'Plass til folk og dyr', 'Fjellet tåler beleiring'],
    ndebele: ['Rundt 1831: Ndebele angriper', 'Mzilikazi', 'Slått tilbake', 'Gave i stedet for hevn'],
    beleiring: ['1867: bare fjellet er igjen', 'Louw Wepener', 'Moshoeshoe, over 80 år', 'Han ber britene om beskyttelse'],
};

function kortFor(modus: Modus, beat: number): [string, string] | null {
    if (modus === 'fanger' && beat === 3) return ['Renselse', 'en seremoni som vasker bort'];
    if (modus === 'fanger' && beat === 4) return ['kyr, korn', 'og såkorn'];
    if (modus === 'festning' && beat === 0) return ['Thaba Bosiu', '«fjellet om natta»'];
    if (modus === 'festning' && beat === 1) return ['7 stier', 'lette å forsvare'];
    if (modus === 'festning' && beat === 3) return ['ca. 3000', 'mennesker med dyrene sine'];
    if (modus === 'ndebele' && beat === 1) return ['Mzilikazi', 'hadde brutt med Shaka'];
    if (modus === 'beleiring' && beat === 1) return ['1865', 'Wepener drept ved fjellet'];
    if (modus === 'beleiring' && beat === 3) return ['Beskyttelse', 'fra Storbritannia'];
    return null;
}

export function MoshoeshoeFjellet({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'festning';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 500, position: [44, 22, 44] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Kort nokkel={`${modus}-${beat}`} linjer={kortFor(modus, beat)} />
            <Overskrift tekst={overskrift} />
        </div>
    );
}
