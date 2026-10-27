import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Krigen til sjøs i 3D. Ingen mennesker, bare skip.
 * - blokade: britiske krigsskip stenger de tyske havnene, så kommer ubåtene og senker
 *   lasteskip på vei til Storbritannia, til slutt også skip fra nøytrale land.
 * - usa: et amerikansk skip senkes, telegrammet til Mexico, og en konvoi fra USA
 *   krysser havet.
 */

type Modus = 'blokade' | 'usa';
type Slag = 'krig' | 'last' | 'noytral' | 'usa' | 'ubat';

interface Tilstand {
    x: number;
    z: number;
    /** 0 = flyter, 1 = senket. */
    synk: number;
    synlig: boolean;
    kurs: number;
}

interface Skip {
    slag: Slag;
    tilstand: (beat: number, t: number) => Tilstand;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Tyskland ligger til venstre (−x), Storbritannia langt til høyre (+x). */
const LINJE_X = -14;

function blokadeSkip(): Skip[] {
    const ut: Skip[] = [];
    // Fem britiske krigsskip som legger seg i en linje foran havnene.
    for (let i = 0; i < 5; i++) {
        const z = -16 + i * 8;
        ut.push({
            slag: 'krig',
            tilstand: (beat) => ({
                x: beat === 0 ? 4 + (i % 2) * 7 : LINJE_X,
                z: beat === 0 ? z * 0.6 + 4 : z,
                synk: 0,
                synlig: beat <= 1 || beat === 4,
                kurs: beat === 0 ? 0.3 : Math.PI / 2,
            }),
        });
    }
    // To lasteskip som blir stoppet ved linja.
    for (let i = 0; i < 2; i++) {
        ut.push({
            slag: 'noytral',
            tilstand: (beat, t) => ({
                x: beat === 1 ? Math.max(LINJE_X + 7, 6 - t * 1.2) : 14,
                z: -6 + i * 12,
                synk: 0,
                synlig: beat === 1,
                kurs: Math.PI,
            }),
        });
    }
    // Lasteskip på vei mot Storbritannia. Ubåten senker ett i 1916, alle fra 1917.
    for (let i = 0; i < 4; i++) {
        const noytral = i >= 2;
        ut.push({
            slag: noytral ? 'noytral' : 'last',
            tilstand: (beat, t) => {
                const synk = beat === 2 ? (i === 0 ? Math.min(1, Math.max(0, (t - 2.5) / 4)) : 0) : beat >= 3 ? (i === 0 ? 1 : Math.min(1, Math.max(0, (t - 1.5 - i) / 4))) : 0;
                return {
                    x: 26 + i * 7 + (beat === 2 ? t * 0.5 : 0),
                    z: -10 + i * 6,
                    synk,
                    synlig: beat >= 2 && beat <= 3 && (!noytral || beat === 3),
                    kurs: 0,
                };
            },
        });
    }
    ut.push({
        slag: 'ubat',
        tilstand: (beat) => ({ x: 34, z: 8, synk: 0, synlig: beat >= 2 && beat <= 3, kurs: -Math.PI / 2 }),
    });
    return ut;
}

function usaSkip(): Skip[] {
    const ut: Skip[] = [];
    ut.push({
        slag: 'usa',
        tilstand: (beat, t) => ({ x: 4, z: 0, synk: beat === 0 ? Math.min(0.8, Math.max(0, (t - 3) / 8)) : 1, synlig: beat <= 1, kurs: 0 }),
    });
    ut.push({
        slag: 'ubat',
        tilstand: (beat) => ({ x: 13, z: -7, synk: 0, synlig: beat === 0, kurs: -Math.PI / 2 }),
    });
    // Konvoien: flere skip for hver beat fra krigserklæringen.
    for (let i = 0; i < 8; i++) {
        const rad = i % 2;
        const kol = Math.floor(i / 2);
        ut.push({
            slag: 'usa',
            tilstand: (beat, t) => ({
                x: -26 + kol * 9 + (beat >= 2 ? t * 0.9 : 0),
                z: -6 + rad * 10,
                synk: 0,
                synlig: beat >= 3 || (beat === 2 && i < 4),
                kurs: 0,
            }),
        });
    }
    return ut;
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'blokade') {
        switch (beat) {
            case 0:
                return { pos: v(28 - t * 0.6, 9, 24), se: v(4, 0, 0) };
            case 1:
                return { pos: v(10, 16, 30), se: v(-14, 0, 0) };
            case 2:
                return { pos: v(16, 9, 26), se: v(32, 0, 0) };
            case 3:
                return { pos: v(18 - t * 0.3, 14, 30), se: v(34, 0, -2) };
            default:
                return { pos: v(8, 46, 46), se: v(10, 0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(11, 4.5, 10), se: v(4, 0.5, 0) };
        case 1:
            return { pos: v(-4, 10, 22), se: v(0, 0, 0) };
        case 2:
            return { pos: v(-6, 12, 28), se: v(-14, 0, 0) };
        default:
            return { pos: v(-2 + t * 0.4, 18, 34), se: v(-6, 0, 0) };
    }
}

const FARGER: Record<Slag, { skrog: string; over: string }> = {
    krig: { skrog: '#475569', over: '#64748b' },
    last: { skrog: '#7c2d12', over: '#e7e5e4' },
    noytral: { skrog: '#f5f5f4', over: '#fbbf24' },
    usa: { skrog: '#1e3a8a', over: '#e2e8f0' },
    ubat: { skrog: '#1f2937', over: '#1f2937' },
};

function SkipModell({ skip, beat, playing }: { skip: Skip; beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    useFrame((_, raw) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = skip.tilstand(beat, beatTid.current);
        const hopp = forste.current;
        forste.current = false;
        const k = (a: number, b: number, l = 1.4) => (hopp ? b : damp(a, b, l, dt));
        g.position.x = k(g.position.x, m.x);
        g.position.z = k(g.position.z, m.z);
        const yMål = skip.slag === 'ubat' ? -0.35 : -m.synk * 4;
        g.position.y = k(g.position.y, yMål, 1);
        g.rotation.z = k(g.rotation.z, m.synk * 0.5, 1);
        g.rotation.y = k(g.rotation.y, m.kurs, 1.2);
        const s = m.synlig ? 1 : 0.001;
        const sk = k(g.scale.x, s, 3);
        g.scale.setScalar(sk);
        g.visible = sk > 0.01;
    });
    const f = FARGER[skip.slag];
    if (skip.slag === 'ubat') {
        return (
            <group ref={ref}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <capsuleGeometry args={[0.55, 6, 4, 10]} />
                    <meshLambertMaterial color={f.skrog} />
                </mesh>
                <mesh position={[0.4, 0.9, 0]}>
                    <boxGeometry args={[1.4, 1.1, 0.7]} />
                    <meshLambertMaterial color={f.over} />
                </mesh>
                <mesh position={[0.6, 2.0, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, 1.4, 6]} />
                    <meshLambertMaterial color="#111827" />
                </mesh>
            </group>
        );
    }
    const krig = skip.slag === 'krig';
    const lang = krig ? 8 : 6.5;
    return (
        <group ref={ref}>
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[lang, 1.2, 1.7]} />
                <meshLambertMaterial color={f.skrog} />
            </mesh>
            <mesh position={[lang / 2, 0.4, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[1.2, 1.2, 1.2]} />
                <meshLambertMaterial color={f.skrog} />
            </mesh>
            <mesh position={[krig ? 0.5 : -1.8, 1.5, 0]}>
                <boxGeometry args={[krig ? 2.6 : 1.8, 1.2, 1.3]} />
                <meshLambertMaterial color={f.over} />
            </mesh>
            <mesh position={[krig ? -0.4 : -1.8, 2.6, 0]}>
                <cylinderGeometry args={[0.3, 0.35, 1.4, 8]} />
                <meshLambertMaterial color={krig ? '#334155' : '#1c1917'} />
            </mesh>
            {krig && (
                <>
                    <mesh position={[2.6, 1.15, 0]}>
                        <boxGeometry args={[1, 0.5, 0.9]} />
                        <meshLambertMaterial color="#334155" />
                    </mesh>
                    <mesh position={[3.5, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.1, 0.1, 1.6, 6]} />
                        <meshLambertMaterial color="#1e293b" />
                    </mesh>
                    <mesh position={[-2.6, 1.15, 0]}>
                        <boxGeometry args={[1, 0.5, 0.9]} />
                        <meshLambertMaterial color="#334155" />
                    </mesh>
                </>
            )}
            {skip.slag === 'usa' && (
                <mesh position={[-3, 2.4, 0]}>
                    <boxGeometry args={[0.05, 0.6, 1]} />
                    <meshLambertMaterial color="#dc2626" />
                </mesh>
            )}
        </group>
    );
}

function Ring({ x, z, vis }: { x: number; z: number; vis: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        const m = ref.current;
        if (!m) return;
        const s = 3 + (clock.elapsedTime % 1.6) * 2;
        m.scale.set(s, s, 1);
        m.visible = vis;
    });
    return (
        <mesh ref={ref} position={[x, 0.12, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1, 32]} />
            <meshBasicMaterial color="#dc2626" transparent opacity={0.8} />
        </mesh>
    );
}

function Kyst({ modus }: { modus: Modus }) {
    if (modus === 'usa') {
        return (
            <mesh position={[-60, 0.6, 0]}>
                <boxGeometry args={[30, 1.6, 80]} />
                <meshLambertMaterial color="#a3a37a" />
            </mesh>
        );
    }
    return (
        <group>
            {/* Tysk kyst med havn */}
            <mesh position={[-34, 0.6, 0]}>
                <boxGeometry args={[24, 1.6, 70]} />
                <meshLambertMaterial color="#b5a98a" />
            </mesh>
            {[-12, -6, 0, 6, 12].map((z, i) => (
                <mesh key={z} position={[-23.5 - (i % 2), 2, z]}>
                    <boxGeometry args={[2, 1.4 + (i % 3) * 0.8, 3]} />
                    <meshLambertMaterial color="#9a3412" />
                </mesh>
            ))}
            <mesh position={[-20.5, 0.3, -2]}>
                <boxGeometry args={[4, 0.4, 1]} />
                <meshLambertMaterial color="#57534e" />
            </mesh>
            {/* Storbritannia langt i øst */}
            <mesh position={[74, 0.6, 0]}>
                <boxGeometry args={[24, 1.6, 70]} />
                <meshLambertMaterial color="#8fae7a" />
            </mesh>
        </group>
    );
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const pos = useRef(new THREE.Vector3());
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        pos.current.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.position.copy(pos.current);
        camera.lookAt(se.current);
    });
    return null;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const skip = useMemo(() => (modus === 'blokade' ? blokadeSkip() : usaSkip()), [modus]);
    return (
        <>
            <color attach="background" args={['#b9c7d3']} />
            <fog attach="fog" args={['#b9c7d3', 40, 140]} />
            <hemisphereLight args={['#e2e8f0', '#475569', 1.1]} />
            <directionalLight position={[20, 30, 10]} intensity={1.2} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[400, 400]} />
                <meshLambertMaterial color="#3f6680" emissive="#1e3a4c" emissiveIntensity={0.5} />
            </mesh>
            <Kyst modus={modus} />
            {skip.map((s, i) => (
                <SkipModell key={`${modus}-${i}`} skip={s} beat={beat} playing={playing} />
            ))}
            {modus === 'blokade' && (
                <>
                    <Ring x={26} z={-10} vis={beat === 2} />
                    <Ring x={40} z={2} vis={beat === 3} />
                    <Ring x={47} z={8} vis={beat === 3} />
                </>
            )}
            {modus === 'usa' && <Ring x={4} z={0} vis={beat === 0} />}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

const KORT: Record<Modus, { tittel: string; tekst?: string }[]> = {
    blokade: [
        { tittel: 'Britisk marine', tekst: 'sterkest på havet' },
        { tittel: 'Blokade', tekst: 'tyske havner stenges: lite mat' },
        { tittel: 'Tyske ubåter', tekst: 'senker skip til Storbritannia' },
        { tittel: '1917: uinnskrenket ubåtkrig', tekst: 'alle skip, også fra nøytrale land' },
        { tittel: 'Et sjansespill' },
    ],
    usa: [
        { tittel: 'Amerikanske skip senkes' },
        { tittel: 'Zimmermann-telegrammet' },
        { tittel: 'April 1917', tekst: 'USA erklærer krig mot Tyskland' },
        { tittel: 'Verdens største industrimakt', tekst: 'nå på de alliertes side' },
    ],
};

export function KrigensLopHav({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus;
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [20, 10, 30] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${kort.tittel}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute rounded-2xl bg-white/95 px-6 py-3 shadow-xl"
                    style={{ top: '5%', left: '3%' }}
                >
                    <div className="text-3xl font-black text-slate-900 whitespace-nowrap">{kort.tittel}</div>
                    {kort.tekst && <div className="text-xl font-bold text-slate-600 mt-0.5 whitespace-nowrap">{kort.tekst}</div>}
                </motion.div>
            </AnimatePresence>
            {modus === 'blokade' && beat === 1 && <Stedsnavn tekst="Tyske havner" x="12%" y="60%" />}
            {modus === 'blokade' && beat === 4 && (
                <>
                    <Stedsnavn tekst="Tyskland" x="10%" y="58%" />
                    <Stedsnavn tekst="Storbritannia" x="84%" y="44%" />
                </>
            )}
            {modus === 'usa' && beat >= 2 && <Stedsnavn tekst="fra USA" x="12%" y="62%" />}
            {modus === 'blokade' && beat === 3 && <Stedsnavn tekst="hvite skip: fra nøytrale land" x="62%" y="72%" />}
            {modus === 'usa' && beat === 0 && <Stedsnavn tekst="amerikansk skip" x="50%" y="66%" />}
            <AnimatePresence>{modus === 'usa' && beat === 1 && <Telegram />}</AnimatePresence>
        </div>
    );
}

function Stedsnavn({ tekst, x, y }: { tekst: string; x: string; y: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute -translate-x-1/2 rounded-xl bg-white/90 px-4 py-1 text-2xl font-black text-slate-800 shadow"
            style={{ left: x, top: y }}
        >
            {tekst}
        </motion.div>
    );
}

function Telegram() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40, rotate: -6 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="absolute left-1/2 -translate-x-1/2 rounded-md shadow-2xl"
            style={{ top: '30%', width: 560, background: '#fef3c7', border: '3px solid #92400e', padding: '22px 30px' }}
        >
            <div className="text-lg font-black tracking-widest text-amber-900">TELEGRAM · HEMMELIG</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Fra: Tyskland</div>
            <div className="text-2xl font-bold text-slate-900">Til: Mexico</div>
            <div className="mt-3 text-2xl font-black text-red-700">Ber Mexico angripe USA</div>
            <motion.div
                initial={{ opacity: 0, scale: 1.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.2, duration: 0.4 }}
                className="absolute rounded-lg px-3 py-1 text-xl font-black text-blue-800"
                style={{ right: -24, top: -22, background: '#eff6ff', border: '4px solid #1e40af', transform: 'rotate(8deg)' }}
            >
                SNAPPET OPP AV BRITENE
            </motion.div>
        </motion.div>
    );
}
