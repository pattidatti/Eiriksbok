import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * 3D for rettsstat-filmen.
 * «dora»: et hus en tidlig morgen, en politibil kommer og kjører igjen, familien i døra.
 * «celle»: en tom celle med lys fra et lite vindu, streker på veggen som blir flere.
 * «soyler»: fem søyler som reiser seg én etter én under taket «Rettsstaten».
 * «vern»: det samme huset om dagen, med en kuppel av lov rundt. Politibilen blir stående ute.
 */

type Modus = 'dora' | 'celle' | 'soyler' | 'vern';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

const SOYLE_X = [-4, -2, 0, 2, 4];
const SOYLE_FARGER = ['#0d9488', '#2563eb', '#b45309', '#7c3aed', '#be123c'];
const REGLER = [
    'Like for loven',
    'Ingen straff uten lov',
    'Uskyldig til bevist',
    'Uavhengige domstoler',
    'Staten følger loven',
];

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'dora') {
        if (beat === 0) return { pos: v(16 - t * 0.3, 5.5, 22), se: v(0, 1.8, 3) };
        if (beat === 1) return { pos: v(7, 3.2, 15), se: v(-0.5, 1.6, 4) };
        return { pos: v(3.6, 2.6, 8.3), se: v(-0.2, 1.4, 2.5) };
    }
    if (modus === 'celle') {
        if (beat === 0) return { pos: v(0, 3.4, 8.5), se: v(0, 1.6, -1) };
        if (beat === 1) return { pos: v(-1.2, 2.6, 4.2), se: v(2.9, 2.2, -0.6) };
        return { pos: v(0, 4 + t * 0.05, 9 + t * 0.12), se: v(0, 1.4, -1) };
    }
    if (modus === 'soyler') {
        if (beat === 0 || beat >= 5) return { pos: v(0, 4.2, 17.5), se: v(0, 3.2, 0) };
        const x = SOYLE_X[beat - 1];
        return { pos: v(x * 0.45, 3.6, 16), se: v(x * 0.3, 3.1, 0) };
    }
    if (beat === 2) return { pos: v(2.5, 3, 12.5), se: v(2.2, 1.6, 2.5) };
    return { pos: v(-7, 7, 25), se: v(4.5, 2.4, 2) };
}

function Kamerastyring({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forsteBilde = useRef(true);
    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        const se = (camera.userData.se as THREE.Vector3 | undefined) ?? m.se.clone();
        if (forsteBilde.current) {
            camera.position.copy(m.pos);
            se.copy(m.se);
            forsteBilde.current = false;
        } else {
            const k = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(m.pos, k);
            se.lerp(m.se, k);
        }
        camera.userData.se = se;
        camera.lookAt(se);
    });
    return null;
}

/** Huset: vegger, saltak, dør som kan åpnes, vinduer med lys. */
function Hus({ dorApen, lysInne }: { dorApen: boolean; lysInne: boolean }) {
    const dor = useRef<THREE.Group>(null);
    const tak = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-3.5, 0);
        s.lineTo(3.5, 0);
        s.lineTo(0, 2.2);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, { depth: 5.6, bevelEnabled: false });
        g.translate(0, 0, -2.8);
        return g;
    }, []);
    useEffect(() => () => tak.dispose(), [tak]);
    useFrame((_, raw) => {
        const d = dor.current;
        if (!d) return;
        d.rotation.y = damp(d.rotation.y, dorApen ? -1.4 : 0, 3, Math.min(raw, 0.05));
    });
    return (
        <group>
            <mesh position={[0, 2, 0]}>
                <boxGeometry args={[6, 4, 5]} />
                <meshStandardMaterial color="#e3d3b4" flatShading />
            </mesh>
            <mesh geometry={tak} position={[0, 4, 0]}>
                <meshStandardMaterial color="#8a3b2b" flatShading />
            </mesh>
            {/* Døråpningen bak døra */}
            <mesh position={[0, 1.1, 2.51]}>
                <planeGeometry args={[1.2, 2.2]} />
                <meshBasicMaterial color={lysInne ? '#f6d48a' : '#3a2a20'} />
            </mesh>
            <group ref={dor} position={[-0.6, 1.1, 2.56]}>
                <mesh position={[0.6, 0, 0]}>
                    <boxGeometry args={[1.2, 2.2, 0.1]} />
                    <meshStandardMaterial color="#2f4a3a" />
                </mesh>
            </group>
            {[-1.9, 1.9].map((x) => (
                <mesh key={x} position={[x, 2.5, 2.52]}>
                    <planeGeometry args={[1.1, 0.9]} />
                    <meshStandardMaterial
                        color={lysInne ? '#ffe2a0' : '#9fb7cf'}
                        emissive={lysInne ? '#ffb84d' : '#000000'}
                        emissiveIntensity={lysInne ? 0.9 : 0}
                    />
                </mesh>
            ))}
            {/* Pipe */}
            <mesh position={[1.8, 5.4, -0.8]}>
                <boxGeometry args={[0.6, 1.4, 0.6]} />
                <meshStandardMaterial color="#6b4a3a" />
            </mesh>
        </group>
    );
}

function Menneske({ farge, skala = 1, ...rest }: { farge: string; skala?: number; position: [number, number, number] }) {
    return (
        <group {...rest} scale={skala}>
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.24, 0.3, 1.1, 10]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 1.35, 0]}>
                <sphereGeometry args={[0.24, 12, 10]} />
                <meshStandardMaterial color="#e8c4a0" />
            </mesh>
        </group>
    );
}

/** Politibil som kjører mot et mål på x-aksen. */
function Politibil({ malX, startX, z, playing }: { malX: number; startX: number; z: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const blink = useRef<THREE.MeshStandardMaterial>(null);
    const tid = useRef(0);
    // Startplassen settes én gang. Som prop ville R3F flyttet bilen tilbake ved hver render.
    const [start] = useState(startX);
    useFrame((_, raw) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        tid.current += dt;
        g.position.x = damp(g.position.x, malX, malX > 20 ? 0.6 : 1.1, dt);
        if (blink.current) blink.current.emissiveIntensity = Math.sin(tid.current * 9) > 0 ? 2.2 : 0.5;
    });
    return (
        <group ref={ref} position={[start, 0, z]}>
            <mesh position={[0, 0.75, 0]}>
                <boxGeometry args={[3.8, 0.9, 1.7]} />
                <meshStandardMaterial color="#f8fafc" flatShading />
            </mesh>
            <mesh position={[0, 0.78, 0]}>
                <boxGeometry args={[3.82, 0.28, 1.72]} />
                <meshStandardMaterial color="#1d4ed8" />
            </mesh>
            <mesh position={[-0.2, 1.5, 0]}>
                <boxGeometry args={[2.1, 0.65, 1.55]} />
                <meshStandardMaterial color="#cbd5e1" flatShading />
            </mesh>
            <mesh position={[-0.2, 1.92, 0]}>
                <boxGeometry args={[0.7, 0.2, 0.9]} />
                <meshStandardMaterial ref={blink} color="#60a5fa" emissive="#2563eb" emissiveIntensity={1.5} />
            </mesh>
            {[
                [-1.2, 0.8],
                [1.2, 0.8],
                [-1.2, -0.8],
                [1.2, -0.8],
            ].map(([x, zz]) => (
                <mesh key={`${x}${zz}`} position={[x, 0.35, zz]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.36, 0.36, 0.3, 14]} />
                    <meshStandardMaterial color="#1f2937" />
                </mesh>
            ))}
        </group>
    );
}

function Traer() {
    const plass: [number, number, number][] = [
        [-9, 0, -4],
        [-11, 0, 1],
        [8.5, 0, -3],
        [11, 0, 2],
        [-6, 0, -7],
        [5, 0, -8],
    ];
    return (
        <>
            {plass.map((p, i) => (
                <group key={i} position={p}>
                    <mesh position={[0, 0.6, 0]}>
                        <cylinderGeometry args={[0.18, 0.22, 1.2, 8]} />
                        <meshStandardMaterial color="#5b3f2c" />
                    </mesh>
                    <mesh position={[0, 2.4, 0]}>
                        <coneGeometry args={[1.3, 3.2, 8]} />
                        <meshStandardMaterial color="#2f6b45" flatShading />
                    </mesh>
                </group>
            ))}
        </>
    );
}

const VEI_Z = 9;

function Gate({ modus, beat, playing }: { modus: 'dora' | 'vern'; beat: number; playing: boolean }) {
    const dag = modus === 'vern';
    const kuppel = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, raw) => {
        if (kuppel.current) kuppel.current.opacity = damp(kuppel.current.opacity, 0.2, 2, Math.min(raw, 0.05));
    });
    const malX = modus === 'dora' ? (beat >= 2 ? 48 : -1) : -6;
    const startX = modus === 'dora' && beat >= 2 ? -1 : beat === 0 ? -34 : -6;
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[140, 140]} />
                <meshStandardMaterial color={dag ? '#7fa36a' : '#56704f'} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, VEI_Z]}>
                <planeGeometry args={[140, 3.4]} />
                <meshStandardMaterial color={dag ? '#8a8f96' : '#5d6168'} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 5.2]}>
                <planeGeometry args={[1.6, 5.4]} />
                <meshStandardMaterial color={dag ? '#b8ab92' : '#7d7464'} />
            </mesh>
            <Hus dorApen={modus === 'dora' ? beat >= 1 : beat >= 2} lysInne={!dag} />
            <Traer />
            <Politibil key={`${modus}-${beat >= 2 ? 'b' : 'a'}`} malX={malX} startX={startX} z={VEI_Z} playing={playing} />
            {modus === 'dora' && beat === 1 && <Menneske farge="#7c2d12" position={[-0.6, 0, 6.6]} />}
            {((modus === 'dora' && beat >= 2) || (modus === 'vern' && beat >= 2)) && (
                <>
                    <Menneske farge={modus === 'vern' ? '#475569' : '#9d174d'} position={[0.1, 0, 2.9]} />
                    <Menneske farge="#0e7490" skala={0.68} position={[0.75, 0, 3.1]} />
                    {modus === 'vern' && <Menneske farge="#9d174d" skala={0.95} position={[1.35, 0, 3.0]} />}
                </>
            )}
            {dag && (
                <>
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[6.6, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial
                            ref={kuppel}
                            color="#60a5fa"
                            emissive="#2563eb"
                            emissiveIntensity={0.35}
                            transparent
                            opacity={0}
                            depthWrite={false}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
                        <ringGeometry args={[6.45, 6.75, 64]} />
                        <meshBasicMaterial color="#1d4ed8" />
                    </mesh>
                </>
            )}
            <hemisphereLight args={[dag ? '#e0f0ff' : '#9fb4e0', dag ? '#6b7f5a' : '#3d4a3a', dag ? 1.1 : 0.85]} />
            <directionalLight position={[12, 10, 8]} intensity={dag ? 1.3 : 0.7} color={dag ? '#fff8e8' : '#ffd2a1'} />
            <color attach="background" args={[dag ? '#bcd6ee' : '#62749a']} />
            <fog attach="fog" args={[dag ? '#bcd6ee' : '#62749a', 35, 95]} />
        </>
    );
}

/** Strekene på celleveggen: grupper på fire loddrette og én på skrå. */
function Streker({ grupper }: { grupper: number }) {
    const merker = useMemo(() => {
        const ut: { p: [number, number, number]; r: number }[] = [];
        for (let g = 0; g < 12; g++) {
            const z0 = -2.3 + (g % 4) * 1.05;
            const y0 = 3.0 - Math.floor(g / 4) * 0.75;
            for (let i = 0; i < 4; i++) ut.push({ p: [2.94, y0, z0 + i * 0.16], r: 0 });
            ut.push({ p: [2.94, y0, z0 + 0.24], r: 0.9 });
        }
        return ut;
    }, []);
    return (
        <>
            {merker.slice(0, grupper * 5).map((m, i) => (
                <mesh key={i} position={m.p} rotation={[m.r, 0, 0]}>
                    <boxGeometry args={[0.03, 0.46, 0.045]} />
                    <meshBasicMaterial color="#1f2937" />
                </mesh>
            ))}
        </>
    );
}

function Celle({ beat }: { beat: number }) {
    const grupper = beat === 0 ? 3 : beat === 1 ? 8 : 12;
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[6, 6]} />
                <meshStandardMaterial color="#77736d" />
            </mesh>
            <mesh position={[0, 2.2, -3]}>
                <boxGeometry args={[6, 4.4, 0.1]} />
                <meshStandardMaterial color="#a19d94" />
            </mesh>
            <mesh position={[-3, 2.2, 0]}>
                <boxGeometry args={[0.1, 4.4, 6]} />
                <meshStandardMaterial color="#8f8b83" />
            </mesh>
            <mesh position={[3, 2.2, 0]}>
                <boxGeometry args={[0.1, 4.4, 6]} />
                <meshStandardMaterial color="#b3aea4" />
            </mesh>
            {/* Vinduet med sprinkler */}
            <mesh position={[-0.6, 3.4, -2.94]}>
                <planeGeometry args={[1, 0.75]} />
                <meshBasicMaterial color="#fff6d5" />
            </mesh>
            {[-0.9, -0.6, -0.3].map((x) => (
                <mesh key={x} position={[x, 3.4, -2.9]}>
                    <boxGeometry args={[0.06, 0.78, 0.06]} />
                    <meshStandardMaterial color="#334155" />
                </mesh>
            ))}
            {/* Lysstrålen og flekken på gulvet */}
            <mesh position={[-0.2, 1.75, -1.4]} rotation={[0.62, 0, 0]}>
                <boxGeometry args={[0.95, 3.9, 0.7]} />
                <meshBasicMaterial color="#fff3c4" transparent opacity={0.13} depthWrite={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.1, 0.02, 0.4]}>
                <planeGeometry args={[1.1, 1.2]} />
                <meshBasicMaterial color="#e9dfb8" />
            </mesh>
            {/* Brisken */}
            <mesh position={[-2.45, 0.35, -0.6]}>
                <boxGeometry args={[1, 0.7, 2.8]} />
                <meshStandardMaterial color="#4b5563" />
            </mesh>
            <mesh position={[-2.45, 0.74, -0.6]}>
                <boxGeometry args={[0.9, 0.1, 2.6]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>
            <Streker grupper={grupper} />
            <ambientLight intensity={0.55} />
            <directionalLight position={[-1, 6, -6]} intensity={0.9} color="#fff1cf" />
            <directionalLight position={[4, 5, 8]} intensity={0.45} color="#c7d2fe" />
            <color attach="background" args={['#2b303b']} />
        </>
    );
}

function Soyle({ x, farge, synlig }: { x: number; farge: string; synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, raw) => {
        const g = ref.current;
        if (!g) return;
        const mal = synlig ? 1 : 0.001;
        const s = forste.current ? mal : damp(g.scale.y, mal, 3.5, Math.min(raw, 0.05));
        forste.current = false;
        g.scale.set(1, s, 1);
        g.visible = s > 0.01;
    });
    return (
        <group ref={ref} position={[x, 1, 0]}>
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[1.2, 0.3, 1.2]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.42, 0.48, 3.5, 18]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 3.85, 0]}>
                <boxGeometry args={[1.2, 0.3, 1.2]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
        </group>
    );
}

function Tempel({ beat, playing }: { beat: number; playing: boolean }) {
    const tak = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const gavl = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-5.8, 0);
        s.lineTo(5.8, 0);
        s.lineTo(0, 1.5);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, { depth: 4, bevelEnabled: false });
        g.translate(0, 0, -2);
        return g;
    }, []);
    useEffect(() => () => gavl.dispose(), [gavl]);
    const antall = Math.min(beat, 5);
    useFrame((_, raw) => {
        const g = tak.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        tid.current += dt;
        // Taket vakler mindre for hver søyle som kommer på plass.
        const utslag = (5 - antall) * 0.012;
        g.rotation.z = Math.sin(tid.current * 1.6) * utslag;
        g.position.y = damp(g.position.y, antall === 5 ? 5.15 : 5.45, 3, Math.min(raw, 0.05));
    });
    return (
        <>
            <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[12.5, 0.5, 5]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
            <mesh position={[0, 0.75, 0]}>
                <boxGeometry args={[11.5, 0.5, 4.2]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            {SOYLE_X.map((x, i) => (
                <Soyle key={x} x={x} farge={SOYLE_FARGER[i]} synlig={beat >= i + 1} />
            ))}
            <group ref={tak} position={[0, 5.45, 0]}>
                <mesh>
                    <boxGeometry args={[11.8, 0.6, 4.4]} />
                    <meshStandardMaterial color={antall === 5 ? '#f5e6b8' : '#e7e5e4'} />
                </mesh>
                <mesh geometry={gavl} position={[0, 0.3, 0]}>
                    <meshStandardMaterial color={antall === 5 ? '#ecd9a0' : '#d6d3d1'} flatShading />
                </mesh>
                <Html position={[0, 0, 2.25]} center zIndexRange={[10, 0]}>
                    <div className="font-display font-black text-2xl tracking-widest text-slate-800 whitespace-nowrap select-none">
                        RETTSSTATEN
                    </div>
                </Html>
            </group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial color="#cdd5c4" />
            </mesh>
            <hemisphereLight args={['#f1f5f9', '#a8b29a', 1.1]} />
            <directionalLight position={[6, 12, 10]} intensity={1.1} />
            <color attach="background" args={['#d7e6f2']} />
            <fog attach="fog" args={['#d7e6f2', 30, 80]} />
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <Kamerastyring modus={modus} beat={beat} playing={playing} />
            {modus === 'celle' && <Celle beat={beat} />}
            {modus === 'soyler' && <Tempel beat={beat} playing={playing} />}
            {(modus === 'dora' || modus === 'vern') && <Gate modus={modus} beat={beat} playing={playing} />}
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    dora: ['En tidlig morgen', 'Ingen forklaring, ingen advokat', 'Hva er han anklaget for?'],
    celle: ['Uker blir til måneder', 'Hva har han gjort?', 'Historien er tenkt'],
    soyler: [],
    vern: [],
};

const VERN = [
    { p: '§ 113', t: 'Staten må ha en lov for å gripe inn i livet ditt', fraBeat: 0 },
    { p: '§ 94', t: 'Ingen i fengsel uten slik loven bestemmer', fraBeat: 1 },
];

export function RettsstatHuset({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'dora';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer.length ? linjer[Math.min(beat, linjer.length - 1)] : null;
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [16, 6, 22] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[5%] inset-x-0 flex justify-center pointer-events-none"
                    >
                        <div className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap">
                            {tekst}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {modus === 'celle' && beat === 1 && (
                <div className="absolute left-[5%] top-[24%] flex flex-col gap-4" style={{ width: 330 }}>
                    {['Kritikk av lederen på nettet?', 'Krangel med feil person?'].map((t, i) => (
                        <motion.div
                            key={t}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 1.2 }}
                            className="rounded-2xl bg-white/95 shadow-xl px-5 py-3 text-2xl font-bold text-slate-900"
                        >
                            {t}
                        </motion.div>
                    ))}
                </div>
            )}
            {modus === 'soyler' && (
                <div className="absolute inset-x-0 bottom-[4%] flex justify-center gap-3 px-6">
                    {REGLER.map((r, i) => {
                        const vis = beat >= i + 1;
                        const aktiv = beat === i + 1 || beat >= 5;
                        return (
                            <motion.div
                                key={r}
                                initial={false}
                                animate={{ opacity: vis ? 1 : 0, y: vis ? 0 : 14 }}
                                transition={{ duration: 0.5 }}
                                className="rounded-xl bg-white/95 shadow-lg px-3 py-2 flex gap-2 items-start"
                                style={{ width: 200, borderLeft: `8px solid ${SOYLE_FARGER[i]}`, opacity: 0 }}
                            >
                                <span className="font-display font-black text-2xl leading-none" style={{ color: SOYLE_FARGER[i] }}>
                                    {i + 1}
                                </span>
                                <span className={`text-xl leading-tight font-bold ${aktiv ? 'text-slate-900' : 'text-slate-500'}`}>
                                    {r}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            )}
            {modus === 'vern' && (
                <div className="absolute right-[4%] top-[12%] flex flex-col gap-4" style={{ width: 340 }}>
                    {VERN.map((k) => (
                        <motion.div
                            key={k.p}
                            initial={false}
                            animate={{ opacity: beat >= k.fraBeat ? 1 : 0, x: beat >= k.fraBeat ? 0 : 20 }}
                            transition={{ duration: 0.6 }}
                            className="rounded-2xl bg-white/95 shadow-xl px-5 py-3"
                            style={{ borderLeft: '10px solid #1d4ed8', opacity: 0 }}
                        >
                            <div className="font-display font-black text-3xl text-blue-800">{k.p}</div>
                            <div className="text-xl font-semibold text-slate-800 leading-snug">{k.t}</div>
                        </motion.div>
                    ))}
                    {beat >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl bg-teal-700 text-white shadow-xl px-5 py-3 font-display font-bold text-2xl"
                        >
                            I Norge ville han vært beskyttet
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
