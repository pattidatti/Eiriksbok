import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Vestfronten i 3D, i fire moduser:
 * - eng: en hær i fargerike uniformer marsjerer over åpne jorder, og langt unna venter et
 *   maskingevær bak sandsekker.
 * - mg: maskingeværet tett på, med vannkappe og mannskap. Til slutt står en hel tropp ved
 *   siden av, for å vise hvor mye ett gevær skjøt.
 * - krater: landskapet etter trommeilden, med krater, knuste trær og piggtråd. Kanonene
 *   blinker i horisonten.
 * - tank: en Mark I ruller over piggtråden og krysser en skyttergrav.
 *
 * Ingen skyter mot mennesker i bildet. Våpnene vises som ting.
 */

type Modus = 'eng' | 'mg' | 'krater' | 'tank';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Der maskingeværet står i eng-modus: på en lav haug langt fra hæren. */
const REIR = v(46, 0, -4);
/** Der skyttergraven går på tvers i tank-modus. */
const GRAV_X = 7;
const GRAV_B = 2.6;
/** Der piggtråden står i tank-modus. */
const TRAD_X = -3;

function kameraFor(modus: Modus, beat: number, t: number) {
    const s = Math.min(t, 12);
    if (modus === 'eng') {
        switch (beat) {
            case 0:
                return { pos: v(-20 + s * 0.6, 4, 20), se: v(0, 1, 0) };
            case 1:
                return { pos: v(-4.5, 1.7, 5.5), se: v(0, 1.1, 0) };
            case 2:
                return { pos: v(-14, 7 + s * 0.3, 18), se: v(2, 0.5, 0) };
            default:
                return { pos: v(REIR.x + 9, 4.2, REIR.z + 2), se: v(REIR.x - 14, 0.4, REIR.z + 1) };
        }
    }
    if (modus === 'mg') {
        switch (beat) {
            case 0:
                return { pos: v(3.6 - s * 0.08, 1.9, 3.4), se: v(0, 0.95, 0) };
            case 1:
                return { pos: v(-1.2, 1.5, 2.6), se: v(0.4, 1, 0) };
            case 2:
                return { pos: v(3, 2.6, 4.2), se: v(0, 0.9, 0) };
            default:
                return { pos: v(6, 6, 14), se: v(4, 0.6, 0) };
        }
    }
    if (modus === 'krater') {
        switch (beat) {
            case 0:
                return { pos: v(-24, 9, 24), se: v(0, 0, -10) };
            case 1:
                return { pos: v(-8, 4, 10), se: v(2, 0.4, -2) };
            case 2:
                return { pos: v(-14, 6, 18), se: v(10, 2, -30) };
            default:
                return { pos: v(-6 + s * 0.4, 30, 26), se: v(0, 0, -14) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-16, 4.5, 15), se: v(-6, 1, 0) };
        case 1:
            return { pos: v(-2, 3, 12), se: v(-3, 1.2, 0) };
        case 2:
            return { pos: v(5, 3.2, 9), se: v(0, 1.6, 0) };
        case 3:
            return { pos: v(GRAV_X + 6, 5, 13), se: v(GRAV_X, 0.5, 0) };
        default:
            return { pos: v(15, 3, 19), se: v(15, 1.3, 0) };
    }
}

/** Hvor langt tanken har kommet. Ruller sakte fram i beaten. */
function tankX(beat: number, t: number) {
    const s = Math.min(t, 10);
    switch (beat) {
        case 0:
            return -12 + s * 0.2;
        case 1:
            return -7 + s * 0.6;
        case 2:
            return -0.5 + s * 0.1;
        case 3:
            return 4 + s * 0.65;
        default:
            return 12 + s * 0.25;
    }
}

interface Figur {
    x: number;
    z: number;
    ry?: number;
}

/** Mange enkle soldatfigurer: bein, kropp og hode. Instansert, så det koster tre mesher. */
function Figurer({
    figurer,
    kropp,
    bein,
    hode = '#e7c9a9',
    hoyde = 1,
    gevaer = false,
}: {
    figurer: Figur[];
    kropp: string;
    bein: string;
    hode?: string;
    hoyde?: number;
    gevaer?: boolean;
}) {
    const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
    useLayoutEffect(() => {
        const o = new THREE.Object3D();
        const deler = [
            { y: 0.4, s: [0.34, 0.8, 0.26] },
            { y: 1.15, s: [0.46, 0.7, 0.3] },
            { y: 1.66, s: [0.18, 0.18, 0.18] },
            { y: 1.25, s: [0.06, 1.5, 0.06] },
        ];
        deler.forEach((d, k) => {
            const m = refs.current[k];
            if (!m) return;
            figurer.forEach((f, i) => {
                o.position.set(f.x + (k === 3 ? 0.3 : 0), d.y * hoyde, f.z + (k === 3 ? 0.18 : 0));
                o.rotation.set(0, f.ry ?? 0, 0);
                o.scale.set(d.s[0], d.s[1] * hoyde, d.s[2]);
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
            });
            m.instanceMatrix.needsUpdate = true;
        });
    }, [figurer, hoyde]);
    const farger = [bein, kropp, hode, '#3f2d1d'];
    return (
        <>
            {farger.slice(0, gevaer ? 4 : 3).map((f, k) => (
                <instancedMesh
                    key={k}
                    ref={(m) => {
                        refs.current[k] = m;
                    }}
                    args={[undefined, undefined, figurer.length]}
                    frustumCulled={false}
                >
                    {k === 2 ? <sphereGeometry args={[1, 10, 8]} /> : <boxGeometry args={[1, 1, 1]} />}
                    <meshLambertMaterial color={f} />
                </instancedMesh>
            ))}
        </>
    );
}

/** Sandsekker i en halvsirkel foran geværet. */
function Sandsekker({ radius = 1.6 }: { radius?: number }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const antall = 26;
    useLayoutEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < antall; i++) {
            const lag = i < 14 ? 0 : 1;
            const n = lag === 0 ? 14 : 12;
            const k = lag === 0 ? i : i - 14;
            const a = -Math.PI * 0.62 + (k / (n - 1)) * Math.PI * 1.24 + Math.PI;
            o.position.set(Math.cos(a) * radius, 0.18 + lag * 0.32, Math.sin(a) * radius);
            o.rotation.set(0, -a, 0);
            o.scale.set(0.42, 0.32, 0.75);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    }, [radius]);
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, antall]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshLambertMaterial color="#b9a37a" flatShading />
        </instancedMesh>
    );
}

/** Et tungt, vannkjølt maskingevær på stativ. Peker mot -x. */
function Maskingevaer({ glod = 0 }: { glod?: number }) {
    const kappe = useRef<THREE.MeshLambertMaterial>(null);
    useFrame(() => {
        if (kappe.current) kappe.current.emissiveIntensity += (glod - kappe.current.emissiveIntensity) * 0.08;
    });
    return (
        <group>
            {[0, 1, 2].map((i) => {
                const a = (i / 3) * Math.PI * 2 + 0.4;
                return (
                    <mesh key={i} position={[Math.cos(a) * 0.32, 0.3, Math.sin(a) * 0.32]} rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.72, 6]} />
                        <meshLambertMaterial color="#27272a" />
                    </mesh>
                );
            })}
            {/* Vannkappa rundt løpet */}
            <mesh position={[-0.55, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.13, 0.13, 1.0, 14]} />
                <meshLambertMaterial ref={kappe} color="#52525b" emissive="#38bdf8" emissiveIntensity={0} />
            </mesh>
            <mesh position={[-1.15, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
                <meshLambertMaterial color="#18181b" />
            </mesh>
            {/* Kassa og håndtakene */}
            <mesh position={[0.15, 0.8, 0]}>
                <boxGeometry args={[0.5, 0.26, 0.22]} />
                <meshLambertMaterial color="#3f3f46" />
            </mesh>
            <mesh position={[0.48, 0.8, 0]}>
                <boxGeometry args={[0.16, 0.08, 0.3]} />
                <meshLambertMaterial color="#27272a" />
            </mesh>
            {/* Slange til vannkanna */}
            <mesh position={[-0.4, 0.42, 0.35]} rotation={[0.9, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.8, 6]} />
                <meshLambertMaterial color="#1f2937" />
            </mesh>
            <mesh position={[-0.35, 0.16, 0.62]}>
                <cylinderGeometry args={[0.13, 0.15, 0.32, 10]} />
                <meshLambertMaterial color="#4d7c0f" />
            </mesh>
            {/* Ammunisjonskasse */}
            <mesh position={[0.2, 0.12, -0.5]}>
                <boxGeometry args={[0.45, 0.24, 0.28]} />
                <meshLambertMaterial color="#57534e" />
            </mesh>
        </group>
    );
}

function Mark1({ x }: { x: MutableRefObject<number> }) {
    const gruppe = useRef<THREE.Group>(null);
    const form = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-3.3, 0);
        s.lineTo(2.6, 0);
        s.lineTo(4.2, 1.5);
        s.lineTo(3.3, 2.6);
        s.lineTo(-3.6, 2.6);
        s.lineTo(-4.1, 1.3);
        s.closePath();
        return s;
    }, []);
    const indre = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-2.7, 0.45);
        s.lineTo(2.3, 0.45);
        s.lineTo(3.5, 1.5);
        s.lineTo(2.9, 2.15);
        s.lineTo(-3.1, 2.15);
        s.lineTo(-3.5, 1.3);
        s.closePath();
        return s;
    }, []);
    useFrame(() => {
        if (gruppe.current) gruppe.current.position.x = x.current;
    });
    return (
        <group ref={gruppe} position={[0, 0.02, 0]}>
            {[-1.25, 0.55].map((z) => (
                <group key={z} position={[0, 0, z]}>
                    <mesh>
                        <extrudeGeometry args={[form, { depth: 0.7, bevelEnabled: false }]} />
                        <meshLambertMaterial color="#3f3a2e" flatShading />
                    </mesh>
                    <mesh position={[0, 0, z < 0 ? -0.02 : 0.02]}>
                        <extrudeGeometry args={[indre, { depth: 0.74, bevelEnabled: false }]} />
                        <meshLambertMaterial color="#6b6a3a" flatShading />
                    </mesh>
                </group>
            ))}
            {/* Kroppen mellom beltene */}
            <mesh position={[-0.2, 1.45, 0]}>
                <boxGeometry args={[6.2, 1.9, 1.3]} />
                <meshLambertMaterial color="#5f5d33" />
            </mesh>
            <mesh position={[1.6, 2.75, 0]}>
                <boxGeometry args={[1.3, 0.5, 1.0]} />
                <meshLambertMaterial color="#57552f" />
            </mesh>
            {/* Kanontårnene på sidene */}
            {[-1, 1].map((side) => (
                <group key={side} position={[0, 1.5, side * 1.75]}>
                    <mesh>
                        <boxGeometry args={[1.8, 1.0, 0.7]} />
                        <meshLambertMaterial color="#64623a" flatShading />
                    </mesh>
                    <mesh position={[1.1, 0.1, side * 0.1]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
                        <meshLambertMaterial color="#27272a" />
                    </mesh>
                </group>
            ))}
            {/* Halehjulene bak */}
            {[-0.5, 0.5].map((z) => (
                <mesh key={z} position={[-4.9, 0.55, z]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.55, 0.55, 0.15, 14]} />
                    <meshLambertMaterial color="#3f3f46" />
                </mesh>
            ))}
            <mesh position={[-4.4, 0.75, 0]}>
                <boxGeometry args={[1.2, 0.12, 0.9]} />
                <meshLambertMaterial color="#3f3f46" />
            </mesh>
        </group>
    );
}

/** Piggtråd: stolper med spoler av tråd mellom. */
function Piggtrad({ x, lengde = 24, flat }: { x: number; lengde?: number; flat?: MutableRefObject<number> }) {
    const gruppe = useRef<THREE.Group>(null);
    const spoler = useRef<THREE.InstancedMesh>(null);
    const n = Math.round(lengde / 0.9);
    useLayoutEffect(() => {
        const m = spoler.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < n; i++) {
            o.position.set(0, 0.55, -lengde / 2 + i * 0.9);
            o.rotation.set(0, 0, 0);
            o.scale.set(1, 1, 1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    }, [n, lengde]);
    useFrame(() => {
        if (gruppe.current && flat) gruppe.current.scale.y += (flat.current - gruppe.current.scale.y) * 0.1;
    });
    return (
        <group ref={gruppe} position={[x, 0, 0]}>
            <instancedMesh ref={spoler} args={[undefined, undefined, n]} frustumCulled={false}>
                <torusGeometry args={[0.5, 0.025, 4, 10]} />
                <meshLambertMaterial color="#3f3f46" />
            </instancedMesh>
            {Array.from({ length: Math.ceil(n / 4) }, (_, i) => (
                <mesh key={i} position={[0, 0.6, -lengde / 2 + i * 3.6]}>
                    <cylinderGeometry args={[0.05, 0.05, 1.2, 5]} />
                    <meshLambertMaterial color="#4a3728" />
                </mesh>
            ))}
        </group>
    );
}

/** Krater i bakken: mørke skåler med en lys kant. */
function Krater({ antall, spredning }: { antall: number; spredning: number }) {
    const kant = useRef<THREE.InstancedMesh>(null);
    const bunn = useRef<THREE.InstancedMesh>(null);
    const liste = useMemo(
        () =>
            Array.from({ length: antall }, (_, i) => ({
                x: (frø(i + 11) - 0.5) * spredning * 1.6,
                z: (frø(i + 77) - 0.5) * spredning - spredning * 0.25,
                r: 1 + frø(i + 133) * 2.2,
            })).filter((k) => Math.abs(k.z) > 1.8),
        [antall, spredning]
    );
    useLayoutEffect(() => {
        const o = new THREE.Object3D();
        liste.forEach((k, i) => {
            o.position.set(k.x, 0.05, k.z);
            o.rotation.set(-Math.PI / 2, 0, 0);
            o.scale.set(k.r, k.r, 1);
            o.updateMatrix();
            kant.current?.setMatrixAt(i, o.matrix);
            o.position.set(k.x, 0.07, k.z);
            o.scale.set(k.r * 0.72, k.r * 0.72, 1);
            o.updateMatrix();
            bunn.current?.setMatrixAt(i, o.matrix);
        });
        if (kant.current) kant.current.instanceMatrix.needsUpdate = true;
        if (bunn.current) bunn.current.instanceMatrix.needsUpdate = true;
    }, [liste]);
    return (
        <>
            <instancedMesh ref={kant} args={[undefined, undefined, liste.length]} frustumCulled={false}>
                <circleGeometry args={[1, 12]} />
                <meshLambertMaterial color="#8a7a63" />
            </instancedMesh>
            <instancedMesh ref={bunn} args={[undefined, undefined, liste.length]} frustumCulled={false}>
                <circleGeometry args={[1, 12]} />
                <meshLambertMaterial color="#3b3024" />
            </instancedMesh>
        </>
    );
}

/** Knuste trestammer uten greiner. */
function Stammer() {
    const ref = useRef<THREE.InstancedMesh>(null);
    const liste = useMemo(
        () =>
            Array.from({ length: 18 }, (_, i) => ({
                x: (frø(i + 501) - 0.5) * 60,
                z: -6 - frø(i + 601) * 40,
                h: 1.5 + frø(i + 701) * 3,
                t: (frø(i + 801) - 0.5) * 0.5,
            })),
        []
    );
    useLayoutEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        liste.forEach((s, i) => {
            o.position.set(s.x, s.h / 2, s.z);
            o.rotation.set(0, 0, s.t);
            o.scale.set(1, s.h, 1);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    }, [liste]);
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, liste.length]} frustumCulled={false}>
            <cylinderGeometry args={[0.12, 0.22, 1, 5]} />
            <meshLambertMaterial color="#2f2a24" />
        </instancedMesh>
    );
}

/** Kanonene blinker i horisonten: lysende kuler som tennes og slukner. */
function Blink({ styrke }: { styrke: number }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    const punkter = useMemo(
        () => Array.from({ length: 7 }, (_, i) => ({ x: -36 + i * 12 + frø(i) * 6, z: -34 - frø(i + 9) * 8, fase: frø(i + 40) * 6 })),
        []
    );
    useFrame((_, raw) => {
        tid.current += Math.min(raw, 0.05);
        punkter.forEach((p, i) => {
            const m = refs.current[i];
            if (!m) return;
            const puls = Math.max(0, Math.sin(tid.current * 2.2 + p.fase * 3)) ** 8;
            const s = 0.01 + puls * 2.6 * styrke;
            m.scale.set(s, s, s);
        });
    });
    return (
        <>
            {punkter.map((p, i) => (
                <mesh
                    key={i}
                    position={[p.x, 2, p.z]}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                >
                    <sphereGeometry args={[1, 10, 8]} />
                    <meshBasicMaterial color="#fdba74" transparent opacity={0.85} fog={false} />
                </mesh>
            ))}
        </>
    );
}

const GAAENDE: Figur[] = [{ x: 0, z: 3.2, ry: 0 }];

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const pos = useRef(new THREE.Vector3());
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const tank = useRef(tankX(beat, 0));
    const tradFlat = useRef(1);
    const knust = useRef(1);
    const gaaer = useRef<THREE.Group>(null);
    const hær = useRef<THREE.Group>(null);

    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        pos.current.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.position.copy(pos.current);
        camera.lookAt(se.current);
        const kt = forste.current ? 1 : 1 - Math.exp(-1.6 * dt);
        tank.current += (tankX(beat, beatTid.current) - tank.current) * kt;
        tradFlat.current = tank.current + 4 > TRAD_X ? 0.25 : 1;
        knust.current = beat >= 1 ? 0.3 : 1;
        if (gaaer.current) gaaer.current.position.x = tank.current + 1;
        if (hær.current) hær.current.position.z = beat <= 2 ? -Math.min(beatTid.current, 14) * 0.25 : hær.current.position.z;
        forste.current = false;
    });

    const kolonne = useMemo<Figur[]>(() => {
        const ut: Figur[] = [];
        for (let r = 0; r < 10; r++) for (let c = 0; c < 4; c++) ut.push({ x: -2 + c * 1.1, z: -6 + r * 1.4, ry: 0 });
        return ut;
    }, []);
    const mannskap = useMemo<Figur[]>(
        () => [
            { x: 1.1, z: 0.25, ry: Math.PI / 2 },
            { x: 1.0, z: -0.75, ry: Math.PI / 2 },
        ],
        []
    );
    const tropp = useMemo<Figur[]>(() => {
        const ut: Figur[] = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) ut.push({ x: 3 + c * 0.9, z: -1.5 + r * 1.2, ry: Math.PI / 2 });
        return ut;
    }, []);

    const krater = modus === 'krater';
    const himmel = krater ? (beat === 2 ? '#8a8378' : '#b3aa9b') : modus === 'tank' ? '#c9c6ba' : '#cfe0ea';
    const bakke = krater || modus === 'tank' ? '#6b5a44' : '#6f8a4a';

    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, krater ? 25 : 30, krater ? 80 : 110]} />
            <hemisphereLight args={['#f8fafc', '#4b3f2c', 1.1]} />
            <directionalLight position={[-20, 30, 15]} intensity={1.1} color="#fff7ed" />

            {modus === 'tank' ? (
                <>
                    {/* Bakken med en grøft på tvers */}
                    <mesh position={[(GRAV_X - GRAV_B / 2 - 60) / 2, -1, 0]}>
                        <boxGeometry args={[60 + GRAV_X - GRAV_B / 2, 2, 80]} />
                        <meshLambertMaterial color={bakke} />
                    </mesh>
                    <mesh position={[(GRAV_X + GRAV_B / 2 + 60) / 2, -1, 0]}>
                        <boxGeometry args={[60 - GRAV_X - GRAV_B / 2, 2, 80]} />
                        <meshLambertMaterial color={bakke} />
                    </mesh>
                    <mesh position={[GRAV_X, -2.1, 0]}>
                        <boxGeometry args={[GRAV_B, 0.2, 80]} />
                        <meshLambertMaterial color="#3b2f22" />
                    </mesh>
                    {[-1, 1].map((s) => (
                        <mesh key={s} position={[GRAV_X + (s * GRAV_B) / 2, -1, 0]}>
                            <boxGeometry args={[0.08, 2, 80]} />
                            <meshLambertMaterial color="#7c5f3d" />
                        </mesh>
                    ))}
                    <Piggtrad x={TRAD_X} lengde={30} flat={tradFlat} />
                    <Krater antall={30} spredning={60} />
                    <Mark1 x={tank} />
                    {beat >= 4 && (
                        <group ref={gaaer}>
                            <Figurer figurer={GAAENDE} kropp="#1d4ed8" bein="#334155" />
                        </group>
                    )}
                </>
            ) : (
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[320, 320]} />
                    <meshLambertMaterial color={bakke} />
                </mesh>
            )}

            {modus === 'eng' && (
                <>
                    <group ref={hær}>
                        <Figurer figurer={kolonne} kropp="#1d4ed8" bein="#dc2626" gevaer />
                    </group>
                    <mesh position={[REIR.x, -2.2, REIR.z]} scale={[9, 3, 9]}>
                        <sphereGeometry args={[1, 16, 10]} />
                        <meshLambertMaterial color="#5f7a3e" />
                    </mesh>
                    <group position={[REIR.x, 0.6, REIR.z]} rotation={[0, -0.12, 0]}>
                        <Sandsekker />
                        <Maskingevaer />
                    </group>
                    {[-30, -12, 20, 70].map((x, i) => (
                        <mesh key={x} position={[x, -6, -40 - i * 6]} scale={[22, 8, 10]}>
                            <sphereGeometry args={[1, 14, 8]} />
                            <meshLambertMaterial color="#7a9455" />
                        </mesh>
                    ))}
                </>
            )}

            {modus === 'mg' && (
                <>
                    <Sandsekker />
                    <Maskingevaer glod={beat === 1 ? 0.7 : 0} />
                    <Figurer figurer={mannskap} kropp="#57534e" bein="#44403c" hoyde={0.62} />
                    {beat >= 3 && <Figurer figurer={tropp} kropp="#78716c" bein="#57534e" gevaer />}
                </>
            )}

            {krater && (
                <>
                    <Krater antall={90} spredning={90} />
                    <Stammer />
                    <Piggtrad x={0} lengde={50} flat={knust} />
                    <group rotation={[0, Math.PI / 2, 0]} position={[0, 0, -2]}>
                        <Piggtrad x={-14} lengde={50} flat={knust} />
                    </group>
                    <Blink styrke={beat === 3 ? 0.4 : 1} />
                </>
            )}
        </>
    );
}

const KORT: Record<Modus, { tittel: string; tekst?: string }[]> = {
    eng: [
        { tittel: '1914', tekst: 'hæren marsjerer ut' },
        { tittel: 'Fargerike uniformer', tekst: 'og bajonett på geværet' },
        { tittel: 'Angrep, mot og tapperhet', tekst: 'det trodde offiserene på' },
        { tittel: 'Men på den andre siden', tekst: 'venter en maskin' },
    ],
    mg: [
        { tittel: 'Maskingeværet', tekst: 'Maxim og Vickers' },
        { tittel: 'Kjølt med vann', tekst: 'flere mann for å bruke det' },
        { tittel: '400 til 600 skudd', tekst: 'i minuttet' },
        { tittel: 'Ett maskingevær', tekst: '= ildkraften til en hel tropp' },
    ],
    krater: [
        { tittel: 'Trommeild', tekst: 'kunne vare i dager eller uker' },
        { tittel: 'Målet', tekst: 'knuse skyttergraver og piggtråd' },
        { tittel: 'Granatsjokk', tekst: 'drive forsvarerne til vanvidd' },
        { tittel: 'Et månelandskap', tekst: 'gjørme og krater' },
    ],
    tank: [
        { tittel: 'Piggtråd og skyttergraver', tekst: 'hvordan kommer man over?' },
        { tittel: 'Panser mot kuler', tekst: 'kjører over piggtråden' },
        { tittel: 'Kodenavn: tank', tekst: 'betyr vanntank' },
        { tittel: 'Mark I, Somme', tekst: 'september 1916' },
        { tittel: 'Toppfart: 6 km/t', tekst: 'omtrent som du går' },
    ],
};

export function TeknologiFront({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props?.modus ?? 'eng';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const liste = KORT[modus];
    const kort = liste[Math.min(beat, liste.length - 1)];
    const start = kameraFor(modus, beat, 0).pos;
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [start.x, start.y, start.z] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={kort.tittel}
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
        </div>
    );
}
