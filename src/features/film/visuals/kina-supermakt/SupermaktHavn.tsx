import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Kina sett ovenfra: havna ved sjøen, fabrikkene bak, byen, landsbygda og kraftverkene.
 * «havn»: kranene laster et containerskip, som til slutt seiler ut i verden.
 * «by»: landsbyene tømmes, byen vokser i høyden, og høyhastighetstoget suser forbi.
 * «energi»: demningen, vindmøllene og solcellene reiser seg én etter én.
 */

type Modus = 'havn' | 'by' | 'energi';

const KRANER = [-14, 0, 14];
const SKIP_N = 72;
const GARD_N = 90;
const HUS_N = 40;
const HUS_IGJEN = 19; // 35 av 75: litt under halvparten blir igjen
const TÅRN_N = 64;
const PANEL_N = 48;
const MØLLER = [-6, 6, 18, 30, 42, 54, 66];
const BEHOLDER_FARGER = ['#dc2626', '#2563eb', '#f59e0b', '#0d9488', '#7c3aed', '#ea580c'];

function kamera(modus: Modus, beat: number, t: number) {
    if (modus === 'havn') {
        switch (beat) {
            case 0:
                return { pos: v(30 - t * 0.4, 14, 34), se: v(0, 5, 8) };
            case 1:
                return { pos: v(10, 11, 24), se: v(0, 3, 10) };
            case 2:
                return { pos: v(-40, 44, 62), se: v(0, 0, -16) };
            default:
                return { pos: v(56 + t * 0.6, 20, 58), se: v(26, 2, 22) };
        }
    }
    if (modus === 'by') {
        switch (beat) {
            case 0:
                return { pos: v(-78, 24, 8), se: v(-54, 0, -40) };
            case 1:
                return { pos: v(-74 + t * 0.3, 30, 4), se: v(-54, 0, -42) };
            case 2:
                return { pos: v(-20, 48, 18), se: v(-14, 0, -48) };
            case 3:
                return { pos: v(62, 16, -8), se: v(0, 7, -40) };
            default:
                return { pos: v(0, 72, 56 + t * 0.4), se: v(-6, 0, -44) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-10, 64, 58), se: v(0, 0, -44) };
        case 1:
            return { pos: v(79, 20, -48), se: v(79, 7, -86) };
        case 2:
            return { pos: v(48, 24, -26), se: v(32, 6, -84) };
        default:
            return { pos: v(-20, 60, 14), se: v(40, 0, -70) };
    }
}

/** Mål for hver del av landet, ut fra modus og beat. */
function mål(modus: Modus, beat: number) {
    const by =
        modus === 'by' ? [0.12, 0.15, 0.7, 1, 1][Math.min(beat, 4)] : 1;
    const hus = modus === 'by' && beat < 2 ? HUS_N : HUS_IGJEN;
    const tog = modus !== 'by' || beat >= 3;
    const fyll = modus === 'havn' ? [0.25, 0.65, 1, 1][Math.min(beat, 3)] : 1;
    const seiler = modus === 'havn' && beat >= 3;
    const demning = modus === 'energi' ? (beat >= 1 ? 1 : 0) : 0;
    const vind = modus === 'energi' && beat >= 2 ? 1 : 0;
    return { by, hus, tog, fyll, seiler, demning, vind };
}

function Land() {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -65]}>
                <planeGeometry args={[220, 130]} />
                <meshStandardMaterial color="#a3b18a" emissive="#4d5a35" emissiveIntensity={0.25} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 60]}>
                <planeGeometry args={[400, 120]} />
                <meshStandardMaterial color="#3b82c4" emissive="#1e4f80" emissiveIntensity={0.45} />
            </mesh>
            {/* Kaia */}
            <mesh position={[0, 0.3, 2]}>
                <boxGeometry args={[80, 0.8, 6]} />
                <meshStandardMaterial color="#9ca3af" flatShading />
            </mesh>
            {/* Åser bak */}
            {[
                [-90, -118, 22],
                [-50, -124, 26],
                [-8, -122, 20],
                [30, -126, 28],
                [56, -86, 16],
                [104, -86, 18],
                [110, -110, 26],
            ].map(([x, z, h], i) => (
                <mesh key={i} position={[x, h / 2, z]}>
                    <coneGeometry args={[h * 0.9, h, 6]} />
                    <meshStandardMaterial color="#6b8f5a" flatShading />
                </mesh>
            ))}
        </>
    );
}

function Kran({ x }: { x: number }) {
    return (
        <group position={[x, 0, 3]}>
            {[-2.2, 2.2].map((dx) => (
                <mesh key={dx} position={[dx, 7, 0]}>
                    <boxGeometry args={[0.6, 14, 0.6]} />
                    <meshStandardMaterial color="#f97316" flatShading />
                </mesh>
            ))}
            <mesh position={[0, 14, 5]}>
                <boxGeometry args={[5.4, 0.8, 18]} />
                <meshStandardMaterial color="#ea580c" flatShading />
            </mesh>
            <mesh position={[0, 15, -2]}>
                <boxGeometry args={[3, 1.6, 3]} />
                <meshStandardMaterial color="#f8fafc" flatShading />
            </mesh>
        </group>
    );
}

/** Skipet med containere. Fylles opp per beat, og seiler ut på siste beat. */
function Skip({ fyll, seiler, playing }: { fyll: number; seiler: boolean; playing: boolean }) {
    const gruppe = useRef<THREE.Group>(null);
    const last = useRef<THREE.InstancedMesh>(null);
    const vist = useRef(fyll);
    const farger = useMemo(
        () =>
            Array.from({ length: SKIP_N }, (_, i) =>
                new THREE.Color(BEHOLDER_FARGER[Math.floor(frø(i + 3) * 6)])
            ),
        []
    );
    const m = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        vist.current = dt === 0 ? fyll : damp(vist.current, fyll, 1.6, dt);
        const g = gruppe.current;
        if (g) {
            const mx = seiler ? 40 : 0;
            const mz = seiler ? 16 : 0;
            g.position.x = damp(g.position.x, mx, 0.35, dt);
            g.position.z = damp(g.position.z, 12 + mz, 0.35, dt);
        }
        const l = last.current;
        if (!l) return;
        const synlige = Math.round(SKIP_N * vist.current);
        for (let i = 0; i < SKIP_N; i++) {
            const kol = i % 12;
            const rad = Math.floor(i / 12) % 3;
            const lag = Math.floor(i / 36);
            m.position.set(-15 + kol * 2.6, 2.6 + lag * 1.3, -2 + rad * 2);
            m.scale.setScalar(i < synlige ? 1 : 0.0001);
            m.updateMatrix();
            l.setMatrixAt(i, m.matrix);
            l.setColorAt(i, farger[i]);
        }
        l.instanceMatrix.needsUpdate = true;
        if (l.instanceColor) l.instanceColor.needsUpdate = true;
    });
    return (
        <group ref={gruppe} position={[0, 0, 12]}>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[40, 2.4, 7.6]} />
                <meshStandardMaterial color="#1e293b" flatShading />
            </mesh>
            <mesh position={[0, -0.2, 0]}>
                <boxGeometry args={[40.2, 0.8, 7.8]} />
                <meshStandardMaterial color="#b91c1c" flatShading />
            </mesh>
            <mesh position={[-18, 3.6, 0]}>
                <boxGeometry args={[3.4, 4, 6.4]} />
                <meshStandardMaterial color="#f8fafc" flatShading />
            </mesh>
            <instancedMesh ref={last} args={[undefined, undefined, SKIP_N]}>
                <boxGeometry args={[2.4, 1.2, 1.9]} />
                <meshStandardMaterial flatShading />
            </instancedMesh>
        </group>
    );
}

/** Containere stablet på kaia. */
function Lager() {
    const ref = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        const l = ref.current;
        if (!l || l.userData.ferdig) return;
        const m = new THREE.Object3D();
        for (let i = 0; i < GARD_N; i++) {
            const kol = i % 15;
            const rad = Math.floor(i / 15);
            const høyde = 1 + Math.floor(frø(i * 7) * 3);
            m.position.set(-28 + kol * 4, høyde * 0.65, -4 - rad * 2.4);
            m.scale.set(1, høyde, 1);
            m.updateMatrix();
            l.setMatrixAt(i, m.matrix);
            l.setColorAt(i, new THREE.Color(BEHOLDER_FARGER[Math.floor(frø(i + 40) * 6)]));
        }
        l.instanceMatrix.needsUpdate = true;
        if (l.instanceColor) l.instanceColor.needsUpdate = true;
        l.userData.ferdig = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, GARD_N]}>
            <boxGeometry args={[3.4, 1.3, 2]} />
            <meshStandardMaterial flatShading />
        </instancedMesh>
    );
}

function Fabrikker() {
    return (
        <>
            {[-26, -10, 6, 22].map((x, i) => (
                <group key={x} position={[x, 0, -26]}>
                    <mesh position={[0, 2.5, 0]}>
                        <boxGeometry args={[12, 5, 8]} />
                        <meshStandardMaterial color={i % 2 ? '#e5e7eb' : '#cbd5e1'} flatShading />
                    </mesh>
                    {[-4, 0, 4].map((dx) => (
                        <mesh key={dx} position={[dx, 5.6, 0]} rotation={[0, 0, Math.PI / 4]}>
                            <boxGeometry args={[2.2, 2.2, 7.8]} />
                            <meshStandardMaterial color="#64748b" flatShading />
                        </mesh>
                    ))}
                    <mesh position={[5, 6, 3]}>
                        <cylinderGeometry args={[0.6, 0.8, 8, 8]} />
                        <meshStandardMaterial color="#78716c" flatShading />
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** Skyskrapere som vokser med «by». */
function Byen({ by, playing }: { by: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const vist = useRef(-1);
    const m = useMemo(() => new THREE.Object3D(), []);
    const tårn = useMemo(
        () =>
            Array.from({ length: TÅRN_N }, (_, i) => {
                const kol = i % 8;
                const rad = Math.floor(i / 8);
                const midt = 1 - Math.hypot(kol - 3.5, rad - 3.5) / 5;
                return {
                    x: -30 + kol * 7 + (frø(i) - 0.5) * 2,
                    z: -42 - rad * 4,
                    h: 6 + midt * 26 + frø(i + 9) * 8,
                    c: new THREE.Color(['#cbd5e1', '#94a3b8', '#bae6fd', '#e2e8f0'][i % 4]),
                };
            }),
        []
    );
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        vist.current = vist.current < 0 || dt === 0 ? by : damp(vist.current, by, 1.1, dt);
        const l = ref.current;
        if (!l) return;
        tårn.forEach((t, i) => {
            const h = Math.max(0.6, t.h * vist.current);
            m.position.set(t.x, h / 2, t.z);
            m.scale.set(1, h, 1);
            m.updateMatrix();
            l.setMatrixAt(i, m.matrix);
            l.setColorAt(i, t.c);
        });
        l.instanceMatrix.needsUpdate = true;
        if (l.instanceColor) l.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, TÅRN_N]}>
            <boxGeometry args={[4, 1, 3]} />
            <meshStandardMaterial
                flatShading
                emissive="#475569"
                emissiveIntensity={0.2}
            />
        </instancedMesh>
    );
}

/** Små hus med åkre på landsbygda. Noen forsvinner når folk flytter. */
function Landsbygda({ antall, playing }: { antall: number; playing: boolean }) {
    const vegger = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const skala = useRef<number[]>([]);
    const m = useMemo(() => new THREE.Object3D(), []);
    const hus = useMemo(
        () =>
            Array.from({ length: HUS_N }, (_, i) => ({
                x: -78 + (i % 6) * 7 + frø(i + 2) * 3,
                z: -18 - Math.floor(i / 6) * 8 - frø(i + 5) * 3,
                // De som flytter, velges spredt utover, ikke rad for rad.
                rang: frø(i * 3 + 1),
            })),
        []
    );
    const rekkefølge = useMemo(
        () => hus.map((h, i) => ({ i, r: h.rang })).sort((a, b) => a.r - b.r).map((x) => x.i),
        [hus]
    );
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const plass = new Array(HUS_N).fill(0);
        rekkefølge.forEach((idx, n) => (plass[idx] = n < antall ? 1 : 0));
        hus.forEach((h, i) => {
            const før = skala.current[i] ?? plass[i];
            const s = dt === 0 ? plass[i] : damp(før, plass[i], 2.2, dt);
            skala.current[i] = s;
            const k = Math.max(0.0001, s);
            m.position.set(h.x, 0.9 * k, h.z);
            m.scale.setScalar(k);
            m.rotation.set(0, 0, 0);
            m.updateMatrix();
            vegger.current?.setMatrixAt(i, m.matrix);
            m.position.set(h.x, 2.3 * k, h.z);
            m.rotation.set(0, Math.PI / 4, 0);
            m.updateMatrix();
            tak.current?.setMatrixAt(i, m.matrix);
        });
        if (vegger.current) vegger.current.instanceMatrix.needsUpdate = true;
        if (tak.current) tak.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            {/* Åkrene */}
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[-62 + (i % 2) * 22, 0.05, -30 - Math.floor(i / 2) * 26]}
                >
                    <planeGeometry args={[18, 20]} />
                    <meshStandardMaterial color={i % 2 ? '#84cc16' : '#bef264'} />
                </mesh>
            ))}
            <instancedMesh ref={vegger} args={[undefined, undefined, HUS_N]}>
                <boxGeometry args={[2.4, 1.8, 2.2]} />
                <meshStandardMaterial color="#e7d8b8" flatShading />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, HUS_N]}>
                <coneGeometry args={[2.1, 1.2, 4]} />
                <meshStandardMaterial color="#9a3412" flatShading />
            </instancedMesh>
        </>
    );
}

/** Motorvei og høyhastighetstog som suser forbi byen. */
function Tog({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const tog = useRef<THREE.Group>(null);
    const vei = useRef<THREE.Group>(null);
    const x = useRef(-90);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const s = synlig ? 1 : 0.0001;
        if (vei.current) vei.current.scale.y = damp(vei.current.scale.y, s, 2, dt || 1);
        if (!tog.current) return;
        x.current += dt * 18;
        if (x.current > 100) x.current = -100;
        tog.current.position.x = x.current;
        tog.current.visible = synlig;
    });
    return (
        <>
            <group ref={vei} position={[0, 0, -35]}>
                {/* Togbanen på søyler */}
                <mesh position={[0, 2, 0]}>
                    <boxGeometry args={[200, 0.5, 1.6]} />
                    <meshStandardMaterial color="#94a3b8" flatShading />
                </mesh>
                {Array.from({ length: 9 }, (_, i) => (
                    <mesh key={i} position={[-80 + i * 20, 1, 0]}>
                        <boxGeometry args={[0.6, 2, 0.6]} />
                        <meshStandardMaterial color="#64748b" />
                    </mesh>
                ))}
                {/* Motorveien */}
                <mesh position={[0, 0.08, 4]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[200, 3.6]} />
                    <meshStandardMaterial color="#334155" />
                </mesh>
            </group>
            <group ref={tog} position={[-90, 2.9, -35]}>
                {[0, 1, 2].map((i) => (
                    <mesh key={i} position={[-i * 5.4, 0, 0]}>
                        <boxGeometry args={[5, 1.3, 1.4]} />
                        <meshStandardMaterial color="#f8fafc" emissive="#94a3b8" emissiveIntensity={0.3} flatShading />
                    </mesh>
                ))}
                <mesh position={[3.1, -0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.7, 1.6, 6]} />
                    <meshStandardMaterial color="#f8fafc" flatShading />
                </mesh>
                <mesh position={[-5, 0.15, 0.72]}>
                    <boxGeometry args={[15, 0.25, 0.05]} />
                    <meshStandardMaterial color="#dc2626" />
                </mesh>
            </group>
        </>
    );
}

/** Demning med vannmagasin og elv ut til havet. */
function Demning({ verdi, playing }: { verdi: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const elv = useRef<THREE.Mesh>(null);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const g = ref.current;
        if (g) g.scale.y = Math.max(0.0001, damp(g.scale.y, verdi, 1.6, dt || 1));
        if (elv.current) {
            const mat = elv.current.material as THREE.MeshStandardMaterial;
            mat.opacity = damp(mat.opacity, verdi, 1.4, dt || 1);
        }
    });
    return (
        <>
            <group ref={ref} position={[79, 0, -84]} scale={[1, 0.0001, 1]}>
                <mesh position={[0, 7, 0]}>
                    <boxGeometry args={[18, 14, 3]} />
                    <meshStandardMaterial color="#d6d3d1" flatShading />
                </mesh>
                <mesh position={[0, 12, -12]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[22, 20]} />
                    <meshStandardMaterial color="#2f7fbf" emissive="#1e4f80" emissiveIntensity={0.4} />
                </mesh>
                {[-5, 0, 5].map((dx) => (
                    <mesh key={dx} position={[dx, 3, 1.8]}>
                        <boxGeometry args={[2.2, 6, 0.6]} />
                        <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" emissiveIntensity={0.5} />
                    </mesh>
                ))}
            </group>
            <mesh ref={elv} rotation={[-Math.PI / 2, 0, 0]} position={[79, 0.06, -41]}>
                <planeGeometry args={[4, 82]} />
                <meshStandardMaterial
                    color="#3b82c4"
                    emissive="#1e4f80"
                    emissiveIntensity={0.4}
                    transparent
                    opacity={0}
                />
            </mesh>
        </>
    );
}

function Mølle({ x, verdi, playing }: { x: number; verdi: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const rotor = useRef<THREE.Group>(null);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (ref.current)
            ref.current.scale.setScalar(Math.max(0.0001, damp(ref.current.scale.x, verdi, 1.4, dt || 1)));
        if (rotor.current) rotor.current.rotation.z += dt * 1.6;
    });
    return (
        <group ref={ref} position={[x, 0, -98]} scale={0.0001}>
            <mesh position={[0, 8, 0]}>
                <cylinderGeometry args={[0.3, 0.55, 16, 8]} />
                <meshStandardMaterial color="#f8fafc" flatShading />
            </mesh>
            <mesh position={[0, 16, 0.6]}>
                <boxGeometry args={[1, 1, 2]} />
                <meshStandardMaterial color="#f1f5f9" flatShading />
            </mesh>
            <group ref={rotor} position={[0, 16, 1.7]} rotation={[0, 0, frø(x) * 3]}>
                {[0, 1, 2].map((i) => (
                    <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} position={[0, 0, 0]}>
                        <boxGeometry args={[0.5, 7, 0.15]} />
                        <meshStandardMaterial color="#ffffff" flatShading />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

function Solceller({ verdi, playing }: { verdi: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const vist = useRef(0);
    const m = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        vist.current = dt === 0 ? verdi : damp(vist.current, verdi, 1.2, dt);
        const l = ref.current;
        if (!l) return;
        for (let i = 0; i < PANEL_N; i++) {
            const kol = i % 8;
            const rad = Math.floor(i / 8);
            // Panelene dukker opp rad for rad.
            const s = THREE.MathUtils.clamp(vist.current * 6 - rad, 0.0001, 1);
            m.position.set(36 + kol * 3, 0.9 * s, -46 - rad * 3.2);
            m.rotation.set(-0.6, 0, 0);
            m.scale.setScalar(s);
            m.updateMatrix();
            l.setMatrixAt(i, m.matrix);
        }
        l.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, PANEL_N]}>
            <boxGeometry args={[2.6, 0.15, 2]} />
            <meshStandardMaterial color="#1e3a8a" emissive="#1d4ed8" emissiveIntensity={0.35} />
        </instancedMesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kamera(modus, b, t), beat, playing);
    const m = mål(modus, beat);
    return (
        <>
            <color attach="background" args={['#cfe6f5']} />
            <fog attach="fog" args={['#cfe6f5', 120, 320]} />
            <hemisphereLight args={['#f8fafc', '#6b7f4f', 0.9]} />
            <directionalLight position={[40, 60, 30]} intensity={1.4} />
            <Land />
            {KRANER.map((x) => (
                <Kran key={x} x={x} />
            ))}
            <Skip fyll={m.fyll} seiler={m.seiler} playing={playing} />
            <Lager />
            <Fabrikker />
            <Byen by={m.by} playing={playing} />
            <Landsbygda antall={m.hus} playing={playing} />
            <Tog synlig={m.tog} playing={playing} />
            <Demning verdi={m.demning} playing={playing} />
            {MØLLER.map((x) => (
                <Mølle key={x} x={x} verdi={m.vind} playing={playing} />
            ))}
            <Solceller verdi={m.vind} playing={playing} />
        </>
    );
}

export function SupermaktHavn({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'havn';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 700, position: [30, 14, 34] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {modus === 'havn' && <HavnTekst key={`h${beat}`} beat={beat} />}
                {modus === 'by' && <ByTekst key={`b${Math.min(beat, 4)}`} beat={beat} />}
            </AnimatePresence>
            {modus === 'energi' && <Energikort beat={beat} />}
        </div>
    );
}

function Overskrift({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[6%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl font-black text-slate-900 whitespace-nowrap"
        >
            {children}
        </motion.div>
    );
}

function HavnTekst({ beat }: { beat: number }) {
    if (beat === 0) return <Overskrift>En havn i Kina</Overskrift>;
    if (beat === 1)
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-[6%] left-1/2 -translate-x-1/2 flex gap-3"
            >
                {['mobiltelefoner', 'klær', 'møbler'].map((t, i) => (
                    <motion.div
                        key={t}
                        initial={{ opacity: 0, y: -14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.6 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 shadow-xl text-3xl font-black text-slate-800"
                    >
                        {t}
                    </motion.div>
                ))}
            </motion.div>
        );
    if (beat === 2) return <Tredjedel />;
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[6%] left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl font-black whitespace-nowrap"
        >
            <span className="text-slate-400 line-through decoration-4">billige T-skjorter</span>
            <span className="text-slate-400">→</span>
            <span className="text-red-700">supermakt</span>
        </motion.div>
    );
}

/** Kakediagram: en tredjedel av verdens varer. */
function Tredjedel() {
    const r = 70;
    const omkrets = 2 * Math.PI * r;
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[6%] left-[4%] flex items-center gap-5 px-6 py-4 rounded-2xl bg-white/95 shadow-xl"
        >
            <svg viewBox="0 0 180 180" className="w-36 h-36 -rotate-90">
                <circle cx={90} cy={90} r={r} fill="none" stroke="#cbd5e1" strokeWidth={36} />
                <motion.circle
                    cx={90}
                    cy={90}
                    r={r}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth={36}
                    strokeDasharray={omkrets}
                    initial={{ strokeDashoffset: omkrets }}
                    animate={{ strokeDashoffset: omkrets * (2 / 3) }}
                    transition={{ duration: 1.4, delay: 0.4, ease: 'easeOut' }}
                />
            </svg>
            <div>
                <div className="font-display font-black text-5xl text-red-700">1/3</div>
                <div className="text-2xl font-semibold text-slate-600 max-w-[15rem]">
                    av alle varer i verden lages i Kina
                </div>
            </div>
        </motion.div>
    );
}

function ByTekst({ beat }: { beat: number }) {
    if (beat === 0) return <Overskrift>Fra landsbygda til byene</Overskrift>;
    if (beat === 1) return <Andel år={1990} prosent={75} />;
    if (beat === 2) return <Andel år={2023} prosent={35} />;
    if (beat === 3)
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-[6%] left-1/2 -translate-x-1/2 flex gap-3"
            >
                {['skyskrapere', 'motorveier', 'høyhastighetstog'].map((t, i) => (
                    <motion.div
                        key={t}
                        initial={{ opacity: 0, y: -14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.7 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 shadow-xl text-3xl font-black text-slate-800"
                    >
                        {t}
                    </motion.div>
                ))}
            </motion.div>
        );
    return <Overskrift>Bedre mat. Bedre skole.</Overskrift>;
}

/** 20 personer: de grønne bor på landet. */
function Andel({ år, prosent }: { år: number; prosent: number }) {
    const grønne = Math.round((prosent / 100) * 20);
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[6%] left-[4%] px-6 py-4 rounded-2xl bg-white/95 shadow-xl"
        >
            <div className="font-display font-black text-3xl text-slate-900">
                {år}: <span className="text-lime-700">{prosent} %</span> bor på landet
            </div>
            <div className="mt-3 grid grid-cols-10 gap-1.5">
                {Array.from({ length: 20 }, (_, i) => (
                    <motion.svg
                        key={i}
                        viewBox="0 0 20 30"
                        className="w-7 h-10"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.05 }}
                    >
                        <circle cx={10} cy={7} r={6} fill={i < grønne ? '#65a30d' : '#64748b'} />
                        <path
                            d="M2 30 Q2 15 10 15 Q18 15 18 30 Z"
                            fill={i < grønne ? '#65a30d' : '#64748b'}
                        />
                    </motion.svg>
                ))}
            </div>
            <div className="mt-2 flex gap-5 text-xl font-semibold">
                <span className="text-lime-700">● på landet</span>
                <span className="text-slate-500">● i byen</span>
            </div>
        </motion.div>
    );
}

function Energikort({ beat }: { beat: number }) {
    const kort = [
        { navn: 'Vannkraft', fra: 1, farge: 'text-sky-700' },
        { navn: 'Vindkraft', fra: 2, farge: 'text-teal-700' },
        { navn: 'Solkraft', fra: 2, farge: 'text-amber-600' },
    ];
    return (
        <>
            <AnimatePresence>
                {beat === 0 && <Overskrift key="strom">Fabrikker og byer trenger strøm</Overskrift>}
            </AnimatePresence>
            <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 flex gap-4">
                <AnimatePresence>
                    {kort
                        .filter((k) => beat >= k.fra)
                        .map((k) => (
                            <motion.div
                                key={k.navn}
                                layout
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                                className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center min-w-[13rem]"
                            >
                                <div className={`font-display font-black text-3xl ${k.farge}`}>
                                    {k.navn}
                                </div>
                                <div className="text-2xl font-bold text-slate-700">
                                    {beat >= 3 ? 'ca. 30 % av verden' : 'Kina er størst'}
                                </div>
                            </motion.div>
                        ))}
                </AnimatePresence>
            </div>
        </>
    );
}
