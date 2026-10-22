import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Retorikk i 3D. Tre søyler (etos, logos, patos) som bærer argumentet, verktøyet på toppen
 * av hver søyle, en vekt der fornuft og følelser veier mot hverandre, og «ferdighetstyven»:
 * en robot med maske som tapper lyset ut av ferdighetene dine.
 */

type Modus = 'soyler' | 'verktoy' | 'vekt' | 'tyv';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const FOV = 42;
const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

const SOYLER = [
    { navn: 'Etos', under: 'den som snakker', x: -7.5, skaft: '#bbf7d0', topp: '#16a34a' },
    { navn: 'Logos', under: 'selve saken', x: 0, skaft: '#bfdbfe', topp: '#2563eb' },
    { navn: 'Patos', under: 'følelsene', x: 7.5, skaft: '#fecaca', topp: '#dc2626' },
];
const PLATE_NEDE = 8.65;
const PLATE_OPPE = 13;

const FASTE = {
    soyler: { pos: v(0, 7, 28), se: v(0, 5.5, 0) },
    vekt: { pos: v(0, 6.5, 21), se: v(0, 4.6, 0) },
    tyv: { pos: v(0.3, 4.3, 12), se: v(0.3, 2.4, 0) },
};

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'verktoy') {
        if (beat <= 2) {
            const x = SOYLER[beat].x;
            return { pos: v(x - 2.5 + Math.min(t, 10) * 0.08, 9.6, 12.5), se: v(x - 3.4, 7.4, 0) };
        }
        return { pos: v(0, 8, 31), se: v(0, 5, 0) };
    }
    return FASTE[modus];
}

/** Skjermposisjon (0-1) for et punkt sett fra et fast kamera. */
function projektor(k: { pos: THREE.Vector3; se: THREE.Vector3 }) {
    const kam = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.1, 500);
    kam.position.copy(k.pos);
    kam.lookAt(k.se);
    kam.updateMatrixWorld();
    return (x: number, y: number, z: number) => {
        const p = v(x, y, z).project(kam);
        return { x: ((p.x + 1) / 2) * 100, y: ((1 - p.y) / 2) * 100 };
    };
}
const I_SOYLER = projektor(FASTE.soyler);
const I_TYV = projektor(FASTE.tyv);

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

/* ---------- Søylene ---------- */

function Soyle({
    i,
    reist,
    rontgen,
    playing,
}: {
    i: number;
    reist: boolean;
    rontgen: boolean;
    playing: boolean;
}) {
    const s = SOYLER[i];
    const ref = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const kant = useRef<THREE.LineSegments>(null);
    const kantGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.95, 0.95, 7, 12)), []);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        const mal = reist ? 1 : 0.001;
        if (forste.current) {
            g.scale.y = mal;
            forste.current = false;
        }
        g.scale.y = damp(g.scale.y, mal, 2.6, dt);
        g.visible = g.scale.y > 0.01;
        if (mat.current) mat.current.opacity = damp(mat.current.opacity, rontgen ? 0.22 : 1, 3, dt || 0.016);
        if (kant.current) kant.current.visible = rontgen;
    });
    return (
        <group ref={ref} position={[s.x, 0, 0]}>
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[2.7, 0.6, 2.7]} />
                <meshStandardMaterial color="#f1ece2" emissive="#6b5e4a" emissiveIntensity={0.15} />
            </mesh>
            <mesh position={[0, 4.1, 0]}>
                <cylinderGeometry args={[0.9, 1, 7, 16]} />
                <meshStandardMaterial
                    ref={mat}
                    color={s.skaft}
                    emissive={s.skaft}
                    emissiveIntensity={0.25}
                    transparent
                    flatShading
                />
            </mesh>
            <lineSegments ref={kant} geometry={kantGeo} position={[0, 4.1, 0]} visible={false}>
                <lineBasicMaterial color="#67e8f9" />
            </lineSegments>
            <mesh position={[0, 7.9, 0]}>
                <boxGeometry args={[2.9, 0.6, 2.9]} />
                <meshStandardMaterial color={s.topp} emissive={s.topp} emissiveIntensity={0.3} />
            </mesh>
        </group>
    );
}

/** Aristoteles som en enkel byste, bare i første beat. Synker når søylene reiser seg. */
function Byste({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        const mal = synlig ? 1 : 0.001;
        if (forste.current) {
            g.scale.setScalar(mal);
            forste.current = false;
        }
        g.scale.setScalar(damp(g.scale.x, mal, 3, dt || 0.016));
        g.visible = g.scale.x > 0.02;
        g.rotation.y = 0.25;
    });
    const stein = { color: '#f5f1e8', emissive: '#6b5e4a', emissiveIntensity: 0.18, flatShading: true };
    return (
        <group ref={ref} position={[0, 0, 1.2]}>
            <mesh position={[0, 1.6, 0]}>
                <boxGeometry args={[2.2, 3.2, 2.2]} />
                <meshStandardMaterial {...stein} />
            </mesh>
            <mesh position={[0, 3.9, 0]} scale={[1, 0.6, 0.6]}>
                <sphereGeometry args={[1.7, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial {...stein} />
            </mesh>
            <mesh position={[0, 4.6, 0]}>
                <cylinderGeometry args={[0.45, 0.55, 0.9, 10]} />
                <meshStandardMaterial {...stein} />
            </mesh>
            <mesh position={[0, 5.8, 0]} scale={[0.95, 1.12, 1]}>
                <sphereGeometry args={[1, 16, 12]} />
                <meshStandardMaterial {...stein} />
            </mesh>
            <mesh position={[0, 5.05, 0.55]} rotation={[0.25, 0, Math.PI]}>
                <coneGeometry args={[0.65, 1.3, 10]} />
                <meshStandardMaterial {...stein} />
            </mesh>
        </group>
    );
}

function Plate({ nede, playing }: { nede: boolean; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const tid = useRef(0);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        const m = ref.current;
        if (!m) return;
        const mal = nede ? PLATE_NEDE : PLATE_OPPE + Math.sin(tid.current * 1.2) * 0.25;
        if (forste.current) {
            m.position.y = mal;
            forste.current = false;
        }
        m.position.y = damp(m.position.y, mal, nede ? 2.2 : 3, dt);
        if (mat.current) mat.current.opacity = damp(mat.current.opacity, nede ? 1 : 0.4, 2, dt || 0.016);
    });
    return (
        <mesh ref={ref} position={[0, PLATE_OPPE, 0]}>
            <boxGeometry args={[19.5, 0.9, 3.6]} />
            <meshStandardMaterial ref={mat} color="#fde68a" emissive="#b45309" emissiveIntensity={0.25} transparent opacity={0.4} />
        </mesh>
    );
}

function Grunn({ farge = '#e7dfd0' }: { farge?: string }) {
    return (
        <>
            <mesh position={[0, -0.4, 0]}>
                <boxGeometry args={[25, 0.8, 7]} />
                <meshStandardMaterial color="#ece6da" emissive="#6b5e4a" emissiveIntensity={0.12} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color={farge} />
            </mesh>
        </>
    );
}

/* ---------- Verktøyene på toppen ---------- */

function hjerteForm() {
    const s = new THREE.Shape();
    s.moveTo(0, -1);
    s.bezierCurveTo(-0.2, -0.75, -1.1, -0.2, -1.1, 0.35);
    s.bezierCurveTo(-1.1, 0.85, -0.55, 1.05, 0, 0.6);
    s.bezierCurveTo(0.55, 1.05, 1.1, 0.85, 1.1, 0.35);
    s.bezierCurveTo(1.1, -0.2, 0.2, -0.75, 0, -1);
    return s;
}

function Hjerte({ farge = '#dc2626' }: { farge?: string }) {
    const geo = useMemo(() => {
        const g = new THREE.ExtrudeGeometry(hjerteForm(), { depth: 0.5, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2 });
        g.center();
        return g;
    }, []);
    return (
        <mesh geometry={geo}>
            <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.45} />
        </mesh>
    );
}

function Medalje() {
    return (
        <group>
            <mesh>
                <torusGeometry args={[0.85, 0.16, 8, 24]} />
                <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.5} metalness={0.4} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.72, 0.72, 0.16, 20]} />
                <meshStandardMaterial color="#fde047" emissive="#ca8a04" emissiveIntensity={0.45} />
            </mesh>
            {[-0.35, 0.35].map((x) => (
                <mesh key={x} position={[x, -1.25, 0]} rotation={[0, 0, x > 0 ? 0.25 : -0.25]}>
                    <boxGeometry args={[0.38, 1.1, 0.06]} />
                    <meshStandardMaterial color="#16a34a" emissive="#166534" emissiveIntensity={0.4} />
                </mesh>
            ))}
        </group>
    );
}

function Stolper({ farge = '#2563eb' }: { farge?: string }) {
    return (
        <group>
            {[0.8, 1.4, 2.1].map((h, i) => (
                <mesh key={i} position={[(i - 1) * 0.75, h / 2, 0]}>
                    <boxGeometry args={[0.55, h, 0.55]} />
                    <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.35} />
                </mesh>
            ))}
        </group>
    );
}

function Verktoy({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<(THREE.Group | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        ref.current.forEach((g, i) => {
            if (!g) return;
            const mal = beat >= i ? 1 : 0.001;
            g.scale.setScalar(damp(g.scale.x, mal, 3, dt || 0.016));
            g.visible = g.scale.x > 0.02;
            g.rotation.y = Math.sin(tid.current * 0.7 + i) * 0.5;
        });
    });
    const ting = [
        { y: 9.9, el: <Medalje /> },
        { y: 8.2, el: <Stolper /> },
        { y: 9.5, el: <Hjerte /> },
    ];
    return (
        <>
            {ting.map((t, i) => (
                <group
                    key={i}
                    position={[SOYLER[i].x, t.y, 0]}
                    scale={0.001}
                    ref={(g) => {
                        ref.current[i] = g;
                    }}
                >
                    {t.el}
                </group>
            ))}
        </>
    );
}

/* ---------- Vekta ---------- */

const ARM = 6.5;
const DREIEPUNKT = 7.6;
const HENG = 3;

function vinkelFor(beat: number) {
    if (beat === 1) return 0.2;
    if (beat === 2) return -0.12;
    return 0;
}

function Vekt({ beat, playing }: { beat: number; playing: boolean }) {
    const bjelke = useRef<THREE.Group>(null);
    const venstre = useRef<THREE.Group>(null);
    const hoyre = useRef<THREE.Group>(null);
    const logos = useRef<THREE.Group>(null);
    const patos = useRef<THREE.Group>(null);
    const ring = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    const vinkel = useRef(vinkelFor(beat));
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        vinkel.current = damp(vinkel.current, vinkelFor(beat), 1.6, dt || 0.016);
        const a = vinkel.current;
        if (bjelke.current) bjelke.current.rotation.z = a;
        const ende = (side: number) => ({ x: side * ARM * Math.cos(a), y: DREIEPUNKT + side * ARM * Math.sin(a) });
        const l = ende(-1);
        const r = ende(1);
        venstre.current?.position.set(l.x, l.y, 0);
        hoyre.current?.position.set(r.x, r.y, 0);
        const slipp = (g: THREE.Group | null, synlig: boolean) => {
            if (!g) return;
            g.position.y = damp(g.position.y, synlig ? 0 : 7, 3.2, dt || 0.016);
            g.visible = synlig || g.position.y < 6.5;
        };
        slipp(logos.current, beat >= 1);
        slipp(patos.current, beat >= 2);
        if (patos.current) patos.current.rotation.y = Math.sin(tid.current * 0.8) * 0.4;
        if (ring.current) {
            const s = damp(ring.current.scale.x, beat >= 3 ? 1 : 0.001, 2.5, dt || 0.016);
            ring.current.scale.setScalar(s);
            ring.current.visible = s > 0.02;
            ring.current.rotation.z = tid.current * 0.5;
        }
    });
    const skal = (
        <group position={[0, -HENG, 0]}>
            <mesh>
                <cylinderGeometry args={[2, 1.6, 0.3, 24]} />
                <meshStandardMaterial color="#d4a94a" emissive="#92400e" emissiveIntensity={0.3} metalness={0.3} />
            </mesh>
        </group>
    );
    const snor = (
        <mesh position={[0, -HENG / 2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, HENG, 6]} />
            <meshStandardMaterial color="#78350f" />
        </mesh>
    );
    return (
        <group>
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[4, 0.6, 3]} />
                <meshStandardMaterial color="#6b4423" emissive="#3b2412" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0, 3.95, 0]}>
                <cylinderGeometry args={[0.28, 0.36, 7.3, 12]} />
                <meshStandardMaterial color="#8b5e34" emissive="#3b2412" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0, DREIEPUNKT, 0.1]}>
                <sphereGeometry args={[0.45, 16, 12]} />
                <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.5} />
            </mesh>
            <mesh ref={ring} position={[0, DREIEPUNKT, 0.2]} scale={0.001}>
                <torusGeometry args={[1.2, 0.09, 8, 40]} />
                <meshBasicMaterial color="#fbbf24" />
            </mesh>
            <group ref={bjelke} position={[0, DREIEPUNKT, 0]}>
                <mesh>
                    <boxGeometry args={[ARM * 2 + 0.6, 0.35, 0.5]} />
                    <meshStandardMaterial color="#c8a24a" emissive="#78350f" emissiveIntensity={0.3} metalness={0.3} />
                </mesh>
            </group>
            <group ref={venstre}>
                {snor}
                {skal}
                <group position={[0, -HENG + 0.15, 0]}>
                    <group ref={logos} position={[0, 7, 0]}>
                        <Stolper />
                    </group>
                </group>
            </group>
            <group ref={hoyre}>
                {snor}
                {skal}
                <group position={[0, -HENG + 1.25, 0]}>
                    <group ref={patos} position={[0, 7, 0]} scale={1.05}>
                        <Hjerte />
                    </group>
                </group>
            </group>
        </group>
    );
}

/* ---------- Tyven ---------- */

const KULE = v(2.6, 3.15, 0);
const TYV_X = -2;
const PARTIKLER = 14;

function Tyven({ beat, playing }: { beat: number; playing: boolean }) {
    const skurk = useRef<THREE.Group>(null);
    const robot = useRef<THREE.Group>(null);
    const kule = useRef<THREE.Mesh>(null);
    const kuleMat = useRef<THREE.MeshStandardMaterial>(null);
    const lys = useRef<THREE.PointLight>(null);
    const alarm = useRef<THREE.MeshStandardMaterial>(null);
    const alarmLys = useRef<THREE.PointLight>(null);
    const oyne = useMemo(
        () => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#22d3ee', emissiveIntensity: 1.6 }),
        []
    );
    const partikler = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0);
    const forste = useRef(true);
    const rod = useMemo(() => new THREE.Color('#ef4444'), []);
    const cyan = useMemo(() => new THREE.Color('#22d3ee'), []);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        const d = dt || 0.016;
        tid.current += dt;
        const t = tid.current;
        // Skurken sniker seg inn i beat 0, roboten tar over plassen fra beat 2.
        const s = skurk.current;
        if (s) {
            const malX = TYV_X;
            if (forste.current) s.position.x = beat === 0 ? -9 : malX;
            s.position.x = damp(s.position.x, malX, 0.9, dt);
            s.position.y = Math.abs(Math.sin(t * 4)) * 0.08;
            const sk = damp(s.scale.x, beat < 2 ? 1 : 0.001, 4, d);
            s.scale.setScalar(sk);
            s.visible = sk > 0.02;
        }
        const r = robot.current;
        if (r) {
            if (forste.current) r.scale.setScalar(beat >= 2 ? 1 : 0.001);
            const sk = damp(r.scale.x, beat >= 2 ? 1 : 0.001, 3, d);
            r.scale.setScalar(sk);
            r.visible = sk > 0.02;
            r.rotation.y = 0.35 + Math.sin(t * 0.9) * 0.08;
        }
        forste.current = false;
        if (alarm.current && alarmLys.current) {
            const p = beat >= 1 ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
            alarm.current.emissiveIntensity = 0.3 + p * 2;
            alarmLys.current.intensity = p * 18;
        }
        // Beat 3: lyset tappes ut av kula og inn i roboten.
        const tappes = beat >= 3;
        if (kule.current && kuleMat.current && lys.current) {
            const sk = damp(kule.current.scale.x, tappes ? 0.45 : 1, 0.8, d);
            kule.current.scale.setScalar(sk);
            kuleMat.current.emissiveIntensity = 0.4 + sk * 1.1;
            lys.current.intensity = sk * 22;
        }
        oyne.emissive.copy(tappes ? rod : cyan);
        const m = partikler.current;
        if (m) {
            m.visible = tappes;
            const hode = v(TYV_X + 0.2, 2.9, 0.3);
            for (let i = 0; i < PARTIKLER; i++) {
                const f = (t * 0.45 + i / PARTIKLER) % 1;
                o.position.set(
                    KULE.x + (hode.x - KULE.x) * f,
                    KULE.y + (hode.y - KULE.y) * f + Math.sin(f * Math.PI) * 1.2,
                    KULE.z + (hode.z - KULE.z) * f
                );
                o.scale.setScalar(0.12 * (1 - f * 0.5));
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
            }
            m.instanceMatrix.needsUpdate = true;
        }
    });
    return (
        <group>
            {/* Rommet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[60, 40]} />
                <meshStandardMaterial color="#64748b" emissive="#1e293b" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, 8, -6]}>
                <planeGeometry args={[60, 16]} />
                <meshStandardMaterial color="#94a3b8" emissive="#334155" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-6.5, 6.2, -5.9]}>
                <sphereGeometry args={[0.4, 16, 12]} />
                <meshStandardMaterial ref={alarm} color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
            </mesh>
            <pointLight ref={alarmLys} position={[-6.5, 6, -4.5]} color="#ef4444" intensity={0} distance={18} />
            {/* Sokkelen med ferdighetene */}
            <mesh position={[KULE.x, 1.2, 0]}>
                <cylinderGeometry args={[0.85, 1, 2.4, 20]} />
                <meshStandardMaterial color="#e2e8f0" emissive="#475569" emissiveIntensity={0.3} />
            </mesh>
            <mesh ref={kule} position={KULE}>
                <icosahedronGeometry args={[0.7, 1]} />
                <meshStandardMaterial ref={kuleMat} color="#fde047" emissive="#facc15" emissiveIntensity={1.5} flatShading />
            </mesh>
            <pointLight ref={lys} position={[KULE.x, KULE.y + 0.6, 1]} color="#fde047" intensity={22} distance={12} />
            {/* Skurken: mørke klær, lue og maske */}
            <group ref={skurk} position={[-9, 0, 0]}>
                <mesh position={[0, 1.2, 0]}>
                    <capsuleGeometry args={[0.5, 1.3, 4, 10]} />
                    <meshStandardMaterial color="#0f172a" emissive="#1e293b" emissiveIntensity={0.5} />
                </mesh>
                <mesh position={[0, 2.55, 0]}>
                    <sphereGeometry args={[0.45, 16, 12]} />
                    <meshStandardMaterial color="#f1c9a5" emissive="#7c4a2a" emissiveIntensity={0.3} />
                </mesh>
                <mesh position={[0, 2.82, 0]}>
                    <sphereGeometry args={[0.47, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#111827" />
                </mesh>
                <mesh position={[0, 2.6, 0.32]}>
                    <boxGeometry args={[0.9, 0.2, 0.22]} />
                    <meshStandardMaterial color="#020617" />
                </mesh>
                <mesh position={[0.6, 1.6, 0.2]} rotation={[0, 0, -1.1]}>
                    <capsuleGeometry args={[0.14, 0.9, 4, 6]} />
                    <meshStandardMaterial color="#0f172a" emissive="#1e293b" emissiveIntensity={0.5} />
                </mesh>
            </group>
            {/* Roboten: KI som skurk */}
            <group ref={robot} position={[TYV_X, 0, 0]} scale={0.001}>
                {[-0.32, 0.32].map((x) => (
                    <mesh key={x} position={[x, 0.55, 0]}>
                        <boxGeometry args={[0.35, 1.1, 0.4]} />
                        <meshStandardMaterial color="#64748b" emissive="#334155" emissiveIntensity={0.4} />
                    </mesh>
                ))}
                <mesh position={[0, 1.75, 0]}>
                    <boxGeometry args={[1.4, 1.4, 0.9]} />
                    <meshStandardMaterial color="#cbd5e1" emissive="#475569" emissiveIntensity={0.35} flatShading />
                </mesh>
                <mesh position={[0, 2.9, 0]}>
                    <boxGeometry args={[1.1, 0.85, 0.85]} />
                    <meshStandardMaterial color="#e2e8f0" emissive="#64748b" emissiveIntensity={0.35} flatShading />
                </mesh>
                {/* Masken over øynene */}
                <mesh position={[0, 2.95, 0.44]}>
                    <boxGeometry args={[1.2, 0.32, 0.06]} />
                    <meshStandardMaterial color="#020617" />
                </mesh>
                {[-0.25, 0.25].map((x) => (
                    <mesh key={x} position={[x, 2.95, 0.48]} material={oyne}>
                        <sphereGeometry args={[0.1, 10, 8]} />
                    </mesh>
                ))}
                <mesh position={[0, 3.6, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
                <mesh position={[0, 3.95, 0]}>
                    <sphereGeometry args={[0.13, 10, 8]} />
                    <meshStandardMaterial color="#f87171" emissive="#ef4444" emissiveIntensity={1} />
                </mesh>
                {/* Armen som strekker seg mot kula */}
                <mesh position={[1.25, 2, 0.1]} rotation={[0, 0, -1.35]}>
                    <boxGeometry args={[0.25, 1.4, 0.25]} />
                    <meshStandardMaterial color="#94a3b8" emissive="#334155" emissiveIntensity={0.4} />
                </mesh>
            </group>
            <instancedMesh ref={partikler} args={[undefined, undefined, PARTIKLER]} visible={false}>
                <sphereGeometry args={[1, 8, 6]} />
                <meshBasicMaterial color="#fde047" />
            </instancedMesh>
        </group>
    );
}

/* ---------- Scenen ---------- */

const BAKGRUNN: Record<Modus, string> = {
    soyler: '#f4efe6',
    verktoy: '#f4efe6',
    vekt: '#eef2f7',
    tyv: '#1e293b',
};

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const rontgen = modus === 'verktoy' && beat >= 3;
    const bak = rontgen ? '#0f2a3d' : BAKGRUNN[modus];
    return (
        <>
            <color attach="background" args={[bak]} />
            <fog attach="fog" args={[bak, 45, 140]} />
            <hemisphereLight args={['#ffffff', '#64748b', modus === 'tyv' ? 0.55 : 1]} />
            <directionalLight position={[-12, 20, 16]} intensity={modus === 'tyv' ? 0.6 : 1.3} />
            <Kamera modus={modus} beat={beat} playing={playing} />
            {(modus === 'soyler' || modus === 'verktoy') && (
                <>
                    <Grunn farge={rontgen ? '#164e63' : '#e7dfd0'} />
                    {SOYLER.map((_, i) => (
                        <Soyle
                            key={i}
                            i={i}
                            reist={modus === 'verktoy' || beat >= i + 1}
                            rontgen={rontgen}
                            playing={playing}
                        />
                    ))}
                </>
            )}
            {modus === 'soyler' && (
                <>
                    <Plate nede={beat >= 4} playing={playing} />
                    <Byste synlig={beat === 0} playing={playing} />
                </>
            )}
            {modus === 'verktoy' && <Verktoy beat={beat} playing={playing} />}
            {modus === 'vekt' && (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[300, 300]} />
                        <meshStandardMaterial color="#dbe3ec" />
                    </mesh>
                    <Vekt beat={beat} playing={playing} />
                </>
            )}
            {modus === 'tyv' && <Tyven beat={beat} playing={playing} />}
        </>
    );
}

/* ---------- Merkelapper ---------- */

type Tone = 'lys' | 'mork' | 'etos' | 'logos' | 'patos' | 'gull';
const TONE: Record<Tone, string> = {
    lys: 'bg-white/95 text-slate-900',
    mork: 'bg-slate-900/90 text-white',
    etos: 'bg-green-600 text-white',
    logos: 'bg-blue-600 text-white',
    patos: 'bg-red-600 text-white',
    gull: 'bg-amber-300/95 text-slate-900',
};

interface Merke {
    fraBeat: number;
    tilBeat?: number;
    tittel: string;
    tekst?: string;
    tone: Tone;
    /** Plass i prosent. `midt` sentrerer merket på x. */
    x: number;
    y: number;
    midt?: boolean;
    bredde?: number;
}

function merkerFor(modus: Modus): Merke[] {
    if (modus === 'soyler') {
        const plate = I_SOYLER(0, PLATE_OPPE + 1.4, 0);
        const plateNede = I_SOYLER(0, PLATE_NEDE + 1.6, 0);
        const navn = SOYLER.map((s, i) => {
            const p = I_SOYLER(s.x, -0.6, 3.6);
            return {
                fraBeat: i + 1,
                tittel: s.navn,
                tekst: s.under,
                tone: (['etos', 'logos', 'patos'] as const)[i],
                x: p.x,
                y: p.y - 2,
                midt: true,
                bredde: 18,
            };
        });
        return [
            { fraBeat: 0, tilBeat: 0, tittel: 'Aristoteles', tekst: 'for over 2000 år siden: tre måter å overbevise', tone: 'mork', x: 4, y: 5, bredde: 30 },
            { fraBeat: 0, tilBeat: 3, tittel: 'Argumentet', tone: 'gull', x: plate.x, y: plate.y - 8, midt: true },
            { fraBeat: 4, tittel: 'Argumentet', tone: 'gull', x: plateNede.x, y: plateNede.y - 8, midt: true },
            ...navn,
            { fraBeat: 4, tittel: 'Gjelder fortsatt', tekst: 'på TikTok og i Aftenposten', tone: 'mork', x: 4, y: 5, bredde: 26 },
        ];
    }
    if (modus === 'verktoy') {
        return [
            { fraBeat: 0, tilBeat: 0, tittel: 'Etos', tekst: 'titler, erfaring, en balansert holdning', tone: 'etos', x: 4, y: 6, bredde: 34 },
            { fraBeat: 1, tilBeat: 1, tittel: 'Logos: til hodet', tekst: 'fakta, tall, forskning, årsak og virkning', tone: 'logos', x: 4, y: 6, bredde: 34 },
            { fraBeat: 2, tilBeat: 2, tittel: 'Patos: til hjertet', tekst: 'sterke ord, personlige historier, humor eller frykt', tone: 'patos', x: 4, y: 6, bredde: 34 },
            { fraBeat: 3, tittel: 'Røntgensyn', tekst: 'du ser rett gjennom teksten', tone: 'gull', x: 50, y: 6, midt: true, bredde: 34 },
        ];
    }
    if (modus === 'vekt') {
        return [
            { fraBeat: 0, tilBeat: 0, tittel: 'Fornuft eller følelser?', tone: 'mork', x: 50, y: 6, midt: true, bredde: 30 },
            { fraBeat: 1, tittel: 'Logos', tekst: 'fakta og logikk, til hodet', tone: 'logos', x: 4, y: 6, bredde: 28 },
            { fraBeat: 2, tittel: 'Patos', tekst: 'følelser, til hjertet', tone: 'patos', x: 68, y: 6, bredde: 28 },
            { fraBeat: 3, tittel: 'Best sammen', tone: 'gull', x: 50, y: 82, midt: true },
        ];
    }
    const kule = I_TYV(KULE.x, KULE.y + 1.9, 0);
    return [
        { fraBeat: 0, tittel: 'Ferdighetene dine', tone: 'gull', x: kule.x, y: kule.y - 7, midt: true },
        { fraBeat: 0, tilBeat: 0, tittel: 'En tyv', tekst: 'tar noe fra deg mot din vilje', tone: 'lys', x: 4, y: 6, bredde: 30 },
        { fraBeat: 1, tilBeat: 1, tittel: 'Alarm!', tekst: 'en tyv må du beskytte deg mot', tone: 'patos', x: 4, y: 6, bredde: 30 },
        { fraBeat: 2, tilBeat: 2, tittel: 'KI blir en skurk', tekst: 'å personifisere: en ting blir en person', tone: 'lys', x: 4, y: 6, bredde: 30 },
        { fraBeat: 3, tittel: 'Patos', tekst: 'vi blir redde for å miste noe verdifullt', tone: 'patos', x: 4, y: 6, bredde: 30 },
    ];
}

export function DebattSoyler({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'soyler';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const start = kameraFor(modus, beat, 0).pos;
    const merker = merkerFor(modus).filter(
        (m) => beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat)
    );
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: FOV, position: [start.x, start.y, start.z] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {merker.map((m) => (
                    <motion.div
                        key={`${m.tittel}-${m.fraBeat}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className={`absolute rounded-2xl shadow-xl px-5 py-3 ${TONE[m.tone]}`}
                        style={{
                            left: `${m.x}%`,
                            top: `${m.y}%`,
                            width: m.bredde ? `${m.bredde}%` : undefined,
                            transform: m.midt ? 'translateX(-50%)' : undefined,
                            textAlign: m.midt ? 'center' : undefined,
                        }}
                    >
                        <div className="text-2xl font-black leading-tight whitespace-nowrap" style={FONT}>
                            {m.tittel}
                        </div>
                        {m.tekst && <div className="text-lg font-semibold opacity-90 mt-0.5 leading-snug">{m.tekst}</div>}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
