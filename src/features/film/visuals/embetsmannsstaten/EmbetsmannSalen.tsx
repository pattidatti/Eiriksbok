import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { BONDE, EMBETSMANN } from './farger';

/**
 * Stortingssalen i Christiania, bygd av enkle former. Fire rader med benker i en halvsirkel,
 * og regjeringsbenken foran til høyre. Hver plass får en figur i bondefarge eller
 * embetsmannsfarge. Tre scener: valget (1830 mot 1833), regjeringen (bøndene vinner salen,
 * men kongen velger regjeringen) og slutten (1884, regjeringen må ha Stortinget med seg).
 */

type Modus = 'valg' | 'regjering' | 'slutt';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const RADER = [
    { r: 7, n: 14, y: 0.3 },
    { r: 9.2, n: 18, y: 0.8 },
    { r: 11.4, n: 22, y: 1.3 },
    { r: 13.6, n: 26, y: 1.8 },
];
const FRA = THREE.MathUtils.degToRad(22);
const TIL = THREE.MathUtils.degToRad(158);

interface Sete {
    x: number;
    y: number;
    z: number;
    rot: number;
    rad: number;
    /** Plass i rekkefølgen fra venstre mot høyre, sett fra talerstolen. */
    orden: number;
    /** Med i 1830, da det satt 64 i salen. */
    i1830: boolean;
}

const SETER: Sete[] = (() => {
    const ut: Sete[] = [];
    RADER.forEach((rad, ri) => {
        for (let i = 0; i < rad.n; i++) {
            const a = FRA + ((TIL - FRA) * (i + 0.5)) / rad.n;
            const x = rad.r * Math.cos(a);
            const z = -rad.r * Math.sin(a);
            // Bakerste rad var bare halvfull i 1830: de ti midterste plassene.
            const midt = Math.abs(i - (rad.n - 1) / 2);
            ut.push({ x, y: rad.y, z, rot: Math.atan2(-x, -z), rad: ri, orden: 0, i1830: ri < 3 || midt < 5 });
        }
    });
    [...ut].sort((a, b) => a.x - b.x).forEach((s, i) => (s.orden = i));
    return ut;
})();

/** Rangen blant de synlige plassene, fra venstre. Bøndene fyller fra venstre. */
const RANG_1830 = (() => {
    const synlige = SETER.filter((s) => s.i1830).sort((a, b) => a.x - b.x);
    return new Map(synlige.map((s, i) => [s, i]));
})();

type Mal = { synlig: boolean; bonde: boolean };

function seteMal(modus: Modus, beat: number, s: Sete): Mal {
    if (modus === 'valg' && beat === 0) return { synlig: false, bonde: false };
    if (modus === 'valg' && beat === 1) {
        const r = RANG_1830.get(s);
        return r === undefined ? { synlig: false, bonde: false } : { synlig: true, bonde: r < 21 };
    }
    return { synlig: true, bonde: s.orden < 45 };
}

const REGJERING = Array.from({ length: 7 }, (_, i) => ({ x: 6 + i * 1.1, z: 5.2 }));

type RegMal = { synlig: boolean; bonde: boolean };
function regjeringMal(modus: Modus, beat: number): RegMal {
    if (modus === 'slutt' && beat === 2) return { synlig: false, bonde: false };
    if (modus === 'slutt' && beat >= 3) return { synlig: true, bonde: true };
    return { synlig: true, bonde: false };
}

function kameraFor(modus: Modus, beat: number, t: number) {
    const oversikt = { pos: v(-t * 0.25, 13 + t * 0.05, 23 - t * 0.2), se: v(0, 1, -5) };
    if (modus === 'valg') {
        switch (beat) {
            case 0:
                return { pos: v(8 - t * 0.4, 9, 20 - t * 0.2), se: v(0, 1.5, -6) };
            case 1:
            case 2:
                return oversikt;
            default:
                return { pos: v(-13 + t * 0.15, 7, 9), se: v(-5, 1.2, -7) };
        }
    }
    if (modus === 'regjering') {
        switch (beat) {
            case 0:
                return oversikt;
            case 1:
                return { pos: v(2.5 + t * 0.05, 4.2, 14), se: v(9, 1.6, 4) };
            case 2:
                return { pos: v(3, 5.5, 15), se: v(9, 3, 4) };
            default:
                return { pos: v(-3, 15, 25), se: v(3, 1, -3) };
        }
    }
    switch (beat) {
        case 0:
            return oversikt;
        case 1:
            return { pos: v(-4, 4.5, 13), se: v(0, 2.2, 0) };
        case 2:
            return { pos: v(3, 5, 14), se: v(9, 1.5, 4) };
        default:
            return { pos: v(-2, 15, 25), se: v(3, 1, -3) };
    }
}

/** Et trinn i salen: et sirkelstykke som er bygd opp fra gulvet. */
function Trinn({ r, h }: { r: number; h: number }) {
    const geo = useMemo(() => {
        const form = new THREE.Shape();
        const inn = r - 1.1;
        const ut = r + 1.1;
        form.absarc(0, 0, ut, FRA - 0.06, TIL + 0.06, false);
        form.absarc(0, 0, inn, TIL + 0.06, FRA - 0.06, true);
        const g = new THREE.ExtrudeGeometry(form, { depth: h, bevelEnabled: false, curveSegments: 40 });
        g.rotateX(-Math.PI / 2);
        return g;
    }, [r, h]);
    return (
        <mesh geometry={geo}>
            <meshStandardMaterial color="#b98b5e" flatShading />
        </mesh>
    );
}

const C_BONDE = new THREE.Color(BONDE);
const C_EMBET = new THREE.Color(EMBETSMANN);
const HUD = new THREE.Color('#ecc9a3');

/** Alle figurene i salen og på regjeringsbenken, som instanser. */
function Figurer({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const n = SETER.length + REGJERING.length;
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const benk = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const tilstand = useRef(
        Array.from({ length: n }, () => ({ s: 0, c: new THREE.Color(EMBETSMANN) }))
    );
    const beatTid = useRef(0);
    const forrige = useRef('');
    const forste = useRef(true);

    useEffect(() => {
        const b = benk.current;
        if (!b) return;
        SETER.forEach((s, i) => {
            o.position.set(s.x, s.y + 0.25, s.z);
            o.rotation.set(0, s.rot, 0);
            o.scale.set(1, 1, 1);
            o.updateMatrix();
            b.setMatrixAt(i, o.matrix);
        });
        b.instanceMatrix.needsUpdate = true;
    }, [o]);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const nokkel = `${modus}-${beat}`;
        if (nokkel !== forrige.current) {
            forrige.current = nokkel;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const k = kropp.current;
        const h = hode.current;
        if (!k || !h) return;
        const alle = forste.current;
        forste.current = false;

        for (let i = 0; i < n; i++) {
            const t = tilstand.current[i];
            const sete = i < SETER.length ? SETER[i] : null;
            const mal = sete ? seteMal(modus, beat, sete) : regjeringMal(modus, beat);
            // Plassene fylles fra venstre, én etter én.
            const vent = sete ? sete.orden * 0.025 : 0.6 + (i - SETER.length) * 0.12;
            const klar = beatTid.current > vent;
            const malS = mal.synlig ? 1 : 0;
            const malC = mal.bonde ? C_BONDE : C_EMBET;
            if (alle) {
                t.s = malS;
                t.c.copy(malC);
            } else if (klar || malS < t.s) {
                t.s = damp(t.s, malS, 5, dt);
                t.c.lerp(malC, 1 - Math.exp(-4 * dt));
            }
            const x = sete ? sete.x : REGJERING[i - SETER.length].x;
            const y = sete ? sete.y + 0.5 : 0.45;
            const z = sete ? sete.z : REGJERING[i - SETER.length].z;
            const s = Math.max(0.0001, t.s);
            o.rotation.set(0, 0, 0);
            o.scale.setScalar(s);
            o.position.set(x, y + 0.45 * s, z);
            o.updateMatrix();
            k.setMatrixAt(i, o.matrix);
            k.setColorAt(i, t.c);
            o.position.set(x, y + 1.12 * s, z);
            o.updateMatrix();
            h.setMatrixAt(i, o.matrix);
            h.setColorAt(i, HUD);
        }
        k.instanceMatrix.needsUpdate = true;
        h.instanceMatrix.needsUpdate = true;
        if (k.instanceColor) k.instanceColor.needsUpdate = true;
        if (h.instanceColor) h.instanceColor.needsUpdate = true;
    });

    return (
        <>
            <instancedMesh ref={benk} args={[undefined, undefined, SETER.length]}>
                <boxGeometry args={[1.05, 0.5, 0.8]} />
                <meshStandardMaterial color="#6b3f22" flatShading />
            </instancedMesh>
            <instancedMesh ref={kropp} args={[undefined, undefined, n]}>
                <capsuleGeometry args={[0.32, 0.45, 3, 8]} />
                <meshStandardMaterial roughness={0.85} flatShading />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, n]}>
                <sphereGeometry args={[0.24, 12, 10]} />
                <meshStandardMaterial roughness={0.8} />
            </instancedMesh>
        </>
    );
}

/** Kronen over regjeringsbenken: kongen velger. */
function Krone({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const g = useRef<THREE.Group>(null);
    const s = useRef(0);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        s.current = damp(s.current, synlig ? 1 : 0, 3, dt);
        if (!g.current) return;
        g.current.visible = s.current > 0.02;
        g.current.scale.setScalar(Math.max(0.0001, s.current));
        g.current.rotation.y = tid.current * 0.6;
        g.current.position.y = 4.4 + Math.sin(tid.current * 1.5) * 0.15;
    });
    return (
        <group ref={g} position={[9.3, 4.4, 5.2]} visible={false}>
            <mesh>
                <cylinderGeometry args={[1, 1, 0.5, 20, 1, true]} />
                <meshStandardMaterial color="#eab308" emissive="#a16207" emissiveIntensity={0.5} side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(a) * 0.95, 0.5, Math.sin(a) * 0.95]}>
                        <coneGeometry args={[0.18, 0.55, 4]} />
                        <meshStandardMaterial color="#eab308" emissive="#a16207" emissiveIntensity={0.5} />
                    </mesh>
                );
            })}
        </group>
    );
}

/** Lysende bånd fra salen til regjeringen: regjeringen må ha Stortinget med seg. */
function Baand({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const m = useRef<THREE.Mesh>(null);
    const s = useRef(0);
    const { pos, rot, lengde } = useMemo(() => {
        const a = v(-1, 3.2, -8);
        const b = v(9.3, 2.4, 5.2);
        const midt = a.clone().add(b).multiplyScalar(0.5);
        const retning = b.clone().sub(a);
        const q = new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), retning.clone().normalize());
        return { pos: midt, rot: new THREE.Euler().setFromQuaternion(q), lengde: retning.length() };
    }, []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        s.current = damp(s.current, synlig ? 1 : 0, 2, dt);
        if (!m.current) return;
        m.current.visible = s.current > 0.02;
        m.current.scale.set(1, Math.max(0.0001, s.current), 1);
    });
    return (
        <mesh ref={m} position={pos} rotation={rot} visible={false}>
            <cylinderGeometry args={[0.22, 0.22, lengde, 10]} />
            <meshBasicMaterial color="#facc15" />
        </mesh>
    );
}

/** Taleren på talerstolen: Johan Sverdrup i slutt-scenen. */
function Taler({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const g = useRef<THREE.Group>(null);
    const s = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        s.current = damp(s.current, synlig ? 1 : 0, 4, dt);
        if (!g.current) return;
        g.current.visible = s.current > 0.02;
        g.current.scale.setScalar(Math.max(0.0001, s.current));
    });
    return (
        <group ref={g} position={[0, 0.6, 2.2]} visible={false}>
            <mesh position={[0, 0.85, 0]}>
                <capsuleGeometry args={[0.36, 0.9, 3, 8]} />
                <meshStandardMaterial color={BONDE} flatShading />
            </mesh>
            <mesh position={[0, 1.85, 0]}>
                <sphereGeometry args={[0.28, 12, 10]} />
                <meshStandardMaterial color="#ecc9a3" />
            </mesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mal = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        se.current.lerp(mal.se, k);
        camera.lookAt(se.current);
    });

    const vegg = useMemo(() => {
        const g = new THREE.CylinderGeometry(17, 17, 9, 48, 1, true, Math.PI - 1.3, 2.6);
        return g;
    }, []);

    return (
        <>
            <color attach="background" args={['#e9dcc6']} />
            <fog attach="fog" args={['#e9dcc6', 40, 90]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#fff7e6', '#7a5a3a', 0.6]} />
            <directionalLight position={[-10, 25, 18]} intensity={1.1} color="#fff4e0" />

            {/* Gulv og vegg */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[80, 60]} />
                <meshStandardMaterial color="#c9a477" />
            </mesh>
            <mesh geometry={vegg} position={[0, 4.5, 0]}>
                <meshStandardMaterial color="#f3ead7" side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: 7 }, (_, i) => {
                const a = FRA + ((TIL - FRA) * i) / 6;
                return (
                    <mesh key={i} position={[16.3 * Math.cos(a), 4.5, -16.3 * Math.sin(a)]}>
                        <cylinderGeometry args={[0.45, 0.5, 9, 10]} />
                        <meshStandardMaterial color="#e2d3b5" flatShading />
                    </mesh>
                );
            })}

            {RADER.map((r) => (
                <Trinn key={r.r} r={r.r} h={r.y} />
            ))}

            {/* Talerstolen og presidentbordet */}
            <mesh position={[0, 0.6, 1.4]}>
                <boxGeometry args={[1.6, 1.2, 0.9]} />
                <meshStandardMaterial color="#7c4a2a" flatShading />
            </mesh>
            <mesh position={[0, 0.3, 2.2]}>
                <boxGeometry args={[2.4, 0.6, 1.6]} />
                <meshStandardMaterial color="#a16d43" flatShading />
            </mesh>

            {/* Regjeringsbenken: rødt teppe og et langt bord */}
            <mesh position={[9.3, 0.05, 5]}>
                <boxGeometry args={[9.4, 0.1, 3]} />
                <meshStandardMaterial color="#9f1d2b" />
            </mesh>
            <mesh position={[9.3, 0.5, 4.1]}>
                <boxGeometry args={[8.4, 0.9, 0.8]} />
                <meshStandardMaterial color="#5b3218" flatShading />
            </mesh>

            <Figurer modus={modus} beat={beat} playing={playing} />
            <Krone synlig={modus === 'regjering' && beat >= 2} playing={playing} />
            <Taler synlig={modus === 'slutt' && beat >= 1} playing={playing} />
            <Baand synlig={modus === 'slutt' && beat >= 3} playing={playing} />
        </>
    );
}

const LAPPER: Record<Modus, string[]> = {
    valg: ['Stortinget i Christiania, 1833', 'Tre år før: valget i 1830', 'Valget i 1833', 'Bøndene er flest'],
    regjering: [
        'Bøndene vinner salen',
        'Regjeringsbenken',
        'Kongen velger regjeringen',
        'Salen: bønder. Regjeringen: embetsmenn',
    ],
    slutt: [
        'En ny, bredere opposisjon',
        'Johan Sverdrup samler alle',
        'Riksretten 1884: statsrådene dømt',
        'Regjeringen må ha Stortinget med seg',
    ],
};

function Brikke({ farge, tekst, tall }: { farge: string; tekst: string; tall?: number }) {
    return (
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/95 shadow-xl">
            <span className="w-6 h-6 rounded-full shrink-0" style={{ background: farge }} />
            {tall !== undefined && (
                <span className="text-3xl md:text-4xl font-black tabular-nums text-slate-900">{tall}</span>
            )}
            <span className="text-lg md:text-2xl font-bold text-slate-700">{tekst}</span>
        </div>
    );
}

function Tavle({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'valg') {
        if (beat === 0) return null;
        const [b, e] = beat === 1 ? [21, 43] : [45, 35];
        return (
            <>
                <Brikke farge={BONDE} tall={b} tekst="bønder" />
                <Brikke farge={EMBETSMANN} tall={e} tekst="embetsmenn" />
            </>
        );
    }
    if (modus === 'regjering') {
        return (
            <>
                <Brikke farge={BONDE} tall={45} tekst="bønder i salen" />
                <Brikke farge={EMBETSMANN} tekst="regjeringen: bare embetsmenn" />
            </>
        );
    }
    return (
        <>
            <Brikke farge={BONDE} tekst="opposisjonen" />
            <Brikke farge={EMBETSMANN} tekst="embetsmenn" />
        </>
    );
}

export function EmbetsmannSalen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'valg';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const liste = LAPPER[modus];
    const lapp = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas dpr={dpr} camera={{ fov: 42, near: 0.3, far: 200, position: [0, 13, 23] }} gl={{ antialias: true }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${modus === 'valg' ? Math.min(beat, 2) : 0}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-[5%] left-[4%] flex flex-col gap-2"
                >
                    <Tavle modus={modus} beat={beat} />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
