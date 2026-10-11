import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Brikke } from './felles';

/**
 * Gassen som pressmiddel, i 3D: et snødekt landskap en vinterkveld. Til høyre gassfeltet i
 * Russland med tre tårn og flammer. Et rør går vestover og deler seg i to, mot to landsbyer i
 * Europa. Gassen er lysende kuler som renner i rørene. Ved delingen sitter to store kraner.
 *
 * «ror»: tårnene, så rørene, så lys i husene, så hele bildet sett ovenfra.
 * «kran»: kranen, landsbyen som gjør som Kreml vil (lys og varme), så kranen til landsbyen
 *   som protesterer skrus igjen. Gassen renner ut, vinduene slukner, snøen faller.
 */

type Modus = 'ror' | 'kran';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const damp = (a: number, b: number, l: number, dt: number) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));

const STAMME = [v(34, 1, 0), v(2, 1, 0)];
const GREN_A = [v(2, 1, 0), v(-6, 1, 8), v(-30, 1, 10)];
const GREN_B = [v(2, 1, 0), v(-6, 1, -8), v(-30, 1, -10)];
const KRAN_A = v(-2.5, 1, 4.3);
const KRAN_B = v(-2.5, 1, -4.3);
const BY_A = v(-38, 0, 10);
const BY_B = v(-38, 0, -10);
const HUS: [number, number][] = [
    [0, 0],
    [-5, 3.5],
    [-4.5, -3.5],
    [-10, 0.5],
    [3, 5],
    [3.5, -4.5],
];

/** Kranen til landsby B er åpen bare før beat 2 i «kran». */
function grenBApen(modus: Modus, beat: number) {
    return modus === 'ror' || beat < 2;
}
function rorSynlige(modus: Modus, beat: number) {
    return modus === 'kran' || beat >= 1;
}
function lysA(modus: Modus, beat: number) {
    return modus === 'kran' || beat >= 2;
}
function lysB(modus: Modus, beat: number) {
    return (modus === 'ror' && beat >= 2) || (modus === 'kran' && beat < 2);
}

function kamera(modus: Modus, beat: number, t: number) {
    if (modus === 'ror') {
        switch (beat) {
            case 0:
                return { pos: v(52 - t * 0.3, 10, 24), se: v(38, 5, 0) };
            case 1:
                return { pos: v(22 - t * 0.6, 24, 44), se: v(-4, 0, 0) };
            case 2:
                return { pos: v(-18, 10, 30), se: v(-38, 2, 2) };
            default:
                return { pos: v(4, 50, 58), se: v(-2, 0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(9, 7, 13), se: v(-2, 1.5, 0) };
        case 1:
            return { pos: v(-18, 10, 32), se: v(-38, 2, 9) };
        case 2:
            return { pos: v(8, 14, 6), se: v(-14, 1, -7) };
        default:
            return { pos: v(-24, 7, 6), se: v(-40, 2, -10) };
    }
}

function punktPa(sti: THREE.Vector3[], u: number, ut: THREE.Vector3) {
    const lengder = sti.slice(1).map((p, i) => p.distanceTo(sti[i]));
    const total = lengder.reduce((a, b) => a + b, 0);
    let d = u * total;
    for (let i = 0; i < lengder.length; i++) {
        if (d <= lengder[i]) return ut.copy(sti[i]).lerp(sti[i + 1], d / lengder[i]);
        d -= lengder[i];
    }
    return ut.copy(sti[sti.length - 1]);
}

function Ror({ sti }: { sti: THREE.Vector3[] }) {
    const deler = useMemo(
        () =>
            sti.slice(1).map((b, i) => {
                const a = sti[i];
                const midt = a.clone().add(b).multiplyScalar(0.5);
                const lengde = a.distanceTo(b);
                const q = new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), b.clone().sub(a).normalize());
                return { midt, lengde, q };
            }),
        [sti]
    );
    return (
        <>
            {deler.map((d, i) => (
                <mesh key={i} position={d.midt} quaternion={d.q}>
                    <cylinderGeometry args={[0.85, 0.85, d.lengde + 0.8, 14, 1, true]} />
                    <meshStandardMaterial
                        color="#cbd5e1"
                        emissive="#475569"
                        emissiveIntensity={0.4}
                        transparent
                        opacity={0.4}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </>
    );
}

/** Lysende gasskuler som renner langs en sti. */
function Strom({
    sti,
    apen,
    antall,
    synlig,
    playing,
}: {
    sti: THREE.Vector3[];
    apen: boolean;
    antall: number;
    synlig: boolean;
    playing: boolean;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const fyll = useRef(apen ? 1 : 0);
    const m = useMemo(() => new THREE.Object3D(), []);
    const p = useMemo(() => new THREE.Vector3(), []);
    useFrame((_, rawDt) => {
        const steg = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += steg;
        // Når kranen stenges, renner gassen ut av røret bakfra.
        fyll.current = damp(fyll.current, apen && synlig ? 1 : 0, apen ? 1.2 : 0.7, steg || 0.0001);
        const mesh = ref.current;
        if (!mesh) return;
        for (let i = 0; i < antall; i++) {
            const u = (i / antall + tid.current * 0.08) % 1;
            punktPa(sti, u, p);
            const vis = apen ? u < fyll.current : u > 1 - fyll.current;
            m.position.copy(p);
            m.scale.setScalar(vis && synlig ? 1 : 0.0001);
            m.updateMatrix();
            mesh.setMatrixAt(i, m.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, antall]}>
            <sphereGeometry args={[0.45, 10, 8]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.6} toneMapped={false} />
        </instancedMesh>
    );
}

function Tarn({ x, z, playing }: { x: number; z: number; playing: boolean }) {
    const flamme = useRef<THREE.Mesh>(null);
    const tid = useRef(x * 0.7 + z);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        const f = flamme.current;
        if (f) f.scale.set(1, 1 + Math.sin(tid.current * 9) * 0.18 + Math.sin(tid.current * 13) * 0.1, 1);
    });
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 4.5, 0]}>
                <cylinderGeometry args={[0.35, 1.6, 9, 4, 1, true]} />
                <meshStandardMaterial color="#334155" wireframe />
            </mesh>
            <mesh position={[0, 9.2, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh ref={flamme} position={[0, 10.8, 0]}>
                <coneGeometry args={[0.7, 2.6, 10]} />
                <meshStandardMaterial color="#fdba74" emissive="#f97316" emissiveIntensity={2} toneMapped={false} />
            </mesh>
        </group>
    );
}

function Kran({ pos, retning, stengt, farge }: { pos: THREE.Vector3; retning: number; stengt: boolean; farge: string }) {
    const hjul = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = hjul.current;
        if (!g) return;
        const dt = Math.min(rawDt, 0.05);
        g.rotation.z = damp(g.rotation.z, stengt ? Math.PI * 3 : 0, 0.9, dt);
    });
    return (
        <group position={pos} rotation={[0, retning, 0]}>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.2, 2, 2.4]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 1.9, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 1.8, 8]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <group ref={hjul} position={[0, 2.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh>
                    <torusGeometry args={[1.3, 0.2, 8, 24]} />
                    <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={0.5} />
                </mesh>
                <mesh>
                    <boxGeometry args={[2.6, 0.18, 0.18]} />
                    <meshStandardMaterial color={farge} />
                </mesh>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[2.6, 0.18, 0.18]} />
                    <meshStandardMaterial color={farge} />
                </mesh>
            </group>
        </group>
    );
}

function Landsby({ midt, lys, fabrikk }: { midt: THREE.Vector3; lys: boolean; fabrikk?: boolean }) {
    return (
        <group position={midt}>
            {HUS.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 1.3, 0]}>
                        <boxGeometry args={[3, 2.6, 2.6]} />
                        <meshStandardMaterial color={i % 2 ? '#e5d3b3' : '#cfd8e3'} flatShading />
                    </mesh>
                    <mesh position={[0, 3.3, 0]} rotation={[0, Math.PI / 4, 0]}>
                        <coneGeometry args={[2.4, 1.6, 4]} />
                        <meshStandardMaterial color="#f8fafc" emissive="#cbd5e1" emissiveIntensity={0.3} flatShading />
                    </mesh>
                    <mesh position={[0.9, 1.4, 1.32]}>
                        <boxGeometry args={[0.8, 0.8, 0.05]} />
                        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={lys ? 2 : 0.02} toneMapped={false} />
                    </mesh>
                    <mesh position={[1.52, 1.4, 0]}>
                        <boxGeometry args={[0.05, 0.8, 0.8]} />
                        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={lys ? 2 : 0.02} toneMapped={false} />
                    </mesh>
                </group>
            ))}
            {fabrikk && (
                <group position={[-4, 0, 9]}>
                    <mesh position={[0, 2, 0]}>
                        <boxGeometry args={[7, 4, 4]} />
                        <meshStandardMaterial color="#a8a29e" flatShading />
                    </mesh>
                    <mesh position={[2.5, 5, 0]}>
                        <cylinderGeometry args={[0.5, 0.6, 6, 10]} />
                        <meshStandardMaterial color="#78716c" />
                    </mesh>
                </group>
            )}
        </group>
    );
}

/** Skrur vinduene i en landsby av og på, mykt. */
function Vinduslys({ lys, rot }: { lys: boolean; rot: React.RefObject<THREE.Group | null> }) {
    useFrame((_, rawDt) => {
        const g = rot.current;
        if (!g) return;
        const dt = Math.min(rawDt, 0.05);
        g.traverse((o) => {
            const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
            if (m && m.toneMapped === false && m.emissive && m.emissive.getHex() === 0xf59e0b) {
                m.emissiveIntensity = damp(m.emissiveIntensity, lys ? 2 : 0.02, 2.2, dt);
                m.color.set(lys ? '#fde68a' : '#334155');
            }
        });
    });
    return null;
}

function Sno({ playing, tett }: { playing: boolean; tett: boolean }) {
    const N = 500;
    const ref = useRef<THREE.Points>(null);
    const pos = useMemo(() => {
        const a = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const r = (n: number) => {
                const x = Math.sin((i + 1) * n * 12.9898) * 43758.5453;
                return x - Math.floor(x);
            };
            a[i * 3] = -60 + r(1) * 50;
            a[i * 3 + 1] = r(2) * 20;
            a[i * 3 + 2] = -24 + r(3) * 30;
        }
        return a;
    }, []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const p = ref.current;
        if (!p) return;
        const attr = p.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < N; i++) {
            let y = attr.getY(i) - dt * 2.2;
            if (y < 0) y += 20;
            attr.setY(i, y);
        }
        attr.needsUpdate = true;
        const mat = p.material as THREE.PointsMaterial;
        mat.opacity = damp(mat.opacity, tett ? 0.95 : 0.35, 1.5, dt || 0.0001);
    });
    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[pos, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#ffffff" size={0.35} transparent opacity={0.35} depthWrite={false} />
        </points>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const byA = useRef<THREE.Group>(null);
    const byB = useRef<THREE.Group>(null);

    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kamera(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });

    const synlig = rorSynlige(modus, beat);
    return (
        <>
            <color attach="background" args={['#5b6b86']} />
            <fog attach="fog" args={['#7a889f', 50, 150]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#dbeafe', '#64748b', 0.8]} />
            <directionalLight position={[20, 30, 20]} intensity={0.8} color="#e0e7ff" />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[220, 160]} />
                <meshStandardMaterial color="#e2e8f0" emissive="#94a3b8" emissiveIntensity={0.35} roughness={1} />
            </mesh>
            {/* Grensa mellom Russland og Europa, som en svak linje i snøen */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.02, 0]}>
                <planeGeometry args={[0.4, 80]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>

            <Tarn x={40} z={-4} playing={playing} />
            <Tarn x={44} z={3} playing={playing} />
            <Tarn x={37} z={6} playing={playing} />

            {synlig && (
                <>
                    <Ror sti={STAMME} />
                    <Ror sti={GREN_A} />
                    <Ror sti={GREN_B} />
                </>
            )}
            <Strom sti={STAMME} apen antall={22} synlig={synlig} playing={playing} />
            <Strom sti={GREN_A} apen antall={22} synlig={synlig} playing={playing} />
            <Strom sti={GREN_B} apen={grenBApen(modus, beat)} antall={22} synlig={synlig} playing={playing} />
            {synlig && <Kran pos={KRAN_A} retning={Math.atan2(8, 8)} stengt={false} farge="#16a34a" />}
            {synlig && <Kran pos={KRAN_B} retning={-Math.atan2(8, 8)} stengt={!grenBApen(modus, beat)} farge="#dc2626" />}

            <group ref={byA}>
                <Landsby midt={BY_A} lys={lysA(modus, beat)} fabrikk />
            </group>
            <group ref={byB}>
                <Landsby midt={BY_B} lys={lysB(modus, beat)} />
            </group>
            <Vinduslys lys={lysA(modus, beat)} rot={byA} />
            <Vinduslys lys={lysB(modus, beat)} rot={byB} />
            <Sno playing={playing} tett={modus === 'kran' && beat >= 2} />
        </>
    );
}

export function RusslandGass({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'ror';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, near: 0.3, far: 300, position: [52, 10, 24] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {modus === 'ror' && beat === 0 && <Brikke key="r0" tekst="Russland: gass og olje" />}
                {modus === 'ror' && beat === 1 && <Brikke key="r1" tekst="Rørledninger til Europa" />}
                {modus === 'ror' && beat === 2 && <Brikke key="r2" tekst="Varme hus, fabrikker som går" />}
                {modus === 'ror' && beat === 3 && <Brikke key="r3" tekst="Handel skaper fred?" farge="mork" />}
                {modus === 'kran' && beat === 0 && <Brikke key="k0" tekst="Kranen eies av Kreml" farge="rod" />}
                {modus === 'kran' && beat === 1 && <Brikke key="k1" tekst="Gjør som Kreml vil: billig gass" />}
                {modus === 'kran' && beat === 2 && <Brikke key="k2" tekst="Protesterer: kranen skrus igjen" farge="rod" />}
                {modus === 'kran' && beat === 3 && <Brikke key="k3" tekst="Midt på vinteren" farge="mork" />}
            </AnimatePresence>
        </div>
    );
}
