import { useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Rikdommen i Indonesia som en øy i 3D: oljetårn, skog, et fjell med gull og kobber og en
 * kai. Utenfor ligger vestlige skip og venter.
 * «stengt»: Sukarno holder skipene ute bak en rad med bøyer.
 * «apent»: bøyene forsvinner, skipene legger til, og fjellet blir en gruve i trapper.
 */

type Modus = 'stengt' | 'apent';

const TEKST: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    stengt: [
        { tekst: 'Olje, gummi og skoger' },
        { tekst: 'Sukarno sier nei', rod: true },
        { tekst: 'Et problem for Vesten' },
    ],
    apent: [
        { tekst: '1967: Suharto har makten' },
        { tekst: 'Landet åpnes for selskapene', rod: true },
        { tekst: 'Freeport: gull og kobber' },
        { tekst: 'Dørene står åpne', rod: true },
    ],
};

const SKIP = [
    { ute: [-24, 0, 27], inne: [-6.5, 0, 9.5], farge: '#1e3a8a' },
    { ute: [-14, 0, 32], inne: [-2.5, 0, 10.5], farge: '#7f1d1d' },
    { ute: [4, 0, 33], inne: [1.5, 0, 9.6], farge: '#334155' },
    { ute: [20, 0, 30], inne: [5.5, 0, 10.6], farge: '#1e3a8a' },
];

function kamera(modus: Modus, beat: number, t: number) {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    if (modus === 'stengt') {
        if (beat === 0) return { pos: v(-26 + t * 0.4, 14, 26), se: v(0, 2, 0) };
        if (beat === 1) return { pos: v(-6, 20, 64), se: v(0, 0, 16) };
        return { pos: v(24 - t * 0.3, 24, 62), se: v(0, 0, 12) };
    }
    if (beat === 0) return { pos: v(-6, 20, 64), se: v(0, 0, 16) };
    if (beat === 1) return { pos: v(-20 + t * 0.3, 11, 30), se: v(0, 1, 8) };
    if (beat === 2) return { pos: v(13, 13, 15), se: v(6, 5, -5) };
    return { pos: v(-30 + t * 0.4, 22, 34), se: v(0, 2, 2) };
}

/** Dempet glidning mot et mål: tåler at eleven hopper rett til en beat. */
function gli(fra: number, mot: number, dt: number, fart = 1.4) {
    return THREE.MathUtils.lerp(fra, mot, 1 - Math.exp(-fart * dt));
}

function Skip({ i, inne, dt }: { i: number; inne: boolean; dt: RefObject<number> }) {
    const s = SKIP[i];
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame(({ clock }) => {
        const g = ref.current;
        if (!g) return;
        const mål = inne ? s.inne : s.ute;
        const d = forste.current ? 100 : (dt.current ?? 0);
        forste.current = false;
        g.position.x = gli(g.position.x, mål[0], d, 0.8);
        g.position.z = gli(g.position.z, mål[2], d, 0.8);
        g.position.y = Math.sin(clock.elapsedTime * 1.3 + i) * 0.08;
    });
    return (
        <group ref={ref} position={s.ute as [number, number, number]}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[2.4, 1, 6]} />
                <meshStandardMaterial color={s.farge} flatShading />
            </mesh>
            <mesh position={[0, 1.5, 1.6]}>
                <boxGeometry args={[1.8, 1.2, 1.6]} />
                <meshStandardMaterial color="#f1f5f9" flatShading />
            </mesh>
            <mesh position={[0, 2.6, 1.6]}>
                <cylinderGeometry args={[0.25, 0.3, 1.2, 8]} />
                <meshStandardMaterial color="#facc15" flatShading />
            </mesh>
            {/* Last på dekk */}
            {[-1.4, -0.2].map((z) => (
                <mesh key={z} position={[0, 1.35, z]}>
                    <boxGeometry args={[1.6, 0.7, 1]} />
                    <meshStandardMaterial color="#c2410c" flatShading />
                </mesh>
            ))}
        </group>
    );
}

function Boyer({ synlig, dt }: { synlig: boolean; dt: RefObject<number> }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame(() => {
        const g = ref.current;
        if (!g) return;
        const d = forste.current ? 100 : (dt.current ?? 0);
        forste.current = false;
        const s = gli(g.scale.x, synlig ? 1 : 0.001, d, 2);
        g.scale.set(s, s, s);
        g.visible = s > 0.01;
    });
    return (
        <group ref={ref}>
            {Array.from({ length: 13 }, (_, i) => {
                const x = -24 + i * 4;
                return (
                    <group key={i} position={[x, 0, 18]}>
                        <mesh position={[0, 0.6, 0]}>
                            <cylinderGeometry args={[0.45, 0.6, 1.2, 10]} />
                            <meshStandardMaterial
                                color="#dc2626"
                                emissive="#7f1d1d"
                                emissiveIntensity={0.4}
                                flatShading
                            />
                        </mesh>
                        {i < 12 && (
                            <mesh position={[2, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
                                <cylinderGeometry args={[0.06, 0.06, 3.2, 4]} />
                                <meshBasicMaterial color="#fef2f2" />
                            </mesh>
                        )}
                    </group>
                );
            })}
        </group>
    );
}

/** Fjellet: hel topp før gruva, trapper (dagbrudd) etter. */
function Fjell({ gruve, dt }: { gruve: boolean; dt: RefObject<number> }) {
    const topp = useRef<THREE.Mesh>(null);
    const trapper = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame(() => {
        const d = forste.current ? 100 : (dt.current ?? 0);
        forste.current = false;
        if (topp.current) {
            const s = gli(topp.current.scale.y, gruve ? 0.001 : 1, d, 1.6);
            topp.current.scale.y = s;
            topp.current.visible = s > 0.01;
        }
        if (trapper.current) {
            const s = gli(trapper.current.scale.y, gruve ? 1 : 0.001, d, 1.6);
            trapper.current.scale.y = s;
            trapper.current.visible = s > 0.01;
        }
    });
    return (
        <group position={[6, 0, -5]}>
            <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[5, 7, 5, 9]} />
                <meshStandardMaterial color="#3f6212" flatShading />
            </mesh>
            <mesh ref={topp} position={[0, 5, 0]}>
                <coneGeometry args={[5, 6, 9]} />
                <meshStandardMaterial color="#4d7c0f" flatShading />
            </mesh>
            <group ref={trapper} position={[0, 5, 0]}>
                {[4.8, 3.9, 3, 2.1, 1.2].map((r, i) => (
                    <mesh key={r} position={[0, i * 0.9 + 0.45, 0]}>
                        <cylinderGeometry args={[r, r + 0.3, 0.9, 9]} />
                        <meshStandardMaterial
                            color={i % 2 ? '#b45309' : '#92400e'}
                            emissive="#451a03"
                            emissiveIntensity={0.3}
                            flatShading
                        />
                    </mesh>
                ))}
                {/* Gull og kobber som glimter øverst */}
                <mesh position={[0, 4.9, 0]}>
                    <cylinderGeometry args={[0.9, 1.1, 0.4, 9]} />
                    <meshStandardMaterial
                        color="#fbbf24"
                        emissive="#d97706"
                        emissiveIntensity={0.7}
                    />
                </mesh>
            </group>
        </group>
    );
}

function Oljetarn({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 1, z]}>
            {[-1, 1].map((a) =>
                [-1, 1].map((b) => (
                    <mesh key={`${a}${b}`} position={[a * 0.6, 2.5, b * 0.6]} rotation={[b * 0.1, 0, -a * 0.1]}>
                        <boxGeometry args={[0.18, 5, 0.18]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                ))
            )}
            <mesh position={[0, 5.2, 0]}>
                <boxGeometry args={[0.9, 0.5, 0.9]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
        </group>
    );
}

/** Trærne på øya, med fast frø så skogen står likt hver gang. */
const TRÆR: [number, number, number][] = (() => {
    const ut: [number, number, number][] = [];
    let frø = 7;
    const tilfeldig = () => {
        frø = (frø * 9301 + 49297) % 233280;
        return frø / 233280;
    };
    for (let i = 0; i < 70; i++) {
        const v = tilfeldig() * Math.PI * 2;
        const r = 6 + tilfeldig() * 9;
        const x = Math.cos(v) * r - 2;
        const z = Math.sin(v) * r * 0.6 - 1;
        if (x > 0 && z < -1) continue;
        if (z > 5) continue;
        ut.push([x, 0.8 + tilfeldig() * 0.6, z]);
    }
    return ut;
})();

function Skog() {
    const ref = useRef<THREE.InstancedMesh>(null);
    const trær = TRÆR;
    useFrame(() => {
        const m = ref.current;
        if (!m || m.userData.ferdig) return;
        const o = new THREE.Object3D();
        trær.forEach((p, i) => {
            o.position.set(p[0], 1 + p[1], p[2]);
            o.scale.setScalar(p[1]);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
        m.userData.ferdig = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, trær.length]}>
            <coneGeometry args={[0.9, 2.4, 6]} />
            <meshStandardMaterial color="#166534" flatShading />
        </instancedMesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const dt = useRef(0);
    useFrame(({ camera }, rawDt) => {
        dt.current = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt.current;
        const m = kamera(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt.current);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    const inne = modus === 'apent' && beat >= 1;
    const gruve = modus === 'apent' && beat >= 2;
    return (
        <>
            <color attach="background" args={['#cfe3ee']} />
            <fog attach="fog" args={['#cfe3ee', 50, 120]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#ffffff', '#3b82f6', 0.5]} />
            <directionalLight position={[-10, 20, 14]} intensity={1.3} />
            {/* Havet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[240, 240]} />
                <meshStandardMaterial color="#2a7fb0" emissive="#0c4a6e" emissiveIntensity={0.45} />
            </mesh>
            {/* Øya */}
            <mesh position={[0, 0.5, -1]} scale={[1, 1, 0.65]}>
                <cylinderGeometry args={[16, 18, 1, 24]} />
                <meshStandardMaterial color="#e7d3a3" flatShading />
            </mesh>
            <mesh position={[0, 1.05, -1.5]} scale={[1, 1, 0.62]}>
                <cylinderGeometry args={[14.5, 15.5, 0.3, 24]} />
                <meshStandardMaterial color="#65a30d" flatShading />
            </mesh>
            {/* Kaia */}
            <mesh position={[0, 0.7, 7.8]}>
                <boxGeometry args={[16, 0.5, 2]} />
                <meshStandardMaterial color="#78716c" flatShading />
            </mesh>
            <Skog />
            <Oljetarn x={-9} z={1} />
            <Oljetarn x={-5} z={-4} />
            <Fjell gruve={gruve} dt={dt} />
            <Boyer synlig={!inne} dt={dt} />
            {SKIP.map((_, i) => (
                <Skip key={i} i={i} inne={inne} dt={dt} />
            ))}
        </>
    );
}

export function IndonesiaHavn({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'stengt';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = TEKST[modus];
    const t = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.2, far: 300, position: [-26, 14, 26] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-800 text-white' : 'bg-white/90 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
