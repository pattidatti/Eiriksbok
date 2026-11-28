import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';
import { damp } from './felles';

/**
 * De to klokkene på himmelen, i 3D.
 * «horisont»: en kald kveld. Sola går ned, og en tynn ny måne står over horisonten. Månen
 * er en kule som lyses opp fra sola bak den, så sigden blir riktig av seg selv.
 * «bane»: jorda rundt sola og månen rundt jorda. Tolv måneder etter månen når ikke helt
 * rundt, og hullet på elleve dager lyser rødt.
 * «gap»: hullet vokser (1, 3 og 9 år), og en høytid som bare følger månen vandrer fra
 * juli til desember.
 */

type Modus = 'horisont' | 'bane' | 'gap';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const R_BANE = 26;
const AAR = 365.24;
const MANED = 29.53;
const START = 0;

/** Vinkel på banen etter et antall dager fra start. */
function vinkelFor(dager: number) {
    return START + (dager / AAR) * Math.PI * 2;
}

function paBanen(dager: number, r = R_BANE): [number, number, number] {
    const a = vinkelFor(dager);
    return [Math.cos(a) * r, 0, Math.sin(a) * r];
}

function useBeatTid(beat: number) {
    const tidRef = useRef(0);
    useEffect(() => {
        tidRef.current = 0;
    }, [beat]);
    return tidRef;
}

/* ---------------- Merkelapp over 3D ---------------- */

function Merke({
    pos,
    children,
    farge = 'text-slate-900',
}: {
    pos: [number, number, number];
    children: ReactNode;
    farge?: string;
}) {
    return (
        <Html position={pos} center>
            <div
                className={`px-4 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-black whitespace-nowrap ${farge}`}
            >
                {children}
            </div>
        </Html>
    );
}

/* ---------------- «horisont» ---------------- */

const SOL_POS = v(-26, 1.2, -150);

/**
 * Månen tegnes med en egen enkel skygge: siden som vender mot sola er lys, resten mørk.
 * Sola står lavt bak og til venstre for månen, så det blir en tynn sigd, slik som like
 * etter nymåne.
 */
const MANE_SHADER = {
    uniforms: {
        uSol: { value: new THREE.Vector3(-0.55, -0.3, -0.78).normalize() },
        uSynlig: { value: 0 },
    },
    vertexShader: `
        varying vec3 vN;
        void main() {
            vN = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 uSol;
        uniform float uSynlig;
        varying vec3 vN;
        void main() {
            float l = smoothstep(-0.04, 0.12, dot(normalize(vN), uSol));
            vec3 c = mix(vec3(0.16, 0.22, 0.34), vec3(1.0, 0.98, 0.9), l);
            gl_FragColor = vec4(c, uSynlig);
        }
    `,
};
const MANE_POS = v(7, 10, -34);

function useGlod(farge: string) {
    return useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const g = c.getContext('2d');
        if (g) {
            const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
            grad.addColorStop(0, farge);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = grad;
            g.fillRect(0, 0, 128, 128);
        }
        return new THREE.CanvasTexture(c);
    }, [farge]);
}

function Stjerner({ antall, radius, synlig }: { antall: number; radius: number; synlig: boolean }) {
    const geo = useMemo(() => {
        const pos = new Float32Array(antall * 3);
        for (let i = 0; i < antall; i++) {
            const a = Math.sin(i * 12.9898) * 43758.5453;
            const b = Math.sin(i * 78.233) * 12345.678;
            const u = a - Math.floor(a);
            const w = b - Math.floor(b);
            const theta = u * Math.PI * 2;
            const phi = Math.acos(2 * w - 1);
            pos[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
            pos[i * 3 + 1] = Math.abs(Math.cos(phi)) * radius * 0.9 + 4;
            pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return g;
    }, [antall, radius]);
    return (
        <points geometry={geo} visible={synlig}>
            <pointsMaterial color="#ffffff" size={1.6} sizeAttenuation={false} />
        </points>
    );
}

function Horisont({ beat, playing }: { beat: number; playing: boolean }) {
    const sol = useRef<THREE.Mesh>(null);
    const glod = useRef<THREE.Sprite>(null);
    const mane = useRef<THREE.ShaderMaterial>(null);
    const tidRef = useBeatTid(beat);
    const lys = useRef<THREE.DirectionalLight>(null);
    const glodTekstur = useGlod('rgba(251,146,60,0.9)');
    const forste = useRef(true);

    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tidRef.current += dt;
        // Sola synker i første beat, og står halvt under horisonten etterpå.
        const solY = beat === 0 ? Math.max(1.2, 9 - tidRef.current * 1.6) : 1.2;
        const ferdig = !playing && beat === 0 ? 1.2 : solY;
        if (sol.current) sol.current.position.y = ferdig;
        if (glod.current) glod.current.position.y = ferdig;
        if (lys.current) {
            lys.current.position.set(SOL_POS.x, ferdig, SOL_POS.z);
            lys.current.target.position.copy(MANE_POS);
            lys.current.target.updateMatrixWorld();
        }
        if (mane.current) {
            const u = mane.current.uniforms.uSynlig;
            const mal = beat >= 1 ? 1 : 0;
            u.value = forste.current || !playing ? mal : damp(u.value, mal, dt, 2);
        }
        const mal = beat >= 4 ? v(-2, 4, 18) : v(0, 3 + beat * 0.3, 20);
        const se = beat >= 4 ? v(-6, 10, -40) : v(-4, 13, -60);
        if (forste.current) camera.position.copy(mal);
        else camera.position.lerp(mal, 1 - Math.exp(-1.3 * dt));
        camera.lookAt(se);
        forste.current = false;
    });

    return (
        <>
            <color attach="background" args={['#1e3a5f']} />
            <fog attach="fog" args={['#475569', 80, 320]} />
            <ambientLight intensity={0.35} color="#93c5fd" />
            <hemisphereLight args={['#fdba74', '#1e293b', 0.6]} />
            <directionalLight ref={lys} intensity={3} color="#fff7ed" />
            {/* Bakken: snø i kveldslys */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -60]}>
                <planeGeometry args={[600, 300]} />
                <meshBasicMaterial color="#7d8fb3" />
            </mesh>
            {/* Lave åser i horisonten */}
            {[-90, -50, -10, 30, 70, 110].map((x, i) => (
                <mesh
                    key={x}
                    position={[x, 0, -170 - (i % 2) * 20]}
                    scale={[30 + (i % 3) * 8, 7 + (i % 2) * 4, 10]}
                >
                    <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            ))}
            <mesh ref={sol} position={[SOL_POS.x, SOL_POS.y, SOL_POS.z]}>
                <sphereGeometry args={[5, 32, 24]} />
                <meshBasicMaterial color="#fb923c" fog={false} />
            </mesh>
            <sprite ref={glod} position={[SOL_POS.x, SOL_POS.y, SOL_POS.z - 2]} scale={[70, 70, 1]}>
                <spriteMaterial map={glodTekstur} transparent depthWrite={false} fog={false} />
            </sprite>
            <mesh position={[MANE_POS.x, MANE_POS.y, MANE_POS.z]}>
                <sphereGeometry args={[1.6, 48, 32]} />
                <shaderMaterial ref={mane} args={[MANE_SHADER]} transparent />
            </mesh>
            <Stjerner antall={260} radius={200} synlig={beat >= 1} />
            {beat >= 4 && (
                <>
                    <Merke pos={[SOL_POS.x, 16, SOL_POS.z]} farge="text-orange-600">
                        Sola: årstidene
                    </Merke>
                    <Merke
                        pos={[MANE_POS.x + 1, MANE_POS.y + 2.4, MANE_POS.z]}
                        farge="text-violet-700"
                    >
                        Månen: månedene
                    </Merke>
                </>
            )}
        </>
    );
}

/* ---------------- «bane» og «gap» ---------------- */

/** En bit av banen som en tykk bue, fra dag a til dag b. */
function Bue({
    fra,
    til,
    farge,
    tykk = 0.5,
    r = R_BANE,
}: {
    fra: number;
    til: number;
    farge: string;
    tykk?: number;
    r?: number;
}) {
    const a = vinkelFor(fra);
    const lengde = ((til - fra) / AAR) * Math.PI * 2;
    return (
        <group rotation={[0, -a, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[r, tykk, 10, 160, lengde]} />
                <meshBasicMaterial color={farge} />
            </mesh>
        </group>
    );
}

function Rom({ modus, beat, playing }: { modus: 'bane' | 'gap'; beat: number; playing: boolean }) {
    const jord = useRef<THREE.Group>(null);
    const mane = useRef<THREE.Mesh>(null);
    const tidRef = useBeatTid(beat);
    const forste = useRef(true);
    const lav = useMemo(() => guessTier().tier === 'lav', []);
    const total = useRef(0);

    // Jorda går langs banen bare i oversikten i «bane» (beat 0 og 2).
    const jordGar = modus === 'bane' && (beat === 0 || beat === 2);

    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tidRef.current += dt;
        total.current += dt;
        const dager = jordGar && playing ? (tidRef.current * 30) % AAR : 0;
        const [jx, , jz] = paBanen(dager);
        if (jord.current) jord.current.position.set(jx, 0, jz);
        if (mane.current) {
            const ma = playing ? total.current * 1.4 : 2.2;
            mane.current.position.set(Math.cos(ma) * 3.2, 0, Math.sin(ma) * 3.2);
        }
        let pos: THREE.Vector3;
        let se: THREE.Vector3;
        if (modus === 'bane' && beat === 1) {
            pos = v(jx + 5, 4.5, jz + 8);
            se = v(jx, 0, jz);
        } else if (modus === 'bane' && beat === 0) {
            pos = v(0, 34, 62);
            se = v(0, -2, 0);
        } else {
            pos = v(0, 78, 22);
            se = v(0, 0, 1);
        }
        if (forste.current) camera.position.copy(pos);
        else camera.position.lerp(pos, 1 - Math.exp(-1.3 * dt));
        camera.lookAt(se);
        forste.current = false;
    });

    const visMarkorer = modus === 'bane' && beat >= 3;
    const antall = 12;
    const vandrer = modus === 'gap' && beat === 3;
    const hullDager = modus === 'gap' ? [11, 33, 99][Math.min(beat, 2)] : 11;
    const hullTekst = ['1 år: 11 dager', '3 år: en måned', '9 år: en årstid'][Math.min(beat, 2)];

    return (
        <>
            <color attach="background" args={['#0b1226']} />
            <ambientLight intensity={0.25} />
            <pointLight
                position={[0, 0, 0]}
                intensity={900}
                distance={0}
                decay={2}
                color="#fff7ed"
            />
            <Stjerner antall={lav ? 200 : 400} radius={220} synlig />
            {/* Sola */}
            <mesh>
                <sphereGeometry args={[4, 32, 24]} />
                <meshBasicMaterial color="#fbbf24" />
            </mesh>
            {/* Banen */}
            <Bue
                fra={0}
                til={AAR}
                farge={modus === 'bane' && beat === 2 ? '#f59e0b' : '#475569'}
                tykk={modus === 'bane' && beat === 2 ? 0.35 : 0.12}
            />
            {/* Jorda med månen rundt */}
            <group ref={jord} position={paBanen(0)}>
                <mesh>
                    <sphereGeometry args={[1.2, 32, 24]} />
                    <meshStandardMaterial
                        color="#3b82f6"
                        emissive="#1e3a8a"
                        emissiveIntensity={0.35}
                    />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry
                        args={[3.2, modus === 'bane' && beat === 1 ? 0.08 : 0.04, 8, 80]}
                    />
                    <meshBasicMaterial
                        color={modus === 'bane' && beat === 1 ? '#a78bfa' : '#64748b'}
                    />
                </mesh>
                <mesh ref={mane}>
                    <sphereGeometry args={[0.45, 24, 16]} />
                    <meshStandardMaterial
                        color="#e2e8f0"
                        emissive="#334155"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            </group>
            {visMarkorer &&
                Array.from({ length: antall }, (_, k) => (
                    <mesh key={k} position={paBanen((k + 1) * MANED, R_BANE + 2.4)}>
                        <sphereGeometry args={[0.6, 20, 14]} />
                        <meshBasicMaterial color="#a78bfa" />
                    </mesh>
                ))}
            {((modus === 'bane' && beat === 4) || (modus === 'gap' && beat <= 2)) && (
                <Bue fra={AAR - hullDager} til={AAR} farge="#ef4444" tykk={0.8} />
            )}
            {vandrer &&
                Array.from({ length: 19 }, (_, k) => (
                    <mesh key={k} position={paBanen(-11 * k, R_BANE + 2.6)}>
                        <sphereGeometry args={[k === 0 || k === 18 ? 0.9 : 0.55, 20, 14]} />
                        <meshBasicMaterial color={k === 0 || k === 18 ? '#f97316' : '#fdba74'} />
                    </mesh>
                ))}
            {modus === 'bane' && beat === 1 && (
                <Merke pos={[R_BANE - 1.9, 1.5, 2.6]} farge="text-violet-700">
                    Månen rundt jorda
                </Merke>
            )}
            {modus === 'bane' && beat === 3 && (
                <Merke pos={paBanen(12 * MANED, R_BANE + 8)} farge="text-violet-700">
                    12 måneder
                </Merke>
            )}
            {((modus === 'bane' && beat === 4) || (modus === 'gap' && beat <= 2)) && (
                <Merke
                    pos={paBanen(AAR - Math.min(hullDager / 2, 20), R_BANE + 10)}
                    farge="text-red-600"
                >
                    {modus === 'bane' ? '11 dager' : hullTekst}
                </Merke>
            )}
            {vandrer && (
                <>
                    <Merke pos={paBanen(0, R_BANE + 8)} farge="text-orange-600">
                        juli
                    </Merke>
                    <Merke pos={paBanen(-11 * 18, R_BANE + 8)} farge="text-orange-600">
                        desember
                    </Merke>
                </>
            )}
        </>
    );
}

/* ---------------- Kort over lerretet ---------------- */

function Kort({
    synlig,
    side,
    tittel,
    linjer,
    farge,
}: {
    synlig: boolean;
    side: 'v' | 'h';
    tittel: string;
    linjer: string[];
    farge: string;
}) {
    return (
        <div
            className={`absolute top-[24%] ${side === 'v' ? 'left-[4%]' : 'right-[4%]'} pointer-events-none`}
        >
            <AnimatePresence>
                {synlig && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-6 py-4 rounded-2xl bg-white/95 shadow-xl"
                        style={{ maxWidth: 380 }}
                    >
                        <div className={`text-4xl font-black ${farge}`}>{tittel}</div>
                        {linjer.map((l) => (
                            <div key={l} className="text-2xl font-bold text-slate-700 mt-1">
                                {l}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const TEKST: Record<Modus, (string | null)[]> = {
    horisont: [null, 'To klokker på samme himmel', null, null, 'Hver sin klokke'],
    bane: [
        'Hvordan deler vi tiden?',
        'Månen: én måned',
        'Sola: ett år',
        'Tolv måneder etter månen',
        'Klokkene går ikke i takt',
    ],
    gap: ['Etter 1 år', 'Etter 3 år', 'Etter 9 år', 'En høytid som bare følger månen'],
};

export function HoytiderHimmel({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'horisont';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 900, position: [0, 4, 20] }}
            >
                {modus === 'horisont' ? (
                    <Horisont beat={beat} playing={playing} />
                ) : (
                    <Rom modus={modus} beat={beat} playing={playing} />
                )}
            </Canvas>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} mork={modus !== 'horisont'} />
            {modus === 'horisont' && (
                <>
                    <Kort
                        synlig={beat === 2}
                        side="v"
                        tittel="Ramadan"
                        linjer={['som barn: august', 'som voksen: februar']}
                        farge="text-emerald-700"
                    />
                    <Kort
                        synlig={beat === 3}
                        side="h"
                        tittel="Julaften"
                        linjer={['24. desember', 'hele livet']}
                        farge="text-red-600"
                    />
                </>
            )}
            {modus === 'bane' && (
                <>
                    <Kort
                        synlig={beat === 1}
                        side="h"
                        tittel="Én måned"
                        linjer={['fra nymåne', 'til nymåne']}
                        farge="text-violet-700"
                    />
                    <Kort
                        synlig={beat === 2}
                        side="v"
                        tittel="Ett år"
                        linjer={['litt under 365 døgn', 'og seks timer']}
                        farge="text-amber-600"
                    />
                    <Kort
                        synlig={beat === 3}
                        side="v"
                        tittel="12 måneder"
                        linjer={['354 dager', 'og åtte timer']}
                        farge="text-violet-700"
                    />
                    <Kort
                        synlig={beat === 4}
                        side="v"
                        tittel="11 dager"
                        linjer={['for tidlig', 'hvert år']}
                        farge="text-red-600"
                    />
                </>
            )}
        </div>
    );
}
