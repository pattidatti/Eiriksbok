import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * 3D: en by delt av ei elv. Vest for elva ligger store hus med hager, øst for elva fabrikker
 * og tette arbeiderhus. «trikk»: to ungdommer tar samme trikk over brua. «elva»: Oslo delt i
 * østkant og vestkant. «industri»: byen vokser på 1800-tallet. «idag»: folk krysser elva, og
 * fargene på de to sidene glir mot hverandre. Byen er en skisse, ikke et kart over Oslo.
 */

type Modus = 'trikk' | 'elva' | 'industri' | 'idag';

const TITLER: Record<Modus, string[]> = {
    trikk: [
        'To ungdommer, samme skole',
        'Samme trikk hjem',
        'Ulikt talemål',
        'Ulikt talemål',
        'Ingen fjell. Samme by.',
    ],
    elva: ['Oslo', 'Én by, to talemål', 'Akerselva', 'Østkanten', 'Vestkanten'],
    industri: [
        'Hvorfor?',
        '1800-tallet: fabrikker',
        'Arbeiderne bor tett ved industrien',
        'Eierne bygger lenger unna',
        'Folk deles i grupper',
        'Talemålet blir et signal',
    ],
    idag: [
        'I dag',
        'Mer reising, mer utdanning',
        'Samme serier og videoer',
        'Forskjellene blir mindre',
    ],
};

const OST = '#f0b47c';
const VEST = '#8fb8e3';
const NOYTRAL = '#c8cfb4';
const BLANDET = '#c3b4d6';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Elvas midtlinje: litt bukter, nord (-z) til sør (+z). */
const elvX = (z: number) => Math.sin(z * 0.07) * 1.6;
const ELV_BREDDE = 7;

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'trikk') {
        switch (beat) {
            case 0:
                return { pos: v(-3.5 - t * 0.1, 3.4, 9.5), se: v(-7.5, 1.5, 2.2) };
            case 1:
                return { pos: v(-1.5, 4.2, 12.5), se: v(-9, 1.8, 0) };
            case 2:
            case 3:
                return { pos: v(0.5, 4.2, 13.5), se: v(0.5, 2, 0) };
            default:
                return { pos: v(2, 40 + t * 0.3, 44), se: v(0, 0, -2) };
        }
    }
    if (modus === 'elva') {
        switch (beat) {
            case 0:
                return { pos: v(0, 66 - t * 0.4, 52), se: v(0, 0, 0) };
            case 1:
                return { pos: v(0, 60, 48), se: v(0, 0, 2) };
            case 2:
                return { pos: v(-8, 24, 30), se: v(0, 0, 2) };
            case 3:
                return { pos: v(30, 22, 30), se: v(16, 0, 2) };
            default:
                return { pos: v(-32, 22, 30), se: v(-20, 0, 2) };
        }
    }
    if (modus === 'industri') {
        switch (beat) {
            case 2:
                return { pos: v(32, 24, 32), se: v(16, 0, 2) };
            case 3:
                return { pos: v(-34, 24, 32), se: v(-20, 0, 2) };
            default:
                return { pos: v(4, 54 + t * 0.2, 54), se: v(0, 0, 2) };
        }
    }
    switch (beat) {
        case 1:
            return { pos: v(18, 18, 26), se: v(0, 0, 4) };
        case 2:
            return { pos: v(-4, 26, 34), se: v(0, 0, 2) };
        default:
            return { pos: v(0, 62 - t * 0.3, 50), se: v(0, 0, 2) };
    }
}

/* ---------- byen ---------- */

const FABRIKKER: [number, number][] = [
    [8, -18],
    [9, -5],
    [8, 8],
    [10, 20],
];

function lagArbeiderhus() {
    const ut: { x: number; z: number; h: number }[] = [];
    let i = 0;
    for (let x = 14; x <= 32; x += 2.6) {
        for (let z = -26; z <= 26; z += 2.5) {
            i++;
            ut.push({ x: x + Math.sin(i * 3.1) * 0.25, z, h: 1.4 + ((i * 7) % 5) * 0.18 });
        }
    }
    // Noen hus helt inntil fabrikkene.
    for (const [fx, fz] of FABRIKKER) {
        ut.push({ x: fx + 3.6, z: fz + 3.2, h: 1.5 });
        ut.push({ x: fx - 0.5, z: fz + 3.4, h: 1.6 });
    }
    return ut;
}

const VILLAER: [number, number][] = [
    [-14, -22],
    [-24, -18],
    [-34, -24],
    [-16, -9],
    [-28, -6],
    [-38, -11],
    [-13, 4],
    [-23, 7],
    [-35, 3],
    [-17, 17],
    [-29, 19],
    [-40, 15],
    [-20, 27],
    [-33, 29],
];

function Instanser({
    data,
    farge,
    geometri,
    materialRef,
}: {
    data: { p: [number, number, number]; s: [number, number, number]; r?: number }[];
    farge: string;
    geometri: React.ReactNode;
    materialRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        data.forEach((d, i) => {
            o.position.set(...d.p);
            o.scale.set(...d.s);
            o.rotation.set(0, d.r ?? 0, 0);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    }, [data]);
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, data.length]} frustumCulled={false}>
            {geometri}
            <meshStandardMaterial ref={materialRef} color={farge} flatShading roughness={0.85} />
        </instancedMesh>
    );
}

/** En gruppe som vokser opp fra bakken når den skal synes. */
function Vekst({ synlig, children }: { synlig: boolean; children: React.ReactNode }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const mal = synlig ? 1 : 0.001;
        const s = forste.current ? mal : damp(g.scale.y, mal, 3, Math.min(dt, 0.05));
        forste.current = false;
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return <group ref={ref}>{children}</group>;
}

const ROYK = 28;
function Royk({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const alder = useMemo(() => Array.from({ length: ROYK }, (_, i) => (i / ROYK) * 4), []);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, dt) => {
        const m = ref.current;
        if (!m) return;
        m.visible = synlig;
        alder.forEach((a, i) => {
            const na = (a + Math.min(dt, 0.05)) % 4;
            alder[i] = na;
            const [fx, fz] = FABRIKKER[i % FABRIKKER.length];
            o.position.set(fx + 1.6 + na * 0.9, 8 + na * 1.1, fz - 1.2 - na * 0.3);
            o.scale.setScalar(0.5 + na * 0.35);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, ROYK]} frustumCulled={false}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
                color="#9ca3af"
                transparent
                opacity={0.5}
                depthWrite={false}
                roughness={1}
            />
        </instancedMesh>
    );
}

/** Folk som går over bruene, begge veier. */
const FOLK = 36;
const BRUER_I_DAG = [-24, -12, 0, 12, 24];
function Folk({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, dt) => {
        const m = ref.current;
        if (!m) return;
        m.visible = synlig;
        tid.current += Math.min(dt, 0.05);
        for (let i = 0; i < FOLK; i++) {
            const bz = BRUER_I_DAG[i % BRUER_I_DAG.length];
            const retning = i % 2 === 0 ? 1 : -1;
            const fase = ((tid.current * 0.12 + i * 0.137) % 1) * 2 - 1;
            const x = elvX(bz) + retning * fase * 16;
            o.position.set(x, 0.9, bz + (retning > 0 ? -0.6 : 0.6));
            o.scale.setScalar(1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            m.setColorAt(i, new THREE.Color(i % 2 === 0 ? '#c2410c' : '#1d4ed8'));
        }
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, FOLK]} frustumCulled={false}>
            <capsuleGeometry args={[0.35, 0.8, 4, 8]} />
            <meshStandardMaterial color="#ffffff" />
        </instancedMesh>
    );
}

function Elv({ lys }: { lys: boolean }) {
    const geo = useMemo(() => {
        const s = new THREE.Shape();
        const steg = 40;
        const pts: [number, number][] = [];
        for (let i = 0; i <= steg; i++) {
            const z = -60 + (i / steg) * 120;
            pts.push([elvX(z) - ELV_BREDDE / 2, z]);
        }
        for (let i = steg; i >= 0; i--) {
            const z = -60 + (i / steg) * 120;
            pts.push([elvX(z) + ELV_BREDDE / 2, z]);
        }
        // Formen tegnes i xy og legges ned: (x, y) blir (x, 0, -y).
        pts.forEach(([x, z], i) => (i === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)));
        return new THREE.ShapeGeometry(s);
    }, []);
    useEffect(() => () => geo.dispose(), [geo]);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!mat.current) return;
        mat.current.emissiveIntensity = damp(
            mat.current.emissiveIntensity,
            lys ? 0.9 : 0.25,
            3,
            Math.min(dt, 0.05) || 0.016
        );
    });
    return (
        <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
            <meshStandardMaterial
                ref={mat}
                color="#4f8fc9"
                emissive="#2f6fb0"
                emissiveIntensity={0.25}
                roughness={0.3}
            />
        </mesh>
    );
}

function Bru({ z }: { z: number }) {
    return (
        <group position={[elvX(z), 0, z]}>
            <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[ELV_BREDDE + 4, 0.5, 2.4]} />
                <meshStandardMaterial color="#9a8f80" flatShading />
            </mesh>
        </group>
    );
}

function Trikk({ trikkRef }: { trikkRef: React.RefObject<THREE.Group | null> }) {
    return (
        <group ref={trikkRef} position={[-34, 0, 0]}>
            <mesh position={[0, 1.95, 0]}>
                <boxGeometry args={[7, 2, 1.9]} />
                <meshStandardMaterial color="#1d4ed8" flatShading />
            </mesh>
            <mesh position={[0, 2.35, 0.96]}>
                <boxGeometry args={[6.2, 0.7, 0.04]} />
                <meshStandardMaterial color="#e0f2fe" emissive="#93c5fd" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0, 1.15, 0.97]}>
                <boxGeometry args={[7, 0.18, 0.04]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 3.25, 0]}>
                <boxGeometry args={[0.15, 0.6, 0.15]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
        </group>
    );
}

function Ungdom({ x, farge }: { x: number; farge: string }) {
    return (
        <group position={[x, 0.7, 2.2]}>
            <mesh position={[0, 0.8, 0]}>
                <capsuleGeometry args={[0.32, 0.9, 4, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 1.75, 0]}>
                <sphereGeometry args={[0.3, 12, 12]} />
                <meshStandardMaterial color="#f2c9a0" />
            </mesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const trikk = useRef<THREE.Group>(null);
    const ungdom = useRef<THREE.Group>(null);
    const ostMat = useRef<THREE.MeshStandardMaterial>(null);
    const vestMat = useRef<THREE.MeshStandardMaterial>(null);
    const husMat = useRef<THREE.MeshStandardMaterial>(null);
    const villaMat = useRef<THREE.MeshStandardMaterial>(null);

    const arbeiderhus = useMemo(
        () =>
            lagArbeiderhus().map((h) => ({
                p: [h.x, h.h / 2, h.z] as [number, number, number],
                s: [1.9, h.h, 1.9] as [number, number, number],
            })),
        []
    );
    const villaKropp = useMemo(
        () =>
            VILLAER.map(([x, z], i) => ({
                p: [x, 1.4, z] as [number, number, number],
                s: [3.6, 2.8, 3.2] as [number, number, number],
                r: i * 0.4,
            })),
        []
    );
    const villaTak = useMemo(
        () =>
            VILLAER.map(([x, z], i) => ({
                p: [x, 3.6, z] as [number, number, number],
                s: [3, 1.6, 3] as [number, number, number],
                r: i * 0.4 + Math.PI / 4,
            })),
        []
    );
    const traer = useMemo(() => {
        const ut: { p: [number, number, number]; s: [number, number, number] }[] = [];
        VILLAER.forEach(([x, z], i) => {
            ut.push({ p: [x + 3.4, 1.6, z + 2], s: [1.2, 3.2, 1.2] });
            if (i % 2 === 0) ut.push({ p: [x - 3, 1.4, z - 2.4], s: [1, 2.8, 1] });
        });
        return ut;
    }, []);

    // Hva som vises.
    const fabrikkerSynlig = modus !== 'industri' || beat >= 1;
    const husSynlig = modus !== 'industri' || beat >= 2;
    const villaSynlig = modus !== 'industri' || beat >= 3;
    const fargelagt =
        (modus === 'elva' && beat >= 1) || (modus === 'industri' && beat >= 4) || modus === 'idag';
    const blandet = modus === 'idag' && beat >= 3;
    const skjermlys = modus === 'idag' && beat >= 2;
    const elvLys = modus === 'elva' && beat === 2;
    const ekstraBruer = modus === 'idag';

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        const k = kameraFor(modus, beat, t);
        if (forste.current) {
            camera.position.copy(k.pos);
            kamSe.current.copy(k.se);
        } else {
            const a = 1 - Math.exp(-1.3 * (dt || 0));
            camera.position.lerp(k.pos, a);
            kamSe.current.lerp(k.se, a);
        }
        camera.lookAt(kamSe.current);

        // Trikken: kommer inn til holdeplassen, kjører ut på brua, og videre østover.
        if (trikk.current) {
            const mal =
                modus !== 'trikk'
                    ? -60
                    : beat === 0
                      ? -34
                      : beat === 1
                        ? -9
                        : beat <= 3
                          ? 0.5
                          : 14 + t * 1.2;
            trikk.current.visible = modus === 'trikk';
            trikk.current.position.x = forste.current
                ? mal
                : damp(trikk.current.position.x, mal, 1.6, dt);
        }
        if (ungdom.current) {
            ungdom.current.visible = modus === 'trikk' && (beat === 0 || (beat === 1 && t < 2.2));
        }

        const fd = forste.current ? 1 : dt;
        const farge = (m: THREE.MeshStandardMaterial | null, mal: string) => {
            if (!m) return;
            const c = new THREE.Color(mal);
            m.color.lerp(c, 1 - Math.exp(-2 * fd));
        };
        farge(ostMat.current, fargelagt ? (blandet ? BLANDET : OST) : NOYTRAL);
        farge(vestMat.current, fargelagt ? (blandet ? BLANDET : VEST) : NOYTRAL);
        for (const m of [husMat.current, villaMat.current]) {
            if (!m) continue;
            m.emissive.set('#60a5fa');
            m.emissiveIntensity = damp(m.emissiveIntensity, skjermlys ? 0.35 : 0, 3, fd);
        }
        forste.current = false;
    });

    return (
        <>
            <color attach="background" args={['#dbe7f1']} />
            <fog attach="fog" args={['#dbe7f1', 90, 190]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#f8fafc', '#6b7d5c', 0.5]} />
            <directionalLight position={[30, 50, 20]} intensity={1.3} />

            {/* Bakken: vest og øst for elva */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-40, 0, 0]}>
                <planeGeometry args={[80, 140]} />
                <meshStandardMaterial ref={vestMat} color={NOYTRAL} roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0, 0]}>
                <planeGeometry args={[80, 140]} />
                <meshStandardMaterial ref={ostMat} color={NOYTRAL} roughness={1} />
            </mesh>
            <Elv lys={elvLys} />

            {/* Gata og bruene */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <planeGeometry args={[90, 2.6]} />
                <meshStandardMaterial color="#8b8b85" roughness={1} />
            </mesh>
            <Bru z={0} />
            <Bru z={14} />
            {ekstraBruer && (
                <>
                    <Bru z={-24} />
                    <Bru z={-12} />
                    <Bru z={24} />
                </>
            )}

            {/* Østkanten: fabrikker og tette arbeiderhus */}
            <Vekst synlig={fabrikkerSynlig}>
                {FABRIKKER.map(([x, z]) => (
                    <group key={z} position={[x, 0, z]}>
                        <mesh position={[0, 2.2, 0]}>
                            <boxGeometry args={[5, 4.4, 4.4]} />
                            <meshStandardMaterial color="#9a3f2b" flatShading />
                        </mesh>
                        <mesh position={[1.6, 5, -1.2]}>
                            <cylinderGeometry args={[0.45, 0.6, 6, 10]} />
                            <meshStandardMaterial color="#7c2d12" flatShading />
                        </mesh>
                    </group>
                ))}
            </Vekst>
            <Royk synlig={fabrikkerSynlig && modus !== 'idag'} />
            <Vekst synlig={husSynlig}>
                <Instanser
                    data={arbeiderhus}
                    farge="#d6b48a"
                    geometri={<boxGeometry args={[1, 1, 1]} />}
                    materialRef={husMat}
                />
            </Vekst>

            {/* Vestkanten: store hus med hager */}
            <Vekst synlig={villaSynlig}>
                <Instanser
                    data={villaKropp}
                    farge="#f5f1e6"
                    geometri={<boxGeometry args={[1, 1, 1]} />}
                    materialRef={villaMat}
                />
                <Instanser
                    data={villaTak}
                    farge="#475569"
                    geometri={<coneGeometry args={[1.25, 1, 4]} />}
                />
                <Instanser
                    data={traer}
                    farge="#3f7d3a"
                    geometri={<coneGeometry args={[0.8, 1, 7]} />}
                />
            </Vekst>

            <Trikk trikkRef={trikk} />
            <group ref={ungdom}>
                <Ungdom x={-8.3} farge="#c2410c" />
                <Ungdom x={-6.7} farge="#1d4ed8" />
            </group>
            <Folk synlig={modus === 'idag' && beat >= 1} />

            <Merker modus={modus} beat={beat} />
        </>
    );
}

function Merke({
    pos,
    tekst,
    farge = '#0f172a',
    bakgrunn = 'rgba(255,255,255,0.95)',
}: {
    pos: [number, number, number];
    tekst: string;
    farge?: string;
    bakgrunn?: string;
}) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div
                className="px-4 py-1.5 rounded-xl shadow-lg font-display font-black text-2xl whitespace-nowrap"
                style={{ background: bakgrunn, color: farge }}
            >
                {tekst}
            </div>
        </Html>
    );
}

function Merker({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'trikk') {
        return (
            <>
                {beat >= 2 && beat <= 3 && (
                    <Merke
                        pos={[-1.6, 4.1, 0]}
                        tekst="boka · jenta"
                        bakgrunn="#c2410c"
                        farge="#fff"
                    />
                )}
                {beat === 3 && (
                    <Merke
                        pos={[2.8, 4.1, 0]}
                        tekst="boken · jenten"
                        bakgrunn="#1d4ed8"
                        farge="#fff"
                    />
                )}
            </>
        );
    }
    if (modus === 'elva') {
        return (
            <>
                {beat === 1 && (
                    <>
                        <Merke
                            pos={[-22, 1, 14]}
                            tekst="Vestkantmål"
                            bakgrunn="#1d4ed8"
                            farge="#fff"
                        />
                        <Merke
                            pos={[22, 1, 14]}
                            tekst="Østkantmål"
                            bakgrunn="#c2410c"
                            farge="#fff"
                        />
                    </>
                )}

                {beat === 3 && (
                    <>
                        <Merke pos={[12, 2, 13]} tekst="Arbeiderstrøk ved fabrikkene" />
                        <Merke pos={[20, 2, 22]} tekst="Folkemål" bakgrunn="#c2410c" farge="#fff" />
                    </>
                )}
                {beat === 4 && (
                    <>
                        <Merke pos={[-22, 2, 13]} tekst="Embetsmenn og kjøpmenn" />
                        <Merke
                            pos={[-22, 2, 22]}
                            tekst="Finere talemål"
                            bakgrunn="#1d4ed8"
                            farge="#fff"
                        />
                    </>
                )}
            </>
        );
    }
    if (modus === 'industri') {
        return (
            <>
                {beat === 4 && (
                    <>
                        <Merke
                            pos={[-24, 1, 18]}
                            tekst="Fabrikkeierne"
                            bakgrunn="#1d4ed8"
                            farge="#fff"
                        />
                        <Merke
                            pos={[22, 1, 18]}
                            tekst="Fabrikkarbeiderne"
                            bakgrunn="#c2410c"
                            farge="#fff"
                        />
                    </>
                )}
                {beat === 5 && (
                    <>
                        <Merke
                            pos={[-24, 1, 18]}
                            tekst="Vestkantmål"
                            bakgrunn="#1d4ed8"
                            farge="#fff"
                        />
                        <Merke
                            pos={[22, 1, 18]}
                            tekst="Østkantmål"
                            bakgrunn="#c2410c"
                            farge="#fff"
                        />
                    </>
                )}
            </>
        );
    }
    return (
        <>
            {beat === 0 && (
                <>
                    <Merke pos={[-22, 1, 16]} tekst="Vestkantmål" bakgrunn="#1d4ed8" farge="#fff" />
                    <Merke pos={[22, 1, 16]} tekst="Østkantmål" bakgrunn="#c2410c" farge="#fff" />
                </>
            )}
            {beat === 2 && (
                <>
                    <Merke
                        pos={[-11, 3, 10]}
                        tekst="▶ serier på nett"
                        bakgrunn="#0f172a"
                        farge="#fff"
                    />
                    <Merke
                        pos={[12, 3, 10]}
                        tekst="▶ videoer på nett"
                        bakgrunn="#0f172a"
                        farge="#fff"
                    />
                </>
            )}
            {beat === 3 && (
                <Merke
                    pos={[0, 1, 16]}
                    tekst="Øst og vest nærmer seg"
                    bakgrunn="#6d28d9"
                    farge="#fff"
                />
            )}
        </>
    );
}

export function SosiolektBy({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'trikk';
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 400, position: [0, 60, 50] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none"
                >
                    <div className="px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-display font-black text-4xl shadow-xl whitespace-nowrap">
                        {tittel}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
