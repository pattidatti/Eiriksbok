import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Vestkysten av Grønland i 3D: skipet ved Håbets Havn, tre skip fra Bergen, ruinene etter
 * nordboernes gårder, de nye husene i Godthåb og skipet som seiler hjem i 1736. Kamera og
 * skip glir mot et mål per beat, så eleven kan hoppe rett til en hvilken som helst beat.
 */

type Modus = 'ankomst' | 'ruiner' | 'godthab' | 'avreise';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Faste steder i verden.
const HAVN = v(0, 0, -6); // Håbets Havn: den lille øya
const RUINER = v(78, 2.2, -40); // gårdsruiner inne i en fjord lenger sør
const GODTHAB = v(-70, 1.6, -34); // det nye stedet i 1728

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'ankomst') {
        switch (beat) {
            case 0:
                return { pos: v(34 - t * 0.5, 9, 34), se: v(0, 3, -6) };
            case 1:
                return { pos: v(9, 4.2, 12), se: v(2, 2.4, 2) };
            case 2:
                return { pos: v(-4, 6, 16), se: v(-30 - t * 0.6, 8, -60) };
            case 3:
                return { pos: v(0, 40, 46), se: v(0, 0, -20) };
            default:
                return { pos: v(46, 7, -8 + t * 0.2), se: RUINER.clone().add(v(0, 1, 0)) };
        }
    }
    if (modus === 'ruiner') {
        switch (beat) {
            case 0:
                return { pos: v(-14 + t * 1.2, 8, 30), se: v(t * 1.2, 2, 12) };
            case 1:
                return { pos: v(20, 12, 24), se: v(0, 2, -6) };
            case 2:
                return { pos: RUINER.clone().add(v(-12, 6, 14)), se: RUINER.clone().add(v(0, 0.5, 0)) };
            default:
                return { pos: RUINER.clone().add(v(-24 - t * 0.6, 20, 28)), se: RUINER.clone().add(v(-10, 0, -10)) };
        }
    }
    if (modus === 'godthab') {
        switch (beat) {
            case 0:
                return { pos: v(16, 7, 16), se: v(0, 1.5, -6) };
            case 1:
                return { pos: GODTHAB.clone().add(v(16, 9, 22)), se: GODTHAB.clone().add(v(0, 1, 0)) };
            case 2:
                return { pos: GODTHAB.clone().add(v(26, 22, 34)), se: GODTHAB.clone() };
            default:
                return { pos: GODTHAB.clone().add(v(12 - t * 0.4, 6, 16)), se: GODTHAB.clone().add(v(0, 1.5, 0)) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: GODTHAB.clone().add(v(9, 4, 11)), se: GODTHAB.clone().add(v(0, 1.4, 0)) };
        case 1:
            return { pos: GODTHAB.clone().add(v(14, 7, 17)), se: GODTHAB.clone().add(v(0, 1.4, 0)) };
        case 2:
            return { pos: GODTHAB.clone().add(v(34, 10, 46)), se: GODTHAB.clone().add(v(10, 1, 26)) };
        default:
            return { pos: v(-20, 10, 70 + t * 0.6), se: v(-44, 3, 30) };
    }
}

/** Hvor skip nr. i står for hver beat. */
function skipFor(modus: Modus, beat: number, t: number, i: number): { pos: THREE.Vector3; yaw: number; vis: boolean } {
    if (modus === 'ankomst') return { pos: v(4, 0, 2), yaw: 0.3, vis: i === 0 };
    if (modus === 'ruiner') {
        if (beat === 0) return { pos: v(-6 + t * 1.2 + i * -9, 0, 14 + i * 4), yaw: 0, vis: true };
        return { pos: v(4 + i * 7, 0, 2 + i * 3), yaw: 0.3 + i * 0.2, vis: true };
    }
    if (modus === 'godthab') {
        if (beat === 0) return { pos: v(4, 0, 2), yaw: 0.3, vis: i === 0 };
        return { pos: GODTHAB.clone().add(v(4, -1.6, 28)), yaw: 0.6, vis: i === 0 };
    }
    // avreise
    if (beat <= 1) return { pos: GODTHAB.clone().add(v(4, -1.6, 28)), yaw: 0.6, vis: i === 0 };
    if (beat === 2) return { pos: GODTHAB.clone().add(v(10 + t * 1.1, -1.6, 30 + t * 1.1)), yaw: -0.8, vis: i === 0 };
    return { pos: v(-36 + t * 0.9, 0, 46 + t * 0.9), yaw: -0.8, vis: i === 0 };
}

/** Et lite seilskip fra 1700-tallet, bygd av bokser og sylindere. */
function Skip({ indeks, modus, beat, playing }: { indeks: number; modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(beat);
    const forste = useRef(true);
    const skrog = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-3.2, 0.9);
        s.lineTo(3.6, 0.9);
        s.quadraticCurveTo(3.4, -0.2, 2.2, -0.7);
        s.lineTo(-2.4, -0.7);
        s.quadraticCurveTo(-3.2, -0.3, -3.2, 0.9);
        const g = new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: false });
        g.translate(0, 0, -0.9);
        return g;
    }, []);
    useEffect(() => () => skrog.dispose(), [skrog]);
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const m = skipFor(modus, beat, tid.current, indeks);
        const k = forste.current ? 1 : 1 - Math.exp(-1.6 * dt);
        forste.current = false;
        g.position.lerp(m.pos, k);
        g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, m.yaw, k);
        g.visible = m.vis;
        g.position.y = m.pos.y + Math.sin(performance.now() / 900 + indeks) * 0.08;
        g.rotation.z = Math.sin(performance.now() / 1300 + indeks) * 0.03;
    });
    return (
        <group ref={ref}>
            <mesh geometry={skrog}>
                <meshStandardMaterial color="#5b3a1e" flatShading />
            </mesh>
            <mesh position={[-2.6, 1.4, 0]}>
                <boxGeometry args={[1.2, 1, 1.7]} />
                <meshStandardMaterial color="#7c4a24" flatShading />
            </mesh>
            {[-0.6, 1.8].map((x, j) => (
                <group key={x} position={[x, 0.9, 0]}>
                    <mesh position={[0, 2.8, 0]}>
                        <cylinderGeometry args={[0.08, 0.11, 5.6, 6]} />
                        <meshStandardMaterial color="#3f2a16" />
                    </mesh>
                    <mesh position={[0, 3.2 - j * 0.3, 0]}>
                        <boxGeometry args={[0.08, 2.2 - j * 0.3, 2.6 - j * 0.4]} />
                        <meshStandardMaterial color="#f3ead6" emissive="#6b5f48" emissiveIntensity={0.2} />
                    </mesh>
                </group>
            ))}
            <mesh position={[1.8, 6.6, 0.3]}>
                <boxGeometry args={[0.04, 0.5, 0.8]} />
                <meshStandardMaterial color="#c8102e" />
            </mesh>
            {/* Folk på dekk: presten og familien. */}
            {indeks === 0 &&
                [-1.6, -0.9, 0.2, 0.8].map((x, j) => (
                    <mesh key={x} position={[x, 1.35 - (j > 1 ? 0.15 : 0), 0.5 - j * 0.2]}>
                        <capsuleGeometry args={[0.16, j > 1 ? 0.3 : 0.55, 3, 6]} />
                        <meshStandardMaterial color={j === 0 ? '#111827' : '#475569'} />
                    </mesh>
                ))}
        </group>
    );
}

/** Fjell langs kysten: fast, «tilfeldig» oppsett. */
function Fjell() {
    const liste = useMemo(() => {
        const ut: { p: [number, number, number]; h: number; r: number; rot: number }[] = [];
        let s = 11;
        const r = () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
        for (let i = 0; i < 22; i++) {
            const x = -150 + i * 14 + r() * 6;
            const h = 18 + r() * 26;
            ut.push({ p: [x, h / 2 - 1, -78 - r() * 20], h, r: 14 + r() * 10, rot: r() * 3 });
        }
        return ut;
    }, []);
    return (
        <group>
            {liste.map((f, i) => (
                <group key={i} position={f.p} rotation={[0, f.rot, 0]}>
                    <mesh>
                        <coneGeometry args={[f.r, f.h, 6]} />
                        <meshStandardMaterial color="#6b7280" flatShading />
                    </mesh>
                    <mesh position={[0, f.h * 0.32, 0]}>
                        <coneGeometry args={[f.r * 0.36, f.h * 0.36, 6]} />
                        <meshStandardMaterial color="#f8fafc" flatShading />
                    </mesh>
                </group>
            ))}
            {/* Lavt land mellom fjellene og havet, med to platåer for ruinene og Godthåb. */}
            <mesh position={[0, 0.6, -58]}>
                <boxGeometry args={[320, 2.4, 44]} />
                <meshStandardMaterial color="#7c8a6a" flatShading />
            </mesh>
            <mesh position={[RUINER.x, 0.9, RUINER.z + 4]}>
                <boxGeometry args={[40, 2.6, 30]} />
                <meshStandardMaterial color="#81906b" flatShading />
            </mesh>
            <mesh position={[GODTHAB.x, 0.7, GODTHAB.z + 3]}>
                <boxGeometry args={[44, 2, 26]} />
                <meshStandardMaterial color="#81906b" flatShading />
            </mesh>
        </group>
    );
}

/** Håbets Havn: en liten, steinete øy. */
function Oya({ hus }: { hus: boolean }) {
    return (
        <group position={HAVN}>
            {[
                [0, 0, 0, 7],
                [-5, -0.4, 2, 4.5],
                [5, -0.6, -1, 5],
                [2, -0.4, 4, 3.5],
            ].map(([x, y, z, r], i) => (
                <mesh key={i} position={[x, y, z]} scale={[1, 0.32, 1]}>
                    <dodecahedronGeometry args={[r, 0]} />
                    <meshStandardMaterial color={i === 0 ? '#6b705c' : '#78716c'} flatShading />
                </mesh>
            ))}
            {hus && <Hus pos={[0, 2.2, 0]} />}
        </group>
    );
}

function Hus({ pos, lys = 0, skala = 1 }: { pos: [number, number, number]; lys?: number; skala?: number }) {
    return (
        <group position={pos} scale={skala}>
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[3, 1.8, 2.2]} />
                <meshStandardMaterial color="#8b5a2b" flatShading />
            </mesh>
            <mesh position={[0, 2.25, 0]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[1.6, 1.6, 2.3]} />
                <meshStandardMaterial color="#3f3f46" flatShading />
            </mesh>
            <mesh position={[0.6, 0.95, 1.11]}>
                <planeGeometry args={[0.6, 0.6]} />
                <meshStandardMaterial color="#1f2937" emissive="#ffc861" emissiveIntensity={lys * 2.2} />
            </mesh>
        </group>
    );
}

/** Godthåb: husene vokser fram når kolonien flytter dit. */
function Godthab({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const lysRef = useRef(0);
    const forste = useRef(true);
    const synlig = modus === 'avreise' || (modus === 'godthab' && beat >= 1);
    // Lys i vinduene: kvelden i 1735, og når kongen lar kolonien bli.
    const lysMal = modus === 'avreise' ? (beat === 0 ? 1 : beat === 1 ? 0.35 : 0.6) : modus === 'godthab' && beat >= 3 ? 1 : 0;
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const mal = synlig ? 1 : 0.001;
        const s = forste.current ? mal : damp(g.scale.y, mal, 2.2, dt);
        lysRef.current = forste.current ? lysMal : damp(lysRef.current, lysMal, 2, dt);
        forste.current = false;
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
        g.traverse((o) => {
            const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
            if (m && m.emissive && m.userData.vindu) m.emissiveIntensity = lysRef.current * 2.2;
        });
    });
    const plasser: [number, number, number][] = [
        [-6, 0, -2],
        [-1, 0, 1],
        [4, 0, -1],
        [-3, 0, -6],
        [3, 0, -6],
    ];
    return (
        <group ref={ref} position={GODTHAB}>
            {plasser.map((p, i) => (
                <group key={i} position={p}>
                    <mesh position={[0, 0.9, 0]}>
                        <boxGeometry args={[3, 1.8, 2.2]} />
                        <meshStandardMaterial color={i === 1 ? '#7f1d1d' : '#8b5a2b'} flatShading />
                    </mesh>
                    <mesh position={[0, 2.25, 0]} rotation={[0, 0, Math.PI / 4]}>
                        <boxGeometry args={[1.6, 1.6, 2.3]} />
                        <meshStandardMaterial color="#3f3f46" flatShading />
                    </mesh>
                    <mesh position={[0.6, 0.95, 1.11]}>
                        <planeGeometry args={[0.6, 0.6]} />
                        <meshStandardMaterial color="#1f2937" emissive="#ffc861" emissiveIntensity={0} userData={{ vindu: true }} />
                    </mesh>
                </group>
            ))}
            {/* Kirke med kors */}
            <group position={[9, 0, -3]}>
                <mesh position={[0, 1.3, 0]}>
                    <boxGeometry args={[2.4, 2.6, 4]} />
                    <meshStandardMaterial color="#e7e5e4" flatShading />
                </mesh>
                <mesh position={[0, 3.4, 0]} rotation={[Math.PI / 4, 0, 0]}>
                    <boxGeometry args={[2.5, 2, 2]} />
                    <meshStandardMaterial color="#44403c" flatShading />
                </mesh>
                <mesh position={[0, 5.2, 1.4]}>
                    <boxGeometry args={[0.18, 1.6, 0.18]} />
                    <meshStandardMaterial color="#44403c" />
                </mesh>
                <mesh position={[0, 5.5, 1.4]}>
                    <boxGeometry args={[0.9, 0.18, 0.18]} />
                    <meshStandardMaterial color="#44403c" />
                </mesh>
            </group>
        </group>
    );
}

/** Ruinene etter en norrøn gård: lave steinmurer uten tak. */
function Ruiner() {
    const murer: [number, number, number, number, number][] = [
        // x, z, lengde, rotasjon, høyde
        [0, -3, 8, 0, 1.2],
        [0, 3, 8, 0, 0.8],
        [-4, 0, 6, Math.PI / 2, 1.0],
        [4, 0.8, 4.4, Math.PI / 2, 0.6],
        [10, -2, 5, 0, 0.9],
        [10, 2, 5, 0, 0.5],
        [7.5, 0, 4, Math.PI / 2, 0.7],
        [-10, 4, 4, 0.3, 0.6],
        [-12, 1, 3.4, Math.PI / 2 + 0.3, 0.5],
    ];
    return (
        <group position={RUINER}>
            {murer.map(([x, z, l, rot, h], i) => (
                <mesh key={i} position={[x, h / 2, z]} rotation={[0, rot, 0]}>
                    <boxGeometry args={[l, h, 0.9]} />
                    <meshStandardMaterial color={i % 2 ? '#a8a29e' : '#8f8a84'} flatShading />
                </mesh>
            ))}
            {[
                [3, 6, 0.8],
                [-6, -5, 0.6],
                [13, 5, 0.7],
                [-2, 7, 0.5],
            ].map(([x, z, r], i) => (
                <mesh key={`s${i}`} position={[x, r * 0.4, z]}>
                    <dodecahedronGeometry args={[r, 0]} />
                    <meshStandardMaterial color="#78716c" flatShading />
                </mesh>
            ))}
        </group>
    );
}

function Isfjell({ pos, s }: { pos: [number, number, number]; s: number }) {
    return (
        <group position={pos} scale={s}>
            {[
                [0, 0.9, 0, 1.6],
                [1.2, 0.5, 0.6, 1.1],
                [-1, 0.4, -0.4, 1.2],
            ].map(([x, y, z, r], i) => (
                <mesh key={i} position={[x, y, z]}>
                    <dodecahedronGeometry args={[r, 0]} />
                    <meshStandardMaterial color="#eef6fc" emissive="#7aa2c8" emissiveIntensity={0.25} flatShading />
                </mesh>
            ))}
        </group>
    );
}

/** Snø som faller, desember 1735. */
function Sno({ aktiv }: { aktiv: boolean }) {
    const ref = useRef<THREE.Points>(null);
    const geo = useMemo(() => {
        const n = 500;
        const pos = new Float32Array(n * 3);
        let s = 3;
        const r = () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
        for (let i = 0; i < n; i++) {
            pos[i * 3] = GODTHAB.x - 25 + r() * 60;
            pos[i * 3 + 1] = r() * 20;
            pos[i * 3 + 2] = GODTHAB.z - 15 + r() * 45;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return g;
    }, []);
    useEffect(() => () => geo.dispose(), [geo]);
    useFrame((_, delta) => {
        const p = ref.current;
        if (!p) return;
        p.visible = aktiv;
        if (!aktiv) return;
        const a = geo.getAttribute('position') as THREE.BufferAttribute;
        const dt = Math.min(delta, 0.05);
        for (let i = 0; i < a.count; i++) {
            let y = a.getY(i) - dt * 2.2;
            if (y < 0) y += 20;
            a.setY(i, y);
        }
        a.needsUpdate = true;
    });
    return (
        <points ref={ref} geometry={geo}>
            <pointsMaterial color="#ffffff" size={0.35} sizeAttenuation />
        </points>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const tid = useRef(0);
    const forrige = useRef(beat);
    const forste = useRef(true);
    const kamSe = useRef(new THREE.Vector3());

    useEffect(() => {
        forste.current = true;
    }, [modus]);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const mal = kameraFor(modus, beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
    });

    const kveld = modus === 'avreise';
    const himmel = kveld ? '#c9a7a0' : '#cfe4f2';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 70, 230]} />
            <ambientLight intensity={kveld ? 0.45 : 0.65} color={kveld ? '#e8c9c0' : '#ffffff'} />
            <directionalLight position={kveld ? [-40, 14, 30] : [30, 50, 25]} intensity={kveld ? 1.0 : 1.5} color={kveld ? '#ffb48a' : '#fff6e5'} />
            <hemisphereLight args={[kveld ? '#f1c4b0' : '#dbeafe', '#1e3a5f', 0.5]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[700, 700]} />
                <meshStandardMaterial color={kveld ? '#3b5c7a' : '#2f6f9f'} emissive={kveld ? '#1b2f45' : '#0b2a45'} emissiveIntensity={0.6} roughness={0.5} />
            </mesh>
            <Fjell />
            <Oya hus={modus !== 'ankomst' && !(modus === 'ruiner' && beat === 0)} />
            <Ruiner />
            <Godthab modus={modus} beat={beat} playing={playing} />
            <Isfjell pos={[-26, 0, 8]} s={2.2} />
            <Isfjell pos={[40, 0, 26]} s={1.4} />
            <Isfjell pos={[-60, 0, 40]} s={2.6} />
            <Isfjell pos={[96, 0, -6]} s={1.8} />
            {[0, 1, 2].map((i) => (
                <Skip key={i} indeks={i} modus={modus} beat={beat} playing={playing} />
            ))}
            <Sno aktiv={modus === 'avreise' && beat === 1} />
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    ankomst: ['Sommeren 1721', 'En prest og familien hans', 'Han leter etter nordboerne', 'Luthersk kristendom', 'Borte i nesten 300 år'],
    ruiner: ['Bergen, mai 1721: tre skip', 'Håbets Havn', 'Ruiner av gamle gårder', 'Ingen mennesker. Østkysten?'],
    godthab: ['1727: kompaniet går konkurs', '1728: Godthåb, dagens Nuuk', '1730: Christian 6. vil legge ned', 'Kolonien får bli'],
    avreise: ['Gertrud steller de syke', 'Desember 1735', 'Sommeren 1736: hjem for godt', 'Han kom aldri tilbake'],
};

export function EgedeFjord({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'ankomst';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const liste = MERKER[modus];
    const merke = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, near: 0.5, far: 600, position: [34, 9, 34] }} gl={{ antialias: true }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {modus === 'godthab' && (beat === 0 || beat === 2) && (
                    <motion.div
                        key={`stempel-${beat}`}
                        initial={{ opacity: 0, scale: 1.6, rotate: -14 }}
                        animate={{ opacity: 1, scale: 1, rotate: -10 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.9, type: 'spring', stiffness: 200, damping: 14 }}
                        className="absolute right-[8%] bottom-[16%] px-6 py-3 rounded-xl border-[6px] border-red-700 text-red-700 bg-white/80 font-black text-4xl md:text-6xl tracking-widest"
                    >
                        {beat === 0 ? 'KONKURS' : 'LEGGE NED?'}
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
                {merke && (
                    <motion.div
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute top-[7%] left-[4%] px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {merke}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
