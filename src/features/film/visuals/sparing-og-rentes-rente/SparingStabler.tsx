import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Myntstabler i 3D, i riktig målestokk innenfor hver modus.
 * Fire moduser:
 * - hundre: SNL-eksemplet. 100 kr som 20 mynter (1 mynt = 5 kr) foran banken. Etter ett år
 *   kommer én grønn mynt (5 kr), året etter én til, og en liten gullmynt: de 25 ørene som er
 *   rente på renten.
 * - tiaar: 10 000 kr satt inn én gang (1 mynt = 1000 kr). Fire stabler: start, 10, 20 og
 *   40 år. Grått er innskuddet, grønt er renter. Høyden følger artikkelens tall.
 * - snoball: artikkelens bilde: en snøball som ruller ned en bakke og vokser fortere og fortere.
 * - gjeld: rentes rente den andre veien. En rød gjeldsstabel vokser som sparestabelen, og
 *   betales ned. Skisse uten tall.
 */

type Modus = 'hundre' | 'tiaar' | 'snoball' | 'gjeld';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const GRAA = '#94a3b8';
const GRONN = '#16a34a';
const ROD = '#dc2626';

const OVERSKRIFT: Record<Modus, string[]> = {
    hundre: [
        'Du låner pengene til banken',
        'Banken betaler deg: rente',
        'Etter ett år: 105 kr',
        'Året etter: rente av 105 kr',
        '110,25 kr',
    ],
    tiaar: [
        'Effekten vokser for hvert år',
        '10 000 kr, satt inn én gang',
        'Etter 10 år',
        'Etter 20 år',
        'Etter 40 år',
    ],
    snoball: [
        'Pengene tjener penger',
        'I starten: liten og sakte',
        'Jo lenger, jo fortere',
        'Til slutt gjør rentene mesteparten',
    ],
    gjeld: [
        'Rentes rente virker begge veier',
        'Dyr gjeld vokser på samme måte',
        'Ofte lurt: betal ned dyr gjeld først',
    ],
};

// ---------- Kamera ----------

type Kam = { pos: THREE.Vector3; se: THREE.Vector3 };

function kameraFor(modus: Modus, beat: number, t: number): Kam {
    const sakte = Math.min(t, 12) * 0.05;
    if (modus === 'hundre') {
        if (beat <= 1) return { pos: v(4.2 - sakte, 3.0, 6.8), se: v(-0.4, 1.2, -1.2) };
        return { pos: v(3.4, 2.6 + sakte * 0.5, 5.8), se: v(0.6, 1.2, 0) };
    }
    if (modus === 'tiaar') {
        if (beat <= 1) return { pos: v(-1.5 + sakte, 3.4, 10), se: v(0, 1.4, 0) };
        if (beat <= 3) return { pos: v(0.5, 3.8, 11.5 + sakte), se: v(0.5, 1.8, 0) };
        return { pos: v(1.0, 5.0, 19 + sakte), se: v(-0.6, 3.6, 0) };
    }
    if (modus === 'snoball') {
        if (beat <= 1)
            return { pos: v(-4.5 + sakte * 4, 5.5, 11), se: v(-6.5 + sakte * 4, 2.2, 0) };
        if (beat === 2) return { pos: v(-0.5 + sakte * 4, 3.5, 15), se: v(-1 + sakte * 4, 0.3, 0) };
        return { pos: v(1.5, 1.8, 19), se: v(4, -2.2, 0) };
    }
    return { pos: v(3.0 + sakte, 3.6, 11), se: v(2.6, 2.0, 0) };
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mal = kameraFor(modus, beat, beatTid.current);
        const k = forste.current || !playing ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        se.current.lerp(mal.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

// ---------- Myntstabelen ----------

const MAKS = 80;

/**
 * En stabel mynter. `verdi` er antall mynter (kan ha desimaler: den øverste mynten blir
 * tynnere). Mynt nummer i får fargen fra `farge(i)`. Antallet glir mot målet.
 */
function Stabel({
    pos,
    verdi,
    farge,
    radius,
    playing,
    hoyde = 0.1,
}: {
    pos: [number, number, number];
    verdi: number;
    farge: (i: number) => string;
    radius: number;
    playing: boolean;
    hoyde?: number;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const vist = useRef(0);
    const forste = useRef(true);
    const hjelp = useMemo(() => new THREE.Object3D(), []);
    const farger = useMemo(
        () => Array.from({ length: MAKS }, (_, i) => new THREE.Color(farge(i))),
        [farge]
    );
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const k = forste.current || !playing ? 1 : 1 - Math.exp(-2.2 * Math.min(rawDt, 0.05));
        forste.current = false;
        vist.current += (verdi - vist.current) * k;
        if (Math.abs(verdi - vist.current) < 0.01) vist.current = verdi;
        const n = Math.min(MAKS, Math.ceil(vist.current - 0.001));
        for (let i = 0; i < n; i++) {
            const del = Math.min(1, vist.current - i);
            hjelp.position.set(
                Math.sin(i * 2.3) * 0.03,
                i * hoyde + (hoyde * del) / 2,
                Math.cos(i * 1.7) * 0.03
            );
            hjelp.scale.set(1, Math.max(0.001, del), 1);
            hjelp.updateMatrix();
            m.setMatrixAt(i, hjelp.matrix);
            m.setColorAt(i, farger[i]);
        }
        m.count = Math.max(0, n);
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <group position={pos}>
            <mesh position={[0, -0.03, 0]}>
                <cylinderGeometry args={[radius * 1.35, radius * 1.45, 0.06, 32]} />
                <meshStandardMaterial color="#e2e8f0" flatShading />
            </mesh>
            <instancedMesh ref={ref} args={[undefined, undefined, MAKS]} frustumCulled={false}>
                <cylinderGeometry args={[radius, radius, hoyde * 0.9, 28]} />
                <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.5} />
            </instancedMesh>
        </group>
    );
}

function Merke({
    pos,
    tekst,
    farge = '#0f172a',
}: {
    pos: [number, number, number];
    tekst: string;
    farge?: string;
}) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <div
                className="px-3 py-1 rounded-xl bg-white/95 shadow-lg font-black text-2xl whitespace-nowrap tabular-nums"
                style={{ color: farge }}
            >
                {tekst}
            </div>
        </Html>
    );
}

// ---------- Banken ----------

function Banken() {
    const tak = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-2.2, 0);
        s.lineTo(2.2, 0);
        s.lineTo(0, 1.1);
        s.closePath();
        return s;
    }, []);
    return (
        <group position={[-2.8, 0, -3.2]}>
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[4.4, 0.3, 2.4]} />
                <meshStandardMaterial color="#cbd5e1" flatShading />
            </mesh>
            <mesh position={[0, 1.5, -0.4]}>
                <boxGeometry args={[3.8, 2.4, 1.4]} />
                <meshStandardMaterial color="#f1f5f9" flatShading />
            </mesh>
            {[-1.6, -0.55, 0.55, 1.6].map((x) => (
                <mesh key={x} position={[x, 1.5, 0.7]}>
                    <cylinderGeometry args={[0.16, 0.18, 2.4, 12]} />
                    <meshStandardMaterial color="#e2e8f0" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 2.85, 0.15]}>
                <boxGeometry args={[4.4, 0.3, 2.1]} />
                <meshStandardMaterial color="#cbd5e1" flatShading />
            </mesh>
            <mesh position={[0, 3.0, -0.9]}>
                <extrudeGeometry args={[tak, { depth: 2.1, bevelEnabled: false }]} />
                <meshStandardMaterial color="#94a3b8" flatShading />
            </mesh>
            <mesh position={[0, 1.0, 0.32]}>
                <boxGeometry args={[0.9, 1.6, 0.06]} />
                <meshStandardMaterial color="#334155" flatShading />
            </mesh>
        </group>
    );
}

// ---------- Moduser ----------

const HUNDRE_FARGE = (i: number) => (i < 20 ? GRAA : GRONN);

function Hundre({ beat, playing }: { beat: number; playing: boolean }) {
    const mynter = beat >= 3 ? 22 : beat >= 2 ? 21 : 20;
    const topp = mynter * 0.1;
    const kr =
        beat >= 4 ? '110,25 kr' : beat >= 3 ? '110 kr + 25 øre' : beat >= 2 ? '105 kr' : '100 kr';
    return (
        <group>
            <Banken />
            <Stabel
                pos={[0, 0, 0]}
                verdi={mynter}
                farge={HUNDRE_FARGE}
                radius={0.5}
                playing={playing}
            />
            {beat >= 3 && (
                <mesh position={[0, topp + 0.04, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.05, 24]} />
                    <meshStandardMaterial
                        color="#facc15"
                        emissive="#eab308"
                        emissiveIntensity={beat >= 4 ? 0.9 : 0.4}
                    />
                </mesh>
            )}
            {beat >= 2 && <Merke pos={[-1.5, topp - 0.1, 0.4]} tekst={kr} farge={GRONN} />}
            {beat <= 1 && <Merke pos={[-1.3, 1.0, 0.6]} tekst="100 kr" />}
        </group>
    );
}

const TIAAR = [
    { x: -4.5, verdi: 10, navn: 'Start', tekst: '10 000 kr', fra: 0 },
    { x: -1.5, verdi: 16.3, navn: '10 år', tekst: 'ca. 16 300 kr', fra: 2 },
    { x: 1.5, verdi: 26.5, navn: '20 år', tekst: 'ca. 26 500 kr', fra: 3 },
    { x: 4.5, verdi: 70.4, navn: '40 år', tekst: 'ca. 70 400 kr', fra: 4 },
];
const TIAAR_FARGE = (i: number) => (i < 10 ? GRAA : GRONN);

function Tiaar({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <group>
            {TIAAR.map((s) => (
                <group key={s.navn}>
                    <Stabel
                        pos={[s.x, 0, 0]}
                        verdi={beat >= s.fra ? s.verdi : 0}
                        farge={TIAAR_FARGE}
                        radius={0.55}
                        playing={playing}
                    />
                    <Merke pos={[s.x, -0.55, 1.2]} tekst={s.navn} farge="#475569" />
                    {beat >= s.fra && (beat < 4 || s.fra !== 2) && (
                        <Merke
                            pos={[s.x, s.verdi * 0.1 + 0.55, 0]}
                            tekst={s.tekst}
                            farge={s.fra === 0 ? '#0f172a' : GRONN}
                        />
                    )}
                </group>
            ))}
        </group>
    );
}

const GJELD_SPAR = () => GRONN;
const GJELD_ROD = () => ROD;

function Gjeld({ beat, playing }: { beat: number; playing: boolean }) {
    const rod = beat === 1 ? 42 : beat >= 2 ? 0 : 0;
    return (
        <group>
            <Stabel
                pos={[-2.4, 0, 0]}
                verdi={beat >= 2 ? 14 : 42}
                farge={GJELD_SPAR}
                radius={0.6}
                playing={playing}
            />
            <Stabel
                pos={[2.4, 0, 0]}
                verdi={rod}
                farge={GJELD_ROD}
                radius={0.6}
                playing={playing}
            />
            <Merke pos={[-2.4, -0.55, 1.3]} tekst="Sparing" farge={GRONN} />
            <Merke pos={[2.4, -0.55, 1.3]} tekst="Dyr gjeld" farge={ROD} />
            {beat === 0 && <Merke pos={[2.4, 1.0, 0]} tekst="?" farge={ROD} />}
            {beat >= 2 && <Merke pos={[2.4, 1.0, 0]} tekst="Betalt ned" farge={GRONN} />}
            {beat >= 2 && <Merke pos={[-2.4, 2.1, 0]} tekst="Så spare" farge={GRONN} />}
        </group>
    );
}

// ---------- Snøballen ----------

const HELLING = 0.32;
const bakkeY = (x: number) => -Math.tan(HELLING) * x;
const BALL_S = [0.06, 0.22, 0.6, 1.0];
const ballX = (s: number) => -9 + s * 18;
const ballR = (s: number) => 0.35 + 2.1 * s * s;

function Snoball({ beat, playing }: { beat: number; playing: boolean }) {
    const ball = useRef<THREE.Mesh>(null);
    const s = useRef(BALL_S[0]);
    const vinkel = useRef(0);
    const forste = useRef(true);
    const maal = BALL_S[Math.min(beat, 3)];
    useFrame((_, rawDt) => {
        const b = ball.current;
        if (!b) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const k = forste.current || !playing ? 1 : 1 - Math.exp(-0.9 * dt);
        forste.current = false;
        const for_ = s.current;
        s.current += (maal - s.current) * k;
        const r = ballR(s.current);
        const x = ballX(s.current);
        vinkel.current -= ((s.current - for_) * 18) / r;
        b.position.set(x, bakkeY(x) + r / Math.cos(HELLING), 0);
        b.scale.setScalar(r);
        b.rotation.z = vinkel.current;
    });
    const traer = useMemo(
        () =>
            [-11, -8, -5.5, -2, 1, 3.5, 7, 10, 12].map((x, i) => ({
                x,
                z: -4 - (i % 3) * 1.6,
                h: 1.6 + (i % 2) * 0.8,
            })),
        []
    );
    return (
        <group>
            <group rotation={[0, 0, -HELLING]}>
                <mesh position={[0, -15, 0]}>
                    <boxGeometry args={[70, 30, 24]} />
                    <meshStandardMaterial
                        color="#f8fafc"
                        emissive="#dbeafe"
                        emissiveIntensity={0.35}
                        flatShading
                    />
                </mesh>
            </group>
            {traer.map((t) => (
                <group key={t.x} position={[t.x, bakkeY(t.x), t.z]}>
                    <mesh position={[0, 0.3, 0]}>
                        <cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
                        <meshStandardMaterial color="#78350f" flatShading />
                    </mesh>
                    <mesh position={[0, 0.6 + t.h / 2, 0]}>
                        <coneGeometry args={[0.8, t.h, 8]} />
                        <meshStandardMaterial color="#166534" flatShading />
                    </mesh>
                </group>
            ))}
            <mesh ref={ball}>
                <icosahedronGeometry args={[1, 2]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#e0f2fe"
                    emissiveIntensity={0.3}
                    flatShading
                />
            </mesh>
        </group>
    );
}

// ---------- Scenen ----------

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const snø = modus === 'snoball';
    const himmel = snø ? '#bfdbfe' : '#e0f2fe';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, snø ? 28 : 22, snø ? 60 : 44]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#ffffff', '#cbd5e1', 0.6]} />
            <directionalLight position={[5, 9, 7]} intensity={1.3} />
            {!snø && (
                <mesh position={[0, -0.1, 0]}>
                    <boxGeometry args={[30, 0.1, 20]} />
                    <meshStandardMaterial color="#f1f5f9" />
                </mesh>
            )}
            {modus === 'hundre' && <Hundre beat={beat} playing={playing} />}
            {modus === 'tiaar' && <Tiaar beat={beat} playing={playing} />}
            {modus === 'gjeld' && <Gjeld beat={beat} playing={playing} />}
            {snø && <Snoball beat={beat} playing={playing} />}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

// ---------- DOM over lerretet ----------

function Kort({ linjer, farge = '#0f172a' }: { linjer: string[]; farge?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl bg-white/95 shadow-xl px-5 py-3 text-slate-900"
            style={{ maxWidth: 360 }}
        >
            <div className="text-3xl font-black" style={{ color: farge }}>
                {linjer[0]}
            </div>
            {linjer.slice(1).map((l) => (
                <div key={l} className="text-2xl font-bold text-slate-600">
                    {l}
                </div>
            ))}
        </motion.div>
    );
}

function overlegg(modus: Modus, beat: number): { linjer: string[]; farge?: string } | null {
    if (modus === 'hundre') {
        if (beat === 0) return { linjer: ['Banken', 'bruker pengene dine'] };
        if (beat === 1)
            return { linjer: ['Rente', 'betaling for å la banken bruke pengene'], farge: GRONN };
        if (beat === 2) return { linjer: ['+ 5 kr', '5 prosent av 100 kr'], farge: GRONN };
        if (beat === 3) return { linjer: ['Rente av 105 kr', 'ikke av 100 kr'], farge: GRONN };
        return { linjer: ['25 øre', 'rente på renten fra året før'], farge: '#a16207' };
    }
    if (modus === 'tiaar') {
        if (beat === 0) return { linjer: ['5 prosent i året', 'hvert år'], farge: GRONN };
        if (beat === 4) return { linjer: ['Ingen nye innskudd', 'bare renter'], farge: GRONN };
        return null;
    }
    if (modus === 'snoball') {
        if (beat === 0) return { linjer: ['Så tjener de', 'pengene også penger'], farge: GRONN };
        if (beat === 2) return { linjer: ['Mer snø fester seg', 'jo lenger den ruller'] };
        if (beat === 3)
            return { linjer: ['De siste årene', 'gjør rentene mest av jobben'], farge: GRONN };
        return null;
    }
    if (beat === 1)
        return { linjer: ['Gjeld med høy rente', 'vokser som sparepenger'], farge: ROD };
    return null;
}

export function SparingStabler({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'hundre';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    const kort = overlegg(modus, beat);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [4, 3, 7] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '4%' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            {kort && (
                <div
                    className="absolute pointer-events-none"
                    style={
                        modus === 'tiaar' || (modus === 'snoball' && beat >= 2)
                            ? { left: '4%', top: '22%' }
                            : { right: '4%', top: '22%' }
                    }
                >
                    <AnimatePresence mode="wait">
                        <motion.div key={`${modus}-${beat}`} exit={{ opacity: 0 }}>
                            <Kort linjer={kort.linjer} farge={kort.farge} />
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}
            {(modus === 'tiaar' || modus === 'hundre') && (
                <div
                    className="absolute pointer-events-none flex gap-4 text-2xl font-bold text-slate-700"
                    style={{ left: '3%', bottom: '4%' }}
                >
                    <span className="px-3 py-1 rounded-xl bg-white/90">
                        {modus === 'hundre' ? '1 mynt = 5 kr' : '1 mynt = 1000 kr'}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-white/90">
                        <span style={{ color: GRAA }}>■</span> satt inn{' '}
                        <span style={{ color: GRONN }}>■</span> renter
                    </span>
                </div>
            )}
            {modus === 'gjeld' && (
                <div
                    className="absolute pointer-events-none text-xl font-bold text-slate-600"
                    style={{ right: '3%', bottom: '4%' }}
                >
                    Skisse: ingen ekte tall
                </div>
            )}
        </div>
    );
}
