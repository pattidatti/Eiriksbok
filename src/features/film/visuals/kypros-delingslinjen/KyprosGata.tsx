import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Nicosia med den grønne linjen. Sonen går langs z-aksen (x = 0) og er SONE meter bred.
 * Sør (Kypros) er x < 0, nord (Nord-Kypros) er x > 0. En tverrgate krysser sonen ved z = 0.
 * Tre modus: «by» (gata som stopper ved piggtråden), «sone» (sonen sett ovenfra og innenfra,
 * med tomme hus og FN-posten) og «apning» (april 2003: bommene går opp og folk krysser).
 */

type Modus = 'by' | 'sone' | 'apning';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const SONE = 10;
const KANT = SONE / 2;

/** Fast tilfeldighet, så byen ser lik ut hver gang. */
function tall(i: number) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const RAD_Z = [-55, -47, -39, -31, -23, -15, -7, 7, 15, 23, 31, 39, 47, 55];
const RAD_X = [10, 17, 24, 31, 38, 45, 52, 59];

/** Husene i byen på begge sider av sonen. */
const HUS: { x: number; z: number; h: number; farge: string }[] = [];
for (const side of [-1, 1])
    for (const x of RAD_X)
        for (const z of RAD_Z) {
            const i = HUS.length;
            HUS.push({
                x: side * x,
                z,
                h: 4.5 + tall(i) * 4.5,
                farge: ['#e9d8b4', '#dcc39a', '#f1e4c8', '#d6b98c', '#e7cfa6'][i % 5],
            });
        }

/** Forlatte hus inne i sonen. */
const TOMME: { z: number; h: number }[] = [-47, -31, 15, 31, 47].map((z, i) => ({
    z,
    h: 3.4 + tall(i + 900) * 3,
}));

/** Busker og trær som har vokst opp i sonen. */
const BUSKER: [number, number, number][] = [];
for (let i = 0; i < 70; i++) {
    const z = -58 + tall(i + 50) * 116;
    const x = (tall(i + 150) - 0.5) * (SONE - 2);
    if (Math.abs(z) < 3) continue;
    if (TOMME.some((t) => Math.abs(t.z - z) < 3 && Math.abs(x) < 3)) continue;
    BUSKER.push([x, z, 0.6 + tall(i + 250) * 1.1]);
}

/** Sandsekkene og piggtråden langs begge kanter, med åpning ved tverrgata. */
const SEKKER: [number, number, number][] = [];
for (const side of [-1, 1])
    for (let z = -60; z <= 60; z += 1.3)
        for (let lag = 0; lag < 2; lag++) SEKKER.push([side * KANT, z + lag * 0.6, lag]);
const TRAD: [number, number][] = [];
for (const side of [-1, 1]) for (let z = -60; z <= 60; z += 1) TRAD.push([side * (KANT + 0.9), z]);

const FOLK = 50;

const MERKER: Record<Modus, (string | null)[]> = {
    by: ['Nicosia, Kypros', 'Piggtråd og sandsekker', 'Sør: Kypros, med i EU', 'Nord: Nord-Kypros'],
    sone: [
        'Den grønne linjen gjennom Nicosia',
        'Noen meter bred i byen',
        'Tomme hus siden 1974',
        'FN passer på sonen',
    ],
    apning: [
        'April 2003: grensen åpner',
        'Lange køer ved overgangene',
        'Over for å se husene',
        'Noen fant hjemmet sitt. Andre fant fremmede.',
    ],
};

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'by') {
        switch (beat) {
            case 0:
                return { pos: v(-56 + Math.min(t, 12) * 0.8, 2.4, 0.5), se: v(0, 2.4, 0) };
            case 1:
                return { pos: v(-13, 2.8, 2.5), se: v(0, 1.2, -1) };
            case 2:
                return { pos: v(-30, 32, 22), se: v(-8, 0, -4) };
            default:
                return { pos: v(30, 32, 22), se: v(8, 0, -4) };
        }
    }
    if (modus === 'sone') {
        switch (beat) {
            case 0:
                return { pos: v(0, 72, 46 - t * 0.3), se: v(0, 0, -4) };
            case 1:
                return { pos: v(-7, 18, 4), se: v(2, 0, -6) };
            case 2:
                return { pos: v(-3.5, 5, 30 - Math.min(t, 10) * 0.25), se: v(1, 1.5, 14) };
            default:
                return { pos: v(-7, 5, -8), se: v(2.5, 1.5, -20) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-19, 6, 0), se: v(0, 1.5, 0) };
        case 1:
            return { pos: v(-26, 30, 14), se: v(-6, 0, 0) };
        case 2:
            return { pos: v(-15, 9, 0), se: v(2, 0.8, 0) };
        default:
            return { pos: v(12.5, 10, 3.5), se: v(24, 2, -5) };
    }
}

const tmp = new THREE.Object3D();
const farge = new THREE.Color();
const SOR = new THREE.Color('#9fb9dc');
const NORD = new THREE.Color('#e6b48c');
const BAKKE = new THREE.Color('#cbbd9f');

/** Hvor person nr. i står (x, z), og om personen synes. */
function personMål(modus: Modus, beat: number, i: number, t: number): [number, number, boolean] {
    const sor = i < 30;
    if (modus === 'sone') return [0, 0, false];
    if (modus === 'by' || (modus === 'apning' && beat === 0)) {
        if (modus === 'apning' && i % 3 !== 0) return [0, 0, false];
        const x = sor ? -20 - tall(i + 400) * 22 : 20 + tall(i + 400) * 22;
        const z = (tall(i + 500) - 0.5) * 6;
        const gange = modus === 'by' ? Math.sin(t * 0.5 + i) * 1.5 : 0;
        return [x + gange, z, true];
    }
    if (beat === 1) {
        const n = sor ? i : i - 30;
        return [sor ? -8 - n * 1.15 : 8 + n * 1.15, sor ? 1 : -1, true];
    }
    // Folk krysser: sørfra mot nord på den ene siden av gata, nordfra mot sør på den andre.
    const fart = 2.2;
    if (sor) return [-36 + ((i * 2.4 + t * fart) % 72), 1, true];
    return [36 - (((i - 30) * 3.3 + t * fart) % 72), -1, true];
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const husKropp = useRef<THREE.InstancedMesh>(null);
    const husTak = useRef<THREE.InstancedMesh>(null);
    const tomme = useRef<THREE.InstancedMesh>(null);
    const busker = useRef<THREE.InstancedMesh>(null);
    const sekker = useRef<THREE.InstancedMesh>(null);
    const trad = useRef<THREE.InstancedMesh>(null);
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const sorMat = useRef<THREE.MeshStandardMaterial>(null);
    const nordMat = useRef<THREE.MeshStandardMaterial>(null);
    const bomS = useRef<THREE.Group>(null);
    const bomN = useRef<THREE.Group>(null);

    const apen = modus === 'apning';

    const s = useRef({
        forste: true,
        beatTid: 0,
        forrige: -1,
        se: new THREE.Vector3(),
        sor: 0,
        nord: 0,
        bom: 0,
        pos: new Float32Array(FOLK * 2),
    });

    // Det som står stille: hus, busker, sandsekker og piggtråd.
    useLayoutEffect(() => {
        HUS.forEach((hus, i) => {
            tmp.position.set(hus.x, hus.h / 2, hus.z);
            tmp.rotation.set(0, 0, 0);
            tmp.scale.set(5, hus.h, 5);
            tmp.updateMatrix();
            husKropp.current?.setMatrixAt(i, tmp.matrix);
            farge.set(hus.farge);
            husKropp.current?.setColorAt(i, farge);
            tmp.position.set(hus.x, hus.h + 0.15, hus.z);
            tmp.scale.set(5.3, 0.3, 5.3);
            tmp.updateMatrix();
            husTak.current?.setMatrixAt(i, tmp.matrix);
        });
        TOMME.forEach((t, i) => {
            tmp.position.set(0, t.h / 2, t.z);
            tmp.rotation.set(0, (tall(i + 70) - 0.5) * 0.1, 0);
            tmp.scale.set(4.5, t.h, 4.5);
            tmp.updateMatrix();
            tomme.current?.setMatrixAt(i, tmp.matrix);
        });
        BUSKER.forEach(([x, z, r], i) => {
            tmp.position.set(x, r * 0.6, z);
            tmp.rotation.set(0, i, 0);
            tmp.scale.set(r, r * 0.9, r);
            tmp.updateMatrix();
            busker.current?.setMatrixAt(i, tmp.matrix);
        });
        SEKKER.forEach(([x, z, lag], i) => {
            const iApning = apen && Math.abs(z) < 3.2;
            tmp.position.set(x, 0.3 + lag * 0.55, z);
            tmp.rotation.set(0, 0, 0);
            const sk = iApning ? 0.001 : 1;
            tmp.scale.set(0.9 * sk, 0.5 * sk, 1.2 * sk);
            tmp.updateMatrix();
            sekker.current?.setMatrixAt(i, tmp.matrix);
        });
        TRAD.forEach(([x, z], i) => {
            const iApning = apen && Math.abs(z) < 3.2;
            tmp.position.set(x, 0.7, z);
            tmp.rotation.set(0, 0, 0);
            const sk = iApning ? 0.001 : 1;
            tmp.scale.set(sk, sk, sk);
            tmp.updateMatrix();
            trad.current?.setMatrixAt(i, tmp.matrix);
        });
        for (let i = 0; i < FOLK; i++) {
            farge.set(['#1d4ed8', '#b91c1c', '#15803d', '#a16207', '#7c3aed', '#334155'][i % 6]);
            kropp.current?.setColorAt(i, farge);
        }
        for (const m of [husKropp, husTak, tomme, busker, sekker, trad, kropp]) {
            if (m.current) m.current.instanceMatrix.needsUpdate = true;
            if (m.current?.instanceColor) m.current.instanceColor.needsUpdate = true;
        }
    }, [apen]);

    useFrame(({ camera }, rawDt) => {
        const st = s.current;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== st.forrige) {
            st.forrige = beat;
            st.beatTid = 0;
        }
        st.beatTid += dt;
        const glid = st.forste ? 1 : 1 - Math.exp(-1.3 * dt);

        const kam = kameraFor(modus, beat, st.beatTid);
        camera.position.lerp(kam.pos, glid);
        st.se.lerp(kam.se, glid);
        camera.lookAt(st.se);

        // Fargene på sidene: sør blått, nord oransje, når filmen peker på dem.
        const målSor = (modus === 'by' && beat === 2) || (modus === 'sone' && beat === 0) ? 1 : 0;
        const målNord = (modus === 'by' && beat === 3) || (modus === 'sone' && beat === 0) ? 1 : 0;
        const fortid = st.forste ? 1000 : dt;
        st.sor = damp(st.sor, målSor, 1.5, fortid);
        st.nord = damp(st.nord, målNord, 1.5, fortid);
        sorMat.current?.color.copy(BAKKE).lerp(SOR, st.sor * 0.8);
        nordMat.current?.color.copy(BAKKE).lerp(NORD, st.nord * 0.8);

        // Bommene: opp fra første beat i 2003
        st.bom = damp(st.bom, apen ? 1 : 0, 1.2, fortid);
        if (bomS.current) bomS.current.rotation.x = st.bom * 1.35;
        if (bomN.current) bomN.current.rotation.x = st.bom * 1.35;

        // Folk
        for (let i = 0; i < FOLK; i++) {
            const [x, z, synlig] = personMål(modus, beat, i, st.beatTid);
            const gaar = modus === 'apning' && beat >= 2;
            const k = st.forste || gaar ? 1 : 1 - Math.exp(-2 * dt);
            st.pos[i * 2] += (x - st.pos[i * 2]) * k;
            st.pos[i * 2 + 1] += (z - st.pos[i * 2 + 1]) * k;
            const sk = synlig ? 1 : 0.001;
            const hopp = gaar ? Math.abs(Math.sin(st.beatTid * 6 + i)) * 0.08 : 0;
            tmp.rotation.set(0, 0, 0);
            tmp.position.set(st.pos[i * 2], 0.65 + hopp, st.pos[i * 2 + 1]);
            tmp.scale.set(sk, sk, sk);
            tmp.updateMatrix();
            kropp.current?.setMatrixAt(i, tmp.matrix);
            tmp.position.set(st.pos[i * 2], 1.55 + hopp, st.pos[i * 2 + 1]);
            tmp.updateMatrix();
            hode.current?.setMatrixAt(i, tmp.matrix);
        }
        if (kropp.current) kropp.current.instanceMatrix.needsUpdate = true;
        if (hode.current) hode.current.instanceMatrix.needsUpdate = true;

        st.forste = false;
    });

    const markiser = useMemo(() => {
        const l: { x: number; z: number; f: string }[] = [];
        for (const side of [-1, 1])
            for (const x of RAD_X.slice(0, 6))
                for (const z of [-4.3, 4.3])
                    l.push({
                        x: side * x,
                        z,
                        f: ['#b91c1c', '#15803d', '#0369a1', '#c2410c'][(x + (z > 0 ? 1 : 0)) % 4],
                    });
        return l;
    }, []);

    return (
        <>
            <color attach="background" args={['#bfdcf0']} />
            <fog attach="fog" args={['#d7e7f2', 70, 190]} />
            <hemisphereLight args={['#fff7e6', '#7a6e58', 1.35]} />
            <directionalLight position={[-25, 40, 20]} intensity={1.7} />

            {/* Bakken: sør og nord */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-65, 0, 0]}>
                <planeGeometry args={[120, 200]} />
                <meshStandardMaterial ref={sorMat} color="#cbbd9f" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[65, 0, 0]}>
                <planeGeometry args={[120, 200]} />
                <meshStandardMaterial ref={nordMat} color="#cbbd9f" />
            </mesh>
            {/* Sonen: gjengrodd stripe */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <planeGeometry args={[SONE, 200]} />
                <meshStandardMaterial color="#8d9460" />
            </mesh>
            {/* Tverrgata, gjennom sonen bare når grensen er åpen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-36, 0.03, 0]}>
                <planeGeometry args={[62, 7]} />
                <meshStandardMaterial color="#8b8781" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[36, 0.03, 0]}>
                <planeGeometry args={[62, 7]} />
                <meshStandardMaterial color="#8b8781" />
            </mesh>
            {apen && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
                    <planeGeometry args={[SONE + 0.2, 7]} />
                    <meshStandardMaterial color="#8b8781" />
                </mesh>
            )}

            <instancedMesh ref={husKropp} args={[undefined, undefined, HUS.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#ffffff" flatShading />
            </instancedMesh>
            <instancedMesh ref={husTak} args={[undefined, undefined, HUS.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#b45f3c" flatShading />
            </instancedMesh>
            <instancedMesh ref={tomme} args={[undefined, undefined, TOMME.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#8f8a82" flatShading />
            </instancedMesh>
            <instancedMesh ref={busker} args={[undefined, undefined, BUSKER.length]}>
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#5c7a3a" flatShading />
            </instancedMesh>
            <instancedMesh ref={sekker} args={[undefined, undefined, SEKKER.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#b9a274" flatShading />
            </instancedMesh>
            <instancedMesh ref={trad} args={[undefined, undefined, TRAD.length]}>
                <torusGeometry args={[0.5, 0.05, 4, 10]} />
                <meshStandardMaterial color="#4b5563" metalness={0.4} roughness={0.5} />
            </instancedMesh>
            <instancedMesh ref={kropp} args={[undefined, undefined, FOLK]}>
                <cylinderGeometry args={[0.3, 0.36, 1.3, 8]} />
                <meshStandardMaterial color="#ffffff" />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, FOLK]}>
                <sphereGeometry args={[0.3, 10, 8]} />
                <meshStandardMaterial color="#e8bf98" />
            </instancedMesh>

            {/* Markiser over kafeene langs tverrgata */}
            {markiser.map((m) => (
                <mesh
                    key={`${m.x}-${m.z}`}
                    position={[m.x, 3, m.z + (m.z > 0 ? -0.6 : 0.6)]}
                    rotation={[m.z > 0 ? 0.35 : -0.35, 0, 0]}
                >
                    <boxGeometry args={[4.4, 0.12, 1.6]} />
                    <meshStandardMaterial color={m.f} />
                </mesh>
            ))}

            {/* Vinduer i de tomme husene: mørke hull */}
            {TOMME.map((t) => (
                <group key={t.z} position={[0, 0, t.z]}>
                    {[-1, 1].map((sd) =>
                        [1.5, 3.2].map((y) =>
                            y < t.h - 0.5 ? (
                                <mesh key={`${sd}-${y}`} position={[sd * 2.27, y, 0]}>
                                    <boxGeometry args={[0.05, 1, 2.6]} />
                                    <meshStandardMaterial color="#27272a" />
                                </mesh>
                            ) : null
                        )
                    )}
                </group>
            ))}

            {/* FN-posten inne i sonen */}
            <group position={[2.5, 0, -20]}>
                <mesh position={[0, 1.4, 0]}>
                    <boxGeometry args={[3, 2.8, 3]} />
                    <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <mesh position={[1.3, 4, 1.3]}>
                    <cylinderGeometry args={[0.06, 0.06, 5, 6]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
                <mesh position={[1.3, 5.9, 2.0]}>
                    <boxGeometry args={[0.05, 0.9, 1.4]} />
                    <meshStandardMaterial color="#38bdf8" />
                </mesh>
                <mesh position={[-1, 0.8, 4.5]}>
                    <boxGeometry args={[2, 1.3, 3.6]} />
                    <meshStandardMaterial color="#f1f5f9" />
                </mesh>
            </group>

            {/* Bommene ved overgangen */}
            {[-1, 1].map((sd) => (
                <group key={sd} position={[sd * (KANT + 1.6), 0, 3.4]}>
                    <mesh position={[0, 0.6, 0]}>
                        <boxGeometry args={[0.4, 1.2, 0.4]} />
                        <meshStandardMaterial color="#334155" />
                    </mesh>
                    <group ref={sd < 0 ? bomS : bomN} position={[0, 1.1, 0]}>
                        <mesh position={[0, 0, -3.3]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.1, 0.1, 6.6, 6]} />
                            <meshStandardMaterial color="#dc2626" />
                        </mesh>
                    </group>
                </group>
            ))}

            <Merker modus={modus} beat={beat} />
        </>
    );
}

function Merker({ modus, beat }: { modus: Modus; beat: number }) {
    const merker: { tekst: string; pos: [number, number, number]; farge: string }[] = [];
    if ((modus === 'by' && beat === 2) || (modus === 'sone' && beat === 0))
        merker.push({ tekst: 'Kypros', pos: [-24, 12, 0], farge: '#1e3a8a' });
    if ((modus === 'by' && beat === 3) || (modus === 'sone' && beat === 0))
        merker.push({ tekst: 'Nord-Kypros', pos: [24, 12, 0], farge: '#9a3412' });
    if (modus === 'sone' && beat === 1)
        merker.push({ tekst: 'Sonen', pos: [0, 3, 6], farge: '#166534' });
    if (modus === 'sone' && beat === 3)
        merker.push({ tekst: 'FN', pos: [2.5, 3.6, -18.3], farge: '#0369a1' });
    return (
        <>
            {merker.map((m) => (
                <Html key={m.tekst} position={m.pos} center zIndexRange={[20, 0]}>
                    <div
                        className="whitespace-nowrap px-4 py-1.5 rounded-xl bg-white/90 shadow-lg text-2xl font-black"
                        style={{ color: m.farge }}
                    >
                        {m.tekst}
                    </div>
                </Html>
            ))}
        </>
    );
}

export function KyprosGata({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'by';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = MERKER[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 46, near: 0.3, far: 400, position: [-40, 20, 30] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
