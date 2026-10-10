import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { STEG, TRADISJONER, type Tradisjon } from './data';
import { RiteIkon } from './ikoner';

/**
 * Livets trapp i 3D: fire trinn (fødsel, voksen, ekteskap, død), og én fil per tradisjon
 * opp trappa. En søyle i tradisjonens farge betyr at den har en egen rite på trinnet. En
 * stiplet ramme betyr at den ikke har det. Hver beat peker ut et trinn og/eller en tradisjon.
 */

interface Fokus {
    steg?: number | null;
    tradisjon?: string | null;
    tekst?: string;
    visTomme?: boolean;
    /** Tegning av hva riten gjør, se ikoner.tsx. */
    ikon?: string;
}

interface Props {
    tradisjoner?: string[];
    fokus?: Fokus[];
    vandrer?: boolean;
}

const S = 4; // trinnets lengde langs x
const H = 1.2; // trinnets høyde
const L = 1.5; // bredden på hver tradisjons fil
const SOYLE = 1.5;

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Trappa stiger bort fra kameraet: trinn 0 er nærmest, døden lengst bak og høyest oppe.
const stegZ = (k: number) => -k * S - S / 2;
const stegTopp = (k: number) => (k + 1) * H;

function Rute({ trad, k, x, fokus }: { trad: Tradisjon; k: number; x: number; fokus: Fokus }) {
    const har = trad.riter[k] !== null;
    const gruppe = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const strek = useRef<THREE.LineSegments>(null);
    const kanter = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, SOYLE, 1)), []);
    useEffect(() => () => kanter.dispose(), [kanter]);
    useEffect(() => {
        strek.current?.computeLineDistances();
    }, []);

    useFrame((state, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        const iTrad = fokus.tradisjon ? fokus.tradisjon === trad.id : true;
        const iSteg = typeof fokus.steg === 'number' ? fokus.steg === k : true;
        const midt = iTrad && iSteg;
        const malLys = midt ? 1 : iTrad || iSteg ? 0.45 : 0.18;
        const g = gruppe.current;
        if (g) {
            const malHoyde = midt && (fokus.tradisjon || typeof fokus.steg === 'number') ? 0.35 : 0;
            g.position.y = damp(g.position.y, stegTopp(k) + SOYLE / 2 + malHoyde, 3, dt);
            const sk = midt && fokus.tradisjon ? 1.18 : 1;
            g.scale.setScalar(damp(g.scale.x, sk, 3, dt));
        }
        if (mat.current) {
            mat.current.opacity = damp(mat.current.opacity, 0.25 + malLys * 0.75, 3, dt);
            mat.current.emissiveIntensity = damp(
                mat.current.emissiveIntensity,
                midt ? 0.55 : 0.12,
                3,
                dt
            );
        }
        if (strek.current) {
            const m = strek.current.material as THREE.LineDashedMaterial;
            const puls = fokus.visTomme ? 0.75 + Math.sin(state.clock.elapsedTime * 4) * 0.25 : 0;
            m.opacity = damp(m.opacity, fokus.visTomme ? puls : 0.25 + malLys * 0.6, 4, dt);
            m.color.set(fokus.visTomme ? '#dc2626' : '#475569');
        }
    });

    return (
        <group ref={gruppe} position={[x, stegTopp(k) + SOYLE / 2, stegZ(k) - 0.5]}>
            {har ? (
                <mesh>
                    <boxGeometry args={[1, SOYLE, 1]} />
                    <meshStandardMaterial
                        ref={mat}
                        color={trad.farge}
                        emissive={trad.farge}
                        emissiveIntensity={0.12}
                        transparent
                        opacity={1}
                        flatShading
                        roughness={0.55}
                    />
                </mesh>
            ) : (
                <lineSegments ref={strek} geometry={kanter}>
                    <lineDashedMaterial
                        color="#475569"
                        dashSize={0.16}
                        gapSize={0.12}
                        linewidth={2}
                        transparent
                        opacity={0.6}
                    />
                </lineSegments>
            )}
        </group>
    );
}

/** En liten figur som går opp trappa, ett trinn per beat. */
function Vandrer({ steg, x }: { steg: number | null; x: number }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((state, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = forste.current ? 1 : Math.min(rawDt, 0.05);
        const mz = steg === null ? 2.2 : stegZ(steg) + 1.1;
        const my = steg === null ? 0 : stegTopp(steg);
        if (forste.current) {
            g.position.set(x, my, mz);
            forste.current = false;
            return;
        }
        g.position.z = damp(g.position.z, mz, 2.2, dt);
        // Et lite hopp når figuren går opp et trinn.
        const ny = damp(g.position.y, my, 3.5, dt);
        g.position.y = ny + (Math.abs(my - ny) > 0.05 ? 0.12 : 0);
        g.rotation.z = Math.sin(state.clock.elapsedTime * 6) * 0.04;
    });
    return (
        <group ref={ref} position={[x, 0, 2.2]}>
            <mesh position={[0, 0.65, 0]}>
                <capsuleGeometry args={[0.28, 0.7, 4, 10]} />
                <meshStandardMaterial color="#1e293b" flatShading />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <sphereGeometry args={[0.27, 14, 12]} />
                <meshStandardMaterial color="#f1c27d" flatShading />
            </mesh>
        </group>
    );
}

function Scene({
    trads,
    fokus,
    beat,
    playing,
    vandrer,
}: {
    trads: Tradisjon[];
    fokus: Fokus;
    beat: number;
    playing: boolean;
    vandrer: boolean;
}) {
    const { camera } = useThree();
    const n = trads.length;
    const bredde = n * L + 2.6;
    const laneX = (i: number) => (i - (n - 1) / 2) * L + 0.5;
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const kamSe = useRef(new THREE.Vector3(0, 3, -8));
    const forste = useRef(true);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        const iT = trads.findIndex((tr) => tr.id === fokus.tradisjon);
        const x = iT >= 0 ? laneX(iT) : 0;
        const k = typeof fokus.steg === 'number' ? fokus.steg : null;
        const avstand = n > 4 ? 1 : 0.7;
        const drift = Math.sin(t * 0.25) * 1.2;
        let pos: THREE.Vector3;
        let se: THREE.Vector3;
        if (k === null && iT < 0) {
            // Oversikt over hele trappa.
            se = v(0, 3.4, -7);
            pos = v(-4 + drift, 13 * avstand + 3, 14.5 * avstand + 3);
        } else if (k === null) {
            se = v(x, 3.6, -7);
            pos = v(x * 0.6 + drift, 11, 12);
        } else {
            se = v(x * 0.85, stegTopp(k) + 2.2, stegZ(k) - 1);
            pos = v(
                x * 0.7 + drift - 1.5,
                stegTopp(k) + 8 * avstand + 2,
                stegZ(k) + 10 * avstand + 3.5
            );
        }
        const f = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(pos, f);
        kamSe.current.lerp(se, f);
        camera.lookAt(kamSe.current);
    });

    return (
        <>
            <color attach="background" args={['#f3ece1']} />
            <fog attach="fog" args={['#f3ece1', 40, 90]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[10, 25, 18]} intensity={1.4} color="#fff7e8" />
            <hemisphereLight args={['#fff3dd', '#8a7a66', 0.45]} />
            {/* Bakken */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -8]}>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial color="#e3d8c6" />
            </mesh>
            {/* Trinnene */}
            {STEG.map((_, k) => {
                const aktiv = fokus.steg === k;
                return (
                    <mesh key={k} position={[0.5, stegTopp(k) / 2, stegZ(k)]}>
                        <boxGeometry args={[bredde, stegTopp(k), S - 0.08]} />
                        <meshStandardMaterial
                            color={aktiv ? '#fde68a' : '#d6cdbd'}
                            flatShading
                            roughness={0.9}
                        />
                    </mesh>
                );
            })}
            {trads.map((tr, i) =>
                STEG.map((_, k) => (
                    <Rute key={`${tr.id}-${k}`} trad={tr} k={k} x={laneX(i)} fokus={fokus} />
                ))
            )}
            {vandrer && (
                <Vandrer
                    steg={typeof fokus.steg === 'number' ? fokus.steg : null}
                    x={-(n * L) / 2 - 0.4}
                />
            )}
        </>
    );
}

export function OvergangsriterTrapp({ beat, playing, props }: VisualProps<Props>) {
    const trads = useMemo(() => {
        const ids = props.tradisjoner;
        if (!ids?.length) return TRADISJONER;
        return ids
            .map((id) => TRADISJONER.find((t) => t.id === id))
            .filter((t): t is Tradisjon => Boolean(t));
    }, [props.tradisjoner]);
    const liste = props.fokus ?? [];
    const fokus: Fokus = liste[Math.min(beat, liste.length - 1)] ?? {};
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const trad = TRADISJONER.find((t) => t.id === fokus.tradisjon);
    const k = typeof fokus.steg === 'number' ? fokus.steg : null;
    const rite = trad && k !== null ? trad.riter[k] : undefined;
    const undertekst = trad
        ? k === null
            ? trad.navn
            : `${trad.navn} · ${STEG[k]}: ${rite ?? 'ingen egen seremoni'}`
        : null;

    return (
        <div className="absolute inset-0">
            <Canvas dpr={dpr} camera={{ fov: 42, near: 0.5, far: 200, position: [2, 11, 26] }}>
                <Scene
                    trads={trads}
                    fokus={fokus}
                    beat={beat}
                    playing={playing}
                    vandrer={Boolean(props.vandrer)}
                />
            </Canvas>

            {/* Trinnene øverst */}
            <div
                style={{ top: '3%', right: '2%' }}
                className="absolute flex justify-end gap-2 md:gap-3"
            >
                {STEG.map((s, i) => (
                    <div
                        key={s}
                        className={`px-3 py-1 rounded-full text-sm md:text-lg font-bold whitespace-nowrap transition-colors duration-500 ${
                            k === i
                                ? 'bg-amber-400 text-slate-900 shadow-lg'
                                : 'bg-white/70 text-slate-500'
                        }`}
                    >
                        {i + 1}. {s}
                    </div>
                ))}
            </div>

            {/* Hva beaten handler om */}
            <AnimatePresence mode="wait">
                {fokus.tekst && (
                    <motion.div
                        key={`${beat}-${fokus.tekst}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="absolute top-[12%] inset-x-0 mx-auto w-fit max-w-[86%] px-5 py-2.5 rounded-2xl bg-white/95 shadow-xl text-center"
                        style={trad ? { borderLeft: `10px solid ${trad.farge}` } : undefined}
                    >
                        <div className="flex items-center gap-4">
                            {fokus.ikon && <RiteIkon navn={fokus.ikon} />}
                            <div>
                                <div className="text-2xl md:text-4xl font-display font-black text-slate-900 leading-tight">
                                    {fokus.tekst}
                                </div>
                                {undertekst && (
                                    <div className="text-base md:text-xl font-semibold text-slate-500 mt-1">
                                        {undertekst}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fargeforklaring nederst, i samme rekkefølge som filene i trappa (venstre til høyre) */}
            <div
                style={{ bottom: '3%' }}
                className="absolute inset-x-0 px-4 flex flex-wrap justify-center gap-1.5 md:gap-2 pointer-events-none"
            >
                {trads.map((t) => {
                    const valgt = fokus.tradisjon === t.id;
                    const dempet = fokus.tradisjon && !valgt;
                    return (
                        <div
                            key={t.id}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 shadow text-sm md:text-base font-bold transition-opacity duration-500 ${
                                dempet ? 'opacity-40' : 'opacity-100'
                            } ${valgt ? 'ring-4 ring-amber-400' : ''}`}
                        >
                            <span
                                className="inline-block w-3.5 h-3.5 rounded-sm"
                                style={{ background: t.farge }}
                            />
                            <span className="text-slate-800 whitespace-nowrap">{t.navn}</span>
                        </div>
                    );
                })}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 shadow text-sm md:text-base font-bold">
                    <span className="inline-block w-3.5 h-3.5 rounded-sm border-2 border-dashed border-red-600" />
                    <span className="text-slate-800 whitespace-nowrap">ingen seremoni</span>
                </div>
            </div>
        </div>
    );
}
