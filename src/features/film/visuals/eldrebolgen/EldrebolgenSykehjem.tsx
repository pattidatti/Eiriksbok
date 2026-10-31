import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Sykehjemmet i en liten kommune, bygd av enkle former.
 * «start»: utsiden en fredag. To sykepleiere går, ingen søker, tre eldre venter, og til
 * slutt løfter kameraet seg og viser flere sykehjem i landskapet.
 * «mangel»: dukkehus-snitt med rom og senger. Tomme vakter (røde omriss) dukker opp der
 * det mangler folk, og familien som hjelper blir borte.
 */

type Modus = 'start' | 'mangel';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'start') {
        switch (beat) {
            case 0:
                return { pos: v(14 - t * 0.3, 6, 20), se: v(0, 1.5, 0) };
            case 1:
                return { pos: v(9, 4.5, 19), se: v(0, 1, 5) };
            case 2:
                return { pos: v(-6, 3.2, 12), se: v(1, 1.6, 3) };
            case 3:
                return { pos: v(5, 3, 11), se: v(0, 1.2, 3.5) };
            default:
                return { pos: v(0, 26 + t * 0.6, 42 + t * 0.6), se: v(0, 0, -4) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-3, 8.5, 9), se: v(-3, 0.4, -1.2) };
        case 1:
            return { pos: v(4, 10, 17), se: v(4, 0.5, 0) };
        case 2:
            return { pos: v(-2, 7.5, 7.5), se: v(-2, 0.4, -1) };
        default:
            return { pos: v(2.5, 9, 12.5), se: v(2.5, 0.3, -0.8) };
    }
}

/** En person: kropp og hode. */
function Person({
    farge,
    hode = '#f2c9a0',
    hoyde = 1.5,
    gjennomsiktig = false,
}: {
    farge: string;
    hode?: string;
    hoyde?: number;
    gjennomsiktig?: boolean;
}) {
    return (
        <group>
            <mesh position={[0, hoyde * 0.35, 0]}>
                <cylinderGeometry args={[0.24, 0.3, hoyde * 0.7, 10]} />
                <meshStandardMaterial
                    color={farge}
                    transparent={gjennomsiktig}
                    opacity={gjennomsiktig ? 0.45 : 1}
                    emissive={gjennomsiktig ? farge : '#000000'}
                    emissiveIntensity={gjennomsiktig ? 0.5 : 0}
                    flatShading
                />
            </mesh>
            <mesh position={[0, hoyde * 0.82, 0]}>
                <sphereGeometry args={[0.22, 12, 10]} />
                <meshStandardMaterial
                    color={gjennomsiktig ? farge : hode}
                    transparent={gjennomsiktig}
                    opacity={gjennomsiktig ? 0.45 : 1}
                    flatShading
                />
            </mesh>
        </group>
    );
}

/** En gruppe som glir mot et mål og krymper bort når den skal være borte. */
function Glidende({
    maal,
    synlig,
    fart = 1.2,
    children,
}: {
    maal: [number, number, number];
    synlig: boolean;
    fart?: number;
    children: React.ReactNode;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const dt = Math.min(delta, 0.05);
        if (forste.current) {
            g.position.set(...maal);
            g.scale.setScalar(synlig ? 1 : 0.001);
            forste.current = false;
        }
        g.position.x = damp(g.position.x, maal[0], fart, dt);
        g.position.y = damp(g.position.y, maal[1], fart, dt);
        g.position.z = damp(g.position.z, maal[2], fart, dt);
        const s = damp(g.scale.x, synlig ? 1 : 0.001, 4, dt);
        g.scale.setScalar(s);
        g.visible = s > 0.02;
    });
    return <group ref={ref}>{children}</group>;
}

function Tre({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
    return (
        <group position={[x, 0, z]} scale={s}>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.15, 0.2, 1, 6]} />
                <meshStandardMaterial color="#6b4423" flatShading />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
                <coneGeometry args={[0.9, 2.4, 7]} />
                <meshStandardMaterial color="#2f6b3a" flatShading />
            </mesh>
        </group>
    );
}

const LENGDE = 16;
const DYBDE = 6;
const VEGG = 2.8;
const ROM = 6;

/** Selve bygningen. `aapen` fjerner fremveggen og taket (dukkehus). */
function Bygning({ aapen, lys }: { aapen: boolean; lys: number }) {
    const vinduer = useMemo(() => Array.from({ length: 7 }, (_, i) => -6.6 + i * 2.2).filter((x) => Math.abs(x) > 0.8), []);
    return (
        <group>
            <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[LENGDE, 0.2, DYBDE]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
            <mesh position={[0, (aapen ? 1.8 : VEGG) / 2, -DYBDE / 2]}>
                <boxGeometry args={[LENGDE, aapen ? 1.8 : VEGG, 0.2]} />
                <meshStandardMaterial color="#f5efe6" />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[(s * LENGDE) / 2, (aapen ? 1.2 : VEGG) / 2, 0]}>
                    <boxGeometry args={[0.2, aapen ? 1.2 : VEGG, DYBDE]} />
                    <meshStandardMaterial color="#efe6d8" />
                </mesh>
            ))}
            {!aapen && (
                <>
                    <mesh position={[0, VEGG / 2, DYBDE / 2]}>
                        <boxGeometry args={[LENGDE, VEGG, 0.2]} />
                        <meshStandardMaterial color="#e9dcc7" />
                    </mesh>
                    {vinduer.map((x) => (
                        <mesh key={x} position={[x, 1.6, DYBDE / 2 + 0.12]}>
                            <boxGeometry args={[1.1, 0.9, 0.05]} />
                            <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={lys} />
                        </mesh>
                    ))}
                    <mesh position={[0, 1.0, DYBDE / 2 + 0.12]}>
                        <boxGeometry args={[1.2, 2.0, 0.05]} />
                        <meshStandardMaterial color="#7c4a2a" />
                    </mesh>
                    {[-1, 1].map((s) => (
                        <mesh key={s} position={[0, VEGG + 0.9, (s * DYBDE) / 4]} rotation={[s * 0.55, 0, 0]}>
                            <boxGeometry args={[LENGDE + 0.6, 0.2, DYBDE / 2 + 0.9]} />
                            <meshStandardMaterial color="#9a3412" flatShading />
                        </mesh>
                    ))}
                </>
            )}
            {aapen &&
                Array.from({ length: ROM - 1 }, (_, i) => -LENGDE / 2 + ((i + 1) * LENGDE) / ROM).map((x) => (
                    <mesh key={x} position={[x, 0.6, -0.4]}>
                        <boxGeometry args={[0.15, 1.2, DYBDE - 0.8]} />
                        <meshStandardMaterial color="#efe6d8" />
                    </mesh>
                ))}
        </group>
    );
}

const romX = (i: number) => -LENGDE / 2 + LENGDE / ROM / 2 + (i * LENGDE) / ROM;

function Seng({ x }: { x: number }) {
    return (
        <group position={[x, 0.2, -1.4]}>
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[1.3, 0.5, 2.2]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 0.62, 0.25]}>
                <boxGeometry args={[1.15, 0.18, 1.5]} />
                <meshStandardMaterial color="#93c5fd" flatShading />
            </mesh>
            <mesh position={[0, 0.72, -0.75]}>
                <sphereGeometry args={[0.24, 12, 10]} />
                <meshStandardMaterial color="#e5d5c5" />
            </mesh>
        </group>
    );
}

const SYKEPLEIER = '#2563eb';
const HELSEFAG = '#0d9488';
const TOM = '#dc2626';
const ELDRE_KLAER = '#a8a29e';

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const tid = useRef({ beat: -1, t: 0, forste: true });
    const se = useRef(v(0, 1, 0));

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const k = tid.current;
        if (k.beat !== beat) {
            k.beat = beat;
            k.t = 0;
        }
        k.t += dt;
        const maal = kameraFor(modus, beat, k.t);
        if (k.forste) {
            camera.position.copy(maal.pos);
            se.current.copy(maal.se);
            k.forste = false;
        } else {
            const a = 1 - Math.exp(-1.3 * Math.max(dt, 0));
            camera.position.lerp(maal.pos, a);
            se.current.lerp(maal.se, a);
        }
        camera.lookAt(se.current);
    });

    const aapen = modus === 'mangel';
    // Hvilke rom har folk på vakt, og hvilke står tomme fra beat 3.
    const vakt = [1, 4];
    const tomme = [0, 2, 3, 5];

    return (
        <>
            <color attach="background" args={[aapen ? '#e0f2fe' : '#fbd9a5']} />
            <fog attach="fog" args={[aapen ? '#e0f2fe' : '#fbd9a5', 40, 120]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[12, 20, 14]} intensity={1.5} color="#fff4e0" />
            <hemisphereLight args={['#fef3c7', '#4d7c0f', 0.45]} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color="#86b86a" emissive="#2f4a1f" emissiveIntensity={0.15} />
            </mesh>
            {/* Vei fram til døra */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 12]}>
                <planeGeometry args={[2.2, 18]} />
                <meshStandardMaterial color="#c8bfb0" />
            </mesh>
            {[
                [-30, -40, 14],
                [10, -50, 18],
                [40, -35, 12],
            ].map(([x, z, r], i) => (
                <mesh key={i} position={[x, -r * 0.55, z]} scale={[1.6, 1, 1]}>
                    <sphereGeometry args={[r, 14, 10]} />
                    <meshStandardMaterial color="#5f8f4e" flatShading />
                </mesh>
            ))}
            {[
                [-11, -2],
                [-12, 3],
                [11, -3],
                [12.5, 2.5],
                [-6, -7],
                [5, -7.5],
                [-15, -6],
                [15, -7],
            ].map(([x, z], i) => (
                <Tre key={i} x={x} z={z} s={0.9 + (i % 3) * 0.15} />
            ))}

            <Bygning aapen={aapen} lys={beat >= 4 ? 1.2 : 0.6} />

            {modus === 'start' && (
                <>
                    {/* To sykepleiere går ut døra og bort */}
                    {[-0.7, 0.7].map((dx, i) => (
                        <Glidende
                            key={i}
                            maal={beat === 0 ? [dx, 0.2, 3.9] : [dx * 2, 0.2, 13]}
                            synlig={beat <= 2}
                            fart={0.25}
                        >
                            <Person farge={SYKEPLEIER} />
                        </Glidende>
                    ))}
                    {/* Oppslag: ledig stilling */}
                    <Glidende maal={[2.2, 0, 4.6]} synlig={beat >= 2}>
                        <mesh position={[0, 0.7, 0]}>
                            <cylinderGeometry args={[0.06, 0.06, 1.4, 6]} />
                            <meshStandardMaterial color="#57534e" />
                        </mesh>
                        <mesh position={[0, 1.5, 0]}>
                            <boxGeometry args={[1.3, 0.85, 0.08]} />
                            <meshStandardMaterial color="#fef9c3" emissive="#facc15" emissiveIntensity={0.25} />
                        </mesh>
                    </Glidende>
                    {/* Tre eldre på venteliste */}
                    {[0, 1, 2].map((i) => (
                        <Glidende key={i} maal={[-1.6 - i * 0.9, 0.05, 4.6 + i * 0.5]} synlig={beat >= 3}>
                            <Person farge={ELDRE_KLAER} hode="#e7e5e4" hoyde={1.35} />
                        </Glidende>
                    ))}
                    {/* Flere sykehjem i landskapet */}
                    {[
                        [-34, -18],
                        [30, -22],
                        [-22, 22],
                        [36, 16],
                        [4, -36],
                    ].map(([x, z], i) => (
                        <Glidende key={i} maal={[x, 0, z]} synlig={beat >= 4}>
                            <mesh position={[0, 1.2, 0]}>
                                <boxGeometry args={[10, 2.4, 4]} />
                                <meshStandardMaterial color="#e9dcc7" emissive="#f59e0b" emissiveIntensity={0.12} />
                            </mesh>
                            <mesh position={[0, 2.7, 0]}>
                                <boxGeometry args={[10.4, 0.6, 4.4]} />
                                <meshStandardMaterial color="#9a3412" />
                            </mesh>
                        </Glidende>
                    ))}
                </>
            )}

            {modus === 'mangel' && (
                <>
                    {Array.from({ length: ROM }, (_, i) => (
                        <Seng key={i} x={romX(i)} />
                    ))}
                    {vakt.map((r, i) => (
                        <group key={r} position={[romX(r) + 0.9, 0.2, -0.2]}>
                            <Person farge={i === 0 ? HELSEFAG : SYKEPLEIER} hoyde={1.9} />
                            {beat === 2 && i === 0 && (
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                                    <ringGeometry args={[0.45, 0.62, 28]} />
                                    <meshBasicMaterial color="#f59e0b" />
                                </mesh>
                            )}
                        </group>
                    ))}
                    {tomme.map((r) => (
                        <Glidende key={r} maal={[romX(r) + 0.9, 0.2, -0.2]} synlig={beat >= 3}>
                            <Person farge={TOM} gjennomsiktig hoyde={1.9} />
                        </Glidende>
                    ))}
                    {/* Familien ved senga i siste rom */}
                    <Glidende maal={[romX(5) - 0.9, 0.2, 0.4]} synlig={beat <= 4}>
                        <Person farge="#a21caf" hoyde={1.7} />
                    </Glidende>
                    <Glidende maal={[romX(5) - 0.9, 0.2, 0.4]} synlig={beat >= 5}>
                        <Person farge={TOM} gjennomsiktig hoyde={1.7} />
                    </Glidende>
                    {/* Hjemmet ved siden av: hjelp hjemme */}
                    <Glidende maal={[13, 0, 1]} synlig={beat >= 1}>
                        <mesh position={[0, 1.1, 0]}>
                            <boxGeometry args={[4, 2.2, 3.4]} />
                            <meshStandardMaterial color="#fde68a" />
                        </mesh>
                        <mesh position={[0, 2.7, 0]} rotation={[0, Math.PI / 4, 0]}>
                            <coneGeometry args={[3.2, 1.6, 4]} />
                            <meshStandardMaterial color="#7c2d12" flatShading />
                        </mesh>
                        <group position={[-1.2, 0, 2.1]}>
                            <Person farge={ELDRE_KLAER} hode="#e7e5e4" hoyde={1.35} />
                        </group>
                    </Glidende>
                    <Glidende maal={[12, 0.05, 3.4]} synlig={beat >= 3}>
                        <Person farge={TOM} gjennomsiktig />
                    </Glidende>
                </>
            )}
        </>
    );
}

function Lapp({ tekst, mork = false }: { tekst: string; mork?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className={`absolute top-[6%] left-[4%] px-5 py-3 rounded-2xl font-display font-bold text-3xl shadow-xl whitespace-nowrap ${
                mork ? 'bg-slate-900/90 text-amber-200' : 'bg-white/95 text-slate-900'
            }`}
        >
            {tekst}
        </motion.div>
    );
}

const START_LAPPER = ['Fredag, på et sykehjem', '2 sykepleiere sier opp', 'Ledig stilling: ingen søker', '3 eldre på venteliste', 'Flere gamle og færre til å hjelpe, i hele Norge'];
const MANGEL_LAPPER = ['Noen må stelle de eldre', 'Hjemme og på sykehjem', '1 årsverk = én person i full stilling i ett år', 'Røde omriss: kan mangle folk i 2040', 'Mangel i 2040', 'Hvis familien hjelper mindre'];

export function EldrebolgenSykehjem({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'start';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const lapper = modus === 'start' ? START_LAPPER : MANGEL_LAPPER;
    const lapp = lapper[Math.min(beat, lapper.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [14, 6, 20] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <Lapp key={lapp} tekst={lapp} mork={modus === 'mangel' && beat >= 5} />
            </AnimatePresence>
            {modus === 'mangel' && beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute flex gap-4"
                    style={{ right: '4%', top: '6%' }}
                >
                    {beat === 3 ? (
                        <Teller verdi={42400} etikett="årsverk med helsepersonell" tone="rod" prefiks="ca. " />
                    ) : (
                        <>
                            <Teller verdi={25900} etikett="helsefagarbeidere (årsverk)" tone="gronn" />
                            <Teller verdi={14700} etikett="sykepleiere (årsverk)" forsinkelse={0.6} />
                        </>
                    )}
                </motion.div>
            )}
        </div>
    );
}
