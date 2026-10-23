import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Et hus på en høyde en natt med vind og regn. «vis»: den flate setningen (alt står stille)
 * mot den som viser (vinden river i trærne, regnet pisker mot ruten). «besjeling»: naturen
 * får liv. Regnet renner som tårer nedover ruten, trærne lener seg mot en mann på stien, og
 * løvet virvler rundt trærne som om vinden hvisker.
 */

type Modus = 'vis' | 'besjeling';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Hvor mye vind og regn det er på hver beat (0-1). */
function vaerFor(modus: Modus, beat: number) {
    if (modus === 'vis') {
        if (beat <= 1) return { vind: 0.04, regn: 0.15, lys: 0.35 };
        if (beat === 2) return { vind: 1, regn: 0.4, lys: 1 };
        return { vind: 1, regn: 1, lys: 1 };
    }
    if (beat === 2) return { vind: 0.3, regn: 1, lys: 1 };
    if (beat === 4) return { vind: 0.7, regn: 0.3, lys: 1 };
    return { vind: 0.5, regn: 0.6, lys: 1 };
}

// Vinduet på husets forside. Kameraet går helt inn til det når regnet treffer ruten.
const VINDU = v(0.9, 1.85, 1.77);
const MANN = v(4.3, 0, 7.6);

function kameraFor(modus: Modus, beat: number, t: number) {
    const drift = Math.min(t, 10) * 0.12;
    if (modus === 'vis') {
        if (beat <= 1) return { pos: v(10 - drift, 4.2, 14), se: v(0, 1.6, 0) };
        if (beat === 2) return { pos: v(-9 + drift, 3.6, 9), se: v(-1, 2.2, -1) };
        if (beat === 3) return { pos: v(1.6, 2.1, 5.2 - drift * 0.2), se: v(0.8, 1.85, 1.7) };
        return { pos: v(12 + drift, 6.5, 16), se: v(0, 1.8, 0) };
    }
    if (beat <= 1) return { pos: v(11 - drift, 5, 15), se: v(0, 1.8, 0) };
    if (beat === 2) return { pos: v(1.3, 2, 4.4 - drift * 0.15), se: v(0.9, 1.85, 1.7) };
    if (beat === 3) return { pos: v(2, 3.8, 15.5 - drift * 0.5), se: v(4.3, 1.4, 7.6) };
    return { pos: v(-8.5 + drift, 4.2, 8), se: v(-4, 2.6, -2.5) };
}

function Huset() {
    return (
        <group>
            {/* Høyden huset står på */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[40, 32]} />
                <meshStandardMaterial color="#2f4a3a" emissive="#14261c" emissiveIntensity={0.6} />
            </mesh>
            {/* Stien ned fra døra */}
            <mesh rotation={[-Math.PI / 2, 0, -0.55]} position={[2.6, 0.02, 4.6]}>
                <planeGeometry args={[1.1, 7]} />
                <meshStandardMaterial color="#6b5b45" emissive="#2a2016" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[4.4, 3, 3.5]} />
                <meshStandardMaterial color="#8b6f5a" emissive="#2d2017" emissiveIntensity={0.5} />
            </mesh>
            {/* Taket: et prisme */}
            <group position={[0, 3.75, 0]} scale={[1.12, 1, 0.92]}>
                <mesh rotation={[0, Math.PI / 4, 0]}>
                    <cylinderGeometry args={[0.01, 2.9, 1.5, 4, 1]} />
                    <meshStandardMaterial
                        color="#3f2a22"
                        emissive="#1a0f0b"
                        emissiveIntensity={0.5}
                        flatShading
                    />
                </mesh>
            </group>
            <mesh position={[-1.2, 4.1, -0.6]}>
                <boxGeometry args={[0.5, 1.2, 0.5]} />
                <meshStandardMaterial color="#4b3a33" />
            </mesh>
            {/* Vinduet lyser */}
            <mesh position={[VINDU.x, VINDU.y, VINDU.z - 0.01]}>
                <planeGeometry args={[1.1, 0.95]} />
                <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[VINDU.x, VINDU.y, VINDU.z]}>
                <boxGeometry args={[0.08, 0.95, 0.04]} />
                <meshStandardMaterial color="#2b1d15" />
            </mesh>
            <mesh position={[VINDU.x, VINDU.y, VINDU.z]}>
                <boxGeometry args={[1.1, 0.08, 0.04]} />
                <meshStandardMaterial color="#2b1d15" />
            </mesh>
            {/* Døra */}
            <mesh position={[-1.1, 0.9, 1.76]}>
                <planeGeometry args={[0.8, 1.8]} />
                <meshStandardMaterial color="#3b2418" />
            </mesh>
            {/* Månen bak skyene */}
            <mesh position={[-14, 16, -30]}>
                <sphereGeometry args={[2.2, 24, 16]} />
                <meshStandardMaterial color="#f1f5f9" emissive="#e2e8f0" emissiveIntensity={1} />
            </mesh>
        </group>
    );
}

const TRAER: { x: number; z: number; s: number; motMann?: boolean }[] = [
    { x: -4.5, z: -2.5, s: 1.3 },
    { x: -6.5, z: 0.5, s: 1.1 },
    { x: -3.4, z: -5.5, s: 1.5 },
    { x: 4.3, z: -3, s: 1.2 },
    { x: 6.8, z: -0.8, s: 1 },
    { x: 2.8, z: 6.6, s: 1, motMann: true },
    { x: 6.4, z: 4.4, s: 1.15, motMann: true },
    { x: 6.2, z: 8.2, s: 0.95, motMann: true },
    { x: -7.5, z: -5.5, s: 1.2 },
];

function Traer({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const grupper = useRef<(THREE.Group | null)[]>([]);
    const tid = useRef(0);
    const vind = useRef(-1);
    const len = useRef(0);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        const mal = vaerFor(modus, beat).vind;
        vind.current = vind.current < 0 ? mal : damp(vind.current, mal, 1.5, dt);
        const griper = modus === 'besjeling' && beat === 3;
        len.current = damp(len.current, griper ? 1 : 0, 1.2, dt);
        TRAER.forEach((tre, i) => {
            const g = grupper.current[i];
            if (!g) return;
            const sus =
                Math.sin(tid.current * (1.6 + vind.current * 2) + i) * 0.04 +
                Math.sin(tid.current * 3.1 + i * 2) * 0.02;
            const bøy = vind.current * 0.16 + sus * (0.3 + vind.current * 2);
            let lenX = 0;
            let lenZ = 0;
            if (tre.motMann) {
                // Trærne ved stien bøyer seg mot mannen, som hender som strekker seg ut.
                const dx = MANN.x - tre.x;
                const dz = MANN.z - tre.z;
                const l = Math.hypot(dx, dz) || 1;
                lenX = (dz / l) * 0.35 * len.current;
                lenZ = (-dx / l) * 0.35 * len.current;
            }
            g.rotation.set(lenX, 0, -bøy + lenZ);
        });
    });
    return (
        <>
            {TRAER.map((tre, i) => (
                <group
                    key={i}
                    position={[tre.x, 0, tre.z]}
                    scale={tre.s}
                    ref={(el) => {
                        grupper.current[i] = el;
                    }}
                >
                    <mesh position={[0, 1, 0]}>
                        <cylinderGeometry args={[0.14, 0.24, 2, 6]} />
                        <meshStandardMaterial
                            color="#3b2a1e"
                            emissive="#1a120c"
                            emissiveIntensity={0.4}
                        />
                    </mesh>
                    <mesh position={[0, 2.6, 0]}>
                        <coneGeometry args={[1.3, 2.2, 7]} />
                        <meshStandardMaterial
                            color="#1f4d36"
                            emissive="#0c2318"
                            emissiveIntensity={0.6}
                            flatShading
                        />
                    </mesh>
                    <mesh position={[0, 3.7, 0]}>
                        <coneGeometry args={[0.9, 1.7, 7]} />
                        <meshStandardMaterial
                            color="#25593f"
                            emissive="#0e281b"
                            emissiveIntensity={0.6}
                            flatShading
                        />
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** En liten mann på stien. Vises bare når skogen griper etter ham. */
function Mannen({ synlig }: { synlig: boolean }) {
    return (
        <group position={[MANN.x, 0, MANN.z]} scale={1.5} visible={synlig}>
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.2, 0.26, 1.1, 8]} />
                <meshStandardMaterial color="#b91c1c" emissive="#450a0a" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0, 1.3, 0]}>
                <sphereGeometry args={[0.2, 12, 10]} />
                <meshStandardMaterial color="#f1c7a4" emissive="#5a3b2a" emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
}

const REGN = 420;
function Regn({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const draper = useMemo(
        () =>
            Array.from({ length: REGN }, (_, i) => ({
                x: -16 + ((i * 53) % 320) / 10,
                y: ((i * 29) % 140) / 10,
                z: -14 + ((i * 71) % 300) / 10,
            })),
        []
    );
    const mengde = useRef(-1);
    const vind = useRef(0);
    useFrame((_, delta) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const vaer = vaerFor(modus, beat);
        mengde.current = mengde.current < 0 ? vaer.regn : damp(mengde.current, vaer.regn, 1.5, dt);
        vind.current = damp(vind.current, vaer.vind, 1.5, dt);
        draper.forEach((d, i) => {
            d.y -= dt * (9 + vind.current * 4);
            d.x += dt * vind.current * 4;
            if (d.y < 0) {
                d.y += 14;
                d.x = -16 + ((i * 53 + Math.floor(d.x * 10)) % 320) / 10;
            }
            if (d.x > 16) d.x -= 32;
            const vis = i / REGN < mengde.current;
            o.position.set(d.x, d.y, d.z);
            o.rotation.set(0, 0, -vind.current * 0.35);
            o.scale.set(1, vis ? 1 : 0.001, 1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, REGN]}>
            <boxGeometry args={[0.025, 0.5, 0.025]} />
            <meshStandardMaterial
                color="#bfdbfe"
                emissive="#93c5fd"
                emissiveIntensity={0.8}
                transparent
                opacity={0.7}
            />
        </instancedMesh>
    );
}

/** Dråper som renner nedover ruten. I «besjeling» renner de sakte, som tårer. */
const RUTE = 26;
function Rutedraper({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const draper = useMemo(
        () =>
            Array.from({ length: RUTE }, (_, i) => ({
                x: -0.5 + ((i * 37) % 100) / 100,
                y: ((i * 61) % 90) / 100,
                fart: 0.12 + ((i * 13) % 10) / 40,
            })),
        []
    );
    const synlig = useRef(0);
    useFrame((_, delta) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const mal =
            (modus === 'vis' && beat === 3) || (modus === 'besjeling' && beat === 2) ? 1 : 0;
        synlig.current = damp(synlig.current, mal, 2, dt);
        const tregt = modus === 'besjeling' ? 0.45 : 1.6;
        draper.forEach((d, i) => {
            d.y -= dt * d.fart * tregt;
            if (d.y < 0) d.y += 0.9;
            o.position.set(VINDU.x + d.x, VINDU.y - 0.45 + d.y, VINDU.z + 0.04);
            const s = synlig.current * (0.025 + (i % 3) * 0.01);
            o.scale.set(s, s * (modus === 'besjeling' ? 2.6 : 1.6), s);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, RUTE]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial
                color="#e0f2fe"
                emissive="#7dd3fc"
                emissiveIntensity={0.9}
                transparent
                opacity={0.85}
            />
        </instancedMesh>
    );
}

/** Løv som virvler rundt trærne når vinden hvisker. */
const LOV = 60;
function Lov({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0);
    const mengde = useRef(0);
    useFrame((_, delta) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        mengde.current = damp(mengde.current, synlig ? 1 : 0, 1.4, dt);
        for (let i = 0; i < LOV; i++) {
            const tre = TRAER[i % 3];
            const a = tid.current * (0.6 + (i % 5) * 0.1) + i;
            const r = 1.4 + (i % 4) * 0.35;
            o.position.set(
                tre.x + Math.cos(a) * r,
                1.6 + ((i * 7) % 30) / 10 + Math.sin(a * 1.3) * 0.3,
                tre.z + Math.sin(a) * r
            );
            o.rotation.set(a, a * 0.7, 0);
            o.scale.setScalar(mengde.current * 0.13);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, LOV]}>
            <planeGeometry args={[1, 0.6]} />
            <meshStandardMaterial
                color="#d97706"
                emissive="#92400e"
                emissiveIntensity={0.7}
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    );
}

function Lys({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const mane = useRef<THREE.DirectionalLight>(null);
    const himmel = useRef<THREE.HemisphereLight>(null);
    const styrke = useRef(-1);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const mal = vaerFor(modus, beat).lys;
        styrke.current = styrke.current < 0 ? mal : damp(styrke.current, mal, 1.2, dt);
        if (mane.current) mane.current.intensity = 0.3 + styrke.current * 1.1;
        if (himmel.current) himmel.current.intensity = 0.5 + styrke.current * 0.5;
    });
    return (
        <>
            <hemisphereLight ref={himmel} args={['#a5b4fc', '#1e293b', 0.8]} />
            <directionalLight ref={mane} position={[-10, 14, 8]} color="#dbeafe" intensity={1.2} />
            <pointLight
                position={[VINDU.x, VINDU.y, VINDU.z + 1.2]}
                color="#fbbf24"
                intensity={6}
                distance={6}
            />
        </>
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
    tekst: string;
    /** «flat» er den kjedelige setningen, «sitat» det levende bildet, «navn» virkemiddelet. */
    tone: 'flat' | 'sitat' | 'navn';
}

const MERKER: Record<Modus, Merke[]> = {
    vis: [
        { fraBeat: 0, tilBeat: 1, tekst: 'Det var en skummel natt.', tone: 'flat' },
        { fraBeat: 1, tilBeat: 1, tekst: '«Skummel» sier bare hva du skal føle', tone: 'navn' },
        {
            fraBeat: 2,
            tilBeat: 3,
            tekst: 'Vinden ulte rundt hushjørnene som en såret ulv.',
            tone: 'sitat',
        },
        { fraBeat: 3, tilBeat: 3, tekst: 'Regnet pisket mot ruten.', tone: 'sitat' },
        { fraBeat: 4, tekst: 'Vis, ikke fortell', tone: 'navn' },
    ],
    besjeling: [
        { fraBeat: 0, tekst: 'Besjeling', tone: 'navn' },
        { fraBeat: 1, tilBeat: 1, tekst: 'gråte, hviske, gripe', tone: 'sitat' },
        { fraBeat: 2, tilBeat: 2, tekst: 'Regnet gråter mot ruten.', tone: 'sitat' },
        { fraBeat: 3, tilBeat: 3, tekst: 'Skogen griper etter ham.', tone: 'sitat' },
        { fraBeat: 4, tekst: 'Vinden hvisket hemmeligheter i trærne.', tone: 'sitat' },
    ],
};

const TONE: Record<Merke['tone'], string> = {
    flat: 'bg-slate-200/95 text-slate-600 font-semibold',
    sitat: 'bg-white/95 text-slate-900 font-black italic',
    navn: 'bg-amber-300/95 text-slate-900 font-black',
};

export function BildesprakNatt({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'vis';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = MERKER[modus].filter(
        (m) => beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat)
    );
    // Den flate setningen gir et flatt, grått bilde. Det levende bildet får farge.
    const flat = modus === 'vis' && beat <= 1;
    const himmel = flat ? '#4b5563' : '#16213a';
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [10, 4, 14] }}
            >
                <color attach="background" args={[himmel]} />
                <fog attach="fog" args={[himmel, 16, 48]} />
                <Lys modus={modus} beat={beat} playing={playing} />
                <Kamera modus={modus} beat={beat} playing={playing} />
                <Huset />
                <Traer modus={modus} beat={beat} playing={playing} />
                <Mannen synlig={modus === 'besjeling' && beat === 3} />
                <Regn modus={modus} beat={beat} playing={playing} />
                <Rutedraper modus={modus} beat={beat} playing={playing} />
                <Lov synlig={modus === 'besjeling' && beat === 4} playing={playing} />
            </Canvas>
            <div className="absolute left-[5%] top-[7%] flex flex-col items-start gap-3 max-w-[62%]">
                <AnimatePresence>
                    {merker.map((m, i) => (
                        <motion.div
                            key={m.tekst}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 + i * 0.4 }}
                            className={`rounded-2xl shadow-xl px-5 py-3 text-3xl ${TONE[m.tone]}`}
                            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                        >
                            {m.tekst}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
