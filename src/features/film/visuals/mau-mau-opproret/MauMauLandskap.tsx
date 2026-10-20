import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Det kenyanske høylandet i 3D, med Mount Kenya i bakgrunnen. «skog»: natt i skogen der
 * en ung mann har tatt eden, og bålene til de mange tusen andre. «jord»: hyttene som må
 * flytte inn i reservatet, mot de store gårdene til nybyggerne. «landsby»: en av de nye
 * landsbyene med piggtråd og vakttårn. Ingen mennesker blir skadet i bildet.
 */

type Modus = 'skog' | 'jord' | 'landsby';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

/** Tilfeldig tall med frø, så scenen ser lik ut hver gang. */
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const FJELL = v(30, 0, -330);

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'skog') {
        switch (beat) {
            case 0:
                return { pos: v(-50 + t * 0.4, 16, 70), se: v(10, 18, -160) };
            case 1:
                return { pos: v(7, 3.2, 10), se: v(0, 1.6, 0) };
            case 2:
                return { pos: v(-4 - t * 0.12, 2.2, 6), se: v(0, 1.8, 0) };
            default:
                return { pos: v(0, 38 + t * 0.4, 75), se: v(0, 0, -40) };
        }
    }
    if (modus === 'jord') {
        switch (beat) {
            case 0:
                return { pos: v(-30, 30, 120), se: v(0, 0, 0) };
            case 1:
                return { pos: v(-110, 26, 70), se: v(-62, 0, 0) };
            case 2:
                return { pos: v(-10, 150, 125), se: v(-10, 0, -5) };
            default:
                return { pos: v(70 - t * 0.6, 12, 60), se: v(45, 2, 10) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-60, 45, 80), se: v(0, 0, 0) };
        case 1:
            return { pos: v(48, 12, 44), se: v(20, 5, 18) };
        case 2:
            return { pos: v(0, 16, 48), se: v(0, 2, -70) };
        case 3:
            return { pos: v(-36 + t * 0.2, 9, -12), se: v(-22, 7, -22) };
        default:
            return { pos: v(70, 34, 70), se: v(0, 0, 0) };
    }
}

/** Kameraet glir mot målet for beaten. Første bilde hopper rett dit. Gir beat-klokka tilbake. */
function useKamera(modus: Modus, beat: number, playing: boolean) {
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
        const m = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return beatTid;
}

const mat = {
    snø: new THREE.MeshStandardMaterial({ color: '#f1f5f9', emissive: '#94a3b8', emissiveIntensity: 0.35, flatShading: true }),
    fjell: new THREE.MeshStandardMaterial({ color: '#5b6a55', emissive: '#1a2118', flatShading: true, roughness: 1 }),
    tre: new THREE.MeshStandardMaterial({ color: '#2f5a3a', emissive: '#0f2418', flatShading: true, roughness: 0.9 }),
    stamme: new THREE.MeshStandardMaterial({ color: '#5a3d26', roughness: 1 }),
    vegg: new THREE.MeshStandardMaterial({ color: '#b08458', emissive: '#2a1d10', flatShading: true }),
    gress: new THREE.MeshStandardMaterial({ color: '#c9a86a', emissive: '#3a2c14', flatShading: true }),
    hus: new THREE.MeshStandardMaterial({ color: '#f2efe6', flatShading: true }),
    taktegl: new THREE.MeshStandardMaterial({ color: '#9a3412', flatShading: true }),
    aker: new THREE.MeshStandardMaterial({ color: '#4d7c0f', emissive: '#1a2e05', flatShading: true }),
    stolpe: new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 1 }),
    traad: new THREE.MeshBasicMaterial({ color: '#3f3f46' }),
    taarn: new THREE.MeshStandardMaterial({ color: '#6b5a48', flatShading: true }),
    bal: new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff7a1a', emissiveIntensity: 2 }),
    person: new THREE.MeshStandardMaterial({ color: '#3b2f2a', emissive: '#1a120e', flatShading: true }),
    klaer: new THREE.MeshStandardMaterial({ color: '#6b4f3a', emissive: '#20160f', flatShading: true }),
};

function Fjellet() {
    return (
        <group position={FJELL}>
            <mesh material={mat.fjell} position={[0, 55, 0]}>
                <coneGeometry args={[150, 110, 9]} />
            </mesh>
            <mesh material={mat.snø} position={[0, 98, 0]}>
                <coneGeometry args={[44, 26, 9]} />
            </mesh>
            <mesh material={mat.snø} position={[12, 108, 4]}>
                <coneGeometry args={[14, 20, 6]} />
            </mesh>
        </group>
    );
}

/** Trær som instanser. `fri` er en sirkel der det ikke står trær (lysning, landsby). */
function Skog({ antall, midt, radius, fri, frøStart }: { antall: number; midt: [number, number]; radius: number; fri: number; frøStart: number }) {
    const krone = useRef<THREE.InstancedMesh>(null);
    const stamme = useRef<THREE.InstancedMesh>(null);
    const punkter = useMemo(() => {
        const ut: { x: number; z: number; h: number }[] = [];
        for (let i = 0; ut.length < antall && i < antall * 4; i++) {
            const r = Math.sqrt(frø(i + frøStart)) * radius;
            if (r < fri) continue;
            const a = frø(i + frøStart + 999) * Math.PI * 2;
            ut.push({ x: midt[0] + Math.cos(a) * r, z: midt[1] + Math.sin(a) * r, h: 5 + frø(i + frøStart + 333) * 5 });
        }
        return ut;
    }, [antall, midt, radius, fri, frøStart]);
    useLayoutEffect(() => {
        const o = new THREE.Object3D();
        punkter.forEach((p, i) => {
            o.position.set(p.x, p.h * 0.55 + 1.2, p.z);
            o.scale.set(p.h * 0.35, p.h, p.h * 0.35);
            o.updateMatrix();
            krone.current?.setMatrixAt(i, o.matrix);
            o.position.set(p.x, 0.75, p.z);
            o.scale.set(1, 1, 1);
            o.updateMatrix();
            stamme.current?.setMatrixAt(i, o.matrix);
        });
        if (krone.current) krone.current.instanceMatrix.needsUpdate = true;
        if (stamme.current) stamme.current.instanceMatrix.needsUpdate = true;
    }, [punkter]);
    return (
        <>
            <instancedMesh ref={krone} args={[undefined, undefined, punkter.length]} material={mat.tre}>
                <coneGeometry args={[1, 1, 6]} />
            </instancedMesh>
            <instancedMesh ref={stamme} args={[undefined, undefined, punkter.length]} material={mat.stamme}>
                <cylinderGeometry args={[0.18, 0.25, 1.5, 5]} />
            </instancedMesh>
        </>
    );
}

/** Bål med flimrende lys. */
function Baal({ playing }: { playing: boolean }) {
    const lys = useRef<THREE.PointLight>(null);
    const flamme = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, d) => {
        tid.current += playing ? Math.min(d, 0.05) : 0;
        const f = 1 + Math.sin(tid.current * 11) * 0.12 + Math.sin(tid.current * 23) * 0.08;
        if (lys.current) lys.current.intensity = 22 * f;
        if (flamme.current) flamme.current.scale.set(1, f, 1);
    });
    return (
        <group position={[0, 0, 0]}>
            <mesh ref={flamme} material={mat.bal} position={[0, 0.45, 0]}>
                <coneGeometry args={[0.35, 0.9, 6]} />
            </mesh>
            {[0, 1, 2].map((i) => (
                <mesh key={i} material={mat.stamme} position={[0, 0.1, 0]} rotation={[0, (i * Math.PI) / 3, Math.PI / 2]}>
                    <cylinderGeometry args={[0.07, 0.07, 1.1, 5]} />
                </mesh>
            ))}
            <pointLight ref={lys} position={[0, 1, 0]} color="#ff9a3c" distance={18} decay={1.6} />
        </group>
    );
}

/** En sittende skikkelse ved bålet, enkel og uten ansikt. */
function Skikkelse() {
    return (
        <group position={[1.4, 0, -0.6]} rotation={[0, -0.9, 0]}>
            <mesh material={mat.klaer} position={[0, 0.75, 0]}>
                <cylinderGeometry args={[0.28, 0.4, 1.1, 8]} />
            </mesh>
            <mesh material={mat.person} position={[0, 1.5, 0]}>
                <sphereGeometry args={[0.24, 10, 8]} />
            </mesh>
            <mesh material={mat.klaer} position={[-0.3, 0.25, 0.25]} rotation={[0, 0, 1.4]}>
                <cylinderGeometry args={[0.12, 0.12, 0.7, 6]} />
            </mesh>
        </group>
    );
}

/** Mange små bål i skogen: de andre som har tatt eden. */
function Baalene({ vis }: { vis: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const n = 70;
    const skala = useRef(0);
    useFrame((_, d) => {
        skala.current = damp(skala.current, vis ? 1 : 0, 2, Math.min(d, 0.05));
        const o = new THREE.Object3D();
        for (let i = 0; i < n; i++) {
            const r = 14 + Math.sqrt(frø(i + 4000)) * 120;
            const a = frø(i + 4100) * Math.PI * 2;
            o.position.set(Math.cos(a) * r, 0.6, Math.sin(a) * r - 40);
            const s = skala.current * (0.9 + frø(i + 4200) * 0.6);
            o.scale.set(s, s, s);
            o.updateMatrix();
            ref.current?.setMatrixAt(i, o.matrix);
        }
        if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, n]} material={mat.bal}>
            <sphereGeometry args={[0.9, 6, 5]} />
        </instancedMesh>
    );
}

/** Rundhytter som instanser. Posisjonen glir mellom «spredt» og «reservat». */
const HYTTER = 140;
const SPREDT = Array.from({ length: HYTTER }, (_, i) => v(-130 + frø(i + 10) * 230, 0, -60 + frø(i + 20) * 130));
const RESERVAT = Array.from({ length: HYTTER }, (_, i) => v(-88 + frø(i + 30) * 50, 0, -26 + frø(i + 40) * 56));

function Hytter({ samlet, kunReservat }: { samlet: boolean; kunReservat: boolean }) {
    const vegg = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const k = useRef(samlet ? 1 : 0);
    const forste = useRef(true);
    useFrame((_, d) => {
        k.current = forste.current ? (samlet ? 1 : 0) : damp(k.current, samlet ? 1 : 0, 1.1, Math.min(d, 0.05));
        forste.current = false;
        const o = new THREE.Object3D();
        const p = new THREE.Vector3();
        for (let i = 0; i < HYTTER; i++) {
            p.lerpVectors(kunReservat ? RESERVAT[i] : SPREDT[i], RESERVAT[i], k.current);
            o.position.set(p.x, 1, p.z);
            o.updateMatrix();
            vegg.current?.setMatrixAt(i, o.matrix);
            o.position.set(p.x, 2.7, p.z);
            o.updateMatrix();
            tak.current?.setMatrixAt(i, o.matrix);
        }
        if (vegg.current) vegg.current.instanceMatrix.needsUpdate = true;
        if (tak.current) tak.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={vegg} args={[undefined, undefined, HYTTER]} material={mat.vegg}>
                <cylinderGeometry args={[1.5, 1.5, 2, 8]} />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, HYTTER]} material={mat.gress}>
                <coneGeometry args={[2, 1.6, 8]} />
            </instancedMesh>
        </>
    );
}

/** Nybyggernes store gårder: hvite hus med teglrødt tak og lange åkerstriper. */
function Gaarder({ vis }: { vis: boolean }) {
    const g = useRef<THREE.Group>(null);
    useFrame((_, d) => {
        if (!g.current) return;
        const s = damp(g.current.scale.y, vis ? 1 : 0.001, 2, Math.min(d, 0.05));
        g.current.scale.set(1, s, 1);
        g.current.visible = s > 0.03;
    });
    const hus: [number, number][] = [
        [30, -30],
        [80, 30],
        [45, 25],
    ];
    return (
        <group ref={g} scale={[1, 0.001, 1]} visible={false}>
            {Array.from({ length: 14 }, (_, i) => (
                <mesh key={i} material={mat.aker} position={[60, 0.15, -55 + i * 8]}>
                    <boxGeometry args={[110, 0.3, 4.5]} />
                </mesh>
            ))}
            {hus.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh material={mat.hus} position={[0, 2.5, 0]}>
                        <boxGeometry args={[10, 5, 7]} />
                    </mesh>
                    <mesh material={mat.taktegl} position={[0, 6.2, 0]} rotation={[0, Math.PI / 4, 0]}>
                        <coneGeometry args={[7.5, 3, 4]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Gjerde langs en rektangel: stolper og tre tråder per side. */
function Gjerde({ x0, z0, x1, z1, vis = true }: { x0: number; z0: number; x1: number; z1: number; vis?: boolean }) {
    const sider: [number, number, number, number][] = [
        [x0, z0, x1, z0],
        [x1, z0, x1, z1],
        [x1, z1, x0, z1],
        [x0, z1, x0, z0],
    ];
    if (!vis) return null;
    return (
        <>
            {sider.map(([ax, az, bx, bz], i) => {
                const len = Math.hypot(bx - ax, bz - az);
                const n = Math.round(len / 6);
                const vinkel = Math.atan2(bz - az, bx - ax);
                return (
                    <group key={i}>
                        {Array.from({ length: n + 1 }, (_, j) => (
                            <mesh key={j} material={mat.stolpe} position={[ax + ((bx - ax) * j) / n, 1.4, az + ((bz - az) * j) / n]}>
                                <boxGeometry args={[0.25, 2.8, 0.25]} />
                            </mesh>
                        ))}
                        {[0.8, 1.6, 2.4].map((h) => (
                            <mesh key={h} material={mat.traad} position={[(ax + bx) / 2, h, (az + bz) / 2]} rotation={[0, -vinkel, 0]}>
                                <boxGeometry args={[len, 0.06, 0.06]} />
                            </mesh>
                        ))}
                    </group>
                );
            })}
        </>
    );
}

function Vakttaarn({ x, z }: { x: number; z: number }) {
    return (
        <group position={[x, 0, z]}>
            {[
                [-1.2, -1.2],
                [1.2, -1.2],
                [-1.2, 1.2],
                [1.2, 1.2],
            ].map(([a, b], i) => (
                <mesh key={i} material={mat.taarn} position={[a, 4, b]}>
                    <boxGeometry args={[0.35, 8, 0.35]} />
                </mesh>
            ))}
            <mesh material={mat.taarn} position={[0, 8.4, 0]}>
                <boxGeometry args={[3.6, 0.5, 3.6]} />
            </mesh>
            <mesh material={mat.taarn} position={[0, 9.5, 1.7]}>
                <boxGeometry args={[3.6, 1.6, 0.2]} />
            </mesh>
            <mesh material={mat.gress} position={[0, 11.4, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[3.2, 2, 4]} />
            </mesh>
        </group>
    );
}

/** Ny landsby: hytter i rader innenfor gjerdet. */
function Landsby() {
    const hytter = useMemo(() => {
        const ut: [number, number][] = [];
        for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (i || j) ut.push([i * 6 + (j % 2) * 1.5, j * 6]);
        return ut;
    }, []);
    return (
        <>
            {hytter.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh material={mat.vegg} position={[0, 1, 0]}>
                        <cylinderGeometry args={[1.5, 1.5, 2, 8]} />
                    </mesh>
                    <mesh material={mat.gress} position={[0, 2.7, 0]}>
                        <coneGeometry args={[2, 1.6, 8]} />
                    </mesh>
                </group>
            ))}
            <Gjerde x0={-24} z0={-24} x1={24} z1={24} />
            <Vakttaarn x={-22} z={-22} />
            <Vakttaarn x={22} z={-22} />
            <Vakttaarn x={22} z={22} />
            <Vakttaarn x={-22} z={22} />
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera(modus, beat, playing);
    const natt = modus === 'skog';
    const graa = modus === 'landsby';
    const himmel = natt ? '#28344f' : graa ? '#c3c7c9' : '#cfe0ea';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, natt ? 60 : 90, natt ? 700 : 620]} />
            <ambientLight intensity={natt ? 0.55 : 0.75} color={natt ? '#8ea4d4' : '#f5efe2'} />
            <directionalLight position={[-80, 120, 60]} intensity={natt ? 0.45 : graa ? 0.9 : 1.4} color={natt ? '#b9c8f0' : '#fff4dc'} />
            <hemisphereLight args={[natt ? '#506088' : '#e8eef0', natt ? '#1c2418' : '#5b5136', 0.55]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1400, 1400]} />
                <meshStandardMaterial
                    color={natt ? '#2c3b2a' : graa ? '#8d8670' : '#a39a5c'}
                    emissive={natt ? '#121a14' : '#2b2814'}
                    emissiveIntensity={0.5}
                    roughness={1}
                />
            </mesh>
            <Fjellet />
            {modus === 'skog' && (
                <>
                    <Skog antall={150} midt={[0, -30]} radius={140} fri={7} frøStart={1} />
                    <Baal playing={playing} />
                    <Skikkelse />
                    <Baalene vis={beat >= 3} />
                </>
            )}
            {modus === 'jord' && (
                <>
                    <Hytter samlet={beat >= 1} kunReservat={false} />
                    <Gjerde x0={-92} z0={-30} x1={-34} z1={34} vis={beat >= 1} />
                    <Gaarder vis={beat >= 1} />
                    <Skog antall={60} midt={[0, -200]} radius={110} fri={0} frøStart={500} />
                </>
            )}
            {modus === 'landsby' && (
                <>
                    <Landsby />
                    <Skog antall={110} midt={[0, -140]} radius={80} fri={0} frøStart={800} />
                </>
            )}
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    skog: ['Mount Kenya, natt', 'Eden: kjempe til jorda er tilbake', 'Straffen kan være døden', 'En av mange tusen'],
    jord: ['1915: en ny lov om jorda', 'Reservatene', null, 'De store gårdene'],
    landsby: [
        'De nye landsbyene',
        'Piggtråd og vakttårn',
        'Ingen mat og våpen ut til skogen',
        'Kildene fra leirene',
        'Over 1000 hengt',
    ],
};

const UNDER: Record<Modus, (string | null)[]> = {
    skog: [null, null, null, null],
    jord: ['tok de siste rettighetene til jorda', 'områder satt av til afrikanere', null, 'hele kolonien bygd rundt dem'],
    landsby: [
        'rundt 1,2 millioner kikuyuer, rundt 850 landsbyer',
        null,
        null,
        'tortur, seksuell vold, tvunget til å bli kristne',
        'uten rett til å anke, altså be om ny dom',
    ],
};

export function MauMauLandskap({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'skog';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const i = Math.min(beat, MERKER[modus].length - 1);
    const tekst = MERKER[modus][i];
    const under = UNDER[modus][i];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 1200, position: [-40, 20, 70] }}
                gl={{ antialias: true }}
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
                        className="absolute top-[6%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 px-6 py-2 rounded-2xl bg-white/90 shadow-xl"
                    >
                        <div className="text-slate-900 font-display font-bold text-3xl whitespace-nowrap">{tekst}</div>
                        {under && <div className="text-slate-600 font-semibold text-xl whitespace-nowrap">{under}</div>}
                    </motion.div>
                )}
            </AnimatePresence>
            {modus === 'jord' && beat === 2 && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-[8%] left-[4%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl"
                    >
                        <div className="text-3xl font-black text-amber-800">rundt én million</div>
                        <div className="text-xl font-semibold text-slate-600">kikuyuer i reservatene</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="absolute bottom-[8%] right-[4%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-right"
                    >
                        <div className="text-3xl font-black text-red-700">rundt 3000 familier</div>
                        <div className="text-xl font-semibold text-slate-600">europeiske, med mer jord</div>
                    </motion.div>
                </>
            )}
        </div>
    );
}
