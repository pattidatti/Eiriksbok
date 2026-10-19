import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Varosha: hotellrekka langs stranda. Hotellene står langs x-aksen med fasaden mot z = 0.
 * Gata ligger ved z 1-7, stranda ved z 8-20 og havet utenfor. To modus:
 * «for»: ferieby i 1974, folk på stranda som flykter, og byen som blir stående tom.
 * «stengt»: gjerdet rundt den militære sonen, rustne biler, klær til tørk, åpningen i 2020.
 */

type Modus = 'for' | 'stengt';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
function tall(i: number) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const HOTELL = Array.from({ length: 11 }, (_, i) => ({
    x: -55 + i * 11,
    h: 12 + Math.round(tall(i + 3) * 5) * 3,
    farge: ['#f8fafc', '#fef3c7', '#e0f2fe', '#fde2e4', '#f1f5f9'][i % 5],
}));
const BALKONGER: { x: number; y: number; hotell: number }[] = [];
HOTELL.forEach((h, i) => {
    for (let y = 3; y < h.h - 1; y += 3) BALKONGER.push({ x: h.x, y, hotell: i });
});

const PARASOLLER: [number, number][] = [];
for (let i = 0; i < 26; i++)
    PARASOLLER.push([-52 + i * 4.1 + tall(i) * 1.5, 11 + tall(i + 40) * 6]);

const BILER = [-34, -20, 4, 14, 30, 44];
const FOLK = 60;
const GJERDE: number[] = [];
for (let x = -62; x <= 62; x += 2) GJERDE.push(x);
/** Delen av gjerdet som åpnes i 2020. */
const AAPNES = (x: number) => x > 20 && x < 36;

const MERKER: Record<Modus, (string | null)[]> = {
    for: [
        'Varosha, ved Famagusta',
        '1974: 40 000 innbyggere',
        'En av de fineste strendene på Kypros',
        'Flukten',
        'Noen dager ble til 50 år',
    ],
    stengt: [
        'Stengt: militær sone',
        'Varene ble liggende',
        '2020: deler av byen åpnes',
        'FNs sikkerhetsråd',
        'Hvem eier husene?',
    ],
};

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'for') {
        switch (beat) {
            case 0:
                return { pos: v(0, 16, 64 - Math.min(t, 10) * 0.6), se: v(0, 8, 0) };
            case 1:
                return { pos: v(-34 + Math.min(t, 10) * 0.8, 11, 40), se: v(-4, 10, -3) };
            case 2:
                return { pos: v(9, 3, 27), se: v(0, 2, 12) };
            case 3:
                return { pos: v(-30, 16, 44), se: v(-45, 1, 6) };
            default:
                return { pos: v(0, 12, 58 - Math.min(t, 10) * 0.5), se: v(0, 9, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(16, 9, 32), se: v(0, 3, 3) };
        case 1:
            return { pos: v(-16, 3.5, 7.2), se: v(0, 3.5, 1) };
        case 2:
            return { pos: v(28, 11, 30), se: v(28, 1, 5) };
        case 3:
            return { pos: v(0, 42, 62), se: v(0, 0, 0) };
        default: {
            const x = -40 + Math.min(t, 14) * 1.2;
            return { pos: v(x, 6, 18), se: v(x + 18, 7, 0) };
        }
    }
}

const tmp = new THREE.Object3D();
const farge = new THREE.Color();
const GRAATT = new THREE.Color('#8a8178');
const RUST = new THREE.Color('#7c4a2a');

/** Hvor person nr. i er på vei: [x, z, synlig]. */
function personMål(modus: Modus, beat: number, i: number): [number, number, boolean] {
    if (modus === 'for') {
        if (beat <= 2) return [-55 + tall(i + 700) * 110, 9 + tall(i + 800) * 10, true];
        if (beat === 3) return [-70 - tall(i + 900) * 30, 3 + tall(i + 950) * 3, true];
        return [-130, 4, false];
    }
    if (beat === 2 && i < 8) return [24 + tall(i + 600) * 10, 9 + tall(i + 650) * 5, true];
    return [40, 30, false];
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const hotell = useRef<THREE.InstancedMesh>(null);
    const balkong = useRef<THREE.InstancedMesh>(null);
    const stang = useRef<THREE.InstancedMesh>(null);
    const skjerm = useRef<THREE.InstancedMesh>(null);
    const biler = useRef<THREE.InstancedMesh>(null);
    const gjerde = useRef<THREE.InstancedMesh>(null);
    const himmel = useRef<THREE.Color>(null);
    const sol = useRef<THREE.DirectionalLight>(null);

    const s = useRef({
        forste: true,
        beatTid: 0,
        forrige: -1,
        se: new THREE.Vector3(),
        forfall: 0,
        gjerde: 0,
        aapen: 0,
        pos: new Float32Array(FOLK * 2),
    });

    useLayoutEffect(() => {
        BALKONGER.forEach((b, i) => {
            tmp.position.set(b.x, b.y, 0.5);
            tmp.rotation.set(0, 0, 0);
            // Noen balkonger har falt ned i den stengte byen.
            const borte = modus === 'stengt' && tall(i + 300) < 0.18;
            const sk = borte ? 0.001 : 1;
            tmp.scale.set(9.2 * sk, 0.35 * sk, 1.2 * sk);
            tmp.updateMatrix();
            balkong.current?.setMatrixAt(i, tmp.matrix);
        });
        PARASOLLER.forEach(([x, z], i) => {
            const sk = modus === 'for' && beat < 4 ? 1 : 0.001;
            tmp.rotation.set(0, 0, 0);
            tmp.position.set(x, 1.1, z);
            tmp.scale.set(sk, sk, sk);
            tmp.updateMatrix();
            stang.current?.setMatrixAt(i, tmp.matrix);
            tmp.position.set(x, 2.3, z);
            tmp.updateMatrix();
            skjerm.current?.setMatrixAt(i, tmp.matrix);
            farge.set(['#ef4444', '#f59e0b', '#0ea5e9', '#22c55e'][i % 4]);
            skjerm.current?.setColorAt(i, farge);
        });
        BILER.forEach((x, i) => {
            tmp.position.set(x, 0.75, 3 + (i % 2) * 2);
            tmp.rotation.set(0, 0, modus === 'stengt' && i % 3 === 1 ? 0.12 : 0);
            tmp.scale.set(4, 1.5, 1.9);
            tmp.updateMatrix();
            biler.current?.setMatrixAt(i, tmp.matrix);
            if (modus === 'stengt') farge.copy(RUST).offsetHSL(0, 0, (tall(i) - 0.5) * 0.1);
            else farge.set(['#dc2626', '#2563eb', '#f8fafc', '#16a34a', '#facc15', '#0f172a'][i]);
            biler.current?.setColorAt(i, farge);
        });
        for (let i = 0; i < FOLK; i++) {
            farge.set(['#f43f5e', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#f8fafc'][i % 6]);
            kropp.current?.setColorAt(i, farge);
        }
        for (const m of [balkong, stang, skjerm, biler, kropp]) {
            if (m.current) m.current.instanceMatrix.needsUpdate = true;
            if (m.current?.instanceColor) m.current.instanceColor.needsUpdate = true;
        }
    }, [modus, beat]);

    useFrame(({ camera }, rawDt) => {
        const st = s.current;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== st.forrige) {
            st.forrige = beat;
            st.beatTid = 0;
        }
        st.beatTid += dt;
        const glid = st.forste ? 1 : 1 - Math.exp(-1.3 * dt);
        const fortid = st.forste ? 1000 : dt;

        const kam = kameraFor(modus, beat, st.beatTid);
        camera.position.lerp(kam.pos, glid);
        st.se.lerp(kam.se, glid);
        camera.lookAt(st.se);

        // Forfall: hotellene blir grå og byen mørkere.
        const målForfall = modus === 'stengt' ? (beat >= 4 ? 1 : 0.8) : beat >= 4 ? 0.65 : 0;
        st.forfall = damp(st.forfall, målForfall, 1.1, fortid);
        HOTELL.forEach((h, i) => {
            tmp.position.set(h.x, h.h / 2, -5);
            tmp.rotation.set(0, 0, 0);
            tmp.scale.set(9, h.h, 10);
            tmp.updateMatrix();
            hotell.current?.setMatrixAt(i, tmp.matrix);
            farge.set(h.farge).lerp(GRAATT, st.forfall * 0.85);
            hotell.current?.setColorAt(i, farge);
        });
        if (hotell.current) {
            hotell.current.instanceMatrix.needsUpdate = true;
            if (hotell.current.instanceColor) hotell.current.instanceColor.needsUpdate = true;
        }
        himmel.current?.set('#9fd3f0').lerp(new THREE.Color('#b9b4ad'), st.forfall * 0.6);
        if (sol.current) sol.current.intensity = 1.8 - st.forfall * 0.6;

        // Gjerdet reiser seg i den stengte byen; en bit åpnes i 2020.
        st.gjerde = damp(st.gjerde, modus === 'stengt' ? 1 : 0, 1.6, fortid);
        st.aapen = damp(st.aapen, modus === 'stengt' && beat >= 2 ? 1 : 0, 1.4, fortid);
        GJERDE.forEach((x, i) => {
            const h = Math.max(0.001, st.gjerde * (AAPNES(x) ? 1 - st.aapen : 1));
            tmp.position.set(x, 1.2 * h, 7.6);
            tmp.rotation.set(0, 0, 0);
            tmp.scale.set(1.9, 2.4 * h, 0.08);
            tmp.updateMatrix();
            gjerde.current?.setMatrixAt(i, tmp.matrix);
        });
        if (gjerde.current) gjerde.current.instanceMatrix.needsUpdate = true;

        // Folk
        for (let i = 0; i < FOLK; i++) {
            const [x, z, synlig] = personMål(modus, beat, i);
            const fart = st.forste ? 1 : 1 - Math.exp(-(0.25 + tall(i + 33) * 0.3) * dt);
            st.pos[i * 2] += (x - st.pos[i * 2]) * fart;
            st.pos[i * 2 + 1] += (z - st.pos[i * 2 + 1]) * fart;
            const sk = synlig ? 1 : 0.001;
            tmp.rotation.set(0, 0, 0);
            tmp.scale.set(sk, sk, sk);
            tmp.position.set(st.pos[i * 2], 0.65, st.pos[i * 2 + 1]);
            tmp.updateMatrix();
            kropp.current?.setMatrixAt(i, tmp.matrix);
            tmp.position.set(st.pos[i * 2], 1.55, st.pos[i * 2 + 1]);
            tmp.updateMatrix();
            hode.current?.setMatrixAt(i, tmp.matrix);
        }
        if (kropp.current) kropp.current.instanceMatrix.needsUpdate = true;
        if (hode.current) hode.current.instanceMatrix.needsUpdate = true;

        st.forste = false;
    });

    const klær = useMemo(
        () => [
            { x: -3, f: '#e11d48' },
            { x: -1.8, f: '#2563eb' },
            { x: -0.6, f: '#facc15' },
            { x: 0.6, f: '#f8fafc' },
        ],
        []
    );

    return (
        <>
            <color ref={himmel} attach="background" args={['#9fd3f0']} />
            <fog attach="fog" args={['#cfe6f3', 80, 220]} />
            <hemisphereLight args={['#fff7e6', '#8a7a5c', 1.3]} />
            <directionalLight ref={sol} position={[20, 40, 30]} intensity={1.8} />

            {/* Havet, sanden og gata */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 80]}>
                <planeGeometry args={[400, 120]} />
                <meshStandardMaterial color="#2b8cc4" emissive="#1e6f9f" emissiveIntensity={0.35} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 14]}>
                <planeGeometry args={[400, 12.5]} />
                <meshStandardMaterial color="#ecd9a8" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]}>
                <planeGeometry args={[400, 60]} />
                <meshStandardMaterial color="#b9ad93" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 4]}>
                <planeGeometry args={[400, 6.5]} />
                <meshStandardMaterial color="#7d7a75" />
            </mesh>

            <instancedMesh ref={hotell} args={[undefined, undefined, HOTELL.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#ffffff" flatShading />
            </instancedMesh>
            <instancedMesh ref={balkong} args={[undefined, undefined, BALKONGER.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#cbd5e1" />
            </instancedMesh>
            <instancedMesh ref={stang} args={[undefined, undefined, PARASOLLER.length]}>
                <cylinderGeometry args={[0.06, 0.06, 2.2, 5]} />
                <meshStandardMaterial color="#f8fafc" />
            </instancedMesh>
            <instancedMesh ref={skjerm} args={[undefined, undefined, PARASOLLER.length]}>
                <coneGeometry args={[1.5, 0.7, 10]} />
                <meshStandardMaterial color="#ffffff" />
            </instancedMesh>
            <instancedMesh ref={biler} args={[undefined, undefined, BILER.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#ffffff" flatShading />
            </instancedMesh>
            <instancedMesh ref={gjerde} args={[undefined, undefined, GJERDE.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#64748b" transparent opacity={0.75} />
            </instancedMesh>
            <instancedMesh ref={kropp} args={[undefined, undefined, FOLK]}>
                <cylinderGeometry args={[0.3, 0.36, 1.3, 8]} />
                <meshStandardMaterial color="#ffffff" />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, FOLK]}>
                <sphereGeometry args={[0.3, 10, 8]} />
                <meshStandardMaterial color="#e8bf98" />
            </instancedMesh>

            {/* Klær til tørk på en balkong i den stengte byen */}
            {modus === 'stengt' &&
                klær.map((k) => (
                    <mesh key={k.x} position={[k.x, 4.7, 1.0]}>
                        <boxGeometry args={[0.9, 1.1, 0.04]} />
                        <meshStandardMaterial color={k.f} />
                    </mesh>
                ))}

            {/* Røde skilt på gjerdet */}
            {modus === 'stengt' &&
                [-48, -24, 0, 44].map((x) => (
                    <mesh key={x} position={[x, 1.6, 7.75]}>
                        <boxGeometry args={[1.6, 1, 0.06]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                ))}

            <Merker modus={modus} beat={beat} />
        </>
    );
}

function Merker({ modus, beat }: { modus: Modus; beat: number }) {
    const merker: { tekst: string; pos: [number, number, number]; farge: string }[] = [];
    if (modus === 'stengt' && beat === 1) {
        merker.push({ tekst: 'Klær til tørk', pos: [-1.2, 3.5, 1.2], farge: '#0f172a' });
        merker.push({ tekst: 'Rustne biler', pos: [7, 2.1, 5], farge: '#7c2d12' });
    }
    if (modus === 'stengt' && beat === 3)
        merker.push({ tekst: 'FN: gi byen tilbake', pos: [0, 12, 2], farge: '#0369a1' });
    if (modus === 'stengt' && beat === 0)
        merker.push({ tekst: 'Ingen adgang', pos: [0, 4, 7.7], farge: '#b91c1c' });
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

export function KyprosVarosha({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'for';
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
                camera={{ fov: 46, near: 0.3, far: 400, position: [0, 16, 60] }}
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
