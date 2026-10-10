import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Byen i 3D, i to modus:
 * - natt: en sovende by, bakken rister, husene raser, og så kommer et grått morgenlys.
 *   Ingen mennesker vises.
 * - geologi: samme by på et snitt av bakken. To jordlag glir mot hverandre, og etterpå
 *   reiser folk husene igjen.
 */

type Modus = 'natt' | 'geologi';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function tilfeldig(frø: number) {
    let s = frø;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}

interface Hus {
    x: number;
    z: number;
    b: number;
    d: number;
    h: number;
    farge: string;
    raser: boolean;
    retning: number;
}

const FARGER = ['#d6c3a5', '#c9b08b', '#e2d4bb', '#b8a184', '#d9b99b', '#c7bfae'];

function lagHus(): Hus[] {
    const r = tilfeldig(19);
    const ut: Hus[] = [];
    for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 1; j++) {
            if (r() < 0.12) continue;
            ut.push({
                x: i * 5.2 + (r() - 0.5) * 1.2,
                z: j * 5.2 + (r() - 0.5) * 1.2,
                b: 2.6 + r() * 1.4,
                d: 2.6 + r() * 1.2,
                h: 2.2 + r() * 3.2,
                farge: FARGER[Math.floor(r() * FARGER.length)],
                raser: r() < 0.72,
                retning: r() * Math.PI * 2,
            });
        }
    }
    return ut;
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'natt') {
        switch (beat) {
            case 0:
                return { pos: v(26 - t * 0.5, 13, 30), se: v(0, 1, 0) };
            case 1:
                return { pos: v(16, 8, 22), se: v(0, 2, 0) };
            case 2:
                return { pos: v(10, 9, 24), se: v(0, 1, 0) };
            default:
                return { pos: v(-14 + t * 0.4, 12, 26), se: v(0, 0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 9, 40), se: v(0, -2, 0) };
        case 1:
            return { pos: v(8, 7, 38), se: v(1, -2, 0) };
        case 2:
            return { pos: v(-12, 12, 28), se: v(0, 0, 0) };
        default:
            return { pos: v(14 - t * 0.3, 11, 28), se: v(0, 1, 0) };
    }
}

/** Ett hus. `fall` går fra 0 (står) til 1 (rast sammen). */
function EtHus({
    hus,
    fall,
    rist,
    glid,
}: {
    hus: Hus;
    fall: React.RefObject<number>;
    rist: React.RefObject<number>;
    glid?: React.RefObject<number>;
}) {
    const ref = useRef<THREE.Group>(null);
    const fase = useMemo(() => hus.x * 1.7 + hus.z, [hus]);
    useFrame(({ clock }) => {
        const g = ref.current;
        if (!g) return;
        const f = hus.raser ? (fall.current ?? 0) : (fall.current ?? 0) * 0.12;
        const r = rist.current ?? 0;
        const t = clock.elapsedTime;
        // Hus på høyre jordlag følger laget når det glir.
        const gl = glid && hus.x > 0 ? (glid.current ?? 0) : 0;
        g.position.set(
            hus.x + Math.sin(t * 37 + fase) * 0.18 * r,
            -f * hus.h * 0.45 - gl * 0.9,
            hus.z + Math.cos(t * 31 + fase) * 0.14 * r + gl * 1.2
        );
        g.rotation.set(
            Math.cos(hus.retning) * f * 0.55 + Math.sin(t * 29 + fase) * 0.04 * r,
            0,
            Math.sin(hus.retning) * f * 0.55
        );
        g.scale.set(1, 1 - f * 0.45, 1);
    });
    return (
        <group ref={ref} position={[hus.x, 0, hus.z]}>
            <mesh position={[0, hus.h / 2, 0]}>
                <boxGeometry args={[hus.b, hus.h, hus.d]} />
                <meshStandardMaterial color={hus.farge} flatShading />
            </mesh>
            <mesh position={[0, hus.h + 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[Math.max(hus.b, hus.d) * 0.78, 1.8, 4]} />
                <meshStandardMaterial color="#7f3b2a" flatShading />
            </mesh>
        </group>
    );
}

/** Små folk som kommer ut i gatene og bygger opp igjen (bare i geologi). */
function Folk({ vis }: { vis: React.RefObject<number> }) {
    const ref = useRef<THREE.Group>(null);
    const plasser = useMemo(() => {
        const r = tilfeldig(5);
        return Array.from({ length: 12 }, () => [(r() - 0.5) * 22, (r() - 0.5) * 16] as const);
    }, []);
    useFrame(() => {
        const g = ref.current;
        if (!g) return;
        const s = vis.current ?? 0;
        g.visible = s > 0.02;
        g.children.forEach((c) => c.scale.setScalar(Math.max(0.001, s)));
    });
    return (
        <group ref={ref}>
            {plasser.map(([x, z], i) => (
                <group key={i} position={[x + 2.6, 0, z + 2.6]}>
                    <mesh position={[0, 0.7, 0]}>
                        <capsuleGeometry args={[0.32, 0.7, 4, 8]} />
                        <meshStandardMaterial
                            color={['#2563eb', '#dc2626', '#f59e0b', '#0d9488'][i % 4]}
                        />
                    </mesh>
                    <mesh position={[0, 1.6, 0]}>
                        <sphereGeometry args={[0.28, 10, 8]} />
                        <meshStandardMaterial color="#e0b98a" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** En byggekran som reiser seg når byen bygges opp igjen. */
function Kran({ vis }: { vis: React.RefObject<number> }) {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        const g = ref.current;
        if (!g) return;
        const s = vis.current ?? 0;
        g.visible = s > 0.02;
        g.scale.set(1, Math.max(0.001, s), 1);
    });
    return (
        <group ref={ref} position={[10, 0.5, -9]}>
            <mesh position={[0, 6, 0]}>
                <boxGeometry args={[0.8, 12, 0.8]} />
                <meshStandardMaterial color="#facc15" flatShading />
            </mesh>
            <mesh position={[-3.5, 12, 0]}>
                <boxGeometry args={[10, 0.6, 0.6]} />
                <meshStandardMaterial color="#facc15" flatShading />
            </mesh>
            <mesh position={[-7.5, 9.5, 0]}>
                <boxGeometry args={[0.15, 5, 0.15]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[-7.5, 6.6, 0]}>
                <boxGeometry args={[1.6, 1, 1.6]} />
                <meshStandardMaterial color="#d6c3a5" flatShading />
            </mesh>
        </group>
    );
}

/** Jordlagene under byen. Høyre del glir når skjelvet kommer. */
function Snitt({ glid }: { glid: React.RefObject<number> }) {
    const hoyre = useRef<THREE.Group>(null);
    const lag = ['#7c5c3b', '#a47148', '#8b6b4a', '#6b4f36', '#4b3a2a'];
    useFrame(() => {
        const g = hoyre.current;
        if (g) g.position.set(0, -(glid.current ?? 0) * 0.9, (glid.current ?? 0) * 1.2);
    });
    const blokk = (x: number, b: number) => (
        <>
            <mesh position={[x, 0.55, 0]}>
                <boxGeometry args={[b, 0.1, 24]} />
                <meshStandardMaterial color="#6b8f5a" />
            </mesh>
            {lag.map((f, i) => (
                <mesh key={i} position={[x, -0.6 - i * 2.2, 0]}>
                    <boxGeometry args={[b, 2.2, 24]} />
                    <meshStandardMaterial color={f} flatShading />
                </mesh>
            ))}
        </>
    );
    return (
        <>
            <group>{blokk(-8, 16)}</group>
            <group ref={hoyre}>{blokk(8, 16)}</group>
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const fall = useRef(0);
    const rist = useRef(0);
    const glid = useRef(0);
    const folk = useRef(0);
    const kran = useRef(0);
    const lys = useRef<THREE.DirectionalLight>(null);
    const himmel = useRef<THREE.Color>(null);
    const tåke = useRef<THREE.Fog>(null);
    const hus = useMemo(() => lagHus(), []);
    const skjelv = useMemo(() => new THREE.Vector3(), []);
    const natt = useMemo(() => new THREE.Color('#1b2a4a'), []);
    const morgen = useMemo(() => new THREE.Color('#9aa3ad'), []);
    const dag = useMemo(() => new THREE.Color('#bfdbfe'), []);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        if (modus === 'natt') {
            const ristMål = beat === 1 ? 1 : beat === 2 && t < 3 ? 1 : 0;
            rist.current = damp(rist.current, ristMål, 4, dt);
            fall.current = damp(fall.current, beat >= 2 ? 1 : 0, beat >= 2 ? 1.6 : 6, dt);
        } else {
            const ristMål = beat === 1 && t < 4 ? 1 : 0;
            rist.current = damp(rist.current, ristMål, 4, dt);
            glid.current = damp(glid.current, beat >= 1 ? 1 : 0, 1.4, dt);
            // Husene står skjevt etter skjelvet og rettes opp når folk bygger igjen.
            fall.current = damp(fall.current, beat === 1 || beat === 2 ? 0.35 : 0, 1.2, dt);
            folk.current = damp(folk.current, beat >= 2 ? 1 : 0, 2, dt);
            kran.current = damp(kran.current, beat >= 3 ? 1 : 0, 1.5, dt);
        }

        if (himmel.current && tåke.current) {
            const mål = modus === 'geologi' ? dag : beat >= 3 ? morgen : natt;
            const k = forste.current ? 1 : 1 - Math.exp(-0.9 * dt);
            himmel.current.lerp(mål, k);
            tåke.current.color.lerp(mål, k);
        }
        if (lys.current) {
            const mål = modus === 'geologi' ? 2.2 : beat >= 3 ? 1.4 : 0.7;
            lys.current.intensity = damp(lys.current.intensity, mål, 1, dt || 0.016);
        }

        const mål = kameraFor(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        const r = rist.current;
        if (r > 0.01) {
            camera.position.add(
                skjelv.set(Math.sin(t * 43) * 0.12 * r, Math.cos(t * 39) * 0.1 * r, 0)
            );
        }
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
    });

    const start = modus === 'geologi' ? '#bfdbfe' : '#1b2a4a';
    return (
        <>
            <color ref={himmel} attach="background" args={[start]} />
            <fog ref={tåke} attach="fog" args={[start, 40, 120]} />
            <ambientLight intensity={modus === 'geologi' ? 0.8 : 0.55} color="#c7d2fe" />
            <hemisphereLight args={['#93a5cf', '#3b3a2e', 0.6]} />
            <directionalLight ref={lys} position={[12, 20, 10]} intensity={0.7} color="#fff1d6" />

            {modus === 'natt' && (
                <>
                    <mesh position={[-30, 26, -50]}>
                        <sphereGeometry args={[3, 24, 16]} />
                        <meshBasicMaterial color="#fef9c3" fog={false} toneMapped={false} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[200, 200]} />
                        <meshStandardMaterial color="#4b5a46" emissive="#1c2a22" />
                    </mesh>
                    {/* Gatene */}
                    {[-2.6, 2.6].map((z) => (
                        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, z]}>
                            <planeGeometry args={[30, 1.6]} />
                            <meshStandardMaterial color="#6b6b6b" emissive="#222222" />
                        </mesh>
                    ))}
                </>
            )}
            {modus === 'geologi' && (
                <>
                    <Snitt glid={glid} />
                    <Folk vis={folk} />
                    <Kran vis={kran} />
                </>
            )}
            <group position={[0, modus === 'geologi' ? 0.5 : 0, 0]}>
                {hus.map((h, i) => (
                    <EtHus
                        key={i}
                        hus={h}
                        fall={fall}
                        rist={rist}
                        glid={modus === 'geologi' ? glid : undefined}
                    />
                ))}
            </group>
        </>
    );
}

const TEKSTER: Record<Modus, (string | null)[]> = {
    natt: [null, 'Jordskjelv', 'Tolv sekunder', 'Ingen har gjort noe galt'],
    geologi: [
        'Livssynshumanisme: ingen gud å forsvare',
        'Geologi, ikke en beskjed',
        'Fri · ansvar · mening',
        'Lidelsen skal bekjempes',
    ],
};

export function LidelseByen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'natt';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = TEKSTER[modus][Math.min(beat, TEKSTER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas dpr={dpr} camera={{ fov: 42, near: 0.3, far: 400, position: [26, 13, 30] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
