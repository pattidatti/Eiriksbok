import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Karaktersmien i 3D: et verksted med en esse som gløder, og en figur på arbeidsbenken
 * som smis fram trinn for trinn.
 * - papir: Elias er en flat papirfigur. Fra siden er han bare en strek.
 * - overflate: figuren får tykkelse, så rød hettegenser og en klokke som har stoppet.
 * - skygge: en mørk skikkelse (et «Ghost») vokser fram bak ham, og hetta går opp.
 * - sara: Sara kommer inn, og det slår gnister mellom dem.
 */

type Modus = 'papir' | 'overflate' | 'skygge' | 'sara';

const TRINN = ['Funksjon', 'Overflaten', 'Motoren', 'Skyggen', 'Kontrasten'];
const AKTIVT: Record<Modus, number> = { papir: -1, overflate: 1, skygge: 3, sara: 4 };

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

/** Benkeplata ligger på y = 1. Elias står i x = 0, Sara i x = 2.2. */
function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'papir') {
        switch (beat) {
            case 0:
                return { pos: v(0.3, 2.2, 4.2 - t * 0.05), se: v(0, 2, 0) };
            case 1:
                return { pos: v(4.2, 2.1, 0.15), se: v(0, 2, 0) };
            case 2:
                return { pos: v(-2.5, 2.5, 3.8), se: v(0, 1.9, 0) };
            default:
                return { pos: v(3 + t * 0.03, 3.4, 7.5), se: v(-0.6, 1.6, -1) };
        }
    }
    if (modus === 'overflate') {
        switch (beat) {
            case 0:
                return { pos: v(3.6, 2.6, 4.2), se: v(0, 1.85, 0) };
            case 1:
                return { pos: v(-2.6, 2.3, 3.4), se: v(0, 1.9, 0) };
            case 2:
                return { pos: v(1.1, 2.4, 4), se: v(0, 1.8, 0) };
            case 3:
                return { pos: v(-0.75, 2.05, 1.7), se: v(-0.41, 1.86, 0.05) };
            default:
                return { pos: v(1.8 - t * 0.04, 2.3, 3.6), se: v(0, 1.95, 0) };
        }
    }
    if (modus === 'skygge') {
        switch (beat) {
            case 0:
                return { pos: v(2.6, 2.3, 3.6), se: v(0, 1.95, 0) };
            case 1:
                return { pos: v(-1.6, 2.3, 3), se: v(0, 2.15, 0) };
            case 2:
                return { pos: v(2.6, 2.8, 5), se: v(0, 2.3, -0.8) };
            case 3:
                return { pos: v(-2.4, 2.6, 4.6), se: v(0, 2.3, -0.8) };
            default:
                return { pos: v(1.3, 2.45, 3.6), se: v(0, 2.0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-2.4, 2.4, 3.6), se: v(0.2, 1.95, 0) };
        case 1:
            return { pos: v(4.6, 2.6, 4.6), se: v(1.4, 1.9, 0) };
        case 2:
            return { pos: v(3, 2.4, 3.9), se: v(1.5, 1.95, 0) };
        default:
            return { pos: v(1.1, 2.9, 5.6 + t * 0.04), se: v(1.1, 1.9, 0) };
    }
}

interface FigurMat {
    kropp: THREE.MeshStandardMaterial;
    hud: THREE.MeshStandardMaterial;
    bein: THREE.MeshStandardMaterial;
}

function lagFigurMaterialer(kropp = '#f5f0e6', hud = '#f5f0e6', bein = '#f5f0e6'): FigurMat {
    return {
        kropp: new THREE.MeshStandardMaterial({ color: kropp, flatShading: true }),
        hud: new THREE.MeshStandardMaterial({ color: hud, flatShading: true }),
        bein: new THREE.MeshStandardMaterial({ color: bein, flatShading: true }),
    };
}

/** En figur av kapsler og en kule, ca. 1,9 høy, med føttene i y = 0. */
function Figur({
    gruppe,
    mat,
    armUt = 0,
    children,
}: {
    gruppe?: React.Ref<THREE.Group>;
    mat: FigurMat;
    armUt?: number;
    children?: React.ReactNode;
}) {
    return (
        <group ref={gruppe}>
            <mesh position={[-0.13, 0.42, 0]} material={mat.bein}>
                <capsuleGeometry args={[0.1, 0.62, 4, 8]} />
            </mesh>
            <mesh position={[0.13, 0.42, 0]} material={mat.bein}>
                <capsuleGeometry args={[0.1, 0.62, 4, 8]} />
            </mesh>
            <mesh position={[0, 1.15, 0]} material={mat.kropp}>
                <capsuleGeometry args={[0.24, 0.5, 4, 10]} />
            </mesh>
            <mesh position={[-0.36, 1.12, 0]} rotation={[0, 0, -0.12 - armUt]} material={mat.kropp}>
                <capsuleGeometry args={[0.08, 0.55, 4, 8]} />
            </mesh>
            <mesh position={[0.36, 1.12, 0]} rotation={[0, 0, 0.12 + armUt]} material={mat.kropp}>
                <capsuleGeometry args={[0.08, 0.55, 4, 8]} />
            </mesh>
            <mesh position={[0, 1.68, 0]} material={mat.hud}>
                <sphereGeometry args={[0.2, 14, 12]} />
            </mesh>
            {children}
        </group>
    );
}

/** Gnister som stiger fra essa, eller som slår mellom Elias og Sara. */
function Gnister({
    playing,
    senter,
    spredning,
    antall,
    synlig,
}: {
    playing: boolean;
    senter: [number, number, number];
    spredning: number;
    antall: number;
    synlig: React.RefObject<number>;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    const g = useMemo(() => {
        const r = tilfeldig(antall * 13 + 5);
        return Array.from({ length: antall }, () => ({
            x: (r() - 0.5) * spredning,
            y: r() * 1.2,
            z: (r() - 0.5) * spredning * 0.5,
            fart: 0.5 + r() * 0.9,
            sving: r() * 6,
        }));
    }, [antall, spredning]);
    const m = useMemo(() => new THREE.Matrix4(), []);
    useFrame(({ clock }, rawDt) => {
        const inst = ref.current;
        if (!inst) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        g.forEach((p, i) => {
            p.y += p.fart * dt;
            if (p.y > 1.2) p.y -= 1.2;
            const sx = Math.sin(clock.elapsedTime * 2 + p.sving) * 0.05;
            m.makeTranslation(senter[0] + p.x + sx, senter[1] + p.y, senter[2] + p.z);
            inst.setMatrixAt(i, m);
        });
        inst.instanceMatrix.needsUpdate = true;
        if (mat.current) mat.current.opacity = synlig.current ?? 0;
        inst.visible = (synlig.current ?? 0) > 0.02;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
            <boxGeometry args={[0.035, 0.035, 0.035]} />
            <meshBasicMaterial
                ref={mat}
                color="#fdba74"
                transparent
                opacity={0}
                toneMapped={false}
            />
        </instancedMesh>
    );
}

function Verksted() {
    return (
        <>
            {/* Gulvet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color="#5b4636" emissive="#21170f" />
            </mesh>
            {/* Bakveggen av mur */}
            <mesh position={[0, 3, -3.2]}>
                <boxGeometry args={[16, 6, 0.4]} />
                <meshStandardMaterial color="#7c5c48" emissive="#2a1c14" flatShading />
            </mesh>
            {/* Arbeidsbenken */}
            <mesh position={[1, 0.95, 0]}>
                <boxGeometry args={[5.4, 0.1, 1.6]} />
                <meshStandardMaterial color="#9a6b43" emissive="#2b1a0e" flatShading />
            </mesh>
            {[
                [-1.5, -0.6],
                [-1.5, 0.6],
                [3.5, -0.6],
                [3.5, 0.6],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.45, z]}>
                    <boxGeometry args={[0.14, 0.9, 0.14]} />
                    <meshStandardMaterial color="#6b4a2f" flatShading />
                </mesh>
            ))}
            {/* Essa med glør */}
            <mesh position={[-3.4, 0.6, -2.2]}>
                <boxGeometry args={[1.8, 1.2, 1.4]} />
                <meshStandardMaterial color="#4b4b52" flatShading />
            </mesh>
            <mesh position={[-3.4, 1.22, -2.2]}>
                <boxGeometry args={[1.4, 0.06, 1]} />
                <meshBasicMaterial color="#f97316" toneMapped={false} />
            </mesh>
            <mesh position={[-3.4, 3.3, -2.6]}>
                <boxGeometry args={[0.7, 3.6, 0.7]} />
                <meshStandardMaterial color="#3f3f46" flatShading />
            </mesh>
            {/* Ambolt og hammer */}
            <mesh position={[-1.2, 1.15, 0.2]}>
                <boxGeometry args={[0.5, 0.3, 0.25]} />
                <meshStandardMaterial color="#52525b" metalness={0.4} flatShading />
            </mesh>
            <mesh position={[-0.95, 1.06, 0.55]} rotation={[0, 0.5, Math.PI / 2]}>
                <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>
            {/* Papirark på benken */}
            {[
                [2.9, -0.3, 0.3],
                [3.1, 0.25, -0.2],
            ].map(([x, z, r], i) => (
                <mesh key={i} position={[x, 1.01, z]} rotation={[-Math.PI / 2, 0, r]}>
                    <planeGeometry args={[0.5, 0.7]} />
                    <meshStandardMaterial color="#f1ead8" />
                </mesh>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);

    const elias = useMemo(() => lagFigurMaterialer(), []);
    const sara = useMemo(() => lagFigurMaterialer('#f59e0b', '#c68a5a', '#7c3aed'), []);
    const eliasGruppe = useRef<THREE.Group>(null);
    const saraGruppe = useRef<THREE.Group>(null);
    const hette = useRef<THREE.Mesh>(null);
    const klokke = useRef<THREE.Group>(null);
    const klokkeRing = useRef<THREE.Mesh>(null);
    const skygge = useRef<THREE.Group>(null);
    const skyggeMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#0f0a1e',
                emissive: '#3b0764',
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0,
                flatShading: true,
            }),
        []
    );
    const esseLys = useRef<THREE.PointLight>(null);
    const romLys = useRef<THREE.AmbientLight>(null);

    const tykk = useRef(0.05);
    const rød = useRef(0);
    const hetteOpp = useRef(0);
    const klokkeVis = useRef(0);
    const skyggeVis = useRef(0);
    const saraInn = useRef(0);
    const gnistMellom = useRef(0);
    const gnistEsse = useRef(1);
    const mørkt = useRef(0);
    const krymp = useRef(1);

    const papir = useMemo(() => new THREE.Color('#f5f0e6'), []);
    const skisse = useMemo(() => new THREE.Color('#cbd5e1'), []);
    const hettegenser = useMemo(() => new THREE.Color('#b91c1c'), []);
    const jeans = useMemo(() => new THREE.Color('#334155'), []);
    const hud = useMemo(() => new THREE.Color('#e0b98a'), []);
    const tmp = useMemo(() => new THREE.Color(), []);

    useFrame(({ clock }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        const f = forste.current;
        const d = (ref: React.RefObject<number>, mål: number, l = 2) => {
            ref.current = f ? mål : damp(ref.current, mål, l, dt);
        };

        // Mål for hver modus og beat. Alt glir mot målet, så et hopp i filmen tåles.
        const erPapir = modus === 'papir';
        d(tykk, erPapir ? 0.05 : 1, 1.6);
        d(rød, modus === 'overflate' ? (beat >= 2 ? 1 : 0) : erPapir ? 0 : 1, 1.8);
        d(klokkeVis, modus === 'overflate' ? (beat >= 3 ? 1 : 0) : erPapir ? 0 : 1, 2.5);
        d(hetteOpp, modus === 'skygge' ? (beat >= 4 ? 1 : 0) : 0, 1.5);
        d(skyggeVis, modus === 'skygge' ? (beat >= 3 ? 0.85 : beat >= 2 ? 0.55 : 0) : 0, 1.4);
        d(mørkt, modus === 'skygge' ? 1 : 0, 1.2);
        d(saraInn, modus === 'sara' && beat >= 1 ? 1 : 0, 1.8);
        d(gnistMellom, modus === 'sara' && beat >= 3 ? 1 : 0, 2);
        d(krymp, modus === 'skygge' && beat >= 1 ? 0.9 : 1, 1.5);
        d(gnistEsse, modus === 'skygge' ? 0.3 : 1, 1.5);

        // Elias: tykkelse og farger
        if (eliasGruppe.current) eliasGruppe.current.scale.set(1, krymp.current, tykk.current);
        const grunn = tmp.copy(papir).lerp(skisse, erPapir ? 0 : 1);
        elias.kropp.color.copy(grunn).lerp(hettegenser, rød.current);
        elias.bein.color.copy(grunn).lerp(jeans, rød.current);
        elias.hud.color.copy(papir).lerp(hud, erPapir ? 0 : 1);

        if (hette.current) {
            // Hetta henger bak nakken, og trekkes opp over hodet i skygge-modus.
            const h = hetteOpp.current;
            hette.current.position.set(0, 1.47 + h * 0.23, -0.2 + h * 0.17);
            hette.current.rotation.x = -Math.PI / 2 + h * 1.2;
            hette.current.scale.setScalar(0.95 + h * 0.27);
            hette.current.visible = rød.current > 0.05;
        }
        if (klokke.current) {
            klokke.current.visible = klokkeVis.current > 0.05;
            klokke.current.scale.setScalar(Math.max(0.01, klokkeVis.current * 1.3));
        }
        if (klokkeRing.current) {
            klokkeRing.current.visible = modus === 'overflate' && beat === 3;
            klokkeRing.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.1);
        }
        if (skygge.current) {
            skyggeMat.setValues({ opacity: skyggeVis.current });
            skygge.current.visible = skyggeVis.current > 0.02;
            const s = 1.2 + skyggeVis.current * 0.5;
            skygge.current.scale.set(s, s, s * 0.6);
        }
        if (saraGruppe.current) {
            saraGruppe.current.visible = saraInn.current > 0.02;
            saraGruppe.current.position.x = 2.2 + (1 - saraInn.current) * 2.5;
            saraGruppe.current.position.y = 1;
        }

        if (esseLys.current) {
            esseLys.current.intensity =
                (7 + Math.sin(clock.elapsedTime * 7) * 0.8) * (1 - mørkt.current * 0.45);
        }
        if (romLys.current) romLys.current.intensity = 0.75 - mørkt.current * 0.3;

        const mål = kameraFor(modus, beat, t);
        const k = f ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
    });

    return (
        <>
            <color attach="background" args={['#2a1d16']} />
            <fog attach="fog" args={['#2a1d16', 9, 26]} />
            <ambientLight ref={romLys} intensity={0.75} color="#fde7cf" />
            <hemisphereLight args={['#fed7aa', '#3b2a1f', 0.6]} />
            <directionalLight position={[4, 8, 6]} intensity={1.1} color="#fff1e0" />
            <pointLight
                ref={esseLys}
                position={[-3.2, 2, -1.4]}
                intensity={7}
                distance={9}
                color="#fb923c"
            />
            <Verksted />
            <Gnister
                playing={playing}
                senter={[-3.4, 1.3, -2.2]}
                spredning={1.2}
                antall={40}
                synlig={gnistEsse}
            />
            <Gnister
                playing={playing}
                senter={[1.1, 1.9, 0.2]}
                spredning={0.9}
                antall={36}
                synlig={gnistMellom}
            />

            {/* Elias står på benken */}
            <group position={[0, 1, 0]}>
                <Figur gruppe={eliasGruppe} mat={elias}>
                    <mesh ref={hette} material={elias.kropp}>
                        <sphereGeometry args={[0.22, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
                    </mesh>
                    <group ref={klokke} position={[-0.41, 0.86, 0.09]}>
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.075, 0.075, 0.04, 16]} />
                            <meshStandardMaterial color="#d4a017" metalness={0.5} />
                        </mesh>
                        <mesh position={[0, 0, 0.022]}>
                            <circleGeometry args={[0.06, 16]} />
                            <meshBasicMaterial color="#fefce8" />
                        </mesh>
                        {/* Viserne står stille */}
                        <mesh position={[0, 0.02, 0.026]}>
                            <boxGeometry args={[0.008, 0.045, 0.004]} />
                            <meshBasicMaterial color="#111827" />
                        </mesh>
                        <mesh position={[0.015, -0.005, 0.026]} rotation={[0, 0, -1.1]}>
                            <boxGeometry args={[0.008, 0.035, 0.004]} />
                            <meshBasicMaterial color="#111827" />
                        </mesh>
                    </group>
                </Figur>
                <mesh ref={klokkeRing} position={[-0.41, 0.86, 0.16]} visible={false}>
                    <ringGeometry args={[0.11, 0.135, 28]} />
                    <meshBasicMaterial color="#facc15" toneMapped={false} />
                </mesh>
                {/* Skyggen bak ham */}
                <group ref={skygge} position={[-0.2, -0.15, -1.1]} visible={false}>
                    <mesh position={[0, 1.15, 0]} material={skyggeMat}>
                        <capsuleGeometry args={[0.3, 0.7, 4, 8]} />
                    </mesh>
                    <mesh position={[0, 1.85, 0]} material={skyggeMat}>
                        <sphereGeometry args={[0.24, 12, 10]} />
                    </mesh>
                    <mesh position={[0, 0.45, 0]} material={skyggeMat}>
                        <capsuleGeometry args={[0.24, 0.5, 4, 8]} />
                    </mesh>
                </group>
            </group>

            {/* Sara kommer inn fra høyre */}
            <group ref={saraGruppe} position={[4.7, 1, 0]} visible={false}>
                <Figur mat={sara} armUt={0.55}>
                    {[-1, 1].map((s) => (
                        <mesh key={s} position={[s * 0.19, 1.54, 0.02]}>
                            <sphereGeometry args={[0.05, 10, 8]} />
                            <meshStandardMaterial
                                color="#22d3ee"
                                emissive="#06b6d4"
                                emissiveIntensity={0.8}
                            />
                        </mesh>
                    ))}
                </Figur>
            </group>
        </>
    );
}

const TEKSTER: Record<Modus, (string | null)[]> = {
    papir: ['En papirfigur', 'Fra siden: bare en strek', 'Ingen navn, ingen fortid', null],
    overflate: [
        'Trinn 2: Overflaten',
        'Velg én eller to ting',
        'Rød hettegenser',
        'En klokke som har stoppet',
        'Kjennetegnet',
    ],
    skygge: [
        'Trinn 4: Skyggen',
        'Feil og sårbarhet',
        'Ghost: et minne fra fortiden',
        'De lo av ham',
        'Redd for å bli ledd av',
    ],
    sara: ['Trinn 5: Kontrasten', 'Sara', 'Høy, tar plass', 'Gnisninger'],
};

export function KarakterSmien({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'papir';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = TEKSTER[modus][Math.min(beat, TEKSTER[modus].length - 1)];
    const visTrinn = modus !== 'papir' || beat >= 3;
    const aktivt = AKTIVT[modus];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 40, near: 0.05, far: 80, position: [0.3, 2.2, 4.2] }}
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
                        className="absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
            {modus === 'skygge' && beat === 3 && (
                <>
                    {[
                        { x: '14%', y: '30%', d: 0 },
                        { x: '70%', y: '24%', d: 0.5 },
                        { x: '22%', y: '58%', d: 1 },
                        { x: '74%', y: '52%', d: 1.5 },
                    ].map((h) => (
                        <motion.div
                            key={h.x}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 0.9, scale: 1 }}
                            transition={{ delay: h.d, type: 'spring', stiffness: 200, damping: 14 }}
                            className="absolute px-4 py-1.5 rounded-2xl bg-slate-900/80 text-white font-black text-3xl"
                            style={{ left: h.x, top: h.y }}
                        >
                            ha ha
                        </motion.div>
                    ))}
                </>
            )}
            {visTrinn && (
                <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 flex gap-2">
                    {TRINN.map((navn, i) => {
                        const ferdig = aktivt >= 0 && i < aktivt;
                        const na = i === aktivt;
                        return (
                            <motion.div
                                key={navn}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0, scale: na ? 1.08 : 1 }}
                                transition={{ delay: modus === 'papir' ? i * 0.35 : 0 }}
                                className={`px-3 py-1.5 rounded-xl font-bold text-lg shadow-lg whitespace-nowrap ${
                                    na
                                        ? 'bg-orange-500 text-white'
                                        : ferdig
                                          ? 'bg-amber-100 text-amber-900'
                                          : 'bg-white/90 text-slate-700'
                                }`}
                            >
                                {i + 1}. {navn}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
