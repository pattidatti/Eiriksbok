import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, useKamera, v } from './felles3d';

/**
 * FN-salen, bygd av enkle former. Bak: 51 pulter i tre buer, ett land hver, med en lampe
 * som viser stemmen. Foran: bordet til Sikkerhetsrådet med fem store stoler.
 * Modus «generalforsamling»: pultene kommer, alle lampene lyser likt (én stemme hver),
 * så tennes lyset på det lille bordet foran. Modus «sikkerhetsrad»: de fem stolene,
 * vetoet (ett rødt lys gjør hele salen rød), og fem nøkler over stolene.
 */

type Modus = 'generalforsamling' | 'sikkerhetsrad';

const ANTALL = 51;
const PULTER = Array.from({ length: ANTALL }, (_, i) => {
    const rad = Math.floor(i / 17);
    const k = i % 17;
    const r = 10 + rad * 2.6;
    const a = THREE.MathUtils.degToRad(-72 + (k / 16) * 144);
    return { x: Math.sin(a) * r, z: -Math.cos(a) * r, y: rad * 0.7, rot: -a, rekkefolge: k * 3 + rad };
});

const FEM = [
    { navn: 'USA', farge: '#2563eb' },
    { navn: 'Sovjetunionen', farge: '#dc2626' },
    { navn: 'Storbritannia', farge: '#7c3aed' },
    { navn: 'Frankrike', farge: '#0891b2' },
    { navn: 'Kina', farge: '#ca8a04' },
];
const STOLER = FEM.map((_, i) => {
    const a = THREE.MathUtils.degToRad(-56 + i * 28);
    return { x: Math.sin(a) * 3.6, z: -Math.cos(a) * 3.6 + 1, rot: -a };
});
/** Stolen som sier nei i vetoscenen. Hvilken som helst av de fem kunne gjort det. */
const NEI = 2;

const GRA = new THREE.Color('#64748b');
const GRONN = new THREE.Color('#22c55e');
const ROD = new THREE.Color('#ef4444');
const GUL = new THREE.Color('#facc15');

function kameraFor(modus: Modus) {
    return (beat: number, t: number) => {
        if (modus === 'generalforsamling') {
            switch (beat) {
                case 0:
                    return { pos: v(-6 + t * 0.5, 15, 24), se: v(0, 1, -8) };
                case 1:
                    return { pos: v(2.5, 4.2, 13 - t * 0.15), se: v(0, 2, -4) };
                case 2:
                    return { pos: v(-18 + t * 0.4, 11, 10), se: v(0, 1, -9) };
                default:
                    return { pos: v(4, 7, 12 - t * 0.2), se: v(0, 0.8, 0.5) };
            }
        }
        switch (beat) {
            case 0:
                return { pos: v(0, 6, 10 - t * 0.15), se: v(0, 1.2, -1.5) };
            case 1:
                return { pos: v(0, 17, 17), se: v(0, 0, -6) };
            case 2:
                return { pos: v(14 - t * 0.3, 13, 15), se: v(0, 0.5, -7) };
            case 3:
                return { pos: v(-3 + t * 0.3, 4.6, 8), se: v(0, 1.5, -1.5) };
            default:
                return { pos: v(0, 5.2, 8.5), se: v(0, 3.2, -1.5) };
        }
    };
}

/** Fargen på lampa på pult i, gitt beat og tid i beaten. */
function lampe(modus: Modus, beat: number, t: number, i: number, ut: THREE.Color) {
    const p = PULTER[i];
    if (modus === 'generalforsamling') {
        if (beat === 2) return ut.copy(t * 18 > p.rekkefolge ? GRONN : GRA);
        if (beat === 3) return ut.copy(GRONN).lerp(GRA, Math.min(1, t / 2));
        return ut.copy(GRA);
    }
    if (beat === 1) {
        if (t > 2.4) return ut.copy(ROD);
        return ut.copy(t * 40 > p.rekkefolge ? GRONN : GRA);
    }
    if (beat === 2) return ut.copy(GUL).multiplyScalar(0.7 + 0.3 * Math.sin(t * 3 + i * 0.3));
    return ut.copy(GRA);
}

function Pulter({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const pult = useRef<THREE.InstancedMesh>(null);
    const lys = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const o = useMemo(() => new THREE.Object3D(), []);
    const c = useMemo(() => new THREE.Color(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const t = tid.current;
        const m = pult.current;
        const l = lys.current;
        if (!m || !l) return;
        PULTER.forEach((p, i) => {
            // I generalforsamlingen kommer pultene inn én etter én på beat 0.
            const inn =
                modus === 'generalforsamling' && beat === 0
                    ? Math.min(1, Math.max(0, (t * 16 - p.rekkefolge) / 4))
                    : 1;
            o.position.set(p.x, p.y + 0.45 * inn, p.z);
            o.rotation.set(0, p.rot, 0);
            o.scale.set(1.3, 0.9 * Math.max(inn, 0.001), 0.8);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            o.position.set(p.x, p.y + 1.05 * inn, p.z);
            o.scale.setScalar(Math.max(inn, 0.001));
            o.updateMatrix();
            l.setMatrixAt(i, o.matrix);
            l.setColorAt(i, lampe(modus, beat, t, i, c));
        });
        m.instanceMatrix.needsUpdate = true;
        l.instanceMatrix.needsUpdate = true;
        if (l.instanceColor) l.instanceColor.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={pult} args={[undefined, undefined, ANTALL]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#c7a678" flatShading />
            </instancedMesh>
            <instancedMesh ref={lys} args={[undefined, undefined, ANTALL]}>
                <sphereGeometry args={[0.28, 10, 8]} />
                <meshBasicMaterial toneMapped={false} />
            </instancedMesh>
        </>
    );
}

function Radet({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const gruppe = useRef<THREE.Group>(null);
    const stoler = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const nokler = useRef<(THREE.Group | null)[]>([]);
    const bord = useRef<THREE.MeshStandardMaterial>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const d = dt || 0.016;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const t = tid.current;
        const synlig = modus === 'sikkerhetsrad' || beat >= 3;
        const g = gruppe.current;
        if (g) {
            const s = damp(g.scale.y, synlig ? 1 : 0.001, 3, d);
            g.scale.set(1, s, 1);
            g.visible = s > 0.01;
        }
        if (bord.current) {
            const glød = modus === 'generalforsamling' && beat >= 3 ? 0.6 : 0.08;
            bord.current.emissiveIntensity = damp(bord.current.emissiveIntensity, glød, 2, d);
        }
        stoler.current.forEach((mat, i) => {
            if (!mat) return;
            let mål = 0.15;
            if (modus === 'sikkerhetsrad') {
                if (beat === 0) mål = t * 1.4 > i ? 0.7 : 0.1;
                else if (beat === 1) mål = i === NEI && t > 1.8 ? 1.2 : 0.3;
                else if (beat >= 3) mål = 0.9;
                else mål = 0.4;
            }
            mat.emissiveIntensity = damp(mat.emissiveIntensity, mål, 3, d);
            if (modus === 'sikkerhetsrad' && beat === 1 && i === NEI && t > 1.8) mat.emissive.copy(ROD);
            else mat.emissive.set(FEM[i].farge);
        });
        nokler.current.forEach((n, i) => {
            if (!n) return;
            const vis = modus === 'sikkerhetsrad' && beat >= 4 ? 1 : 0;
            const s = damp(n.scale.x, vis ? 1 : 0.001, 3, d);
            n.scale.setScalar(s);
            n.visible = s > 0.02;
            n.rotation.y += dt * 1.2;
            n.position.y = 3.6 + Math.sin(t * 2 + i) * 0.15;
        });
    });
    return (
        <group ref={gruppe}>
            <mesh position={[0, 0.5, 1]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.2, 3, 32, 1, Math.PI * 0.1, Math.PI * 0.8]} />
                <meshStandardMaterial
                    ref={bord}
                    color="#f8fafc"
                    emissive="#bae6fd"
                    emissiveIntensity={0.08}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {STOLER.map((s, i) => (
                <group key={i} position={[s.x, 0, s.z]} rotation={[0, s.rot, 0]}>
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[0.9, 0.2, 0.9]} />
                        <meshStandardMaterial color="#334155" />
                    </mesh>
                    <mesh position={[0, 1.3, -0.45]}>
                        <boxGeometry args={[0.95, 1.8, 0.2]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                stoler.current[i] = m;
                            }}
                            color={FEM[i].farge}
                            emissive={FEM[i].farge}
                            emissiveIntensity={0.15}
                        />
                    </mesh>
                    <group
                        ref={(g) => {
                            nokler.current[i] = g;
                        }}
                        position={[0, 3.6, -0.2]}
                        scale={0.001}
                    >
                        <mesh position={[0, 0.45, 0]}>
                            <torusGeometry args={[0.3, 0.09, 8, 16]} />
                            <meshStandardMaterial color="#fbbf24" emissive="#b45309" emissiveIntensity={0.5} metalness={0.6} />
                        </mesh>
                        <mesh position={[0, -0.2, 0]}>
                            <boxGeometry args={[0.12, 0.9, 0.12]} />
                            <meshStandardMaterial color="#fbbf24" emissive="#b45309" emissiveIntensity={0.5} metalness={0.6} />
                        </mesh>
                        <mesh position={[0.14, -0.5, 0]}>
                            <boxGeometry args={[0.2, 0.12, 0.12]} />
                            <meshStandardMaterial color="#fbbf24" emissive="#b45309" emissiveIntensity={0.5} metalness={0.6} />
                        </mesh>
                    </group>
                </group>
            ))}
        </group>
    );
}

/** Talerstolen med FN-flagget, foran de andre. */
function Talerstol({ synlig }: { synlig: boolean }) {
    return (
        <group position={[0, 0, 6]} visible={synlig}>
            <mesh position={[0, 0.7, 0]}>
                <boxGeometry args={[1.4, 1.4, 0.8]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            <mesh position={[-1.4, 1.8, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 3.6, 6]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[-0.75, 3.05, 0]}>
                <boxGeometry args={[1.3, 0.85, 0.04]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[-0.75, 3.05, 0.03]}>
                <circleGeometry args={[0.25, 20]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const mål = useMemo(() => kameraFor(modus), [modus]);
    useKamera(mål, beat, playing);
    return (
        <>
            <color attach="background" args={['#1e2b4a']} />
            <fog attach="fog" args={['#1e2b4a', 30, 70]} />
            <ambientLight intensity={0.7} />
            <hemisphereLight args={['#dbeafe', '#1e293b', 0.6]} />
            <directionalLight position={[8, 20, 14]} intensity={1.4} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}>
                <circleGeometry args={[24, 48]} />
                <meshStandardMaterial color="#2f4a7a" roughness={1} />
            </mesh>
            <Pulter modus={modus} beat={beat} playing={playing} />
            <Radet modus={modus} beat={beat} playing={playing} />
            <Talerstol synlig={modus === 'generalforsamling' && beat <= 1} />
        </>
    );
}

export function VerdenSalen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'generalforsamling';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const gf = modus === 'generalforsamling';
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 45, near: 0.3, far: 200, position: [0, 15, 24] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {gf && beat === 0 && <Merkelapp key="g0" tekst="San Francisco, 1945: 51 land" />}
                {gf && beat === 1 && <Merkelapp key="g1" tekst="Snakke i stedet for å skyte" />}
                {gf && beat === 2 && <Merkelapp key="g2" tekst="Ett land = én stemme" />}
                {gf && beat === 3 && <Merkelapp key="g3" tekst="Men den virkelige makten?" />}
                {!gf && beat === 1 && <Merkelapp key="s1" tekst="Ett nei = saken stoppes" farge="rod" forsinkelse={2.4} />}
                {!gf && beat === 2 && <Merkelapp key="s2" tekst="Vedtakene må alle land følge" />}
                {!gf && beat === 3 && <Merkelapp key="s3" tekst="De allierte som vant krigen" />}
                {!gf && beat === 4 && <Merkelapp key="s4" tekst="Nøklene til fredens hus" />}
            </AnimatePresence>
            {!gf && (
                <div className="absolute bottom-[5%] inset-x-0 flex justify-center gap-2 md:gap-3 px-4 flex-wrap">
                    {FEM.map((f, i) => (
                        <motion.div
                            key={f.navn}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.7 }}
                            className="px-3 md:px-4 py-1.5 rounded-xl bg-white/95 shadow-lg font-bold text-lg md:text-2xl"
                            style={{ color: f.farge, borderBottom: `4px solid ${f.farge}` }}
                        >
                            {f.navn}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Merkelapp({
    tekst,
    farge,
    forsinkelse = 0,
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
                farge === 'rod' ? 'bg-red-600 text-white' : 'bg-white/90 text-slate-900'
            }`}
        >
            {tekst}
        </motion.div>
    );
}
