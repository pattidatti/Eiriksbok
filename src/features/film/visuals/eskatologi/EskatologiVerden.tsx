import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * En liten verden i 3D: ei øy i havet med fjell og skog. «leirbal»: mennesker rundt et bål
 * under stjernene. «vinter»: ragnarok begynner, krig og Fimbulvinteren. «kaos»: ulvene sluker
 * sola og månen, Midgardsormen stiger opp, Surt brenner verden. «ny»: en grønn jord stiger opp
 * av havet, med fossefall, åkre og Liv og Livtrase i skogen.
 */

type Modus = 'leirbal' | 'vinter' | 'kaos' | 'ny';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

interface Tilstand {
    himmel: string;
    bakke: string;
    tre: string;
    hav: string;
    lys: number;
    sno: number;
    ild: number;
    sol: number;
    maane: number;
    stjerner: boolean;
    orm: number;
    oy: number;
    leir: boolean;
    foss: boolean;
    aker: boolean;
    par: boolean;
    dugg: boolean;
    ulv: boolean;
    lyn: boolean;
}

const GRUNN: Tilstand = {
    himmel: '#7fb6e6',
    bakke: '#5f9a4a',
    tre: '#2f6b3a',
    hav: '#2f6fa8',
    lys: 1,
    sno: 0,
    ild: 0,
    sol: 1,
    maane: 0,
    stjerner: false,
    orm: 0,
    oy: 0,
    leir: false,
    foss: false,
    aker: false,
    par: false,
    dugg: false,
    ulv: false,
    lyn: false,
};

function tilstand(modus: Modus, beat: number, t: number): Tilstand {
    if (modus === 'leirbal') {
        const natt = {
            ...GRUNN,
            himmel: '#0b1734',
            bakke: '#2f4a2c',
            tre: '#1d3a26',
            hav: '#16365e',
            lys: 0.45,
            sol: 0,
            maane: 1,
            stjerner: true,
            leir: true,
        };
        if (beat >= 2) return { ...natt, himmel: '#1d2a50', sol: 0.55 };
        return natt;
    }
    if (modus === 'vinter') {
        if (beat === 0) return GRUNN;
        if (beat === 1) return { ...GRUNN, himmel: '#5d6f86', lys: 0.75 };
        if (beat === 2)
            return { ...GRUNN, himmel: '#7a3b2e', bakke: '#5c6b3c', lys: 0.7, ild: 0.35 };
        return {
            ...GRUNN,
            himmel: '#a9b6c4',
            bakke: '#eef3f8',
            tre: '#d7e2ec',
            hav: '#6f8ca6',
            lys: 0.85,
            sno: 1,
            sol: 0.35,
        };
    }
    if (modus === 'kaos') {
        const mork = {
            ...GRUNN,
            himmel: '#1a1426',
            bakke: '#d9e2ea',
            tre: '#b9c6d3',
            hav: '#1b2f45',
            lys: 0.5,
            sno: 0,
            sol: 0,
            maane: 0,
            ulv: false,
        };
        if (beat === 0) {
            const igjen = THREE.MathUtils.clamp(1 - (t - 2) / 5, 0.25, 1);
            return { ...mork, himmel: '#2a2440', sol: igjen, maane: igjen, stjerner: true, ulv: true };
        }
        if (beat === 1) return { ...mork, himmel: '#0d0a14' };
        if (beat === 2) return { ...mork, himmel: '#0d0a14', orm: 1 };
        if (beat === 3) return { ...mork, himmel: '#0d0a14', orm: 1, lyn: true };
        return {
            ...mork,
            himmel: '#5a1a0c',
            bakke: '#3a1d12',
            tre: '#1b0f0a',
            hav: '#4a1d14',
            lys: 0.9,
            sno: 0,
            ild: 1,
            orm: 0,
        };
    }
    // ny
    if (beat === 0)
        return {
            ...GRUNN,
            himmel: '#2c3550',
            hav: '#24527e',
            lys: 0.6,
            sol: 0.6,
            oy: -3.2,
        };
    const gronn = {
        ...GRUNN,
        himmel: '#8ec9f0',
        bakke: '#6fbf4f',
        tre: '#2f8a3f',
        hav: '#2b7fc0',
        lys: 1.1,
        foss: true,
        aker: true,
    };
    if (beat === 1) return gronn;
    if (beat === 2) return { ...gronn, par: true };
    if (beat === 3) return { ...gronn, par: true, dugg: true, himmel: '#f3c9a0', lys: 0.95 };
    return { ...gronn, par: true };
}

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'leirbal') {
        if (beat === 0) return { pos: v(4 + t * 0.15, 2.4, 8.5), se: v(0, 0.8, 3) };
        if (beat === 1) return { pos: v(3, 1.8, 9), se: v(14, 12, -30) };
        return { pos: v(26, 13 + t * 0.2, 30), se: v(0, 1, 0) };
    }
    if (modus === 'vinter') {
        if (beat === 0) return { pos: v(28 - t * 0.5, 14, 26), se: v(0, 1, 0) };
        if (beat === 1) return { pos: v(-8, 6, 22), se: v(0, 6, -20) };
        if (beat === 2) return { pos: v(18, 9, 18), se: v(0, 0.5, 0) };
        return { pos: v(-20, 11 + t * 0.2, 22), se: v(0, 1, 0) };
    }
    if (modus === 'kaos') {
        if (beat <= 1) return { pos: v(0, 4, 26), se: v(0, 13, -40) };
        if (beat === 2) return { pos: v(4, 5, 30), se: v(2, 2, 9) };
        if (beat === 3) return { pos: v(-14, 7, 28), se: v(0, 2, 6) };
        return { pos: v(26, 12, 34), se: v(0, 6, -6) };
    }
    if (beat === 0) return { pos: v(26, 10, 30), se: v(0, 0, 0) };
    if (beat === 1) return { pos: v(-16 + t * 0.4, 9, 22), se: v(-1, 2, -3) };
    if (beat === 2) return { pos: v(8, 3.2, 10), se: v(4, 1, 2) };
    if (beat === 3) return { pos: v(6.2, 1.6, 4.6), se: v(4.2, 0.9, 1.8) };
    return { pos: v(30, 16, 30), se: v(0, 1, 0) };
}

/** Plasser for trærne: på øya, men ikke midt på bålplassen eller under fjellene. */
const TRAER = Array.from({ length: 40 }, (_, i) => {
    const r = 3 + frø(i) * 6.3;
    const a = frø(i + 50) * Math.PI * 2;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.7 + frø(i + 99) * 0.6 };
}).filter((p) => !(p.z < -2.5 && Math.abs(p.x) < 6) && !(Math.hypot(p.x, p.z - 3) < 2.2));

const FLAMMER = Array.from({ length: 36 }, (_, i) => {
    const r = 1 + frø(i + 7) * 8.5;
    const a = frø(i + 17) * Math.PI * 2;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, f: frø(i + 3) * 6 };
});

const SNO_ANTALL = 260;

function Snø({ mengde }: { mengde: React.RefObject<number> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const fnugg = useMemo(
        () =>
            Array.from({ length: SNO_ANTALL }, (_, i) => ({
                x: (frø(i) - 0.5) * 40,
                y: frø(i + 300) * 22,
                z: (frø(i + 600) - 0.5) * 40,
            })),
        []
    );
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = Math.min(rawDt, 0.05);
        const s = mengde.current ?? 0;
        m.visible = s > 0.02;
        fnugg.forEach((f, i) => {
            f.y -= dt * 2.2;
            if (f.y < 0) f.y = 22;
            o.position.set(f.x + Math.sin(f.y + i) * 0.4, f.y, f.z);
            o.scale.setScalar(0.12 * s);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, SNO_ANTALL]}>
            <sphereGeometry args={[1, 5, 4]} />
            <meshBasicMaterial color="#ffffff" />
        </instancedMesh>
    );
}

function Flammer({ mengde }: { mengde: React.RefObject<number> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const o = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += Math.min(rawDt, 0.05);
        const s = mengde.current ?? 0;
        m.visible = s > 0.02;
        FLAMMER.forEach((f, i) => {
            const flakk = 0.75 + Math.sin(tid.current * 7 + f.f) * 0.25;
            o.position.set(f.x, 0.6 * s * flakk, f.z);
            o.scale.set(0.7 * s, 1.6 * s * flakk, 0.7 * s);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, FLAMMER.length]}>
            <coneGeometry args={[0.6, 1.5, 6]} />
            <meshBasicMaterial color="#ff7a1a" transparent opacity={0.9} />
        </instancedMesh>
    );
}

function Figur({ farge, ...p }: { farge: string; position: [number, number, number] }) {
    return (
        <group {...p}>
            <mesh position={[0, 0.35, 0]}>
                <cylinderGeometry args={[0.14, 0.2, 0.7, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, 0.82, 0]}>
                <sphereGeometry args={[0.15, 10, 8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
        </group>
    );
}

/** Et ulvehode av kjegler og kuler: svart siluett mot himmelen. */
function Ulvehode({ skala }: { skala: number }) {
    return (
        <group scale={skala}>
            <mesh>
                <sphereGeometry args={[1, 14, 10]} />
                <meshBasicMaterial color="#05040a" />
            </mesh>
            <mesh position={[1.1, -0.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.55, 1.4, 10]} />
                <meshBasicMaterial color="#05040a" />
            </mesh>
            {[-0.45, 0.35].map((x) => (
                <mesh key={x} position={[x, 1.05, 0]}>
                    <coneGeometry args={[0.3, 0.8, 6]} />
                    <meshBasicMaterial color="#05040a" />
                </mesh>
            ))}
            <mesh position={[0.55, 0.25, 0.6]}>
                <sphereGeometry args={[0.12, 8, 6]} />
                <meshBasicMaterial color="#ef4444" />
            </mesh>
        </group>
    );
}

const ORM_KURVE = new THREE.CatmullRomCurve3(
    Array.from({ length: 10 }, (_, i) =>
        v(-12 + i * 2.6, Math.sin(i * 0.95) * 2.2 + (i === 9 ? 1.6 : 0), 10 + Math.cos(i * 0.6) * 1.4)
    )
);

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());

    const himmel = useRef(new THREE.Color());
    const bakkeMat = useRef<THREE.MeshStandardMaterial>(null);
    const treMat = useRef<THREE.MeshStandardMaterial>(null);
    const havMat = useRef<THREE.MeshStandardMaterial>(null);
    const bgRef = useRef<THREE.Color>(null);
    const fogRef = useRef<THREE.Fog>(null);
    const amb = useRef<THREE.AmbientLight>(null);
    const dir = useRef<THREE.DirectionalLight>(null);
    const sol = useRef<THREE.Mesh>(null);
    const maane = useRef<THREE.Mesh>(null);
    const ulvA = useRef<THREE.Group>(null);
    const ulvB = useRef<THREE.Group>(null);
    const stjerner = useRef<THREE.Group>(null);
    const orm = useRef<THREE.Group>(null);
    const surt = useRef<THREE.Group>(null);
    const oy = useRef<THREE.Group>(null);
    const leir = useRef<THREE.Group>(null);
    const baal = useRef<THREE.PointLight>(null);
    const foss = useRef<THREE.Group>(null);
    const aker = useRef<THREE.Group>(null);
    const par = useRef<THREE.Group>(null);
    const dugg = useRef<THREE.Group>(null);
    const sno = useRef(0);
    const ild = useRef(0);
    const tid = useRef(0);

    const trePos = useMemo(() => {
        const o = new THREE.Object3D();
        return TRAER.map((p) => {
            o.position.set(p.x, 0.9 * p.s, p.z);
            o.scale.setScalar(p.s);
            o.updateMatrix();
            return o.matrix.clone();
        });
    }, []);
    const treRef = useRef<THREE.InstancedMesh>(null);
    const treKlar = useRef(false);

    const ormGeo = useMemo(() => new THREE.TubeGeometry(ORM_KURVE, 80, 0.7, 10, false), []);
    const ormHode = useMemo(() => ORM_KURVE.getPoint(1), []);

    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        tid.current += dt;
        const t = beatTid.current;
        const s = tilstand(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.6 * dt);

        if (treRef.current && !treKlar.current) {
            trePos.forEach((m, i) => treRef.current!.setMatrixAt(i, m));
            treRef.current.instanceMatrix.needsUpdate = true;
            treKlar.current = true;
        }

        himmel.current.lerp(new THREE.Color(s.himmel), k);
        if (bgRef.current) bgRef.current.copy(himmel.current);
        if (fogRef.current) fogRef.current.color.copy(himmel.current);
        bakkeMat.current?.color.lerp(new THREE.Color(s.bakke), k);
        treMat.current?.color.lerp(new THREE.Color(s.tre), k);
        havMat.current?.color.lerp(new THREE.Color(s.hav), k);
        if (havMat.current) havMat.current.emissive.copy(havMat.current.color).multiplyScalar(0.25);

        let lys = s.lys;
        if (s.lyn && playing && Math.sin(tid.current * 2.3) > 0.93) lys = 2.4;
        if (amb.current) amb.current.intensity = forste.current ? lys * 0.6 : damp(amb.current.intensity, lys * 0.6, s.lyn ? 30 : 2, dt);
        if (dir.current) dir.current.intensity = forste.current ? lys : damp(dir.current.intensity, lys, 2, dt);

        sno.current = forste.current ? s.sno : damp(sno.current, s.sno, 1.5, dt);
        ild.current = forste.current ? s.ild : damp(ild.current, s.ild, 1.5, dt);

        const skaler = (o: THREE.Object3D | null, mål: number, l = 2) => {
            if (!o) return;
            const n = forste.current ? mål : damp(o.scale.x, mål, l, dt);
            o.scale.setScalar(Math.max(n, 0.0001));
            o.visible = n > 0.02;
        };
        skaler(sol.current, s.sol);
        skaler(maane.current, s.maane);

        // Ulvene glir inn over sola og månen.
        const ulvMål = modus === 'kaos' && beat === 0 ? Math.min(1, t / 4) : 1;
        if (ulvA.current) {
            ulvA.current.visible = s.ulv;
            ulvA.current.position.set(-34 + 9.5 * ulvMål, 16, -38);
        }
        if (ulvB.current) {
            ulvB.current.visible = s.ulv;
            ulvB.current.position.set(32 - 8 * ulvMål, 18, -38);
        }
        if (stjerner.current) stjerner.current.visible = s.stjerner;

        if (orm.current) {
            const y = forste.current ? (s.orm ? 0 : -9) : damp(orm.current.position.y, s.orm ? 0 : -9, 1.2, dt);
            orm.current.position.y = y;
            orm.current.visible = y > -8.5;
        }
        if (oy.current) oy.current.position.y = forste.current ? s.oy : damp(oy.current.position.y, s.oy, 0.9, dt);
        if (surt.current) {
            const mål = s.ild > 0.5 ? 1 : 0;
            const n = forste.current ? mål : damp(surt.current.scale.x, mål, 1.2, dt);
            surt.current.scale.setScalar(Math.max(n, 0.0001));
            surt.current.visible = n > 0.02;
        }
        if (leir.current) leir.current.visible = s.leir;
        if (baal.current) baal.current.intensity = s.leir ? 6 + Math.sin(tid.current * 9) * 1.2 : 0;
        if (foss.current) foss.current.visible = s.foss;
        if (aker.current) aker.current.visible = s.aker;
        if (par.current) par.current.visible = s.par;
        if (dugg.current) {
            dugg.current.visible = s.dugg;
            dugg.current.children.forEach((c, i) => {
                c.scale.setScalar(0.6 + Math.sin(tid.current * 3 + i) * 0.4);
            });
        }

        const m = kameraFor(modus, beat, t);
        camera.position.lerp(m.pos, forste.current ? 1 : 1 - Math.exp(-1.3 * dt));
        se.current.lerp(m.se, forste.current ? 1 : 1 - Math.exp(-1.3 * dt));
        camera.lookAt(se.current);
        forste.current = false;
    });

    return (
        <>
            <color ref={bgRef} attach="background" args={['#7fb6e6']} />
            <fog ref={fogRef} attach="fog" args={['#7fb6e6', 70, 200]} />
            <ambientLight ref={amb} intensity={0.6} />
            <directionalLight ref={dir} position={[20, 30, 15]} intensity={1} />
            <hemisphereLight args={['#dbeafe', '#1e293b', 0.35]} />

            <group ref={stjerner}>
                <Stars radius={120} depth={30} count={1800} factor={5} fade speed={0.3} />
            </group>
            <mesh ref={sol} position={[-22, 16, -40]}>
                <sphereGeometry args={[3.4, 24, 16]} />
                <meshBasicMaterial color="#ffd36b" fog={false} />
            </mesh>
            <mesh ref={maane} position={[22, 18, -40]}>
                <sphereGeometry args={[2.6, 24, 16]} />
                <meshBasicMaterial color="#e5e7f0" fog={false} />
            </mesh>
            <group ref={ulvA}>
                <Ulvehode skala={3.6} />
            </group>
            <group ref={ulvB} rotation={[0, Math.PI, 0]}>
                <Ulvehode skala={3} />
            </group>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                <planeGeometry args={[600, 600]} />
                <meshStandardMaterial ref={havMat} color="#2f6fa8" roughness={0.4} metalness={0.15} />
            </mesh>

            <group ref={oy}>
                <mesh position={[0, -1.1, 0]}>
                    <cylinderGeometry args={[10, 11.5, 2.4, 40]} />
                    <meshStandardMaterial ref={bakkeMat} color="#5f9a4a" flatShading />
                </mesh>
                {[
                    { x: -3.5, z: -5.5, h: 5.5, r: 2.6 },
                    { x: 0.5, z: -6.5, h: 7, r: 3 },
                    { x: 4, z: -5, h: 4.5, r: 2.2 },
                ].map((f) => (
                    <group key={f.x} position={[f.x, 0, f.z]}>
                        <mesh position={[0, f.h / 2, 0]}>
                            <coneGeometry args={[f.r, f.h, 7]} />
                            <meshStandardMaterial color="#7c8592" flatShading />
                        </mesh>
                        <mesh position={[0, f.h * 0.86, 0]}>
                            <coneGeometry args={[f.r * 0.3, f.h * 0.28, 7]} />
                            <meshStandardMaterial color="#f8fafc" flatShading />
                        </mesh>
                    </group>
                ))}
                <instancedMesh ref={treRef} args={[undefined, undefined, TRAER.length]}>
                    <coneGeometry args={[0.55, 1.8, 6]} />
                    <meshStandardMaterial ref={treMat} color="#2f6b3a" flatShading />
                </instancedMesh>

                <group ref={foss} position={[1.6, 0, -4.4]}>
                    <mesh position={[0, 2.4, 0]} rotation={[-0.25, 0, 0]}>
                        <planeGeometry args={[0.9, 4.8]} />
                        <meshStandardMaterial color="#bfe6ff" emissive="#7cc4f0" emissiveIntensity={0.6} side={THREE.DoubleSide} />
                    </mesh>
                    <mesh position={[0, 0.08, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[1.1, 16]} />
                        <meshStandardMaterial color="#e0f4ff" emissive="#9bd4f5" emissiveIntensity={0.5} />
                    </mesh>
                </group>
                <group ref={aker}>
                    {[
                        [-5, 2.5],
                        [-3, 5.5],
                        [0.5, 7],
                        [-6.5, -0.5],
                    ].map(([x, z], i) => (
                        <mesh key={i} position={[x, 0.12, z]} rotation={[0, i * 0.4, 0]}>
                            <boxGeometry args={[2.2, 0.08, 1.5]} />
                            <meshStandardMaterial color={i % 2 ? '#e3c25a' : '#c9d75a'} />
                        </mesh>
                    ))}
                </group>
                <group ref={par}>
                    <Figur farge="#fef3c7" position={[4.2, 0.1, 1.6]} />
                    <Figur farge="#fde68a" position={[4.75, 0.1, 1.9]} />
                </group>
                <group ref={dugg}>
                    {Array.from({ length: 14 }, (_, i) => (
                        <mesh key={i} position={[3.4 + frø(i) * 2.2, 0.5 + frø(i + 9) * 1.4, 1 + frø(i + 4) * 1.6]}>
                            <sphereGeometry args={[0.05, 6, 4]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                    ))}
                </group>

                <group ref={leir} position={[0, 0.1, 3]}>
                    <mesh position={[0, 0.35, 0]}>
                        <coneGeometry args={[0.35, 0.8, 7]} />
                        <meshBasicMaterial color="#ff9a2e" />
                    </mesh>
                    <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0.6]}>
                        <cylinderGeometry args={[0.07, 0.07, 0.9, 6]} />
                        <meshStandardMaterial color="#4a2d1a" />
                    </mesh>
                    <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, -0.6]}>
                        <cylinderGeometry args={[0.07, 0.07, 0.9, 6]} />
                        <meshStandardMaterial color="#4a2d1a" />
                    </mesh>
                    <pointLight ref={baal} position={[0, 0.8, 0]} color="#ffae5a" distance={9} decay={1.6} />
                    {[0, 1, 2, 3, 4].map((i) => {
                        const a = (i / 5) * Math.PI * 2 + 0.3;
                        return <Figur key={i} farge="#1f1b2e" position={[Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3]} />;
                    })}
                </group>
            </group>

            <group ref={orm} position={[0, -9, 0]}>
                <mesh geometry={ormGeo}>
                    <meshStandardMaterial color="#2f5d3a" emissive="#143a22" emissiveIntensity={0.6} flatShading />
                </mesh>
                <mesh position={ormHode}>
                    <sphereGeometry args={[1.1, 12, 10]} />
                    <meshStandardMaterial color="#2f5d3a" emissive="#143a22" emissiveIntensity={0.6} flatShading />
                </mesh>
                <mesh position={[ormHode.x + 0.6, ormHode.y + 0.4, ormHode.z + 0.8]}>
                    <sphereGeometry args={[0.18, 8, 6]} />
                    <meshBasicMaterial color="#facc15" />
                </mesh>
            </group>

            {/* Surt: en kjempe av flammer som reiser seg bak fjellene. */}
            <group ref={surt} position={[0, 0, -16]}>
                <mesh position={[0, 7, 0]}>
                    <cylinderGeometry args={[2.2, 3.6, 14, 10]} />
                    <meshBasicMaterial color="#ff5a1f" transparent opacity={0.85} />
                </mesh>
                <mesh position={[0, 15.8, 0]}>
                    <sphereGeometry args={[2.4, 14, 10]} />
                    <meshBasicMaterial color="#ff7a1a" transparent opacity={0.9} />
                </mesh>
                {[-1, 1].map((side) => (
                    <mesh key={side} position={[side * 4.4, 11, 0]} rotation={[0, 0, side * 0.6]}>
                        <cylinderGeometry args={[0.8, 1.1, 8, 8]} />
                        <meshBasicMaterial color="#ff5a1f" transparent opacity={0.85} />
                    </mesh>
                ))}
                <mesh position={[5.6, 17, 0]} rotation={[0, 0, -0.3]}>
                    <boxGeometry args={[0.6, 9, 0.6]} />
                    <meshBasicMaterial color="#fde047" />
                </mesh>
            </group>
            <Snø mengde={sno} />
            <Flammer mengde={ild} />
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    leirbal: [null, 'Hvordan ender det?', null],
    vinter: ['Ragnarok', 'Skjebnen: Urd', 'Tre år med ondskap og krig', 'Fimbulvinteren: tre vintre'],
    kaos: ['Skoll og Hate sluker sola og månen', 'Stjernene slukner', 'Midgardsormen', 'Gudene faller', 'Surt, jotne av flammer'],
    ny: ['↻ Men hjulet går rundt', 'En ny, grønn jord', 'Liv og Livtrase', 'Hoddmimes holt', 'Slutten ble en ny start'],
};

const KORT: Partial<Record<Modus, Record<number, { tittel: string; tekst: string }[]>>> = {
    vinter: {
        1: [
            { tittel: 'Odin og Tor', tekst: 'vet at de skal tape' },
            { tittel: 'Urd', tekst: 'skjebnen, sterkere enn gudene' },
        ],
        2: [
            { tittel: 'År 1 · 2 · 3', tekst: 'ondskap og krig' },
            { tittel: 'Bror mot bror', tekst: 'samfunnet går i oppløsning' },
        ],
    },
    kaos: {
        3: [
            { tittel: 'Odin', tekst: 'slukt av Fenrisulven' },
            { tittel: 'Tor', tekst: 'dreper ormen, dør av giften' },
        ],
    },
};

export function EskatologiVerden({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'leirbal';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const merke = MERKER[modus][Math.min(beat, MERKER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [26, 13, 30] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {merke && (
                    <motion.div
                        key={merke}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                        style={{ top: '7%' }}
                    >
                        {merke}
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
                {KORT[modus]?.[beat] && (
                    <motion.div
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute flex flex-col gap-3"
                        style={{ right: '3%', bottom: '8%', width: '30%' }}
                    >
                        {KORT[modus]![beat].map((k, i) => (
                            <motion.div
                                key={k.tittel}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 1.2 }}
                                className="rounded-2xl bg-white/95 shadow-xl px-5 py-3"
                            >
                                <div className="text-3xl font-black text-slate-900">{k.tittel}</div>
                                <div className="text-xl font-bold text-slate-600">{k.tekst}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
