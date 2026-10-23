import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Urverket i 3D: tannhjul av messing som griper i hverandre bak en urskive. Farten følger
 * replikken: normal, nesten stille (et kyss på ti sider), spinnende (hundre år i én setning),
 * vekselvis sakte og fort (elastisk), og til slutt skrus de to store hjulene fra hverandre.
 */

const FOV = 40;
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

type Modus = 'urverk' | 'grep';

/** Omdreininger per sekund for det store hjulet, per beat. */
function fartFor(modus: Modus, beat: number, t: number) {
    if (modus === 'grep') {
        // Oppsummeringen: rolig, så bakover (tilbakeblikk) og fram, så sakte og fort.
        if (beat === 2) return Math.sin(t * 0.9) > 0 ? -0.5 : 0.5;
        if (beat === 3) return Math.sin(t * 1.3) > 0 ? 1.2 : 0.01;
        return 0.15;
    }
    if (beat === 1) return 0.01;
    if (beat === 2) return 1.6;
    if (beat === 3) return Math.sin(t * 1.3) > 0 ? 0.9 : 0.02;
    if (beat >= 4) return 0.05;
    return 0.12;
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'grep') {
        if (beat === 0) return { pos: v(0, 2, 22 - Math.min(t, 8) * 0.3), se: v(0, 0, 0) };
        return { pos: v(-2 + beat * 0.8, 3, 19), se: v(0.5, -0.3, 0) };
    }
    if (beat === 0) return { pos: v(-4 + Math.min(t, 8) * 0.4, 3, 20), se: v(0, 0, 0) };
    if (beat === 1) return { pos: v(-3, 1.5, 13), se: v(-1, 0, 0) };
    if (beat === 2) return { pos: v(4, 2, 15), se: v(1, 0, 0) };
    if (beat === 3) return { pos: v(0, 6, 18), se: v(0, -0.5, 0) };
    return { pos: v(7, 5, 24), se: v(0, 0, 0) };
}

/** Et tannhjul som `ExtrudeGeometry`: en sirkel med tenner langs kanten og hull i midten. */
function lagHjul(radius: number, tenner: number) {
    const form = new THREE.Shape();
    const ytre = radius + 0.35;
    const indre = radius - 0.15;
    for (let i = 0; i < tenner; i++) {
        const a0 = (i / tenner) * Math.PI * 2;
        const steg = (Math.PI * 2) / tenner;
        const punkter: [number, number][] = [
            [indre, a0],
            [ytre, a0 + steg * 0.15],
            [ytre, a0 + steg * 0.45],
            [indre, a0 + steg * 0.6],
        ];
        punkter.forEach(([r, a], j) => {
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0 && j === 0) form.moveTo(x, y);
            else form.lineTo(x, y);
        });
    }
    form.closePath();
    const hull = new THREE.Path();
    hull.absarc(0, 0, radius * 0.25, 0, Math.PI * 2, true);
    form.holes.push(hull);
    // Fire eiker: hull mellom navet og kransen
    for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const p = new THREE.Path();
        p.absarc(
            Math.cos(a) * radius * 0.6,
            Math.sin(a) * radius * 0.6,
            radius * 0.22,
            0,
            Math.PI * 2,
            true
        );
        form.holes.push(p);
    }
    const g = new THREE.ExtrudeGeometry(form, { depth: 0.5, bevelEnabled: false });
    g.translate(0, 0, -0.25);
    return g;
}

interface HjulData {
    radius: number;
    tenner: number;
    pos: [number, number, number];
    /** Hvor hjulet glir når urverket skrus fra hverandre. */
    ut: [number, number, number];
    farge: string;
    /** Retning og utveksling i forhold til det store hjulet. */
    faktor: number;
    fase: number;
}

const STOR = 3.2;
const LITEN = 1.6;
const MELLOM = 2.2;
const HJUL: HjulData[] = [
    {
        radius: STOR,
        tenner: 24,
        pos: [0, 0, 0],
        ut: [-5.5, 0.5, 0],
        farge: '#d4a017',
        faktor: 1,
        fase: 0,
    },
    {
        radius: LITEN,
        tenner: 12,
        pos: [STOR + LITEN + 0.2, 1.2, 0],
        ut: [7, 3.2, 0],
        farge: '#b87333',
        faktor: -STOR / LITEN,
        fase: 0.13,
    },
    {
        radius: MELLOM,
        tenner: 16,
        pos: [-(STOR + MELLOM + 0.2) * 0.55, -(STOR + MELLOM + 0.2) * 0.83, -0.6],
        ut: [5.5, -3, 0],
        farge: '#c9a227',
        faktor: -STOR / MELLOM,
        fase: 0.1,
    },
];

function Urverk({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const geo = useMemo(() => HJUL.map((h) => lagHjul(h.radius, h.tenner)), []);
    const hjul = useRef<(THREE.Mesh | null)[]>([]);
    const viser = useRef<THREE.Group>(null);
    const vinkel = useRef(0);
    const forrigeBeat = useRef(-1);
    const beatTid = useRef(0);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        vinkel.current += fartFor(modus, beat, beatTid.current) * Math.PI * 2 * dt;
        HJUL.forEach((h, i) => {
            const m = hjul.current[i];
            if (!m) return;
            m.rotation.z = vinkel.current * h.faktor + h.fase;
            const mal = modus === 'urverk' && beat >= 4 ? h.ut : h.pos;
            if (forste.current) m.position.set(...mal);
            m.position.x = damp(m.position.x, mal[0], 1.2, dt);
            m.position.y = damp(m.position.y, mal[1], 1.2, dt);
            m.position.z = damp(m.position.z, mal[2], 1.2, dt);
        });
        forste.current = false;
        if (viser.current) {
            // Urskiva følger det store hjulet; viseren går tolv ganger så fort.
            const stor = hjul.current[0];
            if (stor) viser.current.position.set(stor.position.x, stor.position.y, 0.6);
            viser.current.rotation.z = -vinkel.current * 12;
        }
    });
    return (
        <group>
            {HJUL.map((h, i) => (
                <mesh
                    key={i}
                    geometry={geo[i]}
                    ref={(m) => {
                        hjul.current[i] = m;
                    }}
                >
                    <meshStandardMaterial
                        color={h.farge}
                        emissive={h.farge}
                        emissiveIntensity={0.25}
                        metalness={0.6}
                        roughness={0.35}
                        flatShading
                    />
                </mesh>
            ))}
            <group ref={viser} visible={modus === 'grep' || beat < 4}>
                <mesh position={[0, 0, -0.08]}>
                    <circleGeometry args={[1.7, 48]} />
                    <meshStandardMaterial
                        color="#fef9ec"
                        emissive="#fef3c7"
                        emissiveIntensity={0.35}
                    />
                </mesh>
                <mesh position={[0, 0.65, 0]}>
                    <boxGeometry args={[0.12, 1.3, 0.06]} />
                    <meshStandardMaterial
                        color="#b91c1c"
                        emissive="#7f1d1d"
                        emissiveIntensity={0.5}
                    />
                </mesh>
                <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.16, 0.16, 0.12, 16]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            </group>
        </group>
    );
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const se = useRef(new THREE.Vector3());
    const forrigeBeat = useRef(-1);
    const beatTid = useRef(0);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const k = kameraFor(modus, beat, beatTid.current);
        if (forste.current) {
            camera.position.copy(k.pos);
            se.current.copy(k.se);
            forste.current = false;
        } else {
            const f = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(k.pos, f);
            se.current.lerp(k.se, f);
        }
        camera.lookAt(se.current);
    });
    return null;
}

interface Merke {
    fraBeat: number;
    tilBeat?: number;
    tittel: string;
    tekst?: string;
    x: number;
    y: number;
    tone: 'lys' | 'mork' | 'gull';
}

const URVERK: Merke[] = [
    {
        fraBeat: 0,
        tilBeat: 0,
        tittel: 'Tiden i en fortelling',
        tekst: 'et urverk av tannhjul',
        x: 4,
        y: 7,
        tone: 'lys',
    },
    {
        fraBeat: 1,
        tilBeat: 1,
        tittel: 'Nesten stille',
        tekst: '5 sekunder, 10 sider',
        x: 4,
        y: 7,
        tone: 'mork',
    },
    {
        fraBeat: 2,
        tilBeat: 2,
        tittel: 'Spinner rundt',
        tekst: '100 år, én setning',
        x: 4,
        y: 7,
        tone: 'gull',
    },
    {
        fraBeat: 3,
        tilBeat: 3,
        tittel: 'Elastisk tid',
        tekst: 'strekkes ut og trykkes sammen',
        x: 4,
        y: 7,
        tone: 'lys',
    },
    { fraBeat: 4, tittel: 'Rekkefølge', x: 6, y: 66, tone: 'gull' },
    { fraBeat: 4, tittel: 'Tempo', x: 74, y: 8, tone: 'mork' },
];

const GREP: Merke[] = [
    {
        fraBeat: 0,
        tilBeat: 0,
        tittel: 'Forfatteren',
        tekst: 'er en tidsreisende',
        x: 4,
        y: 7,
        tone: 'lys',
    },
    { fraBeat: 1, tittel: 'Pangstart', tekst: 'midt i handlingen', x: 4, y: 7, tone: 'gull' },
    { fraBeat: 2, tittel: 'Tilbakeblikk', tekst: 'hopp bakover', x: 4, y: 40, tone: 'mork' },
    { fraBeat: 2, tittel: 'Frampek', tekst: 'pek framover', x: 72, y: 7, tone: 'mork' },
    {
        fraBeat: 3,
        tittel: 'Tempo',
        tekst: 'strekk ut, eller hopp over år',
        x: 66,
        y: 66,
        tone: 'lys',
    },
    { fraBeat: 4, tittel: 'Mer spennende', tekst: 'enn virkeligheten', x: 4, y: 72, tone: 'gull' },
];

const MERKER: Record<Modus, Merke[]> = { urverk: URVERK, grep: GREP };

const TONE: Record<Merke['tone'], string> = {
    lys: 'bg-white/95 text-slate-900',
    mork: 'bg-slate-900/90 text-white',
    gull: 'bg-amber-300/95 text-slate-900',
};

export function TidTannhjul({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'urverk';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = MERKER[modus].filter(
        (m) => beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat)
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: FOV, position: [-4, 3, 20] }}
            >
                <color attach="background" args={['#2b2118']} />
                <fog attach="fog" args={['#2b2118', 30, 70]} />
                <hemisphereLight args={['#fff7e6', '#3b2a1a', 0.9]} />
                <directionalLight position={[8, 10, 14]} intensity={1.6} />
                <pointLight position={[-6, -2, 8]} intensity={30} color="#ffd59e" />
                <Kamera modus={modus} beat={beat} playing={playing} />
                <Urverk modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {merker.map((m) => (
                    <motion.div
                        key={m.tittel}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.6,
                            delay: modus === 'urverk' && m.fraBeat === 4 ? 1.4 : 0.2,
                        }}
                        className={`absolute rounded-2xl shadow-xl px-5 py-3 ${TONE[m.tone]}`}
                        style={{ left: `${m.x}%`, top: `${m.y}%`, maxWidth: '40%' }}
                    >
                        <div
                            className="text-3xl font-black leading-tight"
                            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                        >
                            {m.tittel}
                        </div>
                        {m.tekst && (
                            <div className="text-xl font-semibold opacity-90 mt-0.5">{m.tekst}</div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
