import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, useKamera, v } from './felles3d';

/**
 * Kreml en vinterkveld, bygd av enkle former: den røde muren, et tårn med stjerne, og den
 * grønne kuppelen med flaggstanga. Beat 0: oversikt. Beat 1: nært på det røde flagget.
 * Beat 2: flagget firer ned langs stanga. Beat 3: stanga er tom, og femten lykter tennes
 * langs muren, én for hver sovjetrepublikk som blir et eget land.
 */

const STANG = { x: -3, z: -12, bunn: 6.4, topp: 10.4 };
const FLAGG_TOPP = 9.7;
const FLAGG_BUNN = 6.9;
const LYKTER = Array.from({ length: 15 }, (_, i) => -17 + (i / 14) * 34);
const MURTINDER = Array.from({ length: 40 }, (_, i) => -19.5 + i);

/** Hvor høyt flagget henger, gitt beat og tid i beaten. Tåler hopp rett til beat 2. */
function flaggHoyde(beat: number, t: number) {
    if (beat < 2) return FLAGG_TOPP;
    if (beat === 2) return FLAGG_TOPP - (FLAGG_TOPP - FLAGG_BUNN) * Math.min(1, t / 5);
    return FLAGG_BUNN;
}

function kamera(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(7 - t * 0.25, 4.5, 24), se: v(-1, 5, -8) };
        case 1:
            return { pos: v(1.5, 9.2, 1), se: v(-2.2, 9.4, -12) };
        case 2: {
            const y = flaggHoyde(2, t);
            return { pos: v(2.5, y + 0.3, 1.5), se: v(-2.2, y, -12) };
        }
        default:
            return { pos: v(0, 7, 30 - t * 0.3), se: v(0, 4, -7) };
    }
}

/** Det sovjetiske flagget som tekstur: rødt med gul stjerne, hammer og sigd. */
function lagFlaggtekstur() {
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 200;
    const g = c.getContext('2d')!;
    g.fillStyle = '#d10f0f';
    g.fillRect(0, 0, 300, 200);
    g.strokeStyle = '#facc15';
    g.fillStyle = '#facc15';
    // Stjerne (omriss).
    g.lineWidth = 3;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 16 : 7;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        g.lineTo(60 + Math.cos(a) * r, 30 + Math.sin(a) * r);
    }
    g.closePath();
    g.stroke();
    // Sigd.
    g.lineWidth = 9;
    g.beginPath();
    g.arc(60, 82, 24, Math.PI * 0.9, Math.PI * 2.3);
    g.stroke();
    // Hammer.
    g.save();
    g.translate(60, 84);
    g.rotate(-Math.PI / 4);
    g.fillRect(-4, -26, 8, 50);
    g.fillRect(-14, -30, 28, 11);
    g.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function Flagg({ beat, playing }: { beat: number; playing: boolean }) {
    const gruppe = useRef<THREE.Group>(null);
    const duk = useRef<THREE.Mesh>(null);
    const basis = useRef<Float32Array | null>(null);
    const tekstur = useMemo(() => lagFlaggtekstur(), []);
    useEffect(() => () => tekstur.dispose(), [tekstur]);
    const tid = useRef(0);
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        tid.current += dt;
        beatTid.current += dt;
        const m = duk.current;
        if (!m) return;
        const pos = m.geometry.attributes.position as THREE.BufferAttribute;
        if (!basis.current) basis.current = Float32Array.from(pos.array as Float32Array);
        for (let i = 0; i < pos.count; i++) {
            const x = basis.current[i * 3];
            const fra = (x + 1.3) / 2.6;
            pos.setZ(i, Math.sin(x * 2.4 - tid.current * 4.2) * 0.22 * fra);
        }
        pos.needsUpdate = true;
        const g = gruppe.current;
        if (!g) return;
        const mål = flaggHoyde(beat, beatTid.current);
        g.position.y = forste.current ? mål : damp(g.position.y, mål, 6, dt || 0.016);
        forste.current = false;
        // På beat 3 er flagget tatt av stanga.
        const s = damp(g.scale.y, beat >= 3 ? 0.001 : 1, 3, dt || 0.016);
        g.scale.set(s, s, s);
        g.visible = s > 0.02;
    });
    return (
        <group ref={gruppe} position={[STANG.x + 1.35, FLAGG_TOPP, STANG.z]}>
            <mesh ref={duk}>
                <planeGeometry args={[2.6, 1.7, 18, 8]} />
                <meshStandardMaterial
                    map={tekstur}
                    emissive="#7f1d1d"
                    emissiveIntensity={0.35}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

function Lykter({ beat, playing }: { beat: number; playing: boolean }) {
    const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        mats.current.forEach((m, i) => {
            if (!m) return;
            const på = beat >= 3 && tid.current * 4 > i + 1;
            m.emissiveIntensity = damp(m.emissiveIntensity, på ? 2.2 : 0.05, 4, dt || 0.016);
        });
    });
    return (
        <>
            {LYKTER.map((x, i) => (
                <group key={i} position={[x, 3.5, -5.6]}>
                    <mesh position={[0, -0.35, 0]}>
                        <cylinderGeometry args={[0.06, 0.06, 0.7, 6]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                    <mesh>
                        <sphereGeometry args={[0.32, 12, 10]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                mats.current[i] = m;
                            }}
                            color="#fde68a"
                            emissive="#fbbf24"
                            emissiveIntensity={0.05}
                            toneMapped={false}
                        />
                    </mesh>
                </group>
            ))}
        </>
    );
}

function Kreml() {
    const murfarge = '#9b2c2c';
    return (
        <>
            {/* Plassen foran */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]}>
                <planeGeometry args={[80, 50]} />
                <meshStandardMaterial color="#5b6478" roughness={1} />
            </mesh>
            {/* Muren med tinder */}
            <mesh position={[0, 1.5, -6]}>
                <boxGeometry args={[40, 3, 1]} />
                <meshStandardMaterial color={murfarge} flatShading />
            </mesh>
            {MURTINDER.map((x) => (
                <mesh key={x} position={[x, 3.3, -6]}>
                    <boxGeometry args={[0.55, 0.6, 1]} />
                    <meshStandardMaterial color={murfarge} flatShading />
                </mesh>
            ))}
            {/* Tårnet med stjerna */}
            <group position={[9, 0, -6]}>
                <mesh position={[0, 4, 0]}>
                    <boxGeometry args={[3, 8, 3]} />
                    <meshStandardMaterial color={murfarge} flatShading />
                </mesh>
                <mesh position={[0, 6, 1.55]}>
                    <circleGeometry args={[0.9, 24]} />
                    <meshStandardMaterial color="#f8fafc" emissive="#fef3c7" emissiveIntensity={0.6} />
                </mesh>
                <mesh position={[0, 9, 0]}>
                    <boxGeometry args={[2.2, 2, 2.2]} />
                    <meshStandardMaterial color="#b83232" flatShading />
                </mesh>
                <mesh position={[0, 12, 0]}>
                    <coneGeometry args={[1.4, 4, 4]} />
                    <meshStandardMaterial color="#2f6b4f" flatShading />
                </mesh>
                <mesh position={[0, 14.4, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <octahedronGeometry args={[0.55]} />
                    <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.4} toneMapped={false} />
                </mesh>
            </group>
            {/* Senatbygningen med kuppel og flaggstang */}
            <group position={[STANG.x, 0, STANG.z]}>
                <mesh position={[0, 2.2, 0]}>
                    <boxGeometry args={[14, 4.4, 6]} />
                    <meshStandardMaterial color="#e9d9a6" emissive="#6b5b2e" emissiveIntensity={0.25} flatShading />
                </mesh>
                <mesh position={[0, 4.6, 0]}>
                    <cylinderGeometry args={[2.3, 2.3, 0.6, 24]} />
                    <meshStandardMaterial color="#e9d9a6" emissive="#6b5b2e" emissiveIntensity={0.25} />
                </mesh>
                <mesh position={[0, 4.9, 0]}>
                    <sphereGeometry args={[2.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#3f7d63" emissive="#173a2c" emissiveIntensity={0.4} flatShading />
                </mesh>
                <mesh position={[0, (STANG.bunn + STANG.topp) / 2, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, STANG.topp - STANG.bunn, 8]} />
                    <meshStandardMaterial color="#d1d5db" emissive="#6b7280" emissiveIntensity={0.4} />
                </mesh>
                {Array.from({ length: 5 }, (_, i) => (
                    <mesh key={i} position={[-5.4 + i * 2.7, 2.6, 3.02]}>
                        <planeGeometry args={[1, 1.6]} />
                        <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.7} />
                    </mesh>
                ))}
            </group>
        </>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    useKamera(kamera, beat, playing);
    return (
        <>
            <color attach="background" args={['#22305a']} />
            <fog attach="fog" args={['#22305a', 30, 80]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#c7d2fe', '#334155', 0.7]} />
            <directionalLight position={[-10, 18, 16]} intensity={0.9} color="#dbeafe" />
            <pointLight position={[0, 6, 4]} intensity={60} distance={40} color="#fde68a" />
            <Kreml />
            <Flagg beat={beat} playing={playing} />
            <Lykter beat={beat} playing={playing} />
        </>
    );
}

export function UnipolarKreml({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [7, 4.5, 24] }}
            >
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {beat === 0 && <Merkelapp key="k0" tekst="Moskva, 25. desember 1991" />}
                {beat === 1 && <Merkelapp key="k1" tekst="Sovjetunionens flagg" farge="rod" />}
                {beat === 2 && <Merkelapp key="k2" tekst="For siste gang" farge="rod" />}
                {beat === 3 && <Merkelapp key="k3" tekst="Femten nye land" forsinkelse={0.6} />}
            </AnimatePresence>
        </div>
    );
}

function Merkelapp({
    tekst,
    farge,
    forsinkelse = 0.3,
}: {
    tekst: string;
    farge?: 'rod';
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: forsinkelse }}
            className={`absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                farge === 'rod' ? 'bg-red-700 text-white' : 'bg-white/90 text-slate-900'
            }`}
        >
            {tekst}
        </motion.div>
    );
}
